# UI System Consolidated Requirements

## 1. M�c �ch v� ngu�n

T�i li�u n�y l� b�n canonical h�p nh�t c�c y�u c�u trong `requirement/05-ui`, chia theo subsystem/function.

Ngu�n � h�p nh�t: `GAME_CLOCK_DUAL_TIMELINE_DESIGN.md`, `GAME_CLOCK_TIMESTAMP_AUDIT_REVIEW.md`, `ANCIENT_TAOIST_REALM_GAME_LOG_SYSTEM.md`, `ACTION_HYBRID_SYSTEM.md`, `UI_LAYOUT_AND_ACTION_TABLE_REQUIREMENTS.md`, `UI_LAYOUT_REQUIREMENT_KEEP_STRUCTURE_ADJUST_WIDTH.md`, `SPEC_FIX_HE_THONG_NGON_NGU_VA_BO_TRI_FEATURE.md`.

�u ti�n: engine/state contract > save compatibility/determinism > Player Log contract > presentation. Presentation kh�ng t� � thay �i mechanics.

## 2. Clock v� timestamp subsystem

### 2.1 Contract

`gameClock` l� ngu�n s� th�t duy nh�t v� c� hai g�c nh�n t� c�ng m�t engine:

```text
advanceGameTime(state, days)
  � Player Clock ti�n
  � World Clock ti�n c�ng s� ng�y
  � daily mechanics ch�y m�t l�n cho t�ng ng�y ho�n t�t
```

Player Clock hi�n t�i v�n l� canonical trong phase compatibility:

```text
gameClock.currentYear/currentMonth/currentDay/dayProgress
gameClock.eraIndex/currentEra
```

Quy t�c:

- 30 gi�y th�c = 1 ng�y game.
- 30 ng�y = 1 th�ng; 12 th�ng = 1 nm; 360 ng�y = 1 nm.
- `dayProgress` gi� ph�n ng�y l�.
- `gameDayIndex = (year - 1) � 360 + (month - 1) � 30 + day`.
- Player Day Index 1-based; ng�y �u ti�n l� index 1.
- `playerElapsedWholeDays = playerDayIndex - 1`.

World Clock d�ng index zero-based:

```text
worldDayIndex = world.startDayIndex + (playerDayIndex - 1)
worldYear = floor(worldDayIndex / 360)
worldMonth = floor((worldDayIndex % 360) / 30) + 1
worldDay = (worldDayIndex % 30) + 1
```

`worldDayIndex = 0` l� Nm 0, Th�ng 1 ng�y 1 t�i `world.epochDate`. V� d� `2,475,360` l� Nm 6876, Th�ng 1 ng�y 1. `epochDate` l� lore date, kh�ng ph�i `Date.now()`.

### 2.2 Data contract

```js
gameClock: {
  schemaVersion: 4,
  currentYear: 1,
  currentMonth: 1,
  currentDay: 1,
  dayProgress: 0,
  eraIndex: 1,
  currentEra: "K� Nguy�n Linh Kh� D� Bi�n",
  realTimeToGameTimeRatio: 1 / 30,
  timeScaleVersion: 3,
  lastRealTimestamp: 0,
  world: {
    epochDate: "2026-08-15",
    epochLabel: "M�c Linh kh� suy ki�t",
    startDayIndex: 2475360,
    currentDayIndex: 2475360,
    currentYear: 6876,
    currentMonth: 1,
    currentDay: 1,
    currentEra: "K� Nguy�n Linh Kh� Suy Ki�t",
    eraId: "linh_khi_suy_kiet"
  }
}
```

`world.current*` l� cache; `world.startDayIndex` v� Player Clock l� ngu�n � t�nh l�i. Kh�ng t�o th�m `gameClock.player.current*` trong phase �u v� s� t�o duplicate source-of-truth.

### 2.3 Function rules

