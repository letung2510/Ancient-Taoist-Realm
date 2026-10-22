# MAP V2 · REQUIREMENT HOÀN CHỈNH: KHU VỰC HIỆN TẠI, ĐỊA LÝ VÀ HÀNH TRÌNH
> Khôi phục 2026-10-22 từ maporig_tmp.bin (bản gốc mất dấu từ commit đầu); tài liệu lịch sử — rule hiệu lực nằm ở requirement/features/map/.

**Phiên bản:** 2.2  
**Trạng thái:** yêu cầu triển khai bắt buộc  
**Phạm vi:** bản đồ khu vực hiện tại, hình ảnh bản đồ, node/sub-location, topology, di chuyển và toàn bộ trải nghiệm người dùng liên quan.

## 1. Mục tiêu sản phẩm

Tính năng **Khu vực hiện tại** phải giúp người chơi trả lời ngay bốn câu hỏi:

1. Ta đang ở đâu, thuộc vùng ảnh hưởng nào và mức độ an toàn ra sao?
2. Từ đây đi được đâu bằng những tuyến nào?
3. Mỗi tuyến đang ở trạng thái gì: thông suốt, nguy hiểm, bị tuần tra, phong tỏa hay cần phương tiện?
4. Nếu chọn một phương thức di chuyển, ta sẽ mất bao nhiêu ngày, tài nguyên và có thể gặp rủi ro gì?

Bản đồ không được còn là danh sách các hộp nổi tùy tiện. Mỗi node phải có vị trí, quy mô, tuyến hợp lệ, trạng thái địa lý và lịch sử khám phá riêng.

## 2. Vấn đề bắt buộc phải giải quyết

### 2.1. Lỗi Sơn môn Thiên Huyền Thông

Hiện tại `locationExits()` lấy cạnh từ catalog tĩnh rồi trộn với `openWorld.exits`; khi thiếu cạnh, `move()` gọi `generateOpenWorldNode()` và tự nối node mới. Cơ chế này khiến Sơn môn Thiên Huyền Thông có thể nối thẳng tới toàn bộ node khác, phá hủy topology gốc.

**Quyết định kiến trúc:**

- Catalog tĩnh và graph runtime phải tách biệt tuyệt đối.
- Node tĩnh chỉ được dùng các cạnh được khai báo trong `WORLD_MAP`/`LOCATIONS`.
- Node runtime chỉ được nối qua cổng sinh procedural được khai báo rõ (`proceduralGate: true`).
- Không được tự sinh node khi người chơi đi vào một hướng không có cạnh hợp lệ.
- Không được tự ghi đè `LOCATIONS`, `WORLD_MAP.locations` hoặc cạnh của node tĩnh.
- Mỗi node runtime phải nằm trong `state.openWorld.nodes`, có namespace `runtime:` và có `parentNodeId`/`regionId`.
- Mỗi cổng procedural có `maxChildren`, `allowedDirections`, `allowedRegionIds`, `minFog`, `cooldownDays`.
- Nếu hướng không có cạnh hợp lệ, action phải trả `ROUTE_NOT_FOUND`; không tạo node ngầm.

### 2.2. Trạng thái di chuyển chưa đầy đủ

`planned/active/interrupted/completed/cancelled` mới là trạng thái kỹ thuật tối thiểu, chưa đủ thông tin để UX phản ánh hành trình. Requirement này bổ sung lớp trạng thái hiển thị và luật chuyển trạng thái.

## 3. Mô hình bản đồ khu vực hiện tại

### 3.1. Ba lớp hiển thị

**Lớp A · Bản đồ khu vực:** hiển thị node hiện tại, node đã biết, hướng đi, tuyến đường và ảnh hưởng thế lực.

**Lớp B · Chi tiết node:** mở khi bấm node, gồm tên, loại địa điểm, mô tả, cấp sương mù, ảnh hưởng, công trình, bảng tin và các sub-location.

