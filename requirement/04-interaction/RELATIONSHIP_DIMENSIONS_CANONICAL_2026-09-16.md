# Relationship Dimensions Canonical — 2026-09-16

Quan hệ NPC không còn dùng một điểm duy nhất để suy diễn mọi hành vi.

- `trust`: NPC tin lời và thông tin của nhân vật.
- `loyalty`: mức sẵn sàng giữ lời, bảo vệ hoặc tiếp tục đứng về phía nhân vật.
- `respect`: đánh giá năng lực/danh dự.
- `fear`: áp lực cưỡng chế; không biến thành thiện cảm.
- `suspicion`: nghi ngờ; cao có thể khóa đối thoại hoặc dẫn tới phản bội.
- `score`: điểm tổng hợp để sort/hiển thị, không thay thế năm chiều trên.

`recordRelationshipEvent()` là producer canonical. Mỗi event có `uniqueKey`, day, location, quest, outcome và delta; event lặp bị từ chối. `relationshipTier()` chỉ dùng ngưỡng trust/respect/fear/suspicion; loyalty được trả riêng trong DTO.

Companion vẫn là state độc lập: loyalty của companion không ghi đè loyalty của NPC relationship. Mutation, damage, recovery và revive giữ ledger riêng.

Trạng thái: **ĐÃ CODE**, đã bổ sung UI hiển thị Trung thành và regression companion/relationship. Benchmark hành vi NPC cấp actor dài ngày vẫn tiếp tục ở offline simulation gate.
