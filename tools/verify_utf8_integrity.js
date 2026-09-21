"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const roots = ["js", "data", "tools", "requirement", "index.html"];
const badPattern = /(?:\u00c3[\u0080-\u00ff]|\u00c2[\u00ba\u00bb]|\u00e1[\u00bb\u00ba]|\u00e2(?:\u20ac|\u201a|\u201e|\u2026|\u2020|\u2021)|\u00ef\u00bf\u00bd|\uFFFD)/g;
const skipped = new Set([".git", "node_modules", ".commandcode", "fate_system_update", "webgame", "repair_mojibake.js", "repair_utf8_all.js", "verify_utf8_integrity.js", "verify_dichi_deep.js", "verify_expansion_log_matrix.js"]);
function scan(target, results) {
  const full = path.join(ROOT, target);
  if (fs.statSync(full).isFile()) { scanFile(full, results); return; }
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const item = path.join(full, entry.name);
    if (entry.isDirectory()) scan(path.relative(ROOT, item), results);
    else if (/\.(js|json|md|html|css)$/i.test(entry.name)) scanFile(item, results);
  }
}
function scanFile(file, results) {
  if (path.basename(file) === "UI_ACTION_LOG_CANONICAL.md") return;
  const text = fs.readFileSync(file, "utf8");
  const replacement = (text.match(/\uFFFD/g) || []).length;
  const mojibake = (text.match(badPattern) || []).length;
  if (replacement || mojibake) results.push({ file: path.relative(ROOT, file), replacement, mojibake });
}
const results = [];
roots.forEach((root) => scan(root, results));
if (results.length) { console.error(JSON.stringify(results, null, 2)); process.exitCode = 1; }
else console.log("OK: UTF-8 integrity audit (no replacement chars or mojibake markers)");
