# H� TH�NG NPC V2  D�N C� S�NG, B�N � �NG V� TH�I TI�T

**Phi�n b�n:** 1.1  
**Ph�m vi:** m� r�ng `NPC_MONSTER_SYSTEM.md`, `RELATIONSHIP_SYSTEM.md`, `MAP_CURRENT_REGION_UX_REQUIREMENT.md` v� World Simulation.  
**Ng�n ng� hi�n th�:** ti�ng Vi�t; ID k� thu�t ch� d�ng n�i b�.

## 1. T�m nh�n

NPC kh�ng c�n l� danh s�ch �ng y�n t�i node � ng��i ch�i b�m N�i chuy�n. M�i NPC l� m�t t�c nh�n c� n�i �, l�ch tr�nh, c�ng vi�c, m�c ti�u, quan h�, nhu c�u, ph�n �ng th�i ti�t, ph�n �ng c�nh quan v� k� �c. Node b�n � l� m�i tr��ng s�ng c�a m�t qu�n th� NPC; ng��i ch�i c� th� th�y nhi�u NPC c�ng t�n t�i, NPC t� t��ng t�c v�i nhau v� th� gi�i thay �i ngay c� khi ng��i ch�i kh�ng �ng c�nh.

H� th�ng ph�i m� r�ng s� l��ng NPC m� kh�ng bi�n node th�nh danh s�ch h�n lo�n. Runtime d�ng ph�n l�p **danh t�nh b�n v�ng**, **qu�n th� n�n**, **�m �ng t�m th�i**, **ng��i qua ��ng theo h�nh tr�nh** v� **NPC s� ki�n**.

## 2. Nguy�n t�c thi�t k�

1. NPC c� danh t�nh v� tr�ng th�i r� r�ng; kh�ng g�p m�i ng��i ng�u nhi�n th�nh m�t ID.
2. NPC ch� xu�t hi�n t�i node/sub-location khi scheduler x�c nh�n hi�n di�n.
3. M�t � NPC c� th� cao; UI ph�n trang/l�c, engine d�ng spatial index v� kh�ng gi�i h�n c�ng v�i NPC m�i node.
4. Th�i ti�t t�c �ng t�i h�nh vi, l�ch, gi� c�, di chuy�n, t�m tr�ng v� chi�n �u.
5. T��ng t�c NPCNPC v� NPCc�nh quan ph�i t�o ra h�u qu� quan s�t ��c.
6. T�t c� mutation qua transaction/idempotency; save ci v�n t�i ��c.
7. Kh�ng � NPC s�a topology static. NPC ch� m�/�ng edge runtime � ��c c�p ph�p.

## 3. Ph�n lo�i NPC v� m�t �

### 3.1. C�c l�p NPC

| L�p | V� d� | Danh t�nh | C� quan h� b�n v�ng |
|---|---|---|---|
| `persistent_named` | Ch��ng m�n, s� ph�, th��ng nh�n ch�nh | ID c� �nh | C� |
| `persistent_role` | tr��ng tr�m, y s�, �i tr��ng tu�n tra | ID c� �nh theo node | C� |
| `population_citizen` | d�n c�, � t�, phu khu�n v�c | instance �n �nh theo node | C� h�n ch� |
| `traveler` | l� kh�ch, h�c s), th��ng o�n | instance theo h�nh tr�nh | C� n�u ghi nh� |
| `crowd_ephemeral` | �m �ng h�i ch�, n�n d�n | pool t�i s� d�ng | Kh�ng |
| `event_actor` | s� gi�, k� g�y lo�n, nh�n ch�ng | ID theo incident | C� trong incident |

### 3.2. Quy m� node

- Node nh�: 530 NPC runtime.
- L�ng: 30150.
- Th�nh th�: 1501.000.
- S�n m�n/v��ng kinh: 5005.000.
- S� ki�n l�n c� th� t�o th�m crowd pool nh�ng ph�i c� quota theo node, kh�ng gi�i h�n to�n c�c m�t c�ch t�y ti�n.

