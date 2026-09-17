# Map V2  Weather Integration Trace

## Ph�m vi

T�i li�u n�y truy v�t ph�n th�i ti�t ��c tri�n khai t� m�c 10 c�a `MAP_SYSTEM_V2_COMPLETE.md`.

## Contract � tri�n khai

- B�y tr�ng th�i th�i ti�t: `quang`, `mua`, `suong`, `loi_vu`, `linh_phong`, `tuyet`, `am_vu`.
- Weather lan truy�n theo tuy�n v�ng l�n c�n, c� bias t� th�i ti�t nghi�m tr�ng c�a v�ng k� b�n.
- Th�i ti�t gi� �n �nh theo `weatherUntilDay`, kh�ng reroll m�i frame.
- M�a tng nguy c� v� gi�m t�c �; tuy�t gi�m t�c � m�nh; l�i vi ch�n ng� kh�; �m vi tng hao t�n v� nguy c�.
- Th�i ti�t ��c �a v�o travel preview, world modifier, NPC reaction v� structured game log.
- Khi th�i ti�t v�ng hi�n t�i �i, log ghi l�i tr�ng th�i tr��c/sau v� metadata node, v�ng, NPC, fog.

## API trace

| API | Vai tr� |
|---|---|
| `setWeather` | �p th�i ti�t c� th�i h�n |
| `updateWeather` | Sinh th�i ti�t deterministic theo v�ng v� l�ng gi�ng |
| `worldModifierPreview` | Tr� modifier chi�n �u/di chuy�n/t�m c�nh |
| `travelPreview` | T�nh t�c �, s� ng�y, risk theo th�i ti�t |
| `npcWeatherPreview` | D� b�o ph�n �ng NPC |
| `resolveNpcWeatherReaction` | Commit tr� �n/l�ch tr�nh/mood |
| `getCurrentRegionViewModel` | Cung c�p weather cho UI Map |
| `pushHistory/createGameEvent` | Ghi weather, node, NPC, fog v�o log |

## Acceptance

1. C�ng seed, c�ng ng�y v� topology cho c�ng th�i ti�t.
2. V�ng k� B�o Linh Kh�/�m Vi c� x�c su�t nh�n weather t��ng �ng cao h�n.
3. Ng� kh� b� t� ch�i khi c� B�o Linh Kh�.
4. Tuy�t v� M�a l�m thay �i travel days/risk.
5. Weather transition t�i node ng��i ch�i t�o log structured, kh�ng t�o log l�p trong c�ng tick.
6. UI kh�ng hi�n th� `undefined` khi region thi�u `description`; d�ng `desc` ho�c t�n v�ng.