**Lớp C · Hành trình:** modal/panel xác nhận tuyến, phương tiện, hộ tống, ETA, chi phí, nguy cơ và điều kiện phong tỏa.

Không mở modal chồng modal. Trên màn hình nhỏ, lớp B/C phải chuyển thành bottom sheet có nút đóng rõ ràng.

### 3.2. Schema node

```ts
MapNode {
  id: string;
  namespace: "static" | "runtime";
  regionId: string;
  x: number;
  y: number;
  nodeType: "sect" | "city" | "village" | "outpost" | "wild" | "realm_gate";
  displayName: string;
  description: string;
  exits: Record<Direction, string | null>;
  edgeMeta: Record<string, MapEdgeMeta>;
  proceduralGate?: ProceduralGate;
  subLocations: SubLocation[];
  dangerLevel: number;
  fogState: 0 | 1 | 2 | 3;
  visualTag: string;
}

MapEdgeMeta {
  distance: number;
  terrain: "road" | "mountain" | "forest" | "river" | "sea" | "ruins";
  baseRisk: number;
  allowedModes: TravelMode[];
  blockadeState: "open" | "restricted" | "blocked";
  patrolLevel: number;
  seasonalState?: string;
}
```

### 3.3. Quy mô sub-location

- Trạm nhỏ: 1–2 sub-location.
- Thôn/làng: 2–4.
- Thành thị: 4–6.
- Sơn môn, vương kinh, căn cứ thế lực: 6–8.
- NPC chỉ xuất hiện tại sub-location cụ thể; Action Bar chỉ hiển thị action của sub-location đang đứng.
- Chuyển sub-location trong cùng node không roll sự kiện đường dài và không đổi nodeId.

## 4. Topology và bảo toàn node

### 4.1. Resolver tuyến duy nhất

Tạo `resolveMapTopology(state, nodeId)` với thứ tự:

1. Đọc node static nếu `namespace=static`.
2. Đọc node runtime nếu `namespace=runtime`.
3. Hợp nhất chỉ các cạnh runtime đã được cấp phép.
4. Lọc cạnh bị vô hiệu, hết hạn, phong tỏa hoặc không đạt fog.
5. Không gọi hàm sinh node trong bước đọc.

`locationExits()` và `mapNeighbors()` phải dùng resolver này; `move()` không được tự fallback sang `generateOpenWorldNode()`.

### 4.2. Procedural gate

`generateOpenWorldNode()` chỉ được gọi bởi `openProceduralGate()` khi:

- node hiện tại có `proceduralGate` tương ứng hướng;
- đạt `minFog` và điều kiện nhiệm vụ;
- chưa vượt `maxChildren`;
- vùng đích nằm trong `allowedRegionIds`;
- có transaction journal và idempotency key;
- tạo node runtime độc lập, không sửa catalog tĩnh.

### 4.3. Kiểm tra toàn vẹn

Tool kiểm thử phải phát hiện:

- node static bị thêm/xóa/sửa cạnh sau khi tạo state;
- cạnh hai chiều không khớp;
- node runtime trỏ ra ngoài namespace hợp lệ;
- một node có quá số con procedural;
- Sơn môn Thiên Huyền Thông nối tới node không nằm trong catalog cạnh hoặc gate được cấp phép.

## 5. Influence, heatmap và trạng thái địa bàn

Mỗi node tính influence từ faction home, outpost, structure, event và khoảng cách BFS. Không lưu owner tĩnh.

```text
influence = factionPower × 0.70^distance
          × (1 + structureBonus + outpostBonus + eventBonus)
```

- `Ổn định`: top influence ≥ 35 và chênh lệch top/second ≥ 15%.
- `Tranh chấp`: top-two cùng hiện diện và chênh lệch < 15%.
- `Biên giới`: không faction nào vượt ngưỡng ổn định.

UI khu vực hiện tại phải hiển thị gradient màu, không chỉ một nhãn owner. Khi fog < 2 chỉ hiển thị “Ảnh hưởng chưa rõ”.

