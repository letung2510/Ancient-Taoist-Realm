# Bản đồ — Hợp đồng runtime (transaction, world tick, view model)

## Mục đích

Quy tắc kỹ thuật chung cho mọi mutation bản đồ: transaction, phiên bản, idempotency, thứ tự world tick, view model duy nhất cho UI, chống exploit và log. Save/schema/hiệu năng chung thuộc [../data-runtime/README.md](../data-runtime/README.md); log tiểu thuyết thuộc [../ui-action-log/README.md](../ui-action-log/README.md).

## Dữ liệu & trạng thái

```ts
CurrentRegionViewModel { node: NodeSummary; subLocations; exits: ExitView[]; edgeStates: Record<string, EdgeState>;
  localState; weather: WeatherView; influence; incidents; npcSummary: { total; visible; byRole };
  actions: ActionView[]; travelTask: TravelTaskView | null; version: number }
```

- `state.mapState` (`version`, journal, structures, fastTravel, eventInfluence, notes); `stateVersion` trên node, cạnh, travel task.

## Rules

### Transaction

| ID | Rule |
|---|---|
| MAP-RT-001 | Mọi mutation bản đồ chạy qua `resolveMapTransaction({ actionId, actorId, expectedVersion, validate, apply, rollback })` và trả `{ success, reason, data, transactionId, stateVersion }`. Bắt buộc: kiểm tra phiên bản, topology, fog, quyền, chi phí, combat, phong tỏa; snapshot trước mutation; journal; rollback đầy đủ nếu đã trừ tài nguyên mà tạo task/node thất bại. |
| MAP-RT-002 | Idempotency key = `actionId + actorId + inputHash`; retry không nhân đôi chi phí, sự kiện, log hay phần thưởng. |
| MAP-RT-003 | Node, cạnh, travel task có `stateVersion`; mutation yêu cầu `expectedVersion`; lệch phiên bản trả `MAP_VERSION_CONFLICT`, không tự ghi đè. Hai mutation cùng `stateVersion` không thể cùng commit. |
| MAP-RT-004 | Nhiều modifier thời tiết cùng loại → dùng modifier severity cao nhất. |
| MAP-RT-005 | Mã lỗi kỹ thuật (`ROUTE_NOT_FOUND`, `MAP_VERSION_CONFLICT`, …) luôn được dịch sang tiếng Việt ở UI. |

### World tick

| ID | Rule |
|---|---|
| MAP-RT-010 | Thứ tự nguyên tử mỗi tick, không đảo: (1) chốt `gameDay/worldTick` mới → (2) thời tiết vùng và incident → (3) topology runtime/edge state → (4) tuyến NPC, tuần tra, lưu lượng → (5) influence/heatmap từ snapshot mới → (6) bảo trì outpost/công trình → (7) resolve travel task của người chơi → (8) phát sinh bảng tin, invalidate view model → (9) ghi snapshot/journal, phát event UI. |
| MAP-RT-011 | Mọi resolver đọc cùng `tickSnapshot`; không resolver nào đọc trạng thái nửa cũ nửa mới. Resolver dùng save state, ngày game và event key — deterministic. |

### View model và UI

| ID | Rule |
|---|---|
| MAP-RT-020 | UI chỉ render `CurrentRegionViewModel` (`getCurrentRegionViewModel`); không đọc trực tiếp catalog hay tự suy luận điều kiện action. View model tái tạo deterministic từ cùng snapshot. |
| MAP-RT-021 | `mapInfluenceSnapshot`, `mapFogState`, `mapOwner`, completion là projection dẫn xuất; UI không tính influence hay mutate catalog. |
| MAP-RT-022 | Không có action map nào commit mà thiếu preview tương ứng. |

### Chống exploit

| ID | Rule |
|---|---|
| MAP-RT-030 | Không cho caller tự gửi `risk`, `days`, `distance`, `owner` hoặc `fogState`; runtime tính lại. |
| MAP-RT-031 | Journal lưu hash trước/sau để phát hiện save bị chỉnh sửa. |
| MAP-RT-032 | Không hoàn tiền hai lần; không nhận thưởng khi task chưa hoàn thành; fast travel không bỏ qua quest/combat lock hay incident bắt buộc (MAP-TRV-026, MAP-TRV-052). |

### Log và tương thích

| ID | Rule |
|---|---|
| MAP-RT-040 | Sự kiện tới nơi, khám phá, đổi thế lực, kết quả hành trình dùng hợp đồng log tiểu thuyết chung; văn bản cho người chơi là projection cảnh, tọa độ và payload chẩn đoán chỉ là metadata. Mọi log người chơi thấy đi qua `narrativeSafe`; chỉ event debug giữ command echo và mã nội bộ. |
| MAP-RT-041 | Nhật ký bản đồ: timeline lọc theo di chuyển, khám phá, thế lực, incident, giao dịch, tuần tra, công trình; mỗi bản ghi có node, sub-location, ngày game, kết quả và action nguồn để giải thích vì sao tuyến đổi trạng thái. |
| MAP-RT-042 | Archive log là hàng đợi retry độc lập; không làm thất bại hay chặn action gameplay khi IndexedDB không khả dụng. |
| MAP-RT-043 | Field mới đều additive; thay đổi map/NPC/log không đổi schema dữ liệu tĩnh; deserialize save cũ idempotent; mọi thay đổi state lưu qua `serialize()`. |

### API

| ID | Rule |
|---|---|
| MAP-RT-050 | API canonical: `resolveMapTopology`, `getCurrentRegionViewModel`, `getLocalState`, `listLocalActivities`, `previewLocalActivity`, `resolveLocalActivity`, `listRouteOptions`, `edgeState`, `startTravel`, `advanceTravelTask`, `interruptTravel`, `resumeTravel`, `cancelTravel`, `mapIncidentPreview`, `resolveMapIncident`, `setMapNote`, `resolveMapTransaction`. `locationExits()` và láng giềng map dùng cùng resolver topology. |

## Acceptance

1. Hai mutation cùng `stateVersion` không thể cùng commit.
2. Route bị phong tỏa giữa chặng luôn chuyển interruption, không đổi `locationId` sai.
3. Fog 0 không rò metadata qua API, tooltip, DOM hoặc cache.
4. `CurrentRegionViewModel` tái tạo deterministic từ cùng snapshot.
5. Rollback khi mutation lỗi giữa chừng.
6. Gate: `node tools/verify_review_batches.js`, `node tools/verify_save_envelope.js`, `node tools/verify_log_narrative.js`, `node tools/verify_utf8_integrity.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-RT-001..002 | js/expansion.js:`resolveMapTransaction` | Khớp |
| MAP-RT-003 | js/expansion.js:`stateVersion`, `expectedVersion` (`MAP_VERSION_CONFLICT`) | Khớp |
| MAP-RT-010..011 | js/expansion.js:`tickSnapshot`, `simulateWorldUntil` | Khớp |
| MAP-RT-020..021 | js/expansion.js:`getCurrentRegionViewModel` | Khớp |
| MAP-RT-031 | js/expansion.js:`resolveMapTransaction` | Thiếu |
| MAP-RT-040 | js/engine.js:`narrativeSafe` | Khớp |
| MAP-RT-042 | tools/verify_indexeddb_archive.js | Khớp |
| MAP-RT-050 | js/expansion.js (export `GameExpansion`) | Khớp |
