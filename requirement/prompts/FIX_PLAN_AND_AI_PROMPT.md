# KẾ HOẠCH SỬA LỖI, THIẾT KẾ LOGIC CÒN THIẾU VÀ PROMPT CHO AI — D:\RPG

> Tài liệu này đi kèm `CODE_REQUIREMENT_AUDIT_MASTER.md`. Nó trả lời hai câu hỏi:
> **(A)** Nên cải thiện logic như thế nào cho các lỗi đã tìm được — và quan trọng hơn, chặn cả *lớp* lỗi sinh ra chúng?
> **(B)** Prompt nào để một AI đọc hiểu, **tự thiết kế logic còn thiếu** và **tự sửa lỗi** một cách an toàn?

- **Trạng thái:** tài liệu đề xuất. Chưa sửa code nào. Cần xác nhận trước khi triển khai.
- **Phạm vi:** toàn bộ phát hiện trong báo cáo gộp (`G/M/C/D/E` của đợt 1, `N1–N190` của đợt 2–3, register `B.1–B.11`).

---

# PHẦN A — CHẨN ĐOÁN GỐC: 10 MẪU LỖI HỆ THỐNG

Điểm chung của 190+ phát hiện: **chúng không phải lỗi ngẫu nhiên, chúng là hệ quả của 10 mẫu thiết kế lặp lại.** Sửa từng lỗi mà không chặn mẫu thì lỗi mới sẽ tái sinh. Dưới đây là từng mẫu, bằng chứng, và cách chặn ở tầng kiến trúc.

## Mẫu 1 — Bất biến chỉ tồn tại trong test, không tồn tại ở runtime

**Bằng chứng:** `G1`, `C8.1`, `N113`, `D7.1` — ~40 validator (map, companion, reward policy, replay envelope, action priority…) được định nghĩa trong `js/expansion.js` nhưng **0 call site** trong `js/`; chỉ `tools/*.js` gọi. Boundary thật (`deserialize` `expansion.js:4257`, `updateDerived` `:4273`) không gọi.

**Vì sao nguy hiểm:** đây là "lỗi meta" — nó làm mọi bất biến khác trở thành trang trí. Save hỏng lọt qua, rồi mọi thứ downstream sai theo.

**Cách chặn:**
```js
// js/expansion.js
const INVARIANT_PHASES = { LOAD: "load", POST_ACTION: "post_action", PRE_SAVE: "pre_save" };
const CHECKS_BY_PHASE = {
  load:        ["character","mapCoordinates","companion","specialPhysique","profession","relationship","rewardLedger"],
  post_action: ["character","mapCoordinates","companion","cache","actionPriority"],
  pre_save:    ["all"]
};
function runInvariants(state, phase, mode = "repair") {
  const errors = [];
  CHECKS_BY_PHASE[phase].forEach((check) => collectCheck(check, state, errors));
  if (mode === "repair") { // sửa tối thiểu, deterministic, ghi migration note
    errors.forEach((e) => repairInvariant(state, e));
  }
  state.runtimeDiagnostics.invariants = { phase, errors, mode, day: absoluteDay(state) };
  return { ok: errors.length === 0, errors };
}
```
Gọi tại: `deserialize()` (phase `load`, mode `repair`), `submitActionId()` sau commit (phase `post_action`, mode `repair`, chỉ *đếm* để không phá gameplay), `serialize()` (phase `pre_save`, mode `repair` + ghi note).

**Quy tắc thiết kế:** validator phải **thuần dữ liệu, deterministic, và không đo thời gian** (xem Mẫu 2). Repair phải *giảm thiểu* — chỉ chuẩn hoá field sai về default hợp lệ, **không** xoá dữ liệu người chơi (bài học từ `N155`).

**Gate mới:** script tĩnh phát hiện "validator định nghĩa nhưng không được gọi từ `js/`" → fail build. Đây là gate sẽ bắt ngay `validateExpansionState` hôm nay.

---

## Mẫu 2 — Invariant phụ thuộc thời gian chạy tường

**Bằng chứng:** `G2`/`G3`/`A2` — `expansion.js:2334` `averageMs = totalMs / calls`, `:2371` `averageMs > budgets.mapInfluenceAverageMs * 4` (=16ms). Với `calls === 1` trên state mới, **một mẫu quyết định** → cùng state cho `valid:false` (20ms) ở lần nguội và `valid:true` (13ms) ở lần ấm. Kết quả: 5/13 test suite đỏ.

**Vì sao nguy hiểm:** một invariant *về tính đúng đắn* trở thành nguồn non-determinism. Nếu nối vào runtime (Mẫu 1) thì save hợp lệ bị từ chối ngẫu nhiên.

**Cách chặn:**
1. **Tách hoàn toàn hai loại kiểm tra:** `correctness` (thuần dữ liệu, deterministic, được phép chặn) vs `budget` (đo hiệu năng, **chỉ warn**, không bao giờ nằm trong `valid`).
2. `validateExpansionState` chỉ gọi `correctness`. Đổi `validatePerformanceBudget` thành `reportPerformanceBudget` trả `{ ok, warnings }`; caller quyết định.
3. Nếu vẫn muốn chặn theo hiệu năng: dùng **đại lượng đếm được** thay vì ms (`calls`, `cacheHitRate`, `nodesVisited`), và so với ngân sách số học — ví dụ `calls > nodes * 3` — hoàn toàn deterministic.
4. Bỏ `performance.now()` khỏi đường tính điểm; chuyển sang metric chỉ để log/so sánh giữa các lần chạy trong cùng process.

---

## Mẫu 3 — Hai nguồn sự thật cho cùng một dữ liệu

**Bằng chứng:** `G9`/`N89` (hai bảng grade: `engine.js:454` vs `expansion.js:16`); `M18`/`M31`/`C9` (`player.pathId` vs `pathState.primaryPathId`); `N36` (`pendingSearch` vs `pendingExploration`); `C13.1` (NPC memory cap **20** ở `expansion.js:1935` nhưng **10** ở `:2980` và validator chặn `>10` ở `:2897`); `N188` (`weatherSource` chỉ được `setWeather` ghi, tick không ghi); `N148` (`completed` vs `gatesPassed`).

**Cách chặn:**
1. **Một module hằng số duy nhất** `js/constants.js` export `GRADE_TO_TIER`, `RANK_CAPS`, `RETENTION`, `LOG_BANNED_WORDS`, `WAR_*`, `RUMOR_*`… `engine.js` và `expansion.js` **import** từ đó, cấm khai báo lại. Gate tĩnh: fail nếu identifier đã có trong `constants.js` mà còn được khai báo lại ở file khác.
2. **Một accessor duy nhất** cho mỗi dữ liệu có projection: `pathIdOf(state)` (đọc `pathState`, ghi cả hai), `pendingDiscoveryAt(state)` (đã có — chỉ cần dùng nó ở **mọi** call site, sửa `N36`), `retentionOf(kind)` trả về từ một bảng.
3. **Test nhất quán:** một test khẳng định `Object.entries(RETENTION)` khớp với mọi cap hard-code (grep-based), và `GRADE_TO_TIER` không bị định nghĩa hai lần.

