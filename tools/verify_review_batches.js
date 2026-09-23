"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
const makeState = () => {
  const state = E.createState({ character: E.createCharacter({ name: "Review QA", archetypeId: "kiem_tong", fates: E.drawInitialFates(), startRegionId: "trung_vuc" }) });
  assert(E.chooseJourneyIntent(state, "tu_lap").success);
  return state;
};

function testMapCanonical() {
  const state = makeState(); state.inventory.linh_thach = 100;
  const coordinateAudit = E.validateMapCoordinates(state);
  assert(coordinateAudit.valid && coordinateAudit.total >= 13 && coordinateAudit.missing.length === 0 && coordinateAudit.duplicates.length === 0);
  assert(sandbox.window.GameExpansion.validateMapCanonicalState(state).ok);
  state.openWorld ||= {}; state.openWorld.nodePool ||= {};
  state.openWorld.nodePool.qa_missing_coordinate = { id: "qa_missing_coordinate" };
  assert(!sandbox.window.GameExpansion.validateMapCanonicalState(state).ok, "map canonical validator must reject nodes without coordinates");
  delete state.openWorld.nodePool.qa_missing_coordinate;
  const influence = E.resolveMapInfluence(state, state.locationId);
  assert(influence.discovered && influence.source === "canonical_gradient" && influence.coordinateValid !== false);
  assert(E.buildMapStructure(state, state.locationId, "teleport_array").success);
  assert(E.buildMapStructure(state, state.locationId, "world_ward").success);
  const structures = state.mapState.structures[state.locationId];
  assert(structures.every((entry) => entry.ownerType === "player"));
  assert(sandbox.window.GameExpansion.validateStructureRuntimeState(state).ok);
  structures[0].integrity = 101;
  assert(!sandbox.window.GameExpansion.validateStructureRuntimeState(state).ok, "structure runtime validator must reject invalid integrity");
  structures[0].integrity = 100;
  structures[0].integrity = 30;
  assert(E.repairMapStructure(state, state.locationId, structures[0].id).success);
  assert(E.upgradeMapStructure(state, state.locationId, structures[0].id).success);
  const completion = E.mapCompletion(state, "trung_vuc");
  assert(completion.structuresBuilt >= 2);
  const detailed = sandbox.window.GameExpansion.mapCompletionDetailed(state, "trung_vuc");
  assert(detailed.explainable && detailed.layers.visited >= 1 && detailed.layers.structure >= 1 && detailed.historyCoverage >= 0);
}

function testInfluenceOfflineAndInvalidation() {
  const state = makeState();
  state.visitedLocations.push(state.locationId);
  const before = E.resolveMapInfluence(state, state.locationId);
  const revisionBefore = before.revision;
  assert(sandbox.window.GameExpansion.validateCacheInvalidationState(state).ok);
  const factionId = before.factions[0]?.factionId || "faction_qa";
  assert(E.recordMapEventInfluence(state, state.locationId, factionId, 12, E.gameDayOrdinal(state) + 2).success);
  const eventSnapshot = E.resolveMapInfluence(state, state.locationId);
  assert(eventSnapshot.revision > revisionBefore && eventSnapshot.influenceMap[factionId] > before.influenceMap[factionId]);
  assert(sandbox.window.GameExpansion.validateCacheInvalidationState(state).ok && state.mapState.invalidationCount >= 1);
  state.inventory.linh_thach = 100;
  assert(E.buildMapStructure(state, state.locationId, "world_ward").success);
  const wardSnapshot = E.resolveMapInfluence(state, state.locationId);
  const playerInfluenceKey = "player_" + state.player.id;
  assert(wardSnapshot.influenceMap[playerInfluenceKey] >= 6);
  const ward = state.mapState.structures[state.locationId].find((entry) => entry.type === "ward_formation");
  assert(E.disableMapStructure(state, state.locationId, ward.id, "qa_damage").success);
  const disabledSnapshot = E.resolveMapInfluence(state, state.locationId);
  assert(Number(disabledSnapshot.influenceMap[playerInfluenceKey] || 0) < Number(wardSnapshot.influenceMap[playerInfluenceKey] || 0));
  assert(E.repairMapStructure(state, state.locationId, ward.id).success);
  assert.strictEqual(ward.status, "active");
  const restored = E.deserialize(E.serialize(state));
  E.simulateWorldUntil(restored, E.gameDayOrdinal(restored) + 1, { offline: true });
  assert(E.resolveMapInfluence(restored, restored.locationId).influenceMap["player_" + restored.player.id] >= 6);
  assert(E.validateExpansionState(restored).valid);
}

function testStructureOwnershipLifecycle() {
  const state = makeState();
  state.inventory.linh_thach = 100;
  const nodeId = state.locationId;
  assert(E.buildMapStructure(state, nodeId, "world_ward").success);
  const structure = state.mapState.structures[nodeId][0];
  const before = Number(state.inventory.linh_thach || 0);
  const removed = E.dismantleMapStructure(state, nodeId, structure.id);
  assert(removed.success && removed.refund === 6 && structure.status === "dismantled");
  assert(Number(state.inventory.linh_thach || 0) === before + removed.refund);
  assert(!E.dismantleMapStructure(state, nodeId, structure.id).success);
  const afterDismantleInfluence = E.resolveMapInfluence(state, nodeId);
  const playerInfluenceKey = "player_" + state.player.id;
  assert(Number(afterDismantleInfluence.influenceMap[playerInfluenceKey] || 0) < 6, "dismantled structure must not retain influence");
  assert(!E.wardProtectionAtNode(state, nodeId).active, "dismantled ward must not retain protection");
  assert(sandbox.window.GameExpansion.validateProductPolicies(state).ok);
  const managed = makeState(); managed.inventory.linh_thach = 100; managed.guildMembership = { guildId: "thien_huyen_tong" };
  assert(E.buildMapStructure(managed, managed.locationId, "world_ward").success);
  const factionStructure = managed.mapState.structures[managed.locationId][0]; factionStructure.ownerType = "faction"; factionStructure.ownerId = "thien_huyen_tong"; factionStructure.integrity = 50;
  assert(E.repairMapStructure(managed, managed.locationId, factionStructure.id).success);
  assert(!E.upgradeMapStructure(managed, managed.locationId, factionStructure.id).success, "faction-owned structure cannot be upgraded by player policy");
  const remoteStructureState = makeState(); remoteStructureState.inventory.linh_thach = 100;
  const remoteStructure = E.buildMapStructure(remoteStructureState, remoteStructureState.locationId, "world_ward");
  assert(remoteStructure.success); remoteStructure.structure.integrity = 50;
  const remoteRepairState = E.deserialize(E.serialize(remoteStructureState));
  const remoteStructureNode = remoteRepairState.locationId; E.move(remoteRepairState, "bac");
  const remoteRepairInventory = Number(remoteRepairState.inventory.linh_thach || 0);
  const remoteRepair = E.repairMapStructure(remoteRepairState, remoteStructureNode, remoteStructure.structure.id);
  assert(!remoteRepair.success && Number(remoteRepairState.inventory.linh_thach || 0) === remoteRepairInventory);

  const outpostState = makeState();
  outpostState.inventory.linh_thach = 100;
  outpostState.guildMembership = { guildId: "thien_huyen_tong" };
  const claimed = E.claimOutpost(outpostState, outpostState.locationId);
  assert.strictEqual(claimed.success, true, "qualified guild member must claim the local outpost");
  const petition = E.petitionOutpostToFaction(outpostState, outpostState.locationId);
  assert(petition.success && outpostState.mapState.outposts[outpostState.locationId].ownerType === "faction");
  assert(!E.petitionOutpostToFaction(outpostState, outpostState.locationId).success);
  const remoteOutpostState = makeState();
  remoteOutpostState.inventory.linh_thach = 100;
  const remoteOutpostNode = remoteOutpostState.locationId;
  E.move(remoteOutpostState, "bac");
  const remoteOutpostInventory = Number(remoteOutpostState.inventory.linh_thach || 0);
  const remoteClaim = E.claimOutpost(remoteOutpostState, remoteOutpostNode);
  assert(!remoteClaim.success && Number(remoteOutpostState.inventory.linh_thach || 0) === remoteOutpostInventory);
}

