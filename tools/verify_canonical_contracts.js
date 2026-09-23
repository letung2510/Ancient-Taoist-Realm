"use strict";

// Behavior-first replacement gate for legacy smoke tests.  It deliberately
// checks state transitions and round-trips instead of merely checking that a
// symbol/string exists in source.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const makeState = () => E.createState({ character: E.createCharacter({ name: "Canonical QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });

function testCanonicalSurface() {
  ["travelTaskSnapshot", "startTravel", "advanceTravelTask", "resolveMapTransaction", "mapIncidentPreview", "mapOwner", "mapZoneStatus", "selectCompanionTarget", "recordCompanionDamage", "trackNpcFootprint", "resolveNpcSettlements", "prepareTechnique", "advanceTechniqueChannel", "cancelTechniquePreparation", "buildTechniqueContext", "transitionGuildMembership", "mailboxSnapshot"].forEach((name) => assert.strictEqual(typeof (E[name] || X[name]), "function", "missing canonical API: " + name));
  ["FATE_CANONICAL.md", "CHARACTER_CANONICAL.md", "CON_DUONG_CANONICAL.md", "MAP_CANONICAL.md", "NPC_CANONICAL.md", "COMPANION_CANONICAL.md", "TECHNIQUE_CANONICAL.md", "UI_ACTION_LOG_CANONICAL.md", "DATA_RUNTIME_CANONICAL.md"].forEach((file) => assert(fs.existsSync(path.join(ROOT, "requirement", "SYSTEM_LOGIC_CATALOG", "features", file === "FATE_CANONICAL.md" ? "01-fate" : file === "CHARACTER_CANONICAL.md" ? "02-character" : ["CON_DUONG_CANONICAL.md", "TECHNIQUE_CANONICAL.md"].includes(file) ? (file === "CON_DUONG_CANONICAL.md" ? "03-progression" : "06-content") : file === "MAP_CANONICAL.md" ? "04-world" : ["NPC_CANONICAL.md", "COMPANION_CANONICAL.md"].includes(file) ? "05-interaction" : file === "UI_ACTION_LOG_CANONICAL.md" ? "07-ui" : "08-platform", file)), file));
}

function testSaveRoundTripAndCatalogImmutability() {
  const state = makeState();
  const catalogBefore = JSON.stringify(sandbox.window.GameData.FATE_PATTERNS);
  const raw = E.serialize(state);
  const restored = E.deserialize(raw);
  assert.strictEqual(JSON.parse(raw).version, 13);
  assert.strictEqual(JSON.parse(raw).schema, "tu_vi_quy_di_canonical_v13");
  assert(E.validateLogSurfaceState(restored).ok);
  assert(X.validateExpansionState(restored).valid);
  assert(Number(restored.meta.featureVersions.techniqueCrossSystem) >= 1);
  ["pathVariant", "hybridPath", "pathLevel", "ritualByPath", "transitionHistory", "detachHistory"].forEach((field) => assert(Object.prototype.hasOwnProperty.call(restored.pathState, field), "missing canonical path field: " + field));
  (restored.specialPhysiqueState.history || []).forEach((entry) => assert(entry.result && entry.trigger));
  const worldClock = E.ensureWorldClock(restored);
  assert.strictEqual(restored.gameClock.world.epochDate, "6876-01-01");
  assert.strictEqual(restored.gameClock.world.startDayIndex, 2475360);
  assert.strictEqual(restored.gameClock.world.currentDayIndex, worldClock.absoluteDay);
  assert(Number.isFinite(restored.gameClock.world.currentYear));
  const discoverySnapshot = JSON.stringify(restored.discoveries);
  X.discoveryStatusSummary(restored);
  assert.strictEqual(JSON.stringify(restored.discoveries), discoverySnapshot, "discovery summary must be a pure read model");
  assert.strictEqual(JSON.stringify(sandbox.window.GameData.FATE_PATTERNS), catalogBefore, "runtime must not mutate Fate catalog");
}

function testTechniqueIdempotency() {
  const state = makeState();
  const id = Object.keys(E.techniqueCatalog()).find((key) => !["tam_phap", "dan_phu_phap"].includes(E.techniqueCatalog()[key].category));
  assert(id);
  state.player.techniques[id] = { masteryStage: 0, masteryExp: 0, usageCount: 0 };
  const before = { qi: state.player.qi, stamina: state.player.stamina };
  const first = E.useTechnique(state, id, { actionId: "canonical-cast-1", stance: "steady", confirmed: true });
  const second = E.useTechnique(state, id, { actionId: "canonical-cast-1", stance: "steady", confirmed: true });
  assert(first.success || first.committed);
  assert(second.duplicate);
  assert(state.player.qi <= before.qi && state.player.stamina <= before.stamina);
  const prepared = E.prepareTechnique(state, id, "canonical-prepare-1");
  assert(!prepared.success || prepared.reason.includes("hồi chiêu"), "cooldown must block a second prepare immediately after a cast");
  const restored = E.deserialize(E.serialize(state));
  assert(restored.player.techniqueActionReceipts?.["canonical-cast-1"], "technique receipt must survive save/load");
  Object.values(restored.player.techniqueCooldowns || {}).forEach((entry) => assert(typeof entry === "number" || Number.isFinite(Number(entry?.readyAtTurn))));
}

