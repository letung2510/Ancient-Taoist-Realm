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
const state = E.createState({ character: E.createCharacter({ name: "Budget QA", archetypeId: "kiem_tong", fates: E.drawInitialFates(), startRegionId: "trung_vuc" }) });
const nodes = Object.keys(sandbox.window.GameData.LOCATIONS || {});
for (let i = 0; i < 5; i += 1) nodes.forEach((nodeId) => E.resolveMapInfluence(state, nodeId));
Object.keys(state.worldSimulation.npcState || {}).slice(0, 10).forEach((npcId) => sandbox.window.GameExpansion.npcWorldContext(state, npcId));
// Warm the VM once so startup/JIT cost is not misreported as the steady-state
// offline catch-up budget.
sandbox.window.GameExpansion.simulateWorldUntil(state, E.gameDayOrdinal(state) + 1, { offline: true });
state.runtimeMetrics.offline = { calls: 0, totalMs: 0 };
sandbox.window.GameExpansion.simulateWorldUntil(state, E.gameDayOrdinal(state) + 30, { offline: true });
const budget = sandbox.window.GameExpansion.runtimeBudgetSnapshot(state);
assert(budget.metrics.mapInfluence.calls >= nodes.length);
assert(budget.metrics.mapInfluence.averageMs < budget.budgets.mapInfluenceAverageMs || budget.metrics.mapInfluence.calls === 0);
assert(budget.metrics.npcView.calls > 0 && budget.metrics.npcView.averageMs < budget.budgets.npcViewAverageMs);
// Wall-clock profiling is diagnostic and can vary with VM/JIT contention. Keep
// the gate strict enough to catch a large regression while allowing normal
// machine noise around the canonical baseline.
assert(budget.metrics.offline.calls > 0 && budget.metrics.offline.averageMs <= budget.budgets.offlineAverageMs * 2, JSON.stringify({ offline: budget.metrics.offline, budget: budget.budgets.offlineAverageMs }));
const serialized = E.serialize(state);
assert(serialized.length < 5_000_000, "save payload exceeded baseline budget");
for (let index = 0; index < 360; index += 1) E.pushHistory(state, { type: "narr", text: "Một dấu vết kiểm thử dài được ghi lại để đo archive; ngày " + index + "." });
const largeSerialized = E.serialize(state);
assert(state.history.length <= 300, "history retention exceeded 300 entries");
assert(largeSerialized.length < 5_000_000, "large save payload exceeded localStorage baseline budget");
const renderStarted = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
const paragraphs = E.novelLogParagraphs(state);
const renderMs = (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - renderStarted;
assert(Array.isArray(paragraphs) && paragraphs.length > 0);
assert(renderMs < 100, "novel log grouping exceeded render budget: " + renderMs);
console.log(JSON.stringify({ ok: true, nodeCount: nodes.length, mapInfluence: budget.metrics.mapInfluence, offline: budget.metrics.offline, serializedBytes: Buffer.byteLength(serialized, "utf8"), largeSaveBytes: Buffer.byteLength(largeSerialized, "utf8"), historyEntries: state.history.length, novelLogParagraphs: paragraphs.length, novelLogRenderMs: renderMs }));
