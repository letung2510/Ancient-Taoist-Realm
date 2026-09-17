# MAP V2  REQUIREMENT HO�N CH�NH: KHU V�C HI�N T�I, �A L� V� H�NH TR�NH

**Phi�n b�n:** 2.2  
**Tr�ng th�i:** y�u c�u tri�n khai b�t bu�c  
**Ph�m vi:** b�n � khu v�c hi�n t�i, h�nh �nh b�n �, node/sub-location, topology, di chuy�n v� to�n b� tr�i nghi�m ng��i d�ng li�n quan.

## 1. M�c ti�u s�n ph�m

T�nh nng **Khu v�c hi�n t�i** ph�i gi�p ng��i ch�i tr� l�i ngay b�n c�u h�i:

1. Ta ang � �u, thu�c v�ng �nh h��ng n�o v� m�c � an to�n ra sao?
2. T� �y i ��c �u b�ng nh�ng tuy�n n�o?
3. M�i tuy�n ang � tr�ng th�i g�: th�ng su�t, nguy hi�m, b� tu�n tra, phong t�a hay c�n ph��ng ti�n?
4. N�u ch�n m�t ph��ng th�c di chuy�n, ta s� m�t bao nhi�u ng�y, t�i nguy�n v� c� th� g�p r�i ro g�?

B�n � kh�ng ��c c�n l� danh s�ch c�c h�p n�i t�y ti�n. M�i node ph�i c� v� tr�, quy m�, tuy�n h�p l�, tr�ng th�i �a l� v� l�ch s� kh�m ph� ri�ng.

## 2. V�n � b�t bu�c ph�i gi�i quy�t

### 2.1. L�i S�n m�n Thi�n Huy�n Th�ng

Hi�n t�i `locationExits()` l�y c�nh t� catalog t)nh r�i tr�n v�i `openWorld.exits`; khi thi�u c�nh, `move()` g�i `generateOpenWorldNode()` v� t� n�i node m�i. C� ch� n�y khi�n S�n m�n Thi�n Huy�n Th�ng c� th� n�i th�ng t�i to�n b� node kh�c, ph� h�y topology g�c.

**Quy�t �nh ki�n tr�c:**

- Catalog t)nh v� graph runtime ph�i t�ch bi�t tuy�t �i.
- Node t)nh ch� ��c d�ng c�c c�nh ��c khai b�o trong `WORLD_MAP`/`LOCATIONS`.
- Node runtime ch� ��c n�i qua c�ng sinh procedural ��c khai b�o r� (`proceduralGate: true`).
- Kh�ng ��c t� sinh node khi ng��i ch�i i v�o m�t h��ng kh�ng c� c�nh h�p l�.
- Kh�ng ��c t� ghi � `LOCATIONS`, `WORLD_MAP.locations` ho�c c�nh c�a node t)nh.
- M�i node runtime ph�i n�m trong `state.openWorld.nodes`, c� namespace `runtime:` v� c� `parentNodeId`/`regionId`.
- M�i c�ng procedural c� `maxChildren`, `allowedDirections`, `allowedRegionIds`, `minFog`, `cooldownDays`.
- N�u h��ng kh�ng c� c�nh h�p l�, action ph�i tr� `ROUTE_NOT_FOUND`; kh�ng t�o node ng�m.

### 2.2. Tr�ng th�i di chuy�n ch�a �y �

`planned/active/interrupted/completed/cancelled` m�i l� tr�ng th�i k� thu�t t�i thi�u, ch�a � th�ng tin � UX ph�n �nh h�nh tr�nh. Requirement n�y b� sung l�p tr�ng th�i hi�n th� v� lu�t chuy�n tr�ng th�i.

## 3. M� h�nh b�n � khu v�c hi�n t�i

### 3.1. Ba l�p hi�n th�

**L�p A  B�n � khu v�c:** hi�n th� node hi�n t�i, node � bi�t, h��ng i, tuy�n ��ng v� �nh h��ng th� l�c.

