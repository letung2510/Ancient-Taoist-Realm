"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { generateCharacter } = require("../character_generator");

const ROOT = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function loadBrowserGame() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  ["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => {
    vm.runInContext(read(file), sandbox, { filename: file });
  });
  return sandbox;
}

function verifyGeneratedItems(sandbox) {
  const generator = require("../gemini-code-1788430656294.js");
  const batch = generator.generateBatchItems(1000);
  const items = Object.values(batch);
  assert.strictEqual(items.length, 1000);
  assert.strictEqual(new Set(items.map((item) => item.id)).size, 1000);
  assert(items.every((item) => item.id && item.name && item.kind && item.desc));
  assert(items.some((item) => item.cursed));

  const E = sandbox.window.GameEngine;
  const D = sandbox.window.GameData;
  const character = E.createCharacter({ name: "Item Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const state = E.createState({ character });
  let weapon = E.createLootItem(state, "weapon");
  while (weapon && E.equipmentCategory(weapon) !== "artifact") weapon = E.createLootItem(state, "weapon");
  assert(weapon && state.inventory[weapon.id] === 1);
  assert(state.generatedItems[weapon.id]);
  E.useItem(state, weapon.name);
  assert(state.player.equipment.artifacts.includes(weapon.id));
  assert(E.inventoryActions(state, weapon.id).some((action) => action.id === "unequip"));
  assert(E.inventoryActions(state, "linh_thach").some((action) => action.id === "inspect"));

  const restored = E.deserialize(E.serialize(state));
  assert(restored.generatedItems[weapon.id]);
  assert.strictEqual(sandbox.window.GameData.ITEMS[weapon.id].name, weapon.name);
  assert(restored.player.equipment.artifacts.includes(weapon.id));

  const equipmentItems = [
    { id: "qa_a1", name: "QA Kiếm Một", kind: "weapon", equipmentType: "artifact" },
    { id: "qa_a2", name: "QA Kiếm Hai", kind: "weapon", equipmentType: "artifact" },
    { id: "qa_a3", name: "QA Kiếm Ba", kind: "weapon", equipmentType: "artifact" },
    { id: "qa_armor", name: "QA Giáp", kind: "armor", equipmentType: "protection", protectionSlot: "armor" },
    { id: "qa_boots", name: "QA Ngoa", kind: "armor", equipmentType: "protection", protectionSlot: "boots" },
    { id: "qa_pants", name: "QA Quần", kind: "armor", equipmentType: "protection", protectionSlot: "pants" },
    { id: "qa_helmet", name: "QA Mũ", kind: "armor", equipmentType: "protection", protectionSlot: "helmet" },
    { id: "qa_p1", name: "QA Pháp Vòng", kind: "armor", equipmentType: "personal" },
    { id: "qa_p2", name: "QA Pháp Nhẫn", kind: "armor", equipmentType: "personal" },
    { id: "qa_p3", name: "QA Ngọc Bội", kind: "armor", equipmentType: "personal" },
    { id: "qa_p4", name: "QA Hộ Tí", kind: "armor", equipmentType: "personal" },
    { id: "qa_spirit", name: "QA Linh Chuông", kind: "weapon", equipmentType: "spirit" }
  ];
  equipmentItems.forEach((item) => { D.ITEMS[item.id] = item; E.addItem(state, item.id, 1); });
  ["qa_a1", "qa_a2", "qa_a3"].forEach((id) => E.useItem(state, D.ITEMS[id].name));
  assert.strictEqual(state.player.equipment.artifacts.length, 2);
  assert(E.equipmentEligibility(state, "qa_a3").reason.includes("đã đủ"));
  assert.strictEqual(E.equipItem(state, "qa_a3", 0), true);
  assert.strictEqual(state.player.equipment.artifacts[0], "qa_a3");
  ["qa_armor", "qa_boots", "qa_pants", "qa_helmet"].forEach((id) => E.useItem(state, D.ITEMS[id].name));
  assert.strictEqual(Object.values(state.player.equipment.protection).filter(Boolean).length, 4);
  ["qa_p1", "qa_p2", "qa_p3", "qa_p4"].forEach((id) => E.useItem(state, D.ITEMS[id].name));
  assert.strictEqual(state.player.equipment.personal.length, 3);
  E.useItem(state, D.ITEMS.qa_spirit.name);
  assert.strictEqual(state.player.equipment.spiritTreasure, "qa_spirit");

  state.inventory.linh_thach = 10;
  const cauldron = E.refineAtVoidCauldron(state, [{ itemId: "linh_thach", quantity: 9 }]);
  assert.strictEqual(cauldron.success, true);
  assert.strictEqual(cauldron.totalQuantity, 9);
  assert.strictEqual(state.inventory.linh_thach || 0, 1);

  const fateState = E.createState({ character: E.createCharacter({ name: "Fate UX", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const activeIds = new Set(fateState.player.fates);
  const vaultFate = D.FATE_PATTERNS.find((fate) => !activeIds.has(fate.id));
  fateState.fateInventory.push(vaultFate.id);
  const capacityBefore = E.fateVaultCapacity(fateState);
  const equipFull = E.equipFateFromVault(fateState, vaultFate.id);
  assert.strictEqual(equipFull.requiresReplacement, true);
  assert.strictEqual(E.swapFateFromVault(fateState, 0, vaultFate.id).success, true);
  assert.strictEqual(E.storeFateToVault(fateState, 0).success, true);
  assert.strictEqual(E.fateVaultCapacity(fateState), capacityBefore);

  const upgradeTarget = fateState.player.fates[0];
  const targetFate = D.FATE_PATTERNS.find((fate) => fate.id === upgradeTarget);
  const material = D.FATE_PATTERNS.find((fate) => fate.id !== upgradeTarget && fate.grade === targetFate.grade && !fateState.player.fates.includes(fate.id) && !fateState.fateInventory.includes(fate.id));
  assert(material);
  fateState.fateInventory.push(material.id);
  const preview = E.fateUpgradePreview(fateState, upgradeTarget, material.id);
  assert.strictEqual(preview.afterScore, preview.beforeScore + 2);
  assert.strictEqual(E.upgradeFate(fateState, upgradeTarget, material.id).success, true);
  assert.strictEqual(E.fateEnhancementLevel(fateState.player, upgradeTarget), 1);
  const restoredFateState = E.deserialize(E.serialize(fateState));
  assert.strictEqual(E.fateEnhancementLevel(restoredFateState.player, upgradeTarget), 1);
  assert.strictEqual(E.computeFate(restoredFateState.player).total, E.computeFate(fateState.player).total);
}

function verifyTechniquesAndActions(sandbox) {
  const E = sandbox.window.GameEngine;
  const character = E.createCharacter({ name: "Technique Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const state = E.createState({ character });
  assert(E.chooseJourneyIntent(state, "tu_lap").success);
  state.player.realmId = "khai_lo";
  E.updateDerived(state);
  assert(E.getKnownTechniques(state).length >= 1);
  assert.strictEqual(E.parseAction("tu luyen", E.contextState(state).actions).actionId, "act_tu_luyen");
  assert.strictEqual(E.parseAction("tu luyn", E.contextState(state).actions).actionId, "act_tu_luyen");
  const result = E.useTechnique(state, "kiem_khi_so_cap");
  assert(result.success || /Linh khí không đủ|Cảnh giới/.test(result.reason));
  assert(E.techniqueStatus(state).includes("Kiếm Khí"));
  Object.values(sandbox.window.CONG_PHAP_DATA.techniques).forEach((technique) => {
    assert(Number.isFinite(technique.visibleStats.cooldownSeconds));
    assert(Number.isFinite(technique.visibleStats.castTimeSeconds));
    assert(technique.mastery && Number.isFinite(technique.mastery.stage));
  });
}

function verifyExpansionSystems(sandbox) {
  const E = sandbox.window.GameEngine;
  const character = E.createCharacter({ name: "Expansion Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const state = E.createState({ character });
  ["hiddenProfessionClue", "useHiddenProfessionAction", "useProfessionItem", "rechargeProfessionItem", "professionAvailability", "chooseProfessionLocked", "runExpansionCommand", "ensureWorldSimulation", "scheduleWorldTask", "cancelWorldTask", "processScheduledWorldTasks", "worldSimulationSummary", "getWorldModifiers", "worldModifierPreview", "setWeather", "npcWorldContext", "resolveNpcWorldReaction"].forEach((name) => assert.strictEqual(typeof E[name], "function"));
  assert.strictEqual(E.chooseProfession, undefined);
  assert(E.I18n && E.I18n.formatHistory);
  assert(sandbox.window.PROFESSION_ITEMS?.phuong_thuoc);
  assert(state.worldSimulation && state.meta.featureVersions.fateEvolution === 1);
  const rawTechnical = E.createGameEvent(state, { type: "warn", text: "INTERNAL_ROUTE_BLOCKED" });
  assert(rawTechnical.text && !/[A-Z][A-Z0-9_]{3,}/.test(rawTechnical.text), "technical error code leaked into player log");
  const sameDayA = E.createGameEvent(state, { type: "narr", text: "Mưa gõ lên mái hiên.", context: { locationId: "son_mon", subLocationId: "gate" } });
  const sameDayB = E.createGameEvent(state, { type: "narr", text: "Ngươi kéo áo choàng chặt hơn.", context: { locationId: "van_phong", subLocationId: "market" } });
  const sameDayScene = E.renderScene(state, [sameDayA, sameDayB]);
  assert.strictEqual((sameDayScene.match(/\n\n/g) || []).length, 1, "same-day events must be one novel paragraph");
  assert(Object.values(state.worldSimulation.factionState).every((faction) => Number.isFinite(faction.power) && faction.power > 0));
  assert.strictEqual(E.worldRandom(state, "stable", 10, 2), E.worldRandom(state, "stable", 10, 2));
  const regionId = sandbox.window.GameData.WORLD_MAP.locations[state.locationId]?.region || "trung_vuc";
  assert(E.setWeather(state, regionId, "mua", 2, "qa").success);
  assert(state.worldSimulation.regionState[regionId].weatherHistory.some((entry) => entry.to === "mua" && entry.source === "qa"));
  assert.strictEqual(E.worldModifierPreview(state, { regionId }).weatherLabel, "Mưa");
  const taskDay = E.gameDayOrdinal(state.gameClock) + 2;
  assert(E.scheduleWorldTask(state, { id: "qa-task", type: "formation", dueDay: taskDay }).success);
  assert(E.scheduleWorldTask(state, { id: "qa-task", type: "formation", dueDay: taskDay }).duplicate);
  assert(E.cancelWorldTask(state, "qa-task").success);
  assert.strictEqual(E.worldSimulationSummary(state).pendingTasks, 0);
  const offlineState = E.createState({ character: E.createCharacter({ name: "Offline QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const offlineStart = Date.now(); offlineState.gameClock.lastRealTimestamp = offlineStart - 30 * 1000;
  const oneDay = E.applyOfflineProgress(offlineState, offlineStart); assert.strictEqual(oneDay.gameDays, 1);
  assert.strictEqual(offlineState.worldSimulation.lastProcessedDay, E.gameDayOrdinal(offlineState.gameClock));
  offlineState.gameClock.lastRealTimestamp = offlineStart - 30 * 1000 * 30;
  const thirtyDays = E.applyOfflineProgress(offlineState, offlineStart); assert(thirtyDays.gameDays >= 29);
  offlineState.gameClock.lastRealTimestamp = offlineStart - 30 * 1000 * 1000;
  const longOffline = E.applyOfflineProgress(offlineState, offlineStart); assert(longOffline.gameDays >= 999);
  assert.strictEqual(offlineState.worldSimulation.lastProcessedDay, E.gameDayOrdinal(offlineState.gameClock));
  assert.strictEqual(Object.keys(offlineState.worldSimulation.events).length, 0);
  const started = E.startWorldEvent(state, "huyet_nguyet", regionId, E.gameDayOrdinal(state.gameClock));
  assert(started.success);
  assert(E.activeRegionEvent(state, regionId));
  assert(E.getWorldModifiers(state, { regionId }).encounterChanceMult >= 1);
  assert(E.validateWorldEventState(state).ok);
  const eventNode = state.locationId;
  const foreignRegion = Object.keys(state.worldSimulation.regionState).find((id) => id !== regionId);
  const foreignNode = Object.keys(sandbox.window.GameData.LOCATIONS || {}).find((id) => sandbox.window.GameData.LOCATIONS[id]?.regionId === foreignRegion);
  if (foreignNode) {
    state.locationId = foreignNode;
    assert(!E.resolveWorldEventChoice(state, started.event.id, "relief").success, "world event choice must require the current region");
    state.locationId = eventNode;
  }
  assert(E.resolveWorldEventChoice(state, started.event.id, "relief").success);
  assert(E.validateWorldEventState(state).ok);
  const eventLog = E.novelLogParagraphs(state).at(-1)?.text || "";
  assert(eventLog.includes("biến cố") && !eventLog.includes("resolveWorldEventChoice"));
  const eventDay = E.gameDayOrdinal(state.gameClock);
  E.simulateWorldUntil(state, eventDay + 10);
  assert(!E.startWorldEvent(state, "huyet_nguyet", regionId, eventDay + 10).success, "world event cooldown must be enforced");
  const warState = E.createState({ character: E.createCharacter({ name: "War QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const factionIds = Object.keys(warState.worldSimulation.factionState);
  assert(factionIds.length >= 2);
  const warId = "qa_war";
  warState.worldSimulation.wars[warId] = { id: warId, factionA: factionIds[0], factionB: factionIds[1], startedDay: E.gameDayOrdinal(warState.gameClock), frontNodeIds: [], scoreA: 0, scoreB: 0, status: "active", playerInterventions: [] };
  assert(E.validateWarState(warState).ok);
  assert(!E.participateWar(warState, warId).success, "unaffiliated player must not join a war");
  warState.guildMembership = { guildId: factionIds[0], contribution: 0 };
  assert(E.participateWar(warState, warId).success);
  assert(!E.participateWar(warState, warId).success, "war intervention must be once per day");
  assert(E.validateWarState(warState).ok);
  const warLog = E.novelLogParagraphs(warState).at(-1)?.text || "";
  assert(warLog.includes("chiến tuyến") && !warLog.includes("participateWar"));
  const structureState = E.createState({ character: E.createCharacter({ name: "Structure QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  E.addItem(structureState, "linh_thach", 200);
  const builtStructure = E.buildMapStructure(structureState, structureState.locationId, "watchtower");
  assert(builtStructure.success);
  assert(E.validateStructureRuntimeState(structureState).ok);
  const remoteBuildState = E.deserialize(E.serialize(structureState));
  E.move(remoteBuildState, "bac");
  const remoteBuildInventory = Number(remoteBuildState.inventory.linh_thach || 0);
  const remoteBuild = E.buildMapStructure(remoteBuildState, structureState.locationId, "trading_post");
  assert(!remoteBuild.success && Number(remoteBuildState.inventory.linh_thach || 0) === remoteBuildInventory);
  const structureId = builtStructure.structure.id;
  builtStructure.structure.ownerType = "npc"; builtStructure.structure.ownerId = "npc_test";
  assert(!E.disableMapStructure(structureState, structureState.locationId, structureId).success, "non-owner must not disable structure");
  builtStructure.structure.ownerType = "player"; builtStructure.structure.ownerId = structureState.player.id;
  assert(E.disableMapStructure(structureState, structureState.locationId, structureId).success);
  assert(E.repairMapStructure(structureState, structureState.locationId, structureId).success);
  assert(E.upgradeMapStructure(structureState, structureState.locationId, structureId).success);
  assert(E.dismantleMapStructure(structureState, structureState.locationId, structureId).success);
  assert(E.validateStructureRuntimeState(structureState).ok);
  const routeTarget = Object.keys(sandbox.window.GameData.LOCATIONS || {}).find((nodeId) => nodeId !== structureState.locationId && E.travelPlan(structureState, structureState.locationId, nodeId, "walk").success);
  assert(routeTarget, "trade route fixture must have an adjacent node");
  assert(E.createTradeRoute(structureState, structureState.locationId, routeTarget).success);
  assert(!E.createTradeRoute(structureState, structureState.locationId, routeTarget).success, "duplicate trade route must be rejected");
  E.updateTradeRoutes(structureState, E.gameDayOrdinal(structureState.gameClock) + 1);
  assert(E.validateTradeRouteState(structureState).ok);
  const projectState = E.createState({ character: E.createCharacter({ name: "Project QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  E.addItem(projectState, "linh_thach", 100);
  projectState.guildMembership = { guildId: factionIds[0], contribution: 0 };
  assert(!E.startGuildProject(projectState, "missing_project").success);
  assert(E.startGuildProject(projectState, "repair_vein").success);
  assert(E.validateGuildProjectState(projectState).ok);
  while (projectState.guildProject.status === "active") assert(E.contributeGuildProject(projectState, 10).success);
  assert(projectState.guildProject.status === "completed");
  assert(E.validateGuildProjectState(projectState).ok);
  const tournamentState = E.createState({ character: E.createCharacter({ name: "Tournament QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  tournamentState.worldSimulation.tournament = { id: "tournament_120", startDay: 120, endDay: 130, status: "closed", roundsWon: 0, joined: false };
  const tournamentDay = E.gameDayOrdinal(tournamentState.gameClock), nextTournamentDay = tournamentDay + ((120 - tournamentDay % 120) % 120 || 120);
  E.simulateWorldUntil(tournamentState, nextTournamentDay);
  assert(tournamentState.worldSimulation.tournament.status === "open", "closed tournament must reopen on the next cycle");

  const relation = E.recordRelationshipEvent(state, "su_phu", "saved", { uniqueKey: "qa-save" });
  assert(relation.success && state.relationships.su_phu.trust >= 12);
  assert(E.recordRelationshipEvent(state, "su_phu", "saved", { uniqueKey: "qa-save" }).duplicate);

  state.player.techniques.kiem_khi_so_cap.masteryStage = 2;
  E.ensureTechniqueTrials(state);
  assert.strictEqual(state.player.techniques.kiem_khi_so_cap.evolution.status, "trial");
  state.player.techniques.kiem_khi_so_cap.evolution.status = "ready";
  assert(E.chooseTechniqueEvolution(state, "kiem_khi_so_cap", "doan_niem").success);
  assert(E.techniqueEvolutionModifiers(state, "kiem_khi_so_cap").powerMult > 1);
  assert(E.validateTechniqueRuntimeState(state).ok);
  assert(E.validateCharacterRuntimeState(state).ok);
  state.player.san = -1;
  assert(!E.validateCharacterRuntimeState(state).ok, "character runtime validator must reject negative sanity");
  E.updateDerived(state);
  assert(E.validateCharacterRuntimeState(state).ok);

  const codexState = E.createState({ character: E.createCharacter({ name: "Codex Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const codexId = sandbox.window.EXPANSION_DATA.codexDefinitions[0].id;
  assert(E.inspectCodex(codexState, codexId, "investigate").success);
  assert(E.inspectCodex(codexState, codexId, "read").success);
  assert(E.inspectCodex(codexState, codexId, "decrypt").success);
  assert(E.inspectCodex(codexState, codexId, "collect").success);
  assert(codexState.discoveries.codexClues["lore:" + codexId].verified);
  assert.strictEqual(E.inspectCodex(codexState, codexId, "collect").success, false);
  assert(E.validateDiscoveryLifecycle(codexState).ok);
  const hiddenProfessionId = Object.keys(sandbox.window.EXPANSION_DATA.hiddenProfessions)[0];
  codexState.hiddenProfessionState.clues[hiddenProfessionId + ":lead"] = { professionId: hiddenProfessionId };
  codexState.hiddenProfessionState.unlocked[hiddenProfessionId] = { day: E.gameDayOrdinal(codexState.gameClock) };
  assert(!E.chooseProfessionLocked(codexState, hiddenProfessionId).success);
  assert(E.chooseProfessionLocked(codexState, "luyen_dan").success);
  assert(E.chooseProfessionLocked(codexState, hiddenProfessionId).success);
  codexState.player.san = 100;
  assert(E.useHiddenProfessionAction(codexState, hiddenProfessionId).success);
  assert(!E.useHiddenProfessionAction(codexState, hiddenProfessionId).success);
  assert(E.deserialize(E.serialize(codexState)).hiddenProfessionActions[hiddenProfessionId].uses === 1);

  const fateId = state.player.fates[0];
  state.player.fateEnhancements[fateId] = 5;
  state.player.fateRelationships[fateId] = { stage: 3, points: 4, eliteTrials: 0, alignedChoices: 0, resonanceUnlocked: true };
  state.player.san = 100;
  state.player.merit = 100;
  state.fateExcessEssence = 100;
  assert(E.fateEvolutionEligibility(state, fateId).eligible);
  assert(E.startFateEvolutionTrial(state, fateId).success);
  E.recordFateEvolutionProgress(state, "elite", "qa-elite-1");
  E.recordFateEvolutionProgress(state, "elite", "qa-elite-2");
  assert.strictEqual(state.player.fateEvolutions[fateId].status, "ready");
  const branchId = state.player.fateEvolutions[fateId].candidateBranchIds[0];
  const evolved = E.evolveFate(state, fateId, branchId, { confirmed: true });
  assert(evolved.success);
  assert.strictEqual(state.player.fateRelationships[fateId].stage, 4);

  assert(!E.practiceProfession(state, "luyen_dan").success);
  assert(E.chooseProfessionLocked(state, "luyen_dan").success);
  assert(state.inventory.phuong_thuoc >= 1);
  state.player.stamina = 0;
  assert(!E.practiceProfession(state, "luyen_dan", { skipCost: true }).success, "external profession practice must not bypass stamina cost");
  state.player.stamina = 100;
  const professionItemQuantity = state.inventory.phuong_thuoc;
  assert(E.useProfessionItem(state, "phuong_thuoc").success);
  assert.strictEqual(state.inventory.phuong_thuoc, professionItemQuantity);
  assert(!E.useProfessionItem(state, "phuong_thuoc").success);
  state.inventory.linh_thach = Math.max(10, Number(state.inventory.linh_thach || 0));
  assert(E.rechargeProfessionItem(state, "phuong_thuoc").success);
  assert(E.chooseProfessionLocked(state, "tuong_su").success);
  assert(state.professionState.selectionLocked);
  assert(!E.chooseProfessionLocked(state, "tran_phap").success);
  state.player.stamina = 100;
  assert(E.practiceProfession(state, "luyen_dan").success);
  E.refreshContracts(state, E.gameDayOrdinal(state.gameClock) + 10);
  assert(Object.keys(state.contractBoard.offers).length > 0);

  state.inventory.linh_thach = 100;
  state.player.stamina = 100;
  assert(E.setPlayerMark(state, "QA marker").success);
  assert(E.divine(state).success);
  const opportunity = E.createContestedOpportunity(state);
  assert(opportunity && state.pendingContestedOpportunity);
  assert(E.resolveContestedOpportunity(state, "share").success);
  assert.strictEqual(state.pendingContestedOpportunity, null);

  state.companion = { entityId: "qa_beast", customName: "QA Beast", loyalty: 50, corruption: 65, state: "mutated", mutationPending: true };
  assert(E.resolveCompanionMutation(state, "cure").success);
  assert.strictEqual(state.companion.state, "active");
  assert(!state.companion.mutationPending);

  state.counterIntel = { exposedDay: E.gameDayOrdinal(state.gameClock), factionId: "qa", heat: 30, falseLeadPlanted: false };
  assert(E.counterIntelResponse(state, "false_lead").success);
  assert.strictEqual(state.counterIntel.heat, 10);

  const tribulation = E.prepareTribulation(state);
  assert.strictEqual(tribulation.status, "pending");
  assert(E.validateReincarnationRuntimeState(state).ok);
  assert(E.chooseTribulation(state, "fate").success);
  assert(!E.chooseTribulation(state, "fate").success, "tribulation choice must be one-shot");
  assert.strictEqual(state.pendingTribulation.result.bonus >= 0, true);
  assert(E.validateReincarnationRuntimeState(state).ok);
  const legacyBefore = state.reincarnationLegacy.previousLives.length;
  E.beforeReincarnation(state, state.player.fates[0]);
  E.beforeReincarnation(state, state.player.fates[0]);
  assert.strictEqual(state.reincarnationLegacy.previousLives.length, legacyBefore + 1);
  assert(E.validateReincarnationRuntimeState(state).ok);

  const hiddenDef = sandbox.window.EXPANSION_DATA.hiddenRealms[0];
  state.locationId = hiddenDef.parentNodeId;
  state.worldSimulation.hiddenRealms[hiddenDef.id].status = "open";
  state.worldSimulation.hiddenRealms[hiddenDef.id].cycleIndex = 1;
  assert(E.hiddenRealmEnter(state, hiddenDef.id).success);
  assert(state.locationId.startsWith("hidden:" + hiddenDef.id));
  assert(sandbox.window.GameData.LOCATIONS[state.locationId]);
  const hiddenSave = E.serialize(state), hiddenLocationId = state.locationId;
  delete sandbox.window.GameData.LOCATIONS[hiddenLocationId];
  const hiddenRestored = E.deserialize(hiddenSave);
  assert(hiddenRestored.locationId.startsWith("hidden:" + hiddenDef.id));
  assert(sandbox.window.GameData.LOCATIONS[hiddenRestored.locationId]);
  assert(E.exitHiddenRealm(hiddenRestored).success);
  assert(E.exitHiddenRealm(state).success);
  assert.strictEqual(state.locationId, hiddenDef.parentNodeId);

  const restored = E.deserialize(E.serialize(state));
  assert(restored.worldSimulation);
  assert.strictEqual(restored.player.fateEvolutions[fateId].status, "evolved");
  assert.strictEqual(restored.player.fateRelationships[fateId].stage, 4);
  const farDay = E.gameDayOrdinal(restored.gameClock) + 10000;
  const catchup = E.simulateWorldUntil(restored, farDay);
  assert.strictEqual(catchup.processed, 10000);
  assert(catchup.detailed <= 30);
  const stableWorld = JSON.stringify(restored.worldSimulation);
  assert.strictEqual(E.simulateWorldUntil(restored, farDay).processed, 0);
  assert.strictEqual(JSON.stringify(restored.worldSimulation), stableWorld);
}

function assertUnique(items, getKey, label) {
  const seen = new Set();
  items.forEach((item) => {
    const key = getKey(item);
    assert(!seen.has(key), `${label} duplicated: ${key}`);
    seen.add(key);
  });
}

function verifyDataIntegrity(sandbox) {
  const D = sandbox.window.GameData;
  const fateIds = new Set(D.FATE_PATTERNS.map((fate) => fate.id));
  assertUnique(D.FATE_PATTERNS, (fate) => fate.id, "Browser fate id");

  // Canonical Fate source is data/fate_data.js (the old 1,300-entry JSON pool was removed).
  assert.strictEqual(D.FATE_PATTERNS.filter((fate) => !String(fate.id).startsWith("luan_hoi_tien")).length, 10000);

  const cultivationSource = JSON.parse(read("data/canh_gioi_tien_hiep.json"));
  const cultivationRealms = Array.isArray(cultivationSource) ? cultivationSource : cultivationSource.realms;
  const factionData = JSON.parse(read("data/tu_tien_factions.json"));
  const guildData = {
    total: factionData.guild_source?.total,
    tiers: factionData.guild_tiers,
    guilds: factionData.guilds
  };
  assert.strictEqual(D.REALMS.length, cultivationRealms.length);
  assert.strictEqual(cultivationRealms.length, 14);
  assert.deepStrictEqual(cultivationRealms.map((realm) => realm.level), Array.from({ length: 14 }, (_, index) => index + 1));
  assert(cultivationSource.realm_model === "14_flat_levels");
  assert.strictEqual(D.WORLD_MAP.factions.length, factionData.factions.length);
  assert.strictEqual(D.GUILDS.length, 150);
  assert.strictEqual(guildData.total, 150);
  assertUnique(cultivationRealms, (realm) => realm.id, "Realm id");
  assertUnique(factionData.factions, (faction) => faction.id, "Faction id");
  assertUnique(guildData.guilds, (guild) => guild.id, "Guild id");
  const regionIds = new Set(factionData.world.regions.map((region) => region.id));
  guildData.guilds.forEach((guild) => {
    assert(regionIds.has(guild.region_id), `Guild region missing: ${guild.region_id}`);
    assert(guild.scale.min <= guild.scale.max);
    assert(guild.cultivation_exp_bonus_pct.min <= guild.cultivation_exp_bonus_pct.max);
    assert(guild.city_penalty_reduction_pct.min <= guild.city_penalty_reduction_pct.max);
  });

  const relationships = D.FATE_RELATIONSHIPS;
  (relationships.pairwise_relationships || []).forEach((pair) => {
    assert(fateIds.has(pair.from), `Relationship source missing: ${pair.from}`);
    assert(fateIds.has(pair.to), `Relationship target missing: ${pair.to}`);
  });
  (relationships.combo_sets || []).forEach((combo) => {
    combo.members.forEach((member) => assert(fateIds.has(member.id), `Combo member missing: ${member.id}`));
  });
  (relationships.fusion_recipes || []).forEach((recipe) => {
    recipe.materials.forEach((material) => assert(fateIds.has(material.id), `Fusion material missing: ${material.id}`));
    assert(fateIds.has(recipe.result.id), `Fusion result missing: ${recipe.result.id}`);
  });

  Object.entries(D.LOCATIONS).forEach(([id, location]) => {
    assert.strictEqual(location.id, id);
    Object.values(location.exits || {}).forEach((target) => assert(D.LOCATIONS[target], `Exit target missing: ${target}`));
    (location.npcs || []).forEach((npc) => assert(D.NPCS[npc], `NPC missing: ${npc}`));
    (location.enemies || []).forEach((enemy) => assert(D.ENEMIES[enemy], `Enemy missing: ${enemy}`));
    (location.searchable || []).forEach((item) => assert(D.ITEMS[item], `Search item missing: ${item}`));
  });
  D.ARCHETYPES.forEach((archetype) => {
    assert(D.ITEMS[archetype.startItem], `Start item missing: ${archetype.startItem}`);
    assert(fs.existsSync(path.join(ROOT, archetype.portrait)), `Portrait missing: ${archetype.portrait}`);
  });
  Object.values(D.NPCS).forEach((npc) => assert(fs.existsSync(path.join(ROOT, npc.portrait)), `Portrait missing: ${npc.portrait}`));
  Object.values(D.ENEMIES).forEach((enemy) => {
    assert(fs.existsSync(path.join(ROOT, enemy.portrait)), `Portrait missing: ${enemy.portrait}`);
    (enemy.loot || []).forEach((item) => assert(D.ITEMS[item], `Enemy loot missing: ${item}`));
  });
  Object.values(D.QUESTS).forEach((quest) => {
    if (quest.reward?.item) assert(D.ITEMS[quest.reward.item], `Quest reward missing: ${quest.reward.item}`);
  });
}

function verifyCharacters() {
  for (let index = 0; index < 10000; index++) {
    const character = generateCharacter();
    assert.strictEqual(character.realm.id, "di_menh");
    assert.strictEqual(character.realm.level, 1);
    assert.strictEqual(character.fate.equippedIds.length, 5);
    assert.strictEqual(new Set(character.fate.equippedIds).size, 5);
    assert(character.fate.total > 5);
    assert(character.fate.vaultCapacity === 10);
    assert(character.stats.aptitude >= 1 && character.stats.aptitude <= 100);
    assert(character.stats.comprehension >= 1 && character.stats.comprehension <= 100);
    assert.strictEqual(character.origin.personality.length, 2);
    assert.strictEqual(new Set(character.origin.personality).size, 2);
    assert.deepStrictEqual(character.techniqueIds, ["kiem_khi_so_cap", "tam_phap_dan_dien"]);
    assert.strictEqual(character.hiddenProfession, null);
  }
}

function verifyBrowserEngine(sandbox) {
  const D = sandbox.window.GameData;
  const E = sandbox.window.GameEngine;
  const gradeRank = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };

  for (let index = 0; index < 200; index++) {
    const ids = E.drawInitialFates();
    const fates = ids.map((id) => D.FATE_PATTERNS.find((fate) => fate.id === id));
    assert.strictEqual(ids.length, 5);
    assert.strictEqual(new Set(ids).size, 5);
    assert(fates.reduce((sum, fate) => sum + fate.score, 0) > 5);
    assert(fates.every((fate) => gradeRank[fate.grade] <= 3));
  }

  D.WORLD_MAP.regions.forEach((region) => {
    const eligibility = E.startRegionEligibility(region.id, 1);
    if (!eligibility.eligible) {
      assert.throws(() => E.rollCharacterCreation(region.id), /chỉ tu sĩ|chỉ tồn tại/);
      return;
    }
    for (let index = 0; index < 40; index++) {
      const rolled = E.rollCharacterCreation(region.id);
      assert.strictEqual(rolled.startRegionId, region.id);
      assert.strictEqual(rolled.realmId, "di_menh");
      assert(rolled.aptitude >= 1 && rolled.aptitude <= 100);
      assert(rolled.comprehension >= 1 && rolled.comprehension <= 100);
      assert(rolled.basePhy >= 10 && rolled.basePhy <= 20);
      assert(rolled.baseMag >= 10 && rolled.baseMag <= 20);
      assert.strictEqual(rolled.personalityTraits.length, 2);
      assert.strictEqual(new Set(rolled.personalityTraits).size, 2);
      assert(rolled.spiritualRoots.length >= 1 && rolled.spiritualRoots.length <= 5);
      assert.strictEqual(rolled.fates.length, 5);
      assert.strictEqual(new Set(rolled.fates).size, 5);
      assert.strictEqual(D.WORLD_MAP.locations[rolled.startLocationId].region, region.id);
      const fateObjects = rolled.fates.map((id) => D.FATE_PATTERNS.find((fate) => fate.id === id));
      assert(fateObjects.reduce((sum, fate) => sum + fate.score, 0) > 5);
      assert(fateObjects.every((fate) => gradeRank[fate.grade] <= 3));
    }
  });

  Object.keys(D.WORLD_MAP.locations).forEach((id) => assert(D.LOCATIONS[id], `Map location missing: ${id}`));
  Object.values(D.LOCATIONS).forEach((location) => {
    Object.values(location.exits || {}).forEach((id) => assert(D.WORLD_MAP.locations[id], `Map layout missing: ${id}`));
  });

  const repairNodeId = Object.keys(D.LOCATIONS).find((id) => D.LOCATIONS[id]?.exits?.bac);
  const repairNode = D.LOCATIONS[repairNodeId];
  const originalRepairExit = repairNode.exits.bac;
  repairNode.exits.bac = "qa_missing_exit_target";
  const exitRepairState = E.createState({ character: E.createCharacter({ name: "Exit Repair QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  exitRepairState.openWorld.exits[repairNodeId] = { bac: "qa_missing_exit_target" };
  const exitRepair = E.repairInvalidMapExits(exitRepairState);
  assert(exitRepair.removed.some((entry) => entry.nodeId === repairNodeId && entry.direction === "bac" && entry.targetId === "qa_missing_exit_target"));
  assert.strictEqual(repairNode.exits.bac, "qa_missing_exit_target");
  assert.strictEqual(exitRepairState.openWorld.exits[repairNodeId].bac, undefined);
  assert(exitRepair.invalidExits.some((entry) => entry.nodeId === repairNodeId && entry.direction === "bac"));
  repairNode.exits.bac = originalRepairExit;

  const character = E.createCharacter({
    name: "Test",
    archetypeId: "kiem_tong",
    fates: E.drawInitialFates()
  });
  const state = E.createState({ character });
  assert(E.chooseJourneyIntent(state, "tam_su").success);
  assert(E.validateOpenWorldGrid(state).ok);
  ["bac", "nam", "dong", "tay"].forEach((direction) => {
    const probe = E.deserialize(E.serialize(state)), before = probe.locationId;
    E.move(probe, direction);
    assert.notStrictEqual(probe.locationId, before, `Oxy movement blocked: ${direction}`);
    assert(E.validateOpenWorldGrid(probe).ok);
  });
  const lookTurn = state.meta.turn;
  const lookHistory = state.history.length;
  E.submitActionId(state, "act_nhin");
  assert.strictEqual(state.meta.turn, lookTurn + 1);
  assert.strictEqual(state.history.length, lookHistory + 2);

  const commandState = E.createState({ character });
  assert(E.chooseJourneyIntent(commandState, "tu_lap").success);
  const commandTurn = commandState.meta.turn;
  E.submitTurn(commandState, { text: "look" });
  assert.strictEqual(commandState.meta.turn, commandTurn + 1);
  assert(commandState.history.some((entry) => entry.text.includes(sandbox.window.GameData.LOCATIONS[commandState.locationId].desc)));

  const legacyOriginState = E.createState({ character: E.createCharacter({ name: "Tán Tu", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  assert.strictEqual(legacyOriginState.flags.originChoicePending, false);
  assert.strictEqual(E.chooseOrigin(legacyOriginState, "tan_tu", "du_hiep").success, false);
  assert(E.contextState(legacyOriginState).actions.some((action) => action.id === "act_journey_tu_lap"));
  assert(!E.contextState(legacyOriginState).actions.some((action) => action.id.startsWith("act_origin_")));

  const originalRandom = vm.runInContext("Math.random", sandbox);
  vm.runInContext("Math.random = () => 0.5", sandbox);
  const searchState = E.createState({ character: E.createCharacter({ name: "Tầm Bảo", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  assert(E.chooseJourneyIntent(searchState, "tu_lap").success);
  const inventoryBeforeSearch = Object.values(searchState.inventory).reduce((sum, qty) => sum + qty, 0);
  const firstSearch = E.search(searchState);
  assert(firstSearch.success && firstSearch.rolls === 3);
  assert.strictEqual(E.searchStatus(searchState).depth, 3);
  assert(searchState.pendingSearch?.findings.some((finding) => finding.type === "resource"));
  assert(E.contextState(searchState).actions.some((action) => action.id === "act_search_collect"));
  assert(E.collectSearchFindings(searchState).success);
  assert(Object.values(searchState.inventory).reduce((sum, qty) => sum + qty, 0) > inventoryBeforeSearch);
  assert.strictEqual(E.search(searchState).rolls, 2);
  E.collectSearchFindings(searchState);
  assert.strictEqual(E.search(searchState).rolls, 1);
  E.collectSearchFindings(searchState);
  assert(E.searchStatus(searchState).depleted);
  assert(!E.contextState(searchState).actions.some((action) => action.id === "act_tim_kiem"));
  searchState.meta.turn += 8;
  assert.strictEqual(E.searchStatus(searchState).depth, 5);

  const chainState = E.createState({ character: E.createCharacter({ name: "Truy Dấu", archetypeId: "kiem_tong", fates: E.drawInitialFates(), comprehension: 100 }) });
  for (let stage = 1; stage <= 3; stage++) {
    chainState.pendingSearch = { locationId: chainState.locationId, session: stage, findings: [{ type: "information", label: "Dấu vết kiểm thử" }], createdAtTurn: chainState.meta.turn };
    assert.strictEqual(E.investigateSearchFinding(chainState).chainStage, stage);
  }
  assert(Object.keys(chainState.quests).some((id) => id.startsWith("search_chain_")));
  assert(chainState.searchSites[chainState.locationId].secretLocationId);
  assert(E.locationExits(chainState)[chainState.searchSites[chainState.locationId].secretDirection]);

  const dangerState = E.createState({ character: E.createCharacter({ name: "Mạo Hiểm", archetypeId: "kiem_tong", fates: E.drawInitialFates(), comprehension: 100 }) });
  dangerState.locationId = "hac_lam";
  vm.runInContext("Math.random = () => 0", sandbox);
  const dangerSearch = E.search(dangerState);
  assert(dangerSearch.findings.some((finding) => finding.type === "rare"));
  assert(dangerSearch.findings.some((finding) => finding.type === "encounter"));
  sandbox.__originalRandom = originalRandom;
  vm.runInContext("Math.random = __originalRandom", sandbox);
  delete sandbox.__originalRandom;

  const moveBefore = E.nodeCoordinates(state, state.locationId);
  E.move(state, "bac");
  const moveAfter = E.nodeCoordinates(state, state.locationId);
  assert(moveAfter && moveAfter.x === moveBefore.x && moveAfter.y === moveBefore.y - 1);
  assert(E.describeMap(state).includes("Vạn Giới Lộ"));

   // All four cardinal actions stay visible; movement lazily materializes the
   // destination and labels the inverse direction as a return action.
  const openWorldState = E.createState({ character });
  assert(E.chooseJourneyIntent(openWorldState, "tu_lap").success);
  const oldLocation = openWorldState.locationId;
   assert.deepStrictEqual(Array.from(E.contextState(openWorldState).actions.filter((action) => action.id.startsWith("act_move_")).map((action) => action.id)), ["act_move_bac", "act_move_nam", "act_move_dong", "act_move_tay"]);
   assert(!E.contextState(openWorldState).actions.some((action) => action.id.startsWith("act_explore_")));
   E.submitActionId(openWorldState, "act_move_nam");
  const dangerousLocation = openWorldState.locationId;
  assert.notStrictEqual(dangerousLocation, oldLocation);
  D.LOCATIONS[dangerousLocation].enemies = ["yeu_thu"];
  E.beginCombat(openWorldState);
  E.submitActionId(openWorldState, "act_bo_chay");
  assert.strictEqual(openWorldState.locationId, dangerousLocation);
  assert.strictEqual(Object.keys(openWorldState.enemies).length, 0);
  const postFleeContext = E.contextState(openWorldState);
  assert(postFleeContext.actions.some((action) => action.id === "act_exp_map_event"), "pending map discovery must remain actionable after fleeing");
  assert.strictEqual(postFleeContext.actions.filter((action) => action.id.startsWith("act_move_")).length, 0);
  const topologyProbe = E.createState({ character });
  assert(E.chooseJourneyIntent(topologyProbe, "tu_lap").success);
  const topologyAudit = E.validateOpenWorldGrid(topologyProbe);
  assert(topologyAudit.ok, "open-world topology audit failed: " + topologyAudit.errors.join(", "));
  const cardinalOrigin = E.nodeCoordinates(topologyProbe, topologyProbe.locationId);
  ["bac", "nam", "dong", "tay"].forEach((direction) => {
    const before = E.nodeCoordinates(topologyProbe, topologyProbe.locationId);
    E.move(topologyProbe, direction);
    if (topologyProbe.pendingMapEvent) E.resolveMapEvent(topologyProbe, topologyProbe.pendingMapEvent.choices[0].id);
    topologyProbe.enemies = {};
    const after = E.nodeCoordinates(topologyProbe, topologyProbe.locationId);
    const delta = { bac: [0, -1], nam: [0, 1], dong: [1, 0], tay: [-1, 0] }[direction];
    assert(after.x === before.x + delta[0] && after.y === before.y + delta[1], `invalid Oxy step: ${direction}`);
  });
  assert(cardinalOrigin && E.validateOpenWorldGrid(topologyProbe).ok);
  if (openWorldState.pendingMapEvent) assert(E.resolveMapEvent(openWorldState, openWorldState.pendingMapEvent.choices[0].id).success);
   E.submitActionId(openWorldState, "act_move_dong");
  assert.notStrictEqual(openWorldState.locationId, dangerousLocation);
  assert.notStrictEqual(openWorldState.locationId, oldLocation);
  const openedLocation = openWorldState.locationId;
  const restoredOpenWorld = E.deserialize(E.serialize(openWorldState));
  assert.strictEqual(E.locationExits(restoredOpenWorld, dangerousLocation).dong, openedLocation);
  assert.strictEqual(E.locationExits(restoredOpenWorld, openedLocation).tay, dangerousLocation);

  // Migration for saves written before per-save exit topology was introduced.
  const legacyOpenWorld = E.createState({ character });
  assert(E.chooseJourneyIntent(legacyOpenWorld, "tu_lap").success);
  E.move(legacyOpenWorld, "nam");
  const legacyGenerated = legacyOpenWorld.locationId;
  legacyOpenWorld.openWorld.nodes[legacyGenerated].exits.bac = oldLocation;
  delete legacyOpenWorld.openWorld.exits;
  const migratedOpenWorld = E.deserialize(E.serialize(legacyOpenWorld));
  assert.strictEqual(E.locationExits(migratedOpenWorld, oldLocation).nam, legacyGenerated);

  const localGuild = D.GUILDS.find((guild) => guild.region_id === "trung_vuc" && guild.pyramid_tier === 5);
  state.player.openingPlan.targetOrganizationId = localGuild.id;
  state.flags.openingPlan = state.player.openingPlan;
  assert.strictEqual(E.joinGuild(state, localGuild.id), false);
  E.gainExp(state, 100);
  // This fixture is a breakthrough gate test, not a cultivation-deviation test.
  // A large single gain may legitimately trigger the deviation system and reduce
  // current exp; normalize the fixture after observing that separate mechanic.
  state.player.exp = 100;
  assert.strictEqual(state.player.realmId, "di_menh");
  const firstBreakthrough = E.doBreakthrough(state);
  assert(firstBreakthrough.changed, JSON.stringify({ reason: firstBreakthrough.reason, realmId: state.player.realmId, exp: state.player.exp, tier: E.cultivationTier(state), pathId: state.player.pathId }));
  assert.strictEqual(state.player.realmId, "khai_lo");
  assert.strictEqual(state.flags.pathChoicePending, true);
  assert(E.contextState(state).actions.some((action) => action.id === "act_path_ngoai_dao_gia"));
  assert.strictEqual(state.pendingGuildChoice, true);
  assert.strictEqual(state.quests.chon_dao_lo.status, "active");
  assert(E.joinGuild(state, localGuild.id));
  assert(state.player.techniques.tong_mon_noi_tuc);
  assert.strictEqual(state.pendingGuildChoice, false);
  assert.strictEqual(state.quests.chon_dao_lo.status, "completed");
  const benefits = E.getGuildBenefits(state);
  assert(benefits.expBonusPct > 0);
  assert(benefits.cityPenaltyReductionPct > 0);
  const contributionBefore = state.guildMembership.contribution;
  E.cultivate(state);
  assert(state.guildMembership.contribution > contributionBefore);
  assert(E.leaveGuild(state));
  assert(state.guildPursuit);
  assert(E.guildTierInfo(localGuild).name.includes("Môn Phái Nhỏ"));
  assert(E.guildExitCost(localGuild).merit > 0);
  const pursuitState = E.deserialize(E.serialize(state));
  pursuitState.player.realmId = "dung_thai";
  E.updateDerived(pursuitState);
  assert.strictEqual(pursuitState.guildPursuit, null);

  const mentalState = E.createState({ character: E.createCharacter({ name: "Tâm Cảnh", archetypeId: "kiem_tong", fates: E.drawInitialFates(), corruptionRating: 40 }) });
  mentalState.player.san = 40;
  E.updateDerived(mentalState);
  assert.strictEqual(E.sanStatus(mentalState.player).name, "Tà Niệm Quấn Thân");
  const restoredSan = E.restoreSan(mentalState, 10);
  assert(restoredSan > 0 && restoredSan < 10);
  const autoState = E.createState({ character: E.createCharacter({ name: "Tự Tu", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  assert(!E.contextState(autoState).actions.some((action) => action.id === "act_be_quan"));
  const combatMasteryBefore = autoState.player.techniques.kiem_khi_so_cap.masteryExp;
  const mindMasteryBefore = autoState.player.techniques.tam_phap_dan_dien.masteryExp;
  assert(E.autoCultivate(autoState, 5).completed > 0);
  assert(autoState.autoCultivation);
  const autoCultivationLog = autoState.history.at(-1);
  assert(autoCultivationLog.statDisplay?.some((text) => text.includes("Tự động tu luyện")));
  assert(!autoCultivationLog.text.includes("Tự động tu luyện:") && autoCultivationLog.text.includes("hơi thở"));
  assert(E.validateLogSurfaceState(autoState).ok);
  assert(autoState.player.techniques.kiem_khi_so_cap.masteryExp > combatMasteryBefore);
  assert(autoState.player.techniques.tam_phap_dan_dien.masteryExp > mindMasteryBefore);
  assert(autoState.player.techniques.tam_phap_dan_dien.masteryExp > autoState.player.techniques.kiem_khi_so_cap.masteryExp);
  assert.strictEqual(E.fortuneStatus(50.699999999999996).name, "Tiểu Thiên Kiêu");
  assert(E.realmLore(autoState, 1).text.includes("Cái giá"));

  ["thong_mach_dan", "tu_khi_dan", "hoan_huyet_dan"].forEach((itemId) => {
    const pillCharacter = E.createCharacter({ name: itemId, archetypeId: "kiem_tong", fates: E.drawInitialFates() });
    const pillState = E.createState({ character: pillCharacter });
    assert(E.chooseJourneyIntent(pillState, "tam_su").success);
    E.addItem(pillState, itemId, 1);
    E.useItem(pillState, D.ITEMS[itemId].name);
    assert.strictEqual(pillState.player.realmId, "khai_lo");
    assert.strictEqual(pillState.pendingGuildChoice, true);
    assert.strictEqual(pillState.inventory[itemId], undefined);
  });

  const independentCharacter = E.createCharacter({ name: "Tán Tu", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const independentState = E.createState({ character: independentCharacter });
  assert(E.chooseJourneyIntent(independentState, "tu_lap").success);
  E.enterLuyenKhi(independentState, "kiểm thử");
  assert.strictEqual(E.refuseGuild(independentState, "thế gia"), false);
  assert.strictEqual(independentState.player.journeyIntent, "tu_lap");
  assert.strictEqual(independentState.flags.guildDecision, "journey:tu_lap");
  assert.strictEqual(independentState.quests.chon_dao_lo.status, "active");

  const migrated = E.deserialize(JSON.stringify({ state: { ...state, visitedLocations: undefined } }));
  assert.deepStrictEqual(Array.from(migrated.visitedLocations), [state.locationId]);

  const canonicalSave = JSON.parse(E.serialize(state));
  assert.strictEqual(canonicalSave.version, 13);
  assert.strictEqual(canonicalSave.state.player.realm.id, "khai_lo");
  assert(!Object.prototype.hasOwnProperty.call(canonicalSave.state, "fateInventory"));
  assert.strictEqual(E.deserialize(JSON.stringify(canonicalSave)).player.realmId, "khai_lo");

  const unbound = E.createState({ character: E.createCharacter({ name: "Vô Lộ", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  assert.strictEqual(E.selectPath(unbound, "ngoai_dao_gia").success, false);
  unbound.player.exp = 100;
  assert(E.doBreakthrough(unbound).changed);
  assert.strictEqual(unbound.player.realmId, "khai_lo");
  assert(E.selectPath(unbound, "ngoai_dao_gia").success);
  unbound.player.exp = 2999;
  assert(!E.doBreakthrough(unbound).changed);
  assert(!unbound.player.tainted.attentionPending);
  assert.strictEqual(E.chooseTaintedAttention(unbound, "blessing").success, false);

  const tainted = E.createState({ character: E.createCharacter({ name: "Dị Hóa", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  tainted.player.realmId = "anh_linh";
  E.recordTaintedMilestones(tainted);
  assert.strictEqual(E.contextState(tainted).state, "TAINTED_ATTENTION_CHOICE");
  assert.strictEqual(E.contextState(tainted).actions.length, 3);
  assert(E.chooseTaintedAttention(tainted, "blessing").success);
  assert.strictEqual(E.chooseTaintedAttention(tainted, "suspicion").success, false);
  const restoredTainted = E.deserialize(E.serialize(tainted));
  assert.strictEqual(restoredTainted.player.tainted.vocation, "blessing");
  assert(!restoredTainted.player.tainted.attentionPending);

  restoredTainted.player.realmId = "hop_dao";
  restoredTainted.player.tainted.faction = "rebel_heaven";
  assert(E.learnTechnique(restoredTainted, "cam_thuat_huyet_te"));
  restoredTainted.player.qi = restoredTainted.player.maxQi;
  restoredTainted.player.stamina = restoredTainted.player.maxStamina;
  const lifeBefore = restoredTainted.player.lifespan;
  const warning = E.useTechnique(restoredTainted, "cam_thuat_huyet_te");
  assert(warning.requiresConfirmation);
  assert.strictEqual(restoredTainted.player.lifespan, lifeBefore);
  assert(E.useTechnique(restoredTainted, "cam_thuat_huyet_te", { confirmed: true }).success);
  assert.strictEqual(restoredTainted.player.lifespan, lifeBefore - 1);

  const titles = sandbox.window.PATH_FATE_RELATIONS.path_titles;
  Object.entries(titles).forEach(([pathId, list]) => {
    assert.strictEqual(list.length, 14, `Path title count: ${pathId}`);
    if (pathId !== "ngoai_dao_gia") assert.strictEqual(new Set(list).size, 14, `Path titles duplicated: ${pathId}`);
  });
}

function verifyMapUI(sandbox) {
  const elements = { home: {}, create: {}, game: {}, "tab-content": { innerHTML: "" } };
  sandbox.activeTestTab = "map";
  sandbox.document = {
    getElementById: (id) => elements[id] || {},
    querySelector: (selector) => selector === ".tab.active" ? { dataset: { tab: sandbox.activeTestTab } } : null
  };
  vm.runInContext(read("js/ui.js"), sandbox, { filename: "js/ui.js" });

  const E = sandbox.window.GameEngine;
  const character = E.createCharacter({ name: "Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const actionState = E.createState({ character });
  assert(E.chooseJourneyIntent(actionState, "tu_lap").success);
  const normalActions = sandbox.window.GameUI.actionPresentation(actionState);
  ["act_move_bac", "act_move_nam", "act_move_dong", "act_move_tay"].forEach((id) => assert(normalActions.quick.some((action) => action.id === id), `missing cardinal movement action: ${id}`));
  const normalQuickIds = normalActions.quick.map((action) => action.id);
  assert(normalQuickIds.includes("act_nhin"));
  assert(normalQuickIds.includes("act_tu_luyen"));
  assert(normalQuickIds.includes("act_hanh_trang"));
  assert(normalQuickIds.some((id) => id.startsWith("act_move_")));
  assert(normalActions.quick.length <= 12);
  assert(normalActions.overflow.some((action) => action.id === "act_giup"), "utility actions must remain available in More");
  const searchAction = normalActions.quick.concat(normalActions.overflow).find((action) => action.id === "act_tim_kiem");
  assert(searchAction?.description.includes("Độ sâu dò"));

  const originHtml = sandbox.window.GameUI.renderOriginChoice(actionState);
  ["Tán Tu", "Thế Gia", "Kiếm Tu Lang Bạt", "Linh Mạch Truyền Thừa", "data-origin-confirm"].forEach((label) => assert(originHtml.includes(label), `missing origin modal content: ${label}`));
  actionState.inventory.linh_thach = 10;
  const cauldronHtml = sandbox.window.GameUI.renderCauldron ? sandbox.window.GameUI.renderCauldron(actionState) : (() => { sandbox.activeTestTab = "cauldron"; sandbox.window.GameUI.renderPanel(actionState); return elements["tab-content"].innerHTML; })();
  assert(cauldronHtml.includes('type="number"'));
  assert(cauldronHtml.includes('max="9"'));
  const fateUxHtml = sandbox.window.GameUI.renderFateDetail(actionState);
  assert(fateUxHtml.includes("Tháo xuống Mệnh Kho"));
  assert(fateUxHtml.includes("Sở hữu "));
  const ritualState = E.createState({ character: E.createCharacter({ name: "Ritual UI", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  assert(E.chooseJourneyIntent(ritualState, "tu_lap").success);
  ritualState.player.realmId = "khai_lo";
  E.updateDerived(ritualState);
  const ritualHtml = sandbox.window.GameUI.renderRitualModal(ritualState, "call_fate", { disabled_reason: "Tu vi: 0 / 100" });
  ["ritual-stepper", "BƯỚC HIỆN TẠI", "Chi phí & rủi ro", "Mở Tử Vi Mệnh Số"].forEach((label) => assert(ritualHtml.includes(label), `missing ritual UI: ${label}`));
  assert(!E.breakthroughRitualGateRequirements(ritualState, "compare").some((item) => item.label.includes("Neo")), "compare gate must not be blocked by the later anchor step");
  sandbox.activeTestTab = "map";

  const npcState = E.createState({ character });
  assert(E.chooseJourneyIntent(npcState, "tu_lap").success);
  npcState.locationId = "van_phong";
  const npcQuickIds = sandbox.window.GameUI.actionPresentation(npcState).quick.map((action) => action.id);
  assert(npcQuickIds.some((id) => id.startsWith("act_talk_")), "NPC talk must be promoted to quick actions");
  E.ensureNpcWorldState(npcState);
  const localNpc = Object.values(npcState.worldSimulation.npcState).find((npc) => npc.status === "alive" && npc.currentNodeId === npcState.locationId && (!npc.currentSubLocationId || npc.currentSubLocationId === npcState.currentSubLocationId));
  assert(localNpc, "NPC fixture must resolve to the current node");
  assert(E.npcTalk(npcState, localNpc.npcId).success);
  const npcQuests = E.npcQuestStatus(npcState, localNpc.npcId);
  assert(npcQuests.length === 1);
  assert(E.validateNpcQuestState(npcState).ok);
  assert(E.acceptNpcQuest(npcState, npcQuests[0].id).success);
  assert(E.validateNpcQuestState(npcState).ok);
  assert(E.npcQuestStatus(npcState, localNpc.npcId).length === 0, "NPC quest must not be offered again while active");
  localNpc.status = "dead";
  assert(!E.npcTalk(npcState, localNpc.npcId).success, "dead NPC must not be talkable");
  localNpc.status = "alive";
  const prisonerState = E.createState({ character: E.createCharacter({ name: "Prisoner QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  prisonerState.prisoners.qa_prisoner = { id: "qa_prisoner", entityId: "yeu_thu", capturedDay: E.gameDayOrdinal(prisonerState.gameClock), resolveByDay: E.gameDayOrdinal(prisonerState.gameClock) + 5, resistance: 50, status: "held" };
  assert(E.validatePrisonerState(prisonerState).ok);
  assert(!E.interrogate(prisonerState, "qa_prisoner", "invalid_method").success);
  assert(!E.resolvePrisoner(prisonerState, "qa_prisoner", "invalid_outcome").success);
  assert(E.resolvePrisoner(prisonerState, "qa_prisoner", "released").success);
  assert(E.validatePrisonerState(prisonerState).ok);
  assert(!E.resolvePrisoner(prisonerState, "qa_prisoner", "executed").success, "resolved prisoner must not be processed twice");

  const actualMoveIds = E.moveActions(actionState).map((action) => action.id).sort();
   const declaredMoveIds = ["act_move_bac", "act_move_nam", "act_move_dong", "act_move_tay"].sort();
   assert.deepStrictEqual(Array.from(actualMoveIds), Array.from(declaredMoveIds));
   assert(!E.contextState(actionState).actions.some((action) => action.id.startsWith("act_explore_")));

  const combatState = E.createState({ character });
  assert(E.chooseJourneyIntent(combatState, "tu_lap").success);
  combatState.enemies = { yeu_thu: 1 };
  const combatQuickIds = sandbox.window.GameUI.actionPresentation(combatState).quick.map((action) => action.id);
  ["act_tan_cong_thuong", "act_bo_chay", "act_nhin", "act_hanh_trang"].forEach((id) => assert(combatQuickIds.includes(id), `missing combat quick action: ${id}`));
  assert(combatQuickIds.some((id) => id.startsWith("act_skill_")));

  sandbox.window.GameUI.renderPanel(E.createState({ character }));
  assert(elements["tab-content"].innerHTML.includes("world-map"));
  assert(elements["tab-content"].innerHTML.includes("faction-pin"));
  assert(elements["tab-content"].innerHTML.includes("guild-pin"));
  const addressCatalog = E.mapAddressCatalog();
  assert(addressCatalog.services.length >= 2, "map must contain market addresses");
  assert(addressCatalog.spawnPoints.length >= 5, "map must contain character spawn/respawn addresses");
  assert(addressCatalog.organizations.length >= 100, "map must contain organization Oxy addresses");
  [...addressCatalog.services, ...addressCatalog.spawnPoints].forEach((address) => {
    assert(address.oxyNode && Number.isFinite(Number(address.oxyNode.x)) && Number.isFinite(Number(address.oxyNode.y)), `invalid Oxy address: ${address.id}`);
  });
  addressCatalog.organizations.forEach((address) => {
    assert(address.nodeId && sandbox.window.GameData.LOCATIONS[address.nodeId], `organization must resolve to a map node: ${address.id}`);
  });
  const organizationAddress = addressCatalog.organizations[0];
  const organizationState = E.createState({ character: E.createCharacter({ name: "Organization QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  organizationState.locationId = organizationAddress.nodeId;
  E.addItem(organizationState, "linh_thach", 20);
  assert(E.organizationSnapshot(organizationState, organizationAddress.refId)?.atNode);
  assert(E.organizationInteract(organizationState, organizationAddress.refId, "donate", 10).success);
  assert(!E.organizationInteract(organizationState, organizationAddress.refId, "donate", 1).success, "organization daily interaction limit missing");
  const savedOrganizationAddresses = sandbox.window.GameData.WORLD_MAP.addresses.organizations;
  sandbox.window.GameData.WORLD_MAP.addresses.organizations = savedOrganizationAddresses.filter((address) => address.refId !== organizationAddress.refId);
  const missingAddressState = E.createState({ character: E.createCharacter({ name: "Missing Address QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  E.addItem(missingAddressState, "linh_thach", 20);
  const missingAddressInventory = Number(missingAddressState.inventory.linh_thach || 0);
  assert(!E.organizationInteract(missingAddressState, organizationAddress.refId, "donate", 10).success);
  assert.strictEqual(Number(missingAddressState.inventory.linh_thach || 0), missingAddressInventory);
  sandbox.window.GameData.WORLD_MAP.addresses.organizations = savedOrganizationAddresses;
  assert(E.validateOrganizationState(organizationState).ok);
  organizationState.organizationState.relations.qa_corrupt = { organizationId: "qa_missing_organization", reputation: 0, favor: 0, trust: 0, heat: 0 };
  const organizationFullAudit = E.validateExpansionState(organizationState);
  assert(!organizationFullAudit.valid && organizationFullAudit.errors.some((error) => error.startsWith("organizations:")));
  delete organizationState.organizationState.relations.qa_corrupt;
  assert(E.validateExpansionState(organizationState).valid);
  const organizationLog = E.novelLogParagraphs(organizationState).at(-1)?.text || "";
  assert(organizationLog.includes("Tại") && organizationLog.includes("Mối quan hệ") && !organizationLog.includes("organizationInteract"));
  const mapEventState = E.createState({ character: E.createCharacter({ name: "Map Event QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const pendingMapEvent = E.rollMapEvent(mapEventState, "first_discovery");
  assert(pendingMapEvent && E.validateMapEventState(mapEventState).ok);
  const eventNode = mapEventState.locationId;
  mapEventState.locationId = "cam_dia";
  assert(!E.resolveMapEvent(mapEventState, pendingMapEvent.choices[0].id).success, "map event must reject resolution outside its node");
  mapEventState.locationId = eventNode;
  assert(E.resolveMapEvent(mapEventState, pendingMapEvent.choices[0].id).success);
  assert(E.validateMapEventState(mapEventState).ok);
  const mapEventLog = E.novelLogParagraphs(mapEventState).at(-1)?.text || "";
  assert(mapEventLog.includes("Tại") && !mapEventLog.includes("resolveMapEvent"));
  const auctionState = E.createState({ character: E.createCharacter({ name: "Auction QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  E.addItem(auctionState, "linh_thach", 100);
  const auctionLots = E.expansionSummary(auctionState).auctionLots;
  assert(auctionLots.length > 0, "auction must expose active lots");
  assert(E.validateAuctionState(auctionState).ok);
  const auctionLot = auctionLots[0];
  assert(E.bidAuction(auctionState, auctionLot.id, auctionLot.currentBid + 5).success);
  assert(E.validateAuctionState(auctionState).ok);
  const auctionRewardBeforeRefresh = Number(auctionState.inventory?.[auctionLot.itemId] || 0);
  E.refreshAuction(auctionState, Number(auctionState.auction.generatedDay || 1) + 7);
  assert(Number(auctionState.inventory?.[auctionLot.itemId] || 0) === auctionRewardBeforeRefresh + 1, "expired winning auction lot must settle before refresh");
  const auctionLog = E.novelLogParagraphs(auctionState).findLast((entry) => entry.text.includes("phường thị"))?.text || "";
  const auctionItemName = sandbox.window.GameData.ITEMS[auctionLot.itemId]?.name || auctionLot.itemId;
  assert(auctionLog.includes(auctionItemName) && auctionLog.includes("phường thị") && !auctionLog.includes("bidAuction"));
  const contractState = E.createState({ character: E.createCharacter({ name: "Contract QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const contractBoard = E.refreshContracts(contractState);
  assert(Object.keys(contractBoard.offers).length > 0, "contract board must expose offers");
  assert(E.validateContractBoardState(contractState).ok);
  const contractId = Object.keys(contractBoard.offers)[0];
  assert(E.acceptContract(contractState, contractId).success);
  assert(E.validateContractBoardState(contractState).ok);
  const contractLog = E.novelLogParagraphs(contractState).at(-1)?.text || "";
  assert(contractLog.includes("Khế ước") && !contractLog.includes("acceptContract"));
  sandbox.window.GameUI.setMapView("local", E.createState({ character }));
   assert(elements["tab-content"].innerHTML.includes("data-map-dir") || elements["tab-content"].innerHTML.includes("data-map-explore-dir"));
  assert(elements["tab-content"].innerHTML.includes("local-constellation"), "local map must use constellation renderer");
   assert(elements["tab-content"].innerHTML.includes('class="map-path'), "local map must render confirmed real edges");
   assert(elements["tab-content"].innerHTML.includes("tree-edge"), "local map must render spanning-tree edges");
  ["bac", "nam", "dong", "tay"].forEach((direction) => {
     assert(elements["tab-content"].innerHTML.includes(`data-map-dir="${direction}"`) || elements["tab-content"].innerHTML.includes(`data-map-explore-dir="${direction}"`), `missing open-world direction: ${direction}`);
  });
   assert(elements["tab-content"].innerHTML.includes("map-node"));
  sandbox.activeTestTab = "status";
  sandbox.window.GameUI.renderPanel(E.createState({ character }));
  ["Khí Huyết", "Thanh Tỉnh", "Tà Nhiễm", "Căn cốt", "Ngộ tính", "Mệnh Trạng Thái", "Trang Bị / Pháp Bảo", "Loại Trang Bị", "Số Lượng", "Vật Phẩm Đã Trang Bị", "Pháp khí", "Hộ thân · Giáp", "Hộ thân · Ngoa", "Hộ thân · Quần", "Hộ thân · Mũ", "Tùy thân Pháp khí", "Bản mệnh Linh bảo", "Pháp khí Sinh hoạt", "<i>?</i>"]
    .forEach((label) => assert(elements["tab-content"].innerHTML.includes(label), `missing status label: ${label}`));
  const detailState = E.createState({ character });
  const fateHtml = sandbox.window.GameUI.renderFateDetail(detailState);
  assert(fateHtml.includes("Mệnh Hòa Tỷ") && fateHtml.includes("Hiệu Mệnh") && !fateHtml.includes(">R "));
  const realmHtml = sandbox.window.GameUI.renderRealmDetail(detailState);
  assert(realmHtml.includes("???") && !realmHtml.includes("data-auto-cultivate"));
  sandbox.activeTestTab = "guilds";
  const guildChoiceState = E.createState({ character });
  E.enterLuyenKhi(guildChoiceState, "kiểm thử UI");
  sandbox.window.GameUI.renderPanel(guildChoiceState);
  assert(elements["tab-content"].innerHTML.includes("data-guild-join") || elements["tab-content"].innerHTML.includes("Chưa đủ tư cách"));
  assert(!elements["tab-content"].innerHTML.includes("data-guild-refuse"));
  sandbox.activeTestTab = "world";
  const expansionUiState = E.createState({ character: E.createCharacter({ name: "Expansion UI", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  sandbox.window.GameUI.renderPanel(expansionUiState);
  const worldHtml = elements["tab-content"].innerHTML;
  ["Thế Sự", "Khế Ước", "Chiến Sự", "Công Trình Tông Môn", "Cơ Duyên"]
    .forEach((label) => assert(worldHtml.includes(label), `missing world UI: ${label}`));
  ["Cổ Tịch Tà Thần", "Tù Binh & Dị Thú", "Mệnh Số Tiến Hóa", "Đấu Giá"]
    .forEach((label) => assert(!worldHtml.includes(label), `misplaced world UI: ${label}`));
  sandbox.activeTestTab = "oddities";
  sandbox.window.GameUI.renderPanel(expansionUiState);
  const odditiesHtml = elements["tab-content"].innerHTML;
  const odditiesVisibleHtml = odditiesHtml.replace(/<!--[\s\S]*?-->/g, "");
  ["Dị Thể", "Cổ Tịch", "Nghề Ẩn", "Sưu Tầm", "Dị Thú", "NPC Hiếm"]
    .forEach((label) => assert(odditiesVisibleHtml.includes(label), `missing oddities UI: ${label}`));
  assert(!odditiesVisibleHtml.includes("Dị Chí"), "legacy Dị Chí label must not appear in player UI");
  sandbox.activeTestTab = "dithe";
  sandbox.window.GameUI.renderPanel(expansionUiState);
  const ditheHtml = elements["tab-content"].innerHTML;
  ["Dị Thể", "Dấu mốc", "Cái giá", "daoTamGainMult"].forEach((label) => {
    if (label === "daoTamGainMult") assert(!ditheHtml.includes(label), "internal cost key must not appear in Dị Thể UI");
    else assert(ditheHtml.includes(label), `missing Dị Thể UI: ${label}`);
  });
  sandbox.activeTestTab = "structures";
  sandbox.window.GameUI.renderPanel(expansionUiState);
  const structuresHtml = elements["tab-content"].innerHTML;
  ["Công Trình", "Truyền Tống Trận", "Hộ Giới Đại Trận"].forEach((label) => assert(structuresHtml.includes(label), `missing structures UI: ${label}`));
  sandbox.activeTestTab = "status";
  sandbox.window.GameUI.renderPanel(expansionUiState);
  assert(elements["tab-content"].innerHTML.includes("Nghề Nghiệp"));
  assert(elements["tab-content"].innerHTML.includes("Chọn nghề chính"));

  const tabRenderState = E.createState({ character: E.createCharacter({ name: "Tab Render QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  ["status", "inventory", "quests", "relations", "guilds", "map", "memory", "world", "oddities", "dithe", "structures", "expansion", "market", "qintian", "cauldron"].forEach((tab) => {
    sandbox.activeTestTab = tab;
    assert.doesNotThrow(() => sandbox.window.GameUI.renderPanel(tabRenderState), `tab render threw: ${tab}`);
    const rendered = String(elements["tab-content"].innerHTML || "");
    assert(rendered.length > 0, `tab render empty: ${tab}`);
    const leaked = rendered.match(/\b(?:undefined|NaN|Cannot read|TypeError)\b/);
    const leakIndex = leaked ? rendered.indexOf(leaked[0]) : -1;
    assert(!leaked, `tab render leaked runtime placeholder: ${tab} (${leaked?.[0]}) ${rendered.slice(Math.max(0, leakIndex - 80), leakIndex + 120)}`);
  });
}

function verifyDomReferences() {
  const html = read("index.html");
  const ids = new Set(Array.from(html.matchAll(/id="([^"]+)"/g), (match) => match[1]));
  ["js/main.js", "js/ui.js"].forEach((file) => {
    for (const match of read(file).matchAll(/(?:getElementById|\$)\("([^"]+)"\)/g)) {
      assert(ids.has(match[1]), `${file} references missing #${match[1]}`);
    }
  });
  assert(html.includes('id="start-region-list"'));
  assert(!html.includes('id="btn-roll-character"'));
  assert(!html.includes('id="creation-roll-result"'));
  assert(!html.includes('id="btn-create-start"'));
  assert(!html.includes('id="guild-select"'));
  assert(!html.includes('id="archetype-list"'));
}

function verifyCreationUI(sandbox) {
  function fakeElement() {
    return {
      value: "", textContent: "", innerHTML: "", className: "", disabled: false,
      children: [], listeners: {}, dataset: {},
      classList: { add() {}, remove() {} },
      addEventListener(type, handler) { this.listeners[type] = handler; },
      appendChild(child) { this.children.push(child); return child; },
      querySelectorAll() { return []; },
      focus() {}, closest() { return null; }
    };
  }
  const ids = [
    "screen-home", "screen-create", "screen-game", "save-indicator", "btn-new", "btn-continue",
    "btn-create-back", "btn-create-start", "btn-roll-character", "char-name", "create-error",
    "start-region-list", "creation-roll-result", "free-form", "free-input", "tab-content"
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, fakeElement()]));
  const storage = {};
  sandbox.document = {
    getElementById: (id) => elements[id] || fakeElement(),
    querySelectorAll: () => [],
    createElement: () => fakeElement()
  };
  sandbox.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; }
  };
  sandbox.setTimeout = (handler) => { handler(); return 0; };
  sandbox.setInterval = () => 0;
  sandbox.alert = () => {};
  sandbox.window.GameUI = {
    showScreen() {}, clearStory() {}, addStory() {}, renderPanel() {}, setLocation() {},
    clearChoices() {}, renderChoices() {}, setSaveIndicator() {}
  };
  vm.runInContext(read("js/main.js"), sandbox, { filename: "js/main.js" });

  elements["btn-new"].listeners.click();
  assert.strictEqual(elements["start-region-list"].children.length, sandbox.window.GameEngine.availableStartRegions(1).length);
  elements["start-region-list"].children[0].listeners.click();
  const saved = JSON.parse(storage.co_di_dien_save_v13).state;
  assert(saved.startRegionId);
  assert.strictEqual(saved.guildMembership, null);
  assert(saved.player.origin.race && saved.player.stats.aptitude && saved.player.origin.spiritualRoots.length);
  assert.strictEqual(saved.player.realm.id, "di_menh");
}

function updateSamples() {
  const samples = Array.from({ length: 5 }, (_, index) => generateCharacter({
    name: `Vô Danh #${String(index + 1).padStart(4, "0")}`
  }));
  fs.writeFileSync(path.join(ROOT, "sample_characters.json"), `${JSON.stringify(samples, null, 2)}\n`, "utf8");
}

function main() {
  if (process.argv.includes("--update-samples")) updateSamples();
  verifyCharacters();
  const sandbox = loadBrowserGame();
  verifyDataIntegrity(sandbox);
  verifyBrowserEngine(sandbox);
  verifyGeneratedItems(sandbox);
  verifyTechniquesAndActions(sandbox);
  verifyExpansionSystems(sandbox);
  verifyMapUI(sandbox);
  verifyDomReferences();
  verifyCreationUI(sandbox);
  console.log("OK: characters, procedural items, map, data integrity, save migration, UI and DOM");
}

if (require.main === module) main();

module.exports = { loadBrowserGame, main };
