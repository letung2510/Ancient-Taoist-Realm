/* Deep probes for the audit's former stale/uncertain runtime contracts. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const root = __dirname + '/..';
const context = { console, Math, Date, JSON, structuredClone: global.structuredClone };
context.window = context;
vm.createContext(context);
for (const file of ['data/world_data.js', 'data/data.js', 'data/fate_data.js', 'data/expansion_data.js', 'data/fate_relationships.js', 'js/i18n.js', 'js/engine.js', 'js/expansion.js']) {
  vm.runInContext(fs.readFileSync(root + '/' + file, 'utf8'), context, { filename: file });
}
const E = context.GameEngine, X = context.GameExpansion;
assert(E && X, 'canonical runtime missing');

// D1: every catalog resonance must be visible through the canonical breakdown;
// the effect remains data-driven because the catalog text is intentionally authored prose.
const resonant = (context.FATE_DATA || []).filter((f) => f.resonanceEffect);
assert(resonant.length > 0, 'resonance catalog is empty');
const resonanceState = E.createState('deep-resonance');
const resonanceFate = resonant[0];
resonanceState.player.fates = [resonanceFate.id];
resonanceState.player.fateRelationships = { [resonanceFate.id]: { stage: 3, resonanceUnlocked: true, resonanceEffect: resonanceFate.resonanceEffect } };
const resonanceBreakdown = E.fateEffectBreakdown(resonanceState.player, resonanceFate);
assert(resonanceBreakdown.resonance.active && resonanceBreakdown.resonance.effect === resonanceFate.resonanceEffect, 'resonance effect not exposed by canonical breakdown');

// D4/D6: canonical producer APIs must all be callable and must not mutate a preview.
const state = E.createState('deep-api');
assert(E.cultivationSourceCatalog().includes('canonical_reward'), 'cultivation source catalog missing canonical reward');
E.gainExp(state, 7, 'legacy_unknown_source', { sourceId: 'deep-source' });
assert(state.player.cultivation.velocitySamples.at(-1).source === 'system_other', 'unknown cultivation source was not normalized');
assert(E.validateCultivationAttribution(state).ok, 'cultivation attribution validator failed');
const apiGroups = [
  ['resolveMapTopology', 'getCurrentRegionViewModel', 'getLocalState', 'listLocalActivities', 'listRouteOptions', 'edgeState', 'mapIncidentPreview', 'settlementSnapshot'],
  ['travelTaskSnapshot', 'travelPlan', 'mapFogState', 'weatherSnapshot', 'discoveryStatusSummary'],
  ['buildTechniqueContext', 'resolveTechnique', 'validateTechniqueCrossSystemCatalog', 'validateTechniqueCrossSystemState'],
  ['validateCompanionState', 'selectCompanionTarget', 'simulateOfflineCompanionCombat', 'trustTrial', 'promotionEligibility', 'mediateAlliance', 'track_footprint', 'validateSaveEnvelope'],
  ['pathSwitchStatus', 'pathSwitchCandidates', 'getRegionalCultivationRankboard']
];
for (const names of apiGroups) for (const name of names) assert(typeof (E[name] || X[name]) === 'function', `missing canonical API: ${name}`);
const before = JSON.stringify({ player: state.player, inventory: state.inventory, locationId: state.locationId, meta: state.meta });
const local = X.getLocalState(state);
assert(local && typeof local === 'object', 'local state producer did not return DTO');
assert(JSON.stringify({ player: state.player, inventory: state.inventory, locationId: state.locationId, meta: state.meta }) === before, 'read-only map producer mutated gameplay state');
const techniqueAudit = X.validateTechniqueCrossSystemCatalog();
assert(techniqueAudit && Array.isArray(techniqueAudit.errors), 'technique catalog audit is not canonical');
const companionAudit = X.validateCompanionState(state);
assert(companionAudit && typeof companionAudit.ok === 'boolean', 'companion state audit is not canonical');

// D5: footprint and settlement producers expose bounded, capacity-aware state.
assert(typeof X.recordNpcFootprint === 'function' && typeof X.resolveNpcSettlements === 'function', 'NPC lifecycle producers missing');
const footprint = X.recordNpcFootprint(state, { npcId: 'npc_deep_probe' }, state.locationId, state.locationId, 1);
assert(footprint && footprint.sourceNodeId === state.locationId && footprint.clueClass, 'NPC footprint DTO missing source/clue fields');
X.ensureNpcWorldState(state);
const npc = Object.values(state.worldSimulation.npcState).find((entry) => entry.actorClass !== 'transactional_ephemeral') || Object.values(state.worldSimulation.npcState)[0];
assert(['persistent_named', 'bondable_encounter', 'transactional_ephemeral'].includes(npc.actorClass), 'NPC actor class missing');
assert(Number.isFinite(npc.ageDays) && Number.isFinite(npc.lifespanDays) && npc.homeLocationId, 'NPC lifespan/home canonical fields missing');
assert(X.rememberNpcIdentity(state, npc.npcId).success, 'NPC identity memory producer missing');
state.inventory.linh_thach = 20;
state.player.anchors = [{ id: 'deep-anchor', npcId: npc.npcId, stability: 40, maxStability: 100, status: 'active' }];
assert(X.nurtureHumanAnchor(state, 'deep-anchor', 20).success, 'anchor nurture producer missing');
assert(X.resolveHumanAnchorLifecycle(state, 'deep-anchor', { pressure: 70 }).anchor.status === 'broken', 'anchor broken lifecycle missing');
const competitorCatalog = X.competitorCatalog(), competitors = X.competitorProgressSnapshot(state, X.gameDayOrdinal(state) + 12);
assert(competitorCatalog.length > 0 && competitors.every((entry) => Number.isFinite(entry.value)), 'N51 competitor producer/catalog missing');
const hiddenCatalog = X.hiddenPathCatalog();
assert(hiddenCatalog.some((entry) => entry.sourceType === 'co_than_tan_hon') && hiddenCatalog.some((entry) => entry.sourceType === 'gameplay_trigger'), 'hidden path source catalog incomplete');
state.player.san = 100;
assert(X.resolveCoThanTanHonEncounter(state, 'seal').success, 'hidden path ritual producer missing');
assert(X.resolveCoThanTanHonEncounter(state, 'seal').alreadyResolved, 'hidden path once-per-character guard missing');
const reduced = X.resolvePerformanceProfile({ reducedMotion: true, hardwareConcurrency: 2, deviceMemory: 1 });
assert(reduced.id === 'reduced' && reduced.mapRenderBudget < X.resolvePerformanceProfile({}).mapRenderBudget, 'reduced performance profile missing');
const clockAudit = E.validateWorldClockState(state);
assert(typeof E.validateWorldClockState === 'function' && clockAudit.ok, 'world clock canonical validator failed: ' + JSON.stringify(clockAudit));

// C6: hidden-realm entry/exit is a movement boundary, not a raw teleport.
// A pending discovery must require explicit confirmation and only then be cleared.
const realm = (context.EXPANSION_DATA?.hiddenRealms || [])[0];
assert(realm && typeof X.hiddenRealmEnter === 'function' && typeof X.exitHiddenRealm === 'function', 'hidden realm movement APIs missing');
const realmState = E.createState('deep-hidden-boundary');
X.ensureExpansionState(realmState);
realmState.locationId = realm.parentNodeId;
realmState.worldSimulation.hiddenRealms[realm.id] = { status: 'open', cycleIndex: 1, closesDay: X.gameDayOrdinal(realmState) + 5, claimedRewardKeys: [] };
realmState.pendingSearch = { id: 'deep-pending', locationId: realm.parentNodeId, expiresTurn: Number(realmState.meta.turn) + 5 };
const blockedEntry = X.hiddenRealmEnter(realmState, realm.id);
assert(blockedEntry && blockedEntry.requiresConfirmation === true && realmState.pendingSearch, 'hidden realm entry bypassed departure confirmation');
const entered = X.hiddenRealmEnter(realmState, realm.id, { confirmPendingDeparture: true });
assert(entered.success && realmState.activeHiddenRealm && !realmState.pendingSearch, 'confirmed hidden realm entry did not clear pending discovery');
realmState.pendingSearch = { id: 'deep-pending-exit', locationId: realmState.locationId, expiresTurn: Number(realmState.meta.turn) + 5 };
const blockedExit = X.exitHiddenRealm(realmState);
assert(blockedExit && blockedExit.requiresConfirmation === true && realmState.pendingSearch, 'hidden realm exit bypassed departure confirmation');
const exited = X.exitHiddenRealm(realmState, { confirmPendingDeparture: true });
assert(exited.success && !realmState.activeHiddenRealm && !realmState.pendingSearch, 'confirmed hidden realm exit did not clear pending discovery');

// C5: failed market/gift commits must restore every mutation made before the
// canonical receipt/event boundary.
const marketState = E.createState('deep-market-rollback');
const duplicateFate = (context.FATE_DATA || [])[0];
assert(duplicateFate, 'market rollback fixture fate missing');
marketState.fateInventory = [duplicateFate.id];
marketState.player.fateInstances = { [duplicateFate.id]: { fateId: duplicateFate.id, source: 'fixture' } };
marketState.inventory.linh_thach = 50;
marketState.market = { generatedDay: 1, offers: [{ id: duplicateFate.id, kind: 'fate', price: { linhThach: 10 } }], purchased: {} };
const beforeMarket = JSON.stringify({ inventory: marketState.inventory, fateInventory: marketState.fateInventory, essence: marketState.player.fateExcessEssence || 0, history: marketState.history, logState: marketState.logState });
const failedPurchase = E.buyMarketOffer(marketState, duplicateFate.id);
assert(!failedPurchase.success, 'duplicate market fate unexpectedly committed');
assert(JSON.stringify({ inventory: marketState.inventory, fateInventory: marketState.fateInventory, essence: marketState.player.fateExcessEssence || 0, history: marketState.history, logState: marketState.logState }) === beforeMarket, 'market failure leaked a partial mutation');

const giftState = E.createState('deep-gift-rollback');
X.ensureNpcWorldState(giftState);
const giftNpc = Object.values(giftState.worldSimulation.npcState)[0];
assert(giftNpc, 'gift rollback NPC fixture missing');
giftNpc.currentNodeId = giftState.locationId;
const giftItem = Object.values(context.GameData.ITEMS || {}).find((item) => item.kind === 'consumable' && !item.questItem);
assert(giftItem, 'gift rollback item fixture missing');
giftState.inventory[giftItem.id] = 2;
const firstGift = X.giftNpc(giftState, giftNpc.npcId, giftItem.id);
assert(firstGift.success, 'initial gift fixture failed');
const beforeDuplicateGift = Number(giftState.inventory[giftItem.id] || 0);
const secondGift = X.giftNpc(giftState, giftNpc.npcId, giftItem.id);
assert(!secondGift.success && Number(giftState.inventory[giftItem.id] || 0) === beforeDuplicateGift, 'duplicate gift did not restore item: ' + JSON.stringify({ firstGift, secondGift, beforeDuplicateGift, after: giftState.inventory[giftItem.id], item: giftItem.id }));

const craftState = E.createState('deep-craft-rollback');
X.ensureExpansionState(craftState);
craftState.professionState.primaryId = 'luyen_khi';
craftState.professionState.records ||= {};
craftState.professionState.records.luyen_khi ||= { id: 'luyen_khi', masteryExp: 0, masteryStage: 0, lastActionDay: 0 };
craftState.inventory.linh_thach = 12;
craftState.player.stamina = 30;
const beforeCraft = JSON.stringify({ inventory: craftState.inventory, stamina: craftState.player.stamina, record: craftState.professionState.records.luyen_khi, history: craftState.history, logState: craftState.logState });
const createLootBefore = E.createLootItem;
E.createLootItem = () => null;
const failedCraft = X.craftArtifact(craftState);
E.createLootItem = createLootBefore;
assert(!failedCraft.success, 'forced craft failure unexpectedly succeeded');
assert(JSON.stringify({ inventory: craftState.inventory, stamina: craftState.player.stamina, record: craftState.professionState.records.luyen_khi, history: craftState.history, logState: craftState.logState }) === beforeCraft, 'craft failure leaked material, mastery or log mutation');

// C2/C4: gameplay clocks and dynamic producers must use game-day/state-owned
// keys; static catalogs remain read-only across ensure, discovery and loot.
const engineSource = fs.readFileSync(root + '/js/engine.js', 'utf8');
const expansionSource = fs.readFileSync(root + '/js/expansion.js', 'utf8');
const bodyBetween = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
assert(!bodyBetween(engineSource, 'function processChuyenSinh', '/* ---------- Descriptions ---------- */').includes('Date.now'), 'reincarnation cooldown still uses wall clock');
assert(!bodyBetween(engineSource, 'function refreshMarket', 'function refreshBlackMarket').includes('Date.now'), 'market refresh still uses wall clock');
assert(!bodyBetween(engineSource, 'function createGameEvent', 'function normalizeHistoryEvent').includes('Date.now'), 'event identity still uses wall clock');
assert(!bodyBetween(engineSource, 'function createState', 'function updateDerived').includes('expiresAt: Date.now'), 'quest expiry still uses dead wall-clock timer');
const catalogKeysBefore = JSON.stringify({ items: Object.keys(context.GameData.ITEMS || {}), quests: Object.keys(context.GameData.QUESTS || {}) });
const catalogState = E.createState('deep-catalog-isolation');
X.ensureExpansionState(catalogState);
E.createLootItem(catalogState, 'artifact', 'deep-catalog');
X.refreshAuction(catalogState, X.gameDayOrdinal(catalogState));
const catalogKeysAfter = JSON.stringify({ items: Object.keys(context.GameData.ITEMS || {}), quests: Object.keys(context.GameData.QUESTS || {}) });
assert(catalogKeysAfter === catalogKeysBefore, 'dynamic producer mutated static item/quest catalog');
const questRewardState = E.createState('deep-quest-reward-cap');
const questId = E.ensureSearchChainQuest(questRewardState, questRewardState.locationId, 1);
const questRewardId = questRewardState.quests[questId]?.rewardFateId || questRewardState.questDefinitions?.[questId]?.reward?.fate;
const questReward = E.fateDefinition(questRewardId);
const questGradeCap = Math.min(8, Math.max(1, E.cultivationTier(questRewardState) + 1));
assert(questReward && Number(E.GRADE_TO_TIER[questReward.grade] || 0) <= questGradeCap && questReward.sign !== 'hung', 'search-chain reward escaped progression cap: ' + JSON.stringify({ questId, rewardId: questRewardId, definition: questRewardState.questDefinitions?.[questId], tier: E.cultivationTier(questRewardState), cap: questGradeCap }));