**L�p B  Chi ti�t node:** m� khi b�m node, g�m t�n, lo�i �a i�m, m� t�, c�p s��ng m�, �nh h��ng, c�ng tr�nh, b�ng tin v� c�c sub-location.

**L�p C  H�nh tr�nh:** modal/panel x�c nh�n tuy�n, ph��ng ti�n, h� t�ng, ETA, chi ph�, nguy c� v� i�u ki�n phong t�a.

Kh�ng m� modal ch�ng modal. Tr�n m�n h�nh nh�, l�p B/C ph�i chuy�n th�nh bottom sheet c� n�t �ng r� r�ng.

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

### 3.3. Quy m� sub-location

- Tr�m nh�: 12 sub-location.
- Th�n/l�ng: 24.
- Th�nh th�: 46.
- S�n m�n, v��ng kinh, cn c� th� l�c: 68.
- NPC ch� xu�t hi�n t�i sub-location c� th�; Action Bar ch� hi�n th� action c�a sub-location ang �ng.
- Chuy�n sub-location trong c�ng node kh�ng roll s� ki�n ��ng d�i v� kh�ng �i nodeId.

## 4. Topology v� b�o to�n node

### 4.1. Resolver tuy�n duy nh�t

T�o `resolveMapTopology(state, nodeId)` v�i th� t�:

1. �c node static n�u `namespace=static`.
2. �c node runtime n�u `namespace=runtime`.
3. H�p nh�t ch� c�c c�nh runtime � ��c c�p ph�p.
4. L�c c�nh b� v� hi�u, h�t h�n, phong t�a ho�c kh�ng �t fog.
5. Kh�ng g�i h�m sinh node trong b��c �c.

`locationExits()` v� `mapNeighbors()` ph�i d�ng resolver n�y; `move()` kh�ng ��c t� fallback sang `generateOpenWorldNode()`.

### 4.2. Procedural gate

`generateOpenWorldNode()` ch� ��c g�i b�i `openProceduralGate()` khi:

- node hi�n t�i c� `proceduralGate` t��ng �ng h��ng;
- �t `minFog` v� i�u ki�n nhi�m v�;
- ch�a v��t `maxChildren`;
- v�ng �ch n�m trong `allowedRegionIds`;
- c� transaction journal v� idempotency key;
- t�o node runtime �c l�p, kh�ng s�a catalog t)nh.

### 4.3. Ki�m tra to�n v�n

Tool ki�m th� ph�i ph�t hi�n:

- node static b� th�m/x�a/s�a c�nh sau khi t�o state;
- c�nh hai chi�u kh�ng kh�p;
- node runtime tr� ra ngo�i namespace h�p l�;
- m�t node c� qu� s� con procedural;
- S�n m�n Thi�n Huy�n Th�ng n�i t�i node kh�ng n�m trong catalog c�nh ho�c gate ��c c�p ph�p.

## 5. Influence, heatmap v� tr�ng th�i �a b�n

M�i node t�nh influence t� faction home, outpost, structure, event v� kho�ng c�ch BFS. Kh�ng l�u owner t)nh.

```text
influence = factionPower � 0.70^distance
          � (1 + structureBonus + outpostBonus + eventBonus)
```

- `�n �nh`: top influence e 35 v� ch�nh l�ch top/second e 15%.
- `Tranh ch�p`: top-two c�ng hi�n di�n v� ch�nh l�ch < 15%.
- `Bi�n gi�i`: kh�ng faction n�o v��t ng��ng �n �nh.

UI khu v�c hi�n t�i ph�i hi�n th� gradient m�u, kh�ng ch� m�t nh�n owner. Khi fog < 2 ch� hi�n th� �nh h��ng ch�a r�.

## 6. Fog of war b�n c�p

| C�p | T�n | Hi�n th� |
|---|---|---|
| 0 | Ch�a bi�t | Kh�ng hi�n node tr�n b�n � khu v�c |
| 1 | Nghe �n | T�n m�, h��ng t��ng �i, kh�ng hi�n tuy�n chi ti�t |
| 2 | � kh�m ph� | Hi�n node, tuy�n h�p l�, nguy c� c� b�n |
| 3 | Th�ng thu�c | Hi�n sub-location, heatmap chi ti�t, c�ng tr�nh, b�ng tin v� tu�n tra |

