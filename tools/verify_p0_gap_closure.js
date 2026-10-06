"use strict";

const assert = require("assert");
const { loadBrowserGame } = require("./verify_game");
const { runProducerAudit } = require("./verify_log_producers");

const sandbox = loadBrowserGame();
const E = sandbox.window.GameEngine;
const X = sandbox.window.GameExpansion;

function makeState() {
  const state = E.createState({ character: E.createCharacter({ name: "P0 QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  X.ensureExpansionState(state);
  return state;
}

function run() {
  const state = makeState();
  ["computeMapInfluence", "mapOwner", "mapZoneStatus", "mapStructurePreview", "petitionFactionTerritory"].forEach((name) => {
    assert.strictEqual(typeof X[name], "function", `missing canonical MAP API: ${name}`);
  });
  const influence = X.computeMapInfluence(state, state.locationId);
  assert.strictEqual(influence.source, "canonical_gradient");

  const previewTeleport = X.mapStructurePreview(state, state.locationId, "teleport_array");
  const previewWard = X.mapStructurePreview(state, state.locationId, "world_ward");
  assert(previewTeleport.available && previewTeleport.canonicalId === "waystation");
  assert(previewWard.available && previewWard.canonicalId === "ward_formation");
  assert.strictEqual(X.structureCatalog().waystation.canonicalNames[0], "Truyền Tống Trận");
  assert.strictEqual(X.structureCatalog().ward_formation.canonicalNames[0], "Hộ Giới Đại Trận");

  const ps = state.professionState;
  assert(Object.prototype.hasOwnProperty.call(ps, "hiddenId"), "professionState.hiddenId is required");
  const knownHiddenId = Object.keys(sandbox.window.EXPANSION_DATA.hiddenProfessions || {})[0];
  assert(knownHiddenId, "hidden profession catalog must not be empty");
  ps.hiddenId = knownHiddenId; ps.secondaryId = null; state.player.hiddenProfession = null;
  X.ensureExpansionState(state);
  assert.strictEqual(ps.hiddenId, ps.secondaryId, "hiddenId must reconcile to secondaryId");
  assert.strictEqual(ps.hiddenId, state.player.hiddenProfession, "legacy hidden profession alias must reconcile");
  ps.hiddenId = null; ps.secondaryId = null; state.player.hiddenProfession = null;
  assert(X.validateCanonicalNamespaces(state).ok, "canonical profession aliases must reconcile");

  const expectedNarrativeCodes = [
    "INVALID_USE_COUNT", "MAX_USES", "RESOURCE_SHORTAGE", "UNKNOWN_COMPANION_SKILL",
    "COMPANION_ROLE_MISMATCH", "EXPIRED", "FACTION_REQUIRED", "FATE_REQUIRED",
    "GUILD_REQUIRED", "GUILD_RANK_REQUIRED", "UNKNOWN_TECHNIQUE", "REALM_TOO_LOW",
    "REALM_TOO_HIGH", "PATH_MISMATCH"
  ];
  expectedNarrativeCodes.forEach((code) => {
    assert(Array.isArray(E.ERROR_NARRATIVE_MAP[code]) && E.ERROR_NARRATIVE_MAP[code].length > 0, `missing narrative map: ${code}`);
    assert(!/[A-Z][A-Z0-9_]{3,}/.test(E.playerFacingReason(code)), `narrative leaked code: ${code}`);
  });
  const producer = runProducerAudit();
  return { mapApis: 5, structures: 2, narrativeCodes: expectedNarrativeCodes.length, producers: producer.checked };
}

if (require.main === module) console.log(`OK: P0 gap closure ${JSON.stringify(run())}`);
module.exports = { run };