const caveState = E.createState('deep-cave-challenge');
X.ensureExpansionState(caveState);
const caveNode = caveState.locationId;
caveState.openWorld.nodes[caveNode] ||= { id: caveNode };
const caveRuntime = X.mapNode(caveState, caveNode) || (caveState.openWorld.nodes[caveNode] = { id: caveNode });
caveRuntime.caveAbode = { status: 'challenge', discoveredDay: X.gameDayOrdinal(caveState), claimedByPlayerId: null, lootInitialized: false, obstacles: ['guardian', 'formation', 'sealed_ward'] };
caveState.pendingCaveChallenge = { nodeId: caveNode, status: 'pending', obstacles: ['guardian', 'formation', 'sealed_ward'] };
const savedStamina = Number(caveState.player.stamina || 0), savedSan = Number(caveState.player.san || 0);
caveState.player.stamina = 0;
const blockedCave = X.resolveCaveChallenge(caveState);
assert(!blockedCave.success && caveState.pendingCaveChallenge.completed?.length !== 1, 'cave challenge bypassed resource gate');
caveState.player.stamina = Math.max(20, savedStamina); caveState.player.san = Math.max(20, savedSan); caveState.player.comprehension = Math.max(20, Number(caveState.player.comprehension || 0));
for (const obstacle of ['guardian', 'formation', 'sealed_ward']) {
  const result = X.resolveCaveChallenge(caveState, obstacle);
  assert(result.success, 'cave obstacle failed: ' + obstacle + ' ' + JSON.stringify(result));
}
assert(caveState.pendingCaveChallenge.status === 'resolved' && caveRuntime.caveAbode.status === 'claimed' && caveRuntime.caveAbode.lootInitialized, 'cave challenge did not finalize canonical claim');
const duplicateCave = X.resolveCaveChallenge(caveState);
assert(!duplicateCave.success, 'resolved cave challenge was not idempotent');

