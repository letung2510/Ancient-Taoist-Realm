# Thiết kế hệ thống Dual Timeline: Thiên Đạo Clock và Player Clock

## 1. Mục đích

Tài liệu này mở rộng hệ thống `gameClock` hiện tại thành hai trục thời gian có quan hệ rõ ràng:

1. **Thiên Đạo Clock / World Clock**: thời gian lịch sử tuyệt đối của thế giới, dùng để mô tả thế giới đang ở năm nào kể từ một mốc lore cố định, ví dụ ngày `15/08/2026`.
2. **Player Clock**: thời gian đã trôi qua trong tuyến sống của nhân vật kể từ khi save/game bắt đầu, dùng cho tuổi, thọ nguyên, Mệnh Số, tiến trình travel và các mechanics đang gắn với `gameClock` hiện tại.

Mục tiêu là bổ sung ngữ nghĩa “thời gian chư thiên” mà không phá các logic đã tồn tại:

- `advanceGameTime(state, days)` vẫn là cổng duy nhất để tiến thời gian gameplay.
- Tỷ lệ chuẩn vẫn là `30 giây thực = 1 ngày game`.
- Offline progress vẫn dùng `lastRealTimestamp`.
- `onGameYearPass()` vẫn giảm thọ nguyên theo **Player Clock**, không theo lịch sử chư thiên.
- Weather, NPC, map, quest, incident, travel và reward vẫn được xử lý theo từng ngày gameplay.
- Player Log vẫn dùng timestamp dạng clock hiển thị, không dùng ISO timestamp.

---

## 2. Quyết định thiết kế bắt buộc

### 2.1 Một nguồn sự thật, hai góc nhìn

Hệ thống không tạo hai đồng hồ độc lập cùng tự chạy. Chỉ có một bộ máy tiến thời gian:

```text
advanceGameTime(state, days)
        |
        +-- cập nhật Player Clock
        +-- cập nhật World Clock theo cùng số ngày đã tiến
        +-- chạy daily mechanics đúng một lần cho từng ngày
```

`gameClock` vẫn là nguồn sự thật duy nhất. Bên trong `gameClock` có hai timeline và metadata liên kết, nhưng không được có hai hàm độc lập cùng cộng thời gian.

Trong giai đoạn triển khai đầu tiên, các field Player Clock hiện tại ở cấp trực tiếp của `gameClock` tiếp tục là canonical để tránh tạo thêm một lớp đồng bộ:

```text
gameClock.currentYear/currentMonth/currentDay/dayProgress
```

Object `gameClock.player` chỉ được phép xuất hiện sau khi có migration hoàn chỉnh; không triển khai đồng thời hai bản sao `root currentDay` và `player.currentDay` mà không quy định rõ nguồn sự thật.

### 2.2 Player Clock là timeline mechanics chính

Các logic hiện tại đang dùng `currentYear`, `currentMonth`, `currentDay`, `dayProgress` phải tiếp tục được hiểu là Player Clock trong giai đoạn tương thích.

Player Clock chịu trách nhiệm cho:

- tuổi nhân vật;
- thọ nguyên;
- thời điểm Luân Hồi/Chuyển Sinh;
- cooldown theo ngày;
- tiến độ Mệnh Số theo ngày;
- travel task và các hành động tiêu tốn ngày;
- thứ tự xử lý daily mechanics;
- timestamp chính của Player Log.

### 2.3 World Clock là lịch sử tuyệt đối của thế giới

World Clock mô tả vị trí của thế giới trên lịch sử chung. Nó không thay thế Player Clock trong các mechanics sinh mệnh.

Ví dụ:

```text
Thiên Đạo: Năm 6876 kể từ khi Linh khí suy kiệt
Nhân vật: Năm 1, Tháng 1 ngày 1
```

Nhân vật có thể mới bắt đầu hành trình ở năm 6876 của thế giới, nhưng bản thân mới sống/tiến triển được ngày đầu tiên trong Player Clock.

---

## 3. Hiện trạng phải được bảo toàn

### 3.1 Cấu hình thời gian hiện tại

Các giá trị hiện tại trong `GAME_TIME_CONFIG` tiếp tục là chuẩn:

```js
{
  version: 3,
  realSecondsPerGameDay: 30,
  gameDaysPerMonth: 30,
  monthsPerYear: 12,
  gameDaysPerYear: 360,
  onlineFateIntervalDays: 30
}
```

Quy ước:

- 1 tháng = 30 ngày.
- 1 năm = 12 tháng = 360 ngày.
- `dayProgress` ở cấp `gameClock` lưu phần ngày lẻ của Player Clock chưa đủ một ngày. World Clock không có `dayProgress` riêng; phần lẻ của nó luôn là cùng phần lẻ đó.
- Chỉ khi `dayProgress >= 1` mới chạy logic chuyển ngày.
- Tràn ngày xử lý theo thứ tự ngày → tháng → năm.

### 3.2 Player Clock hiện tại

Save mới hiện khởi tạo:

