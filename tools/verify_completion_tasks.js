"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
[
  "gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js",
  "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js",
  "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js",
  "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));

const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const makeState = () => {
  const state = E.createState({ character: E.createCharacter({ name: "Completion QA", archetypeId: "kiem_tong", fates: E.drawInitialFates(), startRegionId: "trung_vuc" }) });
  const journey = E.chooseJourneyIntent(state, "tu_lap");
  if (!journey.success && !state.flags?.journeyIntentResolved) throw new Error("journey fixture setup failed: " + JSON.stringify(journey));
  X.ensureExpansionState(state);
  return state;
};

function namespaceMigration() {
  const state = makeState();
  state.pathState.schemaVersion = 1;
  state.professionState.schemaVersion = 1;
  state.specialPhysiqueState.schemaVersion = 1;
  state.player.pathId = state.pathState.primaryPathId;
  X.ensureExpansionState(state);
  assert.strictEqual(state.pathState.schemaVersion, 2);
  assert.strictEqual(state.professionState.schemaVersion, 2);
  assert.strictEqual(state.specialPhysiqueState.schemaVersion, 2);
  assert(X.validateCanonicalNamespaces(state).ok);
}

function actionPriority() {
  const state = makeState();
  state.pendingExploration = { id: "qa-search", locationId: state.locationId, findings: [{ type: "resource" }], createdTurn: state.meta.turn };
  const ids = E.contextState(state).actions.map((action) => action.id);
  assert(ids.includes("act_search_collect"));
  assert(!ids.includes("act_tu_luyen"));
  assert(!ids.some((id) => id.startsWith("act_move_")));
  state.pendingSearch = { locationId: state.locationId, findings: [{ type: "information", label: "same-node" }] };
  state.pendingExploration = { locationId: state.locationId, findings: [{ type: "resource", itemId: "linh_thach", qty: 1 }] };
  const canonical = E.pendingExplorationAt(state);
  assert.strictEqual(state.pendingSearch, state.pendingExploration);
  assert.strictEqual(canonical.findings.length, 2);
}

function searchActionLifecycle() {
  const state = makeState();
  state.pendingSearch = { locationId: state.locationId, session: 1, findings: [{ type: "resource", itemId: "linh_thach", qty: 1, label: "Linh Thạch Hạ Phẩm ×1" }], createdAtTurn: state.meta.turn };
  X.ensureExpansionState(state);
  E.contextState(state);
  const collected = E.submitActionId(state, "act_search_collect");
  assert(collected?.success, "collect action did not resolve");
  assert.strictEqual(state.pendingSearch, null);
  assert.strictEqual(state.pendingExploration, null);
  state.pendingSearch = { locationId: state.locationId, session: 2, findings: [{ type: "information", label: "Dấu vết" }], createdAtTurn: state.meta.turn };
  state.pendingExploration = state.pendingSearch;
  const left = E.submitActionId(state, "act_search_leave");
  assert(left?.success, "leave action did not resolve");
  assert.strictEqual(state.pendingSearch, null);
  assert.strictEqual(state.pendingExploration, null);
}

function expansionModalCommands() {
  const state = makeState();
  const opportunity = X.createContestedOpportunity(state);
  assert(opportunity?.choices?.share, "contested opportunity fixture did not open");
  const opportunityResult = X.runExpansionCommand(state, "opportunity", "share");
  assert(opportunityResult?.success && !state.pendingContestedOpportunity, "opportunity choice did not resolve");

  const event = X.rollMapEvent(state, "first_discovery");
  assert(event?.choices?.length, "hidden discovery fixture did not open");
  const eventResult = X.runExpansionCommand(state, "map_event", event.choices[0].id);
  assert(eventResult?.success && !state.pendingMapEvent, "hidden discovery choice did not resolve");
}

function nodeNameMigration() {
  const state = makeState();
  const moved = E.move(state, "bac");
  assert(moved !== false && state.openWorld.nodes[state.locationId], "procedural node fixture did not open");
  state.openWorld.nodes[state.locationId].name = "Dã Lộ Vô Danh · 48,76";
  E.locationExits(state);
  assert(!/[·•]\s*-?\d+\s*[,，]\s*-?\d+\s*$/.test(state.openWorld.nodes[state.locationId].name), "legacy Oxy suffix survived node migration");
}

function movementDiscoveryActions() {
  const state = makeState();
  const before = E.contextState(state).actions.map((action) => action.id);
  assert(["bac", "nam", "dong", "tay"].every((dir) => before.includes("act_move_" + dir)), "cardinal movement panel is incomplete");
  assert(!before.some((id) => id.startsWith("act_explore_")), "legacy exploration actions leaked into the panel");
  const result = E.submitActionId(state, "act_move_bac");
  assert(result !== false && state.locationId === "open_48_77", "exploration action did not materialize and enter node");
  const after = E.moveActions(state).map((action) => action.id);
  assert(after.includes("act_move_nam"), "materialized reciprocal edge did not become a move action");
  assert(E.moveActions(state).find((action) => action.id === "act_move_nam")?.label.includes("Tr\u1edf v\u1ec1 Nam"), "reverse movement did not become a return action");
}

function npcDialogueLifecycle() {
  const state = makeState();
  const npcId = Object.keys(state.worldSimulation.npcState)[0];
  const npc = state.worldSimulation.npcState[npcId];
  npc.currentNodeId = state.locationId;
  npc.currentSubLocationId = state.currentSubLocationId;
  assert(X.npcDialogueAction(state, npcId, "offer").success);
  assert(X.npcDialogueAction(state, npcId, "accept").success);
  assert.strictEqual(state.dialogueState.phase, "PROGRESS");
  assert(X.npcDialogueAction(state, npcId, "progress").success);
  assert(X.npcDialogueAction(state, npcId, "turn_in").success);
  assert(state.questState.completed["npc_quest_" + npcId]);
}

function companionCombatAndOffline() {
  const state = makeState();
  const enemyId = Object.keys(E.entityCatalog()).find((id) => E.combatEntity(state, id)?.hpMax > 0);
  assert(enemyId, "fixture needs a combat entity");
  state.enemies = { [enemyId]: E.combatEntity(state, enemyId).hpMax * 10 };
  state.companion = { entityId: enemyId, customName: "QA Companion", state: "active", hp: 20, hpMax: 20, loyalty: 80, role: "striker" };
  X.ensureExpansionState(state);
  const before = state.enemies[enemyId];
  const skill = X.useCompanionSkill(state);
  if (!skill.success) throw new Error(JSON.stringify({ skill, enemyId, enemies: state.enemies, entity: E.combatEntity(state, enemyId) }));
  assert(state.enemies[enemyId] < before);
  const day = X.gameDayOrdinal(state) + 1;
  X.simulateWorldUntil(state, day, { offline: true });
  assert.strictEqual(state.companion.lastOfflineCombatDay, day);
  assert(X.validateCompanionState(state).ok);
}

function weatherShelter() {
  const state = makeState();
  const regionId = X.weatherSnapshot(state).regionId;
  X.setWeather(state, regionId, "tuyet", 2);
  const npcId = Object.keys(state.worldSimulation.npcState)[0];
  const npc = state.worldSimulation.npcState[npcId];
  npc.currentNodeId = state.locationId;
  X.simulateWorldUntil(state, X.gameDayOrdinal(state) + 1, { offline: true });
  assert.strictEqual(npc.shelterState.inShelter, true);
  assert.strictEqual(npc.aiState, "shelter");
  assert(X.validateNpcScheduler(state).ok);
}

function hiddenProfessionContent() {
  const expected = ["cuong_ngon_gia", "thuc_canh_su", "huyen_anh_su", "vong_nga_su"];
  expected.forEach((id) => {
    const definition = sandbox.window.EXPANSION_DATA.hiddenProfessions[id];
    assert(definition && definition.kind === "tu_tich", "missing Từ Tích profession: " + id);
    assert(definition.linkedTaThanId && definition.failPolicy, "incomplete Từ Tích definition: " + id);
  });
}

function contentAndLargeSave() {
  const endings = sandbox.window.GameData.ENDINGS;
  ["truth", "escape", "succumb", "reincarnation", "godhood"].forEach((id) => {
    const ending = endings[id];
    assert(ending && ending.id === id && ending.title && ending.text && ["good", "neutral", "bad"].includes(ending.tone), "incomplete ending: " + id);
  });
  const pathAudit = X.validatePathFusionCatalog();
  assert(pathAudit.ok && pathAudit.pairCount >= 2, "path fusion content is incomplete");

  const state = makeState();
  state.history ||= [];
  for (let index = 0; index < 1500; index += 1) state.history.push({ type: "narr", text: "large-save-fixture-" + index, day: 1 + (index % 30) });
  const companionEntityId = Object.keys(E.entityCatalog()).find((id) => E.combatEntity(state, id)?.hpMax > 0);
  state.companion = { entityId: companionEntityId, customName: "QA Companion", state: "active", hp: 20, hpMax: 20, loyalty: 80, role: "striker" };
  X.ensureExpansionState(state);
  const encoded = E.serialize(state);
  assert(encoded.length < 8 * 1024 * 1024, "large save exceeds 8MB budget");
  const started = process.hrtime.bigint();
  const restored = E.deserialize(encoded);
  X.simulateWorldUntil(restored, X.gameDayOrdinal(restored) + 30, { offline: true });
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  assert(elapsedMs < 15000, "large save/offline simulation exceeds 15s budget: " + elapsedMs.toFixed(1) + "ms");
  assert(X.validateExpansionState(restored).valid, "large save/offline restore invalid");
}

namespaceMigration();
actionPriority();
searchActionLifecycle();
expansionModalCommands();
nodeNameMigration();
movementDiscoveryActions();
npcDialogueLifecycle();
companionCombatAndOffline();
weatherShelter();
hiddenProfessionContent();
contentAndLargeSave();
console.log("OK: namespace migration, action priority, NPC dialogue, companion combat/offline and weather shelter");
