# Dị Thể Runtime State Validator — 2026-09-17

## Contract

Dị Thể là namespace riêng với catalog definition, trigger/progress, candidate, active instance, stage history và exclusions. `activeId` phải tồn tại trong catalog và đồng nhất với `player.specialPhysique`; progress không âm; candidate phải đạt threshold; history phải có stage hợp lệ và không trùng instance; rejected IDs phải unique.

## Runtime

`validateSpecialPhysiqueCatalog()` kiểm tra schema/effect/exclusion catalog. `validateSpecialPhysiqueState(state)` kiểm tra save runtime. Cả hai được gọi trong `validateExpansionState()`, còn `specialPhysiqueModifiers/outcome` là resolver duy nhất cho effect.

## Regression

`verify_review_batches.js` kiểm tra catalog/state hợp lệ và unknown Dị Thể state bị từ chối.

## Chưa hoàn thiện

Chưa có browser E2E đầy đủ cho candidate claim và exclusion dialog; namespace/runtime/save invariant đã có.
