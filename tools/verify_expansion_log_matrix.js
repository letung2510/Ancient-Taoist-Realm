const assert = require("assert");
const { lintNarrativeText } = require("./verify_log_narrative");

// Runtime contract: these are the player-facing beats emitted by expansion
// actions. The assertion is intentionally made after the real formatter, not
// against the source strings, because pushHistory is the production boundary.
const CASES = [
  ["act_exp_divine", "Xem Qu—: M—t b—ng ng——i —ng b—n b— v—c."],
  ["act_exp_scout", "— D— Th— ph—t hi—n d—u ——ng t—i Ph——ng th— Trung V—c."],
  ["act_exp_companion_skill", "D— Th— d—ng Huy—t Tr—o, g—y 7 s—t th——ng."],
  ["act_exp_capture", "— — b—t s—ng y—u th—."],
  ["act_exp_companion_mutation_cure", "& — thanh t—y D— Bi—n cho Thanh Vi."],
  ["act_exp_companion_mutation_accept", "— Ch—p nh—n D— Bi—n: Thanh Vi, ch— nh—n T— Nhi—m +5."],
  ["act_exp_companion_mutation_release", "— — ph—ng sinh Thanh Vi — C—ng —c +3."],
  ["act_exp_companion_revive", "Thanh Vi tr— l—i t— ranh gi—i t— sinh."],
  ["act_exp_npc_talk", "NPC T— H—i Sinh nh—n v— ph—a ng——i; cu—c tr— chuy—n ch— c—n nh—ng l—i thm d—."],
  ["act_exp_npc_quest_accept", "— nh—n nhi—m v— t— NPC."],
  ["act_exp_npc_quest_turnin", "— ho—n th—nh nhi—m v— NPC."],
  ["act_exp_npc_dialogue", "T— H—i Sinh n—i: \"——ng ph—a tr——c kh—ng c—n y—n.\""],
  ["act_exp_contract", "— nh—n kh— ——c H— T—ng — m—c ti—u theo d—u k— tr—m."],
  ["act_exp_contract_complete", "Ho—n th—nh kh— ——c H— T—ng. C—ng —c +2."],
  ["act_exp_hidden_path", "— tung —u m—i gi—, nhi—t ph—n gi—n gi—m 20."],
  ["act_exp_hidden_realm", "— B——c v—o B— C—nh; c—ng tho—t v—n ——c neo t—i l—i v—o."],
  ["act_exp_hidden_realm_reward", "& o—t c— duy—n Huy—n Nguy—t: Tu vi +20, C—ng —c +2."],
  ["act_exp_tribulation", "— — ch—n c—ch v——t D— T——ng: D—n L—i Nh—p Th—."],
  ["act_exp_tribulation_done", "— Thi—n Ki—p — ——c v——t qua."],
  ["act_exp_tournament", "& Ho—n th—nh ba v—ng —i H—i; nh—n m—t Th— Luy—n L—nh."],
  ["act_exp_war", "— Th—ng tr—n chi—n tuy—n — chi—n c—ng +1."],
  ["act_exp_cover", "— — d—ng Th—n Ph—n Gi— t—i Huy—n —nh Ma —o H—i."],
  ["act_exp_cover_detected", "— Th—n Ph—n Gi— b— d— x—t: c—nh c—o."],
  ["act_exp_org", "— T— ch—c ch—a ch—p nh—n m—nh c—ch c—a ng——i: C—n —t danh v—ng."],
  ["act_exp_bounty", "— — treo th——ng 5 Linh Th—ch l—n k— truy s—t."],
  ["act_exp_auction", "— — tr— 10 Linh Th—ch cho Huy—n Thi—t Ki—m."],
  ["act_exp_craft", "& Luy—n th—nh ph—p kh— H—a V—n ao."],
  ["act_exp_repair", "— Tu b— H—a V—n ao — hao m—n gi—m 5%."],
  ["act_exp_build", "& C—ng tr—nh ho—n th—nh: Truy—n t—ng tr—n."],
  ["act_exp_map", "B—n — — c—p nh—t: m—t l—i i m—i."],
  ["act_exp_travel_resume", "Qu—ng ——ng n—y c—n 2 ng—y; th—i ti—t l—m ch—m h—nh tr—nh."],
  ["act_exp_fate_evolution", "— M—nh Ki—p M—nh Tinh ti—n tri—n: tinh anh 1/2 — l—a ch—n t——ng —ng 2/3."],
  ["act_exp_fate_complete", "— M—nh Ki—p c—a M—nh Tinh — vi—n m—n."],
  ["act_exp_ritual", " Nghi th—c: call_fate — ho—n t—t."],
  ["act_exp_offline", "— Offline: th— gi—i — —ng b— 3 ng—y game."],
  ["act_exp_rest", "— B— quan k—t th—c sau 8 gi—: v—n c—ng 3 l——t, i—u t—c 2 l——t. Linh kh— —n —nh."],
  ["act_exp_status", "— Th— Nguy—n s—p c—n: ch— c—n 2 nm."],
  ["act_exp_path", "— — ch—n Con ——ng: Ngo—i —o Gi—."],
  ["act_exp_faction", "— — ch—n tr—n doanh: Trung L—p."],
  ["act_exp_faction_switch", "—i tr—n doanh th—nh c—ng: Trung L—p. T— Th—n ban ph——c cho l—a ch—n m—i."],
  ["act_exp_search", "— i—u tra d—u v—t 1/3: v—t m—u d—n v—o khe —."],
  ["act_exp_collect", "Thu th—p ho—n t—t: 2 Linh Th—ch."],
  ["act_exp_quest_fail", "— Nhi—m v— th—t b—i: ——ng V— Nh— (th—i h—n — h—t)."]
];

function runExpansionLogMatrix() {
  const { loadBrowserGame } = require("./verify_game");
  const sandbox = loadBrowserGame();
  const E = sandbox.window.GameEngine;
  const state = E.createState({
    character: E.createCharacter({ name: "Narrative Matrix", archetypeId: "kiem_tong", fates: E.drawInitialFates() })
  });
  state.history = [];
  const failures = [];
  CASES.forEach(([actionId, raw]) => {
    const formatted = E.formatPlayerLogText(state, { type: "sys", text: raw });
    const result = lintNarrativeText(formatted);
    if (!result.ok) failures.push(`${actionId}: ${result.issues.join(", ")} -> ${formatted}`);
    assert(!/\b(?:node|nodeId|fateId|trialId|offerId|actionId|entityId|Search Depth|Corruption|Offline)\b/i.test(formatted), `${actionId} leaked technical token: ${formatted}`);
  });
  assert.deepStrictEqual(failures, [], failures.join("\n"));

  const debug = E.formatPlayerLogText(state, { type: "COMMAND_ECHO", debugOnly: true, text: "> [act_exp_divine]" });
  assert.strictEqual(debug, "> [act_exp_divine]");
  return { cases: CASES.length, passed: CASES.length, debugExemptions: 1 };
}

if (require.main === module) {
  const result = runExpansionLogMatrix();
  console.log(`OK: expansion narrative matrix (${result.passed}/${result.cases}), debug exemptions ${result.debugExemptions}`);
}

module.exports = { CASES, runExpansionLogMatrix };