function testDiscoveryAndNpcReplay() {
  const state = makeState();
  assert(E.discover(state, "locations", state.locationId, "qa").status === "discovered");
  assert(E.verifyDiscovery(state, "locations", state.locationId, "qa").success);
  assert(E.collectDiscovery(state, "locations", state.locationId, "qa").success);
  assert(E.rewardDiscovery(state, "locations", state.locationId, "qa").success);
  assert(!E.verifyDiscovery(state, "locations", state.locationId, "qa").success);
  const discoverySummary = E.discoveryStatusSummary(state);
  assert.strictEqual(discoverySummary.byStatus.rewarded, 1);
  assert.strictEqual(discoverySummary.byCategory.locations.rewarded, 1);
  assert.strictEqual(discoverySummary.total, 1);
  assert(sandbox.window.GameExpansion.validateDiscoveryLifecycle(state).ok);
  state.discoveries.locations[state.locationId].status = "paths_are_not_discovery";
  assert(!sandbox.window.GameExpansion.validateDiscoveryLifecycle(state).ok, "discovery validator must reject cross-namespace status");
  state.discoveries.locations[state.locationId].status = "rewarded";
  const npc = state.worldSimulation.npcState["su_phu"];
  assert(npc, "canonical scheduled NPC su_phu must exist for patrol replay coverage");
  npc.scheduleType = "patrol"; npc.nextMoveDay = 1;
  const before = npc.currentNodeId;
  E.simulateWorldUntil(state, E.gameDayOrdinal(state) + 2);
  assert(Object.values(sandbox.window.GameData.LOCATIONS[before]?.exits || {}).includes(npc.currentNodeId) || before === npc.currentNodeId);
  const resultsA = E.resolveOfflineNpcEncounters(state, E.gameDayOrdinal(state) + 10).length;
  const resultsB = E.resolveOfflineNpcEncounters(state, E.gameDayOrdinal(state) + 10).length;
  assert.strictEqual(resultsA, resultsB);
}

function testOnlineFateRewardLedger() {
  const state = makeState();
  const clock = E.ensureGameClock(state);
  const day = E.gameDayOrdinal(state);
  clock.nextOnlineFateDay = day;
  const first = E.processOnlineFateReward(state);
  assert(first && first.canonical && state.rewardLedger["online_fate:" + day]);
  const fateCount = state.player.fates.length + state.fateInventory.length;
  clock.nextOnlineFateDay = day;
  const replay = E.processOnlineFateReward(state);
  assert(replay && replay.canonical && replay.duplicate);
  assert.strictEqual(state.player.fates.length + state.fateInventory.length, fateCount);
}

function testTaintedRewardLedger() {
  const state = makeState();
  const first = E.grantTaintedRewardCanonical(state, "qa:tainted", { heaven_merit: 2, heaven_seal: true }, "qa:tainted:1");
  assert(first.success && state.rewardLedger["qa:tainted:1"]);
  assert.strictEqual(state.player.tainted.rewards.heaven_merit, 2);
  const replay = E.grantTaintedRewardCanonical(state, "qa:tainted", { heaven_merit: 2 }, "qa:tainted:1");
  assert(replay.duplicate);
  assert.strictEqual(state.player.tainted.rewards.heaven_merit, 2);
  const raw = JSON.parse(E.serialize(state));
  raw.state.rewardLedger["qa:legacy-corrupt"] = "preserve-me";
  const migrated = E.deserialize(JSON.stringify(raw));
  assert.strictEqual(migrated.rewardLedger["qa:legacy-corrupt"].status, "quarantined");
  assert.strictEqual(migrated.rewardLedger["qa:legacy-corrupt"].legacyPayload, "preserve-me");
  assert(E.validateExpansionState(migrated).valid);
}

function testActorHistoryOfflineProjection() {
  const state = makeState();
  const npcId = Object.keys(state.worldSimulation.npcState)[0];
  const start = E.gameDayOrdinal(state);
  E.simulateWorldUntil(state, start + 35, { offline: true });
  const history = sandbox.window.GameExpansion.actorHistorySnapshot(state, npcId);
  assert(history.length > 0 && history.length <= 30);
  assert(history[history.length - 1].day === start + 35);
  assert(state.worldSimulation.lastOfflineAudit && state.worldSimulation.lastOfflineAudit.targetDay === start + 35);
  const restored = E.deserialize(E.serialize(state));
  assert.deepStrictEqual(sandbox.window.GameExpansion.actorHistorySnapshot(restored, npcId), history);
}

function testNodeHistoryProjection() {
  const state = makeState();
  const nodeId = state.locationId;
  const types = ["sub_location", "structure", "faction_change", "actor", "weather", "completion"];
  types.forEach((type, index) => assert(E.appendNodeHistory(state, nodeId, { type, summary: "qa-" + type, key: "qa:" + type })));
  const node = E.mapNode(state, nodeId);
  assert(types.every((type) => node.history.some((entry) => entry.type === type)));
  types.forEach((type) => assert(!E.appendNodeHistory(state, nodeId, { type, summary: "qa-" + type, key: "qa:" + type })));
  const detailed = sandbox.window.GameExpansion.mapCompletionDetailed(state, sandbox.window.GameExpansion.mapNode(state, nodeId).regionId);
  assert(detailed.layers.subLocation >= 1 && detailed.layers.faction >= 1 && detailed.explainable);
  for (let index = 0; index < 60; index += 1) E.appendNodeHistory(state, nodeId, { type: "retention", summary: "qa-retention", key: "qa-retention:" + index });
  assert(node.history.length === 50);
  assert(node.history.every((entry) => entry.day != null && entry.regionId));
  assert(sandbox.window.GameExpansion.validateNodeHistory(state, nodeId).ok);
}

function testLegacyLogRoundTrip() {
  const state = makeState();
  state.history = [{ type: "sys", text: "Một dòng cũ", changes: [{ label: "Khí", delta: 2 }] }];
  const restored = E.deserialize(JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state }));
  assert.strictEqual(restored.history[0].id, "legacy_0");
  assert(restored.history[0].statDisplay.length === 1);
  assert(sandbox.window.GameEngine.validateLogSurfaceState(restored).ok);
  E.pushHistory(restored, { type: "warn", text: "INTERNAL_ROUTE_BLOCKED" });
  assert(sandbox.window.GameEngine.validateLogSurfaceState(restored).ok, "technical producer must be sanitized at log boundary");
}

function testActionPriority() {
  const state = makeState(); state.enemies = { yeu_thu: 10 }; const combat = E.contextState(state);
  assert(combat.inCombat); assert(combat.actions.every((action) => action.id.startsWith("act_skill_") || ["act_tan_cong_thuong", "act_bo_chay", "act_nhin", "act_hanh_trang", "act_trang_thai"].includes(action.id)));
  state.enemies = {}; state.pendingContestedOpportunity = { status: "pending", id: "qa_opportunity" }; const pending = E.contextState(state);
  assert(pending.actions.every((action) => ["act_exp_opportunity", "act_trang_thai"].includes(action.id)));
  assert(E.validateActionPriorityMatrix(state).ok);
  const invalid = E.validateActionPriorityMatrix(state, [{ id: "dup", label: "A", aliases: ["a"], priority: 1 }, { id: "dup", label: "B", aliases: ["a"], priority: 101 }]);
  assert(!invalid.ok && invalid.issues.some((issue) => /duplicate action id|invalid priority|ambiguous alias/.test(issue)));
}

