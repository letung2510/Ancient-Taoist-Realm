# REVIEW REGISTER — MỘT PHẦN / THIẾT KẾ / CHƯA CHỐT

Ngày tổng hợp: 2026-09-16  
Nguồn: toàn bộ hồ sơ trong `SYSTEM_LOGIC_CATALOG_2026-09-16`.

File này chỉ chứa các logic chưa đạt trạng thái hoàn thiện để review và quyết định. Các mục đã ghi **ĐÃ CODE** không lặp lại ở đây.

## Cách review

- **P0**: ảnh hưởng trực tiếp đến tính đúng của state/runtime hoặc có nguy cơ mất dữ liệu.
- **P1**: ảnh hưởng lớn đến trải nghiệm/cross-feature nhưng có thể triển khai sau khi core ổn định.
- **P2**: hoàn thiện nội dung, tối ưu hoặc mở rộng.
- **MỘT PHẦN**: đã có một phần runtime/contract nhưng còn thiếu nhánh, UI, migration hoặc test.
- **THIẾT KẾ**: đã có yêu cầu/ý tưởng nhưng runtime chưa đủ để coi là hoàn thành.
- **CHƯA CHỐT**: cần quyết định sản phẩm trước khi code tiếp.

---

## P0 — Cần quyết định/triển khai trước

### 1. API influence gradient canonical

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`, `09_IMPLEMENTATION_GAPS_AND_DECISIONS.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - Chưa bảo đảm toàn bộ heatmap, fog, completion, travel weighting và structure eligibility dùng cùng một resolver.
  - Vẫn có nguy cơ đọc faction presence/owner rời rạc thay vì `resolveMapInfluence(state, nodeId)`.
- Cần chốt:
  - Công thức score theo khoảng cách, anchor, terrain, chiến tranh, reputation và structure. >> theo node mà nhân vật khám phá, còn lại thì theo cơ chế của event ngẫu nhiên trên bản đồ
  - Ngưỡng `owner`, `contested`, `pressure`, `confidence`.
  - Cache/invalidation khi faction, war hoặc structure thay đổi.
- Acceptance:
  - Một DTO influence duy nhất được dùng cho map UI, travel, fog và construction.
  - Có test node trung tâm, node tranh chấp, node ngoài influence và offline catch-up.

### 2. Công Trình — Truyền Tống Trận và Hộ Giới Đại Trận

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`, UI requirements
- Trạng thái: **THIẾT KẾ**
- Nội dung còn thiếu:
  - Registry/runtime đầy đủ chưa được chốt.
  - Chưa chốt cost, charge, durability, repair, upgrade, ownership và điều kiện faction.
  - Chưa hoàn thiện UI tab Thế giới và DTO structure thống nhất.
- Cần chốt:
  - Truyền Tống Trận nối anchor nào, có cần cùng faction/claim không. >> Là node mà nhân vật sinh ra và các node tông môn mà nhân vật tham gia, phường thị cũng được gán node nếu xây dựng Truyền tống trận (Công Trình). Rà soát logic sinh ra của nhân vật để phù hợp với map Oxy 100x100 bây giờ.
  - Hộ Giới Đại Trận giảm danger/influence pressure/weather risk theo công thức nào. >> Giảm SAN bị ảnh hưởng
  - Có được dismantle/chuyển chủ hay không. >> Chuyển chủ cho NPC được.
- Acceptance:
  - Build, active, damaged, repair, upgrade, disable đều idempotent.
  - Structure được lưu, hiển thị trên map và ảnh hưởng resolver thật.

### 3. Namespace Nghề chính, Nghề Ẩn và save legacy

- Nguồn: `02_PROGRESS_PATH_PROFESSION.md`, `11_CANONICAL_STATE_SCHEMA.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - Cần chuẩn hóa `player.hiddenProfession`, `professionState.hiddenId` và alias save cũ. >> Không cần quan tâm save cũ- rule coding. Tiếp tục chuẩn hóa
  - Cần audit mọi UI/action đang đọc trực tiếp field cũ.
- Quyết định đã có:
  - Chọn Nghề chính xong khóa nghề thường ngay lập tức.
  - Nghề Ẩn là nghề phụ, mở qua Cổ Tịch và không thay Nghề chính.
- Acceptance:
  - Load save cũ không mất nghề.
  - Chọn lại Nghề chính luôn bị chặn sau commit đầu tiên.
  - Nghề Ẩn chỉ mở/chọn khi có source Cổ Tịch hợp lệ.

