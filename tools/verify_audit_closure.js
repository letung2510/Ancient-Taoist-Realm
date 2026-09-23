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
const X = sandbox.window.GameExpansion;
const makeState = () => E.createState({ character: E.createCharacter({ name: "Audit Closure QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });

function testCompanionActions() {
  const state = makeState();
  state.companion = { entityId: "qa_beast", customName: "QA", state: "recovering", hp: 0, hpMax: 40, loyalty: 60, corruption: 0, mutationPending: true, damageLedger: [] };
  X.ensureExpansionState(state);
  const ids = X.expansionActions(state).map((action) => action.id);
  assert(ids.includes("act_exp_companion_recover") && ids.includes("act_exp_companion_revive") && ids.includes("act_exp_companion_cure") && ids.includes("act_exp_companion_accept"));
  assert(X.runExpansionCommand(state, "companion_mutation", "accept").success);
  assert.strictEqual(state.companion.mutationPending, false);
}

function testNpcLifespanAndSuccession() {
  const state = makeState();
  const day = X.gameDayOrdinal(state);
  state.questState.active.qa_personal = { id: "qa_personal", giverNpcId: "qa_old", status: "active", transferable: false };
  state.questState.active.qa_daily = { id: "qa_daily", giverNpcId: "qa_old", status: "active", transferable: true, frequency: "daily" };
  state.worldSimulation.npcState.qa_old = { npcId: "qa_old", name: "Old QA", role: "keeper", status: "alive", currentNodeId: state.locationId, birthDay: day - 100, ageDays: 100, lifespanDays: 50, relationshipsWithNpcs: {} };
  state.worldSimulation.npcState.qa_heir = { npcId: "qa_heir", name: "Heir QA", role: "guard", status: "alive", currentNodeId: state.locationId, relationshipsWithNpcs: { qa_old: { type: "su_do", score: 10 } } };
  X.updateNpcSchedules(state, day);
  assert.strictEqual(state.worldSimulation.npcState.qa_old.status, "deceased");
  assert.strictEqual(state.questState.failed.qa_personal.status, "failed");
  assert.strictEqual(state.questState.active.qa_daily.giverNpcId, "qa_heir");
  assert.strictEqual(state.worldSimulation.npcState.qa_heir.inheritedRole, "keeper");
}

function testTechniqueCrossSystemContracts() {
  const state = makeState();
  const catalogAudit = X.validateTechniqueCrossSystemCatalog();
  assert(catalogAudit.ok && catalogAudit.policyCount > 0);
  const techniqueId = Object.keys(E.techniqueCatalog())[0];
  state.player.techniques[techniqueId] = { masteryStage: 0, masteryExp: 0, usageCount: 0 };
  const context = X.buildTechniqueContext(state, techniqueId, { stance: "steady" });
  assert.strictEqual(context.techniqueId, techniqueId);
  assert(context.technique && context.progress && context.guild);
  assert(X.validateTechniqueCrossSystemState(state).ok);
  const transition = X.transitionGuildMembership(state, { guildId: "thien_huyen_tong", rank: "ngoai_mon" }, { reason: "qa" });
  assert(transition.success && state.guildMembershipHistory.length === 1);
  const event = X.recordTechniqueTrialEvent(state, techniqueId, { type: "qa" });
  assert(event.id && event.techniqueId === techniqueId);
}

function testTechniquePrepareChannel() {
  const state = makeState();
  const techniqueId = Object.keys(E.techniqueCatalog()).find((id) => !["tam_phap", "dan_phu_phap"].includes(E.techniqueCatalog()[id].category));
  assert(techniqueId);
  state.player.techniques[techniqueId] = { masteryStage: 0, masteryExp: 0, usageCount: 0 };
  const beforeQi = state.player.qi;
  const prepared = E.prepareTechnique(state, techniqueId, "qa-prepare-1");
  assert(prepared.success);
  assert.strictEqual(state.player.qi, beforeQi - prepared.prepareCost.manaCost);
  assert(E.prepareTechnique(state, techniqueId, "qa-prepare-1").duplicate);
  assert(E.advanceTechniqueChannel(state, techniqueId, 0.5).success);
  assert(!E.useTechnique(state, techniqueId, { actionId: "qa-cast-early", requirePrepared: true, preparedActionId: "qa-prepare-1", confirmed: true }).success);
  assert(E.advanceTechniqueChannel(state, techniqueId, 0.5).ready);
  const cast = E.useTechnique(state, techniqueId, { actionId: "qa-cast-1", requirePrepared: true, preparedActionId: "qa-prepare-1", confirmed: true });
  assert(cast.success || cast.committed);
  assert.strictEqual(state.player.techniques[techniqueId].combatState.lastResolvedActionId, "qa-cast-1");
}

function testNpcFootprintAndSettlementContracts() {
  const state = makeState();
  const day = X.gameDayOrdinal(state);
  const npc = { npcId: "qa_traveler", status: "alive", scheduleType: "itinerant", currentNodeId: state.locationId, nodeVisitDays: { [state.locationId]: [1, 2, 3, 4, 5, 6, 7, 8] } };
  state.worldSimulation.npcState.qa_traveler = npc;
  X.recordNpcFootprint(state, npc, state.locationId, state.locationId, day);
  const footprint = state.worldSimulation.npcFootprints[state.locationId][0];
  assert(footprint.clueClass && !Object.prototype.hasOwnProperty.call(footprint, "destinationHint"));
  const tracked = X.trackNpcFootprint(state, state.locationId);
  assert(tracked.success && tracked.direction && !Object.prototype.hasOwnProperty.call(tracked, "destinationHint"));
  X.pruneNpcFootprints(state, day + 4);
  assert(!state.worldSimulation.npcFootprints[state.locationId] || state.worldSimulation.npcFootprints[state.locationId].length === 0);
  for (let monthDay = 30; monthDay <= 900; monthDay += 30) X.resolveNpcSettlements(state, monthDay);
  const settlements = Object.values(state.worldSimulation.settlements || {}).filter((entry) => entry.founderNpcId === "qa_traveler");
  assert(settlements.every((entry) => entry.id === "settlement:qa_traveler:" + entry.nodeId && entry.subLocationId));
}

function testCompanionTargeting() {
  const state = makeState();
  state.companion = { entityId: "qa_beast", state: "active", hp: 40, hpMax: 40, loyalty: 90, corruption: 0, guardStance: "guard", role: "guardian", skillMastery: {}, damageLedger: [] };
  const ids = Object.keys(E.entityCatalog()).slice(0, 2);
  ids.forEach((id) => { const info = E.combatEntity(state, id); if (info) state.enemies[id] = info.hpMax; });
  const target = X.selectCompanionTarget(state, { protectPlayer: true, threatMap: { [ids[0]]: 100, [ids[1]]: 10 }, seedKey: "qa" });
  assert.strictEqual(target, ids[0]);
}

function testCrossCuttingAuditContracts() {
  const state = makeState();
  ["INVALID_USE_COUNT", "MAX_USES", "RESOURCE_SHORTAGE", "EXPIRED", "UNKNOWN_TECHNIQUE", "REALM_TOO_LOW", "PATH_MISMATCH", "FATE_REQUIRED", "FACTION_REQUIRED", "GUILD_REQUIRED", "GUILD_RANK_REQUIRED"].forEach((code) => assert(E.ERROR_NARRATIVE_MAP[code], "missing narrative mapping: " + code));
  assert(E.playerFacingReason("RESOURCE_SHORTAGE").length > 0);
  const paths = E.pathMatchSummary(state.player, "ngoai_dao_gia");
  assert.strictEqual(paths.namespace, "unbound");
  state.player.realmId = "khai_lo";
  const unbound = E.selectPath(state, "ngoai_dao_gia");
  assert(unbound.success && state.pathState.unbound && !state.player.pathId);
  E.pushHistory(state, { type: "action", text: "> internal-command" });
  assert(!E.novelLogParagraphs(state).some((entry) => entry.text.includes("internal-command")));
  const rollSources = Array.from({ length: 80 }, (_, index) => E.rollFateByProgression(state, { source: "qa:" + index, level: 9, allowUniqueTien: false })).filter(Boolean);
  assert(rollSources.length > 0 && rollSources.every((fate) => fate.grade !== "tien"));
}

testCompanionActions();
testNpcLifespanAndSuccession();
testTechniqueCrossSystemContracts();
testTechniquePrepareChannel();
testNpcFootprintAndSettlementContracts();
testCompanionTargeting();
testCrossCuttingAuditContracts();
console.log("OK: audit closure contracts (companion UI/actions/targeting, NPC lifespan/footprints/settlement, technique prepare/channel/cross-system APIs)");
