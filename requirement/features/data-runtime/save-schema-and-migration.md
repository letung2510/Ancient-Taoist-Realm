# Data & Runtime — Save schema và migration

## Mục đích

Định nghĩa save canonical, cách thêm state mới, migration đa phiên bản và xử lý dữ liệu không nhận diện, sao cho save cũ luôn load được, round-trip không đổi nghĩa và không phát thưởng/sự kiện ngoài ý muốn.

## Dữ liệu & trạng thái

| Thành phần | Nội dung |
|---|---|
| Schema save | `tu_vi_quy_di_canonical_v13` (save version 13) |
| `state.meta.featureVersions` | `worldSimulation, relationships, techniqueEvolution, professions, contracts, itemLegacy, companions, discoveries, reincarnationLegacy, fateEvolution` (mỗi module tự tăng version, không tăng save version cho từng field) |
| `state.meta.saveId` | ID save ổn định cho replay envelope |
| `state.worldSimulation` | `seed, lastProcessedDay, nextEventSeq, events{}, regionState{}, factionState{}, diplomacy{}, wars{}, npcState{}, hiddenRealms{}, scheduledTasks[]` |
| `state.unknownContent.events` | Sự kiện thế giới không nhận diện, trạng thái `dormant` |

## Rules

| ID | Rule |
|---|---|
| DATA-SAV-001 | Mọi state mới có default ở `createState`, normalize ở `deserialize`, round-trip serialize và test migration. |
| DATA-SAV-002 | Không persist cache dẫn xuất (tổng modifier active, class icon, kết quả pathfinding, snapshot ảnh hưởng hết hạn); tính lại sau load. |
| DATA-SAV-003 | Save chỉ lưu instance data + ID tham chiếu catalog (ví dụ Mệnh: `fateId, isActive, relationshipStage, relationshipPoints…`; tổ chức: `organizationId`); không chép field tĩnh (`desc`, `effects`, `tags`) hay toàn bộ catalog vào save. Khi load tra lại catalog qua index (xem [performance-budget](performance-budget.md)). |
| DATA-SAV-004 | `migrateV12ToV13` chỉ tạo state rỗng (`ensureWorldSimulation`, `relationshipEvents`, `professionState`, `contractBoard`, `prisoners`, `intel`, `companion`, `discoveries`, `player.fateEvolutions`, `reincarnationLegacy`, `meta.featureVersions`); không phát thưởng, không sinh sự kiện, không đổi quan hệ. |
| DATA-SAV-005 | Dữ liệu không nhận diện khi load: event/template lạ → `cancelled`, dọn modifier, ghi một migration note (sự kiện thế giới lạ giữ ở `state.unknownContent.events` trạng thái `dormant`); thức tỉnh vật phẩm lạ → giữ raw, hiệu ứng ngủ, nhánh thức tỉnh lạ giữ niêm phong trên record legacy của item; nhánh tiến hóa Mệnh lạ → `ready`, giữ trial, chưa trừ chi phí; địa điểm lạ → `safeTravelDestination` nhưng giữ record mộ/Bí Cảnh để audit. Không âm thầm xóa. |
| DATA-SAV-006 | Fixture đa phiên bản qua `deserialize` thật: v1 (chỉ `player.hiddenProfession`, thiếu `professionState`, map state, Dị Thể) và v7 (`professionState.hiddenId` có nhưng `secondaryId`/mirror chưa chuẩn). Sau migration Nghề Ẩn nằm đúng slot phụ, `validateExpansionState` pass, serialize → deserialize không đổi namespace. |
| DATA-SAV-007 | History legacy thiếu ID/statDisplay được nâng cấp deterministic (`legacy_<n>`); save cũ thiếu `meta.saveId` được cấp ID deterministic từ identity ổn định của nhân vật. |
| DATA-SAV-008 | Trước khi nâng save version runtime phải có fixture cho version mới. |
| DATA-SAV-009 | Journey hợp lệ `tam_su`/`quy_tong`/`an_the` ở stage ≥2 có tổ chức đích canonical, chưa là thành viên và chưa quyết định gia nhập → `deserialize()` khôi phục `pendingGuildChoice = true` kể cả khi save cũ thiếu cờ; save/load giữ `pendingGuildChoice`. |
| DATA-SAV-010 | Nhân vật canonical (`toCanonicalCharacter`/`fromCanonicalCharacter`) persist `fate.relationships` và `fate.evolutions`; adapter ưu tiên record này, chỉ fallback dữ liệu cũ khi thật sự tồn tại. |

## Acceptance

- Fixture v1/v7/v12 load, validate, round-trip ổn định; không có reward hay history mới sinh ra trong migration.
- Gate: `verify_review_batches.js`, `verify_save_envelope.js`, `verify_game.js`, `verify_opening_intent.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| DATA-SAV-001 | engine.js:`createState`, `deserialize`; expansion.js:`ensureExpansionState` | Khớp |
| DATA-SAV-004 | engine.js:`migrateV12ToV13`; expansion.js:`featureVersions` | Khớp |
| DATA-SAV-005 | expansion.js:`unknownContent`; engine.js:`safeTravelDestination` | Khớp |
| DATA-SAV-006 | expansion.js: `professionState.hiddenId/secondaryId` normalize | Khớp |
| DATA-SAV-007 | engine.js/expansion.js: `saveId`, `normalizeHistoryEvent` | Khớp |
| DATA-SAV-009 | engine.js:`pendingGuildChoice` | Khớp |
| DATA-SAV-010 | engine.js: canonical character adapter (`fateEvolutions`) | Khớp |
