"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

function loadScript(file, window = {}) {
  const sandbox = { window };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), sandbox, { filename: file });
  return sandbox.window;
}

function auditWorldTopology(world) {
  const regions = world?.regions || [];
  const regionIds = new Set(regions.map((region) => region.id));
  assert(regions.length > 0, "world must contain regions");
  assert.strictEqual(regionIds.size, regions.length, "duplicate region id");

  const edges = [];
  const edgeKeys = new Set();
  for (const route of world.routes || []) {
    const from = Array.isArray(route) ? route[0] : route?.from;
    const to = Array.isArray(route) ? route[1] : route?.to;
    assert(from && to, `route is missing endpoints: ${JSON.stringify(route)}`);
    assert(regionIds.has(from) && regionIds.has(to), `route references unknown region: ${from} -> ${to}`);
    assert.notStrictEqual(from, to, `self-loop route: ${from}`);
    const key = [from, to].sort().join("::");
    assert(!edgeKeys.has(key), `duplicate undirected route: ${from} <-> ${to}`);
    edgeKeys.add(key);
    edges.push([from, to]);
    if (!Array.isArray(route)) {
      assert(route.oneWay === true || route.oneWay === false, `object route must declare oneWay: ${key}`);
    }
  }

  const seen = new Set([regions[0].id]);
  while (true) {
    const before = seen.size;
    edges.forEach(([from, to]) => {
      if (seen.has(from)) seen.add(to);
      if (seen.has(to)) seen.add(from);
    });
    if (seen.size === before) break;
  }
  assert.strictEqual(seen.size, regions.length, `disconnected regions: ${regions.filter((r) => !seen.has(r.id)).map((r) => r.id).join(", ")}`);
  return { regions: regions.length, routes: edges.length };
}

function auditRealmFallback(canonicalWindow) {
  const fallbackWindow = loadScript("data/data.js");
  const fallback = fallbackWindow.GameData?.REALMS || [];
  const canonical = canonicalWindow.CULTIVATION_DATA?.realms || [];
  const canonicalIds = new Set(canonical.map((realm) => realm.id));
  const fallbackIds = new Set(fallback.map((realm) => realm.id));
  const missing = [...canonicalIds].filter((id) => !fallbackIds.has(id));
  assert.strictEqual(missing.length, 0, `fallback realm coverage missing canonical ids: ${missing.join(", ")}`);
  return { canonical: canonical.length, fallback: fallback.length };
}

function auditLootReferences(npcData) {
  const entities = Object.values(npcData?.entities || {});
  const tables = npcData?.lootTables || {};
  const referenced = new Set(entities.map((entity) => entity.loot_table_id).filter(Boolean));
  const missing = entities.map((entity) => entity.loot_table_id).filter((id) => id && !tables[id]);
  const orphan = Object.keys(tables).filter((id) => !referenced.has(id));
  assert.deepStrictEqual(missing, [], `entity references missing loot table: ${missing.join(", ")}`);
  assert.deepStrictEqual(orphan, [], `orphan loot tables: ${orphan.join(", ")}`);
  return { entities: entities.length, tables: Object.keys(tables).length };
}

const worldWindow = loadScript("data/world_data.js");
const npcWindow = loadScript("data/npc_monsters.js");
const result = {
  topology: auditWorldTopology(worldWindow.FACTION_DATA.world),
  fallback: auditRealmFallback(worldWindow),
  loot: auditLootReferences(npcWindow.NPC_MONSTER_DATA)
};
console.log(`OK: world data audit (${result.topology.regions} regions, ${result.topology.routes} routes, ${result.fallback.canonical} canonical realms, ${result.loot.tables} loot tables)`);
