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
    UI.showScreen("home");
    refreshContinue();
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
    D.WORLD_MAP.regions.forEach((region) => {
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
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
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
      submitAction();
    });

    $("tab-content").addEventListener("click", (event) => {
      const itemAction = event.target.closest("[data-item-action]");
      if (itemAction && state) {
        E.handleInventoryAction(state, itemAction.dataset.itemId, itemAction.dataset.itemAction);
        renderAfterTurn();
        return;
      }
      const join = event.target.closest("[data-guild-join]");
      if (join && state) {
        E.joinGuild(state, join.dataset.guildJoin);
        saveGame();
        UI.renderPanel(state);
        return;
      }
      const refuse = event.target.closest("[data-guild-refuse]");
      if (refuse && state) {
        E.refuseGuild(state, refuse.dataset.guildRefuse);
        saveGame();
        UI.renderPanel(state);
        return;
      }
      const leave = event.target.closest("[data-guild-leave]");
      if (leave && state) {
        E.leaveGuild(state);
        saveGame();
        UI.renderPanel(state);
        return;
      }
      const view = event.target.closest("[data-map-view]");
      if (view && state) {
        UI.setMapView(view.dataset.mapView, state);
        return;
      }
      const target = event.target.closest("[data-map-dir]");
      if (!target || !state) return;
      E.move(state, target.dataset.mapDir);
      renderAfterTurn();
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
    // flush remaining history entries to story log (engine already pushed)
    const history = state.history;
    // find entries not yet rendered by turn marker
    if (!window._renderedTurn) window._renderedTurn = 0;
    for (let i = window._renderedTurn; i < history.length; i++) {
      const h = history[i];
      UI.addStory(h.type || "narr", h.text, h.portrait);
    }
    window._renderedTurn = history.length;

    if (state.pendingEnding) {
      showEnding(state.pendingEnding);
      return;
    }

    saveGame();
    flashSave("Đã lưu");
    UI.setLocation(D.LOCATIONS[state.locationId].name);
    UI.renderPanel(state);
    if (UI.renderActions) UI.renderActions(state, (actionId) => {
      const action = E.contextState(state).actions.find((item) => item.id === actionId);
      if (action) { E.submitTurn(state, { text: action.label }); renderAfterTurn(); }
    });
  }

  function renderFull() {
    UI.setLocation(D.LOCATIONS[state.locationId].name);
    UI.clearStory();
    window._renderedTurn = 0;
    state.history.forEach((h) => UI.addStory(h.type || "narr", h.text, h.portrait));
    window._renderedTurn = state.history.length;
    UI.renderPanel(state);
    if (UI.renderActions) UI.renderActions(state, (actionId) => {
      const action = E.contextState(state).actions.find((item) => item.id === actionId);
      if (action) { E.submitTurn(state, { text: action.label }); renderAfterTurn(); }
    });
    flashSave("Đã tải bản lưu");
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
    UI.renderChoices([
      { label: "Bắt đầu lại", onClick: () => { state = null; UI.showScreen("home"); refreshContinue(); } },
      { label: "Nạp bản lưu gần nhất", onClick: () => { loadGame(); renderFull(); } }
    ]);
    // remove save to avoid re-triggering ending loop
    localStorage.removeItem(SAVE_KEY);
    LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
    UI.setSaveIndicator("Đã xóa bản lưu");
  }

  /* ---------- save / load ---------- */
  function saveGame() {
    if (!state) return;
    localStorage.setItem(SAVE_KEY, E.serialize(state));
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
