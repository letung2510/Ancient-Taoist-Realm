# LOG TECHNICAL TOKEN SANITIZATION — 2026-09-17

## Mục tiêu

Mọi log đi tới khu vực nhật ký người chơi phải giữ văn phong tiểu thuyết. Các khóa kỹ thuật do subsystem phát ra không được xuất hiện nguyên dạng trong câu chuyện, kể cả khi producer gửi trực tiếp một payload lỗi hoặc thông báo nội bộ.

## Phạm vi contract

- Boundary chuẩn là `createGameEvent` → `renderGameEvent`/`formatPlayerLogText` → `novelLogParagraphs` hoặc `renderScene`.
- Mã lỗi dạng `SCREAMING_SNAKE_CASE` được ánh xạ qua `ERROR_NARRATIVE_MAP`; mã chưa biết dùng fallback trung tính.
- Các token kỹ thuật bị loại khỏi player-facing prose gồm `internal`, `debug`, `raw`, `payload`, `field_name`, `undefined`, `null`, cùng nhóm token cũ như `Depth`, `Search`, `session`, `counter`, `cooldown`, `multiplier`, `state`.
- `debugOnly`/`COMMAND_ECHO` vẫn được phép tồn tại trong history phục vụ chẩn đoán nhưng không được render vào nhật ký người chơi.
- `statDisplay` là kênh số liệu riêng; không trộn vào câu văn và không dùng để bypass narrative lint.

## Regression đã triển khai

`tools/verify_log_narrative.js` kiểm tra cả producer message chứa các token kỹ thuật mới. `tools/verify_log_producers.js` và `tools/verify_expansion_log_matrix.js` tiếp tục kiểm tra toàn bộ producer thực tế sau boundary render.

## Trạng thái

Đã code và đã pass smoke test/log producer/expansion narrative matrix. Gate UI trực quan vẫn phụ thuộc môi trường trình duyệt; không thay đổi contract runtime vì gate này.

## Phần chưa hoàn thiện

- Chưa có browser automation ổn định để chụp và xác nhận pixel-level của panel nhật ký trên Chrome local; cần chạy lại khi browser policy cho phép.
- Các chuỗi mojibake tồn tại trong một số fixture/nguồn cũ là vấn đề encoding riêng, không được coi là token kỹ thuật của boundary này.
