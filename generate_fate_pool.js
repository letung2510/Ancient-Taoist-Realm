// generate_fate_pool.js
// Sinh bộ data Mệnh Số (Fate Pool) - 8 phẩm cấp từ Trắng đến Cầu Vồng
// Chạy: node generate_fate_pool.js  -> xuất ra fate-pool.json

const fs = require('fs');

// ============ 1. ĐỊNH NGHĨA 8 PHẨM CẤP (TIER) ============
// weight: xác suất roll ra tier này (tổng = 10000 phần vạn, để random chính xác)
// scoreRange: khoảng điểm |score| cho mệnh thuộc tier này
const TIERS = [
  { id: 1, name: 'Trắng',    key: 'white',     weight: 4500, scoreRange: [1, 2],   hasHung: true,  hungWeight: 0.45 },
  { id: 2, name: 'Lục',      key: 'green',     weight: 2500, scoreRange: [2, 4],   hasHung: true,  hungWeight: 0.40 },
  { id: 3, name: 'Lam',      key: 'blue',      weight: 1500, scoreRange: [4, 6],   hasHung: true,  hungWeight: 0.35 },
  { id: 4, name: 'Chàm',     key: 'indigo',    weight: 800,  scoreRange: [6, 9],   hasHung: true,  hungWeight: 0.30 },
  { id: 5, name: 'Tím',      key: 'purple',    weight: 400,  scoreRange: [9, 12],  hasHung: true,  hungWeight: 0.25 },
  { id: 6, name: 'Cam Kim',  key: 'gold',      weight: 200,  scoreRange: [12, 16], hasHung: true,  hungWeight: 0.20 },
  { id: 7, name: 'Đỏ',       key: 'red',       weight: 80,   scoreRange: [16, 20], hasHung: true,  hungWeight: 0.15 },
  { id: 8, name: 'Cầu Vồng', key: 'rainbow',   weight: 20,   scoreRange: [20, 30], hasHung: false, hungWeight: 0.05 },
];

// ============ 2. NGÂN HÀNG TỪ (dùng thuật ngữ Tử Vi Đẩu Số làm chất liệu) ============
const CHINH_TINH = [
  'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh',
  'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương',
  'Thất Sát', 'Phá Quân',
];

const PHU_TINH_CAT = [
  'Tả Phù', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt',
  'Lộc Tồn', 'Thiên Mã', 'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Long Trì', 'Phượng Các',
  'Thiên Đức', 'Nguyệt Đức', 'Tam Thai', 'Bát Tọa', 'Ân Quang', 'Thiên Quý',
];

const PHU_TINH_HUNG = [
  'Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp',
  'Hóa Kỵ', 'Thiên Hình', 'Thiên Riêu', 'Cô Thần', 'Quả Tú', 'Đại Hao',
  'Tang Môn', 'Bạch Hổ', 'Thiên Khốc', 'Thiên Hư', 'Phá Toái', 'Thiên Sứ',
];

const CACH_CUC_CAT = [
  '{A} {B} Đồng Cung', '{A} Triều Viên', '{A} Nhập Miếu', '{A} Củng {B}',
  '{A} Phùng {B}', '{A} Tọa Mệnh', '{A} Hội {B}', '{A} Đắc Địa',
  '{A} Vượng Tướng', '{A} Chiếu Mệnh', '{A} Giáp {B}', '{A} Hóa Cát',
];

const CACH_CUC_HUNG = [
  '{A} Hãm Địa', '{A} Ngộ {B}', '{A} Lạc Hãm', '{A} Xung {B}',
  '{A} Phá Cách', '{A} Hình Khắc', '{A} Kỵ Xung', '{A} Đảo Loạn',
  '{A} Tọa Hung', '{A} Ám Hợp {B}', '{A} Suy Bại', '{A} Vong Thân',
];

const HIEU_UNG_CAT = (tier) => [
  `Khí Vận +${5 * tier}`,
  `+${2 * tier}% Breakpoint Stats`,
  `Hồi phục Thọ Nguyên +${tier} năm khi Đột Phá`,
  `Kháng ${Math.min(5 * tier, 40)}% SAN Drain`,
  `+${tier}% Base PHY`,
  `+${tier}% Base MAG`,
  `Giảm ${Math.min(3 * tier, 30)}% xác suất bị Tà Thần chú ý`,
  `x1.${Math.min(tier, 9)} Sát thương thuộc tính tương ứng`,
  `Tăng ${tier * 2}% tốc độ hồi Linh Lực`,
  `Kháng nhẹ hiệu ứng cưỡng chế Đoạt Xá`,
];

