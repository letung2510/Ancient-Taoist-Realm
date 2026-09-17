# WAR FRONT / RUMOR BULLETIN VIEW-MODEL — 2026-09-17

## Canonical DTO

`warFrontSnapshot(state)` exposes every war with status, factions/names, front node IDs, scores, lead, start/end day, cascade flag and outcome. It includes ended wars for history while ordering active fronts first.

`rumorBulletinSnapshot(state, factionId?)` uses the canonical faction bulletin merger, preserving confidence, priority, source NPC IDs and expiry while adding `remainingDays` for UI.

## Invariants

- UI does not infer winner/cascade from raw scores; it consumes `lead`, `cascadeApplied` and `outcome`.
- Rumors are deduplicated by key and never displayed after expiry.
- Snapshot functions are read-model operations; they do not mutate war/rumor state except normal runtime initialization.
- Save/offline replay preserves the DTO inputs and deterministic war outcome.

## Regression

War/offline determinism regression now checks front DTO, score bounds, cascade and outcome. Existing rumor relay/expiry and faction bulletin tests remain required.
