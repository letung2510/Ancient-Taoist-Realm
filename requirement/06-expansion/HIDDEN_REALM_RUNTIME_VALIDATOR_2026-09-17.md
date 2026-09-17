# Hidden Realm Runtime Validator — 2026-09-17

## Contract

Mỗi Bí Cảnh có definition tương ứng, `cycleIndex` không âm, cửa sổ `opensDay <= closesDay`, status thuộc `sealed/omen/open`, reward keys unique, competitor progress không âm. `activeHiddenRealm` phải trỏ tới runtime đang mở, đúng cycle, có entry/core node tồn tại và vị trí hiện tại nằm trong realm.

## Runtime

`validateHiddenRealmRuntimeState(state)` kiểm tra toàn bộ realm definition/runtime và active realm reference. Validator được gọi trong `validateExpansionState()` để bảo vệ save/load, offline cycle update và claim reward.

## Regression

`verify_review_batches.js` kiểm tra contested expiry, hidden realm enter/exit, claim reward idempotency và duplicate reward key rejection.

## Chưa hoàn thiện

Chưa có browser E2E animation/map overlay cho cổng Bí Cảnh; logic state, reward ledger và rollback đã có contract.
