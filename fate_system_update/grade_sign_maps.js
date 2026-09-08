// grade_sign_maps.js — 2 bảng map bắt buộc dùng chung, chặn lỗi so sánh sai giữa
// fate_data.js (dùng `grade` string, `sign` code) và fate_relationships.js (dùng `tier` số, `type` nhãn đầy đủ)

const GRADE_TO_TIER = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };
const TIER_TO_GRADE = Object.fromEntries(Object.entries(GRADE_TO_TIER).map(([g, t]) => [t, g]));

const SIGN_TO_TYPE_LABEL = { cat: "Cát Cách", hung: "Hung Cách", binh: "Bình Cách" };
const TYPE_LABEL_TO_SIGN = Object.fromEntries(Object.entries(SIGN_TO_TYPE_LABEL).map(([s, l]) => [l, s]));

module.exports = { GRADE_TO_TIER, TIER_TO_GRADE, SIGN_TO_TYPE_LABEL, TYPE_LABEL_TO_SIGN };
