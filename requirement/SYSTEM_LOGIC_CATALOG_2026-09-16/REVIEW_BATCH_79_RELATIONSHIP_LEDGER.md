# Review Batch 79 — Relationship ledger invariants

Phạm vi: Mục 15 và hỗ trợ Mục 6/8.

Đã bổ sung validator ledger quan hệ, unique event key, event metadata và orphan memory; nối vào `validateExpansionState()`. Regression kiểm tra idempotent relationship event, projection dimensions và drift bị từ chối.

Trạng thái: **ĐANG TRIỂN KHAI** — runtime/save đã pass; dialog UI E2E và các nhánh relationship dài hạn vẫn cần coverage trực tiếp.