```js
{
  currentYear: 1,
  currentMonth: 1,
  currentDay: 1,
  dayProgress: 0,
  realTimeToGameTimeRatio: 1 / 30,
  timeScaleVersion: 3,
  eraIndex: 1,
  lastRealTimestamp: Date.now()
}
```

Trong thiết kế mới, các field này vẫn là canonical Player Clock ở phase đầu. Không tạo thêm `gameClock.player.currentYear/currentMonth/currentDay/dayProgress` nếu chưa có một migration chuyển đổi hoàn chỉnh. `currentEra`/`eraIndex` ở đây là Player Era; World Era phải dùng metadata riêng trong `gameClock.world`.

Không được xóa hoặc đổi tên các field cũ nếu chưa có migration đầy đủ.

### 3.3 Real-time và offline

`lastRealTimestamp` là timestamp kỹ thuật, không phải ngày game và không được hiển thị như ngày lore.

Luồng hiện tại tiếp tục giữ nguyên:

1. Main loop tính elapsed real seconds.
2. Main loop giới hạn elapsed online để tránh nhảy quá lớn.
3. Elapsed được nhân với `realTimeToGameTimeRatio`.
4. Kết quả được đưa vào `advanceGameTime()`.
5. Khi load save, `applyOfflineProgress()` dùng `lastRealTimestamp`.
6. Offline simulation không tự tạo Player Log giả cho từng event.
7. Sau offline progress, chỉ có thể tạo scene tóm tắt khi người chơi quay lại.

Player Clock và World Clock cùng tăng theo số ngày thực sự được `advanceGameTime()` xác nhận. Không được cho World Clock đọc trực tiếp `Date.now()` để tự suy ra ngày lore.

---

## 4. Mô hình dữ liệu đề xuất

### 4.1 Cấu trúc canonical giai đoạn đầu

```js
gameClock: {
  schemaVersion: 4,

  // Player Clock hiện tại vẫn là canonical để tương thích engine cũ.
  currentYear: 1,
  currentMonth: 1,
  currentDay: 1,
  dayProgress: 0,
  eraIndex: 1,
  currentEra: "Kỷ Nguyên Linh Khí Dị Biến",

  // Technical progression state, dùng chung cho cả hai timeline.
  realTimeToGameTimeRatio: 1 / 30,
  timeScaleVersion: 3,
  lastRealTimestamp: 0,

  world: {
    // worldDayIndex = 0 tương ứng với ngày lore này.
    // Đây không phải timestamp hệ thống và không được lấy từ Date.now().
    epochDate: "2026-08-15",
    epochLabel: "Mốc Linh khí suy kiệt",

    // Zero-based: 2,475,360 = Năm 6876 Tháng 1 ngày 1.
    startDayIndex: 2475360,

    // Cache; luôn tính lại từ startDayIndex + Player elapsed days.
    currentDayIndex: 2475360,
    currentYear: 6876,
    currentMonth: 1,
    currentDay: 1,
    currentEra: "Kỷ Nguyên Linh Khí Suy Kiệt",
    eraId: "linh_khi_suy_kiet"
  }
}
```

Các con số trong ví dụ chỉ minh họa. `world.startDayIndex` phải được xác định bởi data/config lore, không hard-code tùy ý trong engine.

`world.currentDayIndex/currentYear/currentMonth/currentDay/currentEra` là cache hiển thị. Canonical World Clock chỉ gồm `epochDate`, `startDayIndex`, metadata era và công thức tính từ Player elapsed days. Không được cho cache này tự tăng độc lập.

### 4.2 Không lưu dữ liệu suy ra nếu không cần thiết

Canonical tối thiểu trong phase đầu nên lưu:

- `gameClock.currentYear/currentMonth/currentDay`;
- `gameClock.dayProgress`;
- `world.startDayIndex`;
- `world.epochDate` và metadata era;
- `lastRealTimestamp`;
- tỷ lệ thời gian và version.

`playerElapsedWholeDays` là giá trị suy ra:

```text
playerElapsedWholeDays = gameDayIndex(gameClock) - 1
```

Không lưu thêm `player.elapsedWholeDays` trong phase đầu vì đó là bản sao dễ lệch với `currentYear/currentMonth/currentDay`.

### 4.3 Quy ước ngày và day index

Logic cũ đang dùng:

```text
gameDayIndex = (year - 1) × 360 + (month - 1) × 30 + day
```

Do đó ngày đầu tiên có index là `1`, không phải `0`.

Để hỗ trợ ý nghĩa “mốc 0”, dùng hai khái niệm riêng:

```text
playerCalendarDayIndex = 1 tại Năm 1, Tháng 1 ngày 1
playerElapsedWholeDays = playerCalendarDayIndex - 1
```

Ví dụ:

```text
Bắt đầu: Player Năm 1 Tháng 1 ngày 1
elapsedWholeDays = 0

Sau 1 ngày: Player Năm 1 Tháng 1 ngày 2
elapsedWholeDays = 1
```

