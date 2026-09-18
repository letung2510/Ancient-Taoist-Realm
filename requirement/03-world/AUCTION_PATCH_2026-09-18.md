# Bản vá Đấu giá — 2026-09-18

## Phạm vi

- Mỗi lô có lịch mở/đóng, vật phẩm, giá sàn, giá hiện tại và người đang giữ giá.
- Khi người chơi bị NPC vượt giá, khoản đặt trước hiện tại được hoàn lại đúng một lần.
- Khi lô đóng, phần thưởng chỉ phát một lần qua reward ledger.
- Lô mới trong cùng một phiên không lặp vật phẩm nếu kho dữ liệu có đủ lựa chọn.

## UX và nhật ký

Các thao tác đặt giá, bị vượt giá và thắng đấu giá dùng log `narr` theo văn phong novel, tách thành từng sự kiện; không để lộ tên hàm runtime trong giao diện.

## Kiểm định

`validateAuctionState` kiểm tra identity, trạng thái, vật phẩm, lịch, giá và người giữ giá. `validateExpansionState` gọi validator này để phát hiện save hỏng ngay trong vòng kiểm tra tổng hợp.
