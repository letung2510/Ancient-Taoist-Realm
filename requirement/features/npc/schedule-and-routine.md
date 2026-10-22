# NPC — Lịch sinh hoạt, di chuyển, tắc nghẽn, dấu chân

## Mục đích

NPC sống theo lịch giờ trong ngày và di chuyển theo ngày tick qua cạnh bản đồ hợp lệ, xác định theo seed, không teleport, không dùng thời gian máy.

## Dữ liệu & trạng thái

```js
worldSimulation.npcState[npcId] = {
  npcId, status: "alive" | "deceased" | "departed",
  currentNodeId, currentSubLocationId, homeNodeId,
  scheduleType: "static" | "patrol" | "wander" | "itinerant",
  aiState: "idle" | "present" | "travel" | "interact" | "sleeping" | "shelter" | "combat" | "queued",
  travelFrom, travelTo, nextMoveDay, queueNodeId, queueRank,
  dailyRoutine: [{ hourStart, hourEnd, subLocationId, activity }], currentActivity,
  needs: { shelter, social, duty }, shelterState,
  seasonRoute, migrationTargetNodeId, nodeVisitDays: { [nodeId]: [day…] },
  rumors: [], rumorLedger: {}, memoryWithPlayer: [], processedKeys: {}
}
worldSimulation.npcFootprints[nodeId] = [{ id, npcId, sourceNodeId, departedDay, clueClass, followed }]
```

Lịch: 1 năm = 360 ngày, 1 mùa = 90 ngày (xuân, hạ, thu, đông).

## Rules

### Lịch trong ngày

| ID | Rule |
|---|---|
| NPC-SCH-001 | Lịch NPC quan trọng là danh sách khoảng `[hourStart, hourEnd)` không chồng lấn phủ đủ 24 giờ, mỗi khoảng có `subLocationId` hợp lệ và tag hoạt động. Giờ lấy từ `gameClock.dayProgress` (giờ bắt đầu 8), không từ thời gian máy; đánh giá lịch không tiêu RNG và không đẩy mô phỏng. |
| NPC-SCH-002 | Lịch mặc định khi data không khai báo: 0–6 `ngu` (nơi ở), 6–8 `an_uong`, 8–18 `buon_ban` (thương nhân) / `tuan_tra` (lính) / `luyen_cong` (còn lại) tại sub-location phù hợp, 18–22 `an_uong`, 22–24 `ngu`. |
| NPC-SCH-003 | Trong khoảng `ngu`, NPC ở `idle` và thay hội thoại thường bằng hành động `wake` (xem [interactions.md](interactions.md)); đã bị đánh thức trong ngày thì hoạt động `awake`. |

### Di chuyển theo ngày

| ID | Rule |
|---|---|
| NPC-SCH-010 | Scheduler chỉ đổi `currentNodeId` sang node nằm trong `exits` của node hiện tại; route cũ không phải danh sách teleport. |
| NPC-SCH-011 | `static` giữ `present`. `patrol`/`wander` chọn một cạnh hợp lệ bằng seeded resolver; không có cạnh → `shelter`, thử lại ngày sau. |
| NPC-SCH-012 | Duyệt NPC theo thứ tự `npcId` cố định mỗi tick. |
| NPC-SCH-013 | Thời tiết vùng của NPC có `npcShelter` → `shelter`, `needs.shelter +10`, `nextMoveDay ≥ day+1`; rời trú ẩn sau ít nhất 1 ngày, `needs.shelter −5`/ngày. Mỗi ngày `needs.duty +1`. |
| NPC-SCH-014 | Kẻ truy sát sinh từ phản đồ ([organization-interactions.md](organization-interactions.md)) khi tới node của người chơi tạo `pendingNpcPursuit` và vào `combat`. |

### Di cư theo mùa và NPC theo sự kiện