### 4. Error map và producer log cũ

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`, `09_IMPLEMENTATION_GAPS_AND_DECISIONS.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - `ERROR_NARRATIVE_MAP` chưa chắc đã bao phủ mọi mã lỗi phát sinh trong engine/expansion.
  - Một số producer cũ vẫn tạo raw system message rồi mới được boundary làm sạch.
- Cần làm:
  - Quét toàn bộ `reason`, `pushHistory`, `history`, `emitGameEvent`.
  - Tạo mapping hoặc fallback trung tính cho mọi internal code. 
  - Không để fallback làm câu văn bị cụt hoặc mất ngữ nghĩa.
- Acceptance:
  - Không có `SCREAMING_SNAKE_CASE`, field name, `Depth`, `session`, `counter` trong player-visible log.
>> Tiếp tục làm và tự cải thiện logic
---

## P1 — Cần hoàn thiện sau khi core P0 ổn định

### 5. Fate Phase 3

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN**
- Phạm vi chưa hoàn thiện:
  - Nghịch Mệnh.
  - Trấn Mệnh.
  - Thiên Cơ.
  - Mệnh Đổi.
- Cần chốt:
  - Mỗi action dùng instance nào, cost nào, failure penalty nào.
  - Có yêu cầu Con Đường/realm/relationship không.
  - Có tạo debt/corruption hoặc thay đổi active slot không.
- Rủi ro:
  - Dễ cộng effect hai lần với enhancement/evolution/relationship.
>> Tạo logic riêng cho từng phần để không bị effect hai lần với enhancement/evolution/relationship.
>> cho phép Codex tạo requiment, database dựa trên logic và data đang có
### 6. Policy suy giảm quan hệ Mệnh

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN / CHƯA CHỐT**
- Nội dung:
  - Chưa quyết định Mệnh nằm lâu trong Mệnh Kho có giảm relationship hay không.
  - Chưa có công thức decay, grace period, giới hạn sàn và log thông báo.
- Cần chốt một trong ba policy:
  1. Không decay, quan hệ vĩnh viễn. >> Chọn 1
  2. Decay chậm theo absolute day sau grace period.
  3. Chỉ decay khi Mệnh bị bỏ quên hoặc có event đặc biệt.

### 7. Audit effect tiến hóa Mệnh

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa audit hết effect base, enhancement, relationship, combo và evolution branch.
  - Chưa có invariant tự động chứng minh không cộng kép.
- Acceptance:
  - Preview và commit cho cùng kết quả.
  - Deserialize không nhân đôi effect.
  - Branch chỉ áp dụng một lần.
>> Audit hết đi
### 8. UI Mệnh theo instance

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - UI chưa thể hiện đầy đủ relationship level/XP, nurture history, resonance history và evolution branch theo instance.
  - Cần tách rõ definition card với owned instance card.

>> Thực hiện hoàn thiện đi
### 9. Completion và node history

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa bảo đảm mọi action ghi sub-location, structure, actor seen, weather và faction change.
  - Completion hiện có nguy cơ chỉ là boolean thay vì các lớp progress.
- Acceptance:
  - Reload/save vẫn giữ completion chi tiết.
  - Node detail giải thích được vì sao node đã hoàn thành bao nhiêu phần.

>> Thực hiện đi
### 10. Travel weighting đầy đủ

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Cần test đồng thời terrain, danger, weather, war, contested, party và structure.
  - Fast travel phải phụ thuộc anchor/waypoint đã khám phá.
- Rủi ro:
  - Route preview và travel commit có thể tính khác nhau nếu dùng hai code path.
>> Thực hiện đi
### 11. Weather catalog và severity

- Nguồn: `04_WORLD_SIM_FACTION_WEATHER.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Data hiện chưa bao phủ đồng nhất mọi weather được mô tả trong requirement.
  - Cần chuẩn hóa tên `suong`, `suong_mu`, `tuyet`, `am_vu` và alias.
  - Severity/hysteresis chưa hoàn toàn data-driven.
- Acceptance:
  - Catalog có weather ID, label, severity, duration, transition và effect.
  - NPC, travel, fog, faction và log dùng cùng weather resolver.
>> Thực hiện đi
### 12. War front và incident cascade

- Nguồn: `04_WORLD_SIM_FACTION_WEATHER.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa có deterministic replay đầy đủ.
  - Cần kiểm tra idempotency khi offline catch-up chạy lại cùng ngày.
  - Cần chuẩn hóa outcome → faction/map/NPC/quest cascade.
