# Bản vá Runtime Trạng thái Nhân vật — 2026-09-18

`validateCharacterRuntimeState` kiểm tra HP, Linh Khí, Thanh Tỉnh, Thể lực, Thọ nguyên không âm và không vượt max; Tà Nhiễm nằm trong 0–100, max Thanh Tỉnh tối thiểu 70 và max Thể lực hợp lệ.

Validator được gọi trong `validateExpansionState`, còn `updateDerived` là điểm chuẩn hóa sau action/save. Regression kiểm tra trạng thái Thanh Tỉnh âm bị bắt và được khôi phục sau recompute.
