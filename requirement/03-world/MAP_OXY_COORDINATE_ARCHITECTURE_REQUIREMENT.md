# MAP OXY COORDINATE ARCHITECTURE REQUIREMENT

## 1. M�c ti�u

Map V2 chuy�n sang m� h�nh kh�ng gian Oxy l�m ngu�n s� th�t duy nh�t cho to�n b� th� gi�i. M�i node c� m�t t�a � nguy�n `(x, y)`. T� t�a � n�y, engine x�c �nh b�n h��ng B�c, Nam, �ng, T�y v� sinh node c�n thi�u m�t c�ch nh�t qu�n.

Ki�n tr�c n�y thay th� vi�c ph� thu�c v�o `exits` th� c�ng, t�a � ph�n trm UI ho�c t�n node ch�a t�a � k� thu�t.

## 2. Nguy�n t�c b�t bu�c

### 2.1. Ph�m vi kh�ng gian 100 � 100

- Th� gi�i d�ng mi�n t�a � `x  [-50,49]`, `y  [-50,49]`, t�ng c�ng 10.000 � logic.
- `(0,0)` l� Thi�n Nguy�n S�n t�i Trung V�c.
- 150 t� ch�c ��c �t b�ng random c� seed, kh�ng �t th� c�ng s�t nhau.
- Kho�ng c�ch t�i thi�u gi�a t� ch�c ph� thu�c `pyramid_tier`: Tier 1: 12 �, Tier 2: 8 �, Tier 3: 5 �, Tier 45: 3 �.
- Random placement ph�i deterministic theo world seed; reload ho�c n�ng phi�n b�n kh�ng ��c �i t�a � � l�u.
- Node hoang d� v� node ph� ��c sinh lazy; kh�ng kh�i t�o 10.000 node khi load game.
- UI chi�u Oxy sang viewport ph�n trm b�ng min/max c�a v�ng ang xem, kh�ng d�ng ph�n trm l�m t�a � gameplay.

- `(0, 0)` l� m�c kh�ng gian c�a Trung V�c, m�c �nh l� Thi�n Nguy�n S�n/Thi�n Nguy�n S�n M�n.
- T�a � gameplay lu�n l� s� nguy�n c� d�u, �c l�p v�i k�ch th��c m�n h�nh.
- M�t c�p t�a � ch� ��c ph�p c� m�t node duy nh�t.
- Node t� ch�c, th�nh tr�n, ph��ng th�, th�n, b�n t�u, tr�m d�ch, hoang d� v� runtime �u d�ng c�ng h� Oxy.
- `exits` l� cache d�n ��ng ��c sinh t� t�a �, kh�ng ph�i ngu�n s� th�t ch�nh.
- M�i node h�p l� c� t�i a b�n h�ng x�m tr�c ti�p theo Manhattan grid.
- Kh�ng d�ng t�n nh� `Bng Nguy�n -1` ho�c `open_4_-7` � hi�n th� cho ng��i ch�i.
- ID k� thu�t c� th� ch�a t�a �; t�n hi�n th� ph�i l�y t� name pool theo v�ng, �a h�nh v� lo�i node.
- Quy�n di chuy�n t�i node �c l�p v�i quy�n gia nh�p t� ch�c.

## 3. H� t�a �

### 3.3. Canonical h�a node authored

- M�i node authored hi�n h�u ph�i ��c g�n `coordinate` tr��c khi gameplay b�t �u.
- Khi node c� `coordinate`, engine b� qua `exits` legacy v� sinh h�ng x�m theo Oxy.
- `exits` legacy ch� ��c d�ng trong migration ho�c khi node ch�a c� t�a �.
- Node kh�i �u Trung V�c l� `trung_vuc_khoi_diem` t�i `(0,0)`; kh�ng kh�i �u t�i c�a t�ng m�n.

### 3.1. Quy ��c tr�c

```text
          B�c (y + 1)
               �
T�y (x - 1) � (x,y) � �ng (x + 1)
               �
          Nam (y - 1)
```

