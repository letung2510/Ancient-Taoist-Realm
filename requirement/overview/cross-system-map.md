# Bản đồ liên feature

Mỗi feature có một thư mục `features/<feature>/` với README làm chỉ mục (quy ước: [CONVENTIONS.md](../CONVENTIONS.md)). Hợp đồng chi tiết giữa nhiều feature nằm ở [cross-system](../features/cross-system/README.md); trạng thái runtime hiện hành ở [STATUS.md](../STATUS.md).

## Feature → README

| Feature | README | Prefix | Phụ thuộc chính |
|---|---|---|---|
| Nhân vật | [character](../features/character/README.md) | `CHR-` | fate, path, technique (opening grant), map (origin node) |
| Mệnh Số | [fate](../features/fate/README.md) | `FATE-` | realm-progression, path, technique, reward |
| Cảnh giới & đột phá | [realm-progression](../features/realm-progression/README.md) | `PRG-` | fate, path, technique (core), character |
| Con Đường | [path](../features/path/README.md) | `PATH-` | fate, technique, profession (namespace tách), realm-progression |
| Dị Thể | [di-the](../features/di-the/README.md) | `DT-` | character, fate |
| Nghề nghiệp | [profession](../features/profession/README.md) | `PROF-` | path (namespace tách), technique (recipe), discovery, map |
| Bản đồ | [map](../features/map/README.md) | `MAP-` | world-simulation, weather, npc, ui-action-log |
| Thời tiết | [weather](../features/weather/README.md) | `WTH-` | world-simulation, map, npc |
| Mô phỏng thế giới | [world-simulation](../features/world-simulation/README.md) | `WSIM-` | map, npc, weather, reward, data-runtime |
| NPC | [npc](../features/npc/README.md) | `NPC-` | relationship, map, world-simulation, discovery |
| Quan hệ | [relationship](../features/relationship/README.md) | `REL-` | npc, companion, reward |
| Đồng hành | [companion](../features/companion/README.md) | `CMP-` | npc, relationship, reward |
| Công Pháp | [technique](../features/technique/README.md) | `TEC-` | fate, path, profession, cross-system, reward |
| Khám phá | [discovery](../features/discovery/README.md) | `DSC-` | reward, world-simulation, npc |
| Phần thưởng | [reward](../features/reward/README.md) | `RWD-` | fate, technique, discovery |
| Giao diện & log | [ui-action-log](../features/ui-action-log/README.md) | `UI-` | mọi feature (chỉ đọc DTO) |
| Dữ liệu & runtime | [data-runtime](../features/data-runtime/README.md) | `DATA-` | mọi feature (save/migration) |
| Liên feature | [cross-system](../features/cross-system/README.md) | `CSX-` | technique, fate, path, profession, world-simulation |

## Tầng dữ liệu nhân vật

```text
Mệnh Số (fate) ──modifier/requirement──► Công Pháp (technique) ──► Kỹ năng/action
      │                                        ▲
      └──affinity──► Con Đường (path) ─────────┘
Nghề (profession) ⟂ Con Đường (namespace tách)   Dị Thể (di-the) ⟂ path/profession
```

## Truy vết một action chuẩn

```text
UI click
 -> action id
 -> submitActionId
 -> action handler
 -> resolver/guard
 -> transaction mutate state
 -> pushHistory/createGameEvent
 -> UI render state + grouped story log
 -> serialize/archive
```

Symbol runtime theo feature: [runtime-symbol-index.md](runtime-symbol-index.md). Nguyên tắc chung và quyết định liên feature: [principles-and-decisions.md](principles-and-decisions.md).
