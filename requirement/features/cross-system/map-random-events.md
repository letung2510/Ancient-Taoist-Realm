# Cross-system — Sự kiện ngẫu nhiên trên bản đồ

## Mục đích

Bốn nhóm sự kiện phát sinh khi di chuyển/khám phá — **NPC**, **Quái Vật**, **Cơ Duyên**, **Động Phủ** — nối bản đồ, NPC/quái, Mệnh Số, Công Pháp và Con Đường làm phần thưởng. Logic node/Lân Cận: [map](../map/README.md); thực thể NPC/quái: [npc](../npc/README.md); phần thưởng: [reward](../reward/README.md).

## Dữ liệu & trạng thái

```json
{ "eventId": "co_duyen_linh_thao_ngo_chu", "group": "co_duyen", "subType": "tu_nhien_sinh_truong",
  "name": "Linh Thảo Ngộ Chủ", "description": "…", "weight": 100,
  "minDangerLevel": 1, "maxDangerLevel": 5, "regionRestriction": null,
  "rewards": [{ "type": "material", "tierScaleWithDanger": true, "amountRange": [1, 3] }],
  "choices": [{ "id": "help", "label": "Giúp đỡ", "outcome": { "danhVong": 5, "rewardId": "…" } }],
  "cooldownGroup": "co_duyen" }
```

Record theo node (`mapEvents`): `discovered`, `cooldownUntilTurn`, `resolvedIds[]` (12 gần nhất); `state.pendingMapEvent` (một pending); `mapEvents.history` (40 gần nhất).

## Rules

### Roll

| ID | Rule |
|---|---|
| CSX-RE-001 | `maybeTriggerRandomEncounter(state, trigger)` là cổng duy nhất cho sự kiện phát sinh khi di chuyển/khám phá; mọi roll qua `replayRandom` với key theo node + trigger + lượt. Sự kiện ngẫu nhiên không bao giờ thành nút taskbar cố định. |
| CSX-RE-002 | `rollMapEvent`: bỏ qua nếu node đang cooldown hoặc đã có pending. Xác suất có sự kiện: `moving_through` 25%, `explore_action` 90%, `first_discovery`/lần đầu tới node 100% (lần đầu không ra quái). Chọn nhóm theo trọng số `eventPoolTag` (bảng dưới), rồi chọn sự kiện chưa resolve trong nhóm (fallback nhóm Cơ Duyên). |
| CSX-RE-003 | Ngoài sự kiện template, xác suất biến cố bản đồ tăng theo `dangerLevel`/`corruption` của node và modifier thế giới (`encounterChanceMult`, `travelRiskDelta`), kẹp 5%–95%; không ép mỗi lượt. Node có `enemies` có thể phục kích khi tới; `maybeSpawnCombatExtras()` kiểm tra thú săn, truy sát tông môn, hộ pháp cấm địa. |
| CSX-RE-004 | Nhịp: node nguy hiểm ưu tiên thú săn/phục kích trước phần thưởng; node linh khí cao tăng tài nguyên/cơ duyên tu luyện; node tà nhiễm cao luôn có dấu hiệu bất thường và có thể trừ Thanh Tỉnh; quay lại node đã khám phá không lặp y nguyên (trạng thái node, loot, cờ đã gặp lưu trong save). |
| CSX-RE-005 | Sự kiện tôn trọng `pendingEnding`, combat, Thanh Tỉnh và cooldown; kết quả qua `updateDerived()` và autosave; ghi vào `state.history` (Story Panel), tăng `flags.mapEventCount` chỉ khi thực sự xảy ra. Không có sự kiện hợp lệ → ghi câu an toàn, không chặn lượt. |
| CSX-RE-006 | Cooldown tính theo **lượt game**: NPC 5, Quái Vật 3, Cơ Duyên 30, Động Phủ 10 (lấy max với cooldown riêng của sự kiện). Rời node bỏ dở pending → pending `abandoned`, cooldown 5 lượt, ghi câu kể. |

