# Outpost Current-Node Mutation Patch — 2026-09-18

## Quy tắc

- Lập trạm tiền tiêu chỉ được mutate node mà nhân vật đang đứng.
- Node phải tồn tại và đã được khám phá.
- Yêu cầu lập trạm từ xa bị từ chối trước khi kiểm tra/trừ chi phí.

## Hồi quy

`tools/verify_review_batches.js` di chuyển bản sao state sang node khác rồi yêu cầu lập trạm tại node cũ; test xác nhận mutation thất bại và Linh Thạch không đổi.
