# Project rules

## Phạm vi thay đổi

- **`index.offline.html` chỉ sửa/rebuild khi người dùng yêu cầu rõ ràng.** Không tự chạy `tools/build_offline_bundle.ps1`, không sửa tay. `tools/run_regression_suite.js` mặc định bỏ qua `verify_offline_bundle`; chỉ thêm `--with-offline-bundle` sau khi rebuild theo yêu cầu.
- Không revert thay đổi chưa commit của người dùng. Không refactor ngoài phạm vi yêu cầu.
- Refactor phải giữ nguyên hành vi (trừ khi sửa bug side effect đã ghi trong `requirement/STATUS.md`); chạy full regression trước và sau.

## Tài liệu requirement

- Cấu trúc và mẫu: [requirement/CONVENTIONS.md](../../requirement/CONVENTIONS.md). Mỗi feature một thư mục `requirement/features/<feature>/` gồm `README.md` (chỉ mục) và file theo chức năng.
- Trạng thái hiện hành duy nhất: `requirement/STATUS.md`. Lịch sử: `requirement/audit/` (chỉ đọc).
- Đổi hành vi runtime ⇒ cập nhật file chức năng tương ứng (rule + Runtime mapping) trong cùng lượt.
- Tra cứu: grep `requirement/features` theo rule ID; grep `requirement/INDEX.md` theo từ khóa → đọc đúng khoảng dòng. Sau khi sửa requirement: `node tools/build_requirement_index.js`.

## Đọc file lớn

- Không đọc nguyên `js/engine.js`, `js/expansion.js`, `js/ui.js`, `data/fate_data.js`, `data/fate_relationships.js`, `data/world_data.js`, `requirement/audit/*`; grep symbol rồi đọc theo khoảng dòng. Không đọc `index.offline.html`.
- Symbol runtime: `requirement/overview/runtime-symbol-index.md`.

## Encoding

- Mọi `.md`/`.js`/`.json` lưu UTF-8 (không BOM), giữ tiếng Việt có dấu. Không dùng `Set-Content`/`Out-File` không kèm encoding.

## Lệnh kiểm thử (ưu tiên lệnh nhẹ)

```bash
node --check js/engine.js                         # syntax file vừa sửa
node tools/verify_<feature>.js                    # gate nhỏ nhất liên quan
node tools/run_regression_suite.js --changed      # chỉ chạy check có đầu vào đổi từ lần PASS trước (cache .cache/)
node tools/run_regression_suite.js --quick        # bỏ 5 check chậm, dùng khi đang sửa
node tools/run_regression_suite.js                # full (~60s) — bắt buộc trước khi commit
node tools/run_regression_suite.js --jobs=2       # song song khi máy rảnh (mặc định 1 để nhẹ CPU)
node tools/build_requirement_index.js             # sinh lại requirement/INDEX.md`nnode tools/build_data.js --check                 # kiểm tra bundle data/generated + block script index.html
```

- Runner in thời gian từng check; check > 5s thì xem lại fixture trước khi thêm check mới.
- Không chạy full suite nhiều lần song song; không chạy suite khi agent khác đang sửa cùng file.

## Tiết kiệm token khi giao việc cho AI

- Việc cơ học (chạy test, đọc log, đổi tên, di chuyển file): model nhỏ (Haiku) hoặc tự chạy lệnh.
- Code theo spec rõ ràng, có test kiểm chứng: model code (Codex/Sonnet).
- Dựng lại văn bản, viết requirement, review thiết kế: Sonnet; chỉ dùng Opus khi cần suy luận nhiều tài liệu chồng chéo.
- Brief giao việc phải tự đủ (file:symbol, hành vi mong đợi, gate) để agent không phải đọc lại tài liệu lớn.