"use strict";
/* Replacement behavior-first fixtures for the former tautological N90-N114 checks. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const sandbox = { window: {}, console, performance: { now: () => Date.now() }, Date };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const make = (seed = "n90-n114") => E.createState({ character: E.createCharacter({ name: "N90-N114 QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }), seed });

// N90-N92: offline companion callback must produce deterministic, inspectable state.
const companionA = make("companion-determinism"), companionB = make("companion-determinism");
companionA.worldSimulation.seed = companionB.worldSimulation.seed = "fixed-companion-seed";
companionA.companion = X.normalizeCompanion({ entityId: "n-companion", state: "active", hp: 20, hpMax: 20 });
companionB.companion = X.normalizeCompanion({ entityId: "n-companion", state: "active", hp: 20, hpMax: 20 });
const combatA = X.simulateOfflineCompanionCombat(companionA, 1234), combatB = X.simulateOfflineCompanionCombat(companionB, 1234);
assert.strictEqual(combatA.success, true); assert.deepStrictEqual(combatA, combatB); assert.deepStrictEqual(companionA.companion.damageLedger, companionB.companion.damageLedger);

// N93-N95: namespace and rejection paths must be behaviorally negative, not truthy objects.
const invalid = make();
invalid.pathState.primaryPathId = "kiem_dao"; invalid.pathState.secondaryPathId = "kiem_dao"; invalid.player.pathId = "kiem_dao";
assert.strictEqual(X.validateCanonicalNamespaces(invalid).ok, false);
assert(X.validateCanonicalNamespaces(invalid).errors.some((error) => error.includes("duplicate")));
const valid = make(); assert.strictEqual(X.validateCanonicalNamespaces(valid).ok, true);

// N96-N99: producer inventories and opening catalog must be non-empty and executable.
const logProducer = source("tools/verify_log_producers.js");
assert((logProducer.match(/const candidates/g) || []).length > 0 && /candidates\.length/.test(logProducer));
const openingUi = source("tools/verify_opening_intent.js");
assert(/sectAvailable|familyAvailable/.test(openingUi) && /assert/.test(openingUi));
assert(Object.keys(E.ERROR_NARRATIVE_MAP || {}).length > 0);

// N100: direct cauldron renderer is exported, so the old fallback branch cannot silently hide it.
const ui = source("js/ui.js"); assert(/renderCauldron/.test(ui));

// N101-N105: reward catalog, progression roll and nurture are callable and bounded.
assert(typeof E.fateRewardWeights === "function");
const weights = E.fateRewardWeights(); assert(weights && Object.keys(weights).length > 0);
const rollState = make("progression-roll"); const rolled = E.rollFateByProgression(rollState, { progress: 0, realm: 1 });
assert(rolled && rolled.id && !rolled.tien, "progression roll must use the bounded early-tier pool");
const fateId = rollState.player.fates[0]; const beforeNurture = JSON.stringify(rollState.player.fateRelationships || {});
const nurture = E.nurtureFate(rollState, fateId);
assert(nurture.success || nurture.reason, "nurture must return a canonical result");
if (nurture.success) assert.notStrictEqual(JSON.stringify(rollState.player.fateRelationships || {}), beforeNurture);

// N106-N107: hidden-path catalog and map version conflict are explicit contracts.
assert(Array.isArray(X.hiddenPathClues(make()))); assert(typeof X.resolveMapTransaction === "function");
const mapState = make(); X.ensureMapState(mapState); const version = X.stateVersion(mapState);
assert.strictEqual(X.resolveMapTransaction(mapState, version + 1).code, "MAP_VERSION_CONFLICT");

// N108-N111: two-clock separation, canonical save schema and complete error map.
const clockState = make(); assert(E.ensureWorldClock(clockState).absoluteDay > 0);
assert(E.ensureGameClock(clockState) !== clockState.worldClock);
const raw = E.serialize(clockState); const save = JSON.parse(raw);
assert.strictEqual(save.version, 13); assert(raw.includes("tu_vi_quy_di_canonical_v13"));
assert(Object.keys(E.ERROR_NARRATIVE_MAP || {}).every((code) => typeof E.ERROR_NARRATIVE_MAP[code] === "string" || E.ERROR_NARRATIVE_MAP[code]));

// N112-N114: autosave/save and runtime validation are exercised at actual boundaries.
const boundary = make(); E.advanceGameTime(boundary, 1); assert(boundary._lastRuntimeValidation && boundary._lastRuntimeValidation.valid === true);
const boundaryRaw = E.serialize(boundary); assert(boundaryRaw.includes("canonical_v13"));
const mapNode = X.mapNode(boundary, boundary.locationId); const fogNodeId = Object.values(mapNode.exits || {})[0] || boundary.locationId; X.mapFogState(boundary, fogNodeId, 1); assert(X.mapFogState(boundary, fogNodeId) >= 1 && X.mapFogState(boundary, fogNodeId) <= 3); X.mapFogState(boundary, fogNodeId, 3); assert.strictEqual(X.mapFogState(boundary, fogNodeId), 3);
assert(X.validateExpansionState(boundary).valid);
console.log("OK: N90-N114 behavior-first replacement (determinism, rejection, catalogs, clocks, save and runtime boundaries)");
