# Realm Progression — 14 cảnh giới

## Mục đích

Định nghĩa thang tu vi 14 cấp phẳng: định danh, ngưỡng EXP, điều kiện Mệnh/Con Đường/Neo theo từng cấp, phần thưởng khi lên cấp và cách hiển thị. Cách thực hiện đột phá nằm ở [breakthrough.md](breakthrough.md).

## Dữ liệu & trạng thái

| Nguồn | Nội dung |
|---|---|
| `data/canh_gioi_tien_hiep.json` (`realm_model = "14_flat_levels"`) | Nguồn chuẩn `realms[]`: `id`, `level`, `name`, `breakExp`, `minFate`, `minNormalFate`, `minRatioR`, `requiredPathScore`, `requiredLeadTags`, `requiredCompatibleTags`, các cờ `requires*`, `maxCorruption`, `phyMult/magMult`, `maxQa`, `lifespanBase/lifespanBonus`, `legacyIds` |
| `data/data.js:FALLBACK_REALMS` / `REALMS` | Fallback khi JSON không nạp; `REALMS` chuẩn hóa snake_case/camelCase |
| `state.player.realmId`, `state.player.exp` | Cảnh giới hiện tại và EXP chưa chốt của cấp hiện tại |

## Rules

### PRG-RLM-001 Mười bốn cấp phẳng
Tu vi có đúng 14 cấp (`level` 1–14), không có tiểu cảnh Sơ/Trung/Hậu Kỳ. `legacyIds` (ví dụ `luyen_khi_*`, `truc_co_*`) chỉ dùng để map save cũ về cấp mới.

### PRG-RLM-002 Khởi điểm
Mọi Player mới bắt đầu ở cấp 1 `di_menh` (Di Mệnh Cảnh); không roll cảnh giới cho Player. Phân bố cảnh giới hình tháp (`spawnWeight`) chỉ dùng khi sinh NPC/quần thể.

### PRG-RLM-003 Bảng điều kiện vào cấp
Điều kiện của cấp N được kiểm khi đột phá từ N−1 lên N. "EXP" = `breakExp` của cấp N−1 (Ngoại Đạo Giả ×5, ngưỡng Mệnh ×2 — xem [../path/ngoai-dao-gia.md](../path/ngoai-dao-gia.md)).

| Cấp | `id` | Tên mặc định | EXP | `minFate` | `minNormalFate` | R | `requiredPathScore` | Mệnh dẫn / dẫn+trợ | Điều kiện khác |
|---:|---|---|---:|---:|---:|---:|---:|---|---|
| 1 | `di_menh` | Di Mệnh Cảnh | — | 6 | — | — | — | — | Khởi tạo: 5 Mệnh cơ bản, tổng > 5 |
| 2 | `khai_lo` | Khai Lộ Cảnh | 100 | 6 | — | — | 3 | dẫn ≥ 1 | Khai mạch ([PRG-BT-001](breakthrough.md)); điều kiện path kiểm khi chọn đường |
| 3 | `dung_thai` | Dựng Thai Cảnh | 600 | 20 | — | — | 4 | dẫn+trợ ≥ 2 | Công Pháp Cốt Lõi |
| 4 | `kim_an` | Kim Ấn Cảnh | 3.000 | 35 | — | — | 5 | dẫn ≥ 2 | Neo ổn định ≥ 50 |
| 5 | `anh_linh` | Anh Linh Cảnh | 15.000 | 55 | — | — | 5 | dẫn+trợ ≥ 3 | Vượt Dị Tượng (Căn Cốt + Ngộ Tính) |
| 6 | `than_tinh` | Thần Tính Cảnh | 60.000 | 80 | — | — | 6 | dẫn+trợ ≥ 3 | Neo hoạt động; nghi thức Con Đường `chuong_quyen` |
| 7 | `hu_gioi` | Hư Giới Cảnh | 180.000 | 100 | 30 | 0,5 | 6 | — | Neo hoạt động; Tà Nhiễm ≤ 90 |
| 8 | `hop_dao` | Hợp Đạo Cảnh | 540.000 | 140 | — | — | 8 | — | Hợp nhất Công Pháp Cốt Lõi với Con Đường |
| 9 | `thien_kiep` | Thiên Kiếp Cảnh | 1.500.000 | 180 | 55 | — | 8 | dẫn+trợ ≥ 4 | Đại nghi thức |
| 10 | `chu_te` | Chủ Tể Cảnh | 4.500.000 | 220 | — | — | 8 | — | Quyền Năng độc nhất; Neo cấp cao ≥ 75 |
| 11 | `chan_ngoai` | Chân Ngoại Cảnh | 12.000.000 | 270 | — | — | 12 | — | Quest trận doanh; không Mệnh Nợ quá hạn |
| 12 | `kim_bat_hoai` | Kim Bất Hoại Cảnh | 35.000.000 | 320 | 110 | — | 12 | — | Thử thách Chân Danh |
| 13 | `thai_at` | Thái Ất Cảnh | 95.000.000 | 450 | — | — | 12 | dẫn ≥ 4 | Chuẩn bị quyết chiến |
| 14 | `dao_ngoai` | Đạo Ngoại Cảnh | 280.000.000 | 500 | — | — | 13 | — | Đánh bại Tà Thần ([PATH-TG-009](../path/tainted-god.md)); `breakExp` cấp 14 = vô hạn |

