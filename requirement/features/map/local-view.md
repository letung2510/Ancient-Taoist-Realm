# Bản đồ — Lân Cận (Khu vực hiện tại)

## Mục đích

Màn hình mặc định để người chơi ra quyết định: node hiện tại, node quanh đó, tuyến thật, marker NPC/quái/cơ duyên/tuần tra và hướng di chuyển. Mọi thay đổi bản đồ áp dụng ở Lân Cận trước khi mở rộng sang Thiên Đồ. Quy tắc trình bày chi tiết (kích thước chấm, nhãn, hit target, danh sách tên, xem trước) thuộc [../ui-action-log/README.md](../ui-action-log/README.md) (`UI-LM-*`).

## Dữ liệu & trạng thái

- Nguồn không gian: `WORLD_MAP.locations`, `state.openWorld.coordinates`, `coordinateIndex` ([world-structure.md](world-structure.md)). Tọa độ hiển thị là giá trị suy ra.
- `GameEngine.localBfsConstellation(state, 39)` → `{ nodeIds, treeNodes[{ nodeId, parentNodeId, parentEdgeId, depth, firstDirection, discoveryOrder }], treeEdges, gameplayEdges }`.
- Cạnh thật: `locationExits(state)` + `openWorld.exitMeta` (loại `normal` cardinal, `stride`, `teleport`; `star_path` dành riêng, chưa hoạt động).
- Mức fog: `mapFogState` ([fog-and-discovery.md](fog-and-discovery.md)).

## Rules

### Lớp tọa độ và bố cục

| ID | Rule |
|---|---|
| MAP-LC-001 | Hai lớp. Gameplay: `nodeId`, world x/y (di chuyển, biên, địa hình, thời tiết, khoảng cách, chi phí). Trình bày: `layoutX/layoutY` theo `nodeId` (chấm, tuyến hiển thị, highlight, nhãn, hit test). Không bao giờ ghi layout ngược vào tọa độ thế giới; click/tap resolve `nodeId`, không suy tọa độ từ pixel. |
| MAP-LC-002 | Layout ổn định có seed: `seedUI = stableHash(worldSeed, nodeId, layoutVersion)`, jitter giới hạn mỗi trục (khởi điểm ±0,3 ô, luôn < 0,5 ô để node cách ≥ 1 ô giữ thứ tự trục chính). Offset độc lập với hướng đang chọn, node hiện tại, tập hiển thị, camera và kích thước màn hình; không reroll khi mở/hover/zoom/đổi hướng; không dùng force layout liên tục. Bước chống chồng (tùy chọn) phải deterministic, giới hạn độ dời và cache theo `layoutVersion`. Chỉ bảo đảm gần/xa tương đối; khoảng cách gần bằng nhau có thể đổi chỗ. |
| MAP-LC-003 | Một quy ước trục duy nhất cho resolver láng giềng, ứng viên stride, phép chiếu renderer và validator: Bắc = `y−1` (hợp đồng 2026-10-05, chốt lại 2026-10-22). Màn hình luôn Bắc trên, Tây trái, Đông phải, Nam dưới; bản đồ không xoay theo hướng đang chọn. Phép chiếu: `screenX = 50 + dx × scale / 5`, `screenY = 50 + dy × scale / 5` với `dx = x − xHiện tại`, `dy = y − yHiện tại` (không đảo dấu; `screenY` tăng khi `y` tăng, nên node Bắc `dy < 0` nằm phía trên). Áp cho node, tuyến, ứng viên preview và highlight vùng; không còn comment/hằng "World +y là Bắc". `OPEN_WORLD_DELTAS` (`bac: [0,-1]`, `nam: [0,1]`) và `movementCandidatesFrom` (MAP-LC-010) dùng cùng quy ước. Save cũ không cần đổi: tọa độ node là dữ liệu gốc, chỉ phép chiếu và công thức ứng viên mới thay đổi (xem migration ở MAP-LC-010). |
| MAP-LC-004 | Camera theo vị trí layout của người chơi; di chuyển chỉ pan camera, không bố cục lại node khác. Pan, zoom, recenter không đổi RNG, chi phí, vị trí hay tên. |
| MAP-LC-005 | Lân Cận là bản đồ tương đối: chỉ có la bàn và chú giải định tính "Gần — Xa", không thước ô/km. Thiên Đồ/minimap có thể dùng tỉ lệ thật và phải ghi rõ là bề mặt khác. Origin/node ghim ngoài viewport chỉ hiện hướng; không bao giờ kéo vào khung để giả khoảng cách. |
| MAP-LC-006 | Địa hình ảnh hưởng gameplay (sông, vách, cầu, vùng thời tiết) vẽ trên Lân Cận phải khớp vị trí marker đã dịch; nếu không có phép biến đổi chung, hiển thị nguy hiểm dưới dạng marker node/tuyến thay vì đường sông chính xác. Họa tiết trang trí (cây, sương) không bao giờ quyết định khả năng đi qua. |

