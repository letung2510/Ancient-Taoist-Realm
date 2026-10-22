"use strict";
// Characterization tests for cross-module refactors: single sources of truth and read-only views.
const assert = require("assert");
const { loadRuntime } = require("./lib/load_runtime");

const { E, X, window: win } = loadRuntime();

const results = [];
function check(name, fn) {
  try { fn(); results.push(["PASS", name]); } catch (error) { results.push(["FAIL", name, error.message]); }
}
function diffPaths(before, after, path = "", out = []) {
  if (out.length >= 6) return out;
  if (JSON.stringify(before) === JSON.stringify(after)) return out;
  if (!before || !after || typeof before !== "object" || typeof after !== "object") { out.push(path || "<root>"); return out; }
  new Set([...Object.keys(before), ...Object.keys(after)]).forEach((key) => diffPaths(before[key], after[key], path + "." + key, out));
  return out;
}
function assertSameBytes(actual, expected, message) {
  if (actual !== expected) assert.fail(message + " (changed: " + diffPaths(JSON.parse(expected), JSON.parse(actual)).join(", ") + ")");
}
function newState(name) {
  return E.createState({ character: E.createCharacter({ name, archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
}

check("equipment set bonus survives engine-internal updateDerived", () => {
  const build = (setId) => {
    const state = newState("Set QA");
    E.ensureExpansionState(state);
    state.generatedItems = state.generatedItems || {};
    state.generatedItems.qa_set_weapon = { id: "qa_set_weapon", name: "Kiếm QA", kind: "weapon", equipmentType: "artifact", equipmentSetId: setId, stats: {} };
    state.generatedItems.qa_set_armor = { id: "qa_set_armor", name: "Giáp QA", kind: "armor", equipmentType: "protection", equipmentSetId: setId, stats: {} };
    state.inventory.qa_set_weapon = 1; state.inventory.qa_set_armor = 1;
    E.equipItem(state, "qa_set_weapon");
    E.equipItem(state, "qa_set_armor");
    E.updateDerived(state);
    return state;
  };
  const withSet = build("Bá Vương");
  const without = build("none");
  assert.deepStrictEqual(Array.from(E.equipmentSetModifiers(withSet).activeSets), ["Bá Vương"], "fixture must activate the set");
  const delta = () => Number(withSet.player.stats.eff.phyDef) - Number(without.player.stats.eff.phyDef);
  assert.strictEqual(delta(), 3, "set phyDef bonus after E.updateDerived");
  withSet.meta.turn += 1; without.meta.turn += 1;
  E.rest(withSet); E.rest(without);
  assert.strictEqual(delta(), 3, "set phyDef bonus after engine-internal recompute");
});

check("technique eligibility resource gate agrees with preview and commit cost (mastery>=3, lifespan cost)", () => {
  const catalog = E.techniqueCatalog();
  const technique = Object.values(catalog).find((entry) => Number(entry.cost?.lifespan || 0) > 0 && entry.category !== "tam_phap");
  assert(technique, "fixture needs a technique with lifespan cost");
  const state = newState("Technique QA");
  E.ensureExpansionState(state);
  const targetRealm = (win.GameData.REALMS || []).find((entry) => Number(entry.level) >= Number(technique.minRealmLevel || 1));
  if (targetRealm) state.player.realmId = targetRealm.id;
  if (technique.requiredFaction) state.player.tainted = { ...(state.player.tainted || {}), faction: technique.requiredFaction };
  state.player.techniques[technique.id] = { masteryStage: 3, masteryExp: 0, usageCount: 0 };
  state.player.qi = 9999; state.player.stamina = 9999; state.player.san = 100;
  state.player.lifespan = 500;
  const resolved = E.resolveTechniqueExecutionInputs(state, technique, null, "steady").costs;
  const preview = E.techniquePreview(state, technique.id);
  assert(preview.success, "preview must succeed for the fixture: " + preview.reason);
  assert.deepStrictEqual(preview.costs.lifespanCost, resolved.lifespanCost, "preview lifespan cost uses the shared resolver");
  assert.strictEqual(typeof preview.cooldownTurns, "number", "preview exposes cooldownTurns");
  const lifespanBlocked = (s) => X.techniqueEligibility(s, technique.id).blockers.some((entry) => entry.code === "RESOURCE_SHORTAGE" && /Thọ Nguyên/.test(entry.message));
  state.player.lifespan = resolved.lifespanCost;
  const previewAtLimit = E.techniquePreview(state, technique.id);
  assert.strictEqual(lifespanBlocked(state), true, "eligibility must block when lifespan <= committed cost");
  assert.strictEqual(previewAtLimit.success, false, "preview reports the same shortage via eligibility");
  state.player.lifespan = resolved.lifespanCost + 0.001;
  assert.strictEqual(lifespanBlocked(state), false, "eligibility allows just above the committed cost");
  state.player.lifespan = 500;
  const result = E.useTechnique(state, technique.id, { actionId: "refactor-cost-1", confirmed: true });
  assert(result.success || result.committed, "commit must run: " + result.reason);
  const receipt = state.player.techniqueActionReceipts["refactor-cost-1"];
  assert.strictEqual(receipt.costs.lifespanCost, preview.costs.lifespanCost, "commit charges preview lifespan cost");
  assert.strictEqual(Math.round((500 - state.player.lifespan) * 100) / 100, preview.costs.lifespanCost, "lifespan delta equals preview cost");
  assert.strictEqual(E.techniqueCooldownReadyAt(state.player.techniqueCooldowns[technique.id]) - state.meta.turn, preview.cooldownTurns, "commit cooldown equals preview cooldownTurns");
});

check("guild study passes teaching source via options and never leaks flags.guildTeaching", () => {
  const catalog = E.techniqueCatalog();
  const state = newState("Guild QA");
  E.ensureExpansionState(state);
  assert(E.chooseJourneyIntent(state, "tu_lap").success, "fixture leaves the opening choice");
  const addresses = win.GameData.WORLD_MAP?.addresses || {};
  const address = (addresses.organizations || []).find((entry) => entry.kind === "guild" && entry.nodeId && Object.keys(catalog).some((id) => id.startsWith("guild_signature_" + entry.refId + "_")));
  assert(address, "fixture needs a guild address with signature techniques");
  const guildId = address.refId;
  state.guildMembership = { ...(state.guildMembership || {}), guildId, rankIndex: 2, status: "active", suspended: true };
  state.locationId = address.nodeId;
  const studyAction = E.contextState(state).actions.find((entry) => entry.id.startsWith("act_exp_org_study:"));
  assert(studyAction, "rank 2 member sees a study action at the guild");
  const signatureId = studyAction.id.slice("act_exp_org_study:".length);
  const refused = E.submitActionId(state, studyAction.id);
  assert(refused?.success === false && !state.player.techniques?.[signatureId], "suspended member cannot learn the signature technique");
  assert.strictEqual(state.flags.guildTeaching, undefined, "refused study must not leave a teaching flag");
  state.guildMembership.suspended = false;
  const plain = Object.keys(catalog).find((id) => !catalog[id].sourceGuildId && !catalog[id].requiredFaction && !state.player.techniques?.[id] && Number(catalog[id].minRealmLevel || 1) <= E.cultivationTier(state) && X.techniqueEligibility(state, id, "learn").ok);
  assert(plain, "fixture needs a plainly learnable technique");
  assert.strictEqual(E.learnTechnique(state, plain), true);
  assert.strictEqual(state.player.techniques[plain].sourceGuildId, null, "later non-guild learn must not inherit a guild source");
  const studied = E.submitActionId(state, studyAction.id);
  assert(studied?.success && state.player.techniques[signatureId], "active rank 2 member can study the signature technique");
  assert.strictEqual(state.player.techniques[signatureId].sourceGuildId, guildId, "guild study records sourceGuildId");
  assert.strictEqual(state.player.techniques[signatureId].sourceType, "guild");
  assert.strictEqual(state.flags.guildTeaching, undefined, "study never leaves a teaching flag");
  state.flags.guildTeaching = "legacy_guild";
  E.learnTechnique(state, "__missing_technique__");
  assert.strictEqual(state.flags.guildTeaching, undefined, "legacy flag is cleared even when learning fails");
});

check("relationship single write path: plain letter only warms affection, gifts are item-safe", () => {
  const state = newState("Mail QA");
  E.ensureExpansionState(state);
  const npcId = Object.keys(state.worldSimulation.npcState).find((id) => state.worldSimulation.npcState[id].status === "alive");
  assert(npcId, "fixture needs an alive NPC");
  state.worldSimulation.npcState[npcId].currentNodeId = state.locationId;
  E.addItem(state, "linh_thach", 50);
  const before = X.relationshipBreakdown(state, npcId);
  const sent = X.sendMail(state, npcId, "Bình an.");
  assert(sent.success, "plain letter is scheduled: " + sent.reason);
  X.processScheduledWorldTasks(state, sent.task.dueDay);
  const afterLetter = X.relationshipBreakdown(state, npcId);
  assert.strictEqual(afterLetter.affection - before.affection, 1, "letter adds affection +1");
  assert.strictEqual(afterLetter.trust, before.trust, "letter must not raise trust");
  assert.strictEqual(afterLetter.loyalty, before.loyalty, "letter must not raise loyalty");
  assert.strictEqual(state.relationshipEvents[npcId].slice(-1)[0].tag, "mail_letter");
  assert.strictEqual(X.validateRelationshipPolicy(state).ok, true, "score stays on the shared formula");
  const giftId = Object.keys(win.GameData.ITEMS || {}).find((id) => { const item = win.GameData.ITEMS[id]; return item && item.kind !== "quest" && !item.questItem && ["consumable", "material"].includes(String(item.kind || item.type || "")); }) || "linh_thach";
  E.addItem(state, giftId, 1);
  const gift = X.sendMail(state, npcId, "Chút lễ mọn.", giftId);
  assert(gift.success, "gift letter is scheduled: " + gift.reason);
  X.processScheduledWorldTasks(state, gift.task.dueDay);
  const afterGift = X.relationshipBreakdown(state, npcId);
  assert.strictEqual(afterGift.affection - afterLetter.affection, 2, "gift adds affection +2");
  assert.strictEqual(afterGift.trust - afterLetter.trust, 1, "gift adds trust +1");
  assert.strictEqual(afterGift.loyalty, afterLetter.loyalty, "gift does not use sent_gift loyalty default");
  state.generatedItems = state.generatedItems || {};
  state.generatedItems.qa_mail_token = { id: "qa_mail_token", name: "T?n V?t QA", kind: "quest", stats: {} };
  state.generatedItems.qa_mail_blade = { id: "qa_mail_blade", name: "Ki?m Th? QA", kind: "weapon", equipmentType: "artifact", stats: {} };
  state.inventory.qa_mail_token = 1; state.inventory.qa_mail_blade = 1;
  E.equipItem(state, "qa_mail_blade");
  ["qa_mail_token", "qa_mail_blade"].forEach((itemId) => {
    const stoneBefore = Number(state.inventory.linh_thach || 0), countBefore = Number(state.inventory[itemId] || 0);
    const refused = X.sendMail(state, npcId, "Kh?ng ???c g?i.", itemId);
    assert.strictEqual(refused.success, false, itemId + " (quest/equipped) cannot be mailed");
    assert.strictEqual(Number(state.inventory.linh_thach || 0), stoneBefore, "refused mail charges nothing");
    assert.strictEqual(Number(state.inventory[itemId] || 0), countBefore, "refused mail keeps the item");
  });
});

check("read-only map/local views and validators leave the save byte-identical", () => {
  const state = newState("View QA");
  E.ensureExpansionState(state);
  E.contextState(state);
  E.movementCandidates(state, "bac"); // action-path normalizer (ensureOpenWorld), not a view
  state.companion = { entityId: "qa_companion", hp: 12 };
  E.ensureExpansionState(state); // load-time normalization owns companion/map repairs
  const bytes = () => JSON.stringify(state);
  const base = bytes();
  E.localBfsConstellation(state);
  E.materializeLocalConstellation(state);
  ["bac", "dong", "nam", "tay"].forEach((direction) => E.movementCandidatePreview(state, direction));
  assertSameBytes(bytes(), base, "opening the local view must not write state");
  const nodeIds = E.localBfsConstellation(state).nodeIds;
  nodeIds.forEach((nodeId) => { X.mapNode(state, nodeId); X.mapInfluenceSnapshot(state, nodeId); });
  assertSameBytes(bytes(), base, "mapNode / mapInfluenceSnapshot(persist=false) must not write state");
  const snapshot = X.mapInfluenceSnapshot(state, state.locationId);
  try { snapshot.influenceMap.qa_injected = 999; } catch (error) { /* frozen snapshots are acceptable */ }
  assert.strictEqual(X.mapInfluenceSnapshot(state, state.locationId).influenceMap.qa_injected, undefined, "callers cannot corrupt the influence cache");
  X.validateNodeHistory(state);
  X.validateExpansionState(state);
  assertSameBytes(bytes(), base, "validateNodeHistory / validateExpansionState must not write state");
});

results.forEach(([status, name, message]) => console.log(status + " " + name + (message ? " — " + message : "")));
const failed = results.filter(([status]) => status === "FAIL").length;
if (failed) { console.error(failed + " refactor invariant(s) failed"); process.exitCode = 1; }
else console.log("OK: " + results.length + " refactor invariants");
