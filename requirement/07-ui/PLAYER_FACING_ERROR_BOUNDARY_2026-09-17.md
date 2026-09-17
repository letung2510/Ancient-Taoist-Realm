# Player-facing error boundary

## Contract

Action `reason`, blocker và internal error code không được đi thẳng vào UI alert hoặc novel log. `GameEngine.playerFacingReason()` là boundary chung:

- mã lỗi có trong `ERROR_NARRATIVE_MAP` dùng câu văn tương ứng;
- mã nội bộ không có mapping dùng câu trung tính có nghĩa;
- các từ namespace/canonical/validator/internal/payload và tên field kỹ thuật bị loại khỏi thông báo người chơi;
- mảng blocker được gộp thành thông báo đọc được.

Novel log tiếp tục đi qua `narrativeSafe()` và `novelLogParagraphs()`, còn alert UI dùng cùng boundary để không có hai chuẩn hiển thị khác nhau.

## Acceptance

- Không hiển thị `SCREAMING_SNAKE_CASE`, tên field, `Depth`, `session`, `counter`, `state`, `cooldown`, `multiplier` trong player-facing error.
- Error mapping vẫn giữ được ý nghĩa, không biến thành chuỗi rỗng.
- Producer có thể giữ reason kỹ thuật trong runtime response/debug, nhưng UI/log chỉ nhận bản đã chuyển ngữ cảnh.

## Chưa hoàn thiện

Một số thông báo tĩnh trong content có thể cần biên tập văn phong riêng; boundary runtime đã được áp dụng cho alert của `main.js` và log renderer.
