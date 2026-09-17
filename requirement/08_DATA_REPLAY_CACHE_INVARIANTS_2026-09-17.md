# REPLAY AND CACHE INVARIANTS — 2026-09-17

## Deterministic replay

- Every runtime random producer is either behind `replayRandom`/`seeded` or an explicit entropy boundary used only for initial non-game randomness.
- Action keys include the feature scope and stable turn/day/entity identity; preview and commit use the same resolver without consuming mutable RNG state.
- Static audit discovers every JS source plus root generators and rejects unapproved direct `Math.random()`.

## Cache invalidation

- Map influence cache is valid only when its entry revision equals `mapState.influenceRevision`.
- Any structure, map-event, ownership or outpost mutation increments the revision and clears the cache.
- Save validation requires a positive revision, object cache and finite runtime metric counters; stale cache entries are safe because the resolver fails closed/recomputes.
- NPC view/offline metrics are measured separately from map influence and do not participate in gameplay outcomes.

## Evidence

`verify_random_boundaries.js`, replay/character/combat/offline tests and `testInfluenceOfflineAndInvalidation()` provide current regression evidence. `validateExpansionState()` now rejects malformed cache/metric state.
