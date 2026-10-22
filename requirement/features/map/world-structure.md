# Bản đồ — Cấu trúc thế giới

## Mục đích

Định nghĩa hệ tọa độ Oxy, registry node duy nhất, schema node, sinh node procedural, điểm neo (anchor), đặt tên node và các gate kiểm tra toàn vẹn. Đây là nguồn sự thật không gian cho mọi feature khác (di chuyển, thời tiết, NPC, thế lực, khám phá).

## Dữ liệu & trạng thái

| Nguồn | Vai trò |
|---|---|
| `WORLD_MAP.locations` | Node authored (anchor) + tọa độ canonical; projection UI |
| `WORLD_MAP.nodePool` | Registry hợp nhất đọc chung cho map, NPC, quái, tổ chức, thời tiết, thám hiểm, incident |
| `WORLD_MAP.addresses` | Địa chỉ Oxy ổn định của tông môn, tổ chức, phường thị, điểm khởi đầu/tái sinh |
| `GameData.LOCATIONS` | Lớp tương thích hệ cũ (đọc) |
| `state.openWorld.nodes` | Node runtime đã sinh (save) |
| `state.openWorld.coordinates` | `nodeId → [x, y]` — nguồn tọa độ runtime |
| `state.openWorld.coordinateIndex` | `"x,y" → nodeId` |
| `state.openWorld.exits` / `exitMeta` | Cạnh đã commit (cardinal + stride, xem [movement-and-cost.md](movement-and-cost.md)) |
| `state.visitedLocations` | Tập node đã tới (fog, xem [fog-and-discovery.md](fog-and-discovery.md)) |

Schema node chuẩn:

```js
{
  id, name /* displayName ổn định */, coordinate: { x, y }, regionId, climateZone,
  mapNodeType, // origin | organization | market | town | village | harbor | waystation | wilderness | landmark | hidden_realm | danger_zone
  organizationId, terrain, exits: { bac, nam, dong, tay }, npcs, enemies, searchable,
  dangerLevel /* 1–5 */, corruption, linhKhiDensity /* 1–5 */, subLocations, authored, generated
}
```

## Rules

### Hệ tọa độ

| ID | Rule |
|---|---|
| MAP-WS-001 | Miền gameplay là lưới số nguyên khép kín `0..100` cho cả hai trục (lý thuyết 101 × 101 = 10.201 ô). Engine không bao giờ khởi tạo toàn bộ ô; node được sinh lazy. Tọa độ gameplay luôn là số nguyên, độc lập kích thước màn hình. |
| MAP-WS-002 | Delta bốn hướng cố định (hợp đồng 2026-10-05): Bắc `(x, y−1)`, Nam `(x, y+1)`, Đông `(x+1, y)`, Tây `(x−1, y)`. Dùng cho láng giềng BFS, exits cardinal và validator. Di chuyển theo hướng của người chơi dùng stride (MAP-LC-010). Quy ước trục chung: MAP-LC-003. |
| MAP-WS-003 | Mỗi tọa độ chỉ có một node. `coordinateIndex["x,y"] = nodeId`. API: `coordinateKey(x,y)`, `getNodeAtCoordinate`, `ensureNodeAtCoordinate` (tọa độ đã có node → trả node đó, không tạo bản sao), `neighborCoordinate`, `validateCoordinateUniqueness`. |
| MAP-WS-004 | Khoảng cách gameplay = Manhattan `abs(ax−bx) + abs(ay−by)` (chốt 2026-10-22, xem README). Euclid chỉ dùng cho độ dời hiển thị (MAP-LC-015), không thay luật láng giềng hay chi phí. |

### Registry và node

