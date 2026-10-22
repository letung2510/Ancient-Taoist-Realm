# Runtime symbol index — feature → code → data → test

Bảng truy vết điểm vào runtime chính. Runtime mapping chi tiết theo rule nằm trong từng file chức năng `features/<feature>/*.md`.

## Core engine (`js/engine.js`)

| Feature | Runtime chính | Data/state | Test |
|---|---|---|---|
| [fate](../features/fate/README.md) | `computeFate`, `computeStats`, `splitFateEffects`, `enhancedFateEffects` | `data/fate_data.js`, `state.fateInstances`, `player.fates`, `fateInventory` | `verify_game.js`, `verify_dichi_deep.js` |
| [path](../features/path/README.md) | `pathMatchSummary`, `choosePath`, `performBreakthroughRitualStep`, `breakthroughRequirements` | `data/path_fate_relations.js`, `player.pathId`, `pathRitualState` | `verify_dichi_deep.js` |
| [realm-progression](../features/realm-progression/README.md) | `doBreakthrough`, `breakthroughRitualStatus`, `applyBreakthrough` | `gameClock`, realm catalog, flags | `verify_game.js` |
| [technique](../features/technique/README.md) | `techniqueCatalog`, `techniquePreview`, `useTechnique`, `resolveTechniqueCosts`, `techniqueFateResonance`, `updateTechniqueMastery` | `data/cong_phap.js`, `player.techniques` | `verify_review_batches.js`, `verify_technique_channel_matrix.js` |
| Search ([map](../features/map/README.md)) | `search`, `collectSearchFindings`, `investigateSearchFinding` | `searchSites`, `pendingSearch` | `verify_game.js`, `verify_review_batches.js` |
| Action ([ui-action-log](../features/ui-action-log/README.md)) | `contextState`, `resolveActionPriority`, `submitActionId`, `submitTurn` | pending combat/search/ritual | `verify_game.js`, `verify_action_dispatch_matrix.js` |
| Clock ([data-runtime](../features/data-runtime/README.md)) | `ensureGameClock`, `advanceGameTime`, `absoluteDay`, `clockLabel` | `gameClock` | `verify_game.js` |
| Log ([ui-action-log](../features/ui-action-log/README.md)) | `createGameEvent`, `renderGameEvent`, `renderScene`, `narrativeSafe`, `pushHistory` | `history`, `logState` | `verify_log_narrative.js`, `verify_log_producers.js` |

## Expansion runtime (`js/expansion.js`)

| Feature | Runtime chính | Data/state |
|---|---|---|
| [world-simulation](../features/world-simulation/README.md) | `advanceWorldSimulation`, `worldModifierPreview`, `participateWar`, `joinTournament` | `worldSimulation`, `regionState`, `factionState`, `wars` |
| [npc](../features/npc/README.md) | `ensureNpcWorldState`, `npcWorldContext`, `resolveNpcWorldReaction`, `npcTalk`, quest/mail/contract functions | `worldSimulation.npcState`, `questState`, `contractBoard` |
| [weather](../features/weather/README.md) | `setWeather`, `resolveNpcWorldReaction` | `regionState.weather` |
| [profession](../features/profession/README.md) | `chooseProfessionLocked`, `practiceProfession`, `recipeDefinition`, `recipeCatalog` | `professionState`, `hiddenProfessionState` |
| [discovery](../features/discovery/README.md) | `discover`, `discoveryStatusSummary`, `inspectCodex`, `codexProgress`, `registerCollection`, `hiddenRealmEnter`, `claimHiddenRealmCore`, `exitHiddenRealm` | `discoveries`, `worldSimulation.hiddenRealms` |
| [reward](../features/reward/README.md) | `grantCanonicalReward`, `previewCanonicalReward`, `rewardPolicySnapshot`, `resolveContestedOpportunity` | `rewardLedger`, `opportunityHistory` |
| [companion](../features/companion/README.md) | companion recovery/mutation/expedition functions | `state.companion` |
| Item/auction ([world-simulation](../features/world-simulation/README.md)) | `awakenItem`, `markHeirloom`, `repairHeirloom`, auction functions | item records, market/auction state |
| [technique](../features/technique/README.md) | `techniqueEligibility`, `acquireTechnique`, `guildTechniqueSnapshot`, `advanceTechniqueTrials`, `chooseTechniqueEvolution` | `flags.techniqueAcquisitionReceipts`, `guildMembership` |
| [fate](../features/fate/README.md) (evolution) | fate evolution functions | `player.fateEvolutions` |

## UI runtime (`js/ui.js`, `js/main.js`)

| View | Function | Source DTO |
|---|---|---|
| Story log | `renderStoryWindow` | `state.history` events |
| Actions | `renderActions`, `actionPresentation` | `contextState`/priority resolver |
| Map | `setMapView`, `renderMapDetail`, `renderMapFactionDetail`, `adjustMapCamera` | map DTO |
| World | `renderWorld`, `renderExpansion` | expansion summary/view models |
| Fate | `renderFateDetail`, slot/evolution modals | Fate resolver DTO |
| Profession | `renderProfessionSection` | profession DTO |
| Công Pháp | thẻ Công Pháp; `commitTechniqueAction` (main.js) | `techniquePreview`/eligibility DTO |
| Construction | World tab construction section | structure/project DTO |

## Data loading

| File | Nội dung |
|---|---|
| `data/data.js` | base data |
| `data/world_data.js` | map/location |
| `data/fate_data.js` | Mệnh |
| `data/fate_relationships.js` | pair/combo/fusion Mệnh |
| `data/path_fate_relations.js` | path affinity |
| `data/profession_items.js` | nghề/recipe |
| `data/expansion_data.js` | world expansion, `guildTechniquePolicies` |
| `data/npc_monsters.js` | actor catalog |
| `data/cong_phap.js` | technique catalog, `interactionCatalog` |
