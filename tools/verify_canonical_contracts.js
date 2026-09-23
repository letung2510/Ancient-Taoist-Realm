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
  ["travelTaskSnapshot", "startTravel", "advanceTravelTask", "resolveMapTransaction", "mapIncidentPreview", "mapOwner", "mapZoneStatus", "selectCompanionTarget", "recordCompanionDamage", "trackNpcFootprint", "resolveNpcSettlements", "prepareTechnique", "advanceTechniqueChannel", "cancelTechniquePreparation", "buildTechniqueContext", "transitionGuildMembership"].forEach((name) => assert.strictEqual(typeof (E[name] || X[name]), "function", "missing canonical API: " + name));
  ["FATE_CANONICAL.md", "CHARACTER_CANONICAL.md", "CON_DUONG_CANONICAL.md", "MAP_CANONICAL.md", "NPC_CANONICAL.md", "COMPANION_CANONICAL.md", "TECHNIQUE_CANONICAL.md", "UI_ACTION_LOG_CANONICAL.md", "DATA_RUNTIME_CANONICAL.md"].forEach((file) => assert(fs.existsSync(path.join(ROOT, "requirement", "SYSTEM_LOGIC_CATALOG", "features", file === "FATE_CANONICAL.md" ? "01-fate" : file === "CHARACTER_CANONICAL.md" ? "02-character" : ["CON_DUONG_CANONICAL.md", "TECHNIQUE_CANONICAL.md"].includes(file) ? (file === "CON_DUONG_CANONICAL.md" ? "03-progression" : "06-content") : file === "MAP_CANONICAL.md" ? "04-world" : ["NPC_CANONICAL.md", "COMPANION_CANONICAL.md"].includes(file) ? "05-interaction" : file === "UI_ACTION_LOG_CANONICAL.md" ? "07-ui" : "08-platform", file)), file));
}

function testSaveRoundTripAndCatalogImmutability() {
  const state = makeState();
  const catalogBefore = JSON.stringify(sandbox.window.GameData.FATE_PATTERNS);
  const raw = E.serialize(state);
  const restored = E.deserialize(raw);
  assert.strictEqual(JSON.parse(raw).version, 13);
  assert(E.validateLogSurfaceState(restored).ok);
  assert(X.validateExpansionState(restored).valid);
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
testMovementAndLogContracts();
testTestSuiteQualityGate();
console.log("OK: behavior-first canonical contract suite (surface, save boundary, idempotency, movement/log, test quality)");
