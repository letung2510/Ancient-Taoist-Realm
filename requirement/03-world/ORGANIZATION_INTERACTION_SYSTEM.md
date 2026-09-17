# H� th�ng t��ng t�c t� ch�c

## M�c ti�u

M�i t�ng m�n, th� gia, th��ng h�i, v��ng tri�u, li�n minh v� t� ch�c b� m�t ph�i l� t�c nh�n c� quan h�, t�i nguy�n, ch�nh s�ch v� ph�n �ng; kh�ng ch� l� d� li�u � hi�n th� ho�c i�u ki�n gia nh�p.

## Canonical organization model

```js
organizationState: {
  version: 1,
  relations: {
    [organizationId]: {
      reputation: -100..100,
      favor: 0..100,
      trust: 0..100,
      heat: 0..100,
      status: "neutral|friendly|allied|distrusted|hostile",
      servicesUnlocked: [],
      lastInteractionDay: 0
    }
  },
  activeRequests: {},
  history: []
}
```

`organizationId` l� ID canonical c�a `GUILDS` ho�c `WORLD_MAP.factions`; kh�ng t�o b�n sao cho c�ng m�t t� ch�c. Guild membership ch� l� tr�ng th�i th�nh vi�n, c�n relation l� quan h� x� h�i �c l�p.

## Interaction contract

```js
organizationSnapshot(state, organizationId)
organizationInteract(state, organizationId, action, amount)
```

Actions chu�n:

- `status`: xem snapshot, kh�ng mutate.
- `donate`: tr� Linh Th�ch, tng reputation/favor v� t�i nguy�n t� ch�c.
- `request_aid`: ti�u Favor, nh�n v�t ph�m ho�c h� tr�.
- `commission`: t�o request tr� qua world tick.
- `share_intel`: g�i t�nh b�o � x�c minh, tng trust/reputation.
- `mediate`: tng stability/power faction khi � reputation.

M�i t� ch�c ch� nh�n m�t interaction mutate m�i ng�y, tr� `request_aid`. T�t c� k�t qu� tr� `{ success, reason, data }`.

## Cross-system effects

- Reputation m� kh�a rumor, discount v� reinforcement.
- Favor ��c d�ng cho vi�n tr�, escort, fast travel ho�c guild project.
- Heat cao l�m t� ch�c hostile, tng patrol v� faction blockade.
- Donation/commission c�p nh�t faction resources v� map influence.
- Mediation c�p nh�t diplomacy/stability/war readiness.
- Guild project, tournament, contracts v� NPC reaction �c c�ng relation state.
- Bulletin hi�n th� tin theo faction owner v� reputation c�a player.

## Data authoring rules

M�i organization definition ch� khai b�o m�t l�n: identity, alignment, region, traits, services, node detail profile. Runtime ch� gi� reference `organizationId`; kh�ng copy to�n b� catalog v�o save.

## Acceptance

- T�t c� guild/faction �u c� relation record sau migration.
- Donate, aid, commission, intel v� mediation c� t�c �ng state o ��c.
- Request ��c resolve idempotent � world tick.
- Relation kh�ng b� m�t khi r�i guild ho�c reload save.
- Kh�ng c� organization ID tr�ng canonical catalog.
