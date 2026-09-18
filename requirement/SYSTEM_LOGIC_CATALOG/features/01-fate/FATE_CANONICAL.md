# FATE CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\01-core\fate\FATE_ADVANCED_ACTION_NAMESPACE_AND_EFFECT_LEDGER_2026-09-17.md`

# Fate Advanced Actions — Namespace và Effect Ledger — 2026-09-17

## Canonical namespace

Mọi action nâng cao của Mệnh Số dùng `player.fateAdvancedActions`:

- theo instance Mệnh: `nghichMenh`, `tranMenh`, `menhDoi`;
- action toàn cục: `_global.thienCo`.

Mỗi record có `uses` và `effectSource: "advanced_fate_action"`; các field
riêng như `untilTurn`, `cooldownUntil`, `branchId` chỉ là metadata của action.

## Effect isolation

`fateAdvancedEffectBreakdown()` là resolver duy nhất cho effect Nghịch Mệnh.
Enhancement, relationship, evolution và advanced action không được đọc chéo
hoặc cộng lại cùng một record. Trấn Mệnh chỉ suppress Fate trong thời hạn;
Thiên Cơ chỉ lưu cooldown/omen; Mệnh Đổi ghi branch transition, còn effect
branch do Fate evolution resolver sở hữu.

## Save

Canonical serialization lưu `fate.advancedActions`; deserialization khôi phục
về `player.fateAdvancedActions`. Regression kiểm tra action namespace,
suppression/effect breakdown và save round-trip.


### Source: `archive-requirements\logic-history\01-core\fate\FATE_ADVANCED_ACTIONS_CANONICAL_2026-09-16.md`

# FATE ADVANCED ACTIONS CANONICAL — PHASE 3

## Nguyên tắc chống cộng effect hai lần

Base definition, enhancement, relationship, combo và evolution là năm lớp riêng. Resolver trả từng lớp trong `breakdown`; tổng effect chỉ được hợp nhất một lần ở `computeStats`. Action advanced không mutate effect trực tiếp.

## Nghịch Mệnh

- Mục tiêu: trả giá để đổi hướng một effect Mệnh.
- Điều kiện: Mệnh active, relationship tối thiểu, corruption/SAN phù hợp, không đang trial khác.
- Kết quả: tạo `fateAdvancedActions[fateId].nghichMenh` record và modifier conditional; không sửa `FateDefinition`.
- Thất bại: trừ cost đã commit nhưng không tạo modifier; ghi failure history.

## Trấn Mệnh

- Mục tiêu: khóa một tác động bất lợi của Mệnh trong thời hạn.
- Điều kiện: có anchor/ritual và tài nguyên phòng hộ.
- Kết quả: tạo suppression window có `startsAtDay`, `expiresAtDay`, `suppressedEffectKeys`.
- Không cộng điểm tích cực thay cho effect bị khóa.

## Thiên Cơ

- Mục tiêu: xem trước một nhánh/điều kiện Mệnh.
- Là preview thuần, không tiêu hao RNG, không commit state và không tăng relationship.
- Chỉ khi chọn commit mới ghi `insightRevealed`.

## Mệnh Đổi

- Mục tiêu: chuyển một Mệnh active với cost/slot rõ ràng.
- Không xóa instance cũ; chuyển nó về vault hoặc `released` theo lựa chọn.
- Transaction kiểm tra capacity trước khi trừ cost.


### Source: `archive-requirements\logic-history\01-core\fate\FATE_DATA_SOURCE_MAP.md`

# FATE Data Source Map

Audit date: 2026-09-08

## Runtime canonical files

These are the only FATE files loaded by `index.html` in a live game:

| File | Role | Status |
|---|---|---|
| `data/fate_data.js` | 10,000-entry catalog; `window.FATE_DATA` | Canonical runtime |
| `data/fate_relationships.js` | pairwise relationships, combos, fusion recipes; `window.FATE_RELATIONSHIPS` | Canonical runtime |
| `data/path_fate_relations.js` | path/hidden-fate bridge; `window.PATH_FATE_RELATIONS` | Canonical runtime bridge |
| `data/data.js` | consumes the three globals above and exposes `window.GameData` | Runtime aggregator |

`js/engine.js` and `js/ui.js` consume `window.GameData`, `window.FATE_RELATIONSHIPS` and `window.PATH_FATE_RELATIONS`; they do not load the staging JSON files directly.

`luan_hoi_tien` is a hidden profession identifier, not an additional catalog entry. It is resolved through `hiddenFates`/`hiddenProfession` and `path_fate_relations.js`.

## Build and migration sources

| File | Role | Should be loaded by browser? |
|---|---|---|
| `fate_system_update/fate_data_with_tags.json` | staging catalog used by the Phase 3 migration; its fields are merged into `data/fate_data.js` | No |
| `fate_system_update/resonance_effects_v2.json` | staging resonance definitions; merged by `phase3_regrade.js` | No |
| `data/path_fate_relations.json` | source JSON for the runtime bridge and character generator | No, use the JS bridge in browser |
| `fate_system_update/fate_regrade_manifest.json` | immutable Phase 3 ID/grade change manifest | No |
| `fate_system_update/fate_regrade_report.json` | migration audit report | No |
| `fate_system_update/phase3_regrade.js` | controlled migration and relationship-tier rewrite | No |
| `fate_system_update/grade_sign_maps.js` | helper/reference map for data QA | No |
| `tools/generate_fates.js` | legacy procedural generator; not part of runtime | No |
| `tools/generate_fates_from_json.js` | legacy source importer; not part of runtime | No |

## Backups and review-only files

`fate_system_update/backups/phase3-20260908/` is rollback-only. The Markdown files, `sample_review.json`, and review/spec documents are documentation or QA inputs, not runtime data.

## Duplicate-function decisions

1. `data/fate_data.js` is the single catalog used by the game. The tagged JSON remains as a migration source so future regrades can be reproduced; it must not be added as another `<script>`.
2. `data/fate_relationships.js` is the single relationship runtime source. No second relationship JSON is loaded by the browser.
3. `data/path_fate_relations.json` and `.js` are intentionally a source/bridge pair, not duplicates: Node tools read JSON, browser runtime reads JS.
4. Legacy generators are retained for historical reproducibility. They must not be run against the live catalog after Phase 3; use `phase3_regrade.js` for controlled changes.

## Verified links

`index.html` loads exactly one file for each runtime group:

```html
data/fate_data.js
data/fate_relationships.js
data/path_fate_relations.js
data/data.js
```

No staging, backup, manifest, or review file is linked into the browser bundle.


### Source: `archive-requirements\logic-history\01-core\fate\FATE_EFFECT_INVARIANT_CANONICAL_2026-09-16.md`

# FATE EFFECT INVARIANT — 2026-09-16

## Canonical layers

Fate effects are resolved as independent layers: base definition, enhancement level, relationship stage, evolution branch, suppression and advanced-action modifiers. No layer mutates the authored Fate definition. The UI/API exposes the layer breakdown; derived stats consume the resolved result once.

## Evolution preview contract

`fateEvolutionPreview(state, fateId, branchId)` must simulate the exact post-commit state:

1. Keep the current `beforeEffects` unchanged.
2. Simulate relationship stage `4` because commit promotes the Fate to Nhân Mệnh Hợp Nhất.
3. Simulate `fateEvolutions[fateId] = { status: "evolved", branchId }`.
4. Apply the selected branch exactly once through `enhancedFateEffects`.

The commit path deducts costs only after eligibility and preview validation. It then writes the branch/status and recalculates derived stats. Preview `afterEffects` and committed `enhancedFateEffects` must be deep-equal.

## Regression gate

`tools/verify_review_batches.js` verifies a Fate at enhancement +5 and relationship stage 3: preview, commit, post-commit effects and evolution score remain consistent. Failed/insufficient-cost commits must not write branch or deduct resources.

## Remaining note

Per-action browser cards for Nghịch Mệnh, Trấn Mệnh, Thiên Cơ and Mệnh Đổi still need visual QA; the effect invariant is enforced in runtime regression.


### Source: `archive-requirements\logic-history\01-core\fate\FATE_GRADE_WEIGHT_BY_LEVEL.md`

# TRỌNG SỐ ROLL MỆNH SỐ THEO CẤP — BỔ SUNG (đọc kèm `FATE_NEW_LOGIC_ADDENDUM.md`)
> Giải quyết đúng vấn đề: pool 10.000 mệnh có 80% là Phàm Phẩm — nếu dùng NGUYÊN kích thước pool
> làm xác suất roll thì nhân vật Cấp 10 vẫn 80% ra Phàm mỗi lần nhận Mệnh, dù lúc này Phàm gần như
> vô dụng. Cần TÁCH BIỆT 2 khái niệm.

---

## 1. TÁCH BIỆT 2 KHÁI NIỆM ĐANG BỊ LẪN

| Khái niệm | Ý nghĩa | Có nên đổi theo Cấp không |
|---|---|---|
| **Kích thước pool** (Phàm 8000/Linh 1500/.../Tiên 1) | Số lượng BIẾN THỂ TÊN GỌI khác nhau có sẵn trong catalog — chỉ để tránh lặp tên khi roll trúng cùng grade nhiều lần | **KHÔNG cần đổi** — giữ nguyên 10.000, đây là kho từ vựng, không phải xác suất |
| **Trọng số roll theo Cấp** (mục 2 dưới đây) | Xác suất THỰC TẾ ra grade nào mỗi lần roll, tại thời điểm nhân vật đang ở Cấp bao nhiêu | **ĐÂY LÀ THỨ CẦN THÊM MỚI** — hiện chưa tồn tại, là nguyên nhân gây cảm giác bất hợp lý mày nêu |

**Cách hoạt động đúng:** khi roll 1 Mệnh Số, engine chọn **GRADE trước** (theo bảng trọng số Cấp ở
mục 2), rồi mới chọn **ngẫu nhiên ĐỀU 1 entry cụ thể trong đúng grade đó** từ pool 10.000 sẵn có.
Pool không đổi, chỉ đổi cách chọn grade trước khi vào pool.

---

## 2. BẢNG TRỌNG SỐ MỚI THEO CẤP (dùng đúng mốc đã có ở nghi thức Đột Phá phân tầng)

| Cấp | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1-2 | 65% | 30% | 5% | 0% | 0% | 0% | 0% | 0% |
| 3-4 | 40% | 35% | 20% | 5% | 0% | 0% | 0% | 0% |
| 5-7 | 15% | 30% | 30% | 18% | 6% | 1% | 0% | 0% |
| 8-10 | 3% | 12% | 25% | 30% | 22% | 7% | 1% | 0% |
| 11-13 | 0% | 3% | 12% | 25% | 30% | 22% | 6% | 0.5% |
| 14 | 0% | 0% | 5% | 15% | 28% | 32% | 19% | 1% |

> Cấp 1-2 GIỮ NGUYÊN đúng bảng gốc đã thống nhất từ đầu (character_creation_system.md) — không đổi
> gì ở giai đoạn khởi tạo nhân vật, chỉ thêm các mốc SAU đó vốn trước đây chưa có bảng nào cả.

**Điểm quan trọng đã sửa sau khi test bằng data thật:** bản nháp đầu tiên đặt `tien` = 5% ở Cấp 14 —
QUÁ CAO so với việc pool `tien` chỉ có ĐÚNG 1 entry duy nhất toàn server (xem mục 4
`FATE_NEW_LOGIC_ADDENDUM.md` — khóa độc bản). Với 5%, Mệnh độc bản đó gần như chắc chắn bị "dùng
hết" chỉ sau vài chục lượt roll của TOÀN SERVER, sau đó mọi người chơi khác roll trúng ô `tien`
sẽ gặp lỗ hổng không có gì để trả. Đã hạ xuống 0.5-1% và thêm cơ chế fallback ở mục 3.

---

## 3. CƠ CHẾ FALLBACK KHI 1 GRADE ĐÃ CẠN/BỊ KHÓA ĐỘC BẢN

```
rollFateForLevel(characterLevel, fatePoolByGrade, availableCountByGrade):
  lấy bảng trọng số theo Cấp (mục 2)
  DUYỆT từ grade cao xuống thấp: nếu grade nào có trọng số > 0 nhưng availableCountByGrade[grade] == 0
  (đã cạn hoặc bị khóa độc bản — tra bảng serverUniqueFateOwnership) -> DỒN trọng số đó sang grade
  liền kề THẤP HƠN gần nhất còn entry khả dụng (không mất trọng số, không roll hụt)
  rồi mới random chọn grade theo trọng số đã dồn, và random đều 1 entry trong grade đó
```
Đã test bằng data thật (script `grade_weight_by_level.js`): giả lập `tien` bị khóa (đã có chủ) ở
Cấp 14 → toàn bộ 1% trọng số dồn đúng sang `thanh`, không bị mất hay lỗi.

---

## 4. VIỆC CẦN LÀM TIẾP
1. Số % ở bảng mục 2 là ĐỀ XUẤT dựa trên logic tiến triển hợp lý — cần cân bằng qua playtest thật,
   đặc biệt đoạn 8-14 vì đây là vùng game có ít dữ liệu tham chiếu nhất.
2. Áp dụng CÙNG 1 bảng trọng số này cho MỌI nguồn nhận Mệnh Số (quest reward, Phường Thị, Cơ Duyên,
   Khâm Thiên Giám...) — không để mỗi nguồn tự định nghĩa 1 bảng riêng, tránh lặp lại đúng vấn đề
   "80% Phàm bất kể ngữ cảnh" ở nơi khác dù đã sửa ở nơi này.
3. `availableCountByGrade` cần tính LẠI mỗi lần roll (trừ những entry đã bị khóa độc bản — hiện chỉ
   áp dụng thật sự cho `tien`, nhưng nên viết tổng quát để dễ mở rộng nếu sau này khóa thêm entry
   khác ở `thanh`/`thien`).

### Source: `archive-requirements\logic-history\01-core\fate\FATE_NEW_LOGIC_ADDENDUM.md`

# MỆNH SỐ — 4 LOGIC MỚI BỔ SUNG (đọc kèm `FATE_SYSTEM_COMPLETE.md` + `FATE_RELATIONSHIP_COMPLETE.md`)
> Phát sinh trong lúc chạy pass sinh dữ liệu thật (tags/element/resonance) — đây là các lỗ hổng
> logic lộ ra khi thao tác trên data thật 10.000 mệnh, không có trong bản spec gốc.

---

## 1. XỬ LÝ MỆNH TRÙNG LẶP (DUPLICATE FATE)

