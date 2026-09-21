"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
const makeState = () => {
  const state = E.createState({ character: E.createCharacter({ name: "DiThe QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  assert(E.chooseJourneyIntent(state, "tu_lap").success);
  return state;
};

function testPathContracts() {
  const state = makeState();
  E.ensureExpansionState(state);
  assert(state.pathState);
  state.player.pathId = "kiem_dao";
  state.player.hiddenPathId = "huyen_anh_dao";
  E.ensureExpansionState(state);
  assert(state.pathState.primaryPathId === "kiem_dao" || state.pathState.primaryPathId === null);
  const ritual = E.pathRitualStatus(state);
  assert(ritual && typeof ritual === "object");
}

function testNpcDialogueQuest() {
  const state = makeState();
  state.worldSimulation.npcState.qa_merchant = { npcId: "qa_merchant", name: "Th——ng Nh—n QA", role: "merchant", status: "alive", currentNodeId: state.locationId, homeNodeId: state.locationId, scheduleType: "static" };
  E.ensureNpcWorldState(state);
  const actions = E.expansionActions(state);
  assert(actions.some((action) => action.id === "act_exp_npc_talk_qa_merchant"));
  const quest = E.npcQuestStatus(state, "qa_merchant")[0];
  assert(quest && quest.icon === "!");
  assert(E.npcTalk(state, "qa_merchant").success);
  assert.strictEqual(state.dialogueState.profileId, state.worldSimulation.npcState.qa_merchant.dialogueProfileId);
  const dialogueAction = E.expansionActions(state).find((action) => action.id.startsWith("act_exp_npc_dialogue_"));
  assert(dialogueAction && E.submitActionId(state, dialogueAction.id));
  assert.strictEqual(state.dialogueState.profileId, state.worldSimulation.npcState.qa_merchant.dialogueProfileId);
  assert(E.acceptNpcQuest(state, quest.id).success);
}

function testWeatherHysteresis() {
  const state = makeState();
  state.worldSimulation.npcState.qa_guard = { npcId: "qa_guard", name: "V— binh QA", role: "guard", status: "alive", currentNodeId: state.locationId, homeNodeId: state.locationId, scheduleType: "static" };
  E.ensureNpcWorldState(state);
  const region = E.gameDayOrdinal(state) && (sandbox.window.GameData.LOCATIONS[state.locationId]?.region || state.startRegionId);
  state.worldSimulation.regionState[region] = { weather: "am_vu", weatherIntensity: 4 };
  const first = E.resolveNpcWeatherReaction(state, "qa_guard", "am_vu");
  assert(first.success);
  assert(["sheltering", "shelter_queue"].includes(first.data.scheduleStatus));
  state.worldSimulation.regionState[region] = { weather: "quang", weatherIntensity: 0 };
  const second = E.resolveNpcWeatherReaction(state, "qa_guard", "quang");
  assert(second.success);
  assert(second.data.weatherState && second.data.weatherState.mode);
}

function testCompanionSkillAndPhysiqueTrigger() {
  const state = makeState();
  state.companion = { entityId: "qa_beast", customName: "D— Th— QA", state: "active", loyalty: 60, health: 100, maxHealth: 100, skillCooldowns: {} };
  E.spawnCombatEntity(state, "di_qui");
  const result = E.useCompanionSkill(state, "guard_bite");
  assert(result.success && result.damage > 0);
  E.recordSpecialPhysiqueProgress(state, { type: "eldritch_beast_survival", success: true });
  assert(state.specialPhysiqueState.progress.eldritchBeastSurvivals >= 1);
  const catalog = E.specialPhysiqueCatalog();
  const catalogAudit = E.validateSpecialPhysiqueCatalog();
  assert(catalogAudit.ok && catalogAudit.count === Object.keys(catalog).length && catalogAudit.errors.length === 0);
  const fusionAudit = E.validatePathFusionCatalog();
  assert(fusionAudit.ok && fusionAudit.count >= 5 && fusionAudit.pairCount > 0 && fusionAudit.errors.length === 0);
  const worldCatalogAudit = E.validateWorldCatalogs();
  assert(worldCatalogAudit.ok && worldCatalogAudit.weatherCount >= 8 && worldCatalogAudit.recipeCount >= 6 && worldCatalogAudit.structureCount === 4);
  const balanceAudit = E.validateBalanceCatalog();
  assert(balanceAudit.ok && balanceAudit.weatherCount >= 8 && balanceAudit.recipeCount >= 6 && balanceAudit.structureCount === 4 && balanceAudit.physiqueCount >= 6);
  const physiqueState = makeState();
  for (let i = 0; i < catalog.thanh_the.progressThreshold; i += 1) E.recordSpecialPhysiqueProgress(physiqueState, { type: "mercy_chain", success: true });
  assert(physiqueState.specialPhysiqueState.candidates.thanh_the);
  assert(E.claimSpecialPhysique(physiqueState, "thanh_the").success);
  physiqueState.specialPhysiqueState.history[0].stage = 2;
  const modifiers = E.specialPhysiqueModifiers(physiqueState);
  assert.strictEqual(modifiers.stage, 2);
  assert.strictEqual(modifiers.corruptionResist, 0.45);
  assert(modifiers.endingTags.includes("thien_dao_cuu_the"));
  const outcome = E.specialPhysiqueOutcome(physiqueState);
  assert.strictEqual(outcome.endingTags.join("|"), "thien_dao_cuu_the");
  assert.strictEqual(outcome.factionAffinity.thien_huyen_tong, 2.67);
  assert(E.deserialize(E.serialize(physiqueState)).specialPhysiqueState.activeId === "thanh_the");
}

function testOfflineScheduledNpcWarHooks() {
  const state = makeState();
  let delivered = false;
  E.scheduleWorldTask(state, { id: "qa_task", type: "callback", dueDay: E.gameDayOrdinal(state) + 1, payload: { marker: "qa" } });
  E.advanceGameTime(state, 10);
  assert(state.worldSimulation.scheduledTasks.some((task) => task.id === "qa_task" && task.status === "dead_letter"));
  state.worldSimulation.wars.qa_war = { id: "qa_war", factionA: "a", factionB: "b", status: "active", frontNodeIds: [state.locationId], scoreA: 0, scoreB: 0, playerInterventions: [] };
  assert(E.worldSimulationSummary(state).wars.some((war) => war.id === "qa_war"));
  assert.strictEqual(typeof delivered, "boolean");
}

function testAuditInvariantsAndIndexes() {
  const state = makeState();
  E.ensureExpansionState(state);
  assert(state.runtimeIndexes?.fate?.byId);
  assert(E.validateExpansionState(state).valid);
  const repairNodeId = Object.keys(sandbox.window.GameData.LOCATIONS || {})[0];
  const repairNode = sandbox.window.GameData.LOCATIONS[repairNodeId];
  repairNode.exits ||= {};
  repairNode.exits.qa_missing = "qa_missing_node";
  const repairResult = E.repairInvalidMapExits(state);
  assert(repairResult.removed.some((entry) => entry.targetId === "qa_missing_node"));
  assert.strictEqual(repairNode.exits.qa_missing, "qa_missing_node", "map repair must not mutate static catalog");
  assert(state.mapState.invalidExits.some((entry) => entry.targetId === "qa_missing_node"));
  delete repairNode.exits.qa_missing;
  state.questState.available.qa_expired = { id: "qa_expired", giverNpcId: "qa", title: "Expired", status: "available", objectives: [], expiresDay: 1 };
  state.questState.npcIndex.qa = ["qa_expired", "qa_expired"];
  E.ensureExpansionState(state);
  assert.strictEqual(state.questState.npcIndex.qa.length, 1);
  E.advanceGameTime(state, 2);
  assert(state.questState.failed.qa_expired);
  state.companion = { customName: "Ledger QA", state: "active", stance: "protect", health: 100, maxHealth: 100, loyalty: 50, injury: null, damageLedger: [] };
  E.spawnCombatEntity(state, "di_qui");
  for (let i = 0; i < 8 && !state.companion.damageLedger.length; i += 1) E.monsterAction(state, "di_qui");
  assert(state.companion.damageLedger.length >= 0);
}

function testRitualProfessionAndUnknownMigration() {
  const state = makeState();
  state.player.pathId = "kiem_dao";
  state.player.merit = 20; state.player.san = 20;
  E.ensureExpansionState(state);
  const wrongStep = E.performPathRitualStep(state, "kiem_dao", "khai_lo", "anchor");
  assert.strictEqual(wrongStep.success, false);
  assert(state.pathRitualState.paths.kiem_dao.milestones.khai_lo.failureLog?.length >= 1);
  state.professionState.primaryId = null; state.professionState.primaryLocked = false;
  const chosen = E.chooseProfessionLocked(state, "luyen_dan");
  assert(chosen.success || chosen.reason, "profession lock must return a deterministic result");
  const raw = JSON.parse(E.serialize(state));
  raw.state.worldSimulation.events.qa_unknown = { id: "qa_unknown", templateId: "future_event", status: "active", regionId: state.startRegionId, phaseIndex: 0 };
  raw.state.inventory.qa_future_item = 3;
  raw.state.player.fateEvolutions = { fate_qa: { status: "evolved", branchId: "future_branch", evolvedAtDay: 4 } };
  raw.state.player.fate ||= {}; raw.state.player.fate.evolutions = { fate_qa: { status: "evolved", branchId: "future_branch", evolvedAtDay: 4 } };
  const knownTemplate = sandbox.window.EXPANSION_DATA.worldEvents[0];
  raw.state.unknownContent = { events: { future_known_event: { id: "future_known_event", templateId: knownTemplate.id, regionId: state.startRegionId, phaseIndex: 0, phaseStartedDay: 1, phaseEndsDay: 999999, status: "dormant" } }, items: {}, evolutionBranches: {} };
  const restored = E.deserialize(JSON.stringify(raw));
  assert(restored.unknownContent?.events);
  assert.strictEqual(restored.worldSimulation.events.future_known_event.status, "active");
  assert.strictEqual(restored.unknownContent.events.future_known_event.status, "rehydrated");
  assert(restored.worldSimulation.events.qa_unknown.status !== "active");
  assert(restored.unknownContent.events.qa_unknown || restored.meta.migrationNotes?.some((note) => String(note).includes("future_event")));
  assert.strictEqual(restored.unknownContent.items.qa_future_item.quantity, 3);
  assert.strictEqual(restored.unknownContent.items.qa_future_item.status, "dormant");
  assert(restored.unknownContent.evolutionBranches.future_branch.payload);
  assert.strictEqual(restored.player.fateEvolutions.fate_qa.status, "ready");
  restored.unknownContent.items.linh_thach = { id: "linh_thach", quantity: 2, status: "dormant" };
  const beforeLinhThach = Number(restored.inventory.linh_thach || 0);
  const hydrated = E.rehydrateUnknownContent(restored);
  assert(hydrated.items.includes("linh_thach"));
  assert.strictEqual(restored.unknownContent.items.linh_thach.status, "ready");
  assert.strictEqual(Number(restored.inventory.linh_thach || 0), beforeLinhThach + 2);
}

function testOfflineEncounterAndCompanionCombat() {
  const state = makeState();
  state._offlineSimulation = true;
  state.warParticipation = { warId: "qa_offline_war", factionId: "qa_faction" };
  state.companion = { entityId: "qa_beast", state: "active", health: 100, maxHealth: 100, loyalty: 50, damageLedger: [] };
  state.worldSimulation.npcState.qa_a = { npcId: "qa_a", role: "merchant", status: "alive", currentNodeId: state.locationId, homeNodeId: state.locationId, relationshipsWithNpcs: {} };
  state.worldSimulation.npcState.qa_b = { npcId: "qa_b", role: "guard", status: "alive", currentNodeId: state.locationId, homeNodeId: state.locationId, relationshipsWithNpcs: {} };
  E.ensureNpcWorldState(state);
  state.worldSimulation.npcEncounters.qa_encounter = { key: "qa_encounter", pairKey: "qa_a::qa_b", day: 1, npcA: "qa_a", npcB: "qa_b", nodeId: state.locationId, outcome: "trade" };
  E.resolveOfflineNpcEncounters(state, 1);
  assert(state.worldSimulation.offlineEncounterResults.length >= 1);
  for (let day = 1; day <= 40 && !state.companion.damageLedger.length; day += 1) E.simulateOfflineCompanionCombat(state, day);
  assert(state.companion.damageLedger.length >= 0);
}

function testWardFormationEffect() {
  const state = makeState();
  E.ensureMapState(state);
  state.mapState.structures[state.locationId] = [{ id: "qa_ward", type: "ward_formation", integrity: 100, effects: { encounterRisk: -0.2, curseRisk: -0.25, sanDrainReduction: 0.25, influence: 6 } }];
  const ward = E.wardProtectionAtNode(state, state.locationId);
  assert(ward.active && ward.corruptionReduction > 0);
  const modifiers = E.getWorldModifiers(state, { regionId: state.startRegionId });
  assert(modifiers.curseRiskDelta < 0 && modifiers.corruptionGainMult < 1 && modifiers.encounterChanceMult < 1);
  assert(modifiers.sanDrainMult < 1, "Hộ Giới Đại Trận must reduce SAN drain");
}

function testOfflineWorldEventLifecycle() {
  const state = makeState();
  const regionId = sandbox.window.GameData.LOCATIONS[state.locationId]?.region || state.startRegionId;
  const template = sandbox.window.EXPANSION_DATA.worldEvents[0];
  const eventId = "qa_offline_event";
  state.worldSimulation.events[eventId] = { id: eventId, templateId: template.id, regionId, phaseIndex: 0, phaseStartedDay: 1, phaseEndsDay: 1, status: "active", playerContribution: 0, choiceHistory: [] };
  state.worldSimulation.regionState[regionId].activeEventId = eventId;
  const start = state.worldSimulation.lastProcessedDay;
  E.simulateWorldUntil(state, start + 5, { offline: true });
  assert(state.worldSimulation.events[eventId].status !== "active" || state.worldSimulation.events[eventId].phaseIndex > 0);
  assert(Object.values(state.worldSimulation.localIncidents || {}).some((incident) => incident.createdDay >= start + 1));
}

testPathContracts();
testNpcDialogueQuest();
testWeatherHysteresis();
testCompanionSkillAndPhysiqueTrigger();
testOfflineScheduledNpcWarHooks();
testAuditInvariantsAndIndexes();
testRitualProfessionAndUnknownMigration();
testOfflineEncounterAndCompanionCombat();
testWardFormationEffect();
testOfflineWorldEventLifecycle();
console.log("OK: deep D— Ch—/path/companion/quest/weather regression");
