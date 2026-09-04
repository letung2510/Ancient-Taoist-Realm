/* ==========================================================================
   DATABASES NGUYÊN LIỆU PHONG CÁCH TIÊN HIỆP
   ========================================================================== */

const PREFIXES = [
  // Tốt / Thượng phẩm
  { name: "Thượng Phẩm", tier: 1.5, badChance: 0 },
  { name: "Huyền Thoại", tier: 3.0, badChance: 0 },
  { name: "Cổ Đại", tier: 2.0, badChance: 0.1 },
  { name: "Thần Diệu", tier: 2.5, badChance: 0 },
  { name: "Tiên Phong", tier: 2.2, badChance: 0.05 },
  { name: "Chân Linh", tier: 2.8, badChance: 0.02 },
  { name: "Thánh Quang", tier: 3.2, badChance: 0 },

  // Trung bình / Biến thiên
  { name: "U Hồn", tier: 1.1, badChance: 0.4 },
  { name: "Tâm Ma", tier: 1.4, badChance: 0.5 },
  { name: "Huyết Tế", tier: 2.2, badChance: 0.5 },
  { name: "Phong Ấn", tier: 1.3, badChance: 0.3 },
  { name: "Nghiệt Duyên", tier: 1.6, badChance: 0.45 },

  // Xấu / Độc hại
  { name: "Tàn Phế", tier: 0.4, badChance: 0.6 },
  { name: "Ma Hóa", tier: 1.8, badChance: 0.7 },
  { name: "Mục Nát", tier: 0.2, badChance: 0.8 },
  { name: "Oán Linh", tier: 1.2, badChance: 0.75 },
  { name: "Hoang Phế", tier: 0.3, badChance: 0.85 },
  { name: "Cấm Sát", tier: 2.0, badChance: 0.9 }
];

const BASE_TYPES = [
  // Consumables
  { baseId: "dan", name: "Đan", kind: "consumable" },
  { baseId: "phu", name: "Phù", kind: "consumable" },
  { baseId: "dich", name: "Linh Dịch", kind: "consumable" },
  { baseId: "cao", name: "Linh Cao", kind: "consumable" },
  { baseId: "tuu", name: "Linh Tửu", kind: "consumable" },
  { baseId: "tra", name: "Linh Trà", kind: "consumable" },
  { baseId: "phien", name: "Linh Phiến", kind: "consumable" },
  { baseId: "huong", name: "Trầm Hương", kind: "consumable" },
  { baseId: "xa_loi", name: "Xá Lợi", kind: "consumable" },
  { baseId: "hoan", name: "Linh Hoàn", kind: "consumable" },
  { baseId: "huyet", name: "Huyết Tinh", kind: "consumable" },
  { baseId: "canh", name: "Tiên Canh", kind: "consumable" },
  { baseId: "qua", name: "Thần Quả", kind: "consumable" },
  { baseId: "tuy", name: "Linh Tủy", kind: "consumable" },

  // Equipment
  { baseId: "kiem", name: "Kiếm", kind: "weapon", equipmentType: "artifact" },
  { baseId: "phap_bao", name: "Pháp Bảo", kind: "weapon", equipmentType: "artifact" },
  { baseId: "dinh", name: "Thần Đỉnh", kind: "weapon", equipmentType: "spirit" },
  { baseId: "chuong", name: "Linh Chuông", kind: "weapon", equipmentType: "spirit" },
  { baseId: "thuong", name: "Trường Thương", kind: "weapon", equipmentType: "artifact" },
  { baseId: "phu_khi", name: "Phù Khí", kind: "weapon", equipmentType: "lifestyle" },
  { baseId: "giap", name: "Giáp", kind: "armor", equipmentType: "protection", protectionSlot: "armor" },
  { baseId: "giay", name: "Pháp Ngoa", kind: "armor", equipmentType: "protection", protectionSlot: "boots" },
  { baseId: "quan", name: "Hộ Quần", kind: "armor", equipmentType: "protection", protectionSlot: "pants" },
  { baseId: "mu", name: "Pháp Mũ", kind: "armor", equipmentType: "protection", protectionSlot: "helmet" },
  { baseId: "ngoc", name: "Ngọc Bội", kind: "armor", equipmentType: "personal" },
  { baseId: "vong", name: "Pháp Vòng", kind: "armor", equipmentType: "personal" },
  { baseId: "nhan", name: "Pháp Nhẫn", kind: "armor", equipmentType: "personal" },
  { baseId: "y", name: "Đạo Y", kind: "armor", equipmentType: "protection", protectionSlot: "armor" },
  { baseId: "khuyen", name: "Hộ Tí", kind: "armor", equipmentType: "personal" },

  // Key & Currency
  { baseId: "do_co", name: "Cổ Vật", kind: "key" },
  { baseId: "an", name: "Cổ Ấn", kind: "key" },
  { baseId: "khoang", name: "Khoáng Thạch", kind: "currency" },
  { baseId: "chau", name: "Linh Châu", kind: "currency" }
];

