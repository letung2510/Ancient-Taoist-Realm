# RUNTIME SYMBOL INDEX — BẢNG TRUY VẾT FEATURE → CODE → DATA → TEST

## Core engine

| Feature | Runtime chính | Data/state | Test |
|---|---|---|---|
| Mệnh | `computeFate`, `computeStats`, `splitFateEffects`, `enhancedFateEffects` | `data/fate_data.js`, `state.fateInstances`, `player.fates`, `fateInventory` | `verify_game.js`, `verify_dichi_deep.js` |
| Con Đường | `pathMatchSummary`, `choosePath`, `performBreakthroughRitualStep`, `breakthroughRequirements` | `data/path_fate_relations.js`, `player.pathId`, `pathRitualState` | `verify_dichi_deep.js` |
| Đột phá | `doBreakthrough`, `breakthroughRitualStatus`, `applyBreakthrough` | `gameClock`, realm catalog, flags | `verify_game.js` |
| Công Pháp | `techniquePreview`, `useTechnique`, `updateTechniqueMastery`, `chooseTechniqueEvolution` | `data/cong_phap.js`, `player.techniques` | `verify_game.js`, expansion matrix |
| Search | `search`, `collectSearchFindings`, `investigateSearchFinding` | `searchSites`, `pendingSearch` | expansion matrix |
| Action | `contextState`, `resolveActionPriority`, `submitActionId`, `submitTurn` | pending combat/search/ritual | `verify_game.js` |
| Clock | `ensureGameClock`, `advanceGameTime`, `absoluteDay`, `clockLabel` | `gameClock` | `verify_game.js` |
| Log | `createGameEvent`, `renderGameEvent`, `renderScene`, `narrativeSafe`, `pushHistory` | `history`, `logState` | `verify_log_narrative.js`, expansion matrix |

## Expansion runtime

| Feature | Runtime chính | Data/state |
|---|---|---|
| World kernel | `advanceWorldSimulation`, `worldModifierPreview` | `worldSimulation`, `regionState` |
| Faction/war | `participateWar`, `joinTournament`, faction resolvers | `factionState`, `wars`, tournament state |
| NPC | `ensureNpcWorldState`, `npcWorldContext`, `resolveNpcWorldReaction`, `npcTalk` | `worldSimulation.npcState` |
| Weather | `setWeather`, `resolveNpcWorldReaction` | `regionState.weather` |
| Profession | `chooseProfessionLocked`, profession action functions | `professionState`, `hiddenProfessionChoices` |
| Cổ Tịch/Dị Chí | `inspectCodex`, `codexProgress`, `hiddenProfessionClue`, `registerCollection` | codex/discovery/collection state |
| Companion | companion recovery/mutation/expedition functions | `state.companion` |
| Quest/mail | quest, mail, contract, bounty functions | `questState`, task/mail arrays |
| Item/auction | `awakenItem`, `markHeirloom`, `repairHeirloom`, auction functions | item records, market/auction state |
| Hidden realm | `hiddenRealmEnter`, `exitHiddenRealm` | hidden realm/entry state |
| Fate evolution | fate evolution functions in expansion | `player.fateEvolutions` |

## UI runtime

| View | Function | Source DTO |
|---|---|---|
| Story log | `renderStoryWindow` | `state.history` events |
| Actions | `renderActions`, `actionPresentation` | `contextState`/priority resolver |
| Map | `setMapView`, `renderMapDetail`, `renderMapFactionDetail`, `adjustMapCamera` | map DTO |
| World | `renderWorld`, `renderExpansion` | expansion summary/view models |
| Fate | `renderFateDetail`, slot/evolution modals | Fate resolver DTO |
| Profession | `renderProfessionSection` | profession DTO |
| Construction | World tab construction section | structure/project DTO |

## Data loading

`data/data.js` is base data; `world_data.js` map/location; `fate_data.js` Mệnh; `fate_relationships.js` pair/combo/fusion; `path_fate_relations.js` path affinity; `profession_items.js` nghề/recipe; `expansion_data.js` world expansion; `npc_monsters.js` actor catalog; `cong_phap.js` technique catalog.

## Truy vết một action chuẩn

```text
UI click
 -> action id
 -> submitActionId
 -> action handler
 -> resolver/guard
 -> transaction mutate state
 -> pushHistory/createGameEvent
 -> UI render state + grouped story log
 -> serialize/archive
```

## Checklist truy vết khi thêm feature

- Có catalog/data source chưa?
- Có `ensure`/migration chưa?
- Có pure resolver preview chưa?
- Có action transaction + rollback chưa?
- Có cross-system modifier chưa?
- Có player-visible narrative/stat chưa?
- Có UI DTO/tab chưa?
- Có save/archive round-trip chưa?
- Có test positive/negative/idempotency/offline chưa?
- Có note gap trong catalog chưa?
