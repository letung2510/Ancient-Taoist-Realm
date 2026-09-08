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
          E.advanceGameTime(state, elapsed * Number(clock.realTimeToGameTimeRatio || (1 / Number(E.GAME_TIME_CONFIG?.realSecondsPerGameDay || 120))));
          if ((state.history?.length || 0) !== historyLength) { renderStoryWindow(); flushRewardSummaries(); saveGame(); }
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
        tab.closest("details.tab-group")?.removeAttribute("open");
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
      if (value && commandHistory[commandHistory.length - 1] !== value) { commandHistory.push(value); if (commandHistory.length > 50) commandHistory.shift(); }
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

    const updateCauldronSelectionUI = () => {
      const inputs = [...document.querySelectorAll("[data-cauldron-item]")];
      let remaining = 9;
      inputs.forEach((input) => { const max = Math.min(Number(input.max || 9), remaining); input.value = Math.max(0, Math.min(max, Math.floor(Number(input.value || 0)))); remaining -= Number(input.value || 0); });
      const selected = inputs.filter((input) => Number(input.value || 0) > 0);
      const total = selected.reduce((sum, input) => sum + Number(input.value || 0), 0);
      const label = document.querySelector("[data-cauldron-count]"); if (label) label.textContent = total;
      const summary = document.querySelector("[data-cauldron-summary]"); if (summary) summary.textContent = selected.length ? selected.map((input) => input.dataset.cauldronName + " ×" + input.value).join(" · ") : "Chưa chọn nguyên liệu";
      const submit = document.querySelector("[data-cauldron-refine]"); if (submit) submit.disabled = total < 3 || total > 9;
    };
    $("tab-content").addEventListener("input", (event) => { if (event.target.matches("[data-cauldron-item]")) updateCauldronSelectionUI(); });
    $("tab-content").addEventListener("click", (event) => {
      const autoCauldron = event.target.closest("[data-cauldron-auto]");
      if (autoCauldron && state) {
        const boxes = [...document.querySelectorAll("[data-cauldron-item]")];
        boxes.forEach((box) => { box.value = 0; });
        let remaining = 9;
        boxes.forEach((box) => { if (remaining <= 0 || box.dataset.cauldronSafe !== "true") return; const qty = Math.min(remaining, Number(box.max || 0)); box.value = qty; remaining -= qty; });
        updateCauldronSelectionUI();
        return;
      }
      const clearCauldron = event.target.closest("[data-cauldron-clear]");
      if (clearCauldron) { document.querySelectorAll("[data-cauldron-item]").forEach((box) => { box.value = 0; }); updateCauldronSelectionUI(); return; }
      const questTrack = event.target.closest("[data-quest-track]");
      if (questTrack && state) { if (E.trackQuest(state, questTrack.dataset.questTrack, true)) { saveGame(); UI.renderPanel(state); } return; }
      const questAbandon = event.target.closest("[data-quest-abandon]");
      if (questAbandon && state) { if (confirm("Từ bỏ nhiệm vụ này? Hậu quả sẽ được ghi vào lịch sử.")) { E.abandonQuest(state, questAbandon.dataset.questAbandon); saveGame(); UI.renderPanel(state); } return; }
      const fateEquip = event.target.closest("[data-fate-equip]");
      if (fateEquip && state) { const result = E.equipFateFromVault(state, fateEquip.dataset.fateEquip); if (result.requiresReplacement) UI.openOverlay("Thay thế Ấn Ký Mệnh Số", UI.renderFateReplacementChooser(state, fateEquip.dataset.fateEquip)); else if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const fateUpgrade = event.target.closest("[data-fate-upgrade-target]");
      if (fateUpgrade && state) { UI.openOverlay("Cường Hóa Mệnh Số", UI.renderFateUpgradeChooser(state, fateUpgrade.dataset.fateUpgradeTarget)); return; }
      const fateNurture = event.target.closest("[data-fate-nurture]");
      if (fateNurture && state) { const result = E.nurtureFate(state, fateNurture.dataset.fateNurture); if (!result.success) alert(result.reason || (result.blockers || []).join("\n")); else { saveGame(); UI.renderPanel(state); } return; }
      const fateResonate = event.target.closest("[data-fate-resonate]");
      if (fateResonate && state) { const result = E.resonateFate(state, fateResonate.dataset.fateResonate); if (!result.success) alert((result.blockers || [result.reason]).join("\n")); else { saveGame(); UI.renderPanel(state); } return; }
      const fateMerge = event.target.closest("[data-fate-merge-submit]");
      if (fateMerge && state) { const ids = [...document.querySelectorAll("[data-fate-merge]:checked")].map((el) => el.dataset.fateMerge); const result = E.mergeFates(state, ids); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const market = event.target.closest("[data-market-fate]");
      if (market && state) { const result = E.buyFateAtMarket(state, market.dataset.marketFate); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const qintian = event.target.closest("[data-qintian-fate]");
      if (qintian && state) { const result = E.sacrificeLifespanForFate(state, qintian.dataset.qintianFate); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const qintianMethod = event.target.closest("[data-qintian-method]");
      if (qintianMethod && state) { const result = E.sacrificeLifespanForFate(state, qintianMethod.dataset.qintianMethod); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const offer = event.target.closest("[data-market-offer]");
      if (offer && state) { const result = E.buyMarketOffer(state, offer.dataset.marketOffer); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const blackMarketFate = event.target.closest("[data-black-market-fate]");
      if (blackMarketFate && state) { const result = E.buyBlackMarketOffer(state, blackMarketFate.dataset.blackMarketFate); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Nghịch Thương Nhân", UI.renderBlackMarket(state)); } return; }
      const meritFate = event.target.closest("[data-merit-fate]");
      if (meritFate && state) { const result = E.buyFateWithMerit(state, meritFate.dataset.meritFate); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const refine = event.target.closest("[data-cauldron-refine]");
      if (refine && state) { const selection = [...document.querySelectorAll("[data-cauldron-item]")].map((el) => ({ itemId: el.dataset.cauldronItem, name: el.dataset.cauldronName, quantity: Number(el.value || 0) })).filter((entry) => entry.quantity > 0); if (!selection.length) { alert("Hãy chọn nguyên liệu thủ công trước."); return; } const total = selection.reduce((sum, entry) => sum + entry.quantity, 0); const summary = selection.map((entry) => entry.name + " ×" + entry.quantity).join("\n"); if (!confirm("Xác nhận tiêu hao " + total + " đơn vị sau?\n\n" + summary + "\n\nKhông thể hoàn tác sau khi dung luyện.")) return; const result = E.refineAtVoidCauldron(state, selection); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const suggest = event.target.closest("[data-fate-suggest]");
      if (suggest && state) { const rows = E.suggestFateForRealmRequirement(state, suggest.dataset.fateSuggest).map((f) => '<li><b>' + f.name + '</b> · ' + f.grade + ' · Hiệu quả +' + f.impact + '<br><small>' + f.source + '</small></li>').join(""); UI.openOverlay("Gợi ý Mệnh Số", '<p>Ưu tiên Mệnh tương hợp với Con Đường hiện tại:</p><ol>' + (rows || '<li>Chưa có Mệnh Số phù hợp.</li>') + '</ol>'); return; }
      const breakthroughHelp = event.target.closest("[data-breakthrough-help]");
      if (breakthroughHelp && state) { UI.openOverlay("Cách hoàn thành điều kiện", '<div class="detail-block"><h3>' + breakthroughHelp.dataset.breakthroughHelp + '</h3><p><b>Cần làm:</b> ' + breakthroughHelp.dataset.breakthroughGuide + '</p><p>Hiện tại: <b>' + breakthroughHelp.dataset.breakthroughCurrent + '</b> · Mục tiêu: <b>' + breakthroughHelp.dataset.breakthroughTarget + '</b></p></div>'); return; }
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
          const result = E.handleInventoryAction(state, itemAction.dataset.itemId, itemAction.dataset.itemAction);
          if (result !== true) alert(typeof result === "string" ? result : "Không thể sử dụng vật phẩm này.");
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
      const factionPin = event.target.closest("[data-map-faction]");
      if (factionPin && state) {
        UI.openOverlay("Hồ sơ thế lực", UI.renderMapFactionDetail(state, factionPin.dataset.mapFaction, ""));
        return;
      }
      const guildPin = event.target.closest("[data-map-guild]");
      if (guildPin && state) {
        UI.openOverlay("Hồ sơ tổ chức", UI.renderMapFactionDetail(state, "", guildPin.dataset.mapGuild));
        return;
      }
      const target = event.target.closest("[data-map-dir]");
      if (!target || !state) return;
      enqueueAction(() => {
        E.submitActionId(state, "act_move_" + target.dataset.mapDir);
        renderAfterTurn();
      });
    });

    $("overlay-content").addEventListener("click", (event) => {
      const originConfirm = event.target.closest("[data-origin-confirm]");
      if (originConfirm && state) {
        const selected = document.querySelector('#overlay-content input[name="origin-specialization"]:checked')?.value || "";
        const [type, specialization] = selected.split(":");
        const result = E.chooseOrigin(state, type, specialization);
        if (!result.success) { alert(result.reason); return; }
        UI.closeOverlay(true);
        saveGame();
        renderAfterTurn();
        return;
      }
      const ritualConfirm = event.target.closest("[data-ritual-confirm]");
      if (ritualConfirm && state && !ritualConfirm.disabled) { const actionId = "act_ritual_" + ritualConfirm.dataset.ritualConfirm; UI.closeOverlay(); enqueueAction(() => { E.submitActionId(state, actionId); renderAfterTurn(); }); return; }
      const itemAction = event.target.closest("[data-item-action]");
      if (itemAction && state) {
        const result = E.handleInventoryAction(state, itemAction.dataset.itemId, itemAction.dataset.itemAction);
        if (result !== true) { alert(typeof result === "string" ? result : "Không thể sử dụng vật phẩm này."); return; }
        saveGame();
        UI.openOverlay("Hành Trang", UI.renderInventoryModal(state));
        return;
      }
      const blackMarketFate = event.target.closest("[data-black-market-fate]");
      if (blackMarketFate && state) { const result = E.buyBlackMarketOffer(state, blackMarketFate.dataset.blackMarketFate); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Nghịch Thương Nhân", UI.renderBlackMarket(state)); } return; }
      const fateEquip = event.target.closest("[data-fate-equip]");
      if (fateEquip && state) { const result = E.equipFateFromVault(state, fateEquip.dataset.fateEquip); if (result.requiresReplacement) UI.openOverlay("Thay thế Ấn Ký Mệnh Số", UI.renderFateReplacementChooser(state, fateEquip.dataset.fateEquip)); else if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
      const fateUnequip = event.target.closest("[data-fate-unequip]");
      if (fateUnequip && state) { const index = (state.player.fates || []).indexOf(fateUnequip.dataset.fateUnequip); const result = E.storeFateToVault(state, index); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
      const fateUpgrade = event.target.closest("[data-fate-upgrade-target]");
      if (fateUpgrade && state) { UI.openOverlay("Cường Hóa Mệnh Số", UI.renderFateUpgradeChooser(state, fateUpgrade.dataset.fateUpgradeTarget)); return; }
      const fateNurture = event.target.closest("[data-fate-nurture]");
      if (fateNurture && state) { const result = E.nurtureFate(state, fateNurture.dataset.fateNurture); if (!result.success) alert(result.reason || (result.blockers || []).join("\n")); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
      const fateResonate = event.target.closest("[data-fate-resonate]");
      if (fateResonate && state) { const result = E.resonateFate(state, fateResonate.dataset.fateResonate); if (!result.success) alert((result.blockers || [result.reason]).join("\n")); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
      const fateUpgradeConfirm = event.target.closest("[data-fate-upgrade-confirm]");
      if (fateUpgradeConfirm && state) { const result = E.upgradeFate(state, fateUpgradeConfirm.dataset.fateUpgradeConfirm, fateUpgradeConfirm.dataset.fateUpgradeMaterial); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
      const fateMerge = event.target.closest("[data-fate-merge-submit]");
      if (fateMerge && state) { const ids = [...document.querySelectorAll("#overlay-content [data-fate-merge]:checked")].map((el) => el.dataset.fateMerge); const result = E.mergeFates(state, ids); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
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
      const breakthroughHelp = event.target.closest("[data-breakthrough-help]");
      if (breakthroughHelp && state) { UI.openOverlay("Cách hoàn thành điều kiện", '<div class="detail-block"><h3>' + breakthroughHelp.dataset.breakthroughHelp + '</h3><p><b>Cần làm:</b> ' + breakthroughHelp.dataset.breakthroughGuide + '</p><p>Hiện tại: <b>' + breakthroughHelp.dataset.breakthroughCurrent + '</b> · Mục tiêu: <b>' + breakthroughHelp.dataset.breakthroughTarget + '</b></p></div>'); return; }
      const swap = event.target.closest("[data-fate-swap-active]");
      if (swap && state) { const result = E.swapFateFromVault(state, swap.dataset.fateSwapActive, swap.dataset.fateVaultId); if (!result.success) alert(result.reason); else { UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); saveGame(); } return; }
      const pendingResolve = event.target.closest("[data-pending-fate-resolve]");
      if (pendingResolve && state) { if ((state.fateInventory || []).length < E.fateVaultCapacity(state)) { const result = E.resolvePendingFateReward(state); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } } else UI.openOverlay("Xử lý Mệnh Số chờ nhận", UI.renderPendingFateChooser(state)); return; }
      const pendingReplace = event.target.closest("[data-pending-fate-replace]");
      if (pendingReplace && state) { const result = E.resolvePendingFateReward(state, pendingReplace.dataset.pendingFateReplace); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
      const pendingDismiss = event.target.closest("[data-pending-fate-dismiss]");
      if (pendingDismiss && state) { if (confirm("Từ chối Mệnh Số đang chờ? Lựa chọn này không thể hoàn tác.")) { E.dismissPendingFateReward(state); saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } return; }
      const pick = event.target.closest("[data-equip-pick]");
      if (pick && state) {
        const result = pick.dataset.equipAction === "equip" ? E.equipItem(state, pick.dataset.equipPick, pick.dataset.equipTargetSlot || null) : E.handleInventoryAction(state, pick.dataset.equipPick, pick.dataset.equipAction);
        if (result !== true) { alert(result || "Không thể thay đổi trang bị."); return; }
        UI.closeOverlay(); saveGame(); UI.renderPanel(state);
        return;
      }
      const ritualOpen = event.target.closest("[data-ritual-open]");
      if (ritualOpen && state) { if (ritualOpen.dataset.ritualOpen === "fate") showFateOverlay(); else showTechniqueOverlay(); return; }
      const view = event.target.closest("[data-map-view]");
      if (view && state) {
        UI.setMapView(view.dataset.mapView, state);
        UI.openOverlay("Bản Đồ", UI.renderMapDetail(state));
        return;
      }
      const factionPin = event.target.closest("[data-map-faction]");
      if (factionPin && state) {
        UI.openOverlay("Hồ sơ thế lực", UI.renderMapFactionDetail(state, factionPin.dataset.mapFaction, ""));
        return;
      }
      const guildPin = event.target.closest("[data-map-guild]");
      if (guildPin && state) {
        UI.openOverlay("Hồ sơ tổ chức", UI.renderMapFactionDetail(state, "", guildPin.dataset.mapGuild));
        return;
      }
      const target = event.target.closest("[data-map-dir]");
      if (target && state) {
        enqueueAction(() => {
          E.submitActionId(state, "act_move_" + target.dataset.mapDir);
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
    if (state.flags?.blackMarketOpen) { state.flags.blackMarketOpen = false; UI.openOverlay("Nghịch Thương Nhân", UI.renderBlackMarket(state)); }
    if (state.flags?.originChoicePending && UI.renderOriginChoice) showOriginModal();
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
    UI.openOverlay("Phần thưởng nhận được", UI.renderRewardSummary(summaries));
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
    if (state.flags?.originChoicePending && UI.renderOriginChoice) showOriginModal();
  }

  function updateClockDisplay() {
    const el = $("game-clock");
    if (el && state && E.clockLabel) { el.textContent = E.clockLabel(state); el.title = "Thời gian trong thế giới tu tiên · 1 ngày game = " + Number(E.GAME_TIME_CONFIG?.realSecondsPerGameDay || 120) + " giây thực · 1 năm = " + (Number(E.GAME_TIME_CONFIG?.realSecondsPerGameDay || 120) * 360 / 3600).toFixed(1) + " giờ thực"; }
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
    act_to_chuc: "guilds",
    act_tim_tong_mon: "guilds"
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
      if (action.id === "act_dot_pha") {
        const ritual = E.breakthroughRitualStatus ? E.breakthroughRitualStatus(state) : null;
        if (ritual?.remaining?.length) {
          UI.openOverlay("Nghi Thức Đột Phá", UI.renderRitualModal(state, ritual.remaining[0], action));
          return;
        }
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
      if (action.id.startsWith("act_ritual_")) {
        const gate = action.id.slice("act_ritual_".length);
        UI.openOverlay("Nghi Thức Đột Phá", UI.renderRitualModal(state, gate, action));
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

  function showOriginModal() {
    if (!state?.flags?.originChoicePending) return;
    UI.openOverlay("Chọn Xuất Thân", UI.renderOriginChoice(state), { locked: true });
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
