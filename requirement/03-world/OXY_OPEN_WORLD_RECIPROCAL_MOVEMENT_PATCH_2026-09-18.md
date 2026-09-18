# Bản vá Oxy Open World / Di chuyển bốn hướng — 2026-09-18

- `validateOpenWorldGrid` được gọi trong validator thế giới tổng hợp.
- Regression tạo probe độc lập và kiểm tra đủ Bắc/Nam/Đông/Tây đều sinh/đi tới node Oxy kế cận.
- Sau mỗi lần đi, topology vẫn phải hợp lệ và không tạo tọa độ trùng.
