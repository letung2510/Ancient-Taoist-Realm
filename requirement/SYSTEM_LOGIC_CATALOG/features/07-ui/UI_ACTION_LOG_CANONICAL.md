# UI ACTION LOG CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\03-world\ORGANIZATION_INTERACTION_SYSTEM.md`

# H[encoding-loss] th[encoding-loss]ng t[encoding-loss][encoding-loss]ng t[encoding-loss]c t[encoding-loss] ch[encoding-loss]c

## M[encoding-loss]c ti[encoding-loss]u

M[encoding-loss]i t[encoding-loss]ng m[encoding-loss]n, th[encoding-loss] gia, th[encoding-loss][encoding-loss]ng h[encoding-loss]i, v[encoding-loss][encoding-loss]ng tri[encoding-loss]u, li[encoding-loss]n minh v[encoding-loss] t[encoding-loss] ch[encoding-loss]c b[encoding-loss] m[encoding-loss]t ph[encoding-loss]i l[encoding-loss] t[encoding-loss]c nh[encoding-loss]n c[encoding-loss] quan h[encoding-loss], t[encoding-loss]i nguy[encoding-loss]n, ch[encoding-loss]nh s[encoding-loss]ch v[encoding-loss] ph[encoding-loss]n [encoding-loss]ng; kh[encoding-loss]ng ch[encoding-loss] l[encoding-loss] d[encoding-loss] li[encoding-loss]u [encoding-loss] hi[encoding-loss]n th[encoding-loss] ho[encoding-loss]c i[encoding-loss]u ki[encoding-loss]n gia nh[encoding-loss]p.

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

`organizationId` l[encoding-loss] ID canonical c[encoding-loss]a `GUILDS` ho[encoding-loss]c `WORLD_MAP.factions`; kh[encoding-loss]ng t[encoding-loss]o b[encoding-loss]n sao cho c[encoding-loss]ng m[encoding-loss]t t[encoding-loss] ch[encoding-loss]c. Guild membership ch[encoding-loss] l[encoding-loss] tr[encoding-loss]ng th[encoding-loss]i th[encoding-loss]nh vi[encoding-loss]n, c[encoding-loss]n relation l[encoding-loss] quan h[encoding-loss] x[encoding-loss] h[encoding-loss]i [encoding-loss]c l[encoding-loss]p.

## Interaction contract

```js
organizationSnapshot(state, organizationId)
organizationInteract(state, organizationId, action, amount)
```

Actions chu[encoding-loss]n:

- `status`: xem snapshot, kh[encoding-loss]ng mutate.
- `donate`: tr[encoding-loss] Linh Th[encoding-loss]ch, tng reputation/favor v[encoding-loss] t[encoding-loss]i nguy[encoding-loss]n t[encoding-loss] ch[encoding-loss]c.
- `request_aid`: ti[encoding-loss]u Favor, nh[encoding-loss]n v[encoding-loss]t ph[encoding-loss]m ho[encoding-loss]c h[encoding-loss] tr[encoding-loss].
- `commission`: t[encoding-loss]o request tr[encoding-loss] qua world tick.
- `share_intel`: g[encoding-loss]i t[encoding-loss]nh b[encoding-loss]o [encoding-loss] x[encoding-loss]c minh, tng trust/reputation.
- `mediate`: tng stability/power faction khi [encoding-loss] reputation.

M[encoding-loss]i t[encoding-loss] ch[encoding-loss]c ch[encoding-loss] nh[encoding-loss]n m[encoding-loss]t interaction mutate m[encoding-loss]i ng[encoding-loss]y, tr[encoding-loss] `request_aid`. T[encoding-loss]t c[encoding-loss] k[encoding-loss]t qu[encoding-loss] tr[encoding-loss] `{ success, reason, data }`.

## Cross-system effects

- Reputation m[encoding-loss] kh[encoding-loss]a rumor, discount v[encoding-loss] reinforcement.
- Favor [encoding-loss][encoding-loss]c d[encoding-loss]ng cho vi[encoding-loss]n tr[encoding-loss], escort, fast travel ho[encoding-loss]c guild project.
- Heat cao l[encoding-loss]m t[encoding-loss] ch[encoding-loss]c hostile, tng patrol v[encoding-loss] faction blockade.
- Donation/commission c[encoding-loss]p nh[encoding-loss]t faction resources v[encoding-loss] map influence.
- Mediation c[encoding-loss]p nh[encoding-loss]t diplomacy/stability/war readiness.
- Guild project, tournament, contracts v[encoding-loss] NPC reaction [encoding-loss]c c[encoding-loss]ng relation state.
- Bulletin hi[encoding-loss]n th[encoding-loss] tin theo faction owner v[encoding-loss] reputation c[encoding-loss]a player.

## Data authoring rules

M[encoding-loss]i organization definition ch[encoding-loss] khai b[encoding-loss]o m[encoding-loss]t l[encoding-loss]n: identity, alignment, region, traits, services, node detail profile. Runtime ch[encoding-loss] gi[encoding-loss] reference `organizationId`; kh[encoding-loss]ng copy to[encoding-loss]n b[encoding-loss] catalog v[encoding-loss]o save.

## Acceptance

- T[encoding-loss]t c[encoding-loss] guild/faction [encoding-loss]u c[encoding-loss] relation record sau migration.
- Donate, aid, commission, intel v[encoding-loss] mediation c[encoding-loss] t[encoding-loss]c [encoding-loss]ng state o [encoding-loss][encoding-loss]c.
- Request [encoding-loss][encoding-loss]c resolve idempotent [encoding-loss] world tick.
- Relation kh[encoding-loss]ng b[encoding-loss] m[encoding-loss]t khi r[encoding-loss]i guild ho[encoding-loss]c reload save.
- Kh[encoding-loss]ng c[encoding-loss] organization ID tr[encoding-loss]ng canonical catalog.


### Source: `archive-requirements\logic-history\03-world\STRUCTURE_RUNTIME_CATALOG_SINGLE_SOURCE_2026-09-17.md`

# Structure runtime uses catalog as single source

Build, repair, upgrade and dismantle must read `STRUCTURE_CATALOG`, never duplicate costs or caps in action code.

- build: `buildCost`;
- repair: `repairDivisor`;
- upgrade: `upgradeBase`, `maxLevel`, `chargesPerUpgrade` and per-upgrade effects;
- dismantle: `refundRate`.

The structure DTO persists type, level, integrity, status, owner and effects. Catalog effects are merged on build; active structure effects alone enter influence/ward resolvers. Any catalog balance change therefore applies consistently to runtime, UI preview and save-loaded structures.

## Regression

Build/repair/upgrade/dismantle tests must compare resource deltas to catalog values and preserve influence invalidation.

## Chưa hoàn thiện

Numeric balance still requires playtest; the duplication bug between catalog and action code is removed.


### Source: `archive-requirements\logic-history\03-world\WORLD_CATALOG_BALANCE_VALIDATION_2026-09-17.md`

# World Catalog Balance Validation — 2026-09-17

`validateWorldCatalogs()` là invariant runtime cho các catalog ảnh hưởng trực
tiếp đến Map V2:

- weather phải có severity `0..5`, duration dương và transition chỉ trỏ tới
  weather tồn tại;
- recipe phải có profession, output, material/cost không âm và hữu hạn;
- Công Trình phải giữ đủ bốn loại canonical với cost dương; Hộ Giới Đại Trận
  có SAN protection dương, influence dương và không vượt trần `0.75` sau upgrade.

Regression nằm trong `tools/verify_dichi_deep.js`, chạy cùng map structure,
weather, Path fusion và Dị Thể contract. Đây là catalog/balance gate; cân bằng
thực nghiệm trên browser vẫn là gate riêng.


### Source: `archive-requirements\logic-history\05-ui\UI_SYSTEM_CONSOLIDATED_REQUIREMENTS.md`

# UI System Consolidated Requirements

## 1. M[encoding-loss]c [encoding-loss]ch v[encoding-loss] ngu[encoding-loss]n

T[encoding-loss]i li[encoding-loss]u n[encoding-loss]y l[encoding-loss] b[encoding-loss]n canonical h[encoding-loss]p nh[encoding-loss]t c[encoding-loss]c y[encoding-loss]u c[encoding-loss]u trong `requirement/05-ui`, chia theo subsystem/function.

Ngu[encoding-loss]n [encoding-loss] h[encoding-loss]p nh[encoding-loss]t: `GAME_CLOCK_DUAL_TIMELINE_DESIGN.md`, `GAME_CLOCK_TIMESTAMP_AUDIT_REVIEW.md`, `ANCIENT_TAOIST_REALM_GAME_LOG_SYSTEM.md`, `ACTION_HYBRID_SYSTEM.md`, `UI_LAYOUT_AND_ACTION_TABLE_REQUIREMENTS.md`, `UI_LAYOUT_REQUIREMENT_KEEP_STRUCTURE_ADJUST_WIDTH.md`, `SPEC_FIX_HE_THONG_NGON_NGU_VA_BO_TRI_FEATURE.md`.

[encoding-loss]u ti[encoding-loss]n: engine/state contract > save compatibility/determinism > Player Log contract > presentation. Presentation kh[encoding-loss]ng t[encoding-loss] [encoding-loss] thay [encoding-loss]i mechanics.

## 2. Clock v[encoding-loss] timestamp subsystem

### 2.1 Contract

`gameClock` l[encoding-loss] ngu[encoding-loss]n s[encoding-loss] th[encoding-loss]t duy nh[encoding-loss]t v[encoding-loss] c[encoding-loss] hai g[encoding-loss]c nh[encoding-loss]n t[encoding-loss] c[encoding-loss]ng m[encoding-loss]t engine:

```text
advanceGameTime(state, days)
  [encoding-loss] Player Clock ti[encoding-loss]n
  [encoding-loss] World Clock ti[encoding-loss]n c[encoding-loss]ng s[encoding-loss] ng[encoding-loss]y
  [encoding-loss] daily mechanics ch[encoding-loss]y m[encoding-loss]t l[encoding-loss]n cho t[encoding-loss]ng ng[encoding-loss]y ho[encoding-loss]n t[encoding-loss]t
```

Player Clock hi[encoding-loss]n t[encoding-loss]i v[encoding-loss]n l[encoding-loss] canonical trong phase compatibility:

```text
gameClock.currentYear/currentMonth/currentDay/dayProgress
gameClock.eraIndex/currentEra
```

Quy t[encoding-loss]c:

- 30 gi[encoding-loss]y th[encoding-loss]c = 1 ng[encoding-loss]y game.
- 30 ng[encoding-loss]y = 1 th[encoding-loss]ng; 12 th[encoding-loss]ng = 1 nm; 360 ng[encoding-loss]y = 1 nm.
- `dayProgress` gi[encoding-loss] ph[encoding-loss]n ng[encoding-loss]y l[encoding-loss].
- `gameDayIndex = (year - 1) [encoding-loss] 360 + (month - 1) [encoding-loss] 30 + day`.
- Player Day Index 1-based; ng[encoding-loss]y [encoding-loss]u ti[encoding-loss]n l[encoding-loss] index 1.
- `playerElapsedWholeDays = playerDayIndex - 1`.

World Clock d[encoding-loss]ng index zero-based:

```text
worldDayIndex = world.startDayIndex + (playerDayIndex - 1)
worldYear = floor(worldDayIndex / 360)
worldMonth = floor((worldDayIndex % 360) / 30) + 1
worldDay = (worldDayIndex % 30) + 1
```

`worldDayIndex = 0` l[encoding-loss] Nm 0, Th[encoding-loss]ng 1 ng[encoding-loss]y 1 t[encoding-loss]i `world.epochDate`. V[encoding-loss] d[encoding-loss] `2,475,360` l[encoding-loss] Nm 6876, Th[encoding-loss]ng 1 ng[encoding-loss]y 1. `epochDate` l[encoding-loss] lore date, kh[encoding-loss]ng ph[encoding-loss]i `Date.now()`.

### 2.2 Data contract

```js
gameClock: {
  schemaVersion: 4,
  currentYear: 1,
  currentMonth: 1,
  currentDay: 1,
  dayProgress: 0,
  eraIndex: 1,
  currentEra: "K[encoding-loss] Nguy[encoding-loss]n Linh Kh[encoding-loss] D[encoding-loss] Bi[encoding-loss]n",
  realTimeToGameTimeRatio: 1 / 30,
  timeScaleVersion: 3,
  lastRealTimestamp: 0,
  world: {
    epochDate: "2026-08-15",
    epochLabel: "M[encoding-loss]c Linh kh[encoding-loss] suy ki[encoding-loss]t",
    startDayIndex: 2475360,
    currentDayIndex: 2475360,
    currentYear: 6876,
    currentMonth: 1,
    currentDay: 1,
    currentEra: "K[encoding-loss] Nguy[encoding-loss]n Linh Kh[encoding-loss] Suy Ki[encoding-loss]t",
    eraId: "linh_khi_suy_kiet"
  }
}
```

