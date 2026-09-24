/* N183 producer inventory: every cultivation gain must carry a canonical source. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname, '..');
const engine = fs.readFileSync(path.join(root, 'js', 'engine.js'), 'utf8');
const expansion = fs.readFileSync(path.join(root, 'js', 'expansion.js'), 'utf8');
const callsites = [];
for (const [file, text] of [['js/engine.js', engine], ['js/expansion.js', expansion]]) {
  const re = /\bgainExp\(state,([^\n]*)\)/g;
  let match;
  while ((match = re.exec(text))) callsites.push({ file, line: text.slice(0, match.index).split('\n').length, expression: match[0] });
}
assert(callsites.length >= 6, 'cultivation producer inventory unexpectedly small');
const missing = callsites.filter((entry) => !/source\s*=/.test(entry.expression) && !/gainExp\(state,\s*[^,]+,\s*["'`]/.test(entry.expression));
assert.deepStrictEqual(missing, [], 'gainExp callsite missing explicit source: ' + JSON.stringify(missing));
assert(/canonical_reward/.test(expansion), 'canonical reward producer has no attribution source');
const sourceCatalog = ['cultivate', 'combat', 'combat_insight', 'quest_reward', 'item_use', 'environment_insight', 'canonical_reward', 'system_other'];
sourceCatalog.forEach((source) => assert(engine.includes('"' + source + '"'), 'catalog source missing: ' + source));
console.log('OK: cultivation producer inventory (N183) - ' + callsites.length + ' explicit canonical callsites');