M�i n�ng c�p fog ph�i qua discovery event idempotent, kh�ng spoil sub-location khi ch� m�i �t c�p 1.

## 7. Thi�t k� UI Khu v�c hi�n t�i

### 7.1. Thanh th�ng tin c� �nh

� �u panel hi�n th�:

- t�n node v� v�ng;
- lo�i �a i�m;
- c�p kh�m ph�;
- tr�ng th�i �a b�n: �n �nh / Tranh ch�p / Bi�n gi�i;
- �nh h��ng n�i b�t;
- nguy c� t�ng h�p;
- tr�ng th�i h�nh tr�nh hi�n t�i n�u ang di chuy�n.

### 7.2. B�n � h�nh �nh

- D�ng n�n minh h�a b�n � c� l�p texture theo v�ng; kh�ng d�ng n�n ph�ng v�i c�c ch�m r�i r�c.
- Node hi�n t�i c� v�ng s�ng v� nh�n lu�n �c ��c.
- Node � bi�t d�ng bi�u t��ng theo `nodeType`.
- Node c�p 1 d�ng silhouette/m�; node c�p 0 kh�ng render.
- Tuy�n c� m�u theo tr�ng th�i: xanh th�ng su�t, v�ng h�n ch�, � nguy hi�m, t�m phong t�a, x�m ch�a r�.
- Patrol edge d�ng icon khi�n/tu�n tra chuy�n �ng nh�; kh�ng t�o node gi�.
- Outpost/structure d�ng icon ri�ng, tooltip ti�ng Vi�t.
- B�n � ph�i c� zoom, pan, reset, ch� gi�i v� h� tr� b�n ph�m.
- M�i icon c� `aria-label`, kh�ng truy�n �t th�ng tin ch� b�ng m�u.

### 7.3. Chi ti�t node

Khi b�m node, m� th� chi ti�t g�m:

- �nh minh h�a theo `visualTag`;
- m� t� ng�n v� tr�ng th�i th�i ti�t;
- influence gradient/heatmap;
- danh s�ch sub-location d�ng th�;
- NPC hi�n di�n t�i �ng sub-location;
- c�u tr�c/tr�m v� � b�n;
- b�ng tin faction � l�c theo fog v� th�i h�n;
- n�t L�p Tr�m, X�y Th�p canh, X�y Tr�m giao th��ng ch� khi � i�u ki�n.

### 7.4. Tr�ng th�i r�ng v� l�i

- Kh�ng c� tuy�n: Ch�a c� tuy�n ��ng h�p l� t� �y.
- Ch�a � fog: C�n th�m manh m�i � nh�n r� khu v�c n�y.
- Phong t�a: hi�n th� faction, l� do, th�i h�n d� ki�n v� l�a ch�n h� t�ng/��ng v�ng.
- Thi�u t�i nguy�n: hi�n s� ang c�/s� c�n, kh�ng ch� hi�n m� l�i.
- H�nh tr�nh b� gi�n o�n: gi� log, cho ph�p ti�p t�c, �i tuy�n ho�c h�y.

## 8. H� th�ng tr�ng th�i di chuy�n

### 8.1. Tr�ng th�i runtime

`planned � active � completed`  
`active � interrupted � active`  
`planned/active/interrupted � cancelled`  
`active � failed` ch� khi route b� h�y b�i th� gi�i v� kh�ng th� ti�p t�c.

### 8.2. Nguy�n nh�n gi�n o�n

- g�p qu�i/mai ph�c;
- b�o, li, s�t l�;
- patrol ki�m tra;
- faction phong t�a;
- ph��ng ti�n h�ng;
- thi�u ph� duy tr� caravan/escort;
- node �ch �i tr�ng th�i th�nh kh�ng th� ti�p c�n.

### 8.3. Travel mode

