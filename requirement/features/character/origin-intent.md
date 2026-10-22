# Nhân Vật — Xuất thân và Ý Định hành đạo

## Mục đích

Chọn vùng xuất thân, chủng tộc, tình huống khởi đầu và Ý Định hành đạo (Tầm Sư/Tự Lập/Quy Tông/Ẩn Thế) quyết định cảnh mở đầu và tổ chức mục tiêu. Origin node và vị trí cụ thể thuộc [../map/README.md](../map/README.md); gia nhập tổ chức thuộc [../cross-system/README.md](../cross-system/README.md).

## Dữ liệu & trạng thái

- `player.startRegionId`, `startLocationId`, `originNode`, `originSituation`, `race`, `background`, `personalityTraits`, `hiddenGoal`.
- `player.journeyIntent`, `player.openingPlan = { intentId, type, targetOrganizationId, targetOrganizationKind, targetName, title, text, sceneId? }`, `player.origin.confirmed`.

## Rules

### CHR-ORI-001 Cổng vùng xuất thân
`startRegionEligibility(regionId, realmLevel)`:
| Vùng | Cấp tối thiểu |
|---|---:|
| Thiên Không Vực (`thien_khong_vuc`) | 7 (Hư Giới Cảnh) |
| U Minh Giới (`u_minh_gioi`) | 10 (Chủ Tể Cảnh) |
| Sáu vùng phàm sinh còn lại | 1 |

Nhân vật mới (Di Mệnh Cảnh) chỉ thấy sáu vùng phàm sinh; UI ẩn vùng không đủ điều kiện và engine vẫn từ chối (`RangeError`) nếu đầu vào cố vượt cổng. Vùng không tồn tại hoặc không có bảng chủng tộc → từ chối.

### CHR-ORI-002 Chủng tộc và tình huống khởi đầu
Chủng tộc roll theo `REGION_RACE_WEIGHTS[regionId]`. Tình huống khởi đầu chọn đều từ `ORIGIN_SITUATIONS[regionId]`; vùng không có bảng → "Tán Tu Lưu Lạc" tại điểm khởi hành vùng.

### CHR-ORI-003 Origin node
`resolveOriginNode(regionId, { journeyIntent, originNodeId })`: node chỉ định hợp lệ → dùng (`explicit`); nếu không, ưu tiên node `frontier` khi Ý Định `an_the`, `village` cho các Ý Định khác (`policy_default`); không có node → `START_LOCATIONS[regionId]` (`legacy_fallback`).

### CHR-ORI-004 Lựa chọn Ý Định
`journeyIntentOptions(character, state)`:
- Luôn có `tam_su` (Tầm Sư) và `tu_lap` (Tự Lập).
- Xuất thân "Tông Môn": chỉ hai lựa chọn trên.
- Xuất thân "Hắc Đạo" hoặc "Vô Danh": thêm `an_the` (Ẩn Thế).
- Xuất thân khác: thêm `quy_tong` (Quy Tông) khi vùng có tổ chức loại gia tộc.

Phân loại tổ chức theo tên/type: `hidden` (ẩn thế), `sect` (tông môn, đạo tông, kiếm tông…), `family` chỉ khi ghi rõ thế gia/gia tộc/vương triều/phủ gia (không suy từ "Tộc/Bộ").

### CHR-ORI-005 Cảnh mở đầu
`rollJourneyOpening(state, intentId)` (RNG replay theo vùng/Ý Định):
| Ý Định | Kết quả |
|---|---|
| `tam_su` | Một tông môn trong vùng làm mục tiêu gia nhập giai đoạn 2; vùng không có → blocker |
| `quy_tong` | Một thế gia trong vùng; không có → blocker |
| `an_the` | Tổ chức ẩn trong vùng nếu có (có thể null) + một cảnh độc lập; thân phận ẩn |
| `tu_lap` | Một trong 5 cảnh độc lập (làng ven rừng, quán trọ biên thành, bến sông, cổ đạo, am đá), không tổ chức |

Khi chưa chọn, context ép trạng thái `JOURNEY_INTENT_CHOICE` với action `act_journey_<id>`.

### CHR-ORI-006 Chọn một lần
Xuất thân và Ý Định chỉ chọn một lần đầu game. Save có `origin.confirmed` không tạo lại lựa chọn Tán Tu/Thế Gia sau đột phá (`pendingGuildChoice = false`). Con Đường và tổ chức là hai quyết định độc lập.

## Acceptance

- Di Mệnh Cảnh không thể chọn Thiên Không Vực/U Minh Giới, kể cả qua input trực tiếp.
- Xuất thân Tông Môn không thấy Quy Tông/Ẩn Thế; vùng không có thế gia không hiện Quy Tông.
- Tầm Sư ở vùng không có tông môn trả blocker, không tạo mục tiêu giả.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CHR-ORI-001 | `js/engine.js:START_REGION_RULES`, `startRegionEligibility`, `rollCharacterCreation`; `character_generator.js:HIGH_REALM_ORIGINS` | Khớp |
| CHR-ORI-002 | `js/engine.js:REGION_RACE_WEIGHTS`, `rollOriginSituation` | Khớp |
| CHR-ORI-003 | `js/engine.js:resolveOriginNode`, `originNodeOptions` | Khớp |
| CHR-ORI-004 | `js/engine.js:journeyIntentOptions`, `organizationKind`, `regionalOrganizations` | Khớp |
| CHR-ORI-005 | `js/engine.js:rollJourneyOpening`, `INDEPENDENT_OPENINGS`; context `JOURNEY_INTENT_CHOICE` | Khớp |
| CHR-ORI-006 | `js/engine.js:deserialize` (`origin.confirmed`, `pendingGuildChoice`) | Khớp |
