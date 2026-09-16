# Review tên Con Đường và Nghề Ẩn — 2026-09-16

## Phạm vi

Review trước khi code theo yêu cầu Task 8: kiểm tra nguy cơ lẫn tên giữa path và profession.

## Kết quả rà soát

- Nghề chính dùng các id như `luyen_dan`, `luyen_khi`, `tran_phap`, `tuong_su`; dữ liệu nghề nằm trong `professionDefinitions`.
- Nghề Ẩn nằm trong `hiddenProfessions`, được mở theo các mảnh Cổ Tịch Tà Thần và đi vào slot phụ.
- Con Đường dùng namespace path, ví dụ `dan_dao`, `kiem_dao`, `phong_thuy_dao`, `tinh_tuong_dao`; path có level/compatibility/tiến triển riêng.
- Có rủi ro UX vì mô tả cũ gọi nghề ẩn là “con đường nghề ẩn”, và một số path có hậu tố `*_dao`. Đây là rủi ro nhãn, không phải collision id trực tiếp.

## Quyết định trước khi code

1. Không đổi id save hiện có và không đổi tên path hàng loạt; đổi tên sẽ phá relation, save và dữ liệu legacy.
2. Giữ hai namespace/API: resolver cho Con Đường Ẩn và `professionAvailability()/chooseProfessionLocked()` cho Nghề Ẩn.
3. UI luôn thêm tiền tố rõ ràng: `Con Đường: ...`, `Nghề chính: ...`, `Nghề ẩn: ...`. Không dùng nhãn “Con đường nghề ẩn”.
4. Nếu sau này xuất hiện cùng display name, bắt buộc hiển thị loại đối tượng và id ổn định trong tooltip/debug; không đổi tên tùy tiện.

## Kết luận

Chưa cần đổi tên Con Đường hiện hữu. Cần sửa terminology, namespace resolver, slot rule và UI label; đây là phương án tương thích save và giảm rủi ro logic.