`world.current*` l[encoding-loss] cache; `world.startDayIndex` v[encoding-loss] Player Clock l[encoding-loss] ngu[encoding-loss]n [encoding-loss] t[encoding-loss]nh l[encoding-loss]i. Kh[encoding-loss]ng t[encoding-loss]o th[encoding-loss]m `gameClock.player.current*` trong phase [encoding-loss]u v[encoding-loss] s[encoding-loss] t[encoding-loss]o duplicate source-of-truth.

### 2.3 Function rules

- `ensureGameClock(state)`: normalize/migrate, t[encoding-loss]o world clock, refresh cache; kh[encoding-loss]ng advance v[encoding-loss] kh[encoding-loss]ng h[encoding-loss]i t[encoding-loss] tu[encoding-loss]i/th[encoding-loss].
- `gameDayIndex()`/`playerDayIndex()`: Player ordinal 1-based, gi[encoding-loss] semantics ci.
- `worldDayIndex()`/`worldClockLabel()`: World ordinal/label zero-based.
- `clockLabel()`: ti[encoding-loss]p t[encoding-loss]c tr[encoding-loss] Player Clock [encoding-loss] gi[encoding-loss] Player Log.
- `advanceGameTime()`: c[encoding-loss]p nh[encoding-loss]t hai clock trong m[encoding-loss]t transaction; nhi[encoding-loss]u ng[encoding-loss]y ph[encoding-loss]i x[encoding-loss] l[encoding-loss] tu[encoding-loss]n t[encoding-loss].
- `onGameYearPass()`: ch[encoding-loss] ch[encoding-loss]y khi Player Clock qua nm; tng tu[encoding-loss]i, gi[encoding-loss]m th[encoding-loss] nguy[encoding-loss]n, x[encoding-loss] l[encoding-loss] Lu[encoding-loss]n H[encoding-loss]i.
- `applyOfflineProgress()`: d[encoding-loss]ng `lastRealTimestamp`, g[encoding-loss]i c[encoding-loss]ng advance pipeline, suppress history, kh[encoding-loss]ng t[encoding-loss]o fake event.
- Player Clock kh[encoding-loss]ng reset khi Lu[encoding-loss]n H[encoding-loss]i. Tu[encoding-loss]i t[encoding-loss]ng [encoding-loss]i n[encoding-loss]u c[encoding-loss]n ph[encoding-loss]i d[encoding-loss]ng `lifeClock` ri[encoding-loss]ng.

### 2.4 Mechanics mapping

| Function/subsystem | Ordinal/clock |
|---|---|
| Tu[encoding-loss]i, th[encoding-loss] nguy[encoding-loss]n, Lu[encoding-loss]n H[encoding-loss]i | Player Clock |
| M[encoding-loss]nh S[encoding-loss] cooldown/reward | Player Day Index |
| Travel/weather/NPC/quest/incident | Player Day + current node |
| Expansion `absoluteDay()` | Player Day Index 1-based |
| World simulation hi[encoding-loss]n t[encoding-loss]i | Player Day Index 1-based |
| Lore display | World Clock |
| Player Log | Player Clock |
| Audit/System Log | ISO + Player/World snapshot |

Kh[encoding-loss]ng [encoding-loss]i `expansion.absoluteDay()` sang World Day. N[encoding-loss]u c[encoding-loss]n, th[encoding-loss]m `absoluteWorldDay()` ri[encoding-loss]ng.

### 2.5 Offline, wrapper v[encoding-loss] determinism

- `lastRealTimestamp` ch[encoding-loss] l[encoding-loss] technical timestamp.
- New save d[encoding-loss]ng world start t[encoding-loss] lore config; save ci d[encoding-loss]ng `LEGACY_WORLD_START_DAY_INDEX` c[encoding-loss] [encoding-loss]nh.
- Kh[encoding-loss]ng l[encoding-loss]y `createdAt`, `savedAt`, timezone ho[encoding-loss]c th[encoding-loss]i i[encoding-loss]m load l[encoding-loss]m lore date.
- Expansion wrapper hi[encoding-loss]n g[encoding-loss]i `original.advanceGameTime()` r[encoding-loss]i `simulateWorldUntil()`; wrapper l[encoding-loss] owner world simulation. Core kh[encoding-loss]ng [encoding-loss][encoding-loss]c th[encoding-loss]m tick th[encoding-loss] hai.
- `deserialize()` c[encoding-loss] engine offline progress v[encoding-loss] expansion simulation; ph[encoding-loss]i b[encoding-loss]o [encoding-loss]m m[encoding-loss]i l[encoding-loss]n load ch[encoding-loss] c[encoding-loss] m[encoding-loss]t offline advance v[encoding-loss] m[encoding-loss]t simulation range.
- Seed hi[encoding-loss]n d[encoding-loss]ng Player Day; kh[encoding-loss]ng [encoding-loss]i sang World Day [encoding-loss]m th[encoding-loss]m v[encoding-loss] s[encoding-loss] ph[encoding-loss] replay.
- C[encoding-loss]c field `lastProcessedDay`, `dueDay`, `createdDay`, `resolvedDay`, `generatedDay`, `expiresDay`, `startDay` ph[encoding-loss]i ph[encoding-loss]n lo[encoding-loss]i ri[encoding-loss]ng tr[encoding-loss][encoding-loss]c migration.

### 2.6 Timestamp/event

Event snapshot g[encoding-loss]m `clock`, `worldClock`, `timestamp`, `playerDayIndex`, `worldDayIndex`, `sceneId`, location/node/weather context, result v[encoding-loss] changes.

Player Log:

```text
[Nm 1, Th[encoding-loss]ng 1 ng[encoding-loss]y 10 [encoding-loss] K[encoding-loss] Nguy[encoding-loss]n Linh Kh[encoding-loss] D[encoding-loss] Bi[encoding-loss]n]

N[encoding-loss]i dung scene.
```

Kh[encoding-loss]ng d[encoding-loss]ng `[clock]: n[encoding-loss]i dung`. Event c[encoding-loss]ng `sceneId + clock + locationId` d[encoding-loss]ng m[encoding-loss]t heading; kh[encoding-loss]c ng[encoding-loss]y/node/weather/reason m[encoding-loss] scene m[encoding-loss]i. Command echo, debug v[encoding-loss] error kh[encoding-loss]ng v[encoding-loss]o Player Log. `renderScene()` [encoding-loss]u ti[encoding-loss]n `sceneId`.

## 3. Game Log v[encoding-loss] Narrative subsystem

### 3.1 Ba l[encoding-loss]p

1. System Log: debug/audit/error/command echo.
2. Game Log: structured mechanics event.
3. Narrative Log: prose ng[encoding-loss][encoding-loss]i ch[encoding-loss]i [encoding-loss]c.

Mechanics data kh[encoding-loss]ng tr[encoding-loss]n v[encoding-loss]o prose. Render history d[encoding-loss]ng snapshot ci, kh[encoding-loss]ng [encoding-loss]c clock hi[encoding-loss]n t[encoding-loss]i [encoding-loss] ghi [encoding-loss].

### 3.2 Event types v[encoding-loss] importance

Event ch[encoding-loss]nh: `CULTIVATION`, `REST`, `BREAKTHROUGH`, `COMBAT`, `LOOT`, `EXPLORE`, `TRAVEL`, `TALK`, `WORLD_EVENT`, `SYSTEM`.

Importance: `TRACE`, `NORMAL`, `IMPORTANT`, `RARE`, `LEGENDARY`, `MYTHIC`. Importance quy[encoding-loss]t [encoding-loss]nh [encoding-loss] d[encoding-loss]i/visibility narrative, kh[encoding-loss]ng [encoding-loss]i mechanics.

### 3.3 Template/context

Template ch[encoding-loss]n theo type/importance/context. Context c[encoding-loss] player, realm, cultivation, clock, world clock, location, weather, NPC, faction, combat, loot v[encoding-loss] result. Fallback ph[encoding-loss]i an to[encoding-loss]n, kh[encoding-loss]ng l[encoding-loss] raw ID/`undefined`/m[encoding-loss] l[encoding-loss]i.

Compact d[encoding-loss]ng cho event l[encoding-loss]p; Short cho event quan tr[encoding-loss]ng; Extended cho breakthrough/world/hidden/milestone. Recent narrative ch[encoding-loss]ng l[encoding-loss]p nh[encoding-loss]ng ph[encoding-loss]i deterministic v[encoding-loss] mechanics.

Combat [encoding-loss][encoding-loss]c compression v[encoding-loss]a [encoding-loss]; exploration/NPC/world/hidden event kh[encoding-loss]ng [encoding-loss][encoding-loss]c l[encoding-loss] th[encoding-loss]ng tin ch[encoding-loss]a unlock. AI ch[encoding-loss] t[encoding-loss]o prose, kh[encoding-loss]ng quy[encoding-loss]t [encoding-loss]nh state. AI fail d[encoding-loss]ng template fallback v[encoding-loss] ghi l[encoding-loss]i System Log.

### 3.4 Flow

```text
Action [encoding-loss] mechanics [encoding-loss] structured event [encoding-loss] scene grouping [encoding-loss] template/AI [encoding-loss] Player Log/System Log
```

## 4. Action subsystem

### 4.1 Contextual action

Button l[encoding-loss] ph[encoding-loss][encoding-loss]ng th[encoding-loss]c ch[encoding-loss]nh; free text l[encoding-loss] b[encoding-loss] sung. Action ph[encoding-loss]i ph[encoding-loss]n [encoding-loss]nh state v[encoding-loss] kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] h[encoding-loss]nh [encoding-loss]ng kh[encoding-loss]ng th[encoding-loss] d[encoding-loss]ng.

DTO t[encoding-loss]i thi[encoding-loss]u:

```js
{ id, label, category, priority, available, disabledReason,
  danger, requiresConfirmation, target, payload, duration, cost, preview }
```

Priority 0/state override cho ending, eldritch intervention, combat/dialogue/travel. Context [encoding-loss]u ti[encoding-loss]n tr[encoding-loss][encoding-loss]c priority t)nh.

### 4.2 Turn flow

```text
read state [encoding-loss] build context [encoding-loss] validate [encoding-loss] render actions
[encoding-loss] parse/resolve m[encoding-loss]t l[encoding-loss]n [encoding-loss] update state [encoding-loss] render l[encoding-loss]i
```

Free-text c[encoding-loss]n normalize, alias, parse intent/target; ambiguity ph[encoding-loss]i h[encoding-loss]i l[encoding-loss]i; invalid ph[encoding-loss]i fallback d[encoding-loss] hi[encoding-loss]u. Command echo ch[encoding-loss] System/Debug.

### 4.3 Inventory/equipment

Ph[encoding-loss]n bi[encoding-loss]t weapon/armor/artifact/spirit treasure, consumable/pill, material/quest item v[encoding-loss] Fate Inventory. Equip validate slot conflict/confirmation; Use x[encoding-loss] l[encoding-loss] quantity; m[encoding-loss]t action kh[encoding-loss]ng execute hai l[encoding-loss]n.

### 4.4 Duplicate execution

M[encoding-loss]t click/free-text ch[encoding-loss] c[encoding-loss] m[encoding-loss]t owner execution. Transaction/expectedVersion ch[encoding-loss]ng stale action. Sau state change ph[encoding-loss]i refresh action table, inventory, panel v[encoding-loss] log.

## 5. Layout v[encoding-loss] responsive subsystem

### 5.1 Structural invariants

- Gi[encoding-loss] story panel b[encoding-loss]n ph[encoding-loss]i.
- Character Summary n[encoding-loss]m trong sidebar v[encoding-loss] gi[encoding-loss] pinned structure.
- Kh[encoding-loss]ng redesign to[encoding-loss]n app ho[encoding-loss]c [encoding-loss]i k[encoding-loss]ch th[encoding-loss][encoding-loss]c t[encoding-loss]ng th[encoding-loss] t[encoding-loss]y [encoding-loss].
- Sidebar ch[encoding-loss] tng width khi c[encoding-loss]n [encoding-loss]c stat; kh[encoding-loss]ng b[encoding-loss]p story panel.
- Kh[encoding-loss]ng chuy[encoding-loss]n summary v[encoding-loss]o story panel [encoding-loss] n[encoding-loss] overflow.

### 5.2 Action/clock placement

Topbar hi[encoding-loss]n th[encoding-loss] r[encoding-loss]:

```text
H[encoding-loss]nh Tr[encoding-loss]nh [encoding-loss] Nm 1, Th[encoding-loss]ng 1 ng[encoding-loss]y 1
Thi[encoding-loss]n [encoding-loss]o [encoding-loss] Nm 6876, Th[encoding-loss]ng 1 ng[encoding-loss]y 1
```

Weather/season l[encoding-loss] context ph[encoding-loss]. Action table nh[encoding-loss]m theo category/priority; button label [encoding-loss]c [encoding-loss][encoding-loss]c; More kh[encoding-loss]ng [encoding-loss][encoding-loss]c gi[encoding-loss]u to[encoding-loss]n b[encoding-loss] gameplay; free text kh[encoding-loss]ng chi[encoding-loss]m di[encoding-loss]n t[encoding-loss]ch ch[encoding-loss]nh.

### 5.3 Responsive

Desktop gi[encoding-loss] sidebar/story/action table r[encoding-loss]. Mobile gi[encoding-loss] n[encoding-loss]i dung, button [encoding-loss] l[encoding-loss]n, overlay scroll [encoding-loss][encoding-loss]c, topbar clock kh[encoding-loss]ng wrap ph[encoding-loss] layout, long narrative wrap [encoding-loss]ng.

## 6. i18n v[encoding-loss] feature placement subsystem

### 6.1 Formatter

Kh[encoding-loss]ng hi[encoding-loss]n th[encoding-loss] raw ID c[encoding-loss]a item, quest, technique, fate, NPC, location, contract ho[encoding-loss]c action. D[encoding-loss]ng formatter trung t[encoding-loss]m nh[encoding-loss] `formatItemName`, `formatTechniqueName`, `formatFateName`, `formatQuestName`, `formatLocationName`, `formatActionLabel`, `formatHistory`, `playerClockLabel`, `worldClockLabel`.

Formatter t[encoding-loss]ch kh[encoding-loss]i gameplay, c[encoding-loss] fallback v[encoding-loss] kh[encoding-loss]ng throw khi thi[encoding-loss]u data.

### 6.2 DTO v[encoding-loss] feature placement

UI nh[encoding-loss]n DTO c[encoding-loss] stable id, display label, description, availability, cost v[encoding-loss] disabled reason. Feature [encoding-loss]t theo mental model: profession [encoding-loss] Character; technique evolution [encoding-loss] Technique; Fate evolution [encoding-loss] Fate; guild project [encoding-loss] Guild; contested opportunity [encoding-loss] C[encoding-loss] Duy[encoding-loss]n; hidden clue [encoding-loss] D[encoding-loss] Ch[encoding-loss]; market/auction t[encoding-loss]ch r[encoding-loss]; reincarnation legacy [encoding-loss] K[encoding-loss] [encoding-loss]c; personal tribulation [encoding-loss] Character; collection/NPC rare reward [encoding-loss] D[encoding-loss] Ch[encoding-loss]/collection.

### 6.3 Weather v[encoding-loss] feature addendum

Weather/D[encoding-loss] Tri[encoding-loss]u c[encoding-loss] th[encoding-loss] [encoding-loss]nh h[encoding-loss][encoding-loss]ng travel, NPC, faction, local activity v[encoding-loss] atmosphere. Mechanics d[encoding-loss]ng stable key; UI d[encoding-loss]ng label/icon. Hidden profession d[encoding-loss]ng graph/rule engine. Item [encoding-loss]u ti[encoding-loss]n refer item c[encoding-loss] s[encoding-loss]n. Achievement, profession item, NPC reward v[encoding-loss] action ph[encoding-loss]i c[encoding-loss] label/migration/version.

## 7. Cross-system function map

| Function | Owner/contract |
|---|---|
| `ensureGameClock` | Normalize/migrate clock |
| `advanceGameTime` | M[encoding-loss]t c[encoding-loss]ng ti[encoding-loss]n ng[encoding-loss]y |
| `applyOfflineProgress` | Real elapsed [encoding-loss] game days |
| `gameDayIndex` | Player ordinal legacy |
| `worldDayIndex` | World ordinal |
| `clockLabel` | Player label |
| `worldClockLabel` | World label |
| `createGameEvent` | Event snapshot |
| `pushHistory` | History visibility/debug |
| `renderGameEvent` | Template/prose |
| `renderScene` | Scene grouping |
| `contextState` | Available actions |
| `parseAction` | Free-text intent |
| `submitActionId` | Single execution |
| `absoluteDay` | Expansion Player Day |
| `simulateWorldUntil` | Expansion world tick owner |
| `formatHistory` | Player-facing localization |
| `updateClockDisplay` | Two clocks/weather |

## 8. Migration, tests v[encoding-loss] Definition of Done

### 8.1 Migration

Save ci [encoding-loss]c root Player Clock, gi[encoding-loss] ratio/dayProgress/lastRealTimestamp, t[encoding-loss]o World Clock v[encoding-loss]i fixed legacy start index, t[encoding-loss]nh cache t[encoding-loss] Player Day v[encoding-loss] kh[encoding-loss]ng h[encoding-loss]i t[encoding-loss] lifespan. Offline ch[encoding-loss]y [encoding-loss]ng m[encoding-loss]t l[encoding-loss]n. Kh[encoding-loss]ng rename h[encoding-loss]ng lo[encoding-loss]t day fields.

### 8.2 Required tests

- Day 0/day 360/day 2,475,360 World formatter.
- 30 gi[encoding-loss]y [encoding-loss] 1 ng[encoding-loss]y; fractional progress; overflow date.
- Player year pass tng tu[encoding-loss]i/gi[encoding-loss]m th[encoding-loss] [encoding-loss]ng m[encoding-loss]t l[encoding-loss]n; World year pass kh[encoding-loss]ng gi[encoding-loss]m th[encoding-loss].
- New/legacy serialize-deserialize gi[encoding-loss] mapping.
- Offline 0/1/nhi[encoding-loss]u ng[encoding-loss]y kh[encoding-loss]ng fake log, duplicate reward/NPC/weather/travel.
- Event scene grouping, timestamp heading ri[encoding-loss]ng, debug/error filtering.
- Expansion `absoluteDay`, seed, task fields v[encoding-loss] `simulateWorldUntil` kh[encoding-loss]ng [encoding-loss]i semantics.
- Button/free-text single execution; contextual priority; inventory slot/quantity.
- Kh[encoding-loss]ng raw ID; formatter fallback; responsive/topbar/sidebar/story/action layout.
- Full regression ph[encoding-loss]i ch[encoding-loss]y; failure ngo[encoding-loss]i scope ph[encoding-loss]i ghi r[encoding-loss], kh[encoding-loss]ng b[encoding-loss] assertion.

### 8.3 Definition of Done

Task ch[encoding-loss] ho[encoding-loss]n th[encoding-loss]nh khi state canonical r[encoding-loss], hai clock kh[encoding-loss]ng ch[encoding-loss]y [encoding-loss]c l[encoding-loss]p, kh[encoding-loss]ng double tick, Player Log [encoding-loss]ng contract, save ci load [encoding-loss][encoding-loss]c, deterministic mechanics [encoding-loss][encoding-loss]c gi[encoding-loss], UI kh[encoding-loss]ng ph[encoding-loss] layout v[encoding-loss] t[encoding-loss]i li[encoding-loss]u implementation status [encoding-loss][encoding-loss]c c[encoding-loss]p nh[encoding-loss]t.

## 9. Implementation status

[encoding-loss] tri[encoding-loss]n khai: World Clock schema/normalize, zero-based world ordinal, Player/World formatter, event snapshot, UI hai clock, legacy smoke test, offline mapping regression v[encoding-loss] chu[encoding-loss]n h[encoding-loss]a caller bare `advanceGameTime()` trong expansion.

C[encoding-loss] [encoding-loss] gi[encoding-loss] nguy[encoding-loss]n: expansion `absoluteDay()` l[encoding-loss] Player Day 1-based; expansion wrapper l[encoding-loss] world simulation owner; seed/day fields ci ch[encoding-loss]a chuy[encoding-loss]n World Day; Player Clock kh[encoding-loss]ng reset khi Lu[encoding-loss]n H[encoding-loss]i.

QA: dual timeline regression PASS; offline mapping PASS; legacy migration smoke PASS; JavaScript syntax PASS. Full `verify_game.js` c[encoding-loss]n failure exploration `secretLocationId`, thu[encoding-loss]c ph[encoding-loss]m vi ci ngo[encoding-loss]i clock v[encoding-loss] kh[encoding-loss]ng [encoding-loss][encoding-loss]c che b[encoding-loss]ng c[encoding-loss]ch h[encoding-loss] test.

## 10. Final rule

M[encoding-loss]i thay [encoding-loss]i ph[encoding-loss]i x[encoding-loss]c [encoding-loss]nh: state canonical n[encoding-loss]o, clock n[encoding-loss]o, owner ti[encoding-loss]n th[encoding-loss]i gian n[encoding-loss]o, event/scene/timestamp n[encoding-loss]o, label/fallback n[encoding-loss]o v[encoding-loss] test regression n[encoding-loss]o. N[encoding-loss]u ch[encoding-loss]a x[encoding-loss]c [encoding-loss]nh [encoding-loss], kh[encoding-loss]ng tri[encoding-loss]n khai.
---

## AMENDMENT 2026-09-16 — TAB THẾ GIỚI/CÔNG TRÌNH VÀ HIỂN THỊ NGHỀ

Tab Thế giới phải có khu vực Công Trình Bản Đồ, hiển thị công trình tại node hiện tại, chi phí, hiệu quả và trạng thái đã xây. Nút xây dựng gọi command canonical, không sửa state trực tiếp trong UI. Tối thiểu có Truyền Tống Trận và Hộ Giới Đại Trận.

Khu vực nghề chỉ hiển thị nghề chính sau khi đã chọn; không cho chọn nghề thường thứ hai. Nghề Ẩn chỉ xuất hiện như lựa chọn nghề phụ sau khi Cổ Tịch Tà Thần mở khóa. Thanh trạng thái hiển thị nghề chính trước, và thêm nghề phụ ẩn sau khi đã cố định.


### Source: `archive-requirements\logic-history\07-ui\ACTION_PRIORITY_REPLAY_CANONICAL_2026-09-16.md`

# Action Priority / Replay Canonical — 2026-09-16

## Priority tiers

`tier 0` là forced/blocking: combat, ritual, pending search, contested opportunity. `tier 1` là action mở rộng có thể tiêu lượt. `tier 2` là navigation/status/overflow. Safe action (`Trạng Thái`, `Quan Sát`, `Hành Trang`) được phép tồn tại cùng blocking action.

Mỗi action phải có `id`, `category`, `scope`, `urgency`, `blocking`, `consumesTurn`, `enabled` và `sourceOrder`. `resolveActionPriority` dedupe theo ID, chọn winner theo `tier → urgency → sourceOrder`, rồi lọc action không hợp lệ.

## Replay

Preview không được thay đổi state hoặc tiêu hao RNG. Commit dùng unique action key/turn; world event, map encounter, weather, auction và NPC encounter dùng seeded resolver hoặc unique idempotency key. Legacy history không tạo ID bằng random khi deserialize.

## UI listener

Action handler chỉ dispatch một lần qua `submitActionId`/`runExpansionCommand`; render lại không được đăng ký listener trùng. Feature mới phải đi qua view model/resolver thay vì tự đọc raw effect field để quyết định blocking.

## Acceptance

- Combat/search/ritual/opportunity/travel/structure không đồng thời cho phép action xung đột.
- Deserialize cùng snapshot giữ nguyên log/event ID và statDisplay.
- Chạy world tick cùng target lần hai không nhân đôi cascade/reward/encounter.
- Hai save được deserialize từ cùng một snapshot, chạy cùng nhánh combat và
  cùng input phải tạo transcript player-visible giống hệt nhau ở `type`, `text`,
  `clock` và `statDisplay`; event ID/timestamp kỹ thuật không được dùng làm
  tiêu chí khác biệt của replay.


### Source: `archive-requirements\logic-history\07-ui\ARCHIVE_PERFORMANCE_BUDGET_CANONICAL_2026-09-16.md`

# Archive / Performance Budget Canonical — 2026-09-16

## Retention

- Runtime `state.history`: tối đa 300 event để UI.
- Save payload `history`: tối đa 100 event gần nhất; `logState.totalEvents` giữ tổng số.
- Node history: tối đa 50 record/node.
- NPC memory/rumor: tối đa 20/12 record; offline encounter archive: tối đa 100.
- Milestone/important/rare/epic event không bị prune khỏi canonical counters; raw narrative cũ chỉ giữ nếu nằm trong retention.

