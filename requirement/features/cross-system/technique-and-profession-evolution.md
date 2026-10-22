# Cross-system — Tiến hóa Công Pháp và khung Nghề (SYS-04)

## Mục đích

Thí luyện/tiến hóa Công Pháp khi đạt độ thành thạo, và khung nghề dùng chung (Luyện Đan, Luyện Khí, Trận Pháp Sư, Tướng Sư) nối Công Pháp, vật phẩm, thế giới. Luật nghề chi tiết: [profession](../profession/README.md); luật Công Pháp: [technique](../technique/README.md).

## Dữ liệu & trạng thái

```js
evolutionPaths: [{ id, name, trigger: { masteryStage: 2 }, trialTemplateId,
  modifiers, tradeoff, pathRequirements: [], description }]
techniqueProgress[id].evolution = { status: "locked"|"trial"|"ready"|"chosen",
  trialQuestId, evolutionId, chosenAtDay }
professionState = { primaryId, professions: { [id]: { masteryExp, masteryStage,
  recipesKnown: [], specializations: [], lastActionDay } } }
ProfessionDefinition { id, name, relatedPathIds, relatedTechniqueFamilies,
  masteryThresholds, recipeIds, actionTemplates }
PlacedFormation { id, techniqueId, ownerId, nodeId, createdDay, expiresDay, charges,
  purpose: "combat"|"protect"|"gather"|"trap" }
```

## Rules

### Tiến hóa Công Pháp

| ID | Rule |
|---|---|
| CSX-EVO-001 | Lần đầu `updateTechniqueMastery()` đạt stage 2 thì tạo thí luyện đúng một lần; thí luyện dùng chính family/category của Công Pháp. |
| CSX-EVO-002 | Hai nhánh là sidegrade (mỗi nhánh có modifier và tradeoff); preview gọi cùng resolver modifier với runtime. MVP: ba Công Pháp phổ biến × hai nhánh. |

### Khung nghề

| ID | Rule |
|---|---|
| CSX-PRF-001 | Một nghề chính nhận 100% mastery; nghề phụ nhận 25%. Mastery nghề khác mastery Công Pháp nhưng dùng chung resolver ngưỡng và component UI. |
| CSX-PRF-002 | **Luyện Đan:** công thức dùng nguyên liệu trong hành trang; rollback nếu input không hợp lệ, không rollback khi luyện thất bại hợp lệ. Kết quả `fail/normal/perfect` theo aptitude + mastery + chất lượng lò/vật phẩm. Đan hoàn mỹ dùng affix data-driven trong whitelist. Diên Thọ Đan chịu diminishing return/trần canonical. |
| CSX-PRF-003 | **Luyện Khí:** nguyên liệu quái/khoáng + công thức gốc → `registerGeneratedItem`; đặt tên sau khi tạo, lọc độ dài như tên nhân vật; tỉ lệ thức tỉnh đi qua [CSX-ITM-001](item-legacy-auction-companion.md), không chép logic quan hệ Mệnh. |
| CSX-PRF-004 | **Trận Pháp Sư:** trận dùng Công Pháp `tran_phap`, nguyên liệu và world task; tối đa 3 trận active mỗi người chơi; offline chỉ tiêu charges/thưởng theo trần, không farm vô hạn. |
| CSX-PRF-005 | **Tướng Sư:** xem tướng dùng skill check comprehension/aptitude, chỉ lộ field trong allowlist (gợi ý alignment, hệ, nghi ngờ thế lực, manh mối hidden tag); thất bại trả kết quả mơ hồ, không mutate sự thật; Mệnh chỉ lộ insight ẩn khi định nghĩa Mệnh cho phép. Thông tin cảm nhận được đánh dấu khác sự thật; không lộ cờ boss/ending. |

## Acceptance

- Thí luyện tiến hóa chỉ sinh một lần; công thức atomic; vật phẩm tạo ra save/load được; thưởng trận pháp offline có trần.
- Gate: `verify_technique_channel_matrix.js`, `verify_progression_requirement_matrix.js`, `verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-EVO-001 | engine.js:`updateTechniqueMastery` | Khớp |
| CSX-EVO-002 | engine.js:`techniquePreview` (không có `resolveTechniqueModifiers`) | Khớp (preview dùng resolver runtime) |
| CSX-PRF-003 | engine.js:`registerGeneratedItem` | Khớp |
| CSX-PRF-004 | expansion.js:`placedFormations` | Khớp |
