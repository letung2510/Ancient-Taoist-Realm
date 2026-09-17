# Browser QA Status — 2026-09-17

## Evidence

- Local static HTTP server trả `index.html: 200`.
- Asset `assets/ui/map-illustration.webp` trả `200` và có payload 167192 bytes.
- Chrome automation mở `http://127.0.0.1:4173/index.html` bị môi trường chặn với `net::ERR_BLOCKED_BY_CLIENT` trước khi page được load.
- Thử lại qua `http://localhost:4173` và địa chỉ LAN `http://10.102.128.22:4174` cũng nhận cùng lỗi `net::ERR_BLOCKED_BY_CLIENT`.

## Kết luận

Asset/path integrity và headless render đã pass; pixel/responsive/browser interaction local chưa được tuyên bố pass vì Chrome bị chặn ở network boundary. Đây là giới hạn môi trường QA, không phải bằng chứng page runtime lỗi.
