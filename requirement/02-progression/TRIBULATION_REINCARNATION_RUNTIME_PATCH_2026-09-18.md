# Bản vá Độ kiếp / Luân hồi / Di sản — 2026-09-18

## Luật một lần

- Một pending tribulation chỉ nhận một lựa chọn; trạng thái `resolved` không thể chọn lại.
- Snapshot tiền kiếp được khóa bằng `lastSnapshotKey`, không nhân đôi khi cùng lượt gọi lại.
- Di sản và mộ phần giữ identity riêng; reward bái tế đi qua reward ledger.

## Kiểm định

`validateReincarnationRuntimeState` kiểm tra generation, previous lives, tombs, pending choices và pending tribulation. Test bao phủ chọn độ kiếp một lần, snapshot luân hồi idempotent và serialize runtime.
