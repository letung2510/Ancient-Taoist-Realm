# DATA RUNTIME CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\01-core\SAVE_MIGRATION_MULTI_VERSION_FIXTURES_2026-09-17.md`

# Save Migration Multi-Version Fixtures — 2026-09-17

## Phạm vi

Mục 3 (namespace Nghề chính/Nghề Ẩn) và mục 20 (legacy history/statDisplay migration) phải được kiểm tra qua deserialize thật, không chỉ gọi `ensureExpansionState` trên object đang sống.

## Hợp đồng

- Save v1 có thể chỉ chứa `player.hiddenProfession`, thiếu `professionState`, map state và Dị Thể state.
- Save v7 có thể chứa `professionState.hiddenId`, nhưng `secondaryId` và compatibility mirror chưa được chuẩn hóa.
- History legacy không có ID/statDisplay phải được nâng cấp deterministic.
- Sau migration, `validateExpansionState` phải pass và canonical serialize → deserialize không làm đổi namespace.
- Save cũ thiếu `meta.saveId` được cấp một ID deterministic từ identity ổn định của nhân vật để replay envelope không bị phá.

## Regression

`tools/verify_review_batches.js` tạo fixture v1/v7, deserialize qua runtime thật, kiểm tra hidden profession vào đúng slot phụ, kiểm tra `legacy_0`, validate invariant và round-trip canonical.

## Chưa hoàn thiện

Không còn thiếu logic migration trong các fixture đã định nghĩa. Các save format ngoài v1/v7 chưa có fixture riêng; nếu phát sinh version mới phải bổ sung fixture trước khi nâng version runtime.


### Source: `archive-requirements\logic-history\03-world\RUNTIME_LOGIC_INTEGRATION_FIXES.md`

# Runtime Logic Integration Contract

## Canonical save

Save runtime uses schema `tu_vi_quy_di_canonical_v13`. Unknown world events are preserved in
`state.unknownContent.events` with `dormant` status; unknown awakening branches remain sealed
on the item legacy record and must never be silently discarded.

## Weather contract

Every weather mutation writes `weather`, `weatherIntensity`, `weatherUntilDay`, `weatherSource`
and a bounded `weatherHistory`. Intensity is shared by travel, NPC sheltering, war pause and
natural-disaster thresholds.

## Map structures

- Watchtower reveals adjacent nodes according to `revealAdjacentNodes` and structure level.
- Trading posts create a three-day visit cadence and guarantee an itinerant merchant NPC.
- `mapState.influenceMap` stores node snapshots; `regionInfluence` stores region aggregates.

## Escort contract

An escort is an alive NPC at the origin node. A travel task stores `escortProfile`, applies
`riskReduction` to the persisted task risk, charges `dailyCost` once per simulated travel day,
and changes to `fled` when maintenance cannot be paid.


### Source: `archive-requirements\logic-history\08_DATA_CACHE_INVALIDATION_RUNTIME_2026-09-17.md`

# Cache Invalidation Runtime Contract — 2026-09-17

## Contract

Map influence cache có một `influenceRevision` canonical. Mọi thay đổi ảnh hưởng influence phải tăng revision, ghi `lastInvalidation` và xóa snapshot cũ; cache entry hợp lệ phải mang đúng revision/node. Runtime metrics map influence/NPC/offline phải là số hữu hạn, không âm.

## Runtime

`invalidateMapInfluence()` tăng revision, đếm invalidation và ghi node/day. `validateCacheInvalidationState()` kiểm tra revision, metadata, stale cache và metrics; `validateExpansionState()` gọi audit này. Map influence, travel, structure và UI tiếp tục đọc cùng resolver.

## Regression

`verify_review_batches.js` kiểm tra cache state trước mutation, revision/invalidation sau event influence và structure mutation; stress/performance regression vẫn chạy.

## Chưa hoàn thiện

Chưa có profiling trên thiết bị thật và browser Performance API; invariant runtime và budget gate đã có.


### Source: `archive-requirements\logic-history\08_DATA_REPLAY_CACHE_INVARIANTS_2026-09-17.md`

# REPLAY AND CACHE INVARIANTS — 2026-09-17

## Deterministic replay

- Every runtime random producer is either behind `replayRandom`/`seeded` or an explicit entropy boundary used only for initial non-game randomness.
- Action keys include the feature scope and stable turn/day/entity identity; preview and commit use the same resolver without consuming mutable RNG state.
- Static audit discovers every JS source plus root generators and rejects unapproved direct `Math.random()`.

