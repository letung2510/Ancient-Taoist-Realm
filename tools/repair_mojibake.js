const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXTENSIONS = new Set([".js", ".md", ".html", ".css", ".json"]);
const EXCLUDED = new Set(["index.offline.html", "UTF8_PLAYER_TEXT_INTEGRITY_2026-09-18.md"]);
const MARKERS = /(?:Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]|â[\u0080-\u00ff]|á[»º][\u0080-\u00ff]?|Ä[\u0080-\u00ff]|Æ[\u0080-\u00ff]|ð[\u0080-\u00ff])/;

function collect(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, files);
    else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase()) && !EXCLUDED.has(entry.name) && entry.name !== "repair_mojibake.js") files.push(full);
  }
  return files;
}

function repairMojibakeRuns(input) {
  // Some old saves passed Windows-1252 punctuation through the same broken
  // path, so characters such as / are the visible form of bytes 0x99/0x87.
  // Normalize those bytes before the single Latin-1 -> UTF-8 repair pass.
  const cp1252Bytes = {
    "\u20ac": "\x80", "\u201a": "\x82", "\u0192": "\x83", "\u201e": "\x84",
    "\u2026": "\x85", "\u2020": "\x86", "\u2021": "\x87", "\u02c6": "\x88",
    "\u2030": "\x89", "\u0160": "\x8a", "\u2039": "\x8b", "\u0152": "\x8c",
    "\u017d": "\x8e", "\u2018": "\x91", "\u2019": "\x92", "\u201c": "\x93",
    "\u201d": "\x94", "\u2022": "\x95", "\u2013": "\x96", "\u2014": "\x97",
    "\u02dc": "\x98", "\u2122": "\x99", "\u0161": "\x9a", "\u203a": "\x9b",
    "\u0153": "\x9c", "\u017e": "\x9e", "\u0178": "\x9f"
  };
  return input.replace(/[\u0000-\u00ff\u2018-\u201f\u2020-\u2022\u2030\u2039\u203a\u20ac\u2122]+/g, (rawRun) => {
    if (!MARKERS.test(rawRun)) return rawRun;
    const run = rawRun.replace(/[\u0080-\u{ffff}]/gu, (char) => cp1252Bytes[char] || char);
    if (run.includes("test(run)")) return run;
    if (!MARKERS.test(run)) return run;
    const decoded = Buffer.from(run, "latin1").toString("utf8");
    return decoded.includes("\uFFFD") ? run : decoded;
  });
}

const write = process.argv.includes("--write");
const files = collect(ROOT);
let changed = 0;
let replacements = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const repaired = repairMojibakeRuns(original);
  if (repaired === original) continue;
  changed += 1;
  replacements += [...original.matchAll(new RegExp(MARKERS.source, "g"))].length;
  console.log(`${write ? "repair" : "would repair"}: ${path.relative(ROOT, file)}`);
  if (write) fs.writeFileSync(file, repaired, "utf8");
}
console.log(`${write ? "Updated" : "Would update"} ${changed} files; detected ${replacements} mojibake marker runs.`);

if (!write && changed) process.exitCode = 2;
