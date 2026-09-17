"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const html = read("index.html");
const ui = read("js/ui.js");
const main = read("js/main.js");
const expansion = read("js/expansion.js");

const scriptOrder = ["js/engine.js", "js/expansion.js", "js/ui.js", "js/main.js"];
let last = -1;
scriptOrder.forEach((src) => {
  const position = html.indexOf(src);
  assert(position > last, `script order missing or invalid: ${src}`);
  last = position;
});

[
  "renderStoryWindow", "renderWorld", "renderMap", "renderWorldMap",
  "renderLocalMap", "renderOddities", "renderProfessionSection",
  "renderFactionBulletin", "renderMemory"
].forEach((name) => assert(ui.includes(`function ${name}`), `UI renderer missing: ${name}`));

[
  "mapInfluenceSnapshot", "mapFogState", "mapCompletion", "activity: \"travel\"",
  "worldModifierPreview", "weatherSeverity", "weatherHistory",
  "node-history", "Công Trình Tông Môn", "Nghề chính", "Nghề Ẩn",
  "Dị Thể", "Con Đường"
].forEach((token) => assert(ui.includes(token), `UI contract token missing: ${token}`));
assert(ui.includes("renderStructureOwnershipPolicy"), "World UI must expose structure ownership policy");
assert(ui.includes("structureManagerDecision"), "World UI must consume canonical structure permission resolver");

[
  "data-expansion-command", "data-map-faction", "data-map-guild",
  "saveGame", "renderAfterTurn", "renderStoryWindow"
].forEach((token) => assert(main.includes(token), `UI interaction contract missing: ${token}`));
assert(html.includes("data-tab=\"world\""), "World tab missing from HTML");
assert(html.includes("data-tab=\"oddities\""), "Dị Thể tab missing from HTML");

assert(ui.includes("novelLogParagraphs"), "log surface must consume grouped novel paragraphs");
assert(!ui.includes("Dị Chí"), "legacy Dị Chí label must not remain in UI source");
assert(["discovered", "verified", "collected", "rewarded"].every((status) => ui.includes(status)), "oddities UI must expose all discovery lifecycle states");
assert((main.match(/\$\("tab-content"\)\.addEventListener\("click"/g) || []).length === 1, "tab-content click delegation must be bound once");
assert(main.includes("enqueueAction"), "UI actions must pass through the serialized action queue");
assert(read("js/engine.js").includes("pendingDepartureGuard"), "action priority guard must be present at engine boundary");

const renderedCommands = [...ui.matchAll(/expansionButton\("([a-z0-9_]+)"/g)].map((match) => match[1]);
assert(renderedCommands.length > 0, "UI must declare at least one expansion command");
const commandTable = expansion.match(/const table = \{([\s\S]*?)\n    \};/);
assert(commandTable, "runtime expansion command table must be discoverable");
const runtimeCommands = new Set([...commandTable[1].matchAll(/(?:^|,\s*)([a-z0-9_]+):\s*\(\)/g)].map((match) => match[1]));
renderedCommands.forEach((command) => assert(runtimeCommands.has(command), `UI command has no runtime handler: ${command}`));
console.log("OK: UI surface contract (tabs, map/world, progression and novel log)");
