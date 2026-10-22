"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "index.html");
const MANIFEST_PATH = path.join(ROOT, "data", "manifest.json");
const START_MARKER = "<!-- runtime-scripts:start -->";
const END_MARKER = "<!-- runtime-scripts:end -->";

function readUtf8(filePath) { return fs.readFileSync(filePath, "utf8"); }
function writeUtf8(filePath, content) { fs.writeFileSync(filePath, content, "utf8"); }
function readJson(relativePath) { return JSON.parse(readUtf8(path.join(ROOT, relativePath))); }
function loadManifest() { return fs.existsSync(MANIFEST_PATH) ? JSON.parse(readUtf8(MANIFEST_PATH)) : null; }

function parseIndexScriptEntries(indexContent) {
  const pattern = /<script[^>]+src="([^"#]+)"[^>]*><\/script>/g;
  const entries = [];
  for (const match of indexContent.matchAll(pattern)) {
    const src = match[1];
    const queryIndex = src.indexOf("?");
    entries.push({ src: queryIndex >= 0 ? src.slice(0, queryIndex) : src, query: queryIndex >= 0 ? src.slice(queryIndex) : "", tagStart: match.index, tagEnd: match.index + match[0].length });
  }
  return entries;
}

function runtimeScriptsFromIndex() { return parseIndexScriptEntries(readUtf8(INDEX_PATH)).map((entry) => entry.src); }
function runtimeScripts() {
  const manifest = loadManifest();
  return manifest && Array.isArray(manifest.runtimeScripts) ? manifest.runtimeScripts.slice() : runtimeScriptsFromIndex();
}
function selectScripts(until = "js/expansion.js", exclude = []) {
  const all = runtimeScripts();
  const end = until === "all" ? all.length - 1 : all.indexOf(until);
  if (end < 0) throw new Error(`build_data: "${until}" is not a configured runtime script`);
  const skip = new Set(exclude);
  return all.slice(0, end + 1).filter((file) => !skip.has(file));
}

function validateWorldData(realms, factions) {
  const realmList = Array.isArray(realms) ? realms : realms.realms;
  if (!Array.isArray(realmList) || realmList.length < 10) throw new Error("canh_gioi_tien_hiep.json phải có ít nhất 10 cảnh giới.");
  const realmIds = new Set(realmList.map((realm) => realm.id));
  const legacyRealmIds = new Set(realmList.flatMap((realm) => realm.legacyIds || realm.legacy_ids || []));
  if (realmIds.size !== realmList.length) throw new Error("ID cảnh giới bị trùng.");
  const regions = factions.world?.regions || [];
  const regionIds = new Set(regions.map((region) => region.id));
  if (!regions.length || regionIds.size !== regions.length) throw new Error("Dữ liệu khu vực trống hoặc trùng ID.");
  const factionIds = new Set();
  (factions.factions || []).forEach((faction) => {
    if (factionIds.has(faction.id)) throw new Error(`ID thế lực bị trùng: ${faction.id}`);
    factionIds.add(faction.id);
    if (!regionIds.has(faction.region_id)) throw new Error(`Thế lực ${faction.id} trỏ tới khu vực không tồn tại.`);
    const realmKey = faction.highest_realm;
    const hasRealm = realmIds.has(realmKey) || legacyRealmIds.has(realmKey) || realmList.some((realm) => realm.id.startsWith(`${realmKey}_`));
    if (!hasRealm) throw new Error(`Thế lực ${faction.id} có cảnh giới không tồn tại.`);
  });
  (factions.world?.routes || []).forEach(([from, to]) => { if (!regionIds.has(from) || !regionIds.has(to)) throw new Error(`Tuyến đường không hợp lệ: ${from} - ${to}`); });
  if (!Array.isArray(factions.guilds) || factions.guilds.length !== 150) throw new Error("tu_tien_factions.json phải có đúng 150 môn phái.");
  factions.guilds.forEach((guild) => { if (!regionIds.has(guild.region_id)) throw new Error(`Môn phái ${guild.id} trỏ tới khu vực không tồn tại.`); });
}

