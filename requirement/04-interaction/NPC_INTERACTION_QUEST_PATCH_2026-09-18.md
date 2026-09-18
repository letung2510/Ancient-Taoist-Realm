# Bản vá tương tác NPC / nhiệm vụ NPC — 2026-09-18

## Luật tương tác

- Chỉ NPC còn sống, đúng node và đúng phân khu mới có thể nói chuyện hoặc giao nhiệm vụ.
- Nhiệm vụ NPC hết hạn sẽ chuyển sang `failed`, không tiếp tục xuất hiện.
- Nhiệm vụ đang `active`, `completed` hoặc `failed` không được phát lại cùng một mã.
- Nhận nhiệm vụ phải ghi `acceptedDay` và log novel riêng.

## Kiểm định

`validateNpcQuestState` kiểm tra identity, bucket, trạng thái, NPC giao nhiệm vụ, hạn và duplicate key. Bộ test kiểm tra nói chuyện, nhận nhiệm vụ một lần, không phát lại khi đang active và chặn NPC đã chết.
