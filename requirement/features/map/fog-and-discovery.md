# Bản đồ — Sương mù, khám phá và sử ký node

## Mục đích

Bốn cấp sương mù, sự kiện khám phá, quy tắc riêng tư dữ liệu, độ hoàn thiện bản đồ, sử ký node và các lớp gợi ý (cộng hưởng Con Đường, đường chuỗi nhiệm vụ). Nội dung sự kiện khám phá, phiên tìm kiếm (`search/collect/investigate`) thuộc [../discovery/README.md](../discovery/README.md).

## Dữ liệu & trạng thái

- `mapFogState(state, nodeId, level?)` → cấp 0–3; `state.visitedLocations`.
- Sự kiện khám phá chuẩn `{ nodeId, level, source, actorId, tick }`.
- `WORLD_MAP.nodePool[nodeId].history` / `mapNode().history`: `[{ turn, type: "war" | "incident" | "notable_npc_visit" | "faction_change" | …, summary, regionId, key }]`.
- `mapCompletion(state, regionId)`, `mapCompletionDetailed(state, regionId)`, `appendNodeHistory`, `nodeResonance`.

## Rules

### Bốn cấp sương mù

| ID | Cấp | Tên | Điều kiện | Hiển thị |
|---|---|---|---|---|
| MAP-FOG-000 | 0 | Chưa biết | Chưa từng nghe | Không hiện node trên bản đồ khu vực (trừ tên trong phạm vi Lân Cận theo MAP-LC-041) |
| MAP-FOG-001 | 1 | Nghe đồn | NPC/bảng tin lân cận nhắc tới, chưa tới | Tên + mô tả mơ hồ một câu, hướng tương đối; vị trí gần đúng trên Thiên Đồ, không hiện tuyến chi tiết |
| MAP-FOG-002 | 2 | Đã khám phá | Đã tới | Node, tuyến hợp lệ, nguy cơ cơ bản, marker NPC |
| MAP-FOG-003 | 3 | Thông thuộc | Tới ≥ 5 lần, khảo sát, hoặc có trạm/outpost/Truyền Tống Trận/động phủ tại đây | Sub-location ngay từ bản đồ, heatmap influence chi tiết, công trình, bảng tin, tuần tra |

| ID | Rule |
|---|---|
| MAP-FOG-010 | Nâng cấp fog chỉ qua sự kiện khám phá idempotent: reducer áp mức max và ghi journal. Nguồn: rumor = 1, visit = 2, survey/outpost/waystation = 3. Một sự kiện lộ node lân cận nâng tối đa một cấp và không spoil sub-location khi mới cấp 1. |
| MAP-FOG-011 | Node mới ghé lần đầu được ghi vào `visitedLocations`, hiện trên Thiên Đồ, và luôn có ít nhất một Sự Kiện Khám Phá Đầu Tiên (bảng sự kiện theo `eventPoolTag` của node — [../discovery/README.md](../discovery/README.md)). |
| MAP-FOG-012 | Sương Mù làm giảm 30% cơ hội lan tin "Nghe đồn" (0 → 1) trong vùng ([weather-on-map.md](weather-on-map.md)). |
| MAP-FOG-013 | Khi node chuyển sang cấp 1 và có WrongnessLevel từ Trung bình trở lên, tin đồn ưu tiên giọng bất an thay vì trung tính ([armies-and-atmosphere.md](armies-and-atmosphere.md)). |
| MAP-FOG-014 | Trạng thái khám phá và quyền di chuyển là hai lớp độc lập: node chưa khám phá vẫn có thể là đích hợp lệ ở backend; UI chỉ hiện thông tin tương ứng cấp fog. |

### Riêng tư dữ liệu

| ID | Rule |
|---|---|
| MAP-FOG-020 | Fog 0 không trả tên (ngoài MAP-LC-041), tọa độ, thế lực, NPC, cạnh hay risk cụ thể. Fog 1 chỉ trả rumor đã phát hiện; không suy ngược được từ danh sách tuyến. |
| MAP-FOG-021 | Lọc tại tầng runtime trước khi tạo view model (API, tooltip, DOM, cache), không ẩn bằng CSS. Node chưa khám phá không lộ `nodeType`, `dangerLevel`, chủ sở hữu, NPC, quái, cơ duyên. |
| MAP-FOG-022 | Cache view model theo `nodeId + fogVersion` (một người chơi mỗi save). |
| MAP-FOG-023 | Heatmap influence chi tiết chỉ cho node `fogState ≥ 2`; fog < 2 hiển thị "ảnh hưởng chưa rõ" ([influence-and-structures.md](influence-and-structures.md)). |