function generateFateData(bundle) {
  const fates = readJson(bundle.sourceFiles[0]);
  const gradeLabels = {};
  const rows = fates.map((fate) => {
    gradeLabels[fate.grade] = fate.gradeLabel;
    const effectTuples = [];
    Object.keys(fate.effects || {}).forEach((key) => {
      effectTuples.push(key, fate.effects[key]);
    });
    const row = [fate.id, fate.name, fate.sign, fate.grade, fate.score, fate.desc, fate.tags, effectTuples, fate.element];
    if (Object.prototype.hasOwnProperty.call(fate, "resonanceEffect")) row.push(fate.resonanceEffect);
    return row;
  });
  return [
    "/* Phase 3 catalog regrade · compact columnar build */",
    "(function () {",
    "  \"use strict\";",
    `  const GRADE_LABELS = ${JSON.stringify(gradeLabels)};`,
    `  const ROWS = ${JSON.stringify(rows)};`,
    "  const out = new Array(ROWS.length);",
    "  for (let i = 0; i < ROWS.length; i += 1) {",
    "    const row = ROWS[i];",
    "    const tuples = row[7];",
    "    const effects = {};",
    "    for (let j = 0; j < tuples.length; j += 2) effects[tuples[j]] = tuples[j + 1];",
    "    const fate = { id: row[0], name: row[1], sign: row[2], grade: row[3], gradeLabel: GRADE_LABELS[row[3]], score: row[4], effects, desc: row[5], tags: row[6], element: row[8] };",
    "    if (row.length > 9) fate.resonanceEffect = row[9];",
    "    out[i] = fate;",
    "  }",
    "  window.FATE_DATA = out;",
    "})();",
    ""
  ].join("\n");
}

function generateFateRelationships(bundle) {
  const rel = readJson(bundle.sourceFiles[0]);
  const pairRows = (rel.pairwise_relationships || []).map((entry) => {
    if (entry.type === "TUONG_KHAC") return [entry.from, entry.to, null, entry.penaltyPct, entry.madnessDelta];
    return [entry.from, entry.to, entry.bonusPct];
  });
  const comboRows = (rel.combo_sets || []).map((entry) => [entry.combo_id, entry.name, entry.members, entry.required_count, entry.avg_tier, entry.effect, entry.isNghich, entry.bonusPct, entry.fortuneBonus, entry.madnessDelta]);
  const fusionRows = (rel.fusion_recipes || []).map((entry) => [entry.recipe_id, entry.tier_from, entry.tier_to, entry.materials, entry.result, entry.success_rate_pct, entry.fail_consequence, entry.note]);
  return [
    "/* Phase 3 relationship tier migration · compact columnar build */",
    "(function () {",
    "  \"use strict\";",
    `  const META = ${JSON.stringify({ generated_at: rel.generated_at, source: rel.source, total_fates: rel.total_fates, summary: rel.summary })};`,
    `  const PAIRS = ${JSON.stringify(pairRows)};`,
    `  const COMBOS = ${JSON.stringify(comboRows)};`,
    `  const FUSIONS = ${JSON.stringify(fusionRows)};`,
    "  const fateRows = Array.isArray(window.FATE_DATA) ? window.FATE_DATA : [];",
    "  const nameById = Object.create(null);",
    "  for (let i = 0; i < fateRows.length; i += 1) nameById[fateRows[i].id] = fateRows[i].name;",
    "  const pairs = new Array(PAIRS.length);",
    "  for (let i = 0; i < PAIRS.length; i += 1) {",
    "    const row = PAIRS[i];",
    "    const from = row[0];",
    "    const to = row[1];",
    "    const fromName = nameById[from] || from;",
    "    const toName = nameById[to] || to;",
    "    if (row[2] !== null) {",
    "      const bonusPct = row[2];",
    "      pairs[i] = { from, to, type: \"TUONG_SINH\", label: `${fromName} ⟷ ${toName}`, effect: `Sở hữu đồng thời: +${bonusPct}% hiệu quả toàn bộ hiệu ứng của cả 2 mệnh`, bonusPct };",
    "    } else {",
    "      const penaltyPct = row[3];",
    "      const madnessDelta = row[4];",
    "      pairs[i] = { from, to, type: \"TUONG_KHAC\", label: `${fromName} ✕ ${toName}`, effect: `Sở hữu đồng thời: -${penaltyPct}% hiệu quả cả 2 mệnh, +${madnessDelta} Điểm Điên Loạn`, penaltyPct, madnessDelta };",
    "    }",
    "  }",
    "  const comboSets = new Array(COMBOS.length);",
    "  for (let i = 0; i < COMBOS.length; i += 1) {",
    "    const row = COMBOS[i];",
    "    comboSets[i] = { combo_id: row[0], name: row[1], members: row[2], required_count: row[3], avg_tier: row[4], effect: row[5], isNghich: row[6], bonusPct: row[7], fortuneBonus: row[8], madnessDelta: row[9] };",
    "  }",
    "  const fusionRecipes = new Array(FUSIONS.length);",
    "  for (let i = 0; i < FUSIONS.length; i += 1) {",
    "    const row = FUSIONS[i];",
    "    fusionRecipes[i] = { recipe_id: row[0], tier_from: row[1], tier_to: row[2], materials: row[3], result: row[4], success_rate_pct: row[5], fail_consequence: row[6], note: row[7] };",
    "  }",
    "  window.FATE_RELATIONSHIPS = { generated_at: META.generated_at, source: META.source, total_fates: META.total_fates, summary: META.summary, pairwise_relationships: pairs, combo_sets: comboSets, fusion_recipes: fusionRecipes };",
    "})();",
    ""
  ].join("\n");
}

