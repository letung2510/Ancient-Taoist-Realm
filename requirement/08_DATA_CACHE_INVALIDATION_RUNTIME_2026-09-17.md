# Cache Invalidation Runtime Contract — 2026-09-17

## Contract

Map influence cache có một `influenceRevision` canonical. Mọi thay đổi ảnh hưởng influence phải tăng revision, ghi `lastInvalidation` và xóa snapshot cũ; cache entry hợp lệ phải mang đúng revision/node. Runtime metrics map influence/NPC/offline phải là số hữu hạn, không âm.

## Runtime

`invalidateMapInfluence()` tăng revision, đếm invalidation và ghi node/day. `validateCacheInvalidationState()` kiểm tra revision, metadata, stale cache và metrics; `validateExpansionState()` gọi audit này. Map influence, travel, structure và UI tiếp tục đọc cùng resolver.

## Regression

`verify_review_batches.js` kiểm tra cache state trước mutation, revision/invalidation sau event influence và structure mutation; stress/performance regression vẫn chạy.

## Chưa hoàn thiện

Chưa có profiling trên thiết bị thật và browser Performance API; invariant runtime và budget gate đã có.