Engine kh�ng instantiate to�n b� NPC m�i frame. D�ng `populationSeed`, `activeActors`, `backgroundCount` v� materialize c� th� khi ng��i ch�i quan s�t/t��ng t�c.

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

`instanceId` b�t bu�c v�i NPC kh�ng c� �nh; kh�ng ��c d�ng t�n hi�n th� l�m kh�a quan h�.

## 5. Authoring Node Detail cho NPC

M�i node khai b�o **NPC ecology profile** ri�ng, kh�ng copy m�t c�u h�nh chung:

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

V� d�: S�n m�n c� � t� � s�n luy�n, tr��ng l�o � ch�nh i�n, t�p d�ch � kho, kh�ch � c�ng; th�nh c�ng c� th�y th� � b�n, th��ng nh�n � ch�, ng��i �a tin � tr�m d�ch. Kh�ng cho ph�p m�i node m�c �nh c�ng m�t danh s�ch `market/hall/alley` m� kh�ng c� profile.

## 6. Scheduler v� quy�t �nh NPC

### 6.1. V�ng l�p theo tick

M�i world tick:

1. C�p nh�t th�i ti�t v� c�nh b�o m�i tr��ng.
2. Ki�m tra l�ch l�m vi�c/gi� m� c�a.
3. �nh gi� nhu c�u, m�c ti�u v� nguy c�.
4. Ch�n h�nh �ng b�ng utility score deterministic.
5. Di chuy�n theo route h�p l� ho�c t�m shelter.
6. Resolve t��ng t�c NPCNPC, NPCc�nh quan v� NPCng��i ch�i.
7. Ghi s� ki�n v� invalidate view model node b� �nh h��ng.

```text
utility(action) = goalWeight + needUrgency + weatherFit + relationshipBias
                  + factionOrder - dangerCost - travelCost
```

Random ch� d�ng seed `worldSeed + npcInstanceId + day + decisionIndex`; reload kh�ng �i quy�t �nh.

### 6.2. L�ch v� �u ti�n

- L�ch c� �nh c� th� b� ghi � b�i incident, th�i ti�t c�c oan, chi�n tranh, th��ng v� ho�c ng��i ch�i.
- �u ti�n: s�ng s�t > ho�n th�nh nhi�m v� kh�n > b�o v� faction > nhu c�u c� nh�n > x� h�i > i lang thang.
- NPC ang shelter kh�ng nh�n giao d�ch th�ng th��ng n�u sub-location �ng c�a.
- NPC b� th��ng t� t�m y s�; NPC th�t nghi�p t�m vi�c t�i ch�/tr�m.

## 7. NPC v� th�i ti�t

### 7.1. Ph�n �ng theo lo�i th�i ti�t

| Th�i ti�t | H�nh vi NPC | T�c �ng b�n � |
|---|---|---|
| Quang | l�ch b�nh th��ng | edge m�, traffic chu�n |
| M�a | t�m m�i, gi�m giao d�ch ngo�i tr�i | ��ng �t tng nguy c� |
| B�o | tr� �n, h�y h�nh tr�nh | ��ng bi�n c� th� phong t�a |
| S��ng m� | i theo ng��i d�n ��ng, gi�m t�m nh�n | patrol/i l�c tng |
| Tuy�t | ti�u hao th� l�c, �u ti�n l�a | �o c� th� h�n ch� |
| N�ng g�t | ngh� gi�a tr�a, tng nhu c�u n��c | caravan ch�m |
| D� t��ng | ho�ng lo�n, cu�ng t�n ho�c l�i d�ng | incident/influence bi�n �ng |

### 7.2. Weather shelter

M�i node khai b�o shelter c� s�c ch�a, lo�i NPC ��c ph�p v�o, ph� v� � an to�n. Khi s�c ch�a �y, NPC ph�i x�p h�ng, t�m sub-location ph� ho�c r�i node. UI hi�n th� N�i tr� � �y thay v� l�i chung.

### 7.3. Weather interaction API