World Clock dùng quy ước zero-based riêng để hỗ trợ rõ mốc năm 0:

```text
world.currentDayIndex = world.startDayIndex + playerElapsedWholeDays

worldYear = floor(world.currentDayIndex / 360)
worldMonth = floor((world.currentDayIndex % 360) / 30) + 1
worldDay = (world.currentDayIndex % 30) + 1
```

Với quy ước này:

```text
worldDayIndex = 0          → Năm 0, Tháng 1 ngày 1 (epochDate)
worldDayIndex = 2,475,360  → Năm 6876, Tháng 1 ngày 1
```

Không đổi công thức `gameDayIndex()` cũ trong cùng một migration nếu các subsystem đang dựa vào index hiện tại. Player Clock vẫn dùng index 1-based hiện hữu; chỉ World Clock dùng index 0-based.

---

## 5. Các hàm và trách nhiệm

### 5.1 `ensureGameClock(state)`

Tiếp tục là hàm normalize trung tâm.

Nó phải:

1. tạo `gameClock` nếu save không có;
2. migrate field cũ vào `player`;
3. áp dụng default cho save cũ;
4. chuẩn hóa tỷ lệ thời gian theo version;
5. bảo đảm Player Clock hợp lệ;
6. tạo `world` từ world config nếu save chưa có;
7. tính `playerElapsedWholeDays = gameDayIndex(clock) - 1` khi cần, không lưu bản sao trong phase đầu;
8. tính lại World Clock từ `world.startDayIndex + playerElapsedWholeDays`;
9. không dùng `Date.now()` để suy ra world day;
10. không làm tiến thời gian trong lúc normalize.

### 5.2 `gameDayIndex(clock)`

Trong giai đoạn tương thích, hàm này trả về Player Clock day index vì phần lớn mechanics hiện tại đang dùng nó.

Có thể bổ sung:

```js
playerDayIndex(state)
worldDayIndex(state)
worldClockLabel(state)
playerClockLabel(state)
```

Không đổi ý nghĩa `gameDayIndex()` một cách âm thầm. Nếu sau này đổi tên thành `playerDayIndex()`, phải giữ wrapper tương thích và cập nhật toàn bộ caller.

### 5.3 `clockLabel(state)`

`clockLabel()` tiếp tục trả về Player Clock để không phá Player Log:

```text
Năm 1, Tháng 1 ngày 1 · Kỷ Nguyên Linh Khí Dị Biến
```

Thêm hàm riêng cho World Clock:

```text
Thiên Đạo: Năm 6876, Tháng 1 ngày 1 · Kỷ Nguyên Linh Khí Suy Kiệt
```

Không đổi `clockLabel()` thành World Clock nếu chưa cập nhật toàn bộ quy tắc history, event grouping và mechanics.

### 5.4 `advanceGameTime(state, days)`

Đây là cổng tiến thời gian duy nhất.

Luồng chuẩn:

```text
advanceGameTime(state, days)
  ├─ ensureGameClock(state)
  ├─ cộng days vào player.dayProgress
  ├─ mỗi khi đủ 1 ngày:
  │   ├─ tăng Player Calendar một ngày
  │   ├─ tính lại Player elapsed days = gameDayIndex(gameClock) - 1
  │   ├─ tính lại World Clock
  │   ├─ đọc location/node hiện tại
  │   ├─ chạy weather/NPC/map/quest/incident/travel tick
  │   ├─ xử lý reward/cooldown theo Player Day Index
  │   └─ tạo event theo đúng scene/ngày nếu không ở offline simulation
  └─ trả về clock canonical
```

Khi `days` tạo nhiều ngày, phải xử lý từng ngày tuần tự. Không cộng dồn một lần rồi chạy mechanics chỉ ở ngày cuối.

### 5.5 `onGameYearPass(state)`

Hàm này chỉ chạy khi Player Clock vượt từ tháng 12 sang năm mới.

Giữ nguyên các tác động hiện tại:

- tăng `player.currentAge`;
- giảm `player.lifespan`;
- cảnh báo khi thọ nguyên thấp;
- gọi Luân Hồi nếu thọ nguyên cạn.

Không gọi hàm này chỉ vì World Clock đổi năm. Hai lịch có thể đổi năm ở các thời điểm khác nhau.

### 5.6 `applyOfflineProgress(state, now)`

Giữ nguyên semantics hiện tại:

- tính elapsed từ `lastRealTimestamp`;
- chuyển elapsed thành fractional game days;
- gọi `advanceGameTime()` một lần cho batch offline;
- bật `_offlineSimulation` và `_suppressHistory` trong quá trình mô phỏng;
- đồng bộ world simulation đến đúng Player Clock hiện tại;
- sau đó tạo tối đa một scene tóm tắt offline;
- cập nhật `lastRealTimestamp`.

Offline không được chạy một lần cho Player Clock và một lần nữa cho World Clock. World Clock chỉ nhận kết quả từ cùng lần tiến đó.

