"use strict";

const assert = require("assert");
const { loadBrowserGame } = require("./verify_game");

const runsArg = process.argv.find((arg) => arg.startsWith("--runs="));
const daysArg = process.argv.find((arg) => arg.startsWith("--days="));
// Keep the default smoke run bounded for local/CI verification. Larger stress
// campaigns remain opt-in via --runs and --days.
const RUNS = Math.max(1, Number(runsArg?.split("=")[1] || 1));
const DAYS = Math.max(1, Number(daysArg?.split("=")[1] || 30));

function makeState(E, index, seed) {
  const character = E.createCharacter({ name: "Simulation " + index, archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const state = E.createState({ character });
  state.worldSimulation.seed = seed || "stress:" + index;
  return state;
}

function main() {
  const sandbox = loadBrowserGame(), E = sandbox.window.GameEngine;
  let maxEvents = 0, maxWars = 0, maxTasks = 0, maxOwnershipRatio = 0;
  for (let index = 0; index < RUNS; index += 1) {
    const state = makeState(E, index);
    const target = E.gameDayOrdinal(state.gameClock) + DAYS;
    const result = E.simulateWorldUntil(state, target, { offline: true });
    assert.strictEqual(result.processed, DAYS);
    assert(result.detailed <= 30);
    assert.strictEqual(result.mode, DAYS > 30 ? "aggregate_then_actor_window" : "actor_window");
    assert.strictEqual(state.worldSimulation.lastOfflineAudit.mode, result.mode);
    assert.strictEqual(state.worldSimulation.offlinePolicy.actorStateProjection, "final_state_plus_incidents");
    const actorHistory = E.actorHistorySnapshot(state);
    const actorRecords = Object.values(actorHistory).flat();
    assert(actorRecords.length > 0, "detailed actor window must retain actor history");
    assert(actorRecords.every((entry) => entry.day && entry.nodeId !== undefined && entry.aiState), "actor history record must expose state projection");
    assert(Object.values(actorHistory).every((entries) => entries.length <= 30), "actor history retention exceeded detailed window");
    const stateAudit = E.validateExpansionState(state);
    assert(stateAudit.valid, JSON.stringify(stateAudit.errors));
    const inventoryAfterOffline = JSON.stringify(state.inventory);
    Object.values(state.inventory || {}).forEach((quantity) => assert(Number.isFinite(Number(quantity)) && Number(quantity) >= 0, "offline simulation produced invalid inventory"));
    E.simulateWorldUntil(state, target, { offline: true });
    assert.strictEqual(JSON.stringify(state.inventory), inventoryAfterOffline, "offline simulation is not idempotent at the same target day");
    assert.strictEqual(E.simulateWorldUntil(state, target, { offline: true }).mode, "idempotent");
    maxEvents = Math.max(maxEvents, Object.keys(state.worldSimulation.events).length);
    maxWars = Math.max(maxWars, Object.keys(state.worldSimulation.wars).length);
    maxTasks = Math.max(maxTasks, state.worldSimulation.scheduledTasks.length);
    const ownership = Object.values(state.worldSimulation.factionState).map((faction) => faction.ownedNodeIds.length);
    const totalOwned = ownership.reduce((sum, value) => sum + value, 0);
    maxOwnershipRatio = Math.max(maxOwnershipRatio, totalOwned ? Math.max(...ownership) / totalOwned : 0);
    assert(maxOwnershipRatio < 0.75, "a faction snowballed across the map");
    if (index < 10) {
      const cloneA = makeState(E, "clone-a:" + index, "clone:" + index), cloneB = makeState(E, "clone-b:" + index, "clone:" + index);
      cloneB.player = JSON.parse(JSON.stringify(cloneA.player)); cloneB.meta.saveId = cloneA.meta.saveId;
      E.simulateWorldUntil(cloneA, target, { offline: true }); E.simulateWorldUntil(cloneB, target, { offline: true });
      assert.deepStrictEqual(JSON.parse(JSON.stringify(cloneA.worldSimulation)), JSON.parse(JSON.stringify(cloneB.worldSimulation)));
    }
  }
  console.log(JSON.stringify({ ok: true, runs: RUNS, days: DAYS, maxEvents, maxWars, maxTasks, maxOwnershipRatio }));
}

main();
