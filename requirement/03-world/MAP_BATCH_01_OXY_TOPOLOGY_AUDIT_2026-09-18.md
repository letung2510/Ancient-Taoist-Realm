# Batch 01 — Oxy topology và di chuyển bản đồ

## Phạm vi

Batch này chuẩn hóa lớp bản đồ trước khi rà soát tổ chức, chiến sự và sự kiện.
Nguồn tọa độ gameplay hiện tại là lưới số nguyên `0..100` cho cả `x` và `y`.

## Contract bắt buộc

- `x` tăng về Đông, `y` tăng về Nam.
- Bắc là `(x, y - 1)`, Nam là `(x, y + 1)`, Đông là `(x + 1, y)`, Tây là `(x - 1, y)`.
- Mỗi action di chuyển chỉ đi đúng một ô Manhattan; không được nhảy trực tiếp giữa hai node cách xa nhau.
- Node có tọa độ hợp lệ luôn expose đủ bốn hướng trong action context. Ô chưa từng khám phá được tạo lazy.
- `coordinateIndex` là registry duy nhất để tìm node tại một tọa độ; không tạo node trùng tọa độ.
- `exits` chỉ là cache runtime. Exit legacy hoặc save cũ không cùng tọa độ lân cận sẽ bị loại khi migrate.
- Liên kết runtime phải giữ nghịch đảo: Đông của A là Tây của B và ngược lại.
- Node procedural lấy `regionId` theo vùng gần nhất trên bản đồ, không chọn vùng ngẫu nhiên theo hash.
- Địa chỉ phường thị, điểm đản sinh, faction và tổ chức dùng cùng hệ Oxy; UI không tự dựng tọa độ từ label.

## Đã triển khai

- Thêm các primitive `coordinateKey`, `neighborCoordinate`, `nodeCoordinates`, `getNodeAtCoordinate`.
- `locationExits` sinh topology từ tọa độ, không dùng các exit authored cách xa làm đường tắt.
- `openWorldTarget` chỉ nhận target đúng ô kế cận; nếu chưa có thì tạo node lazy.
- Migration loại bỏ runtime edge cũ không hợp lệ.
- `validateOpenWorldGrid` kiểm tra bounds, duplicate, index mismatch và non-adjacent edge.
- UI action giữ các action nền tảng (Quan Sát, Hành Trang/Trạng Thái) khi bản đồ expose đủ bốn hướng.

## Regression gate Batch 01

```text
node --check js/engine.js
node tools/verify_game.js
node tools/verify_log_narrative.js
```

Batch chỉ chuyển sang phần Tổ chức khi toàn bộ gate trên đạt.