```js
npcWeatherPreview(state, npcId, weather)
resolveNpcWeatherReaction(state, npcId, weather)
listNodeShelters(state, nodeId)
```

## 8. T��ng t�c NPCNPC

### 8.1. Lo�i t��ng t�c

- giao d�ch, m�c c�, v�n chuy�n;
- ch�o h�i, k�t b�n, tranh lu�n;
- d�y h�c, t� th�, tuy�n m�;
- tu�n tra v� ki�m tra gi�y t�;
- b�o v�, c�u th��ng, chm s�c;
- gi�n i�p, t� gi�c, e d�a;
- y�u ��ng, h�n ��c, th� h�n;
- tranh ch�p t�i nguy�n ho�c �a v�;
- m�t h�i v� trao �i tin;
- c�ng x� l� c�nh quan nguy hi�m.

### 8.2. Encounter resolver

```js
previewNpcEncounter(state, actorA, actorB, context)
resolveNpcEncounter(state, encounterId, choice)
```

Resolver ph�i ki�m tra faction, quan h�, th�i ti�t, sub-location, witness count, m�c ti�u v� cooldown. K�t qu� c� th� thay �i trust/respect/fear/suspicion, inventory, route, faction reputation, incident v� bulletin.

### 8.3. M�t h�i v� ri�ng t�

Encounter b� m�t y�u c�u sub-location k�n, fog � v� kh�ng c� witness. N�u b� ph�t hi�n, t�o `suspicion`/incident thay v� �m th�m b� qua.

## 9. NPCc�nh quan v� node

NPC ph�i nh�n bi�t:

- c�ng �ng/m�;
- ch�, kho, b�n, l�a tr�i, mi�u, tr�n ph�p;
- c�u s�p, ��ng ng�p, tuy�t l�, v�ng nhi�m t�;
- outpost, watchtower, trading post v� waystation;
- m�t � ng��i, ti�ng �ng, an ninh v� t�i nguy�n.

V� d�: th��ng nh�n tr�nh edge c� b�o; patrol �i route khi c�u s�p; d�n ch�y n�n t�p trung v�o shelter; y s� di chuy�n t�i node c� nhi�u ng��i b� th��ng; NPC c� th� s�a m�t c�ng tr�nh n�u � ngh� v� v�t t�.

## 10. Ng��i ch�i t��ng t�c NPC trong node �ng

UI Khu v�c hi�n t�i ph�i c�:

- b� l�c vai tr�/faction/tr�ng th�i;
- t�m ki�m t�n ho�c ngh�;
- nh�m NPC theo sub-location;
- ph�n trang/virtual list;
- badge ang di chuy�n, ang tr�, c� nhi�m v�, ang giao d�ch;
- xem l� do NPC kh�ng th� t��ng t�c;
- n�t theo d�i NPC v� �t l�ch g�p;
- b�n � nhi�t m�t � d�n c�, kh�ng render h�ng ngh�n n�t ri�ng l�.

Action Bar ch� �a 36 NPC quan tr�ng nh�t theo ng� c�nh; ph�n Danh s�ch c� d�n cho ph�p m� r�ng to�n b�.

## 11. T��ng t�c v�i h� th�ng kh�c

- **Map:** NPC t�o traffic, patrol edge, route block, rumor v� m� ��ng runtime ��c c�p ph�p.
- **Weather:** thay �i l�ch, shelter, mood, risk v� h�nh vi.
- **Faction:** l�nh, thu�, gi�y th�ng h�nh, chi�n tranh v� tuy�n qu�n.
- **Relationship/Neo:** ch� NPC b�n v�ng ho�c ��c ghi nh� m�i tr� th�nh quan h� d�i h�n.
- **Quest:** quest c� th� giao cho NPC kh�c sau khi NPC g�c r�i node; m�c ti�u theo `instanceId`.
- **Combat:** NPC b� th��ng, b�t gi�, ch�y tr�n v� c�n c�u h�; kh�ng h�i m�u mi�n ph� khi r�i m�n h�nh.
- **Economy:** cung/c�u do s� NPC, th��ng o�n v� th�i ti�t quy�t �nh.
- **Cultivation:** V�n �o, �u Ng�, d�y c�ng ph�p v� quan s�t NPC c�ng Con ��ng.