>> Thực hiện đi
### 13. NPC scheduler nâng cao

- Nguồn: `05_NPC_RELATIONSHIP_COMPANION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Nhu cầu, congestion, queue và topology movement chưa đầy đủ.
  - State machine cần guard rõ cho idle/travel/present/interact/shelter/combat.
  - Cần tránh NPC teleport qua edge không hợp lệ.
>> Thực hiện đi
### 14. Witness, rumor và memory propagation

- Nguồn: `05_NPC_RELATIONSHIP_COMPANION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa test lan truyền rumor qua nhiều node, faction và offline tick.
  - Chưa chốt confidence, expiry và source priority.
>> Thực hiện đi
### 15. Player relationship và companion

- Nguồn: `05_NPC_RELATIONSHIP_COMPANION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Bảng relationship level/decay chưa thống nhất hoàn toàn giữa NPC.
  - Companion mutation/equipment cần audit save round-trip.
  - Cần chốt distinction giữa loyalty, trust và relationship score.

### 16. Catalog Công Pháp và recipe

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Effect field của Công Pháp/recipe cần đưa về schema chung.
  - Cần kiểm tra category, family, cost, corruption, cooldown và mastery không bị trùng nghĩa.

### 17. Dị Chí UI và discovery states

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - UI phải tách `discovered`, `verified`, `collected`, `rewarded`.
  - Dị Chí chỉ là lớp tri thức/phát hiện, không được tự biến thành Con Đường/Nghề/Dị Thể.

### 18. Contested opportunity và Hidden Realm

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Cần deterministic test cho expiry, claim, contest, reward và offline.
  - Enter/exit fail phải rollback location/reward/anchor.

### 19. UI view model và action priority

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Audit từng feature để UI không đọc raw state.
  - Bổ sung ma trận action priority cho combat, search, ritual, opportunity, travel và structure cùng lúc.
  - Kiểm tra duplicate listener/duplicate execution sau reload.

### 20. Legacy history và statDisplay migration

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`, `11_CANONICAL_STATE_SCHEMA.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Event cũ chưa có `statDisplay` cần derive/migrate không làm mất narrative.
  - History cũ chứa raw system text cần render lại an toàn.
  - Cần test load save qua nhiều schema version.

### 21. Deterministic replay

- Nguồn: `08_DATA_RUNTIME_PERFORMANCE.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Random của expansion, war, auction, encounter và discovery chưa chắc đều seed theo action key.
  - Preview không được tiêu hao RNG của commit.

### 22. Cache invalidation và performance profiling

- Nguồn: `08_DATA_RUNTIME_PERFORMANCE.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Cần đo map influence, NPC view model, render log và offline catch-up.
  - Cần xác định revision/invalidation key thay vì cache theo thời gian không kiểm soát.

---

## P2 — Thiết kế mở rộng/chưa chốt sản phẩm

### 23. Dị Thể catalog đầy đủ

- Nguồn: `02_PROGRESS_PATH_PROFESSION.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Danh sách Dị Thể, trigger, stage, progress, effect và exclusion.
  - Dị Thể tác động đến corruption, faction, combat, resistance và Con Đường ở mức nào.

### 24. Structure cost/durability/upgrade

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Tài nguyên build/repair/upgrade.
  - Durability/charge và tốc độ suy giảm.
  - Ownership, dismantle, chuyển chủ và faction petition.

### 25. Influence contribution của structure

- Nguồn: `04_WORLD_SIM_FACTION_WEATHER.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Structure cộng trực tiếp score hay tạo anchor mới.
  - Hộ Giới Đại Trận tác động influence hay chỉ tác động danger.
  - Khi damaged/disabled thì score giảm bao nhiêu.

### 26. Reward source canonical

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Discovery/quest/opportunity reward lấy từ catalog nào.
  - Reward có thể duplicate không, có pity/guaranteed result không.

### 27. Archive/history retention

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Giới hạn history local/archive.
  - Event nào giữ vĩnh viễn, event nào prune.
  - Archive có lưu raw event hay chỉ canonical snapshot.

### 28. Performance budget thiết bị yếu

- Nguồn: `08_DATA_RUNTIME_PERFORMANCE.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - FPS/render budget cho map cosmic.
  - Kích thước story history tối đa.
  - Số NPC/tick và số ngày offline catch-up tối đa.

---

## Chưa chốt ở cấp sản phẩm

### 29. Decay quan hệ Mệnh

