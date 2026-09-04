/* ============================================================
 * CỔ DỊ DIỆN — UI Rendering
 * ============================================================ */
window.GameUI = (function () {
  "use strict";

  let activeMapView = "world";

  const screens = {
    home: document.getElementById("screen-home"),
    create: document.getElementById("screen-create"),
    game: document.getElementById("screen-game")
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function addStory(cls, text, portrait) {
    const log = document.getElementById("story-log");
    const wrap = document.createElement("div");
    wrap.className = "story-entry " + cls;
    if (portrait) {
      const img = document.createElement("img");
      img.className = "portrait-thumb";
      img.src = portrait;
      img.alt = "";
      wrap.appendChild(img);
    }
    const p = document.createElement("p");
    p.className = cls;
    p.textContent = text;
    wrap.appendChild(p);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  function clearStory() {
    document.getElementById("story-log").innerHTML = "";
  }

  function renderChoices(choices) {
    const box = document.getElementById("choice-list");
    box.innerHTML = "";
    choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.textContent = c.label;
      btn.addEventListener("click", c.onClick);
      box.appendChild(btn);
    });
  }

  function clearChoices() {
    document.getElementById("choice-list").innerHTML = "";
  }

  function renderActions(state, onAction) {
    const box = document.getElementById("action-list");
    if (!box || !window.GameEngine.contextState) return;
    box.innerHTML = "";
    window.GameEngine.contextState(state).actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.className = "chip action-chip";
      btn.textContent = action.label;
      btn.addEventListener("click", () => onAction(action.id));
      box.appendChild(btn);
    });
  }

  function setLocation(name) {
    document.getElementById("story-location").textContent = name;
  }

  function setSaveIndicator(text) {
    document.getElementById("save-indicator").textContent = text;
  }

  function renderPanel(state) {
    const active = document.querySelector(".tab.active")?.dataset.tab || "status";
    let html = "";
    if (active === "status") html = renderStatus(state);
    else if (active === "inventory") html = renderInventory(state);
    else if (active === "quests") html = renderQuests(state);
    else if (active === "relations") html = renderRelations(state);
    else if (active === "guilds") html = renderGuilds(state);
    else if (active === "map") html = renderMap(state);
    else if (active === "memory") html = renderMemory(state);
    document.getElementById("tab-content").innerHTML = html;
  }

  function bar(label, value, max, cls) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return '<div class="kv"><span>' + label + '</span><b>' + value + "/" + max + "</b></div>" +
      '<div class="' + cls + '"><span style="width:' + pct + '%"></span></div>';
  }

  function renderStatus(state) {
    const p = state.player;
    const s = p.stats;
    const equipment = window.GameEngine.equipmentSummary(state);
    const itemName = (id) => id ? (window.GameData.ITEMS[id]?.name || id) : "Chưa trang bị";
    const artifactText = equipment.artifacts.length ? equipment.artifacts.map(itemName).join(" · ") : "Chưa trang bị";
    const protectionText = [
        ["Giáp", equipment.protection.armor], ["Ngoa (Giày)", equipment.protection.boots],
      ["Quần", equipment.protection.pants], ["Mũ", equipment.protection.helmet]
    ].map(([slot, id]) => slot + ": " + itemName(id)).join(" · ");
    const r = window.GameData.REALMS.find((x) => x.id === p.realmId) || window.GameData.REALMS[0];
    const next = window.GameData.REALMS[window.GameData.REALMS.findIndex((x) => x.id === p.realmId) + 1];
    const avatar = p.portrait ? '<div class="status-avatar"><img src="' + p.portrait + '" alt="' + p.name + '"></div>' : '';
    return avatar +
      '<div class="section-title">' + p.name + " · " + window.GameEngine.pathTitle(state) + "</div>" +
      bar("HP", p.hp, p.maxHp, "hp-bar") +
      bar("Linh Khí", p.qi, p.maxQi, "qi-bar") +
      bar("SAN Tỉnh Táo", p.san, p.maxSan || 100, "progress-bar") +
      '<div class="kv"><span>Chủng tộc</span><b>' + (p.race || "Nhân Tộc") + "</b></div>" +
      '<div class="kv"><span>Căn cốt</span><b>' + (p.aptitude || 50) + "/100</b></div>" +
      '<div class="kv"><span>Ngộ tính</span><b>' + (p.comprehension || 50) + "/100</b></div>" +
      '<div class="kv"><span>Corruption</span><b>' + (p.corruptionRating || 0) + "/100</b></div>" +
      '<div class="kv"><span>Linh căn</span><b>' + ((p.spiritualRoots || []).join(", ") || "Chưa rõ") + "</b></div>" +
      '<div class="kv"><span>Tính cách</span><b>' + ((p.personalityTraits || []).join(" · ") || "Chưa rõ") + "</b></div>" +
      '<div class="kv"><span>Xuất thân</span><b>' + (p.background || "Vô Danh") + "</b></div>" +
      '<div class="kv"><span>Mục tiêu ẩn</span><b>' + (p.hiddenGoal || "Trường sinh") + "</b></div>" +
      '<div class="kv"><span>Công pháp</span><b>' + (p.cultivationMethod || "Dẫn Khí Nhập Môn") + "</b></div>" +
      '<div class="kv"><span>PHY (Thể Phách)</span><b>' + s.phy + "</b></div>" +
      '<div class="kv"><span>MAG (Linh Lực)</span><b>' + s.mag + "</b></div>" +
      '<div class="kv"><span>Khí Vận</span><b>' + s.fortune + "</b></div>" +
      '<div class="kv"><span>Thọ Nguyên</span><b>' + p.lifespan + " năm</b></div>" +
      '<div class="kv"><span>Tu Vi</span><b>' + p.exp + (next ? " / " + (r.breakExp * (p.pathId === "ngoai_dao_gia" ? 5 : 1)) : "") + "</b></div>" +
      '<div class="kv"><span>Mệnh Trạng Thái</span><b>' + window.GameEngine.fateStatusLabel(state) + "</b></div>" +
      '<div class="kv equipment-group"><span>Pháp khí (' + equipment.artifacts.length + '/2)</span><b>' + artifactText + "</b></div>" +
      '<div class="kv equipment-group"><span>Hộ thân Pháp khí (' + Object.values(equipment.protection).filter(Boolean).length + '/4)</span><b>' + protectionText + "</b></div>" +
      '<div class="kv equipment-group"><span>Tùy thân Pháp khí (' + equipment.personal.length + '/3)</span><b>' + (equipment.personal.length ? equipment.personal.map(itemName).join(" · ") : "Chưa trang bị") + "</b></div>" +
      '<div class="kv equipment-group"><span>Bản mệnh Linh bảo (' + equipment.spiritTreasure.length + '/1)</span><b>' + itemName(equipment.spiritTreasure[0]) + "</b></div>" +
      '<div class="kv equipment-group"><span>Pháp khí Sinh hoạt (' + equipment.lifestyle.length + '/1)</span><b>' + itemName(equipment.lifestyle[0]) + "</b></div>" +
      '<div class="section-title">Cảnh Giới</div><p class="muted" style="margin:0">' + r.desc + "</p>" +
      (next ? '<p class="muted" style="margin:4px 0 0">Kế tiếp: ' + next.name + "</p>" : "");
  }

  function renderInventory(state) {
    const ids = Object.keys(state.inventory);
    const equippedIds = new Set(window.GameEngine.equippedItemIds(state.player.equipment));
    if (!ids.length) return '<div class="section-title">Hành trang</div><p class="muted">Trống rỗng.</p>';
    return '<div class="section-title">Hành trang</div>' + ids.map((id) => {
      const it = window.GameData.ITEMS[id];
      if (!it) return '<div class="item-row quest-failed">Vật phẩm không xác định: ' + id + "</div>";
      const equipped = equippedIds.has(id) ? " · Đang trang bị" : "";
      const generated = it.generated ? " · Procedural" : "";
      const cursed = it.cursed ? " · Nguyền rủa" : "";
      const actions = window.GameEngine.inventoryActions(state, id).map((action) =>
        '<button class="item-action" data-item-action="' + action.id + '" data-item-id="' + id + '">' + action.label + '</button>'
      ).join(" ");
      const categoryLabel = window.GameEngine.equipmentCategoryLabel(it);
      return '<div class="item-row">' + it.name + ' ×' + state.inventory[id] + '<br><small>' +
        categoryLabel + equipped + generated + cursed + '<br>' + (it.desc || "Không rõ lai lịch.") + '</small><div class="item-actions">' + actions + '</div></div>';
    }).join("");
  }

  function renderQuests(state) {
    const list = Object.values(state.quests).filter((q) => q.status !== "available");
    if (!list.length) return '<div class="section-title">Nhiệm vụ</div><p class="muted">Chưa có.</p>';
    return '<div class="section-title">Nhiệm vụ</div>' + list.map((q) => {
      const def = window.GameData.QUESTS[q.id];
      const cls = q.status === "completed" ? "quest-done" : q.status === "failed" ? "quest-failed" : "";
      const mark = q.status === "completed" ? "✓" : q.status === "failed" ? "×" : "·";
      const objs = q.objectives.map((o) => (o.done ? "✓ " : "○ ") + o.label).join("<br>");
      return '<div class="quest-row ' + cls + '">' + mark + " " + def.title + " <small>(" + q.status + ")</small><br><small>" + objs + "</small></div>";
    }).join("");
  }

  function renderRelations(state) {
    const ids = Object.keys(state.relationships);
    if (!ids.length) return '<div class="section-title">Nhân duyên</div><p class="muted">Chưa kết giao ai.</p>';
    return '<div class="section-title">Nhân duyên</div>' + ids.map((id) => {
      const npc = window.GameData.NPCS[id];
      const r = state.relationships[id];
      return '<div class="rel-row">' + (npc ? npc.name : id) +
        "<br><small>Tín: " + r.trust + " · Sợ: " + r.fear + " · Kính: " + r.respect + " · Nghi: " + r.suspicion + "</small></div>";
    }).join("");
  }

  function renderMemory(state) {
    const long = state.memory.longTerm;
    if (!long.length) return '<div class="section-title">Ký ức</div><p class="muted">Chưa có ký ức.</p>';
    return '<div class="section-title">Ký ức dài hạn</div>' + long.map((m) => '<div class="item-row">• ' + m + "</div>").join("");
  }

  function renderGuilds(state) {
    const data = window.GameData;
    const membership = state.guildMembership;
    if (membership) {
      const benefits = window.GameEngine.getGuildBenefits(state);
      const guild = benefits.guild;
      if (!guild) return '<p class="muted">Dữ liệu tổ chức không còn tồn tại.</p>';
      const nextRank = membership.contribution < 100 ? 100 : membership.contribution < 300 ? 300 : membership.contribution < 700 ? 700 : null;
      return '<div class="guild-card member"><div class="guild-tier">Cấp ' + guild.pyramid_tier + '</div><h3>' + guild.name + '</h3>' +
        '<p>' + guild.type + ' · ' + guild.race + ' · ' + guild.allegiance + '</p>' +
        '<div class="kv"><span>Thân phận</span><b>' + benefits.rank.name + '</b></div>' +
        '<div class="kv"><span>Cống hiến</span><b>' + membership.contribution + (nextRank ? ' / ' + nextRank : '') + '</b></div>' +
        '<div class="kv"><span>EXP tu luyện</span><b>+' + benefits.expBonusPct + '%</b></div>' +
        '<div class="kv"><span>Giảm tiêu cực</span><b>' + benefits.cityPenaltyReductionPct + '%</b></div>' +
        '<p class="guild-traits">' + guild.traits.join(' · ') + '</p>' +
        '<button class="guild-action danger" data-guild-leave="true">Rời tổ chức</button></div>';
    }

    if (window.GameEngine.cultivationTier(state) === 1) {
      return '<div class="section-title">Môn Phái / Đạo Lộ</div>' +
        '<p class="muted">Đang ở Di Mệnh Cảnh. Hãy tích đủ EXP hoặc dùng đan khai mạch để bước vào Khai Lộ Cảnh.</p>';
    }

    const regionId = data.WORLD_MAP.locations[state.locationId]?.region || "trung_vuc";
    const region = data.WORLD_MAP.regions.find((item) => item.id === regionId);
    const available = data.GUILDS.filter((guild) => guild.region_id === regionId)
      .sort((a, b) => a.pyramid_tier - b.pyramid_tier || b.reputation - a.reputation);
    const decision = state.pendingGuildChoice
      ? '<div class="guild-decision"><b>Nhiệm vụ: Lựa Chọn Đạo Lộ</b><p>Gia nhập một môn phái bên dưới, hoặc từ chối để tự chọn con đường.</p>' +
        '<button class="guild-action" data-guild-refuse="tan_tu">Chọn Tán Tu</button> ' +
        '<button class="guild-action" data-guild-refuse="the_gia">Chọn Thế Gia</button></div>'
      : '';
    return decision + '<div class="section-title">Tổ chức tại ' + (region?.name || "khu vực") + ' (' + available.length + ')</div>' +
      available.slice(0, 20).map((guild) => '<div class="guild-card"><div class="guild-tier">Cấp ' + guild.pyramid_tier + '</div>' +
        '<h3>' + guild.name + '</h3><p>' + guild.type + ' · ' + guild.race + '<br>' + guild.allegiance +
        ' · Danh vọng ' + guild.reputation + '<br>EXP +' + guild.cultivation_exp_bonus_pct.min + '–' + guild.cultivation_exp_bonus_pct.max +
        '% · Kháng tiêu cực ' + guild.city_penalty_reduction_pct.min + '–' + guild.city_penalty_reduction_pct.max + '%</p>' +
        '<button class="guild-action" data-guild-join="' + guild.id + '">Gia nhập</button></div>').join("") +
      (available.length > 20 ? '<p class="muted">Hiển thị 20 tổ chức nổi bật trong vùng.</p>' : "");
  }

  function renderMap(state) {
    const data = window.GameData;
    const map = data.WORLD_MAP;
    if (!map) return '<p class="muted">Chưa có dữ liệu bản đồ.</p>';

    const controls = '<div class="map-switch">' +
      '<button class="' + (activeMapView === "world" ? "active" : "") + '" data-map-view="world">Vạn Giới Lộ</button>' +
      '<button class="' + (activeMapView === "local" ? "active" : "") + '" data-map-view="local">Khu vực hiện tại</button>' +
      '</div>';
    return controls + (activeMapView === "world" ? renderWorldMap(state, data, map) : renderLocalMap(state, data, map));
  }

  function setMapView(view, state) {
    if (view !== "world" && view !== "local") return;
    activeMapView = view;
    renderPanel(state);
  }

  function renderWorldMap(state, data, map) {
    const currentRegionId = map.locations[state.locationId]?.region || "trung_vuc";
    const regionById = Object.fromEntries(map.regions.map((region) => [region.id, region]));
    const routes = (map.routes || []).map(([from, to]) => {
      const a = regionById[from];
      const b = regionById[to];
      if (!a || !b) return "";
      return '<line class="world-route" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    }).join("");

    const regions = map.regions.map((region) => {
      const current = region.id === currentRegionId ? " current" : "";
      return '<div class="region-node' + current + '" style="left:' + region.x + '%;top:' + region.y + '%" title="' + region.description + '">' +
        '<b>' + region.name + '</b><small>' + region.type + '<br>Linh khí ' + region.qi + ' · Nguy hiểm ' + region.danger + '</small></div>';
    }).join("");

    const factions = (map.factions || []).map((faction) => {
      const alignment = faction.alignment === "Tà" ? " evil" : faction.alignment === "Chính" ? " righteous" : " neutral";
      const label = faction.scale >= 8 ? '<span>' + faction.name + '</span>' : "";
      return '<div class="faction-pin' + alignment + '" style="left:' + faction.x + '%;top:' + faction.y + '%" title="' +
        faction.name + ' · ' + faction.type + ' · ' + faction.highest_realm + '">' + label + '</div>';
    }).join("");

    const guildPins = (map.guilds || []).filter((guild) => guild.pyramid_tier <= 2).map((guild) => {
      const alignment = guild.alignment === "Tà" ? " evil" : guild.alignment === "Chính" ? " righteous" : " neutral";
      return '<div class="faction-pin guild-pin' + alignment + '" style="left:' + guild.x + '%;top:' + guild.y + '%" title="' +
        guild.name + ' · Cấp ' + guild.pyramid_tier + ' · ' + guild.highest_realm_text + '"></div>';
    }).join("");

    const localFactions = (map.factions || []).filter((faction) => faction.region_id === currentRegionId);
    const factionList = localFactions.map((faction) => {
      const realmKey = faction.highest_realm;
      const realm = data.REALMS.find((item) => item.id === realmKey || (item.legacyIds || []).includes(realmKey));
      return '<div class="faction-row"><b>' + faction.name + '</b><small>' + faction.type + ' · ' + faction.alignment +
        '<br>Quy mô ' + faction.scale + '/10 · Cường giả: ' + (realm?.name || faction.highest_realm) +
        '<br>' + faction.traits.join(" · ") + '</small></div>';
    }).join("");

    return '<div class="map-heading"><b>' + map.name + '</b><small>Bản đồ thế lực theo ' + (window.FACTION_DATA?.world?.era || "Kỷ Nguyên hiện tại") + '</small></div>' +
      '<div class="world-map world-overview"><svg viewBox="0 0 100 100" preserveAspectRatio="none">' + routes + '</svg>' + regions + factions + guildPins + '</div>' +
      '<p class="map-legend"><span class="dot current"></span> Vùng hiện tại <span class="dot righteous"></span> Chính <span class="dot evil"></span> Tà <span class="dot neutral"></span> Trung lập</p>' +
      '<div class="section-title">Thế lực quanh ' + (regionById[currentRegionId]?.name || "khu vực") + '</div>' + factionList;
  }

  function renderLocalMap(state, data, map) {

    const visited = new Set(state.visitedLocations || [state.locationId]);
    const current = data.LOCATIONS[state.locationId];
    const exits = current?.exits || {};
    const directionByTarget = {};
    Object.entries(exits).forEach(([direction, target]) => { directionByTarget[target] = direction; });

    const edges = [];
    const edgeKeys = new Set();
    Object.entries(data.LOCATIONS).forEach(([from, location]) => {
      Object.values(location.exits || {}).forEach((to) => {
        if (!map.locations[from] || !map.locations[to]) return;
        const key = [from, to].sort().join("|");
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push([from, to]);
        }
      });
    });

    const lines = edges.map(([from, to]) => {
      const a = map.locations[from];
      const b = map.locations[to];
      const explored = visited.has(from) && visited.has(to) ? " explored" : "";
      return '<line class="map-path' + explored + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    }).join("");

    const nodes = Object.entries(map.locations).map(([id, point]) => {
      const location = data.LOCATIONS[id];
      if (!location) return "";
      const direction = directionByTarget[id];
      const isCurrent = id === state.locationId;
      const isVisited = visited.has(id);
      const isReachable = Boolean(direction);
      const classes = ["map-node"];
      if (isCurrent) classes.push("current");
      else if (isReachable) classes.push("reachable");
      else if (isVisited) classes.push("visited");
      else classes.push("unknown");
      const label = isVisited || isReachable ? location.name : "Chưa khám phá";
      const action = direction ? ' data-map-dir="' + direction + '" title="Đi tới ' + location.name + '"' : "";
      return '<button class="' + classes.join(" ") + '" style="left:' + point.x + '%;top:' + point.y + '%"' + action + '>' + label + '</button>';
    }).join("");

    const currentPoint = map.locations[state.locationId];
    const region = map.regions.find((item) => item.id === currentPoint?.region);
    return '<div class="map-heading"><b>' + map.name + '</b><small>' + (region ? region.name + " — " + region.desc : "") + '</small></div>' +
      '<div class="world-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + '</svg>' + nodes + '</div>' +
      '<p class="map-legend"><span class="dot current"></span> Hiện tại <span class="dot reachable"></span> Có thể đi <span class="dot visited"></span> Đã khám phá</p>';
  }

  return {
    showScreen, addStory, clearStory, renderChoices, clearChoices, renderActions,
    setLocation, setSaveIndicator, renderPanel, setMapView
  };
})();
