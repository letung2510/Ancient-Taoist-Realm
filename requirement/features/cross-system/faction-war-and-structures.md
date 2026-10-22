# Cross-system — Thế lực, chiến tranh, dự án tông môn và công trình (SYS-02)

## Mục đích

Ngoại giao giữa các thế lực, chiến tranh theo mặt trận, sự kiện nội bộ, dự án Công Trình Tông Môn và quyền sở hữu/catalog công trình bản đồ. Tông Môn Đại Hội: [guild-tournament.md](guild-tournament.md). Quan hệ người chơi với tổ chức: [organization-interaction.md](organization-interaction.md).

## Dữ liệu & trạng thái

```js
FactionRuntimeState { factionId, power, resources, stability, reputationWithPlayer,
  ownedNodeIds: [], traits: [], activeProjectId, lastInternalEventDay }
DiplomacyRecord { factionA, factionB, tension: -100..100,
  status: "dong_minh"|"trung_lap"|"thu_dich", reasons: [], lastChangedDay }
WarRecord { id, factionA, factionB, startedDay, frontNodeIds: [], scoreA, scoreB,
  status: "active"|"truce"|"ended", playerInterventions: [] }
GuildProject { id, guildId, templateId, startDay, endDay, progress,
  playerContributions: {}, milestones: [], status }
Structure { type, level, integrity, status, ownerType: "player"|"npc"|"faction", ownerId,
  effects, transferHistory: [{ from, to, day }] }
```

## Rules

### Ngoại giao và chiến tranh

| ID | Rule |
|---|---|
| CSX-FAC-001 | Key cặp ngoại giao sort hai faction ID; không có hai bản ghi A–B/B–A. |
| CSX-FAC-002 | Tension gốc lấy từ alignment/trait/dữ liệu ngoại giao. Drift mỗi 7 ngày một lần: tranh tài nguyên +2…+5; nợ máu +5; kẻ thù chung −5; người chơi can thiệp tối đa ±15/event. `tension ≤ −60` → đồng minh; `≥ 60` → thù địch. |
| CSX-FAC-003 | Chiến tranh chỉ mở khi thù địch đủ 7 ngày hoặc có trigger đặc biệt; sau hòa ước cooldown 30 ngày. |
| CSX-FAC-004 | Mặt trận chỉ gồm node của hai bên có cạnh giáp nhau. `factionPower = highestRealmWeight × scale × resourceFactor × stabilityFactor`. Mỗi 3 ngày resolve một trận deterministic, tối đa một node đổi chủ. |
| CSX-FAC-005 | Người chơi tham chiến qua quest/combat thật; thắng cộng war score, không tự bảo đảm chiếm node. Sơn Môn chính không bị xóa; thua thì thành `occupied` và mở quest giải phóng. |
| CSX-FAC-006 | Trait → sự kiện nội bộ: lục đục/phản bội, suy tàn/mất tài nguyên, trỗi dậy/chiếm node, thánh địa/mở Bí Cảnh, bí pháp thất truyền/quest khám phá. Mỗi thế lực tối đa một sự kiện nội bộ active. |
| CSX-FAC-007 | UI: cạnh bản đồ tô theo ngoại giao, node chiến tranh có icon kiếm (kèm text thay thế); panel Tổ chức có ngoại giao, dự án và Đại Hội. |

### Công Trình Tông Môn (dự án)

| ID | Rule |
|---|---|
| CSX-PRJ-001 | Ba template: **Tu Sửa Linh Mạch** (12 ngày, mục tiêu 30, thưởng tu luyện ×1.1 trong 15 ngày), **Dựng Hộ Sơn Trận** (15 ngày, 40, SAN drain ×0.85 trong 20 ngày), **Truy Tìm Bí Pháp** (18 ngày, 50, 1 token thí luyện Công Pháp, 30 ngày). |
| CSX-PRJ-002 | Đóng góp bằng vật phẩm/công lao/objective combat. Contribution dự án tách khỏi `guildMembership.contribution` dùng xét cấp bậc. |
| CSX-PRJ-003 | Dự án hết hạn hoặc người chơi rời tông môn giữa dự án được xử lý theo receipt; không thưởng hai lần; save round-trip giữ tiến độ. |

### Công trình bản đồ

| ID | Rule |
|---|---|
| CSX-STR-001 | Xây/sửa/nâng cấp/tháo dỡ đọc `STRUCTURE_CATALOG`, không chép chi phí/trần vào code action: xây `buildCost`; sửa `repairDivisor`; nâng cấp `upgradeBase`, `maxLevel`, `chargesPerUpgrade` và hiệu ứng mỗi cấp; tháo dỡ `refundRate`. Hiệu ứng catalog merge khi xây; chỉ công trình active vào resolver influence/ward. Mọi thay đổi gọi `invalidateMapInfluence` (DATA-VAL-002). |
| CSX-STR-002 | Công trình có `ownerType` (`player`/`npc`/`faction`) và `ownerId`. Chủ player được sửa/nâng cấp/tháo dỡ bằng action; công trình NPC không cho người chơi quản lý; công trình faction người chơi được sửa nhưng không nâng cấp. |
| CSX-STR-003 | Chuyển chủ ghi `{ from, to, day }` vào `transferHistory`; thỉnh cầu tiền đồn là transition riêng từ player sang faction. `structureManagerDecision(state, structure, action)` là API quyền canonical (UI: UI-LAY-034). |
| CSX-STR-004 | Tháp canh lộ node kề theo `revealAdjacentNodes` và cấp công trình. |
| CSX-STR-005 | Trạm giao thương tạo nhịp ghé 3 ngày và bảo đảm một NPC thương nhân lưu động. `mapState.influenceMap` lưu snapshot theo node, `regionInfluence` tổng hợp theo vùng. |

## Acceptance

- Ngưỡng tension, key cặp, cooldown, phát hiện mặt trận, hết hạn dự án, rời tông môn giữa dự án, save round-trip.
- Test xây/sửa/nâng cấp/tháo dỡ so delta tài nguyên với giá trị catalog và giữ invalidation; faction-owned sửa được nhưng không nâng cấp.
- Gate: `verify_dichi_deep.js`, `verify_review_batches.js`, `verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-FAC-001–005 | expansion.js: `diplomacy`, `wars`, ngưỡng ±60, `occupied` | Khớp |
| CSX-FAC-005 | expansion.js: quest giải phóng | Thiếu — không tìm thấy luồng liberation quest |
| CSX-PRJ-001–003 | data/expansion_data.js:`guildProjects`; expansion.js:`guildProject`, `validateGuildProjectState` | Khớp |
| CSX-STR-001 | expansion.js:`STRUCTURE_CATALOG` | Khớp |
| CSX-STR-002/003 | expansion.js:`structureManagerDecision` | Khớp |
| CSX-STR-004 | — (`revealAdjacentNodes` không có trong runtime) | Thiếu |
| CSX-STR-005 | expansion.js: thương nhân `itinerant` | Khớp |
