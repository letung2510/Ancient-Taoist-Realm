# Review Batch 94 — Canonical Catalog Balance Baseline

## Mục tiêu

Chuyển balance catalog từ kiểm tra kiểu dữ liệu/range đơn thuần thành baseline có thể tái lập: mỗi weather, recipe, Công Trình, Dị Thể, path fusion và reward policy đều có dải giá trị được chốt để regression.

## Baseline đã chốt

- Weather: severity `0..5`, duration `1..7` ngày, travel risk `0..0.25`; weather severity cao phải có travel risk đáng kể.
- Recipe: material `1..8`, resource cost `0..10`, success base `0.4..0.8` nếu có.
- Công Trình: build cost `10..25`, tối đa 3 cấp, upgrade base không quá 2 lần build cost, refund `0.25..0.5`.
- Dị Thể: đúng số stage theo catalog, progress threshold `1..10`, stage effect numeric `0..1`.
- Path fusion: toàn bộ cặp path hợp lệ và không vượt cap `0.75`.
- Reward: duplicate reject, pending reward replay idempotent, không dùng pity ngầm.

## Regression

`tools/verify_catalog_balance.js` chạy trên catalog runtime thật, cùng với `validateBalanceCatalog()`; không chỉ kiểm tra file/schema tĩnh.

Đây là balance baseline kỹ thuật có thể kiểm chứng. Playtest cảm nhận vẫn là bước tuning sản phẩm riêng, không được dùng để thay thế invariant runtime.
