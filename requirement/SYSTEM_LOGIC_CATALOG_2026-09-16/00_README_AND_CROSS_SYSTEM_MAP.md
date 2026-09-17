# SYSTEM LOGIC CATALOG 2026-09-16

## Mục đích

Đây là bộ tài liệu độc lập dùng để đọc và hiểu toàn bộ logic runtime của game mà không phải mở từng requirement cũ. Mỗi feature có một hồ sơ riêng; hồ sơ phải mô tả đồng thời dữ liệu, state, resolver, action, UI, log, save/migration, quan hệ với feature khác và phần còn thiếu.

## Quy ước đọc

- `CAT-*` là catalog/data bất biến, không được sửa trong runtime.
- `STATE-*` là state của save hiện tại, có thể thay đổi.
- `RES-*` là resolver tính toán hoặc kiểm tra điều kiện, không tự ý commit state nếu chưa ghi rõ.
- `ACT-*` là action do người chơi hoặc tick thế giới gọi.
- `UI-*` là view model và vùng hiển thị.
- `LOG-*` là event/narrative; không dùng text log làm nguồn dữ liệu nghiệp vụ.
- `MIG-*` là migration/compatibility.

## Bản đồ feature

| ID | Hồ sơ | Phạm vi |
|---|---|---|
| CORE-FATE | [01_FATE_AND_MENH_SO.md](01_FATE_AND_MENH_SO.md) | Mệnh Số, kho, quan hệ, Dưỡng Mệnh, Cộng Minh, Hoán Mệnh, tiến hóa |
| CORE-PROGRESSION | [02_PROGRESS_PATH_PROFESSION.md](02_PROGRESS_PATH_PROFESSION.md) | Tu vi, cảnh giới, đột phá, Con Đường, Dị Thể, nghề chính/phụ, nghề ẩn |
| WORLD-MAP | [03_MAP_WORLD_CONSTRUCTION.md](03_MAP_WORLD_CONSTRUCTION.md) | Map V2, tọa độ, influence, fog, node, sub-location, travel, Công Trình |
| WORLD-SIM | [04_WORLD_SIM_FACTION_WEATHER.md](04_WORLD_SIM_FACTION_WEATHER.md) | tick thế giới, mùa, thời tiết, faction, chiến tranh, đại hội, công trình |
| INTERACTION | [05_NPC_RELATIONSHIP_COMPANION.md](05_NPC_RELATIONSHIP_COMPANION.md) | NPC, scheduler, quan hệ, NPC-NPC, companion, quest, thư, bounty |
| CONTENT | [06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md](06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md) | Công Pháp, vật phẩm, nghề, chế tác, Dị Chí, cơ duyên, bí cảnh |
| UI-LOG | [07_UI_ACTION_LOG_SAVE.md](07_UI_ACTION_LOG_SAVE.md) | action priority, UI tab, novel log, scene batching, save/archive |
| PLATFORM | [08_DATA_RUNTIME_PERFORMANCE.md](08_DATA_RUNTIME_PERFORMANCE.md) | data loading, migration, deterministic RNG, performance, test gates |
| GAPS | [09_IMPLEMENTATION_GAPS_AND_DECISIONS.md](09_IMPLEMENTATION_GAPS_AND_DECISIONS.md) | trạng thái đã code, thiếu, mâu thuẫn, quyết định cần chốt |

## Luồng phụ thuộc canonical

```text
Catalog data
  -> normalize/migration
  -> state root
  -> resolver thuần
  -> action transaction
  -> pushHistory/narrative event
  -> UI view model
  -> serialize/archive
```

Không được để UI tự tính điểm Mệnh, influence, điều kiện nghề hoặc chi phí di chuyển. UI chỉ gọi resolver và hiển thị DTO.

## State root tối thiểu

`state.player` giữ tiến trình cá nhân; `state.gameClock` giữ thời gian; `state.history` giữ event; `state.worldSimulation` giữ thế giới; `state.mapState` giữ map discovery/claim/fog; `state.professionState`, `state.pathRitualState`, `state.fateInstances` giữ các subsystem mở rộng. Mỗi subsystem phải có initializer idempotent trong migration.

## Quy tắc chéo bắt buộc

1. Catalog không bị mutate bởi action.
2. Action kiểm tra điều kiện trước khi trừ tài nguyên.
3. Transaction lỗi phải rollback tài nguyên và không tạo success log.
4. Mọi event player-visible đi qua `createGameEvent`/`pushHistory`.
5. Narrative và stat display tách nhau; mã nội bộ không xuất hiện trong UI.
6. Ngày game dùng absolute day; UI chỉ định dạng lại.
7. Offline tick dùng cùng resolver với online tick, không tạo nhánh logic thứ hai.
8. State cũ phải được normalize trước khi resolver đọc.

## Cách đánh dấu trạng thái

- **ĐÃ CODE**: có runtime và test hiện hành.
- **MỘT PHẦN**: có state/API nhưng thiếu UI, persistence hoặc edge case.
- **THIẾT KẾ**: requirement đã rõ nhưng runtime chưa đủ.
- **CHƯA CHỐT**: cần quyết định sản phẩm trước khi code.

Mỗi file con bắt buộc có mục `Note chưa hoàn thiện` ở cuối từng feature, không gom tất cả gap vào một câu chung.
