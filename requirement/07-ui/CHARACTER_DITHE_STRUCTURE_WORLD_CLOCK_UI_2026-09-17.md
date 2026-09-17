# UI Canonicalization: Nhân Vật, Dị Thể, Công Trình và World Clock

## Phạm vi

Tài liệu này chốt các thay đổi giao diện và hợp đồng runtime cho bốn điểm dễ gây nhầm lẫn:

1. Dị Thể là một tab độc lập trong nhóm Nhân Vật.
2. Công Trình là một tab độc lập trong nhóm Thế Giới.
3. Trạng thái phải hiển thị các hành động hiện khả dụng và cho phép kích hoạt trực tiếp.
4. Thời gian của nhân vật và thời gian của thế giới là hai hệ thống độc lập nhưng có quy tắc đồng bộ một chiều rõ ràng.

## 1. Tab Nhân Vật → Dị Thể

### Quy tắc hiển thị

- Tab canonical: `data-tab="dithe"`.
- Nội dung Dị Thể không còn nằm trong Cổ Tịch/Nghề Ẩn.
- Mỗi Dị Thể hiển thị tên, trạng thái, tiến độ dấu mốc và cái giá.
- Các khóa dữ liệu nội bộ như `daoTamGainMult` không được xuất ra UI; phải dùng nhãn người chơi hiểu được như “Đạo Tâm nhận được”.
- Dị Thể không tự động khóa Nghề chính, Nghề ẩn hoặc Con Đường. Các hệ thống này chỉ thay đổi qua resolver canonical của chính chúng.

### Trạng thái canonical

- `locked`: Chưa hé lộ.
- `revealed`: Đã hé lộ, có thể tiếp nhận.
- `awakening`: Đang thức tỉnh, hiển thị tầng hiện tại.
- `awakened`: Đã thức tỉnh.

Nút tiếp nhận/thức tỉnh phải gọi cùng resolver runtime với action engine, không được tự sửa state từ UI.

## 2. Tab Thế Giới → Công Trình

Tab canonical: `data-tab="structures"`.

Tab này là nơi duy nhất để người chơi quản lý công trình bản đồ:

- Truyền Tống Trận: alias runtime có thể là `waystation` hoặc `teleport_array`.
- Hộ Giới Đại Trận: alias runtime có thể là `ward_formation` hoặc `world_ward`.
- Vọng Lâu, Thương Trạm và các công trình tương lai lấy từ `structureCatalog()`.
- Mỗi công trình phải có trạng thái, cấp, độ bền và action sửa chữa/nâng cấp/tháo dỡ nếu resolver cho phép.
- Công trình gắn với `state.locationId`; không được hiển thị như tài sản toàn cục nếu chưa có location ownership.

Phần Thế Sự chỉ còn mô tả thời tiết, sự kiện, khế ước và lịch sử node; không lặp lại block thao tác xây dựng.

## 3. Trạng thái và action

`renderStatus` phải gọi `contextState(state).actions`, hiển thị tối đa các action đang khả dụng dưới dạng nút. Nút trong panel Trạng thái chỉ phát lại click tới action canonical trong action list, nhờ đó không tạo nhánh xử lý thứ hai và không làm lệch điều kiện, cost hoặc log.

Nếu action không còn tồn tại khi người chơi click, UI phải báo action không còn khả dụng thay vì làm thay đổi state một phần.

## 4. Hai hệ thống clock

### Player clock

`gameClock`/`clockLabel(state)` là thời gian thuộc nhân vật: dùng cho ngày nghỉ, hành động, cooldown, tuổi, lịch sử hành động và các hệ quả trực tiếp lên nhân vật.

### World clock

`worldClock`/`worldClockLabel(state)` là thời gian thuộc thế giới: dùng cho tiến trình mô phỏng, faction, chiến tranh, node completion, weather và các thay đổi không phụ thuộc một nhân vật cụ thể.

Schema tối thiểu:

```js
worldClock: {
  currentYear: 6087,
  currentEra: "Kỷ Nguyên Linh Khí Dị Biến",
  currentMonth: 1,
  currentDay: 1,
  dayProgress: 0,
  absoluteDay: 2190961,
  realTimeToGameTimeRatio: 1 / 30,
  lastSyncedPlayerDay: 1
}
```

### Quy tắc đồng bộ

- Player clock là nguồn kích hoạt khi một action của nhân vật tiêu tốn ngày.
- World clock vẫn tính đủ `currentMonth`, `currentDay`, `absoluteDay` và `dayProgress` nội bộ; UI chỉ ẩn tháng/ngày và hiển thị Năm 6087 của Kỷ Nguyên Linh Khí Dị Biến.
- World clock dùng cùng tỷ lệ thời gian thực/game-day với player clock (`1/30`), nhưng world simulation lấy `worldClock.absoluteDay` làm nguồn ngày chuẩn.
- Ngày/tháng/năm hiển thị cụ thể của nhân vật chỉ thuộc Player clock.
- Player clock được dùng cho cooldown/action và tiến trình gắn trực tiếp với nhân vật: Dưỡng Mệnh, tu luyện, Nghề, quan hệ cá nhân, tiến hóa Mệnh Số và các trạng thái Dị Thể.
- World clock được dùng cho weather, faction, chiến tranh, NPC scheduler, world event, hidden realm, map influence, node history và các công trình bản đồ.
- Không dùng chung một DOM element: `#game-clock` dành cho nhân vật, `#world-clock` dành cho thế giới.
- Save cũ phải hydrate world clock an toàn, không làm mất tiến trình nhân vật.

## 5. Regression checklist

- Render độc lập các tab `dithe` và `structures` không throw.
- Oddities/Cổ Tịch không còn block Dị Thể hữu hình.
- Không có chuỗi `daoTamGainMult` trong UI người chơi.
- Trạng thái có nút action khi context có action.
- Hai clock cùng render nhưng có nhãn và title khác nhau.
- Offline bundle chứa cùng runtime mới nhất với `index.html`.

## Phần chưa hoàn thiện

- Cần QA trực tiếp trên browser thật để kiểm tra bố cục ở màn hình hẹp và xác nhận các alias công trình trên mọi save cũ.
- Cần bổ sung test snapshot cho chênh lệch world clock/player clock khi mô phỏng thế giới chạy nền nhiều ngày.
