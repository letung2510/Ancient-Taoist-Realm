"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const exists = (file) => fs.existsSync(path.join(ROOT, file));

// This is an evidence index, not a claim that browser visual QA or product
// balancing is complete. Every item must have a canonical requirement, a
// runtime/schema anchor and at least one executable regression anchor.
const ITEMS = [
  [1, "features/map/README.md", "js/expansion.js", ["mapInfluenceSnapshot", "mapFogState"], "tools/verify_review_batches.js"],
  [2, "features/world-simulation/README.md", "js/expansion.js", ["buildMapStructure", "validateStructureRuntimeState"], "tools/verify_review_batches.js"],
  [3, "features/profession/README.md", "js/engine.js", ["canonicalHiddenProfessionId"], "tools/verify_review_batches.js"],
  [4, "features/ui-action-log/README.md", "js/engine.js", ["formatPlayerLogText", "validateLogSurfaceState"], "tools/verify_log_producers.js"],
  [5, "features/fate/README.md", "js/engine.js", ["fateAdvancedActionCatalog"], "tools/verify_review_batches.js"],
  [6, "features/fate/README.md", "js/engine.js", ["decayPolicy"], "tools/verify_review_batches.js"],
  [7, "features/fate/README.md", "js/engine.js", ["fateEffectBreakdown"], "tools/verify_review_batches.js"],
  [8, "features/fate/README.md", "js/ui.js", ["fateInstances"], "tools/verify_ui_surface_contract.js"],
  [9, "features/map/README.md", "js/expansion.js", ["appendNodeHistory", "mapCompletionDetailed"], "tools/verify_review_batches.js"],
  [10, "features/map/README.md", "js/expansion.js", ["travelPlan", "canonicalTravelPlan"], "tools/verify_review_batches.js"],
  [11, "features/weather/README.md", "js/expansion.js", ["weatherSnapshot", "validateWeatherRuntimeState"], "tools/verify_review_batches.js"],
  [12, "features/world-simulation/README.md", "js/expansion.js", ["validateWarState"], "tools/verify_review_batches.js"],
  [13, "features/npc/README.md", "js/expansion.js", ["validateNpcScheduler"], "tools/verify_review_batches.js"],
  [14, "features/world-simulation/README.md", "js/expansion.js", ["rumorBulletinSnapshot", "factionBulletin"], "tools/verify_review_batches.js"],
  [15, "features/relationship/README.md", "js/expansion.js", ["relationshipBreakdown", "validateRelationshipRuntimeState"], "tools/verify_review_batches.js"],
  [16, "features/technique/README.md", "js/expansion.js", ["recipeCatalog"], "tools/verify_dichi_deep.js"],
  [17, "features/discovery/README.md", "js/expansion.js", ["validateDiscoveryLifecycle"], "tools/verify_review_batches.js"],
  [18, "features/discovery/README.md", "js/expansion.js", ["hiddenRealmEnter", "validateHiddenRealmRuntimeState"], "tools/verify_review_batches.js"],
  [19, "features/ui-action-log/README.md", "js/engine.js", ["validateActionPriorityMatrix", "resolveActionPriority"], "tools/verify_ui_surface_contract.js"],
  [20, "features/data-runtime/README.md", "js/engine.js", ["legacy_", "statDisplay"], "tools/verify_review_batches.js"],
  [21, "features/data-runtime/README.md", "js/engine.js", ["replayRandom"], "tools/verify_random_boundaries.js"],
  [22, "features/data-runtime/README.md", "js/expansion.js", ["validateCacheInvalidationState"], "tools/profile_runtime_budget.js"],
  [23, "features/di-the/README.md", "js/expansion.js", ["validateSpecialPhysiqueCatalog", "specialPhysiqueOutcome"], "tools/verify_dichi_deep.js"],
  [24, "features/world-simulation/README.md", "js/expansion.js", ["repairMapStructure", "upgradeMapStructure"], "tools/verify_review_batches.js"],
  [25, "features/world-simulation/README.md", "js/expansion.js", ["wardProtectionAtNode"], "tools/verify_review_batches.js"],
  [26, "features/reward/README.md", "js/expansion.js", ["grantCanonicalReward", "rewardLedger"], "tools/verify_review_batches.js"],
  [27, "features/ui-action-log/README.md", "js/main.js", ["createLogArchive"], "tools/verify_indexeddb_archive.js"],
  [28, "features/data-runtime/README.md", "js/expansion.js", ["validatePerformanceBudget"], "tools/profile_runtime_budget.js"],
  [29, "features/fate/README.md", "js/engine.js", ["decayPolicy"], "tools/verify_review_batches.js"],
  [30, "features/path/README.md", "js/expansion.js", ["transitionSecondaryPath"], "tools/verify_review_batches.js"],
  [31, "features/di-the/README.md", "js/expansion.js", ["specialPhysiqueOutcome", "exclusions"], "tools/verify_dichi_deep.js"],
  [32, "features/ui-action-log/README.md", "js/expansion.js", ["structureManagerDecision", "transferMapStructure"], "tools/verify_ui_surface_contract.js"],
  [33, "features/npc/README.md", "js/expansion.js", ["actorHistorySnapshot", "offlinePolicy"], "tools/verify_expansion_stress.js"]
];

assert.strictEqual(ITEMS.length, 33, "coverage manifest must contain exactly 33 items");
const failures = [];
ITEMS.forEach(([id, requirement, source, symbols, regression]) => {
  const requirementFile = path.join("requirement", requirement);
  if (!exists(requirementFile)) failures.push(`${id}:missing requirement ${requirement}`);
  if (!exists(source)) failures.push(`${id}:missing runtime ${source}`);
  if (!exists(regression)) failures.push(`${id}:missing regression ${regression}`);
  if (exists(source)) {
    const content = read(source);
    symbols.filter((symbol) => !content.includes(symbol)).forEach((symbol) => failures.push(`${id}:missing runtime symbol ${symbol}`));
  }
});
assert.deepStrictEqual(failures, [], JSON.stringify(failures, null, 2));
console.log(`OK: 33-item evidence coverage (${ITEMS.length}/33 mapped to requirement/runtime/regression)`);

module.exports = { ITEMS };
