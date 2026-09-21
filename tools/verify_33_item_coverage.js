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
  [1, "SYSTEM_LOGIC_CATALOG/features/04-world/MAP_CANONICAL.md", "js/expansion.js", ["mapInfluenceSnapshot", "mapFogState"], "tools/verify_review_batches.js"],
  [2, "SYSTEM_LOGIC_CATALOG/features/04-world/WORLD_SIMULATION_CANONICAL.md", "js/expansion.js", ["buildMapStructure", "validateStructureRuntimeState"], "tools/verify_review_batches.js"],
  [3, "SYSTEM_LOGIC_CATALOG/features/03-progression/PROFESSION_CANONICAL.md", "js/engine.js", ["canonicalHiddenProfessionId"], "tools/verify_review_batches.js"],
  [4, "SYSTEM_LOGIC_CATALOG/features/07-ui/UI_ACTION_LOG_CANONICAL.md", "js/engine.js", ["formatPlayerLogText", "validateLogSurfaceState"], "tools/verify_log_producers.js"],
  [5, "SYSTEM_LOGIC_CATALOG/features/01-fate/FATE_CANONICAL.md", "js/engine.js", ["fateAdvancedActionCatalog"], "tools/verify_review_batches.js"],
  [6, "SYSTEM_LOGIC_CATALOG/features/01-fate/FATE_CANONICAL.md", "js/engine.js", ["decayPolicy"], "tools/verify_review_batches.js"],
  [7, "SYSTEM_LOGIC_CATALOG/features/01-fate/FATE_CANONICAL.md", "js/engine.js", ["fateEffectBreakdown"], "tools/verify_review_batches.js"],
  [8, "SYSTEM_LOGIC_CATALOG/features/01-fate/FATE_CANONICAL.md", "js/ui.js", ["fateInstances"], "tools/verify_ui_surface_contract.js"],
  [9, "SYSTEM_LOGIC_CATALOG/features/04-world/MAP_CANONICAL.md", "js/expansion.js", ["appendNodeHistory", "mapCompletionDetailed"], "tools/verify_review_batches.js"],
  [10, "SYSTEM_LOGIC_CATALOG/features/04-world/MAP_CANONICAL.md", "js/expansion.js", ["travelPlan", "canonicalTravelPlan"], "tools/verify_review_batches.js"],
  [11, "SYSTEM_LOGIC_CATALOG/features/04-world/WEATHER_CANONICAL.md", "js/expansion.js", ["weatherSnapshot", "validateWeatherRuntimeState"], "tools/verify_review_batches.js"],
  [12, "SYSTEM_LOGIC_CATALOG/features/04-world/WORLD_SIMULATION_CANONICAL.md", "js/expansion.js", ["validateWarState"], "tools/verify_review_batches.js"],
  [13, "SYSTEM_LOGIC_CATALOG/features/05-interaction/NPC_CANONICAL.md", "js/expansion.js", ["validateNpcScheduler"], "tools/verify_review_batches.js"],
  [14, "SYSTEM_LOGIC_CATALOG/features/04-world/WORLD_SIMULATION_CANONICAL.md", "js/expansion.js", ["rumorBulletinSnapshot", "factionBulletin"], "tools/verify_review_batches.js"],
  [15, "SYSTEM_LOGIC_CATALOG/features/05-interaction/RELATIONSHIP_CANONICAL.md", "js/expansion.js", ["relationshipBreakdown", "validateRelationshipRuntimeState"], "tools/verify_review_batches.js"],
  [16, "SYSTEM_LOGIC_CATALOG/features/06-content/TECHNIQUE_CANONICAL.md", "js/expansion.js", ["recipeCatalog"], "tools/verify_dichi_deep.js"],
  [17, "SYSTEM_LOGIC_CATALOG/features/06-content/DISCOVERY_CANONICAL.md", "js/expansion.js", ["validateDiscoveryLifecycle"], "tools/verify_review_batches.js"],
  [18, "SYSTEM_LOGIC_CATALOG/features/06-content/DISCOVERY_CANONICAL.md", "js/expansion.js", ["hiddenRealmEnter", "validateHiddenRealmRuntimeState"], "tools/verify_review_batches.js"],
  [19, "SYSTEM_LOGIC_CATALOG/features/07-ui/UI_ACTION_LOG_CANONICAL.md", "js/engine.js", ["validateActionPriorityMatrix", "resolveActionPriority"], "tools/verify_ui_surface_contract.js"],
  [20, "SYSTEM_LOGIC_CATALOG/features/08-platform/DATA_RUNTIME_CANONICAL.md", "js/engine.js", ["legacy_", "statDisplay"], "tools/verify_review_batches.js"],
  [21, "SYSTEM_LOGIC_CATALOG/features/08-platform/DATA_RUNTIME_CANONICAL.md", "js/engine.js", ["replayRandom"], "tools/verify_random_boundaries.js"],
  [22, "SYSTEM_LOGIC_CATALOG/features/08-platform/DATA_RUNTIME_CANONICAL.md", "js/expansion.js", ["validateCacheInvalidationState"], "tools/profile_runtime_budget.js"],
  [23, "SYSTEM_LOGIC_CATALOG/features/03-progression/DI_THE_CANONICAL.md", "js/expansion.js", ["validateSpecialPhysiqueCatalog", "specialPhysiqueOutcome"], "tools/verify_dichi_deep.js"],
  [24, "SYSTEM_LOGIC_CATALOG/features/04-world/WORLD_SIMULATION_CANONICAL.md", "js/expansion.js", ["repairMapStructure", "upgradeMapStructure"], "tools/verify_review_batches.js"],
  [25, "SYSTEM_LOGIC_CATALOG/features/04-world/WORLD_SIMULATION_CANONICAL.md", "js/expansion.js", ["wardProtectionAtNode"], "tools/verify_review_batches.js"],
  [26, "SYSTEM_LOGIC_CATALOG/features/06-content/REWARD_CANONICAL.md", "js/expansion.js", ["grantCanonicalReward", "rewardLedger"], "tools/verify_review_batches.js"],
  [27, "SYSTEM_LOGIC_CATALOG/features/07-ui/UI_ACTION_LOG_CANONICAL.md", "js/main.js", ["createLogArchive"], "tools/verify_indexeddb_archive.js"],
  [28, "SYSTEM_LOGIC_CATALOG/features/08-platform/DATA_RUNTIME_CANONICAL.md", "js/expansion.js", ["validatePerformanceBudget"], "tools/profile_runtime_budget.js"],
  [29, "SYSTEM_LOGIC_CATALOG/features/01-fate/FATE_CANONICAL.md", "js/engine.js", ["decayPolicy"], "tools/verify_review_batches.js"],
  [30, "SYSTEM_LOGIC_CATALOG/features/03-progression/CON_DUONG_CANONICAL.md", "js/expansion.js", ["transitionSecondaryPath"], "tools/verify_review_batches.js"],
  [31, "SYSTEM_LOGIC_CATALOG/features/03-progression/DI_THE_CANONICAL.md", "js/expansion.js", ["specialPhysiqueOutcome", "exclusions"], "tools/verify_dichi_deep.js"],
  [32, "SYSTEM_LOGIC_CATALOG/features/07-ui/UI_ACTION_LOG_CANONICAL.md", "js/expansion.js", ["structureManagerDecision", "transferMapStructure"], "tools/verify_ui_surface_contract.js"],
  [33, "SYSTEM_LOGIC_CATALOG/features/05-interaction/NPC_CANONICAL.md", "js/expansion.js", ["actorHistorySnapshot", "offlinePolicy"], "tools/verify_expansion_stress.js"]
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
