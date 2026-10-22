# Data & Runtime

## Phạm vi

Nền tảng runtime dùng chung: đồng hồ game (Player/World Clock), save schema và migration, validator/cache/replay deterministic, ngân sách hiệu năng và lưu trữ (retention, IndexedDB archive, profile thiết bị), vòng đời bundle offline. Không chứa luật gameplay của từng feature; các feature chỉ tham chiếu bất biến ở đây.

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Đồng hồ game | [game-clock.md](game-clock.md) | `DATA-CLK-` | engine.js:`ensureGameClock`, `ensureWorldClock`, `advanceGameTime`, `applyOfflineProgress`, `gameDayIndex`, `clockLabel`, `worldClockLabel` |
| Save schema và migration | [save-schema-and-migration.md](save-schema-and-migration.md) | `DATA-SAV-` | engine.js:`createState`, `deserialize`, `migrateV12ToV13`; expansion.js:`ensureExpansionState` |
| Validation, cache, replay | [validation-and-replay.md](validation-and-replay.md) | `DATA-VAL-` | expansion.js:`validateExpansionState`, `invalidateMapInfluence`, `validateCacheInvalidationState`, `validateWorldCatalogs`; engine.js:`replayRandom` |
| Ngân sách hiệu năng và lưu trữ | [performance-budget.md](performance-budget.md) | `DATA-PRF-` | expansion.js:`resolvePerformanceProfile`, `runtimeBudgetSnapshot`; main.js: IndexedDB archive |
| Bundle offline | [offline-bundle.md](offline-bundle.md) | `DATA-OFF-` | tools/run_regression_suite.js, tools/build_offline_bundle.ps1 |

## Phụ thuộc

- [ui-action-log](../ui-action-log/README.md) — envelope event, nhóm cảnh, quy tắc UTF-8 cho chữ người chơi.
- [cross-system](../cross-system/README.md) — nền state v13, RNG thế giới, catch-up thế giới, product policy.
- [world-simulation](../world-simulation/README.md), [map](../map/README.md) — consumer của clock, cache influence.
- [character](../character/README.md) — hành trình mở đầu (kiểm chứng DATA-VAL-010).

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | `index.offline.html` chỉ rebuild khi người dùng yêu cầu rõ; regression suite bỏ qua `verify_offline_bundle` trừ khi có `--with-offline-bundle`. | DATA-OFF-001…004 |
| 2026-10-22 | World Clock canonical là `state.worldClock.absoluteDay` 1-based, epoch Năm 6087 Tháng 1 Ngày 1 như runtime; bỏ đặc tả cũ zero-based `startDayIndex 2,475,360` = Năm 6876 và `epochDate` "2026-08-15". `gameClock.world` chỉ là adapter phải phản chiếu `state.worldClock`. | DATA-CLK-002 |
| 2026-10-22 | Nhãn đồng hồ theo runtime ("Nhân vật · …", "Thái Thanh đại lục · …"). | DATA-CLK-010 |
| 2026-10-22 | Gỡ mục "chẩn đoán performance" dạng hướng dẫn (DevTools, React memo, Web Worker); chỉ giữ rule đã áp dụng (retention, archive, index catalog, profile). | DATA-PRF-* |
| 2026-10-22 | Hợp đồng thời tiết/công trình/hộ tống trong "Runtime Logic Integration" chuyển sang cross-system. | CSX-WE-006, CSX-STR-004/005, CSX-NPC-020 |

## Gate

```powershell
node tools/verify_review_batches.js
node tools/verify_save_envelope.js
node tools/verify_random_boundaries.js
node tools/verify_offline_parity.js
node tools/verify_indexeddb_archive.js
node tools/profile_runtime_budget.js
node tools/verify_asset_references.js
node tools/verify_utf8_integrity.js
node tools/run_regression_suite.js            # bỏ qua verify_offline_bundle
node tools/run_regression_suite.js --with-offline-bundle   # chỉ sau khi rebuild bundle theo yêu cầu
```
