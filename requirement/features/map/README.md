# Bản đồ

## Phạm vi

Hệ tọa độ Oxy 0..100, registry node, sinh node procedural, Lân Cận (Khu vực hiện tại) và Thiên Đồ, di chuyển theo hướng và chi phí, hành trình nhiều ngày, Truyền Tống Trận, node đản sinh, sương mù/khám phá, nội dung node, ảnh hưởng thế lực và công trình bản đồ, binh đoàn, thời tiết và NPC ở góc nhìn bản đồ.
Không gồm: mô phỏng thế lực/chiến tranh cấp thế giới, danh mục thời tiết, hội thoại/quan hệ NPC, nội dung sự kiện khám phá, luật trình bày chi tiết UI (`UI-LM-*`).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Cấu trúc thế giới, tên và lớp node | [world-structure.md](world-structure.md) | `MAP-WS-`, `MAP-LC-040..051` | js/engine.js:`generateOpenWorldNode`, `validateOpenWorldGrid` |
| Bối cảnh Vạn Giới Lộ | [world-lore.md](world-lore.md) | `MAP-LORE-` | data (`WORLD_MAP`, `FACTION_DATA`) |
| Lân Cận | [local-view.md](local-view.md) | `MAP-LC-001..006`, `MAP-LV-` | js/ui.js:`renderLocalMap`, js/engine.js:`localBfsConstellation` |
| Di chuyển theo hướng và chi phí | [movement-and-cost.md](movement-and-cost.md) | `MAP-MV-`, `MAP-LC-010..037` | js/engine.js:`move`, `movementCandidates`; js/expansion.js:`canonicalTravelPlan` |
| Hành trình, phương tiện, fast travel | [travel-and-fast-travel.md](travel-and-fast-travel.md) | `MAP-TRV-` | js/expansion.js:`startTravel`, `travelPlan`, `teleportAnchorEligibility` |
| Node đản sinh | [origin-nodes.md](origin-nodes.md) | `MAP-ORG-` | js/engine.js:`ORIGIN_NODE_CATALOG`, `resolveOriginNode` |
| Sương mù, khám phá, sử ký | [fog-and-discovery.md](fog-and-discovery.md) | `MAP-FOG-` | js/expansion.js:`mapFogState`, `mapCompletionDetailed`, `appendNodeHistory` |
| Nội dung node, sub-location, hoạt động | [node-content.md](node-content.md) | `MAP-NODE-` | js/expansion.js:`getNodeDetail`, `listLocalActivities`, `resolveMapIncident` |
| Ảnh hưởng, công trình, tuyến thương mại | [influence-and-structures.md](influence-and-structures.md) | `MAP-INF-` | js/expansion.js:`mapInfluenceSnapshot`, `buildMapStructure`, `claimOutpost` |
| Binh đoàn và không khí | [armies-and-atmosphere.md](armies-and-atmosphere.md) | `MAP-ARMY-`, `MAP-ATM-` | js/expansion.js:`updateArmies`, `armyAction`; js/engine.js:`subLocationWrongness` |
| Thời tiết trên bản đồ | [weather-on-map.md](weather-on-map.md) | `MAP-WTH-` | js/expansion.js:`updateWeather`, `travelPlan` |
| NPC sống trên bản đồ | [npc-on-map.md](npc-on-map.md) | `MAP-NPC-` | js/expansion.js:`updateNpcSchedules`, `resolveNpcWeatherReaction` |
| Thiên Đồ | [thien-do-overview.md](thien-do-overview.md) | `MAP-TD-` | js/ui.js:`renderWorldMap`, `mapCamera` |
| Hợp đồng runtime | [map-runtime-contract.md](map-runtime-contract.md) | `MAP-RT-` | js/expansion.js:`resolveMapTransaction`, `getCurrentRegionViewModel` |

## Phụ thuộc