| ID | Rule |
|---|---|
| MAP-WS-010 | Mọi node (authored + runtime) phải đồng bộ vào registry hợp nhất (`LOCATIONS`, `openWorld.nodes`, `openWorld.coordinates`, `coordinateIndex`, `WORLD_MAP.nodePool`). Không subsystem nào tự tạo bản sao node ngoài registry; NPC/quái/combat tham chiếu node tồn tại trong registry. |
| MAP-WS-011 | `coordinate` bắt buộc với mọi node authored và runtime. Mọi start location phải có tọa độ hợp lệ trước khi tạo state. |
| MAP-WS-012 | `regionId` quyết định vùng khí hậu, thời tiết, influence và bulletin. Region của một hành động được suy ra từ node đích; thời tiết và NPC hiển thị dùng cùng ngữ cảnh node-region. |
| MAP-WS-013 | `organizationId` chỉ có ở node tổ chức hoặc node bị tổ chức chi phối, không đại diện cho tư cách thành viên. `npcs`/`enemies` là pool spawn ban đầu; hiện diện runtime lưu riêng trong `npcState`/combat state. |
| MAP-WS-014 | `exits` là cache dẫn đường sinh từ tọa độ và cạnh đã commit, không phải nguồn sự thật. Exits legacy chỉ dùng trong migration. Mọi liên kết là hai chiều (A –Đông→ B ⇒ B –Tây→ A); sau mỗi mutation chạy invariant reciprocal. |
| MAP-WS-015 | Catalog tĩnh (`LOCATIONS`, `WORLD_MAP.locations`, cạnh authored) không bao giờ bị di chuyển, NPC hoặc sinh node ghi đè. Thay đổi runtime là overlay trong `state.openWorld`. |
| MAP-WS-016 | Quyền di chuyển tới node tổ chức độc lập với quyền gia nhập: di chuyển không kiểm tra membership; gia nhập chỉ qua `guildEligibility()`/`joinGuild()`. |
| MAP-WS-017 | Mọi node có `namespace` ∈ `static` (authored, nằm trong `LOCATIONS`/`WORLD_MAP.locations`) hoặc `runtime` (nằm trong `state.openWorld.nodes`). Id node runtime mang tiền tố `runtime:` (node bí cảnh giữ `hidden:`, [../cross-system/discovery-and-hidden-realm.md](../cross-system/discovery-and-hidden-realm.md)); node runtime bắt buộc có `parentNodeId` (node sinh ra nó) và `regionId`. Resolver topology đọc theo `namespace`, không đoán theo id. |
| MAP-WS-018 | Hai namespace tách biệt: di chuyển, NPC và sinh node không ghi vào `LOCATIONS`/`WORLD_MAP.locations` (MAP-WS-015) và không sửa `exits` của node static; cạnh nối node static với node runtime chỉ nằm ở overlay `openWorld.exits`/`exitMeta`, hai chiều (MAP-WS-014). Snapshot catalog tĩnh không đổi sau 10.000 lượt di chuyển. |

### Sinh node procedural