---

## Mẫu 4 — Trừ tài nguyên trước khi xác thực (không atomic)

**Bằng chứng:** `C5.1`/`G12` (`state.meta.turn += 1` **rồi** mới resolve, `engine.js:5899-5902`), `N167` (`sendMail` trừ Linh Thạch rồi mới `scheduleWorldTask`), `N59`/`N184` (`craftArtifact` trừ stamina rồi mới tạo output, hoàn không đủ), `C5.2` (đấu giá kiểm khả năng chi trả **không** tính khoản hoàn), `C7.4` (`giftNpc` trừ item trước rồi bỏ qua kết quả `recordRelationshipEvent`).

**Cách chặn — một helper duy nhất:**
```js
// Trả về { success, reason, data, receipt } — commit chỉ xảy ra nếu toàn bộ validate pass.
function transact(state, { validate, cost, apply, key }) {
  if (key && state.actionLedger?.[key]) return { success: true, duplicate: true, receipt: state.actionLedger[key] };
  const blockers = validate(state);                       // thuần, không mutate
  if (blockers.length) return { success: false, reason: blockers[0].playerText, blockers };
  const snapshot = captureCosts(state, cost);             // chỉ ĐỌC, chưa trừ
  if (!snapshot.affordable) return { success: false, reason: "Thiếu tài nguyên.", blockers: [{ code: "RESOURCE_SHORTAGE" }] };
  commitCosts(state, snapshot);                           // trừ một lần
  try {
    const data = apply(state);                            // mutate phần còn lại
    const receipt = { key, day: absoluteDay(state), ...snapshot.delta };
    if (key) state.actionLedger[key] = receipt;
    return { success: true, data, receipt };
  } catch (error) {
    refundCosts(state, snapshot);                         // rollback đầy đủ, kể cả stamina
    return { success: false, reason: "Hành động bị gián đoạn.", error: String(error?.message || error) };
  }
}
```
**Quy tắc:** `turn += 1` phải nằm **trong** `apply`, hoặc chỉ tăng sau khi `transact` trả `success`. Mọi hàm mutation hiện có được chuyển dần sang helper này.

---

## Mẫu 5 — Resolver ghi vào catalog tĩnh

**Bằng chứng:** `G8`/`C4` — `engine.js:2511` (`D().ITEMS[id] = …`, **cùng object reference**), `:2600`, `:4309` (`D().QUESTS[id] = …`), `expansion.js:501` (chạy **mỗi** `ensure()`), `:502-507` (gắn `equipmentSetId` từ token tên), `N58` (`awakenItem` ghi `item.phy += 2` vào chính object đó).

**Vì sao nguy hiểm:** save này pollute save khác trong cùng process; và mọi thứ "deterministic" trở thành phụ thuộc thứ tự load.

**Cách chặn:**
1. **Copy-on-read bắt buộc:** mọi accessor catalog trả **bản sao** (`structuredClone` hoặc deep-copy). `runtimeLocationPool()` (`engine.js:20-30`) và `techniqueCatalog()` (`:1459-1532`) đã làm đúng — áp cùng pattern cho `ITEMS`, `QUESTS`.
2. **Freeze trong dev:** nếu `NODE_ENV !== "production"`, `Object.freeze` sâu catalog. Mọi ghi sẽ throw ngay tại chỗ.
3. **Runtime state riêng:** item procedural / quest động **chỉ** sống trong `state.generatedItems` / `state.runtimeQuests`. Resolver **chỉ đọc** catalog tĩnh + **đọc** runtime state.
4. **Gate tĩnh:** fail build nếu thấy pattern `D()\.\w+\[` hoặc `GameData\.\w+\[` ở **vế trái** phép gán trong `js/`.

---

## Mẫu 6 — Entropy rò ra ngoài ranh giới seed

**Bằng chứng:** `G7`/`A7`/`C1` — `webgame/app.js:12`, `gemini-code-….js:91,114`, `character_generator.js:30`, và `replayRandom` **fail-open** về `Math.random()` (`engine.js:52-57`); `N154` (`Date.now()` cho event id), `C2.1` (`chuyenSinhCooldownUntil` theo time thực), `N65` (`refreshMarket` gate theo ms), `N71`. Gate `verify_random_boundaries.js` chỉ quét **7 file cứng** → `webgame/`, `index.offline.html`, `data/*`, `tools/*` thoát (`N115–N119`).

**Cách chặn:**
1. **Một hàm RNG duy nhất** `rng(state, scope, ...parts)` với seed = `hash(worldSeed | scope | entityId | absoluteDay | ordinal)`. Sửa `replayRandom` để **throw** khi thiếu `GameExpansion.worldRandom` thay vì fallback (fail-closed).
2. **Khoá seed phải đa dạng:** thêm `source`/`entityId`/`ordinal` vào mọi khoá (`C7.1`), và sửa `replayRandom` dùng **day ordinal** thay vì `currentDay` (`C1.5`, `engine.js:55`).
3. **Sinh item dùng counter tăng dần thật** (`N55`): truyền `() => rng(state, "itemgen", sequence, ++drawIndex)` — mỗi lần gọi RNG tăng `drawIndex`.
4. **Gate quét toàn bộ** `.js` + `index.offline.html` (không dùng danh sách cứng).
5. **Cấm thời gian thực cho gameplay:** allow-list `Date.now()` chỉ cho metadata (`createdAt`, `updatedAt`, `lastRealTimestamp`); mọi cooldown/refresh dùng `absoluteDay`/`meta.turn`.

---

## Mẫu 7 — Khoá định danh thiếu hoặc không chuẩn hoá

**Bằng chứng:** `N32` (khoá thưởng hidden realm `"<cycle>:main"` **không có realmId** → realm thứ hai mất thưởng), `M74`, `N38` (findings không có `findingId`), `N46` (create opportunity trả record cũ bất kể status), `N165` (`objectives: []`), `N66`.

**Cách chặn:**
```js
// js/keys.js — MỘT hàm duy nhất, mọi ledger dùng chung.
const KEY = {
  reward:  (sourceId, ...parts) => [sourceId, ...parts.filter((p) => p != null)].join(":"),
  action:  (scope, entityId, day, ordinal) => `${scope}:${entityId}:${day}:${ordinal}`,
  finding: (session, nodeId, index) => `finding:${session}:${nodeId}:${index}`
};
```
Sửa `claimHiddenRealmCore` thành `KEY.reward("hidden_realm", realmId, cycleIndex, "main")`. Thêm test: **hai realm khác nhau ở cùng cycle phải đều claim được** (đây là test sẽ bắt `N32` ngay).

