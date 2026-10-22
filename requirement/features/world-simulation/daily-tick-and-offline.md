# Mô phỏng thế giới — Tick ngày và mô phỏng ngoại tuyến

## Mục đích

Một pipeline tick ngày duy nhất, xác định và idempotent theo ngày tuyệt đối, dùng cho cả online, catch-up và offline; offline dài không làm treo client và không sinh log/thưởng giả.

## Dữ liệu & trạng thái

```js
state.worldSimulation = {
  seed, lastProcessedDay,
  offlinePolicy: { schemaVersion: 1, mode: "aggregate_then_actor_window", detailedWindowDays: 30,
                   aggregateBatchDays: 3, actorStateProjection: "final_state_plus_incidents",
                   actorResolution: "deterministic_event_projection", idempotencyKey: "lastProcessedDay",
                   historyRetentionDays: 30 },
  lastOfflineAudit: { processed, detailed, aggregate, aggregateCadence, mode, targetDay, source },
  actorHistory: { [npcId]: [{ day, nodeId, subLocationId, aiState, status, needs, worldCondition, mood, queueRank, rumorCount }] }, // ≤ 30/NPC
  npcEncounters, offlineEncounterResults,   // ≤ 100
  localIncidents, regionState, factionState, diplomacy, wars, events, hiddenRealms, npcState, …
}
node.history = [{ type, key, day, regionId, summary, … }] // ≤ 50/node
```

## Rules

### Đồng hồ và tính xác định

| ID | Rule |
|---|---|
| WSIM-TICK-001 | Mọi thời hạn gameplay dùng `gameClock` / ngày tuyệt đối (`absoluteDay`); không dùng thời gian máy. Ngày tuyệt đối là đồng hồ duy nhất cho tuổi NPC, lịch, tuyến mùa, tin đồn, kế vị, hạn ủy thác. |
| WSIM-TICK-002 | Mọi kết quả ngẫu nhiên cần replay dùng `seeded(state, scope, day, ordinal)` từ `worldSimulation.seed`; không `Math.random()`. Hai state cùng save identity cho cùng kết quả. |
| WSIM-TICK-003 | Mỗi producer có khóa idempotency ổn định `(systemId, entityId, day, ordinal)` hoặc task ID; chạy lại/catch-up cùng khoảng không nhân đôi sự kiện, thưởng, task hay history. |
| WSIM-TICK-004 | Dữ liệu động (đối thủ đại hội, can thiệp chiến tranh, node biên…) nằm trong runtime/save; tick không sửa catalog tĩnh. |
| WSIM-TICK-005 | Kết quả tick là chuyển trạng thái trước; producer phát sự kiện có cấu trúc qua history/node-history/`emitEvent`, không ghi DOM và không ghi text UI trực tiếp. Nguồn/độ tin cậy/hạn tin đồn và gốc sự kiện luôn tra lại được. |

### Thứ tự tick ngày

| ID | Rule |
|---|---|
| WSIM-TICK-010 | `tick(state, day)` chạy theo thứ tự cố định: (1) hết hạn quest available/active; (2) chuyển pha world event; (3) thời tiết mọi vùng; (4) tuyến thương mại, influence/chủ node hiện tại (đổi chủ → node-history `faction_change`); (5) hiệu ứng thế giới hằng ngày; (6) ngoại giao, chiến tranh; (7) lịch NPC (thọ nguyên → di cư → di chuyển → dấu chân → định cư → tắc nghẽn → tin đồn); (8) phản bội NPC; (9) Bí Cảnh; (10) quân đội/sĩ khí; (11) scheduled task; (12) hết hạn thử thách lòng tin, thử trung thành; (13) khế ước, đấu giá, sự kiện nội bộ thế lực, đại hội; (14) hết hạn khế ước nhận, công trình tông môn; (15) đồng hành; (16) actor history. |
| WSIM-TICK-011 | NPC đã mất trong ngày bị loại khỏi các pha sau của cùng ngày. |
| WSIM-TICK-012 | `worldSimulationSummary(state)` là read model trên regionState, NPC, Bí Cảnh, sự kiện và runtime location; không mutate. |

### Catch-up và offline