| ID | Rule |
|---|---|
| MAP-WS-020 | `generateOpenWorldNode(state, x, y)` chỉ được gọi bởi resolver di chuyển canonical (và bản sao cô lập khi preview). Ngoài miền → `null`; tọa độ đã có node/anchor → trả node đó. ID `open_<x>_<y>`. |
| MAP-WS-021 | Kết quả quyết định bởi hash tọa độ (cùng tọa độ → cùng node trong một thế giới): vùng = anchor vùng gần nhất (bình phương Euclid tới `WORLD_MAP.regions[].x/y`); `dangerLevel = min(5, 1 + floor((abs(x)+abs(y))/8) + hash%2)`; `linhKhiDensity = max(1, 5 − floor((abs(x)+abs(y))/12))`; `mapNodeType = danger_zone` nếu danger ≥ 4, ngược lại `wilderness`; có quái khi danger ≥ 3; một sub-location `main`. |
| MAP-WS-022 | Node sinh ra được lưu vĩnh viễn trong save, không roll lại khi quay về hoặc nạp save. Thay đổi do người chơi (chiếm động phủ, thanh tẩy, phá hủy) ghi đè lên node đã lưu. |
| MAP-WS-023 | Node mới phải có mô tả, lối quay về (reciprocal), tài nguyên và quái hợp vùng; không có ngõ cụt giả. Nội dung roll từ bảng dữ liệu có sẵn (vùng, NPC/quái, event pool), không sinh bừa. |
| MAP-WS-024 | Vòng đời node runtime: `createdDay`, `expiresDay?` (không có = không hết hạn), `parentNodeId`, `generationSeed` (hash tọa độ, MAP-WS-021), `status` ∈ `active`, `archived`. Hết hạn → `archived`, không xóa cứng khi còn được `state.log`, quest hoặc `visitedLocations` tham chiếu. Không có `gateId` (cổng procedural đã bỏ, xem README). |
| MAP-WS-025 | Cạnh trỏ tới node `archived` chuyển `blockadeState = blocked` (MAP-MV-010) và hiển thị "chưa rõ" (tuyến xám, MAP-LV-042); không tự trỏ sang node khác. Node `archived` bị ẩn khỏi Thiên Đồ theo MAP-LC-051 nhưng vẫn ở save và lịch sử; `archived` là điều kiện ẩn bắt buộc, MAP-LC-051 là điều kiện ẩn cho node không hết hạn. |

### Điểm neo và tổ chức

| ID | Rule |
|---|---|
| MAP-WS-030 | Mọi tông môn, tổ chức, phường thị, điểm khởi đầu/tái sinh có địa chỉ Oxy ổn định qua `WORLD_MAP.addresses`; mỗi tổ chức có node tổng đàn riêng (`mapNodeType: organization`). |
| MAP-WS-031 | Vị trí tổ chức đặt bằng random có seed, deterministic theo world seed, khoảng cách tối thiểu theo `pyramid_tier`: T1 12 ô, T2 8, T3 5, T4–5 3. Reload hoặc nâng phiên bản không đổi tọa độ đã lưu. |
| MAP-WS-032 | Hub an toàn (`travel_hubs`: `son_mon`, `van_phong` — hub tông môn/nghi thức; `tay_mac_khoi_diem`, `vo_tan_hai_khoi_diem`, `bac_nguyen_khoi_diem` — thành/trạm an toàn) có `human_npc=true`, `safe_for_ritual=true`. Vô Tận Hải có NPC Tạ Hải Sinh tại Lưu Vân Hải Cảng. Hành động về hub: [travel-and-fast-travel.md](travel-and-fast-travel.md). |
| MAP-WS-033 | Cụm cố định: mọi cạnh authored hai chiều trong `LOCATIONS.exits` trừ tuyến được đánh dấu một chiều; tuyến khởi điểm vùng nối ngược về mạng chính. |
| MAP-WS-034 | Sơn Môn Thiên Huyền Tông (`son_mon`) chỉ có đúng các cạnh đã khai báo (Bắc → `van_phong`, Đông → `linh_dien`, Tây → `truyen_phap`) cộng cạnh stride đã commit hợp lệ (MAP-LC-013); không nối tới node không thuộc tập đó, kể cả node kề tọa độ. Test: từ `son_mon` mọi hướng chỉ tới node trong tập này hoặc `ROUTE_NOT_FOUND` (MAP-WS-054). |

### Vùng biên

| ID | Rule |
|---|---|
| MAP-WS-040 | Node có `x ≤ 5`, `x ≥ 95`, `y ≤ 5` hoặc `y ≥ 95` là `isEdge` (quy đổi ngưỡng cũ `max(abs(x), abs(y)) ≥ 45` sang miền 0..100, chốt 2026-10-22). Vùng biên không phải tường chắn; UI hiển thị thông báo biên vực và các action Thám hiểm biên vực, Dựng trạm tiền tiêu, Xin hộ tống qua biên, Mở tuyến thương mại — mỗi action qua transaction ([map-runtime-contract.md](map-runtime-contract.md)), có cost/risk riêng, không xóa liên kết. Hướng ra ngoài miền luôn disabled (MAP-LC-012). |

