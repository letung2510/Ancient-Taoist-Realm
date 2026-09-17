# Asset Reference Integrity Gate — 2026-09-17

## Mục tiêu

Ngăn regression khi thay đổi UI/runtime làm mất hình nhân vật, map, Mệnh Số hoặc Công Pháp.

## Hợp đồng

- Reference tĩnh `assets/...` trong HTML/JS/CSS phải trỏ tới file tồn tại trong repo.
- Gate bao phủ index, engine, expansion, UI, main, stylesheet và các data catalog portrait.
- Asset động từ data vẫn phải dùng path tương đối cùng root `assets/` hoặc được kiểm tra riêng khi thêm producer mới.

## Regression

Chạy `node tools/verify_asset_references.js`.

## Giới hạn

Gate xác nhận file tồn tại, không thay thế browser decode/HTTP cache/CORS và visual quality.
