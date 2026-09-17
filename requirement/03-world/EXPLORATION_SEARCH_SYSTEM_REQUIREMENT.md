# EXPLORATION SEARCH SYSTEM REQUIREMENT

## 1. M�c ti�u

Thay th� m� h�nh b�m T�m ki�m m�t l�n b�ng h� th�ng **Th�m Hi�m** c� phi�n, l�a ch�n v� h�u qu�. Th�m Hi�m bao ph� to�n b� v�ng �i: chu�n b�, d� t�m, ph�t hi�n, i�u tra, thu th�p, b� qua, r�t lui v� quay l�i.

## 2. Nguy�n t�c d� li�u

- M�i node c� m�t `explorationSite`: `depth`, `maxDepth`, `recoverAtTurn`, `chainStage`, `sessions`, `lastSearchedTurn`.
- M�i phi�n t�o `pendingExploration` (t��ng th�ch ng��c v�i `pendingSearch`) g�m `nodeId`, `findings`, `risk`, `weather`, `npcAssistId`, `createdTurn`, `expiresTurn`.
- T�i nguy�n th��ng v� v�t ph�m hi�m ��c t� �ng nh�p kho ngay khi phi�n d� x�c nh�n ph�t hi�n; b�n ghi v�n gi� l�i � trace. Ng��i ch�i ch� ph�i quy�t �nh v�i d�u v�t/c� duy�n v� c� th� ch� �ng B� Qua.
- M�i l�a ch�n c� `success`, `reason`, `data`, idempotency key v� ghi log c� node, v�ng, th�i ti�t, NPC li�n quan.

## 3. V�ng �i phi�n

1. **Chu�n b�**: ki�m tra ang giao chi�n, ang di chuy�n, gi� ho�t �ng, th� l�c, fog v� depth.
2. **D� t�m**: nhi�u l��t d� t�y depth; k�t qu� ch�u �nh h��ng MAG, Ng� t�nh, May m�n, ngh�, th�i ti�t, �a h�nh, influence v� nguy hi�m node.
3. **Ph�n lo�i ph�t hi�n**:
   - t�i nguy�n th��ng;
   - t�i nguy�n hi�m/v�t ph�m t�o ng�u nhi�n;
   - d�u v�t th�ng tin m� chu�i;
   - cu�c g�p NPC ho�c ph�c k�ch;
   - c�ng tr�nh, ��ng t�t, m�t �a.
4. **X� l�**:
   - Thu Th�p: x� l� c�c ph�t hi�n �c bi�t ch�a t� thu gom (t��ng th�ch save ci);
   - i�u Tra: tng chain stage, m� manh m�i ho�c node runtime;
   - Nh� NPC D�n D�u: tng � an to�n, quan h� v� th�ng tin, y�u c�u NPC hi�n di�n;
   - B� Qua: x�a ph�t hi�n, ghi nh�n c� h�i th�t l�c, kh�ng nh�n th��ng.
5. **K�t th�c**: pending ph�i ��c i�u tra ho�c b� qua tr��c phi�n k� ti�p; t�i nguy�n � t� thu gom kh�ng t�o n�t nh�n l�n hai. R�i node t� �ng �nh d�u ph�t hi�n ch�a x� l� l� th�t l�c.

## 4. T��ng t�c Map/NPC/Weather

- NPC t�i c�ng node/sub-location c� th� l�m ng��i d�n ��ng, ng��i tranh o�t, ng��i trao �i ho�c nh�n ch�ng.
- NPC h� tr� t�o `npcAssistId`, tng Trust/Respect v� gi�m risk cho l�n thu th�p; kh�ng ��c h� tr� n�u NPC v�ng m�t.
- M�a/s��ng gi�m hi�u qu� d�; Tuy�t tng chi ph� th�i gian; Linh Phong c� th� kh�a Ng� Kh�; �m Vi tng nguy c� ph�c k�ch nh�ng tng c� h�i d�u v�t t� �o.
- Influence `stable/contested/frontier` i�u ch�nh b�ng t�i nguy�n v� t� l� g�p faction patrol.
- Fog th�p ch� cho ph�p tin �n; ph�t hi�n chi ti�t v� NPC hi�n di�n ch� hi�n th� khi � fog.

## 5. T�i nguy�n v� ph�n th��ng

- M�i phi�n lu�n c� ph�n th��ng n�n nh� (Linh Th�ch ho�c t�i nguy�n node) n�u kh�ng b� gi�n o�n.
- T�i nguy�n hi�m c� c�p ph�m, ngu�n, ng�y ph�t hi�n v� node ngu�n � trace.
- Chain stage 13 m� reward ri�ng: v�t ph�m, C�ng �c, M�nh S� ho�c node runtime.
- Thu Th�p ph�i idempotent; kh�ng th� nh�n hai l�n c�ng `session`/`findingId`.

## 6. UI/UX

- Action ch�nh: `Th�m Hi�m � N l��t d�`.
- Khi c� pending: `Thu Th�p Ph�t Hi�n`, `i�u Tra D�u V�t`, `Nh� NPC D�n D�u`, `B� Qua Ph�t Hi�n`.
- Hi�n th� depth, risk, weather modifier, NPC ang hi�n di�n, s� ph�t hi�n theo lo�i v� th�i h�n x� l�.
- Log ph�i n�i r�: node, v�ng, th�i ti�t, NPC h� tr�/tranh o�t v� ph�n th��ng th�c nh�n.

## 7. Ki�m th� b�t bu�c

- Kh�ng th� b�t �u khi ang combat ho�c travel active.
- Pending ch�n phi�n m�i.
- Thu th�p/b� qua/i�u tra ch�y �ng m�t l�n.
- NPC v�ng m�t b� t� ch�i h� tr�.
- Weather v� influence l�m thay �i risk/reward.
- R�i node l�m pending th�t l�c, kh�ng t�o v�t ph�m.
- Save/load gi� nguy�n site, pending, chain stage v� l�ch s�.