### Độ hoàn thiện bản đồ

| ID | Rule |
|---|---|
| MAP-FOG-030 | `mapCompletion` = node đã tới / node đã sinh thực sự trong `regionId` (không tính ô chưa từng materialize). Chỉ số % hiện ở góc UI bản đồ. |
| MAP-FOG-031 | Đạt 80% trong một vùng mở danh hiệu "Người Vẽ Bản Đồ [Tên Vùng]" (cột mốc ghi nhận, không thưởng cơ chế mạnh). |
| MAP-FOG-032 | `mapCompletionDetailed` mở rộng DTO: `layers.visited`, `layers.subLocation`, `layers.structure`, `layers.weather`, `layers.actor`, `layers.faction` (số node có lịch sử tương ứng), `historyCoverage` (tỉ lệ node có ≥ 5 dấu vết lịch sử — ngưỡng baseline), `explainable: true`. Mọi layer lấy từ `mapNode().history`. |
| MAP-FOG-033 | Thêm history không đổi influence hay phần thưởng; key trùng không tăng completion. |

### Sử ký node

| ID | Rule |
|---|---|
| MAP-FOG-040 | Ghi một dòng history khi: incident kết thúc; chủ node theo influence đổi (chiến tranh có kết quả); NPC nổi bật ghé lần đầu; công trình được xây/sửa/chuyển; thời tiết chuyển; thế lực thay đổi. Dedupe theo key, giữ retention canonical; save/load giữ nguyên. |
| MAP-FOG-041 | UI: chi tiết node hiện dấu vết gần đây; zoom Close có tab "Sử Ký" trong panel node. Completion trả lời được vì sao vùng đạt bao nhiêu phần trăm. |

### Lớp gợi ý

| ID | Rule |
|---|---|
| MAP-FOG-050 | `nodeResonance(state, nodeId)` = điểm khớp giữa `searchable`/`terrain` của node với tag lead/support/forbidden của Con Đường hiện tại (tái dùng bảng tag Mệnh Số/Con Đường, không bảng mới). Node cộng hưởng cao có glow phụ nhẹ, không đổi hình dạng, không nói rõ là gì. |
| MAP-FOG-051 | Đường chuỗi nhiệm vụ: quest chain đang active có ≥ 2 node liên quan → vẽ đường đậm hơn tuyến thường, màu theo `questType` (main_story / world_discovery / moral_choice), tự ẩn khi hoàn thành/hủy. Chuỗi `world_discovery` chỉ vẽ mờ, không ghi tên quest. Chỉ là lớp hiển thị, đọc `questLog` + tọa độ. |

## Acceptance

- Fog 0 không rò metadata qua API, tooltip, DOM hoặc cache.
- Sự kiện khám phá lặp lại không tăng cấp hai lần.
- Completion giải thích được; history trùng key không tăng.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_map_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-FOG-000..003, 010 | js/expansion.js:`mapFogState` | Khớp |
| MAP-FOG-011 | js/engine.js:`move` (`visitedLocations`) | Khớp |
| MAP-FOG-012..013 | — | Thiếu |
| MAP-FOG-020..021 | js/expansion.js:`getCurrentRegionViewModel`, js/ui.js:`renderLocalMap` | Khớp |
| MAP-FOG-022 | — (`fogVersion`) | Thiếu |
| MAP-FOG-023 | js/expansion.js:`mapInfluenceSnapshot` | Khớp |
| MAP-FOG-030..033 | js/expansion.js:`mapCompletion`, `mapCompletionDetailed` | Khớp |
| MAP-FOG-040..041 | js/expansion.js:`appendNodeHistory`, js/ui.js (lịch sử node) | Khớp |
| MAP-FOG-050 | js/expansion.js:`nodeResonance` | Khớp |
| MAP-FOG-051 | — | Thiếu |
