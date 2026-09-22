# Feature Canonical Map

Each feature has one canonical requirement-logic file. Validators, patches, and schemas are tracked only in `AUDIT_CANONICAL.md`.

## Root-level source status

The root folder should contain only this README, the canonical audit, the validator, and source documents that still need consolidation. Consolidated design sources are removed after their requirements are present in the feature canonical below:

- Action priority and novel-style log flow → `features/07-ui/UI_ACTION_LOG_CANONICAL.md`
- Dynamic local BFS constellation and local-map improvements → `features/04-world/MAP_CANONICAL.md`
- World interconnection design → `features/04-world/WORLD_SIMULATION_CANONICAL.md`
- NPC/map/character/organization interactions → `features/05-interaction/NPC_CANONICAL.md`, `RELATIONSHIP_CANONICAL.md`, and `features/04-world/WORLD_SIMULATION_CANONICAL.md`
- Review reports and change addenda → `../AUDIT_CANONICAL.md`

Keep a source file at the root while it contains requirements or decisions that have not yet been merged into those destinations.

Current root-level sources still awaiting a full requirement-by-requirement merge:

- `../prompt-review-code-tu-dong.md` is a reusable review prompt, not a feature requirement.

The 2026-09-22 local-map and NPC interaction sources have been consolidated into their feature canonicals and removed from the root. Their design contracts do not by themselves assert runtime completion; see `../AUDIT_CANONICAL.md` for that distinction.

- **FATE**: `features/01-fate\FATE_CANONICAL.md`
- **CHARACTER**: `features/02-character\CHARACTER_CANONICAL.md`
- **PROGRESSION**: `features/03-progression\PROGRESSION_CANONICAL.md`
- **PATH**: `features/03-progression\CON_DUONG_CANONICAL.md`
- **DI_THE**: `features/03-progression\DI_THE_CANONICAL.md`
- **PROFESSION**: `features/03-progression\PROFESSION_CANONICAL.md`
- **MAP**: `features/04-world\MAP_CANONICAL.md`
- **WEATHER**: `features/04-world\WEATHER_CANONICAL.md`
- **WORLD_SIMULATION**: `features/04-world\WORLD_SIMULATION_CANONICAL.md`
- **NPC**: `features/05-interaction\NPC_CANONICAL.md`
- **RELATIONSHIP**: `features/05-interaction\RELATIONSHIP_CANONICAL.md`
- **COMPANION**: `features/05-interaction\COMPANION_CANONICAL.md`
- **TECHNIQUE**: `features/06-content\TECHNIQUE_CANONICAL.md`
- **DISCOVERY**: `features/06-content\DISCOVERY_CANONICAL.md`
- **REWARD**: `features/06-content\REWARD_CANONICAL.md`
- **UI_ACTION_LOG**: `features/07-ui\UI_ACTION_LOG_CANONICAL.md`
- **DATA_RUNTIME**: `features/08-platform\DATA_RUNTIME_CANONICAL.md`
- **CROSS_SYSTEM**: `features/09-cross-system\CROSS_SYSTEM_CANONICAL.md`
