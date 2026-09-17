# Map canonical validation gate

`validateMapCanonicalState(state)` is the save/runtime boundary for Map V2. It checks:

- every known/open-world node has unique coordinates inside 0..100;
- every discovered node resolves through `mapInfluenceSnapshot`;
- influence DTO has node id, pressure, confidence, source/revision;
- cached snapshots use the current `influenceRevision` and match their node id.

`validateExpansionState` calls this gate. Map UI, travel, fog, completion and structure
effects remain consumers of the same influence resolver. A missing-coordinate fixture is
covered by `verify_review_batches.js`.
