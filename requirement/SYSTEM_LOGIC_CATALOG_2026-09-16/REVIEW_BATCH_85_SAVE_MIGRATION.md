# Review Batch 85 — Save Migration Fixtures

## Mục review

Mục 3 và 20: canonical namespace Nghề chính/Nghề Ẩn, legacy aliases, history và statDisplay.

## Đã triển khai

- Thêm fixture deserialize v1 thiếu các state mở rộng.
- Thêm fixture deserialize v7 dùng `professionState.hiddenId`.
- Kiểm tra deterministic legacy history ID.
- Kiểm tra `validateExpansionState` sau migration và sau canonical save-load.
- Batch audit phát hiện và đã sửa việc node Bí Cảnh runtime động thiếu tọa độ sau khi catalog runtime được rebuild; tọa độ hiện được cấp deterministic trong `openWorld.coordinates`.

## Evidence

- `requirement/01-core/SAVE_MIGRATION_MULTI_VERSION_FIXTURES_2026-09-17.md`
- `tools/verify_review_batches.js`