| Ph��ng th�c | i�u ki�n | T�c � | �c t�nh |
|---|---|---:|---|
| i b� | lu�n c� n�u tuy�n m� | 1.0x | r�, nhi�u c� h�i d�c ��ng |
| Ng� kh� | c� c�ng ph�p ph� h�p | 3.0x | nhanh, t�n Linh Th�ch, kh�ng d�ng � tuy�n c�m |
| Th� c��i | c� th� c��i/�ng h�nh h�p l� | 2.0x | gi�m r�i ro ��ng b� |
| Thuy�n | c� hai �u l� b�n/n��c | 2.0x | ch�u b�o, kh�ng i tuy�n n�i |
| o�n xe | c� caravan v� tuy�n ��ng | 1.5x | gi�m r�i ro, t�n ph� duy tr� |
| o�n th��ng nh�n | hub th��ng m�i � m� | 1.25x | gi�m gi�/nh�n tin, d� b� ph�c k�ch |
| Truy�n t�ng tr�n | m� fast travel � c� hai �u | t�c th�i | kh�ng roll road event, t�n Linh Th�ch |

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

M�i ng�y ch� resolve m�t l�n theo `taskId + dayIndex`; retry ph�i idempotent.

## 9. Action Bar  lu�t �a action v�o �ng th�i i�m

- Action di chuy�n ch� hi�n cho c�nh � resolve, � fog v� kh�ng b� kh�a ho�n to�n.
- Action ph��ng ti�n ch� hi�n khi `travelPreview()` tr� `success=true`; n�u kh�ng � i�u ki�n th� hi�n th� trong ph�n Ph��ng th�c kh�c � tr�ng th�i disabled k�m l� do, kh�ng �a v�o Action Bar ch�nh.
- L�p Tr�m Ti�n Ti�u ch� hi�n t�i node bi�n/tranh ch�p ch�a c� outpost, kh�ng giao chi�n v� � chi ph�.
- Action x�y c�ng tr�nh ch� hi�n t�i node hi�n t�i, kh�ng giao chi�n, � chi ph� v� c� outpost ng��i ch�i ho�c node bi�n ��c ph�p khai ph�.
- Truy�n t�ng tr�n ch� hi�n khi c� hai �u � m� fast travel.
- H�y h�nh tr�nh ch� hi�n khi task � `planned`, `active` ho�c `interrupted`.
- Ti�p t�c h�nh tr�nh ch� hi�n khi interruption � c� ph��ng �n x� l�.
- Action c�a sub-location ch� hi�n sau khi ng��i ch�i th�c s� v�o sub-location �.

## 10. Transaction v� rollback

M�i mutation map d�ng `resolveMapTransaction` v�i:

- `actionId`, `actorId`, `expectedVersion`;
- ki�m tra topology, fog, quy�n, chi ph�, combat v� blockade;
- snapshot tr��c mutation;
- journal idempotency;
- rollback �y � n�u tr� t�i nguy�n th�nh c�ng nh�ng t�o task/node th�t b�i.

## 11. K� ho�ch tri�n khai

### Pha 1  Kh�a topology

- T�o static/runtime namespace.
- Vi�t `resolveMapTopology()` v� lo�i fallback sinh node trong `move()`.
- Di tr� runtime node ci sang `state.openWorld.nodes`.
- Th�m test h�i quy S�n m�n Thi�n Huy�n Th�ng.

### Pha 2  Travel state machine

- Chu�n h�a `TravelTask` v� c�c transition.
- �p d�ng travel mode, blockade, escort, ph��ng ti�n v� chi ph�.
- Hi�n th� ETA/risk/interruption trong UI.

### Pha 3  Khu v�c hi�n t�i v� h�nh �nh

- X�y l�i `renderLocalMap()` theo layout b�n � h�nh �nh.
- Th�m l�p tuy�n, icon node, heatmap, patrol, outpost v� ch� gi�i.
- Th�m responsive bottom sheet, keyboard navigation, aria-label.

### Pha 4  Node detail v� action context

