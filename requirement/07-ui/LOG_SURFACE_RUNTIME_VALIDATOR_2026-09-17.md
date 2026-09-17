# Runtime log surface validator

`validateLogSurfaceState(state)` audits the actual history after action and save-load,
not only source literals. It formats every non-debug event through the player-facing
boundary, rejects empty narrative without stat display, lints technical tokens and
ensures the grouped novel paragraphs have one group per day key.

Legacy events are normalized during deserialize; raw producer codes are allowed in the
internal event only when `formatPlayerLogText` removes/maps them before UI rendering.
`validateExpansionState` invokes the validator and regression covers legacy round-trip
plus an internal warning code.
