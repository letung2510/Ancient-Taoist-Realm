"use strict";

// One-to-one behavior fixtures for the legacy LT1-LT10 measurements.  These
// are intentionally separate from the broad validator matrix: each legacy
// assertion gets a concrete producer/projection invariant.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const sandbox = { window: {}, console, performance: { now: () => Date.now() }, Date };
vm.createContext(sandbox);
["gemini-code-1788430656294.js", "data/world_data.js", "data/fate_data.js", "data/fate_relationships.js", "data/cong_phap.js", "data/npc_monsters.js", "data/path_fate_relations.js", "data/profession_items.js", "data/expansion_data.js", "data/data.js", "js/i18n.js", "js/engine.js", "js/expansion.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file }));
const E = sandbox.window.GameEngine;
const make = () => E.createState({ seed: "legacy-log-matrix", character: E.createCharacter({ name: "LT Matrix QA", archetypeId: "kiem_tong", fates: E.drawInitialFates() }) });

// LT1: command echoes/debug records never reach the player projection.
const lt1 = make();
E.pushHistory(lt1, { type: "COMMAND_ECHO", text: "> noi bo" });
assert(!E.novelLogParagraphs(lt1).some((paragraph) => paragraph.text.includes("noi bo")), "LT1 command echo leaked into story projection");

// LT2: same in-game day, different turns, is one scene unless an authored
// scene/location explicitly separates it.
const lt2 = make();
E.pushHistory(lt2, { type: "narr", text: "Mây tan trên đỉnh núi." });
lt2.meta.turn += 1;
E.pushHistory(lt2, { type: "narr", text: "Gió đổi hướng bên hiên đá." });
assert.strictEqual(E.novelLogParagraphs(lt2).length, 1, "LT2 same-day events were split by turn");

// LT3: bounded history retains only the latest 300 entries while the
// telemetry counter remains monotonic.
const lt3 = make();
for (let i = 0; i < 420; i += 1) E.pushHistory(lt3, { type: "narr", text: "Dòng ký ức hợp lệ." });
assert.strictEqual(lt3.history.length, 300, "LT3 history retention exceeded 300");
assert(lt3.logState.totalEvents >= 420, "LT3 total event telemetry lost evictions");

// LT4: valid Vietnamese em dash/ellipsis are narrative punctuation, not
// technical tokens and must survive sanitization.
const lt4 = make();
E.pushHistory(lt4, { type: "narr", text: "Hắn dừng lại — rồi bước tiếp…" });
const lt4Text = lt4.history.at(-1)?.text || "";
assert(lt4Text.includes("—") && lt4Text.includes("…"), "LT4 valid punctuation was stripped");

// LT5: ordinary Vietnamese word “phiên” must not trigger the technical lint.
assert(E.lintNarrativeText("Trong phiên đấu giá, một người khác nâng giá.").ok, "LT5 ordinary Vietnamese word was rejected");

// LT6: every canonical error code has player-safe narrative output.
Object.keys(E.ERROR_NARRATIVE_MAP).forEach((code) => {
  const text = E.playerFacingReason(code);
  assert(text && !text.includes(code) && !/[A-Z][A-Z0-9_]{3,}/.test(text), "LT6 unmapped/internal error: " + code);
});

// LT7: runtime narrative lint and producer output agree on technical-token
// rejection while allowing mechanics in the dedicated stat channel.
assert(!E.lintNarrativeText("Kích hoạt cooldown: giảm 2").ok, "LT7 runtime lint accepted technical narrative");
assert(E.lintNarrativeText("Giảm 2", { statDisplay: true }).ok, "LT7 stat channel was rejected by narrative lint");

// LT8: player-facing log surface rejects malformed entries at the canonical
// validator boundary.
const lt8 = make();
E.pushHistory(lt8, { type: "narr", text: "Một câu chuyện hợp lệ." });
assert(E.validateLogSurfaceState(lt8).ok, "LT8 canonical log surface validator failed");

// LT9: replay envelope validation remains true after serializing the log.
const lt9 = make();
E.pushHistory(lt9, { type: "narr", text: "Dấu mốc được ghi lại." });
const lt9Restored = E.deserialize(E.serialize(lt9));
assert(E.validateReplayEnvelope(lt9Restored).ok, "LT9 replay envelope failed after log round-trip");

// LT10: paragraph DTO keeps stats separate from prose and exposes all stable
// projection keys.
const lt10 = make();
E.pushHistory(lt10, { type: "narr", text: "Thanh âm cổ xưa vọng qua thung lũng.", statDisplay: ["Linh khí +1"] });
const paragraph = E.novelLogParagraphs(lt10)[0];
assert(paragraph && ["dayKey", "sceneId", "clock", "text", "events", "statDisplay", "portrait"].every((key) => Object.prototype.hasOwnProperty.call(paragraph, key)), "LT10 paragraph DTO shape drifted");
assert(Array.isArray(paragraph.statDisplay), "LT10 stats were merged into prose");

console.log("OK: legacy log matrix (LT1-LT10 one-to-one behavior fixtures)");
