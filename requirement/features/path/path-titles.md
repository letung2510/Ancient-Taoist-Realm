# Path — Danh xưng cảnh giới theo Con Đường

## Mục đích

Tên hiển thị của 14 cấp tu vi theo từng Con Đường, quy tắc fallback cho Ngoại Đạo Giả, Nghịch Hành và nhân vật chưa chọn đường.

## Dữ liệu & trạng thái

`data/path_fate_relations.json:path_titles[pathId]` — mảng đúng 14 phần tử (index 0 = cấp 1). Đọc qua `pathTitle(state)`.

## Rules

### PATH-TTL-001 Danh xưng theo đường
Từ cấp 2, danh xưng lấy `path_titles[pathId][cấp − 1]`; cấp 1 luôn là Di Mệnh Cảnh. Mỗi đường có hệ danh xưng riêng theo bản chất quyền năng, không ghép máy móc tên cấp chung.

| Cấp | `kiem_dao` | `dan_dao` | `phu_dao` | `phong_thuy_dao` | `ngu_thu_dao` |
|---:|---|---|---|---|---|
| 2 | Mầm Gươm Thức Tỉnh | Linh Hỏa Nhập Lô | Linh Văn Sơ Hiện | Tầm Long Khởi Bộ | Linh Thú Kết Duyên |
| 3 | Thai Kiếm Tàng Phong | Dược Thai Kết Châu | Phù Thai Kết Chú | Huyệt Nhãn Sinh Căn | Huyết Khế Đồng Sinh |
| 4 | Kiếm Tâm Đúc Ấn | Sinh Đan Huyền Chủ | Cửu Ấn Minh Sư | Sơn Hà Trấn Ấn | Bách Thú Hiệu Lệnh |
| 5 | Vạn Nhận Hóa Linh | Bách Thảo Hóa Hồn | Hộ Phách Phù Linh | Địa Linh Hiển Tướng | Hoang Linh Hóa Tướng |
| 6 | Tàng Kiếm Vực Chủ | Vạn Dược Tôn Sư | Vạn Pháp Chú Vực | Long Mạch Chưởng Sư | Vạn Linh Ngự Chủ |
| 7 | Hư Không Trảm Bộ | Đan Hải Du Tiên | Hư Không Hành Văn | Hư Địa Du Long | Dị Giới Thú Hành |
| 8 | Nhất Kiếm Thành Luật | Sinh Tử Đồng Luyện | Nhất Ngôn Thành Luật | Càn Khôn Chuyển Mạch | Tổ Huyết Quy Nhất |
| 9 | Cửu Kiếp Phá Thiên | Cửu Lô Độ Ách | Lôi Kiếp Thiên Thư | Vạn Sơn Địa Kiếp | Hoang Cổ Thú Kiếp |
| 10 | Nhân Quả Kiếm Quân | Tạo Hóa Đan Vương | Mệnh Phù Tôn Giả | Sơn Hà Định Chủ | Vạn Loài Cộng Chủ |
| 11 | Ngoại Vực Kiếm Thánh | Vực Ngoại Dược Thánh | Ngoại Thiên Chân Lục | Thiên Ngoại Địa Tiên | Thiên Ngoại Thú Hoàng |
| 12 | Bất Diệt Kiếm Cốt | Bất Hủ Linh Dược | Bất Hủy Kim Văn | Bất Động Long Cốt | Bất Tử Tổ Huyết |
| 13 | Thái Ất Trảm Mệnh | Thái Ất Hồi Sinh | Thái Ất Sắc Mệnh | Thái Ất Định Thế | Thái Ất Linh Vương |
| 14 | Vô Thượng Kiếm Tổ | Vạn Sinh Đan Tổ | Vô Cực Phù Tổ | Đại Địa Đạo Tôn | Vạn Thú Nguyên Tổ |

