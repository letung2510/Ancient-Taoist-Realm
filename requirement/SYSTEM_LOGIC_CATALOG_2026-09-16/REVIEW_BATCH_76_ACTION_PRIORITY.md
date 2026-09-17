# Review Batch 76 — Action Priority / Deterministic Replay

Phạm vi: Mục 19 và Mục 21 của `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`.

## Đã triển khai

- `GameEngine.validateActionPriorityMatrix(state, actions)` kiểm tra action id duy nhất, alias không mơ hồ, priority nguyên trong `0..100`, và schema aliases.
- Resolver được chạy hai lần trên cùng input để kiểm tra projection deterministic gồm `id`, `tier`, `urgency`, `blocking`, `sourceOrder`.
- `resolveActionSurfaces()` được audit để ngăn action xuất hiện đồng thời ở nhiều priority surface chính.
- `validateExpansionState()` gọi audit này, nên state có action matrix hỏng bị phát hiện trong validation save/runtime.
- Regression bao phủ combat context, pending opportunity context và fixture duplicate-id/ambiguous-alias/invalid-priority.

## Requirement canonical

Xem `07-ui/ACTION_PRIORITY_MATRIX_VALIDATOR_2026-09-17.md` để biết contract, blocking winner, context exclusivity và giới hạn surface.

## Trạng thái

**ĐANG TRIỂN KHAI:** runtime contract và Node regression đã pass. Browser E2E click-through cho toàn bộ action surface và registry compile-time cho action động vẫn là phần còn lại.