const successionState = E.createState('deep-npc-succession');
X.ensureExpansionState(successionState);
const successionNpcs = Object.values(successionState.worldSimulation.npcState);
const elder = successionNpcs[0], student = successionNpcs[1];
assert(elder && student, 'NPC succession fixtures missing');
elder.status = 'alive'; elder.role = 'trưởng lão'; elder.currentNodeId = successionState.locationId;
student.status = 'alive'; student.relationshipsWithNpcs ||= {}; student.relationshipsWithNpcs[elder.npcId] = { type: 'su_do', score: 50 };
successionState.questState.active ||= {}; successionState.questState.failed ||= {};
successionState.questState.active.transferable_daily = { id: 'transferable_daily', giverNpcId: elder.npcId, transferable: true, daily: true, status: 'active' };
successionState.questState.active.fixed_quest = { id: 'fixed_quest', giverNpcId: elder.npcId, transferable: false, status: 'active' };
X.resolveNpcSuccession(successionState, elder, X.gameDayOrdinal(successionState) + 1);
assert(elder.status === 'deceased' && student.successorOf === elder.npcId, 'NPC succession did not select successor');
assert(successionState.questState.active.transferable_daily.giverNpcId === student.npcId, 'transferable daily quest did not transfer');
assert(successionState.questState.failed.fixed_quest?.status === 'failed', 'non-transferable quest did not fail on NPC death');

