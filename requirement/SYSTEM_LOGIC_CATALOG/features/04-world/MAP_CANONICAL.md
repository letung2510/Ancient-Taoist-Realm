# MAP CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic

### Current coordinate contract — 2026-10-05

- The canonical Oxy domain is the inclusive integer grid `0..100` for both axes.
- Cardinal deltas are fixed: Bắc `(x, y - 1)`, Nam `(x, y + 1)`, Đông `(x + 1, y)`, Tây `(x - 1, y)`.
- Runtime movement must use adjacent coordinates and may not jump directly between distant region anchors.
- Region identity is derived from the destination node; weather and NPC presentation must use that same node-region context.

### Cross-system world events

World interconnection requirements are sourced from [`WORLD_SIMULATION_CANONICAL.md`](WORLD_SIMULATION_CANONICAL.md) and coordinated in [`WORLD_SIMULATION_CANONICAL.md`](WORLD_SIMULATION_CANONICAL.md). Map-generated arrivals, discoveries, faction changes, and travel results use the shared [`novel log event contract`](../07-ui/UI_ACTION_LOG_CANONICAL.md#unified-novel-style-event-log); player-facing text is a scene projection, while coordinates and diagnostic payloads remain metadata.


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

# MAP V2 · REQUIREMENT HON CHNH: KHU VC HIN TI, ĐA L V HNH TRNH

**Phin bn:** 2.2
**Trng thi:** yu cu trin khai bt buc
**Phm vi:** bn đ khu vc hin ti, hnh nh bn đ, node/sub-location, topology, di chuyn v ton b tri nghim ngi dng lin quan.

## 1. Mc tiu sn phm

Tnh nng **Khu vc hin ti** phi gip ngi chi tr li ngay bn cu hi:

1. Ta đang  đu, thuc vng nh hng no v mc đ an ton ra sao?
2. T đy đi đc đu bng nhng tuyn no?
3. Mi tuyn đang  trng thi g: thng sut, nguy him, b tun tra, phong ta hay cn phng tin?
4. Nu chn mt phng thc di chuyn, ta s mt bao nhiu ngy, ti nguyn v c th gp ri ro g?

Bn đ khng đc cn l danh sch cc hp ni ty tin. Mi node phi c v tr, quy m, tuyn hp l, trng thi đa l v lch s khm ph ring.

## 2. Vn đ bt buc phi gii quyt

### 2.1. Li Sn mn Thin Huyn Thng

Hin ti `locationExits()` ly cnh t catalog t)nh ri trn vi `openWorld.exits`; khi thiu cnh, `move()` gi `generateOpenWorldNode()` v t ni node mi. C ch ny khin Sn mn Thin Huyn Thng c th ni thng ti ton b node khc, ph hy topology gc.

**Quyt đnh kin trc:**

- Catalog t)nh v graph runtime phi tch bit tuyt đi.
- Node t)nh ch đc dng cc cnh đc khai bo trong `WORLD_MAP`/`LOCATIONS`.
- Node runtime ch đc ni qua cng sinh procedural đc khai bo r (`proceduralGate: true`).
- Khng đc t sinh node khi ngi chi đi vo mt hng khng c cnh hp l.
- Khng đc t ghi đ `LOCATIONS`, `WORLD_MAP.locations` hoc cnh ca node t)nh.
- Mi node runtime phi nm trong `state.openWorld.nodes`, c namespace `runtime:` v c `parentNodeId`/`regionId`.
- Mi cng procedural c `maxChildren`, `allowedDirections`, `allowedRegionIds`, `minFog`, `cooldownDays`.
- Nu hng khng c cnh hp l, action phi tr `ROUTE_NOT_FOUND`; khng to node ngm.

### 2.2. Trng thi di chuyn cha đy đ

`planned/active/interrupted/completed/cancelled` mi l trng thi k thut ti thiu, cha đ thng tin đ UX phn nh hnh trnh. Requirement ny b sung lp trng thi hin th v lut chuyn trng thi.

## 3. M hnh bn đ khu vc hin ti

### 3.1. Ba lp hin th

**Lp A · Bn đ khu vc:** hin th node hin ti, node đ bit, hng đi, tuyn đng v nh hng th lc.

**Lp B · Chi tit node:** m khi bm node, gm tn, loi đa đim, m t, cp sng m, nh hng, cng trnh, bng tin v cc sub-location.

**Lp C · Hnh trnh:** modal/panel xc nhn tuyn, phng tin, h tng, ETA, chi ph, nguy c v điu kin phong ta.

Khng m modal chng modal. Trn mn hnh nh, lp B/C phi chuyn thnh bottom sheet c nt đng r rng.

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

### 3.3. Quy m sub-location

- Trm nh: 12 sub-location.
- Thn/lng: 24.
- Thnh th: 46.
- Sn mn, vng kinh, cn c th lc: 68.
- NPC ch xut hin ti sub-location c th; Action Bar ch hin th action ca sub-location đang đng.
- Chuyn sub-location trong cng node khng roll s kin đng di v khng đi nodeId.

## 4. Topology v bo ton node

### 4.1. Resolver tuyn duy nht

To `resolveMapTopology(state, nodeId)` vi th t:

1. Đc node static nu `namespace=static`.
2. Đc node runtime nu `namespace=runtime`.
3. Hp nht ch cc cnh runtime đ đc cp php.
4. Lc cnh b v hiu, ht hn, phong ta hoc khng đt fog.
5. Khng gi hm sinh node trong bc đc.

`locationExits()` v `mapNeighbors()` phi dng resolver ny; `move()` khng đc t fallback sang `generateOpenWorldNode()`.

### 4.2. Procedural gate

`generateOpenWorldNode()` ch đc gi bi `openProceduralGate()` khi:

- node hin ti c `proceduralGate` tng ng hng;
- đt `minFog` v điu kin nhim v;
- cha vt `maxChildren`;
- vng đch nm trong `allowedRegionIds`;
- c transaction journal v idempotency key;
- to node runtime đc lp, khng sa catalog t)nh.

### 4.3. Kim tra ton vn

Tool kim th phi pht hin:

- node static b thm/xa/sa cnh sau khi to state;
- cnh hai chiu khng khp;
- node runtime tr ra ngoi namespace hp l;
- mt node c qu s con procedural;
- Sn mn Thin Huyn Thng ni ti node khng nm trong catalog cnh hoc gate đc cp php.

## 5. Influence, heatmap v trng thi đa bn

Mi node tnh influence t faction home, outpost, structure, event v khong cch BFS. Khng lu owner t)nh.

```text
influence = factionPower  0.70^distance
           (1 + structureBonus + outpostBonus + eventBonus)
```

- `n đnh`: top influence e 35 v chnh lch top/second e 15%.
- `Tranh chp`: top-two cng hin din v chnh lch < 15%.
- `Bin gii`: khng faction no vt ngng n đnh.

UI khu vc hin ti phi hin th gradient mu, khng ch mt nhn owner. Khi fog < 2 ch hin th nh hng cha r.

## 6. Fog of war bn cp

| Cp | Tn | Hin th |
|---|---|---|
| 0 | Cha bit | Khng hin node trn bn đ khu vc |
| 1 | Nghe đn | Tn m, hng tng đi, khng hin tuyn chi tit |
| 2 | Đ khm ph | Hin node, tuyn hp l, nguy c c bn |
| 3 | Thng thuc | Hin sub-location, heatmap chi tit, cng trnh, bng tin v tun tra |

Mi nng cp fog phi qua discovery event idempotent, khng spoil sub-location khi ch mi đt cp 1.

## 7. Thit k UI Khu vc hin ti

### 7.1. Thanh thng tin c đnh

 đu panel hin th:

- tn node v vng;
- loi đa đim;
- cp khm ph;
- trng thi đa bn: n đnh / Tranh chp / Bin gii;
- nh hng ni bt;
- nguy c tng hp;
- trng thi hnh trnh hin ti nu đang di chuyn.

### 7.2. Bn đ hnh nh

- Dng nn minh ha bn đ c lp texture theo vng; khng dng nn phng vi cc chm ri rc.
- Node hin ti c vng sng v nhn lun đc đc.
- Node đ bit dng biu tng theo `nodeType`.
- Node cp 1 dng silhouette/m; node cp 0 khng render.
- Tuyn c mu theo trng thi: xanh thng sut, vng hn ch, đ nguy him, tm phong ta, xm cha r.
- Patrol edge dng icon khin/tun tra chuyn đng nh; khng to node gi.
- Outpost/structure dng icon ring, tooltip ting Vit.
- Bn đ phi c zoom, pan, reset, ch gii v h tr bn phm.
- Mi icon c `aria-label`, khng truyn đt thng tin ch bng mu.

### 7.3. Chi tit node

Khi bm node, m th chi tit gm:

- nh minh ha theo `visualTag`;
- m t ngn v trng thi thi tit;
- influence gradient/heatmap;
- danh sch sub-location dng th;
- NPC hin din ti đng sub-location;
- cu trc/trm v đ bn;
- bng tin faction đ lc theo fog v thi hn;
- nt Lp Trm, Xy Thp canh, Xy Trm giao thng ch khi đ điu kin.

### 7.4. Trng thi rng v li

- Khng c tuyn: Cha c tuyn đng hp l t đy.
- Cha đ fog: Cn thm manh mi đ nhn r khu vc ny.
- Phong ta: hin th faction, l do, thi hn d kin v la chn h tng/đng vng.
- Thiu ti nguyn: hin s đang c/s cn, khng ch hin m li.
- Hnh trnh b gin đon: gi log, cho php tip tc, đi tuyn hoc hy.

## 8. H thng trng thi di chuyn

### 8.1. Trng thi runtime

`planned  active  completed`
`active  interrupted  active`
`planned/active/interrupted  cancelled`
`active  failed` ch khi route b hy bi th gii v khng th tip tc.

### 8.2. Nguyn nhn gin đon

- gp qui/mai phc;
- bo, li, st l;
- patrol kim tra;
- faction phong ta;
- phng tin hng;
- thiu ph duy tr caravan/escort;
- node đch đi trng thi thnh khng th tip cn.

### 8.3. Travel mode

| Phng thc | Điu kin | Tc đ | Đc tnh |
|---|---|---:|---|
| Đi b | lun c nu tuyn m | 1.0x | r, nhiu c hi dc đng |
| Ng kh | c cng php ph hp | 3.0x | nhanh, tn Linh Thch, khng dng  tuyn cm |
| Th ci | c th ci/đng hnh hp l | 2.0x | gim ri ro đng b |
| Thuyn | c hai đu l bn/nc | 2.0x | chu bo, khng đi tuyn ni |
| Đon xe | c caravan v tuyn đng | 1.5x | gim ri ro, tn ph duy tr |
| Đon thng nhn | hub thng mi đ m | 1.25x | gim gi/nhn tin, d b phc kch |
| Truyn tng trn | m fast travel  c hai đu | tc thi | khng roll road event, tn Linh Thch |

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

Mi ngy ch resolve mt ln theo `taskId + dayIndex`; retry phi idempotent.

## 9. Action Bar · lut đa action vo đng thi đim

- Action di chuyn ch hin cho cnh đ resolve, đ fog v khng b kha hon ton.
- Action phng tin ch hin khi `travelPreview()` tr `success=true`; nu khng đ điu kin th hin th trong phn Phng thc khc  trng thi disabled km l do, khng đa vo Action Bar chnh.
- Lp Trm Tin Tiu ch hin ti node bin/tranh chp cha c outpost, khng giao chin v đ chi ph.
- Action xy cng trnh ch hin ti node hin ti, khng giao chin, đ chi ph v c outpost ngi chi hoc node bin đc php khai ph.
- Truyn tng trn ch hin khi c hai đu đ m fast travel.
- Hy hnh trnh ch hin khi task  `planned`, `active` hoc `interrupted`.
- Tip tc hnh trnh ch hin khi interruption đ c phng n x l.
- Action ca sub-location ch hin sau khi ngi chi thc s vo sub-location đ.

