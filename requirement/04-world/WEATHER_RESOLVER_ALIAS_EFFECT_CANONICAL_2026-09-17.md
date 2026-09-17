# Weather resolver alias/effect canonical

`weatherSnapshot(state, regionId)` is the shared weather DTO for world modifier preview, travel, NPC reaction and UI/log labels.

DTO fields: `id`, `regionId`, `label`, `severity`, `durationDays`, `transitions`, `effects`, `untilDay`, `source`.

Aliases are normalized before lookup: `snow → tuyet`, `mist/suong_mu/sương_mù → suong`, `storm → loi_vu`, `spiritual_storm → bao_linh_khi`.

Effect catalog includes travel risk and fog/shelter signals. Severity and duration remain data-driven from `WEATHER_CATALOG`; invalid IDs are rejected by catalog validation. Consumers must not infer a second weather ID or severity table.

## Regression

Validate every catalog entry, alias normalization, transition target, snapshot effect and world modifier preview. Save/load and offline tick must preserve the canonical ID and expiry day.

## Chưa hoàn thiện

Balance/hysteresis thresholds for weather transitions still require playtest; schema and resolver ownership are fixed.