| ID | Rule |
|---|---|
| WSIM-OFF-001 | `simulateWorldUntil(state, targetDay, options)`: `target ≤ lastProcessedDay` → trả `{ processed: 0, mode: "idempotent" }`, không mutation. |
| WSIM-OFF-002 | Cửa sổ chi tiết = `offlinePolicy.detailedWindowDays` (mặc định 30, clamp 1..180): các ngày cuối trong cửa sổ chạy `tick` từng ngày (`actor_window`); phần cũ hơn chạy aggregate trước (`aggregate_then_actor_window`). |
| WSIM-OFF-003 | Aggregate ≤ 365 ngày: replay `tick` từng ngày ở chế độ offline (cùng pipeline, parity với online). Aggregate > 365 ngày (trừ `exactParity`): checkpoint projection xác định — hết hạn quest/công trình, tiến pha sự kiện, ngoại giao/chiến tranh ở ngày đầu và cuối, Bí Cảnh, thời tiết, thương mại, nội bộ thế lực, đại hội, lịch NPC, phản bội, quân đội, task, khế ước, đấu giá ở ngày cuối. |
| WSIM-OFF-004 | Phần aggregate chỉ đổi state thế giới: không tự đánh combat, không nhặt loot, không hoàn thành hành động cần lựa chọn của người chơi, không giết NPC người chơi chưa gặp, không tạo log chi tiết giả cho từng actor. |
| WSIM-OFF-005 | Sau xử lý: `lastProcessedDay = target`; ghi `lastOfflineAudit` (`processed`, `detailed`, `aggregate`, `aggregateCadence`, `mode`, `targetDay`, `source` = `offline`/`catch_up`). Offline tạo `localIncidents` cho sự kiện chưa hủy (một bản ghi mỗi sự kiện). |
| WSIM-OFF-006 | Deserialize rồi catch-up tiếp tục từ `lastProcessedDay`, không chạy lại ngày đã xử lý; save thiếu `offlinePolicy`/audit được normalize. |
| WSIM-OFF-007 | `actorHistory[npcId]` giữ tối đa `detailedWindowDays` snapshot ngày (node, sub-location, aiState, status, needs, thời tiết, mood, queueRank, số tin đồn); ngày cũ hơn chỉ còn trạng thái cuối và incident. |
| WSIM-OFF-008 | `resolveOfflineNpcEncounters` dedupe theo encounter key, giữ tối đa 100 kết quả gần nhất; rehydrate không phát thưởng hai lần. |
| WSIM-OFF-009 | `simulateWorldUntilAsync` chia nhỏ cùng pipeline để không chặn UI; kết quả giống bản đồng bộ. |

### Lịch sử node

| ID | Rule |
|---|---|
| WSIM-HIS-001 | Mọi record node-history có `type`, `key`, `day` hữu hạn, `regionId`. `key` là khóa idempotency trong node; producer gửi lại cùng sự kiện không tạo bản sao. |
| WSIM-HIS-002 | Mỗi node giữ tối đa 50 record gần nhất. Producer bắt buộc: sub-location, vòng đời/chuyển giao công trình, thế lực/tiền đồn/chiến tranh, actor (chết, định cư), thời tiết, hoàn thành. |
| WSIM-HIS-003 | `validateNodeHistory(state, nodeId?)` kiểm metadata, key trùng và retention; `validateExpansionState` gọi nó. |

## Acceptance

1. 30 ngày → `actor_window`; 60 ngày → `aggregate_then_actor_window`.
2. Gọi `simulateWorldUntil` lần hai cùng target → `processed: 0`, inventory và worldSimulation không đổi.
3. Rumor cùng key không phình sau offline replay; war cascade chỉ áp một lần sau deserialize/replay.
4. Stress: `node tools/verify_expansion_stress.js --runs=1000 --days=1000` (xác định, giới hạn state, không thưởng offline).
5. Gate: `node tools/verify_offline_parity.js`, `node tools/verify_long_range_replay.js`, `node tools/verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WSIM-TICK-001..003 | `js/expansion.js:absoluteDay`, `seeded`, `tick` | Khớp |
| WSIM-TICK-004..005 | `js/expansion.js:tick`, `history`, `appendNodeHistory` | Khớp |
| WSIM-TICK-010..011 | `js/expansion.js:tick`, `updateNpcSchedules` | Khớp |
| WSIM-TICK-012 | `js/expansion.js:worldSimulationSummary` | Khớp |
| WSIM-OFF-001..006 | `js/expansion.js:simulateWorldUntil`, `simulateWorldAggregate`, `ensureWorldSimulation` | Khớp |
| WSIM-OFF-007 | `js/expansion.js:recordActorHistory`, `actorHistorySnapshot` | Khớp |
| WSIM-OFF-008 | `js/expansion.js:resolveOfflineNpcEncounters` | Khớp |
| WSIM-OFF-009 | `js/expansion.js:simulateWorldUntilAsync` | Khớp |
| WSIM-HIS-001..003 | `js/expansion.js:appendNodeHistory`, `validateNodeHistory` | Khớp |
