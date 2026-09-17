# Open-World Cosmic Constellation Map

## B�n � V�n Gi�i  ph�n l�p hi�n th� chu�n

## C�nh gi�i t� ch�c theo Con ��ng

- H� s� t� ch�c kh�ng ��c hi�n th� c�nh gi�i legacy nh� Luy�n Kh�, Tr�c C�, Kim an.
- `guild.highest_realm` ch� d�ng l�m kh�a t��ng th�ch; UI ph�i �nh x� sang `GameData.REALMS` r�i d�ng `PATH_FATE_RELATIONS.path_titles[pathId]`.
- Khi nh�n v�t ch�a ch�n Con ��ng, hi�n th� Con ��ng b�c N thay v� b�a t�n c�nh gi�i.
- i�u ki�n gia nh�p ph�i di�n gi�i b�ng t�n c�nh gi�i Con ��ng t��ng �ng v�i `minRealm`, kh�ng hi�n th� d�ng s� tr� khi d�ng trong tooltip k� thu�t.

## Complete node links v� sinh node �nh h��ng

## Node pool h�p nh�t

- `WORLD_MAP.nodePool` l� registry duy nh�t cho �a danh, t� ch�c, ph��ng th�, th�nh tr�n, th�n, b�n t�u, tr�m d�ch v� v�ng hoang d� runtime.
- Node runtime kh�ng d�ng t�n t�a � d�ng `Bng Nguy�n -1`; t�n ph�i l�y t� pool c�nh quan theo v�ng v� lo�i �a h�nh.
- M�i node l�u k�m `npcs`, `enemies`, `organizationId` v� `mapNodeType` � NPC/qu�i, t� ch�c v� th�m hi�m c�ng �c m�t ngu�n d� li�u.
- Khi sinh node m�i, engine ghi node v�o c� `LOCATIONS`, `openWorld.nodes` v� `WORLD_MAP.nodePool`.

- M�i node khi ��c n�p ph�i c� � b�n h��ng B�c/Nam/�ng/T�y.
- N�u catalog thi�u h��ng, engine sinh node runtime k� c�n ngay t�i th�i i�m resolve topology v� ghi reciprocal link.
- Node runtime m�i lu�n gi� li�n k�t quay v� node sinh ra; c�c h��ng c�n thi�u ti�p t�c ��c sinh lazy khi ng��i ch�i ch�n h��ng.
- `mapNeighbors()` v� `mapDistance()` v�n coi to�n b� node l� complete graph � travel t� do gi�a m�i node h�p l�.

- M�u v�ng ch� d�nh cho node v�ng ch�a nh�n v�t (`currentRegionId`); kh�ng d�ng cho ghim t� ch�c ho�c node sao t� ch�c.
- Ghim t� ch�c ph�i ph�n m�u theo alignment/allegiance v� gi� k�ch th��c theo `pyramid_tier`.
- Nh�n t� ch�c d�ng c�ng m�u alignment, kh�ng d�ng m�u v�ng m�c �nh.
- Sao t� ch�c ph� ch� l� l�p d�n ��ng m�, kh�ng ��c che ho�c bi�n th�nh tr�ng th�i V�ng hi�n t�i.
- Tr�ng th�i kh�m ph� v� quy�n di chuy�n l� hai l�p �c l�p: node ch�a kh�m ph� v�n i ��c � backend nh�ng UI ch� hi�n th� Ch�a th�m hi�m.

## Quy t�c hi�n th� V�n Gi�i L� (b� sung)

- M�u v�ng ch� d�nh cho �ng v�ng ch�a `state.locationId`; kh�ng ��c �p d�ng cho to�n b� node.
- Node t� ch�c d�ng m�u theo `alignment/allegiance`: Ch�nh �o xanh lam, Ma/T� �o � t�m, Trung l�p t�m x�m.
- K�ch th��c ghim t� ch�c t� l� ngh�ch v�i `pyramid_tier` (Tier 1 l�n nh�t).
- C� th� i l� quy�n backend, kh�ng ph�i m�u giao di�n; frontend ch� hi�n th� ang � �y, � th�m hi�m, Ch�a th�m hi�m v� marker �n sau Fog.
- Marker Nguy hi�m, NPC v� C� duy�n ch� ��c render khi node � th�m hi�m.
- Zoom, thu nh�, reset v� pan ph�i t�c �ng l�n l�p node hi�n th�, kh�ng ch� SVG ��ng n�i.

## M�c ti�u

L�p tr�nh b�y b�n � chuy�n t� s� � node/edge sang **Thi�n � Ch�m Sao**. D� li�u n�n kh�ng thay �i: gi� nguy�n ID �a i�m, v�ng, route, fog, visited, locked, v� tr� nh�n v�t, travel v� action.

