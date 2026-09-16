# MAP SYSTEM V2  THI�T K� TO�N DI�N CHO OPEN WORLD TH�C S�
> Thay th�/h�p nh�t `MAP_SYSTEM.md` + ph�n b�n � trong `WORLD_INTERCONNECTION_SYSTEM.md` m�c 1-4.
> V�n � c�t l�i c�n s�a: b�n � hi�n t�i v�n l� "node-graph c� sinh procedural" nh�ng C�M GI�C nh�
> danh s�ch h�p n�i nhau, kh�ng ph�i th� gi�i s�ng  th� l�c kh�ng th�t s� "chi�m kh�ng gian", ng��i
> ch�i kh�ng c� c�ng c� �nh h�nh b�n �, di chuy�n kh�ng c� tr�ng l��ng.

---

## 1. KI�N TR�C 4 L�P B�N � (thay v� 1 l�p node-graph ph�ng)

```
L�p 1  TH� GI�I (World Map):     t�ng quan to�n v�ng, hi�n v�ng �nh h��ng Faction d�ng heatmap,
                                    d�ng � l�n k� ho�ch di chuy�n xa, KH�NG hi�n chi ti�t t�ng node
L�p 2  V�NG (Regional Map):       ch�nh l� node-graph hi�n c� (grid t�a � x,y t� MAP_SYSTEM.md 6),
                                    �y l� l�p ch�i ch�nh h�ng ng�y
L�p 3  �A I�M (Node Detail):    M�I  b�m v�o 1 node � kh�m ph�, m� ra sub-map c�c i�m nh� B�N
                                    TRONG node � (ch�/s�nh ch�nh/h�m sau/kho...), NPC �ng � �NG
                                    i�m nh� c� th�, kh�ng c�n "c� node l� 1 h�p m�"
L�p 4  INSTANCE (B� C�nh/M�ng C�nh/N�i th�t �ng Ph�): t�ch bi�t ho�n to�n kh�i l��i ch�nh, � c�
                                    khung � c�c t�i li�u tr��c, gi� nguy�n
```
�y l� thay �i N�N T�NG quan tr�ng nh�t  gi�i quy�t tr�c ti�p c�m gi�c "ch�a ph�i open world th�t"
v� tr��c gi� ch� c� L�p 2, khi�n m�i node d� to (V��ng Kinh) hay nh� (tr�m g�c) �u c�m gi�c nh�
nhau (1 h�p b�m v�o l� xong).

---

## 2. L�P 3 CHI TI�T  NODE DETAIL VIEW (gi�i quy�t "node l� h�p r�ng")

```
NodeDetailLayout {
  nodeId,
  subLocations: [
    { id, name, type: "market"|"hall"|"alley"|"warehouse"|"gate"|"shrine"|"training_ground",
      npcsPresent: [npcId], actionsAvailable: [...], visualTag }
  ]
}
```
- S� l��ng `subLocations` t�y quy m� node: Tr�m g�c nh� = 1-2 i�m; T�ng M�n/V��ng Kinh l�n = 5-8
  i�m kh�c nhau.
- NPC gi� g�n v�o �NG 1 `subLocation` c� th� (kh�ng c�n "NPC � node" m� h�)  Tr��ng L�o � "S�nh
  Ch�nh", Th��ng Nh�n � "Ch�", gi�n i�p/Ma �u th��ng xu�t hi�n � "H�m Sau" (d�ng �ng � t��ng M�t
  H�i � thi�t k�, gi� c� V� TR� C� TH� � player ph�i ch� �ng t�i �ng ch� m�i b�t g�p).
- Action Bar t�i L�p 3 ch� hi�n action li�n quan t�i `subLocation` ang �ng (VD "Ch�" m�i c� Giao
  D�ch, "H�m Sau" m�i c� i�u Tra M�t H�i)  bi�n vi�c di chuy�n TRONG 1 node cing c� � ngh)a ch�n
  l�a, kh�ng ch� di chuy�n GI�A c�c node.

---

## 3. L�NH TH� THEO GRADIENT (KH�NG C�N NH� PH�N S� H�U/KH�NG S� H�U)