## 12. Hi�u nng v� l�u tr�

- Spatial index theo `regionId/nodeId/subLocationId`.
- Kh�ng scan to�n b� NPC cho m�i node m�i frame.
- Background population x� l� theo th�ng k�; active actors materialize khi c�n.
- Ch� serialize danh t�nh b�n v�ng, actor ang c� quest/quan h�/incident v� seed qu�n th�.
- Gi�i h�n event log theo c�a s�; gi� snapshot �nh k� cho NPC quan tr�ng.
- M�c ti�u: 5.000 NPC trong m�t node v�n m� detail <500 ms v� tick <100 ms tr�n m�y t�m trung.

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

Mutation ph�i tr� `{ success, reason, data, transactionId, stateVersion }`, c� rollback v� journal.

## 14. L� tr�nh tri�n khai

1. **Pha A:** schema/migration, NPC ecology profile, spatial index, population seed.
2. **Pha B:** scheduler, route, sub-location presence v� UI danh s�ch �ng.
3. **Pha C:** th�i ti�t, shelter, NPCc�nh quan v� local incident.
4. **Pha D:** NPCNPC encounter, faction orders, m�t h�i, witness v� bulletin.
5. **Pha E:** kinh t� d�n c�, quest chuy�n giao, V�n �o/�u Ng�, hi�u nng v� visual regression.

## 15. Acceptance criteria

1. Node th�nh th� c� th� ch�a �t nh�t 1.000 NPC logic m� kh�ng tr�n UI ho�c scan O(N) m�i frame.
2. NPC lu�n c� `nodeId + subLocationId` h�p l� khi hi�n th�.
3. NPC t� di chuy�n theo l�ch, weather, nhu c�u v� incident; reload v�n deterministic.
4. C� �t nh�t 5 lo�i t��ng t�c NPCNPC t�o h�u qu� state r� r�ng.
5. Th�i ti�t thay �i ��c h�nh vi, shelter, l�ch v� route c�a NPC.
6. NPC c� th� t��ng t�c v�i c�ng tr�nh, �a h�nh, edge v� t�i nguy�n node.
7. NPC �ng v�n l�c/t�m/ph�n trang ��c; Action Bar ch� hi�n th� nh�m ph� h�p.
8. NPC b�n v�ng kh�ng bi�n m�t �m th�m; NPC t�m th�i kh�ng l�m b�n quan h� d�i h�n.
9. Kh�ng c� NPC n�o t� s�a static topology.
10. Save ci migrate ��c; transaction retry kh�ng nh�n �i encounter, ph�n th��ng ho�c quan h�.
11. T�t c� nh�n giao di�n ti�ng Vi�t, m� k� thu�t kh�ng l� cho ng��i ch�i.
12. Test hi�u nng, deterministic tick, weather, map, relationship v� visual �u �t.
## 16. Logic Gap Closure  b� sung b�t bu�c sau r� so�t

### 16.1. T�ch population n�n v� actor c� danh t�nh

`backgroundCount` ch� l� th�ng k� d�n c�; actor ch� ��c materialize khi c� m�t trong c�c i�u ki�n: n�m trong viewport/Node Detail, c� quest/quan h�, l� witness, tham gia incident, n�m tr�n route player ho�c ��c faction �nh d�u. Materialize d�ng kh�a:

```text
instanceId = hash(worldSeed + nodeId + roleId + populationSlot + generation)
```

Kh�ng t�o l�i actor m�i sau reload n�u c�ng kh�a. Khi actor t�m th�i r�i node, chuy�n v� pool ho�c l�u `lastKnownNodeId`; kh�ng x�a quan h� b�n v�ng.

### 16.2. Quota, congestion v� h�ng �i

