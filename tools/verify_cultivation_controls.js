"use strict";

const assert = require("assert");
const { loadRuntime } = require("./lib/load_runtime");

const { sandbox } = loadRuntime({ sandboxStyle: "window" });

const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const state = E.createState(E.createCharacter({ seed: "cultivation-controls" }));
state.flags.journeyIntentPending = false;
state.flags.originChoicePending = false;
state.flags.pathChoicePending = false;
state.player.tainted.attentionPending = false;
state.player.tainted.factionPending = false;
state._fateState = "NORMAL_GROWTH";

state.player.cultivation.pendingDeviation = { source: "regression", severity: "high" };
let actions = E.contextState(state).actions.map((action) => action.id);
assert(actions.includes("act_cultivation_deviation_purify"));
assert(actions.includes("act_cultivation_deviation_accept"));
const deviationResult = E.submitActionId(state, "act_cultivation_deviation_accept");
assert.strictEqual(deviationResult.success, true);
assert.strictEqual(deviationResult.resolution, "accept");
assert.strictEqual(state.player.cultivation.pendingDeviation, null);

state.player.secludedSession = { status: "active", totalDays: 3, completedDays: 0, startedDay: 1 };
actions = E.contextState(state).actions.map((action) => action.id);
assert(actions.includes("act_secluded_cancel"));
assert(actions.includes("act_secluded_advance"));
assert.strictEqual(E.submitActionId(state, "act_secluded_cancel").success, true);
assert.strictEqual(state.player.secludedSession.status, "stopped");

state.worldClock.absoluteDay = 1234;
assert.strictEqual(X.absoluteWorldDay(state), 1234);
state.worldClock.absoluteDay = 0;
state.gameClock.worldAbsoluteDay = 1235;
assert.strictEqual(X.absoluteWorldDay(state), 1235);

state.player.fateDefiance = { fate_test: 4 };
state.player.suppressedFates = { fate_test: { untilTurn: 9 } };
state.player.heavenlyOmenCooldownUntil = 12;
state.player.fateInstances = { fate_test: { fateId: "fate_test", acquiredAtTurn: 7, source: "regression" } };
const loaded = E.deserialize(E.serialize(state));
assert.strictEqual(loaded.player.fateDefiance.fate_test, 4);
assert.strictEqual(loaded.player.suppressedFates.fate_test.untilTurn, 9);
assert.strictEqual(loaded.player.heavenlyOmenCooldownUntil, 12);
assert.strictEqual(loaded.player.fateInstances.fate_test.source, "regression");

console.log("OK: cultivation deviation, secluded cancellation, and absoluteWorldDay controls");
