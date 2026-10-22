/* Technique prepare/channel/cancel/commit receipt matrix. */
const assert = require('assert');
const { loadRuntime } = require('./lib/load_runtime');
const { context } = loadRuntime();
const E = context.GameEngine, X = context.GameExpansion;
const stableJson = (value) => JSON.stringify(value, (_, item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
  return Object.keys(item).sort().reduce((sorted, key) => { sorted[key] = item[key]; return sorted; }, {});
});
assert(E.validateTechniqueCrossSystemCatalog().ok, 'technique cross-system catalog validator failed');
const state = E.createState('technique-channel-matrix');
state.player.qi = 9999; state.player.maxQi = 9999; state.player.stamina = 9999; state.player.maxStamina = 9999;
state.player.realmId = context.GameData.REALMS[Math.min(4, context.GameData.REALMS.length - 1)].id;
E.updateDerived(state);
const catalog = E.techniqueCatalog();
const technique = Object.values(catalog).find((entry) => entry.category !== 'tam_phap' && !entry.requiredFaction && !entry.requiredPath && Number(entry.minRealmLevel || 1) <= 5 && (entry.preparation?.enabled || entry.prepareCost || entry.cost?.prepare));
assert(technique, 'channel-capable technique fixture missing');
if (!state.player.techniques?.[technique.id]) assert(E.learnTechnique(state, technique.id), 'technique learn fixture failed');
const preview = E.techniquePreview(state, technique.id, { stance: 'steady', targetId: 'matrix-target' });
assert(preview.success && preview.prepareCost, 'technique preview missing prepare cost');
const first = E.prepareTechnique(state, technique.id, 'matrix-prepare-1', { stance: 'steady', targetId: 'matrix-target' });
assert(first.success && first.receipt.status === 'prepared', 'prepare receipt missing');
assert(E.prepareTechnique(state, technique.id, 'matrix-prepare-1').duplicate, 'prepare idempotency missing');
const channel = E.advanceTechniqueChannel(state, technique.id, 0.5);
assert(channel.success && channel.channelProgress > 0 && !channel.ready, 'partial channel state missing');
const cancelled = E.cancelTechniquePreparation(state, technique.id, 'matrix-cancel');
assert(cancelled.success && state.player.techniques[technique.id].combatState.prepared === false, 'cancel did not clear prepared state');
const cancelledReplay = E.prepareTechnique(state, technique.id, 'matrix-prepare-1');
assert(cancelledReplay.duplicate && cancelledReplay.success === false && cancelledReplay.receipt.status === 'cancelled', 'cancelled prepare receipt was not terminal/idempotent');
const second = E.prepareTechnique(state, technique.id, 'matrix-prepare-2', { stance: 'burst', targetId: 'matrix-target' });
assert(second.success, 'second prepare failed');
const ready = E.advanceTechniqueChannel(state, technique.id, 1);
assert(ready.success && ready.ready, 'full channel did not reach ready');
const committed = E.useTechnique(state, technique.id, { stance: 'burst', targetId: 'matrix-target' });
assert(committed && typeof committed.success === 'boolean', 'technique commit did not return canonical receipt');
assert(E.validateTechniqueRuntimeState(state).ok, 'technique runtime invalid after prepare/channel/commit');
assert(E.validateTechniqueCrossSystemState(state).ok, 'technique cross-system state validator failed after commit');
const trialState = E.createState('technique-trial-archive');
const trialTechnique = Object.keys(trialState.player.techniques || {})[0] || technique.id;
trialState.player.techniques[trialTechnique] ||= { masteryStage: 2, masteryExp: 0, usageCount: 0 };
trialState.player.techniques[trialTechnique].evolution = { status: 'trial', trialType: 'cultivation', progress: 0, target: 2, eventKeys: [] };
X.advanceTechniqueTrials(trialState, 'cultivation', 'archive-event-1');
X.advanceTechniqueTrials(trialState, 'cultivation', 'archive-event-2');
const archivedEvolution = trialState.player.techniques[trialTechnique].evolution;
assert(archivedEvolution.status === 'ready' && archivedEvolution.eventKeys.length === 0 && archivedEvolution.eventArchive?.policy === 'bounded_trial_archive_v1' && archivedEvolution.eventArchive.count === 2, 'completed technique trial did not archive bounded event keys');
assert(E.validateTechniqueRuntimeState(trialState).ok, 'technique trial archive failed runtime validation');
state.player.techniques.matrix_unknown = { masteryStage: 0 };
assert(!E.validateTechniqueCrossSystemState(state).ok, 'cross-system validator accepted an unknown technique');
delete state.player.techniques.matrix_unknown;

// Instant techniques must not be coerced into a fake preparation phase.
const instantState = E.createState('technique-instant-guard');
const instantId = 'kiem_khi_so_cap';
if (!instantState.player.techniques?.[instantId]) assert(E.learnTechnique(instantState, instantId), 'instant technique learn fixture failed');
const instantPrepare = E.prepareTechnique(instantState, instantId, 'instant-prepare-1');
assert(!instantPrepare.success && /instant action/.test(instantPrepare.reason), 'instant technique accepted an invalid Prepare phase');
const instantUseBefore = stableJson(instantState.player);
const invalidStanceUse = E.useTechnique(instantState, instantId, { stance: 'invalid', actionId: 'instant-invalid-stance', confirmed: true });
assert(!invalidStanceUse.success && stableJson(instantState.player) === instantUseBefore, 'rejected use mutated player state');

