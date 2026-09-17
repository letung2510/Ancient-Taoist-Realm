# STRUCTURE CATALOG BALANCE SCHEMA — 2026-09-17

## Canonical fields

Each structure type is represented in `STRUCTURE_CATALOG` with `buildCost`, `repairDivisor`, `upgradeBase`, `maxLevel` and `refundRate`; type-specific upgrade contributions are explicit. The four canonical types are `waystation`, `ward_formation`, `watchtower` and `trading_post`.

## Runtime contract

Structure creation rejects types absent from the catalog. `structureCatalog()` exposes a read-only copy for UI/diagnostics and `validateWorldCatalogs()` derives its structure-cost validation from the catalog rather than an unrelated literal table. Existing lifecycle rules remain: active/disabled/dismantled state, owner checks, refund, node history and influence invalidation.

## Regression

Review-batch catalog regression checks canonical structure entries; lifecycle regression continues to verify build, disable, repair, upgrade, transfer, dismantle and influence changes.

Balance tuning values remain explicit and reviewable in this file/code boundary; browser confirmation UI is a separate gate.