## Cache invalidation

- Map influence cache is valid only when its entry revision equals `mapState.influenceRevision`.
- Any structure, map-event, ownership or outpost mutation increments the revision and clears the cache.
- Save validation requires a positive revision, object cache and finite runtime metric counters; stale cache entries are safe because the resolver fails closed/recomputes.
- NPC view/offline metrics are measured separately from map influence and do not participate in gameplay outcomes.

## Evidence

`verify_random_boundaries.js`, replay/character/combat/offline tests and `testInfluenceOfflineAndInvalidation()` provide current regression evidence. `validateExpansionState()` now rejects malformed cache/metric state.


### Source: `archive-requirements\logic-history\08_DATA_RUNTIME_PERFORMANCE_PROFILE_2026-09-17.md`

# PERFORMANCE PROFILE CONTRACT — 2026-09-17

## Profiles

- `standard`: target 60 FPS, map render budget 80, story window 20, NPC records/tick 100, detailed offline window 30 days.
- `weak`: selected when hardware concurrency ≤2 or device memory ≤2 GB; target 30 FPS, map render budget 24, story window 12, NPC records/tick 50, detailed offline window 14 days.
- `reduced`: selected when reduced-motion is requested; target 45 FPS with bounded map/history work and no gameplay rule changes.

## Invariant

Performance profile changes render/diagnostic budgets only. It must not alter canonical rewards, RNG keys, progression, map influence values, save schema or action outcomes. `resolvePerformanceProfile()` is pure; `performanceProfile(state)` records only the active runtime profile.

## Evidence

`verify_review_batches.js` checks weak/standard selection, budget ordering and state application. `profile_runtime_budget.js` remains the Node baseline for actual map influence, offline, save and novel-log timing. Browser FPS measurement remains a device QA gate.


### Source: `archive-requirements\logic-history\PERFORMANCE_DIAGNOSIS_FIX.md`

# CHẨN ĐOÁN & FIX PERFORMANCE — CỔ DỊ DIỆN
> "Bắt đầu lag" (không phải lag ngay từ đầu) là tín hiệu QUAN TRỌNG — nghĩa là nguyên nhân nhiều khả
> năng là thứ gì đó TÍCH LŨY DẦN theo thời gian chơi, không phải lỗi cấu trúc tĩnh. Ưu tiên chẩn đoán
> theo hướng đó trước.

---

## 0. CÁCH TỰ CHẨN ĐOÁN TRONG 5 PHÚT (làm TRƯỚC khi sửa mù)

1. Mở DevTools (F12) → tab **Performance** → bấm Record → chơi vài action → Stop → xem "Main"
   track: cột nào cao bất thường (Scripting/Rendering/Painting)?
2. Tab **Memory** → chụp Heap Snapshot lúc mới vào game vs sau khi chơi 30 phút → so sánh dung
   lượng tăng bao nhiêu, object nào tăng nhiều nhất (thường lộ ngay thủ phạm).
3. Tab **Application → Local Storage** → xem dung lượng save file hiện tại — nếu vài trăm KB trở
   lên và tăng dần theo thời gian chơi, gần như chắc chắn là vấn đề mục 2 dưới đây.
4. Console gõ `localStorage.getItem('save_key').length` (thay đúng tên key) — con số càng lớn theo
   thời gian chơi càng khẳng định nghi ngờ.

---

## 1. NGHI PHẠM #1 — LOG HISTORY PHÌNH TO KHÔNG GIỚI HẠN (khả năng cao nhất)

**Vì sao nghi ngờ đây:** đúng khớp triệu chứng "bắt đầu lag" — chơi càng lâu, action càng nhiều, log
càng dài, nếu KHÔNG giới hạn thì cả DOM lẫn save file đều phình to tuyến tính theo số action đã làm.
Đã cảnh báo nguy cơ này trước đó (mục 2 tài liệu UI panel) nhưng chưa chắc đã được implement.

```
Kiểm tra nhanh: mở DevTools -> Elements -> tìm khung Story Panel -> đếm số thẻ <div> con của nó.
Nếu con số này TĂNG DẦN không giới hạn theo số action đã chơi (không dừng lại ở ~20-50) -> ĐÚNG thủ
phạm.
```

