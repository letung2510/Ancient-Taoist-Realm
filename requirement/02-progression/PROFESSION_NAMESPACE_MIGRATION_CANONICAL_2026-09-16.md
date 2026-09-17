# Canonical profession namespace migration — 2026-09-16

## Purpose

The runtime has one authoritative profession namespace:

- `professionState.primaryId`: the single primary profession.
- `professionState.secondaryId`: the single hidden profession slot.
- `professionState.hiddenId`: compatibility mirror of `secondaryId`.
- `professionState.hiddenIds`: deduplicated historical/owned hidden-profession IDs.
- `player.hiddenProfession`: compatibility mirror of the active hidden profession.

Normal professions must never be copied into `secondaryId`, `hiddenId`, or `hiddenIds`.
Selecting a primary profession immediately locks all other normal professions. A hidden
profession can only occupy the secondary slot after its Codex clue graph is unlocked.

## Load/migration rules

1. If an old save placed a valid hidden profession in `primaryId` and has no secondary
   profession, move it to `secondaryId` and clear `primaryId`.
2. Prefer a valid hidden `secondaryId`; otherwise recover a valid hidden `hiddenId` or
   `player.hiddenProfession` alias.
3. Discard invalid/normal aliases from the hidden namespace without deleting the primary
   profession record or mastery data.
4. Mirror `hiddenId` and `player.hiddenProfession` from the canonical secondary slot.
5. Deduplicate and filter `hiddenIds` against the hidden-profession catalog.
6. The migration is additive and deterministic; it runs during `ensureExpansionState`
   and is safe to run repeatedly.

## Acceptance and note

The migration must preserve hidden mastery/clue data, prevent a second normal profession,
and survive serialize/deserialize. Regression `testProfessionLegacyNamespaceMigration`
verifies a legacy hidden-primary save and an invalid normal secondary alias.

**Note chưa hoàn thiện:** browser visual QA for every legacy save shape remains a separate
gate; the runtime namespace/migration contract and automated regression are complete.
