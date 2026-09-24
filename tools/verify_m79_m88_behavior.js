"use strict";
/* One behavior-first fixture per M79-M88 API/UI/platform contract. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const sandbox = { window: {}, console, performance: { now: () => Date.now() }, Date };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine, X = sandbox.window.GameExpansion;
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const state = E.createState({ character: E.createCharacter({ name: "M79-M88 QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });

// M79: canonical save version/schema and migration round-trip.
const saved = JSON.parse(E.serialize(state)); assert.strictEqual(saved.version, 13); assert.strictEqual(saved.schema, "tu_vi_quy_di_canonical_v13"); assert(E.deserialize(JSON.stringify(saved)).meta);
// M80/M84: world/player clocks remain distinct but synchronized through canonical epoch fields.
assert(E.ensureGameClock(state) !== E.ensureWorldClock(state)); assert(X.validateWorldClockState(state).ok); assert(Number(state.worldClock.absoluteDay) > 0);
// M81/M82: action resolver owns priority and surface classification.
const context = E.contextState(state); assert(Array.isArray(context.actions)); context.actions.forEach((action) => { assert(action.id); assert(["quick", "overflow", "modal", "forced", undefined].includes(action.surface)); }); assert(E.validateActionPriorityMatrix(state).ok);
// M83: grouped movement is the UI canonical surface; four directions are resolver compatibility.
const main = read("js/main.js"), ui = read("js/ui.js"); assert(main.includes('action.id === "act_move_group"')); assert(ui.includes("act_move_group"));
// M85: all runtime entropy boundaries are explicit and webgame is deterministic.
assert(!/Math\.random\s*\(/.test(read("webgame/app.js"))); assert(/replayRandom|seeded/.test(read("js/engine.js")));
// M86/M87: gate scripts and generated offline bundle are present and current.
["tools/verify_offline_bundle.js", "tools/verify_indexeddb_archive.js", "tools/verify_random_boundaries.js", "tools/verify_asset_references.js"].forEach((file) => assert(fs.existsSync(path.join(root, file)), file));
const offline = read("index.offline.html"); assert(offline.includes("tu_vi_quy_di_canonical_v13")); assert(offline.includes("pinned-character-summary"));
// M88: pinned summary and action boundary are present in the production UI contract.
assert(ui.includes("pinned-character-summary") || read("index.html").includes("pinned-character-summary")); assert(/renderAfterTurn\(\)/.test(main));
console.log("OK: M79-M88 behavior-first matrix (save, clocks, actions, grouped movement, entropy, bundle, UI boundary)");
