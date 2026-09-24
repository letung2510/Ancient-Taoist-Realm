/* ============================================================
 * CỔ DỊ DIỆN — Main application wiring
 * ============================================================ */
(function () {
  "use strict";

  const D = window.GameData;
  const E = window.GameEngine;
  const UI = window.GameUI;

  const SAVE_KEY = "co_di_dien_save_v13";
  const LEGACY_SAVE_KEYS = ["co_di_dien_save_v12", "co_di_dien_save_v11"];
  let state = null;
  const nativeAlert = typeof window.alert === "function" ? window.alert.bind(window) : function () {};
  function showPlayerAlert(value, fallback) {
    const text = E.playerFacingReason ? E.playerFacingReason(value, fallback) : (Array.isArray(value) ? value.filter(Boolean).join("\n") : (value || fallback || "Hành động chưa thể thực hiện lúc này."));
    nativeAlert(text);
  }
  // Keep every legacy alert call behind the narrative/reason-code boundary.
  window.alert = showPlayerAlert;
  const alert = showPlayerAlert;

  // Serialize game-changing actions. Rapid clicks used to mutate state while
  // the story panel was still rendering, leaving later entries/buttons stuck.
  const pendingActions = [];
  let drainingActions = false;
  let renderedHistoryEntries = new WeakSet();
  let storyWindowSize = 20;
  const commandHistory = [];
  let commandHistoryCursor = -1;

  // Small durable queue for narrative history. It is intentionally isolated
  // from gameplay saves: a blocked IndexedDB write must never block a turn.
  function createLogArchive() {
    const queue = [];
    let retryTimer = null;
    const DB_NAME = "co_di_dien_log";
    const STORE_NAME = "events";
    const schedule = (fn, delay) => (window.setTimeout ? window.setTimeout(fn, delay) : setTimeout(fn, delay));
    const openDatabase = () => {
      if (!window.indexedDB?.open) return null;
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (db?.createObjectStore && !db.objectStoreNames?.contains?.(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      return request;
    };
    const api = {
      flush(entries) {
        if (Array.isArray(entries)) queue.push(...entries);
        if (retryTimer == null) retryTimer = schedule(api.retry, 0);
      },
      retry() {
        retryTimer = null;
        if (!queue.length || !window.indexedDB?.open) return;
        const request = openDatabase();
        if (!request) return;
        request.onerror = () => { if (retryTimer == null) retryTimer = schedule(api.retry, 1000); };
        request.onsuccess = () => {
          const db = request.result;
          if (!db?.transaction) { if (retryTimer == null) retryTimer = schedule(api.retry, 1000); return; }
          const batch = queue.splice(0, queue.length);
          try {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            batch.forEach((entry) => store.put({ ...entry, archivedAt: entry.archivedAt || Date.now() }));
            transaction.onerror = () => { queue.unshift(...batch); if (retryTimer == null) retryTimer = schedule(api.retry, 1000); };
            transaction.onabort = transaction.onerror;
          } catch (error) {
            queue.unshift(...batch);
            if (retryTimer == null) retryTimer = schedule(api.retry, 1000);
          }
        };
      },
      retryQueueSize: () => queue.length,
      readRecent(limit = 50) {
        return new Promise((resolve) => {
          const request = openDatabase();
          if (!request) return resolve([]);
          request.onerror = () => resolve([]);
          request.onsuccess = () => {
            try {
              const transaction = request.result.transaction(STORE_NAME, "readonly");
              const requestAll = transaction.objectStore(STORE_NAME).getAll();
              requestAll.onsuccess = () => resolve((requestAll.result || []).sort((a, b) => Number(b.archivedAt || 0) - Number(a.archivedAt || 0)).slice(0, Math.max(1, Number(limit) || 50)));
              requestAll.onerror = () => resolve([]);
            } catch (error) { resolve([]); }
          };
        });
      },
      reset() { queue.length = 0; if (retryTimer != null) clearTimeout(retryTimer); retryTimer = null; }
    };
    return api;
  }
  if (typeof window !== "undefined") window.__LOG_ARCHIVE_TEST__ = createLogArchive();

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
      try {
        next();
      } catch (err) {
        console.error("Action failed", err);
        // A failed action must release the queue and repaint the action
        // surface; otherwise one exception can leave the bar looking frozen.
        try {
          if (state) {
            E.pushHistory(state, { type: "warn", text: "Hành động vừa rồi không thể hoàn tất; trạng thái đã được ổn định lại." });
            renderAfterTurn();
          }
        } catch (repaintError) {
          console.error("Action recovery failed", repaintError);
        }
      }
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
    bindCosmicMapCamera();
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
          E.advanceGameTime(state, elapsed * Number(clock.realTimeToGameTimeRatio || (1 / Number(E.GAME_TIME_CONFIG?.realSecondsPerGameDay || 30))));
          if ((state.history?.length || 0) !== historyLength) { renderStoryWindow(); flushRewardSummaries(); saveGame(); }
          updateClockDisplay();
          updateAtmosphereClass();
        }
      }
      if (document.querySelector('.tab.active')?.dataset.tab === 'market') { E.refreshMarket(state); UI.renderPanel(state); saveGame(); }
    }, 1000);
  }

  function bindCosmicMapCamera() {
    if (!document || typeof document.addEventListener !== "function") return;
    let drag = null;
    document.addEventListener("pointerdown", (event) => {
      const map = event.target.closest(".world-map");
      if (!map) return;
      if (event.target.closest("button")) return;
      drag = { x: event.clientX, y: event.clientY };
      map.setPointerCapture?.(event.pointerId);
    });
    document.addEventListener("pointermove", (event) => {
      if (!drag) return;
      UI.panMapCamera(event.clientX - drag.x, event.clientY - drag.y);
      drag = { x: event.clientX, y: event.clientY };
    });
    document.addEventListener("pointerup", () => { drag = null; });
    document.addEventListener("wheel", (event) => {
      if (!event.target.closest(".world-map")) return;
      event.preventDefault();
      UI.adjustMapCamera(event.deltaY < 0 ? "zoom-in" : "zoom-out");
    }, { passive: false });
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
      const spawn = Object.entries(D.WORLD_MAP?.locations || {}).find(([id, location]) => location.region === region.id && (id === "trung_vuc_khoi_diem" || id.endsWith("_khoi_diem")));
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
    saveGame(true);
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "status"));
    UI.showScreen("game");
    UI.clearStory();
    E.pushHistory(state, { type: "narr", text: D.WORLDS.co_di_dien.intro });
    E.pushHistory(state, { type: "sys", text: E.describeFate(state) });
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
        const tabGroup = tab.closest("details.tab-group");
        if (tabGroup) tabGroup.open = true;
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
      const statusAction = event.target.closest("[data-status-action]");
      if (statusAction && state && !statusAction.disabled) {
        const actionId = statusAction.dataset.statusAction;
        const actionButton = [...document.querySelectorAll("#action-list [data-action-id]")].find((button) => button.dataset.actionId === actionId);
        if (actionButton) actionButton.click();
        else alert("Hành động này hiện không còn khả dụng trong bối cảnh hiện tại.");
        return;
      }
      const worldEventChoice = event.target.closest("[data-world-event-action]");
      if (worldEventChoice && state && !worldEventChoice.disabled) {
        const actionId = worldEventChoice.dataset.worldEventAction;
        const actionButton = [...document.querySelectorAll("#action-list [data-action-id]")].find((button) => button.dataset.actionId === actionId);
        if (actionButton) actionButton.click();
        else alert("Lựa chọn biến cố không còn khả dụng trong pha hiện tại.");
        return;
      }
      const modalButton = event.target.closest("[data-expansion-modal]");
      if (modalButton && state) {
        const type = modalButton.dataset.expansionModal;
        if (type === "guild-project") UI.openOverlay("Công Trình Tông Môn", UI.renderGuildProjectModal(state));
        if (type === "opportunity") UI.openOverlay("Cơ Duyên Tranh Đoạt", UI.renderContestedOpportunityModal(state));
        return;
      }
      const physiqueButton = event.target.closest("[data-special-physique]");
      if (physiqueButton && state && E.claimSpecialPhysique) {
        const result = E.claimSpecialPhysique(state, physiqueButton.dataset.specialPhysique);
        if (!result.success) alert(result.reason || "Chưa thể tiếp nhận Dị Thể.");
        else { saveGame(); UI.renderPanel(state); }
        return;
      }
      const techniqueStance = event.target.closest("[data-technique-stance]");
      if (techniqueStance && state) {
        const actionId = techniqueStance.dataset.techniqueAction || "";
        const stance = techniqueStance.dataset.techniqueStance || "steady";
        const action = (E.contextState(state)?.actions || []).find((entry) => entry.id === actionId) || (/^act_skill_/.test(actionId) ? { id: actionId } : null);
        if (action) commitTechniqueAction(action, stance);
        return;
      }
      const expansionCommand = event.target.closest("[data-expansion-command]");
      if (expansionCommand && state && E.runExpansionCommand) {
        const command = expansionCommand.dataset.expansionCommand;
        let arg = expansionCommand.dataset.expansionArg || "";
        const arg2 = expansionCommand.dataset.expansionArg2 || "";
        if (command === "mark") {
          const note = prompt("Khắc lại dấu vết tại node này (tối đa 120 ký tự):", state.playerMarks?.[state.locationId]?.text || "");
          if (note === null) return;
          arg = note;
        }
        let result = E.runExpansionCommand(state, command, arg, arg2);
        if (result?.requiresConfirmation && confirm(result.reason + "\nXác nhận tiếp tục?")) result = E.runExpansionCommand(state, command, arg, arg2, { confirmed: true });
        if (!result?.success) alert(result?.reason || "Không thể thực hiện hành động này.");
        if ((command === "opportunity" || command === "map_event") && result?.success) UI.closeOverlay();
        renderAfterTurn();
        const overlay = document.getElementById("overlay");
        const overlayContent = document.getElementById("overlay-content");
        if (overlay && !overlay.classList.contains("hidden") && overlayContent) {
          if (command.startsWith("guild_")) overlayContent.innerHTML = UI.renderGuildProjectModal(state);
          else if (command === "opportunity" && !result?.success) overlayContent.innerHTML = UI.renderContestedOpportunityModal(state);
          else if (command === "map_event" && !result?.success) overlayContent.innerHTML = UI.renderMapEventModal(state);
          else if (command === "fate_trial" || command === "fate_evolve") overlayContent.innerHTML = UI.renderFateEvolutionModal(state, arg);
          else if (command === "technique_evolve") overlayContent.innerHTML = UI.renderTechniqueDetail(state);
        }
        return;
      }
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
      const fateEvolution = event.target.closest("[data-fate-evolution]");
      if (fateEvolution && state) { UI.openOverlay("Mệnh Số Tiến Hóa", UI.renderFateEvolutionModal(state, fateEvolution.dataset.fateEvolution)); return; }
      const fateNurture = event.target.closest("[data-fate-nurture]");
      if (fateNurture && state) { const result = E.nurtureFate(state, fateNurture.dataset.fateNurture); if (!result.success) alert(result.reason || (result.blockers || []).join("\n")); else { saveGame(); UI.renderPanel(state); } return; }
      const fateResonate = event.target.closest("[data-fate-resonate]");
      if (fateResonate && state) { const result = E.resonateFate(state, fateResonate.dataset.fateResonate); if (!result.success) alert((result.blockers || [result.reason]).join("\n")); else { saveGame(); UI.renderPanel(state); } return; }
      const fateTransform = event.target.closest("[data-fate-transform]");
      if (fateTransform && state) { const id = fateTransform.dataset.fateTransform; const preview = E.transformFate(state, id); if (!preview.success) { alert((preview.blockers || [preview.reason]).join("\n")); return; } const candidates = preview.candidates || []; if (!candidates.length) { alert("Chưa có nhánh biến thể phù hợp."); return; } const branch = candidates[0]; if (!confirm("Xác nhận Mệnh Đổi theo nhánh " + (branch.name || branch.id) + "? Chi phí: " + preview.costs.essence + " Tinh Hoa, " + preview.costs.merit + " Công Đức, " + preview.costs.san + " SAN.")) return; const result = E.transformFate(state, id, branch.id, { confirmed: true }); if (!result.success) alert(result.reason || (result.blockers || []).join("\n")); else { saveGame(); UI.renderPanel(state); } return; }
      const fateInsight = event.target.closest("[data-fate-insight]");
      if (fateInsight && state) { const result = E.revealFateInsight(state, fateInsight.dataset.fateInsight); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const fateRelease = event.target.closest("[data-fate-release]");
      if (fateRelease && state) { const result = E.releaseStagnantFate(state, fateRelease.dataset.fateRelease); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const fateDefy = event.target.closest("[data-fate-defy]");
      if (fateDefy && state) { const result = E.defyFate(state, fateDefy.dataset.fateDefy); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
      const fateSuppress = event.target.closest("[data-fate-suppress]");
      if (fateSuppress && state) { const result = E.suppressFate(state, fateSuppress.dataset.fateSuppress); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } return; }
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
      const camera = event.target.closest("[data-map-camera]");
      if (camera) {
        UI.adjustMapCamera(camera.dataset.mapCamera);
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
       const direction = target.dataset.mapDir;
       const actionId = "act_move_" + direction;
       if (openPendingMoveModal(actionId)) return;
       const departure = departureOptions(actionId);
      if (departure === null) return;
      enqueueAction(() => {
        submitUiAction(actionId, departure);
        renderAfterTurn();
      });
    });

    $("overlay-content").addEventListener("click", (event) => {
      const techniqueStance = event.target.closest("[data-technique-stance]");
      if (techniqueStance && state) {
        const actionId = techniqueStance.dataset.techniqueAction || "";
        const stance = techniqueStance.dataset.techniqueStance || "steady";
        const action = (E.contextState(state)?.actions || []).find((entry) => entry.id === actionId) || (/^act_skill_/.test(actionId) ? { id: actionId } : null);
        if (action) commitTechniqueAction(action, stance);
        return;
      }
      const pendingDiscoveryResolve = event.target.closest("[data-pending-resolve]");
      if (pendingDiscoveryResolve && state) {
        resolvePendingThenMove(pendingDiscoveryResolve.dataset.pendingResolve, pendingDiscoveryResolve.dataset.pendingMove || "");
        return;
      }
      const pendingMoveNow = event.target.closest("[data-pending-move-now]");
      if (pendingMoveNow && state) {
        enqueueAction(() => {
          submitUiAction(pendingMoveNow.dataset.pendingMoveNow, { confirmPendingDeparture: true });
          UI.closeOverlay();
          renderAfterTurn();
        });
        return;
      }
      const overlayCamera = event.target.closest("[data-map-camera]");
      if (overlayCamera) {
        UI.adjustMapCamera(overlayCamera.dataset.mapCamera);
        return;
      }
      const expansionCommand = event.target.closest("[data-expansion-command]");
      if (expansionCommand && state && E.runExpansionCommand) {
        const command = expansionCommand.dataset.expansionCommand;
        const arg = expansionCommand.dataset.expansionArg || "";
        const arg2 = expansionCommand.dataset.expansionArg2 || "";
        let result = E.runExpansionCommand(state, command, arg, arg2);
        if (result?.requiresConfirmation && confirm(result.reason + "\nXác nhận tiếp tục?")) {
           result = E.runExpansionCommand(state, command, arg, arg2, { confirmed: true });
         }
         const moveAfterDiscovery = expansionCommand.dataset.pendingMove || "";
         if (result?.success && command === "map_event" && moveAfterDiscovery) submitUiAction(moveAfterDiscovery, { confirmPendingDeparture: true });
        if (!result?.success) alert(result?.reason || "Không thể thực hiện hành động này.");
        renderAfterTurn();
        const overlay = document.getElementById("overlay");
        const overlayContent = document.getElementById("overlay-content");
        if (overlay && !overlay.classList.contains("hidden") && overlayContent) {
           if (command === "opportunity") {
             if (result?.success) UI.closeOverlay();
             else overlayContent.innerHTML = UI.renderContestedOpportunityModal(state);
           } else if (command === "map_event") {
             if (result?.success) UI.closeOverlay();
             else overlayContent.innerHTML = UI.renderMapEventModal(state);
           } else if (command.startsWith("guild_")) {
            overlayContent.innerHTML = UI.renderGuildProjectModal(state);
          } else if (command === "technique_prepare" || command === "technique_channel" || command === "technique_cancel") {
            overlayContent.innerHTML = UI.renderTechniqueDetail(state);
          }
        }
        return;
      }
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
      const journeyIntentConfirm = event.target.closest("[data-journey-intent-confirm]");
      if (journeyIntentConfirm && state) {
        const intentId = document.querySelector('#overlay-content input[name="journey-intent"]:checked')?.value || "";
        const result = E.chooseJourneyIntent(state, intentId);
        if (!result.success) { alert(result.reason); return; }
        UI.closeOverlay(true);
        saveGame();
        renderAfterTurn();
        return;
      }
      const anchorSelect = event.target.closest("[data-anchor-select]");
      if (anchorSelect && state) {
        const result = E.establishHumanAnchor(state, anchorSelect.dataset.anchorSelect);
        if (!result.success) alert(result.reason);
        else { saveGame(); UI.openOverlay("Nghi Thức Đột Phá", UI.renderRitualModal(state, "anchor", { disabled_reason: "" })); }
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
         const direction = target.dataset.mapDir;
         const actionId = "act_move_" + direction;
         if (openPendingMoveModal(actionId)) return;
         const departure = departureOptions(actionId);
        if (departure === null) return;
        enqueueAction(() => {
          submitUiAction(actionId, departure);
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

    let result = E.submitTurn(state, { text });
    if (result && result.requiresConfirmation) {
      const kind = result.pendingType === "opportunity" ? "cơ duyên tranh đoạt" : "phát hiện chưa xử lý";
      if (confirm("Ngươi còn " + kind + " tại đây. Rời đi sẽ làm mất vĩnh viễn. Vẫn muốn rời đi?")) {
        result = E.submitTurn(state, { text }, { confirmPendingDeparture: true });
      }
    }
    if (result && result.save) {
      saveGame(true);
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

    UI.setLocation(D.LOCATIONS[state.locationId].name);
    UI.renderPanel(state);
    decorateFateAdvancedActions();
    renderActionButtons();
    updateClockDisplay();
    updateAtmosphereClass();
    if (state.flags?.blackMarketOpen) { E.consumeBlackMarketPrompt?.(state); UI.openOverlay("Nghịch Thương Nhân", UI.renderBlackMarket(state)); }
    if ((state.flags?.journeyIntentPending || state.flags?.originChoicePending) && UI.renderOriginChoice) showOriginModal();
    const opportunity = state.pendingContestedOpportunity;
    if (!state.flags?.journeyIntentPending && !state.flags?.originChoicePending && opportunity?.status === "pending" && state.flags?.lastOpportunityPromptId !== opportunity.id) {
      E.markOpportunityPrompted?.(state, opportunity.id);
      UI.openOverlay("Cơ Duyên Tranh Đoạt", UI.renderContestedOpportunityModal(state));
    }
  }

  function renderStoryWindow() {
    if (!state || !UI.renderStoryWindow) return;
    const profile = window.GameExpansion?.performanceProfile?.(state, {
      reducedMotion: Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches),
      hardwareConcurrency: window.navigator?.hardwareConcurrency,
      deviceMemory: window.navigator?.deviceMemory
    });
    if (profile) document.documentElement.dataset.performanceProfile = profile.id;
    const history = Array.isArray(state.history) ? state.history : [];
    UI.renderStoryWindow(history, storyWindowSize, () => {
      storyWindowSize = Math.min(history.length, storyWindowSize + 20);
      renderStoryWindow();
    }, state);
  }
  function decorateFateAdvancedActions() {
    if (!state) return;
    document.querySelectorAll("[data-fate-nurture]").forEach((nurture) => {
      const card = nurture.closest(".fate-card"); if (!card || card.querySelector("[data-fate-transform]")) return;
      const id = nurture.dataset.fateNurture; const relation = state.player?.fateRelationships?.[id] || {};
      const level = E.fateEnhancementLevel(state.player, id);
      const actions = card.querySelector(".fate-actions"); if (!actions) return;
      const add = (key, label) => { const button = document.createElement("button"); button.className = "guild-action"; button.setAttribute("data-" + key, id); button.textContent = label; actions.appendChild(button); };
      if (!relation.insightRevealed) add("fate-insight", "Giác Ngộ");
      if (Number(relation.stagnantDays || 0) >= 60) add("fate-release", "Buông Mệnh");
      const fate = window.GameData.FATE_PATTERNS.find((item) => item.id === id); if (fate?.sign === "hung") { add("fate-defy", "Nghịch Mệnh"); add("fate-suppress", "Trấn Mệnh"); }
      if (Number(relation.stage || 0) >= 4 && level >= 5) add("fate-transform", "Mệnh Đổi");
    });
  }

  function flushRewardSummaries() {
    if (!state || state.pendingEnding || !state.pendingRewardSummaries?.length) return;
    if (!document.getElementById("overlay") || !document.getElementById("overlay-title") || !document.getElementById("overlay-content")) return;
    const summaries = state.pendingRewardSummaries.slice();
    UI.openOverlay("Phần thưởng nhận được", UI.renderRewardSummary(summaries));
    state.pendingRewardSummaries.splice(0, summaries.length);
  }

  function renderFull() {
    UI.setLocation(D.LOCATIONS[state.locationId].name);
    UI.clearStory();
    window._renderedTurn = 0;
    renderedHistoryEntries = new WeakSet();
    const renderProfile = window.GameExpansion?.performanceProfile?.(state, { reducedMotion: Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches), hardwareConcurrency: window.navigator?.hardwareConcurrency, deviceMemory: window.navigator?.deviceMemory });
    storyWindowSize = Math.min(20, Number(renderProfile?.historyWindow || 20));
    renderStoryWindow();
    window._renderedTurn = state.history.length;
    UI.renderPanel(state);
    decorateFateAdvancedActions();
    renderActionButtons();
    flushRewardSummaries();
    if (state.pendingEnding) showEnding(state.pendingEnding);
    updateClockDisplay();
    updateAtmosphereClass();
    flashSave("Đã tải bản lưu");
    if ((state.flags?.journeyIntentPending || state.flags?.originChoicePending) && UI.renderOriginChoice) showOriginModal();
  }

  function updateClockDisplay() {
    const el = $("game-clock");
      if (el && state && E.clockLabel) { el.textContent = E.clockLabel(state); el.title = "Thời gian của nhân vật · 1 ngày game = " + Number(E.GAME_TIME_CONFIG?.realSecondsPerGameDay || 30) + " giây thực"; const world = $("world-clock"); if (world && E.worldClockLabel) { world.textContent = E.worldClockLabel(state); world.title = "Thời gian của Thái Thanh đại lục · dùng cho thiên tượng, NPC, chiến sự và biến cố."; } const summary = E.expansionSummary?.(state); let weather = $("game-weather"); if (!weather && el.parentNode) { weather = document.createElement("span"); weather.id = "game-weather"; weather.className = "game-weather"; weather.title = "Thời tiết hiện tại"; el.parentNode.insertBefore(weather, el.nextSibling); } if (weather) { const labels = { quang: "Quang đãng", mua: "Mưa", suong: "Sương", loi_vu: "Lôi Vũ", linh_phong: "Linh Phong" }; weather.hidden = false; weather.textContent = "☁ " + (labels[summary?.weather] || "Quang đãng"); } }
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

  function departureOptions(actionId) {
    const guard = E.pendingDepartureGuard ? E.pendingDepartureGuard(state, actionId) : { allowed: true };
    if (!guard.requiresConfirmation) return {};
    const kind = guard.pendingType === "opportunity" ? "cơ duyên tranh đoạt" : guard.pendingType === "map_event" ? "phát hiện ẩn" : "phát hiện chưa xử lý";
    if (!confirm("Ngươi còn " + kind + " tại đây. Rời đi sẽ làm mất vĩnh viễn. Vẫn muốn rời đi?")) return null;
    return { confirmPendingDeparture: true };
  }

  function isMovementActionId(actionId) {
    return /^act_move_(bac|nam|dong|tay)$/.test(String(actionId || ""));
  }

  function openPendingMoveModal(actionId) {
    if (!isMovementActionId(actionId)) return false;
    if (!E.pendingExplorationAt?.(state) && state.pendingMapEvent?.status !== "pending") return false;
    if (!E.pendingExplorationAt?.(state) && state.pendingMapEvent?.status === "pending") {
      UI.openOverlay("Hidden discovery", UI.renderMapEventModal(state, actionId));
      return true;
    }
    UI.openOverlay("Phát hiện đang chờ", UI.renderPendingDiscoveryModal(state, actionId));
    return true;
  }

  function resolvePendingThenMove(resolveActionId, moveActionId) {
    enqueueAction(() => {
      const result = E.submitActionId(state, resolveActionId);
      if (result?.success && !E.pendingExplorationAt?.(state) && moveActionId) E.submitActionId(state, moveActionId, { confirmPendingDeparture: true });
      UI.closeOverlay();
      renderAfterTurn();
    });
  }

  function submitUiAction(actionId, options = {}) {
    const result = E.submitActionId(state, actionId, options);
    if (result === false || result?.success === false) {
      E.pushHistory(state, { type: "warn", text: result?.reason || "Hành động không còn khả dụng; trạng thái đã được làm mới." });
    }
    return result;
  }

  function renderActionButtons() {
    if (!UI.renderActions) return;
    UI.renderActions(state, (action) => {
      if (openPendingMoveModal(action.id)) return;
      if (action.id === "act_exp_map_event") {
        UI.openOverlay("Phát Hiện Ẩn", UI.renderMapEventModal(state));
        return;
      }
      if (action.id === "act_exp_opportunity") {
        UI.openOverlay("Cơ Duyên Tranh Đoạt", UI.renderContestedOpportunityModal(state));
        return;
      }
      if (action.id === "act_move_group") {
        showMapOverlay();
        return;
      }
      const departure = departureOptions(action.id);
      if (departure === null) return;
      if (action.requiresConfirmation) {
        confirmTechniqueAction(action);
        return;
      }
      if (INFO_TAB_ACTIONS[action.id]) {
        if (action.id === "act_hanh_trang") { showInventoryOverlay(); return; }
        UI.setActiveTab(INFO_TAB_ACTIONS[action.id]);
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
      // Route every combat technique through the canonical stance picker so
      // preview/resource blockers cannot be bypassed by a legacy UI path.
      if (action.id.startsWith("act_skill_")) {
        confirmTechniqueAction(action);
        return;
      }
      let actionOptions = departure;
      enqueueAction(() => {
        submitUiAction(action.id, actionOptions);
        renderAfterTurn();
      });
    });
  }

  function showFateOverlay() {
    UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state));
    decorateFateAdvancedActions();
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
    if (!state?.flags?.journeyIntentPending && !state?.flags?.originChoicePending) return;
    UI.openOverlay(state.flags.journeyIntentPending ? "Chọn Ý Định Hành Đạo" : "Chọn Xuất Thân", UI.renderOriginChoice(state), { locked: true });
  }

  function showInfoOverlay(type) {
    if (!state) return;
    if (type === "map") showMapOverlay();
    if (type === "fate") showFateOverlay();
    if (type === "inventory") showInventoryOverlay();
    if (type === "technique") showTechniqueOverlay();
    if (type === "realm") showRealmOverlay();
  }

  function commitTechniqueAction(action, stance) {
    const techniqueId = action.id.slice("act_skill_".length);
    const preview = E.techniquePreview(state, techniqueId, { stance });
    if (!preview || !preview.success) { alert(preview?.reason || "Không thể thi triển công pháp này."); return; }
    if (preview.resourcesReady === false) { alert((preview.blockers || []).map((entry) => entry.message).join("\n")); return; }
    const c = preview.costs;
    const lines = ["Công pháp: " + preview.name, "Loại: " + preview.family + " · Thế: " + stance, "Giá phải trả:", "  Linh Khí: " + c.manaCost, "  Thể Lực: " + c.staminaCost, "  Thanh Tỉnh: " + c.sanCost, "  Thọ Nguyên: " + c.lifespanCost, "  Tà Nhiễm: " + c.corruptionCost];
    if (preview.combatPreview) lines.push("Sát thương dự kiến: " + preview.combatPreview.damageMin + "–" + preview.combatPreview.damageMax);
    if (preview.fateResonanceFates?.length) lines.push("Cộng hưởng Mệnh: " + preview.fateResonanceFates.length + " Mệnh đang kích hoạt");
    if (preview.family === "cam_thuat") lines.push("", "⚠ CẤM THUẬT — thi triển sẽ gây phản phệ. Xác nhận?"); else lines.push("", "Xác nhận thi triển?");
    if (preview.pathResonanceFates?.length) lines.push("Cộng hưởng Con Đường: " + preview.pathResonanceFates.length + " Mệnh · +" + preview.fateResonancePct + "% uy lực");
    if (preview.guildCombatPowerPct > 0) lines.push("Trận pháp Tông Môn: +" + preview.guildCombatPowerPct + "% uy lực (" + (preview.guildCombatSources || []).join(", ") + ")");
    if (!confirm(lines.join("\n"))) return;
    const actionId = E.nextTechniqueActionId(state);
    enqueueAction(() => {
      E.submitActionId(state, action.id, { confirmed: true, stance, actionId });
      renderAfterTurn();
    });
  }
  function confirmTechniqueAction(action) {
    const techniqueId = action.id.slice("act_skill_".length);
    const stances = [
      ["steady", "Ổn định", "Giữ uy lực và chi phí cân bằng."],
      ["burst", "Bộc phát", "Uy lực +20%, Tà Nhiễm +50%."],
      ["guarded", "Hộ thể", "Uy lực -15%, giảm nửa phí Thanh Tỉnh/Tà Nhiễm."]
    ];
    const rows = stances.map(([id, label, description]) => {
      const preview = E.techniquePreview(state, techniqueId, { stance: id });
      const disabled = !preview?.success || preview.resourcesReady === false;
      const blocker = disabled ? '<small class="inline-blocker">' + UI.escapeHtml(preview?.reason || (preview?.blockers || []).map((entry) => entry.message).join(" · ") || "Không đủ tài nguyên") + '</small>' : '<small>Chi phí: Khí ' + Number(preview.costs?.manaCost || 0) + ' · Thể ' + Number(preview.costs?.staminaCost || 0) + ' · Tỉnh ' + Number(preview.costs?.sanCost || 0) + '</small>';
      return '<div class="technique-stance-row"><b>' + UI.escapeHtml(label) + '</b><p>' + UI.escapeHtml(description) + '</p>' + blocker + '<button class="guild-action" data-technique-stance="' + id + '" data-technique-action="' + UI.escapeHtml(action.id) + '"' + (disabled ? ' disabled' : '') + '>Chọn thế này</button></div>';
    }).join('');
    UI.openOverlay("Chọn thế vận công", '<div class="technique-stance-picker"><p class="muted">' + UI.escapeHtml(techniqueId) + ' · xem preview trước khi xác nhận thi triển.</p>' + rows + '</div>');
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
  function saveGame(explicit = false) {
    if (!state) return;
    localStorage.setItem(SAVE_KEY, E.serialize(state));
  }
  function exportSaveFile() {
    if (!state) {
      alert("Chưa có bản lưu để tải xuống.");
      return;
    }
    saveGame(true);
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
    const resetInput = () => { event.target.value = ""; };
    if (Number(file.size || 0) > 8 * 1024 * 1024) {
      resetInput();
      alert("Tệp lưu quá lớn và không thể nạp.");
      return;
    }
    if (file.type && file.type !== "application/json" && file.type !== "text/json") {
      resetInput();
      alert("Chỉ chấp nhận tệp lưu JSON.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = E.deserialize(String(reader.result || ""));
        const envelope = E.validateSaveEnvelope?.(imported);
        if (envelope && !envelope.ok) throw new Error("invalid_save_shape:" + envelope.errors.join(","));
        if (!envelope && (!imported?.player || !imported?.meta || !imported?.worldSimulation)) throw new Error("invalid_save_shape");
        state = imported;
        saveGame(true);
        UI.showScreen("game");
        renderFull();
        flashSave("Đã nạp tệp lưu");
      } catch (err) {
        alert("Tệp lưu không hợp lệ hoặc đã hỏng.");
      } finally { resetInput(); }
    };
    reader.onerror = () => {
      resetInput();
      alert("Không thể đọc tệp lưu.");
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
