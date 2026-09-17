"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCES = ["index.html", "js/engine.js", "js/expansion.js", "js/ui.js", "js/main.js", "styles.css", "data/data.js", "data/expansion_data.js", "data/npc_monsters.js", "data/world_data.js", "character_generator.js"];
const references = new Set();
SOURCES.forEach((file) => {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  [...source.matchAll(/(assets\/[^"'\s)]+)/g)].forEach((match) => references.add(match[1]));
});
const missing = [...references].filter((asset) => !fs.existsSync(path.join(ROOT, asset)));
assert.deepStrictEqual(missing, [], `missing asset references: ${missing.join(", ")}`);
assert(references.size >= 16, "asset gate must cover UI and character catalog illustrations");
console.log(`OK: asset references (${references.size} existing files)`);

module.exports = { references: [...references] };
