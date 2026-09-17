# REVIEW STATUS SUPPLEMENT — 2026-09-17

Tài liệu này là phụ lục trạng thái của `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`. Các batch trong phụ lục là bằng chứng triển khai sau phần bảng lịch sử cũ của register; không dùng nhãn cũ “một phần/chưa chốt” nếu batch tương ứng đã có requirement, runtime và regression.

## Các đợt đã hoàn thiện trong vòng hiện tại

| Batch | Mục review | Kết quả |
|---|---|---|
| 76 | 19 — action priority / resolver | Validator kiểm tra ID, priority, alias, projection deterministic và overlap; nối vào expansion validation. |
| 77 | 11 — weather catalog/severity | Validator runtime kiểm tra catalog, severity, duration, history và transition hợp lệ. |
| 78 | 2, 24, 25, 32 — Công Trình/structure | Validator state kiểm tra owner, status, integrity, level, inventory, waystation charges và duplicate active type. |
| 79 | 6, 15 — relationship ledger | Validator kiểm tra event identity, day/delta và không cho memory chứa orphan relationship key. |
| 80 | 18 — Hidden Realm | Validator kiểm tra cycle, window, status, reward idempotency, competitor progress và active reference. |
| 81 | 23, 31 — Dị Thể | Validator state kiểm tra active catalog ID, player mirror, candidate threshold, history/rejected uniqueness. |
| 82 | 1, 9, 22 — map cache/invalidation | Runtime có revision, invalidation count, last invalidation, cache revision và metrics contract. |
| 83 | 21 — deterministic replay | Replay envelope kiểm tra seed/save/turn, sequence counters, world queue và unique event/task/encounter IDs. |
| 84 | 19 — UI command binding | Static audit chứng minh mọi `expansionButton` command có handler runtime; delegated binding và action queue vẫn là single path. |
| 85 | 3, 20 — save migration | Deserialize fixture v1/v7, legacy hidden-profession alias, legacy history ID và deterministic `saveId`; canonical round-trip vẫn pass. |
| 86 | 1, 18 — runtime Hidden Realm coordinates | Node entry/path/core động được cấp tọa độ deterministic, map validator không còn fail sau catalog runtime rebuild. |
| 88 | UI map/world/progression/log surfaces | Headless render toàn bộ 13 tab; phát hiện và sửa fallback region description bị leak `undefined`. |
| 89 | 11, 16, 23–26, 30–31 — catalog balance | Thêm boundary validator cho weather, recipe, Dị Thể, Công Trình, reward và Path fusion; nối vào expansion validation. |
| 90 | UI asset integrity | Kiểm tra `assets/...` reference trong HTML/JS/CSS và data portrait catalog đều trỏ tới file tồn tại; 16 unique asset files hiện pass. |
| 91 | Browser QA evidence | HTTP local index/asset trả 200; Chrome local bị `ERR_BLOCKED_BY_CLIENT` trước khi load, nên pixel/responsive QA vẫn mở và được ghi rõ, không đánh dấu pass giả. |
| 92 | 18 — Hidden Realm offline lifecycle | Sửa claim guard cycle/window và tự eject active realm khi offline tick đóng cycle hoặc chuyển cycle; regression offline expiry pass. |
| 93 | 1, 9, 10, 24–25 — Map structure/travel closure | Structure dismantled bị loại khỏi influence/ward protection; travel weight đọc weather của node đích; regression map lifecycle pass. |
| 94 | 11, 16, 23–26, 30–31 — Catalog balance baseline | Thêm regression runtime trên catalog thật: 8 weather, 6 recipes, 4 Công Trình, 6 Dị Thể, path fusion và reward policy đều pass baseline định lượng. |

## Requirement và code tương ứng

- Batches 76–84 có requirement riêng trong thư mục này.
- Batch 85–86 và gate coverage 33 mục được ghi trong các requirement bổ sung; chạy `node tools/verify_33_item_coverage.js` để kiểm tra đủ mapping requirement → runtime/schema → regression.
- Runtime chính: `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`.
- Regression chính: `tools/verify_review_batches.js`, `tools/verify_ui_surface_contract.js`, `tools/verify_expansion_stress.js`, `tools/profile_runtime_budget.js`.

## Trạng thái 33 mục

- Mục 1–4: đã có canonical influence/structure/map/log runtime; còn browser E2E local và một số balance dữ liệu cần kiểm định nội dung.
- Mục 5–8: Fate namespace/effect/evolution/instance UI đã có validator và regression; policy decay được chốt là `none`.
- Mục 9–16: completion, travel, weather, war, NPC, rumor, relationship, Công Pháp/recipe đã có resolver hoặc validator tương ứng; phần còn mở chủ yếu là mở rộng content catalog.
- Mục 17–22: Dị Thể/discovery lifecycle, contested/hidden realm, action priority, legacy history, replay và cache đã có contract runtime/test.
- Mục 23–28: Dị Thể catalog, structure lifecycle/influence, reward source, archive retention và performance budget đã có requirement/code/test theo các batch trước và 77–83.
- Mục 29–33: product policy đã được chốt canonical cho decay, song tu/path, Dị Thể exclusion, structure ownership và NPC offline; các giới hạn content/balance vẫn được ghi là phần cần tinh chỉnh, không giả định đã cân bằng hoàn toàn.

## Phần chưa thể tuyên bố hoàn tất

1. Browser E2E trực tiếp trên local worktree: môi trường Chrome hiện chặn `localhost` với `ERR_BLOCKED_BY_CLIENT`; static UI contract và Node regression đã chạy, nhưng không thay thế được click test trên browser local.
2. Cân bằng số liệu content (giá, cost, rarity, duration) vẫn là tuning sản phẩm; validator chỉ bảo đảm invariant và không tự chứng minh balance đúng.
