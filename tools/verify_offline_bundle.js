"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const bundle = fs.readFileSync(path.join(ROOT, "index.offline.html"), "utf8");
const sourceFiles = [
  "gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js",
  "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js",
  "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js", "js/ui.js", "js/main.js"
];
assert(!/<script[^>]+src=/i.test(bundle), "offline bundle must not depend on external script files");
assert(!/<link[^>]+stylesheet/i.test(bundle), "offline bundle must inline CSS");
assert(bundle.includes("id=\"pinned-character-summary\""), "offline bundle is missing the pinned character mount");
sourceFiles.forEach((file) => {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  const markers = file === "js/engine.js" ? ["migrateV12ToV13", "pendingDepartureGuard"] : file === "js/expansion.js" ? ["buildTechniqueContext", "ageDays", "act_exp_companion_recover"] : file === "js/ui.js" ? ["act_move_group", "renderPinnedCharacterSummary"] : file === "js/main.js" ? ["act_move_group", "renderAfterTurn"] : [];
  markers.forEach((marker) => assert(bundle.includes(marker), `offline bundle missing current ${file} marker: ${marker}`));
});
console.log("OK: offline bundle is self-contained and contains current runtime/UI markers");