Kho�ng c�ch �a h�nh c� b�n d�ng Manhattan distance:

```js
distance = Math.abs(ax - bx) + Math.abs(ay - by)
```

Kho�ng c�ch hi�n th� c� th� d�ng Euclidean, nh�ng kh�ng ��c d�ng Euclidean � thay th� lu�t h�ng x�m gameplay.

### 3.2. M�c th� gi�i

```text
(0, 0)  Thi�n Nguy�n S�n  Trung V�c
(-1, 10) Thi�n Ki�m M�n
(4, -3)  Ph��ng th� Thanh Kh�
(8, 6)   B�n t�u Tinh C�ng
```

C�c t�a � n�y l� v� d� authoring; catalog ch�nh th�c ph�i khai b�o r� `coordinate`.

## 4. Schema node chu�n

```js
{
  id: "org_node_thien_kiem_mon",
  name: "Thi�n Ki�m M�n � T�ng �n",
  coordinate: { x: -1, y: 10 },
  regionId: "trung_vuc",
  mapNodeType: "organization",
  organizationId: "guild_xxx",
  terrain: "mountain",
  climateZone: "trung_vuc",
  exits: {
    bac: null,
    nam: null,
    dong: null,
    tay: null
  },
  npcs: [],
  enemies: [],
  searchable: ["linh_thach"],
  dangerLevel: 2,
  corruption: 1,
  authored: true,
  generated: false
}
```

Quy t�c:

- `coordinate` b�t bu�c v�i node authored v� node runtime.
- `regionId` x�c �nh v�ng kh� h�u, th�i ti�t, influence v� bulletin.
- `mapNodeType` chu�n h�a: `origin`, `organization`, `market`, `town`, `village`, `harbor`, `waystation`, `wilderness`, `landmark`, `hidden_realm`.
- `organizationId` ch� c� � node t� ch�c ho�c node b� t� ch�c chi ph�i; kh�ng �i di�n cho t� c�ch th�nh vi�n c�a nh�n v�t.
- `npcs` v� `enemies` l� pool spawn ban �u; runtime presence l�u ri�ng trong `npcState`/combat state.

## 5. Node registry h�p nh�t

`WORLD_MAP.nodePool` l� registry �c chung c�a map, NPC, qu�i, t� ch�c, th�i ti�t, th�m hi�m v� incident.

```js
WORLD_MAP.nodePool[nodeId] = {
  id,
  coordinate: { x, y },
  name,
  regionId,
  mapNodeType,
  organizationId,
  npcs,
  enemies,
  terrain,
  authored,
  generated
};
```

M�i node ph�i �ng b� v�o:

1. `GameData.LOCATIONS`  t��ng th�ch h� th�ng ci.
2. `state.openWorld.nodes`  runtime save.
3. `state.openWorld.coordinates`  index t�a �.
4. `WORLD_MAP.locations`  projection UI.
5. `WORLD_MAP.nodePool`  registry h�p nh�t.

Kh�ng subsystem n�o ��c t� t�o b�n sao node ngo�i registry.

## 6. Index t�a � v� ch�ng tr�ng

Engine ph�i duy tr� index:

```js
state.openWorld.coordinateIndex["x,y"] = nodeId;
```

API b�t bu�c:

```js
getNodeAtCoordinate(state, x, y)
ensureNodeAtCoordinate(state, x, y, options)
coordinateKey(x, y)
neighborCoordinate(x, y, direction)
validateCoordinateUniqueness(state)
```

N�u t�a � � t�n t�i, `ensureNodeAtCoordinate()` tr� node hi�n t�i v� kh�ng t�o b�n sao.

## 7. Sinh node theo h��ng

### 7.1. Thu�t to�n

```js
function resolveDirectionalNode(state, fromId, direction) {
  const from = getNode(state, fromId);
  const targetCoordinate = neighborCoordinate(from.coordinate.x, from.coordinate.y, direction);
  const existing = getNodeAtCoordinate(state, targetCoordinate.x, targetCoordinate.y);
  const target = existing || generateNodeFromPool(state, targetCoordinate, from, direction);
  linkNodesBidirectionally(state, from.id, target.id, direction);
  return target;
}
```

