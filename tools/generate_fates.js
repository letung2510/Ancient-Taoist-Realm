/* ============================================================
 * Sinh dữ liệu Mệnh Số (Tử Vi) cho Cổ Dị Diện
 * Chạy: node tools/generate_fates.js
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const CUNGS = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const LEVELS = [
  { key: "thuong", label: "Thượng Cách", mult: 1.2, catShift: 2, hungShift: -2 },
  { key: "trung", label: "Trung Cách", mult: 1.0, catShift: 0, hungShift: 0 },
  { key: "ha", label: "Hạ Cách", mult: 0.8, catShift: -2, hungShift: 2 }
];

// Biến thể Hóa Diệu: bổ sung chiều sâu theo Tứ Hóa
const HOADIEU = [
  { key: "hoa_loc", label: "Hóa Lộc", scoreShift: 3, effects: { lootMult: 1.3, fortune: 20 } },
  { key: "hoa_quyen", label: "Hóa Quyền", scoreShift: 2, effects: { phyMult: 0.06, magMult: 0.06 } },
  { key: "hoa_khoa", label: "Hóa Khoa", scoreShift: 2, effects: { magMult: 0.06, breakBonus: 0.08 } },
  { key: "hoa_ky", label: "Hóa Kị", scoreShift: -3, effects: { sanDrainMult: 0.15, fortune: -15 } }
];

// Mỗi cách cục: score là điểm Cát(+) / Hung(-)
// effects dùng chung khóa với engine.js
const BASES = [
  { key: "tu_vi_de_toa", name: "Tử Vi Đế Tọa", sign: "cat", score: 16, effects: { fortune: 40, magMult: 0.10, resistPossession: true }, desc: "Đế tinh chủ mệnh, quý hiển hơn người." },
  { key: "tu_vi_thien_phu", name: "Tử Vi Thiên Phủ Đồng Cung", sign: "cat", score: 15, effects: { phyMult: 0.08, magMult: 0.08, fortune: 30 }, desc: "Vừa khai sáng vừa thủ thành, công thủ lưỡng toàn." },
  { key: "tu_vi_tham_lang", name: "Tử Vi Tham Lang", sign: "cat", score: 9, effects: { lootMult: 1.4, fortune: 20 }, desc: "Đế tinh gặp dục tinh, cơ duyên hưởng lạc." },
  { key: "tu_vi_thien_tuong", name: "Tử Vi Thiên Tướng", sign: "cat", score: 11, effects: { magMult: 0.10, sanResist: 0.10 }, desc: "Tướng ấn quyền quý, tâm trí vững vàng." },
  { key: "tu_vi_that_sat", name: "Tử Vi Thất Sát", sign: "cat", score: 6, effects: { phyMult: 0.20, sanDrainMult: 0.15 }, desc: "Sát khí bị đế tinh chế ngự, thành uy nghiêm." },
  { key: "thien_co_thien_luong", name: "Thiên Cơ Thiên Lương", sign: "cat", score: 9, effects: { magMult: 0.12, breakBonus: 0.10 }, desc: "Cơ xảo gặp phúc tinh, mưu trí thanh cao." },
  { key: "thien_co_cu_mon", name: "Thiên Cơ Cự Môn", sign: "hung", score: -6, effects: { sanDrainMult: 0.25, magMult: -0.05 }, desc: "Cơ mưu bị ám tinh che lấp, dễ đa nghi." },
  { key: "thien_co_thai_am", name: "Thiên Cơ Thái Âm", sign: "cat", score: 8, effects: { magMult: 0.10, fortune: 25 }, desc: "Cơ xảo phối nguyệt, nội liễm thông minh." },
  { key: "thai_duong_thien_luong", name: "Thái Dương Thiên Lương", sign: "cat", score: 10, effects: { lightFireMult: 1.3, fortune: 25 }, desc: "Nhật lệ trung thiên, quang minh lỗi lạc." },
  { key: "thai_duong_cu_mon", name: "Thái Dương Cự Môn", sign: "cat", score: 7, effects: { lightFireMult: 1.4, sanResist: 0.08 }, desc: "Nhật chiếu ám tinh, thị phi hóa quang minh." },
  { key: "thai_duong_thai_am", name: "Thái Dương Thái Âm", sign: "cat", score: 12, effects: { magMult: 0.08, phyMult: 0.08, fortune: 35 }, desc: "Nhật nguyệt tịnh minh, âm dương điều hòa." },
  { key: "vu_khuc_thien_phu", name: "Vũ Khúc Thiên Phủ", sign: "cat", score: 11, effects: { phyMult: 0.10, lootMult: 1.5 }, desc: "Tài tinh gặp khố tinh, phú quý song toàn." },
  { key: "vu_khuc_tham_lang", name: "Vũ Khúc Tham Lang", sign: "cat", score: 9, effects: { phyMult: 0.12, lootMult: 1.6 }, desc: "Vũ Tham đồng hành, vừa tài vừa lộc." },
  { key: "vu_khuc_that_sat", name: "Vũ Khúc Thất Sát", sign: "hung", score: -5, effects: { phyMult: 0.15, sanDrainMult: 0.20 }, desc: "Tài tinh gặp sát, quyết liệt mà hao tổn." },
  { key: "vu_khuc_pha_quan", name: "Vũ Khúc Phá Quân", sign: "hung", score: -6, effects: { phyMult: 0.15, breakFailPenalty: true }, desc: "Vũ Phá xung kích, biến động không ngừng." },
  { key: "thien_dong_thai_am", name: "Thiên Đồng Thái Âm", sign: "cat", score: 8, effects: { sanResist: 0.15, fortune: 20 }, desc: "Phúc tinh gặp nguyệt, nội tâm yên bình." },
  { key: "thien_dong_cu_mon", name: "Thiên Đồng Cự Môn", sign: "hung", score: -5, effects: { sanDrainMult: 0.20, fortune: -10 }, desc: "Phúc tinh bị ám, tâm sự khó tỏ." },
  { key: "thien_dong_thien_luong", name: "Thiên Đồng Thiên Lương", sign: "cat", score: 8, effects: { sanResist: 0.15, breakBonus: 0.05 }, desc: "Đồng Lương song phúc, thọ lộc an khang." },
  { key: "liem_trinh_tham_lang", name: "Liêm Trinh Tham Lang", sign: "hung", score: -7, effects: { sanDrainMult: 0.30, lootMult: 1.3 }, desc: "Liêm Tham đào hoa, đa tình dễ đọa." },
  { key: "liem_trinh_thien_tuong", name: "Liêm Trinh Thiên Tướng", sign: "cat", score: 8, effects: { magMult: 0.10, sanResist: 0.10 }, desc: "Liêm Tướng thanh quý, cương nhu đắc thế." },
  { key: "liem_trinh_that_sat", name: "Liêm Trinh Thất Sát", sign: "hung", score: -8, effects: { phyMult: 0.15, sanDrainMult: 0.30 }, desc: "Liêm Sát hội, sát khí lẫm liệt." },
  { key: "liem_trinh_pha_quan", name: "Liêm Trinh Phá Quân", sign: "hung", score: -9, effects: { phyMult: 0.15, breakFailPenalty: true }, desc: "Liêm Phá biến động, dễ phá rồi lập." },
  { key: "thien_phu_vu_khuc", name: "Thiên Phủ Vũ Khúc", sign: "cat", score: 10, effects: { lootMult: 1.5, phyMult: 0.08 }, desc: "Khố tinh gặp tài tinh, tích tụ phú quý." },
  { key: "thien_phu_liem_trinh", name: "Thiên Phủ Liêm Trinh", sign: "cat", score: 9, effects: { magMult: 0.08, sanResist: 0.10 }, desc: "Phủ Liêm an định, tâm chính khí hòa." },
  { key: "thai_am_thien_dong", name: "Thái Âm Thiên Đồng", sign: "cat", score: 8, effects: { magMult: 0.10, sanResist: 0.12 }, desc: "Nguyệt đồng thủ mệnh, thanh nhã điềm tĩnh." },
  { key: "thai_am_thien_co", name: "Thái Âm Thiên Cơ", sign: "cat", score: 7, effects: { magMult: 0.12, fortune: 15 }, desc: "Nguyệt cơ cơ xảo, thông tuệ nội liễm." },
  { key: "tham_lang_vu_khuc", name: "Tham Lang Vũ Khúc", sign: "cat", score: 9, effects: { phyMult: 0.10, lootMult: 1.6 }, desc: "Tham Vũ tài lộc, dũng mãnh cầu tài." },
  { key: "tham_lang_liem_trinh", name: "Tham Lang Liêm Trinh", sign: "hung", score: -6, effects: { sanDrainMult: 0.25, lootMult: 1.2 }, desc: "Tham Liêm đào hoa, dễ sa ngã." },
  { key: "cu_mon_thai_duong", name: "Cự Môn Thái Dương", sign: "cat", score: 7, effects: { lightFireMult: 1.3, sanResist: 0.10 }, desc: "Cự Nhật quang minh, thị phi được chiếu sáng." },
  { key: "cu_mon_thien_co", name: "Cự Môn Thiên Cơ", sign: "hung", score: -6, effects: { sanDrainMult: 0.25, magMult: -0.05 }, desc: "Cự Cơ trôi nổi, khẩu thiệt đa nghi." },
  { key: "cu_mon_thien_dong", name: "Cự Môn Thiên Đồng", sign: "hung", score: -5, effects: { sanDrainMult: 0.20, fortune: -10 }, desc: "Cự Đồng ám ẩn, nội tâm u uất." },
  { key: "thien_tuong_tu_vi", name: "Thiên Tướng Tử Vi", sign: "cat", score: 10, effects: { magMult: 0.10, sanResist: 0.12 }, desc: "Tướng ấn đế tinh, quyền quý thanh cao." },
  { key: "thien_tuong_liem_trinh", name: "Thiên Tướng Liêm Trinh", sign: "cat", score: 8, effects: { sanResist: 0.12, magMult: 0.08 }, desc: "Tướng Liêm cương trực, giữ vững chính đạo." },
  { key: "thien_luong_thai_duong", name: "Thiên Lương Thái Dương", sign: "cat", score: 10, effects: { lightFireMult: 1.3, breakBonus: 0.08 }, desc: "Lương Nhật quang minh, thanh quý lỗi lạc." },
  { key: "thien_luong_thien_dong", name: "Thiên Lương Thiên Đồng", sign: "cat", score: 8, effects: { sanResist: 0.15, lifespanBonus: 10 }, desc: "Lương Đồng phúc thọ, tâm thần an lạc." },
  { key: "that_sat_tu_vi", name: "Thất Sát Tử Vi", sign: "hung", score: -4, effects: { phyMult: 0.20, sanDrainMult: 0.15 }, desc: "Sát đế tranh hùng, uy nghiêm khắc nghiệt." },
  { key: "that_sat_liem_trinh", name: "Thất Sát Liêm Trinh", sign: "hung", score: -7, effects: { phyMult: 0.18, sanDrainMult: 0.28 }, desc: "Sát Liêm lẫm liệt, dễ bị thương tổn." },
  { key: "that_sat_vu_khuc", name: "Thất Sát Vũ Khúc", sign: "hung", score: -5, effects: { phyMult: 0.18, breakFailPenalty: true }, desc: "Sát Vũ quyết liệt, biến động chồng chất." },
  { key: "pha_quan_vu_khuc", name: "Phá Quân Vũ Khúc", sign: "hung", score: -7, effects: { phyMult: 0.15, breakFailPenalty: true }, desc: "Phá Vũ xung phá, đại khởi đại lạc." },
  { key: "pha_quan_liem_trinh", name: "Phá Quân Liêm Trinh", sign: "hung", score: -8, effects: { phyMult: 0.15, sanDrainMult: 0.25 }, desc: "Phá Liêm biến loạn, dễ lạc lối." },
  { key: "tam_ky_gia_hoi", name: "Tam Kỳ Gia Hội", sign: "cat", score: 18, effects: { fortune: 60, magMult: 0.12, phyMult: 0.08 }, desc: "Lộc Quyền Khoa hội tụ, phú quý danh vọng." },
  { key: "van_que_van_hoa", name: "Văn Quế Văn Hoa", sign: "cat", score: 9, effects: { magMult: 0.10, breakBonus: 0.10 }, desc: "Xương Khúc tọa thủ, văn hoa nho nhã." },
  { key: "menh_ly_phung_khong", name: "Mệnh Lý Phùng Không", sign: "hung", score: -10, effects: { allStatMult: -0.10, fortune: -20 }, desc: "Không Kiếp thủ mệnh, cầu danh lợi khó thành." },
  { key: "cu_phung_tu_sat", name: "Cự Phùng Tứ Sát", sign: "hung", score: -12, effects: { sanDrainMult: 0.40, fortune: -25 }, desc: "Cự Môn gặp tứ sát, lưu lạc thị phi." },
  { key: "dan_tri_que_tri", name: "Đan Trì Quế Trì", sign: "cat", score: 13, effects: { lightFireMult: 1.5, fortune: 40 }, desc: "Nhật nguyệt đắc địa, tài hoa hiển đạt." },
  { key: "ta_huu_dong_cung", name: "Tả Hữu Đồng Cung", sign: "cat", score: 10, effects: { phyMult: 0.06, magMult: 0.06, fortune: 25 }, desc: "Phụ Bật đồng cung, trợ lực dồi dào." },
  { key: "thach_trung_an_ngoc", name: "Thạch Trung Ẩn Ngọc", sign: "cat", score: 11, effects: { magMult: 0.12, sanResist: 0.10 }, desc: "Tài năng nội liễm, anh hoa không lộ." },
  { key: "nhat_nguyet_tinh_minh", name: "Nhật Nguyệt Tịnh Minh", sign: "cat", score: 13, effects: { lightFireMult: 1.4, fortune: 35 }, desc: "Nhật nguyệt đều sáng, âm dương hòa hợp." },
  { key: "van_tinh_cung_menh", name: "Văn Tinh Củng Mệnh", sign: "cat", score: 8, effects: { magMult: 0.08, breakBonus: 0.08 }, desc: "Văn tinh vây chiếu, học vấn hanh thông." },
  { key: "loc_ma_giao_tri", name: "Lộc Mã Giao Trì", sign: "cat", score: 9, effects: { lootMult: 1.5, fortune: 25 }, desc: "Lộc tồn Thiên mã, tài lộc hanh thông." },
  { key: "minh_loc_am_loc", name: "Minh Lộc Ám Lộc", sign: "cat", score: 9, effects: { lootMult: 1.4, fortune: 20 }, desc: "Lộc tồn hóa lộc tương hội, phú quý ngầm." },
  { key: "khoa_minh_loc_am", name: "Khoa Minh Lộc Ám", sign: "cat", score: 8, effects: { magMult: 0.08, breakBonus: 0.08 }, desc: "Nhờ danh đắc lộc, văn danh quý hiển." },
  { key: "thien_la_dia_vong", name: "Thiên La Địa Võng", sign: "hung", score: -8, effects: { allStatMult: -0.08, fortune: -15 }, desc: "Rơi vào lưới trời, khó phá vòng vây." },
  { key: "kiep_sat_chieu_menh", name: "Kiếp Sát Chiếu Mệnh", sign: "hung", score: -11, effects: { lifespanMult: -0.10, sanDrainMult: 0.20 }, desc: "Kiếp sát xung chiếu, tai ách đeo mang." },
  { key: "hinh_ky_giap_an", name: "Hình Kị Giáp Ấn", sign: "hung", score: -9, effects: { sanDrainMult: 0.30, fortune: -15 }, desc: "Hình kị giáp mệnh, thị phi kiện tụng." },
  { key: "tai_am_giap_an", name: "Tài Ấm Giáp Ấn", sign: "cat", score: 10, effects: { lootMult: 1.4, sanResist: 0.10 }, desc: "Tài tinh ấm tinh giáp cung, phú quý an ổn." },
  { key: "vu_tham_dong_hanh", name: "Vũ Tham Đồng Hành", sign: "cat", score: 9, effects: { phyMult: 0.10, lootMult: 1.5 }, desc: "Vũ Tham đồng hành, tài lộc song thu." },
  { key: "that_sat_trieu_dau", name: "Thất Sát Triều Đẩu", sign: "cat", score: 8, effects: { phyMult: 0.15, fortune: 10 }, desc: "Sát tinh triều đẩu, dũng mãnh vượt trội." },
  { key: "co_nguyet_dong_luong", name: "Cơ Nguyệt Đồng Lương", sign: "cat", score: 9, effects: { magMult: 0.10, sanResist: 0.12 }, desc: "Cơ nguyệt đồng lương, phúc trí thanh cao." },
  { key: "sat_pha_lang_hoi", name: "Sát Phá Lang Hội", sign: "hung", score: -10, effects: { phyMult: 0.20, sanDrainMult: 0.30 }, desc: "Sát Phá Tham hội, biến động đại khởi đại lạc." }
];

function round(v) {
  return Math.round(v * 100) / 100;
}

function scaleEffects(effects, mult) {
  const out = {};
  for (const k in effects) {
    const v = effects[k];
    if (typeof v === "number") {
      out[k] = round(v * mult);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function gradeOf(score) {
  const abs = Math.abs(score);
  if (abs >= 14) return "kim";
  if (abs >= 10) return "tim";
  if (abs >= 6) return "lam";
  if (abs >= 2) return "trang";
  return "xam";
}

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

function main() {
  const fates = [];
  const seen = new Set();

  for (const base of BASES) {
    for (const cung of CUNGS) {
      for (const lv of LEVELS) {
        for (const hd of [null, ...HOADIEU]) {
          let score;
          if (base.sign === "cat") {
            score = Math.round(base.score * lv.mult) + lv.catShift;
          } else {
            score = Math.round(base.score * lv.mult) + lv.hungShift;
          }
          if (hd) score += hd.scoreShift;
          // clamp hung <= -1, cat >= 1
          if (base.sign === "cat") score = Math.max(1, score);
          else score = Math.min(-1, score);

          let effects = scaleEffects(base.effects, lv.mult);
          if (hd) {
            effects = { ...effects, ...hd.effects };
          }
          const suffix = hd ? " · " + hd.label : "";
          const name = base.name + " · " + cung + " · " + lv.label + suffix;
          const id = slugify(base.key + "_" + cung + "_" + lv.key + (hd ? "_" + hd.key : ""));

          if (seen.has(id)) continue;
          seen.add(id);

          fates.push({
            id,
            name,
            sign: base.sign,
            grade: gradeOf(score),
            score,
            effects,
            desc: base.desc + " (Mệnh cung " + cung + (hd ? ", " + hd.label : "") + ")"
          });
        }
      }
    }
  }

const outPath = path.join(__dirname, "..", "data", "fate_data.js");
  const json = JSON.stringify(fates);
  const content = "/* CỔ DỊ DIỆN — 2000+ Mệnh Số (tự sinh từ cách cục Tử Vi) */\nwindow.FATE_DATA = " + json + ";\n";
  fs.writeFileSync(outPath, content, "utf8");
  console.log("Generated " + fates.length + " fates -> " + outPath);
  console.log("Unique ids: " + seen.size);
}

main();