## 6. Fog of war bốn cấp

| Cấp | Tên | Hiển thị |
|---|---|---|
| 0 | Chưa biết | Không hiện node trên bản đồ khu vực |
| 1 | Nghe đồn | Tên mờ, hướng tương đối, không hiện tuyến chi tiết |
| 2 | Đã khám phá | Hiện node, tuyến hợp lệ, nguy cơ cơ bản |
| 3 | Thông thuộc | Hiện sub-location, heatmap chi tiết, công trình, bảng tin và tuần tra |

Mỗi nâng cấp fog phải qua discovery event idempotent, không spoil sub-location khi chỉ mới đạt cấp 1.

## 7. Thiết kế UI “Khu vực hiện tại”

### 7.1. Thanh thông tin cố định

Ở đầu panel hiển thị:

- tên node và vùng;
- loại địa điểm;
- cấp khám phá;
- trạng thái địa bàn: Ổn định / Tranh chấp / Biên giới;
- ảnh hưởng nổi bật;
- nguy cơ tổng hợp;
- trạng thái hành trình hiện tại nếu đang di chuyển.

### 7.2. Bản đồ hình ảnh

- Dùng nền minh họa bản đồ có lớp texture theo vùng; không dùng nền phẳng với các chấm rời rạc.
- Node hiện tại có vòng sáng và nhãn luôn đọc được.
- Node đã biết dùng biểu tượng theo `nodeType`.
- Node cấp 1 dùng silhouette/mờ; node cấp 0 không render.
- Tuyến có màu theo trạng thái: xanh thông suốt, vàng hạn chế, đỏ nguy hiểm, tím phong tỏa, xám chưa rõ.
- Patrol edge dùng icon khiên/tuần tra chuyển động nhẹ; không tạo node giả.
- Outpost/structure dùng icon riêng, tooltip tiếng Việt.
- Bản đồ phải có zoom, pan, reset, chú giải và hỗ trợ bàn phím.
- Mỗi icon có `aria-label`, không truyền đạt thông tin chỉ bằng màu.

### 7.3. Chi tiết node

Khi bấm node, mở thẻ chi tiết gồm:

- ảnh minh họa theo `visualTag`;
- mô tả ngắn và trạng thái thời tiết;
- influence gradient/heatmap;
- danh sách sub-location dạng thẻ;
- NPC hiện diện tại đúng sub-location;
- cấu trúc/trạm và độ bền;
- bảng tin faction đã lọc theo fog và thời hạn;
- nút “Lập Trạm”, “Xây Tháp canh”, “Xây Trạm giao thương” chỉ khi đủ điều kiện.

### 7.4. Trạng thái rỗng và lỗi

- Không có tuyến: “Chưa có tuyến đường hợp lệ từ đây.”
- Chưa đủ fog: “Cần thêm manh mối để nhìn rõ khu vực này.”
- Phong tỏa: hiển thị faction, lý do, thời hạn dự kiến và lựa chọn hộ tống/đường vòng.
- Thiếu tài nguyên: hiện số đang có/số cần, không chỉ hiện mã lỗi.
- Hành trình bị gián đoạn: giữ log, cho phép tiếp tục, đổi tuyến hoặc hủy.

## 8. Hệ thống trạng thái di chuyển

### 8.1. Trạng thái runtime

`planned → active → completed`  
`active → interrupted → active`  
`planned/active/interrupted → cancelled`  
`active → failed` chỉ khi route bị hủy bởi thế giới và không thể tiếp tục.

### 8.2. Nguyên nhân gián đoạn

- gặp quái/mai phục;
- bão, lũ, sạt lở;
- patrol kiểm tra;
- faction phong tỏa;
- phương tiện hỏng;
- thiếu phí duy trì caravan/escort;
- node đích đổi trạng thái thành không thể tiếp cận.

### 8.3. Travel mode

