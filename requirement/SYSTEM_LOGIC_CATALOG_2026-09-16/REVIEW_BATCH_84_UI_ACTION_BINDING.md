# Review Batch 84 — UI Action Binding

## Phạm vi

Hoàn thiện phần review liên quan đến nút UI có command mở rộng và đường đi command → runtime.

## Đã chốt và code

- UI command được trích từ các lời gọi `expansionButton`.
- Runtime command được trích từ table của `runExpansionCommand`.
- Regression fail nếu UI phát command không có handler, declaration bị trùng, delegated click bị bind nhiều lần hoặc action không qua queue.

## Bằng chứng

- `requirement/07-ui/UI_ACTION_BINDING_STATIC_AUDIT_2026-09-17.md`
- `tools/verify_ui_surface_contract.js`

## Phần còn mở

Browser E2E local cần môi trường cho phép truy cập HTTP localhost; hiện static contract và runtime regression đã bao phủ đường đi dữ liệu, nhưng chưa thể coi là bằng chứng pixel/UI tương tác thật.
