/* E2/E5/E7 behavior-first migration, progression and affinity fixtures. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const root = __dirname + '/..';
const context = { console, Math, Date, structuredClone: global.structuredClone };
context.window = context;
vm.createContext(context);
for (const file of ['data/data.js', 'data/fate_data.js', 'data/expansion_data.js', 'data/fate_relationships.js', 'data/path_fate_relations.js', 'js/i18n.js', 'js/engine.js', 'js/expansion.js']) {
  vm.runInContext(fs.readFileSync(root + '/' + file, 'utf8'), context, { filename: file });
}
const E = context.GameEngine, X = context.GameExpansion;
const state = E.createState('progression-matrix');

// E2: legacy save migration owns the new coordinate/travel/world namespaces.
const legacy = { schemaVersion: 12, player: { exp: 3 }, locationId: state.locationId, mapState: {}, gameClock: state.gameClock };
const migrated = E.migrateV12ToV13(legacy);
assert(migrated.schemaVersion >= 13 && migrated.travelTask === null && migrated.generatedItems && migrated.questState, 'v12 migration did not create canonical namespaces');
E.ensureWorldClock(state);
assert(E.validateWorldClockState(state).ok, 'canonical world clock is invalid after migration boundary');

// E5: progression DTO and path switching remain read-first and bounded.
state.player.realmId = context.GameData.REALMS[1].id;
E.updateDerived(state);
const paths = E.availablePaths(state);
assert(Array.isArray(paths) && paths.length > 0, 'path catalog missing');
state.player.pathId = paths[0];
state.pathState.primaryPathId = paths[0];
const progression = E.pathProgression(state);
assert(progression.current && Array.isArray(progression.requirements) && progression.summary && Number.isFinite(Number(progression.summary.score)), 'progression DTO incomplete');
const switchStatus = X.pathSwitchStatus(state), candidates = X.pathSwitchCandidates(state);
assert(switchStatus.primaryPathId === paths[0] && Array.isArray(candidates) && candidates.every((path) => path !== paths[0]), 'path switch producer leaked current path');

// E7: affinity is a canonical 0..10 product decision, not an unbounded multiplier.
const fate = (state.player.fates || []).map((id) => context.GameData.FATE_PATTERNS.find((entry) => entry.id === id)).find(Boolean) || context.GameData.FATE_PATTERNS[0];
assert(fate, 'fate catalog missing');
paths.forEach((path) => {
  const score = E.fateCompatibility(path, fate);
  assert(Number.isFinite(Number(score)) && score >= 0 && score <= 10, 'affinity out of range for ' + path);
});
assert(X.validateProductPolicies(state).ok, 'product policy validator failed');
console.log('OK: progression requirement matrix (E2 migration, E5 path progression/switch, E7 affinity/product policy)');
