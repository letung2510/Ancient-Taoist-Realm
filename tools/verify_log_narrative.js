"use strict";

const ANNOUNCEMENT_STRUCTURE_PATTERN = /^.{2,30}\s(phản ứng|thực hiện|kích hoạt|cập nhật|ghi nhận|xử lý|áp dụng)\s.{2,40}:/iu;
const TECHNICAL_TOKEN_PATTERN = /\b[A-Z][A-Z0-9_]{3,}\b|\b(depth|session|counter|cooldown|multiplier|internal|debug|raw|payload|field_name|undefined|null)\b|\bstate\b(?=\s*[.:=])/;

function lintNarrativeText(text, options = {}) {
  const value = String(text ?? "").trim();
  const issues = [];
  if (!value) issues.push("empty narrative");
  if (!options.statDisplay && ANNOUNCEMENT_STRUCTURE_PATTERN.test(value)) issues.push("announcement structure");
  if (!options.statDisplay && /:\s*(?:giảm|tăng|hết|mở|đóng)/iu.test(value)) issues.push("mechanics colon");
  if (!options.statDisplay && /[:：]/u.test(value)) issues.push("narrative colon");
  if (!options.debug && TECHNICAL_TOKEN_PATTERN.test(value)) issues.push("technical token");
  return { ok: issues.length === 0, issues, text: value };
}

function runSmokeTests() {
  const accepted = ["Mưa phù trăng rơi trên con đường; Tạ Hải Sinh kéo áo choàng chặt hơn.", "Mưa gõ lên mái hiên, người bước nhanh qua nền đất trơn.", "Áp lực giao tranh siết quanh người; người chưa thể rời bước."];
  const rejected = ["NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời.", "Người vẫn còn trên đường. TRAVEL_ALREADY_ACTIVE", "Tìm kiếm thất bại: Search Depth 2/session 1.", "Tông Môn thực hiện nghi lễ: mở cổng."];
  accepted.forEach((text) => { const result = lintNarrativeText(text); if (!result.ok) throw new Error(result.issues.join(", ")); });
  rejected.forEach((text) => { const result = lintNarrativeText(text); if (result.ok) throw new Error("Rejected narrative passed: " + text); });
  const { loadBrowserGame } = require("./verify_game");
  const engine = loadBrowserGame().window.GameEngine;
  const fallback = engine.formatPlayerLogText({}, { type: "warn", text: "INTERNAL_ROUTE_BLOCKED" });
  if (!fallback.includes("rào cản vô hình") || /INTERNAL_ROUTE_BLOCKED/.test(fallback)) throw new Error("unmapped internal code must use meaningful neutral prose");
  const mapped = engine.formatPlayerLogText({}, { type: "warn", text: "TRAVEL_ALREADY_ACTIVE" });
  if (!mapped.includes("đang trên đường") || /TRAVEL_ALREADY_ACTIVE/.test(mapped)) throw new Error("mapped internal code must use its narrative mapping");
  const sanitized = engine.formatPlayerLogText({}, { type: "warn", text: "internal payload field_name debug raw undefined null" });
  if (/internal|payload|field_name|debug|raw|undefined|null/i.test(sanitized) || !sanitized.trim()) throw new Error("technical producer fields must not leak into player log");
  const uiReason = engine.playerFacingReason("Dithe exclusion conflict.");
  if (/exclusion|canonical|namespace|validator/i.test(uiReason) || !uiReason.trim()) throw new Error("player-facing UI reason must not expose internal terminology");
  const mappedReason = engine.playerFacingReason("TRAVEL_ALREADY_ACTIVE");
  if (/TRAVEL_ALREADY_ACTIVE/.test(mappedReason) || mappedReason.length < 20) throw new Error("player-facing mapped reason must use narrative text");
  return true;
}

if (require.main === module) { runSmokeTests(); console.log("OK: novel-style narrative lint"); }
module.exports = { ANNOUNCEMENT_STRUCTURE_PATTERN, TECHNICAL_TOKEN_PATTERN, lintNarrativeText, runSmokeTests };