## Render budget

- Map UI chỉ gọi influence resolver cho node đang render; cache theo `influenceRevision`.
- Local map hiển thị node visited/reachable/unknown; không render chi tiết actor cho fog node.
- Story log gộp cùng ngày thành một paragraph trước khi DOM append.

## Offline budget

- 30 ngày gần nhất chạy detailed tick; phần xa hơn dùng aggregate.
- Tick idempotent theo `lastProcessedDay` và event/task/encounter key.
- Offline không phát raw narrative cho từng actor; chỉ lưu aggregate/cascade cần thiết.

## Kết quả profiling hiện tại

`tools/profile_runtime_budget.js` đã đo 13 node × 5 lượt resolver: 65 lần gọi, 4 cache hit, thời gian trung bình khoảng 0.25ms/lần trên môi trường Node hiện tại. Save mẫu có kích thước khoảng 3.7MB, vì vậy không được giả định payload nhỏ; IndexedDB archive vẫn phải giữ raw history ngoài save chính.

`tools/verify_indexeddb_archive.js` đã kiểm tra failure injection và retry queue.

FPS thực tế trên thiết bị yếu và dung lượng IndexedDB vẫn cần benchmark browser thực tế; profiling Node chỉ là regression gate logic, không thay thế benchmark UI.


### Source: `archive-requirements\logic-history\07-ui\ARCHIVE_RETENTION_AND_QUOTA_CONTRACT_2026-09-17.md`

# ARCHIVE RETENTION AND QUOTA CONTRACT — 2026-09-17

## Canonical limits

- Gameplay history giữ tối đa 300 event trong state runtime.
- Node history giữ tối đa 50 record/node; weather history 30; actor history 30; relationship/narrative auxiliary history có giới hạn riêng trong state validator.
- Save localStorage phải nằm dưới baseline 5 MB của payload serialized trong profile hiện hành.
- Nhật ký cũ được archive độc lập qua IndexedDB object store `events`, keyPath `id`; archive failure không được chặn gameplay save/turn.
- Queue archive chỉ xóa batch sau khi transaction đã được tạo; lỗi open/transaction đưa batch trở lại retry queue.
- Event archive có `archivedAt` để đọc lại theo thứ tự mới nhất; archive không thay đổi canonical gameplay state.

## Regression

`profile_runtime_budget.js` stress 360 event và large-save serialization, kiểm tra history retention và payload dưới 5 MB. `verify_indexeddb_archive.js` injects open failure, retries, xác nhận event thực sự được ghi vào object store sau khi IndexedDB hoạt động lại.

## Chưa thể xác nhận trong Node

Quota thực tế, FPS và IndexedDB implementation của từng browser/device cần chạy browser/device QA; runtime contract và failure path đã có test độc lập.


### Source: `archive-requirements\logic-history\07-ui\LOG_TECHNICAL_TOKEN_SANITIZATION_2026-09-17.md`

# LOG TECHNICAL TOKEN SANITIZATION — 2026-09-17

## Mục tiêu

Mọi log đi tới khu vực nhật ký người chơi phải giữ văn phong tiểu thuyết. Các khóa kỹ thuật do subsystem phát ra không được xuất hiện nguyên dạng trong câu chuyện, kể cả khi producer gửi trực tiếp một payload lỗi hoặc thông báo nội bộ.

## Phạm vi contract

- Boundary chuẩn là `createGameEvent` → `renderGameEvent`/`formatPlayerLogText` → `novelLogParagraphs` hoặc `renderScene`.
- Mã lỗi dạng `SCREAMING_SNAKE_CASE` được ánh xạ qua `ERROR_NARRATIVE_MAP`; mã chưa biết dùng fallback trung tính.
- Các token kỹ thuật bị loại khỏi player-facing prose gồm `internal`, `debug`, `raw`, `payload`, `field_name`, `undefined`, `null`, cùng nhóm token cũ như `Depth`, `Search`, `session`, `counter`, `cooldown`, `multiplier`, `state`.
- `debugOnly`/`COMMAND_ECHO` vẫn được phép tồn tại trong history phục vụ chẩn đoán nhưng không được render vào nhật ký người chơi.
- `statDisplay` là kênh số liệu riêng; không trộn vào câu văn và không dùng để bypass narrative lint.

## Regression đã triển khai

`tools/verify_log_narrative.js` kiểm tra cả producer message chứa các token kỹ thuật mới. `tools/verify_log_producers.js` và `tools/verify_expansion_log_matrix.js` tiếp tục kiểm tra toàn bộ producer thực tế sau boundary render.

## Trạng thái

Đã code và đã pass smoke test/log producer/expansion narrative matrix. Gate UI trực quan vẫn phụ thuộc môi trường trình duyệt; không thay đổi contract runtime vì gate này.

## Phần chưa hoàn thiện

- Chưa có browser automation ổn định để chụp và xác nhận pixel-level của panel nhật ký trên Chrome local; cần chạy lại khi browser policy cho phép.
- Các chuỗi mojibake tồn tại trong một số fixture/nguồn cũ là vấn đề encoding riêng, không được coi là token kỹ thuật của boundary này.


### Source: `archive-requirements\logic-history\07-ui\UI_ARCHIVE_PERFORMANCE_GATE_2026-09-17.md`

# UI, archive và performance gate — Batch 69

## Gate bắt buộc

- UI phải có World/Map/Dị Thể/Nghề Ẩn/Mệnh và log dùng `novelLogParagraphs` theo ngày.
- Log producer không được đẩy technical token hoặc system-log formatting trực tiếp ra player surface.
- Archive IndexedDB phải retry khi open/write lỗi và không làm mất event.
- History local giữ tối đa 300 entry; actor history giữ theo offline detailed window; save payload và novel grouping phải nằm trong budget baseline.
- `validateExpansionState` dùng baseline profile chuẩn cho data validity; thiết bị yếu chỉ thay đổi render/diagnostic budget, không làm save hợp lệ thành invalid.

## Evidence

- `verify_ui_surface_contract.js`
- `verify_log_narrative.js`
- `verify_log_producers.js` (66/66)
- `verify_indexeddb_archive.js`
- `profile_runtime_budget.js`
- `node --check js/ui.js`

## Giới hạn

FPS trên browser và quota IndexedDB của từng thiết bị thật vẫn là manual/device QA; Node profile chỉ là deterministic baseline gate.


### Source: `archive-requirements\logic-history\07-ui\UI_SURFACE_CONTRACT_REGRESSION_2026-09-17.md`

# UI Surface Contract Regression — 2026-09-17

## Phạm vi

Đây là gate tự động cho các bề mặt UI liên quan trực tiếp tới 33 mục review:

- thứ tự tải `engine → expansion → ui → main`;
- tab Thế Sự, Dị Thể và các tab chức năng;
- bản đồ thế giới/local map có influence, fog, completion, route climate;
- Thế Sự có weather, weather history, node history và Công Trình Tông Môn;
- phân biệt Con Đường, Nghề chính, Nghề Ẩn và Dị Thể;
- interaction delegation của map pin, expansion command, save và render-after-turn;
- story log lấy grouped novel paragraphs.

## Regression

`tools/verify_ui_surface_contract.js` kiểm tra source contract và cấm nhãn legacy
`Dị Chí` trong UI source. Đây là static contract gate; browser visual QA vẫn là
gate bổ sung khi môi trường trình duyệt cho phép tải local runtime.

## Trạng thái

ĐÃ CODE + static regression. Không thay thế browser visual QA.


### Source: `archive-requirements\logic-history\07-ui\UI_VIEWMODEL_ACTION_DELEGATION_REGRESSION_2026-09-17.md`

# UI VIEW-MODEL / ACTION DELEGATION REGRESSION — 2026-09-17

## Contract

- Dị Thể/discovery UI exposes the lifecycle states `discovered`, `verified`, `collected`, `rewarded` without deriving them from Con Đường/Nghề state.
- Map/World/structure/weather/faction panels consume canonical resolver/view-model outputs rather than inventing raw state rules.
- `tab-content` has one delegated click listener; actions enter `enqueueAction()` before engine execution, preventing duplicate execution after rerender.
- Engine action priority/pending-departure guards remain the final authority for combat, travel, ritual and opportunity conflicts.
- Legacy history is normalized with deterministic IDs/statDisplay and rendered through grouped novel paragraphs.

## Evidence

`verify_ui_surface_contract.js` now checks lifecycle state coverage, one delegated listener, serialized action queue and engine guard presence. Runtime review/game regressions continue to cover action priority and legacy log round-trip.

Browser pixel-level QA remains an environment gate; this contract specifically proves the UI view-model and event-wiring invariants available without a browser session.


### Source: `archive-requirements\logic-history\07-ui\UTF8_PLAYER_TEXT_INTEGRITY_2026-09-18.md`

# UTF-8 Player Text Integrity — 2026-09-18

## Mục tiêu

Mọi văn bản người chơi nhìn thấy — nhật ký novel, thông báo hành động, modal cơ duyên, bản đồ, NPC, vật phẩm và dữ liệu hiển thị — phải là UTF-8 hợp lệ và không được lộ chuỗi mojibake.

## Quy tắc bắt buộc

- Không đưa các dấu hiệu mã hóa hỏng như `Ã`, `Â`, `Ä`, `Å`, `Æ`, `á»`, `áº`, `â `, `ðŸ` hoặc ký tự thay thế `[encoding-loss]` vào player-facing text.
- Chuỗi từ save cũ, payload NPC/event và dữ liệu nhập ngoài bundle phải đi qua `repairMojibakeText` trước khi vào log hoặc narrative surface.
- Việc sửa chỉ được thực hiện một lần trên đoạn nghi ngờ; không giải mã lặp trên tiếng Việt đã hợp lệ.
- Text kỹ thuật dành cho debug có thể tồn tại ở vùng debug, nhưng không được chảy sang log người chơi.
- `index.offline.html` là bundle phát hành riêng, chỉ rebuild theo quy trình offline; không tự ý sửa đồng bộ trong bước audit source này.

## Điểm triển khai

- `js/engine.js`: `repairMojibakeText` là boundary chung của `narrativeSafe`, nhờ đó `pushHistory`, event, NPC và random event đều được bảo vệ.
- `tools/repair_mojibake.js`: rà soát và sửa literal mojibake trong source, data, requirement và bundle online; loại trừ `index.offline.html`.
- Các chuỗi hỏng đã được chuẩn hóa trong `js/`, `data/`, `webgame/`, `index.html` và requirement hiện hữu.

## Kiểm tra hồi quy

Chạy:

```powershell
node tools/repair_mojibake.js
node --check js/engine.js
node --check js/main.js
node --check js/ui.js
node tools/verify_game.js
node tools/verify_expansion_stress.js
```

Lệnh audit phải kết thúc với `Would update 0 files`. Nếu xuất hiện ký tự `[encoding-loss]`, phải xử lý dữ liệu nguồn thay vì che bằng CSS hoặc thay thế tại UI.


### Source: `archive-requirements\logic-history\07-ui\WORLD_STRUCTURE_OWNERSHIP_UI_2026-09-17.md`

# World tab — structure ownership UI

World tab phải hiển thị owner (`player`, `faction`, `npc`) và quyền hiện tại đối với
từng công trình. UI gọi `GameExpansion.structureManagerDecision`, không tự sao chép
permission rules. Người chơi phải thấy rõ sửa chữa/nâng cấp/tháo dỡ được phép hay không;
action runtime vẫn là authority cuối cùng.

`renderStructureOwnershipPolicy` là lớp hiển thị canonical policy cạnh danh sách Công
Trình Bản Đồ. Regression UI kiểm tra renderer và resolver token tồn tại cùng nhau.


### Source: `archive-requirements\logic-history\ACTION_PRIORITY_RESOLUTION_FIX.md`

# ACTION PRIORITY RESOLUTION — THIẾT KẾ TÁCH ĐỘ ƯU TIÊN ACTION

## 1. Mục tiêu

Action bar phải xử lý được nhiều nguồn action cùng lúc: combat, pending exploration, cơ duyên tranh đoạt, NPC, incident, travel, breakthrough và các tiện ích toàn cục.

Không dùng một trường `priority: 0/1` cho tất cả mục đích. Một action có thể quan trọng về gameplay nhưng không nên chiếm quick bar; ngược lại, action an toàn như Trạng Thái luôn cần truy cập nhưng không được phá luật pending.

## 2. Mô hình dữ liệu chuẩn

Mỗi action sau khi được tạo phải được chuẩn hóa về dạng:

```js
{
  id: "act_exp_opportunity",
  label: "Ứng biến Cơ Duyên",
  tier: 0,                  // quyền chặn gameplay
  urgency: 100,             // thứ tự trong cùng tier, càng cao càng trước
  scope: "pending",         // pending | combat | local | global | system
  category: "opportunity",  // nhóm UI và giới hạn số nút
  surface: "quick",         // quick | overflow | modal
  blocking: true,           // có khóa context khác không
  consumesTurn: true,
  enabled: true,
  disabledReason: null,
  source: "expansion"
}
```

Các trường phải độc lập:

| Trường | Chức năng | Không dùng cho |
|---|---|---|
| `tier` | Chọn context gameplay đang thắng | Màu sắc hoặc thứ tự tuyệt đối |
| `urgency` | Sort trong cùng context | Quyết định action có chặn hay không |
| `blocking` | Chặn context khác | Đánh dấu action quan trọng chung chung |
| `surface` | Quick bar, Thêm hoặc modal | Luật gameplay |
| `category` | Nhóm, icon, quota UI | Quyết định context thắng |
| `enabled` | Có thể thực hiện hay không | Ẩn action không phù hợp |
| `consumesTurn` | Có tăng lượt hay chỉ mở thông tin | Thứ tự ưu tiên |

Action thiếu trường mới phải được normalize về giá trị mặc định, không suy luận từ vị trí push vào mảng.

## 3. Các tầng gameplay

Tầng nhỏ hơn có quyền chặn tầng lớn hơn. Chỉ xét tầng thấp nhất có action hợp lệ và `blocking: true`.

### Tier 0 — Bắt buộc xử lý ngay

- `STATE_ELDRITCH_INTERVENTION`, `STATE_FATE_BACKFIRE` và các state lựa chọn bắt buộc.
- Combat đang diễn ra: Tấn Công, Bỏ Chạy, skill hợp lệ.
- Pending cơ duyên tranh đoạt còn hạn.
- Pending exploration tại node hiện tại.
- Pending dialogue/incident có quyết định bắt buộc.

Tier 0 không trộn với action thông thường. Chỉ thêm action an toàn không tiêu lượt như `Trạng Thái`, `Quan Sát`, `Hành Trang` nếu hệ thống cho phép.

### Tier 1 — Ngữ cảnh trực tiếp

- NPC hiện diện tại đúng node/sub-location.
- Incident active tại node.
- Quest turn-in hoặc lựa chọn cục bộ đã sẵn sàng.

Chỉ xét khi không có Tier 0 blocking. Nhiều action cùng Tier 1 sort theo `urgency`, sau đó `sourceOrder` ổn định.

### Tier 2 — Action chuẩn tại địa điểm

- Thám Hiểm khi không còn pending.
- Tu Luyện, Tự Động Tu Luyện, Nghỉ Ngơi.
- Di chuyển và Về nơi an toàn.
- Hoạt động map cục bộ không bắt buộc.

### Tier 3 — Action toàn cục

- Trạng Thái, Hành Trang, Bản Đồ, Công Pháp, Tử Vi Mệnh Số.
- Nhiệm Vụ, Tổ Chức, Giúp.
- Đột Phá hoặc mở modal nghi thức khi đủ điều kiện.

Tier 3 mặc định nằm trong `Thêm`. Chỉ action có `surface: "quick"` rõ ràng mới được lên quick bar.

## 4. Resolver bắt buộc

```text
collect từ engine core + expansion + map + NPC
→ normalize schema
→ loại action không hợp lệ / hết hạn
→ dedupe theo action.id
→ xác định blocking context thắng
→ loại tier bị chặn
→ sort theo tier, urgency, sourceOrder
→ đóng gói quick bar / overflow / modal
```

UI chỉ trình bày kết quả resolver, không tự quyết định action nào được phép tồn tại.

```js
function resolveActions(state, rawActions) {
  const actions = dedupe(rawActions.map(normalizeAction));
  const blocking = actions
    .filter(a => a.enabled && a.blocking)
    .sort((a, b) => a.tier - b.tier || b.urgency - a.urgency);

  const winner = blocking[0] || null;
  const visible = winner
    ? actions.filter(a => a.tier === winner.tier || isSafeAction(a, state))
    : actions;

  return packSurfaces(sortStable(visible));
}
```

`isSafeAction()` phải là allow-list, không phải điều kiện “không phải action nguy hiểm”.

## 5. Collision giữa các context

Thứ tự mặc định:

1. Fate/system choice bắt buộc.
2. Combat.
3. Pending cơ duyên tranh đoạt.
4. Pending exploration tại node hiện tại.
5. Pending dialogue/incident bắt buộc.
6. NPC/incident thông thường.
7. Action địa điểm.
8. Action toàn cục.

Combat thắng pending interaction vì người chơi phải có quyền sinh tồn tức thời. Pending ở node khác không chặn thao tác hiện tại; khi bắt đầu rời node, engine xử lý thất lạc theo spec và ghi log.

Nếu cơ duyên phải thắng combat, đó phải là state forced riêng, không mô phỏng bằng cách tăng `urgency`.

## 6. Pending exploration và contested opportunity

### Pending exploration

Chuẩn hóa alias bằng một hàm duy nhất:

```js
getPendingExploration(state) // ưu tiên pendingExploration, fallback pendingSearch
```

Khi pending ở node hiện tại, chỉ tạo action thật sự áp dụng:

- `act_search_collect` nếu còn resource/rare chưa thu.
- `act_search_investigate` nếu còn information.
- `act_explore_npc_assist` nếu NPC hiện diện.
- `act_search_leave` luôn có.
- Action an toàn theo allow-list.

Không hiển thị đồng thời Thám Hiểm, Tu Luyện hoặc Di Chuyển như action bình thường.

### Pending contested opportunity

Action bar chỉ cần một action mở modal:

```text
Ứng biến Cơ Duyên → modal gồm yield / fight / scheme / share
```

Không tạo action giả có tên khác choice thật. Choice phải resolve bằng `runExpansionCommand("opportunity", choice)` và chỉ xử lý một lần theo `opportunity.id`.

## 7. Movement guard

Mọi đường di chuyển — action bar, bản đồ, fast travel, safe travel và command text — phải đi qua cùng một engine guard.

Khi còn pending tại node hiện tại:

1. Mặc định từ chối di chuyển.
2. UI hiển thị confirm modal.
3. Chỉ khi xác nhận, engine ghi pending là `lost`, xóa cả alias state rồi cho di chuyển.
4. Log ghi node, loại pending và lý do thất lạc.

Không đặt confirm chỉ trong callback UI vì map hoặc command text có thể bypass callback.

## 8. Quick bar và overflow

- `surface: "quick"`: được xem xét vào quick bar.
- `surface: "overflow"`: luôn ở menu Thêm.
- `surface: "modal"`: không render như chip action.
- Action disabled có lý do chỉ hiển thị khi người chơi cần biết; action không áp dụng thì ẩn.
- Quota category chỉ áp dụng lúc pack UI, không được làm mất action blocking.
- Action blocking không bị đẩy vào overflow vì quota.

Màu sắc không phải nguồn sự thật. Tier 0 cần thêm icon/nhãn/`aria-label` để không phụ thuộc màu.

### 8.1. Bố cục hiển thị chuẩn

Quick bar được đóng gói theo bốn vùng, theo đúng thứ tự:

```text
Context bắt buộc  →  Action chính  →  Action phụ  →  Tiện ích
```

- **Context:** pending, combat, incident hoặc lựa chọn bắt buộc; tối đa 6 nút quick, phần vượt quá được gom theo nhóm.
- **Action chính:** tối đa 2 nút có urgency cao nhất, thường gồm Tìm Kiếm và Tu Luyện.
- **Action phụ:** tối đa 5 nút có liên quan trực tiếp, gồm Hành Trang và Trạng Thái là hai tiện ích kiểm tra nhanh.
- **Tiện ích:** không cạnh tranh với gameplay action; nằm trong `Thêm` hoặc thanh tiện ích riêng.

Các hướng di chuyển được gom thành một nút `Di Chuyển` mở bản đồ. Skill chỉ bung thành nhiều nút khi đang combat; ngoài combat, skill nằm trong nhóm `Công Pháp`. NPC chỉ đưa tương tác nổi bật vào action phụ, các NPC còn lại nằm trong nhóm `NPC`.

Overflow không còn là danh sách phẳng. Các action phải được nhóm tối thiểu theo `category`: `Di chuyển`, `NPC`, `Công pháp`, `Nhiệm vụ`, `Tiện ích`, `Khác`.

## 9. Cache và invalidation

Fingerprint action context phải bao gồm pending exploration/search, pending opportunity, combat enemy IDs, forced state, dialogue/incident ID và phase, travel status, location/sub-location.

Mutation làm thay đổi các field này phải invalidate cache. Không dùng riêng `turn` hoặc `history.length` làm tín hiệu refresh.

## 10. Acceptance tests

- Pending exploration chỉ hiện choice áp dụng và action an toàn.
- `pendingExploration` và `pendingSearch` cho cùng kết quả.
- Pending opportunity không hiện Tu Luyện, NPC, Thám Hiểm hoặc Di Chuyển.
- Combat luôn có Tấn Công/Bỏ Chạy; action an toàn không bị quota làm mất.
- Pending node khác bị đánh dấu thất lạc khi rời node.
- Mọi movement path đều chạy movement guard.
- Action global luôn ở overflow nếu không được đánh dấu quick.
- Hai provider cùng `id` chỉ tạo một nút.
- Action hết hạn bị loại trước khi pack UI.
- Action thông tin không tăng lượt; action gameplay chỉ tăng lượt một lần.
- Save/load giữ nguyên context thắng và pending IDs.
- Cache không trả action cũ sau khi pending/combat/dialogue thay đổi.
- Trạng thái bình thường không có quá 2 action chính và 5 action phụ.
- Nhiều hướng đi chỉ tạo một nút `Di Chuyển` trên quick bar.
- Utility không chiếm slot quick của action gameplay.
- Overflow hiển thị theo nhóm, không phải một danh sách phẳng.

## 11. Nguyên tắc mở rộng

Action mới chỉ cần khai báo `tier`, `urgency`, `scope`, `category`, `surface`, `blocking` và `consumesTurn`. Không sửa các nhánh sort cũ trong UI.

Nếu action cần luật chặn khác thường, thêm một context resolver có tên và test riêng; không dùng `urgency` để mô phỏng luật chặn mới.


### Source: `archive-requirements\logic-history\GAME_LOG_NOVEL_STYLE_FIX.md`

# FIX LOG SYSTEM — TỪ "NHẬT KÝ HỆ THỐNG" SANG "VĂN TIỂU THUYẾT"
> Đọc kèm `ANCIENT_TAOIST_REALM_GAME_LOG_SYSTEM.md` (giữ nguyên kiến trúc Event/Narrative/Template
> đã có — KHÔNG viết lại từ đầu). File này CHỈ giải quyết 1 việc: bản deploy thực tế đang VI PHẠM
> chính nguyên tắc của tài liệu đó. Mọi hướng dẫn dưới đây đều PRESCRIPTIVE (quy tắc cứng, có thể
> test được), không phải gợi ý chung chung như bản trước.

---

## 1. CHẨN ĐOÁN — 6 LỖI CỤ THỂ TRONG LOG THẬT MÀY GỬI (trích dẫn nguyên văn)

| # | Dòng lỗi thật | Vi phạm nguyên tắc nào (đối chiếu file gốc) | Mức độ |
|---|---|---|---|
| 1 | `[Năm 1, Tháng 1 ngày 8 · ...]` lặp lại NGUYÊN VẸN 10 lần liên tiếp cho 10 hành động trong CÙNG 1 ngày | Không có nguyên tắc dedupe timestamp trong file gốc — đây là LỖ HỔNG của chính spec, không phải lỗi implement sai spec | Nghiêm trọng — chiếm hơn nửa dung lượng log chỉ để lặp lại thông tin không đổi |
| 2 | `> [Thu Thập Phát Hiện]` — echo lại TÊN LỆNH thô trước khi hiện kết quả | Vi phạm mục 29 "Tách Narrative và Mechanics" — đây là hiện UI command, không phải narrative | Nghiêm trọng — đọc như terminal, không phải tiểu thuyết |
| 3 | `§ Thu thập hoàn tất: Cổ Tịch Tàn Trang ×1 · Linh Thạch Hạ Phẩm ×2.` | Vi phạm mục 7 (Narrative Template System) — đây là Result Formatter thô, KHÔNG hề qua Narrative Generator dù file gốc yêu cầu | Nghiêm trọng — bỏ qua hoàn toàn tầng narrative đã thiết kế |
| 4 | `× Không thể bắt đầu hành trình: TRAVEL_ALREADY_ACTIVE.` | Vi phạm NẶNG NHẤT — 1 HẰNG SỐ NỘI BỘ (`SCREAMING_SNAKE_CASE`) lọt thẳng ra UI người chơi. File gốc mục 39 nói rõ "đừng biến log thành debug log" nhưng đây CHÍNH XÁC là debug log | **Nghiêm trọng nhất — bug thật, không phải vấn đề văn phong** |
| 5 | `§ Phiên tìm kiếm 2 tại Phù Không Đảo (2 lượt dò, Thể Lực -5): ✓ ... Depth còn 1/5.` | Từ "Depth" tiếng Anh lọt vào câu tiếng Việt; "Phiên tìm kiếm 2" là session counter nội bộ; dấu ✓ liệt kê như checklist thay vì câu văn | Nghiêm trọng — lộ nguyên state variable ra ngoài |
| 6 | Mỗi lần Tìm Kiếm xong lại cần 1 action "Thu Thập Phát Hiện" RIÊNG, tạo 2 block log cho 1 hành động logic duy nhất | Vi phạm tinh thần mục 10 (Narrative Frequency) — 1 hành động của người chơi không nên bị TÁCH thành 2 block log rời | Trung bình — vấn đề luồng game, không chỉ văn phong |