---

## 6. Hiển thị UI

### 6.1 Hiển thị mặc định

Khu vực clock nên hiển thị hai dòng có nhãn rõ ràng:

```text
Thiên Đạo · Năm 6876, Tháng 1 ngày 1
Hành Trình · Năm 1, Tháng 1 ngày 1
```

Không dùng hai chuỗi giống nhau mà không có nhãn, vì người chơi sẽ không biết năm nào đang dùng cho thọ nguyên.

### 6.2 Ngữ cảnh chi tiết

Có thể hiển thị thêm:

```text
Kỷ Nguyên Linh Khí Suy Kiệt
Đã sống trong hành trình: 0 ngày
```

`Đã sống trong hành trình` lấy từ `gameDayIndex(gameClock) - 1`, không lấy từ `Date.now() - createdAt`.

### 6.3 Player Log

Player Log tiếp tục dùng Player Clock:

```text
[Năm 1, Tháng 1 ngày 1 · Kỷ Nguyên Linh Khí Dị Biến]

Nội dung scene.
```

Nếu cần thêm bối cảnh World Clock, chỉ bổ sung như metadata/phần context riêng, không thay thế timestamp Player Clock:

```text
[Năm 1, Tháng 1 ngày 1 · Kỷ Nguyên Linh Khí Dị Biến]
Thiên Đạo: Năm 6876 · Linh khí suy kiệt

Nội dung scene.
```

Việc hiển thị World Clock trong mọi log là tùy chọn UI, nhưng dữ liệu event nên có cả hai clock nếu cần audit/replay.

### 6.4 System Log và audit

Event tiếp tục lưu:

- `clock`: Player Clock label để hiển thị;
- `worldClock`: World Clock label hoặc snapshot nếu cần;
- `timestamp`: ISO timestamp cho audit kỹ thuật;
- `sceneId`: khóa gom scene.

ISO timestamp không được dùng làm thời gian lore và không được render thay cho hai game clock.

---

## 7. Event, scene và determinism

### 7.1 Event snapshot

Event mới nên có snapshot tại thời điểm tạo:

```js
{
  clock: "Năm 1, Tháng 1 ngày 1 · Kỷ Nguyên Linh Khí Dị Biến",
  worldClock: "Thiên Đạo: Năm 6876, Tháng 1 ngày 1",
  timestamp: "<ISO audit timestamp tại thời điểm event>",
  playerDayIndex: 1,
  worldDayIndex: 2475360,
  sceneId: "player-day-1:son_mon",
  context: {
    locationId: "son_mon",
    weather: "..."
  }
}
```

Snapshot là dữ liệu tại thời điểm event xảy ra. Khi render lại history không được đọc clock hiện tại để ghi đè timestamp cũ.

### 7.2 Scene grouping

Quy tắc hiện tại tiếp tục có hiệu lực:

- event cùng `sceneId + clock + locationId` dùng chung timestamp;
- event khác Player Day phải mở scene mới;
- event khác node, weather hoặc nguyên nhân phải mở scene mới;
- `renderScene()` ưu tiên `sceneId`;
- fallback cũ chỉ dùng cho history thiếu metadata;
- command echo, debug event và error code không vào Player Log.

World Clock thay đổi không tự động tạo scene mới nếu Player Clock, node và nguyên nhân vẫn thuộc cùng scene. Nếu gameplay yêu cầu một biến cố lịch sử riêng, event đó phải chỉ rõ `sceneId`/relation.

### 7.3 Determinism

Với cùng:

- state;
- seed;
- Player Clock;
- World Clock start index;
- thứ tự action;

kết quả mechanics và thứ tự ngày phải giống nhau.

Không dùng ngày hệ điều hành, timezone hoặc ISO timestamp làm input random/gameplay. `Date.now()` chỉ dùng để quy đổi real elapsed time; test deterministic phải truyền `now` giả lập vào API.

---

## 8. Tương tác với mechanics hiện có

| Subsystem | Clock dùng để xử lý | Ghi chú |
|---|---|---|
| Tuổi nhân vật | Player Clock | Tăng khi Player Clock qua năm |
| Thọ nguyên | Player Clock | Không phụ thuộc World Clock đổi năm |
| Mệnh Số cooldown | Player Day Index | Giữ logic `lastNurtureDay` hiện tại |
| Online fate reward | Player Day Index | Giữ `nextOnlineFateDay` hiện tại |
| Travel | Player Clock | Tick theo từng ngày; đọc node hiện tại sau mỗi ngày |
| Weather | Current node/region + Player Day | Không giữ region cũ khi node đã đổi |
| NPC | Current node + Player Day | Không suy ra từ real timestamp |
| Quest/incident | Player Day + current location | World Clock chỉ là context nếu cần |
| Offline simulation | Cả hai cùng batch | Chỉ gọi một lần `advanceGameTime()` |
| Player Log | Player Clock | Heading riêng, không nối `:` |
| Audit/System Log | ISO + cả hai snapshot | ISO không hiển thị như lore clock |

