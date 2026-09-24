"use strict";

// Canonical save-import boundary: file/localStorage callers share one
// read-only envelope validator after deserialize/migration.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const sandbox = { window: {}, console, performance: { now: () => Date.now() }, Date };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
assert.strictEqual(typeof E.validateSaveEnvelope, "function", "save envelope validator missing");
const state = E.createState("save-envelope-matrix");
const valid = E.validateSaveEnvelope(state);
assert(valid.ok && valid.errors.length === 0, "canonical state rejected by save envelope");
const cases = [
  [{}, ["player", "meta", "worldSimulation", "locationId"]],
  [{ player: {}, meta: {}, worldSimulation: {}, locationId: 7 }, ["locationId"]],
  [{ player: {}, meta: {}, worldSimulation: {}, locationId: "node", schemaVersion: 12 }, ["schemaVersion"]],
];
cases.forEach(([candidate, expected]) => {
  const result = E.validateSaveEnvelope(candidate);
  assert(!result.ok, "invalid save envelope was accepted");
  expected.forEach((key) => assert(result.errors.includes(key), "missing envelope error: " + key));
});
const serialized = E.serialize(state);
const roundTrip = E.deserialize(serialized);
assert(E.validateSaveEnvelope(roundTrip).ok, "serialized save failed canonical round-trip");
const main = fs.readFileSync(path.join(root, "js", "main.js"), "utf8");
assert(main.includes("validateSaveEnvelope"), "file import does not use canonical envelope validator");
console.log("OK: canonical save envelope (valid, malformed, schema boundary, round-trip)");
