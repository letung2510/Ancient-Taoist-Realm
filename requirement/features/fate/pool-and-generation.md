# Mệnh Số — Pool và roll

## Mục đích

Một resolver chung chọn phẩm trước rồi chọn entry, áp dụng cho mọi nguồn nhận Mệnh; xử lý trùng lặp, độc bản Tiên và giao nhận vào Mệnh Kho/pending.

## Dữ liệu & trạng thái

- `state.player.fates`, `state.fateInventory`: ID đã sở hữu (bị loại khỏi pool).
- `state.meta.uniqueFateOwnership[fateId] = ownerId`: chủ Mệnh Tiên trong save.
- `state.player.fateExcessEssence` (mirror `state.fateExcessEssence`): Tinh Hoa Dư.
- `state.player.fateInstances[fateId] = { fateId, acquiredAtTurn, source, relationshipStage, resonanceProgress, nurtureLevel }`.
- `state.player.fatePity[pityKey]`, `state.flags.fatePityMisses`: bộ đếm pity.

## Rules

### FATE-ROLL-001 Một resolver
Mọi nguồn gọi `rollFateByProgression(state, { source, level, gradeCap, minimumGrade, pathAffinity, pityKey, allowUniqueTien })` rồi `receiveFate(state, fateId, { source, allowPending })`. Cấm tự `filter(...).random()` ngoài các contract riêng ở FATE-ROLL-006.

### FATE-ROLL-002 Thứ tự resolver
1. `level` = tham số hoặc cấp cảnh giới hiện tại (1–14); lấy bảng trọng số FATE-ROLL-003.
2. Lọc pool: `minimumGrade ≤ tier ≤ gradeCap`; loại ID đã sở hữu (active + kho); loại Tiên đã có chủ trừ khi `allowUniqueTien`; nếu có `pathAffinity` chỉ giữ Mệnh có tag tương ứng.
3. Chỉ giữ grade vừa có trọng số > 0 vừa còn entry; chọn grade theo trọng số.
4. Nếu không còn grade có trọng số: fallback chọn grade khả dụng gần nhất ≤ min(cap, grade trọng số cao nhất); nếu không có thì grade khả dụng gần nhất. Không roll hụt.
5. Chọn đều một entry trong grade. Pool rỗng → trả `null`, nguồn báo "không tìm thấy Mệnh phù hợp" và không trừ chi phí.

### FATE-ROLL-003 Trọng số theo cấp (%)
| Cấp | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–2 | 65 | 30 | 5 | 0 | 0 | 0 | 0 | 0 |
| 3–4 | 15 | 45 | 25 | 10 | 5 | 0 | 0 | 0 |
| 5–6 | 5 | 20 | 35 | 25 | 10 | 5 | 0 | 0 |
| 7–8 | 2 | 10 | 25 | 30 | 20 | 10 | 3 | 0 |
| 9+ | 1 | 5 | 15 | 25 | 25 | 18 | 11 | 0 |

### FATE-ROLL-004 Tiên ngoài reward thường
Trọng số Tiên luôn 0 ở bảng thường. Chỉ nguồn được cấu hình `allowUniqueTien` (cốt truyện/đặc biệt) mới trao Tiên và vẫn qua FATE-ROLL-009.

### FATE-ROLL-005 RNG có thể replay
Chọn grade và entry dùng `replayRandom`/`replayInt` với khóa `fate-roll-grade:<source>:<level>:<turn>` và `fate-roll-candidate:<source>:<level>:<grade>`. Có `pityKey` thì reset `fatePity[pityKey] = 0` sau khi roll.