- `ensureGameClock(state)`: normalize/migrate, t�o world clock, refresh cache; kh�ng advance v� kh�ng h�i t� tu�i/th�.
- `gameDayIndex()`/`playerDayIndex()`: Player ordinal 1-based, gi� semantics ci.
- `worldDayIndex()`/`worldClockLabel()`: World ordinal/label zero-based.
- `clockLabel()`: ti�p t�c tr� Player Clock � gi� Player Log.
- `advanceGameTime()`: c�p nh�t hai clock trong m�t transaction; nhi�u ng�y ph�i x� l� tu�n t�.
- `onGameYearPass()`: ch� ch�y khi Player Clock qua nm; tng tu�i, gi�m th� nguy�n, x� l� Lu�n H�i.
- `applyOfflineProgress()`: d�ng `lastRealTimestamp`, g�i c�ng advance pipeline, suppress history, kh�ng t�o fake event.
- Player Clock kh�ng reset khi Lu�n H�i. Tu�i t�ng �i n�u c�n ph�i d�ng `lifeClock` ri�ng.

### 2.4 Mechanics mapping

| Function/subsystem | Ordinal/clock |
|---|---|
| Tu�i, th� nguy�n, Lu�n H�i | Player Clock |
| M�nh S� cooldown/reward | Player Day Index |
| Travel/weather/NPC/quest/incident | Player Day + current node |
| Expansion `absoluteDay()` | Player Day Index 1-based |
| World simulation hi�n t�i | Player Day Index 1-based |
| Lore display | World Clock |
| Player Log | Player Clock |
| Audit/System Log | ISO + Player/World snapshot |

Kh�ng �i `expansion.absoluteDay()` sang World Day. N�u c�n, th�m `absoluteWorldDay()` ri�ng.

### 2.5 Offline, wrapper v� determinism

- `lastRealTimestamp` ch� l� technical timestamp.
- New save d�ng world start t� lore config; save ci d�ng `LEGACY_WORLD_START_DAY_INDEX` c� �nh.
- Kh�ng l�y `createdAt`, `savedAt`, timezone ho�c th�i i�m load l�m lore date.
- Expansion wrapper hi�n g�i `original.advanceGameTime()` r�i `simulateWorldUntil()`; wrapper l� owner world simulation. Core kh�ng ��c th�m tick th� hai.
- `deserialize()` c� engine offline progress v� expansion simulation; ph�i b�o �m m�i l�n load ch� c� m�t offline advance v� m�t simulation range.
- Seed hi�n d�ng Player Day; kh�ng �i sang World Day �m th�m v� s� ph� replay.
- C�c field `lastProcessedDay`, `dueDay`, `createdDay`, `resolvedDay`, `generatedDay`, `expiresDay`, `startDay` ph�i ph�n lo�i ri�ng tr��c migration.

### 2.6 Timestamp/event

Event snapshot g�m `clock`, `worldClock`, `timestamp`, `playerDayIndex`, `worldDayIndex`, `sceneId`, location/node/weather context, result v� changes.

Player Log:

```text
[Nm 1, Th�ng 1 ng�y 10 � K� Nguy�n Linh Kh� D� Bi�n]

N�i dung scene.
```

Kh�ng d�ng `[clock]: n�i dung`. Event c�ng `sceneId + clock + locationId` d�ng m�t heading; kh�c ng�y/node/weather/reason m� scene m�i. Command echo, debug v� error kh�ng v�o Player Log. `renderScene()` �u ti�n `sceneId`.

## 3. Game Log v� Narrative subsystem

### 3.1 Ba l�p

1. System Log: debug/audit/error/command echo.
2. Game Log: structured mechanics event.
3. Narrative Log: prose ng��i ch�i �c.

Mechanics data kh�ng tr�n v�o prose. Render history d�ng snapshot ci, kh�ng �c clock hi�n t�i � ghi �.

### 3.2 Event types v� importance

Event ch�nh: `CULTIVATION`, `REST`, `BREAKTHROUGH`, `COMBAT`, `LOOT`, `EXPLORE`, `TRAVEL`, `TALK`, `WORLD_EVENT`, `SYSTEM`.

Importance: `TRACE`, `NORMAL`, `IMPORTANT`, `RARE`, `LEGENDARY`, `MYTHIC`. Importance quy�t �nh � d�i/visibility narrative, kh�ng �i mechanics.

### 3.3 Template/context

Template ch�n theo type/importance/context. Context c� player, realm, cultivation, clock, world clock, location, weather, NPC, faction, combat, loot v� result. Fallback ph�i an to�n, kh�ng l� raw ID/`undefined`/m� l�i.