| Phương thức | Điều kiện | Tốc độ | Đặc tính |
|---|---|---:|---|
| Đi bộ | luôn có nếu tuyến mở | 1.0x | rẻ, nhiều cơ hội dọc đường |
| Ngự khí | có công pháp phù hợp | 3.0x | nhanh, tốn Linh Thạch, không dùng ở tuyến cấm |
| Thú cưỡi | có thú cưỡi/đồng hành hợp lệ | 2.0x | giảm rủi ro đường bộ |
| Thuyền | có hai đầu là bến/nước | 2.0x | chịu bão, không đi tuyến núi |
| Đoàn xe | có caravan và tuyến đường | 1.5x | giảm rủi ro, tốn phí duy trì |
| Đoàn thương nhân | hub thương mại đã mở | 1.25x | giảm giá/nhận tin, dễ bị phục kích |
| Truyền tống trận | mở fast travel ở cả hai đầu | tức thời | không roll road event, tốn Linh Thạch |

### 8.4. Travel task snapshot

```ts
TravelTask {
  id: string;
  status: "planned" | "active" | "interrupted" | "completed" | "cancelled" | "failed";
  fromId: string;
  toId: string;
  routeSnapshot: string[];
  mode: TravelMode;
  distance: number;
  etaDays: number;
  elapsedDays: number;
  risk: number;
  riskSeed: string;
  escortId?: string;
  interruption?: { type: string; day: number; resolved: boolean };
  costSnapshot: Record<string, number>;
  createdDay: number;
  updatedDay: number;
}
```

Mỗi ngày chỉ resolve một lần theo `taskId + dayIndex`; retry phải idempotent.

## 9. Action Bar · luật đưa action vào đúng thời điểm

- Action di chuyển chỉ hiện cho cạnh đã resolve, đủ fog và không bị khóa hoàn toàn.
- Action phương tiện chỉ hiện khi `travelPreview()` trả `success=true`; nếu không đủ điều kiện thì hiển thị trong phần “Phương thức khác” ở trạng thái disabled kèm lý do, không đưa vào Action Bar chính.
- “Lập Trạm Tiền Tiêu” chỉ hiện tại node biên/tranh chấp chưa có outpost, không giao chiến và đủ chi phí.
- Action xây công trình chỉ hiện tại node hiện tại, không giao chiến, đủ chi phí và có outpost người chơi hoặc node biên được phép khai phá.
- “Truyền tống trận” chỉ hiện khi cả hai đầu đã mở fast travel.
- “Hủy hành trình” chỉ hiện khi task ở `planned`, `active` hoặc `interrupted`.
- “Tiếp tục hành trình” chỉ hiện khi interruption đã có phương án xử lý.
- Action của sub-location chỉ hiện sau khi người chơi thực sự vào sub-location đó.

## 10. Transaction và rollback

Mọi mutation map dùng `resolveMapTransaction` với:

- `actionId`, `actorId`, `expectedVersion`;
- kiểm tra topology, fog, quyền, chi phí, combat và blockade;
- snapshot trước mutation;
- journal idempotency;
- rollback đầy đủ nếu trừ tài nguyên thành công nhưng tạo task/node thất bại.

## 11. Kế hoạch triển khai

### Pha 1 · Khóa topology

- Tạo static/runtime namespace.
- Viết `resolveMapTopology()` và loại fallback sinh node trong `move()`.
- Di trú runtime node cũ sang `state.openWorld.nodes`.
- Thêm test hồi quy Sơn môn Thiên Huyền Thông.

### Pha 2 · Travel state machine

- Chuẩn hóa `TravelTask` và các transition.
- Áp dụng travel mode, blockade, escort, phương tiện và chi phí.
- Hiển thị ETA/risk/interruption trong UI.

### Pha 3 · Khu vực hiện tại và hình ảnh

- Xây lại `renderLocalMap()` theo layout bản đồ hình ảnh.
- Thêm lớp tuyến, icon node, heatmap, patrol, outpost và chú giải.
- Thêm responsive bottom sheet, keyboard navigation, aria-label.

