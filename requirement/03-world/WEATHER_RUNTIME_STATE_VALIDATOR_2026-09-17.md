# Weather Runtime State Validator — 2026-09-17

## Contract

Mỗi region dùng weather ID sau normalize alias; ID phải có trong catalog, `weatherSeverity` phải khớp catalog, `weatherUntilDay` phải là ngày hợp lệ và `weatherHistory` tối đa 30 bản ghi. Transition do world tick chỉ được đi theo danh sách transition của weather nguồn. Override có chủ đích vẫn được ghi source riêng.

## Runtime

`GameExpansion.validateWeatherRuntimeState(state)` audit toàn bộ `worldSimulation.regionState`. `validateExpansionState()` gọi audit này cùng catalog validator. `weatherSnapshot()` và UI World dùng cùng catalog/alias/effects DTO.

## Regression

`verify_review_batches.js` kiểm tra alias `snow -> tuyet`, snapshot/effect, thời hạn và drift severity bị từ chối; offline tick vẫn chạy qua world modifier preview.

## Chưa hoàn thiện

Chưa có browser E2E cho từng weather transition và animation/fog rendering; runtime, save và offline state đã có contract kiểm tra.