Compact d�ng cho event l�p; Short cho event quan tr�ng; Extended cho breakthrough/world/hidden/milestone. Recent narrative ch�ng l�p nh�ng ph�i deterministic v� mechanics.

Combat ��c compression v�a �; exploration/NPC/world/hidden event kh�ng ��c l� th�ng tin ch�a unlock. AI ch� t�o prose, kh�ng quy�t �nh state. AI fail d�ng template fallback v� ghi l�i System Log.

### 3.4 Flow

```text
Action � mechanics � structured event � scene grouping � template/AI � Player Log/System Log
```

## 4. Action subsystem

### 4.1 Contextual action

Button l� ph��ng th�c ch�nh; free text l� b� sung. Action ph�i ph�n �nh state v� kh�ng hi�n th� h�nh �ng kh�ng th� d�ng.

DTO t�i thi�u:

```js
{ id, label, category, priority, available, disabledReason,
  danger, requiresConfirmation, target, payload, duration, cost, preview }
```

Priority 0/state override cho ending, eldritch intervention, combat/dialogue/travel. Context �u ti�n tr��c priority t)nh.

### 4.2 Turn flow

```text
read state � build context � validate � render actions
� parse/resolve m�t l�n � update state � render l�i
```

Free-text c�n normalize, alias, parse intent/target; ambiguity ph�i h�i l�i; invalid ph�i fallback d� hi�u. Command echo ch� System/Debug.

### 4.3 Inventory/equipment

Ph�n bi�t weapon/armor/artifact/spirit treasure, consumable/pill, material/quest item v� Fate Inventory. Equip validate slot conflict/confirmation; Use x� l� quantity; m�t action kh�ng execute hai l�n.

### 4.4 Duplicate execution

M�t click/free-text ch� c� m�t owner execution. Transaction/expectedVersion ch�ng stale action. Sau state change ph�i refresh action table, inventory, panel v� log.

## 5. Layout v� responsive subsystem

### 5.1 Structural invariants

- Gi� story panel b�n ph�i.
- Character Summary n�m trong sidebar v� gi� pinned structure.
- Kh�ng redesign to�n app ho�c �i k�ch th��c t�ng th� t�y �.
- Sidebar ch� tng width khi c�n �c stat; kh�ng b�p story panel.
- Kh�ng chuy�n summary v�o story panel � n� overflow.

### 5.2 Action/clock placement

Topbar hi�n th� r�:

```text
H�nh Tr�nh � Nm 1, Th�ng 1 ng�y 1
Thi�n �o � Nm 6876, Th�ng 1 ng�y 1
```

Weather/season l� context ph�. Action table nh�m theo category/priority; button label �c ��c; More kh�ng ��c gi�u to�n b� gameplay; free text kh�ng chi�m di�n t�ch ch�nh.

### 5.3 Responsive

Desktop gi� sidebar/story/action table r�. Mobile gi� n�i dung, button � l�n, overlay scroll ��c, topbar clock kh�ng wrap ph� layout, long narrative wrap �ng.

## 6. i18n v� feature placement subsystem

### 6.1 Formatter

Kh�ng hi�n th� raw ID c�a item, quest, technique, fate, NPC, location, contract ho�c action. D�ng formatter trung t�m nh� `formatItemName`, `formatTechniqueName`, `formatFateName`, `formatQuestName`, `formatLocationName`, `formatActionLabel`, `formatHistory`, `playerClockLabel`, `worldClockLabel`.

Formatter t�ch kh�i gameplay, c� fallback v� kh�ng throw khi thi�u data.

### 6.2 DTO v� feature placement

UI nh�n DTO c� stable id, display label, description, availability, cost v� disabled reason. Feature �t theo mental model: profession � Character; technique evolution � Technique; Fate evolution � Fate; guild project � Guild; contested opportunity � C� Duy�n; hidden clue � D� Ch�; market/auction t�ch r�; reincarnation legacy � K� �c; personal tribulation � Character; collection/NPC rare reward � D� Ch�/collection.

### 6.3 Weather v� feature addendum