function generateWorldData(bundle) {
  const [realmSourcePath, factionSourcePath] = bundle.sourceFiles;
  const realmSource = readJson(realmSourcePath);
  const factions = readJson(factionSourcePath);
  validateWorldData(realmSource, factions);
  const realms = Array.isArray(realmSource) ? realmSource : realmSource.realms;
  const cultivationData = { schema_version: 1, source: bundle.runtimeSourcePath || realmSourcePath, realms };
  return [
    "/* AUTO-GENERATED by tools/build_data.js — do not edit directly. */",
    `window.CULTIVATION_DATA = ${JSON.stringify(cultivationData)};`,
    `window.FACTION_DATA = ${JSON.stringify(factions)};`,
    `window.GUILD_DATA = ${JSON.stringify({ tiers: factions.guild_tiers, guilds: factions.guilds })};`,
    ""
  ].join("\n");
}

function loadWindowGlobalFromScript(relativePath, globalName) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readUtf8(path.join(ROOT, relativePath)), sandbox, { filename: relativePath });
  return sandbox.window[globalName];
}

function projectToTemplate(source, template) {
  if (Array.isArray(template)) {
    const sourceArray = Array.isArray(source) ? source : [];
    return template.map((entry, index) => projectToTemplate(sourceArray[index], entry));
  }
  if (!template || typeof template !== "object") return source === undefined ? template : source;
  const result = {};
  Object.keys(template).forEach((key) => {
    result[key] = projectToTemplate(source ? source[key] : undefined, template[key]);
  });
  return result;
}

