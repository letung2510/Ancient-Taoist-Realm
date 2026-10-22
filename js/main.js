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
  let pendingDangerConfirm = null;
  let storyWindowSize = 20;
  const commandHistory = [];
  let commandHistoryCursor = -1;
  let renderFramePending = false;
  let saveTimer = null;
  let saveDirty = false;

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
    if (typeof window.addEventListener === "function") window.addEventListener("beforeunload", () => {
      if (saveTimer != null) { clearTimeout(saveTimer); saveTimer = null; }
      if (state && saveDirty) {
        try { localStorage.setItem(SAVE_KEY, E.serialize(state)); saveDirty = false; } catch (error) { console.warn("Save flush failed", error); }
      }
    });
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

    $("tab-content").addEventListener("input", (event) => { if (event.target.matches("[data-cauldron-item]")) updateCauldronSelectionUI(); });
    $("tab-content").addEventListener("click", (event) => handleSharedClick(event, "tab"));
    $("overlay-content").addEventListener("click", (event) => handleSharedClick(event, "overlay"));
    // Bộ chọn thế vận công nằm ngay trên thanh hành động.
    $("action-list")?.addEventListener?.("click", (event) => {
      if (event.target?.closest?.(".technique-stance-picker-inline")) handleSharedClick(event, "actions");
    });
  }

  function updateCauldronSelectionUI() {
    const inputs = [...document.querySelectorAll("[data-cauldron-item]")];
    let remaining = 9;
    inputs.forEach((input) => { const max = Math.min(Number(input.max || 9), remaining); input.value = Math.max(0, Math.min(max, Math.floor(Number(input.value || 0)))); remaining -= Number(input.value || 0); });
    const selected = inputs.filter((input) => Number(input.value || 0) > 0);
    const total = selected.reduce((sum, input) => sum + Number(input.value || 0), 0);
    const label = document.querySelector("[data-cauldron-count]"); if (label) label.textContent = total;
    const summary = document.querySelector("[data-cauldron-summary]"); if (summary) summary.textContent = selected.length ? selected.map((input) => input.dataset.cauldronName + " ×" + input.value).join(" · ") : "Chưa chọn nguyên liệu";
    const submit = document.querySelector("[data-cauldron-refine]"); if (submit) submit.disabled = total < 3 || total > 9;
  }

  function clickActionBarButton(actionId, unavailableText) {
    const actionButton = [...document.querySelectorAll("#action-list [data-action-id]")].find((button) => button.dataset.actionId === actionId);
    if (actionButton) actionButton.click();
    else alert(unavailableText);
  }

  // Rerender target follows the surface that hosted the click.
  function refreshFateSurface(surface) {
    if (surface === "overlay") UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state));
    else UI.renderPanel(state);
  }

  function refreshOverlayAfterCommand(surface, command, arg, result) {
    const overlay = document.getElementById("overlay");
    const overlayContent = document.getElementById("overlay-content");
    if (command === "opportunity" || command === "map_event") {
      if (result?.success) { UI.closeOverlay(); return; }
    }
    if (!overlay || overlay.classList.contains("hidden") || !overlayContent) return;
    if (command === "opportunity") overlayContent.innerHTML = UI.renderContestedOpportunityModal(state);
    else if (command === "map_event") overlayContent.innerHTML = UI.renderMapEventModal(state);
    else if (command.startsWith("guild_")) overlayContent.innerHTML = UI.renderGuildProjectModal(state);
    else if (command === "fate_trial" || command === "fate_evolve") overlayContent.innerHTML = UI.renderFateEvolutionModal(state, arg);
    else if (command === "technique_evolve") overlayContent.innerHTML = UI.renderTechniqueDetail(state);
    else if (surface === "overlay" && ["technique_use", "technique_prepare", "technique_channel", "technique_cancel", "technique_acquire"].includes(command)) {
      if (result?.success) UI.closeOverlay();
      else overlayContent.innerHTML = UI.renderTechniqueDetail(state);
    } else if (surface === "overlay" && command === "npc_dialogue" && UI.renderNpcDialogue) overlayContent.innerHTML = UI.renderNpcDialogue(state, arg);
  }

  function finishExpansionCommand(surface, button, command, arg, result) {
    if (!result?.success && String(command).startsWith("technique_")) { E.pushHistory(state, { type: "warn", text: result?.reason || "Không thể thi triển Công Pháp." }); renderAfterTurn(); return; }
    const moveAfterDiscovery = button?.dataset?.pendingMove || "";
    if (result?.success && command === "map_event" && moveAfterDiscovery) submitUiAction(moveAfterDiscovery, { confirmPendingDeparture: true });
    if (!result?.success) alert(result?.reason || "Không thể thực hiện hành động này.");
    renderAfterTurn();
    refreshOverlayAfterCommand(surface, command, arg, result);
  }

  function runExpansionCommandFlow(expansionCommand, surface) {
    if (expansionCommand.disabled) return;
    expansionCommand.disabled = true;
    const command = expansionCommand.dataset.expansionCommand;
    const arg = expansionCommand.dataset.expansionArg || "";
    const arg2 = expansionCommand.dataset.expansionArg2 || "";
    if (command === "mark") {
      const existing = UI.escapeHtml(state.playerMarks?.[state.locationId]?.text || "");
      UI.openOverlay("Khắc dấu tại địa điểm", '<div class="mark-editor"><p class="muted">Ghi tối đa 120 ký tự cho địa điểm hiện tại.</p><textarea data-mark-input maxlength="120" rows="3" placeholder="Dấu vết cần ghi">' + existing + '</textarea><button class="choice" data-mark-submit>Ghi dấu</button></div>');
      return;
    }
    enqueueAction(() => {
      let result = E.runExpansionCommand(state, command, arg, arg2);
      if (result?.requiresConfirmation && (command === "technique_prepare" || command === "technique_use")) {
        const stance = arg2 || "steady";
        const preview = E.techniquePreview?.(state, arg, { stance }) || result;
        if (isDangerousTechnique(preview)) {
          renderAfterTurn();
          requestDangerConfirmation(preview, { stance, purpose: command === "technique_prepare" ? "Tụ lực" : "Thi triển" }, () => enqueueAction(() => {
            finishExpansionCommand(surface, expansionCommand, command, arg, E.runExpansionCommand(state, command, arg, arg2, { confirmed: true }));
          }));
          return;
        }
        // Chi phí tụ lực thường đã hiện trên bộ chọn; không cần hộp thoại trình duyệt.
        result = E.runExpansionCommand(state, command, arg, arg2, { confirmed: true });
      } else if (result?.requiresConfirmation && confirm(result.reason + "\nXác nhận tiếp tục?")) {
        result = E.runExpansionCommand(state, command, arg, arg2, { confirmed: true });
      }
      finishExpansionCommand(surface, expansionCommand, command, arg, result);
    });
  }

  function moveByMapDirection(direction, surface) {
    const actionId = "act_move_" + direction;
    if (openPendingMoveModal(actionId)) return;
    const departure = departureOptions(actionId);
    if (departure === null) return;
    enqueueAction(() => {
      submitUiAction(actionId, departure);
      if (surface === "overlay") UI.closeOverlay();
      renderAfterTurn();
    });
  }

  // One delegate for #tab-content, #overlay-content and the inline stance picker.
  function handleSharedClick(event, surface) {
    const find = (selector) => event.target.closest(selector);
    const scope = surface === "overlay" ? "#overlay-content " : "";
    let el;
    if ((el = find("[data-technique-danger-confirm]"))) {
      const run = pendingDangerConfirm;
      pendingDangerConfirm = null;
      UI.closeOverlay();
      if (state && typeof run === "function") run();
      return;
    }
    if ((el = find("[data-technique-danger-cancel]"))) { pendingDangerConfirm = null; UI.closeOverlay(); return; }
    if (!state) {
      const endingAction = find("[data-ending-action]");
      if (endingAction) handleEndingAction(endingAction.dataset.endingAction);
      const camera = find("[data-map-camera]");
      if (camera) UI.adjustMapCamera(camera.dataset.mapCamera);
      return;
    }
    if ((el = find("[data-status-action]")) && !el.disabled) { clickActionBarButton(el.dataset.statusAction, "Hành động này hiện không còn khả dụng trong bối cảnh hiện tại."); return; }
    if ((el = find("[data-world-event-action]")) && !el.disabled) { clickActionBarButton(el.dataset.worldEventAction, "Lựa chọn biến cố không còn khả dụng trong pha hiện tại."); return; }
    if ((el = find("[data-mark-submit]")) && E.runExpansionCommand) {
      const markSubmit = el;
      if (markSubmit.disabled) return;
      markSubmit.disabled = true;
      const note = String(document.querySelector("[data-mark-input]")?.value || "").slice(0, 120);
      enqueueAction(() => {
        const result = E.runExpansionCommand(state, "mark", note, "");
        if (!result?.success) alert(result?.reason || "Không thể ghi dấu tại địa điểm này.");
        else { UI.closeOverlay(); renderAfterTurn(); }
      });
      return;
    }
    if ((el = find("[data-secluded-hours]"))) {
      const secludedHours = el;
      if (secludedHours.disabled) return;
      secludedHours.disabled = true;
      const raw = Number(document.querySelector("[data-secluded-hours-input]")?.value || 1);
      const hours = Math.max(1, Math.min(8, Number.isFinite(raw) ? Math.floor(raw) : 1));
      enqueueAction(() => {
        E.submitActionId(state, "act_be_quan", { hours });
        UI.closeOverlay();
        renderAfterTurn();
      });
      return;
    }
    if ((el = find("[data-expansion-modal]"))) {
      const type = el.dataset.expansionModal;
      if (type === "guild-project") UI.openOverlay("Công Trình Tông Môn", UI.renderGuildProjectModal(state));
      if (type === "opportunity") UI.openOverlay("Cơ Duyên Tranh Đoạt", UI.renderContestedOpportunityModal(state));
      return;
    }
    if ((el = find("[data-special-physique]")) && E.claimSpecialPhysique) {
      const physiqueId = el.dataset.specialPhysique;
      enqueueAction(() => { const result = E.claimSpecialPhysique(state, physiqueId); if (!result.success) alert(result.reason || "Chưa thể tiếp nhận Dị Thể."); else { saveGame(); UI.renderPanel(state); } });
      return;
    }
    if ((el = find("[data-technique-stance]"))) {
      const actionId = el.dataset.techniqueAction || "";
      const stance = el.dataset.techniqueStance || "steady";
      const action = (E.contextState(state)?.actions || []).find((entry) => entry.id === actionId) || (/^act_skill_/.test(actionId) ? { id: actionId } : null);
      if (action) commitTechniqueAction(action, stance);
      return;
    }
    if ((el = find("[data-pending-resolve]"))) { resolvePendingThenMove(el.dataset.pendingResolve, el.dataset.pendingMove || ""); return; }
    if ((el = find("[data-pending-move-now]"))) {
      const moveId = el.dataset.pendingMoveNow;
      enqueueAction(() => { submitUiAction(moveId, { confirmPendingDeparture: true }); UI.closeOverlay(); renderAfterTurn(); });
      return;
    }
    if ((el = find("[data-map-camera]"))) { UI.adjustMapCamera(el.dataset.mapCamera); return; }
    if ((el = find("[data-expansion-command]")) && E.runExpansionCommand) { runExpansionCommandFlow(el, surface); return; }
    if ((el = find("[data-origin-confirm]"))) {
      const [type, specialization] = (document.querySelector('#overlay-content input[name="origin-specialization"]:checked')?.value || "").split(":");
      enqueueAction(() => { const result = E.chooseOrigin(state, type, specialization); if (!result.success) { alert(result.reason); return; } UI.closeOverlay(true); saveGame(); renderAfterTurn(); });
      return;
    }
    if ((el = find("[data-journey-intent-confirm]"))) {
      const intentId = document.querySelector('#overlay-content input[name="journey-intent"]:checked')?.value || "";
      enqueueAction(() => { const result = E.chooseJourneyIntent(state, intentId); if (!result.success) { alert(result.reason); return; } UI.closeOverlay(true); saveGame(); renderAfterTurn(); });
      return;
    }
    if ((el = find("[data-anchor-select]"))) {
      const anchorId = el.dataset.anchorSelect;
      enqueueAction(() => { const result = E.establishHumanAnchor(state, anchorId); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Nghi Thức Đột Phá", UI.renderRitualModal(state, "anchor", { disabled_reason: "" })); } });
      return;
    }
    if ((el = find("[data-ritual-confirm]")) && !el.disabled) { const actionId = "act_ritual_" + el.dataset.ritualConfirm; UI.closeOverlay(); enqueueAction(() => { E.submitActionId(state, actionId); renderAfterTurn(); }); return; }
    if ((el = find("[data-cauldron-auto]"))) {
      const boxes = [...document.querySelectorAll("[data-cauldron-item]")];
      boxes.forEach((box) => { box.value = 0; });
      let remaining = 9;
      boxes.forEach((box) => { if (remaining <= 0 || box.dataset.cauldronSafe !== "true") return; const qty = Math.min(remaining, Number(box.max || 0)); box.value = qty; remaining -= qty; });
      updateCauldronSelectionUI();
      return;
    }
    if (find("[data-cauldron-clear]")) { document.querySelectorAll("[data-cauldron-item]").forEach((box) => { box.value = 0; }); updateCauldronSelectionUI(); return; }
    if ((el = find("[data-quest-track]"))) { const questId = el.dataset.questTrack; enqueueAction(() => { if (E.trackQuest(state, questId, true)) { saveGame(); UI.renderPanel(state); } }); return; }
    if ((el = find("[data-quest-abandon]"))) { const questId = el.dataset.questAbandon; if (confirm("Từ bỏ nhiệm vụ này? Hậu quả sẽ được ghi vào lịch sử.")) enqueueAction(() => { E.abandonQuest(state, questId); saveGame(); UI.renderPanel(state); }); return; }
    if ((el = find("[data-fate-equip]"))) {
      const fateId = el.dataset.fateEquip;
      enqueueAction(() => { const result = E.equipFateFromVault(state, fateId); if (result.requiresReplacement) UI.openOverlay("Thay thế Ấn Ký Mệnh Số", UI.renderFateReplacementChooser(state, fateId)); else if (!result.success) alert(result.reason); else { saveGame(); refreshFateSurface(surface); } });
      return;
    }
    if ((el = find("[data-fate-unequip]"))) {
      const fateId = el.dataset.fateUnequip;
      enqueueAction(() => { const index = (state.player.fates || []).indexOf(fateId); const result = E.storeFateToVault(state, index); if (!result.success) alert(result.reason); else { saveGame(); refreshFateSurface(surface); } });
      return;
    }
    if ((el = find("[data-fate-upgrade-target]"))) { UI.openOverlay("Cường Hóa Mệnh Số", UI.renderFateUpgradeChooser(state, el.dataset.fateUpgradeTarget)); return; }
    if ((el = find("[data-fate-upgrade-confirm]"))) {
      const targetId = el.dataset.fateUpgradeConfirm, materialId = el.dataset.fateUpgradeMaterial;
      enqueueAction(() => { const result = E.upgradeFate(state, targetId, materialId); if (!result.success) alert(result.reason); else { saveGame(); refreshFateSurface(surface); } });
      return;
    }
    if ((el = find("[data-fate-evolution]"))) { UI.openOverlay("Mệnh Số Tiến Hóa", UI.renderFateEvolutionModal(state, el.dataset.fateEvolution)); return; }
    if ((el = find("[data-fate-nurture]"))) {
      const fateId = el.dataset.fateNurture;
      enqueueAction(() => { const result = E.nurtureFate(state, fateId); if (!result.success) alert(result.reason || (result.blockers || []).join("\n")); else { saveGame(); refreshFateSurface(surface); } });
      return;
    }
    if ((el = find("[data-fate-resonate]"))) {
      const fateId = el.dataset.fateResonate;
      enqueueAction(() => { const result = E.resonateFate(state, fateId); if (!result.success) alert((result.blockers || [result.reason]).join("\n")); else { saveGame(); refreshFateSurface(surface); } });
      return;
    }
    if ((el = find("[data-fate-transform]"))) {
      const id = el.dataset.fateTransform;
      enqueueAction(() => {
        const preview = E.transformFate(state, id);
        if (!preview.success) { alert((preview.blockers || [preview.reason]).join("\n")); return; }
        const candidates = preview.candidates || [];
        if (!candidates.length) { alert("Chưa có nhánh biến thể phù hợp."); return; }
        const branch = candidates[0];
        if (!confirm("Xác nhận Mệnh Đổi theo nhánh " + (branch.name || branch.id) + "? Chi phí: " + preview.costs.essence + " Tinh Hoa, " + preview.costs.merit + " Công Đức, " + preview.costs.san + " SAN.")) return;
        const result = E.transformFate(state, id, branch.id, { confirmed: true });
        if (!result.success) alert(result.reason || (result.blockers || []).join("\n")); else { saveGame(); refreshFateSurface(surface); }
      });
      return;
    }
    const fateSimpleActions = [["[data-fate-insight]", (node) => node.dataset.fateInsight, "revealFateInsight"], ["[data-fate-release]", (node) => node.dataset.fateRelease, "releaseStagnantFate"], ["[data-fate-defy]", (node) => node.dataset.fateDefy, "defyFate"], ["[data-fate-suppress]", (node) => node.dataset.fateSuppress, "suppressFate"]];
    for (const [selector, readId, method] of fateSimpleActions) {
      if ((el = find(selector))) {
        const fateId = readId(el);
        enqueueAction(() => { const result = E[method](state, fateId); if (!result.success) alert(result.reason); else { saveGame(); refreshFateSurface(surface); } });
        return;
      }
    }
    if (find("[data-fate-merge-submit]")) {
      const ids = [...document.querySelectorAll(scope + "[data-fate-merge]:checked")].map((input) => input.dataset.fateMerge);
      enqueueAction(() => { const result = E.mergeFates(state, ids); if (!result.success) alert(result.reason); else { saveGame(); refreshFateSurface(surface); } });
      return;
    }
    if ((el = find("[data-fate-swap-active]"))) {
      const activeId = el.dataset.fateSwapActive, vaultId = el.dataset.fateVaultId;
      enqueueAction(() => { const result = E.swapFateFromVault(state, activeId, vaultId); if (!result.success) alert(result.reason); else { UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); saveGame(); } });
      return;
    }
    if (find("[data-pending-fate-resolve]")) {
      enqueueAction(() => { if ((state.fateInventory || []).length < E.fateVaultCapacity(state)) { const result = E.resolvePendingFateReward(state); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } } else UI.openOverlay("Xử lý Mệnh Số chờ nhận", UI.renderPendingFateChooser(state)); });
      return;
    }
    if ((el = find("[data-pending-fate-replace]"))) {
      const replaceId = el.dataset.pendingFateReplace;
      enqueueAction(() => { const result = E.resolvePendingFateReward(state, replaceId); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); } });
      return;
    }
    if (find("[data-pending-fate-dismiss]")) { if (confirm("Từ chối Mệnh Số đang chờ? Lựa chọn này không thể hoàn tác.")) enqueueAction(() => { E.dismissPendingFateReward(state); saveGame(); UI.openOverlay("Tử Vi Mệnh Số", UI.renderFateDetail(state)); }); return; }
    const purchases = [
      ["[data-qintian-method]", (node) => node.dataset.qintianMethod, "sacrificeLifespanForFate"],
      ["[data-market-offer]", (node) => node.dataset.marketOffer, "buyMarketOffer"], ["[data-merit-fate]", (node) => node.dataset.meritFate, "buyFateWithMerit"]
    ];
    for (const [selector, readId, method] of purchases) {
      if ((el = find(selector))) {
        const offerId = readId(el);
        enqueueAction(() => { const result = E[method](state, offerId); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } });
        return;
      }
    }
    if ((el = find("[data-black-market-fate]"))) {
      const offerId = el.dataset.blackMarketFate;
      enqueueAction(() => { const result = E.buyBlackMarketOffer(state, offerId); if (!result.success) alert(result.reason); else { saveGame(); UI.openOverlay("Nghịch Thương Nhân", UI.renderBlackMarket(state)); } });
      return;
    }
    if (find("[data-cauldron-refine]")) {
      const selection = [...document.querySelectorAll("[data-cauldron-item]")].map((input) => ({ itemId: input.dataset.cauldronItem, name: input.dataset.cauldronName, quantity: Number(input.value || 0) })).filter((entry) => entry.quantity > 0);
      if (!selection.length) { alert("Hãy chọn nguyên liệu thủ công trước."); return; }
      const total = selection.reduce((sum, entry) => sum + entry.quantity, 0);
      const summary = selection.map((entry) => entry.name + " ×" + entry.quantity).join("\n");
      if (!confirm("Xác nhận tiêu hao " + total + " đơn vị sau?\n\n" + summary + "\n\nKhông thể hoàn tác sau khi dung luyện.")) return;
      enqueueAction(() => { const result = E.refineAtVoidCauldron(state, selection); if (!result.success) alert(result.reason); else { saveGame(); UI.renderPanel(state); } });
      return;
    }
    if ((el = find("[data-fate-suggest]"))) { UI.openOverlay("Gợi ý Mệnh Số", UI.renderFateSuggestions(state, el.dataset.fateSuggest)); return; }
    if ((el = find("[data-breakthrough-help]"))) { UI.openOverlay("Cách hoàn thành điều kiện", UI.renderBreakthroughHelp(el.dataset)); return; }
    if ((el = find("[data-fate-slot]"))) { UI.openOverlay("Hoán đổi Ấn ký Mệnh Số", UI.renderFateSlotChooser(state, el.dataset.fateSlot)); return; }
    if ((el = find("[data-equip-category]"))) { UI.openEquipmentPicker(state, el.dataset.equipCategory, el.dataset.equipSlot || ""); return; }
    if ((el = find("[data-equip-pick]"))) {
      const pick = el;
      enqueueAction(() => {
        const result = pick.dataset.equipAction === "equip" ? E.equipItem(state, pick.dataset.equipPick, pick.dataset.equipTargetSlot || null) : E.handleInventoryAction(state, pick.dataset.equipPick, pick.dataset.equipAction);
        if (result !== true) { alert(result || "Không thể thay đổi trang bị."); return; }
        UI.closeOverlay(); saveGame(); UI.renderPanel(state);
      });
      return;
    }
    if ((el = find("[data-item-action]"))) {
      const itemId = el.dataset.itemId, itemAction = el.dataset.itemAction;
      enqueueAction(() => {
        const result = E.handleInventoryAction(state, itemId, itemAction);
        if (result !== true) alert(typeof result === "string" ? result : "Không thể sử dụng vật phẩm này.");
        else if (surface === "overlay") { saveGame(); UI.openOverlay("Hành Trang", UI.renderInventoryModal(state)); }
        renderAfterTurn();
      });
      return;
    }
    const guildActions = [["[data-guild-join]", (target) => E.joinGuild(state, target.dataset.guildJoin)], ["[data-guild-refuse]", (target) => E.refuseGuild(state, target.dataset.guildRefuse)], ["[data-guild-leave]", () => E.leaveGuild(state)]];
    for (const [selector, run] of guildActions) {
      if ((el = find(selector))) {
        const target = el;
        enqueueAction(() => { run(target); saveGame(); UI.renderPanel(state); flushRewardSummaries(); });
        return;
      }
    }
    if ((el = find("[data-ending-action]"))) { handleEndingAction(el.dataset.endingAction); return; }
    if ((el = find("[data-fate-view]"))) {
      const body = document.querySelector("#overlay-content .fate-paperdoll");
      const grid = document.querySelector("#overlay-content .detail-columns");
      const isBody = el.dataset.fateView === "body";
      if (body) body.hidden = !isBody;
      if (grid) grid.hidden = isBody;
      return;
    }
    if ((el = find("[data-ritual-open]"))) { if (el.dataset.ritualOpen === "fate") showFateOverlay(); else showTechniqueOverlay(); return; }
    if ((el = find("[data-map-view]"))) {
      UI.setMapView(el.dataset.mapView, state);
      if (surface === "overlay") UI.openOverlay("Bản Đồ", UI.renderMapDetail(state));
      return;
    }
    if ((el = find("[data-map-action]"))) {
      const actionId = el.dataset.mapAction;
      if (actionId === "act_ban_do") { showMapOverlay(); return; }
      enqueueAction(() => { submitUiAction(actionId); renderAfterTurn(); });
      return;
    }
    if ((el = find("[data-map-faction]"))) { event.stopPropagation(); UI.openOverlay("Hồ sơ thế lực", UI.renderMapFactionDetail(state, el.dataset.mapFaction, "")); return; }
    if ((el = find("[data-map-guild]"))) { event.stopPropagation(); UI.openOverlay("Hồ sơ tổ chức", UI.renderMapFactionDetail(state, "", el.dataset.mapGuild)); return; }
    if ((el = find("[data-map-dir]"))) moveByMapDirection(el.dataset.mapDir, surface);
  }

  function handleEndingAction(action) {
    UI.closeOverlay();
    if (action === "restart" || action === "home") { state = null; UI.showScreen("home"); refreshContinue(); }
    else if (action === "load") { loadGame(); renderFull(); }
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
      if (confirmDeparture(result.pendingType)) {
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

  function renderAfterTurnNow() {
    if (!state) return;
    renderStoryWindow();
    flushRewardSummaries();

    if (state.pendingEnding) {
      showEnding(state.pendingEnding);
      return;
    }

    const renderLocation = E.locationForState?.(state) || D.LOCATIONS[state.locationId] || { name: state.locationId || "Vị trí chưa định danh" };
    UI.setLocation(renderLocation.name || state.locationId || "Vị trí chưa định danh");
    UI.renderPanel(state);
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

  // Coalesce action-bar/menu updates arriving in the same event loop turn.
  // Gameplay state is committed synchronously; only DOM work waits for the
  // next frame, preventing duplicate full panel/action-bar paints.
  function renderAfterTurn() {
    if (!state || renderFramePending) return;
    renderFramePending = true;
    const flush = () => {
      renderFramePending = false;
      renderAfterTurnNow();
    };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(flush);
    else if (typeof setTimeout === "function") setTimeout(flush, 0);
    else flush();
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
  function flushRewardSummaries() {
    if (!state || state.pendingEnding || !state.pendingRewardSummaries?.length) return;
    if (!document.getElementById("overlay") || !document.getElementById("overlay-title") || !document.getElementById("overlay-content")) return;
    const summaries = state.pendingRewardSummaries.slice();
    UI.openOverlay("Phần thưởng nhận được", UI.renderRewardSummary(summaries));
    state.pendingRewardSummaries.splice(0, summaries.length);
  }

  function renderFull() {
    const fullRenderLocation = E.locationForState?.(state) || D.LOCATIONS[state.locationId] || { name: state.locationId || "Vị trí chưa định danh" };
    UI.setLocation(fullRenderLocation.name || state.locationId || "Vị trí chưa định danh");
    UI.clearStory();
    const renderProfile = window.GameExpansion?.performanceProfile?.(state, { reducedMotion: Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches), hardwareConcurrency: window.navigator?.hardwareConcurrency, deviceMemory: window.navigator?.deviceMemory });
    storyWindowSize = Math.min(20, Number(renderProfile?.historyWindow || 20));
    renderStoryWindow();
    UI.renderPanel(state);
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
    if (!el || !state || !E.clockLabel) return;
    el.textContent = E.clockLabel(state);
    el.title = "Thời gian của nhân vật · 1 ngày game = " + Number(E.GAME_TIME_CONFIG?.realSecondsPerGameDay || 30) + " giây thực";
    const world = $("world-clock");
    if (world && E.worldClockLabel) {
      world.textContent = E.worldClockLabel(state);
      world.title = "Thời gian của Thái Thanh đại lục · dùng cho thiên tượng, NPC, chiến sự và biến cố.";
    }
    const summary = E.expansionSummary?.(state) || {};
    let weather = $("game-weather");
    if (!weather) {
      weather = document.createElement("span");
      weather.id = "game-weather";
      weather.className = "game-weather";
      weather.title = "Mùa và thời tiết hiện tại";
      (world?.parentNode || el.parentNode)?.appendChild(weather);
    }
    if (weather) {
      const weatherLabels = { quang: "Quang đãng", mua: "Mưa", suong: "Sương", tuyet: "Tuyết", loi_vu: "Lôi Vũ", linh_phong: "Linh Phong", am_vu: "Âm Vũ", bao_linh_khi: "Bão Linh Khí" };
      const seasonName = summary.season?.name || "Chưa rõ mùa";
      const weatherName = summary.weatherLabel || weatherLabels[summary.weather] || "Quang đãng";
      const remaining = Number(summary.weatherRemainingDays);
      weather.hidden = false;
      weather.textContent = "☁ " + seasonName + " · " + weatherName + (Number.isFinite(remaining) && remaining > 0 ? " · còn " + remaining + " ngày" : "");
      weather.title = "Mùa " + seasonName + " · Thiên tượng " + weatherName + (Number.isFinite(remaining) ? " · còn " + remaining + " ngày" : "");
    }
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

  function confirmDeparture(pendingType) {
    const kind = pendingType === "opportunity" ? "cơ duyên tranh đoạt" : pendingType === "map_event" ? "phát hiện ẩn" : "phát hiện chưa xử lý";
    return confirm("Ngươi còn " + kind + " tại đây. Rời đi sẽ làm mất vĩnh viễn. Vẫn muốn rời đi?");
  }

  function departureOptions(actionId) {
    const guard = E.pendingDepartureGuard ? E.pendingDepartureGuard(state, actionId) : { allowed: true };
    if (!guard.requiresConfirmation) return {};
    if (!confirmDeparture(guard.pendingType)) return null;
    return { confirmPendingDeparture: true };
  }

  function isMovementActionId(actionId) {
    return /^act_move_(bac|nam|dong|tay)$/.test(String(actionId || ""));
  }

  function openPendingMoveModal(actionId) {
    if (!isMovementActionId(actionId)) return false;
    if (!E.pendingExplorationAt?.(state) && state.pendingMapEvent?.status !== "pending") return false;
    if (!E.pendingExplorationAt?.(state) && state.pendingMapEvent?.status === "pending") {
      UI.openOverlay("Phát Hiện Ẩn", UI.renderMapEventModal(state, actionId));
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
      if (action.id === "act_giup") {
        UI.openOverlay("Trợ Giúp", '<pre class="help-overlay-text">' + UI.escapeHtml(window.GameData?.HELP_TEXT || "Chưa có hướng dẫn.") + '</pre>');
        return;
      }
      if (action.id === "act_exp_divine") {
        const result = E.divine?.(state);
        if (!result?.success) { alert(result?.reason || "Chưa thể xem quẻ lúc này."); return; }
        UI.openOverlay("Xem Quẻ", '<div class="detail-block"><h3>Điềm quẻ</h3><p>' + UI.escapeHtml(result.hint?.text || "Quẻ chưa hiện rõ.") + '</p><small>Đã trả 3 Linh Thạch · hiệu lực đến ngày ' + Number(result.hint?.expiresDay || 0) + ' · hướng ' + UI.escapeHtml(result.hint?.direction || "chưa rõ") + '</small></div>');
        renderAfterTurn();
        return;
      }
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
        showTechniqueStancePicker(action);
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
        showSecludedHoursOverlay(action);
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
        showTechniqueStancePicker(action);
        return;
      }
      let actionOptions = departure;
      if (action.id.startsWith("act_exp_npc_talk_") || action.id.startsWith("act_talk_")) {
        enqueueAction(() => {
          const result = submitUiAction(action.id, actionOptions);
          renderAfterTurn();
          const npcId = action.id.replace(/^act_(?:exp_npc_talk_|talk_)/, "");
          if ((result?.success || state.dialogueState?.npcId === npcId) && UI.renderNpcDialogue) {
            UI.openOverlay("Đối thoại", UI.renderNpcDialogue(state, npcId));
          }
        });
        return;
      }
      enqueueAction(() => {
        submitUiAction(action.id, actionOptions);
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

  function showSecludedHoursOverlay(action) {
    UI.openOverlay("Bế quan", '<div class="secluded-hours-picker"><p class="muted">Chọn thời lượng bế quan từ 1 đến 8 giờ.</p><label>Số giờ <input type="number" min="1" max="8" value="1" data-secluded-hours-input></label><button class="choice" data-secluded-hours>Xác nhận bế quan</button></div>');
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

  function showTechniqueStancePicker(action) {
    const techniqueId = action.id.slice("act_skill_".length);
    const host = document.getElementById("action-list");
    if (!host) return;
    host.querySelectorAll(".technique-stance-picker-inline").forEach((node) => node.remove());
    const technique = E.techniqueCatalog?.()[techniqueId] || {};
    const previewFor = (stance) => E.techniquePreview(state, techniqueId, { stance });
    const stances = [
      ["steady", "Thông thường", "Uy lực và chi phí cân bằng."],
      ["burst", "Bạo kích", "Uy lực +20%, nhưng Tà Nhiễm tăng 50%."],
      ["guarded", "Hộ thể", "Uy lực -15%, giảm một nửa chi phí Thanh Tỉnh/Tà Nhiễm."]
    ];
    const preparation = Boolean(technique.preparation?.enabled || technique.prepareCost || technique.cost?.prepare);
    const cooldownTurnsFor = (preview) => {
      if (preview?.cooldownTurns != null) return Number(preview.cooldownTurns || 0);
      return typeof E.techniqueCooldownTurns === "function" ? Number(E.techniqueCooldownTurns(technique) || 0) : 0;
    };
    const rows = stances.map(([id, label, description]) => {
      const preview = previewFor(id);
      const disabled = !preview?.success || preview.resourcesReady === false;
      const cost = preview?.costs || {};
      const detail = disabled ? (preview?.reason || (preview?.blockers || []).map((entry) => entry.message).join(" · ") || "Chưa sẵn sàng") : "Khí " + Number(cost.manaCost || 0) + " · Thể " + Number(cost.staminaCost || 0) + " · Tỉnh " + Number(cost.sanCost || 0) + " · Hồi " + cooldownTurnsFor(preview) + " lượt" + (isDangerousTechnique(preview) ? " · ⚠ cần xác nhận cái giá" : "");
      return '<button type="button" class="technique-stance-option" data-technique-stance="' + id + '" data-technique-action="' + UI.escapeHtml(action.id) + '"' + (disabled ? ' disabled' : '') + '><b>' + UI.escapeHtml(label) + '</b><small>' + UI.escapeHtml(description) + '</small><em>' + UI.escapeHtml(detail) + '</em></button>';
    }).join("");
    const prepare = preparation ? '<button type="button" class="technique-prepare-option" data-expansion-command="technique_prepare" data-expansion-arg="' + UI.escapeHtml(techniqueId) + '" data-expansion-arg2="steady"><b>Tụ lực</b><small>Tụ lực Công Pháp trước khi vận công và thi triển.</small></button>' : "";
    const panel = document.createElement("section");
    panel.className = "technique-stance-picker-inline";
    panel.setAttribute("aria-label", "Chọn cách thi triển Công Pháp");
    panel.innerHTML = '<div class="technique-stance-picker-head"><b>' + UI.escapeHtml(technique.name || techniqueId) + '</b><small>Chọn cách thi triển · ' + (technique.category === "cam_thuat" ? "Cấm Thuật cần xác nhận cái giá" : "không cần xác nhận lại") + '</small></div><div class="technique-stance-options">' + prepare + rows + '</div>';
    host.appendChild(panel);
    panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function isDangerousTechnique(preview) {
    if (typeof UI.isDangerousTechniquePreview === "function") return UI.isDangerousTechniquePreview(preview);
    return Boolean(preview && (preview.requiresConfirmation || preview.dangerous || preview.family === "cam_thuat" || preview.category === "cam_thuat"));
  }

  // Inline danger sheet replaces browser confirm(); only its confirm button runs onConfirm.
  function requestDangerConfirmation(preview, options, onConfirm) {
    pendingDangerConfirm = onConfirm;
    UI.openOverlay("Xác nhận Cấm Thuật", UI.renderTechniqueDangerSheet(state, preview, options));
  }

  function commitTechniqueAction(action, stance) {
    const techniqueId = action.id.slice("act_skill_".length);
    const preview = E.techniquePreview(state, techniqueId, { stance });
    if (!preview || !preview.success) { E.pushHistory(state, { type: "warn", text: preview?.reason || "Không thể thi triển Công Pháp." }); renderAfterTurn(); return; }
    if (preview.resourcesReady === false) { E.pushHistory(state, { type: "warn", text: (preview.blockers || []).map((entry) => entry.message).join(" · ") || "Chưa đủ tài nguyên để thi triển Công Pháp." }); renderAfterTurn(); return; }
    const submit = (confirmed) => {
      const actionId = E.nextTechniqueActionId(state);
      enqueueAction(() => {
        const options = confirmed ? { confirmed: true, stance, actionId } : { stance, actionId };
        const result = E.submitActionId(state, action.id, options);
        renderAfterTurn();
        if (!confirmed && result?.requiresConfirmation) requestDangerConfirmation(E.techniquePreview(state, techniqueId, { stance }) || preview, { stance, purpose: "Thi triển" }, () => submit(true));
      });
    };
    if (isDangerousTechnique(preview)) {
      requestDangerConfirmation(preview, { stance, purpose: "Thi triển" }, () => submit(true));
      return;
    }
    submit(false);
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
    saveDirty = true;
    if (!explicit) {
      if (saveTimer != null) return;
      saveTimer = setTimeout(() => {
        saveTimer = null;
        if (!state || !saveDirty) return;
        localStorage.setItem(SAVE_KEY, E.serialize(state));
        saveDirty = false;
      }, 250);
      return;
    }
    if (saveTimer != null) { clearTimeout(saveTimer); saveTimer = null; }
    localStorage.setItem(SAVE_KEY, E.serialize(state));
    saveDirty = false;
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
