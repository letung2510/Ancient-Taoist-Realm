/* Behavior-first offline cadence and producer parity fixtures. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const root = __dirname + '/..';
const context = { console, Math, Date, JSON, structuredClone: global.structuredClone };
context.window = context;
vm.createContext(context);
for (const file of ['data/data.js', 'data/fate_data.js', 'data/expansion_data.js', 'data/fate_relationships.js', 'js/i18n.js', 'js/engine.js', 'js/expansion.js']) {
  vm.runInContext(fs.readFileSync(root + '/' + file, 'utf8'), context, { filename: file });
}
const E = context.GameEngine;
assert(E && typeof E.simulateWorldUntil === 'function', 'offline canonical API missing');
function make(seed) {
  const state = E.createState(seed);
  state.gameClock.currentDay = 1;
  state.worldSimulation.lastProcessedDay = E.gameDayOrdinal(state) - 1;
  return state;
}
function snapshot(state) {
  const sim = state.worldSimulation;
  return JSON.stringify({
    weather: sim.regionState,
    events: sim.events,
    wars: sim.wars,
    diplomacy: sim.diplomacy,
    factionState: sim.factionState,
    npcState: sim.npcState,
    tasks: sim.scheduledTasks,
    contracts: state.contractBoard,
    companion: state.companion
  });
}
for (const days of [30, 180, 365]) {
  const offline = make('offline-parity-' + days);
  const replay = make('offline-parity-' + days);
  offline.worldSimulation.seed = replay.worldSimulation.seed = 'fixed-offline-parity-seed';
  const target = E.gameDayOrdinal(offline) + days - 1;
  const result = E.simulateWorldUntil(offline, target, { offline: true });
  E.simulateWorldUntil(replay, target, { offline: true });
  assert.strictEqual(result.processed, days, 'processed day count mismatch at ' + days);
  assert.strictEqual(result.mode, days > 30 ? 'aggregate_then_actor_window' : 'actor_window', 'unexpected cadence at ' + days);
  assert.strictEqual(snapshot(offline), snapshot(replay), 'offline producer replay mismatch at ' + days + ' days');
  const frozen = snapshot(offline);
  assert.strictEqual(E.simulateWorldUntil(offline, target, { offline: true }).mode, 'idempotent');
  assert.strictEqual(snapshot(offline), frozen, 'offline replay is not idempotent at ' + days + ' days');
}
const archive = make('offline-archive-checkpoint');
const long = E.simulateWorldUntil(archive, E.gameDayOrdinal(archive) + 10000 - 1, { offline: true });
assert.strictEqual(long.processed, 10000);
assert.strictEqual(long.aggregateCadence.cadence, 'checkpoint_projection');
assert.strictEqual(long.aggregateCadence.parity, false);
assert.strictEqual(long.aggregateCadence.parityWindowDays, 365);
assert.strictEqual(E.simulateWorldUntil(archive, E.gameDayOrdinal(archive) + 10000 - 1, { offline: true }).mode, 'idempotent');
const exact = make('offline-exact-parity');
const exactReplay = make('offline-exact-parity');
const online = make('offline-exact-parity');
exact.worldSimulation.seed = exactReplay.worldSimulation.seed = 'fixed-offline-exact-seed';
online.worldSimulation.seed = 'fixed-offline-exact-seed';
const exactTarget = E.gameDayOrdinal(exact) + 1000 - 1;
const exactResult = E.simulateWorldUntil(exact, exactTarget, { offline: true, exactParity: true });
E.simulateWorldUntil(exactReplay, exactTarget, { offline: true, exactParity: true });
assert.strictEqual(exactResult.aggregateCadence.cadence, 'canonical_daily_tick');
assert.strictEqual(exactResult.aggregateCadence.parity, true);
assert.strictEqual(snapshot(exact), snapshot(exactReplay), 'exact long-range replay mismatch');
E.simulateWorldUntil(online, exactTarget, { offline: false, exactParity: true });
const exactOnlineA = JSON.parse(snapshot(exact));
const exactOnlineB = JSON.parse(snapshot(online));
const exactOnlineDiffs = Object.keys(exactOnlineA).filter((key) => JSON.stringify(exactOnlineA[key]) !== JSON.stringify(exactOnlineB[key]));
assert.deepStrictEqual(exactOnlineDiffs, [], 'exact offline/online producer parity mismatch: ' + exactOnlineDiffs.join(','));
console.log('OK: offline producer parity (30/180/365-day canonical replay + explicit long-range checkpoint contract)');
