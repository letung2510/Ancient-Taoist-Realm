# FATE Data Source Map

Audit date: 2026-09-08

## Runtime canonical files

These are the only FATE files loaded by `index.html` in a live game:

| File | Role | Status |
|---|---|---|
| `data/fate_data.js` | 10,000-entry catalog; `window.FATE_DATA` | Canonical runtime |
| `data/fate_relationships.js` | pairwise relationships, combos, fusion recipes; `window.FATE_RELATIONSHIPS` | Canonical runtime |
| `data/path_fate_relations.js` | path/hidden-fate bridge; `window.PATH_FATE_RELATIONS` | Canonical runtime bridge |
| `data/data.js` | consumes the three globals above and exposes `window.GameData` | Runtime aggregator |

`js/engine.js` and `js/ui.js` consume `window.GameData`, `window.FATE_RELATIONSHIPS` and `window.PATH_FATE_RELATIONS`; they do not load the staging JSON files directly.

`luan_hoi_tien` is a hidden profession identifier, not an additional catalog entry. It is resolved through `hiddenFates`/`hiddenProfession` and `path_fate_relations.js`.

## Build and migration sources

| File | Role | Should be loaded by browser? |
|---|---|---|
| `fate_system_update/fate_data_with_tags.json` | staging catalog used by the Phase 3 migration; its fields are merged into `data/fate_data.js` | No |
| `fate_system_update/resonance_effects_v2.json` | staging resonance definitions; merged by `phase3_regrade.js` | No |
| `data/path_fate_relations.json` | source JSON for the runtime bridge and character generator | No, use the JS bridge in browser |
| `fate_system_update/fate_regrade_manifest.json` | immutable Phase 3 ID/grade change manifest | No |
| `fate_system_update/fate_regrade_report.json` | migration audit report | No |
| `fate_system_update/phase3_regrade.js` | controlled migration and relationship-tier rewrite | No |
| `fate_system_update/grade_sign_maps.js` | helper/reference map for data QA | No |
| `tools/generate_fates.js` | legacy procedural generator; not part of runtime | No |
| `tools/generate_fates_from_json.js` | legacy source importer; not part of runtime | No |

## Backups and review-only files

`fate_system_update/backups/phase3-20260908/` is rollback-only. The Markdown files, `sample_review.json`, and review/spec documents are documentation or QA inputs, not runtime data.

## Duplicate-function decisions

1. `data/fate_data.js` is the single catalog used by the game. The tagged JSON remains as a migration source so future regrades can be reproduced; it must not be added as another `<script>`.
2. `data/fate_relationships.js` is the single relationship runtime source. No second relationship JSON is loaded by the browser.
3. `data/path_fate_relations.json` and `.js` are intentionally a source/bridge pair, not duplicates: Node tools read JSON, browser runtime reads JS.
4. Legacy generators are retained for historical reproducibility. They must not be run against the live catalog after Phase 3; use `phase3_regrade.js` for controlled changes.

## Verified links

`index.html` loads exactly one file for each runtime group:

```html
data/fate_data.js
data/fate_relationships.js
data/path_fate_relations.js
data/data.js
```

No staging, backup, manifest, or review file is linked into the browser bundle.
