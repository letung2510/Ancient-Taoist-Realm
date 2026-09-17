# Công Pháp, Công Thức và Cổ Mộ/Bí Cảnh — Canonical Schema

## Mục tiêu

Catalog nội dung phải là nguồn sự thật duy nhất cho runtime, UI, save/load và reward. Mọi bản ghi được tạo động (ví dụ bí pháp truyền thừa theo tông môn) phải được chuẩn hóa về cùng DTO với dữ liệu tĩnh.

## DTO Công Pháp

Mỗi công pháp có `id`, `name`, `category`, `family`, `minRealmLevel`, `cost`, `effect`, `risk`, `mastery` và `evolutionPaths`.

- `cost`: `mana`, `stamina`, `san`, `corruption`, `lifespan`, `cooldownTurns`, `castTimeSeconds`; tất cả là số không âm.
- `effect`: `powerCoefficient` không âm, `baseEffect` là chuỗi, `allStatMultiplier` nếu có phải là số hữu hạn.
- `risk`: `hiddenAttributes` là mảng; `corruptionProfile.baseCorruptionGainPerUse` nếu có là số không âm.
- `mastery`: `stage` nguyên trong 0..4, `exp` và `usageCount` không âm. Tiến độ runtime thuộc save của nhân vật, không sửa catalog.
- `evolutionPaths` luôn là mảng; `minRealmLevel` tối thiểu là 1.

`GameEngine.validateTechniqueCatalog()` là cổng kiểm tra bắt buộc trước khi coi catalog hợp lệ. Công pháp động của guild phải đi qua cùng validator, không được tạo DTO riêng.

## DTO Công Thức

Recipe có `id`, `professionId`, `materials`, `costs`, `output`. `materials` phải có số lượng dương; `costs` phải không âm. `output` phải có ít nhất `itemId` hoặc `kind`. `successBase` nếu có nằm trong 0..1; `perfectMultiplier` nếu có không âm. Công thức không tự cấp reward ngoài output đã commit.

## Bí cảnh/Cổ Mộ

- Enter chỉ thành công khi realm đang `open` và nhân vật đứng đúng `parentNodeId`.
- `cycleIndex` tạo namespace node và reward key ổn định: `<cycleIndex>:main`.
- Enter tạo hoặc tái sử dụng ba node runtime (`entry`, `path`, `core`) và ghi `activeHiddenRealm` để rollback đúng parent.
- Claim core chỉ khi đang ở `core`, realm còn mở và reward key chưa tồn tại.
- Reward đi qua `grantCanonicalReward`; sau khi thành công key được ghi vào `claimedRewardKeys`. Claim lặp lại phải bị từ chối, kể cả sau save/load.
- Exit xóa `activeHiddenRealm` và trả về `parentNodeId` hợp lệ (fallback home chỉ khi parent không còn trong catalog).
- Offline progression chỉ cập nhật cycle/open/close; không tự nhân đôi reward đã claim.

## Regression bắt buộc

1. Validator công pháp trả `ok=true` và tất cả bản ghi có DTO canonical.
2. Mỗi recipe hợp lệ về materials/costs/output và xác suất.
3. Enter → core → claim tăng EXP đúng một lần.
4. Claim lần hai bị từ chối; exit trả về đúng parent.
5. Save/load và offline update giữ nguyên `cycleIndex`, `claimedRewardKeys` và không cấp lại reward.

## Phần còn chưa hoàn thiện

- Cân bằng số liệu từng công pháp, từng recipe và reward bí cảnh vẫn là dữ liệu thiết kế cần playtest; validator hiện kiểm tra schema và miền giá trị, không chứng minh balance.
- Visual QA trên trình duyệt local còn phụ thuộc môi trường browser; regression hiện tại là runtime/test harness.
