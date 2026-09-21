# THIẾT KẾ DYNAMIC LOCAL BFS CONSTELLATION TREE

## 1. Mục tiêu

Thiết kế bản đồ cục bộ dạng cây chòm sao cho game tiên hiệp text-based, dựa trên bản đồ Oxy và logic di chuyển bốn hướng hiện có.

Tại mỗi vị trí của nhân vật, bản đồ chỉ hiển thị một phạm vi gồm đúng **39 node**, bao gồm node hiện tại.

Ví dụ:

```text
Nhân vật ở node A
→ A là root
→ hiển thị 39 node gần A nhất

Nhân vật di chuyển A → B
→ B trở thành root
→ tính lại 39 node gần B nhất
→ viewport của B khác viewport của A
```

Hình thức hiển thị là một **constellation tree phân nhánh hữu cơ**. Tuy nhiên, cấu trúc cây chỉ phục vụ trình bày. Gameplay vẫn sử dụng đầy đủ kết nối Đông, Tây, Nam, Bắc của bản đồ thật.

Tên kiến trúc:

```text
Dynamic Local BFS Constellation Tree
```

Tài liệu này không định nghĩa lại hệ thống màu. Renderer phải tái sử dụng logic màu và trạng thái node hiện có của project.

---

## 2. Nguyên tắc cốt lõi

### 2.1. Mỗi node hiện tại tạo ra một viewport riêng

Không tồn tại một cây 39 node cố định cho toàn bộ thế giới.

Mỗi khi `currentNodeId` thay đổi:

1. Lấy node hiện tại làm root.
2. Duyệt graph bằng BFS.
3. Thu thập tối đa 39 node duy nhất.
4. Chọn một parent cho mỗi node được tìm thấy.
5. Dựng cây hiển thị cục bộ.
6. So sánh viewport cũ và mới để animate.

### 2.2. Cây hiển thị không phải cây gameplay

Bản đồ Oxy có thể chứa chu trình và nhiều đường đi tới cùng một node. Cây hiển thị chỉ chọn một cạnh parent cho mỗi node để giảm độ rối.

```text
Graph gameplay thật
        ↓
BFS lấy 39 node
        ↓
Chọn 38 parent edge
        ↓
Render thành constellation tree
```

Với 39 node liên thông, cây hiển thị có đúng 38 cạnh.

### 2.3. Không thay đổi luật bốn hướng

Các hướng hợp lệ vẫn là:

```text
Bắc:  (x, y - 1)
Nam:  (x, y + 1)
Tây:  (x - 1, y)
Đông: (x + 1, y)
```

Nếu project đang dùng quy ước trục Y khác, giữ nguyên quy ước trong codebase.

Không dùng vị trí hiển thị để xác định hàng xóm hoặc quyền di chuyển.

---

## 3. Phạm vi 39 node

Mặc định, 39 node đã bao gồm node hiện tại:

```text
1 current node + 38 surrounding nodes = 39 displayed nodes
```

Node hiện tại luôn là node đầu tiên của kết quả BFS.

Nếu khu vực có ít hơn 39 node hợp lệ:

- Hiển thị toàn bộ node có thể tìm thấy.
- Không tạo node giả.
- Không kéo node ở khu vực không liên thông vào viewport.

Nếu node hiện tại nằm sát cạnh hoặc góc bản đồ:

- Không truy cập tọa độ ngoài biên.
- BFS tiếp tục mở rộng về những hướng còn hợp lệ.
- Cây có thể bất đối xứng.

---

## 4. Thuật toán lấy node bằng BFS

### 4.1. Dữ liệu đầu vào

```ts
interface MapNode {
  id: string;
  x: number;
  y: number;
}

interface MapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  direction: "north" | "east" | "south" | "west";
  enabled: boolean;
}
```

### 4.2. Node trong cây cục bộ

```ts
interface LocalTreeNode {
  nodeId: string;
  parentNodeId: string | null;
  parentEdgeId: string | null;
  depth: number;
  firstDirection: "north" | "east" | "south" | "west" | null;
  discoveryOrder: number;
}
```

`firstDirection` là hướng đầu tiên tính từ root tới node đó. Trường này dùng để chia node vào bốn khu vực hiển thị.

### 4.3. Pseudo-code