function testSafeActionDoesNotAdvanceTurn() {
  const ids = ["act_nhin", "act_hanh_trang", "act_trang_thai", "act_nhiem_vu", "act_menh", "act_cong_phap", "act_ban_do", "act_to_chuc", "act_giup"];
  ids.forEach((id) => {
    const state = makeState();
    const turn = state.meta.turn;
    const result = E.submitActionId(state, id);
    assert(result !== false, "safe informational action should resolve: " + id);
    assert.strictEqual(state.meta.turn, turn, "informational action must not advance the game turn: " + id);
    assert(state.history.some((entry) => entry.type === "COMMAND_ECHO"), "system diagnostics retain the dispatched command");
    assert(!E.novelLogParagraphs(state).some((paragraph) => paragraph.events.some((entry) => entry.type === "COMMAND_ECHO")), "command echo must stay out of the player story log");
  });
}

function testCombatTranscriptReplay() {
  const seed = makeState();
  assert(sandbox.window.GameExpansion.validateReplayEnvelope(seed).ok);
  seed.worldSimulation.nextEventSeq = -1;
  assert(!sandbox.window.GameExpansion.validateReplayEnvelope(seed).ok, "replay envelope must reject invalid sequence counters");
  seed.worldSimulation.nextEventSeq = 0;
  seed.enemies = { yeu_thu: 120 };
  const first = E.deserialize(E.serialize(seed));
  const second = E.deserialize(E.serialize(seed));
  [first, second].forEach((state) => {
    E.applyPlayerDamage(state, "yeu_thu", 120);
    assert(!Object.keys(state.enemies || {}).length, "combat fixture did not resolve");
  });
  const transcript = (state) => state.history.filter((entry) => entry.type !== "COMMAND_ECHO").map((entry) => ({
    type: entry.type, text: entry.text, clock: entry.clock, statDisplay: entry.statDisplay
  }));
  assert.deepStrictEqual(transcript(first), transcript(second), "combat transcript must replay byte-identically at the player-visible layer");
}

function testDiscoveryReplay() {
  const seedState = makeState(); seedState.locationId = "linh_dien"; seedState.player.stamina = 100; seedState.meta.turn = 9;
  const snapshot = E.serialize(seedState); const a = E.deserialize(snapshot); const b = E.deserialize(snapshot);
  const resultA = E.search(a); const resultB = E.search(b);
  assert.deepStrictEqual(resultA.findings, resultB.findings);
  assert.strictEqual(resultA.depth, resultB.depth);
  const collectedA = E.collectSearchFindings(a); const collectedB = E.collectSearchFindings(b);
  assert.strictEqual(collectedA.success, collectedB.success);
  assert.deepStrictEqual(a.generatedItems, b.generatedItems, "procedural loot IDs/items must replay identically");
  assert.deepStrictEqual(a.inventory, b.inventory, "procedural loot inventory must replay identically");
}

function testCharacterCreationReplayBoundary() {
  const makeRng = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const first = E.rollCharacterCreation("trung_vuc", { rng: makeRng(0x12345678) });
  const second = E.rollCharacterCreation("trung_vuc", { rng: makeRng(0x12345678) });
  assert.deepStrictEqual(first, second, "character creation must be reproducible with an injected RNG");
  const characterA = E.createCharacter({ ...first, id: "replay-character" }, { rng: makeRng(0xabcdef01) });
  const characterB = E.createCharacter({ ...second, id: "replay-character" }, { rng: makeRng(0xabcdef01) });
  assert.deepStrictEqual(characterA, characterB, "character factory must preserve the injected RNG boundary");
}

function testCatalogRecipeAndRewardIdempotency() {
  const state = makeState();
  const techniques = Object.values(E.techniqueCatalog());
  const techniqueValidation = E.validateTechniqueCatalog();
  assert(techniqueValidation.ok && techniqueValidation.count === techniques.length, "technique catalog must validate canonically");
  techniques.forEach((technique) => {
    assert(technique.cost && technique.effect && technique.risk && technique.mastery, "technique must expose canonical DTO");
  });
  const recipes = sandbox.window.GameExpansion.recipeCatalog();
  assert(recipes.tu_khi_dan.materials.linh_thao === 2);
  const structures = sandbox.window.GameExpansion.structureCatalog();
  assert(structures.waystation.buildCost === 20 && structures.ward_formation.maxLevel === 3 && structures.ward_formation.effects.influence === 6);
  const rewardPolicy = sandbox.window.GameExpansion.validateRewardPolicy();
  assert(rewardPolicy.ok && rewardPolicy.policy.duplicate === "reject" && rewardPolicy.policy.fateVaultFull === "pending_vault");
  state.inventory.linh_thao = 20; state.player.stamina = 20; state.player.aptitude = 80;
  assert(sandbox.window.GameExpansion.chooseProfessionLocked(state, "luyen_dan").success);
  const before = state.inventory.linh_thao;
  sandbox.window.GameExpansion.brewPill(state, "tu_khi_dan");
  assert(state.inventory.linh_thao < before);
  const first = sandbox.window.GameExpansion.grantCanonicalReward(state, "qa", { exp: 7 }, "qa:one");
  const second = sandbox.window.GameExpansion.grantCanonicalReward(state, "qa", { exp: 7 }, "qa:one");
  assert(first.success && second.duplicate);
  state.prisoners.qa_prisoner = { id: "qa_prisoner", status: "held" };
  const meritBefore = Number(state.player.merit || 0);
  assert(sandbox.window.GameExpansion.resolvePrisoner(state, "qa_prisoner", "released").success);
  assert(Number(state.player.merit || 0) === meritBefore + 2);
  assert(!sandbox.window.GameExpansion.resolvePrisoner(state, "qa_prisoner", "released").success);
}

function testQuestRewardCanonicalIdempotency() {
  const state = makeState();
  sandbox.window.GameData.QUESTS.qa_canonical_reward = {
    id: "qa_canonical_reward", title: "QA Reward", kind: "qa",
    objectives: [{ id: "done", check: () => true }],
    reward: { exp: 11, merit: 4, linhThach: 3, item: "linh_thach", contribution: 5 }
  };
  state.quests.qa_canonical_reward = { id: "qa_canonical_reward", status: "active", objectives: [{ id: "done", done: false }] };
  const expBefore = Number(state.player.exp || 0), meritBefore = Number(state.player.merit || 0), stoneBefore = Number(state.inventory.linh_thach || 0), contributionBefore = Number(state.player.contribution || 0);
  sandbox.window.GameEngine.checkQuestObjectives(state, "qa_canonical_reward");
  sandbox.window.GameEngine.checkQuestObjectives(state, "qa_canonical_reward");
  assert.strictEqual(Number(state.player.exp || 0), expBefore + 11);
  assert.strictEqual(Number(state.player.merit || 0), meritBefore + 4);
  assert.strictEqual(Number(state.inventory.linh_thach || 0), stoneBefore + 4);
  assert.strictEqual(Number(state.player.contribution || 0), contributionBefore + 5);
  assert(state.rewardLedger["quest:qa_canonical_reward"]);
}

