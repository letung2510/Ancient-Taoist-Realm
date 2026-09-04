"use strict";

// Generator Node canonical theo HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md.
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const fatePool = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "fate-pool.json"), "utf8"));
const pathFateRelations = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "path_fate_relations.json"), "utf8"));

const REGION_RACE_WEIGHTS = {
  trung_vuc: [["Nhân Tộc", 70], ["Linh Tộc", 15], ["Yêu Tộc", 8], ["Cổ Tộc", 5], ["Ma Tộc", 2]],
  dong_hoang: [["Nhân Tộc", 85], ["Yêu Tộc", 10], ["Linh Tộc", 4], ["Cổ Tộc", 1]],
  tay_mac: [["Nhân Tộc", 76], ["Linh Tộc", 8], ["Yêu Tộc", 6], ["Cổ Tộc", 4], ["Ma Tộc", 6]],
  nam_chuong: [["Nhân Tộc", 58], ["Yêu Tộc", 23], ["Linh Tộc", 12], ["Cổ Tộc", 4], ["Ma Tộc", 3]],
  bac_nguyen: [["Yêu Tộc", 70], ["Nhân Tộc", 20], ["Cổ Tộc", 8], ["Ma Tộc", 2]],
  vo_tan_hai: [["Nhân Tộc", 45], ["Yêu Tộc", 30], ["Linh Tộc", 18], ["Cổ Tộc", 5], ["Ma Tộc", 2]],
  thien_khong_vuc: [["Linh Tộc", 48], ["Nhân Tộc", 30], ["Cổ Tộc", 12], ["Yêu Tộc", 8], ["Ma Tộc", 2]],
  u_minh_gioi: [["Ma Tộc", 50], ["Cổ Tộc", 20], ["Yêu Tộc", 15], ["Linh Tộc", 10], ["Nhân Tộc", 5]]
};
const START_LOCATIONS = { trung_vuc: "son_mon", dong_hoang: "hac_lam", tay_mac: "tay_mac_khoi_diem", nam_chuong: "linh_dien", bac_nguyen: "bac_nguyen_khoi_diem", vo_tan_hai: "vo_tan_hai_khoi_diem", thien_khong_vuc: "thien_khong_khoi_diem", u_minh_gioi: "u_minh_khoi_diem" };
const TRAITS = ["Chính trực", "Tàn nhẫn", "Tham lam", "Trung thành", "Cơ trí", "Lỗ mãng", "Lãnh đạm", "Nhiệt huyết", "Xảo quyệt", "Ẩn nhẫn"];
const BACKGROUNDS = ["Tông Môn", "Thế Gia", "Tán Tu", "Hắc Đạo", "Vô Danh"];
const GOALS = ["Báo thù", "Tìm cơ duyên", "Bảo vệ môn phái", "Thống nhất vùng", "Trốn tránh quá khứ", "Trường sinh"];
const COMMON_ROOTS = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const EXOTIC_ROOTS = ["Băng", "Lôi", "Phong", "Âm", "Dương", "Không Gian"];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function weightedValue(entries) {
  let roll = Math.random() * entries.reduce((sum, entry) => sum + entry[1], 0);
  for (const entry of entries) { roll -= entry[1]; if (roll < 0) return entry[0]; }
  return entries[entries.length - 1][0];
}
function sampleDistinct(pool, count) {
  const source = pool.slice(); const result = [];
  while (result.length < count && source.length) result.push(source.splice(rand(0, source.length - 1), 1)[0]);
  return result;
}
function gaussianAttribute() {
  const u1 = Math.max(Number.EPSILON, Math.random()); const u2 = Math.random();
  return clamp(Math.round(50 + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 15), 1, 100);
}
function rollSpiritualRoots() {
  const roll = Math.random() * 100;
  if (roll < 50) return sampleDistinct(COMMON_ROOTS, rand(4, 5));
  if (roll < 85) return sampleDistinct(COMMON_ROOTS, rand(2, 3));
  if (roll < 95) return sampleDistinct(COMMON_ROOTS, 1);
  if (roll < 99) return sampleDistinct(COMMON_ROOTS.concat(EXOTIC_ROOTS), rand(2, 3));
  return sampleDistinct(EXOTIC_ROOTS, 1);
}

