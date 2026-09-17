# Action Priority Matrix Validator — 2026-09-17

## Mục tiêu

Chuẩn hóa thứ tự ưu tiên action giữa engine, combat, pending opportunity, exploration, action mở rộng và các surface UI. Một action không được đồng thời xuất hiện ở nhiều priority surface; cùng một input state phải cho cùng một danh sách action, cùng thứ tự và cùng metadata.

## Canonical contract

- Mỗi action có `id` duy nhất, `priority` là số nguyên trong khoảng `0..100`, ít nhất một alias và alias không được mơ hồ giữa hai action.
- `resolveActions()` khử trùng lặp theo `id`, áp dụng blocking winner theo `tier -> urgency -> sourceOrder`, sau đó sắp xếp ổn định.
- Forced action, combat action, pending opportunity và exploration action là các nhóm độc quyền theo context; action an toàn (`Trạng Thái`, `Quan Sát`, `Hành Trang`) chỉ được phép tồn tại như utility ngoại lệ.
- `resolveActionSurfaces()` phân tách `context`, `primary`, `secondary`, `overflow`, `modal`; một action không được cùng lúc thuộc hai nhóm priority chính.
- Replay phải deterministic: cùng state và cùng raw action list phải trả về cùng projection `id/tier/urgency/blocking/sourceOrder`.

## Runtime implementation

`GameEngine.validateActionPriorityMatrix(state, actions)` kiểm tra schema, alias collision, duplicate id, priority range, deterministic replay projection và overlap giữa các surface. `validateExpansionState()` gọi validator này để save/load và world simulation không thể âm thầm lưu action matrix hỏng.

## Regression

`tools/verify_review_batches.js` kiểm tra combat/pending filtering, matrix hợp lệ và fixture duplicate-id/ambiguous-alias/invalid-priority bị từ chối.

## Chưa hoàn thiện

- Chưa có browser E2E click-through cho mọi action surface; hiện mới có runtime contract và Node regression.
- Action động từ plugin/expansion được kiểm tra khi đưa vào resolver nhưng chưa có registry compile-time riêng.
