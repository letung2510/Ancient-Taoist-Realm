/* ============================================================
 * CỔ DỊ DIỆN — Main application wiring
 * ============================================================ */
(function () {
  "use strict";

  const D = window.GameData;
  const E = window.GameEngine;
  const UI = window.GameUI;

  const SAVE_KEY = "co_di_dien_save_v12";
  const LEGACY_SAVE_KEYS = ["co_di_dien_save_v11"];
  let state = null;

  // Serialize game-changing actions. Rapid clicks used to mutate state while
  // the story panel was still rendering, leaving later entries/buttons stuck.
  const pendingActions = [];
  let drainingActions = false;
  let renderedHistoryEntries = new WeakSet();
  let storyWindowSize = 20;
  const commandHistory = [];
  let commandHistoryCursor = -1;

  function enqueueAction(task) {
    if (typeof task !== "function") return;
    pendingActions.push(task);
    if (drainingActions) return;
    drainingActions = true;
    const drain = () => {
      if (!state) {
        pendingActions.length = 0;
        drainingActions = false;
        return;
      }
      const next = pendingActions.shift();
      if (!next) {
        drainingActions = false;
        return;
      }
      try { next(); } catch (err) { console.error("Action failed", err); }
      const schedule = typeof setTimeout === "function"
        ? setTimeout
        : (callback) => Promise.resolve().then(callback);
      schedule(drain, 0);
    };
    drain();
  }

  /* ---------- character creation state ---------- */
  const creation = {
    startRegionId: null,
    rolled: null,
    started: false
  };

  /* ---------- DOM refs ---------- */
  const $ = (id) => document.getElementById(id);

  function init() {
    bindHome();
    bindCreate();
    bindGame();
    if (UI.bindOverlay) UI.bindOverlay();
    UI.showScreen("home");
    refreshContinue();
    if (typeof setInterval === "function") setInterval(() => {
      if (!state) return;
      const now = Date.now();
      const clock = E.ensureGameClock ? E.ensureGameClock(state) : null;
      if (clock) {
        const elapsed = Math.max(0, Math.min(300, (now - Number(clock.lastRealTimestamp || now)) / 1000));
        clock.lastRealTimestamp = now;
        if (elapsed > 0 && E.advanceGameTime) {
          const historyLength = state.history?.length || 0;
          E.advanceGameTime(state, elapsed * Number(clock.realTimeToGameTimeRatio || 1 / 60));
          if ((state.history?.length || 0) !== historyLength) renderStoryWindow();
          updateClockDisplay();
          updateAtmosphereClass();
        }
      }
      if (document.querySelector('.tab.active')?.dataset.tab === 'market') { E.refreshMarket(state); UI.renderPanel(state); saveGame(); }
    }, 1000);
  }

  function bindHome() {
    $("btn-new").addEventListener("click", () => {
      resetCreation();
      UI.showScreen("create");
    });
    $("btn-continue").addEventListener("click", () => {
      if (loadGame()) {
        UI.showScreen("game");
        renderFull();
      } else {
        alert("Chưa có bản lưu nào.");
      }
    });
  }

  function resetCreation() {
    creation.startRegionId = null;
    creation.rolled = null;
    creation.started = false;
    $("char-name").value = "";
    $("create-error").textContent = "";
    renderStartRegions();
  }

  function bindCreate() {
    $("btn-create-back").addEventListener("click", () => UI.showScreen("home"));
  }

  function renderStartRegions() {
    const box = $("start-region-list");
    box.innerHTML = "";
    E.availableStartRegions(1).forEach((region) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "start-region-card" + (region.id === creation.startRegionId ? " selected" : "");
      el.innerHTML = '<div class="region-choice-name">' + region.name + '</div>' +
        '<div class="region-choice-meta">' + region.type + ' · Linh khí ' + region.qi + ' · Nguy hiểm ' + region.danger + '</div>' +
        '<div class="region-choice-desc">' + region.description + '</div>';
      el.addEventListener("click", () => {
        if (creation.started) return;
        creation.startRegionId = region.id;
        $("create-error").textContent = "";
        renderStartRegions();
        startNewGame(region.id);
      });
      box.appendChild(el);
    });
  }

  /* ---------- new game ---------- */
  function startNewGame(startRegionId) {
    if (creation.started) return;
    const name = $("char-name").value.trim();
    if (!startRegionId) {
      $("create-error").textContent = "Vui lòng chọn nơi bắt đầu.";
      return;
    }
    const eligibility = E.startRegionEligibility(startRegionId, 1);
    if (!eligibility.eligible) {
      $("create-error").textContent = eligibility.reason;
      return;
    }
    creation.started = true;
    creation.startRegionId = startRegionId;
    creation.rolled = E.rollCharacterCreation(startRegionId);
    const rolled = creation.rolled;
    const character = E.createCharacter({
      name: name || "Vô Danh",
      ...rolled
    });
    state = E.createState({
      character,
      worldId: "co_di_dien",
      startRegionId: creation.startRegionId,
      locationId: rolled.startLocationId
    });
    const region = D.WORLD_MAP.regions.find((item) => item.id === creation.startRegionId);
    saveGame();
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "status"));
    UI.showScreen("game");
    UI.clearStory();
    UI.addStory("narr", D.WORLDS.co_di_dien.intro);
    UI.addStory("sys", "§ " + name + " tỉnh giấc tại " + (region?.name || "một vùng đất vô danh") + ".");
    UI.addStory("sys", E.describeFate(state));
    renderFull();
    flashSave("Đã lưu nhân vật mới");
  }

  /* ---------- game screen ---------- */
  function bindGame() {
    $("btn-save-file")?.addEventListener("click", exportSaveFile);
    $("btn-load-file")?.addEventListener("click", () => $("save-file-input")?.click());
    $("save-file-input")?.addEventListener("change", importSaveFile);
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.dataset.modal) {
          showInfoOverlay(tab.dataset.modal);
          return;
        }
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        if (state) UI.renderPanel(state);
      });
    });

    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        $("free-input").value = chip.dataset.cmd;
        $("free-input").focus();
      });
    });

    $("free-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const value = $("free-input").value.trim();
      if (value && commandHistory[commandHistory.length - 1] !== value) commandHistory.push(value);
      commandHistoryCursor = commandHistory.length;
      enqueueAction(submitAction);
    });
    $("free-input").addEventListener("keydown", (event) => {
      if (!commandHistory.length || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      commandHistoryCursor += event.key === "ArrowUp" ? -1 : 1;
      commandHistoryCursor = Math.max(0, Math.min(commandHistory.length, commandHistoryCursor));
      $("free-input").value = commandHistory[commandHistoryCursor] || "";
    });

    $("tab-content").addEventListener("click", (event) => {
      if (event.target.matches("[data-cauldron-item]")) { const count = document.querySelectorAll("[data-cauldron-item]:checked").length; const label = document.querySelector("[data-cauldron-count]"); if (label) label.textContent = count; return; }
      const market = event.target.closest("[data-market-fate]");
      if (market && state) { const result = E.buyFateAtMarket(state, market.dataset.marketFate); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const qintian = event.target.closest("[data-qintian-fate]");
      if (qintian && state) { const result = E.sacrificeLifespanForFate(state, qintian.dataset.qintianFate); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const offer = event.target.closest("[data-market-offer]");
      if (offer && state) { const result = E.buyMarketOffer(state, offer.dataset.marketOffer); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const refine = event.target.closest("[data-cauldron-refine]");
      if (refine && state) { const ids = [...document.querySelectorAll("[data-cauldron-item]:checked")].map((el) => el.dataset.cauldronItem); const result = E.refineAtVoidCauldron(state, ids); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const suggest = event.target.closest("[data-fate-suggest]");
      if (suggest && state) { const rows = E.suggestFateForRealmRequirement(state, suggest.dataset.fateSuggest).map((f) => '<li><b>' + f.name + '</b> · ' + f.grade + ' · Hiệu quả +' + f.impact + '<br><small>' + f.source + '</small></li>').join(""); UI.openOverlay("Gợi ý Mệnh Số", '<p>Ưu tiên Mệnh tương hợp với Con Đường hiện tại:</p><ol>' + (rows || '<li>Chưa có Mệnh Số phù hợp.</li>') + '</ol>'); return; }
      const fateSlot = event.target.closest("[data-fate-slot]");
      if (fateSlot && state) { UI.openOverlay("Hoán đổi Ấn ký Mệnh Số", UI.renderFateSlotChooser(state, fateSlot.dataset.fateSlot)); return; }
      const equipRow = event.target.closest("[data-equip-category]");
      if (equipRow && state) {
        UI.openEquipmentPicker(state, equipRow.dataset.equipCategory, equipRow.dataset.equipSlot || "");
        return;
      }
      const itemAction = event.target.closest("[data-item-action]");
      if (itemAction && state) {
        enqueueAction(() => {
          E.handleInventoryAction(state, itemAction.dataset.itemId, itemAction.dataset.itemAction);
          renderAfterTurn();
        });
        return;
      }
      const join = event.target.closest("[data-guild-join]");
      if (join && state) {
        E.joinGuild(state, join.dataset.guildJoin);
        saveGame();
        UI.renderPanel(state);
        flushRewardSummaries();
        return;
      }
      const refuse = event.target.closest("[data-guild-refuse]");
      if (refuse && state) {
        E.refuseGuild(state, refuse.dataset.guildRefuse);
        saveGame();
        UI.renderPanel(state);
        flushRewardSummaries();
        return;
      }
      const leave = event.target.closest("[data-guild-leave]");
      if (leave && state) {
        E.leaveGuild(state);
        saveGame();
        UI.renderPanel(state);
        flushRewardSummaries();
        return;
      }
      const view = event.target.closest("[data-map-view]");
      if (view && state) {
        UI.setMapView(view.dataset.mapView, state);
        return;
      }
      const target = event.target.closest("[data-map-dir]");
      if (!target || !state) return;
      enqueueAction(() => {
        E.move(state, target.dataset.mapDir);
        renderAfterTurn();
      });
    });

    $("overlay-content").addEventListener("click", (event) => {
      const itemAction = event.target.closest("[data-item-action]");
      if (itemAction && state) {
        const ok = E.handleInventoryAction(state, itemAction.dataset.itemId, itemAction.dataset.itemAction);
        if (!ok) alert("Không thể sử dụng vật phẩm này.");
        saveGame();
        UI.openOverlay("Hành Trang", UI.renderInventoryModal(state));
        return;
      }
      const endingAction = event.target.closest("[data-ending-action]");
      if (endingAction) {
        const action = endingAction.dataset.endingAction;
        UI.closeOverlay();
        if (action === "restart" || action === "home") { state = null; UI.showScreen("home"); refreshContinue(); }
        else if (action === "load") { loadGame(); renderFull(); }
        return;
      }
      const fateView = event.target.closest("[data-fate-view]");
      if (fateView && state) {
        const body = document.querySelector("#overlay-content .fate-paperdoll");
        const grid = document.querySelector("#overlay-content .detail-columns");
        const isBody = fateView.dataset.fateView === "body";
        if (body) body.hidden = !isBody;
        if (grid) grid.hidden = isBody;
        return;
      }
      const suggest = event.target.closest("[data-fate-suggest]");
      if (suggest && state) { const rows = E.suggestFateForRealmRequirement(state, suggest.dataset.fateSuggest).map((f) => '<li><b>' + f.name + '</b> · ' + f.grade + ' · Hiệu quả +' + f.impact + '<br><small>' + f.source + '</small></li>').join(""); UI.openOverlay("Gợi ý Mệnh Số", '<ol>' + (rows || '<li>Chưa có Mệnh Số phù hợp.</li>') + '</ol>'); return; }
      const swap = event.target.closest("[data-fate-swap-active]");
      if (swap && state) { const result = E.swapFateFromVault(state, swap.dataset.fateSwapActive, swap.dataset.fateVaultId); if (!result.success) alert(result.reason); else { UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); saveGame(); } return; }
      const pick = event.target.closest("[data-equip-pick]");
      if (pick && state) {
        E.handleInventoryAction(state, pick.dataset.equipPick, pick.dataset.equipAction);
        UI.closeOverlay();
        saveGame();
        UI.renderPanel(state);
        return;
      }
      const view = event.target.closest("[data-map-view]");
      if (view && state) {
        UI.setMapView(view.dataset.mapView, state);
        UI.openOverlay("Bản Đồ", UI.renderMapDetail(state));
        return;
      }
      const target = event.target.closest("[data-map-dir]");
      if (target && state) {
        enqueueAction(() => {
          E.move(state, target.dataset.mapDir);
          UI.closeOverlay();
          renderAfterTurn();
        });
      }
    });
  }

  function submitAction() {
    const input = $("free-input");
    const text = input.value.trim();
    if (!text || !state) return;
    input.value = "";

    // handle special endings first
    if (/^(kết thúc|ket thuc|chọn|end)/.test(text.toLowerCase())) {
      showEndingMenu();
      return;
    }
    const infoCommand = text.toLowerCase();
    if (/^(bản đồ|ban do|map)$/.test(infoCommand)) { showMapOverlay(); return; }
    if (/^(mệnh|menh|fate|tử vi)$/.test(infoCommand)) { showFateOverlay(); return; }
    if (/^(công pháp|cong phap|kỹ năng|ky nang|skills)$/.test(infoCommand)) { showTechniqueOverlay(); return; }
    if (/^(cảnh giới|canh gioi|tu vi)$/.test(infoCommand)) { showRealmOverlay(); return; }
    if (/^(chuyển sinh|chuyen sinh)$/.test(infoCommand)) { const blockers = E.getChuyenSinhBlockers(state); if (blockers.length) { UI.openOverlay("Chuyển Sinh", '<p>' + blockers.map((b) => UI.escapeHtml(b)).join('<br>') + '</p>'); } else if (confirm("Chuyển Sinh sẽ reset Cảnh Giới và Tu Vi. Xác nhận lần 1?")) { if (confirm("Xác nhận lần 2: nhận +1 Chuyển Sinh Điểm và +2 Căn Cốt nền?")) { E.processChuyenSinh(state); renderAfterTurn(); } } return; }

    const result = E.submitTurn(state, { text });
    if (result && result.save) {
      saveGame();
      flashSave("Đã lưu");
      return;
    }
    if (result && result.load) {
      if (loadGame()) renderFull();
      return;
    }

    renderAfterTurn();
  }

  function renderAfterTurn() {
    if (!state) return;
    const history = Array.isArray(state.history) ? state.history : [];
    renderStoryWindow();
    window._renderedTurn = history.length;

    flushRewardSummaries();

    if (state.pendingEnding) {
      showEnding(state.pendingEnding);
      return;
    }

    saveGame();
    flashSave("Đã lưu");
    UI.setLocation(D.LOCATIONS[state.locationId].name);
    UI.renderPanel(state);
    renderActionButtons();
    updateClockDisplay();
    updateAtmosphereClass();
  }

  function renderStoryWindow() {
    if (!state || !UI.renderStoryWindow) return;
    const history = Array.isArray(state.history) ? state.history : [];
    UI.renderStoryWindow(history, storyWindowSize, () => {
      storyWindowSize = Math.min(history.length, storyWindowSize + 20);
      renderStoryWindow();
    });
  }

  function flushRewardSummaries() {
    if (!state || state.pendingEnding || !state.pendingRewardSummaries?.length) return;
    const summaries = state.pendingRewardSummaries.splice(0);
    UI.openOverlay("Nhiệm vụ hoàn thành", UI.renderRewardSummary(summaries));
  }

  function renderFull() {
    UI.setLocation(D.LOCATIONS[state.locationId].name);
    UI.clearStory();
    window._renderedTurn = 0;
    renderedHistoryEntries = new WeakSet();
    storyWindowSize = 20;
    renderStoryWindow();
    window._renderedTurn = state.history.length;
    UI.renderPanel(state);
    renderActionButtons();
    flushRewardSummaries();
    if (state.pendingEnding) showEnding(state.pendingEnding);
    updateClockDisplay();
    updateAtmosphereClass();
    flashSave("Đã tải bản lưu");
  }

  function updateClockDisplay() {
    const el = $("game-clock");
    if (el && state && E.clockLabel) el.textContent = E.clockLabel(state);
  }
  function updateAtmosphereClass() {
    const screen = $("screen-game");
    if (!screen || !state) return;
    const ratio = Number(state.player?.maxSan || 100) > 0 ? Number(state.player?.san || 0) / Number(state.player?.maxSan || 100) : 0;
    if (typeof screen.classList.toggle === "function") {
      screen.classList.toggle("san-low", ratio < 0.4);
      screen.classList.toggle("san-critical", ratio < 0.2);
    } else {
      if (ratio < 0.4) screen.classList.add("san-low"); else screen.classList.remove("san-low");
      if (ratio < 0.2) screen.classList.add("san-critical"); else screen.classList.remove("san-critical");
    }
  }

  const INFO_TAB_ACTIONS = {
    act_trang_thai: "status",
    act_hanh_trang: "inventory",
    act_nhiem_vu: "quests",
    act_to_chuc: "guilds"
  };

  function renderActionButtons() {
    if (!UI.renderActions) return;
    UI.renderActions(state, (action) => {
      if (action.requiresConfirmation) {
        confirmTechniqueAction(action);
        return;
      }
      if (INFO_TAB_ACTIONS[action.id]) {
        if (action.id === "act_hanh_trang") { showInventoryOverlay(); return; }
        UI.setActiveTab(INFO_TAB_ACTIONS[action.id]);
        UI.renderPanel(state);
        return;
      }
      if (action.id === "act_menh") {
        showFateOverlay();
        return;
      }
      if (action.id === "act_cong_phap") {
        showTechniqueOverlay();
        return;
      }
      if (action.id === "act_ban_do") {
        showMapOverlay();
        return;
      }
      if (action.id === "act_be_quan") {
        const rawHours = prompt("Bế quan bao nhiêu giờ? (1–8)", "1");
        if (rawHours === null) return;
        const hours = Math.max(1, Math.min(8, Number(rawHours) || 1));
        enqueueAction(() => {
          E.submitActionId(state, action.id, { hours });
          renderAfterTurn();
        });
        return;
      }
      enqueueAction(() => {
        E.submitActionId(state, action.id);
        renderAfterTurn();
      });
    });
  }

  function showFateOverlay() {
    UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state));
  }
  function showInventoryOverlay() { UI.openOverlay("Hành Trang", UI.renderInventoryModal(state)); }

  function showTechniqueOverlay() {
    UI.openOverlay("Công Pháp", UI.renderTechniqueDetail(state));
  }

  function showMapOverlay() {
    UI.openOverlay("Bản Đồ", UI.renderMapDetail(state));
  }

  function showRealmOverlay() {
    UI.openOverlay("Cảnh Giới", UI.renderRealmDetail(state));
  }

  function showInfoOverlay(type) {
    if (!state) return;
    if (type === "map") showMapOverlay();
    if (type === "fate") showFateOverlay();
    if (type === "inventory") showInventoryOverlay();
    if (type === "technique") showTechniqueOverlay();
    if (type === "realm") showRealmOverlay();
  }

  function confirmTechniqueAction(action) {
    const preview = action.preview || E.techniquePreview(state, action.id.slice("act_skill_".length));
    if (!preview || !preview.success) {
      alert(preview?.reason || "Không thể thi triển công pháp này.");
      return;
    }
    const c = preview.costs;
    const lines = [
      "Công pháp: " + preview.name,
      "Loại: " + preview.family,
      "Giá phải trả:",
      "  Linh Khí: " + c.manaCost,
      "  Thể Lực: " + c.staminaCost,
      "  Thanh Tỉnh: " + c.sanCost,
      "  Thọ Nguyên: " + c.lifespanCost,
      "  Tà Nhiễm: " + c.corruptionCost
    ];
    if (preview.family === "cam_thuat") {
      lines.push("", "⚠ CẤM THUẬT — thi triển sẽ gây phản phệ vĩnh viễn hoặc khó hồi phục. Xác nhận?");
    } else {
      lines.push("", "Xác nhận thi triển?");
    }
    if (confirm(lines.join("\n"))) {
      enqueueAction(() => {
        E.submitActionId(state, action.id, { confirmed: true });
        renderAfterTurn();
      });
    }
  }

  function flashSave(text) {
    UI.setSaveIndicator(text);
    setTimeout(() => UI.setSaveIndicator("—"), 1500);
  }

  /* ---------- endings ---------- */
  function showEndingMenu() {
    UI.clearChoices();
    const opts = [
      { id: "truth", label: "Theo đuổi Chân Lý" },
      { id: "escape", label: "Bỏ trốn khỏi tông môn" },
      { id: "godhood", label: "Chấp nhận lời Cổ Thần" }
    ];
    UI.renderChoices(opts.map((o) => ({
      label: o.label,
      onClick: () => {
        state.pendingEnding = o.id;
        showEnding(o.id);
      }
    })));
  }

  function showEnding(id) {
    const ending = D.ENDINGS[id] || D.ENDINGS.succumb;
    UI.clearChoices();
    UI.addStory("sys", "§ " + ending.title);
    UI.addStory(ending.tone === "bad" ? "warn" : "narr", ending.text);
    UI.addStory("sys", "— HẾT —");
    if (id === "succumb") {
      const penalty = state?.flags?.madnessPenalty || {};
      UI.openOverlay("Thanh Tỉnh cạn kiệt · Hình phạt Mất Trí", '<div class="san-ending"><b>THA HÓA</b><p>' + UI.escapeHtml(ending.text) + '</p><div class="detail-kv"><span>Nguồn</span><b>' + UI.escapeHtml(penalty.source || "Tà niệm") + '</b><span>Tu vi mất</span><b>-' + (penalty.lostExp || 0) + '</b><span>Tà Nhiễm</span><b>+' + (penalty.corruptionGained || 0) + '</b><span>Hậu quả</span><b>Kết thúc hành trình hiện tại</b></div><div class="ending-options"><button class="choice" data-ending-action="restart">Luân hồi · Bắt đầu kiếp mới</button><button class="choice" data-ending-action="load">Thi giải · Nạp bản lưu gần nhất</button><button class="choice" data-ending-action="home">Chuyển sinh · Về màn hình chính</button></div></div>');
    }
    UI.renderChoices([
      { label: "Bắt đầu lại", onClick: () => { state = null; UI.showScreen("home"); refreshContinue(); } },
      { label: "Nạp bản lưu gần nhất", onClick: () => { loadGame(); renderFull(); } }
    ]);
    if (state) state.pendingEnding = id;
    UI.setSaveIndicator("Đã kết thúc — có thể nạp lại bản lưu gần nhất");
  }

  /* ---------- save / load ---------- */
  function saveGame() {
    if (!state) return;
    localStorage.setItem(SAVE_KEY, E.serialize(state));
  }
  function exportSaveFile() {
    if (!state) {
      alert("Chưa có bản lưu để tải xuống.");
      return;
    }
    saveGame();
    const payload = E.serialize(state);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (state.player?.name || "co-di-dien") + "-save.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    flashSave("Đã tải tệp lưu");
  }
  function importSaveFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = E.deserialize(String(reader.result || ""));
        state = imported;
        saveGame();
        UI.showScreen("game");
        renderFull();
        flashSave("Đã nạp tệp lưu");
      } catch (err) {
        alert("Tệp lưu không hợp lệ hoặc đã hỏng.");
      } finally { event.target.value = ""; }
    };
    reader.readAsText(file);
  }
  function loadGame() {
    const sourceKey = [SAVE_KEY, ...LEGACY_SAVE_KEYS].find((key) => localStorage.getItem(key));
    const raw = sourceKey && localStorage.getItem(sourceKey);
    if (!raw) return false;
    try {
      state = E.deserialize(raw);
      if (sourceKey !== SAVE_KEY) {
        localStorage.setItem(SAVE_KEY, E.serialize(state));
        localStorage.removeItem(sourceKey);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  function refreshContinue() {
    const has = [SAVE_KEY, ...LEGACY_SAVE_KEYS].some((key) => !!localStorage.getItem(key));
    $("btn-continue").disabled = !has;
  }

  init();
})();
