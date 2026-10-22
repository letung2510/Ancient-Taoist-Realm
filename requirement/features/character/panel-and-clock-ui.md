# Nhân Vật — Panel Nhân Vật, Trạng Thái và clock

## Mục đích

Hợp đồng giao diện nhóm tab Nhân Vật (Trạng thái, Dị Thể), tab Công Trình ở nhóm Thế Giới, nút action trong panel Trạng thái và phân tách đồng hồ nhân vật/thế giới. Quy ước action surface/log chung: [../ui-action-log/README.md](../ui-action-log/README.md). Luật Dị Thể: [../di-the/README.md](../di-the/README.md); công trình bản đồ: [../map/README.md](../map/README.md); mô phỏng thế giới: [../world-simulation/README.md](../world-simulation/README.md).

## Rules

### CHR-UI-001 Tab Dị Thể
Tab canonical `data-tab="dithe"` trong nhóm Nhân Vật; nội dung Dị Thể không nằm trong Cổ Tịch/Nghề Ẩn. Mỗi Dị Thể hiện tên, trạng thái, tiến độ dấu mốc và cái giá. Trạng thái hiển thị: `locked` Chưa hé lộ · `revealed` Đã hé lộ, có thể tiếp nhận · `awakening` Đang thức tỉnh (kèm tầng) · `awakened` Đã thức tỉnh. Khóa nội bộ (ví dụ `daoTamGainMult`) không xuất ra UI, dùng nhãn người chơi hiểu ("Đạo Tâm nhận được"). Nút tiếp nhận/thức tỉnh gọi cùng resolver runtime với action engine; Dị Thể không tự khóa Nghề, Nghề ẩn hay Con Đường.

### CHR-UI-002 Tab Công Trình
Tab canonical `data-tab="structures"` trong nhóm Thế Giới, là nơi duy nhất quản lý công trình bản đồ: Truyền Tống Trận (alias `waystation`/`teleport_array`), Hộ Giới Đại Trận (alias `ward_formation`/`world_ward`), Vọng Lâu, Thương Trạm và công trình từ `structureCatalog()`. Mỗi công trình có trạng thái, cấp, độ bền, action sửa/nâng cấp/tháo dỡ nếu resolver cho phép; gắn với `state.locationId`, không hiển thị như tài sản toàn cục khi chưa có ownership. Phần Thế Sự không lặp block xây dựng.

### CHR-UI-003 Action trong panel Trạng thái
`renderStatus` lấy `contextState(state).actions` và hiển thị các action đang khả dụng thành nút. Nút chỉ phát lại click tới action canonical trong action list (không nhánh xử lý thứ hai). Action không còn tồn tại khi click → báo "không còn khả dụng", không đổi state một phần.

### CHR-UI-004 Hai đồng hồ
| | Player clock | World clock |
|---|---|---|
| State | `gameClock`, `clockLabel(state)` | `worldClock`, `worldClockLabel(state)` |
| DOM | `#game-clock` | `#world-clock` |
| Hiển thị | "Nhân vật · Năm Y, Tháng M, Ngày D" | "Thái Thanh đại lục · Năm Y · <Kỷ Nguyên>" (ẩn tháng/ngày) |
| Dùng cho | cooldown/action, tuổi, nghỉ, Dưỡng Mệnh, tu luyện, Nghề, quan hệ cá nhân, tiến hóa Mệnh, Dị Thể | weather, faction, chiến tranh, NPC scheduler, world event, bí cảnh, ảnh hưởng bản đồ, lịch sử node, công trình |

World clock schema tối thiểu: `{ currentYear, currentEra, currentMonth (1–12), currentDay (1–30), dayProgress, absoluteDay (≥ epoch), realTimeToGameTimeRatio: 1/30, lastSyncedPlayerDay (≥1) }`. Action tiêu tốn ngày của nhân vật là nguồn kích hoạt; world simulation lấy `worldClock.absoluteDay` làm ngày chuẩn, cùng tỉ lệ 1/30 với player clock. Save cũ hydrate world clock an toàn, không mất tiến trình nhân vật.

## Acceptance

- Render độc lập tab `dithe` và `structures` không throw; Cổ Tịch không còn block Dị Thể.
- Không có chuỗi `daoTamGainMult` trong UI người chơi.
- Panel Trạng thái có nút khi context có action.
- Hai clock cùng render với nhãn và title khác nhau; `validateWorldClockState` đạt.
- Bundle offline chứa cùng runtime với `index.html`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CHR-UI-001 | `index.html` (`data-tab="dithe"`); `js/ui.js` (cost labels `daoTamGainMult` → "Đạo Tâm nhận được") | Khớp |
| CHR-UI-002 | `index.html` (`data-tab="structures"`); `js/expansion.js:structureCatalog` | Khớp |
| CHR-UI-003 | `js/ui.js:renderStatus`; `js/engine.js:contextState` | Khớp |
| CHR-UI-004 | `js/engine.js:clockLabel`, `worldClockLabel`, `validateWorldClockState`, `advanceGameTime`; `index.html` (`#game-clock`, `#world-clock`) | Khớp |
