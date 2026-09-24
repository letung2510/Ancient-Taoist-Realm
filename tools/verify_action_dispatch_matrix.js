"use strict";

// Every action exposed by the canonical context must resolve through a real
// producer. A failed business precondition is valid; an unknown dispatcher
// response is not. Each action is executed on an isolated save clone so this
// probe cannot consume the shared fixture state.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const sandbox = { window: {}, console, performance: { now: () => Date.now() }, Date };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const makeState = (variant) => {
  const state = E.createState("action-dispatch-matrix-" + variant);
  X.ensureExpansionState(state);
  if (state.flags?.journeyIntentPending) E.chooseJourneyIntent(state, "tu_lap");
  if (variant === "companion") state.companion = X.normalizeCompanion({ entityId: "matrix_companion", state: "active", hp: 30, hpMax: 30, passiveId: "scout" });
  if (variant === "recovering") state.companion = X.normalizeCompanion({ entityId: "matrix_companion", state: "recovering", hp: 0, hpMax: 30, passiveId: "scout", recoveryUntilDay: X.gameDayOrdinal(state) + 3 });
  if (variant === "mutation") state.companion = X.normalizeCompanion({ entityId: "matrix_companion", state: "mutated", hp: 30, hpMax: 30, passiveId: "scout", mutationPending: true });
  if (variant === "combat") { E.spawnCombatEntity(state, "di_qui"); }
  if (variant === "progression") { state.player.realmLevel = 2; state.player.exp = 250; E.updateDerived(state); }
  if (variant === "pending") state.pendingMapEvent = { id: "matrix_event", status: "pending", nodeId: state.locationId, choices: [{ id: "leave", label: "Rời đi" }] };
  if (variant === "cave") state.pendingCaveChallenge = { id: "matrix_cave", status: "pending", nodeId: state.locationId, obstacles: ["guardian", "formation", "sealed_ward"], completed: [] };
  if (variant === "pursuit") state.pendingNpcPursuit = { id: "matrix_pursuit", status: "pending", npcId: "matrix_npc" };
  if (variant === "npc") {
    state.worldSimulation.npcState.matrix_npc = { npcId: "matrix_npc", name: "Matrix NPC", status: "alive", actorClass: "persistent", role: "merchant", currentNodeId: state.locationId, currentSubLocationId: state.currentSubLocationId || "main", canTeachRareTechnique: false, preferences: ["trade"], aiState: "present", mailbox: [], rumors: [], memoryWithPlayer: [] };
    state.inventory.linh_thach = 2;
  }
  if (variant === "org") {
    const orgEntry = Object.entries(E.locationPool(state)).find(([, node]) => node?.organizationId);
    if (orgEntry) {
      state.locationId = orgEntry[0];
      const guildId = orgEntry[1].organizationId;
      state.guildMembership = { guildId, status: "active", rankIndex: 1, rankId: "ngoai_mon", contribution: 0, revision: 1 };
      X.ensureOrganizationState(state);
    }
  }
  if (variant === "hidden") {
    const entry = Object.entries(state.worldSimulation.hiddenRealms || {})[0];
    const definition = entry && (sandbox.window.EXPANSION_DATA.hiddenRealms || []).find((item) => item.id === entry[0]);
    if (definition) { state.locationId = definition.parentNodeId; entry[1].status = "open"; entry[1].opensDay = X.gameDayOrdinal(state) - 1; entry[1].closesDay = X.gameDayOrdinal(state) + 10; }
  }
  return state;
};
const states = ["base", "companion", "recovering", "mutation", "combat", "progression", "pending", "cave", "pursuit", "npc", "org", "hidden"].map(makeState);
// Include both expansion producers and the base engine context surface. The
// older matrix only exercised expansionActions(), leaving combat, movement,
// utility and pending-scene legacy IDs unverified at the dispatcher boundary.
const baseContextActions = E.contextState(states[0])?.actions || [];
const baseActionIds = new Set([...X.expansionActions(states[0]), ...baseContextActions].filter((action) => action?.id).map((action) => action.id));
const actions = [...new Map([...X.expansionActions(states[0]), ...baseContextActions]
  .filter((action) => action?.id)
  .map((action) => [action.id, { action, state: states[0] }])).values()];
const variantSurface = states.slice(1).flatMap((state) => (E.contextState(state)?.actions || [])
  .filter((action) => action?.id)
  .map((action) => ({ id: action.id, state })));
assert(variantSurface.length > 0, "context variant surface is empty");
assert(Array.isArray(actions) && actions.length > 0, "canonical expansion action catalog is empty");
const unknown = [];
const seen = new Set();
let cases = 0;
actions.forEach(({ action, state: sourceState }) => {
  if (!action?.id) return;
  seen.add(action.id);
  cases += 1;
  let result;
  try {
    const clone = E.deserialize(E.serialize(sourceState));
    result = E.submitActionId(clone, action.id, { source: "action-dispatch-matrix" });
  } catch (error) {
    result = { success: false, reason: String(error?.message || error) };
  }
  const reason = String(result?.reason || "");
  if (/không hợp lệ|không tồn tại|mở rộng không hợp lệ|hành động mở rộng không hợp lệ|lệnh mở rộng không hợp lệ|unknown|invalid action|unsupported/i.test(reason)) unknown.push({ id: action.id, reason });
});
assert.deepStrictEqual(unknown, [], "visible canonical action has no dispatcher: " + JSON.stringify(unknown));
assert(seen.size > 0, "action matrix did not exercise any canonical actions");
assert(cases >= seen.size, "action matrix case accounting is inconsistent");
const rollbackState = makeState("base");
const rollbackAction = X.expansionActions(rollbackState).find((entry) => entry.id === "act_exp_divine") || X.expansionActions(rollbackState)[0];
assert(rollbackAction, "rollback fixture action missing");
const turnBeforeThrow = Number(rollbackState.meta.turn);
const updateDerived = E.updateDerived;
E.updateDerived = () => { throw new Error("fixture resolver failure"); };
const rollbackResult = E.submitActionId(rollbackState, rollbackAction.id, { source: "rollback-fixture" });
E.updateDerived = updateDerived;
assert(rollbackResult.code === "ACTION_RUNTIME_ERROR" && rollbackResult.recoverable && Number(rollbackState.meta.turn) === turnBeforeThrow, "action throw did not rollback canonical state");
console.log("OK: canonical action dispatch matrix (" + seen.size + " visible actions, " + cases + " execution cases, " + variantSurface.length + " variant-surface entries)");

