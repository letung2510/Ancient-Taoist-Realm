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
  [1, "03-world/MAP_INFLUENCE_STRUCTURE_CANONICAL_2026-09-16.md", "js/expansion.js", ["mapInfluenceSnapshot", "mapFogState"], "tools/verify_review_batches.js"],
  [2, "03-world/STRUCTURE_RUNTIME_STATE_VALIDATOR_2026-09-17.md", "js/expansion.js", ["buildMapStructure", "validateStructureRuntimeState"], "tools/verify_review_batches.js"],
  [3, "01-core/PROFESSION_NAMESPACE_AND_SAVE_NORMALIZATION_2026-09-16.md", "js/engine.js", ["canonicalHiddenProfessionId"], "tools/verify_review_batches.js"],
  [4, "07-ui/LOG_SURFACE_RUNTIME_VALIDATOR_2026-09-17.md", "js/engine.js", ["formatPlayerLogText", "validateLogSurfaceState"], "tools/verify_log_producers.js"],
  [5, "01-core/fate/FATE_ADVANCED_ACTION_NAMESPACE_AND_EFFECT_LEDGER_2026-09-17.md", "js/engine.js", ["fateAdvancedActionCatalog"], "tools/verify_review_batches.js"],
  [6, "01-core/fate/FATE_RELATIONSHIP_COMPLETE.md", "js/engine.js", ["decayPolicy"], "tools/verify_review_batches.js"],
  [7, "01-core/fate/FATE_EFFECT_COMPOSITION_VALIDATOR_2026-09-17.md", "js/engine.js", ["fateEffectBreakdown"], "tools/verify_review_batches.js"],
  [8, "07-ui/FATE_INSTANCE_CARD_UI_CONTRACT_2026-09-17.md", "js/ui.js", ["fateInstances"], "tools/verify_ui_surface_contract.js"],
  [9, "03-world/MAP_COMPLETION_LAYERED_NODE_HISTORY_CONTRACT_2026-09-17.md", "js/expansion.js", ["appendNodeHistory", "mapCompletionDetailed"], "tools/verify_review_batches.js"],
  [10, "03-world/TRAVEL_WEIGHT_RESOLVER_CANONICAL_2026-09-17.md", "js/expansion.js", ["travelPlan", "canonicalTravelPlan"], "tools/verify_review_batches.js"],
  [11, "03-world/WEATHER_RUNTIME_STATE_VALIDATOR_2026-09-17.md", "js/expansion.js", ["weatherSnapshot", "validateWeatherRuntimeState"], "tools/verify_review_batches.js"],
  [12, "05-operations/WAR_CASCADE_STATE_VALIDATOR_2026-09-17.md", "js/expansion.js", ["validateWarState"], "tools/verify_review_batches.js"],
  [13, "05-operations/NPC_SCHEDULER_STATE_MACHINE_VALIDATOR_2026-09-17.md", "js/expansion.js", ["validateNpcScheduler"], "tools/verify_review_batches.js"],
  [14, "04-interaction/WAR_FRONT_RUMOR_BULLETIN_VIEWMODEL_2026-09-17.md", "js/expansion.js", ["rumorBulletinSnapshot", "factionBulletin"], "tools/verify_review_batches.js"],
  [15, "04-interaction/RELATIONSHIP_RUNTIME_LEDGER_VALIDATOR_2026-09-17.md", "js/expansion.js", ["relationshipBreakdown", "validateRelationshipRuntimeState"], "tools/verify_review_batches.js"],
  [16, "SYSTEM_LOGIC_CATALOG_2026-09-16/06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md", "js/expansion.js", ["recipeCatalog"], "tools/verify_dichi_deep.js"],
  [17, "06-expansion/DISCOVERY_LIFECYCLE_NAMESPACE_VALIDATOR_2026-09-17.md", "js/expansion.js", ["validateDiscoveryLifecycle"], "tools/verify_review_batches.js"],
  [18, "05-operations/CONTESTED_OPPORTUNITY_ROLLBACK_REWARD_LEDGER_2026-09-17.md", "js/expansion.js", ["hiddenRealmEnter", "validateHiddenRealmRuntimeState"], "tools/verify_review_batches.js"],
  [19, "07-ui/ACTION_PRIORITY_REPLAY_CANONICAL_2026-09-16.md", "js/engine.js", ["validateActionPriorityMatrix", "resolveActionPriority"], "tools/verify_ui_surface_contract.js"],
  [20, "01-core/SAVE_MIGRATION_MULTI_VERSION_FIXTURES_2026-09-17.md", "js/engine.js", ["legacy_", "statDisplay"], "tools/verify_review_batches.js"],
  [21, "08_DATA_REPLAY_ENVELOPE_VALIDATOR_2026-09-17.md", "js/engine.js", ["replayRandom"], "tools/verify_random_boundaries.js"],
  [22, "08_DATA_CACHE_INVALIDATION_RUNTIME_2026-09-17.md", "js/expansion.js", ["validateCacheInvalidationState"], "tools/profile_runtime_budget.js"],
  [23, "02-progression/DITHE_RUNTIME_STATE_VALIDATOR_2026-09-17.md", "js/expansion.js", ["validateSpecialPhysiqueCatalog", "specialPhysiqueOutcome"], "tools/verify_dichi_deep.js"],
  [24, "03-world/STRUCTURE_CATALOG_BALANCE_SCHEMA_2026-09-17.md", "js/expansion.js", ["repairMapStructure", "upgradeMapStructure"], "tools/verify_review_batches.js"],
  [25, "03-world/STRUCTURE_SAN_PROTECTION_AND_HISTORY_CANONICAL_2026-09-17.md", "js/expansion.js", ["wardProtectionAtNode"], "tools/verify_review_batches.js"],
  [26, "06-expansion/REWARD_PRODUCER_CANONICAL_AUDIT_2026-09-17.md", "js/expansion.js", ["grantCanonicalReward", "rewardLedger"], "tools/verify_review_batches.js"],
  [27, "07-ui/ARCHIVE_RETENTION_AND_QUOTA_CONTRACT_2026-09-17.md", "js/main.js", ["createLogArchive"], "tools/verify_indexeddb_archive.js"],
  [28, "08_DATA_RUNTIME_PERFORMANCE_BUDGET_VALIDATOR_2026-09-17.md", "js/expansion.js", ["validatePerformanceBudget"], "tools/profile_runtime_budget.js"],
  [29, "01-core/fate/FATE_RELATIONSHIP_COMPLETE.md", "js/engine.js", ["decayPolicy"], "tools/verify_review_batches.js"],
  [30, "02-progression/PATH_FUSION_TRANSITION_CANONICAL_2026-09-16.md", "js/expansion.js", ["transitionSecondaryPath"], "tools/verify_review_batches.js"],
  [31, "02-progression/DITHE_CATALOG_EFFECT_EXCLUSION_SCHEMA_2026-09-17.md", "js/expansion.js", ["specialPhysiqueOutcome", "exclusions"], "tools/verify_dichi_deep.js"],
  [32, "07-ui/WORLD_STRUCTURE_OWNERSHIP_UI_2026-09-17.md", "js/expansion.js", ["structureManagerDecision", "transferMapStructure"], "tools/verify_ui_surface_contract.js"],
  [33, "04-interaction/ACTOR_HISTORY_OFFLINE_PROJECTION_2026-09-17.md", "js/expansion.js", ["actorHistorySnapshot", "offlinePolicy"], "tools/verify_expansion_stress.js"]
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