### 7.2. Li�n k�t hai chi�u

```text
A --�ng--> B
B --T�y--> A
```

Kh�ng ��c ghi m�t chi�u. Sau m�i mutation ph�i ch�y invariant:

```js
assert(getExit(B, "tay") === A)
```

### 7.3. Sinh pool

Pool node ��c ch�n theo:

- V�ng (`regionId`).
- �a h�nh (`terrain`).
- Kho�ng c�ch t� m�c `(0,0)`.
- Th�i ti�t hi�n t�i.
- Influence t� ch�c.
- B�ng t� l� NPC/qu�i.
- Tr�ng th�i incident ho�c chi�n tranh.

T�n hi�n th� l�y t� pool t� nhi�n:

```js
{
  regionId: "bac_nguyen",
  terrain: "ice_valley",
  names: ["H�n Nguy�t C�c", "Tuy�t T�m L�", "Lam Bng �i"]
}
```

Kh�ng n�i t�a � s� v�o `name` hi�n th�.

## 8. Node authored v� node runtime

### Authored node

L� node thi�t k� s�n cho c�c �a i�m quan tr�ng:

- Thi�n Nguy�n S�n.
- T�ng �n t� ch�c.
- 150 t� ch�c.
- Th�nh tr�n, ph��ng th�, th�n, b�n t�u, tr�m d�ch.
- C�m �a, b� c�nh, h�i c�ng v� landmark.

### Runtime node

��c sinh khi ng��i ch�i ho�c NPC m� r�ng th� gi�i. Runtime node ph�i:

- C� t�a � h�p l�.
- C� t�n pool.
- C� region/terrain.
- C� NPC/qu�i theo b�ng spawn.
- C� li�n k�t ng��c.
- ��c l�u v�o registry h�p nh�t.

## 9. T� ch�c v� v�ng �nh h��ng

M�i t� ch�c c� node t�ng �n ri�ng:

```js
{
  mapNodeType: "organization",
  organizationId: "guild_001",
  coordinate: { x: -1, y: 10 }
}
```

Di chuy�n t�i node t� ch�c kh�ng y�u c�u gia nh�p. Gia nh�p ch� ��c ki�m tra b�i `guildEligibility()`/`joinGuild()`.

�nh h��ng t� ch�c tr�n node ��c t�nh �c l�p:

```js
organizationCoverageSnapshot(state, nodeId)
```

Coverage d�a tr�n:

- Kho�ng c�ch Oxy t�i t�ng �n.
- C�p t� ch�c.
- T�i nguy�n v� s�c m�nh.
- Outpost/structure t�i node.
- Quan h� ngo�i giao.
- Chi�n tranh ho�c phong t�a.

Coverage kh�ng l�m m�t li�n k�t di chuy�n. Phong t�a ch� thay �i risk, cost, encounter ho�c ph��ng th�c i.

## 10. NPC v� qu�i v�t

NPC ph�i d�ng `currentNodeId` v� t�y ch�n `currentSubLocationId`. Qu�i ph�i d�ng `spawnNodeId`/`currentNodeId`.

Khi node ��c sinh:

1. Ch�n NPC pool theo v�ng v� lo�i node.
2. Ch�n qu�i pool theo �a h�nh, danger v� th�i ti�t.
3. Ghi spawn record g�n v�i node ID.
4. Cho NPC pathfinding tr�n t�a � Oxy.
5. Khi c�nh b� phong t�a, t�m ��ng v�ng b�ng BFS/A* tr�n node � bi�t.

NPC kh�ng ��c xu�t hi�n t�i node ch�a c� trong registry. Combat encounter ph�i tham chi�u node hi�n t�i, kh�ng ch� tham chi�u region.

## 11. Th�i ti�t v� t�a �

Th�i ti�t ��c x�c �nh theo `regionId` c�a node hi�n t�i. Khi node n�m tr�n ranh gi�i, d�ng climate zone c�a node v� gradient l�n c�n.

