# Batch 5 — Runtime Canonical Closure Status — 2026-09-16

## Completed in this batch

1. Canonical OXY coordinates are now used when initializing static locations and when resolving movement targets. Generated coordinates no longer overwrite authored map coordinates. Engine movement stores the exact `travelPlan` used for the commit, and the preview/commit distance/risk regression passes.
2. Player-owned structures with influence effects now participate in the same influence DTO as faction-owned structures. Event influence, cache revision, serialize/deserialize and offline catch-up are covered by regression.
3. NPC rumor state now stores confidence, priority, source, received day and expiry in both the bounded narrative list and the ledger. Propagation is one valid edge per tick, cleans expired entries, and has a source → relay → witness regression.
4. NPC scheduler now has deterministic node capacity and queue metadata (`queued`, `queueNodeId`, `queueRank`). Movement still requires a valid edge. Congestion regression and save round-trip are covered.
5. Fate evolution preview simulates relationship stage 4 and the selected branch exactly once, matching committed derived effects. Insufficient-resource rollback leaves the ready state and resources unchanged.
6. Quest rewards now use the canonical reward ledger for EXP, merit, Linh Thạch, items, Fate, Công Pháp and contribution. Quest reward duplicate execution is covered.
7. Secondary Path is an explicit, confirmed, one-time transition with a canonical cost and save schema. It cannot be inferred from profession, Fate or Dị Thể.
8. Dị Thể claim now evaluates catalog path/profession exclusions without automatically locking either namespace.

## Evidence

- `node tools/verify_review_batches.js` — pass.
- `node tools/verify_dichi_deep.js` — pass.
- `node tools/verify_expansion_stress.js` — pass.
- `node tools/verify_companion_runtime.js` — pass.
- `node tools/verify_indexeddb_archive.js` — pass.
- `node tools/verify_log_narrative.js` — pass.
- `node tools/profile_runtime_budget.js` — pass; current Node profile: 65 influence calls, 0.169 ms average, 3.7 MB serialized sample.
- `node tools/verify_game.js` — pass after the batch.

## Still intentionally open

- Browser visual QA for map, structure, Fate, NPC queue and log cards.
- Full authored content/balance catalog for Dị Thể endings and Path fusion affinity caps.
- Device-level FPS benchmark and large browser archive/quota benchmark.
- Faction bulletin UI and dedicated rumor/queue panels.
- Remaining producer audit outside the canonical quest/expansion reward boundary.