## 10. Transaction v rollback

Mi mutation map dng `resolveMapTransaction` vi:

- `actionId`, `actorId`, `expectedVersion`;
- kim tra topology, fog, quyn, chi ph, combat v blockade;
- snapshot trc mutation;
- journal idempotency;
- rollback đy đ nu tr ti nguyn thnh cng nhng to task/node tht bi.

## 11. K hoch trin khai

### Pha 1 · Kha topology

- To static/runtime namespace.
- Vit `resolveMapTopology()` v loi fallback sinh node trong `move()`.
- Di tr runtime node ci sang `state.openWorld.nodes`.
- Thm test hi quy Sn mn Thin Huyn Thng.

### Pha 2 · Travel state machine

- Chun ha `TravelTask` v cc transition.
- p dng travel mode, blockade, escort, phng tin v chi ph.
- Hin th ETA/risk/interruption trong UI.

### Pha 3 · Khu vc hin ti v hnh nh

- Xy li `renderLocalMap()` theo layout bn đ hnh nh.
- Thm lp tuyn, icon node, heatmap, patrol, outpost v ch gii.
- Thm responsive bottom sheet, keyboard navigation, aria-label.

### Pha 4 · Node detail v action context

- Sub-location, NPC placement, bulletin, structure detail.
- Action Bar theo context v preview điu kin.

### Pha 5 · QA v cn bng

- Stress test topology 1.000 lt di chuyn.
- Kim th deterministic travel retry.
- Kim th fog/privacy, blockade, escort, fast travel v rollback.
- So snh screenshot desktop/mobile trc khi pht hnh.

## 12. Acceptance criteria

1. T Sn mn Thin Huyn Thng khng th đi ti node khng c cnh/gate đc khai bo.
2. Khng mt thao tc di chuyn no sa catalog static.
3. Runtime node lun c namespace, parent, region v journal.
4. Khu vc hin ti hin th đc node, tuyn, heatmap, fog v trng thi tun tra.
5. Ngi chi thy r ETA, chi ph, nguy c v l do khng th dng phng tin.
6. Travel task khi phc đng sau reload, retry khng nhn đi chi ph/s kin.
7. Cc trng thi `planned/active/interrupted/completed/cancelled/failed` đu c UI v transition hp l.
8. Action Bar khng hin th action ngoi điu kin; action trc tip qua API vn b chn đng.
9. Khng cn nhn k thut nh `watchtower`, `trading_post`, `stable`, `contested`, `frontier` hin th cho ngi chi.
10. B xc minh game, stress test topology v kim tra giao din desktop/mobile đu đt.
## 13. R sot khong trng v ci tin bt buc

### 13.1. Bin Khu vc hin ti thnh mn hnh chi đc

Khu vc hin ti khng ch l mn hnh tra cu. Mi node phi c `localState` rebuild đc, gm dn c, phn vinh, an ninh, khan him ti nguyn, thi tit, gi m ca v s kin đang din ra. Cc gi tr ny tc đng trc tip ti gi ch, NPC, nhim v v ri ro di chuyn.

### 13.2. B hot đng ti ch

Mi node cn 38 hot đng theo loi node v sub-location: quan st, tm kim, giao dch, ngh tr, sa phng tin, thu h tng, nhn tin, do thm tun tra, h tr dn c, m đng tt v đt mc c nhn. Mi hot đng khai bo `requirements`, `duration`, `cost`, `risk`, `effects`, `cooldown`, `sourceSubLocationId`. Action Resolver khng đc đa hot đng ht gi, ht cooldown hoc thiu điu kin vo Action Bar chnh.

### 13.3. S kin đng cp khu vc

Thm `LocalIncident` vi vng đi `rumor  emerging  active  resolved/expired`. V d: ch chy, cu sp, th triu, kim tra cng, thng đon đn, dch bnh, tranh chp đt hoc hi ch. Incident phi tc đng ti node/edge, c yu cu fog, thi hn, t nht hai la chn c đnh đi, ghi log v khng nhn đi sau reload/retry.

### 13.4. Lp tuyn nhiu tiu ch

Thm ch đ **Lp tuyn**: chn node đch, hin th 13 tuyn tt nht theo nhanh nht/an ton nht/r nht/kn đo nht, so snh ETA, chi ph, blockade, patrol, thi tit v c hi dc đng. Cho php waypoint v đi phng tin theo tng chng; ch to `travelTask` sau khi xc nhn.

### 13.5. Trng thi cnh chi tit

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

Edge b phong ta khng đc xa khi graph; ch đi trng thi đ gi lch s, đng vng v kh nng m li.

### 13.6. Tng tc th lc ti node

Ngi chi c th xin giy thng hnh, np ph, nhn nhim v bng tin, thng lng gim phong ta, do thm hoc ph tun tra, xin h tng, hin outpost v x l incident. Mi faction cn profile ring cho kin trc, lut đa phng, patrol, thu, điu kin vo v phn ng danh ting; khng dng m t chung cho mi t chc.

### 13.7. NPC sng trong khu vc

Scheduler phi cp nht `currentNodeId`, `currentSubLocationId`, `scheduleStatus`, `availabilityReason`. UI hin th NPC đang  đu, gi c th gp, đang di chuyn/bn/vng mt v thi đim quay li. Khng hin th NPC o ch v tn ti trong catalog.

### 13.8. Kinh t đa phng

Gi market/trading post tnh t phn vinh, khan him, thu faction, thi tit, incident v ngun cung di chuyn. Bin đng c gii hn mi ngy, deterministic theo world tick. Trading post ch tng yield khi node c market sub-location v cng trnh cn integrity.

### 13.9. Ghi ch v du vt c nhn

Cho php ghim node, ghi ch ti đa 200 k t, đnh du nguy him/c hi/quay li sau v lu route yu thch. Ghi ch khng đc thay đi topology hoc lm l fog.

## 14. Lung UX bt buc

```text
M Khu vc hin ti
   đc tm tt node
   xem tuyn/incident/nh hng
   chn node hoc sub-location
   chn hot đng hoc Lp tuyn
   xem preview chi ph/ri ro
   xc nhn
   theo di task v nht k
```

Mi hnh đng lm mt ngy, ti nguyn, đ bn, danh ting hoc tng ri ro đu phi c preview trc/sau, thi gian, di ri ro, tc đng faction, điu kin tht bi v nt quay li.

### 14.1. Nht k bn đ

Timeline lc theo di chuyn, khm ph, th lc, incident, giao dch, tun tra v cng trnh. Mi bn ghi c node, sub-location, ngy game, kt qu v source action đ gii thch v sao tuyn đi trng thi.

### 14.2. Responsive v tip cn

Desktop dng bn đ tri/detail phi; tablet bn đ trn/detail di; mobile dng bottom sheet. H tr Tab/Enter/Escape, focus trap, reduced motion, tng phn WCAG AA v aria-label cho mi icon.

## 15. H thng hnh nh bn đ

Mi vng c nn bn đ t l 2x, texture đa hnh, icon node 24/32/48 px, icon edge, phng tin, incident, patrol, faction v nh node detail. Asset li phi c fallback SVG/CSS.

- Node ln dng landmark ring, khng dng cng icon vi trm nh.
- Influence dng gradient mm pha sau nhn.
- Edge nguy him dng nt đt; phong ta dng gch cho; tun tra dng chuyn đng nh.
- T gim mt đ icon khi zoom out; tooltip vn đy đ.
- Ch render node trong viewport v node đ bit; cache sprite theo vng; khng chy BFS mi frame.
- Mc tiu m panel <300 ms desktop v <800 ms thit b tm trung.

## 16. API b sung

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

Mi mutation tr `{ success, reason, data, transactionId, stateVersion }`. M li k thut phi đc dch sang ting Vit  UI.

## 17. Kim th m rng

### Topology

- Snapshot catalog trc/sau 10.000 lt di chuyn khng đi.
- Sn mn Thin Huyn Thng ch c đng cnh/gate đc khai bo.
- Runtime gate vt `maxChildren` b t chi.
- Cnh mt chiu/chiu ngc khng hp l b pht hin khi build data.

### Travel

- Mi transition trng thi hp l; transition sai b chn.
- Reload gia `active/interrupted` khi phc đng ETA/risk seed.
- Retry khng tr tin, roll event hoc to log ln hai.
- Phong ta c đng vng; h tng, thuyn, th ci, caravan v truyn tng c điu kin ring.

### Local interaction

- Activity ht gi/cooldown khng vo Action Bar.
- NPC vng mt khng th tng tc.
- Incident ht hn khng cn nt x l.
- Gi th trng deterministic theo world tick.
- Ghi ch khng lm l fog hoc sa graph.

### Visual regression

- Screenshot desktop 1440 px, tablet 1024 px, mobile 390 px.
- Khng trn ch ting Vit, chng tooltip hoc mt focus.
- Asset li vn thao tc đc nh fallback.

## 18. Definition of Done

Feature ch hon thnh khi topology static/runtime b kha; Khu vc hin ti c view model duy nht; c node detail, sub-location, local activity, incident, faction interaction, NPC presence, route planner, edge state, travel state machine, preview, heatmap, patrol, outpost, fallback asset, save/load, rollback, idempotency v ton b nhn ting Vit. Khng cn đng ni ngm t Sn mn Thin Huyn Thng hoc bt k node static no.
## 19. Logic Gap Closure · b sung bt buc sau r sot

### 19.1. Th t x l world tick

World tick phi chy theo th t nguyn t sau, khng đc đo th t:

```text
1. Cht gameDay/worldTick mi
2. Cp nht thi tit vng v incident
3. Cp nht topology runtime/edge state
4. Cp nht NPC route, patrol v traffic
5. Cp nht influence/heatmap t snapshot mi
6. Tnh maintenance outpost/structure
7. Resolve travel task ca player
8. Pht sinh bulletin v invalidate view model
9. Ghi snapshot/journal v pht event UI
```

Mi resolver đc cng `tickSnapshot`; khng resolver no đc trng thi na ci na mi.

### 19.2. Quy tc xung đt đng thi

Mi node, edge v travel task c `stateVersion`. Mutation yu cu `expectedVersion`; nu lch phin bn tr `MAP_VERSION_CONFLICT`, khng t ghi đ. Khi nhiu incident cng tc đng mt edge, u tin `blocked > restricted > open`; khi nhiu weather modifier cng loi, dng modifier c severity cao nht.

### 19.3. Route invalidation

Nu edge trong `routeSnapshot` chuyn sang `blocked`, task đang `active` chuyn `interrupted` vi `reason`, khng teleport player. H thng to ti đa ba phng n: ch m li, đng vng an ton, đi phng tin/h tng. Nu khng c phng n, chuyn `failed` v hon tr phn chi ph cha s dng theo policy.

### 19.4. M hnh risk minh bch

```text
edgeRisk = clamp(baseRisk + terrainRisk + weatherRisk + patrolRisk
                 + incidentRisk + factionRisk - escortReduction
                 - structureReduction, 0, 0.95)
taskRisk = 1 - product(1 - edgeRisk_i)  // trn ton b chng
```

UI hin th di `thp/va/cao/cc cao`, cn log lu gi tr s v seed. Khng reroll risk khi ch m li preview.

### 19.5. Quy tc fog v ring t

