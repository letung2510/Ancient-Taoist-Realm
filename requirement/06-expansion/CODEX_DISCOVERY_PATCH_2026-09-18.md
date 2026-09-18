# Bản vá Cổ Tịch / Discovery — 2026-09-18

## Luật tiến trình

- Codex đi theo thứ tự `investigate` → `read` → `decrypt` → `collect`.
- Không thu thập lại Codex đã thu thập.
- Node manh mối nghề ẩn phải tồn tại trong graph đúng nghề; mã node lạ bị từ chối.
- Discovery lifecycle không được lùi trạng thái và reward không lặp.

## Kiểm định

Regression test bao phủ chuỗi Codex đầy đủ, thao tác collect lần hai và `validateDiscoveryLifecycle`.
