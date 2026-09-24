/* Browser/UI contract gate. CUA supplies lifecycle evidence; this gate protects the same surface in CI. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js', 'ui.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const expansion = fs.readFileSync(path.join(root, 'js', 'expansion.js'), 'utf8');
for (const id of ['screen-home', 'screen-create', 'screen-game', 'overlay', 'overlay-close', 'btn-save-file', 'btn-load-file', 'save-file-input']) assert(html.includes('id="' + id + '"'), 'missing UI lifecycle node: ' + id);
assert(/@media\s*\(max-width:\s*760px\)/.test(css), 'responsive breakpoint contract missing');
assert(/#topbar\s*\{[^}]*flex-wrap:\s*wrap/.test(css), 'mobile topbar wrap contract missing');
assert(/\.topbar-actions\s*\{[^}]*min-width:\s*0/.test(css), 'mobile topbar shrink contract missing');
assert(/\.topbar-actions \.game-clock\s*\{[^}]*overflow-wrap:\s*anywhere/.test(css), 'mobile clock wrap contract missing');
assert(/data-journey-intent-confirm/.test(ui) && /journey-intent/.test(ui), 'journey intent action surface missing');
assert(/btn-save-file|save-file-input/.test(main) && /btn-load-file|save-file-input/.test(main), 'save/load handlers missing');
assert(/const alert = showPlayerAlert/.test(main) && /window\.alert = showPlayerAlert/.test(main), 'raw UI alert paths are not routed through player-facing mapper');
assert(/new FileReader\(\)/.test(main) && /reader\.onerror/.test(main), 'file import read-error lifecycle missing');
assert(/file\.size/.test(main) && /8 \* 1024 \* 1024/.test(main), 'file import size boundary missing');
assert(/file\.type/.test(main) && /application\/json/.test(main), 'file import MIME boundary missing');
assert(/URL\.revokeObjectURL/.test(main) && /link\.download/.test(main), 'file export cleanup/download contract missing');
assert(/!imported\?\.player|!imported\.player/.test(main), 'file import canonical state-shape guard missing');
assert(/validateSaveEnvelope/.test(main) && /validateSaveEnvelope/.test(expansion), 'file import must use canonical save envelope validator');
assert(/queueNodeId/.test(ui) && /Điểm chờ/.test(ui), 'NPC queue destination disclosure missing');
assert(/overlay.*hidden|classList\.add\(['"]hidden/.test(main + ui), 'overlay lifecycle close contract missing');
assert(/setAttribute\(['"]data-['"] \+ key/.test(main) && !/dataset\[key\]/.test(main), 'dynamic data-* action buttons must not use invalid dataset keys');
assert(/consumeBlackMarketPrompt\?\./.test(main) && /markOpportunityPrompted\?\./.test(main) && /nextTechniqueActionId\(/.test(main), 'UI prompt/state transitions must use canonical runtime helpers');
assert(/command === "technique_prepare"/.test(main) && /UI\.renderTechniqueDetail\(state\)/.test(main), 'technique prepare/channel overlay refresh contract missing');
assert(/requiresConfirmation/.test(main) && /technique_prepare/.test(main), 'technique prepare preview-confirm bridge missing');
assert(/data-technique-stance/.test(main) && /technique-stance-picker/.test(main) && /\$\("overlay-content"\)\.addEventListener/.test(main) && !/stanceInput/.test(main), 'technique stance must use a canonical UI picker, not window.prompt');
assert(!/Thế vận công:[^\n]*prompt\(/.test(main), 'combat technique path still contains a prompt stance fallback');
assert(/resourcesReady/.test(main) && /preview\.blockers/.test(main), 'technique resource rejection must happen before confirmation');
assert(/techniqueEvolutionPreview/.test(expansion) && /technique_evolve/.test(expansion) && /requiresConfirmation/.test(expansion), 'technique evolution preview-confirm contract missing');
assert(/data-expansion-command="technique_channel"|technique_channel/.test(ui), 'technique channel action surface missing');
assert(/hiddenPathCatalog/.test(ui) && /co_than_encounter/.test(ui), 'hidden-path encounter UI surface missing');
assert(/renderCompanionPanel/.test(ui) && /companion_recover/.test(ui) && /companion_revive/.test(ui) && /companion_mutation/.test(ui), 'companion lifecycle action surface missing');
assert(/guildVaultSnapshot/.test(ui) && /data-guild-teaching/.test(ui) && /data-status-action/.test(ui), 'guild teaching discovery/action surface missing');
assert(/act_exp_npc_train/.test(expansion) && /act_exp_org_study/.test(expansion), 'guild/NPC teaching canonical action IDs missing');
assert(/settlement|resolveNpcSettlements/.test(ui + expansion), 'settlement lifecycle surface missing');
assert(/settlementSnapshot/.test(expansion) && /data-settlement-snapshot/.test(ui), 'settlement capacity read-model UI missing');
assert(/fast-travel-action/.test(ui) && /travel_fast/.test(ui) && /travel_fast/.test(expansion), 'canonical fast-travel UI bridge missing');

// Action-surface matrix: every stateful UI action must expose a stable
// canonical command/selector and be routed through the single expansion
// dispatcher. This keeps browser E2E selectors from depending on translated
// labels or incidental DOM nesting.
const actionMatrix = [
  ['movement', 'travel_fast', 'fast-travel-action'],
  ['companion-recover', 'companion_recover', 'companion_recover'],
  ['companion-revive', 'companion_revive', 'companion_revive'],
  ['companion-mutation', 'companion_mutation', 'companion_mutation'],
  ['npc-teaching', 'act_exp_npc_train', 'act_exp_npc_train'],
  ['guild-teaching', 'act_exp_org_study', 'act_exp_org_study'],
  ['hidden-path', 'co_than_encounter', 'co_than_encounter'],
  ['settlement-snapshot', 'data-settlement-snapshot', 'settlement'],
];
for (const [name, command, selector] of actionMatrix) {
  assert(ui.includes(command) || expansion.includes(command), name + ' canonical action missing: ' + command);
  assert(ui.includes(selector) || expansion.includes(selector), name + ' stable selector/read-model missing: ' + selector);
}
for (const modal of ['inventory', 'fate', 'technique', 'realm', 'map']) {
  assert(html.includes('data-modal="' + modal + '"') || ui.includes('data-modal="' + modal + '"'), 'modal contract missing: ' + modal);
}
assert(/data-tab="world"/.test(html) && /data-tab="oddities"/.test(html), 'world/oddities tab contract missing');
assert(/data-tab-content|tab-content/.test(html + ui), 'tab content host contract missing');
console.log('OK: browser/UI contract (responsive, modal lifecycle, action surface, save/load nodes)');
