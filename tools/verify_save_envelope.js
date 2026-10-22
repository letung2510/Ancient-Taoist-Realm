"use strict";

// Canonical save-import boundary: file/localStorage callers share one
// read-only envelope validator after deserialize/migration.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadRuntime } = require("./lib/load_runtime");
const root = path.join(__dirname, "..");
const { sandbox } = loadRuntime({ sandboxStyle: "window", globals: { console, performance: { now: () => Date.now() }, Date } });
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
