# Quan hệ

## Phạm vi

- Quan hệ người chơi ↔ NPC theo 6 chiều độc lập, chỉ thay đổi qua sự kiện quan hệ idempotent.
- Bậc quan hệ (tier), điểm tổng hợp hiển thị, migration save cũ, chính sách không suy giảm thụ động.
- Ảnh hưởng của từng hành động xã hội/tin đồn lên các chiều.
- Không sở hữu luồng hành động NPC (xem [npc/interactions.md](../npc/interactions.md)), danh tiếng tổ chức (xem [npc/organization-interactions.md](../npc/organization-interactions.md)), loyalty đồng hành ([companion](../companion/README.md)) hay quan hệ giữa các Mệnh Số ([fate](../fate/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Mô hình chiều, sự kiện, tier, migration | [model-and-events.md](model-and-events.md) | `REL-DIM-`, `REL-EVT-`, `REL-TIER-`, `REL-MIG-` | `js/expansion.js:recordRelationshipEvent`, `relationshipTier`, `relationshipBreakdown`, `validateRelationshipPolicy` |
| Tác động của hành động xã hội & tin đồn | [social-effects.md](social-effects.md) | `REL-SOC-` | `js/expansion.js:giftNpc`, `intimidateNpc`, `npcTalk`, `processScheduledTasks`, `resolveTrustTrial`, `updateNpcBetrayals` |

## Phụ thuộc

- [npc](../npc/README.md) — producer hành động (tặng quà, uy hiếp, thử thách lòng tin, phản bội, đánh thức).
- [world-simulation/events-and-rumors.md](../world-simulation/events-and-rumors.md) — tin đồn và độ tin cậy.
- [ui-action-log](../ui-action-log/README.md) — tab Quan hệ hiển thị Tín, Kính Trọng, Thiện Cảm, Trung Thành riêng; delta là stat có cấu trúc, không nhét vào câu tường thuật.
- [data-runtime](../data-runtime/README.md) — `validateExpansionState` gọi validator quan hệ.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-09-17 | Suy giảm quan hệ NPC là `event_only`; quan hệ Mệnh Số `none`; `stagnantDays` chỉ là bộ đếm. | REL-DIM-004 |
| 2026-10-22 | REL-MIG-001: nguồn legacy cho `affection` và `loyalty` thiếu là `trust` của save, áp một lần, ghi `relation.migration`. | REL-MIG-001 |
| 2026-10-22 | Giá trị quan hệ CHỈ thay đổi qua `recordRelationshipEvent`; mọi lối ghi trực tiếp (kể cả nhánh tin đồn trong `npcTalk`) là Lệch. | REL-EVT-001, REL-SOC-006 |
| 2026-10-22 | Quà tặng chỉ tác động `affection`, không tác động `trust`/`loyalty`; quà qua thư (scheduled mail) cũng vậy. | REL-SOC-001, REL-SOC-002 |
| 2026-10-22 | Ảnh hưởng tin đồn lên lần gặp đầu chốt theo giá trị runtime (anh hùng: respect +4; phản diện: suspicion +8, affection −3), ghi thành một sự kiện quan hệ; thay cho mô tả "tối đa ±10" chung chung. | REL-SOC-006 |
| 2026-10-22 | Tài liệu sinh quan hệ Mệnh Số (Tương Sinh/Tương Khắc/Combo/Dung Hợp từ `fate-relationships.json`, bảng SQL gợi ý) bị loại khỏi feature này: là dữ liệu legacy đã bị feature Mệnh Số thay thế. | — |

## Gate

- `node tools/verify_review_batches.js`
- `node tools/verify_companion_runtime.js`
- `node tools/verify_game.js`
