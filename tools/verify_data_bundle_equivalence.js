"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { loadRuntime } = require("./lib/load_runtime");

const ROOT = path.join(__dirname, "..");
const BASELINE_PATH = path.join(__dirname, "fixtures", "data_baseline.json");

function sha256Json(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function pickExisting(window, candidates, label) {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(window, key)) return { key, value: window[key] };
  }
  throw new Error(`Missing runtime global for ${label}: ${candidates.join(", ")}`);
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function itemGeneratorConstants(itemGenerator) {
  if (!itemGenerator || typeof itemGenerator !== "object") return null;
  const result = {};
  Object.keys(itemGenerator).forEach((key) => {
    const value = itemGenerator[key];
    if (typeof value === "function" || value === undefined) return;
    result[key] = jsonClone(value);
  });
  return result;
}

function snapshotRuntimeData() {
  const { window } = loadRuntime({ sandboxStyle: "window" });
  const congPhap = pickExisting(window, ["CONG_PHAP_DATA", "CONG_PHAP", "TECHNIQUE_DATA"], "cong_phap");
  const expansion = pickExisting(window, ["EXPANSION_DATA", "EXPANSION", "GAME_EXPANSION_DATA"], "expansion");

  const datasets = {
    FATE_DATA: jsonClone(window.FATE_DATA),
    FATE_RELATIONSHIPS: jsonClone(window.FATE_RELATIONSHIPS),
    [congPhap.key]: jsonClone(congPhap.value),
    PATH_FATE_RELATIONS: jsonClone(window.PATH_FATE_RELATIONS),
    PROFESSION_ITEMS: jsonClone(window.PROFESSION_ITEMS),
    PROFESSION_ITEMS_SCHEMA_VERSION: jsonClone(window.PROFESSION_ITEMS_SCHEMA_VERSION),
    [expansion.key]: jsonClone(expansion.value),
    FACTION_DATA: jsonClone(window.FACTION_DATA),
    CULTIVATION_DATA: jsonClone(window.CULTIVATION_DATA),
    GUILD_DATA: jsonClone(window.GUILD_DATA),
    NPC_MONSTER_DATA: jsonClone(window.NPC_MONSTER_DATA),
    ItemGeneratorConstants: itemGeneratorConstants(window.ItemGenerator)
  };

  const hashes = {};
  Object.keys(datasets).forEach((key) => {
    hashes[key] = sha256Json(datasets[key]);
  });

  return {
    scripts: [
      "data/fate_data.js",
      "data/fate_relationships.js",
      "data/cong_phap.js",
      "data/path_fate_relations.js",
      "data/profession_items.js",
      "data/expansion_data.js",
      "data/world_data.js",
      "data/npc_monsters.js",
      "gemini-code-1788430656294.js"
    ],
    globals: Object.keys(datasets),
    hashes,
    combinedHash: sha256Json(hashes)
  };
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeBaseline() {
  const snapshot = snapshotRuntimeData();
  ensureDir(BASELINE_PATH);
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote baseline: ${path.relative(ROOT, BASELINE_PATH)}`);
  return snapshot;
}

function verifyBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Missing baseline fixture: ${path.relative(ROOT, BASELINE_PATH)}`);
  }
  const expected = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const actual = snapshotRuntimeData();
  const mismatches = [];
  const baselineHashes = expected.hashes || {};
  const actualHashes = actual.hashes || {};
  const keys = Array.from(new Set([...Object.keys(baselineHashes), ...Object.keys(actualHashes)])).sort();
  keys.forEach((key) => {
    if (baselineHashes[key] !== actualHashes[key]) {
      mismatches.push({ key, expected: baselineHashes[key], actual: actualHashes[key] });
    }
  });
  if (mismatches.length) {
    console.error("Data bundle equivalence mismatch detected:");
    mismatches.forEach((entry) => {
      console.error(`- ${entry.key}`);
      console.error(`  expected: ${entry.expected}`);
      console.error(`  actual:   ${entry.actual}`);
    });
    process.exitCode = 1;
    return;
  }
  console.log(`OK: data bundle equivalence (${actual.combinedHash})`);
}

if (require.main === module) {
  if (process.argv.includes("--write-baseline")) writeBaseline();
  else verifyBaseline();
}

module.exports = { snapshotRuntimeData, verifyBaseline, writeBaseline };