**Fix bắt buộc (nếu chưa có):**
```
1. Tách `fullLogHistory[]` (lưu TOÀN BỘ, dùng cho save/replay) ra khỏi phần RENDER DOM.
2. DOM chỉ render fullLogHistory.slice(-30) (hoặc số tương đương) — KHÔNG render hết.
3. Định kỳ (mỗi 200-500 event) di chuyển phần lịch sử CŨ từ memory xuống IndexedDB (không phải
   localStorage — localStorage giới hạn ~5-10MB và ĐỒNG BỘ, block main thread khi ghi/đọc; IndexedDB
   bất đồng bộ, phù hợp dữ liệu lớn/tăng dần hơn nhiều).
4. Save file (localStorage) CHỈ lưu N event gần nhất (VD 100) + 1 con số "tổng số event đã qua" cho
   mục đích thống kê — KHÔNG lưu toàn bộ lịch sử vào save chính.
```

---

## 2. NGHI PHẠM #2 — DATA TRA CỨU BẰNG MẢNG THAY VÌ INDEX (10.000 Mệnh Số + 13.976 quan hệ)

**Vì sao nghi ngờ đây:** `fate_data.js`/`fate_relationships.js` là MẢNG (`Array`). Nếu code đang
dùng `array.find(x => x.id === targetId)` hoặc `array.filter(...)` mỗi lần cần tra 1 Mệnh Số/quan hệ
— đây là O(n), với 10.000-13.976 phần tử, gọi lặp lại nhiều lần trong 1 khung hình (VD tính
match_score cho MỌI Mệnh đang active mỗi lần render Character Sheet) sẽ giật rõ rệt, ĐẶC BIỆT nếu
số Mệnh Số người chơi sở hữu tăng dần theo thời gian chơi (khớp "bắt đầu lag" — quan hệ cần tra cứu
tăng theo cấp số nhân khi số Mệnh sở hữu tăng: N Mệnh thì có N×(N-1)/2 cặp cần check).

**Fix bắt buộc:**
```js
// Build 1 LẦN DUY NHẤT lúc load game, KHÔNG build lại mỗi lần cần tra cứu:
const fateById = new Map(FATE_DATA.map(f => [f.id, f]));
const relationshipsByFateId = new Map(); // fateId -> [danh sách quan hệ liên quan tới nó]
for (const rel of FATE_RELATIONSHIPS.pairwise_relationships) {
  (relationshipsByFateId.get(rel.from) ?? relationshipsByFateId.set(rel.from, []).get(rel.from)).push(rel);
  (relationshipsByFateId.get(rel.to)   ?? relationshipsByFateId.set(rel.to,   []).get(rel.to)).push(rel);
}

// Sau đó MỌI tra cứu đều O(1)/O(k) thay vì O(n):
fateById.get(targetId)                    // thay vì FATE_DATA.find(...)
relationshipsByFateId.get(fateId) ?? []   // thay vì FATE_RELATIONSHIPS.pairwise_relationships.filter(...)
```
Đây là fix RẺ NHẤT so với lợi ích mang lại — chỉ cần build Index 1 lần lúc khởi động, không đổi logic
gameplay gì cả.

---

## 3. NGHI PHẠM #3 — `simulateWorldTick()` CHẠY ĐỒNG BỘ TRÊN MAIN THREAD

**Vì sao nghi ngờ đây:** đây là hệ thống MỚI THÊM GẦN ĐÂY NHẤT (Faction diplomacy/NPC schedule/
weather propagation) — nếu code test performance TRƯỚC khi thêm hệ này mà mượt, sau khi thêm mới lag,
gần như chắc chắn là thủ phạm. Đặc biệt nguy hiểm vì bản đồ SINH VÔ HẠN (procedural) — càng khám phá
nhiều, số node/Faction/NPC cần simulate mỗi tick càng tăng, khớp đúng "bắt đầu lag dần" khi chơi lâu.