const SUFFIXES = [
  "Thái Cổ", "Cửu Thiên", "Bích Tạc", "U Minh", "Vong Hồn", 
  "Sơn Hà", "Trầm Hương", "Phá Thiên", "Bát Quái", "Huyết Ngục",
  "Tử Vi", "Bắc Đẩu", "Cửu U", "Hỗn Độn", "Linh Tiêu",
  "U Đô", "Đại La", "Thương Thiên", "Hàn Sương", "Xích Tiêu"
];

const ATTRIBUTES = [
  "Cuồng Sát", "Trấn Tâm", "U Hồn", "Phá Tà", "Linh Huyết", 
  "Tế Cốt", "Tuyệt Diệt", "Thôn Phệ", "Cực Hàn", "Xích Viêm",
  "Nhiễu Tâm", "Trầm Mịch", "Định Thần", "Bá Vương", "Tru Tiên",
  "Chấn Thiên", "Tịch Mịch", "Vĩnh Hằng", "U Ám", "Nghịch Thiên"
];

/* ==========================================================================
   RANDOM GENERATOR ENGINE
   ========================================================================== */

// Utility lấy phần tử ngẫu nhiên từ mảng
const getRandomItem = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];
let itemSequence = 0;

/**
 * Sinh 1 item ngẫu nhiên.
 * @param {string} [targetKind] - Trọc lọc loại item muốn sinh (VD: "consumable", "weapon", "armor"). Nếu để trống sẽ random ngẫu nhiên tất cả.
 */
function createRandomItem(targetKind = null, rng = Math.random) {
  const p = getRandomItem(PREFIXES, rng);
  const s = getRandomItem(SUFFIXES, rng);
  const attr = getRandomItem(ATTRIBUTES, rng);

  // Lọc BASE_TYPES nếu có truyền targetKind
  let validBases = BASE_TYPES;
  if (targetKind) {
    validBases = BASE_TYPES.filter(b => b.kind === targetKind);
    if (validBases.length === 0) validBases = BASE_TYPES; // Fallback nếu truyền nhầm kind
  }
  const b = getRandomItem(validBases, rng);

  // Timestamp + sequence + random hash giữ ID duy nhất cả khi sinh nhiều item cùng mili-giây.
  itemSequence += 1;
  const uniqueHash = `${Date.now().toString(36)}_${itemSequence.toString(36)}_${rng().toString(36).substring(2, 7)}`;
  const rawId = `${p.name}_${b.baseId}_${s}_${attr}_${uniqueHash}`;
  const id = rawId.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9_]+/g, "_").replace(/_+/g, "_");

  const name = `${p.name} ${b.name} ${s} - ${attr}`;
  const isBad = rng() < p.badChance;
  const multiplier = isBad ? -0.5 * p.tier : p.tier;

  const item = {
    id, name, kind: b.kind,
    ...(b.equipmentType ? { equipmentType: b.equipmentType } : {}),
    ...(b.protectionSlot ? { protectionSlot: b.protectionSlot } : {}),
    tier: p.tier,
    cursed: isBad,
    value: Math.max(1, Math.floor(25 * p.tier)),
    generated: true
  };

  // Phân bổ chỉ số (Stats)
  if (b.kind === "consumable") {
    if (isBad) {
      item.exp = Math.floor(-25 * p.tier);
      item.san = Math.floor(-18 * p.tier);
    } else {
      item.exp = Math.floor(50 * multiplier);
      item.heal = parseFloat((0.1 * multiplier).toFixed(2));
    }
  } else if (b.kind === "weapon") {
    item.phy = Math.floor(12 * multiplier);
    if (isBad) item.sanDrain = Math.floor(6 * p.tier);
  } else if (b.kind === "armor") {
    item.sanResist = parseFloat((0.05 * multiplier).toFixed(2));
    if (isBad) item.phyDef = Math.floor(-6 * p.tier);
  } else if (b.kind === "currency") {
    item.exp = Math.floor(8 * Math.abs(multiplier));
  }

  item.desc = isBad
    ? `Vật phẩm ${p.name} đã nhiễm ${attr}; sử dụng có thể gây phản phệ.`
    : `Vật phẩm ${p.name}, chứa linh lực ${s} mang đặc tính ${attr}.`;

  return item;
}

/**
 * Sinh nhanh N item ngẫu nhiên theo nhu cầu.
 */
function generateBatchItems(quantity = 100, targetKind = null, rng = Math.random) {
  const count = Math.max(0, Math.min(10000, Math.floor(Number(quantity) || 0)));
  const items = {};
  for (let i = 0; i < count; i++) {
    const item = createRandomItem(targetKind, rng);
    items[item.id] = item;
  }
  return items;
}

const ItemGenerator = {
  createRandomItem,
  generateBatchItems,
  kinds: [...new Set(BASE_TYPES.map((item) => item.kind))]
};

if (typeof window !== "undefined") window.ItemGenerator = ItemGenerator;
if (typeof module !== "undefined" && module.exports) module.exports = ItemGenerator;
