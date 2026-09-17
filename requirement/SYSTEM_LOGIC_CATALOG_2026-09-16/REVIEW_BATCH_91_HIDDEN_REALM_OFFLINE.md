# Review Batch 91 — Hidden Realm Offline Cycle

## Mục review

Mục 18: contested opportunity/Hidden Realm offline expiry và reward idempotency.

## Đã triển khai

- Thêm fixture offline cycle riêng sau khi enter realm.
- Xác nhận world tick đóng cycle hết hạn.
- Xác nhận core reward bị từ chối sau expiry và state validator vẫn pass.

## Evidence

- `requirement/06-expansion/HIDDEN_REALM_OFFLINE_CYCLE_REGRESSION_2026-09-17.md`
- `tools/verify_review_batches.js`
