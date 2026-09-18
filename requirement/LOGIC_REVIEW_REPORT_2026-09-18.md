# Báo cáo rà soát code tự động — 2026-09-18

## Phạm vi

Đã đọc `prompt-review-code-tu-dong.md` và rà soát ưu tiên các phần runtime, state machine, save/load, UI và test vừa thay đổi gần đây.

## Đã sửa

1. **Journey intent / UI option scope** — UI truyền cả `state` vào `journeyIntentOptions()`, tránh hiển thị `Quy Tông` khi region hiện tại không có Thế Gia hợp lệ — `js/ui.js`.
2. **Migration stage 2** — save/load không còn xóa nhầm `pendingGuildChoice` của flow mới chỉ vì `originLocked=true`; chỉ state Origin legacy mới dùng nhánh chuẩn hóa cũ — `js/engine.js`.
3. **Từ chối lời mời tổ chức** — flow journey mới không bị chặn bởi guard của Origin legacy; khi từ chối, state ghi `journey:<intent>:declined`, giữ nguyên journey intent và không mở lại Origin — `js/engine.js`.
4. **Tự Lập** — có opening resolver riêng, năm cảnh Tán Tu, không có organization target.
5. **Tầm Sư / Quy Tông** — chỉ chọn đúng organization kind trong region; không fallback sang faction không hợp lệ.
6. **Background gate** — `Tông Môn` chỉ có `Tầm Sư` và `Tự Lập`; `Hắc Đạo`/`Vô Danh` dùng `Ẩn Thế`; so sánh đã normalize encoding.
7. **Pinned Linh Khí** — UI dùng `qi/maxQi`, đồng bộ với runtime state.
8. **Failed pre-game action** — action journey thất bại không tăng turn hoặc ghi command echo.

## Test đã chạy

- `node tools/verify_opening_intent.js`
- `node tools/verify_expansion_stress.js`
- `node tools/verify_ui_surface_contract.js`
- `node tools/verify_log_narrative.js`
- `node --check js/engine.js`
- `node --check js/main.js`
- `node --check js/ui.js`
- `node validate_requirement_docs.js`
- UTF-8/mojibake scan: 0 file cần sửa, 0 marker phát hiện.

Test opening intent đã phủ sáu region, các intent, năm opening scene Tán Tu, target organization, option theo Background, persistence, quest/history isolation, failed-action clock safety và stage-2 invitation save/load.

## Cần xác nhận thêm

1. Một số nội dung narrative lịch sử trong runtime/archive có nguồn cũ đã bị hỏng encoding; không tự ý sửa hàng loạt vì có thể làm thay đổi dữ liệu lịch sử ngoài phạm vi logic.
2. Một số fixture cũ trong `verify_game.js` vẫn mô phỏng Origin legacy; chúng cần được tái tổ chức thêm nếu muốn toàn bộ regression suite dùng hoàn toàn journey state machine mới.

## Requirement đã cập nhật

- `SYSTEM_LOGIC_CATALOG/features/03-progression/PROGRESSION_CANONICAL.md`
- `SYSTEM_LOGIC_CATALOG/features/07-ui/UI_ACTION_LOG_CANONICAL.md`
- `SYSTEM_LOGIC_CATALOG/features/08-platform/DATA_RUNTIME_CANONICAL.md`
- `AUDIT_CANONICAL.md`