- Sub-location, NPC placement, bulletin, structure detail.
- Action Bar theo context v� preview i�u ki�n.

### Pha 5  QA v� c�n b�ng

- Stress test topology 1.000 l��t di chuy�n.
- Ki�m th� deterministic travel retry.
- Ki�m th� fog/privacy, blockade, escort, fast travel v� rollback.
- So s�nh screenshot desktop/mobile tr��c khi ph�t h�nh.

## 12. Acceptance criteria

1. T� S�n m�n Thi�n Huy�n Th�ng kh�ng th� i t�i node kh�ng c� c�nh/gate ��c khai b�o.
2. Kh�ng m�t thao t�c di chuy�n n�o s�a catalog static.
3. Runtime node lu�n c� namespace, parent, region v� journal.
4. Khu v�c hi�n t�i hi�n th� ��c node, tuy�n, heatmap, fog v� tr�ng th�i tu�n tra.
5. Ng��i ch�i th�y r� ETA, chi ph�, nguy c� v� l� do kh�ng th� d�ng ph��ng ti�n.
6. Travel task kh�i ph�c �ng sau reload, retry kh�ng nh�n �i chi ph�/s� ki�n.
7. C�c tr�ng th�i `planned/active/interrupted/completed/cancelled/failed` �u c� UI v� transition h�p l�.
8. Action Bar kh�ng hi�n th� action ngo�i i�u ki�n; action tr�c ti�p qua API v�n b� ch�n �ng.
9. Kh�ng c�n nh�n k� thu�t nh� `watchtower`, `trading_post`, `stable`, `contested`, `frontier` hi�n th� cho ng��i ch�i.
10. B� x�c minh game, stress test topology v� ki�m tra giao di�n desktop/mobile �u �t.
## 13. R� so�t kho�ng tr�ng v� c�i ti�n b�t bu�c

### 13.1. Bi�n Khu v�c hi�n t�i th�nh m�n h�nh ch�i ��c

Khu v�c hi�n t�i kh�ng ch� l� m�n h�nh tra c�u. M�i node ph�i c� `localState` rebuild ��c, g�m d�n c�, ph�n vinh, an ninh, khan hi�m t�i nguy�n, th�i ti�t, gi� m� c�a v� s� ki�n ang di�n ra. C�c gi� tr� n�y t�c �ng tr�c ti�p t�i gi� ch�, NPC, nhi�m v� v� r�i ro di chuy�n.

### 13.2. B� ho�t �ng t�i ch�

M�i node c�n 38 ho�t �ng theo lo�i node v� sub-location: quan s�t, t�m ki�m, giao d�ch, ngh� tr�, s�a ph��ng ti�n, thu� h� t�ng, nh�n tin, do th�m tu�n tra, h� tr� d�n c�, m� ��ng t�t v� �t m�c c� nh�n. M�i ho�t �ng khai b�o `requirements`, `duration`, `cost`, `risk`, `effects`, `cooldown`, `sourceSubLocationId`. Action Resolver kh�ng ��c �a ho�t �ng h�t gi�, h�t cooldown ho�c thi�u i�u ki�n v�o Action Bar ch�nh.

### 13.3. S� ki�n �ng c�p khu v�c

Th�m `LocalIncident` v�i v�ng �i `rumor � emerging � active � resolved/expired`. V� d�: ch� ch�y, c�u s�p, th� tri�u, ki�m tra c�ng, th��ng o�n �n, d�ch b�nh, tranh ch�p �t ho�c h�i ch�. Incident ph�i t�c �ng t�i node/edge, c� y�u c�u fog, th�i h�n, �t nh�t hai l�a ch�n c� �nh �i, ghi log v� kh�ng nh�n �i sau reload/retry.

### 13.4. L�p tuy�n nhi�u ti�u ch�

Th�m ch� � **L�p tuy�n**: ch�n node �ch, hi�n th� 13 tuy�n t�t nh�t theo nhanh nh�t/an to�n nh�t/r� nh�t/k�n �o nh�t, so s�nh ETA, chi ph�, blockade, patrol, th�i ti�t v� c� h�i d�c ��ng. Cho ph�p waypoint v� �i ph��ng ti�n theo t�ng ch�ng; ch� t�o `travelTask` sau khi x�c nh�n.

