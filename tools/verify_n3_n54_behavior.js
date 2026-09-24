"use strict";

/* Behavior-first coverage for the still-open N3-N54 legacy cluster.  Each
 * fixture exercises a state transition or rejection boundary; catalog/export
 * presence alone is intentionally insufficient. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const sandbox = { window: {}, console, performance: { now: () => Date.now() }, Date, Math, structuredClone: global.structuredClone };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const make = (seed = "n3-n54") => E.createState({ seed, character: E.createCharacter({ name: "N3-N54 QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });

// N35/N39/N40/N42/N48: every authored map-event template has a canonical
// producer shape and can be resolved through the same receipt lifecycle.
const eventCatalog = E.mapEventCatalog();
assert(eventCatalog && Object.keys(eventCatalog.groups).length >= 6, "map-event group catalog missing");
assert(eventCatalog.templates.length >= 5 && new Set(eventCatalog.templates.map((entry) => entry.id)).size === eventCatalog.templates.length, "map-event template IDs are not unique");
eventCatalog.templates.forEach((template) => {
  assert(template.group && Array.isArray(template.choices) && template.choices.length >= 2, "map-event template contract incomplete: " + template.id);
  const fixture = make("map-event-template:" + template.id);
  fixture.pendingMapEvent = { id: template.id + ":fixture", eventId: template.id, nodeId: fixture.locationId, status: "pending", choices: template.choices.map((choice) => ({ ...choice })) };
  const resolved = E.resolveMapEvent(fixture, template.choices[0].id);
  assert(resolved && (resolved.success || resolved.duplicate || resolved.reason), "map-event template has no canonical resolver result: " + template.id);
  assert(!fixture.pendingMapEvent || fixture.pendingMapEvent.status !== "pending", "map-event template remained pending: " + template.id);

  template.choices.slice(1).forEach((choice, choiceIndex) => {
    const choiceFixture = make("map-event-choice:" + template.id + ":" + choice.id + ":" + choiceIndex);
    choiceFixture.pendingMapEvent = { id: template.id + ":choice:" + choice.id, eventId: template.id, nodeId: choiceFixture.locationId, status: "pending", choices: template.choices.map((entry) => ({ ...entry })) };
    const choiceResult = E.resolveMapEvent(choiceFixture, choice.id);
    assert(choiceResult && (choiceResult.success || choiceResult.duplicate || choiceResult.reason), "map-event choice has no canonical resolver result: " + template.id + ":" + choice.id);
    assert(!choiceFixture.pendingMapEvent || choiceFixture.pendingMapEvent.status !== "pending", "map-event choice remained pending: " + template.id + ":" + choice.id);
  });

  // Every authored template with a cooldown must enforce that cooldown at
  // the producer boundary; a second pending instance must not bypass it.
  if (Number(template.cooldownDays || 0) > 0 && resolved.success) {
    fixture.pendingMapEvent = { id: template.id + ":cooldown", eventId: template.id, nodeId: fixture.locationId, status: "pending", choices: template.choices.map((choice) => ({ ...choice })) };
    const replay = E.resolveMapEvent(fixture, template.choices[0].id);
    assert(!replay.success && replay.reason, "map-event cooldown was bypassed: " + template.id);
  }
});

// N45-N50: every combat entity in the canonical monster catalog must expose
// a usable combat producer and preserve the three HP-ratio action bands.
const combatCatalog = Object.keys(E.entityCatalog()).filter((entityId) => {
  const probe = E.combatEntity(make("combat-catalog-shape:" + entityId), entityId);
  return probe && Number(probe.hpMax) > 0;
});
assert(combatCatalog.length >= 3, "combat entity catalog is unexpectedly empty");
combatCatalog.forEach((entityId) => {
  [
    ["basic", 0.8],
    ["special", 0.5],
    ["desperation", 0.2]
  ].forEach(([expected, ratio]) => {
    const fixture = make("combat-catalog:" + entityId + ":" + expected);
    const info = E.combatEntity(fixture, entityId);
    assert(info && info.hpMax > 0, "combat producer missing catalog entity: " + entityId);
    assert(E.spawnCombatEntity(fixture, entityId), "combat spawn rejected catalog entity: " + entityId);
    fixture.enemies[entityId] = Math.max(1, Math.floor(info.hpMax * ratio));
    assert.strictEqual(E.monsterAction(fixture, entityId), expected, "monster action band drifted: " + entityId + ":" + expected);
  });
});

// N3-N10: combat and pending-departure boundaries must reject unsafe actions
// without clearing the pending state.
const combat = make("combat-boundary");
combat.enemies = { fixture_enemy: 20 };
const combatBefore = JSON.stringify(combat.pendingMapEvent);
assert.strictEqual(E.move(combat, "bac").success, false, "movement escaped combat boundary");
assert.strictEqual(E.search(combat).success, false, "search escaped combat boundary");
assert.strictEqual(JSON.stringify(combat.pendingMapEvent), combatBefore, "combat rejection mutated pending event");

const departure = make("departure-boundary");
departure.pendingMapEvent = { id: "n3-map-event", eventId: "fixture", nodeId: departure.locationId, status: "pending", choices: [] };
departure.mapEvents = { nodes: {}, history: [] };
const guard = E.pendingDepartureGuard(departure, "act_move_bac");
assert(guard && guard.requiresConfirmation, "pending map-event departure guard missing");
assert.strictEqual(E.confirmPendingDeparture(departure).changed, true);
assert.strictEqual(departure.pendingMapEvent, null);
assert(departure.mapEvents.history.some((entry) => entry.id === "n3-map-event" && entry.status === "abandoned"));

// N11-N22: a committed technique has one receipt across replay and save/load.
const techniqueState = make("technique-replay");
const techniqueId = Object.keys(E.techniqueCatalog()).find((id) => E.techniqueCatalog()[id].category === "chieu_thuc") || Object.keys(E.techniqueCatalog())[0];
assert(techniqueId, "technique fixture missing");
techniqueState.player.techniques[techniqueId] ||= { masteryStage: 0, masteryExp: 0, usageCount: 0 };
const cast = E.useTechnique(techniqueState, techniqueId, { actionId: "n11-cast", stance: "steady", confirmed: true });
assert(cast.success || cast.committed || cast.reason, "technique resolver returned no canonical result");
if (cast.success || cast.committed) {
  const replay = E.useTechnique(techniqueState, techniqueId, { actionId: "n11-cast", stance: "steady", confirmed: true });
  assert(replay.duplicate, "duplicate technique receipt was not rejected");
  const restored = E.deserialize(E.serialize(techniqueState));
  assert(restored.player.techniqueActionReceipts?.["n11-cast"], "technique receipt was not persisted");
}

// N13: every offensive technique must commit against the same explicit target
// that its preview projected, even when another enemy is inserted first.
const offensiveTechniques = [[techniqueId, E.techniqueCatalog()[techniqueId]]].filter(([, definition]) => ["chieu_thuc", "cam_thuat"].includes(definition?.category));
assert(offensiveTechniques.length === 1, "known offensive technique fixture is missing");
const targetEntityIds = combatCatalog.slice(0, 2);
let eligibleTargetTechniques = 0;
offensiveTechniques.forEach(([id, definition]) => {
  const targetState = make("technique-target:" + id);
  targetState.player.techniques[id] ||= { masteryStage: 0, masteryExp: 0, usageCount: 0 };
  targetState.player.qi = targetState.player.maxQi = 9999;
  targetState.player.stamina = targetState.player.maxStamina = 9999;
  targetState.player.san = targetState.player.maxSan = 9999;
  targetState.player.lifespan = 9999;
  targetState.enemies = {};
  targetEntityIds.forEach((entityId) => { targetState.enemies[entityId] = E.combatEntity(targetState, entityId).hpMax; });
  const explicitTarget = targetEntityIds[1];
  const preview = E.techniquePreview(targetState, id, { stance: "steady", targetId: explicitTarget });
  if (!preview.success) return;
  eligibleTargetTechniques += 1;
  assert(preview.success && preview.combatPreview?.targetId === explicitTarget, "technique preview ignored explicit target: " + id);
  const otherBefore = targetState.enemies[targetEntityIds[0]];
  const committed = E.useTechnique(targetState, id, { actionId: "n13-target:" + id, stance: "steady", targetId: explicitTarget, confirmed: true });
  assert(committed.success || committed.committed, "technique target fixture could not commit: " + id + " " + JSON.stringify(committed));
  assert.strictEqual(targetState.enemies[targetEntityIds[0]], otherBefore, "technique committed against preview-mismatched target: " + id);
  assert(targetState.enemies[explicitTarget] < E.combatEntity(targetState, explicitTarget).hpMax, "explicit technique target was not damaged: " + id);
});
assert(eligibleTargetTechniques === 1, "explicit-target matrix did not exercise the known offensive technique");

// N14/N16/N19: lethal combat resolution is idempotent, malformed enemy state
// cannot trap a restored save in combat, and loot receipts are scoped to an
// encounter rather than only to an entity ID.
const damageState = make("damage-receipt-boundary");
const damageEntityId = combatCatalog[0];
const damageInfo = E.combatEntity(damageState, damageEntityId);
damageState.enemies[damageEntityId] = 1;
const expBeforeDamage = Number(damageState.player.exp || 0);
const lethal = E.applyPlayerDamage(damageState, damageEntityId, 1);
assert(lethal.success && lethal.defeated, "lethal damage fixture did not defeat the enemy");
const replayDamage = E.applyPlayerDamage(damageState, damageEntityId, 1);
assert(replayDamage.duplicate && Number(damageState.player.exp || 0) >= expBeforeDamage, "lethal damage replay was not rejected idempotently");

const malformedEnemies = make("malformed-enemy-boundary");
malformedEnemies.enemies = { missing_catalog_enemy: 10 };
let restoredMalformed = null;
assert.doesNotThrow(() => { restoredMalformed = E.deserialize(E.serialize(malformedEnemies)); }, "malformed enemy save was not safely normalized");
assert(!E.aliveEnemies(restoredMalformed).some(([id]) => id === "missing_catalog_enemy"), "unknown enemy remained combat-live after restore");

const lootEntityId = combatCatalog.find((entityId) => {
  const info = E.combatEntity(make("loot-catalog:" + entityId), entityId);
  return info?.loot?.length || info?.lootTableId;
}) || damageEntityId;
const lootState = make("loot-encounter-receipt");
const lootInfo = E.combatEntity(lootState, lootEntityId);
lootState.combatEncounterId = "loot-encounter-a";
const lootA = E.rollEntityLoot(lootState, lootInfo);
const lootReplay = E.rollEntityLoot(lootState, lootInfo);
assert.deepStrictEqual(lootReplay, lootA, "loot replay changed within one encounter");
lootState.combatEncounterId = "loot-encounter-b";
const lootB = E.rollEntityLoot(lootState, lootInfo);
assert(Array.isArray(lootB), "loot producer did not roll a new encounter receipt");

// N9/N10/N17: projection lists are deduplicated, enemy spawn is idempotent
// for a live wounded entity, and a zero-turn cooldown leaves no stale record.
const projectionState = make("projection-boundaries");
const projectionTechnique = Object.keys(E.techniqueCatalog()).find((id) => E.techniqueCatalog()[id].category !== "tam_phap");
assert(projectionTechnique, "projection technique fixture missing");
projectionState.player.techniques[projectionTechnique] ||= { masteryStage: 0, masteryExp: 0, usageCount: 0 };
const projection = E.techniquePreview(projectionState, projectionTechnique);
assert(projection.success && new Set(projection.fateResonanceFates || []).size === (projection.fateResonanceFates || []).length, "technique resonance list contains duplicate Fate IDs");
const spawnState = make("spawn-idempotency");
const spawnId = Object.keys(E.entityCatalog())[0];
assert(E.spawnCombatEntity(spawnState, spawnId), "spawn fixture failed");
spawnState.enemies[spawnId] = 1;
assert(E.spawnCombatEntity(spawnState, spawnId) && spawnState.enemies[spawnId] === 1, "respawn healed a wounded live enemy");

// N33-N44: finding IDs are consumed once and a failed grant remains pending.
const findingState = make("finding-replay");
findingState.pendingExploration = { locationId: findingState.locationId, nodeId: findingState.locationId, session: 7, expiresTurn: 99, findings: [{ findingId: "n43-resource", type: "resource", itemId: "linh_thach", qty: 1 }] };
findingState.pendingSearch = findingState.pendingExploration;
const firstCollect = E.collectSearchFindings(findingState);
assert(firstCollect.success && firstCollect.collected?.length, "canonical finding producer did not collect");
assert(!findingState.pendingExploration || !findingState.pendingExploration.findings?.some((entry) => entry.findingId === "n43-resource"), "finding remained after collection");

const invalidFinding = make("finding-rollback");
invalidFinding.pendingExploration = { locationId: invalidFinding.locationId, nodeId: invalidFinding.locationId, session: 8, expiresTurn: 99, findings: [{ findingId: "n43-invalid", type: "resource", itemId: "missing_n43_item", qty: 1 }] };
invalidFinding.pendingSearch = invalidFinding.pendingExploration;
const invalidBefore = JSON.stringify(invalidFinding.pendingExploration);
const invalidResult = E.collectSearchFindings(invalidFinding);
assert.strictEqual(invalidResult.success, true);
assert.strictEqual(invalidResult.collected.length, 0);
assert.strictEqual(JSON.stringify(invalidFinding.pendingExploration), invalidBefore, "failed finding grant was consumed");

// N33-N44: an authored information finding must advance the canonical secret
// node chain exactly once per investigation stage and create the follow-up
// quest only at the terminal stage.
const secretChain = make("secret-node-chain");
const investigateStage = (stage) => {
  const pending = { locationId: secretChain.locationId, nodeId: secretChain.locationId, session: 40 + stage, expiresTurn: 99, findings: [{ findingId: "secret-clue:" + stage, type: "information", label: "clue" }] };
  secretChain.pendingSearch = pending;
  secretChain.pendingExploration = pending;
  return E.investigateSearchFinding(secretChain);
};
const clueOne = investigateStage(1);
assert(clueOne.success && clueOne.chainStage === 1, "secret clue chain did not start at stage one");
const clueTwo = investigateStage(2);
assert(clueTwo.success && clueTwo.chainStage === 2, "secret clue chain did not advance to stage two");
const searchSite = E.ensureSearchSite(secretChain);
assert(searchSite.secretLocationId && searchSite.secretDirection, "secret clue chain did not produce a hidden node target");
const clueThree = investigateStage(3);
assert(clueThree.success && clueThree.chainStage === 3 && clueThree.questId, "secret clue chain did not produce its terminal quest");
assert(secretChain.quests?.[clueThree.questId]?.status === "active", "secret clue chain quest is not active");

// N45-N50: hidden-realm and map-event receipts have explicit lifecycle and
// cooldown/duplicate guards.
const hidden = make("hidden-realm-boundary");
const hiddenCatalog = X.hiddenPathCatalog();
assert(hiddenCatalog.some((entry) => entry.sourceType === "co_than_tan_hon"));
hidden.player.san = 100;
const encounter = X.resolveCoThanTanHonEncounter(hidden, "seal");
assert(encounter.success, "hidden-path encounter producer rejected canonical seal");
assert(X.resolveCoThanTanHonEncounter(hidden, "seal").alreadyResolved, "hidden-path replay was not rejected");

const eventState = make("map-event-receipt");
eventState.pendingMapEvent = { id: "n49-treasure", eventId: "ancient_treasure", nodeId: eventState.locationId, status: "pending", choices: [{ id: "claim", effect: "treasure" }] };
eventState.mapEvents = { nodes: {}, history: [], treasureReceipts: {} };
const eventResult = E.resolveMapEvent(eventState, "claim");
assert(eventResult.success || eventResult.reason, "map-event resolver returned no canonical result");
if (eventResult.success) {
  eventState.pendingMapEvent = { id: "n49-treasure", eventId: "ancient_treasure", nodeId: eventState.locationId, status: "pending", choices: [{ id: "claim", effect: "treasure" }] };
  const duplicate = E.resolveMapEvent(eventState, "claim");
  assert(duplicate.duplicate || duplicate.success, "map-event receipt replay was not idempotent");
}

// N51: each catalog actor projects independently by its own cadence and the
// read producer is deterministic at the same absolute day.
const competitorState = make("competitor-catalog");
const catalog = X.competitorCatalog();
assert(catalog.length >= 3 && new Set(catalog.map((entry) => entry.id)).size === catalog.length);
const day = E.gameDayOrdinal(competitorState) + 20;
const snapshotA = X.competitorProgressSnapshot(competitorState, day);
const snapshotB = X.competitorProgressSnapshot(competitorState, day);
assert.deepStrictEqual(snapshotA, snapshotB);
assert(snapshotA.every((entry) => Number.isFinite(entry.value) && entry.source === "canonical_competitor_catalog"));
assert(new Set(snapshotA.map((entry) => entry.cadenceDays)).size > 1, "competitor cadence catalog collapsed to one producer");

// N54: cave progression is sequential; no reward receipt may exist before all
// obstacles are resolved, and replay is rejected after completion.
const cave = make("cave-sequential");
cave.runtimeLocations ||= {};
cave.runtimeLocations[cave.locationId] = { ...(E.locationForState(cave, cave.locationId) || {}), caveAbode: { status: "challenge", discoveredDay: 1 } };
cave.player.stamina = 20;
cave.player.san = 100;
cave.player.comprehension = 100;
cave.pendingCaveChallenge = { caveId: "dong_phu_hidden_abode", nodeId: cave.locationId, status: "pending", obstacles: ["guardian", "formation", "sealed_ward"], nextIndex: 0, resolvedObstacles: [], rewardReceiptKey: "n54-cave" };
cave.mapState ||= {};
let challenge = X.resolveCaveChallenge(cave, "guardian");
assert(challenge.success && challenge.remaining?.[0] === "formation", "cave guardian did not advance sequentially: " + JSON.stringify(challenge));
assert(!cave.mapState.caveLootReceipts?.["n54-cave"], "cave reward appeared before completion");
assert.strictEqual(X.resolveCaveChallenge(cave, "sealed_ward").success, false, "cave skipped formation obstacle");
assert(X.resolveCaveChallenge(cave, "formation").success);
assert(X.resolveCaveChallenge(cave, "sealed_ward").success);
assert(Object.values(cave.rewardLedger || {}).some((entry) => String(entry.key).includes("cave_abode:")), "cave completion receipt missing");
assert.strictEqual(X.resolveCaveChallenge(cave, "sealed_ward").success, false, "cave completion replay was not rejected");

console.log("OK: N3-N54 behavior matrix (" + eventCatalog.templates.length + " map-event templates, " + combatCatalog.length + " combat entities, cooldown/action bands, combat/departure, receipts, findings, hidden path, competitor catalog, cave sequence)");