### Pha 4 · Node detail và action context

- Sub-location, NPC placement, bulletin, structure detail.
- Action Bar theo context và preview điều kiện.

### Pha 5 · QA và cân bằng

- Stress test topology 1.000 lượt di chuyển.
- Kiểm thử deterministic travel retry.
- Kiểm thử fog/privacy, blockade, escort, fast travel và rollback.
- So sánh screenshot desktop/mobile trước khi phát hành.

## 12. Acceptance criteria

1. Từ Sơn môn Thiên Huyền Thông không thể đi tới node không có cạnh/gate được khai báo.
2. Không một thao tác di chuyển nào sửa catalog static.
3. Runtime node luôn có namespace, parent, region và journal.
4. Khu vực hiện tại hiển thị được node, tuyến, heatmap, fog và trạng thái tuần tra.
5. Người chơi thấy rõ ETA, chi phí, nguy cơ và lý do không thể dùng phương tiện.
6. Travel task khôi phục đúng sau reload, retry không nhân đôi chi phí/sự kiện.
7. Các trạng thái `planned/active/interrupted/completed/cancelled/failed` đều có UI và transition hợp lệ.
8. Action Bar không hiển thị action ngoài điều kiện; action trực tiếp qua API vẫn bị chặn đúng.
9. Không còn nhãn kỹ thuật như `watchtower`, `trading_post`, `stable`, `contested`, `frontier` hiển thị cho người chơi.
10. Bộ xác minh game, stress test topology và kiểm tra giao diện desktop/mobile đều đạt.
## 13. Rà soát khoảng trống và cải tiến bắt buộc

### 13.1. Biến “Khu vực hiện tại” thành màn hình chơi được

Khu vực hiện tại không chỉ là màn hình tra cứu. Mỗi node phải có `localState` rebuild được, gồm dân cư, phồn vinh, an ninh, khan hiếm tài nguyên, thời tiết, giờ mở cửa và sự kiện đang diễn ra. Các giá trị này tác động trực tiếp tới giá chợ, NPC, nhiệm vụ và rủi ro di chuyển.

### 13.2. Bộ hoạt động tại chỗ

Mỗi node cần 3–8 hoạt động theo loại node và sub-location: quan sát, tìm kiếm, giao dịch, nghỉ trọ, sửa phương tiện, thuê hộ tống, nhận tin, do thám tuần tra, hỗ trợ dân cư, mở đường tắt và đặt mốc cá nhân. Mỗi hoạt động khai báo `requirements`, `duration`, `cost`, `risk`, `effects`, `cooldown`, `sourceSubLocationId`. Action Resolver không được đưa hoạt động hết giờ, hết cooldown hoặc thiếu điều kiện vào Action Bar chính.

### 13.3. Sự kiện động cấp khu vực

Thêm `LocalIncident` với vòng đời `rumor → emerging → active → resolved/expired`. Ví dụ: chợ cháy, cầu sập, thú triều, kiểm tra cổng, thương đoàn đến, dịch bệnh, tranh chấp đất hoặc hội chợ. Incident phải tác động tới node/edge, có yêu cầu fog, thời hạn, ít nhất hai lựa chọn có đánh đổi, ghi log và không nhân đôi sau reload/retry.

### 13.4. Lập tuyến nhiều tiêu chí

Thêm chế độ **Lập tuyến**: chọn node đích, hiển thị 1–3 tuyến tốt nhất theo nhanh nhất/an toàn nhất/rẻ nhất/kín đáo nhất, so sánh ETA, chi phí, blockade, patrol, thời tiết và cơ hội dọc đường. Cho phép waypoint và đổi phương tiện theo từng chặng; chỉ tạo `travelTask` sau khi xác nhận.

### 13.5. Trạng thái cạnh chi tiết

