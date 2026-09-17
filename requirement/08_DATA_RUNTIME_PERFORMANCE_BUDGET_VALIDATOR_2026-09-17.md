# Runtime performance profile và budget validator

## Profile canonical

`resolvePerformanceProfile` chọn `weak`, `reduced` hoặc `standard` từ cores,
device memory và reduced-motion. Mỗi profile quy định target FPS, map render budget,
history window, NPC records/tick và số ngày offline mô phỏng chi tiết.

## Budget invariant

- target FPS nằm trong 30..60.
- map render budget tối thiểu 12 node/khung logic.
- history window tối thiểu 8.
- NPC records/tick tối thiểu 25.
- offline detailed window tối thiểu 7 và không vượt profile đang chọn.
- runtime metrics map influence được so với budget; vượt quá ngưỡng 4x bị báo lỗi để
  regression/performance gate xử lý, không âm thầm coi là đạt.

## Runtime

`validatePerformanceBudget(state, capabilities)` đọc cùng profile resolver với UI/runtime,
đồng thời đọc `runtimeBudgetSnapshot`; không dùng một bộ ngưỡng riêng cho từng caller.
`validateExpansionState` gọi validator để save/test boundary phát hiện cấu hình offline
quá nặng.

## Chưa hoàn thiện

- Chưa có benchmark tự động trên từng thiết bị thật; metrics hiện là runtime instrumentation.
- Map renderer vẫn cần gate FPS thực tế ở browser khi local asset loading được khắc phục.