// M65-M78: teaching must be a producer-backed action, not a UI-only shortcut.
const teachingState = E.createState('deep-guild-teaching');
X.ensureExpansionState(teachingState);
E.enterLuyenKhi(teachingState, 'deep guild teaching fixture');
const teachingGuild = (context.GameData.GUILDS || [])[0];
assert(teachingGuild, 'guild teaching fixture missing guild catalog');
teachingState.guildMembership = { guildId: teachingGuild.id, rankId: 'disciple', rankIndex: 2, rank: 'Chân Truyền Đệ Tử', status: 'active' };
teachingState.player.realmId = (context.GameData.REALMS || [])[Math.min(2, (context.GameData.REALMS || []).length - 1)]?.id || teachingState.player.realmId;
E.updateDerived(teachingState);
const teacher = Object.values(teachingState.worldSimulation.npcState)[0];
assert(teacher, 'guild teacher NPC fixture missing');
teacher.status = 'alive'; teacher.currentNodeId = teachingState.locationId; teacher.currentSubLocationId = teachingState.currentSubLocationId; teacher.factionId = teachingGuild.id; teacher.canTeachRareTechnique = true;
teacher.aiState = 'present';
const teacherRoutine = X.npcRoutineAt(teachingState, teacher);
if (teacherRoutine?.subLocationId) teachingState.currentSubLocationId = teacher.currentSubLocationId = teacherRoutine.subLocationId;
const vault = X.guildVaultSnapshot(teachingState, teachingGuild.id);
const teachable = vault.techniques.find((entry) => !entry.learned);
assert(vault.unlocked && teachable, 'guild vault teaching producer did not expose an unread technique');
teachingState.npcTrustTrials ||= {};
teachingState.npcTrustTrials[teacher.npcId] = { id: 'deep-teach-trial', npcId: teacher.npcId, status: 'passed', resolvedDay: X.gameDayOrdinal(teachingState) };
const actionId = 'act_exp_npc_train:' + teacher.npcId + ':' + teachable.id;
const teachingActions = X.expansionActions(teachingState);
assert(teachingActions.some((entry) => entry.id === actionId), 'guild teaching action was not produced in canonical expansion context');
const teachingResult = X.runExpansionCommand(teachingState, 'npc_train', teacher.npcId, teachable.id);
assert(teachingResult?.success && teachingState.player.techniques?.[teachable.id], 'NPC teaching action did not commit canonical technique learning');
assert(X.guildVaultSnapshot(teachingState, teachingGuild.id).techniques.find((entry) => entry.id === teachable.id)?.learned, 'guild vault did not reflect learned teaching result');
const remainingTeachable = X.guildVaultSnapshot(teachingState, teachingGuild.id).techniques.filter((entry) => !entry.learned);
remainingTeachable.forEach((entry) => {
  const entryActionId = 'act_exp_npc_train:' + teacher.npcId + ':' + entry.id;
  assert(X.expansionActions(teachingState).some((action) => action.id === entryActionId), 'guild teaching action missing for vault entry ' + entry.id);
  const entryResult = X.runExpansionCommand(teachingState, 'npc_train', teacher.npcId, entry.id);
  assert(entryResult?.success && teachingState.player.techniques?.[entry.id], 'guild teaching commit failed for vault entry ' + entry.id);
  assert(X.guildVaultSnapshot(teachingState, teachingGuild.id).techniques.find((candidate) => candidate.id === entry.id)?.learned, 'guild vault did not persist learned entry ' + entry.id);
});