### 3.1. V�ng �nh H��ng (Influence Radius) thay v� `ownerFactionId` c�ng
```
M�i Faction node (T�ng M�n/Th� Gia ch�nh) ph�t ra "s�c �nh h��ng" gi�m d�n theo kho�ng c�ch:
  influenceAt(node, faction) = faction.power � decayFactor^(distance(node, faction.homeNode))
  // decayFactor v� d� 0.7  m�i � xa th�m, �nh h��ng c�n 70% � tr��c

M�i node TH��NG (kh�ng ph�i Faction ch�nh) c� `influenceMap: { factionId: number }`  T�NH L�I m�i
worldTick, kh�ng c� �nh. `ownerFactionId` ci gi� SUY RA t� influenceMap (Faction c� influence cao
nh�t t�i node � > ng��ng n�o � m�i ��c coi l� "ch�", n�u kh�ng ai v��t ng��ng -> node "v� ch�
th�c s�", kh�ng ph�i m�c �nh thu�c v� Faction g�n nh�t).
```

### 3.2. V�ng Tranh Ch�p (Contested Zone)  h� qu� tr�c ti�p c�a gradient
```
Node c� 2+ Faction c�ng influence g�n b�ng nhau (ch�nh l�ch < 15%) -> �nh d�u "Tranh Ch�p":
  - `eventPoolTag` �i th�nh h�n h�p (tr�n tr�ng s� s� ki�n c�a C� 2 Faction li�n quan)
  - C� 2 Faction �u c� th� giao nhi�m v� T�I node n�y (d� kh�ng "s� h�u" ch�nh th�c)
  - Player ho�n th�nh quest cho 1 b�n t�i �y s� �y influence b�n � l�n  GI�P NG��I CH�I TH�C S�
    �NH H�NH B�N � b�ng h�nh �ng, kh�ng ch� �ng xem th� l�c t� chi�n tranh (� c� �
    WORLD_INTERCONNECTION_SYSTEM.md m�c 2.2, gi� c� th�m 1 con ��ng �NH H��NG M�M song song
    chi�n tranh tr�c di�n)
```

### 3.3. B�n � Heatmap � L�p 1 (World Map)
Hi�n m�u ch�ng l�p theo `influenceMap` t�ng h�p to�n v�ng  ng��i ch�i nh�n L�p 1 th�y NGAY "v�ng
n�y ang l� c�a ai, v�ng n�o ang tranh ch�p n�ng" m� kh�ng c�n b�m t�ng node � L�p 2.

---

## 4. NG��I CH�I �NH H�NH B�N � (MAP AGENCY  hi�n ho�n to�n th� �ng)

### 4.1. C�m C�/L�p Tr�m (Claim Outpost)
```
T�i 1 node V� CH� TH�C S� (kh�ng Faction n�o v��t ng��ng influence, m�c 3.1), player c� action m�i
"L�p Tr�m"  c�n Linh Th�ch + th�i gian (v�i ng�y GameClock), sau �:
  - Node � c� `ownerFactionId = "player_outpost_" + characterId` (player CH�NH TH�C l� 1 th�c th�
    c� l�nh th� tr�n b�n �, kh�ng ch� c� �ng Ph� �n l�)
  - T� ph�t ra influence NH� quanh n� (d�ng c�ng th�c m�c 3.1, `power` th�p h�n Faction th�t nhi�u)
  - C� th� b� Faction kh�c "l�n" n�u kh�ng c�ng c� (�ng c� ch� gradient, kh�ng ph�i b�t t�)
```

### 4.2. X�y D�ng T�i Tr�m/�ng Ph� (Structure Building)
| C�ng tr�nh | Hi�u �ng l�n b�n � |
|---|---|
| V�ng G�c (Watchtower) | Tng b�n k�nh `revealAdjacentNodes` (MAP_SYSTEM.md m�c 2) quanh tr�m  nh�n xa h�n m� kh�ng c�n t� i |
| Tr�m D�ch (Waystation) | Th�m 1 i�m Fast Travel (m�c 5) mi�n ph� t�i �y |
| Th� T�p Nh� (Trading Post) | NPC Th��ng Nh�n t� �ng gh� qua theo l�ch (d�ng `scheduleType: itinerant` � c�), kh�ng c�n player ch� �ng t�m |
| Tr�n Ph�p Ph�ng Th� | Tng "power" ph�t influence c�a tr�m (� n�i � `PHAC_THAO_TU_VI_CON_DUONG_V3.md`  Tr�n Ph�p S� ngh� m�i) |

### 4.3. Tuy�n B� Ch� Quy�n L�n Faction Th�t (Territory Petition)
N�u player ang ph�c v� 1 Faction (� gia nh�p), c� th� "hi�n" 1 Tr�m c�a m�nh cho Faction � 
Tr�m tr� th�nh l�nh th� ch�nh th�c c�a Faction (tng `power` g�c c�a Faction � l�u d�i), �i l�i
C�ng Hi�n/factionReputation tng v�t  bi�n vi�c m� r�ng b�n � c� nh�n th�nh �NG G�P th�c s� cho
t� ch�c m�nh ch�n, kh�ng ph�i 2 h� th�ng t�ch r�i.

