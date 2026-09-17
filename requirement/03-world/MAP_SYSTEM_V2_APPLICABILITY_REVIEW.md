# Map System V2  Applicability Review & Implementation Contract

## 1. K�t lu�n

Logic trong `MAP_SYSTEM_V2_COMPLETE.md` �p d�ng ��c v�o game hi�n t�i, nh�ng kh�ng n�n thay to�n b� h� th�ng map trong m�t l�n. C�ch an to�n l� gi� `locationId` v� graph `openWorld` l�m l�p t��ng th�ch, sau � b� sung `mapState`, `subLocationId` v� `travelTask`.

Kh�ng c�n vi�t l�i combat, quest, Hidden Realm hay NPC scheduler. Ph�n c� r�i ro cao nh�t l� travel v� `move()` hi�n �i v� tr� �ng b�; n�n b�c b�ng travel resolver thay v� �i semantics ngay l�p t�c.

## 2. �i chi�u hi�n tr�ng

| Th�nh ph�n V2 | Hi�n tr�ng | Kh� nng �p d�ng |
|---|---|---|
| L1 World Map | � c� region, route, faction pin | Cao; b� sung influence heatmap |
| L2 Regional Map | � c� node graph, exits, t�a � | Cao; th�m fog/owner getter |
| L3 Node Detail | Ch�a c� sub-location | Cao; d�ng m�c �nh `main` � t��ng th�ch |
| L4 Instance | Hidden Realm runtime node � c� | Cao; gi� runtime namespace ri�ng |
| Influence gradient | ang thi�n v� owner/faction t)nh | Cao; t�nh derived t� graph v� power |
| Fog 03 | Ch�a c� �y � | Cao; migrate t� `visitedLocations` |
| Claim/outpost/structure | Ch�a c� | Trung b�nhcao; c�n economy/task contract |
| Weighted travel | `move()` g�n nh� t�c th�i | Trung b�nh; c�n adapter/task resolver |
| Fast travel | Ch�a c� unlock contract | Cao sau khi c� waystation/visited state |
| Patrol/bulletin | Ch�a c� UI contract �y � | Cao; d� li�u l�y t� event/scheduler hi�n c� |

## 3. State schema � xu�t

```js
state.mapState = {
  version: 2,
  fog: { [nodeId]: 0 },
  nodeVisits: { [nodeId]: 0 },
  subLocationId: { [nodeId]: "main" },
  subLocationVisits: {},
  influence: { [nodeId]: { [factionId]: 0 } },
  structures: { [nodeId]: [] },
  outposts: {},
  fastTravel: {},
  travelTask: null,
  bulletinSeen: {}
};
```

Compatibility rules:

1. `locationId` v�n l� node ID; kh�ng gh�p sub-location v�o ID.
2. `subLocationId` ch� l� context UI/action, m�c �nh `main`.
3. Save ci ��c migrate: current location c� fog 2, location � visit c� fog t�i thi�u 2, c�n l�i fog 0.
4. `openWorld` v�n l� graph; map V2 ch� th�m derived/runtime state.
5. Dynamic nodes ph�i n�m trong `worldSimulation.runtimeLocations`, kh�ng ghi ng��c v�o static catalog nh� ngu�n d� li�u ch�nh.

## 4. Node Detail (L3)

M�i node c� th� khai b�o:

```js
subLocations: [
  { id: "main", type: "street", actions: ["travel", "observe"] },
  { id: "market", type: "market", actions: ["trade", "guild"] },
  { id: "hall", type: "hall", actions: ["talk", "petition"] }
]
```

Node nh� n�n c� 12 sub-location; node l�n 58. NPC c� `currentSubLocationId`, v� action resolver l�c theo sub-location. Di chuy�n trong c�ng node ch� t�n action/time ng�n, kh�ng t�n m�t ng�y travel. Vertical slice n�n l�m tr��c cho `son_mon`, `cho_linh` v� `hac_lam`.

## 5. Influence gradient

Expose c�c API thu�n d� li�u:

```js
computeMapInfluence(state, nodeId)
mapInfluenceSnapshot(state, nodeId)
mapOwner(state, nodeId)
mapZoneStatus(state, nodeId) // stable | contested | frontier
```