### Tên node và lớp node

| ID | Rule |
|---|---|
| MAP-LC-040 | Mọi node (kể cả procedural) có `displayName` ổn định, sinh bởi `generateNodeName(state, nodeId, regionId, mapNodeType)` rồi **lưu một lần** vào node khi tạo (hoặc lần truy cập đầu với node cũ chưa có tên hợp lệ). RNG di chuyển không bao giờ dùng cho tên. Thuật toán (`namingVersion = 1`, `fnv1a` 32-bit như `openWorldHash`): `worldSeed = state.worldSimulation.seed` (thiếu → chuỗi `"local-world"`); `nameSeed = fnv1a(worldSeed + "\|" + nodeId + "\|naming-v1")`; nhóm từ `group = mapNodeType === "danger_zone" ? "danger" : "wild"` (chưa có trường địa hình riêng; khi có thì mở rộng bảng); `name = NOUNS[group][nameSeed % 12] + " " + MODIFIERS[(nameSeed >>> 8) % 12]`. Bảng từ vựng (12 mục mỗi bảng, thứ tự cố định, đổi bảng phải tăng `namingVersion`): NOUNS.wild = Dã Lộ, Cổ Trạm, Hoang Nguyên, Thạch Lâm, Khê Cốc, Tùng Lĩnh, Bình Nguyên, Hồ Bạc, Cổ Đạo, Sơn Cước, Thảo Nguyên, Lộ Khẩu; NOUNS.danger = Tuyệt Cốc, Hắc Uyên, Quỷ Vực, Huyết Nguyên, Tử Địa, Hàn Đàm, Ma Lâm, Phong Nhai, Sương Uyên, Cốt Cương, Ám Hà, Hung Địa; MODIFIERS = Vô Danh, Tàn Nguyệt, Linh Hoang, Hắc Thủy, Thiên Khuyết, Cô Phong, Thanh Vân, Bạch Lộ, Mịt Sương, Cổ Tùng, Xích Thạch, Vọng Nguyệt. **Khử trùng** (khi tạo node, trong cùng `regionId` và không trùng tên landmark/anchor cố định): nếu tên đã dùng → thử `nameSeed' = fnv1a(nameSeed + ":" + k)` với `k = 1…8`; vẫn trùng → thêm hậu tố ` · {tên vùng}`; vẫn trùng → thêm số thứ tự chữ Hán Việt (`Nhị, Tam, Tứ, Ngũ, Lục, Thất, Bát, Cửu, Thập, Thập Nhất…`) theo số node cùng tên gốc trong vùng. Kết quả phụ thuộc seed và thứ tự tạo node nhưng đã lưu nên không đổi. Không reroll sau khi lưu; không hiện mã nội bộ hay Oxy; Oxy là metadata, không bao giờ nối vào tên. Cập nhật từ vựng không đổi tên save cũ; thời tiết/địa hình không đổi tên (chỉ sự kiện đổi tên tường minh). **Migration:** chỉ node có tên dạng `open_<x>_<y>` hoặc có hậu tố tọa độ được sinh lại bằng thuật toán này; node mang một trong 5 tên cũ (`Dã Lộ Vô Danh`, `Cổ Trạm Tàn Nguyệt`, `Linh Hoang Vực`, `Hắc Thủy Bến`, `Thiên Khuyết Ngoại Biên`) giữ nguyên. Đích di chuyển khóa theo `nodeId`, không theo tên. |
| MAP-LC-041 | Biết tên không có nghĩa đã tới. Node trong phạm vi Lân Cận hiện tên mặc định kể cả chưa tới; nội dung và sự kiện có thể vẫn ẩn. Chỉ ẩn tên khi node đó có luật bí mật riêng. Tới nơi đổi trạng thái thành visited; tên không đổi. |
| MAP-LC-050 | Lớp node: **anchor** (authored trong `WORLD_MAP.locations`: thành, landmark cốt truyện, dungeon/boss lớn; không bao giờ bị sinh đè); **procedural** (chỉ tạo bởi resolver di chuyển, deterministic theo seed tọa độ, khởi đầu chưa khám phá); **discovered** (procedural đã tới; lưu quái, tài nguyên, sự kiện). Anchor hoặc node có sẵn tại tọa độ luôn được tái dùng. |
| MAP-LC-051 | Dọn node thừa: node procedural không có sự kiện quan trọng và không nằm trên tuyến chính bị ẩn khỏi Thiên Đồ; vẫn ở trong save và vẫn hiện ở Lân Cận và lịch sử. |