- [../ui-action-log/README.md](../ui-action-log/README.md) — trình bày Lân Cận (`UI-LM-*`), log tiểu thuyết, Action Bar.
- [../weather/README.md](../weather/README.md) — danh mục, alias, hysteresis thời tiết.
- [../world-simulation/README.md](../world-simulation/README.md) — world tick, thế lực, chiến tranh, worldview atmosphere, offline.
- [../npc/README.md](../npc/README.md), [../relationship/README.md](../relationship/README.md) — hội thoại, quan hệ.
- [../discovery/README.md](../discovery/README.md) — sự kiện khám phá, phiên tìm kiếm.
- [../character/README.md](../character/README.md) — tạo nhân vật, ý định hành trình.
- [../realm-progression/README.md](../realm-progression/README.md), [../path/README.md](../path/README.md) — cảnh giới, danh xưng Con Đường.
- [../data-runtime/README.md](../data-runtime/README.md) — save/migration.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-05 | Miền Oxy `0..100`; thay miền `[-50,49]` với `(0,0)` = Thiên Nguyên Sơn. | MAP-WS-001 |
| 2026-10-09 | D03: di chuyển theo hướng dùng stride thay bước kề; BFS/validator giữ delta cardinal. D08: tên hiện trong phạm vi Lân Cận (thay "chỉ tên node hiện tại/quan trọng"). D09: layout là lớp seed riêng (thay `screenX = centerX + dx×scale` với jitter ≤ 4 px). | MAP-LC-010, MAP-LC-041, MAP-LC-001/002 |
| 2026-10-22 | Q1 = B: Bắc = `y−1` ở mọi nơi (hợp đồng 2026-10-05); bỏ quy ước Bắc = `y+1` và `screenY = 100 − …`. Runtime phải sửa dấu Bắc/Nam trong `movementCandidates` và phép chiếu y trong `ui.js:renderLocalMap`. | MAP-LC-003, MAP-LC-010, MAP-WS-002 |
| 2026-10-22 | Q2 = A: lệch ngang Đông/Tây giữ hướng về Bắc như thiết kế D04 — với Q1 = B là `(x±a, y−b)`; không dùng lệch đối xứng; chấp nhận độ trôi Đông-Bắc. | MAP-LC-010 |
| 2026-10-22 | Q3 = A: chi phí dùng Manhattan + `gameDays`; không chuyển Euclid + giờ/phút. | MAP-WS-004, MAP-LC-015, MAP-LC-030 |
| 2026-10-22 | Q4 = A: preview chỉ hiện tập đích có thể tới và min/max, giấu ứng viên đã chốt (khớp `UI-LM-063`); UI chỉ đọc `movementDirectionPublicPreview`, engine giữ `movementCandidatePreview` làm API nội bộ. | MAP-LC-020, UI-LM-063 |
| 2026-10-22 | Save cũ không đổi tọa độ/cạnh khi sửa trục y; chỉ xóa `movementCommitments` không còn hợp lệ. Tên node procedural: bảng từ vựng 12×12 theo nhóm `wild`/`danger`, khử trùng theo vùng khi tạo, tên 5 mẫu cũ giữ nguyên. | MAP-LC-010, MAP-LC-040 |
| 2026-10-22 | Chỉ resolver di chuyển canonical sinh node lazy trong miền; bỏ thiết kế `proceduralGate` (`maxChildren`, `allowedDirections`…) và "mọi hướng không có cạnh khai báo đều `ROUTE_NOT_FOUND`". | MAP-WS-020, MAP-WS-054 |
| 2026-10-22 | Bỏ lộ node ngẫu nhiên (40% + 10%/lần khám phá) và "luôn giữ 2–4 node ẩn tự sinh"; thay bằng sự kiện fog 0–3 + sinh lazy khi di chuyển. Nhìn Toàn Cảnh nâng tối đa một cấp fog. | MAP-FOG-010, MAP-NODE-031 |
| 2026-10-22 | Bỏ vành khoảng cách + nhiễu Simplex; dùng công thức runtime (anchor vùng gần nhất, danger theo `abs(x)+abs(y)`). | MAP-WS-021 |
| 2026-10-22 | Bỏ "Open Node Graph" (không vẽ tuyến, đi tự do giữa mọi node, complete graph); dùng cạnh thật và không tự đi tới landmark ở V1. | MAP-LV-010, MAP-LC-014, MAP-TRV-040 |
| 2026-10-22 | Một người chơi mỗi save; thời tiết chung theo vùng trong save; bỏ bản đồ persistent dùng chung nhiều người chơi. | MAP-WTH-001, MAP-FOG-022 |
| 2026-10-22 | Số sub-location thành trấn: giữ 3–5 (MAP-NODE-001), không dùng 4–6 của bản restored 2.2 §3.3; runtime không ép khoảng nào (node thiếu `subLocations` mặc định một `main`), nên giá trị 3–5 là mục tiêu dữ liệu. | MAP-NODE-001 |
| 2026-10-22 | Merge từ restored 2.2: `MapEdgeMeta`, namespace `static`/`runtime`, vòng đời node `archived`, gate toàn vẹn mở rộng, cạnh Sơn Môn Thiên Huyền Tông (tên theo `data/tu_tien_factions.json`, không phải "Thông"), hình ảnh Lân Cận. Không có `gateId`/`proceduralGate`. | MAP-MV-010..011, MAP-WS-017..018, MAP-WS-024..025, MAP-WS-034, MAP-WS-050, MAP-LV-046..048 |
| 2026-10-22 | Số sub-location theo bảng loại node; node hoang dã procedural có đúng một sub-location `main`. | MAP-NODE-001 |
| 2026-10-22 | Ngưỡng vùng biên quy đổi: `x/y ≤ 5` hoặc `≥ 95`. | MAP-WS-040 |
| 2026-10-22 | Schema binh đoàn theo runtime (`nodeId`, không tọa độ tự do); `generalNpcId`/`eliteCount` tùy chọn. | MAP-ARMY-001 |
| 2026-10-22 | Danh mục thời tiết = 8 trạng thái runtime; bỏ các danh sách 6/7 loại cũ. | MAP-WTH-010..016 |
| 2026-10-22 | Kích thước chấm, hit target, nhãn thuộc `UI-LM-030/031/032` (thay hệ số 0,45 và hit 12 px); "ba chấm hướng" thay bằng tập đích của hướng đang chọn. | MAP-LV-022, MAP-LV-023 |
| 2026-10-22 | Riêng tư node chưa khám phá thực thi ở tầng projection (node vẫn sinh đủ dữ liệu khi tạo). Fog 3 = ≥ 5 lần tới hoặc khảo sát/outpost/trạm. Ngưỡng `historyCoverage` 5 dấu vết giữ làm baseline. | MAP-FOG-003, MAP-FOG-021, MAP-FOG-032 |
| 2026-10-22 | `act_explore_<hướng>` bị loại; công trình canonical `teleport_array`/`world_ward` với alias legacy (chốt 2026-09-16). | MAP-MV-002, MAP-INF-020 |

## Gate

`node tools/verify_local_movement_weather.js` · `node tools/verify_review_batches.js` · `node tools/verify_map_producer_matrix.js` · `node tools/verify_world_producer_matrix.js` · `node tools/verify_opening_intent.js` · `node tools/verify_browser_ui_contract.js` · `node tools/verify_game.js` · `node tools/verify_utf8_integrity.js`
