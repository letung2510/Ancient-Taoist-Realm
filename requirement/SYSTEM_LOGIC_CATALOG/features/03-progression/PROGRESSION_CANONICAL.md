# PROGRESSION CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic

## Consolidated addendum: opening flow and breakthrough stages

- Character opening uses an explicit origin choice and stores the confirmed branch permanently. Hidden/anonymous backgrounds remain valid branches and must not be silently forced into a faction.
- Path choice and the first breakthrough are separate gates. Breakthrough ritual steps are resolved in order and each step persists its completion state.

## Opening journey intent gate

- Race, Spiritual Roots, Personality, and Background are rolled randomly. They are never presented as player choices in this gate.
- After those random rolls, the player must choose exactly one journey intent before the main gameplay loop: `tam_su`, `tu_lap`, or a background-compatible third option (`quy_tong` for family-compatible backgrounds; `an_the` for Hac Dao/Vo Danh).
- `tam_su` rolls one valid regional sect and stores its concrete faction ID as the future stage-2 admission target. The opening scene names that sect.
- `tu_lap` rolls one of five independent opening scenes and never creates an implied sect target.
- `quy_tong` rolls one valid regional family/faction and names its estate as the opening target.
- The selected intent and opening plan are persisted in both `player` and `flags`; there is no second Background/Origin choice in the new flow.

## Opening intent hardening

- The opening intent gate is the only player choice before the main loop; random Race, Spiritual Roots, Personality, and Background values are immutable inputs for that gate.
- Opening target records use a neutral `targetOrganizationId` and `targetOrganizationKind` so sects and families share one contract without conflating faction and guild namespaces.
- Every target roll must come from the requested regional catalog and matching organization kind. An empty matching pool is a deterministic failure state, not permission to select an unrelated organization.
- `act_journey_*` is a first-class action family and must resolve through the same engine action dispatcher as every other action. Direct UI handlers may only call the same engine command, never implement a second mutation path.
- Legacy `originChoicePending` saves are migrated once into the journey-intent gate; new characters never enter the legacy origin-choice branch.

### State-machine hardening

- `Tự Lập` has its own independent-opening resolver, always selects one of five Tán Tu scenes, and never creates an organization target.
- `Quy Tông` is available only when Background is not `Tông Môn`, `Hắc Đạo`, or `Vô Danh`, and only when the selected region has a valid `family` organization.
- `Hắc Đạo` and `Vô Danh` replace `Quy Tông` with `Ẩn Thế`; option matching is accent-normalized and encoding-independent.
- Background `Tông Môn` exposes exactly `Tầm Sư` and `Tự Lập`.
- Legacy `originSituation` is not used to hide quests or write opening history. The resolved `openingPlan` owns the opening context.
- A stage-2 organization invitation is owned by `journeyIntent` and `openingPlan.targetOrganizationId`; `originLocked` must not clear it during save/load.
- Refusing a stage-2 invitation in the journey flow records a journey decline and never reopens the legacy Origin state machine.
