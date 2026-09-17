# Relationship Runtime Ledger Validator — 2026-09-17

## Contract

Relationship dimensions của NPC gồm `trust`, `fear`, `respect`, `suspicion`, `loyalty`; `score` chỉ là projection theo policy. `relationshipEvents[npcId]` là ledger event có `id`, `uniqueKey`, `day`, `deltas`, tối đa 20 bản ghi và unique key không lặp. `npcState[npcId].memoryWithPlayer` không được chứa event không tồn tại trong ledger.

## Runtime

`validateRelationshipRuntimeState()` kiểm tra ledger, duplicate key, event metadata và orphan memory; `validateExpansionState()` gọi audit này. `validateRelationshipPolicy()` tiếp tục kiểm tra dimension range, score formula và policy decay, giữ tách biệt relationship với loyalty của companion.

## Regression

`verify_review_batches.js` kiểm tra event idempotency, breakdown dimensions, save round-trip và orphan event drift.

## Chưa hoàn thiện

Chưa có browser E2E cho toàn bộ dialog/relationship UI; runtime/save invariant đã có.
