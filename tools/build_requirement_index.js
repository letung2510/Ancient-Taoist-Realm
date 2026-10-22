"use strict";
// Generates requirement/INDEX.md: file -> section line ranges and rule-ID counts.
// Usage: node tools/build_requirement_index.js [--check]
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REQ = path.join(ROOT, "requirement");
const OUT = path.join(REQ, "INDEX.md");
// Historical snapshot: listed but not section-indexed to keep the index small.
const SUMMARY_ONLY = new Set(["AUDIT_CANONICAL.md"]);
const RULE_ID = /^([A-Z][A-Z0-9]{1,}(?:-[A-Z0-9]+)*-\d{2,4}[A-Za-z]?)\b/;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === "archive-requirements" ? [] : walk(p);
  return e.name.endsWith(".md") && p !== OUT ? [p] : [];
});

const rel = (p) => path.relative(REQ, p).split(path.sep).join("/");
const clean = (s) => s.replace(/[`*]/g, "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const slug = (s) => s.toLowerCase().replace(/[`*]/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s/g, "-");

const files = walk(REQ).sort((a, b) => rel(a).localeCompare(rel(b)));
const docs = files.map((file) => {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const sections = [];
  const rules = [];
  let fence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) return;
    const h = /^(#{2,3})\s+(.*)$/.exec(line);
    if (h) {
      const text = h[2].trim();
      if (h[1] === "##") sections.push({ text, start: i + 1 });
      const id = RULE_ID.exec(clean(text));
      if (id) rules.push({ id: id[1], line: i + 1, text, anchor: slug(text) });
      return;
    }
    const row = /^\|\s*\**`?([A-Z][A-Z0-9]{1,}(?:-[A-Z0-9]+)*-\d{2,4}[A-Za-z]?)`?\**\s*\|/.exec(line);
    if (row) rules.push({ id: row[1], line: i + 1, text: "" });
  });
  sections.forEach((s, i) => { s.end = i + 1 < sections.length ? sections[i + 1].start - 1 : lines.length; });
  return { file, rel: rel(file), lines: lines.length, kb: Math.round(fs.statSync(file).size / 1024), sections, rules };
});

const out = [];
out.push("# Requirement Index (generated)", "");
out.push("> Sinh bởi `node tools/build_requirement_index.js`. Không sửa tay; chạy lại sau mỗi lần sửa `requirement/**/*.md`.");
out.push("> Cách dùng: grep file này theo từ khóa/rule ID → lấy `file` + khoảng dòng `Lx–Ly` → chỉ đọc khoảng đó.", "");
out.push("## Files", "", "| File | KB | Dòng | Mục | Rule ID |", "|---|---:|---:|---:|---:|");
docs.forEach((d) => out.push(`| [${d.rel}](${d.rel}) | ${d.kb} | ${d.lines} | ${d.sections.length} | ${d.rules.length} |`));

const allRules = docs.filter((d) => !SUMMARY_ONLY.has(path.basename(d.file)))
  .flatMap((d) => d.rules.map((r) => ({ ...r, rel: d.rel })));
// Rule IDs are not listed individually: grep requirement/features for an ID gives file:line directly.

out.push("", "## Sections");
docs.filter((d) => !SUMMARY_ONLY.has(path.basename(d.file)) && d.sections.length).forEach((d) => {
  out.push("", `### ${d.rel}`, "");
  d.sections.forEach((s) => out.push(`- L${s.start}–${s.end} ${clean(s.text)}`));
});
const text = out.join("\n") + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== text) {
    console.error("requirement/INDEX.md is stale: run node tools/build_requirement_index.js");
    process.exit(1);
  }
  console.log(`OK: requirement index is current (${docs.length} files, ${allRules.length} rule IDs)`);
} else {
  fs.writeFileSync(OUT, text, "utf8");
  console.log(`Wrote requirement/INDEX.md (${docs.length} files, ${allRules.length} rule IDs, ${Math.round(Buffer.byteLength(text) / 1024)} KB)`);
}