function generatePathFateRelations(bundle, scriptPath) {
  const source = readJson(bundle.sourceFiles[0]);
  const runtimeRaw = { hidden_fates: source.hidden_fates, tainted_intervention: source.tainted_intervention, paths: source.paths, path_titles: source.path_titles };
  const template = fs.existsSync(path.join(ROOT, scriptPath)) ? loadWindowGlobalFromScript(scriptPath, "PATH_FATE_RELATIONS") : null;
  const runtime = template ? projectToTemplate(runtimeRaw, template) : runtimeRaw;
  return [
    "/* Runtime bridge for data/path_fate_relations.json. */",
    "(function () {",
    "  \"use strict\";",
    `  window.PATH_FATE_RELATIONS = ${JSON.stringify(runtime, null, 2).split("\n").join("\n  ")};`,
    "})();",
    ""
  ].join("\n");
}

function generatedContentFor(scriptPath, bundle) {
  if (scriptPath === "data/fate_data.js") return generateFateData(bundle);
  if (scriptPath === "data/fate_relationships.js") return generateFateRelationships(bundle);
  if (scriptPath === "data/world_data.js") return generateWorldData(bundle);
  if (scriptPath === "data/path_fate_relations.js") return generatePathFateRelations(bundle, scriptPath);
  throw new Error(`No generator configured for ${scriptPath}`);
}

function renderRuntimeScriptBlock(scripts, existingQueryMap) {
  const scriptLines = scripts.map((script) => `  <script src="${script}${existingQueryMap.get(script) || ""}"></script>`);
  return [START_MARKER, ...scriptLines, END_MARKER].join("\n");
}

function rewriteIndexRuntimeScripts(indexContent, scripts) {
  const entries = parseIndexScriptEntries(indexContent);
  const queryMap = new Map(entries.map((entry) => [entry.src, entry.query]));
  const renderedBlock = renderRuntimeScriptBlock(scripts, queryMap);
  if (indexContent.includes(START_MARKER) && indexContent.includes(END_MARKER)) return indexContent.replace(new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`), renderedBlock);
  const firstEntry = entries.find((entry) => entry.src === scripts[0]);
  const lastEntry = [...entries].reverse().find((entry) => entry.src === scripts[scripts.length - 1]);
  if (!firstEntry || !lastEntry || firstEntry.tagStart > lastEntry.tagStart) throw new Error("Cannot locate runtime script block in index.html");
  return `${indexContent.slice(0, firstEntry.tagStart)}${renderedBlock}${indexContent.slice(lastEntry.tagEnd)}`;
}

function runBuild({ check = false, printScriptsOnly = false } = {}) {
  const manifest = loadManifest();
  const scripts = runtimeScripts();
  if (printScriptsOnly) {
    process.stdout.write(`${scripts.join("\n")}\n`);
    return 0;
  }
  if (!manifest || !manifest.bundles) throw new Error("Missing data/manifest.json or bundles metadata.");
  const diffs = [];
  Object.entries(manifest.bundles).filter(([, bundle]) => bundle && bundle.generated).forEach(([scriptPath, bundle]) => {
    const outputPath = path.join(ROOT, scriptPath);
    const nextContent = generatedContentFor(scriptPath, bundle);
    const currentContent = fs.existsSync(outputPath) ? readUtf8(outputPath) : "";
    if (currentContent !== nextContent) {
      diffs.push(scriptPath);
      if (!check) writeUtf8(outputPath, nextContent);
    }
  });
  const currentIndex = readUtf8(INDEX_PATH);
  const nextIndex = rewriteIndexRuntimeScripts(currentIndex, scripts);
  if (currentIndex !== nextIndex) {
    diffs.push("index.html#runtime-scripts");
    if (!check) writeUtf8(INDEX_PATH, nextIndex);
  }
  if (check && diffs.length) {
    process.stderr.write(`Out of date generated files: ${diffs.join(", ")}\n`);
    return 1;
  }
  if (!check) process.stdout.write(diffs.length ? `Updated: ${diffs.join(", ")}\n` : "No changes.\n");
  return 0;
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  process.exitCode = runBuild({ check: args.has("--check"), printScriptsOnly: args.has("--print-scripts") });
}

module.exports = { runtimeScripts, selectScripts, runBuild, rewriteIndexRuntimeScripts };