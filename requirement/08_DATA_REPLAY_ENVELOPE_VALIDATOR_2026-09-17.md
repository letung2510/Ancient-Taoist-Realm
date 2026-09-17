# Replay Envelope Validator — 2026-09-17

## Contract

Replay state phải có `worldSimulation.seed`, `meta.saveId`, integer non-negative `meta.turn/generatedItemSequence`, integer `lastProcessedDay/nextEventSeq`, và ID duy nhất cho events, scheduled tasks, NPC encounters. Deserialize không được làm mất các identity này.

## Runtime

`validateReplayEnvelope(state)` kiểm tra deterministic envelope; `validateExpansionState()` gọi audit cùng action priority matrix và reward/history validators. Gameplay RNG tiếp tục dùng replay-aware scope/day/index; character creation chỉ dùng injected RNG hoặc entropy boundary được cho phép.

## Regression

`verify_review_batches.js` kiểm tra envelope hợp lệ, seed bị thiếu bị từ chối và combat transcript replay sau serialize/deserialize.

## Chưa hoàn thiện

Chưa có cross-browser replay corpus dài ngày; các path combat/search/discovery/world offline chính đã có deterministic regression.