function testRelationshipDimensions() {
  const state = makeState();
  const first = sandbox.window.GameExpansion.recordRelationshipEvent(state, "su_phu", "saved", { uniqueKey: "qa:saved" });
  const duplicate = sandbox.window.GameExpansion.recordRelationshipEvent(state, "su_phu", "saved", { uniqueKey: "qa:saved" });
  assert(first.success && duplicate.duplicate);
  const breakdown = sandbox.window.GameExpansion.relationshipBreakdown(state, "su_phu");
  assert(breakdown.trust > 0 && breakdown.loyalty > 0 && Number.isFinite(breakdown.relationshipScore));
  const policy = sandbox.window.GameExpansion.validateRelationshipPolicy(state);
  assert(policy.ok && policy.policy.fateDecay === "none" && policy.policy.npcDecay === "event_only");
  assert(sandbox.window.GameExpansion.validateRelationshipRuntimeState(state).ok);
  state.worldSimulation.npcState.su_phu.memoryWithPlayer.push({ id: "qa:orphan", uniqueKey: "qa:orphan", day: 1, deltas: {} });
  assert(!sandbox.window.GameExpansion.validateRelationshipRuntimeState(state).ok, "relationship memory/event drift must be rejected");
  state.worldSimulation.npcState.su_phu.memoryWithPlayer.pop();
  assert(sandbox.window.GameExpansion.validateRelationshipPolicy(E.deserialize(E.serialize(state))).ok);
}

function testContestedAndHiddenRealmTransitions() {
  const state = makeState();
  const opportunity = sandbox.window.GameExpansion.createContestedOpportunity(state);
  assert(opportunity && opportunity.status === "pending");
  state.gameClock.currentDay = Number(opportunity.expiresDay) + 1;
  const expired = sandbox.window.GameExpansion.resolveContestedOpportunity(state, "share");
  assert(!expired.success && !state.pendingContestedOpportunity);
  assert(state.opportunityHistory.some((entry) => entry.status === "expired"));
  assert(sandbox.window.GameExpansion.validateContestedOpportunity(state).ok);
  const replayOpportunity = sandbox.window.GameExpansion.createContestedOpportunity(state);
  assert(replayOpportunity?.expiresDay > E.gameDayOrdinal(state));
  E.simulateWorldUntil(state, replayOpportunity.expiresDay + 1, { offline: true });
  assert(!sandbox.window.GameExpansion.resolveContestedOpportunity(state, "share").success, "offline expiry must close opportunity before reward");
  assert(state.opportunityHistory.filter((entry) => entry.id === replayOpportunity.id).length === 1, "offline expiry must be idempotent");
  state.locationId = "co_mieu"; state.visitedLocations.push("co_mieu");
  const runtime = state.worldSimulation.hiddenRealms.co_mo_vo_danh;
  runtime.status = "open"; runtime.cycleIndex = 1; runtime.opensDay = E.gameDayOrdinal(state) - 1; runtime.closesDay = E.gameDayOrdinal(state) + 10;
  assert(sandbox.window.GameExpansion.validateHiddenRealmRuntimeState(state).ok);
  const entered = sandbox.window.GameExpansion.hiddenRealmEnter(state, "co_mo_vo_danh");
  assert(entered.success && state.activeHiddenRealm);
  assert([state.activeHiddenRealm.entryNodeId, state.activeHiddenRealm.coreNodeId].every((id) => Array.isArray(state.openWorld.coordinates[id])));
  assert(E.validateMapCoordinates(state).valid, "runtime Hidden Realm nodes must have canonical coordinates");
  state.locationId = state.activeHiddenRealm.coreNodeId;
  const expBefore = Number(state.player.exp || 0);
  const firstHiddenClaim = sandbox.window.GameExpansion.claimHiddenRealmCore(state);
  assert(firstHiddenClaim, "hidden realm core must grant once");
  const hiddenRewardKey = "hidden_realm:co_mo_vo_danh:1:main";
  assert(Number(state.player.exp || 0) > expBefore && state.rewardLedger[hiddenRewardKey]?.exp === 120, "hidden realm reward must apply once");
  const expAfter = Number(state.player.exp || 0);
  assert(!sandbox.window.GameExpansion.claimHiddenRealmCore(state), "hidden realm core must reject duplicate claim");
  assert(Number(state.player.exp || 0) === expAfter, "duplicate hidden realm claim must not change exp");
  const exited = sandbox.window.GameExpansion.exitHiddenRealm(state);
  assert(exited.success && state.locationId === "co_mieu");
  runtime.claimedRewardKeys.push(hiddenRewardKey);
  assert(!sandbox.window.GameExpansion.validateHiddenRealmRuntimeState(state).ok, "hidden realm reward keys must remain unique");
  runtime.claimedRewardKeys.pop();

  const offlineRealmState = makeState();
  offlineRealmState.locationId = "co_mieu";
  offlineRealmState.visitedLocations.push("co_mieu");
  const offlineRuntime = offlineRealmState.worldSimulation.hiddenRealms.co_mo_vo_danh;
  offlineRuntime.status = "open"; offlineRuntime.cycleIndex = 2;
  offlineRuntime.opensDay = E.gameDayOrdinal(offlineRealmState) - 1;
  offlineRuntime.closesDay = E.gameDayOrdinal(offlineRealmState) + 1;
  assert(sandbox.window.GameExpansion.hiddenRealmEnter(offlineRealmState, "co_mo_vo_danh").success);
  offlineRealmState.locationId = offlineRealmState.activeHiddenRealm.coreNodeId;
  const offlineTarget = E.gameDayOrdinal(offlineRealmState) + 3;
  E.simulateWorldUntil(offlineRealmState, offlineTarget, { offline: true });
  assert(!offlineRealmState.activeHiddenRealm || Number(offlineRuntime.cycleIndex) !== Number(offlineRealmState.activeHiddenRealm.cycleIndex) || offlineRuntime.status !== "open", "offline tick must invalidate the expired active Hidden Realm cycle");
  assert(!sandbox.window.GameExpansion.claimHiddenRealmCore(offlineRealmState), "expired offline realm must reject reward claim");
  assert(sandbox.window.GameExpansion.validateHiddenRealmRuntimeState(offlineRealmState).ok);
}

function testFateNoDecayAcrossLongDays() {
  const state = makeState();
  const fateId = state.player.fates[0];
  state.player.fateRelationships[fateId] = { stage: 3, xp: 77, points: 42, activeDays: 9, stagnantDays: 9, decayPolicy: "none" };
  const before = JSON.stringify({ stage: 3, xp: 77, points: 42 });
  E.advanceGameTime(state, 120);
  const after = state.player.fateRelationships[fateId];
  assert.strictEqual(JSON.stringify({ stage: after.stage, xp: after.xp, points: after.points }), before, "Fate relationship must not decay over long days");
}

function testUnresolvedDesignPoliciesAreCanonical() {
  const state = makeState();
  sandbox.window.GameExpansion.ensureExpansionState(state);
  const policies = sandbox.window.GameExpansion.designPolicySnapshot(state);
  assert.strictEqual(policies.fateRelationshipDecay, "none");
  assert.strictEqual(policies.maxPathSlots, 2);
  assert.strictEqual(policies.offlineMode, "aggregate_then_actor_window");
  assert.strictEqual(policies.offlineActorResolution, "deterministic_event_projection");
  assert(sandbox.window.GameExpansion.validateDesignPolicies(state).ok);
  const fateId = state.player.fates[0];
  state.player.fateRelationships[fateId].decayPolicy = "passive";
  assert(!sandbox.window.GameExpansion.validateDesignPolicies(state).ok, "passive Fate decay must be rejected");
  state.player.fateRelationships[fateId].decayPolicy = "none";
  state.pathState.primaryPathId = state.pathState.primaryPathId || state.player.pathId || "dao_kiem";
  state.pathState.secondaryPathId = state.pathState.primaryPathId;
  assert.strictEqual(sandbox.window.GameExpansion.validateSpecialPhysiqueState(state).ok, true);
  state.specialPhysiqueState.activeId = "missing_dithe";
  assert(!sandbox.window.GameExpansion.validateSpecialPhysiqueState(state).ok, "unknown Dị Thể state must be rejected");
  assert(!sandbox.window.GameExpansion.validateDesignPolicies(state).ok, "duplicate primary/secondary Path must be rejected");
}

