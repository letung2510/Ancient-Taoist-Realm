# Bản vá Công trình / Công trình Tông môn — 2026-09-18

## Công trình bản đồ

- Chỉ chủ công trình hoặc thành viên thế lực sở hữu được sửa chữa/tạm dừng.
- Vòng đời hợp lệ: `active` → `disabled`/`damaged` → `active`, hoặc `dismantled`.
- Nâng cấp và tháo dỡ vẫn tuân thủ quyền sở hữu, đồng thời vô hiệu hóa cache ảnh hưởng node.

## Công trình tông môn

- Mã bản thiết kế không hợp lệ bị từ chối, không tự rơi về bản thiết kế đầu tiên.
- Đóng góp được chuẩn hóa thành số nguyên 1–10 Linh Thạch.
- Hoàn thành ghi `completedDay`, giữ thời hạn phần thưởng và log novel.

## Kiểm định

`validateGuildProjectState` kiểm tra template, identity, trạng thái, lịch, tiến độ và contributions; test bao phủ toàn bộ vòng đời công trình cùng chu kỳ dự án tông môn.