G�i � c�ng th�c:

```text
score(faction,node) = factionPower � 0.70^graphDistance
                      � (1 + structureBonus + eventBonus + outpostBonus)
```

Owner ch� ��c hi�n th� khi score cao nh�t �t ng��ng v� h�n faction th� hai �t nh�t 15%; n�u kh�ng l� `contested`. War ownership v� map influence l� hai l�p ri�ng. Quest/event ch� ��c delta c� cap theo ng�y � tr�nh m�t nhi�m v� �i ch� to�n v�ng.

## 6. Fog of war

| Level | � ngh)a | UI ��c ph�p hi�n th� |
|---|---|---|
| 0 | Ch�a bi�t | Kh�ng spoil t�n/NPC/route chi ti�t |
| 1 | C� tin �n | T�n v�ng m� h�, danger hint |
| 2 | � thm | Node, route � th�y, owner hi�n t�i |
| 3 | Kh�o s�t s�u | Sub-location, patrol, bulletin, fast travel |

Fog 3 �t qua �t nh�t 5 visits, outpost ho�c waystation. Kh�ng d�ng fog � �n d� li�u c�n cho save/load ho�c combat resolver.

## 7. Player agency

API n�n c� transaction result th�ng nh�t:

```js
claimOutpost(state, nodeId)
buildMapStructure(state, nodeId, structureType)
petitionFactionTerritory(state, nodeId, factionId)
mapStructurePreview(state, nodeId, structureType)
```

Structure templates:

- `watchtower`: tng fog/influence v� gi�m patrol surprise.
- `waystation`: m� fast travel, gi�m travel risk.
- `trading_post`: tng trade yield, c�n node c� market.
- `ward_formation`: gi�m encounter/curse risk, c�n MAG/formation item.

Claim c�n node frontier, kh�ng c� outpost �i �ch v� � task/cost; m�i node t�i a 3 structures. N�u ch�a c� multiplayer, `ownerId` ph�i l� character/faction local, kh�ng gi� �nh server authority.

## 8. Weighted travel

T�ch preview v� commit:

```js
travelPreview(state, fromId, toId, mode)
startTravel(state, fromId, toId, mode, options)
resolveTravelTask(state, taskId, result)
fastTravel(state, fromId, toId)
```

Mode m�c �nh:

- `walk`: full graph distance, daily event rolls.
- `ngu_khi`: kho�ng 1/3 th�i gian, ti�u hao resource, v�n c� risk.
- `truyen_tong_tran`: g�n nh� 0 ng�y, ch� khi hai �u � unlock.

`move()` ci n�n g�i `startTravel(..., "walk")` � compatibility mode. Escort gi�m risk; m�i ng�y travel roll patrol/weather/encounter. Ch� commit location sau khi task ho�n t�t � kh�ng ph� c�c action ang gi� �nh v� tr� �ng b�.

## 9. Patrol, owner tag v� bulletin

Patrol kh�ng n�n l� node �c l�p tr�n graph. Render n� tr�n edge b�ng schedule hi�n c�, v�i icon danger/owner. Owner tag l�y t� `mapOwner()` v� m�u tr�ng th�i (`stable`, `contested`, `frontier`). Bulletin board t�i a 3 tin ph� h�p fog, l�y t� faction/event state; kh�ng �a th�ng tin c�a node fog 0.

## 10. Rollout � ngh�

1. **Phase A:** `mapState`, migration, fog 03, influence resolver.
2. **Phase B:** L3 cho ba node m�u, NPC sub-location v� action filtering.
3. **Phase C:** outpost/structures, fast travel, bulletin/patrol UI.
4. **Phase D:** weighted travel task, escort, daily rolls; b�t m�c �nh sau khi regression pass.

Acceptance contract:

- Save ci load ��c v� kh�ng m�t `locationId`/quest/combat state.
- M�i map action tr� `{ success, reason, data }`, rollback khi thi�u cost.
- Derived influence/fog c� th� rebuild deterministic t� state.
- Runtime Hidden Realm kh�ng l�m b�n static catalog.
- `verify_game.js` v� stress simulation v�n pass; travel task kh�ng t�o duplicate event/reward.

