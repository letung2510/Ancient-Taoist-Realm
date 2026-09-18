# Map Exit Repair Patch — 2026-09-18

## Mục tiêu

Đảm bảo các lối đi tham chiếu tới node không tồn tại không tiếp tục xuất hiện trong runtime map.

## Quy tắc runtime

- `repairInvalidMapExits(state)` ghi nhận exit lỗi vào `mapState.invalidExits` để audit.
- Static catalog `GameData.LOCATIONS[nodeId].exits` không bị mutate trong runtime repair.
- Nếu có bản sao runtime trong `state.openWorld.exits`, bản sao trỏ tới cùng target lỗi bị xóa.
- Nhật ký audit được giới hạn 200 bản ghi gần nhất.
- Không tự tạo node thay thế và không tự nối sang khu vực khác; việc sửa topology phải đi qua catalog map canonical.

## Hồi quy

`tools/verify_game.js` chèn tạm một target không tồn tại, chạy repair, xác nhận static catalog giữ nguyên, runtime exit bị loại và audit vẫn lưu lại bằng chứng.
