# Review Batch 77 — Weather runtime contract

Phạm vi: Mục 11.

Đã bổ sung `validateWeatherRuntimeState()` để kiểm tra weather ID sau alias normalization, severity khớp catalog, thời hạn, history retention và transition hợp lệ của world tick. Validator được nối vào `validateExpansionState()` và có regression cho alias, catalog drift và offline tick.

Trạng thái: **ĐANG TRIỂN KHAI** — runtime/save/offline đã được kiểm tra; browser E2E cho animation/fog và từng transition vẫn còn thiếu.