### 13.5. Tr�ng th�i c�nh chi ti�t

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

Edge b� phong t�a kh�ng ��c x�a kh�i graph; ch� �i tr�ng th�i � gi� l�ch s�, ��ng v�ng v� kh� nng m� l�i.

### 13.6. T��ng t�c th� l�c t�i node

Ng��i ch�i c� th� xin gi�y th�ng h�nh, n�p ph�, nh�n nhi�m v� b�ng tin, th��ng l��ng gi�m phong t�a, do th�m ho�c ph� tu�n tra, xin h� t�ng, hi�n outpost v� x� l� incident. M�i faction c�n profile ri�ng cho ki�n tr�c, lu�t �a ph��ng, patrol, thu�, i�u ki�n v�o v� ph�n �ng danh ti�ng; kh�ng d�ng m� t� chung cho m�i t� ch�c.

### 13.7. NPC s�ng trong khu v�c

Scheduler ph�i c�p nh�t `currentNodeId`, `currentSubLocationId`, `scheduleStatus`, `availabilityReason`. UI hi�n th� NPC ang � �u, gi� c� th� g�p, ang di chuy�n/b�n/v�ng m�t v� th�i i�m quay l�i. Kh�ng hi�n th� NPC �o ch� v� t�n t�i trong catalog.

### 13.8. Kinh t� �a ph��ng

Gi� market/trading post t�nh t� ph�n vinh, khan hi�m, thu� faction, th�i ti�t, incident v� ngu�n cung di chuy�n. Bi�n �ng c� gi�i h�n m�i ng�y, deterministic theo world tick. Trading post ch� tng yield khi node c� market sub-location v� c�ng tr�nh c�n integrity.

### 13.9. Ghi ch� v� d�u v�t c� nh�n

Cho ph�p ghim node, ghi ch� t�i a 200 k� t�, �nh d�u nguy hi�m/c� h�i/quay l�i sau v� l�u route y�u th�ch. Ghi ch� kh�ng ��c thay �i topology ho�c l�m l� fog.

## 14. Lu�ng UX b�t bu�c

```text
M� Khu v�c hi�n t�i
  � �c t�m t�t node
  � xem tuy�n/incident/�nh h��ng
  � ch�n node ho�c sub-location
  � ch�n ho�t �ng ho�c L�p tuy�n
  � xem preview chi ph�/r�i ro
  � x�c nh�n
  � theo d�i task v� nh�t k�
```

M�i h�nh �ng l�m m�t ng�y, t�i nguy�n, � b�n, danh ti�ng ho�c tng r�i ro �u ph�i c� preview tr��c/sau, th�i gian, d�i r�i ro, t�c �ng faction, i�u ki�n th�t b�i v� n�t quay l�i.

### 14.1. Nh�t k� b�n �

Timeline l�c theo di chuy�n, kh�m ph�, th� l�c, incident, giao d�ch, tu�n tra v� c�ng tr�nh. M�i b�n ghi c� node, sub-location, ng�y game, k�t qu� v� source action � gi�i th�ch v� sao tuy�n �i tr�ng th�i.

### 14.2. Responsive v� ti�p c�n

Desktop d�ng b�n � tr�i/detail ph�i; tablet b�n � tr�n/detail d��i; mobile d�ng bottom sheet. H� tr� Tab/Enter/Escape, focus trap, reduced motion, t��ng ph�n WCAG AA v� aria-label cho m�i icon.

## 15. H� th�ng h�nh �nh b�n �

M�i v�ng c� n�n b�n � t� l� 2x, texture �a h�nh, icon node 24/32/48 px, icon edge, ph��ng ti�n, incident, patrol, faction v� �nh node detail. Asset l�i ph�i c� fallback SVG/CSS.

