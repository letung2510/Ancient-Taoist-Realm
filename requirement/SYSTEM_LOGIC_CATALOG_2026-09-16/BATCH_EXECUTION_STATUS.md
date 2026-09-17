# Batch Execution Status — Review 33 mục

Ngày bắt đầu: 2026-09-16  
Phạm vi: `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`  
Nguyên tắc: một mục chỉ hoàn tất khi có requirement, state/schema, runtime resolver/action, UI (nếu có), normalization và regression gate.

Ma trận audit từng mục: `33_ITEM_COMPLETION_MATRIX_2026-09-16.md`.

## Batch 1 — P0: Canonical map, construction, Fate boundary

### Đã triển khai

1. `mapInfluenceSnapshot` là resolver canonical duy nhất cho gradient influence.
   - Node đã khám phá: tính theo faction power, khoảng cách Manhattan, chiến sự, event signal và structure influence.
   - Node chưa khám phá: không lộ gradient/faction ownership; chỉ có `eventInfluence` do world event ghi.
   - Có cache theo `influenceRevision`, invalidation khi structure/ownership/event thay đổi.
2. Map structure đã có owner, level, status, effects và transfer history.
   - Truyền Tống Trận dùng eligibility resolver: spawn, faction/guild tham gia, phường thị/thành/cảng hoặc outpost.
   - Hộ Giới Đại Trận đưa reduction vào SAN drain, encounter risk, curse risk và world modifiers.
3. Spawn node lấy từ `character.startLocationId`/input hợp lệ; coordinate khởi tạo dùng tọa độ 100×100 của `WORLD_MAP`, không dùng `[0,0]` giả.
4. Weather có catalog canonical, alias, severity, intensity và modifier cho quang/mưa/sương/tuyết/lôi vũ/linh phong/âm vũ/bão linh khí.
5. Nghề chính/phụ dùng `primaryId`, `secondaryId`, `hiddenId`; đã có normalization và namespace requirement riêng.
6. Fate advanced actions dùng namespace riêng; `fateEffectBreakdown` tách base/enhancement/relationship/evolution/suppression/advanced.
7. Fate relationship đã ghi `nurtureHistory`, `resonanceHistory`, `decayPolicy: "none"`; UI hiển thị điểm, số lần Dưỡng/Cộng Minh và policy.

### Regression đã chạy

- `node --check js/engine.js`
- `node --check js/expansion.js`
- `node --check js/ui.js`
- `node tools/verify_expansion_log_matrix.js` — 43/43
- `node tools/verify_dichi_deep.js` — pass
- `node tools/verify_game.js` — pass; một lần chạy ngắn gặp gate đột phá không ổn định, chạy lại với timeout đầy đủ đã pass.

### Còn lại trong Batch 1

- Kiểm tra trực quan browser cho tab Thế giới và panel Mệnh Số.
- Bổ sung test deterministic riêng cho event influence node chưa khám phá, transfer ownership và weather severity.
- Audit toàn bộ command/UI handler để bảo đảm mọi action mới đều đi qua resolver canonical.

## Batch 2 progress — P1 world/content/replay

### Đã triển khai thêm

- NPC scheduler có `aiState`, `needs`, edge validation; không còn dùng route list như teleport.
- Witness/rumor có confidence, expiry, priority, source và ledger chống lặp; propagation chỉ qua cùng node/node kề.
- War end có `outcome` và `cascadeApplied`; cascade cập nhật faction/map/history đúng một lần.
- Offline NPC encounter dedupe theo encounter key, retention tối đa 100 record; war cascade và offline replay cùng target day đã có regression deterministic.
- Discovery/Dị Chí có state machine `discovered → verified → collected → rewarded`, API transition đơn điệu.
- Legacy history deserialize dùng ID deterministic và derive `statDisplay` từ changes.
- Relationship NPC đã tách `trust`, `loyalty`, `respect`, `fear`, `suspicion`, `score`; companion giữ state/ledger độc lập.
- Công Pháp và recipe đã có DTO/resolver canonical; các recipe Luyện Đan, Luyện Khí và Trận Pháp dùng transaction kiểm tra trước rồi commit chi phí một lần.
- Map encounter, search/discovery và các nhánh reward loot đã dùng replay-aware RNG; preview không tự commit reward.

