# Batch 6 — Runtime/UI/Log status — 2026-09-16

## Đã hoàn thiện trong đợt này

- Bổ sung bảng tín hiệu NPC tại tab Quan hệ: NPC đang ở node, trạng thái di chuyển/trú ẩn/chiến đấu, thứ tự hàng đợi và rumor gần nhất.
- Bổ sung “Dấu vết gần đây tại node” trong tab Thế giới, đọc từ `node.history`, gồm thiên tượng, điểm nhỏ, công trình, chuyển chủ, thế lực, nhân vật và khám phá.
- Chốt guard Nghề Ẩn: không thể chọn Nghề Ẩn trước Nghề chính; sau khi Nghề chính commit, nghề thường khác bị khóa, Nghề Ẩn chỉ được điền slot phụ khi Cổ Tịch và đồ thị manh mối hợp lệ.
- Bổ sung regression cho mã lỗi kỹ thuật không được lọt vào player-visible log và cho việc gộp các event cùng ngày thành một đoạn novel.
- Ổn định fixture breakthrough trong `verify_game.js`: tách kiểm thử cổng đột phá khỏi cơ chế Tẩu Hỏa Nhập Ma có thể làm giảm Tu vi sau một lần gain lớn.

## Regression đã chạy

- `node --check js/expansion.js`
- `node --check js/ui.js`
- `node --check tools/verify_game.js`
- `node tools/verify_game.js`
- `node tools/verify_review_batches.js`
- `node tools/verify_log_narrative.js`
- `node tools/verify_expansion_log_matrix.js` — 43/43

## Còn mở

- Browser/device visual QA chưa thể coi là hoàn tất chỉ bằng Node harness.
- Các mục về benchmark thiết bị yếu, cân bằng nội dung Dị Thể/Path Fusion và large-save browser quota vẫn cần đợt riêng.