`minFate` so với Mệnh hiệu dụng (`effective_fate`, [FATE-CD-001](../fate/progression-gates.md)); `minNormalFate` so với `Normal_Fate_Score`; R = `Total / |Normal|`. Ngưỡng `requiredPathScore` lấy từ dữ liệu, không tính bằng công thức.

### PRG-RLM-004 EXP chỉ mở quyền
Đủ EXP chỉ cho phép bắt đầu nghi thức; không bao giờ tự động lên cấp. Công Pháp, vật phẩm hay Mệnh Số không tự tăng `realmId`.

### PRG-RLM-005 Phần thưởng khi lên cấp
Khi commit cấp mới: dùng hệ số `phyMult/magMult`, `maxQa` của cấp mới; Thọ Nguyên hiện tại cộng đúng phần chênh `maxLifespan` mới − cũ; gọi `grantBreakthroughFate` (Mệnh thưởng theo cấp) và `recordTaintedMilestones` (mốc Tà Thần 5/8/11/13).

### PRG-RLM-006 Danh xưng theo cấp
Cấp 1 luôn là "Di Mệnh Cảnh". Cấp 2 chưa chọn đường hiển thị "Khai Lộ Cảnh · Chờ Chọn Con Đường"; cấp ≥ 3 chưa có đường hiển thị "Đạo Lộ Chưa Định". Sau khi chọn đường, danh xưng lấy theo Con Đường ([PATH-TTL-001](../path/path-titles.md)).

### PRG-RLM-007 Tiết lộ cảnh giới
UI chỉ hiển thị cảnh hiện tại và một cảnh kế tiếp; các tầng xa hơn hiện `???`. Mô tả cảnh giới nêu bản chất biến đổi, ích lợi và cái giá tà dị (`REALM_LORE.insight/benefit/price`), không dùng câu "cấp N trong hệ 14 cấp".

### PRG-RLM-008 Checklist dùng chung nguồn
Checklist điều kiện trên UI sinh từ `breakthroughRequirements()` — cùng field mà engine đột phá kiểm tra; UI không tự tính điều kiện riêng.

## UI

Tab Cảnh giới: danh xưng hiện tại, thanh EXP `exp / breakExp` (Ngoại Đạo Giả nhân 5), mô tả cảnh hiện tại + cảnh kế tiếp, checklist PRG-RLM-008.

## Acceptance

- Tạo 10.000 nhân vật: không ai ở trên cấp 1.
- Save có `realmId` legacy (`truc_co_hau_ky`…) map đúng cấp phẳng.
- Không đường nào (Công Pháp, vật phẩm, Mệnh) tăng `realmId` ngoài `maybeBreakthrough`/khai mạch.
- Gate: `node tools/verify_progression_requirement_matrix.js`, `node tools/verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PRG-RLM-001 | `data/canh_gioi_tien_hiep.json:realms`, `data/data.js:REALMS` | Khớp |
| PRG-RLM-002 | `js/engine.js:createCharacter` | Khớp |
| PRG-RLM-003 | `js/engine.js:breakthroughRequirements`, `maybeBreakthrough` | Khớp |
| PRG-RLM-004 | `js/engine.js:maybeBreakthrough` | Khớp |
| PRG-RLM-005 | `js/engine.js:maybeBreakthrough`, `grantBreakthroughFate`, `recordTaintedMilestones` | Khớp |
| PRG-RLM-006 | `js/engine.js:pathTitle` | Khớp |
| PRG-RLM-007 | `js/engine.js:REALM_LORE`; `data/data.js:REALMS.desc` (fallback vẫn sinh câu "cấp N trong hệ thống tu hành 14 cấp") | Lệch |
| PRG-RLM-008 | `js/engine.js:breakthroughRequirements` | Khớp |