function testPerformanceProfiles() {
  const weak = sandbox.window.GameExpansion.resolvePerformanceProfile({ hardwareConcurrency: 2, deviceMemory: 1 });
  const standard = sandbox.window.GameExpansion.resolvePerformanceProfile({ hardwareConcurrency: 8, deviceMemory: 8 });
  assert.strictEqual(weak.id, "weak");
  assert.strictEqual(weak.targetFps, 30);
  assert(weak.historyWindow < standard.historyWindow && weak.mapRenderBudget < standard.mapRenderBudget);
  const state = makeState();
  const applied = sandbox.window.GameExpansion.performanceProfile(state, { hardwareConcurrency: 2, deviceMemory: 1 });
  assert.strictEqual(state.runtimeMetrics.performanceProfile, "weak");
  assert.deepStrictEqual(applied, weak);
  state.worldSimulation.offlinePolicy.detailedWindowDays = weak.offlineDetailedDays;
  assert(sandbox.window.GameExpansion.validatePerformanceBudget(state, { hardwareConcurrency: 2, deviceMemory: 1 }).ok);
  state.worldSimulation.offlinePolicy.detailedWindowDays = 99;
  assert(!sandbox.window.GameExpansion.validatePerformanceBudget(state, { hardwareConcurrency: 2, deviceMemory: 1 }).ok, "weak profile must reject an oversized offline detailed window");
}

function testProgressionNamespaces() {
  const state = makeState();
  const snapshot = sandbox.window.GameExpansion.progressionNamespaceSnapshot(state);
  assert(Object.prototype.hasOwnProperty.call(snapshot, "path"));
  assert(Object.prototype.hasOwnProperty.call(snapshot, "profession"));
  assert(Object.prototype.hasOwnProperty.call(snapshot, "diThe"));
  assert.strictEqual(snapshot.policy.diTheLocksProfession, false);
}

function testProfessionLegacyNamespaceMigration() {
  const state = makeState();
  const hiddenId = Object.keys(sandbox.window.EXPANSION_DATA.hiddenProfessions || {})[0];
  assert(hiddenId, "fixture must expose a hidden profession");
  state.professionState.primaryId = hiddenId;
  state.professionState.secondaryId = null;
  state.professionState.hiddenId = null;
  state.player.hiddenProfession = hiddenId;
  sandbox.window.GameExpansion.ensureExpansionState(state);
  assert.strictEqual(state.professionState.primaryId, null);
  assert.strictEqual(state.professionState.secondaryId, hiddenId);
  assert.strictEqual(state.professionState.hiddenId, hiddenId);
  assert(state.professionState.hiddenIds.includes(hiddenId));
  state.professionState.secondaryId = "normal_profession_from_legacy_save";
  sandbox.window.GameExpansion.ensureExpansionState(state);
  assert.notStrictEqual(state.professionState.secondaryId, "normal_profession_from_legacy_save");
}

function testMultiVersionMigrationFixtures() {
  const source = makeState();
  sandbox.window.GameExpansion.ensureExpansionState(source);
  const serialized = JSON.parse(E.serialize(source));
  const hiddenId = Object.keys(sandbox.window.EXPANSION_DATA.hiddenProfessions || {})[0];
  const legacyV1 = JSON.parse(JSON.stringify(serialized));
  legacyV1.version = 1;
  legacyV1.state.history = [{ type: "sys", text: "Một dấu vết cũ", changes: [{ label: "Khí", delta: 2 }] }];
  legacyV1.state.player.hiddenProfession = hiddenId;
  delete legacyV1.state.professionState;
  delete legacyV1.state.specialPhysiqueState;
  const restoredV1 = E.deserialize(JSON.stringify(legacyV1));
  assert(restoredV1.professionState.secondaryId, "v1 hidden profession alias must migrate to secondary slot");
  assert.strictEqual(restoredV1.history[0].id, "legacy_0");
  const v1Audit = E.validateExpansionState(restoredV1);
  assert(v1Audit.valid, "v1 migration must satisfy current expansion invariants: " + JSON.stringify(v1Audit.errors));

  const legacyV7 = JSON.parse(JSON.stringify(serialized));
  legacyV7.version = 7;
  legacyV7.state.player.hiddenProfession = null;
  legacyV7.state.professionState.hiddenId = hiddenId;
  legacyV7.state.professionState.secondaryId = null;
  legacyV7.state.meta = { turn: 0 };
  const restoredV7 = E.deserialize(JSON.stringify(legacyV7));
  assert.strictEqual(restoredV7.professionState.secondaryId, hiddenId);
  const v7Audit = E.validateExpansionState(restoredV7);
  assert(v7Audit.valid, "v7 migration must satisfy current expansion invariants: " + JSON.stringify(v7Audit.errors));
  const roundTrip = E.deserialize(E.serialize(restoredV7));
  assert.strictEqual(roundTrip.professionState.secondaryId, restoredV7.professionState.secondaryId);
  const roundTripAudit = E.validateExpansionState(roundTrip);
  assert(roundTripAudit.valid, "migrated state must remain valid after canonical round-trip: " + JSON.stringify(roundTripAudit.errors));
}

function testWeatherCatalogTransitions() {
  const state = makeState();
  const region = state.worldSimulation.regionState.trung_vuc;
  const set = sandbox.window.GameExpansion.setWeather(state, "trung_vuc", "snow");
  assert(set.success && set.weather === "tuyet");
  const mist = sandbox.window.GameExpansion.weatherSnapshot(state, "trung_vuc");
  assert(mist.id === "tuyet" && mist.effects.npcShelter === true && mist.transitions.includes("quang"));
  assert(sandbox.window.GameExpansion.weatherCatalog().suong && sandbox.window.GameExpansion.weatherSnapshot({ ...state, worldSimulation: { ...state.worldSimulation, regionState: { trung_vuc: { weather: "suong_mu" } } } }, "trung_vuc").id === "suong");
  assert(set.untilDay > sandbox.window.GameExpansion.gameDayOrdinal(state));
  assert(sandbox.window.GameExpansion.validateWeatherRuntimeState(state).ok);
  region.weatherSeverity = 99;
  assert(!sandbox.window.GameExpansion.validateWeatherRuntimeState(state).ok, "weather runtime validator must reject catalog drift");
  region.weatherSeverity = 2;
  region.weatherUntilDay = sandbox.window.GameExpansion.gameDayOrdinal(state);
  sandbox.window.GameExpansion.simulateWorldUntil(state, sandbox.window.GameExpansion.gameDayOrdinal(state) + 1);
  assert(sandbox.window.GameExpansion.worldModifierPreview(state, { regionId: "trung_vuc" }).weatherLabel);
}

