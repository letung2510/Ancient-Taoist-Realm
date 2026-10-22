# Thời tiết — Catalog, resolver, hiệu ứng

## Mục đích

Một nguồn thời tiết duy nhất theo vùng, xác định, lưu được qua save, dùng chung cho mọi consumer.

## Dữ liệu & trạng thái

`state.worldSimulation.regionState[regionId]`: `weather`, `weatherSeverity`, `weatherIntensity`, `weatherUntilDay`, `weatherSource`, `weatherHistory[]`.

| ID | Nhãn | Severity | defaultDuration | Chuyển sang | travelRiskDelta | fogLevel | NPC trú ẩn | travelWeight | speedMultiplier |
|---|---|---|---|---|---|---|---|---|---|
| `quang` | Quang Đãng | 0 | 7 | mua, suong | 0 | 0 | không | 1 | 1 |
| `mua` | Mưa | 1 | 2 | quang, suong, am_vu | 0.03 | 1 | không | 1.08 | 0.8 |
| `suong` | Sương | 1 | 7 | quang, mua | 0.02 | 2 | không | 1.05 | 1 |
| `tuyet` | Tuyết | 2 | 3 | quang, linh_phong, bao_linh_khi | 0.05 | 1 | có | 1.18 | 0.6 |
| `loi_vu` | Lôi Vũ | 3 | 2 | mua, bao_linh_khi, quang | 0.04 | 1 | có | 1.16 | 0.8 |
| `linh_phong` | Linh Phong | 2 | 2 | quang, mua, tuyet | 0.03 | 1 | không | 1.1 | 0.9 |
| `am_vu` | Âm Vũ | 4 | 2 | mua, suong, quang | 0.08 | 2 | có | 1.2 | 0.7 |
| `bao_linh_khi` | Bão Linh Khí | 5 | 1 | loi_vu, am_vu, quang | 0.12 | 2 | có | 1.3 | 0.5 |

## Rules

| ID | Rule |
|---|---|
| WTH-CAT-001 | `WEATHER_CATALOG` là bảng ID/severity/duration/transition duy nhất; consumer không được tự suy ra ID hoặc bảng severity thứ hai. ID không có trong catalog bị validator từ chối. |
| WTH-CAT-002 | Alias được chuẩn hóa trước khi tra: `snow→tuyet`, `mist`/`suong_mu`/`sương_mù→suong`, `storm→loi_vu`, `spiritual_storm→bao_linh_khi`. Save chỉ lưu ID canonical. |
| WTH-CAT-003 | Mọi `transitions` phải trỏ tới ID có trong catalog; `weatherSeverity` của vùng luôn bằng severity catalog. |
| WTH-RES-001 | `weatherSnapshot(state, regionId)` là ranh giới đọc duy nhất, trả DTO `id, regionId, label, severity, durationDays, hysteresisDays, transitions, effects, untilDay, source`. Di chuyển, phản ứng NPC, Thám Hiểm, world modifier preview và nhãn UI/log đều đọc DTO này. |
| WTH-RES-002 | `updateWeather` chạy mỗi ngày tick cho từng vùng: nếu `day < weatherUntilDay` thì giữ nguyên; ngược lại chọn ID mới trong `transitions` của ID hiện tại bằng seeded RNG `weather:<regionId>` theo ngày (không `Math.random`). |
| WTH-RES-003 | Thời gian lưu trú `weatherUntilDay = day + dwell`, `dwell = max(7, WEATHER_HYSTERESIS[id])`; hiện mọi ID = 7 ngày. |
| WTH-RES-004 | Cường độ: `bao_linh_khi` 3–5, `am_vu` 3–4, còn lại 1–3, seeded theo vùng/ngày. |
| WTH-RES-005 | Khi ID đổi: push `{ day, from, to, severity, source }` vào `weatherHistory`, giữ tối đa 30 bản ghi gần nhất; nếu là vùng hiện tại ghi một node-history `type:"weather"` với key `weather:<regionId>:<day>` và một dòng log cảnh (không lộ mã kỹ thuật). |
| WTH-RES-006 | `setWeather(state, regionId, weather, durationDays, source)` là lối ghi thủ công duy nhất (sự kiện/kịch bản); vẫn chuẩn hóa alias và ghi lịch sử. |
| WTH-RES-007 | Save/load và offline catch-up giữ nguyên ID canonical, `weatherUntilDay` và lịch sử; offline dùng cùng `updateWeather` như online. |
| WTH-EFF-001 | Hiệu ứng di chuyển lấy từ `effects` (bảng trên) và chỉ được áp qua resolver di chuyển của [map](../map/README.md). |
| WTH-EFF-002 | Hiệu ứng ngày lên nhân vật tại vùng hiện tại: `mua` −1 HP (tối thiểu còn 1), `suong` −1 SAN. |
| WTH-EFF-003 | Phản ứng NPC theo thời tiết vùng của NPC: `mua` hoãn lịch 1 ngày; `loi_vu` mood "cảnh giác"; `linh_phong` mood "du hành"; loại có `npcShelter` đưa NPC vào trạng thái trú ẩn. Phản ứng idempotent theo NPC/ngày/weather. |
| WTH-EFF-004 | `suong` cộng `stealth +0.12` và `searchRiskDelta +0.03` trong `getWorldModifiers`. |
| WTH-EFF-005 | `fogLevel` ≥1 che chi tiết phát hiện/NPC theo quy tắc fog của [Thám Hiểm](../world-simulation/exploration-sessions.md). |

## UI

Hiển thị nhãn tiếng Việt và mô tả cảnh; không hiển thị severity số, multiplier hoặc RNG. Log thời tiết giữ `weatherContext` trong metadata sự kiện.

## Acceptance

- Mọi entry catalog, alias, transition target, snapshot effect và world modifier preview hợp lệ (`validateWeatherRuntimeState`).
- `weatherHistory` ≤ 30; `weatherUntilDay` không nhỏ hơn hôm nay − 1.
- Hai lần chạy cùng seed/ngày cho cùng chuỗi thời tiết; save/load giữ ID và hạn.
- Gate: `node tools/verify_local_movement_weather.js`, `node tools/verify_offline_parity.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WTH-CAT-001..003 | `js/expansion.js:WEATHER_CATALOG`, `WEATHER_ALIASES`, `normalizeWeatherId`, `validateWeatherRuntimeState` | Khớp |
| WTH-RES-001 | `js/expansion.js:weatherSnapshot` | Khớp |
| WTH-RES-002..005 | `js/expansion.js:updateWeather`, `WEATHER_HYSTERESIS` | Khớp |
| WTH-RES-006 | `js/expansion.js:setWeather` | Khớp |
| WTH-RES-007 | `js/expansion.js:simulateWorldUntil` → `tick` → `updateWeather` | Khớp |
| WTH-EFF-001 | `js/expansion.js:WEATHER_EFFECTS`, `canonicalTravelPlan` | Khớp |
| WTH-EFF-002..003 | `js/expansion.js:applyDailyWorldEffects`, `resolveNpcWeatherReaction` | Khớp |
| WTH-EFF-004 | `js/expansion.js:getWorldModifiers` | Khớp |
| WTH-EFF-005 | `js/engine.js:search` | Khớp |
