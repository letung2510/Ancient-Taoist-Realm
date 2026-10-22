# Quan hệ — Tác động của hành động xã hội và tin đồn

## Mục đích

Quy định mỗi hành động xã hội/tin đồn được phép tác động chiều quan hệ nào. Luồng, điều kiện và chi phí của hành động nằm ở [npc/interactions.md](../npc/interactions.md); file này chỉ sở hữu ngữ nghĩa chiều.

## Dữ liệu & trạng thái

Dùng `state.relationships` và `recordRelationshipEvent` của [model-and-events.md](model-and-events.md).

## Rules

| ID | Rule |
|---|---|
| REL-SOC-001 | Quà tặng (`sent_gift`, chế độ bond) chỉ đổi `affection`: thích +8, trung lập +1, ghét −6. Không đổi `trust`, `loyalty` hay chiều khác. Quà chế độ giao thương (`trade_gift`) chỉ đổi `respect` +1 và `tradeFavor` của NPC. |
| REL-SOC-002 | Thư kèm vật phẩm giao qua scheduled task là quà tặng: chỉ đổi `affection` theo REL-SOC-001 (thư không vật phẩm: affection +1), key = task ID. |
| REL-SOC-003 | Uy hiếp chỉ đổi `fear`/`suspicion`; thành công đặt vĩnh viễn trust = affection = 0 (fear +30, suspicion +35); thất bại suspicion +12, fear −3. Uy hiếp không bao giờ tăng trust/affection. |
| REL-SOC-004 | Thử thách lòng tin chỉ đổi `trust`: thành công +15, thất bại/hết hạn −10 (một lần, key = trial ID). |
| REL-SOC-005 | Phản bội đổi loyalty/thù địch một lần (sự kiện `abandoned`, suspicion +80, trust −60) và giữ nguyên bản ghi quan hệ trước đó; không xóa sự kiện cũ. |
| REL-SOC-006 | Tin đồn/nhân chứng chỉ ảnh hưởng thái độ lần gặp đầu: lần đầu NPC có tin đồn còn hạn về người chơi, ghi đúng một sự kiện `heard_rumor` (key `rumor:<npcId>:<rumorKey>`): tin anh hùng respect +4; tin phản diện suspicion +8, affection −3. Tin đồn hết hạn hoặc dưới ngưỡng tin cậy không có tác dụng; không ghi đè chiều đã có từ sự kiện trực tiếp. |
| REL-SOC-007 | Đánh thức NPC đang ngủ ghi `disturbed_sleep` (affection −3, trust −1, suspicion +1), key `wake:<npcId>:<day>`. |
| REL-SOC-008 | Loyalty của đồng hành là ledger riêng trong `state.companion`; không ghi vào hay đọc từ `state.relationships`. |

## Acceptance

- Tặng quà thích/trung lập/ghét → chỉ `affection` đổi đúng +8/+1/−6; trust/loyalty giữ nguyên.
- Lần gặp đầu sau tin đồn tạo đúng một sự kiện; nói chuyện lại không áp thêm.
- Gate: `node tools/verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| REL-SOC-001 | `js/expansion.js:giftNpc` (override chỉ affection nhưng default `sent_gift` vẫn cộng trust +3, loyalty +2) | Lệch |
| REL-SOC-002 | `js/expansion.js:processScheduledTasks`, `sendMail` → `mail_letter` (+1 affection) / `mail_gift` (+2 affection, +1 trust), `giftableItem` | Khớp (2026-10-22) |
| REL-SOC-003 | `js/expansion.js:intimidateNpc` | Khớp |
| REL-SOC-004 | `js/expansion.js:resolveTrustTrial` | Khớp |
| REL-SOC-005 | `js/expansion.js:updateNpcBetrayals` | Khớp |
| REL-SOC-006 | `js/expansion.js:npcTalk` → `recordRelationshipEvent` | Khớp (2026-10-22) |
| REL-SOC-007 | `js/expansion.js:npcTalk` (nhánh WAKE) | Khớp |
| REL-SOC-008 | `js/expansion.js:normalizeCompanion` | Khớp |