### Chọn tập node (Dynamic Local BFS)

| ID | Rule |
|---|---|
| MAP-LV-001 | Lân Cận hiển thị tối đa 39 node gồm node hiện tại; mục tiêu 30–39 khi graph đủ lớn. Graph nhỏ/rời thì hiển thị ít hơn; không bao giờ độn node giả hay sinh node gameplay như tác dụng phụ của render. |
| MAP-LV-002 | Chọn bằng BFS deterministic từ node hiện tại trên cạnh đã xác nhận (`locationExits()` + stride đã commit); tie-break theo Bắc, Đông, Nam, Tây rồi `nodeId`. Khi vượt trần, giữ trước node hiện tại, visited, discovered, pinned, important, rồi các node BFS gần nhất; không lấy mẫu ngẫu nhiên. Kết quả ≤ 38 cạnh cây khi liên thông. |
| MAP-LV-003 | Node hiện tại luôn ở tâm. Trạng thái visited, chưa tới, fog, important, teleport, nơi sinh tách biệt với loại node. Node ghim bắt buộc được khử trùng theo `nodeId` và có thể đặt ở mép tương ứng (`offscreenPinned`); ghim không tạo tuyến. |
| MAP-LV-004 | Layout/selection memo theo node hiện tại + phiên bản map state; không tính lại mỗi khung hình. Không bao giờ render toàn bộ lưới 101 × 101. Render không đổi save, RNG, fog, discovery hay khả năng tới. |

### Cạnh thật và frontier

| ID | Rule |
|---|---|
| MAP-LV-010 | `map-path` chỉ vẽ giữa hai node đã materialize mà `locationExits()` xác nhận kề nhau (cardinal) hoặc có cạnh stride đã commit trong `openWorld.exitMeta` (MAP-LC-013). Vị trí gần trên màn hình không phải bằng chứng có cạnh; không thêm cạnh chéo/suy luận. |
| MAP-LV-011 | Ô Oxy kề chưa có node là frontier: không phải node, không phải cạnh, không đếm vào trần 39, không có identity; nếu hiển thị phải dùng marker frontier riêng, không nhận `map-path`. Chỉ trở thành node qua resolver di chuyển canonical. |
| MAP-LV-012 | Node tổ chức/tông môn và node có `waystation`/`teleport_array` mang màu tím; node tím gần nhất (theo độ sâu BFS) nhận tuyến dẫn đường tím nét đứt dọc cây BFS. |

### Mã màu và trạng thái

| ID | Rule |
|---|---|
| MAP-LV-020 | Token màu ngữ nghĩa: hiện tại `#F4C95D`; fog chưa khám phá `#53616C` không glow; đã biết trung tính `#D6E4E8`; visited `#A6C8D8`; chủ Chính đạo `#4A91D9`; chủ Ma/Tà `#C34F74`; tổ chức trung lập `#9A8AAE`; landmark quan trọng `#E7B95A`; nguy hiểm cao `#D94B62`; chỉ nghe đồn `#AAB6C2` (tên mờ, không glow). Có thể tới: xanh lam; cơ duyên/bí cảnh: tím; sự kiện: hổ phách. Màu chủ sở hữu là tín hiệu phụ. Danger/event/opportunity thêm viền/icon riêng, không xóa token chủ sở hữu hay fog. Mỗi màu đi kèm hình dạng/viền/văn bản truy cập được. |
| MAP-LV-021 | Thứ tự ưu tiên khi metadata xung đột: hiện tại > riêng tư fog > danger/event/opportunity > landmark quan trọng > chủ sở hữu > trung tính/visited. Tooltip không lộ loại node, chủ, độ nguy hiểm trước khi khám phá. |
| MAP-LV-022 | Nền Lân Cận là trường sao có seed: game mới chỉ có node hồi sinh/hiện tại sáng; node visited giữ sáng; tín hiệu đã biết chưa tới có thể mờ. Hướng di chuyển hiển thị qua tập đích có thể tới của hướng đang chọn (MAP-LC-020). |
| MAP-LV-023 | Oxy, khoảng cách, visited, loại node, khả năng tới, hướng và trạng thái ghim thuộc tooltip/chi tiết, không thuộc nhãn. Nhãn theo MAP-LC-041 và `UI-LM-032`; kích thước chấm, hit target theo `UI-LM-030`/`UI-LM-031`. |