### FATE-ROLL-006 Ma trận nguồn
| Nguồn | Contract |
|---|---|
| Khởi tạo | 5 Mệnh riêng (xem [../character/creation.md](../character/creation.md)), không qua resolver |
| Combat | Tỷ lệ rơi 25% (tinh anh/boss/guardian/nemesis hoặc EXP ≥100) hoặc 6% (thường); `gradeCap = min(8, dominant + (elite ? 1 : 0))`; `allowPending` |
| Manh mối bản đồ | 12% khi khám phá; `gradeCap = min(8, dominant + 1)`; `allowPending`; thành công thưởng 1 Công Đức |
| Online/AFK | Mỗi `onlineFateIntervalDays` ngày game; `gradeCap = min(8, dominant + 1)`; qua `grantCanonicalReward` khóa `online_fate:<day>` (replay cùng ngày trả receipt cũ, không thêm Mệnh); ngày kế tiếp được đặt trước khi resolve |
| Đột Phá | 50% có Mệnh, trượt thì lần sau bảo đảm; `level = cấp đích`, `gradeCap = min(8, 1 + floor((cấp đích − 2)/2))`; `allowPending` |
| Khâm Thiên Giám | Hiến 10 năm (cố định) hoặc 1/10 thọ nguyên tối đa (tỷ lệ); neo phẩm chiếm đa số, cơ hội +1 phẩm 3,5% (cố định) / 10% (tỷ lệ), không vượt +1; thất bại hoàn thọ nguyên |
| Hư Thiên Đỉnh | `level = max(1, tổng quantity − 1)`, cap theo số loại nguyên liệu; trừ theo quantity thật; nhận thất bại thì rollback |
| Phường Thị | 3 Mệnh Phàm không Hung/ngày game, giá Linh Thạch theo offer; nhận thất bại thì hoàn tiền |
| Công Đức | 3 Mệnh Phàm/Linh/Hoàng không Hung điểm cao nhất chưa sở hữu; giá 10/25/50 Công Đức; `allowPending`; chỉ trừ Công Đức khi nhận/pending thành công |
| Hiến tế (Sacrifice) | [slots-and-equip.md](slots-and-equip.md#fate-slot-008-hiến-tế-mệnh) |
| Dung Hợp | [upgrade-replace-ritual.md](upgrade-replace-ritual.md#fate-upg-004-dung-hợp-theo-công-thức) |
| Luân Hồi | Giữ 1 Mệnh active điểm cao nhất; xóa Mệnh Kho; không xóa `uniqueFateOwnership` |

`dominant` = tier của grade xuất hiện nhiều nhất trong Mệnh active (hòa thì grade cao hơn; không có thì Phàm). Event ngẫu nhiên có thưởng Mệnh phải dùng cùng resolver. Thương nhân chợ đen/Nghịch Thương Nhân nếu bán Mệnh phải dùng `grade` catalog qua map canonical, không dùng tier legacy.

### FATE-ROLL-007 Trùng lặp
Không tạo instance thứ hai cùng `fateId`. Nhận trúng ID đã sở hữu:
| Grade | Kết quả |
|---|---|
| Phàm / Linh / Hoàng | Tự đổi thành Tinh Hoa Dư +1 / +3 / +8, log, trả `converted: true` |
| Huyền trở lên | Trả `duplicate: true` + lý do; không đổi state; nguồn hoàn chi phí |

Resolver đã loại ID sở hữu nên trùng chỉ phát sinh từ nguồn trao ID cố định.

### FATE-ROLL-008 Giao nhận
`receiveFate` thứ tự: Mệnh tồn tại → khóa Tiên → trùng lặp → còn chỗ thì vào Mệnh Kho (tạo instance, tăng `flags.forbiddenKnowledgeCount` nếu entry có cờ `isForbiddenKnowledge`) → kho đầy theo [slots-and-equip.md](slots-and-equip.md#fate-slot-006-mệnh-kho-đầy). Kết quả luôn có `destination`/`pending`/`reason`. Mệnh mới không tự active.

### FATE-ROLL-009 Tiên độc bản
Chủ Tiên ghi ở `state.meta.uniqueFateOwnership`. Khi đã có chủ khác người chơi hiện tại: loại khỏi pool và `receiveFate` trả `uniqueLocked`. Save đang sở hữu `than_dao_151` được grandfather (migration ghi chủ, không thu hồi). Luân Hồi không reset ownership.

### FATE-ROLL-010 Mệnh ẩn
`luan_hoi_tien` không phải entry catalog; tỉ lệ roll lấy từ `PATH_FATE_RELATIONS.hidden_fates.luan_hoi_tien.roll_probability_percent`. Roll lúc khởi tạo ([../character/creation.md](../character/creation.md)); kích hoạt nghề ẩn thuộc [../profession/README.md](../profession/README.md).

## Acceptance

- Monte Carlo ≥100.000 lượt mỗi bucket cấp: tỷ lệ grade sai lệch ≤ ±1 điểm % so với FATE-ROLL-003 (khi đủ entry); cấp 3–4 Phàm ≈15%.
- Tiên không rơi từ reward thường; không thể có 2 chủ.
- Trùng Phàm–Hoàng → Tinh Hoa Dư; trùng Huyền+ → blocker, state không đổi.
- Online replay cùng ngày không cộng Mệnh thứ hai.
- Hư Thiên Đỉnh trừ theo quantity và rollback khi nhận thất bại.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-ROLL-001/002 | `js/engine.js:rollFateByProgression`, `resolveFateGradeFallback` | Khớp |
| FATE-ROLL-003 | `js/engine.js:FATE_REWARD_WEIGHTS`, `fateRewardWeights` | Khớp |
| FATE-ROLL-005 | `js/engine.js:replayRandom` | Khớp |
| FATE-ROLL-006 combat/map/online/breakthrough | `js/engine.js:processOnlineFateReward`, `grantBreakthroughFate`; resolver call sites trong defeat/explore | Khớp |
| FATE-ROLL-006 Khâm Thiên Giám | `js/engine.js:rollQintianFate`, `sacrificeLifespanForFate` | Khớp |
| FATE-ROLL-006 Hư Thiên Đỉnh | `js/engine.js:refineAtVoidCauldron` | Lệch — chưa kiểm kho trước khi tiêu nguyên liệu (xem FATE-SLOT-006) |
| FATE-ROLL-006 Phường Thị | `js/engine.js:refreshMarket`, `buyMarketOffer`, `buyFateAtMarket` | Khớp |
| FATE-ROLL-006 Công Đức | `js/engine.js:meritFateOffers`, `buyFateWithMerit` | Khớp |
| FATE-ROLL-006 Luân Hồi | `js/engine.js:processLuanHoi` | Khớp |
| FATE-ROLL-007/008 | `js/engine.js:receiveFate` | Khớp |
| FATE-ROLL-009 | `js/engine.js:fateUniqueOwner`; migration trong `deserialize` | Khớp |
| FATE-ROLL-010 | `js/engine.js:rollCharacterCreation` (`hiddenFates`) | Khớp |
