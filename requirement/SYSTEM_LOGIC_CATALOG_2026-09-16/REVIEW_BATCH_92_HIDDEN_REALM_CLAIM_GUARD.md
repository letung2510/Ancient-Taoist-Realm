# Review Batch 92 — Hidden Realm Claim Guard

## Mục review

Mục 18: chống claim reward của cycle cũ sau offline catch-up.

## Đã triển khai

- `claimHiddenRealmCore` bắt buộc active cycle, runtime cycle, status và close window khớp nhau.
- `updateHiddenRealms` tự hủy `activeHiddenRealm` và trả nhân vật về parent node khi cycle đóng/chuyển trong lúc offline.
- Không còn state active stale khiến validator fail hoặc reward cũ được claim.

## Regression

`tools/verify_review_batches.js` chạy online claim idempotency và offline cycle expiry/eject/claim rejection.