Đã nêu ở mục 6. Cần người duyệt chọn policy trước khi code vì quyết định này ảnh hưởng progression dài hạn và save balance.

### 30. Mức độ song tu/dung hợp Con Đường

Chưa chốt player có thể giữ bao nhiêu path, điều kiện chuyển, cách cộng affinity và cách xử lý xung đột effect.

### 31. Dị Thể có được loại trừ nghề/path hay không

Chưa chốt Dị Thể chỉ là modifier hay có quyền khóa nghề, khóa Con Đường, đổi faction và tạo ending riêng.

### 32. Policy structure ownership

Chưa chốt structure thuộc player, faction, guild hay node; ai được repair/upgrade; khi faction đổi chủ thì structure xử lý thế nào.

### 33. Độ chi tiết NPC offline

Chưa chốt offline simulation có mô phỏng actor-level đầy đủ hay chỉ mô phỏng aggregate population/event.

---

## Thứ tự đề xuất sau khi review

1. Chốt mục 1–4 và 29–32.
2. Chuẩn hóa state/migration cho nghề, influence, structure và legacy history.
3. Hoàn thiện P1 theo thứ tự map → world tick → NPC → content → UI.
4. Chạy deterministic/offline/performance gate.
5. Chỉ sau đó mở rộng các thiết kế P2.

## Ô quyết định của người review

| ID | Quyết định | Ghi chú |
|---|---|---|
| 1 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 2 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 3 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 4 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 5–22 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 23–28 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 29–33 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |

---

## Cập nhật triển khai theo đợt — 2026-09-16

Quyền quyết định: Codex được phép tự tạo logic còn thiếu và cập nhật requirement/schema hiện hành cho toàn bộ 33 mục. Các quyết định dưới đây là baseline coding, không phải để lại ở trạng thái thiết kế:

| Đợt | Phạm vi | Trạng thái | Bằng chứng/runtime |
|---|---|---|---|
| Batch 54 / P1 | Muc 16/18: Cong Phap, Cong Thuc, Bi Canh/Co Mo | Da bo sung schema + runtime validator + regression claim idempotency | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `TECHNIQUE_RECIPE_HIDDEN_REALM_SCHEMA_2026-09-17.md` |
| Batch 55 / P1 | Muc 5: Fate Phase 3 advanced actions | Da chot catalog scope/cost/effectSource, validator namespace va regression | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `FATE_PHASE3_ADVANCED_ACTION_CANONICAL_2026-09-17.md` |
| Batch 57 / P0 | Muc 3: profession namespace primary/hidden va save alias | Da bo sung validator primary/secondary/alias, migration invariant va regression | `js/expansion.js`, `tools/verify_review_batches.js`, `PROFESSION_NAMESPACE_RUNTIME_INVARIANTS_2026-09-17.md` |
| Batch 58 / P0 | Muc 4: player-facing error va producer log boundary | Da them reason mapper dung chung cho alert/log, audit regression internal code va technical token | `js/engine.js`, `js/main.js`, `tools/verify_log_narrative.js`, `PLAYER_FACING_ERROR_BOUNDARY_2026-09-17.md` |
| Batch 59 / P1 | Muc 9: completion va node history theo lop | Da them DTO mapCompletionDetailed voi visited/sub-location/structure/weather/actor/faction va history coverage | `js/expansion.js`, `tools/verify_review_batches.js`, `MAP_COMPLETION_LAYERED_NODE_HISTORY_CONTRACT_2026-09-17.md` |
| Batch 60 / P1 | Muc 10: travel weighting day du | Da them terrain/weather/influence/structure/party weights vao canonical travel DTO va regression preview-commit | `js/expansion.js`, `tools/verify_review_batches.js`, `TRAVEL_WEIGHT_RESOLVER_CANONICAL_2026-09-17.md` |
| Batch 61 / P0 | Muc 24: structure cost/durability/upgrade | Da loai bo hardcode cost/repair/upgrade/refund, moi action doc STRUCTURE_CATALOG duy nhat | `js/expansion.js`, `STRUCTURE_RUNTIME_CATALOG_SINGLE_SOURCE_2026-09-17.md` |
| Batch 62 / P1 | Muc 11: weather alias/severity/effect resolver | Da them weatherSnapshot, alias suong_mu, effect catalog, catalog validation va regression | `js/expansion.js`, `tools/verify_review_batches.js`, `WEATHER_RESOLVER_ALIAS_EFFECT_CANONICAL_2026-09-17.md` |
| Batch 63 / P1 | Muc 13: NPC scheduler state machine/topology | Da them validator state/edge/queue/sub-location/needs va regression invalid topology | `js/expansion.js`, `tools/verify_review_batches.js`, `NPC_SCHEDULER_STATE_MACHINE_VALIDATOR_2026-09-17.md` |
| Batch 64 / P1 | Muc 14: witness/rumor/memory propagation | Da chot confidence/TTL/source priority, sua comparator va them validator multi-node/offline | `js/expansion.js`, `tools/verify_review_batches.js`, `RUMOR_WITNESS_PROPAGATION_POLICY_2026-09-17.md` |
| Batch 65 / P1 | Muc 15: companion mutation/recovery/save invariant | Da them validator state/loyalty/corruption/mastery/damage ledger/recovery, noi vao expansion validation va regression mutation round-trip | `js/expansion.js`, `tools/verify_review_batches.js`, `COMPANION_MUTATION_SAVE_INVARIANTS_2026-09-17.md` |
| Batch 66 / P1 | Muc 19/26: contested opportunity rollback va reward idempotency | Da them opportunity history retention, expiry online/offline, validator pending/history va regression khong lap reward/history | `js/expansion.js`, `tools/verify_review_batches.js`, `CONTESTED_OPPORTUNITY_ROLLBACK_REWARD_LEDGER_2026-09-17.md` |
| Batch 67 / P2 | Muc 22/28: performance profile va runtime budget | Da them validator profile/FPS/render/history/NPC/offline window va metrics gate, regression weak profile | `js/expansion.js`, `tools/verify_review_batches.js`, `08_DATA_RUNTIME_PERFORMANCE_BUDGET_VALIDATOR_2026-09-17.md` |
| Batch 69 / P2 | Muc 19-28: UI surface, novel log, archive retention va performance gate | Da chay UI/log/archive/profile gate, xac nhan history 300, IndexedDB retry, novel grouping va baseline save; sua validation performance theo baseline device-independent | `js/ui.js`, `js/expansion.js`, `tools/verify_ui_surface_contract.js`, `tools/verify_indexeddb_archive.js`, `tools/profile_runtime_budget.js`, `UI_ARCHIVE_PERFORMANCE_GATE_2026-09-17.md` |
| Batch 70 / P1 | Muc 24/32: World UI ownership policy | Da them renderer ownership/quyen sua-nang cap-thao do, dung chung structureManagerDecision va regression UI contract | `js/ui.js`, `tools/verify_ui_surface_contract.js`, `WORLD_STRUCTURE_OWNERSHIP_UI_2026-09-17.md` |
| Batch 71 / P0 | Muc 1/2/9/10: map coordinate/influence canonical validation gate | Da noi validator coordinates/influence/cache revision vao validateExpansionState va regression node thieu toa do | `js/expansion.js`, `tools/verify_review_batches.js`, `MAP_CANONICAL_VALIDATION_GATE_2026-09-17.md` |
| Batch 72 / P1 | Muc 5/7: Fate effect composition va no-duplicate audit | Da them validator base/enhancement/relationship/evolution/advanced namespace, deterministic stat check va save-load regression | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `FATE_EFFECT_COMPOSITION_VALIDATOR_2026-09-17.md` |
| Batch 73 / P0 | Muc 4/20: runtime log surface validator | Da them validator history sau action/save-load, technical token sanitization, empty narrative va grouping novel theo ngay; noi vao validateExpansionState | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `LOG_SURFACE_RUNTIME_VALIDATOR_2026-09-17.md` |
| Batch 74 / P1 | Muc 12: war front/cascade state validator | Da them validator faction topology/score/status/outcome/intervention, noi vao expansion validation va regression offline clone deterministic + invalid topology | `js/expansion.js`, `tools/verify_review_batches.js`, `WAR_CASCADE_STATE_VALIDATOR_2026-09-17.md` |
| Batch 75 / P1 | Muc 3/6/17: profession namespace va discovery lifecycle | Da them validator discovery status/transition day, giu codexClues tach metadata, noi vao expansion validation va regression status sai | `js/expansion.js`, `tools/verify_review_batches.js`, `DISCOVERY_LIFECYCLE_NAMESPACE_VALIDATOR_2026-09-17.md` |
| Batch 68 / product | Muc 29-33: product policy decay/path/Dị Thể/ownership/offline | Da chot policy canonical, API snapshot/validator, structure permission resolver va regression faction repair/upgrade | `js/expansion.js`, `tools/verify_review_batches.js`, `PRODUCT_POLICIES_29_33_CANONICAL_2026-09-17.md` |
| Batch 56 / P1 | Muc 8: UI Mệnh theo instance | Da bo sung instance metadata, relationship history, evolution va advanced usage vao Fate card; requirement UI contract | `js/ui.js`, `FATE_INSTANCE_CARD_UI_CONTRACT_2026-09-17.md` |
| Batch 1 / P0 | Mục 1–4: influence canonical, map structure, spawn node, weather/log regression | Đang triển khai | `js/expansion.js`, `js/engine.js`, `MAP_INFLUENCE_STRUCTURE_CANONICAL_2026-09-16.md` |
| Batch 1 / P0 | Mục 6–8: nghề chính/phụ, canonical namespace, Fate advanced actions | Đã có nền runtime; tiếp tục audit UI | `PROFESSION_NAMESPACE_AND_SAVE_NORMALIZATION_2026-09-16.md`, `FATE_ADVANCED_ACTIONS_CANONICAL_2026-09-16.md` |
| Batch 2 / P1 | Mục 9–22: world tick, NPC, content/discovery, action/log/save | Đang triển khai | World/NPC/discovery/action/log đã có runtime; còn audit catalog, companion, contested rollback và archive gate |
| Batch 3 / P2 | Mục 23–28: UI/performance/archive/reward canonical | Đang triển khai | Reward ledger, structure lifecycle và performance baseline đã có; còn hoàn thiện catalog/retention/device budget |
| Batch 4 / product | Mục 29–33: decay, song tu, Dị Thể, ownership, offline NPC | Đã cho phép Codex tự chốt baseline; chưa hoàn tất | Sẽ bổ sung quyết định canonical vào các requirement tương ứng |

