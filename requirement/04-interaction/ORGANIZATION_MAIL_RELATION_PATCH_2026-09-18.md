# Bản vá Tổ chức / Quan hệ / Truyền thư — 2026-09-18

## Luật tương tác

- Mỗi tổ chức chỉ nhận một tương tác mỗi ngày, bao gồm cả cầu viện trợ.
- Ủy thác phải có identity, trạng thái và hạn hợp lệ.
- Truyền thư chỉ gửi cho NPC còn sống, trừ phí theo khoảng cách vùng và tạo scheduled task hợp lệ.
- Quan hệ NPC tiếp tục chống duplicate bằng `uniqueKey` và giữ score theo công thức canonical.

## Kiểm định

Validator tổ chức kiểm tra active request; regression hiện có kiểm tra node, quyền tương tác, daily limit và novel log.
