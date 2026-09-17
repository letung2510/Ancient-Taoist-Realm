# NPC RUMOR PROPAGATION CANONICAL — 2026-09-16

## State contract

Each active NPC owns two synchronized views of rumor knowledge:

```js
npc.rumors = [{ key, text, confidence, priority, sourceNpcId, receivedDay, expiresDay }]
npc.rumorLedger[key] = { confidence, priority, sourceNpcId, receivedDay, expiresDay }
```

`rumorLedger` is the deduplication and comparison source. `rumors` is the bounded narrative list used by NPC view models. A rumor is accepted only when the incoming confidence is higher than the stored confidence for that key.

## Propagation

- A rumor travels at most one valid map edge per world tick.
- Same-node transfer loses `0.05` confidence; adjacent-node transfer loses `0.20`.
- Source, received day, priority and expiry are preserved through relay.
- The source and target must both be alive NPC actors; movement never bypasses `D.LOCATIONS[actor.currentNodeId].exits`.
- Offline simulation uses the same tick resolver and therefore cannot create a different rumor graph for the same seed/day range.

## Expiry and retention

- `expiresDay` is authoritative for both `rumors` and `rumorLedger`.
- Expired entries are removed before propagation on each tick.
- The narrative list is bounded to the latest 12 entries per NPC.
- Faction bulletin/quest systems must consume the ledger confidence instead of reading the entire world state directly.

## Regression gate

`tools/verify_review_batches.js` verifies source → relay → witness propagation across two valid edges, confidence decay, expiry cleanup, and valid actor state. Any producer adding a rumor must provide a stable `key` and expiry.

## Remaining note

Faction bulletin thresholds and a browser-facing NPC rumor panel still require UI/content QA; the runtime propagation contract is implemented.
# Faction bulletin projection

The runtime exposes `factionBulletin(state, factionId)` as the canonical read
model for the UI. It merges live NPC rumors and `rumorLedger` entries, removes
expired entries, deduplicates by rumor key, and orders by priority, confidence,
then expiry. Each row retains expiry day and source NPC count; the bulletin is a
projection only and cannot mutate rumor state.
