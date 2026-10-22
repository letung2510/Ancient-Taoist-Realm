# Thời tiết

## Phạm vi

- Thời tiết theo vùng (`regionState[regionId]`): catalog ID, severity, thời hạn, chuyển đổi, lịch sử, hiệu ứng.
- Một resolver duy nhất `weatherSnapshot` cấp DTO cho di chuyển, NPC, Thám Hiểm, UI và log.
- Không sở hữu thứ tự world tick (xem [world-simulation](../world-simulation/README.md)) và không sở hữu công thức di chuyển (xem [map](../map/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Catalog, resolver, chuyển đổi, hiệu ứng | [weather-resolver.md](weather-resolver.md) | `WTH-CAT-`, `WTH-RES-`, `WTH-EFF-` | `js/expansion.js:WEATHER_CATALOG`, `weatherSnapshot`, `updateWeather`, `applyDailyWorldEffects` |

## Phụ thuộc

- [world-simulation/daily-tick-and-offline.md](../world-simulation/daily-tick-and-offline.md) — bước cập nhật thời tiết trong tick ngày.
- [map](../map/README.md) — `travelPlan` đọc `effects.travelWeight/speedMultiplier/travelRiskDelta`.
- [npc/schedule-and-routine.md](../npc/schedule-and-routine.md) — NPC trú ẩn theo thời tiết.
- [world-simulation/exploration-sessions.md](../world-simulation/exploration-sessions.md) — weather modifier của Thám Hiểm.
- [ui-action-log](../ui-action-log/README.md) — log cảnh thời tiết theo hợp đồng scene narrative.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | Hysteresis chuyển đổi chốt theo runtime: mọi loại thời tiết giữ tối thiểu 7 ngày (`WEATHER_HYSTERESIS`); không còn câu hỏi mở về ngưỡng cân bằng. | WTH-RES-003 |

## Gate

- `node tools/verify_local_movement_weather.js`
- `node tools/verify_world_producer_matrix.js`
- `node tools/verify_offline_parity.js`
