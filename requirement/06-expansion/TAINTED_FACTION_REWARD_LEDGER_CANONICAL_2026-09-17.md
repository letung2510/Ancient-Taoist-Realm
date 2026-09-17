# Tainted faction reward ledger canonical — 2026-09-17

Tainted-faction currencies and flags are a separate reward namespace from ordinary
EXP/Linh Thạch/Fate rewards, but their delivery still uses the same canonical receipt
boundary. `grantTaintedRewardCanonical` delegates to `grantCanonicalReward` with a
`taintedRewards` payload and a source-specific unique key.

Faction selection, faction-hunt merit and other one-time tainted rewards can therefore
be audited and replayed without incrementing the reward twice. The receipt explicitly
stores the tainted payload; it does not pretend `heaven_merit`, `balance_token`, or
`heaven_seal` are ordinary inventory items.

**Note chưa hoàn thiện:** balance/pity values for faction rewards remain content tuning;
namespace separation and idempotent delivery are implemented.
