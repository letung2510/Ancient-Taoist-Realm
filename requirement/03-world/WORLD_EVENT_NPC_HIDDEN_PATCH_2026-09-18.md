# Bản vá Sự kiện thế giới / NPC ẩn — 2026-09-18

## Kiểm tra logic

- Một vùng chỉ có một biến cố đang hoạt động.
- Mỗi mẫu biến cố tuân thủ `cooldownDays`, kể cả sau khi biến cố cũ đã kết thúc.
- Người chơi chỉ được chọn ứng biến khi đang ở đúng vùng xảy ra biến cố.
- Kết thúc biến cố ghi `resolvedDay`, giải phóng `activeEventId` và cố định kết cục.

## Runtime state

`validateWorldEventState` kiểm tra identity, mẫu dữ liệu, vùng, trạng thái, timeline, phase, lịch sử lựa chọn và liên kết ngược giữa vùng với biến cố đang hoạt động.

## Nhật ký

Điềm báo, lựa chọn ứng biến và kết cục dùng log `narr`/`warn` theo từng đoạn novel; không đưa tên hàm xử lý ra giao diện.