---

## Mẫu 8 — Pipeline văn bản tự phá dữ liệu hợp lệ

**Bằng chứng:** `N144` (map `—`/`…` sang byte C1 rồi strip → **mất dấu câu hợp lệ**; `engine.js:5280-5281`), `N145` (từ `phiên` **thoả** danh sách cấm → cả câu bị thay bằng fallback; `engine.js:5260,5319,5348`), `N141` (echo lọt vì `canonicalLogType` không có alias `action`), `N149` (`✦` bị strip nhưng `◇` thì không).

**Cách chặn:**
1. **Repair chỉ khi có marker thật.** Chỉ chạy `repairMojibakeText` khi chuỗi khớp pattern mojibake (`/\u00c3|\u00c2|\u00c4|\u00c5|\u00c6|\u00e1\u00bb|\u00e1\u00ba|â |ðŸ|\uFFFD/`). Chuỗi sạch **không đi qua** repair.
2. **Bỏ mapping cp1252 → C1.** Nếu buộc phải decode, dùng `TextDecoder("windows-1252")` rồi **khôi phục** punctuation về Unicode trước khi strip control char.
3. **Sanitize theo token, không thay cả câu.** `phiên`/`index` là tiếng Việt/tiếng Anh thường — phải **viết lại cục bộ**, không nuke. Sửa `engine.js:5319` để strip/đổi tại chỗ, và chỉ fallback khi sau khi strip vẫn còn vi phạm.
4. **Danh sách cấm dùng chung** giữa runtime và tool (`constants.js` → `LOG_BANNED_WORDS`). Tool-lint phải bằng runtime-lint.
5. **Alias log type đầy đủ:** `action`/`command` → `COMMAND_ECHO` + `debugOnly: true` (`N141`).

---

## Mẫu 9 — Test rỗng, test tự thoả mãn, test mã hoá kỳ vọng sai

**Bằng chứng:** `N90–N100` (11 assertion không thể fail), `N101–N114` (14 bất biến không có test), `N119` (gate được trích dẫn nhưng không chạy), `N120` (4 nơi test **mã hoá ngược** canonical về di chuyển), `N152`/`N153` (audit producer không thấy đường rò; matrix dùng fixture mojibake).

**Cách chặn:**
1. **Gate chống test rỗng:** mọi audit dạng "duyệt N phần tử" phải assert **cận dưới** (`assert(candidates.length >= EXPECTED_MIN)`).
2. **Gate chống assertion vô nghĩa:** lint tĩnh trên `tools/` — cấm `assert(x.length >= 0)`, `assert(typeof x === "…")` trên biến không được gán lại, và `assert(!f(x).ok === false)`.
3. **Test đối chiếu requirement:** mỗi bất biến canonical phải có ≥1 test; gate so danh sách bất biến (trong `constants.js` hoặc một JSON) với tên test đã có → fail nếu thiếu.
4. **Sửa test mã hoá sai** (`N120`) **cùng lúc** với sửa hành vi; và đổi assertion thành dạng hai chiều (kiểm cả "phải có" lẫn "không được có").
5. **Fixture phải là chuỗi producer thật**, không phải literal bỏ dấu (`N153`).

---

## Mẫu 10 — Tài liệu tự tuyên bố "đã xong" mà không có bằng chứng

**Bằng chứng:** `E1` (FATE Phase 3 đánh dấu "CHƯA CÓ" ở giữa file nhưng "đã code" ở cuối), `B.11` (9-IMPLEMENTATION_GAPS tự liệt 4 gap P0 mà **cả 4 vẫn mở** sau khi đo), `D1.8`/`N101–N104` (requirement có acceptance test nhưng không test nào tồn tại).

**Cách chặn — gate "requirement symbol parity":**
```js
// tools/verify_requirement_symbol_parity.js
// 1) parse mọi identifier dạng `code` trong các mục "Runtime contract"/"API" của 18 file canonical
// 2) grep js/ cho từng identifier
// 3) xuất 3 nhóm: CODED / MISSING / THIN(<=2)
// 4) fail nếu MISSING tăng so với baseline (baseline.json)
```
Script này hôm nay sẽ báo ngay **82 MISSING** — biến `SYSTEM_LOGIC_CATALOG` từ "tài liệu tham khảo" thành **hợp đồng có thể kiểm chứng**. Kèm theo: mọi mục "Chưa hoàn thiện" phải có `status: open|closed` + test name; gate fail nếu `open` mà không có test tương ứng.

---

# PHẦN B — THIẾT KẾ SỬA CỤ THỂ CHO P0

Mỗi mục: hiện trạng → thiết kế → cách kiểm chứng. Kèm "bẫy" cần tránh.

## B1. Validator deterministic + được gọi thật
- **Hiện trạng:** `G1` + `G2`/`G3`. Hai lỗi này **phải sửa cùng nhau**, nếu không sẽ biến lỗi test thành lỗi save.
- **Thiết kế:** tách `correctness`/`budget` (Mẫu 2) trước, rồi mới nối `runInvariants(phase)` (Mẫu 1) vào `deserialize` (repair) và `pre_save` (repair). Ở `post_action` chỉ **đếm** (`mode:"observe"`), không repair — tránh phá gameplay giữa chừng.
- **Kiểm chứng:** 5 test suite đỏ chuyển xanh; thêm test "state mới tạo → `runInvariants(LOAD)` ok"; thêm test "state cố tình hỏng (`loyalty:101`) → LOAD repair về hợp lệ và **không** mất dữ liệu khác".
- **Bẫy:** đừng để repair xoá field người chơi (`N155`). Repair chỉ được chuẩn hoá về default hợp lệ.

## B2. Autosave
- **Hiện trạng:** `G4` — `if (!explicit || !state) return;`, ~50 call site gọi `saveGame()` là no-op.
- **Thiết kế:** tách `saveNow(reason)` (ghi thật) vs `scheduleSave(reason)` (debounce qua `requestIdleCallback`/timeout nhỏ, gộp trong ~1s). `saveGame(true)` = `saveNow`. Mọi call site hiện tại đổi sang `scheduleSave("turn")`.
- **Kiểm chứng:** test: sau 1 action, `localStorage` key thay đổi; sau N action liên tiếp, số lần ghi ≤ ceil(N/debounce).
- **Bẫy:** debounce phải **flush đồng bộ** trước `beforeunload`/`visibilitychange:hidden`, nếu không sẽ mất lượt cuối.

