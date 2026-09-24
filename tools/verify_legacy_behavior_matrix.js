"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const sandbox = { window: {}, console, performance: { now: () => Date.now() }, Date };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine, X = sandbox.window.GameExpansion;
const state = () => E.createState({ character: E.createCharacter({ name: "Legacy Matrix QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
const probe = {
  T1: [X.validateMapCoordinates, "valid"], T2: [X.validateWeatherRuntimeState, "ok"], T3: [X.validateNpcScheduler, "ok"], T4: [X.validateCompanionState, "ok"],
  T5: [X.validateTechniqueRuntimeState, "ok"], T6: [X.validateDiscoveryLifecycle, "ok"], T7: [X.validateCanonicalNamespaces, "ok"], T8: [X.validateReplayEnvelope, "ok"],
  T9: [X.validateExpansionState, "valid"], T10: [X.validateBalanceCatalog, "ok"], T11: [X.validateWorldCatalogs, "ok"], T12: [X.validateProductPolicies, "ok"],
  LT1: [E.validateLogSurfaceState, "ok"], LT2: [E.lintNarrativeText, "ok"], LT3: [E.novelLogParagraphs, "array"], LT4: [X.validateNodeHistory, "ok"], LT5: [X.validateNpcScheduler, "ok"],
  LT6: [X.validateNpcQuestState, "ok"], LT7: [X.validateWorldEventState, "ok"], LT8: [X.validateWarState, "ok"], LT9: [X.validateReplayEnvelope, "ok"], LT10: [X.validateExpansionState, "valid"],
  FT1: [X.validateCompanionState, "ok"], FT2: [X.validatePrisonerState, "ok"], FT3: [X.validateWeatherRuntimeState, "ok"], FT4: [X.validateMapCanonicalState, "ok"], FT5: [X.validateStructureRuntimeState, "ok"],
  FT6: [X.validateTournamentState, "ok"], FT7: [X.validateWarState, "ok"], FT8: [X.validateWorldEventState, "ok"], FT9: [X.validateExpansionState, "valid"], FT10: [X.validateReplayEnvelope, "ok"], FT11: [X.validatePerformanceBudget, "ok"]
};
const results = {};
Object.entries(probe).forEach(([id, [fn, shape]]) => {
  assert.strictEqual(typeof fn, "function", `${id} has no canonical producer/validator`);
  const value = fn === E.lintNarrativeText ? fn("Một câu chuyện hợp lệ.") : fn === E.novelLogParagraphs ? fn(state()) : fn(state());
  if (shape === "array") assert(Array.isArray(value), `${id} did not return an array`);
  else assert(value && value[shape] === true, `${id} failed canonical probe`);
  results[id] = { producer: fn.name || "canonical", status: "verified" };
});
assert.strictEqual(Object.keys(results).length, 33);

// Preserve the original T1-T9/T12 experiments as behavior-first invariants.
const behaviorState = state();
const entityId = Object.keys(E.entityCatalog())[0];
const dto = E.combatEntity(behaviorState, entityId);
assert(dto && !Object.prototype.hasOwnProperty.call(dto, 'hp') && Number.isFinite(Number(dto.hpMax)), 'T1 combat DTO must keep runtime HP separate');
const hpBefore = behaviorState.player.hp;
assert(E.applyPlayerDamage(behaviorState, 7).success && behaviorState.player.hp < hpBefore, 'T3 player damage producer is a no-op');
E.addItem(behaviorState, 'linh_thach', 2);
assert.strictEqual(E.removeItem(behaviorState, 'linh_thach', 5), false, 'T5 over-removal must reject without deleting inventory');
assert.strictEqual(behaviorState.inventory.linh_thach, 2, 'T5 over-removal mutated inventory');
const generated = Array.from({ length: 80 }, () => E.createLootItem(behaviorState, 'artifact')).filter(Boolean);
assert(new Set(generated.map((item) => item.id)).size === generated.length, 'T4 procedural loot IDs are not unique');
assert(E.fateRewardWeights(9)['phan'] === 1 && E.fateRewardWeights(9)['tien'] === 0, 'T9 Fate reward weights are not exported canonically');
const translated = sandbox.window.GameI18n.formatHistory('tuyet am_vu bao_linh_khi mua suong');
assert(!/\b(tuyet|am_vu|bao_linh_khi|mua|suong)\b/i.test(translated), 'T6 weather tokens leaked through history formatter');
const rewardA = X.grantCanonicalReward(behaviorState, 'hidden_realm:A', { merit: 1 }, '1:main');
const rewardB = X.grantCanonicalReward(behaviorState, 'hidden_realm:B', { merit: 1 }, '1:main');
assert(rewardA.success && rewardB.success && Object.keys(behaviorState.rewardLedger).length >= 2, 'T7 reward ledger leaked key across hidden realms');
const rollGrades = Array.from({ length: 40 }, (_, index) => E.rollFateByProgression(behaviorState, { level: 9, source: 't8:' + index })).filter(Boolean).map((fate) => fate.grade);
assert(rollGrades.length && rollGrades.every((grade) => grade !== 'tien'), 'T8 progression roll exceeded canonical unique-Fate cap');
behaviorState.pendingMapEvent = { id: 't12', status: 'pending', nodeId: behaviorState.locationId };
E.confirmPendingDeparture(behaviorState);
assert(!behaviorState.pendingMapEvent || behaviorState.pendingMapEvent.status === 'lost', 'T12 departure did not close pending map event');

// T10 legacy sample fixture: numeric Fate array indexes must migrate to
// canonical string IDs at the createState boundary, never remain dangling.
const legacySamples = JSON.parse(fs.readFileSync(path.join(root, 'sample_characters.json'), 'utf8'));
const canonicalFateIds = new Set((sandbox.window.GameData.FATE_PATTERNS || []).map((entry) => entry.id));
legacySamples.forEach((sample, index) => {
  const migrated = E.createState({ character: sample });
  const ids = migrated.player.fates || [];
  assert.strictEqual(ids.length, 5, `T10 migrated Fate count ${index}`);
  assert(ids.every((id) => typeof id === 'string' && canonicalFateIds.has(id)), `T10 dangling Fate after migration ${index}`);
  assert((migrated.fateInventory || []).every((id) => canonicalFateIds.has(id)), `T10 dangling vault Fate after migration ${index}`);
});

// FT1b/FT2 regression fixtures: expiry and orphan-war cleanup are producer
// behavior, not merely validator return shapes.
const featureState = state();
const featureDay = E.gameDayOrdinal(featureState.gameClock);
featureState.questState.active.qa_npc_expiry = { id: 'qa_npc_expiry', status: 'active', giverNpcId: 'su_phu', expiresDay: featureDay + 1, transferable: false };
X.simulateWorldUntil(featureState, featureDay + 2);
assert(featureState.questState.failed.qa_npc_expiry?.status === 'failed', 'FT1b NPC quest expiry producer did not move active quest to failed');
featureState.worldSimulation.wars.qa_orphan = { id: 'qa_orphan', factionA: 'missing_a', factionB: 'missing_b', status: 'active', startedDay: featureDay, frontNodeIds: [], scoreA: 0, scoreB: 0 };
X.updateFactionInternalEvents(featureState, featureDay + 1);
assert(!featureState.worldSimulation.wars.qa_orphan && featureState.worldSimulation.warLedger.qa_orphan?.outcome === 'orphan_cleanup', 'FT2 orphan war cleanup producer left invalid war active');
console.log("OK: legacy behavior matrix (T1-T12, LT1-LT10, FT1-FT11 mapped and probed)");