### Gate toàn vẹn

| ID | Rule |
|---|---|
| MAP-WS-050 | `validateOpenWorldGrid(state)`: tọa độ trong miền, không trùng, hướng đúng, `coordinateIndex` khớp, exits cardinal đúng ô kề; cạnh stride hợp lệ khi có `exitMeta.movement = "stride"` (MAP-LC-013). Mở rộng: validator còn phải báo (a) cạnh hai chiều không khớp (A –hướng→ B mà B không có cạnh ngược về A, MAP-WS-014); (b) node `namespace = runtime` có `parentNodeId`/`regionId` ngoài registry hoặc cạnh trỏ sang namespace không hợp lệ (MAP-WS-017); (c) một node có hơn 4 con procedural cardinal (mỗi hướng tối đa một node kề, MAP-WS-003); (d) node static bị thêm/xóa/sửa cạnh sau khi tạo state (MAP-WS-018); (e) vi phạm MAP-WS-034. |
| MAP-WS-051 | `validateMapCoordinates(state)` kiểm tra pool static, world-map và procedural: thiếu tọa độ, ngoài miền, trùng `(x,y)`. |
| MAP-WS-052 | `validateMapCanonicalState(state)` (gọi bởi `validateExpansionState`): node tọa độ duy nhất trong miền; mọi node đã khám phá resolve qua `mapInfluenceSnapshot`; DTO influence có node id, pressure, confidence, source/revision; snapshot cache dùng đúng `influenceRevision` và khớp node id. |
| MAP-WS-053 | Fail-closed: node không có tọa độ hợp lệ → influence trả `source: "invalid_coordinate"`, DTO rỗng, `coordinateValid: false`; travel từ chối. Không bao giờ thay bằng `[0,0]`. |
| MAP-WS-054 | Lỗi route trả thất bại (`ROUTE_NOT_FOUND`), không lặng lẽ tạo node tùy ý. |

### Migration

| ID | Rule |
|---|---|
| MAP-WS-060 | Save cũ: giữ `openWorld.coordinates` hợp lệ; node static thiếu tọa độ map theo bảng migration cố định; node mang tên tọa độ được đổi tên hiển thị nhưng giữ ID; không xóa node, không reset `visitedLocations`. |
| MAP-WS-061 | Sau load chạy sửa liên kết ngược (`repairInvalidMapExits`); save không có edge metadata đọc là `normal`; NPC `currentNodeId` được map về registry. Mọi field mới là additive; deserialize idempotent. |

## Acceptance

