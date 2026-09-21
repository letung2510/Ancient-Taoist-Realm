# Logic change addendum — 2026-09-21

## UI and action invariants

- The Trạng thái tab owns the canonical character name, Khí Huyết, Linh Khí, and Thanh Tỉnh meters. The pinned summary is hidden on that tab to prevent duplicate HUD fields.
- `act_journey_*` is a forced action family and remains visible while journey intent is pending.
- UI recognizes both `disabled_reason` and `disabledReason`; `submitActionId` rejects disabled actions without consuming a turn.
- The action queue repaints and releases itself after an action handler exception.
- Lân cận uses the constellation renderer only; the legacy route graph is not a valid local-map fallback.

## Novel log invariants

- Character creation must not append a second copy of the initial wake-up event.
- Player-facing log rendering removes internal function names and replaces technical-only entries with a short narrative-safe sentence.
- Command echoes remain debug-only and are excluded from the novel surface.

## Auction regression invariant

- Auction assertions derive the expected display name from the deterministic lot `itemId`; they must not assume that a generated lot is Linh Thạch.

## Remaining expansion work

Companion, NPC/quest, weather/shelter, war/offline simulation, migration, deterministic replay, and browser E2E remain governed by the 33-item canonical matrix. A subsystem is only marked complete after its runtime resolver, UI surface where applicable, migration/normalization, and deterministic regression are all present.
