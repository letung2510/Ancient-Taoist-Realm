# Actor history offline projection — 2026-09-17

Offline simulation records a bounded actor-level projection for each NPC. Each sample
contains day, node/sub-location, AI state, status, needs, weather condition, mood, queue
rank and rumor count. The detailed window is 30 days; older samples are pruned while the
aggregate world audit remains available in `worldSimulation.lastOfflineAudit`.

`actorHistorySnapshot(state, npcId)` is the read API. Offline catch-up and serialize/
deserialize must preserve the bounded projection byte-for-byte and must not replay the
same target day twice.

**Note chưa hoàn thiện:** the projection intentionally does not preserve every historical
combat/dialogue micro-event; those belong in aggregate incidents and the novel log.