```ts
function buildLocalBfsTree({
  currentNodeId,
  graph,
  maximumNodeCount = 39,
}) {
  const queue = [{
    nodeId: currentNodeId,
    parentNodeId: null,
    parentEdgeId: null,
    depth: 0,
    firstDirection: null,
    discoveryOrder: 0,
  }];

  const visited = new Set([currentNodeId]);
  const treeNodes = [];

  while (queue.length > 0 && treeNodes.length < maximumNodeCount) {
    const current = queue.shift();
    treeNodes.push(current);

    const neighbors = getEnabledCardinalNeighbors(
      current.nodeId,
      graph
    );

    for (const neighbor of neighbors) {
      if (visited.has(neighbor.nodeId)) continue;

      visited.add(neighbor.nodeId);

      queue.push({
        nodeId: neighbor.nodeId,
        parentNodeId: current.nodeId,
        parentEdgeId: neighbor.edgeId,
        depth: current.depth + 1,
        firstDirection:
          current.firstDirection ?? neighbor.direction,
        discoveryOrder: visited.size - 1,
      });
    }
  }

  return treeNodes;
}
```

---

## 5. Chống trùng node trên bản đồ Oxy

Một tọa độ có thể được tìm thấy qua nhiều đường:

```text
A → Bắc → Đông
A → Đông → Bắc
```

Cả hai tuyến có thể đi tới cùng một node.

Phải deduplicate trước khi thêm vào queue:

```ts
const nodeKey = node.id;
```

Hoặc nếu node chưa có ID ổn định:

```ts
const nodeKey = `${node.x}:${node.y}`;
```

Node chỉ được thêm vào BFS lần đầu tiên được tìm thấy. Cạnh đầu tiên dẫn đến node đó trở thành `parentEdge` của cây hiển thị.

Không render hai bản sao của cùng một node tại hai nhánh khác nhau.

---

## 6. Thứ tự mở rộng ổn định

BFS cần một thứ tự duyệt ổn định để layout không thay đổi ngẫu nhiên giữa các lần render.

Thứ tự cơ sở đề xuất:

```text
Bắc → Đông → Nam → Tây
```

Không dùng `Math.random()` để trộn hàng xóm.

Nếu thứ tự cố định khiến cây thường xuyên lệch về một phía, có thể xoay thứ tự dựa trên hướng di chuyển gần nhất:

```ts
function getNeighborOrder(lastMoveDirection) {
  switch (lastMoveDirection) {
    case "north": return ["north", "east", "west", "south"];
    case "east":  return ["east", "south", "north", "west"];
    case "south": return ["south", "west", "east", "north"];
    case "west":  return ["west", "north", "south", "east"];
    default:      return ["north", "east", "south", "west"];
  }
}
```

Thứ tự phải được xác định bằng state rõ ràng, không random theo mỗi frame.

---

## 7. Tách edge gameplay và edge hiển thị

### 7.1. Dữ liệu viewport

```ts
interface LocalConstellationViewport {
  rootNodeId: string;
  nodeIds: string[];
  gameplayEdgeIds: string[];
  treeEdgeIds: string[];
}
```

### 7.2. Gameplay edges

`gameplayEdgeIds` chứa tất cả cạnh thật giữa các node trong viewport.

Chúng được sử dụng cho:

- Kiểm tra node có thể di chuyển tới.
- Tìm đường.
- Kiểm tra node bị khóa.
- Truyền tống và Tinh Lộ nếu có.
- Logic nhiệm vụ và sự kiện.

### 7.3. Tree edges

`treeEdgeIds` chỉ chứa các `parentEdgeId` được BFS chọn.

Chúng được sử dụng cho:

- Render constellation tree mặc định.
- Tạo bố cục phân nhánh.
- Giảm số đường nối hiển thị cùng lúc.

Không được dùng `treeEdgeIds` để quyết định gameplay.

---

## 8. Bảo toàn bốn hướng của node hiện tại

Vì tree chỉ vẽ một phần cạnh thật, một số kết nối hợp lệ có thể không nằm trong 38 cạnh của cây.

Để người chơi không mất thông tin:

- Luôn làm rõ toàn bộ cạnh hợp lệ đi ra từ node hiện tại.
- Khi hover hoặc chọn một node, làm rõ toàn bộ cạnh gameplay của node đó trong phạm vi viewport.
- Một cạnh phụ có thể được render tạm thời dù không thuộc `treeEdgeIds`.
- Khi bỏ hover hoặc selection, cạnh phụ trở về trạng thái ẩn hoặc mờ.