---

## 5. DI CHUY�N C� TR�NG L��NG (TRAVEL AS MEANINGFUL MECHANIC)

### 5.1. Chi ph� di chuy�n th�t (kh�ng c�n t�c th�i v� h�n)
```
travelTimeGameDays = distance(from, to) / travelSpeed(travelType)
  travelType "walk" (m�c �nh): speed chu�n
  travelType "ng�_kh�" (c�n C�ng Ph�p/Th�n Ph�p ph� h�p): speed �3
  travelType "truy�n_t�ng_tr�n": t�c th�i NH�NG c�n � c� Tr�m D�ch/Fast Travel � C� 2 �u (m�c 4.2)

Trong l�c di chuy�n nhi�u ng�y: roll s� ki�n d�c ��ng theo �NG c� ch� � c�
(RANDOM_EVENT_SYSTEM.md m�c 1, trigger "moving_through"), nh�ng gi� S� L�N ROLL t� l� v�i s� ng�y
di chuy�n th�c (i c�ng xa c�ng nhi�u c� h�i/r�i ro d�c ��ng, kh�ng ph�i 1 l�n duy nh�t b�t k� xa
g�n nh� hi�n t�i).
```

### 5.2. Fast Travel  m� d�n, kh�ng c� s�n t� �u
```
i�m Fast Travel CH� t�n t�i t�i: node c�t truy�n � kh�m ph� L�N �U (t� �ng unlock), ho�c Tr�m
D�ch do player/Faction x�y (m�c 4.2). Di chuy�n b�ng Fast Travel gi�a 2 i�m � unlock: t�n Linh
Th�ch (kh�ng t�n ng�y GameClock), KH�NG roll s� ki�n d�c ��ng (an to�n tuy�t �i, � l� c�i gi�
Linh Th�ch ph�i tr�)  t�o l�a ch�n r� r�ng: i b� (r�, ch�m, r�i ro/c� h�i) vs Fast Travel (�t,
nhanh, an to�n).
```

### 5.3. o�n �ng H�nh Gi�m R�i Ro
N�u c� NPC "h� t�ng" (thu� t�i Ph��ng Th� ho�c Faction c� theo n�u C�ng Hi�n � cao) i c�ng trong
chuy�n di chuy�n d�i, gi�m % s� ki�n Qu�i V�t/H�c �o d�c ��ng  chi ph� thu� t� l� v�i � d�i
qu�ng ��ng, t�o l�a ch�n kinh t� th�t (t� i r� nh�ng r�i ro, thu� h� t�ng �t nh�ng an to�n h�n).

---

## 6. TH� L�C HI�N DI�N TH�T TR�N B�N � (kh�ng ch� l� con s� �n)

### 6.1. �i Tu�n Tra Di �ng (Patrol Icons)
NPC l�nh/� t� tu�n tra (� c� `scheduleType: patrol`) gi� hi�n th� NGAY TR�N B�N � L�P 2 d��i d�ng
1 icon nh� DI CHUY�N D�C EDGE gi�a c�c node theo l�ch tr�nh th�t (kh�ng ph�i ch� xu�t hi�n khi
player t�nh c� � c�ng node)  ng��i ch�i nh�n b�n � th�y ��c "v�ng n�y ang c� bao nhi�u l�nh
tu�n tra qua l�i", t�o c�m gi�c l�nh th� ��c B�O V� TH�T ch� kh�ng ph�i nh�n d�n.

