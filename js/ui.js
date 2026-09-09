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

  function addStory(cls, text, portrait, timestamp) {
    const log = document.getElementById("story-log");
    // Story rendering is best-effort. A tab/modal transition can briefly
    // remove the panel; never let that abort the action render pipeline.
    if (!log) return false;
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
    if (timestamp) {
      const time = document.createElement("small");
      time.className = "story-time";
      time.textContent = "[" + timestamp + "]";
      wrap.appendChild(time);
    }
    wrap.appendChild(p);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return true;
  }

  function renderStoryWindow(entries, visibleCount, onLoadMore) {
    const log = document.getElementById("story-log");
    if (!log) return false;
    log.innerHTML = "";
    const list = Array.isArray(entries) ? entries : [];
    const count = Math.max(1, Number(visibleCount) || 20);
    const start = Math.max(0, list.length - count);
    if (start > 0) {
      const older = document.createElement("button");
      older.type = "button";
      older.className = "story-load-more";
      older.textContent = "↑ Xem thêm lịch sử (" + start + " dòng cũ hơn)";
      older.addEventListener("click", onLoadMore);
      log.appendChild(older);
    }
    list.slice(start).forEach((entry) => addStory(entry.type || "narr", entry.text, entry.portrait, entry.clock));
    log.scrollTop = log.scrollHeight;
    return true;
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

  function actionPresentation(state) {
    const ctx = window.GameEngine.contextState(state);
    const basePriority = {
      act_nhin: 130, act_tu_luyen: 120, act_tim_kiem: 124, act_nghi_ngoi: 95,
      act_hanh_trang: 110, act_tu_luyen_tu_dong: 76, act_be_quan: 74,
      act_dot_pha: 72, act_nhiem_vu: 70, act_ban_do: 65, act_cong_phap: 62,
      act_tim_tong_mon: 92, act_trang_thai: 55, act_to_chuc: 50, act_menh: 48, act_giup: 5,
      act_tan_cong_thuong: 150, act_bo_chay: 130
    };
    const category = (id) => id.startsWith("act_move_") ? "movement"
      : id.startsWith("act_talk_") ? "social"
        : id.startsWith("act_skill_") || id === "act_tan_cong_thuong" || id === "act_bo_chay" ? "combat"
          : id === "act_tim_kiem" ? "interaction"
            : ["act_hanh_trang", "act_trang_thai", "act_ban_do", "act_cong_phap", "act_menh", "act_nhiem_vu", "act_to_chuc", "act_tim_tong_mon", "act_giup"].includes(id) ? "utility" : "core";
    const score = (action) => {
      let value = basePriority[action.id] ?? 80;
      if (action.id.startsWith("act_move_")) value = 115;
      if (action.id.startsWith("act_talk_")) value = 128;
      if (action.id.startsWith("act_skill_")) value = 140;
      if (action.id.startsWith("act_ritual_")) value = 145;
      if (action.id.startsWith("act_search_")) value = 146;
      if (action.id === "act_dot_pha" && !action.disabled_reason) value = 138;
      if (action.id === "act_nghi_ngoi" && Number(state.flags?.fledUntilTurn || 0) > Number(state.meta?.turn || 0)) value = 136;
      if (action.disabled_reason || action.disabled) value -= 80;
      return value;
    };
    const sorted = (ctx.actions || []).map((action, index) => ({
      ...action,
      category: action.category || category(action.id),
      effectivePriority: score(action),
      _sourceIndex: index
    })).sort((a, b) => b.effectivePriority - a.effectivePriority || a._sourceIndex - b._sourceIndex);
    if (ctx.forced) return { context: ctx, quick: sorted, overflow: [] };
    const caps = { social: 1, combat: 5, movement: 3 };
    const counts = {};
    const quick = [];
    const overflow = [];
    sorted.forEach((action) => {
      const cap = caps[action.category] ?? Infinity;
      if (quick.length < 8 && (counts[action.category] || 0) < cap) {
        quick.push(action);
        counts[action.category] = (counts[action.category] || 0) + 1;
      } else {
        overflow.push(action);
      }
    });
    return { context: ctx, quick, overflow };
  }

  function renderActions(state, onAction) {
    const box = document.getElementById("action-list");
    if (!box || !window.GameEngine.contextState) return;
    box.innerHTML = "";
    const presentation = actionPresentation(state);
    const makeButton = (action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "action-chip action-category-" + action.category + (action.priority === 0 ? " danger" : "");
      btn.textContent = action.label;
      if (action.description) btn.title = action.description;
      if ((action.disabled_reason || action.disabled) && !action.open_only) {
        btn.disabled = true;
        btn.title = action.disabled_reason || "Chưa sẵn sàng";
      }
      btn.addEventListener("click", () => { box.querySelectorAll("details.action-more").forEach((menu) => { menu.open = false; }); onAction(action); });
      return btn;
    };
    presentation.quick.forEach((action) => box.appendChild(makeButton(action)));
    if (!presentation.overflow.length) return;
    const more = document.createElement("details");
    more.className = "action-more";
    const summary = document.createElement("summary");
    summary.className = "action-more-trigger";
    summary.textContent = "⋯ Thêm";
    summary.setAttribute("aria-label", "Mở các hành động khác");
    more.appendChild(summary);
    const menu = document.createElement("div");
    menu.className = "action-more-menu";
    presentation.overflow.forEach((action) => menu.appendChild(makeButton(action)));
    more.appendChild(menu);
    box.appendChild(more);
  }

  function renderOriginChoice(state) {
    const profiles = window.GameEngine.originOptions();
    const cards = Object.entries(profiles).map(([type, profile]) => {
      const specializations = Object.entries(profile.specializations).map(([id, specialization], index) => {
        const modifiers = { ...profile.baseModifiers };
        Object.entries(specialization.modifiers || {}).forEach(([key, value]) => { modifiers[key] = Number(modifiers[key] || 0) + Number(value || 0); });
        const modifierLabels = { combatDamagePct: "Sát thương", maxStaminaPct: "Thể lực", cultivationSpeedPct: "Tu luyện", maxQiPct: "Linh Khí", qiRecoveryPct: "Hồi Linh Khí", searchDiscoveryPct: "Khám phá", searchRarePct: "Cơ duyên hiếm", searchRiskReductionPct: "Giảm rủi ro", fortuneFlat: "Khí Vận" };
        const modifierText = Object.entries(modifiers).map(([key, value]) => (modifierLabels[key] || "Hiệu ứng xuất thân") + " " + (Number(value) > 0 ? "+" : "") + value + (key === "fortuneFlat" ? "" : "%")).join(" · ");
        return '<label class="origin-specialization"><input type="radio" name="origin-specialization" value="' + escapeHtml(type + ":" + id) + '"' + (type === "tan_tu" && index === 0 ? " checked" : "") + '><span><b>' + escapeHtml(specialization.name) + '</b><small>' + escapeHtml(modifierText) + '</small></span></label>';
      }).join("");
      return '<section class="origin-choice-card origin-' + escapeHtml(type) + '"><h3>' + escapeHtml(profile.name) + '</h3><p>' + escapeHtml(profile.description) + '</p><div class="origin-specializations">' + specializations + '</div></section>';
    }).join("");
    return '<div class="origin-choice"><p class="muted">Xuất thân quyết định passive, tài nguyên đầu game và trait lâu dài. Lựa chọn chỉ xác nhận một lần.</p><div class="origin-choice-grid">' + cards + '</div><button type="button" class="btn btn-primary origin-confirm" data-origin-confirm>Xác nhận xuất thân</button></div>';
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
    else if (active === "world") html = renderWorld(state);
    else if (active === "oddities") html = renderOddities(state);
    else if (active === "expansion") html = renderExpansion(state);
    else if (active === "market") html = renderMarket(state);
    else if (active === "qintian") html = renderQintian(state);
    else if (active === "cauldron") html = renderCauldron(state);
    document.getElementById("tab-content").innerHTML = html;
  }

  function expansionButton(command, label, arg = "", extra = "") {
    return '<button class="guild-action" data-expansion-command="' + escapeHtml(command) + '" data-expansion-arg="' + escapeHtml(arg) + '" ' + extra + '>' + escapeHtml(label) + '</button>';
  }

  function renderWorld(state) {
    const E = window.GameEngine, s = E.expansionSummary ? E.expansionSummary(state) : null;
    if (!s) return '<p class="muted">Chưa nạp dữ liệu Thế Giới.</p>';
    const event = s.event ? '<div class="detail-block"><b>☄ ' + escapeHtml(s.event.name || "Dị Triều") + '</b><br>Pha hiện tại: ' + escapeHtml(s.event.phase || "đang diễn ra") + ' · kết thúc ngày ' + s.event.phaseEndsDay + '</div>' : '<p class="muted">Khu vực hiện không có Dị Triều.</p>';
      const weatherLabel = window.GameI18n?.weather ? window.GameI18n.weather(s.weather) : s.weather;
      const preview = window.GameEngine.worldModifierPreview?.(state) || {};
      const professionId = state.professionState?.primaryId; const professionName = window.EXPANSION_DATA?.professionDefinitions?.[professionId]?.name || window.EXPANSION_DATA?.hiddenProfessions?.[professionId]?.name || "Chưa chọn"; const professionStage = Number(state.professionState?.professions?.[professionId]?.masteryStage || 0);
      const contracts = (s.contracts || []).map((contract) => '<div class="item-row"><b>' + escapeHtml(window.GameI18n?.formatContract(contract) || "Khế Ước") + '</b><small> · ' + escapeHtml(window.GameI18n?.formatTarget(contract, state) || "Mục tiêu theo dấu") + ' · hết hạn ngày ' + Number(contract.expiresDay || 0) + '</small>' + expansionButton("contract_accept", "Nhận khế ước", contract.id) + '</div>').join("") || '<p class="muted">Chưa có khế ước mới.</p>';
      return '<div class="section-title">Thế Sự · Ngày ' + s.day + '</div><div class="detail-block"><div class="kv"><span>Mùa</span><b>' + escapeHtml(s.season.name) + '</b></div><div class="kv"><span>Thời tiết</span><b>' + escapeHtml(weatherLabel) + '</b></div><small>Ảnh hưởng hiện tại: Tu luyện ×' + Number(preview.cultivationMult || 1).toFixed(2) + ' · Nguy cơ di chuyển ' + (Number(preview.travelRiskDelta || 0) * 100).toFixed(0) + '% · Tìm kiếm ' + (Number(preview.searchRewardMult || 1) * 100).toFixed(0) + '% thưởng</small></div>' + event + '<div class="section-title">Khế Ước Khu Vực</div>' + contracts + '<div class="section-title">Chiến Sự & Đại Hội</div><p>Chiến sự đang hoạt động: ' + s.wars.length + '</p><div class="detail-block"><b>Nghề chính: ' + escapeHtml(professionName) + '</b><small> · Bậc ' + professionStage + ' · mở hồ sơ tại panel Nhân Vật</small></div><div class="item-actions"><button class="guild-action" data-expansion-modal="guild-project">Công Trình Tông Môn</button><button class="guild-action" data-expansion-modal="opportunity">Xem Cơ Duyên</button></div>';
  }
  function renderProfessionSection(state) {
    const base = Object.values(window.EXPANSION_DATA?.professionDefinitions || {});
    const hidden = Object.values(window.EXPANSION_DATA?.hiddenProfessions || {}).filter((definition) => window.GameEngine.professionAvailability?.(state, definition.id)?.visible);
    let defs = base.concat(hidden);
    const lockedIds = new Set([state.professionState?.primaryId, state.professionState?.secondaryId].filter(Boolean));
    if (state.professionState?.selectionLocked) defs = defs.filter((definition) => lockedIds.has(definition.id));
    const items = Object.values({ ...(window.EXPANSION_DATA?.professionItems || {}), ...(window.PROFESSION_ITEMS || {}) });
    const selectionLabel = state.professionState?.selectionLocked ? "Bộ nghề đã khóa vĩnh viễn" : state.professionState?.primaryId ? "Còn 1 lượt chọn nghề phụ" : "Chưa chọn nghề chính";
    const rows = defs.map((definition) => {
      const availability = window.GameEngine.professionAvailability?.(state, definition.id) || { visible: true, selectable: false, reason: "Chưa sẵn sàng." };
      const record = state.professionState?.professions?.[definition.id];
      const role = state.professionState?.primaryId === definition.id ? "Nghề chính" : state.professionState?.secondaryId === definition.id ? "Nghề phụ" : "Chưa chọn";
      const choose = availability.selectable ? expansionButton("profession_choose", availability.slot === "primaryId" ? "Chọn nghề chính" : "Chọn nghề phụ", definition.id) : '<button class="guild-action" disabled title="' + escapeHtml(availability.reason) + '">' + escapeHtml(role) + '</button>';
      const practice = availability.selected ? expansionButton("profession_practice", "Rèn luyện", definition.id) : "";
      const localNpc = (window.GameData.LOCATIONS?.[state.locationId]?.npcs || [])[0];
      const signature = !availability.selected ? "" : definition.id === "luyen_dan" ? expansionButton("brew", "Luyện Đan · 3 Linh Thạch", "tu_khi_dan") : definition.id === "luyen_khi" ? expansionButton("craft", "Luyện Pháp Khí · 8 Linh Thạch") : definition.id === "tran_phap" ? expansionButton("formation", "Đặt Tụ Linh Trận · 5 Linh Thạch", "gather") : definition.id === "tuong_su" && localNpc ? expansionButton("read_npc", "Xem Tướng", localNpc) : "";
      const hiddenAction = availability.selected && definition.actionName ? expansionButton("hidden_profession_action", definition.actionName, definition.id) : "";
      return '<div class="item-row"><b>' + escapeHtml(definition.name) + '</b><small> · ' + escapeHtml(role) + ' · Thục luyện bậc ' + Number(record?.masteryStage || 0) + (definition.description ? '<br>' + escapeHtml(definition.description) : '') + '</small><div class="item-actions">' + choose + practice + signature + hiddenAction + '</div></div>';
    }).join("");
    const itemRows = items.map((item) => {
      const quantity = Number(state.inventory?.[item.id] || 0); const record = state.professionItemState?.[item.action || item.id];
      const chargeText = record ? Number(record.charges || 0) + '/' + Number(item.charges || 1) : Number(item.charges || 1) + '/' + Number(item.charges || 1);
      return '<div class="item-row"><b>' + escapeHtml(item.name) + '</b><small> · ' + escapeHtml(item.desc) + ' · Sở hữu: ' + quantity + ' · Linh lực: ' + chargeText + '</small>' + (quantity ? '<div class="item-actions">' + expansionButton("profession_item_use", "Sử dụng", item.id) + expansionButton("profession_item_recharge", "Bổ sung linh lực", item.id) + '</div>' : '') + '</div>';
    }).join("");
    return '<div class="section-title">Nghề Nghiệp</div><p class="muted">' + selectionLabel + '</p>' + rows + '<div class="section-title">Vật phẩm chuyên nghề</div>' + itemRows;
  }
  function renderTechniqueEvolutionSection(state) { const techniques = window.GameEngine.getKnownTechniques(state) || []; return '<div class="section-title">Công Pháp Tiến Hóa</div>' + techniques.map((t) => { const info = window.GameEngine.techniqueDisplayInfo?.(state, t.id); return '<div class="item-row"><b>' + escapeHtml(info?.name || t.name) + '</b><small> · ' + escapeHtml(info?.statusLabel || 'Chưa mở thí luyện') + ' · ' + escapeHtml(info?.progressLabel || 'Chưa học') + '</small></div>'; }).join(''); }
  function renderFateEvolutionModal(state, fateId) {
    const id = fateId || state.player?.fates?.[0]; const evolution = state.player?.fateEvolutions?.[id];
    const candidates = evolution?.status === "ready" ? (evolution.candidateBranchIds || []).map((branchId) => { const preview = window.GameEngine.fateEvolutionPreview?.(state, id, branchId); if (!preview?.success) return ""; const branch = preview.branch; return '<div class="item-row"><b>' + escapeHtml(branch.name) + '</b><small> · ' + escapeHtml(branch.description) + '<br>Giá: ' + preview.costs.essence + ' Mệnh Tinh Hoa · ' + preview.costs.merit + ' Công Đức · ' + preview.costs.san + ' Thanh Tỉnh</small><div class="item-actions">' + expansionButton("fate_evolve", branch.dangerous ? "Xác nhận Nghịch Diễn" : "Chọn nhánh", id, 'data-expansion-arg2="' + escapeHtml(branchId) + '"') + '</div></div>'; }).join("") : "";
    return '<div class="section-title">Mệnh Số Tiến Hóa</div><p>Trạng thái: <b>' + escapeHtml(window.GameI18n?.formatStatus(evolution?.status || "locked") || "Chưa mở") + '</b></p><p>Tiến độ: ' + Number(evolution?.progress || 0) + '</p>' + candidates + renderFateDetail(state);
  }
  function renderGuildProjectModal(state) {
    const project = state.guildProject; const templates = window.EXPANSION_DATA?.guildProjects || []; const template = project && templates.find((item) => item.id === project.templateId);
    const suspended = Boolean(project?.status === "active" && (!state.guildMembership || state.guildMembership.guildId !== project.guildId));
    const choices = templates.map((item) => '<div class="item-row"><b>' + escapeHtml(item.name || "Công trình") + '</b><small> · Mục tiêu ' + Number(item.target || 0) + ' đóng góp · thời hạn ' + Number(item.durationDays || 0) + ' ngày</small><div class="item-actions">' + expansionButton('guild_start', 'Khởi công', item.id) + '</div></div>').join('');
    const recent = (state.guildProjectHistory || []).slice(0, 3).map((entry) => { const oldTemplate = templates.find((item) => item.id === entry.templateId); return '<div class="item-row"><b>' + escapeHtml(oldTemplate?.name || "Công trình cũ") + '</b><small> · ' + escapeHtml(window.GameI18n?.formatStatus(entry.status) || "Đã lưu") + ' · tiến độ ' + Number(entry.progress || 0) + '/' + Number(oldTemplate?.target || 0) + '</small></div>'; }).join("");
    return '<div class="section-title">Công Trình Tông Môn</div>' + (project ? '<div class="detail-block"><b>' + escapeHtml(template?.name || "Công trình đang xây dựng") + '</b><p>Tiến độ: ' + Number(project.progress || 0) + '/' + Number(template?.target || 0) + '</p><p>Đóng góp cá nhân: ' + Number(project.playerContributions?.linh_thach || 0) + ' Linh Thạch</p><p>Hạn ngày: ' + Number(project.endDay || 0) + '</p><p>Trạng thái: ' + escapeHtml(suspended ? "Dự án bị đình chỉ" : window.GameI18n?.formatStatus(project.status) || "Đang chờ") + '</p><p>Phần thưởng: ' + escapeHtml(template?.reward?.cultivationMult ? "Gia trì tu luyện" : template?.reward?.sanDrainMult ? "Hộ tâm giảm hao Thanh Tỉnh" : "Thí luyện truyền thừa") + '</p><div class="item-actions">' + (project.status === "active" && !suspended ? expansionButton("guild_contribute", "Đóng góp 5 Linh Thạch", "5") : "") + '</div></div>' : '<p class="muted">Chưa có công trình đang hoạt động.</p><div class="detail-block">' + choices + '</div>') + (recent ? '<div class="section-title">Lịch sử gần nhất</div>' + recent : '');
  }
  function renderContestedOpportunityModal(state) {
    const opportunity = state.pendingContestedOpportunity; const rival = opportunity && (window.GameData.NPCS?.[opportunity.rivalId]?.name || window.GameI18n?.formatTarget(opportunity.rivalId, state) || "đối thủ ẩn danh"); const location = opportunity && (window.GameData.LOCATIONS?.[opportunity.nodeId]?.name || window.GameI18n?.formatTarget(opportunity.nodeId, state) || "địa điểm chưa rõ");
    if (!opportunity) return '<div class="section-title">Cơ Duyên Tranh Đoạt</div><p class="muted">Hiện không có cơ duyên tranh đoạt.</p>';
    const fallbackChoices = { fight: { label: "Cường Đoạt", reward: opportunity.reward, consequence: "Thất bại sẽ bị thương." }, scheme: { label: "Dùng Mưu", reward: opportunity.reward, consequence: "Thành bại dựa trên Ngộ tính." }, share: { label: "Chia Sẻ", reward: Math.ceil(Number(opportunity.reward || 0) / 2), consequence: "Giảm thưởng, tăng thiện duyên." } };
    const choices = Object.entries(opportunity.choices || fallbackChoices).map(([id, choice]) => '<div class="item-row"><b>' + escapeHtml(choice.label) + '</b><small> · Thưởng ' + Number(choice.reward || 0) + ' Linh Thạch · ' + escapeHtml(choice.consequence) + '</small>' + expansionButton("opportunity", choice.label, id) + '</div>').join("");
    return '<div class="section-title">Cơ Duyên Tranh Đoạt</div><div class="detail-block"><p>Địa điểm: <b>' + escapeHtml(location) + '</b></p><p>Đối thủ: <b>' + escapeHtml(rival) + '</b></p><p>Hết hạn ngày: ' + Number(opportunity.expiresDay || 0) + '</p>' + choices + '</div>';
  }
  function renderOddities(state) {
    const E = window.GameEngine, s = E.expansionSummary ? E.expansionSummary(state) : null, defs = window.EXPANSION_DATA?.codexDefinitions || [];
    if (!s) return '<p class="muted">Chưa nạp dữ liệu Dị Chí.</p>';
    const codex = defs.map((definition) => {
      const record = s.codex?.[definition.id]; const status = record?.status || "unknown"; let actions = "";
      if (status === "unknown") actions = expansionButton("codex", "Điều Tra", definition.id, 'data-expansion-arg2="investigate"');
      else if (status === "revealed" && !(record?.clues || []).includes("lore:" + definition.id)) actions = expansionButton("codex", "Đọc Cổ Tịch", definition.id, 'data-expansion-arg2="read"');
      else if (status === "revealed") actions = expansionButton("codex", "Giải Mật · Đối Chiếu", definition.id, 'data-expansion-arg2="decrypt"');
      else if (status === "verified") actions = expansionButton("codex", "Thu Thập", definition.id, 'data-expansion-arg2="collect"');
      return '<div class="item-row"><b>' + escapeHtml(definition.name) + '</b><small> · ' + escapeHtml(window.GameI18n?.formatStatus(status) || "Chưa biết") + ' · Manh mối ' + Number(record?.clues?.length || 0) + '</small><div class="item-actions">' + actions + '</div></div>';
    }).join('');
    const collectionCount = Object.values(s.collections || {}).reduce((n, b) => n + Object.keys(b || {}).length, 0);
    const hidden = Object.entries(window.EXPANSION_DATA?.hiddenProfessions || {}).map(([id, def]) => { const progress = state.hiddenProfessionState?.branches?.[id] || 0; const unlocked = state.hiddenProfessionState?.unlocked?.[id]; return '<div class="item-row"><b>' + escapeHtml(def.name) + '</b><small> · Nhánh manh mối: ' + progress + '/3 · ' + (unlocked ? "Đã mở con đường" : "Chưa giải xong") + '</small>' + (s.codexProgress >= Number(def.requiresCodex || 7) && !unlocked ? '<div class="item-actions">' + expansionButton('hidden_clue', 'Điều Tra', id, 'data-expansion-arg2="lead"') + expansionButton('hidden_clue', 'Đối Chiếu', id, 'data-expansion-arg2="crosscheck"') + expansionButton('hidden_clue', 'Giải Mật · Mở Con Đường', id, 'data-expansion-arg2="unlock"') + '</div>' : '') + '</div>'; }).join('');
    const collectionLabels = { beasts: "Dị Thú", npcs: "NPC", entities: "Thực Thể", rareNpcs: "NPC Hiếm" };
    const collections = Object.entries(collectionLabels).map(([type, label]) => { const entries = Object.values(s.collections?.[type] || {}); return '<div class="section-title">' + label + '</div>' + (entries.map((entry) => '<div class="item-row"><b>' + escapeHtml(entry.name || "Chưa định danh") + '</b><small> · ' + escapeHtml(entry.rarity || "thường") + ' · gặp ngày ' + Number(entry.firstSeenDay || 0) + ' tại ' + escapeHtml(window.GameI18n?.formatTarget(entry.firstRegionId, state) || "khu vực chưa rõ") + ' · ' + (entry.rewardClaimed ? "Đã nhận thưởng" : "Không có thưởng hiếm") + '</small></div>').join("") || '<p class="muted">Chưa ghi nhận.</p>'); }).join("");
    return '<div class="section-title">Dị Chí · Khám phá</div><p class="muted">Cổ Tịch đã thu thập: ' + s.codexProgress + '/7 · Mục sưu tầm: ' + collectionCount + '</p><div class="detail-block">' + codex + '</div><div class="section-title">Con đường nghề ẩn</div>' + hidden + '<div class="section-title">Sưu Tầm</div>' + collections + '<div class="section-title">Thành tựu</div><p>' + (Object.values(s.achievements || {}).map((a) => '✦ ' + escapeHtml(a.name)).join('<br>') || "Chưa mở thành tựu.") + '</p>';
  }
  function renderExpansion(state) {
    // Cầu nối tương thích duy nhất: nội dung chi tiết nằm ở các tab chuyên biệt.
    return renderWorld(state) + '<div class="detail-block"><b>Dị Chí và Nhân Duyên đã được tách riêng</b><br><small>Mở đúng tab để xem manh mối, sưu tầm hoặc quan hệ.</small></div>';
  }
  function renderMarket(state) {
    const offers = window.GameEngine.marketOffers(state);
    const expansionSummary = window.GameEngine.expansionSummary ? window.GameEngine.expansionSummary(state) : { auctionLots: [] };
    const auctionLots = (expansionSummary.auctionLots || []).map((lot) => '<article class="market-card"><b>' + escapeHtml(window.GameData.ITEMS[lot.itemId]?.name || "Vật phẩm đấu giá") + '</b><small>Giá hiện tại ' + lot.currentBid + ' · đóng ngày ' + lot.endDay + '</small>' + (lot.status === 'active' ? expansionButton('auction_bid', 'Trả ' + (lot.currentBid + 5), lot.id, 'data-expansion-arg2="' + (lot.currentBid + 5) + '"') : '<small>Đã đóng</small>') + '</article>').join('') || '<p class="muted">Chưa có lô đấu giá.</p>';
    const meritOffers = window.GameEngine.meritFateOffers(state);
    const latest = state.flags?.lastMarketResult ? '<p class="reward-banner">Giao dịch gần nhất: ' + escapeHtml(state.flags.lastMarketResult) + '</p>' : '';
    const meritLatest = state.flags?.lastMeritFateResult ? '<p class="reward-banner">' + escapeHtml(state.flags.lastMeritFateResult) + '</p>' : '';
    const meritSection = '<div class="section-title">Đổi Công Đức lấy Mệnh Số</div><p class="muted">Công Đức hiện có: <b>' + Number(state.player.merit || 0) + '</b> · Mệnh nhận được đưa vào Mệnh Kho hoặc chờ xử lý nếu kho đầy.</p>' + meritLatest + '<div class="market-grid">' + meritOffers.map((offer) => '<article class="market-card fate-card grade-' + escapeHtml(offer.fate.grade) + '"><b>' + escapeHtml(offer.fate.name) + '</b><small>' + escapeHtml(offer.fate.gradeLabel || offer.fate.grade) + ' · Cát · ' + offer.fate.score + ' điểm</small><button class="guild-action" data-merit-fate="' + escapeHtml(offer.fate.id) + '">Đổi · ' + offer.merit + ' Công Đức</button></article>').join("") + '</div>';
    return '<div class="section-title">Phường thị · Mệnh Số, Đan dược, Trang bị</div><p class="muted">Hàng hóa tự đổi mỗi 60 giây · mua bằng Linh thạch.</p>' + latest + '<div class="market-grid">' + offers.map((offer) => { const item = offer.kind === "fate" ? window.GameData.FATE_PATTERNS.find((f) => f.id === offer.id) : window.GameData.ITEMS[offer.id]; return '<article class="market-card"><b>' + escapeHtml(item?.name || "Vật phẩm chưa định danh") + '</b><small>' + escapeHtml(item?.gradeLabel || item?.desc || "Hàng hóa đặc biệt") + '</small><button class="guild-action" data-market-offer="' + escapeHtml(offer.id) + '" data-market-kind="' + offer.kind + '">Mua · ' + offer.price.linhThach + ' Linh thạch</button></article>'; }).join("") + '</div>' + meritSection + '<div class="section-title">Đấu Giá</div><div class="market-grid">' + auctionLots + '</div>';
  }

  function renderQintian(state) {
    const stock = window.GameEngine.qintianFateOffers(state);
    return '<div class="section-title">Khâm Thiên Giám</div><p class="muted">Hiến tế 10 năm Thọ Nguyên để cầu một Mệnh Số. Mệnh Kho phải còn chỗ.</p><div class="market-grid">' + stock.map((f) => '<article class="market-card fate-card grade-' + f.grade + '"><b>' + escapeHtml(f.name) + '</b><small>' + escapeHtml(f.gradeLabel || f.grade) + ' · Cát · Hiệu quả +' + f.score + '</small><button class="guild-action" data-qintian-fate="' + escapeHtml(f.id) + '">Hiến tế · 10 năm</button></article>').join("") + '</div>';
  }

  function renderBlackMarket(state) {
    const offers = window.GameEngine.blackMarketOffers(state);
    return '<div class="section-title">Nghịch Thương Nhân · Chợ đen</div><p class="muted">Mỗi lần gặp sẽ làm mới 3 Mệnh Số ngẫu nhiên cấp 2–8. Giá tăng theo cấp, trả bằng Thọ Nguyên; Mệnh nhận được đưa vào Mệnh Kho hoặc chờ xử lý.</p><div class="market-grid">' + offers.map((offer) => '<article class="market-card fate-card grade-' + escapeHtml(offer.fate.grade) + '"><b>' + escapeHtml(offer.fate.name) + '</b><small>Cấp ' + offer.tier + ' · ' + escapeHtml(offer.fate.gradeLabel || offer.fate.grade) + ' · Điểm ' + offer.fate.score + '</small><button class="guild-action danger" data-black-market-fate="' + escapeHtml(offer.fate.id) + '">Đổi · ' + offer.lifespan + ' năm Thọ Nguyên</button></article>').join("") + '</div>';
  }

  // Khâm Thiên Giám dùng hai banner gacha độc lập, không hiển thị Mệnh Số để mua trực tiếp.
  function renderQintian(state) {
    const offers = window.GameEngine.qintianFateOffers(state);
    const latest = state.flags?.lastQintianResult ? '<p class="reward-banner">Kết quả gần nhất: ' + escapeHtml(state.flags.lastQintianResult) + '</p>' : '';
    return '<div class="section-title">Khâm Thiên Giám</div><p class="muted">Hai nghi thức độc lập: mỗi lần hiến tế đều roll ngẫu nhiên theo phẩm trật Mệnh Số chiếm đa số.</p>' + latest + '<div class="market-grid">' + offers.map((offer) => '<article class="market-card fate-card"><b>' + escapeHtml(offer.label) + '</b><small>' + escapeHtml(offer.desc) + '<br>Neo phẩm: ' + escapeHtml(offer.dominantGrade) + '</small><button class="guild-action" data-qintian-method="' + escapeHtml(offer.method) + '">Hiến ' + offer.cost + ' năm · Gacha</button></article>').join('') + '</div>';
  }

  function renderCauldron(state) {
    return '<div class="section-title">Hư Thiên Đỉnh</div><p class="muted">Chọn thủ công 3–9 đơn vị. <b>Chọn nhanh chỉ lấy vật liệu an toàn</b>; Linh Thạch, đan dược, vật đang trang bị và vật phẩm nhiệm vụ luôn bị bỏ qua. Không có thao tác nào tự tiêu hao cho tới khi bấm Dung Luyện và xác nhận.</p><div class="cauldron-toolbar" data-cauldron-selection><b>Tổng đơn vị: <span data-cauldron-count>0</span>/9</b><span class="cauldron-summary" data-cauldron-summary>Chưa chọn nguyên liệu</span><button class="guild-action" data-cauldron-auto>Chọn nhanh vật liệu an toàn</button><button class="guild-action" data-cauldron-clear>Bỏ chọn</button><button class="guild-action" data-cauldron-refine disabled>Dung Luyện</button></div>' + (state.flags?.lastCauldronResult ? '<p class="reward-banner">Kết quả gần nhất: ' + escapeHtml(state.flags.lastCauldronResult) + '</p>' : '') + renderInventory(state, { selectable: true });
  }

  function bar(label, value, max, cls, help) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return '<div class="kv">' + helpLabel(label, help) + '<b>' + value + "/" + max + "</b></div>" +
      '<div class="' + cls + '"><span style="width:' + pct + '%"></span></div>';
  }

  const EFFECT_LABELS = {
    phy: "Thể phách", mag: "Linh lực", phyMult: "Thể phách", magMult: "Linh lực",
    allStatMult: "Toàn bộ chỉ số", qiFlat: "Linh khí", fortune: "Khí vận",
    sanResist: "Kháng hao Thanh Tỉnh", sanDrainMult: "Hao Thanh Tỉnh", breakBonus: "Tỷ lệ đột phá",
    lootMult: "Tỷ lệ chiến lợi phẩm", lifespanBonus: "Thọ nguyên", phyDef: "Phòng ngự",
    hpRegen: "Hồi phục khí huyết", resistPossession: "Kháng đoạt xá", sanShield: "Lá chắn Thanh Tỉnh",
    heal: "Hồi khí huyết", exp: "Tu vi", san: "Thanh Tỉnh", manaCost: "Tốn Linh khí",
    staminaCost: "Tốn Thể lực", sanCost: "Tốn Thanh Tỉnh", lifespanCost: "Tốn Thọ nguyên", corruptionCost: "Tăng Tà Nhiễm"
  };
  const EFFECT_HELP = {
    phy: "Mức cộng thẳng vào Thể phách.", mag: "Mức cộng thẳng vào Linh lực.", phyMult: "Tỷ lệ tăng hoặc giảm Thể phách.", magMult: "Tỷ lệ tăng hoặc giảm Linh lực.", allStatMult: "Tỷ lệ điều chỉnh đồng thời Thể phách và Linh lực.", qiFlat: "Linh khí cộng thêm vào năng lực vận hành.", fortune: "Điều chỉnh Khí vận và cơ duyên.", sanResist: "Giảm lượng Thanh Tỉnh bị tà niệm bào mòn.", sanDrainMult: "Điều chỉnh lượng Thanh Tỉnh mất khi chịu tà niệm.", breakBonus: "Gia tăng xác suất phá cảnh thành công.", lootMult: "Hệ số cơ hội hoặc số lượng chiến lợi phẩm.", lifespanBonus: "Số năm Thọ nguyên cộng thêm.", phyDef: "Giảm tổn thương vật lý phải nhận.", hpRegen: "Cho phép tự hồi Khí Huyết.", resistPossession: "Khả năng chống đoạt xá và xâm chiếm thần hồn.", sanShield: "Chặn một lần tổn thất Thanh Tỉnh.", heal: "Tỷ lệ Khí Huyết được phục hồi.", exp: "Tu vi nhận được.", san: "Lượng Thanh Tỉnh thay đổi.", manaCost: "Linh khí tiêu hao khi thi triển.", staminaCost: "Thể lực tiêu hao khi thi triển.", sanCost: "Thanh Tỉnh phải trả khi thi triển.", lifespanCost: "Thọ nguyên vĩnh viễn phải trả.", corruptionCost: "Mức Tà Nhiễm phát sinh sau khi thi triển."
  };

  function effectValue(key, value) {
    if (typeof value === "boolean") return value ? "Có" : "Không";
    if (["phyMult", "magMult", "allStatMult", "sanResist", "sanDrainMult", "breakBonus"].includes(key)) return (Number(value) * 100).toFixed(Number(value) * 100 % 1 ? 1 : 0) + "%";
    if (["lootMult", "lightFireMult"].includes(key)) return "×" + value;
    if (key === "heal") return Math.round(Number(value) * 100) + "%";
    if (["manaCost", "staminaCost", "sanCost", "lifespanCost"].includes(key)) return "-" + value;
    return (Number(value) > 0 ? "+" : "") + value;
  }

  function renderEffects(effects) {
    const entries = Object.entries(effects || {}).filter(([, value]) => value !== 0 && value !== false && value != null);
    if (!entries.length) return '<span class="stat-tag neutral">Không cộng chỉ số trực tiếp</span>';
    return entries.map(([key, value]) => '<span class="stat-tag">' + helpLabel(escapeHtml(EFFECT_LABELS[key] || "Hiệu ứng đặc biệt"), EFFECT_HELP[key] || "Chỉ số hiệu dụng của hiệu ứng này.") + ' ' + escapeHtml(effectValue(key, value)) + '</span>').join(" ");
  }

  function helpLabel(label, help) {
    return '<span class="has-help" tabindex="0" data-help="' + escapeHtml(help) + '">' + label + '<i>?</i></span>';
  }

  function breakthroughRequirementGuide(label) {
    const text = String(label || "");
    if (/Tỷ lệ R|R\s*\(/i.test(text)) return "Mở Tử Vi Mệnh Số, ưu tiên trang bị Mệnh Cát/Bình có cộng R hoặc nâng cấp Mệnh đang dùng; tháo Mệnh Hung nếu làm giảm tỷ lệ. Sau đó quay lại nghi thức để engine kiểm tra lại.";
    if (/Điểm tương hợp|tương hợp Con Đường/i.test(text)) return "Vào Mệnh Số, chọn Mệnh có tag dẫn/trợ trùng với Con Đường hiện tại rồi trang bị làm Mệnh dẫn. Có thể đổi Con Đường hoặc nâng cộng hưởng để tăng điểm tương hợp.";
    if (/Mệnh dẫn \+ trợ|Mệnh dẫn.*trợ/i.test(text)) return "Trang bị đủ một Mệnh dẫn và một Mệnh trợ phù hợp; kiểm tra cả hai đang kích hoạt trong Mệnh Kho trước khi tiếp tục nghi thức.";
    if (/Mệnh dẫn/i.test(text)) return "Trang bị một Mệnh có tag dẫn phù hợp với Con Đường hiện tại, giữ nguyên trong suốt nghi thức và kiểm tra trạng thái đang kích hoạt.";
    if (/Neo Nhân Tính/i.test(text)) return "Mở Nghi Thức Đột Phá, đến bước Dựng Neo và chọn một Neo Nhân Tính phù hợp. Giữ Neo nguyên vẹn rồi hoàn tất các bước nghi thức còn lại.";
    if (/Tà Nhiễm|nhiễm/i.test(text)) return "Nghỉ ngơi tại nơi an toàn hoặc dùng vật phẩm thanh tẩy/hồi Thanh Tỉnh; tránh khu vực, vật phẩm và hành động làm tăng Tà Nhiễm rồi kiểm tra lại.";
    if (/Nghi thức Con Đường/i.test(text)) return "Mở nghi thức của Con Đường trong bảng Đột Phá và hoàn tất từng bước đang còn thiếu trước khi thử đột phá.";
    if (/Nhiệm vụ trận doanh/i.test(text)) return "Gia nhập đúng tông môn/trận doanh, nhận nhiệm vụ tại NPC đại diện và hoàn tất mục tiêu; phần thưởng sẽ được ghi vào lịch sử.";
    if (/Tu vi|Tu Vi|Kinh nghiệm/i.test(text)) return "Tu luyện, tìm kiếm hoặc chiến đấu để tăng Tu Vi đến mức hiển thị bên cạnh điều kiện.";
    if (/Thanh Tỉnh|Tỉnh/i.test(text)) return "Nghỉ ngơi hoặc dùng vật phẩm hồi Thanh Tỉnh, sau đó quay lại nghi thức khi chỉ số đạt mức yêu cầu.";
    if (/Công Pháp|Cốt Lõi/i.test(text)) return "Mở Công Pháp, học công pháp riêng của tông môn hoặc nâng Công Pháp Cốt Lõi đến đúng tầng engine yêu cầu.";
    if (/Đại nghi thức|Quyền Năng|Chân Danh|Nợ/i.test(text)) return "Mở chi tiết điều kiện để xem NPC, nhiệm vụ hoặc tài nguyên liên quan; hoàn tất mục tiêu được chỉ ra rồi thực hiện lại nghi thức.";
    return "Thực hiện hành động gắn với điều kiện này (tu luyện, trang bị hoặc nghi thức tương ứng) cho đến khi giá trị hiện tại đạt mục tiêu.";
  }

  function renderBreakthrough(state) {
    const progress = window.GameEngine.breakthroughRequirements(state);
    if (!progress.next) return '<div class="realm-guide ready"><b>Đã đạt cảnh giới tối thượng</b></div>';
    const currentTitle = window.GameEngine.realmLore(state, progress.current).title;
    const nextTitle = window.GameEngine.realmLore(state, progress.next).title;
    const blockers = window.GameEngine.getBreakthroughBlockers ? window.GameEngine.getBreakthroughBlockers(state) : [];
    const ritual = window.GameEngine.breakthroughRitualStatus ? window.GameEngine.breakthroughRitualStatus(state) : null;
    const ritualNames = { call_fate: "Gọi Mệnh", compare: "Đối Chiếu Con Đường", anchor: "Dựng Neo", omen: "Vượt Dị Tượng", cost: "Trả Giá", trial: "Thử Thách Cuối" };
    const activeGate = ritual?.remaining?.[0];
    const visibleBlockers = blockers.filter((item) => !item.startsWith('Nghi thức'));
    const quickHint = activeGate ? (visibleBlockers.length ? 'Gợi Ý Nhanh: ' + escapeHtml(visibleBlockers.slice(0, 2).join(' · ')) : 'Gợi Ý Nhanh: cổng đã sẵn sàng, hãy thực hiện hành động trên Action Bar.') : '';
    const ritualGuide = ritual && Number(progress.current.level) > 1 ? '<div class="ritual-guide"><b>Nghi thức đột phá · tiến trình</b><ol>' + ritual.plan.map((step) => '<li class="ritual-step ' + (ritual.completed.includes(step) ? 'done' : (ritual.remaining[0] === step ? 'current' : '')) + '">' + escapeHtml(ritualNames[step] || "Bước nghi thức") + '</li>').join('') + '</ol>' + (activeGate ? '<p><b>Cổng hiện tại:</b> ' + escapeHtml(ritualNames[activeGate] || "Bước nghi thức") + '<br>' + quickHint + '</p>' : '') + '<small>Thực hiện lần lượt hành động nghi thức trên thanh hành động.</small></div>' : '';
    return '<div class="realm-guide ' + (progress.ready ? "ready" : "") + '" title="' + escapeHtml(blockers.join("; ")) + '"><div class="realm-route"><b>' + escapeHtml(currentTitle) + '</b><span>→</span><b>' + escapeHtml(nextTitle) + '</b></div>' +
      '<p>Cách thăng cấp: ' + (Number(progress.current.level) === 1 ? 'tu luyện đủ 100 Tu vi rồi chọn <b>Đột Phá</b>, hoặc dùng Thông Mạch Đan/Tụ Khí Đan/Hoán Huyết Đan để khai lộ sớm.' : 'hoàn thành mọi điều kiện bên dưới, sau đó chọn <b>Đột Phá</b>.') + '</p><div class="requirement-grid">' +
      progress.requirements.map((item) => { const guide = breakthroughRequirementGuide(item.label); return '<div class="requirement ' + (item.met ? "met" : "missing") + '"><span>' + (item.met ? "✓" : "○") + ' ' + helpLabel(escapeHtml(item.label), guide) + '</span><b>' + escapeHtml(item.current) + ' / ' + escapeHtml(item.target) + '</b>' + ((!item.met) ? '<button class="help-button" data-breakthrough-help="' + escapeHtml(item.label) + '" data-breakthrough-guide="' + escapeHtml(guide) + '" data-breakthrough-current="' + escapeHtml(item.current) + '" data-breakthrough-target="' + escapeHtml(item.target) + '" title="Xem cách hoàn thành điều kiện">?</button>' : '') + '</div>'; }).join("") +
      '</div>' + ritualGuide + '</div>';
  }

  function renderStatus(state) {
    const p = state.player;
    const s = p.stats;
    const originProfile = p.origin?.type ? window.GameEngine.originOptions?.()[p.origin.type] : null;
    const rootProfile = p.spiritualRootProfile || window.GameEngine.spiritualRootProfile(p);
    const rootGrade = rootProfile.label || p.spiritualRootGrade || window.GameEngine.spiritualRootGrade(p.spiritualRoots);
    const roots = (rootProfile.elements || []);
    const equipment = window.GameEngine.equipmentSummary(state);
    const itemName = (id) => id ? (window.GameData.ITEMS[id]?.name || "Vật phẩm chưa định danh") : "Chưa trang bị";
    const equipmentSlots = [
      { label: "Pháp khí", count: equipment.artifacts.length, max: 2, items: equipment.artifacts, category: "artifact", slot: "", help: "Bảo vật chiến đấu hoặc phụ trợ; mọi chỉ số trên vật phẩm được cộng khi trang bị đúng ô." },
      { label: "Hộ thân · Giáp", count: equipment.protection.armor ? 1 : 0, max: 1, items: equipment.protection.armor ? [equipment.protection.armor] : [], category: "protection", slot: "armor", help: "Vị trí Hộ thân Pháp khí — Giáp; chỉ vật phẩm đang trang bị mới gắn chỉ số vào nhân vật." },
      { label: "Hộ thân · Ngoa", count: equipment.protection.boots ? 1 : 0, max: 1, items: equipment.protection.boots ? [equipment.protection.boots] : [], category: "protection", slot: "boots", help: "Vị trí Hộ thân Pháp khí — Ngoa (giày); chỉ vật phẩm đang trang bị mới gắn chỉ số vào nhân vật." },
      { label: "Hộ thân · Quần", count: equipment.protection.pants ? 1 : 0, max: 1, items: equipment.protection.pants ? [equipment.protection.pants] : [], category: "protection", slot: "pants", help: "Vị trí Hộ thân Pháp khí — Quần; chỉ vật phẩm đang trang bị mới gắn chỉ số vào nhân vật." },
      { label: "Hộ thân · Mũ", count: equipment.protection.helmet ? 1 : 0, max: 1, items: equipment.protection.helmet ? [equipment.protection.helmet] : [], category: "protection", slot: "helmet", help: "Vị trí Hộ thân Pháp khí — Mũ; chỉ vật phẩm đang trang bị mới gắn chỉ số vào nhân vật." },
      { label: "Tùy thân Pháp khí", count: equipment.personal.length, max: 3, items: equipment.personal, category: "personal", slot: "", help: "Bảo vật mang theo để nhận hiệu dụng tiện ích, hỗ trợ hoặc cơ duyên." },
      { label: "Bản mệnh Linh bảo", count: equipment.spiritTreasure.length, max: 1, items: equipment.spiritTreasure, category: "spirit", slot: "", help: "Linh bảo duy nhất liên kết trực tiếp với thần hồn và đạo lộ của mệnh nhân." },
      { label: "Pháp khí Sinh hoạt", count: equipment.lifestyle.length, max: 1, items: equipment.lifestyle, category: "lifestyle", slot: "", help: "Vật dụng hỗ trợ nghỉ ngơi, luyện chế, di chuyển hoặc sinh hoạt thường nhật." }
    ];
    const equipmentTable = '<div class="equipment-card"><div class="section-title">' + helpLabel("Trang Bị / Pháp Bảo", "Mỗi hàng là một loại hoặc vị trí trang bị độc lập. Nhấn một hàng để chọn vật phẩm phù hợp trong Hành trang; chỉ vật phẩm đang trang bị mới gắn chỉ số vào nhân vật.") + '</div><table class="equipment-table"><thead><tr><th>Loại Trang Bị</th><th>Số Lượng</th><th>Vật Phẩm Đã Trang Bị</th></tr></thead><tbody>' +
      equipmentSlots.map((row) => '<tr class="equip-row" title="' + escapeHtml(row.help) + '" data-equip-category="' + row.category + '" data-equip-slot="' + row.slot + '"><td>' + escapeHtml(row.label) + '</td><td>' + row.count + '/' + row.max + '</td><td>' + (row.items.length ? '<span class="equip-item">' + escapeHtml(row.items.map(itemName).join(" · ")) + '</span>' : '<span class="muted">Chưa trang bị</span>') + '</td></tr>').join("") +
      '</tbody></table></div>';
    const r = window.GameData.REALMS.find((x) => x.id === p.realmId) || window.GameData.REALMS[0];
    const next = window.GameData.REALMS[window.GameData.REALMS.findIndex((x) => x.id === p.realmId) + 1];
    const mental = window.GameEngine.sanStatus(p);
    const fortune = window.GameEngine.fortuneStatus(s.fortune);
    const wrongness = window.GameEngine.worldviewWrongness ? window.GameEngine.worldviewWrongness(state) : 0;
    const perceptionNote = wrongness >= 51 ? '<div class="san-penalty"><b>⚠ Cảm quan lệch tầng ' + wrongness + '/100</b><span>Một phần thông tin có thể không đáng tin khi Thanh Tỉnh suy kiệt hoặc Tà Nhiễm lan rộng.</span></div>' : '';
    const raceHelp = {
      "Nhân Tộc": "Nhân Tộc có căn cơ cân bằng, khả năng thích nghi cao và dễ tiếp nhận nhiều đạo thống; tuổi thọ ban đầu hữu hạn nhưng đường tu rộng.",
      "Yêu Tộc": "Yêu Tộc là sinh linh khai trí từ huyết mạch dị chủng hoặc thiên địa tinh linh. Thường có thể phách, bản năng và thọ nguyên mạnh, nhưng dễ bị chính đạo nghi kỵ; huyết mạch quyết định thiên phú lẫn điểm yếu.",
      "Ma Tộc": "Ma Tộc trọng dục niệm và sức mạnh bản nguyên, dễ tiếp cận ma công nhưng phải đối diện Tà Nhiễm và thiên kiếp khắc nghiệt hơn.",
      "Quỷ Tộc": "Quỷ Tộc lấy âm khí và thần hồn làm căn bản; thể xác yếu hơn nhưng cảm ứng linh thể, u minh và tà niệm vượt trội.",
      "Linh Tộc": "Linh Tộc do thiên địa linh vật hóa sinh, thân cận linh khí và ngũ hành nhưng trưởng thành chậm, lệ thuộc môi trường tương hợp.",
      "Cổ Tộc": "Cổ Tộc là hậu duệ của những huyết mạch tồn tại trước kỷ nguyên hiện tại. Họ thường mang thể chất, ký ức truyền thừa hoặc dị năng đã thất lạc; đổi lại huyết mạch cổ dễ đánh thức lời nguyền, chấp niệm tổ tiên và sự chú ý của các tồn tại ngoài trời."
    }[p.race] || "Chủng tộc quyết định huyết mạch, thiên phú bẩm sinh, thọ nguyên và cách các thế lực nhìn nhận mệnh nhân.";
    const avatar = p.portrait ? '<div class="status-avatar"><img src="' + p.portrait + '" alt="' + p.name + '"></div>' : '';
    const madness = p.san <= 0 || state.flags.madness
      ? '<div class="san-penalty"><b>⚠ Hình phạt Mất Trí đã kích hoạt</b><span>Mất ' + (state.flags.madnessPenalty?.lostExp || 0) + ' Tu vi · Tà Nhiễm +' + (state.flags.madnessPenalty?.corruptionGained || 0) + ' · Kết cục Tha Hóa</span></div>'
      : '';
    return avatar + perceptionNote +
      '<div class="section-title">' + p.name + " · " + escapeHtml(window.GameEngine.pathTitle(state)) + "</div>" + madness +
      bar("Khí Huyết", p.hp, p.maxHp, "hp-bar", "Sinh lực của thân thể. Khí Huyết về 0 khiến mệnh nhân bại trận hoặc tử vong tùy tình cảnh.") +
      bar("Linh Khí", p.qi, p.maxQi, "qi-bar", "Năng lượng dùng để tu luyện và thi triển công pháp; nghỉ ngơi hoặc vật phẩm có thể phục hồi.") +
      bar("Thanh Tỉnh", p.san, p.maxSan || 100, "progress-bar", mental.name + ": " + mental.desc + " Tà Nhiễm càng cao thì mức tối đa và khả năng hồi phục càng giảm.") +
      '<div class="kv">' + helpLabel("Tâm cảnh", "Trạng thái tinh thần hiện tại được suy ra từ Thanh Tỉnh và trực tiếp điều chỉnh Thể phách, Linh lực.") + '<b>' + mental.name + "</b></div>" +
      '<div class="kv">' + helpLabel("Chủng tộc", raceHelp) + '<b>' + (p.race || "Nhân Tộc") + "</b></div>" +
      '<p class="race-lore">' + escapeHtml(raceHelp) + '</p>' +
      '<div class="kv">' + helpLabel("Căn cốt", "Tư chất thân thể và kinh mạch; quyết định hiệu suất nhận Tu vi khi vận công.") + '<b>' + (p.aptitude || 50) + "/100</b></div>" +
      '<div class="kv">' + helpLabel("Ngộ tính", "Khả năng lĩnh hội đạo lý; tăng EXP thông thạo nhận được khi vận dụng Công pháp.") + '<b>' + (p.comprehension || 50) + "/100</b></div>" +
      '<div class="kv">' + helpLabel("Tà Nhiễm", "Mức độ thân thể và thần thức bị dị lực ăn mòn (tên kỹ thuật cũ: Corruption). Càng cao càng dễ hao Thanh Tỉnh, khó hồi phục và giảm Thanh Tỉnh tối đa.") + '<b>' + (p.corruptionRating || 0) + "/100</b></div>" +
      '<div class="kv root-row">' + helpLabel("Linh căn", "Mỗi Linh căn là một thuộc tính hấp thu linh khí độc lập; phẩm chất và số lượng quyết định tốc độ cùng độ tinh thuần khi tu luyện.") + '<b>' + (roots.length ? escapeHtml(roots.join(" · ")) : "Chưa rõ") + (rootGrade ? ' <span class="root-grade">' + escapeHtml(rootGrade) + '</span>' : '') + '</b></div>' +
      (rootProfile.cachCucName ? '<div class="kv root-row root-cach-cuc root-cach-cuc--' + escapeHtml(rootProfile.cachCucAlignment || "trung") + '">' + helpLabel("Cách cục Linh căn", "Cách cục được suy ra từ quan hệ Tương Sinh/Tương Khắc nội tại giữa các nguyên tố trong bộ linh căn.") + '<b>' + escapeHtml(rootProfile.cachCucName) + '</b></div>' : '') +
      '<div class="kv">' + helpLabel("Tính cách", "Khuynh hướng hành xử bẩm sinh, được dùng trong đối thoại, lựa chọn và một số kiểm tra ẩn.") + '<b>' + ((p.personalityTraits || []).join(" · ") || "Chưa rõ") + "</b></div>" +
      '<div class="kv">' + helpLabel("Xuất thân · " + (p.origin?.name || p.background || "Vô Danh"), "Thân phận khởi đầu được khóa vĩnh viễn; passive và trait tiếp tục ảnh hưởng suốt hành trình.") + '<b>' + escapeHtml(p.origin ? p.origin.name + " · " + p.origin.specializationName : (p.background || "Vô Danh")) + "</b></div>" +
      (originProfile?.description ? '<p class="origin-lore"><b>Ảnh hưởng xuất thân:</b> ' + escapeHtml(originProfile.description) + '</p>' : '') +
      '<div class="kv">' + helpLabel("Mục tiêu ẩn", "Chấp niệm sâu nhất của nhân vật, có thể mở khóa lựa chọn và kết cục riêng.") + '<b>' + (p.hiddenGoal || "Trường sinh") + "</b></div>" +
      '<div class="kv">' + helpLabel("Công pháp chủ tu", "Pháp môn đang định hình cách vận hành linh khí; chi tiết và cấp thông thạo nằm trong modal Công Pháp.") + '<b>' + (p.cultivationMethod || "Dẫn Khí Nhập Môn") + "</b></div>" +
      '<div class="kv">' + helpLabel("Thể phách", "Sức mạnh thân thể; tăng sát thương vật lý, khí huyết tối đa và thể lực.") + '<b>' + s.phy + "</b></div>" +
      '<div class="kv">' + helpLabel("Linh lực", "Năng lực vận chuyển linh khí; tăng linh khí tối đa và hiệu quả công pháp.") + '<b>' + s.mag + "</b></div>" +
      '<div class="kv">' + helpLabel("Khí Vận", fortune.desc + " Danh xưng được suy ra từ tổng Khí Vận ẩn; engine vẫn giữ trị số để tính cơ duyên nhưng UI không phơi số thô.") + '<b>' + fortune.name + "</b></div>" +
      '<div class="kv">' + helpLabel("Thọ Nguyên", "Số năm sinh mệnh còn lại; cấm thuật, tế lễ và thời gian có thể tiêu hao. Về 0 sẽ dẫn tới Luân Hồi hoặc tử cục.") + '<b>' + p.lifespan + " năm</b></div>" +
      '<div class="kv">' + helpLabel("Tu Vi", "Tích lũy qua tu luyện và trải nghiệm. Đủ Tu vi cùng các điều kiện cảnh giới mới có thể Đột Phá.") + '<b>' + p.exp + (next ? " / " + (r.breakExp * (p.pathId === "ngoai_dao_gia" ? 5 : 1)) : "") + "</b></div>" +
      '<div class="kv">' + helpLabel("Công Đức", "Thiện nghiệp và uy tín đạo nghĩa; dùng để hóa giải nhân quả, giao dịch đặc thù và trả giá khi thoát ly tông môn.") + '<b>' + Number(p.merit || 0) + "</b></div>" +
      '<div class="kv">' + helpLabel("Mệnh Trạng Thái", "Tình trạng vận hành tổng thể của Mệnh Số, bao gồm trưởng thành, phản phệ, tà thần can thiệp hoặc siêu thoát.") + '<b>' + window.GameEngine.fateStatusLabel(state) + "</b></div>" +
      renderProfessionSection(state) +
      equipmentTable +
      '<div class="section-title">Cảnh Giới · ' + escapeHtml(window.GameEngine.pathTitle(state)) + '</div><p class="realm-lore-compact">' + escapeHtml(window.GameEngine.realmLore(state, r).text) + "</p>" +
      renderBreakthrough(state);
  }

  function openEquipmentPicker(state, category, slot) {
    const candidates = Object.keys(state.inventory).filter((id) => {
      const it = window.GameData.ITEMS[id];
      if (!it || !window.GameEngine.equipmentCategory(it)) return false;
      const itemCategory = window.GameEngine.equipmentCategory(it);
      if (itemCategory !== category) return false;
      if (category === "protection") return window.GameEngine.protectionSlot(it) === slot;
      return true;
    });
    const rows = candidates.length
      ? candidates.map((id) => {
        const it = window.GameData.ITEMS[id];
        const equipped = window.GameEngine.equippedItemIds(state.player.equipment).includes(id);
        const actionId = equipped ? "unequip" : "equip";
        const eligibility = window.GameEngine.equipmentEligibility(state, id, slot);
        let controls = '';
        if (equipped) controls = '<button class="item-action" data-equip-pick="' + id + '" data-equip-action="unequip">Tháo</button>';
        else if ((category === "artifact" || category === "personal") && !eligibility.eligible && eligibility.reason.includes("đã đủ")) {
          const max = category === "artifact" ? 2 : 3;
          controls = Array.from({ length: max }, (_, index) => '<button class="item-action" data-equip-pick="' + id + '" data-equip-action="equip" data-equip-target-slot="' + index + '">Thay ô ' + (index + 1) + '</button>').join('');
        } else controls = '<button class="item-action" data-equip-pick="' + id + '" data-equip-action="' + actionId + '" data-equip-target-slot="' + escapeHtml(eligibility.targetSlot ?? slot ?? '') + '"' + (!eligibility.eligible ? ' disabled' : '') + '>' + (eligibility.occupiedBy ? "Thay thế" : "Trang Bị") + '</button>';
        return '<div class="equip-pick-row"><div><b>' + escapeHtml(it.name) + '</b><small>' + escapeHtml(it.desc || "Không rõ lai lịch.") + (equipped ? ' · Đang trang bị' : '') + '</small>' + (Object.keys(eligibility.statDelta || {}).length ? '<div class="stat-tags">' + renderEffects(eligibility.statDelta) + '</div>' : '') + (!eligibility.eligible && !equipped ? '<small class="inline-blocker">' + escapeHtml(eligibility.reason) + '</small>' : '') + '</div><div class="equip-pick-actions">' + controls + '</div></div>';
      }).join("")
      : '<p class="muted">Chưa có vật phẩm nào phù hợp với loại trang bị này.</p>';
    openOverlay("Chọn Vật Phẩm Trang Bị", '<div class="equip-picker">' + rows + '</div>');
  }

  function renderInventory(state, options = {}) {
    const ids = Object.keys(state.inventory).filter((id) => !(options.hideEquipped && window.GameEngine.equippedItemIds(state.player.equipment).includes(id)));
    const equippedIds = new Set(window.GameEngine.equippedItemIds(state.player.equipment));
    if (!ids.length) return '<div class="section-title">Hành trang</div><p class="muted">Trống rỗng.</p>';
    return '<div class="section-title">Hành trang</div>' + ids.map((id) => {
      const it = window.GameData.ITEMS[id];
      if (!it) return '<div class="item-row quest-failed">Vật phẩm chưa xác định</div>';
      const equipped = equippedIds.has(id) ? " · Đang trang bị" : "";
      const generated = it.generated ? " · Vật phẩm tạo tác" : "";
      const cursed = it.cursed ? " · Nguyền rủa" : "";
        const actions = window.GameEngine.inventoryActions(state, id).map((action) =>
          '<button class="item-action" data-item-action="' + action.id + '" data-item-id="' + id + '">' + action.label + '</button>'
        ).join(" ");
        const professionAction = it.kind === "profession_item" ? expansionButton("profession_item_use", "Sử dụng", id) : "";
      const categoryLabel = window.GameEngine.equipmentCategoryLabel(it);
      const itemEffects = Object.fromEntries(["phy", "mag", "sanResist", "phyDef", "heal", "exp", "san"].filter((key) => it[key] != null).map((key) => [key, it[key]]));
      const freeQty = window.GameEngine.freeItemQuantity(state, id);
      const safety = options.selectable && window.GameEngine.cauldronItemSafety ? window.GameEngine.cauldronItemSafety(state, id) : { selectable: true, quickSafe: false };
      const safeForQuick = Boolean(safety.quickSafe);
      const selector = options.selectable && safety.selectable && freeQty > 0 ? '<label class="cauldron-quantity' + (safeForQuick ? ' quick-safe' : ' protected') + '">Chọn thủ công <input type="number" min="0" max="' + Math.min(9, freeQty) + '" value="0" data-cauldron-item="' + escapeHtml(id) + '" data-cauldron-name="' + escapeHtml(it.name) + '" data-cauldron-safe="' + (safeForQuick ? 'true' : 'false') + '"> / ' + freeQty + '</label>' : '';
      return '<div class="item-row inspectable" title="' + escapeHtml(it.desc || "Không rõ lai lịch.") + '"><b>' + it.name + '</b> ×' + state.inventory[id] + selector + '<br><small>' +
          categoryLabel + equipped + generated + cursed + '<br>' + (it.desc || "Không rõ lai lịch.") + '</small><div class="stat-tags">' + renderEffects(itemEffects) + '</div><div class="item-actions">' + actions + professionAction + '</div></div>';
    }).join("");
  }
  function renderInventoryModal(state) {
    return '<img class="modal-illustration" src="assets/ui/fate-illustration.webp" alt="Hành trang"><div class="detail-block"><h4>Hành Trang</h4><p class="muted">Vật phẩm đã trang bị được ẩn mặc định; mở bộ chọn Trang Bị để xem vật phẩm cùng loại.</p></div>' + renderInventory(state, { hideEquipped: true });
  }

  function renderQuests(state) {
    const list = Object.values(state.quests).filter((q) => q.status !== "available");
    if (!list.length) return '<div class="section-title">Nhiệm vụ</div><p class="muted">Chưa có.</p>';
    return '<div class="section-title">Nhiệm vụ</div>' + list.map((q) => {
      const def = window.GameData.QUESTS[q.id] || q;
      const cls = q.status === "completed" ? "quest-done" : q.status === "failed" ? "quest-failed" : "";
      const mark = q.status === "completed" ? "✓" : q.status === "failed" ? "×" : "·";
      const objs = q.objectives.map((o) => (o.done ? "✓ " : "○ ") + o.label).join("<br>");
      const controls = q.status === "active" ? '<div class="quest-controls"><button class="guild-action" data-quest-track="' + escapeHtml(q.id) + '">' + (q.tracked ? "Đang theo dấu" : "Theo dấu") + '</button><button class="guild-action" data-quest-abandon="' + escapeHtml(q.id) + '">Từ bỏ</button></div>' : '';
      return '<div class="quest-row ' + cls + '">' + mark + " " + escapeHtml(def.title || q.id) + " <small>(" + q.status + ")</small><br><small>" + objs + "</small>" + controls + '</div>';
    }).join("");
  }

  function renderRelations(state) {
    const ids = Object.keys(state.relationships);
    const relations = ids.map((id) => {
      const npc = window.GameData.NPCS[id];
      const r = state.relationships[id];
      return '<div class="rel-row">' + escapeHtml(npc?.name || window.GameI18n?.formatTarget(id, state) || "Nhân vật chưa định danh") + '<br><small>' +
        helpLabel("Tín", "Mức độ nhân vật tin cậy mệnh nhân.") + ': ' + r.trust + ' · ' +
        helpLabel("Sợ", "Mức độ nhân vật sợ hãi uy thế của mệnh nhân.") + ': ' + r.fear + ' · ' +
        helpLabel("Kính", "Mức độ kính trọng danh vọng và hành vi của mệnh nhân.") + ': ' + r.respect + ' · ' +
        helpLabel("Nghi", "Mức độ hoài nghi; quá cao có thể khóa đối thoại hoặc dẫn tới phản bội.") + ': ' + r.suspicion + "</small></div>";
    }).join("") || '<p class="muted">Chưa kết giao ai.</p>';
    const prisoners = Object.values(state.prisoners || {}).filter((p) => p.status === "held").map((p) => '<div class="item-row"><b>Tù binh · ' + escapeHtml(window.GameData.ENTITIES?.[p.entityId]?.name || window.GameI18n?.formatTarget(p.entityId, state) || "Thực thể chưa định danh") + '</b><div class="item-actions">' + expansionButton("interrogate", "Thuyết phục", p.id, 'data-expansion-arg2="persuade"') + expansionButton("prisoner_resolve", "Phóng thích", p.id, 'data-expansion-arg2="released"') + '</div></div>').join("") || '<p class="muted">Không có tù binh đang giữ.</p>';
    const contracts = Object.values(state.contractBoard?.accepted || {}).filter((c) => c.status === "accepted").map((c) => '<div class="item-row"><b>' + escapeHtml(window.GameI18n?.formatContract(c) || "Khế Ước") + '</b><small> · Hết hạn ngày ' + Number(c.expiresDay || 0) + '</small></div>').join("") || '<p class="muted">Không có khế ước đang thực hiện.</p>';
    const localNpcIds = window.GameData.LOCATIONS?.[state.locationId]?.npcs || [];
    const correspondence = localNpcIds.map((npcId) => '<div class="item-row"><b>' + escapeHtml(window.GameData.NPCS?.[npcId]?.name || window.GameI18n?.formatTarget(npcId, state) || "Nhân vật chưa định danh") + '</b><div class="item-actions">' + expansionButton("mail", "Gửi Truyền Thư", npcId, 'data-expansion-arg2="Bình an, hữu duyên tái ngộ."') + expansionButton("bounty", "Treo Thưởng · 10", npcId, 'data-expansion-arg2="10"') + '</div></div>').join("") || '<p class="muted">Không có đối tượng liên hệ trong khu vực.</p>';
    const bounties = (state.worldSimulation?.scheduledTasks || []).filter((task) => task.type === "bounty" && task.status === "pending").map((task) => '<div class="item-row"><b>Truy nã · ' + escapeHtml(window.GameI18n?.formatTarget(task.entityId, state) || "Mục tiêu được chỉ định") + '</b><small> · dự kiến hồi báo ngày ' + Number(task.dueDay || 0) + '</small></div>').join("");
    const intelCount = Object.keys(state.intel || {}).length; const cover = state.coverIdentity ? "Đang dùng thân phận bí mật" : "Chưa lập thân phận bí mật";
    return '<div class="section-title">Nhân duyên</div>' + relations + '<div class="section-title">Tù Binh & Dị Thú</div>' + prisoners + (state.companion ? '<div class="item-row"><b>Dị Thú đồng hành · ' + escapeHtml(state.companion.customName || window.GameI18n?.formatTarget(state.companion.entityId, state) || "Dị Thú") + '</b><small> · Trung thành ' + Number(state.companion.loyalty || 0) + '/100</small></div>' : '<p class="muted">Chưa có Dị Thú đồng hành.</p>') + '<div class="section-title">Truyền Thư</div>' + correspondence + '<div class="section-title">Truy Nã</div>' + (bounties || '<p class="muted">Không có truy nã đang chờ.</p>') + '<div class="section-title">Tình Báo / Thân Phận</div><p>' + escapeHtml(cover) + ' · ' + intelCount + ' đầu mối.</p>' + expansionButton("intel_buy", "Mua tin tức · 5 Linh Thạch") + '<div class="section-title">Khế Ước</div>' + contracts;
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
      const tier = window.GameEngine.guildTierInfo(guild);
      const exitCost = window.GameEngine.guildExitCost(guild);
      const pursuit = state.guildPursuit ? '<div class="san-penalty"><b>Truy Sát Lệnh</b><span>Còn hiệu lực tới khi vượt đại cảnh kế tiếp.</span></div>' : '';
      return pursuit + '<div class="guild-card member"><div class="guild-tier">' + escapeHtml(tier.name) + '</div><h3>' + guild.name + '</h3>' +
        '<p>' + guild.type + ' · ' + guild.race + ' · ' + guild.allegiance + '</p>' +
        '<div class="kv">' + helpLabel("Thân phận", "Ngoại Môn → Nội Môn → Chân Truyền → Trưởng Lão; tăng theo Cống Hiến và mở thêm Công pháp tông môn.") + '<b>' + benefits.rank.name + '</b></div>' +
        '<div class="kv">' + helpLabel("Cống Hiến", "Công lao tích lũy khi tu luyện và làm việc cho tông môn; dùng để thăng thân phận và trả giá thoát ly.") + '<b>' + membership.contribution + (nextRank ? ' / ' + nextRank : '') + '</b></div>' +
        '<div class="kv">' + helpLabel("Tu luyện gia trì", "Phần trăm Tu vi cộng thêm nhờ tài nguyên và truyền thừa tông môn.") + '<b>+' + benefits.expBonusPct + '%</b></div>' +
        '<div class="kv">' + helpLabel("Hộ đạo", "Mức giảm nguy cơ tiêu cực từ môi trường khi tu luyện trong phạm vi thế lực.") + '<b>' + benefits.cityPenaltyReductionPct + '%</b></div>' +
        '<p class="guild-traits">' + guild.traits.join(' · ') + '</p>' +
        '<p class="guild-exit-cost">Thoát ly cần ' + exitCost.contribution + ' Cống Hiến + ' + exitCost.merit + ' Công Đức. Thiếu sẽ bị truy sát tới đại cảnh kế.</p>' +
        '<div class="item-actions"><button class="guild-action" data-expansion-modal="guild-project">Công Trình Tông Môn</button><button class="guild-action danger" data-guild-leave="true">Thoát ly tông môn</button></div></div>';
    }

    if (window.GameEngine.cultivationTier(state) === 1) {
      return '<div class="section-title">Môn Phái / Đạo Lộ</div>' +
        '<p class="muted">Đang ở Di Mệnh Cảnh. Hãy tích đủ EXP hoặc dùng đan khai mạch để bước vào Khai Lộ Cảnh.</p>';
    }

    const regionId = data.WORLD_MAP.locations[state.locationId]?.region || data.LOCATIONS[state.locationId]?.region || "trung_vuc";
    const region = data.WORLD_MAP.regions.find((item) => item.id === regionId);
    const regional = data.GUILDS.filter((guild) => guild.region_id === regionId);
    const available = regional.filter((guild) => window.GameEngine.guildEligibility(state, guild).visible)
      .sort((a, b) => a.pyramid_tier - b.pyramid_tier || b.reputation - a.reputation);
    const originName = state.player.origin?.name || state.player.background || "Xuất thân đã định";
    const decision = state.pendingGuildChoice
      ? '<div class="guild-decision"><b>Đạo lộ tổ chức</b><p>Xuất thân <strong>' + escapeHtml(originName) + '</strong> đã được chọn từ đầu game và không thể đổi tại đây. Ngươi có thể gia nhập một tổ chức bên dưới hoặc tiếp tục hành đạo độc lập.</p></div>'
      : '';
    const hidden = Math.max(0, regional.length - available.length);
    const regionalMinTier = regional.length ? Math.min(...regional.map((guild) => Number(guild.pyramid_tier || 5))) : null;
    const starterRoadmap = !available.length && regionalMinTier
      ? '<div class="guild-roadmap"><b>Khu vực khởi hành chưa có môn phái sơ cấp.</b><p>Ngươi vẫn có thể tu luyện với tư cách Tán Tu, làm nhiệm vụ và tích lũy Mệnh hiệu dụng. Khi đạt ' +
        escapeHtml(window.GameEngine.guildTierInfo(regionalMinTier).name) + ' (Cảnh giới ' + window.GameEngine.guildTierInfo(regionalMinTier).minRealm + ' · Hiệu Mệnh ' + window.GameEngine.guildTierInfo(regionalMinTier).minFate + '), thế lực nơi đây sẽ mở lời cầu nhập môn.</p></div>' : '';
    return decision + '<div class="section-title">Tổ chức tại ' + (region?.name || "khu vực") + ' (' + available.length + ')</div>' +
      (hidden ? '<p class="muted">Thiên cơ che khuất ' + hidden + ' thế lực thượng tầng; khi Hiệu Mệnh và cảnh giới tăng, danh sách sẽ tự mở rộng.</p>' : '') +
      starterRoadmap +
      available.slice(0, 20).map((guild) => { const eligibility = window.GameEngine.guildEligibility(state, guild); return '<div class="guild-card ' + (eligibility.eligible ? '' : 'locked') + '"><div class="guild-tier">' + escapeHtml(eligibility.rule.name) + '</div>' +
        '<h3>' + guild.name + '</h3><p>' + guild.type + ' · ' + guild.race + '<br>' + guild.allegiance +
        ' · Danh vọng ' + guild.reputation + '<br>EXP +' + guild.cultivation_exp_bonus_pct.min + '–' + guild.cultivation_exp_bonus_pct.max +
        '% · Kháng tiêu cực ' + guild.city_penalty_reduction_pct.min + '–' + guild.city_penalty_reduction_pct.max + '%</p>' +
        '<p class="guild-requirement">Điều kiện: Cảnh giới ' + eligibility.rule.minRealm + ' · Hiệu Mệnh ' + eligibility.rule.minFate + '</p>' +
        (eligibility.eligible ? '<button class="guild-action" data-guild-join="' + guild.id + '">Cầu nhập môn</button>' : '<button class="guild-action" disabled>Chưa đủ tư cách · ' + escapeHtml(eligibility.reasons.join(' · ')) + '</button>') + '</div>'; }).join("") +
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
    const regionId = map.locations[state.locationId]?.region || data.LOCATIONS?.[state.locationId]?.region;
    const preview = window.GameEngine.worldModifierPreview?.(state, { regionId, activity: "travel" });
    const climate = preview ? '<div class="detail-block"><b>Thiên tượng tuyến đường: ' + escapeHtml(preview.weatherLabel) + '</b><small> · Nguy cơ di chuyển ' + (Number(preview.travelRiskDelta || 0) * 100).toFixed(0) + '% · tìm kiếm ×' + Number(preview.searchRewardMult || 1).toFixed(2) + '</small></div>' : '';
    return climate + controls + (activeMapView === "world" ? renderWorldMap(state, data, map) : renderLocalMap(state, data, map));
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
      const runtime = state.worldSimulation?.regionState?.[region.id];
      const event = runtime?.activeEventId && state.worldSimulation?.events?.[runtime.activeEventId];
      const eventName = event ? (window.EXPANSION_DATA?.worldEvents || []).find((entry) => entry.id === event.templateId)?.name : null;
      return '<div class="region-node' + current + (event ? ' event-active' : '') + '" style="left:' + region.x + '%;top:' + region.y + '%" title="' + escapeHtml(region.description + (eventName ? ' · ' + eventName : '')) + '">' +
        '<b>' + region.name + (eventName ? ' ☄' : '') + '</b><small>' + region.type + '<br>Linh khí ' + region.qi + ' · Nguy hiểm ' + region.danger + (runtime?.weather ? '<br>Thời tiết: ' + escapeHtml(runtime.weather) : '') + (eventName ? '<br>Biến cố: ' + escapeHtml(eventName) : '') + '</small></div>';
    }).join("");

    const factions = (map.factions || []).map((faction) => {
      const alignment = faction.alignment === "Tà" ? " evil" : faction.alignment === "Chính" ? " righteous" : " neutral";
      const label = faction.scale >= 8 ? '<span>' + faction.name + '</span>' : "";
      return '<button type="button" class="faction-pin' + alignment + '" data-map-faction="' + escapeHtml(faction.id) + '" style="left:' + faction.x + '%;top:' + faction.y + '%" title="Xem hồ sơ ' +
        escapeHtml(faction.name) + '">' + label + '</button>';
    }).join("");

    const guildPins = (map.guilds || []).filter((guild) => guild.pyramid_tier <= 2).map((guild) => {
      const alignment = guild.alignment === "Tà" ? " evil" : guild.alignment === "Chính" ? " righteous" : " neutral";
      return '<button type="button" class="faction-pin guild-pin' + alignment + '" data-map-guild="' + escapeHtml(guild.id) + '" style="left:' + guild.x + '%;top:' + guild.y + '%" title="Xem hồ sơ ' +
        escapeHtml(guild.name) + '"></button>';
    }).join("");

    const localFactions = (map.factions || []).filter((faction) => faction.region_id === currentRegionId);
    const factionList = localFactions.map((faction) => {
      const realmKey = faction.highest_realm;
      const realm = data.REALMS.find((item) => item.id === realmKey || (item.legacyIds || []).includes(realmKey));
      return '<button type="button" class="faction-row" data-map-faction="' + escapeHtml(faction.id) + '"><b>' + escapeHtml(faction.name) + '</b><small>' + escapeHtml(faction.type) + ' · ' + escapeHtml(faction.alignment) +
        '<br>Quy mô ' + faction.scale + '/10 · Cường giả: ' + (realm?.name || faction.highest_realm) +
        '<br>' + faction.traits.map(escapeHtml).join(" · ") + '</small></button>';
    }).join("");

    return '<div class="map-heading"><b>' + map.name + '</b><small>Bản đồ thế lực theo ' + (window.FACTION_DATA?.world?.era || "Kỷ Nguyên hiện tại") + '</small></div>' +
      '<div class="world-map world-overview"><svg viewBox="0 0 100 100" preserveAspectRatio="none">' + routes + '</svg>' + regions + factions + guildPins + '</div>' +
      '<p class="map-legend"><span class="dot current"></span> Vùng hiện tại <span class="dot righteous"></span> Chính <span class="dot evil"></span> Tà <span class="dot neutral"></span> Trung lập · Bấm ghim để xem hồ sơ</p>' +
      '<div class="section-title">Thế lực quanh ' + (regionById[currentRegionId]?.name || "khu vực") + '</div>' + factionList;
  }

  function renderMapFactionDetail(state, factionId, guildId) {
    const data = window.GameData;
    const map = data.WORLD_MAP || {};
    const faction = (map.factions || []).find((item) => item.id === factionId);
    const guild = (data.GUILDS || []).find((item) => item.id === guildId);
    if (guild) {
      const region = (map.regions || []).find((item) => item.id === guild.region_id);
      const eligibility = window.GameEngine.guildEligibility(state, guild);
      const status = eligibility.eligible ? '<span class="tag success">Đủ tư cách hiện tại</span>' : '<span class="tag danger">Chưa đủ tư cách</span>';
      return '<div class="detail-block"><h3>' + escapeHtml(guild.name) + '</h3>' +
        '<p>' + escapeHtml(guild.type || 'Tông môn') + ' · ' + escapeHtml(guild.allegiance || guild.alignment || 'Trung lập') + '<br>' +
        'Khu vực: ' + escapeHtml(region?.name || window.GameI18n?.formatTarget(guild.region_id, state) || 'Chưa rõ') + '<br>Cấp tổ chức: ' + escapeHtml(window.GameEngine.guildTierInfo(guild).name) +
        ' · Cảnh giới cao nhất: ' + escapeHtml(guild.highest_realm_text || guild.highest_realm || 'Chưa rõ') + '</p>' + status +
        '<p class="muted">Đây là hồ sơ trên bản đồ. Muốn gia nhập hoặc nhận nhiệm vụ, hãy di chuyển tới khu vực này rồi mở mục Tổ chức.</p>' +
        (eligibility.reasons?.length ? '<p class="muted">Còn thiếu: ' + escapeHtml(eligibility.reasons.join(' · ')) + '</p>' : '') + '</div>';
    }
    if (faction) {
      const region = (map.regions || []).find((item) => item.id === faction.region_id);
      const localGuilds = (data.GUILDS || []).filter((item) => item.region_id === faction.region_id).slice(0, 12);
      const realm = (data.REALMS || []).find((item) => item.id === faction.highest_realm || (item.legacyIds || []).includes(faction.highest_realm));
      return '<div class="detail-block"><h3>' + escapeHtml(faction.name) + '</h3><p>' + escapeHtml(faction.type || 'Thế lực') + ' · ' + escapeHtml(faction.alignment || 'Trung lập') + '<br>' +
        'Khu vực: ' + escapeHtml(region?.name || window.GameI18n?.formatTarget(faction.region_id, state) || 'Chưa rõ') + '<br>Quy mô: ' + Number(faction.scale || 0) + '/10 · Cảnh giới cao nhất: ' + escapeHtml(realm?.name || 'Chưa rõ') + '</p>' +
        '<p>' + (faction.traits || []).map(escapeHtml).join(' · ') + '</p>' +
        (localGuilds.length ? '<h4>Tổ chức trong khu vực</h4><ul>' + localGuilds.map((item) => '<li><button type="button" class="link-button" data-map-guild="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + '</button></li>').join('') + '</ul>' : '') +
        '<p class="muted">Bấm vào tổ chức để xem điều kiện. Tương tác trực tiếp chỉ mở khi nhân vật đã tới khu vực tương ứng.</p></div>';
    }
    return '<p class="muted">Không tìm thấy dữ liệu thế lực này.</p>';
  }

  function renderLocalMap(state, data, map) {
    const points = { ...(map.locations || {}) };
    const coords = state.openWorld?.coordinates || {};
    const currentCoords = coords[state.locationId] || [0, 0];
    // Đưa các node procedural đã sinh vào bản đồ cục bộ quanh vị trí hiện tại.
    Object.entries(state.openWorld?.nodes || {}).forEach(([id]) => {
      if (!coords[id]) return;
      const dx = coords[id][0] - currentCoords[0], dy = coords[id][1] - currentCoords[1];
      points[id] = { x: Math.max(4, Math.min(96, 50 + dx * 12)), y: Math.max(4, Math.min(96, 50 - dy * 12)), region: data.LOCATIONS[id]?.region || "trung_vuc" };
    });
    const visited = new Set(state.visitedLocations || [state.locationId]);
    const current = data.LOCATIONS[state.locationId];
    const exits = window.GameEngine.locationExits(state);
    const directionByTarget = {};
    Object.entries(exits).forEach(([direction, target]) => { if (target) directionByTarget[target] = direction; });

    const edges = [];
    const edgeKeys = new Set();
    const visibleIds = new Set([...visited, state.locationId, ...Object.values(exits).filter(Boolean)]);
    Object.entries(data.LOCATIONS).forEach(([from]) => {
      Object.values(window.GameEngine.locationExits(state, from)).forEach((to) => {
        if (!points[from] || !points[to] || (!visibleIds.has(from) && !visibleIds.has(to))) return;
        const key = [from, to].sort().join("|");
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push([from, to]);
        }
      });
    });

    const lines = edges.map(([from, to]) => {
      const a = points[from];
      const b = points[to];
      const explored = visited.has(from) && visited.has(to) ? " explored" : "";
      return '<line class="map-path' + explored + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    }).join("");

    const nodes = Object.entries(points).map(([id, point]) => {
      const location = data.LOCATIONS[id];
      if (!location) return "";
      const direction = directionByTarget[id];
      const isCurrent = id === state.locationId;
      const isVisited = visited.has(id);
      const isReachable = Boolean(direction);
      const classes = ["map-node"];
      const notableCount = Object.values(state.worldSimulation?.npcState || {}).filter((npc) => npc.status === "alive" && npc.currentNodeId === id).length;
      const hiddenOpen = Object.entries(state.worldSimulation?.hiddenRealms || {}).some(([realmId, runtime]) => runtime.status === "open" && (window.EXPANSION_DATA?.hiddenRealms || []).find((entry) => entry.id === realmId)?.parentNodeId === id);
      if (notableCount) classes.push("has-notable-npc");
      if (hiddenOpen) classes.push("hidden-realm-open");
      if (isCurrent) classes.push("current");
      else if (isReachable) classes.push("reachable");
      else if (isVisited) classes.push("visited");
      else classes.push("unknown");
      if (location.openWorld) classes.push("procedural");
      if (location.enemies?.length) classes.push("dangerous");
      const label = (isVisited || isReachable ? location.name : "Chưa khám phá") + (notableCount ? " · NPC " + notableCount : "") + (hiddenOpen ? " · Bí Cảnh" : "");
      const action = direction ? ' data-map-dir="' + direction + '" title="Đi tới ' + location.name + '"' : "";
      return '<button class="' + classes.join(" ") + '" style="left:' + point.x + '%;top:' + point.y + '%"' + action + '>' + label + '</button>';
    }).join("");

    const currentPoint = points[state.locationId];
    const unexploredOffsets = { bac: [0, -12], nam: [0, 12], dong: [12, 0], tay: [-12, 0] };
    const directionLabels = { bac: "Bắc", nam: "Nam", dong: "Đông", tay: "Tây" };
    const unexploredNodes = currentPoint ? Object.entries(unexploredOffsets).map(([direction, offset]) => {
      if (exits[direction]) return "";
      const x = Math.max(4, Math.min(96, currentPoint.x + offset[0]));
      const y = Math.max(4, Math.min(96, currentPoint.y + offset[1]));
      return '<button class="map-node reachable unknown-exit" style="left:' + x + '%;top:' + y + '%" data-map-dir="' + direction + '" title="Mở đường về hướng ' + directionLabels[direction] + '">Chưa khám phá · ' + directionLabels[direction] + '</button>';
    }).join("") : "";
    const region = map.regions.find((item) => item.id === currentPoint?.region);
    return '<div class="map-heading"><b>' + map.name + '</b><small>' + (region ? region.name + " — " + region.desc : "") + '</small></div>' +
      '<div class="world-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + '</svg>' + nodes + unexploredNodes + '</div>' +
      '<p class="map-legend"><span class="dot current"></span> Hiện tại <span class="dot reachable"></span> Có thể đi <span class="dot visited"></span> Đã khám phá</p>';
  }

  function renderFateDetail(state) {
    const p = state.player;
    const total = window.GameEngine.computeFate(p);
    const vault = window.GameEngine.fateVaultSummary(state);
    const relation = p.stats?.rel || window.GameEngine.computeRelationshipEffects(p);
    const fateCard = (id, inVault) => {
      const fate = window.GameData.FATE_PATTERNS.find((item) => item.id === id);
      if (!fate) return "";
      const sign = fate.sign === "cat" ? "Cát" : fate.sign === "hung" ? "Hung" : "Bình";
      const compatibility = p.pathId ? window.GameEngine.fateCompatibility(p.pathId, fate) : null;
      const enhancement = window.GameEngine.fateEnhancementLevel(p, id);
      const effectiveScore = Number(fate.score || 0) + enhancement * 2;
      const activeSlots = Number((window.GameData.REALMS || []).find((r) => r.id === p.realmId)?.activeSlots || (p.fates || []).length);
      const activeFull = (p.fates || []).filter(Boolean).length >= activeSlots;
      const narrative = fateNarrative(fate);
      const equipLabel = activeFull ? "Thay thế…" : "Trang bị";
      const relationship = window.GameEngine.fateRelationshipStatus(p, id);
      const instance = state.fateInstances?.[id] || p.fateInstances?.[id];
      const sourceLabel = instance?.source ? ' · Nguồn: ' + escapeHtml(instance.source) : '';
      const evolution = state.player?.fateEvolutions?.[id]; const eligibility = window.GameEngine.fateEvolutionEligibility?.(state, id);
      const evolutionAction = !inVault ? (evolution ? '<button class="guild-action" data-fate-evolution="' + escapeHtml(id) + '">Tiến hóa · ' + escapeHtml(window.GameI18n?.formatStatus(evolution.status) || "Xem tiến độ") + '</button>' : eligibility?.eligible ? expansionButton("fate_trial", "Mở Mệnh Kiếp", id) : '<button class="guild-action" disabled title="' + escapeHtml((eligibility?.blockers || ["Chưa đủ điều kiện"]).join(" · ")) + '">Tiến hóa chưa mở</button>') : "";
      const actions = '<div class="fate-actions">' + (inVault ? '<button class="guild-action" data-fate-equip="' + escapeHtml(id) + '">' + equipLabel + '</button>' : '<button class="guild-action" data-fate-unequip="' + escapeHtml(id) + '">Tháo xuống Mệnh Kho</button><button class="guild-action" data-fate-nurture="' + escapeHtml(id) + '">Dưỡng Mệnh</button><button class="guild-action" data-fate-resonate="' + escapeHtml(id) + '"' + (relationship.stage !== 2 ? ' disabled title="Cần đạt Tương Ứng trước"' : '') + '>Cộng Minh</button>') + '<button class="guild-action" data-fate-upgrade-target="' + escapeHtml(id) + '"' + (enhancement >= 5 ? ' disabled title="Đã đạt tối đa +5"' : '') + '>Nâng cấp</button>' + evolutionAction + (inVault ? '<label class="fate-select"><input type="checkbox" data-fate-merge="' + escapeHtml(id) + '"> Chọn dung hợp</label>' : '') + '</div>';
      return '<article class="fate-card ' + (fate.sign || "binh") + ' grade-' + escapeHtml(fate.grade || "phan") + '" title="' + escapeHtml(narrative) + '"><div><b>' + escapeHtml(fate.name) + (enhancement ? ' <span class="fate-enhancement">+' + enhancement + '</span>' : '') + '</b><small><span class="fate-grade-badge">' + escapeHtml(fate.gradeLabel || fate.grade || "") + '</span> · ' + sign + ' · Quan hệ: ' + escapeHtml(relationship.label) + sourceLabel + ' · ' + helpLabel("Mệnh Điểm", "Giá trị đang đóng góp vào Tổng Mệnh, đã gồm Cường Hóa.") + ' ' + effectiveScore + (compatibility == null ? "" : ' · ' + helpLabel("Tương hợp", "Điểm tư vấn build; không phải điều kiện khóa trang bị.") + ' ' + compatibility + '/10') + '</small></div><p>' + escapeHtml(narrative) + '</p><div class="stat-tags">' + renderEffects(window.GameEngine.enhancedFateEffects(p, fate)) + '</div>' + (inVault ? '<span class="vault-mark">Mệnh Kho · Không kích hoạt · Không cộng chỉ số</span>' : '<span class="vault-mark active-mark">Đang kích hoạt</span>') + actions + '</article>';
    };
    const relations = relation.activePairs.map((pair) => '<div class="relation-edge ' + (pair.type === "TUONG_SINH" ? "positive" : "negative") + '"><b>' + (pair.type === "TUONG_SINH" ? "↔ Tương Sinh" : "⚡ Tương Khắc") + '</b><span>' + escapeHtml(pair.label || (pair.from + " ↔ " + pair.to)) + '</span></div>').join("") +
      relation.activeCombos.map((combo) => '<div class="relation-edge combo"><b>★ ' + escapeHtml(combo.name) + '</b><span>' + escapeHtml(combo.effect || "Combo Mệnh Số") + '</span></div>').join("");
    const ownedText = "Sở hữu " + vault.ownedCount + " · Đang kích hoạt " + vault.activeCount + " · Trong Mệnh Kho " + vault.used + "/" + vault.capacity;
    const excessEssence = Number(state.fateExcessEssence || p.fateExcessEssence || 0);
    const essenceText = ' · Tinh Hoa Dư: ' + excessEssence;
    const slotCount = Number((window.GameData.REALMS || []).find((r) => r.id === p.realmId)?.activeSlots || (p.fates || []).length);
    const paperSlots = Array.from({ length: Math.max(slotCount, (p.fates || []).length) }, (_, index) => { const id = (p.fates || [])[index]; const fate = window.GameData.FATE_PATTERNS.find((f) => f.id === id); return '<button class="fate-anchor' + (fate ? '' : ' empty') + '" data-fate-slot="' + index + '" title="' + escapeHtml(fate ? fate.name : "Ấn ký trống — chọn Mệnh Số từ Mệnh Kho") + '">' + escapeHtml(fate ? fate.name : "Trống · gắn từ Mệnh Kho") + '</button>'; }).join("");
    return '<img class="modal-illustration" src="assets/ui/fate-illustration.webp" alt="Tinh bàn Mệnh Số">' +
      '<p class="muted fate-owned-count">' + escapeHtml(ownedText + essenceText) + '</p>' + (state.flags?.lastFateUpgrade ? '<p class="reward-banner fate-upgrade-result">' + escapeHtml(state.flags.lastFateUpgrade) + '</p>' : '') + (state.pendingFateReward ? '<div class="pending-fate-banner"><b>Mệnh Số đang chờ nhận' + ((state.pendingFateRewards || []).length ? ' · còn ' + (state.pendingFateRewards.length + 1) + ' phần thưởng' : '') + '</b><span>' + escapeHtml((window.GameData.FATE_PATTERNS.find((f) => f.id === state.pendingFateReward.fateId)?.name || state.pendingFateReward.fateId) + ' · ' + state.pendingFateReward.source) + '</span><button class="guild-action" data-pending-fate-resolve>Chọn Mệnh trong kho để thay</button><button class="guild-action" data-pending-fate-dismiss>Từ chối</button></div>' : '') + '<div class="fate-view-toggle"><button class="chip" data-fate-view="body">Xem dạng cơ thể</button><button class="chip" data-fate-view="grid">Xem dạng lưới</button></div><div class="fate-paperdoll"><img src="assets/ui/fate-paperdoll.png" alt="Cơ thể Ấn ký Mệnh Số"><div class="fate-anchor-list">' + paperSlots + '</div></div>' +
      '<div class="detail-summary"><b>' + helpLabel("Tổng Mệnh", "Tổng điểm nguyên bản của mọi Mệnh Số đang kích hoạt, gồm cả Cát, Bình và Hung.") + ' ' + total.total + '</b><span>' + helpLabel("Thuận Mệnh", "Tổng điểm Cát và Bình trước khi chịu ảnh hưởng của Hung Mệnh.") + ' ' + total.normal + '</span><span>' + helpLabel("Hiệu Mệnh", "Điểm Mệnh thực sự được engine dùng sau khi tính Hung Mệnh, Mệnh Trái, Mệnh Dư và khế ước.") + ' ' + total.effective + '</span><span>' + helpLabel("Mệnh Hòa Tỷ", "Tỷ số Tổng Mệnh trên trị tuyệt đối Thuận Mệnh. 1,00 là ổn định; thấp hơn 1 cho thấy Hung Mệnh đang bào mòn, số âm báo hiệu phản phệ nghiêm trọng.") + ' ' + total.ratio.toFixed(2) + '</span></div>' +
      '<div class="detail-block"><h4>Nguồn thu nhận</h4><p>Chọn Con Đường bảo đảm Mệnh tương hợp đầu tiên. Đột Phá từ Cấp 3 có 50% cơ hội và bảo đảm ở lần kế nếu hụt; ngoài ra còn có quest, boss/tinh anh, Search/Discovery Chain, manh mối bản đồ, Phường Thị, Khâm Thiên Giám và Hư Thiên Đỉnh.</p><p class="fate-pity">Thiên Cơ Đột Phá: <b>' + (Number(state.flags?.fatePityMisses || 0) ? '1/2 · lần kế bảo đảm' : '0/2') + '</b></p></div>' +
      '<div class="detail-columns" hidden><section><h3>Mệnh đang kích hoạt</h3>' + (p.fates || []).map((id) => fateCard(id, false)).join("") + '</section><section><h3>Mệnh Kho · ' + vault.used + '/' + vault.capacity + '</h3><p class="muted">Chọn Trang bị để đưa Mệnh vào Ấn ký đầu tiên còn trống. Chọn 2–9 ô để dung hợp; cùng phẩm trật sẽ tăng cơ hội thăng cấp.</p>' + (vault.ids.length ? vault.ids.map((id) => fateCard(id, true)).join("") : '<p class="empty-state">Mệnh Kho đang trống.</p>') + '<button class="guild-action" data-fate-merge-submit>Dung hợp các Mệnh đã chọn</button></section></div>' +
      '<div class="detail-block"><h4>Quan hệ đang kích hoạt</h4><div class="relation-list">' + (relations || '<p class="empty-state">Chưa có Tương Sinh, Tương Khắc hoặc Combo được kích hoạt.</p>') + '</div></div>';
  }

  const FATE_PREFIX_MEANINGS = {
    "Thần":"thần uy và ý chí vượt phàm", "Tiên":"khí chất siêu thoát, hướng tới trường sinh", "Đại":"khí tượng rộng lớn, lấy thế áp người", "Thái":"căn nguyên sơ thủy trước khi vạn vật phân hóa", "Cổ":"dấu tích viễn cổ cùng truyền thừa thất lạc", "Vĩnh":"ý niệm trường tồn không dễ lay chuyển", "Long":"long uy, quyền thế và biến hóa", "Phượng":"niết bàn, cao quý và tái sinh", "Cửu":"cực số viên mãn qua nhiều tầng biến hóa", "Vạn":"muôn vàn khả năng cùng hội tụ", "Thánh":"đạo hạnh tinh thuần, gần với chí thiện", "Tử":"tôn quý và quyền hành thống lĩnh", "Chân":"bản chất chân thực, phá bỏ hư vọng", "Minh":"sáng rõ, minh triết và soi thấu", "Thiên":"thiên ý, trật tự và đại thế", "Địa":"địa mạch, sự bền vững và bao dung", "Huyền":"huyền cơ sâu kín, khó dò", "Thuận":"thuận thế mà hành, ít nghịch thiên cơ", "Kim":"sắc bén, cương nghị và quyết đoán", "Mộc":"sinh trưởng, hồi phục và bền bỉ", "Thủy":"linh hoạt, thâm trầm và thích nghi", "Hỏa":"nhiệt liệt, bộc phát và thiêu luyện", "Thổ":"ổn trọng, phòng thủ và tích lũy", "Phong":"tự do, mau lẹ và vô định", "Lôi":"uy mãnh, trừng phạt và đột biến", "Băng":"tĩnh lạnh, kiên định và phong cấm", "Huyết":"huyết mạch, sinh cơ và cái giá phải trả", "Phúc":"phúc trạch, thiện duyên và che chở", "Cát":"điềm lành cùng cơ duyên thuận lợi", "Tố":"thuần phác, trong sạch và trở về bản tính", "Đan":"luyện hóa, bồi nguyên và chuyển sinh", "Kiếm":"kiếm tâm sắc bén, thẳng tiến không lui", "Đao":"bá liệt, dứt khoát và sát phạt", "Dương":"dương cương, quang minh và sinh lực", "Linh":"linh tính, cảm ứng và biến hóa tinh vi", "Khí":"khí cơ lưu chuyển, nối thân với trời đất", "Ma":"ma niệm, cường lực và sự phản nghịch", "Yêu":"huyết mạch dị loại, bản năng và hóa hình", "Quỷ":"âm hồn, chấp niệm và u minh", "Tiểu":"khởi từ điều nhỏ bé nhưng tinh xảo", "Vô":"không chấp hình tướng, vượt ngoài khuôn phép", "Bất":"ý chí không khuất phục trước biến đổi", "Nghịch":"nghịch thế, cưỡng cải thiên mệnh", "Hỗn":"hỗn mang chưa phân, chứa cả sinh lẫn diệt", "Hư":"hư không, ẩn tàng và khó nắm bắt", "Phá":"phá cục, phá chướng và mở lối mới", "Họa":"tai họa tiềm phục, dùng nguy đổi cơ", "Hung":"hung hiểm, sát kiếp và phản phệ", "Âm":"âm nhu, kín đáo và thần hồn", "U":"u tịch, sâu thẳm và bí ẩn"
  };
  const FATE_SUFFIX_MEANINGS = {
    "Đạo":"con đường và quy luật tối cao", "Mệnh":"căn số chi phối một đời", "Cục":"thế cục đan xen nhân quả", "Vận":"dòng biến chuyển của cơ duyên", "Cơ":"điểm khởi phát của thiên cơ", "Kiếp":"thử thách buộc mệnh nhân lột xác", "Giới":"ranh giới của một miền pháp tắc", "Vực":"lãnh vực sức mạnh riêng", "Pháp":"phép vận dụng quy luật", "Thuật":"kỹ nghệ biến hóa và ứng dụng", "Công":"nền tảng tôi luyện lâu dài", "Kinh":"đạo điển lưu giữ truyền thừa", "Quyết":"pháp quyết cô đọng để thi hành", "Tâm":"tâm cảnh và chấp niệm cốt lõi", "Hồn":"linh hồn cùng ký ức", "Phách":"bản năng và sức sống tinh thần", "Thể":"thân thể làm lò luyện đạo", "Tướng":"biểu hiện bên ngoài của căn mệnh", "Trận":"trận thế liên kết thiên địa", "Phù":"phù văn dẫn và giữ linh lực", "Đan":"đan đạo luyện hóa tinh hoa", "Tông":"đạo thống quy tụ môn nhân", "Phái":"truyền thừa có tôn chỉ riêng", "Môn":"cánh cửa bước vào một đạo", "Đế":"đế uy thống ngự quần hùng", "Tôn":"địa vị được vạn người kính ngưỡng", "Chủ":"quyền làm chủ một phương", "Sư":"năng lực truyền đạo dẫn đường", "Tử":"hạt giống kế thừa đạo thống", "Đồ":"người học đạo qua thử luyện", "Khách":"kẻ độc hành không chịu trói buộc", "Nhân":"con người đứng giữa lựa chọn", "Vật":"linh vật mang dấu ấn thiên địa", "Sơn":"núi cao, trấn giữ và tích thế", "Hải":"biển sâu, dung nạp và cuộn trào", "Hà":"dòng chảy nối những nhân duyên", "Cốc":"u cốc kín đáo nuôi dưỡng căn cơ", "Phủ":"phủ vực cất giữ tài nguyên", "Cung":"cung khuyết trang nghiêm và truyền thừa", "Điện":"điện đường hội tụ uy nghi", "Các":"nơi tàng chứa học thức và bí bảo", "Lâu":"tầng lầu quan sát thế cuộc", "Đài":"pháp đài dùng để giao cảm thiên địa", "Đình":"nơi dừng chân giữa biến cục", "Viện":"nơi nghiên cứu và truyền học", "Thất":"mật thất để bế quan dưỡng đạo", "Ấn":"ấn ký xác lập quyền năng", "Chấn":"chấn động phá tan trì trệ", "Sát":"sát ý dùng để đoạn tuyệt", "Sinh":"sinh cơ không ngừng nảy nở", "Cách":"mệnh cách định hình khuynh hướng một đời"
  };

  function fateNarrative(fate) {
    if (fate.name === "Vạn Đạo") return "Bàng môn tả đạo có muôn vàn lối rẽ; mệnh cách này giúp mệnh nhân nhận rõ cơ duyên, đi thông con đường mình đã chọn mà ít lạc lối.";
    const parts = String(fate.name || "").trim().split(/\s+/);
    const first = parts[0]; const last = parts[parts.length - 1];
    const source = FATE_PREFIX_MEANINGS[first] || "một khí chất hiếm gặp";
    const domain = FATE_SUFFIX_MEANINGS[last] || "một nhánh thiên cơ chưa được gọi tên";
    const effectKeys = Object.entries(fate.effects || {}).filter(([, value]) => value && Number(value) !== 0).sort((a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1])));
    const effect = effectKeys.length ? ({ phyMult:"cường kiện thể phách", magMult:"khơi thông linh lực", allStatMult:"điều hòa toàn thân", qiFlat:"bồi đắp linh khí", fortune:"chiêu dẫn cơ duyên", sanResist:"định thần hộ thức", sanDrainMult:"khiến tà niệm dễ thừa khe xâm nhập", breakBonus:"trợ lực phá cảnh", lootMult:"tăng duyên đoạt bảo", lifespanBonus:"bồi bổ thọ nguyên", phyFlat:"gia cố thân thể" }[effectKeys[0][0]] || "làm thiên cơ chuyển dịch") : "không trực tiếp gia tăng sức mạnh mà âm thầm đổi hướng cơ duyên";
    if (fate.sign === "hung") return fate.name + " lấy " + source + " nhập vào " + domain + ". Đây là hung mệnh: nó có thể " + effect + ", song mệnh nhân càng cưỡng cầu càng dễ chuốc phản phệ; chỉ nên dùng khi đã hiểu rõ cái giá.";
    if (fate.sign === "cat") return fate.name + " tượng trưng cho " + source + " hòa cùng " + domain + ". Khí số này giúp mệnh nhân " + effect + ", gặp thời thì hóa hiểm thành cơ, nhưng vẫn cần thuận đạo mà hành mới giữ được phúc trạch lâu dài.";
    return fate.name + " biểu thị " + source + " nương theo " + domain + ". Mệnh thế thiên về quân bình, giúp mệnh nhân " + effect + "; thành bại phụ thuộc vào lựa chọn và quan hệ Tương Sinh, Tương Khắc với các Mệnh Số khác.";
  }

  function renderTechniqueDetail(state) {
    const techniques = window.GameEngine.getKnownTechniques(state);
    const stages = window.CONG_PHAP_DATA?.masteryStages || [];
    const categories = {
      tam_phap: { label: "Tâm Pháp", desc: "Căn bản vận khí; nhận nhiều Thông Thạo nhất khi tu luyện." },
      chieu_thuc: { label: "Chiến Đấu · Chiêu Thức", desc: "Nhận ít Thông Thạo khi tu luyện và nhận thêm khi chính chiêu này được dùng trong giao chiến." },
      than_phap: { label: "Thân Pháp", desc: "Rèn thân, bộ pháp và né tránh; tăng qua quá trình tu luyện." },
      phu_tro: { label: "Phụ Trợ", desc: "Trị liệu, gia trì và hộ thức; tăng qua quá trình tu luyện." },
      tran_phap: { label: "Trận Pháp", desc: "Dùng trận văn mượn thế thiên địa; tăng qua quá trình tu luyện." },
      cam_thuat: { label: "Cấm Thuật", desc: "Uy lực cao, trả giá bằng Thanh Tỉnh, Thọ Nguyên hoặc Tà Nhiễm; chỉ nhận chiến đấu khi thực sự thi triển." },
      dan_phu_phap: { label: "Đan · Phù · Tạp Pháp", desc: "Công pháp chuyên môn ngoài chiến đấu; tăng qua tu luyện và hoạt động tương ứng." }
    };
    const cardFor = (technique) => {
      const progress = window.GameEngine.techniqueProgress(state, technique.id);
      const visible = technique.visibleStats || {};
      const runtimePreview = window.GameEngine.techniquePreview(state, technique.id);
      const pct = progress.nextThreshold == null ? 100 : Math.min(100, Math.round(progress.masteryExp / progress.nextThreshold * 100));
      const evolution = state.player.techniques?.[technique.id]?.evolution; const choices = window.EXPANSION_DATA?.techniqueEvolutions?.[technique.id] || [];
      const evolutionControls = evolution?.status === "ready" ? choices.map((choice) => expansionButton("technique_evolve", choice.name, technique.id, 'data-expansion-arg2="' + escapeHtml(choice.id) + '"')).join("") : choices.length ? '<small>Tiến hóa: ' + escapeHtml(window.GameI18n?.formatStatus(evolution?.status || "locked") || "Chưa mở") + (evolution?.status === "trial" ? ' · tiến độ ' + Number(evolution.progress || 0) : '') + '</small>' : "";
      return '<article class="technique-card category-' + escapeHtml(technique.category) + '" title="' + escapeHtml(visible.baseEffect || technique.name) + '"><div class="technique-head"><b>' + escapeHtml(technique.name) + '</b><small>' + escapeHtml(window.GameI18n?.element(technique.element) || technique.element) + (technique.isCore ? ' · Cốt Lõi' : '') + '</small></div><p>' + escapeHtml(visible.baseEffect || "Chưa rõ hiệu quả.") + '</p>' + (runtimePreview.success ? '<small>Thiên tượng hiện tại: uy lực ×' + Number(runtimePreview.powerMultiplier || 1).toFixed(2) + '</small>' : '') + '<div class="stat-tags">' + renderEffects({ manaCost: visible.manaCost || 0, staminaCost: visible.staminaCost || 0, sanCost: visible.sanCost || 0, lifespanCost: visible.lifespanCost || 0, corruptionCost: visible.corruptionCost || 0, allStatMult: visible.allStatMultiplier || 0 }) + '</div><div class="mastery"><div>' + helpLabel(progress.stageName, "Tầng thông thạo hiện tại; tăng bằng vận dụng đúng hoàn cảnh và Ngộ tính.") + '<b>' + helpLabel("Thông Thạo", "EXP riêng của Công pháp, không phải Tu vi cảnh giới.") + ' ' + progress.masteryExp + (progress.nextThreshold == null ? ' · Tối đa' : '/' + progress.nextThreshold) + '</b></div><div class="mastery-bar"><span style="width:' + pct + '%"></span></div><small>' + escapeHtml(progress.nextStageName ? ('Còn ' + progress.remaining + ' EXP tới ' + progress.nextStageName + '. ' + progress.guide) : 'Đã đạt Đại Viên Mãn.') + '</small></div><div class="item-actions">' + evolutionControls + '</div></article>';
    };
    const order = ["tam_phap", "chieu_thuc", "than_phap", "phu_tro", "tran_phap", "cam_thuat", "dan_phu_phap"];
    const allCategories = order.concat([...new Set(techniques.map((technique) => technique.category))].filter((category) => !order.includes(category)));
    const groups = allCategories.map((category) => {
      const items = techniques.filter((technique) => technique.category === category);
      if (!items.length) return "";
      const meta = categories[category] || { label: window.GameI18n?.category(category) || "Dị Pháp", desc: "Truyền thừa đặc biệt, tuân theo quy tắc Thông Thạo riêng của engine." };
      return '<section class="technique-category group-' + category + '"><header><h3>' + meta.label + '</h3><p>' + meta.desc + '</p></header><div class="technique-grid">' + items.map(cardFor).join("") + '</div></section>';
    }).join("");
    return '<img class="modal-illustration" src="assets/ui/technique-illustration.webp" alt="Bí điển Công Pháp">' +
      '<div class="detail-block"><h4>Cách tăng cấp Công Pháp</h4><p>Mỗi lượt tu luyện đồng thời nhận Tu vi và Thông Thạo. Tâm Pháp nhận nhiều nhất, Công pháp chiến đấu nhận ít hơn; trong giao chiến chỉ Công pháp chiến đấu thực sự được thi triển mới tăng thêm. Các mốc: ' + escapeHtml(stages.join(" → ")) + '.</p></div>' +
      (groups || '<p class="empty-state">Chưa lĩnh ngộ Công Pháp nào.</p>');
  }

  function renderRewardSummary(summaries) {
    const list = (summaries || []).flatMap((summary) => [
      '<section class="reward-summary"><h3>✓ ' + escapeHtml(summary.title || "Nhiệm vụ hoàn thành") + '</h3>',
      '<ul>' + ((summary.rewards || []).map((reward) => '<li><b>' + escapeHtml(reward.type) + '</b>: ' + escapeHtml(reward.value) + '</li>').join("") || '<li>Không có phần thưởng hiển thị.</li>') + '</ul></section>'
    ]).join("");
    return '<div class="modal-illustration reward-banner">Phần thưởng đã ghi vào hành trang</div>' + list;
  }

  function renderFateSlotChooser(state, activeIndex) {
    const activeId = state.player.fates?.[activeIndex];
    const active = window.GameData.FATE_PATTERNS.find((f) => f.id === activeId);
    const vault = window.GameEngine.fateVaultSummary(state);
    return '<div class="detail-block"><h3>Ấn ký vị trí ' + (Number(activeIndex) + 1) + '</h3><p>Hiện tại: <b>' + escapeHtml(active?.name || "Trống") + '</b></p><p class="muted">Chọn một Mệnh Số trong Mệnh Kho để hoán đổi.</p><div class="fate-swap-list">' + (vault.ids.map((id) => { const fate = window.GameData.FATE_PATTERNS.find((f) => f.id === id); return '<button class="chip" data-fate-swap-active="' + activeIndex + '" data-fate-vault-id="' + escapeHtml(id) + '">' + escapeHtml(fate?.name || id) + '</button>'; }).join("") || '<span class="muted">Mệnh Kho đang trống.</span>') + '</div></div>';
  }

  function fateDeltaRows(preview) {
    if (!preview) return "";
    const rows = [
      ["Tổng Mệnh", preview.beforeFate?.total, preview.afterFate?.total],
      ["Hiệu Mệnh", preview.beforeFate?.effective, preview.afterFate?.effective],
      ["Tương hợp", preview.beforeMatch?.score, preview.afterMatch?.score],
      ["Thể phách", preview.beforeStats?.phy, preview.afterStats?.phy],
      ["Linh lực", preview.beforeStats?.mag, preview.afterStats?.mag]
    ];
    return '<div class="fate-delta-grid">' + rows.map(([label, before, after]) => '<div><span>' + label + '</span><b>' + before + ' → ' + after + '</b></div>').join("") + '</div>';
  }

  function renderFateReplacementChooser(state, vaultId) {
    const incoming = window.GameData.FATE_PATTERNS.find((f) => f.id === vaultId);
    const rows = (state.player.fates || []).map((id, index) => {
      const current = window.GameData.FATE_PATTERNS.find((f) => f.id === id);
      const preview = window.GameEngine.fateSwapPreview(state, index, vaultId);
      return '<article class="fate-replace-row"><header><b>' + escapeHtml(current?.name || "Ấn ký trống") + '</b><span>→ ' + escapeHtml(incoming?.name || vaultId) + '</span></header>' + fateDeltaRows(preview) + '<button class="guild-action" data-fate-swap-active="' + index + '" data-fate-vault-id="' + escapeHtml(vaultId) + '">Thay Ấn ký ' + (index + 1) + '</button></article>';
    }).join("");
    return '<div class="ritual-shell"><p class="muted">Tất cả Ấn ký đã đầy. Chọn Mệnh đang kích hoạt để đưa xuống kho; thay đổi chỉ được commit sau cú bấm bên dưới.</p>' + rows + '</div>';
  }

  function renderFateUpgradeChooser(state, targetId) {
    const target = window.GameData.FATE_PATTERNS.find((f) => f.id === targetId);
    const materials = (state.fateInventory || []).filter((id) => id !== targetId && window.GameData.FATE_PATTERNS.find((f) => f.id === id)?.grade === target?.grade);
    const base = window.GameEngine.fateUpgradePreview(state, targetId);
    if (base.capped) return '<div class="detail-block"><h3>' + escapeHtml(target?.name || targetId) + ' · +5</h3><p>Đã đạt Cường Hóa tối đa.</p></div>';
    const rows = materials.map((id) => {
      const material = window.GameData.FATE_PATTERNS.find((f) => f.id === id);
      const preview = window.GameEngine.fateUpgradePreview(state, targetId, id);
      return '<article class="fate-replace-row"><header><b>Tiêu hao: ' + escapeHtml(material?.name || id) + '</b><span>Cường Hóa +' + preview.level + ' → +' + preview.afterLevel + '</span></header><div class="fate-delta-grid"><div><span>Mệnh Điểm</span><b>' + preview.beforeScore + ' → ' + preview.afterScore + '</b></div><div><span>Modifier dương</span><b>+' + (preview.level * 5) + '% → +' + (preview.afterLevel * 5) + '%</b></div></div><button class="guild-action" data-fate-upgrade-confirm="' + escapeHtml(targetId) + '" data-fate-upgrade-material="' + escapeHtml(id) + '">Nâng cấp bằng Mệnh này</button></article>';
    }).join("");
    return '<div class="ritual-shell"><h3>' + escapeHtml(target?.name || targetId) + ' · Cường Hóa +' + base.level + '</h3><p class="muted">Chọn một Mệnh cùng phẩm trong Mệnh Kho. Nguyên liệu sẽ bị tiêu hao vĩnh viễn.</p>' + (rows || '<p class="empty-state">Thiếu nguyên liệu cùng phẩm ' + escapeHtml(target?.gradeLabel || target?.grade || "") + ' trong Mệnh Kho.</p>') + '</div>';
  }

  function renderPendingFateChooser(state) {
    const pending = state.pendingFateReward;
    const incoming = window.GameData.FATE_PATTERNS.find((f) => f.id === pending?.fateId);
    const rows = (state.fateInventory || []).map((id) => { const fate = window.GameData.FATE_PATTERNS.find((f) => f.id === id); return '<button class="fate-vault-replace-button" data-pending-fate-replace="' + escapeHtml(id) + '"><b>' + escapeHtml(fate?.name || id) + '</b><span>Tương hợp ' + window.GameEngine.fateCompatibility(state.player.pathId, fate) + '</span></button>'; }).join("");
    return '<div class="ritual-shell"><h3>Nhận ' + escapeHtml(incoming?.name || pending?.fateId || "Mệnh Số") + '</h3><p>Chọn một Mệnh trong kho để thay. Mệnh bị thay sẽ mất vĩnh viễn.</p><div class="fate-vault-replace-list">' + rows + '</div></div>';
  }

  function renderRitualModal(state, gate, action) {
    const status = window.GameEngine.breakthroughRitualStatus(state);
    const progress = window.GameEngine.breakthroughRequirements(state);
    const labels = { call_fate: "Gọi Mệnh", compare: "Đối Chiếu Con Đường", anchor: "Dựng Neo", omen: "Vượt Dị Tượng", cost: "Trả Giá", trial: "Thử Thách Cuối" };
    const descriptions = { call_fate: "Kết nối Mệnh đang kích hoạt với cảnh giới kế tiếp.", compare: "Đối chiếu Mệnh Số và Công Pháp với Con Đường đã chọn.", anchor: "Xác lập Neo Nhân Tính để giữ tâm trí ổn định.", omen: "Đối diện Dị Tượng bằng Căn Cốt và Ngộ Tính.", cost: "Thanh toán cái giá cuối của nghi thức.", trial: "Chứng minh tư cách bước ra ngoài giới hạn hiện tại." };
    const steps = status.plan.map((step) => '<div class="ritual-step ' + (status.completed.includes(step) ? 'done' : step === gate ? 'current' : '') + '"><span>' + (status.completed.includes(step) ? '✓' : status.plan.indexOf(step) + 1) + '</span><b>' + labels[step] + '</b></div>').join("");
    const gateChecks = window.GameEngine.breakthroughRitualGateRequirements(state, gate);
    const checks = (gateChecks.length ? gateChecks : (progress.requirements || []).filter((item) => item.label !== "Nghi thức đột phá")).map((item) => '<li class="' + (item.met ? 'met' : 'missing') + '"><span>' + (item.met ? '✓' : '!') + '</span><b>' + escapeHtml(item.label) + '</b><em>' + escapeHtml(String(item.current)) + ' / ' + escapeHtml(String(item.target)) + '</em></li>').join("");
    const blocked = Boolean(action?.disabled_reason);
    const anchorList = gate === "anchor" && window.GameEngine.anchorCandidates ? window.GameEngine.anchorCandidates(state) : [];
    const anchorPanel = gate === "anchor" ? '<div class="detail-block anchor-choice"><h4>Chọn Neo Nhân Tính</h4><p class="muted">Chọn một NPC đã đủ tin cậy hoặc tôn trọng. Neo phải được giữ nguyên vẹn trong suốt nghi thức.</p>' + (anchorList.length ? anchorList.map((candidate) => '<button class="chip" data-anchor-select="' + escapeHtml(candidate.npcId) + '">' + escapeHtml(candidate.name) + ' · ổn định ' + candidate.stability + '</button>').join('') : '<p class="empty-state">Chưa có NPC đủ quan hệ. Hãy tương tác và xây dựng Tin Cậy/Tôn Trọng trước.</p>') + '</div>' : '';
    const shortcuts = blocked ? '<div class="ritual-shortcuts"><button class="guild-action" data-ritual-open="fate">Mở Tử Vi Mệnh Số</button><button class="guild-action" data-ritual-open="technique">Mở Công Pháp</button></div>' : '';
    const risk = gate === "omen" ? "Bước có xác suất; thất bại có thể mất 3 Thanh Tĩnh." : gate === "cost" ? "Tiêu hao 5 Thanh Tĩnh, không hoàn lại." : "Đối chiếu xác định, không roll ngẫu nhiên.";
    return '<div class="ritual-shell"><header class="ritual-heading"><small>NGHI THỨC ĐỘT PHÁ</small><h3>' + escapeHtml(window.GameEngine.pathTitle(state)) + ' → ' + escapeHtml(status.next?.name || "Cảnh giới kế") + '</h3></header><div class="ritual-stepper">' + steps + '</div><section class="ritual-current"><span>BƯỚC HIỆN TẠI</span><h3>' + labels[gate] + '</h3><p>' + descriptions[gate] + '</p></section><ul class="ritual-checklist">' + checks + '</ul>' + anchorPanel + '<div class="ritual-outcome"><div><b>Kết quả</b><span>Hoàn tất cổng và mở bước nghi thức tiếp theo.</span></div><div><b>Chi phí & rủi ro</b><span>' + risk + '</span></div></div>' + (blocked ? '<p class="ritual-blocker">Còn thiếu: ' + escapeHtml(action.disabled_reason) + '</p>' : '<p class="ritual-ready">✓ Toàn bộ điều kiện của bước này đã sẵn sàng.</p>') + shortcuts + '<button class="btn btn-primary ritual-confirm" data-ritual-confirm="' + gate + '"' + (blocked ? ' disabled' : '') + '>Hoàn tất ' + labels[gate] + '</button></div>';
  }

  function renderRealmDetail(state) {
    const realms = window.GameData.REALMS || [];
    const currentLevel = window.GameEngine.cultivationTier(state);
    const pathId = state.player.pathId;
    const pathTitles = window.PATH_FATE_RELATIONS?.path_titles?.[pathId] || [];
    const level2Title = pathId && pathTitles[1] ? pathTitles[1] : "Khai Lộ Cảnh";
    const pathNames = { kiem_dao:"Kiếm Đạo", dan_dao:"Đan Đạo", phu_dao:"Phù Đạo", phong_thuy_dao:"Phong Thủy Đạo", ngu_thu_dao:"Ngự Thú Đạo", khoi_loi_dao:"Khôi Lỗi Đạo", am_luat_dao:"Âm Luật Đạo", mong_canh_dao:"Mộng Cảnh Đạo", luyen_the_dao:"Luyện Thể Đạo", tinh_tuong_dao:"Tinh Tượng Đạo", ngoai_dao_gia:"Ngoại Đạo Giả" };
    const current = realms.find((realm) => Number(realm.level) === currentLevel) || realms[currentLevel - 1];
    const route = '<div class="realm-path-banner"><b>Di Mệnh Cảnh</b><span>→</span><b>' + escapeHtml(level2Title) + '</b><span>→</span><b>' + escapeHtml(pathId ? ((pathNames[pathId] || "Con Đường đã chọn") + ' · ' + window.GameEngine.pathTitle(state)) : "Bắt buộc chọn Con Đường") + '</b></div>';
    const nodes = realms.map((realm, index) => {
      const level = Number(realm.level || index + 1);
      const revealed = level <= currentLevel || (level === currentLevel + 1 && (level <= 2 || Boolean(pathId)));
      const title = revealed ? (level === 1 ? "Di Mệnh Cảnh" : level === 2 ? level2Title : (pathTitles[index] || realm.name)) : "???";
      const cls = level === currentLevel ? "current" : level < currentLevel ? "complete" : revealed && level === currentLevel + 1 ? "next" : "locked sealed";
      const lore = revealed ? window.GameEngine.realmLore(state, realm).text : "Thiên cơ bị che lấp. Chỉ khi bước lên cảnh kế tiếp, một tầng bí mật mới hiện hình.";
      return '<article class="realm-node ' + cls + '"><span>' + (revealed ? level : "?") + '</span><div><b>' + escapeHtml(title) + '</b><small>' + escapeHtml(lore) + '</small></div></article>';
    }).join("");
    const pathGuide = window.GameEngine.pathProgression ? window.GameEngine.pathProgression(state) : null;
    return '<div class="detail-block"><h4>Cảnh Giới</h4>' + route + '<p>Hiện tại: <b>' + escapeHtml(window.GameEngine.pathTitle(state)) + '</b>. Thiên cơ chỉ hé lộ cảnh kế tiếp; từ Khai Lộ trở đi, danh xưng đồng bộ hoàn toàn với Con Đường đã chọn.</p>' + (pathGuide ? '<p class="realm-path-guide"><b>Tiến trình Con Đường:</b> ' + escapeHtml(pathGuide.next) + '<br><small>' + escapeHtml(pathGuide.requirements.join(' · ')) + '</small></p>' : '') + '</div>' + renderBreakthrough(state) + '<div class="realm-timeline">' + nodes + '</div>' +
      (current ? '<div class="detail-block"><h4>Giải nghĩa cảnh hiện tại</h4><p>' + escapeHtml(window.GameEngine.realmLore(state, current).text) + '</p></div>' : '');
  }

  function renderMapDetail(state) {
    return '<img class="modal-illustration" src="assets/ui/map-illustration.webp" alt="Bản đồ Vạn Giới Lộ">' + renderMap(state);
  }

  function setActiveTab(name) {
    const tab = document.querySelector('.tab[data-tab="' + name + '"]');
    if (!tab) return false;
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    return true;
  }

  function openOverlay(title, content, options = {}) {
    const overlay = document.getElementById("overlay");
    const titleEl = document.getElementById("overlay-title");
    const contentEl = document.getElementById("overlay-content");
    if (!overlay || !titleEl || !contentEl) return;
    titleEl.textContent = title;
    contentEl.innerHTML = content;
    overlay.classList.toggle("overlay-locked", Boolean(options.locked));
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeOverlay(force = false) {
    const overlay = document.getElementById("overlay");
    if (!overlay) return;
    if (!force && overlay.classList.contains("overlay-locked")) return;
    overlay.classList.add("hidden");
    overlay.classList.remove("overlay-locked");
    overlay.setAttribute("aria-hidden", "true");
  }

  function bindOverlay() {
    const close = document.getElementById("overlay-close");
    const overlay = document.getElementById("overlay");
    if (close) close.addEventListener("click", () => closeOverlay());
    if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOverlay(); });
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return {
    showScreen, addStory, renderStoryWindow, clearStory, renderChoices, clearChoices, actionPresentation, renderActions, renderOriginChoice,
    setLocation, setSaveIndicator, renderPanel, setMapView, setActiveTab,
    renderFateDetail, renderFateSlotChooser, renderFateReplacementChooser, renderFateUpgradeChooser, renderPendingFateChooser, renderRitualModal, renderRewardSummary, renderTechniqueDetail, renderRealmDetail, renderMapDetail, renderMapFactionDetail, renderMarket, renderBlackMarket, renderQintian, renderInventoryModal, renderExpansion, renderWorld, renderOddities, renderProfessionSection, renderTechniqueEvolutionSection, renderFateEvolutionModal, renderGuildProjectModal, renderContestedOpportunityModal,
    openOverlay, closeOverlay, bindOverlay, escapeHtml, openEquipmentPicker
  };
})();
