# DỊ THỂ CATALOG EFFECT / EXCLUSION SCHEMA — 2026-09-17

## Canonical fields

Every Dị Thể entry has identity, trigger, threshold, max stage, branch, ending tags, faction affinity, cost, stage effects and explicit `exclusions.paths` / `exclusions.professions` arrays.

## Effect schema

Allowed stage/benefit keys are `corruptionResist`, `poisonResist`, `fateResonance`, `stealth`, `elementPenalty`, `sanRecoveryFlat` and `reviveOnce`. Unknown keys are rejected by catalog validation. Percentage effects stay in `[0,1]`; faction affinity stays in `[-10,10]`; stage effect count must equal max stage.

## Exclusion semantics

Dị Thể does not infer locks from its name, branch or ending. Only explicit catalog arrays can block claim. The claim resolver checks both primary/secondary Con Đường and primary/secondary/hidden Nghề slots. Empty arrays mean no exclusion.

## Runtime evidence

`specialPhysiqueModifiers`, `specialPhysiqueOutcome`, `getWorldModifiers` and `claimSpecialPhysique` are the canonical runtime path. Deep regression validates catalog shape, progression, stage effects, outcome projection and save round-trip.
