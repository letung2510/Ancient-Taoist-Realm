# Auction Refresh Settlement Patch — 2026-09-18

## Lỗi đã sửa

World tick làm mới phiên đấu giá trước khi chốt các lô cũ. Lô người chơi đang thắng có thể bị xóa khỏi `state.auction.lots` mà chưa phát thưởng.

## Quy tắc mới

`refreshAuction(state, day)` phải gọi settlement cho các lô hết hạn trước khi thay thế catalog lô mới. Reward ledger vẫn giữ idempotency nên gọi lại không phát thưởng lần hai.

## Hồi quy

Test tạo lô, đặt giá thắng, làm mới phiên sau hạn lô và xác nhận vật phẩm được nhận trước khi lô cũ bị thay thế.