| ID | Rule |
|---|---|
| NPC-INT-001 | Đích di cư theo mùa chỉ khai báo qua `seasonalTags` của node trong `GameData.LOCATIONS` hoặc `GameData.WORLD_MAP.locations`; scheduler không hardcode node ID. Tag theo mùa: xuân `spring_trade`, `trade_hub`; hạ `summer_market`, `event_market`, `event_gathering`; thu `autumn_harvest`, `trade_hub`; đông `winter_market`, `winter_supply`, `winter_shelter`. Mỗi mùa phải có ít nhất một đích; node mới có tag phù hợp tự vào tuyến. |
| NPC-SCH-020 | NPC `itinerant` chọn đích một lần mỗi mùa (khi mùa đổi hoặc đích không còn hợp lệ) trong các node có tag mùa, trừ node hiện tại, bằng seed `npc-season-route:<npcId>:<mùa>`. |
| NPC-INT-002 | Khi World Event vào pha điềm báo (omen), đặt tối đa một "Tử Vi Du Nhân" (vai thầy bói, `itinerant`) tại một node trong vùng sự kiện, mang tin đồn tham chiếu sự kiện đó và rời đi sau khi sự kiện kết thúc. |
| NPC-SCH-021 | NPC gắn sự kiện (courier/seer) chuyển `departed` khi sự kiện không còn active và đã quá 3 ngày sau ngày resolve. Tối đa một courier mỗi sự kiện-vùng. |

### Tắc nghẽn node

| ID | Rule |
|---|---|
| NPC-SCH-030 | Khi số NPC active ở node vượt `npcCapacity` (mặc định 4), NPC dư theo thứ tự `npcId` thành `queued` với `queueNodeId`, `queueRank` 1..N, `nextMoveDay ≥ day+1`. Khi có chỗ, NPC queued về `present` và xóa metadata hàng chờ. Trạng thái lưu cùng actor. |
| NPC-SCH-031 | Chỉ NPC cùng node (và cùng sub-location nếu cả hai có) với người chơi mới chọn được để hội thoại; NPC `queued` vẫn hiện diện nhưng chưa tương tác được. `combat`/`shelter` ưu tiên hơn `queued`. |

### Dấu chân

| ID | Rule |
|---|---|
| NPC-SCH-040 | Dấu chân chỉ tạo khi NPC thực sự rời node: lưu node nguồn, ngày rời, NPC ID, lớp manh mối là hướng la bàn (`dong/tay/nam/bac`) — không lưu đích hiện tại. Giữ 3 ngày, tối đa 20 dấu chân mỗi node. |
| NPC-SCH-041 | `track_footprint` tiêu một hành động, lần theo dấu chân cũ nhất chưa lần; seeded 20% là manh mối giả ("mơ hồ"); mỗi dấu chân chỉ lần một lần; không lộ tọa độ hiện tại, không vượt fog. |

## UI

Danh sách NPC hiện diện theo node/sub-location; NPC đang ngủ hiện hành động "Đánh thức"; NPC trong hàng chờ không hiện nút hội thoại. Không lộ seed, `queueRank` hay đích di cư.

## Acceptance

- Replay scheduler: mọi bước di chuyển là một cạnh thật.
- Một node 6 NPC tĩnh, capacity 4 → 2 NPC `queued` với rank xác định.
- Mỗi mùa có ít nhất một đích di cư hợp lệ.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| NPC-SCH-001..003 | `js/expansion.js:normalizeNpcRoutine`, `npcHour`, `npcRoutineAt`, `syncNpcRoutine` | Khớp |
| NPC-SCH-010..014 | `js/expansion.js:updateNpcSchedules`, `validateNpcScheduler` | Khớp |
| NPC-INT-001, NPC-SCH-020 | `js/expansion.js:updateNpcSchedules`, `seasonalDestinationSnapshot` | Khớp |
| NPC-INT-002, NPC-SCH-021 | `js/expansion.js:startWorldEvent` (seer), `updateNpcSchedules` | Khớp |
| NPC-SCH-030..031 | `js/expansion.js:updateNpcSchedules` (queue), `npcTalk` | Khớp |
| NPC-SCH-040..041 | `js/expansion.js:recordNpcFootprint`, `pruneNpcFootprints`, `trackNpcFootprint` | Khớp |
