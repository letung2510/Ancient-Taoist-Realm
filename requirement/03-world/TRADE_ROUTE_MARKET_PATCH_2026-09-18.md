# Bản vá Tuyến thương mại / Phường thị — 2026-09-18

## Luật tuyến

- Hai đầu tuyến phải là node tồn tại và không được trùng nhau.
- Không tạo hai tuyến active cùng chiều giữa cùng một cặp node.
- Caravan chỉ chạy khi route active; nếu mất tọa độ đầu/cuối, route chuyển `closed` thay vì sinh vị trí giả.
- `progress` luôn nằm trong khoảng hợp lệ của `distance`.

## Kiểm định

`validateTradeRouteState` kiểm tra identity, node, trạng thái, khoảng tiến độ, ngày tạo và duplicate route. Test bao phủ tạo tuyến, chặn duplicate, cập nhật caravan và validate sau tick.
