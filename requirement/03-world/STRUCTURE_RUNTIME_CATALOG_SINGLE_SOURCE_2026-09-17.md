# Structure runtime uses catalog as single source

Build, repair, upgrade and dismantle must read `STRUCTURE_CATALOG`, never duplicate costs or caps in action code.

- build: `buildCost`;
- repair: `repairDivisor`;
- upgrade: `upgradeBase`, `maxLevel`, `chargesPerUpgrade` and per-upgrade effects;
- dismantle: `refundRate`.

The structure DTO persists type, level, integrity, status, owner and effects. Catalog effects are merged on build; active structure effects alone enter influence/ward resolvers. Any catalog balance change therefore applies consistently to runtime, UI preview and save-loaded structures.

## Regression

Build/repair/upgrade/dismantle tests must compare resource deltas to catalog values and preserve influence invalidation.

## Chưa hoàn thiện

Numeric balance still requires playtest; the duplication bug between catalog and action code is removed.