```ts
const visibleEdgeIds = union(
  viewport.treeEdgeIds,
  getEnabledEdgesFrom(currentNodeId),
  getEnabledEdgesFrom(selectedNodeId),
  activeRouteEdgeIds
);
```

Không được làm mất quyền di chuyển bốn hướng chỉ vì một cạnh không thuộc cây hiển thị.

---

## 9. Bố cục constellation tree

### 9.1. Root

Node hiện tại là root của viewport.

Root nên nằm tại vùng trung tâm hoặc gần trung tâm canvas để có không gian cho bốn nhánh.

### 9.2. Bốn nhánh cấp cao

Node được đưa vào nhánh dựa trên `firstDirection`:

```text
firstDirection = north → khu vực phía trên
firstDirection = east  → khu vực bên phải
firstDirection = south → khu vực phía dưới
firstDirection = west  → khu vực bên trái
```

Đây là hướng logic. Bố cục được phép cong nhẹ và lệch hữu cơ, nhưng không được đảo phương vị.

### 9.3. Phân bố node con

Node con được đặt xa root hơn node cha theo `depth`.

```ts
radialDistance = baseDistance + depth * depthSpacing;
```

Trong mỗi nhánh:

- Node cùng depth được trải ra theo một cung hẹp.
- Sibling có khoảng cách đủ để không chồng lấn.
- Nhánh có thể cong nhẹ để giống chòm sao.
- Không đặt node theo hàng/cột tuyệt đối.
- Không tạo vòng tròn hoặc ellipse quanh root.

### 9.4. Layout ổn định

Cùng một root và cùng phiên bản graph phải tạo ra cùng một layout.

```ts
layoutCacheKey = `${rootNodeId}:${graphRevision}`;
```

Có thể thêm jitter nhỏ dựa trên `node.id`, nhưng jitter phải deterministic.

---

## 10. Di chuyển từ A sang B

Khi nhân vật di chuyển:

```text
A là root của viewport cũ
        ↓
Gameplay xác nhận A → B hợp lệ
        ↓
B trở thành current node
        ↓
Chạy lại BFS từ B
        ↓
Dựng viewport mới gồm tối đa 39 node
        ↓
Diff viewport cũ và mới
        ↓
Animate node giữ lại, node mới và node rời đi
```

### 10.1. Viewport diff

```ts
interface LocalViewportDiff {
  retainedNodeIds: string[];
  enteringNodeIds: string[];
  leavingNodeIds: string[];
  retainedEdgeIds: string[];
  enteringEdgeIds: string[];
  leavingEdgeIds: string[];
}
```

Tính diff:

```ts
retained = intersection(oldNodeIds, newNodeIds);
entering = difference(newNodeIds, oldNodeIds);
leaving = difference(oldNodeIds, newNodeIds);
```

### 10.2. Animation

- Node được giữ lại di chuyển từ vị trí cũ sang vị trí mới.
- Node rời viewport fade out.
- Node mới fade in từ đầu nhánh hoặc mép canvas phù hợp.
- Edge cập nhật cùng node để không bị lệch.
- Không xóa toàn bộ SVG rồi dựng lại tức thời.
- Thời gian gợi ý: `250–400 ms`.
- Hỗ trợ `prefers-reduced-motion`.

Không chạy force simulation liên tục trong animation.

---

## 11. Node Khởi điểm

Khởi điểm là node đầu tiên nhân vật xuất hiện khi được tạo.

```ts
interface PlayerMapState {
  currentNodeId: string;
  originNodeId: string;
  visitedNodeIds: string[];
}
```

Quy tắc:

- `originNodeId` được thiết lập một lần khi tạo nhân vật.
- Không thay đổi khi nhân vật di chuyển.
- Không lấy node của lần load save làm khởi điểm mới.
- Không lấy current node làm khởi điểm mới.

Trong viewport:

- Nếu `originNodeId` thuộc danh sách 39 node, render nó theo logic hiện có.
- Nếu không thuộc 39 node, không ép nó vào viewport.
- Không loại một node gần nhân vật chỉ để nhét origin vào đủ 39 node.
- Nếu cần tìm đường về, dùng action dẫn đường về Khởi điểm.
- Có thể dùng offscreen pin riêng nếu project đã có hệ thống ghim.

---

## 12. Dẫn đường realtime tới node đặc biệt

### 12.1. Mục tiêu

Cho phép tạo đường dẫn realtime từ node hiện tại tới một node đặc biệt, ví dụ:

- Tông môn gần nhất.
- Tổ chức gần nhất.
- Thành trì gần nhất.
- Phường thị gần nhất.
- Node nhiệm vụ.
- Khởi điểm.

### 12.2. Tìm đích gần nhất

Nếu tất cả edge có cùng chi phí, sử dụng BFS trên graph gameplay thật.

```ts
function findNearestSpecialNode({
  startNodeId,
  graph,
  targetPredicate,
}) {
  // BFS trên toàn bộ gameplay graph.
}
```

Khoảng cách gần nhất phải tính bằng số bước hợp lệ, không tính bằng khoảng cách màn hình.

Nếu edge có chi phí khác nhau, dùng Dijkstra hoặc A*.

### 12.3. Route state

```ts
interface NavigationRoute {
  targetNodeId: string;
  targetType: "sect" | "organization" | "city" | "market" | "quest" | "origin";
  pathNodeIds: string[];
  pathEdgeIds: string[];
  nextNodeId: string | null;
  remainingSteps: number;
  status: "active" | "blocked" | "arrived" | "cancelled";
}
```

### 12.4. Route dùng graph thật

Đường dẫn phải được tính từ `gameplayEdges`, không tính từ 38 `treeEdges`.

Nếu route đi qua một gameplay edge đang bị ẩn:

- Tạm render edge đó.
- Đưa edge vào `activeRouteEdgeIds`.
- Phủ hiệu ứng đường dẫn lên edge.
- Giữ edge hiển thị cho tới khi route thay đổi hoặc bị hủy.

Không sửa parent của cây chỉ để đường dẫn trông liền mạch.

---

## 13. Đường dẫn qua node chưa khám phá

Route được phép đi qua node chưa khám phá nếu gameplay cho phép.

Tuy nhiên, dẫn đường không được tự động mở toàn bộ thông tin của node.

Node chưa khám phá nằm trên route:

- Vẫn giữ trạng thái khám phá hiện có.
- Không tự chuyển thành visited.
- Không tự mở tên, NPC, tài nguyên hoặc sự kiện.
- Chỉ hiển thị rằng route đi qua node đó.
- Chỉ cập nhật visited khi nhân vật thực sự đặt chân tới.

Đường dẫn là chỉ dẫn, không phải quyền di chuyển hoặc teleport.

---

## 14. Route nằm ngoài phạm vi 39 node

Đích đặc biệt có thể nằm ngoài viewport hiện tại.

Trong trường hợp này:

1. Tính toàn bộ route trên graph gameplay.
2. Lọc đoạn route có node nằm trong viewport hiện tại.
3. Hiển thị đường dẫn từ current node tới node cuối cùng còn nằm trong viewport.
4. Đánh dấu hướng route tiếp tục rời khỏi viewport.
5. Hiển thị số bước còn lại nếu UX hiện tại hỗ trợ.

Không kéo node đích từ xa vào viewport.

Khi nhân vật di chuyển và viewport được dựng lại, hiển thị đoạn tiếp theo của route.

```ts
const visibleRouteNodeIds = route.pathNodeIds.filter(
  nodeId => viewportNodeIds.has(nodeId)
);
```

---

## 15. Cập nhật route realtime

Sau mỗi bước di chuyển:

1. Xóa phần route đã đi qua.
2. Cập nhật `nextNodeId`.
3. Giảm `remainingSteps`.
4. Dựng lại viewport 39 node từ vị trí mới.
5. Render phần route nằm trong viewport mới.

Nếu edge tiếp theo bị khóa hoặc graph thay đổi:

1. Dừng route hiện tại.
2. Chạy lại pathfinding từ current node.
3. Nếu có đường thay thế, cập nhật route.
4. Nếu không còn đường, đặt trạng thái `blocked`.

```ts
function updateRouteAfterMove(route, currentNodeId, graph) {
  if (routeStillValid(route, currentNodeId, graph)) {
    return trimCompletedRoute(route, currentNodeId);
  }

  return recalculateRoute({
    startNodeId: currentNodeId,
    targetNodeId: route.targetNodeId,
    graph,
  });
}
```

---

## 16. Kiến trúc đề xuất

```text
World Graph
├── Nodes
└── Gameplay Edges
        ↓
Local BFS Selector
        ↓
Spanning Tree Builder
        ↓
Deterministic Tree Layout
        ↓
Viewport Diff / Transition
        ↓
Constellation Renderer

World Graph
        ↓
Route Pathfinder
        ↓
Visible Route Segment
        ↓
Route Overlay Renderer
```

