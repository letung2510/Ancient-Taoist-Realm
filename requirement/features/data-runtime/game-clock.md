# Data & Runtime — Đồng hồ game

## Mục đích

Một engine thời gian duy nhất với hai góc nhìn: **Player Clock** (thời gian của nhân vật: tuổi, thọ nguyên, log) và **World Clock** (lịch đại lục Thái Thanh: lore, thiên tượng, NPC, chiến sự). Mọi luật gameplay dùng ngày game, không dùng thời gian thực.

## Dữ liệu & trạng thái

```js
GAME_TIME_CONFIG = { version: 3, realSecondsPerGameDay: 30, gameDaysPerMonth: 30,
                     monthsPerYear: 12, gameDaysPerYear: 360 }
state.gameClock = { currentYear, currentMonth, currentDay, dayProgress, eraIndex, currentEra,
                    realTimeToGameTimeRatio: 1/30, timeScaleVersion: 3, lastRealTimestamp,
                    worldAbsoluteDay, worldSyncedPlayerDay, world: { /* adapter mirror */ } }
state.worldClock = { absoluteDay, currentYear, currentMonth, currentDay, currentEra,
                     dayProgress, lastSyncedPlayerDay, realTimeToGameTimeRatio }
```

| Đại lượng | Công thức |
|---|---|
| Player Day Index (1-based) | `(year − 1) × 360 + (month − 1) × 30 + day`; ngày đầu tiên = 1 |
| World absolute day (1-based) | `WORLD_CLOCK_EPOCH_DAY + (playerDayIndex − 1)` với `WORLD_CLOCK_EPOCH_DAY = (6087 − 1) × 360 + 1` (Năm 6087, Tháng 1, Ngày 1) |
| World Năm/Tháng/Ngày | `year = floor((abs − 1)/360) + 1`; `month = floor(((abs − 1) % 360)/30) + 1`; `day = ((abs − 1) % 30) + 1` |

## Rules

| ID | Rule |
|---|---|
| DATA-CLK-001 | 30 giây thực = 1 ngày game; 30 ngày = 1 tháng; 12 tháng = 1 năm (360 ngày). `dayProgress` giữ phần ngày lẻ. |
| DATA-CLK-002 | `state.gameClock` là nguồn sự thật của Player Clock. `state.worldClock.absoluteDay` là nguồn sự thật của World Clock; `gameClock.world` và mọi `current*` chỉ là cache/adapter tính lại được, không phải nguồn thứ hai. |
| DATA-CLK-003 | `ensureGameClock(state)`: normalize/migrate (nâng `timeScaleVersion`), tạo/đồng bộ world clock, refresh cache; không advance, không trừ tuổi/thọ. |
| DATA-CLK-004 | `advanceGameTime(state, days)` tiến hai đồng hồ trong một transaction cùng số ngày; nhiều ngày xử lý tuần tự, cơ chế hằng ngày chạy đúng một lần cho mỗi ngày hoàn tất. |
| DATA-CLK-005 | `onGameYearPass()` chỉ chạy khi Player Clock qua năm: tăng tuổi, giảm thọ nguyên, xử lý Luân Hồi. World year pass không giảm thọ. Player Clock không reset khi Luân Hồi; tuổi tương đối nếu cần dùng clock đời sống riêng. |
| DATA-CLK-006 | `applyOfflineProgress()` dùng `lastRealTimestamp` quy đổi sang ngày game, đi qua cùng pipeline advance, không ghi history giả, không nhân đôi reward/NPC/thời tiết/travel. `lastRealTimestamp` chỉ là timestamp kỹ thuật. |
| DATA-CLK-007 | Expansion wrapper là owner mô phỏng thế giới: gọi `original.advanceGameTime()` rồi `simulateWorldUntil()`; core không thêm tick thứ hai. `deserialize()` bảo đảm mỗi lần load chỉ có một lần offline advance và một khoảng simulation. |
| DATA-CLK-008 | `expansion.absoluteDay()` và world simulation dùng Player Day Index 1-based; không đổi sang World Day. Cần ngày thế giới thì thêm hàm riêng (ví dụ `absoluteWorldDay()`). Seed RNG dùng Player Day; không đổi sang World Day vì phá replay. |
| DATA-CLK-009 | Mọi `startDay`, `endDay`, `dueDay`, `expiresDay`, `createdDay`, `resolvedDay`, `generatedDay`, `lastProcessedDay`, cooldown và lịch mùa dùng ordinal ngày game (`gameDayIndex`/`gameDayOrdinal`); không dùng `Date.now()`, `createdAt`, `savedAt`, múi giờ hay thời điểm load làm ngày lore/gameplay. Phải phân loại field ngày trước mọi migration đổi ordinal. |
| DATA-CLK-010 | Nhãn: `clockLabel(state)` = `Nhân vật · Năm Y, Tháng M, Ngày D` (Player Log và topbar); `worldClockLabel(state)` = `Thái Thanh đại lục · Năm Y · <Kỷ Nguyên>`. Mỗi event lưu snapshot cả hai (xem [UI-LOG-003](../ui-action-log/novel-log.md)). |
| DATA-CLK-011 | Kỷ nguyên mặc định "Kỷ Nguyên Linh Khí Dị Biến"; chuyển kỷ nguyên ghi một sự kiện cảnh báo cho người chơi. |
| DATA-CLK-012 | Mọi thay đổi liên quan thời gian phải xác định trước: state canonical, đồng hồ dùng, owner tiến thời gian, event/scene/timestamp, label/fallback và test regression; chưa xác định đủ thì không triển khai. |