- Fog 0 khng tr tn, ta đ, faction, NPC, edge hoc risk c th.
- Fog 1 ch tr rumor đ đc pht hin; khng đc suy ngc t danh sch route.
- API server/runtime phi filter trc khi to view model, khng ch n bng CSS.
- Cache view model theo `playerId + nodeId + fogVersion`; khng dng chung gia ngi chi.

### 19.6. Vng đi node runtime

Runtime node c `createdDay`, `expiresDay?`, `parentNodeId`, `gateId`, `generationSeed`, `status`. Khi ht hn, node chuyn `archived`, khng xa cng nu cn log/quest. Mi cnh tr ti node archived tr thnh `blocked/unknown`, khng t tr sang node khc.

### 19.7. Đng b travel vi v tr player

Khi task `active`, `state.locationId` vn l node xut pht v `state.mapState.travelTask` l ngun s tht duy nht. Khng cho combat, giao dch node đch hoc NPC interaction đch trc khi task completed. UI phi hin th đang trn đng v kha action xung đt.

### 19.8. View model chun cho UI

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

UI ch render view model ny; khng gi trc tip catalog hoc t suy lun điu kin action.

### 19.9. Bo v d liu v chng exploit

- Khng hon tin hai ln khi cancel/interruption.
- Khng nhn reward nu task cha completed.
- Khng dng fast travel đ b qua quest lock, combat lock hoc incident bt buc.
- Khng cho client t gi `risk`, `days`, `distance`, `owner` hoc `fogState`; server/runtime tnh li.
- Journal phi lu before/after hash đ pht hin save b chnh sa.

### 19.10. Acceptance b sung

1. Hai mutation cng `stateVersion` khng th cng commit.
2. Route b phong ta gia chng lun chuyn interruption, khng đi `locationId` sai.
3. Fog 0 khng r r metadata qua API, tooltip, DOM hoc cache.
4. Runtime node ht hn khng lm mt log, quest hoc reference ci.
5. CurrentRegionViewModel ti to deterministic t cng snapshot.
6. Khng c action map no commit m thiu preview tng ng.


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

## 1. Mc tiu

Map V2 chuyn sang m hnh khng gian Oxy lm ngun s tht duy nht cho ton b th gii. Mi node c mt ta đ nguyn `(x, y)`. T ta đ ny, engine xc đnh bn hng Bc, Nam, Đng, Ty v sinh node cn thiu mt cch nht qun.

Kin trc ny thay th vic ph thuc vo `exits` th cng, ta đ phn trm UI hoc tn node cha ta đ k thut.

## 2. Nguyn tc bt buc

### 2.1. Phm vi khng gian 100  100

- Th gii dng min ta đ `x  [-50,49]`, `y  [-50,49]`, tng cng 10.000  logic.
- `(0,0)` l Thin Nguyn Sn ti Trung Vc.
- 150 t chc đc đt bng random c seed, khng đt th cng st nhau.
- Khong cch ti thiu gia t chc ph thuc `pyramid_tier`: Tier 1: 12 , Tier 2: 8 , Tier 3: 5 , Tier 45: 3 .
- Random placement phi deterministic theo world seed; reload hoc nng phin bn khng đc đi ta đ đ lu.
- Node hoang d v node ph đc sinh lazy; khng khi to 10.000 node khi load game.
- UI chiu Oxy sang viewport phn trm bng min/max ca vng đang xem, khng dng phn trm lm ta đ gameplay.

- `(0, 0)` l mc khng gian ca Trung Vc, mc đnh l Thin Nguyn Sn/Thin Nguyn Sn Mn.
- Ta đ gameplay lun l s nguyn c du, đc lp vi kch thc mn hnh.
- Mt cp ta đ ch đc php c mt node duy nht.
- Node t chc, thnh trn, phng th, thn, bn tu, trm dch, hoang d v runtime đu dng cng h Oxy.
- `exits` l cache dn đng đc sinh t ta đ, khng phi ngun s tht chnh.
- Mi node hp l c ti đa bn hng xm trc tip theo Manhattan grid.
- Khng dng tn nh `Bng Nguyn -1` hoc `open_4_-7` đ hin th cho ngi chi.
- ID k thut c th cha ta đ; tn hin th phi ly t name pool theo vng, đa hnh v loi node.
- Quyn di chuyn ti node đc lp vi quyn gia nhp t chc.

## 3. H ta đ

### 3.3. Canonical ha node authored

- Mi node authored hin hu phi đc gn `coordinate` trc khi gameplay bt đu.
- Khi node c `coordinate`, engine b qua `exits` legacy v sinh hng xm theo Oxy.
- `exits` legacy ch đc dng trong migration hoc khi node cha c ta đ.
- Node khi đu Trung Vc l `trung_vuc_khoi_diem` ti `(0,0)`; khng khi đu ti ca tng mn.

### 3.1. Quy c trc

```text
          Bc (y + 1)

Ty (x - 1)  (x,y)  Đng (x + 1)

          Nam (y - 1)
```

Khong cch đa hnh c bn dng Manhattan distance:

```js
distance = Math.abs(ax - bx) + Math.abs(ay - by)
```

Khong cch hin th c th dng Euclidean, nhng khng đc dng Euclidean đ thay th lut hng xm gameplay.

### 3.2. Mc th gii

```text
(0, 0)  Thin Nguyn Sn · Trung Vc
(-1, 10) Thin Kim Mn
(4, -3)  Phng th Thanh Kh
(8, 6)   Bn tu Tinh Cng
```

Cc ta đ ny l v d authoring; catalog chnh thc phi khai bo r `coordinate`.

## 4. Schema node chun

```js
{
  id: "org_node_thien_kiem_mon",
  name: "Thin Kim Mn  Tng đn",
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

Quy tc:

- `coordinate` bt buc vi node authored v node runtime.
- `regionId` xc đnh vng kh hu, thi tit, influence v bulletin.
- `mapNodeType` chun ha: `origin`, `organization`, `market`, `town`, `village`, `harbor`, `waystation`, `wilderness`, `landmark`, `hidden_realm`.
- `organizationId` ch c  node t chc hoc node b t chc chi phi; khng đi din cho t cch thnh vin ca nhn vt.
- `npcs` v `enemies` l pool spawn ban đu; runtime presence lu ring trong `npcState`/combat state.

## 5. Node registry hp nht

`WORLD_MAP.nodePool` l registry đc chung ca map, NPC, qui, t chc, thi tit, thm him v incident.

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

Mi node phi đng b vo:

1. `GameData.LOCATIONS` · tng thch h thng ci.
2. `state.openWorld.nodes` · runtime save.
3. `state.openWorld.coordinates` · index ta đ.
4. `WORLD_MAP.locations` · projection UI.
5. `WORLD_MAP.nodePool` · registry hp nht.

Khng subsystem no đc t to bn sao node ngoi registry.

## 6. Index ta đ v chng trng

Engine phi duy tr index:

```js
state.openWorld.coordinateIndex["x,y"] = nodeId;
```

API bt buc:

```js
getNodeAtCoordinate(state, x, y)
ensureNodeAtCoordinate(state, x, y, options)
coordinateKey(x, y)
neighborCoordinate(x, y, direction)
validateCoordinateUniqueness(state)
```

Nu ta đ đ tn ti, `ensureNodeAtCoordinate()` tr node hin ti v khng to bn sao.

## 7. Sinh node theo hng

### 7.1. Thut ton

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

### 7.2. Lin kt hai chiu

```text
A --Đng--> B
B --Ty--> A
```

Khng đc ghi mt chiu. Sau mi mutation phi chy invariant:

```js
assert(getExit(B, "tay") === A)
```

### 7.3. Sinh pool

Pool node đc chn theo:

- Vng (`regionId`).
- Đa hnh (`terrain`).
- Khong cch t mc `(0,0)`.
- Thi tit hin ti.
- Influence t chc.
- Bng t l NPC/qui.
- Trng thi incident hoc chin tranh.

Tn hin th ly t pool t nhin:

```js
{
  regionId: "bac_nguyen",
  terrain: "ice_valley",
  names: ["Hn Nguyt Cc", "Tuyt Tm L", "Lam Bng Đi"]
}
```

Khng ni ta đ s vo `name` hin th.

## 8. Node authored v node runtime

### Authored node

L node thit k sn cho cc đa đim quan trng:

- Thin Nguyn Sn.
- Tng đn t chc.
- 150 t chc.
- Thnh trn, phng th, thn, bn tu, trm dch.
- Cm đa, b cnh, hi cng v landmark.

### Runtime node

Đc sinh khi ngi chi hoc NPC m rng th gii. Runtime node phi:

- C ta đ hp l.
- C tn pool.
- C region/terrain.
- C NPC/qui theo bng spawn.
- C lin kt ngc.
- Đc lu vo registry hp nht.

## 9. T chc v vng nh hng

Mi t chc c node tng đn ring:

```js
{
  mapNodeType: "organization",
  organizationId: "guild_001",
  coordinate: { x: -1, y: 10 }
}
```

Di chuyn ti node t chc khng yu cu gia nhp. Gia nhp ch đc kim tra bi `guildEligibility()`/`joinGuild()`.

nh hng t chc trn node đc tnh đc lp:

```js
organizationCoverageSnapshot(state, nodeId)
```

Coverage da trn:

- Khong cch Oxy ti tng đn.
- Cp t chc.
- Ti nguyn v sc mnh.
- Outpost/structure ti node.
- Quan h ngoi giao.
- Chin tranh hoc phong ta.

Coverage khng lm mt lin kt di chuyn. Phong ta ch thay đi risk, cost, encounter hoc phng thc đi.

## 10. NPC v qui vt

NPC phi dng `currentNodeId` v ty chn `currentSubLocationId`. Qui phi dng `spawnNodeId`/`currentNodeId`.

Khi node đc sinh:

1. Chn NPC pool theo vng v loi node.
2. Chn qui pool theo đa hnh, danger v thi tit.
3. Ghi spawn record gn vi node ID.
4. Cho NPC pathfinding trn ta đ Oxy.
5. Khi cnh b phong ta, tm đng vng bng BFS/A* trn node đ bit.

NPC khng đc xut hin ti node cha c trong registry. Combat encounter phi tham chiu node hin ti, khng ch tham chiu region.

## 11. Thi tit v ta đ

Thi tit đc xc đnh theo `regionId` ca node hin ti. Khi node nm trn ranh gii, dng climate zone ca node v gradient ln cn.

Ta đ nh hng:

- Thi gian đi.
- Ri ro thi tit.
- T l NPC tr n.
- T l qui xut hin.
- Kh nng thm him ti nguyn.
- Kh nng m đng bin, ni hoc bng.

Weather khng đc dng đ xa node hoc xa lin kt; ch p dng modifier v incident.

## 12. Movement contract

`startTravel(fromId, toId, mode)` phi:

- Xc nhn c hai node tn ti trong registry.
- Tnh Manhattan distance t coordinate.
- Tnh mode speed, weather modifier v terrain modifier.
- Kim tra combat/travel task đang hot đng.
- Kim tra cost.
- Khng kim tra điu kin gia nhp t chc.
- Ghi `fromCoordinate`, `toCoordinate`, `distance`, `mode`, `weather`, `risk` vo travel task.

Nu ngi chi chn action hng:

```text
Đi Bc / Đi Nam / Đi Đng / Đi Ty
```

engine phi resolve node theo ta đ trc, sau đ gi cng mt `startTravel()` canonical. Khng đc c mt logic ring ch đc `LOCATIONS.exits` ci.

## 13. UI projection

Gameplay dng ta đ Oxy; UI ch chiu sang phn trm:

```js
screenX = ((x - minX) / (maxX - minX)) * 100;
screenY = 100 - ((y - minY) / (maxY - minY)) * 100;
```

UI khng đc sa ta đ gameplay khi zoom/pan.

Hin th:

- Node hin ti: vng duy nht.
- Chnh đo: xanh lam.
- Ma đo/T đo/Hc đo: đ tm hoc đ sm.
- Trung lp: tm xm.
- Phng th: vng cam.
- Thnh trn: xanh lam nht.
- Thn: xanh lc.
- Bn tu: xanh ngc.
- Trm dch: tm sng.
- Đ thm him: hin th tn v marker.
- Cha thm him: ch hin th trng thi, khng l NPC/qui/c duyn.

Zoom/pan/reset ch tc đng lp projection node, khng thay đi registry.

## 14. Migration t h thng hin ti

### Bc 1 · Chun ha catalog

- Gn ta đ Oxy cho ton b node static.
- Chuyn ta đ t chc phn trm thnh ta đ Oxy authoring.
- Gn `mapNodeType` v `terrain`.
- To `coordinateIndex` v pht hin trng.

### Bc 2 · Đng b save ci

- Save c `openWorld.coordinates` gi nguyn nu hp l.
- Save thiu ta đ static đc map t bng migration c đnh.
- Save c node tn ta đ ci đc đi tn hin th nhng gi nguyn ID.
- Khng t đng xa node hoc reset `visitedLocations`.

### Bc 3 · Canonical movement

- Hng ci gi `resolveDirectionalNode()`.
- Click node gi `startTravel()`.
- Xa cc nhnh movement t đc `exits` m khng qua coordinate resolver.

### Bc 4 · Đng b NPC/qui

- Chuyn mi `currentNodeId` v node registry.
- B sung fallback cho NPC save ci.
- Chy repair reciprocal links sau load.

## 15. Invariants v kim th

Bt buc c test:

1. Mi node c ta đ hp l.
2. Khng c ta đ trng.
3. Bc/Nam v Đng/Ty đi xng.
4. T `(0,0)` đi bn hng to đng bn ta đ.
5. Node runtime khng c tn ta đ k thut.
6. 150 node t chc đu c ta đ v node ring.
7. Mi node thnh trn/phng th/thn/bn tu/trm dch c `mapNodeType` đng.
8. Node cha khm ph khng l NPC/qui/c duyn.
9. NPC v qui lun tham chiu node tn ti.
10. Phong ta khng xa lin kt, ch to modifier.
11. Di chuyn ti node t chc khng yu cu membership.
12. Gia nhp t chc vn kim tra eligibility ring.
13. Zoom/pan khng thay đi coordinate.
14. Save/load gi nguyn ta đ v visited state.
15. T mi node test c th resolve Bc/Nam/Đng/Ty.

## 16. Tiu ch hon thnh

## 16.1. Bin vc v node ra

## 16.3. M hnh hin th kt hp

- Gameplay gi h Oxy 100100; UI khng thay đi ta đ gameplay khi zoom hoc pan.
- Vn Gii L dng canvas viewport ln (ti thiu 620px, ti đa theo chiu cao mn hnh) thay v nhi ton b node vo khung nh.
- C bn mc zoom: Ton cnh, Vng, Khu vc, Node. Zoom ch thay đi projection v mt đ hin th.
- Zoom xa ch hin region, t chc cp cao v node ln; zoom gn mi hin t chc cp thp, node dn c, NPC, qui v c duyn.
- Node ngoi viewport phi đc culling khi DOM; node gn nhau đc gom cluster v tch ra khi zoom vo.
- Layer UI cho php bt/tt t chc, node dn c, NPC, qui, c duyn, influence v tuyn thng mi.
- Nhn t chc cp thp ch hin khi hover; nhn cp cao c th hin th m  zoom Vng.

- Node c `max(abs(x), abs(y)) >= 45` đc đnh du `isEdge`.
- Khu vc ra khng phi tng chn; đy l vng m rng ca th gii.
- UI phi hin th thng bo bin vc v bn action: Thm him bin vc, Dng trm tin tiu, Xin h tng qua bin, M tuyn thng mi.
- Action ra dng transaction contract, c cost/risk/incident ring v khng xa lin kt bn hng.

## 16.2. Pool d liu bn đ

- `WORLD_MAP.nodePools` cha pool tn, terrain v loi node.
- `WORLD_MAP.coordinateSystem` khai bo min `[-50,49]` v origin.
- `WORLD_MAP.edgeActions` khai bo action đc php  node ra.
- Pool đc dng chung bi authored node, runtime node, NPC, qui, t chc, weather v exploration.

Feature đt 100% khi:

- Tt c node static v runtime dng Oxy.
- `exits` ch l cache đc sinh t đng.
- Khng cn node b kt ch v thiu mt hng trong catalog.
- Khng cn tn node hin th dng ta đ s.
- 150 t chc, thnh trn v cc node ph nm trong cng node pool.
- NPC, qui, thi tit, t chc, thm him v incident đc cng node registry.
- Movement action, click node v NPC pathfinding dng cng resolver.
- Save migration v invariant tests đu pass.


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

# MAP SYSTEM V2 · THIT K TON DIN CHO OPEN WORLD THC S
> Thay th/hp nht `MAP_SYSTEM.md` + phn bn đ trong `WORLD_INTERCONNECTION_SYSTEM.md` mc 1-4.
> Vn đ ct li cn sa: bn đ hin ti vn l "node-graph c sinh procedural" nhng CM GIC nh
> danh sch hp ni nhau, khng phi th gii sng · th lc khng tht s "chim khng gian", ngi
> chi khng c cng c đnh hnh bn đ, di chuyn khng c trng lng.

---

## 1. KIN TRC 4 LP BN Đ (thay v 1 lp node-graph phng)

```
Lp 1 · TH GII (World Map):     tng quan ton vng, hin vng nh hng Faction dng heatmap,
                                    dng đ ln k hoch di chuyn xa, KHNG hin chi tit tng node