### 6.2. Ki�n Tr�c Node �i Theo Ch� S� H�u
Node do Faction Ch�nh �o s� h�u vs H�c �o vs v� ch� c� visualTag kh�c nhau (kh�ng c�n chi ti�t �
h�a, ch� c�n field m� t� �i: "C�ng T�ng M�n uy nghi�m" vs "Tr�i l�n xi�u v�o c�a s�n t�c" vs "T�n
t�ch hoang ph� kh�ng ng��i canh gi�")  �c m� t� node l� bi�t ngay t�nh ch�t khu v�c.

### 6.3. B�ng Tin Faction (Bulletin Board) t�i node Faction s� h�u
Hi�n danh s�ch `faction_daily` quest hi�n t�i C�A FACTION � ngay khi player v�o node (kh�ng c�n
t�m NPC c� th� m�i th�y quest)  �ng th�i hi�n "Tin T�c V�ng" (world event g�n �y li�n quan
Faction n�y: th�ng/thua tr�n n�o, B� C�nh n�o s�p m�)  bi�n node Faction th�nh i�m TH�NG TIN
trung t�m, kh�ng ch� i�m giao d�ch/nhi�m v�.

---

## 7. S��NG M� CHI�N TRANH  4 C�P � (thay v� ch� discovered=true/false)

| C�p | T�n | i�u ki�n | Hi�n th� |
|---|---|---|---|
| 0 | Ch�a Bi�t | Ch�a t�ng nghe n�i | "Ch�a kh�m ph�" (nh� hi�n t�i) |
| 1 | Nghe �n | NPC t�i node l�n c�n nh�c t�i (qua h�i tho�i/B�ng Tin m�c 6.3) NH�NG ch�a t�i | Hi�n T�N node (kh�ng c�n �n ho�n to�n) + m� t� m� h� 1 c�u, v� tr� g�n �ng tr�n L�p 1 nh�ng KH�NG hi�n tr�n L�p 2 grid ch�nh x�c |
| 2 | � Kh�m Ph� | � t�ng t�i | �y � nh� thi�t k� g�c |
| 3 | Th�ng Thu�c | T�i >= 5 l�n HO�C c� Tr�m/�ng Ph� t�i �y | M� th�m: nh�n th�y `subLocations` (L�p 3) NGAY T� L�p 2 kh�ng c�n b�m v�o, v� th�y `influenceMap` chi ti�t (kh�ng ch� ch� s� h�u ch�nh) |

C�p 1 "Nghe �n" l� b� sung M�I quan tr�ng  gi�i quy�t c�m gi�c th� gi�i m� hi�n t�i "ho�c bi�t 100%
ho�c kh�ng bi�t g�" kh� c�ng, gi� c� tr�ng th�i trung gian t�o �ng l�c TH�T S� mu�n i t�i (�
nghe t�n, t� m� mu�n x�c nh�n) thay v� random ho�n to�n m� m�.

---

## 8. SCHEMA T�NG H�P (c�p nh�t `MapNode` � c� � `MAP_SYSTEM.md` m�c 1 v� 6.7)

```
### 8.1. Contract th�c thi b� sung

**L3 node detail:** m�i `subLocation` c� `id`, `type`, `displayName`, `actions`, `capacity`, `visibilityFog`. NPC schedule tr� `currentSubLocationId`; i�m �y ho�c b� kh�a th� NPC fallback v� `main`. State machine l� `outside_node -> entering_node -> inside_sub_location -> leaving_node`. Chuy�n i�m trong c�ng node kh�ng roll encounter; action lu�n g�i `nodeId + subLocationId` nh�ng save gi� hai field t�ch bi�t.

**Influence/heatmap:** influence l� derived state, cache theo `worldTick + factionVersion + structureVersion + eventVersion` v� ph�i rebuild deterministic. BFS t� faction home nodes, c�ng th�c `power * 0.70^distance * (1 + structureBonus + eventBonus + outpostBonus)`, clamp `[0,100]`. `stable` khi top >=35 v� margin >=15%; `contested` khi top-two margin <15%; c�n l�i `frontier`. Heatmap kh�ng ��c suy lu�n owner � fog 0.

**Fog 03:** discovery event chu�n `{ nodeId, level, source, actorId, tick }`; reducer �p d�ng max level v� idempotent journal. Rumor=1, visit=2, survey/outpost/waystation=3. `revealAdjacentNodes` ch� n�ng t�i a m�t c�p, kh�ng spoil sub-location.

**Outpost/structures:** claim theo `preview -> establish -> maintain`. Preview kh�ng mutate; establish tr� cost m�t l�n v� t�o `outpostId`; maintain tr� upkeep m�i world tick, integrity v� 0 th� v� hi�u h�a ch� kh�ng x�a l�ch s�. Structure c� `level`, `integrity`, `upkeep`, `effects`, `builtBy`; kh�ng tr�ng type trong node, t�i a ba structure.

**Weighted travel:** task c� tr�ng th�i `planned | active | interrupted | completed | cancelled`, snapshot kh�a route, distance, ETA, risk seed, escort v� cost. M�i ng�y roll b�ng `taskId + dayIndex` � retry idempotent. Escort c� `riskReduction`, `dailyCost`, `canFlee`. Fast travel c�n unlock hai �u, kh�ng combat/instance, kh�ng road event nh�ng v�n ghi travel log.

**Patrol/bulletin:** patrol l� projection tr�n edge `{ patrolCount, factionId, threat, nextTransitionTick }`, kh�ng t�o node m�i. Bulletin t�i a ba tin, c� `requiredFog`, `expiresAt`, `actionId`; filter tr��c khi render.

**Transaction resolver:** m�i map mutation ch�y qua `resolveMapTransaction({ actionId, actorId, expectedVersion, validate, apply, rollback })` v� tr� `{ success, reason, data, transactionId, stateVersion }`. Version check, cost/permission/fog check, journal v� rollback l� b�t bu�c. Idempotency key g�m `actionId + actorId + inputHash`.

**Acceptance tests:** L3 �ng NPC/action; influence BFS v� contested threshold; fog migration/privacy; outpost thi�u cost/maintenance; travel retry/interruption/fast travel; patrol edge v� bulletin expiry; rollback khi mutation gi�a ch�ng.

MapNode {
  ...(gi� nguy�n to�n b� field ci: id, nodeType, regionTag, x, y, isProcedural, dangerLevel,
      linhKhiDensity, eventPoolTag, cooldownUntil, claimedByPlayerId)...

  fogState: 0-3,                          // thay th� `discovered: boolean` ci (m�c 7)
  influenceMap: { factionId: number },     // thay th� `ownerFactionId` t)nh (m�c 3.1)  ownerFactionId
                                            // gi� l� GETTER t�nh t� influenceMap, kh�ng l�u tr�c ti�p
  subLocations: NodeDetailLayout | null,    // null n�u node qu� nh� � c�n L�p 3 (m�c 2)
  patrolSchedule: [{ npcId, fromNode, toNode, cycleHours }],  // m�c 6.1
  playerStructures: [{ type, builtByCharacterId, builtAt }],   // m�c 4.2
  fastTravelUnlocked: boolean,              // m�c 5.2
}
```