**Phát hiện:** phân bố grade thật là Phàm 8000 (80%)/Linh 1500/Hoàng 250/Huyền 120/Địa 70/Thiên
50/Thánh 9/**Tiên chỉ 1 DUY NHẤT**. Với Phàm/Linh, xác suất roll trùng CÙNG 1 `id` nhiều lần trong
đời chơi là chắc chắn xảy ra (80% pool chỉ có ~8000 lựa chọn cho hàng chục nghìn lượt roll của toàn
server) — nhưng spec/data hiện KHÔNG có quy tắc nào xử lý khi roll trúng 1 `id` mà nhân vật ĐÃ sở
hữu sẵn.

```
onFateRolled(character, fateId):
  existingInstance = character.fates.find(f => f.fateId === fateId)
  if (!existingInstance):
      tạo FateInstance mới bình thường (như đã thiết kế)
  else:
      // ĐÃ sở hữu Mệnh này rồi — không tạo instance thứ 2 (tránh 2 bản y hệt cùng active gây
      // double-dip hiệu ứng phi lý)
      grade = existingInstance's grade
      if grade <= "hoang" (Phàm/Linh/Hoàng — phổ thông):
          convert thành "Tinh Hoa Dư" (Excess Essence) — 1 loại tài nguyên phụ, dùng làm nguyên
          liệu Dưỡng Mệnh (mục 3 FATE_RELATIONSHIP_COMPLETE.md) hoặc Dung Hợp ở Hư Thiên Đỉnh —
          KHÔNG lãng phí hoàn toàn, nhưng cũng không tạo instance trùng vô nghĩa
      if grade >= "huyen" (Huyền trở lên — hiếm):
          KHÔNG tự động convert — hiện popup cho người chơi CHỌN: giữ Tinh Hoa Dư (như trên) HOẶC
          "Tặng/Bán lại" cho NPC/thị trường (Mệnh hiếm trùng có giá trị giao dịch riêng, không nên
          âm thầm quy đổi rẻ mạt)
```
> Riêng grade `tien` (Tiên Phẩm, chỉ 1 entry toàn bộ pool): xem mục 4 — không áp dụng quy tắc trùng
> lặp thông thường vì bản chất đã là độc bản.

---

## 2. GIÁC NGỘ ẨN (FATE WHISPER) — NỐI VỚI NGỘ TÍNH + CẤM KỴ TRI THỨC

**Phát hiện:** mỗi Mệnh có `desc` mô tả 2 khái niệm trừu tượng ghép lại (VD "Thần thánh... kết hợp
với con đường..."), nhưng người chơi thường KHÔNG hiểu tại sao 1 Mệnh lại có tên/hiệu ứng như vậy —
`desc` hiện chỉ hiện dạng thô, không có lớp diễn giải sâu hơn.

```
Field mới: fate.insightRevealed: boolean (mặc định false khi mới nhận Mệnh)

revealInsight(character, fateInstance):
  điều kiện: character.ngoTinh >= 60 HOẶC fateInstance.relationshipStage >= 2 (Tương Ứng)
  khi đủ điều kiện, LẦN ĐẦU xem chi tiết Mệnh trong UI, `insightRevealed` tự chuyển true VĨNH VIỄN
  và mở thêm 1 dòng diễn giải "Giác Ngộ" (sinh từ concept1+concept2 đã parse, KHÔNG phải desc thô):
    VD "Thần Đạo": desc thô "Thần thánh... kết hợp với con đường, quy luật tối cao, tôn giáo" ->
    dòng Giác Ngộ: "Ngươi thoáng hiểu: đây không phải một con đường phàm tục, mà là quy luật vận
    hành của chính tầng trời — sở hữu nó nghĩa là mang theo 1 phần trách nhiệm không thể thoái thác."
```
- Đây là hàm SINH TỰ ĐỘNG (template hóa từ concept1/concept2), không cần soạn tay 10.000 dòng —
  nhưng nên ưu tiên soạn tay cho đúng 130 Mệnh Địa Phẩm+ (đã có concept1/concept2 parse sẵn ở
  `resonance_effects_v2.json`) vì đây là nhóm người chơi sẽ đọc kỹ nhất.
- Nối vào `Cấm Kỵ Tri Thức` đã thiết kế ở `WORLDVIEW_ATMOSPHERE.md` mục 5: nếu Mệnh có `sign: "hung"`
  hoặc concept2 thuộc nhóm u ám (tai nạn lớn/giết chóc/bí mật), `revealInsight` thành công ĐỒNG THỜI
  đánh dấu `character.forbiddenKnowledgeCount += 1` — biết sự thật về 1 Mệnh Hung cũng là 1 dạng
  tri thức cấm kỵ, không thể "quên" lại được.

---

## 3. MỆNH NGUỘI (COOLING FATE) — CHỐNG TRẠNG THÁI "ACTIVE NHƯNG LÃNG QUÊN"

**Phát hiện:** hệ thống bậc quan hệ (mục 2 `FATE_RELATIONSHIP_COMPLETE.md`) có `lastActiveStreakDays`
nhưng CHƯA có xử lý cho trường hợp Mệnh active liên tục RẤT LÂU mà KHÔNG hề lên bậc (VD do
`alignment` không khớp lối chơi của người chơi — 1 Mệnh Hung Cách nhưng người chơi toàn chọn lựa
chọn thiện lành, không bao giờ đủ điều kiện lên bậc 1→2 ở mục 2.2).

```
Field mới: fate.stagnantDays: number (số ngày active LIÊN TỤC mà relationshipStage KHÔNG đổi)

Nếu stagnantDays >= 60 (ngày game):
  gán trạng thái hiển thị "Mệnh Nguội" trên UI (icon/màu khác, KHÔNG phải debuff cơ chế, chỉ là
  CẢNH BÁO trực quan)
  Cho phép hành động MỚI: "Buông Mệnh" (Release Fate) — tháo Mệnh Nguội này ra khỏi active KHÔNG
  cần qua Mệnh Kho trung gian, trả thẳng về dạng "Tinh Hoa Dư" (như mục 1) NGAY LẬP TỨC, không mất
  phí, không phạt Danh Vọng — khuyến khích người chơi chủ động dọn build thay vì giữ Mệnh không hợp
  chỉ vì tiếc.
```
> Đây KHÔNG phải hình phạt (không tự động tháo, không giảm stat trong lúc Nguội) — chỉ là công cụ
> UI + 1 action tiện lợi giúp người chơi nhận ra và dọn dẹp build không hiệu quả, đúng tinh thần
> "Hành động phải giải thích được kết quả" (nguyên tắc #5 của spec gốc).

---

## 4. KHÓA ĐỘC BẢN CHO GRADE `tien` (SERVER-WIDE UNIQUENESS LOCK)

**Phát hiện:** toàn bộ pool 10.000 mệnh chỉ có ĐÚNG 1 entry grade `tien` ("Thần Đạo", id
`than_dao_151`, score 96) — đây không chỉ là "hiếm" như Thánh Phẩm (9 entry), mà là ĐỘC NHẤT theo
đúng nghĩa đen. Cần cơ chế khóa RÕ RÀNG, không để game xử lý nó như 1 entry hiếm bình thường (có
thể vô tình cho phép nhiều người chơi cùng roll trúng nếu không khóa).

```
onFateRolled(anyCharacter, "than_dao_151"):
  KIỂM TRA server-wide: đã có bất kỳ nhân vật NÀO (của bất kỳ người chơi nào) đang sở hữu Mệnh này
  chưa (kể cả đang ở Mệnh Kho, chưa active)?
    Nếu CHƯA: cho roll bình thường, sau đó KHÓA vĩnh viễn — loại `than_dao_151` khỏi weight table
    chung của TOÀN SERVER (không ai khác roll trúng được nữa cho tới khi chủ nhân hiện tại MẤT nó
    — qua Luân Hồi Thất Bại/PvP tước đoạt nếu game có cơ chế đó/chủ động phá hủy)
    Nếu ĐÃ CÓ chủ: loại bỏ `than_dao_151` khỏi TOÀN BỘ weight table trước khi roll cho bất kỳ ai
    khác (không hiển thị lại như 1 khả năng cho tới khi được giải phóng)
```
- Cần 1 bảng riêng `serverUniqueFateOwnership: { fateId -> characterId | null }` ở tầng server,
  KHÔNG lưu riêng theo từng nhân vật (vì bản chất là ràng buộc TOÀN SERVER, không phải per-player).
- UI khi hiển thị Mệnh này (nếu đã có chủ) cho người khác xem qua leaderboard/lore: hiện rõ "Đã có
  chủ — [Tên Nhân Vật]" thay vì ẩn hoàn toàn, tạo giá trị xã hội/mục tiêu để tranh đoạt nếu game có
  PvP.

---

## 5. VIỆC CẦN LÀM TIẾP
1. Xác nhận ngưỡng cụ thể mục 3 (60 ngày game) và mục 1 (ngưỡng grade nào tự convert vs hỏi người
   chơi) — số hiện tại là đề xuất hợp lý, chưa qua cân bằng thật.
2. Quyết định "Tinh Hoa Dư" dùng làm nguyên liệu cho ĐÚNG những hệ thống nào (Dưỡng Mệnh/Hư Thiên
   Đỉnh/cả 2?) — cần 1 tỷ lệ quy đổi cụ thể trước khi code.
3. Nếu game KHÔNG có PvP tước đoạt, mục 4 cần thêm quy tắc: chủ nhân `than_dao_151` MẤT nó trong
   trường hợp nào khác ngoài Luân Hồi Thất Bại (VD có thể KHÔNG BAO GIỜ mất nếu Luân Hồi thường giữ
   được — cần đối chiếu lại điều kiện "giữ 1 Mệnh cao nhất" đã thiết kế ở Luân Hồi để đảm bảo
   `than_dao_151` không bị kẹt vĩnh viễn với 1 người chơi đã ngừng chơi).

### Source: `archive-requirements\logic-history\01-core\fate\FATE_NURTURE_IMPLEMENTATION_REQUIREMENT.md`

# FATE — Dưỡng Mệnh Implementation Requirement

## Mục tiêu

Dưỡng Mệnh là hoạt động đầu tư có giới hạn cho một Mệnh đang kích hoạt. Nó bổ trợ hành vi thật, không được trở thành vòng lặp bấm nút để bỏ qua combat/quest.

## Contract

```js
engine.nurtureFate(state, fateId) => {
  success, cost, status, cooldown?, reason?
}
```

## Luật bắt buộc

1. Chỉ `state.player.fates` được Dưỡng; Mệnh Kho luôn không có hiệu lực.
2. Chi phí Linh Thạch là `5 + relationshipStage * 5`.
3. Mỗi Mệnh chỉ được Dưỡng một lần trong một ngày game (`lastNurtureDay`). Không đủ tài nguyên hoặc còn cooldown thì state không đổi.
4. Thành công tăng `relationshipPoints +1`, reset `stagnantDays = 0`, ghi `lastNurtureTurn/lastNurtureDay` và log kết quả.
5. Bậc 0→1 cần một thử thách elite/boss hoặc 7 ngày active; bậc 1→2 cần 3 lựa chọn aligned. Dưỡng Mệnh chỉ đóng góp điểm, không tự nhảy qua bậc 2.
6. Hành vi thật gọi `recordFateBehavior`: combat elite/boss, tu luyện và lựa chọn aligned. Mọi thay đổi stage phải trace trong history.
7. Khi active theo ngày mà stage không đổi, `activeDays` và `stagnantDays` tăng. `stagnantDays >= 60` mở action Buông Mệnh, không tự động gỡ hoặc phạt stat.

## Tương thích

Quan hệ được lưu trong `state.player.fateRelationships[fateId]`, migration giữ các field cũ (`relationshipStage`, `relationshipPoints`). Gameplay state cập nhật trước; narrative chỉ phản ánh kết quả.

## API liên quan

`nurtureFate`, `recordFateBehavior`, `resonateFate`, `releaseStagnantFate`, `fateRelationshipStatus` trong `js/engine.js`.


### Source: `archive-requirements\logic-history\01-core\fate\FATE_RELATIONSHIP_COMPLETE.md`

# FATE RELATIONSHIP — HOÀN CHỈNH (đọc kèm `FATE_SYSTEM_SPEC.md` mục 7 + `FATE_SYSTEM_COMPLETE.md`)
> Spec gốc mục 7 mới liệt kê KHUNG (bậc 0-4, khái niệm Dưỡng Mệnh/Cộng Minh) và đánh dấu phần lớn
> là **Chưa có** — file này thiết kế CHI TIẾT đủ để code, đối chiếu với khả năng THẬT của
> `fate_relationships.js` hiện có (chỉ có quan hệ Mệnh-Mệnh, CHƯA có quan hệ Nhân Vật-Mệnh).

---

## 1. PHÂN TẦNG QUAN HỆ ĐÃ CÓ vs CHƯA CÓ

| Loại quan hệ | Trạng thái | Nguồn dữ liệu |
|---|---|---|
| Mệnh ↔ Mệnh (Tương Sinh/Tương Khắc giữa 2 Mệnh đang active) | **Đã có** | `fate_relationships.js` → `pairwise_relationships[]` (13.976 cặp) |
| Mệnh ↔ Mệnh (Combo 2-3 Mệnh) | **Đã có** | `fate_relationships.js` → `combo_sets[]` (150 bộ) |
| Mệnh + Mệnh → Mệnh mới (Dung Hợp) | **Đã có** | `fate_relationships.js` → `fusion_recipes[]` (78 công thức) |
| **Nhân Vật ↔ Mệnh (bậc 0-4)** | **CHƯA CÓ — thiết kế đầy đủ ở mục 2** | Không có trong bất kỳ file nào đã cung cấp |
| **Dưỡng Mệnh (NURTURE_FATE)** | **CHƯA CÓ — thiết kế ở mục 3** | — |
| **Cộng Minh (RESONATE)** | **CHƯA CÓ — thiết kế ở mục 4** | — |
| Nghịch Mệnh/Trấn Mệnh/Thiên Cơ/Mệnh Đổi (Phase 3) | **CHƯA CÓ — phác thảo sơ bộ ở mục 6, CẦN XÁC NHẬN trước khi code** | — |

> Lưu ý bắt buộc trước khi code bất kỳ mục nào dưới đây: xử lý xong lệch schema `grade`↔`tier` và
> `sign`↔`type` đã nêu ở `FATE_SYSTEM_COMPLETE.md` mục 3 — mọi công thức dưới đây giả định đã có
> sẵn 2 hàm map đó.

---

## 2. QUAN HỆ NHÂN VẬT ↔ MỆNH (BẬC 0-4) — THIẾT KẾ ĐẦY ĐỦ

### 2.1. Cấu trúc dữ liệu (gắn vào INSTANCE Mệnh nhân vật sở hữu, không phải `FateDefinition` catalog)
```js
// state.player.fates[i] hoặc state.fateInventory[i] — mỗi instance Mệnh nhân vật đang giữ
FateInstance {
  fateId,                    // trỏ tới FateDefinition trong fate_data.js
  isActive: boolean,         // đang ở ô active hay trong vault
  relationshipStage: 0-4,    // Sơ Ngộ..Nhân Mệnh Hợp Nhất, theo đúng bảng spec mục 7.1
  relationshipPoints: number,// tích lũy qua HÀNH VI (không phải EXP thuần túy — xem mục 2.2)
  firstAcquiredAt: timestamp,
  lastActiveStreakDays: number  // số ngày liên tục đang active KHÔNG bị tháo ra — dùng cho điều
                                  // kiện lên bậc, xem mục 2.2
}
```

### 2.2. Điều kiện lên bậc (CỤ THỂ HÓA "hành vi và lựa chọn có liên quan" mà spec chỉ nói chung chung)

| Bậc | Tên | Điều kiện lên bậc CỤ THỂ |
|---|---|---|
| 0 → 1 | Sơ Ngộ → Đồng Hành | Mệnh đang active và ĐÃ TỒN TẠI qua ít nhất 1 lần combat với Quái Elite/Boss trở lên, HOẶC đã active liên tục >= 7 ngày game (`lastActiveStreakDays >= 7`) — "đã dùng qua thử thách" theo đúng nghĩa đen |
| 1 → 2 | Đồng Hành → Tương Ứng | Người chơi thực hiện >= 3 lựa chọn quest/hội thoại CÙNG HƯỚNG với `alignment` của Mệnh (Mệnh Cát Cách tính lựa chọn `moral_choice` nghiêng thiện; Mệnh Hung Cách tính lựa chọn nghiêng ác/lợi ích) trong lúc Mệnh đang active — tái dùng `questType: "moral_choice"` đã thiết kế ở hệ thống nhiệm vụ |
| 2 → 3 | Tương Ứng → Cộng Minh | BẮT BUỘC qua action `RESONATE` thành công (mục 4) — không tự động theo thời gian, cần người chơi CHỦ ĐỘNG kích hoạt |
| 3 → 4 | Cộng Minh → Nhân Mệnh Hợp Nhất | Mệnh đang ở bậc Cộng Minh + nhân vật Đột Phá thành công lên 1 Cấp MỚI trong khi Mệnh này active xuyên suốt toàn bộ nghi thức Đột Phá (không tháo ra giữa chừng) — gắn thẳng vào `BREAKTHROUGH_RITUAL_DETAIL.md` đã có, không tạo trigger tách biệt |

### 2.3. Hiệu ứng mỗi bậc (không đổi số liệu gốc của Mệnh, chỉ CỘNG THÊM theo bậc quan hệ)
```
Bậc 0 (Sơ Ngộ):              hiệu ứng cơ bản, đúng 100% giá trị gốc trong fate_data.js
Bậc 1 (Đồng Hành):           +5% toàn bộ modifiers (mục 4.3 FATE_SYSTEM_COMPLETE.md)
Bậc 2 (Tương Ứng):           +10% modifiers, mở khóa xem trước `potential` (combo khả dụng)
Bậc 3 (Cộng Minh):            +20% modifiers, mở 1 hiệu ứng ẩn ĐỘC QUYỀN chỉ có ở bậc này (xem 4.3)
Bậc 4 (Nhân Mệnh Hợp Nhất):  +35% modifiers, Mệnh này KHÔNG THỂ bị tháo/hi sinh/dung hợp nữa (đã
                              "hợp nhất" vĩnh viễn với nhân vật — đánh đổi: mất tính linh hoạt đổi
                              build, nhưng đây là lựa chọn CHỦ ĐỘNG của người chơi khi đạt tới đây)
```

### 2.4. Suy giảm bậc quan hệ khi VAULT LÂU (ĐỀ XUẤT — CẦN XÁC NHẬN, spec gốc không nêu rõ)
```
Nếu 1 FateInstance đã đạt bậc >= 1 nhưng bị tháo vào Mệnh Kho và ĐỂ YÊN quá 30 ngày game liên tục:
  relationshipStage -= 1 (tối thiểu về 0, không âm)
```
> Lý do đề xuất: nếu không có cơ chế suy giảm, người chơi có thể "farm" hết bậc trên 1 Mệnh rồi vault
> vĩnh viễn không dùng nhưng vẫn giữ nguyên bậc cao — không hợp lý về mặt gameplay. Tuy nhiên spec
> gốc KHÔNG đề cập cơ chế này, nên đánh dấu rõ: cần XÁC NHẬN trước khi code, không tự ý thêm nếu
> chưa duyệt (tôn trọng nguyên tắc không tự ý mở rộng ngoài spec đã thống nhất).

---

## 3. DƯỠNG MỆNH (`NURTURE_FATE`) — THIẾT KẾ ĐẦY ĐỦ

```
Điều kiện gọi action: fate.isActive == true (Mệnh trong Vault KHÔNG dưỡng được — đúng nguyên tắc #1
                       "Mệnh Kho không có hiệu lực" của spec, áp dụng cả cho việc bồi dưỡng)

Chi phí mỗi lần Dưỡng Mệnh: Linh Thạch (tăng dần theo relationshipStage hiện tại — dưỡng Mệnh bậc
cao tốn hơn bậc thấp, tránh rush bậc 4 quá nhanh) + có cooldown (VD 1 lần/ngày game/Mệnh)

Hiệu quả: += relationshipPoints (số lượng cụ thể do cân bằng quyết định sau), CÓ diminishing return
nếu dùng liên tục nhiều ngày mà không xen kẽ hoạt động thật (combat/quest) — Dưỡng Mệnh nên là
BỔ SUNG cho hành vi thật (mục 2.2), KHÔNG PHẢI cách duy nhất/nhanh nhất để lên bậc, tránh biến toàn
bộ hệ thống quan hệ thành 1 vòng lặp bấm nút vô nghĩa.
```

---

## 4. CỘNG MINH (`RESONATE`) — THIẾT KẾ ĐẦY ĐỦ

```
canResonate(character, fateInstance):
  relationshipStage == 2 (Tương Ứng)          // chỉ gọi được ở ĐÚNG bậc này, không nhảy cóc
  AND match_score(fateInstance, character.currentPath) >= 8   // "Tương Sinh" trở lên, spec mục 5.2
  AND character.SAN >= chi phí cố định (đề xuất 10, cần cân bằng)
  AND fateInstance.isActive == true

onResonateSuccess:
  relationshipStage = 3
  character.SAN -= chi phí
  unlock 1 hiệu ứng ẩn ĐỘC QUYỀN của riêng Mệnh đó ở bậc Cộng Minh (dữ liệu hiệu ứng ẩn này CẦN
  soạn riêng cho từng Mệnh — không phải mọi 10.000 Mệnh đều cần ngay, ưu tiên soạn trước cho nhóm
  Địa Phẩm trở lên vì tần suất người chơi thật sự đạt bậc Cộng Minh với Mệnh phẩm thấp là rất hiếm)

onResonateFail (không đủ điều kiện):
  Hiện rõ blocker đang thiếu (đúng nguyên tắc #5 của spec: "Hành động phải giải thích được kết quả")
  KHÔNG trừ SAN nếu chưa đủ điều kiện để thử — chỉ trừ SAN khi đã đủ điều kiện và THỰC SỰ thực hiện
  nghi thức Cộng Minh (không phạt người chơi vì bấm nhầm lúc chưa đủ điều kiện)
```

---

## 5. COMBO NÂNG CAO GẮN VỚI BẬC QUAN HỆ (mở rộng `combo_sets` đã có)

Spec mục 7.2 ghi: "combo ba: yêu cầu phẩm cấp, match tier HOẶC QUAN HỆ TỐI THIỂU". Dữ liệu
`combo_sets` hiện tại (150 bộ) CHƯA có field nào biểu diễn điều kiện quan hệ tối thiểu. Đề xuất bổ
sung field mới vào combo (không phá field cũ):
```js
ComboSet {
  ...(giữ nguyên toàn bộ field cũ: combo_id, name, members, required_count, avg_tier, effect,
      isNghich, bonusPct, fortuneBonus, madnessDelta)...
  minRelationshipStageRequired: 0-4 | null   // null = không yêu cầu gì thêm ngoài sở hữu đủ member,
                                               // giữ hành vi CŨ cho 150 combo hiện có (không phá vỡ)
}
```
- 150 combo hiện có: mặc định `minRelationshipStageRequired = null` (không đổi hành vi cũ).
- Combo MỚI thêm sau này (nếu muốn tạo chiều sâu) có thể đặt yêu cầu bậc quan hệ cụ thể trên TẤT CẢ
  member — đây là hướng mở rộng, không bắt buộc làm ngay.

---

## 6. PHÁC THẢO SƠ BỘ PHASE 3 (Nghịch Mệnh/Trấn Mệnh/Thiên Cơ/Mệnh Đổi) — CẦN XÁC NHẬN TRƯỚC KHI CODE

Spec chỉ liệt kê tên 4 action này ở mục 8, không có chi tiết. Phác thảo Ý TƯỞNG (KHÔNG PHẢI spec
chính thức, chỉ để tham khảo khi tới Phase 3):

| Action | Ý tưởng sơ bộ |
|---|---|
| `DEFY_FATE` (Nghịch Mệnh) | Chủ động HÀNH ĐỘNG NGƯỢC với `alignment` của 1 Mệnh Hung Cách đang active nhiều lần liên tục → có thể "phá" bản chất Hung của nó, đổi 1 phần hiệu ứng xấu thành trung tính, ĐỔI LẠI mất hẳn phần hiệu ứng tốt đi kèm (nếu có) — giá phải trả lớn đúng như spec mô tả |
| `SUPPRESS_FATE` (Trấn Mệnh) | Dùng Công Pháp loại `tran_phap` + tiêu hao SAN để TẠM THỜI khóa phần `effects` điều kiện nguy hiểm của 1 Mệnh Hung (không xóa vĩnh viễn, chỉ khóa trong X thời gian, cần lặp lại) |
| `HEAVENLY_OMEN` (Thiên Cơ) | Tiêu hao tài nguyên + cooldown dài để "nhìn trước" — hé lộ trước kết quả 1 lần Đột Phá/Cộng Minh SẮP thực hiện (tỷ lệ thành công thật, không phải đoán mò) trước khi thực sự bấm nút, giúp người chơi ra quyết định sáng suốt hơn |
| `FATE_TRANSFORM` (Mệnh Đổi) | Biến đổi 1 Mệnh THEO QUAN HỆ nó đang có (VD 1 Mệnh đang ở bậc Nhân Mệnh Hợp Nhất + đủ vật liệu hiếm) → chuyển hẳn sang 1 biến thể khác cùng gốc nhưng tính chất khác (gần giống `evolutionPaths` đã thiết kế ở hệ thống Công Pháp — tái dùng ý tưởng, không tạo cơ chế hoàn toàn mới) |

---

## 7. VIỆC CẦN LÀM TIẾP
1. Xác nhận cơ chế suy giảm bậc khi vault lâu (mục 2.4) — CÓ áp dụng hay KHÔNG, trước khi code.
2. Cân bằng số liệu cụ thể: chi phí Linh Thạch/SAN cho Dưỡng Mệnh và Cộng Minh (mục 3-4 mới chỉ có
   khung, chưa có số thật).
3. Soạn hiệu ứng ẩn độc quyền bậc Cộng Minh (mục 4) cho ưu tiên nhóm Địa Phẩm trở lên trước.
4. Duyệt phác thảo Phase 3 (mục 6) trước khi bắt đầu code — hiện chỉ là ý tưởng tham khảo, CHƯA phải
   spec chính thức như phần còn lại của tài liệu này.

### Source: `archive-requirements\logic-history\01-core\fate\FATE_REQUIREMENTS_COMPLETE.md`

# FATE SYSTEM — REQUIREMENTS TỔNG HỢP

**Ngày hợp nhất:** 2026-09-09  
**Phạm vi:** toàn bộ tính năng Mệnh Số/FATE trong game Ancient Taoist Realm.

Tài liệu này là bản tổng hợp chức năng duy nhất để tra cứu nhanh. Các tài liệu phân tích chi tiết (`FATE_UPDATE_SYSTEM_RULE.md`, `FATE_SYSTEM_COMPLETE.md`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_NEW_LOGIC_ADDENDUM.md`, `FATE_GRADE_WEIGHT_BY_LEVEL.md`) được giữ lại để audit nguồn; khi có khác biệt, ưu tiên quyết định mới nhất trong tài liệu này và code `js/engine.js`.

## 1. Kiến trúc và nguồn dữ liệu

- `data/fate_data.js`: catalog canonical 10.000 Fate (`id`, `name`, `grade`, `sign`, `score`, `effects`, `desc`).
- `data/fate_relationships.js`: pairwise relationship, combo set và fusion recipe.
- `data/path_fate_relations.js`: Con Đường, affinity tags, forbidden tags và hidden fate.
- `state.player.fates`: Fate đang kích hoạt; chỉ nhóm này tạo stat, score, affinity, relationship và combo.
- `state.fateInventory`: Mệnh Kho; không tạo hiệu lực gameplay.
- `state.player.fateInstances` và `state.player.fateRelationships`: tiến trình instance/quan hệ.
- `state.pendingFateRewards`: phần thưởng chờ khi Mệnh Kho đầy.

Engine là nguồn tính toán duy nhất. UI không tự tính điểm hoặc affinity.

## 2. Chuẩn hóa schema

Engine dùng các map duy nhất:

```js
GRADE_TO_TIER = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 }
SIGN_TO_TYPE_LABEL = { cat: "Cát Cách", binh: "Bình Cách", hung: "Hung Cách" }
```

`fateDefinition()` cung cấp alias `alignment`, `tier`, `element`, `path_affinity`, `modifiers` và `conditionalEffects`. `effects` được tách thành modifier trực tiếp và hiệu ứng theo ngữ cảnh; không sửa catalog gốc ở runtime.

## 3. Roll và nhận Fate

Mọi reward thông thường gọi `rollFateByProgression(state, options)` theo luồng:

1. Chọn grade theo cấp nhân vật và bảng trọng số.
2. Áp dụng `gradeCap`, `minimumGrade`, source modifier và loại Fate đã sở hữu/khóa.
3. Nếu grade hết entry khả dụng, dồn trọng số sang grade còn lại.
4. Chọn đều một entry trong grade.
5. Gọi `receiveFate()` để xử lý active/vault/pending.

Trọng số canonical (Phàm→Tiên):

| Cấp | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–2 | 65 | 30 | 5 | 0 | 0 | 0 | 0 | 0 |
| 3–4 | 15 | 45 | 25 | 10 | 5 | 0 | 0 | 0 |
| 5–6 | 5 | 20 | 35 | 25 | 10 | 5 | 0 | 0 |
| 7–8 | 2 | 10 | 25 | 30 | 20 | 10 | 3 | 0 |
| 9+ | 1 | 5 | 15 | 25 | 25 | 18 | 11 | 0 |

Fate Tiên là entry độc bản trong single-save (`state.meta.uniqueFateOwnership`). Duplicate Phàm/Linh/Hoàng đổi thành Tinh Hoa Dư theo tỷ lệ 1/3/8; duplicate hiếm trả blocker rõ ràng. Kho đầy không làm mất reward: dùng pending hoặc thay thế có xác nhận.

## 4. Hiệu lực và tương hợp

- Active Fate mới đi qua `computeStats()` và `computeFate()`.
- Match 0 vẫn được trang bị, nhưng là off-build hợp lệ.
- `pathMatchSummary()` tính lead/support/forbidden; forbidden chỉ đến từ tag đã định nghĩa, không suy luận vì thiếu match.
- Pairwise relationship và combo chỉ xét active Fate.
- Fate bị Trấn Mệnh tạm thời bỏ khỏi stat pipeline đến `untilTurn`, không bị xóa.

## 5. Quan hệ nhân vật–Fate

Stage 0–4: **Sơ Ngộ → Đồng Hành → Tương Ứng → Cộng Minh → Nhân Mệnh Hợp Nhất**.

- `recordFateBehavior`: ghi hành vi tu luyện, combat elite/boss và lựa chọn aligned.
- Bậc 0→1: elite/boss hoặc active đủ 7 ngày.
- Bậc 1→2: ít nhất 3 lựa chọn aligned.
- Bậc 2→3: bắt buộc `resonateFate`, match ≥8 và đủ SAN.
- Bậc 3→4: gắn với đột phá thành công khi Fate vẫn active.

## 6. Dưỡng Mệnh

`nurtureFate(state, fateId)` chỉ áp dụng cho Fate active.

- Chi phí: `5 + relationshipStage × 5` Linh Thạch.
- Cooldown: mỗi Fate một lần/ngày game.
- Thành công: `relationshipPoints +1`, reset `stagnantDays`, ghi turn/day và history.
- Không đủ tài nguyên/còn cooldown: state không đổi.
- Dưỡng Mệnh chỉ hỗ trợ điểm; không được bỏ qua điều kiện hành vi để nhảy thẳng bậc cao.

## 7. Action nâng cao

| Action | Điều kiện và hiệu quả |
|---|---|
| Giác Ngộ | Ngộ Tính ≥60 hoặc stage ≥2; mở insight vĩnh viễn, Hung insight tăng tri thức cấm |
| Buông Mệnh | Active `stagnantDays ≥60`; tháo Fate và hoàn Tinh Hoa Dư |
| Nghịch Mệnh | Hung active; tốn 15 SAN, tăng bộ đếm defiance |
| Trấn Mệnh | Active; tốn 8 SAN, khóa hiệu lực tạm thời |
| Thiên Cơ | Tốn 5 SAN, cooldown 12 turn, trả blocker đột phá từ state thật |
| Cộng Minh | Stage 2, match ≥8, tốn 10 SAN, chuyển stage 3 |
| Mệnh Đổi | Stage 4 + Cường Hóa +5; dùng công thức biến thể ở mục 8 |

## 8. FATE_TRANSFORM / Mệnh Đổi

Mệnh Đổi tái sử dụng hệ thống `fateEvolutionBranches` làm catalog nhánh biến thể canonical.

Điều kiện:

- Fate đang active.
- Quan hệ Nhân Mệnh Hợp Nhất (stage 4).
- Cường Hóa Fate đạt +5.
- Có branch hợp lệ cho Fate/Con Đường.

Công thức chi phí theo `gradeTier`:

```text
Mệnh Tinh Hoa = 5 + 2 × gradeTier
Công Đức      = 10 + 5 × gradeTier
Thanh Tỉnh    = 10
```

`transformFate()` hỗ trợ preview candidate branch, hiển thị chi phí và commit qua `GameExpansion.evolveFate()`. Nhánh nguy hiểm bắt buộc xác nhận. Không tự sinh biến thể nếu catalog không có branch; trả blocker có thể truy vết.

## 9. UI và action wiring

Fate overlay hiển thị active/vault, grade, sign, score, match, effects, relationship và nguồn nhận. Các nút nâng cao được decorate động khi đủ điều kiện: Giác Ngộ, Buông Mệnh, Nghịch Mệnh, Trấn Mệnh, Mệnh Đổi. Thiên Cơ expose qua expansion command `fate_omen`.

## 10. Save, transaction và migration

Mọi action phải kiểm tra blocker trước, snapshot thay đổi cần thiết, commit nguyên tử và ghi log sau commit. Save cũ được migration về các field Fate hiện hành; không xóa Fate âm thầm. `validateFateInventory()` dùng để kiểm tra invariant active/vault.

## 11. API canonical

`fateDefinition`, `fateCompatibility`, `pathMatchSummary`, `rollFateByProgression`, `receiveFate`, `fateVaultSummary`, `equipFateFromVault`, `storeFateToVault`, `sacrificeFate`, `mergeFates`, `nurtureFate`, `recordFateBehavior`, `resonateFate`, `revealFateInsight`, `releaseStagnantFate`, `defyFate`, `suppressFate`, `heavenlyOmen`, `transformFate`.

## 12. Trạng thái và giới hạn

Đã triển khai và kiểm thử trong runtime hiện tại. Giới hạn còn lại là dữ liệu branch biến thể chưa có riêng cho từng 10.000 Fate và uniqueness Tiên chưa dùng server multiplayer thật.

Kiểm tra release:

```text
node --check js/engine.js
node --check js/expansion.js
node --check js/main.js
node tools/verify_game.js
```

### Source: `archive-requirements\logic-history\01-core\fate\FATE_SYSTEM_COMPLETE.md`

# FATE SYSTEM — HOÀN CHỈNH (đọc kèm `FATE_SYSTEM_SPEC.md`, không lặp lại nội dung đã có ở đó)
> File này CHỈ bổ sung phần `FATE_SYSTEM_SPEC.md` còn để trống: đối chiếu schema THẬT của
> `data/fate_data.js` (10.000 mệnh, đang chạy) với `FateDefinition` mục tiêu (spec mục 4.1), và kế
> hoạch lấp từng gap cụ thể. Đọc `FATE_SYSTEM_SPEC.md` trước — nó vẫn là nguồn chân lý cho nguyên
> tắc, luồng giao dịch, action, UI, roadmap. File này KHÔNG được mâu thuẫn với spec đó.

---

## 1. PHÂN LOẠI FILE — CÁI NÀO LÀ NGUỒN THẬT, CÁI NÀO ĐÃ LỖI THỜI

| File | Trạng thái | Lý do |
|---|---|---|
| `data/fate_data.js` (10.000 mệnh, `window.FATE_DATA`) | **NGUỒN THẬT** — khớp `data/fate_data.js` mà spec mục 4.1/16 trỏ tới | grade dùng đúng thang Phàm→Tiên theo spec mục 5.1 |
| `fate_relationships.js` (`window.FATE_RELATIONSHIPS`, source: `fate_data_10000`) | **NGUỒN THẬT nhưng LỆCH SCHEMA** với `fate_data.js` (xem mục 3) | Sinh từ đúng 10.000 mệnh, nhưng dùng field khác tên |
| `generate_fate_pool.js` | **LỖI THỜI — bỏ hẳn** | Sinh thang 8 tier "Trắng/Lục/Lam/Chàm/Tím/Cam Kim/Đỏ/Cầu Vồng" — SAI thang chuẩn (spec mục 5.1 chốt `Phàm→Linh→Hoàng→Huyền→Địa→Thiên→Thánh→Tiên`). Ghi ra `data/fate-pool.json` (có gạch nối) — KHÔNG PHẢI đường dẫn `data/fate_data.js` mà runtime/spec dùng. |
| `fate-pool.json` (1300 mệnh, tier Trắng...Cầu Vồng) | **LỖI THỜI — bỏ hẳn** | Output của script lỗi thời ở trên, sai thang tier, sai quy mô (1300 vs 10.000 mục tiêu) |
| `fate-relationships.json` (source: `fate-pool_1300`) | **LỖI THỜI — bỏ hẳn** | Sinh từ `fate-pool.json` lỗi thời, thừa hưởng luôn lỗi thang tier |

> Không cần migrate bất kỳ dữ liệu nào từ 3 file lỗi thời — quy mô (1300) và thang tier đều đã bị
> thay thế hoàn toàn bởi bộ 10.000 mệnh + thang Phàm→Tiên. Chỉ giữ lại nếu cần THAM KHẢO ý tưởng
> ngân hàng từ (Chính Tinh/Phụ Tinh Tử Vi Đẩu Số) cho việc SINH THÊM biến thể sau này — không dùng
> trực tiếp output của nó.

---

## 2. ĐỐI CHIẾU `FateDefinition` (spec mục 4.1) vs SCHEMA THẬT CỦA `fate_data.js`

Field thật hiện có trên mỗi entry: `id, name, sign, grade, gradeLabel, score, effects{...}, desc`.

| Field trong `FateDefinition` mục tiêu | Trạng thái thật | Gap cụ thể cần lấp |
|---|---|---|
| `id` | **Đã có** | — |
| `name` | **Đã có** | — |
| `grade` | **Đã có** (`grade` + `gradeLabel` song song, đúng thang Phàm→Tiên) | — |
| `alignment` | **Có nhưng khác** | Field thật tên là `sign`, giá trị `cat/binh/hung` (khớp ngữ nghĩa Cát/Bình/Hung của spec) — CHỈ cần map lại tên field khi engine đọc, không cần đổi data: `alignment = sign` |
| `element` | **CHƯA CÓ — gap lớn** | Không có field Ngũ Hành nào trên 10.000 entry. Cần pass sinh bổ sung (mục 4.1) |
| `path_affinity {lead, support, forbidden}` | **CHƯA CÓ — gap NGHIÊM TRỌNG NHẤT** | Đây là field mà toàn bộ mục 5.2-5.3 của spec (match_score, tương sinh/khắc Con Đường) phụ thuộc vào — hiện KHÔNG có bất kỳ liên kết nào giữa 1 Mệnh Số và Con Đường nào cả. Không có field này thì `match_score` không thể tính được từ chính Mệnh, phải tính từ nguồn khác (không đúng nguyên tắc #3 của spec). BẮT BUỘC lấp trước khi triển khai Phase 1 mục "Read/Quan Mệnh" hiển thị match. Xem thuật toán sinh ở mục 4.2. |
| `modifiers` | **Có nhưng khác** | Field thật gộp CHUNG vào `effects` (VD `magMult`, `phyMult`, `lifespanBonus`, `hpRegen`, `qiFlat`, `allStatMult` — đây đều là chỉ số TRỰC TIẾP, đúng nghĩa `modifiers` của spec) |
| `effects` | **Có nhưng khác** | Cùng field `effects` thật đang LẪN cả modifier trực tiếp VÀ hiệu ứng điều kiện (`breakBonus`, `fortune`, `lootMult`, `sanDrainMult`, `breakFailPenalty`, `sanResist`, `sanShield`, `lightFireMult`, `resistPossession`) — cần TÁCH thành 2 nhóm, xem bảng phân loại mục 4.3 |
| `passive` | **CHƯA CÓ** | Không có field đánh dấu hiệu ứng nào luôn bật (passive) vs có điều kiện — mặc định coi TẤT CẢ hiệu ứng của Mệnh đang kích hoạt là passive (luôn bật khi active) cho tới khi có hệ thống điều kiện trigger riêng (Phase 3) |
| `relationship` | **Có nhưng khác (kiến trúc, không phải thiếu)** | KHÔNG nên nhúng trực tiếp vào từng `FateDefinition` — quan hệ đang lưu ở bảng riêng `fate_relationships.js` (`pairwise_relationships`, tra theo `from`/`to` id). Đây là thiết kế CHUẨN HÓA (normalized), TỐT HƠN nhúng — chỉ cần engine cung cấp hàm `getRelationshipsFor(fateId)` tra ngược bảng đó, không cần đổi schema `fate_data.js` |
| `potential` | **CHƯA CÓ trên entry, có RẢI RÁC ở bảng khác** | Trần thức tỉnh/combo nằm ở `combo_sets`/`fusion_recipes` riêng (tra theo id thành viên) — tương tự `relationship`, đây là thiết kế chuẩn hóa hợp lý, chỉ cần thêm 2 hàm tra cứu `getComboEligibility(fateId)`/`getFusionRecipesUsing(fateId)`, KHÔNG cần nhúng field `potential` vào từng entry |
| `state` | **Đúng theo thiết kế — KHÔNG phải gap** | `state` (active/vault/pending) là thuộc tính của INSTANCE nhân vật sở hữu (`state.player.fates`/`state.fateInventory`), không phải của `FateDefinition` (bản mẫu/catalog dùng chung) — spec mục 4.1 đã map đúng chỗ này rồi, không cần sửa gì |

**Tóm tắt 2 gap THẬT SỰ cần code/data mới:** `element` và `path_affinity` (đều thiếu hoàn toàn trên
data thật). Còn lại là vấn đề ĐẶT TÊN LẠI field khi đọc (`sign`→`alignment`) hoặc TÁCH nhóm trong
cùng field `effects` sẵn có (`modifiers` vs `effects` điều kiện) — không cần sinh lại data.

---

## 3. LỆCH SCHEMA GIỮA `fate_data.js` VÀ `fate_relationships.js` (2 FILE "THẬT" TỰ MÂU THUẪN NHAU)

| Điểm lệch | `fate_data.js` dùng | `fate_relationships.js` dùng | Rủi ro nếu không sửa |
|---|---|---|---|
| Cấp bậc | `grade` (string: `phan/linh/hoang/huyen/dia/thien/thanh/tien`) | `tier` (number, trong `combo_sets.members[].tier` và `fusion_recipes.tier_from/tier_to`) | Engine đọc 2 file phải tự đoán mapping `grade↔tier`, dễ sai lệch nếu không có 1 hàm chuyển đổi DUY NHẤT dùng chung |
| Nhãn Cát/Hung | `sign` (code ngắn: `cat/binh/hung`) | `type` (nhãn tiếng Việt đầy đủ: `"Cát Cách"`/`"Hung Cách"`, trong `combo_sets.members[].type` và `fusion_recipes.materials[].type`/`result.type`) | Cùng 1 khái niệm nhưng 2 định dạng khác nhau — so sánh trực tiếp `sign === type` sẽ LUÔN false dù cùng ý nghĩa |

### Fix bắt buộc TRƯỚC khi code Phase 1 dùng tới quan hệ/combo/fusion:
```js
// Đặt trong engine, dùng DUY NHẤT 1 nguồn cho toàn bộ codebase — không để UI/action tự map riêng

const GRADE_TO_TIER = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };
const TIER_TO_GRADE = Object.fromEntries(Object.entries(GRADE_TO_TIER).map(([g,t]) => [t,g]));

const SIGN_TO_TYPE_LABEL = { cat: "Cát Cách", hung: "Hung Cách", binh: "Bình Cách" };
const TYPE_LABEL_TO_SIGN = Object.fromEntries(Object.entries(SIGN_TO_TYPE_LABEL).map(([s,l]) => [l,s]));
```
- Mọi nơi trong engine cần so sánh/tra cứu chéo giữa 2 file PHẢI đi qua 2 bảng map này — không tự
  viết if/else rời rạc ở nhiều chỗ (đúng nguyên tắc "1 nguồn chân lý" đã có ở spec mục 6: "mọi UI và
  tooltip phải lấy cùng 1 kết quả từ engine, không tự tính lại").
- Lưu ý: `binh` (Bình Cách) có trong `sign` của `fate_data.js` nhưng KHÔNG thấy xuất hiện trong
  `type` của `fate_relationships.js` (chỉ thấy Cát Cách/Hung Cách trong dữ liệu quan hệ hiện tại) —
  cần kiểm tra xem Mệnh `sign: "binh"` có bị bỏ sót hoàn toàn khỏi hệ thống quan hệ (không có
  Tương Sinh/Khắc/Combo nào chứa Mệnh Bình Cách) hay đây là thiếu sót cần bổ sung thêm khi sinh lại
  quan hệ.

---

## 4. KẾ HOẠCH LẤP 2 GAP THẬT SỰ

### 4.1. Sinh `element` (Ngũ Hành) cho 10.000 entry
```
Nguồn suy luận: field `desc` đã có sẵn text mô tả ngữ nghĩa cho mỗi Mệnh (VD "Thần thánh, tinh
thần, siêu nhiên kết hợp với con đường..." hay "Thoát tục, trường sinh, cõi tiên kết hợp với sức
lực, thành quả, võ công").

elementKeywordMap = {
  kim:   ["kiếm", "đao", "kim loại", "sắc bén", "chiến", "sát"],
  moc:   ["mộc", "sinh trưởng", "cây", "sinh sôi", "hồi phục"],
  thuy:  ["thủy", "nước", "linh hoạt", "biến hóa", "ẩn tàng"],
  hoa:   ["hỏa", "lửa", "thiêu đốt", "nhiệt huyết", "bùng nổ"],
  tho:   ["thổ", "đất", "vững chắc", "trấn", "ổn định"],
  vo_he: [] // fallback mặc định nếu không khớp từ khóa nào — phần lớn Mệnh trừu tượng (Thần Đạo,
            // Thần Mệnh, Vĩnh Đạo...) sẽ rơi vào đây, ĐÚNG vì bản chất chúng trừu tượng không
            // thuộc Ngũ Hành vật lý
  di_he: [] // gán TAY cho nhóm Mệnh liên quan Tà/Cấm (không suy luận tự động, cần review thủ công)
}

Với mỗi entry: quét desc, đếm số từ khóa khớp mỗi hệ, chọn hệ có điểm cao nhất; nếu không khớp gì
-> element = "vo_he" (mặc định an toàn, KHÔNG ép gán bừa).
```
- Chạy 1 lần offline, ghi thẳng field `element` vào từng entry trong `fate_data.js` — không tính
  runtime (tính 1 lần, lưu tĩnh, giống cách `grade`/`score` đã được tính sẵn).
- Sau khi sinh xong, SAMPLE lại thủ công 50-100 entry ngẫu nhiên để kiểm tra độ chính xác trước khi
  áp dụng toàn bộ 10.000 — từ khóa tiếng Việt dễ nhầm (VD "chiến" có thể vừa hợp Kim vừa hợp chủ đề
  khác), cần tinh chỉnh `elementKeywordMap` qua vài vòng thử.

### 4.2. Sinh `path_affinity {lead, support, forbidden}` cho 10.000 entry
```
Điều kiện tiên quyết: cần có danh sách đầy đủ 10 Con Đường chính + bộ từ khóa chủ đề của MỖI Con
Đường (pathId -> themeKeywords[]) — đây LÀ DỮ LIỆU CHƯA CÓ trong bất kỳ file nào đã cung cấp, PHẢI
lấy từ tài liệu Con Đường gốc (mục "Mười Con Đường chính" trong tài liệu hệ thống hợp nhất) trước
khi chạy bước này.

Thuật toán (song song logic với 4.1, dùng chung cơ chế quét desc):
  Với mỗi entry, so desc với themeKeywords của cả 10 Con Đường:
    match_score_với_path = số từ khóa khớp
    nếu match_score cao nhất >= ngưỡng X -> path đó vào path_affinity.lead
    nếu match_score ở mức trung bình (dưới X nhưng > 0) với path khác -> vào path_affinity.support
    nếu desc mang ý nghĩa ĐỐI NGHỊCH rõ ràng với chủ đề 1 Con Đường (cần bộ từ khóa "phản đề" riêng
    cho mỗi Con Đường, KHÔNG chỉ suy luận thiếu khớp = forbidden) -> path_affinity.forbidden
  Mệnh không khớp path nào rõ ràng (nhóm trừu tượng như "Thần Đạo", "Vĩnh Đạo"...) -> để
  path_affinity = { lead: [], support: [], forbidden: [] } (rỗng cả 3, tương ứng match_score = 0,
  "Tuyệt Không" theo bảng spec mục 5.2 — ĐÚNG THIẾT KẾ, không phải lỗi, vì đây chính là nhóm
  "off-build" hợp lệ mà spec đã tính tới).
```
- Đây là bước CẦN REVIEW THỦ CÔNG NHIỀU HƠN 4.1 (vì `forbidden` sai sẽ tạo trải nghiệm khó chịu —
  người chơi bị phạt oan vì Mệnh bị gán nhầm forbidden với Con Đường họ đang đi) — khuyến nghị CHỈ
  tự động gán `lead`/`support`, để `forbidden` bắt đầu RỖNG cho toàn bộ 10.000 entry ở bản đầu tiên,
  bổ sung `forbidden` dần qua vài đợt review thay vì suy luận tự động ngay từ đầu.

### 4.3. Bảng tách `modifiers` vs `effects` từ field `effects` thật hiện có
| Key hiện có trong `effects` | Phân loại | Lý do |
|---|---|---|
| `magMult`, `phyMult`, `allStatMult` | `modifiers` | Nhân trực tiếp vào chỉ số nền, không điều kiện |
| `lifespanBonus`, `hpRegen`, `qiFlat` | `modifiers` | Cộng/trừ trực tiếp 1 giá trị tài nguyên, không điều kiện |
| `breakBonus`, `breakFailPenalty` | `effects` (điều kiện) | Chỉ áp dụng LÚC Đột Phá, không phải lúc nào cũng có tác dụng |
| `fortune`, `lootMult` | `effects` (điều kiện) | Chỉ áp dụng khi roll Khí Vận/loot, có tính xác suất |
| `sanDrainMult`, `sanResist`, `sanShield` | `effects` (điều kiện) | Chỉ kích hoạt khi có sự kiện liên quan SAN xảy ra |
| `lightFireMult` | `effects` (điều kiện) | Chỉ áp dụng khi dùng đòn thuộc tính Quang/Hỏa |
| `resistPossession` | `effects` (điều kiện) | Chỉ áp dụng khi bị 1 hiệu ứng khống chế/đoạt xá cụ thể nhắm tới |

- KHÔNG cần đổi cấu trúc data thật (`effects` object vẫn để nguyên) — chỉ cần hàm engine
  `splitFateEffects(fate)` trả về `{ modifiers: {...}, conditionalEffects: {...} }` dựa theo bảng
  trên, dùng NGAY TRONG `computeFate()`/`computeStats()` đã có, tránh phải chạy lại migration data.

---

## 5. VIỆC CẦN LÀM TIẾP (đúng thứ tự, không đảo)
1. Loại bỏ hẳn 3 file lỗi thời khỏi pipeline build/deploy (mục 1) — tránh nhầm lẫn cho dev sau này.
2. Viết 2 bảng map `GRADE_TO_TIER`/`SIGN_TO_TYPE_LABEL` (mục 3) — làm NGAY vì rẻ, chặn được lỗi so
   sánh sai ở bất kỳ chỗ nào dùng chung 2 file.
3. Chạy pass sinh `element` (mục 4.1), review mẫu, tinh chỉnh từ khóa, áp dụng toàn bộ.
4. Lấy danh sách 10 Con Đường + từ khóa chủ đề (điều kiện tiên quyết còn thiếu) → chạy pass sinh
   `path_affinity.lead/support` (mục 4.2), để `forbidden` rỗng ở bản đầu.
5. Viết hàm `splitFateEffects()` (mục 4.3) — không cần sinh lại data, code thuần.
6. SAU KHI 4 bước trên xong mới bắt đầu code Phase 1 của `FATE_SYSTEM_SPEC.md` (Equip/Unequip/
   Change/Read/Sacrifice) — vì match_score (phụ thuộc path_affinity) là điều kiện HIỂN THỊ bắt buộc
   ở mọi action theo spec mục 11.1, làm Phase 1 trước khi có `path_affinity` sẽ phải sửa lại sau.

### Source: `archive-requirements\logic-history\01-core\fate\FATE_SYSTEM_MASTER_2026-09-09.md`

# FATE SYSTEM MASTER — Canonical Implementation Contract

Tài liệu này hợp nhất các rule trong cùng thư mục (`FATE_UPDATE_SYSTEM_RULE.md`, `FATE_SYSTEM_COMPLETE.md`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_NEW_LOGIC_ADDENDUM.md`, `FATE_GRADE_WEIGHT_BY_LEVEL.md`) và `requirement/01-core/FATE_SYSTEM_SPEC.md`. Đây là bản dùng để đối chiếu runtime; các file nguồn cũ giữ lại để audit lịch sử.

## 1. Nguồn dữ liệu và bất biến

- `data/fate_data.js` là catalog canonical 10.000 Mệnh; không dùng pool legacy 1.300.
- `data/fate_relationships.js` là bảng pairwise/combo/fusion chuẩn hóa.
- `data/path_fate_relations.js` là mapping Con Đường, affinity và hidden fate.
- `GRADE_TO_TIER` và `SIGN_TO_TYPE_LABEL` trong `js/engine.js` là map duy nhất.
- `state.player.fates` là Mệnh đang kích hoạt; `state.fateInventory` là Mệnh Kho và không tạo buff/score/relationship.
- `state.player.fateInstances` lưu tiến trình từng instance; `state.pendingFateRewards` bảo toàn phần thưởng khi kho đầy.

## 2. Resolver nhận Mệnh

Mọi nguồn reward phải chọn grade trước rồi chọn đều một entry khả dụng trong grade. `rollFateByProgression` áp dụng level, cap, minimum grade, loại ID đã sở hữu và khóa Tiên; khi grade hết entry, trọng số được tái phân bổ sang grade còn khả dụng. `receiveFate` là transaction cuối: duplicate Phàm/Linh/Hoàng đổi thành Tinh Hoa Dư (1/3/8), kho đầy chuyển pending hoặc yêu cầu thay thế, không mất Mệnh âm thầm.

Reward weights canonical: cấp 1–2 `65/30/5`; 3–4 `15/45/25/10/5`; 5–6 `5/20/35/25/10/5`; 7–8 `2/10/25/30/20/10/3`; 9+ `1/5/15/25/25/18/11/0` theo thứ tự Phàm→Tiên. Tiên chỉ mở từ nguồn đặc biệt/pity và duy nhất trong world save hiện tại.

## 3. Hiệu lực, affinity và quan hệ

`fateDefinition` chuẩn hóa `sign→alignment`, `grade→tier`, `element`, `path_affinity`, đồng thời tách `effects` thành `modifiers` và `conditionalEffects`. Chỉ active fate đi qua `computeStats`, `computeFate`, `pathMatchSummary`, pairwise relationship và combo. Match 0 vẫn equip được nhưng là off-build; forbidden chỉ đến từ tag forbidden đã review.

Quan hệ nhân vật–Mệnh dùng stage 0–4: Sơ Ngộ, Đồng Hành, Tương Ứng, Cộng Minh, Nhân Mệnh Hợp Nhất. `nurtureFate` chỉ dành cho active fate, tốn `5 + stage*5` Linh Thạch và cooldown một ngày game; `resonateFate` yêu cầu stage 2, match ≥8 và 10 SAN. Insight được mở khi Ngộ Tính ≥60 hoặc stage ≥2; Hung insight tăng `forbiddenKnowledgeCount`.

## 4. Action nâng cao

- `releaseStagnantFate`: chỉ cho Mệnh active nguội ≥60 ngày, tháo trực tiếp và hoàn Tinh Hoa Dư.
- `defyFate`: Hung active, tốn 15 SAN, ghi số lần Nghịch Mệnh.
- `suppressFate`: Hung/active, tốn 8 SAN, tạm bỏ hiệu lực stat đến `untilTurn`; không xóa dữ liệu.
- `heavenlyOmen`: tốn 5 SAN, cooldown 12 turn, trả dự báo blocker đột phá từ state thật.
- `transformFate`: chỉ mở ở stage 4 và Cường Hóa +5. Công thức canonical hiện tại tái sử dụng nhánh Fate Evolution: `essence = 5 + 2×gradeTier`, `merit = 10 + 5×gradeTier`, `SAN = 10`; preview trả candidate branches và thay đổi trước/sau, commit gọi `GameExpansion.evolveFate` có xác nhận cho nhánh nguy hiểm. Không tự sinh biến thể ngoài catalog; nếu chưa có branch hợp lệ thì trả blocker.

Các action đều phải kiểm tra blocker trước khi trừ tài nguyên và chỉ ghi history sau commit thành công. Narrative không quyết định gameplay.

## 5. Migration và kiểm thử

Save cũ được chuẩn hóa về `fateInstances`, `fateRelationships`, `fateInventory`, `pendingFateRewards`, `uniqueFateOwnership` và các field action mới theo kiểu backward-compatible. API engine liên quan nằm trong `js/engine.js`; UI đọc kết quả từ engine, không tự tính affinity/score.

## 6. Đối chiếu triển khai ngày 2026-09-09

Đã có: catalog/maps, active-vault invariant, weighted resolver/fallback, duplicate essence, pending reward, equip/swap/sacrifice/fusion/upgrade, pairwise/combo, nurture/resonate, insight, stagnant release, defy, suppress, omen, transform guard, structured log và save migration. Còn mở rộng: recipe cụ thể cho Fate Transform và server đa người chơi thực sự (runtime hiện là single-save; uniqueness Tiên được khóa trong `state.meta.uniqueFateOwnership`).

Kiểm tra bắt buộc: `node --check js/engine.js`, `node --check js/ui.js`, `node tools/verify_game.js`.

### Source: `archive-requirements\logic-history\01-core\fate\FATE_UPDATE_SYSTEM_RULE.md`

# FATE UPDATE SYSTEM RULE

> Tài liệu rule canonical duy nhất cho feature FATE/Mệnh Số sau đợt hợp nhất.
> Phạm vi: dữ liệu, phẩm cấp, roll, Con Đường, quan hệ, Mệnh Kho, trang bị, phần thưởng,
> UI/action, migration và lộ trình runtime.
> Trạng thái: **rule nền tảng để triển khai**. Những phần được đánh dấu `CHỜ DUYỆT` không được tự ý code.
> Ngày hợp nhất: 2026-09-08.

---

## 0. Quy tắc ưu tiên và phạm vi nguồn

Đã đối chiếu các tài liệu FATE được chỉ định và các tài liệu hệ thống liên quan trong repository.
Khi có mâu thuẫn, dùng thứ tự sau:

1. Quyết định mới nhất của người dùng trong `FATE_GRADE_DISTRIBUTION_REVIEW.md` cho **phân bố catalog và phẩm cấp roll**.
2. Nguyên tắc schema, active/vault, action, UI, migration và acceptance trong `FATE_SYSTEM_SPEC.md`.
3. Đối chiếu schema thật và gap trong `FATE_SYSTEM_COMPLETE.md`.
4. Quan hệ Nhân Vật–Mệnh, Dưỡng Mệnh và Cộng Minh trong `FATE_RELATIONSHIP_COMPLETE.md`.
5. Duplicate, Fate Whisper, Mệnh Nguội và độc bản Tiên trong `FATE_NEW_LOGIC_ADDENDUM.md`.
6. Kỹ thuật chọn grade/fallback trong `FATE_GRADE_WEIGHT_BY_LEVEL.md`; bảng tỷ lệ cũ trong file này bị thay thế bởi bảng tại mục 3 của rule này, nhưng thuật toán fallback vẫn được giữ.
7. Wiring data/tags/element/resonance trong `prompt_wire_fate_data_to_engine.md`.
8. Các tài liệu nền khác chỉ cung cấp dependency và bối cảnh: `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`, `MASTER_GAME_REQUIREMENTS.md`, `ARCHIVE_BREAKTHROUGH_RITUAL_DETAIL.md`, `RANDOM_EVENT_SYSTEM.md`, `ACTION_HYBRID_SYSTEM.md`, `RELATIONSHIP_SYSTEM.md`, `character_creation_system.md`, `NPC_MONSTER_SYSTEM.md`, `WORLDVIEW_ATMOSPHERE.md`, `MAP_SYSTEM.md`, `UI_LAYOUT_AND_ACTION_TABLE_REQUIREMENTS.md` và các README.

Không dùng rule cũ của `fate-pool.json`, `fate-relationships.json` hoặc generator 1.300 Mệnh làm nguồn runtime.

---

## 1. Mục tiêu thiết kế

Mệnh Số là lớp tiến triển giữa nhân vật, Cảnh Giới, Con Đường và cơ duyên. Một Mệnh có thể:

- thay đổi chỉ số, tài nguyên và điểm Mệnh;
- tạo tương hợp/tương khắc với Con Đường;
- tạo quan hệ với Mệnh khác và combo/dung hợp;
- mở lựa chọn rủi ro–phần thưởng;
- được cất trong Mệnh Kho mà không tác động khi chưa kích hoạt;
- phát triển quan hệ qua hành vi, không chỉ qua việc bấm nhận EXP.

Nguyên tắc bắt buộc:

1. **Phẩm cấp không đồng nghĩa sức mạnh tuyệt đối.** Tương hợp, hiệu ứng, quan hệ và build có thể khiến Mệnh phẩm thấp hữu ích hơn Mệnh phẩm cao nhưng lệch đường.
2. **Mệnh Kho không có hiệu lực.** Chỉ Mệnh đang active mới tính stats, score, path match, quan hệ và combo.
3. **Mọi kết quả phải giải thích được.** Blocker, phẩm cấp, nguồn nhận, hiệu ứng trước/sau và giao dịch phải hiện rõ cho người chơi.
4. **Không làm mất Mệnh âm thầm.** Kho đầy dùng pending hoặc yêu cầu thay thế/giải quyết rõ ràng.
5. **Một nguồn roll chung.** Không cho từng action tự `filter(...).random()` với quy tắc riêng nếu không được nêu trong source matrix.

---

## 2. Nguồn dữ liệu canonical và schema

### 2.1. Nguồn thật

| Nguồn | Vai trò | Rule |
|---|---|---|
| `data/fate_data.js` / `window.FATE_DATA` | catalog runtime | canonical cho `id`, `name`, `sign`, `grade`, `gradeLabel`, `score`, `effects`, `desc`, và sau Gate 0 là `tags`, `element`, `resonanceEffect` |
| `data/fate_relationships.js` / `window.FATE_RELATIONSHIPS` | quan hệ Mệnh–Mệnh, combo, fusion | canonical normalized, sinh từ bộ 10.000 entry |
| `data/path_fate_relations.js` + `.json` | mapping Con Đường, hidden fate, path tags | bridge/runtime; không ghi đè catalog |
| `fate_system_update/fate_data_with_tags.json` | staging/source review | dùng để merge tags/element, không load trực tiếp trong browser |
| `fate_system_update/resonance_effects_v2.json` | staging hiệu ứng Cộng Minh | merge theo `id` vào 130 entry được chỉ định |
| `fate_system_update/grade_sign_maps.js` | map canonical | mọi code cross-schema phải dùng map này hoặc bản tương đương trong engine |
| `fate_system_update/sample_review.json` | QA mẫu | không load vào runtime |

### 2.2. Nguồn legacy không được dùng

`fate-pool.json`, `fate-relationships.json`, `generate_fate_pool.js` và tài liệu quan hệ 1.300 entry chỉ giữ tham khảo lịch sử. Chúng dùng thang Trắng/Lục/Lam/Chàm/Tím/Cam Kim/Đỏ/Cầu Vồng và không được trộn với thang Phàm→Tiên.

### 2.3. FateDefinition canonical

```js
FateDefinition {
  id: string,
  name: string,
  grade: "phan" | "linh" | "hoang" | "huyen" | "dia" | "thien" | "thanh" | "tien",
  gradeLabel: string,
  sign: "cat" | "binh" | "hung",
  alignment: "cat" | "binh" | "hung", // derived alias, không ghi đè sign
  score: number,
  tags: string[],
  element: "kim" | "moc" | "thuy" | "hoa" | "tho" | "vo_he",
  effects: object,
  modifiers: object,           // derived split, không bắt buộc lưu duplicate
  conditionalEffects: object, // derived split
  desc: string,
  resonanceEffect?: { description: string, effectType?: string, effectValue?: number }
}
```

Map duy nhất:

```js
GRADE_TO_TIER = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 }
TIER_TO_GRADE = { 1: "phan", 2: "linh", 3: "hoang", 4: "huyen", 5: "dia", 6: "thien", 7: "thanh", 8: "tien" }
SIGN_TO_TYPE_LABEL = { cat: "Cát Cách", binh: "Bình Cách", hung: "Hung Cách" }
TYPE_LABEL_TO_SIGN = { "Cát Cách": "cat", "Bình Cách": "binh", "Hung Cách": "hung" }
```

Không so sánh trực tiếp `grade` với `tier`, hoặc `sign` với `type` tiếng Việt.

### 2.4. Split effect

Các key `phyMult`, `magMult`, `allStatMult`, `lifespanBonus`, `hpRegen`, `qiFlat`, `maxQiPct`, `qiRecoveryPct`, `maxStaminaPct`, `combatDamagePct`, `cultivationSpeedPct` là modifier trực tiếp.

`breakBonus`, `breakFailPenalty`, `fortune`, `lootMult`, `sanDrainMult`, `sanResist`, `sanShield`, `lightFireMult`, `resistPossession` là conditional effect theo ngữ cảnh. Runtime vẫn có thể giữ nguyên object `effects`; `fateDefinition()` phải tách ra khi tính.

---

## 3. Phân bố catalog và trọng số roll — quyết định canonical

### 3.1. Catalog 10.000 entry

Phân bố được chốt theo `FATE_GRADE_DISTRIBUTION_REVIEW.md` và thay thế phân bố 80% cũ:

| Grade | Số entry | Tỷ lệ catalog |
|---|---:|---:|
| Phàm | 5.000 | 50,00% |
| Linh | 2.500 | 25,00% |
| Hoàng | 1.200 | 12,00% |
| Huyền | 700 | 7,00% |
| Địa | 400 | 4,00% |
| Thiên | 150 | 1,50% |
| Thánh | 49 | 0,49% |
| Tiên | 1 | 0,01% |
| **Tổng** | **10.000** | **100%** |

Catalog ratio là độ dày nội dung, không phải xác suất rơi. Mỗi lần roll phải chọn grade trước, sau đó chọn đều một entry khả dụng trong grade đó.

### 3.2. Reward grade weights theo cấp nhân vật

Bảng này là tỷ lệ canonical cho reward thông thường. Nó thay thế bảng 40/35/20/5 ở `FATE_GRADE_WEIGHT_BY_LEVEL.md` vì quyết định mới yêu cầu Phàm giảm còn 15% từ cấp 3:

| Cấp nhân vật | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–2 | 65% | 30% | 5% | 0% | 0% | 0% | 0% | 0% |
| 3–4 | 15% | 45% | 25% | 10% | 5% | 0% | 0% | 0% |
| 5–6 | 5% | 20% | 35% | 25% | 10% | 5% | 0% | 0% |
| 7–8 | 2% | 10% | 25% | 30% | 20% | 10% | 3% | 0% |
| 9+ | 1% | 5% | 15% | 25% | 25% | 18% | 11% | 0% |

Tiên không nằm trong reward thường. Nó chỉ được mở bởi nguồn đặc biệt/cốt truyện/pity đã cấu hình và vẫn phải qua khóa độc bản.

### 3.3. Modifier theo nguồn

- Combat thường: dùng bảng theo cấp, có thể lệch xuống một bậc nếu phần thưởng là bonus nhỏ.
- Elite/Boss: dùng bảng theo cấp, tăng grade cap hoặc lệch lên một bậc có giới hạn.
- Quest/cơ duyên cốt truyện: có thể đặt `minimumGrade`, nhưng phải ghi rõ trong reward definition.
- Online/AFK: ưu tiên 1–3, không tự trao Huyền+ nếu chưa qua cap của nguồn.
- Phường Thị/Công Đức: dùng bảng theo cấp nhưng có cap và giá; không khóa cứng toàn bộ vào Phàm.
- Khâm Thiên Giám: neo theo grade dominant, cơ hội +1 grade thấp, không vượt cap và không tự sinh Tiên thường.
- Hư Thiên Đỉnh: grade đầu vào và quantity quyết định cap; không roll toàn catalog mù.

---

## 4. Thuật toán roll, fallback và duplicate

### 4.1. Resolver dùng chung

Mọi nguồn mới phải gọi `rollFateByProgression(state, source, options)` hoặc API tương đương:

```js
rollFateByProgression(state, {
  source,
  gradeCap,
  minimumGrade,
  pathAffinity: true|false,
  pityKey,
  allowUniqueTien: false
})
```

Resolver thực hiện theo thứ tự:

1. xác định realm level và bảng trọng số;
2. áp dụng source modifier, cap/minimum và path affinity nếu có;
3. loại ID đã sở hữu, bị khóa độc bản hoặc không còn khả dụng;
4. nếu grade hết entry, dồn trọng số về grade liền kề thấp hơn còn entry;
5. chọn grade trước, chọn đều entry trong grade;
6. gọi `receiveFate()` để transaction vào Mệnh Kho/pending;
7. xử lý duplicate, unique lock và reward summary;
8. ghi source, grade, destination và lý do vào history.

### 4.2. Duplicate

- Không tạo instance thứ hai cùng `fateId` trên cùng nhân vật.
- Phàm/Linh/Hoàng trùng: tự chuyển thành `Tinh Hoa Dư`.
- Huyền trở lên trùng: mở lựa chọn nhận Tinh Hoa Dư hoặc giao dịch/tặng theo nguồn được phép; không tự quy đổi im lặng.
- Tiên không dùng duplicate flow thường; xử lý theo unique ownership.

### 4.3. Tiên độc bản

`than_dao_151` là entry Tiên duy nhất. Nếu có backend/server: dùng `serverUniqueFateOwnership[fateId] = characterId|null`, transaction lock trước khi trao. Nếu game single-player: dùng ownership trong world/save nhưng không giả vờ là server-wide.

Khi Tiên đã có chủ, loại khỏi mọi roll thường; UI có thể hiển thị “Đã có chủ”. Khi chủ mất Mệnh theo một luật đã được game định nghĩa, ownership mới được giải phóng. Không tự giải phóng khi chỉ reload save.

---

## 5. Active, Mệnh Kho, Fate Instance và migration

### 5.1. Luật hiệu lực

- `state.player.fates[]`: ID Mệnh đang active, tính stats/score/match/relations/combo.
- `state.fateInventory[]`: ID Mệnh trong Mệnh Kho, không tính hiệu lực.
- `pendingFateReward(s)`: phần thưởng chưa đưa vào kho vì đầy.
- Capacity = `2 × số active slots đã mở`, có migration bảo toàn dữ liệu.

Catalog là definition dùng chung; relationship stage, insight, stagnant days và timestamp là metadata của instance nhân vật, không ghi vào catalog.

Để không phá save ID hiện tại, dùng adapter:

```js
state.player.fateInstances[fateId] = {
  fateId, relationshipStage: 0, relationshipPoints: 0,
  firstAcquiredAt, lastActiveAt, lastActiveStreakDays: 0,
  stagnantDays: 0, insightRevealed: false
}
```

Nếu tương lai cho phép cùng ID nhiều instance, chuyển key sang instance ID; hiện tại duplicate bị chặn nên `fateId` là key tương thích.

### 5.2. Migration invariant

- thiếu mảng thì tạo rỗng;
- ID không tồn tại bị loại nhưng phải ghi warning;
- không mất Mệnh khi kho đầy; dùng pending;
- migration nhiều ô ↔ một ô phải giữ Mệnh mạnh nhất/được chọn và đưa phần còn lại vào kho;
- `validateFateInventory()` chạy trong `updateDerived`;
- save version 12 adapter `player.fate.vaultIds` ↔ `state.fateInventory` phải giữ nguyên.

---

## 6. Match, score, stats và tương hợp Con Đường

`match_score` độc lập với `normal_fate_score` và `total_fate_score`.

- 0: Tuyệt Không, vẫn cho trang bị nhưng là off-build;
- 1–2: Xa Lạ, có penalty/rủi ro;
- 3–4: Tương Hợp, không bonus lớn;
- 5–7: Tương Hợp Cao;
- 8–9: Tương Sinh;
- 10: Đại Đạo Tương Sinh, mở ngưỡng combo/hiệu ứng đặc biệt.

Khi có tags/path affinity, công thức nền là `3 × lead + 1 × support − 2 × forbidden`, sau đó clamp 0–10 và áp dụng rule đặc biệt của Con Đường. Không cho UI tự tính lại.

`normal_fate_score` chỉ tính Mệnh thường và modifier hợp lệ; `total_fate_score` tính quan hệ/combo/hiệu ứng đặc biệt; Mệnh Kho không đóng góp.

Gate đột phá dùng score/match theo `ARCHIVE_BREAKTHROUGH_RITUAL_DETAIL.md`: Gọi Mệnh → Đối Chiếu Con Đường → Dựng Neo → Vượt Dị Tượng → Trả Giá → Thử Thách theo cấp đích. Cấp thấp chỉ mở prefix cần thiết.

---

## 7. Quan hệ Mệnh–Mệnh và Nhân Vật–Mệnh

### 7.1. Quan hệ normalized

- `pairwise_relationships`: 13.976 cạnh hiện có;
- `combo_sets`: 150 combo;
- `fusion_recipes`: 78 công thức;
- chỉ xét Mệnh active, không xét Mệnh Kho;
- combo cũ mặc định `minRelationshipStageRequired = null` để không phá hành vi;
- mọi tier/type cross-schema đi qua map canonical.

### 7.2. Bậc quan hệ instance

| Bậc | Tên | Điều kiện |
|---:|---|---|
| 0 | Sơ Ngộ | hiệu ứng gốc |
| 1 | Đồng Hành | active qua elite/boss hoặc active liên tục 7 ngày |
| 2 | Tương Ứng | ít nhất 3 lựa chọn quest/hội thoại cùng hướng alignment khi active |
| 3 | Cộng Minh | action `RESONATE`, match ≥ 8, đủ SAN, đang active |
| 4 | Nhân Mệnh Hợp Nhất | Cộng Minh + đột phá thành công lên cấp mới khi vẫn active xuyên nghi thức |

Hiệu ứng bậc: 0 = 100%; 1 = +5% modifiers; 2 = +10% và xem potential; 3 = +20% và mở resonance effect; 4 = +35%, không tháo/hi sinh/dung hợp được nữa.

`NURTURE_FATE` chỉ chạy với active, có cost/cooldown/diminishing return; không thay thế hành vi thật. `RESONATE` chỉ trừ SAN sau khi đủ điều kiện và thực sự bắt đầu nghi thức.

Suy giảm quan hệ khi để trong Vault quá 30 ngày là **CHỜ DUYỆT**, chưa được code.

---

## 8. Bốn logic bổ sung

### 8.1. Fate Whisper

`insightRevealed=false` khi nhận. Khi `Ngoại Tính/Ngộ Tính >= 60` hoặc stage >= 2, lần đầu mở chi tiết sẽ mở diễn giải Giác Ngộ vĩnh viễn. Sinh text từ concept1/concept2; ưu tiên review thủ công nhóm Địa+ từ `resonance_effects_v2.json`/metadata. Mệnh Hung hoặc concept u ám khi reveal sẽ đánh dấu forbidden knowledge theo `WORLDVIEW_ATMOSPHERE.md`; không tạo corruption stat thứ hai.

### 8.2. Mệnh Nguội

Metadata `stagnantDays` tăng khi active liên tục nhưng stage không đổi. Từ 60 ngày game, chỉ hiển thị cảnh báo và mở action “Buông Mệnh”; không debuff tự động. Buông trả về Tinh Hoa Dư, không mất phí. Ngưỡng 60 ngày vẫn cần playtest nhưng là default rule được ghi nhận.

### 8.3. Tinh Hoa Dư

Là kết quả duplicate hoặc Buông Mệnh, dùng cho Dưỡng Mệnh và/hoặc Hư Thiên Đỉnh sau khi chốt tỷ lệ quy đổi. Không được tự tạo tài nguyên nếu transaction nhận thưởng thất bại.

### 8.4. Unique Tiên

Tuân mục 4.3. Không dùng tỷ lệ Tiên 1% trong reward thường dù một số tài liệu cũ từng đề xuất; chỉ nguồn đặc biệt được phép mở khóa.

---

## 9. Nguồn nhận Mệnh Số và contract

| Nguồn | Contract canonical |
|---|---|
| Khởi tạo | 5 Mệnh không trùng, tổng điểm > 5, cap cao nhất Hoàng; dùng 65/30/5 riêng |
| Con Đường | quà tương hợp, đưa vào Vault/pending, không tự active |
| Combat elite/boss | resolver theo cấp + source modifier, history phải báo phẩm và điểm đến |
| Search/Map clue | reward chuẩn, pending khi kho đầy; có merit nếu tài liệu event quy định |
| Quest/Cơ Duyên | reward definition có thể có cap/minimum, không roll mù |
| Online/AFK | theo cấp hiện tại và interval game clock; reward summary rõ destination |
| Phường Thị | refresh 60 giây theo market state, giá theo grade/source; không hardcode chỉ Phàm |
| Công Đức | offer theo quan hệ/grade/cap, đổi trực tiếp phải chống trùng |
| Khâm Thiên Giám | fixed 10 năm hoặc 1/10 thọ nguyên, neo dominant grade, cơ hội +1 thấp |
| Hư Thiên Đỉnh | nhận quantity thật, lọc material an toàn, cap theo số lượng/phẩm nguyên liệu, rollback |
| Luân Hồi | giữ một Mệnh mạnh nhất theo luật hiện hành, không reset nhầm unique ownership |

Các event `RANDOM_EVENT_SYSTEM.md` có reward Mệnh phải gọi cùng resolver; không dùng thang tier legacy. NPC Nghịch Thương Nhân cấp 6–8 nếu giữ feature phải dùng grade `thien/thanh/tien` theo map canonical, giá và điều kiện riêng, không tự chuyển sang tier cũ.

---

## 10. Action, UI và transaction

Action chuẩn: `EQUIP_FATE`, `UNEQUIP_FATE`, `READ_FATE/QUAN_MENH`, `CHANGE_FATE`, `SACRIFICE_FATE`, `FUSE_FATE`, `NURTURE_FATE`, `RESONATE`.

Action phase 3 `DEFY_FATE`, `SUPPRESS_FATE`, `HEAVENLY_OMEN`, `FATE_TRANSFORM` chỉ là roadmap **CHỜ DUYỆT**, không giả vờ hoạt động.

UI bắt buộc:

- thẻ active hiển thị grade, sign, match, normal/total score, modifiers, conditional effects, stage và trạng thái Nguội;
- thẻ Vault hiển thị rõ “không cộng stats”, nguồn nhận, grade và nút trang bị/thay thế;
- khi active đầy, cho tháo/thay thế có preview before/after;
- upgrade phải báo vật liệu đã trừ, level trước/sau, score/effect trước/sau;
- merge/dung luyện hiển thị quantity thật, không đếm mỗi loại là 1;
- pending reward luôn có nút nhận/thay thế/từ chối với hậu quả rõ;
- action bị khóa hiển thị blocker ngay cạnh nút;
- mọi action nguy hiểm có confirm và rollback transaction.

Action Hybrid dùng `fate_token`/Mệnh Kho tách khỏi inventory vật lý, nhưng dùng chung resolver UI theo context. Không để UI map grade/type riêng.

---

## 11. Lộ trình triển khai

### Gate 0 — data và schema

1. QA `fate_data_with_tags.json`, `sample_review.json`, element/tags coverage.
2. Tạo catalog 10.000 entry theo bảng 50/25/12/7/4/1,5/0,49/0,01; giữ ID ổn định.
3. Merge resonanceEffect đúng ID; chuẩn hóa object số nếu cần.
4. Kiểm tra relationships không trỏ ID thiếu; map grade/tier/sign/type.
5. Sinh report count/duplicate/unique Tiên trước khi thay file runtime.

### Phase 1 — runtime roll và migration

1. Implement resolver chọn grade trước rồi entry.
2. Chuyển combat/map/quest/online/market/merit/cauldron qua resolver hoặc contract riêng đã quy định.
3. Duplicate, pending, fallback và unique lock.
4. Save migration và invariant tests.

### Phase 2 — relationship/UI

1. Fate instance metadata/stage.
2. Nurture/resonate, resonanceEffect, Fate Whisper, Mệnh Nguội.
3. Preview/transaction/UI đồng bộ.

### Phase 3 — mở rộng sau khi duyệt

Chỉ triển khai sau approval riêng cho từng action: Nghịch Mệnh, Trấn Mệnh, Thiên Cơ, Mệnh Đổi và suy giảm stage trong Vault.

---

## 12. Test và acceptance

- Catalog đúng 10.000 entry và đúng bảng grade mới; Tiên đúng 1 entry.
- Không ID duplicate; relationships/combo/fusion đều trỏ ID tồn tại.
- Save cũ load được, active/Vault/pending/enhancement/relationship metadata không mất.
- Mệnh Kho không thay đổi stats, score, match hoặc combo.
- Roll grade qua seed/Monte Carlo tối thiểu 100.000 lượt mỗi bucket; sai số không quá ±1 điểm phần trăm.
- Cấp 3–4 không còn sampling mặc định 80% Phàm; target canonical là 15% Phàm ở reward thường.
- Tiên không rơi từ reward thường và unique lock không race/duplicate.
- Duplicate Phàm–Hoàng chuyển Tinh Hoa Dư; Huyền+ có lựa chọn.
- Hư Thiên Đỉnh tính đúng quantity và rollback khi nhận Mệnh thất bại.
- UI hiển thị before/after, blocker, source, grade, destination và trạng thái pending.
- `node --check js/engine.js`, `node --check js/ui.js`, `node --check js/main.js`, `node tools/verify_game.js`, `git diff --check` đều đạt.

---

## 13. Các điểm không được tự ý quyết định

- Không dùng lại bảng 80% catalog như tỷ lệ loot.
- Không lấy bảng 40/35/20/5 cũ làm canonical sau khi người dùng đã chốt giảm Phàm.
- Không code Phase 3 khi chưa có approval riêng.
- Không tự bật suy giảm relationship stage trong Vault.
- Không tạo 10.000 resonance effect thủ công; dùng data staging và ưu tiên nhóm Địa+.
- Không xóa hoặc đổi ID đã có trong save để đạt tỷ lệ mới.
- Không đưa file trong `fate_system_update/` trực tiếp vào browser nếu chưa build thành runtime asset.

**Đây là rule chính cho mọi task FATE_UPDATE_SYSTEM tiếp theo. Mọi thay đổi code/data phải đối chiếu file này và cập nhật rule nếu làm thay đổi quyết định canonical.**

---

## 14. Chiến lược thay đổi catalog và phương án regrade trực tiếp

Phần này bổ sung phương án triển khai để AI không tự overwrite dữ liệu cũ khi thay đổi phân bố phẩm cấp.

### 14.1. Phương án 1 — giữ catalog, chỉ đổi trọng số roll

Giữ nguyên `data/fate_data.js`, ID, grade, effect và relationship. Thêm resolver chọn grade theo bảng mục 3.2. Đây là phương án an toàn mặc định và không cần migration save.

### 14.2. Phương án 2 — catalog versioning v1/v2

Giữ catalog v1 cho save cũ, tạo catalog v2 và relationship v2 cho nhân vật/world mới:

```text
data/fate_data_v1.js
data/fate_relationships_v1.js
data/fate_data_v2.js
data/fate_relationships_v2.js
state.meta.fateCatalogVersion = 1 | 2
```

ID v1 không bị tái sử dụng cho entry có nghĩa mới. Engine chọn catalog theo version của save/world. Đây là phương án phù hợp khi muốn thay đổi nội dung lớn nhưng vẫn bảo toàn save cũ.

### 14.3. Phương án 3 — regrade trực tiếp catalog hiện tại (controlled migration)

Phương án này **được phép triển khai trong tương lai**, nhưng không được chạy trực tiếp trên working tree/live data. Nó chỉ được thực hiện sau khi hoàn tất toàn bộ Phase 3 dưới đây và có snapshot rollback.

Mục tiêu là đưa catalog hiện tại về phân bố 10.000 entry:

```text
Phàm 5.000 · Linh 2.500 · Hoàng 1.200 · Huyền 700
Địa 400 · Thiên 150 · Thánh 49 · Tiên 1
```

#### Quy tắc bất biến

1. Không đổi `id` của bất kỳ entry nào.
2. Không đổi `name`, `effects`, `score`, `desc`, `sign` nếu không có migration record riêng.
3. Không chuyển grade tùy tiện các Mệnh đã được người chơi sở hữu mà chưa có chính sách bù/giữ quyền lợi.
4. Không xóa entry đang được tham chiếu trong active, Vault, pending reward, quest, combo, fusion hoặc relationship.
5. Entry Tiên duy nhất vẫn phải là cùng một ID `than_dao_151` và luôn qua unique lock.
6. Mọi thay đổi grade phải có `fate_regrade_manifest.json` ghi `id`, `oldGrade`, `newGrade`, `reason`, `affectedSystems`, `rollbackGrade`.

#### Cách thực hiện regrade

- Tạo snapshot bất biến của `fate_data.js`, `fate_relationships.js`, path mapping và mọi save trước khi chạy.
- Tính chênh lệch số lượng theo grade; chỉ chọn các entry chưa từng xuất hiện trong save production để chuyển grade trước.
- Nếu vẫn thiếu quota, chuyển các entry phổ thông chưa có quan hệ đặc biệt; không chuyển entry có `fusion`, `combo`, `hidden fate`, `resonanceEffect` hoặc đang được quest tham chiếu nếu chưa regenerate dependency.
- Ưu tiên chuyển theo thứ tự Phàm → Linh → Hoàng → Huyền → Địa → Thiên → Thánh; không tự tạo thêm Tiên.
- Khi chuyển grade, cập nhật `gradeLabel` và mọi chỉ mục/cache theo grade; giữ nguyên ID và các field gameplay khác.
- Regenerate hoặc migrate `pairwise_relationships`, `combo_sets`, `fusion_recipes` nếu dependency dùng tier/grade của entry bị chuyển.
- Recalculate các bảng offer/market/merit/cauldron không lưu cứng kết quả cũ.
- Với save cũ, ghi `state.meta.fateRegradeVersion` và áp dụng chính sách compensation đã duyệt; không âm thầm làm giảm Mệnh đang active.

#### Chính sách người chơi khi entry đang sở hữu bị regrade

Mặc định chọn **grandfathering**: instance đã sở hữu giữ `effectiveGradeAtAcquisition`, còn catalog mới dùng grade mới cho những lần roll sau. Nếu muốn đồng bộ grade mới cho instance cũ, phải chọn một chính sách rõ ràng trước rollout:

- giữ nguyên chỉ số/grade cũ vĩnh viễn;
- cập nhật grade và bù Tinh Hoa Dư/nguyên liệu tương ứng;
- đóng băng instance cũ thành legacy definition, chỉ entry mới dùng catalog mới.

Không được trộn các chính sách trong cùng một world.

---

## 15. Phase 3 — kế hoạch triển khai regrade trực tiếp

Phase 3 chỉ áp dụng cho Phương án 3. Nếu chưa được bật cờ rollout, hệ thống tiếp tục dùng Phương án 1 hoặc 2.

### Phase 3.0 — khóa thay đổi và snapshot

1. Freeze catalog/relationship/save trong lúc tạo migration.
2. Tạo snapshot có checksum SHA-256 cho `fate_data.js`, `fate_relationships.js`, path mapping và toàn bộ save production.
3. Tạo `fate_regrade_manifest.json`, `fate_regrade_report.json` và thư mục rollback chỉ đọc.
4. Gán `catalogVersion`, `regradeVersion` và `migrationRunId`; mọi kết quả phải truy vết được.

### Phase 3.1 — phân tích dependency

1. Index toàn bộ reference tới `fateId` trong active, Vault, pending, quest, market, black market, merit, combo, fusion, hidden fate, relationship và sample save.
2. Phân loại entry: `owned`, `referenced`, `special`, `free`.
3. Chỉ nhóm `free` được chuyển grade tự động. Nhóm còn lại phải có mapping và compensation.
4. Kiểm tra tổng quota mới đúng 10.000 và Tiên đúng 1.

### Phase 3.2 — lập kế hoạch chuyển grade

1. Tính `deltaByGrade = targetCount - currentCount`.
2. Chọn ứng viên theo deterministic seed để chạy lại cho cùng kết quả.
3. Ưu tiên entry chưa sở hữu, không có dependency quan hệ đặc biệt và không có effect duy nhất.
4. Sinh manifest trước, chưa ghi đè catalog.
5. Sinh preview report: count trước/sau, danh sách ID đổi grade, dependency bị ảnh hưởng và compensation dự kiến.
6. Dừng Phase 3 nếu có ID active/pending bị mất, score/effect bị thay đổi ngoài manifest hoặc quota không khớp.

### Phase 3.3 — migrate catalog và relationship

1. Áp dụng manifest lên bản sao catalog.
2. Cập nhật `gradeLabel`, grade index và các bảng roll/cache.
3. Kiểm tra lại `GRADE_TO_TIER`/`TIER_TO_GRADE` và mọi combo/fusion có tier cũ.
4. Regenerate relationship output từ catalog sau regrade hoặc tạo migration map tương ứng; không trộn output v1/v2.
5. Chạy schema audit: ID tồn tại, không duplicate, sign hợp lệ, effect hợp lệ, Tiên duy nhất.

### Phase 3.4 — migrate save và compensation

1. Load save vào bản sao, không mutate file gốc.
2. Gắn `fateRegradeVersion` và `effectiveGradeAtAcquisition` theo chính sách đã duyệt.
3. Bảo toàn active/Vault/pending/enhancement/relationship stage.
4. Nếu grade instance bị giảm, bù Tinh Hoa Dư hoặc vật liệu theo manifest; không giảm im lặng tổng quyền lợi.
5. Validate rồi mới ghi save migrated; save lỗi được đưa vào quarantine để rollback thủ công.

### Phase 3.5 — kiểm thử và rollout

1. Chạy unit test migration trên save rỗng, save cũ, save có Mệnh active/Vault/pending, save có duplicate và save có Tiên.
2. Chạy relationship/combo/fusion audit sau regrade.
3. Chạy Monte Carlo reward theo cấp và kiểm tra bảng mục 3.2 không bị catalog size lấn át.
4. Canary rollout trên một world/save thử nghiệm; theo dõi lỗi resolve ID, reward, stats và UI.
5. Chỉ rollout production sau khi checksum, report và canary đạt acceptance.

### Phase 3.6 — rollback

Rollback ngay nếu có mất ID, sai quota, thay đổi stats ngoài manifest, relationship trỏ ID thiếu, unique Tiên bị nhân bản hoặc save không load được.

1. Tắt cờ `regradeEnabled`.
2. Khôi phục catalog/relationship từ snapshot checksum.
3. Khôi phục save từ snapshot hoặc chạy reverse manifest theo `rollbackGrade`.
4. Xóa cache/index sinh sau migration.
5. Ghi incident report và không chạy lại cùng manifest cho tới khi nguyên nhân được sửa.

### Phase 3 acceptance

- Catalog đúng 10.000 entry theo bảng 50/25/12/7/4/1,5/0,49/0,01.
- Không đổi ID và không có reference tới ID thiếu.
- Active/Vault/pending/enhancement/relationship của save cũ không mất.
- Mọi regrade có manifest và compensation hoặc grandfathering rõ ràng.
- Relationship/combo/fusion sau migration nhất quán với tier mới.
- Tiên vẫn chỉ có một entry và unique lock không bị bypass.
- Rollback phục hồi được catalog và save về checksum trước migration.

**Phase 3 là kế hoạch triển khai, không phải lệnh chạy ngay. AI chỉ được thực hiện sau khi có approval rollout rõ ràng cho Phương án 3.**

---

## 16. Audit dữ liệu và runtime thực tế — 2026-09-08

Phần này là trạng thái kiểm chứng trực tiếp trong workspace. Nó phân biệt **đang có thật**, **đang staging** và **mới là rule thiết kế**.

### 16.1. Catalog runtime hiện tại

`data/fate_data.js` hiện có đúng 10.000 entry, nhưng vẫn là phân bố cũ:

```text
phan 8000 · linh 1500 · hoang 250 · huyen 120
dia 70 · thien 50 · thanh 9 · tien 1
```

Catalog runtime hiện chỉ có các field:

```text
id, name, sign, grade, gradeLabel, score, effects, desc
```

Chưa có trực tiếp `tags`, `element` hoặc `resonanceEffect`.

`fate_system_update/fate_data_with_tags.json` có đủ 10.000 ID khớp catalog runtime, nhưng vẫn mang phân bố cũ 80/15/2,5/...; đây là staging data, chưa được nạp trong `index.html`. Audit staging ghi nhận:

- `tags` trống ở 1.266/10.000 entry;
- 36 tag khác nhau;
- element: `vo_he` 7.938, `tho` 762, `kim` 400, `moc` 300, `thuy` 300, `hoa` 300;
- dữ liệu tags có false-positive keyword đã được ghi trong prompt wiring, phải review trước production.

`sample_review.json` có 15 mẫu QA; `resonance_effects_v2.json` có 130 entry, đúng các grade `dia/thien/thanh/tien` (70/50/9/1), chưa merge vào runtime.

### 16.2. Quan hệ và mapping

`data/fate_relationships.js` là output hiện tại từ `fate_data_10000`:

- 13.976 `pairwise_relationships`;
- 13.874 `TUONG_SINH`, 102 `TUONG_KHAC`;
- 150 `combo_sets`;
- 78 `fusion_recipes`;
- audit ID: không có pair/combo/material/result trỏ tới ID thiếu.

Quan hệ dùng `tier` số và `type` nhãn, trong khi catalog dùng `grade` và `sign`; engine bắt buộc qua map canonical. Không được regenerate quan hệ từ catalog 50% nếu chưa có manifest/review vì thay đổi grade có thể làm đổi tier điều kiện combo/fusion.

`data/path_fate_relations.json` có 10 Con Đường ràng buộc và `ngoai_dao_gia` unbound; mỗi path có `lead/support/forbidden`. File runtime `.js` là bridge được index nạp. `fate_data_with_tags.json` chưa được nối vào bridge nên hiện engine vẫn suy luận tags từ name/type/effects/desc và element bằng keyword fallback.

### 16.3. Cảnh giới, save và schema thật

- `data/canh_gioi_tien_hiep.json` là nguồn chuẩn 14 cấp phẳng, từ `di_menh` đến `dao_ngoai`.
- Cấp 3 là `dung_thai`, cấp 4 `kim_an`, cấp 5 `anh_linh`, cấp 6 `than_tinh`; cấp 7 bắt đầu có `minNormalFate`.
- Save runtime version 12 lưu `player.fate.equippedIds`, `vaultIds`, `vaultCapacity`, `total`, `normal`, `ratioR`, `debt`, `surplus`, `pacts`, `enhancements`; engine adapter chuyển `vaultIds` thành `state.fateInventory`.
- Save hiện chưa có metadata đầy đủ `fateInstances`, `relationshipStage`, `insightRevealed`, `stagnantDays` hoặc `effectiveGradeAtAcquisition`; Phase 2 phải migration bổ sung mà không phá format version 12.
- Save mẫu hiện có `than_dao_151`; migration unique lock phải grandfather chủ sở hữu hiện tại, không invalid một save hợp lệ.

### 16.4. Runtime đang thiếu so với rule

Các điểm sau **chưa được coi là đã triển khai** chỉ vì tài liệu đã mô tả:

1. Chưa có resolver chọn grade trước rồi entry; combat, map clue và online còn lọc pool rồi chọn đều.
2. `processOnlineFateReward()` hiện cap tối đa tier 3 và chưa dùng bảng reward canonical theo cấp.
3. `receiveFate()` chống duplicate bằng cách từ chối; chưa có Tinh Hoa Dư/duplicate policy.
4. Chưa có server-wide unique ownership cho Tiên.
5. `mergeFates()` hiện chỉ có rank đến Thiên và chọn pool ngẫu nhiên; chưa phải fusion recipe normalized đầy đủ.
6. `fateDefinition()` đã có split effects, map sign/grade, element/path fallback; nhưng chưa đọc staging tags/element/resonanceEffect.
7. Quan hệ `nurture/resonate` có nền runtime nhưng metadata instance, điều kiện/hiệu ứng theo rule cần audit lại trước khi bật production.
8. Các offer market/merit/black market và cauldron còn có filter grade riêng; phải đưa vào source matrix/resolver khi triển khai Phase 1.

### 16.5. Quyết định data migration sau audit

Do catalog 50% chưa tồn tại trong runtime và save đã có ID thật, mặc định triển khai là **Phương án 1 — giữ catalog cũ, áp dụng reward weights trước**. Phương án 3 chỉ được chạy qua Phase 3 controlled migration, không overwrite trực tiếp.

Nếu chấp thuận catalog 50% về sau:

- phải chọn rõ Phương án 2 hoặc 3;
- không dùng `fate_data_with_tags.json` staging làm catalog production nguyên trạng vì nó vẫn là phân bố 80%;
- phải merge tags/element/resonance sau QA, rồi mới build catalog target;
- relationship output phải gắn `catalogVersion` và được audit lại;
- save có Tiên/grade cũ phải grandfather hoặc compensation theo manifest.

---

## 17. Checklist chuẩn hóa trước khi code FATE_UPDATE_SYSTEM

### Gate A — dữ liệu

- [ ] Chốt Phương án 1, 2 hoặc 3; không vừa đổi weights vừa regrade mà không version.
- [ ] Catalog target 50/25/12/7/4/1,5/0,49/0,01 có report count.
- [ ] Tags/element đạt coverage đã duyệt; review false-positive và 1.266 tag trống.
- [ ] 130 `resonanceEffect` match ID và có schema effect rõ ràng.
- [ ] Relationship audit giữ 13.976/150/78 hoặc có manifest thay đổi.
- [ ] Path mapping 10 path + unbound được giữ nguyên.

### Gate B — engine

- [ ] Resolver grade-first/source-aware và fallback khi grade hết.
- [ ] Tất cả nguồn nhận Mệnh dùng source matrix.
- [ ] Duplicate/Tinh Hoa Dư/pending/unique lock có transaction.
- [ ] `fateDefinition()` là API duy nhất cho grade/sign/element/path/effects.
- [ ] Mệnh Kho không ảnh hưởng stats/score/match/combo.

### Gate C — save/UI

- [ ] Adapter save v12 giữ nguyên equipped/vault/enhancements.
- [ ] Metadata instance có default/migration rõ ràng.
- [ ] Save đang sở hữu `than_dao_151` không bị mất hoặc bị khóa sai.
- [ ] UI hiển thị source, grade, score, match, effect before/after và pending.
- [ ] Upgrade/merge/cauldron xử lý quantity và rollback.

### Gate D — test

- [ ] Schema/ID/relationship audit.
- [ ] Monte Carlo theo cấp và source, không bị catalog size lấn át.
- [ ] Test 14 cấp, 10 path, Ngoại Đạo Giả, duplicate, pending, unique Tiên và save cũ.
- [ ] `node --check` cho engine/UI/main và `node tools/verify_game.js`.

**Audit này là phần bổ sung bắt buộc của rule: tài liệu thiết kế không được coi là bằng chứng runtime đã hoàn thành.**

## 18. PHASE 3 NORMALIZATION STATUS (2026-09-08)

- [x] Phương án 3 đã chạy với manifest `phase3-20260908` và backup rollback.
- [x] Runtime catalog và staging catalog cùng đạt 10.000 entry theo tỷ lệ 50/25/12/7/4/1,5/0,49/0,01.
- [x] ID runtime/staging khớp 100%; tags, element và 130 resonance effects đã được hợp nhất.
- [x] Relationship audit giữ 13.976 pairwise, 150 combo và 78 fusion; không có reference ID hỏng.
- [x] Resolver grade-first đã nối vào online, map clue, combat, breakthrough, Qintian, cauldron và fusion.
- [x] Duplicate/Tinh Hoa Dư, unique Tiên, metadata instance, save migration và UI source/essence đã được triển khai.
- [x] `index.html` chỉ load catalog/relationship/path bridge runtime; staging và backup không được load.
- [x] Legacy generators chuyển output sang `fate_system_update/generated/`, không còn ghi đè catalog runtime.
- [x] Đã chạy schema/ID audit, `node --check` và `node tools/verify_game.js`.

### Source: `archive-requirements\logic-history\01-core\fate\prompt_wire_fate_data_to_engine.md`

CONTEXT: Cổ Dị Diện — hệ thống Fate/Mệnh Số. Đã có sẵn `FATE_SYSTEM_SPEC.md` (chuẩn gốc),
`FATE_SYSTEM_COMPLETE.md`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_NEW_LOGIC_ADDENDUM.md` (bổ sung
mới). Đính kèm 4 file DATA THẬT đã sinh sẵn, cần nối vào engine — KHÔNG cần sinh lại, chỉ cần code
phần đọc/dùng chúng đúng cách.

============================================================
FILE ĐÍNH KÈM — Ý NGHĨA TỪNG FILE
============================================================
1. `grade_sign_maps.js` — export `GRADE_TO_TIER`, `TIER_TO_GRADE`, `SIGN_TO_TYPE_LABEL`,
   `TYPE_LABEL_TO_SIGN`. Import module này ở MỌI nơi engine cần so sánh/tra cứu chéo giữa
   `data/fate_data.js` (dùng `grade` string) và `fate_relationships.js` (dùng `tier` số + `type`
   nhãn đầy đủ) — thay thế MỌI đoạn code đang tự so sánh 2 field này bằng cách khác.

2. `fate_data_with_tags.json` — bản `fate_data.js` gốc đã bổ sung 2 field MỚI trên toàn bộ 10.000
   entry: `tags: string[]` (dùng để tính `match_score` với Con Đường theo đúng công thức
   `3×lead + 1×support - 2×forbidden` đã có) và `element: "kim"|"moc"|"thuy"|"hoa"|"tho"|"vo_he"`.
   Việc cần làm: THAY THẾ `data/fate_data.js` hiện tại bằng nội dung file này (giữ nguyên format
   `window.FATE_DATA = [...]`, chỉ cần export lại đúng cú pháp cũ).
   LƯU Ý CHẤT LƯỢNG DATA: field `tags` sinh bằng keyword-matching trên `desc`, đạt 87.3% coverage,
   NHƯNG có false-positive do đồng âm tiếng Việt (VD "sinh" trong "bẩm sinh" bị nhận nhầm thành tag
   chủ đề "sinh trưởng"). Trước khi dùng production, cần 1 pass review thủ công ít nhất cho các
   Mệnh grade Huyền trở lên (190 entry) — xem `sample_review.json` để biết dạng lỗi cụ thể.

3. `resonance_effects_v2.json` — hiệu ứng ẩn độc quyền bậc Cộng Minh (mục 4
   `FATE_RELATIONSHIP_COMPLETE.md`) cho 130 Mệnh Địa Phẩm trở lên, sinh CỤ THỂ theo đúng
   concept1/concept2 parse từ `desc` gốc (không phải template chung chung theo element). Việc cần
   làm: thêm field `resonanceEffect` (string) vào ĐÚNG 130 entry tương ứng trong `fate_data.js`
   (match theo `id`), dùng làm nội dung hiển thị + hiệu ứng khi `relationshipStage` đạt bậc 3.
   Field `resonanceEffect` hiện là TEXT MÔ TẢ + SỐ ĐỀ XUẤT — cần tự parse số trong chuỗi hoặc viết
   lại thành object có field số riêng (`{ description, effectValue, effectType }`) nếu engine cần
   xử lý số trực tiếp thay vì chỉ hiển thị text.

4. `sample_review.json` — 15 entry ngẫu nhiên để QA/dev tự đối chiếu chất lượng tags/element trước
   khi merge toàn bộ, không cần đưa vào engine.

============================================================
VIỆC CẦN CODE (theo đúng thứ tự)
============================================================
1. Import `grade_sign_maps.js` vào engine, thay thế mọi so sánh grade/tier hoặc sign/type thủ công
   hiện có bằng 2 bảng map này.
2. Merge `fate_data_with_tags.json` vào `data/fate_data.js` (thay thế hoàn toàn hoặc merge field
   theo `id` nếu engine đã có thêm field khác từ trước cần giữ lại).
3. Viết hàm `computeMatchScore(characterActiveTags, pathId)` dùng bảng 10 Con Đường (lead/support/
   forbidden tags) đã có sẵn trong tài liệu hệ thống hợp nhất — trả về số theo đúng công thức
   `3×lead + 1×support - 2×forbidden`.
4. Merge `resonanceEffect` từ `resonance_effects_v2.json` vào 130 entry tương ứng trong
   `fate_data.js` theo `id`.
5. Code 4 logic mới ở `FATE_NEW_LOGIC_ADDENDUM.md`:
   - Xử lý Mệnh trùng lặp (mục 1) — convert "Tinh Hoa Dư" hoặc hỏi người chơi tùy grade.
   - Giác Ngộ Ẩn (mục 2) — field `insightRevealed`, điều kiện Ngộ Tính/relationshipStage.
   - Mệnh Nguội (mục 3) — field `stagnantDays`, action "Buông Mệnh".
   - Khóa độc bản grade `tien` (mục 4) — bảng `serverUniqueFateOwnership` ở tầng server.
6. Code hệ quan hệ Nhân Vật↔Mệnh bậc 0-4 đầy đủ theo `FATE_RELATIONSHIP_COMPLETE.md` mục 2-4
   (nếu chưa có) — ĐÂY LÀ ĐIỀU KIỆN TIÊN QUYẾT để bước 5 (Giác Ngộ/Mệnh Nguội) hoạt động, vì cả 2
   đều phụ thuộc `relationshipStage`.

============================================================
CẦN XÁC NHẬN TRƯỚC KHI CODE (KHÔNG tự ý quyết định)
============================================================
- Phase 3 (`DEFY_FATE`/`SUPPRESS_FATE`/`HEAVENLY_OMEN`/`FATE_TRANSFORM`, mục 6
  `FATE_RELATIONSHIP_COMPLETE.md`): hiện CHỈ là phác thảo tham khảo, CHƯA duyệt — KHÔNG code phần
  này cho tới khi có xác nhận rõ ràng từng action muốn giữ/bỏ/sửa gì.
- Cơ chế suy giảm bậc quan hệ khi vault lâu (mục 2.4 `FATE_RELATIONSHIP_COMPLETE.md`) — đề xuất,
  chưa chốt có áp dụng hay không.
- Ngưỡng số cụ thể ở mục 5 `FATE_NEW_LOGIC_ADDENDUM.md` (60 ngày Mệnh Nguội, ngưỡng grade convert
  Tinh Hoa Dư) — placeholder hợp lý, cần cân bằng qua playtest thật, không lấy làm số cuối cùng.

### Source: `archive-requirements\logic-history\01-core\FATE_PHASE3_ADVANCED_ACTION_CANONICAL_2026-09-17.md`

# Fate Phase 3 — Canonical Advanced Actions

## Scope

Nghịch Mệnh, Trấn Mệnh, Thiên Cơ và Mệnh Đổi là action vận hành trên instance Mệnh đang sở hữu/kích hoạt. Chúng không sửa catalog Fate, không tự cộng lại enhancement, relationship hoặc evolution effect.

## Canonical action catalog

| Action | Scope | Cost | Điều kiện | Output |
|---|---|---|---|---|
| `nghichMenh` | một Fate | 15 Thanh Tỉnh | Fate đang kích hoạt và là Hung Cách | tăng một use, tối đa 5; mỗi use đóng góp 0.03 all-stat multiplier, tối đa 0.15 |
| `tranMenh` | một Fate | 8 Thanh Tỉnh | Fate đang kích hoạt | suppression trong 3 turn mặc định; không xóa Fate hay relationship |
| `thienCo` | toàn nhân vật | 5 Thanh Tỉnh | hết cooldown | soi trạng thái đột phá; cooldown 12 turn |
| `menhDoi` | một Fate | 5 + 2×gradeTier Mệnh Tinh Hoa, 10 + 5×gradeTier Công Đức, 10 Thanh Tỉnh | Fate active, relationship stage 4, enhancement +5 | ủy quyền cho Fate evolution branch đã preview và xác nhận |

`GameEngine.fateAdvancedActionCatalog()` là nguồn policy duy nhất cho scope, cost và giới hạn. Runtime record dùng `fateAdvancedActions`; Fate-specific action nằm dưới Fate ID, `thienCo` duy nhất nằm dưới `_global`.

## Invariant chống cộng kép

- `effectSource` của mọi record phải là `advanced_fate_action`.
- `nghichMenh` chỉ đọc use từ `fateAdvancedActions[fateId].nghichMenh`; không cộng thêm một nguồn thứ hai từ `fateDefiance`.
- `tranMenh` chỉ tạo suppression tạm thời; khi hết turn, effect trở lại qua cùng pipeline.
- `menhDoi` chỉ ghi branch/use sau khi `evolveFate` commit thành công; preview không tiêu hao tài nguyên.
- Deserialize giữ nguyên namespace và số use; validator từ chối scope/action không hợp lệ, use âm/vượt cap, hoặc branch không phải chuỗi.

## Regression bắt buộc

1. Gọi đủ bốn action tạo đúng namespace record.
2. Nghịch Mệnh quá 5 lần bị giới hạn effect.
3. Trấn Mệnh hết thời gian thì effect phục hồi.
4. Thiên Cơ bị chặn trong cooldown.
5. Mệnh Đổi preview không thay đổi state; commit chỉ ghi advanced record khi evolution thành công.
6. `validateExpansionState` phải báo lỗi nếu save chứa advanced action sai namespace hoặc sai `effectSource`.

## Chưa hoàn thiện

- Cân bằng cost và multiplier vẫn cần playtest dài hạn; schema đã chốt, nhưng balance không thể chứng minh chỉ bằng unit test.
- UI hiện đã có entry point cho các action, nhưng cần visual QA trên trình duyệt thật để xác nhận hiển thị blocker/cost nhất quán.


### Source: `archive-requirements\logic-history\01-core\FATE_SYSTEM_SPEC.md`

# FATE SYSTEM SPEC

> Bản canonical triển khai hợp nhất hiện tại: `requirement/01-core/fate/FATE_SYSTEM_MASTER_2026-09-09.md`. Các trạng thái “Chưa có” bên dưới là snapshot audit cũ; khi đối chiếu runtime hãy ưu tiên master mới nhất.

> Đặc tả canonical cho hệ thống Mệnh Số (Fate System).  
> Nguồn hợp nhất: `New Text Document.txt`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_SYSTEM_COMPLETE.md` · Cập nhật: 2026-09-07.

> **Trạng thái:** Bản đặc tả để review trước khi triển khai. Ba file FATE là một bộ spec nền tảng;
> chưa được xem là đã triển khai runtime chỉ vì có mô tả trong tài liệu.

## 1. Mục đích và phạm vi

Mệnh Số là lớp tiến triển nằm giữa nhân vật, Con Đường và cơ duyên. Một Mệnh Số có thể:

- thay đổi chỉ số và điểm Mệnh Số của nhân vật;
- tạo tương hợp/tương khắc với Con Đường và các Mệnh Số khác;
- mở ra lựa chọn rủi ro–phần thưởng;
- được cất giữ để dùng trong tương lai nhưng không tác động khi chưa kích hoạt.

Spec này mô tả dữ liệu, luật tính, hành động, UI, giao dịch, lưu game, tiêu chí nghiệm thu và lộ trình. Các nhãn trong bảng đối chiếu:

| Nhãn | Ý nghĩa |
|---|---|
| **Đã có** | Runtime hiện tại đã đáp ứng đúng hoặc tương đương |
| **Có nhưng khác** | Đã có nền tảng nhưng khác thiết kế nguồn; cần quyết định/điều chỉnh |
| **Chưa có** | Chỉ là yêu cầu thiết kế hoặc roadmap |

## 2. Nguyên tắc thiết kế

1. **Mệnh đang kích hoạt mới có hiệu lực.** Mệnh trong Mệnh Kho chỉ là bộ sưu tập, không cộng chỉ số, điểm, tương hợp hay combo.
2. **Phẩm cấp không đồng nghĩa sức mạnh tuyệt đối.** Phẩm cấp quyết định độ hiếm, trần phát triển, độ phức tạp hiệu ứng, tiềm năng combo và giá trị; sức mạnh thực tế còn phụ thuộc tương hợp, trạng thái và quan hệ.
3. **Tương hợp là quan hệ với Con Đường**, không chỉ là một con số trang trí. Tương Sinh tạo lợi thế; Tương Khắc tạo chi phí/rủi ro; build ngoài đường vẫn có thể được trang bị.
4. **Cát/Hung là đánh đổi.** Cát không luôn luôn tốt và Hung không phải luôn luôn vô dụng; hiệu ứng phải thể hiện rõ phần thưởng và hệ quả.
5. **Hành động phải giải thích được kết quả.** Mọi nút trang bị, tháo, nâng cấp, dung luyện hoặc chuyển mệnh phải hiển thị điều kiện, thay đổi dự kiến và lý do bị chặn.
6. **Giao dịch nguyên tử.** Trừ tài nguyên, thay đổi kho/trang bị và ghi log phải cùng thành công hoặc cùng rollback.

## 3. Kiến trúc hệ thống

```text
Con Đường đã chọn
        │
        ├─ affinity / match score ─┐
        │                          ▼
Mệnh Số đang kích hoạt ─────► stats, fate score, relations, combo
        │
        └─ Mệnh Kho ─────────► lưu trữ / tiềm năng tương lai (không buff)
```

### 3.1. Khái niệm “đang kích hoạt”

Thiết kế nguồn dùng một Mệnh Số đang hoạt động. Runtime hiện tại dùng nhiều ô đang kích hoạt theo tiến trình (`state.player.fates` và số ô mở được). Quy tắc thống nhất:

- mọi Mệnh trong các ô đang kích hoạt đều được tính hiệu lực;
- mọi Mệnh trong `state.fateInventory` đều bị loại khỏi tính chỉ số/điểm/quan hệ;
- nếu sản phẩm quyết định quay về đúng một ô, phải migration bằng cách giữ Mệnh mạnh nhất/được chọn, đưa các ô còn lại vào Mệnh Kho; không tự động làm mất dữ liệu.

Khuyến nghị hiện tại: giữ mô hình nhiều ô vì phù hợp tiến trình đã có, nhưng áp dụng đầy đủ ngữ nghĩa active/vault của thiết kế nguồn cho từng ô.

## 4. Mô hình dữ liệu

### 4.0. Nguồn dữ liệu bắt buộc

| Nguồn | Vai trò | Quyết định canonical |
|---|---|---|
| `data/fate_data.js` / `window.FATE_DATA` | catalog 10.000 Mệnh | nguồn thật cho `id`, `name`, `sign`, `grade`, `score`, `effects`, `desc` |
| `data/fate_relationships.js` / `window.FATE_RELATIONSHIPS` | quan hệ Mệnh–Mệnh, combo, fusion | nguồn thật đã sinh từ `fate_data_10000` |
| `data/path_fate_relations.js` + `.json` | cầu nối Con Đường–Mệnh hiện có | dùng để đối chiếu/migrate, không tự ghi đè catalog |
| `fate-pool.json`, `fate-relationships.json` | bộ 1.300 Mệnh cũ | legacy, không đưa vào runtime mới |
| `generate_fate_pool.js` | generator cũ | legacy, không dùng để tái sinh dữ liệu canonical |

Đã loại ba file legacy khỏi runtime/repository sau khi kiểm tra import: `generate_fate_pool.js`,
`fate-pool.json`, `fate-relationships.json`. Save cũ không phụ thuộc trực tiếp các file này; generator
Node đã chuyển sang đọc `data/fate_data.js`. Các script tooling còn tham chiếu tên legacy không được chạy.

### 4.0.1. Chuẩn hóa schema bắt buộc

Engine phải là nơi duy nhất map schema; UI không tự map lại:

```js
const GRADE_TO_TIER = {
  phan: 1, linh: 2, hoang: 3, huyen: 4,
  dia: 5, thien: 6, thanh: 7, tien: 8
};
const SIGN_TO_TYPE_LABEL = {
  cat: "Cát Cách", binh: "Bình Cách", hung: "Hung Cách"
};
```

`grade ↔ tier` và `sign ↔ type` phải dùng hai bảng này khi tra `fate_relationships.js`. Mệnh Bình
không được bị loại chỉ vì bảng quan hệ hiện tại chủ yếu chứa Cát/Hung; khi không có cạnh quan hệ,
đó là “không có quan hệ”, không phải lỗi dữ liệu.

### 4.1. Định nghĩa Mệnh Số

```js
FateDefinition {
  id,
  name,
  grade,              // Phàm, Linh, Hoàng, Huyền, Địa, Thiên, Thánh, Tiên
  alignment,          // Cát, Hung, Bình hoặc mở rộng theo thiết kế
  element,
  path_affinity: {
    lead:    [pathId],
    support:  [pathId],
    forbidden: [pathId]
  },
  modifiers,           // chỉ số trực tiếp
  effects,             // hiệu ứng điều kiện
  passive,
  relationship,        // quan hệ với Mệnh khác/Con Đường
  potential,            // trần thức tỉnh, combo, biến đổi
  state                 // active, vault, pending, locked...
}
```

Mapping runtime hiện tại:

- danh mục mẫu: `data/fate_data.js` (`D().FATE_PATTERNS`);
- Mệnh đang kích hoạt: ID trong `state.player.fates`;
- Mệnh Kho: `state.fateInventory`;
- nâng cấp: `state.player.fateEnhancements`;
- phần thưởng chờ xử lý khi kho đầy: `state.pendingFateReward`/`state.pendingFateRewards`.

### 4.2. Dung lượng Mệnh Kho

`vaultCapacity = 2 × số ô Mệnh đang kích hoạt đã mở`. Runtime đã dùng công thức ổn định theo số ô mở, có tối thiểu 5 trong dữ liệu tiến trình hiện tại. Không được tăng/giảm dung lượng chỉ vì một lần render UI.

## 5. Phẩm cấp, thuộc tính và tương hợp

### 5.1. Thứ tự phẩm cấp

`Phàm → Linh → Hoàng → Huyền → Địa → Thiên → Thánh → Tiên`.

Phẩm cấp ảnh hưởng rarity, cap, độ phức tạp hiệu ứng, combo potential và giá trị trao đổi; không được dùng làm công thức cộng sức mạnh duy nhất.

### 5.2. Match score

Điểm tương hợp phải tách khỏi điểm sức mạnh:

- `match_score`: độ hợp với Con Đường;
- `normal_fate_score`: điểm Mệnh cơ bản sau hiệu ứng thường/nâng cấp;
- `total_fate_score`: điểm sau quan hệ, combo và hiệu ứng đặc biệt.

| Điểm | Nhãn hiển thị | Ý nghĩa |
|---:|---|---|
| 0 | Tuyệt Không | Build ngoài đường; cho phép trang bị, có bất lợi |
| 1–2 | Xa Lạ | Có thể dùng nhưng có phạt/rủi ro |
| 3–4 | Tương Hợp | Không có bonus lớn |
| 5–7 | Tương Hợp Cao | Bonus vừa |
| 8–9 | Tương Sinh | Bonus mạnh |
| 10 | Đại Đạo Tương Sinh | Ngưỡng tối đa, mở combo/hiệu ứng đặc biệt |

UI phải hiển thị cả số và nhãn. Giá trị nội bộ cần clamp về `0..10` trước khi hiển thị hoặc tính tier.

### 5.3. Luật Tương Sinh/Tương Khắc

- `match >= 8`: bonus tương sinh;
- `match 5..7`: bonus nhỏ;
- `match 3..4`: không bonus;
- `match 1..2`: penalty hoặc rủi ro;
- `match === 0`: vẫn cho trang bị, nhưng là off-build rõ ràng.

Quan hệ hiện tại giữa các Mệnh đang kích hoạt tiếp tục được tính riêng trong `computeRelationshipEffects`; quan hệ với Con Đường dùng `fateCompatibility`/`pathMatchSummary`.

## 6. Công thức điểm và hiệu lực

Mục tiêu chuẩn hóa:

```text
normal_fate_score = base(fate) + enhancement + normal effects
total_fate_score  = normal_fate_score
                 × path_multiplier(match tier)
                 × relationship_multiplier
                 × combo_multiplier
```

Runtime hiện tại đã có `computeFate`, `fateCompatibility` và hiệu ứng quan hệ, nhưng chưa chuẩn hóa đầy đủ các multiplier thành một API công khai duy nhất. Khi hoàn thiện, mọi UI và tooltip phải lấy cùng một kết quả từ engine, không tự tính lại.

`computeStats` chỉ áp dụng modifiers/effects của Mệnh đang kích hoạt. Mệnh Kho tuyệt đối không được đi qua pipeline này.

## 7. Quan hệ, dưỡng mệnh và cộng minh

### 7.1. Quan hệ nhân vật–Mệnh

Các bậc đề xuất:

| Bậc | Tên | Ý nghĩa |
|---:|---|---|
| 0 | Sơ Ngộ | mới nhận, hiệu ứng cơ bản |
| 1 | Đồng Hành | đã dùng qua thử thách |
| 2 | Tương Ứng | lựa chọn phù hợp tính cách/Con Đường |
| 3 | Cộng Minh | mở hiệu ứng hoặc combo nâng cao |
| 4 | Nhân Mệnh Hợp Nhất | trạng thái tối đa/thức tỉnh |

Quan hệ tăng qua hành vi và lựa chọn có liên quan, không dùng EXP thuần túy. Runtime hiện mới có quan hệ giữa các Mệnh đang kích hoạt; quan hệ nhân vật–Mệnh và bậc 0–4 là phần cần triển khai.

### 7.2. Combo

- combo đôi: 2 Mệnh có quan hệ tương sinh/điều kiện chung;
- combo ba: yêu cầu phẩm cấp, match tier hoặc quan hệ tối thiểu;
- combo phải ghi rõ điều kiện đang thiếu và hiệu ứng nhận được;
- combo chỉ xét Mệnh đang kích hoạt, không xét Mệnh Kho.

## 8. Hành động Mệnh Số

Action Bar phải là ngữ cảnh động, chỉ hiển thị hành động hợp lệ với Mệnh/slot/trạng thái hiện tại.

| Action | Điều kiện/kết quả | Trạng thái runtime |
|---|---|---|
| `EQUIP_FATE` | đưa Mệnh từ kho vào ô active; nếu đầy thì yêu cầu thay thế | **Đã có**: `equipFateFromVault`, preview thay thế |
| `UNEQUIP_FATE` | tháo khỏi active, chuyển vào kho | **Đã có**: `storeFateToVault` |
| `READ_FATE` / `QUAN_MENH` | xem giải thích, match, hiệu ứng, quan hệ | **Có nhưng khác**: modal đã có thông tin, chưa phải action chuẩn hóa |
| `CHANGE_FATE` | đổi Mệnh; phải hiển thị cost/cooldown/ảnh hưởng quan hệ | **Có nhưng khác**: swap có preview, chưa có cost/cooldown đầy đủ |
| `SACRIFICE_FATE` | tiêu hủy Mệnh, nhận tài nguyên/cơ hội; xác nhận bắt buộc | **Đã có**: có ứng viên và ảnh hưởng SAN |
| `FUSE_FATE` | dung hợp nguyên liệu, tạo Mệnh mới/tiềm năng | **Có nhưng khác**: `mergeFates` mới là merge kho tổng quát |
| `NURTURE_FATE` / `DUONG_MENH` | tăng quan hệ qua hành vi phù hợp | **Chưa có** |
| `RESONATE` / `CONG_MINH` | kiểm tra path + quan hệ + điều kiện để mở cộng minh | **Chưa có** |
| `DEFY_FATE` / `NGHICH_MENH` | phá lựa chọn định sẵn, giá phải trả lớn | **Chưa có** |
| `SUPPRESS_FATE` / `TRAN_MENH` | giảm/khóa tác động Hung hoặc hiệu ứng nguy hiểm | **Chưa có** |
| `HEAVENLY_OMEN` / `THIEN_CO` | xem tín hiệu tương lai, tiêu tài nguyên/cooldown | **Chưa có** |
| `FATE_TRANSFORM` / `MENH_DOI` | biến đổi theo quan hệ, phẩm cấp, vật liệu | **Chưa có** |

Mọi action phải trả về cấu trúc thống nhất:

```js
{ ok, action, preview, cost, warnings, blockers, changes, rollbackToken }
```

## 9. Giao dịch và rollback

Luồng bắt buộc:

1. kiểm tra state, ownership, capacity, cooldown và điều kiện path;
2. dựng preview: tài nguyên mất, Mệnh chuyển trạng thái, chỉ số trước/sau;
3. giữ snapshot tối thiểu của player, inventory, vault và log;
4. commit một lần;
5. nếu bất kỳ bước nào lỗi: rollback toàn bộ và trả blocker có thể đọc được;
6. ghi event/log sau commit thành công.

Áp dụng cho equip/swap, sacrifice, fusion, cauldron, market và các action Mệnh mới. Không trừ vật phẩm theo “số dòng”; luôn trừ theo `quantity` thực tế của stack.

## 10. Thu thập và phần thưởng

Nguồn Mệnh hợp lệ gồm:

- quà khởi đầu tương hợp với Con Đường;
- đột phá/cột mốc (có pity hoặc phần thưởng chắc chắn theo thiết kế);
- chiến đấu elite/boss;
- Search Chain/quest;
- thị trường, Khâm Thiên Giám và dung luyện.

Khi kho đầy, phần thưởng không được mất: đưa vào pending reward, cho phép chọn thay thế Mệnh trong kho hoặc bỏ qua có xác nhận. Runtime đã có cơ chế pending cho tình huống này.

## 11. UI/UX bắt buộc

### 11.1. Thẻ Mệnh đang kích hoạt

Hiển thị: tên, phẩm cấp, Cát/Hung, nguyên tố, match `x/10 + nhãn`, score trước/sau, hiệu ứng đang áp dụng, quan hệ, nâng cấp, tháo xuống và thay thế. Nút bị khóa phải có lý do ngay cạnh nút.

### 11.2. Thẻ Mệnh Kho

Luôn có nhãn rõ: **“Mệnh Kho · Không kích hoạt · Không cộng chỉ số”**. Có preview khi trang bị, thay thế hoặc hi sinh; hiển thị `Sở hữu · Đang kích hoạt · Trong Mệnh Kho`.

### 11.3. Modal xác nhận

Các thao tác mất Mệnh/tài nguyên phải có modal nêu: điều kiện, cost, thay đổi dự kiến, rủi ro, nút xác nhận/hủy. Không dùng thông báo thành công chung chung nếu không cho biết chỉ số đã đổi.

## 12. Lưu game và migration

Schema phải bảo toàn:

```js
player.fates[]
fateInventory[]
fateEnhancements{}
pendingFateRewards[]
```

Khi đọc save cũ:

- thiếu mảng thì khởi tạo rỗng;
- loại bỏ ID không tồn tại khỏi active/vault nhưng ghi warning;
- không làm mất Mệnh khi kho đầy;
- migration nhiều ô ↔ một ô phải có chiến lược rõ ràng, không âm thầm ghi đè.

## 13. Đối chiếu với code hiện tại

### 13.0. Gap dữ liệu trước khi triển khai

Catalog thật hiện chưa có `element`, `path_affinity`, `passive` và `potential` dạng trực tiếp.
Đây là gap dữ liệu/schema, không được che bằng giá trị suy đoán ở UI:

- `element`: sinh offline từ `desc` theo bộ từ khóa Ngũ Hành, fallback `vo_he`, sau đó review mẫu;
- `path_affinity`: sinh `lead`/`support` từ chủ đề Con Đường; bản đầu để `forbidden` rỗng, chỉ bổ sung
  khi có bộ phản đề được review;
- `passive`: tạm coi các modifier đang active là hiệu lực nền; hiệu ứng điều kiện vẫn tách bằng
  `splitFateEffects()`;
- `potential`: tra chuẩn hóa từ `combo_sets`/`fusion_recipes`, không nhân bản vào 10.000 entry.

Không chạy Phase 1 mới dựa trên `path_affinity` cho đến khi pass dữ liệu này được kiểm tra.

| Khu vực | Runtime hiện tại | Khoảng cách cần xử lý |
|---|---|---|
| Active/vault | Có active nhiều ô và vault riêng | khác mô hình “1 active” nguồn; giữ nhiều ô theo quyết định hiện tại |
| Vault không buff | Đã tách khỏi tính stats | giữ regression test |
| Capacity | Đã ổn định theo số ô mở, công thức 2× | bổ sung hiển thị công thức nếu cần |
| Match | Có `fateCompatibility`, summary | chuẩn hóa clamp 0–10 và tier label |
| Score | Có normal/total/effective trong `computeFate` | hợp nhất multiplier path/relationship/combo |
| Quan hệ active-active | Có `computeRelationshipEffects` | bổ sung quan hệ nhân vật–Mệnh và stage |
| Trang bị/tháo/thay thế | Đã có preview, blocker và transaction | chuẩn hóa action result/API |
| Nâng cấp | Có material chooser, level và effect scaling | bổ sung log before/after rõ ràng |
| Merge/fusion | Có merge kho tổng quát | chưa phải fusion/transform theo tiềm năng |
| Sacrifice | Có ứng viên, cost và xác nhận | bổ sung hệ quả quan hệ/omen theo spec |
| Pending reward | Đã có khi kho đầy | thêm UI thống nhất cho mọi nguồn reward |
| Quan Mệnh/Dưỡng Mệnh/Cộng Minh | Chưa có action riêng | Phase 2 |
| Nghịch Mệnh/Trấn Mệnh/Thiên Cơ/Mệnh Đổi | Chưa có | Phase 3 |
| Dynamic Action Bar | Có action contextual tổng quát | thêm taxonomy action Mệnh và blocker chuẩn |
| Transaction/rollback | Có ở các flow chính | áp dụng thống nhất cho action tương lai |

## 14. Lộ trình triển khai

### Gate 0 — dữ liệu và schema (bắt buộc trước Phase 1)

1. Đóng băng nguồn thật và đánh dấu legacy.
2. Thêm map grade/tier và sign/type trong engine.
3. Sinh/review `element` và `path_affinity` tĩnh.
4. Thêm `splitFateEffects`, tra combo/fusion và kiểm tra Mệnh Bình.
5. Chạy regression: 10.000 catalog, 13.976 quan hệ, 150 combo, 78 fusion không mất ID.

### Phase 1 — nền tảng

Equip, Unequip, Change, Read/Quan Mệnh, Sacrifice; hoàn thiện preview, blocker, capacity, pending reward và test active/vault không bị lẫn.

### Phase 2 — quan hệ

Resonance/Cộng Minh, quan hệ 0–4, Dưỡng Mệnh theo hành vi, combo đôi/ba, thức tỉnh và multiplier thống nhất.

### Phase 3 — vận mệnh nâng cao

Defy Fate, Suppress Fate, Heavenly Omen, Fate Transformation, fusion theo tiềm năng, cooldown/cost và các hệ quả dài hạn.

## 15. Tiêu chí nghiệm thu

- Không file runtime nào đọc trực tiếp tier/type mà bỏ qua map canonical.
- Không dùng `fate-pool.json` hoặc `fate-relationships.json` legacy làm nguồn phần thưởng mới.
- Catalog sau Gate 0 vẫn đủ 10.000 ID và quan hệ không trỏ tới ID không tồn tại.

- Mệnh Kho không làm thay đổi stats, score, path match hoặc combo.
- Trang bị Mệnh luôn có preview trước/sau; nếu đầy phải cho thay thế hoặc báo rõ blocker.
- `match_score` hiển thị đúng tier; điểm 0 vẫn có thể trang bị theo luật off-build.
- Không có thao tác nào làm mất Mệnh do kho đầy; reward được pending.
- Nâng cấp thể hiện level, vật liệu đã trừ và hiệu ứng trước/sau.
- Mọi stack vật phẩm được xử lý theo quantity.
- Action nguy hiểm có xác nhận và rollback khi lỗi.
- Save/load giữ nguyên active, vault, enhancement và pending reward.
- Mọi action nâng cao chưa triển khai phải hiển thị là chưa khả dụng, không giả vờ thành công.

## 16. Tham chiếu triển khai hiện tại

- Engine: `js/engine.js`
- UI: `js/ui.js`
- Main flow: `js/main.js`
- Fate data: `data/fate_data.js`
- Dữ liệu nền: `data/data.js`
- Kiểm thử: `tools/verify_game.js`
- Thiết kế nguồn: `New Text Document.txt`

## Phụ lục A — Quan hệ Mệnh chi tiết (hợp nhất từ FATE_RELATIONSHIP_COMPLETE)

### A.1. Phân tầng năng lực

| Quan hệ | Nguồn/trạng thái |
|---|---|
| Mệnh ↔ Mệnh | `window.FATE_RELATIONSHIPS.pairwise_relationships` — 13.976 cạnh |
| Combo 2/3 Mệnh | `combo_sets` — 150 bộ |
| Dung hợp Mệnh | `fusion_recipes` — 78 công thức |
| Nhân vật ↔ Mệnh | instance sở hữu, stage 0–4; cần lưu riêng |
| Dưỡng Mệnh/Cộng Minh | action engine đã có nền tảng, cần cân bằng và mở rộng |

Instance sở hữu dùng schema:

```js
player.fateRelationships[fateId] = {
  stage: 0, points: 0, eliteTrials: 0, alignedChoices: 0,
  resonanceUnlocked: false, lastNurtureTurn: 0
}
```

Stage: `0 Sơ Ngộ → 1 Đồng Hành → 2 Tương Ứng → 3 Cộng Minh → 4 Nhân Mệnh Hợp Nhất`.

Điều kiện mục tiêu:

- 0→1: active qua elite/boss hoặc chuỗi hoạt động tương đương;
- 1→2: tối thiểu 3 lựa chọn quest/hội thoại cùng alignment;
- 2→3: bắt buộc action `RESONATE`, match ≥ 8 và đủ SAN;
- 3→4: Cộng Minh + đột phá thành công khi Mệnh vẫn active.

Hiệu lực quan hệ: stage 0 = 0%, stage 1 = +5%, stage 2 = +10%, stage 3 = +20%, stage 4 = +35%
trên modifier dương. Stage 4 là lựa chọn cam kết; việc khóa tháo/hi sinh cần UI xác nhận riêng trước
khi bật production. Chưa áp dụng suy giảm stage do nằm trong Mệnh Kho 30 ngày.

`NURTURE_FATE` chỉ nhận Mệnh active, tốn Linh Thạch tăng theo stage và có diminishing return. Runtime
hiện dùng cost nền `5 + stage × 5`, tăng điểm quan hệ có kiểm soát và ghi lịch sử. `RESONATE` yêu cầu
stage 2, match ≥ 8, SAN ≥ 10; chỉ trừ SAN sau khi mọi điều kiện đã hợp lệ.

Combo mới có thể thêm `minRelationshipStageRequired`; 150 combo hiện tại giữ nguyên hành vi khi field
này null.

### A.2. Phase 3 (chưa bật production)

`DEFY_FATE`, `SUPPRESS_FATE`, `HEAVENLY_OMEN`, `FATE_TRANSFORM` cần cost, cooldown, preview và
rollback riêng. Không giả lập thành công trong UI khi chưa có recipe/hiệu ứng dữ liệu.

## Phụ lục B — Schema/data gap và kế hoạch Gate 0 (hợp nhất từ FATE_SYSTEM_COMPLETE)

Catalog 10.000 entry hiện có `id`, `name`, `sign`, `grade`, `gradeLabel`, `score`, `effects`, `desc`.
Engine đã cung cấp adapter runtime:

- `fateDefinition()` — trả schema canonical, gồm `alignment`, `tier`, `element`, `path_affinity`;
- `splitFateEffects()` — tách modifier trực tiếp và conditional effects;
- `fateRelationshipsFor()`, `fateCombosFor()`, `fateFusionRecipesFor()` — tra dữ liệu normalized;
- `GRADE_TO_TIER`, `SIGN_TO_TYPE_LABEL` — map duy nhất cho toàn codebase.

`element` được suy luận an toàn từ tên/mô tả, fallback `vo_he`. `path_affinity` được suy luận từ bộ
keyword Con Đường hiện có; `forbidden` chỉ lấy khi keyword phản đề thực sự xuất hiện, không suy ra
chỉ vì thiếu match. Khi cần độ chính xác production, có thể materialize kết quả thành data tĩnh sau
review mẫu; không được để UI tự suy luận khác engine.

Legacy không phải nguồn runtime mới; ba file nêu trên đã được xóa khỏi pipeline. Mọi tooling còn tham
chiếu tên cũ phải được dọn riêng trước khi dùng lại.

## Phụ lục C — API/action đã áp dụng

Runtime đã có các action nền: equip, unequip, swap preview, upgrade preview/commit, sacrifice,
merge, pending reward và vault capacity. Bổ sung theo spec này: chuẩn hóa schema adapter, match clamp
0–10, trạng thái quan hệ theo instance, `nurtureFate`, `resonateFate`, cùng nút UI Dưỡng Mệnh/Cộng Minh.

Mọi action mới vẫn phải trả blocker đọc được, preview cost/thay đổi và rollback nếu commit thất bại.

### Source: `archive-requirements\logic-history\06-expansion\ONLINE_FATE_REWARD_CANONICAL_2026-09-17.md`

# Online Fate reward canonical — 2026-09-17

The periodic online Fate reward is a reward source, not an exceptional direct mutation.
When the expansion runtime is available, `processOnlineFateReward` routes the Fate through
`grantCanonicalReward` using the deterministic key `online_fate:<absoluteDay>`. The receipt
records the Fate result, including a pending vault state when the active Fate slots are full.

The next reward day is advanced before resolution, and replaying the same day returns the
existing receipt without adding a second Fate or reward summary. The legacy direct path
remains only as a compatibility fallback when expansion has not been loaded.

**Note chưa hoàn thiện:** faction-specific legacy currencies still use their own namespace;
they are not interchangeable with Fate/quest reward receipts.


### Source: `archive-requirements\logic-history\07-ui\FATE_INSTANCE_CARD_UI_CONTRACT_2026-09-17.md`

# UI Mệnh Số theo instance — Contract

Mỗi card Mệnh phải mô tả instance đang sở hữu, không chỉ definition catalog. Card active và card trong Mệnh Kho đều phải phân biệt trạng thái kích hoạt.

## Dữ liệu bắt buộc hiển thị

- Tên/grade/sign của definition.
- Enhancement level và effective score của instance.
- Relationship stage/points, số lần Dưỡng Mệnh và Cộng Minh lấy từ `fateRelationships[fateId]`.
- Nguồn nhận lấy từ `fateInstances[fateId].source` khi có.
- Tiến hóa: `status`, `branchId` hoặc trạng thái chưa mở.
- Số lượt advanced action đã dùng của instance; suppression vẫn do runtime resolver quyết định.
- Instance trong Mệnh Kho phải ghi rõ không cộng chỉ số và không phải active effect.

## Invariant

UI chỉ đọc DTO/resolver (`fateRelationshipStatus`, `fateEnhancementLevel`, `fateAdvancedAction...`, `fateEvolution...`); không tự tính effect. Definition card không được hiển thị như instance active.

## Regression

Test runtime phải giữ nguyên `fateInstances`, relationship history, evolution và advanced namespace sau serialize/deserialize. UI contract kiểm tra card có instance metadata và action delegation vẫn hoạt động.

## Chưa hoàn thiện

Visual screenshot trên browser thật chưa được xác nhận do môi trường local browser hiện chặn URL; runtime/UI string contract đã được kiểm tra.

## Consolidated addendum: duplicate, insight, stagnation, and uniqueness

- A duplicate `fateId` never creates a second `FateInstance`. Grades `phan`, `linh`, and `hoang` convert to `fateExcessEssence`.
- Fate insight is permanently stored on the relationship record. It unlocks at comprehension >= 60 or relationship stage >= 2. A Hung fate increments forbidden-knowledge tracking once.
- Each active fate increments `stagnantDays` during a game-day tick. At 60 days, release removes the active instance and grants excess essence without reputation or cost penalty.
- Grade `tien` ownership is unique within the current save. Server-wide ownership requires an authoritative backend and is not claimed by the local runtime.
