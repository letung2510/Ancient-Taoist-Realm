# Logic Review Report — 2026-09-21

## Phạm vi

Rà soát white-box runtime, state machine hành trình mở đầu, tổ chức theo vùng, save/load migration, UI action contract, validator và các regression tool. Không push hoặc commit Git trong đợt này.

## Đã sửa

1. Siết `organizationKind()` để Quy Tông chỉ nhận tổ chức có marker Thế Gia/gia tộc/vương triều/phù gia. Các nhãn chung như Tộc/Bộ không còn đủ điều kiện vì có thể là bộ lạc, liên minh hoặc chủng tộc.
2. Sửa `deserialize()` để khôi phục `pendingGuildChoice` khi save cũ còn target tổ chức hợp lệ ở Khai Lộ nhưng thiếu cờ boolean.
3. Đồng bộ regression matcher với luật phân loại mới.
4. Các sửa trước trong cùng đợt được giữ và kiểm tra lại: UI truyền full state cho journey options; journey refusal và stage-2 persistence không bị legacy `originLocked` chặn; fixture/coverage manifest dùng canonical requirement path.

## Requirement đã cập nhật

- `features/03-progression/CON_DUONG_CANONICAL.md`: target hành trình, phân loại Thế Gia và migration stage 2.
- `features/07-ui/UI_ACTION_LOG_CANONICAL.md`: UI dùng engine option contract đầy đủ.
- `features/08-platform/DATA_RUNTIME_CANONICAL.md`: invariant khôi phục `pendingGuildChoice`.
- Audit tổng hợp phải tiếp tục ghi tại `AUDIT_CANONICAL.md` duy nhất.

## Kiểm chứng

- `node tools/verify_opening_intent.js`
- `node tools/verify_game.js`
- `node tools/verify_review_batches.js`
- `node tools/verify_dichi_deep.js`

Các kiểm tra trên đều PASS. Sẽ tiếp tục chạy syntax, requirement validator và các regression batch còn lại trước khi bàn giao.

## Cần xác nhận thêm

- Legacy `chooseOrigin()` và các field tương thích vẫn tồn tại để đọc save cũ; chưa xóa vì có rủi ro phá save.
- Các backlog được canonical ghi rõ là chưa có transaction/runtime/test tương ứng vẫn chưa được tự ý triển khai nếu thiếu acceptance contract cụ thể.
## Kết quả kiểm tra mở rộng

Syntax `engine.js`, `main.js`, `ui.js`, requirement validator, coverage 33/33, narrative/log, companion, catalog, archive, random-boundary, asset, stress và runtime-budget checks đều PASS.
