# Review Batch 86 — Runtime Hidden-Realm Coordinates

## Mục review

Mục 1 và 18: Map V2 coordinate contract phải bao phủ cả node runtime sinh ra trong vòng đời Hidden Realm.

## Đã triển khai

- `ensureRuntimeLocationCoordinates(state)` cấp tọa độ deterministic cho entry/path/core runtime node.
- Tọa độ nằm trong `[0,100]`, tránh collision với coordinate index hiện hữu và được lưu trong state.
- `validateExpansionState` tiếp tục fail nếu coordinate thiếu; không chuyển sang fail-open.
- Save migration fixture v1 được chạy sau các test Hidden Realm để bắt global-catalog contamination.

## Regression

`tools/verify_review_batches.js` chạy full sequence, trong đó fixture migration sau Hidden Realm phải pass `validateExpansionState` và map coordinate audit.

## Chưa hoàn thiện

Pixel placement/zoom của node runtime vẫn cần browser visual QA; invariant tọa độ và save-load đã được kiểm tra bằng Node regression.