## B3. Save schema + migration
- **Hiện trạng:** `G13`/`A9` — `version:12`, `schema:"tu_vi_quy_di_final"`; `migrateV12ToV13` không tồn tại.
- **Thiết kế:** `SAVE_SCHEMA = "tu_vi_quy_di_canonical_v13"` trong `constants.js`; thêm `migrateV12ToV13(state)` (chỉ tạo field rỗng, **không** thưởng) và một bảng `MIGRATIONS = { 12: migrateV12ToV13 }` chạy theo chuỗi. `deserialize` đọc `payload.version` → chạy migration thiếu.
- **Kiểm chứng:** test round-trip: save v12 fixture → load → `version===13`, field mới có default, không mất dữ liệu; load lại lần hai là no-op.
- **Bẫy:** `meta.saveId` thiếu phải cấp deterministic (`expansion.js:457` đã đúng — dùng cùng pattern).

## B4. Catalogue bất biến
- **Hiện trạng:** `G8`/`C4`/`N58`.
- **Thiết kế:** (xem Mẫu 5). Di trú dần: `ITEMS` trước (vì `N58` đang ghi vào đó), rồi `QUESTS`.
- **Kiểm chứng:** test: sau khi tạo 5 item procedural + thức tỉnh 1 item, `Object.keys(GameData.ITEMS)` **không đổi**; hai state trong cùng process không thấy item của nhau.
- **Bẫy:** `Object.assign(D().ITEMS, state.generatedItems)` ở `engine.js:6311` phải bị gỡ cùng lúc, nếu không vẫn pollute.

## B5. Một nguồn sự thật cho grade
- **Hiện trạng:** `G9`/`N89` — hai bảng khác nhau (`huyen`=4 vs 3, `dia`=5 vs 4, `tien`=8 vs 6).
- **Thiết kế:** `constants.js` export `GRADE_TO_TIER` (8 bậc) + `GRADE_ALIAS = { pham:"phan", … }` cho dữ liệu cũ. `expansion.js` import thay vì tự khai. Sửa `expansion.js:3463` dùng alias rồi tra bảng chung.
- **Kiểm chứng:** test: `GRADE_TO_TIER` chỉ định nghĩa một lần (grep), và `fateTier(fate)` cho cùng kết quả từ cả hai module.
- **Bẫy:** giữ tương thích save — alias `pham→phan` là **bắt buộc**, không được bỏ.

## B6. Movement guard thống nhất
- **Hiện trạng:** `G6`/`C6`/`N33`/`N34` — 4 đường gán `state.locationId` trực tiếp; `confirmPendingDeparture` không xử `pendingMapEvent`.
- **Thiết kế:** **một** hàm duy nhất `relocate(state, toNodeId, { reason, confirmed })`:
```js
function relocate(state, toNodeId, opts) {
  const pending = pendingDepartures(state);          // exploration | mapEvent | opportunity
  if (pending.length && !opts.confirmed) return { success: false, reason: "Còn việc dở dang tại đây.", blockers: pending };
  if (opts.confirmed) abandonPendings(state, pending); // đánh dấu "lost"/"abandoned" cho TẤT CẢ, ghi history
  state.locationId = toNodeId;
  invalidatePendingsFor(state, toNodeId);              // guard: pending nào lệch node thì phải đã bị abandon
  return { success: true };
}
```
Mọi đường (`move`, `travelToSafeHub`, `hiddenRealmEnter`, `exitHiddenRealm`, world tick) **buộc** đi qua hàm này. Bỏ nhánh `act_exp_travel_*` chết (`C6.5`).
- **Kiểm chứng:** test: đặt `pendingMapEvent` → gọi `travelToSafeHub` → `pendingMapEvent.status === "abandoned"` (hiện là `"pending"`, đo được ở `T12`). Test tương tự cho realm enter/exit.
- **Bẫy:** `updateHiddenRealms` trong tick phải dùng `confirmed:true` **nhưng** ghi rõ lý do (`reason:"realm_closed"`) để không vi phạm "không dịch chuyển âm thầm".

## B7. Transaction cho `turn`
- **Hiện trạng:** `G12`/`C5.1`.
- **Thiết kế:** (Mẫu 4) — tăng `turn` **sau** khi resolver trả thành công; hoặc bọc toàn bộ trong `transact`. Bọc `expansion.js` bằng try/catch **ở tầng dispatcher** (không rải khắp nơi) để mọi throw đều rollback.
- **Kiểm chứng:** test: resolver ném lỗi → `meta.turn` **không** đổi, tài nguyên **không** đổi.
- **Bẫy:** `turn` được dùng trong khoá RNG/ledger — nếu tăng muộn thì khoá phải tính bằng giá trị **sau** khi tăng (hoặc truyền tường minh), nếu không sẽ lệch seed.

## B8. Narrative boundary
- **Hiện trạng:** `G10`/`G11`/`C12`/`N141`/`N144`/`N145`/`N151`.
- **Thiết kế:** (Mẫu 8) + **một cửa duy nhất**: `present(reasonOrEvent)` bắt buộc dùng cho mọi output người chơi thấy. Đường `alert(result.reason)` trong `main.js` (~30 chỗ) đổi thành `alert(playerFacingReason(result))`. `ERROR_NARRATIVE_MAP` **đầy đủ** (14 mã đang thiếu — danh sách ở `LT6`), có test **liệt kê mọi mã runtime rồi assert đều có map** (gate này bắt mọi mã thêm sau).
- **Kiểm chứng:** test tĩnh: quét `reason:`/`code:` trong `js/` → mọi mã phải có map hoặc nằm trong allow-list tường minh. Test động: `formatPlayerLogText` không chứa `[A-Z_]{4,}`, không chứa `—` bị mất.
- **Bẫy:** đừng thay cả câu khi vi phạm — phải sửa cục bộ (Mẫu 8 điểm 3).

## B9. Roll Fate
- **Hiện trạng:** `M1`/`M2`/`T8` — Mệnh Hung bị loại khỏi resolver (`engine.js:3286`), ô `tien` = `0.01` thay vì `0`.
- **Thiết kế:**
```js
// Bỏ hoàn toàn bộ lọc sign khỏi resolver. Sign là thuộc tính nội dung, không phải tiêu chí lọc.
if (rank < minimum || (cap && rank > cap)) return false;
// Bảng 9+ : tien phải = 0
// Gate Tiên: chỉ loại khi ĐÃ có chủ HOẶC nguồn không được phép trao Tiên.
if (grade === "tien" && (!allowUniqueTien || fateUniqueOwner(state))) return false;
```
Thêm `source` vào khoá roll (`"fate-roll-grade:" + level + ":" + source + ":" + ordinal`) để hai nguồn cùng lượt không ra cùng Mệnh (`C7.1`).
- **Kiểm chứng:** Monte-Carlo 20 000 roll cho mỗi bậc (1–2, 3–4, 5–6, 7–8, 9+) — sai số ≤1 điểm phần trăm so với bảng; **assert có ít nhất một Mệnh Hung** xuất hiện; assert `tien` xuất hiện **0** lần từ nguồn thường.
- **Bẫy:** `drawInitialFates` có tỷ lệ riêng (65/30/5) — **không** dùng chung resolver reward; đừng sửa nhầm.

