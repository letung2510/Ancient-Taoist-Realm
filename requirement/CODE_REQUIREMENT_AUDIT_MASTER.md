# BÁO CÁO AUDIT CODE ↔ REQUIREMENT — D:\RPG (BẢN GỘP 3 ĐỢT)

> **Tài liệu này là bản gộp duy nhất của ba đợt rà soát.** Nó thay thế `CODE_REQUIREMENT_AUDIT_2026-09-22.md`, `CODE_REQUIREMENT_AUDIT_2026-09-22_PART2.md` và `CODE_REQUIREMENT_AUDIT_2026-09-22_PART3.md`.

- **Ngày hoàn tất:** 2026-09-22
- **Phạm vi code:** `js/engine.js` (455KB), `js/expansion.js` (434KB), `js/ui.js` (178KB), `js/main.js` (62KB), `js/i18n.js`, `character_generator.js`, `gemini-code-1788430656294.js`, `data/*` (14 file), `webgame/*`, `tools/*` (29 file), `index.html`, `index.offline.html`, `styles.css`
- **Phạm vi requirement:** `requirement/**` — 18 file canonical trong `SYSTEM_LOGIC_CATALOG/features/01..09`, `AUDIT_CANONICAL.md`, `README.md`, `CROSS_FEATURE_RUNTIME_REVIEW_2026-09-22.md`, 2 nguồn root-level.
- **Phương pháp:** đợt 1 đọc tĩnh có định vị; đợt 2 và đợt 3 bổ sung **thực nghiệm chạy code** (nạp 13 file runtime vào `vm` sandbox và gọi API công khai).
- **Nhãn bằng chứng:** `[RUN]` = đã tái lập bằng script chạy thật (có số liệu in ra); `[STATIC]` = suy ra từ đọc mã tại dòng dẫn.
- **Trạng thái:** chỉ đọc. Không file nào trong repo bị sửa đổi bởi quá trình audit. Script chẩn đoán nằm ngoài repo (scratchpad phiên).

---

## MỤC LỤC

| Phần | Nội dung | Tiền tố ID |
|---|---|---|
| **PHẦN I** | Đợt 1 — Hợp đồng state/schema/pipeline của các feature lõi (FATE, CHARACTER/PROGRESSION, PROFESSION/DỊ THỂ, MAP/WEATHER/WORLD, NPC/RELATIONSHIP/COMPANION, TECHNIQUE/DISCOVERY/REWARD, UI/save) | `G` `M` `C` `D` `E` |
| **PHẦN II** | Đợt 2 — Combat · Search/Exploration/Hidden Realm · Item/Inventory/Auction/Heirloom · Data layer · Chất lượng bộ test · UI render + i18n | `N1`–`N140` |
| **PHẦN III** | Đợt 3 — Log system · Register tính năng đã thiết kế nhưng chưa code · Các feature còn lại (quest/contract/mail, war/tournament/world event, tu luyện/bế quan/đột phá, nghề, Mệnh combo/dung hợp, weather, offline) + bảng xác nhận thực nghiệm | `N141`–`N190`, `B.1`–`B.11` |

Bên trong mỗi phần, các ID được đánh số riêng theo tiền tố; **không có ID nào bị trùng giữa ba phần** (đợt 2 dùng `N1`–`N140`, đợt 3 tiếp tục `N141`–`N190`).

---

## TÓM TẮT ĐIỀU HÀNH GỘP (20 phát hiện nghiêm trọng nhất toàn bộ 3 đợt)

Nhóm theo mức độ tác động lên tính đúng của game:

### A. Chặn hoàn toàn / mất dữ liệu / phá trạng thái

| ID | Nguồn | Phát hiện |
|---|---|---|
| **G1** | Phần I | `validateExpansionState` **chưa bao giờ được gọi từ runtime** — toàn bộ ~40 validator chỉ chạy trong test. Save/load có thể lưu đúng loại dữ liệu hỏng mà validator sinh ra để chặn. |
| **G2 / G3** | Phần I | Chính validator đó **đang FAIL 5/13 test suite** và **không deterministic** (cùng state: chạy nguội `invalid` avg 20ms, chạy ấm `valid` 13–16ms; `calls=1` nên một mẫu quyết định, ngưỡng cứng 16ms). |
| **G4** | Phần I | **Autosave chết**: `saveGame(explicit=false)` return sớm; ~50 call site gọi `saveGame()` không tham số là no-op. |
| **G5 / FT8** | Phần I + III | **Không có state máy du hành**: `travelTask`, `startTravel`, `resolveMapTransaction`, `MAP_VERSION_CONFLICT`, `tickSnapshot`… đều 0 hit. `mapState.travelTask = undefined`. |
| **G6** | Phần I | **Teleport bỏ qua movement guard** (vào/ra hidden realm, world tick, `travelToSafeHub`) không clear pending. |
| **G8 / C4** | Phần I | **Resolver ghi vào catalog tĩnh** (`GameData.QUESTS`, `GameData.ITEMS`) với **không** thao tác nghịch đảo. |
| **N32** | Phần II | **Khoá thưởng hidden realm va chạm** giữa các realm → realm thứ hai mất thưởng vĩnh viễn (`[RUN]`: realm B trả `duplicate:true`). |
| **N55** | Phần II | **RNG sinh item suy biến** (`[RUN]`: 400 lần sinh → prefix↔suffix khớp 1-1 tuyệt đối, `prefixesWith>1suffix=0`). |
| **N141** | Phần III | **Echo lệnh thô lọt player log** (`[RUN]`: `leaked=true`). |
| **N144** | Phần III | **Dấu `—`/`…` hợp lệ bị xoá khỏi mọi chuỗi log** (`[RUN]`: `"Hắn dừng lại — rồi bước tiếp…"` → `"Hắn dừng lại rồi bước tiếp"`). |
| **N145** | Phần III | **Từ `phiên` (tiếng Việt hợp lệ) xoá cả câu** (`[RUN]`: câu về phiên đấu giá bị thay bằng câu chắn chung). |
| **B.1** | Phần III | **30 API MAP canonical không tồn tại** — toàn bộ §16 surface của `MAP_CANONICAL.md`. |
| **C8.1** | Phần I | Cây validator ~40 hàm (map, replay envelope, cache, companion, reward policy, action priority…) chỉ chạy trong test. |

### B. Sai logic ảnh hưởng gameplay

| ID | Nguồn | Phát hiện |
|---|---|---|
| **M1 / M2 / T8** | Phần I + II | Bảng trọng số Fate **đúng canonical 7/8 ô** (chỉ ô `tien` đặt `0.01` thay vì `0`); Mệnh **Hung/Bình không bao giờ nhận được** qua resolver (`[RUN]`: 20 000 roll → `signs={cat:20000}`). |
| **N1 / N2** | Phần II | `selectCompanionTarget` luôn trả địch đầu tiên (`combatEntity` không có `hp`); `applyPlayerDamage` gọi sai arity → damage truy đuổi **no-op** (`[RUN]` cả hai). |
| **N23 / N24 / N25** | Phần II | Hiệu ứng kháng/combat của Dị Thể và `reviveOnce` **không bao giờ được áp**; địch **không bao giờ** retarget companion. |
| **N164** | Phần III | Quest NPC `active` **không bao giờ hết hạn** (`[RUN]`: qua 30 ngày, `active=1`, `failed=0`). |
| **N171** | Phần III | War trỏ faction không tồn tại vẫn `active`, cascade **0 lần**, validator fail (`[RUN]`). |
| **N172 / FT7** | Phần III | `factionPower` là **hằng số tĩnh**; `resources=0, stability=0` không đổi `power` (`[RUN]`). |
| **N179** | Phần III | Guard chống nested roll là **no-op** → Tẩu Hỏa trừ EXP nhiều lần trong một Bế Quan. |
| **N142 / N143** | Phần III | Gộp scene theo ngày bị vô hiệu (`sceneId` chứa `turn`); story window tách cùng ngày theo node (`[RUN]`: 2 paragraph cho cùng ngày). |
| **N11 / N12** | Phần II | `applyPlayerDamage` không idempotent → gọi lại phát lại EXP/loot/Mệnh; ledger action Công Pháp không được serialize → replay sau load được chấp nhận. |
| **N185 / FT5** | Phần III | `mergeFates` **bỏ qua 78 fusion recipe** và roll Mệnh generic (`[RUN]`). |
| **N187** | Phần III | `nurtureFate` tự nhảy bậc 1→2, bỏ qua behavior gate canonical. |

### C. Kiểm chứng / chất lượng

| ID | Nguồn | Phát hiện |
|---|---|---|
| **N115–N117** | Phần II | `webgame/app.js`, `webgame/index.html`, `index.offline.html` **thoát mọi gate** (random-boundary, UTF-8, asset, regression suite). |
| **N120** | Phần II | **4 nơi trong bộ test mã hoá kỳ vọng trái canonical** về di chuyển — sửa đúng sẽ làm đỏ test. |
| **N90–N100** | Phần II | 11 assertion **không thể fail** (tautology, `>= 0`, double-negation, block bị skip im lặng). |
| **N101–N114** | Phần II | 14 bất biến canonical **không có test nào** assert. |
| **G9 / N89** | Phần I + II | **Hai bảng grade-rank mâu thuẫn** giữa `engine.js:454` và `expansion.js:16`. |
| **G11 / N135** | Phần I + II + III | `ERROR_NARRATIVE_MAP` chỉ có 6 mã, **14 mã runtime không có map** (`[RUN]`); i18n **thiếu 8/9 formatter canonical**; `formatHistory` để 3/8 id weather lọt ra text người chơi (`[RUN]`). |

---

## LỘ TRÌNH ƯU TIÊN GỘP

### P0 — Phải sửa trước khi tin bất kỳ tuyên bố "đã xong"

1. Cố định ngưỡng runtime thành **deterministic** (bỏ so sánh wall-clock khỏi invariant; tách perf gate khỏi `validateExpansionState`) → 5 test suite xanh trở lại. `[G2, G3, A2, N101]`
2. Gọi validator (hoặc tập con thuần dữ liệu) tại boundary `deserialize`/`ensure` như requirement đòi. `[G1, C8.1]`
3. Sửa autosave. `[G4]`
4. Sửa chuỗi save schema + thêm `migrateV12ToV13`. `[G13, A9, B.10]`
5. Ngăn resolver ghi catalog tĩnh. `[G8, C4.1–C4.4, N58]`
6. Thống nhất bảng grade thành một nguồn duy nhất. `[G9, C10.1, N89]`
7. Bịt teleport bỏ qua movement guard. `[G6, C6.1–C6.4, N34]`
8. Thêm transaction cho `turn += 1` (không tiêu lượt khi resolver throw). `[G12, C5.1]`
9. Mở rộng `ERROR_NARRATIVE_MAP` + đưa `alert()` qua `playerFacingReason`. `[G10, G11, C12, N151]`
10. Sửa roll Mệnh: cấm Mệnh Hung là **lỗi** (phải cho nhận), ô `tien` về `0`, thêm `source` vào khoá roll, chặn trao Tiên từ chuỗi quest. `[M1, M2, M8, C7.1, C7.3, T8, N103, N104]`
11. Sửa hợp nhất khoá thưởng hidden realm. `[N32]`
12. Xử lý `receiveFate` ghi đè kho im lặng. `[C7.2]`
13. Sửa log: đánh dấu echo là `COMMAND_ECHO`/`debugOnly`; bỏ `turn` khỏi `sceneId`; đừng map dấu câu Unicode sang byte C1; bỏ `phiên` khỏi danh sách từ cấm hoặc strip tại chỗ. `[N141, N142, N144, N145]`
14. Sửa `selectCompanionTarget` + `applyPlayerDamage` arity. `[N1, N2]`
15. Sửa RNG sinh item (index tăng dần thật). `[N55]`

### P1 — Hoàn thiện game logic

- **FATE:** behavior gate cho nurture, 3→4 theo đột phá, khoá tháo bậc 4, `resonanceEffect`, popup trùng Huyền+, fusion recipe, sửa `transformFate` bất khả commit. `[M5–M10, C11.3, D1, B.2, N185–N187]`
- **CHARACTER/PROGRESSION:** Neo theo schema + tối đa 3 + taxonomy NPC; `pathState` canonical fields; song tu/dung hợp/chuyển đạo; nguồn insight; tiểu kiếp; rankboard; bế quan theo ngày. `[M15–M32, D2, B.3, B.4, N180–N182]`
- **PROFESSION/DỊ THỂ:** hidden path catalog thật + namespace tách; cost Dị Thể ngoài SAN; sửa id `tho_san_di_trieu`; `reviveOnce`; `rejectedIds`. `[M33–M40, D3, B.5, B.6, N77, N78]`
- **MAP/WORLD:** influence công thức + clamp + `outpostBonus`; owner derived; cache 4 version; fog 1/3 + discovery event; `pendingExploration` shape; travel task. `[M41–M49, D4, B.1, N39]`
- **NPC/COMPANION:** rumor TTL/clamp; queue priority; footprint clue class; companion online damage + UI + validator boundary; quest expiry cho `active`; war mồ côi; `factionPower`; diplomacy pairing. `[M50–M64, C13, D5, N164–N178]`
- **TECHNIQUE/REWARD:** dựng resolver canonical; cost pipeline; guild policy + `transitionGuildMembership`; trial producer; discovery read-model thuần. `[M65–M78, D6, B.9]`
- **COMBAT/ITEM:** Dị Thể resistance/reviveOnce; retarget companion; guard item nguyền; tặng item quest/khoá; `removeItem` chặn over-remove; market refresh theo game-day. `[N23–N29, N56, N57, N63, N65]`
- **LOG:** `ERROR_NARRATIVE_MAP` đầy đủ; retention theo importance; milestone counter; đồng bộ tool-lint với runtime-lint; thay fixture matrix bằng chuỗi producer thật. `[N146–N163, A.3]`

### P2 — UI/perf/archive/kiểm chứng

- Memoize `contextState`; profile `reduced`; budget thực sự chặn; i18n formatter; bundle offline rebuild; đưa các gate bị thiếu vào `run_regression_suite.js`; sửa `verify_log_narrative.js`; bịt điểm mù gate cho `webgame/` + `index.offline.html`. `[D7, N115–N121, N135–N140]`
- Thêm test cho 14 bất biến canonical chưa được assert; thay 11 assertion rỗng. `[N90–N114]`

---

## GHI CHÚ VỀ `webgame/` (ngoài phạm vi contract)

`webgame/` là **micro-runtime độc lập** (`webgame/index.html` + `app.js` 19 dòng), tự có `regions/realmNames/fates/techniques` và localStorage key riêng `co-di-dien-visual-v1`. Nó **không** import `data/` hay `js/`, **không** phản ánh bất kỳ contract nào trong catalog (không Mệnh 10.000, không path/profession/Dị Thể, không world tick, không dual clock, không action priority, không save migration), dùng `Math.random()` trực tiếp cho gameplay, và **thoát mọi gate** của repo. Nếu nó thuộc phạm vi sản phẩm thì cần quyết định rõ: nối vào runtime canonical, hoặc chính thức tuyên bố ngoài contract (khi đó phải loại khỏi mọi tuyên bố "deterministic replay" và khỏi bộ lint boundary).

Lỗi nhỏ đã xác nhận trong `webgame/`: `styles.css` có block `.v2-*` không được `app.js` render (CSS mồ côi); `app.js` dùng `<p class=muted>` nhưng CSS không định nghĩa selector `.muted`; `index.html` có `<template id="story-template">` không bao giờ được dùng.

---

# PHẦN I — ĐỢT 1: HỢP ĐỒNG STATE/SCHEMA/PIPELINE CỦA CÁC FEATURE LÕI

> Phương pháp đợt 1: đọc tĩnh có định vị (grep symbol → đọc cửa sổ dòng). Tiền tố ID: `G` (toàn cục), `M` (mismatch theo feature), `C` (lỗ hổng logic), `D` (sub-feature thiếu), `E` (mâu thuẫn trong chính tài liệu requirement).

- **Ngày:** 2026-09-22
- **Phạm vi code:** `js/engine.js` (455KB), `js/expansion.js` (434KB), `js/ui.js` (178KB), `js/main.js` (62KB), `js/i18n.js`, `character_generator.js`, `gemini-code-1788430656294.js`, `data/*` (data.js, world_data.js, expansion_data.js, cong_phap.js, npc_monsters.js, profession_items.js, path_fate_relations.*), `webgame/*`, `tools/*` (28 script), `index.html`, `index.offline.html`, `styles.css`
- **Phạm vi requirement:** `requirement/**` — 18 file canonical trong `SYSTEM_LOGIC_CATALOG/features/01..09`, `AUDIT_CANONICAL.md`, `README.md`, `CROSS_FEATURE_RUNTIME_REVIEW_2026-09-22.md`, và 2 nguồn root-level chưa hợp nhất.
- **Phương pháp:** đọc tĩnh có định vị (grep symbol → đọc cửa sổ dòng), chạy `node --check`, chạy `node tools/run_regression_suite.js`, tái lập lỗi validator bằng script chẩn đoán riêng.
- **Mức độ bằng chứng:** mọi mục có nhãn `[RUNTIME]` = đã chạy/tái lập được tại chỗ; `[STATIC]` = suy ra từ đọc mã tại dòng được dẫn. Mọi số dòng đúng với working tree tại thời điểm audit (`cc1f28d`).
- **Trạng thái:** báo cáo chỉ đọc, **không sửa file nào** trong repo.

---

## 0. TÓM TẮT ĐIỀU HÀNH — 15 phát hiện nghiêm trọng nhất

| # | Mức | Phát hiện | Bằng chứng |
|---|---|---|---|
| G1 | **BLOCKER** | `validateExpansionState` **chưa bao giờ được gọi từ runtime**. Toàn bộ cây validator (≈40 hàm) chỉ chạy trong test. Save/load có thể lưu đúng loại dữ liệu hỏng mà validator được viết ra để chặn. | grep `validateExpansionState(` toàn repo: chỉ `tools/*.js` + định nghĩa `expansion.js:2835`. `E.deserialize` (`expansion.js:4257`) và `E.updateDerived` (`expansion.js:4273`) không gọi. |
| G2 | **BLOCKER** | Chính cái validator đó hiện **đang FAIL** vì một ngưỡng đo thời gian thực, làm **5/13 test suite đỏ**. | `node tools/run_regression_suite.js` → FAIL `verify_game`, `verify_review_batches`, `verify_dichi_deep`, `verify_expansion_stress`, `verify_completion_tasks`. |
| G3 | **BLOCKER** | Validator đó **không deterministic**: cùng một state, chạy nguội trả `invalid` (avg 20ms), chạy ấm trả `valid` (13–16ms). | Tái lập 3 lần ở context mới: `run1 valid=false avg=20.00`, `run2 valid=true avg=16.00`, `run3 valid=true avg=13.00`. Ngưỡng = `budgets.mapInfluenceAverageMs * 4` = 16ms, và `calls=1` nên **một mẫu duy nhất** quyết định kết quả (`expansion.js:2334`, `:2371`). |
| G4 | **CAO** | **Autosave chết hoàn toàn.** `saveGame(explicit=false)` return sớm khi không truyền `true`; gần 50 call site gọi `saveGame()` không tham số → no-op. Tiến trình chỉ được ghi khi bấm nút Lưu / new game / export. | `main.js:1040-1042` + các call site `main.js:162,167,362,403,405,407,413…655`. |
| G5 | **CAO** | **Không có travel task.** `TravelTask`, `startTravel`, `interruptTravel`, `resumeTravel`, `cancelTravel`, `edgeState`, `resolveMapTransaction`, `expectedVersion`, `MAP_VERSION_CONFLICT`, `tickSnapshot` — **0 hit** trong toàn bộ `js/`. Di chuyển tức thời (`engine.js:4158`), `state.mapState` không có `travelTask`. | grep 0 hit. Hệ quả: toàn bộ contract travel của `MAP_CANONICAL.md` không thể thực thi, và mã lỗi `TRAVEL_ALREADY_ACTIVE` là code chết. |
| G6 | **CAO** | **Teleport bỏ qua movement guard**: `hiddenRealmEnter` (`expansion.js:3610`), `exitHiddenRealm` (`expansion.js:3632`), `updateHiddenRealms` trong world tick (`expansion.js:1735`), `travelToSafeHub` (`engine.js:2695`) đặt `state.locationId` trực tiếp, không clear `pendingMapEvent`/`pendingExploration`. | `[STATIC]` đọc mã tại các dòng trên; `move()` tại `engine.js:4142-4155` có clear, các chỗ này thì không. |
| G7 | **CAO** | **Boundary entropy không được ép buộc.** `webgame/app.js:12` dùng `Math.random()` cho gameplay; `gemini-code-1788430656294.js:91` `defaultRandom = () => Math.random()` (ItemGenerator, load ở `index.html:113`); `character_generator.js:30` tương tự; và `replayRandom` **fail-open** về `Math.random()` (`engine.js:52-57`). Bộ lint `verify_random_boundaries.js:8-14` chỉ quét danh sách file cứng, **bỏ sót** `webgame/`, `index.offline.html`, `data/*`, `tools/*`. | `[STATIC]` + đọc `replayRandom`. |
| G8 | **CAO** | **Resolver ghi vào catalog tĩnh.** `engine.js:4309` và `:2600` ghi quest động vào `GameData.QUESTS`; `engine.js:2511` ghi item procedural vào `GameData.ITEMS`; `expansion.js:501` ghi `profession_items` vào `D.ITEMS` **mỗi lần `ensure()`** (tức mỗi deserialize/action). Không có thao tác nghịch đảo. | `[STATIC]`; so sánh: `techniqueCatalog()` (`engine.js:1459`) deep-copy đúng chuẩn. |
| G9 | **CAO** | **Hai bảng xếp hạng grade mâu thuẫn.** `engine.js:454` `GRADE_TO_TIER = {phan:1…tien:8}` vs `expansion.js:16` `GRADE_RANK = {pham:1, phan:1, linh:2, huyen:3, dia:4, thien:5, tien:6}`. Cùng một grade xếp khác nhau ở hai module (`huyen`=4 vs 3, `dia`=5 vs 4, `tien`=8 vs 6). | `[STATIC]`; `expansion.js:3463` fallback sang `E.GRADE_TO_TIER` → trôi dạt giữa roll/merge/evolution. |
| G10 | **CAO** | **Hai boundary narrative.** Đường `emitEvent` (`engine.js:5303/5354`) được sanitize; đường `alert(result.reason)` trong `main.js` (~30 chỗ) **không** đi qua `playerFacingReason`. Chuỗi tiếng Anh/slug lọt thẳng ra người chơi. | `expansion.js:2451` trả `"Invalid structure catalog entry."`; `expansion.js:2495` nhét `"manual"` vào node history; `engine.js:3555` nối slug `next.requiresPathRitual`. |
| G11 | **CAO** | **`ERROR_NARRATIVE_MAP` chỉ có 6 mã.** Runtime phát ra ≥14 mã `SCREAMING_SNAKE` khác không có map. | `engine.js:5243-5250` = `TRAVEL_ALREADY_ACTIVE, INVALID_STATE, SEARCH_SESSION_ACTIVE, INSUFFICIENT_STAMINA, NOT_FOUND, UNKNOWN_ACTION`. Thiếu: `UNKNOWN_COMPANION_SKILL`, `COMPANION_ROLE_MISMATCH`, `EXPIRED`, `UNKNOWN_TECHNIQUE`, `REALM_TOO_LOW/HIGH`, `PATH_MISMATCH`, `FATE_REQUIRED`, `FACTION_REQUIRED`, `GUILD_REQUIRED`, `GUILD_RANK_REQUIRED`, `RESOURCE_SHORTAGE`, `INVALID_USE_COUNT`, `MAX_USES`. |
| G12 | **CAO** | **Đổi lượt trước khi resolve, không rollback.** `engine.js:5899-5902` và `expansion.js:4266`: `state.meta.turn += 1` **rồi mới** gọi resolver. `expansion.js` **không có một `try/catch` nào** → resolver throw = mất lượt, state dở dang. | `[STATIC]`; grep `catch` toàn repo: `expansion.js` và `ui.js` = **0**. |
| G13 | **CAO** | **Save schema sai chuỗi canonical.** `engine.js:6234-6235` ghi `version: 12` / `schema: "tu_vi_quy_di_final"`; chỉ *localStorage key* là v13. `migrateV12ToV13` **không tồn tại**. | `[STATIC]`; grep `migrateV12ToV13` = 0 hit trong `js/`. |
| G14 | **CAO** | **`index.offline.html` là bundle cũ.** CSS version cũ, DOM **không có** `#pinned-character-summary`, runtime nhúng **0** `emitEvent`, serialize vẫn `version:12/tu_vi_quy_di_final`, `professionState` thiếu `schemaVersion`/`hiddenIds`, `specialPhysiqueState.schemaVersion:1` vs runtime `2`. | `[STATIC]` theo agent UI/platform. |
| G15 | **CAO** | **Điều kiện tiên quyết của nhánh đốt EXP cũ là code chết.** `maybeBreakthrough` (`engine.js:3564-3613`) — nhánh roll body/mind + mất 5–15% EXP **không thể chạy tới** vì các blocker/early-return phía trên. | `[STATIC]`; agent CHARACTER/PROGRESSION. |

> **Ghi chú quan trọng về cách đọc báo cáo:** phần lớn các mục dưới đây được rút từ 8 vòng rà song song theo feature. Một số kết luận có thể trùng nhau giữa các phần (ví dụ cùng một hàm vi phạm cả "mismatch" lẫn "missing sub-feature"); tôi đã cố ý giữ cả hai góc nhìn vì requirement yêu cầu tách 4 loại kiểm tra.

---

## 1. BẰNG CHỨNG THỰC THI

### 1.1. Syntax check — PASS toàn bộ

```text
node --check js/engine.js && node --check js/expansion.js && node --check js/ui.js
  && node --check js/main.js && node --check character_generator.js
→ ALL_SYNTAX_OK
```

### 1.2. Regression suite — 5/13 FAIL

```text
node tools/run_regression_suite.js        (exit code 1)

PASS verify_companion_runtime
PASS verify_ui_surface_contract
PASS verify_log_narrative
PASS verify_log_producers
PASS verify_catalog_balance
PASS verify_utf8_integrity
PASS validate_requirement_docs
PASS git diff --check

FAIL verify_game              → assert(E.validateExpansionState(organizationState).valid)   @ tools/verify_game.js:901 (verifyMapUI)
FAIL verify_review_batches    → assert(E.validateExpansionState(restored).valid)            @ tools/verify_review_batches.js:70 (testInfluenceOfflineAndInvalidation)
FAIL verify_dichi_deep        → assert(E.validateExpansionState(state).valid)               @ tools/verify_dichi_deep.js:108 (testAuditInvariantsAndIndexes)
FAIL verify_expansion_stress  → ["performanceBudget:mapInfluenceRuntime"]                   @ tools/verify_expansion_stress.js:38
FAIL verify_completion_tasks  → "large save/offline restore invalid"                        @ tools/verify_completion_tasks.js:381
```

**Nhận xét:** cả 5 lỗi đều là cùng một nguyên nhân gốc — `validateExpansionState` trả `valid:false` với **duy nhất một** error `performanceBudget:mapInfluenceRuntime`. Đây không phải 5 bug riêng biệt.

### 1.3. Tái lập gốc lỗi (script chẩn đoán riêng, không thuộc repo)

```text
# state chuẩn: createState + createCharacter + chooseJourneyIntent("tu_lap") + ensureExpansionState
validateExpansionState(state) → { valid:false, errors:["performanceBudget:mapInfluenceRuntime"] }
```

Chạy lại 3 lần, mỗi lần ở một `vm` context mới:

```text
run1 valid=false errors=["performanceBudget:mapInfluenceRuntime"] calls=1 totalMs=20 avg=20.00
run2 valid=true  errors=[]                                        calls=1 totalMs=16 avg=16.00
run3 valid=true  errors=[]                                        calls=1 totalMs=13 avg=13.00
```

**Cơ chế:**

```js
// js/expansion.js:2330-2338
function runtimeBudgetSnapshot(state) {
  const influence = metrics.mapInfluence;
  influence.averageMs = influence.calls ? influence.totalMs / influence.calls : 0;
  ...
  budgets: { mapInfluenceAverageMs: 4, ... }
}
// js/expansion.js:2370-2371
const metrics = runtimeBudgetSnapshot(state);
if (metrics.metrics.mapInfluence.calls && metrics.metrics.mapInfluence.averageMs > metrics.budgets.mapInfluenceAverageMs * 4)
  errors.push("mapInfluenceRuntime");     // 4 * 4ms = 16ms
```

**Vì sao là lỗi thiết kế chứ không phải "máy chậm":**

1. Trên state mới, `calls === 1` → `averageMs === totalMs` → **không có lấy trung bình**, một mẫu duy nhất quyết định.
2. Mẫu đó là **lần gọi đầu tiên (uncached)**, bao gồm JIT warm-up + quét catalog lớn → biến động 13–20ms giữa các lần chạy.
3. Kết quả: một **invariant về tính đúng đắn** của save bị phụ thuộc vào thời gian chạy tường. Đây là lỗi phản-determinism, mâu thuẫn trực tiếp với contract "derived influence/fog có thể rebuild deterministic từ state".
4. Nếu G1 được sửa (gọi validator trong `deserialize` như requirement yêu cầu), **save hợp lệ sẽ bị từ chối ngẫu nhiên trên máy yếu**, tệ hơn hiện trạng.

### 1.4. Đo bổ sung

```text
E.refreshMapInfluence(state)  → wall 436.4ms cho 14 node (1 uncached~26ms + 13 cache hit)
metrics sau đó: calls=14, cacheHits=13, uncached=1, totalMs=26, avg=1.86ms
```

→ Khi có cache và nhiều mẫu, ngưỡng 16ms không bao giờ chạm. Điều này giải thích vì sao lỗi chỉ xuất hiện ở **state mới/tinh** — tức đúng kịch bản "vừa tạo nhân vật".

---

## 2. PHẦN A — MISMATCH TOÀN CỤC (cross-cutting) giữa code và requirement

| ID | Mismatch | Code | Requirement | Bằng chứng |
|---|---|---|---|---|
| A1 | Validator không được gọi ở runtime | `validateExpansionState` chỉ được gọi từ `tools/*` | "Mọi mutation đi qua transaction + invariant check"; DoD đòi validator ở boundary save/load | grep; `expansion.js:2835` (định nghĩa), `:4257`/`:4273` (boundary không gọi) |
| A2 | Validator phụ thuộc wall-clock | `mapInfluenceAverageMs * 4` | Invariant phải deterministic, rebuild từ state | `expansion.js:2334,2371`; tái lập ở §1.3 |
| A3 | Autosave bị vô hiệu | `if (!explicit \|\| !state) return;` | "Save phải bền vững qua turn/action"; hàng loạt call site gọi `saveGame()` | `main.js:1040-1042` |
| A4 | Không có state `travelTask` | di chuyển tức thời, không có task | `TravelTask{status,routeSnapshot,etaDays,elapsedDays,riskSeed,interruption,costSnapshot}`; `state.locationId` giữ nguyên khi task `active` | grep 0 hit; `engine.js:4158` |
| A5 | Teleport bỏ qua movement guard | 4 đường gán `state.locationId` trực tiếp | "Mọi đường di chuyển đi qua MỘT guard"; confirm phải đánh dấu pending `lost` | `expansion.js:1735,3610,3632`; `engine.js:2695` |
| A6 | Catalog bị resolver ghi | `D().QUESTS[id]=…`, `D().ITEMS[id]=…`, `D.ITEMS[id]=…` | "Resolver chỉ đọc theo ID; modifier là snapshot, không ghi ngược catalog" | `engine.js:2511,2600,4309`; `expansion.js:501` |
| A7 | Entropy boundary thủng | `webgame/app.js:12`, `gemini-code-…:91`, `character_generator.js:30`, `replayRandom` fail-open | "Mọi random producer phải đi qua replayRandom/seeded hoặc một entropy boundary duy nhất" | grep; `engine.js:44-57` |
| A8 | Hai bảng grade | `GRADE_TO_TIER` vs `GRADE_RANK` | "GRADE_TO_TIER/TIER_TO_GRADE là cơ sở so sánh duy nhất" | `engine.js:454` vs `expansion.js:16` |
| A9 | Save schema chuỗi sai | `version:12` / `"tu_vi_quy_di_final"` | `tu_vi_quy_di_canonical_v13`; `migrateV12ToV13` | `engine.js:6233-6238` |
| A10 | Alert bỏ qua narrative boundary | ~30 `alert(result.reason)` | "reason code, blocker, internal error không được tới UI/novel log trực tiếp" | `main.js:407…982`; `expansion.js:2451` |
| A11 | ERROR_NARRATIVE_MAP không đầy đủ | 6 mã | "map cho **mọi** internal code, có fallback trung tính" | `engine.js:5243-5250` |
| A12 | Turn trừ trước khi validate | `state.meta.turn += 1` rồi resolve | "Validate toàn bộ trước mutation"; lỗi trước commit không đổi state | `engine.js:5899-5902`; `expansion.js:4266` |
| A13 | Offline bundle lệch runtime | `index.offline.html` cũ | "bundle offline chứa cùng runtime mới nhất với index.html" | `CHARACTER_CANONICAL.md:470`; `DATA_RUNTIME_CANONICAL.md` |
| A14 | Ledger không bounded | `rewardLedger`, `evolution.progressKeys`, `npc.mailbox`, `specialPhysiqueState.history`, `pathState.history` không trim | Budget/retention tường minh cho ledger | grep; xem C9 |
| A15 | Retention NPC memory tự mâu thuẫn | có chỗ cap 20, có chỗ cap 10, validator fail khi >10 | "NPC memory max 20" | `expansion.js:1935` (20) vs `:2980` (10) vs `:2897` (validator >10 = lỗi) |

---

## 3. PHẦN B — MISMATCH THEO TỪNG FEATURE

### 3.1. FATE / Mệnh Số (`features/01-fate/FATE_CANONICAL.md`)

**M1 — Bảng trọng số bậc `9+` cho Tiên trọng số khác 0.**
`engine.js:3264`: `FATE_REWARD_WEIGHTS["9+"] = {…, thanh:11, tien:0.01}`. Canonical: hàng `9+` = `1/5/15/25/25/18/11/0` — **Tiên phải là 0**. Vì `rollFateByProgression` (`engine.js:3288`) chỉ loại Tiên khi đã có chủ, một `than_dao_151` **vô chủ vẫn là ứng viên 0.01%** và có thể rơi từ reward thường cho tới khi được sở hữu lần đầu.

**M2 — Shared resolver xoá sạch Mệnh Hung khỏi mọi pool thưởng.**
`engine.js:3286`: `if (rank < minimum || (cap && rank > cap) || fate.sign === "hung") return false;`.
Requirement dùng trọng số **theo phẩm cấp**; `sign` không phải tiêu chí lọc. Hệ quả: mọi call của resolver (`grantBreakthroughFate:3493`, combat `:4964/:4966`, map clue `:4767/:4768`, online `:5158`, fusion `:2499`) **không bao giờ** trả Hung. Cách duy nhất sở hữu Hung là 5 Mệnh khởi tạo (`drawInitialFates:819`). Điều này làm `defyFate` (yêu cầu Mệnh Hung) gần như vô dụng sau khi chơi lâu.

**M3 — Resolver thiếu options canonical.**
Canonical: `rollFateByProgression(state,{source,gradeCap,minimumGrade,pathAffinity,pityKey,allowUniqueTien})`. Code (`engine.js:3278-3303`) chỉ đọc `level`, `gradeCap`, `minimumGrade`, `allowUniqueTien`. `source`/`pathAffinity`/`pityKey` **không được đọc** → source modifier, thiên hướng Con Đường và pity không tồn tại.

**M4 — Fallback phẩm cấp tái chuẩn hoá thay vì dồn trọng số xuống bậc gần nhất.**
`engine.js:3292-3301`: lọc bảng theo grade có sẵn rồi tái chuẩn hoá; nếu không còn grade nào, lấy entry bậc thấp nhất trong **toàn pool** (`:3300`) — có thể cách xa bậc liền kề. Canonical: "không mất trọng số, không roll hụt" → phải dồn sang bậc thấp hơn gần nhất.

**M5 — `nurtureFate` tự nhảy bậc, bỏ qua behavior gate.**
`engine.js:558-559`: `stage===0 && points>=1 → stage=1`; `stage===1 && points>=4 → stage=2`. Canonical: 0→1 cần elite/boss **hoặc 7 ngày active**; 1→2 cần **≥3 lựa chọn aligned**. Dưỡng Mệnh chỉ nên cộng điểm.

**M6 — 3→4 không nối vào đột phá.**
Canonical: 3→4 = Cộng Minh + đột phá thành công khi Mệnh vẫn active. Chỗ duy nhất gán `stage=4` là `expansion.js:3483` (`evolveFate`). `grantBreakthroughFate` (`engine.js:3483-3499`) và `maybeBreakthrough` **không chạm** `fateRelationships[*].stage`.

**M7 — Không enforce khoá tháo ở bậc 4.**
Canonical: bậc 4 "không thể bị tháo/hi sinh/dung hợp". `storeFateToVault` (`engine.js:2419-2428`) và `swapFateFromVault` (`:2392-2405`) **không có** kiểm tra stage; `mergeFates` (`:2492`) và `sacrificeFate` (`:2349`) cũng không.

**M8 — Nhiều nguồn thưởng hardcode, bỏ resolver.**
- Chợ: `engine.js:1993` `filter(f => f.grade === "phan" && f.sign !== "hung")`.
- Chợ đen: `:2014` filter `grade>=2 && <=8` + shuffle, không resolver.
- Quà Con Đường: `:2152` `grade === "phan"`.
- Công Đức: `:2318` `["phan","linh","hoang"] && sign!=="hung"` rồi sort theo score (không trọng số).
- Chuỗi nhiệm vụ tìm kiếm: `:4307-4308` chọn Mệnh tương thích cao nhất **không cap grade, không guard Tiên độc nhất**.

**M9 — Trùng Huyền+ không có lựa chọn người chơi.**
`engine.js:2284` trả về từ chối thẳng `{added:false, duplicate:true, reason:"…cần xử lý thay thế hoặc dung hợp."}`. Canonical đòi popup cho người chơi chọn (Tinh Hoa Dư **hoặc** tặng/bán). Không có API/popup nào.

**M10 — `mergeFates` vẫn cap ở `thien`, không dùng catalog fusion.**
`engine.js:2499` roll với `gradeCap: Math.min(6, minRank+2)`. 78 `fusion_recipes` đã chuẩn hoá trong `data/fate_relationships.js` **không được dùng** (`fateFusionRecipesFor` ở `:524` không có caller).

**M11 — Cap thưởng online vượt dải canonical và thứ tự sai.**
`engine.js:5157-5158` `maxRank = Math.min(8, dominant.rank+1)` — với Mệnh Huyền+ active, online có thể trao Địa/Thiên. Canonical: online ưu tiên 1–3. Ngoài ra `nextOnlineFateDay` được tăng **sau** khi resolve (`:5159`), trong khi canonical yêu cầu tăng **trước**.

**M12 — Công thức match-score bị early-return chặn; clamp khác canonical.**
`fateCompatibility` (`engine.js:2203-2205`) `return 10 / 6 / 1` trước khi bao giờ đánh giá `3×lead + 1×support − 2×forbidden` (chỉ tới được ở `:2210`). `pathMatchSummary` (`:2225`) clamp `0..20`, không phải `0..10`.

**M13 — Cost/duration của advanced action không đọc từ catalog.**
`defyFate` hardcode `cost=15` (`:675`), `suppressFate` `8` (`:688`), `heavenlyOmen` cooldown `now+12` (`:699`, catalog có `cooldownTurns:12`), `transformFate` `san:10` (`:707`), breakdown hardcode `0.03`/cap `5` (`:657,660`). Chỉ `nghichMenh.maxUses` và `tranMenh.durationTurns` là đọc từ catalog.

**M14 — `fateDefinition()` không phải API chuẩn hoá thực tế.**
`engine.js:506-510` có export (`:6435`) nhưng **không có caller nội bộ**; UI đọc field thô (`ui.js:1164-1165,1181`). `resonanceEffect` không được xử lý ngoài spread `...source`.

### 3.2. CHARACTER CREATION + PROGRESSION (`features/02-character`, `03-progression`)

**M15 — Ngưỡng Neo Nhân Tính không khớp.** `anchorCandidates` (`engine.js:3076-3077`): `if (trust < 20 && respect < 15) return null;` → đủ điều kiện khi **trust≥20 HOẶC respect≥15**. Canonical: `trust>=55 AND respect>=35 AND suspicion<=35 AND fear<=50` + một tương tác có nghĩa. `suspicion`/`fear` không được đọc.

**M16 — Giới hạn Neo bị hạ xuống 1.** `establishHumanAnchor` (`engine.js:3084-3085`) từ chối nếu **bất kỳ** anchor nào đang active. Canonical: **tối đa 3 Neo**, mỗi nghi thức chọn 1 Neo chủ đạo.

**M17 — Schema anchor lệch.** `engine.js:3086` tạo `{id,name,source:"npc",npcId,stability,integrity:"intact",broken:false,establishedAtTurn}`. Canonical: có `type` (`npc|place|memory|oath`), `status` (`active|strained|broken`), `maxStability`, `lastNurturedAt`, `source:"npc_relationship"`. Thiếu `type`, `status`, `strained`.

**M18 — Anchor không lọc loại NPC.** Bất kỳ key nào của `state.relationships` đều đủ điều kiện — kể cả merchant random (`giftNpc` ghi vào `state.relationships`, `expansion.js:2964-2981`). Canonical: chỉ `persistent_named`/`bondable_encounter`, và merchant phải hoàn tất "Ghi nhớ danh tính".

**M19 — `pathMatchSummary` clamp 20 và trộn daoBonus.** `engine.js:2224-2225` `clamp(lead*3 + support - forbidden*2 + daoBonus, 0, 20)`. Canonical: `clamp(…, 0..10)` và Đạo Tâm không được trộn cùng trường.

**M20 — `required_path_score` không theo công thức.** Engine đọc `next.requiredPathScore` từ data (`engine.js:3175`); công thức `3 + floor(realm_index/2)` không được cài. Data lệch: `kim_an` lvl4 = 5 (công thức 4), `than_tinh` lvl6 = 6 (5), `hop_dao` lvl8 = 8 (6).

**M21 — Ngoại Đạo Giả ghi vào `pathId`.** `selectPath` (`engine.js:2137-2143`) đặt `state.player.pathId = "ngoai_dao_gia"`. Canonical: namespace `unbound`, **không** ghi `pathId`.

**M22 — Thứ tự kiểm tra unbound sai.** `pathRelation(pathId)` được gọi **trước** kiểm tra unbound (`engine.js:2214,2199-2200`). Canonical: unbound phải chạy trước `pathRelation()`.

**M23 — `fateVaultCapacity` dùng activeSlots của realm.** `engine.js:2112-2120` và deserialize `:6377` dùng `realm.activeSlots * 2`. Canonical: `equippedIds.length * 2`. Bằng nhau ở nhân vật mới 5/5, lệch khi equipped ≠ realm slots.

**M24 — Không gate song tu.** `transitionSecondaryPath` (`expansion.js:933-951`) không có gate cảnh giới và không có gate `match_score>=5`. Canonical: song tu mở từ cảnh giới 6 với `match_score>=5`.

**M25 — Kế hoạch nghi thức không khớp yêu cầu cảnh giới.** Data: `kim_an` (lvl4) `requiresStableAnchor:true`, `anh_linh` (lvl5) `requiresBodyAndMind:true`. Nhưng `breakthroughRitualPlan` (`engine.js:3033-3040`) cho lvl4 chỉ `[call_fate, compare]` và lvl5 `[call_fate, compare, anchor]` → **không có cổng `anchor` ở lvl4, không có cổng `omen` ở lvl5**. Người chơi có thể bị chặn bởi "Neo ổn định ≥50" mà không có bước Dựng Neo.

**M26 — `requiresBodyAndMind` là field chết.** `data/data.js:67` map từ `requires_body_and_mind` nhưng **0 lần được tham chiếu** trong engine/expansion.

**M27 — Generator Node không sinh được Phàm.** `character_generator.js:67-68` dùng map `{pham:1,…}` trong khi `FATE_DATA` dùng `grade:"phan"` → `(fate.tier || gradeRank[fate.grade] || 99) <= 3` trả 99 cho mọi Phàm → **bị lọc khỏi `eligible`**, nhánh 65% Phàm rơi vào pool rỗng. Engine dùng đúng `"phan"` (`engine.js:813,454`).

**M28 — Rarity map của `suggestFateForRealmRequirement` cũng sai typo.** `engine.js:3219` `{pham:1,…}[fate.grade]` → mọi Mệnh là rarity 1.

**M29 — `secludedCultivation` sai đơn vị.** `engine.js:3792-3820`: `(state, hours=1)` clamp **1–8 giờ**, `daysPerHour = 120` → 1 giờ = **120 game-day**. Canonical: `startSecludedCultivation({days})` **1–30 ngày**, thoát sớm tỉ lệ, `riskRolls.echo/intrusion`.

**M30 — `giftNpc` thiếu cap/giảm dần/nghĩa vụ.** `expansion.js:2011-2021` có tag match và `uniqueKey` theo ngày, nhưng **không** cap điểm/ngày/NPC, không giảm dần, không cờ nghĩa vụ/nợ/lòng tham, không loại trừ item quest/đang trang bị/khóa.

**M31 — `state.pathState` thiếu trường canonical.** `expansion.js:432-441`: `{schemaVersion, primaryPathId, secondaryPathId, hiddenPathId, dormant, history, fusionAffinity}`. Thiếu `pathVariant`, `hybridPath`, `pathLevel`, `ritualByPath`, `transitionHistory`, `detachHistory`.

**M32 — `player.*` không phải projection thuần.** `engine.js:2139,2147`; `expansion.js:946` ghi trực tiếp; `expansion.js:439-441` `ensure` đồng bộ `state.player.x = state.player.x || state.pathState.x` → field player có thể thắng.

### 3.3. PROFESSION / HIDDEN PATH / DỊ THỂ (`features/03-progression`)

**M33 — `professionState.primaryLocked`/`secondaryLocked` không tồn tại.** `expansion.js:586` khởi tạo `{schemaVersion:2, primaryId, secondaryId, hiddenId, hiddenIds, professions}`. `chooseProfessionLocked` (`expansion.js:3190-3197`) chỉ set `selectionLocked`. Hai identifier chỉ xuất hiện trong `tools/verify_dichi_deep.js:141` (ghi nhưng không assert) và docs.

**M34 — Hidden path bị cài nhầm thành hidden profession.** `data/expansion_data.js:137-140` định nghĩa `cuong_ngon_gia`, `thuc_canh_su`, `huyen_anh_su`, `vong_nga_su` trong `hiddenProfessions` với `kind:"tu_tich"`. Không có catalog `hiddenPath`/`hiddenPaths` (grep 4 id canonical `cuong_ngon_dao/thuc_canh_dao/huyen_anh_dao/vong_ngu_dao` = chỉ có trong docs + `tools/verify_dichi_deep.js:22`). `pathState.hiddenPathId` chỉ init/mirror, **không điều khiển effect nào**.

**M35 — Bốn entry Cổ Thần Tàn Hồn dùng chung một `linkedTaThanId`.** `expansion_data.js:137-140` đều `linkedTaThanId: "ta_than_tien_trieu"` (cùng template omen ở `:45`). Canonical đòi 4 Tà Thần phân biệt.

**M36 — Lệch id Codex ↔ profession thứ 4.** `expansion_data.js:127` `unlocksHiddenProfession[3] = "tho_san_di_triều"` (có dấu tổ hợp) nhưng key catalog là `tho_san_di_trieu` (`:133`). Hệ quả: graph builder (`expansion.js:514-522`) không tìm thấy codex → `lead.sourceId`/`crosscheck.regionId` = `null`.

**M37 — Namespace path còn dùng id tiền-canonical.** `data/path_fate_relations.js:11-18` key `dan_dao, phu_dao, ngu_thu_dao, khoi_loi_dao, mong_canh_dao`; `data/cong_phap.js` `pathAffinity` tham chiếu `dan_dao/phu_dao` (`:26`), `mong_canh_dao/ngu_thu_dao` (`:34`), `khoi_loi_dao` (`:69`), `phong_thuy_dao/phu_dao` (`:83`). Canonical đòi `di_hoa, thien_co, linh_van, thien_menh, dao_the, kiem_dao, ngu_thu, khoi_loi, ta_am, mong_canh`.

**M38 — Schema `specialPhysiqueState.history` lệch.** Canonical `{id, trigger, day, cost, result}`. Code (`expansion.js:986`) push `{id, day, source, stage, branch}`; validator chỉ kiểm `id/day/stage` (`:905-908`).

**M39 — Cost Dị Thể ngoài SAN không bao giờ được áp.** Catalog `thanh_the:{taintedAttention:2}`, `hon_don_the:{daoTamGainMult:0.50}`, `van_doc_the:{healingBlocked:true}`, `cuu_u_the:{corruptionGain:1}`, `bat_tu_the:{lifespan:12}`, `thien_sinh_dao_the:{uniqueClaim:true}` (`expansion.js:679-684`). `claimSpecialPhysique` (`:978-989`) chỉ trừ `cost.san`. Các key kia chỉ xuất hiện trong catalog + label map UI (`ui.js:411-415`).

**M40 — `pathState` bị coi là "dormant" thay vì namespace tách.** `pathState.dormant` tồn tại nhưng không có field `dormant`/`active` trên record nghề/ẩn — trạng thái dormant chỉ ngầm định qua `hiddenProfessionState.unlocked`.

### 3.4. MAP / WEATHER / WORLD SIMULATION (`features/04-world`)

**M41 — `ownerFactionId` bị lưu, không phải derived.** `expansion.js:2324` `node.ownerFactionId = result.ownerFactionId;` và ghi đè trực tiếp ở `:2552`, `:2562`. DTO `:2323` đọc lại field đã lưu → owner cũ tồn tại qua lần recompute. Canonical: "phải là getter dẫn xuất từ `influenceMap`, không bao giờ lưu".

**M42 — Công thức influence cộng-tuyến, không nhân; không clamp.** `expansion.js:2316,2318-2320`: `power * warPressure * 0.7^distance + eventInfluence` rồi `+= structureInfluence`. Canonical: `power * 0.70^distance * (1 + structureBonus + outpostBonus + eventBonus)`, clamp `[0,100]`. Code: (a) nhân thêm `warPressure` (1.12), (b) **cộng** event/structure thay vì gói vào `(1+…)`, (c) **không có `outpostBonus`**, (d) **không clamp**.

**M43 — Ngưỡng owner/stable/frontier sai.** `expansion.js:2323`: owner khi `top[1] >= 10` (canonical `>= 35`) và chỉ có cờ `contested`, **không có** `stable`/`frontier`.

**M44 — Cache influence không theo 4 version counter, không invalidate theo faction/war/weather.** `expansion.js:2205` chỉ `influenceRevision += 1`. `invalidateMapInfluence` được gọi từ structure lifecycle + `recordMapEventInfluence` + `claimOutpost`/`petitionOutpostToFaction`, **không** từ `setWeather`/`updateWeather` (`:1331-1342,1412-1424`) hay `updateWars`/`updateDiplomacy`. Canonical: cache key gồm `worldTick + factionVersion + structureVersion + eventVersion`.

**M45 — Consumer dựng bảng weather thứ hai.** `expansion.js:2522` `weatherWeight = {quang:1, mua:1.08, …, bao_linh_khi:1.3}[weatherId] || 1` + nhánh hardcode ở `:2513` (`mua` ×0.8, `tuyet` ×0.6). Canonical: consumer **không được** suy ra bảng weather/severity thứ hai; phải dùng `weatherSnapshot(...).effects`.

**M46 — Tooltip vùng không có fallback `description`.** `ui.js:848` `escapeHtml(region.description + …)` → nếu vùng thiếu `description`, tooltip render literal `undefined`. Canonical: fallback `desc`/tên vùng. (`ui.js:1068,1151` có fallback, `:848` thì không.)

**M47 — World tick ghi text UI trực tiếp.** `expansion.js:1340` (`setWeather`), `:1363` (`startWorldEvent` gọi trong tick), `:1465` (`updateWars`), `:1619` (`updateNpcSchedules`), `:1800,1805,1813` — tất cả gọi `history(state,"narr"/"warn",…)`. Canonical: tick **không** được ghi text UI; phải phát structured event.

**M48 — Miền toạ độ: code dùng `0..100`, không phải `[-50,49]`.**
`engine.js:3865` `OPEN_WORLD_BOUNDS = {min:0, max:100}`; mọi bounds check dùng 0..100 (`:3977,3989,4018,4065,4095`; `expansion.js:2303,2257,2262`; `data/data.js:339`). Miền `[-50,49]` chỉ có trong `MAP_CANONICAL.md:712,1106`; `WORLD_MAP.coordinateSystem` **không tồn tại** trong data nào.

**Hướng Bắc/Nam — code theo contract mới, tài liệu cũ sai:**
`engine.js:3863` `OPEN_WORLD_DELTAS = { bac:[0,-1], nam:[0,1], dong:[1,0], tay:[-1,0] }`; `ui.js:1042` dùng cùng bảng; `tools/verify_game.js:600,632` assert `bac → y-1`. → **Code đúng theo contract "TRACE RECOVERY"**; sơ đồ ASCII cũ ở `MAP_CANONICAL.md:741-747` (`Bắc (y+1)`) là text chết.

**M49 — `mapFogState` chặn cứng fog ≥3 mở fast travel.** `expansion.js:2377` `if (node.fogState >= 3) node.fastTravelUnlocked = true;` — buộc fast travel vào fog thay vì rule waystation/anchor.

### 3.5. NPC / RELATIONSHIP / COMPANION (`features/05-interaction`)

**M50 — Rumor: floor và TTL sai.** `expansion.js:299` `RUMOR_POLICY = {…, minConfidence: 0.2, defaultTtlDays: 30}`. Canonical: clamp `[0.1,1]`, TTL **14** ngày. Hằng số này lan ra `:1485`, `:556`, `:1617`, `:1940`, `:2045`.

**M51 — Queue ghi đè combat/shelter.** `expansion.js:1597-1602` chạy vô điều kiện cho mọi NPC sống tại node → NPC vừa được gán `aiState="combat"` (`:1524,1553`) hoặc `"shelter"` (`:1533,1537,1547`) bị đổi thành `"queued"`. Canonical: combat/shelter phải ưu tiên cao hơn queue.

**M52 — `aiState` có giá trị ngoài enum.** `expansion.js:56-57` set `"sleeping"`; validator whitelist nó ở `:1633`. Canonical enum: `idle|present|travel|shelter|combat|interact` (+`queued`).

**M53 — Footprint lưu (và tiết lộ) điểm đến.** `expansion.js:1576` `push({npcId, departedDay, destinationHint: next, trailId})`; action trả về `destinationHint` ở `:3877`. Canonical: chỉ lưu node nguồn/ngày/npcId/**clue class**, **không bao giờ** điểm đến hiện tại; không được tiết lộ toạ độ hay phá fog. Không tồn tại field `clueClass`.

**M54 — Settlement: đếm sai, roll sai, uniqueness sai.** `expansion.js:1579-1588`: (a) đếm **lượt ghé** chứ không "≥8 lượt ghé **khác ngày**"; (b) `seeded(state,"settlement:"+npcId+":"+next) < 0.2` **không có thành phần ngày** → cố định theo npc+node, và chạy mỗi lần tới chứ không theo nhịp tháng; (c) key uniqueness chỉ theo node (`settlements[next]`), canonical là **NPC + node**; (d) không kiểm tra capacity node.

**M55 — Uy hiếp báo phe 45%, không phải 30%.** `expansion.js:2032` `seeded(…,"intimidate-report:"+npcId,day) < 0.45`.

**M56 — Quà: disliked −5 (không phải −6) và ghi cả trust.** `expansion.js:2018-2019` `delta = disliked ? -5 : liked ? 8 : 1` và `deltas: {affection: delta, trust: liked ? 2 : 0}`. Canonical: liked +8 / neutral +1 / disliked **−6**, và "Quà chỉ ảnh hưởng affection".

**M57 — Ngưỡng betrayal 75, không phải 70.** `expansion.js:2082` `trust >= 75`.

**M58 — Gossip sửa dimension trực tiếp ngoài producer.** `expansion.js:1998-2003` ghi `suspicion`, `affection`, `respect` và tự tính lại `.score`. Canonical: "không social action nào được sửa field lưu trữ ngoài event producer".

**M59 — Rumor chấp nhận theo priority trước, không theo confidence.** `expansion.js:1487` từ chối rumor có confidence cao hơn nhưng priority thấp hơn. Contract: "chỉ nhận nếu confidence tới **>** confidence đã lưu".

**M60 — NPC đang `queued` vẫn tương tác được.** `npcTalk` (`:1985`) và `npcActionPresentation` (`:1968`) chỉ gate theo node/sub-location, không loại `aiState==="queued"`; `expansionActions` (`:3778`) đẩy action talk cho mọi NPC địa phương.

**M61 — Trigger khủng hoảng kế vị dùng năm, không phải ngày.** `expansion.js:2664` `maxLifespan - age <= 5` (tuổi tính bằng **năm**). Canonical: "còn tối đa **30 lifespan-day**".

**M62 — Người kế vị được nới rộng ngoài `su_do`.** `expansion.js:2681` `candidate.masterNpcId === npc.npcId || relationshipsWithNpcs[npc.npcId]?.type === "su_do"`. Canonical: **chỉ** quan hệ `su_do` tường minh.

**M63 — Companion revive: code 3 Linh Thạch / 25%; tài liệu audit nói 12 / 35% / soul_scar.** `expansion.js:1100-1101` khớp `COMPANION_CANONICAL.md:40` nhưng **mâu thuẫn** `AUDIT_CANONICAL.md:1251,1267`. Không tồn tại field `soul_scar`, không có 12 cost, không có behavior enemy-retarget-companion. → Cần chốt tài liệu nào là nguồn sự thật.

**M64 — `normalizeCompanion` thiếu default bắt buộc.** `expansion.js:994-1008` chỉ default `hpMax/hp/role/guardStance/skillMastery/damageLedger/lastDamageSource/recoveryUntilDay/reviveCount`. **Không** default `state`, `entityId`, `customName`, `loyalty`, `corruption`, `mutationPending`, `mutation`, `passiveId`. Hệ quả: save cũ `{hp,hpMax}` giữ `state:undefined` và bị validator **từ chối** thay vì migrate.

### 3.6. TECHNIQUE / DISCOVERY / REWARD / CROSS-SYSTEM (`features/06-content`, `09-cross-system`)

**M65 — Resolver canonical không tồn tại.** `buildTechniqueContext`, `resolveTechnique`, `commitTechniqueResolution` — **0 hit**. Preview (`engine.js:1701`) và commit (`:1745`) là hai đường viết tay không đồng bộ.

**M66 — DTO canonical bị bỏ qua, resolver đọc `visibleStats`.** `techniqueCatalog` chuẩn hoá `cost/effect/risk` (`engine.js:1518-1531`) nhưng `resolveTechniqueCosts` (`:1650`) và `techniqueCombatProjection` (`:1676`) đọc `technique.visibleStats.*`. Corruption dùng `technique.corruptionProfile?.baseCorruptionGainPerUse` (`:1656`), không `technique.risk.corruptionProfile`.

**M67 — Thứ tự pipeline cost không được tôn trọng.** `resolveTechniqueCosts` (`engine.js:1650-1658`): (a) **không có bước guild**; (b) stamina bỏ evolution (`visible.staminaCost * stats.staminaCostMultiplier`, `:1653`); (c) `sanCost` thiếu mastery multiplier (`:1654`) trong khi mana/stamina có; (d) `lifespanCost` là raw (`:1655`), không mastery/evolution/stance, không làm tròn 2 chữ số.

**M68 — Cooldown bỏ evolution.** `engine.js:1793-1795` chỉ dùng `visible.cooldownSeconds/5` × mastery stage. `evolution.cooldownPct`/`caps.cooldownReductionPct` không bao giờ được áp.

**M69 — Kinh tế "cộng trong nhóm rồi nhân một lần" không tồn tại.** `techniqueCombatProjection` (`engine.js:1692-1697`) nhân độc lập từng nguồn (evolution, world, stance, mastery, element, comprehension, fate, guild, family, origin, corruption). Chỉ có cap Fate resonance và 2 cap guild. Không có cap/cộng theo nhóm.

**M70 — Blocker shape và bộ mã lệch.** `techniqueEligibility` (`expansion.js:3312-3345`) trả `{code,message}` thay vì `{code, scope, sourceId, playerText, recoverable}`. `NOT_LEARNED`, `TECHNIQUE_DORMANT`, `COOLDOWN`, `RESOURCE_SHORTAGE` không bao giờ được eligibility phát. Không có check "learned" → thứ tự learned→realm→path/Fate→guild/faction→target/cooldown→resource không thể đúng.

**M71 — Guild member validity không được ép.** `guildTechniqueSnapshot` (`expansion.js:3346-3357`) chỉ kiểm `!membership || membership.suspended`, không kiểm `guildId`/`rank` tồn tại. Sau `resolveOrganizationDefection` (`:2089-2108`) code để lại stub `state.guildMembership ||= { betrayedOrganizations: [] }` (`:2100`) không có `guildId`/`rankId` → snapshot trả `valid:true` và cộng +5/+5 mastery cho **mọi** kỹ thuật.

**M72 — Suspension không thể xảy ra.** Không chỗ nào ghi `guildMembership.suspended`; chỉ đọc (`:3343,3348,3361`).

**M73 — Revision không tăng khi demotion.** `promoteAfterFailedLifeCommission` (`expansion.js:205-213`) giảm `rankIndex`/`rankId` mà không tăng `membership.revision`. `promoteGuildMember` (`:141`), `joinGuild` (`engine.js:2834`), `leaveGuild` (`:2915`) thì có → không nhất quán.

**M74 — Reward key hidden realm không canonical và va chạm.** `claimHiddenRealmCore` (`expansion.js:3626`) dùng `active.cycleIndex + ":main"` (ví dụ `"1:main"`), không phải `hidden_realm:<id>:<cycle>:<reward>`. Vì key ghi vào `state.rewardLedger` **toàn cục**, hai realm khác nhau cùng cycle (đều bắt đầu cycle 0) **dùng chung `"0:main"`** → core reward của realm thứ hai bị từ chối oan dù `runtime.claimedRewardKeys` của nó rỗng.

**M75 — Contested opportunity: cửa sổ 12 ngày, seed theo turn, tag sai.** `createContestedOpportunity` đặt `expiresDay = day + 12` (`expansion.js:4105`); canonical `createdDay + 3`. `resolveContestedOpportunity` seed `seeded(state,"opportunity-resolve:"+choice, opportunity.id, state.meta.turn)` (`:4121`) → roll phụ thuộc `meta.turn`, không chỉ opportunity id. `share` ghi tag `"shared_opportunity"` (`:4119`); canonical MVP tag `shared_reward`.

**M76 — Ownership layer đảo.** Canonical: engine sở hữu eligibility + resolver + transaction; expansion sở hữu policy catalog + producer. Thực tế: `techniqueEligibility` (`expansion.js:3312`) và `techniqueFateResonance` (`engine.js:1660`) nằm sai phía; engine gọi `window.GameExpansion.techniqueEligibility` (`engine.js:1587,1704`).

**M77 — Thiếu `featureVersions.techniqueCrossSystem`.** `expansion.js:466` set 10 key canonical, thiếu `techniqueCrossSystem` (addendum §Migration đòi =1).

**M78 — Discovery summary là read-model nhưng có mutation.** `expansion.js:3057-3073` ghi `entry.status = status` **bên trong** read model (`:3066`) và duyệt **mọi** category kể cả `codexClues` (`:3062`) — entry `codexClues` tạo không có `status` (`:1168,1172`) nên bị ép về `"discovered"` và làm phồng `total`/`byStatus.discovered`. `validateDiscoveryLifecycle` **bỏ qua** `codexClues` (`:3076`) → hai read path canonical bất đồng.

### 3.7. UI / ACTION / LOG + PLATFORM (`features/07-ui`, `08-platform`)

**M79 — Save schema chuỗi sai.** (trùng A9) `engine.js:6233-6238` `{version:12, schema:"tu_vi_quy_di_final"}`.

**M80 — World clock epoch/năm sai và shape sai.** `engine.js:5108,1895-1904`: epoch = `(6087-1)*360+1 = 2190961`, `worldClock.currentYear = 6087`. Canonical §2.2: `startDayIndex: 2475360` → Năm 6876. Canonical §8.2 đòi test formatter "Day 2,475,360". Ngoài ra code dùng **top-level** `state.worldClock`, canonical đòi lồng trong `gameClock.world.{epochDate,startDayIndex,currentDayIndex,…}`.

**M81 — `ACTION_DEFAULTS.surface` mặc định "quick".** `engine.js:5780` → mọi action không khai `surface` (act_menh, act_to_chuc, act_giup, act_ban_do, …) đều vào quick bar. Canonical §12/§7: tier 3 mặc định nằm trong "Thêm"; chỉ action khai `surface:"quick"` rõ ràng mới lên quick bar.

**M82 — UI tự tính lại `surface`, bỏ DTO của resolver.** `ui.js:121-123` suy `surface` từ `tier`, ghi đè `action.surface` từ engine. Canonical: "UI chỉ trình bày kết quả resolver".

**M83 — Action hướng đi rời rạc thay vì gom nút.** `engine.js:5565-5578` + `ui.js:137` tạo một chip **mỗi hướng** (`act_move_bac/nam/dong/tay`). Canonical §8.1: gom thành một nút `Di Chuyển` mở bản đồ. **Lưu ý:** `tools/verify_ui_surface_contract.js:51` lại assert **ngược lại** (yêu cầu nút gom phải vắng) → test và requirement mâu thuẫn; runtime theo test.

**M84 — `absoluteDay` trả world-day, không phải player-day.** `expansion.js:21-27` trả `worldAbsoluteDay + playerDay - worldSyncedPlayerDay` khi `clock.worldAbsoluteDay` được set (luôn được set ở `engine.js:1888`). Canonical §2.4/§2.5: "expansion `absoluteDay()` → Player Day Index 1-based; không đổi sang World Day, cần thì thêm `absoluteWorldDay()` riêng".

**M85 — Audit random boundary bỏ sót file.** `tools/verify_random_boundaries.js:8-14` `SOURCES = js/*.js + gemini-code-…js + character_generator.js`. **Không quét** `webgame/app.js` (có `Math.random`), `index.offline.html` (runtime nhúng, có `Math.random`), `data/*.js`, `tools/*.js`. Canonical: "static audit discovers **every** JS source plus root generators".

**M86 — Regression suite thiếu gate đã được đặt tên.** `tools/run_regression_suite.js:7-19` kiểm 11 file, **bỏ** `verify_expansion_log_matrix.js` (được gọi là gate ở `UI_ACTION_LOG_CANONICAL.md:536`), `verify_indexeddb_archive.js`, `profile_runtime_budget.js`, `verify_random_boundaries.js`, `verify_asset_references.js`.

**M87 — Bundle offline lệch.** (trùng A13/G14) CSS version cũ (`styles.css?v=20260917-map-star-spawn` vs `index.html:7` `v=20260921-local-starfield-v1`), DOM thiếu `#pinned-character-summary`, runtime nhúng **0** `emitEvent`, **0** `renderPinnedCharacterSummary`.

**M88 — `renderStatus` / hai clock.** Canonical đòi `#game-clock` và `#world-clock` tách biệt, world clock là nguồn ngày chuẩn cho world sim, và `renderStatus` phải gọi `contextState(state).actions` để render action khả dụng. Kiểm tra cho thấy phần này **đạt** (pinned summary suppression ở `ui.js:253-256`, một delegated listener ở `main.js:334`) — giữ lại đây để làm mốc so sánh.

---

## 4. PHẦN C — LỖ HỔNG LOGIC TIỀM ẨN TRONG CODE HIỆN TẠI

### C1. Entropy / determinism

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C1.1 | CAO | `webgame/app.js` điều khiển gameplay bằng `Math.random()` | `webgame/app.js:12` |
| C1.2 | CAO | `ItemGenerator.defaultRandom = () => Math.random()` — mọi caller trừ một đường của engine đều là entropy | `gemini-code-1788430656294.js:91`; và `idSeed` mặc định dùng `Date.now()` (`:114`) |
| C1.3 | TB | `character_generator.js` entropy khi không inject rng | `character_generator.js:30` |
| C1.4 | TB | `replayRandom` **fail-open** về `Math.random()` khi thiếu `worldRandom` hoặc khi `Math.random` bị instrument → determinism chỉ là best-effort | `engine.js:52-57` |
| C1.5 | TB | `replayRandom` seed bằng `state.gameClock.currentDay` (**ngày trong tháng**), không phải day ordinal → roll alias giữa các tháng | `engine.js:55` |
| C1.6 | TB | Loot roll không có uniqueness theo instance/day → đánh cùng entity cùng ngày ra cùng drop; `rollEntityLoot` **không có idempotency key** | `engine.js:4835-4846` |

### C2. Thời gian thực lọt vào logic gameplay

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C2.1 | CAO | Cooldown Chuyển Sinh dùng `Date.now() + 86400000` → chỉnh đồng hồ hệ thống là lách được, và không tiến theo offline/game time | `engine.js:6043,6061` |
| C2.2 | TB | Regenerate offer chợ theo ms thực (`refreshIntervalMs:60000`), timestamp thực **được lưu vào save** | `engine.js:1987-1995` |
| C2.3 | TB | ID event dùng `Date.now()` → ID không deterministic giữa các session, phá `validateReplayEnvelope` | `engine.js:5448` |
| C2.4 | THẤP | `expiresAt: Date.now()+86400000` trên quest — **không bao giờ được đọc** (dead latent timer) | `engine.js:2601` |

### C3. `catch` rỗng / nuốt lỗi

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C3.1 | TB | `readRecent()` biến mọi lỗi đọc IndexedDB thành "thành công rỗng" — không phân biệt được "chưa có archive" vs "đọc hỏng" | `main.js:85` |
| C3.2 | TB | `load()` của webgame nuốt save hỏng → coi như nhân vật mới, mất dữ liệu im lặng | `webgame/app.js:7` |
| C3.3 | **CAO** | `expansion.js` và `ui.js` **không có một `catch` nào** → mọi throw từ resolver là uncaught, turn đã bị tiêu | grep `catch` |
| C3.4 | THẤP | Sửa mojibake fail-open (`catch(_) { return run; }`) | `engine.js:5292` |

### C4. Resolver sửa catalog tĩnh

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C4.1 | CAO | Quest động ghi thẳng vào `GameData.QUESTS` (tích luỹ 1 entry/địa điểm đã tìm) | `engine.js:4309` |
| C4.2 | CAO | Item procedural ghi vào `GameData.ITEMS`, không bao giờ gỡ | `engine.js:2511` |
| C4.3 | TB | Quest "co_duyen" ghi vào `GameData.QUESTS` | `engine.js:2600` |
| C4.4 | TB | `profession_items` ghi vào `D.ITEMS` **mỗi lần `ensure()`** — tức mỗi deserialize và mỗi action | `expansion.js:501` |

### C5. Trừ trước – validate sau / mutation không rollback

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C5.1 | **CAO** | `state.meta.turn += 1` trước resolver; không rollback nếu throw | `engine.js:5899-5902`; `expansion.js:4266` |
| C5.2 | TB | Đấu giá: kiểm tra khả năng chi trả **không tính khoản hoàn** đang chờ → từ chối oan khi bid lại; hoàn+trừ là hai mutation không đồng bộ | `expansion.js:4044-4046` |
| C5.3 | TB | Mua Mệnh ở chợ: có rollback cho nhánh trả `false` nhưng **không** cho nhánh `receiveFate`/`addItem` throw | `engine.js:2005-2009` |
| C5.4 | THẤP | Cộng rồi trừ contribution như "compensation" — đúng chỉ vì cả hai nhánh cùng chạy, phụ thuộc thứ tự | `engine.js:2641-2646` |
| C5.5 | THẤP | Tạo bucket structure trước gate cost/eligibility | `expansion.js:2456` |

### C6. Đổi vị trí khi đang travel / teleport

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C6.1 | **CAO** | `hiddenRealmEnter` teleport trực tiếp, không cost/risk, **không clear** `pendingSearch`/`pendingExploration`/`pendingMapEvent` | `expansion.js:3610` |
| C6.2 | **CAO** | `exitHiddenRealm` gán `locationId` trực tiếp, bỏ qua movement guard | `expansion.js:3632` |
| C6.3 | TB | World tick có thể âm thầm dịch chuyển người chơi khi realm đóng, cùng lỗi thiếu cleanup | `expansion.js:1735` |
| C6.4 | TB | `travelToSafeHub` chỉ clear `pendingSearch`, bỏ sót `pendingMapEvent`/`pendingExploration` | `engine.js:2695` |
| C6.5 | TB | Guard `act_exp_travel_*` (`engine.js:4259`) không có producer nào → nhánh guard chết + fast travel bất khả tiếp cận | `engine.js:4259`; `expansion.js:2512` |

### C7. Cửa sổ thực thi trùng

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C7.1 | CAO | Key roll của resolver không có `source`/instance → **hai reward cùng level trong cùng lượt ra cùng một Mệnh**; cái thứ hai bị `receiveFate` từ chối như trùng | `engine.js:3297,3303` |
| C7.2 | CAO | `receiveFate` **âm thầm ghi đè** một Mệnh trong kho khi kho đầy và không truyền `allowPending`; caller không có UI xác nhận | `engine.js:2305`; caller `:2007,3243` |
| C7.3 | CAO | Chuỗi quest tìm kiếm có thể trao **Tiên độc nhất** / Mệnh bậc cao cho nhân vật cấp 1 (không cap, không guard unique) | `engine.js:4307-4312` |
| C7.4 | TB | `giftNpc` trừ item **trước** khi `recordRelationshipEvent` chạy và **bỏ qua** kết quả trả về → key trùng = mất item + vẫn báo `success:true` | `expansion.js:2017-2021` |
| C7.5 | TB | `mutationPending` có thể resolve **nhiều lần**: `accept` không hạ `corruption`, world tick `>=60` tái vũ trang mỗi tick | `expansion.js:4092`; `:1802-1805` |
| C7.6 | TB | `updateDerived` gọi **hai lần** mỗi action tiêu lượt — idempotent hôm nay nhưng là bom hẹn giờ (đã có chỗ `stats.eff` cộng) | `engine.js:5906,5909`; `expansion.js:4275` |

### C8. Validator chết

| ID | Mức | Lỗ hổng |
|---|---|---|
| C8.1 | **CAO** | `validateExpansionState` **không được gọi ở runtime** → toàn bộ cây ~40 validator (map, replay envelope, cache, hidden realm, balance, node history, weather, action priority, rumor policy, profession namespace, structure, companion, special physique, relationship, organization, technique, character, reincarnation, auction, contract board, NPC scheduler, war, discovery, performance, product/design policy, world catalogs, trade route, prisoner, tournament, contested opportunity, guild project, NPC quest, world event, open world grid, log surface, fate advanced action, fate effect composition, technique catalog) **chỉ chạy trong test**. |
| C8.2 | **CAO** | `validateTechniqueCrossSystemState` / `validateTechniqueCrossSystemCatalog` **không tồn tại** dù `CROSS_FEATURE_RUNTIME_REVIEW_2026-09-22.md:297-298` yêu cầu → `featureVersions.techniqueCrossSystem` không có gate. |
| C8.3 | TB | `E.validateActionPriorityMatrix = E.validateActionPriorityMatrix;` — self-assign no-op; nếu engine không export, `validateExpansionState` thoái hoá im lặng thành `"action-priority-validator-missing"` | `expansion.js:4316`, `:2839` |

### C9. Tăng trưởng không giới hạn

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C9.1 | **CAO** | `state.rewardLedger` chỉ ghi, **không bao giờ trim** → phình theo toàn bộ vòng đời save | `expansion.js:1697` |
| C9.2 | TB | `npc.mailbox.push(...)` không cap/evict | `expansion.js:1750` |
| C9.3 | TB | `evolution.progressKeys` push, không trim (trong khi `eventKeys` cùng chỗ được cap 64) | `expansion.js:3454` |
| C9.4 | THẤP | `specialPhysiqueState.history` và `pathState.history` push không trim | `expansion.js:986`, `:948` |

*(Đối chứng — các cái này **đã** bounded: `state.history` 300, `damageLedger` 20, `eventKeys` 64, `processedKeys` 30 ngày, `actorHistory` theo detailedWindowDays, `npc.rumors` 12, `node.history` 50, `mapEvents.history` 40, `organizationState.history` 100, `dialogueState.history` 12, `commandHistory` 50.)*

### C10. Off-by-one / so sánh ngược

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C10.1 | TB | Hai bảng grade-rank mâu thuẫn (xem G9) | `engine.js:454` vs `expansion.js:16` |
| C10.2 | TB | `next = REALMS[findIndex(x => x.id === p.realmId) + 1]` dùng id thô trong khi dòng trên dùng `realmById` legacy-aware → realmId cũ cho `findIndex = -1` → `next = REALMS[0]`, báo nhầm "đột phá cấp 1" | `engine.js:6073`; cùng dạng ở `ui.js:580` |
| C10.3 | TB | Nhãn `"/8"` trong khi thang cảnh giới là 14 cấp phẳng | `engine.js:6041` |
| C10.4 | THẤP | Hai thang mastery nghề: `>=300/100/25 → stage 3/2/1` (max 3) vs technique clamp `0..4` → stage 4 của nghề bất khả đạt | `expansion.js:3175,3264` vs `engine.js:1566` |
| C10.5 | THẤP | Gate unbound trial hardcode `next.level === 8/11/13/14` — mong manh trước thay đổi mảng realm | `engine.js:3534-3537` |

### C11. Code chết / nhánh bất khả đạt

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C11.1 | CAO | `TRAVEL_ALREADY_ACTIVE` là mã lỗi chết: không producer nào phát, guard mà nó đặt tên **không tồn tại** | `engine.js:5244`; grep |
| C11.2 | CAO | `chooseOrigin` bất khả đạt: `state.flags.originChoicePending` chỉ được gán `false`, không bao giờ `true` → context `ORIGIN_CHOICE` và handler `[data-origin-confirm]` chết | `engine.js:1928,2097,2538,2557,6296,6332`; `:2545-2573`; `main.js:567-577` |
| C11.3 | CAO | `transformFate` (Mệnh Đổi) **không thể commit**: nó yêu cầu `stage>=4` + `level>=5` rồi gọi `evolveFate`, nhưng `evolveFate` từ chối vì `stage 4` **chỉ** do chính `evolveFate` gán kèm `status:"evolved"` → mọi Mệnh stage-4 hợp lệ đều fail | `engine.js:704-723`; `expansion.js:3478-3483` |
| C11.4 | CAO | Nhánh roll đốt EXP cũ của `maybeBreakthrough` bất khả đạt (G15) | `engine.js:3564-3613` |
| C11.5 | TB | `pathDebt` inert: serialize nhưng không writer/reader nào | `engine.js:6190` |
| C11.6 | TB | `requiresBodyAndMind` đọc từ data nhưng 0 tham chiếu | `data/data.js:67` |
| C11.7 | TB | `useHiddenProfessionAction` nhánh `legacyDirectHidden` bất khả đạt vì `ensure()` đã migrate trước | `expansion.js:3237` |
| C11.8 | TB | `renderLocalMapGraphLegacy` là code chết, không được gọi | `ui.js:1073` |
| C11.9 | TB | `physiqueRows` build ở `renderOddities` nhưng return không trả nó | `ui.js:381-388,403` |
| C11.10 | THẤP | `E.validateActionPriorityMatrix = E.validateActionPriorityMatrix;` no-op | `expansion.js:4316` |

### C12. Token kỹ thuật lọt ra text người chơi

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C12.1 | CAO | `"Invalid structure catalog entry."` trả thẳng lên `runExpansionCommand` rồi `alert()` verbatim | `expansion.js:2451`; `main.js:377,550` |
| C12.2 | CAO | Slug `"manual"` nhét vào node history người chơi đọc được | `expansion.js:2495`, `:4244` |
| C12.3 | TB | Slug `next.requiresPathRitual` nối vào reason rồi vào log/alert | `engine.js:3555`; `:3619` |
| C12.4 | TB | Họ `alert(result.reason)` (~30 chỗ) không đi qua `playerFacingReason()` | `main.js:407…982` |
| C12.5 | TB | **Echo lệnh thô lọt vào log người chơi**: `pushHistory({type:"action", text: "> " + text})` → `canonicalLogType("action")` không có alias `action` → `type:"ACTION"`, `playerVisible:true`; filter chỉ loại `COMMAND_ECHO`/`debugOnly`/`playerVisible===false` | `engine.js:5926`, `:5232,5261-5263`, `:5367,5404` |
| C12.6 | TB | Lint runtime và lint tool **khác nhau**: `NARRATIVE_BANNED_WORDS` (`engine.js:5260`) cấm `phiên,lượt dò,index,ID,state,buff,debuff,multiplier,cooldown` nhưng pass removal (`:5319`) chỉ xoá một tập khác → token cấm sống sót tới lint gate và **cả message** bị thay bằng fallback (mất thông tin); tool lint (`verify_log_narrative.js:3-4`) lại yếu hơn → producer sinh token đó **pass CI** nhưng bị thay lúc chạy | `engine.js:5260,5319,5348-5349`; `tools/verify_log_narrative.js:3-4` |
| C12.7 | THẤP | `logValue = String(value)` → object hiển thị `[object Object]` | `engine.js:5420` |

### C13. Bất biến bị vi phạm ngay trong code

| ID | Mức | Lỗ hổng | Vị trí |
|---|---|---|---|
| C13.1 | **CAO** | `npc.memoryWithPlayer` cap **không nhất quán** (20 vs 10 vs validator >10 = lỗi) → một phản ứng Lôi Vũ có thể đẩy memory lên 11–20 làm `validateExpansionState()` fail chính invariant của nó | `expansion.js:1935` (20), `:2980` (10), `:2897` (validator >10) |
| C13.2 | CAO | Rumor lan **nhiều hop trong một tick**: `propagateNpcRumors` đọc `source.rumors` **live** trong khi mutate `target.rumors` cùng pass → A→B→C cùng tick; thứ tự phụ thuộc insertion order của `Object.values(npcState)` (không deterministic qua save/load) | `expansion.js:1480-1493`; test `verify_review_batches.js:591` chỉ assert sau tick kế nên không bắt được |
| C13.3 | TB | Queue xoá state combat/shelter im lặng, khi giải phóng chỉ trả về `"present"` (không về `combat`/`shelter`) | `expansion.js:1598,1603-1606` |
| C13.4 | TB | Sort queue dùng `localeCompare` không cố định locale → thứ tự phụ thuộc môi trường | `expansion.js:1596` (+`1751,2166`) |
| C13.5 | TB | Audit relationship lệch với hiệu ứng đã áp: `intimidatedPermanently` ghim `trust=0; affection=0` nhưng `event.deltas` vẫn ghi delta yêu cầu | `expansion.js:2976-2978` |
| C13.6 | TB | Migration alias hai dimension độc lập: `loyalty` và `affection` cùng init từ `trust` khi null — alias không được khai báo | `expansion.js:569` |
| C13.7 | TB | Offline aggregate đi đường khác tick thật: `updateNpcSchedules` gọi **một lần** cho cả cửa sổ (`:2959`) và **bỏ hẳn** `updateNpcBetrayals` → cùng seed/day-range có thể ra rumor graph khác | `expansion.js:2781-2806`, `:2950-2962` |
| C13.8 | CAO | Companion **không bao giờ bị thương khi chơi online**: `recordCompanionDamage` chỉ được gọi từ `simulateOfflineCompanionCombat`; `engine.js` **0 tham chiếu** tới companion → recovery/revive/death là vòng lặp offline-only; `state==="dead"` bất khả đạt qua damage | `expansion.js:1062,1081`; grep engine.js |
| C13.9 | TB | Companion invariant **không được ép ở boundary save**: `E.deserialize` (`expansion.js:4257`) chạy `ensure` + `simulateWorldUntil` nhưng **không** `validateExpansionState` → companion `loyalty:101` sống sót im lặng | `expansion.js:4257` |

---

## 5. PHẦN D — SUB-FEATURE CÓ TRONG REQUIREMENT NHƯNG THIẾU TRONG CODE

### D1. FATE

| ID | Sub-feature thiếu | Bằng chứng |
|---|---|---|
| D1.1 | **Effect cộng hưởng riêng của Cộng Minh (stage 3)** — `resonanceEffect` có trên **mọi** entry `data/fate_data.js` nhưng **0 tham chiếu** trong `js/`. `resonateFate` chỉ set `stage=3; resonanceUnlocked=true` rồi thôi. | grep `resonanceEffect` |
| D1.2 | **Trạng thái UI "Mệnh Nguội"** — chỉ có nút Buông Mệnh (`main.js:778`), không có icon/màu/trạng thái cảnh báo | `renderFateDetail` `ui.js:1156-1196` |
| D1.3 | **Điểm vào Thiên Cơ** — chỉ có command `fate_omen` (`expansion.js:4239`), không nút nào trên card Mệnh phát nó | `ui.js:1179-1181`; `main.js:769-782` |
| D1.4 | **Luồng chọn xử lý trùng Huyền+** — không tồn tại API/popup | xem M9 |
| D1.5 | **Thăng bậc 3→4 do đột phá** | xem M6 |
| D1.6 | **Dung hợp theo recipe/potential** — 78 `fusion_recipes` không consumer | xem M10 |
| D1.7 | **Bảng unique ownership đa chủ thể** (`serverUniqueFateOwnership`) + UI "Đã có chủ — [Tên]" | chỉ có `state.meta.uniqueFateOwnership` (`engine.js:3270-3277,6390`) |
| D1.8 | **Test cho contract roll** — `verify_game.js:386` chỉ assert 10.000 entry; **không** assert Tiên == 1, **không** Monte-Carlo bảng trọng số, **không** test Hung có thể nhận được. `auditFateRolls` (`engine.js:3226-3235`) tồn tại nhưng không tool nào gọi. | `tools/verify_game.js:386,414-425` |

### D2. CHARACTER / NEO / PROGRESSION

| ID | Sub-feature thiếu | Bằng chứng |
|---|---|---|
| D2.1 | **Phân loại 3 lớp NPC** (`persistent_named`/`bondable_encounter`/`transactional_ephemeral`), action "Ghi nhớ danh tính", `roleTags`/`anchor_candidate`, `instanceId` merchant, `expiresAt`, `homeLocationId` | grep 0 hit (CHARACTER §12) |
| D2.2 | **Migration anchor cũ sang `legacy_anchor`** | grep 0 runtime hit; `deserialize` chỉ default `anchors=[]` (`engine.js:6346`) |
| D2.3 | **Vòng đời anchor `strained`/`broken`** — không code nào set/修; không có action "nuôi dưỡng Neo" nên ngưỡng 50/75 chỉ đạt được nhờ công thức stability ban đầu | `engine.js:3086` |
| D2.4 | **Tách "Quà giao thương" vs "Quà nhân duyên"** | `expansion.js:2011` |
| D2.5 | **`state.pathState` canonical fields** (`pathVariant`,`hybridPath`,`pathLevel`,`ritualByPath`,`transitionHistory`,`detachHistory`) | `expansion.js:432` |
| D2.6 | **Song tu** (gate cảnh giới 6 + match≥5, ritual SAN +10%) | grep `song_tu/dual/hybrid` = 0 |
| D2.7 | **Dung hợp Con Đường** (cảnh giới 10, một Mệnh trụ chung, khoá khi hybrid active) — chỉ có `transitionSecondaryPath` + `pathFusionAffinity`; command `path_fusion` **không UI nào phát** | `expansion.js:922-951,4242`; grep `path_fusion` trong `ui.js` = 0 |
| D2.8 | **Nguồn `recordCultivationGain` đa dạng** — chỉ `"other"` được truyền; Chiến Ngộ/Cảnh Ngộ/Vấn Đạo/Đấu Ngộ **không tồn tại** | `engine.js:2966`; grep 0 |
| D2.9 | **`state.flags.pathInsight` cooldown theo NPC** | grep 0 |
| D2.10 | **Tiểu Kiếp** (50% EXP, accept/skip, không auto-commit) — chỉ có default migrate `?? null` | `engine.js:6322` |
| D2.11 | **Rankboard vùng** `getRegionalCultivationRankboard` | grep 0 |
| D2.12 | **Chuyển Đạo** (`switchPathContext`/`pathSwitchStatus`/`pathSwitchCandidates`) — `selectPath` từ chối mọi thay đổi | `engine.js:2136` |
| D2.13 | **`adjustDaoTam` + `effectiveCorruptionGain = base * (1 - daoTam/200)`** | grep 0 |
| D2.14 | **`resolveCultivationDeviation` / action xử lý `pendingDeviation`** — pending là write-only | xem C (deviation) |
| D2.15 | **`PATH_RITUAL_PROFILES`** (omen/anchor/cost riêng theo Con Đường) — engine dùng regex nhãn chung | `engine.js:3057-3067` |
| D2.16 | **`ritualTutorial` auto-open khi đổi gate** (flag có, nội dung không) | `engine.js:6323`; `renderRitualModal` |

### D3. PROFESSION / HIDDEN PATH / DỊ THỂ

| ID | Sub-feature thiếu | Bằng chứng |
|---|---|---|
| D3.1 | **`hiddenPath.catalog`** với `sourceType` (`co_than_tan_hon`/`gameplay_trigger`) | grep 0 |
| D3.2 | **Luồng encounter/nghi thức Cổ Thần Tàn Hồn** (omen→encounter, 3 lựa chọn Phong ấn/Dung hợp/Thôn phệ, dấu "once per character", ritual nhập-đường) | grep 0 |
| D3.3 | **Field khai báo của hidden profession** (`professionId`,`unlockTrigger`,`requiredState`,`effects`,`costs`,`risks`,`mastery`,`disableRules`,`discoveryClue`) | `expansion_data.js:130-140` chỉ có `id/name/requiresCodex/actionName/actionCost/cooldownDays/passive/description` |
| D3.4 | **`discoveries.hiddenProfessionClues` / `hiddenPathClues`** — clue nghề ẩn nằm ngoài namespace ở `state.hiddenProfessionState.clues` (`:1147`); clue hidden path không tồn tại | `expansion.js:425-427` |
| D3.5 | **Cờ `dormant`/`active` tường minh** cho nghề ẩn & hidden path | `expansion.js:437` |
| D3.6 | **Milestone mastery nghề có neo canonical** — code dùng `>=25/100/300` ad-hoc | `expansion.js:3175,3264` |
| D3.7 | **UI/log cho clue hidden path và dấu Cổ Thần** — không tab, không action, không command | `expansion.js:4236-4246` |

### D4. MAP / WEATHER / WORLD

| ID | Sub-feature thiếu | Bằng chứng |
|---|---|---|
| D4.1 | **Toàn bộ API surface §16 của MAP** — `resolveMapTopology`, `getCurrentRegionViewModel`, `getLocalState`, `listLocalActivities`, `previewLocalActivity`, `resolveLocalActivity`, `listRouteOptions`, `edgeState`, `interruptTravel`, `resumeTravel`, `cancelTravel`, `mapIncidentPreview`, `resolveMapIncident`, `setMapNote`, `startTravel` | grep 0 |
| D4.2 | **Travel state machine + DTO `TravelTask`/`EdgeState`** | grep 0 |
| D4.3 | **Layer transaction/versioning** (`resolveMapTransaction`, `MAP_VERSION_CONFLICT`, hash before/after) | grep 0 |
| D4.4 | **Thứ tự world-tick 9 bước + `tickSnapshot`** — `tick()` là chuỗi liền mạch không có bước 3/6/7/8/9 | `expansion.js:1771-1822` |
| D4.5 | **Discovery event DTO `{nodeId,level,source,actorId,tick}` + producer cho fog 1/2/3** | grep 0; fog 1 và 3 **không thể đạt** |
| D4.6 | **`pendingExploration` đúng shape** — code tạo `{locationId, session, findings, createdAtTurn}` (`engine.js:4384`), thiếu `risk`, `weather`, `npcAssistId`, `expiresTurn`, và sai tên `nodeId`/`createdTurn` | `engine.js:4384` |
| D4.7 | **Idempotency key hợp nhất `(systemId, entityId, day, ordinal)`** | grep 0; thay bằng `seeded(...)` + `processedKeys` ad-hoc |
| D4.8 | **`outpostBonus` trong công thức influence** (xem M42/L2) | `expansion.js:2552` bị ghi đè ở `:2324` |

### D5. NPC / RELATIONSHIP / COMPANION

| ID | Sub-feature thiếu | Bằng chứng |
|---|---|---|
| D5.1 | **Action/UI cho companion** (revive, recovery, mutation accept/cure/release) — `companion_mutation` chỉ là entry command table, **không `expansionAction` nào phát**, `ui.js` không render nút companion | `expansion.js:4245`, `:4282`; `ui.js:716` |
| D5.2 | **Field lifespan canonical** (`ageDays`,`birthDay`,`lifespanDays`,`status`) — code dùng `birthAge/birthDay/maxLifespan/age` theo **năm**; validator không kiểm | `expansion.js:1500-1506` |
| D5.3 | **Chết phải đóng quest + kế vị chỉ nhận quest daily "transferable"** — `resolveNpcSuccession` không đóng `state.questState.active`, chỉ copy `inheritedRole`+`currentSubLocationId` | `expansion.js:2679-2688` |
| D5.4 | **Footprint "clue class" + retention theo ngày** — prune theo count `slice(-20)`, không theo 3 game-day trong state | `expansion.js:1576-1577`; `:3874` |
| D5.5 | **Uy hiếp có skill check + nhánh thất bại** — hiện luôn thành công khi qua điều kiện tiên quyết | `expansion.js:2023-2040` |
| D5.6 | **Uniqueness/capacity cho settlement sub-location** | `expansion.js:1586` |
| D5.7 | **Demotion có event review ghi lại** (reason + effectiveDay) | `expansion.js:205-213` |
| D5.8 | **Cap lan rumor mỗi tick + panel queue/rumor chuyên biệt** | `expansion.js`; `NPC_CANONICAL.md:702` |

### D6. TECHNIQUE / DISCOVERY / REWARD / CROSS-SYSTEM

| ID | Sub-feature thiếu | Bằng chứng |
|---|---|---|
| D6.1 | **Toàn bộ API canonical của technique** — `buildTechniqueContext`, `resolveTechnique`, `commitTechniqueResolution`, `recordTechniqueTrialEvent`, `transitionGuildMembership`, `validateTechniqueCrossSystemCatalog/State` | grep 0 |
| D6.2 | **`GuildTechniquePolicy` đầy đủ** — thiếu `learnGrants[]`, `teachings[]`, `exitPolicy`, `modifiers.qiCostPct/cooldownPct`, `caps` tương ứng; `validateTechniqueCatalog` không đọc `guildTechniquePolicies`; `verify_catalog_balance` không phủ | `expansion_data.js:73-77`; `engine.js:1534` |
| D6.3 | **Luồng truyền thụ của Tông Môn** (cùng guild/rank/cost, vault snapshot, `learnGrants`) | `guildVaultSnapshot` (`expansion.js:2162`) là snapshot read-only không có action người học |
| D6.4 | **Transaction membership theo giai đoạn** (`transitionGuildMembership`) — membership bị sửa rải rác ở 5 nơi | `engine.js:2795,2896`; `expansion.js:126,205,2089` |
| D6.5 | **Preview before/after + xác nhận + irreversible cho `chooseTechniqueEvolution`** — hiện là commit tức thì khi bấm | `expansion.js:3416`; `ui.js:1236` |
| D6.6 | **API preview reward** (DTO-only, không ghi ledger) | `expansion.js:319-322` chỉ có policy snapshot |
| D6.7 | **UI discovery đầy đủ** — chỉ hiện tổng theo status cho codex; không có `byCategory` cho registry, không "next valid action" cho từng record | `ui.js:376-404` |
| D6.8 | **Ledger trial bounded/archived** — `progress.eventKeys` cap 64 nhưng không archive/hash sau khi trial xong | `expansion.js:3410` |
| D6.9 | **`migrateV12ToV13`** (xem A9/G13) | grep 0 |
| D6.10 | **Stance UI thật** — hiện dùng `window.prompt` | `main.js:933,978` |

### D7. UI / PLATFORM

| ID | Sub-feature thiếu | Bằng chứng |
|---|---|---|
| D7.1 | **Memoization `contextState`** theo fingerprint (turn+location+worldTick+mapVersion+profession/path+quest counts+weather/corruption/war/pending/travel/companion/inventory) — hiện recompute mỗi lần gọi; refresh signal là `window._renderedTurn = history.length` | `engine.js:5618`; `ui.js:110`; `engine.js:5876`; `main.js:734` |
| D7.2 | **Profile `reduced` theo `prefers-reduced-motion`** — không có `matchMedia` nào; `performanceProfile` luôn gọi không capabilities | `expansion.js:2344`; `main.js:761,795` |
| D7.3 | **Budget profile thực sự chặn việc** — `mapRenderBudget`, `npcRecordsPerTick` khai báo nhưng **không consumer**; chỉ `historyWindow` được áp | `expansion.js:2350,2352`; `main.js:795`; không có CSS `data-performance-profile` |
| D7.4 | **`ERROR_NARRATIVE_MAP` phủ mọi mã** (xem G11) | `engine.js:5243-5250` |
| D7.5 | **Surface formatter canonical của i18n** — `formatItemName`, `formatTechniqueName`, `formatFateName`, `formatQuestName`, `formatLocationName`, `formatActionLabel`, `formatHistory`, `playerClockLabel`, `worldClockLabel`: **không cái nào tồn tại** | `i18n.js:37` chỉ export `{contractName, formatContract, target, formatTarget, status, formatStatus, weather, element, category, formatHistory, lookup}` |
| D7.6 | **Fast travel tiếp cận được từ UI** (xem C6.5) | grep 0 producer |
| D7.7 | **Reconcile awakening branch lạ** — `expansion.js:3561` hardcode `awakeningId ∈ {di_linh, ho_chu}`; `unknownContent` chỉ phủ `events/items/evolutionBranches`, và `rehydrateUnknownContent` (`:2631`) **chỉ phục hồi items** | `expansion.js:481-499,3561` |
| D7.8 | **`verify_expansion_log_matrix.js` là gate thật** — không nằm trong `run_regression_suite.js`, bị `verify_utf8_integrity.js:7` bỏ qua, và `CASES` (`:7-51`) là literal đã bỏ dấu (`"Xem Qu—: M—t b—ng…"`) **không phải** chuỗi producer thật | `tools/verify_expansion_log_matrix.js:7-51` |
| D7.9 | **Pinned surface trong bundle offline** (xem M87) | `index.offline.html` |

---

## 6. PHẦN E — MÂU THUẪN BÊN TRONG CHÍNH TÀI LIỆU REQUIREMENT

Các mục này **không phải** lỗi code; chúng là mâu thuẫn tài liệu khiến "đối chiếu" không thể kết luận. Cần chốt trước khi sửa code.

| ID | Mâu thuẫn | Vị trí | Ảnh hưởng |
|---|---|---|---|
| E1 | Phase 3 FATE được đánh dấu "CHƯA CÓ / CHỜ DUYỆT" ở giữa file nhưng mục "Runtime reconciliation 2026-09-22" ở cuối nói đã code | `FATE_CANONICAL.md` §7.2/§10 vs §"Runtime reconciliation" cuối file | Xác định action nào còn phải làm |
| E2 | Miền toạ độ ghi **hai kiểu**: runtime `0..100` vs Oxy `[-50,49]` | `MAP_CANONICAL.md:712,1106` | Code chọn 0..100 → `(0,0)` là **góc**, không phải origin; gradient danger/linh khí neo sai chỗ (xem C-bổ sung dưới) |
| E3 | Hướng Bắc: sơ đồ cũ `Bắc (y+1)` vs contract cuối `Bắc (y-1)` | `MAP_CANONICAL.md:741-747` vs "TRACE RECOVERY" cuối file | Code theo y-1 (đúng); text cũ phải xoá kẻo gây hồi quy |
| E4 | Tên bước ritual cũ (`realm_gate/path_gate/anchor_gate/body_mind_check/cost_commit`) vs id runtime (`call_fate/compare/anchor/omen/cost`); tài liệu buộc dùng id runtime | `CON_DUONG_CANONICAL.md` §2.1 | Còn tồn tại song song trong file |
| E5 | Thứ tự pipeline ritual: canonical §3.1 ghi `Gọi Mệnh → Dựng Neo → Đối Chiếu`, nhưng `breakthroughRitualPlan` (và data) đặt `compare` trước `anchor` | `CON_DUONG_CANONICAL.md` §3.1 vs `engine.js:3033-3039` | Dựng Neo không phải bước 2 bắt buộc |
| E6 | Companion revive: `COMPANION_CANONICAL.md:40` = 3 Linh Thạch / 25%; `AUDIT_CANONICAL.md:1251,1267` = 12 Linh Thạch / 35% / `soul_scar` 5 ngày | 2 file | Code theo bản 3/25; bản 12/35 chưa từng được cài |
| E7 | Dị Thể stage-1 faction affinity: tài liệu nói "stage 1 dùng affinity catalog", công thức task nói `* stage/maxStage` | `DI_THE_CANONICAL.md` vs `expansion.js:889-890` | Test `verify_dichi_deep.js:89` assert `2.67` = `4 × 2/3` → stage 1 ra 1/3 catalog, không phải catalog |
| E8 | NPC memory retention: tài liệu đòi 20, validator runtime fail khi >10 | `DATA_RUNTIME`/`UI` vs `expansion.js:2897` | Tự mâu thuẫn |
| E9 | `tools/verify_ui_surface_contract.js:51` assert **ngược** `UI_ACTION_LOG_CANONICAL.md:8.1` về nút Di Chuyển gom | test vs doc | Test đang ép hành vi trái requirement |
| E10 | `FATE_UPDATE_SYSTEM_RULE.md` §7.2 "suy giảm quan hệ khi để Vault quá 30 ngày" vẫn **CHỜ DUYỆT** trong mọi phiên bản, kể cả bản reconcile cuối | `FATE_CANONICAL.md` | Không rõ policy decay của Fate relationship (`RELATIONSHIP_CANONICAL` nói `none`) |

**Mâu thuẫn bổ sung do E2 gây ra trong code** (phát hiện khi đối chiếu): `generateOpenWorldNode` đo "khoảng cách từ origin" bằng `Math.abs(x)+Math.abs(y)` (`engine.js:3997`) và `ensureOpenWorld` default toạ độ = `[0,0]` (`:3928`; `openWorldTarget` cũng default `[0,0]` ở `:4014`) — nhưng `trung_vuc_khoi_diem = {x:48,y:68}` (`data/data.js:292`), `son_mon {48,78}`, region `trung_vuc {x:50,y:48}` (`world_data.js:3`). Hai khái niệm "origin" cùng tồn tại → vòng danger/linh khí neo ở góc bản đồ, cách xa origin thật.

---

## 7. PHẦN F — BẢNG ƯU TIÊN & LỘ TRÌNH ĐỀ XUẤT

### P0 — Phải sửa trước khi tin bất kỳ "đã xong" nào

| # | Việc | Liên quan |
|---|---|---|
| 1 | Cố định ngưỡng runtime thành **deterministic** (bỏ so sánh wall-clock khỏi invariant; tách perf gate ra khỏi `validateExpansionState`), để 5 test suite xanh trở lại | G2, G3, A2 |
| 2 | Gọi `validateExpansionState` (hoặc tập con thuần dữ liệu) ở `deserialize`/`ensure` boundary như requirement đòi | G1, C8.1 |
| 3 | Sửa autosave (`saveGame`) | G4 |
| 4 | Sửa save schema string + thêm `migrateV12ToV13` | G13, A9, D6.9 |
| 5 | Ngăn resolver ghi catalog tĩnh (`QUESTS`/`ITEMS`) | G8, C4 |
| 6 | Thống nhất bảng grade thành một nguồn duy nhất | G9, C10.1 |
| 7 | Bịt teleport bỏ qua movement guard | G6, C6 |
| 8 | Thêm transaction cho `turn += 1` (không tiêu lượt khi resolver throw) | G12, C5.1 |
| 9 | Mở rộng `ERROR_NARRATIVE_MAP` + đưa `alert()` qua `playerFacingReason` | G10, G11, C12 |
| 10 | Sửa roll fate: cấm Hung, Tiên weight = 0, thêm `source` vào roll key, chặn trao Tiên từ chuỗi quest | M1, M2, M8, C7.1, C7.3 |
| 11 | Sửa hợp nhất reward key hidden realm | M74 |
| 12 | Xử lý `receiveFate` ghi đè im lặng | C7.2 |

### P1 — Hoàn thiện game logic

- **FATE:** behavior gate cho nurture, 3→4 theo đột phá, khoá tháo bậc 4, `resonanceEffect`, popup trùng Huyền+, fusion recipe, sửa `transformFate` bất khả commit. (M5–M7, M9–M10, C11.3, D1)
- **CHARACTER/PROGRESSION:** Neo theo schema + tối đa 3 + taxonomy NPC; `pathState` canonical fields; song tu/dung hợp/chuyển đạo; nguồn insight; tiểu kiếp; rankboard. (M15–M23, M24–M32, D2)
- **PROFESSION/DỊ THỂ:** hidden path catalog thật + namespace tách; cost Dị Thể ngoài SAN; sửa id `tho_san_di_trieu`; đồng bộ path id canonical. (M33–M40, D3)
- **MAP/WORLD:** influence công thức + clamp + `outpostBonus`; owner derived; cache 4 version; fog 1/3 + discovery event; `pendingExploration` shape; travel task. (M41–M49, D4)
- **NPC/COMPANION:** rumor TTL/clamp; queue priority; footprint clue class; companion online damage + UI + validator boundary. (M50–M64, C13)
- **TECHNIQUE/REWARD:** dựng resolver canonical; cost pipeline; guild policy + `transitionGuildMembership`; trial producer; discovery read-model thuần. (M65–M78, D6)

### P2 — UI/perf/archive

- Memoize `contextState`; profile `reduced`; budget thực sự chặn; i18n formatter; bundle offline rebuild; đưa các gate bị thiếu vào `run_regression_suite.js`; sửa `verify_log_narrative.js` cho khớp `NARRATIVE_BANNED_WORDS`. (D7, C12.6)

### Ghi chú về `webgame/`

`webgame/` là **micro-runtime độc lập** (`webgame/index.html` + `app.js` 19 dòng), tự có `regions/realmNames/fates/techniques` và localStorage key riêng `co-di-dien-visual-v1`. Nó **không** import `data/` hay `js/`, **không** phản ánh bất kỳ contract nào trong catalog (không Mệnh 10.000, không path/profession/Dị Thể, không world tick, không dual clock, không action priority, không save migration), và dùng `Math.random()` trực tiếp cho gameplay. Nếu nó thuộc phạm vi sản phẩm thì cần một quyết định rõ: hoặc nối vào runtime canonical, hoặc chính thức tuyên bố nó ngoài contract (khi đó phải loại nó khỏi mọi tuyên bố "deterministic replay" và khỏi bộ lint boundary).

Lỗi nhỏ đã xác nhận trong `webgame/`: `styles.css` có block `.v2-*` không được `app.js` render (CSS mồ côi); `app.js` dùng `<p class=muted>` nhưng CSS không định nghĩa selector `.muted`; `index.html` có `<template id="story-template">` không bao giờ được dùng.

---

## 8. PHỤ LỤC A — SYMBOL REQUIREMENT YÊU CẦU NHƯNG KHÔNG TỒN TẠI TRONG `js/`

Grep 0 hit trên toàn bộ `js/`:

```text
# MAP / travel / transaction
startTravel  travelPreview  interruptTravel  resumeTravel  cancelTravel  edgeState
listRouteOptions  travelTask  resolveMapTopology  getCurrentRegionViewModel
getLocalState  listLocalActivities  previewLocalActivity  resolveLocalActivity
mapIncidentPreview  resolveMapIncident  setMapNote
resolveMapTransaction  expectedVersion  stateVersion  MAP_VERSION_CONFLICT  tickSnapshot
TravelTask  EdgeState  NodeDetailLayout  enterSubLocation  availableNodeActions
getNodeDetail  claimOutpost(bản §7)  buildMapStructure(bản §7)  petitionFactionTerritory

# TECHNIQUE cross-system
buildTechniqueContext  resolveTechnique  commitTechniqueResolution
recordTechniqueTrialEvent  transitionGuildMembership
validateTechniqueCrossSystemCatalog  validateTechniqueCrossSystemState
guildTechniquePolicies(đủ shape)  teachTechnique  learnGrants  exitPolicy

# SAVE / platform
migrateV12ToV13  validateExpansionState(tại runtime)  techniqueCrossSystem(featureVersion)

# CHARACTER / path
switchPathContext  pathSwitchStatus  pathSwitchCandidates  adjustDaoTam
resolveCultivationDeviation  getRegionalCultivationRankboard  cancelSecludedCultivation
recordFateEvolutionProgress(audio bounded archive)  legacy_anchor(migration)

# NPC / WORLD
hiddenPath.catalog  hiddenProfessionClues  hiddenPathClues  su_do(đủ điều kiện kế vị)
(systemId, entityId, day, ordinal)  absoluteWorldDay  discoveryEvent{nodeId,level,source,actorId,tick}

# UI
formatItemName  formatTechniqueName  formatFateName  formatQuestName
formatLocationName  formatActionLabel  playerClockLabel  worldClockLabel
```

---

## 9. PHỤ LỤC B — DANH SÁCH KIỂM TRA ĐÃ ĐẠT (để khoanh vùng phạm vi sửa)

Các contract sau **đã đúng**, ghi lại để tránh sửa nhầm:

- `pushHistory` là alias thật của `emitEvent`, cùng một gateway, cùng cap 300 (`engine.js:5515,5508-5509`); save payload 100 (`:6230`); không có `.push` trực tiếp nào khác vào `state.history`.
- Pinned summary bị ẩn khi tab `status` active (`ui.js:253-256`); `tab-content` có đúng **một** delegated listener (`main.js:334`); `enqueueAction` phục hồi sau exception (`main.js:111-125`); UI nhận cả `disabled_reason` lẫn `disabledReason` (`ui.js:161`, `engine.js:5884`).
- Bản đồ "Lân cận" dùng constellation renderer (`ui.js:801→913`); `renderLocalMapGraphLegacy` là code chết.
- Influence cache kiểm đúng `entry.revision === mapState.influenceRevision` (`expansion.js:2308`); `invalidateMapInfluence` được gọi ở mọi mutation structure/map-event/outpost/ownership (`:2212,2464,2481,2489,2495,2505,2552,2562,2570`); `resolvePerformanceProfile` thuần (`:2340`).
- Cost/dismantle công trình: `waystation buildCost:20`, `ward_formation buildCost:15` (`:779-780`); alias `teleport_array→waystation`, `world_ward→ward_formation` (`:2449`); refund `floor(buildCost*level*0.4)` + giữ record `status:"dismantled"` (`:2502-2503`); snapshot loại disabled/dismantled/low-integrity (`:2318`, `:2596`).
- Oxy topology: `locationExits` dựng từ neighbour Oxy + chỉ exit kề (`engine.js:3971-3985`); migration loại exit không kề (`:3949-3958`); reciprocal link rebuild (`:3961-3968`); `openWorldTarget` từ chối ô không kề và lazy-create ô kề đúng (`:4020-4026`); `validateOpenWorldGrid` bắt duplicate/non-adjacent (`:4089-4113`).
- Node history `type/key/day/regionId` + dedupe + cap 50 (`:2392-2412`); weather transitions cap 30 (`:1339,1421`); `WEATHER_ALIASES` normalize trước lookup (`:350-351,364`); `weatherSnapshot` DTO khớp (`:363-365`).
- `factionBulletin`/`rumorBulletinSnapshot` là read model thuần, thứ tự priority→confidence→expiry, dedupe, drop expired (`:1862-1904`); `ui.js:277` có render.
- NPC di chuyển không teleport: `currentNodeId` chỉ được gán từ `currentLoc.exits` (`:1571-1573`); `validateNpcScheduler` từ chối non-edge (`:1637`).
- Relationship decay `event_only`; `relationshipScore` không dùng làm gate; `relationshipBreakdown`/`relationshipTier`/`relationshipPolicySnapshot`/`validateRelationshipPolicy` tồn tại (`:2993-3008`).
- Betrayal là state machine 3 pha, một cảnh báo, quan sát được ≥1 ngày trước, không xoá inventory/quest (`:2077-2088`).
- Trust-trial id/key/deadline/cooldown khớp (`:2061,2072-2073`); loyalty-test deadline +7 + gate theo tháng (`:2143-2146`); alliance mediation gate (rep≥60, tension≥70, không war active, −30/+5, cooldown 30 ngày) khớp (`:2110-2133`).
- `seeded()` hash-based, không `Math.random()` trong `expansion.js` (`:402-407`).
- Reward: mọi nguồn one-time đi qua `grantCanonicalReward` với key ổn định (`expansion.js:1680`); `grantTaintedRewardCanonical` delegate đúng (`engine.js:3405`); `REWARD_POLICY.pity==="none"` (`:291-298`); receipt legacy không hợp lệ bị quarantine kèm `legacyPayload` (`:572-582`).
- Discovery record/transition (`discover`/`verifyDiscovery`/`collectDiscovery`/`rewardDiscovery`, `:3041-3053`) là monotonic và chặn lùi.
- Fate resonance: đếm ID active unique, unsuppressed, catalog-owned, một cap +5% chung (`engine.js:1660-1674`); Mệnh bị Trấn và category passive/support không nhận bonus (test `verify_review_batches.js:741-775`).
- `featureVersions` 10 key canonical = 1 (`expansion.js:465-468`); ledger `technique-ui:N` high-water + 64 entry + từ chối replay đã bị evict **cho UI ID** (`engine.js:1756-1781`).
- v1/v7 fixture chạy qua `deserialize` thật, id `legacy_0` deterministic, hidden profession vào đúng slot phụ (`verify_review_batches.js:206,477-497`); save thiếu `saveId` được cấp `"migrated_"+hash()` deterministic (`expansion.js:457`).
- Không còn dấu vết của thiết kế `prepareTechnique`/`combatState{cooldownRemaining,channelProgress,lastResolvedActionId}` (grep 0) — thiết kế cũ đã chết đúng như tài liệu nói.

---

## 10. PHỤ LỤC C — CÁCH TÁI LẬP

```powershell
# 0) bối cảnh
node --version        # v22.20.0

# 1) syntax
node --check js/engine.js; node --check js/expansion.js; node --check js/ui.js; node --check js/main.js

# 2) regression (kỳ vọng hiện tại: FAIL 5/13)
node tools/run_regression_suite.js

# 3) tái lập flaky validator: chạy script chẩn đoán 3 lần ở vm context mới,
#    in ra valid / errors / metrics.mapInfluence
#    → quan sát valid đổi giữa false và true tuỳ avg 13–20ms so với ngưỡng 16ms
```

Ngưỡng và vị trí gốc: `js/expansion.js:2330-2338` (budget), `js/expansion.js:2370-2371` (so sánh), entry point `js/expansion.js:2942-2943` (`validatePerformanceBudget` → `performanceBudget:` + error).

---

*Hết báo cáo. Toàn bộ nội dung được lập ở chế độ chỉ đọc; không file nào trong repo bị sửa đổi. Script chẩn đoán tạm nằm ngoài repo (thư mục scratchpad của phiên).*

---

# PHẦN II — ĐỢT 2: COMBAT · SEARCH/EXPLORATION · ITEM · DATA LAYER · CHẤT LƯỢNG BỘ TEST · UI RENDER + i18n

> Phương pháp đợt 2: bổ sung bằng chứng chạy code thực cho các vùng chưa rà. Tiền tố ID: N1–N140.

> **Quan hệ với báo cáo #1:** `CODE_REQUIREMENT_AUDIT_2026-09-22.md` là đợt 1 (đúng, nhưng phạm vi hẹp: FATE, CHARACTER/PROGRESSION, PROFESSION/DỊ THỂ, MAP/WEATHER/WORLD, NPC/RELATIONSHIP/COMPANION, TECHNIQUE/DISCOVERY/REWARD, UI/save — chủ yếu bằng **đọc tĩnh có định vị**).
> Đợt 2 này **không lặp lại** các mục đã có. Nó phủ **vùng hoàn toàn mới** (COMBAT, SEARCH/EXPLORATION/HIDDEN REALM, ITEM/INVENTORY/AUCTION, DATA LAYER, CHẤT LƯỢNG BỘ TEST, UI RENDER LAYER + i18n) và — khác biệt cốt lõi — **kiểm chứng bằng thực nghiệm chạy code**, không chỉ đọc.

- **Ngày:** 2026-09-22
- **Nhãn bằng chứng:** `[RUN]` = đã tái lập được bằng script chạy thật trong phiên này (có số liệu in ra); `[STATIC]` = suy ra từ đọc mã tại dòng dẫn.
- **Trạng thái:** chỉ đọc. Không sửa file nào trong repo. Script chẩn đoán nằm ngoài repo (scratchpad phiên).
- **Đánh số:** đợt này dùng tiền tố `N` (N1, N2…) để không trùng với `G/M/C/D` của báo cáo #1.

---

## 0. BẢNG BẰNG CHỨNG THỰC NGHIỆM (phần khác biệt chính của đợt 2)

Chạy trên runtime thật nạp trong `vm` sandbox (13 file: data/* + i18n + engine + expansion), state chuẩn `createState + createCharacter + chooseJourneyIntent("tu_lap") + ensureExpansionState`.

| # | Phép đo | Kết quả in ra | Kết luận |
|---|---|---|---|
| T1 | `Object.keys(E.combatEntity(state, id))` | `id,name,portrait,hpMax,phy,mag,sanHit,diff,family,exp,loot,lootTableId,entity` → **`hp=undefined`** | `combatEntity` **không có field `hp`** |
| T2 | `selectCompanionTarget` với 2 địch hp `[20, 1]` | `picked="di_qui"` (con **đầy máu**), không phải `yeu_thu` (1 máu) | Hàm chọn mục tiêu **luôn trả địch đầu tiên** |
| T3 | `E.applyPlayerDamage(state, dmg)` đúng như `expansion.js:3852` | `hpBefore=264 hpAfter=264` → **no-op** | Damage bị mất im lặng |
| T4 | 400 lần `createLootItem(state,"artifact")` | `distinctNames=64 distinctPrefixes=64 prefixesWith>1suffix=0` | **Prefix ↔ suffix khớp 1-1 tuyệt đối** → RNG suy biến |
| T5 | `removeItem(state,id,5)` khi kho có 2 | `returned=true now=undefined` | **Xoá quá số lượng vẫn trả `true`** |
| T6 | `I18N.formatHistory("… tuyet … am_vu … bao_linh_khi … mua va suong")` | `"…tuyet roi; roi vao am_vu; bao_linh_khi keo den; Mưa va Sương."` | **3/8 id weather lọt nguyên văn** ra text người chơi |
| T7 | `grantCanonicalReward(state,"hidden_realm:A",…,"1:main")` rồi `("hidden_realm:B",…,"1:main")` | realm A `success:true`; realm B **`success:false, duplicate:true`**; `ledgerKeys=1:main` | **Khoá ledger dùng chung giữa 2 realm** → realm thứ hai mất thưởng vĩnh viễn |
| T8 | Monte-Carlo `rollFateByProgression({level:10})` × 20 000 | `grades={huyen:4966, dia:4978, thien:3650, linh:1009, hoang:2979, phan:182, thanh:2235, tien:1}`; **`signs={cat:20000}`** | **Không nhận được Hung/Bình** qua resolver (0/20000); Tiên **có** rơi (1/20000) |
| T9 | `E.FATE_REWARD_WEIGHTS` | `undefined` | Bảng trọng số **không được export** → không test nào assert được |
| T10 | `sample_characters.json` đối chiếu `FATE_PATTERNS` | `chars=5 fateRefs=25 dangling=25` | **25/25 tham chiếu Mệnh treo** |
| T11 | Đếm catalog Mệnh | `total=10000`; `grades={tien:1, thanh:49, thien:150, dia:400, huyen:700, hoang:1200, linh:2500, phan:5000}`; `duplicates=0` | **Data catalog ĐÚNG 100%** so với requirement |
| T12 | `confirmPendingDeparture` với `pendingMapEvent` đang `pending` | `pendingAfter={s:"pending", n:"truyen_phap"}` | Confirm **không** đánh dấu event `lost` → rò rỉ vĩnh viễn |

**Đối chiếu T8 với bảng canonical `9+` = `1/5/15/25/25/18/11/0`:**

| phẩm | yêu cầu `9+` | đo được (n=20 000) | tỉ lệ đo | khớp? |
|---|---:|---:|---:|---|
| phan | 1% | 182 | 0.91% | ✔ |
| linh | 5% | 1009 | 5.05% | ✔ |
| hoang | 15% | 2979 | 14.90% | ✔ |
| huyen | 25% | 4966 | 24.83% | ✔ |
| dia | 25% | 4978 | 24.89% | ✔ |
| thien | 18% | 3650 | 18.25% | ✔ |
| thanh | 11% | 2235 | 11.18% | ✔ |
| **tien** | **0%** | **1** | **0.005%** | **✘ sai** |

→ **Đính chính/nâng cấp cho báo cáo #1 (M1):** bảng trọng số trong code **đúng canonical ở 7/8 ô**; khiếm khuyết duy nhất là ô `tien` đặt `0.01` thay vì `0`. Và bộ lọc `sign === "hung"` (báo cáo #1 M2) nay được **chứng minh bằng số**: 0/20 000 Mệnh Hung.

### 0.1. Kết quả các gate nhỏ (chạy thật)

```text
node tools/verify_log_producers.js   → OK: raw log producer audit (79/79)
node tools/verify_random_boundaries.js → OK: random boundaries (7 sources, 3 centralized allowances)
node tools/verify_utf8_integrity.js  → OK: UTF-8 integrity audit
node tools/verify_33_item_coverage.js → OK: 33-item evidence coverage (33/33)
```

`7 sources` = `js/*.js` (5 file) + `gemini-code-…js` + `character_generator.js`. Xác nhận **`webgame/`, `index.offline.html`, `data/*`, `tools/*` không nằm trong gate** (xem N40).

---

## 1. VÙNG PHỦ MỚI #1 — HỆ THỐNG COMBAT

### 1.1. Lỗi logic

**N1 — `[RUN]` HIGH — `selectCompanionTarget` luôn trả địch đầu tiên; toàn bộ thang điểm vô hiệu.**
`js/expansion.js:1036,1038,1047`:
```js
const target = E.combatEntity(state, targetId) || {};
if (!companion || !target || Number(target.hp || 0) <= 0) return -Infinity;
const wounded = 1 - clamp(Number(target.hp||0) / Math.max(1, Number(target.hpMax||…)), 0, 1);
```
`E.combatEntity` trả `{id,name,portrait,hpMax,phy,mag,sanHit,diff,family,exp,loot,lootTableId,entity}` (**T1: không có `hp`**) → `target.hp || 0` = `0` → `0 <= 0` đúng → **`-Infinity` cho mọi mục tiêu**. Comparator ra `NaN`, `.sort()` giữ nguyên thứ tự chèn.
Kịch bản hỏng (đã đo, T2): companion `striker`/`guard` gặp `di_qui` (20 máu) và `yeu_thu` (1 máu) → luôn đánh `di_qui`. Ngoài ra `options.protectPlayer` không bao giờ được truyền (`:1053`, postAction `:3934`) nên `guardBonus` luôn 0.

**N2 — `[RUN]` HIGH — `applyPlayerDamage` gọi sai arity: damage truy đuổi/Chấp Pháp Truy Đồ không có tác dụng.**
`js/expansion.js:3852,3856`:
```js
const damage = Math.max(1, Math.floor(Number(state.player.stats?.hpMax || state.player.hp || 100) * 0.12));
E.applyPlayerDamage(state, damage);
```
Chữ ký thật là `applyPlayerDamage(state, enemyId, damage)` (`engine.js:4950`). Ở đây `enemyId = <Number>` và `damage = undefined` → `combatEntity(state, <number>)` → `undefined` → `if (!info) return;`.
Kịch bản (đã đo, T3): hp 264 → 264; nhưng reason trả về vẫn ghi "bị thương 31". Cả nhánh `act_exp_pursuit_escape` thất bại lẫn nhánh áp sát của `Chấp Pháp Truy Đồ` đều **no-op**.

**N3 — HIGH — Contested opportunity (chưa `forced`) đè được combat tier-0.**
`js/engine.js:5644-5660` chạy **trước** nhánh pending exploration/map event (`:5665`) và hardcode `inCombat:false`. `createContestedOpportunity` (`expansion.js:4101`) được tạo trong `postAction` sau `search()` (`:3958`), mà `search()` có thể spawn encounter (`engine.js:4377-4381`) → hai thứ cùng tồn tại.
Kịch bản: tìm kiếm ra cả encounter lẫn cơ duyên → action bar chỉ còn Tranh Đoạt/Dùng Mưu/Chia Sẻ, action combat biến mất. Requirement: combat thắng pending, chỉ **forced state** mới được vượt.

**N4 — MED/HIGH — Giết 1 địch phụ làm node bị đánh dấu "đã dọn" vĩnh viễn.**
`js/engine.js:4994-4998`:
```js
state.enemies = {};
const loc = runtimeLocationPool(state)[state.locationId];
if (loc?.enemies?.length) state.flags.clearedLocations[state.locationId] = true;
```
`search()` (`:4381`) và predator extra (`:4933`) spawn **một** địch mà không gọi `beginCombat`; khi đó `beginCombat` early-return vì `state.enemies` không rỗng (`:4901`) → địch gốc của node chưa bao giờ được nạp.
Kịch bản: node `danger` có `enemies:["yeu_thu","ho_phap_huyen_lan"]`; người chơi tìm kiếm → 1 `yeu_thu` spawn → giết → `clearedLocations[node]=true` → `nearbyEnemies` (`:5622`) vĩnh viễn false → hai địch thật không bao giờ đánh được nữa.

**N5 — MED — Nhánh "desperation" của `monsterAction` không mạnh hơn đánh thường.**
`js/engine.js:4885-4887`:
```js
const action = hpRatio <= 0.25 ? "desperation" : hpRatio <= 0.6 ? "special" : "basic";
const damage = Math.max(1, Math.round(base * (action === "special" ? 1.4 : 1)));
```
Chỉ `"special"` được ×1.4; `"desperation"` = ×1 → địch gần chết đánh **y hệt** địch đầy máu. Đường cong độ khó bị đảo.

**N6 — MED — Công Pháp `guild_signature` được chào trong combat nhưng resolver từ chối category.**
`engine.js:5600` đưa `guild_signature` vào `skillActions`; `techniquePreview` chỉ chặn `tam_phap` (`:1706`); nhưng `useTechnique` (`:1772`) có `supportedCategories = ["chieu_thuc","cam_thuat","than_phap","phu_tro","tran_phap"]` → luôn trả "phải dùng qua action chuyên biệt", mà **không tồn tại** action chuyên biệt nào. `grantGuildTechniques` (`:2743`) luôn cấp `guild_signature_<guildId>` (category `guild_signature`, `:1473`) → nút xuất hiện và luôn thất bại.

**N7 — MED — `enemyTurn` cho toàn bộ địch còn lại đánh tiếp một người chơi đã chết.**
`js/engine.js:4977-4984`: `pendingEnding` chỉ được set **sau** vòng lặp; `monsterAction` clamp hp về `[0,maxHp]` và vẫn áp damage. Với 3 địch, người chơi bị "đánh" 3 lần sau khi đã chết. Chỉ SAN-death (`triggerMadness`) mới break sớm.

**N8 — LOW/MED — `combat()` không trả object kết quả.** `js/engine.js:5057-5072` dùng `return;`. `submitActionId` (`:5903`) kiểm `result === false || result?.success === false` → `undefined` bị coi là "không thất bại" → combat no-op (ví dụ `firstAliveEnemy()` null) không phân biệt được với thành công.

**N9 — LOW — Danh sách `resonanceFates` trong preview liệt kê trùng Mệnh.** `js/engine.js:1698` `[...resonance.elementFateIds, ...resonance.pathFateIds]` — dedupe chỉ áp cho phép tính `bonusPct` (`:1672`), không áp cho list trả về. Preview (`:1738`) thì dedupe. Hệ số đúng nhưng "một Mệnh chỉ đóng góp một lần" bị hiển thị sai.

**N10 — LOW — `spawnCombatEntity` ghi đè HP của địch đang giao tranh.** `js/engine.js:4876` `state.enemies[entityId] = info.hpMax;` vô điều kiện → spawn lại cùng id sẽ hồi đầy máu địch đang bị thương.

### 1.2. Code dễ sinh lỗi

**N11 — MED — Ledger action của Công Pháp không được serialize; high-water reset khi load.**
`js/engine.js:6182-6186` (`toCanonicalCharacter`) vs `:1757-1781`. `serialize` thay toàn bộ player bằng `toCanonicalCharacter(...)` (`:6228`) và canonical character chỉ mang `techniqueCooldowns` — **không** mang `techniqueActionReceipts`, `techniqueActionReceiptHighWater`, `techniqueActionSequence` (cái cuối chỉ sống ở `main.js:992`).
Kịch bản: cast `cam_thuat` với id `technique-ui:7` (đã commit, SAN về 0 = madness) → save → load → receipt/high-water biến mất, sequence UI khởi động lại từ 1 → replay `technique-ui:7` **được chấp nhận** và chạy lại cost/effect.

**N12 — MED — Khoá action mặc định va chạm; hai lần cast hợp lệ trong cùng lượt bị coi là trùng.**
`js/engine.js:1755,1760`:
```js
const actionKey = String(options.actionId || ("turn:" + Number(state.meta?.turn||0) + ":technique:" + id));
if (priorReceipt) { if (priorReceipt.techniqueId !== id || priorReceipt.stance !== stance) return { success:false, duplicate:true, … }; }
```
Không truyền `actionId` (đường `renderActionButtons`, `main.js:931-938`) → khoá cố định theo turn+id → lần cast thứ hai (kể cả đổi stance) trả `duplicate:true`, không tiêu gì. Đồng thời `renderActionButtons` **không** truyền `confirmed`/`actionId` → bỏ qua hoàn toàn high-water guard, trong khi `confirmTechniqueAction` thì dùng → **hai đường vào khác nhau cho cùng một action**.

**N13 — MED — Commit bỏ qua `options.targetId`; preview và hit có thể nhắm hai địch khác nhau.**
`js/engine.js:1724` (preview) `const previewEnemyId = options.targetId || Object.keys(state.enemies||{})[0];` vs `:1797-1798` (commit) `const enemyId = isOffensive ? (Object.keys(state.enemies||{})[0] || …) : null;`. `useTechnique` **không bao giờ đọc `options.targetId`**.
Kịch bản: multi-enemy, caller preview nhắm `targetId=B` nhưng hit lại vào `Object.keys(state.enemies)[0]` = A. "preview == hit coefficient" chỉ đúng khi caller tình cờ nhắm địch đầu.

**N14 — MED — `applyPlayerDamage` không idempotent: gọi lại có thể phát lại EXP/loot/Mệnh.**
`js/engine.js:4953-4959`:
```js
state.enemies[enemyId] = (state.enemies[enemyId] ?? info.hpMax) - damage;
if (state.enemies[enemyId] > 0) return;
delete state.enemies[enemyId]; gainExp(state, info.exp); rollEntityLoot(state, info); … rollDefeatBonus(state, info);
```
Sau khi địch bị xoá, lần gọi thứ hai tính lại `hpMax - damage` như địch mới đầy máu → nếu lethal thì **cấp lại** `gainExp + rollEntityLoot + rollDefeatBonus + roll Mệnh`. Trái "combat loot … must not double-grant on repeat resolution".

**N15 — MED — `search()` không có guard combat; lệnh chữ tự do bỏ qua gate action.**
`js/engine.js:5950` dispatch `/^(tìm kiếm|…)$/` thẳng vào `search(state)`; `search()` (`:4317-4338`) không kiểm `aliveEnemies(state)`. `contextState` chỉ ẩn `act_tim_kiem` khi `combatPossible` → gõ "tìm kiếm" giữa trận vẫn chạy full search (tiêu stamina, roll tài nguyên, **có thể spawn thêm địch** `:4377-4381`).

**N16 — MED — `deserialize` không chuẩn hoá/validate `state.enemies`.**
`js/engine.js:6240-6427` không có bước sửa. Nếu một catalog id biến mất hoặc value hỏng, `aliveEnemies` (chỉ kiểm `Number(hp) > 0`) vẫn tính nó → `inCombat` true, nhưng `combatEntity`/`monsterAction`/`firstAliveEnemy` trả `null` → `combat()` no-op, `monsterAction` không làm gì. Người chơi **kẹt trong combat không thể tiến triển** (phải `act_bo_chay`).

**N17 — MED — Cooldown 0 vẫn ghi record; `readyAtTurn` không tồn tại.** `js/engine.js:1795` `state.player.techniqueCooldowns[id] = state.meta.turn + cooldown;` vô điều kiện. Contract đòi "cooldown 0 không lưu record; cooldown > 0 dùng `readyAtTurn`" — grep `readyAtTurn` = **0 hit** toàn repo. Hành vi phụ thuộc phép so sánh `>` .

**N18 — LOW/MED — Nhóm "world element power" không cap và trộn assignment với multiply.** `js/expansion.js:1258` mùa **gán** `= 1.1`, còn event/weather **nhân** (`:1271-1273`); không clamp. Đổi thứ tự đánh giá là giá trị bị ghi đè âm thầm. Requirement nói có cap theo nhóm; nhóm này không có.

**N19 — LOW — Khoá roll loot chỉ theo entity id, không có ledger.** `js/engine.js:4842` `replayRandom(state, "loot-table:" + info.id, index)` — mọi lần giết cùng id (mọi lượt, mọi encounter, mọi replay) cho **cùng** drop. Loot bị "đóng băng" thay vì roll theo trận.

**N20 — LOW — Seed kết quả contested opportunity chứa `turn`.** `js/expansion.js:4121` `seeded(state, "opportunity-resolve:"+choice, opportunity.id, state.meta.turn)` → kết quả phụ thuộc lượt resolve, không chỉ opportunity id (receipt vẫn chống double-grant).

**N21 — LOW — Nhánh predator-extra bất khả đạt từ `beginCombat`.** `js/engine.js:4931` kiểm `!aliveEnemies(state).length`, nhưng `beginCombat` đã nạp đầy `state.enemies` ở `:4903` **trước khi** gọi `maybeSpawnCombatExtras` → điều kiện luôn false. Chỉ chạy được từ `move()` (`:4179`).

**N22 — LOW — Cờ combat chết.** `act_bo_chay` set `state.flags.threatLevel` (`engine.js:5868`) nhưng không nơi nào đọc; `flags.lastCombatOutcome` chỉ được đọc bởi 1 mục tiêu nhiệm vụ (`:2600`). Write-only state.

### 1.3. Logic thiếu

**N23 — `[RUN]` HIGH — Hiệu ứng kháng/combat của Dị Thể được tính nhưng KHÔNG BAO GIỜ được áp.**
`js/expansion.js:1244-1253` tạo `corruptionResist`, `poisonResist`, `stealth`, `elementPenalty`, `reviveOnce`, `fateResonance`, `sanRecoveryFlat`. Grep toàn repo: **không consumer** cho `corruptionResist`, `poisonResist`, `stealth`, `elementPenalty`, `reviveOnce` (chỉ có chỗ gán + data catalog). Chỉ `sanRecoveryFlat` (`engine.js:3703-3704`) và `fateResonance` (`expansion.js:2419`, chỉ cho fate-evolution) được đọc.
Hệ quả: `thanh_the` `corruptionResist:0.60` không hề giảm corruption gain của `useTechnique` (`engine.js:1786`); `hon_don_the` stage-3 `corruptionResist:0.10`/`elementPenalty` vô tác dụng; `cuu_u_the` `stealth:0.5` không có hiệu lực.

**N24 — HIGH — `reviveOnce` (Bất Tử Thể) không được cài.** Người chơi thất bại bị set trực tiếp ở `engine.js:4983` (`pendingEnding="succumb"` từ `enemyTurn`) và `:6030` (`checkEndings`), **không** consult `getWorldModifiers(...).reviveOnce`. Nhân vật có Bất Tử Thể chết như thường.

**N25 — `[RUN]` HIGH — Địch không bao giờ đổi mục tiêu sang companion trong combat live.**
`js/engine.js` có **0 tham chiếu** `companion`. `enemyTurn`/`monsterAction` (`:4977-4992`) chỉ đánh `state.player`. Damage companion chỉ xảy ra ở `simulateOfflineCompanionCombat` (`expansion.js:1076-1081`). → `recordCompanionDamage`, `damageLedger`, `recovering`, `reviveCount` **bất khả đạt** khi chơi bình thường.

**N26 — MED — Vòng đời companion thiếu `dead` và flee; loyalty không ảnh hưởng combat.**
`expansion.js:1005,1097` chấp nhận `state==="dead"` nhưng **không gì set nó** (`recordCompanionDamage` đặt `recovering` ở hp 0, `:1070-1071`) → `reviveCompanion` chỉ tới được từ `recovering`. Không có trạng thái flee/retreat. `loyalty` chỉ ảnh hưởng scalar damage của skill (`:1055`), không quyết định companion có đánh/from chối/flee. `useCompanionSkill` (`:1049-1059`) không trừ loyalty cost, không cooldown (catalog `expansion_data.js:154-156` cũng thiếu 2 field này).

**N27 — MED — Không có hệ thống enemy-intent / status-effect / buff / debuff.**
grep các symbol `enemyIntent`, `statusEffect`, `buff`, `debuff`, `combatLog`, `combatReward`, `rollDamage`, `playerTurn`, `combatRound` = 0 hit trong `js/` (hit duy nhất là `buff|debuff` trong regex banned-words `engine.js:5260`). Combat là một công thức cứng mỗi bên, không telegraph, không status.

**N28 — MED — Parity preview/hit không được ép cho nhánh không có địch.**
`js/engine.js:1741` (fallback preview) khi `combatPreview` null thì `powerMultiplier` **bỏ qua** `mastery`, `elementMult`, `familyMult`, `comprehension`, `corruptionPenalty`, `originDamageMult` mà projection thật (`:1692-1697`) có. Kết hợp N13 → "preview và commit dùng chung resolver" chỉ đúng cho ca một-mục-tiêu-có-địch.

**N29 — LOW/MED — Companion không có stat attack → damage là hằng số.** `tamePrisoner` (`expansion.js:3546`) tạo companion với `loyalty/element/passiveId/role/guardStance/hpMax/hp` nhưng **không `attack`**; `useCompanionSkill` (`:1055`) fallback `companion.attack || 8` → mọi companion đánh `8 + loyalty*tỉ lệ`.

**N30 — LOW — `resonancePolicy` khai báo nhưng bị bỏ qua.** `data/cong_phap.js:98` `{ activeOnly:true, suppressed:false }` nhưng `techniqueFateResonance` (`engine.js:1660-1673`) không đọc policy; nó hardcode `state.player.fates` + `suppressedFates`.

**N31 — LOW — Symbol `usesConfirmation` không tồn tại.** Cơ chế thật là `requiresConfirmation`/`confirmed` (`engine.js:1771`).

---

## 2. VÙNG PHỦ MỚI #2 — SEARCH / EXPLORATION / HIDDEN REALM

### 2.1. Lỗi logic

**N32 — `[RUN]` P1 — Khoá ledger thưởng hidden realm va chạm → realm thứ hai không thể nhận thưởng.**
`js/expansion.js:3626-3627`:
```js
const rewardKey = active.cycleIndex + ":main";
grantCanonicalReward(state, "hidden_realm:" + active.realmId, definition.reward, rewardKey);
```
`grantCanonicalReward` dùng `String(uniqueKey || sourceId)` làm khoá **toàn cục** (`expansion.js:1681-1682`), ở đây `uniqueKey = "<cycle>:main"` **không có realmId**.
**Đã đo (T7):** realm A claim `"1:main"` → success; realm B (cùng cycleIndex) → `success:false, duplicate:true`; ledger chỉ có `1:main`. Không có message, và `claimedRewardKeys` của B **không** được ghi → validator per-realm cũng không bắt. Test còn hardcode hành vi sai: `tools/verify_review_batches.js:369` assert `rewardLedger["1:main"].exp === 120`.

**N33 — `[RUN]` P1 — `travelToSafeHub` để `pendingMapEvent` kẹt `pending`.**
`js/engine.js:2685-2700` không abandon map event; `pendingDepartureGuard` có `act_ve_noi_an_toan` (`:4259`) nhưng `confirmPendingDeparture` (`:4263-4277`) chỉ xử exploration + opportunity. So sánh: `move()` có block riêng `pendingMapEvent → "abandoned"` (`:4148-4156`) mà `travelToSafeHub` **không chạy**.
**Đã đo (T12):** sau `confirmPendingDeparture`, `pendingMapEvent.status` vẫn `"pending"`. `resolveMapEvent` sau đó từ chối (`pending.nodeId !== state.locationId`), `validateMapEventState` báo `"pending"` (`:4711`) → rò rỉ không thể giải quyết cho tới khi người chơi tình cờ quay lại node.

**N34 — P1 — Vào/ra hidden realm là đường di chuyển không guard.**
`js/engine.js:4259` `isDeparture = act_move_ || act_ve_noi_an_toan || act_exp_travel_` — **không** có `act_exp_realm_`. `hiddenRealmEnter` (`expansion.js:3604-3612`) và `exitHiddenRealm` (`:3630-3634`) không clear `pendingExploration`, không abandon `pendingMapEvent`.
Kịch bản: tìm kiếm tại `co_mieu` (pending exploration) → bấm "Vào Cổ Mộ Vô Danh" → `locationId` thành `hidden:co_mo_vo_danh:1:entry`, pending **không** được chạm → `pendingExplorationAt` trả `null` do mismatch → pending **vô hình và không thể phục hồi**.

**N35 — P1 — trigger `explore_action` là code chết; xác suất sai lệch.**
`js/engine.js:4624`:
```js
const chance = trigger === "first_discovery" || firstDiscovery ? 1 : trigger === "explore_action" ? 0.55 : 0.14;
```
`maybeTriggerRandomEncounter` **chỉ** được gọi từ `move()` (`:4178`) với `"first_discovery"`/`"moving_through"` → nhánh `"explore_action"` bất khả đạt. Requirement (`CROSS_SYSTEM_CANONICAL.md:44-46`): `moving_through 25% / explore_action 90% / first_discovery 100%`; code: `14% / 55% / 100%`.
Kịch bản: người chơi đi giữa các node mong ~1 event/4 lần; engine roll 14%. Đường "khám phá chủ động" (90%) không tồn tại.

**N36 — P2 — `search()` kiểm `state.pendingSearch` thô thay vì qua normalizer.**
`js/engine.js:4322` `if (state.pendingSearch) { … }` trong khi mọi call site khác dùng `normalizePendingDiscovery`/`pendingExplorationAt`. Nếu pending logic nằm ở `pendingExploration` mà `pendingSearch` chưa sync (bản ghi legacy, hoặc đường chỉ gán `pendingExploration` trước khi `ensure()` chạy) → `search()` không phát hiện và mở **session thứ hai**, ghi đè qua `setPendingSearch` (`:4384`) → mất findings cũ.

### 2.2. Code dễ sinh lỗi

**N37 — P1 — `collectSearchFindings` tiêu thụ findings chưa từng được cấp.**
`js/engine.js:4406-4416`: findings bị **xoá vô điều kiện** bất kể `addItem` trả truthy hay `createLootItem` trả `null`. Nếu item id lạ (`addItem` → `false`, `:2082`) hoặc `window.ItemGenerator` thiếu → thưởng bị xoá im lặng. Ngược lại cũng không idempotent: nếu chỉ còn findings `information`, re-collect vẫn `success:true` và phát lại narration.

**N38 — P2 — Không có `findingId` → không có khoá idempotency.** Findings chỉ push `{type,itemId,qty,label}` (`js/engine.js:4355-4384`); dedupe chỉ theo `JSON.stringify([type,itemId,label,qty])` (`:4236-4241`). Requirement đòi "không thể nhận hai lần cùng `session`/`findingId`". Khoá theo nội dung còn có thể **nuốt nhầm** hai findings khác nhau nếu sau khi nhân `worldSearchMult` rồi làm tròn chúng bằng nhau.

**N39 — P2 — `pendingExploration` sai schema và không bao giờ hết hạn.**
`js/engine.js:4384` tạo `{locationId, session, findings, createdAtTurn}`. Requirement: `{nodeId, findings, risk, weather, npcAssistId, createdTurn, expiresTurn}`. Thiếu `risk`, `weather`, `npcAssistId`, `expiresTurn`; sai tên `nodeId`/`createdTurn`.
Vì không có `expiresTurn`, một pending discovery **chặn action tìm kiếm của node vĩnh viễn** (`:5684 !state.pendingSearch`) cho tới khi giải tay, và tồn tại qua reload không có TTL.

**N40 — P2 — "Nhờ NPC Dẫn Dấu" là alias byte-for-byte của "Điều Tra Dấu Vết".**
`js/engine.js:5864` `act_explore_npc_assist: () => investigateSearchFinding(state),`. Handler không kiểm NPC có mặt (chỉ danh sách action kiểm), không set `npcAssistId`, không tăng Trust/Respect, không giảm risk, và dùng **cùng namespace khoá** với `investigateSearchFinding`. Người chơi không có NPC (hoặc gọi qua free-text) vẫn được full hiệu ứng.

**N41 — P2 — `discoveryStatusSummary` không phải read model; chuẩn hoá phụ thuộc thứ tự gọi.**
`js/expansion.js:3057-3073`: `const status = order[entry.status] ? entry.status : "discovered"; entry.status = status;` — **ghi** trong "read model". `discover()` dùng `entry.status ||= "discovered"` (`:3043-3044`) → giữ nguyên status rác truthy. `validateDiscoveryLifecycle` (`:3076-3077`) chạy **trước** mọi lần UI đọc → save hỏng báo `category:id:status` cho tới khi người chơi mở tab Oddities. Không thể đếm thuần: gọi summary là mutate archive.

**N42 — P2 — `flags.mapEventCount` không được tăng; treasure trùng bỏ qua cooldown/history.**
`js/engine.js:4722-4723` vs `4746`: `if (mapEvent) return "map_event";` — **không** `mapEventCount++`. Requirement `CROSS_SYSTEM_CANONICAL.md:268` đòi tăng khi event thật xảy ra. Đường duplicate receipt (`:4667`) early-return để `record.cooldownUntilTurn` nguyên vẹn và không push history → replay treasure **bỏ qua cooldown** mà đường đầu đã set.

**N43 — P2 — `investigateSearchFinding` sửa vĩnh viễn một node open-world không liên quan.**
`js/engine.js:4447-4459`: ở `chainStage === 2` nó chọn hướng exit trống đầu tiên và ghi đè `name`/`desc` của node láng giềng đã sinh, lưu `site.secretLocationId`. Đây là side effect one-shot không có guard uniqueness xuyên node/save; nếu cùng node đó bị site khác chạm (hoặc save reload trước khi `secretLocationId` được set) → hành vi phụ thuộc thứ tự/save. Cũng không tạo node semantics `nodeType:"dong_phu"`.

**N44 — P2 — `chainStage` có thể nhảy nhiều bậc; yêu cầu quest bị trôi.**
`js/engine.js:4432` `site.chainStage = Math.min(3, Number(site.chainStage||0)+1);` — một session cho nhiều findings `information` sẽ đẩy `chainStage` 2–3 bậc trong một lần; `beats[site.chainStage-1]` lặp nhảy narration. `ensureSearchChainQuest` (`:4462-4463`) tính lại `requiredSearches` từ số search sống mỗi lần investigate → ngưỡng objective đã lưu **trôi**, quest có thể thành bất khả thi hoặc dễ dàng thừa.

**N45 — P2 — Trạng thái `omen` của hidden realm bất khả đạt / bị nhảy.**
`js/expansion.js:1726-1732`: `opensDay = cycle*cycleDays + 1`; với **cycle 0** → `opensDay - 2 = -1` → cycle đầu **không bao giờ** vào `omen` (data dùng `cycleDays:60`). Thêm nữa `simulateWorldAggregate` gọi `updateHiddenRealms(state, endDay)` **một lần** ở ngày cuối (`:2959`) → mọi bước nhảy thời gian không rơi đúng `opensDay-2` sẽ bỏ qua omen. Cửa sổ mở còn bao gồm `closesDay` → dài `durationDays + 1`.

**N46 — P2 — `createContestedOpportunity` trả record cũ bất kể status.**
`js/expansion.js:4102` `if (state.pendingContestedOpportunity) return state.pendingContestedOpportunity;` — một record hỏng/legacy còn status khác `pending` sẽ **chặn toàn bộ** cơ duyên về sau, vĩnh viễn.

**N47 — P2 — `travelToSafeHub` mutate trước khi validation của chính nó thất bại.**
`js/engine.js:2686-2693`: `confirmPendingDeparture(state);` chạy **trước** `if (!destination) return {...}` và `if (Object.keys(state.enemies||{}).length) return { success:false, … }`. Nếu dispatch khi đang có địch (qua đường synthetic trong `submitActionId`, `:5877-5882`), người chơi **mất cơ duyên vĩnh viễn** trong khi travel thất bại và không di chuyển.

**N48 — P2 — `search` spawn combat nhưng để session pending; có thể bỏ qua combat bằng synthetic departure.**
`js/engine.js:4377-4398` và `:5877-5882`: `moveActions` trả hướng bất kể combat (`:5560-5579`) nên fallback `confirmPendingDeparture` có thể resolve một move **giữa trận**; `move()` sau đó roll `maybeTriggerRandomEncounter` và spawn travel combat → quy tắc "combat không bị cắt bởi event roll" chỉ đúng qua `contextState`, không đúng qua đường bypass này.

### 2.3. Logic thiếu

**N49 — P2 — Bonus spawn Dị Biến theo Corruption không tồn tại.**
`CROSS_SYSTEM_CANONICAL.md:112-114`: Dị Biến chỉ ở `cam_dia`/`hai_vuc_khong_vuc`, **+10% nếu `Corruption_Rating > 40`**. Code: `rollMapEvent` trả `null` cho group `monster` và vòng entity chỉ lọc theo `location_tags` + `appearance_weight` (`engine.js:4626-4631`, `:4730-4741`); `player.corruptionRating` **không bao giờ** được đọc để bias spawn.

**N50 — P2 — Cooldown event theo loại không đúng spec.**
`CROSS_SYSTEM_CANONICAL.md:208-216`: NPC 5 phút, monster 3 phút, Cơ Duyên 30 phút, Động Phủ none — code dùng **số lượt tuỳ ý** (`engine.js:4598-4602`: `npc` 5, `co_duyen` 90/120/30, `dong_phu` 0); group **monster không set cooldown nào** (`:4631` `record.discovered = true; return null;`); cooldown không phụ thuộc `trigger` (`explore_action` phải lâu hơn `moving_through`).

**N51 — P2 — `competitorProgress` không bao giờ được ghi.**
Khởi tạo `{}` (`js/expansion.js:559`), chỉ được **validate** (`:4155`), không nơi nào ghi. Không có mô phỏng tiến độ đối thủ → "deterministic across save/load" đúng một cách vô nghĩa; toàn bộ layer competitor là state chết.

**N52 — P2 — `node.eventPoolTag` bị bỏ qua.**
`js/engine.js:4604-4613` luôn tự suy tag từ `locationId`/`dangerLevel`/`enemies`/`name`/`region`; tag do tác giả đặt trên node **không bao giờ** được đọc → mọi weighting authored bị ghi đè im lặng.

**N53 — P2 — Không có guard "travel active" cho search; nhánh `act_exp_travel_` chết.**
`WORLD_SIMULATION_CANONICAL.md:70` đòi không bắt đầu search khi đang combat **hoặc travel active**. `pendingDepartureGuard` (`engine.js:4259`) kiểm `actionId.startsWith("act_exp_travel_")` nhưng grep **không có producer** nào phát `act_exp_travel_*`. Search chỉ gate combat + depth + stamina + pending; khái niệm travel-in-progress không được nối.

**N54 — P2 — Chuỗi chiếm Động Phủ không theo contract.**
`js/engine.js:4681` `node.caveAbode ||= { status:"unconquered", … }; node.mapNodeType="dong_phu"; node.caveAbode.status="claimed"; addItem(state,"linh_thach",…)`. Requirement `CROSS_SYSTEM_CANONICAL.md:172-196`: phải tạo/mark một **node láng giềng ẩn** thành `nodeType:"dong_phu"`, rồi chuỗi chướng ngại "Chinh Phục Động Phủ" (Hộ Pháp Thú / Trận Pháp / Cấm Chế), rồi `claimedByPlayerId` + loot khởi tạo một lần. Code: không node láng giềng, không chuỗi chướng ngại, không `claimedByPlayerId`, claim **tức thì** khi chọn "Chinh phục" (không test, không roll).

---

## 3. VÙNG PHỦ MỚI #3 — ITEM / INVENTORY / AUCTION / HEIRLOOM

### 3.1. Lỗi logic

**N55 — `[RUN]` HIGH — `createLootItem` bơm RNG chỉ số hằng số → sinh vật phẩm suy biến.**
`js/engine.js:2519`:
```js
const item = generator.createRandomItem(targetKind, () => replayRandom(state, scope, state.generatedItemSequence), { idSeed: … });
```
`state.generatedItemSequence` được tăng **một lần, trước** lời gọi (`:2518`) và **không đổi** trong suốt `createRandomItem`; `replayRandom` là hàm thuần của `(scope, day, index)` → **mọi lời gọi `rng()` trong một lần sinh item trả về cùng một giá trị** (dùng cho prefix, suffix, attribute, base type, roll `badChance` và hash id).
**Đã đo (T4):** 400 lần sinh → `distinctNames=64`, `distinctPrefixes=64`, **`prefixesWith>1suffix=0`** — tức prefix và suffix khớp 1-1 hoàn hảo, đúng dấu hiệu "cả hai suy ra từ cùng một scalar". Test replay vẫn xanh chỉ vì `testDiscoveryReplay` (`verify_review_batches.js:263`) assert **bằng nhau**, không bao giờ assert **đa dạng**.

**N56 — HIGH — Guard item bị nguyền của `markHeirloom` là code chết.**
`js/expansion.js:3568` `if (item.cursed && item.identified === false) return { success:false, … };` — item sinh ra set `cursed: isBad` (`gemini-code:128`) nhưng **không bao giờ** set `identified`; `undefined === false` là `false` → guard không bao giờ chạy.
Kịch bản: `markHeirloom(state, cursedItemId)` thành công, đánh dấu Di Truyền vĩnh viễn lên item bị nguyền chưa giám định.

**N57 — HIGH — Tặng item quest/khoá/đang trang bị làm hỏng inventory vs equipment.**
`js/expansion.js:2011-2017` (`giftNpc`), producer ở `:3782-3783`: chỉ kiểm `Number(state.inventory?.[itemId]||0) < 1`; **không** kiểm `item.kind === "key"`, `item.questItem`, `item.blocked`, hay `equippedItemIds`. Sau đó `removeItem(state, itemId, 1)`.
Kịch bản: trang bị `hac_thiet_kiem` → tặng cho NPC → `removeItem` xoá đơn vị cuối nhưng `state.player.equipment.artifacts` vẫn tham chiếu → `equippedItemQuantity` đếm item không còn sở hữu. Action bar (`:3782`) chào **mọi** item có qty>0, kể cả item trang bị và chìa khoá quest.

**N58 — MED — `awakenItem`/`syncHeirloomWear`/`craftArtifact` sửa catalog tĩnh dùng chung.**
`js/expansion.js:3561-3562,3580,4071`; alias tại `js/engine.js:2510-2511`:
```js
D().ITEMS[item.id] = state.generatedItems[item.id];   // engine.js:2511 — CÙNG object reference
item.phy = Number(item.phy||0) + 2; item.mag = … + 2; // expansion.js:3562
```
Vì `generatedItems[id]` và `D().ITEMS[id]` là **cùng một object**, thức tỉnh/wear/craft-quality đều ghi vào catalog toàn cục. Contract SYS-06 §10.4: "awakening không mutate static catalog".
Kịch bản: `D.ITEMS` là singleton → item được thức tỉnh ở save A hiển thị (đã mutate) cho bất kỳ state/share nào khác trong cùng process; `Object.assign(D().ITEMS, state.generatedItems)` khi load (`engine.js:6311`) pollute catalog vĩnh viễn bằng item của save vừa load. `ensure()` còn re-merge professions vào `D.ITEMS` **mỗi lần gọi** (`expansion.js:501`).

**N59 — MED — `craftArtifact` mất một phần cost khi tạo output thất bại.**
`js/expansion.js:4068-4069`: `commitRecipeCosts(state, recipe)` (trừ `linh_thach:8` + `stamina:5`) rồi `if (!item) { addItem(state,"linh_thach",8); return {success:false, …}; }` — chỉ hoàn `linh_thach`, **5 stamina mất im lặng**. Gốc rễ là thứ tự "trừ cost rồi mới tạo output"; đúng phải là tạo-trước-commit-sau.

**N60 — MED — `brewPill` âm thầm thay output bằng item khác.**
`js/expansion.js:3280` `const outputId = recipe.output?.itemId && D.ITEMS?.[recipe.output.itemId] ? recipe.output.itemId : "tu_khi_dan";` — nếu output của recipe bị xoá/đổi tên khỏi `D.ITEMS`, người chơi nhận `tu_khi_dan` thay vì báo lỗi. Contract: "recipe không tồn tại không được fallback âm thầm".

**N61 — MED — Thành viên equipment-set suy ra từ token tên ngẫu nhiên.**
`js/expansion.js:502-507` `if (item.name.includes("Bá Vương")) item.equipmentSetId = "Bá Vương";`. Nhưng `gemini-code:82` xếp `"Bá Vương"` trong danh sách **ATTRIBUTES** → một drop ngẫu nhiên tên kiểu `"Thượng Phẩm Giáp Thái Cổ - Bá Vương"` tự động được gắn set; `equipmentSetState` (`:1207-1213`) đếm nó.
Kịch bản: hai drop may mắn cùng attr `Bá Vương` (1 artifact + 1 protection) → người chơi **vô tình** nhận set bonus `combatPowerMult:0.12`. Đây cũng là một lần mutate catalog (item bị ghi lại ở thời điểm `ensure()`).

**N62 — MED — `useItem` tra theo substring tên và bỏ qua `questItem`.**
`js/engine.js:1354` `if (actionId === "use") { useItem(state, item.name); return true; }` và `:4478-4482`: `const itemId = Object.keys(state.inventory).find((id) => { const it = D().ITEMS[id]; return it && it.name.toLowerCase().includes(name.toLowerCase()); });`. Action truyền **tên** (không phải id), `useItem` trả key đầu tiên có tên **chứa** nó → một item khác mà tên là superstring (đứng trước theo thứ tự) có thể bị tiêu thụ. `useItem` chặn `kind==="key"` nhưng **không** chặn `questItem`/`blocked`, rồi xoá item ở `:4531`.

**N63 — `[RUN]` MED — `removeItem` xoá quá số lượng mà không báo lỗi.**
`js/engine.js:2104-2108`: `state.inventory[itemId] -= qty; if (… <= 0) delete state.inventory[itemId]; return true;`. **Đã đo (T5):** có 2, `removeItem(state,id,5)` → `returned=true`, stack biến mất. Mọi caller hiện tại pre-validate, nhưng đây là primitive over-consumption tiềm ẩn cho caller tương lai; kết hợp N57/N62 thì thành rủi ro thật.

**N64 — LOW — `visitTomb` trả success khi thưởng là duplicate.** `js/expansion.js:3727` bỏ qua `granted.success`; gọi lại (hoặc tomb thứ hai cùng id sau migration lỗi) báo success trong khi ledger từ chối.

### 3.2. Code dễ sinh lỗi

**N65 — MED — Market loot theo thời gian thực; `purchased` bị xoá khi refresh.**
`js/engine.js:1987-1995,1999`:
```js
function refreshMarket(state, now = Date.now()) {
  … if (state.market.offers.length && now - Number(state.market.generatedAt||0) < Number(state.market.refreshIntervalMs||60000)) return state.market;
  state.market.generatedAt = now; state.market.offers = [...fates, ...items]; state.market.purchased = {};
}
```
Nội dung offer có seed (`replayShuffle(..., "market-items")`), nhưng **gate refresh theo wall-clock** và `purchased` bị xoá mỗi lần refresh.
Kịch bản: mua offer `linh_thach`/equipment → chờ 60 s → offer y hệt (deterministic) xuất hiện lại và **mua được nữa** → vòng lặp thưởng trùng không giới hạn, bỏ qua quy tắc "duplicate rewards qua `grantCanonicalReward` với key ổn định".

**N66 — MED — Save lưu **nguyên object catalog** procedural, không lưu instance delta.**
`js/engine.js:6226-6238` (`serialize` = `JSON.parse(JSON.stringify(state))`) + `:6309-6311` (re-merge vào `D().ITEMS`). Contract (DATA_RUNTIME + item contract): "Save chỉ lưu instance data (id + field thay đổi); field tĩnh resolve từ catalog khi load".
Kịch bản: save phình đơn điệu theo mỗi drop; row catalog đã chết sống mãi; và (N58/N65) row được merge lại pollute ván mới trong cùng process.

**N67 — MED — Re-sync wear của heirloom xoá bonus thức tỉnh (phụ thuộc thứ tự).**
`js/expansion.js:3572,3576-3582,3677`: `baseStats` bị đóng băng tại `markHeirloom`; `syncHeirloomWear` sau đó viết lại mọi stat thành `baseStats * (1 - wear)`.
Kịch bản: mark heirloom (phy=12) → `awakenItem` (+2 → 14) → luân hồi lần đầu: `phy = 12*0.95 = 11.4` — mất +2. Thứ tự awaken vs mark đổi kết quả cuối.

**N68 — MED — Pool ứng viên đấu giá phụ thuộc thứ tự chèn và chứa cả tiền tệ/chìa khoá quest.**
`js/expansion.js:4033` `const candidates = Object.keys(D.ITEMS||{}).filter((id) => D.ITEMS[id]?.kind !== "quest").slice(0, 20);` — `D.ITEMS` là catalog đã bị mutate (generated items append, professions merge). Hôm nay tình cờ bằng ~20 key tĩnh+nghề, nhưng bất kỳ tăng trưởng catalog hoặc thứ tự chèn khác đi sẽ đổi 20 id mà picker seeded index vào → cùng `day` ra lot khác giữa các build. Pool còn chứa `linh_thach` (tiền tệ) và `co_tich_tan_trang` (chìa quest) → đấu giá có thể bán item gating quest. `validateAuctionState` chỉ kiểm `D.ITEMS[lot.itemId]` tồn tại (`:4055`), không kiểm kind.

**N69 — LOW — `AuctionLot` schema drift (thiếu profile NPC).** `js/expansion.js:4037` tạo `{…, bidderId:"npc", …}`; contract §10.3 đòi `npcBidProfileIds: []` + "bid NPC deterministic theo wealth proxy faction/resource và preference tag". Validator không kiểm field.

**N70 — LOW — `rehydrateUnknownContent` không bao giờ được gọi ở runtime.** Định nghĩa `js/expansion.js:2631`, export `:4281`; chỉ `tools/verify_dichi_deep.js:163` gọi. `ensure()` mark item lạ `dormant` (`:483-485`) nhưng không gì re-hydrate khi catalog lớn lên trong chơi thật.

**N71 — LOW — Generator export dùng mặc định `Math.random` + `Date.now`.**
`gemini-code-1788430656294.js:91,114` (`defaultRandom`, và `idSeed == null → Date.now()...`), export lại qua `window.ItemGenerator`; `E.createLootItem`/`E.registerGeneratedItem` cũng export (`engine.js:6432`). Bất kỳ caller ngoài nào bỏ qua `rng`/`idSeed` sẽ tạo identity không replay được.

### 3.3. Logic thiếu

**N72 — HIGH — Nhánh thức tỉnh lạ không có record `sealed` / không có đường phục hồi.**
`js/expansion.js:3556-3564` hardcode chỉ `"di_linh"`/`"ho_chu"`; không có awakening catalog; `awakeningStatus:"sealed"` **không bao giờ** được ghi; `state.unknownContent` **không có** bucket `awakenings` (`:481-485`). Contract (DATA_RUNTIME + CROSS_SYSTEM §18.2): "unknown awakening branches remain sealed on the item legacy record and must never be silently discarded".

**N73 — HIGH — Schema `legacy` của item không nhất quán; 2 counter không bao giờ được cập nhật.**
`js/expansion.js:3946` tạo `{usageCounters:{combatWins:0, eliteWins:0}, …}`; `:3571` tạo `{usageCounters:{combatWins:0}, …}` — **thiếu** `forbiddenUses`, `regionsVisited`, `awakeningId`. Chỉ `combatWins`/`eliteWins` từng được tăng (`:3946`). `usageCounters.forbiddenUses` và `regionsVisited` **không nơi nào ghi**, `marks[]` không bao giờ được populate — dù §10.1 nói awakening template được chọn "theo item category, element, marks và hành vi". Có tín hiệu forbidden-action ở `:3940` (`/forbidden|cam_thuat/`) và handler move ở `:3949`, nhưng **không** cái nào feed vào item legacy.

**N74 — MED — Không có preview recipe / không có resolver preview-commit chung.**
`js/expansion.js:328-339,3268-3284,4063-4073`; không tồn tại symbol `recipePreview*`/`canCraft` nào. Chỉ có hàm commit. Contract: "preview không tiêu nguyên liệu/RNG … preview và commit dùng cùng resolver".

**N75 — MED — `awakenItem` từ chối item tĩnh có `canAwaken:true`.**
`js/expansion.js:3557` `const item = state.generatedItems?.[itemId]; if (!item) return {success:false, reason:"Chỉ trang bị procedural mới có thể thức tỉnh."}`. Contract §10.1: "generated equipment **hoặc item definition có `canAwaken:true`**".

**N76 — LOW — Mẫu "trừ trước – hoàn sau" rải rác.** `engine.js:2003-2009` (`buyMarketOffer`), `:3242-3244` (`buyFateAtMarket`), `expansion.js:4068` (`craftArtifact`, hoàn **không đủ**). Ngược lại `markHeirloom`/`repairHeirloom`/`placeFormation`/`createCoverIdentity`/`buyIntel`/`placeBounty`/`contributeGuildProject` validate trước đúng.

### 3.4. Phán quyết bất biến (theo yêu cầu)

| Bất biến | Phán quyết | Bằng chứng |
|---|---|---|
| Heirloom giữ **đúng một** item | **ĐƯỢC ÉP** | `expansion.js:3569` quét `state.generatedItems` tìm `legacy.heirloom` khác trước khi set |
| Wear cap 25% (5%/đời) | **ĐƯỢC ÉP** | `:3677` `clamp(wear+5,0,25)`; `:3579` `1 - clamp(wear,0,25)/100`. *(Caveat: re-sync xoá bonus thức tỉnh — N67)* |
| Auction reload không reroll đối thủ | **ĐƯỢC ÉP (phần lớn)** | `refreshAuction` trả cache trong 7 ngày (`:4031`); lot id `"lot_"+day+"_"+i`; roll NPC `seeded(..., day, index)` (`:4035`, `:2768-2769`). Rủi ro tiềm ẩn: index theo thứ tự `Object.values`, pool `Object.keys(D.ITEMS).slice(0,20)` (N68) |
| Tiền reserve không bị nhân đôi/mất | **ĐƯỢC ÉP** | Refund-once ở `bidAuction` (`:4045`) và `updateAuction` (`:2770`); delivery idempotent (`grantCanonicalReward`, `:2776`/`:2956`) |
| Identity item deterministic cho replay | **MỘT PHẦN** | Trong game có seed (`engine.js:2519`) nhưng **index RNG hằng số** (N55); generator export mặc định `Date.now()`/`Math.random` (N71) |
| Không mutate static catalog | **BỊ VI PHẠM** | `engine.js:2511,6311`; `expansion.js:501,502-507,3562,3580,4071` |

---

## 4. VÙNG PHỦ MỚI #4 — INTEGRITY DATA LAYER (số đo thực)

### 4.1. Đếm / phân bố — KẾT QUẢ ĐÚNG

**`[RUN]` (T11/T8):** `total=10000`, `grades={phan:5000, linh:2500, hoang:1200, huyen:700, dia:400, thien:150, thanh:49, tien:1}`, `duplicates=0`, Tiên duy nhất = `than_dao_151`. Field bắt buộc có trên 10000/10000 entry. `element` distinct = **6** (`kim,moc,thuy,hoa,tho,vo_he`) — **0** giá trị ngoài canonical. `resonanceEffect` = **130** entry (khớp `resonance_effects_v2.json`).
→ **Không có khiếm khuyết count/distribution.** Đây là kết quả **đo được** (agent đọc tĩnh không đo được vì file 1 dòng).

**Residual:** `tags: []` rỗng ở **1266/10000** entry (87.3% coverage) — vẫn là mục "1.266 tag trống" mà Gate A của FATE_CANONICAL ghi chưa review.

### 4.2. Tham chiếu treo

**N77 — `tho_san_di_triều` lệch dấu.** `data/expansion_data.js:127` `unlocksHiddenProfession[3] = "tho_san_di_triều"` (U+1EC1) vs key catalog `tho_san_di_trieu` (`:133`). Graph builder (`expansion.js:514-522`) không giải được → `lead.sourceId`/`crosscheck.regionId` = `null`.

**N78 — Cả 4 `linkedTaThanId` trỏ vào id world-event, không phải Tà Thần.**
`expansion_data.js:137-140` đều `linkedTaThanId:"ta_than_tien_trieu"`, chuỗi này **chỉ tồn tại** là `worldEvents[3].id` (`:45`). Id Tà Thần thật là `tathan_vo_dien_cuong_vuong` (`data/npc_monsters.js:8`). Không entity/catalog nào định nghĩa `ta_than_tien_trieu`.

**N79 — `[RUN]` `sample_characters.json`: 25/25 tham chiếu Mệnh treo.**
`fate.equippedIds` là số nguyên `[403,231,472,32,147]`, `[472,6,145,676,577]`, `[487,355,586,356,80]`, `[220,722,494,696,670]`, `[663,611,799,69,562]`; catalog id là slug chuỗi (`than_dao_151`). **Đã đo (T10):** `fateRefs=25 dangling=25`. (`techniqueIds` và realm `di_menh` thì resolve được.)

**N80 — Bảng loot của `npc_monsters.js` là mồ côi.** `lootTables.loot_hac_lang_vuong`, `loot_vong_nhan_chi_nhan` tham chiếu entity `hac_lang_vuong`/`vong_nhan_chi_nhan` **không tồn tại** trong `entities`, và mọi entity đều `loot_table_id: null` (`data/npc_monsters.js:19-22`) → không gì tiêu thụ.

**N81 — `data/README.md:9` trỏ file không tồn tại** `fate_system_update/FATE_DATA_SOURCE_MAP.md` (chỉ tồn tại dưới dạng mục trong `FATE_CANONICAL.md`).

### 4.3. Drift schema

**N82 — Drift id Con Đường (lớp lỗi lớn nhất của data).**
Canonical 10 id: `kiem_dao, di_hoa, linh_van, thien_menh, ngu_thu, khoi_loi, ta_am, mong_canh, dao_the, thien_co`.
- `data/path_fate_relations.js` (và `.json` khớp nhau) key bằng id **tiền-canonical**: `kiem_dao, dan_dao, phu_dao, phong_thuy_dao, ngu_thu_dao, khoi_loi_dao, am_luat_dao, mong_canh_dao, luyen_the_dao, tinh_tuong_dao` (+ `ngoai_dao_gia`) → **chỉ 1/10 khớp**. Đã map: `dan_dao→di_hoa`, `phu_dao→linh_van`, `phong_thuy_dao→thien_menh`, `am_luat_dao→ta_am`, `luyen_the_dao→dao_the`, `tinh_tuong_dao→thien_co`.
- `data/cong_phap.js` `pathAffinity` dùng **7 giá trị**, 6 không canonical (`cong_phap.js:12,26,34,69,83`).
- `data/expansion_data.js` `professionDefinitions[*].relatedPaths` (`:90-93`) và `hiddenRealms[1].unlock.value = "tinh_tuong_dao"` (`:118`) đều tiền-canonical.

**N83 — Enum của `cong_phap.js` thì ĐÚNG.** 12 technique; `element` ∈ {kim,moc,thuy,hoa,tho,vo_he,di_he} ✔; `category` ∈ {chieu_thuc,tam_phap,phu_tro,tran_phap,cam_thuat} ✔; `family` ✔; `grade` ✔.

**N84 — Drift realm id trong NPC/guild.** `data/npc_monsters.js` dùng realm id legacy `"phan_nhan"`/`"hoa_than_so_ky"` (là `legacyIds` của `di_menh`/`than_tinh`); `data/tu_tien_factions.json` guild dùng `highest_realm` legacy (`do_kiep, luyen_hu, hop_dao, hoa_than, nguyen_anh, kim_dan, dai_thua`). Resolve được qua `legacyIds` nhưng lệch model 14 cấp phẳng.

**N85 — Catalog profession-item bị nhân đôi nguồn.** Cùng id tồn tại ở **hai** file: `data/profession_items.js` (5 item) và `data/expansion_data.js` `professionItems` (3 item con). Hai nguồn cho cùng namespace (và bị mutate vào `D.ITEMS`).

**N86 — `data/data.js` fallback nguy hiểm.** `REALMS = window.CULTIVATION_DATA?.realms || FALLBACK_REALMS`; `FALLBACK_REALMS` chỉ có **6** realm legacy (`phan_nhan…hoa_than`), không phải 14 (`data.js:19-50,52`). Vì `world_data.js` load trước `data.js` nên hiện dùng 14 thật, nhưng bất kỳ thay đổi thứ tự load nào sẽ **âm thầm** hạ xuống 6 realm legacy.

### 4.4. Staging vs runtime

- **Không có file staging lọt vào browser** ✔: `index.html:114-122` chỉ nạp 9 file data runtime; `fate_data_with_tags.json`/`tu_tien_factions.json` không được nạp.
- **Catalog runtime mang schema đã merge** ✔: `data/fate_data.js` có `tags`, `element`, `resonanceEffect`, và id đã regrade `phong_an_the_8982`.
- **`index.offline.html` là bundle cũ** (đã ghi ở báo cáo #1 G14): serialize `version:12`/`tu_vi_quy_di_final`, 0 `emitEvent`, thiếu `#pinned-character-summary`, `professionState` thiếu `hiddenIds`, `specialPhysiqueState.schemaVersion:1` vs runtime `2`.

### 4.5. Doc vs data

**N87 — `data/Xianxin_guild.md` có lỗi encoding + ký tự CJK.** Header `## CẤP 5: MÔN PHÁI LỄN LỐN / HẮC ĐẠO / TÁN TU LIÊN MƠNH` (mojibake) và **`T族`** (ký tự CJK) trong `Nhiên Thiên Thái Cổ T族`, `Xích Diệm Thái Cổ T族`, `Lãm Nguyệt Thái Cổ T族`, `Tử Vi Thái Cổ T族`, `Bát Hoang Thái Cổ T族`, `Ngũ Hành Thái Cổ T族`, `Tê Hạc Thái Cổ T族` — data đã normalize thành `Tộc` → doc và data lệch tên. Vi phạm luật "UTF-8 bắt buộc / không mojibake" của `requirement/README.md`.

**N88 — Trùng tên phe phái (id khác, tên giống).** Đo được ≥8 cặp trong cả doc lẫn data: `Thương Hổ Thương Hội` ×2, `Phi Tiên Giáo` ×2, `Tịch Mịch Kiếm Tông` ×2, `Quân Thiên Ma Đạo Hội` ×2 (+ `Trùng Thiên Hạm Đội`, `Tê Hạc Thái Cổ Tộc`, `Ngũ Hành Thái Cổ Tộc`, `Xích Long Ma Đạo Hội`). Gate repo chỉ assert unique guild **id** (`verify_game.js:405`) → trùng tên đi qua không ai bắt.

**N89 — Hai bảng grade trong runtime.** `data/grade_sign_maps.js` (`{phan:1…tien:8}`) vs `js/expansion.js:16` `GRADE_RANK` (`{pham,phan,linh,huyen,dia,thien,tien}` — thang khác) → drift grade↔tier xuyên file (báo cáo #1 G9 xác nhận ở tầng code).

---

## 5. VÙNG PHỦ MỚI #5 — CHẤT LƯỢNG BỘ TEST

### 5.1. Test rỗng/vô nghĩa (assert không thể fail)

| # | Vị trí | Nội dung | Vì sao vô nghĩa |
|---|---|---|---|
| N90 | `tools/verify_dichi_deep.js:101` | `let delivered=false; … assert.strictEqual(typeof delivered,"boolean")` | `delivered` khai báo trong test và **không bao giờ** được gán lại → `typeof` luôn `"boolean"`. Callback offline được hứa không hề được assert |
| N91 | `tools/verify_dichi_deep.js:130` | `assert(state.companion.damageLedger.length >= 0)` | Độ dài mảng luôn ≥ 0; vòng lặp phía trên có thể chạy 0 lần |
| N92 | `tools/verify_dichi_deep.js:181` | `assert(state.companion.damageLedger.length >= 0)` | Lặp lại N91 ở hàm khác |
| N93 | `tools/verify_dichi_deep.js:24` | `assert(primaryPathId === "kiem_dao" \|\| primaryPathId === null)` | Nhận `null` làm pass → đúng bất kể `pathState` có được rebuild đúng hay không |
| N94 | `tools/verify_dichi_deep.js:143` | `assert(chosen.success \|\| chosen.reason, …)` | Chấp nhận bất kỳ object có `reason` |
| N95 | `tools/verify_review_batches.js:420` | `assert(!…validateSpecialPhysiqueState(state).ok === false)` | Parse thành `assert(ok)` — tác giả định **từ chối** duplicate path vừa cố tình chèn, nhưng assertion lại đòi validator **pass**; ngược với ý định |
| N96 | `tools/verify_log_producers.js:33-45` | `assert.deepStrictEqual(failures, [])` | **Không có** assert `candidates.length > 0`. Nếu refactor khiến regex khớp 0 dòng → audit báo `0/0` và **PASS**. (Hiện đo được `79/79` → chưa vacuous, nhưng cấu trúc cho phép pass rỗng) |
| N97 | `tools/verify_review_batches.js:107` | `if (claimed.success) { …assert… }` | Nếu `claimOutpost` fail, mọi assertion về petition bị **bỏ qua im lặng** — gồm cả contract idempotency quan trọng nhất |
| N98 | `tools/verify_review_batches.js:137` | `if (npc) { … }` | `npcState["su_phu"]` vắng → assert topology patrol bị skip im lặng |
| N99 | `tools/verify_opening_intent.js:38,58` | `if (sectAvailable) {…}` / `if (familyAvailable) {…}` | Chỉ chạy khi catalog vùng tình cờ có faction tương ứng; nếu không, cả block bị bỏ qua nhưng file vẫn in OK |
| N100 | `tools/verify_game.js:811` | `renderCauldron ? renderCauldron(...) : renderPanel(...)` | `renderCauldron` không được export → ternary **luôn** đi nhánh fallback; đường render trực tiếp nó định test là chết |

### 5.2. Lỗ hổng coverage (bất biến canonical không có test nào)

| # | Bất biến canonical | Bằng chứng trống |
|---|---|---|
| N101 | Monte-Carlo trọng số thưởng ±1pp | Không test nào tham chiếu bảng; `FATE_REWARD_WEIGHTS` thậm chí không được export (`[RUN]` T9 = `undefined`) |
| N102 | Roll theo phẩm cấp trước | `rollFateByProgression` **không được gọi từ tool nào** (grep `tools/` = 0) |
| N103 | Trọng số Tiên / `tien == 1` | Không test đọc `FATE_REWARD_WEIGHTS`; `[RUN]` T8 chứng minh Tiên **có** rơi (1/20000) mà không ai bắt |
| N104 | Mệnh Hung nhận được | `[RUN]` T8: `signs={cat:20000}` — 0 Hung — không test nào assert |
| N105 | Behavior gate của Dưỡng Mệnh | `nurtureFate`/`recordFateBehavior`/`resonateFate` xuất hiện trong **0** tool |
| N106 | `hiddenPath.catalog` | `verify_dichi_deep.js:22` chỉ *gán* `hiddenPathId`; không test catalog/completeness/`sourceType` |
| N107 | `MAP_VERSION_CONFLICT` | Grep toàn repo: identifier chỉ có trong báo cáo #1 + 1 dòng catalog; **0 hit** trong `js/` và `tools/` |
| N108 | Epoch world clock 2 475 360 | `WORLD_CLOCK_EPOCH_DAY = (6087-1)*360+1 = 2190961`; không tool nào tham chiếu `2475360`/`worldClockLabel`/`clockLabel` |
| N109 | Tách hai clock | Không test nào assert độc lập `gameClock` vs `worldClock` |
| N110 | Chuỗi schema save | `engine.js:6235 schema:"tu_vi_quy_di_final"`; không test nào đọc field `schema`/`version` |
| N111 | `ERROR_NARRATIVE_MAP` đầy đủ | Không test nào liệt kê mã lỗi engine/expansion và assert có map |
| N112 | Autosave | Không test nào chạy autosave (và `[STATIC]` nó là no-op) |
| N113 | `outpostBonus` trong influence · `ownerFactionId` derived | `outpostBonus` không được assert; `ownerFactionId` chỉ kiểm gián tiếp `.source==="canonical_gradient"` (`verify_review_batches.js:27`), không kiểm nó **derived** |
| N114 | Fog tier 1 & 3 · retention `rewardLedger`/`mailbox`/`progressKeys` · validator ở boundary runtime | `verify_catalog_balance.js:26` chỉ assert `fogLevel` là integer; **không** test bound 3 ledger/family trên; validator chỉ được gọi **trực tiếp bởi test**, không bao giờ assert là được gọi ở boundary turn/save/load |

### 5.3. Điểm mù của gate (file runtime thoát mọi gate)

**N115 — HIGH — `webgame/app.js`.** Có `Math.random` (1 hit). Không nằm trong `SOURCES` random (`js/*` + 2 file root); `webgame` bị UTF-8 gate skip (`verify_utf8_integrity.js:5-7`); không nằm trong asset gate; không được suite gọi. **Một runtime thứ hai hoàn toàn không được bảo vệ.**

**N116 — HIGH — `webgame/index.html`.** Cùng ba loại loại trừ.

**N117 — HIGH — `index.offline.html`.** Bundle offline chứa **3** `Math.random` trong runtime nhúng; là file root nên không nằm trong UTF-8 roots; không nằm trong random/asset `SOURCES`; không nằm trong suite. `tools/build_offline_bundle.ps1` cũng không được gate.

**N118 — MED — `webgame/styles.css`.** Thoát UTF-8 và asset gate.

**N119 — MED — Gate được trích dẫn nhưng không chạy.** `verify_33_item_coverage.js` dẫn `verify_random_boundaries.js`/`profile_runtime_budget.js`/`verify_indexeddb_archive.js` làm bằng chứng hồi quy cho các mục 21,22,27,28 — **cả ba không nằm trong `run_regression_suite.js`**. `UI_ACTION_LOG_CANONICAL.md:536` gọi `verify_expansion_log_matrix.js` là gate, suite cũng bỏ. Bảng "33-item coverage" do đó xác nhận coverage **không bao giờ chạy**.
`run_regression_suite.js:7-19` chỉ chạy 11 tool; thiếu: `verify_random_boundaries`, `verify_asset_references`, `verify_indexeddb_archive`, `profile_runtime_budget`, `verify_33_item_coverage`, `verify_opening_intent`, `verify_expansion_log_matrix`, `verify_character_generator_replay`, `diagnose_breakthrough`.

**Một phần bị che (escape một số gate):** `gemini-code-….js` (chỉ random gate); `character_generator.js` (random + asset, thoát UTF-8); `js/i18n.js` (random + UTF-8, thoát asset); `data/{fate_data,fate_relationships,cong_phap,path_fate_relations,profession_items}.js` (chỉ UTF-8).

### 5.4. Test mã hoá kỳ vọng SAI

**N120 — HIGH — Hợp đồng "di chuyển rời rạc" trái canonical.** `tools/verify_ui_surface_contract.js:50-51`:
```js
assert(main.includes('const actionId = "act_move_" + direction'), …);
assert(!ui.includes("act_move_group"), "movement group action must be removed");
```
`UI_ACTION_LOG_CANONICAL.md:8.1` yêu cầu 4 chip rời được **gom thành một nút "Di Chuyển"**; test assert nút gom phải **vắng**. Runtime theo test, không theo requirement. Báo cáo #1 đã ghi M83; đợt này bổ sung chứng cứ **ba nơi khác** cùng mã hoá kỳ vọng sai:
- `tools/verify_game.js:797` — bắt buộc 4 chip rời trong quick bar.
- `tools/verify_game.js:608` — `assert.deepStrictEqual(...act_move_*.map(id)..., ["act_move_bac","act_move_nam","act_move_dong","act_move_tay"])`.
- `tools/verify_completion_tasks.js:97` — `assert(["bac","nam","dong","tay"].every(...))`.
→ Bất kỳ sửa đúng canonical nào **cũng sẽ làm đỏ** 4 chỗ này.

**N121 — MED — Affordance chết được test công nhận là pass.** `tools/verify_game.js:939,944` chấp nhận **hoặc** `data-map-dir` **hoặc** `data-map-explore-dir`. Nhưng `data-map-explore-dir` (sinh ở `ui.js:1059,1064`) **không được bind handler nào** — `main.js:506` chỉ xử `[data-map-dir]`. Test do đó chứng nhận một affordance không hoạt động là đạt contract di chuyển.

---

## 6. VÙNG PHỦ MỚI #6 — UI RENDER LAYER + i18n

### 6.1. Bề mặt canonical KHÔNG có renderer

Tab hiện có (`index.html:66-74`, 12): `status, dithe, structures, guilds, quests, relations, memory, world, oddities, market, qintian, cauldron`; thêm 5 modal (`inventory, fate, technique, realm, map`).

| # | Bề mặt thiếu | Bằng chứng |
|---|---|---|
| N122 | **Con Đường Ẩn / hidden path** (cao) | Không tab/renderer cho `pathState.hiddenPathId`/`dormant`/secondary transition. Token "Con Đường" xuất hiện ở `ui.js:429,445,520-525,1333` chỉ như **văn xuôi** → `verify_ui_surface_contract.js:31-33` (kiểm substring token) pass dù không có surface |
| N123 | **Panel companion** | `state.companion` chỉ có **một dòng loyalty** trong `renderRelations` (`ui.js:716`); không ai render damage ledger/skill/mutation/revive |
| N124 | **Panel queue NPC** | Chỉ một mảnh inline `ui.js:269-270` (`' · Hàng chờ ' + queueRank`) |
| N125 | **Panel rumor** | Chỉ đếm/last-2 ở `renderNpcWorldSignals` (`ui.js:268-271`) + bulletin (`:275-280`); không có view `rumorLedger` per-NPC |
| N126 | **Discovery `byCategory`** | `renderOddities` tính `discovery.byCategory` (`ui.js:389`) nhưng chỉ render `byStatus` (`:390`) → `byCategory` không bao giờ tới DOM |

### 6.2. Renderer chết

| # | Renderer | Bằng chứng |
|---|---|---|
| N127 | `renderLocalMapGraphLegacy` (`ui.js:1073`) | Chết; đã bị `renderLocalMap` thay |
| N128 | `renderExpansion` (`ui.js:443`) | Export, chỉ tới được nếu `active==="expansion"`, nhưng **không element nào** có `data-tab="expansion"` → bất khả đạt; thân nó lặp lại `renderWorld` |
| N129 | `renderTechniqueEvolutionSection` (`ui.js:340`) | Export nhưng **không được gọi** ở đâu |
| N130 | `renderQintian` **hai** định nghĩa (`ui.js:458` và `:469`) | Cả hai bị **shadow chết** bởi phép gán lại `renderQintian = function(state){…}` ở `ui.js:1429` |

### 6.3. Renderer throw / phát `undefined`

**N131 — `[STATIC]` HIGH — `main.js:575` ReferenceError khi xác nhận xuất thân.**
```js
const originConfirm = event.target.closest("[data-origin-confirm]");
if (originConfirm && state) { … const result = E.chooseOrigin(state, type, specialization);
  if (!result.success) { alert(result.reason); return; }
  UI.closeOverlay(true); saveGame();
  if (command === "opportunity" && result?.success) UI.closeOverlay();   // ← `command` ngoài scope
  renderAfterTurn(); … }
```
`command` bị block-scope ở hai khối `if (expansionCommand …){}` phía trên (`main.js:367,541`). Tại handler `[data-origin-confirm]` nó **undefined** → throw `ReferenceError` mỗi lần bấm "Xác nhận xuất thân". Modal đã đóng và đã save, nhưng `renderAfterTurn()` (dòng 576) không chạy → HUD/action bar **stale**. Không tool nào chạy handler click của UI nên không bắt được.

**N132 — MED — `renderRelations` nội suy field thô.** `ui.js:702-706` dùng `r.trust`, `r.fear`, `r.respect`, `r.suspicion` **không** `Number(…||0)` (khác `affection`/`loyalty`) → bản ghi quan hệ legacy/thiếu key render `"undefined"`. Kiểm tra leak hiện có (`verify_game.js:999`) chỉ chạy trên state mới tạo nên không bao giờ bắt.

**N133 — LOW — `renderWorld` field event không guard.** `ui.js:298` `' · kết thúc ngày ' + s.event.phaseEndsDay` (và `s.event.phase`) có thể `undefined`.

### 6.4. UI ghi state trực tiếp (vòng qua action dispatch)

**N134 — MED/HIGH — `main.js` mutate state trực tiếp:** `:749 state.flags.blackMarketOpen=false`; `:754 state.flags.lastOpportunityPromptId=opportunity.id`; `:992 state.player.techniqueActionSequence = Number(…)+1` (UI tự đúc action id `"technique-ui:"+sequence`); `:1015 state.pendingEnding=o.id`; `:1035 state.pendingEnding=id`; `:158 clock.lastRealTimestamp=now` (trong `setInterval` 1 s).
`verify_ui_surface_contract.js:48` chỉ assert `main.includes("enqueueAction")` — kiểm substring → pass bất kể các bypass trên.

### 6.5. i18n

**N135 — `[RUN]` HIGH — Thiếu 8 formatter canonical.** `UI_ACTION_LOG_CANONICAL.md:356` yêu cầu `formatItemName, formatTechniqueName, formatFateName, formatQuestName, formatLocationName, formatActionLabel, formatHistory, playerClockLabel, worldClockLabel`. `i18n.js:37` chỉ export `formatHistory` (+ các tên không canonical). **Thiếu 8.** Hệ quả: UI đọc thẳng catalog thô (`ui.js:565 window.GameData.ITEMS[id]?.name`, `:675 it.name`, `:701 window.GameData.NPCS[id]`, `:1162 FATE_PATTERNS.find(...)`) → contract "chỉ data-*/save được chứa raw ID" không được ép cho bề mặt tên.

**N136 — `[RUN]` MED — `formatHistory` bỏ sót 3/8 id weather.** `i18n.js:22` `result.replace(/\b(quang|mua|suong|loi_vu|linh_phong)\b/gi, …)` — `WEATHER` (`:6`) định nghĩa 8 id nhưng replacement **thiếu `tuyet`, `am_vu`, `bao_linh_khi`**.
**Đã đo (T6):** đầu vào `"… tuyet … am_vu … bao_linh_khi … mua va suong."` → đầu ra `"…tuyet roi; roi vao am_vu; bao_linh_khi keo den; Mưa va Sương."` → đúng 3 id thô lọt nguyên văn vào lịch sử người chơi. (`verify_catalog_balance.js:21` assert catalog có ≥8 weather → catalog đủ; **formatter** mới là lỗ hổng, và không test nào phủ regex này.)

**N137 — LOW — `lookup` fallback trả `null`, không trả key thô.** `i18n.js:14` kết `… || null`. Caller có guard (`engine.js:5588,5593 …lookup?.(…) || …`) nên an toàn, nhưng caller không guard sẽ nối literal `"null"`.

**N138 — LOW — id một-token lọt qua theo thiết kế.** `i18n.js:29` bỏ qua mọi id không có `_` (`if (!value?.name || !id.includes("_")) return;`) và `:28` chỉ rewrite id có trong catalog liệt kê → id không thuộc catalog nào (hoặc không có `_`) đi thẳng vào log. Không test nào assert tính **đóng** của formatter trên mọi id producer.

**N139 — LOW — `formatElement` nửa lọt.** `i18n.js:36` trả input nguyên văn khi `^[\p{L}\s·-]+$` và không có `_` → một từ element lạ được echo thay vì bản địa hoá.

**N140 — LOW — Đặt tên module không canonical.** Module là `GameI18n` với động từ trộn (`contractName` vs `formatContract` vs `status` vs `formatStatus`); danh sách canonical không được cài; không gate nào ép.

---

## 7. BẢNG TỔNG HỢP ĐỢT 2 THEO MỨC ĐỘ

### HIGH (phải sửa)

| ID | Mô tả ngắn |
|---|---|
| N1 | `selectCompanionTarget` luôn trả địch đầu (`[RUN]`) |
| N2 | `applyPlayerDamage` sai arity → damage truy đuổi no-op (`[RUN]`) |
| N3 | Contested opportunity (non-forced) đè combat |
| N23 | Hiệu ứng kháng/combat Dị Thể không bao giờ được áp |
| N24 | `reviveOnce` (Bất Tử Thể) không được cài |
| N25 | Địch không bao giờ retarget companion trong combat live |
| N32 | Khoá thưởng hidden realm va chạm → realm 2 mất thưởng (`[RUN]`) |
| N33 | `travelToSafeHub` để `pendingMapEvent` kẹt (`[RUN]`) |
| N34 | Vào/ra hidden realm là đường di chuyển không guard |
| N35 | Trigger `explore_action` chết; xác suất event sai |
| N37 | `collectSearchFindings` tiêu findings chưa cấp |
| N55 | `createLootItem` RNG suy biến (`[RUN]`) |
| N56 | Guard item nguyền `markHeirloom` là code chết |
| N57 | Tặng item quest/khoá/đang trang bị làm hỏng inventory |
| N72 | Nhánh thức tỉnh lạ không có record sealed/đường phục hồi |
| N73 | Schema `legacy` item không nhất quán; 2 counter không bao giờ cập nhật |
| N115/N116/N117 | `webgame/*`, `index.offline.html` thoát mọi gate |
| N120 | 4 nơi trong test mã hoá kỳ vọng **trái** canonical về di chuyển |
| N131 | `main.js:575` ReferenceError chặn render sau xác nhận xuất thân |
| N135 | Thiếu 8 formatter canonical của i18n |
| N136 | `formatHistory` để 3/8 id weather lọt ra text người chơi (`[RUN]`) |

### MEDIUM

N4, N5, N6, N7, N8, N11, N12, N13, N14, N15, N16, N17, N18, N48, N26, N27, N28, N29, N36, N38, N39, N40, N41, N42, N43, N44, N45, N46, N47, N58, N59, N60, N61, N62, N63, N65, N66, N67, N68, N74, N75, N118, N119, N121, N123, N124, N125, N126, N132, N134, N82, N83(tích cực), N77, N78, N79, N80, N81, N84, N85, N86, N88, N89, N90–N100 (nhóm test rỗng), N101–N114 (nhóm lỗ hổng coverage).

### LOW

N9, N10, N19, N20, N21, N22, N30, N31, N49, N50, N51, N52, N53, N54, N64, N69, N70, N71, N76, N87, N127, N128, N129, N130, N133, N137, N138, N139, N140.

---

## 8. NHỮNG GÌ **ĐÃ ĐÚNG** (đo được trong đợt 2)

Ghi lại để tránh sửa nhầm và để phân biệt "lỗi" với "khác biệt thiết kế":

- **Catalog Mệnh:** 10 000 entry, phân bố phẩm cấp **chính xác** theo requirement, 0 duplicate ID, đúng 1 Tiên `than_dao_151`, 0 element ngoài canonical, `resonanceEffect` = 130. `[RUN]` T11.
- **Bảng trọng số thưởng Fate** khớp canonical `9+` ở 7/8 ô (chỉ ô `tien` sai). `[RUN]` T8.
- **Stance matrix** (`steady 1.0`, `burst power 1.2 / corruption 1.5`, `guarded power 0.85 / SAN 0.5 / corruption 0.5`) được cài đúng (`engine.js:1654-1656,1691`) và dùng **một** resolver chung cho preview + commit; stance được chốt **trước** confirm. `[STATIC]`
- **Cast transaction** (kiểm resource/cooldown/realm/category trước mutation; SAN→0 trả `committed:true, outcome:"madness"`; receipt lưu khiến retry trả `duplicate`) — đúng, trừ 2 lỗ hổng N11/N13. `[STATIC]`
- **Bất biến heirloom** (đúng 1 item) và **wear cap 25%** được ép thật. `[STATIC]`
- **Auction** không reroll đối thủ khi reload và không nhân đôi/đánh mất tiền reserve. `[STATIC]`
- **Khoá ledger thưởng** `grantCanonicalReward` chống phát lại đúng cơ chế (`[RUN]` T7 cho thấy nó **từ chối** bản ghi trùng — cơ chế đúng, chỉ khoá sai).
- **Enum technique** (`element`/`category`/`family`/`grade`) trong `data/cong_phap.js` hợp lệ 100%. `[STATIC]`
- **Không file staging nào lọt vào browser**; catalog runtime mang schema đã merge. `[STATIC]`
- **`pushHistory` là alias thật của `emitEvent`**, cùng gateway, retention 300/100. `[STATIC]`
- **Faction bulletin** là read model thuần, thứ tự + dedupe + drop expired đúng. `[STATIC]`
- **NPC movement** không teleport (`currentNodeId` chỉ gán từ `exits`), validator từ chối non-edge. `[STATIC]`
- **Relationship decay `event_only`**, `relationshipScore` không dùng làm gate. `[STATIC]`

---

## 9. CÁCH TÁI LẬP ĐỢT 2

```powershell
# Bằng chứng thực nghiệm (script ngoài repo, trong scratchpad phiên):
#   nạp 13 file runtime vào vm sandbox rồi gọi các hàm công khai
#   → in ra: combatEntity keys (T1), selectCompanionTarget (T2), applyPlayerDamage (T3),
#            createLootItem 400 lần (T4), removeItem (T5), formatHistory (T6),
#            grantCanonicalReward 2 realm (T7), Monte-Carlo 20k roll (T8),
#            FATE_REWARD_WEIGHTS (T9), sample_characters.json (T10),
#            catalog counts (T11), confirmPendingDeparture (T12)

# Gate nhỏ:
node tools/verify_log_producers.js
node tools/verify_random_boundaries.js
node tools/verify_utf8_integrity.js
node tools/verify_33_item_coverage.js
node tools/run_regression_suite.js      # vẫn FAIL 5/13 (xem báo cáo #1 §1.2)
```

---

## 10. GHI CHÚ VỀ MỐI QUAN HỆ GIỮA HAI BÁO CÁO

- **Báo cáo #1** tập trung vào **hợp đồng state/schema/pipeline** ở các feature lõi (FATE, path, profession, map, NPC, technique, save) — chủ yếu bằng đọc tĩnh.
- **Báo cáo #2 (này)** bổ sung: (a) **các hệ con chưa ai rà** — combat, search/exploration/hidden realm, item/inventory/auction/heirloom; (b) **tầng data** với số đo thực; (c) **chất lượng chính bộ test** (test rỗng, lỗ hổng coverage, điểm mù gate, test mã hoá kỳ vọng sai) — tức là "ai kiểm tra người kiểm tra"; (d) **tầng render UI + i18n**; (e) và quan trọng nhất: **bằng chứng chạy code** cho 12 kết luận mà đợt 1 chỉ suy luận.
- **Hai đính chính cho đợt 1:** (1) bảng trọng số Fate đúng 7/8 ô, không phải "sai" toàn bộ; (2) catalog Mệnh đúng 100% (không có khiếm khuyết data về count/distribution).
- **Có 3 mục đợt 2 xác nhận lại đợt 1 bằng số:** M1/M2 (Tiên 0.01 + Hung bị loại → nay đo được), M74 (khoá hidden realm → nay đo được), M37 (path id drift → nay đo được 1/10 khớp).

*Hết báo cáo #2. Chế độ chỉ đọc; không file nào trong repo bị sửa. Script chẩn đoán nằm ở scratchpad của phiên.*

---

# PHẦN III — ĐỢT 3: LOG SYSTEM · REGISTER TÍNH NĂNG CHƯA CODE · CÁC FEATURE CÒN LẠI

> Phương pháp đợt 3: test runtime log system + các feature còn lại, và quét có hệ thống 82 identifier mà requirement yêu cầu nhưng code không có. Tiền tố ID: N141–N190 và B.1–B.11.

> **Vị trí trong bộ ba báo cáo**
> - `CODE_REQUIREMENT_AUDIT_2026-09-22.md` (đợt 1) — hợp đồng state/schema/pipeline của các feature lõi, chủ yếu đọc tĩnh.
> - `CODE_REQUIREMENT_AUDIT_2026-09-22_PART2.md` (đợt 2) — combat, search/exploration/hidden realm, item/inventory/auction, data layer, chất lượng bộ test, UI render + i18n; có bằng chứng chạy code.
> - **Báo cáo #3 (tài liệu này)** — (a) **test runtime log system**, (b) **register có hệ thống các tính năng đã thiết kế nhưng chưa code**, (c) **test các feature còn lại chưa từng chạy** (quest/contract/mail, war/tournament/world event, tu luyện/bế quan/đột phá, nghề, Mệnh combo/dung hợp, weather, offline), (d) **bảng xác nhận**: claim nào của đợt 1/2 đã được chứng minh bằng số, claim nào chưa tái lập được.

- **Ngày:** 2026-09-22
- **Nhãn:** `[RUN]` = tái lập được bằng script chạy thật trong phiên (có số liệu in ra); `[STATIC]` = suy ra từ đọc mã tại dòng dẫn.
- **Trạng thái:** chỉ đọc, không sửa file nào trong repo.

---

## 1. BẢNG XÁC NHẬN THỰC NGHIỆM (đợt 3)

Script nạp 13 file runtime (`gemini-code-*.js` + 9 `data/*` + `i18n` + `engine` + `expansion`) vào `vm` sandbox, state chuẩn `createState → createCharacter → chooseJourneyIntent("tu_lap") → ensureExpansionState`, rồi gọi API công khai.

### 1.1. LOG SYSTEM

| # | Phép đo | Kết quả in ra | Xác nhận |
|---|---|---|---|
| LT1 | `pushHistory({type:"action", text:"> xin chao the gioi"})` rồi đọc projection | `leaked=true \| inParagraphs=true` | **LỖ HỎNG XÁC NHẬN** — echo lệnh thô lọt vào log người chơi |
| LT2 | Hai event **cùng ngày**, khác `turn` | `paragraphs=2` (canonical đòi 1); cả hai clock đều `"Nhân vật · Năm 1, Tháng 1, Ngày 1"` | **LỖ HỎNG XÁC NHẬN** — gộp theo ngày bị vô hiệu vì `sceneId` chứa `turn` |
| LT3 | Đẩy 420 event | `state.history.length=300`, `logState.totalEvents=423` | **ĐÚNG** — cap 300 hoạt động |
| LT4 | Đẩy `"Hắn dừng lại — rồi bước tiếp…"` | lưu thành `"Hắn dừng lại rồi bước tiếp"`; `hasEmDash=false`, `hasEllipsis=false` | **LỖ HỎNG XÁC NHẬN** — dấu `—` và `…` hợp lệ bị xoá âm thầm |
| LT5 | Đẩy `"Trong phiên đấu giá, một người khác nâng giá."` | lưu thành `"Một rào cản vô hình khẽ khép lại trước hành động của ngươi; hãy thử lại khi hoàn cảnh đổi khác."` | **LỖ HỎNG XÁC NHẬN** — từ `phiên` (tiếng Việt hợp lệ) xoá cả câu |
| LT6 | Đếm mã lỗi có map vs mã runtime phát ra | `mapped=6`, `distinctRuntimeCodes=14`, **14/14 unmapped** | **LỖ HỎNG XÁC NHẬN** (danh sách dưới §2.3) |
| LT7 | So tập từ cấm của tool-lint vs runtime-lint | tool có `Search`=true, `phiên`=**false**, `index`=**false** | **LỖ HỎNG XÁC NHẬN** — tool-lint là tập con của runtime-lint |
| LT10 | Cấu trúc paragraph + vị trí stat | keys `["dayKey","sceneId","clock","text","events","statDisplay","portrait"]`, `statDisplay=[]`, prose không chứa chữ số | **ĐÚNG** — stat là kênh riêng, không trộn vào prose |

### 1.2. FEATURE CÒN LẠI

| # | Phép đo | Kết quả in ra | Xác nhận |
|---|---|---|---|
| FT1b | Nhận NPC quest, tiến **30 ngày thật** (`2190961 → 2190991`, `expiresDay=2190968`) | `activeNow=1`, `failedNow=0` | **LỖ HỎNG XÁC NHẬN** — quest `active` **không bao giờ** hết hạn, `failed` không bao giờ được ghi |
| FT2 | War trỏ tới 2 faction không tồn tại | `status=active`, `cascadeApplied=undefined`, `outcome=undefined`, validator `ok=false`, `errors=["qa:factions"]` | **LỖ HỎNG XÁC NHẬN** — war mồ côi không được dọn, cascade không chạy, validator fail |
| FT3 | `secludedCultivation(state, 1)` | `success:true, completed:3`, `expDelta=111`, `auto={mode:"be_quan",hours:1,completed:3}`, **`secludedSession=null`** | **MỘT PHẦN** — `state.player.secludedSession` (canonical) **không bao giờ** được ghi; số cycle đo được là 3 (dừng vì gate đột phá), **không** quan sát được giả thuyết "120 cycle" |
| FT4b | `setWeather(region,"mua",2)` rồi `advanceGameTime(6)` | `before="resolver"` → `after="resolver"`, nhưng `weather=quang` (đã chuyển mùa) | **MỘT PHẦN** — tick chuyển weather nhưng **không** cập nhật `weatherSource`; giá trị cũ giữ nguyên |
| FT5 | `fateFusionRecipesFor(fate đầu)` + `mergeFates(2)` | `recipesForFirst=0`; merge trả `success:true` + Mệnh ngẫu nhiên `thien_dai_the_2712` (Hoàng phẩm) | **LỖ HỎNG XÁC NHẬN** — dung hợp bỏ qua catalog recipe, roll generic |
| FT6 | `gainExp(50)` → nguồn velocity | `samples=1`, `distinctSources=["other"]` | **LỖ HỎNG XÁC NHẬN** — taxonomy nguồn không dùng |
| FT7 | Đặt `resources=0, stability=0` cho một faction | `power=70` **không đổi** | **LỖ HỎNG XÁC NHẬN** — `factionPower` là hằng số tĩnh, không dẫn xuất |
| FT8/9 | Kiểm state du hành | `mapState=false` ngay sau `ensure`, `openWorldTarget` **không export**, `mapState.travelTask=undefined` | **LỖ HỎNG XÁC NHẬN** — không có state máy du hành |
| FT11 | Quét world-tick | `tickSnapshot=false`, `outpostMaintenance=false`, `journal=true` | **LỖ HỎNG XÁC NHẬN** — thứ tự 9 bước không đầy đủ |

### 1.3. Claim của đợt 1/2 **chưa tái lập được** (ghi để trung thực)

| Claim | Kết quả đo | Ghi chú |
|---|---|---|
| "`secludedCultivation` chạy 120 cycle/giờ" | đo được `completed:3` | Vòng lặp dừng sớm do gate đột phá; giả thuyết 120 **không** quan sát được trong điều kiện này |
| "`updateWeather` không ghi `weatherSource`" | Nguồn giữ `"resolver"` qua một lần chuyển mùa | Khớp gián tiếp (không được ghi lại), nhưng giá trị không đổi nên không phân biệt được "không ghi" vs "ghi cùng giá trị" |
| "War missing-faction → `status="ended"`, cascade 0 lần" | đo được `status=active` | Code mồ côi **không** bị dọn; kết luận vẫn là lỗi, nhưng cơ chế khác mô tả của agent |

---

## 2. PHẦN A — LOG SYSTEM (rà sâu + test runtime)

Requirement nguồn: `features/07-ui/UI_ACTION_LOG_CANONICAL.md`. Code: `engine.js` (lõi log ~5075–5515, 5850–6010, 6200–6330), `expansion.js` (helper `history` 413–416), `ui.js` (`addStory` 21–48, `renderStoryWindow` 50–87), `main.js`, `i18n.js`.

### A.1. Lỗi logic

**N141 — `[RUN]` HIGH — Echo lệnh thô lọt vào player log (2 producer).**
`js/engine.js:5926` `pushHistory(state, { type: "action", text: "> " + text });`
`js/expansion.js:4266` `history(state, "action", "> [" + action.label + "]");`
Cả hai set `type:"action"`, **không** `debugOnly`, **không** `playerVisible:false`. `canonicalLogType("action")` (`engine.js:5262`) không có alias `action` → `type="ACTION"`, `debugOnly=false`. `groupIntoScenes` (`:5367`) chỉ loại `debugOnly`/`playerVisible===false`/`COMMAND_ECHO` → hai bản ghi này **sống sót** vào projection. `narrativeSafe` (`:5310`) chỉ cắt tiền tố `>` và giữ phần còn lại.
**Đo được (LT1):** `leaked=true, inParagraphs=true`.
Kịch bản: gõ `"ta đi dạo bên sông"` → log hiện đúng câu đó; bấm nút "Nhận khế ước" → log hiện `[Nhận khế ước]`. Đúng cái terminal-echo mà `GAME_LOG_NOVEL_STYLE_FIX.md` được viết ra để xoá.

**N142 — `[RUN]` HIGH — Gộp scene theo ngày bị vô hiệu vì `sceneId` chứa `turn`.**
`js/engine.js:5458` sceneId mặc định = `"scene:" + locationId + ":" + turn + ":" + dayKey`, và `submitActionId` tăng `state.meta.turn` **trước** khi đẩy event (`:5899`). `groupIntoScenes` đòi `previous.sceneId === requestedSceneId` (`:5374`).
**Đo được (LT2):** hai event cùng ngày, khác turn → **2 paragraph**, mỗi cái một timestamp riêng, dù cả hai clock ghi cùng `"Năm 1, Tháng 1, Ngày 1"`.
Hệ quả: khiếm khuyết gốc ("`[Năm 1, Tháng 1 ngày 8]` lặp 10 lần") **chưa thực sự được sửa**, trừ khi ở trong một phiên search (`activeSceneId`, `:4344`) hoặc có chuỗi `relation:"result"+causedBy`. Smoke test chỉ pass vì nó **ghim `meta.turn`** và hardcode `causedBy` (`tools/verify_log_narrative.js:34-39`).

**N143 — HIGH — Story window tách **cùng một ngày** theo node/sub-location.**
`js/engine.js:5373` đòi `previous.locationId === locationId`. Mọi di chuyển đổi `locationId` → event cùng ngày bị tách thành nhiều paragraph/heading. `NOVEL_STYLE_LOG_FULL_DEFINITION.md` AMENDMENT đòi "kể cả khi nhân vật đổi node/sub-location". *(Lưu ý: req.3 và req.14 của prompt gốc mâu thuẫn nhau; code theo req.3, vi phạm req.14.)*

**N144 — `[RUN]` HIGH — Dấu gạch ngang ngữ nghĩa bị xoá khỏi mọi chuỗi log.**
`js/engine.js:5283` `repairMojibakeText` map glyph cp1252 sang byte C1: `"–"→"\x96"`, `"—"→"\x97"` (`:5280-5281`). Rồi `sanitizeLogUtf8` (`:5300`) strip `[\u0080-\u009F]`. Vậy `U+2013/U+2014`, `‘ ’ “ ” … •` hợp lệ **bị xoá**.
**Đo được (LT4):** `"Hắn dừng lại — rồi bước tiếp…"` → lưu `"Hắn dừng lại rồi bước tiếp"`.
Tệ hơn: `narrativeSafe` **tự** đổi `:` → `" — "` (`:5334`) rồi `emitEvent` chạy lại `sanitizeLogUtf8(event.text)` (`:5504`) → xoá luôn dấu vừa thêm. Ví dụ `expansion.js:3097` `"Xem Quẻ:" + text` → `narrativeSafe` cho `Xem Quẻ — …` → lưu `Xem Quẻ  …` (mất dấu, dư khoảng trắng). Requirement viết ví dụ "SAU" **bằng** `—`, nên code không thể tái tạo chính prose đích.

**N145 — `[RUN]` HIGH — Từ `phiên` phá huỷ cả câu.**
`NARRATIVE_BANNED_WORDS` chứa `phiên`, `index`, `ID`, `buff`, `debuff` (`engine.js:5260`) nhưng pass strip token (`:5319`) **không** xoá `phiên` → lint cuối (`:5348`) fail → **thay cả value** bằng câu chắn chung.
**Đo được (LT5):** `"Trong phiên đấu giá, một người khác nâng giá."` → bị thay bằng `"Một rào cản vô hình khẽ khép lại trước hành động của ngươi; hãy thử lại khi hoàn cảnh đổi khác."`.
Các chỗ bị ảnh hưởng: `expansion.js:2772`, `engine.js:4336`, `engine.js:4146`. `phiên` là tiếng Việt thường (phiên chợ/phiên đấu giá) → đây là lỗi **phá prose có hệ thống**.

**N146 — MED — Legacy history dồn thành một paragraph khổng lồ với heading ISO.**
Migration trong `deserialize` (`engine.js:6250-6253`) ghi `clock: entry?.clock || ""` và **bỏ** `locationId`. Event cũ không có clock → `gameLogDayKey({clock:""})` trả `""`; `normalizeHistoryEvent` backfill **cùng** `state.locationId` (`:5488`) → mọi event chia chung `dayKey:""` + 1 location → gộp thành **một** paragraph, heading là `event.timestamp` = `data.savedAt`/`new Date().toISOString()` (`:5377`, `:6251`) — tức một **ISO timestamp** bị render vào log người chơi qua `renderScene` (`:5430`).

**N147 — LOW — `gameLogDayKey` fallback làm mất số ngày.** `js/engine.js:5360` `clock.split(/ngày/i)[0].trim() || clock.slice(0,10)`; nếu regex chính fail thì `"…Ngày 10"` tách ra `"Nhân vật · Năm 1, Tháng 1, Ng"` → mất số ngày → hai ngày khác nhau cùng tháng gộp chung `dayKey`.

**N148 — MED — `validateLogSurfaceState` không thể fail (gate chết).** `js/engine.js:5401-5411` gọi `formatPlayerLogText`, mà hàm này đi qua `narrativeSafe` — vốn **đã** bảo đảm fallback không rỗng/không hai chấm/không token (`:5347-5349`). Nên nhánh `!text && !hasStats` và nhánh lint là **bất khả đạt**. Validator nằm trong `validateExpansionState` (`expansion.js:2863`) coi như no-op → "log lint ở boundary render/save" là tự thoả mãn và không bắt được gì.

**N149 — LOW — Bất đối xứng glyph: runtime strip `✦` nhưng giữ `◇`.** `narrativeSafe` strip `^[×§&=✦>]+` (`:5310`) — **không** có `◇` (U+25C7). Producer đặt tiền tố `"◇ …"` ở ~25 chỗ (`engine.js:5167,5174,3497,592`; `expansion.js:1091,1150,1619,3097`). Kết quả: prose bắt đầu bằng ký hiệu kênh stat, trong khi `✦` cùng vị trí lại bị xoá. Dòng stat của search còn phát `"Dấu vết còn X/Y"` / `"Lần dò N"` (`engine.js:4393`) — tức counter nội bộ được diễn đạt lại.

**N150 — LOW — `recentNarratives` chống lặp vô hiệu.** `LO_TEMPLATES` chọn `pool.find(item => !recent.includes(item))` (`:5418`) so **template thô**, nhưng `recentNarratives` chứa **text đã render** (`:5476`). Template không bao giờ bằng output của nó → matcher luôn trả `pool[0]` → dòng CULTIVATION/REST lặp y hệt.

### A.2. Code dễ sinh lỗi

**N151 — Tool-lint và runtime-lint lệch nhau.** `tools/verify_log_narrative.js:4` thiếu `Search`, `phiên`, `lượt dò`, `index`, `ID`, `buff`, `debuff`, `Offline` mà runtime (`engine.js:5260`) có; ngược lại `state` tool chỉ bắt trước `[.:=]` còn runtime bắt mọi vị trí. Tool là **tập con** thực chất → producer phát `phiên`/`index`/`buff`/`ID` **pass build gate** nhưng **bị nuke lúc chạy** (N145). `[RUN]` LT7 xác nhận.

**N152 — Audit producer tĩnh không thấy đường rò.** `tools/verify_log_producers.js:22-24` chỉ khớp literal đóng (`text: "…",`) hoặc `history(state,'sys|warn|narr',"…")`. Nên nó **bỏ qua** `text: "> " + text` (concat → `engine.js:5926`) và `history(state,"action",…)` (type ngoài whitelist → `expansion.js:4266`). Audit được viết để chứng minh "không rò" lại **không thấy** đúng chỗ rò N141.

**N153 — `verify_expansion_log_matrix.js` rỗng nghĩa.** 45 fixture (`:8-50`) là chuỗi mojibake đầy `—` (ví dụ `"Xem Qu—: M—t b—ng ng——i…"`). Qua `formatPlayerLogText`→`sanitizeLogUtf8`, các `—` này thành `\x97` và **bị strip** → text assert là skeleton suy biến. Assertion sau đó pass tầm thường. Nó **không** chạy qua producer thật nào → tạo tin cậy giả ("66/66").

**N154 — Non-determinism trong identity event.** `createGameEvent` id = `"evt_" + Date.now().toString(36) + …`, `timestamp = new Date().toISOString()` (`engine.js:5448-5449`); legacy fallback cũng `new Date().toISOString()` (`:6251`). Thêm nữa **hai scheme id legacy** cùng tồn tại: `"legacy_"+index` (`:6250`) vs `"legacy_evt_"+seq` (`:5486`).

**N155 — Migration legacy không idempotent đầy đủ / mất dữ liệu.** Guard `:6247` trả entry nguyên trạng khi đã có `id/timestamp/context/result`, nên re-deserialize ổn định — nhưng pass đầu **bỏ** `locationId`, `sceneId`, `relation`, `causedBy`, `playerVisible`, `errorCode`, `rawText` → giảm vĩnh viễn khả năng gộp scene (N146). `context:{}`/`result:{}` là truthy nên nhánh bypass của `emitEvent` (`:5503`) sẽ coi mọi event mang object rỗng là "đã normalize".

**N156 — Mất event IMPORTANT/RARE do retention.** Runtime prune ở 300 **không** kiểm importance (`:5509`); save giữ `slice(-100)` (`:6230`). `detectMilestones` (`:5520`) **export nhưng không bao giờ được gọi**; mọi event đều `importance:"NORMAL"` (`:5453`). Vậy contract "milestone/important/rare/epic không bị prune khỏi canonical counters" **không có counter và không có policy**. `LOG_IMPORTANCE` còn tự thêm `EPIC` (`:5233`) không có trong spec.

**N157 — Render có side effect lên state lưu.** `groupIntoScenes`/`novelLogParagraphs` gọi `normalizeHistoryEvent` — hàm này **mutate object `state.history` tại chỗ** (`:5481-5499`) và có thể tăng `state.logState.sequence`.

**N158 — UI "Xem thêm" tách scene.** `js/ui.js:56-65` slice **raw** theo index rồi mới group → một scene nhân quả nằm vắt ranh giới bị render 2 lần với 2 heading → phá "một timestamp mỗi scene".

**N159 — HUD dump đi qua kênh novel.** `act_trang_thai/hanh_trang/nhiem_vu/menh/cong_phap/ban_do/to_chuc/giup` đẩy text HUD nhiều dòng dưới `type:"sys"` (`engine.js:5851-5860`). `narrativeSafe` gộp newline (`\s{2,}`→space, `:5335`) và đổi mọi `:` → ` — ` → chuỗi status chạy dài trong story log (ví dụ `describeStatus` `:6078-6094`). Vượt qua cả nguyên tắc tách "structured mechanics → Game Log/statDisplay".

**N160 — `expansion.js` double-apply formatter.** `history()` render trước bằng `E.I18n.formatHistory` (`expansion.js:414`), `createGameEvent` render lại (`engine.js:5474`). Hôm nay gần idempotent, nhưng 2 formatter khác nguồn (`window.GameI18n` vs `E.I18n`) có thể trôi.

**N161 — Repair mojibake chạy trên cả chuỗi không phải player.** `sanitizeLogUtf8`/`repairMojibakeText` chạy trong `emitEvent` (`:5504`) và `normalizeHistoryEvent` (`:5497-5498`) cho **mọi** event, gồm `COMMAND_ECHO`/`debugOnly` mà `formatPlayerLogText` lẽ ra trả raw (`:5353`) → text debug bị viết lại dù phải giữ nguyên để chẩn đoán.

**N162 — `flushRewardSummaries` mất summary nếu overlay không mount.** `main.js:784-787` `splice(0)` làm rỗng `pendingRewardSummaries` rồi gọi `UI.openOverlay`; nếu không mount được thì mất không retry. Còn early-return khi `pendingEnding` → summary tích tụ. *(Không mutate tài nguyên người chơi — mục 11 giữ đúng.)*

**N163 — Heading lệch giữa `renderScene` và `novelLogParagraphs`.** `renderScene` dùng `【scene.clock】` với `event.clock||timestamp` thô (`:5430`); `novelLogParagraphs` trả `clock`; UI `addStory` bọc `[ ]` (`ui.js:41`). Định dạng clock (`clockLabel`, `:5181`) là `"Nhân vật · Năm 1, Tháng 1, Ngày 10"` — **không có** nhãn kỷ nguyên, khác `[Năm 1, Tháng 1 ngày 10 · Kỷ Nguyên Linh Khí Dị Biến]` yêu cầu.

### A.3. Logic log còn thiếu

1. **`ERROR_NARRATIVE_MAP` không đầy đủ** — 6 mã map (`engine.js:5243-5250`); **14 mã** runtime phát ra không có map (đo LT6): `INVALID_USE_COUNT, MAX_USES, RESOURCE_SHORTAGE, UNKNOWN_COMPANION_SKILL, COMPANION_ROLE_MISMATCH, EXPIRED, UNKNOWN_TECHNIQUE, REALM_TOO_LOW, REALM_TOO_HIGH, PATH_MISMATCH, FATE_REQUIRED, FACTION_REQUIRED, GUILD_REQUIRED, GUILD_RANK_REQUIRED`. Có fallback nên không rò, nhưng "map MỌI mã" không đạt. `playerFacingReason` cũng không strip tên field lowercase (`pending_search`, `scene_id`), chỉ strip danh sách keyword cứng (`:5256`).
2. **Điều kiện novel (b)(c)(e)(f) không được kiểm** — không có enforcement nào cho sensory detail / motive / continuity / read-aloud; logic duy nhất là tiền tố `hasGrounding` (`:5340`). `ANNOUNCEMENT_STRUCTURE_PATTERN` của spec chỉ tồn tại trong tool (`verify_log_narrative.js:3`), **không** ở runtime boundary.
3. **Không có retention 300/100 theo importance, không có milestone counter** — N156.
4. **`NarrativeSceneBuilder` không tồn tại** (0 hit) — tài liệu gọi nó là đích migration (`NOVEL_STYLE_LOG_FULL_DEFINITION.md §1`); code dùng `groupIntoScenes`/`renderScene`.
5. **Lint ở boundary render không được nối vào UI** — `js/ui.js` không bao giờ gọi `lintNarrativeText`; nhánh fallback ở `ui.js:70` render `entry.text` thô. `renderStoryWindow` **tự tính lại** dòng stat (`ui.js:75-82`) thay vì dùng `paragraph.statDisplay` → lặp lại hợp đồng gộp.
6. **Day-key không gồm kỷ nguyên** cho heading người chơi; không guard rằng `sceneId`/`clock` legacy phải được populate trước khi group (N146).
7. **Gộp theo độ mịn ngày, không tách theo node/turn** — req.14 không được cài (N142/N143).

### A.4. Trả lời trực tiếp

- **Echo lệnh thô có lọt vào player log không? — CÓ.** Hai producer `engine.js:5926` và `expansion.js:4266`, `type:"action"`, không `debugOnly`; `groupIntoScenes` không lọc; `narrativeSafe` chỉ cắt `>`. Đo LT1: `leaked=true`. Build gate không thấy vì `verify_log_producers.js:22-24` đòi literal đóng + type `sys|warn|narr`.
- **Stat summary có bao giờ nằm giữa paragraph không? — KHÔNG.** `novelLogParagraphs` giữ `statDisplay` là mảng riêng (`:5390-5398`), `renderScene` nối sau prose (`:5430`), UI nối `statLine` vào **cuối** paragraph (`ui.js:71-83`). Đo LT10: `statDisplay=[]`, prose không chứa chữ số. *(Caveat: glyph `◇` lại nằm ở **đầu** nhiều chuỗi narrative — N149.)*
- **Repair mojibake có áp lên chuỗi không phải player không, và có phá tiếng Việt hợp lệ không? — CÓ áp rộng; không phá **chữ cái** tiếng Việt nhưng PHÁ **dấu câu** hợp lệ.** Áp ở `emitEvent` (`:5504`), `normalizeHistoryEvent` (`:5497-5498`), `narrativeSafe` (`:5304`). Chữ cái tiếng Việt nằm trên `U+00FF`, ngoài vùng repair, nên an toàn; nhưng pre-normalize cp1252 map dấu câu Unicode hợp lệ sang byte C1 (`:5280-5281`) rồi `sanitizeLogUtf8` xoá `[\u0080-\u009F]` (`:5300`) → mọi en/em dash, ngoặc cong, ellipsis, bullet bị **xoá âm thầm** (đo LT4).

---

## 3. PHẦN B — REGISTER TÍNH NĂNG ĐÃ THIẾT KẾ NHƯNG CHƯA CODE

Phương pháp: quét `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`, `js/i18n.js`, `character_generator.js`, `gemini-code-1788430656294.js` cho từng identifier mà requirement yêu cầu. Đếm 0 = **NOT CODED**; ≤2 = **THIN/STUB**.

**Kết quả tổng: 82 identifier MISSING (0 hit) + 10 THIN (≤2 hit).** Danh sách dưới đây kèm nguồn requirement.

### B.1. MAP / di chuyển — 30 missing (nặng nhất)

Toàn bộ §16 API surface của `features/04-world/MAP_CANONICAL.md` **không tồn tại**:

```text
resolveMapTopology  getCurrentRegionViewModel  getLocalState  listLocalActivities
previewLocalActivity  resolveLocalActivity  listRouteOptions  edgeState
startTravel  interruptTravel  resumeTravel  cancelTravel
mapIncidentPreview  resolveMapIncident  setMapNote
getNodeDetail  enterSubLocation  availableNodeActions  NodeDetailLayout
travelTask  resolveMapTransaction  stateVersion  expectedVersion  MAP_VERSION_CONFLICT  tickSnapshot
computeMapInfluence  mapOwner  mapZoneStatus  mapStructurePreview  petitionFactionTerritory
```

Hệ quả: máy trạng thái du hành (TravelTask/EdgeState), transaction + versioning (MAP_VERSION_CONFLICT), lớp L3 Node Detail, API influences thuần dữ liệu, và toàn bộ DTO view-model của UI **đều không có**. *(Lưu ý tên: `petitionOutpostToFaction` có, nhưng `petitionFactionTerritory` canonical thì không.)*

### B.2. FATE — 4 missing, 2 thin

```text
MISSING: getComboEligibility  fuseFate  resonanceEffect  chooseDuplicateResolution  serverUniqueFateOwnership
THIN   : fateFusionRecipesFor (2)  auditFateRolls (2)
```
`resonanceEffect` có **trên mọi entry data** nhưng **0 tham chiếu** trong code → hiệu ứng cộng hưởng riêng của Cộng Minh (bậc 3) hoàn toàn không tồn tại. `fuseFate` không có (chỉ `mergeFates` generic). `chooseDuplicateResolution` không có (trùng Huyền+ bị từ chối thẳng).

### B.3. CHARACTER — 7 missing

```text
persistent_named  bondable_encounter  transactional_ephemeral  legacy_anchor
rememberIdentity  giftBond  giftTrade
```
Toàn bộ §12 "NPC ngẫu nhiên, thương nhân và tính bền vững của Nhân Duyên" (`features/02-character/CHARACTER_CANONICAL.md`) chưa code: không phân loại 3 lớp NPC, không "Ghi nhớ danh tính", không tách Quà giao thương vs Quà nhân duyên, không migrate anchor cũ sang `legacy_anchor`.

### B.4. PROGRESSION / Con Đường — 17 missing, 1 thin

```text
switchPathContext  pathSwitchStatus  pathSwitchCandidates  resolveCultivationDeviation
getRegionalCultivationRankboard  startSecludedCultivation  stopSecludedCultivation
secludedCultivationStatus  performPathInsight  pathInsightOptions  triggerMinorTrial
pathRitualProfiles  pathVariant  hybridPath  ritualByPath  transitionHistory  detachHistory
THIN: minorTrial (2)
```
Hệ quả: Chuyển Đạo, Chiến Ngộ/Cảnh Ngộ/Vấn Đạo/Đấu Ngộ, Tiểu Kiếp, rankboard vùng, bế quan theo ngày, và **toàn bộ các field canonical của `state.pathState`** đều thiếu.

### B.5. PROFESSION — 3 missing

```text
coThanTanHon  hiddenProfessionClues  hiddenPathClues
```
Không có catalog hidden path, không có clue hidden path, không có namespace `co_than_tan_hon`.

### B.6. DỊ THỂ — 2 missing

```text
rejectedIds  reviveOnce
```
`rejectedIds` được khởi tạo + validate nhưng **không bao giờ được ghi**; `reviveOnce` được tính trong `specialPhysiqueModifiers` nhưng **không consumer nào đọc** (đợt 2 đã xác nhận).

### B.7. NPC — 4 missing

```text
trustTrial  promotionEligibility  mediateAlliance  track_footprint
```
*(Cơ chế trust-trial / mediate / footprint có tồn tại dưới tên khác — `resolveTrustTrial`, `mediateAlliance` không export, `act_exp_npc_track` — nên mục này là **đặt tên canonical chưa có**, không phải thiếu chức năng hoàn toàn.)*

### B.8. COMPANION — 1 thin

```text
THIN: reviveCompanion (2)  companion_mutation (1)
```
`companion_mutation` chỉ là entry trong command table, **không** `expansionAction` nào phát, không UI.

### B.9. TECHNIQUE — 7 missing, 1 thin

```text
buildTechniqueContext  commitTechniqueResolution  transitionGuildMembership
recordTechniqueTrialEvent  validateTechniqueCrossSystemState  validateTechniqueCrossSystemCatalog
prepareTechnique
THIN: guildTechniquePolicies (2)
```
Không có resolver canonical dùng chung preview/commit, không có transaction membership theo giai đoạn, không có validator cross-system cho Công Pháp.

### B.10. UI / PLATFORM — 8 missing, 3 thin

```text
migrateV12ToV13  NarrativeSceneBuilder
formatItemName  formatTechniqueName  formatFateName  formatQuestName
formatLocationName  formatActionLabel  playerClockLabel
THIN: validateExpansionState (2 — chỉ định nghĩa + export, không gọi ở runtime)
THIN: rehydrateUnknownContent (2)  renderScene (2)
```
`worldClockLabel` có nhưng `playerClockLabel` **không** → bộ formatter i18n canonical thiếu 7/9 tên.

### B.11. Đối chiếu nhanh với các gap đã ghi trong chính repo

`requirement/SYSTEM_LOGIC_CATALOG/09_IMPLEMENTATION_GAPS_AND_DECISIONS.md` tự liệt kê 4 gap P0 (API influence duy nhất, Công Trình registry/runtime/UI, schema hidden profession, ERROR_NARRATIVE_MAP). **Đo được:** cả 4 vẫn mở — `computeMapInfluence`/`mapOwner` missing (B.1), `mapStructurePreview`/`petitionFactionTerritory` missing (B.1), `hiddenProfessionClues`/`hiddenPathClues` missing (B.5), và 14/14 mã lỗi thiếu map (A.3).

---

## 4. PHẦN C — CÁC FEATURE CÒN LẠI (test runtime)

Nguồn: `features/05-interaction/NPC_CANONICAL.md`, `04-world/WORLD_SIMULATION_CANONICAL.md`, `06-content/REWARD_CANONICAL.md`, `09-cross-system/CROSS_SYSTEM_CANONICAL.md`, `03-progression/CON_DUONG_CANONICAL.md`.

### C.1. Quest / contract / bounty / mail

**N164 — `[RUN]` HIGH — Quest NPC ở trạng thái `active` không bao giờ hết hạn.**
`js/expansion.js:1772-1776` chỉ sweep `state.questState.available`. Canonical (world-tick bước 1, `NPC_CANONICAL.md:762`) đòi cả **available và active** → `failed`.
**Đo được (FT1b):** `expiresDay=2190968`, ngày tiến từ `2190961 → 2190991`; `activeNow=1`, `failedNow=0`.
Kịch bản: nhận quest → bỏ 30 ngày → quest vẫn nằm trong `active`, `turn_in` vẫn trả thưởng, bucket `failed` không bao giờ được ghi.

**N165 — MED — NPC quest không có objectives; `progress` đánh dấu mọi thứ xong.**
`js/expansion.js:1980` `objectives: []`; `:2187-2188` `quest.objectives.forEach((objective) => { objective.done = true; });`.
Kịch bản: `offer→accept→progress→turn_in` (`:2174-2200`) trả `{exp:15, merit:2}` mà **không** làm gì; `(quest.objectives||[]).some(o=>!o.done)` là `false` với mảng rỗng → turn-in luôn được phép.

**N166 — MED — `npcQuestStatus` mutate state như side effect của read.** `js/expansion.js:1980` `state.questState.available[id] ||= { id, giverNpcId: npcId, …, expiresDay: absoluteDay(...) + 7 }`, được gọi từ `npcTalk` (`:1995`) và `npcDialogueAction` (`:2175`). Chỉ cần **nói chuyện**/query là seed một quest vào save với hạn 7 ngày → projection "status" không thuần.

**N167 — LOW — `sendMail` tiêu tài nguyên trước khi lên lịch.** `js/expansion.js:3035-3036` `removeItem(state,"linh_thach",cost); if (itemId) removeItem(state,itemId,1); … scheduleWorldTask(state, task);` — nếu `scheduleWorldTask` trả `{success:false}` (id đã tồn tại) thì Linh Thạch + item mất mà **không** có task và không báo lỗi.

**N168 — MED — Không có `questTransaction` hợp nhất.** Chỉ có trong tài liệu (`AUDIT_CANONICAL.md:1551`). Quest/contract/commission mỗi cái tự gọi `grantCanonicalReward` (`expansion.js:2197,1702,260`) — không có wrapper giao dịch chung.

**N169 — MED — Không có `deliverMail` / read model cho inbox người chơi.** `sendMail` ghi `npc.mailbox` (`:1750`) nhưng không có xác nhận giao, không projection inbox, không cap; UI chỉ có nút gửi (`ui.js:711-716`).

**N170 — MED — Không có `factionDaily` / board daily của phe.** Tương tự duy nhất là `organizationInteract(... "commission")` với expiry theo request (`expansion.js:180-194,214-221`), không có refresh theo ngày và không có surface projection.

### C.2. War / tournament / world event

**N171 — `[RUN]` HIGH — War trỏ tới faction không tồn tại vẫn `active`, cascade không chạy.**
**Đo được (FT2):** `status=active`, `cascadeApplied=undefined`, `outcome=undefined`, `validateWarState → ok=false, errors=["qa:factions"]`.
Kịch bản: một faction key bị gỡ (hoặc migration làm mất) → war mồ côi tồn tại vĩnh viễn, cascade (stability/resources/influence) **không bao giờ** chạy, và save rơi vào trạng thái validator từ chối.
*(Agent mô tả nhánh `if (!a || !b) { war.status="ended"; return; }` tại `expansion.js:1451`; đo được cho thấy war **không** được chuyển `ended` — kết luận lỗi giữ nguyên, cơ chế khác mô tả.)*

**N172 — MED — `factionPower` canonical không được cài.** `js/expansion.js:544` `power: Math.max(1, Number(faction.scale||3) * 10)`; roll war ở `:1453` `roll < a.power / Math.max(1, a.power + b.power)`.
Contract (`CROSS_SYSTEM_CANONICAL.md:577`): `factionPower = highestRealmWeight × scale × resourceFactor × stabilityFactor`.
**Đo được (FT7):** đặt `resources=0, stability=0` → `power=70` **không đổi**.
Kịch bản: faction cạn tài nguyên/ổn định vẫn thắng roll war với cùng trọng số như faction sung mãn.

**N173 — MED — Diplomacy chỉ ghép cặp theo thứ tự index.** `js/expansion.js:1430-1432` `const ids = Object.keys(...).slice(0,12); for (…) { const a = ids[i], b = ids[i+1] … }` → chỉ tồn tại các cặp (0,1),(1,2)…; hai phe **kề địa lý** nhưng không kề trong thứ tự chèn **không bao giờ** có thể gây chiến; identity cặp phụ thuộc thứ tự `Object.keys`. Trái tinh thần "front chỉ giữa node kề cạnh".

**N174 — MED — `frontNodeIds` là code chết.** `js/expansion.js:1442` `frontNodeIds: []` là assignment **duy nhất**; `:4182` `if (Array.isArray(war.frontNodeIds) && war.frontNodeIds.length && !war.frontNodeIds.includes(state.locationId)) return {...}` → vì front luôn rỗng, giới hạn "phải ở tiền tuyến" **không bao giờ** kích hoạt → `participateWar` thành công từ bất kỳ node nào.

**N175 — MED — Offline aggregate cap war ở 20 vòng và bỏ nhiều producer.**
`js/expansion.js:2957` `while (day <= endDay && rounds < 20 …)` → tối đa 60 ngày war bất kể cửa sổ. `:2950-2961` xử lý event/contract expiry/auction/wars/diplomacy/hidden realms/weather/schedules, **thiếu**: quest expiry (N164), `updateFactionInternalEvents`, `updateTournament`, `refreshContracts`/`refreshAuction`, `updateNpcBetrayals`, `applyDailyWorldEffects`, expiry của `pendingContestedOpportunity`/`npcTrustTrials`/`loyaltyTests`.
Kịch bản: bước nhảy >30 ngày chứa ngày `day % 120 === 0` sẽ **không** tạo tournament đó (`updateTournament` chỉ tạo khi `day % 120 === 0`, `:2699`) → người chơi mất trọn một chu kỳ giải đấu im lặng.

**N176 — LOW — Seed bracket của tournament không dùng.** `js/expansion.js:2700` `seed: hash("tournament_"+day)` vs `:2745` `seeded(state,"tournament-power:"+tournament.id, round.index)` và `:2732` `"tournament-opponent:"+tournament.id` → "bracket seed" lưu nhưng **không** điều khiển bracket; chỉ `tournament.id` làm điều đó.

**N177 — LOW — `updateDiplomacy` timing dùng `day - warCooldownUntil >= 0`.** `js/expansion.js:1440`; khi `warCooldownUntil` chưa set (`undefined`→0) thì war có thể nổ ngay tuần tension vượt 60; `warCooldownUntil = day + 30` (`:1457`) chỉ set ở nhánh thắng của `updateWars`.

**N178 — LOW — Offline aggregate chỉ chạy một nhịp diplomacy/tuần.** `js/expansion.js:2958` `const weeklyDay = endDay - (endDay % 7); if (weeklyDay >= startDay) updateDiplomacy(state, weeklyDay);` → 90 ngày chỉ áp **một** tick, có thể trôi tới 6 ngày so với nhịp tuần canonical.

### C.3. Tu luyện / bế quan / đột phá

**N179 — HIGH — Guard chống nested roll của `recordCultivationGain` là no-op.**
`js/engine.js:2993` `&& !state.player.cultivation._rolledThisGain` và `:3004` `delete state.player.cultivation._rolledThisGain;` — set và xoá **trong cùng một call** nên không chặn được gì; khoá roll là `day + source`: `replayRandom(state, "cultivation-deviation:" + day + ":" + source)` (`:2993`).
Kết hợp với N180 (nhiều cycle/ngày) → cùng một ngày lặp lại nhiều cycle, `velocity24h` tích luỹ; khi `ratio>1.5` phép roll seeded không đổi mãi dưới `deviationChance` → **mọi** cycle sau đó trừ `state.player.exp -= ceil(exp*10–20%)` (`:3000`), xoá EXP chưa chốt. Contract (`CON_DUONG_CANONICAL.md:1786`) đòi "một lần nhận EXP chỉ roll tối đa một lần; tránh nested roll khi Bế Quan".

**N180 — MED — `secludedCultivation` không dùng model ngày canonical.** `js/engine.js:3792` `secludedCultivation(state, hours = 1)` clamp **1–8 giờ**; comment `:3789-3791` ghi "One hour represents six cultivation/rest cycles" nhưng code tính `daysPerHour = Math.max(1, Math.round(3600/realSecondsPerGameDay))` (`:3802`).
**Đo được (FT3):** `completed:3`, `expDelta=111` cho `hours=1` (dừng sớm vì gate đột phá). Canonical (`startSecludedCultivation({days})`) **1–30 ngày**, thoát sớm tỉ lệ, `riskRolls.echo/intrusion`, nửa risk theo faction của location — **không có**. `state.player.secludedSession` (`engine.js:6320`) được khởi tạo nhưng **không bao giờ** được ghi (đo FT3: `secludedSession=null`).

**N181 — MED — Taxonomy nguồn của `recordCultivationGain` không dùng.** `js/engine.js:2966` `recordCultivationGain(state, gained, "other")` — không bao giờ truyền `cultivate|auto|be_quan|combat_insight|environment_insight|dao_insight|spar_insight|minor_trial`.
**Đo được (FT6):** `distinctSources=["other"]`. Điều này cũng làm khoá deviation co lại thành `":"+source` → nuôi N179.

**N182 — MED — Tiểu Kiếp thiếu.** `js/engine.js:6322` `state.flags.minorTrial = state.flags.minorTrial || null;` — chỉ khởi tạo; không producer, không UI (`CON_DUONG_CANONICAL.md:1954,2073`).

**N183 — MED — Bất biến "một lần roll" của velocity bị vi phạm gián tiếp.** `engine.js:2986` filter `day - Number(s.gameDay||day) <= 24` giữ tới 25 ngày khác nhau rồi `.slice(-128)`. Một Bế Quan dài trong một ngày đẩy ra các sample cùng ngày trước đó (ví dụ combat insight); kết hợp nguồn luôn `"other"` (N181) thì attribution đã mất.

*(Trả lời trực tiếp: "đột phá thất bại có mất EXP không?" — **Không** trong tree hiện tại: roll thất bại duy nhất là gate `omen`, tốn SAN/Đạo Tâm không tốn EXP (`engine.js:3111-3121`), và nhánh commit được guard bởi `ritualStatus.ready && plan.length` (`:3569`) với `plan` khác rỗng cho mọi level ≥3 → khối roll/EXP-loss cũ ở `:3594-3596` **bất khả đạt**. Tuy nhiên Tẩu Hỏa vẫn trừ **uncommitted** EXP qua N179.)*

### C.4. Nghề / chế tác

**N184 — LOW — `craftArtifact` hoàn không đủ.** (trùng đợt 2 N76) `js/expansion.js:4068-4069` commit `procedural_artifact` (`linh_thach:8` + `stamina:5`) rồi `if (!item) { addItem(state,"linh_thach",8); … }` → stamina không hoàn, practice XP đã cấp.

### C.5. Mệnh: quan hệ / combo / dung hợp

**N185 — `[RUN]` MED — `mergeFates` bỏ qua `fusion_recipes`.**
`js/engine.js:2492-2504`: xoá nguyên liệu trong kho rồi `rollFateByProgression(...)`; `fateFusionRecipesFor` (`:524`) **không caller**.
**Đo được (FT5):** `fateFusionRecipesFor(fate đầu)=0`; `mergeFates(2)` trả `success:true` + Mệnh ngẫu nhiên `thien_dai_the_2712` (Hoàng phẩm).
Kịch bản: hai Mệnh bất kỳ trong kho dung hợp thành Mệnh ngẫu nhiên theo phẩm cấp, **bất kể** 78 recipe đã định; khi thất bại nguyên liệu được hoàn (`:2501`) nhưng roll vẫn tiêu RNG stream.

**N186 — MED — Không có resolver combo/eligibility.** `getComboEligibility`/`fuseFate` không tồn tại; combo chỉ được áp bằng `owned.has(m.id)` (`engine.js:938-953`) — không có resolver sở hữu/điều kiện.

**N187 — MED — `nurtureFate` tự nhảy bậc 1→2.** `js/engine.js:559` `if (record.stage === 1 && record.points >= 4) record.stage = 2;` — `FATE_CANONICAL.md:376` đòi "bậc 1→2 cần 3 lựa chọn aligned; Dưỡng Mệnh chỉ đóng góp điểm". Kịch bản: tiêu Linh Thạch 4 lần Dưỡng Mệnh (`:553-557`) → stage 2 không cần elite/aligned choice → thoả blocker `record.stage !== 2` của `resonateFate` (`:587`) và mở Cộng Minh (bậc 3) sớm.

### C.6. Weather

**N188 — MED — Tick không ghi `weatherSource`.** `js/expansion.js:1409-1421` `updateWeather` ghi `weather/weatherSeverity/weatherIntensity/weatherUntilDay` + history, **không** ghi `region.weatherSource`; `:365` `source: region?.weatherSource || "catalog"`. `setWeather` thì **có** ghi (`:1337`).
**Đo được (FT4b):** sau `setWeather(...,"mua")` source = `"resolver"`; sau `advanceGameTime(6)` weather đã chuyển sang `quang` (until=`2190968`) nhưng source **vẫn** `"resolver"` → field không phản ánh lần chuyển mùa do tick.
*(Tương đối: giá trị không đổi nên không phân biệt tuyệt đối "không ghi" vs "ghi cùng giá trị"; nhưng khớp mô tả agent.)*

**N189 — LOW — Hysteresis weather không data-driven ngoài `defaultDuration`.** `WEATHER_CATALOG` (`expansion.js:340-349`) có label/severity/defaultDuration/transitions/effects nhưng **không** field ngưỡng hysteresis; `updateWeather` chỉ dùng dwell time `weatherUntilDay`.

### C.7. Offline simulation

**N190 — MED (ghi nhận tích cực + caveat) — Idempotency offline đúng, nhưng aggregate bỏ sót producer.**
Không quan sát thấy phát thưởng trùng: `simulateWorldUntil` monotonic theo `lastProcessedDay` (`:2787-2799`), gọi lại cùng target trả `processed:0`. `simulateWorldAggregate` (`:2950-2961`) **không** gọi `recordActorHistory` → không bịa log per-actor. Nhưng aggregate bỏ nhiều producer (N175) → **mất hiệu ứng** thay vì nhân đôi.
Caveat: offline **có thể** ép Luân Hồi qua hết Thọ Nguyên trong `advanceGameTime → onGameYearPass → processLuanHoi` (`engine.js:5190-5199,3855-3857`) — đường này là cố ý nhưng mâu thuẫn câu chữ "offline không được ép Luân Hồi" trong `CROSS_SYSTEM_CANONICAL.md`.

*(Trả lời trực tiếp: "war cascade có đúng-một-lần không?" — **Đúng trên đường bình thường** (guard `if (!war.cascadeApplied)` + set `true` cùng block, `expansion.js:1458-1466`; `updateWars` chỉ lặp `status==="active"`, `:1449`; `verify_review_batches.js:534-541` xác nhận). **Nhưng** war mồ côi (N171) chạy cascade **0 lần** và để state fail validator.)*
*("Secluded cultivation có double-grant khi reload không?" — **Không**, vì không có gì session-scoped được persist: `secludedCultivation` chỉ ghi `state.autoCultivation` (`:3804-3812`), không bao giờ ghi `state.player.secludedSession`; an toàn này là **tình cờ**, vì thiết kế session canonical (N180) đơn giản không tồn tại.)*

---

## 5. BẢNG ƯU TIÊN ĐỢT 3

### HIGH

| ID | Mô tả |
|---|---|
| N141 | Echo lệnh thô lọt player log (`[RUN]`) |
| N142 | Gộp scene theo ngày bị vô hiệu (`[RUN]`) |
| N143 | Story window tách cùng ngày theo node |
| N144 | Dấu `—`/`…` hợp lệ bị xoá khỏi log (`[RUN]`) |
| N145 | Từ `phiên` phá huỷ cả câu (`[RUN]`) |
| N164 | Quest NPC `active` không bao giờ hết hạn (`[RUN]`) |
| N171 | War mồ côi không dọn, cascade 0 lần, validator fail (`[RUN]`) |
| N179 | Guard chống nested roll là no-op → mất EXP trong Bế Quan |
| B.1 | 30 API MAP canonical không tồn tại |

### MEDIUM

N146, N148, N151, N152, N153, N155, N156, N157, N158, N159, N161, N162, N165, N166, N168, N169, N170, N172, N173, N174, N175, N185, N186, N187, N188, N190, N180, N181, N182, N183, B.2–B.10 (các nhóm missing còn lại).

### LOW

N147, N149, N150, N154, N160, N163, N167, N176, N177, N178, N184, N189.

---

## 6. NHỮNG GÌ ĐÚNG TRONG ĐỢT 3

- **Retention log**: cap 300 hoạt động đúng, `logState.totalEvents` giữ tổng độc lập (`[RUN]` LT3: history=300, total=423).
- **Kênh stat tách biệt**: `statDisplay` là mảng riêng, không trộn vào prose; prose không chứa chữ số (`[RUN]` LT10).
- **Offline idempotency**: không phát thưởng trùng, aggregate không bịa log per-actor (`[STATIC]` + `[RUN]` gián tiếp).
- **War cascade exactly-once** trên đường bình thường (`expansion.js:1458-1466`).
- **Không mất EXP do đột phá thất bại** trong tree hiện tại (nhánh cũ bất khả đạt).
- **Không double-grant khi reload** ở bế quan (vì không persist session — dù là tình cờ).
- **`grantCanonicalReward`** cơ chế chống trùng hoạt động đúng (chỉ khoá hidden realm bị sai — đợt 2 N32).

---

## 7. CÁCH TÁI LẬP ĐỢT 3

```powershell
# Script ngoài repo (scratchpad phiên):
#  scan_symbols.js    → đếm 82 identifier requirement missing trong code
#  audit3_probe.js    → LT1..LT7 (log system) + FT1..FT8 (feature)
#  audit3_followup.js → FT1b (quest expiry), FT4b (weatherSource), FT9..FT11

node tools/verify_log_producers.js      # 79/79  (nhưng không có lower-bound → có thể pass rỗng)
node tools/verify_log_narrative.js
node tools/verify_expansion_log_matrix.js   # fixture là chuỗi mojibake → pass tầm thường
node tools/run_regression_suite.js          # vẫn FAIL 5/13 (xem báo cáo #1 §1.2)
```

*Hết báo cáo #3. Chế độ chỉ đọc.*

# PHỤ LỤC Z — CHỈ MỤC ID TOÀN TÀI LIỆU

| Tiền tố | Phần | Ý nghĩa | Khoảng |
|---|---|---|---|
| `G` | I | Mismatch/phát hiện toàn cục (cross-cutting) | G1–G15 |
| `M` | I | Mismatch code ↔ requirement theo từng feature | M1–M88 |
| `C` | I | Lỗ hổng logic tiềm ẩn (13 nhóm) | C1–C13 (+ tiểu mục) |
| `D` | I | Sub-feature thiếu so với requirement | D1–D7 |
| `E` | I | Mâu thuẫn nằm trong chính tài liệu requirement | E1–E10 |
| `N` | II | Phát hiện đợt 2 (có bằng chứng chạy code) | N1–N140 |
| `N` | III | Phát hiện đợt 3 (log system + feature còn lại) | N141–N190 |
| `B.n` | III | Nhóm register "đã thiết kế nhưng chưa code" | B.1–B.11 |
| `T` | II | Phép đo thực nghiệm đợt 2 | T1–T12 |
| `LT` | III | Phép đo thực nghiệm log system | LT1–LT10 |
| `FT` | III | Phép đo thực nghiệm feature | FT1–FT11 |

## Chỉ mục tra nhanh theo chủ đề

- **Roll Mệnh / trọng số / Tiên / Hung:** M1, M2, M3, M4, M8, M10, M11, D1.8, T8, N101–N104, N185–N187
- **Neo Nhân Tính / anchor:** M15–M18, D2.1–D2.5, B.3
- **Con Đường / pathState / ritual:** M19–M32, D2.6–D2.16, B.4, E4, E5
- **Nghề ẩn / hidden path / Dị Thể:** M33–M40, D3, B.5, B.6, N23, N24, N72, N73
- **Map / Oxy / fog / influence / travel:** M41–M49, D4, B.1, A4, A5, C6, G5, FT8, FT9, E2, E3
- **NPC / relationship / companion:** M50–M64, D5, C13, N1, N2, N25–N29, N164–N170
- **Technique / discovery / reward:** M65–M78, D6, B.9, N32, N74, N75
- **Combat:** N1–N31
- **Item / inventory / auction / heirloom:** N55–N76
- **Data layer / catalog:** N77–N89, T10, T11
- **Chất lượng bộ test:** N90–N121
- **UI render / i18n:** N122–N140
- **Log system:** N141–N163, LT1–LT10, A.1–A.4
- **Save / migration / autosave / validator:** G1, G4, G13, A9, C8, N110, B.10
- **War / tournament / world event:** N171–N178
- **Tu luyện / bế quan / đột phá:** N179–N183, FT3, FT6
- **Weather:** M45, N188, N189, FT4b
- **Offline simulation:** N175, N190, B.3

---

## GHI CHÚ PHƯƠNG PHÁP VÀ GIỚI HẠN

**Đã làm:**

- Quét 18 file canonical + audit + 2 nguồn root-level → đối chiếu với code thật.
- Chạy `node --check` (pass), `node tools/run_regression_suite.js` (FAIL 5/13), và 5 gate nhỏ.
- 41 phép đo thực nghiệm trên runtime nạp trong sandbox `vm` (T1–T12, LT1–LT10, FT1–FT11, cộng các phép đo phụ).
- Quét 92 identifier canonical để dựng register "chưa code" (82 missing + 10 thin).

**Giới hạn cần biết:**

- Một số kết luận đợt 1 là `[STATIC]` (đọc mã) chưa được tái lập bằng chạy code — đã ghi rõ nhãn ở từng mục.
- 3 claim của đợt 2 **không** tái lập được trong điều kiện đo (ghi ở Phần III §1.3): "120 cycle/giờ" của bế quan, "updateWeather không ghi weatherSource" (chỉ khớp gián tiếp), và cơ chế cụ thể của war mồ côi (kết luận lỗi vẫn đúng, cơ chế khác mô tả).
- Số dòng code đúng với working tree tại commit `cc1f28d`.
- Chưa chạy được browser E2E (môi trường chặn HTTP localhost) — mọi kết luận về DOM/pixel dựa trên đọc mã và headless harness.
- Báo cáo này **không** sửa code. Mọi đề xuất sửa nằm ở phần lộ trình P0/P1/P2, chờ xác nhận.

**Cách tái lập:** xem Phần I §10, Phần II §9, Phần III §7.

---

*Hết báo cáo gộp. Chế độ chỉ đọc; không file nào trong repo bị sửa đổi bởi quá trình audit.*
# CAP NHAT DOI CHIEU TRANG THAI — 2026-09-23

Phan nay la **so cai trang thai hien hanh**, duoc bo sung sau commit `0f91903`. Noi dung audit ben duoi van giu nguyen nhu lich su phat hien, nhung khong con duoc dung de suy ra rang mot muc da dong. Khi co mau thuan, phan nay la nguon trang thai uu tien.

## Quy uoc bat buoc

- **DA SUA**: da co code canonical va co test/runtime evidence tuong ung.
- **SUA MOT PHAN**: da sua mot nhanh, mot schema hoac mot boundary; van con nhanh/producer/UI/test chua du.
- **CHUA SUA**: phat hien van con, hoac chua co bang chung du de dong.
- **OBSOLETE/DOI CANONICAL**: phat hien cu khong con ap dung; phai dung behavior canonical moi de danh gia, khong duoc copy ket luan cu.
- **CHUA XAC MINH**: khong duoc coi la pass; can probe/test rieng truoc khi dong.

Moi dong ben duoi deu co `evidence` cu the. Regression xanh khong tu dong dong cac muc `CHUA XAC MINH` hoac `SUA MOT PHAN`.

## Ledger chi tiet theo ID

| ID / nhom | Trang thai hien hanh | Phan da lam | Phan con thieu / bang chung |
|---|---|---|---|
| G1 | DA SUA | Validator runtime duoc goi tai deserialize va post-action | `verify_canonical_contracts.js`, `verify_audit_closure.js`; can E2E browser neu muon dong UI boundary |
| G2-G3 | DA SUA | Loai perf timing ra khoi validity gate; kiem tra deterministic boundary | `profile_runtime_budget.js`; chua la browser performance profile |
| G4 | DA SUA | Autosave khong con return-som theo `explicit`; serialize duoc goi o boundary | `verify_game.js`, `verify_canonical_contracts.js` |
| G5 | DA SUA | Travel task, plan, version transaction, interrupt/resume/cancel da co | `verify_audit_closure.js`, `verify_canonical_contracts.js` |
| G6 | SUA MOT PHAN | Movement/teleport co guard va pending-task state | Chua co browser E2E bao phu moi nut teleport/hidden realm |
| G7 | DA SUA | Seed/replay va entropy boundary da duoc kiem tra lai | `verify_random_boundaries.js`, `verify_character_generator_replay.js` |
| G8 | DA SUA | Resolver khong ghi truc tiep catalog tinh; co canonical reward boundary | `verify_audit_closure.js`, `verify_catalog_balance.js` |
| G9 | DA SUA | Grade rank dung mot nguon; da sua typo `phan` | `verify_character_generator_replay.js`, `verify_utf8_integrity.js` |
| G10-G11 | DA SUA | Error narrative map, player-facing reason, alert boundary va debug echo da tach | `verify_log_narrative.js`, `verify_canonical_contracts.js` |
| G12-G13 | DA SUA | Transaction turn/save migration/schema v13 da co | `verify_game.js`, `verify_indexeddb_archive.js`, `verify_canonical_contracts.js` |
| G14-G15 | CHUA XAC MINH | Chua co probe rieng trong bo canonical moi | Khong duoc danh dau PASS cho den khi co test boundary tuong ung |
| M1-M14 | SUA MOT PHAN | Fate weights/source/pity/Hung pool, receive-fate va vault da sua | Fusion recipe, nurture gate va moi resolver fate chua dong het; xem N185-N187 |
| M15-M18 | DA SUA | Anchor candidate, trust/respect/suspicion/fear, max 3 anchor da co | UI lifecycle va migration cua anchor chua co E2E |
| M19-M32 | SUA MOT PHAN | Path alias/canonical namespace, unbound va match score da sua; Song Tu realm/score gate da co | Ritual/chuyen dao/dung hop va full progression matrix chua dong; `verify_review_batches.js` chi bao phu mot phan |
| M33-M40 | SUA MOT PHAN | Hidden profession id, namespace va cost ngoai SAN da sua | Toan bo hidden-path/Di The/revive/rejectedIds chua co contract test doc lap |
| M41-M49 | SUA MOT PHAN | Map owner/influence/cache/fog/travel API canonical da co | UI movement presentation, offline aggregate va tat ca map incident producer chua dong |
| M50-M64 | SUA MOT PHAN | NPC footprint/settlement, companion targeting/recovery/revive/UI surfaces da mo rong | Quest expiry, war, diplomacy, faction lifecycle va UI E2E con thieu |
| M65-M78 | SUA MOT PHAN | Technique DTO/context, prepare/channel/cancel/use, cooldown, guild transition da co | Discovery/reward/trial producer va cross-system matrix day du chua dong |
| M79-M88 | CHUA XAC MINH | Chua co ledger behavior-first bao phu tung muc | Phai tao probe canonical rieng, khong suy ra tu symbol/export |
| C1-C7 | SUA MOT PHAN | Mot so guard, transaction, reward/fate va map boundary da sua | Chua co test cho moi sub-item C1.x-C7.x; cac muc khong co evidence rieng van mo |
| C8-C10 | SUA MOT PHAN | Runtime validator, catalog immutability, grade source va replay/save boundary da sua | Chua dong het cache, migration edge, action-priority va browser persistence |
| C11-C13 | SUA MOT PHAN | Fate, log va companion contract chinh da sua | Fusion/nurture, NPC lifecycle va UI matrix con thieu |
| D1 | SUA MOT PHAN | Fate reward/source/pity va Hung pool da sua | Resonance/fusion/nurture/advanced lifecycle chua du |
| D2 | SUA MOT PHAN | Path state, alias, unbound, anchor va Song Tu gate da sua | Secondary path/ritual/progression day du chua duoc dong |
| D3 | SUA MOT PHAN | Profession identifier/namespace/cost da sua | Hidden path catalog, revive va rejection matrix con mo |
| D4 | SUA MOT PHAN | Map canonical surface, travel transaction, owner/zone/cache da co | World producer/offline/UI movement con mo |
| D5 | SUA MOT PHAN | Footprint/settlement va companion combat/UI da sua | Quest expiry, faction/war/diplomacy va settlement persistence con mo |
| D6 | SUA MOT PHAN | Technique prepare/channel/context/cooldown da sua | Discovery/reward/guild/trial cross-system con mo |
| D7 | SUA MOT PHAN | Offline bundle va regression wiring da co | Browser/performance/archive gate chua dong hoan toan |
| E1-E10 | CHUA XAC MINH | Chua co reconciliation rieng cho tung mau thuan trong requirement | Can review canonical docs thu cong va cap nhat tung E-ID; khong dung regression PASS de dong |
| N1-N2 | DA SUA | Companion target co threat/woundedness/guard; damage arity da sua | `verify_companion_runtime.js`, `verify_audit_closure.js` |
| N3-N22 | CHUA XAC MINH | Chua co behavior-first mapping tung ID | Khong duoc coi la da sua chi vi combat suite PASS |
| N23-N31 | SUA MOT PHAN | Resistance/revive/retarget va combat helper da duoc bo sung | Can matrix day du cho moi entity/companion/status; chua dong hoan toan |
| N32 | SUA MOT PHAN | Reward key co source va hidden-realm boundary da harden | Can test cross-realm replay/duplicate theo tung producer |
| N33-N54 | CHUA XAC MINH | Chua co mapping behavior-first tung ID | Can bo probe map/combat/exploration rieng |
| N55 | DA SUA | Item generation khong con prefix-suffix 1-1 co dinh | `verify_random_boundaries.js`, `verify_catalog_balance.js` |
| N56-N76 | SUA MOT PHAN | Item guard, quest reward, inventory/market mot phan da sua | Auction/heirloom/over-remove va refresh day du chua co gate rieng |
| N77-N89 | SUA MOT PHAN | Profession identifier va catalog balance da sua | Data-layer immutability/grade/source tung ID chua dong het |
| N90-N100 | DA SUA | Da loai assertion tautology; quality gate chan `assert(true)` | Chua thay the tat ca assertion cu bang behavior assertion cho tung ID |
| N101-N114 | SUA MOT PHAN | Canonical contract suite da bo sung mot phan invariant/save/idempotency | Van con cac invariant chua co assertion rieng; khong danh dau full PASS |
| N115-N121 | SUA MOT PHAN | Offline bundle, regression wiring, UTF-8/assets da co | `webgame/` van la runtime doc lap va chua co browser E2E |
| N122-N140 | SUA MOT PHAN | UI surface, i18n/error/echo va movement grouped presentation da sua | UI lifecycle, pixel/DOM E2E va mot so formatter surface chua dong |
| N141 | DA SUA | COMMAND_ECHO debugOnly/playerInvisible | `verify_canonical_contracts.js`, `verify_log_narrative.js` |
| N142-N143 | DA SUA | Scene grouping dung day/location contract moi; story window da co gate | Can browser rendering verification |
| N144-N145 | DA SUA | Unicode punctuation va tu hop le khong con bi strip sai; UTF-8 gate pass | `verify_utf8_integrity.js`, `verify_log_narrative.js` |
| N146-N163 | SUA MOT PHAN | Retention/stat channel/milestone/log producer da co | Chua co assertion tung producer va full narrative matrix |
| N164 | CHUA SUA | Chua co evidence quest NPC active tu dong het han | Can test qua 30 ngay va status `failed/expired` |
| N165-N170 | SUA MOT PHAN | NPC relationship/footprint/settlement lifecycle mot phan da sua | Trust trial/betrayal/succession/quest UI chua dong het |
| N171-N178 | CHUA SUA | Chua sua day du war orphan, faction power, front, tournament/offline cadence | Can implement producer + cascade + time-jump tests |
| N179-N183 | CHUA SUA | Chua co canonical cultivation session/minor trial/source taxonomy day du | Nested roll, secluded cultivation, insight source, minor trial van mo |
| N184 | CHUA SUA | Chua dong artifact refund/commit day du | Can test failure rollback va practice XP |
| N185-N187 | CHUA SUA | Fusion recipe/combo eligibility/nurture gate van chua dong | Can implement resolver + recipe + aligned-choice tests |
| N188-N189 | CHUA SUA | Weather source/hysteresis van chua dong day du | Can test tick source transition va data-driven dwell |
| N190 | SUA MOT PHAN | Offline idempotency da co; aggregate khong duplicate log | Producer coverage/time-jump va Luân Hồi policy con caveat |
| B.1-B.11 | SUA MOT PHAN | B.1 map surface, B.9 technique, B.10 migration va offline/test gates mot phan da co | B.2-B.8/B.11 chua co closure evidence tung requirement |
| T1-T12 | CHUA XAC MINH | Day la phep do audit cu; chi nhung phep duoc map sang test moi moi duoc coi lai | Can tao mapping tung T-ID sang script va output hien tai |
| LT1-LT10 | SUA MOT PHAN | Log retention/stat/producer va narrative gate da co | Chua co test thay the tung fixture cu cho moi LT-ID |
| FT1-FT11 | SUA MOT PHAN | Footprint, settlement, weather va mot so feature probe da cap nhat | FT2/FT3/FT4b/FT6/FT7/FT9-FT11 chua duoc dong day du neu chua co output moi |

## Danh sach viec con bat buoc

Tai thoi diem cap nhat nay, khong duoc ghi "audit hoan tat 100%". Cac nhom con mo/partially closed phai tiep tuc:

1. N164 va N171-N190: quest expiry, war/faction/tournament, cultivation/minor trial, fusion/nurture, weather, offline aggregate.
2. M79-M88, N3-N22, N33-N54, E1-E10, T1-T12: chua co mapping behavior-first tung ID.
3. N101-N140 va D7: bo test moi da co nhung van con invariant/UI/browser gate chua assert day du.
4. `webgame/`: chua nhap vao canonical runtime; chi duoc coi la ngoai contract neu requirement chinh thuc xac nhan.

## Bang chung da chay o commit nay

```text
node tools/run_regression_suite.js
OK: 25 regression checks passed
node tools/verify_canonical_contracts.js
OK: behavior-first canonical contract suite
```

Hai ket qua tren chi xac nhan cac gate da co; **khong dong cac dong CHUA SUA/CHUA XAC MINH** o ledger nay.

## Status override sau dot sua tiep theo — 2026-09-23

Bang nay ghi de len cac dong status truoc do sau khi da them offline cadence, war cleanup, quest expiry probe va rollback transaction. Cac dong khong co trong bang van giu status cua ledger phia tren.

| ID | Status moi | Thay doi / bang chung |
|---|---|---|
| N164 | DA SUA | Online tick va offline aggregate deu expire quest `available/active`; `verify_canonical_contracts.js` assert active quest chuyen sang `failed`. |
| N171 | DA SUA | War thieu faction bi remove khoi world simulation tai boundary, khong de validator fail cascade orphan; canonical probe assert war bi don. |
| N172 | DA SUA | `factionPowerSnapshot` tinh lai power tu base/resources/stability moi lan tick; khong con power hang so. |
| N173 | SUA MOT PHAN | War chi duoc tao khi co front node ke nhau; cap diplomatic pairing day du va policy frontier van can probe rieng. |
| N174 | DA SUA | `frontNodeIds` khong con rong khi war duoc tao; participate war co front guard. |
| N175 | SUA MOT PHAN | Offline aggregate da bo sung expiry, world event, weather, faction/tournament va final actor projection; van dung bounded projection de tranh O(days * actors), chua parity tung ngay voi online tick. |
| N176 | DA SUA | Tournament opponent seed da dua `tournament.seed` vao key; bracket replay khong chi phu thuoc id. |
| N177 | DA SUA | War moi ghi `warCooldownUntil = day + 30`; khong dung undefined nhu cooldown da het han. |
| N178 | SUA MOT PHAN | Offline aggregate co diplomatic boundary; cadence tuan day du cho moi ngay offline van chua parity hoan toan. |
| N179 | DA SUA | Cultivation deviation dung replay key duy nhat theo day/source/turn/sample; khong con guard set-xoa trong cung call. |
| N180 | DA SUA | Canonical `startSecludedCultivation/advanceSecludedCultivation/stopSecludedCultivation` da co va duoc export; legacy hour API chi la compatibility wrapper. |
| N181 | DA SUA | `recordCultivationGain` nhan va luu taxonomy source; canonical probe assert `combat_insight` duoc persist. |
| N182 | DA SUA | `triggerMinorTrial` tao lifecycle state active; canonical probe assert producer. |
| N183 | SUA MOT PHAN | Velocity sample attribution da co; attribution cho moi producer legacy van can mapping tung callsite. |
| N184 | DA SUA | Craft artifact failure rollback lai material, stamina va profession mastery; khong cap XP neu khong sinh duoc item. |
| N185 | DA SUA | `mergeFates` bat buoc recipe canonical, success-rate/replay roll, consume va reward theo recipe. |
| N186 | DA SUA | `getComboEligibility` doc combo set canonical; khong con chi check `owned.has`. |
| N187 | DA SUA | `nurtureFate` chi cong diem; stage 1→2 can aligned choices qua `recordFateBehavior`. |
| N188 | DA SUA | World tick ghi `weatherSource=world_tick` khi transition va history co source; manual setWeather giu source resolver. |
| N189 | SUA MOT PHAN | Weather transition pool/duration da data-driven qua catalog `transitions/defaultDuration`; chua co hysteresis threshold rieng cho moi weather. |
| N190 | SUA MOT PHAN | Offline idempotency + cadence producer da sua; checkpoint dai ngay van la approximation va can test parity day-du voi online tick. |
| B.1 | DA SUA | MAP canonical surface da co API va behavior-first gate. |
| B.2-B.8 | SUA MOT PHAN | Cac API/producer chinh da co mot phan; tung register item van chua co parity matrix doc lap. |
| B.9-B.10 | DA SUA | Technique cross-system va migration/save boundary da co canonical tests. |
| B.11 | SUA MOT PHAN | Offline/test closure da them gate; browser E2E va webgame boundary van mo. |
| FT3 | DA SUA | Secluded cultivation session canonical, source taxonomy va minor trial producer da co probe. |
| FT4b | DA SUA | Weather tick source duoc ghi lai theo transition; manual resolver source tach rieng. |
| FT5 | DA SUA | Fusion recipe canonical duoc dung trong merge. |
| FT6 | DA SUA | Cultivation source taxonomy khong con hardcode `other` o canonical gain probe. |
| FT7 | SUA MOT PHAN | Faction power/war cleanup da sua; orphan cascade + frontier parity can them scenario. |
| FT8 | DA SUA | Travel task canonical da co, serialize/transaction/interrupt/resume da test. |
| FT9-FT11 | SUA MOT PHAN | Map/NPC/weather/offline surface da co; chua co browser E2E va full producer parity. |

| M77 | DA SUA | `featureVersions.techniqueCrossSystem` duoc khoi tao tai expansion state; canonical probe assert version >= 1. |
| M78 | DA SUA | `discoveryStatusSummary` chi doc, khong tu gan status; codex clues khong bi ep vao lifecycle status. Canonical probe assert snapshot state khong doi. |
| M79 | DA SUA | Save payload dung `version: 13`, `schema: tu_vi_quy_di_canonical_v13`; migration v12→v13 duoc giu tuong thich. |
| M80 | CHUA SUA | World clock epoch va shape canonical van chua dong hoan toan; can migration/formatter probe rieng. |
| M81 | DA SUA | Engine `normalizeAction` dat tier 3 vao overflow neu khong khai surface; UI khong con coi tier 3 mac dinh la quick. |
| M82 | DA SUA | UI uu tien `action.surface` tu resolver; chi fallback tinh surface khi DTO thieu field. |
| M83 | OBSOLETE/DOI CANONICAL | Movement UI grouped `act_move_group` la contract hien hanh; action engine van giu 4 huong de resolver. |
| M84 | SUA MOT PHAN | Co phan tach world/player clock va API ordinal; formatter/shape tuong thich canonical chua dong het. |
| M85 | CHUA SUA | Random-boundary gate chua quet day du webgame/index.offline/data/tools; day la boundary can quyet dinh contract. |
| M86 | DA SUA | Regression suite da them offline bundle, archive, performance, random, assets, expansion log, audit closure va canonical contract gates. |
| M87 | DA SUA | Offline bundle da rebuild sau thay doi runtime/UI; `verify_offline_bundle.js` va asset gate PASS. |
| M88 | DA SUA | Hai clock/pinned summary/render action boundary da co; browser E2E van la gioi han kiem chung. |

| N3-N10 | SUA MOT PHAN | Combat/pending opportunity va exploration boundary da co guard/action priority; can probe tung encounter-vs-opportunity scenario. |
| N11-N22 | SUA MOT PHAN | Damage/ledger/replay boundary da co mot phan; can matrix idempotency sau save cho tung combat action. |
| N33-N54 | SUA MOT PHAN | Hidden realm departure, pending discovery, map transaction/fog/travel canonical da co; can probe tung legacy edge case. |

## Xu ly nhom OBSOLETE/DOI CANONICAL

| Finding lich su | Quyet dinh hien hanh |
|---|---|
| Movement phai hien tung action rieng tren UI | OBSOLETE: engine giu 4 huong canonical; UI grouped presentation `act_move_group` la dung contract. |
| Footprint phai tra `destinationHint` | OBSOLETE: canonical khong lo destination; chi tra clue class/direction khong chac chan. |
| Settlement xuat hien ngay visit thu 8 | OBSOLETE: canonical yeu cau 8 distinct visit days + monthly eligibility roll. |
| Song Tu khong can realm/match gate | OBSOLETE: canonical yeu cau realm 6 + path score toi thieu 5. |
| Vault capacity = do dai array sau splice | OBSOLETE: canonical tach active projection/vault capacity; test legacy khong duoc ep array length. |
| Offline bundle marker cu | OBSOLETE sau khi rebuild; phai dung `verify_offline_bundle.js` voi source hash/marker hien hanh. |

## Cac muc van mo sau status override

Khong duoc ghi audit 100% cho den khi dong cac muc sau: `G14-G15`, `E1-E10`, `N3-N22`, `N33-N54`, `N90-N114` coverage day du, `N122-N140` browser/UI E2E, `N173`, `N175`, `N178`, `N183`, `N189`, `N190`, `B.2-B.8`, `B.11`, `FT7`, `FT9-FT11`. Day la cac muc con can code/probe, khong bi an duoi ket qua regression PASS.

## Status override bo sung — 2026-09-23 (sau dot tiep tuc)

| ID | Status moi | Bang chung cap nhat |
|---|---|---|
| M80 | DA SUA | `ensureWorldClock` giu tuong thich `state.worldClock` cu va dong thoi tao adapter canonical `state.gameClock.world` voi `epochDate`, `startDayIndex: 2475360`, `currentDayIndex`, year/month/day va player-day sync; `verify_canonical_contracts.js` assert round-trip va shape nay. |
| M85 | DA SUA | `webgame/app.js` khong con entropy truc tiep; cultivate dung `webRandom` deterministic theo seed/turn. `verify_random_boundaries.js` da quet them `webgame/app.js`; bundle/root runtime van duoc kiem tra boi gate offline rieng. |

Hai ID tren duoc loai khoi danh sach muc van mo o tren. Cac muc E1-E10, N3-N22, N33-N54, UI/browser E2E va cac nhom con lai van giu status cu cho den khi co probe rieng tuong ung; khong suy dien tu regression PASS.

## Status override tiep theo — 2026-09-23

| Nhom | Status | Bang chung / pham vi da xu ly |
|---|---|---|
| E1 | DA SUA | Reconciliation: runtime reconciliation cuoi `FATE_CANONICAL.md` la canonical; doan "chua co/cho duyet" lich su chi giu lam historical note. |
| E2 | SUA MOT PHAN | Giu namespace toa do runtime `0..100`; adapter Oxy khong duoc dung lam input movement. Origin logic van can migration data-toa-do rieng, khong tu y doi map da phat hanh. |
| E3 | DA SUA | Chot huong Bac canonical la `y-1`; test movement direction va open-world neighbor da PASS. Doan mo ta `y+1` la obsolete. |
| E4 | DA SUA | Chot ritual IDs runtime `call_fate/compare/anchor/omen/cost`; ten cu la alias tai lieu, khong them pipeline song song. |
| E5 | SUA MOT PHAN | Runtime giu plan/data hien hanh; can probe progression matrix day du truoc khi doi thu tu anchor/compare vi co save legacy phu thuoc. |
| E6 | DA SUA | Chot revive companion 3 Linh Thach / 25% theo `COMPANION_CANONICAL.md`; ban 12/35 la audit historical obsolete. |
| E7 | SUA MOT PHAN | Cong thuc affinity stage dang theo scale stage/maxStage; catalog affinity van duoc giu. Can chot lai product choice truoc khi doi output. |
| E8 | DA SUA | Retention runtime validator va memory projection da dung gioi han canonical hien tai; muc 20 la historical requirement khong con duoc ap vao runtime. |
| E9 | DA SUA | UI grouped movement la canonical; browser E2E da xac nhan nut `Di chuyển` gom xuat hien tren action surface. |
| E10 | DA SUA | Chot relationship decay policy `none` theo `RELATIONSHIP_CANONICAL`; khong tu them decay 30 ngay tu tai lieu CHO DUYET. |
| N3-N22 | SUA MOT PHAN | Da bo sung target commit, receipt save/load, cooldown `readyAtTurn`, combat merge, search combat/travel guard, loot instance ledger, threat read-path va predator extra. Con can probe rieng tung ID con lai. |
| N33-N54 | SUA MOT PHAN | Da co map-event abandonment helper, hidden-realm departure cleanup, pending TTL/schema, finding IDs/rollback, NPC assist, authored event tag, stale opportunity guard. Con N49/N50/N51/N54 can producer matrix. |
| N122-N140 / browser UI E2E | SUA MOT PHAN | Browser local E2E da vao game, tao nhan vat, chon y dinh, xac nhan action surface va grouped movement. Pixel/responsive va tat ca modal lifecycle chua dong. |
| N173 | SUA MOT PHAN | World/faction power va war/front guards da sua; can behavior matrix ve geographic pairing. |
| N175/N178/N190 | SUA MOT PHAN | Offline aggregate co producer projection va idempotency; parity tung ngay voi online tick van chua dong do performance boundary. |
| N183/N189 | SUA MOT PHAN | Source attribution, weather source transition va combat element cap da bo sung; velocity multi-producer/hysteresis data matrix van mo. |
| B.2-B.8/B.11 | SUA MOT PHAN | Canonical exports va mot so resolver da co; cac register missing can implementation matrix tung API, khong danh dau DA SUA chi vi export ton tai. |
| FT7/FT9-FT11 | SUA MOT PHAN | Faction/map/NPC/weather/browser probes da mo rong; frontier/offline producer parity va responsive E2E van can them. |

### Legacy/canonical reconciliation note

Khong tao logic song song cho cac alias E-ID. Moi alias chi duoc map vao mot API canonical hien hanh; neu requirement cu mau thuan voi canonical moi thi status la `OBSOLETE/DOI CANONICAL` hoac `SUA MOT PHAN`, khong dung regression PASS de che lap khoang trong.

## Status override tiep theo — 2026-09-23 (map/NPC/world hardening)

| Nhom | Status | Bang chung / pham vi da xu ly |
|---|---|---|
| N43-N44 | SUA MOT PHAN | Dieu tra chi consume mot information finding moi lan, giu chain stage va cac finding con lai; secret node van can probe quest-chain day du. |
| N45 | DA SUA | Hidden realm cycle dung moc ngay 1, close day inclusive va omen window 2 ngay truoc mo; canonical contract suite PASS. |
| N48-N50 | SUA MOT PHAN | Movement bi chan trong combat; map-event chance co corruption bonus cho Cam Dia/Hai Vuc; cooldown resolve dung minimum theo group. Monster producer matrix van can probe rieng. |
| N51 | CHUA XAC MINH | `competitorProgress` van chua co producer catalog day du; khong danh dau dong khi chua co fixture competitor canonical. |
| N54 | SUA MOT PHAN | Dong Phu khong con claim/trao loot ngay; tao challenge state voi guardian/formation/sealed ward va loot receipt chua khoi tao. Resolver chinh phuc cac lop can tiep tuc bo sung. |
| N165-N166 | SUA MOT PHAN | NPC quest co objective canonical toi thieu va `npcQuestStatus` khong seed quest khi chi doc; lifecycle offer/accept/turn-in van can UI matrix. |
| N167 | DA SUA | `sendMail` rollback chi phi/vat pham neu schedule that bai; delivery inbox co cap 50 va snapshot read model. |
| N173 | SUA MOT PHAN | Diplomacy chi tao cap giua faction co front node ke dia ly; can fixture matrix cho ownership thay doi theo tick. |
| N175/N178/N190 | SUA MOT PHAN | Detailed offline window mac dinh tang len 90 va gioi han 180 ngay, giu idempotency; aggregate parity dai han va policy Luân Hồi van chua dong. |
| N189 | SUA MOT PHAN | Weather docile hysteresis da ho tro field `hysteresisDays` voi fallback `defaultDuration`; catalog hien tai chua khai bao threshold rieng tung weather. |
| N33-N54 / browser UI E2E / B.2-B.11 / FT7/FT9-FT11 | SUA MOT PHAN | Them behavior probes cho movement combat, pending cave challenge, NPC read purity va discovery boundaries; cac phan UI responsive, legacy matrix va producer parity van mo. |

Bang chung dot nay: `node tools/verify_canonical_contracts.js` PASS; `node requirement/validate_requirement_docs.js` PASS; `node --check js/engine.js` PASS; `node --check js/expansion.js` PASS. Chua ghi audit 100%.

## Status override tiep theo — 2026-09-23 (ra soat cac phan A–M)

| Nhom | Status moi | Cap nhat implementation / ket luan |
|---|---|---|
| A1-A4 | DA SUA | Runtime validation duoc goi tai create/deserialize/advance/action boundary; validator khong dung wall-clock cho invariant; autosave khong con early-return khi `explicit=false`; travel task/schema canonical da co. |
| A5 | SUA MOT PHAN | Hidden realm va travel task da co guard/cleanup; cac direct location transition legacy van can fixture rieng de xac nhan moi nhanh deu qua movement contract. |
| A6 | DA SUA | Profession runtime item khong ghi nguoc `D.ITEMS`; item snapshot nam trong `state.generatedItems`, catalog static duoc giu bat bien. |
| A7 | CHUA SUA | `webgame/` van la micro-runtime ngoai canonical boundary; khong nhap vao runtime chinh khi chua co quyet dinh san pham. |
| A8-A9 | DA SUA | Grade rank dung `GameEngine.GRADE_TO_TIER`; save schema v13 va `migrateV12ToV13` da co. |
| A10-A12 | SUA MOT PHAN | Player-facing reason/error map va action guard da duoc mo rong; van con alert legacy va mot so mutation pipeline can UI/E2E transaction matrix. |
| A13 | DA SUA | Offline bundle duoc rebuild tu runtime hien tai va `verify_offline_bundle.js` PASS. |
| A14-A15 | SUA MOT PHAN | Nhieu ledger/history da co cap; NPC memory/path/evolution retention can audit producer tung field, chua danh dau dong toan bo. |
| M1-M3 | DA SUA | Fate 9+ tien weight = 0; resolver doc source/pathAffinity/pityKey/unique ownership va dung mot grade table canonical. |
| M4 | SUA MOT PHAN | Resolver khong roll hut va co fallback, nhung fixture grade hole can xac nhan viec don trong so ve bac lien ke theo catalog. |
| M5 | DA SUA | `nurtureFate` chi cong diem; stage transition chuyen sang behavior gate canonical. |
| M6-M11 | SUA MOT PHAN | Resonance/evolution/duplicate/fusion/online reward da co canonical resolver phan lon; stage 3→4 qua breakthrough, reward producer va UI confirmation van can parity matrix day du. |
| M12-M14 | DA SUA | Match score clamp 0..10, unbound short-circuit, `fateDefinition`/resonance API co surface; advanced action catalog va UI legacy van can probe. |
| M15-M18 | DA SUA | Anchor gate dung trust/respect/suspicion/fear, loc NPC class, toi da 3 anchor va schema `type/status/maxStability/lastNurturedAt`. |
| M19-M25 | DA SUA | Path match clamp, unbound namespace, vault capacity theo equipped IDs, dual-path gate realm/match va ritual plan anchor/omen da duoc chot theo canonical. |
| M26-M32 | SUA MOT PHAN | Body/mind va path projection da duoc noi mot phan; secluded cultivation, gift policy, path-state mutation va player projection can test day du. |
| M33-M40 | SUA MOT PHAN | Profession/Dị Thể namespace, rejectedIds/revive/cost va special-physique history da co migration; hidden-path catalog, legacy aliases va non-SAN effect can fixture. |
| M41-M88 | SUA MOT PHAN | Map/world/NPC/companion/technique/UI canonical surface da bo sung qua cac dot truoc; cac muc UI/performance/archive va legacy producer chua co closure evidence tung ID. |

Ket qua dot A–M: khong co co so de ghi `DA SUA` cho toan bo A–M. Cac muc `CHUA SUA`, `CHUA XAC MINH`, `OBSOLETE/DOI CANONICAL` van duoc giu nguyen neu khong co runtime fixture hoac requirement da doi canonical.

## Status override tiep theo — 2026-09-23 (tu M den het audit)

| Nhom | Status moi | Cap nhat / bang chung |
|---|---|---|
| M41-M44 | SUA MOT PHAN | Influence owner duoc derive voi nguong 35, them `stable/frontier`, bo ghi `ownerFactionId` trong recompute/outpost; cong thuc structure/event/cache version van can parity fixture day du. |
| M45-M49 | SUA MOT PHAN | Fog/map surface giu canonical API; weather consumer, coordinate legacy va fast-travel policy van can UI/producer matrix. |
| M50 | DA SUA | Rumor policy dung min confidence 0.1, TTL 14 ngay va acceptance theo confidence, khong uu tien priority hon confidence. |
| M51-M54 | SUA MOT PHAN | Queue/NPC lifecycle, footprint clue va settlement da co guard mot phan; can test distinct-day/capacity settlement va khong lo destination. |
| M55 | DA SUA | Intimidation faction report da ve xac suat canonical 30%. |
| M56 | DA SUA | Gift disliked = -6, chi tac dong affection, co cap 3 qua/NPC/ngay va chan quest/equipped/locked item. |
| M57-M64 | SUA MOT PHAN | Betrayal threshold 70, queued interaction guard va companion defaults/migration da co; successor lifespan-day, su_do-only va tai lieu revive van can closure. |
| M65-M78 | SUA MOT PHAN | Technique resolver/receipt/guild/membership cross-system da co; policy catalog, preview-confirm UI va guild teaching producer van can fixture rieng. |
| M79-M88 | CHUA XAC MINH | Chua co behavior-first matrix bao phu tung API/UI/platform ID; khong suy dien tu export hoac regression PASS. |
| N141-N190 | SUA MOT PHAN | Log, quest expiry, war cleanup, cultivation source, weather source, offline idempotency va discovery boundaries da co; producer parity dai han va UI/browser van mo. |
| B.1-B.11 | SUA MOT PHAN | Canonical API surface, technique/save/offline gates va map/NPC/companion adapters da co; B.2-B.8 va B.11 chua co parity matrix tung register item. |
| T1-T12 / LT1-LT10 / FT1-FT11 | SUA MOT PHAN | Cac gate runtime moi da duoc chay lai trong regression 25/25; cac phep do cu khong co output behavior-first doc lap van giu status partial. |
| G14-G15 / E1-E10 / browser UI E2E | SUA MOT PHAN | Mot so conflict da doi canonical va da note; webgame boundary, responsive/browser full lifecycle va cac tai lieu mau thuan van chua dong. |

Bang chung dot nay: `node tools/verify_dichi_deep.js` PASS; `node tools/verify_canonical_contracts.js` PASS; `node tools/verify_expansion_stress.js` PASS; full `node tools/run_regression_suite.js` PASS 25/25; offline bundle da rebuild. Khong ghi nhan audit 100%.

## Status override - behavior-first closure wave 2026-09-23

Day la bang status moi nhat cho wave nay. Bang nay uu tien hon cac dong `CHUA XAC MINH` cu khi cung mot ID da co evidence moi; cac phan chua co evidence day du van giu `SUA MOT PHAN` hoac `CHUA XAC MINH`.

| Nhom | Status sau wave | Evidence / phan con mo |
|---|---|---|
| A7 | DA SUA | `webgame/` duoc xac dinh la micro-runtime doc lap, deterministic, local-only, khong import/save vao canonical; them `webgame/CANONICAL_BOUNDARY.md` va `verify_webgame_boundary.js`. |
| G14 | DA SUA | Offline bundle parity duoc assert rieng trong behavior matrix va `verify_offline_bundle.js`; khong con chap nhan bundle cu. |
| G15 | OBSOLETE/DOI CANONICAL | Nhanh roll EXP cu khong con la canonical producer. Breakthrough canonical hien la `doBreakthrough` + ritual/blocker contract; probe moi chi chap nhan flow canonical, khong danh dau nhanh legacy la active. |
| E2/E5/E7 | SUA MOT PHAN | Da co mapping behavior-first va giu compatibility voi save/map/catalog hien hanh; migration data legacy, progression matrix va product choice van can fixture rieng. |
| M4 | DA SUA | Them `resolveFateGradeFallback()` voi nearest-lower policy; fixture cover sparse pool, grade cap va grade weight = 0. |
| M41-M44 | SUA MOT PHAN | Cong thuc influence da chuyen sang `power * 0.70^distance * (1 + structure + outpost + event)`, clamp 0..100; cache co context key world/faction/map/war. Van can producer parity cho moi lifecycle event. |
| M45-M49 | SUA MOT PHAN | Weather catalog co effect `travelWeight/speedMultiplier` va hysteresis rieng; weather snapshot la input canonical cua travel weight. UI/browser movement E2E van mo. |
| M51-M54 | SUA MOT PHAN | Footprint khong lo destination; settlement dung distinct visit days, key NPC+node va co capacity guard. Van can fixture capacity conflict va full NPC producer matrix. |
| M57-M64 | SUA MOT PHAN | Companion normalize/targeting/lifecycle catalog da co behavior probe; successor/revive policy va long-lived NPC migration van can fixture doc lap. |
| M65-M78 | SUA MOT PHAN | Technique prepare/channel/cancel, receipt, guild membership va catalog cross-system da co probe. Teaching producer, preview-confirm UI va reward/discovery producer parity van mo. |
| M79-M88 | SUA MOT PHAN | Da tao behavior-first matrix cho API/save/UI/platform; M79/M87 bundle/save da co evidence. Full browser lifecycle, pixel/responsive va archive gate van chua dong. |
| N3-N22 / N33-N54 | SUA MOT PHAN | Da co behavior matrix cho combat/map/hidden-realm/replay boundary; khong coi regression tong la thay the mapping tung legacy ID. N49/N50/N51/N54 producer fixture van mo. |
| N90-N114 | SUA MOT PHAN | Assertion thay bang invariant-oriented checks trong matrix; van con cac legacy fixture chua map mot-mot tung N-ID. |
| N122-N140 | SUA MOT PHAN | Responsive CSS, modal/tab lifecycle, action queue, map/world/oddities renderer da co static contract; browser E2E pixel/DOM day du van chua co. |
| N173 | SUA MOT PHAN | Frontier/ownership/faction/war validator va tick probe da co; ownership thay doi qua nhieu tick va diplomacy pair matrix van mo. |
| N175/N178/N190 | SUA MOT PHAN | Offline idempotency, weather/NPC quest validation va aggregate window probe da co; parity day-du tung ngay voi online tick va policy Luân Hồi van mo. |
| N183 | SUA MOT PHAN | Source attribution surface da co probe; mapping toan bo legacy producer callsite van chua xong. |
| N189 | DA SUA | Weather co threshold hysteresis rieng theo catalog, snapshot va world tick deu dung catalog. Can them regression fixture cho moi transition edge neu catalog thay doi. |
| B.2-B.8/B.11 | SUA MOT PHAN | Canonical register parity matrix da tao cho resolver/validator/save/offline/technique/UI; browser/webgame boundary va tung legacy register fixture van mo. |
| FT7/FT9-FT11 | SUA MOT PHAN | Faction/map/NPC/weather/offline producer checks da them; frontier parity, full producer inventory va browser E2E van mo. |
| LT1-LT10 | SUA MOT PHAN | Log echo/narrative/retention invariant co fixture; chua map tung output do legacy LT mot-mot vao fixture moi. |
| T1-T12 | SUA MOT PHAN | Tao mapping T-ID -> canonical validator/behavior probe; so do cu khong duoc dung lam PASS neu khong co output behavior-first doc lap. |
| C1-C13 / D1-D7 | SUA MOT PHAN | Matrix da cover entropy, save, map, companion, technique, discovery, offline va UI boundary; fusion/nurture, hidden path, revive/rejection, NPC lifecycle va full browser persistence van can fixture chuyen sau. |

### Test gate cua wave

Them `tools/verify_behavior_first_matrix.js` voi 18 contract groups va `tools/verify_webgame_boundary.js`; hai script da duoc noi vao `run_regression_suite.js`. Ket qua local moi nhat: `27 regression checks passed`, behavior matrix PASS, audit closure PASS, syntax engine/expansion PASS, `git diff --check` PASS.

Khong danh dau audit 100%: cac dong `SUA MOT PHAN` va cac browser/legacy producer fixture con mo la co y, khong phai PASS an.

## Status override - full legacy/runtime hardening wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| C1 | DA SUA | `replayRandom` khong con fail-open ve ambient entropy; dung day ordinal va hash fallback deterministic. Loot receipt da idempotent theo combat encounter. |
| C8 | DA SUA | Runtime boundary goi `validateExpansionState`; technique cross-system catalog/state da co gate va behavior probe. |
| C9 | DA SUA | Mailbox, profession/path history va evolution progress keys deu co retention bound; validator assert bound. |
| C10 | DA SUA | Realm lookup dung canonical alias-aware resolver; UI khong con next-realm lookup bang id legacy; profession mastery co stage 4/600 threshold. |
| C13.2 | DA SUA | Rumor propagation snapshot source list truoc khi mutate, khong lan nhieu hop trong cung tick. |
| C13.8 | DA SUA | Online combat co companion intercept/damage ledger theo guard stance; offline va online dung cung damage producer. |
| N120/N131 | DA SUA | Test movement dung grouped canonical surface; origin handler khong con reference ngoai scope va co lifecycle render sau confirm. |
| N123-N126 | SUA MOT PHAN | Companion/world/discovery surfaces da co panel co ban; can browser DOM lifecycle evidence cho tat ca state variants. |
| N135-N136 | DA SUA | `GameI18n` da export day du formatter canonical va formatHistory da cover 8 weather IDs; legacy matrix probe da assert. |
| T1-T12 | DA SUA | `verify_legacy_behavior_matrix.js` map tung ID vao canonical validator/probe va reject missing producer. |
| LT1-LT10 | DA SUA | Cung matrix da co fixture log/retention/narrative/replay cho tung ID. |
| FT1-FT11 | DA SUA | Cung matrix da co fixture cho companion/prisoner/weather/map/structure/tournament/war/world event/offline/perf. |
| C2-C7/C11-C12 | SUA MOT PHAN | Nhieu finding cu da obsolete/doi canonical sau runtime moi; cac mutation rollback, alert player-facing, dynamic catalog producer va hidden-path UI van can fixture transaction/E2E rieng. |
| D1-D7 | SUA MOT PHAN | Canonical resolver va validator da co cho nhieu nhanh; resonance/fusion/nurture, NPC class/lifecycle, reward producer, hidden path va browser persistence chua co full scenario coverage. |

Test moi: `tools/verify_legacy_behavior_matrix.js` da duoc them vao regression suite. Khong ghi `DA SUA` cho browser E2E hoac producer parity neu chi co static validator.

## Status override - deep canonical probe wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| D1.1 | DA SUA | `fateEffectBreakdown` exposes `resonance.active` and the catalog `resonanceEffect` only at stage 3/unlocked; `verify_audit_deep.js` probes this path. |
| D1.6 | DA SUA | `mergeFates` consumes canonical `fusion_recipes`, validates exact material set, uses deterministic roll and canonical reward receipt. |
| D4.1-D4.3 | DA SUA | Canonical map/world producer surface and versioned transaction APIs are exported and exercised by deep probe plus behavior-first matrix. |
| D5.4-D5.6 | SUA MOT PHAN | Footprint retention uses a three-day window and settlement capacity is enforced; browser lifecycle and full clue-class UI remain open. |
| D6.1-D6.4 | DA SUA | Technique resolver/commit/trial and guild membership transition APIs are canonicalized and checked by cross-system catalog/state probes. |
| D7.1-D7.9 | SUA MOT PHAN | Static UI/bundle contracts are covered; browser persistence, responsive behavior and full action-surface E2E are still not proven. |
| E1-E10 | SUA MOT PHAN | Runtime override rows are authoritative where code and canonical data now agree; unresolved document contradictions remain open until fixture-backed verification. |

Deep probe gate: `tools/verify_audit_deep.js` PASS. This wave does not claim 100% closure: browser/UI E2E, remaining D2/D3/D5/D7 scenarios and unresolved requirement contradictions remain open.

## Status override - NPC/hidden-path/performance wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| A7 | DA SUA | `webgame/CANONICAL_BOUNDARY.md` chot webgame la micro-runtime local, deterministic, khong import save/reward/runtime canonical; boundary probe PASS. |
| D2.1-D2.3 | DA SUA | NPC co actorClass/roleTags/anchorCandidate/instanceId/expiresAt/homeLocationId va lifespan theo ngay; anchor legacy duoc migrate, co nurture va lifecycle strained/broken; deep probe PASS. |
| D5.2-D5.5 | DA SUA | NPC lifespan canonical, succession quest filtering, footprint 3-day retention va intimidate skill-check/failure branch da co producer; deep probe + completion regression PASS. |
| D3.1-D3.7 | SUA MOT PHAN | Hidden-path catalog, sourceType, clue namespace, dormant/active state va Cổ Thần encounter once-per-character da co; ritual UI/fully authored gameplay branches chua co browser evidence day du. |
| N51 | DA SUA | `competitorCatalog` va `competitorProgressSnapshot` tao fixture producer canonical, co deterministic cadence va duoc deep probe. |
| D7.1-D7.3 | SUA MOT PHAN | `contextState` co fingerprint memoization, reduced-motion capability va performance profile consumer cho story window; map/NPC budget va browser responsive evidence van mo. |
| N122-N140 | SUA MOT PHAN | Browser local E2E da xac minh home -> create -> region -> intent modal va action surface; confirm intent van can xu ly alert/modal lifecycle de dong hoan toan. |
| E2/E5/E7 | SUA MOT PHAN | Da co runtime adapter/compatibility va fixture mot phan; migration/progression/product-choice matrix chua du. |

Deep probe sau wave nay: `verify_audit_deep.js` PASS; browser probe da tim thay lifecycle path con mo (locked intent overlay sau confirm), nen khong danh dau browser E2E PASS.

Browser follow-up 2026-09-23: radio `journey-intent` + `data-journey-intent-confirm` da duoc thao tac dung target tren local Chrome; overlay chuyen `hidden`, story log va action surface van hien thi. N122-N140 van `SUA MOT PHAN` vi chua co responsive viewport matrix va save/load persistence matrix cho toan bo surface.

| M80 | DA SUA | `validateWorldClockState` chot epoch, day/month/year va sync shape; deep probe PASS. |

## Status override - offline canonical parity and catalog isolation wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| N175/N178/N190 | SUA MOT PHAN | Offline replay now uses the same canonical daily `tick()` for 30/180/365-day windows, is deterministic and idempotent, and no longer mutates static location catalogs. Ranges longer than 365 days still use an explicit deterministic checkpoint projection, so long-range exact parity remains open. |
| B.2-B.8/B.11 | SUA MOT PHAN | Runtime location proxy now materializes state-owned copies, preventing catalog side effects; dedicated offline parity fixture passes. Per-register legacy fixture parity and webgame/browser matrix remain open. |
| D7.4-D7.9 | SUA MOT PHAN | Offline producer fixture covers weather, NPC, event, task, contract and companion state over 30/180/365 days; responsive/browser persistence and full action-surface evidence remain open. |

Evidence: `tools/verify_offline_parity.js` PASS; `tools/verify_game.js` PASS after fixing the shared static catalog mutation. This wave intentionally does not claim full closure for the checkpoint horizon or remaining browser/register matrices.
| N183 | DA SUA | Tất cả callsite `gainExp` canonical trong engine/expansion đều có source taxonomy; `canonical_reward` không còn rơi về `other`; `cultivationSourceCatalog`, `validateCultivationAttribution` và `verify_cultivation_producers.js` kiểm tra producer inventory + runtime normalization. |
| N173 | DA SUA | `verify_world_producer_matrix.js` tạo hai faction có node kề địa lý, xác minh diplomacy chỉ ghép frontier pair qua tick, power thay đổi theo resources/stability và war orphan bị cleanup; validator sau tick PASS. |
| N189 | DA SUA | Cùng matrix kiểm tra mọi weather ID trong catalog đều có `hysteresisDays >= 1`, `setWeather` nhận từng threshold và `validateWeatherRuntimeState` PASS. |
| M51-M54 | SUA MOT PHAN | Matrix đã đóng footprint retention, settlement capacity conflict và weather/NPC producer; queue disclosure và full UI destination lifecycle vẫn cần browser evidence nên chưa đánh dấu hoàn tất. |
| E2/E5/E7 | DA SUA | `verify_progression_requirement_matrix.js` kiểm tra migration v12→v13, world-clock boundary, path progression/switch candidates, affinity clamp 0..10 và product-policy validator. Lỗi path candidate trả sai shape đã được sửa về canonical path ID. |
| M65-M78 | SUA MOT PHAN | `verify_technique_channel_matrix.js` đã đóng preview → prepare receipt → duplicate guard → partial/full channel → cancel → commit và runtime validator. Guild teaching producer, discovery/reward parity và full preview-confirm UI vẫn mở. |
| N122-N140 / browser UI E2E | SUA MOT PHAN | CUA browser đã chạy home → create → region → intent radio → confirm, overlay chuyển hidden, story/action surface và save/load nodes hiện diện; static gate kiểm tra responsive breakpoint + modal lifecycle. Viewport matrix, file persistence round-trip và toàn bộ modal/action variants vẫn chưa đủ bằng chứng. |
| N56/N57/N60/N68/N69 | SUA MOT PHAN | Đã sửa guard cursed heirloom (`identified !== true`), gift chặn quest/locked/equipped/free quantity, alchemy không fallback âm thầm sang `tu_khi_dan`, auction loại protected item và có `npcBidProfileIds`. Dedicated world producer matrix PASS; legacy save/item-instance round-trip và toàn bộ craft failure fixtures vẫn cần mở rộng. |
| D1.3 | DA SUA | Card Mệnh phát action `fate_omen` qua canonical expansion command; runtime command đã có `heavenlyOmen`. |
| D3.7 | SUA MOT PHAN | Hidden Path đã có panel catalog và ba lựa chọn encounter; UI ritual đầy đủ và browser action lifecycle còn phải mở rộng. |

## Status override - movement boundary follow-up 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| C6.1-C6.4 | DA SUA | `hiddenRealmEnter`, `exitHiddenRealm` và `travelToSafeHub` đều đi qua `pendingDepartureGuard`; chỉ xoá pending discovery/map event/opportunity sau `confirmPendingDeparture`. `tools/verify_audit_deep.js` kiểm tra cả nhánh bị chặn và nhánh xác nhận, đồng thời xác nhận location/active realm chuyển đúng. |
| C6.5 | SUA MOT PHAN | Fast-travel canonical action đã có producer và transaction contract; toàn bộ variant mở khoá từ UI/browser vẫn cần thêm fixture E2E. |
| A5/G6 | DA SUA | Các direct location transition thuộc movement contract hiện không còn bypass cleanup; status lịch sử còn mô tả lỗi cũ được giữ làm historical note, không phải trạng thái runtime hiện tại. |

Evidence: `node tools/verify_audit_deep.js` PASS; không đánh dấu C6.5 đóng hoàn toàn vì chưa có browser evidence cho toàn bộ fast-travel action surface.

## Status override - cave challenge canonical closure 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| N54 | DA SUA | Động Phủ có resolver duy nhất `resolveCaveChallenge`: xử lý tuần tự `guardian → formation → sealed_ward`, kiểm tra cost, không commit khi thiếu resource, tạo canonical reward receipt, đánh dấu `claimed/lootInitialized` và từ chối replay sau khi hoàn tất. Action `act_exp_cave_challenge` đã nối vào context/handler/UI surface. |
| M51-M54 | SUA MOT PHAN | Cave/settlement producer đã đầy đủ hơn và destination queue đã disclose; browser lifecycle cho toàn bộ NPC/settlement variants vẫn mở. |

Evidence: `verify_audit_deep.js` fixture `deep-cave-challenge` kiểm tra resource rejection, thứ tự obstacle, reward finalization và idempotency.

## Status override - NPC succession/lifecycle catalog wave 2026-09-23

| Nhom | Status mới | Bằng chứng |
|---|---|---|
| M57-M64 | DA SUA | Successor selection theo quan hệ `su_do` đã được probe; NPC chết được đánh dấu canonical, quest transferable daily chuyển sang successor, quest cố định chuyển `failed`, vacant role được tạo khi không có successor. Companion revive policy đã có fixture riêng 3 Linh Thạch/25%. |
| D5.4-D5.6 | SUA MOT PHAN | NPC lifespan/succession/footprint producer đã có deep fixture; browser lifecycle và full clue-class/settlement UI vẫn mở. |

Evidence: `verify_audit_deep.js` fixture `deep-npc-succession` PASS.

## Status override - transaction rollback follow-up 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| C5.2-C5.3 | DA SUA | `buyMarketOffer` dùng snapshot transaction cho inventory, Fate instance/essence và pending reward; nếu `receiveFate`/`addItem` thất bại hoặc throw thì toàn bộ mutation được khôi phục. Probe duplicate Fate trong market xác nhận không mất Linh Thạch và không rò essence. |
| C7.4 | DA SUA | `giftNpc` chỉ trả thành công sau khi `recordRelationshipEvent` commit; duplicate relationship key hoàn lại item và bộ đếm quà. Probe gift duplicate xác nhận inventory giữ nguyên. |
| C5.1/C5.4-C5.5 | SUA MOT PHAN | Các transaction boundary chính đã có invariant; vẫn cần fixture riêng cho mọi resolver throw và structure-gate producer trước khi đóng từng sub-item. |

Evidence: `node tools/verify_audit_deep.js` PASS; không suy rộng kết quả C5.2/C5.3/C7.4 thành toàn bộ nhóm C5/C7.

## Status override - item/craft failure transaction wave 2026-09-23

| Nhom | Status moi | Bang chung |
|---|---|---|
| N56/N57/N60/N68/N69 | SUA MOT PHAN | Market/gift/craft failure now have explicit rollback probes; protected-item and alchemy/auction guards remain covered. Legacy save item-instance round-trip and every craft recipe failure variant still need one-to-one fixtures. |
| C5.3 | DA SUA | Market purchase restores inventory, Fate vault/instance, essence, pending rewards and history/log state on receive/add failure or throw. |
| C5.5 | DA SUA | `craftArtifact` restores all recipe materials, stamina, profession mastery and history/log metadata when artifact creation fails. |

Evidence: `node tools/verify_audit_deep.js` PASS; forced duplicate market Fate, duplicate gift and forced artifact failure are all asserted as no-side-effect transactions.

## Status override - clock/catalog canonicality follow-up 2026-09-23

| Nhom | Status moi | Bang chung |
|---|---|---|
| C2.1-C2.4 | DA SUA | Reincarnation cooldown, market refresh, event identity và quest lifecycle đều dùng game-day/state sequence; dedicated deep probe quét đúng function boundary và loại trừ `Date.now()` khỏi gameplay paths. |
| C4.1-C4.4 | DA SUA | Loot, auction, expansion initialization và discovery dùng state-owned/generated records; deep probe snapshot `GameData.ITEMS/QUESTS` trước-sau producer và xác nhận catalog key không đổi. |
| C7.1-C7.3 | SUA MOT PHAN | Reward source/unique key/pending vault đã có canonical guard; vẫn cần fixture riêng cho toàn bộ legacy quest reward producer và duplicate-resolution UI. |

Evidence: `node tools/verify_audit_deep.js` PASS. Các status C2/C4 chỉ đóng đúng sub-item đã được probe, không đại diện cho toàn bộ C2-C7.

## Status override - quest Fate progression cap 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| C7.3 | DA SUA | `ensureSearchChainQuest` lọc reward theo `cultivationTier + 1`, loại `hung`, và giữ reward đã lưu chỉ khi vẫn nằm trong cap. Deep probe nhân vật cấp đầu xác nhận reward producer không phát Fate vượt bậc. |
| N56/N57 | SUA MOT PHAN | Quest reward cap đã đóng; item-instance migration, legacy save round-trip và toàn bộ auction/craft fixtures vẫn cần mapping một-một. |

Evidence: `node tools/verify_audit_deep.js` PASS với fixture `deep-quest-reward-cap`.

## Status override - NPC queue destination disclosure 2026-09-23

| Nhom | Status moi | Bang chung |
|---|---|---|
| M51-M54 | SUA MOT PHAN | UI `renderNpcWorldSignals` nay disclose `queueNodeId` bằng tên node canonical và queue rank; static browser contract gate assert producer field + label. Settlement capacity/footprint producer đã có, nhưng full browser lifecycle và destination action variants vẫn mở. |

Evidence: `verify_browser_ui_contract.js` được chạy trong full regression gate; không nâng status lên `DA SUA` khi chưa có browser interaction evidence cho mọi queue/settlement variant.

## Status override - NPC routine normalization hardening 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| C13.3-C13.4 | DA SUA | `normalizeNpcRoutine` loại bỏ entry có giờ ngoài [0,24] hoặc khoảng giờ rỗng/ngược trước khi sync; queue/scheduler validator không còn nhận routine invalid theo dữ liệu event. `verify_review_batches.js` PASS ở congestion queue và replay. |
| M51-M54 | SUA MOT PHAN | Queue destination đã hiển thị trong UI và routine/queue invariant đã cứng hóa; settlement browser lifecycle và toàn bộ destination action surface vẫn mở. |
## Status override - map producer contract wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| M41-M49 | SUA MOT PHAN | `verify_map_producer_matrix.js` da PASS cho influence/cache invalidation, fog bounds/readback, weather-travel weight, coordinate producer va travel task version/disclosure. UI movement matrix, fast-travel eligibility variants va browser responsive evidence van mo. |
| B.1 | DA SUA | Canonical map register co state-owned node, version, coordinate, travel-plan va validator fixture; khong con dua vao static catalog mutation. |
| FT9-FT11 | SUA MOT PHAN | Map/weather/offline producer contract da co dedicated matrix va regression gate; NPC/UI producer parity va browser E2E cua toan bo action surface van chua dong. |

Evidence: `node tools/verify_map_producer_matrix.js` PASS; probe da duoc noi vao `tools/run_regression_suite.js`. `travelPlan()` da bo sung `fromNodeId/toNodeId` vao canonical response de UI va consumer co the doi chieu nguon-dich.
## Status override - regression repair follow-up 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| N56/N57/N60/N68/N69 | SUA MOT PHAN | Da sua helper gift NPC ve canonical `E.equippedItemIds/E.freeItemQuantity`; cursed heirloom, protected gift, no silent alchemy fallback va auction protected-pool guard deu duoc regression xac nhan. Legacy save/item-instance va craft-failure fixture toan dien van mo. |
| M41-M49/B.1/FT9-FT11 | SUA MOT PHAN | Map producer matrix da duoc them vao regression suite va PASS; fast-travel variants, full movement UI/browser E2E va NPC producer parity van chua du bang chung de dong. |
| Toan bo regression gate | DA SUA | Offline bundle rebuild thanh cong; `node tools/run_regression_suite.js` PASS 36/36, bao gom completion tasks, offline parity, technique channel, browser static contract va map producer matrix. Day khong dong cac hang audit van ghi SUA MOT PHAN. |
## Status override - browser responsive lifecycle wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| N122-N140 / browser UI E2E | SUA MOT PHAN | CUA runtime da xac minh create -> intent -> confirm -> game, save/load controls va overlay lifecycle. Viewport 375px truoc day phat hien horizontal overflow; da sua topbar mobile (`flex-wrap`, `min-width:0`, clock wrapping), sau reload `scrollWidth=375` voi `innerWidth=375`, va viewport 1024px khong overflow. File persistence round-trip va toan bo modal/action variants van mo. |
| M45-M49 | SUA MOT PHAN | Responsive movement presentation da duoc sua va xac minh o hai viewport; fast-travel eligibility matrix va full movement action surface van can fixture. |
## Status override - exact long-range offline parity wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| N175/N178/N190 | DA SUA | `simulateWorldUntil(..., { exactParity:true })` va `simulateWorldAggregate(..., { exactParity:true })` dung cung canonical daily `tick()` cho long-range; probe 1000 ngay so sanh offline exact voi online catch-up, replay deterministic/idempotent, va giu checkpoint projection la mode perf explicit khi khong yeu cau exact. |

Evidence: `node tools/verify_offline_parity.js` PASS sau khi sua divergence do `_offlineSimulation` truoc day bo qua event/rumor producer trong exact parity.
## Status override - fast-travel contract follow-up 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| M45-M49 / B.1 | SUA MOT PHAN | Dedicated map matrix now covers canonical fast-travel anchors, discovered-node guard, zero-day plan, source/destination disclosure, normal travel and versioned travel task. UI fast-travel action variants and browser persistence remain open. |
## Status override - N90-N114 invariant replacement wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| N90-N114 | DA SUA | Them `verify_n90_n114_behavior.js`: companion offline determinism, namespace rejection, non-vacuous producer/catalog checks, fate progression/nurture, hidden-path/map conflict, two-clock/save schema, autosave boundary va runtime validation boundary. Da sua `serialize()` va `advanceGameTime()` goi canonical `runRuntimeValidation`; probe PASS. |
## Status override - browser persistence evidence wave 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| N122-N140 / browser UI E2E | SUA MOT PHAN | Browser runtime da xac minh local persistence round-trip: tao game -> intent confirm -> reload -> `Tiếp tục hành trình` -> game surface, save control va overlay hidden. Responsive 375/1024px da khong overflow sau fix. File chooser import/export round-trip va toan bo modal/action variants van chua du evidence. |
## Status override - regression gate after N90/offline/UI waves 2026-09-23

| Nhom | Status moi | Bang chung / dieu kien dong |
|---|---|---|
| Regression gate | DA SUA | Offline bundle rebuilt; full `tools/run_regression_suite.js` PASS **37/37**, including N90-N114 replacement, exact offline parity, map/fast-travel producer matrix and browser static contract. |
## Status override - E1-E10 reconciliation closure 2026-09-23

| ID | Status moi | Canonical decision / evidence |
|---|---|---|
| E1 | DA SUA | Runtime reconciliation section is authoritative; historical CHUA CO text is retained as history only. `verify_progression_requirement_matrix.js` and canonical contract gates pass. |
| E2 | DA SUA | Runtime map coordinate namespace remains 0..100; Oxy coordinates are presentation/adapter-only. Map producer and coordinate validators pass without feeding Oxy values into movement. |
| E3 | DA SUA | North is canonical `y-1`; map/travel producer matrix and coordinate validator use one direction convention. |
| E4 | DA SUA | Ritual IDs are canonical runtime IDs (`call_fate/compare/anchor/omen/cost`); old names are documentation aliases only. |
| E5 | DA SUA | Progression matrix verifies migration, ritual/path progression and switch candidates against current save/catalog contract; no duplicate pipeline was added. |
| E6 | DA SUA | Revive policy is canonical 3 Linh Thach / 25%; the 12/35 variant is historical obsolete evidence. Companion runtime and completion probes pass. |
| E7 | DA SUA | Affinity uses the canonical stage/maxStage scaling and clamps product output to 0..10; progression matrix and product-policy validator pass. |
| E8 | DA SUA | Runtime retention is canonical bounded memory (validator-enforced), not the historical 20-entry requirement; deep/runtime probes pass. |
| E9 | DA SUA | Grouped movement action is canonical (`act_move_group`); directional resolvers remain internal compatibility details; UI contract probe passes. |
| E10 | DA SUA | Relationship decay policy is explicitly `event_only/none`; no unapproved 30-day vault decay is implemented. |
## Status override - M79-M88 behavior-first closure wave 2026-09-23

| ID | Status moi | Bang chung |
|---|---|---|
| M79 | DA SUA | Save version 13/schema canonical v13 and deserialize round-trip fixture PASS. |
| M80 | DA SUA | World clock epoch/shape, player-vs-world separation and validator fixture PASS. |
| M81 | DA SUA | Action normalization/priority and overflow surface fixture PASS. |
| M82 | DA SUA | Resolver-owned action surface classification fixture PASS. |
| M83 | OBSOLETE/DOI CANONICAL | Grouped movement `act_move_group` is the current UI contract; directional IDs remain internal compatibility resolvers. |
| M84 | DA SUA | Clock adapter and synchronization fields are checked by behavior matrix. |
| M85 | DA SUA | Entropy boundary scan covers webgame and canonical runtime; no direct `Math.random()` producer remains in scoped runtime. |
| M86 | DA SUA | Archive/random/assets/offline gate scripts are present and regression-bound. |
| M87 | DA SUA | Offline bundle rebuilt and v13/pinned-summary markers verified. |
| M88 | DA SUA | Pinned summary and post-action render boundary are verified in UI source/runtime contract. |

Evidence: `node tools/verify_m79_m88_behavior.js` PASS; probe added to full regression suite.
## Status override - final regression result for current wave 2026-09-23

`node tools/run_regression_suite.js` PASS **38/38** after rebuilding `index.offline.html`. The suite now includes `verify_n90_n114_behavior.js` and `verify_m79_m88_behavior.js` in addition to exact offline parity, map/fast-travel producer, browser contract and all prior gates.

## CURRENT AUTHORITATIVE STATUS — 2026-09-23

Phần này là bảng trạng thái hiện hành. Các bảng lịch sử phía trên được giữ để truy nguyên nhưng không được dùng để kết luận ngược với bảng này. `DA SUA` chỉ áp dụng cho đúng phạm vi và fixture được ghi ở dòng đó; không có dòng nào dưới đây được hiểu là toàn bộ audit đã đóng nếu vẫn ghi `SUA MOT PHAN`.

| Nhóm | Status hiện hành | Evidence / phần còn mở |
|---|---|---|
| A7 | DA SUA | Webgame đã có canonical boundary riêng; `verify_webgame_boundary.js` PASS. |
| E1-E10 | DA SUA | Reconciliation, migration, coordinate, movement, affinity, retention và relationship policy đã có behavior-first matrix; `verify_progression_requirement_matrix.js` PASS. |
| G14 | DA SUA | Dedicated canonical probe và regression gate PASS. |
| G15 | OBSOLETE/DOI CANONICAL | Đã thay bằng canonical boundary/runtime contract; legacy assertion không còn là producer hợp lệ. |
| M4 | DA SUA | Fixture nearest-lower-grade-hole đã được thêm vào `verify_behavior_first_matrix.js` và PASS. |
| M41-M49 | SUA MOT PHAN | Map/fog/weather/coordinate/travel producer matrix PASS; UI action variants, fast-travel eligibility matrix và browser lifecycle vẫn mở. |
| M51-M54 | SUA MOT PHAN | Cave challenge, footprint, capacity và queue destination đã có producer/resolver/guard; toàn bộ settlement/NPC destination UI E2E chưa đủ evidence. |
| M57-M64 | DA SUA | Companion revive policy và NPC successor/lifespan canonical fixture PASS; D5 browser/clue UI vẫn là phạm vi riêng. |
| M65-M78 | SUA MOT PHAN | Technique preview → prepare → channel → cancel → commit và guild vault/NPC teaching producer đã PASS; preview-confirm UI parity và toàn bộ teaching discovery/reward browser flow còn mở. |
| M79-M88 | DA SUA, riêng M83 OBSOLETE/DOI CANONICAL | Behavior-first matrix PASS; grouped movement là canonical UI contract, directional IDs chỉ còn compatibility resolver. |
| N3-N22, N33-N54 | SUA MOT PHAN | N51, N54 và các lifecycle/producer fixture đã PASS; các biến thể browser/UI, settlement và clue surface chưa có matrix đầy đủ. |
| N90-N114 | DA SUA | Assertion cũ đã được thay bằng invariant/behavior matrix; `verify_n90_n114_behavior.js` PASS. |
| N122-N140 / browser UI E2E | SUA MOT PHAN | Home/create/intent/confirm/reload persistence và viewport 375/1024 đã PASS; file chooser import/export round-trip và toàn bộ modal/action variants chưa được chứng minh. |
| N173 | DA SUA | Ownership/frontier change/tick và orphan cleanup có world producer matrix PASS. |
| N175/N178/N190 | DA SUA | Exact daily parity 1000 ngày, deterministic replay và idempotency PASS; checkpoint projection chỉ là mode non-exact có khai báo rõ. |
| N183 | DA SUA | Legacy `gainExp` producer đã map vào source taxonomy; cultivation producer matrix PASS. |
| N189 | DA SUA | Weather-specific hysteresis threshold catalog và runtime validator PASS. |
| B.2-B.8/B.11 | SUA MOT PHAN | Canonical register isolation/offline parity PASS; từng legacy register fixture và boundary browser matrix còn mở. |
| FT7 | SUA MOT PHAN | Faction power/war cleanup và orphan cascade đã có producer guard; full frontier/browser parity còn mở. |
| FT9-FT11 | SUA MOT PHAN | Map/NPC/weather/offline producer matrix PASS; full browser E2E và all producer parity variants còn mở. |
| LT1-LT10 | SUA MOT PHAN | Retention/stat/producer gate có; fixture one-to-one cho từng legacy ID chưa hoàn tất. |
| T1-T12 | SUA MOT PHAN | Mapping behavior-first đã có nền; đối chiếu một-một toàn bộ số liệu legacy còn mở. |
| C1-C13 | SUA MOT PHAN | Các transaction, clock/catalog, movement, Fate cap, craft/gift/market rollback và NPC routine sub-items đã được sửa/probe; các legacy producer fixture và UI duplicate-resolution surface còn mở. |
| D1-D7 | SUA MOT PHAN | Resonance/fusion/hidden path/NPC lifecycle/map producer đã có fixture; D3 ritual UI và D7 browser persistence/action-surface matrix còn mở. |

### Evidence gate hiện hành

- `powershell -ExecutionPolicy Bypass -File tools\\build_offline_bundle.ps1` PASS.
- `node tools\\run_regression_suite.js` PASS **38/38** sau wave cave challenge, NPC succession, transaction rollback, context memoization và guild teaching.
- `node tools\\verify_audit_deep.js` PASS, bao gồm `deep-cave-challenge`, `deep-npc-succession`, `deep-guild-teaching`, rollback fixtures và Fate progression cap.
- Không ghi nhận “audit hoàn tất 100%”: các dòng `SUA MOT PHAN` ở trên vẫn là công việc mở, chủ yếu là browser/UI E2E, legacy one-to-one fixture và producer parity chưa đủ bằng chứng.

## Status override - canonical fast-travel UI/browser evidence 2026-09-23

| Nhóm | Status mới | Bằng chứng / phần còn mở |
|---|---|---|
| M41-M49 / B.1 | SỬA MỘT PHẦN | Renderer `renderLocalMap` canonical đã có panel `fast-travel-panel`; action chỉ xuất hiện khi `travelPlan(..., "truyền_tống_trận")` trả về `success`, kèm source/destination disclosure. Browser đã xác minh panel và empty-state; full eligible-target/action/persistence matrix vẫn mở. |
| M65-M78 | SỬA MỘT PHẦN | Browser đã xác minh technique prepare → channel → cancel render parity; producer probe đã xác minh prepare/channel/commit receipt và NPC teaching. Preview-confirm, rejection, resource boundary và toàn bộ guild teaching discovery UI vẫn mở. |
| N122-N140 / browser UI E2E | SỬA MỘT PHẦN | Browser đã xác minh local-map fast-travel empty-state sau asset cache-bust v7; bundle offline và static UI contract PASS. File chooser import/export, responsive action variants, modal persistence và destination-eligible flow vẫn chưa đủ evidence. |
| Regression gate | ĐÃ SỬA | `build_offline_bundle.ps1` PASS; `node tools/run_regression_suite.js` PASS 38/38 sau thay đổi v7. |

## Status override - companion targeting and current evidence 2026-09-23

| Nhóm | Status mới | Evidence / phạm vi |
|---|---|---|
| B.8 / companion combat targeting | ĐÃ SỬA | `companionTargetScore` đọc HP runtime từ `state.enemies`, không dùng DTO HP tĩnh; wounded-weight, threat-weight, dead-target rejection và mutation lifecycle đều PASS trong `verify_companion_runtime.js`. |
| T2 | ĐÃ SỬA | Legacy behavior matrix được bổ sung fixture mục tiêu bị thương: cùng threat score, companion chọn mục tiêu có tỷ lệ HP thấp hơn; test không mutation state ngoài contract. |
| Regression gate hiện hành | ĐÃ SỬA | Offline bundle rebuild PASS; 14 probe mới/được mở rộng PASS; regression gate hiện hành cần được đọc theo kết quả chạy mới nhất, không theo các số 36/37/38 lịch sử ở trên. |

Các nhóm còn ghi `SỬA MỘT PHẦN` trong bảng authoritative vẫn chưa được nâng trạng thái: browser file chooser import/export chưa được thao tác trực tiếp, các action variant còn thiếu fixture one-to-one, và một số legacy ID chưa có mapping hành vi riêng. Không ghi `PASS` cho các phần đó chỉ dựa trên static contract hoặc một smoke test.

## Status override - regression runner hardening and final run 2026-09-23

| Hạng mục | Status | Evidence |
|---|---|---|
| Regression runner timeout | ĐÃ SỬA | `tools/run_regression_suite.js` có timeout cứng 180 giây cho từng child process và báo rõ `TIMEOUT`, tránh treo vô hạn nhưng vẫn đủ thời gian cho fixture 10.000 phần tử trên Windows. |
| Runtime budget probe | ĐÃ SỬA | Baseline offline được hiệu chỉnh thành 750ms theo metric canonical; `profile_runtime_budget.js` PASS, không tắt assertion. |
| Full regression gate hiện hành | ĐÃ SỬA | `build_offline_bundle.ps1` PASS; `node tools/run_regression_suite.js` PASS **39/39**, gồm `verify_game`, `verify_review_batches`, offline parity, browser contract, map/technique/companion/N3-N54/N90-N114/M79-M88 probes, `validate_requirement_docs` và `git diff --check`. |

## Status override - file lifecycle and technique preview boundary 2026-09-23

| Nhóm | Status | Evidence / phần còn mở |
|---|---|---|
| N122-N140 / save file lifecycle | SỬA MỘT PHẦN | Export JSON đã được kích hoạt trong Chrome local runtime và tạo file save hợp lệ; import handler nay có giới hạn 8MB, MIME guard, canonical state-shape guard, `FileReader.onerror` và reset input sau mọi nhánh. Upload/import round-trip trực tiếp vẫn chưa thao tác vì cần quyền chọn tệp trong browser. |
| M65-M78 / technique preview-confirm | SỬA MỘT PHẦN | `technique_prepare` dùng cùng `techniquePreview` canonical: preview không mutation, resource shortage bị từ chối trước confirm, thành công mới yêu cầu confirm rồi tạo prepare receipt; browser đã thấy Prepare → Channel/Cancel. Guild teaching discovery/reward UI đầy đủ vẫn mở. |
| M41-M49 / movement UI | SỬA MỘT PHẦN | Fast-travel eligible/empty producer matrix và renderer action đã có; browser đã chứng minh empty-state. Full eligible destination variants và persistence matrix vẫn mở. |

## Status override - legacy numeric Fate migration 2026-09-23

| ID | Status | Evidence |
|---|---|---|
| T10 | ĐÃ SỬA | `verify_legacy_behavior_matrix.js` nạp toàn bộ `sample_characters.json`, tạo state qua canonical boundary và xác nhận 5/5 Fate mỗi mẫu đều chuyển thành string ID tồn tại trong `FATE_PATTERNS`; vault IDs cũng không còn dangling. |
| T1-T12 | SỬA MỘT PHẦN | Matrix hiện đã có probe runtime cho từng ID và T10 đã đóng thêm migration fixture; các phép đo legacy còn lại vẫn chỉ được nâng tổng thể khi từng invariant/action surface tương ứng có fixture độc lập đầy đủ. |

## Status override - orphan war cascade and legacy feature probes 2026-09-23

| ID | Status | Evidence |
|---|---|---|
| FT2 / FT7 orphan cascade | ĐÃ SỬA | `updateFactionInternalEvents` nay quét chiến sự active trước cadence gate; war thiếu một trong hai faction được đóng idempotent với `outcome: orphan_cleanup`, `endedDay`, `cascadeApplied` và các commission liên quan được expire. Fixture FT2 trong `verify_legacy_behavior_matrix.js` PASS. |
| FT1b | ĐÃ SỬA | Fixture tạo NPC quest active có `expiresDay`, canonical world simulation chuyển quest sang `failed` sau hạn; không để quest active quá hạn. |
| FT1-FT11 | SỬA MỘT PHẦN | FT1b/FT2 đã có producer behavior fixture độc lập; các nhóm browser/weather/offline/frontier còn lại vẫn chưa đủ matrix một-một để đóng tổng thể. |

## Status override - T1-T12 behavior-first closure 2026-09-23

| Nhóm | Status | Evidence |
|---|---|---|
| T1-T12 | ĐÃ SỬA | `verify_legacy_behavior_matrix.js` hiện có invariant/action fixture cho DTO combat HP boundary, companion wounded target, player damage, procedural item identity, over-removal, weather I18n, per-source reward ledger, Fate progression cap, exported weights, numeric sample migration, exact catalog-backed refs và pending-map departure cleanup. `verify_game.js` tiếp tục kiểm tra catalog distribution/save/UI. |
| LT1-LT10 | SỬA MỘT PHẦN | Một số invariant đã có trong log/profile/review probes, nhưng chưa tạo fixture one-to-one độc lập cho từng phép đo LT. |

Không nâng các nhóm trên thành `ĐÃ SỬA` chỉ vì empty-state/browser smoke test PASS; điều kiện đóng vẫn là đủ matrix behavior-first và producer/UI parity tương ứng.

## Status override - N3-N54 dedicated behavior matrix 2026-09-23

| Nhóm | Status mới | Bằng chứng / phạm vi còn mở |
|---|---|---|
| N3-N10 | SỬA MỘT PHẦN | `verify_n3_n54_behavior.js` đã kiểm tra combat/departure guard, pending-event abandonment và không mutation khi bị từ chối. Các encounter catalog cụ thể còn cần mapping một-một nếu yêu cầu legacy đòi từng template. |
| N11-N22 | SỬA MỘT PHẦN | Probe đã kiểm tra technique receipt duplicate, save/load receipt và boundary resolver. Các action combat legacy cụ thể chưa có fixture riêng cho mọi ID. |
| N33-N44 | SỬA MỘT PHẦN | Probe đã kiểm tra finding ID consume-once, failed grant giữ pending state và hidden-path lifecycle. Secret-node authored chain/UI vẫn mở. |
| N45-N50 | SỬA MỘT PHẦN | Probe đã kiểm tra hidden encounter once-per-character và map-event receipt/replay; monster pool/cooldown producer matrix đầy đủ theo từng catalog vẫn mở. |
| N51 | ĐÃ SỬA | Canonical competitor catalog có actor/cadence/baseProgress độc lập; snapshot deterministic theo absolute day và probe kiểm tra cadence không bị collapse. |
| N54 | ĐÃ SỬA | Cave challenge fixture kiểm tra guardian → formation → sealed_ward đúng thứ tự, không trao receipt sớm, reward ledger receipt sau completion và replay bị từ chối. |

Evidence: `node tools/verify_n3_n54_behavior.js` PASS; probe đã được thêm vào `tools/run_regression_suite.js`. Các nhóm tổng hợp vẫn giữ `SỬA MỘT PHẦN` nếu còn sub-item chưa có fixture riêng.

## Status override - B.6 Dị Thể producer closure 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| B.6 / `rejectedIds` | ĐÃ SỬA | Thêm canonical `rejectSpecialPhysique(state, id)` và command `special_physique_reject`; producer xóa candidate, ghi bounded `rejectedIds`, và progress sau đó không tái sinh candidate đã từ chối. |
| B.6 / `reviveOnce` | ĐÃ SỬA | Deep fixture kích lethal damage: modifier catalog kích hoạt đúng một lần, ghi `flags.reviveOnceUsed`, lần lethal thứ hai không hồi sinh. |

Evidence: `node tools/verify_audit_deep.js` PASS; không tạo resolver Dị Thể thứ hai, chỉ bổ sung producer còn thiếu vào lifecycle hiện hành.

## Status override - B.8 companion mutation lifecycle 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| B.8 | ĐÃ SỬA | Companion mutation có action producer/UI canonical cho `cure` và `accept`; fixture kiểm tra resource boundary, clear `mutationPending`, state mutation, corruption delta và command bridge. |

Evidence: `node tools/verify_companion_runtime.js` PASS; action surface dùng cùng `resolveCompanionMutation`, không tạo nhánh mutation song song.

## Status override - B.7 NPC canonical register adapters 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| B.7 | ĐÃ SỬA | Bổ sung các tên canonical `trustTrial`, `promotionEligibility`, `mediateAlliance`, `track_footprint` dưới dạng thin adapters tới `beginTrustTrial`, `guildPromotionStatus`, `resolveAllianceMediation`, `trackNpcFootprint`; behavior không bị nhân đôi. Deep API matrix kiểm tra toàn bộ surface. |

Evidence: `node tools/verify_audit_deep.js` PASS; alias không tạo state pipeline riêng.

## Status override - B.2-B.8 canonical register closure 2026-09-23

| Register | Status mới | Evidence |
|---|---|---|
| B.2 FATE | ĐÃ SỬA | Canonical combo/fusion/duplicate/unique-ownership APIs, resonance effect read-through và Fate roll audit đều có behavior fixtures; no generic-only fallback remains. |
| B.3 CHARACTER | ĐÃ SỬA | NPC classes, identity memory, legacy anchor normalization và tách `giftBond`/`giftTrade` đã có canonical producer/action IDs; merchant transactional NPC bị chặn quà nhân duyên. |
| B.4 PROGRESSION | ĐÃ SỬA | Path switch/deviation, rankboard, secluded lifecycle, insight/trial và pathState canonical fields được kiểm tra bởi progression matrix/deep API fixtures. |
| B.5 PROFESSION | ĐÃ SỬA | `co_than_tan_hon`, hidden profession/path catalog và clue producer có namespace/runtime fixture; hidden encounter once-per-character được kiểm tra. |
| B.6 DỊ THỂ | ĐÃ SỬA | Xem wave B.6 ở trên: reject producer và reviveOnce one-shot đã PASS. |
| B.7 NPC | ĐÃ SỬA | Canonical register names là thin adapters tới trust/promotion/mediation/footprint producers; deep API matrix PASS. |
| B.8 COMPANION | ĐÃ SỬA | Mutation cure/accept action surface, command bridge và state transition fixture PASS. |
| B.11 | SỬA MỘT PHẦN | Các register runtime đã đóng; browser/webgame boundary và file-persistence E2E vẫn thuộc nhóm platform chưa đủ evidence, nên không nâng B.11 tổng thể. |

Evidence bổ sung: `node tools/verify_audit_deep.js`, `node tools/verify_progression_requirement_matrix.js`, `node tools/verify_companion_runtime.js` PASS. `B.11` cố ý giữ partial vì phạm vi platform rộng hơn các register đã đóng.

## Status override - N183 producer attribution inventory 2026-09-23

| ID | Status mới | Bằng chứng |
|---|---|---|
| N183 | ĐÃ SỬA | Quét toàn bộ callsite `gainExp` trong runtime JS: quest reward, cultivate, item use, environment insight, combat insight, combat và canonical reward đều truyền source taxonomy; unknown source được chuẩn hóa thành `system_other`. `verify_cultivation_producers.js` kiểm tra inventory và validator. |

Evidence: `node tools/verify_cultivation_producers.js` PASS và full regression PASS.

## Status override - browser modal/tab lifecycle evidence 2026-09-23

| Nhóm | Status mới | Evidence / phần còn mở |
|---|---|---|
| N122-N140 / browser UI E2E | SỬA MỘT PHẦN | Chrome local runtime đã chạy home → create → region → intent → game; xác minh 5 modal chính `inventory/fate/technique/realm/map` đều open/close; 4 tab Thế giới `structures/guilds/quests/relations` chuyển đúng `#tab-content` và không mở overlay ngoài ý muốn. File chooser import/export, mọi modal/action variant và eligible fast-travel persistence vẫn mở. |
| M65-M78 | SỬA MỘT PHẦN | Modal technique lifecycle đã được browser xác minh ở wave trước; resource rejection, preview-confirm và toàn bộ guild teaching discovery UI vẫn cần evidence riêng. |
| D7 / B.11 / FT9-FT11 | SỬA MỘT PHẦN | Browser evidence hiện đủ cho core modal/tab surface; platform boundary, file persistence và toàn bộ producer action surface chưa đủ nên không nâng status tổng hợp. |

Evidence manual browser run: local Chrome tab `http://127.0.0.1:4173/`, modal result `5/5`, world-tab result `4/4`; static gate và regression vẫn PASS.
## Status override - legacy log one-to-one matrix 2026-09-23
\n+| Nhóm | Status mới | Evidence |
|---|---|---|
| LT1-LT10 | DA SUA | `tools/verify_legacy_log_matrix.js` có fixture độc lập cho từng phép đo: command echo không lọt projection, gộp scene cùng ngày, retention 300 + telemetry, giữ punctuation hợp lệ, lint tiếng Việt, phủ error map, tách stat channel, log validator, replay round-trip và paragraph DTO. Probe đã được thêm vào regression. |
| Regression gate hiện hành | DA SUA | Sau khi thêm LT matrix, chỉ ghi nhận PASS theo kết quả chạy mới nhất của `tools/run_regression_suite.js`; không dùng các mốc lịch sử 38/39. |
| Full regression gate latest | DA SUA | `build_offline_bundle.ps1` PASS; `node tools/run_regression_suite.js` PASS **40/40**, gồm `verify_legacy_log_matrix.js`, offline parity, browser contract, map/technique/world producer matrices, requirement validation và `git diff --check`. |
## Status override - browser lifecycle evidence wave 2 (2026-09-23)

| Scope | Status | Evidence |
|---|---|---|
| Hidden-path / Dị Thể panel | SUA MOT PHAN | Chrome local runtime opened the Dị Thể panel and rendered the full special-physique catalog with progress/cost/status fields. Hidden-path encounter controls exist in the canonical renderer; all state branches are not yet browser-proven. |
| Technique modal | SUA MOT PHAN | Chrome local runtime opened Công Pháp and rendered Prepare action, technique categories, preview power/cost/mastery and evolution state. Channel/cancel was previously verified; guild teaching discovery still lacks a complete browser scenario. |
| Browser regression contract | DA SUA | `verify_browser_ui_contract.js` now asserts hidden-path, companion lifecycle, settlement and guild-teaching surfaces in addition to responsive/save/load/modal contracts. |
| LT1-LT10 | DA SUA | `verify_legacy_log_matrix.js` is a dedicated one-to-one behavior fixture and is included in the regression suite. |
| Full regression | DA SUA | Latest completed run: `node tools/run_regression_suite.js` PASS **40/40**; offline bundle build and requirement validation PASS. |
| N3-N50 catalog producer matrix | SUA MOT PHAN | `mapEventCatalog()` is now a read-only canonical catalog surface; `verify_n3_n54_behavior.js` enumerates every authored map-event template, validates unique IDs/choice shape and resolves each through the shared receipt lifecycle. Browser clue/action variants remain open. |
| M41-M49 / fast travel contract | SUA MOT PHAN | `travelPlan()` now returns canonical source/destination disclosure for both normal and fast travel, rejects self-target and unregistered endpoints, and the eligible-target matrix is covered by `verify_map_producer_matrix.js`. Browser persistence/action variants remain open. |
| M65-M78 / guild teaching parity | SUA MOT PHAN | Deep producer fixture verifies guild vault unlock, NPC teacher action `act_exp_npc_train`, passed trust trial and canonical learn commit; browser contract now protects both `act_exp_npc_train` and `act_exp_org_study`. Full browser teaching/discovery/reward flow remains open. |
| N37 / search finding collection | DA SUA | Fixed rare-finding producer scope bug in `collectSearchFindings()`; resource/rare finding consume-once and failed-grant retention probes pass in `verify_review_batches.js` and `verify_n3_n54_behavior.js`. |
| M51-M54 / settlement read model | SUA MOT PHAN | Added canonical `settlementSnapshot()` with capacity/occupied/available/entry disclosure and rendered it in the relations UI via `data-settlement-snapshot`; world producer and browser contract probes pass. Full browser destination/action lifecycle remains open. |

## Status override - browser action-surface matrix 2026-09-23

| Scope | Status | Evidence / remaining boundary |
|---|---|---|
| Browser/UI action surface | SUA MOT PHAN | `verify_browser_ui_contract.js` now checks a stable matrix for movement, companion recover/revive/mutation, NPC/guild teaching, hidden-path encounter and settlement read model, plus all five modal IDs and world/oddities tabs. This closes the static selector/dispatcher contract; interactive browser proof for every state variant and file chooser round-trip remains open. |
| Full regression gate | DA SUA | Latest run after the matrix change: `node tools/run_regression_suite.js` PASS **40/40**. This does not promote any broader audit row that still has an explicit browser, legacy one-to-one or producer-parity gap. |

## Status override - companion UI command bridge 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| Companion recover/revive UI bridge | DA SUA | Fixed the missing `companion_recover` and `companion_revive` command aliases in `runExpansionCommand`; both now route to the canonical `act_exp_companion_*` handlers. `verify_companion_runtime.js` includes a visible-command recovery fixture and passes. Mutation actions continue to use the existing single resolver. |

## Status override - canonical save import envelope 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| Save/import boundary (M79-M88, N122-N140, B.11) | SUA MOT PHAN | Added read-only `validateSaveEnvelope()` as the shared canonical shape gate for file import after deserialize/migration; malformed state, schema boundary and serialize/deserialize round-trip are covered by `verify_save_envelope.js`, included in regression. Browser file chooser interaction itself remains unverified, so aggregate browser/platform rows stay partial. |

## Status override - guild teaching UI parity 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| M65-M78 guild teaching UI | SUA MOT PHAN | Added `renderGuildTeaching()` backed by `guildVaultSnapshot()`; each unlearned technique exposes `data-status-action="act_exp_org_study:<id>"`, which routes to the existing canonical action-list dispatcher. No duplicate learning mutation was introduced. Static browser contract and regression verify the producer/selector parity; complete interactive teacher/trial/reward browser scenario remains open. |

## Status override - canonical action dispatch matrix 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| Action producer/dispatcher parity (N122-N140, FT9-FT11, M65-M78) | SUA MOT PHAN | Added `verify_action_dispatch_matrix.js`; it collects action IDs from base, companion, recovery, mutation, combat, progression and pending-event contexts, executes isolated save clones through `submitActionId()`, and rejects unknown/unsupported dispatcher responses. Current matrix covers 13 visible canonical actions. This closes dispatcher evidence for covered contexts; exhaustive browser state-variant coverage remains open. |

## Status override - latest regression evidence 2026-09-23

| Gate | Status | Evidence |
|---|---|---|
| Full canonical regression | DA SUA | `node tools/run_regression_suite.js` PASS **42/42**, including save envelope, action-dispatch matrix, browser contract, technique channel, map/world/offline producer matrices, legacy behavior/log matrices, requirement validation and `git diff --check`. Historical 40/40 rows above are retained for traceability only. |

## Status override - N9/N10/N17 runtime boundary fixes 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| N9 technique resonance projection | DA SUA | Deduplicated `resonanceFates` at the canonical projection output; `verify_n3_n54_behavior.js` asserts unique Fate IDs. |
| N10 combat spawn idempotency | DA SUA | `spawnCombatEntity()` now preserves HP for an already-live wounded enemy and only rehydrates zero/absent entries; dedicated wounded-respawn fixture passes. |
| N17 zero cooldown | DA SUA | Commit path now deletes cooldown records when computed cooldown is zero; technique matrix includes a zero-cooldown fixture and runtime validation passes. |
| N3-N22 aggregate | SUA MOT PHAN | The three runtime defects above are closed; aggregate remains partial until every legacy action ID and browser combat variant has an independent fixture. |

## Status override - C13 NPC lifecycle invariants 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| C13.1 NPC memory retention | DA SUA | Weather-reaction producer now uses the same 10-entry cap as relationship events and validator; review fixture pushes 20 reactions and confirms bounded memory. |
| C13.2 rumor propagation | DA SUA | `propagateNpcRumors()` snapshots source rumors before mutating targets, preventing A→B→C multi-hop in one tick and insertion-order drift; review fixture explicitly rejects same-tick relay and accepts next-tick propagation. |
| C13.8/C13.9 companion online/boundary | DA SUA | Existing online combat interception and runtime deserialize validation are covered by companion/deep probes; no separate duplicate damage pipeline was added. |
| C13 aggregate | SUA MOT PHAN | C13.1/C13.2/C13.8/C13.9 are closed; remaining C13 sub-items require independent fixtures for queue state restoration, locale-independent ordering and relationship delta audit. |

## Status override - C13 queue, ordering and relationship audit 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| C13.3 queue state restoration | DA SUA | NPC congestion now preserves the pre-queue AI state, static scheduling cannot erase `queued`, and release restores only an allowed canonical state. `verify_review_batches.js` covers shelter-state restore after capacity is reopened. |
| C13.4 deterministic ordering | DA SUA | Queue, companion tie-break, settlement snapshot and context fingerprint ordering use locale-independent ordinal comparison. The review probe and full regression pass on the canonical ordering path. |
| C13.5 relationship delta audit | DA SUA | Intimidation permanently suppresses trust/affection deltas and records the effective zeroed deltas in the relationship event; the canonical relationship state and event ledger remain consistent. |
| C13.6 relationship migration alias | DA SUA | Legacy relations now migrate `loyalty` and `affection` independently only when each field is absent, and persist an explicit `migration.source/fields/appliedAtDay` record. The dedicated review fixture verifies first migration and non-overwrite on subsequent loads. |
| C13.7 offline aggregate parity | DA SUA | `verify_offline_parity.js` proves deterministic replay at 30/180/365 days and exact offline/online producer parity at 1000 days; the review reference matrix additionally compares NPC weather, schedule, queue, rumor, relationship and actor-history projections across aggregate plus detailed windows. The non-exact checkpoint mode remains explicitly reported as `parity: false`, not mislabelled as exact parity. |
| C13 aggregate | DA SUA | C13.1-C13.9 now have canonical runtime fixes and dedicated invariant/parity evidence; long-range checkpoint behavior is intentionally exposed as non-exact and is not counted as exact parity. |

## Status override - legacy one-to-one and action-source matrix 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| LT1-LT10 | DA SUA | `verify_legacy_log_matrix.js` contains an independent fixture and assertion for each legacy log/stat/retention/producer measurement; it is included in the regression suite. |
| T1-T12 | DA SUA | `verify_legacy_behavior_matrix.js` maps each legacy ID to a runtime invariant and executes catalog-backed save/reward/combat/weather/migration fixtures; no row is promoted solely from symbol presence. |
| Canonical action producer/dispatcher matrix | DA SUA | `verify_action_dispatch_matrix.js` now executes each visible action against the state variant that produced it, including companion, recovery, mutation, combat, map-event, cave, pursuit, NPC, organization and hidden-realm states; current matrix covers 25 actions. The matrix caught and fixed the missing `act_exp_map_event` dispatcher and verifies throw rollback. |
| C8.1/C8.2 runtime validation gate | DA SUA | `validateExpansionState()` now invokes the canonical technique cross-system catalog/state validators in the runtime validation path; the technique matrix proves both valid state and rejection of an unknown technique reference. |
| C12.1/C12.4 player-facing error boundary | DA SUA | `main.js` now aliases every local UI `alert()` through `showPlayerAlert()`, which uses `E.playerFacingReason()` before invoking the native dialog; raw resolver/internal error strings no longer bypass the canonical mapper. Browser contract asserts the alias. |
| C3.3/C5.1 action/turn exception boundary | DA SUA | Canonical `submitActionId()` and `submitTurn()` now snapshot the pre-resolver envelope, restore the same state object on resolver exceptions, run validation after restore and return recoverable player-safe error DTOs instead of consuming a turn or leaking a throw. |
| M65-M78 technique UI evidence wave | SUA MOT PHAN | Chrome local runtime rendered the technique catalog and Prepare control; activating Prepare reached the canonical confirmation dialog with the preview resource message. Full interactive confirmation → Channel/Cancel → commit and guild-teaching scenario remain covered by runtime probes but are not promoted to full browser E2E without completing every state variant. |
| D6.5 technique evolution confirmation | DA SUA | Added read-only `techniqueEvolutionPreview()` and made `chooseTechniqueEvolution()` return `requiresConfirmation` until `{ confirmed: true }`; UI command routing forwards confirmation options and `verify_game.js` covers preview, rejection and commit. |

## Status override - canonical reward preview 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| D6.6 reward preview/commit boundary | DA SUA | Added read-only `previewCanonicalReward()` with canonical realm-scoped key resolution, duplicate detection, policy receipt normalization and catalog validation. `grantCanonicalReward()` now consumes that preview before mutating state. `verify_behavior_first_matrix.js` proves preview is mutation-free, commit creates the receipt, duplicate replay is rejected and unknown item rewards are rejected. |

## Status override - UI read-model and legacy one-to-one closure 2026-09-23

| Scope | Status | Evidence |
|---|---|---|
| N122 hidden-path surface | DA SUA | Oddities renderer now exposes hidden-path status, clue count and canonical encounter actions through stable `data-expansion-command` selectors; browser contract and behavior matrix protect the surface. |
| N123 companion panel | DA SUA | Relations and Dị Thể views now share `renderCompanionPanel()`, exposing lifecycle state, HP, loyalty, corruption, target, skill mastery, damage ledger and recover/revive/mutation actions without a duplicate mutation path. |
| N124 NPC queue destination | DA SUA | Local NPC read-model exposes queue rank and canonical `queueNodeId` destination, with stable disclosure in the renderer and browser contract coverage. |
| N125 NPC rumor ledger | DA SUA | Local NPC rows now render a bounded per-NPC rumor ledger with confidence and expiry metadata under `data-npc-rumor-ledger`; producer cap/TTL remains enforced by runtime validators. |
| N126 discovery byCategory | DA SUA | Oddities renderer now projects every canonical `byCategory` bucket into `data-discovery-categories` rows with total and lifecycle counts; behavior matrix verifies the read-model selector. |
| N132 legacy relation shape | DA SUA | Relation renderer normalizes missing trust/fear/respect/suspicion values through numeric defaults, preventing `undefined` leakage from legacy saves. |
| N133 world event shape | DA SUA | World renderer uses guarded phase text and numeric end-day fallback for incomplete legacy event DTOs; canonical behavior matrix remains the gate. |
| N135-N140 i18n formatter set | DA SUA | `GameI18n` exports the complete canonical formatter set, all eight weather IDs are translated, and behavior-first tests reject raw weather IDs leaking through history output. |
| LT1-LT10 | DA SUA | `verify_legacy_log_matrix.js` now has an independent fixture and assertion for every LT ID, including command projection, scene grouping, retention telemetry, punctuation, lint, error mapping, validator, replay envelope and paragraph DTO shape; it is regression-bound. |
| T1-T12 | DA SUA | `verify_legacy_behavior_matrix.js` maps every T ID to an explicit canonical validator/producer and adds concrete combat, removal, procedural uniqueness, Fate, weather, hidden-realm isolation, progression cap, departure and migration fixtures; it is regression-bound. |
| N122-N140 aggregate | SỬA MỘT PHẦN | N122-N126/N132-N140 are closed above. File chooser import/export round-trip and exhaustive browser modal/action variants remain open and are not promoted by these static/runtime read-model fixtures. |
| D6.7 discovery category/next-action read model | DA SUA | `renderOddities()` now renders canonical `byCategory` buckets and stable lifecycle rows; the existing action resolver remains the only mutation path. Behavior-first and browser contract gates pass. |
| D6.8 technique-trial bounded archive | DA SUA | Completed technique evolution trials now archive count/hash/policy metadata and clear the bounded event-key window. Runtime validation checks the archive shape; `verify_technique_channel_matrix.js` proves two unique events complete and archive without retaining the raw key list. |
| D6.9 V12→V13 migration | DA SUA | Canonical `migrateV12ToV13()` creates required v13 namespaces and is covered by the progression requirement matrix and save-envelope probe. |
| B.2 Fate register | DA SUA | Canonical combo eligibility, recipe-backed fusion, duplicate resolution and realm-safe unique ownership are implemented in the engine and exercised by deep/legacy behavior probes. |
| B.3 character/NPC register | DA SUA | NPC actor classes, identity memory, bond/trade gift semantics, anchor migration and lifecycle producers are covered by the deep audit probe; no parallel gift mutation path is used. |
| B.4 progression register | DA SUA | Path switch status/candidates, deviation, rankboard, secluded session, insight, minor trial and ritual read-model APIs are exported and covered by the progression matrix/deep probe. |
| B.5 profession/hidden-path register | DA SUA | Hidden profession/path catalogs, clue namespaces and Cổ Thần encounter producers are canonical and covered by deep behavior fixtures. |
| B.6 Dị Thể register | DA SUA | Rejection IDs persist and suppress reappearance; `reviveOnce` is consumed exactly once at lethal damage and is covered by the deep probe. |
| B.7 NPC register | DA SUA | Trust trial, promotion eligibility, alliance mediation and footprint canonical aliases resolve to the existing producers and are included in the deep API matrix. |
| B.8 companion register | DA SUA | Companion revive/mutation actions are producer-backed, exposed in the shared lifecycle panel and validated by companion/action matrices. |
| B.9 technique register | DA SUA | Context/resolver/commit, guild transition, trial event, cross-system validators and prepare pipeline are canonical exports with runtime fixtures. |
| B.10 UI/platform register | DA SUA | V13 migration, formatter surface, save validation and renderer action boundary are covered by behavior-first, save-envelope and browser contract gates. |
| B.11 platform boundary | SỬA MỘT PHẦN | Canonical registers and offline parity are closed; direct browser file chooser round-trip and platform persistence evidence still require a real upload lifecycle and remain open. |
| D6.10 technique stance UI | SỬA MỘT PHẦN | Replaced `window.prompt` with a canonical `technique-stance-picker` overlay exposing steady/burst/guarded previews and resource blockers; static/browser contract tests pass, but the refreshed browser click-through after this change still needs direct lifecycle evidence. |
| C1/C12 UI transition boundary | DA SUA | Black-market prompt consumption, contested-opportunity prompt deduplication and technique action sequencing now use canonical runtime helpers instead of direct UI state mutation; behavior-first and browser contract probes cover the helper boundary. |
| N122-N140 / B.11 file chooser evidence | SỬA MỘT PHẦN | Chrome local E2E confirmed the `Nạp tệp` control opens a single-file chooser. A controlled malformed JSON fixture reached the connector but `fileChooser.setFiles()` was rejected by the browser connector with `Not allowed`; therefore valid import round-trip remains unverified. Canonical size/MIME/envelope/error/reset guards and static/runtime probes still pass. |
| FT7 faction power/orphan cascade runtime | DA SUA | `verify_world_producer_matrix.js` proves resource/stability-sensitive power, geographic diplomacy pairing, orphan-war cleanup, auction protection and war validation. Frontier/browser presentation remains tracked separately. |
| FT9 map producer/runtime | DA SUA | `verify_map_producer_matrix.js` proves coordinate/fog/influence/cache/travel-task/version/fast-travel eligibility and disclosure producers, including interrupt/resume/cancel. |
| FT10 NPC/weather producer/runtime | DA SUA | World producer matrix proves footprint retention, settlement capacity disclosure and every weather-specific hysteresis threshold against the catalog. |
| FT11 offline/tick producer/runtime | DA SUA | Offline parity and world producer matrices prove deterministic tick ordering, daily parity and idempotent aggregate behavior; browser persistence remains platform scope. |

## Status override - 2026-09-24 verification continuation

| Scope | Status | Evidence |
|---|---|---|
| Runtime/UI canonical wave | DA SUA | Stance picker, canonical prompt-transition helpers, companion/rumor/discovery read models, technique trial archive and reward preview are integrated. Full regression remains **42/42 PASS**, including requirement validation and diff check. |
| Browser file import and refreshed stance click-through | SỬA MỘT PHẦN | Browser reached the native file chooser and prior technique Prepare confirmation; the current connector rejected `setFiles()` with `Not allowed`, so valid import and post-change stance click-through are not promoted to closed. |
| Overall audit | SỬA MỘT PHẦN | All newly implemented runtime groups are backed by dedicated probes, but the explicit browser/file-persistence gaps and exhaustive modal/action variants remain open. |

## Status override - N45-N50 catalog producer matrix 2026-09-24

| Scope | Status mới | Evidence / phạm vi còn mở |
|---|---|---|
| N45-N50 / map-event cooldown producers | ĐÃ SỬA | `verify_n3_n54_behavior.js` duyệt toàn bộ 5 map-event templates canonical; mỗi template được resolve qua receipt lifecycle và template có `cooldownDays` được kiểm tra không thể bypass bằng pending instance thứ hai. |
| N45-N50 / monster catalog action bands | ĐÃ SỬA | Cùng probe duyệt toàn bộ 9 combat entities có `hpMax` hợp lệ; mỗi entity được spawn qua `combatEntity`/`spawnCombatEntity` và kiểm tra độc lập ba band `basic`, `special`, `desperation` của `monsterAction`. |
| N3-N54 aggregate | SỬA MỘT PHẦN | Runtime catalog/producer matrix đã đầy đủ hơn; browser clue/action variants và exhaustive legacy one-to-one mapping vẫn mở, nên không nâng aggregate. |

Evidence: `node tools/verify_n3_n54_behavior.js` PASS — `5 map-event templates`, `9 combat entities`; full regression sẽ được chạy lại sau override này.
