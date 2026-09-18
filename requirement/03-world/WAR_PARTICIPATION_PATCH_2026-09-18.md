# Bản vá chiến trận / tổ chức — 2026-09-18

## Luật tham gia

- Người chơi phải thuộc một trong hai phe của chiến tranh.
- Nếu chiến tranh có `frontNodeIds`, người chơi phải đứng tại chiến tuyến.
- Mỗi người chỉ can thiệp một lần trong một ngày cho mỗi chiến tranh.
- Phần thưởng can thiệp dùng reward ledger với khóa theo chiến tranh/ngày/phe.

## Kết thúc chiến tranh

Kết cục chỉ cascade một lần, cập nhật ổn định/tài nguyên/ảnh hưởng node và ghi log novel khi phe của người chơi liên quan.

## Kiểm định

`validateWarState` tiếp tục kiểm tra phe, điểm, trạng thái và intervention ledger; regression test kiểm tra người ngoài phe, can thiệp hợp lệ và duplicate cùng ngày.
