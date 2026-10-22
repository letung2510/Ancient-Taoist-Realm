# NPC

## Phạm vi

- Lớp thực thể NPC/quái trên schema nền chung, hành vi chiến đấu theo %HP, bảng rớt đồ.
- NPC sống: lịch giờ, di chuyển theo cạnh, di cư mùa, tắc nghẽn node, dấu chân, thọ nguyên, kế nhiệm, định cư.
- Hội thoại, quest NPC, thử thách lòng tin; tương tác xã hội (quà, uy hiếp, đánh thức, phản bội); tương tác tổ chức (cấp bậc, ủy thác, kế vị, phản đồ, mật khố, hòa giải, thử trung thành).
- Không sở hữu ngữ nghĩa chiều quan hệ ([relationship](../relationship/README.md)), lan truyền tin đồn và thứ tự tick ([world-simulation](../world-simulation/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Lớp thực thể, schema, hành vi quái, loot | [entity-classes.md](entity-classes.md) | `NPC-ENT-` | `js/engine.js:combatEntity`, `monsterAction`, `presentEntities` |
| Lịch sinh hoạt, di chuyển, di cư, tắc nghẽn, dấu chân | [schedule-and-routine.md](schedule-and-routine.md) | `NPC-SCH-`, `NPC-INT-001..002` | `js/expansion.js:updateNpcSchedules`, `syncNpcRoutine`, `seasonalDestinationSnapshot`, `trackNpcFootprint` |
| Thọ nguyên, kế nhiệm, định cư | [lifespan-and-settlement.md](lifespan-and-settlement.md) | `NPC-LIF-` | `js/expansion.js:resolveNpcSuccession`, `resolveNpcSettlements`, `settlementSnapshot` |
| Hội thoại, quest NPC, thử thách lòng tin | [dialogue-and-quests.md](dialogue-and-quests.md) | `NPC-DLG-`, `NPC-QST-` | `js/expansion.js:npcTalk`, `npcDialogueAction`, `ensureNpcQuestOffer`, `beginTrustTrial`, `resolveTrustTrial` |
| Tương tác xã hội | [interactions.md](interactions.md) | `NPC-INT-` | `js/expansion.js:giftNpc`, `intimidateNpc`, `updateNpcBetrayals`, `publishPlayerRumor` |
| Tương tác tổ chức | [organization-interactions.md](organization-interactions.md) | `NPC-ORG-`, `NPC-INT-005` | `js/expansion.js:organizationInteract`, `promoteGuildMember`, `resolveOrganizationDefection`, `guildVaultSnapshot`, `resolveAllianceMediation`, `resolveLoyaltyTest` |

## Phụ thuộc

- [relationship](../relationship/README.md) — mọi delta quan hệ qua `recordRelationshipEvent`.
- [world-simulation](../world-simulation/README.md) — tick ngày, tin đồn, sự kiện, chiến tranh, actor history offline.
- [weather](../weather/README.md) — trú ẩn và mood theo thời tiết.
- [map](../map/README.md) — `exits`, `seasonalTags`, sub-location, `npcCapacity`, `settlementCapacity`.
- [fate](../fate/README.md), [reward](../reward/README.md) — Mệnh/loot/thưởng quest.
- [technique](../technique/README.md) — học nội dung mật khố.
- [ui-action-log](../ui-action-log/README.md) — log NPC giữ `npcContext`/`weatherContext`, không lộ mã thô.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | NPC-INT-001..005 (merge 2026-10-22) giữ nguyên ID. | NPC-INT-001..005 |
| 2026-10-22 | Đặc tả NPC/quái kiểu MMO (raid nhiều người, sự kiện toàn server, `respawn_seconds`, giới hạn tuần/server) chuyển sang ngữ cảnh một người chơi: sự kiện thế giới trên save, hồi sinh tính bằng ngày game. Loot Mệnh dùng thang phẩm cấp hiện hành thay cho 8 tier `fate-pool.json` (legacy). | NPC-ENT-009, NPC-ENT-040 |
| 2026-10-22 | Ngưỡng hành vi quái chốt theo runtime: `basic` >60%, `special` ≤60% (×1.4), `desperation` ≤25% HP (thay 50%/20% cũ). | NPC-ENT-030 |
| 2026-10-22 | ID tầng ủy thác chốt theo runtime: `common`, `special`, `life_death` (thay `ordinary`, `life_or_death`). | NPC-ORG-010..013 |
| 2026-10-22 | Lựa chọn thử trung thành chốt theo runtime: `spare` (bảo vệ làng), `attack` (tuân lệnh) thay `protect_village`/`obey_order`. | NPC-ORG-061..062 |
| 2026-10-22 | Tin đồn dùng một chính sách duy nhất của world-simulation (TTL 14 ngày, giảm 0.05/0.20) thay cho mô tả "30 ngày, −20 mỗi bước" trong hợp đồng tương tác cũ. | NPC-INT-021, WSIM-RUM-* |
| 2026-10-22 | Danh sách "gợi ý triển khai/chưa code" cũ là lịch sử, bị loại; trạng thái thực ở `STATUS.md`. | — |

## Gate

- `node tools/verify_review_batches.js`
- `node tools/verify_n90_n114_behavior.js`
- `node tools/verify_world_producer_matrix.js`
- `node tools/verify_game.js`
