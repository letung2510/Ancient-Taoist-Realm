/* ============================================================
 * Sinh quan hệ Mệnh Số (Tương Sinh/Khắc, Combo, Fusion)
 * Theo RELATIONSHIP_SYSTEM.md — cho cả 2 bộ:
 *   - 10000 mệnh (js/fate_data.js)  -> js/fate_relationships.js
 *   - 1300 mệnh (fate-pool.json)    -> fate-relationships.json
 * Chạy: node tools/generate_fate_relationships.js
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const GRADE_RANK = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };

function round2(v) { return Math.round(v * 100) / 100; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Chuẩn hóa 2 bộ dữ liệu về dạng chung ---------- */
function normalize10000(raw) {
  return raw.map((f) => ({
    id: f.id,
    name: f.name,
    tier: GRADE_RANK[f.grade] || 1,
    sign: f.sign === "cat" ? "cat" : f.sign === "hung" ? "hung" : "neutral",
    score: f.score,
    grade: f.grade,
    typeLabel: f.sign === "cat" ? "Cát Cách" : f.sign === "hung" ? "Hung Cách" : "Bình"
  }));
}
function normalize1300(raw) {
  return raw.fates.map((f) => ({
    id: f.id,
    name: f.name,
    tier: f.tier,
    sign: f.type === "Cát Cách" ? "cat" : "hung",
    score: f.score,
    typeLabel: f.type
  }));
}

/* ---------- Root cho Tương Khắc ---------- */
// Bộ 1300: 2 từ đầu là chính tinh (Tử Vi, Thiên Phủ...)
function root1300(name) {
  const parts = name.split(/\s+/);
  return parts.slice(0, 2).join(" ");
}
// Bộ 10000: dùng hậu tố (Đạo/Mệnh/Cục...) làm "gốc khí chất"
function root10000(name) {
  const parts = name.split(/\s+/);
  return parts[parts.length - 1];
}