### Marker trên Lân Cận

| ID | Rule |
|---|---|
| MAP-LV-030 | Marker NPC: tổng NPC static + NPC runtime đang sống tại node, chỉ hiện từ fog 2. |
| MAP-LV-031 | Marker Quái: quái/địch định nghĩa tại node và combat đang diễn ra ở node hiện tại. |
| MAP-LV-032 | Marker Cơ duyên: `pendingContestedOpportunity` đang chờ tại đúng node, glow tím, không hiện sang node khác. |
| MAP-LV-033 | Marker Tuần tra nằm trên cạnh mà NPC tuần tra thực sự đang đi; không tạo node giả. |
| MAP-LV-034 | Marker là lớp phủ không che chấm; tooltip ghi số lượng và trạng thái. Khi đổi node, marker tính lại từ `state.locationId`, `npcState`, `pendingContestedOpportunity` và fog mới; không dùng cache UI cũ. |

### Thanh thông tin và lớp hiển thị

| ID | Rule |
|---|---|
| MAP-LV-040 | Đầu panel Lân Cận cố định: tên node và vùng, loại địa điểm, cấp khám phá, trạng thái địa bàn (Ổn định / Tranh chấp / Biên giới), ảnh hưởng nổi bật, nguy cơ tổng hợp, hành trình hiện tại nếu đang đi. |
| MAP-LV-041 | Ba lớp: A bản đồ khu vực (node, tuyến, ảnh hưởng); B chi tiết node ([node-content.md](node-content.md)); C hành trình (xác nhận tuyến, phương tiện, hộ tống, ETA, chi phí, nguy cơ, điều kiện phong tỏa — [travel-and-fast-travel.md](travel-and-fast-travel.md)). Không mở modal chồng modal; màn hình nhỏ chuyển B/C thành bottom sheet có nút đóng. |
| MAP-LV-042 | Tuyến có màu theo trạng thái kèm ký hiệu: xanh thông suốt, vàng hạn chế, đỏ nguy hiểm (nét đứt), tím phong tỏa (gạch chéo), xám chưa rõ. Tuyến đang đi hiện tiến độ; tuyến bị chặn/hạn chế/thời tiết xấu có tooltip nguyên nhân. |
| MAP-LV-043 | Lân Cận cung cấp trực tiếp Thám Hiểm, bulletin, công trình và thao tác NPC mà không chuyển tab. Thiên Đồ chỉ cung cấp bối cảnh vĩ mô, không ghi đè node/vùng/thời tiết đang hiển thị ở Lân Cận. |
| MAP-LV-044 | Trạng thái rỗng/lỗi: Không có tuyến → "Chưa có tuyến đường hợp lệ từ đây"; chưa đủ fog → "Cần thêm manh mối để nhìn rõ khu vực này"; phong tỏa → thế lực, lý do, thời hạn dự kiến, lựa chọn hộ tống/đường vòng; thiếu tài nguyên → số đang có/số cần; hành trình gián đoạn → giữ log, cho tiếp tục, đổi tuyến hoặc hủy. |
| MAP-LV-045 | Tiếp cận: hỗ trợ Tab/Enter/Escape, focus trap trong sheet, reduced motion, tương phản WCAG AA, `aria-label` tiếng Việt cho mọi icon; desktop bản đồ trái/chi tiết phải, tablet trên/dưới, mobile bottom sheet. Mục tiêu mở panel < 300 ms desktop, < 800 ms máy tầm trung. |

### Hình ảnh bản đồ

Nét đứt cạnh nguy hiểm và gạch chéo phong tỏa: MAP-LV-042. Fallback SVG/CSS, cache sprite, culling: MAP-TD-030..032. Quy ước giao diện chung: [../ui-action-log/local-map-ui.md](../ui-action-log/local-map-ui.md).

