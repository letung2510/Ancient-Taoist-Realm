"use strict";

// Focused regression for the additive companion runtime contract.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(read(file), sandbox, { filename: file }));

const E = sandbox.window.GameEngine;
const character = E.createCharacter({ name: "Companion QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
const state = E.createState({ character });
E.ensureExpansionState(state);
state.companion = { customName: "QA Beast", state: "active", hp: 20, hpMax: 20, passiveId: "scout", entityId: "di_qui" };
E.ensureExpansionState(state);
assert(Number(state.companion.attack) > 0 && state.companion.attackSource, "legacy companion migration must derive an attack stat");
assert.deepStrictEqual(E.recordCompanionDamage(state, 5, "qa_enemy", "curse").success, true);
assert.strictEqual(state.companion.lastDamageSource.source, "qa_enemy");
assert.strictEqual(state.companion.damageLedger.length, 1);
E.recordCompanionDamage(state, 50, "qa_boss");
assert.strictEqual(state.companion.state, "recovering");
assert.strictEqual(E.recoverCompanion(state).success, false);
state.gameClock.currentDay += 3;
assert.strictEqual(E.recoverCompanion(state).success, true);
assert.strictEqual(state.companion.state, "active");
E.spawnCombatEntity(state, "di_qui");
const enemyId = Object.keys(state.enemies)[0], enemyHp = Number(state.enemies[enemyId]);
const unknownSkill = E.useCompanionSkill(state, "unregistered_skill");
assert(!unknownSkill.success && unknownSkill.code === "UNKNOWN_COMPANION_SKILL" && Number(state.enemies[enemyId]) === enemyHp, "unknown companion skill must be rejected without damage");
const wrongRole = E.useCompanionSkill(state, "guard_bite");
assert(!wrongRole.success && wrongRole.code === "COMPANION_ROLE_MISMATCH" && Number(state.enemies[enemyId]) === enemyHp, "scout cannot silently execute striker skill");
const firstSkill = E.useCompanionSkill(state, "scout_strike");
assert(firstSkill.success && Number(state.enemies[enemyId]) < enemyHp && firstSkill.damage > 8, "catalogued scout skill must use the companion attack stat");
assert(Number(state.companion.loyalty) === 49, "companion skill must consume canonical loyalty cost");
const cooldown = E.useCompanionSkill(state, "scout_strike");
assert(!cooldown.success && cooldown.code === "COMPANION_SKILL_COOLDOWN", "companion skill cooldown must reject duplicate same-turn use");
state.meta.turn += 2;
state.companion.loyalty = 0;
const fled = E.useCompanionSkill(state, "scout_strike");
assert(!fled.success && fled.code === "COMPANION_FLED" && state.companion.state === "fled" && state.companion.fleeCount === 1, "zero-loyalty companion must flee deterministically");
state.companion.state = "active"; state.companion.loyalty = 50;
state.enemies = { di_qui: 20, yeu_thu: 1 };
const woundedTarget = E.selectCompanionTarget(state, { woundedWeight: 100, threatMap: { di_qui: 0, yeu_thu: 0 } });
assert.strictEqual(woundedTarget, "yeu_thu", "companion target resolver did not prioritize runtime low-HP target");
// Enemy combat profile emits a poison producer; the same status path honors
// the physique poison-resistance modifier before writing player state.
state.player.specialPhysique = "van_doc_the";
state.specialPhysiqueState.activeId = "van_doc_the";
state.specialPhysiqueState.history = [{ id: "van_doc_the", stage: 1 }];
const resisted = E.applyCombatStatus(state, "player", "poison", 2, 3, "qa_poison");
assert(resisted.success && resisted.resistance === 0.5 && resisted.potency === 1.5 && state.combatStatuses.player.player?.id === "poison", "poison resistance must reduce status potency at stage 1");
state.player.specialPhysique = null; state.specialPhysiqueState.activeId = null; state.specialPhysiqueState.history = [];
state.player.hp = state.player.maxHp;
E.spawnCombatEntity(state, "ho_phap_huyen_lan");
E.monsterAction(state, "ho_phap_huyen_lan");
assert(state.combatStatuses.player.player?.id === "poison", "enemy combat profile must produce poison status");
// Mutation is a blocking companion action with explicit cure/accept branches;
// both must clear the pending state through the same canonical command resolver.
state.companion.mutationPending = true; state.companion.state = "mutated"; state.companion.corruption = 80;
state.inventory.linh_thach = 20;
const cured = E.resolveCompanionMutation(state, "cure");
assert(cured.success && !state.companion.mutationPending && state.companion.mutation === "purified", "companion cure branch did not commit");
state.companion.mutationPending = true; state.companion.state = "mutated"; state.player.corruptionRating = 0;
const accepted = E.runExpansionCommand(state, "companion_mutation", "accept");
assert(accepted.success && !state.companion.mutationPending && state.companion.mutation === "tainted_claw" && state.player.corruptionRating === 5, "companion accept command bridge did not commit");
// UI commands must resolve through the same canonical action handlers as the
// action-list IDs; otherwise the visible recovery/revive buttons are dead
// aliases even though direct APIs pass.
state.companion.state = "recovering";
state.companion.hp = 0;
state.companion.recoveryUntilDay = E.gameDayOrdinal(state) - 1;
const recoveredByUiCommand = E.runExpansionCommand(state, "companion_recover");
assert(recoveredByUiCommand.success && state.companion.state === "active", "companion_recover UI bridge did not commit");
assert(/companion_recover/.test(read("js/expansion.js")) && /companion_revive/.test(read("js/expansion.js")), "companion recovery/revive command aliases missing");
assert(/data-expansion-command="companion_mutation"/.test(read("js/ui.js")), "companion mutation UI action is not canonical");
console.log("OK: companion ledger, recovery gate and deterministic target contract");
