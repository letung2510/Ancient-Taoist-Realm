"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const skip = new Set([".git", "node_modules", "archive-requirements"]);
const extensions = /\.md$/i;
const suspicious = /(?:Ãƒ.|Ã‚.|Ã¢.|Ã¡Â»|Ã¡Âº|Ã„.|Ã….|Ã†.|Ã.|â€”|Cá»|[A-Za-zÀ-ỹ](?:á»|áº)|(?:á»|áº)[^\s])/;
const write = process.argv.includes("--write");
const restoreEncoding = process.argv.includes("--restore-encoding");

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return skip.has(entry.name) ? [] : files(path.join(dir, entry.name));
    return extensions.test(entry.name) ? [path.join(dir, entry.name)] : [];
  });
}

function repairLine(line) {
  let current = line;
  for (let pass = 0; pass < 3 && suspicious.test(current); pass += 1) {
    const candidate = Buffer.from(current, "latin1").toString("utf8");
    if (candidate.includes("\uFFFD") || candidate === current) break;
    current = candidate;
  }
  return current;
}

let changed = 0;
const targetFiles = new Set([
  path.join(root, "requirement", "SYSTEM_LOGIC_CATALOG", "features", "04-world", "MAP_CANONICAL.md"),
  path.join(root, "requirement", "SYSTEM_LOGIC_CATALOG", "features", "04-world", "WORLD_SIMULATION_CANONICAL.md"),
  path.join(root, "requirement", "SYSTEM_LOGIC_CATALOG", "features", "07-ui", "UI_ACTION_LOG_CANONICAL.md")
]);

function fold(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function buildWordFrequency() {
  const frequency = new Map();
  for (const file of files(root).filter((file) => !targetFiles.has(file))) {
    const text = fs.readFileSync(file, "utf8");
    for (const word of text.match(/[A-Za-zÀ-ỹĐđ]{2,}/g) || []) {
      if (/Ã|Â|â|[\u0080-\u009f]/.test(word)) continue;
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  }
  return frequency;
}

function matchCorruptToken(token, frequency) {
  const corrupt = /\[encoding-loss\]|[\u0000-\u001f\u007f]/;
  if (!corrupt.test(token)) return token;
  const parts = token.split(/(\[encoding-loss\]|[\u0000-\u001f\u007f])/);
  const candidates = [];
  const pattern = "^" + parts.map((part) => corrupt.test(part) ? ".{1,2}" : fold(part).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("") + "$";
  const matcher = new RegExp(pattern);
  for (const [word, count] of frequency) {
    const foldedWord = fold(word);
    if (matcher.test(foldedWord)) candidates.push({ word, count, distance: foldedWord.length });
  }
  return candidates.sort((a, b) => b.count - a.count || a.distance - b.distance)[0]?.word || token;
}

if (restoreEncoding) {
  const frequency = buildWordFrequency();
  for (const file of targetFiles) {
    if (!fs.existsSync(file)) continue;
    const original = fs.readFileSync(file, "utf8");
    let unresolved = 0;
    const repaired = original.split(/(\r?\n)/).map((part) => {
      if (/\r?\n/.test(part)) return part;
      return part.replace(/\[encoding-loss\]/g, () => "").replace(/[\u0010\u0011\u0014]/g, (token) => ({ "\u0010": "Đ", "\u0011": "đ", "\u0014": "·" }[token])).replace(/[\u0000-\u000f\u0012\u0013\u0015-\u001f\u007f]/g, "").replace(/[A-Za-z\u00c0-\u024f\u1e00-\u1eff]*(?:\[encoding-loss\]|[\u0000-\u001f\u007f])+[A-Za-z\u00c0-\u024f\u1e00-\u1eff]*/g, (token) => {
        const result = token;
        if (result === token && /\[encoding-loss\]/.test(token)) unresolved += 1;
        return result;
      }).replace(/[\u0010]/g, "Đ").replace(/[\u0011]/g, "đ").replace(/[\u0014]/g, "·").replace(/[\u0000-\u000f\u0012\u0013\u0015-\u001f\u007f]/g, "");
    }).join("");
    if (unresolved) console.log(`unresolved ${path.relative(root, file)}: ${unresolved}`);
    if (repaired !== original) {
      changed += 1;
      if (write) fs.writeFileSync(file, repaired, "utf8");
      console.log(`${write ? "restore" : "would restore"}: ${path.relative(root, file)}`);
    }
  }
  console.log(`${write ? "Updated" : "Would update"} ${changed} canonical documents.`);
  process.exit(0);
}

for (const file of files(root)) {
  const original = fs.readFileSync(file, "utf8");
  const repaired = original.split(/(\r?\n)/).map((part) => /\r?\n/.test(part) ? part : repairLine(part)).join("");
  if (repaired === original) continue;
  changed += 1;
  console.log(`${write ? "repair" : "would repair"}: ${path.relative(root, file)}`);
  if (write) fs.writeFileSync(file, repaired, "utf8");
}
console.log(`${write ? "Updated" : "Would update"} ${changed} files.`);
if (!write && changed) process.exitCode = 2;
