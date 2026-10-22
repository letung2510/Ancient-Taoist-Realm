# Prompt tiếp tục phiên audit RPG Game

Bạn đang tiếp tục công việc từ phiên `01a0cb6f-2702-7573-bc46-41f841469ad3` trong workspace `C:\Users\Admin\Downloads\RPG Game`.

## Mục tiêu bất biến

Hoàn thiện toàn bộ các nhóm còn mở trong `requirement/CODE_REQUIREMENT_AUDIT_MASTER.md`. Logic phải dùng canonical producer/catalog, không tạo bản sao của logic cũ, không gây side effect ngoài contract, và phải có behavior-first test hoặc browser/UI evidence tương ứng. Chỉ ghi `DA SUA` khi toàn bộ yêu cầu của mục và test liên quan đã pass. Nếu còn thiếu browser evidence, file chooser, responsive variant, hoặc behavior chưa được chứng minh thì giữ `SỬA MỘT PHẦN`, `CHƯA XÁC MINH`, hoặc status phù hợp.

## Quy trình bắt buộc mỗi lần tiếp tục

1. Đọc phần status override mới nhất trong `CODE_REQUIREMENT_AUDIT_MASTER.md`; status override mới hơn có quyền giải thích/ghi đè các bảng lịch sử, nhưng không được xóa lịch sử.
2. Kiểm tra `git status --short`, diff hiện tại và không revert thay đổi của người dùng.
3. Tìm logic canonical trước khi viết mới: `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`, các catalog trong `data/`, và boundary `webgame/`.
4. Với từng nhóm audit, xác định đủ bốn phần: invariant/requirement, canonical producer, mutation/rollback boundary, test evidence.
5. Nếu requirement thiếu hoặc mâu thuẫn, thiết kế contract nhỏ nhất, đặt ở canonical layer, ghi rõ trong audit, rồi thêm test độc lập. Không vá bằng assertion chỉ kiểm tra trạng thái tĩnh.
6. Browser/UI phải kiểm tra action surface, modal lifecycle, persistence, refresh/offline parity và responsive state khi có thể. Không đánh dấu pass cho file import roundtrip nếu connector/browser không cho `filechooser.setFiles`.
7. Chạy focused probe sau mỗi cụm; cuối đợt chạy `node tools/run_regression_suite.js`, `node validate_requirement_docs.js` nếu cần và `git diff --check`.
8. Chỉ sau khi evidence pass mới append một `Status override - YYYY-MM-DD ...` vào audit, nêu rõ file/test/evidence. Không sửa số PASS tổng hợp để che phần còn mở.
9. Commit các thay đổi liên quan với message mô tả đúng phạm vi; kiểm tra `git status` sau commit và push branch hiện tại.

## Trạng thái tại điểm bàn giao

- Full regression gần nhất: `OK: 42 regression checks passed`.
- `index.html` đã được cập nhật cache-busting sang `review-v8` cho `expansion_data.js`, `engine.js`, `expansion.js`, `ui.js`, `main.js`.
- Các probe mới và canonical runtime/UI đã nằm trong worktree; phải preserve, không reset.
- Audit vẫn chưa được phép tuyên bố hoàn tất 100%. Các aggregate/browser còn mở phải tiếp tục xác minh, đặc biệt các nhóm M41-M49, M51-M54, M65-M78, N3-N22, N33-N54, N122-N140, B.11, C/D aggregate và các mục còn `SỬA MỘT PHẦN` trong override mới nhất.
- Browser file chooser đã mở được nhưng `chooser.setFiles(...)` bị môi trường trả `Not allowed`; đây là blocker evidence thật, không được giả lập pass.
- Khi đóng một mục, cập nhật cả test/probe và audit status; nếu chỉ đóng sub-item thì không tự động đóng aggregate.

## Lệnh kiểm tra chuẩn

```powershell
node tools/run_regression_suite.js
git diff --check
git status --short
```

## Tiêu chí kết thúc

Chỉ kết thúc khi mọi nhóm audit đã có contract canonical, producer mapping, test evidence đầy đủ và browser/UI evidence cần thiết. Nếu còn blocker môi trường hoặc nhóm chưa đủ evidence, báo cáo rõ nhóm, nguyên nhân, test đã pass và status vẫn mở; không ghi `PASS 100%`.