### Ánh xạ cơ chế → đồng hồ

| Cơ chế | Đồng hồ/ordinal |
|---|---|
| Tuổi, thọ nguyên, Luân Hồi | Player Clock |
| Cooldown/thưởng Mệnh Số | Player Day Index |
| Travel/thời tiết/NPC/quest/incident | Player Day + node hiện tại |
| Expansion `absoluteDay()`, world simulation | Player Day Index 1-based |
| Hiển thị lore | World Clock |
| Player Log | Player Clock |
| Audit/System Log | ISO + snapshot Player/World |

## Acceptance

- Formatter world cho ngày đầu epoch, +360 ngày; 30 giây = 1 ngày; progress lẻ; tràn tháng/năm.
- Player year pass tăng tuổi/giảm thọ đúng một lần; world year pass không giảm thọ.
- Serialize/deserialize save mới và cũ giữ ánh xạ; offline 0/1/nhiều ngày không log giả hay nhân đôi.
- `absoluteDay`, seed, field task và `simulateWorldUntil` không đổi ngữ nghĩa.
- Gate: `verify_game.js`, `verify_offline_parity.js`, `verify_save_envelope.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| DATA-CLK-001 | engine.js:`GAME_TIME_CONFIG` | Khớp |
| DATA-CLK-002 | engine.js:`ensureWorldClock` (adapter `gameClock.world` ghi cứng `epochDate "6876-01-01"`, `startDayIndex 2475360`) | Lệch — adapter không phản chiếu `state.worldClock` (epoch thực Năm 6087) |
| DATA-CLK-003 | engine.js:`ensureGameClock` | Khớp |
| DATA-CLK-004/005 | engine.js:`advanceGameTime`, `advanceWorldClock`, `onGameYearPass` | Khớp |
| DATA-CLK-006 | engine.js:`applyOfflineProgress` | Khớp |
| DATA-CLK-007 | expansion.js: wrapper `advanceGameTime` → `simulateWorldUntil` | Khớp |
| DATA-CLK-008 | expansion.js:`absoluteDay`; engine.js:`gameDayIndex` | Khớp |
| DATA-CLK-010 | engine.js:`clockLabel`, `worldClockLabel`; main.js:`updateClockDisplay` | Khớp |
