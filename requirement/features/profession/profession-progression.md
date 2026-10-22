# Profession — Thục luyện nghề

## Mục đích

Tiến độ mastery của Nghề chính và Nghề Ẩn: cách nhận EXP nghề, ngưỡng giai đoạn và thành tựu nghề. Mastery nghề độc lập với cảnh giới và mastery Công Pháp.

## Dữ liệu & trạng thái

`state.professionState.professions[id] = { masteryExp, masteryStage: 0..4, recipesKnown, specializations, lastActionDay }` — tạo khi chọn nghề, `recipesKnown` khởi đầu là công thức đầu tiên của nghề.

## Rules

### PROF-MST-001 Chỉ nghề đã cố định
Chỉ rèn luyện/nhận mastery cho Nghề chính hoặc Nghề phụ đã cố định; nghề chưa chọn hoặc Nghề Ẩn dormant không nhận mastery, passive hay action.

### PROF-MST-002 Rèn luyện
`practiceProfession(state, id)`: tốn 5 Thể Lực; +12 EXP nghề cho Nghề chính, +3 cho Nghề phụ. Hành động nghề nội bộ (luyện đan, luyện khí) gọi rèn luyện không tốn Thể Lực lần hai. Thi triển Nghề Ẩn cộng +12 EXP nghề.

### PROF-MST-003 Giai đoạn
| `masteryStage` | EXP nghề tối thiểu |
|---:|---:|
| 0 | 0 |
| 1 | 25 |
| 2 | 100 |
| 3 | 300 |
| 4 | 600 |

`masteryStage` làm tăng tỷ lệ thành công chế tạo ([PROF-CRF-002](crafting-recipes.md)). Không dùng `professionMasteryStage` để kiểm điều kiện Con Đường.

### PROF-MST-004 Thành tựu nghề
`profession_luyen_dan` "Bách Luyện Thành Đan" và `profession_tuong_su` "Thông Thiên Tướng Nhãn" đạt khi nghề tương ứng tới `masteryStage` 3.

## Acceptance

- Rèn luyện nghề chưa cố định bị từ chối; thiếu 5 Thể Lực bị từ chối, không cộng EXP.
- EXP 25/100/300/600 đổi đúng giai đoạn; record serialize/deserialize nguyên vẹn.
- Gate: `node tools/verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PROF-MST-001 | `js/expansion.js:practiceProfession`, `hasProfession` | Khớp |
| PROF-MST-002 | `js/expansion.js:practiceProfession`, `useHiddenProfessionAction` | Khớp |
| PROF-MST-003 | `js/expansion.js:practiceProfession` | Khớp |
| PROF-MST-004 | `data/expansion_data.js:achievementDefinitions` | Khớp |
