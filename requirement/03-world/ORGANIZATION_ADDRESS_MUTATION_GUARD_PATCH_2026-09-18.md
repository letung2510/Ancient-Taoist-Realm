# Organization Address Mutation Guard — 2026-09-18

## Quy tắc

- `status` của tổ chức vẫn có thể đọc khi không ở node tổ chức.
- Mọi mutation quan hệ/tổ chức phải có address với `nodeId` hợp lệ và nhân vật phải đứng tại node đó.
- Thiếu address là lỗi catalog, được `validateOrganizationState` báo bằng `missing-address`.
- Mutation bị từ chối trước khi trừ vật phẩm hoặc thay đổi quan hệ.

## Hồi quy

`tools/verify_game.js` tạm bỏ address của một tổ chức, thử donate và xác nhận mutation thất bại, inventory không đổi, sau đó khôi phục catalog.
