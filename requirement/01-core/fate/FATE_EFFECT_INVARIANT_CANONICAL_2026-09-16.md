# FATE EFFECT INVARIANT — 2026-09-16

## Canonical layers

Fate effects are resolved as independent layers: base definition, enhancement level, relationship stage, evolution branch, suppression and advanced-action modifiers. No layer mutates the authored Fate definition. The UI/API exposes the layer breakdown; derived stats consume the resolved result once.

## Evolution preview contract

`fateEvolutionPreview(state, fateId, branchId)` must simulate the exact post-commit state:

1. Keep the current `beforeEffects` unchanged.
2. Simulate relationship stage `4` because commit promotes the Fate to Nhân Mệnh Hợp Nhất.
3. Simulate `fateEvolutions[fateId] = { status: "evolved", branchId }`.
4. Apply the selected branch exactly once through `enhancedFateEffects`.

The commit path deducts costs only after eligibility and preview validation. It then writes the branch/status and recalculates derived stats. Preview `afterEffects` and committed `enhancedFateEffects` must be deep-equal.

## Regression gate

`tools/verify_review_batches.js` verifies a Fate at enhancement +5 and relationship stage 3: preview, commit, post-commit effects and evolution score remain consistent. Failed/insufficient-cost commits must not write branch or deduct resources.

## Remaining note

Per-action browser cards for Nghịch Mệnh, Trấn Mệnh, Thiên Cơ and Mệnh Đổi still need visual QA; the effect invariant is enforced in runtime regression.
