# System-wide Validator Wiring Patch — 2026-09-18

## Phát hiện

`validateOrganizationState` đã có implementation nhưng chưa được gọi bởi `validateExpansionState`. Save có relation tổ chức không hợp lệ vì vậy vẫn có thể vượt qua full runtime audit.

## Thay đổi

- `validateExpansionState` gọi `validateOrganizationState` cùng nhóm map, trade route, auction và contract.
- Lỗi được namespace thành `organizations:*` để UI/log diagnostic phân biệt được nguồn.
- Không thay đổi gameplay path; chỉ bổ sung cổng phát hiện dữ liệu hỏng.

## Hồi quy

`tools/verify_game.js` chèn relation tổ chức giả, xác nhận full audit thất bại, xóa relation và xác nhận state hợp lệ trở lại.