Weather/D� Tri�u c� th� �nh h��ng travel, NPC, faction, local activity v� atmosphere. Mechanics d�ng stable key; UI d�ng label/icon. Hidden profession d�ng graph/rule engine. Item �u ti�n refer item c� s�n. Achievement, profession item, NPC reward v� action ph�i c� label/migration/version.

## 7. Cross-system function map

| Function | Owner/contract |
|---|---|
| `ensureGameClock` | Normalize/migrate clock |
| `advanceGameTime` | M�t c�ng ti�n ng�y |
| `applyOfflineProgress` | Real elapsed � game days |
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

## 8. Migration, tests v� Definition of Done

### 8.1 Migration

Save ci �c root Player Clock, gi� ratio/dayProgress/lastRealTimestamp, t�o World Clock v�i fixed legacy start index, t�nh cache t� Player Day v� kh�ng h�i t� lifespan. Offline ch�y �ng m�t l�n. Kh�ng rename h�ng lo�t day fields.

### 8.2 Required tests

- Day 0/day 360/day 2,475,360 World formatter.
- 30 gi�y � 1 ng�y; fractional progress; overflow date.
- Player year pass tng tu�i/gi�m th� �ng m�t l�n; World year pass kh�ng gi�m th�.
- New/legacy serialize-deserialize gi� mapping.
- Offline 0/1/nhi�u ng�y kh�ng fake log, duplicate reward/NPC/weather/travel.
- Event scene grouping, timestamp heading ri�ng, debug/error filtering.
- Expansion `absoluteDay`, seed, task fields v� `simulateWorldUntil` kh�ng �i semantics.
- Button/free-text single execution; contextual priority; inventory slot/quantity.
- Kh�ng raw ID; formatter fallback; responsive/topbar/sidebar/story/action layout.
- Full regression ph�i ch�y; failure ngo�i scope ph�i ghi r�, kh�ng b� assertion.

### 8.3 Definition of Done

Task ch� ho�n th�nh khi state canonical r�, hai clock kh�ng ch�y �c l�p, kh�ng double tick, Player Log �ng contract, save ci load ��c, deterministic mechanics ��c gi�, UI kh�ng ph� layout v� t�i li�u implementation status ��c c�p nh�t.

## 9. Implementation status

� tri�n khai: World Clock schema/normalize, zero-based world ordinal, Player/World formatter, event snapshot, UI hai clock, legacy smoke test, offline mapping regression v� chu�n h�a caller bare `advanceGameTime()` trong expansion.

C� � gi� nguy�n: expansion `absoluteDay()` l� Player Day 1-based; expansion wrapper l� world simulation owner; seed/day fields ci ch�a chuy�n World Day; Player Clock kh�ng reset khi Lu�n H�i.

QA: dual timeline regression PASS; offline mapping PASS; legacy migration smoke PASS; JavaScript syntax PASS. Full `verify_game.js` c�n failure exploration `secretLocationId`, thu�c ph�m vi ci ngo�i clock v� kh�ng ��c che b�ng c�ch h� test.

## 10. Final rule

M�i thay �i ph�i x�c �nh: state canonical n�o, clock n�o, owner ti�n th�i gian n�o, event/scene/timestamp n�o, label/fallback n�o v� test regression n�o. N�u ch�a x�c �nh �, kh�ng tri�n khai.
---

## AMENDMENT 2026-09-16 — TAB THẾ GIỚI/CÔNG TRÌNH VÀ HIỂN THỊ NGHỀ

Tab Thế giới phải có khu vực Công Trình Bản Đồ, hiển thị công trình tại node hiện tại, chi phí, hiệu quả và trạng thái đã xây. Nút xây dựng gọi command canonical, không sửa state trực tiếp trong UI. Tối thiểu có Truyền Tống Trận và Hộ Giới Đại Trận.

Khu vực nghề chỉ hiển thị nghề chính sau khi đã chọn; không cho chọn nghề thường thứ hai. Nghề Ẩn chỉ xuất hiện như lựa chọn nghề phụ sau khi Cổ Tịch Tà Thần mở khóa. Thanh trạng thái hiển thị nghề chính trước, và thêm nghề phụ ẩn sau khi đã cố định.
