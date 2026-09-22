# WEATHER CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic

### Weather narration and world integration

Weather simulation and its interaction with factions/NPC schedules are coordinated by [`WORLD_SIMULATION_CANONICAL.md`](WORLD_SIMULATION_CANONICAL.md). Weather/NPC log producers follow the shared scene contract in [`UI_ACTION_LOG_CANONICAL.md`](../07-ui/UI_ACTION_LOG_CANONICAL.md#unified-novel-style-event-log): preserve weather context in event metadata and emit a player-safe scene narrative, never a raw system announcement.


### Source: `archive-requirements\logic-history\03-world\NODE_WEATHER_RUMOR_HISTORY_COVERAGE_2026-09-17.md`

# NODE / WEATHER / RUMOR HISTORY COVERAGE — 2026-09-17

## Canonical contract

- Mọi node-history record phải có `type`, `key`, `day` hữu hạn và `regionId`.
- `key` là idempotency key trong phạm vi node; producer gửi lại cùng sự kiện không được nhân bản.
- History của node giữ tối đa 50 record gần nhất.
- Weather giữ tối đa 30 chuyển đổi gần nhất, có `day`, `from`, `to`, `severity` và `source`.
- Rumor có source, confidence, received/expiry day và ledger chống relay trùng; relay chỉ đi một hop mỗi world tick.
- Actor history offline được giữ trong cửa sổ retention canonical và phải round-trip qua save.

## Runtime / regression

`validateNodeHistory(state, nodeId?)` kiểm tra metadata, duplicate key và retention. Các producer hiện được audit gồm sub-location, structure lifecycle/transfer, faction/outpost/war, actor presence, weather và completion. Regression node-history kiểm tra đủ nhóm type, idempotency, retention và metadata.

## Phần còn lại

Browser visual QA cho panel history và tuning nội dung rumor/weather vẫn là gate UX/content, không phải thiếu invariant dữ liệu.


### Source: `archive-requirements\logic-history\04-world\WEATHER_RESOLVER_ALIAS_EFFECT_CANONICAL_2026-09-17.md`

# Weather resolver alias/effect canonical

`weatherSnapshot(state, regionId)` is the shared weather DTO for world modifier preview, travel, NPC reaction and UI/log labels.

DTO fields: `id`, `regionId`, `label`, `severity`, `durationDays`, `transitions`, `effects`, `untilDay`, `source`.

Aliases are normalized before lookup: `snow → tuyet`, `mist/suong_mu/sương_mù → suong`, `storm → loi_vu`, `spiritual_storm → bao_linh_khi`.

Effect catalog includes travel risk and fog/shelter signals. Severity and duration remain data-driven from `WEATHER_CATALOG`; invalid IDs are rejected by catalog validation. Consumers must not infer a second weather ID or severity table.

## Regression

Validate every catalog entry, alias normalization, transition target, snapshot effect and world modifier preview. Save/load and offline tick must preserve the canonical ID and expiry day.

## Chưa hoàn thiện

Balance/hysteresis thresholds for weather transitions still require playtest; schema and resolver ownership are fixed.
