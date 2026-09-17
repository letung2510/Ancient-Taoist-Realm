# NPC SCHEDULER / CONGESTION CANONICAL — 2026-09-16

## State contract

An NPC has one of the runtime scheduler states `idle`, `travel`, `present`, `queued`, `shelter`, or `combat`. `currentNodeId` is never changed to a non-adjacent node by the scheduler. When a node has more active NPCs than its `npcCapacity` (default `4`), deterministic `npcId` ordering assigns overflow actors:

```js
npc.aiState = "queued"
npc.queueNodeId = nodeId
npc.queueRank = 1..N
npc.nextMoveDay = max(current, day + 1)
```

When capacity becomes available, queued actors return to `present` and queue metadata is removed. The state is serialized with the actor and is visible to future NPC view models.

## Interaction guard

Only NPCs at the player node can be selected for direct dialogue. A queued actor remains physically present at the node but is not treated as a free interaction slot until capacity is available. Combat/shelter states remain higher priority than queue state.

## Regression gate

`tools/verify_review_batches.js` fills one node with six static actors and verifies deterministic queue rank/node assignment. Existing scheduler replay checks verify every movement target is an actual edge.

## Remaining note

The UI does not yet expose queue rank/capacity in a dedicated NPC panel; the runtime/save contract is implemented.