---

## 9. VI�C C�N L�M TI�P (�u ti�n  �y l� redesign l�n, KH�NG l�m h�t c�ng l�c)
1. **L�m tr��c ti�n:** m�c 3.1 (influence gradient thay `ownerFactionId` t)nh)  m�i m�c kh�c (3.2,
   4, 6) �u ph� thu�c d� li�u n�y t�n t�i tr��c.
2. **L�m th� hai:** m�c 7 (4 c�p s��ng m�)  �c l�p t��ng �i, c�i thi�n c�m gi�c kh�m ph� ngay l�p
   t�c m� kh�ng c�n ch� m�c 1 xong.
3. **L�m th� ba:** m�c 2 (L�p 3 Node Detail)  c�n nhi�u n�i dung th� c�ng h�n (�t NPC v�o �ng
   subLocation), n�n l�m sau khi khung d� li�u (m�c 8) � �n �nh.
4. **L�m sau c�ng:** m�c 4 (Player Map Agency  L�p Tr�m/X�y D�ng) v� m�c 5.2-5.3 (Fast Travel/o�n
   H� T�ng)  �y l� t�nh nng CH� �NG ph�c t�p nh�t, c�n n�n t�ng gradient + fog 4 c�p �n �nh
   tr��c � kh�ng ph�i s�a l�i logic 2 l�n.
5. Quy�t �nh l�i c�u h�i multiplayer c�n treo (� nh�c � nhi�u t�i li�u tr��c)  m�c 4.1 "L�p Tr�m"
   �c bi�t c�n c�u tr� l�i r� TR��C khi code, v� � ngh)a "tr�m c�a player" kh�c h�n n�u server-wide
   (ng��i kh�c th�y ��c/c� th� ph�) vs single-player (ch� �nh h��ng th� gi�i ri�ng).
---

## AMENDMENT 2026-09-16 — MAP V2/INTERACTION VÀ CÔNG TRÌNH

Map V2 là khoảng trống ưu tiên: influence gradient phải đi qua API canonical; fog, completion, node history, sub-location và travel weighting phải dùng cùng resolver, không đọc các bảng faction rời rạc trực tiếp. UI bản đồ hiển thị influence/completion nhưng không được tự tính lại luật gameplay.

Tab Thế giới sở hữu feature **Công Trình Bản Đồ**. Hai loại công trình người chơi xây dựng là **Truyền Tống Trận** (mở đầu fast travel ở node) và **Hộ Giới Đại Trận** (giảm encounter/curse risk, tăng influence). Alias nội bộ legacy (`waystation`, `ward_formation`) phải được migrate về canonical type (`teleport_array`, `world_ward`) mà không làm mất save cũ. Mọi xây dựng kiểm tra node, trùng công trình, chi phí và ghi node history; không đặt logic này vào Con Đường hay Nghề Ẩn.