- Node l�n d�ng landmark ri�ng, kh�ng d�ng c�ng icon v�i tr�m nh�.
- Influence d�ng gradient m�m ph�a sau nh�n.
- Edge nguy hi�m d�ng n�t �t; phong t�a d�ng g�ch ch�o; tu�n tra d�ng chuy�n �ng nh�.
- T� gi�m m�t � icon khi zoom out; tooltip v�n �y �.
- Ch� render node trong viewport v� node � bi�t; cache sprite theo v�ng; kh�ng ch�y BFS m�i frame.
- M�c ti�u m� panel <300 ms desktop v� <800 ms thi�t b� t�m trung.

## 16. API b� sung

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

M�i mutation tr� `{ success, reason, data, transactionId, stateVersion }`. M� l�i k� thu�t ph�i ��c d�ch sang ti�ng Vi�t � UI.

## 17. Ki�m th� m� r�ng

### Topology

- Snapshot catalog tr��c/sau 10.000 l��t di chuy�n kh�ng �i.
- S�n m�n Thi�n Huy�n Th�ng ch� c� �ng c�nh/gate ��c khai b�o.
- Runtime gate v��t `maxChildren` b� t� ch�i.
- C�nh m�t chi�u/chi�u ng��c kh�ng h�p l� b� ph�t hi�n khi build data.

### Travel

- M�i transition tr�ng th�i h�p l�; transition sai b� ch�n.
- Reload gi�a `active/interrupted` kh�i ph�c �ng ETA/risk seed.
- Retry kh�ng tr� ti�n, roll event ho�c t�o log l�n hai.
- Phong t�a c� ��ng v�ng; h� t�ng, thuy�n, th� c��i, caravan v� truy�n t�ng c� i�u ki�n ri�ng.

### Local interaction

- Activity h�t gi�/cooldown kh�ng v�o Action Bar.
- NPC v�ng m�t kh�ng th� t��ng t�c.
- Incident h�t h�n kh�ng c�n n�t x� l�.
- Gi� th� tr��ng deterministic theo world tick.
- Ghi ch� kh�ng l�m l� fog ho�c s�a graph.

### Visual regression

- Screenshot desktop 1440 px, tablet 1024 px, mobile 390 px.
- Kh�ng tr�n ch� ti�ng Vi�t, ch�ng tooltip ho�c m�t focus.
- Asset l�i v�n thao t�c ��c nh� fallback.

## 18. Definition of Done

Feature ch� ho�n th�nh khi topology static/runtime b� kh�a; Khu v�c hi�n t�i c� view model duy nh�t; c� node detail, sub-location, local activity, incident, faction interaction, NPC presence, route planner, edge state, travel state machine, preview, heatmap, patrol, outpost, fallback asset, save/load, rollback, idempotency v� to�n b� nh�n ti�ng Vi�t. Kh�ng c�n ��ng n�i ng�m t� S�n m�n Thi�n Huy�n Th�ng ho�c b�t k� node static n�o.
## 19. Logic Gap Closure  b� sung b�t bu�c sau r� so�t

### 19.1. Th� t� x� l� world tick

World tick ph�i ch�y theo th� t� nguy�n t� sau, kh�ng ��c �o th� t�:

```text
1. Ch�t gameDay/worldTick m�i
2. C�p nh�t th�i ti�t v�ng v� incident
3. C�p nh�t topology runtime/edge state
4. C�p nh�t NPC route, patrol v� traffic
5. C�p nh�t influence/heatmap t� snapshot m�i
6. T�nh maintenance outpost/structure
7. Resolve travel task c�a player
8. Ph�t sinh bulletin v� invalidate view model
9. Ghi snapshot/journal v� ph�t event UI
```

M�i resolver �c c�ng `tickSnapshot`; kh�ng resolver n�o �c tr�ng th�i n�a ci n�a m�i.

### 19.2. Quy t�c xung �t �ng th�i