Requirement bổ sung: `05-operations/WORLD_TICK_NPC_OFFLINE_CANONICAL_2026-09-16.md`, `06-expansion/DISCOVERY_STATE_AND_REWARD_CANONICAL_2026-09-16.md`, `07-ui/ACTION_PRIORITY_REPLAY_CANONICAL_2026-09-16.md`.

P2 baseline đã được ghi thành requirement: `02-progression/DI_THE_CATALOG_AND_EXCLUSION_CANONICAL_2026-09-16.md` và `07-ui/ARCHIVE_PERFORMANCE_BUDGET_CANONICAL_2026-09-16.md`.

### Regression mới nhất

- `verify_dichi_deep.js` — pass.
- `verify_expansion_log_matrix.js` — 43/43.
- `verify_log_narrative.js` — pass.
- `verify_companion_runtime.js` — pass.
- `verify_indexeddb_archive.js` — pass.
- `profile_runtime_budget.js` — pass; resolver trung bình dưới budget Node, save mẫu khoảng 3.7MB.
- `verify_game.js` — pass 3 lần liên tiếp sau khi thêm diagnostic message cho gate đột phá; không còn assertion nền thất bại trong lần kiểm tra này.
- `verify_review_batches.js` — pass sau khi thêm gate relationship, recipe/reward và contested/hidden realm.

### Còn thiếu Batch 2

- Hoàn thiện reward catalog/duplicate policy cho producer còn lại; prisoner resolution đã chuyển sang `grantCanonicalReward` và có regression duplicate.
- Audit producer `Math.random()` còn lại ở UI preview và ItemGenerator; các nhánh loot/cultivation/combat có state RNG scope, còn ID item vẫn cần policy snapshot nếu replay phải tái tạo byte-identical.
- Regression trực tiếp cho action priority, war cascade/offline determinism và discovery round-trip đã có; NPC rumor replay nhiều node và UI browser vẫn còn thiếu.

Reward canonical đã được triển khai bằng `state.rewardLedger` và `grantCanonicalReward`; requirement: `06-expansion/REWARD_CATALOG_IDEMPOTENCY_CANONICAL_2026-09-16.md`. Các nguồn contract, hidden realm, contested opportunity, collection hiếm, world event, tournament, war, prisoner, tomb, legacy và companion release đã dùng receipt chống phát thưởng lặp; discovery/search replay và loot RNG đã có regression deterministic.

## Batch 2 — P1: World tick, NPC, content/discovery, action/log/save

Trạng thái: chưa hoàn tất. Sẽ triển khai theo thứ tự world simulation → NPC offline → discovery/reward → action priority → log group/day → save schema.

## Batch 3 — P2: UI/performance/archive/reward

Trạng thái: chưa hoàn tất. Sẽ chốt budget, retention, render throttling, archive snapshot và reward catalog sau khi Batch 2 ổn định.

## Batch 4 — Product decisions 29–33

Baseline đã được phép tự chốt nhưng chưa đánh dấu hoàn tất:

- Quan hệ Mệnh: không decay.
- Song tu/dung hợp Con Đường: sẽ tách khỏi Nghề Ẩn và chỉ cho phép qua explicit transition resolver.
- Dị Thể: modifier/branch riêng; không tự động khóa nghề/path nếu chưa có rule cụ thể.
- Structure: player/faction/guild ownership có ownerType/ownerId và transfer history.
- NPC offline: aggregate simulation trước, actor-level chỉ khi có encounter/quest/relationship relevance.

## Điều kiện báo hoàn tất

Không báo “đã hoàn thiện toàn bộ” nếu còn mục nào chỉ có mô tả mà chưa có code hoặc regression. Mỗi batch phải cập nhật file này và file requirement tương ứng trước khi chuyển batch.
