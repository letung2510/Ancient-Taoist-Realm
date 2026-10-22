# NPC — Tương tác xã hội (tặng quà, uy hiếp, đánh thức, xâm nhập đêm, phản bội)

## Mục đích

Luồng, điều kiện và chi phí của các hành động xã hội trực tiếp với NPC. Ngữ nghĩa chiều quan hệ bị tác động nằm ở [relationship/social-effects.md](../relationship/social-effects.md); mọi thay đổi quan hệ đi qua `recordRelationshipEvent`.

## Dữ liệu & trạng thái

`npcState[npcId]`: `preferences[]`, `dislikedGiftTags[]`, `actorClass`, `role`, `tradeFavor`, `realmIndex`, `intimidatedPermanently`, `intimidationFailures`, `corruptionTolerance`, `rivalOffer`, `companionUntilDay`, `betrayalWarning { status, warnedDay, reason, resolvesDay }`, `hostileToPlayer`, `wokenAtDay`.
`state.flags.giftLedger[npcId] = { day, count }`, `state.intel[id]`.

## Rules

### Tặng quà

| ID | Rule |
|---|---|
| NPC-INT-010 | Điều kiện: NPC `alive`, cùng node; vật phẩm tồn tại, số lượng tự do ≥1, không phải vật phẩm quest/đang trang bị/khóa. Tối đa 3 quà mỗi NPC mỗi ngày. |
| NPC-INT-011 | Hai chế độ: `bond` (nhân duyên; NPC `transactional_ephemeral` không nhận) và `trade` (chỉ NPC có vai thương nhân hoặc sở thích `trade`/`currency`). |
| NPC-INT-012 | Sở thích phân giải từ tag/tên vật phẩm so với `preferences`/`dislikedGiftTags` của NPC: thích, trung lập, ghét. Delta theo REL-SOC-001. |
| NPC-INT-013 | Giao dịch nguyên tử: trừ đúng 1 vật phẩm; sự kiện quan hệ bị từ chối (key trùng `mode:gift:<npcId>:<itemId>:<day>`) → hoàn vật phẩm và bộ đếm. Phản hồi chỉ mô tả phản ứng của NPC, không lộ sở thích số. |

### Uy hiếp

| ID | Rule |
|---|---|
| NPC-INT-003 | Cổng uy hiếp đọc Tà Nhiễm (`player.corruptionRating ≥ 50`) cộng chênh lệch cảnh giới (mặc định ≥ 2 bậc); "danh tiếng hắc đạo" chính là chỉ số này. NPC bị uy hiếp thành công bị đánh dấu vĩnh viễn: trust/affection giữ 0, không hồi qua sự kiện thường, uy hiếp lần nữa bị từ chối. |
| NPC-INT-014 | Một lần kiểm tra seeded mỗi NPC/ngày: `skill = TàNhiễm + 10×chênh cảnh giới + bonus`, `chance = clamp(0.35 + skill/200, 0.1, 0.95)`; `skill ≥ 100` luôn thành công. |
| NPC-INT-015 | Thành công: nhận một tin tình báo "Lời Khai Bị Ép" từ tri thức NPC (tin đồn đầu tiên hoặc lịch tuần tra tổ chức), không bịa phần thưởng ngoài tri thức/kho của NPC; 30% seeded báo cáo về tổ chức của NPC (stability −2, danh tiếng −8). |
| NPC-INT-016 | Thất bại: tiêu hành động, không phần thưởng, tăng suspicion (REL-SOC-003), tăng `intimidationFailures`. |

### Đánh thức và xâm nhập đêm

| ID | Rule |
|---|---|
| NPC-INT-017 | NPC đang `ngu`: hội thoại thay bằng `wake`; ghi `disturbed_sleep` (REL-SOC-007); seeded 35% NPC nhận ra người quấy rầy → `interact`, ngược lại `present`; một lần mỗi NPC/ngày. |
| NPC-INT-004 | Móc xâm nhập đêm: trộm hoặc điều tra tại sub-location nơi ở của NPC đang ngủ có xác suất bị phát hiện thấp hơn ban ngày, nhưng bị phát hiện thì phạt quan hệ và tổ chức nặng hơn ban ngày. Giá trị cấu hình, phân giải bằng một lần kiểm tra seeded, ghi một sự kiện quan hệ. |

### Phản bội

| ID | Rule |
|---|---|
| NPC-INT-018 | Phản bội là state machine `stable → warning → betrayed`, không bao giờ là sự kiện ngẫu nhiên vô điều kiện. Điều kiện: (Tà Nhiễm người chơi > `corruptionTolerance` của NPC, mặc định 40, hoặc `rivalOffer ≥ 70`) VÀ (đang đồng hành `companionUntilDay > day` hoặc trust ≥ 70). |
| NPC-INT-019 | Đủ điều kiện lần đầu → một cảnh báo (`warning`, `resolvesDay = day+1`), quan sát được qua hội thoại ít nhất một ngày trước khi phản bội. Điều kiện mất trong cửa sổ → `withdrawn`. |
| NPC-INT-020 | Hết cửa sổ mà chưa xử lý → phản bội một lần: `hostileToPlayer`, `aiState="combat"`, sự kiện `abandoned` (REL-SOC-005), một dòng log; không xóa vật phẩm, quest hay tham chiếu save. |

### Tin đồn từ việc làm của người chơi

| ID | Rule |
|---|---|
| NPC-INT-021 | Việc làm công khai đáng kể phát một tin đồn duy nhất theo key qua `publishPlayerRumor` (nhân chứng: NPC cùng node hoặc cùng tổ chức của người chơi); lan truyền, hạn và độ tin cậy theo [world-simulation/events-and-rumors.md](../world-simulation/events-and-rumors.md). |

## Acceptance

- Quà: cùng vật phẩm/NPC/ngày lần hai bị từ chối và vật phẩm được hoàn.
- Uy hiếp thành công → trust/affection 0 vĩnh viễn; lần sau bị từ chối.
- Phản bội luôn có ít nhất một ngày cảnh báo.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_n90_n114_behavior.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| NPC-INT-010..013 | `js/expansion.js:giftNpc`, `giftBond`, `giftTrade` | Khớp |
| NPC-INT-003, 014..016 | `js/expansion.js:intimidateNpc` | Khớp |
| NPC-INT-017 | `js/expansion.js:npcTalk` (WAKE), `syncNpcRoutine` | Khớp |
| NPC-INT-004 | — | Thiếu |
| NPC-INT-018..020 | `js/expansion.js:updateNpcBetrayals` | Khớp |
| NPC-INT-021 | `js/expansion.js:publishPlayerRumor` | Khớp |