## 11. �nh gi� cu�i

Map V2 ph� h�p v�i ki�n tr�c hi�n t�i n�u tri�n khai d�ng additive adapter. Kh�ng n�n thay `D.LOCATIONS`, kh�ng n�n t�o composite ID ki�u `node/subLocation`, v� kh�ng n�n bi�n `move()` th�nh async ngay trong phase �u. Ba i�m c�n thi�t k� k� nh�t l� travel task, gi�i h�n influence delta v� quy�n s� h�u outpost trong save �n ng��i ch�i.
## 12. Chi ti�t tri�n khai theo module

### 12.1. `mapState` v� migration

Kh�i t�o `mapState` � m�t factory duy nh�t. Migration ch�y tr��c m�i resolver, b� sung default cho save ci v� gi� nguy�n quest/combat state. Heatmap, patrol projection v� bulletin ch� l� d� li�u rebuildable; kh�ng c�n serialize to�n b�.

### 12.2. L3 adapter

Th�m `getNodeDetail(state,nodeId)`, `enterSubLocation(state,nodeId,subLocationId)` v� `availableNodeActions(state,nodeId,subLocationId)`. Node ch�a khai b�o detail nh�n layout m�c �nh `main`. UI kh�ng g�i catalog tr�c ti�p � quy�t �nh action; adapter ph�i ki�m tra fog v� NPC occupancy.

### 12.3. Influence cache

Cache key g�m `worldTick + factionVersion + structureVersion + eventVersion`. Quest thay �i influence ch� invalidate node v� v�ng k�; cu�i world tick full rebuild � s�a drift. Snapshot tr� th�m `confidence` v� `expiresAtTick` � UI ph�n bi�t s� li�u hi�n t�i/��c t�nh.

### 12.4. Fog/event pipeline

M�i ngu�n kh�m ph� ph�t event `{ nodeId, level, source, actorId, tick }`. Reducer �p d�ng max level, ghi journal m�t l�n v� invalidate L1/L2/L3. Rumor t� bulletin ch� n�ng fog khi player �c tin.

### 12.5. Outpost/structure service

T�ch ba l�p `preview`, `commit`, `tickMaintenance`; preview kh�ng mutate, commit d�ng transaction resolver, maintenance ch�y sau world tick. Integrity d��i 30% ph�t warning; tick �u thi�u upkeep ch� c�nh b�o, kh�ng x�a outpost ngay.

### 12.6. Travel service

Gi� `move()` l�m compatibility wrapper. UI m�i d�ng `travelPreview` r�i `startTravel`; engine tick g�i `resolveTravelDay`. Combat/instance interrupt b�ng `interruptTravel`, kh�ng t� s�a `locationId`; ch� task completed m�i c�p nh�t location, visits, fog v� fast-travel unlock.

### 12.7. Projection/UI

World map nh�n `heatmapProjection`; regional map nh�n `nodeProjection + patrolEdges`; node detail nh�n `detailProjection`; bulletin nh�n `bulletinProjection`. Projection lu�n �p fog tr��c khi tr� UI � kh�ng c� ��ng v�ng l�m l� static catalog.

## 13. R�i ro v� ki�m so�t

| R�i ro | Ki�m so�t |
|---|---|
| Travel async ph� action �ng b� | Compatibility wrapper, commit khi completed |
| Heatmap l�ch sau nhi�u tick | Versioned cache + full rebuild �nh k� |
| Player chi�m node qu� d� | Frontier/threshold/cost/upkeep/contest decay |
| Fog l�m h�ng quest | Quest d�ng canonical state, UI ch� l�c projection |
| Retry nh�n �i reward | Idempotency key + transaction journal |
| Runtime node l�m b�n catalog | `runtimeLocations` l� source ri�ng |

## 14. Ti�u ch� ho�n th�nh

Map V2 ch� ��c �nh d�u ho�n th�nh khi b�n phase pass regression, save migration v� stress simulation; t�i thi�u c� test cho t�ng API mutation, interrupted travel, contested ownership, fog privacy v� transaction rollback.
