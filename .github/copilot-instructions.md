# Project Guidelines — Cổ Dị Điển (text RPG, JavaScript thuần)

Trả lời bằng tiếng Việt, ngắn gọn. Quy tắc chi tiết: [.agent/rules/project-rules.md](../.agent/rules/project-rules.md).

- **`index.offline.html` chỉ sửa/rebuild khi người dùng yêu cầu rõ ràng.**
- Requirement chia theo feature: `requirement/features/<feature>/README.md` → file chức năng; quy ước ở [requirement/CONVENTIONS.md](../requirement/CONVENTIONS.md); trạng thái hiện hành ở `requirement/STATUS.md`.
- Không đọc nguyên file lớn (`js/engine.js`, `js/expansion.js`, `js/ui.js`, `data/fate_*.js`, `requirement/audit/*`); grep rồi đọc theo khoảng dòng. Tra `requirement/INDEX.md`; sửa requirement xong chạy `node tools/build_requirement_index.js`.
- Kiểm thử: `node tools/run_regression_suite.js`.