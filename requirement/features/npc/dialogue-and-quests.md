# NPC — Hội thoại, nhiệm vụ NPC, thử thách lòng tin

## Mục đích

Luồng hội thoại thống nhất kiểm tra trạng thái quest, cung cấp quest có hạn theo ngày game và cơ chế thử thách lòng tin trước hành động được bảo vệ.

## Dữ liệu & trạng thái

```js
state.dialogueState = { schemaVersion: 1, phase, profileId, npcId, questId, lastDay, history: [] } // history ≤ 12
Quest {
  id, giver_npc_id, type: "Normal" | "Eldritch" | "Cursed" | "Hidden_Lore" | "Faction_Chain",
  title, description,
  requirements: { min_realm, faction_reputation, prerequisite_quest_ids: [] },
  objectives: [{ type, target, count }],
  rewards: { exp, linh_thach, faction_reputation, items: [], fate_drop_pool_id },
  fail_conditions: { san_check, expiresDay, penalty_on_fail },
  priority: 0 | 1 | 2,      // 0 = Eldritch/Backfire cưỡng chế, 1 = thường, 2 = thấp
  transferable, frequency
}
state.npcTrustTrials[npcId] = { id, npcId, kind, status, createdDay, deadlineDay, evidence, retryAfterDay, resolvedDay }
```

## Rules

### Hội thoại

| ID | Rule |
|---|---|
| NPC-DLG-001 | State machine: `IDLE_GREET` → (Nói chuyện) `CHECK` → một trong `OFFER` (chưa nhận: Nhận / Từ chối / Hỏi lore), `PROGRESS` (đang làm, gợi ý phần còn thiếu), `TURN_IN` (đủ điều kiện: trả thưởng, quest DONE), `GENERIC_CHAT` (phiếm/lore/bán đồ nếu có shop). |
| NPC-DLG-002 | Mở hội thoại yêu cầu NPC `alive`, cùng node và sub-location với người chơi, không `queued` ([schedule-and-routine.md](schedule-and-routine.md)). NPC thù địch hoặc thuộc tổ chức người chơi đã phản bội từ chối hội thoại. |
| NPC-DLG-003 | Đang có cảnh báo phản bội (`betrayalWarning.status="warning"`) thì mỗi lần mở hội thoại phát một dòng log cảnh báo quan sát được. |
| NPC-DLG-004 | Mở hội thoại lần đầu sau khi NPC nghe tin đồn còn hạn về người chơi áp tác động tin đồn đúng một lần ([relationship/social-effects.md](../relationship/social-effects.md#rules), REL-SOC-006). |
| NPC-DLG-005 | Ký hiệu trên NPC: `!` vàng = có quest mới nhận được; `?` vàng = quest đủ điều kiện trả; `!` xám = có quest nhưng chưa đủ điều kiện nhận; `?` xám = đang làm, chưa đủ điều kiện trả; không ký hiệu = không có quest liên quan. |

### Nhiệm vụ NPC

| ID | Rule |
|---|---|
| NPC-QST-001 | NPC quan trọng có thể đưa quest có hạn; hạn tính bằng ngày game (`expiresDay`), không bằng giây thực. Tick ngày chuyển quest `available`/`active` quá hạn sang `failed`. |
| NPC-QST-002 | Quest chuỗi tông môn kiểm `requirements.faction_reputation` theo danh vọng tổ chức; quest Eldritch có `san_check=true`. |
| NPC-QST-003 | Quest priority 0 đứng đầu Quest Log và theo luồng cưỡng chế của [entity-classes.md](entity-classes.md) NPC-ENT-022. |
| NPC-QST-004 | Phần thưởng quest phát qua reward ledger một lần; quest Mệnh Số dùng luồng nhận Mệnh hiện hành của [reward](../reward/README.md). |

### Thử thách lòng tin

| ID | Rule |
|---|---|
| NPC-QST-010 | Chỉ NPC quan trọng (`isImportant`, `canTeachRareTechnique` hoặc `canBecomeAnchor`) và loại `keep_secret`, `anchor`, `teach_secret` mới tạo được thử thách. ID ổn định `trust:<npcId>:<kind>:<createdDay>`. |
| NPC-QST-011 | Tối đa một thử thách active mỗi NPC; gọi lại khi đang active trả bản ghi cũ (`duplicate:true`); không tạo lại trước `retryAfterDay`. |
| NPC-QST-012 | Trạng thái `active → passed | failed | expired`, terminal idempotent. `deadlineDay = createdDay + 14` (tính cả ngày đó). |
| NPC-QST-013 | Thành công trước hạn: trust +15 một lần, chỉ mở hành động được bảo vệ đó, bằng chứng gắn với hành động. Thất bại hoặc hết hạn: trust −10 một lần, `retryAfterDay = day + 30`. Thử thách đã hết hạn không thể pass. |
| NPC-QST-014 | Tick ngày tự hết hạn thử thách khi `day > deadlineDay`. Save cũ: hạn được migrate về `createdDay + 14`, cooldown 30 ngày. |

## UI

Nút hội thoại theo phase; gợi ý tiến độ bằng lời, không hiện số ẩn. Thử thách lòng tin hiển thị hạn bằng ngày game.

## Acceptance

- NPC khác node/sub-location hoặc đang queued → hội thoại bị từ chối với lý do.
- Thử thách: tạo → hết hạn → trust −10 đúng một lần, không tạo lại trong 30 ngày.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_n90_n114_behavior.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| NPC-DLG-001 | `js/expansion.js:npcTalk`, `npcDialogueAction`; `js/engine.js` (`IDLE_GREET`) | Khớp |
| NPC-DLG-002..003 | `js/expansion.js:npcTalk`, `ensureNpcQuestOffer` | Khớp |
| NPC-DLG-004 | `js/expansion.js:npcTalk` → `recordRelationshipEvent` | Khớp (2026-10-22) |
| NPC-DLG-005 | `js/engine.js` quest marker | Khớp |
| NPC-QST-001 | `js/expansion.js:tick` (quest expiry) | Khớp |
| NPC-QST-002..004 | `js/expansion.js:ensureNpcQuestOffer`; `js/engine.js` quest log | Khớp |
| NPC-QST-010..013 | `js/expansion.js:beginTrustTrial`, `resolveTrustTrial` | Khớp |
| NPC-QST-014 | `js/expansion.js:tick` (trust trial expiry) | Khớp |
