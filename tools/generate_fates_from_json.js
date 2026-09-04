/* ============================================================
 * Sinh Mệnh Số từ tu_han_viet_tien_hiep.json
 * 8 phẩm chất + tỷ lệ: Phàm/Linh/Hoàng/Huyền/Địa/Thiên/Thánh/Tiên
 * Tỷ lệ (%): 80 / 15 / 2.5 / 1.2 / 0.7 / 0.5 / 0.09 / 0.01
 * Chạy: node tools/generate_fates_from_json.js
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const RAW = require("../tu_han_viet_tien_hiep.json");

/* 8 loại phẩm chất (tăng dần, càng cao càng hiếm) */
const GRADES = ["phan", "linh", "hoang", "huyen", "dia", "thien", "thanh", "tien"];
const GRADE_LABEL = {
  phan: "Phàm Phẩm", linh: "Linh Phẩm", hoang: "Hoàng Phẩm", huyen: "Huyền Phẩm",
  dia: "Địa Phẩm", thien: "Thiên Phẩm", thanh: "Thánh Phẩm", tien: "Tiên Phẩm"
};
const GRADE_RANK = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };
const GRADE_SCORE = { phan: 2, linh: 8, hoang: 12, huyen: 16, dia: 28, thien: 42, thanh: 58, tien: 95 };

/* Tỷ lệ phân bố (phải cộng đủ 100%) */
const GRADE_RATIO = {
  phan: 80.00, linh: 15.00, hoang: 2.50, huyen: 1.20,
  dia: 0.70, thien: 0.50, thanh: 0.09, tien: 0.01
};

/* Prefix -> sign (tích cực / tiêu cực) */
const PREFIX_SIGN = {
  // Tiêu cực -> hung
  "Ma": "hung", "Quỷ": "hung", "Yêu": "hung", "Vô": "hung", "Bất": "hung",
  "Hư": "hung", "Tiểu": "hung", "Nghịch": "hung", "U": "hung", "Họa": "hung",
  "Hung": "hung", "Phá": "hung", "Âm": "hung", "Hỗn": "hung",
  // Tích cực -> cat
  "Tiên": "cat", "Đại": "cat", "Thái": "cat", "Cửu": "cat", "Vạn": "cat",
  "Thần": "cat", "Long": "cat", "Phượng": "cat", "Vĩnh": "cat", "Cổ": "cat",
  "Thánh": "cat", "Chân": "cat", "Tử": "cat", "Minh": "cat",
  "Thiên": "cat", "Phong": "cat", "Lôi": "cat",
  "Địa": "cat", "Băng": "cat", "Kim": "cat", "Mộc": "cat", "Thủy": "cat", "Hỏa": "cat", "Thổ": "cat",
  "Huyền": "cat", "Linh": "cat", "Khí": "cat", "Đan": "cat", "Tố": "cat", "Thuận": "cat",
  "Phúc": "cat", "Cát": "cat", "Huyết": "cat", "Kiếm": "cat", "Đao": "cat", "Dương": "cat"
};

/* Prefix -> độ ưu tiên phẩm chất (tier cao -> dễ rơi phẩm chất cao) */
const PREFIX_TIER = {
  // Tier 4 (đỉnh)
  "Tiên": 4, "Đại": 4, "Thái": 4, "Cửu": 4, "Vạn": 4,
  "Thần": 4, "Long": 4, "Phượng": 4, "Vĩnh": 4, "Cổ": 4,
  // Tier 3
  "Thánh": 3, "Chân": 3, "Tử": 3, "Minh": 3,
  // Tier 2
  "Thiên": 2, "Phong": 2, "Lôi": 2, "Địa": 2, "Băng": 2,
  "Kim": 2, "Mộc": 2, "Thủy": 2, "Hỏa": 2, "Thổ": 2,
  "Huyền": 2, "Linh": 2, "Khí": 2, "Đan": 2, "Tố": 2, "Thuận": 2,
  "Phúc": 2, "Cát": 2, "Huyết": 2, "Kiếm": 2, "Đao": 2, "Dương": 2,
  // Tier 1 (đáy)
  "Ma": 1, "Quỷ": 1, "Yêu": 1, "Vô": 1, "Bất": 1, "Hư": 1, "Tiểu": 1,
  "Nghịch": 1, "U": 1, "Họa": 1, "Hung": 1, "Phá": 1, "Âm": 1, "Hỗn": 1
};