M�i sub-location c� `capacity`, `queuePolicy` v� `priorityRoles`. N�u v��t capacity:

1. actor kh�n c�p (b� th��ng, tr� em, h� t�ng) ��c �u ti�n;
2. actor kh�c x�p h�ng ho�c chuy�n shelter/sub-location g�n nh�t;
3. n�u m�i n�i �y, actor r�i node theo edge m� c� chi ph� th�p nh�t.

Kh�ng ��c spawn v� h�n � l�p UI. `visibleCount` v� `backgroundCount` ph�i t�ch bi�t.

### 16.3. State machine NPC

```text
idle � planning � traveling � arrived � acting � cooldown � idle
             � sheltering �
             � injured � treated/recovering � idle
             � missing � found/retired/dead
```

M�i transition ghi `reason`, `source`, `day`, `decisionSeed`. Transition kh�ng h�p l� b� t� ch�i, kh�ng t� s�a tr�ng th�i b�ng assignment r�i r�c.

### 16.4. Di chuy�n NPC v� topology

NPC d�ng c�ng `resolveMapTopology()`/`edgeState()` v�i player. NPC kh�ng ��c i qua edge `blocked`, kh�ng ��c t� m� static edge. N�u route h�ng, NPC chuy�n `rerouting`; sau ba l�n kh�ng t�m ��c ��ng, chuy�n `sheltering` ho�c `missing` t�y role. Faction patrol c� quy�n m� edge runtime ri�ng n�u data khai b�o `authorityAction`.

### 16.5. Quy�t �nh h�nh vi theo nhu c�u

Nhu c�u chu�n h�a 0100; 100 l� c�p b�ch:

```text
needUrgency = max(food, shelter, safety, social)
score(action) = goalWeight � 0.40
              + needUrgency � 0.30
              + weatherFit � 0.15
              + relation/factionBias � 0.10
              - travelCost � 0.05
```

Tie-break deterministic theo `actionId`; kh�ng � random l�m NPC �i h�nh vi sau reload.

### 16.6. Weather severity v� hysteresis

Th�i ti�t c� `severity 03`. NPC ch� �i l�ch khi severity v��t ng��ng v�o ho�c gi�m d��i ng��ng ra, tr�nh �i shelter m�i tick:

```text
enterShelter n�u severity >= enterThreshold
leaveShelter n�u severity <= leaveThreshold (leaveThreshold < enterThreshold)
```

Th�i ti�t c�c oan kh�a ho�t �ng ngo�i tr�i, tng nhu c�u shelter/n��c, thay �i route v� c� th� t�o incident. Weather modifier ph�i c� `sourceRegion`, `startDay`, `endDay`, `severity`.

### 16.7. NPCNPC encounter lifecycle

```text
detected � proposed � accepted/rejected � resolving � resolved
                                      � interrupted
```

Encounter c� `encounterId`, actor pair � sort, sub-location, witness list, weather snapshot, choice history v� cooldown. M�t c�p actor kh�ng th� resolve hai l�n c�ng tick. Witness nh�n memory n�u `visibility` �; encounter b� m�t kh�ng t� �ng b� to�n node bi�t.

### 16.8. Witness, rumor v� lan truy�n tin

```text
rumorStrength = eventImportance � witnessReliability � visibility
                � distanceDecay � weatherVisibility
```

Tin truy�n qua NPC c� `knownBy`, `confidence`, `expiresDay`; m�i tick ch� lan t�i a m�t hop. Faction bulletin ch� nh�n tin �t confidence t�i thi�u, kh�ng l�y tr�c ti�p to�n b� world state.

### 16.9. T�c �ng c�nh quan c� rollback

NPC s�a c�u, d�ng shelter, m� ch�, d�n ��ng ho�c ph� v�t c�n ph�i t�o `landscapeMutation` qua Map transaction. Mutation c� `ownerNpcId`, `requiredItems`, `duration`, `integrity`, `expiresDay` v� undo policy. NPC kh�ng ��c s�a c�u h�nh static; ch� t�o runtime overlay.