```ts
EdgeState {
  availability: "open" | "restricted" | "blocked" | "unknown";
  reason?: "war" | "weather" | "patrol" | "collapse" | "customs" | "quest";
  riskBand: "low" | "medium" | "high" | "extreme";
  patrolCount: number;
  traffic: "empty" | "normal" | "busy";
  lastVerifiedDay: number;
  alternateEdges: string[];
}
```

Edge bị phong tỏa không được xóa khỏi graph; chỉ đổi trạng thái để giữ lịch sử, đường vòng và khả năng mở lại.

### 13.6. Tương tác thế lực tại node

Người chơi có thể xin giấy thông hành, nộp phí, nhận nhiệm vụ bảng tin, thương lượng giảm phong tỏa, do thám hoặc phá tuần tra, xin hộ tống, hiện outpost và xử lý incident. Mỗi faction cần profile riêng cho kiến trúc, luật địa phương, patrol, thuế, điều kiện vào và phản ứng danh tiếng; không dùng mô tả chung cho mọi tổ chức.

### 13.7. NPC sống trong khu vực

Scheduler phải cập nhật `currentNodeId`, `currentSubLocationId`, `scheduleStatus`, `availabilityReason`. UI hiển thị NPC đang ở đâu, giờ có thể gặp, đang di chuyển/bận/vắng mặt và thời điểm quay lại. Không hiển thị NPC ảo chỉ vì tồn tại trong catalog.

### 13.8. Kinh tế địa phương

Giá market/trading post tính từ phồn vinh, khan hiếm, thuế faction, thời tiết, incident và nguồn cung di chuyển. Biến động có giới hạn mỗi ngày, deterministic theo world tick. Trading post chỉ tăng yield khi node có market sub-location và công trình còn integrity.

### 13.9. Ghi chú và dấu vết cá nhân

Cho phép ghim node, ghi chú tối đa 200 ký tự, đánh dấu nguy hiểm/cơ hội/quay lại sau và lưu route yêu thích. Ghi chú không được thay đổi topology hoặc làm lộ fog.

## 14. Luồng UX bắt buộc

```text
Mở Khu vực hiện tại
  → đọc tóm tắt node
  → xem tuyến/incident/ảnh hưởng
  → chọn node hoặc sub-location
  → chọn hoạt động hoặc Lập tuyến
  → xem preview chi phí/rủi ro
  → xác nhận
  → theo dõi task và nhật ký
```

Mọi hành động làm mất ngày, tài nguyên, độ bền, danh tiếng hoặc tăng rủi ro đều phải có preview trước/sau, thời gian, dải rủi ro, tác động faction, điều kiện thất bại và nút quay lại.

### 14.1. Nhật ký bản đồ

Timeline lọc theo di chuyển, khám phá, thế lực, incident, giao dịch, tuần tra và công trình. Mỗi bản ghi có node, sub-location, ngày game, kết quả và source action để giải thích vì sao tuyến đổi trạng thái.

### 14.2. Responsive và tiếp cận

Desktop dùng bản đồ trái/detail phải; tablet bản đồ trên/detail dưới; mobile dùng bottom sheet. Hỗ trợ Tab/Enter/Escape, focus trap, reduced motion, tương phản WCAG AA và aria-label cho mọi icon.

## 15. Hệ thống hình ảnh bản đồ

Mỗi vùng có nền bản đồ tỷ lệ 2x, texture địa hình, icon node 24/32/48 px, icon edge, phương tiện, incident, patrol, faction và ảnh node detail. Asset lỗi phải có fallback SVG/CSS.

- Node lớn dùng landmark riêng, không dùng cùng icon với trạm nhỏ.
- Influence dùng gradient mềm phía sau nhãn.
- Edge nguy hiểm dùng nét đứt; phong tỏa dùng gạch chéo; tuần tra dùng chuyển động nhẹ.
- Tự giảm mật độ icon khi zoom out; tooltip vẫn đầy đủ.
- Chỉ render node trong viewport và node đã biết; cache sprite theo vùng; không chạy BFS mỗi frame.
- Mục tiêu mở panel <300 ms desktop và <800 ms thiết bị tầm trung.

