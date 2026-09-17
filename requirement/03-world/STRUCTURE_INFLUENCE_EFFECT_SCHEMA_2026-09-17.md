# STRUCTURE INFLUENCE EFFECT SCHEMA — 2026-09-17

## Decision

- A structure contributes direct influence only through its canonical catalog effect `effects.influence` and only while active with integrity above zero.
- Hộ Giới Đại Trận contributes influence and danger/SAN protection; it does not create a second hidden anchor or duplicate faction score.
- Disabled/dismantled structures contribute zero influence and their cache revision is invalidated.
- Repair restores the existing catalog effect; upgrade changes only explicit effect deltas (ward influence/SAN and waystation charges).

## Runtime

`STRUCTURE_CATALOG` now contains type effects and newly built structures merge those effects into their runtime record. `mapInfluenceSnapshot()` remains the canonical resolver and structure lifecycle invalidates its revision.

## Regression

Structure catalog validation checks effect schema; lifecycle/influence regression verifies active ward > disabled ward and repair restoration, plus save/offline round-trip.
