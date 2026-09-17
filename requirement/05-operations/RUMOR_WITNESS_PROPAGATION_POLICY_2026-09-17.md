# Witness / rumor / memory propagation policy

## Canonical policy

- same-node propagation loses confidence `0.05`;
- adjacent-node propagation loses confidence `0.20`;
- confidence is clamped to `[0.1, 1]`;
- default TTL is 14 days and each relay cannot extend it beyond the current day plus 14;
- each NPC retains at most 12 rumors;
- higher source priority wins; equal priority keeps the higher-confidence entry;
- ledger records retain source NPC, source faction, received day, expiry and priority.

Propagation is deterministic by node topology and day. Re-running the same offline day cannot create a second stronger record or extend expiry. Expired rumor and ledger entries are removed before propagation.

`rumorPolicySnapshot()` and `validateRumorPolicy()` are canonical runtime contracts; `validateExpansionState` invokes the validator.

## Chưa hoàn thiện

Narrative differences between individual witness personalities and faction-specific rumor text still need content playtest.