function testPendingDiscoveryBoundaries() {
  const state = makeState();
  state.pendingMapEvent = { id: "map-qa", eventId: "qa-event", nodeId: state.locationId, status: "pending", choices: [{ id: "x" }] };
  state.mapEvents = { nodes: {}, history: [] };
  const departure = E.confirmPendingDeparture(state);
  assert(departure.changed && !state.pendingMapEvent, "confirmed departure must abandon map events");
  assert(state.mapEvents.history.some((entry) => entry.status === "abandoned"));
  state.pendingExploration = { locationId: state.locationId, nodeId: state.locationId, session: 1, findings: [{ findingId: "bad", type: "resource", itemId: "missing_item", qty: 1 }], expiresTurn: state.meta.turn + 3 };
  state.pendingSearch = state.pendingExploration;
  const before = JSON.stringify(state.pendingExploration);
  const collected = E.collectSearchFindings(state);
  assert(collected.success && JSON.stringify(state.pendingExploration) === before, "failed finding grant must remain pending");
  state.pendingExploration.expiresTurn = state.meta.turn - 1;
  assert.strictEqual(E.pendingExplorationAt(state), null, "expired exploration must not block actions");
  state.enemies = { yeu_thu: 100 };
  const blockedSearch = E.search(state);
  assert.strictEqual(blockedSearch.success, false);
  assert(blockedSearch.reason.includes("giao chiến"));
  state.enemies = {};
  state.travelTask = { status: "active" };
  const blockedTravelSearch = E.search(state);
  assert.strictEqual(blockedTravelSearch.success, false);
  state.travelTask = null;
}

function testMovementAndLogContracts() {
  const state = makeState();
  const actions = E.moveActions(state).map((action) => action.id);
  ["act_move_bac", "act_move_nam", "act_move_dong", "act_move_tay"].forEach((id) => assert(actions.includes(id), "missing movement direction: " + id));
  E.pushHistory(state, { type: "COMMAND_ECHO", text: "> [canonical-test]", debugOnly: true, playerVisible: false });
  E.pushHistory(state, { type: "narr", text: "Gió lạnh lướt qua lối núi; dấu chân còn mới." });
  const paragraphs = E.novelLogParagraphs(state);
  assert(paragraphs.length >= 1 && !paragraphs.some((entry) => entry.text.includes("canonical-test")));
  paragraphs.forEach((entry) => assert(!/\b(?:undefined|NaN|TypeError|INTERNAL_[A-Z_]+)\b/.test(entry.text)));
  state.enemies = { qa_enemy: 10 };
  const blockedMove = E.move(state, "bac");
  assert.strictEqual(blockedMove.success, false, "movement must be rejected during combat");
}

function testMapAndNpcTransactions() {
  const state = makeState();
  state.pendingMapEvent = { id: "cave-qa", eventId: "dong_phu_hidden_abode", nodeId: state.locationId, status: "pending", choices: [{ id: "enter" }] };
  state.mapEvents = { nodes: {}, history: [] };
  const result = E.resolveMapEvent(state, "enter");
  assert(result.success && state.pendingCaveChallenge?.status === "pending");
  assert.strictEqual(JSON.stringify(state.pendingCaveChallenge.obstacles), JSON.stringify(["guardian", "formation", "sealed_ward"]));
  const before = JSON.stringify(state.questState);
  X.npcQuestStatus(state, "missing-npc");
  assert.strictEqual(JSON.stringify(state.questState), before, "NPC quest status must be a pure read");
}

function testOfflineCadenceAndLifecycleContracts() {
  const state = makeState();
  const day = E.gameDayOrdinal(state.gameClock);
  state.questState.active = { "npc_quest_expiry": { id: "npc_quest_expiry", giverNpcId: "qa_npc", status: "active", expiresDay: day + 1 } };
  state.questState.failed = {};
  X.simulateWorldAggregate(state, day, day + 3);
  assert.strictEqual(state.questState.active["npc_quest_expiry"], undefined, "offline cadence must expire active NPC quests");
  assert.strictEqual(state.questState.failed["npc_quest_expiry"].status, "failed");

  const cultivation = E.recordCultivationGain(state, 10, "combat_insight", { note: "canonical-source" });
  assert(cultivation.gained > 0 && state.player.cultivation.velocitySamples.at(-1).source === "combat_insight");
  const trial = X.triggerMinorTrial(state, "canonical-minor-trial");
  assert(trial.success && state.flags.minorTrial.status === "active");

  const factions = Object.keys(state.worldSimulation.factionState || {});
  if (factions.length) {
    const orphanDay = Math.ceil(day / 3) * 3;
    state.worldSimulation.wars.orphan = { id: "orphan", factionA: "missing-faction", factionB: factions[0], startedDay: orphanDay, scoreA: 0, scoreB: 0, status: "active", playerInterventions: [] };
    X.simulateWorldAggregate(state, orphanDay, orphanDay + 1);
    assert.strictEqual(state.worldSimulation.wars.orphan, undefined, "orphan wars must be removed at the world boundary");
    assert(X.validateWarState(state).ok);
  }
}

function testTestSuiteQualityGate() {
  const files = fs.readdirSync(path.join(ROOT, "tools")).filter((file) => /^verify_.*\.js$/.test(file) && file !== "verify_canonical_contracts.js");
  files.forEach((file) => {
    const source = fs.readFileSync(path.join(ROOT, "tools", file), "utf8");
    assert(!/assert\(\s*true\s*\)/.test(source), file + " contains tautological assert(true)");
    assert(!/assert\.ok\(\s*true\s*\)/.test(source), file + " contains tautological assert.ok(true)");
  });
}

testCanonicalSurface();
testSaveRoundTripAndCatalogImmutability();
testTechniqueIdempotency();
testPendingDiscoveryBoundaries();
testMovementAndLogContracts();
testMapAndNpcTransactions();
testOfflineCadenceAndLifecycleContracts();
testTestSuiteQualityGate();
console.log("OK: behavior-first canonical contract suite (surface, save boundary, idempotency, movement/log, offline cadence, lifecycle, test quality)");