Tách component:

```text
DynamicLocalConstellationMap
├── LocalTreeEdges
├── SupplementalGameplayEdges
├── ActiveRouteOverlay
├── LocalTreeNodes
├── OffscreenRouteIndicator
├── NodeTooltip
└── SelectedNodeSummary
```

---

## 17. Cache và hiệu năng

Không render toàn bộ bản đồ thế giới.

Mỗi viewport chỉ cần:

```text
Tối đa 39 node
38 tree edge
Các gameplay edge phụ đang cần hiển thị
Các edge thuộc route hiện tại
```

Cache theo:

```ts
const viewportCacheKey = `${currentNodeId}:${graphRevision}`;
const routeCacheKey = `${currentNodeId}:${targetNodeId}:${graphRevision}`;
```

Không tính lại BFS hoặc layout ở mọi animation frame.

Hủy kết quả cũ nếu:

- Người chơi load save khác.
- Graph revision thay đổi.
- Current node thay đổi trước khi phép tính cũ hoàn thành.
- Route bị hủy.

---

## 18. Trường hợp biên

### Graph không liên thông đủ 39 node

- Hiển thị số node tìm thấy.
- Không tạo node giả.
- Không kết nối sang component khác bằng edge giả.

### Node hiện tại có ít hơn bốn hướng

- Chỉ hiển thị cạnh gameplay đang tồn tại và enabled.
- Không tự thêm hướng còn thiếu.

### Một node có nhiều parent tiềm năng

- Chọn parent từ lần BFS tìm thấy đầu tiên.
- Các cạnh khác vẫn tồn tại trong `gameplayEdges`.

### Route đi qua edge không thuộc tree

- Render edge đó trong supplemental layer.
- Không tái cấu trúc toàn bộ cây.

### Đích route bị khóa

- Không chọn làm đích gần nhất nếu chưa có quyền tiếp cận.
- Nếu bị khóa sau khi route đã bắt đầu, tính lại hoặc báo blocked.

### Khởi điểm ngoài viewport

- Không ép vào danh sách 39 node.
- Chỉ dùng route hoặc pin ngoài màn hình nếu được yêu cầu.

---

## 19. Kiểm thử bắt buộc

### Chọn node

- Viewport đầy đủ trả về đúng 39 node gồm current node.
- Không có node trùng ID hoặc tọa độ.
- Current node luôn là root.
- Mỗi node khác root có đúng một parent trong tree.
- 39 node liên thông tạo đúng 38 tree edge.
- BFS không đi qua edge disabled.
- BFS không truy cập tọa độ ngoài biên.

### Gameplay

- Tree edge không thay đổi quyền di chuyển.
- Node hiện tại vẫn truy cập được toàn bộ hàng xóm gameplay hợp lệ.
- Cạnh bị ẩn khỏi tree vẫn có thể được dùng cho movement và pathfinding.
- Di chuyển A → B tạo viewport mới có B làm root.

### Layout

- Bốn nhánh được phân bố theo `firstDirection`.
- Node Bắc không xuất hiện phía dưới root.
- Node Nam không xuất hiện phía trên root.
- Node Đông không xuất hiện phía trái root.
- Node Tây không xuất hiện phía phải root.
- Layout cùng root và graph revision cho kết quả ổn định.
- Không xuất hiện grid cứng, orbit hoặc ellipse.

### Viewport transition

- Retained, entering và leaving node được tính đúng.
- Node giữ lại không bị remount không cần thiết.
- Node mới xuất hiện ở nhánh phù hợp.
- Node rời viewport biến mất sau transition.

### Khởi điểm

- `originNodeId` không đổi sau khi di chuyển.
- Origin chỉ xuất hiện khi thuộc viewport hoặc qua hệ thống pin riêng.
- Load save không ghi đè origin bằng current node.

### Dẫn đường

- Tìm đúng node đặc biệt gần nhất theo số bước gameplay.
- Route dùng gameplay edges, không dùng tree edges.
- Route có thể đi qua edge đang bị ẩn khỏi tree.
- Route qua node chưa khám phá không tự cập nhật visited.
- Route ngoài viewport chỉ hiển thị đoạn đang nhìn thấy.
- Route được cắt và cập nhật sau mỗi bước.
- Route tự tính lại khi cạnh tiếp theo bị khóa.

---

## 20. Tiêu chí nghiệm thu

Tính năng hoàn thành khi:

- Mỗi current node tạo một viewport cục bộ riêng.
- Viewport đầy đủ có đúng 39 node, đã bao gồm current node.
- 39 node được lấy bằng BFS trên graph gameplay thật.
- Node được deduplicate chính xác.
- Cây hiển thị có đúng một parent cho mỗi node không phải root.
- Cây chỉ dùng để render, không thay thế gameplay graph.
- Node hiện tại vẫn bảo toàn toàn bộ lựa chọn Đông, Tây, Nam, Bắc hợp lệ.
- Khi di chuyển A → B, B trở thành root và viewport được cập nhật.
- Node giữ lại, node mới và node rời đi được transition hợp lý.
- Khởi điểm là node đầu tiên của nhân vật và không thay đổi.
- Khởi điểm không bị ép vào mọi viewport.
- Đường dẫn tới node đặc biệt dùng graph gameplay thật.
- Đường dẫn có thể đi qua node chưa khám phá mà không tự mở thông tin node.
- Đích ngoài viewport được dẫn tiếp qua các viewport kế tiếp.
- Không tạo edge giả, node giả hoặc quyền di chuyển giả.
- Không ghi đè hoặc thay đổi logic màu hiện có.
- Build và test đều thành công.

---

## 21. Prompt triển khai cho Codex

```text
Hãy triển khai Dynamic Local BFS Constellation Tree cho bản đồ hiện tại.

Yêu cầu:

1. Mỗi vị trí nhân vật tạo ra một viewport riêng gồm tối đa 39 node, đã bao gồm current node.
2. Lấy node bằng BFS trên graph gameplay thật và deduplicate bằng node ID hoặc tọa độ.
3. Current node là root. Mỗi node khác root chọn parent từ lần đầu được BFS tìm thấy.
4. Với 39 node liên thông, tree hiển thị có 38 parent edge.
5. Tree edge chỉ dùng để render constellation phân nhánh. Movement và pathfinding luôn dùng toàn bộ gameplay edges.
6. Bảo toàn đầy đủ logic Đông, Tây, Nam, Bắc. Luôn làm rõ toàn bộ cạnh hợp lệ của current node.
7. Phân node thành bốn khu vực theo firstDirection: north, east, south, west.
8. Layout phải organic, ổn định và deterministic; không chạy force simulation hoặc random lại sau mỗi render.
9. Khi di chuyển A sang B, B trở thành root, chạy lại BFS, dựng viewport mới và diff với viewport cũ.
10. Animate retained, entering và leaving nodes trong khoảng 250–400 ms; hỗ trợ prefers-reduced-motion.
11. originNodeId là node đầu tiên khi tạo nhân vật, không thay đổi khi di chuyển hoặc load save.
12. Chỉ render origin khi nó thuộc viewport hoặc thông qua pin/route riêng; không ép origin vào danh sách 39 node.
13. Thêm hệ thống dẫn đường realtime tới node đặc biệt gần nhất như tông môn hoặc tổ chức.
14. Nếu edge có cùng chi phí, dùng BFS để chọn đích và đường đi ngắn nhất. Nếu có trọng số, dùng Dijkstra hoặc A*.
15. Route phải chạy trên gameplay graph, không chạy trên tree edges.
16. Nếu route đi qua edge bị ẩn khỏi tree, tạm render edge đó trong supplemental route layer.
17. Route được phép đi qua node chưa khám phá nhưng không tự thay đổi discovered/visited hoặc tiết lộ nội dung node.
18. Nếu đích nằm ngoài viewport, chỉ render đoạn route đang nằm trong 39 node và tiếp tục sau khi viewport cập nhật.
19. Sau mỗi bước, cắt phần route đã hoàn thành, cập nhật next node và remaining steps; tính lại nếu tuyến bị khóa.
20. Không thay đổi hoặc định nghĩa lại logic màu hiện có.

Trước khi sửa code:

- Phân tích dữ liệu node, gameplay edge và logic bốn hướng hiện tại.
- Xác định currentNodeId, originNodeId, visited/discovered và graph revision.
- Xác định component render map và movement action.
- Liệt kê file dự kiến sửa và rủi ro tương thích.

Sau khi sửa:

- Chạy build và test hiện có.
- Thêm test BFS 39 node, deduplication, 38 tree edges, bốn hướng, cạnh/góc bản đồ, viewport diff, origin persistence và realtime route.
- Kiểm tra thủ công chuyển từ A sang B và dẫn đường tới node đặc biệt ngoài viewport.
```

