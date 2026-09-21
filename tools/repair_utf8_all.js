"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGETS = ["js", "data", "tools", "requirement", "index.html"];
const EXTENSIONS = /\.(js|json|md|html|css)$/i;
const SKIP = new Set(["node_modules", ".git", ".commandcode", "fate_system_update", "webgame"]);
const MOJIBAKE = /(?:Ã.|Â.|â.|á»|áº|Ä.|Å.|Æ.|Ð.|—|—)/g;
const CP1252 = { "€": "\x80", "‚": "\x82", "ƒ": "\x83", "„": "\x84", "…": "\x85", "†": "\x86", "‡": "\x87", "ˆ": "\x88", "‰": "\x89", "Š": "\x8a", "‹": "\x8b", "Œ": "\x8c", "Ž": "\x8e", "‘": "\x91", "’": "\x92", "“": "\x93", "”": "\x94", "•": "\x95", "–": "\x96", "—": "\x97", "˜": "\x98", "™": "\x99", "š": "\x9a", "›": "\x9b", "œ": "\x9c", "ž": "\x9e", "Ÿ": "\x9f" };

function score(value) { return (String(value).match(MOJIBAKE) || []).length + (String(value).match(/[\uFFFD\u0080-\u009f]/g) || []).length * 2; }
function repairLine(line) {
  let current = line;
  for (let pass = 0; pass < 3; pass += 1) {
    const prepared = [...current].map((char) => CP1252[char] || char).join("");
    let candidate;
    try { candidate = Buffer.from(prepared, "latin1").toString("utf8"); } catch (_) { break; }
    if (candidate.includes("\uFFFD") || score(candidate) >= score(current)) break;
    current = candidate;
  }
  current = current.replace(/[\u0080-\u009f]/g, (char) => ({ "\x85": "…", "\x86": "†", "\x87": "‡", "\x91": "‘", "\x92": "’", "\x93": "“", "\x94": "”", "\x95": "•", "\x96": "–", "\x97": "—", "\x98": "˜", "\x99": "™", "\x9a": "š", "\x9b": "›", "\x9c": "œ", "\x9e": "ž", "\x9f": "Ÿ" }[char] || char));
  // Known legacy producer text that was persisted with a broken code page.
  if (current.includes("existingOutpost") && current.includes("donatedToFactionId")) current = current.replace(/reason:\s*"[^"]*"/, 'reason: "Trạm này đã được dâng cho thế lực hoặc không còn thuộc quyền ngươi chơi."');
  return current.replace(/—|\uFFFD/g, "—");
}
function collect(target, files = []) {
  const full = path.join(ROOT, target);
  if (fs.statSync(full).isFile()) return [full];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const item = path.join(full, entry.name);
    if (entry.isDirectory()) collect(path.relative(ROOT, item), files);
    else if (EXTENSIONS.test(entry.name)) files.push(item);
  }
  return files;
}
const write = process.argv.includes("--write");
const files = TARGETS.flatMap((target) => collect(target));
let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const repaired = original.split(/(\r?\n)/).map((part) => /\r?\n/.test(part) ? part : repairLine(part)).join("");
  if (repaired === original) continue;
  changed += 1;
  console.log(`${write ? "repair" : "would repair"}: ${path.relative(ROOT, file)}`);
  if (write) fs.writeFileSync(file, repaired, "utf8");
}
console.log(`${write ? "Updated" : "Would update"} ${changed} files.`);
if (!write && changed) process.exitCode = 2;
