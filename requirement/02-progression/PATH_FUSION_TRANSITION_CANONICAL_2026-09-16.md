# PATH FUSION / SECONDARY PATH TRANSITION — 2026-09-16

## Baseline decision

The player has one primary Path and at most one secondary Path. Selecting the primary Path remains permanent under the normal selection lock. A secondary Path never appears automatically from Fate, profession or Dị Thể effects.

## Explicit transition

`GameExpansion.transitionSecondaryPath(state, pathId, { confirmed: true })` is the only runtime entry point. The baseline cost is 20 Mệnh Tinh Hoa, 15 Công Đức and 10 Thanh Tỉnh. The transaction validates the Path, rejects the primary Path and rejects a second transition before deducting any resource.

Canonical state:

```js
state.pathState = {
  primaryPathId,
  secondaryPathId,
  hiddenPathId,
  history: [{ type: "secondary_path", from, to, day, cost }]
}
state.player.pathId = primaryPathId
state.player.secondaryPathId = secondaryPathId
```

The secondary Path is additive metadata for explicit affinity/resolver rules; it does not overwrite the primary breakthrough ritual, profession namespace or Dị Thể namespace. A future balance pass may add fusion-specific affinity caps, but no automatic effect stacking is allowed.

## Regression gate

`tools/verify_review_batches.js` verifies confirmation gating, resource transaction, duplicate transition rejection and serialize/deserialize preservation.

## Remaining note

Fusion-specific content, affinity caps and ending branches remain balance/content work; the state transition and namespace separation are implemented.
## Fusion affinity and cap

Every committed secondary-path transition stores `pathState.fusionAffinity`.
The resolver compares lead/support terms and forbidden-term conflicts, returns
raw affinity plus `effective = min(raw, 0.75)`, and persists the profile for UI,
save migration and later balance work. This affinity is informational and does
not silently change the primary path; transition remains explicit, permanent,
and costed.
