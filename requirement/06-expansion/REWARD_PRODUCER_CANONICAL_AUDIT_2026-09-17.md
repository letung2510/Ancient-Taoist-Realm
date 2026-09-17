# REWARD PRODUCER CANONICAL AUDIT — 2026-09-17

## Contract

- One-time rewards from quest, contract, opportunity, hidden realm, collection, world event, tournament, war, prisoner, auction, companion, tomb and legacy use `grantCanonicalReward()` with a stable source/unique key.
- Replaying the producer must return a duplicate receipt and must not add EXP, merit, currency, item, Fate, technique or contribution again.
- Repeatable gameplay drops such as combat loot, search findings, crafting output and formation gathering are activity outputs, not one-time reward receipts; they remain deterministic through the replay RNG/action key contract.
- Reward summaries are presentation only and cannot mutate player resources.
- Quest contribution is included in the canonical receipt exactly once; the legacy fallback owns it only when the expansion reward service is unavailable.

## Regression evidence

`testQuestRewardCanonicalIdempotency()` now includes contribution and verifies two objective checks grant it once. Existing reward-ledger tests cover quest, prisoner, tainted reward, world event, auction, opportunity, hidden realm, companion, tomb and legacy paths.

## Remaining gate

Catalog balance/pity policy and producer-specific browser presentation remain content/UX review gates; they do not bypass the canonical ledger invariant.
