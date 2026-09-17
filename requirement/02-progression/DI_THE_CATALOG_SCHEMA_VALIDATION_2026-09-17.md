# Dị Thể catalog schema validation — 2026-09-17

The Dị Thể catalog is runtime content, but every entry must satisfy a common contract
before it can affect progression:

- identity: `id`, `name`, `trigger`, `progressThreshold`, `maxStage`, `branch`;
- progression: exactly one `stageEffects` entry per stage;
- outcome: non-empty `endingTags` and finite `factionAffinity` values;
- cost/exclusion: `cost`, `exclusions.paths`, and `exclusions.professions`;
- runtime: stage-aware modifiers and outcome projection must read the same entry.

`GameExpansion.validateSpecialPhysiqueCatalog()` is the canonical validator. It returns
`{ ok, count, errors }` and is used by the deep Dị Thể regression. A malformed entry is
not considered complete merely because the UI can render it.

**Note chưa hoàn thiện:** numerical balance and final content approval remain product
gates; schema completeness and runtime validation are implemented.