## B10. `receiveFate` ghi đè kho
- **Hiện trạng:** `C7.2` — `engine.js:2305` ghi đè `fateInventory` khi kho đầy nếu không truyền `allowPending`; caller `:2007`, `:3243` không truyền.
- **Thiết kế:** bỏ nhánh "âm thầm thay thế". Mặc định **luôn** đưa vào `pendingFateRewards`; việc thay thế chỉ qua action tường minh `resolvePendingFateReward(state, replaceId)` (đã tồn tại ở `main.js:648`).
- **Kiểm chứng:** test: kho đầy 2/2, nhận Mệnh mới → `pendingFateRewards.length === 1`, `fateInventory` **không đổi**, không Mệnh nào bị xoá.

## B11. Khoá thưởng hidden realm
- **Hiện trạng:** `N32` — đo được: realm B trả `duplicate:true`.
- **Thiết kế:** `KEY.reward("hidden_realm", realmId, cycleIndex, "main")` (Mẫu 7).
- **Kiểm chứng:** test: claim realm A cycle 1 → ok; claim realm B cycle 1 → **ok** (hiện fail). Test này bắt được `N32` ngay.

## B12. Echo lệnh + gộp scene log
- **Hiện trạng:** `N141` (đo `leaked=true`), `N142` (đo 2 paragraph cùng ngày), `N143`.
- **Thiết kế:**
  - Echo: set `type:"command"` → `canonicalLogType` map sang `COMMAND_ECHO` + `debugOnly:true`. Cả `engine.js:5926` và `expansion.js:4266`.
  - `sceneId` mặc định **bỏ `turn`**: `"scene:" + locationId + ":" + dayKey`; nếu cần tách theo hành động thì dùng `causedBy`/`relation` tường minh (cơ chế đã có) chứ không dùng `turn`.
  - Gộp theo ngày: predicate group chỉ dùng `dayKey` (+ `sceneId` khi `sceneId` **tường minh**, không phải default).
- **Kiểm chứng:** test: 2 event cùng ngày khác turn → **1** paragraph (hiện 2). Echo không xuất hiện trong `novelLogParagraphs` (hiện có).

## B13. Dị Thể combat + `reviveOnce`
- **Hiện trạng:** `N23`/`N24`/`M2` — `corruptionResist`, `poisonResist`, `stealth`, `elementPenalty`, `reviveOnce` được tính nhưng **0 consumer**.
- **Thiết kế:** nối vào **đúng một chỗ** trong pipeline đã có thứ tự:
  - `corruptionResist` → nhân vào `corruptionGain` của `useTechnique` (`engine.js:1786`) và của curse pipeline (ward đã có `wardReduction` — dùng cùng chỗ).
  - `elementPenalty` → vào nhóm `matchup` của `techniqueCombatProjection` (`:1692-1697`).
  - `poisonResist` → chỉ có nghĩa khi tồn tại hệ độc; **nếu chưa có hệ độc thì đừng code** — chuyển field sang `reserved` và ghi vào register (tránh code ma).
  - `reviveOnce` → trong `enemyTurn`/`checkEndings` (`:4983`, `:6030`): trước khi set `pendingEnding="succumb"`, kiểm `getWorldModifiers(...).reviveOnce`; nếu có thì hồi 1 HP theo công thức catalog, tiêu thụ (trừ per-game-day/per-level), ghi node history, **không** kết thúc.
- **Kiểm chứng:** test: nhân vật `thanh_the` stage 3 → corruption gain giảm đúng tỷ lệ; nhân vật `bat_tu_the` bị đòn chí tử → không `pendingEnding`, HP > 0, cờ revive đã tiêu.
- **Bẫy:** chỉ áp **stage hiện tại** (`specialPhysiqueModifiers` đã đúng), không cộng dồn nhiều stage.

## B14. Companion trong combat
- **Hiện trạng:** `N1`/`N25`/`N26` — `selectCompanionTarget` luôn trả địch đầu (`combatEntity` không có `hp`); `engine.js` **0** tham chiếu companion.
- **Thiết kế:**
  - Sửa `combatEntity` để trả **HP hiện tại** (lấy từ `state.enemies[id]`), giữ `hpMax`. Đây là gốc của `N1` và cũng cần cho UI.
  - Thêm `companionAsCombatant(state)` trả `{ hp, hpMax, role, guardStance, loyalty }` để `enemyTurn` chọn mục tiêu theo `threat × stance × loyalty`. Ghi damage qua `recordCompanionDamage` (đã có, đúng).
  - Thêm bậc `dead` khi HP 0 **và** không hồi phục trong `recoveryUntilDay`; thêm `fled` khi `loyalty < ngưỡng` và bị đánh nặng.
- **Kiểm chứng:** test: 2 địch (20 HP và 1 HP) → companion đánh con **1 HP** (hiện đánh con 20). Test: enemy turn → damage ghi vào `companion.damageLedger` (hiện không bao giờ).
- **Bẫy:** giữ `selectCompanionTarget` **seeded** — dùng `rng()` cho tie-break, không `Math.random`.

## B15. RNG sinh item
- **Hiện trạng:** `N55` — đo được `prefixesWith>1suffix=0` (suy biến).
- **Thiết kế:**
```js
let drawIndex = 0;
const item = generator.createRandomItem(kind,
  () => rng(state, "itemgen", sequence, ++drawIndex),      // counter TĂNG mỗi lần gọi
  { idSeed: rng(state, "itemseed", sequence) });
```
- **Kiểm chứng:** test: sinh 400 item → số `(prefix,suffix)` **khác nhau** ≫ số prefix; `prefixesWith>1suffix > 0` (hiện = 0).

---

# PHẦN C — QUY TRÌNH "TỰ THIẾT KẾ LOGIC CÒN THIẾU"

Với 82 symbol missing + hàng chục sub-feature thiếu (`B.1–B.11`), AI **không được** tự bịa. Quy trình bắt buộc cho mỗi feature thiếu:

