# Bản vá Runtime Công pháp — 2026-09-18

- Công pháp phải tồn tại trong catalog, masteryExp/usageCount không âm và masteryStage nằm trong 0–4.
- Tiến hóa chỉ dùng các trạng thái `locked`, `trial`, `ready`, `chosen`.
- Nhánh đã chọn phải thuộc đúng catalog tiến hóa của công pháp.
- `validateTechniqueRuntimeState` được gọi trong validator tổng hợp.
