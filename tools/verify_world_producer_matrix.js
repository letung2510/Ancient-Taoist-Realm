/* Producer matrix for N173, M51-M54, N189 and FT7/FT9-FT11. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const root = __dirname + '/..';
const context = { console, Math, Date, structuredClone: global.structuredClone };
context.window = context;
vm.createContext(context);
for (const file of ['data/data.js', 'data/fate_data.js', 'data/expansion_data.js', 'data/fate_relationships.js', 'js/i18n.js', 'js/engine.js', 'js/expansion.js']) {
  vm.runInContext(fs.readFileSync(root + '/' + file, 'utf8'), context, { filename: file });
}
const E = context.GameEngine, X = context.GameExpansion;
const state = E.createState('world-producer-matrix');
X.ensureExpansionState(state);
const locations = E.locationPool(state);
const nodeIds = Object.keys(locations || {});
const nodeA = nodeIds.find((id) => Object.keys(locations[id]?.exits || {}).length > 0);
const nodeB = nodeA && Object.values(locations[nodeA].exits)[0];
assert(nodeA && nodeB, 'adjacent map fixture missing');

// N173: ownership/frontier pairing must be geographic, not all-to-all.
state.worldSimulation.factionState ||= {};
if (Object.keys(state.worldSimulation.factionState).length < 2) {
  state.worldSimulation.factionState.matrix_a = { factionId: 'matrix_a', basePower: 50, power: 50, resources: 100, stability: 70, ownedNodeIds: [] };
  state.worldSimulation.factionState.matrix_b = { factionId: 'matrix_b', basePower: 45, power: 45, resources: 100, stability: 70, ownedNodeIds: [] };
}
const factionIds = Object.keys(state.worldSimulation.factionState).slice(0, 2);
assert(factionIds.length === 2, 'faction fixture missing');
state.worldSimulation.factionState[factionIds[0]].ownedNodeIds = [nodeA];
state.worldSimulation.factionState[factionIds[1]].ownedNodeIds = [nodeB];
const before = JSON.stringify(state.worldSimulation.diplomacy);
const diplomacyTarget = E.gameDayOrdinal(state) + 14;
X.simulateWorldUntil(state, diplomacyTarget, { offline: true });
assert(Object.keys(state.worldSimulation.diplomacy).length >= 1, 'adjacent factions did not produce diplomacy pair');
assert(JSON.stringify(state.worldSimulation.diplomacy) !== before, 'diplomacy tick produced no state change');
Object.values(state.worldSimulation.diplomacy).forEach((entry) => assert(entry.factionA !== entry.factionB, 'self diplomacy pair emitted'));

// FT7: power reacts to resources/stability and orphan war cleanup is canonical.
const faction = state.worldSimulation.factionState[factionIds[0]];
const powerA = X.factionPowerSnapshot(state, factionIds[0]).power;
faction.resources = 0; faction.stability = 0;
const powerB = X.factionPowerSnapshot(state, factionIds[0]).power;
assert(powerA > powerB, 'faction power ignored resource/stability changes');
state.worldSimulation.wars.orphan_fixture = { id: 'orphan_fixture', factionA: 'missing_a', factionB: factionIds[0], scoreA: 0, scoreB: 0, status: 'active' };
X.simulateWorldUntil(state, diplomacyTarget + 3, { offline: true });
assert(!state.worldSimulation.wars.orphan_fixture, 'orphan war was not cascaded/removed');
assert(X.validateWarState(state).ok, 'war validator failed after orphan cleanup');
const auction = X.refreshAuction(state, E.gameDayOrdinal(state));
Object.values(auction.lots).forEach((lot) => {
  const item = context.GameData.ITEMS[lot.itemId];
  assert(item && !['quest', 'key', 'currency'].includes(item.kind) && lot.itemId !== 'linh_thach', 'auction exposed a protected item');
  assert(Array.isArray(lot.npcBidProfileIds) && lot.npcBidProfileIds.length > 0, 'auction bid profile missing');
});
assert(X.validateAuctionState(state).ok, 'auction producer matrix invalid');

// M51-M54: footprint retention and settlement capacity are distinct producer contracts.
const footprint = X.recordNpcFootprint(state, { npcId: 'matrix_npc' }, nodeA, nodeB, 100);
assert(footprint.clueClass && footprint.sourceNodeId === nodeA);
X.pruneNpcFootprints(state, 104);
assert(!(state.worldSimulation.npcFootprints[nodeA] || []).some((entry) => entry.id === footprint.id), 'footprint exceeded three-day retention');
state.worldSimulation.settlements = { occupied: { id: 'occupied', nodeId: nodeA, status: 'active' } };
const itinerant = Object.values(state.worldSimulation.npcState).find((npc) => npc.scheduleType === 'itinerant');
if (itinerant) {
  itinerant.currentNodeId = nodeA;
  itinerant.nodeVisitDays = { [nodeA]: Array.from({ length: 12 }, (_, index) => 70 + index) };
  X.resolveNpcSettlements(state, 120);
  assert(Object.values(state.worldSimulation.settlements).filter((entry) => entry.nodeId === nodeA && entry.status !== 'closed').length <= 1, 'settlement capacity exceeded');
}
const settlementView = X.settlementSnapshot(state, nodeA);
assert(settlementView.source === 'canonical_settlement_snapshot' && settlementView.nodeId === nodeA, 'settlement snapshot producer missing');
assert(settlementView.occupied <= settlementView.capacity && settlementView.available === settlementView.capacity - settlementView.occupied, 'settlement snapshot capacity disclosure drifted');

// N189: each weather has an explicit hysteresis threshold exposed by the catalog.
const weatherCatalog = X.weatherCatalog();
Object.entries(weatherCatalog).forEach(([id, definition]) => {
  assert(Number.isInteger(Number(definition.hysteresisDays)) && definition.hysteresisDays >= 1, 'weather threshold missing: ' + id);
  const set = X.setWeather(state, state.worldSimulation.regionState.trung_vuc ? 'trung_vuc' : Object.keys(state.worldSimulation.regionState)[0], id, definition.hysteresisDays, 'matrix_fixture');
  assert(set.success, 'weather producer rejected catalog item: ' + id);
});
assert(X.validateWeatherRuntimeState(state).ok, 'weather runtime matrix invalid');
console.log('OK: world producer matrix (diplomacy/frontier, war cleanup, footprint/settlement capacity, weather thresholds)');
