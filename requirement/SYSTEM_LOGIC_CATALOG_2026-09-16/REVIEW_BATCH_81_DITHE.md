# Review Batch 81 — Dị Thể catalog/state

Phạm vi: Mục 23, hỗ trợ Mục 29–33.

Đã nối catalog validator vào `validateExpansionState()` và bổ sung `validateSpecialPhysiqueState()` cho active/candidate/progress/history/rejected IDs, player mirror và namespace riêng của Dị Thể. Regression kiểm tra unknown active Dị Thể.

Trạng thái: **ĐANG TRIỂN KHAI** — runtime/save đã pass; browser E2E claim/exclusion dialog còn thiếu.