```text
BƯỚC 1 — TRÍCH HỢP ĐỒNG
  Đọc file canonical của feature. Trích ra: schema (field + kiểu), API (tên + tham số + giá trị trả),
  invariant, acceptance test, và mọi mục "Chưa hoàn thiện".
  → Nếu hợp đồng KHÔNG đủ rõ để code (thiếu field/threshold/format) → DỪNG, ghi vào "CẦN CHỐT".
    Không đoán. Không tự chọn số.

BƯỚC 2 — ĐỐI CHIẾU RUNTIME
  grep symbol trong js/. Phân loại: MISSING / THIN / ĐÃ CÓ NHƯNG KHÁC TÊN.
  Nếu khác tên → dùng tên canonical, giữ alias cũ (không phá save/caller).

BƯỚC 3 — THIẾT KẾ THEO 5 LUẬT BẤT BIẾN CỦA REPO
  (1) catalog chỉ đọc — state runtime riêng
  (2) preview thuần — commit transaction — rollback đầy đủ
  (3) một nguồn sự thật — projection chỉ là getter
  (4) RNG qua rng(), khoá seed đa dạng, không thời gian thực
  (5) mọi reward one-time qua grantCanonicalReward + KEY.reward(...)

BƯỚC 4 — ĐĂNG KÝ TRƯỚC KHI CODE
  Ghi vào register: ID, feature, schema, API, invariant, test name dự kiến, migration cần không.
  → Đây là điểm chốt để con người duyệt trước khi tốn công code.

BƯỚC 5 — CODE + TEST
  Thêm state default trong createState, normalize trong deserialize, serialize round-trip,
  validator (được GỌI THẬT theo Mẫu 1), action wiring (nếu có UI), test positive/negative/idempotency/offline.

BƯỚC 6 — GATE
  node --check · verify_game · verify_review_batches · verify_dichi_deep · verify_catalog_balance
  · verify_ui_surface_contract · verify_log_narrative · verify_random_boundaries
  → Tất cả phải xanh. Nếu một cái đỏ vì test cũ mã hoá sai (N120) → sửa test cùng lúc và ghi rõ trong báo cáo.
```

**Tiêu chí hoàn thành (Definition of Done) cho một feature thiếu** — lấy nguyên từ `09_IMPLEMENTATION_GAPS_AND_DECISIONS.md` và bổ sung điều còn thiếu:

1. Catalog/data source tồn tại
2. `ensure`/migration trong `createState` + `deserialize`
3. Pure resolver cho preview
4. Action transaction + rollback
5. Cross-system modifier nối vào đúng pipeline (không tự phát minh tầng mới)
6. Player-visible narrative/stat qua cửa duy nhất
7. UI DTO/tab (nếu requirement đòi)
8. Save/archive round-trip
9. Test: positive · negative · idempotency · offline · migration
10. **MỚI:** validator của feature này **được gọi từ runtime** (không chỉ test)
11. **MỚI:** symbol canonical có mặt đúng tên (gate parity xanh)
12. **MỚI:** mục "Chưa hoàn thiện" trong canonical được cập nhật `status`

---

# PHẦN D — GATE MỚI NÊN THÊM (chặn lớp lỗi tái diễn)

| Gate mới | Bắt được | Cách làm |
|---|---|---|
| `verify_requirement_symbol_parity.js` | 82 symbol missing | Parse identifier từ canonical → grep `js/` → so baseline |
| `verify_validators_are_wired.js` | `G1` (validator chết) | Call-graph tĩnh: hàm `validate*` export phải có ≥1 call site trong `js/` |
| `verify_no_catalog_mutation.js` | `G8`/`C4`/`N58` | AST/regex: cấm `GameData.X[` / `D().X[` ở vế trái phép gán |
| `verify_determinism_static.js` | `G7`/`C1` | Quét **mọi** `.js` + `index.offline.html` (không danh sách cứng); cho phép allow-list tường minh |
| `verify_invariant_is_data_only.js` | `G3` (invariant đo ms) | Cấm `performance.now`/`Date.now` trong thân hàm `validate*` |
| `verify_test_not_vacuous.js` | `N90–N100` | Lint `tools/`: cấm `>= 0` trên `.length`, `typeof x === "…"` trên biến không gán lại, `assert(!x === false)`; bắt buộc cận dưới cho audit |
| `verify_key_uniqueness.js` | `N32`/`M74`/`N38` | Assert mọi ledger key có ≥3 segment và chứa entity id |
| `verify_banned_word_parity.js` | `N151` | So `LOG_BANNED_WORDS` runtime với tool-lint, fail nếu khác |

Cộng thêm: **đưa tất cả các gate trên vào `run_regression_suite.js`** — hiện suite chỉ chạy 11/29 tool (`N119`).

---

# PHẦN E — PROMPT SẴN DÙNG CHO AI

## E1. Prompt "SỬA LỖI" (một batch P0)

