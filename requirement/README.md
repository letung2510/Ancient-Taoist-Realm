# Kho requirement — Cổ Dị Điển

Requirement chia **theo feature → theo chức năng**. Quy ước cấu trúc, mẫu file và rule ID: [CONVENTIONS.md](CONVENTIONS.md).

## Cần gì, đọc ở đâu

| Câu hỏi | Đọc | Không suy ra từ |
|---|---|---|
| Một feature làm gì, gồm chức năng nào, runtime ở đâu | `features/<feature>/README.md` | audit, prompt |
| Rule chi tiết của một chức năng | `features/<feature>/<chuc-nang>.md` | code comment |
| Rule ID nằm ở file nào | grep `requirement/features` theo ID | đọc nguyên file |
| Từ khóa nằm ở mục nào, dòng nào | [INDEX.md](INDEX.md) (sinh tự động) | đọc nguyên file |
| Hiện tại code lệch/thiếu gì, quyết định mới nhất | [STATUS.md](STATUS.md) | bảng lịch sử trong `audit/` |
| Quan hệ giữa các feature | [overview/cross-system-map.md](overview/cross-system-map.md) | |
| Symbol runtime của từng hệ | [overview/runtime-symbol-index.md](overview/runtime-symbol-index.md) | |
| Nguyên tắc thiết kế chung | [overview/principles-and-decisions.md](overview/principles-and-decisions.md) | |
| Lịch sử audit/review | `audit/` (chỉ đọc) | — không phải nguồn logic |
| Prompt AI tái sử dụng | `prompts/` | — không phải requirement |

## Feature

| Nhóm | Feature |
|---|---|
| Nền tảng nhân vật | [character](features/character/README.md) · [fate](features/fate/README.md) · [realm-progression](features/realm-progression/README.md) · [path](features/path/README.md) · [di-the](features/di-the/README.md) · [profession](features/profession/README.md) |
| Thế giới | [map](features/map/README.md) · [weather](features/weather/README.md) · [world-simulation](features/world-simulation/README.md) |
| Tương tác | [npc](features/npc/README.md) · [relationship](features/relationship/README.md) · [companion](features/companion/README.md) |
| Nội dung | [technique](features/technique/README.md) · [discovery](features/discovery/README.md) · [reward](features/reward/README.md) |
| Nền tảng | [ui-action-log](features/ui-action-log/README.md) · [data-runtime](features/data-runtime/README.md) · [cross-system](features/cross-system/README.md) |

## Quy tắc quản trị

- Mỗi requirement có **đúng một chỗ**: file chức năng của feature sở hữu nó. Chỗ khác chỉ link.
- Xung đột: quyết định có ngày mới nhất trong bảng "Quyết định đã chốt" của README feature thắng. Rule bị thay thế bị xóa khỏi file chức năng.
- Trạng thái hiện hành (code lệch/thiếu, gate, việc tiếp theo) chỉ ghi ở `STATUS.md`. `audit/` là lịch sử, không cập nhật thêm.
- Đổi hành vi runtime ⇒ cập nhật rule và cột Runtime mapping của file chức năng trong cùng lượt; cập nhật `STATUS.md` nếu đóng/mở gap.
- Requirement mới: phân loại theo feature/chức năng → thêm rule có ID vào đúng file → không để logic nằm trong prompt/addendum/audit.
- UTF-8 không BOM, giữ tiếng Việt có dấu; ký tự thay thế/mojibake chặn hoàn thành.

## Kiểm tra sau khi sửa

```bash
node tools/build_requirement_index.js        # sinh lại INDEX.md
cd requirement && node validate_requirement_docs.js   # link, code fence, encoding
node tools/verify_33_item_coverage.js        # feature ↔ runtime ↔ regression
```

`tools/run_regression_suite.js` chạy cả ba và báo lỗi nếu `INDEX.md` lỗi thời.