const HIEU_UNG_HUNG = (tier) => [
  `Khí Vận -${4 * tier}`,
  `SAN tối đa -${tier}`,
  `Base Stats -${Math.min(3 * tier, 30)}%`,
  `Dễ bị Tà Thần chú ý +${Math.min(4 * tier, 40)}%`,
  `Thọ Nguyên bị rút ${Math.min(2 * tier, 20)}% khi Fail Quest`,
  `Fail Quest phạt x${Math.min(1 + Math.floor(tier / 2), 4)}`,
  `-${tier}% tốc độ hồi Linh Lực`,
  `Tăng ${tier * 2}% xác suất nhận Eldritch Quest cưỡng chế`,
];

// ============ 3. HÀM TIỆN ÍCH ============
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeName(tierIdx, isCat) {
  const A = isCat ? pick(CHINH_TINH.concat(PHU_TINH_CAT)) : pick(CHINH_TINH.concat(PHU_TINH_HUNG));
  const B = isCat ? pick(PHU_TINH_CAT) : pick(PHU_TINH_HUNG);
  const template = pick(isCat ? CACH_CUC_CAT : CACH_CUC_HUNG);
  return template.replace('{A}', A).replace('{B}', B);
}

// ============ 4. SINH POOL ============
function generateFatePool(totalCount) {
  const pool = [];
  const seenNames = new Set();
  let id = 1;

  // Phân bổ số lượng entry cho mỗi tier tỉ lệ nghịch với độ hiếm (tier hiếm có ít entry hơn)
  const countPerTier = {
    1: Math.round(totalCount * 0.30), // Trắng: nhiều biến thể nhất (mệnh phổ thông)
    2: Math.round(totalCount * 0.22),
    3: Math.round(totalCount * 0.17),
    4: Math.round(totalCount * 0.12),
    5: Math.round(totalCount * 0.09),
    6: Math.round(totalCount * 0.06),
    7: Math.round(totalCount * 0.03),
    8: Math.round(totalCount * 0.01),
  };

  for (const tier of TIERS) {
    const n = countPerTier[tier.id];
    let created = 0;
    let attempts = 0;
    while (created < n && attempts < n * 20) {
      attempts++;
      const isCat = Math.random() > tier.hungWeight; // xác suất ra Cát Cách càng cao ở tier thấp
      if (!isCat && !tier.hasHung) continue;

      const name = makeName(tier.id, isCat);
      const uniqueKey = `${tier.id}-${name}-${isCat}`;
      if (seenNames.has(uniqueKey)) continue;
      seenNames.add(uniqueKey);

      const rawScore = randInt(tier.scoreRange[0], tier.scoreRange[1]);
      const score = isCat ? rawScore : -rawScore;
      const effectPool = isCat ? HIEU_UNG_CAT(tier.id) : HIEU_UNG_HUNG(tier.id);
      const numEffects = tier.id <= 2 ? 1 : (tier.id <= 5 ? 2 : 3);
      const effects = [];
      const usedEffIdx = new Set();
      while (effects.length < numEffects && effects.length < effectPool.length) {
        const idx = randInt(0, effectPool.length - 1);
        if (usedEffIdx.has(idx)) continue;
        usedEffIdx.add(idx);
        effects.push(effectPool[idx]);
      }

      pool.push({
        id: id++,
        name,
        tier: tier.id,
        tier_name: tier.name,
        tier_key: tier.key,
        type: isCat ? 'Cát Cách' : 'Hung Cách',
        score,
        weight: tier.weight, // trọng số roll gốc theo tier (dùng khi random)
        effects,
      });
      created++;
    }
  }
  return pool;
}

const TOTAL = 1300;
const pool = generateFatePool(TOTAL);

fs.writeFileSync(
    __dirname + '/data/fate-pool.json',
  JSON.stringify({ generated_at: new Date().toISOString(), total: pool.length, tiers: TIERS, fates: pool }, null, 2)
);

// Thống kê nhanh
const stats = {};
for (const f of pool) {
  stats[f.tier_name] = stats[f.tier_name] || { count: 0, cat: 0, hung: 0 };
  stats[f.tier_name].count++;
  if (f.type === 'Cát Cách') stats[f.tier_name].cat++; else stats[f.tier_name].hung++;
}
console.log('Tổng số Mệnh Số sinh ra:', pool.length);
console.table(stats);