## �u ti�n tri�n khai: Khu v�c hi�n t�i

`Khu v�c hi�n t�i` l� m�n h�nh m�c �nh � ng��i ch�i ra quy�t �nh. M�i thay �i v� map ph�i ��c �p d�ng � �y tr��c khi m� r�ng sang V�n Gi�i L�. Local map ph�i d�ng c�ng ng�n ng� ch�m sao nh�ng m�t � th�ng tin cao h�n World Map:

- Sao hi�n t�i, sao l�n c�n v� c�c route c� th� i.
- Sub-location, NPC hi�n di�n, patrol edge, weather, influence v� incident t�i node.
- Fog/visited/locked �p d�ng tr��c khi t�o label ho�c action.
- Travel active/restricted/blocked hi�n th� ngay c�nh route.
- Th�m Hi�m, bulletin, c�ng tr�nh v� thao t�c NPC ph�i m� t� local map m� kh�ng c�n chuy�n tab.
- World Map ch� cung c�p b�i c�nh v) m�; kh�ng ��c ghi � node/region/weather ang hi�n th� � local map.

## Kh�ng gian hi�n th�

- Canvas l�n h�n viewport, c� kho�ng tr�ng c� ch� �ch v� c�m gi�c th� gi�i v� t�n.
- B�n � d�ng n�n tinh v�n xanh en, �nh sao xanh/tr�ng, i�m v�ng cho �a danh quan tr�ng, t�m/� cho v�ng nguy hi�m.
- V�ng ch� l� kh� quy�n/tinh v�n v� c�m sao, kh�ng ph�i khung ch� nh�t hay panel.
- V� tr� ��c bi�u di�n b�ng sao; ng��i ch�i l� sao s�ng nh�t c� qu�ng xung �ng.

## Ch�m sao v� m�c chi ti�t

- Cosmic view: ch� hi�n v�ng l�n v� sao quan tr�ng.
- Region view: hi�n c�m sao, th�nh tr�, t�ng m�n v� route � kh�m ph�.
- Local view: hi�n node, NPC, dungeon v� ��ng g�n.
- Close view: hi�n nh�n, sub-location, NPC v� t��ng t�c chi ti�t.
- Nh�n ch� hi�n khi hover, selected, current, nearby ho�c important.
- Route l� ��ng m�nh, m�, kh�ng mii t�n; gi�m � �u ti�n so v�i sao.

## Discovery/Fog

- Unexplored: sao m�, kh�ng nh�n, route �n.
- Discovered: sao s�ng h�n, route l�n c�n hi�n.
- Visited: marker b�n v�ng v� glow m�nh h�n.
- Locked: sao t�i, route r�t m� v� bi�u t��ng kh�a t�y ng� c�nh.
- Discovery ph�i t�o c�m gi�c t�ng m�nh ch�m sao ��c n�i l�i, kh�ng ph�i m� m�t � l��i.

## Camera v� i�u h��ng

- Zoom in/out, center-on-player, drag-to-pan v� focus m�m tr�n sao ��c ch�n.
- Kh�ng t� �ng fit to�n b� th� gi�i v�o viewport.
- Zoom ph�i c� level-of-detail: xa �n nh�n/route, g�n hi�n chi ti�t.
- Travel v�n d�ng route v� transaction resolver hi�n t�i; giao di�n m�i ch� thay visualization.

## Phenomena v� t��ng t�c

- Weather, influence, faction blockade, patrol, incident v� NPC presence ��c th� hi�n b�ng m�u/glow/icon ph�.
- V�ng Linh Phong, �m Vi, c�m �a v� di t�ch c� c� bi�n th� tinh v�n/��ng �t nh�.
- Ch�n sao m� Current Region View Model, bulletin, weather, NPC, sub-location v� action h�p l�.

## Hi�u nng

- �u ti�n SVG t�i �u ho�c Canvas; decorative stars t�ch kh�i gameplay stars.
- Kh�ng t�o panel DOM n�ng cho m�i �a i�m.
- Ch� render label v� connection theo zoom/fog.

## Ti�u ch� nghi�m thu

- Kh�ng c�n c�m gi�c flowchart ho�c b�ng node-card.
- V�ng hi�n t�i, weather, NPC v� travel kh�p c�ng m�t node/region source.
- Zoom/center ho�t �ng, kh�ng l�m m�t click v�o sao ho�c faction.
- Save ci load nguy�n tr�ng v� t�t c� action/travel ci v�n ch�y.

## UX chi ti�t

### Thanh c�ng c� b�n �

- N�t `>` �a camera v� sao c�a nh�n v�t, reset zoom v� pan.
- N�t `/` thay �i zoom theo b��c 0.2, gi�i h�n 0.72.4 � kh�ng m�t kh� nng �nh h��ng.
- K�o n�n b�ng chu�t/touch � pan; k�o kh�ng ��c k�ch ho�t khi b�t �u tr�n n�t, faction pin ho�c star.
- Hi�n th� tr�ng th�i zoom v� t�a � v�ng trong tooltip h� tr� ng��i ch�i ki�m so�t camera.
- N�t c� `aria-label`, focus-visible v� t��ng ph�n � cho n�n t�i.

### Ph�n h�i khi ch�n sao

- Hover: tng glow, hi�n t�n v� lo�i sao.
- Focus/keyboard: h�nh vi gi�ng hover, Enter m� h� s� v�ng.
- Current star: halo nh�p ch�m, kh�ng nh�p nh�y qu� nhanh g�y m�i m�t.
- Event/war/patrol: d�ng badge nh� ho�c m�u ph�, kh�ng thay �i h�nh d�ng sao qu� m�nh.
- Faction pin v� guild pin m� h� s� ri�ng, kh�ng di chuy�n camera ngo�i � mu�n.

### Level of detail theo zoom

| M�c | Hi�n th� | �n |
|---|---|---|
| 0.71.0 Cosmic | v�ng l�n, sao quan tr�ng, tinh v�n | nh�n th��ng, route xa |
| 1.01.5 Region | c�m ch�m sao, route trong v�ng, faction | chi ti�t sub-location |
| 1.52.0 Local | location � kh�m ph�, NPC/patrol, weather | d� li�u fog ch�a � |
| 2.02.4 Close | nh�n g�n, bulletin, sub-location, action | decorative star kh�ng t��ng t�c |

### Tr�ng th�i travel

- Sao �ch ��c �nh d�u `selected`, route ang i c� glow m�nh v� progress.
- Khi travel active, c�c n�t travel kh�c b� disable v�i l� do r� r�ng.
- Khi b� blockade/restricted/weather hazard, route d�ng m�u c�nh b�o v� tooltip gi�i th�ch nguy�n nh�n.
- Khi �n n�i, camera focus m�m v�o sao m�i, fog tng theo contract v� log ghi node/region/weather.

### T��ng t�c v�i NPC

- Sao location c� NPC hi�n di�n d�ng halo nh�; s� NPC kh�ng thay th� t�n location.
- Hover/close view hi�n th� NPC ang � node/sub-location, schedule, faction v� ph�n �ng weather.
- NPC patrol hi�n th� icon tr�n constellation edge; NPC d�n ��ng m� nhanh action Th�m Hi�m.
- Encounter/incident t�o pulse m�u cam/� trong th�i gian h�u h�n; click m� l�a ch�n, kh�ng t� th�c hi�n action.

### Kh� nng �c v� hi�u nng

- Kh�ng d�ng m�u l� t�n hi�u duy nh�t: lu�n k�t h�p glow, icon, nh�n ho�c tooltip.
- Decorative star ph�i n�m l�p ri�ng v�i gameplay star � kh�ng ch�n click.
- Khi h�n 500 location, ch� render star trong viewport c�ng v�ng �m; route xa chuy�n sang batch SVG/Canvas.
- Debounce camera update v� kh�ng render l�i to�n b� panel khi ch� thay �i pan.
- B�n � ph�i ho�t �ng � m�n h�nh nh�: controls c� �nh g�c, star label kh�ng tr�n viewport.

## Marker b�t bu�c tr�n Khu v�c hi�n t�i

- `_ NPC`: t�ng h�p NPC static v� NPC runtime ang s�ng t�i node, ch� hi�n t� Fog 2.
- `  Qu�i`: qu�i/�ch ��c �nh ngh)a t�i node v� combat ang di�n ra � node hi�n t�i.
- `& C� duy�n`: pending contested opportunity t�i �ng node, c� glow t�m v� kh�ng hi�n th� sang node kh�c.
- `=� Tu�n tra`: marker n�m tr�n edge m� patrol NPC th�c s� ang di chuy�n.
- Marker l� l�p ph�, kh�ng che sao; tooltip ph�i ghi s� l��ng v� tr�ng th�i.
- Khi �i node, marker ph�i t�nh l�i t� `state.locationId`, `npcState`, `pendingContestedOpportunity` v� fog m�i; kh�ng d�ng cache UI ci.
## Ch�nh s�ch b�n � m� (Open Node Graph)

- Kh�ng render ��ng n�i gi�a c�c node; m�i node h�p l� l� i�m �n tr�c ti�p.
- Kh�ng hi�n th� Ch�a th�m hi�m ho�c m�u � Nguy hi�m; d�ng marker NPC, qu�i v� c� duy�n.
- Node sao t� ch�c lu�n enabled, c� sao ti�p c�n ph�.
- Node v�a kh�m ph� ��c ghi v�o `visitedLocations` v� hi�n th� tr�n V�n Gi�i.
