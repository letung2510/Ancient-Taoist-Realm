/* ============================================================
 * CỔ DỊ DIỆN — Unified expansion runtime
 * World simulation, living factions/NPCs, progression branches,
 * professions, contracts, companions, legacies and Fate evolution.
 * ============================================================ */
(function () {
  "use strict";

  const E = window.GameEngine;
  const D = window.GameData;
  const X = window.EXPANSION_DATA || {};
  if (!E || !D) return;
  if (window.GameI18n) E.I18n = window.GameI18n;

  const VERSION = 1;
  const GRADE_RANK = { pham: 1, phan: 1, linh: 2, huyen: 3, dia: 4, thien: 5, tien: 6 };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const currentRegion = (state) => D.WORLD_MAP?.locations?.[state.locationId]?.region || D.LOCATIONS?.[state.locationId]?.region || "trung_vuc";
  const absoluteDay = (clock) => Math.max(1, (Number(clock?.currentYear || 1) - 1) * 360 + (Number(clock?.currentMonth || 1) - 1) * 30 + Number(clock?.currentDay || 1));
  const pairKey = (a, b) => [String(a), String(b)].sort().join("::");
  const itemName = (id) => D.ITEMS?.[id]?.name || E.I18n?.formatTarget(id) || "vật phẩm chưa định danh";
  const professionCatalog = () => ({ ...(X.professionItems || {}), ...(window.PROFESSION_ITEMS || {}) });
  const professionDefinition = (id) => X.professionDefinitions?.[id] || X.hiddenProfessions?.[id] || null;
  const fateDef = (id) => D.FATE_PATTERNS?.find((fate) => fate.id === id);
  const fateName = (id) => fateDef(id)?.name || "Mệnh Số chưa định danh";
  const CONTRACT_LABELS = { hunt: "Truy Săn", escort: "Hộ Tống", retrieve: "Thu Hồi", investigate: "Điều Tra", capture: "Bắt Sống" };
  function formatContractName(contract) { return CONTRACT_LABELS[contract?.templateId] || "Khế Ước"; }
  function formatContractTarget(contract) {
    if (contract?.targetEntityId) return D.NPCS?.[contract.targetEntityId]?.name || D.ENTITIES?.[contract.targetEntityId]?.name || "mục tiêu được chỉ định";
    if (contract?.targetLocationId) return D.LOCATIONS?.[contract.targetLocationId]?.name || "khu vực được chỉ định";
    if (contract?.targetItemId) return itemName(contract.targetItemId);
    return "mục tiêu theo dấu";
  }

  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < String(text).length; i += 1) {
      value ^= String(text).charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }
  function seeded(state, scope, day = absoluteDay(state.gameClock), index = 0) {
    const seed = state.worldSimulation?.seed || state.meta?.saveId || "co_di_dien";
    let value = hash(seed + "|" + scope + "|" + day + "|" + index);
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    return (value >>> 0) / 4294967296;
  }
  function uid(state, prefix) {
    const sim = ensure(state).worldSimulation;
    sim.nextEventSeq += 1;
    return prefix + "_" + sim.nextEventSeq;
  }
  function history(state, type, text) {
    const rendered = E.I18n?.formatHistory ? E.I18n.formatHistory(text, state) : text;
    E.pushHistory(state, { type: type || "sys", text: rendered });
  }
  function addItem(state, id, quantity) {
    if (!id || !quantity) return;
    E.addItem(state, id, Number(quantity));
  }
  function removeItem(state, id, quantity) {
    return E.removeItem(state, id, Number(quantity));
  }

  function emptyDiscoveries() {
    return { fates: {}, techniques: {}, entities: {}, locations: {}, worldEvents: {}, factions: {}, hiddenRealms: {}, intel: {}, codexClues: {} };
  }

  function ensure(state) {
    if (!state || !state.player) return state;
    state.meta = state.meta || {};
    state.meta.featureVersions = state.meta.featureVersions || {};
    ["worldSimulation", "relationships", "techniqueEvolution", "professions", "professionItems", "techniqueEvolution", "contracts", "itemLegacy", "companions", "discoveries", "reincarnationLegacy", "fateEvolution"].forEach((key) => {
      state.meta.featureVersions[key] = Number(state.meta.featureVersions[key] || VERSION);
    });
    state.worldSimulation = state.worldSimulation || {
      seed: state.meta.saveId || "world_" + Date.now(), lastProcessedDay: absoluteDay(state.gameClock), nextEventSeq: 0,
      events: {}, regionState: {}, factionState: {}, diplomacy: {}, wars: {}, npcState: {}, hiddenRealms: {}, scheduledTasks: []
    };
    const sim = state.worldSimulation;
    Object.entries(professionCatalog()).forEach(([id, item]) => { D.ITEMS[id] = { ...(D.ITEMS[id] || {}), ...item, kind: "profession_item", catalogSource: "profession" }; });
    Object.values(state.generatedItems || {}).forEach((item) => {
      if (!item.equipmentSetId && typeof item.name === "string") {
        if (item.name.includes("Bá Vương")) item.equipmentSetId = "Bá Vương";
        else if (item.name.includes("Thiên Mệnh")) item.equipmentSetId = "Thiên Mệnh";
      }
    });
    state.professionItemState = state.professionItemState || {};
    state.meta.featureVersions.professionItems = Math.max(Number(state.meta.featureVersions.professionItems || 1), Number(window.PROFESSION_ITEMS_SCHEMA_VERSION || 1));
    state.hiddenProfessionState = state.hiddenProfessionState || { clues: {}, attempts: {}, branches: {}, failures: [], unlocked: {} };
    state.hiddenProfessionState.unlocked = state.hiddenProfessionState.unlocked || {};
    if (!state.hiddenProfessionGraph || Object.values(state.hiddenProfessionGraph).some((graph) => Number(graph?.schemaVersion || 0) < 2)) state.hiddenProfessionGraph = Object.fromEntries(Object.entries(X.hiddenProfessions || {}).map(([id, def], index) => {
      const codex = (X.codexDefinitions || []).find((entry) => (entry.unlocksHiddenProfession || []).includes(id));
      const requirementTypes = ["npc", "location", "event", "weather", "fate", "beast", "behavior"];
      return [id, {
        schemaVersion: 2,
        professionId: id,
        requiredCodex: Number(def.requiresCodex || 7),
        nodes: [
          { id: "lead", type: "codex", action: "investigate", sourceId: codex?.id || null },
          { id: "crosscheck", type: requirementTypes[index % requirementTypes.length], action: "crosscheck", regionId: codex?.mapId || null },
          { id: "unlock", type: "event", action: "decrypt", requires: ["lead", "crosscheck"] }
        ],
        failure: { san: -2, result: "false_clue" }
      }];
    }));
    sim.seed = sim.seed || state.meta.saveId || "co_di_dien";
    sim.lastProcessedDay = Number(sim.lastProcessedDay || absoluteDay(state.gameClock));
    sim.nextEventSeq = Number(sim.nextEventSeq || 0);
    ["events", "regionState", "factionState", "diplomacy", "wars", "npcState", "hiddenRealms"].forEach((key) => { sim[key] = sim[key] || {}; });
    sim.scheduledTasks = Array.isArray(sim.scheduledTasks) ? sim.scheduledTasks : [];
    (D.WORLD_MAP?.regions || []).forEach((region) => {
      sim.regionState[region.id] = sim.regionState[region.id] || { weather: "quang", weatherUntilDay: sim.lastProcessedDay, lastEventDay: 0, activeEventId: null, corruptionLevel: 0 };
    });
    const factions = D.WORLD_MAP?.factions || D.FACTION_DATA?.factions || [];
    factions.slice(0, 40).forEach((faction) => {
      sim.factionState[faction.id] = sim.factionState[faction.id] || { factionId: faction.id, power: Math.max(1, Number(faction.scale || 3) * 10), resources: 100, stability: 70, reputationWithPlayer: 0, ownedNodeIds: [], traits: (faction.traits || []).slice(), lastInternalEventDay: 0, activeProjectId: null };
    });
    Object.keys(D.NPCS || {}).slice(0, 20).forEach((npcId, index) => {
      const home = Object.keys(D.LOCATIONS || {}).find((locId) => D.LOCATIONS[locId]?.npcs?.includes(npcId)) || state.homeLocationId || state.locationId;
      const definition = D.NPCS[npcId] || {}; const traits = Array.isArray(definition.traits) ? definition.traits : [];
      const scheduleType = traits.some((trait) => /du hành|thương|tuần tra|wander|patrol/i.test(String(trait))) ? "patrol" : index % 4 === 0 ? "patrol" : "static";
      sim.npcState[npcId] = sim.npcState[npcId] || { npcId, currentNodeId: home, homeNodeId: home, scheduleType, traits: traits.slice(), route: [home], routeIndex: 0, nextMoveDay: sim.lastProcessedDay + 3 + index % 4, status: "alive", factionId: definition.factionId || definition.faction_id || null, relationshipsWithNpcs: {}, memoryWithPlayer: [], mailbox: [], rumors: [], processedKeys: {} };
    });
    (X.hiddenRealms || []).forEach((realm) => {
      sim.hiddenRealms[realm.id] = sim.hiddenRealms[realm.id] || { id: realm.id, cycleIndex: 0, status: "sealed", opensDay: 0, closesDay: 0, claimedRewardKeys: [], competitorProgress: {} };
    });
    Object.values(sim.events).forEach((event) => {
      if (!worldEventTemplate(event.templateId) && event.status === "active") {
        event.status = "cancelled"; const region = sim.regionState[event.regionId]; if (region?.activeEventId === event.id) region.activeEventId = null;
        state.meta.migrationNotes ||= []; if (!state.meta.migrationNotes.includes("cancelled-world-event:" + event.templateId)) state.meta.migrationNotes.push("cancelled-world-event:" + event.templateId);
      }
    });
    state.relationships = state.relationships || {};
    state.relationshipEvents = state.relationshipEvents || {};
    state.professionState = state.professionState || { primaryId: null, professions: {} };
    state.contractBoard = state.contractBoard || { generatedDay: 0, offers: {}, accepted: {} };
    state.prisoners = state.prisoners || {};
    state.intel = state.intel || {};
    state.companion = state.companion || null;
    state.discoveries = state.discoveries || emptyDiscoveries();
    Object.keys(emptyDiscoveries()).forEach((key) => { state.discoveries[key] = state.discoveries[key] || {}; });
    state.reincarnationLegacy = state.reincarnationLegacy || { generation: 1, previousLives: [], pendingChoices: [], chosenLegacyId: null, tombs: [], marksRetained: false };
    state.playerMarks = state.playerMarks || {};
    state.placedFormations = state.placedFormations || {};
    state.auction = state.auction || { generatedDay: 0, lots: {} };
    state.coverIdentity = state.coverIdentity || null;
    state.guildProject = state.guildProject || null;
    state.guildProjectHistory = Array.isArray(state.guildProjectHistory) ? state.guildProjectHistory : [];
    state.pendingTribulation = state.pendingTribulation || null;
    state.pendingContestedOpportunity = state.pendingContestedOpportunity || null;
    state.activeHiddenRealm = state.activeHiddenRealm || null;
    state.codexState = state.codexState || {};
    // Migrate legacy saves: a codex fragment is valid only in its assigned
    // major region, and one fragment may be collected at most once per region.
    const codexByRegion = {};
    (X.codexDefinitions || []).forEach((definition) => {
      const record = state.codexState[definition.id];
      if (!record) return;
      record.regionId = record.regionId || definition.mapId;
      if (record.status === "collected") {
        if (codexByRegion[record.regionId]) record.status = "unknown";
        else codexByRegion[record.regionId] = definition.id;
      }
    });
    state.collectionRegistry = state.collectionRegistry || { beasts: {}, npcs: {}, entities: {}, rareNpcs: {} };
    state.achievements = state.achievements || {};
    state.professionState.secondaryId = state.professionState.secondaryId || null;
    state.professionState.selectionLocked = Boolean(state.professionState.primaryId && state.professionState.secondaryId);
    state.player.fateEvolutions = state.player.fateEvolutions || {};
    state.player.fateRelationships = state.player.fateRelationships || {};
    Object.entries(state.player.fateEvolutions).forEach(([fateId, evolution]) => {
      if (evolution?.status === "evolved" && !(X.fateEvolutionBranches || []).some((branch) => branch.id === evolution.branchId)) {
        evolution.status = "ready"; evolution.branchId = null; evolution.candidateBranchIds = (X.fateEvolutionBranches || []).map((branch) => branch.id);
      }
    });
    Object.keys(state.player.techniques || {}).forEach((id) => {
      const progress = state.player.techniques[id];
      progress.evolution = progress.evolution || { status: "locked", trialType: null, progress: 0, evolutionId: null, startedDay: null };
    });
    if (state.activeHiddenRealm) rebuildHiddenRealmNodes(state, state.activeHiddenRealm.realmId, state.activeHiddenRealm.cycleIndex);
    return state;
  }

  function codexProgress(state) {
    ensure(state); return Object.values(state.codexState).filter((entry) => entry.status === "collected").length;
  }
  function hiddenClueRequirement(state, node) {
    const type = node?.type;
    if (!type || type === "codex" || type === "event" && node.action === "decrypt") return { met: true, label: "Cổ Tịch đã đối chiếu" };
    if (type === "npc") return { met: Object.keys(state.relationships || {}).length > 0 || Object.keys(state.collectionRegistry?.npcs || {}).length > 0, label: "Gặp và ghi nhận ít nhất một NPC" };
    if (type === "location") return { met: (state.visitedLocations || []).length >= 2, label: "Đặt chân tới ít nhất hai địa điểm" };
    if (type === "event") return { met: Object.keys(state.discoveries?.worldEvents || {}).length > 0, label: "Chứng kiến một biến cố thế giới" };
    if (type === "weather") return { met: Object.values(state.worldSimulation?.regionState || {}).some((region) => region.weather && region.weather !== "quang"), label: "Chứng kiến thiên tượng khác Quang Đãng" };
    if (type === "fate") return { met: Object.values(state.player?.fateRelationships || {}).some((entry) => Number(entry.stage || 0) >= 1), label: "Dưỡng một Mệnh Số tới Giao Cảm" };
    if (type === "beast") return { met: Object.keys(state.collectionRegistry?.beasts || {}).length > 0, label: "Bắt sống hoặc thuần hóa một Dị Thú" };
    if (type === "behavior") return { met: Object.values(state.relationshipEvents || {}).some((events) => events.length > 0), label: "Tạo một ký ức quan hệ không trùng lặp" };
    return { met: false, label: "Điều kiện manh mối chưa hoàn tất" };
  }
  function hiddenProfessionClue(state, professionId, nodeId = "lead") {
    ensure(state);
    const def = X.hiddenProfessions?.[professionId];
    if (!def) return { success: false, reason: "Con đường nghề ẩn không tồn tại." };
    const key = professionId + ":" + nodeId;
    const progress = state.hiddenProfessionState;
    if (progress.clues[key]) return { success: false, reason: "Manh mối này đã được ghi nhớ." };
    const graph = state.hiddenProfessionGraph[professionId]; const node = graph?.nodes?.find((entry) => entry.id === nodeId) || graph?.nodes?.[0];
    const required = Number(graph?.requiredCodex || def.requiresCodex || 7);
    if (codexProgress(state) < required) return { success: false, reason: "Cần thu thập thêm Cổ Tịch Tà Thần để mở manh mối." };
    const day = absoluteDay(state.gameClock);
    if (node?.action === "crosscheck" && !progress.clues[professionId + ":lead"]) return { success: false, reason: "Cần có manh mối Cổ Tịch trước khi đối chiếu." };
    const requirement = hiddenClueRequirement(state, node);
    if (node?.action === "crosscheck" && !requirement.met) return { success: false, blocker: requirement.label, reason: "Chưa thể đối chiếu: " + requirement.label + "." };
    if (node?.action === "decrypt" && Number(progress.branches[professionId] || 0) < 2) return { success: false, reason: "Cần đối chiếu đủ hai nguồn manh mối trước khi giải mật." };
    const recentFailure = progress.failures.slice().reverse().find((failure) => failure.key === key);
    if (recentFailure && day < Number(recentFailure.retryDay || 0)) return { success: false, reason: "Manh mối đang nhiễu loạn; có thể thử lại vào ngày " + recentFailure.retryDay + "." };
    const roll = seeded(state, "hidden-clue:" + key, day, Number(progress.attempts[key] || 0));
    progress.attempts[key] = Number(progress.attempts[key] || 0) + 1;
    if (roll < 0.18) {
      progress.failures.push({ key, day, retryDay: day + 1, consequence: "lạc hướng" });
      state.player.san = clamp(Number(state.player.san || 0) - 2, 0, Number(state.player.sanMax || 100));
      history(state, "warn", "× Manh mối giả khiến Thanh Tỉnh suy giảm.");
      return { success: false, falseClue: true, reason: "Manh mối giả." };
    }
    progress.clues[key] = { professionId, nodeId, action: node?.action || "investigate", discoveredDay: day, source: nodeId === "lead" ? "Cổ Tịch" : nodeId === "crosscheck" ? "NPC và địa điểm" : "Biến cố giải mật", sourceId: node?.sourceId || null, regionId: node?.regionId || null };
    progress.branches[professionId] = (progress.branches[professionId] || 0) + 1;
    if (node?.action === "decrypt") progress.unlocked[professionId] = { day, clueKeys: Object.keys(progress.clues).filter((clueKey) => clueKey.startsWith(professionId + ":")) };
    history(state, "narr", "◇ Đã lần theo manh mối nghề ẩn: " + def.name + ".");
    return { success: true, clue: progress.clues[key] };
  }
  function techniqueDisplayInfo(state, techniqueId) {
    const technique = (E.getKnownTechniques(state) || []).find((entry) => entry.id === techniqueId);
    const progress = technique ? E.techniqueProgress(state, techniqueId) : null;
    const status = progress?.evolution?.status || "locked";
    const labels = { locked: "Chưa mở thí luyện", trial: "Đang thí luyện", ready: "Đủ điều kiện tiến hóa", evolved: "Đã tiến hóa" };
    return { id: techniqueId, name: technique?.name || "Công pháp chưa xác định", familyName: technique?.category || "Công pháp", masteryStage: Number(progress?.masteryStage || 0), status, statusLabel: labels[status] || "Trạng thái chưa xác định", progressLabel: progress ? (progress.nextThreshold == null ? "Đã đạt đại viên mãn" : progress.masteryExp + "/" + progress.nextThreshold) : "Chưa học" };
  }
  function inspectCodex(state, codexId, action = "investigate") {
    ensure(state); const def = (X.codexDefinitions || []).find((item) => item.id === codexId); if (!def) return { success: false, reason: "Không tìm thấy Cổ Tịch." };
    const record = state.codexState[codexId] ||= { id: codexId, status: "unknown", clues: [], firstSeenDay: null, collectedDay: null, regionId: def.mapId };
    record.regionId = def.mapId;
    const day = absoluteDay(state.gameClock);
    if (currentRegion(state) !== def.mapId) return { success: false, reason: "Mảnh Cổ Tịch này không thuộc đại vực hiện tại." };
    if (action === "investigate") {
      record.status = record.status === "unknown" ? "revealed" : record.status; record.firstSeenDay ||= day; record.clues = Array.from(new Set(record.clues.concat(["clue:" + codexId])));
      state.discoveries.codexClues["trace:" + codexId] ||= { id: "trace:" + codexId, codexId, source: "địa điểm " + def.mapId, day, confidence: 0.45, verified: false };
      history(state, "narr", "◇ Phát hiện dấu vết của " + def.name + "."); return { success: true, record };
    }
    if (action === "read" && ["revealed", "verified", "collected"].includes(record.status)) {
      record.clues = Array.from(new Set(record.clues.concat(["lore:" + codexId]))); state.discoveries.codexClues["lore:" + codexId] ||= { id: "lore:" + codexId, codexId, source: "văn tự Cổ Tịch", day, confidence: 0.7, verified: false };
      history(state, "sys", "§ Đọc " + def.name + ": " + def.clue); return { success: true, record };
    }
    if (action === "decrypt" && record.clues.includes("lore:" + codexId)) {
      record.status = "verified"; const clue = state.discoveries.codexClues["lore:" + codexId]; if (clue) { clue.verified = true; clue.confidence = 1; clue.verifiedDay = day; }
      history(state, "sys", "◇ Đã giải mật và đối chiếu " + def.name + "."); return { success: true, record };
    }
    if (action === "collect" && record.status === "verified") { record.status = "collected"; record.collectedDay = day; history(state, "sys", "✦ Thu thập " + def.name + " tại " + currentRegion(state) + "."); if (codexProgress(state) >= 7) { state.hiddenProfessionChoices = Object.keys(X.hiddenProfessions || {}); history(state, "sys", "✦ Bảy Cổ Tịch đã quy tụ; các nghề ẩn mở lựa chọn."); } return { success: true, record }; }
    return { success: false, reason: "Cần điều tra và đọc manh mối trước khi thu thập." };
  }
  function registerCollection(state, type, id, rarity = "thường") {
    ensure(state); const key = String(id); const source = type === "beasts" ? D.ENTITIES?.[key] || D.NPCS?.[key] : D.NPCS?.[key] || D.ENTITIES?.[key];
    const normalizedRarity = String(source?.rarity || rarity || "thường").toLowerCase();
    const collectionType = type === "npcs" && /hiếm|cực hiếm/.test(normalizedRarity) ? "rareNpcs" : type;
    const bucket = state.collectionRegistry[collectionType] ||= {}; const existing = bucket[key];
    if (existing) return existing;
    const entry = bucket[key] = { id: key, name: source?.name || E.I18n?.formatTarget(key, state) || "Thực thể chưa định danh", portrait: source?.portrait || source?.image || null, rarity: normalizedRarity, firstSeenDay: absoluteDay(state.gameClock), firstRegionId: currentRegion(state), sourceType: collectionType, status: "discovered", rewardClaimed: false, rewardKey: "collection:" + collectionType + ":" + key };
    state.collectionRewardKeys ||= {};
    if (/hiếm|cực hiếm/.test(normalizedRarity) && !state.collectionRewardKeys[entry.rewardKey]) {
      E.gainExp(state, normalizedRarity === "cực hiếm" ? 80 : 40); state.player.merit = Number(state.player.merit || 0) + (normalizedRarity === "cực hiếm" ? 3 : 1);
      state.collectionRewardKeys[entry.rewardKey] = true; entry.rewardClaimed = true;
      history(state, "sys", "✦ Gặp " + entry.name + " hiếm: nhận thưởng khám phá.");
    }
    return entry;
  }
  function unlockAchievements(state) {
    ensure(state); const defs = X.achievementDefinitions || {};
    Object.values(defs).forEach((def) => { let unlocked = false;
      if (def.type === "collection") unlocked = codexProgress(state) >= Number(def.target || 0);
      if (def.type === "profession") unlocked = Number(state.professionState.professions[def.professionId]?.masteryStage || 0) >= Number(def.masteryStage || 0);
      if (def.type === "equipment_set") unlocked = equipmentSetState(state, def).active;
      if (unlocked) state.achievements[def.id] ||= { unlockedDay: absoluteDay(state.gameClock), name: def.name };
    }); return state.achievements;
  }
  function equipmentSetState(state, definition) {
    const equipped = E.equippedItemIds(state.player.equipment).map((id) => ({ id, item: state.generatedItems?.[id] || D.ITEMS?.[id] })).filter((entry) => entry.item);
    const setId = String(definition.equipmentSetId || definition.setName || "");
    const matching = equipped.filter((entry) => String(entry.item.equipmentSetId || entry.item.setName || "") === setId);
    const occupiedCategories = new Set(matching.map((entry) => E.equipmentCategory?.(entry.item) || entry.item.kind));
    const requiredSlotsMet = (definition.requiredSlots || []).every((slot) => occupiedCategories.has(slot));
    return { setId, matching, equipped, active: matching.length >= Number(definition.requiredCount || 2) && matching.length === equipped.length && requiredSlotsMet };
  }
  function equipmentSetModifiers(state) {
    ensure(state);
    const result = { combatPowerMult: 0, cultivationMult: 0, fortuneFlat: 0, phyDef: 0, activeSets: [] };
    Object.values(X.achievementDefinitions || {}).filter((d) => d.type === "equipment_set").forEach((def) => {
      const set = equipmentSetState(state, def);
      if (set.active) {
        result.activeSets.push(set.setId); Object.entries(def.bonus || {}).forEach(([key, value]) => { result[key] = Number(result[key] || 0) + Number(value || 0); });
      }
    }); return result;
  }

  function seasonInfo(state) {
    const month = Number(state.gameClock?.currentMonth || 1);
    const index = Math.floor((month - 1) / 3) % 4;
    return (X.seasons || [])[index] || { id: "xuan", name: "Xuân", element: "moc" };
  }

  function activeRegionEvent(state, regionId = currentRegion(state)) {
    ensure(state);
    const id = state.worldSimulation.regionState[regionId]?.activeEventId;
    const event = id && state.worldSimulation.events[id];
    return event && event.status === "active" ? event : null;
  }

  function worldEventTemplate(id) { return (X.worldEvents || []).find((entry) => entry.id === id); }

  function getWorldModifiers(state, context = {}) {
    ensure(state);
    const result = { cultivationMult: 1, combatPowerByElement: {}, encounterChanceMult: 1, searchRiskDelta: 0, searchRewardMult: 1, marketPriceMult: 1, sanDrainMult: 1, travelRiskDelta: 0, qiRecoveryMult: 1, tags: [] };
    const equipment = equipmentSetModifiers(state); result.cultivationMult += equipment.cultivationMult || 0;
    const season = seasonInfo(state);
    if (context.element && context.element === season.element) result.combatPowerByElement[context.element] = 1.1;
    const regionId = context.regionId || currentRegion(state);
    const event = activeRegionEvent(state, regionId);
    if (event) {
      const template = worldEventTemplate(event.templateId);
      const phase = template?.phases?.[event.phaseIndex];
      const mods = phase?.modifiers || {};
      ["cultivationMult", "encounterChanceMult", "searchRewardMult", "marketPriceMult", "sanDrainMult", "qiRecoveryMult"].forEach((key) => { if (mods[key] != null) result[key] *= Number(mods[key]); });
      ["searchRiskDelta", "travelRiskDelta"].forEach((key) => { result[key] += Number(mods[key] || 0); });
      Object.entries(mods.combatPowerByElement || {}).forEach(([key, value]) => { result.combatPowerByElement[key] = Number(result.combatPowerByElement[key] || 1) * Number(value); });
      result.tags.push(template.category, template.id, phase?.id);
    }
    const weather = state.worldSimulation.regionState[regionId]?.weather;
    if (weather === "mua") { result.combatPowerByElement.hoa = Number(result.combatPowerByElement.hoa || 1) * 0.9; result.combatPowerByElement.thuy = Number(result.combatPowerByElement.thuy || 1) * 1.1; }
    if (weather === "loi_vu") result.combatPowerByElement.loi = Number(result.combatPowerByElement.loi || 1) * 1.2;
    Object.values(state.placedFormations || {}).filter((formation) => formation.nodeId === state.locationId && formation.expiresDay >= absoluteDay(state.gameClock)).forEach((formation) => {
      if (formation.purpose === "gather") result.cultivationMult *= 1.1;
      if (formation.purpose === "protect") result.sanDrainMult *= 0.85;
    });
    if (state.guildProject?.status === "completed" && state.guildProject.rewardUntilDay >= absoluteDay(state.gameClock)) {
      const project = (X.guildProjects || []).find((entry) => entry.id === state.guildProject.templateId);
      if (project?.reward?.cultivationMult) result.cultivationMult *= project.reward.cultivationMult;
      if (project?.reward?.sanDrainMult) result.sanDrainMult *= project.reward.sanDrainMult;
    }
    if (state.companion?.state === "active") {
      if (state.companion.passiveId === "scout") result.travelRiskDelta -= 0.04;
      if (state.companion.passiveId === "corrupted_scout") { result.travelRiskDelta -= 0.06; result.sanDrainMult *= 1.05; }
    }
    [state.professionState?.primaryId, state.professionState?.secondaryId].filter(Boolean).forEach((professionId) => {
      const passive = X.hiddenProfessions?.[professionId]?.passive || {};
      ["cultivationMult", "encounterChanceMult", "searchRewardMult", "marketPriceMult", "sanDrainMult", "qiRecoveryMult"].forEach((key) => { if (passive[key] != null) result[key] *= Number(passive[key]); });
      ["searchRiskDelta", "travelRiskDelta"].forEach((key) => { if (passive[key] != null) result[key] += Number(passive[key]); });
    });
    const day = absoluteDay(state.gameClock);
    if (Number(state.flags?.hiddenRouteGuidanceUntilDay || 0) >= day) result.travelRiskDelta -= 0.08;
    if (Number(state.flags?.hiddenHuntUntilDay || 0) >= day) result.searchRewardMult *= 1.12;
    if (Number(state.flags?.hiddenGateSealUntilDay || 0) >= day) result.encounterChanceMult *= 0.8;
    if (Number(state.flags?.namelessCultivationUntilDay || 0) >= day) result.cultivationMult *= 1.12;
    result.cultivationMult = clamp(result.cultivationMult, 0.5, 2);
    result.encounterChanceMult = clamp(result.encounterChanceMult, 0.5, 2);
    result.searchRewardMult = clamp(result.searchRewardMult, 0.5, 2);
    result.marketPriceMult = clamp(result.marketPriceMult, 0.6, 2.5);
    result.sanDrainMult = clamp(result.sanDrainMult, 0.5, 2);
    result.searchRiskDelta = clamp(result.searchRiskDelta, -0.3, 0.3);
    result.travelRiskDelta = clamp(result.travelRiskDelta, -0.3, 0.3);
    return result;
  }
  function setWeather(state, regionId, weather, durationDays = 1, source = "resolver") {
    ensure(state); const id = regionId || currentRegion(state); const region = state.worldSimulation.regionState[id];
    if (!region || !(X.weather || []).includes(weather)) return { success: false, reason: "Thời tiết hoặc khu vực không hợp lệ." };
    region.weather = weather; region.weatherUntilDay = absoluteDay(state.gameClock) + Math.max(1, Number(durationDays || 1)); region.weatherSource = source;
    return { success: true, regionId: id, weather, untilDay: region.weatherUntilDay };
  }
  function worldModifierPreview(state, context = {}) {
    const modifiers = getWorldModifiers(state, context); const id = context.regionId || currentRegion(state);
    return { ...modifiers, weatherLabel: E.I18n?.weather(state.worldSimulation.regionState[id]?.weather || "quang"), context: { ...context } };
  }

  function startWorldEvent(state, templateId, regionId = currentRegion(state), day = absoluteDay(state.gameClock)) {
    ensure(state);
    const template = worldEventTemplate(templateId);
    const region = state.worldSimulation.regionState[regionId];
    if (!template || !region || region.activeEventId) return { success: false, reason: "Khu vực đã có biến cố hoặc mẫu không hợp lệ." };
    const id = uid(state, "event");
    const phase = template.phases[0];
    state.worldSimulation.events[id] = { id, templateId, regionId, phaseIndex: 0, phaseStartedDay: day, phaseEndsDay: day + phase.durationDays, seed: hash(state.worldSimulation.seed + id), playerContribution: 0, choiceHistory: [], status: "active", outcomeId: null, announced: false };
    region.activeEventId = id; region.lastEventDay = day;
    discover(state, "worldEvents", templateId, "world_tick");
    if (regionId === currentRegion(state)) history(state, "warn", "☄ Điềm báo tại " + regionId + ": " + phase.text);
    return { success: true, event: state.worldSimulation.events[id] };
  }

  function resolveWorldEventChoice(state, eventId, choiceId) {
    ensure(state);
    const event = state.worldSimulation.events[eventId];
    const template = event && worldEventTemplate(event.templateId);
    const choice = template?.choices?.find((entry) => entry.id === choiceId);
    if (!event || event.status !== "active" || !choice) return { success: false, reason: "Lựa chọn biến cố không còn hiệu lực." };
    if (event.choiceHistory.some((entry) => entry.choiceId === choiceId)) return { success: false, reason: "Lựa chọn này đã được thực hiện." };
    for (const [id, quantity] of Object.entries(choice.itemCost || {})) if (Number(state.inventory?.[id] || 0) < quantity) return { success: false, reason: "Thiếu " + itemName(id) + "." };
    Object.entries(choice.itemCost || {}).forEach(([id, quantity]) => removeItem(state, id, quantity));
    if (choice.item) addItem(state, choice.item, choice.quantity || 1);
    if (choice.exp) E.gainExp(state, choice.exp);
    state.player.merit = Math.max(0, Number(state.player.merit || 0) + Number(choice.merit || 0));
    state.player.san = clamp(Number(state.player.san || 0) + Number(choice.san || 0), 0, state.player.maxSan || 100);
    state.player.corruptionRating = clamp(Number(state.player.corruptionRating || 0) + Number(choice.corruption || 0), 0, 100);
    event.playerContribution += Number(choice.contribution || 1);
    event.choiceHistory.push({ choiceId, day: absoluteDay(state.gameClock) });
    history(state, "sys", "§ " + template.name + " · " + choice.label + ". Đóng góp biến cố +" + Number(choice.contribution || 1) + ".");
    E.updateDerived(state);
    return { success: true, event, choice };
  }

  function advanceEvent(state, event, day) {
    const template = worldEventTemplate(event.templateId);
    if (!template || event.status !== "active" || day < event.phaseEndsDay) return;
    event.phaseIndex += 1;
    if (event.phaseIndex >= template.phases.length) {
      event.status = "resolved";
      event.outcomeId = event.playerContribution >= 4 ? "contained" : event.playerContribution >= 1 ? "survived" : "ignored";
      const region = state.worldSimulation.regionState[event.regionId];
      if (region?.activeEventId === event.id) region.activeEventId = null;
      if (event.regionId === currentRegion(state)) history(state, "sys", "◇ " + template.name + " kết thúc: " + event.outcomeId + ".");
      return;
    }
    const phase = template.phases[event.phaseIndex];
    event.phaseStartedDay = day; event.phaseEndsDay = day + phase.durationDays;
    if (event.regionId === currentRegion(state)) history(state, "warn", "☄ " + template.name + " · " + phase.text);
  }

  function updateWeather(state, regionId, day) {
    const region = state.worldSimulation.regionState[regionId];
    if (day < Number(region.weatherUntilDay || 0)) return;
    const list = X.weather || ["quang"];
    region.weather = list[Math.floor(seeded(state, "weather:" + regionId, day) * list.length)];
    region.weatherUntilDay = day + 1 + Math.floor(seeded(state, "weather-duration:" + regionId, day) * 3);
  }

  function updateDiplomacy(state, day) {
    if (day % 7 !== 0) return;
    const ids = Object.keys(state.worldSimulation.factionState).slice(0, 12);
    for (let i = 0; i < ids.length - 1; i += 1) {
      const a = ids[i], b = ids[i + 1], key = pairKey(a, b);
      const record = state.worldSimulation.diplomacy[key] || { factionA: a, factionB: b, tension: 0, status: "trung_lap", reasons: [], lastChangedDay: day };
      const drift = seeded(state, "diplomacy:" + key, day) < 0.5 ? -2 : 2;
      record.tension = clamp(record.tension + drift, -100, 100);
      const old = record.status;
      record.status = record.tension <= -60 ? "dong_minh" : record.tension >= 60 ? "thu_dich" : "trung_lap";
      if (old !== record.status) record.lastChangedDay = day;
      state.worldSimulation.diplomacy[key] = record;
      if (record.status === "thu_dich" && day - Number(record.warCooldownUntil || 0) >= 0 && !Object.values(state.worldSimulation.wars).some((war) => war.status === "active" && pairKey(war.factionA, war.factionB) === key)) {
        const warId = uid(state, "war");
        state.worldSimulation.wars[warId] = { id: warId, factionA: a, factionB: b, startedDay: day, frontNodeIds: [], scoreA: 0, scoreB: 0, status: "active", playerInterventions: [] };
      }
    }
  }

  function updateWars(state, day) {
    if (day % 3 !== 0) return;
    Object.values(state.worldSimulation.wars).filter((war) => war.status === "active").forEach((war) => {
      const a = state.worldSimulation.factionState[war.factionA], b = state.worldSimulation.factionState[war.factionB];
      if (!a || !b) { war.status = "ended"; return; }
      const roll = seeded(state, "war:" + war.id, day);
      if (roll < a.power / Math.max(1, a.power + b.power)) war.scoreA += 1; else war.scoreB += 1;
      if (Math.max(war.scoreA, war.scoreB) >= 10 && Math.abs(war.scoreA - war.scoreB) >= 3) {
        war.status = "ended"; war.endedDay = day;
        const relation = state.worldSimulation.diplomacy[pairKey(war.factionA, war.factionB)];
        if (relation) { relation.tension = 25; relation.status = "trung_lap"; relation.warCooldownUntil = day + 30; }
      }
    });
  }

  function updateNpcSchedules(state, day) {
    Object.values(state.worldSimulation.npcState).forEach((npc, index) => {
      if (npc.status !== "alive" || npc.scheduleType === "static" || day < npc.nextMoveDay) return;
      const homeLoc = D.LOCATIONS[npc.homeNodeId];
      const exits = Object.values(homeLoc?.exits || {}).filter((id) => D.LOCATIONS[id]);
      npc.route = [...new Set([npc.homeNodeId, ...exits])];
      npc.routeIndex = (Number(npc.routeIndex || 0) + 1) % Math.max(1, npc.route.length);
      npc.currentNodeId = npc.route[npc.routeIndex] || npc.homeNodeId;
      npc.nextMoveDay = day + 2 + index % 3;
    });
    const groups = {};
    Object.values(state.worldSimulation.npcState).filter((npc) => npc.status === "alive").forEach((npc) => { (groups[npc.currentNodeId] ||= []).push(npc); });
    Object.entries(groups).forEach(([nodeId, npcs]) => {
      if (npcs.length < 2 || seeded(state, "npc-meet:" + nodeId, day) >= 0.12) return;
      const a = npcs[0], b = npcs[1], pair = pairKey(a.npcId, b.npcId); state.worldSimulation.npcEncounters ||= {};
      const last = Object.values(state.worldSimulation.npcEncounters).filter((entry) => entry.pairKey === pair).sort((x, y) => y.day - x.day)[0];
      if (last && day - Number(last.day || 0) < 7) return;
      const encounterType = seeded(state, pair, day) < 0.5 ? "giao dịch" : "đối đầu"; const encounterKey = "npc-encounter:" + pair + ":" + day;
      state.worldSimulation.npcEncounters[encounterKey] = { key: encounterKey, pairKey: pair, day, npcA: a.npcId, npcB: b.npcId, nodeId, outcome: encounterType };
      a.relationshipsWithNpcs[b.npcId] = { type: encounterType, score: encounterType === "giao dịch" ? 1 : -1, day };
      b.relationshipsWithNpcs[a.npcId] = { type: encounterType, score: encounterType === "giao dịch" ? 1 : -1, day };
      const rumor = { key: encounterKey, day, text: encounterType === "giao dịch" ? "Một cuộc trao đổi tài nguyên vừa diễn ra." : "Mâu thuẫn giữa hai tu sĩ đang lan thành lời đồn." };
      a.rumors = (a.rumors || []).concat([rumor]).slice(-12); b.rumors = (b.rumors || []).concat([rumor]).slice(-12);
      if (nodeId === state.locationId) history(state, "narr", "◇ Ngươi chứng kiến " + (D.NPCS[npcs[0].npcId]?.name || "một tu sĩ") + " gặp " + (D.NPCS[npcs[1].npcId]?.name || "một tu sĩ khác") + ".");
    });
  }

  function refreshContracts(state, day = absoluteDay(state.gameClock)) {
    ensure(state);
    if (day - Number(state.contractBoard.generatedDay || 0) < 7 && Object.keys(state.contractBoard.offers).length) return state.contractBoard;
    state.contractBoard.offers = {};
    const templates = X.contractTemplates || [];
    const enemies = Object.keys(D.ENEMIES || {});
    const locations = Object.keys(D.LOCATIONS || {}).filter((id) => id !== state.locationId);
    const items = Object.keys(D.ITEMS || {}).filter((id) => D.ITEMS[id]?.kind !== "quest");
    for (let i = 0; i < Math.min(3, templates.length); i += 1) {
      const template = templates[(Math.floor(seeded(state, "contract-template", day, i) * templates.length) + i) % templates.length];
      const target = enemies[Math.floor(seeded(state, "contract-target", day, i) * Math.max(1, enemies.length))] || "di_qui";
      const targetLocationId = template.outcome === "travel" ? locations[Math.floor(seeded(state, "contract-location", day, i) * Math.max(1, locations.length))] : null;
      const targetItemId = template.outcome === "item" ? items[Math.floor(seeded(state, "contract-item", day, i) * Math.max(1, items.length))] : null;
      const id = "contract_" + day + "_" + i;
      state.contractBoard.offers[id] = { id, templateId: template.id, issuerFactionId: state.guildMembership?.guildId || null, targetEntityId: /kill|capture/.test(template.outcome) ? target : null, targetLocationId, targetItemId, regionId: currentRegion(state), generatedDay: day, expiresDay: day + 10, seed: hash(id + state.worldSimulation.seed), status: "offered", objectives: [], allowedOutcomes: [template.outcome], reward: copy(template.reward), acceptedAtDay: null };
    }
    state.contractBoard.generatedDay = day;
    return state.contractBoard;
  }

  function acceptContract(state, contractId) {
    ensure(state);
    const contract = state.contractBoard.offers[contractId];
    if (!contract || contract.status !== "offered" || contract.expiresDay < absoluteDay(state.gameClock)) return { success: false, reason: "Khế ước không còn hiệu lực." };
    contract.status = "accepted"; contract.acceptedAtDay = absoluteDay(state.gameClock); contract.acceptedItemQuantity = contract.targetItemId ? Number(state.inventory?.[contract.targetItemId] || 0) : 0;
    state.contractBoard.accepted[contract.id] = contract; delete state.contractBoard.offers[contract.id];
    history(state, "sys", "§ Đã nhận khế ước " + formatContractName(contract) + " · mục tiêu " + formatContractTarget(contract) + ".");
    return { success: true, contract };
  }

  function completeContract(state, contract, outcome) {
    if (!contract || contract.status !== "accepted" || !contract.allowedOutcomes.includes(outcome)) return false;
    contract.status = "completed"; contract.completedDay = absoluteDay(state.gameClock);
    const reward = contract.reward || {};
    if (reward.exp) E.gainExp(state, reward.exp);
    state.player.merit = Number(state.player.merit || 0) + Number(reward.merit || 0);
    if (reward.item) addItem(state, reward.item, reward.quantity || 1);
    history(state, "sys", "§ Hoàn thành khế ước " + (E.I18n?.formatContract(contract) || formatContractName(contract)) + ". Công Đức +" + Number(reward.merit || 0) + ".");
    return true;
  }

  function updateHiddenRealms(state, day) {
    (X.hiddenRealms || []).forEach((definition) => {
      const runtime = state.worldSimulation.hiddenRealms[definition.id];
      const cycle = Math.floor(day / definition.cycleDays);
      const cycleStart = cycle * definition.cycleDays + 1;
      const unlocked = definition.unlock.type === "visited" ? (state.visitedLocations || []).includes(definition.unlock.value) : definition.unlock.type === "path" ? state.player.pathId === definition.unlock.value : true;
      runtime.cycleIndex = cycle;
      runtime.opensDay = cycleStart;
      runtime.closesDay = cycleStart + definition.durationDays;
      runtime.status = unlocked && day >= runtime.opensDay && day <= runtime.closesDay ? "open" : unlocked && day === runtime.opensDay - 2 ? "omen" : "sealed";
    });
  }

  function processScheduledTasks(state, day) {
    const tasks = state.worldSimulation.scheduledTasks;
    tasks.filter((task) => task.status === "pending" && task.dueDay <= day).forEach((task) => {
      task.status = "resolved"; task.resolvedDay = day;
      if (task.type === "mail") {
        const npc = state.worldSimulation.npcState[task.npcId];
        if (npc?.status === "alive") {
          npc.mailbox.push({ message: task.message, itemId: task.itemId || null, day });
          recordRelationshipEvent(state, task.npcId, "sent_gift", { uniqueKey: task.id, deltas: { trust: task.itemId ? 4 : 1 } });
          history(state, "sys", "◇ Truyền thư đã tới " + (D.NPCS[task.npcId]?.name || "người nhận") + ".");
        } else if (task.itemId) addItem(state, task.itemId, 1);
      }
      if (task.type === "formation" && task.formationId && state.placedFormations[task.formationId]) {
        const formation = state.placedFormations[task.formationId];
        if (formation.purpose === "gather" && formation.charges > 0) { addItem(state, "linh_thach", 1); formation.charges -= 1; }
      }
      if (task.type === "bounty") {
        if (state._offlineSimulation) { task.status = "pending"; return; }
        const success = seeded(state, "bounty-resolve:" + task.id, day) < 0.6;
        task.outcome = success ? "located" : "escaped";
        state.flags.locatedBountyTargets = state.flags.locatedBountyTargets || {};
        if (success) state.flags.locatedBountyTargets[task.entityId] = day + 10;
        history(state, success ? "sys" : "warn", (success ? "◇ Thợ săn đã tìm thấy dấu vết của " : "× Treo thưởng mất dấu mục tiêu ") + task.entityId + ".");
      }
    });
    state.worldSimulation.scheduledTasks = tasks.filter((task) => task.status === "pending" || day - Number(task.resolvedDay || day) < 30);
  }

  function tick(state, day) {
    Object.values(state.worldSimulation.events).forEach((event) => advanceEvent(state, event, day));
    Object.keys(state.worldSimulation.regionState).forEach((regionId) => updateWeather(state, regionId, day));
    applyDailyWorldEffects(state, day);
    updateDiplomacy(state, day); updateWars(state, day); updateNpcSchedules(state, day); updateHiddenRealms(state, day); processScheduledTasks(state, day);
    refreshContracts(state, day); refreshAuction(state, day); updateAuction(state, day); updateFactionInternalEvents(state, day); updateTournament(state, day);
    Object.values(state.contractBoard.accepted).forEach((contract) => { if (contract.status === "accepted" && day > contract.expiresDay) { contract.status = "expired"; history(state, "warn", "× Khế ước " + contract.templateId + " đã quá hạn."); } });
    const regionId = currentRegion(state), region = state.worldSimulation.regionState[regionId];
    if (state.guildProject?.status === "active" && day > state.guildProject.endDay) { state.guildProject.status = "failed"; history(state, "warn", "× Công trình tông môn hết hạn trước khi hoàn thành."); }
    if (state.companion?.state === "active") {
      const localCorruption = Number(D.LOCATIONS?.[state.locationId]?.corruption || 0) + (activeRegionEvent(state) ? 1 : 0);
      state.companion.corruption = clamp(Number(state.companion.corruption || 0) + Math.max(0, localCorruption - 2), 0, 100);
      if (state.companion.corruption >= 60) { state.companion.state = "mutated"; state.companion.mutationPending = true; history(state, "warn", "× " + state.companion.customName + " đang Dị Biến; cần cứu chữa hoặc chấp nhận biến chất."); }
    }
    if (state.pendingContestedOpportunity && day > state.pendingContestedOpportunity.expiresDay) {
      state.pendingContestedOpportunity.status = "expired"; state.pendingContestedOpportunity = null;
      history(state, "warn", "× Cơ duyên tranh đoạt đã bị người khác lấy mất.");
    }
    if (state.counterIntel?.heat > 0) state.counterIntel.heat = Math.max(0, state.counterIntel.heat - 1);
    if (!state._offlineSimulation && region && !region.activeEventId && day - Number(region.lastEventDay || 0) >= 14 && seeded(state, "event-roll:" + regionId, day) < 0.06) {
      const pool = X.worldEvents || [];
      const template = pool[Math.floor(seeded(state, "event-pick:" + regionId, day) * pool.length)];
      if (template) startWorldEvent(state, template.id, regionId, day);
    }
  }

  function applyDailyWorldEffects(state, day) {
    const region = state.worldSimulation.regionState[currentRegion(state)]; const weather = region?.weather;
    if (weather === "mua") state.player.hp = Math.max(1, Number(state.player.hp || 1) - 1);
    if (weather === "suong") state.player.san = clamp(Number(state.player.san || 0) - 1, 0, Number(state.player.sanMax || 100));
    Object.values(state.worldSimulation.npcState || {}).forEach((npc) => {
      if (npc.status !== "alive") return;
      const npcRegionId = D.WORLD_MAP?.locations?.[npc.currentNodeId]?.region || D.LOCATIONS?.[npc.currentNodeId]?.region || currentRegion(state);
      const npcWeather = state.worldSimulation.regionState[npcRegionId]?.weather || "quang";
      npc.worldCondition = npcWeather;
      if (npcWeather === "mua") npc.scheduleDelayDays = 1;
      if (npcWeather === "loi_vu") npc.eventMood = "cảnh giác";
      if (npcWeather === "linh_phong") npc.eventMood = "du hành";
      npc.lastWorldPhaseDay = day;
      resolveNpcWorldReaction(state, npc.npcId, { day, weather: npcWeather, regionId: npcRegionId });
    });
  }
  function npcWorldContext(state, npcId) {
    ensure(state); const npc = state.worldSimulation.npcState?.[npcId];
    if (!npc) return { npcId, found: false, weather: "quang", mood: "không rõ", regionId: null, relationship: null, mailbox: 0, rumors: [] };
    const regionId = D.WORLD_MAP?.locations?.[npc.currentNodeId]?.region || D.LOCATIONS?.[npc.currentNodeId]?.region || currentRegion(state);
    const region = state.worldSimulation.regionState?.[regionId];
    const wars = Object.values(state.worldSimulation.wars || {}).filter((war) => war.status === "active" && (!npc.factionId || war.factionA === npc.factionId || war.factionB === npc.factionId));
    return { npcId, found: true, nodeId: npc.currentNodeId, factionId: npc.factionId || null, weather: region?.weather || npc.worldCondition || "quang", mood: npc.eventMood || "bình thường", regionId, relationship: state.relationships?.[npcId] || null, mailbox: npc.mailbox?.length || 0, rumors: copy(npc.rumors || []), activeEventId: region?.activeEventId || null, warIds: wars.map((war) => war.id) };
  }
  function resolveNpcWorldReaction(state, npcId, context = {}) {
    ensure(state); const npc = state.worldSimulation.npcState?.[npcId]; if (!npc || npc.status !== "alive") return { success: false };
    const day = Number(context.day || absoluteDay(state.gameClock)); const weather = context.weather || npc.worldCondition || "quang";
    const key = "npc-reaction:" + npcId + ":" + String(day) + ":" + weather;
    npc.processedKeys ||= {}; if (npc.processedKeys[key]) return { success: false, skipped: true };
    npc.processedKeys[key] = day;
    Object.keys(npc.processedKeys).forEach((processedKey) => { if (Number(npc.processedKeys[processedKey]) < day - 30) delete npc.processedKeys[processedKey]; });
    npc.recentWorldReaction = weather === "mua" ? "trú mưa" : weather === "loi_vu" ? "cảnh giới lôi vũ" : weather === "linh_phong" ? "theo linh phong du hành" : "trao đổi tin tức";
    if (weather === "linh_phong") npc.scheduleDelayDays = Math.max(0, Number(npc.scheduleDelayDays || 0) - 1);
    if (weather === "loi_vu") npc.memoryWithPlayer = (npc.memoryWithPlayer || []).concat([{ type: "world_reaction", day, text: "Cảnh giác trước Lôi Vũ" }]).slice(-20);
    const faction = npc.factionId && state.worldSimulation.factionState[npc.factionId];
    if (faction && weather === "loi_vu") faction.stability = clamp(Number(faction.stability || 0) - 1, 0, 100);
    if (faction && weather === "linh_phong") faction.resources = clamp(Number(faction.resources || 0) + 1, 0, 200);
    npc.rumors ||= [];
    if (!state._offlineSimulation && day % 7 === 0 && !npc.rumors.some((rumor) => rumor.key === key)) npc.rumors.push({ key, day, text: "Thiên tượng " + (E.I18n?.weather(weather) || weather) + " đang đổi vận trong vùng." });
    if (npc.rumors.length > 12) npc.rumors.splice(0, npc.rumors.length - 12);
    return { success: true, npcId, reaction: npc.recentWorldReaction, processedKey: key };
  }

  function updateFactionInternalEvents(state, day) {
    if (day % 30 !== 0) return;
    Object.values(state.worldSimulation.factionState).forEach((faction, index) => {
      if (day - Number(faction.lastInternalEventDay || 0) < 30) return;
      const roll = seeded(state, "faction-internal:" + faction.factionId, day, index);
      if (roll < 0.15) { faction.resources = clamp(faction.resources - 8, 0, 200); faction.stability = clamp(faction.stability - 5, 0, 100); faction.lastInternalEvent = "suy_tan"; }
      else if (roll > 0.88) { faction.resources = clamp(faction.resources + 8, 0, 200); faction.stability = clamp(faction.stability + 5, 0, 100); faction.lastInternalEvent = "troi_day"; }
      else return;
      faction.lastInternalEventDay = day;
      discover(state, "factions", faction.factionId, "world_tick");
    });
  }

  function updateTournament(state, day) {
    const tournament = state.worldSimulation.tournament;
    if (!tournament && day % 120 === 0) {
      state.worldSimulation.tournament = { id: "tournament_" + day, startDay: day, endDay: day + 10, status: "open", roundsWon: 0, joined: false };
      history(state, "sys", "✦ Tông Môn Đại Hội đã khai mạc, kéo dài 10 ngày.");
    } else if (tournament?.status === "open" && day > tournament.endDay) tournament.status = "closed";
  }

  function joinTournament(state) {
    ensure(state); const tournament = state.worldSimulation.tournament;
    if (!state.guildMembership) return { success: false, reason: "Cần là đệ tử tông môn." };
    if (!tournament || tournament.status !== "open") return { success: false, reason: "Đại Hội chưa mở." };
    if (tournament.joined) return { success: false, reason: "Đã tham dự Đại Hội." };
    tournament.joined = true;
    const wins = Math.floor(seeded(state, "tournament:" + tournament.id, absoluteDay(state.gameClock), state.player.basePhy + state.player.baseMag) * 4);
    tournament.roundsWon = wins; E.gainExp(state, wins * 20); state.guildMembership.contribution += wins * 10;
    history(state, "sys", "✦ Tông Môn Đại Hội: thắng " + wins + "/3 vòng."); return { success: true, wins };
  }

  function updateAuction(state, day) {
    Object.values(state.auction?.lots || {}).forEach((lot, index) => {
      if (lot.status !== "active") return;
      if (day <= lot.endDay && lot.bidderId === state.player.id && seeded(state, "npc-bid:" + lot.id, day, index) < 0.3) {
        const npcBid = lot.currentBid + 1 + Math.floor(seeded(state, "npc-bid-value:" + lot.id, day, index) * 5);
        addItem(state, "linh_thach", lot.currentBid); lot.currentBid = npcBid; lot.bidderId = "npc";
      }
      if (day > lot.endDay) {
        lot.status = "closed";
        if (lot.bidderId === state.player.id && !lot.delivered) { addItem(state, lot.itemId, 1); lot.delivered = true; history(state, "sys", "✦ Thắng đấu giá: " + itemName(lot.itemId) + "."); }
      }
    });
  }

  function simulateWorldUntil(state, targetDay) {
    ensure(state);
    const sim = state.worldSimulation;
    const target = Math.max(sim.lastProcessedDay, Math.floor(Number(targetDay || absoluteDay(state.gameClock))));
    const start = sim.lastProcessedDay;
    if (target <= start) return { processed: 0 };
    const detailedStart = Math.max(start + 1, target - 29);
    if (detailedStart > start + 1) {
      simulateWorldAggregate(state, start + 1, detailedStart - 1);
      sim.lastProcessedDay = detailedStart - 1;
    }
    for (let day = detailedStart; day <= target; day += 1) tick(state, day);
    sim.lastProcessedDay = target;
    return { processed: target - start, detailed: target - detailedStart + 1 };
  }
  function ensureWorldSimulation(state) { ensure(state); return state.worldSimulation; }
  function scheduleWorldTask(state, task) {
    ensure(state);
    if (!task?.id || !task?.type || !Number.isFinite(Number(task.dueDay))) return { success: false, reason: "Công việc thế giới cần mã, loại và ngày thực hiện hợp lệ." };
    const list = state.worldSimulation.scheduledTasks;
    const existing = list.find((entry) => entry.id === String(task.id));
    if (existing) return { success: existing.status === "pending", duplicate: true, task: existing, reason: "Công việc đã tồn tại." };
    const record = { ...copy(task), id: String(task.id), dueDay: Math.max(absoluteDay(state.gameClock), Math.floor(Number(task.dueDay))), status: "pending", createdDay: absoluteDay(state.gameClock) };
    list.push(record); return { success: true, task: record };
  }
  function cancelWorldTask(state, taskId) {
    ensure(state); const task = state.worldSimulation.scheduledTasks.find((entry) => entry.id === String(taskId) && entry.status === "pending");
    if (!task) return { success: false, reason: "Không tìm thấy công việc đang chờ." };
    task.status = "cancelled"; task.cancelledDay = absoluteDay(state.gameClock); return { success: true, task };
  }
  function processScheduledWorldTasks(state, day) {
    ensure(state); const targetDay = Math.max(state.worldSimulation.lastProcessedDay, Math.floor(Number(day || absoluteDay(state.gameClock))));
    processScheduledTasks(state, targetDay); return { success: true, processedThroughDay: targetDay, tasks: state.worldSimulation.scheduledTasks };
  }
  function worldSimulationSummary(state) {
    ensure(state); const pending = state.worldSimulation.scheduledTasks.filter((task) => task.status === "pending");
    return { lastProcessedDay: state.worldSimulation.lastProcessedDay, regions: copy(state.worldSimulation.regionState), activeEvents: copy(Object.values(state.worldSimulation.events).filter((event) => event.status === "active")), wars: copy(Object.values(state.worldSimulation.wars).filter((war) => war.status === "active")), pendingTasks: pending.length, nextTaskDay: pending.length ? Math.min(...pending.map((task) => Number(task.dueDay))) : null };
  }
  function simulateWorldAggregate(state, startDay, endDay) {
    ensure(state); if (endDay < startDay) return { processed: 0 };
    const sim = state.worldSimulation;
    Object.values(sim.events).forEach((event) => { while (event.status === "active" && event.phaseEndsDay <= endDay) advanceEvent(state, event, event.phaseEndsDay); });
    processScheduledTasks(state, endDay);
    Object.values(state.contractBoard.accepted).forEach((contract) => { if (contract.status === "accepted" && contract.expiresDay < endDay) contract.status = "expired"; });
    Object.values(state.auction?.lots || {}).forEach((lot) => { if (lot.status === "active" && lot.endDay < endDay) { lot.status = "closed"; if (lot.bidderId === state.player.id && !lot.delivered) { addItem(state, lot.itemId, 1); lot.delivered = true; } } });
    for (let day = Math.ceil(startDay / 3) * 3, rounds = 0; day <= endDay && rounds < 20 && Object.values(sim.wars).some((war) => war.status === "active"); day += 3, rounds += 1) updateWars(state, day);
    const weeklyDay = endDay - (endDay % 7); if (weeklyDay >= startDay) updateDiplomacy(state, weeklyDay);
    updateHiddenRealms(state, endDay); Object.keys(sim.regionState).forEach((regionId) => updateWeather(state, regionId, endDay)); updateNpcSchedules(state, endDay);
    if (state.guildProject?.status === "active" && endDay > state.guildProject.endDay) state.guildProject.status = "failed";
    return { processed: endDay - startDay + 1 };
  }

  function recordRelationshipEvent(state, npcId, tag, options = {}) {
    ensure(state);
    const uniqueKey = options.uniqueKey || tag + ":" + absoluteDay(state.gameClock);
    const events = state.relationshipEvents[npcId] ||= [];
    if (events.some((event) => event.uniqueKey === uniqueKey)) return { success: false, duplicate: true };
    const defaults = {
      talked: { trust: 1, respect: 1 }, sent_gift: { trust: 3 }, saved: { trust: 12, respect: 8 }, threatened: { fear: 12, suspicion: 8 }, kept_promise: { trust: 8 }, broke_promise: { trust: -12, suspicion: 12 }, shared_reward: { trust: 7, respect: 4 }, used_forbidden_art: { fear: 5, suspicion: 10 }, supported_faction: { respect: 6 }, abandoned: { trust: -8 }
    };
    const deltas = { ...(defaults[tag] || {}), ...(options.deltas || {}) };
    const relation = state.relationships[npcId] ||= { trust: 0, fear: 0, respect: 0, suspicion: 0 };
    Object.entries(deltas).forEach(([key, value]) => { relation[key] = clamp(Number(relation[key] || 0) + Number(value), 0, 100); });
    const event = { id: uid(state, "relation"), tag, day: absoluteDay(state.gameClock), locationId: state.locationId, questId: options.questId || null, outcome: options.outcome || null, deltas, uniqueKey };
    events.push(event); if (events.length > 20) events.shift();
    const npcRuntime = state.worldSimulation.npcState[npcId]; if (npcRuntime) { npcRuntime.memoryWithPlayer.push(event); if (npcRuntime.memoryWithPlayer.length > 10) npcRuntime.memoryWithPlayer.shift(); }
    return { success: true, relation, event };
  }

  function relationshipTier(state, npcId) {
    ensure(state); const r = state.relationships[npcId] || { trust: 0, fear: 0, respect: 0, suspicion: 0 };
    if (r.suspicion >= 70) return { id: "hostile", label: "Đề Phòng" };
    if (r.trust >= 60 && r.suspicion < 40) return { id: "trusted", label: "Tín Hữu" };
    if (r.respect >= 50) return { id: "respected", label: "Kính Trọng" };
    if (r.fear >= 50) return { id: "afraid", label: "Kính Sợ" };
    return { id: "known", label: "Sơ Giao" };
  }

  function sendMail(state, npcId, message, itemId = null) {
    ensure(state); const npc = state.worldSimulation.npcState[npcId];
    if (!npc || npc.status !== "alive") return { success: false, reason: "Không thể xác định người nhận." };
    if (itemId && Number(state.inventory?.[itemId] || 0) < 1) return { success: false, reason: "Không có vật phẩm gửi kèm." };
    const cost = 2 + (currentRegion(state) === (D.WORLD_MAP?.locations?.[npc.currentNodeId]?.region || currentRegion(state)) ? 0 : 3);
    if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch truyền thư." };
    removeItem(state, "linh_thach", cost); if (itemId) removeItem(state, itemId, 1);
    const task = { id: uid(state, "mail"), type: "mail", npcId, message: String(message || "Bình an.").slice(0, 120), itemId, dueDay: absoluteDay(state.gameClock) + 1 + (cost > 2 ? 2 : 0), status: "pending" };
    scheduleWorldTask(state, task); history(state, "sys", "§ Đã gửi truyền thư, tốn " + cost + " Linh Thạch.");
    return { success: true, task };
  }

  function discover(state, category, id, source, level = 1) {
    ensure(state); const bucket = state.discoveries[category] ||= {};
    const entry = bucket[id] ||= { firstSeenDay: absoluteDay(state.gameClock), level: 0, source, clueIds: [], completedSetIds: [] };
    entry.level = Math.max(entry.level, clamp(level, 1, 3)); return entry;
  }

  function divine(state) {
    ensure(state);
    if (Number(state.inventory?.linh_thach || 0) < 3) return { success: false, reason: "Cần 3 Linh Thạch để xem quẻ." };
    removeItem(state, "linh_thach", 3); const day = absoluteDay(state.gameClock);
    const directions = ["Bắc", "Nam", "Đông", "Tây"];
    const direction = directions[Math.floor(seeded(state, "divination", day) * directions.length)];
    const event = activeRegionEvent(state);
    const text = event ? "Điềm quẻ hướng về " + direction + "; biến cố hiện tại đang che lấp một cơ duyên." : "Điềm quẻ hướng về " + direction + "; trong ba ngày sẽ có dấu vết đáng chú ý.";
    state.divinationHint = { text, direction, acquiredDay: day, expiresDay: day + 3, confidence: state.player.comprehension >= 60 ? "rõ" : "mơ hồ" };
    history(state, "sys", "◇ Xem Quẻ: " + text); return { success: true, hint: state.divinationHint };
  }

  function survivalProjection(state) {
    ensure(state); const samples = (state.history || []).filter((entry) => /Tu vi \+/.test(entry.text || "")).slice(-20);
    const gains = samples.map((entry) => Number((entry.text.match(/Tu vi \+(\d+)/) || [])[1] || 0)).filter(Boolean);
    const avg = gains.length ? gains.reduce((sum, value) => sum + value, 0) / gains.length : 0;
    const next = D.REALMS?.find((realm) => Number(realm.level) === E.cultivationTier(state) + 1);
    const needed = Math.max(0, Number(next?.expRequired || next?.requiredExp || 100) - Number(state.player.exp || 0));
    const projectedDays = avg > 0 ? Math.ceil(needed / avg) : Infinity;
    return { sampleCount: gains.length, averageExp: avg, projectedDays, lifespan: Number(state.player.lifespan || 0), warning: gains.length >= 3 && projectedDays > Number(state.player.lifespan || 0) * 0.8 };
  }

  function setPlayerMark(state, text) {
    ensure(state); const clean = String(text || "").replace(/[<>]/g, "").trim().slice(0, 120);
    if (!clean) return { success: false, reason: "Dấu vết không được để trống." };
    state.playerMarks[state.locationId] = { text: clean, day: absoluteDay(state.gameClock), generation: state.reincarnationLegacy.generation };
    history(state, "sys", "◇ Ngươi để lại một dấu vết tại đây."); return { success: true };
  }

  function professionRecord(state, id) {
    ensure(state); const definition = professionDefinition(id); if (!definition) return null;
    return state.professionState.professions[id] ||= { masteryExp: 0, masteryStage: 0, recipesKnown: (definition.recipes || []).slice(0, 1), specializations: [], lastActionDay: 0 };
  }
  function hasProfession(state, id) { return state.professionState?.primaryId === id || state.professionState?.secondaryId === id; }
  function professionAvailability(state, id) {
    ensure(state); const definition = professionDefinition(id);
    if (!definition) return { visible: false, selectable: false, reason: "Nghề không tồn tại." };
    const hidden = Boolean(X.hiddenProfessions?.[id]);
    const hasClue = Object.keys(state.hiddenProfessionState.clues || {}).some((key) => key.startsWith(id + ":"));
    if (hidden && !hasClue) return { visible: false, selectable: false, reason: "Con đường này chưa lộ manh mối." };
    if (hidden && !state.hiddenProfessionState.unlocked[id]) return { visible: true, selectable: false, reason: "Chưa hoàn tất đồ thị manh mối nghề ẩn." };
    if (state.professionState.primaryId === id) return { visible: true, selectable: false, selected: true, slot: "primaryId", reason: "Đã cố định làm nghề chính." };
    if (state.professionState.secondaryId === id) return { visible: true, selectable: false, selected: true, slot: "secondaryId", reason: "Đã cố định làm nghề phụ." };
    if (state.professionState.selectionLocked) return { visible: true, selectable: false, reason: "Bộ nghề chính/phụ đã khóa vĩnh viễn." };
    return { visible: true, selectable: true, slot: state.professionState.primaryId ? "secondaryId" : "primaryId", reason: state.professionState.primaryId ? "Còn một lượt chọn nghề phụ." : "Chưa chọn nghề chính." };
  }
  function practiceProfession(state, id) {
    ensure(state); if (!hasProfession(state, id)) return { success: false, reason: "Chỉ có thể rèn luyện nghề chính hoặc nghề phụ đã cố định." };
    const record = professionRecord(state, id); if (!record) return { success: false, reason: "Nghề không hợp lệ." };
    if (Number(state.player.stamina || 0) < 5) return { success: false, reason: "Cần 5 Thể Lực." };
    state.player.stamina -= 5; const gain = state.professionState.primaryId === id ? 12 : 3;
    record.masteryExp += gain; record.masteryStage = record.masteryExp >= 300 ? 3 : record.masteryExp >= 100 ? 2 : record.masteryExp >= 25 ? 1 : 0; record.lastActionDay = absoluteDay(state.gameClock);
    history(state, "sys", "§ " + professionDefinition(id).name + " Thục Luyện +" + gain + "."); return { success: true, gain, record };
  }
  function chooseProfessionLocked(state, id) {
    ensure(state); const availability = professionAvailability(state, id);
    if (!availability.visible || !availability.selectable) return { success: false, reason: availability.reason };
    const record = professionRecord(state, id); if (!record) return { success: false, reason: "Nghề không hợp lệ." };
    const slot = availability.slot;
    state.professionState[slot] = id;
    if (X.hiddenProfessions?.[id]) {
      state.professionState.hiddenIds = Array.isArray(state.professionState.hiddenIds) ? state.professionState.hiddenIds : [];
      if (!state.professionState.hiddenIds.includes(id)) state.professionState.hiddenIds.push(id);
      state.player.hiddenProfession = id;
      state.player.hiddenProfessionCandidate = id;
    }
    state.professionState.selectionLocked = Boolean(state.professionState.primaryId && state.professionState.secondaryId);
    const starter = Object.values(professionCatalog()).find((item) => item.professionId === id); if (starter) addItem(state, starter.id, 1);
    history(state, "sys", "§ Chọn nghề " + (slot === "primaryId" ? "chính" : "phụ") + ": " + professionDefinition(id).name + "." + (state.professionState.selectionLocked ? " Bộ nghề đã khóa vĩnh viễn." : "")); return { success: true, record, slot, selectionLocked: state.professionState.selectionLocked };
  }
  function useProfessionItem(state, itemId) {
    ensure(state);
    const item = professionCatalog()[itemId];
    if (!item) return { success: false, reason: "Vật phẩm nghề không hợp lệ." };
    if (Number(state.inventory?.[itemId] || 0) < 1) return { success: false, reason: "Không có vật phẩm này trong hành trang." };
    const ids = [state.professionState?.primaryId, state.professionState?.secondaryId, ...(state.professionState?.hiddenIds || [])];
    if (!ids.includes(item.professionId)) return { success: false, reason: "Nghề nghiệp hiện tại chưa thể sử dụng vật phẩm này." };
    const key = item.action || itemId;
    const record = state.professionItemState[key] || { uses: 0, charges: Number(item.charges || 1), lastUseDay: -999999, effects: {} };
    if (record.charges == null) record.charges = Number(item.charges || 1);
    if (absoluteDay(state.gameClock) < Number(record.lastUseDay || -999999) + Number(item.cooldownDays || 0)) return { success: false, reason: "Vật phẩm nghề đang hồi phục linh lực." };
    if (Number(record.charges || 0) <= 0) return { success: false, reason: "Vật phẩm nghề đã dùng hết số lần ghi chép." };
    record.uses += 1; record.charges -= 1; record.lastUseDay = absoluteDay(state.gameClock);
    Object.assign(record.effects, item.effect || {}); state.professionItemState[key] = record;
    history(state, "sys", "§ Đã sử dụng " + item.name + " · hiệu quả nghề nghiệp được ghi nhận.");
    return { success: true, itemId, action: key, remainingCharges: record.charges, effects: record.effects };
  }
  function rechargeProfessionItem(state, itemId) {
    ensure(state);
    const item = professionCatalog()[itemId];
    if (!item || Number(state.inventory?.[itemId] || 0) < 1) return { success: false, reason: "Không có vật phẩm nghề để bổ sung linh lực." };
    const ids = [state.professionState?.primaryId, state.professionState?.secondaryId];
    if (!ids.includes(item.professionId)) return { success: false, reason: "Nghề nghiệp hiện tại không phù hợp với vật phẩm này." };
    const recipe = item.recipe || {};
    for (const [materialId, quantity] of Object.entries(recipe)) if (Number(state.inventory?.[materialId] || 0) < Number(quantity)) return { success: false, reason: "Thiếu " + itemName(materialId) + " để bổ sung linh lực." };
    Object.entries(recipe).forEach(([materialId, quantity]) => removeItem(state, materialId, Number(quantity)));
    const key = item.action || itemId;
    const record = state.professionItemState[key] || { uses: 0, lastUseDay: -999999, effects: {} };
    record.charges = Number(item.charges || 1);
    state.professionItemState[key] = record;
    history(state, "sys", "§ Đã bổ sung linh lực cho " + item.name + ".");
    return { success: true, itemId, charges: record.charges };
  }
  function useHiddenProfessionAction(state, professionId) {
    ensure(state); const definition = X.hiddenProfessions?.[professionId];
    if (!definition || !hasProfession(state, professionId)) return { success: false, reason: "Con đường nghề ẩn này chưa được cố định." };
    state.hiddenProfessionActions ||= {}; const day = absoluteDay(state.gameClock); const record = state.hiddenProfessionActions[professionId] || { uses: 0, lastUseDay: -999999 };
    if (day < Number(record.lastUseDay || -999999) + Number(definition.cooldownDays || 0)) return { success: false, reason: "Năng lực nghề ẩn đang trong thời gian tĩnh dưỡng." };
    const costs = definition.actionCost || {}; const pools = { san: "san", stamina: "stamina", qi: "qi", merit: "merit" };
    for (const [key, amount] of Object.entries(costs)) if (Number(state.player[pools[key]] || 0) < Number(amount)) return { success: false, reason: "Không đủ tài nguyên để thi triển " + definition.actionName + "." };
    Object.entries(costs).forEach(([key, amount]) => { state.player[pools[key]] = Math.max(0, Number(state.player[pools[key]] || 0) - Number(amount)); });
    if (professionId === "nguoi_giai_mong") state.player.san = clamp(Number(state.player.san || 0) + 6, 0, Number(state.player.maxSan || 100));
    if (professionId === "doc_gia_co_tich") { const clue = Object.values(state.discoveries.codexClues || {}).find((entry) => !entry.verified); if (clue) clue.confidence = clamp(Number(clue.confidence || 0) + 0.25, 0, 1); }
    if (professionId === "nguoi_dan_duong") state.flags.hiddenRouteGuidanceUntilDay = day + 3;
    if (professionId === "tho_san_di_trieu") state.flags.hiddenHuntUntilDay = day + 3;
    if (professionId === "nguoi_giu_cua") state.flags.hiddenGateSealUntilDay = day + 3;
    if (professionId === "thay_tuong_menh") state.divinationHint = { text: "Một mệnh tuyến ẩn đang hội tụ quanh khu vực hiện tại.", direction: "Theo linh cơ", acquiredDay: day, expiresDay: day + 4, confidence: "rõ" };
    if (professionId === "hanh_gia_vo_danh") state.flags.namelessCultivationUntilDay = day + 3;
    record.uses += 1; record.lastUseDay = day; record.lastResult = definition.actionName; state.hiddenProfessionActions[professionId] = record;
    const mastery = professionRecord(state, professionId); mastery.masteryExp += 12; mastery.masteryStage = mastery.masteryExp >= 300 ? 3 : mastery.masteryExp >= 100 ? 2 : mastery.masteryExp >= 25 ? 1 : 0; mastery.lastActionDay = day;
    history(state, "sys", "✦ Thi triển nghề ẩn: " + definition.actionName + "."); E.updateDerived(state);
    return { success: true, professionId, record };
  }
  function brewPill(state, recipeId = "tu_khi_dan") {
    ensure(state); if (!hasProfession(state, "luyen_dan")) return { success: false, reason: "Cần cố định nghề Luyện Đan Sư." };
    const record = professionRecord(state, "luyen_dan"); if (!record) return { success: false };
    const recipeCosts = { tu_khi_dan: { linh_thao: 2 }, hoan_huyet_dan: { linh_thao: 3 }, dien_tho_dan_ha: { linh_thao: 5 } };
    const recipe = recipeCosts[recipeId] || recipeCosts.tu_khi_dan;
    for (const [materialId, quantity] of Object.entries(recipe)) if (Number(state.inventory?.[materialId] || 0) < quantity) return { success: false, reason: "Thiếu " + itemName(materialId) + " (cần " + quantity + ")." };
    if (Number(state.player.stamina || 0) < 5) return { success: false, reason: "Cần 5 Thể Lực để luyện đan." };
    const toolBonus = Number(state.professionItemState?.ghi_nho_cong_thuc?.effects?.alchemyChance || 0);
    Object.entries(recipe).forEach(([materialId, quantity]) => removeItem(state, materialId, quantity)); const chance = clamp(0.45 + state.player.aptitude / 250 + record.masteryStage * 0.08 + toolBonus, 0.1, 0.95);
    const roll = seeded(state, "alchemy:" + state.meta.turn, absoluteDay(state.gameClock));
    practiceProfession(state, "luyen_dan");
    if (roll > chance) { history(state, "warn", "× Luyện đan thất bại, dược liệu hóa tro."); return { success: false, consumed: true }; }
    addItem(state, D.ITEMS?.[recipeId] ? recipeId : "tu_khi_dan", roll < chance * 0.15 ? 2 : 1);
    history(state, "sys", "§ Luyện thành " + itemName(D.ITEMS?.[recipeId] ? recipeId : "tu_khi_dan") + (roll < chance * 0.15 ? " · Hoàn Mỹ" : "") + "."); return { success: true, perfect: roll < chance * 0.15 };
  }

  function placeFormation(state, purpose = "gather") {
    ensure(state); if (!hasProfession(state, "tran_phap")) return { success: false, reason: "Cần cố định nghề Trận Pháp Sư." };
    const known = E.getKnownTechniques(state).find((technique) => technique.category === "tran_phap");
    if (!known) return { success: false, reason: "Chưa biết Công Pháp Trận Pháp." };
    if (Number(state.inventory?.linh_thach || 0) < 5) return { success: false, reason: "Cần 5 Linh Thạch." };
    if (Object.keys(state.placedFormations).length >= 3) return { success: false, reason: "Đã đạt giới hạn ba Trận Pháp." };
    removeItem(state, "linh_thach", 5); const id = uid(state, "formation"), day = absoluteDay(state.gameClock);
    const durationBonus = Number(state.professionItemState?.ghi_tran_van?.effects?.formationDuration || 0);
    state.placedFormations[id] = { id, techniqueId: known.id, ownerId: state.player.id, nodeId: state.locationId, createdDay: day, expiresDay: day + 7 + durationBonus, charges: 3, purpose };
    for (let i = 1; i <= 3; i += 1) scheduleWorldTask(state, { id: id + ":" + i, type: "formation", formationId: id, dueDay: day + i * 2 });
    history(state, "sys", "§ Đã đặt " + (purpose === "gather" ? "Tụ Linh Trận" : "Hộ Tâm Trận") + "."); return { success: true, formation: state.placedFormations[id] };
  }

  function readNpc(state, npcId) {
    ensure(state); if (!hasProfession(state, "tuong_su")) return { success: false, reason: "Cần cố định nghề Tướng Sư." };
    const record = professionRecord(state, "tuong_su"); if (!record) return { success: false };
    const npc = D.NPCS?.[npcId] || E.getEntity?.(npcId); if (!npc) return { success: false, reason: "Không có mục tiêu." };
    practiceProfession(state, "tuong_su");
    const success = seeded(state, "physiognomy:" + npcId, absoluteDay(state.gameClock), record.masteryExp) < clamp(0.4 + state.player.comprehension / 200, 0.4, 0.9);
    const clue = success ? "Khí tức: " + (npc.element || npc.alignment || npc.entity_type || "khó phân") : "Tướng mạo bị thiên cơ che lấp.";
    state.intel["face:" + npcId] = { id: "face:" + npcId, topicType: "npc", targetId: npcId, claim: clue, confidence: success ? 0.8 : 0.3, sourceId: "tuong_su", acquiredDay: absoluteDay(state.gameClock), expiresDay: absoluteDay(state.gameClock) + 30, verified: success };
    history(state, "sys", "◇ Xem tướng " + (npc.name || npcId) + ": " + clue); return { success, clue };
  }

  function ensureTechniqueTrials(state) {
    ensure(state);
    Object.entries(state.player.techniques || {}).forEach(([id, progress]) => {
      const choices = X.techniqueEvolutions?.[id];
      if (!choices?.length || Number(progress.masteryStage || 0) < 2 || progress.evolution?.status !== "locked") return;
      progress.evolution = { status: "trial", trialType: choices[0].trial || "cultivation", progress: 0, evolutionId: null, startedDay: absoluteDay(state.gameClock) };
      history(state, "sys", "✦ Công Pháp " + (E.getKnownTechniques(state).find((entry) => entry.id === id)?.name || id) + " mở Thí Luyện Tiến Hóa.");
    });
  }
  function advanceTechniqueTrials(state, eventType) {
    Object.entries(state.player.techniques || {}).forEach(([id, progress]) => {
      const evo = progress.evolution; if (!evo || evo.status !== "trial") return;
      if ((evo.trialType === "cultivation" && eventType === "cultivation") || (evo.trialType === "elite" && eventType === "elite")) evo.progress += 1;
      if (evo.progress >= (evo.trialType === "elite" ? 2 : 5)) { evo.status = "ready"; history(state, "sys", "◇ Thí Luyện Công Pháp " + id + " đã hoàn thành; có thể chọn nhánh tiến hóa."); }
    });
  }
  function chooseTechniqueEvolution(state, techniqueId, evolutionId) {
    ensure(state); const progress = state.player.techniques?.[techniqueId], choice = X.techniqueEvolutions?.[techniqueId]?.find((entry) => entry.id === evolutionId);
    if (!progress || progress.evolution?.status !== "ready" || !choice) return { success: false, reason: "Chưa thể chọn tiến hóa này." };
    progress.evolution.status = "chosen"; progress.evolution.evolutionId = evolutionId; progress.evolution.chosenAtDay = absoluteDay(state.gameClock);
    history(state, "sys", "✦ Công Pháp tiến hóa: " + choice.name + "."); return { success: true, choice };
  }
  function techniqueEvolutionModifiers(state, techniqueId) {
    const evo = state.player.techniques?.[techniqueId]?.evolution; if (evo?.status !== "chosen") return {};
    return X.techniqueEvolutions?.[techniqueId]?.find((entry) => entry.id === evo.evolutionId)?.modifiers || {};
  }

  function fateEvolutionEligibility(state, fateId) {
    ensure(state); const blockers = [], fate = fateDef(fateId), relation = E.fateRelationshipStatus(state.player, fateId), level = E.fateEnhancementLevel(state.player, fateId);
    if (!fate || ![...(state.player.fates || []), ...(state.fateInventory || [])].includes(fateId)) blockers.push("Mệnh Số chưa thuộc sở hữu.");
    if (!(state.player.fates || []).includes(fateId)) blockers.push("Mệnh phải đang kích hoạt.");
    if (level < 5) blockers.push("Cần Cường Hóa +5.");
    if (relation.stage < 3 || !relation.resonanceUnlocked) blockers.push("Cần đạt Cộng Minh.");
    if (Number(state.player.san || 0) < 20) blockers.push("Cần ít nhất 20 Thanh Tỉnh.");
    if (state.player.fateEvolutions[fateId]?.status === "evolved") blockers.push("Mệnh đã tiến hóa.");
    return { eligible: blockers.length === 0, blockers, fate, relation, level };
  }
  function fateEvolutionCandidates(state, fateId) {
    const fate = fateDef(fateId); if (!fate) return [];
    const compatibility = E.fateCompatibility(state.player.pathId, fate);
    return (X.fateEvolutionBranches || []).filter((branch) => !branch.requiresCompatibility || compatibility >= branch.requiresCompatibility).filter((branch) => branch.id !== "nghich_dien" || fate.sign === "hung" || Number(state.player.corruptionRating || 0) >= 30).slice(0, 2).map(copy);
  }
  function startFateEvolutionTrial(state, fateId) {
    const eligibility = fateEvolutionEligibility(state, fateId); if (!eligibility.eligible) return { success: false, blockers: eligibility.blockers, reason: eligibility.blockers.join("; ") };
    const existing = state.player.fateEvolutions[fateId]; if (existing?.status === "trial" || existing?.status === "ready") return { success: true, evolution: existing };
    const candidates = fateEvolutionCandidates(state, fateId); if (!candidates.length) candidates.push(copy((X.fateEvolutionBranches || [])[2]));
    const evolution = state.player.fateEvolutions[fateId] = { status: "trial", trialStartedDay: absoluteDay(state.gameClock), seed: hash(state.worldSimulation.seed + fateId), candidateBranchIds: candidates.map((entry) => entry.id), branchId: null, evolvedAtDay: null, sourceEnhancementLevel: 5, version: 1 };
    const relation = state.player.fateRelationships[fateId]; relation.eliteTrials = 0; relation.alignedChoices = 0;
    history(state, "sys", "✦ " + fateName(fateId) + " mở Mệnh Kiếp: thắng 2 tinh anh hoặc thực hiện 3 lựa chọn tương ứng."); return { success: true, evolution };
  }
  function recordFateEvolutionProgress(state, type, uniqueKey) {
    ensure(state);
    Object.entries(state.player.fateEvolutions).forEach(([fateId, evolution]) => {
      if (evolution.status !== "trial" || !(state.player.fates || []).includes(fateId)) return;
      evolution.progressKeys = evolution.progressKeys || []; if (evolution.progressKeys.includes(uniqueKey)) return; evolution.progressKeys.push(uniqueKey);
      const relation = state.player.fateRelationships[fateId];
      if (type === "elite") relation.eliteTrials = Math.min(2, Number(relation.eliteTrials || 0) + 1);
      if (type === "aligned") relation.alignedChoices = Math.min(3, Number(relation.alignedChoices || 0) + 1);
      if (relation.eliteTrials >= 2 || relation.alignedChoices >= 3) { evolution.status = "ready"; history(state, "sys", "◇ Mệnh Kiếp của " + fateName(fateId) + " đã viên mãn."); }
    });
  }
  function fateEvolutionPreview(state, fateId, branchId) {
    const branch = (X.fateEvolutionBranches || []).find((entry) => entry.id === branchId), fate = fateDef(fateId); if (!branch || !fate) return { success: false };
    const rank = GRADE_RANK[fate.grade] || E.GRADE_TO_TIER?.[fate.grade] || 1;
    return { success: true, branch: copy(branch), costs: { essence: 5 + 2 * rank, merit: 10 + 5 * rank, san: 10 }, beforeEffects: E.enhancedFateEffects(state.player, fate), afterEffects: applyFateEvolutionOps(state.player, fate, E.enhancedFateEffects(state.player, fate), branchId) };
  }
  function evolveFate(state, fateId, branchId, options = {}) {
    ensure(state); const evolution = state.player.fateEvolutions[fateId], preview = fateEvolutionPreview(state, fateId, branchId);
    if (!evolution || evolution.status !== "ready" || !evolution.candidateBranchIds.includes(branchId) || !preview.success) return { success: false, reason: "Mệnh Kiếp chưa sẵn sàng hoặc nhánh không hợp lệ." };
    if (preview.branch.dangerous && !options.confirmed) return { success: false, requiresConfirmation: true, reason: "Nghịch Diễn cần xác nhận phản phệ." };
    if (Number(state.fateExcessEssence || 0) < preview.costs.essence || Number(state.player.merit || 0) < preview.costs.merit || Number(state.player.san || 0) < preview.costs.san) return { success: false, reason: "Không đủ Mệnh Tinh Hoa, Công Đức hoặc Thanh Tỉnh.", costs: preview.costs };
    state.fateExcessEssence -= preview.costs.essence; state.player.merit -= preview.costs.merit; state.player.san -= preview.costs.san;
    evolution.status = "evolved"; evolution.branchId = branchId; evolution.evolvedAtDay = absoluteDay(state.gameClock);
    const relation = state.player.fateRelationships[fateId]; relation.stage = 4;
    if (preview.branch.fateDebt) state.player.fateDebt = Number(state.player.fateDebt || 0) + preview.branch.fateDebt;
    history(state, "sys", "✦ " + fateName(fateId) + " tiến hóa thành " + preview.branch.name + " · Nhân Mệnh Hợp Nhất."); E.updateDerived(state);
    return { success: true, evolution, preview };
  }
  function applyFateEvolutionOps(character, fate, effects, forcedBranchId = null) {
    const branchId = forcedBranchId || character?.fateEvolutions?.[fate?.id]?.branchId;
    const branch = (X.fateEvolutionBranches || []).find((entry) => entry.id === branchId); if (!branch) return { ...(effects || {}) };
    const result = { ...(effects || {}) };
    const numeric = Object.entries(result).filter(([, value]) => Number.isFinite(Number(value)));
    let primary = numeric.filter(([, value]) => Number(value) > 0).sort((a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1])))[0]?.[0];
    numeric.forEach(([key, value]) => {
      if (Number(value) > 0 && branch.positiveMult) result[key] = Number(value) * branch.positiveMult;
      if (Number(value) < 0 && branch.negativeMult) result[key] = Number(value) * branch.negativeMult;
    });
    if (primary && branch.primaryMult) result[primary] = Number(result[primary]) * branch.primaryMult;
    return result;
  }
  function fateEvolutionScoreDelta(character, fateId) {
    const id = character?.fateEvolutions?.[fateId]?.branchId;
    return Number((X.fateEvolutionBranches || []).find((entry) => entry.id === id)?.scoreDelta || 0);
  }

  function captureTarget(state) {
    ensure(state); const alive = E.aliveEnemies(state); if (!alive.length) return { success: false, reason: "Không có mục tiêu." };
    const [id, hp] = alive[0], entity = E.getEntity(id), info = E.combatEntity(state, id);
    if (!isCapturable(entity, id)) return { success: false, reason: "Mục tiêu không thể bắt sống." };
    if (Number(state.player.san || 0) < 10) return { success: false, reason: "Tâm trí đang quá hỗn loạn để duy trì phong ấn." };
    if (Number(hp) > Number(info?.hpMax || 1) * 0.25) return { success: false, reason: "Phải hạ mục tiêu xuống dưới 25% Khí Huyết." };
    if (Number(state.inventory?.linh_thach || 0) < 2) return { success: false, reason: "Cần 2 Linh Thạch làm phong ấn." };
    removeItem(state, "linh_thach", 2); const chance = clamp(0.45 + (state.player.aptitude - Number(info.diff || 10)) / 100, 0.15, 0.9);
    if (seeded(state, "capture:" + id + ":" + state.meta.turn) > chance) { history(state, "warn", "× Phong ấn thất bại; mục tiêu vùng thoát."); return { success: false, attempted: true }; }
    delete state.enemies[id]; const prisonerId = uid(state, "prisoner");
    state.prisoners[prisonerId] = { id: prisonerId, entityId: id, capturedDay: absoluteDay(state.gameClock), locationId: state.locationId, resolveByDay: absoluteDay(state.gameClock) + 20, resistance: 50, intelPoolId: "regional", status: "held", beast: entity.entity_type === "monster" || /thú|yeu_thu/i.test(id + " " + (entity.name || "")) };
    if (!E.aliveEnemies(state).length) E.endCombat(state);
    Object.values(state.contractBoard.accepted).filter((contract) => contract.targetEntityId === id).forEach((contract) => completeContract(state, contract, "capture"));
    registerCollection(state, state.prisoners[prisonerId].beast ? "beasts" : "entities", id, entity.rarity || (state.prisoners[prisonerId].beast ? "thường" : "hiếm"));
    history(state, "sys", "§ Đã bắt sống " + (entity.name || id) + "."); return { success: true, prisoner: state.prisoners[prisonerId] };
  }
  function isCapturable(entity, id = "") {
    if (!entity || entity.capturable === false || entity.guardian || entity.god_domain || entity.server_wide || entity.questCritical) return false;
    return entity.capturable === true || entity.beast === true || entity.entity_type === "monster" || /thú|yeu_thu|di_qui/i.test(id + " " + (entity.name || ""));
  }
  function interrogate(state, prisonerId, method = "persuade", options = {}) {
    ensure(state); const prisoner = state.prisoners[prisonerId]; if (!prisoner || prisoner.status !== "held") return { success: false, reason: "Không có tù binh hợp lệ." };
    if (method === "dark" && !options.confirmed) return { success: false, requiresConfirmation: true, reason: "Tà thuật thẩm vấn cần xác nhận." };
    let chance = 0.45 + state.player.comprehension / 250;
    if (method === "threaten") chance += state.player.basePhy / 200;
    if (method === "dark") { chance += state.player.baseMag / 180; E.drainSan(state, 5, "thẩm vấn tà thuật"); state.player.corruptionRating = clamp(state.player.corruptionRating + 2, 0, 100); }
    const success = seeded(state, "interrogate:" + prisonerId + ":" + method, absoluteDay(state.gameClock), state.meta.turn) < clamp(chance, 0.15, 0.95);
    prisoner.resistance = clamp(prisoner.resistance - (success ? 30 : 10), 0, 100);
    if (success) {
      const intelId = uid(state, "intel"); state.intel[intelId] = { id: intelId, topicType: "region", targetId: currentRegion(state), claim: "Một Bí Cảnh hoặc cơ duyên sẽ lộ dấu trong vùng.", confidence: method === "dark" ? 0.9 : 0.7, truthKey: "hidden_realm", sourceId: prisoner.entityId, acquiredDay: absoluteDay(state.gameClock), expiresDay: absoluteDay(state.gameClock) + 30, verified: false };
      discover(state, "intel", intelId, "interrogation"); history(state, "sys", "◇ Thẩm vấn thành công: nhận một đầu mối khu vực.");
    } else history(state, "warn", "× Tù binh không chịu khai.");
    return { success, prisoner };
  }
  function tamePrisoner(state, prisonerId) {
    ensure(state); const prisoner = state.prisoners[prisonerId]; if (!prisoner?.beast || prisoner.status !== "held") return { success: false, reason: "Mục tiêu không phải Dị Thú có thể thuần hóa." };
    if (state.companion) return { success: false, reason: "Chỉ có thể đồng hành cùng một Dị Thú." };
    const entity = E.getEntity(prisoner.entityId); const success = seeded(state, "tame:" + prisonerId, absoluteDay(state.gameClock), state.player.aptitude) < clamp(0.35 + state.player.aptitude / 180 + (state.player.pathId === "ngu_thu_dao" ? 0.2 : 0), 0.2, 0.95);
    if (!success) { history(state, "warn", "× Dị Thú cự tuyệt huyết khế."); return { success: false, attempted: true }; }
    state.companion = { entityId: prisoner.entityId, customName: entity?.name || prisoner.entityId, bondedDay: absoluteDay(state.gameClock), loyalty: 50, element: entity?.element || "vo_he", originRegionId: currentRegion(state), corruption: 0, passiveId: "scout", state: "active", lastScoutDay: 0 };
    prisoner.status = "tamed"; registerCollection(state, "beasts", prisoner.entityId, entity?.rarity || "hiếm"); history(state, "sys", "✦ Đã thuần hóa " + state.companion.customName + "."); return { success: true, companion: state.companion };
  }
  function scoutWithCompanion(state) {
    ensure(state); if (!state.companion || state.companion.state !== "active") return { success: false, reason: "Không có Dị Thú trinh sát." };
    const day = absoluteDay(state.gameClock); if (state.companion.lastScoutDay === day) return { success: false, reason: "Hôm nay Dị Thú đã trinh sát." };
    state.companion.lastScoutDay = day; state.companion.loyalty = clamp(state.companion.loyalty + 1, 0, 100);
    addItem(state, "linh_thach", 1); history(state, "sys", "◇ " + state.companion.customName + " trinh sát và mang về một Linh Thạch."); return { success: true };
  }

  function awakenItem(state, itemId) {
    ensure(state); const item = state.generatedItems?.[itemId]; if (!item) return { success: false, reason: "Chỉ trang bị procedural mới có thể thức tỉnh." };
    item.legacy = item.legacy || { usageCounters: { combatWins: 0, eliteWins: 0, forbiddenUses: 0, regionsVisited: 0 }, marks: [], awakeningStatus: "dormant", awakeningId: null, bondLevel: 0, heirloom: false, reincarnations: 0, wear: 0 };
    if (item.legacy.usageCounters.combatWins < 3) return { success: false, reason: "Cần cùng vật phẩm thắng ít nhất 3 trận." };
    if (item.legacy.awakeningStatus === "awakened") return { success: false, reason: "Vật phẩm đã thức tỉnh." };
    item.legacy.awakeningStatus = "awakened"; item.legacy.awakeningId = item.cursed ? "di_linh" : "ho_chu"; item.legacy.bondLevel = 1;
    item.phy = Number(item.phy || 0) + 2; item.mag = Number(item.mag || 0) + 2;
    history(state, "sys", "✦ " + item.name + " đã thức tỉnh linh tính."); E.updateDerived(state); return { success: true, item };
  }
  function markHeirloom(state, itemId) {
    ensure(state); const item = state.generatedItems?.[itemId]; if (!item) return { success: false, reason: "Chỉ trang bị do người chơi tạo/nhận mới được Di Truyền." };
    if (!E.equipmentCategory?.(item) || item.kind === "consumable" || item.kind === "quest") return { success: false, reason: "Chỉ trang bị hợp lệ mới được Di Truyền." };
    if (item.cursed && item.identified === false) return { success: false, reason: "Phải giám định lời nguyền trước khi Di Truyền." };
    if (Object.values(state.generatedItems).some((entry) => entry.legacy?.heirloom && entry.id !== itemId)) return { success: false, reason: "Đã có một Vật Phẩm Di Truyền." };
    if (Number(state.player.merit || 0) < 10 || Number(state.inventory?.linh_thach || 0) < 10) return { success: false, reason: "Cần 10 Công Đức và 10 Linh Thạch." };
    state.player.merit -= 10; removeItem(state, "linh_thach", 10); item.legacy = item.legacy || { usageCounters: { combatWins: 0 }, marks: [], awakeningStatus: "dormant", bondLevel: 0, reincarnations: 0, wear: 0 }; item.legacy.heirloom = true;
    item.legacy.baseStats ||= Object.fromEntries(["phy", "mag", "phyDef", "sanResist"].filter((key) => item[key] != null).map((key) => [key, Number(item[key])]));
    history(state, "sys", "◇ " + item.name + " được khắc ấn Di Truyền."); return { success: true, item };
  }

  function syncHeirloomWear(item) {
    if (!item?.legacy?.heirloom) return item;
    item.legacy.baseStats ||= Object.fromEntries(["phy", "mag", "phyDef", "sanResist"].filter((key) => item[key] != null).map((key) => [key, Number(item[key])]));
    const multiplier = 1 - clamp(item.legacy.wear, 0, 25) / 100;
    Object.entries(item.legacy.baseStats).forEach(([key, value]) => { item[key] = Math.round(Number(value) * multiplier * 100) / 100; });
    return item;
  }

  function startGuildProject(state, templateId) {
    ensure(state); if (!state.guildMembership) return { success: false, reason: "Cần gia nhập tông môn." };
    if (state.guildProject?.status === "active") return { success: false, reason: "Đang có công trình tông môn." };
    const template = (X.guildProjects || []).find((entry) => entry.id === templateId) || (X.guildProjects || [])[0], day = absoluteDay(state.gameClock);
    if (!template) return { success: false, reason: "Không có bản thiết kế công trình hợp lệ." };
    if (state.guildProject && state.guildProject.status !== "active") state.guildProjectHistory.unshift(copy(state.guildProject));
    state.guildProjectHistory = state.guildProjectHistory.slice(0, 5);
    state.guildProject = { id: uid(state, "project"), guildId: state.guildMembership.guildId, templateId: template.id, startDay: day, endDay: day + template.durationDays, progress: 0, playerContributions: {}, milestones: [], status: "active" };
    history(state, "sys", "§ Tông môn khởi công: " + template.name + "."); return { success: true, project: state.guildProject };
  }
  function contributeGuildProject(state, amount = 1) {
    ensure(state); const project = state.guildProject, template = project && (X.guildProjects || []).find((entry) => entry.id === project.templateId);
    if (!project || project.status !== "active" || !template) return { success: false, reason: "Không có công trình đang hoạt động." };
    if (!state.guildMembership || state.guildMembership.guildId !== project.guildId) return { success: false, reason: "Dự án bị đình chỉ vì ngươi không còn thuộc tông môn khởi công." };
    const cost = clamp(amount, 1, 10); if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch." };
    removeItem(state, "linh_thach", cost); project.progress += cost; project.playerContributions.linh_thach = Number(project.playerContributions.linh_thach || 0) + cost;
    if (project.progress >= template.target) { project.status = "completed"; project.rewardUntilDay = absoluteDay(state.gameClock) + Number(template.reward?.durationDays || 0); history(state, "sys", "✦ Công trình hoàn thành: " + template.name + "."); }
    return { success: true, project };
  }

  function hiddenRealmEnter(state, realmId) {
    ensure(state); const definition = (X.hiddenRealms || []).find((entry) => entry.id === realmId), runtime = state.worldSimulation.hiddenRealms[realmId];
    if (!definition || runtime?.status !== "open" || state.locationId !== definition.parentNodeId) return { success: false, reason: "Cổng Bí Cảnh chưa mở tại đây." };
    const nodes = rebuildHiddenRealmNodes(state, realmId, runtime.cycleIndex);
    state.activeHiddenRealm = { realmId, cycleIndex: runtime.cycleIndex, parentNodeId: definition.parentNodeId, entryNodeId: nodes.entry, coreNodeId: nodes.core };
    state.locationId = nodes.entry; state.visitedLocations ||= []; if (!state.visitedLocations.includes(nodes.entry)) state.visitedLocations.push(nodes.entry);
    discover(state, "hiddenRealms", realmId, "entered", 1); history(state, "sys", "◇ Bước vào " + definition.name + "; cổng thoát vẫn được neo tại lối vào."); return { success: true, locationId: nodes.entry };
  }
  function rebuildHiddenRealmNodes(state, realmId, cycleIndex) {
    const definition = (X.hiddenRealms || []).find((entry) => entry.id === realmId); if (!definition) return {};
    const prefix = "hidden:" + realmId + ":" + cycleIndex, entry = prefix + ":entry", path = prefix + ":path", core = prefix + ":core";
    const region = D.LOCATIONS?.[definition.parentNodeId]?.region || "trung_vuc";
    D.LOCATIONS[entry] ||= { id: entry, name: definition.name + " · Cổng", region, corruption: 1, dangerLevel: 2, linhKhiDensity: 4, npcs: [], enemies: [], searchable: ["linh_thach"], exits: { dong: path }, hiddenRealm: realmId, runtime: true };
    D.LOCATIONS[path] ||= { id: path, name: definition.name + " · U Kính", region, corruption: 2, dangerLevel: 3, linhKhiDensity: 5, npcs: [], enemies: ["di_qui"], searchable: ["linh_thach", "tu_khi_dan"], exits: { tay: entry, dong: core }, hiddenRealm: realmId, runtime: true };
    D.LOCATIONS[core] ||= { id: core, name: definition.name + " · Cơ Duyên", region, corruption: 3, dangerLevel: 4, linhKhiDensity: 5, npcs: [], enemies: ["yeu_thu"], searchable: ["linh_thach"], exits: { tay: path }, hiddenRealm: realmId, hiddenRealmCore: true, runtime: true };
    return { entry, path, core };
  }
  function claimHiddenRealmCore(state) {
    ensure(state); const active = state.activeHiddenRealm, definition = active && (X.hiddenRealms || []).find((entry) => entry.id === active.realmId), runtime = active && state.worldSimulation.hiddenRealms[active.realmId];
    if (!active || !definition || state.locationId !== active.coreNodeId) return false;
    const rewardKey = active.cycleIndex + ":main"; if (runtime.claimedRewardKeys.includes(rewardKey) || runtime.status !== "open") return false;
    runtime.claimedRewardKeys.push(rewardKey); E.gainExp(state, definition.reward.exp); state.player.merit += definition.reward.merit; discover(state, "hiddenRealms", active.realmId, "core", 2);
    history(state, "sys", "✦ Đoạt cơ duyên " + definition.name + ": Tu vi +" + definition.reward.exp + ", Công Đức +" + definition.reward.merit + "."); return true;
  }
  function exitHiddenRealm(state) {
    ensure(state); const active = state.activeHiddenRealm; if (!active) return { success: false, reason: "Không ở trong Bí Cảnh." };
    state.locationId = D.LOCATIONS[active.parentNodeId] ? active.parentNodeId : (state.homeLocationId || Object.keys(D.LOCATIONS)[0]); state.activeHiddenRealm = null;
    history(state, "sys", "◇ Đã rời Bí Cảnh an toàn."); return { success: true, locationId: state.locationId };
  }

  function prepareTribulation(state) {
    ensure(state); const target = E.cultivationTier(state) + 1, day = absoluteDay(state.gameClock);
    if (state.pendingTribulation?.targetRealmLevel === target) return state.pendingTribulation;
    const options = [
      { id: "resource", label: "Dùng Công Đức hộ kiếp", cost: { merit: 5 + target }, bonus: 8 },
      { id: "fate", label: "Lấy Mệnh chống kiếp", requirement: "active_fate", bonus: Math.min(15, Math.round(state.player.fate?.effective || 0) / 10) },
      { id: "anchor", label: "Nhờ Neo Nhân Tính", requirement: "anchor", bonus: (state.player.anchors || []).some((a) => !a.broken) ? 12 : 0 }
    ];
    state.pendingTribulation = { targetRealmLevel: target, seed: hash(state.worldSimulation.seed + ":trib:" + target), generatedDay: day, options, chosenId: null, status: "pending", result: null };
    return state.pendingTribulation;
  }
  function chooseTribulation(state, optionId) {
    const trib = prepareTribulation(state), option = trib.options.find((entry) => entry.id === optionId); if (!option || trib.status !== "pending") return { success: false };
    if (option.cost?.merit && Number(state.player.merit || 0) < option.cost.merit) return { success: false, reason: "Thiếu Công Đức." };
    if (option.requirement === "active_fate" && !(state.player.fates || []).length) return { success: false, reason: "Không có Mệnh Số đang kích hoạt." };
    if (option.requirement === "anchor" && !(state.player.anchors || []).some((a) => !a.broken)) return { success: false, reason: "Không có Neo Nhân Tính bền vững." };
    state.player.merit -= Number(option.cost?.merit || 0); trib.chosenId = optionId; trib.status = "resolved"; trib.result = { bonus: option.bonus };
    history(state, "sys", "◇ Đã chọn cách vượt Dị Tượng: " + option.label + "."); return { success: true, tribulation: trib };
  }

  function createLegacySnapshot(state, retainedFateId) {
    ensure(state); const legacy = state.reincarnationLegacy, lifeId = "life_" + legacy.generation;
    legacy.previousLives.push({ id: lifeId, name: state.player.name, deathDay: absoluteDay(state.gameClock), deathLocationId: state.locationId, pathId: state.player.pathId, highestRealm: E.cultivationTier(state), signatureFateId: retainedFateId || null, signatureTechniqueId: Object.keys(state.player.techniques || {}).sort((a, b) => Number(state.player.techniques[b].masteryExp || 0) - Number(state.player.techniques[a].masteryExp || 0))[0] || null, summaryKeys: [] });
    if (legacy.previousLives.length > 3) legacy.previousLives.shift();
    legacy.tombs.push({ id: "tomb_" + lifeId, lifeId, locationId: D.LOCATIONS[state.locationId] ? state.locationId : state.homeLocationId, visited: false });
    legacy.pendingChoices = ["technique_memory", "fate_affinity", "human_debt"]; legacy.generation += 1;
    Object.values(state.generatedItems || {}).forEach((item) => { if (item.legacy?.heirloom) { item.legacy.reincarnations = Number(item.legacy.reincarnations || 0) + 1; item.legacy.wear = clamp(Number(item.legacy.wear || 0) + 5, 0, 25); syncHeirloomWear(item); } });
    return legacy;
  }
  function beforeReincarnation(state, retainedFateId) {
    ensure(state);
    const key = state.meta.turn + ":" + absoluteDay(state.gameClock) + ":" + (retainedFateId || "none");
    if (state.reincarnationLegacy.lastSnapshotKey === key) return state.reincarnationLegacy;
    state.reincarnationLegacy.lastSnapshotKey = key;
    return createLegacySnapshot(state, retainedFateId);
  }
  function afterReincarnation(state, retainedFateId, mode) {
    ensure(state);
    if (mode === "luan_hoi") {
      const evolutions = state.player.fateEvolutions || {};
      const relationships = state.player.fateRelationships || {};
      state.player.fateEvolutions = retainedFateId && evolutions[retainedFateId] ? { [retainedFateId]: evolutions[retainedFateId] } : {};
      state.player.fateRelationships = retainedFateId && relationships[retainedFateId] ? { [retainedFateId]: relationships[retainedFateId] } : {};
    }
    return state.reincarnationLegacy;
  }
  function afterBreakthrough(state) {
    ensure(state);
    let corruption = 0;
    (state.player.fates || []).forEach((fateId) => {
      const branchId = state.player.fateEvolutions?.[fateId]?.branchId;
      corruption += Number((X.fateEvolutionBranches || []).find((entry) => entry.id === branchId)?.corruptionOnBreakthrough || 0);
    });
    if (corruption > 0) {
      state.player.corruptionRating = clamp(Number(state.player.corruptionRating || 0) + corruption, 0, 100);
      history(state, "warn", "× Nghịch Diễn phản phệ sau Đột Phá: Tà Nhiễm +" + corruption + ".");
    }
  }
  function afterBreakthroughAttempt(state, result) {
    ensure(state);
    if (state.pendingTribulation?.status === "resolved") {
      history(state, result?.changed ? "sys" : "warn", result?.changed ? "◇ Thiên Kiếp đã được vượt qua." : "× Phương án hộ kiếp đã tiêu hao trong lần Đột Phá thất bại.");
      state.pendingTribulation = null;
    }
  }
  function chooseLegacy(state, id) {
    ensure(state); if (!state.reincarnationLegacy.pendingChoices.includes(id)) return { success: false, reason: "Di sản không khả dụng." };
    state.reincarnationLegacy.chosenLegacyId = id; state.reincarnationLegacy.pendingChoices = [];
    if (id === "technique_memory") state.flags.legacyTechniqueMasteryBonus = 25;
    if (id === "fate_affinity") state.fateExcessEssence = Number(state.fateExcessEssence || 0) + 3;
    if (id === "human_debt") state.player.merit = Number(state.player.merit || 0) + 5;
    const labels = { technique_memory: "Ký Ức Công Pháp", fate_affinity: "Dư Âm Mệnh Số", human_debt: "Nhân Duyên Tiền Kiếp" };
    history(state, "sys", "✦ Đã chọn Di Sản Luân Hồi: " + (labels[id] || "Di sản đã định") + "."); return { success: true };
  }
  function visitTomb(state) {
    ensure(state); const tomb = state.reincarnationLegacy.tombs.find((entry) => entry.locationId === state.locationId && !entry.visited); if (!tomb) return { success: false, reason: "Không có mộ phần chưa bái tế tại đây." };
    tomb.visited = true; state.player.merit += 2; history(state, "sys", "◇ Bái tế tiền kiếp · Công Đức +2. Một đoạn ký ức đã trở về."); return { success: true };
  }

  function expansionActions(state) {
    ensure(state); const actions = [], combat = E.aliveEnemies(state).length > 0, day = absoluteDay(state.gameClock);
    const event = activeRegionEvent(state); const template = event && worldEventTemplate(event.templateId);
    if (!combat && event && template?.phases?.[event.phaseIndex]?.id === "active") template.choices.filter((choice) => !event.choiceHistory.some((entry) => entry.choiceId === choice.id)).forEach((choice) => actions.push({ id: "act_exp_world_" + event.id + "_" + choice.id, label: choice.label, aliases: [choice.label], priority: 1, category: "interaction" }));
    if (!combat) {
      refreshContracts(state, day);
      Object.values(state.contractBoard.offers).slice(0, 1).forEach((contract) => actions.push({ id: "act_exp_contract_" + contract.id, label: "Nhận " + formatContractName(contract), aliases: ["nhận khế ước", "nhận " + formatContractName(contract).toLowerCase()], priority: 1 }));
      actions.push({ id: "act_exp_divine", label: "Xem Quẻ", aliases: ["xem quẻ", "boi toan"], priority: 1 });
      if (state.companion) actions.push({ id: "act_exp_scout", label: "Dị Thú Trinh Sát", aliases: ["trinh sát"], priority: 1 });
      const tomb = state.reincarnationLegacy.tombs.find((entry) => entry.locationId === state.locationId && !entry.visited); if (tomb) actions.push({ id: "act_exp_tomb", label: "Bái Tế Tiền Kiếp", aliases: ["bái tế"], priority: 1 });
      Object.entries(state.worldSimulation.hiddenRealms).forEach(([id, realm]) => { const def = (X.hiddenRealms || []).find((entry) => entry.id === id); if (realm.status === "open" && def?.parentNodeId === state.locationId) actions.push({ id: "act_exp_realm_" + id, label: "Vào " + def.name, aliases: ["vào bí cảnh"], priority: 1 }); });
      if (state.activeHiddenRealm) actions.unshift({ id: "act_exp_realm_exit", label: "Rời Bí Cảnh", aliases: ["rời bí cảnh", "thoát bí cảnh"], priority: 1 });
    } else {
      const first = E.aliveEnemies(state)[0], info = first && E.combatEntity(state, first[0]), entity = first && E.getEntity(first[0]); if (first && isCapturable(entity, first[0]) && Number(state.player.san || 0) >= 10 && Number(first[1]) <= Number(info?.hpMax || 1) * 0.25) actions.unshift({ id: "act_exp_capture", label: "Chế Ngự", aliases: ["chế ngự", "bắt sống"], priority: 1 });
    }
    if (!combat) {
      const codex = (X.codexDefinitions || []).find((entry) => entry.mapId === currentRegion(state));
      const record = codex && state.codexState[codex.id];
      if (codex && (!record || record.status !== "collected")) {
        const action = record?.status === "revealed" ? "Đọc Cổ Tịch" : "Điều Tra Dấu Ấn";
        actions.push({ id: "act_exp_codex_" + codex.id, label: action, aliases: ["cổ tịch", "điều tra dấu ấn", "đọc cổ tịch"], priority: 1, category: "discovery" });
      }
    }
    return actions;
  }

  function handleExpansionAction(state, actionId) {
    if (actionId === "act_exp_divine") return divine(state);
    if (actionId === "act_exp_scout") return scoutWithCompanion(state);
    if (actionId === "act_exp_capture") return captureTarget(state);
    if (actionId.startsWith("act_exp_codex_")) {
      const id = actionId.slice("act_exp_codex_".length); const record = state.codexState[id];
      return inspectCodex(state, id, record?.status === "revealed" ? "read" : "investigate");
    }
    if (actionId === "act_exp_tomb") return visitTomb(state);
    if (actionId === "act_exp_realm_exit") return exitHiddenRealm(state);
    if (actionId.startsWith("act_exp_contract_")) return acceptContract(state, actionId.slice("act_exp_contract_".length));
    if (actionId.startsWith("act_exp_realm_")) return hiddenRealmEnter(state, actionId.slice("act_exp_realm_".length));
    if (actionId.startsWith("act_exp_world_")) {
      const suffix = actionId.slice("act_exp_world_".length); const event = Object.values(state.worldSimulation.events).find((entry) => suffix.startsWith(entry.id + "_"));
      return event ? resolveWorldEventChoice(state, event.id, suffix.slice(event.id.length + 1)) : { success: false };
    }
    return { success: false, reason: "Hành động mở rộng không hợp lệ." };
  }

  function postAction(state, actionId, before) {
    ensure(state); simulateWorldUntil(state, absoluteDay(state.gameClock)); ensureTechniqueTrials(state);
    const afterEnemies = E.aliveEnemies(state).length;
    if (/tu_luyen|be_quan/.test(actionId)) advanceTechniqueTrials(state, "cultivation");
    if (before.enemyCount > afterEnemies) {
      const elite = before.enemyCount > 0 && before.enemyExp >= 100;
      if (elite) { advanceTechniqueTrials(state, "elite"); recordFateEvolutionProgress(state, "elite", "combat:" + state.meta.turn); }
      Object.values(state.contractBoard.accepted).filter((contract) => contract.targetEntityId === before.enemyId).forEach((contract) => completeContract(state, contract, "kill"));
      E.equippedItemIds(state.player.equipment).forEach((id) => { const item = state.generatedItems?.[id]; if (item) { item.legacy ||= { usageCounters: { combatWins: 0, eliteWins: 0 }, marks: [], awakeningStatus: "dormant", bondLevel: 0, heirloom: false, reincarnations: 0, wear: 0 }; item.legacy.usageCounters.combatWins = Number(item.legacy.usageCounters.combatWins || 0) + 1; if (elite) item.legacy.usageCounters.eliteWins = Number(item.legacy.usageCounters.eliteWins || 0) + 1; if (item.legacy.usageCounters.combatWins >= 3 && item.legacy.awakeningStatus === "dormant") item.legacy.awakeningStatus = "ready"; } });
    }
    if (actionId.startsWith("act_talk_")) { const npcId = actionId.slice("act_talk_".length); recordRelationshipEvent(state, npcId, "talked", { uniqueKey: "talk:" + actionId + ":" + absoluteDay(state.gameClock) }); registerCollection(state, "npcs", npcId, String(npcId).includes("boss") ? "hiếm" : "thường"); }
    if (actionId.startsWith("act_move_")) {
      discover(state, "locations", state.locationId, "travel");
      claimHiddenRealmCore(state);
      Object.values(state.contractBoard.accepted).filter((contract) => contract.allowedOutcomes.includes("travel") && contract.targetLocationId === state.locationId).forEach((contract) => completeContract(state, contract, "travel"));
    }
    if (/search/.test(actionId)) {
      recordFateEvolutionProgress(state, "aligned", "search:" + state.locationId + ":" + state.meta.turn);
      Object.values(state.contractBoard.accepted).filter((contract) => contract.allowedOutcomes.includes("search") && contract.regionId === currentRegion(state)).forEach((contract) => completeContract(state, contract, "search"));
      Object.values(state.contractBoard.accepted).filter((contract) => contract.allowedOutcomes.includes("item") && Number(state.inventory?.[contract.targetItemId] || 0) > Number(contract.acceptedItemQuantity || 0)).forEach((contract) => completeContract(state, contract, "item"));
      if (!state.pendingContestedOpportunity && seeded(state, "contested:" + state.locationId, state.meta.turn, absoluteDay(state.gameClock)) < 0.08) createContestedOpportunity(state);
    }
    if (state.coverIdentity?.status === "active") {
      const gain = /talk|guild|to_chuc/.test(actionId) ? 4 : 1;
      state.coverIdentity.suspicion = clamp(Number(state.coverIdentity.suspicion || 0) + gain, 0, 100);
      if (state.coverIdentity.suspicion >= state.coverIdentity.quality) {
        state.coverIdentity.status = "burned";
        state.guildPursuit = state.guildPursuit || { guildName: state.coverIdentity.targetFactionId, startRealmLevel: E.cultivationTier(state) };
        state.counterIntel = { exposedDay: absoluteDay(state.gameClock), factionId: state.coverIdentity.targetFactionId, heat: 30, falseLeadPlanted: false };
        history(state, "warn", "× Thân Phận Giả đã bại lộ; đối phương bắt đầu phản gián và truy dấu.");
      }
    }
    (state.player.fates || []).forEach((id) => discover(state, "fates", id, "owned"));
    unlockAchievements(state);
  }

  function expansionSummary(state) {
    ensure(state); const region = state.worldSimulation.regionState[currentRegion(state)], event = activeRegionEvent(state), template = event && worldEventTemplate(event.templateId), survival = survivalProjection(state);
    return {
      day: absoluteDay(state.gameClock), season: seasonInfo(state), weather: region?.weather || "quang",
      event: event ? { ...event, name: template?.name, phase: template?.phases?.[event.phaseIndex]?.id } : null,
      contracts: Object.values(state.contractBoard.offers), acceptedContracts: Object.values(state.contractBoard.accepted),
      wars: Object.values(state.worldSimulation.wars).filter((war) => war.status === "active"), companion: state.companion,
      professions: state.professionState, codex: state.codexState, codexProgress: codexProgress(state), collections: state.collectionRegistry, achievements: unlockAchievements(state), discoveries: Object.values(state.discoveries).reduce((sum, bucket) => sum + Object.keys(bucket).length, 0),
      survival, guildProject: state.guildProject, prisoners: Object.values(state.prisoners).filter((entry) => entry.status === "held"),
      divinationHint: state.divinationHint?.expiresDay >= absoluteDay(state.gameClock) ? state.divinationHint : null,
      auctionLots: Object.values(refreshAuction(state).lots || {}), coverIdentity: state.coverIdentity, counterIntel: state.counterIntel || null,
      intel: Object.values(state.intel), formations: Object.values(state.placedFormations), tournament: state.worldSimulation.tournament || null
    };
  }

  function createCoverIdentity(state, targetFactionId) {
    ensure(state);
    if (state.coverIdentity?.status === "active") return { success: false, reason: "Đang dùng một thân phận giả." };
    if (Number(state.counterIntel?.heat || 0) > 0) return { success: false, reason: "Lưới phản gián còn truy dấu; phải xử lý hoặc chờ nhiệt giảm." };
    if (Number(state.inventory?.linh_thach || 0) < 8) return { success: false, reason: "Cần 8 Linh Thạch chuẩn bị thân phận." };
    removeItem(state, "linh_thach", 8);
    state.coverIdentity = { id: uid(state, "cover"), targetFactionId: targetFactionId || "vo_danh", alias: "Khách Vô Danh", quality: clamp(40 + state.player.comprehension / 2, 10, 90), suspicion: 0, createdDay: absoluteDay(state.gameClock), status: "active" };
    history(state, "sys", "◇ Đã dựng Thân Phận Giả tại " + state.coverIdentity.targetFactionId + ".");
    return { success: true, cover: state.coverIdentity };
  }
  function retireCoverIdentity(state) {
    ensure(state); if (!state.coverIdentity) return { success: false };
    state.coverIdentity.status = "retired"; history(state, "sys", "◇ Đã từ bỏ Thân Phận Giả."); return { success: true };
  }
  function counterIntelResponse(state, choice) {
    ensure(state); const counter = state.counterIntel;
    if (!counter || Number(counter.heat || 0) <= 0) return { success: false, reason: "Không có phản gián cần xử lý." };
    if (choice === "false_lead") {
      if (Number(state.inventory?.linh_thach || 0) < 5) return { success: false, reason: "Cần 5 Linh Thạch mua chuộc đầu mối." };
      removeItem(state, "linh_thach", 5); counter.heat = Math.max(0, counter.heat - 20); counter.falseLeadPlanted = true;
      history(state, "sys", "◇ Đã tung đầu mối giả, nhiệt phản gián giảm 20."); return { success: true, counter };
    }
    if (choice === "lay_low") {
      if (Number(state.player.stamina || 0) < 10) return { success: false, reason: "Cần 10 Thể Lực để cắt đuôi." };
      state.player.stamina -= 10; counter.heat = Math.max(0, counter.heat - 10); history(state, "sys", "◇ Ẩn tung tích, nhiệt phản gián giảm 10."); return { success: true, counter };
    }
    return { success: false, reason: "Phương án phản gián không hợp lệ." };
  }
  function buyIntel(state) {
    ensure(state); if (Number(state.inventory?.linh_thach || 0) < 5) return { success: false, reason: "Cần 5 Linh Thạch." };
    removeItem(state, "linh_thach", 5); const id = uid(state, "intel"), truthful = seeded(state, "intel-market", absoluteDay(state.gameClock), state.meta.turn) > 0.25;
    state.intel[id] = { id, topicType: "hidden_realm", targetId: currentRegion(state), claim: truthful ? "Cổng Bí Cảnh sẽ cộng hưởng trong chu kỳ gần nhất." : "Cổng Bí Cảnh nằm dưới một node không tồn tại.", confidence: 0.55, truthKey: truthful ? "realm_cycle" : "false", sourceId: "black_market", acquiredDay: absoluteDay(state.gameClock), expiresDay: absoluteDay(state.gameClock) + 20, verified: false };
    discover(state, "intel", id, "market"); history(state, "sys", "◇ Mua được một tin tức chưa kiểm chứng."); return { success: true, intel: state.intel[id] };
  }
  function placeBounty(state, entityId, amount = 10) {
    ensure(state); const cost = clamp(amount, 5, 100); if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Không đủ Linh Thạch." };
    removeItem(state, "linh_thach", cost); const task = { id: uid(state, "bounty"), type: "bounty", entityId, reward: cost, dueDay: absoluteDay(state.gameClock) + 3, status: "pending", seed: hash(entityId + cost + state.meta.turn) };
    scheduleWorldTask(state, task); history(state, "sys", "§ Đã treo thưởng " + cost + " Linh Thạch lên " + (E.I18n?.formatTarget(entityId, state) || "mục tiêu được chỉ định") + "."); return { success: true, bounty: task };
  }
  function refreshAuction(state, day = absoluteDay(state.gameClock)) {
    ensure(state); if (day - Number(state.auction.generatedDay || 0) < 7 && Object.keys(state.auction.lots).length) return state.auction;
    state.auction.lots = {}; const candidates = Object.keys(D.ITEMS || {}).filter((id) => D.ITEMS[id]?.kind !== "quest").slice(0, 20);
    for (let i = 0; i < Math.min(3, candidates.length); i += 1) {
      const itemId = candidates[Math.floor(seeded(state, "auction-item", day, i) * candidates.length)], id = "lot_" + day + "_" + i;
      state.auction.lots[id] = { id, itemKind: D.ITEMS[itemId]?.kind, itemId, sellerId: "npc_auction", startDay: day, endDay: day + 3, reservePrice: 10 + i * 5, currentBid: 10 + i * 5, bidderId: "npc", status: "active" };
    }
    state.auction.generatedDay = day; return state.auction;
  }
  function bidAuction(state, lotId, amount) {
    ensure(state); const lot = state.auction.lots[lotId], bid = Math.floor(Number(amount || 0));
    if (!lot || lot.status !== "active" || lot.endDay < absoluteDay(state.gameClock)) return { success: false, reason: "Lô đấu giá đã đóng." };
    if (bid <= lot.currentBid || Number(state.inventory?.linh_thach || 0) < bid) return { success: false, reason: "Giá phải cao hơn và đủ Linh Thạch." };
    if (lot.bidderId === state.player.id) addItem(state, "linh_thach", lot.currentBid);
    removeItem(state, "linh_thach", bid); lot.currentBid = bid; lot.bidderId = state.player.id; history(state, "sys", "◇ Đã trả " + bid + " Linh Thạch cho " + itemName(lot.itemId) + "."); return { success: true, lot };
  }
  function craftArtifact(state) {
    ensure(state); if (!hasProfession(state, "luyen_khi")) return { success: false, reason: "Cần cố định nghề Luyện Khí Sư." };
    const record = professionRecord(state, "luyen_khi"); if (!record) return { success: false };
    if (Number(state.inventory?.linh_thach || 0) < 8) return { success: false, reason: "Cần 8 Linh Thạch." };
    if (Number(state.player.stamina || 0) < 5) return { success: false, reason: "Cần 5 Thể Lực để luyện khí." };
    removeItem(state, "linh_thach", 8); practiceProfession(state, "luyen_khi"); const item = E.createLootItem(state, "artifact");
    if (!item) { addItem(state, "linh_thach", 8); return { success: false, reason: "Không thể tạo pháp khí lúc này." }; }
    const qualityBonus = Number(state.professionItemState?.phan_tich_phap_khi?.effects?.craftQuality || 0);
    if (qualityBonus > 0) { item.professionCrafted = true; item.craftQualityBonus = qualityBonus; item.effects = { ...(item.effects || {}), allStatMult: Number(item.effects?.allStatMult || 0) + qualityBonus }; }
    history(state, "sys", "✦ Luyện thành pháp khí " + item.name + "."); return { success: true, item };
  }
  function repairHeirloom(state, itemId) {
    ensure(state); const item = state.generatedItems?.[itemId], record = professionRecord(state, "luyen_khi");
    if (!item?.legacy?.heirloom) return { success: false, reason: "Vật phẩm chưa được khắc ấn Di Truyền." };
    if (!record || !hasProfession(state, "luyen_khi")) return { success: false, reason: "Chưa cố định nghề Luyện Khí." };
    if (Number(item.legacy.wear || 0) <= 0) return { success: false, reason: "Vật phẩm chưa hao mòn." };
    if (Number(state.inventory?.linh_thach || 0) < 5 || Number(state.player.stamina || 0) < 5) return { success: false, reason: "Cần 5 Linh Thạch và 5 Thể Lực." };
    removeItem(state, "linh_thach", 5); practiceProfession(state, "luyen_khi"); item.legacy.wear = Math.max(0, Number(item.legacy.wear || 0) - 5); syncHeirloomWear(item);
    history(state, "sys", "◇ Tu bổ " + item.name + " · hao mòn giảm 5%."); return { success: true, item };
  }
  function resolveCompanionMutation(state, choice) {
    ensure(state); const companion = state.companion;
    if (!companion?.mutationPending) return { success: false, reason: "Không có Dị Biến đang chờ xử lý." };
    if (choice === "cure") {
      if (Number(state.inventory?.linh_thach || 0) < 10) return { success: false, reason: "Cần 10 Linh Thạch để thanh tẩy." };
      removeItem(state, "linh_thach", 10); companion.corruption = 15; companion.loyalty = clamp(companion.loyalty + 10, 0, 100); companion.state = "active"; companion.mutationPending = false; companion.mutation = "purified";
      history(state, "sys", "✦ Đã thanh tẩy Dị Biến cho " + companion.customName + "."); return { success: true, choice };
    }
    if (choice === "accept") {
      companion.state = "active"; companion.mutationPending = false; companion.mutation = "tainted_claw"; companion.passiveId = "corrupted_scout"; companion.loyalty = clamp(companion.loyalty + 5, 0, 100); state.player.corruptionRating = clamp(Number(state.player.corruptionRating || 0) + 5, 0, 100);
      history(state, "warn", "× Chấp nhận Dị Biến: " + companion.customName + " nhận Tà Trảo, chủ nhân Tà Nhiễm +5."); return { success: true, choice };
    }
    if (choice === "release") {
      companion.state = "released"; companion.mutationPending = false; companion.releasedDay = absoluteDay(state.gameClock); state.player.merit = Number(state.player.merit || 0) + 3;
      history(state, "sys", "◇ Đã phóng sinh " + companion.customName + " · Công Đức +3."); return { success: true, choice };
    }
    return { success: false, reason: "Lựa chọn Dị Biến không hợp lệ." };
  }
  function createContestedOpportunity(state) {
    ensure(state); if (state.pendingContestedOpportunity) return state.pendingContestedOpportunity;
    const day = absoluteDay(state.gameClock), rivalId = Object.keys(D.NPCS || {})[Math.floor(seeded(state, "opportunity-rival", day, state.meta.turn) * Math.max(1, Object.keys(D.NPCS || {}).length))] || "rival_cultivator";
    const reward = 4 + Math.floor(seeded(state, "opportunity-reward", day) * 5);
    state.pendingContestedOpportunity = { id: uid(state, "opportunity"), nodeId: state.locationId, regionId: currentRegion(state), rivalId, createdDay: day, expiresDay: day + 3, reward, status: "pending", choices: {
      fight: { label: "Cường Đoạt", reward, consequence: "Thất bại mất 15% Khí Huyết hiện tại." },
      scheme: { label: "Dùng Mưu", reward, consequence: "Tỷ lệ thành công dựa trên Ngộ tính; thất bại bị thương." },
      share: { label: "Chia Sẻ", reward: Math.ceil(reward / 2), consequence: "Chắc chắn thành công, giảm nửa phần thưởng và tăng thiện duyên." }
    } };
    history(state, "warn", "⚔ Phát hiện cơ duyên có người tranh đoạt. Hãy chọn cách ứng biến trong Thế Sự."); return state.pendingContestedOpportunity;
  }
  function resolveContestedOpportunity(state, choice) {
    ensure(state); const opportunity = state.pendingContestedOpportunity;
    if (!opportunity || opportunity.status !== "pending") return { success: false, reason: "Không có cơ duyên tranh đoạt." };
    if (absoluteDay(state.gameClock) > opportunity.expiresDay) { opportunity.status = "expired"; state.pendingContestedOpportunity = null; return { success: false, reason: "Cơ duyên đã bị người khác lấy mất." }; }
    let chance = 0.5, reward = opportunity.reward;
    if (choice === "fight") chance += Number(state.player.stats?.phy || 0) / 250;
    else if (choice === "scheme") chance += Number(state.player.comprehension || 0) / 180;
    else if (choice === "share") { chance = 1; reward = Math.ceil(reward / 2); recordRelationshipEvent(state, opportunity.rivalId, "shared_opportunity", { uniqueKey: opportunity.id }); }
    else return { success: false, reason: "Cách tranh cơ duyên không hợp lệ." };
    const success = choice === "share" ? true : seeded(state, "opportunity-resolve:" + choice, opportunity.id, state.meta.turn) < clamp(chance, 0.15, 0.95);
    opportunity.status = success ? "won" : "lost"; opportunity.choice = choice; opportunity.resolvedDay = absoluteDay(state.gameClock);
    if (success) { addItem(state, "linh_thach", reward); E.gainExp(state, reward * 4); history(state, "sys", "✦ Đoạt được cơ duyên · Linh Thạch +" + reward + "."); }
    else { state.player.hp = Math.max(1, Number(state.player.hp || 1) - Math.ceil(Number(state.player.stats?.hpMax || 20) * 0.15)); history(state, "warn", "× Tranh cơ duyên thất bại, bị thương rút lui."); }
    state.pendingContestedOpportunity = null; return { success, attempted: true, reward: success ? reward : 0 };
  }
  function resolvePrisoner(state, prisonerId, outcome) {
    ensure(state); const prisoner = state.prisoners[prisonerId]; if (!prisoner || prisoner.status !== "held") return { success: false };
    prisoner.status = outcome;
    if (outcome === "released") state.player.merit += 2;
    if (outcome === "turned_in") { state.player.merit += 3; if (state.guildMembership) state.guildMembership.contribution += 5; }
    if (outcome === "executed") state.player.corruptionRating = clamp(state.player.corruptionRating + 2, 0, 100);
    const labels = { released: "phóng thích", turned_in: "giao nộp", executed: "xử quyết" };
    history(state, "sys", "§ Đã xử lý tù binh: " + (labels[outcome] || "đã hoàn tất") + "."); return { success: true };
  }
  function participateWar(state, warId) {
    ensure(state); const war = state.worldSimulation.wars[warId]; if (!war || war.status !== "active") return { success: false, reason: "Chiến sự đã kết thúc." };
    const side = state.guildMembership?.guildId === war.factionB ? "B" : "A"; war[side === "A" ? "scoreA" : "scoreB"] += 1; war.playerInterventions.push({ day: absoluteDay(state.gameClock), side }); E.gainExp(state, 25); history(state, "sys", "⚔ Can thiệp chiến sự · chiến công +1."); return { success: true };
  }
  function runExpansionCommand(state, command, arg, arg2, options = {}) {
    const table = {
      divine: () => divine(state), contract_accept: () => acceptContract(state, arg), profession_choose: () => chooseProfessionLocked(state, arg), profession_practice: () => practiceProfession(state, arg),
      brew: () => brewPill(state, arg), profession_item_use: () => useProfessionItem(state, arg), profession_item_recharge: () => rechargeProfessionItem(state, arg), craft: () => craftArtifact(state), formation: () => placeFormation(state, arg || "gather"), interrogate: () => interrogate(state, arg, arg2 || "persuade", options), tame: () => tamePrisoner(state, arg),
      scout: () => scoutWithCompanion(state), fate_trial: () => startFateEvolutionTrial(state, arg), fate_evolve: () => evolveFate(state, arg, arg2, options), technique_evolve: () => chooseTechniqueEvolution(state, arg, arg2),
      guild_start: () => startGuildProject(state, arg), guild_contribute: () => contributeGuildProject(state, Number(arg || 1)), legacy: () => chooseLegacy(state, arg), tribulation: () => chooseTribulation(state, arg),
      mark: () => setPlayerMark(state, arg), mail: () => sendMail(state, arg, arg2 || "Bình an."), intel_buy: () => buyIntel(state), cover: () => createCoverIdentity(state, arg), cover_retire: () => retireCoverIdentity(state), counter_intel: () => counterIntelResponse(state, arg),
      hidden_profession_action: () => useHiddenProfessionAction(state, arg),
      bounty: () => placeBounty(state, arg, Number(arg2 || 10)), auction_bid: () => bidAuction(state, arg, Number(arg2)), item_awaken: () => awakenItem(state, arg), heirloom: () => markHeirloom(state, arg), heirloom_repair: () => repairHeirloom(state, arg), prisoner_resolve: () => resolvePrisoner(state, arg, arg2), companion_mutation: () => resolveCompanionMutation(state, arg), opportunity: () => resolveContestedOpportunity(state, arg), read_npc: () => readNpc(state, arg), war: () => participateWar(state, arg), tournament: () => joinTournament(state), codex: () => inspectCodex(state, arg, arg2 || "investigate"), hidden_clue: () => hiddenProfessionClue(state, arg, arg2 || "lead")
    };
    const result = table[command] ? table[command]() : { success: false, reason: "Lệnh mở rộng không hợp lệ." };
    E.updateDerived(state); return result;
  }

  const original = {
    createState: E.createState, deserialize: E.deserialize, serialize: E.serialize, advanceGameTime: E.advanceGameTime,
    contextState: E.contextState, submitActionId: E.submitActionId, submitTurn: E.submitTurn,
    processLuanHoi: E.processLuanHoi, processChuyenSinh: E.processChuyenSinh, updateDerived: E.updateDerived
  };
  E.createState = function (...args) { return ensure(original.createState.apply(E, args)); };
  E.deserialize = function (...args) { const state = ensure(original.deserialize.apply(E, args)); simulateWorldUntil(state, absoluteDay(state.gameClock)); return state; };
  E.serialize = function (state) { ensure(state); const raw = JSON.parse(original.serialize.call(E, state)); raw.version = 13; return JSON.stringify(raw); };
  E.advanceGameTime = function (state, days) { const result = original.advanceGameTime.call(E, state, days); ensure(state); simulateWorldUntil(state, absoluteDay(state.gameClock)); return result; };
  E.contextState = function (state) { const result = original.contextState.call(E, state); if (!result.forced) result.actions.push(...expansionActions(state)); return result; };
  E.submitActionId = function (state, actionId, options = {}) {
    ensure(state); const first = E.aliveEnemies(state)[0], info = first && E.combatEntity(state, first[0]); const before = { enemyCount: E.aliveEnemies(state).length, enemyId: first?.[0], enemyExp: Number(info?.exp || 0) };
    let result;
    if (actionId.startsWith("act_exp_")) {
      const action = E.contextState(state).actions.find((entry) => entry.id === actionId); if (!action) return false;
      state.meta.turn += 1; state.meta.updatedAt = new Date().toISOString(); history(state, "action", "> [" + action.label + "]"); result = handleExpansionAction(state, actionId, options); E.updateDerived(state);
    } else result = original.submitActionId.call(E, state, actionId, options);
    postAction(state, actionId, before); return result;
  };
  E.submitTurn = function (state, action) { ensure(state); const first = E.aliveEnemies(state)[0], info = first && E.combatEntity(state, first[0]); const before = { enemyCount: E.aliveEnemies(state).length, enemyId: first?.[0], enemyExp: Number(info?.exp || 0) }; const result = original.submitTurn.call(E, state, action); postAction(state, String(action?.text || ""), before); return result; };
  E.processLuanHoi = function (state) { return original.processLuanHoi.call(E, state); };
  E.processChuyenSinh = function (state) { return original.processChuyenSinh.call(E, state); };
  E.updateDerived = function (state) {
    const result = original.updateDerived.call(E, state); const bonus = equipmentSetModifiers(state);
    if (state.player?.stats?.eff) { state.player.stats.eff.combatDamagePct = Number(state.player.stats.eff.combatDamagePct || 0) + Number(bonus.combatPowerMult || 0) * 100; state.player.stats.eff.phyDef = Number(state.player.stats.eff.phyDef || 0) + Number(bonus.phyDef || 0); state.player.stats.eff.fortune = Number(state.player.stats.eff.fortune || 0) + Number(bonus.fortuneFlat || 0); }
    unlockAchievements(state);
    return result;
  };

  Object.assign(E, {
    ensureExpansionState: ensure, ensureWorldSimulation, gameDayOrdinal: absoluteDay, worldRandom: seeded, simulateWorldUntil, simulateWorldAggregate, scheduleWorldTask, cancelWorldTask, processScheduledWorldTasks, worldSimulationSummary, getWorldModifiers, setWeather, worldModifierPreview, activeRegionEvent, startWorldEvent, resolveWorldEventChoice,
    recordRelationshipEvent, relationshipTier, sendMail, refreshContracts, acceptContract, captureTarget, interrogate, tamePrisoner, scoutWithCompanion,
    discover, divine, survivalProjection, setPlayerMark, chooseProfessionLocked, professionAvailability, practiceProfession, brewPill, useProfessionItem, rechargeProfessionItem, useHiddenProfessionAction, placeFormation, readNpc,
    ensureTechniqueTrials, chooseTechniqueEvolution, techniqueEvolutionModifiers,
    fateEvolutionEligibility, startFateEvolutionTrial, recordFateEvolutionProgress, fateEvolutionCandidates, fateEvolutionPreview, evolveFate, applyFateEvolutionOps, fateEvolutionScoreDelta,
    awakenItem, markHeirloom, repairHeirloom, startGuildProject, contributeGuildProject, hiddenRealmEnter, exitHiddenRealm, prepareTribulation, chooseTribulation, chooseLegacy, visitTomb,
    beforeReincarnation, afterReincarnation, afterBreakthrough, afterBreakthroughAttempt,
    expansionActions, expansionSummary, createCoverIdentity, retireCoverIdentity, counterIntelResponse, buyIntel, placeBounty, refreshAuction, bidAuction, craftArtifact, resolvePrisoner, resolveCompanionMutation, createContestedOpportunity, resolveContestedOpportunity, participateWar, joinTournament, runExpansionCommand, inspectCodex, codexProgress, hiddenProfessionClue, npcWorldContext, resolveNpcWorldReaction, registerCollection, unlockAchievements, equipmentSetModifiers, setWeather, worldModifierPreview, chooseProfessionLocked, techniqueDisplayInfo
  });
  window.GameExpansion = E;
})();
