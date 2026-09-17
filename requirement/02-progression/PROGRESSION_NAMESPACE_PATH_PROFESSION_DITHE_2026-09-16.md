# Namespace Con Đường — Nghề — Dị Thể — 2026-09-16

Ba hệ thống là ba namespace độc lập:

| Namespace | State canonical | Ý nghĩa |
|---|---|---|
| Con Đường | `pathState.primaryPathId`, `secondaryPathId`, `hiddenPathId` | hướng tu luyện, nghi thức đột phá và tương hợp Mệnh |
| Nghề | `professionState.primaryId`, `secondaryId`, `hiddenIds` | nghề chính và nghề phụ; chọn nghề chính khóa nghề thường ngay |
| Dị Thể | `specialPhysiqueState.activeId`, `candidates`, `progress` | biến đổi thân thể/modifier, không tự khóa path hoặc profession |

Không dùng `pathId` để lookup nghề, không dùng `hiddenProfession` để kết luận Con Đường, và không dùng `specialPhysique` để tự ghi đè hai hệ thống kia. Song tu/dung hợp Con Đường chỉ được phép qua transition resolver explicit; hiện runtime chỉ lưu namespace dự phòng, không tự bật secondary path.

`GameExpansion.progressionNamespaceSnapshot(state)` là DTO review/UI canonical. Policy baseline:

- Chọn Nghề chính xong khóa nghề thường.
- Cổ Tịch Tà Thần chỉ mở Nghề Ẩn ở slot phụ; nếu chưa có Nghề chính thì Nghề Ẩn
  không được chọn trước. Ngay khi Nghề chính được commit, toàn bộ nghề thường
  khác bị khóa vĩnh viễn; chỉ một Nghề Ẩn hợp lệ từ Cổ Tịch mới có thể điền slot
  phụ. Không có đường tắt qua alias `hiddenProfession` hoặc save cũ.
- Dị Thể chỉ cung cấp modifier/branch và không khóa path/profession mặc định.

Trạng thái: **ĐÃ CODE baseline**, còn thiếu nội dung/điều kiện sản phẩm cho song tu thực sự và các ending Dị Thể nâng cao.