M�i node, edge v� travel task c� `stateVersion`. Mutation y�u c�u `expectedVersion`; n�u l�ch phi�n b�n tr� `MAP_VERSION_CONFLICT`, kh�ng t� ghi �. Khi nhi�u incident c�ng t�c �ng m�t edge, �u ti�n `blocked > restricted > open`; khi nhi�u weather modifier c�ng lo�i, d�ng modifier c� severity cao nh�t.

### 19.3. Route invalidation

N�u edge trong `routeSnapshot` chuy�n sang `blocked`, task ang `active` chuy�n `interrupted` v�i `reason`, kh�ng teleport player. H� th�ng t�o t�i a ba ph��ng �n: ch� m� l�i, ��ng v�ng an to�n, �i ph��ng ti�n/h� t�ng. N�u kh�ng c� ph��ng �n, chuy�n `failed` v� ho�n tr� ph�n chi ph� ch�a s� d�ng theo policy.

### 19.4. M� h�nh risk minh b�ch

```text
edgeRisk = clamp(baseRisk + terrainRisk + weatherRisk + patrolRisk
                 + incidentRisk + factionRisk - escortReduction
                 - structureReduction, 0, 0.95)
taskRisk = 1 - product(1 - edgeRisk_i)  // tr�n to�n b� ch�ng
```

UI hi�n th� d�i `th�p/v�a/cao/c�c cao`, c�n log l�u gi� tr� s� v� seed. Kh�ng reroll risk khi ch� m� l�i preview.

### 19.5. Quy t�c fog v� ri�ng t�

- Fog 0 kh�ng tr� t�n, t�a �, faction, NPC, edge ho�c risk c� th�.
- Fog 1 ch� tr� rumor � ��c ph�t hi�n; kh�ng ��c suy ng��c t� danh s�ch route.
- API server/runtime ph�i filter tr��c khi t�o view model, kh�ng ch� �n b�ng CSS.
- Cache view model theo `playerId + nodeId + fogVersion`; kh�ng d�ng chung gi�a ng��i ch�i.

### 19.6. V�ng �i node runtime

Runtime node c� `createdDay`, `expiresDay?`, `parentNodeId`, `gateId`, `generationSeed`, `status`. Khi h�t h�n, node chuy�n `archived`, kh�ng x�a c�ng n�u c�n log/quest. M�i c�nh tr� t�i node archived tr� th�nh `blocked/unknown`, kh�ng t� tr� sang node kh�c.

### 19.7. �ng b� travel v�i v� tr� player

Khi task `active`, `state.locationId` v�n l� node xu�t ph�t v� `state.mapState.travelTask` l� ngu�n s� th�t duy nh�t. Kh�ng cho combat, giao d�ch node �ch ho�c NPC interaction �ch tr��c khi task completed. UI ph�i hi�n th� ang tr�n ��ng v� kh�a action xung �t.

### 19.8. View model chu�n cho UI

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

UI ch� render view model n�y; kh�ng g�i tr�c ti�p catalog ho�c t� suy lu�n i�u ki�n action.

### 19.9. B�o v� d� li�u v� ch�ng exploit

- Kh�ng ho�n ti�n hai l�n khi cancel/interruption.
- Kh�ng nh�n reward n�u task ch�a completed.
- Kh�ng d�ng fast travel � b� qua quest lock, combat lock ho�c incident b�t bu�c.
- Kh�ng cho client t� g�i `risk`, `days`, `distance`, `owner` ho�c `fogState`; server/runtime t�nh l�i.
- Journal ph�i l�u before/after hash � ph�t hi�n save b� ch�nh s�a.

### 19.10. Acceptance b� sung

1. Hai mutation c�ng `stateVersion` kh�ng th� c�ng commit.
2. Route b� phong t�a gi�a ch�ng lu�n chuy�n interruption, kh�ng �i `locationId` sai.
3. Fog 0 kh�ng r� r� metadata qua API, tooltip, DOM ho�c cache.
4. Runtime node h�t h�n kh�ng l�m m�t log, quest ho�c reference ci.
5. CurrentRegionViewModel t�i t�o deterministic t� c�ng snapshot.
6. Kh�ng c� action map n�o commit m� thi�u preview t��ng �ng.