**Fix theo mức độ ưu tiên:**
```
1. NGAY LẬP TỨC: chỉ simulate Faction/NPC trong bán kính GẦN người chơi (VD 10-15 node quanh vị trí
   hiện tại) — KHÔNG simulate toàn bộ map đã sinh ra (vùng xa không ai quan sát không cần tính real-
   time, có thể "catch up" bằng công thức rút gọn khi player quay lại thay vì tick từng ngày).
2. Nếu vẫn nặng: dùng `requestIdleCallback` (hoặc setTimeout 0) để chạy simulateWorldTick() ngoài
   khung hình chính, tránh block render — đặc biệt quan trọng nếu simulation chạy MỖI LẦN advance
   GameClock mà GameClock lại advance theo real-time liên tục.
3. Nếu dùng Web Worker được: chuyển toàn bộ world simulation (không đụng DOM) sang 1 Worker riêng,
   post message kết quả về main thread — tách hẳn khỏi UI thread, lag simulation không còn ảnh hưởng
   cảm giác mượt của thao tác người chơi.
```

---

## 4. NGHI PHẠM #4 — RE-RENDER TOÀN BỘ LIST THAY VÌ CHỈ PHẦN THAY ĐỔI

**Kiểm tra nhanh:** React/Vue DevTools → bật "Highlight updates when components render" → thao tác 1
hành động nhỏ (VD Tu Luyện) → xem có bao nhiêu component sáng lên. Nếu TOÀN BỘ danh sách Mệnh Số/
Hành Trang/Bản đồ sáng lên dù chỉ 1 con số thay đổi -> đây là thủ phạm.

**Fix:**
```
- Dùng key ổn định (fateId, không phải index mảng) cho mọi list item.
- Memoize component con (React.memo/Vue computed) để chỉ re-render item THẬT SỰ thay đổi.
- Với danh sách dài (Mệnh Kho có thể tới hàng chục/trăm item nếu chơi lâu): cân nhắc virtualization
  (react-window/vue-virtual-scroller) — chỉ render item đang hiện trong viewport.
```

---

## 5. NGHI PHẠM #5 — SAVE/LOAD GHI TOÀN BỘ CATALOG TĨNH VÀO SAVE FILE

**Vì sao nghi ngờ:** nếu save file đang lưu NGUYÊN object Mệnh Số đầy đủ (bao gồm cả field tĩnh
không đổi như `desc`, `effects`, `tags`...) cho MỖI Mệnh người chơi sở hữu, thay vì chỉ lưu `fateId`
+ instance data thay đổi (`relationshipStage`, `isActive`...) — save file sẽ phình to không cần
thiết, và MỖI LẦN SAVE (nếu tự động save sau mỗi action) sẽ chậm dần theo số Mệnh sở hữu.

**Fix:**
```
Save CHỈ lưu: { fateId, isActive, relationshipStage, relationshipPoints, ... } — instance data thôi.
Lúc load lại: fateById.get(fateId) (đã có Index từ mục 2) để lấy lại đầy đủ thông tin tĩnh từ catalog
gốc (vốn đã có sẵn trong `fate_data.js`, không cần lưu lại lần 2 vào save).
```

---

## 6. THỨ TỰ KHUYẾN NGHỊ XỬ LÝ
1. Chạy chẩn đoán mục 0 trước — đừng đoán mò, 5 phút DevTools sẽ chỉ thẳng thủ phạm thật.
2. Nếu Memory tăng liên tục không dừng khi chơi → ưu tiên mục 1 (log history) và mục 5 (save file).
3. Nếu Scripting cao mỗi khi advance GameClock/di chuyển map → ưu tiên mục 3 (world tick).
4. Mục 2 (Index hóa data) nên làm LUÔN bất kể chẩn đoán ra sao — chi phí thấp, lợi ích cao, gần như
   không có rủi ro phụ.
5. Mục 4 chỉ cần làm nếu DevTools Profiler cho thấy Rendering/Painting cao bất thường so với
   Scripting.
## Runtime metrics contract

`runtimeBudgetSnapshot()` now reports average timings for map influence, NPC
view-model generation, and offline catch-up, alongside calls/cache hit rate and
save-size measurements. The Node profile exercises all three paths and enforces
the canonical budgets before a batch can be marked green.


## Opening intent runtime verification

- Runtime verification must cover every journey intent, regional target selection, five independent opening scenes, save/load persistence, action-dispatch replay, and target organization enforcement.
- A failed regional target roll is explicit and reproducible; the runtime must never silently substitute an organization of another kind.

### Expanded opening-intent regression

- The verifier covers six supported starting regions, all four intent branches, five independent scenes, Background-specific option sets, regional target validity, quest/history isolation, failed-action turn safety, and save/load persistence.
- Active runtime and requirement files must remain valid UTF-8; detected mojibake is a release-blocking defect.