function rollFates() {
  const gradeRank = { pham: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };
  const eligible = fatePool.fates.filter((fate) => (fate.tier || gradeRank[fate.grade] || 99) <= 3);
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const available = eligible.slice(); const selected = [];
    while (selected.length < 5) {
      const targetTier = weightedValue([[1, 65], [2, 30], [3, 5]]);
      let pool = available.filter((fate) => (fate.tier || gradeRank[fate.grade]) === targetTier);
      if (!pool.length) pool = available;
      const picked = pool[rand(0, pool.length - 1)];
      selected.push({ ...picked });
      available.splice(available.findIndex((fate) => fate.id === picked.id), 1);
    }
    if (selected.reduce((sum, fate) => sum + Number(fate.score || 0), 0) > 5) return selected;
  }
  throw new Error("Fate Pool không thể tạo bộ 5 Mệnh Số hợp lệ.");
}

function generateCharacter(input = {}) {
  const regionId = input.startRegionId || "trung_vuc";
  if (!REGION_RACE_WEIGHTS[regionId]) throw new RangeError("Nơi bắt đầu không hợp lệ.");
  const fates = rollFates();
  const hiddenFates = Math.random() < pathFateRelations.hidden_fates.luan_hoi_tien.roll_probability_percent / 100 ? ["luan_hoi_tien"] : [];
  const total = fates.reduce((sum, fate) => sum + Number(fate.score || 0), 0);
  const normal = fates.filter((fate) => fate.sign !== "hung" && !String(fate.type || "").toLowerCase().includes("hung")).reduce((sum, fate) => sum + Number(fate.score || 0), 0);
  const phy = input.basePhy ?? rand(10, 20); const mag = input.baseMag ?? rand(10, 20);
  const aptitude = input.aptitude ?? gaussianAttribute(); const comprehension = input.comprehension ?? gaussianAttribute();
  const equippedIds = fates.map((fate) => fate.id);
  return {
    id: input.id || `char_${Date.now()}_${rand(1000, 9999)}`,
    name: input.name || "Vô Danh",
    origin: { regionId, locationId: START_LOCATIONS[regionId], race: input.race || weightedValue(REGION_RACE_WEIGHTS[regionId]), background: input.background || BACKGROUNDS[rand(0, BACKGROUNDS.length - 1)], personality: input.personalityTraits || sampleDistinct(TRAITS, 2), hiddenGoal: input.hiddenGoal || GOALS[rand(0, GOALS.length - 1)], spiritualRoots: input.spiritualRoots || rollSpiritualRoots() },
    realm: { id: "di_menh", level: 1, title: "Di Mệnh Cảnh", exp: 0 },
    path: { primary: null, secondary: null, pathScore: 0, professionStage: null },
    stats: { phy, mag, aptitude, comprehension, vitality: phy * 8 + 40, staminaCurrent: 100, staminaMax: 100 + phy * 2, san: 100, sanMax: 100, corruption: 0, lifespan: rand(60, 80) },
    fate: { equippedIds, vaultIds: [], vaultCapacity: equippedIds.length * 2, total, normal, ratioR: Number((total / Math.max(1, Math.abs(normal))).toFixed(3)), debt: 0, surplus: 0, pacts: [] },
    anchors: [], techniqueIds: ["kiem_khi_so_cap", "tam_phap_dan_dien"],
    hiddenFates, hiddenProfessionCandidate: hiddenFates.includes("luan_hoi_tien") ? "luan_hoi_tien" : null, hiddenProfession: null,
    faction: { id: null, titles: [], heavenMerit: 0, balanceTokens: 0, eldritchAttentionChosen: false, finalConflictPreparation: false, taintedGodDefeated: false },
    state: "NORMAL_GROWTH", pathDebt: [], eventHistory: [], createdAt: new Date().toISOString()
  };
}

module.exports = { generateCharacter, rollFates };
