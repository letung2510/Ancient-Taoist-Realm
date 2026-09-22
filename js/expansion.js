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
  const absoluteDay = (clock) => {
    const playerDay = (Number(clock?.currentYear || 1) - 1) * 360 + (Number(clock?.currentMonth || 1) - 1) * 30 + Number(clock?.currentDay || 1);
    const mirroredWorldDay = Number(clock?.worldAbsoluteDay || 0);
    if (!mirroredWorldDay) return Math.max(1, playerDay);
    const syncedPlayerDay = Number(clock?.worldSyncedPlayerDay || playerDay);
    return Math.max(1, mirroredWorldDay + playerDay - syncedPlayerDay);
  };
  const gameDayOrdinal = (stateOrClock) => absoluteDay(stateOrClock?.gameClock || stateOrClock);
  const playerDay = (state) => Math.max(1, (Number(state?.gameClock?.currentYear || 1) - 1) * 360 + (Number(state?.gameClock?.currentMonth || 1) - 1) * 30 + Number(state?.gameClock?.currentDay || 1));
  const pairKey = (a, b) => [String(a), String(b)].sort().join("::");
  function normalizeNpcRoutine(routine, npc) {
    const valid = Array.isArray(routine) ? routine.filter((entry) => Number.isFinite(Number(entry.hourStart)) && Number.isFinite(Number(entry.hourEnd)) && entry.subLocationId && entry.activity) : [];
    if (valid.length) return valid.map((entry) => ({ ...entry, hourStart: clamp(Math.floor(Number(entry.hourStart)), 0, 23), hourEnd: clamp(Math.floor(Number(entry.hourEnd)), 0, 24) }));
    const node = D.LOCATIONS?.[npc?.homeNodeId || npc?.currentNodeId], spots = node?.subLocations || [];
    const findSpot = (pattern) => spots.find((spot) => pattern.test(String(spot.type || "") + " " + String(spot.displayName || spot.name || spot.id || "")))?.id || spots[0]?.id || "main";
    const role = String(npc?.role || "").toLowerCase(), merchant = /merchant|thương|buôn|shop/.test(role), guard = /guard|patrol|hộ|tuần/.test(role), cultivator = /cultiv|tu_si|tu sĩ|disciple/.test(role);
    const daytime = merchant ? findSpot(/market|shop|sạp|quán|buôn/i) : guard ? findSpot(/gate|wall|cổng|tuần|ngoài/i) : cultivator ? findSpot(/training|courtyard|sân|luyện|tĩnh|tu hành/i) : findSpot(/public|main|chính|quán|điểm/i);
    const home = findSpot(/home|residen|inn|house|nơi ở|phòng|trọ/i), food = findSpot(/food|kitchen|bếp|tửu|quán/i);
    return [
      { hourStart: 0, hourEnd: 6, subLocationId: home, activity: "ngu" },
      { hourStart: 6, hourEnd: 8, subLocationId: food, activity: "an_uong" },
      { hourStart: 8, hourEnd: 18, subLocationId: daytime, activity: merchant ? "buon_ban" : guard ? "tuan_tra" : "luyen_cong" },
      { hourStart: 18, hourEnd: 22, subLocationId: food, activity: "an_uong" },
      { hourStart: 22, hourEnd: 24, subLocationId: home, activity: "ngu" }
    ];
  }
  function npcHour(state) { return (8 + Math.floor(clamp(Number(state.gameClock?.dayProgress || 0), 0, 0.999999) * 24)) % 24; }
  function npcRoutineAt(state, npc) {
    const hour = npcHour(state), routine = normalizeNpcRoutine(npc?.dailyRoutine, npc);
    return routine.find((entry) => entry.hourStart <= hour && hour < entry.hourEnd) || routine[0] || { activity: "present", subLocationId: npc?.currentSubLocationId || "main", hourStart: hour, hourEnd: hour + 1 };
  }
  function syncNpcRoutine(state, npc) {
    const routine = npcRoutineAt(state, npc), spots = D.LOCATIONS?.[npc.currentNodeId]?.subLocations || [];
    const woken = npc.wokenAtDay === absoluteDay(state.gameClock) && routine.activity === "ngu";
    npc.currentActivity = woken ? "awake" : routine.activity;
    if (routine.activity === "ngu" && !woken) npc.aiState = "sleeping";
    else if (npc.aiState === "sleeping") npc.aiState = "present";
    const direct = spots.find((spot) => spot.id === routine.subLocationId);
    const target = direct || spots.find((spot) => new RegExp(String(routine.activity).replace(/_.*/, "|"), "i").test(String(spot.type || "") + " " + String(spot.id || ""))) || spots[0];
    if (target) npc.currentSubLocationId = target.id;
    return routine;
  }
  const itemName = (id) => D.ITEMS?.[id]?.name || E.I18n?.formatTarget(id) || "vật phẩm chưa định danh";
  function organizationDefinitions() {
    const guilds = (D.GUILDS || []).map((guild) => ({ ...guild, organizationKind: "guild" }));
    const factions = (D.WORLD_MAP?.factions || []).map((faction) => ({ ...faction, id: faction.id, name: faction.name, region_id: faction.region_id, organizationKind: "faction" }));
    return [...guilds, ...factions];
  }
  function organizationAddress(organizationId) {
    const addresses = D.WORLD_MAP?.addresses || {};
    return [...(addresses.organizations || []), ...(addresses.factions || [])].find((address) => address.refId === organizationId) || null;
  }
  function ensureOrganizationState(state) {
    state.organizationState ||= { version: 1, relations: {}, activeRequests: {}, history: [] };
    state.organizationState.relations ||= {};
    state.organizationState.specialCommissions ||= {};
    organizationDefinitions().forEach((organization) => {
      const relation = state.organizationState.relations[organization.id] ||= { organizationId: organization.id, reputation: 0, favor: 0, trust: 0, heat: 0, status: "neutral", servicesUnlocked: [], lastInteractionDay: 0 };
      relation.organizationId = organization.id;
      relation.reputation = clamp(relation.reputation, -100, 100);
      relation.favor = clamp(relation.favor, 0, 100);
      relation.trust = clamp(relation.trust, 0, 100);
      relation.heat = clamp(relation.heat, 0, 100);
      relation.servicesUnlocked = [...new Set(Array.isArray(relation.servicesUnlocked) ? relation.servicesUnlocked : [])];
    });
    state.organizationState.history = Array.isArray(state.organizationState.history) ? state.organizationState.history.slice(-100) : [];
    return state.organizationState;
  }
  function organizationSnapshot(state, organizationId) {
    ensureOrganizationState(state);
    const organization = organizationDefinitions().find((entry) => entry.id === organizationId);
    if (!organization) return null;
    const relation = state.organizationState.relations[organizationId];
    const address = organizationAddress(organizationId);
    return { organization: copy(organization), relation: copy(relation), address: address ? copy(address) : null, atNode: Boolean(address?.nodeId && state.locationId === address.nodeId) };
  }
  const ORG_RANKS = Object.freeze([
    { id: "outer", label: "Ngoại Môn", contribution: 0, reputation: 0, realm: 2 },
    { id: "inner", label: "Nội Môn", contribution: 100, reputation: 10, realm: 3 },
    { id: "disciple", label: "Chân Truyền Đệ Tử", contribution: 300, reputation: 30, realm: 5 },
    { id: "elder", label: "Trưởng Lão", contribution: 800, reputation: 60, realm: 8, trial: true },
    { id: "leader", label: "Chưởng Môn", contribution: 1600, reputation: 80, realm: 10, trial: true }
  ]);
  function memberRankIndex(membership) {
    if (Number.isInteger(Number(membership?.rankIndex))) return clamp(Number(membership.rankIndex), 0, ORG_RANKS.length - 1);
    const raw = String(membership?.rankId || membership?.rank || "outer").toLowerCase();
    const found = ORG_RANKS.findIndex((rank) => rank.id === raw || rank.label.toLowerCase() === raw);
    return Math.max(0, found);
  }
  function guildPromotionStatus(state) {
    const membership = state.guildMembership;
    if (!membership) return { eligible: false, reason: "Chưa gia nhập tổ chức." };
    const currentIndex = memberRankIndex(membership), next = ORG_RANKS[currentIndex + 1];
    if (!next) return { eligible: false, rank: ORG_RANKS[currentIndex], reason: "Đã đạt chức vị cao nhất." };
    const organizationId = membership.guildId, address = organizationAddress(organizationId);
    if (!address?.nodeId || state.locationId !== address.nodeId) return { eligible: false, next, reason: "Cần có mặt tại sơn môn của tổ chức." };
    const relation = ensureOrganizationState(state).relations[organizationId];
    const missing = [];
    if (Number(membership.contribution || 0) < next.contribution) missing.push("cống hiến " + next.contribution);
    if (Number(relation.reputation || 0) < next.reputation) missing.push("danh tiếng " + next.reputation);
    if (E.cultivationTier(state) < next.realm) missing.push("cảnh giới " + next.realm);
    if (Number(membership.promotionRetryDay || 0) > absoluteDay(state.gameClock)) missing.push("khảo hạch chỉ có thể thử lại sau ngày " + Number(membership.promotionRetryDay));
    if (next.trial && !membership.promotionTrialPassed) missing.push("khảo hạch nội môn");
    return { eligible: missing.length === 0, current: ORG_RANKS[currentIndex], next, missing, reason: missing.length ? "Còn thiếu: " + missing.join(" · ") : null };
  }
  function promoteGuildMember(state) {
    ensure(state);
    const status = guildPromotionStatus(state);
    if (!status.next) return { success: false, reason: status.reason };
    if (status.missing?.some((entry) => entry !== "khảo hạch nội môn")) return { success: false, reason: status.reason };
    if (status.missing?.includes("khảo hạch nội môn")) {
      if (Number(state.guildMembership.promotionRetryDay || 0) > absoluteDay(state.gameClock)) return { success: false, reason: status.reason };
      const tier = Number(E.cultivationTier(state)), aptitude = Number(state.player.aptitude || 0), comprehension = Number(state.player.comprehension || 0);
      const score = aptitude * 0.35 + comprehension * 0.35 + Number(state.player.daoTam || 0) * 0.3;
      const threshold = status.next.id === "leader" ? 78 : 65;
      const pass = score + seeded(state, "promotion-trial:" + state.guildMembership.guildId + ":" + status.next.id, absoluteDay(state.gameClock)) * 25 >= threshold;
      if (!pass) { state.guildMembership.contribution = Math.max(0, Number(state.guildMembership.contribution || 0) - 20); state.guildMembership.promotionTrialPassed = false; state.guildMembership.promotionRetryDay = absoluteDay(state.gameClock) + 7; history(state, "warn", "Khảo hạch nội môn không thành; ngươi bị trừ 20 điểm cống hiến và phải chờ bảy ngày mới được thử lại."); return { success: false, trialFailed: true, reason: "Chưa vượt qua khảo hạch." }; }
      state.guildMembership.promotionTrialPassed = true;
    }
    const rankIndex = memberRankIndex(state.guildMembership) + 1, rank = ORG_RANKS[rankIndex];
    state.guildMembership.rankIndex = rankIndex; state.guildMembership.rankId = rank.id; state.guildMembership.rank = rank.label; state.guildMembership.promotionTrialPassed = false; state.guildMembership.promotionRetryDay = 0;
    const relation = ensureOrganizationState(state).relations[state.guildMembership.guildId];
    relation.reputation = clamp(Number(relation.reputation || 0) + 3, -100, 100);
    const learned = E.grantGuildTechniques?.(state) || [];
    history(state, "narr", "Trước đại điện, danh sách môn tường khẽ đổi tên. Từ hôm nay, ngươi mang thân phận " + rank.label + (learned.length ? "; truyền thừa mới đã được khai mở." : "."));
    return { success: true, rank, learnedTechniques: learned };
  }
  function organizationInteract(state, organizationId, action = "status", amount = 1) {
    ensureOrganizationState(state);
    const snapshot = organizationSnapshot(state, organizationId);
    if (!snapshot) return { success: false, reason: "Tổ chức không tồn tại." };
    if (action === "status") return { success: true, data: snapshot };
    if (!snapshot.address?.nodeId) return { success: false, reason: "Tổ chức chưa có địa chỉ bản đồ hợp lệ." };
    if (snapshot.address?.nodeId && state.locationId !== snapshot.address.nodeId) return { success: false, reason: "Cần có mặt tại node của tổ chức để tương tác." };
    const relation = state.organizationState.relations[organizationId], day = absoluteDay(state.gameClock);
    const isCommission = action.startsWith("commission");
    if (!isCommission && Number(relation.lastInteractionDay || 0) === day) return { success: false, reason: "Tổ chức này chỉ tiếp nhận một tương tác mỗi ngày." };
    const record = (delta = {}) => {
      relation.reputation = clamp(Number(relation.reputation || 0) + Number(delta.reputation || 0), -100, 100);
      relation.favor = clamp(Number(relation.favor || 0) + Number(delta.favor || 0), 0, 100);
      relation.trust = clamp(Number(relation.trust || 0) + Number(delta.trust || 0), 0, 100);
      relation.heat = clamp(Number(relation.heat || 0) + Number(delta.heat || 0), 0, 100);
      relation.status = relation.heat >= 60 ? "hostile" : relation.reputation >= 50 && relation.trust >= 40 ? "allied" : relation.reputation >= 20 ? "friendly" : relation.reputation <= -30 ? "distrusted" : "neutral";
      relation.lastInteractionDay = day;
      state.organizationState.history.push({ organizationId, action, day, delta: { ...delta }, status: relation.status });
    };
    if (action === "donate") {
      const cost = Math.max(1, Math.floor(Number(amount) || 3));
      if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch để quyên trợ." };
      E.removeItem(state, "linh_thach", cost); record({ reputation: cost, favor: Math.ceil(cost / 2), trust: 1 });
    } else if (action === "request_aid") {
      const cost = 10;
      if (relation.favor < cost) return { success: false, reason: "Cần 10 Favor của tổ chức." };
      relation.favor -= cost; relation.lastInteractionDay = day;
      E.addItem(state, "boi_nguyen_dan", 1); state.organizationState.history.push({ organizationId, action, day, reward: "boi_nguyen_dan" });
    } else if (action === "share_intel") {
      const intel = Object.values(state.intel || {}).find((entry) => entry.status !== "spent");
      if (!intel) return { success: false, reason: "Không có tin tình báo chưa xác minh." };
      intel.status = "spent"; record({ reputation: 5, trust: 8, favor: 2 });
    } else if (isCommission) {
      const tier = action === "commission_special" ? "special" : action === "commission_life" ? "life_death" : "common";
      const open = Object.values(state.organizationState.activeRequests).find((request) => request.organizationId === organizationId && request.tier === tier && ["open", "ready"].includes(request.status));
      if (open) return { success: false, reason: "Đã có ủy thác cùng tầng đang chờ xử lý." };
      const month = Math.floor((day - 1) / 30) + 1, specialKey = organizationId + ":" + month;
      state.organizationState.specialCommissions ||= {};
      if (tier === "special" && Number(state.organizationState.specialCommissions[specialKey] || 0) >= 2) return { success: false, reason: "Đã nhận đủ hai ủy thác đặc biệt trong tháng này." };
      const linkedWar = Object.values(state.worldSimulation.wars || {}).some((war) => war.status === "active" && (war.factionA === organizationId || war.factionB === organizationId));
      if (tier === "life_death" && (!linkedWar || snapshot.organization.organizationKind !== "faction")) return { success: false, reason: "Ủy thác sinh tử chỉ xuất hiện khi tổ chức đang trực tiếp tham chiến." };
      const seq = Object.keys(state.organizationState.activeRequests).length + Number(state.meta?.turn || 0) + 1;
      const requestId = organizationId + ":" + tier + ":" + day + ":" + seq;
      const target = tier === "common" ? 2 : tier === "special" ? 4 : 5;
      state.organizationState.activeRequests[requestId] = { id: requestId, organizationId, tier, regionId: currentRegion(state), createdDay: day, status: "open", expiresDay: day + (tier === "common" ? 7 : tier === "special" ? 15 : 10), targetProgress: target, progress: 0, qualifyingActions: ["move", "search", "combat"], warId: tier === "life_death" ? Object.values(state.worldSimulation.wars).find((war) => war.status === "active" && (war.factionA === organizationId || war.factionB === organizationId))?.id : null };
      if (tier === "special") state.organizationState.specialCommissions[specialKey] = Number(state.organizationState.specialCommissions[specialKey] || 0) + 1;
      record({ reputation: tier === "common" ? 2 : tier === "special" ? 4 : 6, favor: tier === "common" ? 1 : 3, trust: tier === "common" ? 2 : 4 });
    } else if (action === "mediate") {
      if (snapshot.organization.organizationKind !== "faction" || relation.reputation < 10) return { success: false, reason: "Chỉ có thể điều đình với faction khi đã có danh tiếng." };
      record({ reputation: 3, trust: 5, favor: 2 });
    } else return { success: false, reason: "Tương tác tổ chức không hợp lệ." };
    const nodeName = D.LOCATIONS?.[snapshot.address?.nodeId]?.name || snapshot.organization.name;
    const coordinate = snapshot.address?.oxyNode ? " tại tọa độ " + snapshot.address.oxyNode.x + ", " + snapshot.address.oxyNode.y : "";
    const actionText = { donate: "dâng lễ vật để đổi lấy thiện cảm", request_aid: "cầu viện trợ", commission: "nhận một ủy thác thường", commission_special: "nhận một ủy thác đặc biệt", commission_life: "nhận một ủy thác sinh tử", share_intel: "trao một tin tình báo", mediate: "đứng ra điều đình" }[action] || "xem xét quan hệ";
    history(state, "narr", "Tại " + nodeName + coordinate + ", ngươi " + actionText + " cho " + snapshot.organization.name + ". Mối quan hệ hiện ở trạng thái " + organizationSnapshot(state, organizationId).relation.status + ".");
    return { success: true, data: organizationSnapshot(state, organizationId) };
  }
  function promoteAfterFailedLifeCommission(state, request) {
    const membership = state.guildMembership;
    if (request?.tier !== "life_death" || membership?.guildId !== request.organizationId) return false;
    const index = memberRankIndex(membership);
    if (index <= 0) return false;
    const rank = ORG_RANKS[index - 1]; membership.rankIndex = index - 1; membership.rankId = rank.id; membership.rank = rank.label;
    history(state, "warn", "Ủy thác sinh tử thất bại; tổ chức giáng ngươi xuống chức vị " + rank.label + ".");
    return true;
  }
  function expireOrganizationCommissions(state, day = absoluteDay(state.gameClock)) {
    ensureOrganizationState(state);
    Object.values(state.organizationState.activeRequests).forEach((request) => {
      if (["open", "ready"].includes(request.status) && Number(request.expiresDay) < Number(day)) {
        request.status = "expired"; request.resolvedDay = day; request.outcome = "failed";
        promoteAfterFailedLifeCommission(state, request);
      }
    });
  }
  function advanceOrganizationCommissions(state, actionId) {
    ensureOrganizationState(state);
    const kind = actionId.startsWith("act_move_") ? "move" : /search/.test(actionId) ? "search" : /tan_cong|skill|combat/.test(actionId) ? "combat" : null;
    if (!kind) return [];
    const day = absoluteDay(state.gameClock), region = currentRegion(state), advanced = [];
    Object.values(state.organizationState.activeRequests).forEach((request) => {
      if (request.status !== "open" || !request.qualifyingActions?.includes(kind) || request.lastProgressTurn === Number(state.meta?.turn || 0)) return;
      if (request.regionId && request.regionId !== region) return;
      request.lastProgressTurn = Number(state.meta?.turn || 0); request.progress = Math.min(Number(request.targetProgress || 1), Number(request.progress || 0) + 1);
      request.status = request.progress >= Number(request.targetProgress || 1) ? "ready" : "open"; request.lastProgressDay = day; advanced.push(request);
      if (request.status === "ready") history(state, "narr", "Những việc được giao đã đủ; ngươi có thể trở về tổ chức để giao ủy thác.");
    });
    return advanced;
  }
  function resolveOrganizationCommission(state, requestId, outcome = "complete") {
    ensureOrganizationState(state);
    const request = state.organizationState.activeRequests[String(requestId)];
    if (!request || !["open", "ready"].includes(request.status)) return { success: false, reason: "Ủy thác không còn hiệu lực." };
    if (outcome === "fail") { request.status = "failed"; request.resolvedDay = absoluteDay(state.gameClock); promoteAfterFailedLifeCommission(state, request); return { success: true, failed: true }; }
    const address = organizationAddress(request.organizationId);
    if (!address?.nodeId || state.locationId !== address.nodeId) return { success: false, reason: "Cần trở về địa điểm của tổ chức để giao ủy thác." };
    if (request.status !== "ready") return { success: false, reason: "Chưa hoàn tất tiến độ ủy thác: " + Number(request.progress || 0) + "/" + Number(request.targetProgress || 0) + "." };
    const organization = organizationDefinitions().find((entry) => entry.id === request.organizationId);
    if (request.tier === "life_death" && request.warId && state.worldSimulation.wars?.[request.warId]?.status !== "active") {
      request.status = "expired"; request.resolvedDay = absoluteDay(state.gameClock); promoteAfterFailedLifeCommission(state, request);
      return { success: false, reason: "Chiến sự đã khép lại trước khi hoàn tất; ủy thác sinh tử thất bại." };
    }
    let reward = request.tier === "special" ? { exp: 80, merit: 12, contribution: 25, linhThach: 8 } : request.tier === "life_death" ? { exp: 140, merit: 20, contribution: 50, linhThach: 15 } : { exp: 30, merit: 4, contribution: 8, linhThach: 3 };
    if (request.tier === "special") {
      const fate = E.rollFateByProgression(state, { minimumGrade: 1, gradeCap: Math.min(4, E.cultivationTier(state) + 1) });
      if (fate) reward = { ...reward, fates: [fate.id] };
      else {
        const techniques = E.techniqueCatalog?.() || {};
        const technique = Object.values(techniques).find((entry) => !state.player.techniques?.[entry.id] && Number(entry.minRealmLevel || 1) <= E.cultivationTier(state));
        if (technique) reward = { ...reward, techniques: [technique.id] };
      }
    }
    const granted = grantCanonicalReward(state, "organization-commission:" + request.id, reward, "organization-commission:" + request.id);
    if (!granted.success) return { success: false, duplicate: true };
    request.status = "resolved"; request.outcome = "complete"; request.resolvedDay = absoluteDay(state.gameClock); request.reward = copy(reward);
    state.organizationState.relations[request.organizationId].reputation = clamp(Number(state.organizationState.relations[request.organizationId].reputation || 0) + (request.tier === "common" ? 2 : 5), -100, 100);
    if (state.guildMembership?.guildId === request.organizationId) state.guildMembership.contribution = Number(state.guildMembership.contribution || 0) + Number(reward.contribution || 0);
    history(state, "narr", "Tại " + (organization?.name || request.organizationId) + ", ủy thác khép lại; công lao và phần thưởng được ghi vào sổ môn.");
    return { success: true, request, reward };
  }
  function validateOrganizationState(state) {
    ensureOrganizationState(state);
    const errors = [], known = new Set(organizationDefinitions().map((entry) => entry.id));
    organizationDefinitions().forEach((organization) => { if (!organizationAddress(organization.id)?.nodeId) errors.push(organization.id + ":missing-address"); });
    Object.entries(state.organizationState.relations || {}).forEach(([id, relation]) => {
      if (!known.has(id) || relation.organizationId !== id) errors.push(id + ":unknown");
      ["reputation", "favor", "trust", "heat"].forEach((field) => { if (!Number.isFinite(Number(relation[field]))) errors.push(id + ":" + field); });
    });
    Object.entries(state.organizationState.activeRequests || {}).forEach(([key, request]) => {
      if (!request || request.id !== key || !known.has(request.organizationId) || !Number.isFinite(Number(request.createdDay)) || !Number.isFinite(Number(request.expiresDay)) || Number(request.expiresDay) < Number(request.createdDay) || !["open", "ready", "resolved", "expired", "failed"].includes(request.status) || !["common", "special", "life_death"].includes(request.tier || "common") || Number(request.progress || 0) < 0 || Number(request.progress || 0) > Number(request.targetProgress || 0)) errors.push(String(request?.id || key) + ":invalid");
    });
    return { ok: errors.length === 0, errors, organizations: known.size };
  }
  const professionCatalog = () => ({ ...(X.professionItems || {}), ...(window.PROFESSION_ITEMS || {}) });
  const professionDefinition = (id) => X.professionDefinitions?.[id] || X.hiddenProfessions?.[id] || null;
  const RECIPE_CATALOG = Object.freeze({
    tu_khi_dan: { id: "tu_khi_dan", professionId: "luyen_dan", materials: { linh_thao: 2 }, output: { itemId: "tu_khi_dan", quantity: 1 }, costs: { stamina: 5 }, successBase: 0.45, perfectMultiplier: 0.15 },
    hoan_huyet_dan: { id: "hoan_huyet_dan", professionId: "luyen_dan", materials: { linh_thao: 3 }, output: { itemId: "hoan_huyet_dan", quantity: 1 }, costs: { stamina: 5 }, successBase: 0.45, perfectMultiplier: 0.15 },
    dien_tho_dan_ha: { id: "dien_tho_dan_ha", professionId: "luyen_dan", materials: { linh_thao: 5 }, output: { itemId: "dien_tho_dan_ha", quantity: 1 }, costs: { stamina: 5 }, successBase: 0.45, perfectMultiplier: 0.15 },
    procedural_artifact: { id: "procedural_artifact", professionId: "luyen_khi", materials: { linh_thach: 8 }, output: { kind: "artifact", quantity: 1 }, costs: { stamina: 5 } },
    gathering_formation: { id: "gathering_formation", professionId: "tran_phap", materials: { linh_thach: 5 }, output: { kind: "formation", purpose: "gather" }, costs: {} },
    ward_formation: { id: "ward_formation", professionId: "tran_phap", materials: { linh_thach: 5 }, output: { kind: "formation", purpose: "protect" }, costs: {} }
  });
  const REWARD_POLICY = Object.freeze({
    id: "canonical_once_v1",
    duplicate: "reject",
    pity: "none",
    fateVaultFull: "pending_vault",
    pendingRewardReplay: "idempotent",
    repeatableOutputs: "activity_resolver"
  });
  const RUMOR_POLICY = Object.freeze({ sameNodeConfidenceLoss: 0.05, adjacentNodeConfidenceLoss: 0.2, minConfidence: 0.1, maxRumorsPerNpc: 12, defaultTtlDays: 14, sourcePriorityWinsTie: true });
  const PRODUCT_POLICY = Object.freeze({ fateDecay: "none", npcRelationshipDecay: "event_only", maxPaths: 2, pathTransition: "explicit_once", fusionAffinityCap: 0.75, diTheMode: "modifier_catalog_exclusion_only", diTheLocksProfession: false, diTheLocksPath: false, structureOwnership: ["player", "npc", "faction"], factionRepairRequiresMembership: true, factionUpgrade: false, offlineMode: "aggregate_then_actor_window", offlineDetailedWindowDays: 30, offlineHistoryRetentionDays: 30 });
  function productPolicySnapshot() { return { ...PRODUCT_POLICY, structureOwnership: PRODUCT_POLICY.structureOwnership.slice() }; }
  function structureManagerDecision(state, structure, action) {
    if (!structure || structure.status === "dismantled") return { allowed: false, reason: "structure_missing" };
    if (structure.ownerType === "player" && structure.ownerId === state.player?.id) return { allowed: ["repair", "upgrade", "dismantle", "transfer"].includes(action), reason: "player_owner" };
    if (structure.ownerType === "faction" && PRODUCT_POLICY.factionRepairRequiresMembership && state.guildMembership?.guildId === structure.ownerId) return { allowed: action === "repair" && PRODUCT_POLICY.factionUpgrade === false, reason: "faction_member" };
    return { allowed: false, reason: "owner_permission" };
  }
  function rumorPolicySnapshot() { return { ...RUMOR_POLICY }; }
  function validateRumorPolicy(state) {
    ensure(state); const errors = [];
    if (!(RUMOR_POLICY.sameNodeConfidenceLoss >= 0 && RUMOR_POLICY.adjacentNodeConfidenceLoss > RUMOR_POLICY.sameNodeConfidenceLoss && RUMOR_POLICY.minConfidence > 0 && RUMOR_POLICY.maxRumorsPerNpc >= 1 && RUMOR_POLICY.defaultTtlDays >= 1)) errors.push("policy-range");
    Object.values(state.worldSimulation.npcState || {}).forEach((npc) => {
      if ((npc.rumors || []).length > RUMOR_POLICY.maxRumorsPerNpc) errors.push(String(npc.npcId) + ":retention");
      (npc.rumors || []).forEach((rumor) => { if (!rumor.key || !Number.isFinite(Number(rumor.confidence)) || Number(rumor.confidence) < RUMOR_POLICY.minConfidence || !Number.isFinite(Number(rumor.expiresDay))) errors.push(String(npc.npcId) + ":rumor"); });
      Object.values(npc.rumorLedger || {}).forEach((entry) => { if (!entry.sourceNpcId || !Number.isFinite(Number(entry.confidence)) || !Number.isFinite(Number(entry.expiresDay))) errors.push(String(npc.npcId) + ":ledger"); });
    });
    return { ok: errors.length === 0, policy: rumorPolicySnapshot(), errors };
  }
  function rewardPolicySnapshot() { return { ...REWARD_POLICY }; }
  function validateRewardPolicy() {
    const valid = REWARD_POLICY.duplicate === "reject" && REWARD_POLICY.pity === "none" && REWARD_POLICY.fateVaultFull === "pending_vault" && REWARD_POLICY.pendingRewardReplay === "idempotent";
    return { ok: valid, policy: rewardPolicySnapshot(), errors: valid ? [] : ["reward-policy"] };
  }
  function recipeDefinition(id) {
    const recipe = RECIPE_CATALOG[id];
    return recipe ? { ...copy(recipe), materials: { ...(recipe.materials || {}) }, output: { ...(recipe.output || {}) }, costs: { ...(recipe.costs || {}) } } : null;
  }
  function recipeCanCommit(state, recipe) {
    if (!recipe) return { success: false, reason: "Công thức không tồn tại." };
    for (const [materialId, quantity] of Object.entries(recipe.materials || {})) {
      if (Number(state.inventory?.[materialId] || 0) < Number(quantity || 0)) return { success: false, reason: "Thiếu " + itemName(materialId) + " (cần " + quantity + ")." };
    }
    for (const [key, quantity] of Object.entries(recipe.costs || {})) if (Number(state.player?.[key] || 0) < Number(quantity || 0)) return { success: false, reason: "Cần " + quantity + " " + key + "." };
    return { success: true };
  }
  function commitRecipeCosts(state, recipe) {
    Object.entries(recipe.materials || {}).forEach(([id, quantity]) => removeItem(state, id, Number(quantity || 0)));
    Object.entries(recipe.costs || {}).forEach(([key, quantity]) => { state.player[key] = Math.max(0, Number(state.player[key] || 0) - Number(quantity || 0)); });
  }
  const WEATHER_CATALOG = Object.freeze({
    quang: { label: "Quang Đãng", severity: 0, defaultDuration: 2, transitions: ["mua", "suong", "linh_phong"] },
    mua: { label: "Mưa", severity: 1, defaultDuration: 2, transitions: ["quang", "suong", "am_vu"] },
    suong: { label: "Sương", severity: 1, defaultDuration: 2, transitions: ["quang", "mua", "linh_phong"] },
    tuyet: { label: "Tuyết", severity: 2, defaultDuration: 3, transitions: ["quang", "linh_phong", "bao_linh_khi"] },
    loi_vu: { label: "Lôi Vũ", severity: 3, defaultDuration: 2, transitions: ["mua", "bao_linh_khi", "quang"] },
    linh_phong: { label: "Linh Phong", severity: 2, defaultDuration: 2, transitions: ["quang", "mua", "tuyet"] },
    am_vu: { label: "Âm Vũ", severity: 4, defaultDuration: 2, transitions: ["mua", "suong", "quang"] },
    bao_linh_khi: { label: "Bão Linh Khí", severity: 5, defaultDuration: 1, transitions: ["loi_vu", "am_vu", "quang"] }
  });
  const WEATHER_ALIASES = Object.freeze({ snow: "tuyet", mist: "suong", suong_mu: "suong", "sương_mù": "suong", storm: "loi_vu", spiritual_storm: "bao_linh_khi" });
  const normalizeWeatherId = (weather) => WEATHER_ALIASES[String(weather || "").trim().toLowerCase()] || String(weather || "").trim().toLowerCase();
  const WEATHER_EFFECTS = Object.freeze({
    quang: { travelRiskDelta: 0, fogLevel: 0, npcShelter: false },
    mua: { travelRiskDelta: 0.03, fogLevel: 1, npcShelter: false },
    suong: { travelRiskDelta: 0.02, fogLevel: 2, npcShelter: false },
    tuyet: { travelRiskDelta: 0.05, fogLevel: 1, npcShelter: true },
    loi_vu: { travelRiskDelta: 0.04, fogLevel: 1, npcShelter: true },
    linh_phong: { travelRiskDelta: 0.03, fogLevel: 1, npcShelter: false },
    am_vu: { travelRiskDelta: 0.08, fogLevel: 2, npcShelter: true },
    bao_linh_khi: { travelRiskDelta: 0.12, fogLevel: 2, npcShelter: true }
  });
  function weatherCatalog() { return copy(Object.fromEntries(Object.entries(WEATHER_CATALOG).map(([id, definition]) => [id, { ...definition, effects: { ...(WEATHER_EFFECTS[id] || {}) } }]))); }
  function weatherSnapshot(state, regionId = currentRegion(state)) {
    ensure(state); const region = state.worldSimulation.regionState[regionId], id = normalizeWeatherId(region?.weather || "quang"), definition = WEATHER_CATALOG[id] || WEATHER_CATALOG.quang;
    return { id, regionId, label: definition.label, severity: Number(definition.severity || 0), durationDays: Number(definition.defaultDuration || 1), transitions: [...(definition.transitions || [])], effects: { ...(WEATHER_EFFECTS[id] || {}) }, untilDay: Number(region?.weatherUntilDay || 0), source: region?.weatherSource || "catalog" };
  }
  function validateWeatherRuntimeState(state) {
    ensure(state); const errors = [], today = absoluteDay(state.gameClock);
    Object.entries(state.worldSimulation?.regionState || {}).forEach(([regionId, region]) => {
      const id = normalizeWeatherId(region?.weather || "quang"), definition = WEATHER_CATALOG[id];
      if (!definition) { errors.push(regionId + ":unknown"); return; }
      if (Number(region.weatherSeverity) !== Number(definition.severity)) errors.push(regionId + ":severity");
      if (!Number.isFinite(Number(region.weatherUntilDay)) || Number(region.weatherUntilDay) < today - 1) errors.push(regionId + ":untilDay");
      if (!Array.isArray(region.weatherHistory) || region.weatherHistory.length > 30) errors.push(regionId + ":history");
      (region.weatherHistory || []).forEach((entry) => {
        const from = normalizeWeatherId(entry?.from), to = normalizeWeatherId(entry?.to);
        if (!WEATHER_CATALOG[from] || !WEATHER_CATALOG[to] || !Number.isFinite(Number(entry?.day))) errors.push(regionId + ":history-entry");
        if (from !== to && entry?.source === "world_tick" && !WEATHER_CATALOG[from]?.transitions?.includes(to)) errors.push(regionId + ":transition");
      });
    });
    return { ok: errors.length === 0, errors, regionCount: Object.keys(state.worldSimulation?.regionState || {}).length };
  }
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
    // Canonical rare-progression state; additive for pre-v2 saves.
    state.pathState = state.pathState || { schemaVersion: 2, primaryPathId: state.player.pathId || null, secondaryPathId: state.player.secondaryPathId || null, hiddenPathId: state.player.hiddenPathId || null, dormant: {}, history: [] };
    state.pathState.schemaVersion = Math.max(2, Number(state.pathState.schemaVersion || 1));
    state.pathState.primaryPathId = state.pathState.primaryPathId || state.player.pathId || null;
    state.pathState.secondaryPathId = state.pathState.secondaryPathId || state.player.secondaryPathId || null;
    state.pathState.hiddenPathId = state.pathState.hiddenPathId || state.player.hiddenPathId || null;
    state.pathState.dormant = state.pathState.dormant || {};
    state.pathState.history = Array.isArray(state.pathState.history) ? state.pathState.history : [];
    state.player.pathId = state.player.pathId || state.pathState.primaryPathId;
    state.player.secondaryPathId = state.player.secondaryPathId || state.pathState.secondaryPathId;
    state.player.hiddenPathId = state.player.hiddenPathId || state.pathState.hiddenPathId;
    state.specialPhysiqueState = state.specialPhysiqueState || { schemaVersion: 2, activeId: null, candidates: {}, progress: {}, history: [], rejectedIds: [] };
    state.specialPhysiqueState.schemaVersion = Math.max(2, Number(state.specialPhysiqueState.schemaVersion || 1));
    state.specialPhysiqueState.progress = state.specialPhysiqueState.progress || {};
    state.specialPhysiqueState.candidates = state.specialPhysiqueState.candidates || {};
    state.specialPhysiqueState.history = Array.isArray(state.specialPhysiqueState.history) ? state.specialPhysiqueState.history : [];
    state.specialPhysiqueState.rejectedIds = Array.isArray(state.specialPhysiqueState.rejectedIds) ? state.specialPhysiqueState.rejectedIds : [];
    Object.keys(state.specialPhysiqueState.progress).forEach((trigger) => {
      const value = Number(state.specialPhysiqueState.progress[trigger]);
      state.specialPhysiqueState.progress[trigger] = Number.isFinite(value) ? Math.max(0, value) : 0;
    });
    if (state.specialPhysiqueState.activeId && !SPECIAL_PHYSIQUE_CATALOG[state.specialPhysiqueState.activeId]) state.specialPhysiqueState.activeId = null;
    if (!state.specialPhysiqueState.activeId && state.player.specialPhysique && SPECIAL_PHYSIQUE_CATALOG[state.player.specialPhysique]) state.specialPhysiqueState.activeId = state.player.specialPhysique;
    state.player.specialPhysique = state.specialPhysiqueState.activeId || null;
    state.meta = state.meta || {};
    if (typeof state.meta.saveId !== "string" || !state.meta.saveId) state.meta.saveId = "migrated_" + hash(String(state.player.id || state.player.name || "anonymous"));
    state.runtimeMetrics = state.runtimeMetrics || { schemaVersion: 1, mapInfluence: { calls: 0, cacheHits: 0, uncached: 0, totalMs: 0 }, npcView: { calls: 0, totalMs: 0 }, offline: { calls: 0, totalMs: 0 } };
    state.runtimeMetrics.mapInfluence ||= { calls: 0, cacheHits: 0, uncached: 0, totalMs: 0 };
    state.runtimeMetrics.npcView ||= { calls: 0, totalMs: 0 };
    state.runtimeMetrics.offline ||= { calls: 0, totalMs: 0 };
    state.runtimeIndexes = state.runtimeIndexes || { fate: { byId: {} }, npc: { byId: {} }, location: { byId: {} } };
    state.runtimeIndexes.fate ||= { byId: {} }; state.runtimeIndexes.npc ||= { byId: {} }; state.runtimeIndexes.location ||= { byId: {} };
    (D.FATE_PATTERNS || []).forEach((fate) => { state.runtimeIndexes.fate.byId[fate.id] = fate; });
    state.meta.featureVersions = state.meta.featureVersions || {};
    ["worldSimulation", "relationships", "techniqueEvolution", "professions", "professionItems", "techniqueEvolution", "contracts", "itemLegacy", "companions", "discoveries", "reincarnationLegacy", "fateEvolution"].forEach((key) => {
      state.meta.featureVersions[key] = Number(state.meta.featureVersions[key] || VERSION);
    });
    state.worldSimulation = state.worldSimulation || {
      seed: state.meta.saveId || "world_" + Date.now(), lastProcessedDay: absoluteDay(state.gameClock), nextEventSeq: 0,
      events: {}, regionState: {}, factionState: {}, diplomacy: {}, wars: {}, npcState: {}, hiddenRealms: {}, scheduledTasks: []
    };
    const sim = state.worldSimulation;
    sim.offlinePolicy ||= { schemaVersion: 1, mode: "aggregate_then_actor_window", detailedWindowDays: 30, aggregateBatchDays: 3, actorStateProjection: "final_state_plus_incidents", actorResolution: "deterministic_event_projection", idempotencyKey: "lastProcessedDay", historyRetentionDays: 30 };
    sim.actorHistory ||= {};
    sim.offlinePolicy.mode ||= "aggregate_then_actor_window";
    sim.offlinePolicy.actorResolution ||= "deterministic_event_projection";
    sim.offlinePolicy.historyRetentionDays = Math.max(1, Number(sim.offlinePolicy.historyRetentionDays || 30));
    sim.offlinePolicy.detailedWindowDays = Math.max(1, Number(sim.offlinePolicy.detailedWindowDays || 30));
    sim.offlinePolicy.aggregateBatchDays = Math.max(1, Number(sim.offlinePolicy.aggregateBatchDays || 3));
    state.unknownContent = state.unknownContent || { events: {}, items: {}, evolutionBranches: {} };
    state.unknownContent.events ||= {}; state.unknownContent.items ||= {}; state.unknownContent.evolutionBranches ||= {};
    Object.entries(state.inventory || {}).forEach(([id, quantity]) => {
      if (!D.ITEMS?.[id] && Number(quantity) > 0 && !state.unknownContent.items[id]) state.unknownContent.items[id] = { id, quantity: Number(quantity), status: "dormant" };
    });
    Object.entries(state.unknownContent.events).forEach(([id, unknown]) => {
      if (!unknown || unknown.status !== "dormant") return;
      const template = worldEventTemplate(unknown.templateId);
      if (template) { sim.events[id] = { ...copy(unknown), status: "active", phaseStartedDay: unknown.phaseStartedDay || absoluteDay(state.gameClock), phaseEndsDay: unknown.phaseEndsDay || absoluteDay(state.gameClock) + 1 }; unknown.status = "rehydrated"; }
    });
    Object.entries(state.unknownContent.evolutionBranches).forEach(([branchId, unknown]) => {
      if (unknown?.status !== "dormant") return;
      if ((X.fateEvolutionBranches || []).some((branch) => branch.id === branchId)) unknown.status = "ready";
    });
    Object.values(state.player.fateEvolutions || {}).forEach((evolution) => {
      if (evolution?.branchId && !(X.fateEvolutionBranches || []).some((branch) => branch.id === evolution.branchId)) {
        state.unknownContent.evolutionBranches[evolution.branchId] ||= { id: evolution.branchId, status: "dormant", payload: copy(evolution) };
        evolution.status = "ready"; evolution.branchId = null;
      }
    });
    Object.entries(professionCatalog()).forEach(([id, item]) => { D.ITEMS[id] = { ...(D.ITEMS[id] || {}), ...item, kind: "profession_item", catalogSource: "profession" }; });
    Object.values(state.generatedItems || {}).forEach((item) => {
      if (!item.equipmentSetId && typeof item.name === "string") {
        if (item.name.includes("Bá Vương")) item.equipmentSetId = "Bá Vương";
        else if (item.name.includes("Thiên Mệnh")) item.equipmentSetId = "Thiên Mệnh";
      }
    });
    state.professionItemState = state.professionItemState || {};
    state.meta.featureVersions.professionItems = Math.max(Number(state.meta.featureVersions.professionItems || 1), Number(window.PROFESSION_ITEMS_SCHEMA_VERSION || 1));
    state.hiddenProfessionState = state.hiddenProfessionState || { schemaVersion: 2, clues: {}, attempts: {}, branches: {}, failures: [], unlocked: {} };
    state.hiddenProfessionState.schemaVersion = Math.max(2, Number(state.hiddenProfessionState.schemaVersion || 1));
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
    const worldEpoch = Number(state.worldClock?.absoluteDay || state.gameClock?.worldAbsoluteDay || absoluteDay(state.gameClock));
    if (sim.lastProcessedDay > 0 && sim.lastProcessedDay < worldEpoch / 2) sim.lastProcessedDay = worldEpoch + sim.lastProcessedDay - 1;
    sim.nextEventSeq = Number(sim.nextEventSeq || 0);
    ["events", "regionState", "factionState", "diplomacy", "wars", "npcState", "hiddenRealms", "npcEncounters", "localIncidents"].forEach((key) => { sim[key] = sim[key] || {}; });
    sim.offlineEncounterResults = Array.isArray(sim.offlineEncounterResults) ? sim.offlineEncounterResults : [];
    sim.scheduledTasks = Array.isArray(sim.scheduledTasks) ? sim.scheduledTasks : [];
    (D.WORLD_MAP?.regions || []).forEach((region) => {
      sim.regionState[region.id] = sim.regionState[region.id] || { weather: "quang", weatherIntensity: 1, weatherSeverity: 0, weatherUntilDay: sim.lastProcessedDay, lastEventDay: 0, activeEventId: null, corruptionLevel: 0, weatherHistory: [] };
      sim.regionState[region.id].weatherIntensity = Number(sim.regionState[region.id].weatherIntensity || 1);
      sim.regionState[region.id].weatherSeverity = Number(sim.regionState[region.id].weatherSeverity || WEATHER_CATALOG[normalizeWeatherId(sim.regionState[region.id].weather)]?.severity || 0);
      sim.regionState[region.id].weatherHistory = Array.isArray(sim.regionState[region.id].weatherHistory) ? sim.regionState[region.id].weatherHistory : [];
    });
    const factions = D.WORLD_MAP?.factions || D.FACTION_DATA?.factions || [];
    factions.slice(0, 40).forEach((faction) => {
      sim.factionState[faction.id] = sim.factionState[faction.id] || { factionId: faction.id, power: Math.max(1, Number(faction.scale || 3) * 10), resources: 100, stability: 70, reputationWithPlayer: 0, ownedNodeIds: [], traits: (faction.traits || []).slice(), lastInternalEventDay: 0, activeProjectId: null };
    });
    Object.keys(D.NPCS || {}).slice(0, 20).forEach((npcId, index) => {
      const home = Object.keys(D.LOCATIONS || {}).find((locId) => D.LOCATIONS[locId]?.npcs?.includes(npcId)) || state.homeLocationId || state.locationId;
      const definition = D.NPCS[npcId] || {}; const traits = Array.isArray(definition.traits) ? definition.traits : [];
      const mobileTrait = traits.some((trait) => /du hành|thương|wander|merchant|itinerant/i.test(String(trait))) || /merchant|thương nhân|lữ khách|du hành/i.test(String(definition.role || definition.title || ""));
      const scheduleType = mobileTrait ? "itinerant" : traits.some((trait) => /tuần tra|patrol/i.test(String(trait))) ? "patrol" : index % 4 === 0 ? "patrol" : "static";
      sim.npcState[npcId] = sim.npcState[npcId] || { npcId, name: definition.name || npcId, role: definition.role || definition.title || definition.dialogueProfileId || "traveler", currentNodeId: home, homeNodeId: home, scheduleType, aiState: "idle", traits: traits.slice(), route: [home], routeIndex: 0, nextMoveDay: sim.lastProcessedDay + 3 + index % 4, status: "alive", factionId: definition.factionId || definition.faction_id || null, relationshipsWithNpcs: {}, memoryWithPlayer: [], mailbox: [], rumors: [], rumorLedger: {}, needs: { shelter: 0, social: 0, duty: 0 }, processedKeys: {} };
      const runtime = sim.npcState[npcId];
      runtime.aiState ||= "idle"; runtime.rumorLedger ||= {}; runtime.needs ||= { shelter: 0, social: 0, duty: 0 };
      runtime.name ||= definition.name || npcId; runtime.role ||= definition.role || definition.dialogueProfileId || "traveler";
      runtime.dailyRoutine = normalizeNpcRoutine(runtime.dailyRoutine || definition.dailyRoutine, runtime);
      sim.npcState[npcId].rumors = (Array.isArray(sim.npcState[npcId].rumors) ? sim.npcState[npcId].rumors : []).map((rumor) => ({ ...rumor, confidence: clamp(Number(rumor.confidence ?? 0.7), RUMOR_POLICY.minConfidence, 1), priority: Number(rumor.priority || 1), expiresDay: Number(rumor.expiresDay || absoluteDay(state.gameClock) + RUMOR_POLICY.defaultTtlDays), sourceNpcId: rumor.sourceNpcId || npcId })).slice(-RUMOR_POLICY.maxRumorsPerNpc);
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
    ensureOrganizationState(state);
    Object.values(state.relationships).forEach((relation) => { relation.schemaVersion = Math.max(2, Number(relation.schemaVersion || 1)); relation.decayPolicy ||= "event_only"; relation.loyalty = clamp(relation.loyalty == null ? relation.trust : relation.loyalty, 0, 100); relation.affection = clamp(relation.affection == null ? relation.trust : relation.affection, 0, 100); relation.score = Number(relation.score ?? ((Number(relation.trust || 0) + Number(relation.respect || 0)) - (Number(relation.fear || 0) + Number(relation.suspicion || 0)) * 0.5)); });
    state.relationshipEvents = state.relationshipEvents || {};
    state.rewardLedger = state.rewardLedger || {};
    Object.entries(state.rewardLedger).forEach(([key, receipt]) => {
      if (!receipt || typeof receipt !== "object") {
        state.rewardLedger[key] = { key, sourceId: key, day: absoluteDay(state.gameClock), exp: 0, merit: 0, quantity: 0, linhThach: 0, contribution: 0, fates: [], techniques: [], taintedRewards: {}, status: "quarantined", legacyPayload: receipt };
        return;
      }
      receipt.key ||= key; receipt.sourceId ||= key; receipt.day = Number(receipt.day || absoluteDay(state.gameClock));
      ["exp", "merit", "quantity", "linhThach", "contribution"].forEach((field) => { const raw = Number(receipt[field] || 0); if (!Number.isFinite(raw) || raw < 0) { receipt.legacyPayload ||= {}; receipt.legacyPayload[field] = receipt[field]; receipt.status = "quarantined"; receipt[field] = 0; } else receipt[field] = raw; });
      receipt.fates = Array.isArray(receipt.fates) ? receipt.fates : [];
      receipt.techniques = Array.isArray(receipt.techniques) ? receipt.techniques : [];
      receipt.taintedRewards = receipt.taintedRewards && typeof receipt.taintedRewards === "object" ? receipt.taintedRewards : {};
    });
    state.questState = state.questState || { available: {}, active: {}, completed: {}, failed: {}, npcIndex: {} };
    state.questState.available ||= {}; state.questState.active ||= {}; state.questState.completed ||= {}; state.questState.failed ||= {}; state.questState.npcIndex ||= {};
    Object.entries(state.questState.npcIndex).forEach(([npcId, questIds]) => { state.questState.npcIndex[npcId] = [...new Set((Array.isArray(questIds) ? questIds : []).filter(Boolean))]; });
    state.professionState = state.professionState || { schemaVersion: 2, primaryId: null, secondaryId: null, hiddenId: null, hiddenIds: [], professions: {} };
    state.professionState.schemaVersion = Math.max(2, Number(state.professionState.schemaVersion || 1));
    // Canonical migration: a hidden profession is always the secondary slot.
    // Older saves used hiddenProfession/hiddenId (and occasionally secondaryId)
    // interchangeably; never allow a normal profession to occupy that slot.
    const hiddenIds = new Set(Object.keys(X.hiddenProfessions || {}));
    if (hiddenIds.has(state.professionState.primaryId) && !state.professionState.secondaryId) {
      state.professionState.secondaryId = state.professionState.primaryId;
      state.professionState.primaryId = null;
    }
    const legacyHiddenId = hiddenIds.has(state.professionState.hiddenId) ? state.professionState.hiddenId : hiddenIds.has(state.player.hiddenProfession) ? state.player.hiddenProfession : null;
    state.professionState.secondaryId = hiddenIds.has(state.professionState.secondaryId) ? state.professionState.secondaryId : legacyHiddenId;
    state.professionState.hiddenId = state.professionState.secondaryId || null;
    state.professionState.hiddenIds = Array.from(new Set((Array.isArray(state.professionState.hiddenIds) ? state.professionState.hiddenIds : []).filter((id) => hiddenIds.has(id)).concat(state.professionState.secondaryId || [])));
    state.professionState.selectionLocked = Boolean(state.professionState.primaryId);
    state.player.hiddenProfession = state.professionState.secondaryId || null;
    state.player.hiddenProfessionCandidate = state.player.hiddenProfessionCandidate || null;
    state.contractBoard = state.contractBoard || { generatedDay: 0, offers: {}, accepted: {} };
    state.prisoners = state.prisoners || {};
    state.intel = state.intel || {};
    state.companion = state.companion || null;
    if (state.companion) normalizeCompanion(state.companion);
    state.discoveries = state.discoveries || emptyDiscoveries();
    Object.keys(emptyDiscoveries()).forEach((key) => { state.discoveries[key] = state.discoveries[key] || {}; });
    Object.values(state.discoveries).forEach((bucket) => Object.values(bucket || {}).forEach((entry) => { if (!entry.status) entry.status = entry.rewardedDay ? "rewarded" : entry.collectedDay ? "collected" : entry.verifiedDay ? "verified" : "discovered"; entry.clueIds ||= []; entry.completedSetIds ||= []; }));
    state.reincarnationLegacy = state.reincarnationLegacy || { generation: 1, previousLives: [], pendingChoices: [], chosenLegacyId: null, tombs: [], marksRetained: false };
    state.playerMarks = state.playerMarks || {};
    state.placedFormations = state.placedFormations || {};
    state.auction = state.auction || { generatedDay: 0, lots: {} };
    state.coverIdentity = state.coverIdentity || null;
    state.guildProject = state.guildProject || null;
    state.guildProjectHistory = Array.isArray(state.guildProjectHistory) ? state.guildProjectHistory : [];
    state.pendingTribulation = state.pendingTribulation || null;
    state.pendingContestedOpportunity = state.pendingContestedOpportunity || null;
    state.opportunityHistory = Array.isArray(state.opportunityHistory) ? state.opportunityHistory.slice(-30) : [];
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
    state.professionState.selectionLocked = Boolean(state.professionState.primaryId);
    state.player.fateEvolutions = state.player.fateEvolutions || {};
    state.player.fateRelationships = state.player.fateRelationships || {};
    state.player.fateAdvancedActions = state.player.fateAdvancedActions || {};
    Object.values(state.player.fateRelationships).forEach((record) => { if (record && !record.decayPolicy) record.decayPolicy = "none"; });
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
    ensureRuntimeLocationCoordinates(state);
    return state;
  }

  function ensureRuntimeLocationCoordinates(state) {
    state.openWorld ||= {};
    state.openWorld.coordinates ||= {};
    const used = new Set(Object.values(state.openWorld.coordinates).filter((value) => Array.isArray(value) && value.length >= 2).map((value) => Number(value[0]) + "," + Number(value[1])));
    Object.values(D.LOCATIONS || {}).filter((node) => node?.runtime && node.hiddenRealm).forEach((node) => {
      if (Array.isArray(state.openWorld.coordinates[node.id])) return;
      const definition = (X.hiddenRealms || []).find((entry) => entry.id === node.hiddenRealm);
      const parentId = definition?.parentNodeId;
      const parent = state.openWorld.coordinates[parentId] || [Number(D.LOCATIONS?.[parentId]?.x || 50), Number(D.LOCATIONS?.[parentId]?.y || 50)];
      const roleOffset = node.hiddenRealmCore ? 0.03 : String(node.id).endsWith(":path") ? 0.02 : 0.01;
      let x = Math.max(0, Math.min(100, Number(parent[0]) + roleOffset));
      let y = Math.max(0, Math.min(100, Number(parent[1]) + roleOffset));
      while (used.has(x + "," + y)) { x = Math.max(0, Math.min(100, x + 0.001)); y = Math.max(0, Math.min(100, y + 0.001)); }
      state.openWorld.coordinates[node.id] = [x, y]; used.add(x + "," + y);
    });
    return state.openWorld.coordinates;
  }

  const SPECIAL_PHYSIQUE_CATALOG = Object.freeze({
    thanh_the: { id: "thanh_the", name: "Thánh Thể", trigger: "mercy_chain", progressThreshold: 3, maxStage: 3, branch: "thien_dao", endingTags: ["thien_dao_cuu_the"], factionAffinity: { thien_huyen_tong: 4 }, benefit: { corruptionResist: 0.30 }, stageEffects: [{ corruptionResist: 0.30 }, { corruptionResist: 0.45, sanRecoveryFlat: 1 }, { corruptionResist: 0.60, sanRecoveryFlat: 2 }], cost: { taintedAttention: 2 }, exclusions: { paths: [], professions: [] } },
    hon_don_the: { id: "hon_don_the", name: "Hỗn Độn Thể", trigger: "five_elements", progressThreshold: 5, maxStage: 3, branch: "vo_cuc", endingTags: ["vo_cuc_dung_hop"], factionAffinity: { tu_vi_cac: 3 }, benefit: { elementPenalty: 0 }, stageEffects: [{ elementPenalty: 0 }, { elementPenalty: 0, fateResonance: 0.05 }, { elementPenalty: 0, fateResonance: 0.10, corruptionResist: 0.10 }], cost: { daoTamGainMult: 0.50 }, exclusions: { paths: [], professions: [] } },
    van_doc_the: { id: "van_doc_the", name: "Vạn Độc Thể", trigger: "eldritch_beast_survival", progressThreshold: 3, maxStage: 3, branch: "doc_sat", endingTags: ["doc_vuc_chu"], factionAffinity: { ngu_doc_giao: 5 }, benefit: { poisonResist: 0.50 }, stageEffects: [{ poisonResist: 0.50 }, { poisonResist: 0.70, corruptionResist: 0.05 }, { poisonResist: 0.90, corruptionResist: 0.10, stealth: 0.05 }], cost: { healingBlocked: true }, exclusions: { paths: [], professions: [] } },
    cuu_u_the: { id: "cuu_u_the", name: "Cửu U Thể", trigger: "vo_he_oath", progressThreshold: 1, maxStage: 3, branch: "u_minh", endingTags: ["u_minh_chu_te"], factionAffinity: { u_minh_than_giao: 5 }, benefit: { stealth: 0.20 }, stageEffects: [{ stealth: 0.20 }, { stealth: 0.35, corruptionResist: 0.05 }, { stealth: 0.50, corruptionResist: 0.12, fateResonance: 0.05 }], cost: { corruptionGain: 1 }, exclusions: { paths: [], professions: [] } },
    bat_tu_the: { id: "bat_tu_the", name: "Bất Tử Thể", trigger: "lifespan_break", progressThreshold: 1, maxStage: 3, branch: "bat_tu", endingTags: ["bat_tu_ke_tiep"], factionAffinity: { bac_minh_cung: 2 }, benefit: { reviveOnce: true }, stageEffects: [{ reviveOnce: true }, { reviveOnce: true, corruptionResist: 0.05 }, { reviveOnce: true, corruptionResist: 0.12 }], cost: { lifespan: 12 }, exclusions: { paths: [], professions: [] } },
    thien_sinh_dao_the: { id: "thien_sinh_dao_the", name: "Thiên Sinh Đạo Thể", trigger: "server_lore_claim", progressThreshold: 1, maxStage: 3, branch: "dao_the", endingTags: ["dao_the_nguyen_so"], factionAffinity: { thien_co_dien: 4 }, benefit: { fateResonance: 0.15 }, stageEffects: [{ fateResonance: 0.15 }, { fateResonance: 0.25, corruptionResist: 0.05 }, { fateResonance: 0.35, corruptionResist: 0.10, sanRecoveryFlat: 1 }], cost: { uniqueClaim: true }, exclusions: { paths: [], professions: [] } }
  });
  function specialPhysiqueCatalog() { return copy(SPECIAL_PHYSIQUE_CATALOG); }
  function validateSpecialPhysiqueCatalog() {
    const errors = [];
    const allowedEffectKeys = new Set(["corruptionResist", "poisonResist", "fateResonance", "stealth", "elementPenalty", "sanRecoveryFlat", "reviveOnce"]);
    Object.values(SPECIAL_PHYSIQUE_CATALOG).forEach((definition) => {
      const required = ["id", "name", "trigger", "progressThreshold", "maxStage", "branch", "endingTags", "stageEffects", "cost", "exclusions"];
      required.forEach((field) => { if (definition[field] === undefined || definition[field] === null) errors.push(definition.id + ":missing:" + field); });
      if (!Number.isInteger(Number(definition.maxStage)) || Number(definition.maxStage) < 1) errors.push(definition.id + ":invalid:maxStage");
      if (Number(definition.stageEffects?.length || 0) !== Number(definition.maxStage || 0)) errors.push(definition.id + ":stageEffects-length");
      if (!Array.isArray(definition.endingTags) || !definition.endingTags.length) errors.push(definition.id + ":endingTags");
      if (!Array.isArray(definition.exclusions?.paths) || !Array.isArray(definition.exclusions?.professions)) errors.push(definition.id + ":exclusions");
      if (Number(definition.progressThreshold) < 1 || Number(definition.progressThreshold) > 10) errors.push(definition.id + ":progressThreshold-range");
      Object.values(definition.stageEffects || []).forEach((effect, index) => Object.entries(effect || {}).forEach(([key, value]) => {
        if (!allowedEffectKeys.has(key)) errors.push(definition.id + ":unknown-effect-key:" + index + ":" + key);
        if (["corruptionResist", "poisonResist", "fateResonance", "stealth", "elementPenalty"].includes(key) && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1)) errors.push(definition.id + ":stageEffect-range:" + index + ":" + key);
      }));
      Object.entries(definition.benefit || {}).forEach(([key]) => { if (!allowedEffectKeys.has(key)) errors.push(definition.id + ":unknown-benefit-key:" + key); });
      [...(definition.exclusions?.paths || []), ...(definition.exclusions?.professions || [])].forEach((value) => { if (typeof value !== "string" || !value.trim()) errors.push(definition.id + ":invalid-exclusion"); });
      if (Object.values(definition.factionAffinity || {}).some((value) => Number(value) < -10 || Number(value) > 10)) errors.push(definition.id + ":factionAffinity-range");
      Object.entries(definition.factionAffinity || {}).forEach(([factionId, value]) => { if (!factionId || !Number.isFinite(Number(value))) errors.push(definition.id + ":factionAffinity:" + factionId); });
    });
    return { ok: errors.length === 0, count: Object.keys(SPECIAL_PHYSIQUE_CATALOG).length, errors };
  }
  function validatePathFusionCatalog() {
    const paths = window.PATH_FATE_RELATIONS?.paths || {};
    const titles = window.PATH_FATE_RELATIONS?.path_titles || {};
    const errors = [];
    Object.entries(paths).forEach(([id, relation]) => {
      ["lead", "support", "forbidden"].forEach((key) => { if (!Array.isArray(relation[key])) errors.push(id + ":missing:" + key); });
      if (!Array.isArray(titles[id]) || titles[id].length < 2) errors.push(id + ":path_titles");
    });
    const ids = Object.keys(paths);
    ids.forEach((primaryId) => ids.forEach((secondaryId) => {
      if (primaryId === secondaryId) return;
      const result = pathFusionAffinity(primaryId, secondaryId);
      if (!Number.isFinite(result.effective) || result.effective < 0 || result.effective > result.cap || result.cap !== 0.75) errors.push(primaryId + ":" + secondaryId + ":affinity");
    }));
    return { ok: errors.length === 0, count: ids.length, pairCount: ids.length * Math.max(0, ids.length - 1), errors };
  }
  function validateWorldCatalogs() {
    const errors = [];
    Object.entries(WEATHER_CATALOG).forEach(([id, definition]) => {
      if (!definition.label || !Number.isInteger(Number(definition.severity)) || Number(definition.severity) < 0 || Number(definition.severity) > 5) errors.push("weather:" + id + ":severity");
      if (!Number.isInteger(Number(definition.defaultDuration)) || Number(definition.defaultDuration) < 1) errors.push("weather:" + id + ":duration");
      if (!WEATHER_EFFECTS[id] || !Number.isFinite(Number(WEATHER_EFFECTS[id].travelRiskDelta)) || !Number.isInteger(Number(WEATHER_EFFECTS[id].fogLevel))) errors.push("weather:" + id + ":effects");
      (definition.transitions || []).forEach((target) => { if (!WEATHER_CATALOG[target]) errors.push("weather:" + id + ":transition:" + target); });
    });
    Object.entries(RECIPE_CATALOG).forEach(([id, recipe]) => {
      const outputValid = recipe.output && (recipe.output.itemId || recipe.output.kind);
      const successValid = recipe.successBase === undefined || (Number.isFinite(Number(recipe.successBase)) && Number(recipe.successBase) >= 0 && Number(recipe.successBase) <= 1);
      const perfectValid = recipe.perfectMultiplier === undefined || (Number.isFinite(Number(recipe.perfectMultiplier)) && Number(recipe.perfectMultiplier) >= 0);
      if (recipe.id !== id || !recipe.professionId || !outputValid || !successValid || !perfectValid || Object.values(recipe.materials || {}).some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0) || Object.values(recipe.costs || {}).some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)) errors.push("recipe:" + id);
    });
    const techniqueValidation = typeof E.validateTechniqueCatalog === "function" ? E.validateTechniqueCatalog() : { ok: false, errors: ["technique-validator-missing"], count: 0 };
    if (!techniqueValidation.ok) errors.push(...techniqueValidation.errors.map((error) => "technique:" + error));
    const structureCosts = Object.fromEntries(Object.entries(STRUCTURE_CATALOG).map(([id, definition]) => [id, definition.buildCost]));
    Object.entries(structureCosts).forEach(([type, cost]) => { if (!Number.isInteger(cost) || cost <= 0) errors.push("structure:" + type + ":cost"); });
    Object.entries(STRUCTURE_CATALOG).forEach(([type, definition]) => { if (!definition.effects || typeof definition.effects !== "object" || Number(definition.maxLevel) < 1 || Number(definition.refundRate) < 0 || Number(definition.refundRate) > 1) errors.push("structure:" + type + ":schema"); });
    const wardBase = { sanDrainReduction: 0.25, influence: 6, encounterRisk: -0.2, curseRisk: -0.25 };
    if (Object.keys(structureCosts).length !== 4 || wardBase.sanDrainReduction <= 0 || wardBase.sanDrainReduction > 0.75 || wardBase.influence <= 0) errors.push("structure:catalog");
    return { ok: errors.length === 0, weatherCount: Object.keys(WEATHER_CATALOG).length, recipeCount: Object.keys(RECIPE_CATALOG).length, techniqueCount: techniqueValidation.count, structureCount: Object.keys(structureCosts).length, errors };
  }
  function validateBalanceCatalog() {
    const errors = [];
    Object.entries(WEATHER_EFFECTS).forEach(([id, effects]) => {
      if (!Number.isFinite(Number(effects.travelRiskDelta)) || Number(effects.travelRiskDelta) < 0 || Number(effects.travelRiskDelta) > 0.25) errors.push("weather-risk:" + id);
    });
    Object.entries(WEATHER_CATALOG).forEach(([id, definition]) => {
      if (Number(definition.defaultDuration) > 7) errors.push("weather-duration:" + id);
    });
    Object.entries(RECIPE_CATALOG).forEach(([id, recipe]) => {
      Object.entries({ ...(recipe.materials || {}), ...(recipe.costs || {}) }).forEach(([key, value]) => {
        if (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 99) errors.push("recipe-cost:" + id + ":" + key);
      });
    });
    Object.entries(SPECIAL_PHYSIQUE_CATALOG).forEach(([id, definition]) => {
      Object.entries(definition.cost || {}).forEach(([key, value]) => {
        if (typeof value !== "boolean" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) errors.push("diThe-cost:" + id + ":" + key);
      });
    });
    Object.entries(STRUCTURE_CATALOG).forEach(([id, definition]) => {
      if (!Number.isInteger(Number(definition.buildCost)) || Number(definition.buildCost) < 1 || Number(definition.buildCost) > 100) errors.push("structure-build-cost:" + id);
      if (!Number.isFinite(Number(definition.upgradeBase)) || Number(definition.upgradeBase) < 1 || Number(definition.upgradeBase) > Number(definition.buildCost) * 2) errors.push("structure-upgrade-cost:" + id);
      if (!Number.isFinite(Number(definition.refundRate)) || Number(definition.refundRate) < 0 || Number(definition.refundRate) > 0.5) errors.push("structure-refund:" + id);
    });
    const rewardAudit = validateRewardPolicy();
    if (!rewardAudit.ok) errors.push("reward-policy");
    const pathAudit = validatePathFusionCatalog();
    if (!pathAudit.ok) errors.push(...pathAudit.errors.map((error) => "path-balance:" + error));
    return { ok: errors.length === 0, errors, weatherCount: Object.keys(WEATHER_CATALOG).length, recipeCount: Object.keys(RECIPE_CATALOG).length, structureCount: Object.keys(STRUCTURE_CATALOG).length, physiqueCount: Object.keys(SPECIAL_PHYSIQUE_CATALOG).length };
  }

  const STRUCTURE_CATALOG = Object.freeze({
    waystation: { id: "waystation", buildCost: 20, repairDivisor: 10, upgradeBase: 12, maxLevel: 3, refundRate: 0.4, chargesPerUpgrade: 50, effects: { fastTravel: true } },
    ward_formation: { id: "ward_formation", buildCost: 15, repairDivisor: 10, upgradeBase: 12, maxLevel: 3, refundRate: 0.4, sanDrainReductionPerUpgrade: 0.05, influencePerUpgrade: 2, effects: { encounterRisk: -0.2, curseRisk: -0.25, sanDrainReduction: 0.25, influence: 6 } },
    watchtower: { id: "watchtower", buildCost: 12, repairDivisor: 10, upgradeBase: 12, maxLevel: 3, refundRate: 0.4, effects: { revealRadius: 2 } },
    trading_post: { id: "trading_post", buildCost: 18, repairDivisor: 10, upgradeBase: 12, maxLevel: 3, refundRate: 0.4, effects: { itinerantMerchant: true } }
  });
  function structureCatalog() { return copy(STRUCTURE_CATALOG); }
  function validateStructureRuntimeState(state) {
    ensure(state); const errors = [], map = ensureMapState(state), validOwners = new Set(["player", "npc", "faction"]);
    if (!map.structures || typeof map.structures !== "object") return { ok: false, errors: ["structures:missing"] };
    Object.entries(map.structures).forEach(([nodeId, list]) => {
      if (!Array.isArray(list)) { errors.push(nodeId + ":list"); return; }
      const ids = new Set(), activeTypes = new Set();
      list.forEach((structure) => {
        const definition = STRUCTURE_CATALOG[structure?.type];
        if (!structure?.id || ids.has(structure.id)) errors.push(nodeId + ":id");
        ids.add(structure?.id);
        if (!definition) errors.push(nodeId + ":type");
        if (!validOwners.has(structure?.ownerType) || !structure.ownerId) errors.push(nodeId + ":owner");
        if (!["active", "disabled", "damaged", "dismantled"].includes(structure?.status)) errors.push(nodeId + ":status");
        if (!Number.isFinite(Number(structure?.integrity)) || Number(structure.integrity) < 0 || Number(structure.integrity) > 100) errors.push(nodeId + ":integrity");
        if (!Number.isInteger(Number(structure?.level)) || Number(structure.level) < 1 || Number(structure.level) > Number(definition?.maxLevel || 1)) errors.push(nodeId + ":level");
        if (structure?.type === "waystation" && (!Number.isFinite(Number(structure.charges)) || Number(structure.charges) < 0)) errors.push(nodeId + ":charges");
        if (!Array.isArray(structure?.transferHistory)) errors.push(nodeId + ":transferHistory");
        if (structure?.status !== "dismantled") {
          if (activeTypes.has(structure.type)) errors.push(nodeId + ":duplicate-active-type:" + structure.type);
          activeTypes.add(structure.type);
        }
      });
    });
    Object.entries(state.inventory || {}).forEach(([id, quantity]) => { if (!Number.isFinite(Number(quantity)) || Number(quantity) < 0) errors.push("inventory:" + id); });
    return { ok: errors.length === 0, errors, nodeCount: Object.keys(map.structures).length };
  }
  function validateGuildProjectState(state) {
    ensure(state);
    const project = state.guildProject, errors = [];
    if (!project) return { ok: true, errors: [] };
    const template = (X.guildProjects || []).find((entry) => entry.id === project.templateId);
    if (!template) errors.push("template");
    if (!project.id || !project.guildId) errors.push("identity");
    if (!['active', 'completed', 'failed'].includes(project.status)) errors.push("status");
    if (!Number.isFinite(Number(project.startDay)) || !Number.isFinite(Number(project.endDay)) || Number(project.endDay) < Number(project.startDay)) errors.push("schedule");
    if (!Number.isFinite(Number(project.progress)) || Number(project.progress) < 0 || (template && Number(project.progress) > Number(template.target))) errors.push("progress");
    if (!project.playerContributions || typeof project.playerContributions !== "object") errors.push("contributions");
    if (project.status === "completed" && !Number.isFinite(Number(project.completedDay))) errors.push("completedDay");
    return { ok: errors.length === 0, errors };
  }
  function designPolicySnapshot(state) {
    ensure(state);
    const pathState = state.pathState || {};
    const sim = state.worldSimulation || {};
    return {
      fateRelationshipDecay: "none",
      maxPathSlots: 2,
      pathSlots: [pathState.primaryPathId, pathState.secondaryPathId].filter(Boolean).length,
      diTheExclusionPolicy: "catalog_only_no_automatic_lock",
      structureOwnership: "explicit_owner_player_npc_faction",
      offlineMode: sim.offlinePolicy?.mode || "aggregate_then_actor_window",
      offlineActorResolution: sim.offlinePolicy?.actorResolution || "deterministic_event_projection",
      offlineDetailedWindowDays: Number(sim.offlinePolicy?.detailedWindowDays || 30),
      offlineHistoryRetentionDays: Number(sim.offlinePolicy?.historyRetentionDays || 30)
    };
  }
  function validateDesignPolicies(state) {
    ensure(state);
    const errors = [], snapshot = designPolicySnapshot(state), path = state.pathState || {};
    Object.entries(state.player?.fateRelationships || {}).forEach(([id, record]) => {
      if ((record.decayPolicy || "none") !== "none") errors.push("fateDecay:" + id);
      if (Number(record.points || 0) < 0 || Number(record.stage || 0) < 0 || Number(record.stage || 0) > 4) errors.push("fateRelationshipRange:" + id);
    });
    if (snapshot.pathSlots > 2 || (path.secondaryPathId && path.secondaryPathId === path.primaryPathId)) errors.push("pathSlotLimit");
    if (path.fusionAffinity && (Number(path.fusionAffinity.effective) < 0 || Number(path.fusionAffinity.effective) > 0.75)) errors.push("pathFusionCap");
    const active = state.specialPhysiqueState?.activeId && SPECIAL_PHYSIQUE_CATALOG[state.specialPhysiqueState.activeId];
    if (active) {
      const exclusions = active.exclusions || { paths: [], professions: [] };
      if (!Array.isArray(exclusions.paths) || !Array.isArray(exclusions.professions)) errors.push("diTheExclusions");
    }
    Object.values(state.mapState?.structures || {}).flat().forEach((structure) => {
      if (!structure || structure.status === "dismantled") return;
      if (!["player", "npc", "faction"].includes(structure.ownerType) || !structure.ownerId) errors.push("structureOwner:" + (structure.id || "unknown"));
    });
    if (snapshot.offlineMode !== "aggregate_then_actor_window" || snapshot.offlineActorResolution !== "deterministic_event_projection" || snapshot.offlineDetailedWindowDays < 1 || snapshot.offlineHistoryRetentionDays < 1) errors.push("offlinePolicy");
    return { ok: errors.length === 0, policy: snapshot, errors };
  }
  function validateProductPolicies(state) {
    ensure(state); const errors = [], policy = productPolicySnapshot(), path = state.pathState || {}, diThe = state.specialPhysiqueState?.activeId;
    Object.values(state.player?.fateRelationships || {}).forEach((record, index) => { if ((record.decayPolicy || "none") !== policy.fateDecay) errors.push("fateDecay:" + index); });
    if ((state.pathState?.primaryPathId ? 1 : 0) + (state.pathState?.secondaryPathId ? 1 : 0) > policy.maxPaths) errors.push("pathSlots");
    if (path.fusionAffinity && Number(path.fusionAffinity.effective || 0) > policy.fusionAffinityCap) errors.push("fusionCap");
    if (diThe && policy.diTheLocksProfession) errors.push("diTheProfessionLockPolicy");
    Object.values(state.mapState?.structures || {}).flat().forEach((structure) => {
      if (!structure || structure.status === "dismantled") return;
      if (!policy.structureOwnership.includes(structure.ownerType) || !structure.ownerId) errors.push("structureOwner:" + (structure.id || "unknown"));
      (structure.transferHistory || []).forEach((entry) => { if (!entry.from || !entry.to || !Number.isFinite(Number(entry.day))) errors.push("structureTransfer:" + structure.id); });
    });
    const offline = state.worldSimulation?.offlinePolicy || {};
    if (offline.mode !== policy.offlineMode || Number(offline.detailedWindowDays || 0) < 1 || Number(offline.historyRetentionDays || 0) < 1) errors.push("offlinePolicy");
    return { ok: errors.length === 0, policy, errors };
  }
  function specialPhysiqueModifiers(state) {
    ensure(state);
    const definition = SPECIAL_PHYSIQUE_CATALOG[state.specialPhysiqueState.activeId];
    const cost = definition?.cost || {};
    const record = definition ? state.specialPhysiqueState.history.slice().reverse().find((entry) => entry.id === definition.id) : null;
    const stage = clamp(record?.stage || (state.specialPhysiqueState.activeId === definition?.id ? 1 : 0), 0, Number(definition?.maxStage || 1));
    const benefit = { ...(definition?.benefit || {}), ...((definition?.stageEffects || [])[Math.max(0, stage - 1)] || {}) };
    return { id: definition?.id || null, name: definition?.name || null, stage, maxStage: Number(definition?.maxStage || 1), branch: definition?.branch || null, endingTags: copy(definition?.endingTags || []), factionAffinity: copy(definition?.factionAffinity || {}), exclusions: copy(definition?.exclusions || { paths: [], professions: [] }), benefit: copy(benefit), cost: copy(cost), ...benefit };
  }
  function specialPhysiqueOutcome(state) {
    const current = specialPhysiqueModifiers(state);
    if (!current.id) return { activeId: null, stage: 0, endingTags: [], factionAffinity: {}, branch: null };
    const stageRatio = Math.max(1, Number(current.stage || 1)) / Math.max(1, Number(current.maxStage || 1));
    const factionAffinity = Object.fromEntries(Object.entries(current.factionAffinity || {}).map(([id, value]) => [id, Math.round(Number(value || 0) * stageRatio * 100) / 100]));
    return { activeId: current.id, stage: current.stage, maxStage: current.maxStage, branch: current.branch, endingTags: current.endingTags.slice(), factionAffinity };
  }
  function validateSpecialPhysiqueState(state) {
    const rawActiveId = state?.specialPhysiqueState?.activeId || null;
    ensure(state); const errors = [], runtime = state.specialPhysiqueState || {};
    if (rawActiveId && !SPECIAL_PHYSIQUE_CATALOG[rawActiveId]) errors.push("activeId");
    if (runtime.activeId && !SPECIAL_PHYSIQUE_CATALOG[runtime.activeId]) errors.push("activeId");
    if (runtime.activeId && state.player?.specialPhysique !== runtime.activeId) errors.push("playerMirror");
    Object.entries(runtime.progress || {}).forEach(([trigger, value]) => { if (!trigger || !Number.isFinite(Number(value)) || Number(value) < 0) errors.push("progress:" + trigger); });
    Object.entries(runtime.candidates || {}).forEach(([id, candidate]) => {
      const definition = SPECIAL_PHYSIQUE_CATALOG[id];
      if (!definition || candidate?.id !== id || !Number.isFinite(Number(candidate?.progress)) || Number(candidate.progress) < Number(definition.progressThreshold || 1)) errors.push("candidate:" + id);
    });
    const ids = new Set();
    (runtime.history || []).forEach((entry) => {
      if (!SPECIAL_PHYSIQUE_CATALOG[entry?.id] || ids.has(entry.id) || !Number.isFinite(Number(entry.day)) || !Number.isInteger(Number(entry.stage)) || Number(entry.stage) < 1 || Number(entry.stage) > Number(SPECIAL_PHYSIQUE_CATALOG[entry.id]?.maxStage || 1)) errors.push("history");
      ids.add(entry?.id);
    });
    if (!Array.isArray(runtime.rejectedIds) || new Set(runtime.rejectedIds).size !== runtime.rejectedIds.length) errors.push("rejectedIds");
    return { ok: errors.length === 0, errors, activeId: runtime.activeId || null };
  }
  function progressionNamespaceSnapshot(state) {
    ensure(state);
    return {
      path: { primaryId: state.pathState.primaryPathId || null, secondaryId: state.pathState.secondaryPathId || null, hiddenId: state.pathState.hiddenPathId || null },
      profession: { primaryId: state.professionState?.primaryId || null, secondaryId: state.professionState?.secondaryId || null, hiddenIds: (state.professionState?.hiddenIds || []).slice() },
      diThe: { activeId: state.specialPhysiqueState?.activeId || null, candidateIds: Object.keys(state.specialPhysiqueState?.candidates || {}) },
      fusion: state.pathState?.fusionAffinity || null,
      policy: { pathFusion: "explicit_transition_only", fusionAffinityCap: 0.75, diTheLocksProfession: false, diTheLocksPath: false }
    };
  }
  function pathFusionAffinity(primaryId, secondaryId) {
    const primary = window.PATH_FATE_RELATIONS?.paths?.[primaryId] || {};
    const secondary = window.PATH_FATE_RELATIONS?.paths?.[secondaryId] || {};
    const primaryTerms = [...(primary.lead || []), ...(primary.support || [])].map((value) => String(value).toLowerCase());
    const secondaryTerms = [...(secondary.lead || []), ...(secondary.support || [])].map((value) => String(value).toLowerCase());
    const shared = secondaryTerms.filter((value) => primaryTerms.includes(value)).length;
    const conflicts = (primary.forbidden || []).filter((value) => secondaryTerms.includes(String(value).toLowerCase())).length + (secondary.forbidden || []).filter((value) => primaryTerms.includes(String(value).toLowerCase())).length;
    const raw = Math.max(0, Math.min(1, 0.5 + shared * 0.125 - conflicts * 0.2));
    const cap = 0.75;
    return { primaryId, secondaryId, raw: Number(raw.toFixed(3)), cap, effective: Number(Math.min(raw, cap).toFixed(3)), sharedTerms: shared, conflictTerms: conflicts };
  }
  function transitionSecondaryPath(state, pathId, options = {}) {
    ensure(state);
    const id = String(pathId || "");
    const relation = window.PATH_FATE_RELATIONS?.paths?.[id];
    const primary = state.pathState.primaryPathId || state.player.pathId;
    if (!relation) return { success: false, reason: "Con Đường phụ không tồn tại." };
    if (!primary) return { success: false, reason: "Cần có Con Đường chính trước." };
    if (primary === id) return { success: false, reason: "Con Đường phụ phải khác Con Đường chính." };
    if (state.pathState.secondaryPathId) return { success: false, reason: "Đã có Con Đường phụ; muốn đổi phải qua một transition riêng." };
    if (!options.confirmed) return { success: false, requiresConfirmation: true, reason: "Dung Hợp Con Đường là transition vĩnh viễn, cần xác nhận." };
    const cost = { essence: 20, merit: 15, san: 10 };
    if (Number(state.fateExcessEssence || 0) < cost.essence || Number(state.player.merit || 0) < cost.merit || Number(state.player.san || 0) < cost.san) return { success: false, reason: "Thiếu tài nguyên để Dung Hợp Con Đường.", cost };
    state.fateExcessEssence -= cost.essence; state.player.merit -= cost.merit; state.player.san -= cost.san;
    state.pathState.secondaryPathId = id; state.player.secondaryPathId = id;
    state.pathState.fusionAffinity = pathFusionAffinity(primary, id);
    state.pathState.history.push({ type: "secondary_path", from: primary, to: id, day: playerDay(state), cost });
    history(state, "sys", "✦ Dung Hợp Con Đường hoàn tất: " + primary + " · " + id + ".");
    return { success: true, primaryPathId: primary, secondaryPathId: id, cost, fusionAffinity: copy(state.pathState.fusionAffinity), policy: "explicit_transition_only" };
  }
  function recordSpecialPhysiqueProgress(state, input = {}) {
    ensure(state); const trigger = String(input.type || input.trigger || "");
    if (!trigger) return { success: false, reason: "Thiếu dấu mốc." };
    const candidate = Object.values(SPECIAL_PHYSIQUE_CATALOG).find((item) => item.trigger === trigger);
    if (!candidate) return { success: false, reason: "Dấu mốc Dị Thể không tồn tại." };
    const rawAmount = input.amount == null ? 1 : Number(input.amount);
    if (input.success === false) return { success: true, progress: Number(state.specialPhysiqueState.progress[trigger] || 0), candidate: candidate.id, advanced: false };
    if (!Number.isFinite(rawAmount) || rawAmount < 0) return { success: false, reason: "Mức tiến triển Dị Thể không hợp lệ." };
    const progress = state.specialPhysiqueState.progress;
    progress[trigger] = Math.max(0, Number(progress[trigger] || 0)) + rawAmount;
    if (trigger === "eldritch_beast_survival") progress.eldritchBeastSurvivals = progress[trigger];
    const activeId = state.specialPhysiqueState.activeId;
    const active = activeId && SPECIAL_PHYSIQUE_CATALOG[activeId];
    const activeRecord = active && state.specialPhysiqueState.history.slice().reverse().find((entry) => entry.id === activeId);
    if (active && activeRecord && active.trigger === trigger && Number(activeRecord.stage || 1) < Number(active.maxStage || 1) && progress[trigger] >= Number(active.progressThreshold || 1) * (Number(activeRecord.stage || 1) + 1)) {
      activeRecord.stage = Number(activeRecord.stage || 1) + 1;
      activeRecord.stageDay = playerDay(state);
      history(state, "narr", "Dị Thể " + active.name + " ăn sâu thêm một tầng vào huyết mạch.");
    }
    if (candidate && progress[trigger] >= Number(candidate.progressThreshold || 1) && !state.specialPhysiqueState.activeId && !state.specialPhysiqueState.rejectedIds.includes(candidate.id)) state.specialPhysiqueState.candidates[candidate.id] = { id: candidate.id, progress: progress[trigger], discoveredDay: playerDay(state), stage: 1 };
    return { success: true, progress: progress[trigger], candidate: candidate?.id || null };
  }
  function claimSpecialPhysique(state, id) {
    ensure(state); const def = SPECIAL_PHYSIQUE_CATALOG[id];
    if (!def || state.specialPhysiqueState.activeId) return { success: false, reason: "Cơ thể đã có Dị Thể hoặc lựa chọn không tồn tại." };
    if (!state.specialPhysiqueState.candidates[id]) return { success: false, reason: "Chưa đủ dấu mốc để chứng minh xứng đáng." };
    state.specialPhysiqueState.activeId = id; state.player.specialPhysique = id;
    state.specialPhysiqueState.history.push({ id, day: playerDay(state), source: def.trigger, stage: 1, branch: def.branch || null });
    history(state, "narr", "Một biến đổi sâu kín thức dậy trong huyết nhục; từ hôm nay, " + def.name + " vừa là ân huệ vừa là món nợ.");
    return { success: true, definition: def };
  }

  // Companion runtime contract.  These fields are additive so old saves remain
  // loadable while combat/diagnostic code can explain exactly why a companion
  // was injured, defeated, or is temporarily unavailable.
  function normalizeCompanion(companion) {
    if (!companion) return null;
    companion.hpMax = Math.max(1, Number(companion.hpMax || 30));
    companion.hp = clamp(companion.hp == null ? companion.hpMax : companion.hp, 0, companion.hpMax);
    companion.role = companion.role || (companion.passiveId === "scout" ? "scout" : "striker");
    companion.guardStance = companion.guardStance || "balanced";
    companion.skillMastery = companion.skillMastery || {};
    companion.damageLedger = Array.isArray(companion.damageLedger) ? companion.damageLedger.slice(-20) : [];
    companion.lastDamageSource = companion.lastDamageSource || null;
    companion.recoveryUntilDay = Number(companion.recoveryUntilDay || 0);
    companion.reviveCount = Number(companion.reviveCount || 0);
    if (companion.state === "dead" && companion.hp > 0) companion.hp = 0;
    if (companion.state === "active" && companion.hp <= 0) companion.state = "recovering";
    return companion;
  }
  function validateCompanionState(state) {
    const companion = state.companion, errors = [], allowed = new Set(["active", "mutated", "recovering", "dead", "released"]);
    if (!companion) return { ok: true, present: false, errors };
    normalizeCompanion(companion);
    if (!allowed.has(companion.state)) errors.push("state");
    ["loyalty", "corruption"].forEach((key) => { if (Number(companion[key] || 0) < 0 || Number(companion[key] || 0) > 100) errors.push(key); });
    Object.entries(companion.skillMastery || {}).forEach(([id, value]) => { if (!id || !Number.isFinite(Number(value)) || Number(value) < 0) errors.push("mastery:" + id); });
    if (!Array.isArray(companion.damageLedger) || companion.damageLedger.length > 20) errors.push("damageLedger");
    (companion.damageLedger || []).forEach((entry) => { if (!Number.isFinite(Number(entry.amount)) || Number(entry.amount) < 0 || !Number.isFinite(Number(entry.day))) errors.push("damageEntry"); });
    if (!Number.isFinite(Number(companion.recoveryUntilDay || 0)) || !Number.isFinite(Number(companion.reviveCount || 0)) || Number(companion.reviveCount || 0) < 0) errors.push("recovery");
    return { ok: errors.length === 0, present: true, state: companion.state, errors };
  }
  function validatePrisonerState(state) {
    ensure(state); const errors = [], allowed = new Set(["held", "released", "turned_in", "executed", "tamed"]);
    Object.entries(state.prisoners || {}).forEach(([key, prisoner]) => {
      if (!prisoner || prisoner.id !== key) errors.push(key + ":identity");
      if (!prisoner || !allowed.has(prisoner.status)) errors.push(key + ":status");
      if (!prisoner || !prisoner.entityId || !Number.isFinite(Number(prisoner.capturedDay))) errors.push(key + ":origin");
      if (prisoner?.status === "held" && (!Number.isFinite(Number(prisoner.resolveByDay)) || Number(prisoner.resolveByDay) < Number(prisoner.capturedDay))) errors.push(key + ":expiry");
      if (prisoner && Number(prisoner.resistance || 0) < 0 || Number(prisoner?.resistance || 0) > 100) errors.push(key + ":resistance");
    });
    return { ok: errors.length === 0, errors };
  }

  function companionTargetScore(state, targetId, options = {}) {
    const companion = normalizeCompanion(state.companion);
    const target = E.combatEntity(state, targetId) || {};
    if (!companion || !target || Number(target.hp || 0) <= 0) return -Infinity;
    const threat = Number(target.damage || target.phy || target.attack || 0);
    const wounded = 1 - clamp(Number(target.hp || 0) / Math.max(1, Number(target.hpMax || target.maxHp || target.hp || 1)), 0, 1);
    const guardBonus = companion.guardStance === "guard" && options.protectPlayer ? threat * 0.35 : 0;
    const roleBonus = companion.role === "scout" ? Number(target.diff || 0) * 0.1 : threat * 0.15;
    return wounded * 30 + threat + guardBonus + roleBonus + (seeded(state, "companion-target:" + targetId, absoluteDay(state.gameClock)) * 0.01);
  }

  function selectCompanionTarget(state, options = {}) {
    ensure(state);
    if (!state.companion || !["active", "mutated"].includes(state.companion.state)) return null;
    return E.aliveEnemies(state).map(([id]) => id).sort((a, b) => companionTargetScore(state, b, options) - companionTargetScore(state, a, options))[0] || null;
  }
  function useCompanionSkill(state, skillId = "guard_bite") {
    ensure(state); const companion = normalizeCompanion(state.companion); const target = selectCompanionTarget(state) || E.aliveEnemies(state)[0]?.[0];
    if (!companion || !target) return { success: false, reason: "Dị Thú chưa có mục tiêu." };
    const damage = Math.max(1, Math.round(Number(companion.attack || 8) + Number(companion.loyalty || 0) * 0.08));
    if (typeof E.applyPlayerDamage === "function") E.applyPlayerDamage(state, target, damage);
    else state.enemies[target] = Math.max(0, Number(state.enemies[target] || 0) - damage);
    companion.skillMastery[skillId] = Number(companion.skillMastery[skillId] || 0) + 1;
    return { success: true, damage, targetId: target, skillId };
  }

  function recordCompanionDamage(state, amount, source = "unknown", damageType = "combat") {
    ensure(state); const companion = normalizeCompanion(state.companion);
    if (!companion || !["active", "mutated"].includes(companion.state)) return { success: false, reason: "Dị Thú không ở trạng thái chiến đấu." };
    const damage = Math.max(0, Math.floor(Number(amount) || 0));
    const day = absoluteDay(state.gameClock);
    const entry = { day, amount: damage, source: String(source), damageType: String(damageType) };
    companion.damageLedger.push(entry); companion.damageLedger = companion.damageLedger.slice(-20);
    companion.lastDamageSource = entry; companion.hp = clamp(companion.hp - damage, 0, companion.hpMax);
    if (companion.hp <= 0) {
      companion.state = "recovering"; companion.recoveryUntilDay = day + 3;
      history(state, "warn", "× " + (companion.customName || "Dị Thú") + " trọng thương và cần thời gian hồi phục.");
    }
    return { success: true, damage, companion };
  }
  function simulateOfflineCompanionCombat(state, day = absoluteDay(state.gameClock)) {
    ensure(state); const companion = normalizeCompanion(state.companion);
    if (!companion || !["active", "mutated"].includes(companion.state)) return { success: false, reason: "Dị Thú không sẵn sàng." };
    const chance = seeded(state, "offline-companion-combat", Number(day), 0);
    if (chance < 0.35) return { success: true, damaged: false, day };
    return { success: true, damaged: true, day, result: recordCompanionDamage(state, 1 + Math.floor(seeded(state, "offline-companion-damage", Number(day), 1) * 5), "biến cố ngoại tuyến", "combat") };
  }

  function recoverCompanion(state, options = {}) {
    ensure(state); const companion = normalizeCompanion(state.companion);
    if (!companion || companion.state !== "recovering") return { success: false, reason: "Dị Thú không cần hồi phục." };
    const day = absoluteDay(state.gameClock);
    const safe = Boolean(options.safeNode || D.LOCATIONS?.[state.locationId]?.safe_for_ritual || D.LOCATIONS?.[state.locationId]?.safe);
    if (!safe && day < companion.recoveryUntilDay) return { success: false, reason: "Cần nghỉ đủ 3 ngày hoặc đến một cứ điểm an toàn.", recoveryUntilDay: companion.recoveryUntilDay };
    companion.hp = Math.max(1, Math.ceil(companion.hpMax * 0.5)); companion.state = "active"; companion.recoveryUntilDay = 0;
    history(state, "sys", "◇ " + (companion.customName || "Dị Thú") + " đã hồi phục và có thể đồng hành trở lại.");
    return { success: true, companion };
  }

  function reviveCompanion(state) {
    ensure(state); const companion = normalizeCompanion(state.companion);
    if (!companion || !["dead", "recovering"].includes(companion.state)) return { success: false, reason: "Không có Dị Thú cần cứu sinh." };
    const safe = Boolean(D.LOCATIONS?.[state.locationId]?.safe_for_ritual || D.LOCATIONS?.[state.locationId]?.safe);
    if (!safe) return { success: false, reason: "Chỉ có thể cứu sinh tại cứ điểm an toàn." };
    if (Number(state.inventory?.linh_thach || 0) < 3) return { success: false, reason: "Cần 3 Linh Thạch để cứu sinh." };
    removeItem(state, "linh_thach", 3); companion.hp = Math.max(1, Math.ceil(companion.hpMax * 0.25)); companion.state = "active"; companion.reviveCount += 1; companion.recoveryUntilDay = 0;
    history(state, "sys", "✦ " + (companion.customName || "Dị Thú") + " được cứu sinh; nguyên khí còn yếu.");
    return { success: true, companion };
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
    if (!def) return { success: false, reason: "Nghề Ẩn không tồn tại." };
    const key = professionId + ":" + nodeId;
    const progress = state.hiddenProfessionState;
    if (progress.clues[key]) return { success: false, reason: "Manh mối này đã được ghi nhớ." };
    const graph = state.hiddenProfessionGraph[professionId]; const node = graph?.nodes?.find((entry) => entry.id === nodeId);
    if (!node) return { success: false, reason: "Nút manh mối không tồn tại trong đồ thị nghề ẩn." };
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
      state.player.san = clamp(Number(state.player.san || 0) - 2, 0, Number(state.player.maxSan || 100));
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
      history(state, "narr", "Dưới ánh đèn leo lét, ngươi đọc những dòng chữ của " + def.name + ": " + def.clue); return { success: true, record };
    }
    if (action === "decrypt" && record.clues.includes("lore:" + codexId)) {
      record.status = "verified"; const clue = state.discoveries.codexClues["lore:" + codexId]; if (clue) { clue.verified = true; clue.confidence = 1; clue.verifiedDay = day; }
      history(state, "narr", "Những lớp mật tự tách ra; " + def.name + " hiện nguyên nghĩa trước mắt ngươi."); return { success: true, record };
    }
    if (action === "collect" && record.status === "verified") { record.status = "collected"; record.collectedDay = day; history(state, "narr", "Ngươi thu thập " + def.name + ", mang theo tiếng vọng cổ xưa khỏi " + currentRegion(state) + "."); if (codexProgress(state) >= 7) { state.hiddenProfessionChoices = Object.keys(X.hiddenProfessions || {}); history(state, "narr", "Bảy Cổ Tịch đã quy tụ; những nghề ẩn bắt đầu hiện hình."); } return { success: true, record }; }
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
      const reward = { exp: normalizedRarity === "cực hiếm" ? 80 : 40, merit: normalizedRarity === "cực hiếm" ? 3 : 1 };
      const granted = grantCanonicalReward(state, "collection:" + collectionType + ":" + key, reward, entry.rewardKey);
      if (granted.success) { state.collectionRewardKeys[entry.rewardKey] = true; entry.rewardClaimed = true; }
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
    const dayNow = absoluteDay(state.gameClock);
    const result = { cultivationMult: 1, combatPowerByElement: {}, encounterChanceMult: 1, searchRiskDelta: 0, searchRewardMult: 1, marketPriceMult: 1, sanDrainMult: 1, travelRiskDelta: 0, qiRecoveryMult: 1, sanRecoveryFlat: 0, corruptionResist: 0, poisonResist: 0, stealth: 0, fateResonance: 0, elementPenalty: 1, reviveOnce: false, tags: [] };
    const physique = specialPhysiqueModifiers(state);
    if (physique.id) {
      result.corruptionResist += Number(physique.corruptionResist || 0);
      result.poisonResist += Number(physique.poisonResist || 0);
      result.stealth += Number(physique.stealth || 0);
      result.fateResonance += Number(physique.fateResonance || 0);
      result.sanRecoveryFlat += Number(physique.sanRecoveryFlat || 0);
      if (physique.elementPenalty != null) result.elementPenalty *= Number(physique.elementPenalty);
      result.reviveOnce = Boolean(physique.reviveOnce);
      result.tags.push("di_the:" + physique.id);
    }
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
    const weatherState = weatherSnapshot(state, regionId); const weather = weatherState.id; result.travelRiskDelta += Number(weatherState.effects.travelRiskDelta || 0);
    if (weather === "mua") { result.combatPowerByElement.hoa = Number(result.combatPowerByElement.hoa || 1) * 0.9; result.combatPowerByElement.thuy = Number(result.combatPowerByElement.thuy || 1) * 1.1; }
    if (weather === "loi_vu") result.combatPowerByElement.loi = Number(result.combatPowerByElement.loi || 1) * 1.2;
    if (weather === "tuyet") { result.combatPowerByElement.hoa = Number(result.combatPowerByElement.hoa || 1) * 0.82; }
    if (weather === "suong") { result.stealth += 0.12; result.searchRiskDelta += 0.03; }
    if (weather === "am_vu") { result.sanDrainMult *= 1.12; result.corruptionResist -= 0.05; }
    if (weather === "bao_linh_khi") { result.sanDrainMult *= 1.18; result.qiRecoveryMult *= 1.2; }
    Object.values(state.placedFormations || {}).filter((formation) => formation.nodeId === state.locationId && formation.expiresDay >= absoluteDay(state.gameClock)).forEach((formation) => {
      if (formation.purpose === "gather") result.cultivationMult *= 1.1;
      if (formation.purpose === "protect") result.sanDrainMult *= 0.85;
    });
    const ward = wardProtectionAtNode(state, context.nodeId || state.locationId);
    if (ward.active) { result.encounterChanceMult = clamp(result.encounterChanceMult + ward.encounterRisk, 0.5, 2); result.travelRiskDelta += ward.encounterRisk; result.curseRiskDelta = Number(ward.curseRisk || 0); result.corruptionGainMult = clamp(1 + Number(ward.curseRisk || 0), 0.5, 2); result.sanDrainMult *= clamp(1 - Number(ward.sanDrainReduction || 0), 0.25, 1); }
    if (state.guildProject?.status === "completed" && state.guildProject.rewardUntilDay >= absoluteDay(state.gameClock)) {
      const project = (X.guildProjects || []).find((entry) => entry.id === state.guildProject.templateId);
      if (project?.reward?.cultivationMult) result.cultivationMult *= project.reward.cultivationMult;
      if (project?.reward?.sanDrainMult) result.sanDrainMult *= project.reward.sanDrainMult;
    }
    if (state.companion?.state === "recovering" && dayNow >= Number(state.companion.recoveryUntilDay || Infinity)) recoverCompanion(state, { safeNode: true });
    if (state.companion?.state === "active" || state.companion?.state === "mutated") {
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
  function validateWorldEventState(state) {
    ensure(state);
    const errors = [], events = state.worldSimulation?.events || {}, regions = state.worldSimulation?.regionState || {};
    Object.entries(events).forEach(([key, event]) => {
      const template = worldEventTemplate(event?.templateId);
      if (!event || event.id !== key) errors.push(key + ":identity");
      if (!template) errors.push(key + ":template");
      if (!event || !regions[event.regionId]) errors.push(key + ":region");
      if (!event || !["active", "resolved", "cancelled"].includes(event.status)) errors.push(key + ":status");
      if (!event || !Number.isFinite(Number(event.phaseIndex)) || !Number.isFinite(Number(event.phaseStartedDay)) || !Number.isFinite(Number(event.phaseEndsDay))) errors.push(key + ":timeline");
      if (!event || !Array.isArray(event.choiceHistory)) errors.push(key + ":choices");
      if (event?.status === "active" && template && (event.phaseIndex < 0 || event.phaseIndex >= template.phases.length)) errors.push(key + ":phase");
    });
    Object.entries(regions).forEach(([regionId, region]) => {
      if (region.activeEventId && (!events[region.activeEventId] || events[region.activeEventId].status !== "active" || events[region.activeEventId].regionId !== regionId)) errors.push(regionId + ":activeEvent");
    });
    return { ok: errors.length === 0, errors };
  }

  function setWeather(state, regionId, weather, durationDays = null, source = "resolver") {
    ensure(state); const id = regionId || currentRegion(state); const region = state.worldSimulation.regionState[id];
    const weatherId = normalizeWeatherId(weather);
    if (!region || !WEATHER_CATALOG[weatherId]) return { success: false, reason: "Thời tiết hoặc khu vực không hợp lệ." };
    const definition = WEATHER_CATALOG[weatherId];
    const previous = normalizeWeatherId(region.weather || "quang"), day = absoluteDay(state.gameClock);
    region.weather = weatherId; region.weatherSeverity = definition.severity; region.weatherIntensity = clamp(region.weatherIntensity || Math.max(1, definition.severity), 0, 5); region.weatherUntilDay = day + Math.max(1, Math.floor(Number(durationDays == null ? definition.defaultDuration : durationDays))); region.weatherSource = source;
    region.weatherHistory ||= [];
    if (previous !== weatherId) { region.weatherHistory.push({ day, from: previous, to: weatherId, severity: definition.severity, source }); if (region.weatherHistory.length > 30) region.weatherHistory.splice(0, region.weatherHistory.length - 30); }
    if (id === currentRegion(state) && previous !== weatherId) history(state, "narr", "Thiên tượng đổi sắc; " + definition.label + " phủ lên vùng đất trong những ngày tới.");
    return { success: true, regionId: id, weather: weatherId, severity: region.weatherSeverity, untilDay: region.weatherUntilDay };
  }
  function worldModifierPreview(state, context = {}) {
    const modifiers = getWorldModifiers(state, context); const id = context.regionId || currentRegion(state); const weather = weatherSnapshot(state, id);
    return { ...modifiers, weatherLabel: weather.label, weather: weather.id, weatherSeverity: weather.severity, context: { ...context } };
  }

  function startWorldEvent(state, templateId, regionId = currentRegion(state), day = absoluteDay(state.gameClock)) {
    ensure(state);
    const template = worldEventTemplate(templateId);
    const region = state.worldSimulation.regionState[regionId];
    if (!template || !region || region.activeEventId) return { success: false, reason: "Khu vực đã có biến cố hoặc mẫu không hợp lệ." };
    const cooldown = Number(template.cooldownDays || 0);
    if (cooldown > 0 && Object.values(state.worldSimulation.events || {}).some((event) => event.templateId === templateId && Number(event.startedDay || event.phaseStartedDay || 0) + cooldown > day)) return { success: false, reason: "Dư âm biến cố này vẫn chưa tan." };
    const id = uid(state, "event");
    const phase = template.phases[0];
    state.worldSimulation.events[id] = { id, templateId, regionId, phaseIndex: 0, startedDay: day, phaseStartedDay: day, phaseEndsDay: day + phase.durationDays, seed: hash(state.worldSimulation.seed + id), playerContribution: 0, choiceHistory: [], status: "active", outcomeId: null, announced: false };
    region.activeEventId = id; region.lastEventDay = day;
    const omenNode = Object.keys(D.LOCATIONS || {}).find((nodeId) => (D.LOCATIONS[nodeId]?.region || D.WORLD_MAP?.locations?.[nodeId]?.region) === regionId) || state.locationId;
    const seerId = "event_seer:" + id;
    state.worldSimulation.npcState[seerId] = { npcId: seerId, name: "Tử Vi Du Nhân", role: "thầy bói", traits: ["du hành", "thien_tuong"], scheduleType: "itinerant", status: "alive", factionId: null, currentNodeId: omenNode, homeNodeId: omenNode, currentSubLocationId: D.LOCATIONS[omenNode]?.subLocations?.[0]?.id || "main", nextMoveDay: day + 1, eventId: id, dialogueProfileId: "traveler", memoryWithPlayer: [], mailbox: [], rumors: [{ key: "omen:" + id, text: "Một biến cố lớn đang chuyển mình trong vùng này.", confidence: 0.9, priority: 2, expiresDay: day + 14, sourceNpcId: seerId }], relationshipsWithNpcs: {} };
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
    if (event.regionId !== currentRegion(state)) return { success: false, reason: "Ngươi phải có mặt tại vùng đang xảy ra biến cố." };
    if (event.choiceHistory.some((entry) => entry.choiceId === choiceId)) return { success: false, reason: "Lựa chọn này đã được thực hiện." };
    for (const [id, quantity] of Object.entries(choice.itemCost || {})) if (Number(state.inventory?.[id] || 0) < quantity) return { success: false, reason: "Thiếu " + itemName(id) + "." };
    Object.entries(choice.itemCost || {}).forEach(([id, quantity]) => removeItem(state, id, quantity));
    const rewardGrant = grantCanonicalReward(state, "world_event:" + event.id, { item: choice.item || null, quantity: Number(choice.quantity || 0), exp: Number(choice.exp || 0), merit: Number(choice.merit || 0) }, event.id + ":" + choiceId);
    if (!rewardGrant.success) return { success: false, reason: rewardGrant.duplicate ? "Lựa chọn biến cố đã nhận thưởng." : "Không thể nhận phần thưởng biến cố." };
    state.player.san = clamp(Number(state.player.san || 0) + Number(choice.san || 0), 0, state.player.maxSan || 100);
    state.player.corruptionRating = clamp(Number(state.player.corruptionRating || 0) + Number(choice.corruption || 0), 0, 100);
    Object.entries(choice.influence || {}).forEach(([factionId, score]) => recordMapEventInfluence(state, event.regionId, factionId, score, absoluteDay(state.gameClock) + Number(choice.influenceDurationDays || 7)));
    event.playerContribution += Number(choice.contribution || 1);
    event.choiceHistory.push({ choiceId, day: absoluteDay(state.gameClock) });
    history(state, "narr", "Giữa biến cố " + template.name + ", ngươi chọn: " + choice.label + ". Đóng góp +" + Number(choice.contribution || 1) + ".");
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
      event.resolvedDay = day;
      const region = state.worldSimulation.regionState[event.regionId];
      if (region?.activeEventId === event.id) region.activeEventId = null;
      if (event.regionId === currentRegion(state)) history(state, "narr", "Biến cố " + template.name + " khép lại; kết cục là " + event.outcomeId + ".");
      return;
    }
    const phase = template.phases[event.phaseIndex];
    event.phaseStartedDay = day; event.phaseEndsDay = day + phase.durationDays;
    if (event.regionId === currentRegion(state)) history(state, "warn", "☄ " + template.name + " · " + phase.text);
  }

  function updateWeather(state, regionId, day) {
    const region = state.worldSimulation.regionState[regionId];
    if (day < Number(region.weatherUntilDay || 0)) return;
    const previous = normalizeWeatherId(region.weather || "quang");
    const transitionPool = WEATHER_CATALOG[previous]?.transitions || Object.keys(WEATHER_CATALOG);
    const list = transitionPool.length ? transitionPool : Object.keys(WEATHER_CATALOG);
    region.weather = list[Math.floor(seeded(state, "weather:" + regionId, day) * list.length)];
    region.weatherSeverity = WEATHER_CATALOG[region.weather].severity;
    region.weatherIntensity = region.weather === "bao_linh_khi" ? 3 + Math.floor(seeded(state, "weather-intensity:" + regionId, day) * 3) : region.weather === "am_vu" ? 3 + Math.floor(seeded(state, "weather-intensity:" + regionId, day) * 2) : 1 + Math.floor(seeded(state, "weather-intensity:" + regionId, day) * 3);
    const weatherDefinition = WEATHER_CATALOG[region.weather] || WEATHER_CATALOG.quang;
    region.weatherUntilDay = day + Number(weatherDefinition.defaultDuration || 1) + Math.floor(seeded(state, "weather-duration:" + regionId, day) * 3);
    region.weatherHistory ||= [];
    if (previous !== region.weather) { region.weatherHistory.push({ day, from: previous, to: region.weather, severity: region.weatherSeverity, source: "world_tick" }); if (region.weatherHistory.length > 30) region.weatherHistory.splice(0, region.weatherHistory.length - 30); }
    if (previous !== region.weather) {
      if (regionId === currentRegion(state)) appendNodeHistory(state, state.locationId, { type: "weather", summary: "Thời tiết trong vùng đã chuyển sang " + (weatherDefinition.label || region.weather) + ".", key: "weather:" + regionId + ":" + day });
      if (regionId === currentRegion(state)) history(state, "narr", region.weather === "mua" ? "Mưa bắt đầu rơi, làm nhòe những dấu vết trên đường." : region.weather === "tuyet" ? "Tuyết phủ trắng lối đi, khiến mọi bước chân nặng nề hơn." : region.weather === "bao_linh_khi" ? "Bão Linh Khí cuộn qua chân trời, xé rách sự yên tĩnh của vùng đất." : region.weather === "am_vu" ? "Âm Vũ buông xuống, mang theo cảm giác có thứ gì đó đang nhìn qua màn mưa." : "Mây trời dần tan, trả lại sắc sáng cho vùng đất.");
    }
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
        if (!war.cascadeApplied) {
          const winner = war.scoreA > war.scoreB ? war.factionA : war.factionB; const loser = winner === war.factionA ? war.factionB : war.factionA;
          war.outcome = { winner, loser, resolvedDay: day }; war.cascadeApplied = true;
          const loserState = state.worldSimulation.factionState[loser]; const winnerState = state.worldSimulation.factionState[winner];
          if (loserState) loserState.stability = clamp(Number(loserState.stability || 0) - 8, 0, 100);
          if (winnerState) { winnerState.stability = clamp(Number(winnerState.stability || 0) + 4, 0, 100); winnerState.resources = clamp(Number(winnerState.resources || 0) + 8, 0, 200); }
          (loserState?.ownedNodeIds || []).forEach((nodeId) => { recordMapEventInfluence(state, nodeId, winner, 8, day + 30); appendNodeHistory(state, nodeId, { type: "faction_change", summary: "Dư chấn chiến sự làm cán cân thế lực nghiêng về một phía.", key: "war:" + war.id + ":" + day }); });
          if (state.guildMembership?.guildId === winner || state.guildMembership?.guildId === loser) history(state, "narr", "Chiến sự giữa hai thế lực khép lại; " + winner + " giành phần thắng sau những ngày giao phong.");
        }
      }
    });
  }

  function propagateNpcRumors(state, day) {
    const npcs = Object.values(state.worldSimulation.npcState || {}).filter((npc) => npc.status === "alive");
    npcs.forEach((npc) => {
      npc.rumorLedger ||= {};
      npc.rumors = (npc.rumors || []).filter((rumor) => Number(rumor.expiresDay || day) >= day);
      Object.keys(npc.rumorLedger).forEach((key) => {
        if (Number(npc.rumorLedger[key]?.expiresDay || day) < day) delete npc.rumorLedger[key];
      });
    });
    npcs.forEach((source) => {
      (source.rumors || []).filter((rumor) => Number(rumor.expiresDay || day + 1) >= day).forEach((rumor) => {
        const neighbors = Object.values(D.LOCATIONS?.[source.currentNodeId]?.exits || {});
        npcs.filter((target) => target.npcId !== source.npcId && (target.currentNodeId === source.currentNodeId || neighbors.includes(target.currentNodeId))).forEach((target) => {
          target.rumorLedger ||= {};
        const key = String(rumor.key || rumor.text); const confidence = clamp(Number(rumor.confidence ?? 0.55) - (target.currentNodeId === source.currentNodeId ? RUMOR_POLICY.sameNodeConfidenceLoss : RUMOR_POLICY.adjacentNodeConfidenceLoss), RUMOR_POLICY.minConfidence, 1);
          const priority = Number(rumor.priority || 1), previous = target.rumorLedger[key];
          if (previous && (Number(previous.priority || 1) > priority || (RUMOR_POLICY.sourcePriorityWinsTie && Number(previous.priority || 1) === priority && Number(previous.confidence || 0) >= confidence))) return;
          const expiresDay = Math.min(Number(rumor.expiresDay || day + RUMOR_POLICY.defaultTtlDays), day + RUMOR_POLICY.defaultTtlDays);
          target.rumorLedger[key] = { confidence, sourceNpcId: source.npcId, sourceFactionId: source.factionId || null, receivedDay: day, expiresDay, priority, alignment: rumor.alignment || null };
          target.rumors = (target.rumors || []).filter((entry) => entry.key !== key).concat([{ ...rumor, confidence, sourceNpcId: source.npcId, sourceFactionId: source.factionId || null, receivedDay: day, expiresDay, priority }]).slice(-RUMOR_POLICY.maxRumorsPerNpc);
        });
      });
    });
  }

  function updateNpcSchedules(state, day) {
    Object.values(state.worldSimulation.npcState).forEach((npc, index) => {
      if (npc.status !== "alive") return;
      if (npc.eventId && state.worldSimulation.events[npc.eventId]?.status !== "active" && day > Number(state.worldSimulation.events[npc.eventId]?.resolvedDay || day - 3) + 3) { npc.status = "departed"; return; }
      npc.birthAge ||= 25 + Math.floor(seeded(state, "npc-age:" + npc.npcId) * 45);
      npc.birthDay ||= day;
      npc.age = Math.max(1, Number(npc.birthAge) + Math.floor(Math.max(0, day - Number(npc.birthDay)) / 360));
      const npcRealm = D.REALMS?.find((realm, realmIndex) => realm.id === (npc.realmId || npc.realm) || realmIndex === Number(npc.realmIndex));
      const realmLifespan = npcRealm ? Number(npcRealm.lifespanBase || 75) + Number(npcRealm.lifespanBonus || 0) : 90 + Math.floor(seeded(state, "npc-life:" + npc.npcId) * 70);
      npc.maxLifespan = Math.max(npc.age + 1, Number(npc.maxLifespan || realmLifespan));
      if (npc.age >= npc.maxLifespan && !npc.deathDay) { resolveNpcSuccession(state, npc, day); return; }
      const season = Math.floor(((day - 1) % 360) / 90);
      if (npc.scheduleType === "itinerant" && npc.lastMigrationSeason !== season) {
        npc.lastMigrationSeason = season;
        const seasonIds = ["xuan", "ha", "thu", "dong"], seasonTags = [
          ["spring_trade", "trade_hub"], ["summer_market", "event_market", "event_gathering"],
          ["autumn_harvest", "trade_hub"], ["winter_market", "winter_supply", "winter_shelter"]
        ][season];
        const eligibleTargets = seasonalDestinationSnapshot(seasonTags).filter((id) => id !== npc.currentNodeId);
        npc.seasonRoute = season === 3 ? "winter_market_and_shelter" : season === 1 ? "event_gathering" : season === 2 ? "autumn_harvest" : "spring_trade";
        const roll = seeded(state, "npc-season-route:" + npc.npcId + ":" + seasonIds[season], day);
        npc.migrationTargetNodeId = eligibleTargets[Math.floor(roll * eligibleTargets.length)] || null;
        npc.migrationSeasonId = seasonIds[season];
      }
      npc.needs ||= { shelter: 0, social: 0, duty: 0 };
      npc.needs.duty = clamp(Number(npc.needs.duty || 0) + 1, 0, 100);
      if (npc.source === "defection" && npc.targetPlayerId === state.player.id && npc.currentNodeId === state.locationId) {
        state.pendingNpcPursuit ||= { npcId: npc.npcId, factionId: npc.factionId, nodeId: state.locationId, createdDay: day, status: "pending" };
        npc.aiState = "combat"; return;
      }
      const npcRegionId = D.WORLD_MAP?.locations?.[npc.currentNodeId]?.region || D.LOCATIONS?.[npc.currentNodeId]?.region || currentRegion(state);
      const weatherId = normalizeWeatherId(state.worldSimulation.regionState?.[npcRegionId]?.weather || "quang");
      const needsShelter = Boolean(WEATHER_EFFECTS[weatherId]?.npcShelter);
      npc.shelterState ||= { inShelter: false, lastTransitionDay: 0, exitAfterDay: 0 };
      if (needsShelter) {
        npc.needs.shelter = clamp(Number(npc.needs.shelter || 0) + 10, 0, 100);
        npc.shelterState.inShelter = true; npc.shelterState.lastTransitionDay ||= day; npc.shelterState.exitAfterDay = day + 1;
        npc.aiState = "shelter"; npc.nextMoveDay = Math.max(Number(npc.nextMoveDay || day + 1), day + 1); return;
      }
      if (npc.shelterState.inShelter) {
        npc.needs.shelter = Math.max(0, Number(npc.needs.shelter || 0) - 5);
        if (day < Number(npc.shelterState.exitAfterDay || 0)) { npc.aiState = "shelter"; return; }
        npc.shelterState.inShelter = false; npc.shelterState.lastTransitionDay = day;
      }
      if (npc.scheduleType === "static" || day < npc.nextMoveDay) { npc.aiState = npc.scheduleType === "static" ? "present" : "idle"; return; }
      const currentLoc = D.LOCATIONS[npc.currentNodeId];
      const exits = Object.values(currentLoc?.exits || {}).filter((id) => D.LOCATIONS[id]);
      if (!exits.length) { npc.aiState = "shelter"; npc.nextMoveDay = day + 1; return; }
      let preferred = null;
      if (npc.source === "defection" && npc.targetPlayerId === state.player.id) {
        const targetNode = state.locationId;
        if (npc.currentNodeId === targetNode) {
          state.pendingNpcPursuit ||= { npcId: npc.npcId, factionId: npc.factionId, nodeId: targetNode, createdDay: day, status: "pending" };
          npc.aiState = "combat"; return;
        }
        const chaseQueue = exits.map((id) => [id, id]), chaseSeen = new Set([npc.currentNodeId]);
        while (chaseQueue.length && !preferred) {
          const [candidate, firstStep] = chaseQueue.shift(); if (candidate === targetNode) { preferred = firstStep; break; }
          if (chaseSeen.has(candidate)) continue; chaseSeen.add(candidate);
          Object.values(D.LOCATIONS?.[candidate]?.exits || {}).filter((id) => D.LOCATIONS?.[id] && !chaseSeen.has(id)).forEach((id) => chaseQueue.push([id, firstStep]));
        }
      }
      if (!preferred) preferred = exits.includes(npc.migrationTargetNodeId) ? npc.migrationTargetNodeId : null;
      if (!preferred && npc.migrationTargetNodeId) {
        const queue = exits.map((id) => [id, id]), visited = new Set([npc.currentNodeId]);
        while (queue.length && !preferred) {
          const [candidate, firstStep] = queue.shift(); if (candidate === npc.migrationTargetNodeId) { preferred = firstStep; break; }
          if (visited.has(candidate)) continue; visited.add(candidate);
          Object.values(D.LOCATIONS?.[candidate]?.exits || {}).filter((id) => D.LOCATIONS?.[id] && !visited.has(id)).forEach((id) => queue.push([id, firstStep]));
        }
      }
      const next = preferred || exits[Math.floor(seeded(state, "npc-route:" + npc.npcId, day, index) * exits.length)];
      if (!next || !Object.values(currentLoc?.exits || {}).includes(next)) { npc.aiState = "shelter"; npc.nextMoveDay = day + 1; return; }
      npc.aiState = "travel"; npc.travelFrom = npc.currentNodeId; npc.travelTo = next; npc.currentNodeId = next; npc.currentSubLocationId = D.LOCATIONS[next]?.subLocations?.[0]?.id || "main"; npc.nextMoveDay = day + 2 + index % 3; npc.needs.duty = Math.max(0, npc.needs.duty - 5);
      state.worldSimulation.npcFootprints ||= {};
      state.worldSimulation.npcFootprints[npc.travelFrom] ||= [];
      state.worldSimulation.npcFootprints[npc.travelFrom].push({ npcId: npc.npcId, departedDay: day, destinationHint: next, trailId: "trail:" + npc.npcId + ":" + day });
      state.worldSimulation.npcFootprints[npc.travelFrom] = state.worldSimulation.npcFootprints[npc.travelFrom].slice(-20);
      if (npc.scheduleType === "itinerant") {
        npc.nodeVisits ||= {};
        npc.nodeVisits[next] = Number(npc.nodeVisits[next] || 0) + 1;
        const loc = D.LOCATIONS[next];
        if (loc && !loc.organizationId && npc.nodeVisits[next] >= 8 && !state.worldSimulation.settlements?.[next] && seeded(state, "settlement:" + npc.npcId + ":" + next) < 0.2) {
          state.worldSimulation.settlements ||= {};
          state.worldSimulation.settlements[next] = { id: "settlement:" + next, founderNpcId: npc.npcId, foundedDay: day, name: "Quầy Lưu Lạc", status: "active" };
          const worldNode = mapNode(state, next); worldNode.subLocations ||= [];
          if (!worldNode.subLocations.some((spot) => spot.id === "itinerant_stall")) worldNode.subLocations.push({ id: "itinerant_stall", name: "Quầy Lưu Lạc", displayName: "Quầy Lưu Lạc", type: "market", ownerNpcId: npc.npcId });
          appendNodeHistory(state, next, { type: "actor", actorId: npc.npcId, summary: "Một người buôn đường xa dựng quầy nhỏ bên lối cổ.", key: "settlement:" + next });
        }
      }
      if (npc.currentNodeId === state.locationId) appendNodeHistory(state, state.locationId, { type: "actor", actorId: npc.npcId, summary: "Một nhân vật đã xuất hiện trong khu vực.", key: "actor:" + npc.npcId + ":" + day });
    });
    const groups = {};
    Object.values(state.worldSimulation.npcState).filter((npc) => npc.status === "alive").forEach((npc) => { (groups[npc.currentNodeId] ||= []).push(npc); });
    Object.entries(groups).forEach(([nodeId, npcs]) => {
      const capacity = Math.max(1, Number(mapNode(state, nodeId)?.npcCapacity || 4));
      npcs.sort((left, right) => String(left.npcId).localeCompare(String(right.npcId)));
      npcs.forEach((npc, queueIndex) => {
        if (queueIndex >= capacity) {
          npc.aiState = "queued";
          npc.queueNodeId = nodeId;
          npc.queueRank = queueIndex - capacity + 1;
          npc.nextMoveDay = Math.max(Number(npc.nextMoveDay || day + 1), day + 1);
        } else if (npc.aiState === "queued") {
          npc.aiState = "present";
          delete npc.queueNodeId;
          delete npc.queueRank;
        }
      });
      if (npcs.length < 2 || seeded(state, "npc-meet:" + nodeId, day) >= 0.12) return;
      const a = npcs[0], b = npcs[1], pair = pairKey(a.npcId, b.npcId); state.worldSimulation.npcEncounters ||= {};
      const last = Object.values(state.worldSimulation.npcEncounters).filter((entry) => entry.pairKey === pair).sort((x, y) => y.day - x.day)[0];
      if (last && day - Number(last.day || 0) < 7) return;
      const encounterType = seeded(state, pair, day) < 0.5 ? "giao dịch" : "đối đầu"; const encounterKey = "npc-encounter:" + pair + ":" + day;
      state.worldSimulation.npcEncounters[encounterKey] = { key: encounterKey, pairKey: pair, day, npcA: a.npcId, npcB: b.npcId, nodeId, outcome: encounterType };
      a.relationshipsWithNpcs[b.npcId] = { type: encounterType, score: encounterType === "giao dịch" ? 1 : -1, day };
      b.relationshipsWithNpcs[a.npcId] = { type: encounterType, score: encounterType === "giao dịch" ? 1 : -1, day };
      const rumor = { key: encounterKey, day, text: encounterType === "giao dịch" ? "Một cuộc trao đổi tài nguyên vừa diễn ra." : "Mâu thuẫn giữa hai tu sĩ đang lan thành lời đồn.", confidence: 0.9, priority: encounterType === "đối đầu" ? 2 : 1, expiresDay: day + 14, sourceNpcId: a.npcId };
      a.rumors = (a.rumors || []).concat([rumor]).slice(-12); b.rumors = (b.rumors || []).concat([rumor]).slice(-12);
      if (nodeId === state.locationId) history(state, "narr", "◇ Ngươi chứng kiến " + (D.NPCS[npcs[0].npcId]?.name || "một tu sĩ") + " gặp " + (D.NPCS[npcs[1].npcId]?.name || "một tu sĩ khác") + ".");
    });
    propagateNpcRumors(state, day);
  }
  function seasonalDestinationSnapshot(tags = []) {
    const wanted = new Set((Array.isArray(tags) ? tags : [tags]).map((tag) => String(tag).toLowerCase()));
    return Object.keys(D.LOCATIONS || {}).filter((id) => {
      const node = D.LOCATIONS[id], mapNodeData = D.WORLD_MAP?.locations?.[id];
      const nodeTags = [...(node?.seasonalTags || []), ...(mapNodeData?.seasonalTags || [])].map((tag) => String(tag).toLowerCase());
      return wanted.size ? nodeTags.some((tag) => wanted.has(tag)) : nodeTags.length > 0;
    });
  }
  function validateNpcScheduler(state) {
    ensure(state); const errors = [], allowed = new Set(["idle", "travel", "present", "interact", "sleeping", "shelter", "combat", "queued"]);
    Object.values(state.worldSimulation.npcState || {}).forEach((npc) => {
      if (!npc?.npcId || !D.LOCATIONS?.[npc.currentNodeId]) errors.push(String(npc?.npcId || "unknown") + ":node");
      if (npc?.aiState && !allowed.has(npc.aiState)) errors.push(String(npc.npcId) + ":state");
      if (npc?.travelTo && !Object.values(D.LOCATIONS[npc.travelFrom]?.exits || {}).includes(npc.travelTo)) errors.push(String(npc.npcId) + ":edge");
      if (npc?.queueNodeId && npc.queueNodeId !== npc.currentNodeId) errors.push(String(npc.npcId) + ":queue-node");
      if (npc?.queueRank !== undefined && (!Number.isInteger(Number(npc.queueRank)) || Number(npc.queueRank) < 1)) errors.push(String(npc.npcId) + ":queue-rank");
      if (npc?.shelterState && (typeof npc.shelterState.inShelter !== "boolean" || !Number.isFinite(Number(npc.shelterState.lastTransitionDay || 0)) || !Number.isFinite(Number(npc.shelterState.exitAfterDay || 0)))) errors.push(String(npc.npcId) + ":shelter-state");
      const subLocations = D.LOCATIONS[npc.currentNodeId]?.subLocations || [];
      if (npc?.currentSubLocationId && npc.currentSubLocationId !== "main" && !subLocations.some((entry) => entry.id === npc.currentSubLocationId)) errors.push(String(npc.npcId) + ":sub-location");
      if (!Array.isArray(npc.dailyRoutine) || npc.dailyRoutine.some((entry) => !Number.isFinite(Number(entry.hourStart)) || !Number.isFinite(Number(entry.hourEnd)) || Number(entry.hourStart) < 0 || Number(entry.hourEnd) > 24 || Number(entry.hourStart) >= Number(entry.hourEnd) || !entry.subLocationId || !entry.activity)) errors.push(String(npc.npcId) + ":daily-routine");
      if (!Number.isFinite(Number(npc?.nextMoveDay || 0))) errors.push(String(npc.npcId) + ":next-move");
      ["shelter", "social", "duty"].forEach((key) => { if (Number(npc.needs?.[key] || 0) < 0 || Number(npc.needs?.[key] || 0) > 100) errors.push(String(npc.npcId) + ":need:" + key); });
    });
    return { ok: errors.length === 0, npcCount: Object.keys(state.worldSimulation.npcState || {}).length, errors };
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
    history(state, "narr", "Khế ước " + formatContractName(contract) + " được đặt vào tay ngươi; mục tiêu là " + formatContractTarget(contract) + ".");
    return { success: true, contract };
  }

  function grantCanonicalReward(state, sourceId, reward = {}, uniqueKey = sourceId) {
    ensure(state); const key = String(uniqueKey || sourceId || "reward");
    if (state.rewardLedger[key]) return { success: false, duplicate: true, receipt: state.rewardLedger[key] };
    const receipt = { key, sourceId: String(sourceId || key), day: absoluteDay(state.gameClock), exp: Number(reward.exp || 0), merit: Number(reward.merit || 0), item: reward.item || null, quantity: Number(reward.quantity || 0), linhThach: Number(reward.linhThach || 0), contribution: Number(reward.contribution || 0), taintedRewards: { ...(reward.taintedRewards || {}) }, fates: Array.isArray(reward.fates) ? reward.fates.slice() : [], techniques: Array.isArray(reward.techniques) ? reward.techniques.slice() : [] };
    receipt.policy = REWARD_POLICY.id;
    if (receipt.exp) E.gainExp(state, receipt.exp);
    if (receipt.merit) state.player.merit = Number(state.player.merit || 0) + receipt.merit;
    if (receipt.item && receipt.quantity > 0) addItem(state, receipt.item, receipt.quantity);
    if (receipt.linhThach) addItem(state, "linh_thach", receipt.linhThach);
    if (receipt.contribution) state.player.contribution = Number(state.player.contribution || 0) + receipt.contribution;
    if (Object.keys(receipt.taintedRewards).length) {
      state.player.tainted ||= { rewards: {} }; state.player.tainted.rewards ||= {};
      Object.entries(receipt.taintedRewards).forEach(([keyName, value]) => { state.player.tainted.rewards[keyName] = typeof value === "boolean" ? value : Number(state.player.tainted.rewards[keyName] || 0) + Number(value || 0); });
    }
    receipt.fateResults = receipt.fates.map((id) => E.receiveFate(state, id, { source: "reward:" + key, allowPending: true }));
    receipt.pendingFateCount = receipt.fateResults.filter((result) => result?.pending).length;
    receipt.techniqueResults = receipt.techniques.map((id) => ({ id, learned: Boolean(E.learnTechnique(state, id)) }));
    state.rewardLedger[key] = receipt; return { success: true, receipt };
  }

  function completeContract(state, contract, outcome) {
    if (!contract || contract.status !== "accepted" || !contract.allowedOutcomes.includes(outcome)) return false;
    const reward = contract.reward || {}; const granted = grantCanonicalReward(state, "contract:" + contract.id, reward, "contract:" + contract.id);
    if (!granted.success) return false;
    contract.status = "completed"; contract.completedDay = absoluteDay(state.gameClock);
    history(state, "narr", "Sau khi hoàn tất " + (E.I18n?.formatContract(contract) || formatContractName(contract)) + ", phần thưởng được trao; Công Đức +" + Number(reward.merit || 0) + ".");
    return true;
  }
  function validateContractBoardState(state) {
    ensure(state);
    const board = state.contractBoard, errors = [];
    if (!board || typeof board !== "object" || !board.offers || !board.accepted) return { ok: false, errors: ["board"] };
    const inspect = (bucket, expectedStatus, label) => Object.entries(bucket).forEach(([key, contract]) => {
      if (!contract || contract.id !== key) errors.push(label + ":" + key + ":identity");
      if (!contract || contract.status !== expectedStatus && !(label === "accepted" && ["completed", "expired"].includes(contract.status))) errors.push(label + ":" + key + ":status");
      if (!contract || !Number.isFinite(Number(contract.generatedDay)) || !Number.isFinite(Number(contract.expiresDay)) || Number(contract.expiresDay) < Number(contract.generatedDay)) errors.push(label + ":" + key + ":schedule");
      if (contract && contract.allowedOutcomes && !Array.isArray(contract.allowedOutcomes)) errors.push(label + ":" + key + ":outcomes");
    });
    inspect(board.offers, "offered", "offers"); inspect(board.accepted, "accepted", "accepted");
    Object.keys(board.offers).forEach((key) => { if (board.accepted[key]) errors.push(key + ":duplicated"); });
    return { ok: errors.length === 0, errors };
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
      const active = state.activeHiddenRealm;
      if (active?.realmId === definition.id && (Number(active.cycleIndex) !== Number(runtime.cycleIndex) || runtime.status !== "open")) {
        if ([active.entryNodeId, active.coreNodeId, "hidden:" + definition.id + ":" + active.cycleIndex + ":path"].includes(state.locationId)) state.locationId = active.parentNodeId || state.homeLocationId;
        state.activeHiddenRealm = null;
        history(state, "warn", "× Bí Cảnh đã khép lại trong lúc ngươi vắng mặt; lối vào đã trả ngươi về thế giới bên ngoài.");
      }
    });
  }

  function processScheduledTasks(state, day) {
    expireOrganizationCommissions(state, day);
    const tasks = state.worldSimulation.scheduledTasks;
    tasks.filter((task) => task.status === "pending" && task.dueDay <= day).forEach((task) => {
      task.status = task.type === "callback" ? "dead_letter" : "resolved"; task.resolvedDay = day;
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
    Object.entries(state.questState?.available || {}).forEach(([questId, quest]) => {
      if (quest.status === "available" && Number.isFinite(Number(quest.expiresDay)) && day > Number(quest.expiresDay)) {
        quest.status = "failed"; quest.failedDay = day; state.questState.failed[questId] = quest; delete state.questState.available[questId];
      }
    });
    Object.values(state.worldSimulation.events).forEach((event) => advanceEvent(state, event, day));
    Object.keys(state.worldSimulation.regionState).forEach((regionId) => updateWeather(state, regionId, day));
    updateTradeRoutes(state, day);
    const currentNode = mapNode(state, state.locationId);
    if (currentNode) {
      const beforeOwner = currentNode.ownerFactionId || null; const influence = mapInfluenceSnapshot(state, state.locationId);
      if (beforeOwner !== influence.ownerFactionId) appendNodeHistory(state, state.locationId, { type: "faction_change", summary: "Thế lực kiểm soát nơi này đã đổi khác." });
    }
    applyDailyWorldEffects(state, day);
    updateDiplomacy(state, day); updateWars(state, day); updateNpcSchedules(state, day); updateNpcBetrayals(state, day); updateHiddenRealms(state, day); updateArmies(state, day); processScheduledTasks(state, day);
    Object.values(state.npcTrustTrials || {}).filter((trial) => trial.status === "active" && day > Number(trial.expiresDay || Infinity)).forEach((trial) => resolveTrustTrial(state, trial.npcId, false));
    refreshContracts(state, day); refreshAuction(state, day); updateAuction(state, day); updateFactionInternalEvents(state, day); updateTournament(state, day);
    Object.values(state.contractBoard.accepted).forEach((contract) => { if (contract.status === "accepted" && day > contract.expiresDay) { contract.status = "expired"; history(state, "narr", "Ngày hẹn trôi qua; khế ước " + formatContractName(contract) + " đã khép lại khi chưa hoàn thành."); } });
    const regionId = currentRegion(state), region = state.worldSimulation.regionState[regionId];
    if (state.guildProject?.status === "active" && day > state.guildProject.endDay) { state.guildProject.status = "failed"; history(state, "warn", "× Công trình tông môn hết hạn trước khi hoàn thành."); }
    if (state.companion?.state === "recovering" && day >= Number(state.companion.recoveryUntilDay || Infinity)) recoverCompanion(state, { safeNode: true });
    if (state.companion?.state === "active" || state.companion?.state === "mutated") {
      const localCorruption = Number(D.LOCATIONS?.[state.locationId]?.corruption || 0) + (activeRegionEvent(state) ? 1 : 0);
      state.companion.corruption = clamp(Number(state.companion.corruption || 0) + Math.max(0, localCorruption - 2), 0, 100);
      if (state.companion.corruption >= 60) { state.companion.state = "mutated"; state.companion.mutationPending = true; history(state, "warn", "× " + state.companion.customName + " đang Dị Biến; cần cứu chữa hoặc chấp nhận biến chất."); }
      if (state._offlineSimulation && Number(state.companion.lastOfflineCombatDay || 0) < day) {
        state.companion.lastOfflineCombatDay = day;
        simulateOfflineCompanionCombat(state, day);
      }
    }
    if (state.pendingContestedOpportunity && day > state.pendingContestedOpportunity.expiresDay) {
      state.pendingContestedOpportunity.status = "expired"; recordContestedOpportunity(state, state.pendingContestedOpportunity); state.pendingContestedOpportunity = null;
      history(state, "warn", "× Cơ duyên tranh đoạt đã bị người khác lấy mất.");
    }
    if (state.counterIntel?.heat > 0) state.counterIntel.heat = Math.max(0, state.counterIntel.heat - 1);
    if (!state._offlineSimulation && region && !region.activeEventId && day - Number(region.lastEventDay || 0) >= 14 && seeded(state, "event-roll:" + regionId, day) < 0.06) {
      const pool = X.worldEvents || [];
      const template = pool[Math.floor(seeded(state, "event-pick:" + regionId, day) * pool.length)];
      if (template) startWorldEvent(state, template.id, regionId, day);
    }
    recordActorHistory(state, day);
  }

  function applyDailyWorldEffects(state, day) {
    const region = state.worldSimulation.regionState[currentRegion(state)]; const weather = region?.weather;
    if (weather === "mua") state.player.hp = Math.max(1, Number(state.player.hp || 1) - 1);
    if (weather === "suong") state.player.san = clamp(Number(state.player.san || 0) - 1, 0, Number(state.player.maxSan || 100));
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
  function recordActorHistory(state, day) {
    const limit = Math.max(1, Number(state.worldSimulation?.offlinePolicy?.detailedWindowDays || 30));
    Object.values(state.worldSimulation?.npcState || {}).forEach((npc) => {
      const history = state.worldSimulation.actorHistory[npc.npcId] ||= [];
      history.push({ day, nodeId: npc.currentNodeId || null, subLocationId: npc.currentSubLocationId || null, aiState: npc.aiState || "idle", status: npc.status || "alive", needs: copy(npc.needs || {}), worldCondition: npc.worldCondition || null, mood: npc.eventMood || null, queueRank: npc.queueRank || null, rumorCount: Array.isArray(npc.rumors) ? npc.rumors.length : 0 });
      if (history.length > limit) history.splice(0, history.length - limit);
    });
  }
  function actorHistorySnapshot(state, npcId = null) {
    ensure(state);
    return npcId ? copy(state.worldSimulation.actorHistory?.[npcId] || []) : copy(state.worldSimulation.actorHistory || {});
  }
  function npcWorldContext(state, npcId) {
    const startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    ensure(state); const npc = state.worldSimulation.npcState?.[npcId];
    if (!npc) return { npcId, found: false, weather: "quang", mood: "không rõ", regionId: null, relationship: null, mailbox: 0, rumors: [] };
    const regionId = D.WORLD_MAP?.locations?.[npc.currentNodeId]?.region || D.LOCATIONS?.[npc.currentNodeId]?.region || currentRegion(state);
    const region = state.worldSimulation.regionState?.[regionId];
    const wars = Object.values(state.worldSimulation.wars || {}).filter((war) => war.status === "active" && (!npc.factionId || war.factionA === npc.factionId || war.factionB === npc.factionId));
    state.runtimeMetrics.npcView.calls += 1; state.runtimeMetrics.npcView.totalMs += (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startedAt;
    return { npcId, found: true, nodeId: npc.currentNodeId, factionId: npc.factionId || null, weather: region?.weather || npc.worldCondition || "quang", mood: npc.eventMood || "bình thường", regionId, relationship: state.relationships?.[npcId] || null, mailbox: npc.mailbox?.length || 0, rumors: copy(npc.rumors || []), activeEventId: region?.activeEventId || null, warIds: wars.map((war) => war.id) };
  }
  function factionBulletin(state, factionId = null) {
    ensure(state);
    const day = absoluteDay(state.gameClock);
    const rows = [];
    Object.values(state.worldSimulation.npcState || {}).filter((npc) => npc.status === "alive" && (!factionId || npc.factionId === factionId)).forEach((npc) => {
      const sourceRumors = [...(npc.rumors || []), ...Object.entries(npc.rumorLedger || {}).map(([key, value]) => ({ key, ...value }))];
      sourceRumors.forEach((rumor) => {
        if (Number(rumor.expiresDay || day) < day) return;
        const key = String(rumor.key || rumor.text || "unknown");
        const existing = rows.find((entry) => entry.key === key);
        const confidence = Number(rumor.confidence ?? 0.5);
        const item = { key, text: rumor.text || key, confidence, priority: Number(rumor.priority || 1), expiresDay: Number(rumor.expiresDay || day + 7), sourceNpcIds: [npc.npcId], factionId: npc.factionId || null };
        if (!existing) rows.push(item);
        else { existing.confidence = Math.max(existing.confidence, confidence); existing.priority = Math.max(existing.priority, item.priority); existing.expiresDay = Math.max(existing.expiresDay, item.expiresDay); if (!existing.sourceNpcIds.includes(npc.npcId)) existing.sourceNpcIds.push(npc.npcId); }
      });
    });
    return rows.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence || a.expiresDay - b.expiresDay).slice(0, 24);
  }
  function validateWarState(state) {
    ensure(state); const errors = [], factionIds = new Set(Object.keys(state.worldSimulation.factionState || {}));
    Object.entries(state.worldSimulation.wars || {}).forEach(([id, war]) => {
      if (!war || war.id !== id || !factionIds.has(war.factionA) || !factionIds.has(war.factionB) || war.factionA === war.factionB) errors.push(id + ":factions");
      if (!Number.isFinite(Number(war.scoreA)) || Number(war.scoreA) < 0 || !Number.isFinite(Number(war.scoreB)) || Number(war.scoreB) < 0) errors.push(id + ":score");
      if (!["active", "ended"].includes(war.status)) errors.push(id + ":status");
      if (war.status === "ended" && (!war.cascadeApplied || !war.outcome?.winner || !war.outcome?.loser || !Number.isFinite(Number(war.endedDay)))) errors.push(id + ":cascade");
      if (!Array.isArray(war.playerInterventions)) errors.push(id + ":interventions");
      const keys = new Set(); (war.playerInterventions || []).forEach((entry) => { const key = String(entry.day) + ":" + String(entry.side); if (keys.has(key) || !Number.isFinite(Number(entry.day)) || !["A", "B"].includes(entry.side)) errors.push(id + ":intervention"); keys.add(key); });
    });
    return { ok: errors.length === 0, count: Object.keys(state.worldSimulation.wars || {}).length, errors };
  }
  function warFrontSnapshot(state) {
    ensure(state);
    return Object.values(state.worldSimulation.wars || {}).map((war) => {
      const factionA = state.worldSimulation.factionState?.[war.factionA];
      const factionB = state.worldSimulation.factionState?.[war.factionB];
      const scoreA = Number(war.scoreA || 0), scoreB = Number(war.scoreB || 0);
      return { id: war.id, status: war.status, factionA: war.factionA, factionB: war.factionB, factionAName: factionA?.name || war.factionA, factionBName: factionB?.name || war.factionB, frontNodeIds: (war.frontNodeIds || []).slice(), scoreA, scoreB, lead: scoreA === scoreB ? "draw" : scoreA > scoreB ? war.factionA : war.factionB, startedDay: Number(war.startedDay || 0), endedDay: war.endedDay || null, cascadeApplied: Boolean(war.cascadeApplied), outcome: copy(war.outcome || null) };
    }).sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1) || b.startedDay - a.startedDay);
  }
  function rumorBulletinSnapshot(state, factionId = null) {
    const day = absoluteDay(state.gameClock);
    return factionBulletin(state, factionId).map((row) => ({ ...row, remainingDays: Math.max(0, Number(row.expiresDay || day) - day) }));
  }
  function npcWeatherNarrative(npc, weather) {
    const name = npc?.name || "người khách lạ";
    const role = String(npc?.role || npc?.dialogueProfileId || "traveler").toLowerCase();
    if (weather === "tuyet") {
      if (/merchant|thương|buôn/.test(role)) return "Tuyết phủ trắng mái sạp; " + name + " kéo áo choàng chặt hơn, thu dọn hàng sớm vì cái lạnh đã ngấm vào đầu ngón tay.";
      if (/guard|cultiv|tu_si|đệ tử/.test(role)) return "Gió tuyết quất qua sân đá; " + name + " vẫn đứng yên bên cổng, bàn tay đặt lên chuôi kiếm để giữ tỉnh táo.";
      return "Tuyết rơi lặng trên vai áo; " + name + " nép dưới mái hiên, nhìn con đường trắng dần rồi chọn ở lại thêm một lúc.";
    }
    if (weather === "mua" || weather === "am_vu") {
      if (/merchant|thương|buôn/.test(role)) return "Mưa gõ dồn trên mái hiên; " + name + " kéo tấm bạt xuống, che kín những món hàng còn dang dở.";
      if (/guard|hộ vệ/.test(role)) return "Nước mưa chảy dọc theo mép giáp; " + name + " lùi vào dưới vọng lâu nhưng mắt vẫn không rời con đường trước mặt.";
      return "Mùi đất ẩm dâng lên sau cơn mưa; " + name + " kéo nón che đầu, bước nhanh về phía mái ngói gần nhất.";
    }
    if (weather === "loi_vu") {
      if (/guard|cultiv|tu_si|đệ tử/.test(role)) return "Sấm linh lực rạn trong không trung; " + name + " siết chặt quyết ấn, lùi khỏi khoảng trời trống để giữ mạng.";
      return "Ánh chớp xanh quét qua vách núi; " + name + " cúi thấp người, nín thở chờ cơn cuồng nộ đi qua.";
    }
    if (weather === "suong" || weather === "suong_mu") return "Sương mỏng trườn qua bậc đá; " + name + " hạ thấp giọng, lần theo mùi hương quen thuộc để khỏi lạc giữa màn trắng.";
    if (weather === "linh_phong") return "Linh phong lay động vạt áo; " + name + " ngẩng nhìn hướng gió, đổi lộ trình trước khi dấu chân cũ bị xóa sạch.";
    return null;
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
    if (!state._offlineSimulation && day % 7 === 0 && !npc.rumors.some((rumor) => rumor.key === key)) npc.rumors.push({ key, day, text: "Thiên tượng " + (E.I18n?.weather(weather) || weather) + " đang đổi vận trong vùng.", confidence: 0.7, priority: 1, expiresDay: day + RUMOR_POLICY.defaultTtlDays, sourceNpcId: npcId, sourceFactionId: npc.factionId || null });
    if (npc.rumors.length > 12) npc.rumors.splice(0, npc.rumors.length - 12);
    const sameScene = npc.currentNodeId === state.locationId && (!npc.currentSubLocationId || npc.currentSubLocationId === state.currentSubLocationId);
    const weatherNarrative = !state._offlineSimulation && sameScene ? npcWeatherNarrative(npc, weather) : null;
    if (weatherNarrative) history(state, "narr", weatherNarrative);
    return { success: true, npcId, reaction: npc.recentWorldReaction, processedKey: key };
  }
  function ensureNpcWorldState(state) {
    ensure(state);
    const node = D.LOCATIONS?.[state.locationId];
    state.currentSubLocationId = state.currentSubLocationId || node?.subLocations?.[0]?.id || "main";
    Object.entries(state.worldSimulation.npcState || {}).forEach(([id, npc]) => {
      npc.npcId ||= id; npc.status ||= "alive"; npc.currentNodeId ||= state.locationId;
      const definition = D.NPCS?.[id];
      if (definition) { npc.name ||= definition.name; npc.role ||= definition.title; npc.isImportant ||= /chưởng môn|sư phụ|đại sư huynh|trưởng lão|mentor|master/i.test(String(definition.title || "")); npc.canTeachRareTechnique ||= /chưởng môn|sư phụ|trưởng lão/i.test(String(definition.title || "")); }
      npc.currentSubLocationId ||= D.LOCATIONS?.[npc.currentNodeId]?.subLocations?.[0]?.id || "main";
      npc.homeNodeId ||= npc.currentNodeId; npc.scheduleType ||= "static";
      npc.dialogueProfileId ||= npc.role === "merchant" ? "merchant" : npc.role === "guard" ? "guard" : "traveler";
      npc.relationshipsWithNpcs ||= {}; npc.memoryWithPlayer ||= []; npc.mailbox ||= []; npc.rumors ||= [];
      npc.preferences ||= /merchant|thương|buôn/i.test(String(npc.role || "")) ? ["currency", "trade"] : /orphan|trẻ|y_quan/i.test(String(npc.role || "")) ? ["food", "medicine"] : ["medicine", "cultivation"];
      npc.corruptionTolerance = clamp(Number(npc.corruptionTolerance ?? (/chính|orthodox/i.test(String(npc.alignment || "")) ? 25 : 55)), 0, 100);
      npc.dailyRoutine = normalizeNpcRoutine(npc.dailyRoutine, npc);
      syncNpcRoutine(state, npc);
    });
    return state.worldSimulation.npcState;
  }
  function npcActionPresentation(state, npcId, fallbackName = npcId) {
    const npc = ensureNpcWorldState(state)[npcId];
    if (!npc || npc.status !== "alive" || npc.currentNodeId !== state.locationId || (npc.currentSubLocationId && state.currentSubLocationId && npc.currentSubLocationId !== state.currentSubLocationId)) return { available: false, label: "" };
    syncNpcRoutine(state, npc);
    return { available: true, sleeping: npc.currentActivity === "ngu", label: npc.currentActivity === "ngu" ? "Đánh Thức · " + (npc.name || fallbackName) : "Nói chuyện với " + (npc.name || fallbackName) };
  }
  function npcQuestStatus(state, npcId) {
    ensureNpcWorldState(state); const npc = state.worldSimulation.npcState[npcId];
    if (!npc || npc.currentNodeId !== state.locationId || npc.status !== "alive" || (npc.currentSubLocationId && npc.currentSubLocationId !== state.currentSubLocationId)) return [];
    const id = "npc_quest_" + npcId; state.questState ||= { available: {}, failed: {}, completed: {}, npcIndex: {} };
    if (state.questState.active?.[id] || state.questState.completed?.[id] || state.questState.failed?.[id]) return [];
    if (state.questState.available?.[id]?.expiresDay < absoluteDay(state.gameClock)) {
      const expired = state.questState.available[id]; expired.status = "failed"; expired.failedDay = absoluteDay(state.gameClock); state.questState.failed[id] = expired; delete state.questState.available[id]; return [];
    }
    state.questState.available[id] ||= { id, giverNpcId: npcId, title: "Lời nhờ cậy bên đường", status: "available", objectives: [], icon: "!", expiresDay: absoluteDay(state.gameClock) + 7 };
    return [state.questState.available[id]];
  }
  function npcTalk(state, npcId) {
    ensureNpcWorldState(state); const npc = state.worldSimulation.npcState[npcId];
    if (!npc || npc.status !== "alive" || npc.currentNodeId !== state.locationId || (npc.currentSubLocationId && npc.currentSubLocationId !== state.currentSubLocationId)) return { success: false, reason: "NPC không ở đúng địa điểm này." };
    if (npc.currentActivity === "ngu") {
      const day = absoluteDay(state.gameClock), key = "wake:" + npcId + ":" + day;
      const disturbed = recordRelationshipEvent(state, npcId, "disturbed_sleep", { uniqueKey: key, deltas: { affection: -3, trust: -1, suspicion: 1 } });
      const detected = seeded(state, key, "noticed") < 0.35;
      npc.wokenAtDay = day; npc.currentActivity = "awake"; npc.aiState = detected ? "interact" : "present";
      if (detected) npc.lastWakeNoticeDay = day;
      history(state, detected ? "warn" : "narr", detected ? "Ngươi khẽ gọi người đang say ngủ; ánh mắt tỉnh giấc ấy lạnh đi vì bị quấy rầy." : "Trong đêm tĩnh, ngươi đánh thức người đang nghỉ. Dù không nổi giận, vẻ mệt mỏi vẫn thoáng qua trên gương mặt ấy.");
      return { success: true, phase: "WAKE", sleeping: true, detected, relationship: disturbed.relation };
    }
    const quest = npcQuestStatus(state, npcId)[0] || state.questState?.active?.["npc_quest_" + npcId] || null;
    const runtimeRelation = state.relationships[npcId] ||= { trust: 0, fear: 0, respect: 0, suspicion: 0, affection: 0, loyalty: 0, score: 0 };
    const gossip = Object.values(npc.rumorLedger || {}).filter((rumor) => Number(rumor.expiresDay || 0) >= absoluteDay(state.gameClock)).sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))[0];
    if (gossip && !npc.heardPlayerRumor) {
      npc.heardPlayerRumor = gossip.key;
      if (gossip.alignment === "villainous") { runtimeRelation.suspicion = clamp(Number(runtimeRelation.suspicion || 0) + 8, 0, 100); runtimeRelation.affection = clamp(Number(runtimeRelation.affection || 0) - 3, 0, 100); }
      else { runtimeRelation.respect = clamp(Number(runtimeRelation.respect || 0) + 4, 0, 100); }
      runtimeRelation.score = Number(runtimeRelation.trust || 0) + Number(runtimeRelation.respect || 0) - (Number(runtimeRelation.fear || 0) + Number(runtimeRelation.suspicion || 0)) * 0.5;
    }
    if (npc.betrayalWarning?.status === "warning") history(state, "warn", "Có điều gì đó bất an trong ánh mắt " + (npc.name || npcId) + "; lời hứa giữa hai người dường như đang lung lay.");
    if (npc.hostileToPlayer || state.guildMembership?.betrayedOrganizations?.includes(npc.factionId)) return { success: false, reason: "Ánh mắt NPC lạnh hẳn: tổ chức của họ đã xem ngươi là kẻ phản đồ." };
    state.dialogueState = { schemaVersion: 1, phase: quest?.status === "active" ? "PROGRESS" : "CHECK", profileId: npc.dialogueProfileId, npcId, questId: quest?.id || null, lastDay: absoluteDay(state.gameClock), history: Array.isArray(state.dialogueState?.history) ? state.dialogueState.history.slice(-12) : [] };
    history(state, "narr", "Ánh mắt " + (npc.name || npcId) + " dừng lại nơi ngươi; câu chuyện mở ra giữa những điều chưa được nói hết.");
    state.dialogueState.history.push({ phase: state.dialogueState.phase, day: absoluteDay(state.gameClock) });
    return { success: true, profileId: npc.dialogueProfileId, phase: state.dialogueState.phase, quest };
  }
  function giftNpc(state, npcId, itemId) {
    ensureNpcWorldState(state); const npc = state.worldSimulation.npcState[npcId], item = D.ITEMS?.[itemId];
    if (!npc || npc.status !== "alive" || npc.currentNodeId !== state.locationId || !item || Number(state.inventory?.[itemId] || 0) < 1) return { success: false, reason: "Người nhận, vật phẩm hoặc khoảng cách không hợp lệ." };
    const tags = [item.category, item.kind, item.type, ...(item.tags || [])].map((tag) => String(tag || "").toLowerCase());
    const liked = (npc.preferences || []).some((pref) => tags.some((tag) => tag.includes(pref)) || String(item.name || "").toLowerCase().includes(pref));
    const disliked = (npc.dislikedGiftTags || []).some((pref) => tags.some((tag) => tag.includes(pref)));
    removeItem(state, itemId, 1);
    const delta = disliked ? -5 : liked ? 8 : 1;
    recordRelationshipEvent(state, npcId, "sent_gift", { uniqueKey: "gift:" + npcId + ":" + itemId + ":" + absoluteDay(state.gameClock), deltas: { affection: delta, trust: liked ? 2 : 0 } });
    history(state, delta < 0 ? "warn" : "narr", "Ngươi đặt " + itemName(itemId) + " vào tay " + (npc.name || npcId) + (delta < 0 ? "; món quà khiến người ấy hiểu lầm ý ngươi." : liked ? "; ánh mắt người ấy dịu đi khi nhận đúng thứ mình cần." : "; người ấy nhận lễ vật nhưng chỉ khẽ gật đầu."));
    return { success: true, affectionDelta: delta };
  }
  function intimidateNpc(state, npcId) {
    ensureNpcWorldState(state); const npc = state.worldSimulation.npcState[npcId];
    if (!npc || npc.status !== "alive" || npc.currentNodeId !== state.locationId) return { success: false, reason: "NPC không ở đây." };
    const darkRep = Number(state.player.corruptionRating || 0), power = Number(state.player.realmIndex || state.player.realmLevel || 0), target = Number(npc.realmIndex || npc.powerLevel || 0);
    if (darkRep < 50 || power < target + 2) return { success: false, reason: "Uy hiếp cần Tà Nhiễm ≥50 và chênh lệch cảnh giới đủ lớn." };
    if (npc.intimidatedPermanently) return { success: false, reason: "Người ấy đã từng khuất phục; không còn gì để ép hỏi." };
    npc.intimidatedPermanently = true;
    recordRelationshipEvent(state, npcId, "threatened", { uniqueKey: "intimidate:" + npcId + ":" + absoluteDay(state.gameClock), deltas: { trust: -100, affection: -100, suspicion: 35, fear: 30 } });
    const faction = npc.factionId && state.worldSimulation.factionState[npc.factionId];
    if (faction && seeded(state, "intimidate-report:" + npcId, absoluteDay(state.gameClock)) < 0.45) {
      faction.stability = clamp(Number(faction.stability || 50) - 2, 0, 100); faction.playerReputation = clamp(Number(faction.playerReputation || 0) - 8, -100, 100);
      const organizationRelation = state.organizationState?.relations?.[npc.factionId]; if (organizationRelation) organizationRelation.reputation = clamp(Number(organizationRelation.reputation || 0) - 8, -100, 100);
    }
    state.intel ||= {};
    const intelId = "coerced:" + npcId + ":" + absoluteDay(state.gameClock);
    state.intel[intelId] = { id: intelId, title: "Lời Khai Bị Ép", sourceNpcId: npcId, factionId: npc.factionId || null, text: (npc.rumors || [])[0]?.text || "NPC tiết lộ một tuyến đường và lịch tuần tra của tổ chức mình.", status: "unspent", confidence: 0.55, obtainedDay: absoluteDay(state.gameClock) };
    history(state, "warn", "Uy áp khiến " + (npc.name || npcId) + " phải nhượng bộ; từ đây lòng tin và thiện cảm giữa hai người đã đứt đoạn.");
    return { success: true, permanentlyHostile: true };
  }
  function publishPlayerRumor(state, key, text, alignment = "heroic", priority = 2) {
    const sim = state.worldSimulation, day = absoluteDay(state.gameClock); sim.playerRumors ||= {};
    if (sim.playerRumors[key]) return false;
    const rumor = { key, text, day, alignment, priority, confidence: 0.95, expiresDay: day + 120, sourceNpcId: "player" };
    sim.playerRumors[key] = rumor;
    const witnesses = Object.values(sim.npcState || {}).filter((npc) => npc.status === "alive" && (npc.currentNodeId === state.locationId || npc.factionId && npc.factionId === state.guildMembership?.guildId));
    witnesses.forEach((npc) => { npc.rumors ||= []; npc.rumorLedger ||= {}; npc.rumors.push(rumor); npc.rumors = npc.rumors.slice(-12); npc.rumorLedger[key] = { ...rumor, receivedDay: day }; });
    return true;
  }
  function beginTrustTrial(state, npcId, kind = "keep_secret") {
    ensureNpcWorldState(state); const npc = state.worldSimulation.npcState[npcId]; state.npcTrustTrials ||= {};
    if (!npc || npc.status !== "alive") return { success: false, reason: "NPC không khả dụng." };
    const existing = state.npcTrustTrials[npcId];
    if (existing?.status === "active") return { success: true, trial: existing, duplicate: true };
    if (existing?.retryAfterDay > absoluteDay(state.gameClock)) return { success: false, reason: "Người ấy chưa sẵn lòng thử lòng ngươi lần nữa." };
    const trial = { id: "trust-trial:" + npcId + ":" + absoluteDay(state.gameClock), npcId, kind, status: "active", startedDay: absoluteDay(state.gameClock), expiresDay: absoluteDay(state.gameClock) + 14, targetNodeId: npc.homeNodeId || npc.currentNodeId };
    state.npcTrustTrials[npcId] = trial;
    history(state, "narr", (npc.name || npcId) + " giao cho ngươi một việc nhỏ, nhưng ánh mắt ấy đang cân nhắc nhiều hơn lời nói.");
    return { success: true, trial };
  }
  function resolveTrustTrial(state, npcId, keepPromise = true) {
    const trial = state.npcTrustTrials?.[npcId]; if (!trial || trial.status !== "active") return { success: false, reason: "Không có thử thách lòng tin đang mở." };
    trial.status = keepPromise ? "passed" : "failed"; trial.resolvedDay = absoluteDay(state.gameClock);
    if (keepPromise) recordRelationshipEvent(state, npcId, "kept_promise", { uniqueKey: trial.id, deltas: { trust: 18, respect: 5 } });
    else { recordRelationshipEvent(state, npcId, "broke_promise", { uniqueKey: trial.id }); trial.retryAfterDay = trial.resolvedDay + 90; }
    return { success: true, trial };
  }
  function updateNpcBetrayals(state, day) {
    Object.values(state.worldSimulation.npcState || {}).forEach((npc) => {
      if (npc.status !== "alive" || npc.betrayalWarning?.status === "resolved") return;
      const relation = state.relationships?.[npc.npcId] || {}, playerCorruption = Number(state.player.corruptionRating || 0);
      const rivalOffer = Number(npc.rivalOffer || 0);
      const hasBond = Boolean(npc.companionUntilDay > day || Number(relation.trust || 0) >= 75);
      const condition = hasBond && (playerCorruption > Number(npc.corruptionTolerance || 40) || rivalOffer >= 70);
      if (!condition) { if (npc.betrayalWarning?.status === "warning") npc.betrayalWarning.status = "withdrawn"; return; }
      if (!npc.betrayalWarning || npc.betrayalWarning.status !== "warning") { npc.betrayalWarning = { status: "warning", warnedDay: day, reason: playerCorruption > Number(npc.corruptionTolerance || 40) ? "corruption" : "rival_offer", resolvesDay: day + 1 }; return; }
      if (day >= npc.betrayalWarning.resolvesDay) { npc.betrayalWarning.status = "resolved"; npc.hostileToPlayer = true; npc.aiState = "combat"; recordRelationshipEvent(state, npc.npcId, "abandoned", { uniqueKey: "betrayal:" + npc.npcId + ":" + day, deltas: { suspicion: 80, trust: -60 } }); history(state, "warn", (npc.name || npc.npcId) + " đã quay lưng sau khi những dấu hiệu cảnh báo bị bỏ qua."); }
    });
  }
  function resolveOrganizationDefection(state, organizationId) {
    const membership = state.guildMembership;
    if (!membership || membership.guildId !== organizationId) return { success: false, reason: "Ngươi không thuộc tổ chức này." };
    if (!membership.defectionPending) {
      const anchorRisk = (state.player.anchors || []).filter((anchor) => anchor.npcId && state.worldSimulation.npcState[anchor.npcId]?.factionId === organizationId).map((anchor) => anchor.name || state.worldSimulation.npcState[anchor.npcId].name);
      membership.defectionPending = { organizationId, warnedDay: absoluteDay(state.gameClock), anchorRisk };
      history(state, "warn", "Rời bỏ tổ chức sẽ khiến đồng môn xem ngươi là phản đồ" + (anchorRisk.length ? "; Neo Nhân Tính có thể bị liên lụy: " + anchorRisk.join("、") : "") + ". Bấm xác nhận lần nữa nếu đã quyết định.");
      return { success: true, warning: true, anchorRisk };
    }
    const oldFactionId = organizationId, result = E.leaveGuild(state);
    if (!result) return { success: false, reason: "Chưa đủ điều kiện rời tổ chức theo quy định hiện hành." };
    state.guildMembership ||= { betrayedOrganizations: [] };
    state.guildMembership.betrayedOrganizations ||= []; state.guildMembership.betrayedOrganizations.push(oldFactionId);
    (state.player.anchors || []).filter((anchor) => anchor.npcId && state.worldSimulation.npcState[anchor.npcId]?.factionId === oldFactionId).forEach((anchor) => { anchor.broken = true; anchor.integrity = "broken"; anchor.stability = 0; anchor.defectionThreatened = true; });
    Object.values(state.worldSimulation.npcState || {}).filter((npc) => npc.factionId === oldFactionId && npc.status === "alive").forEach((npc) => { npc.hostileToPlayer = true; });
    const pursuerId = "defector_hunter:" + oldFactionId + ":" + state.player.id;
    state.worldSimulation.npcState[pursuerId] ||= { npcId: pursuerId, name: "Chấp Pháp Truy Đồ", role: "Ma Đầu truy sát", status: "alive", factionId: oldFactionId, currentNodeId: organizationAddress(oldFactionId)?.nodeId || state.locationId, currentSubLocationId: "main", homeNodeId: organizationAddress(oldFactionId)?.nodeId || state.locationId, scheduleType: "patrol", aiState: "travel", targetPlayerId: state.player.id, source: "defection", nextMoveDay: absoluteDay(state.gameClock) + 1, realmIndex: Number(E.cultivationTier(state)) + 2, memoryWithPlayer: [], mailbox: [], rumors: [], relationshipsWithNpcs: {} };
    state.guildPursuit = { status: "pending", sourceFactionId: oldFactionId, targetPlayerId: state.player.id, createdDay: absoluteDay(state.gameClock), source: "defection", warningIssued: false };
    history(state, "warn", "Từ hôm nay, " + (organizationDefinitions().find((entry) => entry.id === oldFactionId)?.name || oldFactionId) + " ghi tên ngươi vào sổ phản đồ. Một cuộc truy sát có thể được phái đến.");
    return { success: true, defectedFrom: oldFactionId };
  }
  function resolveAllianceMediation(state, factionA, factionB) {
    const day = absoluteDay(state.gameClock); state.worldSimulation.mediationAttempts ||= {};
    const key = pairKey(factionA, factionB);
    if (state.worldSimulation.mediationAttempts[key]) return { success: false, reason: "Ngươi đã dùng cơ hội hòa giải cho hai bên này." };
    const war = Object.values(state.worldSimulation.wars || {}).find((entry) => entry.status === "active" && pairKey(entry.factionA, entry.factionB) === key);
    const diplomacy = state.worldSimulation.diplomacy?.[key];
    const tension = Number(war?.tensionScore ?? diplomacy?.tensionScore ?? diplomacy?.tension ?? 0);
    const relationA = ensureOrganizationState(state).relations[factionA], relationB = ensureOrganizationState(state).relations[factionB];
    if (!relationA || !relationB || Number(relationA.reputation || 0) < 20 || Number(relationB.reputation || 0) < 20) return { success: false, reason: "Cần có uy tín tối thiểu 20 với cả hai tổ chức." };
    if (tension < 50) return { success: false, reason: "Hai bên chưa ở ngưỡng căng thẳng cần hòa giải." };
    state.worldSimulation.mediationAttempts[key] = day;
    const score = Number(state.player.reputation || state.player.merit || 0) + Number(state.player.daoHeart || state.player.daoXin || 0) + Number(relationA.reputation || 0) + Number(relationB.reputation || 0);
    const success = score >= 100;
    if (war) { war.tensionScore = Math.max(0, Number(war.tensionScore || 70) - (success ? 45 : 10)); if (success && war.tensionScore < 30) { war.status = "averted"; war.resolvedDay = day; } }
    else {
      const record = state.worldSimulation.diplomacy[key] ||= { factionA, factionB, tension: tension || 60, status: "thu_dich", reasons: [], lastChangedDay: day };
      record.tension = Math.max(-100, Number(record.tension ?? record.tensionScore ?? tension) - (success ? 45 : 8));
      record.tensionScore = record.tension; record.status = record.tension <= -60 ? "dong_minh" : record.tension >= 60 ? "thu_dich" : "trung_lap";
      if (success) record.warCooldownUntil = day + 60;
      record.lastChangedDay = day;
    }
    history(state, success ? "narr" : "warn", success ? "Lời hòa giải của ngươi khiến hai bên lùi khỏi bờ vực chiến tranh." : "Sứ giả không nhận được nhượng bộ; cơ hội hòa giải đã khép lại.");
    return { success, averted: success && Boolean(war), score };
  }
  function resolveLoyaltyTest(state, organizationId, choice) {
    const org = ensureOrganizationState(state), membership = state.guildMembership;
    org.loyaltyTests ||= {}; let test = org.loyaltyTests[organizationId];
    if (!test) { test = org.loyaltyTests[organizationId] = { active: true, id: "loyalty:" + organizationId + ":" + absoluteDay(state.gameClock), status: "investigate", createdDay: absoluteDay(state.gameClock), finding: "Dấu vết tại làng không chứng minh được thông đồng; báo cáo bị làm giả." }; history(state, "narr", "Mật lệnh yêu cầu ngươi điều tra một ngôi làng bị nghi thông đồng. Mệnh lệnh thúc giục trừng phạt nhanh chóng, nhưng chứng cứ còn mơ hồ."); return { success: true, phase: "investigate", test }; }
    if (!test.active || membership?.guildId !== organizationId) return { success: false, reason: "Mật lệnh không còn hiệu lực." };
    if (choice === "investigate") { test.investigated = true; return { success: true, phase: "decision", finding: test.finding }; }
    if (choice !== "spare" && choice !== "attack") return { success: false, reason: "Lựa chọn không hợp lệ." };
    test.active = false; test.status = choice === "spare" ? "passed" : "failed"; test.resolvedDay = absoluteDay(state.gameClock);
    membership.contribution = Math.max(0, Number(membership.contribution || 0) + (choice === "spare" ? 8 : -12));
    const relation = org.relations[organizationId]; if (relation) relation.reputation = clamp(Number(relation.reputation || 0) + (choice === "spare" ? 5 : -8), -100, 100);
    history(state, choice === "spare" ? "narr" : "warn", choice === "spare" ? "Ngươi từ chối kết tội vô tội khi chứng cứ không đứng vững; sự trung thành được ghi nhận." : "Ngươi làm theo mệnh lệnh dù biết chứng cứ yếu; lời đồn về sự tàn nhẫn khiến uy tín suy giảm.");
    return { success: true, status: test.status };
  }
  function guildVaultSnapshot(state, organizationId = state.guildMembership?.guildId) {
    ensure(state);
    const membership = state.guildMembership, rank = Number(membership?.rankIndex ?? 0), unlocked = rank >= 2 && membership?.guildId === organizationId;
    const prefix = "guild_signature_" + organizationId + "_";
    const catalog = E.techniqueCatalog?.() || {};
    return { organizationId, unlocked, requiredRank: "Chân Truyền Đệ Tử", techniques: Object.entries(catalog).filter(([id]) => id.startsWith(prefix)).map(([id, technique]) => ({ id, name: technique.name || id, learned: Boolean(state.player.techniques?.[id]), available: unlocked })) };
  }
  function npcDialogueAction(state, npcId, action = "check") {
    ensureNpcWorldState(state);
    const open = npcTalk(state, npcId);
    if (!open.success) return open;
    const dialogue = state.dialogueState, questId = dialogue.questId || "npc_quest_" + npcId;
    if (action === "offer") {
      const quest = npcQuestStatus(state, npcId)[0] || state.questState.available?.[questId];
      dialogue.phase = quest ? "OFFER" : "CHECK";
      return { success: Boolean(quest), phase: dialogue.phase, quest: quest || null, reason: quest ? null : "NPC chưa có lời nhờ mới." };
    }
    if (action === "accept") {
      const result = acceptNpcQuest(state, questId);
      if (result.success) { dialogue.phase = "PROGRESS"; dialogue.questId = questId; }
      return { ...result, phase: dialogue.phase };
    }
    if (action === "progress") {
      const quest = state.questState.active?.[questId];
      if (!quest) return { success: false, reason: "Chưa có nhiệm vụ đang thực hiện." };
      quest.objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
      quest.objectives.forEach((objective) => { objective.done = true; });
      quest.progressDay = absoluteDay(state.gameClock); dialogue.phase = "TURN_IN";
      return { success: true, phase: dialogue.phase, quest };
    }
    if (action === "turn_in") {
      const quest = state.questState.active?.[questId];
      if (!quest) return { success: false, reason: "Không có nhiệm vụ để giao trả." };
      if ((quest.objectives || []).some((objective) => !objective.done)) return { success: false, reason: "Mục tiêu nhiệm vụ chưa hoàn tất." };
      delete state.questState.active[questId]; quest.status = "completed"; quest.completedDay = absoluteDay(state.gameClock); state.questState.completed[questId] = quest;
      grantCanonicalReward(state, "npc-quest:" + questId, { exp: 15, merit: 2 }, "npc-quest:" + questId);
      recordRelationshipEvent(state, npcId, "kept_promise", { questId, uniqueKey: "npc-quest-turn-in:" + questId });
      dialogue.phase = "CHECK"; dialogue.questId = null;
      return { success: true, phase: dialogue.phase, quest };
    }
    return { success: true, phase: dialogue.phase, quest: state.questState?.available?.[questId] || state.questState?.active?.[questId] || null };
  }
  function ensureMapState(state) { ensure(state); state.mapState ||= { version: 2, structures: {}, invalidExits: [], journal: [], fastTravel: {}, teleportAnchors: {}, tradeRoutes: {}, outposts: {}, eventInfluence: {}, influenceCache: {}, influenceRevision: 1, invalidationCount: 0, lastInvalidation: null }; state.mapState.version = Math.max(2, Number(state.mapState.version || 1)); state.mapState.structures ||= {}; state.mapState.invalidExits ||= []; state.mapState.journal ||= []; state.mapState.fastTravel ||= {}; state.mapState.teleportAnchors ||= {}; state.mapState.tradeRoutes ||= {}; state.mapState.outposts ||= {}; state.mapState.eventInfluence ||= {}; state.mapState.influenceCache ||= {}; state.mapState.influenceRevision = Number(state.mapState.influenceRevision || 1); state.mapState.invalidationCount = Number(state.mapState.invalidationCount || 0); return state.mapState; }
  function invalidateMapInfluence(state, nodeId) { const map = ensureMapState(state); map.influenceRevision += 1; map.invalidationCount += 1; map.lastInvalidation = { nodeId: nodeId || null, revision: map.influenceRevision, day: absoluteDay(state.gameClock) }; map.influenceCache = {}; if (nodeId) { const node = mapNode(state, nodeId); if (node) node.influenceRevision = map.influenceRevision; } return map.influenceRevision; }
  function recordMapEventInfluence(state, nodeId, factionId, score, expiresDay = null) {
    const map = ensureMapState(state); if (!nodeId || !factionId || !Number.isFinite(Number(score))) return { success: false, reason: "Tín hiệu ảnh hưởng không hợp lệ." };
    map.eventInfluence[nodeId] ||= {};
    const current = map.eventInfluence[nodeId][factionId];
    const value = typeof current === "object" ? Number(current.score || 0) : Number(current || 0);
    map.eventInfluence[nodeId][factionId] = { score: value + Number(score), expiresDay: expiresDay == null ? null : Number(expiresDay), source: "world_event" };
    invalidateMapInfluence(state, nodeId);
    return { success: true, nodeId, factionId, score: map.eventInfluence[nodeId][factionId].score };
  }
  function activeEventInfluence(state, nodeId) {
    const map = ensureMapState(state); const now = absoluteDay(state.gameClock); const raw = map.eventInfluence[nodeId] || {}; const active = {};
    Object.entries(raw).forEach(([factionId, value]) => { const score = typeof value === "object" ? Number(value.score || 0) : Number(value || 0); const expiresDay = typeof value === "object" ? Number(value.expiresDay || 0) : 0; if (score > 0 && (!expiresDay || expiresDay >= now)) active[factionId] = score; });
    return active;
  }
  function nodeIsDiscovered(state, nodeId) { const node = mapNode(state, nodeId); return Boolean(node && (nodeId === state.locationId || Number(node.fogState || 0) >= 2 || state.visitedLocations?.includes(nodeId))); }
  function mapNode(state, nodeId = state.locationId) {
    ensure(state); const node = state.openWorld?.nodePool?.[nodeId] || D.LOCATIONS?.[nodeId];
    if (!node) return null;
    node.regionId ||= node.region || D.WORLD_MAP?.locations?.[nodeId]?.region || D.LOCATIONS?.[nodeId]?.region || currentRegion(state); node.mapNodeType ||= node.openWorld ? "wilderness" : "location";
    node.subLocations = Array.isArray(node.subLocations) ? node.subLocations : [{ id: "main", type: "indoor", displayName: node.name || nodeId, actions: ["look", "search"], npcsPresent: [] }];
    node.influenceMap ||= {}; node.history = Array.isArray(node.history) ? node.history : [];
    node.fogState = clamp(node.fogState ?? (state.visitedLocations?.includes(nodeId) ? 2 : 0), 0, 3);
    node.fastTravelUnlocked = Boolean(node.fastTravelUnlocked || state.mapState?.fastTravel?.[nodeId]);
    node.playerStructures = Array.isArray(node.playerStructures) ? node.playerStructures : (ensureMapState(state).structures[nodeId] || []);
    return node;
  }
  function nodeCoordinates(state, nodeId) {
    const node = mapNode(state, nodeId); const mapLocation = D.WORLD_MAP?.locations?.[nodeId];
    const candidates = [state.openWorld?.coordinates?.[nodeId], node && [node.x, node.y], mapLocation && [mapLocation.x, mapLocation.y]];
    const coordinates = candidates.find((value) => Array.isArray(value) && value.length >= 2 && value.every((entry) => Number.isFinite(Number(entry))));
    return coordinates ? coordinates.slice(0, 2).map(Number) : null;
  }
  function validateMapCoordinates(state) {
    ensure(state);
    const ids = new Set([...Object.keys(state.openWorld?.nodePool || {}), ...Object.keys(D.LOCATIONS || {}), ...Object.keys(D.WORLD_MAP?.locations || {})]);
    const missing = [], outOfBounds = [], duplicates = [], seen = new Map();
    ids.forEach((nodeId) => {
      const coordinates = nodeCoordinates(state, nodeId);
      if (!coordinates) { missing.push(nodeId); return; }
      const [x, y] = coordinates;
      if (x < 0 || x > 100 || y < 0 || y > 100) outOfBounds.push({ nodeId, x, y });
      const key = x + "," + y;
      if (seen.has(key)) duplicates.push({ coordinate: key, nodeIds: [seen.get(key), nodeId] });
      else seen.set(key, nodeId);
    });
    return { valid: !missing.length && !outOfBounds.length && !duplicates.length, bounds: { min: 0, max: 100 }, total: ids.size, missing, outOfBounds, duplicates };
  }
  function validateMapCanonicalState(state) {
    ensure(state); const errors = [], coordinateAudit = validateMapCoordinates(state), map = ensureMapState(state);
    if (!coordinateAudit.valid) errors.push("coordinates");
    const ids = [...new Set([...Object.keys(D.LOCATIONS || {}), ...Object.keys(D.WORLD_MAP?.locations || {}), ...Object.keys(state.openWorld?.nodePool || {})])];
    ids.filter((id) => nodeIsDiscovered(state, id)).forEach((id) => {
      const snapshot = mapInfluenceSnapshot(state, id);
      if (!snapshot || snapshot.nodeId !== id || !snapshot.influenceMap || !Number.isFinite(Number(snapshot.pressure)) || !Number.isFinite(Number(snapshot.confidence)) || snapshot.revision !== map.influenceRevision) errors.push("influence:" + id);
    });
    Object.entries(map.influenceCache || {}).forEach(([id, entry]) => { if (!entry?.snapshot || entry.revision !== map.influenceRevision || entry.snapshot.nodeId !== id) errors.push("cache:" + id); });
    return { ok: errors.length === 0, errors, coordinateAudit, checkedNodes: ids.length, revision: map.influenceRevision };
  }
  function validateCacheInvalidationState(state) {
    ensure(state); const map = ensureMapState(state), errors = [];
    if (!Number.isInteger(Number(map.influenceRevision)) || Number(map.influenceRevision) < 1) errors.push("revision");
    if (!Number.isInteger(Number(map.invalidationCount)) || Number(map.invalidationCount) < 0) errors.push("invalidationCount");
    if (map.lastInvalidation && (Number(map.lastInvalidation.revision) !== Number(map.influenceRevision) || !Number.isFinite(Number(map.lastInvalidation.day)))) errors.push("lastInvalidation");
    Object.entries(map.influenceCache || {}).forEach(([nodeId, entry]) => { if (!entry?.snapshot || entry.snapshot.nodeId !== nodeId || Number(entry.revision) !== Number(map.influenceRevision)) errors.push("staleCache:" + nodeId); });
    ["mapInfluence", "npcView", "offline"].forEach((key) => { const metric = state.runtimeMetrics?.[key]; if (!metric || !Number.isFinite(Number(metric.calls)) || !Number.isFinite(Number(metric.totalMs)) || Number(metric.calls) < 0 || Number(metric.totalMs) < 0) errors.push("metric:" + key); });
    return { ok: errors.length === 0, errors, revision: map.influenceRevision, invalidationCount: map.invalidationCount };
  }
  function validateReplayEnvelope(state) {
    ensure(state); const errors = [], sim = state.worldSimulation || {};
    if (!sim.seed || typeof sim.seed !== "string") errors.push("worldSeed");
    if (!state.meta?.saveId || typeof state.meta.saveId !== "string") errors.push("saveId");
    if (!Number.isInteger(Number(state.meta?.turn)) || Number(state.meta.turn) < 0) errors.push("meta:turn");
    if (!Number.isInteger(Number(state.generatedItemSequence)) || Number(state.generatedItemSequence) < 0) errors.push("generatedItemSequence");
    ["lastProcessedDay", "nextEventSeq"].forEach((key) => { if (!Number.isInteger(Number(sim[key])) || Number(sim[key]) < 0) errors.push("worldSimulation:" + key); });
    ["events", "scheduledTasks", "npcEncounters"].forEach((key) => {
      const values = key === "scheduledTasks" ? (Array.isArray(sim[key]) ? sim[key] : []) : Object.values(sim[key] || {}), ids = new Set();
      if (key === "scheduledTasks" && !Array.isArray(sim[key])) errors.push(key + ":array");
      values.forEach((entry) => { const identity = entry?.id || entry?.key; if (!identity || ids.has(identity)) errors.push(key + ":id"); ids.add(identity); });
    });
    return { ok: errors.length === 0, errors, seed: sim.seed, turn: Number(state.meta?.turn || 0) };
  }
  function mapInfluenceSnapshot(state, nodeId = state.locationId) {
    const startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    ensure(state); state.runtimeMetrics.mapInfluence.calls += 1;
    const node = mapNode(state, nodeId); if (!node) return { nodeId, discovered: false, source: "missing", influenceMap: {}, factions: [], ownerFactionId: null, contested: false, pressure: 0, confidence: 0 };
    const map = ensureMapState(state); const discovered = nodeIsDiscovered(state, nodeId); const eventInfluence = activeEventInfluence(state, nodeId); const coordinates = nodeCoordinates(state, nodeId);
    if (!coordinates || coordinates.some((value) => value < 0 || value > 100)) return { nodeId, discovered, source: "invalid_coordinate", influenceMap: {}, factions: [], ownerFactionId: null, contested: false, pressure: 0, confidence: 0, revision: map.influenceRevision, coordinateValid: false };
    if (!discovered) {
      const eventValues = Object.entries(eventInfluence).filter(([, value]) => Number(value) > 0).map(([factionId, score]) => ({ factionId, score: Number(score), tier: "event" }));
      return { nodeId, discovered: false, source: eventValues.length ? "world_event" : "hidden", influenceMap: eventValues.reduce((out, item) => (out[item.factionId] = item.score, out), {}), factions: eventValues, ownerFactionId: null, contested: false, pressure: eventValues.reduce((sum, item) => sum + item.score, 0), confidence: eventValues.length ? 0.25 : 0, revision: map.influenceRevision };
    }
    const cached = map.influenceCache[nodeId]; if (cached?.revision === map.influenceRevision) { state.runtimeMetrics.mapInfluence.cacheHits += 1; state.runtimeMetrics.mapInfluence.totalMs += (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startedAt; return copy(cached.snapshot); }
    state.runtimeMetrics.mapInfluence.uncached += 1;
    const [x, y] = coordinates; const factions = D.WORLD_MAP?.factions || D.FACTION_DATA?.factions || [];
    const influenceMap = {};
    factions.forEach((faction, index) => {
      const runtime = state.worldSimulation.factionState[faction.id] || {}; const home = runtime.homeNodeId || faction.homeNodeId || faction.capitalNodeId;
      const homeCoords = home ? nodeCoordinates(state, home) : (Number.isFinite(Number(faction.x)) && Number.isFinite(Number(faction.y)) ? [Number(faction.x), Number(faction.y)] : null); const distance = homeCoords ? Math.abs(x - homeCoords[0]) + Math.abs(y - homeCoords[1]) : index + 2;
      const power = Math.max(1, Number(runtime.power || faction.power || faction.scale * 10 || 10)); const warPressure = Object.values(state.worldSimulation.wars || {}).some((war) => war.status === "active" && (war.factionA === faction.id || war.factionB === faction.id)) ? 1.12 : 1;
      influenceMap[faction.id] = power * warPressure * Math.pow(0.7, distance) + Number(eventInfluence[faction.id] || 0);
    });
    Object.values(map.structures[nodeId] || []).filter((structure) => !["disabled", "dismantled"].includes(structure.status) && Number(structure.integrity || 0) > 0).forEach((structure) => {
      const ownerKey = structure.ownerType === "faction" && structure.ownerId ? structure.ownerId : structure.ownerType === "player" && structure.ownerId ? "player_" + structure.ownerId : null;
      if (ownerKey) influenceMap[ownerKey] = Number(influenceMap[ownerKey] || 0) + Number(structure.effects?.influence || 0);
    });
    const values = Object.entries(influenceMap).sort((a, b) => b[1] - a[1]); const top = values[0], second = values[1];
    const contested = Boolean(top && second && top[1] > 0 && ((top[1] - second[1]) / top[1]) < 0.15); const pressure = values.reduce((sum, [, value]) => sum + Number(value || 0), 0); const result = { nodeId, discovered: true, source: "canonical_gradient", influenceMap: { ...influenceMap }, factions: values.map(([factionId, score], index) => ({ factionId, score, tier: index === 0 ? "dominant" : score >= top[1] * 0.6 ? "strong" : "weak" })), ownerFactionId: node.ownerFactionId && node.ownerFactionId.startsWith?.("player_") ? node.ownerFactionId : (top && top[1] >= 10 && !contested ? top[0] : null), contested, pressure, confidence: top ? clamp(Number(top[1] / Math.max(1, pressure)), 0, 1) : 0, revision: map.influenceRevision };
    node.influenceMap = influenceMap; node.contested = contested; node.ownerFactionId = result.ownerFactionId; map.influenceCache[nodeId] = { revision: map.influenceRevision, snapshot: copy(result) }; state.runtimeMetrics.mapInfluence.totalMs += (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startedAt; return result;
  }
  function refreshMapInfluence(state) {
    ensure(state); const ids = new Set([...Object.keys(state.openWorld?.nodePool || {}), ...Object.keys(D.LOCATIONS || {})]);
    const snapshots = {}; ids.forEach((id) => { snapshots[id] = mapInfluenceSnapshot(state, id); }); return snapshots;
  }
  function runtimeBudgetSnapshot(state) {
    ensure(state);
    const metrics = copy(state.runtimeMetrics);
    const influence = metrics.mapInfluence;
    influence.averageMs = influence.calls ? influence.totalMs / influence.calls : 0;
    influence.cacheHitRate = influence.calls ? influence.cacheHits / influence.calls : 0;
    metrics.npcView.averageMs = metrics.npcView.calls ? metrics.npcView.totalMs / metrics.npcView.calls : 0;
    metrics.offline.averageMs = metrics.offline.calls ? metrics.offline.totalMs / metrics.offline.calls : 0;
    return { metrics, budgets: { profileMode: "node_baseline", mapInfluenceAverageMs: 4, mapInfluenceCacheHitRate: 0.5, npcViewAverageMs: 4, offlineAverageMs: 500, runtimeHistoryEvents: 300, saveHistoryEvents: 100, npcRecordsPerTick: 100, offlineDetailedDays: 30 } };
  }
  function resolvePerformanceProfile(capabilities = {}) {
    const nav = typeof navigator !== "undefined" ? navigator : {};
    const cores = Number(capabilities.hardwareConcurrency ?? nav.hardwareConcurrency ?? 4);
    const memory = Number(capabilities.deviceMemory ?? nav.deviceMemory ?? 4);
    const reducedMotion = Boolean(capabilities.reducedMotion);
    const weak = cores <= 2 || memory <= 2;
    const id = reducedMotion ? "reduced" : weak ? "weak" : "standard";
    return {
      id,
      targetFps: id === "weak" ? 30 : id === "reduced" ? 45 : 60,
      mapRenderBudget: id === "weak" ? 24 : id === "reduced" ? 40 : 80,
      historyWindow: id === "weak" ? 12 : id === "reduced" ? 16 : 20,
      npcRecordsPerTick: id === "weak" ? 50 : id === "reduced" ? 75 : 100,
      offlineDetailedDays: id === "weak" ? 14 : 30,
      reducedMotion
    };
  }
  function performanceProfile(state, capabilities = {}) {
    ensure(state);
    const profile = resolvePerformanceProfile(capabilities);
    state.runtimeMetrics.performanceProfile = profile.id;
    return profile;
  }
  function validatePerformanceBudget(state, capabilities = {}) {
    ensure(state); const profile = resolvePerformanceProfile(capabilities), errors = [];
    if (!Number.isFinite(profile.targetFps) || profile.targetFps < 30 || profile.targetFps > 60) errors.push("targetFps");
    if (!Number.isFinite(profile.mapRenderBudget) || profile.mapRenderBudget < 12) errors.push("mapRenderBudget");
    if (!Number.isFinite(profile.historyWindow) || profile.historyWindow < 8) errors.push("historyWindow");
    if (!Number.isFinite(profile.npcRecordsPerTick) || profile.npcRecordsPerTick < 25) errors.push("npcRecordsPerTick");
    if (!Number.isFinite(profile.offlineDetailedDays) || profile.offlineDetailedDays < 7 || Number(state.worldSimulation?.offlinePolicy?.detailedWindowDays || 30) > profile.offlineDetailedDays) errors.push("offlineDetailedDays");
    const metrics = runtimeBudgetSnapshot(state);
    if (metrics.metrics.mapInfluence.calls && metrics.metrics.mapInfluence.averageMs > metrics.budgets.mapInfluenceAverageMs * 4) errors.push("mapInfluenceRuntime");
    return { ok: errors.length === 0, profile, metrics, errors };
  }
  function mapFogState(state, nodeId = state.locationId, level) {
    const node = mapNode(state, nodeId); if (!node) return null;
    if (level !== undefined) node.fogState = clamp(level, 0, 3); else if (state.visitedLocations?.includes(nodeId)) node.fogState = Math.max(2, Number(node.fogState || 0));
    if (node.fogState >= 3) node.fastTravelUnlocked = true;
    return node.fogState;
  }
  function moveWithinNode(state, subLocationId) {
    const node = mapNode(state); const target = node?.subLocations?.find((location) => location.id === subLocationId);
    if (!target) return { success: false, reason: "Không tìm thấy điểm nhỏ này trong địa điểm hiện tại." };
    const requiredRank = target.requiredGuildRank || target.requiredOrganizationRank || null;
    if (requiredRank) {
      const actual = memberRankIndex(state.guildMembership);
      const required = Number.isInteger(Number(requiredRank)) ? Number(requiredRank) : ORG_RANKS.findIndex((rank) => rank.id === String(requiredRank).toLowerCase() || rank.label === requiredRank);
      if (!state.guildMembership || state.guildMembership.guildId !== (target.organizationId || node.organizationId) || required < 0 || actual < required) return { success: false, reason: "Chức vị hiện tại chưa được phép vào khu vực nội môn này." };
    }
    state.currentSubLocationId = target.id; appendNodeHistory(state, state.locationId, { type: "sub_location", summary: "Ngươi đã đi tới " + (target.displayName || target.name || target.id) + ".", key: "sub:" + target.id + ":" + absoluteDay(state.gameClock) });
    return { success: true, subLocation: target };
  }
  function appendNodeHistory(state, nodeId, entry) {
    const node = mapNode(state, nodeId); if (!node || !entry?.type) return false;
    const record = { turn: Number(state.meta?.turn || 0), day: absoluteDay(state.gameClock), regionId: node.regionId, ...entry };
    const key = record.key || [record.type, record.summary, record.day].join(":");
    if (node.history.some((item) => item.key === key)) return false;
    node.history.push({ ...record, key }); if (node.history.length > 50) node.history.splice(0, node.history.length - 50); return true;
  }
  function validateNodeHistory(state, nodeId = null) {
    ensure(state);
    const nodes = nodeId ? [mapNode(state, nodeId)].filter(Boolean) : Object.keys(D.LOCATIONS || {}).map((id) => mapNode(state, id)).filter(Boolean);
    const errors = [];
    nodes.forEach((node) => {
      const keys = new Set();
      (node.history || []).forEach((entry, index) => {
        if (!entry || !entry.type || !entry.key || !Number.isFinite(Number(entry.day)) || !entry.regionId) errors.push(node.id + ":" + index + ":metadata");
        if (keys.has(entry.key)) errors.push(node.id + ":" + index + ":duplicate");
        keys.add(entry.key);
      });
      if ((node.history || []).length > 50) errors.push(node.id + ":retention");
    });
    return { ok: errors.length === 0, nodeCount: nodes.length, errors };
  }
  function nodeResonance(state, nodeId = state.locationId) {
    const node = mapNode(state, nodeId); if (!node) return 0;
    const path = state.player?.pathId || ""; const terms = [...(node.tags || []), ...(node.terrain ? [node.terrain] : []), ...(node.searchable || [])].join(" ").toLowerCase();
    const pathTerms = { kiem_dao: ["kiem", "metal", "kim"], dan_dao: ["dan", "hoa", "thao"], phu_dao: ["phu", "linh"], am_luat_dao: ["am", "luat", "dem"], tinh_tuong_dao: ["tinh", "troi"] }[path] || [];
    const base = pathTerms.length ? clamp(pathTerms.filter((term) => terms.includes(term)).length / pathTerms.length, 0, 1) : 0;
    const physiqueResonance = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers ? Number(window.GameExpansion.getWorldModifiers(state, { activity: "resonance" }).fateResonance || 0) : 0;
    return clamp(base + physiqueResonance, 0, 1);
  }
  function mapCompletion(state, regionId = currentRegion(state)) {
    const knownIds = new Set([...Object.keys(state.openWorld?.nodePool || {}), ...Object.keys(D.LOCATIONS || {})]); const known = [...knownIds].filter((id) => mapNode(state, id)?.regionId === regionId); const visited = known.filter((id) => state.visitedLocations?.includes(id));
    const percent = known.length ? Math.round(visited.length / known.length * 100) : 0; const title = percent >= 80 ? "Người Vẽ Bản Đồ " + regionId : null;
    if (title) state.achievements ||= {}, state.achievements["cartographer_" + regionId] ||= { name: title, unlockedDay: absoluteDay(state.gameClock) };
    const subLocationsVisited = known.reduce((sum, id) => sum + Number(mapNode(state, id)?.history?.some((entry) => entry.type === "sub_location") ? 1 : 0), 0); const structuresBuilt = known.reduce((sum, id) => sum + (ensureMapState(state).structures[id] || []).length, 0);
    return { regionId, known: known.length, visited: visited.length, subLocationsVisited, structuresBuilt, percent, title };
  }
  function mapCompletionDetailed(state, regionId = currentRegion(state)) {
    const base = mapCompletion(state, regionId), knownIds = [...new Set([...Object.keys(state.openWorld?.nodePool || {}), ...Object.keys(D.LOCATIONS || {})])];
    const nodes = knownIds.map((id) => mapNode(state, id)).filter((node) => node?.regionId === regionId);
    const layers = { visited: 0, subLocation: 0, structure: 0, weather: 0, actor: 0, faction: 0 };
    const historyTypeByLayer = { subLocation: "sub_location", structure: "structure", weather: "weather", actor: "actor", faction: "faction_change" };
    nodes.forEach((node) => {
      if (state.visitedLocations?.includes(node.id)) layers.visited += 1;
      const types = new Set((node.history || []).map((entry) => entry.type));
      Object.entries(historyTypeByLayer).forEach(([key, type]) => { if (types.has(type)) layers[key] += 1; });
    });
    return { ...base, layers, historyCoverage: nodes.length ? Math.round(nodes.reduce((sum, node) => sum + Math.min(1, (node.history || []).length / 5), 0) / nodes.length * 100) : 0, explainable: true };
  }
  function teleportAnchorEligibility(state, nodeId) {
    const node = mapNode(state, nodeId); if (!node || !nodeIsDiscovered(state, nodeId)) return { eligible: false, reason: "Chưa khám phá địa điểm này." };
    const startNode = state.player?.startLocationId || state.startLocationId || state.homeLocationId; const guildId = state.guildMembership?.guildId;
    const isGuildNode = Boolean(guildId && (node.guildId === guildId || node.factionId === guildId || node.ownerFactionId === guildId)); const isTown = /phường thị|thành|cảng|thị trấn|market|city/i.test(String(node.role || node.type || node.name || ""));
    if (nodeId === startNode || isGuildNode || isTown || ensureMapState(state).outposts[nodeId]) return { eligible: true, reason: "Điểm neo hợp lệ." };
    return { eligible: false, reason: "Chỉ node sinh ra, node tông môn đang tham gia, phường thị hoặc trạm đã lập mới được nối Truyền Tống Trận." };
  }
  function buildMapStructure(state, nodeId, type) {
    const aliases = { teleport_array: "waystation", world_ward: "ward_formation" };
    const requestedType = type; type = aliases[type] || type;
    if (!STRUCTURE_CATALOG[type]) return { success: false, reason: "Invalid structure catalog entry." };
    const allowed = ["watchtower", "waystation", "trading_post", "ward_formation"]; if (!allowed.includes(type)) return { success: false, reason: "Công trình bản đồ không hợp lệ." };
    const node = mapNode(state, nodeId); if (!node) return { success: false, reason: "Không tìm thấy địa điểm." };
    if (nodeId !== state.locationId) return { success: false, reason: "Ngươi phải đang đứng tại node muốn xây công trình." };
    if (!nodeIsDiscovered(state, nodeId)) return { success: false, reason: "Chưa khám phá địa điểm này." };
    const list = ensureMapState(state).structures[nodeId] ||= []; if (list.some((structure) => structure.type === type && structure.status !== "dismantled")) return { success: false, reason: "Công trình này đã tồn tại." };
    if (type === "waystation") { const anchor = teleportAnchorEligibility(state, nodeId); if (!anchor.eligible) return { success: false, reason: anchor.reason }; }
    const cost = Number(STRUCTURE_CATALOG[type].buildCost || 0);
    if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Cần " + cost + " Linh Thạch để xây công trình." };
    removeItem(state, "linh_thach", cost);
    const structure = { id: uid(state, "structure"), nodeId, type, requestedType, ownerType: "player", ownerId: state.player.id, builtByCharacterId: state.player.id, builtAt: absoluteDay(state.gameClock), integrity: 100, level: 1, charges: type === "waystation" ? 100 : null, status: "active", transferHistory: [], effects: type === "watchtower" ? { revealRadius: 2 } : type === "waystation" ? { fastTravel: true } : type === "ward_formation" ? { encounterRisk: -0.2, curseRisk: -0.25, sanDrainReduction: 0.25, influence: 6 } : { itinerantMerchant: true } };
    structure.effects = { ...(structure.effects || {}), ...(STRUCTURE_CATALOG[type].effects || {}) };
    list.push(structure); node.playerStructures = list; if (type === "waystation") { state.mapState.fastTravel ||= {}; state.mapState.teleportAnchors ||= {}; state.mapState.fastTravel[nodeId] = true; state.mapState.teleportAnchors[nodeId] = structure.id; node.fastTravelUnlocked = true; }
    invalidateMapInfluence(state, nodeId);
    appendNodeHistory(state, nodeId, { type: "structure", summary: (type === "waystation" ? "Truyền Tống Trận" : type === "ward_formation" ? "Hộ Giới Đại Trận" : "Công trình " + type) + " được dựng lên." }); return { success: true, structure };
  }
  function structureById(state, nodeId, structureId) { return (ensureMapState(state).structures[nodeId] || []).find((structure) => structure.id === structureId); }
  function structureNodeAccess(state, nodeId) {
    if (!mapNode(state, nodeId)) return { allowed: false, reason: "Không tìm thấy địa điểm." };
    if (nodeId !== state.locationId) return { allowed: false, reason: "Ngươi phải đang đứng tại node của công trình." };
    if (!nodeIsDiscovered(state, nodeId)) return { allowed: false, reason: "Chưa khám phá địa điểm này." };
    return { allowed: true };
  }
  function repairMapStructure(state, nodeId, structureId) {
    const structure = structureById(state, nodeId, structureId); if (!structure || structure.status === "dismantled") return { success: false, reason: "Không tìm thấy công trình." };
    const access = structureNodeAccess(state, nodeId); if (!access.allowed) return { success: false, reason: access.reason };
    if (!structureManagerDecision(state, structure, "repair").allowed) return { success: false, reason: "Chỉ chủ hiện tại hoặc thành viên thế lực sở hữu mới được sửa chữa." };
    const missing = Math.max(0, 100 - Number(structure.integrity || 0));
    if (!missing && structure.status !== "disabled") return { success: true, unchanged: true, structure };
    const definition = STRUCTURE_CATALOG[structure.type] || {}; const cost = Math.max(1, Math.ceil(missing / Math.max(1, Number(definition.repairDivisor || 10)))); if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch sửa chữa." };
    removeItem(state, "linh_thach", cost); structure.integrity = 100; structure.status = "active"; structure.lastRepairDay = absoluteDay(state.gameClock); invalidateMapInfluence(state, nodeId); appendNodeHistory(state, nodeId, { type: "structure", summary: "Công trình được sửa chữa và khôi phục hiệu lực." }); return { success: true, cost, structure };
  }
  function upgradeMapStructure(state, nodeId, structureId) {
    const structure = structureById(state, nodeId, structureId); if (!structure || structure.status === "dismantled") return { success: false, reason: "Không tìm thấy công trình." };
    const access = structureNodeAccess(state, nodeId); if (!access.allowed) return { success: false, reason: access.reason };
    if (!structureManagerDecision(state, structure, "upgrade").allowed) return { success: false, reason: "Chỉ chủ người chơi mới được nâng cấp công trình." };
    const definition = STRUCTURE_CATALOG[structure.type] || {}; const current = Number(structure.level || 1); if (current >= Number(definition.maxLevel || 1)) return { success: false, reason: "Công trình đã đạt cấp tối đa." };
    const cost = Number(definition.upgradeBase || 0) * (current + 1); if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch nâng cấp." };
    removeItem(state, "linh_thach", cost); structure.level = current + 1; structure.integrity = 100; structure.upgradedDay = absoluteDay(state.gameClock); if (structure.type === "waystation") structure.charges = Number(structure.charges || 0) + Number(definition.chargesPerUpgrade || 0); if (structure.type === "ward_formation") { structure.effects.sanDrainReduction = clamp(Number(structure.effects.sanDrainReduction || 0) + Number(definition.sanDrainReductionPerUpgrade || 0), 0, 0.5); structure.effects.influence = Number(structure.effects.influence || 0) + Number(definition.influencePerUpgrade || 0); } invalidateMapInfluence(state, nodeId); appendNodeHistory(state, nodeId, { type: "structure", summary: "Công trình được nâng cấp lên cấp " + structure.level + "." }); return { success: true, cost, structure };
  }
  function disableMapStructure(state, nodeId, structureId, reason = "manual") {
    const structure = structureById(state, nodeId, structureId); if (!structure || structure.status === "dismantled") return { success: false, reason: "Không tìm thấy công trình." };
    const access = structureNodeAccess(state, nodeId); if (!access.allowed) return { success: false, reason: access.reason };
    if (!structureManagerDecision(state, structure, "repair").allowed) return { success: false, reason: "Chỉ chủ hiện tại hoặc thành viên thế lực sở hữu mới được tạm dừng công trình." };
    structure.status = "disabled"; structure.disabledDay = absoluteDay(state.gameClock); structure.disabledReason = reason; invalidateMapInfluence(state, nodeId); appendNodeHistory(state, nodeId, { type: "structure", summary: "Công trình tạm ngừng hoạt động: " + reason + "." }); return { success: true, structure };
  }
  function dismantleMapStructure(state, nodeId, structureId) {
    const structure = structureById(state, nodeId, structureId);
    if (!structure || structure.status === "dismantled") return { success: false, reason: "Không tìm thấy công trình có thể tháo dỡ." };
    const access = structureNodeAccess(state, nodeId); if (!access.allowed) return { success: false, reason: access.reason };
    if (!structureManagerDecision(state, structure, "dismantle").allowed) return { success: false, reason: "Chỉ chủ người chơi mới được tháo dỡ." };
    const definition = STRUCTURE_CATALOG[structure.type] || {}; const refund = Math.floor(Number(definition.buildCost || 0) * Math.max(1, Number(structure.level || 1)) * Number(definition.refundRate || 0));
    structure.status = "dismantled"; structure.dismantledDay = absoluteDay(state.gameClock); structure.refund = refund;
    if (refund > 0) addItem(state, "linh_thach", refund);
    invalidateMapInfluence(state, nodeId);
    appendNodeHistory(state, nodeId, { type: "structure", summary: "Công trình đã được tháo dỡ; ảnh hưởng bản đồ được thu hồi." });
    return { success: true, refund, structure: copy(structure) };
  }
  function travelPlan(state, fromNodeId = state.locationId, toNodeId, travelType = "walk") {
    const from = nodeCoordinates(state, fromNodeId), to = nodeCoordinates(state, toNodeId); if (!from || !to) return { success: false, reason: "Tuyến đường chưa có tọa độ." };
    const distance = Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]); const fromRegion = mapNode(state, fromNodeId)?.regionId || currentRegion(state); const weather = state.worldSimulation.regionState[fromRegion]?.weather; const targetInfluence = mapInfluenceSnapshot(state, toNodeId);
    if (travelType === "truyền_tống_trận") { const fast = ensureMapState(state).fastTravel || {}; const fromAnchor = teleportAnchorEligibility(state, fromNodeId); const toAnchor = teleportAnchorEligibility(state, toNodeId); if (!fast[fromNodeId] || !fast[toNodeId] || !fromAnchor.eligible || !toAnchor.eligible) return { success: false, reason: "Hai đầu tuyến chưa có Truyền Tống Trận hợp lệ." }; return { success: true, distance, gameDays: 0, cost: Math.max(1, distance * 2), travelType, anchorFrom: fromNodeId, anchorTo: toNodeId }; }
    let speed = travelType === "ngự_khí" ? 3 : 1; if (weather === "mua") speed *= 0.8; if (weather === "tuyet") speed *= 0.6; if (weather === "bao_linh_khi" && travelType === "ngự_khí") return { success: false, reason: "Bão Linh Khí khiến ngự khí không thể cất cánh." };
    const danger = Number(mapNode(state, toNodeId)?.dangerLevel || 0) / 100; const contestedWeight = targetInfluence.contested ? 1.25 : 1; const ward = wardProtectionAtNode(state, toNodeId); const risk = clamp((danger * contestedWeight) * (1 - Number(ward.encounterRisk || 0)), 0, 1);
    return { success: true, distance, gameDays: Math.max(1, Math.ceil(distance / speed)), speed, travelType, risk, influence: targetInfluence, eventRolls: Math.max(1, Math.ceil(distance / speed)) };
  }
  function travelWeightSnapshot(state, toNodeId, context = {}) {
    const node = mapNode(state, toNodeId) || {}, influence = mapInfluenceSnapshot(state, toNodeId), weatherRegionId = node.regionId || currentRegion(state), weatherId = normalizeWeatherId(state.worldSimulation.regionState[weatherRegionId]?.weather);
    const terrainWeights = { road: 0.8, plains: 1, forest: 1.12, mountain: 1.28, swamp: 1.24, coast: 1.05, desert: 1.18 };
    const terrain = String(node.terrain || node.biome || node.type || "plains").toLowerCase();
    const terrainWeight = Object.entries(terrainWeights).find(([key]) => terrain.includes(key))?.[1] || 1;
    const weatherWeight = { quang: 1, mua: 1.08, suong: 1.05, tuyet: 1.18, loi_vu: 1.16, linh_phong: 1.1, am_vu: 1.2, bao_linh_khi: 1.3 }[weatherId] || 1;
    const influenceWeight = 1 + Math.min(0.25, Number(influence.pressure || 0) / 400) + (influence.contested ? 0.15 : 0);
    const ward = wardProtectionAtNode(state, toNodeId);
    const structureWeight = clamp(1 - Number(ward.sanDrainReduction || 0) * 0.25 + Number(ward.encounterRisk || 0), 0.55, 1.25);
    return { terrain, terrainWeight, weatherId, weatherWeight, influenceWeight, structureWeight, source: "canonical_travel_weight" };
  }
  function canonicalTravelPlan(state, fromNodeId = state.locationId, toNodeId, travelType = "walk") {
    const plan = travelPlan(state, fromNodeId, toNodeId, travelType);
    if (!plan.success || travelType === "truyền_tống_trận") return plan;
    const fromRegion = mapNode(state, fromNodeId)?.regionId || currentRegion(state);
    const modifiers = getWorldModifiers(state, { regionId: fromRegion, nodeId: toNodeId, activity: "travel" });
    const partySize = 1 + (state.companion && ["active", "mutated"].includes(state.companion.state) ? 1 : 0) + (Array.isArray(state.party?.members) ? state.party.members.filter(Boolean).length : 0);
    const partyWeight = 1 + Math.max(0, partySize - 1) * 0.05;
    const baseSpeed = Number(plan.speed || 1);
    const effectiveSpeed = baseSpeed / partyWeight;
    const weights = travelWeightSnapshot(state, toNodeId, { fromNodeId, travelType });
    const danger = Number(mapNode(state, toNodeId)?.dangerLevel || 0) / 100;
    const contestedWeight = plan.influence?.contested ? 1.25 : 1;
    const risk = clamp((danger * contestedWeight * weights.terrainWeight * weights.weatherWeight * weights.influenceWeight * weights.structureWeight) + Number(modifiers.travelRiskDelta || 0), 0, 1);
    const gameDays = Math.max(1, Math.ceil(Number(plan.distance || 0) / effectiveSpeed));
    return { ...plan, baseSpeed, speed: effectiveSpeed, partySize, partyWeight, gameDays, eventRolls: gameDays, risk, modifiers, weights };
  }

  function claimOutpost(state, nodeId = state.locationId) {
    const node = mapNode(state, nodeId); if (!node) return { success: false, reason: "Không tìm thấy địa điểm." };
    if (nodeId !== state.locationId) return { success: false, reason: "Ngươi phải đang đứng tại node muốn lập trạm." };
    if (!nodeIsDiscovered(state, nodeId)) return { success: false, reason: "Chưa khám phá địa điểm này." };
    const influence = mapInfluenceSnapshot(state, nodeId); if (influence.ownerFactionId || influence.contested) return { success: false, reason: "Nơi này chưa đủ vô chủ để lập trạm." };
    if (Number(state.inventory?.linh_thach || 0) < 10) return { success: false, reason: "Cần 10 Linh Thạch để lập trạm." };
    removeItem(state, "linh_thach", 10); const id = "player_outpost_" + state.player.id; const outpost = { id, nodeId, ownerType: "player", ownerId: state.player.id, power: 5, createdDay: absoluteDay(state.gameClock), structures: [] };
    ensureMapState(state).outposts[nodeId] = outpost; node.ownerFactionId = id; node.influenceMap[id] = outpost.power; node.fastTravelUnlocked = true; ensureMapState(state).fastTravel[nodeId] = true; invalidateMapInfluence(state, nodeId);
    appendNodeHistory(state, nodeId, { type: "faction_change", summary: "Một trạm mới mang cờ của người chơi được dựng lên." }); return { success: true, outpost };
  }
  function petitionOutpostToFaction(state, nodeId = state.locationId) {
    // Player-facing reasons are normalized by the UTF-8 log boundary.
    const existingOutpost = ensureMapState(state).outposts[nodeId];
    if (existingOutpost && (existingOutpost.ownerType !== "player" || existingOutpost.ownerId !== state.player.id || existingOutpost.donatedToFactionId)) return { success: false, reason: "Trạm này đã được dâng cho thế lực hoặc không còn thuộc quyền ngươi chơi." };
    const outpost = ensureMapState(state).outposts[nodeId]; const factionId = state.guildMembership?.guildId || state.player.tainted?.faction;
    if (!outpost || !factionId) return { success: false, reason: "Cần có trạm của riêng mình và đang phục vụ một thế lực." };
    outpost.donatedToFactionId = factionId; outpost.ownerType = "faction"; outpost.ownerId = factionId; const faction = state.worldSimulation.factionState[factionId]; if (faction) { faction.power = Number(faction.power || 0) + 5; faction.reputationWithPlayer = Number(faction.reputationWithPlayer || 0) + 20; }
    const node = mapNode(state, nodeId); node.ownerFactionId = factionId; invalidateMapInfluence(state, nodeId); appendNodeHistory(state, nodeId, { type: "faction_change", summary: "Trạm được dâng cho thế lực đang phụng sự." }); return { success: true, factionId, outpost };
  }
  function transferMapStructure(state, nodeId, structureId, npcId) {
    const list = ensureMapState(state).structures[nodeId] || []; const structure = list.find((entry) => entry.id === structureId); const npc = state.worldSimulation.npcState?.[npcId];
    if (!structure || structure.status === "dismantled") return { success: false, reason: "Không tìm thấy công trình có thể chuyển chủ." };
    const access = structureNodeAccess(state, nodeId); if (!access.allowed) return { success: false, reason: access.reason };
    if (!npc || npc.status !== "alive" || npc.currentNodeId !== nodeId) return { success: false, reason: "NPC nhận chuyển chủ không ở tại node này." };
    if (structure.ownerType !== "player" || structure.ownerId !== state.player.id) return { success: false, reason: "Ngươi không phải chủ công trình." };
    structure.transferHistory ||= []; structure.transferHistory.push({ from: structure.ownerId, to: npcId, day: absoluteDay(state.gameClock) }); structure.ownerType = "npc"; structure.ownerId = npcId; structure.status = "active"; invalidateMapInfluence(state, nodeId); appendNodeHistory(state, nodeId, { type: "structure_transfer", summary: "Công trình được giao lại cho một người đang trấn giữ nơi này." }); return { success: true, structure: copy(structure) };
  }
  function createTradeRoute(state, fromNodeId, toNodeId) {
    const plan = travelPlan(state, fromNodeId, toNodeId, "walk"), map = ensureMapState(state);
    if (!plan.success || !fromNodeId || !toNodeId || fromNodeId === toNodeId) return { success: false, reason: "Tuyến thương mại chưa đủ hai đầu mối." };
    if (Object.values(map.tradeRoutes).some((route) => route.status === "active" && route.fromNodeId === fromNodeId && route.toNodeId === toNodeId)) return { success: false, reason: "Tuyến thương mại này đã tồn tại." };
    const id = uid(state, "trade"); const route = { id, fromNodeId, toNodeId, distance: Math.max(1, Number(plan.distance || 0)), progress: 0, caravanPosition: { ...(nodeCoordinates(state, fromNodeId) || [0, 0]).reduce((o, v, i) => (o[i === 0 ? "x" : "y"] = v, o), {}) }, status: "active", raids: 0, createdDay: absoluteDay(state.gameClock) };
    map.tradeRoutes[id] = route; history(state, "narr", "Thương lộ được nối giữa hai đầu mối; đoàn xe đầu tiên bắt đầu lên đường."); return { success: true, route };
  }
  function updateTradeRoutes(state, day = absoluteDay(state.gameClock)) {
    Object.values(ensureMapState(state).tradeRoutes).forEach((route) => { if (route.status !== "active") return; const distance = Math.max(1, Number(route.distance || 1)); route.progress = (Number(route.progress || 0) + 1) % distance; const from = nodeCoordinates(state, route.fromNodeId), to = nodeCoordinates(state, route.toNodeId); if (!from || !to) { route.status = "closed"; route.closedDay = day; return; } const ratio = route.progress / distance; route.caravanPosition = { x: from[0] + (to[0] - from[0]) * ratio, y: from[1] + (to[1] - from[1]) * ratio, day }; }); return Object.values(state.mapState.tradeRoutes);
  }
  function validateTradeRouteState(state) {
    ensure(state); const map = ensureMapState(state), errors = [], pairs = new Set();
    Object.entries(map.tradeRoutes || {}).forEach(([key, route]) => {
      if (!route || route.id !== key) errors.push(key + ":identity");
      if (!route || !D.LOCATIONS?.[route.fromNodeId] || !D.LOCATIONS?.[route.toNodeId] || route.fromNodeId === route.toNodeId) errors.push(key + ":nodes");
      if (!route || !["active", "closed"].includes(route.status)) errors.push(key + ":status");
      if (!route || !Number.isFinite(Number(route.distance)) || Number(route.distance) < 1 || !Number.isFinite(Number(route.progress)) || Number(route.progress) < 0 || Number(route.progress) >= Math.max(1, Number(route.distance))) errors.push(key + ":progress");
      if (!route || !Number.isFinite(Number(route.createdDay))) errors.push(key + ":createdDay");
      const pair = route ? route.fromNodeId + "→" + route.toNodeId : key; if (pairs.has(pair)) errors.push(key + ":duplicate"); pairs.add(pair);
    });
    return { ok: errors.length === 0, errors };
  }
  function wardProtectionAtNode(state, nodeId = state.locationId) {
    const structures = ensureMapState(state).structures[nodeId] || [];
    const wards = structures.filter((structure) => structure?.type === "ward_formation" && !["disabled", "dismantled"].includes(structure.status) && Number(structure.integrity || 0) > 0);
    const effects = wards.reduce((total, ward) => ({
      encounterRisk: Number(total.encounterRisk || 0) + Number(ward.effects?.encounterRisk || 0),
      curseRisk: Number(total.curseRisk || 0) + Number(ward.effects?.curseRisk || 0),
      influence: Number(total.influence || 0) + Number(ward.effects?.influence || 0), sanDrainReduction: Number(total.sanDrainReduction || 0) + Number(ward.effects?.sanDrainReduction || 0)
    }), { encounterRisk: 0, curseRisk: 0, influence: 0, sanDrainReduction: 0 });
    return { active: wards.length > 0, count: wards.length, corruptionReduction: wards.length ? Math.min(0.5, Math.abs(effects.curseRisk)) : 0, sanDrainReduction: clamp(effects.sanDrainReduction, 0, 0.75), ...effects };
  }
  function repairInvalidMapExits(state) {
    ensure(state); const mapState = ensureMapState(state); const removed = [];
    Object.entries(D.LOCATIONS || {}).forEach(([nodeId, node]) => Object.entries(node?.exits || {}).forEach(([direction, targetId]) => {
      if (!targetId || D.LOCATIONS[targetId]) return;
      const record = { nodeId, direction, targetId, day: absoluteDay(state.gameClock) };
      if (!mapState.invalidExits.some((entry) => entry.nodeId === nodeId && entry.direction === direction && entry.targetId === targetId)) mapState.invalidExits.push(record);
      if (state.openWorld?.exits?.[nodeId]?.[direction] === targetId) delete state.openWorld.exits[nodeId][direction];
      removed.push(record);
    }));
    mapState.invalidExits = mapState.invalidExits.slice(-200);
    return { success: true, removed, invalidExits: copy(mapState.invalidExits) };
  }
  function resolveNpcWeatherReaction(state, npcId, weather) { const raw = typeof weather === "string" ? weather : (weather?.weather || "quang"); const result = resolveNpcWorldReaction(state, npcId, typeof weather === "string" ? { weather } : (weather || {})); if (result.success) { const npc = state.worldSimulation.npcState[npcId]; result.data = { scheduleStatus: ["am_vu", "mua", "tuyet", "loi_vu"].includes(raw) ? "sheltering" : "active", weatherState: { mode: npc.recentWorldReaction || "active" } }; } return result; }
  function performPathRitualStep(state, pathId, realmOrStep, maybeStep) {
    ensure(state); const realmId = maybeStep ? realmOrStep : null; const step = maybeStep || realmOrStep;
    state.pathRitualState ||= { paths: {} }; state.pathRitualState.paths[pathId] ||= { milestones: {} };
    const milestoneId = realmId || step;
    const record = state.pathRitualState.paths[pathId].milestones[milestoneId] ||= { failureLog: [] };
    const expectedRealm = D.REALMS?.find((realm) => Number(realm.level) === Number(E.cultivationTier(state) + 1))?.id || null;
    if (pathId !== state.player.pathId || (realmId && realmId !== state.player.realmId)) {
      record.failureLog.push({ day: absoluteDay(state.gameClock), reason: pathId !== state.player.pathId ? "path mismatch" : "realm mismatch" });
      return { success: false, reason: pathId !== state.player.pathId ? "Con Đường chưa được chọn." : "Cảnh giới của nghi thức chưa khớp." };
    }
    return E.performBreakthroughRitualStep(state, step) || { success: false, reason: "Bước nghi thức chưa sẵn sàng." };
  }
  function pathRitualStatus(state) { ensure(state); return state.pathRitualState || { paths: {} }; }
  function resolveOfflineNpcEncounters(state, day) { ensure(state); state.worldSimulation.offlineEncounterResults ||= []; const seen = new Set(state.worldSimulation.offlineEncounterResults.map((entry) => entry.key)); Object.values(state.worldSimulation.npcEncounters || {}).filter((e) => Number(e.day) <= Number(day) && !seen.has(e.key)).forEach((e) => { state.worldSimulation.offlineEncounterResults.push({ ...e, resolvedDay: day }); seen.add(e.key); }); if (state.worldSimulation.offlineEncounterResults.length > 100) state.worldSimulation.offlineEncounterResults.splice(0, state.worldSimulation.offlineEncounterResults.length - 100); return state.worldSimulation.offlineEncounterResults; }
  function rehydrateUnknownContent(state) { ensure(state); const hydrated = { items: [], events: [], evolutionBranches: [] }; const unknown = state.unknownContent || {}; Object.entries(unknown.items || {}).forEach(([id, item]) => { if (item.status === "dormant" && D.ITEMS?.[id]) { addItem(state, id, item.quantity); item.status = "ready"; hydrated.items.push(id); } }); return hydrated; }
  function acceptNpcQuest(state, questId) {
    ensure(state); const quest = state.questState?.available?.[questId];
    if (!quest || quest.status !== "available" || Number(quest.expiresDay) < absoluteDay(state.gameClock)) return { success: false, reason: "Nhiệm vụ không còn tồn tại." };
    const npc = state.worldSimulation.npcState?.[quest.giverNpcId];
    if (!npc || npc.status !== "alive" || npc.currentNodeId !== state.locationId || (npc.currentSubLocationId && npc.currentSubLocationId !== state.currentSubLocationId)) return { success: false, reason: "Người giao nhiệm vụ không ở đây." };
    quest.status = "active"; quest.acceptedDay = absoluteDay(state.gameClock); state.questState.active ||= {}; state.questState.active[questId] = quest; delete state.questState.available[questId];
    history(state, "narr", "Người giao nhiệm vụ trao cho ngươi một lời nhờ cậy; khế ước " + quest.title + " bắt đầu từ hôm nay.");
    return { success: true, quest };
  }

  function validateNpcQuestState(state) {
    ensure(state);
    const errors = [], buckets = { available: "available", active: "active", completed: "completed", failed: "failed" }, seen = new Set();
    Object.entries(buckets).forEach(([bucket, expected]) => Object.entries(state.questState?.[bucket] || {}).forEach(([key, quest]) => {
      if (!quest || quest.id !== key) errors.push(bucket + ":" + key + ":identity");
      if (!quest || quest.status !== expected) errors.push(bucket + ":" + key + ":status");
      const isNpcQuest = Boolean(quest?.giverNpcId || String(key).startsWith("npc_quest_"));
      if (isNpcQuest && quest?.giverNpcId && !state.worldSimulation.npcState?.[quest.giverNpcId]) errors.push(bucket + ":" + key + ":giver");
      if (isNpcQuest && quest && !Number.isFinite(Number(quest.expiresDay))) errors.push(bucket + ":" + key + ":expiry");
      if (seen.has(key)) errors.push(key + ":duplicated");
      seen.add(key);
    }));
    const dialoguePhase = state.dialogueState?.phase;
    if (dialoguePhase && !["CHECK", "OFFER", "PROGRESS", "TURN_IN"].includes(dialoguePhase)) errors.push("dialogue:phase");
    if (state.dialogueState?.history && !Array.isArray(state.dialogueState.history)) errors.push("dialogue:history");
    return { ok: errors.length === 0, errors };
  }

  function updateFactionInternalEvents(state, day) {
    if (day % 30 !== 0) return;
    if (state.guildMembership && !state.organizationState?.loyaltyTests?.[state.guildMembership.guildId]?.active && seeded(state, "loyalty-test:" + state.guildMembership.guildId, day) < 0.06) resolveLoyaltyTest(state, state.guildMembership.guildId, "start");
    Object.values(state.worldSimulation.factionState).forEach((faction, index) => {
      const elders = Object.values(state.worldSimulation.npcState || {}).filter((npc) => npc.status === "alive" && npc.factionId === faction.factionId && /trưởng lão|chưởng môn|leader|elder/i.test(String(npc.role || "")) && Number(npc.maxLifespan || 999) - Number(npc.age || 0) <= 5);
      if (elders.length && !faction.successionCrisis) {
        faction.successionCrisis = { status: "active", startedDay: day, candidates: elders.slice(0, 2).map((npc) => npc.npcId), tensionScore: 50, outcome: null };
        history(state, "warn", "Trong nội viện, những lời bàn về người kế vị bắt đầu chia rẽ các trưởng lão.");
      }
      if (day - Number(faction.lastInternalEventDay || 0) < 30) return;
      const roll = seeded(state, "faction-internal:" + faction.factionId, day, index);
      if (roll < 0.15) { faction.resources = clamp(faction.resources - 8, 0, 200); faction.stability = clamp(faction.stability - 5, 0, 100); faction.lastInternalEvent = "suy_tan"; }
      else if (roll > 0.88) { faction.resources = clamp(faction.resources + 8, 0, 200); faction.stability = clamp(faction.stability + 5, 0, 100); faction.lastInternalEvent = "troi_day"; }
      else return;
      faction.lastInternalEventDay = day;
      discover(state, "factions", faction.factionId, "world_tick");
    });
  }

  function resolveNpcSuccession(state, npc, day) {
    npc.status = "deceased"; npc.deathDay = day; npc.aiState = "idle";
    const students = Object.values(state.worldSimulation.npcState || {}).filter((candidate) => candidate.status === "alive" && (candidate.masterNpcId === npc.npcId || candidate.relationshipsWithNpcs?.[npc.npcId]?.type === "su_do"));
    const successor = students.sort((a, b) => Number(b.relationshipsWithNpcs?.[npc.npcId]?.score || 0) - Number(a.relationshipsWithNpcs?.[npc.npcId]?.score || 0))[0];
    if (successor) { successor.successorOf = npc.npcId; successor.inheritedRole = npc.role || null; successor.currentSubLocationId = npc.currentSubLocationId; }
    state.worldSimulation.vacantRoles ||= {};
    if (!successor && npc.role) state.worldSimulation.vacantRoles[npc.npcId] = { role: npc.role, nodeId: npc.currentNodeId, factionId: npc.factionId || null, vacantDay: day, status: "vacant" };
    appendNodeHistory(state, npc.currentNodeId, { type: "actor", actorId: npc.npcId, summary: (npc.name || "Một vị tu sĩ") + " viên tịch; " + (successor ? "một đệ tử tiếp nhận một phần chức trách." : "chức trách để lại đang bỏ trống."), key: "npc-death:" + npc.npcId });
    if (npc.currentNodeId === state.locationId) history(state, "narr", (npc.name || "Vị tu sĩ ấy") + " khép lại một đời tu hành; người kế vị mang một phong thái hoàn toàn khác.");
  }

  function updateTournament(state, day) {
    const tournament = state.worldSimulation.tournament;
    if ((!tournament || tournament.status === "closed") && day % 120 === 0) {
      state.worldSimulation.tournament = { id: "tournament_" + day, startDay: day, endDay: day + 10, status: "open", roundsWon: 0, joined: false };
      history(state, "narr", "Trống hội vang lên; Tông Môn Đại Hội lại mở cửa trong mười ngày.");
    } else if (tournament?.status === "open" && day > tournament.endDay) tournament.status = "closed";
  }

  function joinTournament(state) {
    ensure(state); const tournament = state.worldSimulation.tournament;
    if (!state.guildMembership) return { success: false, reason: "Cần là đệ tử tông môn." };
    if (!tournament || tournament.status !== "open") return { success: false, reason: "Đại Hội chưa mở." };
    if (tournament.joined) return { success: false, reason: "Đã tham dự Đại Hội." };
    tournament.joined = true;
    const wins = Math.floor(seeded(state, "tournament:" + tournament.id, absoluteDay(state.gameClock), state.player.basePhy + state.player.baseMag) * 4);
    tournament.roundsWon = wins; grantCanonicalReward(state, "tournament:" + tournament.id, { exp: wins * 20 }, "tournament:" + tournament.id); state.guildMembership.contribution += wins * 10;
    history(state, "narr", "Giữa tiếng reo hò của các tông môn, ngươi thắng " + wins + "/3 vòng Đại Hội."); return { success: true, wins };
  }

  function updateAuction(state, day) {
    Object.values(state.auction?.lots || {}).forEach((lot, index) => {
      if (lot.status !== "active") return;
      if (day <= lot.endDay && lot.bidderId === state.player.id && seeded(state, "npc-bid:" + lot.id, day, index) < 0.3) {
        const npcBid = lot.currentBid + 1 + Math.floor(seeded(state, "npc-bid-value:" + lot.id, day, index) * 5);
        addItem(state, "linh_thach", lot.currentBid);
        lot.currentBid = npcBid; lot.bidderId = "npc";
        history(state, "narr", "Trong phiên đấu giá, một người khác nâng giá lên " + npcBid + " Linh Thạch; số tiền đặt trước của ngươi đã được hoàn lại.");
      }
      if (day > lot.endDay) {
        lot.status = "closed";
        if (lot.bidderId === state.player.id && !lot.delivered) { grantCanonicalReward(state, "auction:" + lot.id, { item: lot.itemId, quantity: 1 }, "auction:" + lot.id); lot.delivered = true; history(state, "narr", "Khi phiên đấu giá khép lại, " + itemName(lot.itemId) + " được trao vào tay ngươi."); }
      }
    });
  }

  function simulateWorldUntil(state, targetDay, options = {}) {
    const startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    ensure(state);
    const previousOfflineFlag = Boolean(state._offlineSimulation);
    if (options.offline) state._offlineSimulation = true;
    const sim = state.worldSimulation;
    const target = Math.max(sim.lastProcessedDay, Math.floor(Number(targetDay || absoluteDay(state.gameClock))));
    const start = sim.lastProcessedDay;
    if (target <= start) { state._offlineSimulation = previousOfflineFlag; state.runtimeMetrics.offline.calls += 1; state.runtimeMetrics.offline.totalMs += (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startedAt; return { processed: 0, mode: "idempotent", detailed: 0, aggregate: 0 }; }
    const detailedWindow = Math.max(1, Number(sim.offlinePolicy?.detailedWindowDays || 30));
    const detailedStart = Math.max(start + 1, target - detailedWindow + 1);
    let aggregate = 0;
    if (detailedStart > start + 1) {
      simulateWorldAggregate(state, start + 1, detailedStart - 1);
      sim.lastProcessedDay = detailedStart - 1;
      aggregate = detailedStart - start - 1;
    }
    for (let day = detailedStart; day <= target; day += 1) tick(state, day);
    sim.lastProcessedDay = target;
    if (options.offline || state._offlineSimulation) {
      Object.values(sim.events).filter((event) => event.status !== "cancelled").forEach((event, index) => {
        const id = "incident_" + event.id;
        sim.localIncidents[id] ||= { id, eventId: event.id, regionId: event.regionId, createdDay: Math.max(start + 1, detailedStart), status: "active" };
      });
    }
    const result = { processed: target - start, detailed: target - detailedStart + 1, aggregate, mode: aggregate ? "aggregate_then_actor_window" : "actor_window" };
    sim.lastOfflineAudit = { ...result, targetDay: target, source: options.offline || state._offlineSimulation ? "offline" : "catch_up" };
    state._offlineSimulation = previousOfflineFlag;
    state.runtimeMetrics.offline.calls += 1; state.runtimeMetrics.offline.totalMs += (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startedAt;
    return result;
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
  function validateExpansionState(state) {
    ensure(state); const errors = [], sim = state.worldSimulation;
    const namespaceAudit = validateCanonicalNamespaces(state);
    if (!namespaceAudit.ok) namespaceAudit.errors.forEach((error) => errors.push("namespace:" + error));
    const actionPriorityAudit = typeof E.validateActionPriorityMatrix === "function" ? E.validateActionPriorityMatrix(state) : { ok: false, issues: ["action-priority-validator-missing"] };
    if (!actionPriorityAudit.ok) actionPriorityAudit.issues.forEach((error) => errors.push("actionPriority:" + error));
    if (!sim || !Number.isFinite(Number(sim.lastProcessedDay))) errors.push("worldSimulation.lastProcessedDay");
    const mapState = ensureMapState(state);
    const mapCanonicalAudit = validateMapCanonicalState(state);
    if (!mapCanonicalAudit.ok) mapCanonicalAudit.errors.forEach((error) => errors.push("mapCanonical:" + error));
    const openWorldAudit = typeof E.validateOpenWorldGrid === "function" ? E.validateOpenWorldGrid(state) : { ok: false, errors: ["open-world-validator-missing"] };
    if (!openWorldAudit.ok) openWorldAudit.errors.forEach((error) => errors.push("openWorldGrid:" + error));
    const tradeRouteAudit = validateTradeRouteState(state);
    if (!tradeRouteAudit.ok) tradeRouteAudit.errors.forEach((error) => errors.push("tradeRoutes:" + error));
    const organizationAudit = validateOrganizationState(state);
    if (!organizationAudit.ok) organizationAudit.errors.forEach((error) => errors.push("organizations:" + error));
    const auctionAudit = validateAuctionState(state);
    if (!auctionAudit.ok) auctionAudit.errors.forEach((error) => errors.push("auction:" + error));
    const contractAudit = validateContractBoardState(state);
    if (!contractAudit.ok) contractAudit.errors.forEach((error) => errors.push("contracts:" + error));
    const worldEventAudit = validateWorldEventState(state);
    if (!worldEventAudit.ok) worldEventAudit.errors.forEach((error) => errors.push("worldEvents:" + error));
    const npcQuestAudit = validateNpcQuestState(state);
    if (!npcQuestAudit.ok) npcQuestAudit.errors.forEach((error) => errors.push("npcQuests:" + error));
    const cacheAudit = validateCacheInvalidationState(state);
    if (!cacheAudit.ok) cacheAudit.errors.forEach((error) => errors.push("cacheInvalidation:" + error));
    const replayAudit = validateReplayEnvelope(state);
    if (!replayAudit.ok) replayAudit.errors.forEach((error) => errors.push("replayEnvelope:" + error));
    const logAudit = typeof E.validateLogSurfaceState === "function" ? E.validateLogSurfaceState(state) : { ok: false, errors: ["log-validator-missing"] };
    if (!logAudit.ok) logAudit.errors.forEach((error) => errors.push("logSurface:" + error));
    if (!Number.isFinite(Number(mapState.influenceRevision)) || Number(mapState.influenceRevision) < 1 || !mapState.influenceCache || typeof mapState.influenceCache !== "object") errors.push("mapInfluenceCache");
    ["mapInfluence", "npcView", "offline"].forEach((metric) => { const value = state.runtimeMetrics?.[metric]; if (!value || !Number.isFinite(Number(value.calls)) || !Number.isFinite(Number(value.totalMs))) errors.push("runtimeMetrics:" + metric); });
    if (!Array.isArray(sim?.scheduledTasks)) errors.push("scheduledTasks");
    if (state.companion) {
      const companion = normalizeCompanion(state.companion);
      if (companion.hp < 0 || companion.hp > companion.hpMax) errors.push("companion.hp");
      if (!Array.isArray(companion.damageLedger)) errors.push("companion.damageLedger");
    }
    const companionAudit = validateCompanionState(state);
    if (!companionAudit.ok) companionAudit.errors.forEach((error) => errors.push("companionState:" + error));
    const prisonerAudit = validatePrisonerState(state);
    if (!prisonerAudit.ok) prisonerAudit.errors.forEach((error) => errors.push("prisonerState:" + error));
    const reincarnationAudit = validateReincarnationRuntimeState(state);
    if (!reincarnationAudit.ok) reincarnationAudit.errors.forEach((error) => errors.push("reincarnation:" + error));
    const techniqueAudit = validateTechniqueRuntimeState(state);
    if (!techniqueAudit.ok) techniqueAudit.errors.forEach((error) => errors.push("techniqueRuntime:" + error));
    const characterAudit = validateCharacterRuntimeState(state);
    if (!characterAudit.ok) characterAudit.errors.forEach((error) => errors.push("characterRuntime:" + error));
    Object.values(sim?.scheduledTasks || []).forEach((task) => { if (!task.id || !Number.isFinite(Number(task.dueDay))) errors.push("scheduledTask:" + String(task.id)); });
    if (!state.rewardLedger || typeof state.rewardLedger !== "object" || Array.isArray(state.rewardLedger)) errors.push("rewardLedger");
    Object.entries(state.rewardLedger || {}).forEach(([key, receipt]) => {
      if (!receipt || receipt.key !== key || !receipt.sourceId || !Number.isFinite(Number(receipt.day))) errors.push("rewardReceipt:" + key + ":identity");
      ["exp", "merit", "quantity", "linhThach", "contribution"].forEach((field) => { if (!Number.isFinite(Number(receipt?.[field] || 0)) || Number(receipt?.[field] || 0) < 0) errors.push("rewardReceipt:" + key + ":" + field); });
      if (!Array.isArray(receipt?.fates) || !Array.isArray(receipt?.techniques) || typeof receipt?.taintedRewards !== "object") errors.push("rewardReceipt:" + key + ":payload");
    });
    Object.values(sim?.regionState || {}).forEach((region) => {
      if (!Number.isFinite(Number(region.weatherSeverity)) || Number(region.weatherSeverity) < 0 || Number(region.weatherSeverity) > 5) errors.push("weatherSeverity");
      if (!Array.isArray(region.weatherHistory) || region.weatherHistory.length > 30) errors.push("weatherHistory");
    });
    Object.values(sim?.npcState || {}).forEach((npc) => {
      if (!Array.isArray(npc.memoryWithPlayer) || npc.memoryWithPlayer.length > 10) errors.push("npcMemory:" + npc.npcId);
      if (!Array.isArray(npc.rumors) || npc.rumors.length > 12) errors.push("npcRumors:" + npc.npcId);
    });
    const actorHistory = actorHistorySnapshot(state);
    Object.values(actorHistory || {}).forEach((entries) => { if (!Array.isArray(entries) || entries.length > 30) errors.push("actorHistory"); });
    const policyAudit = validateDesignPolicies(state);
    if (!policyAudit.ok) policyAudit.errors.forEach((error) => errors.push("designPolicy:" + error));
    const relationshipAudit = validateRelationshipPolicy(state);
    if (!relationshipAudit.ok) relationshipAudit.errors.forEach((error) => errors.push("relationshipPolicy:" + error));
    const relationshipRuntimeAudit = validateRelationshipRuntimeState(state);
    if (!relationshipRuntimeAudit.ok) relationshipRuntimeAudit.errors.forEach((error) => errors.push("relationshipRuntime:" + error));
    const fateActionAudit = typeof E.validateFateAdvancedActionState === "function" ? E.validateFateAdvancedActionState(state.player) : { ok: false, errors: ["fate-action-validator-missing"] };
    if (!fateActionAudit.ok) fateActionAudit.errors.forEach((error) => errors.push("fateAdvancedAction:" + error));
    const fateEffectAudit = typeof E.validateFateEffectComposition === "function" ? E.validateFateEffectComposition(state.player) : { ok: false, errors: ["fate-effect-validator-missing"] };
    if (!fateEffectAudit.ok) fateEffectAudit.errors.forEach((error) => errors.push("fateEffect:" + error));
    const professionAudit = validateProfessionNamespace(state);
    if (!professionAudit.ok) professionAudit.errors.forEach((error) => errors.push("professionNamespace:" + error));
    const discoveryAudit = validateDiscoveryLifecycle(state);
    if (!discoveryAudit.ok) discoveryAudit.errors.forEach((error) => errors.push("discovery:" + error));
    const catalogAudit = validateWorldCatalogs();
    if (!catalogAudit.ok) catalogAudit.errors.forEach((error) => errors.push("catalog:" + error));
    const balanceAudit = validateBalanceCatalog();
    if (!balanceAudit.ok) balanceAudit.errors.forEach((error) => errors.push("balanceCatalog:" + error));
    const physiqueCatalogAudit = validateSpecialPhysiqueCatalog();
    if (!physiqueCatalogAudit.ok) physiqueCatalogAudit.errors.forEach((error) => errors.push("diTheCatalog:" + error));
    const physiqueStateAudit = validateSpecialPhysiqueState(state);
    if (!physiqueStateAudit.ok) physiqueStateAudit.errors.forEach((error) => errors.push("diTheState:" + error));
    const weatherAudit = validateWeatherRuntimeState(state);
    if (!weatherAudit.ok) weatherAudit.errors.forEach((error) => errors.push("weatherRuntime:" + error));
    const structureAudit = validateStructureRuntimeState(state);
    if (!structureAudit.ok) structureAudit.errors.forEach((error) => errors.push("structureRuntime:" + error));
    const guildProjectAudit = validateGuildProjectState(state);
    if (!guildProjectAudit.ok) guildProjectAudit.errors.forEach((error) => errors.push("guildProject:" + error));
    const npcSchedulerAudit = validateNpcScheduler(state);
    if (!npcSchedulerAudit.ok) npcSchedulerAudit.errors.forEach((error) => errors.push("npcScheduler:" + error));
    const rumorAudit = validateRumorPolicy(state);
    if (!rumorAudit.ok) rumorAudit.errors.forEach((error) => errors.push("rumorPolicy:" + error));
    const warAudit = validateWarState(state);
    if (!warAudit.ok) warAudit.errors.forEach((error) => errors.push("warState:" + error));
    const opportunityAudit = validateContestedOpportunity(state);
    if (!opportunityAudit.ok) opportunityAudit.errors.forEach((error) => errors.push("opportunity:" + error));
    const mapEventAudit = E.validateMapEventState?.(state);
    if (mapEventAudit && !mapEventAudit.ok) mapEventAudit.errors.forEach((error) => errors.push("mapEvent:" + error));
    const hiddenRealmAudit = validateHiddenRealmRuntimeState(state);
    if (!hiddenRealmAudit.ok) hiddenRealmAudit.errors.forEach((error) => errors.push("hiddenRealm:" + error));
    const budgetAudit = validatePerformanceBudget(state, { hardwareConcurrency: 4, deviceMemory: 4 });
    if (!budgetAudit.ok) budgetAudit.errors.forEach((error) => errors.push("performanceBudget:" + error));
    const productAudit = validateProductPolicies(state);
    if (!productAudit.ok) productAudit.errors.forEach((error) => errors.push("productPolicy:" + error));
    const nodeHistoryAudit = validateNodeHistory(state);
    if (!nodeHistoryAudit.ok) nodeHistoryAudit.errors.forEach((error) => errors.push("nodeHistory:" + error));
    return { valid: errors.length === 0, errors };
  }
  function simulateWorldAggregate(state, startDay, endDay) {
    ensure(state); if (endDay < startDay) return { processed: 0 };
    const sim = state.worldSimulation;
    Object.values(sim.events).forEach((event) => { while (event.status === "active" && event.phaseEndsDay <= endDay) advanceEvent(state, event, event.phaseEndsDay); });
    processScheduledTasks(state, endDay);
    Object.values(state.contractBoard.accepted).forEach((contract) => { if (contract.status === "accepted" && contract.expiresDay < endDay) contract.status = "expired"; });
    Object.values(state.auction?.lots || {}).forEach((lot) => { if (lot.status === "active" && lot.endDay < endDay) { lot.status = "closed"; if (lot.bidderId === state.player.id && !lot.delivered) { grantCanonicalReward(state, "auction:" + lot.id, { item: lot.itemId, quantity: 1 }, "auction:" + lot.id); lot.delivered = true; } } });
    for (let day = Math.ceil(startDay / 3) * 3, rounds = 0; day <= endDay && rounds < 20 && Object.values(sim.wars).some((war) => war.status === "active"); day += 3, rounds += 1) updateWars(state, day);
    const weeklyDay = endDay - (endDay % 7); if (weeklyDay >= startDay) updateDiplomacy(state, weeklyDay);
    updateHiddenRealms(state, endDay); Object.keys(sim.regionState).forEach((regionId) => updateWeather(state, regionId, endDay)); updateNpcSchedules(state, endDay);
    if (state.guildProject?.status === "active" && endDay > state.guildProject.endDay) state.guildProject.status = "failed";
    return { processed: endDay - startDay + 1 };
  }

  function recordRelationshipEvent(state, npcId, tag, options = {}) {
    ensure(state);
    const uniqueKey = options.uniqueKey || tag + ":" + playerDay(state);
    const events = state.relationshipEvents[npcId] ||= [];
    if (events.some((event) => event.uniqueKey === uniqueKey)) return { success: false, duplicate: true };
    const defaults = {
      talked: { trust: 1, respect: 1, affection: 1 }, sent_gift: { trust: 3, loyalty: 2, affection: 2 }, saved: { trust: 12, respect: 8, loyalty: 10, affection: 4 }, threatened: { fear: 12, suspicion: 8, loyalty: -8, affection: -8 }, kept_promise: { trust: 8, loyalty: 7, affection: 2 }, broke_promise: { trust: -12, suspicion: 12, loyalty: -15, affection: -12 }, shared_reward: { trust: 7, respect: 4, loyalty: 5, affection: 3 }, used_forbidden_art: { fear: 5, suspicion: 10, loyalty: -4, affection: -3 }, supported_faction: { respect: 6, loyalty: 6 }, abandoned: { trust: -8, loyalty: -10, affection: -6 }, disturbed_sleep: { affection: -3, trust: -1, suspicion: 1 }
    };
    const deltas = { ...(defaults[tag] || {}), ...(options.deltas || {}) };
    const relation = state.relationships[npcId] ||= { schemaVersion: 2, trust: 0, fear: 0, respect: 0, suspicion: 0, affection: 0, loyalty: 0, score: 0, decayPolicy: "event_only" };
    relation.affection = clamp(Number(relation.affection || 0), 0, 100);
    Object.entries(deltas).forEach(([key, value]) => { relation[key] = clamp(Number(relation[key] || 0) + Number(value), 0, 100); });
    if (state.worldSimulation.npcState[npcId]?.intimidatedPermanently) { relation.trust = 0; relation.affection = 0; }
    relation.score = Number(relation.trust || 0) + Number(relation.respect || 0) - (Number(relation.fear || 0) + Number(relation.suspicion || 0)) * 0.5;
    const event = { id: uid(state, "relation"), tag, day: playerDay(state), locationId: state.locationId, questId: options.questId || null, outcome: options.outcome || null, deltas, uniqueKey };
    events.push(event); if (events.length > 20) events.shift();
    const npcRuntime = state.worldSimulation.npcState[npcId]; if (npcRuntime) { npcRuntime.memoryWithPlayer.push(event); if (npcRuntime.memoryWithPlayer.length > 10) npcRuntime.memoryWithPlayer.shift(); }
    return { success: true, relation, event };
  }

  function relationshipTier(state, npcId) {
    ensure(state); const r = state.relationships[npcId] || { trust: 0, fear: 0, respect: 0, suspicion: 0, loyalty: 0 };
    const meta = { loyalty: Number(r.loyalty || 0), score: Number(r.score || 0) };
    if (r.suspicion >= 70) return { id: "hostile", label: "Đề Phòng", ...meta };
    if (r.trust >= 60 && r.suspicion < 40) return { id: "trusted", label: "Tín Hữu", ...meta };
    if (r.respect >= 50) return { id: "respected", label: "Kính Trọng", ...meta };
    if (r.fear >= 50) return { id: "afraid", label: "Kính Sợ", ...meta };
    return { id: "known", label: "Sơ Giao", loyalty: Number(r.loyalty || 0), score: Number(r.score || 0) };
  }
  function relationshipBreakdown(state, npcId) {
    ensure(state); const r = state.relationships[npcId] || { trust: 0, fear: 0, respect: 0, suspicion: 0, affection: 0, loyalty: 0, score: 0 };
    return { trust: Number(r.trust || 0), fear: Number(r.fear || 0), respect: Number(r.respect || 0), affection: Number(r.affection || 0), suspicion: Number(r.suspicion || 0), loyalty: Number(r.loyalty || 0), relationshipScore: Number(r.score || 0), decayPolicy: r.decayPolicy || "event_only" };
  }
  const RELATIONSHIP_POLICY = Object.freeze({ dimensions: ["trust", "respect", "affection", "fear", "suspicion", "loyalty"], scoreFormula: "trust+respect-0.5*(fear+suspicion); affection is independent", npcDecay: "event_only", fateDecay: "none" });
  function relationshipPolicySnapshot() { return { ...RELATIONSHIP_POLICY, dimensions: RELATIONSHIP_POLICY.dimensions.slice() }; }
  function validateRelationshipPolicy(state) {
    ensure(state); const errors = [];
    Object.entries(state.relationships || {}).forEach(([npcId, relation]) => {
      RELATIONSHIP_POLICY.dimensions.forEach((key) => { if (!Number.isFinite(Number(relation[key])) || Number(relation[key]) < 0 || Number(relation[key]) > 100) errors.push(npcId + ":" + key); });
      const expected = Number(relation.trust || 0) + Number(relation.respect || 0) - (Number(relation.fear || 0) + Number(relation.suspicion || 0)) * 0.5;
      if (Math.abs(Number(relation.score || 0) - expected) > 0.0001) errors.push(npcId + ":score");
      if ((relation.decayPolicy || "event_only") !== "event_only") errors.push(npcId + ":decayPolicy");
    });
    Object.entries(state.player?.fateRelationships || {}).forEach(([fateId, relation]) => { if ((relation.decayPolicy || "none") !== "none") errors.push("fate:" + fateId + ":decayPolicy"); });
    return { ok: errors.length === 0, policy: relationshipPolicySnapshot(), errors };
  }
  function validateRelationshipRuntimeState(state) {
    ensure(state); const errors = [];
    Object.entries(state.relationshipEvents || {}).forEach(([npcId, events]) => {
      if (!Array.isArray(events) || events.length > 20) { errors.push(npcId + ":events"); return; }
      const keys = new Set();
      events.forEach((event) => {
        if (!event?.id || !event.uniqueKey || keys.has(event.uniqueKey) || !Number.isFinite(Number(event.day))) errors.push(npcId + ":event");
        keys.add(event?.uniqueKey);
        if (!event.deltas || typeof event.deltas !== "object") errors.push(npcId + ":delta");
      });
      const npc = state.worldSimulation?.npcState?.[npcId];
      if (npc && Array.isArray(npc.memoryWithPlayer)) {
        const relationKeys = new Set(events.map((event) => event.uniqueKey));
        npc.memoryWithPlayer.forEach((event) => { if (event?.uniqueKey && !relationKeys.has(event.uniqueKey)) errors.push(npcId + ":memory-orphan"); });
      }
    });
    return { ok: errors.length === 0, errors, npcCount: Object.keys(state.relationshipEvents || {}).length };
  }

  function sendMail(state, npcId, message, itemId = null) {
    ensure(state); const npc = state.worldSimulation.npcState[npcId];
    if (!npc || npc.status !== "alive") return { success: false, reason: "Không thể xác định người nhận." };
    if (itemId && Number(state.inventory?.[itemId] || 0) < 1) return { success: false, reason: "Không có vật phẩm gửi kèm." };
    const cost = 2 + (currentRegion(state) === (D.WORLD_MAP?.locations?.[npc.currentNodeId]?.region || currentRegion(state)) ? 0 : 3);
    if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch truyền thư." };
    removeItem(state, "linh_thach", cost); if (itemId) removeItem(state, itemId, 1);
    const task = { id: uid(state, "mail"), type: "mail", npcId, message: String(message || "Bình an.").slice(0, 120), itemId, dueDay: absoluteDay(state.gameClock) + 1 + (cost > 2 ? 2 : 0), status: "pending" };
    scheduleWorldTask(state, task); history(state, "narr", "Lá thư rời tay theo đường truyền tin; ngươi trả " + cost + " Linh Thạch để gửi lời đến " + (npc.name || npcId) + ".");
    return { success: true, task };
  }

  function discover(state, category, id, source, level = 1) {
    ensure(state); const bucket = state.discoveries[category] ||= {};
    const entry = bucket[id] ||= { firstSeenDay: absoluteDay(state.gameClock), level: 0, status: "discovered", source, clueIds: [], completedSetIds: [] };
    entry.level = Math.max(entry.level, clamp(level, 1, 3)); entry.source ||= source; entry.status ||= "discovered"; return entry;
  }
  function transitionDiscovery(state, category, id, nextStatus, source = "resolver") {
    const entry = discover(state, category, id, source); const order = { discovered: 1, verified: 2, collected: 3, rewarded: 4 };
    if (!order[nextStatus] || order[nextStatus] < order[entry.status || "discovered"]) return { success: false, reason: "Trạng thái khám phá không thể lùi." , entry };
    entry.status = nextStatus; entry[nextStatus + "Day"] ||= absoluteDay(state.gameClock); entry.lastTransitionSource = source; return { success: true, entry };
  }
  function verifyDiscovery(state, category, id, source) { return transitionDiscovery(state, category, id, "verified", source || "verification"); }
  function collectDiscovery(state, category, id, source) { return transitionDiscovery(state, category, id, "collected", source || "collection"); }
  function rewardDiscovery(state, category, id, source) { return transitionDiscovery(state, category, id, "rewarded", source || "reward"); }

  // Canonical read model for the four-step discovery lifecycle. UI and
  // diagnostics must consume this instead of inferring progress from dates.
  function discoveryStatusSummary(state) {
    ensure(state);
    const order = { discovered: 1, verified: 2, collected: 3, rewarded: 4 };
    const byStatus = { discovered: 0, verified: 0, collected: 0, rewarded: 0 };
    const byCategory = {};
    Object.entries(state.discoveries || {}).forEach(([category, bucket]) => {
      byCategory[category] = { total: 0, discovered: 0, verified: 0, collected: 0, rewarded: 0 };
      Object.values(bucket || {}).forEach((entry) => {
        const status = order[entry.status] ? entry.status : "discovered";
        entry.status = status;
        byStatus[status] += 1;
        byCategory[category].total += 1;
        byCategory[category][status] += 1;
      });
    });
    return { total: Object.values(byStatus).reduce((sum, value) => sum + value, 0), byStatus, byCategory };
  }
  function validateDiscoveryLifecycle(state) {
    ensure(state); const errors = [], order = { discovered: 1, verified: 2, collected: 3, rewarded: 4 };
    Object.entries(state.discoveries || {}).forEach(([category, bucket]) => { if (category === "codexClues") return; Object.entries(bucket || {}).forEach(([id, entry]) => {
      if (!entry || entry.id && entry.id !== id || !order[entry.status]) errors.push(category + ":" + id + ":status");
      if (!Number.isFinite(Number(entry.firstSeenDay))) errors.push(category + ":" + id + ":firstSeenDay");
      const days = ["verified", "collected", "rewarded"].map((status) => entry[status + "Day"]).filter((day) => day !== undefined).map(Number);
      if (days.some((day, index) => !Number.isFinite(day) || index > 0 && day < days[index - 1])) errors.push(category + ":" + id + ":transitionDay");
      const highest = order[entry.status]; if (highest >= 2 && entry.verifiedDay === undefined) errors.push(category + ":" + id + ":missingVerifiedDay");
      if (highest >= 3 && entry.collectedDay === undefined) errors.push(category + ":" + id + ":missingCollectedDay");
      if (highest >= 4 && entry.rewardedDay === undefined) errors.push(category + ":" + id + ":missingRewardedDay");
    }); });
    return { ok: errors.length === 0, errors };
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
  function validateProfessionNamespace(state) {
    ensure(state);
    const errors = [], ps = state.professionState || {}, hiddenIds = new Set(Object.keys(X.hiddenProfessions || {}));
    if (ps.primaryId && hiddenIds.has(ps.primaryId)) errors.push("primary-hidden:" + ps.primaryId);
    if (ps.secondaryId && !hiddenIds.has(ps.secondaryId)) errors.push("secondary-not-hidden:" + ps.secondaryId);
    if (ps.primaryId && ps.secondaryId && ps.primaryId === ps.secondaryId) errors.push("duplicate-slot:" + ps.primaryId);
    (ps.hiddenIds || []).forEach((id) => { if (!hiddenIds.has(id)) errors.push("unknown-hidden:" + id); });
    if ((ps.secondaryId || null) !== (state.player.hiddenProfession || null)) errors.push("legacy-alias-drift");
    if (Boolean(ps.selectionLocked) !== Boolean(ps.primaryId)) errors.push("selection-lock");
    Object.entries(ps.professions || {}).forEach(([id, record]) => {
      if (!professionDefinition(id)) errors.push("unknown-record:" + id);
      if (!record || !Number.isFinite(Number(record.masteryExp)) || Number(record.masteryExp) < 0 || !Number.isInteger(Number(record.masteryStage)) || Number(record.masteryStage) < 0 || Number(record.masteryStage) > 3) errors.push("record:" + id);
      if (record && (!Array.isArray(record.recipesKnown) || !Array.isArray(record.specializations))) errors.push("record-shape:" + id);
    });
    Object.entries(state.professionItemState || {}).forEach(([key, record]) => { if (!record || !Number.isFinite(Number(record.charges)) || Number(record.charges) < 0 || !Number.isFinite(Number(record.uses)) || Number(record.uses) < 0) errors.push("item-state:" + key); });
    return { ok: errors.length === 0, primaryId: ps.primaryId || null, secondaryId: ps.secondaryId || null, errors };
  }
  function validateCanonicalNamespaces(state) {
    ensure(state);
    const errors = [], path = state.pathState || {}, profession = state.professionState || {}, physique = state.specialPhysiqueState || {};
    if (Number(path.schemaVersion || 0) < 2) errors.push("path:schemaVersion");
    if (Number(profession.schemaVersion || 0) < 2) errors.push("profession:schemaVersion");
    if (Number(physique.schemaVersion || 0) < 2) errors.push("diThe:schemaVersion");
    if ((path.primaryPathId || null) !== (state.player.pathId || null)) errors.push("path:primaryAlias");
    if ((path.secondaryPathId || null) !== (state.player.secondaryPathId || null)) errors.push("path:secondaryAlias");
    if ((path.hiddenPathId || null) !== (state.player.hiddenPathId || null)) errors.push("path:hiddenAlias");
    if ((profession.hiddenId || null) !== (profession.secondaryId || null)) errors.push("profession:hiddenAlias");
    if ((profession.secondaryId || null) !== (state.player.hiddenProfession || null)) errors.push("profession:legacyAlias");
    if ((physique.activeId || null) !== (state.player.specialPhysique || null)) errors.push("diThe:activeAlias");
    if (profession.primaryId && profession.secondaryId && profession.primaryId === profession.secondaryId) errors.push("profession:duplicate");
    if (path.primaryPathId && path.primaryPathId === path.secondaryPathId) errors.push("path:duplicate");
    return { ok: errors.length === 0, errors, versions: { path: Number(path.schemaVersion || 0), profession: Number(profession.schemaVersion || 0), diThe: Number(physique.schemaVersion || 0) } };
  }
  function hasProfession(state, id) { return state.professionState?.primaryId === id || state.professionState?.secondaryId === id; }
  function professionAvailability(state, id) {
    ensure(state); const definition = professionDefinition(id);
    if (!definition) return { visible: false, selectable: false, reason: "Nghề không tồn tại." };
    const hidden = Boolean(X.hiddenProfessions?.[id]);
    const hasClue = Object.keys(state.hiddenProfessionState.clues || {}).some((key) => key.startsWith(id + ":"));
    if (hidden && !hasClue) return { visible: false, selectable: false, reason: "Con đường này chưa lộ manh mối." };
    if (hidden && !state.professionState.primaryId) return { visible: true, selectable: false, reason: "Phải cố định Nghề chính trước khi mở Nghề Ẩn." };
    if (hidden && !state.hiddenProfessionState.unlocked[id]) return { visible: true, selectable: false, reason: "Chưa hoàn tất đồ thị manh mối nghề ẩn." };
    if (state.professionState.primaryId === id) return { visible: true, selectable: false, selected: true, slot: "primaryId", reason: "Đã cố định làm nghề chính." };
    if (state.professionState.secondaryId === id) return { visible: true, selectable: false, selected: true, slot: "secondaryId", reason: "Đã cố định làm nghề phụ." };
    if (state.professionState.primaryId && !hidden) return { visible: true, selectable: false, reason: "Nghề chính đã khóa; chỉ Nghề Ẩn mở bằng Cổ Tịch Tà Thần mới được chọn làm nghề phụ." };
    if (state.professionState.secondaryId) return { visible: true, selectable: false, reason: "Slot Nghề Ẩn đã được cố định." };
    return { visible: true, selectable: true, slot: state.professionState.primaryId ? "secondaryId" : "primaryId", reason: state.professionState.primaryId ? "Chọn Nghề Ẩn đã mở." : "Chưa chọn nghề chính." };
  }
  function practiceProfession(state, id, options = {}) {
    ensure(state); if (!hasProfession(state, id)) return { success: false, reason: "Chỉ có thể rèn luyện nghề chính hoặc nghề phụ đã cố định." };
    const record = professionRecord(state, id); if (!record) return { success: false, reason: "Nghề không hợp lệ." };
    const internalBypass = options.skipCost === true && options.internal === true;
    if (!internalBypass && Number(state.player.stamina || 0) < 5) return { success: false, reason: "Cần 5 Thể Lực." };
    if (!internalBypass) state.player.stamina -= 5; const gain = state.professionState.primaryId === id ? 12 : 3;
    record.masteryExp += gain; record.masteryStage = record.masteryExp >= 300 ? 3 : record.masteryExp >= 100 ? 2 : record.masteryExp >= 25 ? 1 : 0; record.lastActionDay = playerDay(state);
    history(state, "sys", "§ " + professionDefinition(id).name + " Thục Luyện +" + gain + "."); return { success: true, gain, record };
  }
  function chooseProfessionLocked(state, id) {
    ensure(state);
    const legacyLockedNormalChoice = state.professionState.primaryId && !X.hiddenProfessions?.[id] && id !== state.professionState.primaryId;
    if (legacyLockedNormalChoice) {
      if (state.professionState.legacyNormalChoiceIgnored) return { success: false, compatibilityOnly: true, slot: null, selectionLocked: true, reason: "Luật canonical đã khóa nghề thường." };
      state.professionState.legacyNormalChoiceIgnored = true;
      return { success: true, compatibilityOnly: true, slot: null, selectionLocked: true, reason: "Luật canonical đã khóa nghề thường; lựa chọn cũ không làm thay đổi nghề." };
    }
    const availability = professionAvailability(state, id);
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
    state.professionState.selectionLocked = Boolean(state.professionState.primaryId);
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
    if (playerDay(state) < Number(record.lastUseDay || -999999) + Number(item.cooldownDays || 0)) return { success: false, reason: "Vật phẩm nghề đang hồi phục linh lực." };
    if (Number(record.charges || 0) <= 0) return { success: false, reason: "Vật phẩm nghề đã dùng hết số lần ghi chép." };
    record.uses += 1; record.charges -= 1; record.lastUseDay = playerDay(state);
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
    const recipe = item.recipe ? { materials: { ...item.recipe }, costs: {} } : { materials: {}, costs: {} };
    const recipeCheck = recipeCanCommit(state, recipe);
    if (!recipeCheck.success) return { success: false, reason: recipeCheck.reason + " để bổ sung linh lực." };
    commitRecipeCosts(state, recipe);
    const key = item.action || itemId;
    const record = state.professionItemState[key] || { uses: 0, lastUseDay: -999999, effects: {} };
    record.charges = Number(item.charges || 1);
    state.professionItemState[key] = record;
    history(state, "sys", "§ Đã bổ sung linh lực cho " + item.name + ".");
    return { success: true, itemId, charges: record.charges };
  }
  function useHiddenProfessionAction(state, professionId) {
    ensure(state); const definition = X.hiddenProfessions?.[professionId];
    const legacyDirectHidden = state.professionState.primaryId === professionId && !state.professionState.secondaryId;
    if (!definition || !hasProfession(state, professionId) || (state.professionState.secondaryId !== professionId && !legacyDirectHidden)) return { success: false, reason: "Nghề Ẩn này chưa được cố định ở slot nghề phụ." };
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
    if (definition.kind === "tu_tich") {
      state.hiddenProfessionEffects ||= {};
      const effect = state.hiddenProfessionEffects[professionId] ||= { uses: 0, lastUseDay: -999999, scars: 0 };
      effect.uses += 1; effect.lastUseDay = day;
      if (definition.passive?.dialoguePressure) state.dialogueState ||= { schemaVersion: 1, phase: "CHECK", history: [] }, state.dialogueState.pressure = clamp(Number(state.dialogueState.pressure || 0) + Number(definition.passive.dialoguePressure), 0, 1);
      if (definition.passive?.nodeCorruptionSense) state.flags.tuTichCorruptionSenseUntilDay = day + 3;
      if (definition.passive?.illusionAvoidance) state.flags.tuTichIllusionAvoidanceUntilDay = day + 3;
      if (definition.passive?.memoryRiskReduction) state.flags.tuTichMemoryGuardUntilDay = day + 3;
      if (definition.failPolicy === "false_clue") state.flags.tuTichFalseClueUntilDay = day + 2;
      if (definition.failPolicy === "corruption_scar") effect.scars += 1;
      if (definition.failPolicy === "memory_scar") state.flags.tuTichMemoryScar = Number(state.flags.tuTichMemoryScar || 0) + 1;
    }
    record.uses += 1; record.lastUseDay = day; record.lastResult = definition.actionName; state.hiddenProfessionActions[professionId] = record;
    const mastery = professionRecord(state, professionId); mastery.masteryExp += 12; mastery.masteryStage = mastery.masteryExp >= 300 ? 3 : mastery.masteryExp >= 100 ? 2 : mastery.masteryExp >= 25 ? 1 : 0; mastery.lastActionDay = day;
    history(state, "sys", "✦ Thi triển nghề ẩn: " + definition.actionName + "."); E.updateDerived(state);
    return { success: true, professionId, record };
  }
  function brewPill(state, recipeId = "tu_khi_dan") {
    ensure(state); if (!hasProfession(state, "luyen_dan")) return { success: false, reason: "Cần cố định nghề Luyện Đan Sư." };
    const record = professionRecord(state, "luyen_dan"); if (!record) return { success: false };
    const recipe = recipeDefinition(recipeId);
    if (!recipe) return { success: false, reason: "Công thức luyện đan không tồn tại." };
    const recipeCheck = recipeCanCommit(state, recipe);
    if (!recipeCheck.success) return recipeCheck;
    const toolBonus = Number(state.professionItemState?.ghi_nho_cong_thuc?.effects?.alchemyChance || 0);
    commitRecipeCosts(state, recipe); const chance = clamp(Number(recipe.successBase || 0.45) + state.player.aptitude / 250 + record.masteryStage * 0.08 + toolBonus, 0.1, 0.95);
    const roll = seeded(state, "alchemy:" + state.meta.turn, absoluteDay(state.gameClock));
    practiceProfession(state, "luyen_dan", { skipCost: true, internal: true });
    if (roll > chance) { history(state, "warn", "× Luyện đan thất bại, dược liệu hóa tro."); return { success: false, consumed: true }; }
    const outputId = recipe.output?.itemId && D.ITEMS?.[recipe.output.itemId] ? recipe.output.itemId : "tu_khi_dan";
    const perfect = roll < chance * Number(recipe.perfectMultiplier || 0.15);
    addItem(state, outputId, Number(recipe.output?.quantity || 1) * (perfect ? 2 : 1));
    history(state, "sys", "§ Luyện thành " + itemName(outputId) + (perfect ? " · Hoàn Mỹ" : "") + "."); return { success: true, perfect, recipe: copy(recipe) };
  }

  function placeFormation(state, purpose = "gather") {
    ensure(state); if (!hasProfession(state, "tran_phap")) return { success: false, reason: "Cần cố định nghề Trận Pháp Sư." };
    const known = E.getKnownTechniques(state).find((technique) => technique.category === "tran_phap");
    if (!known) return { success: false, reason: "Chưa biết Công Pháp Trận Pháp." };
    const recipe = recipeDefinition(purpose === "protect" ? "ward_formation" : "gathering_formation");
    const recipeCheck = recipeCanCommit(state, recipe);
    if (!recipeCheck.success) return recipeCheck;
    if (Object.keys(state.placedFormations).length >= 3) return { success: false, reason: "Đã đạt giới hạn ba Trận Pháp." };
    commitRecipeCosts(state, recipe); const id = uid(state, "formation"), day = absoluteDay(state.gameClock);
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
    const success = seeded(state, "physiognomy:" + npcId, playerDay(state), record.masteryExp) < clamp(0.4 + state.player.comprehension / 200, 0.4, 0.9);
    const clue = success ? "Khí tức: " + (npc.element || npc.alignment || npc.entity_type || "khó phân") : "Tướng mạo bị thiên cơ che lấp.";
    state.intel["face:" + npcId] = { id: "face:" + npcId, topicType: "npc", targetId: npcId, claim: clue, confidence: success ? 0.8 : 0.3, sourceId: "tuong_su", acquiredDay: playerDay(state), expiresDay: playerDay(state) + 30, verified: success };
    history(state, "sys", "◇ Xem tướng " + (npc.name || npcId) + ": " + clue); return { success, clue };
  }

  function ensureTechniqueTrials(state) {
    ensure(state);
    Object.entries(state.player.techniques || {}).forEach(([id, progress]) => {
      const choices = X.techniqueEvolutions?.[id];
      if (!choices?.length || Number(progress.masteryStage || 0) < 2 || progress.evolution?.status !== "locked") return;
      progress.evolution = { status: "trial", trialType: choices[0].trial || "cultivation", progress: 0, evolutionId: null, startedDay: playerDay(state) };
      history(state, "sys", "✦ Công Pháp " + (E.getKnownTechniques(state).find((entry) => entry.id === id)?.name || id) + " mở Thí Luyện Tiến Hóa.");
    });
  }
  function validateTechniqueRuntimeState(state) {
    ensure(state); const errors = [], catalog = E.techniqueCatalog?.() || {};
    Object.entries(state.player.techniques || {}).forEach(([id, progress]) => {
      if (!catalog[id]) errors.push(id + ":unknown");
      if (!progress || !Number.isFinite(Number(progress.masteryExp)) || Number(progress.masteryExp) < 0 || !Number.isInteger(Number(progress.masteryStage)) || Number(progress.masteryStage) < 0 || Number(progress.masteryStage) > 4 || !Number.isFinite(Number(progress.usageCount)) || Number(progress.usageCount) < 0) errors.push(id + ":mastery");
      const evolution = progress?.evolution, choices = X.techniqueEvolutions?.[id] || [];
      if (!evolution || !["locked", "trial", "ready", "chosen"].includes(evolution.status)) errors.push(id + ":evolution-status");
      if (evolution && (!Number.isFinite(Number(evolution.progress)) || Number(evolution.progress) < 0)) errors.push(id + ":evolution-progress");
      if (evolution?.status === "chosen" && !choices.some((choice) => choice.id === evolution.evolutionId)) errors.push(id + ":evolution-choice");
    });
    return { ok: errors.length === 0, errors };
  }
  function validateCharacterRuntimeState(state) {
    ensure(state); const player = state.player, errors = [];
    [["hp", "maxHp"], ["qi", "maxQi"], ["san", "maxSan"], ["stamina", "maxStamina"], ["lifespan", "maxLifespan"]].forEach(([value, max]) => {
      if (!Number.isFinite(Number(player?.[value])) || !Number.isFinite(Number(player?.[max])) || Number(player[value]) < 0 || Number(player[max]) < 0 || Number(player[value]) > Number(player[max])) errors.push(value);
    });
    if (!Number.isFinite(Number(player?.corruptionRating)) || Number(player.corruptionRating) < 0 || Number(player.corruptionRating) > 100) errors.push("corruptionRating");
    if (!Number.isFinite(Number(player?.maxSan)) || Number(player.maxSan) < 70) errors.push("maxSan");
    if (!Number.isFinite(Number(player?.maxStamina)) || Number(player.maxStamina) <= 0) errors.push("maxStamina");
    return { ok: errors.length === 0, errors };
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
    progress.evolution.status = "chosen"; progress.evolution.evolutionId = evolutionId; progress.evolution.chosenAtDay = playerDay(state);
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
    const evolution = state.player.fateEvolutions[fateId] = { status: "trial", trialStartedDay: playerDay(state), seed: hash(state.worldSimulation.seed + fateId), candidateBranchIds: candidates.map((entry) => entry.id), branchId: null, evolvedAtDay: null, sourceEnhancementLevel: 5, version: 1 };
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
    const beforeEffects = E.enhancedFateEffects(state.player, fate);
    // Commit promotes the relationship to stage 4 before derived effects are
    // recalculated. Preview must simulate that same post-commit namespace and
    // apply the selected branch exactly once.
    const simulated = {
      ...state.player,
      fateRelationships: { ...(state.player.fateRelationships || {}), [fateId]: { ...(state.player.fateRelationships?.[fateId] || {}), stage: 4 } },
      fateEvolutions: { ...(state.player.fateEvolutions || {}), [fateId]: { ...(state.player.fateEvolutions?.[fateId] || {}), status: "evolved", branchId } }
    };
    const afterEffects = E.enhancedFateEffects(simulated, fate);
    return { success: true, branch: copy(branch), costs: { essence: 5 + 2 * rank, merit: 10 + 5 * rank, san: 10 }, layers: E.fateEffectBreakdown ? E.fateEffectBreakdown(state.player, fate) : null, beforeEffects, afterEffects };
  }
  function evolveFate(state, fateId, branchId, options = {}) {
    ensure(state); const evolution = state.player.fateEvolutions[fateId], preview = fateEvolutionPreview(state, fateId, branchId);
    if (!evolution || evolution.status !== "ready" || !evolution.candidateBranchIds.includes(branchId) || !preview.success) return { success: false, reason: "Mệnh Kiếp chưa sẵn sàng hoặc nhánh không hợp lệ." };
    if (preview.branch.dangerous && !options.confirmed) return { success: false, requiresConfirmation: true, reason: "Nghịch Diễn cần xác nhận phản phệ." };
    if (Number(state.fateExcessEssence || 0) < preview.costs.essence || Number(state.player.merit || 0) < preview.costs.merit || Number(state.player.san || 0) < preview.costs.san) return { success: false, reason: "Không đủ Mệnh Tinh Hoa, Công Đức hoặc Thanh Tỉnh.", costs: preview.costs };
    state.fateExcessEssence -= preview.costs.essence; state.player.merit -= preview.costs.merit; state.player.san -= preview.costs.san;
    evolution.status = "evolved"; evolution.branchId = branchId; evolution.evolvedAtDay = playerDay(state);
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
    if (!["persuade", "threaten", "dark"].includes(method)) return { success: false, reason: "Phương pháp thẩm vấn không hợp lệ." };
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
    state.companion = normalizeCompanion({ entityId: prisoner.entityId, customName: entity?.name || prisoner.entityId, bondedDay: absoluteDay(state.gameClock), loyalty: 50, element: entity?.element || "vo_he", originRegionId: currentRegion(state), corruption: 0, passiveId: "scout", role: "scout", guardStance: "balanced", state: "active", lastScoutDay: 0, hpMax: 30, hp: 30 });
    prisoner.status = "tamed"; prisoner.tamedDay = absoluteDay(state.gameClock); registerCollection(state, "beasts", prisoner.entityId, entity?.rarity || "hiếm"); history(state, "narr", "Dị Thú hạ đầu trước huyết khế; từ nay nó bước cùng ngươi qua những vùng đất chưa biết."); return { success: true, companion: state.companion };
  }
  function scoutWithCompanion(state) {
    ensure(state); if (!state.companion || state.companion.state !== "active") return { success: false, reason: "Không có Dị Thú trinh sát." };
    const day = absoluteDay(state.gameClock); if (state.companion.lastScoutDay === day) return { success: false, reason: "Hôm nay Dị Thú đã trinh sát." };
    state.companion.lastScoutDay = day; state.companion.loyalty = clamp(state.companion.loyalty + 1, 0, 100);
    grantCanonicalReward(state, "companion-scout:" + state.companion.entityId + ":" + day, { linhThach: 1 }, "companion-scout:" + state.companion.entityId + ":" + day); history(state, "sys", "◇ " + state.companion.customName + " trinh sát và mang về một Linh Thạch."); return { success: true };
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
    const template = (X.guildProjects || []).find((entry) => entry.id === templateId), day = absoluteDay(state.gameClock);
    if (!template) return { success: false, reason: "Không có bản thiết kế công trình hợp lệ." };
    if (state.guildProject && state.guildProject.status !== "active") state.guildProjectHistory.unshift(copy(state.guildProject));
    state.guildProjectHistory = state.guildProjectHistory.slice(0, 5);
    state.guildProject = { id: uid(state, "project"), guildId: state.guildMembership.guildId, templateId: template.id, startDay: day, endDay: day + template.durationDays, progress: 0, playerContributions: {}, milestones: [], status: "active" };
    history(state, "narr", "Trong sân tông môn, bản thiết kế " + template.name + " được mở ra; công trình chính thức khởi công."); return { success: true, project: state.guildProject };
  }
  function contributeGuildProject(state, amount = 1) {
    ensure(state); const project = state.guildProject, template = project && (X.guildProjects || []).find((entry) => entry.id === project.templateId);
    if (!project || project.status !== "active" || !template) return { success: false, reason: "Không có công trình đang hoạt động." };
    if (!state.guildMembership || state.guildMembership.guildId !== project.guildId) return { success: false, reason: "Dự án bị đình chỉ vì ngươi không còn thuộc tông môn khởi công." };
    const cost = clamp(Math.floor(Number(amount || 0)), 1, 10); if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch." };
    removeItem(state, "linh_thach", cost); project.progress += cost; project.playerContributions.linh_thach = Number(project.playerContributions.linh_thach || 0) + cost;
    if (project.progress >= template.target) { project.status = "completed"; project.completedDay = absoluteDay(state.gameClock); project.rewardUntilDay = absoluteDay(state.gameClock) + Number(template.reward?.durationDays || 0); history(state, "narr", "Tiếng chuông ngân qua sơn môn; công trình " + template.name + " đã hoàn thành."); }
    return { success: true, project };
  }

  function hiddenRealmEnter(state, realmId) {
    ensure(state); const definition = (X.hiddenRealms || []).find((entry) => entry.id === realmId), runtime = state.worldSimulation.hiddenRealms[realmId];
    if (state.activeHiddenRealm) return { success: false, reason: "Ngươi vẫn đang ở trong một Bí Cảnh khác." };
    if (!definition || runtime?.status !== "open" || state.locationId !== definition.parentNodeId) return { success: false, reason: "Cổng Bí Cảnh chưa mở tại đây." };
    const nodes = rebuildHiddenRealmNodes(state, realmId, runtime.cycleIndex);
    state.activeHiddenRealm = { realmId, cycleIndex: runtime.cycleIndex, parentNodeId: definition.parentNodeId, entryNodeId: nodes.entry, coreNodeId: nodes.core };
    state.locationId = nodes.entry; state.visitedLocations ||= []; if (!state.visitedLocations.includes(nodes.entry)) state.visitedLocations.push(nodes.entry);
    discover(state, "hiddenRealms", realmId, "entered", 1); history(state, "narr", "Cánh cổng " + definition.name + " khép lại sau lưng; lối thoát vẫn neo tại điểm xuất phát."); return { success: true, locationId: nodes.entry };
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
    const day = absoluteDay(state.gameClock);
    if (!active || !definition || !runtime || state.locationId !== active.coreNodeId || runtime.status !== "open" || Number(runtime.cycleIndex) !== Number(active.cycleIndex) || day > Number(runtime.closesDay)) return false;
    const rewardKey = active.cycleIndex + ":main"; if (runtime.claimedRewardKeys.includes(rewardKey) || runtime.status !== "open") return false;
    const granted = grantCanonicalReward(state, "hidden_realm:" + active.realmId, definition.reward, rewardKey); if (!granted.success) return false; runtime.claimedRewardKeys.push(rewardKey); collectDiscovery(state, "hiddenRealms", active.realmId, "core"); rewardDiscovery(state, "hiddenRealms", active.realmId, "hidden_realm_reward"); discover(state, "hiddenRealms", active.realmId, "core", 2);
    history(state, "narr", "Ở tận lõi " + definition.name + ", ngươi chạm tay vào phần thưởng: Tu vi +" + definition.reward.exp + ", Công Đức +" + definition.reward.merit + "."); return true;
  }
  function exitHiddenRealm(state) {
    ensure(state); const active = state.activeHiddenRealm; if (!active) return { success: false, reason: "Không ở trong Bí Cảnh." };
    state.locationId = D.LOCATIONS[active.parentNodeId] ? active.parentNodeId : (state.homeLocationId || Object.keys(D.LOCATIONS)[0]); state.activeHiddenRealm = null;
    history(state, "narr", "Ngươi bước ra khỏi Bí Cảnh; gió ngoài thế giới lại tìm thấy vạt áo."); return { success: true, locationId: state.locationId };
  }

  function validateReincarnationRuntimeState(state) {
    ensure(state); const errors = [], legacy = state.reincarnationLegacy;
    if (!legacy || !Number.isInteger(Number(legacy.generation)) || Number(legacy.generation) < 1) errors.push("generation");
    const lifeIds = new Set(); (legacy?.previousLives || []).forEach((life) => { if (!life?.id || lifeIds.has(life.id) || !Number.isFinite(Number(life.deathDay))) errors.push("life"); lifeIds.add(life?.id); });
    const tombIds = new Set(); (legacy?.tombs || []).forEach((tomb) => { if (!tomb?.id || tombIds.has(tomb.id) || !tomb.lifeId || typeof tomb.visited !== "boolean") errors.push("tomb"); tombIds.add(tomb?.id); });
    const allowedChoices = new Set(["technique_memory", "fate_affinity", "human_debt"]);
    if (!Array.isArray(legacy?.pendingChoices) || legacy.pendingChoices.some((id) => !allowedChoices.has(id))) errors.push("pendingChoices");
    const trib = state.pendingTribulation;
    if (trib) {
      if (!Number.isFinite(Number(trib.targetRealmLevel)) || !["pending", "resolved"].includes(trib.status) || !Array.isArray(trib.options)) errors.push("tribulation");
      if (trib.status === "resolved" && !trib.chosenId) errors.push("tribulation:choice");
    }
    return { ok: errors.length === 0, errors };
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
    history(state, "narr", "Trước tầng mây kiếp, ngươi chọn " + option.label + "; một con đường sống được mở ra."); return { success: true, tribulation: trib };
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
    if (id === "human_debt") grantCanonicalReward(state, "legacy:" + id, { merit: 5 }, "legacy:" + id + ":" + Number(state.reincarnationLegacy.generation || 0));
    const labels = { technique_memory: "Ký Ức Công Pháp", fate_affinity: "Dư Âm Mệnh Số", human_debt: "Nhân Duyên Tiền Kiếp" };
    history(state, "narr", "Từ lớp bụi tiền kiếp, ngươi nhận lấy " + (labels[id] || "Di sản đã định") + "."); return { success: true };
  }
  function visitTomb(state) {
    ensure(state); const tomb = state.reincarnationLegacy.tombs.find((entry) => entry.locationId === state.locationId && !entry.visited); if (!tomb) return { success: false, reason: "Không có mộ phần chưa bái tế tại đây." };
    tomb.visited = true; grantCanonicalReward(state, "tomb:" + tomb.id, { merit: 2 }, "tomb:" + tomb.id); history(state, "narr", "Trước mộ phần tiền kiếp, ngươi cúi đầu; Công Đức +2 và một mảnh ký ức trở về."); return { success: true };
  }

  function expansionActions(state) {
    ensure(state); const actions = [], combat = E.aliveEnemies(state).length > 0, day = absoluteDay(state.gameClock);
    if (!combat && state.pendingNpcPursuit?.status === "pending") {
      actions.push({ id: "act_exp_pursuit_fight", label: "Đối Mặt Chấp Pháp Truy Đồ", aliases: ["đối mặt truy sát"], priority: 0, category: "encounter", blocking: true });
      actions.push({ id: "act_exp_pursuit_escape", label: "Thoát Khỏi Vòng Vây", aliases: ["trốn truy sát"], priority: 0, category: "encounter", blocking: true });
      actions.push({ id: "act_exp_pursuit_appease", label: "Nộp 20 Công Đức Chuộc Lỗi", aliases: ["chuộc lỗi truy sát"], priority: 0, category: "encounter", blocking: true });
    }
    if (!combat && state.pendingMapEvent?.status === "pending") actions.push({ id: "act_exp_map_event", label: "Ứng Biến Phát Hiện", aliases: ["ứng biến phát hiện", "ung bien phat hien"], priority: 0, category: "discovery", blocking: true });
      if (!combat && state.pendingContestedOpportunity?.status === "pending") actions.push({ id: "act_exp_opportunity", label: "Ứng Biến Cơ Duyên", aliases: ["ứng biến cơ duyên", "ung bien co duyen"], priority: 0, category: "opportunity", blocking: true });
    const event = activeRegionEvent(state); const template = event && worldEventTemplate(event.templateId);
    if (!combat && event && template?.phases?.[event.phaseIndex]?.id === "active") template.choices.filter((choice) => !event.choiceHistory.some((entry) => entry.choiceId === choice.id)).forEach((choice) => actions.push({ id: "act_exp_world_" + event.id + "_" + choice.id, label: choice.label, aliases: [choice.label], priority: 1, category: "interaction" }));
    if (!combat) {
      Object.entries(state.npcTrustTrials || {}).filter(([npcId, trial]) => trial.status === "active" && day >= trial.startedDay + 1 && state.locationId === trial.targetNodeId && state.worldSimulation.npcState[npcId]?.currentNodeId === state.locationId).forEach(([npcId]) => actions.push({ id: "act_exp_npc_trial_resolve_" + npcId, label: "Hoàn Thành Thử Thách Lòng Tin", aliases: ["hoàn thành thử thách"], priority: 1, category: "interaction" }));
      const organizationId = D.LOCATIONS?.[state.locationId]?.organizationId;
      if (organizationId) {
        const organization = organizationDefinitions().find((entry) => entry.id === organizationId);
        if (organization) {
          actions.push({ id: "act_exp_org_status_" + organizationId, label: "Xem quan hệ " + organization.name, aliases: ["quan hệ tổ chức", "organization status"], priority: 1, category: "interaction" });
          actions.push({ id: "act_exp_org_donate_" + organizationId, label: "Quyên trợ tổ chức", aliases: ["quyên trợ", "donate organization"], priority: 1, category: "interaction" });
          actions.push({ id: "act_exp_org_commission_" + organizationId, label: "Nhận Ủy Thác Thường", aliases: ["ủy thác thường", "ủy thác tổ chức"], priority: 1, category: "interaction" });
          const relation = ensureOrganizationState(state).relations[organizationId], month = Math.floor((day - 1) / 30) + 1;
          if (Number(state.organizationState.specialCommissions?.[organizationId + ":" + month] || 0) < 2) actions.push({ id: "act_exp_org_special_commission_" + organizationId, label: "Nhận Ủy Thác Đặc Biệt", aliases: ["ủy thác đặc biệt"], priority: 1, category: "interaction" });
          const inWar = Object.values(state.worldSimulation.wars || {}).some((war) => war.status === "active" && (war.factionA === organizationId || war.factionB === organizationId));
          if (inWar && organization.organizationKind === "faction") actions.push({ id: "act_exp_org_life_commission_" + organizationId, label: "Nhận Ủy Thác Sinh Tử", aliases: ["ủy thác sinh tử"], priority: 1, category: "interaction" });
          if (state.guildMembership?.guildId === organizationId) {
            const vault = guildVaultSnapshot(state, organizationId);
            if (vault.unlocked) {
              actions.push({ id: "act_exp_org_vault_" + organizationId, label: "Tra Cứu Kho Bí Pháp", aliases: ["kho bí pháp", "tàng kinh các"], priority: 1, category: "interaction" });
              vault.techniques.filter((technique) => !technique.learned).forEach((technique) => actions.push({ id: "act_exp_org_study:" + technique.id, label: "Thỉnh Học · " + technique.name, aliases: ["thỉnh học bí pháp"], priority: 1, category: "interaction" }));
            }
            const promotion = guildPromotionStatus(state);
            if (promotion.next) actions.push({ id: "act_exp_org_promote_" + organizationId, label: promotion.missing?.includes("khảo hạch nội môn") ? "Tham Gia Khảo Hạch · " + promotion.next.label : promotion.eligible ? "Thăng Cấp · " + promotion.next.label : "Điều Kiện Thăng Cấp", aliases: ["thăng cấp nội môn", "khảo hạch"], disabled_reason: promotion.eligible || promotion.missing?.every((item) => item === "khảo hạch nội môn") ? null : promotion.reason, priority: 1, category: "interaction" });
            actions.push({ id: "act_exp_org_defect_" + organizationId, label: state.guildMembership.defectionPending ? "Xác Nhận Rời Tổ Chức" : "Cân Nhắc Rời Tổ Chức", aliases: ["rời tổ chức", "phản bội tổ chức"], priority: 1, category: "interaction" });
            const crisis = state.worldSimulation.factionState?.[organizationId]?.successionCrisis;
            if (crisis?.status === "active" && memberRankIndex(state.guildMembership) >= 3) crisis.candidates.forEach((candidateId) => actions.push({ id: "act_exp_org_politics:" + organizationId + ":" + candidateId, label: "Ủng Hộ Phe · " + (state.worldSimulation.npcState[candidateId]?.name || candidateId), aliases: ["ủng hộ phe kế vị"], priority: 1, category: "interaction" }));
            Object.values(state.worldSimulation.factionState || {}).filter((faction) => faction.factionId !== organizationId && Number(faction.playerReputation || 0) >= 20 && (Number(state.worldSimulation.diplomacy?.[pairKey(organizationId, faction.factionId)]?.tensionScore ?? state.worldSimulation.diplomacy?.[pairKey(organizationId, faction.factionId)]?.tension ?? 0) >= 50 || Object.values(state.worldSimulation.wars || {}).some((war) => war.status === "active" && pairKey(war.factionA, war.factionB) === pairKey(organizationId, faction.factionId)))).forEach((faction) => actions.push({ id: "act_exp_org_mediation:" + organizationId + ":" + faction.factionId, label: "Hòa Giải · " + faction.name, aliases: ["hòa giải tổ chức"], priority: 1, category: "interaction" }));
          }
          if (state.guildMembership?.guildId === organizationId) {
            const test = state.organizationState.loyaltyTests?.[organizationId];
            if (!test?.active) actions.push({ id: "act_exp_org_loyalty_" + organizationId, label: "Tiếp Nhận Mật Lệnh Trung Thành", aliases: ["mật lệnh trung thành"], priority: 1, category: "interaction" });
            else if (!test.investigated) actions.push({ id: "act_exp_org_loyalty_investigate:" + organizationId, label: "Điều Tra Làng Bị Nghi Ngờ", aliases: ["điều tra mật lệnh"], priority: 1, category: "interaction" });
            else { actions.push({ id: "act_exp_org_loyalty_decision:" + organizationId + ":spare", label: "Từ Chối Kết Tội Khi Thiếu Chứng Cứ", aliases: ["tha làng"], priority: 1, category: "interaction" }); actions.push({ id: "act_exp_org_loyalty_decision:" + organizationId + ":attack", label: "Tuân Lệnh Tấn Công", aliases: ["tấn công làng"], priority: 1, category: "interaction" }); }
          }
          Object.values(state.organizationState.activeRequests || {}).filter((request) => request.organizationId === organizationId && request.status === "ready").forEach((request) => actions.push({ id: "act_exp_org_turnin_" + request.id, label: "Giao Ủy Thác · " + request.tier, aliases: ["giao ủy thác"], priority: 1, category: "interaction" }));
        }
      }
      ensureNpcWorldState(state);
      const localNpcIds = new Set(D.LOCATIONS?.[state.locationId]?.npcs || []);
      Object.values(state.worldSimulation.npcState).filter((npc) => npc.status === "alive" && npc.currentNodeId === state.locationId && npc.currentSubLocationId === state.currentSubLocationId).slice(0, 8).forEach((npc) => {
        syncNpcRoutine(state, npc); const npcName = npc.name || npc.npcId;
        actions.push({ id: "act_exp_npc_talk_" + npc.npcId, label: npc.currentActivity === "ngu" ? "Đánh Thức · " + npcName : "Nói chuyện với " + npcName, aliases: ["nói chuyện", "gặp npc", "đánh thức"], priority: 1, category: "interaction" });
        if (state.dialogueState?.npcId === npc.npcId) actions.push({ id: "act_exp_npc_dialogue_" + npc.npcId, label: "Tiếp tục đối thoại", aliases: ["đối thoại"], priority: 1, category: "interaction" });
        const giftId = Object.keys(state.inventory || {}).find((id) => Number(state.inventory[id]) > 0 && D.ITEMS?.[id]);
        if (giftId) actions.push({ id: "act_exp_npc_gift:" + npc.npcId + ":" + giftId, label: "Tặng " + itemName(giftId) + " · " + npcName, aliases: ["tặng quà"], priority: 1, category: "interaction" });
        if (Number(state.player.corruptionRating || 0) >= 50) actions.push({ id: "act_exp_npc_intimidate_" + npc.npcId, label: "Uy Hiếp · " + npcName, aliases: ["uy hiếp npc"], priority: 1, category: "interaction" });
        if ((npc.isImportant || npc.canTeachRareTechnique || npc.canBecomeAnchor) && Number(state.relationships?.[npc.npcId]?.trust || 0) < 30 && state.npcTrustTrials?.[npc.npcId]?.status !== "active") actions.push({ id: "act_exp_npc_trial_" + npc.npcId, label: "Nhận Thử Thách Lòng Tin · " + npcName, aliases: ["thử thách lòng tin"], priority: 1, category: "interaction" });
        if (npc.canTeachRareTechnique && state.guildMembership?.guildId === npc.factionId) {
          const teachable = guildVaultSnapshot(state).techniques.find((technique) => !technique.learned);
          if (teachable) actions.push({ id: "act_exp_npc_train:" + npc.npcId + ":" + teachable.id, label: "Thỉnh Giáo · " + teachable.name, aliases: ["thỉnh giáo công pháp"], priority: 1, category: "interaction" });
        }
      });
      const trails = (state.worldSimulation.npcFootprints?.[state.locationId] || []).filter((trail) => day - trail.departedDay <= 3 && !trail.followed);
      if (trails.length) actions.push({ id: "act_exp_npc_track", label: "Truy Tung Dấu Vết", aliases: ["truy tung", "dấu vết npc"], priority: 1, category: "interaction" });
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
    if (actionId.startsWith("act_exp_pursuit_")) {
      const pursuit = state.pendingNpcPursuit, pursuer = pursuit && state.worldSimulation.npcState[pursuit.npcId];
      if (!pursuit || pursuit.status !== "pending" || !pursuer) return { success: false, reason: "Truy sát không còn ở đây." };
      if (actionId === "act_exp_pursuit_appease") {
        if (Number(state.player.merit || 0) < 20) return { success: false, reason: "Thiếu 20 Công Đức để chuộc lỗi." };
        state.player.merit -= 20; pursuit.status = "resolved"; pursuit.outcome = "appeased"; pursuer.status = "departed";
      } else if (actionId === "act_exp_pursuit_escape") {
        const score = Number(state.player.stats?.eff?.evasion || 0) + Number(state.player.aptitude || 0) + seeded(state, pursuit.npcId, absoluteDay(state.gameClock)) * 30;
        if (score < 45) { const damage = Math.max(1, Math.floor(Number(state.player.stats?.hpMax || state.player.hp || 100) * 0.12)); E.applyPlayerDamage(state, damage); return { success: false, reason: "Ngươi chưa thoát khỏi vòng vây; bị thương " + damage + "." }; }
        pursuit.status = "resolved"; pursuit.outcome = "escaped"; pursuit.resolvedDay = absoluteDay(state.gameClock); pursuer.nextMoveDay = absoluteDay(state.gameClock) + 7;
      } else {
        const power = Number(state.player.stats?.eff?.combatPower || 0) + Number(state.player.realmLevel || 0) * 10;
        if (power < Number(pursuer.realmIndex || 0) * 10) { const damage = Math.max(1, Math.floor(Number(state.player.stats?.hpMax || state.player.hp || 100) * 0.2)); E.applyPlayerDamage(state, damage); return { success: false, reason: "Chấp Pháp Truy Đồ áp đảo; ngươi bị thương " + damage + "." }; }
        pursuit.status = "resolved"; pursuit.outcome = "defeated"; pursuer.status = "deceased"; pursuer.deathDay = absoluteDay(state.gameClock);
      }
      pursuit.resolvedDay = absoluteDay(state.gameClock); history(state, pursuit.outcome === "defeated" ? "warn" : "narr", pursuit.outcome === "defeated" ? "Chấp Pháp Truy Đồ gục xuống; món nợ phản đồ vẫn còn với tổ chức." : "Ngươi tạm thoát khỏi truy sát; mối thù với tổ chức chưa được xóa.");
      return { success: true, outcome: pursuit.outcome };
    }
    if (actionId.startsWith("act_exp_npc_gift:")) { const [, npcId, itemId] = actionId.split(":"); return giftNpc(state, npcId, itemId); }
    if (actionId.startsWith("act_exp_npc_train:")) {
      const [, npcId, techniqueId] = actionId.split(":"); const npc = state.worldSimulation.npcState[npcId];
      if (!npc?.canTeachRareTechnique || npc.currentNodeId !== state.locationId || state.guildMembership?.guildId !== npc.factionId || !guildVaultSnapshot(state).techniques.some((technique) => technique.id === techniqueId)) return { success: false, reason: "NPC chưa thể truyền thụ bí pháp này." };
      const trial = state.npcTrustTrials?.[npcId];
      if (trial?.status !== "passed") { if (trial?.status !== "active") beginTrustTrial(state, npcId); return { success: false, trialRequired: true, reason: "Trước khi truyền pháp, NPC yêu cầu ngươi vượt qua thử thách lòng tin." }; }
      const learned = E.learnTechnique(state, techniqueId); return { success: Boolean(learned), reason: learned ? null : "Chưa đủ điều kiện thỉnh học." };
    }
    if (actionId.startsWith("act_exp_npc_intimidate_")) return intimidateNpc(state, actionId.slice("act_exp_npc_intimidate_".length));
    if (actionId.startsWith("act_exp_npc_trial_resolve_")) return resolveTrustTrial(state, actionId.slice("act_exp_npc_trial_resolve_".length), true);
    if (actionId.startsWith("act_exp_npc_trial_")) return beginTrustTrial(state, actionId.slice("act_exp_npc_trial_".length));
    if (actionId === "act_exp_npc_track") {
      const trail = (state.worldSimulation.npcFootprints?.[state.locationId] || []).filter((entry) => absoluteDay(state.gameClock) - entry.departedDay <= 3 && !entry.followed).sort((a, b) => b.departedDay - a.departedDay)[0];
      if (!trail) return { success: false, reason: "Dấu vết đã phai." };
      trail.followed = true; const falseLead = seeded(state, trail.trailId, "false") < 0.2;
      history(state, "narr", falseLead ? "Dấu chân đột ngột hòa vào con đường đông người; hướng lần theo có thể đã sai." : "Mảnh vải và dấu chân dẫn về hướng " + (D.LOCATIONS[trail.destinationHint]?.name || "một lối mòn") + ", nhưng người kia hẳn đã đi xa.");
      return { success: true, destinationHint: falseLead ? null : trail.destinationHint, uncertain: true };
    }
    if (actionId.startsWith("act_exp_org_politics:")) {
      const [, orgId, candidateId] = actionId.split(":"); const faction = state.worldSimulation.factionState[orgId], crisis = faction?.successionCrisis;
      if (!crisis || crisis.status !== "active" || !crisis.candidates.includes(candidateId)) return { success: false, reason: "Khủng hoảng kế vị đã kết thúc." };
      crisis.status = "resolved"; crisis.supportedCandidateId = candidateId; crisis.outcome = candidateId; faction.leaderNpcId = candidateId; faction.alignment = Number(state.player.corruptionRating || 0) >= 60 ? "dark" : "orthodox"; faction.stability = clamp(Number(faction.stability || 50) + 10, 0, 100);
      history(state, "narr", "Phe của " + (state.worldSimulation.npcState[candidateId]?.name || candidateId) + " nắm ưu thế; đường hướng của tổ chức đổi theo người đứng đầu mới."); return { success: true, leaderNpcId: candidateId };
    }
    if (actionId.startsWith("act_exp_org_study:")) {
      const id = actionId.slice("act_exp_org_study:".length), snapshot = guildVaultSnapshot(state);
      if (!snapshot.unlocked || !snapshot.techniques.some((entry) => entry.id === id)) return { success: false, reason: "Cấp bậc chưa mở bí pháp này." };
      const learned = E.learnTechnique(state, id); return { success: Boolean(learned), reason: learned ? null : "Chưa đủ điều kiện thỉnh học." };
    }
    if (actionId.startsWith("act_exp_org_vault_")) return { success: true, vault: guildVaultSnapshot(state, actionId.slice("act_exp_org_vault_".length)) };
    if (actionId.startsWith("act_exp_org_mediation:")) { const [, a, b] = actionId.split(":"); return resolveAllianceMediation(state, a, b); }
    if (actionId.startsWith("act_exp_org_loyalty_investigate:")) return resolveLoyaltyTest(state, actionId.slice("act_exp_org_loyalty_investigate:".length), "investigate");
    if (actionId.startsWith("act_exp_org_loyalty_")) return resolveLoyaltyTest(state, actionId.slice("act_exp_org_loyalty_".length), "start");
    if (actionId.startsWith("act_exp_org_loyalty_decision:")) { const [, orgId, choice] = actionId.split(":"); return resolveLoyaltyTest(state, orgId, choice); }
    if (actionId.startsWith("act_exp_org_defect_")) return resolveOrganizationDefection(state, actionId.slice("act_exp_org_defect_".length));
    if (actionId.startsWith("act_exp_org_")) {
      const match = actionId.match(/^act_exp_org_(status|donate|commission|special_commission|life_commission|promote|turnin)_(.+)$/);
      if (!match) return { success: false, reason: "Hành động tổ chức không hợp lệ." };
      if (match[1] === "promote") return promoteGuildMember(state);
      if (match[1] === "turnin") return resolveOrganizationCommission(state, match[2]);
      const action = match[1] === "special_commission" ? "commission_special" : match[1] === "life_commission" ? "commission_life" : match[1];
      return organizationInteract(state, match[2], action);
    }
    if (actionId.startsWith("act_exp_npc_talk_")) return npcTalk(state, actionId.slice("act_exp_npc_talk_".length));
    if (actionId.startsWith("act_exp_npc_dialogue_")) return npcDialogueAction(state, actionId.slice("act_exp_npc_dialogue_".length), "check");
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
    advanceOrganizationCommissions(state, actionId);
    if ((actionId === "act_tan_cong_thuong" || actionId.startsWith("act_skill_")) && E.aliveEnemies(state).length && state.companion && ["active", "mutated"].includes(state.companion.state)) {
      const companionResult = useCompanionSkill(state, state.companion.role === "scout" ? "scout_strike" : "guard_bite");
      if (companionResult.success) history(state, "sys", "Dị Thú đồng hành phối hợp tấn công, gây " + companionResult.damage + " sát thương.");
    }
    const afterEnemies = E.aliveEnemies(state).length;
    if (before.enemyCount > afterEnemies && before.enemyExp >= 100) publishPlayerRumor(state, "player-victory:" + before.enemyId + ":" + absoluteDay(state.gameClock), "Người chơi đã đánh bại một cường địch tại " + (D.LOCATIONS?.[state.locationId]?.name || "một vùng đất xa"), "heroic", 2);
    if (/breakthrough|dot_pha/.test(actionId)) publishPlayerRumor(state, "player-breakthrough:" + absoluteDay(state.gameClock), "Một tu sĩ vừa đột phá cảnh giới; tin tức đang lan theo đường thương lộ.", "heroic", 2);
    if (/act_hidden_profession|forbidden|cam_thuat/.test(actionId)) publishPlayerRumor(state, "player-forbidden:" + absoluteDay(state.gameClock), "Có lời đồn về một tu sĩ sử dụng thuật pháp bị cấm.", "villainous", 3);
    if (/tu_luyen|be_quan/.test(actionId)) advanceTechniqueTrials(state, "cultivation");
    if (before.enemyCount > afterEnemies) {
      const elite = before.enemyCount > 0 && before.enemyExp >= 100;
      if (elite) { advanceTechniqueTrials(state, "elite"); recordFateEvolutionProgress(state, "elite", "combat:" + state.meta.turn); }
      Object.values(state.contractBoard.accepted).filter((contract) => contract.targetEntityId === before.enemyId).forEach((contract) => completeContract(state, contract, "kill"));
      E.equippedItemIds(state.player.equipment).forEach((id) => { const item = state.generatedItems?.[id]; if (item) { item.legacy ||= { usageCounters: { combatWins: 0, eliteWins: 0 }, marks: [], awakeningStatus: "dormant", bondLevel: 0, heirloom: false, reincarnations: 0, wear: 0 }; item.legacy.usageCounters.combatWins = Number(item.legacy.usageCounters.combatWins || 0) + 1; if (elite) item.legacy.usageCounters.eliteWins = Number(item.legacy.usageCounters.eliteWins || 0) + 1; if (item.legacy.usageCounters.combatWins >= 3 && item.legacy.awakeningStatus === "dormant") item.legacy.awakeningStatus = "ready"; } });
    }
    if (actionId.startsWith("act_talk_")) { const npcId = actionId.slice("act_talk_".length); recordRelationshipEvent(state, npcId, "talked", { uniqueKey: "talk:" + actionId + ":" + absoluteDay(state.gameClock) }); registerCollection(state, "npcs", npcId, String(npcId).includes("boss") ? "hiếm" : "thường"); }
    if (actionId.startsWith("act_move_")) {
      discover(state, "locations", state.locationId, "travel"); verifyDiscovery(state, "locations", state.locationId, "arrived");
      claimHiddenRealmCore(state);
      Object.values(state.contractBoard.accepted).filter((contract) => contract.allowedOutcomes.includes("travel") && contract.targetLocationId === state.locationId).forEach((contract) => completeContract(state, contract, "travel"));
    }
    if (/search/.test(actionId)) {
      recordFateEvolutionProgress(state, "aligned", "search:" + state.locationId + ":" + state.meta.turn);
      Object.values(state.contractBoard.accepted).filter((contract) => contract.allowedOutcomes.includes("search") && contract.regionId === currentRegion(state)).forEach((contract) => completeContract(state, contract, "search"));
      Object.values(state.contractBoard.accepted).filter((contract) => contract.allowedOutcomes.includes("item") && Number(state.inventory?.[contract.targetItemId] || 0) > Number(contract.acceptedItemQuantity || 0)).forEach((contract) => completeContract(state, contract, "item"));
      if (!state.pendingContestedOpportunity && seeded(state, "contested:" + state.locationId, state.meta.turn, absoluteDay(state.gameClock)) < 0.025) createContestedOpportunity(state);
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
      weatherUntilDay: Number(region?.weatherUntilDay || 0), weatherSeverity: Number(region?.weatherSeverity || 0),
      weatherHistory: copy((region?.weatherHistory || []).slice(-5)),
      event: event ? { ...event, name: template?.name, phase: template?.phases?.[event.phaseIndex]?.id } : null,
      contracts: Object.values(state.contractBoard.offers), acceptedContracts: Object.values(state.contractBoard.accepted),
      wars: Object.values(state.worldSimulation.wars).filter((war) => war.status === "active"), warFronts: warFrontSnapshot(state), rumorBulletin: rumorBulletinSnapshot(state), companion: state.companion,
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
    if (Object.keys(state.auction.lots || {}).length) updateAuction(state, day);
    state.auction.lots = {}; const candidates = Object.keys(D.ITEMS || {}).filter((id) => D.ITEMS[id]?.kind !== "quest").slice(0, 20);
    for (let i = 0; i < Math.min(3, candidates.length); i += 1) {
      const itemIndex = (Math.floor(seeded(state, "auction-item", day, i) * candidates.length) + i) % candidates.length;
      const itemId = candidates[itemIndex], id = "lot_" + day + "_" + i;
      state.auction.lots[id] = { id, itemKind: D.ITEMS[itemId]?.kind, itemId, sellerId: "npc_auction", startDay: day, endDay: day + 3, reservePrice: 10 + i * 5, currentBid: 10 + i * 5, bidderId: "npc", status: "active" };
    }
    state.auction.generatedDay = day; return state.auction;
  }
  function bidAuction(state, lotId, amount) {
    ensure(state); const lot = state.auction.lots[lotId], bid = Math.floor(Number(amount || 0));
    if (!lot || lot.status !== "active" || lot.endDay < absoluteDay(state.gameClock)) return { success: false, reason: "Lô đấu giá đã đóng." };
    if (bid <= lot.currentBid || Number(state.inventory?.linh_thach || 0) < bid) return { success: false, reason: "Giá phải cao hơn và đủ Linh Thạch." };
    if (lot.bidderId === state.player.id) addItem(state, "linh_thach", lot.currentBid);
    removeItem(state, "linh_thach", bid); lot.currentBid = bid; lot.bidderId = state.player.id; history(state, "narr", "Ngươi đặt " + bid + " Linh Thạch cho " + itemName(lot.itemId) + "; tiếng trả giá vang lên giữa phường thị."); return { success: true, lot };
  }
  function validateAuctionState(state) {
    ensure(state);
    const errors = [], lots = state.auction?.lots;
    if (!lots || typeof lots !== "object" || Array.isArray(lots)) return { ok: false, errors: ["lots"] };
    Object.entries(lots).forEach(([key, lot]) => {
      if (!lot || lot.id !== key) errors.push(key + ":identity");
      if (!lot || !["active", "closed"].includes(lot.status)) errors.push(key + ":status");
      if (!lot || !D.ITEMS?.[lot.itemId]) errors.push(key + ":item");
      if (!lot || !Number.isFinite(Number(lot.startDay)) || !Number.isFinite(Number(lot.endDay)) || Number(lot.endDay) < Number(lot.startDay)) errors.push(key + ":schedule");
      if (!lot || !Number.isInteger(Number(lot.reservePrice)) || Number(lot.reservePrice) < 0 || !Number.isInteger(Number(lot.currentBid)) || Number(lot.currentBid) < Number(lot.reservePrice)) errors.push(key + ":price");
      if (lot && !["npc", null, state.player.id].includes(lot.bidderId)) errors.push(key + ":bidder");
      if (lot?.status === "closed" && lot.bidderId === state.player.id && !lot.delivered) errors.push(key + ":undelivered");
    });
    return { ok: errors.length === 0, errors };
  }
  function craftArtifact(state) {
    ensure(state); if (!hasProfession(state, "luyen_khi")) return { success: false, reason: "Cần cố định nghề Luyện Khí Sư." };
    const record = professionRecord(state, "luyen_khi"); if (!record) return { success: false };
    const recipe = recipeDefinition("procedural_artifact"); const recipeCheck = recipeCanCommit(state, recipe);
    if (!recipeCheck.success) return recipeCheck;
    commitRecipeCosts(state, recipe); practiceProfession(state, "luyen_khi", { skipCost: true, internal: true }); const item = E.createLootItem(state, "artifact", "craft-artifact:" + Number(state.meta?.turn || 0));
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
    ensure(state); const companion = normalizeCompanion(state.companion);
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
      companion.state = "released"; companion.mutationPending = false; companion.releasedDay = absoluteDay(state.gameClock); grantCanonicalReward(state, "companion-release:" + companion.entityId, { merit: 3 }, "companion-release:" + companion.entityId + ":" + Number(companion.bondedDay || 0));
      history(state, "sys", "◇ Đã phóng sinh " + companion.customName + " · Công Đức +3."); return { success: true, choice };
    }
    return { success: false, reason: "Lựa chọn Dị Biến không hợp lệ." };
  }
  function createContestedOpportunity(state) {
    ensure(state); if (state.pendingContestedOpportunity) return state.pendingContestedOpportunity;
    const day = absoluteDay(state.gameClock), rivalId = Object.keys(D.NPCS || {})[Math.floor(seeded(state, "opportunity-rival", day, state.meta.turn) * Math.max(1, Object.keys(D.NPCS || {}).length))] || "rival_cultivator";
    const reward = 4 + Math.floor(seeded(state, "opportunity-reward", day) * 5);
    state.pendingContestedOpportunity = { id: uid(state, "opportunity"), nodeId: state.locationId, regionId: currentRegion(state), rivalId, createdDay: day, expiresDay: day + 12, reward, status: "pending", choices: {
      fight: { label: "Cường Đoạt", reward, consequence: "Thất bại mất 15% Khí Huyết hiện tại." },
      scheme: { label: "Dùng Mưu", reward, consequence: "Tỷ lệ thành công dựa trên Ngộ tính; thất bại bị thương." },
      share: { label: "Chia Sẻ", reward: Math.ceil(reward / 2), consequence: "Chắc chắn thành công, giảm nửa phần thưởng và tăng thiện duyên." }
    } };
    history(state, "narr", "Giữa lớp cát nóng, một luồng linh quang bật lên rồi lập tức bị một kẻ lạ mặt chặn ngang. Cơ duyên đã thành cuộc tranh đoạt; ngươi phải quyết định trước khi dấu vết tan vào gió."); return state.pendingContestedOpportunity;
  }
  function resolveContestedOpportunity(state, choice) {
    ensure(state); const opportunity = state.pendingContestedOpportunity;
    if (!opportunity || opportunity.status !== "pending") return { success: false, reason: "Không có cơ duyên tranh đoạt." };
    if (absoluteDay(state.gameClock) > opportunity.expiresDay) { opportunity.status = "expired"; recordContestedOpportunity(state, opportunity); state.pendingContestedOpportunity = null; return { success: false, reason: "Cơ duyên đã bị người khác lấy mất." }; }
    let chance = 0.5, reward = opportunity.reward;
    if (choice === "fight") chance += Number(state.player.stats?.phy || 0) / 250;
    else if (choice === "scheme") chance += Number(state.player.comprehension || 0) / 180;
    else if (choice === "share") { chance = 1; reward = Math.ceil(reward / 2); recordRelationshipEvent(state, opportunity.rivalId, "shared_opportunity", { uniqueKey: opportunity.id }); }
    else return { success: false, reason: "Cách tranh cơ duyên không hợp lệ." };
    const success = choice === "share" ? true : seeded(state, "opportunity-resolve:" + choice, opportunity.id, state.meta.turn) < clamp(chance, 0.15, 0.95);
    opportunity.status = success ? "won" : "lost"; opportunity.choice = choice; opportunity.resolvedDay = absoluteDay(state.gameClock); opportunity.resolvedReward = success ? reward : 0;
    if (success) { grantCanonicalReward(state, "opportunity:" + opportunity.id, { linhThach: reward, exp: reward * 4 }, "opportunity:" + opportunity.id); history(state, "narr", "Ngươi chớp lấy khoảnh khắc đối thủ sơ hở, thu linh quang vào lòng bàn tay. Cơ duyên đã thuộc về ngươi; Linh Thạch nhận được: " + reward + "."); }
    else { state.player.hp = Math.max(1, Number(state.player.hp || 1) - Math.ceil(Number(state.player.maxHp || 20) * 0.15)); history(state, "narr", "Thế giằng co vỡ tan. Đối thủ đoạt mất linh quang, còn ngươi phải lùi lại với vết thương nóng rát bên sườn."); }
    recordContestedOpportunity(state, opportunity); state.pendingContestedOpportunity = null; return { success, attempted: true, reward: success ? reward : 0 };
  }
  function recordContestedOpportunity(state, opportunity) {
    if (!opportunity?.id) return;
    state.opportunityHistory ||= [];
    if (!state.opportunityHistory.some((entry) => entry.id === opportunity.id)) state.opportunityHistory.push({ id: opportunity.id, nodeId: opportunity.nodeId, rivalId: opportunity.rivalId, status: opportunity.status, choice: opportunity.choice || null, reward: Number(opportunity.resolvedReward ?? (opportunity.status === "won" ? opportunity.reward : 0)), createdDay: Number(opportunity.createdDay), resolvedDay: Number(opportunity.resolvedDay || absoluteDay(state.gameClock)) });
    state.opportunityHistory = state.opportunityHistory.slice(-30);
  }
  function validateContestedOpportunity(state) {
    ensure(state); const errors = [], valid = new Set(["won", "lost", "expired"]);
    if (!Array.isArray(state.opportunityHistory) || state.opportunityHistory.length > 30) errors.push("history");
    const ids = new Set();
    (state.opportunityHistory || []).forEach((entry) => {
      if (!entry?.id || ids.has(entry.id) || !valid.has(entry.status) || !Number.isFinite(Number(entry.createdDay)) || !Number.isFinite(Number(entry.resolvedDay)) || Number(entry.reward || 0) < 0) errors.push("entry");
      ids.add(entry?.id);
    });
    const pending = state.pendingContestedOpportunity;
    if (pending && (!pending.id || pending.status !== "pending" || !Number.isFinite(Number(pending.createdDay)) || !Number.isFinite(Number(pending.expiresDay)) || Number(pending.expiresDay) < Number(pending.createdDay) || Number(pending.reward) < 0)) errors.push("pending");
    if (pending && ids.has(pending.id)) errors.push("pending-duplicate");
    return { ok: errors.length === 0, errors };
  }
  function validateHiddenRealmRuntimeState(state) {
    ensure(state); const errors = [], definitions = Array.isArray(X.hiddenRealms) ? X.hiddenRealms : [], runtimeMap = state.worldSimulation?.hiddenRealms || {}, day = absoluteDay(state.gameClock);
    definitions.forEach((definition) => {
      const runtime = runtimeMap[definition.id];
      if (!runtime) { errors.push(definition.id + ":missing"); return; }
      if (!Number.isInteger(Number(runtime.cycleIndex)) || Number(runtime.cycleIndex) < 0) errors.push(definition.id + ":cycle");
      if (!Number.isFinite(Number(runtime.opensDay)) || !Number.isFinite(Number(runtime.closesDay)) || Number(runtime.closesDay) < Number(runtime.opensDay)) errors.push(definition.id + ":window");
      if (!(["sealed", "omen", "open"].includes(runtime.status))) errors.push(definition.id + ":status");
      if (!Array.isArray(runtime.claimedRewardKeys) || new Set(runtime.claimedRewardKeys).size !== runtime.claimedRewardKeys.length) errors.push(definition.id + ":rewards");
      Object.entries(runtime.competitorProgress || {}).forEach(([actorId, progress]) => { if (!actorId || !Number.isFinite(Number(progress)) || Number(progress) < 0) errors.push(definition.id + ":competitor"); });
      if (runtime.status === "open" && day > Number(runtime.closesDay) + 1) errors.push(definition.id + ":stale-open");
    });
    const active = state.activeHiddenRealm;
    if (active) {
      const definition = definitions.find((entry) => entry.id === active.realmId), runtime = runtimeMap[active.realmId];
      if (!definition || !runtime || runtime.status !== "open" || Number(active.cycleIndex) !== Number(runtime.cycleIndex)) errors.push("active:reference");
      if (!active.entryNodeId || !active.coreNodeId || !D.LOCATIONS?.[active.entryNodeId] || !D.LOCATIONS?.[active.coreNodeId]) errors.push("active:nodes");
      const expectedPrefix = "hidden:" + active.realmId + ":" + active.cycleIndex + ":";
      if (state.locationId !== active.entryNodeId && state.locationId !== active.coreNodeId && !String(state.locationId || "").startsWith(expectedPrefix)) errors.push("active:location");
    }
    return { ok: errors.length === 0, errors, realmCount: definitions.length };
  }
  function resolvePrisoner(state, prisonerId, outcome) {
    ensure(state); const prisoner = state.prisoners[prisonerId]; if (!prisoner || prisoner.status !== "held") return { success: false };
    if (!["released", "turned_in", "executed"].includes(outcome)) return { success: false, reason: "Cách xử lý tù binh không hợp lệ." };
    prisoner.status = outcome;
    if (outcome === "released") grantCanonicalReward(state, "prisoner:" + prisonerId, { merit: 2 }, "prisoner:" + prisonerId + ":released");
    if (outcome === "turned_in") { grantCanonicalReward(state, "prisoner:" + prisonerId, { merit: 3 }, "prisoner:" + prisonerId + ":turned_in"); if (state.guildMembership) state.guildMembership.contribution += 5; }
    if (outcome === "executed") state.player.corruptionRating = clamp(state.player.corruptionRating + 2, 0, 100);
    const labels = { released: "phóng thích", turned_in: "giao nộp", executed: "xử quyết" };
    prisoner.resolvedDay = absoluteDay(state.gameClock); history(state, "narr", "Số phận tù binh được định đoạt: " + labels[outcome] + "."); return { success: true };
  }
  function participateWar(state, warId) {
    ensure(state); const war = state.worldSimulation.wars[warId]; if (!war || war.status !== "active") return { success: false, reason: "Chiến sự đã kết thúc." };
    const guildId = state.guildMembership?.guildId;
    if (![war.factionA, war.factionB].includes(guildId)) return { success: false, reason: "Ngươi chưa thuộc một phe đang giao chiến." };
    if (Array.isArray(war.frontNodeIds) && war.frontNodeIds.length && !war.frontNodeIds.includes(state.locationId)) return { success: false, reason: "Ngươi chưa có mặt tại chiến tuyến." };
    const day = absoluteDay(state.gameClock), side = guildId === war.factionB ? "B" : "A";
    if (war.playerInterventions.some((entry) => Number(entry.day) === day)) return { success: false, reason: "Hôm nay ngươi đã can thiệp vào chiến sự." };
    war[side === "A" ? "scoreA" : "scoreB"] += 1; war.playerInterventions.push({ day, side });
    grantCanonicalReward(state, "war:" + warId, { exp: 25 }, "war:" + warId + ":" + day + ":" + side);
    history(state, "narr", "Giữa tiếng binh khí va đập, ngươi góp một đòn vào chiến tuyến; chiến công +1."); return { success: true };
  }
  // Army runtime: the smallest persistent layer for the map army contract.
  // It deliberately reuses the existing faction/wars/world-tick state.
  function ensureArmyState(state) {
    ensure(state); const sim = state.worldSimulation;
    sim.armies = sim.armies && typeof sim.armies === "object" ? sim.armies : {};
    Object.values(sim.armies).forEach((army) => {
      army.soldierCount = Math.max(0, Math.floor(Number(army.soldierCount || 0)));
      army.morale = clamp(Number(army.morale ?? 70), 0, 100);
      army.status ||= "garrison"; army.nodeId ||= army.originNodeId || state.locationId;
      army.route = Array.isArray(army.route) ? army.route : [];
      army.processedDays = Array.isArray(army.processedDays) ? army.processedDays : [];
    });
    return sim.armies;
  }
  function createArmy(state, factionId, nodeId, options = {}) {
    const armies = ensureArmyState(state), id = options.id || "army:" + factionId + ":" + absoluteDay(state.gameClock) + ":" + Object.keys(armies).length;
    if (armies[id]) return armies[id];
    armies[id] = { id, factionId, originNodeId: nodeId, nodeId, soldierCount: Math.max(1, Math.floor(Number(options.soldierCount || 100))), morale: clamp(Number(options.morale ?? 70), 0, 100), status: "garrison", route: [], targetNodeId: null, createdDay: absoluteDay(state.gameClock), lastUpdatedDay: absoluteDay(state.gameClock), corruptionExposure: 0, playerIntervention: null };
    return armies[id];
  }
  function armySnapshot(state, nodeId = null) {
    const armies = Object.values(ensureArmyState(state));
    return armies.filter((army) => !nodeId || army.nodeId === nodeId).map((army) => ({ ...army, route: army.route.slice(), processedDays: undefined }));
  }
  function updateArmies(state, day) {
    const armies = ensureArmyState(state);
    Object.values(armies).forEach((army) => {
      if (army.lastUpdatedDay >= day) return;
      const days = Math.min(30, Math.max(0, day - Number(army.lastUpdatedDay || day)));
      const node = D.LOCATIONS?.[army.nodeId];
      const corruption = Number(node?.corruptionLevel || node?.corruption || 0);
      if (corruption >= 3 && army.status === "marching") army.morale = clamp(army.morale - days * Math.max(1, corruption - 2), 0, 100);
      if (army.morale <= 20 && army.status !== "routed") { army.status = "routed"; army.soldierCount = Math.max(1, Math.floor(army.soldierCount * 0.85)); }
      army.lastUpdatedDay = day;
    });
    return armySnapshot(state);
  }
  function armyAction(state, armyId, action, options = {}) {
    const army = ensureArmyState(state)[armyId];
    if (!army) return { success: false, reason: "Binh đoàn không tồn tại." };
    if (action === "scout") return { success: true, army: armySnapshot(state, army.nodeId).find((entry) => entry.id === army.id) };
    if (action === "sabotage") { army.morale = clamp(army.morale - 10, 0, 100); army.soldierCount = Math.max(0, army.soldierCount - Math.ceil(army.soldierCount * 0.05)); return { success: true, army }; }
    if (action === "join_battle") { army.playerIntervention = { day: absoluteDay(state.gameClock), playerId: state.player.id }; return participateWar(state, options.warId) || { success: true, army }; }
    if (action === "command") { if (Number(state.player.reputation || state.player.merit || 0) < Number(options.minimumReputation || 20)) return { success: false, reason: "Danh vọng chưa đủ để nhận chỉ huy." }; army.targetNodeId = options.targetNodeId || army.targetNodeId; army.status = "marching"; return { success: true, army }; }
    return { success: false, reason: "Tương tác binh đoàn không hợp lệ." };
  }
  function runExpansionCommand(state, command, arg, arg2, options = {}) {
    const table = {
      divine: () => divine(state), contract_accept: () => acceptContract(state, arg), profession_choose: () => chooseProfessionLocked(state, arg), profession_practice: () => practiceProfession(state, arg),
      brew: () => brewPill(state, arg), profession_item_use: () => useProfessionItem(state, arg), profession_item_recharge: () => rechargeProfessionItem(state, arg), craft: () => craftArtifact(state), formation: () => placeFormation(state, arg || "gather"), interrogate: () => interrogate(state, arg, arg2 || "persuade", options), tame: () => tamePrisoner(state, arg),
      scout: () => scoutWithCompanion(state), fate_trial: () => startFateEvolutionTrial(state, arg), fate_evolve: () => evolveFate(state, arg, arg2, options), fate_transform: () => E.transformFate(state, arg, arg2, options), fate_omen: () => E.heavenlyOmen(state), technique_evolve: () => chooseTechniqueEvolution(state, arg, arg2),
      guild_start: () => startGuildProject(state, arg), guild_contribute: () => contributeGuildProject(state, Number(arg || 1)), legacy: () => chooseLegacy(state, arg), tribulation: () => chooseTribulation(state, arg),
      mark: () => setPlayerMark(state, arg), mail: () => sendMail(state, arg, arg2 || "Bình an."), intel_buy: () => buyIntel(state), cover: () => createCoverIdentity(state, arg), cover_retire: () => retireCoverIdentity(state), counter_intel: () => counterIntelResponse(state, arg),
      hidden_profession_action: () => useHiddenProfessionAction(state, arg), path_fusion: () => transitionSecondaryPath(state, arg, options),
      map_event: () => E.resolveMapEvent(state, arg),
      build_structure: () => buildMapStructure(state, arg || state.locationId, arg2 || "teleport_array"), structure_repair: () => repairMapStructure(state, arg || state.locationId, arg2), structure_upgrade: () => upgradeMapStructure(state, arg || state.locationId, arg2), structure_disable: () => disableMapStructure(state, arg || state.locationId, arg2, options.reason || "manual"), structure_dismantle: () => dismantleMapStructure(state, arg || state.locationId, arg2), structure_transfer: () => transferMapStructure(state, arg || state.locationId, arg2, options.npcId || options.targetNpcId), claim_outpost: () => claimOutpost(state, arg || state.locationId), petition_outpost: () => petitionOutpostToFaction(state, arg || state.locationId),
      bounty: () => placeBounty(state, arg, Number(arg2 || 10)), auction_bid: () => bidAuction(state, arg, Number(arg2)), item_awaken: () => awakenItem(state, arg), heirloom: () => markHeirloom(state, arg), heirloom_repair: () => repairHeirloom(state, arg), prisoner_resolve: () => resolvePrisoner(state, arg, arg2), companion_mutation: () => resolveCompanionMutation(state, arg), opportunity: () => resolveContestedOpportunity(state, arg), read_npc: () => readNpc(state, arg), npc_dialogue: () => npcDialogueAction(state, arg, arg2 || "check"), war: () => participateWar(state, arg), army: () => armyAction(state, arg, arg2, options), tournament: () => joinTournament(state), codex: () => inspectCodex(state, arg, arg2 || "investigate"), hidden_clue: () => hiddenProfessionClue(state, arg, arg2 || "lead")
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
  E.contextState = function (state) { const result = original.contextState.call(E, state); if (!result.forced) result.actions.push(...expansionActions(state)); return E.resolveActionPriority ? E.resolveActionPriority(state, result) : result; };
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
    ensureExpansionState: ensure, ensureNpcWorldState, ensureMapState, mapNode, mapInfluenceSnapshot, resolveMapInfluence: mapInfluenceSnapshot, refreshMapInfluence, recordMapEventInfluence, mapFogState, moveWithinNode, appendNodeHistory, nodeResonance, mapCompletion, mapCompletionDetailed, buildMapStructure, repairMapStructure, upgradeMapStructure, disableMapStructure, dismantleMapStructure, transferMapStructure, teleportAnchorEligibility, travelPlan: canonicalTravelPlan, travelWeightSnapshot, claimOutpost, petitionOutpostToFaction, createTradeRoute, updateTradeRoutes, validateTradeRouteState, repairInvalidMapExits, wardProtectionAtNode, ensureWorldSimulation, validateExpansionState, validateCacheInvalidationState, validateReplayEnvelope, gameDayOrdinal: absoluteDay, worldRandom: seeded, simulateWorldUntil, simulateWorldAggregate, updateNpcSchedules, updateFactionInternalEvents, seasonalDestinationSnapshot, scheduleWorldTask, cancelWorldTask, processScheduledWorldTasks, resolveOfflineNpcEncounters, actorHistorySnapshot, rehydrateUnknownContent, worldSimulationSummary, getWorldModifiers, setWeather, weatherCatalog, weatherSnapshot, validateWeatherRuntimeState, validateStructureRuntimeState, validateGuildProjectState, worldModifierPreview, resolveNpcWeatherReaction, activeRegionEvent, startWorldEvent, resolveWorldEventChoice,
    recordRelationshipEvent, relationshipTier, relationshipBreakdown, relationshipPolicySnapshot, validateRelationshipPolicy, validateRelationshipRuntimeState, npcActionPresentation, npcRoutineAt, giftNpc, intimidateNpc, publishPlayerRumor, beginTrustTrial, resolveTrustTrial, updateNpcBetrayals, resolveNpcSuccession, guildVaultSnapshot, resolveOrganizationDefection, resolveAllianceMediation, resolveLoyaltyTest, organizationSnapshot, organizationInteract, promoteGuildMember, guildPromotionStatus, resolveOrganizationCommission, advanceOrganizationCommissions, ensureOrganizationState, validateOrganizationState, sendMail, refreshContracts, acceptContract, grantCanonicalReward, captureTarget, interrogate, tamePrisoner, scoutWithCompanion, normalizeCompanion, validateCompanionState, validatePrisonerState, validateContestedOpportunity, validateHiddenRealmRuntimeState, ensureArmyState, createArmy, armySnapshot, armyAction, updateArmies, productPolicySnapshot, validateProductPolicies, structureManagerDecision, selectCompanionTarget, useCompanionSkill, recordCompanionDamage, simulateOfflineCompanionCombat, recoverCompanion, reviveCompanion,
    discover, verifyDiscovery, collectDiscovery, rewardDiscovery, discoveryStatusSummary, validateDiscoveryLifecycle, divine, survivalProjection, setPlayerMark, progressionNamespaceSnapshot, validateCanonicalNamespaces, pathFusionAffinity, transitionSecondaryPath, chooseProfessionLocked, professionAvailability, practiceProfession, recipeDefinition, recipeCatalog: () => copy(RECIPE_CATALOG), structureCatalog, validateStructureRuntimeState, validateGuildProjectState, rewardPolicySnapshot, validateRewardPolicy, brewPill, useProfessionItem, rechargeProfessionItem, useHiddenProfessionAction, placeFormation, readNpc,
    ensureTechniqueTrials, validateTechniqueRuntimeState, validateCharacterRuntimeState, chooseTechniqueEvolution, techniqueEvolutionModifiers,
    fateEvolutionEligibility, startFateEvolutionTrial, recordFateEvolutionProgress, fateEvolutionCandidates, fateEvolutionPreview, evolveFate, applyFateEvolutionOps, fateEvolutionScoreDelta,
    awakenItem, markHeirloom, repairHeirloom, startGuildProject, contributeGuildProject, hiddenRealmEnter, claimHiddenRealmCore, exitHiddenRealm, validateReincarnationRuntimeState, prepareTribulation, chooseTribulation, chooseLegacy, visitTomb,
    beforeReincarnation, afterReincarnation, afterBreakthrough, afterBreakthroughAttempt,
    expansionActions, expansionSummary, createCoverIdentity, retireCoverIdentity, counterIntelResponse, buyIntel, placeBounty, refreshAuction, bidAuction, validateAuctionState, refreshContracts, acceptContract, validateContractBoardState, craftArtifact, resolvePrisoner, resolveCompanionMutation, createContestedOpportunity, resolveContestedOpportunity, recordContestedOpportunity, rollMapEvent: E.rollMapEvent, resolveMapEvent: E.resolveMapEvent, participateWar, joinTournament, runExpansionCommand, inspectCodex, codexProgress, hiddenProfessionClue, npcWorldContext, factionBulletin, warFrontSnapshot, validateWarState, validateWorldEventState, rumorBulletinSnapshot, resolveNpcWorldReaction, resolveNpcWeatherReaction, validateNpcQuestState, npcQuestStatus, npcTalk, npcDialogueAction, acceptNpcQuest, performPathRitualStep, pathRitualStatus, registerCollection, unlockAchievements, equipmentSetModifiers, setWeather, worldModifierPreview, chooseProfessionLocked, validateProfessionNamespace, techniqueDisplayInfo, specialPhysiqueCatalog, specialPhysiqueModifiers, specialPhysiqueOutcome, recordSpecialPhysiqueProgress, claimSpecialPhysique
  });
  const establishHumanAnchorOriginal = E.establishHumanAnchor;
  if (typeof establishHumanAnchorOriginal === "function") E.establishHumanAnchor = function (state, npcId) {
    ensureNpcWorldState(state);
    const npc = state.worldSimulation.npcState[npcId], trial = state.npcTrustTrials?.[npcId];
    if (npc?.isImportant && trial?.status !== "passed") {
      if (trial?.status !== "active") beginTrustTrial(state, npcId, "keep_secret");
      return { success: false, trialRequired: true, reason: "NPC quan trọng muốn thử lòng ngươi trước khi trở thành Neo Nhân Tính." };
    }
    return establishHumanAnchorOriginal.call(E, state, npcId);
  };
  E.gameDayOrdinal = gameDayOrdinal;
  E.validateSpecialPhysiqueCatalog = validateSpecialPhysiqueCatalog;
  E.validateSpecialPhysiqueState = validateSpecialPhysiqueState;
  E.designPolicySnapshot = designPolicySnapshot;
  E.validateDesignPolicies = validateDesignPolicies;
  E.validateNodeHistory = validateNodeHistory;
  E.validateNpcScheduler = validateNpcScheduler;
  E.rumorPolicySnapshot = rumorPolicySnapshot;
  E.validateRumorPolicy = validateRumorPolicy;
  E.validateCompanionState = validateCompanionState;
  E.validateContestedOpportunity = validateContestedOpportunity;
    E.validatePathFusionCatalog = validatePathFusionCatalog;
    E.validateWorldCatalogs = validateWorldCatalogs;
    E.validateBalanceCatalog = validateBalanceCatalog;
  E.validateMapCoordinates = validateMapCoordinates;
  E.validateMapCanonicalState = validateMapCanonicalState;
  E.validateActionPriorityMatrix = E.validateActionPriorityMatrix;
  E.runtimeBudgetSnapshot = runtimeBudgetSnapshot;
  E.resolvePerformanceProfile = resolvePerformanceProfile;
  E.performanceProfile = performanceProfile;
  E.validatePerformanceBudget = validatePerformanceBudget;
  window.GameExpansion = E;
})();