/* ---------- Tạo relationship cho một bộ ---------- */
function buildRelationships(items, rootFn, label) {
  const cat = items.filter((i) => i.sign === "cat");
  const hung = items.filter((i) => i.sign === "hung");

  const pairwise = [];
  const pairwiseSeen = new Set();
  const pairKey = (a, b) => a + "|" + b;

  // ---- Tương Sinh: cùng phe + tier lệch <= 1 ----
  const bySignTier = { cat: {}, hung: {} };
  for (const it of items) {
    if (it.sign === "neutral") continue;
    (bySignTier[it.sign][it.tier] = bySignTier[it.sign][it.tier] || []).push(it);
  }
  for (const it of items) {
    if (it.sign === "neutral") continue;
    const pool = [];
    [it.tier - 1, it.tier, it.tier + 1].forEach((t) => {
      if (t >= 1 && t <= 8) {
        (bySignTier[it.sign][t] || []).forEach((cand) => {
          if (cand.id !== it.id) pool.push(cand);
        });
      }
    });
    if (!pool.length) continue;
    const n = randInt(1, 2);
    const chosen = shuffle(pool).slice(0, n);
    for (const cand of chosen) {
      const k = pairKey(it.id, cand.id);
      const rk = pairKey(cand.id, it.id);
      if (pairwiseSeen.has(k) || pairwiseSeen.has(rk)) continue;
      pairwiseSeen.add(k);
      const bonusPct = 3 + 2 * Math.min(it.tier, cand.tier);
      pairwise.push({
        from: it.id,
        to: cand.id,
        type: "TUONG_SINH",
        label: it.name + " ⟷ " + cand.name,
        effect: "Sở hữu đồng thời: +" + bonusPct + "% hiệu quả toàn bộ hiệu ứng của cả 2 mệnh",
        bonusPct
      });
    }
  }

  // ---- Tương Khắc: cat + hung cùng root ----
  const catByRoot = {};
  const hungByRoot = {};
  for (const c of cat) {
    const r = rootFn(c.name);
    (catByRoot[r] = catByRoot[r] || []).push(c);
  }
  for (const h of hung) {
    const r = rootFn(h.name);
    (hungByRoot[r] = hungByRoot[r] || []).push(h);
  }
  for (const r in catByRoot) {
    if (!hungByRoot[r]) continue;
    const cList = catByRoot[r];
    const hList = hungByRoot[r];
    const pairs = Math.min(2, cList.length, hList.length);
    for (let i = 0; i < pairs; i++) {
      const c = cList[i];
      const h = hList[i];
      const k = pairKey(c.id, h.id);
      if (pairwiseSeen.has(k)) continue;
      pairwiseSeen.add(k);
      const penaltyPct = 5 + 3 * Math.min(c.tier, h.tier);
      pairwise.push({
        from: c.id,
        to: h.id,
        type: "TUONG_KHAC",
        label: c.name + " ✕ " + h.name,
        effect: "Sở hữu đồng thời: -" + penaltyPct + "% hiệu quả cả 2 mệnh, +5 Điểm Điên Loạn",
        penaltyPct,
        madnessDelta: 5
      });
    }
  }

  // ---- Combo Sets (150) ----
  const combos = [];
  const comboIds = new Set();
  let comboId = 1;
  let attempts = 0;
  while (combos.length < 150 && attempts < 5000) {
    attempts++;
    const size = randInt(2, 4);
    const crossTier = Math.random() < 0.3;
    let candidates;
    if (crossTier) {
      candidates = shuffle(items.filter((i) => i.sign !== "neutral"));
    } else {
      const tier = randInt(1, 8);
      candidates = shuffle(items.filter((i) => i.sign !== "neutral" && i.tier === tier));
    }
    if (candidates.length < size) continue;
    const members = candidates.slice(0, size);
    const ids = members.map((m) => m.id).sort();
    const key = ids.join(",");
    if (comboIds.has(key)) continue;
    comboIds.add(key);

    const isNghich = new Set(members.map((m) => m.sign)).size > 1;
    const sumAbsScore = members.reduce((s, m) => s + Math.abs(m.score), 0);
    const avgTier = members.reduce((s, m) => s + m.tier, 0) / members.length;
    const namePool = [
      "Tam Tài", "Thiên Địa Nhân", "Tam Quang", "Ngũ Hành Tương Hợp", "Song Hùng",
      "Tứ Tượng", "Cửu Cung", "Thất Diệu", "Lục Hợp", "Bát Quái", "Tam Hợp", "Tứ Linh"
    ];
    const name = pick(namePool) + " " + ["Cách", "Hội", "Tụ", "Kết"][randInt(0, 3)];
    let effect, bonusPct, fortuneBonus = 0, madnessDelta = 0;
    if (isNghich) {
      bonusPct = Math.round(sumAbsScore * 1.5);
      madnessDelta = Math.max(1, Math.round(avgTier));
      effect = "Nghịch Mệnh Cộng Hưởng — +" + bonusPct + "% Final Stats, +" + madnessDelta + " Điểm Điên Loạn";
    } else {
      bonusPct = Math.round(sumAbsScore * 1.2);
      fortuneBonus = Math.round(avgTier * 5);
      effect = "Cộng Hưởng Thuận — +" + bonusPct + "% hiệu ứng liên quan, Khí Vận +" + fortuneBonus;
    }
    combos.push({
      combo_id: comboId++,
      name,
      members: members.map((m) => ({ id: m.id, name: m.name, tier: m.tier, type: m.typeLabel })),
      required_count: size,
      avg_tier: round2(avgTier),
      effect,
      isNghich,
      bonusPct,
      fortuneBonus,
      madnessDelta
    });
  }

  // ---- Fusion Recipes ----
  const recipes = [];
  let recipeId = 1;
  for (let tier = 1; tier <= 7; tier++) {
    const count = Math.max(3, Math.round(30 / tier));
    const tierItems = items.filter((i) => i.tier === tier && i.sign !== "neutral");
    const nextItems = items.filter((i) => i.tier === tier + 1 && i.sign !== "neutral");
    if (!tierItems.length || !nextItems.length) continue;
    for (let r = 0; r < count; r++) {
      const matCount = randInt(3, 4);
      if (tierItems.length < matCount) break;
      const mats = shuffle(tierItems).slice(0, matCount);
      const isLai = Math.random() < 0.2;
      const result = pick(nextItems);
      let successRate, failConsequence, note;
      if (isLai) {
        successRate = randInt(30, 55);
        failConsequence = "Mất nguyên liệu, SAN -5 (phản phệ)";
        note = "Dung hợp lai (pha Cát + Hung)";
      } else {
        successRate = randInt(70, 95);
        failConsequence = "Mất nguyên liệu";
        note = "Dung hợp thuận";
      }
      recipes.push({
        recipe_id: recipeId++,
        tier_from: tier,
        tier_to: tier + 1,
        materials: mats.map((m) => ({ id: m.id, name: m.name, tier: m.tier, type: m.typeLabel })),
        result: { id: result.id, name: result.name, tier: result.tier, type: result.typeLabel },
        success_rate_pct: successRate,
        fail_consequence: failConsequence,
        note
      });
    }
  }

  return {
    generated_at: new Date().toISOString(),
    source: label,
    total_fates: items.length,
    summary: {
      pairwise_relationships: pairwise.length,
      tuong_sinh: pairwise.filter((p) => p.type === "TUONG_SINH").length,
      tuong_khac: pairwise.filter((p) => p.type === "TUONG_KHAC").length,
      combo_sets: combos.length,
      fusion_recipes: recipes.length
    },
    pairwise_relationships: pairwise,
    combo_sets: combos,
    fusion_recipes: recipes
  };
}

/* ---------- Load 2 nguồn dữ liệu ---------- */
function load10000() {
  const code = fs.readFileSync(path.join(__dirname, "..", "data", "fate_data.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.FATE_DATA;
}
function load1300() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "fate-pool.json"), "utf8"));
}

function main() {
  // Bộ 10000
  const fates10000 = load10000();
  const items10000 = normalize10000(fates10000);
  const rel10000 = buildRelationships(items10000, root10000, "fate_data_10000");
  const jsOut = "/* CỔ DỊ DIỆN — Quan hệ Mệnh Số (10000) */\nwindow.FATE_RELATIONSHIPS = " + JSON.stringify(rel10000) + ";\n";
  fs.writeFileSync(path.join(__dirname, "..", "data", "fate_relationships.js"), jsOut, "utf8");
  console.log("10000 -> js/fate_relationships.js", JSON.stringify(rel10000.summary));

  // Bộ 1300
  const pool1300 = load1300();
  const items1300 = normalize1300(pool1300);
  const rel1300 = buildRelationships(items1300, root1300, "fate-pool_1300");
  fs.writeFileSync(
    path.join(__dirname, "..", "data", "fate-relationships.json"),
    JSON.stringify(rel1300, null, 2)
  );
  console.log("1300 -> fate-relationships.json", JSON.stringify(rel1300.summary));
}

main();