---

## 2. QUY TẮC CỨNG BẮT BUỘC (có thể viết thành test/lint, không phải gợi ý)

### 2.1. RULE — Cấm tuyệt đối hằng số nội bộ lọt ra log người chơi
```
LINT RULE: quét toàn bộ text sẽ hiện cho player, nếu match regex /^[A-Z_]{4,}$/ hoặc chứa chuỗi
toàn UPPER_SNAKE_CASE bất kỳ đâu trong câu -> FAIL BUILD, không được deploy.

Mọi mã lỗi nội bộ (TRAVEL_ALREADY_ACTIVE, INVALID_STATE, v.v.) BẮT BUỘC đi qua bảng dịch:

ERROR_NARRATIVE_MAP = {
  TRAVEL_ALREADY_ACTIVE: [
    "Ngươi vẫn còn đang trên đường, chưa thể khởi hành thêm lần nữa.",
    "Đôi chân vẫn chưa dừng bước, hãy đợi hành trình này kết thúc đã.",
  ],
  // ... mọi mã lỗi khác đều phải có ít nhất 1 câu dịch trong bảng này TRƯỚC KHI được dùng trong code
}
```
Không có ngoại lệ — nếu 1 lỗi mới được thêm vào engine mà CHƯA có trong `ERROR_NARRATIVE_MAP`, hệ
thống phải dùng 1 câu fallback trung tính ("Có điều gì đó cản trở hành động này.") chứ KHÔNG BAO GIỜ
được hiện thẳng tên hằng số.

### 2.2. RULE — Cấm từ/thuật ngữ kỹ thuật lọt vào câu narrative
```
BANNED_WORDS_IN_NARRATIVE = ["Depth", "session", "phiên", "lượt dò", "counter", "index", "ID",
                              "state", "buff", "debuff", "multiplier", "cooldown"]

Nếu 1 template narrative chứa bất kỳ từ nào trong danh sách này -> FAIL, phải viết lại.
"Depth còn 1/5" -> đổi thành ý nghĩa TƯỜNG THUẬT: "nơi đây dường như vẫn còn điều gì đó chưa lộ
diện" (mơ hồ, đúng chất khám phá) HOẶC nếu cần rõ ràng cho UI: tách RIÊNG thành 1 dòng Stat Display
(mục 11 file gốc) KHÔNG nằm trong câu văn, dạng "◇ Còn có thể dò thêm: 1 lượt".
```

### 2.3. RULE — Dedupe Timestamp (lỗ hổng chưa có trong spec gốc, bổ sung mới)
```
lastRenderedTimestamp = null

renderLogEntry(event):
  if (event.timestamp !== lastRenderedTimestamp):
      hiện dòng timestamp MỚI (dạng nổi bật, 1 lần)
      lastRenderedTimestamp = event.timestamp
  // Nếu timestamp KHÔNG đổi so với dòng ngay trước -> KHÔNG lặp lại, coi các event cùng timestamp
  // là CÙNG 1 "CẢNH" (scene), nối narrative của chúng liền mạch (xem mục 2.4)
```

### 2.4. RULE — Gộp Cảnh (Scene Batching) thay vì mỗi action 1 block riêng
```
2 event LIÊN TIẾP được gộp thành 1 đoạn narrative DUY NHẤT (không tách dòng, không lặp timestamp)
NẾU CẢ 3 điều kiện đúng:
  1. Cùng timestamp (cùng ngày game)
  2. Cùng location
  3. Có quan hệ NHÂN-QUẢ trực tiếp (VD "Tìm Kiếm" luôn kéo theo "Thu Thập" ngay sau — đây là 1 CẶP
     bắt buộc gộp, không phải 2 hành động độc lập của người chơi)

Danh sách cặp LUÔN gộp: [Tìm Kiếm + Thu Thập], [Di Chuyển + Đến Nơi], [Tấn Công + Kết Quả Đòn Đánh]
```
Với ví dụ log thật của mày: "Tìm Kiếm · 2 lượt dò" + "Thu Thập Phát Hiện" ngay sau đó PHẢI render
thành 1 đoạn văn LIỀN MẠCH, không phải 2 block với 2 lần lặp timestamp như hiện tại.

---

## 3. VIẾT LẠI CHÍNH XÁC LOG THẬT CỦA MÀY (before/after, dùng làm chuẩn hiệu chỉnh)

### TRƯỚC (nguyên văn mày gửi):
```
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Thu Thập Phát Hiện]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
§ Thu thập hoàn tất: Cổ Tịch Tàn Trang ×1 · Linh Thạch Hạ Phẩm ×2.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
⚔ Phát hiện cơ duyên có người tranh đoạt. Hãy chọn cách ứng biến trong Thế Sự.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Đi Bắc]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
× Không thể bắt đầu hành trình: TRAVEL_ALREADY_ACTIVE.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Đi Đông]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
→ Ngươi tiến đến Phù Không Đảo.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Tìm Kiếm · 2 lượt dò]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
§ Phiên tìm kiếm 2 tại Phù Không Đảo (2 lượt dò, Thể Lực -5): ✓ Tụ Khí Đan ×2 ✓ Linh Thạch Hạ Phẩm
×2 điều tra Depth còn 1/5.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Thu Thập Phát Hiện]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
§ Thu thập hoàn tất: Tụ Khí Đan ×2 · Linh Thạch Hạ Phẩm ×2.
```

### SAU (viết lại theo đúng 4 quy tắc mục 2, dùng làm chuẩn hiệu chỉnh cho engine):
```
【Năm 1, Tháng 1, Ngày 8 · Kỷ Nguyên Linh Khí Dị Biến】

§ Ngươi thu vào tay mảnh Cổ Tịch Tàn Trang phủ đầy bụi thời gian, cùng hai viên Linh Thạch Hạ Phẩm
còn vương hơi lạnh của đất.

⚔ Trong lúc cúi nhặt, ngươi cảm nhận có ánh mắt khác cũng đang dõi theo món cơ duyên này — dường như
không chỉ mình ngươi để tâm tới nó. (Xem Thế Sự để ứng biến.)

Ngươi định rẽ hướng Bắc, nhưng đôi chân vẫn còn vương vấn hành trình dở dang, chưa thể cất bước thêm
lần nữa. Đổi ý, ngươi quay sang hướng Đông — không bao lâu sau, Phù Không Đảo đã hiện ra trước mắt.

Đứng giữa đảo, ngươi lặng người dò xét từng ngóc ngách. Hai lượt tìm kiếm trôi qua, thân thể có phần
mệt mỏi, nhưng bù lại ngươi tìm được hai viên Tụ Khí Đan và thêm hai viên Linh Thạch Hạ Phẩm — dường
như nơi đây vẫn còn điều gì đó chưa lộ diện hết.

✦ Thu được: Cổ Tịch Tàn Trang ×1 · Linh Thạch Hạ Phẩm ×4 · Tụ Khí Đan ×2
◇ Thể Lực -5 · Còn có thể dò thêm tại đây: 1 lượt
```

**Điểm khác biệt cốt lõi:**
- 1 timestamp DUY NHẤT cho cả cảnh, không lặp 10 lần.
- KHÔNG còn dòng echo `> [Tên Lệnh]` nào — hành động của người chơi được NGẦM HIỂU qua chính câu
  narrative kể lại nó (đây là điểm quan trọng nhất biến "nhật ký" thành "tiểu thuyết": tiểu thuyết
  không bao giờ viết "Nhân vật thực hiện lệnh X" rồi mới kể chuyện — nó kể chuyện luôn).
- Sự kiện Bỏ hướng Bắc/đổi hướng Đông được GỘP thành 1 câu tường thuật tự nhiên thay vì 1 dòng lỗi
  kỹ thuật + 1 dòng hành động riêng biệt.
- "Tìm Kiếm" + "Thu Thập" gộp thành 1 đoạn, số liệu cộng dồn hiện Ở CUỐI thành 1 dòng Stat Display
  duy nhất (✦/◇), tách biệt hoàn toàn khỏi câu văn — đúng mục 11 file gốc nhưng lần này làm ĐÚNG.

---

## 4. MỞ RỘNG NGÂN HÀNG TEMPLATE CHO ĐÚNG 3 HÀNH ĐỘNG ĐANG BỊ LỘ RA THÔ NHẤT

### 4.1. Tìm Kiếm (Search) — theo số lượt dò VÀ kết quả (nhiều biến thể, tránh lặp)
```json
{
  "id": "explore.search.success_partial",
  "templates": [
    "Ngươi lặng người dò xét từng ngóc ngách của {location}. {n_luot} lượt tìm kiếm trôi qua, thân
     thể có phần mệt mỏi, nhưng bù lại thu được {items}.",
    "Từng bước chân ngươi in dấu khắp {location}, mắt không rời từng phiến đá, gốc cây.
     Sau {n_luot} lượt kiếm tìm, ngươi có được {items} — dường như nơi đây vẫn còn điều gì đó chưa
     lộ diện hết.",
    "Ngươi kiên nhẫn lục soát {location}, không bỏ sót một xó xỉnh nào. {n_luot} lượt dò xét mang
     lại {items}, dù sức lực cũng theo đó hao tổn không ít."
  ]
}
```
```json
{
  "id": "explore.search.exhausted",
  "templates": [
    "Ngươi đã dò xét {location} tới mức không còn gì để tìm thêm nữa — nơi này đã hoàn toàn thuộc
     về những gì ngươi biết.",
    "Không còn ngóc ngách nào của {location} chưa qua tay ngươi — đã đến lúc rời đi tìm vận may ở
     nơi khác."
  ]
}
```

### 4.2. Thất bại di chuyển (Travel Blocked) — KHÔNG BAO GIỜ hiện mã lỗi
```json
{
  "id": "travel.blocked.already_active",
  "templates": [
    "Ngươi vẫn còn đang trên đường, đôi chân chưa thể cất bước thêm lần nữa.",
    "Hành trình hiện tại vẫn chưa dứt, ngươi đành gác lại ý định đổi hướng.",
    "Có điều gì đó ngăn bước chân ngươi lúc này — hành trình cũ vẫn chưa khép lại."
  ]
}
```

### 4.3. Cơ Duyên Bị Tranh Chấp (đã có ở RANDOM_EVENT_SYSTEM.md 5.1, giờ thêm bản narrative đúng chuẩn)
```json
{
  "id": "opportunity.contested",
  "templates": [
    "Trong lúc cúi nhặt, ngươi cảm nhận có ánh mắt khác cũng đang dõi theo món cơ duyên này.",
    "Một luồng khí tức lạ thoáng qua sau lưng — dường như ngươi không phải người duy nhất để tâm
     tới thứ này."
  ]
}
```

---

## 5. ALGORITHM TỔNG HỢP — LUỒNG XỬ LÝ 1 "CẢNH" TRƯỚC KHI RENDER

