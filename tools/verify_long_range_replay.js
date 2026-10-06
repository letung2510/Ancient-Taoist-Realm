"use strict";

const assert = require("assert");
const { loadBrowserGame } = require("./verify_game");

const sandbox = loadBrowserGame();
const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;

function make() {
  const state = E.createState({ character: E.createCharacter({ name: "Replay QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  state.meta.saveId = "long-range-replay-save";
  state.worldSimulation.seed = "long-range-replay-seed";
  X.ensureExpansionState(state);
  return state;
}

function branchSnapshot(state) {
  return JSON.stringify({
    wars: state.worldSimulation.wars,
    hiddenRealms: state.worldSimulation.hiddenRealms,
    auction: state.auction,
    opportunity: state.pendingContestedOpportunity,
    rewardLedger: state.rewardLedger,
    lastProcessedDay: state.worldSimulation.lastProcessedDay
  });
}

function run() {
  ["simulateWorldUntil", "refreshAuction", "createContestedOpportunity", "resolveContestedOpportunity", "hiddenRealmEnter", "participateWar"].forEach((name) => {
    assert.strictEqual(typeof X[name], "function", `missing replay surface: ${name}`);
  });
  const a = make();
  const b = make();
  const factionIds = Object.keys(a.worldSimulation.factionState).slice(0, 2);
  assert.strictEqual(factionIds.length, 2, "replay fixture needs two factions");
  [a, b].forEach((state) => {
    state.guildMembership = { guildId: factionIds[0] };
    state.worldSimulation.wars.qa_war = {
      id: "qa_war", factionA: factionIds[0], factionB: factionIds[1], startedDay: 1,
      frontNodeIds: [state.locationId], scoreA: 0, scoreB: 0, status: "active", playerInterventions: []
    };
  });
  assert(X.participateWar(a, "qa_war").success);
  assert(X.participateWar(b, "qa_war").success);
  [a, b].forEach((state) => {
    X.createContestedOpportunity(state);
    assert(X.resolveContestedOpportunity(state, "share").success);
    X.refreshAuction(state, E.gameDayOrdinal(state));
    state.inventory.linh_thach = 100;
    const lotId = Object.keys(state.auction.lots)[0];
    const bid = X.bidAuction(state, lotId, Number(state.auction.lots[lotId].currentBid) + 5);
    assert(bid.success, bid.reason || "auction bid fixture failed");
    const realm = sandbox.window.EXPANSION_DATA.hiddenRealms[0];
    state.locationId = realm.parentNodeId;
    state.worldSimulation.hiddenRealms[realm.id].status = "open";
    state.worldSimulation.hiddenRealms[realm.id].opensDay = 0;
    state.worldSimulation.hiddenRealms[realm.id].closesDay = E.gameDayOrdinal(state) + 10000;
    assert(X.hiddenRealmEnter(state, realm.id).success);
    state.locationId = state.activeHiddenRealm.coreNodeId;
    const claimed = X.claimHiddenRealmCore(state);
    assert(claimed, JSON.stringify({ claimed, active: state.activeHiddenRealm, runtime: state.worldSimulation.hiddenRealms[realm.id], locationId: state.locationId, rewardKeys: Object.keys(state.rewardLedger) }));
    assert(X.exitHiddenRealm(state).success);
  });
  const target = E.gameDayOrdinal(a) + 1000;
  const resultA = E.simulateWorldUntil(a, target, { offline: true, exactParity: true });
  const resultB = E.simulateWorldUntil(b, target, { offline: true, exactParity: true });
  assert.strictEqual(resultA.processed, 1000);
  assert.strictEqual(resultB.processed, 1000);
  assert.strictEqual(branchSnapshot(a), branchSnapshot(b), "long-range branch replay diverged");
  assert(X.validateAuctionState(a).ok);
  assert(X.validateHiddenRealmRuntimeState(a).ok);
  assert(X.validateWarState(a).ok);
  return { days: 1000, wars: Object.keys(a.worldSimulation.wars).length, hiddenRealms: Object.keys(a.worldSimulation.hiddenRealms).length, auctionLots: Object.keys(a.auction.lots).length };
}

if (require.main === module) console.log(`OK: long-range replay ${JSON.stringify(run())}`);
module.exports = { run };
