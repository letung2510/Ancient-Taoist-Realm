# UI, archive và performance gate — Batch 69

## Gate bắt buộc

- UI phải có World/Map/Dị Thể/Nghề Ẩn/Mệnh và log dùng `novelLogParagraphs` theo ngày.
- Log producer không được đẩy technical token hoặc system-log formatting trực tiếp ra player surface.
- Archive IndexedDB phải retry khi open/write lỗi và không làm mất event.
- History local giữ tối đa 300 entry; actor history giữ theo offline detailed window; save payload và novel grouping phải nằm trong budget baseline.
- `validateExpansionState` dùng baseline profile chuẩn cho data validity; thiết bị yếu chỉ thay đổi render/diagnostic budget, không làm save hợp lệ thành invalid.

## Evidence

- `verify_ui_surface_contract.js`
- `verify_log_narrative.js`
- `verify_log_producers.js` (66/66)
- `verify_indexeddb_archive.js`
- `profile_runtime_budget.js`
- `node --check js/ui.js`

## Giới hạn

FPS trên browser và quota IndexedDB của từng thiết bị thật vẫn là manual/device QA; Node profile chỉ là deterministic baseline gate.