Lp 2 · VNG (Regional Map):       chnh l node-graph hin c (grid ta đ x,y t MAP_SYSTEM.md 6),
                                    đy l lp chi chnh hng ngy
Lp 3 · ĐA ĐIM (Node Detail):    MI · bm vo 1 node đ khm ph, m ra sub-map cc đim nh BN
                                    TRONG node đ (ch/snh chnh/hm sau/kho...), NPC đng  ĐNG
                                    đim nh c th, khng cn "c node l 1 hp m"
Lp 4 · INSTANCE (B Cnh/Mng Cnh/Ni tht Đng Ph): tch bit hon ton khi li chnh, đ c
                                    khung  cc ti liu trc, gi nguyn
```
Đy l thay đi NN TNG quan trng nht · gii quyt trc tip cm gic "cha phi open world tht"
v trc gi ch c Lp 2, khin mi node d to (Vng Kinh) hay nh (trm gc) đu cm gic nh
nhau (1 hp bm vo l xong).

---

## 2. LP 3 CHI TIT · NODE DETAIL VIEW (gii quyt "node l hp rng")

```
NodeDetailLayout {
  nodeId,
  subLocations: [
    { id, name, type: "market"|"hall"|"alley"|"warehouse"|"gate"|"shrine"|"training_ground",
      npcsPresent: [npcId], actionsAvailable: [...], visualTag }
  ]
}
```
- S lng `subLocations` ty quy m node: Trm gc nh = 1-2 đim; Tng Mn/Vng Kinh ln = 5-8
  đim khc nhau.
- NPC gi gn vo ĐNG 1 `subLocation` c th (khng cn "NPC  node" m h) · Trng Lo  "Snh
  Chnh", Thng Nhn  "Ch", gin đip/Ma Đu thng xut hin  "Hm Sau" (dng đng  tng Mt
  Hi đ thit k, gi c V TR C TH đ player phi ch đng ti đng ch mi bt gp).
- Action Bar ti Lp 3 ch hin action lin quan ti `subLocation` đang đng (VD "Ch" mi c Giao
  Dch, "Hm Sau" mi c Điu Tra Mt Hi) · bin vic di chuyn TRONG 1 node cing c  ngh)a chn
  la, khng ch di chuyn GIA cc node.

---

## 3. LNH TH THEO GRADIENT (KHNG CN NH PHN S HU/KHNG S HU)

### 3.1. Vng nh Hng (Influence Radius) thay v `ownerFactionId` cng
```
Mi Faction node (Tng Mn/Th Gia chnh) pht ra "sc nh hng" gim dn theo khong cch:
  influenceAt(node, faction) = faction.power  decayFactor^(distance(node, faction.homeNode))
  // decayFactor v d 0.7 · mi  xa thm, nh hng cn 70%  trc

