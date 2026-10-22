# Quan hệ — Mô hình chiều và sự kiện

## Mục đích

Quan hệ NPC không dùng một điểm duy nhất; sáu chiều độc lập cùng một producer sự kiện idempotent quyết định mọi thay đổi.

## Dữ liệu & trạng thái

```js
state.relationships[npcId] = {
  schemaVersion: 2,
  trust, respect, affection, loyalty, fear, suspicion, // 0..100
  score,                       // dẫn xuất
  decayPolicy: "event_only",
  migration?: { source: "legacy_trust", fields, appliedAtDay }
}
state.relationshipEvents[npcId] = [{ id, tag, day, locationId, questId, outcome, deltas, uniqueKey }] // ≤ 20
worldSimulation.npcState[npcId].memoryWithPlayer = [event…] // ≤ 10
```

## Rules

| ID | Rule |
|---|---|
| REL-DIM-001 | Sáu chiều độc lập, clamp `[0,100]`: `trust` (tin lời/thông tin), `respect` (đánh giá năng lực/danh dự), `affection` (thiện cảm), `loyalty` (sẵn sàng giữ lời/bảo vệ/đứng về phía nhân vật), `fear` (áp lực cưỡng chế, không chuyển thành thiện cảm), `suspicion` (nghi ngờ; cao có thể khóa đối thoại hoặc dẫn tới phản bội). |
| REL-DIM-002 | Không chiều nào được alias, sao chép hay suy ra từ chiều khác trong lúc chơi; không thay bằng danh tiếng toàn cục. |
| REL-DIM-003 | `score = trust + respect − 0.5 × (fear + suspicion)`; `affection`, `loyalty` không vào score. Score chỉ để sort/hiển thị, không là điều kiện hành động; validator báo lỗi nếu score lệch công thức > 0.0001. |
| REL-DIM-004 | Suy giảm là `event_only`: offline/world tick không giảm thụ động chiều nào. Chính sách suy giảm mới phải nêu chiều, tốc độ và quyết định migration. `stagnantDays` chỉ là bộ đếm không tương tác. |
| REL-EVT-001 | Mọi thay đổi chiều đi qua `recordRelationshipEvent(state, npcId, tag, { uniqueKey, deltas, questId, outcome })`. Không producer nào ghi thẳng vào `state.relationships`. |
| REL-EVT-002 | `uniqueKey` ổn định (mặc định `tag:<day>`); key trùng bị từ chối `{ success:false, duplicate:true }` và không đổi giá trị. |
| REL-EVT-003 | Delta = mặc định của tag ⊕ `options.deltas` (override theo chiều); áp toàn bộ một lần, clamp một lần, rồi tính lại score. Bản ghi sự kiện lưu delta hiệu lực cùng ngày, node, quest, outcome. |
| REL-EVT-004 | Mỗi NPC giữ tối đa 20 sự kiện; `memoryWithPlayer` của NPC runtime giữ 10 sự kiện gần nhất. |
| REL-EVT-005 | NPC bị uy hiếp thành công (`intimidatedPermanently`) có delta `trust`/`affection` bị ép 0 và hai chiều này luôn = 0 sau mỗi sự kiện. |
| REL-EVT-006 | Bảng delta mặc định theo tag (dùng khi producer không override): `talked` trust/respect/affection +1; `saved` trust +12, respect +8, loyalty +10, affection +4; `threatened` fear +12, suspicion +8, loyalty −8, affection −8; `kept_promise` trust +8, loyalty +7, affection +2; `broke_promise` trust −12, suspicion +12, loyalty −15, affection −12; `shared_reward` trust +7, respect +4, loyalty +5, affection +3; `used_forbidden_art` fear +5, suspicion +10, loyalty −4, affection −3; `supported_faction` respect +6, loyalty +6; `abandoned` trust −8, loyalty −10, affection −6; `disturbed_sleep` affection −3, trust −1, suspicion +1; `sent_gift` chỉ affection (xem [REL-SOC-001](social-effects.md)). |
| REL-TIER-001 | `relationshipTier` xét theo thứ tự: suspicion ≥70 → `hostile` "Đề Phòng"; trust ≥60 và suspicion <40 → `trusted` "Tín Hữu"; respect ≥50 → `respected` "Kính Trọng"; fear ≥50 → `afraid` "Kính Sợ"; còn lại `known` "Sơ Giao". Loyalty và score trả kèm trong DTO, không quyết định tier. |
| REL-TIER-002 | `relationshipBreakdown` trả đủ 6 chiều, `relationshipScore`, `decayPolicy` cho UI; tab Quan hệ hiển thị Tín, Kính Trọng, Thiện Cảm, Trung Thành là các giá trị riêng. |
| REL-MIG-001 | Save thiếu `affection` và/hoặc `loyalty`: khởi tạo từ `trust` của save đúng một lần, ghi `relation.migration = { source: "legacy_trust", fields, appliedAtDay }`; đặt `schemaVersion ≥ 2`, `decayPolicy="event_only"`. Ngoài migration này không có nguồn legacy khác. |
| REL-SAV-001 | `validateRelationshipPolicy` từ chối chiều ngoài `[0,100]`/không hữu hạn, score lệch công thức, `decayPolicy` khác `event_only` (NPC) hoặc khác `none` (quan hệ Mệnh Số). |

## Acceptance

- Gọi lại cùng `uniqueKey` không đổi giá trị; save/load giữ nguyên 6 chiều và lịch sử sự kiện.
- Offline nhiều ngày không có sự kiện → giá trị không đổi.
- Save cũ chỉ có `trust` → affection/loyalty = trust, có `migration`, chạy lại normalize không áp lần hai.
- Gate: `node tools/verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| REL-DIM-001..003 | `js/expansion.js:RELATIONSHIP_POLICY`, `recordRelationshipEvent` | Khớp |
| REL-DIM-004 | `js/expansion.js:PRODUCT_POLICY.npcRelationshipDecay` | Khớp |
| REL-EVT-001 | `js/expansion.js:npcTalk` (tin đồn), `js/engine.js:talk` fallback → `recordRelationshipEvent`; `relationScore` dùng chung | Khớp (2026-10-22) |
| REL-EVT-002..005 | `js/expansion.js:recordRelationshipEvent` | Khớp |
| REL-EVT-006 | `js/expansion.js:recordRelationshipEvent` (`sent_gift` mặc định trust +3, loyalty +2) | Lệch |
| REL-TIER-001..002 | `js/expansion.js:relationshipTier`, `relationshipBreakdown` | Khớp |
| REL-MIG-001 | `js/expansion.js:ensure` (normalize `state.relationships`) | Khớp |
| REL-SAV-001 | `js/expansion.js:validateRelationshipPolicy` | Khớp |