---

## 9. Migration save cũ

### 9.1 Nguyên tắc

Save cũ phải load được mà không làm thay đổi tiến trình Player Clock hiện có.

### 9.2 Quy trình migration

Khi deserialize:

1. đọc `state.gameClock` cũ;
2. chạy migration trước `applyOfflineProgress()`;
3. coi `currentYear/currentMonth/currentDay/dayProgress` cũ là Player Clock;
4. tính `playerElapsedWholeDays = gameDayIndex(playerClock) - 1` khi cần, không lưu bản sao;
5. tạo `world` từ world config mặc định;
6. gán `world.startDayIndex` theo lựa chọn tương thích của game;
7. tính `world.currentDayIndex = startDayIndex + playerElapsedWholeDays`;
8. giữ `lastRealTimestamp` và `savedAt` theo quy tắc hiện có;
9. chạy `ensureGameClock()` lại để normalize;
10. chỉ sau đó mới chạy `applyOfflineProgress()`.

### 9.3 Lựa chọn world start cho save cũ

Vì save cũ chưa biết nhân vật bắt đầu ở ngày nào của World Clock, cần một policy cố định:

- **Policy bắt buộc cho migration**: mọi save cũ dùng cùng một `LEGACY_WORLD_START_DAY_INDEX` cố định trong world config. Giá trị này phải được version hóa cùng data và không được lấy từ thời điểm load.
- Nếu cần giữ khác biệt giữa các save cũ, mapping phải là dữ liệu ổn định được lưu một lần trong save, không được suy ra lại từ `Date.now()`, timezone hoặc thứ tự load.

Không tự ý lấy `createdAt`, `savedAt` hoặc thời điểm load làm World Clock lore date. Các giá trị đó là real timestamp kỹ thuật.

### 9.4 Không làm lại tuổi/thọ khi migrate

Migration chỉ dựng dữ liệu clock. Nó không được gọi `onGameYearPass()` hồi tố và không được giảm thọ nguyên chỉ vì World Clock được thêm vào.

---

## 10. Guard chống tiến thời gian hai lần

Vì main loop, action handler, travel resolver và offline loader đều có thể gọi tiến thời gian, phải có guard ở cấp clock transaction.

Yêu cầu:

- mỗi action/tick chỉ có một owner gọi `advanceGameTime()`;
- travel completion không được vừa resolve ngày vừa để action wrapper cộng lại cùng ngày;
- offline loader không được gọi lại sau khi deserialize wrapper đã xử lý;
- guard phải được reset trong `finally` nếu có exception;
- guard không được làm mất một lần tiến thời gian hợp lệ ở tick kế tiếp.

Mọi lần advance nên có transaction context nội bộ, ví dụ:

```js
{
  source: "online-loop" | "action" | "travel" | "offline",
  transactionId: "...",
  suppressHistory: true | false
}
```

Context này phục vụ audit và chống gọi trùng, không phải một clock thứ ba.

---

## 11. Các điểm cần tránh

- Không đổi `clockLabel()` sang World Clock một cách âm thầm.
- Không dùng `Date.now()` để tính trực tiếp năm 6876.
- Không để World Clock và Player Clock tự chạy ở hai interval khác nhau.
- Không giảm thọ nguyên khi World Clock qua năm.
- Không dùng World Clock để thay thế `lastNurtureDay`, `nextOnlineFateDay` hoặc các field mechanics cũ nếu chưa migration rõ ràng.
- Không gộp nhiều Player Day thành một scene duy nhất.
- Không tạo Player Log giả cho offline simulation.
- Không đọc region cũ cho weather/NPC/travel sau khi node đã thay đổi.
- Không lưu hai giá trị current day khác nhau mà không có canonical source.
- Không để cache `world.currentYear` trở thành nguồn sự thật độc lập với `world.currentDayIndex`.

---

## 12. Technical debt và ràng buộc trước triển khai

### 12.1 Duplicate field trong giai đoạn chuyển tiếp

Engine hiện dùng trực tiếp `gameClock.currentYear/currentMonth/currentDay`. Việc thêm `gameClock.player.*` ngay lập tức sẽ tạo hai nguồn sự thật và có nguy cơ lệch khi một subsystem chỉ cập nhật một bên.

Vì vậy phase đầu chỉ thêm `gameClock.world.*`; Player Clock vẫn ở field cũ. Chỉ được chuyển sang nested `player` trong một migration riêng, có test đọc/ghi toàn bộ caller và có một canonical serializer.

### 12.2 Không đồng nhất zero-based và one-based

Player Clock hiện có ngày đầu tiên là index `1`, trong khi World Clock được thiết kế để có mốc `0` tại `epochDate`. Đây là chủ ý, không phải lỗi tính toán. Mọi API phải đặt tên rõ (`playerDayIndex` hoặc `worldDayIndex`) và không truyền nhầm index giữa hai lịch.

### 12.3 `epochDate` không phải đồng hồ hệ điều hành

