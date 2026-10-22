# Data & Runtime — Validation, cache và replay

## Mục đích

Bất biến runtime được kiểm tra khi load/save và trong regression: validator trạng thái, cache ảnh hưởng bản đồ, ranh giới ngẫu nhiên deterministic, catalog thế giới, tham chiếu asset và kiểm chứng hành trình mở đầu.

## Dữ liệu & trạng thái

| Thành phần | Nội dung |
|---|---|
| `mapState.influenceRevision` | Revision canonical của cache ảnh hưởng (số dương) |
| `mapState.influenceMap` / `regionInfluence` | Snapshot theo node / tổng hợp theo vùng |
| `lastInvalidation` | `{ nodeId, day, count }` lần invalidate gần nhất |
| Runtime metrics | Bộ đếm map influence, NPC view-model, offline (số hữu hạn, không âm) |

## Rules

| ID | Rule |
|---|---|
| DATA-VAL-001 | `validateExpansionState()` là validator trung tâm: gọi audit cache, product policy ([cross-system/foundation](../cross-system/foundation.md)), retention, archive; dùng profile `standard` cho tính hợp lệ dữ liệu — thiết bị yếu chỉ đổi ngân sách render/chẩn đoán, không làm save hợp lệ thành không hợp lệ. |
| DATA-VAL-002 | Mọi thay đổi ảnh hưởng influence (công trình, map event, đổi chủ, tiền đồn) gọi `invalidateMapInfluence()`: tăng `influenceRevision`, đếm invalidation, ghi node/ngày, xóa snapshot cũ. Entry cache chỉ hợp lệ khi đúng revision và node; entry cũ an toàn vì resolver tính lại (fail closed). |
| DATA-VAL-003 | `validateCacheInvalidationState()` từ chối: revision không dương, cache không phải object, metadata thiếu, entry cũ, metric không hữu hạn hoặc âm. Map influence, travel, công trình và UI đọc cùng resolver. |
| DATA-VAL-004 | Metric NPC view/offline đo riêng với map influence và không tham gia kết quả gameplay. |
| DATA-VAL-005 | `validateWorldCatalogs()`: thời tiết có severity 0..5, duration dương, transition chỉ trỏ tới thời tiết tồn tại; recipe có nghề, output, nguyên liệu/chi phí hữu hạn không âm; Công Trình đủ bốn loại canonical với chi phí dương; Hộ Giới Đại Trận có SAN protection dương, influence dương và không vượt trần 0.75 sau nâng cấp. |
| DATA-VAL-006 | Mọi producer ngẫu nhiên đi qua `replayRandom`/`seeded`, hoặc là ranh giới entropy khai báo rõ chỉ dùng cho ngẫu nhiên khởi tạo ngoài game. Audit tĩnh quét mọi file JS và generator gốc, từ chối `Math.random()` chưa được duyệt. |
| DATA-VAL-007 | Action key gồm phạm vi tính năng + turn/ngày/thực thể ổn định; preview và commit dùng cùng resolver mà không tiêu RNG có trạng thái. Chạy world tick cùng mục tiêu lần hai không nhân đôi cascade/reward/encounter. |
| DATA-VAL-008 | Tham chiếu tĩnh `assets/...` trong HTML/JS/CSS (index, engine, expansion, ui, main, stylesheet, catalog portrait) phải trỏ tới file tồn tại; asset động từ data dùng path tương đối gốc `assets/`. Gate không thay kiểm tra decode/cache/CORS trên trình duyệt. |
| DATA-VAL-009 | File runtime và requirement phải là UTF-8 hợp lệ; mojibake là lỗi chặn phát hành (chi tiết: [UI-TXT-006](../ui-action-log/i18n-text-rules.md)). |
| DATA-VAL-010 | Kiểm chứng hành trình mở đầu phủ: 6 vùng khởi đầu, 4 nhánh intent, 5 cảnh độc lập, bộ lựa chọn theo Background, tính hợp lệ tổ chức đích theo vùng, cô lập quest/history, an toàn lượt khi action thất bại, dispatch replay và save/load. Roll tổ chức đích thất bại phải tường minh và tái lập được; không bao giờ âm thầm thay bằng tổ chức loại khác. |

## Acceptance

- Mutation công trình/map event làm tăng revision và xóa cache; save có cache hỏng bị validator từ chối.
- `verify_random_boundaries.js` không còn `Math.random()` chưa duyệt.
- Gate: `verify_review_batches.js`, `verify_random_boundaries.js`, `verify_dichi_deep.js`, `verify_catalog_balance.js`, `verify_asset_references.js`, `verify_utf8_integrity.js`, `verify_opening_intent.js`, `verify_character_generator_replay.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| DATA-VAL-001 | expansion.js:`validateExpansionState` | Khớp |
| DATA-VAL-002/003 | expansion.js:`invalidateMapInfluence`, `validateCacheInvalidationState`, `influenceRevision` | Khớp |
| DATA-VAL-005 | expansion.js:`validateWorldCatalogs`, `STRUCTURE_CATALOG` | Khớp |
| DATA-VAL-006/007 | engine.js:`replayRandom`; expansion.js:`seeded` | Khớp |
| DATA-VAL-008 | tools/verify_asset_references.js | Khớp |
| DATA-VAL-010 | engine.js: journey/opening intent; tools/verify_opening_intent.js | Khớp |
