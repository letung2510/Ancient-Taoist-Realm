/* Phase 3 controlled catalog migration. Run only after a backup exists. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const outDir = __dirname;
const gradeOrder = ["phan", "linh", "hoang", "huyen", "dia", "thien", "thanh", "tien"];
const labels = { phan: "Phàm Phẩm", linh: "Linh Phẩm", hoang: "Hoàng Phẩm", huyen: "Huyền Phẩm", dia: "Địa Phẩm", thien: "Thiên Phẩm", thanh: "Thánh Phẩm", tien: "Tiên Phẩm" };
const targetCounts = { phan: 5000, linh: 2500, hoang: 1200, huyen: 700, dia: 400, thien: 150, thanh: 49, tien: 1 };

function readFateJs(file) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/window\.FATE_DATA\s*=\s*(\[.*\]);\s*$/s);
  if (!match) throw new Error(`Cannot parse ${file}`);
  return JSON.parse(match[1]);
}
function readRelations(file) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return context.window.FATE_RELATIONSHIPS;
}
function counts(items) { return Object.fromEntries(gradeOrder.map((g) => [g, items.filter((f) => f.grade === g).length])); }
function hashId(id) { let h = 2166136261; for (const ch of id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function saveOwnedIds() {
  const owned = new Set();
  for (const file of fs.readdirSync(root).filter((name) => /save.*\.json$/i.test(name))) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
      const player = raw.state?.player || raw.player || {};
      for (const id of [...(player.fate?.equippedIds || []), ...(player.fate?.vaultIds || []), ...(player.fates || []), ...(raw.state?.fateInventory || [])]) owned.add(id);
    } catch (_) { /* Ignore unrelated invalid/sample saves. */ }
  }
  return owned;
}
function writeFateJs(file, items) {
  fs.writeFileSync(file, `/* Phase 3 catalog regrade · generated from controlled manifest */\nwindow.FATE_DATA = ${JSON.stringify(items)};\n`, "utf8");
}
function updateRelationTiers(relations, byId) {
  const tier = (id) => gradeOrder.indexOf(byId.get(id)?.grade) + 1;
  for (const combo of relations.combo_sets || []) for (const member of combo.members || []) {
    const id = member.id || member.fate_id;
    if (id && byId.has(id)) member.tier = tier(id);
  }
  for (const recipe of relations.fusion_recipes || []) {
    recipe.tier_from = Math.min(...(recipe.materials || []).map((m) => tier(m.id)).filter((x) => x > 0));
    const resultId = recipe.result?.id || recipe.result?.fate_id;
    if (resultId && byId.has(resultId)) recipe.tier_to = tier(resultId);
    for (const material of recipe.materials || []) if (material.id && byId.has(material.id)) material.tier = tier(material.id);
    if (resultId && byId.has(resultId)) recipe.result.tier = tier(resultId);
  }
  return relations;
}
function main() {
  const runtimeFile = path.join(root, "data/fate_data.js");
  const stagingFile = path.join(outDir, "fate_data_with_tags.json");
  const relationFile = path.join(root, "data/fate_relationships.js");
  const runtime = readFateJs(runtimeFile);
  const staging = JSON.parse(fs.readFileSync(stagingFile, "utf8"));
  const resonance = JSON.parse(fs.readFileSync(path.join(outDir, "resonance_effects_v2.json"), "utf8"));
  const owned = saveOwnedIds();
  const stagingById = new Map(staging.map((f) => [f.id, f]));
  const resonanceById = new Map(resonance.map((f) => [f.id, f]));
  const byId = new Map(runtime.map((f) => [f.id, f]));
  const before = counts(runtime);
  const delta = {};
  for (const grade of gradeOrder) delta[grade] = targetCounts[grade] - before[grade];
  const candidates = runtime.filter((f) => delta[f.grade] < 0 && !owned.has(f.id)).sort((a, b) => hashId(a.id) - hashId(b.id) || a.id.localeCompare(b.id));
  const manifest = [];
  let cursor = 0;
  for (const sourceGrade of gradeOrder) {
    const needed = -Math.min(0, delta[sourceGrade]);
    for (let i = 0; i < needed; i++) {
      const candidate = candidates[cursor++];
      if (!candidate || candidate.grade !== sourceGrade) continue;
      const destination = gradeOrder.find((g) => delta[g] > 0);
      if (!destination) throw new Error("No destination grade quota available");
      delta[sourceGrade] += 1; delta[destination] -= 1;
      manifest.push({ id: candidate.id, oldGrade: sourceGrade, newGrade: destination, reason: "phase3_target_distribution", affectedSystems: ["catalog", "relationship_tiers", "roll_indexes"], rollbackGrade: sourceGrade, owned: false });
    }
  }
  if (manifest.length !== 3000 || Object.values(delta).some((x) => x !== 0)) throw new Error(`Manifest quota mismatch: ${JSON.stringify({ manifest: manifest.length, delta })}`);
  const changes = new Map(manifest.map((m) => [m.id, m.newGrade]));
  const enriched = runtime.map((f) => {
    const next = { ...f, ...(stagingById.get(f.id) || {}) };
    if (changes.has(f.id)) next.grade = changes.get(f.id);
    next.gradeLabel = labels[next.grade];
    const resonanceEntry = resonanceById.get(f.id);
    if (resonanceEntry) next.resonanceEffect = resonanceEntry.resonanceEffect;
    return next;
  });
  const updatedRelations = updateRelationTiers(readRelations(relationFile), new Map(enriched.map((f) => [f.id, f])));
  fs.writeFileSync(path.join(outDir, "fate_regrade_manifest.json"), JSON.stringify({ migrationRunId: "phase3-20260908", sourceCatalogVersion: "v1", targetCatalogVersion: "v1-regraded", ownedIdsProtected: [...owned], targetCounts, changes: manifest }, null, 2), "utf8");
  fs.writeFileSync(path.join(outDir, "fate_regrade_report.json"), JSON.stringify({ migrationRunId: "phase3-20260908", before, after: counts(enriched), changed: manifest.length, protectedOwned: owned.size, stagingTagsMerged: enriched.filter((f) => Array.isArray(f.tags)).length, resonanceMerged: enriched.filter((f) => f.resonanceEffect).length }, null, 2), "utf8");
  writeFateJs(runtimeFile, enriched);
  fs.writeFileSync(stagingFile, JSON.stringify(enriched, null, 2), "utf8");
  fs.writeFileSync(relationFile, `/* Phase 3 relationship tier migration · generated from controlled manifest */\nwindow.FATE_RELATIONSHIPS = ${JSON.stringify(updatedRelations)};\n`, "utf8");
  console.log(JSON.stringify({ before, after: counts(enriched), changed: manifest.length, protectedOwned: owned.size }, null, 2));
}
main();
