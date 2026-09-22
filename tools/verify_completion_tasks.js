"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
[
  "gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js",
  "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js",
  "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js",
  "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));

const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;
const makeState = () => {
  const state = E.createState({ character: E.createCharacter({ name: "Completion QA", archetypeId: "kiem_tong", fates: E.drawInitialFates(), startRegionId: "trung_vuc" }) });
  const journey = E.chooseJourneyIntent(state, "tu_lap");
  if (!journey.success && !state.flags?.journeyIntentResolved) throw new Error("journey fixture setup failed: " + JSON.stringify(journey));
  X.ensureExpansionState(state);
  return state;
};

function namespaceMigration() {
  const state = makeState();
  state.pathState.schemaVersion = 1;
  state.professionState.schemaVersion = 1;
  state.specialPhysiqueState.schemaVersion = 1;
  state.player.pathId = state.pathState.primaryPathId;
  X.ensureExpansionState(state);
  assert.strictEqual(state.pathState.schemaVersion, 2);
  assert.strictEqual(state.professionState.schemaVersion, 2);
  assert.strictEqual(state.specialPhysiqueState.schemaVersion, 2);
  assert(X.validateCanonicalNamespaces(state).ok);
}

function actionPriority() {
  const state = makeState();
  state.pendingExploration = { id: "qa-search", locationId: state.locationId, findings: [{ type: "resource" }], createdTurn: state.meta.turn };
  const ids = E.contextState(state).actions.map((action) => action.id);
  assert(ids.includes("act_search_collect"));
  assert(!ids.includes("act_tu_luyen"));
  assert(!ids.some((id) => id.startsWith("act_move_")));
  state.pendingSearch = { locationId: state.locationId, findings: [{ type: "information", label: "same-node" }] };
  state.pendingExploration = { locationId: state.locationId, findings: [{ type: "resource", itemId: "linh_thach", qty: 1 }] };
  const canonical = E.pendingExplorationAt(state);
  assert.strictEqual(state.pendingSearch, state.pendingExploration);
  assert.strictEqual(canonical.findings.length, 2);
}

function searchActionLifecycle() {
  const state = makeState();
  state.pendingSearch = { locationId: state.locationId, session: 1, findings: [{ type: "resource", itemId: "linh_thach", qty: 1, label: "Linh Thạch Hạ Phẩm ×1" }], createdAtTurn: state.meta.turn };
  X.ensureExpansionState(state);
  E.contextState(state);
  const collected = E.submitActionId(state, "act_search_collect");
  assert(collected?.success, "collect action did not resolve");
  assert.strictEqual(state.pendingSearch, null);
  assert.strictEqual(state.pendingExploration, null);
  state.pendingSearch = { locationId: state.locationId, session: 2, findings: [{ type: "information", label: "Dấu vết" }], createdAtTurn: state.meta.turn };
  state.pendingExploration = state.pendingSearch;
  const left = E.submitActionId(state, "act_search_leave");
  assert(left?.success, "leave action did not resolve");
  assert.strictEqual(state.pendingSearch, null);
  assert.strictEqual(state.pendingExploration, null);
}

function expansionModalCommands() {
  const state = makeState();
  const opportunity = X.createContestedOpportunity(state);
  assert(opportunity?.choices?.share, "contested opportunity fixture did not open");
  const opportunityResult = X.runExpansionCommand(state, "opportunity", "share");
  assert(opportunityResult?.success && !state.pendingContestedOpportunity, "opportunity choice did not resolve");

  const event = X.rollMapEvent(state, "first_discovery");
  assert(event?.choices?.length, "hidden discovery fixture did not open");
  const eventResult = X.runExpansionCommand(state, "map_event", event.choices[0].id);
  assert(eventResult?.success && !state.pendingMapEvent, "hidden discovery choice did not resolve");
}

function nodeNameMigration() {
  const state = makeState();
  const moved = E.move(state, "bac");
  assert(moved !== false && state.openWorld.nodes[state.locationId], "procedural node fixture did not open");
  state.openWorld.nodes[state.locationId].name = "Dã Lộ Vô Danh · 48,76";
  E.locationExits(state);
  assert(!/[·•]\s*-?\d+\s*[,，]\s*-?\d+\s*$/.test(state.openWorld.nodes[state.locationId].name), "legacy Oxy suffix survived node migration");
}

function movementDiscoveryActions() {
  const state = makeState();
  const before = E.contextState(state).actions.map((action) => action.id);
  assert(["bac", "nam", "dong", "tay"].every((dir) => before.includes("act_move_" + dir)), "cardinal movement panel is incomplete");
  assert(!before.some((id) => id.startsWith("act_explore_")), "legacy exploration actions leaked into the panel");
  const origin = state.locationId;
  const result = E.submitActionId(state, "act_move_bac");
  assert(result !== false && state.locationId !== origin && state.openWorld.nodes[state.locationId], "exploration action did not materialize and enter node");
  const after = E.moveActions(state).map((action) => action.id);
  assert(after.includes("act_move_nam"), "materialized reciprocal edge did not become a move action");
  assert(E.moveActions(state).find((action) => action.id === "act_move_nam")?.label.includes("Tr\u1edf v\u1ec1 Nam"), "reverse movement did not become a return action");
}

function npcDialogueLifecycle() {
  const state = makeState();
  const npcId = Object.keys(state.worldSimulation.npcState)[0];
  const npc = state.worldSimulation.npcState[npcId];
  npc.currentNodeId = state.locationId;
  npc.currentSubLocationId = state.currentSubLocationId;
  assert(X.npcDialogueAction(state, npcId, "offer").success);
  assert(X.npcDialogueAction(state, npcId, "accept").success);
  assert.strictEqual(state.dialogueState.phase, "PROGRESS");
  assert(X.npcDialogueAction(state, npcId, "progress").success);
  assert(X.npcDialogueAction(state, npcId, "turn_in").success);
  assert(state.questState.completed["npc_quest_" + npcId]);
}

function npcHourlyRoutineAndOrganizationProgression() {
  const state = makeState();
  X.ensureNpcWorldState(state);
  const npc = Object.values(state.worldSimulation.npcState)[0];
  const node = sandbox.window.GameData.LOCATIONS[state.locationId];
  state.currentSubLocationId = node.subLocations?.[0]?.id || "main";
  npc.currentNodeId = state.locationId;
  npc.currentSubLocationId = state.currentSubLocationId;
  npc.dailyRoutine = [{ hourStart: 0, hourEnd: 6, subLocationId: state.currentSubLocationId, activity: "ngu" }];
  state.relationships[npc.npcId] = { schemaVersion: 2, trust: 20, fear: 0, respect: 10, suspicion: 0, affection: 30, loyalty: 20, score: 30, decayPolicy: "event_only" };
  state.gameClock.dayProgress = 16 / 24;
  assert(X.npcActionPresentation(state, npc.npcId).sleeping, "NPC hourly routine must expose wake action while asleep");
  assert(X.npcTalk(state, npc.npcId).success, "wake action should resolve against a sleeping NPC");
  assert.strictEqual(state.relationships[npc.npcId].affection, 27, "disturbing an NPC's sleep should reduce affection without conflating trust/respect");
  assert(X.validateRelationshipPolicy(state).ok);

  const mapOrganizations = sandbox.window.GameData.WORLD_MAP.addresses.organizations || [];
  const guildAddress = mapOrganizations.find((address) => sandbox.window.GameData.GUILDS.some((guild) => guild.id === address.refId));
  assert(guildAddress, "test fixture needs an addressed guild");
  const guildId = guildAddress.refId;
  state.locationId = guildAddress.nodeId;
  state.currentSubLocationId = sandbox.window.GameData.LOCATIONS[state.locationId].subLocations?.[0]?.id || "main";
  X.ensureOrganizationState(state);
  state.guildMembership = { guildId, rank: "Ngoại Môn", rankId: "outer", rankIndex: 0, contribution: 100 };
  state.player.realmId = "hoa_than";
  state.player.aptitude = 100; state.player.comprehension = 100; state.player.daoTam = 100;
  state.organizationState.relations[guildId].reputation = 30;
  assert(X.guildPromotionStatus(state).eligible, "qualified member should be promotable");
  assert(X.promoteGuildMember(state).success);
  assert.strictEqual(state.guildMembership.rankId, "inner");

  const common = X.organizationInteract(state, guildId, "commission");
  assert(common.success);
  const commonRequest = Object.values(state.organizationState.activeRequests).find((request) => request.tier === "common");
  for (let index = 0; index < commonRequest.targetProgress; index += 1) { state.meta.turn += 1; X.advanceOrganizationCommissions(state, index % 2 ? "act_search_collect" : "act_move_bac"); }
  assert.strictEqual(commonRequest.status, "ready", "qualifying actions should advance the commission lifecycle");
  assert(X.resolveOrganizationCommission(state, commonRequest.id).success, "completed commission must be claimable");
  assert.strictEqual(commonRequest.status, "resolved");

  const special = X.organizationInteract(state, guildId, "commission_special");
  assert(special.success);
  const specialRequest = Object.values(state.organizationState.activeRequests).find((request) => request.tier === "special");
  for (let index = 0; index < specialRequest.targetProgress; index += 1) { state.meta.turn += 1; X.advanceOrganizationCommissions(state, "act_search_collect"); }
  assert(X.resolveOrganizationCommission(state, specialRequest.id).success);
  const receipt = state.rewardLedger["organization-commission:" + specialRequest.id];
  assert(receipt && (receipt.fates.length || receipt.techniques.length), "special commission must grant a real fate or technique");
  assert(X.validateOrganizationState(state).ok, "commission lifecycle state must validate");
}

function companionCombatAndOffline() {
  const state = makeState();
  const enemyId = Object.keys(E.entityCatalog()).find((id) => E.combatEntity(state, id)?.hpMax > 0);
  assert(enemyId, "fixture needs a combat entity");
  state.enemies = { [enemyId]: E.combatEntity(state, enemyId).hpMax * 10 };
  state.companion = { entityId: enemyId, customName: "QA Companion", state: "active", hp: 20, hpMax: 20, loyalty: 80, role: "striker" };
  X.ensureExpansionState(state);
  const before = state.enemies[enemyId];
  const skill = X.useCompanionSkill(state);
  if (!skill.success) throw new Error(JSON.stringify({ skill, enemyId, enemies: state.enemies, entity: E.combatEntity(state, enemyId) }));
  assert(state.enemies[enemyId] < before);
  const day = X.gameDayOrdinal(state) + 1;
  X.simulateWorldUntil(state, day, { offline: true });
  assert.strictEqual(state.companion.lastOfflineCombatDay, day);
  assert(X.validateCompanionState(state).ok);
}

function npcRelationshipAndLifecycleExpansion() {
  const state = makeState();
  const npcId = Object.keys(state.worldSimulation.npcState)[0], npc = state.worldSimulation.npcState[npcId];
  npc.currentNodeId = state.locationId; npc.currentSubLocationId = state.currentSubLocationId;
  npc.preferences = ["currency"];
  E.addItem(state, "linh_thach", 1);
  const before = Number(state.inventory.linh_thach || 0);
  assert(X.giftNpc(state, npcId, "linh_thach").success);
  assert.strictEqual(Number(state.inventory.linh_thach || 0), before - 1);
  assert.strictEqual(state.relationships[npcId].affection, 8, "matching gift should improve affection, independently of trust");
  state.player.corruptionRating = 80; state.player.realmLevel = 20; npc.realmIndex = 0;
  assert(X.intimidateNpc(state, npcId).success);
  assert.strictEqual(state.relationships[npcId].trust, 0, "intimidation should permanently sever trust");
  X.recordRelationshipEvent(state, npcId, "saved", { uniqueKey: "post-intimidation-rescue" });
  assert.strictEqual(state.relationships[npcId].affection, 0, "later positive events must not restore affection after permanent coercion");

  npc.isImportant = true;
  const trial = X.beginTrustTrial(state, npcId);
  assert(trial.success && X.resolveTrustTrial(state, npcId, true).success);
  const rumorKey = "qa-rumor";
  assert(X.publishPlayerRumor(state, rumorKey, "Một việc lớn đã xảy ra."));
  assert(!X.publishPlayerRumor(state, rumorKey, "duplicate"), "rumor publication must be idempotent");
  assert(Object.values(state.worldSimulation.npcState).some((entry) => entry.rumorLedger?.[rumorKey]));

  npc.isImportant = true; state.relationships[npcId].trust = 90; state.relationships[npcId].respect = 90; delete state.npcTrustTrials[npcId];
  const anchorBlocked = E.establishHumanAnchor(state, npcId);
  assert(anchorBlocked.trialRequired && state.npcTrustTrials[npcId]?.status === "active", "important NPC anchor should require a trust trial first");

  state.relationships[npcId].trust = 90; npc.corruptionTolerance = 1;
  X.updateNpcBetrayals(state, X.gameDayOrdinal(state) + 1);
  assert.strictEqual(npc.betrayalWarning?.status, "warning", "betrayal must signal one day before resolution");
  X.updateNpcBetrayals(state, npc.betrayalWarning.resolvesDay);
  assert(npc.hostileToPlayer, "warning must resolve to a conditional betrayal");
}

function mapAndOrganizationRemainders() {
  const state = makeState();
  const eventTemplate = sandbox.window.EXPANSION_DATA.worldEvents[0];
  const eventResult = X.startWorldEvent(state, eventTemplate.id, X.weatherSnapshot(state).regionId);
  assert(eventResult.success, "world event fixture should start");
  const seer = Object.values(state.worldSimulation.npcState).find((npc) => npc.eventId === eventResult.event.id);
  assert(seer && seer.role === "thầy bói" && seer.status === "alive", "event omen should bring a traveling seer into the region");
  const orgAddress = sandbox.window.GameData.WORLD_MAP.addresses.organizations.find((address) => sandbox.window.GameData.GUILDS.some((guild) => guild.id === address.refId));
  assert(orgAddress);
  state.locationId = orgAddress.nodeId; state.currentSubLocationId = sandbox.window.GameData.LOCATIONS[state.locationId].subLocations?.[0]?.id || "main";
  const guildId = orgAddress.refId;
  state.guildMembership = { guildId, rankId: "disciple", rankIndex: 2, rank: "Chân Truyền Đệ Tử", contribution: 500 };
  const vault = X.guildVaultSnapshot(state, guildId);
  assert(vault.unlocked && vault.techniques.length > 0, "rank-gated vault should expose exclusive techniques at disciple rank");
  assert(X.resolveLoyaltyTest(state, guildId, "start").success);
  assert.strictEqual(X.resolveLoyaltyTest(state, guildId, "investigate").phase, "decision");
  assert.strictEqual(X.resolveLoyaltyTest(state, guildId, "spare").status, "passed");

  const tournamentDay = X.gameDayOrdinal(state);
  state.worldSimulation.tournament = { id: "qa_tournament", startDay: tournamentDay, registrationEndDay: tournamentDay + 3, endDay: tournamentDay + 10, status: "registration", joined: false };
  assert(X.joinTournament(state).success, "eligible member should be able to register for the bracket");
  X.simulateWorldUntil(state, tournamentDay + 4);
  assert.strictEqual(state.worldSimulation.tournament.status, "in_progress", "registered entrant should advance into the first round after registration closes");
  const firstRound = X.resolveTournamentRound(state, "read");
  assert(firstRound.success && ["in_progress", "eliminated"].includes(firstRound.status), "round action should resolve exactly one bracket round");
  assert(X.validateTournamentState(state).ok, JSON.stringify(X.validateTournamentState(state)));

  const npcId = Object.keys(state.worldSimulation.npcState)[0], npc = state.worldSimulation.npcState[npcId];
  npc.status = "alive"; npc.role = "Trưởng Lão"; npc.currentNodeId = state.locationId; npc.currentSubLocationId = state.currentSubLocationId;
  npc.age = 120; npc.maxLifespan = 120; npc.masterNpcId = null;
  X.resolveNpcSuccession(state, npc, 360);
  assert.strictEqual(npc.status, "deceased");
  assert(state.worldSimulation.vacantRoles[npcId] || Object.values(state.worldSimulation.npcState).some((candidate) => candidate.successorOf === npcId));
}

function organizationDiplomacyAndDefection() {
  const state = makeState(); X.ensureOrganizationState(state);
  const factions = sandbox.window.GameData.WORLD_MAP.factions.slice(0, 2).map((entry) => entry.id);
  assert.strictEqual(factions.length, 2);
  factions.forEach((id) => { state.organizationState.relations[id].reputation = 60; });
  const pair = factions.slice().sort().join("::");
  state.worldSimulation.diplomacy[pair] = { tension: 80, status: "thu_dich" };
  state.player.reputation = 100; state.player.daoTam = 100; state.player.daoHeart = 100;
  assert(X.resolveAllianceMediation(state, factions[0], factions[1]).success, "qualified mediator should reduce high faction tension");
  assert(!X.resolveAllianceMediation(state, factions[0], factions[1]).success, "mediation should be a one-time attempt per faction pair");

  const guildAddress = sandbox.window.GameData.WORLD_MAP.addresses.organizations.find((address) => sandbox.window.GameData.GUILDS.some((guild) => guild.id === address.refId));
  state.locationId = guildAddress.nodeId; state.currentSubLocationId = sandbox.window.GameData.LOCATIONS[state.locationId].subLocations?.[0]?.id || "main";
  const guildId = guildAddress.refId;
  state.guildMembership = { guildId, rankId: "outer", rankIndex: 0, rank: "Ngoại Môn", contribution: 1000 };
  state.player.merit = 1000;
  const anchorNpc = Object.values(state.worldSimulation.npcState)[0]; anchorNpc.factionId = guildId;
  const threatenedAnchor = { id: "anchor-defection-test", npcId: anchorNpc.npcId, stability: 50, broken: false, integrity: "intact" };
  state.player.anchors = [threatenedAnchor];
  const warning = X.resolveOrganizationDefection(state, guildId);
  assert(warning.success && warning.warning && warning.anchorRisk.length, "defection requires explicit warning about human-anchor consequences");
  const confirmed = X.resolveOrganizationDefection(state, guildId);
  assert(confirmed.success && confirmed.defectedFrom === guildId);
  assert(threatenedAnchor.broken, "confirming defection must realize the warned human-anchor risk");
  assert(state.guildPursuit?.source === "defection", "defection should create a sourced pursuit record");
  assert(Object.values(state.worldSimulation.npcState).some((npc) => npc.source === "defection" && npc.targetPlayerId === state.player.id), "defection should create a pursuer actor");
  X.simulateWorldUntil(state, X.gameDayOrdinal(state) + 1);
  assert.strictEqual(state.pendingNpcPursuit?.status, "pending", "pursuer reaching the player should open a blocking encounter");
  const pursuitActions = E.contextState(state).actions.map((action) => action.id);
  assert(pursuitActions.includes("act_exp_pursuit_appease"), "encounter must expose the explicit resolution choices");
  assert(E.submitActionId(state, "act_exp_pursuit_appease")?.success, "paying the defection settlement should resolve the encounter");
  assert.strictEqual(state.pendingNpcPursuit.status, "resolved");
}

function npcMapAndPoliticsSimulation() {
  const seasonalTagSets = [["spring_trade", "trade_hub"], ["summer_market", "event_market", "event_gathering"], ["autumn_harvest", "trade_hub"], ["winter_market", "winter_supply", "winter_shelter"]];
  seasonalTagSets.forEach((tags) => assert(X.seasonalDestinationSnapshot(tags).length > 0, "every season should have catalog-driven destination nodes: " + tags.join(",")));
  const trailState = makeState(), trailNpc = Object.values(trailState.worldSimulation.npcState)[0];
  const sourceId = Object.keys(sandbox.window.GameData.LOCATIONS).find((id) => Object.values(sandbox.window.GameData.LOCATIONS[id].exits || {}).some((target) => sandbox.window.GameData.LOCATIONS[target]));
  const source = sandbox.window.GameData.LOCATIONS[sourceId], destination = Object.values(source.exits).find((id) => sandbox.window.GameData.LOCATIONS[id]);
  const trailDay = X.gameDayOrdinal(trailState) + 1;
  trailState.locationId = sourceId; trailNpc.currentNodeId = sourceId; trailNpc.scheduleType = "patrol"; trailNpc.nextMoveDay = trailDay;
  trailNpc.shelterState = { inShelter: false, exitAfterDay: 0, lastTransitionDay: 0 };
  Object.values(trailState.worldSimulation.regionState).forEach((entry) => { entry.weather = "quang"; entry.weatherUntilDay = trailDay + 10; });
  const region = source.region || sandbox.window.GameData.WORLD_MAP.locations[sourceId]?.region;
  if (region) { trailState.worldSimulation.regionState[region].weather = "quang"; trailState.worldSimulation.regionState[region].weatherUntilDay = trailDay + 10; }
  X.updateNpcSchedules(trailState, trailDay);
  const footprint = trailState.worldSimulation.npcFootprints?.[sourceId]?.find((entry) => entry.npcId === trailNpc.npcId);
  assert(footprint && footprint.destinationHint === trailNpc.currentNodeId && footprint.departedDay === trailDay, "NPC movement should leave a location-scoped trace");

  const growthState = makeState(), itinerant = Object.values(growthState.worldSimulation.npcState)[0];
  const candidatePairs = Object.entries(sandbox.window.GameData.LOCATIONS).flatMap(([from, node]) => Object.values(node.exits || {}).filter((to) => sandbox.window.GameData.LOCATIONS[to] && !sandbox.window.GameData.LOCATIONS[to].organizationId).map((to) => [from, to]));
  let settlementPair;
  for (let seedIndex = 0; seedIndex < 100 && !settlementPair; seedIndex += 1) {
    growthState.worldSimulation.seed = "settlement-qa-" + seedIndex;
    settlementPair = candidatePairs.find(([, to]) => X.worldRandom(growthState, "settlement:" + itinerant.npcId + ":" + to) < 0.2);
  }
  assert(settlementPair, "test fixture needs an unowned settlement route with a passing deterministic roll");
  const [from, to] = settlementPair, growthDay = X.gameDayOrdinal(growthState) + 1;
  growthState.locationId = from; itinerant.currentNodeId = from; itinerant.scheduleType = "itinerant"; itinerant.nextMoveDay = growthDay; itinerant.migrationTargetNodeId = to; itinerant.nodeVisits = { [to]: 7 };
  itinerant.shelterState = { inShelter: false, exitAfterDay: 0, lastTransitionDay: 0 };
  Object.values(growthState.worldSimulation.regionState).forEach((entry) => { entry.weather = "quang"; entry.weatherUntilDay = growthDay + 10; });
  const growthRegion = sandbox.window.GameData.LOCATIONS[from].region || sandbox.window.GameData.WORLD_MAP.locations[from]?.region;
  if (growthRegion) { growthState.worldSimulation.regionState[growthRegion].weather = "quang"; growthState.worldSimulation.regionState[growthRegion].weatherUntilDay = growthDay + 10; }
  X.updateNpcSchedules(growthState, growthDay);
  assert(growthState.worldSimulation.settlements?.[to], "eighth itinerant visit with the seeded growth roll should found a settlement: " + JSON.stringify({ npc: itinerant, from, to, roll: X.worldRandom(growthState, "settlement:" + itinerant.npcId + ":" + to), node: X.mapNode(growthState, to) }));

  const politicsState = makeState(), factionId = sandbox.window.GameData.WORLD_MAP.factions[0].id;
  const factionAddress = sandbox.window.GameData.WORLD_MAP.addresses.factions.find((address) => address.refId === factionId);
  assert(factionAddress, "political crisis fixture needs an addressed faction");
  politicsState.locationId = factionAddress.nodeId;
  const elders = Object.values(politicsState.worldSimulation.npcState).slice(0, 2);
  elders.forEach((npc) => { npc.factionId = factionId; npc.role = "Trưởng Lão"; npc.age = 95; npc.birthAge = 95; npc.birthDay = 1; npc.maxLifespan = 100; });
  politicsState.guildMembership = { guildId: factionId, rankId: "elder", rankIndex: 3, rank: "Trưởng Lão", contribution: 1000 };
  X.updateFactionInternalEvents(politicsState, 30);
  assert(politicsState.worldSimulation.factionState[factionId].successionCrisis?.status === "active", "near-end-of-life elders should open an internal succession crisis");
  assert(E.expansionActions(politicsState).some((action) => action.id.startsWith("act_exp_org_politics:")), "elder-ranked player should receive a faction-succession choice");
}

function weatherShelter() {
  const state = makeState();
  const regionId = X.weatherSnapshot(state).regionId;
  X.setWeather(state, regionId, "tuyet", 2);
  const npcId = Object.keys(state.worldSimulation.npcState)[0];
  const npc = state.worldSimulation.npcState[npcId];
  npc.currentNodeId = state.locationId;
  X.simulateWorldUntil(state, X.gameDayOrdinal(state) + 1, { offline: true });
  assert.strictEqual(npc.shelterState.inShelter, true);
  assert.strictEqual(npc.aiState, "shelter");
  assert(X.validateNpcScheduler(state).ok);
}

function hiddenProfessionContent() {
  const expected = ["cuong_ngon_gia", "thuc_canh_su", "huyen_anh_su", "vong_nga_su"];
  expected.forEach((id) => {
    const definition = sandbox.window.EXPANSION_DATA.hiddenProfessions[id];
    assert(definition && definition.kind === "tu_tich", "missing Từ Tích profession: " + id);
    assert(definition.linkedTaThanId && definition.failPolicy, "incomplete Từ Tích definition: " + id);
  });
}

function contentAndLargeSave() {
  const endings = sandbox.window.GameData.ENDINGS;
  ["truth", "escape", "succumb", "reincarnation", "godhood"].forEach((id) => {
    const ending = endings[id];
    assert(ending && ending.id === id && ending.title && ending.text && ["good", "neutral", "bad"].includes(ending.tone), "incomplete ending: " + id);
  });
  const pathAudit = X.validatePathFusionCatalog();
  assert(pathAudit.ok && pathAudit.pairCount >= 2, "path fusion content is incomplete");

  const state = makeState();
  state.history ||= [];
  for (let index = 0; index < 1500; index += 1) state.history.push({ type: "narr", text: "large-save-fixture-" + index, day: 1 + (index % 30) });
  const companionEntityId = Object.keys(E.entityCatalog()).find((id) => E.combatEntity(state, id)?.hpMax > 0);
  state.companion = { entityId: companionEntityId, customName: "QA Companion", state: "active", hp: 20, hpMax: 20, loyalty: 80, role: "striker" };
  X.ensureExpansionState(state);
  const encoded = E.serialize(state);
  assert(encoded.length < 8 * 1024 * 1024, "large save exceeds 8MB budget");
  const started = process.hrtime.bigint();
  const restored = E.deserialize(encoded);
  X.simulateWorldUntil(restored, X.gameDayOrdinal(restored) + 30, { offline: true });
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  assert(elapsedMs < 15000, "large save/offline simulation exceeds 15s budget: " + elapsedMs.toFixed(1) + "ms");
  assert(X.validateExpansionState(restored).valid, "large save/offline restore invalid");
}

namespaceMigration();
actionPriority();
searchActionLifecycle();
expansionModalCommands();
nodeNameMigration();
movementDiscoveryActions();
npcDialogueLifecycle();
npcHourlyRoutineAndOrganizationProgression();
npcRelationshipAndLifecycleExpansion();
mapAndOrganizationRemainders();
organizationDiplomacyAndDefection();
npcMapAndPoliticsSimulation();
companionCombatAndOffline();
weatherShelter();
hiddenProfessionContent();
contentAndLargeSave();
console.log("OK: namespace migration, action priority, NPC dialogue, companion combat/offline and weather shelter");
