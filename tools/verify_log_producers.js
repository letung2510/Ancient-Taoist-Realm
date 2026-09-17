"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadBrowserGame } = require("./verify_game");
const { lintNarrativeText } = require("./verify_log_narrative");

const ROOT = path.join(__dirname, "..");
const SOURCES = fs.readdirSync(path.join(ROOT, "js"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => path.join("js", file));
// Do not use the generic uppercase-word rule here: Vietnamese narrative and
// proper nouns legitimately contain title-case tokens.  This audit is for
// known implementation vocabulary that must never reach player-facing prose.
const TECHNICAL = /\b(?:TRAVEL_[A-Z0-9_]+|INTERNAL_[A-Z0-9_]+|SEARCH_[A-Z0-9_]+|Depth|Search|session|counter|cooldown|multiplier|Offline|state)\b/;

function collectLiteralCandidates(source, file) {
  const candidates = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!/(?:pushHistory|history|emitGameEvent)/.test(line) || !/(?:text\s*:|history\s*\(|emitGameEvent\s*\()/.test(line)) return;
    const match = line.match(/text:\s*(['"])((?:\\.|(?!\1).)*)\1\s*[,}]/);
    const historyMatch = line.match(/history\s*\(\s*state\s*,\s*['"](?:sys|warn|narr)['"]\s*,\s*(['"])((?:\\.|(?!\1).)*)\1\s*\)/);
    const value = (match?.[2] || historyMatch?.[2] || "").replace(/\\([\\"'])/g, "$1").trim();
    // A concatenated producer is audited at runtime by the matrix; this static
    // pass only claims complete literal messages, not partial string fragments.
    if (value.length >= 8) candidates.push({ file, line: index + 1, value });
  });
  return candidates;
}

function runProducerAudit() {
  const sandbox = loadBrowserGame();
  const E = sandbox.window.GameEngine;
  const state = E.createState({ character: E.createCharacter({ name: "Log Producer QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });
  const candidates = SOURCES.flatMap((file) => collectLiteralCandidates(fs.readFileSync(path.join(ROOT, file), "utf8"), file));
  const failures = [];
  candidates.forEach((candidate) => {
    const formatted = E.formatPlayerLogText(state, { type: "sys", text: candidate.value });
    const lint = lintNarrativeText(formatted);
    if (!lint.ok || TECHNICAL.test(formatted)) failures.push({ ...candidate, formatted, issues: lint.issues });
  });
  assert.deepStrictEqual(failures, [], JSON.stringify(failures.slice(0, 10), null, 2));
  return { candidates: candidates.length, checked: candidates.length, passed: candidates.length };
}

if (require.main === module) {
  const result = runProducerAudit();
  console.log(`OK: raw log producer audit (${result.passed}/${result.checked})`);
}

module.exports = { collectLiteralCandidates, runProducerAudit };