| `eventPoolTag` | NPC | Quái Vật | Cơ Duyên | Động Phủ |
|---|---|---|---|---|
| `tong_mon_an_toan` | 70 | 5 | 20 | 5 |
| `co_dinh_cot_truyen` | 60 | 10 | 25 | 5 |
| `linh_vuc` | 40 | 30 | 25 | 5 |
| `hoang_da` | 15 | 55 | 25 | 5 |
| `bien_thanh` | 50 | 20 | 20 | 10 |
| `cam_dia` | 10 | 50 | 30 | 10 |
| `vuong_kinh` | 65 | 5 | 20 | 10 |
| `hai_vuc_khong_vuc` | 25 | 35 | 30 | 10 |

### NPC và quái

| ID | Rule |
|---|---|
| CSX-RE-010 | Trọng số gặp NPC ngẫu nhiên: Thường Dân 35, Tán Tu (`faction = null`) 25, đệ tử tông môn khác 15, Thương Nhân 10, Ma Đầu/Nghịch Đồ 5 (chỉ khi `nemesis_trigger_condition` đã kích hoạt), NPC Ẩn/Sự Kiện 5, Dị Sĩ 3, Nghịch Thương Nhân 2. |
| CSX-RE-011 | Thái độ ban đầu: Trung Lập 60% (Nói Chuyện / Bỏ Qua / Tấn Công — mất Danh Vọng); Thân Thiện 20% (tặng tin, dẫn đường, giảm giá nếu là thương nhân); Cảnh Giác 15% (phải qua check Danh Vọng/Aptitude mới nói chuyện); Thù Địch 5% (vào combat nếu faction thù địch). |
| CSX-RE-012 | Quái theo `dangerLevel`: 1 → trash yếu, Elite 5%; 2 → trash thường, 12%; 3 → trash mạnh + Elite 25%, Boss/Dị Quỷ 1%; 4 → Elite 40%, 3%; 5 → Elite mạnh 50%, 8%. Quái Dị Biến chỉ ở `cam_dia`/`hai_vuc_khong_vuc`, +10% khi người chơi Tà Nhiễm > 40. Thắng thì roll `loot_table_id` của quái. |

### Cơ Duyên

| ID | Loại (trọng số) | Sự kiện → phần thưởng |
|---|---|---|
| CSX-RE-020 | Tự Nhiên Sinh Trưởng (18) | Linh Thảo Ngộ Chủ → 1–3 nguyên liệu luyện đan theo `dangerLevel`; Linh Tuyền Ẩn Hiện → hồi đầy SAN + Linh Lực, Khí Vận tạm thời; Thiên Địa Dị Tượng → +1 Ngộ Tính vĩnh viễn (hiếm, có giới hạn tần suất); Yêu Thú Sản Noãn → nuôi (thú cưỡi tương lai) hoặc lấy trứng bán. |
| CSX-RE-021 | Di Sản Người Xưa (18) | Cổ Mộ Tàn Tích → Công Pháp cũ theo `dangerLevel` hoặc bẫy nhẹ; Tàn Quyển Rơi Rớt → chọn Nghiên cứu (effect `study`) hoặc không chạm vào; không dùng hệ mảnh ghép Công Pháp; Kiếm Gãy Cắm Đất → vũ khí theo `dangerLevel`, tỉ lệ nhỏ pháp bảo có linh hồn; Bia Đá Khắc Chữ Cổ → tăng tương hợp Con Đường hiện tại. |
| CSX-RE-022 | Gặp Cao Nhân (15) | Ẩn Sĩ Chỉ Điểm → EXP tức thời, tỉ lệ nhỏ mở Nghề Ẩn; Tiền Bối Độ Kiếp → đứng xem (+Ngộ Tính tạm thời) hoặc lại gần giúp (rủi ro/thưởng cao); Đồng Đạo Lữ Hành → kết giao đồng hành tạm thời hoặc từ chối. |
| CSX-RE-023 | Thử Thách Nhỏ (15) | Trận Pháp Mê Cung Nhỏ → giải đố (Trí/Aptitude) nhận Linh Thạch/Mệnh nhỏ; Hồ Ly Thử Lòng → lựa chọn đạo đức ảnh hưởng Tà Nhiễm/Danh Vọng; Cầu Cứu Giả/Thật → cứu đúng +Danh Vọng/thưởng, cứu nhầm rơi vào bẫy cướp. |
| CSX-RE-024 | Mệnh Số Trực Tiếp (17) | Khí Vận Đột Biến → một Mệnh theo bảng chuẩn (không ép phẩm); Ngộ Đạo Giữa Đường → một Mệnh hoặc Công Pháp Ngộ Đạo; Mệnh Khế Vô Chủ → Mệnh kèm cảnh báo nếu Hung Cách. |
| CSX-RE-025 | Dị Biến/Rủi Ro Cao (17, chỉ Cấm Địa/Hải Vực–Không Vực) | Tiếng Vọng Từ Vực Sâu → −SAN khi điều tra, tỉ lệ ra Mệnh/Công Pháp Dị Hệ; Di Vật Tà Thần → giữ (+sức mạnh, +Tà Nhiễm) hoặc phá (an toàn); Cánh Cổng Không Toàn Vẹn → vào (dịch chuyển tới node ẩn xa, rủi ro lạc) hoặc bỏ qua. |
| CSX-RE-026 | Thiên Tài Địa Bảo | Loại/niên đại (Bách/Thiên/Vạn Niên) lấy từ catalog `heavenlyTreasures` theo trọng số niên đại; lượng = base × multiplier; nhận có receipt (CSX-TG-08). |