### 16.10. Kinh t� v� v�t t� NPC

Inventory background d�ng aggregate, c�n th��ng v� v�i actor d�ng inventory instance. Kh�ng t�o v�t ph�m v� h�n t� `backgroundCount`. M�i giao d�ch kh�a gi�/stock t�i preview, commit qua transaction v� ghi buyer/seller/day.

### 16.11. Quan h� v� k� �c

Quan h� NPCNPC d�ng b�n tr�c `trust/respect/fear/suspicion` 0100. M�i event c� `uniqueKey`; c�ng event kh�ng c�ng hai l�n. K� �c gi�m d�n theo half-life nh�ng event Neo/quest/ ph�n b�i kh�ng ��c qu�n t� �ng; ph�i c� tr�ng th�i `suppressed` ho�c `resolved`.

### 16.12. Player lock v� t��ng t�c c�nh tranh

Khi player b�t �u n�i chuy�n/giao d�ch/�u v�i NPC, actor ��c lock t�m th�i. NPC kh�c c� th� chen v�o ch� khi encounter cho ph�p. H�t timeout ph�i gi�i ph�ng lock; reload kh�ng � actor b� kh�a v)nh vi�n.

### 16.13. Offline simulation

Offline tick kh�ng materialize h�ng ngh�n actor v� kh�ng resolve encounter ng�u nhi�n kh�ng quan s�t ��c. D�ng aggregate transition cho population; ch� resolve actor b�n v�ng, quest, travel, shelter, incident v� quan h� c� t�c �ng. UI ph�i ghi r� m� ph�ng n�n khi ng��i ch�i quay l�i.

### 16.14. View model NPC th�ng nh�t

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

UI ch� nh�n `NpcNodeView[]`; kh�ng t� �c `npcState` r�i t� quy�t �nh action.

### 16.15. Invariants b�t bu�c

1. NPC s�ng ch� c� m�t v� tr� hi�n t�i.
2. `currentSubLocationId` ph�i thu�c node hi�n t�i v� kh�ng v��t capacity m� kh�ng c� queue record.
3. NPC ang `traveling` kh�ng th� �ng th�i `acting` ho�c giao d�ch.
4. NPC `dead/retired` kh�ng xu�t hi�n trong presence list.
5. NPC t�m th�i kh�ng t�o quan h� b�n v�ng n�u ch�a ��c ghi nh�.
6. Weather reaction, encounter v� landscape mutation �u idempotent.
7. Kh�ng mutation NPC n�o s�a static map catalog.

## 17. API v� m� l�i chu�n h�a

C�c API ph�i c� preview/commit t��ng �ng v� d�ng m� l�i d�ch ��c:

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

M� l�i t�i thi�u: `NPC_NOT_PRESENT`, `NPC_BUSY`, `NPC_WEATHER_SHELTER_FULL`, `NPC_ROUTE_BLOCKED`, `NPC_ENCOUNTER_EXPIRED`, `NPC_LOCK_CONFLICT`, `NPC_STATE_CONFLICT`.

## 18. Acceptance b� sung

1. 5.000 NPC trong m�t node kh�ng t�o h�n quota actor materialized v� kh�ng scan to�n b� m�i frame.
2. Hai client/tick c�ng t��ng t�c m�t NPC ch� m�t mutation th�nh c�ng.
3. Weather severity gi� �n �nh shelter qua nhi�u tick, kh�ng rung tr�ng th�i.
4. NPC route kh�ng i qua edge phong t�a v� t� t�m ��ng v�ng h�p l�.
5. NPCNPC encounter c� witness/memory/rumor �ng visibility.
6. Landscape mutation c� rollback khi thi�u v�t t� ho�c b� interrupt.
7. Offline simulation kh�ng sinh ph�n th��ng/quan h� tr�ng l�p.
8. Save/load gi� instanceId, schedule, route, memory, shelter, lock timeout v� encounter journal.
9. M�i nh�n NPC, weather, role v� l�i hi�n th� �u b�ng ti�ng Vi�t.