`world.epochDate = "2026-08-15"` là ngày lore. Nó không được dùng để tính elapsed bằng timezone, DST hoặc độ lệch giờ máy. Nếu cần hiển thị ngày dương lịch thực, phải có một hàm format riêng và test timezone; không trộn vào game-day arithmetic.

### 12.4 World start phải ổn định

`world.startDayIndex` là vị trí của thế giới tại Player Day 1. Với game mới, nó lấy từ world/lore config. Với save cũ, nó lấy từ `LEGACY_WORLD_START_DAY_INDEX` cố định. Không lấy thời điểm load làm start index vì sẽ làm cùng một save cho kết quả khác nhau tùy lúc mở game.

### 12.5 Player Era và World Era là hai metadata khác nhau

`currentEra`/`eraIndex` hiện tại có logic riêng theo Player Clock. World Era phải có `world.eraId` và rule/config riêng. Nếu chỉ cần một era lore tĩnh ở giai đoạn đầu, lưu `eraId` tĩnh; chưa được dùng logic “mỗi 500 năm” của Player Clock cho World Era.

### 12.6 Offline semantics cần chốt rõ

Offline progress hiện làm Player Clock tiến, vì vậy cũng làm World Clock tiến cùng số ngày. Điều này đồng nghĩa thọ nguyên và tuổi vẫn có thể bị ảnh hưởng trong offline simulation khi Player Clock vượt năm. Nếu game design sau này muốn offline không làm già nhân vật, đó là thay đổi mechanics riêng, không được âm thầm sửa trong dual-clock implementation.

### 12.7 Player Clock không reset khi Luân Hồi

Theo logic hiện tại, `advanceGameTime()` và `onGameYearPass()` thuộc về timeline của save/hành trình, còn Luân Hồi xử lý trạng thái nhân vật. Vì vậy Player Clock và World Clock tiếp tục tiến qua Luân Hồi; không reset Player Clock về Năm 1.

Nếu sau này cần hiển thị “tuổi của đời hiện tại”, phải bổ sung một `lifeClock` hoặc `incarnationStartDayIndex` riêng. Không được dùng lại Player Clock cho mục đích đó, vì sẽ làm sai cooldown, thứ tự daily mechanics, history và quan hệ với World Clock.

### 12.8 Cache World Clock phải có một hướng cập nhật

Nếu lưu `world.currentDayIndex/currentYear/currentMonth/currentDay` để render nhanh, chỉ `advanceGameTime()` và `ensureGameClock()` được phép cập nhật chúng. UI chỉ đọc; không được tự tính rồi ghi ngược vào save.

### 12.9 Event snapshot và scene identity

World Clock snapshot không được tự đưa vào `sceneId` mặc định, nếu không cùng một Player scene có thể bị tách ngoài ý muốn. `sceneId` vẫn ưu tiên Player Clock + location + nguyên nhân theo audit hiện tại. World Clock là metadata/context trừ khi một event lore có chủ ý mở scene riêng.

### 12.10 Config versioning

`epochDate`, `startDayIndex`, quy tắc World Era và `schemaVersion` phải được version hóa. Không thay đổi lore config hiện hành mà không có migration, vì cùng một save cũ có thể render khác World Clock sau khi deploy data mới.

### 12.11 Audit toàn bộ code hiện tại: `expansion.js` có day abstraction riêng

`js/expansion.js` hiện có helper `absoluteDay(clock)` dùng công thức Player Clock 1-based. Helper này được dùng rộng rãi cho:

- world simulation seed;
- `worldSimulation.lastProcessedDay`;
- weather, faction, NPC và incident tick;
- scheduled task `dueDay/createdDay`;
- contract, auction, guild project và các tiến trình expansion;
- cooldown, generated day và các mốc trong `state.worldSimulation`.

Không được đổi helper này sang World Clock trong cùng change với dual timeline. Nếu đổi, toàn bộ day field đã lưu trong `worldSimulation` sẽ bị diễn giải sai. Phase đầu phải giữ:

```text
expansion absoluteDay = Player Day Index 1-based
```

Nếu sau này world simulation thực sự cần lịch chư thiên, phải thêm helper và namespace riêng, ví dụ `absoluteWorldDay()`, kèm migration cho từng field; không tái sử dụng `absoluteDay()` bằng cách đổi nghĩa.

### 12.12 Wrapper `E.advanceGameTime()` và nguy cơ double world tick

`expansion.js` hiện bọc `E.advanceGameTime()`:

```text
original.advanceGameTime(state, days)
→ ensure(state)
→ simulateWorldUntil(state, absoluteDay(state.gameClock))
```

Trong khi đó engine core cũng là nơi sẽ cập nhật World Clock. Nếu thêm `simulateWorldUntil()` vào core mà giữ wrapper hiện tại, một lần advance có thể chạy world simulation hai lần. Guard hiện có dựa trên `lastProcessedDay` chỉ an toàn khi cả hai bên dùng cùng một day axis; nó không đủ nếu một bên dùng Player Day và bên kia dùng World Day.