## 16. API bổ sung

```js
resolveMapTopology(state, nodeId)
getCurrentRegionViewModel(state)
getLocalState(state, nodeId)
listLocalActivities(state, nodeId, subLocationId)
previewLocalActivity(state, activityId, args)
resolveLocalActivity(state, activityId, args)
listRouteOptions(state, fromId, toId, preferences)
edgeState(state, fromId, toId)
interruptTravel(state, taskId, reason)
resumeTravel(state, taskId, resolution)
cancelTravel(state, taskId)
mapIncidentPreview(state, incidentId, choiceId)
resolveMapIncident(state, incidentId, choiceId)
setMapNote(state, nodeId, note)
```

Mọi mutation trả `{ success, reason, data, transactionId, stateVersion }`. Mã lỗi kỹ thuật phải được dịch sang tiếng Việt ở UI.

## 17. Kiểm thử mở rộng

### Topology

- Snapshot catalog trước/sau 10.000 lượt di chuyển không đổi.
- Sơn môn Thiên Huyền Thông chỉ có đúng cạnh/gate được khai báo.
- Runtime gate vượt `maxChildren` bị từ chối.
- Cạnh một chiều/chiều ngược không hợp lệ bị phát hiện khi build data.

### Travel

- Mọi transition trạng thái hợp lệ; transition sai bị chặn.
- Reload giữa `active/interrupted` khôi phục đúng ETA/risk seed.
- Retry không trừ tiền, roll event hoặc tạo log lần hai.
- Phong tỏa có đường vòng; hộ tống, thuyền, thú cưỡi, caravan và truyền tống có điều kiện riêng.

### Local interaction

- Activity hết giờ/cooldown không vào Action Bar.
- NPC vắng mặt không thể tương tác.
- Incident hết hạn không còn nút xử lý.
- Giá thị trường deterministic theo world tick.
- Ghi chú không làm lộ fog hoặc sửa graph.

### Visual regression

- Screenshot desktop 1440 px, tablet 1024 px, mobile 390 px.
- Không tràn chữ tiếng Việt, chồng tooltip hoặc mất focus.
- Asset lỗi vẫn thao tác được nhờ fallback.

## 18. Definition of Done

Feature chỉ hoàn thành khi topology static/runtime bị khóa; Khu vực hiện tại có view model duy nhất; có node detail, sub-location, local activity, incident, faction interaction, NPC presence, route planner, edge state, travel state machine, preview, heatmap, patrol, outpost, fallback asset, save/load, rollback, idempotency và toàn bộ nhãn tiếng Việt. Không còn đường nối ngầm từ Sơn môn Thiên Huyền Thông hoặc bất kỳ node static nào.
## 19. Logic Gap Closure · bổ sung bắt buộc sau rà soát

### 19.1. Thứ tự xử lý world tick

World tick phải chạy theo thứ tự nguyên tử sau, không được đảo thứ tự:

```text
1. Chốt gameDay/worldTick mới
2. Cập nhật thời tiết vùng và incident
3. Cập nhật topology runtime/edge state
4. Cập nhật NPC route, patrol và traffic
5. Cập nhật influence/heatmap từ snapshot mới
6. Tính maintenance outpost/structure
7. Resolve travel task của player
8. Phát sinh bulletin và invalidate view model
9. Ghi snapshot/journal và phát event UI
```

Mọi resolver đọc cùng `tickSnapshot`; không resolver nào đọc trạng thái nửa cũ nửa mới.

### 19.2. Quy tắc xung đột đồng thời

Mỗi node, edge và travel task có `stateVersion`. Mutation yêu cầu `expectedVersion`; nếu lệch phiên bản trả `MAP_VERSION_CONFLICT`, không tự ghi đè. Khi nhiều incident cùng tác động một edge, ưu tiên `blocked > restricted > open`; khi nhiều weather modifier cùng loại, dùng modifier có severity cao nhất.