/* Suffix -> hiệu ứng (thuộc tính) */
const SUFFIX_EFFECTS = {
  "Đạo": { magMult: 0.10, breakBonus: 0.10 },
  "Mệnh": { fortune: 30, lifespanBonus: 8 },
  "Cục": { phyMult: 0.08, magMult: 0.08 },
  "Vận": { fortune: 35, lootMult: 1.3 },
  "Cơ": { magMult: 0.12, breakBonus: 0.08 },
  "Kiếp": { sanDrainMult: 0.20, breakFailPenalty: true },
  "Giới": { sanResist: 0.15, magMult: 0.06 },
  "Vực": { phyMult: 0.12, sanDrainMult: 0.10 },
  "Pháp": { magMult: 0.15, sanResist: 0.08 },
  "Thuật": { magMult: 0.12, breakBonus: 0.08 },
  "Công": { phyMult: 0.18 },
  "Kinh": { magMult: 0.12, breakBonus: 0.06 },
  "Quyết": { phyMult: 0.10, magMult: 0.10 },
  "Tâm": { sanResist: 0.20, magMult: 0.04 },
  "Hồn": { sanResist: 0.15, magMult: 0.08 },
  "Phách": { phyMult: 0.12, hpRegen: true },
  "Thể": { phyMult: 0.15, allStatMult: 0.02 },
  "Tướng": { phyMult: 0.08, magMult: 0.08 },
  "Trận": { phyMult: 0.12, sanDrainMult: 0.15 },
  "Phù": { sanResist: 0.15, sanShield: true },
  "Đan": { breakBonus: 0.12, lifespanBonus: 5 },
  "Tông": { magMult: 0.08, breakBonus: 0.06 },
  "Phái": { magMult: 0.06, breakBonus: 0.06 },
  "Môn": { phyMult: 0.06, magMult: 0.06 },
  "Đế": { allStatMult: 0.10, fortune: 25 },
  "Tôn": { allStatMult: 0.08, fortune: 20 },
  "Chủ": { phyMult: 0.08, fortune: 20 },
  "Sư": { magMult: 0.08, breakBonus: 0.08 },
  "Tử": { magMult: 0.08, fortune: 15 },
  "Đồ": { fortune: 15, breakBonus: 0.06 },
  "Khách": { lootMult: 1.3, fortune: 10 },
  "Nhân": { allStatMult: 0.05, fortune: 15 },
  "Vật": { lootMult: 1.4, phyMult: 0.04 },
  "Sơn": { phyMult: 0.14, lifespanBonus: 10 },
  "Hải": { magMult: 0.12, fortune: 10 },
  "Hà": { magMult: 0.10, qiFlat: 5 },
  "Cốc": { sanResist: 0.10, breakBonus: 0.05 },
  "Phủ": { lootMult: 1.5, fortune: 15 },
  "Cung": { magMult: 0.08, sanResist: 0.10 },
  "Điện": { lightFireMult: 1.3, magMult: 0.06 },
  "Các": { magMult: 0.10, breakBonus: 0.05 },
  "Lâu": { magMult: 0.08, fortune: 10 },
  "Đài": { lightFireMult: 1.2, fortune: 10 },
  "Đình": { sanResist: 0.12, fortune: 10 },
  "Viện": { magMult: 0.08, sanResist: 0.08 },
  "Thất": { phyMult: 0.08, sanResist: 0.08 },
  "Ấn": { magMult: 0.10, resistPossession: true },
  "Chấn": { phyMult: 0.12, lightFireMult: 1.2 },
  "Sát": { phyMult: 0.15, sanDrainMult: 0.25 },
  "Sinh": { hpRegen: true, lifespanBonus: 10 }
};

function round2(v) { return Math.round(v * 100) / 100; }

