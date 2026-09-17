# RELATIONSHIP DIMENSIONS POLICY — 2026-09-17

## Canonical dimensions

NPC relationship stores independent `trust`, `fear`, `respect`, `suspicion` and `loyalty` values in `[0,100]`. `relationshipScore` is derived as `trust + respect - 0.5 * (fear + suspicion)` and is not an independent progression input.

NPC relationship decay policy is `event_only`: no passive offline/world-tick decay is applied; values change through explicit relationship events. Fate relationship decay is separately `none`; `stagnantDays` is only an inactivity counter.

## Runtime

`relationshipBreakdown()`, `relationshipTier()`, `relationshipPolicySnapshot()` and `validateRelationshipPolicy()` expose/validate the contract. Save validation rejects invalid dimensions, score drift or wrong decay policy.

## Regression

Relationship event idempotency, dimension updates and save round-trip are covered by review-batch regression; offline simulation keeps values stable without new events.