Mi node THNG (khng phi Faction chnh) c `influenceMap: { factionId: number }` · TNH LI mi
worldTick, khng c đnh. `ownerFactionId` ci gi SUY RA t influenceMap (Faction c influence cao
nht ti node đ > ngng no đ mi đc coi l "ch", nu khng ai vt ngng -> node "v ch
thc s", khng phi mc đnh thuc v Faction gn nht).
```

### 3.2. Vng Tranh Chp (Contested Zone) · h qu trc tip ca gradient
```
Node c 2+ Faction cng influence gn bng nhau (chnh lch < 15%) -> đnh du "Tranh Chp":
  - `eventPoolTag` đi thnh hn hp (trn trng s s kin ca C 2 Faction lin quan)
  - C 2 Faction đu c th giao nhim v TI node ny (d khng "s hu" chnh thc)
  - Player hon thnh quest cho 1 bn ti đy s đy influence bn đ ln · GIP NGI CHI THC S
    ĐNH HNH BN Đ bng hnh đng, khng ch đng xem th lc t chin tranh (đ c
    WORLD_INTERCONNECTION_SYSTEM.md mc 2.2, gi c thm 1 con đng NH HNG MM song song
    chin tranh trc din)
```

### 3.3. Bn đ Heatmap  Lp 1 (World Map)
Hin mu chng lp theo `influenceMap` tng hp ton vng · ngi chi nhn Lp 1 thy NGAY "vng
ny đang l ca ai, vng no đang tranh chp nng" m khng cn bm tng node  Lp 2.

---

## 4. NGI CHI ĐNH HNH BN Đ (MAP AGENCY · hin hon ton th đng)

### 4.1. Cm C/Lp Trm (Claim Outpost)
```
Ti 1 node V CH THC S (khng Faction no vt ngng influence, mc 3.1), player c action mi
"Lp Trm" · cn Linh Thch + thi gian (vi ngy GameClock), sau đ:
  - Node đ c `ownerFactionId = "player_outpost_" + characterId` (player CHNH THC l 1 thc th
    c lnh th trn bn đ, khng ch c Đng Ph đn l)
  - T pht ra influence NH quanh n (dng cng thc mc 3.1, `power` thp hn Faction tht nhiu)
  - C th b Faction khc "ln" nu khng cng c (đng c ch gradient, khng phi bt t)
```

### 4.2. Xy Dng Ti Trm/Đng Ph (Structure Building)
| Cng trnh | Hiu ng ln bn đ |
|---|---|
| Vng Gc (Watchtower) | Tng bn knh `revealAdjacentNodes` (MAP_SYSTEM.md mc 2) quanh trm · nhn xa hn m khng cn t đi |
| Trm Dch (Waystation) | Thm 1 đim Fast Travel (mc 5) min ph ti đy |
| Th Tp Nh (Trading Post) | NPC Thng Nhn t đng gh qua theo lch (dng `scheduleType: itinerant` đ c), khng cn player ch đng tm |
| Trn Php Phng Th | Tng "power" pht influence ca trm (đ ni  `PHAC_THAO_TU_VI_CON_DUONG_V3.md` · Trn Php S ngh mi) |

### 4.3. Tuyn B Ch Quyn Ln Faction Tht (Territory Petition)
Nu player đang phc v 1 Faction (đ gia nhp), c th "hin" 1 Trm ca mnh cho Faction đ ·
Trm tr thnh lnh th chnh thc ca Faction (tng `power` gc ca Faction đ lu di), đi li
Cng Hin/factionReputation tng vt · bin vic m rng bn đ c nhn thnh ĐNG GP thc s cho
t chc mnh chn, khng phi 2 h thng tch ri.

---

## 5. DI CHUYN C TRNG LNG (TRAVEL AS MEANINGFUL MECHANIC)

### 5.1. Chi ph di chuyn tht (khng cn tc thi v hn)
```
travelTimeGameDays = distance(from, to) / travelSpeed(travelType)
  travelType "walk" (mc đnh): speed chun
  travelType "ng_kh" (cn Cng Php/Thn Php ph hp): speed 3
  travelType "truyn_tng_trn": tc thi NHNG cn đ c Trm Dch/Fast Travel  C 2 đu (mc 4.2)

Trong lc di chuyn nhiu ngy: roll s kin dc đng theo ĐNG c ch đ c
(RANDOM_EVENT_SYSTEM.md mc 1, trigger "moving_through"), nhng gi S LN ROLL t l vi s ngy
di chuyn thc (đi cng xa cng nhiu c hi/ri ro dc đng, khng phi 1 ln duy nht bt k xa
gn nh hin ti).
```

### 5.2. Fast Travel · m dn, khng c sn t đu
```
Đim Fast Travel CH tn ti ti: node ct truyn đ khm ph LN ĐU (t đng unlock), hoc Trm
Dch do player/Faction xy (mc 4.2). Di chuyn bng Fast Travel gia 2 đim đ unlock: tn Linh
Thch (khng tn ngy GameClock), KHNG roll s kin dc đng (an ton tuyt đi, đ l ci gi
Linh Thch phi tr) · to la chn r rng: đi b (r, chm, ri ro/c hi) vs Fast Travel (đt,
nhanh, an ton).
```

### 5.3. Đon Đng Hnh Gim Ri Ro
Nu c NPC "h tng" (thu ti Phng Th hoc Faction c theo nu Cng Hin đ cao) đi cng trong
chuyn di chuyn di, gim % s kin Qui Vt/Hc Đo dc đng · chi ph thu t l vi đ di
qung đng, to la chn kinh t tht (t đi r nhng ri ro, thu h tng đt nhng an ton hn).

---

## 6. TH LC HIN DIN THT TRN BN Đ (khng ch l con s n)

### 6.1. Đi Tun Tra Di Đng (Patrol Icons)
NPC lnh/đ t tun tra (đ c `scheduleType: patrol`) gi hin th NGAY TRN BN Đ LP 2 di dng
1 icon nh DI CHUYN DC EDGE gia cc node theo lch trnh tht (khng phi ch xut hin khi
player tnh c  cng node) · ngi chi nhn bn đ thy đc "vng ny đang c bao nhiu lnh
tun tra qua li", to cm gic lnh th đc BO V THT ch khng phi nhn dn.

### 6.2. Kin Trc Node Đi Theo Ch S Hu
Node do Faction Chnh Đo s hu vs Hc Đo vs v ch c visualTag khc nhau (khng cn chi tit đ
ha, ch cn field m t đi: "Cng Tng Mn uy nghim" vs "Tri ln xiu vo ca sn tc" vs "Tn
tch hoang ph khng ngi canh gi") · đc m t node l bit ngay tnh cht khu vc.

### 6.3. Bng Tin Faction (Bulletin Board) ti node Faction s hu
Hin danh sch `faction_daily` quest hin ti CA FACTION Đ ngay khi player vo node (khng cn
tm NPC c th mi thy quest) · đng thi hin "Tin Tc Vng" (world event gn đy lin quan
Faction ny: thng/thua trn no, B Cnh no sp m) · bin node Faction thnh đim THNG TIN
trung tm, khng ch đim giao dch/nhim v.

---

## 7. SNG M CHIN TRANH · 4 CP Đ (thay v ch discovered=true/false)

| Cp | Tn | Điu kin | Hin th |
|---|---|---|---|
| 0 | Cha Bit | Cha tng nghe ni | "Cha khm ph" (nh hin ti) |
| 1 | Nghe Đn | NPC ti node ln cn nhc ti (qua hi thoi/Bng Tin mc 6.3) NHNG cha ti | Hin TN node (khng cn n hon ton) + m t m h 1 cu, v tr gn đng trn Lp 1 nhng KHNG hin trn Lp 2 grid chnh xc |
| 2 | Đ Khm Ph | Đ tng ti | Đy đ nh thit k gc |
| 3 | Thng Thuc | Ti >= 5 ln HOC c Trm/Đng Ph ti đy | M thm: nhn thy `subLocations` (Lp 3) NGAY T Lp 2 khng cn bm vo, v thy `influenceMap` chi tit (khng ch ch s hu chnh) |

Cp 1 "Nghe Đn" l b sung MI quan trng · gii quyt cm gic th gii m hin ti "hoc bit 100%
hoc khng bit g" kh cng, gi c trng thi trung gian to đng lc THT S mun đi ti (đ
nghe tn, t m mun xc nhn) thay v random hon ton m m.

---

## 8. SCHEMA TNG HP (cp nht `MapNode` đ c  `MAP_SYSTEM.md` mc 1 v 6.7)

```
### 8.1. Contract thc thi b sung

**L3 node detail:** mi `subLocation` c `id`, `type`, `displayName`, `actions`, `capacity`, `visibilityFog`. NPC schedule tr `currentSubLocationId`; đim đy hoc b kha th NPC fallback v `main`. State machine l `outside_node -> entering_node -> inside_sub_location -> leaving_node`. Chuyn đim trong cng node khng roll encounter; action lun gi `nodeId + subLocationId` nhng save gi hai field tch bit.

**Influence/heatmap:** influence l derived state, cache theo `worldTick + factionVersion + structureVersion + eventVersion` v phi rebuild deterministic. BFS t faction home nodes, cng thc `power * 0.70^distance * (1 + structureBonus + eventBonus + outpostBonus)`, clamp `[0,100]`. `stable` khi top >=35 v margin >=15%; `contested` khi top-two margin <15%; cn li `frontier`. Heatmap khng đc suy lun owner  fog 0.

**Fog 03:** discovery event chun `{ nodeId, level, source, actorId, tick }`; reducer p dng max level v idempotent journal. Rumor=1, visit=2, survey/outpost/waystation=3. `revealAdjacentNodes` ch nng ti đa mt cp, khng spoil sub-location.

**Outpost/structures:** claim theo `preview -> establish -> maintain`. Preview khng mutate; establish tr cost mt ln v to `outpostId`; maintain tr upkeep mi world tick, integrity v 0 th v hiu ha ch khng xa lch s. Structure c `level`, `integrity`, `upkeep`, `effects`, `builtBy`; khng trng type trong node, ti đa ba structure.

**Weighted travel:** task c trng thi `planned | active | interrupted | completed | cancelled`, snapshot kha route, distance, ETA, risk seed, escort v cost. Mi ngy roll bng `taskId + dayIndex` đ retry idempotent. Escort c `riskReduction`, `dailyCost`, `canFlee`. Fast travel cn unlock hai đu, khng combat/instance, khng road event nhng vn ghi travel log.

**Patrol/bulletin:** patrol l projection trn edge `{ patrolCount, factionId, threat, nextTransitionTick }`, khng to node mi. Bulletin ti đa ba tin, c `requiredFog`, `expiresAt`, `actionId`; filter trc khi render.

**Transaction resolver:** mi map mutation chy qua `resolveMapTransaction({ actionId, actorId, expectedVersion, validate, apply, rollback })` v tr `{ success, reason, data, transactionId, stateVersion }`. Version check, cost/permission/fog check, journal v rollback l bt buc. Idempotency key gm `actionId + actorId + inputHash`.

**Acceptance tests:** L3 đng NPC/action; influence BFS v contested threshold; fog migration/privacy; outpost thiu cost/maintenance; travel retry/interruption/fast travel; patrol edge v bulletin expiry; rollback khi mutation gia chng.

MapNode {
  ...(gi nguyn ton b field ci: id, nodeType, regionTag, x, y, isProcedural, dangerLevel,
      linhKhiDensity, eventPoolTag, cooldownUntil, claimedByPlayerId)...

  fogState: 0-3,                          // thay th `discovered: boolean` ci (mc 7)
  influenceMap: { factionId: number },     // thay th `ownerFactionId` t)nh (mc 3.1) · ownerFactionId
                                            // gi l GETTER tnh t influenceMap, khng lu trc tip
  subLocations: NodeDetailLayout | null,    // null nu node qu nh đ cn Lp 3 (mc 2)
  patrolSchedule: [{ npcId, fromNode, toNode, cycleHours }],  // mc 6.1
  playerStructures: [{ type, builtByCharacterId, builtAt }],   // mc 4.2
  fastTravelUnlocked: boolean,              // mc 5.2
}
```

---

## 9. VIC CN LM TIP (u tin · đy l redesign ln, KHNG lm ht cng lc)
1. **Lm trc tin:** mc 3.1 (influence gradient thay `ownerFactionId` t)nh) · mi mc khc (3.2,
   4, 6) đu ph thuc d liu ny tn ti trc.
2. **Lm th hai:** mc 7 (4 cp sng m) · đc lp tng đi, ci thin cm gic khm ph ngay lp
   tc m khng cn ch mc 1 xong.
3. **Lm th ba:** mc 2 (Lp 3 Node Detail) · cn nhiu ni dung th cng hn (đt NPC vo đng
   subLocation), nn lm sau khi khung d liu (mc 8) đ n đnh.
4. **Lm sau cng:** mc 4 (Player Map Agency · Lp Trm/Xy Dng) v mc 5.2-5.3 (Fast Travel/Đon
   H Tng) · đy l tnh nng CH ĐNG phc tp nht, cn nn tng gradient + fog 4 cp n đnh
   trc đ khng phi sa li logic 2 ln.
5. Quyt đnh li cu hi multiplayer cn treo (đ nhc  nhiu ti liu trc) · mc 4.1 "Lp Trm"
   đc bit cn cu tr li r TRC khi code, v  ngh)a "trm ca player" khc hn nu server-wide
   (ngi khc thy đc/c th ph) vs single-player (ch nh hng th gii ring).
---

## AMENDMENT 2026-09-16 — MAP V2/INTERACTION VÀ CÔNG TRÌNH

Map V2 là khoảng trống ưu tiên: influence gradient phải đi qua API canonical; fog, completion, node history, sub-location và travel weighting phải dùng cùng resolver, không đọc các bảng faction rời rạc trực tiếp. UI bản đồ hiển thị influence/completion nhưng không được tự tính lại luật gameplay.

Tab Thế giới sở hữu feature **Công Trình Bản Đồ**. Hai loại công trình người chơi xây dựng là **Truyền Tống Trận** (mở đầu fast travel ở node) và **Hộ Giới Đại Trận** (giảm encounter/curse risk, tăng influence). Alias nội bộ legacy (`waystation`, `ward_formation`) phải được migrate về canonical type (`teleport_array`, `world_ward`) mà không làm mất save cũ. Mọi xây dựng kiểm tra node, trùng công trình, chi phí và ghi node history; không đặt logic này vào Con Đường hay Nghề Ẩn.


### Source: `archive-requirements\logic-history\03-world\MAP_WEATHER_INTEGRATION_TRACE.md`

# Map V2 · Weather Integration Trace

## Phm vi

Ti liu ny truy vt phn thi tit đc trin khai t mc 10 ca `MAP_SYSTEM_V2_COMPLETE.md`.

## Contract đ trin khai

- By trng thi thi tit: `quang`, `mua`, `suong`, `loi_vu`, `linh_phong`, `tuyet`, `am_vu`.
- Weather lan truyn theo tuyn vng ln cn, c bias t thi tit nghim trng ca vng k bn.
- Thi tit gi n đnh theo `weatherUntilDay`, khng reroll mi frame.
- Ma tng nguy c v gim tc đ; tuyt gim tc đ mnh; li vi chn ng kh; m vi tng hao tn v nguy c.
- Thi tit đc đa vo travel preview, world modifier, NPC reaction v structured game log.
- Khi thi tit vng hin ti đi, log ghi li trng thi trc/sau v metadata node, vng, NPC, fog.

## API trace

| API | Vai tr |
|---|---|
| `setWeather` | p thi tit c thi hn |
| `updateWeather` | Sinh thi tit deterministic theo vng v lng ging |
| `worldModifierPreview` | Tr modifier chin đu/di chuyn/tm cnh |
| `travelPreview` | Tnh tc đ, s ngy, risk theo thi tit |
| `npcWeatherPreview` | D bo phn ng NPC |
| `resolveNpcWeatherReaction` | Commit tr n/lch trnh/mood |
| `getCurrentRegionViewModel` | Cung cp weather cho UI Map |
| `pushHistory/createGameEvent` | Ghi weather, node, NPC, fog vo log |

## Acceptance

1. Cng seed, cng ngy v topology cho cng thi tit.
2. Vng k Bo Linh Kh/m Vi c xc sut nhn weather tng ng cao hn.
3. Ng kh b t chi khi c Bo Linh Kh.
4. Tuyt v Ma lm thay đi travel days/risk.
5. Weather transition ti node ngi chi to log structured, khng to log lp trong cng tick.
6. UI khng hin th `undefined` khi region thiu `description`; dng `desc` hoc tn vng.


### Source: `archive-requirements\logic-history\03-world\OPEN_WORLD_COSMIC_CONSTELLATION_MAP_REQUIREMENT.md`

# Open-World Cosmic Constellation Map

## Bn đ Vn Gii · phn lp hin th chun

## Cnh gii t chc theo Con Đng

- H s t chc khng đc hin th cnh gii legacy nh Luyn Kh, Trc C, Kim Đan.
- `guild.highest_realm` ch dng lm kha tng thch; UI phi nh x sang `GameData.REALMS` ri dng `PATH_FATE_RELATIONS.path_titles[pathId]`.
- Khi nhn vt cha chn Con Đng, hin th Con Đng bc N thay v ba tn cnh gii.
- Điu kin gia nhp phi din gii bng tn cnh gii Con Đng tng ng vi `minRealm`, khng hin th dng s tr khi dng trong tooltip k thut.

## Complete node links v sinh node đnh hng

## Node pool hp nht

- `WORLD_MAP.nodePool` l registry duy nht cho đa danh, t chc, phng th, thnh trn, thn, bn tu, trm dch v vng hoang d runtime.
- Node runtime khng dng tn ta đ dng `Bng Nguyn -1`; tn phi ly t pool cnh quan theo vng v loi đa hnh.
- Mi node lu km `npcs`, `enemies`, `organizationId` v `mapNodeType` đ NPC/qui, t chc v thm him cng đc mt ngun d liu.
- Khi sinh node mi, engine ghi node vo c `LOCATIONS`, `openWorld.nodes` v `WORLD_MAP.nodePool`.

- Mi node khi đc np phi c đ bn hng Bc/Nam/Đng/Ty.
- Nu catalog thiu hng, engine sinh node runtime k cn ngay ti thi đim resolve topology v ghi reciprocal link.
- Node runtime mi lun gi lin kt quay v node sinh ra; cc hng cn thiu tip tc đc sinh lazy khi ngi chi chn hng.
- `mapNeighbors()` v `mapDistance()` vn coi ton b node l complete graph đ travel t do gia mi node hp l.

- Mu vng ch dnh cho node vng cha nhn vt (`currentRegionId`); khng dng cho ghim t chc hoc node sao t chc.
- Ghim t chc phi phn mu theo alignment/allegiance v gi kch thc theo `pyramid_tier`.
- Nhn t chc dng cng mu alignment, khng dng mu vng mc đnh.
- Sao t chc ph ch l lp dn đng m, khng đc che hoc bin thnh trng thi Vng hin ti.
- Trng thi khm ph v quyn di chuyn l hai lp đc lp: node cha khm ph vn đi đc  backend nhng UI ch hin th Cha thm him.

## Quy tc hin th Vn Gii L (b sung)

- Mu vng ch dnh cho đng vng cha `state.locationId`; khng đc p dng cho ton b node.
- Node t chc dng mu theo `alignment/allegiance`: Chnh đo xanh lam, Ma/T đo đ tm, Trung lp tm xm.
- Kch thc ghim t chc t l nghch vi `pyramid_tier` (Tier 1 ln nht).
- C th đi l quyn backend, khng phi mu giao din; frontend ch hin th Đang  đy, Đ thm him, Cha thm him v marker n sau Fog.
- Marker Nguy him, NPC v C duyn ch đc render khi node đ thm him.
- Zoom, thu nh, reset v pan phi tc đng ln lp node hin th, khng ch SVG đng ni.

## Mc tiu

Lp trnh by bn đ chuyn t s đ node/edge sang **Thin Đ Chm Sao**. D liu nn khng thay đi: gi nguyn ID đa đim, vng, route, fog, visited, locked, v tr nhn vt, travel v action.

## u tin trin khai: Khu vc hin ti

`Khu vc hin ti` l mn hnh mc đnh đ ngi chi ra quyt đnh. Mi thay đi v map phi đc p dng  đy trc khi m rng sang Vn Gii L. Local map phi dng cng ngn ng chm sao nhng mt đ thng tin cao hn World Map:

- Sao hin ti, sao ln cn v cc route c th đi.
- Sub-location, NPC hin din, patrol edge, weather, influence v incident ti node.
- Fog/visited/locked p dng trc khi to label hoc action.
- Travel active/restricted/blocked hin th ngay cnh route.
- Thm Him, bulletin, cng trnh v thao tc NPC phi m t local map m khng cn chuyn tab.
- World Map ch cung cp bi cnh v) m; khng đc ghi đ node/region/weather đang hin th  local map.

## Khng gian hin th

- Canvas ln hn viewport, c khong trng c ch đch v cm gic th gii v tn.
- Bn đ dng nn tinh vn xanh đen, nh sao xanh/trng, đim vng cho đa danh quan trng, tm/đ cho vng nguy him.
- Vng ch l kh quyn/tinh vn v cm sao, khng phi khung ch nht hay panel.
- V tr đc biu din bng sao; ngi chi l sao sng nht c qung xung đng.

## Chm sao v mc chi tit

- Cosmic view: ch hin vng ln v sao quan trng.
- Region view: hin cm sao, thnh tr, tng mn v route đ khm ph.
- Local view: hin node, NPC, dungeon v đng gn.
- Close view: hin nhn, sub-location, NPC v tng tc chi tit.
- Nhn ch hin khi hover, selected, current, nearby hoc important.
- Route l đng mnh, m, khng mii tn; gim đ u tin so vi sao.

## Discovery/Fog

- Unexplored: sao m, khng nhn, route n.
- Discovered: sao sng hn, route ln cn hin.
- Visited: marker bn vng v glow mnh hn.
- Locked: sao ti, route rt m v biu tng kha ty ng cnh.
- Discovery phi to cm gic tng mnh chm sao đc ni li, khng phi m mt  li.

## Camera v điu hng

- Zoom in/out, center-on-player, drag-to-pan v focus mm trn sao đc chn.
- Khng t đng fit ton b th gii vo viewport.
- Zoom phi c level-of-detail: xa n nhn/route, gn hin chi tit.
- Travel vn dng route v transaction resolver hin ti; giao din mi ch thay visualization.

## Phenomena v tng tc

- Weather, influence, faction blockade, patrol, incident v NPC presence đc th hin bng mu/glow/icon ph.
- Vng Linh Phong, m Vi, cm đa v di tch c c bin th tinh vn/đng đt nh.
- Chn sao m Current Region View Model, bulletin, weather, NPC, sub-location v action hp l.

## Hiu nng

- u tin SVG ti u hoc Canvas; decorative stars tch khi gameplay stars.
- Khng to panel DOM nng cho mi đa đim.
- Ch render label v connection theo zoom/fog.

## Tiu ch nghim thu

- Khng cn cm gic flowchart hoc bng node-card.
- Vng hin ti, weather, NPC v travel khp cng mt node/region source.
- Zoom/center hot đng, khng lm mt click vo sao hoc faction.
- Save ci load nguyn trng v tt c action/travel ci vn chy.

## UX chi tit

### Thanh cng c bn đ

- Nt `>` đa camera v sao ca nhn vt, reset zoom v pan.
- Nt `/` thay đi zoom theo bc 0.2, gii hn 0.72.4 đ khng mt kh nng đnh hng.
- Ko nn bng chut/touch đ pan; ko khng đc kch hot khi bt đu trn nt, faction pin hoc star.
- Hin th trng thi zoom v ta đ vng trong tooltip h tr ngi chi kim sot camera.
- Nt c `aria-label`, focus-visible v tng phn đ cho nn ti.

### Phn hi khi chn sao

- Hover: tng glow, hin tn v loi sao.
- Focus/keyboard: hnh vi ging hover, Enter m h s vng.
- Current star: halo nhp chm, khng nhp nhy qu nhanh gy mi mt.
- Event/war/patrol: dng badge nh hoc mu ph, khng thay đi hnh dng sao qu mnh.
- Faction pin v guild pin m h s ring, khng di chuyn camera ngoi  mun.

### Level of detail theo zoom

| Mc | Hin th | n |
|---|---|---|
| 0.71.0 Cosmic | vng ln, sao quan trng, tinh vn | nhn thng, route xa |
| 1.01.5 Region | cm chm sao, route trong vng, faction | chi tit sub-location |
| 1.52.0 Local | location đ khm ph, NPC/patrol, weather | d liu fog cha đ |
| 2.02.4 Close | nhn gn, bulletin, sub-location, action | decorative star khng tng tc |

### Trng thi travel

- Sao đch đc đnh du `selected`, route đang đi c glow mnh v progress.
- Khi travel active, cc nt travel khc b disable vi l do r rng.
- Khi b blockade/restricted/weather hazard, route dng mu cnh bo v tooltip gii thch nguyn nhn.
- Khi đn ni, camera focus mm vo sao mi, fog tng theo contract v log ghi node/region/weather.

### Tng tc vi NPC

- Sao location c NPC hin din dng halo nh; s NPC khng thay th tn location.
- Hover/close view hin th NPC đang  node/sub-location, schedule, faction v phn ng weather.
- NPC patrol hin th icon trn constellation edge; NPC dn đng m nhanh action Thm Him.
- Encounter/incident to pulse mu cam/đ trong thi gian hu hn; click m la chn, khng t thc hin action.

### Kh nng đc v hiu nng

- Khng dng mu l tn hiu duy nht: lun kt hp glow, icon, nhn hoc tooltip.
- Decorative star phi nm lp ring vi gameplay star đ khng chn click.
- Khi hn 500 location, ch render star trong viewport cng vng đm; route xa chuyn sang batch SVG/Canvas.
- Debounce camera update v khng render li ton b panel khi ch thay đi pan.
- Bn đ phi hot đng  mn hnh nh: controls c đnh gc, star label khng trn viewport.

## Marker bt buc trn Khu vc hin ti

- `_ NPC`: tng hp NPC static v NPC runtime đang sng ti node, ch hin t Fog 2.
- `  Qui`: qui/đch đc đnh ngh)a ti node v combat đang din ra  node hin ti.
- `& C duyn`: pending contested opportunity ti đng node, c glow tm v khng hin th sang node khc.
- `= Tun tra`: marker nm trn edge m patrol NPC thc s đang di chuyn.
- Marker l lp ph, khng che sao; tooltip phi ghi s lng v trng thi.
- Khi đi node, marker phi tnh li t `state.locationId`, `npcState`, `pendingContestedOpportunity` v fog mi; khng dng cache UI ci.
## Chnh sch bn đ m (Open Node Graph)

- Khng render đng ni gia cc node; mi node hp l l đim đn trc tip.
- Khng hin th Cha thm him hoc mu đ Nguy him; dng marker NPC, qui v c duyn.
- Node sao t chc lun enabled, c sao tip cn ph.
- Node va khm ph đc ghi vo `visitedLocations` v hin th trn Vn Gii.


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

# H THNG NPC V2 · DN C SNG, BN Đ ĐNG V THI TIT

**Phin bn:** 1.1
**Phm vi:** m rng `NPC_MONSTER_SYSTEM.md`, `RELATIONSHIP_SYSTEM.md`, `MAP_CURRENT_REGION_UX_REQUIREMENT.md` v World Simulation.
**Ngn ng hin th:** ting Vit; ID k thut ch dng ni b.

## 1. Tm nhn

NPC khng cn l danh sch đng yn ti node đ ngi chi bm Ni chuyn. Mi NPC l mt tc nhn c ni , lch trnh, cng vic, mc tiu, quan h, nhu cu, phn ng thi tit, phn ng cnh quan v k c. Node bn đ l mi trng sng ca mt qun th NPC; ngi chi c th thy nhiu NPC cng tn ti, NPC t tng tc vi nhau v th gii thay đi ngay c khi ngi chi khng đng cnh.

H thng phi m rng s lng NPC m khng bin node thnh danh sch hn lon. Runtime dng phn lp **danh tnh bn vng**, **qun th nn**, **đm đng tm thi**, **ngi qua đng theo hnh trnh** v **NPC s kin**.

## 2. Nguyn tc thit k

1. NPC c danh tnh v trng thi r rng; khng gp mi ngi ngu nhin thnh mt ID.
2. NPC ch xut hin ti node/sub-location khi scheduler xc nhn hin din.
3. Mt đ NPC c th cao; UI phn trang/lc, engine dng spatial index v khng gii hn cng vi NPC mi node.
4. Thi tit tc đng ti hnh vi, lch, gi c, di chuyn, tm trng v chin đu.
5. Tng tc NPCNPC v NPCcnh quan phi to ra hu qu quan st đc.
6. Tt c mutation qua transaction/idempotency; save ci vn ti đc.
7. Khng đ NPC sa topology static. NPC ch m/đng edge runtime đ đc cp php.

## 3. Phn loi NPC v mt đ

### 3.1. Cc lp NPC

| Lp | V d | Danh tnh | C quan h bn vng |
|---|---|---|---|
| `persistent_named` | Chng mn, s ph, thng nhn chnh | ID c đnh | C |
| `persistent_role` | trng trm, y s, đi trng tun tra | ID c đnh theo node | C |
| `population_citizen` | dn c, đ t, phu khun vc | instance n đnh theo node | C hn ch |
| `traveler` | l khch, hc s), thng đon | instance theo hnh trnh | C nu ghi nh |
| `crowd_ephemeral` | đm đng hi ch, nn dn | pool ti s dng | Khng |
| `event_actor` | s gi, k gy lon, nhn chng | ID theo incident | C trong incident |

### 3.2. Quy m node

- Node nh: 530 NPC runtime.
- Lng: 30150.
- Thnh th: 1501.000.
- Sn mn/vng kinh: 5005.000.
- S kin ln c th to thm crowd pool nhng phi c quota theo node, khng gii hn ton cc mt cch ty tin.

Engine khng instantiate ton b NPC mi frame. Dng `populationSeed`, `activeActors`, `backgroundCount` v materialize c th khi ngi chi quan st/tng tc.

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

`instanceId` bt buc vi NPC khng c đnh; khng đc dng tn hin th lm kha quan h.

## 5. Authoring Node Detail cho NPC

Mi node khai bo **NPC ecology profile** ring, khng copy mt cu hnh chung:

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

V d: Sn mn c đ t  sn luyn, trng lo  chnh đin, tp dch  kho, khch  cng; thnh cng c thy th  bn, thng nhn  ch, ngi đa tin  trm dch. Khng cho php mi node mc đnh cng mt danh sch `market/hall/alley` m khng c profile.

## 6. Scheduler v quyt đnh NPC

### 6.1. Vng lp theo tick

Mi world tick:

1. Cp nht thi tit v cnh bo mi trng.
2. Kim tra lch lm vic/gi m ca.
3. Đnh gi nhu cu, mc tiu v nguy c.
4. Chn hnh đng bng utility score deterministic.
5. Di chuyn theo route hp l hoc tm shelter.
6. Resolve tng tc NPCNPC, NPCcnh quan v NPCngi chi.
7. Ghi s kin v invalidate view model node b nh hng.

```text
utility(action) = goalWeight + needUrgency + weatherFit + relationshipBias
                  + factionOrder - dangerCost - travelCost
```

Random ch dng seed `worldSeed + npcInstanceId + day + decisionIndex`; reload khng đi quyt đnh.

### 6.2. Lch v u tin

- Lch c đnh c th b ghi đ bi incident, thi tit cc đoan, chin tranh, thng v hoc ngi chi.
- u tin: sng st > hon thnh nhim v khn > bo v faction > nhu cu c nhn > x hi > đi lang thang.
- NPC đang shelter khng nhn giao dch thng thng nu sub-location đng ca.
- NPC b thng t tm y s; NPC tht nghip tm vic ti ch/trm.

## 7. NPC v thi tit

### 7.1. Phn ng theo loi thi tit

| Thi tit | Hnh vi NPC | Tc đng bn đ |
|---|---|---|
| Quang | lch bnh thng | edge m, traffic chun |
| Ma | tm mi, gim giao dch ngoi tri | đng đt tng nguy c |
| Bo | tr n, hy hnh trnh | đng bin c th phong ta |
| Sng m | đi theo ngi dn đng, gim tm nhn | patrol/đi lc tng |
| Tuyt | tiu hao th lc, u tin la | đo c th hn ch |
| Nng gt | ngh gia tra, tng nhu cu nc | caravan chm |
| D tng | hong lon, cung tn hoc li dng | incident/influence bin đng |

### 7.2. Weather shelter

Mi node khai bo shelter c sc cha, loi NPC đc php vo, ph v đ an ton. Khi sc cha đy, NPC phi xp hng, tm sub-location ph hoc ri node. UI hin th Ni tr đ đy thay v li chung.

### 7.3. Weather interaction API

```js
npcWeatherPreview(state, npcId, weather)
resolveNpcWeatherReaction(state, npcId, weather)
listNodeShelters(state, nodeId)
```

## 8. Tng tc NPCNPC

### 8.1. Loi tng tc

- giao dch, mc c, vn chuyn;
- cho hi, kt bn, tranh lun;
- dy hc, t th, tuyn m;
- tun tra v kim tra giy t;
- bo v, cu thng, chm sc;
- gin đip, t gic, đe da;
- yu đng, hn c, th hn;
- tranh chp ti nguyn hoc đa v;
- mt hi v trao đi tin;
- cng x l cnh quan nguy him.

### 8.2. Encounter resolver

```js
previewNpcEncounter(state, actorA, actorB, context)
resolveNpcEncounter(state, encounterId, choice)
```

Resolver phi kim tra faction, quan h, thi tit, sub-location, witness count, mc tiu v cooldown. Kt qu c th thay đi trust/respect/fear/suspicion, inventory, route, faction reputation, incident v bulletin.

### 8.3. Mt hi v ring t

Encounter b mt yu cu sub-location kn, fog đ v khng c witness. Nu b pht hin, to `suspicion`/incident thay v m thm b qua.

## 9. NPCcnh quan v node

NPC phi nhn bit:

- cng đng/m;
- ch, kho, bn, la tri, miu, trn php;
- cu sp, đng ngp, tuyt l, vng nhim t;
- outpost, watchtower, trading post v waystation;
- mt đ ngi, ting đng, an ninh v ti nguyn.

V d: thng nhn trnh edge c bo; patrol đi route khi cu sp; dn chy nn tp trung vo shelter; y s di chuyn ti node c nhiu ngi b thng; NPC c th sa mt cng trnh nu đ ngh v vt t.

## 10. Ngi chi tng tc NPC trong node đng

UI Khu vc hin ti phi c:

- b lc vai tr/faction/trng thi;
- tm kim tn hoc ngh;
- nhm NPC theo sub-location;
- phn trang/virtual list;
- badge đang di chuyn, đang tr, c nhim v, đang giao dch;
- xem l do NPC khng th tng tc;
- nt theo di NPC v đt lch gp;
- bn đ nhit mt đ dn c, khng render hng nghn nt ring l.

Action Bar ch đa 36 NPC quan trng nht theo ng cnh; phn Danh sch c dn cho php m rng ton b.

## 11. Tng tc vi h thng khc

- **Map:** NPC to traffic, patrol edge, route block, rumor v m đng runtime đc cp php.
- **Weather:** thay đi lch, shelter, mood, risk v hnh vi.
- **Faction:** lnh, thu, giy thng hnh, chin tranh v tuyn qun.
- **Relationship/Neo:** ch NPC bn vng hoc đc ghi nh mi tr thnh quan h di hn.
- **Quest:** quest c th giao cho NPC khc sau khi NPC gc ri node; mc tiu theo `instanceId`.
- **Combat:** NPC b thng, bt gi, chy trn v cn cu h; khng hi mu min ph khi ri mn hnh.
- **Economy:** cung/cu do s NPC, thng đon v thi tit quyt đnh.
- **Cultivation:** Vn Đo, Đu Ng, dy cng php v quan st NPC cng Con Đng.

## 12. Hiu nng v lu tr

- Spatial index theo `regionId/nodeId/subLocationId`.
- Khng scan ton b NPC cho mi node mi frame.
- Background population x l theo thng k; active actors materialize khi cn.
- Ch serialize danh tnh bn vng, actor đang c quest/quan h/incident v seed qun th.
- Gii hn event log theo ca s; gi snapshot đnh k cho NPC quan trng.
- Mc tiu: 5.000 NPC trong mt node vn m detail <500 ms v tick <100 ms trn my tm trung.

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

Mutation phi tr `{ success, reason, data, transactionId, stateVersion }`, c rollback v journal.

## 14. L trnh trin khai

1. **Pha A:** schema/migration, NPC ecology profile, spatial index, population seed.
2. **Pha B:** scheduler, route, sub-location presence v UI danh sch đng.
3. **Pha C:** thi tit, shelter, NPCcnh quan v local incident.
4. **Pha D:** NPCNPC encounter, faction orders, mt hi, witness v bulletin.
5. **Pha E:** kinh t dn c, quest chuyn giao, Vn Đo/Đu Ng, hiu nng v visual regression.

## 15. Acceptance criteria

1. Node thnh th c th cha t nht 1.000 NPC logic m khng trn UI hoc scan O(N) mi frame.
2. NPC lun c `nodeId + subLocationId` hp l khi hin th.
3. NPC t di chuyn theo lch, weather, nhu cu v incident; reload vn deterministic.
4. C t nht 5 loi tng tc NPCNPC to hu qu state r rng.
5. Thi tit thay đi đc hnh vi, shelter, lch v route ca NPC.
6. NPC c th tng tc vi cng trnh, đa hnh, edge v ti nguyn node.
7. NPC đng vn lc/tm/phn trang đc; Action Bar ch hin th nhm ph hp.
8. NPC bn vng khng bin mt m thm; NPC tm thi khng lm bn quan h di hn.
9. Khng c NPC no t sa static topology.
10. Save ci migrate đc; transaction retry khng nhn đi encounter, phn thng hoc quan h.
11. Tt c nhn giao din ting Vit, m k thut khng l cho ngi chi.
12. Test hiu nng, deterministic tick, weather, map, relationship v visual đu đt.
## 16. Logic Gap Closure · b sung bt buc sau r sot

### 16.1. Tch population nn v actor c danh tnh

`backgroundCount` ch l thng k dn c; actor ch đc materialize khi c mt trong cc điu kin: nm trong viewport/Node Detail, c quest/quan h, l witness, tham gia incident, nm trn route player hoc đc faction đnh du. Materialize dng kha:

```text
instanceId = hash(worldSeed + nodeId + roleId + populationSlot + generation)
```

Khng to li actor mi sau reload nu cng kha. Khi actor tm thi ri node, chuyn v pool hoc lu `lastKnownNodeId`; khng xa quan h bn vng.

### 16.2. Quota, congestion v hng đi

Mi sub-location c `capacity`, `queuePolicy` v `priorityRoles`. Nu vt capacity:

1. actor khn cp (b thng, tr em, h tng) đc u tin;
2. actor khc xp hng hoc chuyn shelter/sub-location gn nht;
3. nu mi ni đy, actor ri node theo edge m c chi ph thp nht.

Khng đc spawn v hn đ lp UI. `visibleCount` v `backgroundCount` phi tch bit.

### 16.3. State machine NPC

```text
idle  planning  traveling  arrived  acting  cooldown  idle
              sheltering
              injured  treated/recovering  idle
              missing  found/retired/dead
```

Mi transition ghi `reason`, `source`, `day`, `decisionSeed`. Transition khng hp l b t chi, khng t sa trng thi bng assignment ri rc.

### 16.4. Di chuyn NPC v topology

NPC dng cng `resolveMapTopology()`/`edgeState()` vi player. NPC khng đc đi qua edge `blocked`, khng đc t m static edge. Nu route hng, NPC chuyn `rerouting`; sau ba ln khng tm đc đng, chuyn `sheltering` hoc `missing` ty role. Faction patrol c quyn m edge runtime ring nu data khai bo `authorityAction`.

### 16.5. Quyt đnh hnh vi theo nhu cu

Nhu cu chun ha 0100; 100 l cp bch:

```text
needUrgency = max(food, shelter, safety, social)
score(action) = goalWeight  0.40
              + needUrgency  0.30
              + weatherFit  0.15
              + relation/factionBias  0.10
              - travelCost  0.05
```

Tie-break deterministic theo `actionId`; khng đ random lm NPC đi hnh vi sau reload.

### 16.6. Weather severity v hysteresis

Thi tit c `severity 03`. NPC ch đi lch khi severity vt ngng vo hoc gim di ngng ra, trnh đi shelter mi tick:

```text
enterShelter nu severity >= enterThreshold
leaveShelter nu severity <= leaveThreshold (leaveThreshold < enterThreshold)
```

Thi tit cc đoan kha hot đng ngoi tri, tng nhu cu shelter/nc, thay đi route v c th to incident. Weather modifier phi c `sourceRegion`, `startDay`, `endDay`, `severity`.

### 16.7. NPCNPC encounter lifecycle

```text
detected  proposed  accepted/rejected  resolving  resolved
                                       interrupted
```

Encounter c `encounterId`, actor pair đ sort, sub-location, witness list, weather snapshot, choice history v cooldown. Mt cp actor khng th resolve hai ln cng tick. Witness nhn memory nu `visibility` đ; encounter b mt khng t đng b ton node bit.

### 16.8. Witness, rumor v lan truyn tin

```text
rumorStrength = eventImportance  witnessReliability  visibility
                 distanceDecay  weatherVisibility
```

Tin truyn qua NPC c `knownBy`, `confidence`, `expiresDay`; mi tick ch lan ti đa mt hop. Faction bulletin ch nhn tin đt confidence ti thiu, khng ly trc tip ton b world state.

### 16.9. Tc đng cnh quan c rollback

NPC sa cu, dng shelter, m ch, dn đng hoc ph vt cn phi to `landscapeMutation` qua Map transaction. Mutation c `ownerNpcId`, `requiredItems`, `duration`, `integrity`, `expiresDay` v undo policy. NPC khng đc sa cu hnh static; ch to runtime overlay.

### 16.10. Kinh t v vt t NPC

Inventory background dng aggregate, cn thng v vi actor dng inventory instance. Khng to vt phm v hn t `backgroundCount`. Mi giao dch kha gi/stock ti preview, commit qua transaction v ghi buyer/seller/day.

### 16.11. Quan h v k c

Quan h NPCNPC dng bn trc `trust/respect/fear/suspicion` 0100. Mi event c `uniqueKey`; cng event khng cng hai ln. K c gim dn theo half-life nhng event Neo/quest/ phn bi khng đc qun t đng; phi c trng thi `suppressed` hoc `resolved`.

### 16.12. Player lock v tng tc cnh tranh

Khi player bt đu ni chuyn/giao dch/đu vi NPC, actor đc lock tm thi. NPC khc c th chen vo ch khi encounter cho php. Ht timeout phi gii phng lock; reload khng đ actor b kha v)nh vin.

### 16.13. Offline simulation

Offline tick khng materialize hng nghn actor v khng resolve encounter ngu nhin khng quan st đc. Dng aggregate transition cho population; ch resolve actor bn vng, quest, travel, shelter, incident v quan h c tc đng. UI phi ghi r m phng nn khi ngi chi quay li.

### 16.14. View model NPC thng nht

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

UI ch nhn `NpcNodeView[]`; khng t đc `npcState` ri t quyt đnh action.

### 16.15. Invariants bt buc

1. NPC sng ch c mt v tr hin ti.
2. `currentSubLocationId` phi thuc node hin ti v khng vt capacity m khng c queue record.
3. NPC đang `traveling` khng th đng thi `acting` hoc giao dch.
4. NPC `dead/retired` khng xut hin trong presence list.
5. NPC tm thi khng to quan h bn vng nu cha đc ghi nh.
6. Weather reaction, encounter v landscape mutation đu idempotent.
7. Khng mutation NPC no sa static map catalog.

## 17. API v m li chun ha

Cc API phi c preview/commit tng ng v dng m li dch đc:

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

M li ti thiu: `NPC_NOT_PRESENT`, `NPC_BUSY`, `NPC_WEATHER_SHELTER_FULL`, `NPC_ROUTE_BLOCKED`, `NPC_ENCOUNTER_EXPIRED`, `NPC_LOCK_CONFLICT`, `NPC_STATE_CONFLICT`.

## 18. Acceptance b sung

1. 5.000 NPC trong mt node khng to hn quota actor materialized v khng scan ton b mi frame.
2. Hai client/tick cng tng tc mt NPC ch mt mutation thnh cng.
3. Weather severity gi n đnh shelter qua nhiu tick, khng rung trng thi.
4. NPC route khng đi qua edge phong ta v t tm đng vng hp l.
5. NPCNPC encounter c witness/memory/rumor đng visibility.
6. Landscape mutation c rollback khi thiu vt t hoc b interrupt.
7. Offline simulation khng sinh phn thng/quan h trng lp.
8. Save/load gi instanceId, schedule, route, memory, shelter, lock timeout v encounter journal.
9. Mi nhn NPC, weather, role v li hin th đu bng ting Vit.


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

This section is the canonical home for local constellation behavior. The former standalone pointer and design sources were consolidated here; new map behavior must be updated here first.

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

### Local constellation density and visual encoding

- Target 30–39 materialized nodes when the reachable gameplay graph contains that many. The hard cap is 39 including the current node; a small or disconnected graph renders fewer. Never pad with fabricated nodes or generate gameplay nodes as a render side effect. Expand by deterministic BFS over confirmed `locationExits()` edges. Tie-break neighbors by N, E, S, W, then node ID. If capped, retain current, visited, discovered, pinned, and important nodes first, then nearest remaining BFS nodes; never random-sample.
- An unmaterialized adjacent Oxy cell is shown only as a frontier affordance. It is not counted as a node, has no node identity, and becomes a real node only through the canonical directional movement resolver. Rendering must not change save data, RNG state, fog, discovery, or gameplay reachability.
- Derive screen position from actual coordinate deltas: `screenX = centerX + (node.x - current.x) * scale`, `screenY = centerY + (node.y - current.y) * scale`. Apply the current zoom scale uniformly to both axes and clamp only the viewport transform, never individual node positions. Deterministic, node-ID-seeded jitter may be at most 4 px per axis and must be disabled if it reverses the ordering of two nodes on either axis; no render-time random jitter.
- At the target density, ordinary node core diameter is 45% of the former default (baseline 1.0 → 0.45); halo radius scales by the same factor. Current node remains the largest anchor at 1.0. Reduce core/halo together and keep a minimum 12 px hit target through an invisible hit area. Labels are limited to current, selected/focused, nearby important, or pinned nodes; all others use tooltip/focus detail.
- Color is a semantic token, not a single fog color: current `#F4C95D`; undiscovered fog `#53616C` without glow; discovered neutral `#D6E4E8`; visited `#A6C8D8`; orthodox owner `#4A91D9`; demonic/evil owner `#C34F74`; neutral organization `#9A8AAE`; important landmark `#E7B95A`; high-danger node `#D94B62`; rumor-only `#AAB6C2` with a faint name and no glow. Danger/event/opportunity may add a distinct border/icon, but cannot erase the ownership or fog token. Pair every color with shape, border, or accessible text so state is not color-only.
- If location metadata conflicts, precedence is current > fog privacy > danger/event/opportunity > important landmark > ownership > neutral/visited. Do not expose hidden node type, owner, or danger in a tooltip before discovery. Acceptance: coordinate distance is monotonic with screen distance at fixed zoom (within the bounded jitter); identical state yields identical layout; all eight semantic states above are visually distinguishable; labels and hit targets remain usable at 39 nodes.

## Consolidated addendum: map expansion, actions, armies, and atmosphere

- The map uses deterministic coordinate generation, fog state, directional exits, node discovery, search/collect/investigate actions, and map-event resolution. Existing runtime APIs remain the single implementation path.
- Army records live under `worldSimulation.armies`: `id`, `factionId`, `nodeId`, `soldierCount`, `morale`, `status`, `route`, `targetNodeId`, `corruptionExposure`, and `lastUpdatedDay`.
- Army actions are `scout`, `sabotage`, `join_battle`, and reputation-gated `command`. Daily simulation reduces morale while marching through corruption level >= 3; morale <= 20 routes the army and applies a 15% troop loss.
- `subLocationWrongness(state, subLocationId)` derives local wrongness from player worldview wrongness plus local override/corruption. Map/UI consumers must use this helper instead of inventing a second formula.
- Directional movement after fleeing remains available from the current node; flee must not relocate the player backward.
## CURRENT IMPLEMENTATION STATUS

The former “chua code” list is historical roadmap text. Coordinate movement,
fog/discovery, map events, structures, and local actions are implemented;
remaining items are UI/data expansion, balance, or independent audit evidence.