| Cấp | `khoi_loi_dao` | `am_luat_dao` | `mong_canh_dao` | `luyen_the_dao` | `tinh_tuong_dao` |
|---:|---|---|---|---|---|
| 2 | Cơ Tâm Khởi Động | Nhất Âm Khai Hồn | Mộng Nhãn Sơ Khai | Khí Huyết Khai Môn | Tinh Nhãn Quan Thiên |
| 3 | Linh Mộc Thành Khu | U Khúc Dưỡng Phách | Tâm Ảnh Kết Thai | Thiết Cốt Dựng Thân | Thiên Bàn Định Vị |
| 4 | Thiên Cơ Tạo Ấn | Minh Thanh Trấn Ấn | Nguyệt Mộng Chân Nhân | Kim Cương Tạo Thể | Nhật Nguyệt Chiêm Quan |
| 5 | Khôi Hồn Tự Thức | Vong Ca Dẫn Linh | Thiên Mộng Hóa Linh | Bất Khuất Chiến Hồn | Tinh Hồn Giáng Thế |
| 6 | Vạn Cơ Điều Ngự | U Minh Nhạc Tướng | Mộng Hải Dệt Sư | Ma Khu Trấn Thế | Bắc Đẩu Mệnh Sư |
| 7 | Hư Vực Cơ Hành | Hư Âm Độ Giới | Vô Gian Du Mộng | Phá Giới Võ Thân | Tinh Hải Viễn Du |
| 8 | Cơ Luật Đồng Quy | Vạn Thanh Quy Luật | Chân Huyễn Đồng Quy | Huyết Cốt Đồng Nguyên | Chư Thiên Định Quỹ |
| 9 | Khôi Thành Độ Kiếp | Thiên Khúc Hồn Kiếp | Vạn Mộng Tâm Kiếp | Bách Luyện Thần Kiếp | Tinh Lạc Đại Kiếp |
| 10 | Thiên Cơ Chúa Tể | U Minh Nhạc Đế | Mộng Giới Quân Vương | Cực Đạo Võ Tôn | Thiên Mệnh Tinh Quân |
| 11 | Ngoại Vực Cơ Thần | Ngoại Vực Âm Thánh | Ngoại Cảnh Chân Mộng | Ngoại Thiên Chiến Thánh | Vực Ngoại Quan Tinh |
| 12 | Bất Hoại Khôi Thân | Bất Diệt Hồn Ca | Bất Tỉnh Mộng Thân | Vạn Kiếp Bất Hoại | Bất Diệt Tinh Thể |
| 13 | Thái Ất Cơ Mệnh | Thái Ất Tịch Thanh | Thái Ất Huyễn Mệnh | Thái Ất Huyết Tôn | Thái Ất Toán Chủ |
| 14 | Vô Tận Khôi Tổ | Vô Thanh Nhạc Tổ | Vĩnh Dạ Mộng Tổ | Hỗn Nguyên Thể Tổ | Tinh Hải Đạo Tổ |

### PATH-TTL-002 Ngoại Đạo Giả
Giữ tên cảnh giới mặc định ở mọi cấp: Di Mệnh, Khai Lộ, Dựng Thai, Kim Ấn, Anh Linh, Thần Tính, Hư Giới, Hợp Đạo, Thiên Kiếp, Chủ Tể, Chân Ngoại, Kim Bất Hoại, Thái Ất, Đạo Ngoại (+ "Cảnh").

### PATH-TTL-003 Nghịch Hành
Danh xưng mặc định `[tên Nghịch Hành] · [tên cảnh giới mặc định]`; chỉ dùng bảng riêng khi dữ liệu biến thể khai báo đủ 14 tên.

### PATH-TTL-004 Chưa chọn đường
Cấp 2 chưa có đường: "Khai Lộ Cảnh · Chờ Chọn Con Đường"; cấp ≥ 3 không có đường hoặc thiếu dữ liệu: "Đạo Lộ Chưa Định".

## Acceptance

- Mỗi `pathId` có đúng 14 danh xưng; `validatePathFusionCatalog` báo lỗi khi thiếu.
- Gate: `node tools/verify_dichi_deep.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PATH-TTL-001 | `js/engine.js:pathTitle`, `data/path_fate_relations.json:path_titles` | Khớp |
| PATH-TTL-002 | `data/path_fate_relations.json:path_titles.ngoai_dao_gia` | Khớp |
| PATH-TTL-003 | — | Thiếu |
| PATH-TTL-004 | `js/engine.js:pathTitle` | Khớp |
