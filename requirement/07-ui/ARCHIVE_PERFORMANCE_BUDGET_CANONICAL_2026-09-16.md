# Archive / Performance Budget Canonical — 2026-09-16

## Retention

- Runtime `state.history`: tối đa 300 event để UI.
- Save payload `history`: tối đa 100 event gần nhất; `logState.totalEvents` giữ tổng số.
- Node history: tối đa 50 record/node.
- NPC memory/rumor: tối đa 20/12 record; offline encounter archive: tối đa 100.
- Milestone/important/rare/epic event không bị prune khỏi canonical counters; raw narrative cũ chỉ giữ nếu nằm trong retention.

## Render budget

- Map UI chỉ gọi influence resolver cho node đang render; cache theo `influenceRevision`.
- Local map hiển thị node visited/reachable/unknown; không render chi tiết actor cho fog node.
- Story log gộp cùng ngày thành một paragraph trước khi DOM append.

## Offline budget

- 30 ngày gần nhất chạy detailed tick; phần xa hơn dùng aggregate.
- Tick idempotent theo `lastProcessedDay` và event/task/encounter key.
- Offline không phát raw narrative cho từng actor; chỉ lưu aggregate/cascade cần thiết.

## Kết quả profiling hiện tại

`tools/profile_runtime_budget.js` đã đo 13 node × 5 lượt resolver: 65 lần gọi, 4 cache hit, thời gian trung bình khoảng 0.25ms/lần trên môi trường Node hiện tại. Save mẫu có kích thước khoảng 3.7MB, vì vậy không được giả định payload nhỏ; IndexedDB archive vẫn phải giữ raw history ngoài save chính.

`tools/verify_indexeddb_archive.js` đã kiểm tra failure injection và retry queue.

FPS thực tế trên thiết bị yếu và dung lượng IndexedDB vẫn cần benchmark browser thực tế; profiling Node chỉ là regression gate logic, không thay thế benchmark UI.
