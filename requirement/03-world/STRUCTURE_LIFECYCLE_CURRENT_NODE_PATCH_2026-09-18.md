# Structure Lifecycle Current-Node Patch — 2026-09-18

## Quy tắc

Các mutation vòng đời công trình đều yêu cầu nhân vật đang đứng tại node của công trình:

- sửa chữa;
- nâng cấp;
- tạm dừng;
- tháo dỡ;
- chuyển chủ cho NPC.

Guard dùng chung cũng yêu cầu node tồn tại và đã được khám phá. API đọc trạng thái không bị giới hạn bởi guard này.

## Hồi quy

`tools/verify_review_batches.js` tạo công trình, di chuyển bản sao state sang node khác rồi thử sửa chữa; mutation bị từ chối và inventory không đổi.