// B.6: special-physique rejection is a real producer, and reviveOnce is a
// one-shot consumer rather than a passive catalog field.
const physiqueState = E.createState('deep-physique-boundary');
const physiqueCatalog = X.specialPhysiqueCatalog();
const rejectDefinition = Object.values(physiqueCatalog)[0];
assert(rejectDefinition, 'special physique catalog fixture missing');
const progressResult = X.recordSpecialPhysiqueProgress(physiqueState, { type: rejectDefinition.trigger, amount: rejectDefinition.progressThreshold, eventId: 'deep-reject-progress' });
assert(progressResult.success && physiqueState.specialPhysiqueState.candidates[rejectDefinition.id], 'special physique candidate producer missing');
const rejected = X.rejectSpecialPhysique(physiqueState, rejectDefinition.id);
assert(rejected.success && physiqueState.specialPhysiqueState.rejectedIds.includes(rejectDefinition.id), 'special physique rejection was not persisted');
X.recordSpecialPhysiqueProgress(physiqueState, { type: rejectDefinition.trigger, amount: rejectDefinition.progressThreshold, eventId: 'deep-reject-progress-2' });
assert(!physiqueState.specialPhysiqueState.candidates[rejectDefinition.id], 'rejected special physique reappeared');
const reviveDefinition = physiqueCatalog.bat_tu_the || Object.values(physiqueCatalog).find((entry) => entry.stageEffects?.some((effect) => effect.reviveOnce));
assert(reviveDefinition, 'reviveOnce catalog fixture missing');
physiqueState.specialPhysiqueState.activeId = reviveDefinition.id;
physiqueState.player.specialPhysique = reviveDefinition.id;
physiqueState.specialPhysiqueState.history = [{ id: reviveDefinition.id, trigger: reviveDefinition.trigger, day: 1, stage: 1, result: { stage: 1 } }];
physiqueState.player.hp = 1; physiqueState.player.maxHp = Math.max(20, Number(physiqueState.player.maxHp || 20)); physiqueState.flags.reviveOnceUsed = false;
const revived = E.applyPlayerDamage(physiqueState, 999);
assert(revived.revived === true && physiqueState.flags.reviveOnceUsed === true && physiqueState.player.hp > 0, 'reviveOnce consumer did not trigger exactly at lethal damage');
const secondLethal = E.applyPlayerDamage(physiqueState, 999);
assert(secondLethal.reviveOnce !== true && physiqueState.player.hp === 0, 'reviveOnce triggered more than once');

