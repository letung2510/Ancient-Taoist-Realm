# Runtime Logic Integration Contract

## Canonical save

Save runtime uses schema `tu_vi_quy_di_canonical_v13`. Unknown world events are preserved in
`state.unknownContent.events` with `dormant` status; unknown awakening branches remain sealed
on the item legacy record and must never be silently discarded.

## Weather contract

Every weather mutation writes `weather`, `weatherIntensity`, `weatherUntilDay`, `weatherSource`
and a bounded `weatherHistory`. Intensity is shared by travel, NPC sheltering, war pause and
natural-disaster thresholds.

## Map structures

- Watchtower reveals adjacent nodes according to `revealAdjacentNodes` and structure level.
- Trading posts create a three-day visit cadence and guarantee an itinerant merchant NPC.
- `mapState.influenceMap` stores node snapshots; `regionInfluence` stores region aggregates.

## Escort contract

An escort is an alive NPC at the origin node. A travel task stores `escortProfile`, applies
`riskReduction` to the persisted task risk, charges `dailyCost` once per simulated travel day,
and changes to `fled` when maintenance cannot be paid.
