"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { generateCharacter } = require("../character_generator");

const ROOT = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function loadBrowserGame() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  ["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/data.js", "js/engine.js"].forEach((file) => {
    vm.runInContext(read(file), sandbox, { filename: file });
  });
  return sandbox;
}

function verifyGeneratedItems(sandbox) {
  const generator = require("../gemini-code-1788430656294.js");
  const batch = generator.generateBatchItems(1000);
  const items = Object.values(batch);
  assert.strictEqual(items.length, 1000);
  assert.strictEqual(new Set(items.map((item) => item.id)).size, 1000);
  assert(items.every((item) => item.id && item.name && item.kind && item.desc));
  assert(items.some((item) => item.cursed));

  const E = sandbox.window.GameEngine;
  const D = sandbox.window.GameData;
  const character = E.createCharacter({ name: "Item Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const state = E.createState({ character });
  let weapon = E.createLootItem(state, "weapon");
  while (weapon && E.equipmentCategory(weapon) !== "artifact") weapon = E.createLootItem(state, "weapon");
  assert(weapon && state.inventory[weapon.id] === 1);
  assert(state.generatedItems[weapon.id]);
  E.useItem(state, weapon.name);
  assert(state.player.equipment.artifacts.includes(weapon.id));
  assert(E.inventoryActions(state, weapon.id).some((action) => action.id === "unequip"));
  assert(E.inventoryActions(state, "linh_thach").some((action) => action.id === "inspect"));

  const restored = E.deserialize(E.serialize(state));
  assert(restored.generatedItems[weapon.id]);
  assert.strictEqual(sandbox.window.GameData.ITEMS[weapon.id].name, weapon.name);
  assert(restored.player.equipment.artifacts.includes(weapon.id));

  const equipmentItems = [
    { id: "qa_a1", name: "QA Kiếm Một", kind: "weapon", equipmentType: "artifact" },
    { id: "qa_a2", name: "QA Kiếm Hai", kind: "weapon", equipmentType: "artifact" },
    { id: "qa_a3", name: "QA Kiếm Ba", kind: "weapon", equipmentType: "artifact" },
    { id: "qa_armor", name: "QA Giáp", kind: "armor", equipmentType: "protection", protectionSlot: "armor" },
    { id: "qa_boots", name: "QA Ngoa", kind: "armor", equipmentType: "protection", protectionSlot: "boots" },
    { id: "qa_pants", name: "QA Quần", kind: "armor", equipmentType: "protection", protectionSlot: "pants" },
    { id: "qa_helmet", name: "QA Mũ", kind: "armor", equipmentType: "protection", protectionSlot: "helmet" },
    { id: "qa_p1", name: "QA Pháp Vòng", kind: "armor", equipmentType: "personal" },
    { id: "qa_p2", name: "QA Pháp Nhẫn", kind: "armor", equipmentType: "personal" },
    { id: "qa_p3", name: "QA Ngọc Bội", kind: "armor", equipmentType: "personal" },
    { id: "qa_p4", name: "QA Hộ Tí", kind: "armor", equipmentType: "personal" },
    { id: "qa_spirit", name: "QA Linh Chuông", kind: "weapon", equipmentType: "spirit" }
  ];
  equipmentItems.forEach((item) => { D.ITEMS[item.id] = item; E.addItem(state, item.id, 1); });
  ["qa_a1", "qa_a2", "qa_a3"].forEach((id) => E.useItem(state, D.ITEMS[id].name));
  assert.strictEqual(state.player.equipment.artifacts.length, 2);
  ["qa_armor", "qa_boots", "qa_pants", "qa_helmet"].forEach((id) => E.useItem(state, D.ITEMS[id].name));
  assert.strictEqual(Object.values(state.player.equipment.protection).filter(Boolean).length, 4);
  ["qa_p1", "qa_p2", "qa_p3", "qa_p4"].forEach((id) => E.useItem(state, D.ITEMS[id].name));
  assert.strictEqual(state.player.equipment.personal.length, 3);
  E.useItem(state, D.ITEMS.qa_spirit.name);
  assert.strictEqual(state.player.equipment.spiritTreasure, "qa_spirit");
}

function verifyTechniquesAndActions(sandbox) {
  const E = sandbox.window.GameEngine;
  const character = E.createCharacter({ name: "Technique Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const state = E.createState({ character });
  state.player.realmId = "khai_lo";
  E.updateDerived(state);
  assert(E.getKnownTechniques(state).length >= 1);
  assert.strictEqual(E.parseAction("tu luyen", E.contextState(state).actions).actionId, "act_tu_luyen");
  assert.strictEqual(E.parseAction("tu luyn", E.contextState(state).actions).actionId, "act_tu_luyen");
  const result = E.useTechnique(state, "kiem_khi_so_cap");
  assert(result.success || /Linh khí không đủ|Cảnh giới/.test(result.reason));
  assert(E.techniqueStatus(state).includes("Kiếm Khí"));
  Object.values(sandbox.window.CONG_PHAP_DATA.techniques).forEach((technique) => {
    assert(Number.isFinite(technique.visibleStats.cooldownSeconds));
    assert(Number.isFinite(technique.visibleStats.castTimeSeconds));
    assert(technique.mastery && Number.isFinite(technique.mastery.stage));
  });
}

function assertUnique(items, getKey, label) {
  const seen = new Set();
  items.forEach((item) => {
    const key = getKey(item);
    assert(!seen.has(key), `${label} duplicated: ${key}`);
    seen.add(key);
  });
}

function verifyDataIntegrity(sandbox) {
  const D = sandbox.window.GameData;
  const fateIds = new Set(D.FATE_PATTERNS.map((fate) => fate.id));
  assertUnique(D.FATE_PATTERNS, (fate) => fate.id, "Browser fate id");

  const pool = JSON.parse(read("data/fate-pool.json"));
  assert.strictEqual(pool.total, pool.fates.length);
  assertUnique(pool.fates, (fate) => fate.id, "JSON fate id");

  const cultivationSource = JSON.parse(read("data/canh_gioi_tien_hiep.json"));
  const cultivationRealms = Array.isArray(cultivationSource) ? cultivationSource : cultivationSource.realms;
  const factionData = JSON.parse(read("data/tu_tien_factions.json"));
  const guildData = {
    total: factionData.guild_source?.total,
    tiers: factionData.guild_tiers,
    guilds: factionData.guilds
  };
  assert.strictEqual(D.REALMS.length, cultivationRealms.length);
  assert.strictEqual(cultivationRealms.length, 14);
  assert.deepStrictEqual(cultivationRealms.map((realm) => realm.level), Array.from({ length: 14 }, (_, index) => index + 1));
  assert(cultivationSource.realm_model === "14_flat_levels");
  assert.strictEqual(D.WORLD_MAP.factions.length, factionData.factions.length);
  assert.strictEqual(D.GUILDS.length, 150);
  assert.strictEqual(guildData.total, 150);
  assertUnique(cultivationRealms, (realm) => realm.id, "Realm id");
  assertUnique(factionData.factions, (faction) => faction.id, "Faction id");
  assertUnique(guildData.guilds, (guild) => guild.id, "Guild id");
  const regionIds = new Set(factionData.world.regions.map((region) => region.id));
  guildData.guilds.forEach((guild) => {
    assert(regionIds.has(guild.region_id), `Guild region missing: ${guild.region_id}`);
    assert(guild.scale.min <= guild.scale.max);
    assert(guild.cultivation_exp_bonus_pct.min <= guild.cultivation_exp_bonus_pct.max);
    assert(guild.city_penalty_reduction_pct.min <= guild.city_penalty_reduction_pct.max);
  });

  const relationships = D.FATE_RELATIONSHIPS;
  (relationships.pairwise_relationships || []).forEach((pair) => {
    assert(fateIds.has(pair.from), `Relationship source missing: ${pair.from}`);
    assert(fateIds.has(pair.to), `Relationship target missing: ${pair.to}`);
  });
  (relationships.combo_sets || []).forEach((combo) => {
    combo.members.forEach((member) => assert(fateIds.has(member.id), `Combo member missing: ${member.id}`));
  });
  (relationships.fusion_recipes || []).forEach((recipe) => {
    recipe.materials.forEach((material) => assert(fateIds.has(material.id), `Fusion material missing: ${material.id}`));
    assert(fateIds.has(recipe.result.id), `Fusion result missing: ${recipe.result.id}`);
  });

  Object.entries(D.LOCATIONS).forEach(([id, location]) => {
    assert.strictEqual(location.id, id);
    Object.values(location.exits || {}).forEach((target) => assert(D.LOCATIONS[target], `Exit target missing: ${target}`));
    (location.npcs || []).forEach((npc) => assert(D.NPCS[npc], `NPC missing: ${npc}`));
    (location.enemies || []).forEach((enemy) => assert(D.ENEMIES[enemy], `Enemy missing: ${enemy}`));
    (location.searchable || []).forEach((item) => assert(D.ITEMS[item], `Search item missing: ${item}`));
  });
  D.ARCHETYPES.forEach((archetype) => {
    assert(D.ITEMS[archetype.startItem], `Start item missing: ${archetype.startItem}`);
    assert(fs.existsSync(path.join(ROOT, archetype.portrait)), `Portrait missing: ${archetype.portrait}`);
  });
  Object.values(D.NPCS).forEach((npc) => assert(fs.existsSync(path.join(ROOT, npc.portrait)), `Portrait missing: ${npc.portrait}`));
  Object.values(D.ENEMIES).forEach((enemy) => {
    assert(fs.existsSync(path.join(ROOT, enemy.portrait)), `Portrait missing: ${enemy.portrait}`);
    (enemy.loot || []).forEach((item) => assert(D.ITEMS[item], `Enemy loot missing: ${item}`));
  });
  Object.values(D.QUESTS).forEach((quest) => {
    if (quest.reward?.item) assert(D.ITEMS[quest.reward.item], `Quest reward missing: ${quest.reward.item}`);
  });
}

function verifyCharacters() {
  for (let index = 0; index < 10000; index++) {
    const character = generateCharacter();
    assert.strictEqual(character.realm.id, "di_menh");
    assert.strictEqual(character.realm.level, 1);
    assert.strictEqual(character.fate.equippedIds.length, 5);
    assert.strictEqual(new Set(character.fate.equippedIds).size, 5);
    assert(character.fate.total > 5);
    assert(character.fate.vaultCapacity === 10);
    assert(character.stats.aptitude >= 1 && character.stats.aptitude <= 100);
    assert(character.stats.comprehension >= 1 && character.stats.comprehension <= 100);
    assert.strictEqual(character.origin.personality.length, 2);
    assert.strictEqual(new Set(character.origin.personality).size, 2);
    assert.deepStrictEqual(character.techniqueIds, ["kiem_khi_so_cap", "tam_phap_dan_dien"]);
    assert.strictEqual(character.hiddenProfession, null);
  }
}

function verifyBrowserEngine(sandbox) {
  const D = sandbox.window.GameData;
  const E = sandbox.window.GameEngine;
  const gradeRank = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };

  for (let index = 0; index < 200; index++) {
    const ids = E.drawInitialFates();
    const fates = ids.map((id) => D.FATE_PATTERNS.find((fate) => fate.id === id));
    assert.strictEqual(ids.length, 5);
    assert.strictEqual(new Set(ids).size, 5);
    assert(fates.reduce((sum, fate) => sum + fate.score, 0) > 5);
    assert(fates.every((fate) => gradeRank[fate.grade] <= 3));
  }

  D.WORLD_MAP.regions.forEach((region) => {
    for (let index = 0; index < 40; index++) {
      const rolled = E.rollCharacterCreation(region.id);
      assert.strictEqual(rolled.startRegionId, region.id);
      assert.strictEqual(rolled.realmId, "di_menh");
      assert(rolled.aptitude >= 1 && rolled.aptitude <= 100);
      assert(rolled.comprehension >= 1 && rolled.comprehension <= 100);
      assert(rolled.basePhy >= 10 && rolled.basePhy <= 20);
      assert(rolled.baseMag >= 10 && rolled.baseMag <= 20);
      assert.strictEqual(rolled.personalityTraits.length, 2);
      assert.strictEqual(new Set(rolled.personalityTraits).size, 2);
      assert(rolled.spiritualRoots.length >= 1 && rolled.spiritualRoots.length <= 5);
      assert.strictEqual(rolled.fates.length, 5);
      assert.strictEqual(new Set(rolled.fates).size, 5);
      assert.strictEqual(D.WORLD_MAP.locations[rolled.startLocationId].region, region.id);
      const fateObjects = rolled.fates.map((id) => D.FATE_PATTERNS.find((fate) => fate.id === id));
      assert(fateObjects.reduce((sum, fate) => sum + fate.score, 0) > 5);
      assert(fateObjects.every((fate) => gradeRank[fate.grade] <= 3));
    }
  });

  Object.keys(D.WORLD_MAP.locations).forEach((id) => assert(D.LOCATIONS[id], `Map location missing: ${id}`));
  Object.values(D.LOCATIONS).forEach((location) => {
    Object.values(location.exits || {}).forEach((id) => assert(D.WORLD_MAP.locations[id], `Map layout missing: ${id}`));
  });

  const character = E.createCharacter({
    name: "Test",
    archetypeId: "kiem_tong",
    fates: E.drawInitialFates()
  });
  const state = E.createState({ character });
  E.move(state, "bac");
  assert(state.visitedLocations.includes("van_phong"));
  assert(E.describeMap(state).includes("Vạn Giới Lộ"));

  const localGuild = D.GUILDS.find((guild) => guild.region_id === "trung_vuc");
  assert.strictEqual(E.joinGuild(state, localGuild.id), false);
  E.gainExp(state, 100);
  assert.strictEqual(state.player.realmId, "di_menh");
  assert(E.doBreakthrough(state).changed);
  assert.strictEqual(state.player.realmId, "khai_lo");
  assert.strictEqual(state.flags.pathChoicePending, true);
  assert(E.contextState(state).actions.some((action) => action.id === "act_path_ngoai_dao_gia"));
  assert.strictEqual(state.pendingGuildChoice, true);
  assert.strictEqual(state.quests.chon_dao_lo.status, "active");
  assert(E.joinGuild(state, localGuild.id));
  assert.strictEqual(state.pendingGuildChoice, false);
  assert.strictEqual(state.quests.chon_dao_lo.status, "completed");
  const benefits = E.getGuildBenefits(state);
  assert(benefits.expBonusPct > 0);
  assert(benefits.cityPenaltyReductionPct > 0);
  const contributionBefore = state.guildMembership.contribution;
  E.cultivate(state);
  assert(state.guildMembership.contribution > contributionBefore);
  assert(E.leaveGuild(state));

  ["thong_mach_dan", "tu_khi_dan", "hoan_huyet_dan"].forEach((itemId) => {
    const pillCharacter = E.createCharacter({ name: itemId, archetypeId: "kiem_tong", fates: E.drawInitialFates() });
    const pillState = E.createState({ character: pillCharacter });
    E.addItem(pillState, itemId, 1);
    E.useItem(pillState, D.ITEMS[itemId].name);
    assert.strictEqual(pillState.player.realmId, "khai_lo");
    assert.strictEqual(pillState.pendingGuildChoice, true);
    assert.strictEqual(pillState.inventory[itemId], undefined);
  });

  const independentCharacter = E.createCharacter({ name: "Tán Tu", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  const independentState = E.createState({ character: independentCharacter });
  E.enterLuyenKhi(independentState, "kiểm thử");
  assert(E.refuseGuild(independentState, "thế gia"));
  assert.strictEqual(independentState.player.background, "Thế Gia");
  assert.strictEqual(independentState.flags.guildDecision, "the_gia");
  assert.strictEqual(independentState.quests.chon_dao_lo.status, "completed");

  const migrated = E.deserialize(JSON.stringify({ state: { ...state, visitedLocations: undefined } }));
  assert.deepStrictEqual(Array.from(migrated.visitedLocations), ["van_phong"]);

  const canonicalSave = JSON.parse(E.serialize(state));
  assert.strictEqual(canonicalSave.version, 12);
  assert.strictEqual(canonicalSave.state.player.realm.id, "khai_lo");
  assert(!Object.prototype.hasOwnProperty.call(canonicalSave.state, "fateInventory"));
  assert.strictEqual(E.deserialize(JSON.stringify(canonicalSave)).player.realmId, "khai_lo");

  const unbound = E.createState({ character: E.createCharacter({ name: "Vô Lộ", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  assert.strictEqual(E.selectPath(unbound, "ngoai_dao_gia").success, false);
  unbound.player.exp = 100;
  assert(E.doBreakthrough(unbound).changed);
  assert.strictEqual(unbound.player.realmId, "khai_lo");
  assert(E.selectPath(unbound, "ngoai_dao_gia").success);
  unbound.player.exp = 2999;
  assert(!E.doBreakthrough(unbound).changed);
  assert(!unbound.player.tainted.attentionPending);
  assert.strictEqual(E.chooseTaintedAttention(unbound, "blessing").success, false);

  const tainted = E.createState({ character: E.createCharacter({ name: "Dị Hóa", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  tainted.player.realmId = "anh_linh";
  E.recordTaintedMilestones(tainted);
  assert.strictEqual(E.contextState(tainted).state, "TAINTED_ATTENTION_CHOICE");
  assert.strictEqual(E.contextState(tainted).actions.length, 3);
  assert(E.chooseTaintedAttention(tainted, "blessing").success);
  assert.strictEqual(E.chooseTaintedAttention(tainted, "suspicion").success, false);
  const restoredTainted = E.deserialize(E.serialize(tainted));
  assert.strictEqual(restoredTainted.player.tainted.vocation, "blessing");
  assert(!restoredTainted.player.tainted.attentionPending);

  restoredTainted.player.realmId = "hop_dao";
  restoredTainted.player.tainted.faction = "rebel_heaven";
  assert(E.learnTechnique(restoredTainted, "cam_thuat_huyet_te"));
  restoredTainted.player.qi = restoredTainted.player.maxQi;
  restoredTainted.player.stamina = restoredTainted.player.maxStamina;
  const lifeBefore = restoredTainted.player.lifespan;
  const warning = E.useTechnique(restoredTainted, "cam_thuat_huyet_te");
  assert(warning.requiresConfirmation);
  assert.strictEqual(restoredTainted.player.lifespan, lifeBefore);
  assert(E.useTechnique(restoredTainted, "cam_thuat_huyet_te", { confirmed: true }).success);
  assert.strictEqual(restoredTainted.player.lifespan, lifeBefore - 1);

  const titles = sandbox.window.PATH_FATE_RELATIONS.path_titles;
  Object.entries(titles).forEach(([pathId, list]) => {
    assert.strictEqual(list.length, 14, `Path title count: ${pathId}`);
    if (pathId !== "ngoai_dao_gia") assert.strictEqual(new Set(list).size, 14, `Path titles duplicated: ${pathId}`);
  });
}

function verifyMapUI(sandbox) {
  const elements = { home: {}, create: {}, game: {}, "tab-content": { innerHTML: "" } };
  sandbox.activeTestTab = "map";
  sandbox.document = {
    getElementById: (id) => elements[id] || {},
    querySelector: (selector) => selector === ".tab.active" ? { dataset: { tab: sandbox.activeTestTab } } : null
  };
  vm.runInContext(read("js/ui.js"), sandbox, { filename: "js/ui.js" });

  const E = sandbox.window.GameEngine;
  const character = E.createCharacter({ name: "Test", archetypeId: "kiem_tong", fates: E.drawInitialFates() });
  sandbox.window.GameUI.renderPanel(E.createState({ character }));
  assert(elements["tab-content"].innerHTML.includes("world-map"));
  assert(elements["tab-content"].innerHTML.includes("faction-pin"));
  assert(elements["tab-content"].innerHTML.includes("guild-pin"));
  sandbox.window.GameUI.setMapView("local", E.createState({ character }));
  assert(elements["tab-content"].innerHTML.includes("data-map-dir"));
  sandbox.activeTestTab = "status";
  sandbox.window.GameUI.renderPanel(E.createState({ character }));
  ["Mệnh Trạng Thái", "Pháp khí", "Hộ thân Pháp khí", "Tùy thân Pháp khí", "Bản mệnh Linh bảo", "Pháp khí Sinh hoạt"]
    .forEach((label) => assert(elements["tab-content"].innerHTML.includes(label), `missing status label: ${label}`));
  sandbox.activeTestTab = "guilds";
  const guildChoiceState = E.createState({ character });
  E.enterLuyenKhi(guildChoiceState, "kiểm thử UI");
  sandbox.window.GameUI.renderPanel(guildChoiceState);
  assert(elements["tab-content"].innerHTML.includes("data-guild-join"));
  assert(elements["tab-content"].innerHTML.includes("data-guild-refuse"));
}

function verifyDomReferences() {
  const html = read("index.html");
  const ids = new Set(Array.from(html.matchAll(/id="([^"]+)"/g), (match) => match[1]));
  ["js/main.js", "js/ui.js"].forEach((file) => {
    for (const match of read(file).matchAll(/(?:getElementById|\$)\("([^"]+)"\)/g)) {
      assert(ids.has(match[1]), `${file} references missing #${match[1]}`);
    }
  });
  assert(html.includes('id="start-region-list"'));
  assert(!html.includes('id="btn-roll-character"'));
  assert(!html.includes('id="creation-roll-result"'));
  assert(!html.includes('id="btn-create-start"'));
  assert(!html.includes('id="guild-select"'));
  assert(!html.includes('id="archetype-list"'));
}

function verifyCreationUI(sandbox) {
  function fakeElement() {
    return {
      value: "", textContent: "", innerHTML: "", className: "", disabled: false,
      children: [], listeners: {}, dataset: {},
      classList: { add() {}, remove() {} },
      addEventListener(type, handler) { this.listeners[type] = handler; },
      appendChild(child) { this.children.push(child); return child; },
      querySelectorAll() { return []; },
      focus() {}, closest() { return null; }
    };
  }
  const ids = [
    "screen-home", "screen-create", "screen-game", "save-indicator", "btn-new", "btn-continue",
    "btn-create-back", "btn-create-start", "btn-roll-character", "char-name", "create-error",
    "start-region-list", "creation-roll-result", "free-form", "free-input", "tab-content"
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, fakeElement()]));
  const storage = {};
  sandbox.document = {
    getElementById: (id) => elements[id] || fakeElement(),
    querySelectorAll: () => [],
    createElement: () => fakeElement()
  };
  sandbox.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; }
  };
  sandbox.setTimeout = (handler) => { handler(); return 0; };
  sandbox.alert = () => {};
  sandbox.window.GameUI = {
    showScreen() {}, clearStory() {}, addStory() {}, renderPanel() {}, setLocation() {},
    clearChoices() {}, renderChoices() {}, setSaveIndicator() {}
  };
  vm.runInContext(read("js/main.js"), sandbox, { filename: "js/main.js" });

  elements["btn-new"].listeners.click();
  assert.strictEqual(elements["start-region-list"].children.length, sandbox.window.GameData.WORLD_MAP.regions.length);
  elements["start-region-list"].children[0].listeners.click();
  const saved = JSON.parse(storage.co_di_dien_save_v12).state;
  assert(saved.startRegionId);
  assert.strictEqual(saved.guildMembership, null);
  assert(saved.player.origin.race && saved.player.stats.aptitude && saved.player.origin.spiritualRoots.length);
  assert.strictEqual(saved.player.realm.id, "di_menh");
}

function updateSamples() {
  const samples = Array.from({ length: 5 }, (_, index) => generateCharacter({
    name: `Vô Danh #${String(index + 1).padStart(4, "0")}`
  }));
  fs.writeFileSync(path.join(ROOT, "sample_characters.json"), `${JSON.stringify(samples, null, 2)}\n`, "utf8");
}

function main() {
  if (process.argv.includes("--update-samples")) updateSamples();
  verifyCharacters();
  const sandbox = loadBrowserGame();
  verifyDataIntegrity(sandbox);
  verifyBrowserEngine(sandbox);
  verifyGeneratedItems(sandbox);
  verifyTechniquesAndActions(sandbox);
  verifyMapUI(sandbox);
  verifyDomReferences();
  verifyCreationUI(sandbox);
  console.log("OK: characters, procedural items, map, data integrity, save migration, UI and DOM");
}

main();