```
renderScene(events[]):  // events[] = danh sách event CÙNG timestamp, CÙNG location
  1. Nhóm events theo cặp bắt buộc gộp (mục 2.4: Tìm Kiếm+Thu Thập, Di Chuyển+Đến Nơi...)
  2. Với mỗi nhóm đã gộp: gọi 1 LẦN DUY NHẤT Narrative Generator, TRUYỀN VÀO context tổng hợp
     (không gọi riêng lẻ cho từng event con trong nhóm)
  3. Lọc bỏ HOÀN TOÀN mọi event có type "COMMAND_ECHO" (loại `> [Tên Lệnh]`) — KHÔNG render loại
     event này ra UI player, chỉ giữ lại ở System Log (Layer 1) cho debug nếu cần
  4. Chạy qua ERROR_NARRATIVE_MAP (mục 2.1) cho MỌI event type "ERROR"/"BLOCKED"
  5. Chạy BANNED_WORDS_IN_NARRATIVE check (mục 2.2) trên kết quả cuối — nếu dính từ cấm, throw lỗi
     ngay lúc BUILD (không phải runtime) để dev bắt lỗi sớm
  6. Gộp toàn bộ Stat Display (✦/◇/✧) của các event trong cùng 1 cảnh thành 1 dòng DUY NHẤT ở cuối
     đoạn văn (không rải rác nhiều dòng số liệu xen giữa)
  7. Render: [1 timestamp] + [1 đoạn narrative liền mạch] + [1 dòng stat tổng hợp]
```

---

## 6. VIỆC CẦN LÀM TIẾP
1. Audit TOÀN BỘ codebase tìm mọi chỗ đang throw/hiện trực tiếp tên hằng số lỗi ra player-facing
   text (mục 2.1) — đây là bug ưu tiên SỐ 1, sửa trước mọi thứ khác vì ảnh hưởng trải nghiệm nặng
   nhất và dễ gây mất niềm tin ("thấy code lỗi" phá vỡ immersion ngay lập tức).
2. Implement `renderScene()` (mục 5) thay thế cách render event-by-event hiện tại.
3. Viết đầy đủ `ERROR_NARRATIVE_MAP` cho MỌI mã lỗi hiện có trong engine (không chỉ
   `TRAVEL_ALREADY_ACTIVE` — cần liệt kê hết, có thể có hàng chục mã khác chưa lộ ra vì chưa ai gặp
   phải tình huống đó).
4. Chạy lại chính đoạn log mày vừa gửi qua engine SAU KHI fix — đối chiếu với bản "SAU" ở mục 3 để
   xác nhận đã đúng, dùng làm regression test cho log system.
---

## AMENDMENT 2026-09-16 — GỘP NHẬT KÝ THEO NGÀY

Mọi log người chơi nhìn thấy phải đi qua narrative renderer; không render `COMMAND_ECHO`, mã lỗi, tên field hoặc câu lệnh debug. Các entry liên tiếp có cùng **Năm/Tháng/Ngày** và cùng bối cảnh node/sub-location được gộp thành một đoạn văn liền mạch, chỉ giữ một timestamp ở đầu. Stat summary nếu có đặt ở cuối đoạn, không chen giữa các câu kể. Entry khác ngày hoặc khác scene bắt đầu đoạn mới.

## IMPLEMENTATION STATUS 2026-09-16

`createGameEvent()` hiện tách `changes` thành `statDisplay`; `renderGameEvent()` chỉ trả narrative, còn `renderScene()` và UI nối stat summary ở cuối cảnh. Luồng Tìm Kiếm, Thu Thập, Điều Tra và NPC/weather đã được chuyển khỏi format console sang câu kể có bối cảnh. Mọi producer vẫn đi qua `pushHistory()` và boundary `narrativeSafe()`, kể cả log legacy khôi phục từ save.
## Unmapped internal-code fallback

Every uppercase implementation code reaching `formatPlayerLogText` is either
resolved through `ERROR_NARRATIVE_MAP` or replaced with a meaningful neutral
novel sentence. The fallback never leaves an empty fragment or exposes the
internal code; `verify_log_narrative.js` covers mapped and unmapped examples.


### Source: `archive-requirements\logic-history\NOVEL_STYLE_LOG_FULL_DEFINITION.md`

# ĐỊNH NGHĨA ĐẦY ĐỦ: NOVEL-STYLE GAME LOG
> Đọc kèm `GAME_LOG_NOVEL_STYLE_FIX_IMPLEMENTATION_PLAN.md` (đã áp dụng). File này giải quyết đúng
> 1 việc: dòng `"NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời."` VẪN lọt
> qua dù đã fix — nghĩa là có 1 LỖ HỔNG CẤU TRÚC mà bảng banned-word cũ không bắt được, và/hoặc 1
> đường phát event riêng chưa được migrate. Định nghĩa dưới đây đủ chi tiết để: (1) tự kiểm tra BẤT
> KỲ câu log nào có đạt chuẩn novel hay không, (2) tìm đúng chỗ code đang lọt.

---

## 1. CHẨN ĐOÁN TRƯỚC: TẠI SAO DÒNG NÀY VẪN LỌT QUA DÙ ĐÃ FIX

```
"NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời."
```

Phân tích cấu trúc: `[Chủ thể] + [động từ báo cáo "phản ứng với"] + [đối tượng] + [:] + [mô tả hiệu
ứng]` — đây là NGUYÊN VĂN 1 câu log hệ thống (system announcement), không phải câu văn kể chuyện.
Đối chiếu với kế hoạch đã áp dụng:

1. **Khả năng 1 (cao nhất):** đây là event loại `"npc_weather_reaction"` hoặc tương tự, được emit từ
   1 nơi trong code KHÔNG NẰM trong danh sách "search/travel/collect/opportunity" mà kế hoạch cũ liệt
   kê ở mục 4 (`js/engine.js` — chỉ nhắc thêm `sceneId`/`relation` cho 4 loại đó). Nếu hệ thống NPC
   phản ứng thời tiết (đã thiết kế ở `MAP_SYSTEM_V2_COMPLETE.md` mục 10.5) được code RIÊNG, độc lập
   khỏi pipeline search/travel, nó vẫn đang gọi thẳng `pushHistory()` với text thô, CHƯA đi qua
   `NarrativeSceneBuilder`.
2. **Khả năng 2:** event NÀY có `playerVisible: true` nhưng KHÔNG có `narrativeKey` map tới template
   nào — hệ thống fallback về in thẳng `event.text` gốc (thô) thay vì fallback về 1 CÂU TRUNG TÍNH
   có văn phong (kế hoạch cũ có nói fallback cho ERROR, nhưng có thể CHƯA có fallback tương tự cho
   loại event "status announcement" như thế này).
3. **Việc cần làm ngay:** grep toàn bộ codebase tìm chuỗi `"phản ứng với thời tiết"` hoặc pattern
   `${npcName} phản ứng` — xác định CHÍNH XÁC file/hàm đang sinh ra nó, xác nhận nó có đi qua
   `renderScene()`/`NarrativeSceneBuilder` hay không. Đây là bước đầu tiên BẮT BUỘC trước khi sửa gì
   khác — không đoán mò.

---

## 2. ĐỊNH NGHĨA CHÍNH THỨC: THẾ NÀO LÀ "NOVEL-STYLE"

Một câu/đoạn log ĐẠT chuẩn novel-style khi và chỉ khi thỏa **CẢ 6 điều kiện** sau — thiếu 1 điều kiện
là KHÔNG đạt, không có khái niệm "gần đạt":

### 2.1. Không có cấu trúc "Thông Báo" (Announcement Structure)
```
CẤM cấu trúc: [Chủ thể] + [động từ hệ thống: phản ứng/thực hiện/kích hoạt/cập nhật/ghi nhận] +
              [:  hoặc  —] + [mô tả]

Dấu hiệu nhận biết cấu trúc CẤM: có dấu HAI CHẤM (:) ngăn cách giữa "sự kiện" và "hệ quả", hoặc câu
đọc được thành công thức "X làm Y" mà không có bối cảnh/cảm giác nào bao quanh.
```
Ví dụ CẤM: "NPC A phản ứng với thời tiết B: giảm hoạt động ngoài trời."
Ví dụ ĐẠT: "Tuyết phủ trắng con đường trước cửa tiệm — Tạ Hải Sinh kéo áo choàng chặt hơn, quyết
định dẹp sạp hàng sớm hơn thường lệ."

### 2.2. Luôn có ÍT NHẤT 1 chi tiết giác quan cụ thể (Sensory Grounding)
Không được kể sự kiện thuần khái niệm ("trời lạnh", "NPC ở trong nhà") — phải có ít nhất 1 trong:
hình ảnh (màu sắc, ánh sáng), âm thanh, xúc giác (lạnh/nóng/đau), khứu giác. Câu ví dụ CẤM ở trên
("giảm hoạt động ngoài trời") HOÀN TOÀN không có chi tiết giác quan nào — chỉ là mô tả trạng thái
trừu tượng.

### 2.3. Chủ thể có ĐỘNG CƠ/PHẢN ỨNG CÁ NHÂN, không phải quy tắc chung
Không viết "NPC làm X vì lý do hệ thống Y" — phải viết NHƯ THỂ chính NPC đó đang tự quyết định dựa
trên tính cách/vai trò/hoàn cảnh riêng. "Tạ Hải Sinh dẹp sạp sớm" (quyết định cá nhân, có thể vì anh
ta là thương nhân sợ lạnh, hoặc vì đang mong nhà) khác hẳn "giảm hoạt động ngoài trời" (mô tả 1 biến
tăng/giảm số học).

