"use strict";

const assert = require("assert");
const { loadBrowserGame } = require("./verify_game");

function main() {
  const sandbox = loadBrowserGame();
  const E = sandbox.window.GameEngine;
  const X = sandbox.window.GameExpansion;
  const neutralCharacter = E.createCharacter({ name: "Origin neutral", archetypeId: "kiem_tong", journeyIntent: "tam_su", fates: E.drawInitialFates() });
  assert.strictEqual(neutralCharacter.originNode.id, "trung_vuc_tan_thu_thon", "origin default must use an independent beginner village");
  const independentCharacter = E.createCharacter({ name: "Origin independent", archetypeId: "kiem_tong", journeyIntent: "tu_lap", fates: E.drawInitialFates() });
  assert(independentCharacter.originNode.kind === "village", "tu_lap prefers an independent beginner village");
  const explicitCharacter = E.createCharacter({ name: "Origin explicit", archetypeId: "kiem_tong", originNodeId: "trung_vuc_phuong_thi", journeyIntent: "quy_tong", fates: E.drawInitialFates() });
  assert.strictEqual(explicitCharacter.originNode.id, "trung_vuc_phuong_thi", "valid explicit independent origin node is preserved");
  const rejectedSectOrigin = E.createCharacter({ name: "Origin rejected", archetypeId: "kiem_tong", originNodeId: "trung_vuc_truyen_phap", journeyIntent: "quy_tong", fates: E.drawInitialFates() });
  assert.notStrictEqual(rejectedSectOrigin.originNode.id, "trung_vuc_truyen_phap", "sect origin must never be a new character origin");
  ["trung_vuc", "dong_hoang", "tay_mac", "nam_chuong", "bac_nguyen", "vo_tan_hai", "thien_khong_vuc", "u_minh_gioi"].forEach((regionId) => {
    const nodes = E.originNodeOptions(regionId);
    assert(nodes.length > 0, regionId + " must have origin nodes");
    nodes.forEach((node) => {
      assert(sandbox.window.GameData.WORLD_MAP.locations[node.locationId], node.id + " location missing");
      assert(!["sect_adjacent", "sect_gate", "guild"].includes(node.kind), node.id + " must be independent");
    });
  });
  const npcState = E.createState({ character: E.createCharacter({ name: "NPC duplicate", archetypeId: "kiem_tong", fates: E.drawInitialFates() }), locationId: "vo_tan_hai_khoi_diem" });
  npcState.locationId = "vo_tan_hai_khoi_diem";
  npcState.worldSimulation.npcState.hai_su_tu = { npcId: "hai_su_tu", name: "Tạ Hải Sinh", status: "alive", currentNodeId: "vo_tan_hai_khoi_diem", currentSubLocationId: null, aiState: "present" };
  const talkIds = E.talkActions(npcState).filter((action) => action.id === "act_talk_hai_su_tu").map((action) => action.id);
  assert.strictEqual(talkIds.length, 1, "static and scheduled NPC records must create one talk action");
  const state = E.createState({ character: E.createCharacter({ name: "WT movement", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  state.locationId = "truyen_phap";
  state.player.stamina = 999;
  const base = X.travelPlan(state, "truyen_phap", "son_mon", "walk");
  assert(base.success, "WT01 baseline route must resolve");
  assert(base.staminaCost > 0, "WT01 baseline route has a positive stamina cost");
  assert(base.gameDays >= 1, "WT02 baseline route has a duration");
  const rain = X.setWeather(state, "trung_vuc", "mua", 7, "WT03");
  assert(rain.success);
  const rainy = X.travelPlan(state, "truyen_phap", "son_mon", "walk");
  assert(rainy.success && rainy.weights.weatherWeight > 1, "WT03 rain increases canonical travel weight");
  assert(rainy.staminaCost >= base.staminaCost, "WT04 rain cannot lower the displayed stamina cost");
  const mountainNode = "cam_dia";
  const mountain = X.travelPlan(state, "truyen_phap", mountainNode, "walk");
  assert(mountain.success && mountain.weights.terrainWeight >= 1, "WT05 terrain weight is exposed in the plan");
  assert(Number.isFinite(mountain.gameDays) && Number.isFinite(mountain.staminaCost), "WT06 plan has exact duration and cost");
  const preview = E.movementCandidatePreview(state, "dong");
  assert(preview.success && preview.travelPlan && Number.isFinite(preview.travelPlan.staminaCost), "WT07 candidate preview includes canonical cost");
  const previewAgain = E.movementCandidatePreview(state, "dong");
  assert.deepStrictEqual(previewAgain.travelPlan, preview.travelPlan, "WT08 same turn preview is deterministic");
  const before = state.player.stamina;
  const committed = E.move(state, "dong", { allowGenerate: true, actionId: "wt09" });
  assert(committed === undefined || committed.success !== false, "WT09 affordable movement commits");
  const paid = Number(state.lastTravelPlan?.staminaPaid || 0);
  assert(paid > 0 && state.player.stamina <= before - paid, "WT10 commit spends the canonical cost once (derived caps may apply)");
  const blockedState = E.createState({ character: E.createCharacter({ name: "WT blocked", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  blockedState.locationId = "truyen_phap";
  blockedState.player.stamina = 0;
  const blockedPreview = E.movementCandidatePreview(blockedState, "dong");
  assert(blockedPreview.success && blockedPreview.travelPlan.staminaCost > 0, "WT11 blocked case has a positive cost");
  const blocked = E.move(blockedState, "dong", { allowGenerate: true, actionId: "wt11" });
  assert.strictEqual(blocked.code, "TRAVEL_STAMINA", "WT12 insufficient stamina blocks without moving");
  assert.strictEqual(blockedState.locationId, "truyen_phap", "WT12 blocked movement preserves location");
  const stormState = E.createState({ character: E.createCharacter({ name: "WT storm", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const storm = X.setWeather(stormState, "trung_vuc", "bao_linh_khi", 7, "WT13");
  assert(storm.success);
  const stormPlan = X.travelPlan(stormState, "truyen_phap", "son_mon", "ngự_khí");
  assert.strictEqual(stormPlan.success, false, "WT13 storm blocks ngự khí explicitly");
  console.log(JSON.stringify({ ok: true, tests: 13, suite: "WT01-WT13", route: base, rainy, preview: preview.travelPlan }));
}

main();
