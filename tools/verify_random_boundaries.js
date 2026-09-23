"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCES = [
  ...fs.readdirSync(path.join(ROOT, "js"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join("js", entry.name)),
  "gemini-code-1788430656294.js",
  "character_generator.js",
  "webgame/app.js"
];
const ALLOWED = [
  /const entropyRandom\s*=\s*\(\)\s*=>\s*Math\.random\(\)/,
  /const liveRandom\s*=\s*Math\.random;/,
  /const defaultRandom\s*=\s*\(\)\s*=>\s*Math\.random\(\)/
];
const violations = [];
SOURCES.forEach((file) => {
  fs.readFileSync(path.join(ROOT, file), "utf8").split(/\r?\n/).forEach((line, index) => {
    if (!line.includes("Math.random")) return;
    if (!ALLOWED.some((pattern) => pattern.test(line))) violations.push({ file, line: index + 1, text: line.trim() });
  });
});
assert.deepStrictEqual(violations, [], JSON.stringify(violations, null, 2));
console.log(`OK: random boundaries (${SOURCES.length} sources, ${ALLOWED.length} centralized allowances)`);
