# Requirement Repository

## Canonical logic files

Each feature has one canonical requirement-logic file under `SYSTEM_LOGIC_CATALOG/features/`. The feature map is maintained in [`00_README_AND_CROSS_SYSTEM_MAP.md`](SYSTEM_LOGIC_CATALOG/00_README_AND_CROSS_SYSTEM_MAP.md).

Examples:

- [`DI_THE_CANONICAL.md`](SYSTEM_LOGIC_CATALOG/features/03-progression/DI_THE_CANONICAL.md) - Di The
- [`FATE_CANONICAL.md`](SYSTEM_LOGIC_CATALOG/features/01-fate/FATE_CANONICAL.md) - Menh So/Fate
- [`MAP_CANONICAL.md`](SYSTEM_LOGIC_CATALOG/features/04-world/MAP_CANONICAL.md) - map
- [`TECHNIQUE_CANONICAL.md`](SYSTEM_LOGIC_CATALOG/features/06-content/TECHNIQUE_CANONICAL.md) - Cong Phap/technique
- [`UI_ACTION_LOG_CANONICAL.md`](SYSTEM_LOGIC_CATALOG/features/07-ui/UI_ACTION_LOG_CANONICAL.md) - UI, action, game log

## Single audit file

`AUDIT_CANONICAL.md` is the only audit file. Audit/review/status/QA updates, validators, patches, and schemas belong there. Requirement logic belongs in the canonical feature file and must not be duplicated in the audit file.

## Project-wide governing rules

The following rules are permanent requirements for the entire project and apply to all future requirement creation, review, audit, and consolidation:

- All requirement files must be written and saved as UTF-8. ANSI/Windows-1252 and implicit PowerShell encodings are forbidden.
- Any update must preserve Vietnamese Unicode text and must pass the UTF-8 validation gate before completion.
- Mojibake markers, replacement characters, or stray C1 control characters are encoding errors and must block the update.
- Requirement logic is updated only in the canonical file of its feature.
- Validator, patch, schema, audit, review, status, and QA evidence is updated only in `AUDIT_CANONICAL.md`.
- Historical files under `archive-requirements/` are read-only reference material and are not a source for new updates.

## Mandatory consolidation workflow for new Markdown

Every new Markdown requirement must be processed in this exact order:

1. Read the complete source file as UTF-8 and classify each requirement by feature.
2. Compare each requirement against the current game runtime and the feature canonical file.
3. Merge the requirement logic into the canonical file of that feature. Never leave new requirement logic only in a prompt, addendum, or audit file.
4. If runtime logic already exists, record the match and do not create duplicate code. If it does not exist, implement it in the existing runtime module for that feature.
5. Run the UTF-8 gate, Markdown syntax/link gate, and runtime syntax/tests. A replacement character, mojibake marker, C1 control character, broken link, or failed syntax check blocks completion.
6. Record only evidence, status, validator output, and unresolved product decisions in `AUDIT_CANONICAL.md`.
7. After canonical merge and validation succeed, delete the processed root-level source Markdown. Do not delete historical material under `archive-requirements/` unless explicitly requested.

The completion invariant is: every accepted requirement exists exactly once in its feature canonical file, every implementation exists exactly once in the runtime, and every review result exists only in the single audit file.

## History

Previous source documents are preserved in `archive-requirements/`. The archive is historical only and is not a source for new logic.