Quyết định bắt buộc cho phase đầu:

- core `advanceGameTime()` chỉ cập nhật hai clock và giữ daily mechanics hiện có;
- expansion wrapper tiếp tục là owner của `simulateWorldUntil()`;
- không gọi `simulateWorldUntil()` thêm từ World Clock updater;
- `lastProcessedDay` vẫn là Player Day Index của expansion;
- chỉ một lớp được phép chuyển world simulation từ ngày cũ đến ngày mới.

Nếu muốn chuyển owner về core, phải xóa/disable wrapper simulation trong cùng một migration và có test duplicate guard; không để hai owner cùng tồn tại.

### 12.13 Seed và replay đang phụ thuộc Player Day

`seeded(state, scope, day)` mặc định lấy `absoluteDay(state.gameClock)`. Nhiều world mechanic không truyền day tường minh, nên đổi default sang World Day sẽ thay đổi random result của save cũ dù state và seed không đổi.

Phase đầu giữ seed namespace cũ:

```text
world simulation seed day = Player Day Index
```

World Day chỉ được thêm làm input khi feature thực sự cần lịch sử chư thiên, và phải version hóa seed namespace, ví dụ `world-v2|worldDay`. Không âm thầm thay `absoluteDay()` trong seeded.

### 12.14 Offline deserialize có nhiều lớp gọi

Engine `deserialize()` hiện tự gọi `applyOfflineProgress()`. Sau đó expansion wrapper `E.deserialize()` gọi `ensure()` và `simulateWorldUntil()` lần nữa. Các guard hiện tại ngăn một phần xử lý lặp vì `lastProcessedDay`, nhưng dual timeline không được dựa vào việc hai day index tình cờ giống nhau.

Migration phải quy định rõ thứ tự và owner:

```text
deserialize raw save
  → migrate/normalize dual clock
  → applyOfflineProgress đúng một lần
  → expansion simulate đúng phần world simulation chưa xử lý
  → ghi một offline summary nếu cần
```

Không được gọi offline progress lại chỉ vì bổ sung World Clock. Test phải kiểm tra cả số lần advance, số lần world tick và số lần reward.

### 12.15 World Day Index 0 không tương thích trực tiếp với API cũ

Các API expansion hiện clamp `absoluteDay()` tối thiểu là `1`, và nhiều task dùng điều kiện `dueDay >= 1`. Do đó không được truyền `worldDayIndex = 0` vào các API Player Day cũ. World Day 0 chỉ dùng cho formatter/lore layer; adapter phải giữ Player Day Index 1-based khi gọi mechanics hiện có.

### 12.16 Các field day trong save không được migrate hàng loạt bằng rename

Các field như `lastProcessedDay`, `dueDay`, `createdDay`, `resolvedDay`, `generatedDay`, `expiresDay`, `startDay` và cooldown day có thể mang ý nghĩa Player Day khác nhau. Không được đổi tên hoặc cộng offset hàng loạt. Mỗi field phải được phân loại:

```text
PLAYER_DAY      → giữ nguyên, dùng Player Day Index
WORLD_DAY       → mới, dùng World Day Index
REAL_TIMESTAMP  → ISO/milliseconds, chỉ audit/elapsed
```

Nếu chưa phân loại được, giữ field ở Player Day và ghi rõ trong schema thay vì đoán.

### 12.17 API surface phải tách label và ordinal

Không dùng một hàm vừa trả label vừa làm input mechanics. Cần phân biệt:

```js
playerClockLabel(state)
worldClockLabel(state)
playerDayIndex(state)
worldDayIndex(state)
```

`clockLabel()` và `gameDayIndex()` giữ wrapper tương thích hiện tại; chúng tiếp tục trả Player Clock trong phase đầu.

### 12.18 Phân biệt hàm core lexical và API `E.advanceGameTime`

Trong `expansion.js`, một số code gọi trực tiếp tên `advanceGameTime(...)`, trong khi public API được gắn qua `E.advanceGameTime`. Khi thêm transaction/guard, không được giả định hai đường gọi này tự động đi qua cùng wrapper.

Phải rà soát và chuẩn hóa từng caller:

- caller muốn chạy full expansion pipeline phải gọi public owner đã thống nhất;
- caller nội bộ của core phải gọi core primitive đúng một lần;
- không để một action gọi core primitive rồi caller bên ngoài gọi public wrapper cho cùng một ngày;
- đặc biệt kiểm tra `resolveMapTransaction()`/local activity, travel completion và các handler trong `main.js`.

Test phải instrument `advanceGameTime`, `simulateWorldUntil` và daily reward để chứng minh một action chỉ tạo đúng một transaction.

## 13. Kế hoạch triển khai đề xuất

### Phase 1 — Data contract

- thêm version/schema cho dual timeline;
- bổ sung `player` và `world` trong `gameClock`;
- giữ toàn bộ field cũ;
- viết `ensureGameClock()` migration và normalization;
- thêm unit test cho day index và tràn lịch.

