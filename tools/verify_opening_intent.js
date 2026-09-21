"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(read(file), sandbox, { filename: file }));

const E = sandbox.window.GameEngine;
const regions = ["trung_vuc", "dong_hoang", "tay_mac", "nam_chuong", "bac_nguyen", "vo_tan_hai"];
const openingIds = new Set(["tan_tu_village", "tan_tu_border_inn", "tan_tu_river", "tan_tu_old_road", "tan_tu_mountain_shelter"]);
const regionFactions = (regionId) => [...(sandbox.window.FACTION_DATA?.guilds || []), ...(sandbox.window.FACTION_DATA?.factions || [])].filter((entry, index, all) => entry.region_id === regionId && all.findIndex((item) => item.id === entry.id) === index);
const hasKind = (regionId, matcher) => regionFactions(regionId).some((entry) => matcher.test((entry.type + " " + entry.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
const newState = (regionId, background) => {
  const character = E.rollCharacterCreation(regionId, { rng: () => 0.21 });
  character.name = "Opening Intent QA";
  character.background = background;
  return E.createState({ character });
};

for (const regionId of regions) {
  const familyAvailable = hasKind(regionId, /the gia|gia toc|vuong trieu|phu gia/);
  const sectAvailable = hasKind(regionId, /tong mon|dao tong|kiem tong|dan tong|ma dao|phat tong|quy tong|giao phai|dao thong|phai/);
  const normal = newState(regionId, "Thế Gia");
  assert.strictEqual(E.contextState(normal).state, "JOURNEY_INTENT_CHOICE");
  assert.strictEqual(normal.flags.originChoicePending, false);
  const normalOptions = E.journeyIntentOptions(normal.player, normal).map((entry) => entry.id);
  assert(normalOptions.includes("tam_su"));
  assert(normalOptions.includes("tu_lap"));
  assert.strictEqual(normalOptions.includes("quy_tong"), familyAvailable);
  assert.strictEqual(normalOptions.includes("an_the"), false);

  if (sectAvailable) {
    const sectState = newState(regionId, "Thế Gia");
    const result = E.chooseJourneyIntent(sectState, "tam_su");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.openingPlan.type, "sect");
    assert.strictEqual(result.openingPlan.targetOrganizationKind, "sect");
    assert(result.openingPlan.targetOrganizationId);
    assert(regionFactions(regionId).some((entry) => entry.id === result.openingPlan.targetOrganizationId));
    assert.strictEqual(sectState.flags.journeyIntentPending, false);
  }

  const independent = newState(regionId, "Tán Tu");
  const independentResult = E.chooseJourneyIntent(independent, "tu_lap");
  assert.strictEqual(independentResult.success, true);
  assert.strictEqual(independentResult.openingPlan.type, "independent");
  assert(openingIds.has(independentResult.openingPlan.sceneId));
  assert.strictEqual(independentResult.openingPlan.targetOrganizationId, null);
  assert.strictEqual(Object.values(independent.quests).some((quest) => quest.status === "hidden"), false);
  assert(independent.history.some((entry) => String(entry.text || entry.narrative || "").includes(independentResult.openingPlan.text)));

  if (familyAvailable) {
    const familyState = newState(regionId, "Thế Gia");
    const result = E.chooseJourneyIntent(familyState, "quy_tong");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.openingPlan.type, "family");
    assert.strictEqual(result.openingPlan.targetOrganizationKind, "family");
    assert(result.openingPlan.targetOrganizationId);
  }

  for (const background of ["Hắc Đạo", "Vô Danh"]) {
    const hidden = newState(regionId, background);
    const options = E.journeyIntentOptions(hidden.player, hidden).map((entry) => entry.id);
    assert.strictEqual(JSON.stringify(options), JSON.stringify(["tam_su", "tu_lap", "an_the"]));
    const result = E.chooseJourneyIntent(hidden, "an_the");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.openingPlan.type, "hidden");
    assert(openingIds.has(result.openingPlan.sceneId));
    assert.strictEqual(hidden.flags.journeyIntentPending, false);
  }

  const sectBackground = newState(regionId, "Tông Môn");
  assert.strictEqual(JSON.stringify(E.journeyIntentOptions(sectBackground.player, sectBackground).map((entry) => entry.id)), JSON.stringify(["tam_su", "tu_lap"]));
}

const actionState = newState("trung_vuc", "Tông Môn");
const turnBefore = actionState.meta.turn;
const failed = E.submitActionId(actionState, "act_journey_quy_tong");
assert.strictEqual(failed, false, "missing/invalid target must fail without consuming a turn");
assert.strictEqual(actionState.meta.turn, turnBefore);

const persistence = newState("trung_vuc", "Thế Gia");
const chosen = E.chooseJourneyIntent(persistence, "quy_tong");
assert.strictEqual(chosen.success, true);
assert.strictEqual(E.enterLuyenKhi(persistence, "opening-intent QA"), true);
assert.strictEqual(persistence.pendingGuildChoice, true);
const restored = E.deserialize(E.serialize(persistence));
assert.strictEqual(restored.player.journeyIntent, "quy_tong");
assert.strictEqual(restored.player.openingPlan.targetOrganizationId, chosen.openingPlan.targetOrganizationId);
assert.strictEqual(restored.pendingGuildChoice, true);
assert.strictEqual(E.refuseGuild(restored, "thế gia"), true);
assert.strictEqual(restored.flags.guildDecision, "journey:quy_tong:declined");
assert.strictEqual(E.resolveAction(restored, "act_journey_tu_lap").success, false);

const legacyInvitationSave = JSON.parse(E.serialize(persistence));
delete legacyInvitationSave.pendingGuildChoice;
const migratedInvitation = E.deserialize(JSON.stringify(legacyInvitationSave));
assert.strictEqual(migratedInvitation.pendingGuildChoice, true, "migration must restore a missing stage-2 invitation flag");
console.log("OK: all journey intents, UTF-8 background branches, regional targets, independent scenes, state isolation, failed-action clock safety, and persistence");