// N17: passive/zero-cooldown techniques must not leave a phantom cooldown
// record that blocks later canonical reads or bloats serialized saves.
const zeroCooldown = Object.values(catalog).find((entry) => entry.category !== 'tam_phap' && Number(entry.visibleStats?.cooldownSeconds || 0) === 0);
if (zeroCooldown) {
  const zeroState = E.createState('technique-zero-cooldown');
  zeroState.player.qi = 9999; zeroState.player.maxQi = 9999; zeroState.player.stamina = 9999; zeroState.player.maxStamina = 9999;
  zeroState.player.realmId = state.player.realmId; E.updateDerived(zeroState);
  if (!zeroState.player.techniques?.[zeroCooldown.id]) E.learnTechnique(zeroState, zeroCooldown.id);
  const zeroResult = E.useTechnique(zeroState, zeroCooldown.id, { actionId: 'n17-zero-cooldown', confirmed: true });
  if (zeroResult?.success) assert(!zeroState.player.techniqueCooldowns?.[zeroCooldown.id], 'zero-cooldown technique persisted a phantom record');
}

// UI command bridge must exercise the same canonical resolver, including its
// sequence receipt, instead of maintaining a second prepare implementation.
const commandState = E.createState('technique-command-bridge');
commandState.player.qi = 9999; commandState.player.maxQi = 9999; commandState.player.stamina = 9999; commandState.player.maxStamina = 9999;
commandState.player.realmId = state.player.realmId; E.updateDerived(commandState);
if (!commandState.player.techniques?.[technique.id]) assert(E.learnTechnique(commandState, technique.id), 'command bridge technique learn fixture failed');
const commandPreview = X.runExpansionCommand(commandState, 'technique_prepare', technique.id, 'steady');
assert(commandPreview.success && commandPreview.requiresConfirmation && !commandState.player.techniques[technique.id].combatState.prepared, 'technique_prepare command must preview without mutating');
const commandPrepare = X.runExpansionCommand(commandState, 'technique_prepare', technique.id, 'steady', { confirmed: true });
assert(commandPrepare.success && commandState.player.techniques[technique.id].combatState.prepared, 'technique_prepare command bridge did not commit after confirmation');
const commandChannel = X.runExpansionCommand(commandState, 'technique_channel', technique.id, 1);
assert(commandChannel.success && commandChannel.ready, 'technique_channel command bridge did not reach ready');
const commandCommit = E.useTechnique(commandState, technique.id, { requirePrepared: true, preparedActionId: commandPrepare.actionId });
assert(commandCommit.success && !commandState.player.techniques[technique.id].combatState.prepared, 'technique command bridge did not commit ready channel');

const customCommandState = E.createState('technique-command-custom-action');
customCommandState.player.qi = 9999; customCommandState.player.maxQi = 9999; customCommandState.player.stamina = 9999; customCommandState.player.maxStamina = 9999;
customCommandState.player.realmId = state.player.realmId; E.updateDerived(customCommandState);
if (!customCommandState.player.techniques?.[technique.id]) assert(E.learnTechnique(customCommandState, technique.id), 'custom command technique learn fixture failed');
const customPrepare = X.runExpansionCommand(customCommandState, 'technique_prepare', technique.id, 'steady', { confirmed: true, actionId: 'custom-prepare-action' });
assert(customPrepare.success && customPrepare.actionId === 'custom-prepare-action' && customCommandState.player.techniquePrepareReceipts['custom-prepare-action'], 'command bridge dropped caller Prepare actionId');

const mismatchState = E.createState('technique-prepare-mismatch');
mismatchState.player.qi = 9999; mismatchState.player.maxQi = 9999; mismatchState.player.stamina = 9999; mismatchState.player.maxStamina = 9999;
mismatchState.player.realmId = state.player.realmId; E.updateDerived(mismatchState);
if (!mismatchState.player.techniques?.[technique.id]) assert(E.learnTechnique(mismatchState, technique.id), 'mismatch technique learn fixture failed');
assert(E.prepareTechnique(mismatchState, technique.id, 'mismatch-prepare', { stance: 'steady', targetId: 'mismatch-target' }).success, 'mismatch prepare failed');
assert(E.advanceTechniqueChannel(mismatchState, technique.id, 1).ready, 'mismatch channel failed');
const mismatchBefore = stableJson(mismatchState.player);
const mismatchCommit = E.useTechnique(mismatchState, technique.id, { requirePrepared: true, preparedActionId: 'mismatch-prepare', stance: 'burst', targetId: 'mismatch-target', confirmed: true });
assert(!mismatchCommit.success && stableJson(mismatchState.player) === mismatchBefore, 'prepared stance mismatch committed or mutated state');

const deniedState = E.createState('technique-resource-boundary');
deniedState.player.realmId = state.player.realmId;
if (!deniedState.player.techniques?.[technique.id]) assert(E.learnTechnique(deniedState, technique.id), 'resource boundary learn fixture failed');
deniedState.player.qi = 0; deniedState.player.stamina = 0;
const deniedBefore = JSON.stringify(deniedState.player.techniques[technique.id]);
const deniedPreview = X.runExpansionCommand(deniedState, 'technique_prepare', technique.id, 'steady');
assert(!deniedPreview.success && !deniedPreview.requiresConfirmation, 'resource boundary must reject before confirmation');
assert.strictEqual(stableJson(deniedState.player.techniques[technique.id]), stableJson(JSON.parse(deniedBefore)), 'resource rejection mutated technique state');
console.log('OK: technique channel matrix (preview, prepare receipt, duplicate guard, partial/full channel, cancel, commit)');
