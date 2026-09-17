# Construction protection and lifecycle addendum — 2026-09-17

`ward_formation` (Hộ Giới Đại Trận) contributes through `wardProtectionAtNode` and
`getWorldModifiers`, not through a UI-only flag. While active it reduces encounter risk,
curse/corruption pressure, and SAN drain by `sanDrainReduction`; damage/disable removes
those effects until repair restores the structure. Its influence contribution is also
included in the canonical map-influence resolver.

Every disable/repair/upgrade/build/dismantle transition invalidates influence cache and
writes node history. Duplicate lifecycle calls are idempotent or rejected with no second
resource mutation.

**Note chưa hoàn thiện:** numerical balance and browser visual confirmation remain gates;
the SAN effect and lifecycle history are now runtime-tested.
