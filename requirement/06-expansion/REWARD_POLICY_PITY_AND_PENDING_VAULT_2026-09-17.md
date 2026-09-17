# REWARD POLICY — DUPLICATE / PITY / PENDING VAULT 2026-09-17

## Decision

- One-time reward receipt duplicate is rejected by stable `uniqueKey`; replay never grants resources twice.
- There is no hidden generic pity counter. Any guaranteed result must be represented explicitly by the catalog/source resolver.
- When a Fate reward is guaranteed but the Fate vault is full, the receipt remains granted and `receiveFate(..., allowPending:true)` places the Fate in the pending-vault queue. It is not rerolled or silently lost.
- Repeatable combat/search/craft/gather outputs remain activity-resolver outputs and are governed by deterministic action keys, not one-time reward receipts.

## Runtime API

`rewardPolicySnapshot()` and `validateRewardPolicy()` expose the policy. Canonical receipts record `policy` and `pendingFateCount` for audit/UI summary without changing reward identity.

## Regression

Reward ledger/quest/online-Fate/tainted-reward tests verify duplicate idempotency, receipt persistence and pending behavior. Save validation preserves legacy/quarantined receipts.
