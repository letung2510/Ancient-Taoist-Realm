# PERFORMANCE PROFILE CONTRACT — 2026-09-17

## Profiles

- `standard`: target 60 FPS, map render budget 80, story window 20, NPC records/tick 100, detailed offline window 30 days.
- `weak`: selected when hardware concurrency ≤2 or device memory ≤2 GB; target 30 FPS, map render budget 24, story window 12, NPC records/tick 50, detailed offline window 14 days.
- `reduced`: selected when reduced-motion is requested; target 45 FPS with bounded map/history work and no gameplay rule changes.

## Invariant

Performance profile changes render/diagnostic budgets only. It must not alter canonical rewards, RNG keys, progression, map influence values, save schema or action outcomes. `resolvePerformanceProfile()` is pure; `performanceProfile(state)` records only the active runtime profile.

## Evidence

`verify_review_batches.js` checks weak/standard selection, budget ordering and state application. `profile_runtime_budget.js` remains the Node baseline for actual map influence, offline, save and novel-log timing. Browser FPS measurement remains a device QA gate.
