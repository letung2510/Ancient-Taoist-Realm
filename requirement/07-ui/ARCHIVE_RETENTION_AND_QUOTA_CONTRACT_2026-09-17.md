# ARCHIVE RETENTION AND QUOTA CONTRACT — 2026-09-17

## Canonical limits

- Gameplay history giữ tối đa 300 event trong state runtime.
- Node history giữ tối đa 50 record/node; weather history 30; actor history 30; relationship/narrative auxiliary history có giới hạn riêng trong state validator.
- Save localStorage phải nằm dưới baseline 5 MB của payload serialized trong profile hiện hành.
- Nhật ký cũ được archive độc lập qua IndexedDB object store `events`, keyPath `id`; archive failure không được chặn gameplay save/turn.
- Queue archive chỉ xóa batch sau khi transaction đã được tạo; lỗi open/transaction đưa batch trở lại retry queue.
- Event archive có `archivedAt` để đọc lại theo thứ tự mới nhất; archive không thay đổi canonical gameplay state.

## Regression

`profile_runtime_budget.js` stress 360 event và large-save serialization, kiểm tra history retention và payload dưới 5 MB. `verify_indexeddb_archive.js` injects open failure, retries, xác nhận event thực sự được ghi vào object store sau khi IndexedDB hoạt động lại.

## Chưa thể xác nhận trong Node

Quota thực tế, FPS và IndexedDB implementation của từng browser/device cần chạy browser/device QA; runtime contract và failure path đã có test độc lập.
