# CANONICAL STATE SCHEMA — HỢP ĐỒNG DỮ LIỆU LIÊN FEATURE

Tài liệu này là schema định hướng cho save/state. Catalog definitions nằm ở `data/*`; object dưới đây là state mutable. Field mới phải có migration và không được đổi nghĩa field cũ âm thầm.

## Root

```js
GameState = {
  schemaVersion: 13,
  meta: { turn, createdAt, updatedAt },
  gameClock: { year, month, day, absoluteDay, season, timeOfDay },
  player: PlayerState,
  locationId, currentSubLocationId,
  history: GameEvent[], logState: LogState,
  mapState: MapState, worldSimulation: WorldSimulation,
  professionState: ProfessionState,
  pathRitualState: PathRitualState,
  questState: QuestState,
  flags: Flags,
  inventory: {}, equipment: {},
  searchSites: {}, pendingSearch: null,
  market: MarketState, archive: ArchiveMeta
}
```

## PlayerState

```js
PlayerState = {
  id, name, realmId, exp, lifespan, currentAge,
  basePhy, baseMag, aptitude, comprehension, hp, maxHp,
  qi, maxQi, stamina, maxStamina, san, maxSan,
  pathId, secondaryPathId, professionId,
  techniques: { [techniqueId]: TechniqueProgress },
  techniqueCooldowns: {},
  fates: [], fateInventory: [], fateInstances: { [instanceId]: FateInstance },
  fateEnhancements: {}, fateEvolutions: {},
  hiddenProfession: null, hiddenProfessionCandidate: null,
  tainted: TaintedState, physique: PhysiqueState,
  anchors: [], relationships: {}, companion: null
}
```

## World/map

```js
MapState = {
  discoveredNodes: {}, fog: {}, completion: {}, nodeHistory: {},
  claims: {}, structures: {}, influenceCache: {}, routeCache: {},
  invalidExits: []
}
WorldSimulation = {
  lastProcessedDay, regionState: {}, factionState: {},
  wars: {}, incidents: {}, tournament: {},
  npcState: {}, npcEncounters: {}, rumors: [], worldEvents: {}
}
```

## Profession/path

```js
ProfessionState = {
  primaryId: null, hiddenId: null,
  selectionLocked: false, hiddenUnlocked: false,
  mastery: {}, history: [], unlockSources: []
}
PathRitualState = {
  paths: { [pathId]: { milestones: {}, failureLog: [], status, expectedStep } }
}
```

## Event

```js
GameEvent = {
  id, type, uiType, subtype, timestamp, clock, turn,
  action, context, result, changes, statDisplay,
  event_flags, importance, severity, narrative, text,
  debugOnly: false
}
```

`text` là output render/cache; state nghiệp vụ không được parse ngược từ text. `statDisplay` là mảng hiển thị cuối scene; narrative không chứa stat syntax.

## Migration rules

1. Missing object/array tạo default.
2. `player.fates` ID cũ tạo `fateInstances` ổn định.
3. `hiddenProfession` cũ map về `professionState.hiddenId` nếu hợp lệ.
4. `pathId` không được map sang profession ID.
5. Dị Thể/tainted field cũ giữ riêng, không map sang path.
6. History legacy được bọc thành `GameEvent` với `event_flags.legacy = true` và render lại.
7. Invalid catalog reference không xóa âm thầm; ghi migration warning và bỏ khỏi active calculation.

## Invariants

- active fate không trùng instance và không vượt slot.
- primary profession tối đa một; sau khi set không được chọn primary khác.
- hidden profession chỉ tồn tại khi `hiddenUnlocked` và có source Cổ Tịch hợp lệ.
- location/sub-location phải thuộc cùng node.
- structure phải thuộc node tồn tại.
- NPC current node hợp lệ, status terminal không tiếp tục scheduler.
- archive payload serialize/deserialize round-trip không đổi giá trị canonical.