- Mọi node có tọa độ hợp lệ, không trùng; Bắc/Nam và Đông/Tây đối xứng; từ một node trong miền resolve được bốn hướng (hoặc disabled ở biên).
- Node runtime không có tên chứa tọa độ; tên ổn định qua reload. Cùng `worldSeed` + `nodeId` + `mapNodeType` → cùng tên (`generateNodeName` thuần, trước khử trùng); khử trùng: hai node cùng vùng có tên gốc giống nhau thì node tạo sau mang tên khác (rehash `k`, rồi hậu tố vùng, rồi số thứ tự); save cũ có `open_12_34` → đổi tên theo thuật toán, ID giữ nguyên, tên 5 mẫu cũ giữ nguyên.
- Node tổ chức có tọa độ và node riêng; di chuyển tới không cần membership; gia nhập vẫn kiểm tra eligibility.
- Snapshot catalog tĩnh trước/sau 10.000 lượt di chuyển không đổi.
- Save/load giữ tọa độ, visited, exits và exitMeta.
- Gate: `node tools/verify_review_batches.js` (fixture thiếu tọa độ), `node tools/verify_world_data_audit.js`, `node tools/verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-WS-001 | js/engine.js:`OPEN_WORLD_BOUNDS` | Khớp |
| MAP-WS-002 | js/engine.js:`OPEN_WORLD_DELTAS` | Khớp |
| MAP-WS-003 | js/engine.js:`generateOpenWorldNode` (`coordinateIndex`) | Khớp |
| MAP-WS-004 | js/expansion.js:`travelPlan` (Manhattan) | Khớp |
| MAP-WS-010 | js/engine.js:`runtimeLocationPool`, `ensureOpenWorld` | Khớp |
| MAP-WS-020..023 | js/engine.js:`generateOpenWorldNode` | Khớp |
| MAP-WS-030 | js/engine.js:`mapAddressesAtNode` | Khớp |
| MAP-WS-031 | data (`WORLD_MAP.addresses`) | Khớp |
| MAP-WS-032 | js/engine.js (`FACTION_DATA.world.travel_hubs`) | Khớp |
| MAP-WS-017 | js/engine.js:`generateOpenWorldNode` (id `open_<x>_<y>`, cờ `openWorld: true`; không có `namespace`/`runtime:`/`parentNodeId`); js/expansion.js:`hidden:` + `parentNodeId` (chỉ bí cảnh) | Lệch |
| MAP-WS-018 | js/engine.js:`ensureOpenWorld`, `runtimeLocationPool`; tools/verify_review_batches.js, tools/verify_game.js (snapshot catalog sau di chuyển dài) | Lệch |
| MAP-WS-024..025 | — (`expiresDay`, `archived`, `generationSeed` không tồn tại trên node map; `expiresDay` hiện chỉ có ở quest/rumor/formation) | Thiếu |
| MAP-WS-034 | js/engine.js:`locationExits` (gộp mọi node kề tọa độ trong `getNodeAtCoordinate`, không giới hạn theo cạnh khai báo của `son_mon`: bac `van_phong`, dong `linh_dien`, tay `truyen_phap`) | Lệch |
| MAP-WS-040 | — (`isEdge`, `edgeActions`) | Thiếu |
| MAP-LC-040 | js/engine.js:`generateOpenWorldNode`, `proceduralNodeDisplayName(x, y)` (pool 5 tên theo hash tọa độ, không `worldSeed`/`namingVersion`, không khử trùng), `normalizeNodeDisplayName` (nhánh `open_x_y`) → thay bằng `generateNodeName` | Lệch |
| MAP-LC-041 | js/ui.js:`renderLocalMap` | Khớp |
| MAP-LC-050 | js/engine.js:`generateOpenWorldNode` | Khớp |
| MAP-LC-051 | js/ui.js:`renderWorldMap` | Thiếu |
| MAP-WS-050 | js/engine.js:`validateOpenWorldGrid` (tọa độ, index, kề, stride — Khớp); phần mở rộng (a)–(e): không có kiểm tra cạnh hai chiều/namespace/số con/catalog static; `repairInvalidMapExits` chỉ sửa sau load | Lệch |
| MAP-WS-051 | js/expansion.js:`validateMapCoordinates` | Khớp |
| MAP-WS-052 | js/expansion.js:`validateMapCanonicalState` | Khớp |
| MAP-WS-053 | js/expansion.js:`mapInfluenceSnapshot` | Khớp |
| MAP-WS-054 | js/engine.js:`move` (`ROUTE_NOT_FOUND`) | Khớp |
| MAP-WS-061 | js/expansion.js:`repairInvalidMapExits` | Khớp |