T�a � �nh h��ng:

- Th�i gian i.
- R�i ro th�i ti�t.
- T� l� NPC tr� �n.
- T� l� qu�i xu�t hi�n.
- Kh� nng th�m hi�m t�i nguy�n.
- Kh� nng m� ��ng bi�n, n�i ho�c bng.

Weather kh�ng ��c d�ng � x�a node ho�c x�a li�n k�t; ch� �p d�ng modifier v� incident.

## 12. Movement contract

`startTravel(fromId, toId, mode)` ph�i:

- X�c nh�n c� hai node t�n t�i trong registry.
- T�nh Manhattan distance t� coordinate.
- T�nh mode speed, weather modifier v� terrain modifier.
- Ki�m tra combat/travel task ang ho�t �ng.
- Ki�m tra cost.
- Kh�ng ki�m tra i�u ki�n gia nh�p t� ch�c.
- Ghi `fromCoordinate`, `toCoordinate`, `distance`, `mode`, `weather`, `risk` v�o travel task.

N�u ng��i ch�i ch�n action h��ng:

```text
i B�c / i Nam / i �ng / i T�y
```

engine ph�i resolve node theo t�a � tr��c, sau � g�i c�ng m�t `startTravel()` canonical. Kh�ng ��c c� m�t logic ri�ng ch� �c `LOCATIONS.exits` ci.

## 13. UI projection

Gameplay d�ng t�a � Oxy; UI ch� chi�u sang ph�n trm:

```js
screenX = ((x - minX) / (maxX - minX)) * 100;
screenY = 100 - ((y - minY) / (maxY - minY)) * 100;
```

UI kh�ng ��c s�a t�a � gameplay khi zoom/pan.

Hi�n th�:

- Node hi�n t�i: v�ng duy nh�t.
- Ch�nh �o: xanh lam.
- Ma �o/T� �o/H�c �o: � t�m ho�c � s�m.
- Trung l�p: t�m x�m.
- Ph��ng th�: v�ng cam.
- Th�nh tr�n: xanh lam nh�t.
- Th�n: xanh l�c.
- B�n t�u: xanh ng�c.
- Tr�m d�ch: t�m s�ng.
- � th�m hi�m: hi�n th� t�n v� marker.
- Ch�a th�m hi�m: ch� hi�n th� tr�ng th�i, kh�ng l� NPC/qu�i/c� duy�n.

Zoom/pan/reset ch� t�c �ng l�p projection node, kh�ng thay �i registry.

## 14. Migration t� h� th�ng hi�n t�i

### B��c 1  Chu�n h�a catalog

- G�n t�a � Oxy cho to�n b� node static.
- Chuy�n t�a � t� ch�c ph�n trm th�nh t�a � Oxy authoring.
- G�n `mapNodeType` v� `terrain`.
- T�o `coordinateIndex` v� ph�t hi�n tr�ng.

### B��c 2  �ng b� save ci

- Save c� `openWorld.coordinates` gi� nguy�n n�u h�p l�.
- Save thi�u t�a � static ��c map t� b�ng migration c� �nh.
- Save c� node t�n t�a � ci ��c �i t�n hi�n th� nh�ng gi� nguy�n ID.
- Kh�ng t� �ng x�a node ho�c reset `visitedLocations`.

### B��c 3  Canonical movement

- H��ng ci g�i `resolveDirectionalNode()`.
- Click node g�i `startTravel()`.
- X�a c�c nh�nh movement t� �c `exits` m� kh�ng qua coordinate resolver.

### B��c 4  �ng b� NPC/qu�i

- Chuy�n m�i `currentNodeId` v� node registry.
- B� sung fallback cho NPC save ci.
- Ch�y repair reciprocal links sau load.

## 15. Invariants v� ki�m th�

B�t bu�c c� test:

1. M�i node c� t�a � h�p l�.
2. Kh�ng c� t�a � tr�ng.
3. B�c/Nam v� �ng/T�y �i x�ng.
4. T� `(0,0)` i b�n h��ng t�o �ng b�n t�a �.
5. Node runtime kh�ng c� t�n t�a � k� thu�t.
6. 150 node t� ch�c �u c� t�a � v� node ri�ng.
7. M�i node th�nh tr�n/ph��ng th�/th�n/b�n t�u/tr�m d�ch c� `mapNodeType` �ng.
8. Node ch�a kh�m ph� kh�ng l� NPC/qu�i/c� duy�n.
9. NPC v� qu�i lu�n tham chi�u node t�n t�i.
10. Phong t�a kh�ng x�a li�n k�t, ch� t�o modifier.
11. Di chuy�n t�i node t� ch�c kh�ng y�u c�u membership.
12. Gia nh�p t� ch�c v�n ki�m tra eligibility ri�ng.
13. Zoom/pan kh�ng thay �i coordinate.
14. Save/load gi� nguy�n t�a � v� visited state.
15. T� m�i node test c� th� resolve B�c/Nam/�ng/T�y.

## 16. Ti�u ch� ho�n th�nh

## 16.1. Bi�n v�c v� node r�a

## 16.3. M� h�nh hi�n th� k�t h�p

- Gameplay gi� h� Oxy 100�100; UI kh�ng thay �i t�a � gameplay khi zoom ho�c pan.
- V�n Gi�i L� d�ng canvas viewport l�n (t�i thi�u 620px, t�i a theo chi�u cao m�n h�nh) thay v� nh�i to�n b� node v�o khung nh�.
- C� b�n m�c zoom: To�n c�nh, V�ng, Khu v�c, Node. Zoom ch� thay �i projection v� m�t � hi�n th�.
- Zoom xa ch� hi�n region, t� ch�c c�p cao v� node l�n; zoom g�n m�i hi�n t� ch�c c�p th�p, node d�n c�, NPC, qu�i v� c� duy�n.
- Node ngo�i viewport ph�i ��c culling kh�i DOM; node g�n nhau ��c gom cluster v� t�ch ra khi zoom v�o.
- Layer UI cho ph�p b�t/t�t t� ch�c, node d�n c�, NPC, qu�i, c� duy�n, influence v� tuy�n th��ng m�i.
- Nh�n t� ch�c c�p th�p ch� hi�n khi hover; nh�n c�p cao c� th� hi�n th� m� � zoom V�ng.

- Node c� `max(abs(x), abs(y)) >= 45` ��c �nh d�u `isEdge`.
- Khu v�c r�a kh�ng ph�i t��ng ch�n; �y l� v�ng m� r�ng c�a th� gi�i.
- UI ph�i hi�n th� th�ng b�o bi�n v�c v� b�n action: Th�m hi�m bi�n v�c, D�ng tr�m ti�n ti�u, Xin h� t�ng qua bi�n, M� tuy�n th��ng m�i.
- Action r�a d�ng transaction contract, c� cost/risk/incident ri�ng v� kh�ng x�a li�n k�t b�n h��ng.

## 16.2. Pool d� li�u b�n �

- `WORLD_MAP.nodePools` ch�a pool t�n, terrain v� lo�i node.
- `WORLD_MAP.coordinateSystem` khai b�o mi�n `[-50,49]` v� origin.
- `WORLD_MAP.edgeActions` khai b�o action ��c ph�p � node r�a.
- Pool ��c d�ng chung b�i authored node, runtime node, NPC, qu�i, t� ch�c, weather v� exploration.

Feature �t 100% khi:

- T�t c� node static v� runtime d�ng Oxy.
- `exits` ch� l� cache ��c sinh t� �ng.
- Kh�ng c�n node b� k�t ch� v� thi�u m�t h��ng trong catalog.
- Kh�ng c�n t�n node hi�n th� d�ng t�a � s�.
- 150 t� ch�c, th�nh tr�n v� c�c node ph� n�m trong c�ng node pool.
- NPC, qu�i, th�i ti�t, t� ch�c, th�m hi�m v� incident �c c�ng node registry.
- Movement action, click node v� NPC pathfinding d�ng c�ng resolver.
- Save migration v� invariant tests �u pass.
