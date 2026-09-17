# Review Batch 83 — Deterministic replay envelope

Phạm vi: Mục 21, hỗ trợ Mục 20/22.

Đã bổ sung `validateReplayEnvelope()` cho seed/save identity, turn/sequence counters và unique IDs của world events/tasks/encounters; nối vào `validateExpansionState()`. Regression kiểm tra seed drift và combat transcript sau save/load.

Trạng thái: **ĐANG TRIỂN KHAI** — deterministic runtime chính đã pass; cross-browser replay corpus dài ngày còn thiếu.
