# Review Batch 80 — Hidden Realm lifecycle

Phạm vi: Mục 18 và 26.

Đã bổ sung validator Bí Cảnh cho cycle/window/status, reward claim keys, competitor progress và active realm node reference; nối vào `validateExpansionState()`. Regression kiểm tra enter/exit, reward idempotency, contested expiry và duplicate reward key.

Trạng thái: **ĐANG TRIỂN KHAI** — runtime/save/offline đã pass; browser E2E overlay/map gate còn thiếu.
