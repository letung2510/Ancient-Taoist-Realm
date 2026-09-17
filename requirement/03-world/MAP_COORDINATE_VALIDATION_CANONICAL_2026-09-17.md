# Map coordinate validation canonical — 2026-09-17

Map V2 uses the current 100×100 gameplay coordinate domain (`0..100` on both axes).
`validateMapCoordinates(state)` audits static, world-map and procedural node pools for:

- missing coordinates;
- coordinates outside the domain;
- duplicate `(x,y)` occupancy.

Influence resolution no longer silently substitutes `[0,0]` when a node has no valid
coordinate. It returns `source: "invalid_coordinate"`, an empty influence DTO and
`coordinateValid: false`; travel already rejects missing coordinates. This prevents a
malformed node from receiving the influence/fog/travel behavior of the origin.

**Note chưa hoàn thiện:** procedural expansion beyond the current authored node pool
still requires a separate content-generation balance review; validation and fail-closed
runtime behavior are implemented.
