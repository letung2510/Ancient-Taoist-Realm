"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), sandbox, { filename: file });
});

const E = sandbox.window.GameExpansion;
const weather = E.weatherCatalog();
const structures = E.structureCatalog();
const physiques = E.specialPhysiqueCatalog();
const recipes = E.recipeCatalog();

assert(E.validateBalanceCatalog().ok, "runtime balance boundary must pass");
assert(Object.keys(weather).length >= 8, "weather catalog must retain all canonical states");
Object.entries(weather).forEach(([id, item]) => {
  assert(Number(item.severity) >= 0 && Number(item.severity) <= 5, `weather severity ${id}`);
  assert(Number(item.defaultDuration) >= 1 && Number(item.defaultDuration) <= 7, `weather duration ${id}`);
  assert(Number(item.effects.travelRiskDelta) >= 0 && Number(item.effects.travelRiskDelta) <= 0.25, `weather risk ${id}`);
  assert(Number.isInteger(Number(item.effects.fogLevel)), `weather fog ${id}`);
});
const severe = Object.values(weather).filter((item) => Number(item.severity) >= 4);
assert(severe.every((item) => Number(item.effects.travelRiskDelta) >= 0.08), "severe weather must carry meaningful travel risk");

Object.entries(recipes).forEach(([id, recipe]) => {
  assert(recipe.id === id && recipe.professionId && recipe.output, `recipe identity ${id}`);
  Object.values(recipe.materials || {}).forEach((value) => assert(Number(value) >= 1 && Number(value) <= 8, `recipe material ${id}`));
  Object.values(recipe.costs || {}).forEach((value) => assert(Number(value) >= 0 && Number(value) <= 10, `recipe resource cost ${id}`));
  if (recipe.successBase !== undefined) assert(Number(recipe.successBase) >= 0.4 && Number(recipe.successBase) <= 0.8, `recipe success ${id}`);
});

Object.entries(structures).forEach(([id, item]) => {
  assert(item.id === id && Number(item.buildCost) >= 10 && Number(item.buildCost) <= 25, `structure build cost ${id}`);
  assert(Number(item.maxLevel) === 3 && Number(item.upgradeBase) >= 10 && Number(item.upgradeBase) <= Number(item.buildCost) * 2, `structure upgrade ${id}`);
  assert(Number(item.refundRate) >= 0.25 && Number(item.refundRate) <= 0.5, `structure refund ${id}`);
});

Object.entries(physiques).forEach(([id, item]) => {
  assert(Number(item.maxStage) === (item.stageEffects || []).length, `Dị Thể stage count ${id}`);
  assert(Number(item.progressThreshold) >= 1 && Number(item.progressThreshold) <= 10, `Dị Thể threshold ${id}`);
  (item.stageEffects || []).forEach((effect) => Object.entries(effect).forEach(([key, value]) => {
    if (key === "sanRecoveryFlat") assert(Number(value) >= 0 && Number(value) <= 2, `Dị Thể san recovery ${id}`);
    else if (["corruptionResist", "poisonResist", "fateResonance", "stealth", "elementPenalty"].includes(key)) assert(Number(value) >= 0 && Number(value) <= 1, `Dị Thể effect ${id}`);
    else if (key === "reviveOnce") assert(typeof value === "boolean", `Dị Thể revive flag ${id}`);
  }));
});

const pathAudit = E.validatePathFusionCatalog();
assert(pathAudit.ok && pathAudit.pairCount >= 2, "path fusion catalog must be complete");
const rewardAudit = E.validateRewardPolicy();
assert(rewardAudit.ok && rewardAudit.policy.duplicate === "reject" && rewardAudit.policy.pendingRewardReplay === "idempotent", "reward policy must be canonical");

console.log(`OK: canonical catalog balance (${Object.keys(weather).length} weather, ${Object.keys(recipes).length} recipes, ${Object.keys(structures).length} structures, ${Object.keys(physiques).length} Dị Thể)`);
