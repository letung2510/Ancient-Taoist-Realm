# Review Batch 78 — Structure runtime state

Phạm vi: Mục 2, 24, 25 và 32.

Đã bổ sung `validateStructureRuntimeState()` cho schema Công Trình, ownership, durability, level/charge, transfer history, duplicate active type và inventory invariant. Validator được tích hợp vào `validateExpansionState()`; regression kiểm tra công trình hợp lệ và durability sai.

Trạng thái: **ĐANG TRIỂN KHAI** — runtime/save validation đã pass; browser E2E permission matrix vẫn còn thiếu.
