# Realm Progression

## Phạm vi

Thang tu vi 14 cấp phẳng, nguồn EXP và rủi ro tu luyện, Đạo Tâm, Bế Quan, nghi thức đột phá và commit cảnh giới. Không định nghĩa Con Đường/danh xưng theo đường ([../path/README.md](../path/README.md)), Công Pháp ([../technique/README.md](../technique/README.md)) hay luật Mệnh Số gốc ([../fate/README.md](../fate/README.md)). Nền tảng nhân vật ở [../character/foundation.md](../character/foundation.md); cổng Mệnh Số cho đột phá ở [../fate/progression-gates.md](../fate/progression-gates.md).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| 14 cảnh giới | [realms-14.md](realms-14.md) | `PRG-RLM-` | `data/canh_gioi_tien_hiep.json:realms`, `js/engine.js:breakthroughRequirements` |
| Đột phá & nghi thức | [breakthrough.md](breakthrough.md) | `PRG-BT-` | `js/engine.js:breakthroughRitualPlan`, `performBreakthroughRitualStep`, `maybeBreakthrough` |
| EXP & tu luyện | [exp-and-cultivation.md](exp-and-cultivation.md) | `PRG-CUL-` | `js/engine.js:recordCultivationGain`, `adjustDaoTam` |
| Bế Quan | [seclusion.md](seclusion.md) | `PRG-SEC-` | `js/engine.js:startSecludedCultivation`, `secludedCultivation` |

## Phụ thuộc

- [../path/path-selection.md](../path/path-selection.md) — `match_score`, Con Đường bắt buộc từ cấp 2.
- [../path/ngoai-dao-gia.md](../path/ngoai-dao-gia.md) — hệ số EXP ×5, Mệnh ×2, thử thách Vô Lộ.
- [../path/tainted-god.md](../path/tainted-god.md) — mốc 5/8/11/13 và khóa cấp 14.
- [../fate/README.md](../fate/README.md), [../technique/README.md](../technique/README.md) (Công Pháp Cốt Lõi), [../character/README.md](../character/README.md) (Neo, SAN).

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | Phân tầng nghi thức theo runtime `breakthroughRitualPlan`: 3–4 = Gọi Mệnh→Dựng Neo→Đối Chiếu; 5–10 +Vượt Dị Tượng; 11–13 +Trả Giá; 14 +Thử Thách Cuối. Thay bảng cũ "3–4: 2 bước Gọi Mệnh→Đối Chiếu; 5–7 +Neo; 8–10 +Dị Tượng" và bảng "cấp 2/8–13" của canonical nghề. Thứ tự luôn Gọi Mệnh → Dựng Neo → Đối Chiếu. | PRG-BT-003, PRG-BT-004 |
| 2026-10-22 | Vượt Dị Tượng dùng công thức runtime (82 − 8/cấp từ cấp 8, ±Căn Cốt/Ngộ Tính, clamp 10–95), thất bại không mất EXP. Bỏ `breakthrough_chance` 35% + … và hình phạt "mất 5–15% EXP" cũ; không roll thân/tâm lần hai khi commit. | PRG-BT-008, PRG-BT-011 |
| 2026-10-22 | Cổng Dựng Neo chỉ nhận Neo Nhân Tính nguồn NPC (runtime); bỏ "Neo địa điểm cơ bản cho cấp 5–7". | PRG-BT-006 |
| 2026-10-22 | Trả Giá luôn là 5 Thanh Tỉnh cho mọi Con Đường; bỏ biến thể trả bằng Khí Huyết/Thọ Nguyên/Linh Thạch/Mệnh Điểm. | PRG-BT-009 |
| 2026-10-22 | Tutorial nghi thức tự mở mỗi lần `currentGate` đổi; bỏ `tutorialSeen` "chỉ lần đầu". | PRG-BT-UI-002 |
| 2026-10-22 | Ngưỡng `requiredPathScore` lấy từ dữ liệu cảnh giới; bỏ công thức `3 + floor(realm_index / 2)`. | PRG-RLM-003 |
| 2026-10-22 | Tẩu Hỏa/velocity theo gap spec (cửa sổ 24 ngày game, ngưỡng 150%, trần 30%); bỏ bản nháp "min(30%, (v − safe)/safe × 20%)". | PRG-CUL-003 |
| 2026-10-22 | Đạo Tâm ≥ 80 cộng +1 `match_score` (thang điểm runtime 3/lead), thay cho "+10" và "+10% trần". | PRG-CUL-006 |
| 2026-10-22 | Không đưa vào: Trưởng Lão Chỉ Điểm (bản nháp V3 không được gap spec giữ lại). Đạo Hữu cùng Con Đường chỉ mở Vấn Đạo/Đấu Ngộ qua encounter hiện có. | PRG-CUL-010 |
| 2026-10-22 | Schema phiên Bế Quan dùng tên field runtime (`totalDays`, `completedDays`, `result`) thay `plannedDays/elapsedDays/gainedExp`. | PRG-SEC-002 |
| 2026-10-22 | Dung lượng Mệnh Kho = max(2 × Mệnh đang gắn, 2 × `activeSlots`, dung lượng đã đạt) theo runtime, thay "luôn bằng 2 × equipped". | FATE-CD-005 |

## Gate

`node tools/verify_game.js` · `node tools/verify_progression_requirement_matrix.js` · `node tools/verify_cultivation_controls.js` · `node tools/verify_cultivation_producers.js` · `node tools/verify_opening_intent.js`
