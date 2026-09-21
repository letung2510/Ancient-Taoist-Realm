# LOCAL CONSTELLATION MAP — CANONICAL POINTER

Thiết kế Local Constellation Map đã được hợp nhất vào tài liệu tổng hợp của hệ thống bản đồ.

Tài liệu canonical duy nhất:

- [`SYSTEM_LOGIC_CATALOG/features/04-world/MAP_CANONICAL.md`](SYSTEM_LOGIC_CATALOG/features/04-world/MAP_CANONICAL.md)
- Mục `LOCAL CONSTELLATION MAP — CANONICAL FEATURE CONTRACT`

Mọi cập nhật về các nội dung sau phải thực hiện trong `MAP_CANONICAL.md`:

- Oxy và bounds `0..100`.
- Chọn tối đa 40 node bằng BFS/Oxy Manhattan.
- Layout constellation ổn định, node hiện tại ở tâm.
- Cạnh thật `map-path` và phân biệt frontier chưa sinh.
- Action `act_move_*` cho node đã tồn tại.
- Action `act_explore_*` cho ô Oxy kế bên chưa sinh.
- Boundary guard, lazy generation, reciprocal edge và save/load migration.
- Tooltip, fog, visited, pinned node và quy tắc tương tác.

File này được giữ làm entry point tương thích cho các tham chiếu cũ; không tạo thêm logic riêng tại đây.