function testWarCascadeAndOfflineDeterminism() {
  const seed = makeState();
  const factionIds = Object.keys(seed.worldSimulation.factionState).slice(0, 2);
  assert(factionIds.length === 2, "world must expose at least two factions");
  const [a, b] = factionIds;
  seed.worldSimulation.wars.qa_war = {
    id: "qa_war", factionA: a, factionB: b, startedDay: 0, frontNodeIds: [],
    scoreA: 9, scoreB: 0, status: "active", playerInterventions: []
  };
  const first = E.deserialize(E.serialize(seed));
  const second = E.deserialize(E.serialize(seed));
  const target = E.gameDayOrdinal(first) + 36;
  E.simulateWorldUntil(first, target, { offline: true });
  E.simulateWorldUntil(second, target, { offline: true });
  assert.deepStrictEqual(first.worldSimulation.wars.qa_war, second.worldSimulation.wars.qa_war);
  assert.deepStrictEqual(first.worldSimulation.factionState, second.worldSimulation.factionState);
  assert(first.worldSimulation.wars.qa_war.status === "ended", "war cascade must resolve deterministically");
  assert(first.worldSimulation.wars.qa_war.cascadeApplied === true);
  const fronts = sandbox.window.GameExpansion.warFrontSnapshot(first);
  assert(fronts.some((front) => front.id === "qa_war" && front.cascadeApplied && front.outcome));
  assert(fronts.every((front) => Array.isArray(front.frontNodeIds) && front.scoreA >= 0 && front.scoreB >= 0));
  assert(sandbox.window.GameExpansion.validateWarState(first).ok);
  const invalidWar = first.worldSimulation.wars.qa_war.factionA;
  first.worldSimulation.wars.qa_war.factionA = "missing_faction";
  assert(!sandbox.window.GameExpansion.validateWarState(first).ok, "war validator must reject invalid faction topology");
  first.worldSimulation.wars.qa_war.factionA = invalidWar;
  const offlineA = E.resolveOfflineNpcEncounters(first, target).map((entry) => entry.key);
  const offlineB = E.resolveOfflineNpcEncounters(second, target).map((entry) => entry.key);
  assert.deepStrictEqual(offlineA, offlineB);
}

function testTravelPreviewCommitParity() {
  const state = makeState();
  const direction = "bac";
  sandbox.window.GameEngine.localBfsConstellation(state, 39);
  const origin = state.locationId;
  const target = sandbox.window.GameEngine.locationExits(state)[direction];
  assert(target && target !== origin, "QA start node must have a valid Oxy neighbor");
  const preview = sandbox.window.GameExpansion.travelPlan(state, state.locationId, target, "walk");
  assert(preview.success, JSON.stringify(preview));
  assert(preview.influence && Number.isFinite(preview.risk));
  assert.strictEqual(preview.partySize, 1);
  assert(preview.modifiers && Number.isFinite(preview.partyWeight) && preview.weights?.source === "canonical_travel_weight" && Number.isFinite(preview.weights.terrainWeight));
  state.companion = { state: "active", hp: 10, hpMax: 10, loyalty: 50 };
  const partyPreview = sandbox.window.GameExpansion.travelPlan(state, state.locationId, target, "walk");
  assert(partyPreview.success && partyPreview.partySize === 2 && partyPreview.partyWeight > 1);
  const before = state.locationId;
  sandbox.window.GameEngine.submitActionId(state, "act_move_" + direction);
  assert(state.locationId === target);
  assert(state.lastTravelPlan && state.lastTravelPlan.fromNodeId === before && state.lastTravelPlan.toNodeId === target);
  assert.strictEqual(state.lastTravelPlan.distance, partyPreview.distance);
  assert.strictEqual(state.lastTravelPlan.risk, partyPreview.risk);
  assert.strictEqual(state.lastTravelPlan.partyWeight, partyPreview.partyWeight);
}

function testNpcRumorMultiNodeExpiry() {
  const state = makeState();
  const npcs = Object.values(state.worldSimulation.npcState).slice(0, 3);
  assert(npcs.length === 3, "world must expose three NPC actors for rumor propagation");
  const [source, relay, witness] = npcs;
  [source, relay, witness].forEach((npc) => { npc.scheduleType = "static"; npc.nextMoveDay = 9999; });
  source.currentNodeId = "son_mon"; relay.currentNodeId = "van_phong"; witness.currentNodeId = "cam_dia";
  const now = E.gameDayOrdinal(state);
  source.rumors = [{ key: "qa:war", text: "Chiến sự đã đổi chiều.", confidence: 1, priority: 5, expiresDay: now + 2 }];
  state.worldSimulation.lastProcessedDay = now;
  E.simulateWorldUntil(state, now + 1);
  assert(relay.rumorLedger["qa:war"] && relay.rumorLedger["qa:war"].confidence === 0.8, JSON.stringify({ source: source.npcId, sourceNode: source.currentNodeId, relay: relay.npcId, relayNode: relay.currentNodeId, ledger: relay.rumorLedger, statuses: npcs.map((npc) => npc.status) }));
  const rumorPolicy = sandbox.window.GameExpansion.rumorPolicySnapshot();
  assert(rumorPolicy.defaultTtlDays === 14 && rumorPolicy.minConfidence === 0.1 && sandbox.window.GameExpansion.validateRumorPolicy(state).ok);
  state.worldSimulation.lastProcessedDay = now + 1;
  E.simulateWorldUntil(state, now + 2);
  assert(witness.rumorLedger["qa:war"], "rumor must cross a second valid edge");
  state.worldSimulation.lastProcessedDay = now + 2;
  E.simulateWorldUntil(state, now + 31);
  assert(!relay.rumorLedger["qa:war"] && !witness.rumorLedger["qa:war"], "expired rumor must be removed");
}

function testFactionBulletinProjection() {
  const state = makeState();
  const npcs = Object.values(state.worldSimulation.npcState).filter((npc) => npc.status === "alive");
  assert(npcs.length >= 2);
  npcs[0].factionId = "qa_faction";
  npcs[0].rumors = [{ key: "qa:bulletin", text: "Tin chiến tuyến kiểm chứng.", confidence: 0.8, priority: 4, expiresDay: E.gameDayOrdinal(state) + 3 }];
  npcs[1].factionId = "qa_faction";
  npcs[1].rumorLedger = { "qa:bulletin": { confidence: 0.6, priority: 2, expiresDay: E.gameDayOrdinal(state) + 2 } };
  const bulletin = sandbox.window.GameExpansion.factionBulletin(state, "qa_faction");
  assert.strictEqual(bulletin.length, 1);
  assert.strictEqual(bulletin[0].confidence, 0.8);
  assert.strictEqual(bulletin[0].sourceNpcIds.length, 2);
  state.gameClock.currentDay = bulletin[0].expiresDay + 1;
  assert.strictEqual(sandbox.window.GameExpansion.factionBulletin(state, "qa_faction").length, 0);
}

function testNpcCongestionQueue() {
  const state = makeState();
  const npcs = Object.values(state.worldSimulation.npcState).slice(0, 6);
  assert(npcs.length >= 5);
  npcs.forEach((npc) => { npc.scheduleType = "static"; npc.currentNodeId = "son_mon"; npc.nextMoveDay = 9999; });
  state.worldSimulation.lastProcessedDay = E.gameDayOrdinal(state);
  E.simulateWorldUntil(state, E.gameDayOrdinal(state) + 1);
  const queued = npcs.filter((npc) => npc.aiState === "queued");
  assert(queued.length >= 1 && queued.every((npc) => npc.queueNodeId === "son_mon" && npc.queueRank >= 1));
  assert(sandbox.window.GameExpansion.validateNpcScheduler(state).ok, JSON.stringify(sandbox.window.GameExpansion.validateNpcScheduler(state)));
  npcs[0].travelFrom = "son_mon"; npcs[0].travelTo = "missing_node";
  assert(!sandbox.window.GameExpansion.validateNpcScheduler(state).ok, "NPC scheduler must reject invalid topology edge");
}