// B.3: merchant gift modes share one transaction producer but expose separate
// canonical semantics and action IDs.
const giftNpc2 = Object.values(physiqueState.worldSimulation.npcState || {}).find((entry) => /merchant|thương|buôn/i.test(String(entry.role || ""))) || (physiqueState.worldSimulation.npcState.deep_merchant = { npcId: 'deep_merchant', name: 'Deep Merchant', role: 'merchant', status: 'alive', actorClass: 'bondable_encounter', currentNodeId: physiqueState.locationId, currentSubLocationId: physiqueState.currentSubLocationId, preferences: ['trade'] });
giftNpc2.status = 'alive'; giftNpc2.currentNodeId = physiqueState.locationId; giftNpc2.actorClass = 'bondable_encounter'; giftNpc2.preferences = ['trade'];
const giftItem2 = Object.values(context.GameData.ITEMS || {}).find((entry) => !['quest', 'key', 'currency'].includes(entry.kind));
assert(giftItem2, 'gift mode item fixture missing');
physiqueState.inventory[giftItem2.id] = 2;
const tradeGift = X.giftTrade(physiqueState, giftNpc2.npcId, giftItem2.id);
assert(tradeGift.success && tradeGift.mode === 'trade' && Number(giftNpc2.tradeFavor) > 0, 'trade gift mode did not persist merchant favor');
const bondGift = X.giftBond(physiqueState, giftNpc2.npcId, giftItem2.id);
assert(bondGift.success && bondGift.mode === 'bond', 'bond gift mode did not use canonical relationship producer');

console.log('OK: deep audit probes (resonance, map/world, technique, companion, NPC lifecycle)');
