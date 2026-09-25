"use strict";

// Headless renderer contract: exercise the real GameUI renderers with state
// variants. This is deliberately not called browser E2E; it proves the same
// HTML/action selectors without pretending to prove viewport or file chooser
// behavior that requires a browser connector.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");

function node(tag = "div") {
  return {
    tagName: tag.toUpperCase(), className: "", innerHTML: "", textContent: "",
    dataset: {}, style: {}, disabled: false, open: false, children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild(child) { this.children.push(child); return child; },
    addEventListener() {}, setAttribute() {}, querySelectorAll() { return []; },
    querySelector() { return null; }
  };
}
const nodes = new Map();
const document = {
  getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
  createElement(tag) { return node(tag); },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  body: node("body")
};
const sandbox = {
  window: {}, document, console, performance: { now: () => Date.now() }, Date,
  setTimeout, clearTimeout, URL, Blob, FileReader: function FileReader() {}
};
vm.createContext(sandbox);
[
  "gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js",
  "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js",
  "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js",
  "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js", "js/ui.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));

const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const UI = sandbox.window.GameUI;
const state = E.createState("ui-render-variants");
X.ensureExpansionState(state);
if (state.flags?.journeyIntentPending) E.chooseJourneyIntent(state, "tu_lap");

const html = (label, value, checks) => {
  assert(typeof value === "string" && value.length > 0, label + " rendered empty output");
  checks.forEach((check) => assert(value.includes(check), label + " missing selector/contract: " + check));
};

state.pendingMapEvent = { id: "ui-event", status: "pending", nodeId: state.locationId,
  choices: [{ id: "investigate", label: "Điều tra" }, { id: "leave", label: "Rời đi" }] };
html("map event", UI.renderMapEventModal(state, "act_move_bac"), ["data-expansion-command=\"map_event\"", "data-pending-move=\"act_move_bac\""]);

const originalPending = E.pendingExplorationAt;
E.pendingExplorationAt = () => ({ findings: [{ type: "resource" }, { type: "information" }] });
html("pending discovery", UI.renderPendingDiscoveryModal(state, "act_move_dong"), ["data-pending-resolve=\"act_search_collect\"", "data-pending-resolve=\"act_search_investigate\"", "data-pending-resolve=\"act_search_leave\""]);
E.pendingExplorationAt = originalPending;

state.pendingContestedOpportunity = { rivalId: "su_phu", nodeId: state.locationId, expiresDay: 9,
  reward: 12, choices: { fight: { label: "Cưỡng Đoạt", reward: 12, consequence: "Thất bại" }, share: { label: "Chia Sẻ", reward: 6, consequence: "Thiện duyên" } } };
html("contested opportunity", UI.renderContestedOpportunityModal(state), ["data-expansion-command=\"opportunity\"", "Cưỡng Đoạt", "Chia Sẻ"]);

const originalVault = E.guildVaultSnapshot;
E.guildVaultSnapshot = () => ({ organizationId: "guild_qa", unlocked: true, techniques: [
  { id: "technique_qa", name: "Kỹ năng QA", learned: false },
  { id: "technique_done", name: "Đã học", learned: true }
] });
html("guild teaching", UI.renderGuildTeaching(state), ["data-status-action=\"act_exp_org_study:technique_qa\"", "Đã lĩnh hội"]);
E.guildVaultSnapshot = originalVault;

html("guild project", UI.renderGuildProjectModal(state), ["guild_start", "Công Trình Tông Môn"]);

state.companion = X.normalizeCompanion({ entityId: "ui_companion", state: "recovering", hp: 0, hpMax: 30,
  loyalty: 4, mutationPending: true, skillMastery: {}, damageLedger: {} });
html("companion lifecycle", UI.renderCompanionPanel(state), ["data-expansion-command=\"companion_recover\"", "data-expansion-command=\"companion_revive\"", "data-expansion-command=\"companion_mutation\""]);

E.spawnCombatEntity(state, "ho_phap_huyen_lan");
state.combatIntents = { ho_phap_huyen_lan: { entityId: "ho_phap_huyen_lan", intent: "venom", statusEffects: [{ id: "poison" }] } };
state.combatStatuses = { player: { poison: { id: "poison", duration: 2, potency: 1 } }, enemies: {} };
html("combat readout", UI.renderCombatReadout(state), ["data-combat-readout", "data-combat-intent=\"ho_phap_huyen_lan\"", "data-combat-status=\"poison\""]);

const actionNode = document.getElementById("action-list");
UI.renderActions(state, () => {});
assert(actionNode.children.length > 0, "action variant renderer produced no buttons");
assert(actionNode.children.every((child) => child.tagName === "BUTTON" || child.tagName === "DETAILS"), "action renderer leaked non-action root node");

console.log("OK: headless UI variant render matrix (map/discovery/opportunity/guild/companion/combat/action)");
