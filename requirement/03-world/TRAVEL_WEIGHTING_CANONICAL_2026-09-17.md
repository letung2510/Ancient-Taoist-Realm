# Travel weighting canonical — 2026-09-17

`GameExpansion.travelPlan` is the single preview/commit resolver. The exported resolver
wraps distance, terrain/weather speed, destination danger, contested influence, ward
protection and `getWorldModifiers` into one DTO. It also exposes:

- `partySize`: player plus active/mutated companion and explicit party members;
- `partyWeight`: `1 + 0.05 × extra members`;
- `baseSpeed` and effective `speed` after party weighting;
- `modifiers`, `risk`, `gameDays`, and `eventRolls`.

The engine movement commit calls the same exported resolver used by route preview, so
weather/ward/companion changes cannot silently produce a different travel result.
Teleport travel remains a separate zero-day branch requiring valid anchors at both ends.

**Note chưa hoàn thiện:** map content balance for long-distance routes and future party
formation abilities remains a product tuning gate; deterministic weighting and parity are
implemented and regression-tested.