function testCompanionMutationSaveInvariant() {
  const state = makeState();
  state.companion = { entityId: "qa_beast", customName: "QA", state: "active", hp: 30, hpMax: 30, loyalty: 50, corruption: 0, skillMastery: {}, damageLedger: [], reviveCount: 0, mutationPending: true };
  E.ensureExpansionState(state);
  assert(sandbox.window.GameExpansion.validateCompanionState(state).ok);
  const mutation = sandbox.window.GameExpansion.resolveCompanionMutation(state, "accept");
  assert(mutation.success && state.companion.mutation === "tainted_claw" && state.companion.passiveId === "corrupted_scout");
  const restored = E.deserialize(E.serialize(state));
  assert(sandbox.window.GameExpansion.validateCompanionState(restored).ok);
  assert.strictEqual(restored.companion.mutation, "tainted_claw");
  restored.companion.loyalty = 101;
  assert(!sandbox.window.GameExpansion.validateCompanionState(restored).ok, "companion validator must reject invalid loyalty after save-load");
}

function testFateEvolutionPreviewCommitInvariant() {
  const state = makeState();
  const fateId = state.player.fates[0];
  state.player.fateEnhancements ||= {};
  state.player.fateEnhancements[fateId] = 5;
  state.player.fateRelationships ||= {};
  state.player.fateRelationships[fateId] = { stage: 3, resonanceUnlocked: true, decayPolicy: "none", eliteTrials: 2, alignedChoices: 3 };
  state.player.fateEvolutions ||= {};
  const candidates = sandbox.window.GameExpansion.fateEvolutionCandidates(state, fateId);
  assert(candidates.length > 0, "Fate must expose at least one evolution branch");
  const branchId = candidates[0].id;
  state.player.fateEvolutions[fateId] = { status: "ready", candidateBranchIds: candidates.map((entry) => entry.id), branchId: null };
  state.fateExcessEssence = 100; state.player.merit = 100; state.player.san = 100;
  const preview = sandbox.window.GameExpansion.fateEvolutionPreview(state, fateId, branchId);
  assert(preview.success && preview.beforeEffects && preview.afterEffects);
  state.fateExcessEssence = 0;
  const blocked = sandbox.window.GameExpansion.evolveFate(state, fateId, branchId, { confirmed: true });
  assert(!blocked.success && state.player.fateEvolutions[fateId].status === "ready" && state.player.merit === 100);
  state.fateExcessEssence = 100;
  const fail = sandbox.window.GameExpansion.evolveFate(state, fateId, branchId, { confirmed: true });
  assert(fail.success);
  const breakdown = sandbox.window.GameEngine.fateEffectBreakdown(state.player, preview.fate || sandbox.window.GameData.FATE_PATTERNS.find((entry) => entry.id === fateId));
  const committedEffects = sandbox.window.GameEngine.enhancedFateEffects(state.player, sandbox.window.GameData.FATE_PATTERNS.find((entry) => entry.id === fateId));
  assert.deepStrictEqual(committedEffects, preview.afterEffects, JSON.stringify({ branchId, preview: preview.afterEffects, committed: committedEffects, enhancement: state.player.fateEnhancements[fateId], relation: state.player.fateRelationships[fateId] }));
  assert.strictEqual(state.player.fateEvolutions[fateId].branchId, branchId);
  assert(breakdown.evolutionScore !== undefined);
  assert(sandbox.window.GameEngine.validateFateEffectComposition(state.player).ok, "Fate effect layers must remain deterministic and non-duplicated");
  const beforeStats = JSON.stringify(sandbox.window.GameEngine.computeStats(state.player).eff);
  const restoredEffectState = E.deserialize(E.serialize(state));
  const afterStats = JSON.stringify(sandbox.window.GameEngine.computeStats(restoredEffectState.player).eff);
  assert.strictEqual(afterStats, beforeStats, "Fate effect composition must survive save-load without duplication");
}

function testFateAdvancedActionNamespace() {
  const state = makeState();
  const actionCatalog = E.fateAdvancedActionCatalog();
  assert(actionCatalog.nghichMenh.sanCost === 15 && actionCatalog.tranMenh.durationTurns === 3 && actionCatalog.thienCo.cooldownTurns === 12 && actionCatalog.menhDoi.delegatesTo === "fateEvolution");
  const hung = sandbox.window.GameData.FATE_PATTERNS.find((entry) => entry.sign === "hung");
  assert(hung, "advanced Fate fixture needs a Hung fate");
  state.player.fates[0] = hung.id; state.player.san = 100;
  E.updateDerived(state);
  assert(E.defyFate(state, hung.id).success);
  for (let use = 1; use < 5; use += 1) { state.player.san = 100; assert(E.defyFate(state, hung.id).success, "Nghịch Mệnh should allow the first five uses"); }
  const sanAtCap = state.player.san;
  const cappedDefiance = E.defyFate(state, hung.id);
  assert(!cappedDefiance.success && cappedDefiance.code === "MAX_USES" && state.player.san === sanAtCap, "sixth Nghịch Mệnh must fail without consuming SAN");
  state.player.san = 100;
  const suppression = E.suppressFate(state, hung.id);
  assert(suppression.success && suppression.untilTurn === state.meta.turn + 3);
  const sanDuringSuppression = state.player.san;
  assert(!E.suppressFate(state, hung.id).success && state.player.san === sanDuringSuppression, "Trấn Mệnh cannot charge repeatedly while its fixed window is active");
  assert(E.heavenlyOmen(state).success);
  assert(state.player.fateAdvancedActions[hung.id].nghichMenh);
  assert(state.player.fateAdvancedActions[hung.id].tranMenh);
  assert(state.player.fateAdvancedActions._global.thienCo);
  assert(E.validateFateAdvancedActionState(state.player).ok);
  const suppressedStats = E.fateAdvancedEffectBreakdown(state.player, hung.id);
  assert(suppressedStats.suppressed);
  state.meta.turn += 3; state.player._turn = state.meta.turn; E.updateDerived(state);
  const activeStats = E.fateAdvancedEffectBreakdown(state.player, hung.id);
  assert(activeStats.allStatMult > 0 && !activeStats.suppressed);
  const restored = E.deserialize(E.serialize(state));
  assert.deepStrictEqual(restored.player.fateAdvancedActions, state.player.fateAdvancedActions);
  restored.player.fateAdvancedActions._global.nghichMenh = { uses: 1, effectSource: "advanced_fate_action" };
  assert(!E.validateFateAdvancedActionState(restored.player).ok, "global scope must reject Fate-specific action");
}

function testExplicitSecondaryPathTransition() {
  const state = makeState();
  state.player.pathId = "kiem_dao"; state.pathState.primaryPathId = "kiem_dao";
  state.player.realmId = "than_tinh";
  const aligned = sandbox.window.GameData.FATE_PATTERNS.filter((fate) => /kim|sat/i.test([fate.name, fate.desc, fate.element].join(" "))).slice(0, 3).map((fate) => fate.id);
  if (aligned.length) state.player.fates = aligned;
  state.fateExcessEssence = 100; state.player.merit = 100; state.player.san = 100;
  const pending = sandbox.window.GameExpansion.transitionSecondaryPath(state, "dan_dao");
  assert(pending.requiresConfirmation);
  const committed = sandbox.window.GameExpansion.transitionSecondaryPath(state, "dan_dao", { confirmed: true });
  assert(committed.success && state.player.secondaryPathId === "dan_dao");
  assert(committed.fusionAffinity && committed.fusionAffinity.effective <= committed.fusionAffinity.cap);
  assert.strictEqual(committed.fusionAffinity.cap, 0.75);
  const duplicate = sandbox.window.GameExpansion.transitionSecondaryPath(state, "phu_dao", { confirmed: true });
  assert(!duplicate.success && state.player.secondaryPathId === "dan_dao");
  const restored = E.deserialize(E.serialize(state));
  assert.strictEqual(restored.pathState.secondaryPathId, "dan_dao");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restored.pathState.fusionAffinity)), JSON.parse(JSON.stringify(committed.fusionAffinity)));
}