### 19.3. Route invalidation

Nếu edge trong `routeSnapshot` chuyển sang `blocked`, task đang `active` chuyển `interrupted` với `reason`, không teleport player. Hệ thống tạo tối đa ba phương án: chờ mở lại, đường vòng an toàn, đổi phương tiện/hộ tống. Nếu không có phương án, chuyển `failed` và hoàn trả phần chi phí chưa sử dụng theo policy.

### 19.4. Mô hình risk minh bạch

```text
edgeRisk = clamp(baseRisk + terrainRisk + weatherRisk + patrolRisk
                 + incidentRisk + factionRisk - escortReduction
                 - structureReduction, 0, 0.95)
taskRisk = 1 - product(1 - edgeRisk_i)  // trên toàn bộ chặng
```

UI hiển thị dải `thấp/vừa/cao/cực cao`, còn log lưu giá trị số và seed. Không reroll risk khi chỉ mở lại preview.

### 19.5. Quy tắc fog và riêng tư

- Fog 0 không trả tên, tọa độ, faction, NPC, edge hoặc risk cụ thể.
- Fog 1 chỉ trả rumor đã được phát hiện; không được suy ngược từ danh sách route.
- API server/runtime phải filter trước khi tạo view model, không chỉ ẩn bằng CSS.
- Cache view model theo `playerId + nodeId + fogVersion`; không dùng chung giữa người chơi.

### 19.6. Vòng đời node runtime

Runtime node có `createdDay`, `expiresDay?`, `parentNodeId`, `gateId`, `generationSeed`, `status`. Khi hết hạn, node chuyển `archived`, không xóa cứng nếu còn log/quest. Mọi cạnh trỏ tới node archived trở thành `blocked/unknown`, không tự trỏ sang node khác.

### 19.7. Đồng bộ travel với vị trí player

Khi task `active`, `state.locationId` vẫn là node xuất phát và `state.mapState.travelTask` là nguồn sự thật duy nhất. Không cho combat, giao dịch node đích hoặc NPC interaction đích trước khi task completed. UI phải hiển thị “Đang trên đường” và khóa action xung đột.

### 19.8. View model chuẩn cho UI

```ts
CurrentRegionViewModel {
  node: NodeSummary;
  subLocations: SubLocationSummary[];
  exits: ExitView[];
  edgeStates: Record<string, EdgeState>;
  localState: LocalState;
  weather: WeatherView;
  influence: InfluenceView;
  incidents: IncidentSummary[];
  npcSummary: { total: number; visible: number; byRole: Record<string, number> };
  actions: ActionView[];
  travelTask: TravelTaskView | null;
  version: number;
}
```

UI chỉ render view model này; không gọi trực tiếp catalog hoặc tự suy luận điều kiện action.

### 19.9. Bảo vệ dữ liệu và chống exploit

- Không hoàn tiền hai lần khi cancel/interruption.
- Không nhận reward nếu task chưa completed.
- Không dùng fast travel để bỏ qua quest lock, combat lock hoặc incident bắt buộc.
- Không cho client tự gửi `risk`, `days`, `distance`, `owner` hoặc `fogState`; server/runtime tính lại.
- Journal phải lưu before/after hash để phát hiện save bị chỉnh sửa.

### 19.10. Acceptance bổ sung

1. Hai mutation cùng `stateVersion` không thể cùng commit.
2. Route bị phong tỏa giữa chặng luôn chuyển interruption, không đổi `locationId` sai.
3. Fog 0 không rò rỉ metadata qua API, tooltip, DOM hoặc cache.
4. Runtime node hết hạn không làm mất log, quest hoặc reference cũ.
5. CurrentRegionViewModel tái tạo deterministic từ cùng snapshot.
6. Không có action map nào commit mà thiếu preview tương ứng.
