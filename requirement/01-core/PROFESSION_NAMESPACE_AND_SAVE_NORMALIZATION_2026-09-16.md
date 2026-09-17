# PROFESSION NAMESPACE + SAVE NORMALIZATION 2026-09-16

## Canonical fields

- Nghề chính: `state.professionState.primaryId`.
- Nghề Ẩn/nghề phụ: `state.professionState.secondaryId`.
- Danh sách unlock history: `state.professionState.hiddenIds`.
- Candidate cũ chỉ là compatibility metadata, không phải nghề đang hoạt động.
- `state.player.hiddenProfession` chỉ là projection tương thích; runtime đọc slot canonical.

## Lock rule

Chọn Nghề chính thành công đặt `selectionLocked = true` ngay trong cùng transaction. Sau đó mọi profession thường bị từ chối; chỉ definition nằm trong hidden profession registry và đã unlock bằng Cổ Tịch mới được chọn vào `secondaryId`.

## Normalization

1. Nếu `secondaryId` thiếu nhưng `player.hiddenProfession` hợp lệ và đã unlock, copy vào secondary.
2. Nếu `player.hiddenProfession` trùng nghề chính nhưng không có hidden unlock, xóa projection sai và giữ primary.
3. Nếu có nhiều hidden IDs active, giữ `secondaryId`, chuyển phần còn lại thành history.
4. Không migrate path ID sang profession ID.
5. Không cần bảo toàn rule cũ cho phép đổi nghề thường; rule canonical mới thắng.
