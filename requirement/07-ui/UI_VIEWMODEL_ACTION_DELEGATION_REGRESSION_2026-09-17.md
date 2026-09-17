# UI VIEW-MODEL / ACTION DELEGATION REGRESSION — 2026-09-17

## Contract

- Dị Thể/discovery UI exposes the lifecycle states `discovered`, `verified`, `collected`, `rewarded` without deriving them from Con Đường/Nghề state.
- Map/World/structure/weather/faction panels consume canonical resolver/view-model outputs rather than inventing raw state rules.
- `tab-content` has one delegated click listener; actions enter `enqueueAction()` before engine execution, preventing duplicate execution after rerender.
- Engine action priority/pending-departure guards remain the final authority for combat, travel, ritual and opportunity conflicts.
- Legacy history is normalized with deterministic IDs/statDisplay and rendered through grouped novel paragraphs.

## Evidence

`verify_ui_surface_contract.js` now checks lifecycle state coverage, one delegated listener, serialized action queue and engine guard presence. Runtime review/game regressions continue to cover action priority and legacy log round-trip.

Browser pixel-level QA remains an environment gate; this contract specifically proves the UI view-model and event-wiring invariants available without a browser session.