### Động Phủ

| ID | Rule |
|---|---|
| CSX-RE-030 | Động Phủ là node riêng (`nodeType: "dong_phu"`): khi roll ra, một node ẩn lân cận được xác định là Động Phủ khi lộ ra và cố định, không random lại. |
| CSX-RE-031 | "Chinh Phục Động Phủ": 1–3 lớp trở ngại theo `dangerLevel`, mỗi lớp một trong: Hộ Pháp Thú (combat), Trận Pháp Phong Ấn (giải trận, dễ hơn khi có Công Pháp `tran_phap`), Cấm Chế Mệnh Số (cần Mệnh đạt phẩm tối thiểu). Vượt hết → `claimedByPlayerId`, thưởng khởi tạo một lần (Linh Thạch + một Công Pháp/Mệnh). |
| CSX-RE-032 | Động Phủ đã chiếm là căn cứ cá nhân: mở "Bố Trận Phòng Thủ", tu luyện tại đây có bonus EXP cao hơn node thường. Vắng mặt lâu không củng cố trận thì xác suất NPC Hắc Đạo tới chiếm tăng dần theo thời gian vắng (chỉ NPC — game single-player). |

## Acceptance

- Cùng save/lượt/node cho cùng kết quả roll; lần đầu tới node luôn có sự kiện không phải quái; không sự kiện nào thành nút taskbar.
- Gate: `verify_map_producer_matrix.js`, `verify_world_producer_matrix.js`, `verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-RE-001–005 | engine.js:`maybeTriggerRandomEncounter`, `rollMapEvent`, `maybeSpawnCombatExtras`, `mapEventCount` | Khớp |
| CSX-RE-002 (bảng) | engine.js:`MAP_EVENT_GROUP_WEIGHTS` | Khớp |
| CSX-RE-006 | engine.js: `groupCooldown = { npc: 5, monster: 3, co_duyen: 30, dong_phu: 10 }` | Khớp |
| CSX-RE-010/011 | engine.js: entity encounter theo `appearance_weight` | Lệch — chưa có bảng trọng số lớp NPC và roll thái độ ban đầu |
| CSX-RE-020–025 | engine.js:`MAP_EVENT_TEMPLATES` (chỉ có Lữ Khách Che Mặt, Linh Tuyền Ẩn Hiện, Thiên Tài Địa Bảo, Tàn Quyển Rơi Rớt, Động Phủ Vô Danh) | Thiếu — phần lớn sự kiện Cơ Duyên chưa có template |
| CSX-RE-026 | engine.js: `co_duyen_heavenly_treasure`, `validateHeavenlyTreasureCatalog` | Khớp |
| CSX-RE-030–032 | engine.js/expansion.js: `dong_phu`, `claimedByPlayerId` | Khớp |
