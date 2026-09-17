# NPC scheduler state-machine contract

NPC runtime states are restricted to `idle`, `travel`, `present`, `interact`, `shelter`, `combat`, and `queued`.

## Invariants

- `currentNodeId` must exist in map catalog;
- `travelFrom → travelTo` must be an actual map edge;
- `currentSubLocationId` must belong to the current node or be `main`;
- queued NPC must point to its current node and have positive integer `queueRank`;
- needs `shelter/social/duty` stay in 0..100;
- `nextMoveDay` is finite and movement selection is deterministic from seed/action key.

Congestion is resolved after movement using deterministic NPC ID ordering and node capacity. Invalid topology never becomes a teleport; the scheduler enters shelter/queue instead.

## Regression

Offline tick, save/load and repeated same-day simulation must preserve NPC state. `validateNpcScheduler()` is invoked by `validateExpansionState` and rejects invalid edge, queue, sub-location or state records.

## Chưa hoàn thiện

Detailed behavior tuning for individual NPC personalities and route priorities still needs content playtest.