### 2.4. Không bao giờ lộ TÊN CƠ CHẾ, dù đã dịch nghĩa
Ngay cả khi không còn "Depth"/"session" tiếng Anh, nếu câu vẫn đọc như đang MÔ TẢ 1 CÔNG THỨC ("giảm
hoạt động" = giảm 1 biến số ẩn danh nào đó) thay vì 1 HÀNH VI CỤ THỂ ("dẹp sạp hàng", "trốn vào quán
trọ", "co ro dưới mái hiên") — vẫn tính là LỘ CƠ CHẾ, dù không dùng từ tiếng Anh nào.

### 2.5. Có tính LIÊN TỤC (Continuity) với các câu trước/sau trong cùng scene
Câu không được đứng ĐỘC LẬP tuyệt đối — phải có khả năng nối với câu trước đó (nếu người chơi vừa
tới node, câu NPC phản ứng thời tiết nên nối liền cảm giác "vừa bước vào X thì thấy Y", không phải
1 dòng thông báo chen ngang không liên quan bối cảnh).

### 2.6. Đọc to lên nghe như 1 câu trong TIỂU THUYẾT THẬT, không phải phụ đề game
Phép thử cuối cùng, đơn giản nhất: đọc thành tiếng — nếu nghe như đang đọc 1 dòng trạng thái HUD/
debug console dịch sang tiếng Việt, KHÔNG ĐẠT. Nếu nghe như 1 câu có thể xuất hiện trong tiểu thuyết
kiếm hiệp/tiên hiệp XUẤT BẢN THẬT, ĐẠT.

---

## 3. BẢNG PHÂN LOẠI NHANH — TỰ TEST BẤT KỲ CÂU LOG NÀO

| Câu | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 2.6 | Kết luận |
|---|---|---|---|---|---|---|---|
| "NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời." | ✗ (có dấu :) | ✗ | ✗ | ✗ (thuật ngữ "hoạt động" trừu tượng) | ✗ | ✗ | **KHÔNG ĐẠT — 0/6** |
| "Tuyết phủ trắng con đường trước cửa tiệm — Tạ Hải Sinh kéo áo choàng chặt hơn, quyết định dẹp sạp hàng sớm hơn thường lệ." | ✓ | ✓ (tuyết trắng, kéo áo) | ✓ (quyết định cá nhân) | ✓ | ✓ (có thể nối cảnh) | ✓ | **ĐẠT — 6/6** |
| "Trời trở lạnh. NPC ở trong nhà." | ✓ (không dấu :) | ✗ (chưa đủ cụ thể) | ✗ | △ | ✗ | ✗ | **KHÔNG ĐẠT — vẫn quá khô dù bỏ dấu :** |

> Lưu ý quan trọng ở dòng 3: chỉ BỎ dấu hai chấm KHÔNG ĐỦ để đạt chuẩn — đây là lỗi thường gặp khi
> sửa vội (chỉ đổi format, không đổi CHẤT LƯỢNG câu văn). Phải đạt ĐỦ CẢ 6 điều kiện, không phải chỉ
> điều kiện 2.1.

---

## 4. BỔ SUNG LINT RULE MỚI — BẮT CẤU TRÚC "THÔNG BÁO", KHÔNG CHỈ TỪ CẤM

Bảng banned-word cũ (`Depth`, `session`...) CHỈ bắt được TỪ VỰNG kỹ thuật, không bắt được CẤU TRÚC
câu kiểu thông báo. Bổ sung thêm 1 rule cấu trúc riêng:

```js
// tools/verify_log_narrative.js — THÊM rule mới, không thay rule cũ

const ANNOUNCEMENT_STRUCTURE_PATTERN =
  /^.{2,30}\s(phản ứng|thực hiện|kích hoạt|cập nhật|ghi nhận|xử lý|áp dụng)\s.{2,40}[:：]/;
  // Bắt cấu trúc "[chủ thể ngắn] + [động từ hệ thống] + [...] + dấu hai chấm"

if (ANNOUNCEMENT_STRUCTURE_PATTERN.test(narrativeText)) {
  FAIL("Câu có cấu trúc thông báo hệ thống, không phải văn kể chuyện: " + narrativeText);
}

// Rule bổ sung 2: cấm MỌI dấu hai chấm (:) trong narrative paragraph (không phải Stat Display)
if (narrativeText.includes(':') || narrativeText.includes('：')) {
  FAIL("Narrative paragraph không được chứa dấu hai chấm — đó là dấu hiệu của cấu trúc liệt kê/" +
       "thông báo, không phải câu văn.");
}
```
> Dấu hai chấm CHỈ được phép xuất hiện trong dòng Stat Display (`✦`/`◇`) đã tách riêng khỏi đoạn văn
> — KHÔNG BAO GIỜ trong chính đoạn narrative.

---

## 5. NGÂN HÀNG TEMPLATE ĐẦY ĐỦ CHO NPC × THỜI TIẾT (lấp đúng lỗ hổng đang lộ)

Viết theo đúng 6 điều kiện ở mục 2, đa dạng theo LOẠI thời tiết × VAI TRÒ NPC (không dùng chung 1
câu cho mọi NPC — thương nhân phản ứng khác nông dân, khác tu sĩ):

### 5.1. Tuyết (Snow) — NPC loại Thương Nhân
```
"Tuyết rơi mỗi lúc một dày trên mái sạp — {npcName} thở dài, bắt đầu thu dọn hàng hóa vào bao, ánh
mắt thoáng tiếc nuối vì phiên chợ hôm nay đành kết thúc sớm."

"{npcName} đứng nép dưới mái hiên, hai tay xoa vào nhau cho ấm, nhìn những bông tuyết rơi phủ dần
lên gánh hàng còn dang dở."
```

### 5.2. Tuyết — NPC loại Tu Sĩ/Đệ Tử Tông Môn
```
"Gió tuyết lùa qua vạt áo, nhưng {npcName} vẫn đứng yên trước sân luyện công — chỉ khẽ nheo mắt,
dường như cái lạnh này chẳng đáng bận tâm với người tu đạo."
```

### 5.3. Mưa (Rain) — NPC bất kỳ (mẫu chung, ưu tiên viết riêng theo vai trò nếu có thời gian)
```
"Mưa bất chợt đổ xuống, {npcName} vội kéo nón che đầu, bước nhanh về phía mái hiên gần nhất, để lại
vài vũng nước loang trên nền đất."
```

### 5.4. Bão Linh Khí — NPC (phản ứng phải khác hẳn mưa/tuyết thường vì đây là hiện tượng SIÊU NHIÊN)
```
"Không khí đột nhiên đặc quánh, linh lực cuộn xoáy vô hình quanh {npcName} — hắn/nàng tái mặt, vội
niệm quyết hộ thân, lùi sâu vào trong tường viện."
```

> Nguyên tắc chọn template: roll theo (loại thời tiết × vai trò NPC × tính cách đã roll nếu có) —
> KHÔNG dùng 1 template duy nhất cho mọi tổ hợp, đúng nguyên tắc "mỗi vùng/node/tổ chức có từ vựng
> riêng" đã ghi trong kế hoạch cũ (mục "Giọng kể và continuity").

---

## 6. QUY TRÌNH BẮT BUỘC TRƯỚC KHI MERGE BẤT KỲ TEMPLATE MỚI NÀO

```
1. Viết câu.
2. Tự chấm theo bảng 6 điều kiện (mục 2/3) — PHẢI đạt 6/6, không có ngoại lệ "tạm chấp nhận 5/6".
3. Chạy qua ANNOUNCEMENT_STRUCTURE_PATTERN (mục 4) — fail thì viết lại, không sửa chữa (patch) câu
   cũ bằng cách chỉ xóa dấu hai chấm.
4. Đọc thành tiếng (2.6) — nếu tự thấy ngượng/nghe như debug console, viết lại từ đầu.
5. CHỈ SAU KHI qua cả 4 bước trên mới thêm vào ngân hàng template.
```

---

## 7. VIỆC CẦN LÀM TIẾP
1. **Ưu tiên tuyệt đối:** grep codebase tìm nguồn phát sinh câu lỗi cụ thể (mục 1.3) — xác nhận đây
   là subsystem NPC-weather CHƯA migrate, hay bug ở tầng khác.
2. Thêm `ANNOUNCEMENT_STRUCTURE_PATTERN` + rule cấm dấu hai chấm (mục 4) vào
   `tools/verify_log_narrative.js` đã có — chạy lại lint trên TOÀN BỘ template hiện có để tìm các
   câu tương tự có thể đang lọt qua ở chỗ khác (rất có thể không chỉ NPC-weather bị lỗi này).
3. Viết đủ template cho MỌI tổ hợp (loại thời tiết × loại vai trò NPC) theo mục 5 — bảng hiện tại
   mới có mẫu cho Tuyết/Mưa/Bão Linh Khí, cần bổ sung Sương Mù/Âm Vũ theo đúng 6 loại đã thiết kế ở
   `MAP_SYSTEM_V2_COMPLETE.md` mục 10.1.
4. Audit lại TOÀN BỘ các loại event khác ngoài NPC-weather (faction war result, incident, structure
   built...) xem có đang dùng cấu trúc thông báo tương tự không — dùng CHÍNH bảng 6 điều kiện này
   làm checklist review, không chỉ riêng NPC-weather.
---

## AMENDMENT 2026-09-16 — DAILY SCENE GROUPING CONTRACT

`renderScene`, `GameEngine.novelLogParagraphs()` và UI story log dùng cùng một
date key: Năm + Tháng + Ngày. Mọi sự kiện trong cùng ngày được nối bằng khoảng
trắng thành một đoạn văn theo văn phong tiểu thuyết, kể cả khi nhân vật đổi
node/sub-location; timestamp chỉ xuất một lần. Đây là contract bắt buộc cho cả
log online và log khôi phục từ save.

## IMPLEMENTATION STATUS 2026-09-16

- Đã nối NPC/weather vào cùng narrative boundary; NPC chỉ phát log khi đang ở cùng node/sub-location với người chơi, còn mô phỏng nền không spam nhật ký.
- Đã có template theo thời tiết và vai trò NPC cho tuyết, mưa/âm vũ, sương, lôi vũ và linh phong; mỗi template có hình ảnh hoặc âm thanh, phản ứng cá nhân và hành động cụ thể.
- `narrativeSafe()` xử lý fallback cuối cùng, chuyển cấu trúc announcement thành câu kể, loại technical token và cấm dấu `:` trong narrative paragraph. Stat Display là kênh riêng.
- `novelLogParagraphs()` là grouping API canonical; `renderScene()` và UI story window dùng cùng date grouping, đặt stat summary ở cuối đoạn văn.
- Regression bắt buộc đã được chạy qua `verify_log_narrative.js`, `verify_expansion_log_matrix.js`, `verify_game.js`, `verify_dichi_deep.js` và `verify_indexeddb_archive.js`.


### Source: `archive-requirements\logic-history\NOVEL_STYLE_LOG_GLOBAL_RULE_2026-09-18.md`

# Global Novel-Style Log Rule — 2026-09-18

Tài liệu này là rule canonical áp dụng cho mọi log player-facing, kế thừa định nghĩa sáu tiêu chí trong `NOVEL_STYLE_LOG_FULL_DEFINITION.md` và boundary/fallback trong `GAME_LOG_NOVEL_STYLE_FIX.md`.

## Contract bắt buộc

Mỗi event hiển thị cho người chơi phải đi qua `pushHistory()` → `createGameEvent()` → `narrativeSafe()` và phải có:

1. `text`/`narrative.text` là câu kể liên tục, có chủ thể, hành động hoặc phản ứng cá nhân và ít nhất một chi tiết cảm giác/bối cảnh.
2. `text` không được là câu HUD, công thức, bảng trạng thái, câu bắt đầu bằng tên action/hàm, hoặc cấu trúc thông báo `Chủ thể + động từ hệ thống + dấu hai chấm + hệ quả`.
3. Số lượt, delta, phần thưởng, chi phí, tỷ lệ, lý do dừng và kết quả định lượng phải nằm trong `statDisplay`/`changes`, không nối vào narrative bằng dấu hai chấm.
4. Không để lộ mã lỗi, tên hàm, field, technical token, tên namespace hoặc debug payload.
5. `COMMAND_ECHO` và event debug không render ở story log người chơi.
6. Các event cùng ngày được nhóm theo `novelLogParagraphs()`; stat summary xuất hiện ở cuối đoạn, không chen giữa câu kể.

## Mẫu đúng

```js
pushHistory(state, {
  type: "sys",
  text: "Ngươi khép mắt, để hơi thở chậm dần giữa dòng linh khí; từng vòng vận công lắng xuống trong đan điền.",
  statDisplay: ["Tự động tu luyện · vận công 5 lượt · điều tức 0 lượt · Đã hoàn thành số chu kỳ đã chọn."]
});
```

## Mẫu cấm

```text
Tự động tu luyện: vận công 5 lượt, điều tức 0 lượt. Đã hoàn thành số chu kỳ đã chọn.
```

## Enforcement

- Producer mới phải thêm regression kiểm tra `formatPlayerLogText()` và `validateLogSurfaceState()`.
- `tools/verify_log_narrative.js`, `verify_log_producers.js`, `verify_game.js` là gate bắt buộc.
- Nếu một producer không có narrative phù hợp, phải viết lại câu kể; không chỉ xóa dấu `:` hoặc đổi tên label.
- Rule áp dụng đồng nhất cho tu luyện, combat, NPC, map event, cơ duyên, tổ chức, đấu giá, công trình, offline projection và mọi log tương lai.




## TRACE RECOVERY - RUNTIME-DERIVED UI, ACTION, LOG, AND SAVE CONTRACT

This section reconstructs damaged historical UI and log wording from js/engine.js, js/ui.js, js/main.js, and surviving audit rules.

### Action path

- UI declares action controls and emits a stable command or action id.
- The delegated UI handler resolves the command, invokes the runtime action, and renders the returned state or result; UI does not mutate gameplay state directly.
- Action priority and movement controls are resolved by engine action context so base actions remain available when feature panels add actions.
- Every mutating action returns a structured result with success or failure, reason, and data where applicable.

### Player-facing log path

- Player-visible events flow through pushHistory(state, entry) and createGameEvent(state, input).
- novelLogParagraphs(state, events) groups events by game date; renderScene(state, events) consumes the grouped projection.
- Narrative text and quantitative/stat display are separate channels. Technical tokens, field names, function names, debug payloads, and raw error codes do not belong in narrative text.
- Debug and command-echo events are not rendered in the player story surface.

### Archive and persistence

- History is part of state and survives save/load normalization without changing event meaning.
- Archive retention, quota, replay, and migration operate on structured events and envelopes, not rendered text.
- Replaying a producer is idempotent: duplicate receipts do not duplicate rewards, history, or state mutations.
- Renderers consume view models and must not become alternate sources of gameplay logic.

### Recovery status

Recovered from runtime symbols: pushHistory, createGameEvent, novelLogParagraphs, renderScene, delegated UI action handling, archive/replay boundaries, and player-facing log validators. Damaged prose examples are superseded by this runtime-derived contract.
## Consolidated addendum: pinned character surface and novel log rules

- `PinnedCharacterSummary` is rendered before every tab content and is independent of `activeSidebarTab`; navigation, map, combat, and dialogue must not unmount it.
- Action presentation keeps the primary surface compact and routes overflow into the existing More/details surface. A confirmed action closes its dropdown/popover.
- Player-facing log text is narrative-safe: no raw mechanism names, payload dumps, announcement-only lines, or stat syntax in the narrative paragraph. Structured facts remain in event metadata and are rendered separately.

## Pinned character surface hardening

- The pinned character summary has a dedicated mount outside tab content and is rendered independently from the active tab.
- Tab changes, map overlays, combat, dialogue, and action rerenders must not remove or replace the pinned mount.
- The pinned surface has a responsive layout contract: fixed sidebar on desktop, normal top block on narrow screens, and no duplicate status panel inside the pinned surface.

### Resource field contract

- The pinned Linh Khí meter reads `player.qi` and `player.maxQi`. `mana` and `maxMana` are not valid player-state fields.
- Journey option rendering receives the complete state so region-dependent organization availability matches the engine resolver.
- Journey intent labels and organization targets are rendered from the same engine option contract. The UI must not infer regional availability from background text or a partial player object.
