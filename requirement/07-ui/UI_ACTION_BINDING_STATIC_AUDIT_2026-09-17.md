# UI Action Binding Static Audit — 2026-09-17

## Mục tiêu

Ngăn regression kiểu “nút được render nhưng click không thực thi logic”. Mọi nút mở rộng phải phát ra một command nằm trong command table của `runExpansionCommand`.

## Hợp đồng canonical

1. `js/ui.js` dùng `expansionButton("command", ...)` để phát command.
2. `js/main.js` chỉ bind một delegated click listener trên `#tab-content`, đọc `data-expansion-command`, rồi đưa thao tác qua `enqueueAction`.
3. `js/expansion.js` phải có handler cùng tên trong `runExpansionCommand`.
4. Command UI không được trùng trong các declaration tĩnh; command không tồn tại trong runtime bị xem là lỗi build/regression.
5. Command table có thể có handler chưa được UI gọi trực tiếp (phục vụ save cũ, automation hoặc content tương lai), nhưng chiều UI → runtime bắt buộc toàn vẹn.

## Kiểm tra tự động

`tools/verify_ui_surface_contract.js` trích toàn bộ `expansionButton("...")`, kiểm tra uniqueness, đọc command table runtime và fail nếu có command thiếu handler. Test này chạy cùng regression review batches.

## Trạng thái

- Đã hoàn thiện: delegated event binding, action queue và static UI→runtime command coverage.
- Chưa hoàn thiện: browser E2E trên local worktree phụ thuộc môi trường Chrome; static contract không thay thế kiểm thử click thật.