function slugify(s) {
  return s.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function scaleEffects(effects, rank) {
  const mult = 0.6 + rank * 0.18; // rank 1..8 -> 0.78 .. 2.04
  const out = {};
  for (const k in effects) {
    const v = effects[k];
    if (typeof v === "number") out[k] = round2(v * mult);
    else out[k] = v;
  }
  return out;
}

function main() {
  // Bước 1: phân tích từ + tier
  const items = RAW.map((raw) => {
    const name = (raw.tu_han_viet || "").trim();
    const prefix = name.split(/\s+/)[0];
    const suffix = name.split(/\s+/).pop();
    const sign = PREFIX_SIGN[prefix] || "cat";
    const tier = PREFIX_TIER[prefix] || 1;
    return { raw, name, prefix, suffix, sign, tier };
  }).filter((x) => x.name);

  // Bước 2: sắp xếp theo tier giảm dần (tier cao lên phẩm chất cao)
  items.sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    return a.raw.id - b.raw.id;
  });

  const total = items.length;
  // Bước 3: phân bố grade theo tỷ lệ từ cao xuống thấp
  const gradeAssignment = [];
  let cursor = 0;
  for (const grade of [...GRADES].reverse()) { // tien -> phan
    const ratio = GRADE_RATIO[grade];
    const count = Math.round(total * ratio / 100);
    for (let i = 0; i < count && cursor < total; i++) {
      gradeAssignment.push({ index: cursor, grade });
      cursor++;
    }
  }
  // gán phần còn lại (do làm tròn) vào Phàm
  while (cursor < total) {
    gradeAssignment.push({ index: cursor, grade: "phan" });
    cursor++;
  }

  // tạo map index -> grade
  const gradeByIndex = {};
  gradeAssignment.forEach((g) => { gradeByIndex[g.index] = g.grade; });

  // Bước 4: sinh dữ liệu
  const fates = [];
  const seen = new Set();

  const NEGATIVE_KEYS = ["sanDrainMult", "breakFailPenalty"];
  const POSITIVE_POOL = [
    { key: "phyMult", min: 0.02, max: 0.10 },
    { key: "magMult", min: 0.02, max: 0.10 },
    { key: "fortune", min: 5, max: 25 },
    { key: "lootMult", min: 1.1, max: 1.5 },
    { key: "sanResist", min: 0.05, max: 0.20 },
    { key: "breakBonus", min: 0.03, max: 0.15 },
    { key: "lifespanBonus", min: 3, max: 15 }
  ];

  items.forEach((item, idx) => {
    const grade = gradeByIndex[idx] || "phan";
    let sign = item.sign;
    const rank = GRADE_RANK[grade] || 1;
    const baseScore = GRADE_SCORE[grade] || 2;
    const jitter = (item.raw.id % 7) - 3;
    let score = baseScore + jitter;
    score = sign === "hung" ? -Math.abs(score) : Math.abs(score);

    let effects = SUFFIX_EFFECTS[item.suffix] || { magMult: 0.06, fortune: 10 };
    effects = scaleEffects(effects, rank);

    // 1) Cát mang 0 điểm -> chuyển thành "Bình", giữ nguyên 0 điểm
    if (sign === "cat" && score === 0) {
      sign = "binh";
    }

    // 2) Cát có effect tiêu cực -> bù random stats dương
    if (sign === "cat") {
      const hasNegative = NEGATIVE_KEYS.some((k) => effects[k] > 0 || effects[k] === true);
      if (hasNegative) {
        const picks = [];
        const n = 1 + (item.raw.id % 2); // 1 hoặc 2 stat bù
        for (let i = 0; i < n; i++) {
          const pick = POSITIVE_POOL[item.raw.id % POSITIVE_POOL.length];
          const val = round2(pick.min + ((item.raw.id * 7 + i) % 10) * ((pick.max - pick.min) / 9));
          const key = pick.key;
          if (effects[key] !== undefined) {
            if (typeof effects[key] === "number") {
              effects[key] = round2(effects[key] + val);
            }
          } else {
            effects[key] = val;
          }
        }
      }
    }

    // Hung giữ nguyên logic thêm sanDrainMult nếu thiếu
    if (sign === "hung" && !effects.sanDrainMult && !effects.breakFailPenalty) {
      effects.sanDrainMult = round2(0.10 + rank * 0.02);
    }

    const id = slugify(item.name) + "_" + item.raw.id;
    if (seen.has(id)) return;
    seen.add(id);

    fates.push({
      id,
      name: item.name,
      sign,
      grade,
      gradeLabel: GRADE_LABEL[grade],
      score,
      effects,
      desc: item.raw.y_nghia || ""
    });
  });

const outPath = path.join(__dirname, "..", "data", "fate_data.js");
  const content = "/* CỔ DỊ DIỆN — Mệnh Số từ tu_han_viet_tien_hiep.json (8 phẩm chất + tỷ lệ) */\nwindow.FATE_DATA = " + JSON.stringify(fates) + ";\n";
  fs.writeFileSync(outPath, content, "utf8");

  const byGrade = {};
  fates.forEach((f) => { byGrade[f.grade] = (byGrade[f.grade] || 0) + 1; });
  const cats = fates.filter((f) => f.sign === "cat").length;
  const hungs = fates.filter((f) => f.sign === "hung").length;

  console.log("Generated " + fates.length + " fates -> " + outPath);
  console.log("cat=" + cats + " hung=" + hungs);
  console.log("By grade (actual):");
  GRADES.forEach((g) => {
    const pct = (byGrade[g] / fates.length * 100).toFixed(2);
    console.log("  " + g + " (" + GRADE_LABEL[g] + "): " + byGrade[g] + " (" + pct + "%)");
  });
}

main();
