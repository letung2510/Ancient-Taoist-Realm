# Structure Runtime State Validator — 2026-09-17

## Contract

Mỗi công trình phải có catalog type, id duy nhất trong node, owner hợp lệ (`player`, `npc`, `faction`), status hợp lệ, durability `0..100`, level trong max level, charge hợp lệ với Truyền Tống Trận và transfer history dạng mảng. Một node không có hai công trình active cùng type. Inventory không được âm hoặc chứa giá trị không hữu hạn.

## Runtime

`GameExpansion.validateStructureRuntimeState(state)` audit `mapState.structures` và inventory. `validateExpansionState()` gọi audit sau catalog/weather validation, bao phủ save/load và offline state. Build/repair/upgrade/disable/dismantle/transfer tiếp tục dùng `STRUCTURE_CATALOG` và `structureManagerDecision` làm source of truth.

## Regression

`verify_review_batches.js` kiểm tra structure owner, build lifecycle và fixture durability sai bị từ chối.

## Chưa hoàn thiện

Chưa có browser click-through cho mọi nhánh permission của NPC/faction ownership; runtime resolver và UI policy contract đã có.
