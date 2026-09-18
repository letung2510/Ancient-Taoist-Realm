# Bản vá Khế ước / Phường thị — 2026-09-18

## Quy tắc trạng thái

- Lời mời chỉ nằm trong `offers` với trạng thái `offered`.
- Khi nhận, lời mời được chuyển nguyên vẹn sang `accepted`, không tồn tại đồng thời ở hai bucket.
- Hợp đồng chỉ kết thúc một lần ở `completed` hoặc `expired`; phần thưởng đi qua reward ledger.
- Hết hạn được xử lý trong tick thế giới và ghi thành một đoạn novel riêng.

## Kiểm định

`validateContractBoardState` kiểm tra identity, bucket, trạng thái, lịch hiệu lực và danh sách outcome. `validateExpansionState` gọi validator này cùng các validator thế giới khác.
