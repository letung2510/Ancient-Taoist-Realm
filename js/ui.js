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

  function renderActions(state, onAction) {
    const box = document.getElementById("action-list");
    if (!box || !window.GameEngine.contextState) return;
    box.innerHTML = "";
    const ctx = window.GameEngine.contextState(state);
    const order = { move: 0, talk: 1, combat: 2, skill: 3, primary: 4, info: 5 };
    const sorted = (ctx.actions || []).slice().sort((a, b) => {
      const rank = (id) => id.startsWith("act_move_") ? 0 : id.startsWith("act_talk_") ? 1 : id.startsWith("act_tan_cong") || id.startsWith("act_bo_chay") ? 2 : id.startsWith("act_skill_") ? 3 : id.startsWith("act_tu_luyen") || id === "act_be_quan" || id === "act_tim_kiem" || id === "act_dot_pha" || id === "act_nghi_ngoi" ? 4 : 5;
      return rank(a.id) - rank(b.id);
    });
    sorted.forEach((action) => {
      const btn = document.createElement("button");
      btn.className = "chip action-chip" + (action.priority === 0 ? " danger" : "");
      btn.textContent = action.label;
      if (action.disabled_reason || action.disabled) {
        btn.disabled = true;
        btn.title = action.disabled_reason || "Chưa sẵn sàng";
      }
      btn.addEventListener("click", () => onAction(action));
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
    else if (active === "market") html = renderMarket(state);
    else if (active === "qintian") html = renderQintian(state);
    else if (active === "cauldron") html = renderCauldron(state);
    document.getElementById("tab-content").innerHTML = html;
  }

  function renderMarket(state) {
    const offers = window.GameEngine.marketOffers(state);
    return '<div class="section-title">Phường thị · Mệnh Số, Đan dược, Trang bị</div><p class="muted">Hàng hóa tự đổi mỗi 60 giây · mua bằng Linh thạch.</p><div class="market-grid">' + offers.map((offer) => { const item = offer.kind === "fate" ? window.GameData.FATE_PATTERNS.find((f) => f.id === offer.id) : window.GameData.ITEMS[offer.id]; return '<article class="market-card"><b>' + escapeHtml(item?.name || offer.id) + '</b><small>' + escapeHtml(item?.gradeLabel || item?.desc || offer.kind) + '</small><button class="guild-action" data-market-offer="' + escapeHtml(offer.id) + '" data-market-kind="' + offer.kind + '">Mua · ' + offer.price.linhThach + ' Linh thạch</button></article>'; }).join("") + '</div>';
  }

  function renderQintian(state) {
    const stock = window.GameEngine.qintianFateOffers(state);
    return '<div class="section-title">Khâm Thiên Giám</div><p class="muted">Hiến tế 10 năm Thọ Nguyên để cầu một Mệnh Số. Mệnh Kho phải còn chỗ.</p><div class="market-grid">' + stock.map((f) => '<article class="market-card fate-card grade-' + f.grade + '"><b>' + escapeHtml(f.name) + '</b><small>' + escapeHtml(f.gradeLabel || f.grade) + ' · Cát · Hiệu quả +' + f.score + '</small><button class="guild-action" data-qintian-fate="' + escapeHtml(f.id) + '">Hiến tế · 10 năm</button></article>').join("") + '</div>';
  }

  function renderCauldron(state) {
    return '<div class="section-title">Hư Thiên Đỉnh</div><p class="muted">Chọn 3–9 vật phẩm không dùng để dung luyện thành Mệnh Số hoặc bảo vật mới.</p><div class="cauldron-selection" data-cauldron-selection><b>Đã chọn: <span data-cauldron-count>0</span>/9</b><button class="guild-action" data-cauldron-refine>Dung Luyện</button></div>' + renderInventory(state, { selectable: true });
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
    return entries.map(([key, value]) => '<span class="stat-tag">' + helpLabel(escapeHtml(EFFECT_LABELS[key] || key), EFFECT_HELP[key] || "Chỉ số hiệu dụng của hiệu ứng này.") + ' ' + escapeHtml(effectValue(key, value)) + '</span>').join(" ");
  }

  function helpLabel(label, help) {
    return '<span class="has-help" tabindex="0" data-help="' + escapeHtml(help) + '">' + label + '<i>?</i></span>';
  }

  function renderBreakthrough(state) {
    const progress = window.GameEngine.breakthroughRequirements(state);
    if (!progress.next) return '<div class="realm-guide ready"><b>Đã đạt cảnh giới tối thượng</b></div>';
    const currentTitle = window.GameEngine.realmLore(state, progress.current).title;
    const nextTitle = window.GameEngine.realmLore(state, progress.next).title;
    const blockers = window.GameEngine.getBreakthroughBlockers ? window.GameEngine.getBreakthroughBlockers(state) : [];
    return '<div class="realm-guide ' + (progress.ready ? "ready" : "") + '" title="' + escapeHtml(blockers.join("; ")) + '"><div class="realm-route"><b>' + escapeHtml(currentTitle) + '</b><span>→</span><b>' + escapeHtml(nextTitle) + '</b></div>' +
      '<p>Cách thăng cấp: ' + (Number(progress.current.level) === 1 ? 'tu luyện đủ 100 Tu vi rồi chọn <b>Đột Phá</b>, hoặc dùng Thông Mạch Đan/Tụ Khí Đan/Hoán Huyết Đan để khai lộ sớm.' : 'hoàn thành mọi điều kiện bên dưới, sau đó chọn <b>Đột Phá</b>.') + '</p><div class="requirement-grid">' +
      progress.requirements.map((item) => '<div class="requirement ' + (item.met ? "met" : "missing") + '"><span>' + (item.met ? "✓" : "○") + ' ' + helpLabel(escapeHtml(item.label), "Điều kiện bắt buộc do engine cảnh giới kiểm tra trước khi cho phép Đột Phá.") + '</span><b>' + escapeHtml(item.current) + ' / ' + escapeHtml(item.target) + '</b>' + ((/Mệnh|Tương hợp|Mệnh dẫn|Mệnh hiệu/i.test(item.label) && !item.met) ? '<button class="help-button" data-fate-suggest="' + escapeHtml(item.label) + '">?</button>' : '') + '</div>').join("") +
      '</div></div>';
  }

  function renderStatus(state) {
    const p = state.player;
    const s = p.stats;
    const rootProfile = p.spiritualRootProfile || window.GameEngine.spiritualRootProfile(p);
    const rootGrade = rootProfile.label || p.spiritualRootGrade || window.GameEngine.spiritualRootGrade(p.spiritualRoots);
    const roots = (rootProfile.elements || []);
    const equipment = window.GameEngine.equipmentSummary(state);
    const itemName = (id) => id ? (window.GameData.ITEMS[id]?.name || id) : "Chưa trang bị";
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
      '<div class="kv">' + helpLabel("Xuất thân", "Thân phận xã hội khởi đầu hoặc hiện tại; ảnh hưởng cách NPC và thế lực đối đãi.") + '<b>' + (p.background || "Vô Danh") + "</b></div>" +
      '<div class="kv">' + helpLabel("Mục tiêu ẩn", "Chấp niệm sâu nhất của nhân vật, có thể mở khóa lựa chọn và kết cục riêng.") + '<b>' + (p.hiddenGoal || "Trường sinh") + "</b></div>" +
      '<div class="kv">' + helpLabel("Công pháp chủ tu", "Pháp môn đang định hình cách vận hành linh khí; chi tiết và cấp thông thạo nằm trong modal Công Pháp.") + '<b>' + (p.cultivationMethod || "Dẫn Khí Nhập Môn") + "</b></div>" +
      '<div class="kv">' + helpLabel("Thể phách", "Sức mạnh thân thể; tăng sát thương vật lý, khí huyết tối đa và thể lực.") + '<b>' + s.phy + "</b></div>" +
      '<div class="kv">' + helpLabel("Linh lực", "Năng lực vận chuyển linh khí; tăng linh khí tối đa và hiệu quả công pháp.") + '<b>' + s.mag + "</b></div>" +
      '<div class="kv">' + helpLabel("Khí Vận", fortune.desc + " Danh xưng được suy ra từ tổng Khí Vận ẩn; engine vẫn giữ trị số để tính cơ duyên nhưng UI không phơi số thô.") + '<b>' + fortune.name + "</b></div>" +
      '<div class="kv">' + helpLabel("Thọ Nguyên", "Số năm sinh mệnh còn lại; cấm thuật, tế lễ và thời gian có thể tiêu hao. Về 0 sẽ dẫn tới Luân Hồi hoặc tử cục.") + '<b>' + p.lifespan + " năm</b></div>" +
      '<div class="kv">' + helpLabel("Tu Vi", "Tích lũy qua tu luyện và trải nghiệm. Đủ Tu vi cùng các điều kiện cảnh giới mới có thể Đột Phá.") + '<b>' + p.exp + (next ? " / " + (r.breakExp * (p.pathId === "ngoai_dao_gia" ? 5 : 1)) : "") + "</b></div>" +
      '<div class="kv">' + helpLabel("Công Đức", "Thiện nghiệp và uy tín đạo nghĩa; dùng để hóa giải nhân quả, giao dịch đặc thù và trả giá khi thoát ly tông môn.") + '<b>' + Number(p.merit || 0) + "</b></div>" +
      '<div class="kv">' + helpLabel("Mệnh Trạng Thái", "Tình trạng vận hành tổng thể của Mệnh Số, bao gồm trưởng thành, phản phệ, tà thần can thiệp hoặc siêu thoát.") + '<b>' + window.GameEngine.fateStatusLabel(state) + "</b></div>" +
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
        return '<div class="equip-pick-row"><div><b>' + escapeHtml(it.name) + '</b><small>' + escapeHtml(it.desc || "Không rõ lai lịch.") + (equipped ? ' · Đang trang bị' : '') + '</small></div><button class="item-action" data-equip-pick="' + id + '" data-equip-action="' + actionId + '">' + (equipped ? "Tháo" : "Trang Bị") + '</button></div>';
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
      if (!it) return '<div class="item-row quest-failed">Vật phẩm không xác định: ' + id + "</div>";
      const equipped = equippedIds.has(id) ? " · Đang trang bị" : "";
      const generated = it.generated ? " · Procedural" : "";
      const cursed = it.cursed ? " · Nguyền rủa" : "";
      const actions = window.GameEngine.inventoryActions(state, id).map((action) =>
        '<button class="item-action" data-item-action="' + action.id + '" data-item-id="' + id + '">' + action.label + '</button>'
      ).join(" ");
      const categoryLabel = window.GameEngine.equipmentCategoryLabel(it);
      const itemEffects = Object.fromEntries(["phy", "mag", "sanResist", "phyDef", "heal", "exp", "san"].filter((key) => it[key] != null).map((key) => [key, it[key]]));
      return '<div class="item-row inspectable" title="' + escapeHtml(it.desc || "Không rõ lai lịch.") + '"><b>' + (options.selectable ? '<input type="checkbox" data-cauldron-item="' + escapeHtml(id) + '"> ' : '') + it.name + '</b> ×' + state.inventory[id] + '<br><small>' +
        categoryLabel + equipped + generated + cursed + '<br>' + (it.desc || "Không rõ lai lịch.") + '</small><div class="stat-tags">' + renderEffects(itemEffects) + '</div><div class="item-actions">' + actions + '</div></div>';
    }).join("");
  }
  function renderInventoryModal(state) {
    return '<img class="modal-illustration" src="assets/ui/fate-illustration.webp" alt="Hành trang"><div class="detail-block"><h4>Hành Trang</h4><p class="muted">Vật phẩm đã trang bị được ẩn mặc định; mở bộ chọn Trang Bị để xem vật phẩm cùng loại.</p></div>' + renderInventory(state, { hideEquipped: true });
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
      return '<div class="rel-row">' + (npc ? npc.name : id) + '<br><small>' +
        helpLabel("Tín", "Mức độ nhân vật tin cậy mệnh nhân.") + ': ' + r.trust + ' · ' +
        helpLabel("Sợ", "Mức độ nhân vật sợ hãi uy thế của mệnh nhân.") + ': ' + r.fear + ' · ' +
        helpLabel("Kính", "Mức độ kính trọng danh vọng và hành vi của mệnh nhân.") + ': ' + r.respect + ' · ' +
        helpLabel("Nghi", "Mức độ hoài nghi; quá cao có thể khóa đối thoại hoặc dẫn tới phản bội.") + ': ' + r.suspicion + "</small></div>";
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
        '<button class="guild-action danger" data-guild-leave="true">Thoát ly tông môn</button></div>';
    }

    if (window.GameEngine.cultivationTier(state) === 1) {
      return '<div class="section-title">Môn Phái / Đạo Lộ</div>' +
        '<p class="muted">Đang ở Di Mệnh Cảnh. Hãy tích đủ EXP hoặc dùng đan khai mạch để bước vào Khai Lộ Cảnh.</p>';
    }

    const regionId = data.WORLD_MAP.locations[state.locationId]?.region || "trung_vuc";
    const region = data.WORLD_MAP.regions.find((item) => item.id === regionId);
    const regional = data.GUILDS.filter((guild) => guild.region_id === regionId);
    const available = regional.filter((guild) => window.GameEngine.guildEligibility(state, guild).visible)
      .sort((a, b) => a.pyramid_tier - b.pyramid_tier || b.reputation - a.reputation);
    const decision = state.pendingGuildChoice
      ? '<div class="guild-decision"><b>Nhiệm vụ: Lựa Chọn Đạo Lộ</b><p>Gia nhập một môn phái bên dưới, hoặc từ chối để tự chọn con đường.</p>' +
        '<button class="guild-action" data-guild-refuse="tan_tu">Chọn Tán Tu</button> ' +
        '<button class="guild-action" data-guild-refuse="the_gia">Chọn Thế Gia</button></div>'
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
        guild.name + ' · ' + escapeHtml(window.GameEngine.guildTierInfo(guild).name) + ' · ' + guild.highest_realm_text + '"></div>';
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
      const narrative = fateNarrative(fate);
      return '<article class="fate-card ' + (fate.sign || "binh") + ' grade-' + escapeHtml(fate.grade || "phan") + '" title="' + escapeHtml(narrative) + '"><div><b>' + escapeHtml(fate.name) + '</b><small><span class="fate-grade-badge">' + escapeHtml(fate.gradeLabel || fate.grade || "") + '</span> · ' + sign + ' · ' + helpLabel("Mệnh Điểm", "Giá trị gốc đóng góp vào Tổng Mệnh; Hung Mệnh có thể mang điểm âm.") + ' ' + fate.score + (compatibility == null ? "" : ' · ' + helpLabel("Tương hợp", "Mức phù hợp giữa Mệnh Số này và Con Đường đang chọn.") + ' ' + compatibility) + '</small></div><p>' + escapeHtml(narrative) + '</p><div class="stat-tags">' + renderEffects(fate.effects) + '</div>' + (inVault ? '<span class="vault-mark">Trong Mệnh Kho</span>' : '') + '</article>';
    };
    const relations = relation.activePairs.map((pair) => '<div class="relation-edge ' + (pair.type === "TUONG_SINH" ? "positive" : "negative") + '"><b>' + (pair.type === "TUONG_SINH" ? "↔ Tương Sinh" : "⚡ Tương Khắc") + '</b><span>' + escapeHtml(pair.label || (pair.from + " ↔ " + pair.to)) + '</span></div>').join("") +
      relation.activeCombos.map((combo) => '<div class="relation-edge combo"><b>★ ' + escapeHtml(combo.name) + '</b><span>' + escapeHtml(combo.effect || "Combo Mệnh Số") + '</span></div>').join("");
    const ownedText = vault.ownedCount + " Mệnh Số sở hữu · " + vault.activeCount + " đang kích hoạt";
    const slotCount = Number((window.GameData.REALMS || []).find((r) => r.id === p.realmId)?.activeSlots || (p.fates || []).length);
    const paperSlots = Array.from({ length: Math.max(slotCount, (p.fates || []).length) }, (_, index) => { const id = (p.fates || [])[index]; const fate = window.GameData.FATE_PATTERNS.find((f) => f.id === id); return '<button class="fate-anchor' + (fate ? '' : ' empty') + '" data-fate-slot="' + index + '" title="' + escapeHtml(fate ? fate.name : "Ấn ký trống — chọn Mệnh Số từ Mệnh Kho") + '">' + escapeHtml(fate ? fate.name : "Trống · gắn từ Mệnh Kho") + '</button>'; }).join("");
    return '<img class="modal-illustration" src="assets/ui/fate-illustration.webp" alt="Tinh bàn Mệnh Số">' +
      '<p class="muted fate-owned-count">' + escapeHtml(ownedText) + '</p><div class="fate-view-toggle"><button class="chip" data-fate-view="body">Xem dạng cơ thể</button><button class="chip" data-fate-view="grid">Xem dạng lưới</button></div><div class="fate-paperdoll"><img src="assets/ui/fate-paperdoll.png" alt="Cơ thể Ấn ký Mệnh Số"><div class="fate-anchor-list">' + paperSlots + '</div></div>' +
      '<div class="detail-summary"><b>' + helpLabel("Tổng Mệnh", "Tổng điểm nguyên bản của mọi Mệnh Số đang kích hoạt, gồm cả Cát, Bình và Hung.") + ' ' + total.total + '</b><span>' + helpLabel("Thuận Mệnh", "Tổng điểm Cát và Bình trước khi chịu ảnh hưởng của Hung Mệnh.") + ' ' + total.normal + '</span><span>' + helpLabel("Hiệu Mệnh", "Điểm Mệnh thực sự được engine dùng sau khi tính Hung Mệnh, Mệnh Trái, Mệnh Dư và khế ước.") + ' ' + total.effective + '</span><span>' + helpLabel("Mệnh Hòa Tỷ", "Tỷ số Tổng Mệnh trên trị tuyệt đối Thuận Mệnh. 1,00 là ổn định; thấp hơn 1 cho thấy Hung Mệnh đang bào mòn, số âm báo hiệu phản phệ nghiêm trọng.") + ' ' + total.ratio.toFixed(2) + '</span></div>' +
      '<div class="detail-block"><h4>Cách tăng Mệnh</h4><p>Thu nhận Mệnh Số qua cơ duyên, nhiệm vụ và chiến lợi phẩm; ưu tiên Mệnh có điểm tương hợp cao với Con Đường. Tương Sinh/Combo tăng sức mạnh, còn Tương Khắc có thể làm giảm chỉ số và hao Tỉnh Táo. Mệnh Số không dùng EXP riêng.</p></div>' +
      '<div class="detail-columns" hidden><section><h3>Mệnh đang kích hoạt</h3>' + (p.fates || []).map((id) => fateCard(id, false)).join("") + '</section><section><h3>Mệnh Kho · ' + vault.used + '/' + vault.capacity + '</h3><p class="muted">Kho dự trữ Mệnh chưa kích hoạt. Hiến tế Mệnh trong kho có thể triệu hoán Mệnh tương hợp hơn sau khi đã chọn Con Đường.</p>' + (vault.ids.length ? vault.ids.map((id) => fateCard(id, true)).join("") : '<p class="empty-state">Mệnh Kho đang trống.</p>') + '</section></div>' +
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
      const pct = progress.nextThreshold == null ? 100 : Math.min(100, Math.round(progress.masteryExp / progress.nextThreshold * 100));
      return '<article class="technique-card category-' + escapeHtml(technique.category) + '" title="' + escapeHtml(visible.baseEffect || technique.name) + '"><div class="technique-head"><b>' + escapeHtml(technique.name) + '</b><small>' + escapeHtml(technique.element) + (technique.isCore ? ' · Cốt Lõi' : '') + '</small></div><p>' + escapeHtml(visible.baseEffect || "Chưa rõ hiệu quả.") + '</p><div class="stat-tags">' + renderEffects({ manaCost: visible.manaCost || 0, staminaCost: visible.staminaCost || 0, sanCost: visible.sanCost || 0, lifespanCost: visible.lifespanCost || 0, corruptionCost: visible.corruptionCost || 0, allStatMult: visible.allStatMultiplier || 0 }) + '</div><div class="mastery"><div>' + helpLabel(progress.stageName, "Tầng thông thạo hiện tại; tăng bằng vận dụng đúng hoàn cảnh và Ngộ tính.") + '<b>' + helpLabel("Thông Thạo", "EXP riêng của Công pháp, không phải Tu vi cảnh giới.") + ' ' + progress.masteryExp + (progress.nextThreshold == null ? ' · Tối đa' : '/' + progress.nextThreshold) + '</b></div><div class="mastery-bar"><span style="width:' + pct + '%"></span></div><small>' + escapeHtml(progress.nextStageName ? ('Còn ' + progress.remaining + ' EXP tới ' + progress.nextStageName + '. ' + progress.guide) : 'Đã đạt Đại Viên Mãn.') + '</small></div></article>';
    };
    const order = ["tam_phap", "chieu_thuc", "than_phap", "phu_tro", "tran_phap", "cam_thuat", "dan_phu_phap"];
    const allCategories = order.concat([...new Set(techniques.map((technique) => technique.category))].filter((category) => !order.includes(category)));
    const groups = allCategories.map((category) => {
      const items = techniques.filter((technique) => technique.category === category);
      if (!items.length) return "";
      const meta = categories[category] || { label: "Dị Pháp · " + category, desc: "Truyền thừa đặc biệt, tuân theo quy tắc Thông Thạo riêng của engine." };
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

  function openOverlay(title, content) {
    const overlay = document.getElementById("overlay");
    const titleEl = document.getElementById("overlay-title");
    const contentEl = document.getElementById("overlay-content");
    if (!overlay || !titleEl || !contentEl) return;
    titleEl.textContent = title;
    contentEl.innerHTML = content;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeOverlay() {
    const overlay = document.getElementById("overlay");
    if (!overlay) return;
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }

  function bindOverlay() {
    const close = document.getElementById("overlay-close");
    const overlay = document.getElementById("overlay");
    if (close) close.addEventListener("click", closeOverlay);
    if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOverlay(); });
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return {
    showScreen, addStory, renderStoryWindow, clearStory, renderChoices, clearChoices, renderActions,
    setLocation, setSaveIndicator, renderPanel, setMapView, setActiveTab,
    renderFateDetail, renderFateSlotChooser, renderRewardSummary, renderTechniqueDetail, renderRealmDetail, renderMapDetail, renderMarket, renderQintian, renderInventoryModal,
    openOverlay, closeOverlay, bindOverlay, escapeHtml, openEquipmentPicker
  };
})();