```text
BẠN LÀ: kỹ sư sửa lỗi cho một web game text-RPG tiên hiệp (JS thuần, không build step).
REPO: D:\RPG. Đọc trước: D:\RPG\CODE_REQUIREMENT_AUDIT_MASTER.md (báo cáo audit gộp 3 đợt).
NGUỒN LUẬT: D:\RPG\requirement\SYSTEM_LOGIC_CATALOG\features\** (18 file canonical). Luôn đọc file canonical
của feature TRƯỚC khi sửa. Không sửa gì trái canonical; nếu canonical mâu thuẫn với chính nó, chọn mục
"Runtime update"/cuối file và GHI RÕ điều đã chọn.

PHẠM VI BATCH NÀY: [chọn từ danh sách P0 dưới đây]
P0-1 Validator deterministic + gọi thật (G1,G2,G3)     P0-9  ERROR_NARRATIVE_MAP + alert boundary (G10,G11,N151)
P0-2 Autosave (G4)                                       P0-10 Roll Fate: bỏ lọc Hung, tien=0, source vào key (M1,M2,C7.1)
P0-3 Save schema + migrateV12ToV13 (G13)                 P0-11 Khoá thưởng hidden realm (N32)
P0-4 Catalogue bất biến (G8,C4,N58)                      P0-12 receiveFate không ghi đè kho (C7.2)
P0-5 Một bảng grade duy nhất (G9,N89)                    P0-13 Log: echo + sceneId + dấu câu + phiên (N141,N142,N144,N145)
P0-6 Movement guard thống nhất (G6,C6,N33,N34)           P0-14 selectCompanionTarget + applyPlayerDamage arity (N1,N2)
P0-7 Transaction cho turn (G12,C5.1)                     P0-15 RNG sinh item (N55)
P0-8 Narrative boundary cửa duy nhất (G10,C12)

LUẬT BẤT BIẾN (bắt buộc, không thương lượng):
1. Catalog TĨNH chỉ đọc. Mọi dữ liệu động sống trong state. Không ghi vào GameData.* / D().*
2. Mọi mutation theo mẫu: validate (thuần) -> commit cost -> apply -> rollback đầy đủ nếu throw.
   KHÔNG trừ tài nguyên trước khi validate xong. KHÔNG để lại trừ một phần.
3. Một nguồn sự thật cho mỗi dữ liệu. Projection chỉ là getter. Hằng số dùng chung đặt ở một chỗ.
4. Mọi random đi qua hàm rng(state, scope, ...parts) seeded. CẤM Math.random và CẤM thời gian thực
   (Date.now/performance.now) cho logic gameplay; chỉ dùng absoluteDay / meta.turn.
5. Mọi thưởng one-time đi qua grantCanonicalReward với key ổn định, key phải chứa entity id.
6. Validator phải THUẦN DỮ LIỆU, DETERMINISTIC, và PHẢI ĐƯỢC GỌI từ runtime (không chỉ trong test).
7. Không xoá dữ liệu người chơi để "sửa" state. Repair chỉ chuẩn hoá về default hợp lệ.
8. Giữ tương thích save cũ: thêm field có default, migration không thưởng.
9. UTF-8 bắt buộc. Không để mojibake lọt vào file.
10. Không đổi API công khai (tên hàm/tham số/kiểu trả về) trừ khi lỗi nằm chính ở đó — nếu buộc đổi,
    ghi "BREAKING" và liệt kê mọi call site đã cập nhật.
11. KHÔNG tạo tài liệu mới trong requirement/. Không sửa AUDIT_CANONICAL.md.

QUY TRÌNH MỖI LỖI:
a) Trích dẫn requirement làm căn cứ (file + mục).
b) Đọc code tại đúng dòng báo cáo chỉ ra. Xác nhận lỗi có thật (đừng tin báo cáo mù quáng;
   nếu báo cáo sai, ghi rõ và BỎ QUA lỗi đó).
c) Sửa tối thiểu, đúng phạm vi. Không refactor rộng, không đổi style.
d) Thêm/sửa test để lỗi không tái sinh. Test phải CÓ THỂ FAIL (không tautology).
e) Chạy: node --check js/*.js; node tools/run_regression_suite.js; và mọi verify_* liên quan.
f) Nếu phải sửa test cũ vì test đó mã hoá kỳ vọng SAI (ví dụ N120 về di chuyển), sửa test cùng lúc
   và ghi rõ vào báo cáo.

BÁO CÁO CUỐI (bắt buộc, theo format):
## Batch [số] — [ngày]
### Đã sửa (N lỗi)
1. [ID trong báo cáo] [file:dòng] — [lỗi cũ] -> [logic mới] — test [tên test]
### Không sửa được / báo cáo sai
1. [ID] — [lý do]
### Cần chốt (KHÔNG tự quyết)
1. [câu hỏi] — [vì sao cần người quyết]
### Bằng chứng
- node --check: ...
- run_regression_suite: [số pass/fail trước -> sau]
- verify_* đã chạy: ...
### Rủi ro còn lại
- ...
```

## E2. Prompt "TỰ THIẾT KẾ + CODE LOGIC CÒN THIẾU"

```text
BẠN LÀ: kỹ sư thiết kế + triển khai cho web game text-RPG tiên hiệp (JS thuần).
REPO: D:\RPG. BÁO CÁO AUDIT: D:\RPG\CODE_REQUIREMENT_AUDIT_MASTER.md (xem Phần III §3 — register
82 symbol missing + B.1..B.11).

NHIỆM VỤ: với MỘT nhóm feature còn thiếu, hãy TỰ THIẾT KẾ theo requirement rồi triển khai.
KHÔNG được bịa số liệu, ngưỡng, tên field, tên hàm. Nếu requirement không đủ rõ -> DỪNG và hỏi.

NHÓM ĐƯỢC GIAO: [chọn một]
 N-1 MAP surface §16 (B.1)              N-5 TECHNIQUE resolver + guild policy (B.9)
 N-2 CHARACTER NPC taxonomy + anchor (B.3)   N-6 PROFESSION hidden path + Cổ Thần (B.5)
 N-3 PROGRESSION pathState + insight (B.4)   N-7 REWARD/DISCOVERY read model + preview API (B.7,B.8)
 N-4 NPC quest/contract lifecycle (D5, N164) N-8 UI/PLATFORM formatter + memoization (B.10,D7)

ĐẦU RA BẮT BUỘC THEO THỨ TỰ (dừng ở bước 4 để người duyệt, trừ khi được bảo "code luôn"):
1. TRÍCH HỢP ĐỒNG: liệt kê schema/API/invariant/acceptance lấy từ canonical (kèm file + dòng).
2. ĐỐI CHIẾU: mỗi symbol -> MISSING / THIN / KHÁC TÊN (kèm tên thật trong code).
3. THIẾT KẾ: schema JS cụ thể, chữ ký hàm, thứ tự gọi, chỗ nối vào pipeline hiện có
   (chỉ rõ file:dòng của điểm nối), migration nếu có, và 5 luật bất biến được thoả thế nào.
4. DANH SÁCH "CẦN CHỐT": mọi chỗ requirement thiếu thông tin. KHÔNG tự chọn.
5. CODE + TEST theo Quy trình 6 bước ở Phần C của tài liệu này.

5 LUẬT BẤT BIẾN: (giống prompt E1, mục LUẬT BẤT BIẾN, điểm 1-11) — dán nguyên vào.

BẮT BUỘC VỀ CHẤT LƯỢNG:
- Mọi feature mới phải có: default trong createState, normalize trong deserialize, serialize round-trip,
  validator ĐƯỢC GỌI THẬT, và test positive/negative/idempotency/offline.
- Dùng TÊN CANONICAL. Nếu trùng ý nhưng khác tên với code cũ, giữ alias cũ và comment lý do.
- Nếu feature cần state mới: tăng featureVersions, KHÔNG tăng save version trừ khi bắt buộc.
- Nếu feature cần RNG: dùng rng() seeded, khoá seed chứa entity id + day ordinal.
- Nếu feature cần reward: grantCanonicalReward + KEY.reward(...).
- Chỉ build UI surface nếu canonical ĐÒI (không tự thêm tab).
- Test phải kiểm CẢ HAI CHIỀU: có thì phải thấy, không được có thì phải chặn.

TỰ KIỂM TRƯỚC KHI BÁO XONG (tự trả lời, nếu có "không" thì chưa xong):
- Validator của feature này có được gọi từ runtime chưa? (không chỉ test)
- Symbol canonical đã có mặt đúng tên chưa?
- Preview có mutate gì không? Commit có rollback đầy đủ không?
- Có hai nguồn sự thật nào mới sinh ra không?
- Save cũ load được không? Save mới load lại có ra cùng state không?
- Test có thể FAIL được không (đã thử làm nó fail chưa)?

BÁO CÁO: format giống prompt E1, thêm mục "Thiết kế đã chọn và lý do".
```