| ID | Rule |
|---|---|
| MAP-LV-046 | Mỗi vùng có ảnh nền bản đồ độ phân giải 2x (so với kích thước hiển thị) và texture địa hình; ảnh lỗi/thiếu dùng nền SVG/CSS thay thế, vẫn thao tác được. |
| MAP-LV-047 | Icon node có ba cỡ 24/32/48 px (nhỏ/vừa/lớn theo loại node); node lớn (tông môn, thành, vương kinh, landmark) dùng icon landmark riêng, không dùng chung icon với trạm nhỏ. Kích thước hit target vẫn theo `UI-LM-030`/`UI-LM-031`. |
| MAP-LV-048 | Zoom out giảm mật độ icon (ẩn icon phụ, giữ node hiện tại, ghim, important); tooltip của mọi node vẫn đầy đủ (MAP-LV-023) kể cả khi icon bị ẩn. |

## Acceptance

- Node hiện tại ở tâm; ≤ 39 node, ≤ 38 cạnh cây khi liên thông; chỉ cạnh thật; cùng state → cùng layout.
- Bắc ở trên: node có `y` nhỏ hơn hiển thị cao hơn. Người chơi tại `(50,50)`: node `(50,49)` có `screenY < 50`, node `(50,51)` có `screenY > 50`; chọn Bắc thì mọi ứng viên preview có `y < 50` (`(50,49)…(51,47)`) và nằm phía trên chấm hiện tại; Nam thì phía dưới; Đông ở bên phải và lệch lên trên (`y − b`), Tây ở bên trái và lệch lên trên.
- Tám trạng thái màu phân biệt được không chỉ bằng màu; nhãn và hit target dùng được ở 39 node.
- Thứ tự trục chính giữ nguyên cho node cách ≥ 1 ô.
- Render không đổi save/RNG/fog.
- Gate: `node tools/verify_local_movement_weather.js`, `node tools/verify_browser_ui_contract.js`, `node tools/verify_ui_surface_contract.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-LC-001 | js/ui.js:`renderLocalMap` (`points` theo `nodeId`) | Khớp |
| MAP-LC-002 | js/ui.js:`renderLocalMap` (`visualHash(visualSeed + nodeId)`, jitter ±3,36% không theo `layoutVersion`, có thể vượt 0,5 ô) | Lệch |
| MAP-LC-003 | js/ui.js:`renderLocalMap` (`points`: `50 - dy * coordinateScale / 5` → `50 + dy * …`; `previewPoints`: `50 - dy * previewScale / 5` → `50 + …`; xóa comment "World +y là Bắc"); js/engine.js:`movementCandidatesFrom` (MAP-LC-010); `OPEN_WORLD_DELTAS` đã đúng | Lệch |
| MAP-LC-004 | js/ui.js:`mapCamera` | Khớp |
| MAP-LC-005 | js/ui.js:`renderLocalMap` | Thiếu |
| MAP-LC-006 | js/ui.js:`renderLocalMap` | Thiếu |
| MAP-LV-001..002 | js/engine.js:`localBfsConstellation` (thứ tự `bac, dong, nam, tay`) | Khớp |
| MAP-LV-003..004 | js/ui.js:`renderLocalMap` | Khớp |
| MAP-LV-010..011 | js/ui.js:`renderLocalMap` (`localRoutePairs`) | Khớp |
| MAP-LV-012 | js/ui.js:`renderLocalMap` (`isTeleportNode`, `guidePairs`) | Khớp |
| MAP-LV-020..022 | js/ui.js:`renderLocalMap` (`signalFor`) | Khớp |
| MAP-LV-030..034 | js/ui.js:`renderLocalMap` | Khớp |
| MAP-LV-040..041 | js/ui.js:`renderLocalMap`, js/expansion.js:`getCurrentRegionViewModel` | Khớp |
| MAP-LV-042 | js/ui.js:`renderLocalMap`; styles.css:`.map-path` (nét đứt chung cho mọi tuyến chưa khám phá, không phân biệt danger/phong tỏa; chưa có gạch chéo) | Lệch |
| MAP-LV-043..045 | js/ui.js:`renderLocalMap`, js/expansion.js:`getCurrentRegionViewModel` | Khớp |
| MAP-LV-046..047 | js/ui.js:`renderLocalMap` (chấm/SVG theo `signalFor`; không có ảnh nền 2x, icon 24/32/48 hay landmark icon) | Thiếu |
| MAP-LV-048 | js/ui.js:`renderLocalMap` (không có giảm mật độ icon theo zoom ở Lân Cận) | Thiếu |
