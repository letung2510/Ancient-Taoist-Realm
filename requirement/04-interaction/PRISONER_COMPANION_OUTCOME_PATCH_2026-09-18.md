# Bản vá Tù binh / Dị thú — 2026-09-18

## Luật trạng thái

- Thẩm vấn chỉ nhận `persuade`, `threaten` hoặc `dark`.
- Tù binh chỉ được xử lý một lần bằng `released`, `turned_in`, `executed` hoặc `tamed`.
- Reward xử lý tù binh tiếp tục đi qua reward ledger.
- Thuần hóa ghi `tamedDay`; companion không tạo lại nếu tù binh đã rời trạng thái `held`.

## Kiểm định

`validatePrisonerState` kiểm tra identity, status, nguồn bắt, hạn xử lý và resistance. Regression test kiểm tra method/outcome sai, xử lý hợp lệ và chống xử lý lần hai.