### Baseline đã chốt để code

- Mục 1: influence của node đã khám phá dùng canonical gradient; node chưa khám phá chỉ nhận event influence và không lộ faction gradient.
- Mục 2: node spawn lấy từ `character.startLocationId` và tọa độ bản đồ 100×100; không mặc định tọa độ `[0,0]` khi có node hợp lệ.
- Mục 3: Truyền Tống Trận chỉ hợp lệ ở node spawn, node tông môn/faction đang tham gia, phường thị/thành/cảng hoặc outpost đã lập; công trình có owner và lịch sử chuyển giao.
- Mục 4: Hộ Giới Đại Trận giảm hao Thanh Tỉnh, nguy cơ chạm trán và nguy cơ nguyền; hiệu lực đi qua resolver runtime.
- Mục 6: save cũ không cần tương thích ngược; save mới và save được load qua canonical normalization.
- Mục 7: Nghịch Mệnh, Trấn Mệnh, Thiên Cơ và Mệnh Đổi dùng namespace `fateAdvancedActions`, tách khỏi enhancement/evolution/relationship.
- Mục 8: quan hệ Mệnh dùng `decayPolicy: "none"`; không tự tụt stage/XP theo thời gian.
- Mục 9: node history/completion đã có sub-location, structure và faction change; đang bổ sung actor/weather/replay coverage.
- Mục 11: weather catalog canonical đã có severity/alias/history; còn thiếu data-driven duration/transition UI toàn bộ.
- Mục 12–14: world tick, war cascade, NPC edge scheduler và rumor propagation đã có nền runtime idempotent; cần test trực tiếp và hoàn thiện offline aggregate.
- Mục 17: discovery/Dị Chí đã tách state `discovered/verified/collected/rewarded`; không được suy diễn thành Con Đường/Nghề/Dị Thể.
- Mục 20: legacy history đã derive `statDisplay` và dùng ID deterministic khi deserialize.
- Mục 21: replay-aware RNG đã phủ map encounter, search/discovery, loot, cultivation, combat bonus, breakthrough, market và SAN branch; random khởi tạo nhân vật vẫn là random tạo mới, không phải replay commit.
- Mục 24: structure đã có repair/upgrade/disable runtime và UI tab Thế giới; cần bổ sung resource balance/performance gate.

### Quy tắc hoàn tất một mục

Một mục chỉ được chuyển sang **ĐÃ HOÀN TẤT** khi có đủ: requirement canonical, state/schema rõ ràng, runtime resolver/action, UI nếu có bề mặt người chơi, migration/normalization, và ít nhất một regression check deterministic. Các mục còn thiếu một thành phần vẫn phải ghi rõ **ĐANG TRIỂN KHAI**, không được đánh dấu hoàn tất giả.