### Phase 2 — Clock engine

- cập nhật `advanceGameTime()` để tăng cả hai timeline trong cùng transaction;
- cập nhật các daily mechanics giữ nguyên Player Clock;
- giữ offline behavior;
- thêm guard chống duplicate advance.
- không đổi nghĩa `expansion.absoluteDay()`;
- không chuyển seed hoặc các world task cũ sang World Day;
- không thêm world simulation tick thứ hai trong core.

### Phase 3 — Event/history

- bổ sung `worldClock`, `playerDayIndex`, `worldDayIndex` vào event snapshot;
- giữ `clock` hiện tại là Player Clock;
- kiểm tra scene grouping và offline summary;
- cập nhật render để ưu tiên metadata mới.
- kiểm tra wrapper `E.advanceGameTime()` và `E.deserialize()` không gọi trùng;
- giữ day fields cũ của expansion là Player Day cho đến khi có migration riêng.

### Phase 4 — UI

- hiển thị hai dòng có nhãn;
- thêm tooltip giải thích sự khác nhau;
- không thay đổi layout nếu không cần thiết;
- kiểm tra mobile và overlay map/travel.

### Phase 5 — Mechanics audit

- rà soát mọi caller của `Date.now()`;
- rà soát mọi caller của `advanceGameTime()`;
- rà soát các subsystem dùng `currentYear/currentDay`;
- xác nhận không có subsystem nào vô tình lấy World Clock để giảm thọ nguyên.
- phân loại mọi day field của `worldSimulation` thành Player Day/World Day/Real Timestamp;
- kiểm tra các caller bare `advanceGameTime()` và các wrapper `E.advanceGameTime()`;
- kiểm tra `applyOfflineProgress()` không bị gọi thêm qua expansion deserialize.

---

## 14. Tiêu chí nghiệm thu

### Data và migration

- Save mới có đủ Player Clock và World Clock.
- Save cũ vẫn load được.
- Save cũ không bị giảm thêm thọ nguyên khi migration.
- `ensureGameClock()` không tự tiến thời gian.
- World Clock được tính nhất quán từ start index và Player elapsed days.

### Clock behavior

- 30 giây thực tương ứng 1 ngày gameplay.
- Phần lẻ được giữ trong `dayProgress`.
- Tràn ngày/tháng/năm đúng như logic hiện tại.
- Online và offline cùng đi qua một cổng `advanceGameTime()`.
- World Clock không chạy độc lập hoặc chạy hai lần.
- `simulateWorldUntil()` chỉ có một owner và được gọi đúng một lần cho mỗi Player Day range.
- `expansion.absoluteDay()` vẫn giữ kết quả cũ với cùng state/seed.

### Player mechanics

- Player Clock qua năm thì tuổi tăng và thọ nguyên giảm đúng một lần.
- World Clock qua năm không làm giảm thọ nguyên.
- Cooldown, Mệnh Số và reward vẫn dùng Player Day Index.
- Travel nhiều ngày hiển thị đúng ngày bắt đầu, ngày giữa và ngày đến.

### Log/UI

- UI hiển thị rõ hai clock và nhãn của từng clock.
- Player Log không có dạng `[clock]: nội dung`.
- Player Log dùng Player Clock làm heading.
- Event có thể audit được cả ISO timestamp và world/player snapshot.
- Không có timestamp lặp hoặc sai node/weather.
- Offline progress không tạo event giả hoặc lặp reward/NPC/weather/travel completion.

### Determinism

- Cùng state, seed, config và action order cho cùng mechanics result.
- Cùng state, seed và elapsed time cho cùng thứ tự Player Day.
- Timezone, định dạng ISO và giờ máy không làm thay đổi kết quả lore clock.
- Cùng save cũ sau migration cho cùng seed result, cùng world event order và cùng reward count.
- Offline deserialize không làm tăng hai lần `lastProcessedDay`, reward, event, travel completion hoặc task resolution.

---

## 15. Kết luận thiết kế

`Năm 1, Tháng 1 ngày 1` tiếp tục là Player Clock của nhân vật. World Clock mới bổ sung sẽ trả lời câu hỏi “thế giới đang ở năm nào trong lịch sử chư thiên”, ví dụ “Năm 6876 kể từ khi Linh khí suy kiệt”.

Hai clock không phải hai bộ máy thời gian. Chúng là hai cách biểu diễn cùng một lần tiến gameplay:

```text
Một ngày gameplay trôi qua
  → Player Clock +1 ngày
  → World Clock +1 ngày
  → mechanics chạy một lần
  → Player Log ghi Player Clock
  → audit có thể ghi cả hai clock + ISO timestamp
```

Thiết kế này bảo toàn logic hiện tại, đồng thời tạo nền tảng để mở rộng lore lịch sử, tuổi/thọ, Mệnh Số và các hệ thống phụ thuộc thời gian mà không biến `Date.now()` thành nguồn sự thật của game.