function testProfessionCanonicalReadBoundary() {
  const state = makeState();
  E.ensureExpansionState(state);
  assert(sandbox.window.GameExpansion.validateProfessionNamespace(state).ok);
  state.professionState.secondaryId = "doc_gia_co_tich";
  state.player.hiddenProfession = null;
  assert.strictEqual(E.canonicalHiddenProfessionId(state), "doc_gia_co_tich");
  state.professionState.secondaryId = null;
  state.player.hiddenProfession = "doc_gia_co_tich";
  assert.strictEqual(E.canonicalHiddenProfessionId(state), "doc_gia_co_tich");
  state.professionState.secondaryId = "doc_gia_co_tich";
  assert(sandbox.window.GameExpansion.validateProfessionNamespace(state).ok);
  state.professionState.primaryId = "doc_gia_co_tich";
  assert(!sandbox.window.GameExpansion.validateProfessionNamespace(state).ok, "hidden profession cannot occupy primary slot");
}

function testTechniqueResonanceAndReplayFloor() {
  const state = makeState();
  const id = "kiem_khi_so_cap", technique = E.techniqueCatalog()[id];
  state.player.pathId = "kiem_dao";
  state.player.techniques[id] = { masteryExp: 0, masteryStage: 0, usageCount: 0 };
  const fate = sandbox.window.GameData.FATE_PATTERNS.find((entry) => E.fatePathAffinity(entry).lead.includes("kiem_dao") || E.fatePathAffinity(entry).support.includes("kiem_dao"));
  assert(fate, "catalog includes path-affinity Fate for resonance coverage");
  state.player.fates = [fate.id, fate.id];
  state.guildMembership = { guildId: "thien_huyen_tong", rankId: "disciple", status: "active" };
  state.flags.activeFormation = { techniqueId: "huyen_mon_tran_giai", sourceGuildId: "thien_huyen_tong", untilTurn: state.meta.turn + 3 };
  assert.strictEqual(sandbox.window.GameExpansion.guildTechniqueCombatBonus(state, technique).powerPct, 5, "guild taught active formation grants capped combat support at disciple rank");
  state.guildMembership.suspended = true;
  assert.strictEqual(sandbox.window.GameExpansion.guildTechniqueCombatBonus(state, technique).powerPct, 0, "suspended membership loses formation support");
  state.guildMembership.suspended = false;
  state.flags.activeFormation.sourceGuildId = "other_guild";
  assert.strictEqual(sandbox.window.GameExpansion.guildTechniqueCombatBonus(state, technique).powerPct, 0, "formation from another guild grants no support");
  state.flags.activeFormation.sourceGuildId = "thien_huyen_tong";
  state.flags.activeFormation.untilTurn = state.meta.turn - 1;
  assert.strictEqual(sandbox.window.GameExpansion.guildTechniqueCombatBonus(state, technique).powerPct, 0, "expired formation grants no support");
  state.flags.activeFormation.untilTurn = state.meta.turn + 3;
  const preview = E.techniquePreview(state, id);
  assert(preview.success && preview.pathResonanceFates.includes(fate.id), "path resonance includes active matching Fate");
  assert.strictEqual(preview.guildCombatPowerPct, 5, "preview includes active guild formation bonus");
  assert(preview.fateResonancePct <= 1, "duplicate Fate IDs only count once");
  state.player.suppressedFates ||= {};
  state.player.suppressedFates[fate.id] = { untilTurn: state.meta.turn + 10 };
  assert(!E.techniquePreview(state, id).pathResonanceFates.includes(fate.id), "suppressed Fate cannot grant path resonance");
  delete state.player.suppressedFates[fate.id];
  const first = E.useTechnique(state, id, { actionId: "technique-ui:1", confirmed: true });
  assert(first.success, "first sequenced cast resolves");
  const qiAfter = state.player.qi;
  delete state.player.techniqueActionReceipts["technique-ui:1"];
  const replay = E.useTechnique(state, id, { actionId: "technique-ui:1", confirmed: true });
  assert(!replay.success && replay.duplicate && state.player.qi === qiAfter, "evicted cast receipt cannot be replayed after save/load-style ledger loss");
}

function testWorldEventRewardReplayBoundary() {
  const state = makeState();
  const regionId = E.locationForState(state, state.locationId)?.region || "trung_vuc";
  const started = sandbox.window.GameExpansion.startWorldEvent(state, "huyet_nguyet", regionId, E.gameDayOrdinal(state));
  assert(started.success, "world-event fixture starts in the player region");
  const relief = sandbox.window.EXPANSION_DATA.worldEvents.find((entry) => entry.id === "huyet_nguyet").choices.find((entry) => entry.id === "relief");
  const priorItemCost = relief.itemCost; relief.itemCost = { linh_thach: 2 }; state.inventory.linh_thach = 10;
  const first = sandbox.window.GameExpansion.resolveWorldEventChoice(state, started.event.id, "relief");
  assert(first.success, "world-event choice commits");
  const merit = Number(state.player.merit || 0), contribution = started.event.playerContribution;
  const itemCount = Number(state.inventory.linh_thach || 0);
  started.event.choiceHistory = [];
  const replay = sandbox.window.GameExpansion.resolveWorldEventChoice(state, started.event.id, "relief");
  assert(!replay.success && replay.duplicate && Number(state.player.merit || 0) === merit && started.event.playerContribution === contribution && Number(state.inventory.linh_thach || 0) === itemCount, "reward receipt blocks replay without a second item-cost deduction even if choice-history marker is absent");
  if (priorItemCost === undefined) delete relief.itemCost; else relief.itemCost = priorItemCost;
}

testTechniqueResonanceAndReplayFloor();
testWorldEventRewardReplayBoundary();
testMapCanonical();
testInfluenceOfflineAndInvalidation();
testStructureOwnershipLifecycle();
testDiscoveryAndNpcReplay();
testOnlineFateRewardLedger();
testTaintedRewardLedger();
testActorHistoryOfflineProjection();
testNodeHistoryProjection();
testLegacyLogRoundTrip();
testActionPriority();
testSafeActionDoesNotAdvanceTurn();
testCombatTranscriptReplay();
testDiscoveryReplay();
testCharacterCreationReplayBoundary();
testCatalogRecipeAndRewardIdempotency();
testQuestRewardCanonicalIdempotency();
testRelationshipDimensions();
testContestedAndHiddenRealmTransitions();
testFateNoDecayAcrossLongDays();
testUnresolvedDesignPoliciesAreCanonical();
testPerformanceProfiles();
testProgressionNamespaces();
testProfessionLegacyNamespaceMigration();
testMultiVersionMigrationFixtures();
testWeatherCatalogTransitions();
testWarCascadeAndOfflineDeterminism();
testTravelPreviewCommitParity();
testNpcRumorMultiNodeExpiry();
testFactionBulletinProjection();
testNpcCongestionQueue();
testCompanionMutationSaveInvariant();
testFateEvolutionPreviewCommitInvariant();
testFateAdvancedActionNamespace();
testExplicitSecondaryPathTransition();
testProfessionCanonicalReadBoundary();
console.log("OK: review batches canonical map, structure lifecycle, discovery state, NPC replay and legacy log round-trip");
