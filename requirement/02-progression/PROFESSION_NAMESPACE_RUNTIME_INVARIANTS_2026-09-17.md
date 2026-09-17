# Namespace Nghề chính / Nghề Ẩn — Runtime Invariants

## Canonical state

- `professionState.primaryId`: đúng một Nghề chính thường hoặc null.
- `professionState.secondaryId`: Nghề Ẩn duy nhất hoặc null; không được chứa nghề thường.
- `professionState.hiddenIds`: danh sách các Nghề Ẩn đã mở/đã biết, chỉ chứa ID có trong catalog Nghề Ẩn.
- `player.hiddenProfession`: alias tương thích đọc/hiển thị, luôn phải bằng `secondaryId` sau `ensureExpansionState`.
- `selectionLocked`: bằng `Boolean(primaryId)`. Sau khi commit Nghề chính, mọi nghề thường khác đều bị chặn vĩnh viễn trong flow hiện tại.

## Migration boundary

Save cũ có thể ghi hidden profession ở `player.hiddenProfession`, `hiddenId` hoặc nhầm vào `primaryId`. Normalizer chuyển ID Nghề Ẩn về `secondaryId`, dọn primary nếu đó là ID ẩn, rồi đồng bộ alias. Không khôi phục lựa chọn nghề thường cũ sau khi luật canonical đã khóa.

## Runtime acceptance

- Chọn Nghề chính lần đầu tạo record và khóa slot nghề thường ngay.
- Chỉ Nghề Ẩn đã có Cổ Tịch/manh mối và hoàn tất unlock graph mới được ghi `secondaryId`.
- Không có hai slot trùng ID, không có secondary là nghề thường, không có alias drift.
- `validateProfessionNamespace()` và `validateExpansionState()` phải báo lỗi khi save vi phạm các invariant.

## Chưa hoàn thiện

Visual QA của màn hình nghề trên browser thật vẫn cần xác nhận; runtime state, migration và action boundary đã có regression.
