# Quy�t �nh ho�n thi�n contract Expansion

T�i li�u n�y ghi l�i c�c quy�t �nh thi�t k� ��c ph�p suy di�n khi SPEC kh�ng kh�a m�t tr� s� ho�c catalog c� th�. N� l� ph�n b� sung cho `SPEC_HE_THONG_TINH_NANG_MOI_TOAN_BO.md`, kh�ng thay �i c�c invariant b�t bu�c trong SPEC.

## Quy�t �nh chung

- T�t c� th�i h�n d�ng `gameClock.dayIndex`/`absoluteDay`; kh�ng d�ng th�i gian m�y � gi�i quy�t gameplay.
- M�i k�t qu� ng�u nhi�n c�a world simulation ��c l�y t� seed l�u trong save, `systemId`, ng�y v� ordinal. G�i l�i c�ng state kh�ng sinh reward ho�c task l�n hai.
- Catch-up d�i ch� m� ph�ng chi ti�t 30 ng�y cu�i. Giai o�n aggregate ch� thay �i state th� gi�i, kh�ng t� th�ng combat, nh�n loot, ho�n th�nh action c�n l�a ch�n ho�c l�m ch�t NPC do ng��i ch�i ch�a g�p.
- D� li�u �ng (�i th� �i h�i, can thi�p chi�n tranh, node b� c�nh) n�m trong runtime/save; catalog t)nh kh�ng b� s�a b�i tick.

## Gameplay ��c suy di�n

- `Y�u Th� D� Bi�n` l� l�t ch�i capture/companion MVP v� ��c �nh d�u r� `capturable:true`, `beast:true`. C�c monster kh�c kh�ng t� �ng b�t s�ng ��c.
- V�t ph�m th�c t�nh ch�n template theo lo�i equipment, curse v� th�nh t�ch chi�n �u. Template lu�n hi�n th� boon/tradeoff tr��c confirm.
- Thi�n ki�p lu�n c� ph��ng �n t�i nguy�n ph� qu�t v� t�i a hai ph��ng �n i�u ki�n theo M�nh, neo nh�n t�nh, c�ng ph�p, chi�n s�, event ho�c t�m c�nh.
- �i h�i l� ba tr�n combat th�t, kh�ng ph�i m�t l�n roll. Can thi�p chi�n tranh cing ch� tng i�m sau khi tr�n combat sinh �ng k�t th�c b�ng chi�n th�ng.
- B� c�nh ch� ghi nh�n khi ng��i ch�i � quan s�t/m�; phe NPC ch� c� th� c�nh tranh sau m�c �.

## Ranh gi�i UI

- Th� s� hi�n th� event, diplomacy/war front, th�i ti�t/m�a v� c� h�i tranh o�t.
- Nhi�m v� nh�m quest, contract, event v� trial theo game-day expiry.
- C�nh gi�i hi�n th� l�a ch�n thi�n ki�p ang ch�; inventory hi�n th� n�t th�c t�nh ch� khi preview h�p l�.
- D� li�u b� m�t nh� RNG roll v� th�ng tin NPC ngo�i allowlist kh�ng ��c render ra UI.

## C�ng ki�m th�

- `node tools/verify_game.js`: invariant v� DOM regression.
- `node tools/verify_expansion_stress.js --runs=1000 --days=1000`: determinism, gi�i h�n state v� kh�ng ph�t sinh reward offline.

