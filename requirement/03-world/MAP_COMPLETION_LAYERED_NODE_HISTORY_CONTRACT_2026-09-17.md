# Map completion layered contract

## Canonical DTO

`mapCompletionDetailed(state, regionId)` extends the base completion DTO with:

- `layers.visited`: số node đã đặt chân tới;
- `layers.subLocation`: node có lịch sử điểm nhỏ;
- `layers.structure`: node có lịch sử công trình;
- `layers.weather`: node có chuyển thiên tượng;
- `layers.actor`: node có actor/NPC được ghi nhận;
- `layers.faction`: node có thay đổi thế lực;
- `historyCoverage`: tỷ lệ node có tối thiểu năm dấu vết lịch sử, dùng để giải thích độ đầy đủ của bản đồ;
- `explainable: true`: đánh dấu DTO có thể giải thích, không chỉ là boolean/percent.

Mọi layer lấy từ `mapNode().history`, được dedupe bằng key và giữ retention canonical. Save/load giữ nguyên history; UI có thể dùng cùng DTO với resolver map/fog/influence.

## Acceptance

Node detail hiển thị dấu vết gần đây và completion có thể trả lời vì sao vùng đạt bao nhiêu phần trăm. Thêm history không được làm thay đổi influence hoặc reward; duplicate key không làm tăng completion.

## Chưa hoàn thiện

Ngưỡng “năm dấu vết” là baseline giải thích, cần playtest để cân bằng cách tính danh hiệu bản đồ. Visual QA bản đồ thật vẫn cần browser được phép load local assets.
