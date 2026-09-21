# MAP CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\03-world\MAP_CANONICAL_VALIDATION_GATE_2026-09-17.md`

# Map canonical validation gate

`validateMapCanonicalState(state)` is the save/runtime boundary for Map V2. It checks:

- every known/open-world node has unique coordinates inside 0..100;
- every discovered node resolves through `mapInfluenceSnapshot`;
- influence DTO has node id, pressure, confidence, source/revision;
- cached snapshots use the current `influenceRevision` and match their node id.

`validateExpansionState` calls this gate. Map UI, travel, fog, completion and structure
effects remain consumers of the same influence resolver. A missing-coordinate fixture is
covered by `verify_review_batches.js`.


### Source: `archive-requirements\logic-history\03-world\MAP_COMPLETION_LAYERED_NODE_HISTORY_CONTRACT_2026-09-17.md`

# Map completion layered contract

## Canonical DTO

`mapCompletionDetailed(state, regionId)` extends the base completion DTO with:

- `layers.visited`: số node đã đặt chân tới;
- `layers.subLocation`: node có lịch sử điểm nhỏ;
- `layers.structure`: node có lịch sử công trình;
- `layers.weather`: node có chuyển thiên tượng;
- `layers.actor`: node có actor/NPC được ghi nhận;
- `layers.faction`: node có thay đổi thế lực;
- `historyCoverage`: tỷ lệ node có tối thiểu năm dấu vết lịch sử, dùng để giải thích độ đầy đủ của bản đồ;
- `explainable: true`: đánh dấu DTO có thể giải thích, không chỉ là boolean/percent.

Mọi layer lấy từ `mapNode().history`, được dedupe bằng key và giữ retention canonical. Save/load giữ nguyên history; UI có thể dùng cùng DTO với resolver map/fog/influence.

## Acceptance

Node detail hiển thị dấu vết gần đây và completion có thể trả lời vì sao vùng đạt bao nhiêu phần trăm. Thêm history không được làm thay đổi influence hoặc reward; duplicate key không làm tăng completion.

## Chưa hoàn thiện

Ngưỡng “năm dấu vết” là baseline giải thích, cần playtest để cân bằng cách tính danh hiệu bản đồ. Visual QA bản đồ thật vẫn cần browser được phép load local assets.


### Source: `archive-requirements\logic-history\03-world\MAP_COORDINATE_VALIDATION_CANONICAL_2026-09-17.md`

# Map coordinate validation canonical — 2026-09-17

Map V2 uses the current 100×100 gameplay coordinate domain (`0..100` on both axes).
`validateMapCoordinates(state)` audits static, world-map and procedural node pools for:

- missing coordinates;
- coordinates outside the domain;
- duplicate `(x,y)` occupancy.

Influence resolution no longer silently substitutes `[0,0]` when a node has no valid
coordinate. It returns `source: "invalid_coordinate"`, an empty influence DTO and
`coordinateValid: false`; travel already rejects missing coordinates. This prevents a
malformed node from receiving the influence/fog/travel behavior of the origin.

**Note chưa hoàn thiện:** procedural expansion beyond the current authored node pool
still requires a separate content-generation balance review; validation and fail-closed
runtime behavior are implemented.


### Source: `archive-requirements\logic-history\03-world\MAP_CURRENT_REGION_UX_REQUIREMENT.md`

# MAP V2  REQUIREMENT HO[encoding-loss]N CH[encoding-loss]NH: KHU V[encoding-loss]C HI[encoding-loss]N T[encoding-loss]I, [encoding-loss]A L[encoding-loss] V[encoding-loss] H[encoding-loss]NH TR[encoding-loss]NH

**Phi[encoding-loss]n b[encoding-loss]n:** 2.2  
**Tr[encoding-loss]ng th[encoding-loss]i:** y[encoding-loss]u c[encoding-loss]u tri[encoding-loss]n khai b[encoding-loss]t bu[encoding-loss]c  
**Ph[encoding-loss]m vi:** b[encoding-loss]n [encoding-loss] khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i, h[encoding-loss]nh [encoding-loss]nh b[encoding-loss]n [encoding-loss], node/sub-location, topology, di chuy[encoding-loss]n v[encoding-loss] to[encoding-loss]n b[encoding-loss] tr[encoding-loss]i nghi[encoding-loss]m ng[encoding-loss][encoding-loss]i d[encoding-loss]ng li[encoding-loss]n quan.

## 1. M[encoding-loss]c ti[encoding-loss]u s[encoding-loss]n ph[encoding-loss]m

T[encoding-loss]nh nng **Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i** ph[encoding-loss]i gi[encoding-loss]p ng[encoding-loss][encoding-loss]i ch[encoding-loss]i tr[encoding-loss] l[encoding-loss]i ngay b[encoding-loss]n c[encoding-loss]u h[encoding-loss]i:

1. Ta ang [encoding-loss] [encoding-loss]u, thu[encoding-loss]c v[encoding-loss]ng [encoding-loss]nh h[encoding-loss][encoding-loss]ng n[encoding-loss]o v[encoding-loss] m[encoding-loss]c [encoding-loss] an to[encoding-loss]n ra sao?
2. T[encoding-loss] [encoding-loss]y i [encoding-loss][encoding-loss]c [encoding-loss]u b[encoding-loss]ng nh[encoding-loss]ng tuy[encoding-loss]n n[encoding-loss]o?
3. M[encoding-loss]i tuy[encoding-loss]n ang [encoding-loss] tr[encoding-loss]ng th[encoding-loss]i g[encoding-loss]: th[encoding-loss]ng su[encoding-loss]t, nguy hi[encoding-loss]m, b[encoding-loss] tu[encoding-loss]n tra, phong t[encoding-loss]a hay c[encoding-loss]n ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n?
4. N[encoding-loss]u ch[encoding-loss]n m[encoding-loss]t ph[encoding-loss][encoding-loss]ng th[encoding-loss]c di chuy[encoding-loss]n, ta s[encoding-loss] m[encoding-loss]t bao nhi[encoding-loss]u ng[encoding-loss]y, t[encoding-loss]i nguy[encoding-loss]n v[encoding-loss] c[encoding-loss] th[encoding-loss] g[encoding-loss]p r[encoding-loss]i ro g[encoding-loss]?

B[encoding-loss]n [encoding-loss] kh[encoding-loss]ng [encoding-loss][encoding-loss]c c[encoding-loss]n l[encoding-loss] danh s[encoding-loss]ch c[encoding-loss]c h[encoding-loss]p n[encoding-loss]i t[encoding-loss]y ti[encoding-loss]n. M[encoding-loss]i node ph[encoding-loss]i c[encoding-loss] v[encoding-loss] tr[encoding-loss], quy m[encoding-loss], tuy[encoding-loss]n h[encoding-loss]p l[encoding-loss], tr[encoding-loss]ng th[encoding-loss]i [encoding-loss]a l[encoding-loss] v[encoding-loss] l[encoding-loss]ch s[encoding-loss] kh[encoding-loss]m ph[encoding-loss] ri[encoding-loss]ng.

## 2. V[encoding-loss]n [encoding-loss] b[encoding-loss]t bu[encoding-loss]c ph[encoding-loss]i gi[encoding-loss]i quy[encoding-loss]t

### 2.1. L[encoding-loss]i S[encoding-loss]n m[encoding-loss]n Thi[encoding-loss]n Huy[encoding-loss]n Th[encoding-loss]ng

Hi[encoding-loss]n t[encoding-loss]i `locationExits()` l[encoding-loss]y c[encoding-loss]nh t[encoding-loss] catalog t)nh r[encoding-loss]i tr[encoding-loss]n v[encoding-loss]i `openWorld.exits`; khi thi[encoding-loss]u c[encoding-loss]nh, `move()` g[encoding-loss]i `generateOpenWorldNode()` v[encoding-loss] t[encoding-loss] n[encoding-loss]i node m[encoding-loss]i. C[encoding-loss] ch[encoding-loss] n[encoding-loss]y khi[encoding-loss]n S[encoding-loss]n m[encoding-loss]n Thi[encoding-loss]n Huy[encoding-loss]n Th[encoding-loss]ng c[encoding-loss] th[encoding-loss] n[encoding-loss]i th[encoding-loss]ng t[encoding-loss]i to[encoding-loss]n b[encoding-loss] node kh[encoding-loss]c, ph[encoding-loss] h[encoding-loss]y topology g[encoding-loss]c.

**Quy[encoding-loss]t [encoding-loss]nh ki[encoding-loss]n tr[encoding-loss]c:**

- Catalog t)nh v[encoding-loss] graph runtime ph[encoding-loss]i t[encoding-loss]ch bi[encoding-loss]t tuy[encoding-loss]t [encoding-loss]i.
- Node t)nh ch[encoding-loss] [encoding-loss][encoding-loss]c d[encoding-loss]ng c[encoding-loss]c c[encoding-loss]nh [encoding-loss][encoding-loss]c khai b[encoding-loss]o trong `WORLD_MAP`/`LOCATIONS`.
- Node runtime ch[encoding-loss] [encoding-loss][encoding-loss]c n[encoding-loss]i qua c[encoding-loss]ng sinh procedural [encoding-loss][encoding-loss]c khai b[encoding-loss]o r[encoding-loss] (`proceduralGate: true`).
- Kh[encoding-loss]ng [encoding-loss][encoding-loss]c t[encoding-loss] sinh node khi ng[encoding-loss][encoding-loss]i ch[encoding-loss]i i v[encoding-loss]o m[encoding-loss]t h[encoding-loss][encoding-loss]ng kh[encoding-loss]ng c[encoding-loss] c[encoding-loss]nh h[encoding-loss]p l[encoding-loss].
- Kh[encoding-loss]ng [encoding-loss][encoding-loss]c t[encoding-loss] ghi [encoding-loss] `LOCATIONS`, `WORLD_MAP.locations` ho[encoding-loss]c c[encoding-loss]nh c[encoding-loss]a node t)nh.
- M[encoding-loss]i node runtime ph[encoding-loss]i n[encoding-loss]m trong `state.openWorld.nodes`, c[encoding-loss] namespace `runtime:` v[encoding-loss] c[encoding-loss] `parentNodeId`/`regionId`.
- M[encoding-loss]i c[encoding-loss]ng procedural c[encoding-loss] `maxChildren`, `allowedDirections`, `allowedRegionIds`, `minFog`, `cooldownDays`.
- N[encoding-loss]u h[encoding-loss][encoding-loss]ng kh[encoding-loss]ng c[encoding-loss] c[encoding-loss]nh h[encoding-loss]p l[encoding-loss], action ph[encoding-loss]i tr[encoding-loss] `ROUTE_NOT_FOUND`; kh[encoding-loss]ng t[encoding-loss]o node ng[encoding-loss]m.

### 2.2. Tr[encoding-loss]ng th[encoding-loss]i di chuy[encoding-loss]n ch[encoding-loss]a [encoding-loss]y [encoding-loss]

`planned/active/interrupted/completed/cancelled` m[encoding-loss]i l[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i k[encoding-loss] thu[encoding-loss]t t[encoding-loss]i thi[encoding-loss]u, ch[encoding-loss]a [encoding-loss] th[encoding-loss]ng tin [encoding-loss] UX ph[encoding-loss]n [encoding-loss]nh h[encoding-loss]nh tr[encoding-loss]nh. Requirement n[encoding-loss]y b[encoding-loss] sung l[encoding-loss]p tr[encoding-loss]ng th[encoding-loss]i hi[encoding-loss]n th[encoding-loss] v[encoding-loss] lu[encoding-loss]t chuy[encoding-loss]n tr[encoding-loss]ng th[encoding-loss]i.

## 3. M[encoding-loss] h[encoding-loss]nh b[encoding-loss]n [encoding-loss] khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i

### 3.1. Ba l[encoding-loss]p hi[encoding-loss]n th[encoding-loss]

**L[encoding-loss]p A  B[encoding-loss]n [encoding-loss] khu v[encoding-loss]c:** hi[encoding-loss]n th[encoding-loss] node hi[encoding-loss]n t[encoding-loss]i, node [encoding-loss] bi[encoding-loss]t, h[encoding-loss][encoding-loss]ng i, tuy[encoding-loss]n [encoding-loss][encoding-loss]ng v[encoding-loss] [encoding-loss]nh h[encoding-loss][encoding-loss]ng th[encoding-loss] l[encoding-loss]c.

**L[encoding-loss]p B  Chi ti[encoding-loss]t node:** m[encoding-loss] khi b[encoding-loss]m node, g[encoding-loss]m t[encoding-loss]n, lo[encoding-loss]i [encoding-loss]a i[encoding-loss]m, m[encoding-loss] t[encoding-loss], c[encoding-loss]p s[encoding-loss][encoding-loss]ng m[encoding-loss], [encoding-loss]nh h[encoding-loss][encoding-loss]ng, c[encoding-loss]ng tr[encoding-loss]nh, b[encoding-loss]ng tin v[encoding-loss] c[encoding-loss]c sub-location.

**L[encoding-loss]p C  H[encoding-loss]nh tr[encoding-loss]nh:** modal/panel x[encoding-loss]c nh[encoding-loss]n tuy[encoding-loss]n, ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n, h[encoding-loss] t[encoding-loss]ng, ETA, chi ph[encoding-loss], nguy c[encoding-loss] v[encoding-loss] i[encoding-loss]u ki[encoding-loss]n phong t[encoding-loss]a.

Kh[encoding-loss]ng m[encoding-loss] modal ch[encoding-loss]ng modal. Tr[encoding-loss]n m[encoding-loss]n h[encoding-loss]nh nh[encoding-loss], l[encoding-loss]p B/C ph[encoding-loss]i chuy[encoding-loss]n th[encoding-loss]nh bottom sheet c[encoding-loss] n[encoding-loss]t [encoding-loss]ng r[encoding-loss] r[encoding-loss]ng.

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

### 3.3. Quy m[encoding-loss] sub-location

- Tr[encoding-loss]m nh[encoding-loss]: 12 sub-location.
- Th[encoding-loss]n/l[encoding-loss]ng: 24.
- Th[encoding-loss]nh th[encoding-loss]: 46.
- S[encoding-loss]n m[encoding-loss]n, v[encoding-loss][encoding-loss]ng kinh, cn c[encoding-loss] th[encoding-loss] l[encoding-loss]c: 68.
- NPC ch[encoding-loss] xu[encoding-loss]t hi[encoding-loss]n t[encoding-loss]i sub-location c[encoding-loss] th[encoding-loss]; Action Bar ch[encoding-loss] hi[encoding-loss]n th[encoding-loss] action c[encoding-loss]a sub-location ang [encoding-loss]ng.
- Chuy[encoding-loss]n sub-location trong c[encoding-loss]ng node kh[encoding-loss]ng roll s[encoding-loss] ki[encoding-loss]n [encoding-loss][encoding-loss]ng d[encoding-loss]i v[encoding-loss] kh[encoding-loss]ng [encoding-loss]i nodeId.

## 4. Topology v[encoding-loss] b[encoding-loss]o to[encoding-loss]n node

### 4.1. Resolver tuy[encoding-loss]n duy nh[encoding-loss]t

T[encoding-loss]o `resolveMapTopology(state, nodeId)` v[encoding-loss]i th[encoding-loss] t[encoding-loss]:

1. [encoding-loss]c node static n[encoding-loss]u `namespace=static`.
2. [encoding-loss]c node runtime n[encoding-loss]u `namespace=runtime`.
3. H[encoding-loss]p nh[encoding-loss]t ch[encoding-loss] c[encoding-loss]c c[encoding-loss]nh runtime [encoding-loss] [encoding-loss][encoding-loss]c c[encoding-loss]p ph[encoding-loss]p.
4. L[encoding-loss]c c[encoding-loss]nh b[encoding-loss] v[encoding-loss] hi[encoding-loss]u, h[encoding-loss]t h[encoding-loss]n, phong t[encoding-loss]a ho[encoding-loss]c kh[encoding-loss]ng [encoding-loss]t fog.
5. Kh[encoding-loss]ng g[encoding-loss]i h[encoding-loss]m sinh node trong b[encoding-loss][encoding-loss]c [encoding-loss]c.

`locationExits()` v[encoding-loss] `mapNeighbors()` ph[encoding-loss]i d[encoding-loss]ng resolver n[encoding-loss]y; `move()` kh[encoding-loss]ng [encoding-loss][encoding-loss]c t[encoding-loss] fallback sang `generateOpenWorldNode()`.

### 4.2. Procedural gate

`generateOpenWorldNode()` ch[encoding-loss] [encoding-loss][encoding-loss]c g[encoding-loss]i b[encoding-loss]i `openProceduralGate()` khi:

- node hi[encoding-loss]n t[encoding-loss]i c[encoding-loss] `proceduralGate` t[encoding-loss][encoding-loss]ng [encoding-loss]ng h[encoding-loss][encoding-loss]ng;
- [encoding-loss]t `minFog` v[encoding-loss] i[encoding-loss]u ki[encoding-loss]n nhi[encoding-loss]m v[encoding-loss];
- ch[encoding-loss]a v[encoding-loss][encoding-loss]t `maxChildren`;
- v[encoding-loss]ng [encoding-loss]ch n[encoding-loss]m trong `allowedRegionIds`;
- c[encoding-loss] transaction journal v[encoding-loss] idempotency key;
- t[encoding-loss]o node runtime [encoding-loss]c l[encoding-loss]p, kh[encoding-loss]ng s[encoding-loss]a catalog t)nh.

### 4.3. Ki[encoding-loss]m tra to[encoding-loss]n v[encoding-loss]n

Tool ki[encoding-loss]m th[encoding-loss] ph[encoding-loss]i ph[encoding-loss]t hi[encoding-loss]n:

- node static b[encoding-loss] th[encoding-loss]m/x[encoding-loss]a/s[encoding-loss]a c[encoding-loss]nh sau khi t[encoding-loss]o state;
- c[encoding-loss]nh hai chi[encoding-loss]u kh[encoding-loss]ng kh[encoding-loss]p;
- node runtime tr[encoding-loss] ra ngo[encoding-loss]i namespace h[encoding-loss]p l[encoding-loss];
- m[encoding-loss]t node c[encoding-loss] qu[encoding-loss] s[encoding-loss] con procedural;
- S[encoding-loss]n m[encoding-loss]n Thi[encoding-loss]n Huy[encoding-loss]n Th[encoding-loss]ng n[encoding-loss]i t[encoding-loss]i node kh[encoding-loss]ng n[encoding-loss]m trong catalog c[encoding-loss]nh ho[encoding-loss]c gate [encoding-loss][encoding-loss]c c[encoding-loss]p ph[encoding-loss]p.

## 5. Influence, heatmap v[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i [encoding-loss]a b[encoding-loss]n

M[encoding-loss]i node t[encoding-loss]nh influence t[encoding-loss] faction home, outpost, structure, event v[encoding-loss] kho[encoding-loss]ng c[encoding-loss]ch BFS. Kh[encoding-loss]ng l[encoding-loss]u owner t)nh.

```text
influence = factionPower [encoding-loss] 0.70^distance
          [encoding-loss] (1 + structureBonus + outpostBonus + eventBonus)
```

- `[encoding-loss]n [encoding-loss]nh`: top influence e 35 v[encoding-loss] ch[encoding-loss]nh l[encoding-loss]ch top/second e 15%.
- `Tranh ch[encoding-loss]p`: top-two c[encoding-loss]ng hi[encoding-loss]n di[encoding-loss]n v[encoding-loss] ch[encoding-loss]nh l[encoding-loss]ch < 15%.
- `Bi[encoding-loss]n gi[encoding-loss]i`: kh[encoding-loss]ng faction n[encoding-loss]o v[encoding-loss][encoding-loss]t ng[encoding-loss][encoding-loss]ng [encoding-loss]n [encoding-loss]nh.

UI khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i ph[encoding-loss]i hi[encoding-loss]n th[encoding-loss] gradient m[encoding-loss]u, kh[encoding-loss]ng ch[encoding-loss] m[encoding-loss]t nh[encoding-loss]n owner. Khi fog < 2 ch[encoding-loss] hi[encoding-loss]n th[encoding-loss] [encoding-loss]nh h[encoding-loss][encoding-loss]ng ch[encoding-loss]a r[encoding-loss].

## 6. Fog of war b[encoding-loss]n c[encoding-loss]p

| C[encoding-loss]p | T[encoding-loss]n | Hi[encoding-loss]n th[encoding-loss] |
|---|---|---|
| 0 | Ch[encoding-loss]a bi[encoding-loss]t | Kh[encoding-loss]ng hi[encoding-loss]n node tr[encoding-loss]n b[encoding-loss]n [encoding-loss] khu v[encoding-loss]c |
| 1 | Nghe [encoding-loss]n | T[encoding-loss]n m[encoding-loss], h[encoding-loss][encoding-loss]ng t[encoding-loss][encoding-loss]ng [encoding-loss]i, kh[encoding-loss]ng hi[encoding-loss]n tuy[encoding-loss]n chi ti[encoding-loss]t |
| 2 | [encoding-loss] kh[encoding-loss]m ph[encoding-loss] | Hi[encoding-loss]n node, tuy[encoding-loss]n h[encoding-loss]p l[encoding-loss], nguy c[encoding-loss] c[encoding-loss] b[encoding-loss]n |
| 3 | Th[encoding-loss]ng thu[encoding-loss]c | Hi[encoding-loss]n sub-location, heatmap chi ti[encoding-loss]t, c[encoding-loss]ng tr[encoding-loss]nh, b[encoding-loss]ng tin v[encoding-loss] tu[encoding-loss]n tra |

M[encoding-loss]i n[encoding-loss]ng c[encoding-loss]p fog ph[encoding-loss]i qua discovery event idempotent, kh[encoding-loss]ng spoil sub-location khi ch[encoding-loss] m[encoding-loss]i [encoding-loss]t c[encoding-loss]p 1.

## 7. Thi[encoding-loss]t k[encoding-loss] UI Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i

### 7.1. Thanh th[encoding-loss]ng tin c[encoding-loss] [encoding-loss]nh

[encoding-loss] [encoding-loss]u panel hi[encoding-loss]n th[encoding-loss]:

- t[encoding-loss]n node v[encoding-loss] v[encoding-loss]ng;
- lo[encoding-loss]i [encoding-loss]a i[encoding-loss]m;
- c[encoding-loss]p kh[encoding-loss]m ph[encoding-loss];
- tr[encoding-loss]ng th[encoding-loss]i [encoding-loss]a b[encoding-loss]n: [encoding-loss]n [encoding-loss]nh / Tranh ch[encoding-loss]p / Bi[encoding-loss]n gi[encoding-loss]i;
- [encoding-loss]nh h[encoding-loss][encoding-loss]ng n[encoding-loss]i b[encoding-loss]t;
- nguy c[encoding-loss] t[encoding-loss]ng h[encoding-loss]p;
- tr[encoding-loss]ng th[encoding-loss]i h[encoding-loss]nh tr[encoding-loss]nh hi[encoding-loss]n t[encoding-loss]i n[encoding-loss]u ang di chuy[encoding-loss]n.

### 7.2. B[encoding-loss]n [encoding-loss] h[encoding-loss]nh [encoding-loss]nh

- D[encoding-loss]ng n[encoding-loss]n minh h[encoding-loss]a b[encoding-loss]n [encoding-loss] c[encoding-loss] l[encoding-loss]p texture theo v[encoding-loss]ng; kh[encoding-loss]ng d[encoding-loss]ng n[encoding-loss]n ph[encoding-loss]ng v[encoding-loss]i c[encoding-loss]c ch[encoding-loss]m r[encoding-loss]i r[encoding-loss]c.
- Node hi[encoding-loss]n t[encoding-loss]i c[encoding-loss] v[encoding-loss]ng s[encoding-loss]ng v[encoding-loss] nh[encoding-loss]n lu[encoding-loss]n [encoding-loss]c [encoding-loss][encoding-loss]c.
- Node [encoding-loss] bi[encoding-loss]t d[encoding-loss]ng bi[encoding-loss]u t[encoding-loss][encoding-loss]ng theo `nodeType`.
- Node c[encoding-loss]p 1 d[encoding-loss]ng silhouette/m[encoding-loss]; node c[encoding-loss]p 0 kh[encoding-loss]ng render.
- Tuy[encoding-loss]n c[encoding-loss] m[encoding-loss]u theo tr[encoding-loss]ng th[encoding-loss]i: xanh th[encoding-loss]ng su[encoding-loss]t, v[encoding-loss]ng h[encoding-loss]n ch[encoding-loss], [encoding-loss] nguy hi[encoding-loss]m, t[encoding-loss]m phong t[encoding-loss]a, x[encoding-loss]m ch[encoding-loss]a r[encoding-loss].
- Patrol edge d[encoding-loss]ng icon khi[encoding-loss]n/tu[encoding-loss]n tra chuy[encoding-loss]n [encoding-loss]ng nh[encoding-loss]; kh[encoding-loss]ng t[encoding-loss]o node gi[encoding-loss].
- Outpost/structure d[encoding-loss]ng icon ri[encoding-loss]ng, tooltip ti[encoding-loss]ng Vi[encoding-loss]t.
- B[encoding-loss]n [encoding-loss] ph[encoding-loss]i c[encoding-loss] zoom, pan, reset, ch[encoding-loss] gi[encoding-loss]i v[encoding-loss] h[encoding-loss] tr[encoding-loss] b[encoding-loss]n ph[encoding-loss]m.
- M[encoding-loss]i icon c[encoding-loss] `aria-label`, kh[encoding-loss]ng truy[encoding-loss]n [encoding-loss]t th[encoding-loss]ng tin ch[encoding-loss] b[encoding-loss]ng m[encoding-loss]u.

### 7.3. Chi ti[encoding-loss]t node

Khi b[encoding-loss]m node, m[encoding-loss] th[encoding-loss] chi ti[encoding-loss]t g[encoding-loss]m:

- [encoding-loss]nh minh h[encoding-loss]a theo `visualTag`;
- m[encoding-loss] t[encoding-loss] ng[encoding-loss]n v[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i th[encoding-loss]i ti[encoding-loss]t;
- influence gradient/heatmap;
- danh s[encoding-loss]ch sub-location d[encoding-loss]ng th[encoding-loss];
- NPC hi[encoding-loss]n di[encoding-loss]n t[encoding-loss]i [encoding-loss]ng sub-location;
- c[encoding-loss]u tr[encoding-loss]c/tr[encoding-loss]m v[encoding-loss] [encoding-loss] b[encoding-loss]n;
- b[encoding-loss]ng tin faction [encoding-loss] l[encoding-loss]c theo fog v[encoding-loss] th[encoding-loss]i h[encoding-loss]n;
- n[encoding-loss]t L[encoding-loss]p Tr[encoding-loss]m, X[encoding-loss]y Th[encoding-loss]p canh, X[encoding-loss]y Tr[encoding-loss]m giao th[encoding-loss][encoding-loss]ng ch[encoding-loss] khi [encoding-loss] i[encoding-loss]u ki[encoding-loss]n.

### 7.4. Tr[encoding-loss]ng th[encoding-loss]i r[encoding-loss]ng v[encoding-loss] l[encoding-loss]i

- Kh[encoding-loss]ng c[encoding-loss] tuy[encoding-loss]n: Ch[encoding-loss]a c[encoding-loss] tuy[encoding-loss]n [encoding-loss][encoding-loss]ng h[encoding-loss]p l[encoding-loss] t[encoding-loss] [encoding-loss]y.
- Ch[encoding-loss]a [encoding-loss] fog: C[encoding-loss]n th[encoding-loss]m manh m[encoding-loss]i [encoding-loss] nh[encoding-loss]n r[encoding-loss] khu v[encoding-loss]c n[encoding-loss]y.
- Phong t[encoding-loss]a: hi[encoding-loss]n th[encoding-loss] faction, l[encoding-loss] do, th[encoding-loss]i h[encoding-loss]n d[encoding-loss] ki[encoding-loss]n v[encoding-loss] l[encoding-loss]a ch[encoding-loss]n h[encoding-loss] t[encoding-loss]ng/[encoding-loss][encoding-loss]ng v[encoding-loss]ng.
- Thi[encoding-loss]u t[encoding-loss]i nguy[encoding-loss]n: hi[encoding-loss]n s[encoding-loss] ang c[encoding-loss]/s[encoding-loss] c[encoding-loss]n, kh[encoding-loss]ng ch[encoding-loss] hi[encoding-loss]n m[encoding-loss] l[encoding-loss]i.
- H[encoding-loss]nh tr[encoding-loss]nh b[encoding-loss] gi[encoding-loss]n o[encoding-loss]n: gi[encoding-loss] log, cho ph[encoding-loss]p ti[encoding-loss]p t[encoding-loss]c, [encoding-loss]i tuy[encoding-loss]n ho[encoding-loss]c h[encoding-loss]y.

## 8. H[encoding-loss] th[encoding-loss]ng tr[encoding-loss]ng th[encoding-loss]i di chuy[encoding-loss]n

### 8.1. Tr[encoding-loss]ng th[encoding-loss]i runtime

`planned [encoding-loss] active [encoding-loss] completed`  
`active [encoding-loss] interrupted [encoding-loss] active`  
`planned/active/interrupted [encoding-loss] cancelled`  
`active [encoding-loss] failed` ch[encoding-loss] khi route b[encoding-loss] h[encoding-loss]y b[encoding-loss]i th[encoding-loss] gi[encoding-loss]i v[encoding-loss] kh[encoding-loss]ng th[encoding-loss] ti[encoding-loss]p t[encoding-loss]c.

### 8.2. Nguy[encoding-loss]n nh[encoding-loss]n gi[encoding-loss]n o[encoding-loss]n

- g[encoding-loss]p qu[encoding-loss]i/mai ph[encoding-loss]c;
- b[encoding-loss]o, li, s[encoding-loss]t l[encoding-loss];
- patrol ki[encoding-loss]m tra;
- faction phong t[encoding-loss]a;
- ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n h[encoding-loss]ng;
- thi[encoding-loss]u ph[encoding-loss] duy tr[encoding-loss] caravan/escort;
- node [encoding-loss]ch [encoding-loss]i tr[encoding-loss]ng th[encoding-loss]i th[encoding-loss]nh kh[encoding-loss]ng th[encoding-loss] ti[encoding-loss]p c[encoding-loss]n.

### 8.3. Travel mode

| Ph[encoding-loss][encoding-loss]ng th[encoding-loss]c | i[encoding-loss]u ki[encoding-loss]n | T[encoding-loss]c [encoding-loss] | [encoding-loss]c t[encoding-loss]nh |
|---|---|---:|---|
| i b[encoding-loss] | lu[encoding-loss]n c[encoding-loss] n[encoding-loss]u tuy[encoding-loss]n m[encoding-loss] | 1.0x | r[encoding-loss], nhi[encoding-loss]u c[encoding-loss] h[encoding-loss]i d[encoding-loss]c [encoding-loss][encoding-loss]ng |
| Ng[encoding-loss] kh[encoding-loss] | c[encoding-loss] c[encoding-loss]ng ph[encoding-loss]p ph[encoding-loss] h[encoding-loss]p | 3.0x | nhanh, t[encoding-loss]n Linh Th[encoding-loss]ch, kh[encoding-loss]ng d[encoding-loss]ng [encoding-loss] tuy[encoding-loss]n c[encoding-loss]m |
| Th[encoding-loss] c[encoding-loss][encoding-loss]i | c[encoding-loss] th[encoding-loss] c[encoding-loss][encoding-loss]i/[encoding-loss]ng h[encoding-loss]nh h[encoding-loss]p l[encoding-loss] | 2.0x | gi[encoding-loss]m r[encoding-loss]i ro [encoding-loss][encoding-loss]ng b[encoding-loss] |
| Thuy[encoding-loss]n | c[encoding-loss] hai [encoding-loss]u l[encoding-loss] b[encoding-loss]n/n[encoding-loss][encoding-loss]c | 2.0x | ch[encoding-loss]u b[encoding-loss]o, kh[encoding-loss]ng i tuy[encoding-loss]n n[encoding-loss]i |
| o[encoding-loss]n xe | c[encoding-loss] caravan v[encoding-loss] tuy[encoding-loss]n [encoding-loss][encoding-loss]ng | 1.5x | gi[encoding-loss]m r[encoding-loss]i ro, t[encoding-loss]n ph[encoding-loss] duy tr[encoding-loss] |
| o[encoding-loss]n th[encoding-loss][encoding-loss]ng nh[encoding-loss]n | hub th[encoding-loss][encoding-loss]ng m[encoding-loss]i [encoding-loss] m[encoding-loss] | 1.25x | gi[encoding-loss]m gi[encoding-loss]/nh[encoding-loss]n tin, d[encoding-loss] b[encoding-loss] ph[encoding-loss]c k[encoding-loss]ch |
| Truy[encoding-loss]n t[encoding-loss]ng tr[encoding-loss]n | m[encoding-loss] fast travel [encoding-loss] c[encoding-loss] hai [encoding-loss]u | t[encoding-loss]c th[encoding-loss]i | kh[encoding-loss]ng roll road event, t[encoding-loss]n Linh Th[encoding-loss]ch |

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

M[encoding-loss]i ng[encoding-loss]y ch[encoding-loss] resolve m[encoding-loss]t l[encoding-loss]n theo `taskId + dayIndex`; retry ph[encoding-loss]i idempotent.

## 9. Action Bar  lu[encoding-loss]t [encoding-loss]a action v[encoding-loss]o [encoding-loss]ng th[encoding-loss]i i[encoding-loss]m

- Action di chuy[encoding-loss]n ch[encoding-loss] hi[encoding-loss]n cho c[encoding-loss]nh [encoding-loss] resolve, [encoding-loss] fog v[encoding-loss] kh[encoding-loss]ng b[encoding-loss] kh[encoding-loss]a ho[encoding-loss]n to[encoding-loss]n.
- Action ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n ch[encoding-loss] hi[encoding-loss]n khi `travelPreview()` tr[encoding-loss] `success=true`; n[encoding-loss]u kh[encoding-loss]ng [encoding-loss] i[encoding-loss]u ki[encoding-loss]n th[encoding-loss] hi[encoding-loss]n th[encoding-loss] trong ph[encoding-loss]n Ph[encoding-loss][encoding-loss]ng th[encoding-loss]c kh[encoding-loss]c [encoding-loss] tr[encoding-loss]ng th[encoding-loss]i disabled k[encoding-loss]m l[encoding-loss] do, kh[encoding-loss]ng [encoding-loss]a v[encoding-loss]o Action Bar ch[encoding-loss]nh.
- L[encoding-loss]p Tr[encoding-loss]m Ti[encoding-loss]n Ti[encoding-loss]u ch[encoding-loss] hi[encoding-loss]n t[encoding-loss]i node bi[encoding-loss]n/tranh ch[encoding-loss]p ch[encoding-loss]a c[encoding-loss] outpost, kh[encoding-loss]ng giao chi[encoding-loss]n v[encoding-loss] [encoding-loss] chi ph[encoding-loss].
- Action x[encoding-loss]y c[encoding-loss]ng tr[encoding-loss]nh ch[encoding-loss] hi[encoding-loss]n t[encoding-loss]i node hi[encoding-loss]n t[encoding-loss]i, kh[encoding-loss]ng giao chi[encoding-loss]n, [encoding-loss] chi ph[encoding-loss] v[encoding-loss] c[encoding-loss] outpost ng[encoding-loss][encoding-loss]i ch[encoding-loss]i ho[encoding-loss]c node bi[encoding-loss]n [encoding-loss][encoding-loss]c ph[encoding-loss]p khai ph[encoding-loss].
- Truy[encoding-loss]n t[encoding-loss]ng tr[encoding-loss]n ch[encoding-loss] hi[encoding-loss]n khi c[encoding-loss] hai [encoding-loss]u [encoding-loss] m[encoding-loss] fast travel.
- H[encoding-loss]y h[encoding-loss]nh tr[encoding-loss]nh ch[encoding-loss] hi[encoding-loss]n khi task [encoding-loss] `planned`, `active` ho[encoding-loss]c `interrupted`.
- Ti[encoding-loss]p t[encoding-loss]c h[encoding-loss]nh tr[encoding-loss]nh ch[encoding-loss] hi[encoding-loss]n khi interruption [encoding-loss] c[encoding-loss] ph[encoding-loss][encoding-loss]ng [encoding-loss]n x[encoding-loss] l[encoding-loss].
- Action c[encoding-loss]a sub-location ch[encoding-loss] hi[encoding-loss]n sau khi ng[encoding-loss][encoding-loss]i ch[encoding-loss]i th[encoding-loss]c s[encoding-loss] v[encoding-loss]o sub-location [encoding-loss].

## 10. Transaction v[encoding-loss] rollback

M[encoding-loss]i mutation map d[encoding-loss]ng `resolveMapTransaction` v[encoding-loss]i:

- `actionId`, `actorId`, `expectedVersion`;
- ki[encoding-loss]m tra topology, fog, quy[encoding-loss]n, chi ph[encoding-loss], combat v[encoding-loss] blockade;
- snapshot tr[encoding-loss][encoding-loss]c mutation;
- journal idempotency;
- rollback [encoding-loss]y [encoding-loss] n[encoding-loss]u tr[encoding-loss] t[encoding-loss]i nguy[encoding-loss]n th[encoding-loss]nh c[encoding-loss]ng nh[encoding-loss]ng t[encoding-loss]o task/node th[encoding-loss]t b[encoding-loss]i.

## 11. K[encoding-loss] ho[encoding-loss]ch tri[encoding-loss]n khai

### Pha 1  Kh[encoding-loss]a topology

- T[encoding-loss]o static/runtime namespace.
- Vi[encoding-loss]t `resolveMapTopology()` v[encoding-loss] lo[encoding-loss]i fallback sinh node trong `move()`.
- Di tr[encoding-loss] runtime node ci sang `state.openWorld.nodes`.
- Th[encoding-loss]m test h[encoding-loss]i quy S[encoding-loss]n m[encoding-loss]n Thi[encoding-loss]n Huy[encoding-loss]n Th[encoding-loss]ng.

### Pha 2  Travel state machine

- Chu[encoding-loss]n h[encoding-loss]a `TravelTask` v[encoding-loss] c[encoding-loss]c transition.
- [encoding-loss]p d[encoding-loss]ng travel mode, blockade, escort, ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n v[encoding-loss] chi ph[encoding-loss].
- Hi[encoding-loss]n th[encoding-loss] ETA/risk/interruption trong UI.

### Pha 3  Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i v[encoding-loss] h[encoding-loss]nh [encoding-loss]nh

- X[encoding-loss]y l[encoding-loss]i `renderLocalMap()` theo layout b[encoding-loss]n [encoding-loss] h[encoding-loss]nh [encoding-loss]nh.
- Th[encoding-loss]m l[encoding-loss]p tuy[encoding-loss]n, icon node, heatmap, patrol, outpost v[encoding-loss] ch[encoding-loss] gi[encoding-loss]i.
- Th[encoding-loss]m responsive bottom sheet, keyboard navigation, aria-label.

### Pha 4  Node detail v[encoding-loss] action context

- Sub-location, NPC placement, bulletin, structure detail.
- Action Bar theo context v[encoding-loss] preview i[encoding-loss]u ki[encoding-loss]n.

### Pha 5  QA v[encoding-loss] c[encoding-loss]n b[encoding-loss]ng

- Stress test topology 1.000 l[encoding-loss][encoding-loss]t di chuy[encoding-loss]n.
- Ki[encoding-loss]m th[encoding-loss] deterministic travel retry.
- Ki[encoding-loss]m th[encoding-loss] fog/privacy, blockade, escort, fast travel v[encoding-loss] rollback.
- So s[encoding-loss]nh screenshot desktop/mobile tr[encoding-loss][encoding-loss]c khi ph[encoding-loss]t h[encoding-loss]nh.

## 12. Acceptance criteria

1. T[encoding-loss] S[encoding-loss]n m[encoding-loss]n Thi[encoding-loss]n Huy[encoding-loss]n Th[encoding-loss]ng kh[encoding-loss]ng th[encoding-loss] i t[encoding-loss]i node kh[encoding-loss]ng c[encoding-loss] c[encoding-loss]nh/gate [encoding-loss][encoding-loss]c khai b[encoding-loss]o.
2. Kh[encoding-loss]ng m[encoding-loss]t thao t[encoding-loss]c di chuy[encoding-loss]n n[encoding-loss]o s[encoding-loss]a catalog static.
3. Runtime node lu[encoding-loss]n c[encoding-loss] namespace, parent, region v[encoding-loss] journal.
4. Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i hi[encoding-loss]n th[encoding-loss] [encoding-loss][encoding-loss]c node, tuy[encoding-loss]n, heatmap, fog v[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i tu[encoding-loss]n tra.
5. Ng[encoding-loss][encoding-loss]i ch[encoding-loss]i th[encoding-loss]y r[encoding-loss] ETA, chi ph[encoding-loss], nguy c[encoding-loss] v[encoding-loss] l[encoding-loss] do kh[encoding-loss]ng th[encoding-loss] d[encoding-loss]ng ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n.
6. Travel task kh[encoding-loss]i ph[encoding-loss]c [encoding-loss]ng sau reload, retry kh[encoding-loss]ng nh[encoding-loss]n [encoding-loss]i chi ph[encoding-loss]/s[encoding-loss] ki[encoding-loss]n.
7. C[encoding-loss]c tr[encoding-loss]ng th[encoding-loss]i `planned/active/interrupted/completed/cancelled/failed` [encoding-loss]u c[encoding-loss] UI v[encoding-loss] transition h[encoding-loss]p l[encoding-loss].
8. Action Bar kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] action ngo[encoding-loss]i i[encoding-loss]u ki[encoding-loss]n; action tr[encoding-loss]c ti[encoding-loss]p qua API v[encoding-loss]n b[encoding-loss] ch[encoding-loss]n [encoding-loss]ng.
9. Kh[encoding-loss]ng c[encoding-loss]n nh[encoding-loss]n k[encoding-loss] thu[encoding-loss]t nh[encoding-loss] `watchtower`, `trading_post`, `stable`, `contested`, `frontier` hi[encoding-loss]n th[encoding-loss] cho ng[encoding-loss][encoding-loss]i ch[encoding-loss]i.
10. B[encoding-loss] x[encoding-loss]c minh game, stress test topology v[encoding-loss] ki[encoding-loss]m tra giao di[encoding-loss]n desktop/mobile [encoding-loss]u [encoding-loss]t.
## 13. R[encoding-loss] so[encoding-loss]t kho[encoding-loss]ng tr[encoding-loss]ng v[encoding-loss] c[encoding-loss]i ti[encoding-loss]n b[encoding-loss]t bu[encoding-loss]c

### 13.1. Bi[encoding-loss]n Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i th[encoding-loss]nh m[encoding-loss]n h[encoding-loss]nh ch[encoding-loss]i [encoding-loss][encoding-loss]c

Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i kh[encoding-loss]ng ch[encoding-loss] l[encoding-loss] m[encoding-loss]n h[encoding-loss]nh tra c[encoding-loss]u. M[encoding-loss]i node ph[encoding-loss]i c[encoding-loss] `localState` rebuild [encoding-loss][encoding-loss]c, g[encoding-loss]m d[encoding-loss]n c[encoding-loss], ph[encoding-loss]n vinh, an ninh, khan hi[encoding-loss]m t[encoding-loss]i nguy[encoding-loss]n, th[encoding-loss]i ti[encoding-loss]t, gi[encoding-loss] m[encoding-loss] c[encoding-loss]a v[encoding-loss] s[encoding-loss] ki[encoding-loss]n ang di[encoding-loss]n ra. C[encoding-loss]c gi[encoding-loss] tr[encoding-loss] n[encoding-loss]y t[encoding-loss]c [encoding-loss]ng tr[encoding-loss]c ti[encoding-loss]p t[encoding-loss]i gi[encoding-loss] ch[encoding-loss], NPC, nhi[encoding-loss]m v[encoding-loss] v[encoding-loss] r[encoding-loss]i ro di chuy[encoding-loss]n.

### 13.2. B[encoding-loss] ho[encoding-loss]t [encoding-loss]ng t[encoding-loss]i ch[encoding-loss]

M[encoding-loss]i node c[encoding-loss]n 38 ho[encoding-loss]t [encoding-loss]ng theo lo[encoding-loss]i node v[encoding-loss] sub-location: quan s[encoding-loss]t, t[encoding-loss]m ki[encoding-loss]m, giao d[encoding-loss]ch, ngh[encoding-loss] tr[encoding-loss], s[encoding-loss]a ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n, thu[encoding-loss] h[encoding-loss] t[encoding-loss]ng, nh[encoding-loss]n tin, do th[encoding-loss]m tu[encoding-loss]n tra, h[encoding-loss] tr[encoding-loss] d[encoding-loss]n c[encoding-loss], m[encoding-loss] [encoding-loss][encoding-loss]ng t[encoding-loss]t v[encoding-loss] [encoding-loss]t m[encoding-loss]c c[encoding-loss] nh[encoding-loss]n. M[encoding-loss]i ho[encoding-loss]t [encoding-loss]ng khai b[encoding-loss]o `requirements`, `duration`, `cost`, `risk`, `effects`, `cooldown`, `sourceSubLocationId`. Action Resolver kh[encoding-loss]ng [encoding-loss][encoding-loss]c [encoding-loss]a ho[encoding-loss]t [encoding-loss]ng h[encoding-loss]t gi[encoding-loss], h[encoding-loss]t cooldown ho[encoding-loss]c thi[encoding-loss]u i[encoding-loss]u ki[encoding-loss]n v[encoding-loss]o Action Bar ch[encoding-loss]nh.

### 13.3. S[encoding-loss] ki[encoding-loss]n [encoding-loss]ng c[encoding-loss]p khu v[encoding-loss]c

Th[encoding-loss]m `LocalIncident` v[encoding-loss]i v[encoding-loss]ng [encoding-loss]i `rumor [encoding-loss] emerging [encoding-loss] active [encoding-loss] resolved/expired`. V[encoding-loss] d[encoding-loss]: ch[encoding-loss] ch[encoding-loss]y, c[encoding-loss]u s[encoding-loss]p, th[encoding-loss] tri[encoding-loss]u, ki[encoding-loss]m tra c[encoding-loss]ng, th[encoding-loss][encoding-loss]ng o[encoding-loss]n [encoding-loss]n, d[encoding-loss]ch b[encoding-loss]nh, tranh ch[encoding-loss]p [encoding-loss]t ho[encoding-loss]c h[encoding-loss]i ch[encoding-loss]. Incident ph[encoding-loss]i t[encoding-loss]c [encoding-loss]ng t[encoding-loss]i node/edge, c[encoding-loss] y[encoding-loss]u c[encoding-loss]u fog, th[encoding-loss]i h[encoding-loss]n, [encoding-loss]t nh[encoding-loss]t hai l[encoding-loss]a ch[encoding-loss]n c[encoding-loss] [encoding-loss]nh [encoding-loss]i, ghi log v[encoding-loss] kh[encoding-loss]ng nh[encoding-loss]n [encoding-loss]i sau reload/retry.

### 13.4. L[encoding-loss]p tuy[encoding-loss]n nhi[encoding-loss]u ti[encoding-loss]u ch[encoding-loss]

Th[encoding-loss]m ch[encoding-loss] [encoding-loss] **L[encoding-loss]p tuy[encoding-loss]n**: ch[encoding-loss]n node [encoding-loss]ch, hi[encoding-loss]n th[encoding-loss] 13 tuy[encoding-loss]n t[encoding-loss]t nh[encoding-loss]t theo nhanh nh[encoding-loss]t/an to[encoding-loss]n nh[encoding-loss]t/r[encoding-loss] nh[encoding-loss]t/k[encoding-loss]n [encoding-loss]o nh[encoding-loss]t, so s[encoding-loss]nh ETA, chi ph[encoding-loss], blockade, patrol, th[encoding-loss]i ti[encoding-loss]t v[encoding-loss] c[encoding-loss] h[encoding-loss]i d[encoding-loss]c [encoding-loss][encoding-loss]ng. Cho ph[encoding-loss]p waypoint v[encoding-loss] [encoding-loss]i ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n theo t[encoding-loss]ng ch[encoding-loss]ng; ch[encoding-loss] t[encoding-loss]o `travelTask` sau khi x[encoding-loss]c nh[encoding-loss]n.

### 13.5. Tr[encoding-loss]ng th[encoding-loss]i c[encoding-loss]nh chi ti[encoding-loss]t

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

Edge b[encoding-loss] phong t[encoding-loss]a kh[encoding-loss]ng [encoding-loss][encoding-loss]c x[encoding-loss]a kh[encoding-loss]i graph; ch[encoding-loss] [encoding-loss]i tr[encoding-loss]ng th[encoding-loss]i [encoding-loss] gi[encoding-loss] l[encoding-loss]ch s[encoding-loss], [encoding-loss][encoding-loss]ng v[encoding-loss]ng v[encoding-loss] kh[encoding-loss] nng m[encoding-loss] l[encoding-loss]i.

### 13.6. T[encoding-loss][encoding-loss]ng t[encoding-loss]c th[encoding-loss] l[encoding-loss]c t[encoding-loss]i node

Ng[encoding-loss][encoding-loss]i ch[encoding-loss]i c[encoding-loss] th[encoding-loss] xin gi[encoding-loss]y th[encoding-loss]ng h[encoding-loss]nh, n[encoding-loss]p ph[encoding-loss], nh[encoding-loss]n nhi[encoding-loss]m v[encoding-loss] b[encoding-loss]ng tin, th[encoding-loss][encoding-loss]ng l[encoding-loss][encoding-loss]ng gi[encoding-loss]m phong t[encoding-loss]a, do th[encoding-loss]m ho[encoding-loss]c ph[encoding-loss] tu[encoding-loss]n tra, xin h[encoding-loss] t[encoding-loss]ng, hi[encoding-loss]n outpost v[encoding-loss] x[encoding-loss] l[encoding-loss] incident. M[encoding-loss]i faction c[encoding-loss]n profile ri[encoding-loss]ng cho ki[encoding-loss]n tr[encoding-loss]c, lu[encoding-loss]t [encoding-loss]a ph[encoding-loss][encoding-loss]ng, patrol, thu[encoding-loss], i[encoding-loss]u ki[encoding-loss]n v[encoding-loss]o v[encoding-loss] ph[encoding-loss]n [encoding-loss]ng danh ti[encoding-loss]ng; kh[encoding-loss]ng d[encoding-loss]ng m[encoding-loss] t[encoding-loss] chung cho m[encoding-loss]i t[encoding-loss] ch[encoding-loss]c.

### 13.7. NPC s[encoding-loss]ng trong khu v[encoding-loss]c

Scheduler ph[encoding-loss]i c[encoding-loss]p nh[encoding-loss]t `currentNodeId`, `currentSubLocationId`, `scheduleStatus`, `availabilityReason`. UI hi[encoding-loss]n th[encoding-loss] NPC ang [encoding-loss] [encoding-loss]u, gi[encoding-loss] c[encoding-loss] th[encoding-loss] g[encoding-loss]p, ang di chuy[encoding-loss]n/b[encoding-loss]n/v[encoding-loss]ng m[encoding-loss]t v[encoding-loss] th[encoding-loss]i i[encoding-loss]m quay l[encoding-loss]i. Kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] NPC [encoding-loss]o ch[encoding-loss] v[encoding-loss] t[encoding-loss]n t[encoding-loss]i trong catalog.

### 13.8. Kinh t[encoding-loss] [encoding-loss]a ph[encoding-loss][encoding-loss]ng

Gi[encoding-loss] market/trading post t[encoding-loss]nh t[encoding-loss] ph[encoding-loss]n vinh, khan hi[encoding-loss]m, thu[encoding-loss] faction, th[encoding-loss]i ti[encoding-loss]t, incident v[encoding-loss] ngu[encoding-loss]n cung di chuy[encoding-loss]n. Bi[encoding-loss]n [encoding-loss]ng c[encoding-loss] gi[encoding-loss]i h[encoding-loss]n m[encoding-loss]i ng[encoding-loss]y, deterministic theo world tick. Trading post ch[encoding-loss] tng yield khi node c[encoding-loss] market sub-location v[encoding-loss] c[encoding-loss]ng tr[encoding-loss]nh c[encoding-loss]n integrity.

### 13.9. Ghi ch[encoding-loss] v[encoding-loss] d[encoding-loss]u v[encoding-loss]t c[encoding-loss] nh[encoding-loss]n

Cho ph[encoding-loss]p ghim node, ghi ch[encoding-loss] t[encoding-loss]i a 200 k[encoding-loss] t[encoding-loss], [encoding-loss]nh d[encoding-loss]u nguy hi[encoding-loss]m/c[encoding-loss] h[encoding-loss]i/quay l[encoding-loss]i sau v[encoding-loss] l[encoding-loss]u route y[encoding-loss]u th[encoding-loss]ch. Ghi ch[encoding-loss] kh[encoding-loss]ng [encoding-loss][encoding-loss]c thay [encoding-loss]i topology ho[encoding-loss]c l[encoding-loss]m l[encoding-loss] fog.

## 14. Lu[encoding-loss]ng UX b[encoding-loss]t bu[encoding-loss]c

```text
M[encoding-loss] Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i
  [encoding-loss] [encoding-loss]c t[encoding-loss]m t[encoding-loss]t node
  [encoding-loss] xem tuy[encoding-loss]n/incident/[encoding-loss]nh h[encoding-loss][encoding-loss]ng
  [encoding-loss] ch[encoding-loss]n node ho[encoding-loss]c sub-location
  [encoding-loss] ch[encoding-loss]n ho[encoding-loss]t [encoding-loss]ng ho[encoding-loss]c L[encoding-loss]p tuy[encoding-loss]n
  [encoding-loss] xem preview chi ph[encoding-loss]/r[encoding-loss]i ro
  [encoding-loss] x[encoding-loss]c nh[encoding-loss]n
  [encoding-loss] theo d[encoding-loss]i task v[encoding-loss] nh[encoding-loss]t k[encoding-loss]
```

M[encoding-loss]i h[encoding-loss]nh [encoding-loss]ng l[encoding-loss]m m[encoding-loss]t ng[encoding-loss]y, t[encoding-loss]i nguy[encoding-loss]n, [encoding-loss] b[encoding-loss]n, danh ti[encoding-loss]ng ho[encoding-loss]c tng r[encoding-loss]i ro [encoding-loss]u ph[encoding-loss]i c[encoding-loss] preview tr[encoding-loss][encoding-loss]c/sau, th[encoding-loss]i gian, d[encoding-loss]i r[encoding-loss]i ro, t[encoding-loss]c [encoding-loss]ng faction, i[encoding-loss]u ki[encoding-loss]n th[encoding-loss]t b[encoding-loss]i v[encoding-loss] n[encoding-loss]t quay l[encoding-loss]i.

### 14.1. Nh[encoding-loss]t k[encoding-loss] b[encoding-loss]n [encoding-loss]

Timeline l[encoding-loss]c theo di chuy[encoding-loss]n, kh[encoding-loss]m ph[encoding-loss], th[encoding-loss] l[encoding-loss]c, incident, giao d[encoding-loss]ch, tu[encoding-loss]n tra v[encoding-loss] c[encoding-loss]ng tr[encoding-loss]nh. M[encoding-loss]i b[encoding-loss]n ghi c[encoding-loss] node, sub-location, ng[encoding-loss]y game, k[encoding-loss]t qu[encoding-loss] v[encoding-loss] source action [encoding-loss] gi[encoding-loss]i th[encoding-loss]ch v[encoding-loss] sao tuy[encoding-loss]n [encoding-loss]i tr[encoding-loss]ng th[encoding-loss]i.

### 14.2. Responsive v[encoding-loss] ti[encoding-loss]p c[encoding-loss]n

Desktop d[encoding-loss]ng b[encoding-loss]n [encoding-loss] tr[encoding-loss]i/detail ph[encoding-loss]i; tablet b[encoding-loss]n [encoding-loss] tr[encoding-loss]n/detail d[encoding-loss][encoding-loss]i; mobile d[encoding-loss]ng bottom sheet. H[encoding-loss] tr[encoding-loss] Tab/Enter/Escape, focus trap, reduced motion, t[encoding-loss][encoding-loss]ng ph[encoding-loss]n WCAG AA v[encoding-loss] aria-label cho m[encoding-loss]i icon.

## 15. H[encoding-loss] th[encoding-loss]ng h[encoding-loss]nh [encoding-loss]nh b[encoding-loss]n [encoding-loss]

M[encoding-loss]i v[encoding-loss]ng c[encoding-loss] n[encoding-loss]n b[encoding-loss]n [encoding-loss] t[encoding-loss] l[encoding-loss] 2x, texture [encoding-loss]a h[encoding-loss]nh, icon node 24/32/48 px, icon edge, ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n, incident, patrol, faction v[encoding-loss] [encoding-loss]nh node detail. Asset l[encoding-loss]i ph[encoding-loss]i c[encoding-loss] fallback SVG/CSS.

- Node l[encoding-loss]n d[encoding-loss]ng landmark ri[encoding-loss]ng, kh[encoding-loss]ng d[encoding-loss]ng c[encoding-loss]ng icon v[encoding-loss]i tr[encoding-loss]m nh[encoding-loss].
- Influence d[encoding-loss]ng gradient m[encoding-loss]m ph[encoding-loss]a sau nh[encoding-loss]n.
- Edge nguy hi[encoding-loss]m d[encoding-loss]ng n[encoding-loss]t [encoding-loss]t; phong t[encoding-loss]a d[encoding-loss]ng g[encoding-loss]ch ch[encoding-loss]o; tu[encoding-loss]n tra d[encoding-loss]ng chuy[encoding-loss]n [encoding-loss]ng nh[encoding-loss].
- T[encoding-loss] gi[encoding-loss]m m[encoding-loss]t [encoding-loss] icon khi zoom out; tooltip v[encoding-loss]n [encoding-loss]y [encoding-loss].
- Ch[encoding-loss] render node trong viewport v[encoding-loss] node [encoding-loss] bi[encoding-loss]t; cache sprite theo v[encoding-loss]ng; kh[encoding-loss]ng ch[encoding-loss]y BFS m[encoding-loss]i frame.
- M[encoding-loss]c ti[encoding-loss]u m[encoding-loss] panel <300 ms desktop v[encoding-loss] <800 ms thi[encoding-loss]t b[encoding-loss] t[encoding-loss]m trung.

## 16. API b[encoding-loss] sung

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

M[encoding-loss]i mutation tr[encoding-loss] `{ success, reason, data, transactionId, stateVersion }`. M[encoding-loss] l[encoding-loss]i k[encoding-loss] thu[encoding-loss]t ph[encoding-loss]i [encoding-loss][encoding-loss]c d[encoding-loss]ch sang ti[encoding-loss]ng Vi[encoding-loss]t [encoding-loss] UI.

## 17. Ki[encoding-loss]m th[encoding-loss] m[encoding-loss] r[encoding-loss]ng

### Topology

- Snapshot catalog tr[encoding-loss][encoding-loss]c/sau 10.000 l[encoding-loss][encoding-loss]t di chuy[encoding-loss]n kh[encoding-loss]ng [encoding-loss]i.
- S[encoding-loss]n m[encoding-loss]n Thi[encoding-loss]n Huy[encoding-loss]n Th[encoding-loss]ng ch[encoding-loss] c[encoding-loss] [encoding-loss]ng c[encoding-loss]nh/gate [encoding-loss][encoding-loss]c khai b[encoding-loss]o.
- Runtime gate v[encoding-loss][encoding-loss]t `maxChildren` b[encoding-loss] t[encoding-loss] ch[encoding-loss]i.
- C[encoding-loss]nh m[encoding-loss]t chi[encoding-loss]u/chi[encoding-loss]u ng[encoding-loss][encoding-loss]c kh[encoding-loss]ng h[encoding-loss]p l[encoding-loss] b[encoding-loss] ph[encoding-loss]t hi[encoding-loss]n khi build data.

### Travel

- M[encoding-loss]i transition tr[encoding-loss]ng th[encoding-loss]i h[encoding-loss]p l[encoding-loss]; transition sai b[encoding-loss] ch[encoding-loss]n.
- Reload gi[encoding-loss]a `active/interrupted` kh[encoding-loss]i ph[encoding-loss]c [encoding-loss]ng ETA/risk seed.
- Retry kh[encoding-loss]ng tr[encoding-loss] ti[encoding-loss]n, roll event ho[encoding-loss]c t[encoding-loss]o log l[encoding-loss]n hai.
- Phong t[encoding-loss]a c[encoding-loss] [encoding-loss][encoding-loss]ng v[encoding-loss]ng; h[encoding-loss] t[encoding-loss]ng, thuy[encoding-loss]n, th[encoding-loss] c[encoding-loss][encoding-loss]i, caravan v[encoding-loss] truy[encoding-loss]n t[encoding-loss]ng c[encoding-loss] i[encoding-loss]u ki[encoding-loss]n ri[encoding-loss]ng.

### Local interaction

- Activity h[encoding-loss]t gi[encoding-loss]/cooldown kh[encoding-loss]ng v[encoding-loss]o Action Bar.
- NPC v[encoding-loss]ng m[encoding-loss]t kh[encoding-loss]ng th[encoding-loss] t[encoding-loss][encoding-loss]ng t[encoding-loss]c.
- Incident h[encoding-loss]t h[encoding-loss]n kh[encoding-loss]ng c[encoding-loss]n n[encoding-loss]t x[encoding-loss] l[encoding-loss].
- Gi[encoding-loss] th[encoding-loss] tr[encoding-loss][encoding-loss]ng deterministic theo world tick.
- Ghi ch[encoding-loss] kh[encoding-loss]ng l[encoding-loss]m l[encoding-loss] fog ho[encoding-loss]c s[encoding-loss]a graph.

### Visual regression

- Screenshot desktop 1440 px, tablet 1024 px, mobile 390 px.
- Kh[encoding-loss]ng tr[encoding-loss]n ch[encoding-loss] ti[encoding-loss]ng Vi[encoding-loss]t, ch[encoding-loss]ng tooltip ho[encoding-loss]c m[encoding-loss]t focus.
- Asset l[encoding-loss]i v[encoding-loss]n thao t[encoding-loss]c [encoding-loss][encoding-loss]c nh[encoding-loss] fallback.

## 18. Definition of Done

Feature ch[encoding-loss] ho[encoding-loss]n th[encoding-loss]nh khi topology static/runtime b[encoding-loss] kh[encoding-loss]a; Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i c[encoding-loss] view model duy nh[encoding-loss]t; c[encoding-loss] node detail, sub-location, local activity, incident, faction interaction, NPC presence, route planner, edge state, travel state machine, preview, heatmap, patrol, outpost, fallback asset, save/load, rollback, idempotency v[encoding-loss] to[encoding-loss]n b[encoding-loss] nh[encoding-loss]n ti[encoding-loss]ng Vi[encoding-loss]t. Kh[encoding-loss]ng c[encoding-loss]n [encoding-loss][encoding-loss]ng n[encoding-loss]i ng[encoding-loss]m t[encoding-loss] S[encoding-loss]n m[encoding-loss]n Thi[encoding-loss]n Huy[encoding-loss]n Th[encoding-loss]ng ho[encoding-loss]c b[encoding-loss]t k[encoding-loss] node static n[encoding-loss]o.
## 19. Logic Gap Closure  b[encoding-loss] sung b[encoding-loss]t bu[encoding-loss]c sau r[encoding-loss] so[encoding-loss]t

### 19.1. Th[encoding-loss] t[encoding-loss] x[encoding-loss] l[encoding-loss] world tick

World tick ph[encoding-loss]i ch[encoding-loss]y theo th[encoding-loss] t[encoding-loss] nguy[encoding-loss]n t[encoding-loss] sau, kh[encoding-loss]ng [encoding-loss][encoding-loss]c [encoding-loss]o th[encoding-loss] t[encoding-loss]:

```text
1. Ch[encoding-loss]t gameDay/worldTick m[encoding-loss]i
2. C[encoding-loss]p nh[encoding-loss]t th[encoding-loss]i ti[encoding-loss]t v[encoding-loss]ng v[encoding-loss] incident
3. C[encoding-loss]p nh[encoding-loss]t topology runtime/edge state
4. C[encoding-loss]p nh[encoding-loss]t NPC route, patrol v[encoding-loss] traffic
5. C[encoding-loss]p nh[encoding-loss]t influence/heatmap t[encoding-loss] snapshot m[encoding-loss]i
6. T[encoding-loss]nh maintenance outpost/structure
7. Resolve travel task c[encoding-loss]a player
8. Ph[encoding-loss]t sinh bulletin v[encoding-loss] invalidate view model
9. Ghi snapshot/journal v[encoding-loss] ph[encoding-loss]t event UI
```

M[encoding-loss]i resolver [encoding-loss]c c[encoding-loss]ng `tickSnapshot`; kh[encoding-loss]ng resolver n[encoding-loss]o [encoding-loss]c tr[encoding-loss]ng th[encoding-loss]i n[encoding-loss]a ci n[encoding-loss]a m[encoding-loss]i.

### 19.2. Quy t[encoding-loss]c xung [encoding-loss]t [encoding-loss]ng th[encoding-loss]i

M[encoding-loss]i node, edge v[encoding-loss] travel task c[encoding-loss] `stateVersion`. Mutation y[encoding-loss]u c[encoding-loss]u `expectedVersion`; n[encoding-loss]u l[encoding-loss]ch phi[encoding-loss]n b[encoding-loss]n tr[encoding-loss] `MAP_VERSION_CONFLICT`, kh[encoding-loss]ng t[encoding-loss] ghi [encoding-loss]. Khi nhi[encoding-loss]u incident c[encoding-loss]ng t[encoding-loss]c [encoding-loss]ng m[encoding-loss]t edge, [encoding-loss]u ti[encoding-loss]n `blocked > restricted > open`; khi nhi[encoding-loss]u weather modifier c[encoding-loss]ng lo[encoding-loss]i, d[encoding-loss]ng modifier c[encoding-loss] severity cao nh[encoding-loss]t.

### 19.3. Route invalidation

N[encoding-loss]u edge trong `routeSnapshot` chuy[encoding-loss]n sang `blocked`, task ang `active` chuy[encoding-loss]n `interrupted` v[encoding-loss]i `reason`, kh[encoding-loss]ng teleport player. H[encoding-loss] th[encoding-loss]ng t[encoding-loss]o t[encoding-loss]i a ba ph[encoding-loss][encoding-loss]ng [encoding-loss]n: ch[encoding-loss] m[encoding-loss] l[encoding-loss]i, [encoding-loss][encoding-loss]ng v[encoding-loss]ng an to[encoding-loss]n, [encoding-loss]i ph[encoding-loss][encoding-loss]ng ti[encoding-loss]n/h[encoding-loss] t[encoding-loss]ng. N[encoding-loss]u kh[encoding-loss]ng c[encoding-loss] ph[encoding-loss][encoding-loss]ng [encoding-loss]n, chuy[encoding-loss]n `failed` v[encoding-loss] ho[encoding-loss]n tr[encoding-loss] ph[encoding-loss]n chi ph[encoding-loss] ch[encoding-loss]a s[encoding-loss] d[encoding-loss]ng theo policy.

### 19.4. M[encoding-loss] h[encoding-loss]nh risk minh b[encoding-loss]ch

```text
edgeRisk = clamp(baseRisk + terrainRisk + weatherRisk + patrolRisk
                 + incidentRisk + factionRisk - escortReduction
                 - structureReduction, 0, 0.95)
taskRisk = 1 - product(1 - edgeRisk_i)  // tr[encoding-loss]n to[encoding-loss]n b[encoding-loss] ch[encoding-loss]ng
```

UI hi[encoding-loss]n th[encoding-loss] d[encoding-loss]i `th[encoding-loss]p/v[encoding-loss]a/cao/c[encoding-loss]c cao`, c[encoding-loss]n log l[encoding-loss]u gi[encoding-loss] tr[encoding-loss] s[encoding-loss] v[encoding-loss] seed. Kh[encoding-loss]ng reroll risk khi ch[encoding-loss] m[encoding-loss] l[encoding-loss]i preview.

### 19.5. Quy t[encoding-loss]c fog v[encoding-loss] ri[encoding-loss]ng t[encoding-loss]

- Fog 0 kh[encoding-loss]ng tr[encoding-loss] t[encoding-loss]n, t[encoding-loss]a [encoding-loss], faction, NPC, edge ho[encoding-loss]c risk c[encoding-loss] th[encoding-loss].
- Fog 1 ch[encoding-loss] tr[encoding-loss] rumor [encoding-loss] [encoding-loss][encoding-loss]c ph[encoding-loss]t hi[encoding-loss]n; kh[encoding-loss]ng [encoding-loss][encoding-loss]c suy ng[encoding-loss][encoding-loss]c t[encoding-loss] danh s[encoding-loss]ch route.
- API server/runtime ph[encoding-loss]i filter tr[encoding-loss][encoding-loss]c khi t[encoding-loss]o view model, kh[encoding-loss]ng ch[encoding-loss] [encoding-loss]n b[encoding-loss]ng CSS.
- Cache view model theo `playerId + nodeId + fogVersion`; kh[encoding-loss]ng d[encoding-loss]ng chung gi[encoding-loss]a ng[encoding-loss][encoding-loss]i ch[encoding-loss]i.

### 19.6. V[encoding-loss]ng [encoding-loss]i node runtime

Runtime node c[encoding-loss] `createdDay`, `expiresDay?`, `parentNodeId`, `gateId`, `generationSeed`, `status`. Khi h[encoding-loss]t h[encoding-loss]n, node chuy[encoding-loss]n `archived`, kh[encoding-loss]ng x[encoding-loss]a c[encoding-loss]ng n[encoding-loss]u c[encoding-loss]n log/quest. M[encoding-loss]i c[encoding-loss]nh tr[encoding-loss] t[encoding-loss]i node archived tr[encoding-loss] th[encoding-loss]nh `blocked/unknown`, kh[encoding-loss]ng t[encoding-loss] tr[encoding-loss] sang node kh[encoding-loss]c.

### 19.7. [encoding-loss]ng b[encoding-loss] travel v[encoding-loss]i v[encoding-loss] tr[encoding-loss] player

Khi task `active`, `state.locationId` v[encoding-loss]n l[encoding-loss] node xu[encoding-loss]t ph[encoding-loss]t v[encoding-loss] `state.mapState.travelTask` l[encoding-loss] ngu[encoding-loss]n s[encoding-loss] th[encoding-loss]t duy nh[encoding-loss]t. Kh[encoding-loss]ng cho combat, giao d[encoding-loss]ch node [encoding-loss]ch ho[encoding-loss]c NPC interaction [encoding-loss]ch tr[encoding-loss][encoding-loss]c khi task completed. UI ph[encoding-loss]i hi[encoding-loss]n th[encoding-loss] ang tr[encoding-loss]n [encoding-loss][encoding-loss]ng v[encoding-loss] kh[encoding-loss]a action xung [encoding-loss]t.

### 19.8. View model chu[encoding-loss]n cho UI

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

UI ch[encoding-loss] render view model n[encoding-loss]y; kh[encoding-loss]ng g[encoding-loss]i tr[encoding-loss]c ti[encoding-loss]p catalog ho[encoding-loss]c t[encoding-loss] suy lu[encoding-loss]n i[encoding-loss]u ki[encoding-loss]n action.

### 19.9. B[encoding-loss]o v[encoding-loss] d[encoding-loss] li[encoding-loss]u v[encoding-loss] ch[encoding-loss]ng exploit

- Kh[encoding-loss]ng ho[encoding-loss]n ti[encoding-loss]n hai l[encoding-loss]n khi cancel/interruption.
- Kh[encoding-loss]ng nh[encoding-loss]n reward n[encoding-loss]u task ch[encoding-loss]a completed.
- Kh[encoding-loss]ng d[encoding-loss]ng fast travel [encoding-loss] b[encoding-loss] qua quest lock, combat lock ho[encoding-loss]c incident b[encoding-loss]t bu[encoding-loss]c.
- Kh[encoding-loss]ng cho client t[encoding-loss] g[encoding-loss]i `risk`, `days`, `distance`, `owner` ho[encoding-loss]c `fogState`; server/runtime t[encoding-loss]nh l[encoding-loss]i.
- Journal ph[encoding-loss]i l[encoding-loss]u before/after hash [encoding-loss] ph[encoding-loss]t hi[encoding-loss]n save b[encoding-loss] ch[encoding-loss]nh s[encoding-loss]a.

### 19.10. Acceptance b[encoding-loss] sung

1. Hai mutation c[encoding-loss]ng `stateVersion` kh[encoding-loss]ng th[encoding-loss] c[encoding-loss]ng commit.
2. Route b[encoding-loss] phong t[encoding-loss]a gi[encoding-loss]a ch[encoding-loss]ng lu[encoding-loss]n chuy[encoding-loss]n interruption, kh[encoding-loss]ng [encoding-loss]i `locationId` sai.
3. Fog 0 kh[encoding-loss]ng r[encoding-loss] r[encoding-loss] metadata qua API, tooltip, DOM ho[encoding-loss]c cache.
4. Runtime node h[encoding-loss]t h[encoding-loss]n kh[encoding-loss]ng l[encoding-loss]m m[encoding-loss]t log, quest ho[encoding-loss]c reference ci.
5. CurrentRegionViewModel t[encoding-loss]i t[encoding-loss]o deterministic t[encoding-loss] c[encoding-loss]ng snapshot.
6. Kh[encoding-loss]ng c[encoding-loss] action map n[encoding-loss]o commit m[encoding-loss] thi[encoding-loss]u preview t[encoding-loss][encoding-loss]ng [encoding-loss]ng.


### Source: `archive-requirements\logic-history\03-world\MAP_INFLUENCE_STRUCTURE_CANONICAL_2026-09-16.md`

# MAP INFLUENCE + CÔNG TRÌNH CANONICAL 2026-09-16

## Quyết định đã chốt

1. Influence chính xác chỉ được tính chi tiết cho node nhân vật đã khám phá (`fogState >= 2`, đã ghé hoặc đang đứng tại node).
2. Node chưa khám phá không lộ faction gradient. Node đó chỉ nhận tín hiệu ảnh hưởng từ world event/random event đã được ghi vào `mapState.eventInfluence`.
3. Map dùng tọa độ 100×100 hiện hành; mọi start location phải có tọa độ hợp lệ trước khi tạo state.
4. Truyền Tống Trận có thể đặt tại node sinh ra, node tông môn nhân vật đang tham gia, hoặc phường thị hợp lệ nơi đã xây công trình. Endpoint phải là teleport anchor hợp lệ.
5. Hộ Giới Đại Trận giảm SAN drain tại node, đồng thời giảm encounter/curse pressure theo integrity.
6. Structure có thể chuyển chủ cho NPC bằng một transaction riêng; không xóa structure khi chuyển chủ.

## Additional ownership lifecycle decisions

- Player-owned structures support an explicit dismantle transaction. The record is
  retained with `status: "dismantled"` for history/audit, influence is invalidated
  immediately, and refund is `floor(baseCost[type] * level * 0.4)` Linh Thạch.
- Player outposts support a petition/donate transaction to the faction currently
  served by the player. It changes `ownerType/ownerId`, grants faction power and
  player reputation, and writes a `faction_change` node-history entry.
- Regression must cover owner guards, refund, influence invalidation, idempotent
  second petition rejection, and save round-trip.

## Influence DTO

```js
{
  nodeId, discovered, source,
  factions: [{ factionId, score, tier }],
  influenceMap, ownerFactionId, contested,
  pressure, confidence, revision
}
```

## Invariants

- `mapInfluenceSnapshot`, map UI, travel plan và construction eligibility dùng cùng resolver.
- Unknown node không expose `influenceMap` faction đầy đủ.
- Event influence hết hạn theo day và không biến thành ownership vĩnh viễn nếu chưa có claim/threshold.
- Influence cache invalidates sau faction/war/structure/claim/ownership/weather event.

## Structure schema

```js
{
  id, type, nodeId, ownerType, ownerId,
  builtByCharacterId, builtAt, integrity, level,
  charges, effects, transferHistory, status
}
```

Truyền Tống Trận dùng `type: "waystation"`, Hộ Giới Đại Trận dùng `type: "ward_formation"`. Không dùng tên hiển thị làm ID.

## Cost baseline

- Truyền Tống Trận: 20 Linh Thạch, integrity 100, charge 100.
- Hộ Giới Đại Trận: 15 Linh Thạch, integrity 100, SAN drain reduction 25%, encounter risk -20%, curse risk -25%.
- Mỗi lần repair/upgrade phải dùng resolver cost, không hard-code trong UI.
- `disable` làm công trình mất ảnh hưởng ngay lập tức nhưng không xóa dữ liệu.
  `repair` trên công trình disabled phải trả tối thiểu 1 Linh Thạch để tái kích
  hoạt ngay cả khi integrity vẫn là 100; repair công trình damaged vừa khôi phục
  integrity vừa chuyển status về `active`.
- Regression bắt buộc kiểm tra score active > disabled và score được phục hồi sau
  repair, kèm save round-trip.


### Source: `archive-requirements\logic-history\03-world\MAP_OXY_COORDINATE_ARCHITECTURE_REQUIREMENT.md`

# MAP OXY COORDINATE ARCHITECTURE REQUIREMENT

## 1. M[encoding-loss]c ti[encoding-loss]u

Map V2 chuy[encoding-loss]n sang m[encoding-loss] h[encoding-loss]nh kh[encoding-loss]ng gian Oxy l[encoding-loss]m ngu[encoding-loss]n s[encoding-loss] th[encoding-loss]t duy nh[encoding-loss]t cho to[encoding-loss]n b[encoding-loss] th[encoding-loss] gi[encoding-loss]i. M[encoding-loss]i node c[encoding-loss] m[encoding-loss]t t[encoding-loss]a [encoding-loss] nguy[encoding-loss]n `(x, y)`. T[encoding-loss] t[encoding-loss]a [encoding-loss] n[encoding-loss]y, engine x[encoding-loss]c [encoding-loss]nh b[encoding-loss]n h[encoding-loss][encoding-loss]ng B[encoding-loss]c, Nam, [encoding-loss]ng, T[encoding-loss]y v[encoding-loss] sinh node c[encoding-loss]n thi[encoding-loss]u m[encoding-loss]t c[encoding-loss]ch nh[encoding-loss]t qu[encoding-loss]n.

Ki[encoding-loss]n tr[encoding-loss]c n[encoding-loss]y thay th[encoding-loss] vi[encoding-loss]c ph[encoding-loss] thu[encoding-loss]c v[encoding-loss]o `exits` th[encoding-loss] c[encoding-loss]ng, t[encoding-loss]a [encoding-loss] ph[encoding-loss]n trm UI ho[encoding-loss]c t[encoding-loss]n node ch[encoding-loss]a t[encoding-loss]a [encoding-loss] k[encoding-loss] thu[encoding-loss]t.

## 2. Nguy[encoding-loss]n t[encoding-loss]c b[encoding-loss]t bu[encoding-loss]c

### 2.1. Ph[encoding-loss]m vi kh[encoding-loss]ng gian 100 [encoding-loss] 100

- Th[encoding-loss] gi[encoding-loss]i d[encoding-loss]ng mi[encoding-loss]n t[encoding-loss]a [encoding-loss] `x  [-50,49]`, `y  [-50,49]`, t[encoding-loss]ng c[encoding-loss]ng 10.000 [encoding-loss] logic.
- `(0,0)` l[encoding-loss] Thi[encoding-loss]n Nguy[encoding-loss]n S[encoding-loss]n t[encoding-loss]i Trung V[encoding-loss]c.
- 150 t[encoding-loss] ch[encoding-loss]c [encoding-loss][encoding-loss]c [encoding-loss]t b[encoding-loss]ng random c[encoding-loss] seed, kh[encoding-loss]ng [encoding-loss]t th[encoding-loss] c[encoding-loss]ng s[encoding-loss]t nhau.
- Kho[encoding-loss]ng c[encoding-loss]ch t[encoding-loss]i thi[encoding-loss]u gi[encoding-loss]a t[encoding-loss] ch[encoding-loss]c ph[encoding-loss] thu[encoding-loss]c `pyramid_tier`: Tier 1: 12 [encoding-loss], Tier 2: 8 [encoding-loss], Tier 3: 5 [encoding-loss], Tier 45: 3 [encoding-loss].
- Random placement ph[encoding-loss]i deterministic theo world seed; reload ho[encoding-loss]c n[encoding-loss]ng phi[encoding-loss]n b[encoding-loss]n kh[encoding-loss]ng [encoding-loss][encoding-loss]c [encoding-loss]i t[encoding-loss]a [encoding-loss] [encoding-loss] l[encoding-loss]u.
- Node hoang d[encoding-loss] v[encoding-loss] node ph[encoding-loss] [encoding-loss][encoding-loss]c sinh lazy; kh[encoding-loss]ng kh[encoding-loss]i t[encoding-loss]o 10.000 node khi load game.
- UI chi[encoding-loss]u Oxy sang viewport ph[encoding-loss]n trm b[encoding-loss]ng min/max c[encoding-loss]a v[encoding-loss]ng ang xem, kh[encoding-loss]ng d[encoding-loss]ng ph[encoding-loss]n trm l[encoding-loss]m t[encoding-loss]a [encoding-loss] gameplay.

- `(0, 0)` l[encoding-loss] m[encoding-loss]c kh[encoding-loss]ng gian c[encoding-loss]a Trung V[encoding-loss]c, m[encoding-loss]c [encoding-loss]nh l[encoding-loss] Thi[encoding-loss]n Nguy[encoding-loss]n S[encoding-loss]n/Thi[encoding-loss]n Nguy[encoding-loss]n S[encoding-loss]n M[encoding-loss]n.
- T[encoding-loss]a [encoding-loss] gameplay lu[encoding-loss]n l[encoding-loss] s[encoding-loss] nguy[encoding-loss]n c[encoding-loss] d[encoding-loss]u, [encoding-loss]c l[encoding-loss]p v[encoding-loss]i k[encoding-loss]ch th[encoding-loss][encoding-loss]c m[encoding-loss]n h[encoding-loss]nh.
- M[encoding-loss]t c[encoding-loss]p t[encoding-loss]a [encoding-loss] ch[encoding-loss] [encoding-loss][encoding-loss]c ph[encoding-loss]p c[encoding-loss] m[encoding-loss]t node duy nh[encoding-loss]t.
- Node t[encoding-loss] ch[encoding-loss]c, th[encoding-loss]nh tr[encoding-loss]n, ph[encoding-loss][encoding-loss]ng th[encoding-loss], th[encoding-loss]n, b[encoding-loss]n t[encoding-loss]u, tr[encoding-loss]m d[encoding-loss]ch, hoang d[encoding-loss] v[encoding-loss] runtime [encoding-loss]u d[encoding-loss]ng c[encoding-loss]ng h[encoding-loss] Oxy.
- `exits` l[encoding-loss] cache d[encoding-loss]n [encoding-loss][encoding-loss]ng [encoding-loss][encoding-loss]c sinh t[encoding-loss] t[encoding-loss]a [encoding-loss], kh[encoding-loss]ng ph[encoding-loss]i ngu[encoding-loss]n s[encoding-loss] th[encoding-loss]t ch[encoding-loss]nh.
- M[encoding-loss]i node h[encoding-loss]p l[encoding-loss] c[encoding-loss] t[encoding-loss]i a b[encoding-loss]n h[encoding-loss]ng x[encoding-loss]m tr[encoding-loss]c ti[encoding-loss]p theo Manhattan grid.
- Kh[encoding-loss]ng d[encoding-loss]ng t[encoding-loss]n nh[encoding-loss] `Bng Nguy[encoding-loss]n -1` ho[encoding-loss]c `open_4_-7` [encoding-loss] hi[encoding-loss]n th[encoding-loss] cho ng[encoding-loss][encoding-loss]i ch[encoding-loss]i.
- ID k[encoding-loss] thu[encoding-loss]t c[encoding-loss] th[encoding-loss] ch[encoding-loss]a t[encoding-loss]a [encoding-loss]; t[encoding-loss]n hi[encoding-loss]n th[encoding-loss] ph[encoding-loss]i l[encoding-loss]y t[encoding-loss] name pool theo v[encoding-loss]ng, [encoding-loss]a h[encoding-loss]nh v[encoding-loss] lo[encoding-loss]i node.
- Quy[encoding-loss]n di chuy[encoding-loss]n t[encoding-loss]i node [encoding-loss]c l[encoding-loss]p v[encoding-loss]i quy[encoding-loss]n gia nh[encoding-loss]p t[encoding-loss] ch[encoding-loss]c.

## 3. H[encoding-loss] t[encoding-loss]a [encoding-loss]

### 3.3. Canonical h[encoding-loss]a node authored

- M[encoding-loss]i node authored hi[encoding-loss]n h[encoding-loss]u ph[encoding-loss]i [encoding-loss][encoding-loss]c g[encoding-loss]n `coordinate` tr[encoding-loss][encoding-loss]c khi gameplay b[encoding-loss]t [encoding-loss]u.
- Khi node c[encoding-loss] `coordinate`, engine b[encoding-loss] qua `exits` legacy v[encoding-loss] sinh h[encoding-loss]ng x[encoding-loss]m theo Oxy.
- `exits` legacy ch[encoding-loss] [encoding-loss][encoding-loss]c d[encoding-loss]ng trong migration ho[encoding-loss]c khi node ch[encoding-loss]a c[encoding-loss] t[encoding-loss]a [encoding-loss].
- Node kh[encoding-loss]i [encoding-loss]u Trung V[encoding-loss]c l[encoding-loss] `trung_vuc_khoi_diem` t[encoding-loss]i `(0,0)`; kh[encoding-loss]ng kh[encoding-loss]i [encoding-loss]u t[encoding-loss]i c[encoding-loss]a t[encoding-loss]ng m[encoding-loss]n.

### 3.1. Quy [encoding-loss][encoding-loss]c tr[encoding-loss]c

```text
          B[encoding-loss]c (y + 1)
               [encoding-loss]
T[encoding-loss]y (x - 1) [encoding-loss] (x,y) [encoding-loss] [encoding-loss]ng (x + 1)
               [encoding-loss]
          Nam (y - 1)
```

Kho[encoding-loss]ng c[encoding-loss]ch [encoding-loss]a h[encoding-loss]nh c[encoding-loss] b[encoding-loss]n d[encoding-loss]ng Manhattan distance:

```js
distance = Math.abs(ax - bx) + Math.abs(ay - by)
```

Kho[encoding-loss]ng c[encoding-loss]ch hi[encoding-loss]n th[encoding-loss] c[encoding-loss] th[encoding-loss] d[encoding-loss]ng Euclidean, nh[encoding-loss]ng kh[encoding-loss]ng [encoding-loss][encoding-loss]c d[encoding-loss]ng Euclidean [encoding-loss] thay th[encoding-loss] lu[encoding-loss]t h[encoding-loss]ng x[encoding-loss]m gameplay.

### 3.2. M[encoding-loss]c th[encoding-loss] gi[encoding-loss]i

```text
(0, 0)  Thi[encoding-loss]n Nguy[encoding-loss]n S[encoding-loss]n  Trung V[encoding-loss]c
(-1, 10) Thi[encoding-loss]n Ki[encoding-loss]m M[encoding-loss]n
(4, -3)  Ph[encoding-loss][encoding-loss]ng th[encoding-loss] Thanh Kh[encoding-loss]
(8, 6)   B[encoding-loss]n t[encoding-loss]u Tinh C[encoding-loss]ng
```

C[encoding-loss]c t[encoding-loss]a [encoding-loss] n[encoding-loss]y l[encoding-loss] v[encoding-loss] d[encoding-loss] authoring; catalog ch[encoding-loss]nh th[encoding-loss]c ph[encoding-loss]i khai b[encoding-loss]o r[encoding-loss] `coordinate`.

## 4. Schema node chu[encoding-loss]n

```js
{
  id: "org_node_thien_kiem_mon",
  name: "Thi[encoding-loss]n Ki[encoding-loss]m M[encoding-loss]n [encoding-loss] T[encoding-loss]ng [encoding-loss]n",
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

Quy t[encoding-loss]c:

- `coordinate` b[encoding-loss]t bu[encoding-loss]c v[encoding-loss]i node authored v[encoding-loss] node runtime.
- `regionId` x[encoding-loss]c [encoding-loss]nh v[encoding-loss]ng kh[encoding-loss] h[encoding-loss]u, th[encoding-loss]i ti[encoding-loss]t, influence v[encoding-loss] bulletin.
- `mapNodeType` chu[encoding-loss]n h[encoding-loss]a: `origin`, `organization`, `market`, `town`, `village`, `harbor`, `waystation`, `wilderness`, `landmark`, `hidden_realm`.
- `organizationId` ch[encoding-loss] c[encoding-loss] [encoding-loss] node t[encoding-loss] ch[encoding-loss]c ho[encoding-loss]c node b[encoding-loss] t[encoding-loss] ch[encoding-loss]c chi ph[encoding-loss]i; kh[encoding-loss]ng [encoding-loss]i di[encoding-loss]n cho t[encoding-loss] c[encoding-loss]ch th[encoding-loss]nh vi[encoding-loss]n c[encoding-loss]a nh[encoding-loss]n v[encoding-loss]t.
- `npcs` v[encoding-loss] `enemies` l[encoding-loss] pool spawn ban [encoding-loss]u; runtime presence l[encoding-loss]u ri[encoding-loss]ng trong `npcState`/combat state.

## 5. Node registry h[encoding-loss]p nh[encoding-loss]t

`WORLD_MAP.nodePool` l[encoding-loss] registry [encoding-loss]c chung c[encoding-loss]a map, NPC, qu[encoding-loss]i, t[encoding-loss] ch[encoding-loss]c, th[encoding-loss]i ti[encoding-loss]t, th[encoding-loss]m hi[encoding-loss]m v[encoding-loss] incident.

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

M[encoding-loss]i node ph[encoding-loss]i [encoding-loss]ng b[encoding-loss] v[encoding-loss]o:

1. `GameData.LOCATIONS`  t[encoding-loss][encoding-loss]ng th[encoding-loss]ch h[encoding-loss] th[encoding-loss]ng ci.
2. `state.openWorld.nodes`  runtime save.
3. `state.openWorld.coordinates`  index t[encoding-loss]a [encoding-loss].
4. `WORLD_MAP.locations`  projection UI.
5. `WORLD_MAP.nodePool`  registry h[encoding-loss]p nh[encoding-loss]t.

Kh[encoding-loss]ng subsystem n[encoding-loss]o [encoding-loss][encoding-loss]c t[encoding-loss] t[encoding-loss]o b[encoding-loss]n sao node ngo[encoding-loss]i registry.

## 6. Index t[encoding-loss]a [encoding-loss] v[encoding-loss] ch[encoding-loss]ng tr[encoding-loss]ng

Engine ph[encoding-loss]i duy tr[encoding-loss] index:

```js
state.openWorld.coordinateIndex["x,y"] = nodeId;
```

API b[encoding-loss]t bu[encoding-loss]c:

```js
getNodeAtCoordinate(state, x, y)
ensureNodeAtCoordinate(state, x, y, options)
coordinateKey(x, y)
neighborCoordinate(x, y, direction)
validateCoordinateUniqueness(state)
```

N[encoding-loss]u t[encoding-loss]a [encoding-loss] [encoding-loss] t[encoding-loss]n t[encoding-loss]i, `ensureNodeAtCoordinate()` tr[encoding-loss] node hi[encoding-loss]n t[encoding-loss]i v[encoding-loss] kh[encoding-loss]ng t[encoding-loss]o b[encoding-loss]n sao.

## 7. Sinh node theo h[encoding-loss][encoding-loss]ng

### 7.1. Thu[encoding-loss]t to[encoding-loss]n

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

### 7.2. Li[encoding-loss]n k[encoding-loss]t hai chi[encoding-loss]u

```text
A --[encoding-loss]ng--> B
B --T[encoding-loss]y--> A
```

Kh[encoding-loss]ng [encoding-loss][encoding-loss]c ghi m[encoding-loss]t chi[encoding-loss]u. Sau m[encoding-loss]i mutation ph[encoding-loss]i ch[encoding-loss]y invariant:

```js
assert(getExit(B, "tay") === A)
```

### 7.3. Sinh pool

Pool node [encoding-loss][encoding-loss]c ch[encoding-loss]n theo:

- V[encoding-loss]ng (`regionId`).
- [encoding-loss]a h[encoding-loss]nh (`terrain`).
- Kho[encoding-loss]ng c[encoding-loss]ch t[encoding-loss] m[encoding-loss]c `(0,0)`.
- Th[encoding-loss]i ti[encoding-loss]t hi[encoding-loss]n t[encoding-loss]i.
- Influence t[encoding-loss] ch[encoding-loss]c.
- B[encoding-loss]ng t[encoding-loss] l[encoding-loss] NPC/qu[encoding-loss]i.
- Tr[encoding-loss]ng th[encoding-loss]i incident ho[encoding-loss]c chi[encoding-loss]n tranh.

T[encoding-loss]n hi[encoding-loss]n th[encoding-loss] l[encoding-loss]y t[encoding-loss] pool t[encoding-loss] nhi[encoding-loss]n:

```js
{
  regionId: "bac_nguyen",
  terrain: "ice_valley",
  names: ["H[encoding-loss]n Nguy[encoding-loss]t C[encoding-loss]c", "Tuy[encoding-loss]t T[encoding-loss]m L[encoding-loss]", "Lam Bng [encoding-loss]i"]
}
```

Kh[encoding-loss]ng n[encoding-loss]i t[encoding-loss]a [encoding-loss] s[encoding-loss] v[encoding-loss]o `name` hi[encoding-loss]n th[encoding-loss].

## 8. Node authored v[encoding-loss] node runtime

### Authored node

L[encoding-loss] node thi[encoding-loss]t k[encoding-loss] s[encoding-loss]n cho c[encoding-loss]c [encoding-loss]a i[encoding-loss]m quan tr[encoding-loss]ng:

- Thi[encoding-loss]n Nguy[encoding-loss]n S[encoding-loss]n.
- T[encoding-loss]ng [encoding-loss]n t[encoding-loss] ch[encoding-loss]c.
- 150 t[encoding-loss] ch[encoding-loss]c.
- Th[encoding-loss]nh tr[encoding-loss]n, ph[encoding-loss][encoding-loss]ng th[encoding-loss], th[encoding-loss]n, b[encoding-loss]n t[encoding-loss]u, tr[encoding-loss]m d[encoding-loss]ch.
- C[encoding-loss]m [encoding-loss]a, b[encoding-loss] c[encoding-loss]nh, h[encoding-loss]i c[encoding-loss]ng v[encoding-loss] landmark.

### Runtime node

[encoding-loss][encoding-loss]c sinh khi ng[encoding-loss][encoding-loss]i ch[encoding-loss]i ho[encoding-loss]c NPC m[encoding-loss] r[encoding-loss]ng th[encoding-loss] gi[encoding-loss]i. Runtime node ph[encoding-loss]i:

- C[encoding-loss] t[encoding-loss]a [encoding-loss] h[encoding-loss]p l[encoding-loss].
- C[encoding-loss] t[encoding-loss]n pool.
- C[encoding-loss] region/terrain.
- C[encoding-loss] NPC/qu[encoding-loss]i theo b[encoding-loss]ng spawn.
- C[encoding-loss] li[encoding-loss]n k[encoding-loss]t ng[encoding-loss][encoding-loss]c.
- [encoding-loss][encoding-loss]c l[encoding-loss]u v[encoding-loss]o registry h[encoding-loss]p nh[encoding-loss]t.

## 9. T[encoding-loss] ch[encoding-loss]c v[encoding-loss] v[encoding-loss]ng [encoding-loss]nh h[encoding-loss][encoding-loss]ng

M[encoding-loss]i t[encoding-loss] ch[encoding-loss]c c[encoding-loss] node t[encoding-loss]ng [encoding-loss]n ri[encoding-loss]ng:

```js
{
  mapNodeType: "organization",
  organizationId: "guild_001",
  coordinate: { x: -1, y: 10 }
}
```

Di chuy[encoding-loss]n t[encoding-loss]i node t[encoding-loss] ch[encoding-loss]c kh[encoding-loss]ng y[encoding-loss]u c[encoding-loss]u gia nh[encoding-loss]p. Gia nh[encoding-loss]p ch[encoding-loss] [encoding-loss][encoding-loss]c ki[encoding-loss]m tra b[encoding-loss]i `guildEligibility()`/`joinGuild()`.

[encoding-loss]nh h[encoding-loss][encoding-loss]ng t[encoding-loss] ch[encoding-loss]c tr[encoding-loss]n node [encoding-loss][encoding-loss]c t[encoding-loss]nh [encoding-loss]c l[encoding-loss]p:

```js
organizationCoverageSnapshot(state, nodeId)
```

Coverage d[encoding-loss]a tr[encoding-loss]n:

- Kho[encoding-loss]ng c[encoding-loss]ch Oxy t[encoding-loss]i t[encoding-loss]ng [encoding-loss]n.
- C[encoding-loss]p t[encoding-loss] ch[encoding-loss]c.
- T[encoding-loss]i nguy[encoding-loss]n v[encoding-loss] s[encoding-loss]c m[encoding-loss]nh.
- Outpost/structure t[encoding-loss]i node.
- Quan h[encoding-loss] ngo[encoding-loss]i giao.
- Chi[encoding-loss]n tranh ho[encoding-loss]c phong t[encoding-loss]a.

Coverage kh[encoding-loss]ng l[encoding-loss]m m[encoding-loss]t li[encoding-loss]n k[encoding-loss]t di chuy[encoding-loss]n. Phong t[encoding-loss]a ch[encoding-loss] thay [encoding-loss]i risk, cost, encounter ho[encoding-loss]c ph[encoding-loss][encoding-loss]ng th[encoding-loss]c i.

## 10. NPC v[encoding-loss] qu[encoding-loss]i v[encoding-loss]t

NPC ph[encoding-loss]i d[encoding-loss]ng `currentNodeId` v[encoding-loss] t[encoding-loss]y ch[encoding-loss]n `currentSubLocationId`. Qu[encoding-loss]i ph[encoding-loss]i d[encoding-loss]ng `spawnNodeId`/`currentNodeId`.

Khi node [encoding-loss][encoding-loss]c sinh:

1. Ch[encoding-loss]n NPC pool theo v[encoding-loss]ng v[encoding-loss] lo[encoding-loss]i node.
2. Ch[encoding-loss]n qu[encoding-loss]i pool theo [encoding-loss]a h[encoding-loss]nh, danger v[encoding-loss] th[encoding-loss]i ti[encoding-loss]t.
3. Ghi spawn record g[encoding-loss]n v[encoding-loss]i node ID.
4. Cho NPC pathfinding tr[encoding-loss]n t[encoding-loss]a [encoding-loss] Oxy.
5. Khi c[encoding-loss]nh b[encoding-loss] phong t[encoding-loss]a, t[encoding-loss]m [encoding-loss][encoding-loss]ng v[encoding-loss]ng b[encoding-loss]ng BFS/A* tr[encoding-loss]n node [encoding-loss] bi[encoding-loss]t.

NPC kh[encoding-loss]ng [encoding-loss][encoding-loss]c xu[encoding-loss]t hi[encoding-loss]n t[encoding-loss]i node ch[encoding-loss]a c[encoding-loss] trong registry. Combat encounter ph[encoding-loss]i tham chi[encoding-loss]u node hi[encoding-loss]n t[encoding-loss]i, kh[encoding-loss]ng ch[encoding-loss] tham chi[encoding-loss]u region.

## 11. Th[encoding-loss]i ti[encoding-loss]t v[encoding-loss] t[encoding-loss]a [encoding-loss]

Th[encoding-loss]i ti[encoding-loss]t [encoding-loss][encoding-loss]c x[encoding-loss]c [encoding-loss]nh theo `regionId` c[encoding-loss]a node hi[encoding-loss]n t[encoding-loss]i. Khi node n[encoding-loss]m tr[encoding-loss]n ranh gi[encoding-loss]i, d[encoding-loss]ng climate zone c[encoding-loss]a node v[encoding-loss] gradient l[encoding-loss]n c[encoding-loss]n.

T[encoding-loss]a [encoding-loss] [encoding-loss]nh h[encoding-loss][encoding-loss]ng:

- Th[encoding-loss]i gian i.
- R[encoding-loss]i ro th[encoding-loss]i ti[encoding-loss]t.
- T[encoding-loss] l[encoding-loss] NPC tr[encoding-loss] [encoding-loss]n.
- T[encoding-loss] l[encoding-loss] qu[encoding-loss]i xu[encoding-loss]t hi[encoding-loss]n.
- Kh[encoding-loss] nng th[encoding-loss]m hi[encoding-loss]m t[encoding-loss]i nguy[encoding-loss]n.
- Kh[encoding-loss] nng m[encoding-loss] [encoding-loss][encoding-loss]ng bi[encoding-loss]n, n[encoding-loss]i ho[encoding-loss]c bng.

Weather kh[encoding-loss]ng [encoding-loss][encoding-loss]c d[encoding-loss]ng [encoding-loss] x[encoding-loss]a node ho[encoding-loss]c x[encoding-loss]a li[encoding-loss]n k[encoding-loss]t; ch[encoding-loss] [encoding-loss]p d[encoding-loss]ng modifier v[encoding-loss] incident.

## 12. Movement contract

`startTravel(fromId, toId, mode)` ph[encoding-loss]i:

- X[encoding-loss]c nh[encoding-loss]n c[encoding-loss] hai node t[encoding-loss]n t[encoding-loss]i trong registry.
- T[encoding-loss]nh Manhattan distance t[encoding-loss] coordinate.
- T[encoding-loss]nh mode speed, weather modifier v[encoding-loss] terrain modifier.
- Ki[encoding-loss]m tra combat/travel task ang ho[encoding-loss]t [encoding-loss]ng.
- Ki[encoding-loss]m tra cost.
- Kh[encoding-loss]ng ki[encoding-loss]m tra i[encoding-loss]u ki[encoding-loss]n gia nh[encoding-loss]p t[encoding-loss] ch[encoding-loss]c.
- Ghi `fromCoordinate`, `toCoordinate`, `distance`, `mode`, `weather`, `risk` v[encoding-loss]o travel task.

N[encoding-loss]u ng[encoding-loss][encoding-loss]i ch[encoding-loss]i ch[encoding-loss]n action h[encoding-loss][encoding-loss]ng:

```text
i B[encoding-loss]c / i Nam / i [encoding-loss]ng / i T[encoding-loss]y
```

engine ph[encoding-loss]i resolve node theo t[encoding-loss]a [encoding-loss] tr[encoding-loss][encoding-loss]c, sau [encoding-loss] g[encoding-loss]i c[encoding-loss]ng m[encoding-loss]t `startTravel()` canonical. Kh[encoding-loss]ng [encoding-loss][encoding-loss]c c[encoding-loss] m[encoding-loss]t logic ri[encoding-loss]ng ch[encoding-loss] [encoding-loss]c `LOCATIONS.exits` ci.

## 13. UI projection

Gameplay d[encoding-loss]ng t[encoding-loss]a [encoding-loss] Oxy; UI ch[encoding-loss] chi[encoding-loss]u sang ph[encoding-loss]n trm:

```js
screenX = ((x - minX) / (maxX - minX)) * 100;
screenY = 100 - ((y - minY) / (maxY - minY)) * 100;
```

UI kh[encoding-loss]ng [encoding-loss][encoding-loss]c s[encoding-loss]a t[encoding-loss]a [encoding-loss] gameplay khi zoom/pan.

Hi[encoding-loss]n th[encoding-loss]:

- Node hi[encoding-loss]n t[encoding-loss]i: v[encoding-loss]ng duy nh[encoding-loss]t.
- Ch[encoding-loss]nh [encoding-loss]o: xanh lam.
- Ma [encoding-loss]o/T[encoding-loss] [encoding-loss]o/H[encoding-loss]c [encoding-loss]o: [encoding-loss] t[encoding-loss]m ho[encoding-loss]c [encoding-loss] s[encoding-loss]m.
- Trung l[encoding-loss]p: t[encoding-loss]m x[encoding-loss]m.
- Ph[encoding-loss][encoding-loss]ng th[encoding-loss]: v[encoding-loss]ng cam.
- Th[encoding-loss]nh tr[encoding-loss]n: xanh lam nh[encoding-loss]t.
- Th[encoding-loss]n: xanh l[encoding-loss]c.
- B[encoding-loss]n t[encoding-loss]u: xanh ng[encoding-loss]c.
- Tr[encoding-loss]m d[encoding-loss]ch: t[encoding-loss]m s[encoding-loss]ng.
- [encoding-loss] th[encoding-loss]m hi[encoding-loss]m: hi[encoding-loss]n th[encoding-loss] t[encoding-loss]n v[encoding-loss] marker.
- Ch[encoding-loss]a th[encoding-loss]m hi[encoding-loss]m: ch[encoding-loss] hi[encoding-loss]n th[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i, kh[encoding-loss]ng l[encoding-loss] NPC/qu[encoding-loss]i/c[encoding-loss] duy[encoding-loss]n.

Zoom/pan/reset ch[encoding-loss] t[encoding-loss]c [encoding-loss]ng l[encoding-loss]p projection node, kh[encoding-loss]ng thay [encoding-loss]i registry.

## 14. Migration t[encoding-loss] h[encoding-loss] th[encoding-loss]ng hi[encoding-loss]n t[encoding-loss]i

### B[encoding-loss][encoding-loss]c 1  Chu[encoding-loss]n h[encoding-loss]a catalog

- G[encoding-loss]n t[encoding-loss]a [encoding-loss] Oxy cho to[encoding-loss]n b[encoding-loss] node static.
- Chuy[encoding-loss]n t[encoding-loss]a [encoding-loss] t[encoding-loss] ch[encoding-loss]c ph[encoding-loss]n trm th[encoding-loss]nh t[encoding-loss]a [encoding-loss] Oxy authoring.
- G[encoding-loss]n `mapNodeType` v[encoding-loss] `terrain`.
- T[encoding-loss]o `coordinateIndex` v[encoding-loss] ph[encoding-loss]t hi[encoding-loss]n tr[encoding-loss]ng.

### B[encoding-loss][encoding-loss]c 2  [encoding-loss]ng b[encoding-loss] save ci

- Save c[encoding-loss] `openWorld.coordinates` gi[encoding-loss] nguy[encoding-loss]n n[encoding-loss]u h[encoding-loss]p l[encoding-loss].
- Save thi[encoding-loss]u t[encoding-loss]a [encoding-loss] static [encoding-loss][encoding-loss]c map t[encoding-loss] b[encoding-loss]ng migration c[encoding-loss] [encoding-loss]nh.
- Save c[encoding-loss] node t[encoding-loss]n t[encoding-loss]a [encoding-loss] ci [encoding-loss][encoding-loss]c [encoding-loss]i t[encoding-loss]n hi[encoding-loss]n th[encoding-loss] nh[encoding-loss]ng gi[encoding-loss] nguy[encoding-loss]n ID.
- Kh[encoding-loss]ng t[encoding-loss] [encoding-loss]ng x[encoding-loss]a node ho[encoding-loss]c reset `visitedLocations`.

### B[encoding-loss][encoding-loss]c 3  Canonical movement

- H[encoding-loss][encoding-loss]ng ci g[encoding-loss]i `resolveDirectionalNode()`.
- Click node g[encoding-loss]i `startTravel()`.
- X[encoding-loss]a c[encoding-loss]c nh[encoding-loss]nh movement t[encoding-loss] [encoding-loss]c `exits` m[encoding-loss] kh[encoding-loss]ng qua coordinate resolver.

### B[encoding-loss][encoding-loss]c 4  [encoding-loss]ng b[encoding-loss] NPC/qu[encoding-loss]i

- Chuy[encoding-loss]n m[encoding-loss]i `currentNodeId` v[encoding-loss] node registry.
- B[encoding-loss] sung fallback cho NPC save ci.
- Ch[encoding-loss]y repair reciprocal links sau load.

## 15. Invariants v[encoding-loss] ki[encoding-loss]m th[encoding-loss]

B[encoding-loss]t bu[encoding-loss]c c[encoding-loss] test:

1. M[encoding-loss]i node c[encoding-loss] t[encoding-loss]a [encoding-loss] h[encoding-loss]p l[encoding-loss].
2. Kh[encoding-loss]ng c[encoding-loss] t[encoding-loss]a [encoding-loss] tr[encoding-loss]ng.
3. B[encoding-loss]c/Nam v[encoding-loss] [encoding-loss]ng/T[encoding-loss]y [encoding-loss]i x[encoding-loss]ng.
4. T[encoding-loss] `(0,0)` i b[encoding-loss]n h[encoding-loss][encoding-loss]ng t[encoding-loss]o [encoding-loss]ng b[encoding-loss]n t[encoding-loss]a [encoding-loss].
5. Node runtime kh[encoding-loss]ng c[encoding-loss] t[encoding-loss]n t[encoding-loss]a [encoding-loss] k[encoding-loss] thu[encoding-loss]t.
6. 150 node t[encoding-loss] ch[encoding-loss]c [encoding-loss]u c[encoding-loss] t[encoding-loss]a [encoding-loss] v[encoding-loss] node ri[encoding-loss]ng.
7. M[encoding-loss]i node th[encoding-loss]nh tr[encoding-loss]n/ph[encoding-loss][encoding-loss]ng th[encoding-loss]/th[encoding-loss]n/b[encoding-loss]n t[encoding-loss]u/tr[encoding-loss]m d[encoding-loss]ch c[encoding-loss] `mapNodeType` [encoding-loss]ng.
8. Node ch[encoding-loss]a kh[encoding-loss]m ph[encoding-loss] kh[encoding-loss]ng l[encoding-loss] NPC/qu[encoding-loss]i/c[encoding-loss] duy[encoding-loss]n.
9. NPC v[encoding-loss] qu[encoding-loss]i lu[encoding-loss]n tham chi[encoding-loss]u node t[encoding-loss]n t[encoding-loss]i.
10. Phong t[encoding-loss]a kh[encoding-loss]ng x[encoding-loss]a li[encoding-loss]n k[encoding-loss]t, ch[encoding-loss] t[encoding-loss]o modifier.
11. Di chuy[encoding-loss]n t[encoding-loss]i node t[encoding-loss] ch[encoding-loss]c kh[encoding-loss]ng y[encoding-loss]u c[encoding-loss]u membership.
12. Gia nh[encoding-loss]p t[encoding-loss] ch[encoding-loss]c v[encoding-loss]n ki[encoding-loss]m tra eligibility ri[encoding-loss]ng.
13. Zoom/pan kh[encoding-loss]ng thay [encoding-loss]i coordinate.
14. Save/load gi[encoding-loss] nguy[encoding-loss]n t[encoding-loss]a [encoding-loss] v[encoding-loss] visited state.
15. T[encoding-loss] m[encoding-loss]i node test c[encoding-loss] th[encoding-loss] resolve B[encoding-loss]c/Nam/[encoding-loss]ng/T[encoding-loss]y.

## 16. Ti[encoding-loss]u ch[encoding-loss] ho[encoding-loss]n th[encoding-loss]nh

## 16.1. Bi[encoding-loss]n v[encoding-loss]c v[encoding-loss] node r[encoding-loss]a

## 16.3. M[encoding-loss] h[encoding-loss]nh hi[encoding-loss]n th[encoding-loss] k[encoding-loss]t h[encoding-loss]p

- Gameplay gi[encoding-loss] h[encoding-loss] Oxy 100[encoding-loss]100; UI kh[encoding-loss]ng thay [encoding-loss]i t[encoding-loss]a [encoding-loss] gameplay khi zoom ho[encoding-loss]c pan.
- V[encoding-loss]n Gi[encoding-loss]i L[encoding-loss] d[encoding-loss]ng canvas viewport l[encoding-loss]n (t[encoding-loss]i thi[encoding-loss]u 620px, t[encoding-loss]i a theo chi[encoding-loss]u cao m[encoding-loss]n h[encoding-loss]nh) thay v[encoding-loss] nh[encoding-loss]i to[encoding-loss]n b[encoding-loss] node v[encoding-loss]o khung nh[encoding-loss].
- C[encoding-loss] b[encoding-loss]n m[encoding-loss]c zoom: To[encoding-loss]n c[encoding-loss]nh, V[encoding-loss]ng, Khu v[encoding-loss]c, Node. Zoom ch[encoding-loss] thay [encoding-loss]i projection v[encoding-loss] m[encoding-loss]t [encoding-loss] hi[encoding-loss]n th[encoding-loss].
- Zoom xa ch[encoding-loss] hi[encoding-loss]n region, t[encoding-loss] ch[encoding-loss]c c[encoding-loss]p cao v[encoding-loss] node l[encoding-loss]n; zoom g[encoding-loss]n m[encoding-loss]i hi[encoding-loss]n t[encoding-loss] ch[encoding-loss]c c[encoding-loss]p th[encoding-loss]p, node d[encoding-loss]n c[encoding-loss], NPC, qu[encoding-loss]i v[encoding-loss] c[encoding-loss] duy[encoding-loss]n.
- Node ngo[encoding-loss]i viewport ph[encoding-loss]i [encoding-loss][encoding-loss]c culling kh[encoding-loss]i DOM; node g[encoding-loss]n nhau [encoding-loss][encoding-loss]c gom cluster v[encoding-loss] t[encoding-loss]ch ra khi zoom v[encoding-loss]o.
- Layer UI cho ph[encoding-loss]p b[encoding-loss]t/t[encoding-loss]t t[encoding-loss] ch[encoding-loss]c, node d[encoding-loss]n c[encoding-loss], NPC, qu[encoding-loss]i, c[encoding-loss] duy[encoding-loss]n, influence v[encoding-loss] tuy[encoding-loss]n th[encoding-loss][encoding-loss]ng m[encoding-loss]i.
- Nh[encoding-loss]n t[encoding-loss] ch[encoding-loss]c c[encoding-loss]p th[encoding-loss]p ch[encoding-loss] hi[encoding-loss]n khi hover; nh[encoding-loss]n c[encoding-loss]p cao c[encoding-loss] th[encoding-loss] hi[encoding-loss]n th[encoding-loss] m[encoding-loss] [encoding-loss] zoom V[encoding-loss]ng.

- Node c[encoding-loss] `max(abs(x), abs(y)) >= 45` [encoding-loss][encoding-loss]c [encoding-loss]nh d[encoding-loss]u `isEdge`.
- Khu v[encoding-loss]c r[encoding-loss]a kh[encoding-loss]ng ph[encoding-loss]i t[encoding-loss][encoding-loss]ng ch[encoding-loss]n; [encoding-loss]y l[encoding-loss] v[encoding-loss]ng m[encoding-loss] r[encoding-loss]ng c[encoding-loss]a th[encoding-loss] gi[encoding-loss]i.
- UI ph[encoding-loss]i hi[encoding-loss]n th[encoding-loss] th[encoding-loss]ng b[encoding-loss]o bi[encoding-loss]n v[encoding-loss]c v[encoding-loss] b[encoding-loss]n action: Th[encoding-loss]m hi[encoding-loss]m bi[encoding-loss]n v[encoding-loss]c, D[encoding-loss]ng tr[encoding-loss]m ti[encoding-loss]n ti[encoding-loss]u, Xin h[encoding-loss] t[encoding-loss]ng qua bi[encoding-loss]n, M[encoding-loss] tuy[encoding-loss]n th[encoding-loss][encoding-loss]ng m[encoding-loss]i.
- Action r[encoding-loss]a d[encoding-loss]ng transaction contract, c[encoding-loss] cost/risk/incident ri[encoding-loss]ng v[encoding-loss] kh[encoding-loss]ng x[encoding-loss]a li[encoding-loss]n k[encoding-loss]t b[encoding-loss]n h[encoding-loss][encoding-loss]ng.

## 16.2. Pool d[encoding-loss] li[encoding-loss]u b[encoding-loss]n [encoding-loss]

- `WORLD_MAP.nodePools` ch[encoding-loss]a pool t[encoding-loss]n, terrain v[encoding-loss] lo[encoding-loss]i node.
- `WORLD_MAP.coordinateSystem` khai b[encoding-loss]o mi[encoding-loss]n `[-50,49]` v[encoding-loss] origin.
- `WORLD_MAP.edgeActions` khai b[encoding-loss]o action [encoding-loss][encoding-loss]c ph[encoding-loss]p [encoding-loss] node r[encoding-loss]a.
- Pool [encoding-loss][encoding-loss]c d[encoding-loss]ng chung b[encoding-loss]i authored node, runtime node, NPC, qu[encoding-loss]i, t[encoding-loss] ch[encoding-loss]c, weather v[encoding-loss] exploration.

Feature [encoding-loss]t 100% khi:

- T[encoding-loss]t c[encoding-loss] node static v[encoding-loss] runtime d[encoding-loss]ng Oxy.
- `exits` ch[encoding-loss] l[encoding-loss] cache [encoding-loss][encoding-loss]c sinh t[encoding-loss] [encoding-loss]ng.
- Kh[encoding-loss]ng c[encoding-loss]n node b[encoding-loss] k[encoding-loss]t ch[encoding-loss] v[encoding-loss] thi[encoding-loss]u m[encoding-loss]t h[encoding-loss][encoding-loss]ng trong catalog.
- Kh[encoding-loss]ng c[encoding-loss]n t[encoding-loss]n node hi[encoding-loss]n th[encoding-loss] d[encoding-loss]ng t[encoding-loss]a [encoding-loss] s[encoding-loss].
- 150 t[encoding-loss] ch[encoding-loss]c, th[encoding-loss]nh tr[encoding-loss]n v[encoding-loss] c[encoding-loss]c node ph[encoding-loss] n[encoding-loss]m trong c[encoding-loss]ng node pool.
- NPC, qu[encoding-loss]i, th[encoding-loss]i ti[encoding-loss]t, t[encoding-loss] ch[encoding-loss]c, th[encoding-loss]m hi[encoding-loss]m v[encoding-loss] incident [encoding-loss]c c[encoding-loss]ng node registry.
- Movement action, click node v[encoding-loss] NPC pathfinding d[encoding-loss]ng c[encoding-loss]ng resolver.
- Save migration v[encoding-loss] invariant tests [encoding-loss]u pass.


### Source: `archive-requirements\logic-history\03-world\MAP_STAR_TOPOLOGY_AND_REGIONAL_SPAWN_2026-09-17.md`

# Bản đồ sao và điểm đản sinh theo khu vực

## Quy tắc canonical

- Mỗi lựa chọn khu vực bắt đầu phải ánh xạ tới một node đản sinh riêng.
- Trung Vực không sinh thẳng tại Sơn Môn hay bất kỳ tông môn nào; node mặc định là `trung_vuc_khoi_diem` (Vân Đài Ngoại Vi).
- Điểm đản sinh phải thuộc đúng `region` đã chọn và có tọa độ canonical trong `WORLD_MAP.locations`.
- `rollCharacterCreation(regionId)` là nguồn duy nhất quyết định `startLocationId`; tình huống xuất thân không được ghi đè quy tắc điểm đản sinh khu vực đối với Trung Vực.

## Topology và hệ tọa độ

- Trục bản đồ dùng `x` tăng về Đông, `y` tăng về Nam.
- Hướng Bắc phải giảm `y`; hướng Nam phải tăng `y`.
- Open-world procedural nodes phải kế thừa tọa độ canonical và không được tự tạo cạnh làm ngược trục.
- Node/region route phải đi qua topology được khai báo; không dùng khoảng cách hình học để tự nối xuyên vùng.

## Bản đồ sao

- World overview hiển thị vùng như các tinh điểm quanh lõi Trung Vực.
- Các quỹ đạo chỉ là lớp định hướng thị giác; cạnh route canonical mới quyết định khả năng di chuyển.
- Faction/guild pin tiếp tục nằm trên cùng hệ tọa độ và không được thay đổi topology.

## Trạng thái chưa hoàn thiện

- Cần bổ sung validator độc lập kiểm tra mọi cạnh location có hướng phù hợp với chênh lệch tọa độ và region route.
- Cần QA trực tiếp trên browser để cân chỉnh độ đọc tên tinh điểm ở màn hình nhỏ.


### Source: `archive-requirements\logic-history\03-world\MAP_SYSTEM.md`

# HỆ THỐNG BẢN ĐỒ (MAP SYSTEM) — NODE-GRAPH MỞ RỘNG
> Đặc tả riêng cho Map + Action tại Map — dùng chung với `Xianxin_map.md` (thế giới/vùng/thế lực),
> `NPC_MONSTER_SYSTEM.md` (14 lớp thực thể), `ACTION_HYBRID_SYSTEM.md` (action bar theo ngữ cảnh).
> File này giải quyết đúng vấn đề: bản đồ hiện tại (dạng node-graph, xem ảnh mẫu: Sơn Môn Thiên
> Huyền Tông → Vạn Phong Điện/Truyền Pháp Các/Linh Dược Viện + các node "Chưa khám phá") chỉ có
> Di Chuyển + Nói Chuyện — quá nghèo thao tác.

---

## 7. ĐIỂM NEO VÀ ĐƯỜNG VỀ AN TOÀN

World data bổ sung `travel_hubs`: `son_mon` và `van_phong` là hub tông môn/nghi thức; `tay_mac_khoi_diem`, `vo_tan_hai_khoi_diem` và `bac_nguyen_khoi_diem` là thành/trạm an toàn theo vùng. Hub có `human_npc=true` và `safe_for_ritual=true` để engine ưu tiên khi người chơi cần dựng Neo Nhân Tính hoặc hoàn tất nghi thức.

Khi không giao chiến, action bar hiển thị **Về [điểm neo]**. Action này đưa nhân vật về hub phù hợp trong vùng; nếu nghi thức đang chờ, engine ưu tiên hub có NPC nhân tộc. Riêng Vô Tận Hải có NPC Tạ Hải Sinh tại Lưu Vân Hải Cảng, giúp người chơi không phải dò từng node để tìm NPC dạng người. Di chuyển nhanh vẫn tốn một lượt game và hủy phiên tìm kiếm chưa thu thập; không thể dùng trong giao chiến.

### 7.1. Kiểm toàn vẹn tuyến và tương tác thế lực

- Mọi cạnh của cụm địa điểm cố định phải có liên kết hai chiều trong `LOCATIONS.exits`, trừ khi được đánh dấu là tuyến một chiều. Các tuyến khởi điểm vùng đã được nối ngược về mạng chính để người chơi có thể đi thông toàn bộ node tĩnh.
- Ghim Tông Môn/Thế Gia/Hoàng Triều trên bản đồ thế giới là điểm tương tác: bấm ghim hoặc dòng thế lực để mở hồ sơ, xem vùng, quy mô, cảnh giới và tổ chức liên quan.
- Hồ sơ tổ chức hiển thị điều kiện gia nhập và lý do bị khóa. Gia nhập, nhận nhiệm vụ và giao dịch vẫn chỉ thực thi khi nhân vật đã tới đúng khu vực; ghim bản đồ không tự dịch chuyển hoặc cho gia nhập từ xa.

## 1. MÔ HÌNH DỮ LIỆU NỀN: NODE-GRAPH + FOG OF WAR

Bản đồ là 1 đồ thị vô hướng: `nodes[]` (địa điểm) + `edges[]` (đường nối giữa 2 node). Node có 2
trạng thái hiển thị: **Đã khám phá** (hiện tên thật, viền màu theo loại) và **Chưa khám phá** (hiện
"Chưa khám phá", viền xám mờ, vị trí có thể xê dịch nhẹ ngẫu nhiên trên UI để tạo cảm giác mù mờ).

```
MapNode {
  id: string
  name: string | null              // null nếu chưa khám phá
  nodeType: "tong_mon" | "thanh_tran" | "hoang_da" | "cam_dia" | "dong_phu" | "bi_canh" |
            "di_tich" | "vuong_kinh" | "hai_vuc_khong_vuc" | "nga_re" | "then_chot_cot_truyen"
  regionTag: "linh_vuc" | "hoang_da" | "bien_thanh" | "cam_dia" | "vuong_kinh" | "hai_vuc_khong_vuc"
             // dùng ĐÚNG 6 loại vùng đã định nghĩa ở Xianxin_map.md mục 1.1
  discovered: boolean
  dangerLevel: 1-5                  // ảnh hưởng độ mạnh Quái/NPC roll ra khi Explore node này
  linhKhiDensity: 1-5               // ảnh hưởng tốc độ tu luyện khi dừng lại node này
  ownerFactionId: string | null     // null nếu vô chủ, ngược lại trỏ tới Faction (Xianxin_map.md 5.1)
  availableActions: string[]        // xem mục 3, tính động theo nodeType + discovered + trạng thái nhân vật
  eventPoolTag: string              // trỏ tới bảng trọng số sự kiện tương ứng trong RANDOM_EVENT_SYSTEM.md
  cooldownUntil: timestamp | null   // node vừa bị "vét cạn" sự kiện, tạm khóa random event 1 thời gian
  claimedByPlayerId: string | null  // CHỈ áp dụng nodeType "dong_phu" sau khi player chinh phục (mục 5.2 file event)
}

MapEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  travelType: "walk" | "ngự_khí" | "truyền_tống_trận" | "thuyền_hải_vực"
  travelTimeSeconds: number         // ảnh hưởng số lần roll sự kiện dọc đường (mục 2)
  revealsOnArrival: string[]        // danh sách node ẨN sẽ lộ ra (chuyển discovered=false->true) khi
                                     // nhân vật ĐẾN được 1 đầu của cạnh này — đây là cơ chế "mở rộng
                                     // bản đồ" chính, thay vì random toàn bản đồ ngay từ đầu
}
```

---

## 2. CƠ CHẾ MỞ RỘNG BẢN ĐỒ (KHÁM PHÁ DẦN, KHÔNG LỘ HẾT NGAY)

Đúng như ảnh mẫu — nhiều node "Chưa khám phá" nối bằng nét đứt tới các node đã biết. Quy tắc:

1. Khi nhân vật **đến** 1 node đã khám phá, hệ thống duyệt toàn bộ `edges` có `fromNodeId`/`toNodeId`
   trỏ tới node đó → với mỗi node ĐẦU KIA còn `discovered=false`, có % cơ hội lộ ra (không phải lộ
   100% ngay, tạo cảm giác thăm dò dần):
   ```
   RevealChance = 40% + (10% × số lần đã Explore tại node hiện tại) + bonus theo nodeType
                  (VD node "nga_re" — Ngã Rẽ — luôn +30% vì bản chất là điểm giao lộ nhiều đường)
   ```
2. Khi 1 node được lộ ra (`discovered = true` lần đầu), random ngay 1 **Sự Kiện Khám Phá Đầu Tiên**
   (xem file `RANDOM_EVENT_SYSTEM.md` mục 3) — luôn có ít nhất 1 sự kiện, không để node trống trơn
   ngay lần đầu ghé thăm (tạo động lực đi khám phá).
3. Số node "Chưa khám phá" xung quanh 1 node LUÔN được giữ tối thiểu 2-4 (nếu tụt xuống dưới 2 do
   đã khám phá hết, hệ thống tự sinh thêm node mới ngẫu nhiên nối vào — bản đồ "vô hạn mở rộng" ra
   biên, không có giới hạn cứng, đúng tinh thần thế giới mở đã định nghĩa ở `Xianxin_map.md`).

---

## 3. MAP ACTION SYSTEM — MỞ RỘNG NGOÀI DI CHUYỂN/NÓI CHUYỆN

Áp dụng đúng nguyên tắc `ACTION_HYBRID_SYSTEM.md`: action bar tính ĐỘNG theo `context_state` (ở
đây là node hiện tại + trạng thái nhân vật), không hardcode chỉ 2 nút Move/Talk.

| Action | Điều kiện xuất hiện | Hiệu ứng |
|---|---|---|
| **Di Chuyển** | Luôn có (nếu có edge tới node khác đã khám phá) | Di chuyển, có thể roll sự kiện dọc đường (mục 2 file event) |
| **Nói Chuyện** | Node có NPC đang đứng | Vào `DIALOGUE_FLOW` (NPC_MONSTER_SYSTEM.md mục 3) |
| **Khám Phá (Explore)** | Node có `discovered=true` nhưng chưa "vét cạn" sự kiện | Roll 1 sự kiện ngẫu nhiên tại chỗ (NPC/Quái/Cơ Duyên/Động Phủ — file event), có cooldown sau khi dùng |
| **Điều Tra (Investigate)** | Node có Đặc Sắc dạng bí ẩn (VD "Nội bộ lục đục", di tích) | Hé lộ 1 phần lore/manh mối, có thể mở khóa quest ẩn |
| **Thu Thập (Gather)** | Node loại `hoang_da`/`cam_dia`, `linhKhiDensity >= 3` | Thu Linh Thảo/nguyên liệu, roll theo bảng tài nguyên vùng |
| **Đả Tọa Tu Luyện** | Bất kỳ node an toàn (`dangerLevel <= 2`) | Tăng tốc EXP tạm thời theo `linhKhiDensity` của node, đứng yên trong X phút |
| **Cắm Trại/Nghỉ Ngơi** | Bất kỳ node `dangerLevel <= 2` | Hồi SAN/HP, KHÔNG roll sự kiện trong thời gian nghỉ (an toàn) |
| **Chinh Phục Động Phủ** | Node loại `dong_phu`, chưa có `claimedByPlayerId` | Trigger chuỗi thử thách (file event mục 5) để chiếm làm căn cứ riêng |
| **Giao Dịch** | Node có NPC Thương Nhân | Vào luồng Giao Dịch (NPC_MONSTER_SYSTEM.md mục 5.1) |
| **Xin Gia Nhập/Rời Khỏi** | Node loại `tong_mon`, có `ownerFactionId` | Quest Đạo Lộ / thoát ly tông môn (đã có ở hệ thống khởi tạo nhân vật) |
| **Bố Trận Phòng Thủ** | Chỉ tại Động Phủ đã chiếm (`claimedByPlayerId == mình`) | Đặt Trận Pháp bảo vệ căn cứ (dùng Công Pháp loại `tran_phap`) |
| **Nhìn Toàn Cảnh (Scout)** | Node loại `nga_re`/độ cao | Hé lộ thêm 1-2 node ẩn xung quanh NGAY LẬP TỨC không cần đợi roll % (mục 2) |

> Số action hiển thị mỗi lúc nên giới hạn 4-6 nút chính (theo đúng khuyến nghị UI ở
> `ACTION_HYBRID_SYSTEM.md` mục 7) — action hiếm dùng (Bố Trận, Xin Gia Nhập...) có thể gộp vào 1
> nút "Thêm ▾" phụ.

---

## 4. VÍ DỤ DỮ LIỆU NODE THEO ĐÚNG ẢNH MẪU

```json
{
  "id": "node_thien_huyen_tong",
  "name": "Sơn Môn Thiên Huyền Tông",
  "nodeType": "tong_mon",
  "regionTag": "linh_vuc",
  "discovered": true,
  "dangerLevel": 1,
  "linhKhiDensity": 4,
  "ownerFactionId": "faction_thien_huyen_tong",
  "availableActions": ["di_chuyen", "noi_chuyen", "dam_toa_tu_luyen", "giao_dich", "xin_gia_nhap"],
  "eventPoolTag": "tong_mon_an_toan",
  "cooldownUntil": null,
  "claimedByPlayerId": null
}
```
```json
{
  "id": "node_van_phong_dien",
  "name": "Vạn Phong Điện",
  "nodeType": "then_chot_cot_truyen",
  "regionTag": "linh_vuc",
  "discovered": true,
  "dangerLevel": 2,
  "linhKhiDensity": 3,
  "ownerFactionId": "faction_thien_huyen_tong",
  "availableActions": ["di_chuyen", "noi_chuyen", "dieu_tra"],
  "eventPoolTag": "co_dinh_cot_truyen",
  "cooldownUntil": null,
  "claimedByPlayerId": null
}
```
```json
{
  "id": "node_unknown_north_1",
  "name": null,
  "nodeType": null,
  "regionTag": "linh_vuc",
  "discovered": false,
  "dangerLevel": null,
  "linhKhiDensity": null,
  "ownerFactionId": null,
  "availableActions": [],
  "eventPoolTag": null,
  "cooldownUntil": null,
  "claimedByPlayerId": null
}
```
> Node chưa khám phá KHÔNG lộ `nodeType`/`dangerLevel` thật — các field này chỉ được roll và gán
> giá trị thật ĐÚNG THỜI ĐIỂM `discovered` chuyển thành `true` (tránh client đọc trộm dữ liệu ẩn
> qua DevTools/network tab trước khi khám phá).

---

## 5. TÍCH HỢP VỚI RANDOM EVENT SYSTEM

Mọi hành động **Di Chuyển** (dọc đường), **Khám Phá**, và **lần đầu một node được lộ ra** (mục 2)
đều gọi sang bảng sự kiện chi tiết ở file `RANDOM_EVENT_SYSTEM.md` — file đó định nghĩa ĐẦY ĐỦ 4
nhóm sự kiện (NPC/Quái/Cơ Duyên/Động Phủ), bảng trọng số theo vùng, và cấu trúc dữ liệu Event.
Map System chỉ chịu trách nhiệm "GỌI ĐÚNG LÚC, ĐÚNG NGỮ CẢNH" (`eventPoolTag` của node quyết định
dùng bảng trọng số nào), KHÔNG tự định nghĩa lại nội dung sự kiện ở đây (tránh trùng lặp 2 nguồn).

---

## 6. NÂNG CẤP: THẾ GIỚI MỞ VÔ HẠN (PROCEDURAL GRID-BASED GENERATION)

Nâng cấp này giữ NGUYÊN toàn bộ schema `MapNode`/`MapEdge` và UI node-graph đã có (mục 1-5) — chỉ
đổi CÁCH node được TẠO RA: thay vì random % lộ dần từ 1 tập node dựng sẵn hữu hạn, node được **sinh
mới ngay khi cần** (lazy generation) khi người chơi bấm hành động theo HƯỚNG, trên 1 lưới tọa độ
vô hạn — đúng ý "đi Nam/đi Bắc thì tạo node mới nối tiếp vào bản đồ".

### 6.1 Hệ tọa độ + Action theo hướng
Mỗi node giờ có thêm tọa độ nguyên `(x, y)` trên lưới vô hạn. Node cụm ban đầu (Sơn Môn Thiên Huyền
Tông, Vạn Phong Điện... như ảnh mẫu) được đặt cố định quanh gốc `(0, 0)` — coi là "Vùng Khởi Nguyên"
đã dựng sẵn tay, KHÔNG sinh procedural. Mọi ô lưới ngoài vùng này đều sinh động.

Thay/bổ sung action "Di Chuyển" (mục 3) bằng 4 action theo hướng, LUÔN hiển thị khi đang ở 1 node
thuộc lưới mở (không hiển thị nếu node hiện tại là node cốt truyện cố định không cho tự do đi hướng):
```
"di_bac"  -> target = (x, y+1)
"di_nam"  -> target = (x, y-1)
"di_dong" -> target = (x+1, y)
"di_tay"  -> target = (x-1, y)
```
> Có thể mở rộng thêm 4 hướng chéo (Đông Bắc/Tây Bắc/Đông Nam/Tây Nam) nếu muốn lưới mịn hơn — cùng
> 1 cơ chế, chỉ thêm 4 delta tọa độ.

### 6.2 Luồng xử lý khi bấm 1 hướng đi
```
[Player bấm "Đi Bắc" tại node (x, y)]
        │
        ▼
   target = (x, y+1) — đã tồn tại trong DB (đã từng sinh trước đó)?
      ├── CÓ  -> di chuyển thẳng tới node đã lưu, roll sự kiện "moving_through" như bình thường
      │          (RANDOM_EVENT_SYSTEM.md mục 1)
      └── CHƯA -> gọi generateNodeAt(x, y+1) (mục 6.3) để SINH MỚI từ data, LƯU VĨNH VIỄN vào DB,
                  rồi coi node vừa sinh là 1 lần "first_discovery" (100% có sự kiện, đúng mục 2 cũ)
        │
        ▼
[Tự động tạo/khớp MapEdge giữa (x,y) và (x,y+1) — với lưới vuông, edge LUÔN ngầm định tồn tại giữa
 2 ô liền kề, không cần author tay từng cạnh như node-graph cũ]
```

### 6.3 Thuật toán sinh node MỚI TỪ DATA (deterministic, không sinh bừa)
```
generateNodeAt(x, y):
  seed = hash(WORLD_SEED, x, y)          // deterministic: cùng tọa độ luôn ra cùng kết quả nếu
                                           // chưa từng bị thay đổi bởi hành động người chơi (chiếm
                                           // Động Phủ, phe phái sụp đổ...)
  regionTag = resolveRegionTag(x, y)      // mục 6.4
  nodeType  = rollNodeType(regionTag, seed)   // dùng lại bảng trọng số Faction Types đã có ở
                                                // Xianxin_map.md mục 4-5 (Tông Môn/Thế Gia/Vương
                                                // Triều/Tán Tu/Hắc Đạo/Thế Lực Ẩn theo đúng trọng
                                                // số vùng mục 5.3 của file đó)
  node = buildNodeFromTemplate(nodeType, regionTag, seed)   // roll tên, dangerLevel, linhKhiDensity,
                                                              // ownerFactionId (nếu là Tông Môn/Thế
                                                              // Gia, sinh luôn 1 Faction mới theo
                                                              // schema Faction đã có)
  PERSIST node vào DB vĩnh viễn (KHÔNG sinh lại lần sau, kể cả khi player khác đi qua cùng tọa độ —
  thế giới dùng CHUNG 1 bản đồ persistent, không phải mỗi người 1 bản riêng)
  return node
```
> "Từ data" nghĩa là: KHÔNG tự bịa nội dung ngẫu nhiên vô căn cứ — mọi bước roll ở trên đều tra lại
> đúng các bảng đã build sẵn (Faction Types, Race Weight, Region Weight — `Xianxin_map.md`; NPC/Quái
> — `NPC_MONSTER_SYSTEM.md`; Event Pool — `RANDOM_EVENT_SYSTEM.md`). Generation chỉ là "gọi đúng bảng
> đúng lúc", không phải hệ thống nội dung riêng biệt.

### 6.4 Phân bố Vùng (regionTag) trên lưới — kết hợp Vòng Khoảng Cách + Nhiễu (Noise)
```
distanceFromOrigin = |x| + |y|   // hoặc sqrt(x²+y²) nếu muốn vòng tròn thay vì hình thoi

// Bước 1: xác định "vòng an toàn" theo khoảng cách (world design chuẩn open-world: gần nhà an
// toàn, càng xa càng nguy hiểm — tạo động lực dịch chuyển ra xa dần theo sức mạnh nhân vật)
if distanceFromOrigin <= 5:    baseDanger = 1-2   // quanh Vùng Khởi Nguyên: Vương Kinh/Linh Vực
if distanceFromOrigin <= 15:   baseDanger = 2-3   // Biên Thành/Hoang Dã
if distanceFromOrigin <= 30:   baseDanger = 3-4   // Hoang Dã sâu/Hải Vực-Không Vực
if distanceFromOrigin > 30:    baseDanger = 4-5   // Cấm Địa dày đặc

// Bước 2: nhiễu Perlin/Simplex 2D theo (x,y) để phá vỡ tính đối xứng thuần vòng tròn (tránh bản đồ
// nhàm chán kiểu "cứ đi xa là y hệt nhau"), cho phép 1 túi Cấm Địa xuất hiện lệch gần origin hoặc
// ngược lại — CHỈ dùng để CHỌN regionTag cụ thể trong dải baseDanger đã xác định, không phá vỡ
// hẳn quy luật an toàn gần/nguy hiểm xa ở bước 1:
noiseValue = simplexNoise2D(x * 0.05, y * 0.05, WORLD_SEED)   // scale 0.05 quyết định độ "to" của
                                                                 // từng túi vùng, chỉnh theo nhu cầu
regionTag = mapNoiseToRegionTag(noiseValue, baseDanger)   // tra bảng trọng số vùng theo dải danger
```

### 6.5 Cụm Tông Môn → Thành Trấn vệ tinh ("nối tiếp thành trấn")
Đúng yêu cầu — khi 1 node sinh ra là `nodeType: "tong_mon"` hoặc `"the_gia"`, hệ thống PRE-RESERVE
(đặt trước, chưa sinh chi tiết) 2-4 ô liền kề xung quanh làm "cụm vệ tinh" thuộc cùng thế lực đó:
```
onGenerateFaction(node, faction):
  neighborCells = 2-4 ô random trong bán kính 1-2 ô quanh (node.x, node.y)
  với mỗi ô đó:
    reserve nodeType theo danh sách: ["thanh_tran" (chợ/thị trấn phụ thuộc),
                                       "bien_thanh" (khu ngoại vi tán tu quanh tông môn),
                                       "hoang_da" (đất săn luyện của đệ tử ngoại môn)]
    gán sẵn ownerFactionId = faction.id cho các ô "thanh_tran" (thành trấn PHỤ THUỘC tông môn này)
  // Các ô này CHƯA sinh chi tiết đầy đủ ngay — chỉ "khóa trước loại + chủ sở hữu", nội dung cụ thể
  // (tên, NPC, action) vẫn chờ tới khi player thật sự đi hướng đó tới mới generateNodeAt() đầy đủ
```
→ Kết quả: người chơi đi về hướng 1 Tông Môn sẽ tự nhiên gặp 1-2 thành trấn/khu vệ tinh THUỘC tông
môn đó TRƯỚC khi chạm sơn môn chính — đúng cảm giác "thế giới có tổ chức" thay vì các node rời rạc
vô nghĩa nối với nhau.

### 6.6 Node cốt truyện cố định (không procedural) chồng lên lưới
Các địa điểm cốt truyện quan trọng (`nodeType: "then_chot_cot_truyen"`, ví dụ Vạn Phong Điện) vẫn
được đặt TAY tại tọa độ cố định cụ thể (không dùng `generateNodeAt`), đảm bảo luôn xuất hiện đúng vị
trí thiết kế dù thế giới sinh procedural. Khi `generateNodeAt(x,y)` được gọi mà tọa độ đó trùng với
1 vị trí cốt truyện đã định trước, ưu tiên trả về node cốt truyện đã author tay thay vì random.

### 6.7 Bổ sung field cho `MapNode` (mục 1)
```
MapNode {
  ...(giữ nguyên toàn bộ field cũ)...
  x: integer
  y: integer
  isProcedural: boolean       // false cho Vùng Khởi Nguyên + node cốt truyện author tay
  generatedAtTimestamp: timestamp | null
  reservedNodeType: string | null   // dùng cho cơ chế pre-reserve mục 6.5, null sau khi đã generate đầy đủ
}
```

### 6.8 Việc cần làm tiếp riêng cho mục 6
1. Chọn thư viện/thuật toán noise cụ thể (Simplex/Perlin) và tune giá trị scale (0.05 chỉ là gợi ý
   khởi điểm) bằng cách sinh thử và visualize bản đồ trước khi gắn vào game thật.
2. Quyết định bán kính "Vùng Khởi Nguyên" chính xác (gợi ý ở trên là distanceFromOrigin <= 5, có
   thể điều chỉnh theo số node đã author tay thật sự).
3. Viết migration: các node/edge hiện có (author tay) cần được gán tọa độ `(x,y)` cụ thể để tích
   hợp vào lưới mới mà không bị xung đột vị trí.
4. Quyết định thế giới dùng CHUNG 1 bản đồ persistent cho mọi người chơi (multiplayer shared world)
   hay MỖI người chơi 1 bản đồ procedural riêng (mỗi người 1 `WORLD_SEED` khác nhau) — ảnh hưởng
   trực tiếp thiết kế PvP chiếm Động Phủ ở `RANDOM_EVENT_SYSTEM.md` mục 6.2.

---

## 7. VIỆC CẦN LÀM TIẾP (chưa code, đang chờ xác nhận)

1. Viết `revealAdjacentNodes(currentNodeId)` — xử lý mục 2 (roll % lộ node lân cận + tự sinh node
   mới nếu số node ẩn xung quanh tụt dưới ngưỡng tối thiểu).
2. Viết `getAvailableMapActions(node, character)` — tính động danh sách action theo mục 3, dùng
   chung pattern Context Resolver đã có ở `ACTION_HYBRID_SYSTEM.md`.
3. Thiết kế UI cho node "Ngã Rẽ" (nga_re) — vì đây là loại node đặc biệt luôn có action "Nhìn Toàn
   Cảnh" và bonus reveal cao hơn, cần icon/viền riêng để người chơi nhận biết ngay trên bản đồ.
4. Quyết định: Động Phủ đã bị player khác chiếm thì có hiển thị khác gì với Động Phủ vô chủ không
   (màu viền khác, action "Tấn Công Chiếm Đoạt" thay vì "Chinh Phục")?
## Trạng thái triển khai trong engine

### 8. Open World Runtime đã áp dụng

Engine hiện vận hành bản đồ như một đồ thị mở vô hạn thay vì danh sách địa điểm đóng:

- Mỗi save có `openWorld.coordinates` và `openWorld.nodes`; node sinh ra được lưu lại, không roll lại khi quay về hoặc nạp save.
- Bốn hướng Bắc/Nam/Đông/Tây luôn là cạnh tiềm năng. Nếu node tĩnh không có lối đi, engine lazy-generate node mới tại tọa độ kế bên và tự nối cạnh ngược.
- Node procedural dùng hash tọa độ để tạo kết quả ổn định: vùng, cấp nguy hiểm, mật độ linh khí, tà nhiễm, quái và tài nguyên. Cùng một tọa độ luôn cho cùng một địa điểm trong cùng thế giới.
- Khoảng cách từ vùng khởi nguyên điều khiển độ nguy hiểm; các vùng Đông Hoang, Nam Chướng, Tây Mạc, Bắc Nguyên, Vô Tận Hải, Thiên Không Vực và U Minh Giới đan xen theo các vành sinh thái.
- Node mới có mô tả, lối quay về, tài nguyên và quái phù hợp, nên mọi hướng di chuyển đều mở rộng thành mạng lưới liên thông thay vì ngõ cụt giả.
- `visitedLocations` tiếp tục làm fog-of-war cho người chơi; `openWorld.nodes` là dữ liệu đã biết, còn node chưa đi tới không bị lộ nội dung.
- Hư Thiên Đỉnh, sự kiện ngẫu nhiên, chiến đấu và tu luyện dùng chung `locationId`, vì vậy node procedural hoạt động như node authored và không cần nhánh logic riêng.

### 9. Nguyên tắc thiết kế thế giới mở

1. **Liên thông trước, nội dung sau:** mọi node phải có ít nhất một cạnh quay lại; vùng biên được mở lazy thay vì khóa bản đồ.
2. **Tính liên tục:** tọa độ, vùng và nguy cơ quyết định cảm giác hành trình; di chuyển xa tăng giá phải trả nhưng không chặn khám phá tuyệt đối.
3. **Điểm neo:** node tĩnh (tông môn, thành trấn, di tích, cấm địa) là landmark; node procedural tạo khoảng thở, đường tắt, tài nguyên và bí mật nối giữa landmark.
4. **Thông tin theo lớp:** bản đồ chỉ hiển thị tên thật sau khi đến; trước đó chỉ có hướng, khoảng cách ước lượng và dấu hiệu khí tượng.
5. **Thế giới sống:** mỗi node có cooldown sự kiện, trạng thái chiếm cứ, dấu vết người chơi và biến động tà nhiễm; quay lại một nơi không đồng nghĩa trải nghiệm lặp lại.
6. **Không sinh bừa:** seed tọa độ phải quyết định kết quả; thay đổi do người chơi (chiếm động phủ, thanh tẩy, phá hủy) ghi đè lên node đã lưu.

- `WORLD_MAP`, `LOCATIONS`, `startRegionEligibility()` và `guildEligibility()` là nguồn dữ liệu/luật đang chạy trong `data/data.js` và `js/engine.js`.
- Vùng có ngưỡng Tông Môn từ cấp 3 (Đông Hoang, Vô Tận Hải) không ép nhân vật gia nhập ngay: UI hiển thị lộ trình Tán Tu, điều kiện Cảnh giới/Hiệu Mệnh và tự mở thế lực khi đủ chuẩn.
- Di chuyển gọi `move()` và `maybeTriggerRandomEncounter()`; mọi thay đổi state đều được lưu qua `serialize()`.
- Action an toàn tại địa điểm có Tà Nhiễm thấp gồm Tự Luyện, Bế Quan Tu Luyện và Nghỉ Ngơi; không cho bế quan trong chiến đấu hoặc vùng nguy hiểm.

### Source: `archive-requirements\logic-history\03-world\MAP_SYSTEM_V2_COMPLETE.md`

# MAP SYSTEM V2  THI[encoding-loss]T K[encoding-loss] TO[encoding-loss]N DI[encoding-loss]N CHO OPEN WORLD TH[encoding-loss]C S[encoding-loss]
> Thay th[encoding-loss]/h[encoding-loss]p nh[encoding-loss]t `MAP_SYSTEM.md` + ph[encoding-loss]n b[encoding-loss]n [encoding-loss] trong `WORLD_INTERCONNECTION_SYSTEM.md` m[encoding-loss]c 1-4.
> V[encoding-loss]n [encoding-loss] c[encoding-loss]t l[encoding-loss]i c[encoding-loss]n s[encoding-loss]a: b[encoding-loss]n [encoding-loss] hi[encoding-loss]n t[encoding-loss]i v[encoding-loss]n l[encoding-loss] "node-graph c[encoding-loss] sinh procedural" nh[encoding-loss]ng C[encoding-loss]M GI[encoding-loss]C nh[encoding-loss]
> danh s[encoding-loss]ch h[encoding-loss]p n[encoding-loss]i nhau, kh[encoding-loss]ng ph[encoding-loss]i th[encoding-loss] gi[encoding-loss]i s[encoding-loss]ng  th[encoding-loss] l[encoding-loss]c kh[encoding-loss]ng th[encoding-loss]t s[encoding-loss] "chi[encoding-loss]m kh[encoding-loss]ng gian", ng[encoding-loss][encoding-loss]i
> ch[encoding-loss]i kh[encoding-loss]ng c[encoding-loss] c[encoding-loss]ng c[encoding-loss] [encoding-loss]nh h[encoding-loss]nh b[encoding-loss]n [encoding-loss], di chuy[encoding-loss]n kh[encoding-loss]ng c[encoding-loss] tr[encoding-loss]ng l[encoding-loss][encoding-loss]ng.

---

## 1. KI[encoding-loss]N TR[encoding-loss]C 4 L[encoding-loss]P B[encoding-loss]N [encoding-loss] (thay v[encoding-loss] 1 l[encoding-loss]p node-graph ph[encoding-loss]ng)

```
L[encoding-loss]p 1  TH[encoding-loss] GI[encoding-loss]I (World Map):     t[encoding-loss]ng quan to[encoding-loss]n v[encoding-loss]ng, hi[encoding-loss]n v[encoding-loss]ng [encoding-loss]nh h[encoding-loss][encoding-loss]ng Faction d[encoding-loss]ng heatmap,
                                    d[encoding-loss]ng [encoding-loss] l[encoding-loss]n k[encoding-loss] ho[encoding-loss]ch di chuy[encoding-loss]n xa, KH[encoding-loss]NG hi[encoding-loss]n chi ti[encoding-loss]t t[encoding-loss]ng node
L[encoding-loss]p 2  V[encoding-loss]NG (Regional Map):       ch[encoding-loss]nh l[encoding-loss] node-graph hi[encoding-loss]n c[encoding-loss] (grid t[encoding-loss]a [encoding-loss] x,y t[encoding-loss] MAP_SYSTEM.md 6),
                                    [encoding-loss]y l[encoding-loss] l[encoding-loss]p ch[encoding-loss]i ch[encoding-loss]nh h[encoding-loss]ng ng[encoding-loss]y
L[encoding-loss]p 3  [encoding-loss]A I[encoding-loss]M (Node Detail):    M[encoding-loss]I  b[encoding-loss]m v[encoding-loss]o 1 node [encoding-loss] kh[encoding-loss]m ph[encoding-loss], m[encoding-loss] ra sub-map c[encoding-loss]c i[encoding-loss]m nh[encoding-loss] B[encoding-loss]N
                                    TRONG node [encoding-loss] (ch[encoding-loss]/s[encoding-loss]nh ch[encoding-loss]nh/h[encoding-loss]m sau/kho...), NPC [encoding-loss]ng [encoding-loss] [encoding-loss]NG
                                    i[encoding-loss]m nh[encoding-loss] c[encoding-loss] th[encoding-loss], kh[encoding-loss]ng c[encoding-loss]n "c[encoding-loss] node l[encoding-loss] 1 h[encoding-loss]p m[encoding-loss]"
L[encoding-loss]p 4  INSTANCE (B[encoding-loss] C[encoding-loss]nh/M[encoding-loss]ng C[encoding-loss]nh/N[encoding-loss]i th[encoding-loss]t [encoding-loss]ng Ph[encoding-loss]): t[encoding-loss]ch bi[encoding-loss]t ho[encoding-loss]n to[encoding-loss]n kh[encoding-loss]i l[encoding-loss][encoding-loss]i ch[encoding-loss]nh, [encoding-loss] c[encoding-loss]
                                    khung [encoding-loss] c[encoding-loss]c t[encoding-loss]i li[encoding-loss]u tr[encoding-loss][encoding-loss]c, gi[encoding-loss] nguy[encoding-loss]n
```
[encoding-loss]y l[encoding-loss] thay [encoding-loss]i N[encoding-loss]N T[encoding-loss]NG quan tr[encoding-loss]ng nh[encoding-loss]t  gi[encoding-loss]i quy[encoding-loss]t tr[encoding-loss]c ti[encoding-loss]p c[encoding-loss]m gi[encoding-loss]c "ch[encoding-loss]a ph[encoding-loss]i open world th[encoding-loss]t"
v[encoding-loss] tr[encoding-loss][encoding-loss]c gi[encoding-loss] ch[encoding-loss] c[encoding-loss] L[encoding-loss]p 2, khi[encoding-loss]n m[encoding-loss]i node d[encoding-loss] to (V[encoding-loss][encoding-loss]ng Kinh) hay nh[encoding-loss] (tr[encoding-loss]m g[encoding-loss]c) [encoding-loss]u c[encoding-loss]m gi[encoding-loss]c nh[encoding-loss]
nhau (1 h[encoding-loss]p b[encoding-loss]m v[encoding-loss]o l[encoding-loss] xong).

---

## 2. L[encoding-loss]P 3 CHI TI[encoding-loss]T  NODE DETAIL VIEW (gi[encoding-loss]i quy[encoding-loss]t "node l[encoding-loss] h[encoding-loss]p r[encoding-loss]ng")

```
NodeDetailLayout {
  nodeId,
  subLocations: [
    { id, name, type: "market"|"hall"|"alley"|"warehouse"|"gate"|"shrine"|"training_ground",
      npcsPresent: [npcId], actionsAvailable: [...], visualTag }
  ]
}
```
- S[encoding-loss] l[encoding-loss][encoding-loss]ng `subLocations` t[encoding-loss]y quy m[encoding-loss] node: Tr[encoding-loss]m g[encoding-loss]c nh[encoding-loss] = 1-2 i[encoding-loss]m; T[encoding-loss]ng M[encoding-loss]n/V[encoding-loss][encoding-loss]ng Kinh l[encoding-loss]n = 5-8
  i[encoding-loss]m kh[encoding-loss]c nhau.
- NPC gi[encoding-loss] g[encoding-loss]n v[encoding-loss]o [encoding-loss]NG 1 `subLocation` c[encoding-loss] th[encoding-loss] (kh[encoding-loss]ng c[encoding-loss]n "NPC [encoding-loss] node" m[encoding-loss] h[encoding-loss])  Tr[encoding-loss][encoding-loss]ng L[encoding-loss]o [encoding-loss] "S[encoding-loss]nh
  Ch[encoding-loss]nh", Th[encoding-loss][encoding-loss]ng Nh[encoding-loss]n [encoding-loss] "Ch[encoding-loss]", gi[encoding-loss]n i[encoding-loss]p/Ma [encoding-loss]u th[encoding-loss][encoding-loss]ng xu[encoding-loss]t hi[encoding-loss]n [encoding-loss] "H[encoding-loss]m Sau" (d[encoding-loss]ng [encoding-loss]ng [encoding-loss] t[encoding-loss][encoding-loss]ng M[encoding-loss]t
  H[encoding-loss]i [encoding-loss] thi[encoding-loss]t k[encoding-loss], gi[encoding-loss] c[encoding-loss] V[encoding-loss] TR[encoding-loss] C[encoding-loss] TH[encoding-loss] [encoding-loss] player ph[encoding-loss]i ch[encoding-loss] [encoding-loss]ng t[encoding-loss]i [encoding-loss]ng ch[encoding-loss] m[encoding-loss]i b[encoding-loss]t g[encoding-loss]p).
- Action Bar t[encoding-loss]i L[encoding-loss]p 3 ch[encoding-loss] hi[encoding-loss]n action li[encoding-loss]n quan t[encoding-loss]i `subLocation` ang [encoding-loss]ng (VD "Ch[encoding-loss]" m[encoding-loss]i c[encoding-loss] Giao
  D[encoding-loss]ch, "H[encoding-loss]m Sau" m[encoding-loss]i c[encoding-loss] i[encoding-loss]u Tra M[encoding-loss]t H[encoding-loss]i)  bi[encoding-loss]n vi[encoding-loss]c di chuy[encoding-loss]n TRONG 1 node cing c[encoding-loss] [encoding-loss] ngh)a ch[encoding-loss]n
  l[encoding-loss]a, kh[encoding-loss]ng ch[encoding-loss] di chuy[encoding-loss]n GI[encoding-loss]A c[encoding-loss]c node.

---

## 3. L[encoding-loss]NH TH[encoding-loss] THEO GRADIENT (KH[encoding-loss]NG C[encoding-loss]N NH[encoding-loss] PH[encoding-loss]N S[encoding-loss] H[encoding-loss]U/KH[encoding-loss]NG S[encoding-loss] H[encoding-loss]U)

### 3.1. V[encoding-loss]ng [encoding-loss]nh H[encoding-loss][encoding-loss]ng (Influence Radius) thay v[encoding-loss] `ownerFactionId` c[encoding-loss]ng
```
M[encoding-loss]i Faction node (T[encoding-loss]ng M[encoding-loss]n/Th[encoding-loss] Gia ch[encoding-loss]nh) ph[encoding-loss]t ra "s[encoding-loss]c [encoding-loss]nh h[encoding-loss][encoding-loss]ng" gi[encoding-loss]m d[encoding-loss]n theo kho[encoding-loss]ng c[encoding-loss]ch:
  influenceAt(node, faction) = faction.power [encoding-loss] decayFactor^(distance(node, faction.homeNode))
  // decayFactor v[encoding-loss] d[encoding-loss] 0.7  m[encoding-loss]i [encoding-loss] xa th[encoding-loss]m, [encoding-loss]nh h[encoding-loss][encoding-loss]ng c[encoding-loss]n 70% [encoding-loss] tr[encoding-loss][encoding-loss]c

M[encoding-loss]i node TH[encoding-loss][encoding-loss]NG (kh[encoding-loss]ng ph[encoding-loss]i Faction ch[encoding-loss]nh) c[encoding-loss] `influenceMap: { factionId: number }`  T[encoding-loss]NH L[encoding-loss]I m[encoding-loss]i
worldTick, kh[encoding-loss]ng c[encoding-loss] [encoding-loss]nh. `ownerFactionId` ci gi[encoding-loss] SUY RA t[encoding-loss] influenceMap (Faction c[encoding-loss] influence cao
nh[encoding-loss]t t[encoding-loss]i node [encoding-loss] > ng[encoding-loss][encoding-loss]ng n[encoding-loss]o [encoding-loss] m[encoding-loss]i [encoding-loss][encoding-loss]c coi l[encoding-loss] "ch[encoding-loss]", n[encoding-loss]u kh[encoding-loss]ng ai v[encoding-loss][encoding-loss]t ng[encoding-loss][encoding-loss]ng -> node "v[encoding-loss] ch[encoding-loss]
th[encoding-loss]c s[encoding-loss]", kh[encoding-loss]ng ph[encoding-loss]i m[encoding-loss]c [encoding-loss]nh thu[encoding-loss]c v[encoding-loss] Faction g[encoding-loss]n nh[encoding-loss]t).
```

### 3.2. V[encoding-loss]ng Tranh Ch[encoding-loss]p (Contested Zone)  h[encoding-loss] qu[encoding-loss] tr[encoding-loss]c ti[encoding-loss]p c[encoding-loss]a gradient
```
Node c[encoding-loss] 2+ Faction c[encoding-loss]ng influence g[encoding-loss]n b[encoding-loss]ng nhau (ch[encoding-loss]nh l[encoding-loss]ch < 15%) -> [encoding-loss]nh d[encoding-loss]u "Tranh Ch[encoding-loss]p":
  - `eventPoolTag` [encoding-loss]i th[encoding-loss]nh h[encoding-loss]n h[encoding-loss]p (tr[encoding-loss]n tr[encoding-loss]ng s[encoding-loss] s[encoding-loss] ki[encoding-loss]n c[encoding-loss]a C[encoding-loss] 2 Faction li[encoding-loss]n quan)
  - C[encoding-loss] 2 Faction [encoding-loss]u c[encoding-loss] th[encoding-loss] giao nhi[encoding-loss]m v[encoding-loss] T[encoding-loss]I node n[encoding-loss]y (d[encoding-loss] kh[encoding-loss]ng "s[encoding-loss] h[encoding-loss]u" ch[encoding-loss]nh th[encoding-loss]c)
  - Player ho[encoding-loss]n th[encoding-loss]nh quest cho 1 b[encoding-loss]n t[encoding-loss]i [encoding-loss]y s[encoding-loss] [encoding-loss]y influence b[encoding-loss]n [encoding-loss] l[encoding-loss]n  GI[encoding-loss]P NG[encoding-loss][encoding-loss]I CH[encoding-loss]I TH[encoding-loss]C S[encoding-loss]
    [encoding-loss]NH H[encoding-loss]NH B[encoding-loss]N [encoding-loss] b[encoding-loss]ng h[encoding-loss]nh [encoding-loss]ng, kh[encoding-loss]ng ch[encoding-loss] [encoding-loss]ng xem th[encoding-loss] l[encoding-loss]c t[encoding-loss] chi[encoding-loss]n tranh ([encoding-loss] c[encoding-loss] [encoding-loss]
    WORLD_INTERCONNECTION_SYSTEM.md m[encoding-loss]c 2.2, gi[encoding-loss] c[encoding-loss] th[encoding-loss]m 1 con [encoding-loss][encoding-loss]ng [encoding-loss]NH H[encoding-loss][encoding-loss]NG M[encoding-loss]M song song
    chi[encoding-loss]n tranh tr[encoding-loss]c di[encoding-loss]n)
```

### 3.3. B[encoding-loss]n [encoding-loss] Heatmap [encoding-loss] L[encoding-loss]p 1 (World Map)
Hi[encoding-loss]n m[encoding-loss]u ch[encoding-loss]ng l[encoding-loss]p theo `influenceMap` t[encoding-loss]ng h[encoding-loss]p to[encoding-loss]n v[encoding-loss]ng  ng[encoding-loss][encoding-loss]i ch[encoding-loss]i nh[encoding-loss]n L[encoding-loss]p 1 th[encoding-loss]y NGAY "v[encoding-loss]ng
n[encoding-loss]y ang l[encoding-loss] c[encoding-loss]a ai, v[encoding-loss]ng n[encoding-loss]o ang tranh ch[encoding-loss]p n[encoding-loss]ng" m[encoding-loss] kh[encoding-loss]ng c[encoding-loss]n b[encoding-loss]m t[encoding-loss]ng node [encoding-loss] L[encoding-loss]p 2.

---

## 4. NG[encoding-loss][encoding-loss]I CH[encoding-loss]I [encoding-loss]NH H[encoding-loss]NH B[encoding-loss]N [encoding-loss] (MAP AGENCY  hi[encoding-loss]n ho[encoding-loss]n to[encoding-loss]n th[encoding-loss] [encoding-loss]ng)

### 4.1. C[encoding-loss]m C[encoding-loss]/L[encoding-loss]p Tr[encoding-loss]m (Claim Outpost)
```
T[encoding-loss]i 1 node V[encoding-loss] CH[encoding-loss] TH[encoding-loss]C S[encoding-loss] (kh[encoding-loss]ng Faction n[encoding-loss]o v[encoding-loss][encoding-loss]t ng[encoding-loss][encoding-loss]ng influence, m[encoding-loss]c 3.1), player c[encoding-loss] action m[encoding-loss]i
"L[encoding-loss]p Tr[encoding-loss]m"  c[encoding-loss]n Linh Th[encoding-loss]ch + th[encoding-loss]i gian (v[encoding-loss]i ng[encoding-loss]y GameClock), sau [encoding-loss]:
  - Node [encoding-loss] c[encoding-loss] `ownerFactionId = "player_outpost_" + characterId` (player CH[encoding-loss]NH TH[encoding-loss]C l[encoding-loss] 1 th[encoding-loss]c th[encoding-loss]
    c[encoding-loss] l[encoding-loss]nh th[encoding-loss] tr[encoding-loss]n b[encoding-loss]n [encoding-loss], kh[encoding-loss]ng ch[encoding-loss] c[encoding-loss] [encoding-loss]ng Ph[encoding-loss] [encoding-loss]n l[encoding-loss])
  - T[encoding-loss] ph[encoding-loss]t ra influence NH[encoding-loss] quanh n[encoding-loss] (d[encoding-loss]ng c[encoding-loss]ng th[encoding-loss]c m[encoding-loss]c 3.1, `power` th[encoding-loss]p h[encoding-loss]n Faction th[encoding-loss]t nhi[encoding-loss]u)
  - C[encoding-loss] th[encoding-loss] b[encoding-loss] Faction kh[encoding-loss]c "l[encoding-loss]n" n[encoding-loss]u kh[encoding-loss]ng c[encoding-loss]ng c[encoding-loss] ([encoding-loss]ng c[encoding-loss] ch[encoding-loss] gradient, kh[encoding-loss]ng ph[encoding-loss]i b[encoding-loss]t t[encoding-loss])
```

### 4.2. X[encoding-loss]y D[encoding-loss]ng T[encoding-loss]i Tr[encoding-loss]m/[encoding-loss]ng Ph[encoding-loss] (Structure Building)
| C[encoding-loss]ng tr[encoding-loss]nh | Hi[encoding-loss]u [encoding-loss]ng l[encoding-loss]n b[encoding-loss]n [encoding-loss] |
|---|---|
| V[encoding-loss]ng G[encoding-loss]c (Watchtower) | Tng b[encoding-loss]n k[encoding-loss]nh `revealAdjacentNodes` (MAP_SYSTEM.md m[encoding-loss]c 2) quanh tr[encoding-loss]m  nh[encoding-loss]n xa h[encoding-loss]n m[encoding-loss] kh[encoding-loss]ng c[encoding-loss]n t[encoding-loss] i |
| Tr[encoding-loss]m D[encoding-loss]ch (Waystation) | Th[encoding-loss]m 1 i[encoding-loss]m Fast Travel (m[encoding-loss]c 5) mi[encoding-loss]n ph[encoding-loss] t[encoding-loss]i [encoding-loss]y |
| Th[encoding-loss] T[encoding-loss]p Nh[encoding-loss] (Trading Post) | NPC Th[encoding-loss][encoding-loss]ng Nh[encoding-loss]n t[encoding-loss] [encoding-loss]ng gh[encoding-loss] qua theo l[encoding-loss]ch (d[encoding-loss]ng `scheduleType: itinerant` [encoding-loss] c[encoding-loss]), kh[encoding-loss]ng c[encoding-loss]n player ch[encoding-loss] [encoding-loss]ng t[encoding-loss]m |
| Tr[encoding-loss]n Ph[encoding-loss]p Ph[encoding-loss]ng Th[encoding-loss] | Tng "power" ph[encoding-loss]t influence c[encoding-loss]a tr[encoding-loss]m ([encoding-loss] n[encoding-loss]i [encoding-loss] `PHAC_THAO_TU_VI_CON_DUONG_V3.md`  Tr[encoding-loss]n Ph[encoding-loss]p S[encoding-loss] ngh[encoding-loss] m[encoding-loss]i) |

### 4.3. Tuy[encoding-loss]n B[encoding-loss] Ch[encoding-loss] Quy[encoding-loss]n L[encoding-loss]n Faction Th[encoding-loss]t (Territory Petition)
N[encoding-loss]u player ang ph[encoding-loss]c v[encoding-loss] 1 Faction ([encoding-loss] gia nh[encoding-loss]p), c[encoding-loss] th[encoding-loss] "hi[encoding-loss]n" 1 Tr[encoding-loss]m c[encoding-loss]a m[encoding-loss]nh cho Faction [encoding-loss] 
Tr[encoding-loss]m tr[encoding-loss] th[encoding-loss]nh l[encoding-loss]nh th[encoding-loss] ch[encoding-loss]nh th[encoding-loss]c c[encoding-loss]a Faction (tng `power` g[encoding-loss]c c[encoding-loss]a Faction [encoding-loss] l[encoding-loss]u d[encoding-loss]i), [encoding-loss]i l[encoding-loss]i
C[encoding-loss]ng Hi[encoding-loss]n/factionReputation tng v[encoding-loss]t  bi[encoding-loss]n vi[encoding-loss]c m[encoding-loss] r[encoding-loss]ng b[encoding-loss]n [encoding-loss] c[encoding-loss] nh[encoding-loss]n th[encoding-loss]nh [encoding-loss]NG G[encoding-loss]P th[encoding-loss]c s[encoding-loss] cho
t[encoding-loss] ch[encoding-loss]c m[encoding-loss]nh ch[encoding-loss]n, kh[encoding-loss]ng ph[encoding-loss]i 2 h[encoding-loss] th[encoding-loss]ng t[encoding-loss]ch r[encoding-loss]i.

---

## 5. DI CHUY[encoding-loss]N C[encoding-loss] TR[encoding-loss]NG L[encoding-loss][encoding-loss]NG (TRAVEL AS MEANINGFUL MECHANIC)

### 5.1. Chi ph[encoding-loss] di chuy[encoding-loss]n th[encoding-loss]t (kh[encoding-loss]ng c[encoding-loss]n t[encoding-loss]c th[encoding-loss]i v[encoding-loss] h[encoding-loss]n)
```
travelTimeGameDays = distance(from, to) / travelSpeed(travelType)
  travelType "walk" (m[encoding-loss]c [encoding-loss]nh): speed chu[encoding-loss]n
  travelType "ng[encoding-loss]_kh[encoding-loss]" (c[encoding-loss]n C[encoding-loss]ng Ph[encoding-loss]p/Th[encoding-loss]n Ph[encoding-loss]p ph[encoding-loss] h[encoding-loss]p): speed [encoding-loss]3
  travelType "truy[encoding-loss]n_t[encoding-loss]ng_tr[encoding-loss]n": t[encoding-loss]c th[encoding-loss]i NH[encoding-loss]NG c[encoding-loss]n [encoding-loss] c[encoding-loss] Tr[encoding-loss]m D[encoding-loss]ch/Fast Travel [encoding-loss] C[encoding-loss] 2 [encoding-loss]u (m[encoding-loss]c 4.2)

Trong l[encoding-loss]c di chuy[encoding-loss]n nhi[encoding-loss]u ng[encoding-loss]y: roll s[encoding-loss] ki[encoding-loss]n d[encoding-loss]c [encoding-loss][encoding-loss]ng theo [encoding-loss]NG c[encoding-loss] ch[encoding-loss] [encoding-loss] c[encoding-loss]
(RANDOM_EVENT_SYSTEM.md m[encoding-loss]c 1, trigger "moving_through"), nh[encoding-loss]ng gi[encoding-loss] S[encoding-loss] L[encoding-loss]N ROLL t[encoding-loss] l[encoding-loss] v[encoding-loss]i s[encoding-loss] ng[encoding-loss]y
di chuy[encoding-loss]n th[encoding-loss]c (i c[encoding-loss]ng xa c[encoding-loss]ng nhi[encoding-loss]u c[encoding-loss] h[encoding-loss]i/r[encoding-loss]i ro d[encoding-loss]c [encoding-loss][encoding-loss]ng, kh[encoding-loss]ng ph[encoding-loss]i 1 l[encoding-loss]n duy nh[encoding-loss]t b[encoding-loss]t k[encoding-loss] xa
g[encoding-loss]n nh[encoding-loss] hi[encoding-loss]n t[encoding-loss]i).
```

### 5.2. Fast Travel  m[encoding-loss] d[encoding-loss]n, kh[encoding-loss]ng c[encoding-loss] s[encoding-loss]n t[encoding-loss] [encoding-loss]u
```
i[encoding-loss]m Fast Travel CH[encoding-loss] t[encoding-loss]n t[encoding-loss]i t[encoding-loss]i: node c[encoding-loss]t truy[encoding-loss]n [encoding-loss] kh[encoding-loss]m ph[encoding-loss] L[encoding-loss]N [encoding-loss]U (t[encoding-loss] [encoding-loss]ng unlock), ho[encoding-loss]c Tr[encoding-loss]m
D[encoding-loss]ch do player/Faction x[encoding-loss]y (m[encoding-loss]c 4.2). Di chuy[encoding-loss]n b[encoding-loss]ng Fast Travel gi[encoding-loss]a 2 i[encoding-loss]m [encoding-loss] unlock: t[encoding-loss]n Linh
Th[encoding-loss]ch (kh[encoding-loss]ng t[encoding-loss]n ng[encoding-loss]y GameClock), KH[encoding-loss]NG roll s[encoding-loss] ki[encoding-loss]n d[encoding-loss]c [encoding-loss][encoding-loss]ng (an to[encoding-loss]n tuy[encoding-loss]t [encoding-loss]i, [encoding-loss] l[encoding-loss] c[encoding-loss]i gi[encoding-loss]
Linh Th[encoding-loss]ch ph[encoding-loss]i tr[encoding-loss])  t[encoding-loss]o l[encoding-loss]a ch[encoding-loss]n r[encoding-loss] r[encoding-loss]ng: i b[encoding-loss] (r[encoding-loss], ch[encoding-loss]m, r[encoding-loss]i ro/c[encoding-loss] h[encoding-loss]i) vs Fast Travel ([encoding-loss]t,
nhanh, an to[encoding-loss]n).
```

### 5.3. o[encoding-loss]n [encoding-loss]ng H[encoding-loss]nh Gi[encoding-loss]m R[encoding-loss]i Ro
N[encoding-loss]u c[encoding-loss] NPC "h[encoding-loss] t[encoding-loss]ng" (thu[encoding-loss] t[encoding-loss]i Ph[encoding-loss][encoding-loss]ng Th[encoding-loss] ho[encoding-loss]c Faction c[encoding-loss] theo n[encoding-loss]u C[encoding-loss]ng Hi[encoding-loss]n [encoding-loss] cao) i c[encoding-loss]ng trong
chuy[encoding-loss]n di chuy[encoding-loss]n d[encoding-loss]i, gi[encoding-loss]m % s[encoding-loss] ki[encoding-loss]n Qu[encoding-loss]i V[encoding-loss]t/H[encoding-loss]c [encoding-loss]o d[encoding-loss]c [encoding-loss][encoding-loss]ng  chi ph[encoding-loss] thu[encoding-loss] t[encoding-loss] l[encoding-loss] v[encoding-loss]i [encoding-loss] d[encoding-loss]i
qu[encoding-loss]ng [encoding-loss][encoding-loss]ng, t[encoding-loss]o l[encoding-loss]a ch[encoding-loss]n kinh t[encoding-loss] th[encoding-loss]t (t[encoding-loss] i r[encoding-loss] nh[encoding-loss]ng r[encoding-loss]i ro, thu[encoding-loss] h[encoding-loss] t[encoding-loss]ng [encoding-loss]t nh[encoding-loss]ng an to[encoding-loss]n h[encoding-loss]n).

---

## 6. TH[encoding-loss] L[encoding-loss]C HI[encoding-loss]N DI[encoding-loss]N TH[encoding-loss]T TR[encoding-loss]N B[encoding-loss]N [encoding-loss] (kh[encoding-loss]ng ch[encoding-loss] l[encoding-loss] con s[encoding-loss] [encoding-loss]n)

### 6.1. [encoding-loss]i Tu[encoding-loss]n Tra Di [encoding-loss]ng (Patrol Icons)
NPC l[encoding-loss]nh/[encoding-loss] t[encoding-loss] tu[encoding-loss]n tra ([encoding-loss] c[encoding-loss] `scheduleType: patrol`) gi[encoding-loss] hi[encoding-loss]n th[encoding-loss] NGAY TR[encoding-loss]N B[encoding-loss]N [encoding-loss] L[encoding-loss]P 2 d[encoding-loss][encoding-loss]i d[encoding-loss]ng
1 icon nh[encoding-loss] DI CHUY[encoding-loss]N D[encoding-loss]C EDGE gi[encoding-loss]a c[encoding-loss]c node theo l[encoding-loss]ch tr[encoding-loss]nh th[encoding-loss]t (kh[encoding-loss]ng ph[encoding-loss]i ch[encoding-loss] xu[encoding-loss]t hi[encoding-loss]n khi
player t[encoding-loss]nh c[encoding-loss] [encoding-loss] c[encoding-loss]ng node)  ng[encoding-loss][encoding-loss]i ch[encoding-loss]i nh[encoding-loss]n b[encoding-loss]n [encoding-loss] th[encoding-loss]y [encoding-loss][encoding-loss]c "v[encoding-loss]ng n[encoding-loss]y ang c[encoding-loss] bao nhi[encoding-loss]u l[encoding-loss]nh
tu[encoding-loss]n tra qua l[encoding-loss]i", t[encoding-loss]o c[encoding-loss]m gi[encoding-loss]c l[encoding-loss]nh th[encoding-loss] [encoding-loss][encoding-loss]c B[encoding-loss]O V[encoding-loss] TH[encoding-loss]T ch[encoding-loss] kh[encoding-loss]ng ph[encoding-loss]i nh[encoding-loss]n d[encoding-loss]n.

### 6.2. Ki[encoding-loss]n Tr[encoding-loss]c Node [encoding-loss]i Theo Ch[encoding-loss] S[encoding-loss] H[encoding-loss]u
Node do Faction Ch[encoding-loss]nh [encoding-loss]o s[encoding-loss] h[encoding-loss]u vs H[encoding-loss]c [encoding-loss]o vs v[encoding-loss] ch[encoding-loss] c[encoding-loss] visualTag kh[encoding-loss]c nhau (kh[encoding-loss]ng c[encoding-loss]n chi ti[encoding-loss]t [encoding-loss]
h[encoding-loss]a, ch[encoding-loss] c[encoding-loss]n field m[encoding-loss] t[encoding-loss] [encoding-loss]i: "C[encoding-loss]ng T[encoding-loss]ng M[encoding-loss]n uy nghi[encoding-loss]m" vs "Tr[encoding-loss]i l[encoding-loss]n xi[encoding-loss]u v[encoding-loss]o c[encoding-loss]a s[encoding-loss]n t[encoding-loss]c" vs "T[encoding-loss]n
t[encoding-loss]ch hoang ph[encoding-loss] kh[encoding-loss]ng ng[encoding-loss][encoding-loss]i canh gi[encoding-loss]")  [encoding-loss]c m[encoding-loss] t[encoding-loss] node l[encoding-loss] bi[encoding-loss]t ngay t[encoding-loss]nh ch[encoding-loss]t khu v[encoding-loss]c.

### 6.3. B[encoding-loss]ng Tin Faction (Bulletin Board) t[encoding-loss]i node Faction s[encoding-loss] h[encoding-loss]u
Hi[encoding-loss]n danh s[encoding-loss]ch `faction_daily` quest hi[encoding-loss]n t[encoding-loss]i C[encoding-loss]A FACTION [encoding-loss] ngay khi player v[encoding-loss]o node (kh[encoding-loss]ng c[encoding-loss]n
t[encoding-loss]m NPC c[encoding-loss] th[encoding-loss] m[encoding-loss]i th[encoding-loss]y quest)  [encoding-loss]ng th[encoding-loss]i hi[encoding-loss]n "Tin T[encoding-loss]c V[encoding-loss]ng" (world event g[encoding-loss]n [encoding-loss]y li[encoding-loss]n quan
Faction n[encoding-loss]y: th[encoding-loss]ng/thua tr[encoding-loss]n n[encoding-loss]o, B[encoding-loss] C[encoding-loss]nh n[encoding-loss]o s[encoding-loss]p m[encoding-loss])  bi[encoding-loss]n node Faction th[encoding-loss]nh i[encoding-loss]m TH[encoding-loss]NG TIN
trung t[encoding-loss]m, kh[encoding-loss]ng ch[encoding-loss] i[encoding-loss]m giao d[encoding-loss]ch/nhi[encoding-loss]m v[encoding-loss].

---

## 7. S[encoding-loss][encoding-loss]NG M[encoding-loss] CHI[encoding-loss]N TRANH  4 C[encoding-loss]P [encoding-loss] (thay v[encoding-loss] ch[encoding-loss] discovered=true/false)

| C[encoding-loss]p | T[encoding-loss]n | i[encoding-loss]u ki[encoding-loss]n | Hi[encoding-loss]n th[encoding-loss] |
|---|---|---|---|
| 0 | Ch[encoding-loss]a Bi[encoding-loss]t | Ch[encoding-loss]a t[encoding-loss]ng nghe n[encoding-loss]i | "Ch[encoding-loss]a kh[encoding-loss]m ph[encoding-loss]" (nh[encoding-loss] hi[encoding-loss]n t[encoding-loss]i) |
| 1 | Nghe [encoding-loss]n | NPC t[encoding-loss]i node l[encoding-loss]n c[encoding-loss]n nh[encoding-loss]c t[encoding-loss]i (qua h[encoding-loss]i tho[encoding-loss]i/B[encoding-loss]ng Tin m[encoding-loss]c 6.3) NH[encoding-loss]NG ch[encoding-loss]a t[encoding-loss]i | Hi[encoding-loss]n T[encoding-loss]N node (kh[encoding-loss]ng c[encoding-loss]n [encoding-loss]n ho[encoding-loss]n to[encoding-loss]n) + m[encoding-loss] t[encoding-loss] m[encoding-loss] h[encoding-loss] 1 c[encoding-loss]u, v[encoding-loss] tr[encoding-loss] g[encoding-loss]n [encoding-loss]ng tr[encoding-loss]n L[encoding-loss]p 1 nh[encoding-loss]ng KH[encoding-loss]NG hi[encoding-loss]n tr[encoding-loss]n L[encoding-loss]p 2 grid ch[encoding-loss]nh x[encoding-loss]c |
| 2 | [encoding-loss] Kh[encoding-loss]m Ph[encoding-loss] | [encoding-loss] t[encoding-loss]ng t[encoding-loss]i | [encoding-loss]y [encoding-loss] nh[encoding-loss] thi[encoding-loss]t k[encoding-loss] g[encoding-loss]c |
| 3 | Th[encoding-loss]ng Thu[encoding-loss]c | T[encoding-loss]i >= 5 l[encoding-loss]n HO[encoding-loss]C c[encoding-loss] Tr[encoding-loss]m/[encoding-loss]ng Ph[encoding-loss] t[encoding-loss]i [encoding-loss]y | M[encoding-loss] th[encoding-loss]m: nh[encoding-loss]n th[encoding-loss]y `subLocations` (L[encoding-loss]p 3) NGAY T[encoding-loss] L[encoding-loss]p 2 kh[encoding-loss]ng c[encoding-loss]n b[encoding-loss]m v[encoding-loss]o, v[encoding-loss] th[encoding-loss]y `influenceMap` chi ti[encoding-loss]t (kh[encoding-loss]ng ch[encoding-loss] ch[encoding-loss] s[encoding-loss] h[encoding-loss]u ch[encoding-loss]nh) |

C[encoding-loss]p 1 "Nghe [encoding-loss]n" l[encoding-loss] b[encoding-loss] sung M[encoding-loss]I quan tr[encoding-loss]ng  gi[encoding-loss]i quy[encoding-loss]t c[encoding-loss]m gi[encoding-loss]c th[encoding-loss] gi[encoding-loss]i m[encoding-loss] hi[encoding-loss]n t[encoding-loss]i "ho[encoding-loss]c bi[encoding-loss]t 100%
ho[encoding-loss]c kh[encoding-loss]ng bi[encoding-loss]t g[encoding-loss]" kh[encoding-loss] c[encoding-loss]ng, gi[encoding-loss] c[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i trung gian t[encoding-loss]o [encoding-loss]ng l[encoding-loss]c TH[encoding-loss]T S[encoding-loss] mu[encoding-loss]n i t[encoding-loss]i ([encoding-loss]
nghe t[encoding-loss]n, t[encoding-loss] m[encoding-loss] mu[encoding-loss]n x[encoding-loss]c nh[encoding-loss]n) thay v[encoding-loss] random ho[encoding-loss]n to[encoding-loss]n m[encoding-loss] m[encoding-loss].

---

## 8. SCHEMA T[encoding-loss]NG H[encoding-loss]P (c[encoding-loss]p nh[encoding-loss]t `MapNode` [encoding-loss] c[encoding-loss] [encoding-loss] `MAP_SYSTEM.md` m[encoding-loss]c 1 v[encoding-loss] 6.7)

```
### 8.1. Contract th[encoding-loss]c thi b[encoding-loss] sung

**L3 node detail:** m[encoding-loss]i `subLocation` c[encoding-loss] `id`, `type`, `displayName`, `actions`, `capacity`, `visibilityFog`. NPC schedule tr[encoding-loss] `currentSubLocationId`; i[encoding-loss]m [encoding-loss]y ho[encoding-loss]c b[encoding-loss] kh[encoding-loss]a th[encoding-loss] NPC fallback v[encoding-loss] `main`. State machine l[encoding-loss] `outside_node -> entering_node -> inside_sub_location -> leaving_node`. Chuy[encoding-loss]n i[encoding-loss]m trong c[encoding-loss]ng node kh[encoding-loss]ng roll encounter; action lu[encoding-loss]n g[encoding-loss]i `nodeId + subLocationId` nh[encoding-loss]ng save gi[encoding-loss] hai field t[encoding-loss]ch bi[encoding-loss]t.

**Influence/heatmap:** influence l[encoding-loss] derived state, cache theo `worldTick + factionVersion + structureVersion + eventVersion` v[encoding-loss] ph[encoding-loss]i rebuild deterministic. BFS t[encoding-loss] faction home nodes, c[encoding-loss]ng th[encoding-loss]c `power * 0.70^distance * (1 + structureBonus + eventBonus + outpostBonus)`, clamp `[0,100]`. `stable` khi top >=35 v[encoding-loss] margin >=15%; `contested` khi top-two margin <15%; c[encoding-loss]n l[encoding-loss]i `frontier`. Heatmap kh[encoding-loss]ng [encoding-loss][encoding-loss]c suy lu[encoding-loss]n owner [encoding-loss] fog 0.

**Fog 03:** discovery event chu[encoding-loss]n `{ nodeId, level, source, actorId, tick }`; reducer [encoding-loss]p d[encoding-loss]ng max level v[encoding-loss] idempotent journal. Rumor=1, visit=2, survey/outpost/waystation=3. `revealAdjacentNodes` ch[encoding-loss] n[encoding-loss]ng t[encoding-loss]i a m[encoding-loss]t c[encoding-loss]p, kh[encoding-loss]ng spoil sub-location.

**Outpost/structures:** claim theo `preview -> establish -> maintain`. Preview kh[encoding-loss]ng mutate; establish tr[encoding-loss] cost m[encoding-loss]t l[encoding-loss]n v[encoding-loss] t[encoding-loss]o `outpostId`; maintain tr[encoding-loss] upkeep m[encoding-loss]i world tick, integrity v[encoding-loss] 0 th[encoding-loss] v[encoding-loss] hi[encoding-loss]u h[encoding-loss]a ch[encoding-loss] kh[encoding-loss]ng x[encoding-loss]a l[encoding-loss]ch s[encoding-loss]. Structure c[encoding-loss] `level`, `integrity`, `upkeep`, `effects`, `builtBy`; kh[encoding-loss]ng tr[encoding-loss]ng type trong node, t[encoding-loss]i a ba structure.

**Weighted travel:** task c[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i `planned | active | interrupted | completed | cancelled`, snapshot kh[encoding-loss]a route, distance, ETA, risk seed, escort v[encoding-loss] cost. M[encoding-loss]i ng[encoding-loss]y roll b[encoding-loss]ng `taskId + dayIndex` [encoding-loss] retry idempotent. Escort c[encoding-loss] `riskReduction`, `dailyCost`, `canFlee`. Fast travel c[encoding-loss]n unlock hai [encoding-loss]u, kh[encoding-loss]ng combat/instance, kh[encoding-loss]ng road event nh[encoding-loss]ng v[encoding-loss]n ghi travel log.

**Patrol/bulletin:** patrol l[encoding-loss] projection tr[encoding-loss]n edge `{ patrolCount, factionId, threat, nextTransitionTick }`, kh[encoding-loss]ng t[encoding-loss]o node m[encoding-loss]i. Bulletin t[encoding-loss]i a ba tin, c[encoding-loss] `requiredFog`, `expiresAt`, `actionId`; filter tr[encoding-loss][encoding-loss]c khi render.

**Transaction resolver:** m[encoding-loss]i map mutation ch[encoding-loss]y qua `resolveMapTransaction({ actionId, actorId, expectedVersion, validate, apply, rollback })` v[encoding-loss] tr[encoding-loss] `{ success, reason, data, transactionId, stateVersion }`. Version check, cost/permission/fog check, journal v[encoding-loss] rollback l[encoding-loss] b[encoding-loss]t bu[encoding-loss]c. Idempotency key g[encoding-loss]m `actionId + actorId + inputHash`.

**Acceptance tests:** L3 [encoding-loss]ng NPC/action; influence BFS v[encoding-loss] contested threshold; fog migration/privacy; outpost thi[encoding-loss]u cost/maintenance; travel retry/interruption/fast travel; patrol edge v[encoding-loss] bulletin expiry; rollback khi mutation gi[encoding-loss]a ch[encoding-loss]ng.

MapNode {
  ...(gi[encoding-loss] nguy[encoding-loss]n to[encoding-loss]n b[encoding-loss] field ci: id, nodeType, regionTag, x, y, isProcedural, dangerLevel,
      linhKhiDensity, eventPoolTag, cooldownUntil, claimedByPlayerId)...

  fogState: 0-3,                          // thay th[encoding-loss] `discovered: boolean` ci (m[encoding-loss]c 7)
  influenceMap: { factionId: number },     // thay th[encoding-loss] `ownerFactionId` t)nh (m[encoding-loss]c 3.1)  ownerFactionId
                                            // gi[encoding-loss] l[encoding-loss] GETTER t[encoding-loss]nh t[encoding-loss] influenceMap, kh[encoding-loss]ng l[encoding-loss]u tr[encoding-loss]c ti[encoding-loss]p
  subLocations: NodeDetailLayout | null,    // null n[encoding-loss]u node qu[encoding-loss] nh[encoding-loss] [encoding-loss] c[encoding-loss]n L[encoding-loss]p 3 (m[encoding-loss]c 2)
  patrolSchedule: [{ npcId, fromNode, toNode, cycleHours }],  // m[encoding-loss]c 6.1
  playerStructures: [{ type, builtByCharacterId, builtAt }],   // m[encoding-loss]c 4.2
  fastTravelUnlocked: boolean,              // m[encoding-loss]c 5.2
}
```

---

## 9. VI[encoding-loss]C C[encoding-loss]N L[encoding-loss]M TI[encoding-loss]P ([encoding-loss]u ti[encoding-loss]n  [encoding-loss]y l[encoding-loss] redesign l[encoding-loss]n, KH[encoding-loss]NG l[encoding-loss]m h[encoding-loss]t c[encoding-loss]ng l[encoding-loss]c)
1. **L[encoding-loss]m tr[encoding-loss][encoding-loss]c ti[encoding-loss]n:** m[encoding-loss]c 3.1 (influence gradient thay `ownerFactionId` t)nh)  m[encoding-loss]i m[encoding-loss]c kh[encoding-loss]c (3.2,
   4, 6) [encoding-loss]u ph[encoding-loss] thu[encoding-loss]c d[encoding-loss] li[encoding-loss]u n[encoding-loss]y t[encoding-loss]n t[encoding-loss]i tr[encoding-loss][encoding-loss]c.
2. **L[encoding-loss]m th[encoding-loss] hai:** m[encoding-loss]c 7 (4 c[encoding-loss]p s[encoding-loss][encoding-loss]ng m[encoding-loss])  [encoding-loss]c l[encoding-loss]p t[encoding-loss][encoding-loss]ng [encoding-loss]i, c[encoding-loss]i thi[encoding-loss]n c[encoding-loss]m gi[encoding-loss]c kh[encoding-loss]m ph[encoding-loss] ngay l[encoding-loss]p
   t[encoding-loss]c m[encoding-loss] kh[encoding-loss]ng c[encoding-loss]n ch[encoding-loss] m[encoding-loss]c 1 xong.
3. **L[encoding-loss]m th[encoding-loss] ba:** m[encoding-loss]c 2 (L[encoding-loss]p 3 Node Detail)  c[encoding-loss]n nhi[encoding-loss]u n[encoding-loss]i dung th[encoding-loss] c[encoding-loss]ng h[encoding-loss]n ([encoding-loss]t NPC v[encoding-loss]o [encoding-loss]ng
   subLocation), n[encoding-loss]n l[encoding-loss]m sau khi khung d[encoding-loss] li[encoding-loss]u (m[encoding-loss]c 8) [encoding-loss] [encoding-loss]n [encoding-loss]nh.
4. **L[encoding-loss]m sau c[encoding-loss]ng:** m[encoding-loss]c 4 (Player Map Agency  L[encoding-loss]p Tr[encoding-loss]m/X[encoding-loss]y D[encoding-loss]ng) v[encoding-loss] m[encoding-loss]c 5.2-5.3 (Fast Travel/o[encoding-loss]n
   H[encoding-loss] T[encoding-loss]ng)  [encoding-loss]y l[encoding-loss] t[encoding-loss]nh nng CH[encoding-loss] [encoding-loss]NG ph[encoding-loss]c t[encoding-loss]p nh[encoding-loss]t, c[encoding-loss]n n[encoding-loss]n t[encoding-loss]ng gradient + fog 4 c[encoding-loss]p [encoding-loss]n [encoding-loss]nh
   tr[encoding-loss][encoding-loss]c [encoding-loss] kh[encoding-loss]ng ph[encoding-loss]i s[encoding-loss]a l[encoding-loss]i logic 2 l[encoding-loss]n.
5. Quy[encoding-loss]t [encoding-loss]nh l[encoding-loss]i c[encoding-loss]u h[encoding-loss]i multiplayer c[encoding-loss]n treo ([encoding-loss] nh[encoding-loss]c [encoding-loss] nhi[encoding-loss]u t[encoding-loss]i li[encoding-loss]u tr[encoding-loss][encoding-loss]c)  m[encoding-loss]c 4.1 "L[encoding-loss]p Tr[encoding-loss]m"
   [encoding-loss]c bi[encoding-loss]t c[encoding-loss]n c[encoding-loss]u tr[encoding-loss] l[encoding-loss]i r[encoding-loss] TR[encoding-loss][encoding-loss]C khi code, v[encoding-loss] [encoding-loss] ngh)a "tr[encoding-loss]m c[encoding-loss]a player" kh[encoding-loss]c h[encoding-loss]n n[encoding-loss]u server-wide
   (ng[encoding-loss][encoding-loss]i kh[encoding-loss]c th[encoding-loss]y [encoding-loss][encoding-loss]c/c[encoding-loss] th[encoding-loss] ph[encoding-loss]) vs single-player (ch[encoding-loss] [encoding-loss]nh h[encoding-loss][encoding-loss]ng th[encoding-loss] gi[encoding-loss]i ri[encoding-loss]ng).
---

## AMENDMENT 2026-09-16 — MAP V2/INTERACTION VÀ CÔNG TRÌNH

Map V2 là khoảng trống ưu tiên: influence gradient phải đi qua API canonical; fog, completion, node history, sub-location và travel weighting phải dùng cùng resolver, không đọc các bảng faction rời rạc trực tiếp. UI bản đồ hiển thị influence/completion nhưng không được tự tính lại luật gameplay.

Tab Thế giới sở hữu feature **Công Trình Bản Đồ**. Hai loại công trình người chơi xây dựng là **Truyền Tống Trận** (mở đầu fast travel ở node) và **Hộ Giới Đại Trận** (giảm encounter/curse risk, tăng influence). Alias nội bộ legacy (`waystation`, `ward_formation`) phải được migrate về canonical type (`teleport_array`, `world_ward`) mà không làm mất save cũ. Mọi xây dựng kiểm tra node, trùng công trình, chi phí và ghi node history; không đặt logic này vào Con Đường hay Nghề Ẩn.


### Source: `archive-requirements\logic-history\03-world\MAP_WEATHER_INTEGRATION_TRACE.md`

# Map V2  Weather Integration Trace

## Ph[encoding-loss]m vi

T[encoding-loss]i li[encoding-loss]u n[encoding-loss]y truy v[encoding-loss]t ph[encoding-loss]n th[encoding-loss]i ti[encoding-loss]t [encoding-loss][encoding-loss]c tri[encoding-loss]n khai t[encoding-loss] m[encoding-loss]c 10 c[encoding-loss]a `MAP_SYSTEM_V2_COMPLETE.md`.

## Contract [encoding-loss] tri[encoding-loss]n khai

- B[encoding-loss]y tr[encoding-loss]ng th[encoding-loss]i th[encoding-loss]i ti[encoding-loss]t: `quang`, `mua`, `suong`, `loi_vu`, `linh_phong`, `tuyet`, `am_vu`.
- Weather lan truy[encoding-loss]n theo tuy[encoding-loss]n v[encoding-loss]ng l[encoding-loss]n c[encoding-loss]n, c[encoding-loss] bias t[encoding-loss] th[encoding-loss]i ti[encoding-loss]t nghi[encoding-loss]m tr[encoding-loss]ng c[encoding-loss]a v[encoding-loss]ng k[encoding-loss] b[encoding-loss]n.
- Th[encoding-loss]i ti[encoding-loss]t gi[encoding-loss] [encoding-loss]n [encoding-loss]nh theo `weatherUntilDay`, kh[encoding-loss]ng reroll m[encoding-loss]i frame.
- M[encoding-loss]a tng nguy c[encoding-loss] v[encoding-loss] gi[encoding-loss]m t[encoding-loss]c [encoding-loss]; tuy[encoding-loss]t gi[encoding-loss]m t[encoding-loss]c [encoding-loss] m[encoding-loss]nh; l[encoding-loss]i vi ch[encoding-loss]n ng[encoding-loss] kh[encoding-loss]; [encoding-loss]m vi tng hao t[encoding-loss]n v[encoding-loss] nguy c[encoding-loss].
- Th[encoding-loss]i ti[encoding-loss]t [encoding-loss][encoding-loss]c [encoding-loss]a v[encoding-loss]o travel preview, world modifier, NPC reaction v[encoding-loss] structured game log.
- Khi th[encoding-loss]i ti[encoding-loss]t v[encoding-loss]ng hi[encoding-loss]n t[encoding-loss]i [encoding-loss]i, log ghi l[encoding-loss]i tr[encoding-loss]ng th[encoding-loss]i tr[encoding-loss][encoding-loss]c/sau v[encoding-loss] metadata node, v[encoding-loss]ng, NPC, fog.

## API trace

| API | Vai tr[encoding-loss] |
|---|---|
| `setWeather` | [encoding-loss]p th[encoding-loss]i ti[encoding-loss]t c[encoding-loss] th[encoding-loss]i h[encoding-loss]n |
| `updateWeather` | Sinh th[encoding-loss]i ti[encoding-loss]t deterministic theo v[encoding-loss]ng v[encoding-loss] l[encoding-loss]ng gi[encoding-loss]ng |
| `worldModifierPreview` | Tr[encoding-loss] modifier chi[encoding-loss]n [encoding-loss]u/di chuy[encoding-loss]n/t[encoding-loss]m c[encoding-loss]nh |
| `travelPreview` | T[encoding-loss]nh t[encoding-loss]c [encoding-loss], s[encoding-loss] ng[encoding-loss]y, risk theo th[encoding-loss]i ti[encoding-loss]t |
| `npcWeatherPreview` | D[encoding-loss] b[encoding-loss]o ph[encoding-loss]n [encoding-loss]ng NPC |
| `resolveNpcWeatherReaction` | Commit tr[encoding-loss] [encoding-loss]n/l[encoding-loss]ch tr[encoding-loss]nh/mood |
| `getCurrentRegionViewModel` | Cung c[encoding-loss]p weather cho UI Map |
| `pushHistory/createGameEvent` | Ghi weather, node, NPC, fog v[encoding-loss]o log |

## Acceptance

1. C[encoding-loss]ng seed, c[encoding-loss]ng ng[encoding-loss]y v[encoding-loss] topology cho c[encoding-loss]ng th[encoding-loss]i ti[encoding-loss]t.
2. V[encoding-loss]ng k[encoding-loss] B[encoding-loss]o Linh Kh[encoding-loss]/[encoding-loss]m Vi c[encoding-loss] x[encoding-loss]c su[encoding-loss]t nh[encoding-loss]n weather t[encoding-loss][encoding-loss]ng [encoding-loss]ng cao h[encoding-loss]n.
3. Ng[encoding-loss] kh[encoding-loss] b[encoding-loss] t[encoding-loss] ch[encoding-loss]i khi c[encoding-loss] B[encoding-loss]o Linh Kh[encoding-loss].
4. Tuy[encoding-loss]t v[encoding-loss] M[encoding-loss]a l[encoding-loss]m thay [encoding-loss]i travel days/risk.
5. Weather transition t[encoding-loss]i node ng[encoding-loss][encoding-loss]i ch[encoding-loss]i t[encoding-loss]o log structured, kh[encoding-loss]ng t[encoding-loss]o log l[encoding-loss]p trong c[encoding-loss]ng tick.
6. UI kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] `undefined` khi region thi[encoding-loss]u `description`; d[encoding-loss]ng `desc` ho[encoding-loss]c t[encoding-loss]n v[encoding-loss]ng.


### Source: `archive-requirements\logic-history\03-world\OPEN_WORLD_COSMIC_CONSTELLATION_MAP_REQUIREMENT.md`

# Open-World Cosmic Constellation Map

## B[encoding-loss]n [encoding-loss] V[encoding-loss]n Gi[encoding-loss]i  ph[encoding-loss]n l[encoding-loss]p hi[encoding-loss]n th[encoding-loss] chu[encoding-loss]n

## C[encoding-loss]nh gi[encoding-loss]i t[encoding-loss] ch[encoding-loss]c theo Con [encoding-loss][encoding-loss]ng

- H[encoding-loss] s[encoding-loss] t[encoding-loss] ch[encoding-loss]c kh[encoding-loss]ng [encoding-loss][encoding-loss]c hi[encoding-loss]n th[encoding-loss] c[encoding-loss]nh gi[encoding-loss]i legacy nh[encoding-loss] Luy[encoding-loss]n Kh[encoding-loss], Tr[encoding-loss]c C[encoding-loss], Kim an.
- `guild.highest_realm` ch[encoding-loss] d[encoding-loss]ng l[encoding-loss]m kh[encoding-loss]a t[encoding-loss][encoding-loss]ng th[encoding-loss]ch; UI ph[encoding-loss]i [encoding-loss]nh x[encoding-loss] sang `GameData.REALMS` r[encoding-loss]i d[encoding-loss]ng `PATH_FATE_RELATIONS.path_titles[pathId]`.
- Khi nh[encoding-loss]n v[encoding-loss]t ch[encoding-loss]a ch[encoding-loss]n Con [encoding-loss][encoding-loss]ng, hi[encoding-loss]n th[encoding-loss] Con [encoding-loss][encoding-loss]ng b[encoding-loss]c N thay v[encoding-loss] b[encoding-loss]a t[encoding-loss]n c[encoding-loss]nh gi[encoding-loss]i.
- i[encoding-loss]u ki[encoding-loss]n gia nh[encoding-loss]p ph[encoding-loss]i di[encoding-loss]n gi[encoding-loss]i b[encoding-loss]ng t[encoding-loss]n c[encoding-loss]nh gi[encoding-loss]i Con [encoding-loss][encoding-loss]ng t[encoding-loss][encoding-loss]ng [encoding-loss]ng v[encoding-loss]i `minRealm`, kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] d[encoding-loss]ng s[encoding-loss] tr[encoding-loss] khi d[encoding-loss]ng trong tooltip k[encoding-loss] thu[encoding-loss]t.

## Complete node links v[encoding-loss] sinh node [encoding-loss]nh h[encoding-loss][encoding-loss]ng

## Node pool h[encoding-loss]p nh[encoding-loss]t

- `WORLD_MAP.nodePool` l[encoding-loss] registry duy nh[encoding-loss]t cho [encoding-loss]a danh, t[encoding-loss] ch[encoding-loss]c, ph[encoding-loss][encoding-loss]ng th[encoding-loss], th[encoding-loss]nh tr[encoding-loss]n, th[encoding-loss]n, b[encoding-loss]n t[encoding-loss]u, tr[encoding-loss]m d[encoding-loss]ch v[encoding-loss] v[encoding-loss]ng hoang d[encoding-loss] runtime.
- Node runtime kh[encoding-loss]ng d[encoding-loss]ng t[encoding-loss]n t[encoding-loss]a [encoding-loss] d[encoding-loss]ng `Bng Nguy[encoding-loss]n -1`; t[encoding-loss]n ph[encoding-loss]i l[encoding-loss]y t[encoding-loss] pool c[encoding-loss]nh quan theo v[encoding-loss]ng v[encoding-loss] lo[encoding-loss]i [encoding-loss]a h[encoding-loss]nh.
- M[encoding-loss]i node l[encoding-loss]u k[encoding-loss]m `npcs`, `enemies`, `organizationId` v[encoding-loss] `mapNodeType` [encoding-loss] NPC/qu[encoding-loss]i, t[encoding-loss] ch[encoding-loss]c v[encoding-loss] th[encoding-loss]m hi[encoding-loss]m c[encoding-loss]ng [encoding-loss]c m[encoding-loss]t ngu[encoding-loss]n d[encoding-loss] li[encoding-loss]u.
- Khi sinh node m[encoding-loss]i, engine ghi node v[encoding-loss]o c[encoding-loss] `LOCATIONS`, `openWorld.nodes` v[encoding-loss] `WORLD_MAP.nodePool`.

- M[encoding-loss]i node khi [encoding-loss][encoding-loss]c n[encoding-loss]p ph[encoding-loss]i c[encoding-loss] [encoding-loss] b[encoding-loss]n h[encoding-loss][encoding-loss]ng B[encoding-loss]c/Nam/[encoding-loss]ng/T[encoding-loss]y.
- N[encoding-loss]u catalog thi[encoding-loss]u h[encoding-loss][encoding-loss]ng, engine sinh node runtime k[encoding-loss] c[encoding-loss]n ngay t[encoding-loss]i th[encoding-loss]i i[encoding-loss]m resolve topology v[encoding-loss] ghi reciprocal link.
- Node runtime m[encoding-loss]i lu[encoding-loss]n gi[encoding-loss] li[encoding-loss]n k[encoding-loss]t quay v[encoding-loss] node sinh ra; c[encoding-loss]c h[encoding-loss][encoding-loss]ng c[encoding-loss]n thi[encoding-loss]u ti[encoding-loss]p t[encoding-loss]c [encoding-loss][encoding-loss]c sinh lazy khi ng[encoding-loss][encoding-loss]i ch[encoding-loss]i ch[encoding-loss]n h[encoding-loss][encoding-loss]ng.
- `mapNeighbors()` v[encoding-loss] `mapDistance()` v[encoding-loss]n coi to[encoding-loss]n b[encoding-loss] node l[encoding-loss] complete graph [encoding-loss] travel t[encoding-loss] do gi[encoding-loss]a m[encoding-loss]i node h[encoding-loss]p l[encoding-loss].

- M[encoding-loss]u v[encoding-loss]ng ch[encoding-loss] d[encoding-loss]nh cho node v[encoding-loss]ng ch[encoding-loss]a nh[encoding-loss]n v[encoding-loss]t (`currentRegionId`); kh[encoding-loss]ng d[encoding-loss]ng cho ghim t[encoding-loss] ch[encoding-loss]c ho[encoding-loss]c node sao t[encoding-loss] ch[encoding-loss]c.
- Ghim t[encoding-loss] ch[encoding-loss]c ph[encoding-loss]i ph[encoding-loss]n m[encoding-loss]u theo alignment/allegiance v[encoding-loss] gi[encoding-loss] k[encoding-loss]ch th[encoding-loss][encoding-loss]c theo `pyramid_tier`.
- Nh[encoding-loss]n t[encoding-loss] ch[encoding-loss]c d[encoding-loss]ng c[encoding-loss]ng m[encoding-loss]u alignment, kh[encoding-loss]ng d[encoding-loss]ng m[encoding-loss]u v[encoding-loss]ng m[encoding-loss]c [encoding-loss]nh.
- Sao t[encoding-loss] ch[encoding-loss]c ph[encoding-loss] ch[encoding-loss] l[encoding-loss] l[encoding-loss]p d[encoding-loss]n [encoding-loss][encoding-loss]ng m[encoding-loss], kh[encoding-loss]ng [encoding-loss][encoding-loss]c che ho[encoding-loss]c bi[encoding-loss]n th[encoding-loss]nh tr[encoding-loss]ng th[encoding-loss]i V[encoding-loss]ng hi[encoding-loss]n t[encoding-loss]i.
- Tr[encoding-loss]ng th[encoding-loss]i kh[encoding-loss]m ph[encoding-loss] v[encoding-loss] quy[encoding-loss]n di chuy[encoding-loss]n l[encoding-loss] hai l[encoding-loss]p [encoding-loss]c l[encoding-loss]p: node ch[encoding-loss]a kh[encoding-loss]m ph[encoding-loss] v[encoding-loss]n i [encoding-loss][encoding-loss]c [encoding-loss] backend nh[encoding-loss]ng UI ch[encoding-loss] hi[encoding-loss]n th[encoding-loss] Ch[encoding-loss]a th[encoding-loss]m hi[encoding-loss]m.

## Quy t[encoding-loss]c hi[encoding-loss]n th[encoding-loss] V[encoding-loss]n Gi[encoding-loss]i L[encoding-loss] (b[encoding-loss] sung)

- M[encoding-loss]u v[encoding-loss]ng ch[encoding-loss] d[encoding-loss]nh cho [encoding-loss]ng v[encoding-loss]ng ch[encoding-loss]a `state.locationId`; kh[encoding-loss]ng [encoding-loss][encoding-loss]c [encoding-loss]p d[encoding-loss]ng cho to[encoding-loss]n b[encoding-loss] node.
- Node t[encoding-loss] ch[encoding-loss]c d[encoding-loss]ng m[encoding-loss]u theo `alignment/allegiance`: Ch[encoding-loss]nh [encoding-loss]o xanh lam, Ma/T[encoding-loss] [encoding-loss]o [encoding-loss] t[encoding-loss]m, Trung l[encoding-loss]p t[encoding-loss]m x[encoding-loss]m.
- K[encoding-loss]ch th[encoding-loss][encoding-loss]c ghim t[encoding-loss] ch[encoding-loss]c t[encoding-loss] l[encoding-loss] ngh[encoding-loss]ch v[encoding-loss]i `pyramid_tier` (Tier 1 l[encoding-loss]n nh[encoding-loss]t).
- C[encoding-loss] th[encoding-loss] i l[encoding-loss] quy[encoding-loss]n backend, kh[encoding-loss]ng ph[encoding-loss]i m[encoding-loss]u giao di[encoding-loss]n; frontend ch[encoding-loss] hi[encoding-loss]n th[encoding-loss] ang [encoding-loss] [encoding-loss]y, [encoding-loss] th[encoding-loss]m hi[encoding-loss]m, Ch[encoding-loss]a th[encoding-loss]m hi[encoding-loss]m v[encoding-loss] marker [encoding-loss]n sau Fog.
- Marker Nguy hi[encoding-loss]m, NPC v[encoding-loss] C[encoding-loss] duy[encoding-loss]n ch[encoding-loss] [encoding-loss][encoding-loss]c render khi node [encoding-loss] th[encoding-loss]m hi[encoding-loss]m.
- Zoom, thu nh[encoding-loss], reset v[encoding-loss] pan ph[encoding-loss]i t[encoding-loss]c [encoding-loss]ng l[encoding-loss]n l[encoding-loss]p node hi[encoding-loss]n th[encoding-loss], kh[encoding-loss]ng ch[encoding-loss] SVG [encoding-loss][encoding-loss]ng n[encoding-loss]i.

## M[encoding-loss]c ti[encoding-loss]u

L[encoding-loss]p tr[encoding-loss]nh b[encoding-loss]y b[encoding-loss]n [encoding-loss] chuy[encoding-loss]n t[encoding-loss] s[encoding-loss] [encoding-loss] node/edge sang **Thi[encoding-loss]n [encoding-loss] Ch[encoding-loss]m Sao**. D[encoding-loss] li[encoding-loss]u n[encoding-loss]n kh[encoding-loss]ng thay [encoding-loss]i: gi[encoding-loss] nguy[encoding-loss]n ID [encoding-loss]a i[encoding-loss]m, v[encoding-loss]ng, route, fog, visited, locked, v[encoding-loss] tr[encoding-loss] nh[encoding-loss]n v[encoding-loss]t, travel v[encoding-loss] action.

## [encoding-loss]u ti[encoding-loss]n tri[encoding-loss]n khai: Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i

`Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i` l[encoding-loss] m[encoding-loss]n h[encoding-loss]nh m[encoding-loss]c [encoding-loss]nh [encoding-loss] ng[encoding-loss][encoding-loss]i ch[encoding-loss]i ra quy[encoding-loss]t [encoding-loss]nh. M[encoding-loss]i thay [encoding-loss]i v[encoding-loss] map ph[encoding-loss]i [encoding-loss][encoding-loss]c [encoding-loss]p d[encoding-loss]ng [encoding-loss] [encoding-loss]y tr[encoding-loss][encoding-loss]c khi m[encoding-loss] r[encoding-loss]ng sang V[encoding-loss]n Gi[encoding-loss]i L[encoding-loss]. Local map ph[encoding-loss]i d[encoding-loss]ng c[encoding-loss]ng ng[encoding-loss]n ng[encoding-loss] ch[encoding-loss]m sao nh[encoding-loss]ng m[encoding-loss]t [encoding-loss] th[encoding-loss]ng tin cao h[encoding-loss]n World Map:

- Sao hi[encoding-loss]n t[encoding-loss]i, sao l[encoding-loss]n c[encoding-loss]n v[encoding-loss] c[encoding-loss]c route c[encoding-loss] th[encoding-loss] i.
- Sub-location, NPC hi[encoding-loss]n di[encoding-loss]n, patrol edge, weather, influence v[encoding-loss] incident t[encoding-loss]i node.
- Fog/visited/locked [encoding-loss]p d[encoding-loss]ng tr[encoding-loss][encoding-loss]c khi t[encoding-loss]o label ho[encoding-loss]c action.
- Travel active/restricted/blocked hi[encoding-loss]n th[encoding-loss] ngay c[encoding-loss]nh route.
- Th[encoding-loss]m Hi[encoding-loss]m, bulletin, c[encoding-loss]ng tr[encoding-loss]nh v[encoding-loss] thao t[encoding-loss]c NPC ph[encoding-loss]i m[encoding-loss] t[encoding-loss] local map m[encoding-loss] kh[encoding-loss]ng c[encoding-loss]n chuy[encoding-loss]n tab.
- World Map ch[encoding-loss] cung c[encoding-loss]p b[encoding-loss]i c[encoding-loss]nh v) m[encoding-loss]; kh[encoding-loss]ng [encoding-loss][encoding-loss]c ghi [encoding-loss] node/region/weather ang hi[encoding-loss]n th[encoding-loss] [encoding-loss] local map.

## Kh[encoding-loss]ng gian hi[encoding-loss]n th[encoding-loss]

- Canvas l[encoding-loss]n h[encoding-loss]n viewport, c[encoding-loss] kho[encoding-loss]ng tr[encoding-loss]ng c[encoding-loss] ch[encoding-loss] [encoding-loss]ch v[encoding-loss] c[encoding-loss]m gi[encoding-loss]c th[encoding-loss] gi[encoding-loss]i v[encoding-loss] t[encoding-loss]n.
- B[encoding-loss]n [encoding-loss] d[encoding-loss]ng n[encoding-loss]n tinh v[encoding-loss]n xanh en, [encoding-loss]nh sao xanh/tr[encoding-loss]ng, i[encoding-loss]m v[encoding-loss]ng cho [encoding-loss]a danh quan tr[encoding-loss]ng, t[encoding-loss]m/[encoding-loss] cho v[encoding-loss]ng nguy hi[encoding-loss]m.
- V[encoding-loss]ng ch[encoding-loss] l[encoding-loss] kh[encoding-loss] quy[encoding-loss]n/tinh v[encoding-loss]n v[encoding-loss] c[encoding-loss]m sao, kh[encoding-loss]ng ph[encoding-loss]i khung ch[encoding-loss] nh[encoding-loss]t hay panel.
- V[encoding-loss] tr[encoding-loss] [encoding-loss][encoding-loss]c bi[encoding-loss]u di[encoding-loss]n b[encoding-loss]ng sao; ng[encoding-loss][encoding-loss]i ch[encoding-loss]i l[encoding-loss] sao s[encoding-loss]ng nh[encoding-loss]t c[encoding-loss] qu[encoding-loss]ng xung [encoding-loss]ng.

## Ch[encoding-loss]m sao v[encoding-loss] m[encoding-loss]c chi ti[encoding-loss]t

- Cosmic view: ch[encoding-loss] hi[encoding-loss]n v[encoding-loss]ng l[encoding-loss]n v[encoding-loss] sao quan tr[encoding-loss]ng.
- Region view: hi[encoding-loss]n c[encoding-loss]m sao, th[encoding-loss]nh tr[encoding-loss], t[encoding-loss]ng m[encoding-loss]n v[encoding-loss] route [encoding-loss] kh[encoding-loss]m ph[encoding-loss].
- Local view: hi[encoding-loss]n node, NPC, dungeon v[encoding-loss] [encoding-loss][encoding-loss]ng g[encoding-loss]n.
- Close view: hi[encoding-loss]n nh[encoding-loss]n, sub-location, NPC v[encoding-loss] t[encoding-loss][encoding-loss]ng t[encoding-loss]c chi ti[encoding-loss]t.
- Nh[encoding-loss]n ch[encoding-loss] hi[encoding-loss]n khi hover, selected, current, nearby ho[encoding-loss]c important.
- Route l[encoding-loss] [encoding-loss][encoding-loss]ng m[encoding-loss]nh, m[encoding-loss], kh[encoding-loss]ng mii t[encoding-loss]n; gi[encoding-loss]m [encoding-loss] [encoding-loss]u ti[encoding-loss]n so v[encoding-loss]i sao.

## Discovery/Fog

- Unexplored: sao m[encoding-loss], kh[encoding-loss]ng nh[encoding-loss]n, route [encoding-loss]n.
- Discovered: sao s[encoding-loss]ng h[encoding-loss]n, route l[encoding-loss]n c[encoding-loss]n hi[encoding-loss]n.
- Visited: marker b[encoding-loss]n v[encoding-loss]ng v[encoding-loss] glow m[encoding-loss]nh h[encoding-loss]n.
- Locked: sao t[encoding-loss]i, route r[encoding-loss]t m[encoding-loss] v[encoding-loss] bi[encoding-loss]u t[encoding-loss][encoding-loss]ng kh[encoding-loss]a t[encoding-loss]y ng[encoding-loss] c[encoding-loss]nh.
- Discovery ph[encoding-loss]i t[encoding-loss]o c[encoding-loss]m gi[encoding-loss]c t[encoding-loss]ng m[encoding-loss]nh ch[encoding-loss]m sao [encoding-loss][encoding-loss]c n[encoding-loss]i l[encoding-loss]i, kh[encoding-loss]ng ph[encoding-loss]i m[encoding-loss] m[encoding-loss]t [encoding-loss] l[encoding-loss][encoding-loss]i.

## Camera v[encoding-loss] i[encoding-loss]u h[encoding-loss][encoding-loss]ng

- Zoom in/out, center-on-player, drag-to-pan v[encoding-loss] focus m[encoding-loss]m tr[encoding-loss]n sao [encoding-loss][encoding-loss]c ch[encoding-loss]n.
- Kh[encoding-loss]ng t[encoding-loss] [encoding-loss]ng fit to[encoding-loss]n b[encoding-loss] th[encoding-loss] gi[encoding-loss]i v[encoding-loss]o viewport.
- Zoom ph[encoding-loss]i c[encoding-loss] level-of-detail: xa [encoding-loss]n nh[encoding-loss]n/route, g[encoding-loss]n hi[encoding-loss]n chi ti[encoding-loss]t.
- Travel v[encoding-loss]n d[encoding-loss]ng route v[encoding-loss] transaction resolver hi[encoding-loss]n t[encoding-loss]i; giao di[encoding-loss]n m[encoding-loss]i ch[encoding-loss] thay visualization.

## Phenomena v[encoding-loss] t[encoding-loss][encoding-loss]ng t[encoding-loss]c

- Weather, influence, faction blockade, patrol, incident v[encoding-loss] NPC presence [encoding-loss][encoding-loss]c th[encoding-loss] hi[encoding-loss]n b[encoding-loss]ng m[encoding-loss]u/glow/icon ph[encoding-loss].
- V[encoding-loss]ng Linh Phong, [encoding-loss]m Vi, c[encoding-loss]m [encoding-loss]a v[encoding-loss] di t[encoding-loss]ch c[encoding-loss] c[encoding-loss] bi[encoding-loss]n th[encoding-loss] tinh v[encoding-loss]n/[encoding-loss][encoding-loss]ng [encoding-loss]t nh[encoding-loss].
- Ch[encoding-loss]n sao m[encoding-loss] Current Region View Model, bulletin, weather, NPC, sub-location v[encoding-loss] action h[encoding-loss]p l[encoding-loss].

## Hi[encoding-loss]u nng

- [encoding-loss]u ti[encoding-loss]n SVG t[encoding-loss]i [encoding-loss]u ho[encoding-loss]c Canvas; decorative stars t[encoding-loss]ch kh[encoding-loss]i gameplay stars.
- Kh[encoding-loss]ng t[encoding-loss]o panel DOM n[encoding-loss]ng cho m[encoding-loss]i [encoding-loss]a i[encoding-loss]m.
- Ch[encoding-loss] render label v[encoding-loss] connection theo zoom/fog.

## Ti[encoding-loss]u ch[encoding-loss] nghi[encoding-loss]m thu

- Kh[encoding-loss]ng c[encoding-loss]n c[encoding-loss]m gi[encoding-loss]c flowchart ho[encoding-loss]c b[encoding-loss]ng node-card.
- V[encoding-loss]ng hi[encoding-loss]n t[encoding-loss]i, weather, NPC v[encoding-loss] travel kh[encoding-loss]p c[encoding-loss]ng m[encoding-loss]t node/region source.
- Zoom/center ho[encoding-loss]t [encoding-loss]ng, kh[encoding-loss]ng l[encoding-loss]m m[encoding-loss]t click v[encoding-loss]o sao ho[encoding-loss]c faction.
- Save ci load nguy[encoding-loss]n tr[encoding-loss]ng v[encoding-loss] t[encoding-loss]t c[encoding-loss] action/travel ci v[encoding-loss]n ch[encoding-loss]y.

## UX chi ti[encoding-loss]t

### Thanh c[encoding-loss]ng c[encoding-loss] b[encoding-loss]n [encoding-loss]

- N[encoding-loss]t `>` [encoding-loss]a camera v[encoding-loss] sao c[encoding-loss]a nh[encoding-loss]n v[encoding-loss]t, reset zoom v[encoding-loss] pan.
- N[encoding-loss]t `/` thay [encoding-loss]i zoom theo b[encoding-loss][encoding-loss]c 0.2, gi[encoding-loss]i h[encoding-loss]n 0.72.4 [encoding-loss] kh[encoding-loss]ng m[encoding-loss]t kh[encoding-loss] nng [encoding-loss]nh h[encoding-loss][encoding-loss]ng.
- K[encoding-loss]o n[encoding-loss]n b[encoding-loss]ng chu[encoding-loss]t/touch [encoding-loss] pan; k[encoding-loss]o kh[encoding-loss]ng [encoding-loss][encoding-loss]c k[encoding-loss]ch ho[encoding-loss]t khi b[encoding-loss]t [encoding-loss]u tr[encoding-loss]n n[encoding-loss]t, faction pin ho[encoding-loss]c star.
- Hi[encoding-loss]n th[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i zoom v[encoding-loss] t[encoding-loss]a [encoding-loss] v[encoding-loss]ng trong tooltip h[encoding-loss] tr[encoding-loss] ng[encoding-loss][encoding-loss]i ch[encoding-loss]i ki[encoding-loss]m so[encoding-loss]t camera.
- N[encoding-loss]t c[encoding-loss] `aria-label`, focus-visible v[encoding-loss] t[encoding-loss][encoding-loss]ng ph[encoding-loss]n [encoding-loss] cho n[encoding-loss]n t[encoding-loss]i.

### Ph[encoding-loss]n h[encoding-loss]i khi ch[encoding-loss]n sao

- Hover: tng glow, hi[encoding-loss]n t[encoding-loss]n v[encoding-loss] lo[encoding-loss]i sao.
- Focus/keyboard: h[encoding-loss]nh vi gi[encoding-loss]ng hover, Enter m[encoding-loss] h[encoding-loss] s[encoding-loss] v[encoding-loss]ng.
- Current star: halo nh[encoding-loss]p ch[encoding-loss]m, kh[encoding-loss]ng nh[encoding-loss]p nh[encoding-loss]y qu[encoding-loss] nhanh g[encoding-loss]y m[encoding-loss]i m[encoding-loss]t.
- Event/war/patrol: d[encoding-loss]ng badge nh[encoding-loss] ho[encoding-loss]c m[encoding-loss]u ph[encoding-loss], kh[encoding-loss]ng thay [encoding-loss]i h[encoding-loss]nh d[encoding-loss]ng sao qu[encoding-loss] m[encoding-loss]nh.
- Faction pin v[encoding-loss] guild pin m[encoding-loss] h[encoding-loss] s[encoding-loss] ri[encoding-loss]ng, kh[encoding-loss]ng di chuy[encoding-loss]n camera ngo[encoding-loss]i [encoding-loss] mu[encoding-loss]n.

### Level of detail theo zoom

| M[encoding-loss]c | Hi[encoding-loss]n th[encoding-loss] | [encoding-loss]n |
|---|---|---|
| 0.71.0 Cosmic | v[encoding-loss]ng l[encoding-loss]n, sao quan tr[encoding-loss]ng, tinh v[encoding-loss]n | nh[encoding-loss]n th[encoding-loss][encoding-loss]ng, route xa |
| 1.01.5 Region | c[encoding-loss]m ch[encoding-loss]m sao, route trong v[encoding-loss]ng, faction | chi ti[encoding-loss]t sub-location |
| 1.52.0 Local | location [encoding-loss] kh[encoding-loss]m ph[encoding-loss], NPC/patrol, weather | d[encoding-loss] li[encoding-loss]u fog ch[encoding-loss]a [encoding-loss] |
| 2.02.4 Close | nh[encoding-loss]n g[encoding-loss]n, bulletin, sub-location, action | decorative star kh[encoding-loss]ng t[encoding-loss][encoding-loss]ng t[encoding-loss]c |

### Tr[encoding-loss]ng th[encoding-loss]i travel

- Sao [encoding-loss]ch [encoding-loss][encoding-loss]c [encoding-loss]nh d[encoding-loss]u `selected`, route ang i c[encoding-loss] glow m[encoding-loss]nh v[encoding-loss] progress.
- Khi travel active, c[encoding-loss]c n[encoding-loss]t travel kh[encoding-loss]c b[encoding-loss] disable v[encoding-loss]i l[encoding-loss] do r[encoding-loss] r[encoding-loss]ng.
- Khi b[encoding-loss] blockade/restricted/weather hazard, route d[encoding-loss]ng m[encoding-loss]u c[encoding-loss]nh b[encoding-loss]o v[encoding-loss] tooltip gi[encoding-loss]i th[encoding-loss]ch nguy[encoding-loss]n nh[encoding-loss]n.
- Khi [encoding-loss]n n[encoding-loss]i, camera focus m[encoding-loss]m v[encoding-loss]o sao m[encoding-loss]i, fog tng theo contract v[encoding-loss] log ghi node/region/weather.

### T[encoding-loss][encoding-loss]ng t[encoding-loss]c v[encoding-loss]i NPC

- Sao location c[encoding-loss] NPC hi[encoding-loss]n di[encoding-loss]n d[encoding-loss]ng halo nh[encoding-loss]; s[encoding-loss] NPC kh[encoding-loss]ng thay th[encoding-loss] t[encoding-loss]n location.
- Hover/close view hi[encoding-loss]n th[encoding-loss] NPC ang [encoding-loss] node/sub-location, schedule, faction v[encoding-loss] ph[encoding-loss]n [encoding-loss]ng weather.
- NPC patrol hi[encoding-loss]n th[encoding-loss] icon tr[encoding-loss]n constellation edge; NPC d[encoding-loss]n [encoding-loss][encoding-loss]ng m[encoding-loss] nhanh action Th[encoding-loss]m Hi[encoding-loss]m.
- Encounter/incident t[encoding-loss]o pulse m[encoding-loss]u cam/[encoding-loss] trong th[encoding-loss]i gian h[encoding-loss]u h[encoding-loss]n; click m[encoding-loss] l[encoding-loss]a ch[encoding-loss]n, kh[encoding-loss]ng t[encoding-loss] th[encoding-loss]c hi[encoding-loss]n action.

### Kh[encoding-loss] nng [encoding-loss]c v[encoding-loss] hi[encoding-loss]u nng

- Kh[encoding-loss]ng d[encoding-loss]ng m[encoding-loss]u l[encoding-loss] t[encoding-loss]n hi[encoding-loss]u duy nh[encoding-loss]t: lu[encoding-loss]n k[encoding-loss]t h[encoding-loss]p glow, icon, nh[encoding-loss]n ho[encoding-loss]c tooltip.
- Decorative star ph[encoding-loss]i n[encoding-loss]m l[encoding-loss]p ri[encoding-loss]ng v[encoding-loss]i gameplay star [encoding-loss] kh[encoding-loss]ng ch[encoding-loss]n click.
- Khi h[encoding-loss]n 500 location, ch[encoding-loss] render star trong viewport c[encoding-loss]ng v[encoding-loss]ng [encoding-loss]m; route xa chuy[encoding-loss]n sang batch SVG/Canvas.
- Debounce camera update v[encoding-loss] kh[encoding-loss]ng render l[encoding-loss]i to[encoding-loss]n b[encoding-loss] panel khi ch[encoding-loss] thay [encoding-loss]i pan.
- B[encoding-loss]n [encoding-loss] ph[encoding-loss]i ho[encoding-loss]t [encoding-loss]ng [encoding-loss] m[encoding-loss]n h[encoding-loss]nh nh[encoding-loss]: controls c[encoding-loss] [encoding-loss]nh g[encoding-loss]c, star label kh[encoding-loss]ng tr[encoding-loss]n viewport.

## Marker b[encoding-loss]t bu[encoding-loss]c tr[encoding-loss]n Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i

- `_ NPC`: t[encoding-loss]ng h[encoding-loss]p NPC static v[encoding-loss] NPC runtime ang s[encoding-loss]ng t[encoding-loss]i node, ch[encoding-loss] hi[encoding-loss]n t[encoding-loss] Fog 2.
- `  Qu[encoding-loss]i`: qu[encoding-loss]i/[encoding-loss]ch [encoding-loss][encoding-loss]c [encoding-loss]nh ngh)a t[encoding-loss]i node v[encoding-loss] combat ang di[encoding-loss]n ra [encoding-loss] node hi[encoding-loss]n t[encoding-loss]i.
- `& C[encoding-loss] duy[encoding-loss]n`: pending contested opportunity t[encoding-loss]i [encoding-loss]ng node, c[encoding-loss] glow t[encoding-loss]m v[encoding-loss] kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] sang node kh[encoding-loss]c.
- `=[encoding-loss] Tu[encoding-loss]n tra`: marker n[encoding-loss]m tr[encoding-loss]n edge m[encoding-loss] patrol NPC th[encoding-loss]c s[encoding-loss] ang di chuy[encoding-loss]n.
- Marker l[encoding-loss] l[encoding-loss]p ph[encoding-loss], kh[encoding-loss]ng che sao; tooltip ph[encoding-loss]i ghi s[encoding-loss] l[encoding-loss][encoding-loss]ng v[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i.
- Khi [encoding-loss]i node, marker ph[encoding-loss]i t[encoding-loss]nh l[encoding-loss]i t[encoding-loss] `state.locationId`, `npcState`, `pendingContestedOpportunity` v[encoding-loss] fog m[encoding-loss]i; kh[encoding-loss]ng d[encoding-loss]ng cache UI ci.
## Ch[encoding-loss]nh s[encoding-loss]ch b[encoding-loss]n [encoding-loss] m[encoding-loss] (Open Node Graph)

- Kh[encoding-loss]ng render [encoding-loss][encoding-loss]ng n[encoding-loss]i gi[encoding-loss]a c[encoding-loss]c node; m[encoding-loss]i node h[encoding-loss]p l[encoding-loss] l[encoding-loss] i[encoding-loss]m [encoding-loss]n tr[encoding-loss]c ti[encoding-loss]p.
- Kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] Ch[encoding-loss]a th[encoding-loss]m hi[encoding-loss]m ho[encoding-loss]c m[encoding-loss]u [encoding-loss] Nguy hi[encoding-loss]m; d[encoding-loss]ng marker NPC, qu[encoding-loss]i v[encoding-loss] c[encoding-loss] duy[encoding-loss]n.
- Node sao t[encoding-loss] ch[encoding-loss]c lu[encoding-loss]n enabled, c[encoding-loss] sao ti[encoding-loss]p c[encoding-loss]n ph[encoding-loss].
- Node v[encoding-loss]a kh[encoding-loss]m ph[encoding-loss] [encoding-loss][encoding-loss]c ghi v[encoding-loss]o `visitedLocations` v[encoding-loss] hi[encoding-loss]n th[encoding-loss] tr[encoding-loss]n V[encoding-loss]n Gi[encoding-loss]i.


### Source: `archive-requirements\logic-history\03-world\Xianxin_map.md`

# THẾ GIỚI TIÊN HIỆP — "VẠN GIỚI LỘ" (Tài liệu nền tảng game)

> Tài liệu này mô tả bối cảnh thế giới mở cho game text RPG tiên hiệp: nhiều chủng tộc, hàng trăm tông môn/thế gia/vương triều, tán tu, thế lực hắc đạo, cùng hệ thống stats ngẫu nhiên để sinh (procedural generate) thế lực và nhân vật.

---

## 1. TỔNG QUAN THẾ GIỚI

**Tên thế giới:** Vạn Giới Lộ — một đại lục trung tâm (Trung Vực) bao quanh bởi 4 vực phụ (Đông Hoang, Tây Mạc, Nam Chướng, Bắc Nguyên) và các hải vực, không vực, minh giới rải rác.

- Thế giới **mở**: người chơi có thể đi bất kỳ đâu, tất cả khu vực đều có thể sinh sự kiện/thế lực ngẫu nhiên.
- Linh khí thiên địa không đồng đều → độ giàu tài nguyên/độ khó tu luyện khác nhau theo vùng → tạo động lực tranh đoạt lãnh thổ.
- Thời gian trò chơi trôi theo **Kỷ Nguyên** (Kỷ) — mỗi Kỷ khoảng 500-1000 năm, có thể xảy ra "Đại Kiếp" (thiên tai/chiến tranh diệt thế) làm reset một phần bản đồ thế lực.

### 1.1 Các vùng lớn (region types – dùng để gắn tag sinh thế lực)
| Loại vùng | Đặc điểm | Linh khí | Nguy hiểm |
|---|---|---|---|
| Linh Vực | Đất thánh, tông môn lớn tranh giành | Rất cao | Cao (nhiều cường giả) |
| Hoang Dã | Rừng núi chưa khai phá | Trung bình-cao | Cao (yêu thú) |
| Biên Thành | Thành trấn tán tu, chợ đen | Thấp-trung | Trung bình (trộm cướp) |
| Cấm Địa | Di tích thượng cổ, tử vực | Cực cao | Cực cao |
| Vương Kinh | Thủ đô thế tục, thế gia quyền quý | Trung bình | Trung bình (chính trị) |
| Hải Vực/Không Vực | Đảo trôi, hạm đội tu sĩ | Biến động | Biến động |

---

## 2. CHỦNG TỘC (RACES)

Mỗi chủng tộc có thiên phú tu luyện, tuổi thọ nền, và thái độ với "Nhân Tộc" (mặc định phe trung lập/đa số).

| Chủng tộc | Thiên phú | Tuổi thọ nền | Ghi chú |
|---|---|---|---|
| Nhân Tộc | Cân bằng, dễ đột phá cảnh giới thấp | ~120 năm | Chủng tộc mặc định, đa dạng thế lực nhất |
| Yêu Tộc | Thân thể mạnh, linh hồn yếu | ~300-800 năm (tùy loài) | Chia làm hàng chục "loài yêu" (Hổ, Xà, Cầm, Long...) |
| Ma Tộc | Hấp thụ sát khí/oán khí tu luyện | ~500 năm | Bị Chính Đạo cảnh giác, sống ở Ma Vực |
| Cổ Tộc (Yêu Cổ Chủng) | Thượng cổ tàn tồn, sức mạnh dòng máu | Gần bất tử nếu không chết trận | Số lượng cực ít, huyết mạch loãng dần |
| Linh Tộc (Tinh Linh) | Ngự ngũ hành/thiên địa chi lực | ~1000 năm | Sống ẩn dật, kén giao tiếp |
| Ma Thần Hậu Duệ | Lai giữa Ma Tộc và Nhân Tộc | Biến động | Bị kỳ thị, thường thành tán tu hoặc phản diện |
| Cơ Quan Tộc | Sinh vật luyện chế bằng trận pháp/cơ quan | Vô hạn (bảo trì được) | Hiếm, gắn với 1-2 môn phái kỳ môn |

> Gợi ý sinh ngẫu nhiên: gán trọng số xuất hiện theo vùng (VD: Yêu Tộc dày đặc ở Hoang Dã, Ma Tộc ở Cấm Địa/Ma Vực).

---

## 3. HỆ THỐNG CẢNH GIỚI TU LUYỆN

Tài liệu bản đồ không định nghĩa một thang tu vi riêng. Player, NPC và thế lực đều dùng đúng **14 cấp phẳng, không có tiểu cảnh** tại mục 6 của `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`; dữ liệu máy đọc nằm trong `data/canh_gioi_tien_hiep.json`.

**Quy tắc random hóa NPC/thế lực:** roll cấp theo phân phối hình tháp trên 14 cấp chuẩn — số đông ở cấp thấp, càng lên cao càng hiếm. Việc random này không áp dụng cho Player mới, vốn luôn bắt đầu ở cấp 1, Di Mệnh Cảnh.

---

## 4. PHÂN LOẠI THẾ LỰC (FACTION TYPES)

### 4.1 Tông Môn (Sects) — hàng trăm cái, sinh ngẫu nhiên theo template
- **Chính Đạo Tông Môn**: Kiếm Tông, Đan Tông, Phù Tông, Trận Pháp Tông, Đạo Tông, Phật Tông...
- **Ma Đạo Tông Môn**: Huyết Tông, Quỷ Tông, Tà Đan Môn...
- **Trung Lập/Kỳ Môn**: Thương hội tu sĩ, Săn Yêu Đường, Cơ Quan Môn, Luyện Khí Sư Công Hội

### 4.2 Thế Gia (Clans/Noble Houses)
- Gia tộc huyết mạch, thường kiểm soát 1 vùng lãnh thổ + quan hệ với vương triều thế tục.
- VD template: "OOO Thế Gia" — sở hữu Gia Tộc Bí Pháp, Trưởng Lão Hội, Tổ Nghiệp Linh Mạch.

### 4.3 Vương Triều (Kingdoms/Dynasties)
- Thế lực thế tục (phi tu sĩ hoặc bán tu sĩ), quản lý dân chúng, thuế, quân đội.
- Quan hệ với tông môn/thế gia: bảo trợ, đối đầu, hoặc bị khống chế ngầm.

### 4.4 Tán Tu (Rogue Cultivators)
- Cá nhân/nhóm nhỏ không thuộc môn phái, sinh sống bằng săn yêu, buôn bán, làm nhiệm vụ thuê.
- Nguồn nhân vật phụ/random encounter chính trong thế giới mở.

### 4.5 Thế Lực Hắc Đạo (Cướp, Sát Thủ, Buôn Lậu)
- Sơn Trại (giặc cướp núi), Sát Thủ Tổ Chức, Hắc Thị (chợ đen linh dược/pháp bảo trộm cắp), Nô Lệ Thương Đoàn.

### 4.6 Thế Lực Ẩn/Truyền Kỳ
- Cổ tông diệt vong còn di tích, giáo phái tà thần, tổ chức bí mật xuyên vương triều.

---

## 5. HỆ THỐNG STAT NGẪU NHIÊN (dành cho procedural generation)

### 5.1 Stat cấp Thế Lực (Faction Stats)
```
Faction {
  Loại: [Tông Môn | Thế Gia | Vương Triều | Tán Tu Liên Minh | Hắc Đạo]
  Chính/Tà/Trung Lập: roll trọng số theo loại
  Quy Mô: 1-10 (số đệ tử/thành viên, log-scale)
  Cảnh Giới Cao Nhất: roll theo bảng phân phối (mục 3)
  Tài Nguyên: {Linh Thạch, Linh Mạch, Đan Dược, Pháp Bảo} - mỗi loại 1-100
  Danh Vọng: -100 (khét tiếng) → +100 (được kính trọng)
  Quan Hệ Ngoại Giao: map tới các thế lực lân cận {Đồng Minh|Trung Lập|Thù Địch}
  Đặc Sắc (Trait, roll 1-3): [Thiện chiến, Giàu tài nguyên, Bí pháp thất truyền,
                              Nội bộ lục đục, Đang suy tàn, Đang trỗi dậy,
                              Có Thánh Địa/Bí Cảnh riêng, Nợ máu với thế lực khác...]
}
```

### 5.2 Stat cấp Cá Nhân (NPC/Nhân vật)
```
Character {
  Chủng Tộc: roll theo trọng số vùng
  Cảnh Giới: roll lệch (xem mục 3)
  Căn Cốt (Aptitude): 1-100 (ảnh hưởng tốc độ đột phá)
  Thuộc Tính Linh Căn: [Kim, Mộc, Thủy, Hỏa, Thổ, Song/Tam Linh Căn (hiếm), Dị Linh Căn (cực hiếm)]
  Tính Cách: roll 2 trait [Chính trực, Tàn nhẫn, Tham lam, Trung thành, Cơ trí, Lỗ mãng, Lãnh đạm, Nhiệt huyết...]
  Xuất Thân: [Tông Môn | Thế Gia | Tán Tu | Hắc Đạo | Vô Danh]
  Trang Bị: roll pháp bảo/công pháp theo cảnh giới (không vượt cấp)
  Mục Tiêu Ẩn: [Báo thù, Tìm cơ duyên, Bảo vệ môn phái, Thống nhất vùng, Trốn tránh quá khứ...]
}
```

### 5.3 Gợi ý bảng trọng số theo vùng (weight table)
- Linh Vực: Tông Môn 60%, Thế Gia 20%, Tán Tu 15%, Hắc Đạo 5%
- Biên Thành: Tán Tu 50%, Hắc Đạo 30%, Thương hội 15%, Tông môn nhỏ 5%
- Cấm Địa: Ma Tộc/Cổ Tộc 40%, Thế lực ẩn 30%, Tán tu liều mạng 30%

---

## 6. KINH TẾ & TÀI NGUYÊN

- **Tiền tệ:** Linh Thạch (Hạ/Trung/Thượng/Cực Phẩm) — tỷ giá 1 Thượng = 100 Trung = 10.000 Hạ (tùy chỉnh).
- **Tài nguyên chiến lược:** Linh Mạch (mỏ linh khí cố định vị trí — mục tiêu tranh đoạt giữa các thế lực), Đan Dược, Yêu Đan (lõi yêu thú), Cổ Tịch (sách công pháp thất truyền).
- **Nhiệm vụ sinh thái (world events ngẫu nhiên):**
  - Tông môn khai mở bí cảnh (giới hạn thời gian, thu hút tán tu khắp nơi)
  - Chiến tranh lãnh thổ giữa 2 thế gia
  - Yêu thú bạo động tràn ra khỏi Hoang Dã
  - Đại Kiếp/thiên tai định kỳ reset một phần bản đồ

---

## 7. GỢI Ý TRIỂN KHAI GAME TEXT RPG

1. Sinh bản đồ gồm N vùng (region), mỗi vùng gắn loại + trọng số chủng tộc/thế lực.
2. Mỗi vùng random 3-8 thế lực theo bảng mục 5.1, liên kết quan hệ ngoại giao lẫn nhau.
3. Sinh NPC nổi bật (Tông Chủ, Trưởng Lão, Thiên Kiêu đệ tử...) theo mục 5.2, gắn vào thế lực tương ứng.
4. Dùng "Đặc Sắc" (trait) của thế lực để tự sinh quest hook (VD: "Nội bộ lục đục" → quest điều tra phản đồ).
5. Người chơi bắt đầu là Tán Tu hoặc đệ tử ngoại môn, có thể gia nhập/phản bội/tiêu diệt bất kỳ thế lực nào — thế giới cập nhật lại quan hệ & bản đồ quyền lực sau mỗi sự kiện lớn.

---

*File này là khung sườn — có thể mở rộng thêm bảng công pháp, pháp bảo, yêu thú theo nhu cầu cụ thể của game.*

### Source: `archive-requirements\logic-history\04-interaction\NPC_SYSTEM_V2_MAP_WEATHER_REQUIREMENT.md`

# H[encoding-loss] TH[encoding-loss]NG NPC V2  D[encoding-loss]N C[encoding-loss] S[encoding-loss]NG, B[encoding-loss]N [encoding-loss] [encoding-loss]NG V[encoding-loss] TH[encoding-loss]I TI[encoding-loss]T

**Phi[encoding-loss]n b[encoding-loss]n:** 1.1  
**Ph[encoding-loss]m vi:** m[encoding-loss] r[encoding-loss]ng `NPC_MONSTER_SYSTEM.md`, `RELATIONSHIP_SYSTEM.md`, `MAP_CURRENT_REGION_UX_REQUIREMENT.md` v[encoding-loss] World Simulation.  
**Ng[encoding-loss]n ng[encoding-loss] hi[encoding-loss]n th[encoding-loss]:** ti[encoding-loss]ng Vi[encoding-loss]t; ID k[encoding-loss] thu[encoding-loss]t ch[encoding-loss] d[encoding-loss]ng n[encoding-loss]i b[encoding-loss].

## 1. T[encoding-loss]m nh[encoding-loss]n

NPC kh[encoding-loss]ng c[encoding-loss]n l[encoding-loss] danh s[encoding-loss]ch [encoding-loss]ng y[encoding-loss]n t[encoding-loss]i node [encoding-loss] ng[encoding-loss][encoding-loss]i ch[encoding-loss]i b[encoding-loss]m N[encoding-loss]i chuy[encoding-loss]n. M[encoding-loss]i NPC l[encoding-loss] m[encoding-loss]t t[encoding-loss]c nh[encoding-loss]n c[encoding-loss] n[encoding-loss]i [encoding-loss], l[encoding-loss]ch tr[encoding-loss]nh, c[encoding-loss]ng vi[encoding-loss]c, m[encoding-loss]c ti[encoding-loss]u, quan h[encoding-loss], nhu c[encoding-loss]u, ph[encoding-loss]n [encoding-loss]ng th[encoding-loss]i ti[encoding-loss]t, ph[encoding-loss]n [encoding-loss]ng c[encoding-loss]nh quan v[encoding-loss] k[encoding-loss] [encoding-loss]c. Node b[encoding-loss]n [encoding-loss] l[encoding-loss] m[encoding-loss]i tr[encoding-loss][encoding-loss]ng s[encoding-loss]ng c[encoding-loss]a m[encoding-loss]t qu[encoding-loss]n th[encoding-loss] NPC; ng[encoding-loss][encoding-loss]i ch[encoding-loss]i c[encoding-loss] th[encoding-loss] th[encoding-loss]y nhi[encoding-loss]u NPC c[encoding-loss]ng t[encoding-loss]n t[encoding-loss]i, NPC t[encoding-loss] t[encoding-loss][encoding-loss]ng t[encoding-loss]c v[encoding-loss]i nhau v[encoding-loss] th[encoding-loss] gi[encoding-loss]i thay [encoding-loss]i ngay c[encoding-loss] khi ng[encoding-loss][encoding-loss]i ch[encoding-loss]i kh[encoding-loss]ng [encoding-loss]ng c[encoding-loss]nh.

H[encoding-loss] th[encoding-loss]ng ph[encoding-loss]i m[encoding-loss] r[encoding-loss]ng s[encoding-loss] l[encoding-loss][encoding-loss]ng NPC m[encoding-loss] kh[encoding-loss]ng bi[encoding-loss]n node th[encoding-loss]nh danh s[encoding-loss]ch h[encoding-loss]n lo[encoding-loss]n. Runtime d[encoding-loss]ng ph[encoding-loss]n l[encoding-loss]p **danh t[encoding-loss]nh b[encoding-loss]n v[encoding-loss]ng**, **qu[encoding-loss]n th[encoding-loss] n[encoding-loss]n**, **[encoding-loss]m [encoding-loss]ng t[encoding-loss]m th[encoding-loss]i**, **ng[encoding-loss][encoding-loss]i qua [encoding-loss][encoding-loss]ng theo h[encoding-loss]nh tr[encoding-loss]nh** v[encoding-loss] **NPC s[encoding-loss] ki[encoding-loss]n**.

## 2. Nguy[encoding-loss]n t[encoding-loss]c thi[encoding-loss]t k[encoding-loss]

1. NPC c[encoding-loss] danh t[encoding-loss]nh v[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i r[encoding-loss] r[encoding-loss]ng; kh[encoding-loss]ng g[encoding-loss]p m[encoding-loss]i ng[encoding-loss][encoding-loss]i ng[encoding-loss]u nhi[encoding-loss]n th[encoding-loss]nh m[encoding-loss]t ID.
2. NPC ch[encoding-loss] xu[encoding-loss]t hi[encoding-loss]n t[encoding-loss]i node/sub-location khi scheduler x[encoding-loss]c nh[encoding-loss]n hi[encoding-loss]n di[encoding-loss]n.
3. M[encoding-loss]t [encoding-loss] NPC c[encoding-loss] th[encoding-loss] cao; UI ph[encoding-loss]n trang/l[encoding-loss]c, engine d[encoding-loss]ng spatial index v[encoding-loss] kh[encoding-loss]ng gi[encoding-loss]i h[encoding-loss]n c[encoding-loss]ng v[encoding-loss]i NPC m[encoding-loss]i node.
4. Th[encoding-loss]i ti[encoding-loss]t t[encoding-loss]c [encoding-loss]ng t[encoding-loss]i h[encoding-loss]nh vi, l[encoding-loss]ch, gi[encoding-loss] c[encoding-loss], di chuy[encoding-loss]n, t[encoding-loss]m tr[encoding-loss]ng v[encoding-loss] chi[encoding-loss]n [encoding-loss]u.
5. T[encoding-loss][encoding-loss]ng t[encoding-loss]c NPCNPC v[encoding-loss] NPCc[encoding-loss]nh quan ph[encoding-loss]i t[encoding-loss]o ra h[encoding-loss]u qu[encoding-loss] quan s[encoding-loss]t [encoding-loss][encoding-loss]c.
6. T[encoding-loss]t c[encoding-loss] mutation qua transaction/idempotency; save ci v[encoding-loss]n t[encoding-loss]i [encoding-loss][encoding-loss]c.
7. Kh[encoding-loss]ng [encoding-loss] NPC s[encoding-loss]a topology static. NPC ch[encoding-loss] m[encoding-loss]/[encoding-loss]ng edge runtime [encoding-loss] [encoding-loss][encoding-loss]c c[encoding-loss]p ph[encoding-loss]p.

## 3. Ph[encoding-loss]n lo[encoding-loss]i NPC v[encoding-loss] m[encoding-loss]t [encoding-loss]

### 3.1. C[encoding-loss]c l[encoding-loss]p NPC

| L[encoding-loss]p | V[encoding-loss] d[encoding-loss] | Danh t[encoding-loss]nh | C[encoding-loss] quan h[encoding-loss] b[encoding-loss]n v[encoding-loss]ng |
|---|---|---|---|
| `persistent_named` | Ch[encoding-loss][encoding-loss]ng m[encoding-loss]n, s[encoding-loss] ph[encoding-loss], th[encoding-loss][encoding-loss]ng nh[encoding-loss]n ch[encoding-loss]nh | ID c[encoding-loss] [encoding-loss]nh | C[encoding-loss] |
| `persistent_role` | tr[encoding-loss][encoding-loss]ng tr[encoding-loss]m, y s[encoding-loss], [encoding-loss]i tr[encoding-loss][encoding-loss]ng tu[encoding-loss]n tra | ID c[encoding-loss] [encoding-loss]nh theo node | C[encoding-loss] |
| `population_citizen` | d[encoding-loss]n c[encoding-loss], [encoding-loss] t[encoding-loss], phu khu[encoding-loss]n v[encoding-loss]c | instance [encoding-loss]n [encoding-loss]nh theo node | C[encoding-loss] h[encoding-loss]n ch[encoding-loss] |
| `traveler` | l[encoding-loss] kh[encoding-loss]ch, h[encoding-loss]c s), th[encoding-loss][encoding-loss]ng o[encoding-loss]n | instance theo h[encoding-loss]nh tr[encoding-loss]nh | C[encoding-loss] n[encoding-loss]u ghi nh[encoding-loss] |
| `crowd_ephemeral` | [encoding-loss]m [encoding-loss]ng h[encoding-loss]i ch[encoding-loss], n[encoding-loss]n d[encoding-loss]n | pool t[encoding-loss]i s[encoding-loss] d[encoding-loss]ng | Kh[encoding-loss]ng |
| `event_actor` | s[encoding-loss] gi[encoding-loss], k[encoding-loss] g[encoding-loss]y lo[encoding-loss]n, nh[encoding-loss]n ch[encoding-loss]ng | ID theo incident | C[encoding-loss] trong incident |

### 3.2. Quy m[encoding-loss] node

- Node nh[encoding-loss]: 530 NPC runtime.
- L[encoding-loss]ng: 30150.
- Th[encoding-loss]nh th[encoding-loss]: 1501.000.
- S[encoding-loss]n m[encoding-loss]n/v[encoding-loss][encoding-loss]ng kinh: 5005.000.
- S[encoding-loss] ki[encoding-loss]n l[encoding-loss]n c[encoding-loss] th[encoding-loss] t[encoding-loss]o th[encoding-loss]m crowd pool nh[encoding-loss]ng ph[encoding-loss]i c[encoding-loss] quota theo node, kh[encoding-loss]ng gi[encoding-loss]i h[encoding-loss]n to[encoding-loss]n c[encoding-loss]c m[encoding-loss]t c[encoding-loss]ch t[encoding-loss]y ti[encoding-loss]n.

Engine kh[encoding-loss]ng instantiate to[encoding-loss]n b[encoding-loss] NPC m[encoding-loss]i frame. D[encoding-loss]ng `populationSeed`, `activeActors`, `backgroundCount` v[encoding-loss] materialize c[encoding-loss] th[encoding-loss] khi ng[encoding-loss][encoding-loss]i ch[encoding-loss]i quan s[encoding-loss]t/t[encoding-loss][encoding-loss]ng t[encoding-loss]c.

## 4. Schema NPC V2

```ts
NpcRuntime {
  npcId: string;
  instanceId: string;
  kind: "persistent_named" | "persistent_role" | "population_citizen" | "traveler" | "crowd_ephemeral" | "event_actor";
  displayName: string;
  role: string;
  factionId?: string;
  homeNodeId: string;
  currentNodeId: string;
  currentSubLocationId: string;
  routePlan?: RoutePlan;
  schedule: ScheduleBlock[];
  scheduleStatus: "working" | "resting" | "traveling" | "sheltering" | "patrolling" | "missing" | "dead";
  needs: { food: number; shelter: number; safety: number; social: number };
  traits: string[];
  goals: Goal[];
  mood: number;
  health: number;
  stamina: number;
  weatherAffinity: Record<string, number>;
  relationshipsWithNpcs: Record<string, RelationshipState>;
  memoryWithPlayer: MemoryEvent[];
  memoryWithWorld: MemoryEvent[];
  inventory: Record<string, number>;
  status: "alive" | "injured" | "missing" | "captured" | "dead" | "retired";
  lastDecisionDay: number;
}
```

`instanceId` b[encoding-loss]t bu[encoding-loss]c v[encoding-loss]i NPC kh[encoding-loss]ng c[encoding-loss] [encoding-loss]nh; kh[encoding-loss]ng [encoding-loss][encoding-loss]c d[encoding-loss]ng t[encoding-loss]n hi[encoding-loss]n th[encoding-loss] l[encoding-loss]m kh[encoding-loss]a quan h[encoding-loss].

## 5. Authoring Node Detail cho NPC

M[encoding-loss]i node khai b[encoding-loss]o **NPC ecology profile** ri[encoding-loss]ng, kh[encoding-loss]ng copy m[encoding-loss]t c[encoding-loss]u h[encoding-loss]nh chung:

```ts
NpcEcologyProfile {
  populationCapacity: number;
  roles: [{ roleId, baseCount, variance, preferredSubLocations, scheduleTemplate }];
  factionPresence: [{ factionId, share, allowedRoles, taxPolicy }];
  weatherShelters: string[];
  gatheringSpots: string[];
  dangerResponses: string[];
  localRumors: string[];
  migrationEdges: string[];
  uniqueActors: string[];
}
```

V[encoding-loss] d[encoding-loss]: S[encoding-loss]n m[encoding-loss]n c[encoding-loss] [encoding-loss] t[encoding-loss] [encoding-loss] s[encoding-loss]n luy[encoding-loss]n, tr[encoding-loss][encoding-loss]ng l[encoding-loss]o [encoding-loss] ch[encoding-loss]nh i[encoding-loss]n, t[encoding-loss]p d[encoding-loss]ch [encoding-loss] kho, kh[encoding-loss]ch [encoding-loss] c[encoding-loss]ng; th[encoding-loss]nh c[encoding-loss]ng c[encoding-loss] th[encoding-loss]y th[encoding-loss] [encoding-loss] b[encoding-loss]n, th[encoding-loss][encoding-loss]ng nh[encoding-loss]n [encoding-loss] ch[encoding-loss], ng[encoding-loss][encoding-loss]i [encoding-loss]a tin [encoding-loss] tr[encoding-loss]m d[encoding-loss]ch. Kh[encoding-loss]ng cho ph[encoding-loss]p m[encoding-loss]i node m[encoding-loss]c [encoding-loss]nh c[encoding-loss]ng m[encoding-loss]t danh s[encoding-loss]ch `market/hall/alley` m[encoding-loss] kh[encoding-loss]ng c[encoding-loss] profile.

## 6. Scheduler v[encoding-loss] quy[encoding-loss]t [encoding-loss]nh NPC

### 6.1. V[encoding-loss]ng l[encoding-loss]p theo tick

M[encoding-loss]i world tick:

1. C[encoding-loss]p nh[encoding-loss]t th[encoding-loss]i ti[encoding-loss]t v[encoding-loss] c[encoding-loss]nh b[encoding-loss]o m[encoding-loss]i tr[encoding-loss][encoding-loss]ng.
2. Ki[encoding-loss]m tra l[encoding-loss]ch l[encoding-loss]m vi[encoding-loss]c/gi[encoding-loss] m[encoding-loss] c[encoding-loss]a.
3. [encoding-loss]nh gi[encoding-loss] nhu c[encoding-loss]u, m[encoding-loss]c ti[encoding-loss]u v[encoding-loss] nguy c[encoding-loss].
4. Ch[encoding-loss]n h[encoding-loss]nh [encoding-loss]ng b[encoding-loss]ng utility score deterministic.
5. Di chuy[encoding-loss]n theo route h[encoding-loss]p l[encoding-loss] ho[encoding-loss]c t[encoding-loss]m shelter.
6. Resolve t[encoding-loss][encoding-loss]ng t[encoding-loss]c NPCNPC, NPCc[encoding-loss]nh quan v[encoding-loss] NPCng[encoding-loss][encoding-loss]i ch[encoding-loss]i.
7. Ghi s[encoding-loss] ki[encoding-loss]n v[encoding-loss] invalidate view model node b[encoding-loss] [encoding-loss]nh h[encoding-loss][encoding-loss]ng.

```text
utility(action) = goalWeight + needUrgency + weatherFit + relationshipBias
                  + factionOrder - dangerCost - travelCost
```

Random ch[encoding-loss] d[encoding-loss]ng seed `worldSeed + npcInstanceId + day + decisionIndex`; reload kh[encoding-loss]ng [encoding-loss]i quy[encoding-loss]t [encoding-loss]nh.

### 6.2. L[encoding-loss]ch v[encoding-loss] [encoding-loss]u ti[encoding-loss]n

- L[encoding-loss]ch c[encoding-loss] [encoding-loss]nh c[encoding-loss] th[encoding-loss] b[encoding-loss] ghi [encoding-loss] b[encoding-loss]i incident, th[encoding-loss]i ti[encoding-loss]t c[encoding-loss]c oan, chi[encoding-loss]n tranh, th[encoding-loss][encoding-loss]ng v[encoding-loss] ho[encoding-loss]c ng[encoding-loss][encoding-loss]i ch[encoding-loss]i.
- [encoding-loss]u ti[encoding-loss]n: s[encoding-loss]ng s[encoding-loss]t > ho[encoding-loss]n th[encoding-loss]nh nhi[encoding-loss]m v[encoding-loss] kh[encoding-loss]n > b[encoding-loss]o v[encoding-loss] faction > nhu c[encoding-loss]u c[encoding-loss] nh[encoding-loss]n > x[encoding-loss] h[encoding-loss]i > i lang thang.
- NPC ang shelter kh[encoding-loss]ng nh[encoding-loss]n giao d[encoding-loss]ch th[encoding-loss]ng th[encoding-loss][encoding-loss]ng n[encoding-loss]u sub-location [encoding-loss]ng c[encoding-loss]a.
- NPC b[encoding-loss] th[encoding-loss][encoding-loss]ng t[encoding-loss] t[encoding-loss]m y s[encoding-loss]; NPC th[encoding-loss]t nghi[encoding-loss]p t[encoding-loss]m vi[encoding-loss]c t[encoding-loss]i ch[encoding-loss]/tr[encoding-loss]m.

## 7. NPC v[encoding-loss] th[encoding-loss]i ti[encoding-loss]t

### 7.1. Ph[encoding-loss]n [encoding-loss]ng theo lo[encoding-loss]i th[encoding-loss]i ti[encoding-loss]t

| Th[encoding-loss]i ti[encoding-loss]t | H[encoding-loss]nh vi NPC | T[encoding-loss]c [encoding-loss]ng b[encoding-loss]n [encoding-loss] |
|---|---|---|
| Quang | l[encoding-loss]ch b[encoding-loss]nh th[encoding-loss][encoding-loss]ng | edge m[encoding-loss], traffic chu[encoding-loss]n |
| M[encoding-loss]a | t[encoding-loss]m m[encoding-loss]i, gi[encoding-loss]m giao d[encoding-loss]ch ngo[encoding-loss]i tr[encoding-loss]i | [encoding-loss][encoding-loss]ng [encoding-loss]t tng nguy c[encoding-loss] |
| B[encoding-loss]o | tr[encoding-loss] [encoding-loss]n, h[encoding-loss]y h[encoding-loss]nh tr[encoding-loss]nh | [encoding-loss][encoding-loss]ng bi[encoding-loss]n c[encoding-loss] th[encoding-loss] phong t[encoding-loss]a |
| S[encoding-loss][encoding-loss]ng m[encoding-loss] | i theo ng[encoding-loss][encoding-loss]i d[encoding-loss]n [encoding-loss][encoding-loss]ng, gi[encoding-loss]m t[encoding-loss]m nh[encoding-loss]n | patrol/i l[encoding-loss]c tng |
| Tuy[encoding-loss]t | ti[encoding-loss]u hao th[encoding-loss] l[encoding-loss]c, [encoding-loss]u ti[encoding-loss]n l[encoding-loss]a | [encoding-loss]o c[encoding-loss] th[encoding-loss] h[encoding-loss]n ch[encoding-loss] |
| N[encoding-loss]ng g[encoding-loss]t | ngh[encoding-loss] gi[encoding-loss]a tr[encoding-loss]a, tng nhu c[encoding-loss]u n[encoding-loss][encoding-loss]c | caravan ch[encoding-loss]m |
| D[encoding-loss] t[encoding-loss][encoding-loss]ng | ho[encoding-loss]ng lo[encoding-loss]n, cu[encoding-loss]ng t[encoding-loss]n ho[encoding-loss]c l[encoding-loss]i d[encoding-loss]ng | incident/influence bi[encoding-loss]n [encoding-loss]ng |

### 7.2. Weather shelter

M[encoding-loss]i node khai b[encoding-loss]o shelter c[encoding-loss] s[encoding-loss]c ch[encoding-loss]a, lo[encoding-loss]i NPC [encoding-loss][encoding-loss]c ph[encoding-loss]p v[encoding-loss]o, ph[encoding-loss] v[encoding-loss] [encoding-loss] an to[encoding-loss]n. Khi s[encoding-loss]c ch[encoding-loss]a [encoding-loss]y, NPC ph[encoding-loss]i x[encoding-loss]p h[encoding-loss]ng, t[encoding-loss]m sub-location ph[encoding-loss] ho[encoding-loss]c r[encoding-loss]i node. UI hi[encoding-loss]n th[encoding-loss] N[encoding-loss]i tr[encoding-loss] [encoding-loss] [encoding-loss]y thay v[encoding-loss] l[encoding-loss]i chung.

### 7.3. Weather interaction API

```js
npcWeatherPreview(state, npcId, weather)
resolveNpcWeatherReaction(state, npcId, weather)
listNodeShelters(state, nodeId)
```

## 8. T[encoding-loss][encoding-loss]ng t[encoding-loss]c NPCNPC

### 8.1. Lo[encoding-loss]i t[encoding-loss][encoding-loss]ng t[encoding-loss]c

- giao d[encoding-loss]ch, m[encoding-loss]c c[encoding-loss], v[encoding-loss]n chuy[encoding-loss]n;
- ch[encoding-loss]o h[encoding-loss]i, k[encoding-loss]t b[encoding-loss]n, tranh lu[encoding-loss]n;
- d[encoding-loss]y h[encoding-loss]c, t[encoding-loss] th[encoding-loss], tuy[encoding-loss]n m[encoding-loss];
- tu[encoding-loss]n tra v[encoding-loss] ki[encoding-loss]m tra gi[encoding-loss]y t[encoding-loss];
- b[encoding-loss]o v[encoding-loss], c[encoding-loss]u th[encoding-loss][encoding-loss]ng, chm s[encoding-loss]c;
- gi[encoding-loss]n i[encoding-loss]p, t[encoding-loss] gi[encoding-loss]c, e d[encoding-loss]a;
- y[encoding-loss]u [encoding-loss][encoding-loss]ng, h[encoding-loss]n [encoding-loss][encoding-loss]c, th[encoding-loss] h[encoding-loss]n;
- tranh ch[encoding-loss]p t[encoding-loss]i nguy[encoding-loss]n ho[encoding-loss]c [encoding-loss]a v[encoding-loss];
- m[encoding-loss]t h[encoding-loss]i v[encoding-loss] trao [encoding-loss]i tin;
- c[encoding-loss]ng x[encoding-loss] l[encoding-loss] c[encoding-loss]nh quan nguy hi[encoding-loss]m.

### 8.2. Encounter resolver

```js
previewNpcEncounter(state, actorA, actorB, context)
resolveNpcEncounter(state, encounterId, choice)
```

Resolver ph[encoding-loss]i ki[encoding-loss]m tra faction, quan h[encoding-loss], th[encoding-loss]i ti[encoding-loss]t, sub-location, witness count, m[encoding-loss]c ti[encoding-loss]u v[encoding-loss] cooldown. K[encoding-loss]t qu[encoding-loss] c[encoding-loss] th[encoding-loss] thay [encoding-loss]i trust/respect/fear/suspicion, inventory, route, faction reputation, incident v[encoding-loss] bulletin.

### 8.3. M[encoding-loss]t h[encoding-loss]i v[encoding-loss] ri[encoding-loss]ng t[encoding-loss]

Encounter b[encoding-loss] m[encoding-loss]t y[encoding-loss]u c[encoding-loss]u sub-location k[encoding-loss]n, fog [encoding-loss] v[encoding-loss] kh[encoding-loss]ng c[encoding-loss] witness. N[encoding-loss]u b[encoding-loss] ph[encoding-loss]t hi[encoding-loss]n, t[encoding-loss]o `suspicion`/incident thay v[encoding-loss] [encoding-loss]m th[encoding-loss]m b[encoding-loss] qua.

## 9. NPCc[encoding-loss]nh quan v[encoding-loss] node

NPC ph[encoding-loss]i nh[encoding-loss]n bi[encoding-loss]t:

- c[encoding-loss]ng [encoding-loss]ng/m[encoding-loss];
- ch[encoding-loss], kho, b[encoding-loss]n, l[encoding-loss]a tr[encoding-loss]i, mi[encoding-loss]u, tr[encoding-loss]n ph[encoding-loss]p;
- c[encoding-loss]u s[encoding-loss]p, [encoding-loss][encoding-loss]ng ng[encoding-loss]p, tuy[encoding-loss]t l[encoding-loss], v[encoding-loss]ng nhi[encoding-loss]m t[encoding-loss];
- outpost, watchtower, trading post v[encoding-loss] waystation;
- m[encoding-loss]t [encoding-loss] ng[encoding-loss][encoding-loss]i, ti[encoding-loss]ng [encoding-loss]ng, an ninh v[encoding-loss] t[encoding-loss]i nguy[encoding-loss]n.

V[encoding-loss] d[encoding-loss]: th[encoding-loss][encoding-loss]ng nh[encoding-loss]n tr[encoding-loss]nh edge c[encoding-loss] b[encoding-loss]o; patrol [encoding-loss]i route khi c[encoding-loss]u s[encoding-loss]p; d[encoding-loss]n ch[encoding-loss]y n[encoding-loss]n t[encoding-loss]p trung v[encoding-loss]o shelter; y s[encoding-loss] di chuy[encoding-loss]n t[encoding-loss]i node c[encoding-loss] nhi[encoding-loss]u ng[encoding-loss][encoding-loss]i b[encoding-loss] th[encoding-loss][encoding-loss]ng; NPC c[encoding-loss] th[encoding-loss] s[encoding-loss]a m[encoding-loss]t c[encoding-loss]ng tr[encoding-loss]nh n[encoding-loss]u [encoding-loss] ngh[encoding-loss] v[encoding-loss] v[encoding-loss]t t[encoding-loss].

## 10. Ng[encoding-loss][encoding-loss]i ch[encoding-loss]i t[encoding-loss][encoding-loss]ng t[encoding-loss]c NPC trong node [encoding-loss]ng

UI Khu v[encoding-loss]c hi[encoding-loss]n t[encoding-loss]i ph[encoding-loss]i c[encoding-loss]:

- b[encoding-loss] l[encoding-loss]c vai tr[encoding-loss]/faction/tr[encoding-loss]ng th[encoding-loss]i;
- t[encoding-loss]m ki[encoding-loss]m t[encoding-loss]n ho[encoding-loss]c ngh[encoding-loss];
- nh[encoding-loss]m NPC theo sub-location;
- ph[encoding-loss]n trang/virtual list;
- badge ang di chuy[encoding-loss]n, ang tr[encoding-loss], c[encoding-loss] nhi[encoding-loss]m v[encoding-loss], ang giao d[encoding-loss]ch;
- xem l[encoding-loss] do NPC kh[encoding-loss]ng th[encoding-loss] t[encoding-loss][encoding-loss]ng t[encoding-loss]c;
- n[encoding-loss]t theo d[encoding-loss]i NPC v[encoding-loss] [encoding-loss]t l[encoding-loss]ch g[encoding-loss]p;
- b[encoding-loss]n [encoding-loss] nhi[encoding-loss]t m[encoding-loss]t [encoding-loss] d[encoding-loss]n c[encoding-loss], kh[encoding-loss]ng render h[encoding-loss]ng ngh[encoding-loss]n n[encoding-loss]t ri[encoding-loss]ng l[encoding-loss].

Action Bar ch[encoding-loss] [encoding-loss]a 36 NPC quan tr[encoding-loss]ng nh[encoding-loss]t theo ng[encoding-loss] c[encoding-loss]nh; ph[encoding-loss]n Danh s[encoding-loss]ch c[encoding-loss] d[encoding-loss]n cho ph[encoding-loss]p m[encoding-loss] r[encoding-loss]ng to[encoding-loss]n b[encoding-loss].

## 11. T[encoding-loss][encoding-loss]ng t[encoding-loss]c v[encoding-loss]i h[encoding-loss] th[encoding-loss]ng kh[encoding-loss]c

- **Map:** NPC t[encoding-loss]o traffic, patrol edge, route block, rumor v[encoding-loss] m[encoding-loss] [encoding-loss][encoding-loss]ng runtime [encoding-loss][encoding-loss]c c[encoding-loss]p ph[encoding-loss]p.
- **Weather:** thay [encoding-loss]i l[encoding-loss]ch, shelter, mood, risk v[encoding-loss] h[encoding-loss]nh vi.
- **Faction:** l[encoding-loss]nh, thu[encoding-loss], gi[encoding-loss]y th[encoding-loss]ng h[encoding-loss]nh, chi[encoding-loss]n tranh v[encoding-loss] tuy[encoding-loss]n qu[encoding-loss]n.
- **Relationship/Neo:** ch[encoding-loss] NPC b[encoding-loss]n v[encoding-loss]ng ho[encoding-loss]c [encoding-loss][encoding-loss]c ghi nh[encoding-loss] m[encoding-loss]i tr[encoding-loss] th[encoding-loss]nh quan h[encoding-loss] d[encoding-loss]i h[encoding-loss]n.
- **Quest:** quest c[encoding-loss] th[encoding-loss] giao cho NPC kh[encoding-loss]c sau khi NPC g[encoding-loss]c r[encoding-loss]i node; m[encoding-loss]c ti[encoding-loss]u theo `instanceId`.
- **Combat:** NPC b[encoding-loss] th[encoding-loss][encoding-loss]ng, b[encoding-loss]t gi[encoding-loss], ch[encoding-loss]y tr[encoding-loss]n v[encoding-loss] c[encoding-loss]n c[encoding-loss]u h[encoding-loss]; kh[encoding-loss]ng h[encoding-loss]i m[encoding-loss]u mi[encoding-loss]n ph[encoding-loss] khi r[encoding-loss]i m[encoding-loss]n h[encoding-loss]nh.
- **Economy:** cung/c[encoding-loss]u do s[encoding-loss] NPC, th[encoding-loss][encoding-loss]ng o[encoding-loss]n v[encoding-loss] th[encoding-loss]i ti[encoding-loss]t quy[encoding-loss]t [encoding-loss]nh.
- **Cultivation:** V[encoding-loss]n [encoding-loss]o, [encoding-loss]u Ng[encoding-loss], d[encoding-loss]y c[encoding-loss]ng ph[encoding-loss]p v[encoding-loss] quan s[encoding-loss]t NPC c[encoding-loss]ng Con [encoding-loss][encoding-loss]ng.

## 12. Hi[encoding-loss]u nng v[encoding-loss] l[encoding-loss]u tr[encoding-loss]

- Spatial index theo `regionId/nodeId/subLocationId`.
- Kh[encoding-loss]ng scan to[encoding-loss]n b[encoding-loss] NPC cho m[encoding-loss]i node m[encoding-loss]i frame.
- Background population x[encoding-loss] l[encoding-loss] theo th[encoding-loss]ng k[encoding-loss]; active actors materialize khi c[encoding-loss]n.
- Ch[encoding-loss] serialize danh t[encoding-loss]nh b[encoding-loss]n v[encoding-loss]ng, actor ang c[encoding-loss] quest/quan h[encoding-loss]/incident v[encoding-loss] seed qu[encoding-loss]n th[encoding-loss].
- Gi[encoding-loss]i h[encoding-loss]n event log theo c[encoding-loss]a s[encoding-loss]; gi[encoding-loss] snapshot [encoding-loss]nh k[encoding-loss] cho NPC quan tr[encoding-loss]ng.
- M[encoding-loss]c ti[encoding-loss]u: 5.000 NPC trong m[encoding-loss]t node v[encoding-loss]n m[encoding-loss] detail <500 ms v[encoding-loss] tick <100 ms tr[encoding-loss]n m[encoding-loss]y t[encoding-loss]m trung.

## 13. API contract

```js
ensureNpcWorldState(state)
npcPopulationSnapshot(state, nodeId, filters)
npcPresenceAt(state, nodeId, subLocationId)
npcSchedulePreview(state, npcId)
npcDecisionPreview(state, npcId)
moveNpc(state, npcId, destinationId, reason)
previewNpcEncounter(state, actorA, actorB, context)
resolveNpcEncounter(state, encounterId, choice)
npcWeatherPreview(state, npcId, weather)
resolveNpcWeatherReaction(state, npcId, weather)
listNodeShelters(state, nodeId)
```

Mutation ph[encoding-loss]i tr[encoding-loss] `{ success, reason, data, transactionId, stateVersion }`, c[encoding-loss] rollback v[encoding-loss] journal.

## 14. L[encoding-loss] tr[encoding-loss]nh tri[encoding-loss]n khai

1. **Pha A:** schema/migration, NPC ecology profile, spatial index, population seed.
2. **Pha B:** scheduler, route, sub-location presence v[encoding-loss] UI danh s[encoding-loss]ch [encoding-loss]ng.
3. **Pha C:** th[encoding-loss]i ti[encoding-loss]t, shelter, NPCc[encoding-loss]nh quan v[encoding-loss] local incident.
4. **Pha D:** NPCNPC encounter, faction orders, m[encoding-loss]t h[encoding-loss]i, witness v[encoding-loss] bulletin.
5. **Pha E:** kinh t[encoding-loss] d[encoding-loss]n c[encoding-loss], quest chuy[encoding-loss]n giao, V[encoding-loss]n [encoding-loss]o/[encoding-loss]u Ng[encoding-loss], hi[encoding-loss]u nng v[encoding-loss] visual regression.

## 15. Acceptance criteria

1. Node th[encoding-loss]nh th[encoding-loss] c[encoding-loss] th[encoding-loss] ch[encoding-loss]a [encoding-loss]t nh[encoding-loss]t 1.000 NPC logic m[encoding-loss] kh[encoding-loss]ng tr[encoding-loss]n UI ho[encoding-loss]c scan O(N) m[encoding-loss]i frame.
2. NPC lu[encoding-loss]n c[encoding-loss] `nodeId + subLocationId` h[encoding-loss]p l[encoding-loss] khi hi[encoding-loss]n th[encoding-loss].
3. NPC t[encoding-loss] di chuy[encoding-loss]n theo l[encoding-loss]ch, weather, nhu c[encoding-loss]u v[encoding-loss] incident; reload v[encoding-loss]n deterministic.
4. C[encoding-loss] [encoding-loss]t nh[encoding-loss]t 5 lo[encoding-loss]i t[encoding-loss][encoding-loss]ng t[encoding-loss]c NPCNPC t[encoding-loss]o h[encoding-loss]u qu[encoding-loss] state r[encoding-loss] r[encoding-loss]ng.
5. Th[encoding-loss]i ti[encoding-loss]t thay [encoding-loss]i [encoding-loss][encoding-loss]c h[encoding-loss]nh vi, shelter, l[encoding-loss]ch v[encoding-loss] route c[encoding-loss]a NPC.
6. NPC c[encoding-loss] th[encoding-loss] t[encoding-loss][encoding-loss]ng t[encoding-loss]c v[encoding-loss]i c[encoding-loss]ng tr[encoding-loss]nh, [encoding-loss]a h[encoding-loss]nh, edge v[encoding-loss] t[encoding-loss]i nguy[encoding-loss]n node.
7. NPC [encoding-loss]ng v[encoding-loss]n l[encoding-loss]c/t[encoding-loss]m/ph[encoding-loss]n trang [encoding-loss][encoding-loss]c; Action Bar ch[encoding-loss] hi[encoding-loss]n th[encoding-loss] nh[encoding-loss]m ph[encoding-loss] h[encoding-loss]p.
8. NPC b[encoding-loss]n v[encoding-loss]ng kh[encoding-loss]ng bi[encoding-loss]n m[encoding-loss]t [encoding-loss]m th[encoding-loss]m; NPC t[encoding-loss]m th[encoding-loss]i kh[encoding-loss]ng l[encoding-loss]m b[encoding-loss]n quan h[encoding-loss] d[encoding-loss]i h[encoding-loss]n.
9. Kh[encoding-loss]ng c[encoding-loss] NPC n[encoding-loss]o t[encoding-loss] s[encoding-loss]a static topology.
10. Save ci migrate [encoding-loss][encoding-loss]c; transaction retry kh[encoding-loss]ng nh[encoding-loss]n [encoding-loss]i encounter, ph[encoding-loss]n th[encoding-loss][encoding-loss]ng ho[encoding-loss]c quan h[encoding-loss].
11. T[encoding-loss]t c[encoding-loss] nh[encoding-loss]n giao di[encoding-loss]n ti[encoding-loss]ng Vi[encoding-loss]t, m[encoding-loss] k[encoding-loss] thu[encoding-loss]t kh[encoding-loss]ng l[encoding-loss] cho ng[encoding-loss][encoding-loss]i ch[encoding-loss]i.
12. Test hi[encoding-loss]u nng, deterministic tick, weather, map, relationship v[encoding-loss] visual [encoding-loss]u [encoding-loss]t.
## 16. Logic Gap Closure  b[encoding-loss] sung b[encoding-loss]t bu[encoding-loss]c sau r[encoding-loss] so[encoding-loss]t

### 16.1. T[encoding-loss]ch population n[encoding-loss]n v[encoding-loss] actor c[encoding-loss] danh t[encoding-loss]nh

`backgroundCount` ch[encoding-loss] l[encoding-loss] th[encoding-loss]ng k[encoding-loss] d[encoding-loss]n c[encoding-loss]; actor ch[encoding-loss] [encoding-loss][encoding-loss]c materialize khi c[encoding-loss] m[encoding-loss]t trong c[encoding-loss]c i[encoding-loss]u ki[encoding-loss]n: n[encoding-loss]m trong viewport/Node Detail, c[encoding-loss] quest/quan h[encoding-loss], l[encoding-loss] witness, tham gia incident, n[encoding-loss]m tr[encoding-loss]n route player ho[encoding-loss]c [encoding-loss][encoding-loss]c faction [encoding-loss]nh d[encoding-loss]u. Materialize d[encoding-loss]ng kh[encoding-loss]a:

```text
instanceId = hash(worldSeed + nodeId + roleId + populationSlot + generation)
```

Kh[encoding-loss]ng t[encoding-loss]o l[encoding-loss]i actor m[encoding-loss]i sau reload n[encoding-loss]u c[encoding-loss]ng kh[encoding-loss]a. Khi actor t[encoding-loss]m th[encoding-loss]i r[encoding-loss]i node, chuy[encoding-loss]n v[encoding-loss] pool ho[encoding-loss]c l[encoding-loss]u `lastKnownNodeId`; kh[encoding-loss]ng x[encoding-loss]a quan h[encoding-loss] b[encoding-loss]n v[encoding-loss]ng.

### 16.2. Quota, congestion v[encoding-loss] h[encoding-loss]ng [encoding-loss]i

M[encoding-loss]i sub-location c[encoding-loss] `capacity`, `queuePolicy` v[encoding-loss] `priorityRoles`. N[encoding-loss]u v[encoding-loss][encoding-loss]t capacity:

1. actor kh[encoding-loss]n c[encoding-loss]p (b[encoding-loss] th[encoding-loss][encoding-loss]ng, tr[encoding-loss] em, h[encoding-loss] t[encoding-loss]ng) [encoding-loss][encoding-loss]c [encoding-loss]u ti[encoding-loss]n;
2. actor kh[encoding-loss]c x[encoding-loss]p h[encoding-loss]ng ho[encoding-loss]c chuy[encoding-loss]n shelter/sub-location g[encoding-loss]n nh[encoding-loss]t;
3. n[encoding-loss]u m[encoding-loss]i n[encoding-loss]i [encoding-loss]y, actor r[encoding-loss]i node theo edge m[encoding-loss] c[encoding-loss] chi ph[encoding-loss] th[encoding-loss]p nh[encoding-loss]t.

Kh[encoding-loss]ng [encoding-loss][encoding-loss]c spawn v[encoding-loss] h[encoding-loss]n [encoding-loss] l[encoding-loss]p UI. `visibleCount` v[encoding-loss] `backgroundCount` ph[encoding-loss]i t[encoding-loss]ch bi[encoding-loss]t.

### 16.3. State machine NPC

```text
idle [encoding-loss] planning [encoding-loss] traveling [encoding-loss] arrived [encoding-loss] acting [encoding-loss] cooldown [encoding-loss] idle
             [encoding-loss] sheltering [encoding-loss]
             [encoding-loss] injured [encoding-loss] treated/recovering [encoding-loss] idle
             [encoding-loss] missing [encoding-loss] found/retired/dead
```

M[encoding-loss]i transition ghi `reason`, `source`, `day`, `decisionSeed`. Transition kh[encoding-loss]ng h[encoding-loss]p l[encoding-loss] b[encoding-loss] t[encoding-loss] ch[encoding-loss]i, kh[encoding-loss]ng t[encoding-loss] s[encoding-loss]a tr[encoding-loss]ng th[encoding-loss]i b[encoding-loss]ng assignment r[encoding-loss]i r[encoding-loss]c.

### 16.4. Di chuy[encoding-loss]n NPC v[encoding-loss] topology

NPC d[encoding-loss]ng c[encoding-loss]ng `resolveMapTopology()`/`edgeState()` v[encoding-loss]i player. NPC kh[encoding-loss]ng [encoding-loss][encoding-loss]c i qua edge `blocked`, kh[encoding-loss]ng [encoding-loss][encoding-loss]c t[encoding-loss] m[encoding-loss] static edge. N[encoding-loss]u route h[encoding-loss]ng, NPC chuy[encoding-loss]n `rerouting`; sau ba l[encoding-loss]n kh[encoding-loss]ng t[encoding-loss]m [encoding-loss][encoding-loss]c [encoding-loss][encoding-loss]ng, chuy[encoding-loss]n `sheltering` ho[encoding-loss]c `missing` t[encoding-loss]y role. Faction patrol c[encoding-loss] quy[encoding-loss]n m[encoding-loss] edge runtime ri[encoding-loss]ng n[encoding-loss]u data khai b[encoding-loss]o `authorityAction`.

### 16.5. Quy[encoding-loss]t [encoding-loss]nh h[encoding-loss]nh vi theo nhu c[encoding-loss]u

Nhu c[encoding-loss]u chu[encoding-loss]n h[encoding-loss]a 0100; 100 l[encoding-loss] c[encoding-loss]p b[encoding-loss]ch:

```text
needUrgency = max(food, shelter, safety, social)
score(action) = goalWeight [encoding-loss] 0.40
              + needUrgency [encoding-loss] 0.30
              + weatherFit [encoding-loss] 0.15
              + relation/factionBias [encoding-loss] 0.10
              - travelCost [encoding-loss] 0.05
```

Tie-break deterministic theo `actionId`; kh[encoding-loss]ng [encoding-loss] random l[encoding-loss]m NPC [encoding-loss]i h[encoding-loss]nh vi sau reload.

### 16.6. Weather severity v[encoding-loss] hysteresis

Th[encoding-loss]i ti[encoding-loss]t c[encoding-loss] `severity 03`. NPC ch[encoding-loss] [encoding-loss]i l[encoding-loss]ch khi severity v[encoding-loss][encoding-loss]t ng[encoding-loss][encoding-loss]ng v[encoding-loss]o ho[encoding-loss]c gi[encoding-loss]m d[encoding-loss][encoding-loss]i ng[encoding-loss][encoding-loss]ng ra, tr[encoding-loss]nh [encoding-loss]i shelter m[encoding-loss]i tick:

```text
enterShelter n[encoding-loss]u severity >= enterThreshold
leaveShelter n[encoding-loss]u severity <= leaveThreshold (leaveThreshold < enterThreshold)
```

Th[encoding-loss]i ti[encoding-loss]t c[encoding-loss]c oan kh[encoding-loss]a ho[encoding-loss]t [encoding-loss]ng ngo[encoding-loss]i tr[encoding-loss]i, tng nhu c[encoding-loss]u shelter/n[encoding-loss][encoding-loss]c, thay [encoding-loss]i route v[encoding-loss] c[encoding-loss] th[encoding-loss] t[encoding-loss]o incident. Weather modifier ph[encoding-loss]i c[encoding-loss] `sourceRegion`, `startDay`, `endDay`, `severity`.

### 16.7. NPCNPC encounter lifecycle

```text
detected [encoding-loss] proposed [encoding-loss] accepted/rejected [encoding-loss] resolving [encoding-loss] resolved
                                      [encoding-loss] interrupted
```

Encounter c[encoding-loss] `encounterId`, actor pair [encoding-loss] sort, sub-location, witness list, weather snapshot, choice history v[encoding-loss] cooldown. M[encoding-loss]t c[encoding-loss]p actor kh[encoding-loss]ng th[encoding-loss] resolve hai l[encoding-loss]n c[encoding-loss]ng tick. Witness nh[encoding-loss]n memory n[encoding-loss]u `visibility` [encoding-loss]; encounter b[encoding-loss] m[encoding-loss]t kh[encoding-loss]ng t[encoding-loss] [encoding-loss]ng b[encoding-loss] to[encoding-loss]n node bi[encoding-loss]t.

### 16.8. Witness, rumor v[encoding-loss] lan truy[encoding-loss]n tin

```text
rumorStrength = eventImportance [encoding-loss] witnessReliability [encoding-loss] visibility
                [encoding-loss] distanceDecay [encoding-loss] weatherVisibility
```

Tin truy[encoding-loss]n qua NPC c[encoding-loss] `knownBy`, `confidence`, `expiresDay`; m[encoding-loss]i tick ch[encoding-loss] lan t[encoding-loss]i a m[encoding-loss]t hop. Faction bulletin ch[encoding-loss] nh[encoding-loss]n tin [encoding-loss]t confidence t[encoding-loss]i thi[encoding-loss]u, kh[encoding-loss]ng l[encoding-loss]y tr[encoding-loss]c ti[encoding-loss]p to[encoding-loss]n b[encoding-loss] world state.

### 16.9. T[encoding-loss]c [encoding-loss]ng c[encoding-loss]nh quan c[encoding-loss] rollback

NPC s[encoding-loss]a c[encoding-loss]u, d[encoding-loss]ng shelter, m[encoding-loss] ch[encoding-loss], d[encoding-loss]n [encoding-loss][encoding-loss]ng ho[encoding-loss]c ph[encoding-loss] v[encoding-loss]t c[encoding-loss]n ph[encoding-loss]i t[encoding-loss]o `landscapeMutation` qua Map transaction. Mutation c[encoding-loss] `ownerNpcId`, `requiredItems`, `duration`, `integrity`, `expiresDay` v[encoding-loss] undo policy. NPC kh[encoding-loss]ng [encoding-loss][encoding-loss]c s[encoding-loss]a c[encoding-loss]u h[encoding-loss]nh static; ch[encoding-loss] t[encoding-loss]o runtime overlay.

### 16.10. Kinh t[encoding-loss] v[encoding-loss] v[encoding-loss]t t[encoding-loss] NPC

Inventory background d[encoding-loss]ng aggregate, c[encoding-loss]n th[encoding-loss][encoding-loss]ng v[encoding-loss] v[encoding-loss]i actor d[encoding-loss]ng inventory instance. Kh[encoding-loss]ng t[encoding-loss]o v[encoding-loss]t ph[encoding-loss]m v[encoding-loss] h[encoding-loss]n t[encoding-loss] `backgroundCount`. M[encoding-loss]i giao d[encoding-loss]ch kh[encoding-loss]a gi[encoding-loss]/stock t[encoding-loss]i preview, commit qua transaction v[encoding-loss] ghi buyer/seller/day.

### 16.11. Quan h[encoding-loss] v[encoding-loss] k[encoding-loss] [encoding-loss]c

Quan h[encoding-loss] NPCNPC d[encoding-loss]ng b[encoding-loss]n tr[encoding-loss]c `trust/respect/fear/suspicion` 0100. M[encoding-loss]i event c[encoding-loss] `uniqueKey`; c[encoding-loss]ng event kh[encoding-loss]ng c[encoding-loss]ng hai l[encoding-loss]n. K[encoding-loss] [encoding-loss]c gi[encoding-loss]m d[encoding-loss]n theo half-life nh[encoding-loss]ng event Neo/quest/ ph[encoding-loss]n b[encoding-loss]i kh[encoding-loss]ng [encoding-loss][encoding-loss]c qu[encoding-loss]n t[encoding-loss] [encoding-loss]ng; ph[encoding-loss]i c[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i `suppressed` ho[encoding-loss]c `resolved`.

### 16.12. Player lock v[encoding-loss] t[encoding-loss][encoding-loss]ng t[encoding-loss]c c[encoding-loss]nh tranh

Khi player b[encoding-loss]t [encoding-loss]u n[encoding-loss]i chuy[encoding-loss]n/giao d[encoding-loss]ch/[encoding-loss]u v[encoding-loss]i NPC, actor [encoding-loss][encoding-loss]c lock t[encoding-loss]m th[encoding-loss]i. NPC kh[encoding-loss]c c[encoding-loss] th[encoding-loss] chen v[encoding-loss]o ch[encoding-loss] khi encounter cho ph[encoding-loss]p. H[encoding-loss]t timeout ph[encoding-loss]i gi[encoding-loss]i ph[encoding-loss]ng lock; reload kh[encoding-loss]ng [encoding-loss] actor b[encoding-loss] kh[encoding-loss]a v)nh vi[encoding-loss]n.

### 16.13. Offline simulation

Offline tick kh[encoding-loss]ng materialize h[encoding-loss]ng ngh[encoding-loss]n actor v[encoding-loss] kh[encoding-loss]ng resolve encounter ng[encoding-loss]u nhi[encoding-loss]n kh[encoding-loss]ng quan s[encoding-loss]t [encoding-loss][encoding-loss]c. D[encoding-loss]ng aggregate transition cho population; ch[encoding-loss] resolve actor b[encoding-loss]n v[encoding-loss]ng, quest, travel, shelter, incident v[encoding-loss] quan h[encoding-loss] c[encoding-loss] t[encoding-loss]c [encoding-loss]ng. UI ph[encoding-loss]i ghi r[encoding-loss] m[encoding-loss] ph[encoding-loss]ng n[encoding-loss]n khi ng[encoding-loss][encoding-loss]i ch[encoding-loss]i quay l[encoding-loss]i.

### 16.14. View model NPC th[encoding-loss]ng nh[encoding-loss]t

```ts
NpcNodeView {
  instanceId: string;
  displayName: string;
  roleLabel: string;
  nodeId: string;
  subLocationId: string;
  presence: "visible" | "rumored" | "absent";
  scheduleLabel: string;
  weatherMood: string;
  availableActions: ActionView[];
  relationSummary?: RelationView;
  reasonUnavailable?: string;
}
```

UI ch[encoding-loss] nh[encoding-loss]n `NpcNodeView[]`; kh[encoding-loss]ng t[encoding-loss] [encoding-loss]c `npcState` r[encoding-loss]i t[encoding-loss] quy[encoding-loss]t [encoding-loss]nh action.

### 16.15. Invariants b[encoding-loss]t bu[encoding-loss]c

1. NPC s[encoding-loss]ng ch[encoding-loss] c[encoding-loss] m[encoding-loss]t v[encoding-loss] tr[encoding-loss] hi[encoding-loss]n t[encoding-loss]i.
2. `currentSubLocationId` ph[encoding-loss]i thu[encoding-loss]c node hi[encoding-loss]n t[encoding-loss]i v[encoding-loss] kh[encoding-loss]ng v[encoding-loss][encoding-loss]t capacity m[encoding-loss] kh[encoding-loss]ng c[encoding-loss] queue record.
3. NPC ang `traveling` kh[encoding-loss]ng th[encoding-loss] [encoding-loss]ng th[encoding-loss]i `acting` ho[encoding-loss]c giao d[encoding-loss]ch.
4. NPC `dead/retired` kh[encoding-loss]ng xu[encoding-loss]t hi[encoding-loss]n trong presence list.
5. NPC t[encoding-loss]m th[encoding-loss]i kh[encoding-loss]ng t[encoding-loss]o quan h[encoding-loss] b[encoding-loss]n v[encoding-loss]ng n[encoding-loss]u ch[encoding-loss]a [encoding-loss][encoding-loss]c ghi nh[encoding-loss].
6. Weather reaction, encounter v[encoding-loss] landscape mutation [encoding-loss]u idempotent.
7. Kh[encoding-loss]ng mutation NPC n[encoding-loss]o s[encoding-loss]a static map catalog.

## 17. API v[encoding-loss] m[encoding-loss] l[encoding-loss]i chu[encoding-loss]n h[encoding-loss]a

C[encoding-loss]c API ph[encoding-loss]i c[encoding-loss] preview/commit t[encoding-loss][encoding-loss]ng [encoding-loss]ng v[encoding-loss] d[encoding-loss]ng m[encoding-loss] l[encoding-loss]i d[encoding-loss]ch [encoding-loss][encoding-loss]c:

```js
npcPopulationSnapshot(state, nodeId, filters)
npcPresenceAt(state, nodeId, subLocationId)
npcSchedulePreview(state, npcId)
npcDecisionPreview(state, npcId)
previewNpcEncounter(state, actorA, actorB, context)
resolveNpcEncounter(state, encounterId, choice)
npcWeatherPreview(state, npcId, weather)
resolveNpcWeatherReaction(state, npcId, weather)
applyLandscapeMutation(state, mutationId)
```

M[encoding-loss] l[encoding-loss]i t[encoding-loss]i thi[encoding-loss]u: `NPC_NOT_PRESENT`, `NPC_BUSY`, `NPC_WEATHER_SHELTER_FULL`, `NPC_ROUTE_BLOCKED`, `NPC_ENCOUNTER_EXPIRED`, `NPC_LOCK_CONFLICT`, `NPC_STATE_CONFLICT`.

## 18. Acceptance b[encoding-loss] sung

1. 5.000 NPC trong m[encoding-loss]t node kh[encoding-loss]ng t[encoding-loss]o h[encoding-loss]n quota actor materialized v[encoding-loss] kh[encoding-loss]ng scan to[encoding-loss]n b[encoding-loss] m[encoding-loss]i frame.
2. Hai client/tick c[encoding-loss]ng t[encoding-loss][encoding-loss]ng t[encoding-loss]c m[encoding-loss]t NPC ch[encoding-loss] m[encoding-loss]t mutation th[encoding-loss]nh c[encoding-loss]ng.
3. Weather severity gi[encoding-loss] [encoding-loss]n [encoding-loss]nh shelter qua nhi[encoding-loss]u tick, kh[encoding-loss]ng rung tr[encoding-loss]ng th[encoding-loss]i.
4. NPC route kh[encoding-loss]ng i qua edge phong t[encoding-loss]a v[encoding-loss] t[encoding-loss] t[encoding-loss]m [encoding-loss][encoding-loss]ng v[encoding-loss]ng h[encoding-loss]p l[encoding-loss].
5. NPCNPC encounter c[encoding-loss] witness/memory/rumor [encoding-loss]ng visibility.
6. Landscape mutation c[encoding-loss] rollback khi thi[encoding-loss]u v[encoding-loss]t t[encoding-loss] ho[encoding-loss]c b[encoding-loss] interrupt.
7. Offline simulation kh[encoding-loss]ng sinh ph[encoding-loss]n th[encoding-loss][encoding-loss]ng/quan h[encoding-loss] tr[encoding-loss]ng l[encoding-loss]p.
8. Save/load gi[encoding-loss] instanceId, schedule, route, memory, shelter, lock timeout v[encoding-loss] encounter journal.
9. M[encoding-loss]i nh[encoding-loss]n NPC, weather, role v[encoding-loss] l[encoding-loss]i hi[encoding-loss]n th[encoding-loss] [encoding-loss]u b[encoding-loss]ng ti[encoding-loss]ng Vi[encoding-loss]t.


### Source: `archive-requirements\logic-history\07-ui\UX_UI_CONSTELLATION_DESIGN_2026-09-18.md`

# UX/UI Constellation Design — 2026-09-18

## Định hướng

Toàn bộ game dùng một ngôn ngữ giao diện thống nhất: nền tinh không sâu, lớp kính tối, ánh sáng dữ liệu dịu và typography phân cấp rõ ràng. Bản đồ là trung tâm thị giác của Thế Giới, các feature khác dùng cùng token màu và nhịp spacing.

## Bản đồ Tinh Không

- Thiên Đồ hiển thị khu vực như các sao, tuyến nối như tinh tuyến và tổ chức như các ghim có màu theo phe/phân loại.
- Node hiện tại có quầng vàng; node đã khám phá xanh lam; node có thể đi xanh ngọc; node chưa khám phá xám; cơ duyên tím; chiến trận/nguy hiểm đỏ.
- Tab `Lân cận` là Dynamic Local BFS Constellation Tree, hiển thị tối đa 39 node quanh vị trí hiện tại; node được chọn bằng BFS trên gameplay graph thật.
- Cạnh `map-path` chỉ được render giữa hai node đã tồn tại và được `locationExits()` xác nhận là kề nhau theo Oxy. Ô chưa sinh không được vẽ như một cạnh thật.
- Mỗi node luôn có bốn action `act_move_<direction>`; ô Oxy hợp lệ được lazy-generate qua cùng movement handler, còn hướng ngoài biên bị khóa.
- Mọi tông môn, tổ chức, phường thị và điểm khởi đầu/tái sinh phải có địa chỉ Oxy ổn định thông qua `WORLD_MAP.addresses`.
- Cấp tổ chức càng cao thì ghim càng lớn.
- Có hai lớp xem: `Thiên Đồ` cho toàn thế giới và `Lân Cận` cho các node có thể di chuyển.
- Hỗ trợ zoom bằng nút và con lăn, pan bằng kéo, điều hướng bằng bàn phím/chuột, và trạng thái focus rõ ràng.

## Hệ thống UI chung

- Header hiển thị thời gian và trạng thái lưu nhưng không lấn át nội dung.
- Tab được nhóm theo ngữ cảnh, trạng thái active có dấu hiệu màu và đường nhấn bên trái.
- Card, modal, log, action và phường thị dùng chung nền glass-nebula, border mờ, radius và focus ring.
- Màu không thay thế nội dung: trạng thái quan trọng vẫn phải có nhãn/chữ mô tả.
- Mobile chuyển toolbar bản đồ và action thành các hàng cuộn/stack, không làm mất thao tác chính.

## Tiêu chí nghiệm thu

- Không có feature nào dùng palette hoặc typography biệt lập không có lý do.
- Bản đồ có thể nhận biết vị trí hiện tại, đường đi, vùng chưa biết và biến động chỉ bằng một lần quét mắt.
- Mọi nút tương tác có hover/focus/disabled state và không phụ thuộc riêng vào màu.
- Regression phải đạt `verify_game`, `verify_log_narrative`, syntax check và UTF-8 audit.


### Source: `archive-requirements\logic-history\IMPLEMENTATION_CANONICAL_MAP_LOG_DICHI_2026-09-16.md`

# Canonical implementation note — Map, NPC, Novel Log và Dị Chí

Encoding: UTF-8 (không dùng ANSI; file được đọc bằng UTF-8 và giữ BOM nếu hệ
soạn thảo yêu cầu). Đây là requirement bổ sung để khóa các khoảng trống logic
được phát hiện khi áp dụng audit ngày 2026-09-14.

## Runtime contract

- Mọi save có `pathState` và `specialPhysiqueState`; migration chỉ khởi tạo
  state rỗng, không tự unlock.
- Dị Thể không roll khi tạo nhân vật. Gameplay event gọi
  `recordSpecialPhysiqueProgress`; người chơi phải claim một ứng viên duy nhất.
- `WORLD_MAP.nodePool`/`openWorld.coordinateIndex` là registry spatial additive;
  node procedural có `regionId`, `mapNodeType`, `subLocations` và reciprocal exits.
- NPC hiện diện được resolve theo `npcState.currentNodeId`; dialogue và quest
  không được suy ra chỉ từ tên NPC.
- Mọi player-visible log đi qua `narrativeSafe`; event debug-only mới được giữ
  command echo và mã nội bộ.
- Archive log là queue retry độc lập, không được làm thất bại hoặc chặn action
  gameplay khi IndexedDB unavailable.

## Determinism và tương thích

Các resolver dùng save state, ngày game và event key; deserialize save cũ phải
idempotent. Các field mới đều additive, và các thay đổi map/NPC/log không được
thay đổi schema dữ liệu tĩnh hiện có.
---

## AMENDMENT 2026-09-16 — PHẠM VI TRIỂN KHAI BỔ SUNG

Tên canonical của nhánh thể chất/thức tỉnh là **Dị Thể**. Map V2/interaction là trọng tâm còn thiếu: influence gradient, fog, completion, node history, sub-location và travel weighting phải nối qua resolver runtime canonical. Tab Thế giới quản lý Công Trình, gồm Truyền Tống Trận và Hộ Giới Đại Trận. Con Đường Ẩn và Nghề Ẩn tách namespace; Nghề Ẩn chỉ là nghề phụ mở bằng Cổ Tịch Tà Thần sau khi nghề chính đã khóa.

Log phải novel style và gộp các event cùng ngày/tháng/cùng scene thành một đoạn văn.


### Source: `archive-requirements\logic-history\MAP_COMPLETE_ARMY_ATMOSPHERE.md`

# HỆ THỐNG BẢN ĐỒ HOÀN CHỈNH — TỔNG HỢP + BINH ĐOÀN + WORLDVIEW ATMOSPHERE TRIỆT ĐỂ
> Tài liệu tổng hợp TOÀN BỘ yêu cầu bản đồ đã đưa ra trước đó (`MAP_SYSTEM.md`,
> `MAP_SYSTEM_V2_COMPLETE.md`, `WORLD_INTERCONNECTION_SYSTEM.md`, `MAP_INTERACTION_ADDONS.md`,
> `RANDOM_EVENT_SYSTEM.md`, `ACTION_PRIORITY_RESOLUTION_FIX.md`, cộng kiến trúc Oxy/Constellation/
> Exploration đã upload) + 2 PHẦN MỚI theo yêu cầu lần này: **Binh Đoàn** (chưa từng thiết kế) và
> **Worldview Atmosphere áp dụng triệt để lên MỌI lớp bản đồ** (trước đây chỉ chạm tới vùng Dị Biến/
> thời tiết, giờ phủ toàn bộ).

---

## PHẦN A — KIẾN TRÚC NỀN (TÓM TẮT, chi tiết đầy đủ xem file nguồn)

| Lớp | Nội dung | Nguồn chi tiết |
|---|---|---|
| Tọa độ Oxy + sinh node lazy 4 hướng | Grid vô hạn, node runtime sinh khi cần, complete graph di chuyển tự do | Oxy Coordinate Requirement (đã upload) |
| Hiển thị Constellation (chòm sao) | Cosmic/Region/Local/Close 4 mức LOD, fog Unexplored/Discovered/Visited/Locked | Constellation Map Requirement (đã upload) |
| Thám Hiểm theo phiên | `explorationSite`, `pendingExploration`, chain stage, NPC dẫn dấu | Exploration Search Requirement (đã upload) |
| Ảnh hưởng Tổ Chức theo gradient | `organizationCoverageSnapshot` thay vì sở hữu nhị phân, contested zone | `MAP_SYSTEM_V2_COMPLETE.md` mục 3 |
| Node Detail (Lớp 3 — bên trong 1 node) | subLocations, NPC gắn đúng vị trí nhỏ | `MAP_SYSTEM_V2_COMPLETE.md` mục 2 |
| Thời tiết | 6 loại, lan truyền mặt trận, ảnh hưởng travel/combat/NPC/Faction War | `MAP_SYSTEM_V2_COMPLETE.md` mục 10 |
| Action Priority theo Tầng | Tầng 0 (pending Cơ Duyên/combat) chặn hết Tầng 1-3 | `ACTION_PRIORITY_RESOLUTION_FIX.md` |
| Asterism/Nhật Ký Địa Danh/Tuyến Thương Mại/Quest Line/Node Resonance | 6 bổ sung tương tác | `MAP_INTERACTION_ADDONS.md` |

Phần A KHÔNG lặp lại chi tiết — 2 phần B/C dưới đây mới là nội dung MỚI cần thiết kế đầy đủ.

---

## PHẦN B — BINH ĐOÀN (ARMY) — HỆ THỐNG HOÀN TOÀN MỚI

Hiện tại Chiến Tranh giữa 2 Thế Lực (`WORLD_INTERCONNECTION_SYSTEM.md` mục 2.2) chỉ là CÔNG THỨC
trừu tượng (`factionPower` so sánh, server tự giải quyết). Binh Đoàn biến nó thành THỰC THỂ SỐNG
trên bản đồ — người chơi THẤY quân đội di chuyển, không chỉ đọc kết quả trận đấu.

### B.1. Schema
```js
Army {
  id, organizationId, generalNpcId,          // vị tướng chỉ huy — 1 NotableNPC đã có
  position: { x, y },                         // tọa độ THẬT trên Constellation, không gắn cứng node
  soldierCount: number,
  eliteCount: number,                         // NPC named-tier trong đoàn quân
  morale: 0-100,
  status: "garrison" | "marching" | "sieging" | "in_battle" | "routed" | "disbanded",
  destinationNodeId: string | null,
  originOrganizationCoverageContribution: number  // đóng góp vào công thức factionPower khi garrison
}
```

### B.2. Vòng đời Binh Đoàn
```
[Faction đủ Tài Nguyên + Tension với đối thủ vượt ngưỡng chiến tranh] (đã có ở mục 2.1
WORLD_INTERCONNECTION_SYSTEM.md)
        │
        ▼
[Sinh 1 Army mới tại node Faction chính, status="garrison"]
        │
        ▼ (worldTick quyết định mục tiêu)
[status="marching" -> di chuyển THẬT theo tọa độ (x,y) mỗi ngày GameClock, tốc độ theo
 travelSpeed(travelType) đã có, CHỊU ẢNH HƯỞNG thời tiết như player (Tuyết làm quân hành quân chậm)]
        │
        ▼
[Đến node biên giới đối phương] -> status="sieging" (nếu node có phòng thủ) hoặc "in_battle" ngay
 (nếu 2 Army chạm nhau giữa đường — random theo vị trí thực tế, KHÔNG phải chỉ tính ở node)
        │
        ▼
[Giải quyết trận: so sánh (soldierCount × avgLevel + eliteCount × 5) giữa 2 bên, + modifier Tướng
 (generalNpcId Cảnh Giới), + modifier Thời Tiết, + modifier Địa Hình node]
        │
   ┌────┴────┐
   ▼         ▼
Thắng      Thua
   │         │
   ▼         ▼
morale +   morale -, status="routed" (rút lui về node gần nhất cùng phe, mất % soldierCount)
tiếp tục   
sieging/
chiếm node
```

### B.3. Tương tác Người Chơi với Binh Đoàn (điểm khác biệt cốt lõi so với chiến tranh trừu tượng cũ)
| Hành động | Điều kiện | Hiệu quả |
|---|---|---|
| **Gia Nhập Trận** | Player ở cùng node/tọa độ gần Army đang `in_battle`/`sieging` | Combat thật, thắng thì cộng thêm 1 "đơn vị elite" tạm thời vào công thức giải quyết trận (đã có ý tưởng này, giờ gắn vào Army thật thay vì chỉ vào factionPower chung) |
| **Trinh Sát** | Dùng action Quan Sát/Thám Hiểm khi Army địch còn xa | Lộ trước `soldierCount`/`morale` thật (không phải ước lượng) — dùng để quyết định có nên báo Faction mình phòng thủ trước không |
| **Phá Hoại** | Cần Thân Phận Giả hoặc Nghề Ẩn phù hợp | Giảm `morale`/`soldierCount` Army ĐỊCH trước khi giao tranh, không cần đánh trực diện |
| **Nhận Chỉ Huy Tạm Thời** | factionReputation đủ cao + quest chiến dịch cụ thể | Player TỰ QUYẾT hướng di chuyển 1 Army trong thời gian giới hạn — hiếm, chỉ mở ở cốt truyện lớn |

### B.4. Hiển thị trên Constellation Map
- Marker mới `⚔ Binh Đoàn` (cùng cấp độ với `🚩 Tuần Tra`/`☠ Quái`/`✦ Cơ Duyên` đã có) — di chuyển
  THẬT theo `position` mỗi ngày, khác Tuần Tra (di chuyển cố định theo edge đã biết trước).
  Icon đổi theo `status`: garrison (tĩnh, viền), marching (glow đuôi theo hướng di chuyển), in_battle
  (pulse đỏ mạnh, ưu tiên hiển thị cao nhất trong mọi marker cùng lúc).
- Khi 2 Army của 2 phe đối lập đủ GẦN nhau (trong bán kính X ô), Constellation Map tự vẽ 1 đường nối
  MÀU CẢNH BÁO (đỏ nhấp nháy) giữa 2 sao đó — báo hiệu trận đánh sắp xảy ra, cho người chơi cơ hội
  can thiệp TRƯỚC khi kết quả được server tự giải quyết.

---

## PHẦN C — WORLDVIEW ATMOSPHERE ÁP DỤNG TRIỆT ĐỂ LÊN MỌI LỚP BẢN ĐỒ

Hiện Atmosphere (`WORLDVIEW_ATMOSPHERE.md`) chỉ chạm: vùng Dị Biến, thời tiết Âm Vũ, Ambient Dread
random rời rạc. Yêu cầu lần này: PHỦ ĐỀU lên toàn bộ 4 lớp bản đồ + Binh Đoàn vừa thêm.

### C.1. Wrongness Gradient áp cho MỌI mô tả node/subLocation, không chỉ Dị Biến
```
Mọi node (kể cả node hoàn toàn bình thường, dangerLevel=1) khi render mô tả PHẢI chạy qua:
  WrongnessLevel = f(distanceFromOrigin, character.Corruption_Rating, character.SAN_ratio)
  (công thức đã có ở WORLDVIEW_ATMOSPHERE.md mục 2)

roll Ambient Dread injection (mục 3 file đó) theo ĐÚNG WrongnessLevel — áp dụng cho:
  - Mô tả node ở Lớp 2 (Constellation)
  - Mô tả TỪNG subLocation ở Lớp 3 (Node Detail) — HIỆN CHƯA CÓ, đây là lỗ hổng cần lấp: subLocation
    (chợ/sảnh/hẻm sau...) trước giờ chỉ có mô tả trung tính, giờ PHẢI random Ambient Dread riêng cho
    từng điểm nhỏ, độc lập với node cha (VD "Sảnh Chính" yên bình nhưng "Hẻm Sau" cùng node có thể
    roll ra câu bất an cao hơn hẳn — tạo chênh lệch không khí NGAY TRONG 1 node)
```

### C.2. Binh Đoàn/Chiến Trường mang màu sắc body-horror riêng (nối Phần B với Atmosphere)
```
Node vừa xảy ra "in_battle" (Phần B) → sau khi trận kết thúc, node đó TẠM THỜI (vài ngày GameClock)
mang mô tả "Chiến Trường" theo đúng nguyên tắc mục 12-13 WORLDVIEW_ATMOSPHERE.md (thuần thịt, chi
tiết giải phẫu cụ thể — KHÔNG mô tả chung chung "xác chết la liệt"):
  "Mặt đất nơi đây còn ướt, chưa kịp khô. Có những chỗ đất lún xuống bất thường, như thứ gì bên dưới
   vẫn chưa ngừng cựa quậy."

Node "Chiến Trường" TỰ ĐỘNG tăng % Corruption Spread lên node lân cận (đã có cơ chế ở MAP_SYSTEM.md
6.6, giờ thêm 1 NGUỒN KÍCH HOẠT MỚI: chiến trường là môi trường ươm mầm Dị Biến — đúng lore "chết
chóc hàng loạt hấp dẫn tàn niệm Cổ Thần" đã có từ spec gốc) — biến chiến tranh giữa 2 Faction thành
RỦI RO THẬT cho toàn vùng, không chỉ ảnh hưởng 2 bên tham chiến.
```

### C.3. Constellation Map — Wrongness ảnh hưởng CHÍNH HÌNH ẢNH ngôi sao (không chỉ text)
```
WrongnessLevel Cực Cao (mục 3 bảng Ambient Dread, ngưỡng 76-100) tại 1 vùng:
  -> Sao đại diện node/Army/NPC trong vùng đó có % nhỏ NHẤP NHÁY SAI MÀU trong 1 khung hình (đã note
     ở WORLDVIEW_ATMOSPHERE.md mục 3 "cực cao... luôn ảnh hưởng UI"), giờ áp CỤ THỂ: đổi màu sao từ
     xanh/trắng chuẩn sang tím/đỏ trong đúng 1 frame rồi tự sửa lại — không phải lỗi thật, là feature
     Unreliable Narrator (mục 4 file đó) áp trực tiếp lên chính thị giác bản đồ, không chỉ text.
```

### C.4. Binh Đoàn hành quân qua vùng Corruption cao — suy giảm Đạo Tâm/Morale tập thể
```
Army đi qua node có Corruption Spread cấp >= 3: morale giảm dần theo mỗi ngày hành quân qua vùng đó
(lính thường không có Corruption_Rating cá nhân như player, nhưng CHỈ HUY — generalNpcId — có, và
morale toàn quân chịu ảnh hưởng gián tiếp qua tâm lý vị tướng) — tạo lý do chiến lược thật để tránh
đường qua vùng Dị Biến khi hành quân, không chỉ nguy hiểm cho riêng player.
```

### C.5. Node "Nghe Đồn" (Cấp 1 sương mù) ưu tiên lan truyền tin đồn RÙNG RỢN trước tin thường
```
Khi 1 node chuyển sang fogState=1 "Nghe Đồn" (đã có ở MAP_SYSTEM_V2_COMPLETE.md mục 7), nếu node đó
đang có WrongnessLevel Trung bình trở lên, tin đồn ưu tiên mang màu sắc bất an ("Nghe nói vùng ấy dạo
này có tiếng khóc trẻ con giữa đêm, dù chẳng ai thấy đứa trẻ nào") thay vì tin trung tính ("Nghe nói
vùng ấy có 1 thị trấn nhỏ") — biến chính cơ chế Fog of War thành công cụ dựng không khí, không chỉ
cơ chế khám phá thuần túy.
```

---

## PHẦN D — SCHEMA TỔNG HỢP CUỐI CÙNG

```js
MapNode {
  ...(toàn bộ field đã có ở các file nguồn Phần A)...
  activeArmiesNearby: [armyId],        // MỚI — Army trong bán kính gần, dùng cho marker Phần B
  battlefieldState: {                   // MỚI — null nếu chưa từng là chiến trường
    isBattlefield: boolean, expiresAtTurn, corruptionSpreadBonus
  },
  subLocationWrongnessOverride: { [subLocationId]: number }  // MỚI — Phần C.1, độc lập node cha
}

Army { ...(Phần B.1)... }
```

---

## PHẦN E — VIỆC CẦN LÀM TIẾP (ưu tiên)
1. Binh Đoàn (Phần B) là hệ THỰC THỂ MỚI — nên làm SAU KHI world-tick + Faction War trừu tượng
   (`WORLD_INTERCONNECTION_SYSTEM.md` mục 2.2) đã chạy ổn định, vì Binh Đoàn về bản chất là "trực
   quan hóa" công thức đã có, không phải thay thế nó.
2. Phần C.1 (Wrongness cho subLocation) là việc RẺ NHẤT trong toàn bộ tài liệu này — chỉ cần chạy
   lại đúng hàm Ambient Dread đã có, roll thêm 1 lần cho từng subLocation thay vì chỉ 1 lần cho node
   cha. Nên làm NGAY, không phụ thuộc gì khác.
3. Phần C.2/C.4 (chiến trường/hành quân ảnh hưởng Corruption) phụ thuộc CẢ Binh Đoàn (B) lẫn
   Corruption Spread (đã có) — làm sau khi B ổn định.
4. Phần C.3 (hiệu ứng thị giác sao) là việc UI/rendering thuần túy, có thể làm độc lập song song bất
   kỳ lúc nào, không phụ thuộc phần nào khác trong tài liệu này.
5. Cân bằng số liệu Binh Đoàn (công thức giải quyết trận, tốc độ hành quân) cần playtest riêng —
   đề xuất tách 1 file test số liệu riêng trước khi gắn vào bản đồ chính, tránh 1 trận Binh Đoàn tệ
   làm hỏng cả vùng map do balance sai.


### Source: `archive-requirements\logic-history\MAP_INTERACTION_ADDONS.md`

# BỔ SUNG TƯƠNG TÁC BẢN ĐỒ — DỰA TRÊN KIẾN TRÚC OXY/CONSTELLATION/EXPLORATION ĐÃ CÓ
> Đọc kèm `MAP_OXY_COORDINATE_ARCHITECTURE_REQUIREMENT.md`,
> `OPEN_WORLD_COSMIC_CONSTELLATION_MAP_REQUIREMENT.md`,
> `EXPLORATION_SEARCH_SYSTEM_REQUIREMENT.md`. KHÔNG đề xuất lại thứ đã có (coverage/influence, fog 4
> cấp, weather, NPC patrol, edge zone action, exploration session) — chỉ bổ sung phần còn trống,
> dùng ĐÚNG schema/thuật ngữ đã chốt (`mapNodeType`, `regionId`, `WORLD_MAP.nodePool`,
> `coordinateIndex`, `organizationCoverageSnapshot`).

---

## 1. CHÒM SAO TỔ CHỨC (ASTERISM GROUPING) — tận dụng ĐÚNG ẩn dụ "chòm sao" đang dùng

**Vấn đề:** hiện tại mỗi node tổ chức là 1 sao độc lập trên Constellation Map; ở Region View, người
chơi thấy nhiều sao rời rạc thay vì CẢM NHẬN được "đây là lãnh thổ của 1 tổ chức".

**Đề xuất:**
```js
// Field mới trên tổ chức, KHÔNG đổi schema node đã có
Organization.asterismShape: [{ dx, dy }]  // hình dạng chòm sao tương đối, vẽ NỐI các node có
                                            // organizationId trùng nhau + coverage > ngưỡng
```
- Ở **Region View** (mục "Chòm sao và mức chi tiết" đã có), các node cùng `organizationId` với
  `organizationCoverageSnapshot() > threshold` được nối bằng 1 đường mảnh MÀU RIÊNG theo alignment
  (đã có sẵn bảng màu alignment) — tạo thành 1 "chòm sao" có tên (dùng tên tổ chức) hiện mờ khi zoom
  Region, đúng quy tắc "Nhãn cấp cao có thể hiển thị mờ ở zoom Vùng" đã có.
- KHÔNG cần field hình học phức tạp — chỉ cần: mọi node coverage > threshold của CÙNG 1
  `organizationId` tự động nối với NHAU (không cần thiết kế shape thủ công), thuật toán tối thiểu
  spanning tree là đủ để không rối mắt.

---

## 2. NHẬT KÝ ĐỊA DANH (NODE HISTORY LOG) — nối `incident` đã có thành sử liệu tích lũy

**Vấn đề:** `incident` hiện là pulse tạm thời (cam/đỏ, "thời gian hữu hạn") rồi biến mất — không có
nơi nào LƯU LẠI những gì đã xảy ra tại 1 node theo thời gian.

**Đề xuất:**
```js
WORLD_MAP.nodePool[nodeId].history: [
  { turn, type: "war"|"incident"|"notable_npc_visit"|"faction_change", summary, regionId }
]
```
- Mỗi khi 1 `incident` kết thúc, hoặc `organizationCoverageSnapshot()` đổi chủ node (chiến tranh có
  kết quả), hoặc 1 NPC nổi bật ghé qua lần đầu — ghi 1 dòng vào `history`.
- UI: khi zoom **Close view** (đã có 4 mức LOD), thêm 1 tab nhỏ "Sử Ký" trong panel node hiện ra —
  không phải feature mới tách biệt, chỉ là 1 tab bổ sung trong panel `Current Region View Model` đã
  định nghĩa sẵn.
- Giá trị: biến node từ "1 điểm chấm trên bản đồ" thành "1 nơi có quá khứ", đặc biệt hiệu quả với
  node runtime lazy-generated (mục 8 Oxy requirement) — những node này hiện KHÔNG có gì đặc biệt
  ngoài tên/terrain, `history` cho chúng lý do để người chơi quay lại.

---

## 3. TUYẾN THƯƠNG MẠI SỐNG (nâng cấp action "Mở tuyến thương mại" đã có ở Edge Zone)

**Vấn đề:** `edgeActions` đã có "Mở tuyến thương mại" nhưng chỉ là 1 action đơn (transaction contract
1 lần) — chưa mô tả tuyến đó VẬN HÀNH ra sao sau khi mở.

**Đề xuất:**
```js
TradeRoute {
  id, fromNodeId, toNodeId,   // 2 node đã có coordinate, dùng Manhattan distance có sẵn
  caravanPosition: { x, y },   // cập nhật mỗi turn, di chuyển dọc đường thẳng nối 2 tọa độ
  status: "active" | "raided" | "blockaded"  // "blockaded" tái dùng đúng khái niệm phong tỏa đã có
                                               // ở mục 11 Oxy requirement (chỉ modifier, không xóa liên kết)
}
```
- `caravanPosition` là 1 sao NHỎ di chuyển thật trên Constellation Map dọc route đã mở (khác NPC
  patrol edge đã có — đoàn buôn di chuyển theo ĐƯỜNG THẲNG tọa độ, không theo edge cố định).
- Player có thể "Hộ Tống" (tăng an toàn, nhận phí) hoặc gặp sự kiện "Bị Cướp" (nếu đi qua vùng
  `dangerLevel` cao dọc đường) — tái dùng nguyên bảng rủi ro/thời tiết đã có ở Exploration
  Requirement mục 4, không tạo bảng risk riêng.
- Tuyến thương mại bị cướp nhiều lần tự động chuyển `status: "blockaded"` — ảnh hưởng NGƯỢC lại
  `organizationCoverageSnapshot` của 2 tổ chức đầu tuyến (thương mại đứt = tài nguyên giảm = coverage
  giảm) — đóng vòng lặp kinh tế-lãnh thổ thay vì 2 hệ tách rời.

---

## 4. ĐƯỜNG NỐI CHUỖI NHIỆM VỤ (QUEST CONSTELLATION LINE)

**Vấn đề:** Constellation Map hiện chỉ vẽ route di chuyển (mảnh, mờ) — không có cách nào NHÌN THẤY
1 chuỗi quest đang trải dài qua nhiều node trên bản đồ.

**Đề xuất:**
```
Khi player có 1 quest chain ĐANG ACTIVE có >= 2 node liên quan (node nhận + node hoàn thành, hoặc
chuỗi world_discovery nhiều bước đã thiết kế trước) -> vẽ 1 đường nối ĐẬM HƠN route thường, màu
riêng theo questType (main_story/world_discovery/moral_choice), CHỈ hiện khi quest đó đang active
(tự ẩn khi hoàn thành/hủy).
```
- Đây là lớp HIỂN THỊ THUẦN TÚY (không đổi logic quest/travel/exploration đã có) — chỉ đọc lại
  `questLog` hiện có + `coordinate` của node liên quan, vẽ thêm 1 đường trên layer Constellation.
- Giải quyết đúng vấn đề UX: chuỗi quest `world_discovery` (thiết kế trước đó, cố ý KHÔNG hiện rõ
  trong quest log để giữ cảm giác khám phá) vẫn có thể "gợi ý mơ hồ" bằng 1 đường nối lờ mờ, KHÔNG
  ghi rõ tên quest — vừa giữ bí ẩn vừa tránh cảm giác lạc lối hoàn toàn.

---

## 5. NODE "CỘNG HƯỞNG" VỚI CON ĐƯỜNG NGƯỜI CHƠI (Path Resonance Marker)

**Vấn đề:** `searchable` (tài nguyên có thể tìm ở node, đã có trong schema) hiện không phân biệt gì
theo Con Đường người chơi đang đi — mọi node như nhau với mọi Con Đường.

**Đề xuất:**
```js
// Không đổi schema node — chỉ thêm 1 bước TÍNH TOÁN PHÍA CLIENT khi render:
nodeResonance(node, character) = matchScore giữa node.searchable/node.terrain (tra qua tags đã có
  ở hệ Mệnh Số/Con Đường — dùng LẠI bảng lead/support/forbidden tags, không tạo bảng mới) và
  character.currentPathId
```
- Node có `nodeResonance` cao hiện thêm 1 GLOW PHỤ nhẹ (không đổi hình dạng sao, đúng nguyên tắc
  "Event/war/patrol dùng badge nhỏ, không thay đổi hình dạng sao quá mạnh" đã có) — gợi ý MƠ HỒ
  "nơi này có gì đó hợp với con đường ngươi" mà không spoil chính xác cái gì.
- Đặc biệt hữu ích với node runtime lazy-generated (vô số node hoang dã sinh ra khi khám phá) — cho
  người chơi 1 tín hiệu ĐỊNH HƯỚNG giữa thế giới mở rộng lớn, tránh cảm giác đi lung tung vô định.

---

## 6. TRẠM QUAN SÁT HOÀN THIỆN CHÒM SAO (Exploration Completion Tracker)

**Vấn đề:** ẩn dụ "từng mảnh chòm sao được nối lại" đã có trong yêu cầu gốc nhưng chưa có thước đo
CỤ THỂ cho người chơi thấy tiến độ này.

**Đề xuất:**
- 1 chỉ số % đơn giản ở góc UI bản đồ: `visitedLocations.length / totalKnownNodesInRegion` — CHỈ
  tính node đã sinh ra thực sự (không tính node lazy chưa từng generate, tránh số ảo vô nghĩa với
  thế giới vô hạn).
- Đạt mốc % nhất định trong 1 `regionId` (VD 80%) → mở 1 danh hiệu (đã có hệ Danh Hiệu ở nhóm D
  trước đó) "Người Vẽ Bản Đồ [Tên Vùng]" — không cần thưởng cơ chế mạnh, chỉ là cột mốc ghi nhận.

---

## 7. VIỆC CẦN LÀM TIẾP
1. Mục 1 (Asterism) và mục 6 (Completion Tracker) là THUẦN HIỂN THỊ (đọc data có sẵn, không đổi
   logic gameplay) — nên làm trước vì rẻ nhất, không đụng vào contract `startTravel()`/exploration
   đã ổn định.
2. Mục 3 (Tuyến Thương Mại sống) phức tạp nhất — cần thêm 1 "tick" riêng cập nhật `caravanPosition`
   mỗi turn, nên làm SAU KHI đã có vòng lặp thế giới dạng tick ổn định (nếu đã implement từ trước)
   — không nên là vòng lặp độc lập thứ 2 chạy song song gây khó đồng bộ.
3. Mục 5 (Node Resonance) cần bảng tags Con Đường đã dùng cho Mệnh Số (đã có, tái dùng) — chỉ cần
   viết hàm tính, không cần data mới.
4. Mục 2 và mục 4 nên làm cùng đợt vì cùng đụng vào panel `Current Region View Model` đã có sẵn —
   tránh sửa panel này 2 lần riêng biệt.


### Source: `archive-requirements\logic-history\MAP_SYSTEM_V2_COMPLETE.md`

# MAP SYSTEM V2 — THIẾT KẾ TOÀN DIỆN CHO OPEN WORLD THỰC SỰ
> Thay thế/hợp nhất `MAP_SYSTEM.md` + phần bản đồ trong `WORLD_INTERCONNECTION_SYSTEM.md` mục 1-4.
> Vấn đề cốt lõi cần sửa: bản đồ hiện tại vẫn là "node-graph có sinh procedural" nhưng CẢM GIÁC như
> danh sách hộp nối nhau, không phải thế giới sống — thế lực không thật sự "chiếm không gian", người
> chơi không có công cụ định hình bản đồ, di chuyển không có trọng lượng.

---

## 1. KIẾN TRÚC 4 LỚP BẢN ĐỒ (thay vì 1 lớp node-graph phẳng)

```
Lớp 1 — THẾ GIỚI (World Map):     tổng quan toàn vùng, hiện vùng ảnh hưởng Faction dạng heatmap,
                                    dùng để lên kế hoạch di chuyển xa, KHÔNG hiện chi tiết từng node
Lớp 2 — VÙNG (Regional Map):       chính là node-graph hiện có (grid tọa độ x,y từ MAP_SYSTEM.md 6),
                                    đây là lớp chơi chính hàng ngày
Lớp 3 — ĐỊA ĐIỂM (Node Detail):    MỚI — bấm vào 1 node đã khám phá, mở ra sub-map các điểm nhỏ BÊN
                                    TRONG node đó (chợ/sảnh chính/hẻm sau/kho...), NPC đứng ở ĐÚNG
                                    điểm nhỏ cụ thể, không còn "cả node là 1 hộp mờ"
Lớp 4 — INSTANCE (Bí Cảnh/Mộng Cảnh/Nội thất Động Phủ): tách biệt hoàn toàn khỏi lưới chính, đã có
                                    khung ở các tài liệu trước, giữ nguyên
```
Đây là thay đổi NỀN TẢNG quan trọng nhất — giải quyết trực tiếp cảm giác "chưa phải open world thật"
vì trước giờ chỉ có Lớp 2, khiến mọi node dù to (Vương Kinh) hay nhỏ (trạm gác) đều cảm giác như
nhau (1 hộp bấm vào là xong).

---

## 2. LỚP 3 CHI TIẾT — NODE DETAIL VIEW (giải quyết "node là hộp rỗng")

```
NodeDetailLayout {
  nodeId,
  subLocations: [
    { id, name, type: "market"|"hall"|"alley"|"warehouse"|"gate"|"shrine"|"training_ground",
      npcsPresent: [npcId], actionsAvailable: [...], visualTag }
  ]
}
```
- Số lượng `subLocations` tùy quy mô node: Trạm gác nhỏ = 1-2 điểm; Tông Môn/Vương Kinh lớn = 5-8
  điểm khác nhau.
- NPC giờ gắn vào ĐÚNG 1 `subLocation` cụ thể (không còn "NPC ở node" mơ hồ) — Trưởng Lão ở "Sảnh
  Chính", Thương Nhân ở "Chợ", gián điệp/Ma Đầu thường xuất hiện ở "Hẻm Sau" (dùng đúng ý tưởng Mật
  Hội đã thiết kế, giờ có VỊ TRÍ CỤ THỂ để player phải chủ động tới đúng chỗ mới bắt gặp).
- Action Bar tại Lớp 3 chỉ hiện action liên quan tới `subLocation` đang đứng (VD "Chợ" mới có Giao
  Dịch, "Hẻm Sau" mới có Điều Tra Mật Hội) — biến việc di chuyển TRONG 1 node cũng có ý nghĩa chọn
  lựa, không chỉ di chuyển GIỮA các node.

---

## 3. LÃNH THỔ THEO GRADIENT (KHÔNG CÒN NHỊ PHÂN SỞ HỮU/KHÔNG SỞ HỮU)

### 3.1. Vùng Ảnh Hưởng (Influence Radius) thay vì `ownerFactionId` cứng
```
Mỗi Faction node (Tông Môn/Thế Gia chính) phát ra "sức ảnh hưởng" giảm dần theo khoảng cách:
  influenceAt(node, faction) = faction.power × decayFactor^(distance(node, faction.homeNode))
  // decayFactor ví dụ 0.7 — mỗi ô xa thêm, ảnh hưởng còn 70% ô trước

Mỗi node THƯỜNG (không phải Faction chính) có `influenceMap: { factionId: number }` — TÍNH LẠI mỗi
worldTick, không cố định. `ownerFactionId` cũ giờ SUY RA từ influenceMap (Faction có influence cao
nhất tại node đó > ngưỡng nào đó mới được coi là "chủ", nếu không ai vượt ngưỡng -> node "vô chủ
thực sự", không phải mặc định thuộc về Faction gần nhất).
```

### 3.2. Vùng Tranh Chấp (Contested Zone) — hệ quả trực tiếp của gradient
```
Node có 2+ Faction cùng influence gần bằng nhau (chênh lệch < 15%) -> đánh dấu "Tranh Chấp":
  - `eventPoolTag` đổi thành hỗn hợp (trộn trọng số sự kiện của CẢ 2 Faction liên quan)
  - Cả 2 Faction đều có thể giao nhiệm vụ TẠI node này (dù không "sở hữu" chính thức)
  - Player hoàn thành quest cho 1 bên tại đây sẽ đẩy influence bên đó lên — GIÚP NGƯỜI CHƠI THỰC SỰ
    ĐỊNH HÌNH BẢN ĐỒ bằng hành động, không chỉ đứng xem thế lực tự chiến tranh (đã có ở
    WORLD_INTERCONNECTION_SYSTEM.md mục 2.2, giờ có thêm 1 con đường ẢNH HƯỞNG MỀM song song
    chiến tranh trực diện)
```

### 3.3. Bản đồ Heatmap ở Lớp 1 (World Map)
Hiện màu chồng lấp theo `influenceMap` tổng hợp toàn vùng — người chơi nhìn Lớp 1 thấy NGAY "vùng
này đang là của ai, vùng nào đang tranh chấp nóng" mà không cần bấm từng node ở Lớp 2.

---

## 4. NGƯỜI CHƠI ĐỊNH HÌNH BẢN ĐỒ (MAP AGENCY — hiện hoàn toàn thụ động)

### 4.1. Cắm Cờ/Lập Trạm (Claim Outpost)
```
Tại 1 node VÔ CHỦ THỰC SỰ (không Faction nào vượt ngưỡng influence, mục 3.1), player có action mới
"Lập Trạm" — cần Linh Thạch + thời gian (vài ngày GameClock), sau đó:
  - Node đó có `ownerFactionId = "player_outpost_" + characterId` (player CHÍNH THỨC là 1 thực thể
    có lãnh thổ trên bản đồ, không chỉ có Động Phủ đơn lẻ)
  - Tự phát ra influence NHỎ quanh nó (dùng công thức mục 3.1, `power` thấp hơn Faction thật nhiều)
  - Có thể bị Faction khác "lấn" nếu không củng cố (đúng cơ chế gradient, không phải bất tử)
```

### 4.2. Xây Dựng Tại Trạm/Động Phủ (Structure Building)
| Công trình | Hiệu ứng lên bản đồ |
|---|---|
| Vọng Gác (Watchtower) | Tăng bán kính `revealAdjacentNodes` (MAP_SYSTEM.md mục 2) quanh trạm — nhìn xa hơn mà không cần tự đi |
| Trạm Dịch (Waystation) | Thêm 1 điểm Fast Travel (mục 5) miễn phí tại đây |
| Thị Tập Nhỏ (Trading Post) | NPC Thương Nhân tự động ghé qua theo lịch (dùng `scheduleType: itinerant` đã có), không cần player chủ động tìm |
| Trận Pháp Phòng Thủ | Tăng "power" phát influence của trạm (đã nối ở `PHAC_THAO_TU_VI_CON_DUONG_V3.md` — Trận Pháp Sư nghề mới) |

### 4.3. Tuyên Bố Chủ Quyền Lên Faction Thật (Territory Petition)
Nếu player đang phục vụ 1 Faction (đã gia nhập), có thể "hiến" 1 Trạm của mình cho Faction đó —
Trạm trở thành lãnh thổ chính thức của Faction (tăng `power` gốc của Faction đó lâu dài), đổi lại
Cống Hiến/factionReputation tăng vọt — biến việc mở rộng bản đồ cá nhân thành ĐÓNG GÓP thực sự cho
tổ chức mình chọn, không phải 2 hệ thống tách rời.

---

## 5. DI CHUYỂN CÓ TRỌNG LƯỢNG (TRAVEL AS MEANINGFUL MECHANIC)

### 5.1. Chi phí di chuyển thật (không còn tức thời vô hạn)
```
travelTimeGameDays = distance(from, to) / travelSpeed(travelType)
  travelType "walk" (mặc định): speed chuẩn
  travelType "ngự_khí" (cần Công Pháp/Thân Pháp phù hợp): speed ×3
  travelType "truyền_tống_trận": tức thời NHƯNG cần đã có Trạm Dịch/Fast Travel ở CẢ 2 đầu (mục 4.2)

Trong lúc di chuyển nhiều ngày: roll sự kiện dọc đường theo ĐÚNG cơ chế đã có
(RANDOM_EVENT_SYSTEM.md mục 1, trigger "moving_through"), nhưng giờ SỐ LẦN ROLL tỷ lệ với số ngày
di chuyển thực (đi càng xa càng nhiều cơ hội/rủi ro dọc đường, không phải 1 lần duy nhất bất kể xa
gần như hiện tại).
```

### 5.2. Fast Travel — mở dần, không có sẵn từ đầu
```
Điểm Fast Travel CHỈ tồn tại tại: node cốt truyện đã khám phá LẦN ĐẦU (tự động unlock), hoặc Trạm
Dịch do player/Faction xây (mục 4.2). Di chuyển bằng Fast Travel giữa 2 điểm đã unlock: tốn Linh
Thạch (không tốn ngày GameClock), KHÔNG roll sự kiện dọc đường (an toàn tuyệt đối, đó là cái giá
Linh Thạch phải trả) — tạo lựa chọn rõ ràng: đi bộ (rẻ, chậm, rủi ro/cơ hội) vs Fast Travel (đắt,
nhanh, an toàn).
```

### 5.3. Đoàn Đồng Hành Giảm Rủi Ro
Nếu có NPC "hộ tống" (thuê tại Phường Thị hoặc Faction cử theo nếu Cống Hiến đủ cao) đi cùng trong
chuyến di chuyển dài, giảm % sự kiện Quái Vật/Hắc Đạo dọc đường — chi phí thuê tỷ lệ với độ dài
quãng đường, tạo lựa chọn kinh tế thật (tự đi rẻ nhưng rủi ro, thuê hộ tống đắt nhưng an toàn hơn).

---

## 6. THẾ LỰC HIỆN DIỆN THẬT TRÊN BẢN ĐỒ (không chỉ là con số ẩn)

### 6.1. Đội Tuần Tra Di Động (Patrol Icons)
NPC lính/đệ tử tuần tra (đã có `scheduleType: patrol`) giờ hiển thị NGAY TRÊN BẢN ĐỒ LỚP 2 dưới dạng
1 icon nhỏ DI CHUYỂN DỌC EDGE giữa các node theo lịch trình thật (không phải chỉ xuất hiện khi
player tình cờ ở cùng node) — người chơi nhìn bản đồ thấy được "vùng này đang có bao nhiêu lính
tuần tra qua lại", tạo cảm giác lãnh thổ được BẢO VỆ THẬT chứ không phải nhãn dán.

### 6.2. Kiến Trúc Node Đổi Theo Chủ Sở Hữu
Node do Faction Chính Đạo sở hữu vs Hắc Đạo vs vô chủ có visualTag khác nhau (không cần chi tiết đồ
họa, chỉ cần field mô tả đổi: "Cổng Tông Môn uy nghiêm" vs "Trại lán xiêu vẹo của sơn tặc" vs "Tàn
tích hoang phế không người canh giữ") — đọc mô tả node là biết ngay tính chất khu vực.

### 6.3. Bảng Tin Faction (Bulletin Board) tại node Faction sở hữu
Hiện danh sách `faction_daily` quest hiện tại CỦA FACTION ĐÓ ngay khi player vào node (không cần
tìm NPC cụ thể mới thấy quest) — đồng thời hiện "Tin Tức Vùng" (world event gần đây liên quan
Faction này: thắng/thua trận nào, Bí Cảnh nào sắp mở) — biến node Faction thành điểm THÔNG TIN
trung tâm, không chỉ điểm giao dịch/nhiệm vụ.

---

## 7. SƯƠNG MÙ CHIẾN TRANH — 4 CẤP ĐỘ (thay vì chỉ discovered=true/false)

| Cấp | Tên | Điều kiện | Hiển thị |
|---|---|---|---|
| 0 | Chưa Biết | Chưa từng nghe nói | "Chưa khám phá" (như hiện tại) |
| 1 | Nghe Đồn | NPC tại node lân cận nhắc tới (qua hội thoại/Bảng Tin mục 6.3) NHƯNG chưa tới | Hiện TÊN node (không còn ẩn hoàn toàn) + mô tả mơ hồ 1 câu, vị trí gần đúng trên Lớp 1 nhưng KHÔNG hiện trên Lớp 2 grid chính xác |
| 2 | Đã Khám Phá | Đã từng tới | Đầy đủ như thiết kế gốc |
| 3 | Thông Thuộc | Tới >= 5 lần HOẶC có Trạm/Động Phủ tại đây | Mở thêm: nhìn thấy `subLocations` (Lớp 3) NGAY TỪ Lớp 2 không cần bấm vào, và thấy `influenceMap` chi tiết (không chỉ chủ sở hữu chính) |

Cấp 1 "Nghe Đồn" là bổ sung MỚI quan trọng — giải quyết cảm giác thế giới mở hiện tại "hoặc biết 100%
hoặc không biết gì" khá cứng, giờ có trạng thái trung gian tạo động lực THẬT SỰ muốn đi tới (đã
nghe tên, tò mò muốn xác nhận) thay vì random hoàn toàn mù mờ.

---

## 8. SCHEMA TỔNG HỢP (cập nhật `MapNode` đã có ở `MAP_SYSTEM.md` mục 1 và 6.7)

```
MapNode {
  ...(giữ nguyên toàn bộ field cũ: id, nodeType, regionTag, x, y, isProcedural, dangerLevel,
      linhKhiDensity, eventPoolTag, cooldownUntil, claimedByPlayerId)...

  fogState: 0-3,                          // thay thế `discovered: boolean` cũ (mục 7)
  influenceMap: { factionId: number },     // thay thế `ownerFactionId` tĩnh (mục 3.1) — ownerFactionId
                                            // giờ là GETTER tính từ influenceMap, không lưu trực tiếp
  subLocations: NodeDetailLayout | null,    // null nếu node quá nhỏ để cần Lớp 3 (mục 2)
  patrolSchedule: [{ npcId, fromNode, toNode, cycleHours }],  // mục 6.1
  playerStructures: [{ type, builtByCharacterId, builtAt }],   // mục 4.2
  fastTravelUnlocked: boolean,              // mục 5.2
}
```

---

## 10. HỆ THỐNG THỜI TIẾT (WEATHER SYSTEM) — TÍCH HỢP SÂU VÀO MỌI MỤC TRÊN

### 10.1. 6 Loại Thời Tiết (5 hệ Ngũ Hành + 1 loại horror riêng)

| Thời tiết | Hệ liên quan | Ảnh hưởng chính |
|---|---|---|
| **Quang Đãng** | Trung tính | Baseline, không modifier gì — trạng thái mặc định |
| **Vũ (Mưa)** | Thủy | Combat: +10% hiệu quả Công Pháp hệ Thủy, -10% hệ Hỏa. Di chuyển: speed ×0.8. `linhKhiDensity` +10% (mưa nuôi dưỡng linh khí) |
| **Sương Mù** | Trung tính (che khuất) | `fogState` khó tăng từ 0→1 hơn (mục 7, -30% cơ hội "Nghe Đồn" lan tới trong sương mù). Di chuyển: +15% cơ hội bị phục kích. Corruption Spread (MAP_SYSTEM.md 6.6): +10% tốc độ lan (sương che giấu Dị Biến đang lan) |
| **Bão Linh Khí** | Hỗn loạn | Combat: MỖI NGÀY random 1 hệ được +20%/1 hệ bị -20% (đổi mỗi ngày, không đoán trước được). Di chuyển: travelType "ngự_khí" bị VÔ HIỆU HÓA (quá nguy hiểm để phi hành). `linhKhiDensity` +30% NHƯNG Tẩu Hỏa Nhập Ma risk (PHAC_THAO_TU_VI_CON_DUONG_V3.md mục 3) +10% |
| **Tuyết** | Thổ/Kim | Combat: +10% hệ Thổ/Kim, -10% hệ Mộc. Di chuyển: speed ×0.6 (chậm nhất). Patrol Schedule (mục 6.1) TẠM DỪNG — lính tuần tra trú ẩn. `dangerLevel` hiệu lực -1 (quái vật cũng trú đông, nghịch lý AN TOÀN hơn) |
| **Âm Vũ** (hiếm, chỉ ban đêm GameClock HOẶC vùng Corruption cao) | Âm/Tà | Ambient Dread `WrongnessLevel` +2 bậc trong suốt thời gian hiệu lực. Corruption Spread tốc độ ×2. Tăng % Tà Thần "dòm ngó" (đã có ở WORLDVIEW_ATMOSPHERE.md mục 16). NGOẠI LỆ: Con Đường Âm Luật Đạo nhận +15% hiệu quả tu luyện trong Âm Vũ (đúng thiên hướng) |

### 10.2. Thuật Toán Sinh Thời Tiết (lan truyền như mặt trận, không random độc lập từng vùng)
```
Mỗi worldTick (1 ngày game), với MỖI Vùng (regionTag):
  baseWeights = seasonalWeightTable[currentSeason][regionTag]   // đã có khung ở mục J.3
                                                                  // (PHAC_THAO_TINH_NANG_MOI_V2.md)
  neighborBias = với mỗi Vùng LÂN CẬN (kề trên bản đồ Lớp 1):
      nếu neighborWeather == "bao_linh_khi" hoặc "am_vu" -> +20% cơ hội Vùng này CŨNG chuyển sang
      loại đó trong 1-3 ngày tới (mô phỏng "mặt trận thời tiết" lan tỏa, không phải mỗi ô random
      độc lập — tạo cảm giác thời tiết THẬT có tính liên tục trên bản đồ)
  finalWeather = roll theo (baseWeights + neighborBias)
  Nếu finalWeather ĐỔI so với hôm qua -> ghi 1 dòng Story Panel tự động cho player đang ở vùng đó
  ("Trời bắt đầu đổ mưa." / "Sương mù dày đặc bao trùm.")
```

### 10.3. Dự Báo Thời Tiết (nối vào Xem Quẻ đã phác thảo — mục J.1)
NPC "Toán Mệnh Sư" có thể dự báo thời tiết 1-3 ngày tới — độ chính xác = f(Aptitude của NPC đó), có
thể SAI (không phải Oracle hoàn hảo, đúng tinh thần Unreliable Narrator) — dùng để lên kế hoạch: né
Bão Linh Khí trước khi Đột Phá (tránh Tẩu Hỏa Nhập Ma cộng dồn), hoặc tận dụng Âm Vũ nếu đi Âm Luật
Đạo.

### 10.4. Thời Tiết × Faction War (mục 2.2 ở `WORLD_INTERCONNECTION_SYSTEM.md`)
```
Nếu Tuyết hoặc Bão Linh Khí cường độ >= 4 tại vùng đang Chiến Tranh:
  -> "Đình Chiến Tạm Thời" — server KHÔNG giải quyết trận nào tại vùng đó cho tới khi thời tiết dịu
     (quân đội 2 bên đều không thể hành quân) — tạo nhịp nghỉ tự nhiên cho các cuộc chiến kéo dài,
     tránh chiến tranh gõ liên tục không ngừng nghỉ.
```

### 10.5. Thời Tiết × NPC (mục 3.1 `WORLD_INTERCONNECTION_SYSTEM.md` — NPC lịch trình)
```
Khi thời tiết cường độ >= 3 (bất kỳ loại xấu nào): NPC `scheduleType: itinerant` TẠM DỪNG di chuyển
tự do, thay vào đó di chuyển tới node Faction gần nhất để "trú ẩn" — tạo hiện tượng NHIỀU NPC dồn
về CÙNG 1 node trong thời gian xấu trời, tăng khả năng player chứng kiến tương tác NPC-NPC (mục 3.2
đã thiết kế) chỉ vì cùng tránh bão tại 1 chỗ — thời tiết trở thành CHẤT XÚC TÁC xã hội, không chỉ
cản trở.
```

### 10.6. Hiển Thị Thời Tiết Trên Bản Đồ
- Lớp 1 (World Map): overlay animation nhẹ theo Vùng (mưa/tuyết/sương phủ lên toàn Vùng đang chịu
  ảnh hưởng), có thể thấy "mặt trận" thời tiết đang di chuyển qua các Vùng lân cận theo mục 10.2.
- Lớp 2 (node cụ thể): icon nhỏ góc node phản ánh thời tiết Vùng đang áp dụng.
- Node Detail (Lớp 3, mục 2): nếu `subLocation.type == "outdoor"` (chợ ngoài trời, cổng...), mô tả
  tự động thêm 1 câu theo thời tiết hiện tại; `subLocation.type == "indoor"` (sảnh chính, kho) KHÔNG
  bị ảnh hưởng mô tả — tạo lý do cơ học để chọn subLocation trong nhà lúc trời xấu.

### 10.7. Thời Tiết Là Nguồn Thiên Tai Thường (nối L.1 đã phác thảo)
```
Nếu Bão Linh Khí duy trì cường độ 5 liên tục >= 3 ngày tại 1 Vùng -> tự động trigger 1 "Thiên Tai
Thường" (L.1, PHAC_THAO_TINH_NANG_MOI_V2.md) tại 1 node ngẫu nhiên trong Vùng đó — không phải sự
kiện độc lập nữa mà là HỆ QUẢ TỰ NHIÊN của thời tiết cực đoan kéo dài, logic nhân-quả rõ ràng thay
vì random vô căn cứ.
```

---

## 11. LÀM RÕ THÊM CHI TIẾT CÁC MỤC TRƯỚC (theo yêu cầu "càng chi tiết càng tốt")

### 11.1. Công thức `faction.power` đầy đủ (dùng trong mục 3.1 và Faction War)
```
faction.power = (Cảnh Giới cao nhất trong Faction × 10)
              + (Quy Mô đã có ở Xianxin_map.md 5.1 × 5)
              + (Tổng Tài Nguyên: Linh Thạch+Linh Mạch+Đan Dược+Pháp Bảo, mỗi loại × 0.5)
              + (số node đang sở hữu thực tế theo influenceMap × 3)
              - (nếu có trait "Đang suy tàn": ×0.7 toàn bộ power)
              + (nếu có trait "Đang trỗi dậy": ×1.3 toàn bộ power)
              × (0.5 nếu đang chịu Đình Chiến do thời tiết mục 10.4 — quân lực không phát huy được)
```

### 11.2. Bảng số lượng/loại `subLocations` theo `nodeType` (mục 2)
| nodeType | Số subLocations | Loại điển hình |
|---|---|---|
| `tong_mon` (lớn) | 6-8 | Sảnh Chính(indoor), Chợ Nội Môn(outdoor), Hẻm Sau(outdoor), Kho Tàng Trữ(indoor), Đài Luyện Công(outdoor), Thư Viện(indoor) |
| `thanh_tran` | 3-5 | Chợ(outdoor), Quán Trọ(indoor), Cổng Thành(outdoor) |
| `dong_phu`/Trạm player | 1-2 | Chính Điện(indoor), Sân Ngoài(outdoor) |
| `hoang_da`/`cam_dia` | 0 | Không có Lớp 3 — quá hoang vu để chia điểm nhỏ, giữ nguyên trải nghiệm Lớp 2 thuần |
| `nga_re` | 1 | Điểm Quan Sát(outdoor) — chỉ đủ cho action Scout đã có |

### 11.3. Bảng tốc độ di chuyển đầy đủ (mục 5.1, cộng dồn với modifier thời tiết mục 10.1)
| travelType | Speed nền | Speed thực tế khi Vũ/Tuyết/Bão |
|---|---|---|
| walk | 1.0x | Vũ: 0.8x / Tuyết: 0.6x / Bão: 1.0x (không bị ảnh hưởng, đi bộ vẫn được) |
| ngự_khí | 3.0x | Vũ: 2.4x / Tuyết: 1.8x / Bão: **VÔ HIỆU HÓA hoàn toàn** (mục 10.1) |
| truyền_tống_trận | tức thời | Không bị ảnh hưởng bởi bất kỳ thời tiết nào (trận pháp không phụ thuộc môi trường) |

---

## 12. VIỆC CẦN LÀM TIẾP (đã gộp thêm phần Thời Tiết vào thứ tự ưu tiên cũ)
1. **Làm trước tiên:** mục 3.1 (influence gradient) — không đổi so với bản trước.
2. **Làm thứ hai:** mục 7 (4 cấp sương mù) + mục 10.1-10.2 (thời tiết cơ bản, CHƯA cần tích hợp
   Faction/NPC ngay) — 2 mục này độc lập tương đối, có thể làm song song.
3. **Làm thứ ba:** mục 2 (Lớp 3) + bảng 11.2 cụ thể.
4. **Làm thứ tư:** tích hợp Thời Tiết sâu (mục 10.4-10.7 — Đình Chiến/NPC trú ẩn/Thiên Tai) — CẦN
   mục 2 (Faction War) và mục 3 (NPC schedule) đã chạy ổn định trước, vì đây là lớp NỐI thêm vào hệ
   đã có, không phải hệ độc lập.
5. **Làm sau cùng:** mục 4-5 (Player Map Agency, Fast Travel) như bản trước.
6. Câu hỏi multiplayer vẫn treo — giờ ẢNH HƯỞNG THÊM tới thời tiết: thời tiết nên là SERVER-WIDE
   dùng chung (mọi người trong 1 Vùng thấy cùng thời tiết) hay mỗi người chơi có thời tiết riêng?
   Khuyến nghị: server-wide hợp lý hơn nhiều vì thời tiết vốn là hiện tượng KHÔNG GIAN chung, tách
   riêng theo từng người sẽ phá vỡ logic "mặt trận thời tiết lan truyền" ở mục 10.2.
---

## IMPLEMENTATION UPDATE 2026-09-16 — WIRED RUNTIME

Đã nối runtime Map V2 qua mapInfluenceSnapshot, mapFogState, mapCompletion, appendNodeHistory, nodeResonance, mapNode, moveWithinNode, travelPlan, buildMapStructure, claimOutpost, petitionOutpostToFaction và updateTradeRoutes. ownerFactionId được suy ra từ influence gradient; fog, completion, history, sub-location và travel weighting dùng resolver chung.

Đã áp dụng lớp hiển thị Cosmic Constellation cho World Map: sao vùng thay cho card vùng, đường nối mờ như chòm sao, nhãn theo mức quan sát, trạng thái vùng hiện tại/biến cố, zoom/reset, wheel zoom và kéo camera. Local Map dùng fog 0–3: chưa biết, nghe đồn, đã khám phá, thông thuộc.

Hai công trình canonical teleport_array và world_ward được alias tương thích với waystation và ward_formation; tab Thế giới gọi command xây dựng duy nhất.


### Source: `archive-requirements\logic-history\Open-World Cosmic Constellation Map Prompt.md`

## OPEN-WORLD COSMIC CONSTELLATION WORLD MAP

Redesign the current world map into an **interactive open-world cosmic constellation map**.

The map must NOT visually behave like a flowchart, dependency graph, tree, dungeon graph, or traditional node-link diagram.

The underlying world data remains unchanged.

The visualization layer should make the player feel like they are looking at an ancient celestial map where the geography of the world is represented by stars and constellations.

### CORE PRINCIPLE

Think:

WORLD DATA → SPATIAL WORLD → CELESTIAL MAP → CONSTELLATIONS

NOT:

WORLD DATA → HIERARCHY → NODE GRAPH

The world may contain hierarchical data internally:

World → Region → Area → Location

but this hierarchy must NOT determine the visual layout.

A location's parent/child relationship must not automatically place it above, below, left, or right of another location.

The visual map must be spatial, organic, exploratory, and open-ended.

---

## 1. OPEN-WORLD SPATIAL CANVAS

The map represents a world significantly larger than the viewport.

The viewport is only a camera window into the world.

Implement:

- infinite or very large pannable canvas
- zoom in / zoom out
- smooth camera movement
- drag-to-pan
- smooth focus on selected location
- center-on-player
- optional minimap
- meaningful empty space
- large distances between major regions

Do NOT automatically fit all locations into the viewport.

Do NOT force every location to remain visible simultaneously.

The player should feel that the world is much larger than what is currently visible.

---

## 2. WORLD REGIONS

Examples:

- Mortal Realm
- Eastern Continent
- Western Wilderness
- Northern Snowlands
- Southern Ancient Forest
- Central Immortal Region
- Demon Territory
- Forbidden Zone

Regions should occupy large spatial areas.

Do NOT render regions as rectangles, cards, panels, or bordered boxes.

Instead represent regions using:

- subtle nebula clouds
- radial atmospheric glow
- slightly different star density
- subtle color atmosphere
- faint region title
- organic constellation clusters

Region boundaries must feel atmospheric rather than geometric.

---

## 3. CONSTELLATION CLUSTERS

Locations belonging to the same geographic or conceptual area should naturally form constellation clusters.

Example:

        ★
       / \
      ★───★
       \ /
        ★

However, constellation shapes must NOT be generated as rigid graphs.

Use deterministic handcrafted positions or stable seeded spatial positions.

Avoid:

- grids
- rows
- columns
- equal spacing
- tree layouts
- radial menus
- dense force-directed graph layouts

Each region should have its own organic constellation structure.

---

## 4. LOCATIONS ARE STARS

Do NOT use large rectangular cards as map nodes.

Location representations:

Normal location:
- small star
- subtle glow

Important location:
- larger brighter star

Major city:
- large unique star

Sect:
- distinctive star/orbit symbol

Dungeon:
- darker special star

Forbidden area:
- ominous dark/red/purple celestial object

Special location:
- unique visual treatment

Player location:
- brightest star
- pulsing halo
- subtle radial glow

The star itself is the primary visual representation.

---

## 5. LOCATION LABELS

Do not permanently display large labels for every location.

Show labels when:

- hovered
- selected
- discovered
- nearby
- important
- currently occupied by player

At far zoom levels, hide most labels.

At medium zoom, show important locations.

At close zoom, reveal local labels and details.

This prevents label overlap and preserves the feeling of a starfield.

---

## 6. CONNECTIONS

Connections should look like constellation lines.

Use:

- thin lines
- low opacity
- subtle glow
- slight blur
- no thick borders
- no arrows unless direction is gameplay-critical

Connections are secondary visual elements.

Never make connections visually stronger than the stars.

At far zoom levels, hide most connections.

At medium zoom, show connections within the current region.

At close zoom, show nearby discovered connections.

---

## 7. DISCOVERY / FOG OF WORLD

Implement multiple visual discovery states.

### UNEXPLORED

- very dim star
- low opacity
- no label
- weak or hidden connection
- mysterious appearance

### DISCOVERED

- brighter star
- visible label when appropriate
- visible local constellation connections

### VISITED

- stronger star
- persistent discovery state
- subtle visual marker

### CURRENT LOCATION

- strongest glow
- pulsing halo
- highlighted local constellation
- camera focus

### IMPORTANT LOCATION

- larger star
- unique glow
- subtle particle effect

### LOCKED

- dark/faded star
- hidden or extremely faint connection
- optional lock symbol

---

## 8. DISCOVERY SHOULD FEEL LIKE REVEALING A CONSTELLATION

Do not simply "unlock another node".

When a player discovers locations, gradually reveal the constellation.

Example:

Before discovery:

        ·        ·

              ⋄

    ·                    ·


After discovery:

        ★─────★
             \
              ✦
             /
        ★───★


The player should feel that they are gradually reconstructing the celestial map of the world.

---

## 9. ZOOM LEVELS

Implement at least four conceptual zoom levels.

### COSMIC VIEW

Shows:

- major regions
- major constellation clusters
- important world landmarks
- very few labels

### REGION VIEW

Shows:

- regional constellation
- cities
- sects
- major landmarks
- discovered paths

### LOCAL VIEW

Shows:

- towns
- villages
- dungeons
- forests
- caves
- NPC-related locations

### CLOSE VIEW

Shows:

- detailed local locations
- more labels
- nearby connections
- detailed interaction information

Do not attempt to display all world information at every zoom level.

---

## 10. CAMERA BEHAVIOR

Camera movement must feel like exploration.

When selecting or traveling toward a location:

- smoothly pan toward target
- optionally zoom slightly
- highlight target star
- reveal nearby constellation
- avoid aggressive snapping

When the player moves:

- smoothly follow the player
- preserve surrounding context
- avoid constantly recentering unless necessary

---

## 11. OPEN-WORLD NAVIGATION

The map should not feel like selecting the next node in a linear graph.

A player should be able to:

- explore nearby areas
- select discovered locations
- travel between locations
- inspect distant regions
- discover unknown locations
- return to previously visited locations
- zoom out and understand the larger world
- zoom in and inspect local areas

The map represents geography and exploration, not progression order.

---

## 12. PLAYER LOCATION

The player should appear as a special celestial marker.

Example:

          ★────★
         /      \
        ★   ◎────★
         \ /
          ★

            ◎ = PLAYER

Use:

- bright central glow
- pulsing halo
- subtle particles
- nearby constellation highlighting

The player should visually feel like a moving celestial point inside the world.

---

## 13. CULTIVATION / FANTASY ATMOSPHERE

The visual style should feel like:

"An ancient cultivator looking toward the heavens and seeing the entire world represented as celestial constellations."

Avoid:

- spaceship HUD
- futuristic sci-fi panels
- technical dashboards
- excessive neon
- cyberpunk UI

Prefer:

- dark navy-black sky
- blue-white stars
- gold celestial landmarks
- purple/red dangerous regions
- green mysterious locations
- subtle nebula
- ancient celestial atmosphere
- restrained fantasy effects

---

## 14. SPECIAL WORLD PHENOMENA

The map may visually represent world phenomena.

Examples:

High spiritual energy:
- denser stars
- brighter constellation
- soft cyan/gold nebula

Demonic region:
- sparse stars
- dark red/purple atmosphere
- distorted constellation

Forbidden zone:
- almost empty space
- faint stars
- strange celestial distortion

Ancient ruins:
- broken constellation lines
- partially missing stars

Immortal region:
- extremely bright constellation
- rare golden stars
- celestial glow

These effects should remain subtle and should not reduce map readability.

---

## 15. DATA COMPATIBILITY

DO NOT modify the underlying world/map data model.

Preserve:

- location IDs
- region IDs
- connections
- discovery state
- visited state
- locked state
- player position
- navigation logic
- action logic
- travel logic
- interaction logic

Only redesign the visualization/layout/rendering layer.

The existing game logic must continue to work.

---

## 16. PERFORMANCE

The world may contain hundreds or thousands of locations.

Prefer:

- Canvas
- optimized SVG
- WebGL when necessary

Avoid thousands of heavy DOM elements.

Separate:

1. decorative background stars
2. region atmosphere
3. constellation lines
4. interactive gameplay stars
5. labels / overlays

Use level-of-detail rendering based on zoom level.

Far away locations should be rendered more cheaply.

---

## 17. FINAL EXPERIENCE

The final map should feel like:

"An enormous celestial world waiting to be explored."

The player should not think:

"I am looking at nodes."

The player should think:

"I am looking at the heavens, and those stars are places I can travel to."

The map should communicate:

WORLD → DISTANCE → MYSTERY → DISCOVERY → EXPLORATION

rather than:

NODE → EDGE → PATH → DESTINATION.

The final visual target is:

**OPEN-WORLD CELESTIAL ATLAS / COSMIC CONSTELLATION MAP**
for a dark-fantasy cultivation RPG.
---

## IMPLEMENTATION UPDATE 2026-09-16

Visualization layer đã được wire mà không đổi world data model: World Map dùng constellation/star treatment, atmospheric background, subdued connections, current-region pulse, zoom controls, wheel zoom và drag camera. Local Map dùng discovery/fog level 0–3 và chỉ hiện label/chi tiết theo mức khám phá. Các resolver Map V2 giữ toàn bộ travel, discovery, influence và interaction logic ở runtime.




## TRACE RECOVERY - RUNTIME-DERIVED MAP CONTRACT

The damaged historical prose above is not authoritative where characters were lost. This contract is reconstructed from js/engine.js, js/expansion.js, js/ui.js, and the surviving validator sections.

### Coordinate and topology invariants

- state.openWorld.coordinates is the runtime coordinate source and uses integer Oxy coordinates within OPEN_WORLD_BOUNDS (currently 0..100).
- coordinateIndex must resolve one node per coordinate. Duplicate coordinates, missing locations, out-of-bounds values, index mismatches, and non-adjacent exits are invalid.
- locationExits(state, locationId) resolves authored exits and Oxy neighbors; a target is accepted only when its coordinate is the expected adjacent cell.
- openWorldTarget(state, direction, { create }) resolves the adjacent target; with `create: false` it only resolves an existing node, while exploration may create a procedural node only inside bounds, record the forward edge, and restore the reciprocal edge.
- validateOpenWorldGrid(state) is the integrity gate for bounds, duplicates, directions, index consistency, and adjacency.

### Movement transaction

- move(state, direction, options) is the compatibility movement entry point.
- Movement resolves and validates a target before mutating state.locationId.
- When available, movement delegates cost, risk, weather, and war weighting to GameExpansion.travelPlan; a failed plan does not commit movement.
- Leaving a node handles pending exploration and map-event lifecycle. Discovery, quest, encounter, SAN, history, and derived-state updates occur after destination commit.
- Missing or invalid routes return a failure result; they do not silently create an arbitrary node.
- `moveActions(state)` exposes all four cardinal `act_move_<direction>` actions; in-bounds actions may lazily materialize the adjacent target, while boundary actions are disabled.
- `act_explore_<direction>` is not part of the active action panel or movement contract.
- Direct text movement and panel movement use the same canonical `move(state, direction)` path.

### Map projections

- mapInfluenceSnapshot, mapFogState, mapOwner, and map completion are derived projections. UI does not calculate influence or mutate catalog data.
- Local map rendering shows current, reachable, visited, unknown, procedural, dangerous, contested, event, opportunity, and hidden-realm states from runtime state.
- moveWithinNode changes sub-location context only and does not change node identity or run a full travel transaction.

### Recovery status

Recovered from runtime symbols: locationExits, generateOpenWorldNode, openWorldTarget, validateOpenWorldGrid, move, mapInfluenceSnapshot, mapFogState, travelPlan, and moveWithinNode. Damaged historical UX wording is superseded by this trace contract.
## LOCAL CONSTELLATION MAP — CANONICAL FEATURE CONTRACT

This section is the canonical implementation of the former `LOCAL_CONSTELLATION_MAP_DESIGN_PROMPT.md`. The standalone prompt is now only a historical/reference pointer; new map behavior must be updated here first.

### Scope and source of truth

- Local BFS Tree uses a dedicated semantic palette: gold for the current root, cyan/teal for tree structure and known neutral nodes, blue for reachable nodes, lavender for visited nodes, muted navy for fog, amber for important nodes, crimson for danger/events, violet for opportunities/hidden realms, and faction colors only as secondary ownership signals.
- Local Nearby is rendered as a seeded star field rather than a visible tree: the respawn/current node is the only bright anchor on a fresh game, visited nodes remain lit, and only three directional dots are shown around the current node as movement affordances. Unvisited known signals may remain dim; priority colors are danger red, opportunity violet, event amber, and important gold. Sect/organization nodes and nodes with a `waystation`/`teleport_array` are violet, and the nearest violet destination receives a dashed violet guide route.
- `WORLD_MAP.locations`, `state.openWorld.coordinates`, and `coordinateIndex` are the spatial sources of truth. UI layout coordinates are derived values only.
- Runtime Oxy bounds are inclusive `0..100`, giving a theoretical `101 × 101` grid. The engine does not materialize all 10,201 cells; procedural nodes are created lazily.
- Cardinal topology is fixed: north `(x, y - 1)`, south `(x, y + 1)`, east `(x + 1, y)`, west `(x - 1, y)`.
- Display placement must preserve relative cardinal direction. It must never be used to decide adjacency, travel availability, or node generation.

### Local selection and stable layout

- The Local view renders at most 39 nodes, including the current node.
- Selection starts from the current node and expands through the real gameplay graph using deterministic BFS; it does not fill the viewport with distance-only nodes.
- Current node is always centered. Visited, unvisited, fog, important, teleport and birthplace states remain distinct from node type.
- Layout is deterministic for the same current node and map state. No per-render random jitter is allowed.
- The renderer may derive `displayX/displayY` from `worldX/worldY`, but must keep the Oxy/world coordinates unchanged.
- Required pinned nodes are deduplicated by node ID and may be placed at the correct relative edge with `offscreenPinned`; a pin never creates a travel route.

### Node, fog, and label contract

- Nodes are rendered as minimal circular constellation points; no orbital rings, planet icons, fake graph decorations, or rectangular node cards.
- Current node uses its own state. Visited nodes use the visited color; unvisited/discovered nodes remain unvisited-colored; locked/fogged nodes remain visually subdued.
- Node names are shown by default only for the current node or important signal nodes. Other node names belong in hover/focus tooltip.
- Oxy, distance, visited state, node type, route availability, direction, and pin state belong in the tooltip/detail surface.
- Oxy is metadata and must never be concatenated into the canonical node name. Legacy suffixes are normalized during runtime migration and UI rendering.

### Real edges and exploration frontier

- `map-path` is rendered only between two materialized nodes whose adjacency is confirmed by `locationExits()`.
- A nearby screen position is never evidence of an edge. No diagonal or inferred edge may be added.
- `normal` represents cardinal walk edges. `teleport` represents an existing valid teleport action. `star_path` is reserved and not active until its gameplay contract is implemented.
- An adjacent Oxy cell without a node is a frontier, not a node and not a real edge. If shown, it must use a distinct frontier marker and must not receive `map-path`.
- `act_move_<direction>` is always exposed for Bắc/Nam/Đông/Tây. In-bounds actions lazily materialize adjacent Oxy nodes; out-of-bounds actions remain visible but disabled.
- `act_explore_<direction>` is removed from the active action contract. Direct text `đi <direction>` uses the same canonical movement handler.
- At the boundary, the outward cardinal action remains visible but disabled; no node or edge is created.

### Interaction and travel safety

- Clicking an adjacent node dispatches the corresponding `act_move_<direction>`; the same action handles a lazy in-bounds node.
- Pending search, hidden discovery, contested opportunity, and other departure guards remain authoritative before movement. Movement opens the resolution modal when a discovery is pending and resumes only after resolution.
- Weather, terrain, influence, structure, party/companion and travel type continue to flow through the canonical travel plan; the Local renderer must not duplicate those rules.

### Performance, compatibility, and acceptance

- Never render the full 101 × 101 grid. Render only the selected node set and confirmed visible edges.
- Layout/selection may be memoized by current node and map-state version; it must not recompute every animation frame.
- Existing saves without edge metadata continue to read `normal`; coordinate/index migration must reject duplicates, invalid bounds, and non-adjacent exits.
- Acceptance requires: current node centered; Dynamic Local BFS viewport of at most 39 nodes and 38 tree edges when connected; real edges only; boundary movement blocked; four cardinal actions always visible; pending-discovery modal flow; save/load and four-direction movement preserved.

## Consolidated addendum: map expansion, actions, armies, and atmosphere

- The map uses deterministic coordinate generation, fog state, directional exits, node discovery, search/collect/investigate actions, and map-event resolution. Existing runtime APIs remain the single implementation path.
- Army records live under `worldSimulation.armies`: `id`, `factionId`, `nodeId`, `soldierCount`, `morale`, `status`, `route`, `targetNodeId`, `corruptionExposure`, and `lastUpdatedDay`.
- Army actions are `scout`, `sabotage`, `join_battle`, and reputation-gated `command`. Daily simulation reduces morale while marching through corruption level >= 3; morale <= 20 routes the army and applies a 15% troop loss.
- `subLocationWrongness(state, subLocationId)` derives local wrongness from player worldview wrongness plus local override/corruption. Map/UI consumers must use this helper instead of inventing a second formula.
- Directional movement after fleeing remains available from the current node; flee must not relocate the player backward.