## E3. Prompt "RÀ SOÁT LẠI SAU KHI SỬA" (chống hồi quy)

```text
Kiểm tra xem bản sửa có thực sự hoạt động và không gây hồi quy.
BẰNG CHỨNG BẮT BUỘC (chạy thật, dán output thô):
1. node --check js/engine.js js/expansion.js js/ui.js js/main.js
2. node tools/run_regression_suite.js   -> phải 13/13 PASS (hiện 8/13)
3. Với từng lỗi đã sửa: chạy test mới, và CỐ TÌNH làm nó fail (xoá bản sửa tạm) để chứng minh test bắt được lỗi.
4. Re-run 3 phép đo trọng yếu của báo cáo để so trước/sau:
   - T8 Monte-Carlo roll Fate 20k -> phải thấy sign "hung" xuất hiện và tien = 0 từ nguồn thường
   - LT2 hai event cùng ngày -> phải 1 paragraph (trước 2)
   - LT4 chuỗi chứa "—" -> phải giữ dấu (trước bị xoá)
   - T7 hai realm cùng cycle -> cả hai claim được (trước realm B duplicate)
5. Liệt kê mọi file đã đổi kèm số dòng +/-, và xác nhận KHÔNG có file nào ngoài phạm vi bị chạm.

Nếu bước 3 không chứng minh được test bắt lỗi -> test đó vô nghĩa, phải viết lại.
Nếu bất kỳ bước nào fail -> KHÔNG được báo hoàn thành.
```

---

# PHẦN F — THỨ TỰ THỰC THI ĐỀ XUẤT VÀ RỦI RO

## F1. Thứ tự (quan trọng: có thứ tự nhân quả, không làm ngược)

| Bước | Việc | Vì sao trước |
|---|---|---|
| 0 | **Sửa `replayRandom` fail-closed + bỏ ngưỡng ms khỏi invariant** | Nếu nối validator vào runtime trước khi sửa ngưỡng ms → save hợp lệ bị từ chối. Nếu để `replayRandom` fail-open → mọi thay đổi RNG không kiểm chứng được |
| 1 | **Thêm 8 gate mới (Phần D) ở chế độ `--report` (chưa fail build)** | Có baseline số liệu trước khi sửa để đo tiến bộ |
| 2 | **P0 nhóm dữ liệu:** một bảng grade, catalog bất biến, save schema + migration | Sửa nền; các lỗi khác dựa trên nền này |
| 3 | **P0 nhóm atomicity:** transaction cho turn, receiveFate, rollback `craftArtifact` | Sau khi nền ổn định |
| 4 | **P0 nhóm state:** validator gọi thật, autosave, movement guard | Cần Mẫu 1 + Mẫu 4 đã có |
| 5 | **P0 nhóm nội dung:** roll Fate, khoá hidden realm, RNG item | Độc lập, làm sau cùng trong P0 |
| 6 | **P0 nhóm văn bản:** log (echo/sceneId/dấu câu/phiên) + ERROR_NARRATIVE_MAP + alert boundary | Độc lập |
| 7 | **Bật 8 gate mới sang chế độ fail-build** | Lúc này chúng phải xanh |
| 8 | **P1 theo feature** (FATE → CHARACTER/PROGRESSION → PROFESSION/DỊ THỂ → MAP → NPC/COMPANION → TECHNIQUE/REWARD → COMBAT/ITEM) | Mỗi nhóm một batch, đóng gate trước khi sang nhóm sau |
| 9 | **P1 register "chưa code"** theo Quy trình Phần C, dừng ở bước 4 để duyệt | Đây là phần lớn nhất về khối lượng |
| 10 | **P2 UI/perf/archive + bù test cho 14 bất biến chưa assert** | Cuối cùng |

## F2. Rủi ro và cách giảm

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Nối validator vào runtime làm hỏng save đang chơi | **Cao** | Chỉ repair (không xoá), mode `observe` ở `post_action`, log diagnostic; bật `repair` dần theo từng nhóm check |
| Sửa RNG làm lệch mọi replay hiện có | **Cao** | Sửa `replayRandom` **trước**, có test replay so trước/sau; chấp nhận "replay corpus cũ không còn hợp lệ" và ghi rõ |
| Sửa 4 test về di chuyển (`N120`) gây hiểu nhầm "test yếu đi" | TB | Sửa test **cùng lúc** với hành vi; ghi rõ trong báo cáo là "đổi kỳ vọng theo canonical" |
| Repair tự động ghi đè dữ liệu người chơi | **Cao** | Chỉ chuẩn hoá field sai về default; cấm xoá; có test "state hỏng → repair → không mất field nào khác" |
| Catalog freeze làm crash chỗ ghi hiện có | TB | Freeze **chỉ trong test/dev**; production copy-on-read |
| Khối lượng 82 symbol missing quá lớn → làm nửa vời | **Cao** | Chia nhóm theo `B.n`, mỗi nhóm một batch có gate riêng; **không** bắt đầu nhóm mới khi nhóm trước còn đỏ |
| AI tự bịa thông số khi requirement thiếu | **Cao** | Bắt buộc mục "CẦN CHỐT" ở bước 4; prompt cấm đoán |

## F3. Ước lượng độ ưu tiên theo "giá trị / công sức"

| Việc | Giá trị | Công sức | Nên làm |
|---|---|---|---|
| Sửa ngưỡng ms + `replayRandom` fail-closed | Rất cao (mở khoá 5 test suite) | Rất thấp | **Ngay** |
| 8 gate mới | Rất cao (chặn tái diễn) | Thấp–TB | **Ngay** |
| Một bảng grade duy nhất | Cao | Rất thấp | Ngay |
| `combatEntity` trả `hp` (sửa N1 gốc) | Cao | Rất thấp | Ngay |
| Roll Fate (bỏ lọc Hung + tien=0) | Cao | Thấp | Ngay |
| Khoá hidden realm | Cao | Rất thấp | Ngay |
| Log (echo/sceneId/dấu câu) | Cao | Thấp | Ngay |
| Validator gọi thật | Rất cao | TB–cao | Sau bước 0 |
| Catalog bất biến | Cao | TB | Sau bước 2 |
| 82 symbol missing | Rất cao | **Rất cao** | Chia nhóm, làm dần |
| Bù test 14 bất biến | Cao | TB | Song song P1 |

---

*Hết tài liệu đề xuất. Chưa có dòng code nào bị sửa. Cần xác nhận (APPROVE) trước khi triển khai bất kỳ bước nào.*
