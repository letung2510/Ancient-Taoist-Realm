# Structure Current-Node Mutation Patch — 2026-09-18

## Quy tắc

- Action xây công trình chỉ được mutate node mà nhân vật đang đứng.
- Node phải tồn tại và đã được khám phá.
- Truyền `nodeId` của một node khác không được phép xây từ xa và không được trừ Linh Thạch.
- Các API đọc/preview vẫn có thể nhận `nodeId` để UI dựng trạng thái disabled và lý do.

## Hồi quy

`tools/verify_game.js` di chuyển một bản sao state sang node khác rồi cố xây tại node cũ; test xác nhận mutation bị từ chối và inventory không đổi.
