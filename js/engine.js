/* ============================================================
 * CỔ DỊ DIỆN — Game Engine (deterministic state machine)
 * Tham chiếu: gemini-code-1788421511033.md
 * ============================================================ */
window.GameEngine = (function () {
  "use strict";
  const D = () => window.GameData;

  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function realmById(id) {
    return D().REALMS.find((realm) => realm.id === id || (realm.legacyIds || []).includes(id)) || D().REALMS[0];
  }

  function realmLevelOf(character) {
    return Number(realmById(character.realmId).level || 1);
  }

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
  const START_LOCATIONS = {
    trung_vuc: "son_mon", dong_hoang: "hac_lam", tay_mac: "tay_mac_khoi_diem",
    nam_chuong: "linh_dien", bac_nguyen: "bac_nguyen_khoi_diem", vo_tan_hai: "vo_tan_hai_khoi_diem",
    thien_khong_vuc: "thien_khong_khoi_diem", u_minh_gioi: "u_minh_khoi_diem"
  };
  const ORIGIN_SITUATIONS = {
    trung_vuc: [
      { id: "tan_tu_luu_lac", title: "Tán Tu Lưu Lạc", startLocationId: "van_phong", questSeed: "thu_linh_thao" },
      { id: "the_gia_suy_tan", title: "Thế Gia Suy Tàn", startLocationId: "truyen_phap", questSeed: "co_tich" },
      { id: "ke_song_sot", title: "Kẻ Sống Sót Tai Biến", startLocationId: "cam_dia", questSeed: "bi_mat_cam_dia" }
    ],
    dong_hoang: [
      { id: "tan_tu_luu_lac", title: "Tán Tu Lưu Lạc", startLocationId: "hac_lam", questSeed: "cursed" },
      { id: "ke_song_sot", title: "Kẻ Sống Sót Tai Biến", startLocationId: "co_mieu", questSeed: "cursed" }
    ],
    vo_tan_hai: [
      { id: "nguoi_duoc_cuu", title: "Người Được Cứu", startLocationId: "vo_tan_hai_khoi_diem", questSeed: "nhan_mon" },
      { id: "tan_tu_luu_lac", title: "Tán Tu Lưu Lạc", startLocationId: "vo_tan_hai_khoi_diem", questSeed: "thu_linh_thao" }
    ]
  };
  function rollOriginSituation(regionId) {
    const pool = ORIGIN_SITUATIONS[regionId] || [{ id: "tan_tu_luu_lac", title: "Tán Tu Lưu Lạc", startLocationId: START_LOCATIONS[regionId], questSeed: "thu_linh_thao" }];
    return { ...pool[rnd(0, pool.length - 1)] };
  }
  const START_REGION_RULES = {
    thien_khong_vuc: { minRealm: 7, reason: "Thiên Không Vực nằm ngoài cương phong; chỉ tu sĩ từ Hư Giới Cảnh mới đủ sức vượt tầng mây." },
    u_minh_gioi: { minRealm: 10, reason: "U Minh Giới là khe nứt tử vực; chỉ tồn tại từ Chủ Tể Cảnh mới có thể chống u minh đồng hóa." }
  };

  function startRegionEligibility(regionId, realmLevel = 1) {
    const region = D().WORLD_MAP?.regions?.find((item) => item.id === regionId);
    if (!region) return { eligible: false, minRealm: 1, reason: "Vùng xuất thân không tồn tại." };
    const rule = START_REGION_RULES[regionId] || { minRealm: 1, reason: "Phàm nhân có thể sinh tồn và bắt đầu hành trình tại đây." };
    return { eligible: Number(realmLevel || 1) >= rule.minRealm, ...rule, region };
  }

  function availableStartRegions(realmLevel = 1) {
    return (D().WORLD_MAP?.regions || []).filter((region) => startRegionEligibility(region.id, realmLevel).eligible);
  }
  const PERSONALITY_POOL = ["Chính trực", "Tàn nhẫn", "Tham lam", "Trung thành", "Cơ trí", "Lỗ mãng", "Lãnh đạm", "Nhiệt huyết", "Xảo quyệt", "Ẩn nhẫn"];
  const BACKGROUND_POOL = ["Tông Môn", "Thế Gia", "Tán Tu", "Hắc Đạo", "Vô Danh"];
  const HIDDEN_GOALS = ["Báo thù", "Tìm cơ duyên", "Bảo vệ môn phái", "Thống nhất vùng", "Trốn tránh quá khứ", "Trường sinh"];
  const COMMON_ROOTS = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
  const EXOTIC_ROOTS = ["Băng", "Lôi", "Phong", "Âm", "Dương", "Không Gian"];
  const TAINTED_GODS = ["Hắc Nhật", "Vạn Diện Mẫu", "Kẻ Gõ Cửa", "Tử Hải Chi Chủ"];

  function weightedValue(entries) {
    let roll = Math.random() * entries.reduce((sum, entry) => sum + entry[1], 0);
    for (const entry of entries) {
      roll -= entry[1];
      if (roll < 0) return entry[0];
    }
    return entries[entries.length - 1][0];
  }

  function sampleDistinct(pool, count) {
    const available = pool.slice();
    const result = [];
    while (result.length < count && available.length) {
      result.push(available.splice(rnd(0, available.length - 1), 1)[0]);
    }
    return result;
  }

  function gaussianAttribute() {
    const u1 = Math.max(Number.EPSILON, Math.random());
    const u2 = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return clamp(Math.round(50 + normal * 15), 1, 100);
  }

  const WUXING_CYCLE = ["Kim", "Thủy", "Mộc", "Hỏa", "Thổ"];

  function countBits(mask) {
    let count = 0;
    while (mask) { count += mask & 1; mask >>= 1; }
    return count;
  }

  function allCombinations(pool, size) {
    const results = [];
    const total = pool.length;
    for (let mask = 0; mask < (1 << total); mask += 1) {
      if (countBits(mask) !== size) continue;
      results.push(pool.filter((_, index) => mask & (1 << index)));
    }
    return results;
  }

  function isExoticRoot(root) {
    return EXOTIC_ROOTS.some((exotic) => String(root).includes(exotic));
  }

  function wuxingIndex(root) {
    return WUXING_CYCLE.indexOf(String(root));
  }

  function pairHarmonyScore(a, b) {
    if (isExoticRoot(a) || isExoticRoot(b)) return 0;
    const ia = wuxingIndex(a); const ib = wuxingIndex(b);
    if (ia < 0 || ib < 0) return 0;
    if (ib === (ia + 1) % 5) return 2;
    if (ia === (ib + 1) % 5) return 1;
    if (ib === (ia + 2) % 5) return -2;
    return -1;
  }

  function pairRelation(a, b) {
    if (isExoticRoot(a) || isExoticRoot(b)) return "neutral";
    const ia = wuxingIndex(a); const ib = wuxingIndex(b);
    if (ia < 0 || ib < 0) return "neutral";
    if (ib === (ia + 1) % 5 || ia === (ib + 1) % 5) return "sinh";
    return "khắc";
  }

  function harmonyScoreOf(elements) {
    let score = 0;
    for (let i = 0; i < elements.length; i += 1) {
      for (let j = i + 1; j < elements.length; j += 1) {
        score += pairHarmonyScore(elements[i], elements[j]);
      }
    }
    return score;
  }

  function validHarmonySets() {
    const sets = [];
    for (let size = 2; size <= 3; size += 1) {
      allCombinations(COMMON_ROOTS, size).forEach((elements) => {
        let allPositive = true;
        for (let i = 0; i < elements.length && allPositive; i += 1) {
          for (let j = i + 1; j < elements.length; j += 1) {
            if (pairHarmonyScore(elements[i], elements[j]) <= 0) { allPositive = false; break; }
          }
        }
        if (allPositive) sets.push(elements);
      });
    }
    return sets;
  }

  function rollSpiritualRootBranch() {
    const roll = Math.random() * 100;
    if (roll < 50) {
      const count = rnd(4, 5);
      return { branch: "tap", count, elements: sampleDistinct(COMMON_ROOTS, count) };
    }
    if (roll < 85) {
      const count = rnd(2, 3);
      return { branch: "song_tam", count, elements: sampleDistinct(COMMON_ROOTS, count) };
    }
    if (roll < 95) return { branch: "don", count: 1, elements: sampleDistinct(COMMON_ROOTS, 1) };
    if (roll < 99) {
      const sets = validHarmonySets();
      const chosen = sets[rnd(0, sets.length - 1)] || sampleDistinct(COMMON_ROOTS, 2);
      return { branch: "hiem", count: chosen.length, elements: chosen.slice() };
    }
    return { branch: "di", count: 1, elements: sampleDistinct(EXOTIC_ROOTS, 1) };
  }

  function rollSpiritualRoots() {
    return rollSpiritualRootBranch().elements;
  }

  function spiritualRootGrade(roots) {
    return spiritualRootProfile({ spiritualRoots: roots }).label;
  }

  function spiritualRootLabel(branch, count) {
    if (branch === "di") return "Dị Linh Căn";
    if (branch === "don") return "Đơn Linh Căn";
    if (branch === "hiem") return count === 2 ? "Song Linh Căn Hiếm" : "Tam Linh Căn Hiếm";
    if (branch === "tap") return count === 4 ? "Tứ Linh Căn (Phế)" : "Ngũ Hành Câu Toàn (Phế Linh Căn)";
    if (branch === "song_tam") return count === 2 ? "Song Linh Căn" : "Tam Linh Căn";
    return count === 1 ? "Đơn Linh Căn" : "Linh Căn Chưa Định";
  }

  const LINH_CAN_STATS = {
    "Dị Linh Căn": { purity: 130, exp: 2.0 },
    "Đơn Linh Căn": { purity: 100, exp: 1.5 },
    "Song Linh Căn Hiếm": { purity: 85, exp: 1.35 },
    "Song Linh Căn": { purity: 70, exp: 1.2 },
    "Tam Linh Căn Hiếm": { purity: 60, exp: 1.1 },
    "Tam Linh Căn": { purity: 50, exp: 1.0 },
    "Tứ Linh Căn (Phế)": { purity: 30, exp: 0.8 },
    "Ngũ Hành Câu Toàn (Phế Linh Căn)": { purity: 10, exp: 0.5 }
  };

  const LINH_CAN_PAIR_NAMES = {
    "Kim+Thủy": "Kim Thủy Tương Hàm",
    "Thủy+Mộc": "Thủy Mộc Sinh Cơ",
    "Mộc+Hỏa": "Mộc Hỏa Viêm Sinh",
    "Hỏa+Thổ": "Hỏa Thổ Tương Bồi",
    "Kim+Thổ": "Thổ Kim Tương Dưỡng",
    "Kim+Mộc": "Kim Mộc Tương Tàn",
    "Mộc+Thổ": "Mộc Thổ Tương Tranh",
    "Thổ+Thủy": "Thổ Thủy Tương Úng",
    "Thủy+Hỏa": "Thủy Hỏa Bất Dung",
    "Kim+Hỏa": "Hỏa Luyện Chân Kim"
  };

  function pairKey(a, b) {
    const elements = [a, b].sort((x, y) => wuxingIndex(x) - wuxingIndex(y));
    return elements.join("+");
  }

  function cachCucInfo(elements, harmonyScore) {
    const count = elements.length;
    if (count === 1) {
      if (isExoticRoot(elements[0])) return { name: "Dị Linh Căn — " + elements[0], alignment: harmonyScore > 0 ? "cat" : harmonyScore < 0 ? "hung" : "trung" };
      return { name: "Thuần " + elements[0] + " Chi Thể", alignment: harmonyScore > 0 ? "cat" : harmonyScore < 0 ? "hung" : "trung" };
    }
    if (count === 2) {
      const name = LINH_CAN_PAIR_NAMES[pairKey(elements[0], elements[1])] || "Song Linh Căn";
      const alignment = pairKey(elements[0], elements[1]) === "Kim+Hỏa" ? "cat" : (harmonyScore > 0 ? "cat" : harmonyScore < 0 ? "hung" : "trung");
      return { name, alignment };
    }
    if (count === 3) {
      let sinhCount = 0; let khacCount = 0;
      for (let i = 0; i < 3; i += 1) {
        for (let j = i + 1; j < 3; j += 1) {
          const relation = pairRelation(elements[i], elements[j]);
          if (relation === "sinh") sinhCount += 1;
          if (relation === "khắc") khacCount += 1;
        }
      }
      const name = sinhCount === 3 ? "Tam Hành Liên Hoàn Sinh" : khacCount === 3 ? "Tam Hành Loạn Khắc" : sinhCount === 2 ? "Tam Hành Nhị Sinh Nhất Khắc" : khacCount === 2 ? "Tam Hành Nhị Khắc Nhất Sinh" : "Tam Hành Quân Bình";
      return { name, alignment: harmonyScore > 0 ? "cat" : harmonyScore < 0 ? "hung" : "trung" };
    }
    if (count === 4) {
      const missing = WUXING_CYCLE.find((root) => !elements.includes(root));
      return { name: "Tứ Hành Khuyết " + missing, alignment: harmonyScore > 0 ? "cat" : harmonyScore < 0 ? "hung" : "trung" };
    }
    if (count === 5) return { name: "Ngũ Hành Câu Toàn", alignment: harmonyScore > 0 ? "cat" : harmonyScore < 0 ? "hung" : "trung" };
    return { name: null, alignment: "trung" };
  }

  function inferRootBranch(character, elements) {
    if (character?.spiritualRootBranch) return character.spiritualRootBranch;
    const count = elements.length;
    if (count === 0) return "unknown";
    if (count === 1) return isExoticRoot(elements[0]) ? "di" : "don";
    if (elements.some(isExoticRoot)) return "hiem";
    if (count === 4 || count === 5) return "tap";
    return "song_tam";
  }

  function spiritualRootProfile(character) {
    const rawRoots = Array.isArray(character?.spiritualRoots) ? character.spiritualRoots : [];
    const elements = rawRoots.map((root) => String(root).replace(/\s*\(.*\)\s*$/, "").trim()).filter(Boolean);
    const count = elements.length;
    const aptitude = clamp(Number(character?.aptitude ?? 50), 1, 100);
    const branch = inferRootBranch(character, elements);
    const label = spiritualRootLabel(branch, count);
    const harmonyScore = harmonyScoreOf(elements);
    const base = LINH_CAN_STATS[label] || { purity: 50, exp: 1.0 };

    let dampingFactor = 1;
    if (harmonyScore < 0) {
      dampingFactor = clamp(1 - ((aptitude - 50) / 100), 0.3, 1.8);
    }
    const effectiveHarmonyScore = harmonyScore < 0 ? harmonyScore * dampingFactor : harmonyScore;

    const purityScoreFinal = clamp(base.purity * (1 + effectiveHarmonyScore * 0.05), 10, 200);
    const expMultiplierLinhCanFinal = clamp(base.exp * (1 + effectiveHarmonyScore * 0.03), 0.3, 3.0);
    const expMultiplierTotal = expMultiplierLinhCanFinal * (aptitude / 50);
    const cachCuc = cachCucInfo(elements, harmonyScore);

    return {
      label, elements, count, branch,
      harmonyScore,
      aptitude,
      dampingFactor,
      effectiveHarmonyScore,
      cachCucName: cachCuc.name,
      cachCucAlignment: cachCuc.alignment,
      purityScoreBase: base.purity,
      purityScoreFinal,
      expMultiplierLinhCanBase: base.exp,
      expMultiplierLinhCanFinal,
      expMultiplierTotal
    };
  }

  function archetypeForRoots(roots) {
    const text = roots.join(" ");
    if (/Lôi|Phong|Kim/.test(text)) return "kiem_tong";
    if (/Mộc|Thủy|Băng/.test(text)) return "van_duoc";
    if (/Âm|Dương|Không Gian/.test(text)) return "am_duong";
    return "huyen_co";
  }

  /* ---------- Công thức Fate Ratio ---------- */
  const GRADE_TO_TIER = Object.freeze({ phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 });
  const TIER_TO_GRADE = Object.freeze(Object.fromEntries(Object.entries(GRADE_TO_TIER).map(([grade, tier]) => [tier, grade])));
  const SIGN_TO_TYPE_LABEL = Object.freeze({ cat: "Cát Cách", binh: "Bình Cách", hung: "Hung Cách" });
  const TYPE_LABEL_TO_SIGN = Object.freeze(Object.fromEntries(Object.entries(SIGN_TO_TYPE_LABEL).map(([sign, label]) => [label, sign])));
  const FATE_MODIFIER_KEYS = new Set(["magMult", "phyMult", "allStatMult", "lifespanBonus", "hpRegen", "qiFlat", "phyFlat", "maxQiPct", "qiRecoveryPct", "maxStaminaPct", "combatDamagePct", "cultivationSpeedPct"]);

  function fateGradeTier(value) {
    if (typeof value === "number") return clamp(Math.floor(value), 1, 8);
    return GRADE_TO_TIER[String(value || "").toLowerCase()] || 1;
  }
  function fateSign(fate) {
    if (!fate) return "binh";
    if (fate.sign && SIGN_TO_TYPE_LABEL[fate.sign]) return fate.sign;
    return TYPE_LABEL_TO_SIGN[fate.type] || "binh";
  }
  function fateElement(fate) {
    const text = normalizedText([fate?.name, fate?.desc].filter(Boolean).join(" "));
    const keys = {
      kim: ["kim", "kiem", "dao", "sat", "sac ben", "chien"],
      moc: ["moc", "sinh truong", "cay", "sinh soi", "hoi phuc"],
      thuy: ["thuy", "nuoc", "linh hoat", "dong chay", "bien"],
      hoa: ["hoa", "lua", "thieu dot", "nhiet", "bung no"],
      tho: ["tho", "dat", "son", "vung chac", "tran", "on dinh"]
    };
    let best = "vo_he"; let bestScore = 0;
    Object.entries(keys).forEach(([element, words]) => {
      const score = words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
      if (score > bestScore) { best = element; bestScore = score; }
    });
    return fate?.element || best;
  }
  function fatePathAffinity(fate) {
    if (fate?.path_affinity) return fate.path_affinity;
    const text = fateTags(fate);
    const affinity = { lead: [], support: [], forbidden: [] };
    Object.entries(window.PATH_FATE_RELATIONS?.paths || {}).forEach(([pathId, relation]) => {
      if (relation.unbound) return;
      const hit = (relation.lead || []).filter((tag) => text.includes(normalizedText(tag))).length;
      const support = (relation.support || []).filter((tag) => text.includes(normalizedText(tag))).length;
      // Forbidden chỉ đến từ bảng chủ đề đã review, không suy luận từ việc thiếu match.
      const forbidden = (relation.forbidden || []).filter((tag) => text.includes(normalizedText(tag))).length;
      if (hit > 0) affinity.lead.push(pathId);
      else if (support > 0) affinity.support.push(pathId);
      if (forbidden > 0) affinity.forbidden.push(pathId);
    });
    return affinity;
  }
  function splitFateEffects(fate) {
    const modifiers = {}; const conditionalEffects = {};
    Object.entries(fate?.effects || {}).forEach(([key, value]) => (FATE_MODIFIER_KEYS.has(key) ? modifiers : conditionalEffects)[key] = value);
    return { modifiers, conditionalEffects };
  }
  function fateDefinition(fate) {
    const source = fate?.id ? (D().FATE_PATTERNS.find((item) => item.id === fate.id) || fate) : fate;
    const split = splitFateEffects(source);
    return { ...source, alignment: fateSign(source), tier: fateGradeTier(source.grade ?? source.tier), element: fateElement(source), path_affinity: fatePathAffinity(source), modifiers: split.modifiers, conditionalEffects: split.conditionalEffects };
  }
  function fateRelationshipsFor(fateId) {
    const rel = (typeof window !== "undefined" && window.FATE_RELATIONSHIPS) || {};
    return (rel.pairwise_relationships || []).filter((edge) => edge.from === fateId || edge.to === fateId);
  }
  function fateCombosFor(fateId) {
    const rel = (typeof window !== "undefined" && window.FATE_RELATIONSHIPS) || {};
    return (rel.combo_sets || []).filter((combo) => (combo.members || []).some((member) => (member.id || member) === fateId));
  }
  function fateFusionRecipesFor(fateId) {
    const rel = (typeof window !== "undefined" && window.FATE_RELATIONSHIPS) || {};
    return (rel.fusion_recipes || []).filter((recipe) => (recipe.materials || []).some((member) => (member.id || member) === fateId));
  }

  function fateRelationshipRecord(character, fateId) {
    character.fateRelationships = character.fateRelationships || {};
    const record = character.fateRelationships[fateId] || { stage: 0, points: 0, eliteTrials: 0, alignedChoices: 0, resonanceUnlocked: false };
    record.stage = clamp(Number(record.stage || record.relationshipStage || 0), 0, 4);
    record.points = Math.max(0, Number(record.points || record.relationshipPoints || 0));
    character.fateRelationships[fateId] = record;
    return record;
  }
  function fateRelationshipStatus(character, fateId) {
    const labels = ["Sơ Ngộ", "Đồng Hành", "Tương Ứng", "Cộng Minh", "Nhân Mệnh Hợp Nhất"];
    const record = fateRelationshipRecord(character, fateId);
    return { ...record, label: labels[record.stage], fateId };
  }
  function nurtureFate(state, fateId) {
    const character = state.player; const active = (character.fates || []).includes(fateId);
    if (!active) return { success: false, reason: "Chỉ có thể Dưỡng Mệnh đang kích hoạt." };
    const record = fateRelationshipRecord(character, fateId);
    const cost = 5 + record.stage * 5;
    if (Number(state.inventory?.linh_thach || 0) < cost) return { success: false, reason: "Thiếu Linh Thạch để Dưỡng Mệnh.", cost };
    removeItem(state, "linh_thach", cost); record.points += 1; record.lastNurtureTurn = Number(state.meta?.turn || 0);
    if (record.stage === 0 && record.points >= 1) record.stage = 1;
    if (record.stage === 1 && record.points >= 4) record.stage = 2;
    pushHistory(state, { type: "sys", text: "Dưỡng Mệnh " + (D().FATE_PATTERNS.find((f) => f.id === fateId)?.name || fateId) + " · " + fateRelationshipStatus(character, fateId).label + "." });
    updateDerived(state); return { success: true, cost, status: fateRelationshipStatus(character, fateId) };
  }
  function resonateFate(state, fateId) {
    const character = state.player; const record = fateRelationshipRecord(character, fateId);
    const fate = D().FATE_PATTERNS.find((item) => item.id === fateId); const match = fateCompatibility(character.pathId, fate);
    const blockers = [];
    if (!(character.fates || []).includes(fateId)) blockers.push("Mệnh phải đang kích hoạt.");
    if (record.stage !== 2) blockers.push("Quan hệ phải ở bậc Tương Ứng.");
    if (match < 8) blockers.push("Tương hợp Con Đường cần đạt ít nhất 8/10.");
    if (Number(character.san || 0) < 10) blockers.push("Cần ít nhất 10 SAN.");
    if (blockers.length) return { success: false, blockers, match, status: fateRelationshipStatus(character, fateId) };
    drainSan(state, 10, "nghi thức Cộng Minh"); record.stage = 3; record.resonanceUnlocked = true;
    pushHistory(state, { type: "sys", text: "◇ Cộng Minh thành công với " + (fate?.name || fateId) + "." }); updateDerived(state);
    return { success: true, match, status: fateRelationshipStatus(character, fateId) };
  }

  function computeFate(character) {
    const patterns = D().FATE_PATTERNS;
    let total = 0;
    let normal = 0;
    (character.fates || []).forEach((f) => {
      const p = patterns.find((x) => x.id === f);
      if (!p) return;
      const evolutionScore = typeof window !== "undefined" && window.GameExpansion?.fateEvolutionScoreDelta
        ? window.GameExpansion.fateEvolutionScoreDelta(character, f)
        : 0;
      const score = Number(p.score || 0) + Number(character.fateEnhancements?.[f] || 0) * 2 + Number(evolutionScore || 0);
      total += score;
      if (fateSign(p) !== "hung") normal += score;
    });
    const realm = realmById(character.realmId);
    const minFate = Number(realm.minFate || 0);
    const debt = Number(character.fateDebt ?? character.fate?.debt ?? 0);
    const surplus = Number(character.fateSurplus ?? character.fate?.surplus ?? 0);
    const corruption = Number(character.corruptionRating ?? character.stats?.corruption ?? 0);
    return { total, normal, minFate, ratio: total / Math.max(1, Math.abs(normal)), effective: total + surplus * 2 - debt * 3 - corruption * 0.5, debt, surplus };
  }

  function fateEnhancementLevel(character, fateId) {
    return clamp(Math.floor(Number(character?.fateEnhancements?.[fateId] || 0)), 0, 5);
  }

  function enhancedFateEffects(character, fate) {
    const level = fateEnhancementLevel(character, fate?.id);
    const relationship = fate?.id && character ? fateRelationshipRecord(character, fate.id) : { stage: 0 };
    const multiplier = 1 + level * 0.05 + [0, 0.05, 0.10, 0.20, 0.35][clamp(Number(relationship.stage || 0), 0, 4)];
    const enhanced = Object.fromEntries(Object.entries(fate?.effects || {}).map(([key, value]) => {
      if (typeof value !== "number" || value <= 0) return [key, value];
      return [key, Number((value * multiplier).toFixed(3))];
    }));
    return typeof window !== "undefined" && window.GameExpansion?.applyFateEvolutionOps
      ? window.GameExpansion.applyFateEvolutionOps(character, fate, enhanced)
      : enhanced;
  }

  function fateState(character) {
    const fate = computeFate(character);
    const tier = realmLevelOf(character);
    const anchorBroken = (character.anchors || []).some((anchor) => anchor.broken);
    if (Number(character.corruptionRating || 0) >= 91 || anchorBroken) return "ELDRITCH_INTERVENTION";
    if (character.tainted?.faction === "loyal_heaven" && tier >= 11) return "NORMAL_GROWTH";
    if (fate.debt > fate.surplus || character.fateConflict) return "FATE_BACKFIRE";
    return "NORMAL_GROWTH";
  }

  /* ---------- Gieo Mệnh khởi tạo ---------- */
  function drawInitialFates(count = 5, minTotalScore = 6, realmId = "di_menh") {
    const gradeRank = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };
    const tierCapByRealm = {
      di_menh: 3, khai_lo: 3, dung_thai: 4,
      kim_an: 5, anh_linh: 6, than_tinh: 8
    };
    const cap = tierCapByRealm[realmId] || 2;
    const eligible = D().FATE_PATTERNS.filter((fate) => (gradeRank[fate.grade] || 1) <= cap);

    if (eligible.length < count) throw new Error("Fate Pool không đủ Mệnh Số hợp lệ.");

    function drawOnce() {
      const available = eligible.slice();
      const selected = [];
      while (selected.length < count) {
        const targetTier = realmId === "di_menh"
          ? weightedValue([[1, 65], [2, 30], [3, 5]])
          : null;
        let pool = targetTier == null ? available : available.filter((fate) => gradeRank[fate.grade] === targetTier);
        if (!pool.length) pool = available;
        const pick = pool[rnd(0, pool.length - 1)];
        selected.push(pick);
        available.splice(available.findIndex((fate) => fate.id === pick.id), 1);
      }
      return selected;
    }

    for (let attempt = 0; attempt < 500; attempt++) {
      const selected = drawOnce();
      if (selected.reduce((sum, fate) => sum + fate.score, 0) >= minTotalScore) {
        return selected.map((fate) => fate.id);
      }
    }

    // Fallback tất định để điều kiện điểm không bao giờ bị phá vỡ.
    const fallback = eligible
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
    if (fallback.reduce((sum, fate) => sum + fate.score, 0) < minTotalScore) {
      throw new Error("Fate Pool không thể tạo bộ Mệnh Số đạt điểm tối thiểu.");
    }
    return fallback.map((fate) => fate.id);
  }

  function rollCharacterCreation(regionId) {
    const region = D().WORLD_MAP?.regions?.find((item) => item.id === regionId);
    if (!region || !REGION_RACE_WEIGHTS[regionId]) throw new RangeError("Nơi bắt đầu không hợp lệ.");
    const eligibility = startRegionEligibility(regionId, 1);
    if (!eligibility.eligible) throw new RangeError(eligibility.reason);
    const rootRoll = rollSpiritualRootBranch();
    const spiritualRoots = rootRoll.elements;
    const spiritualRootBranch = rootRoll.branch;
    const archetypeId = archetypeForRoots(spiritualRoots);
    const originSituation = rollOriginSituation(regionId);
    const cultivationMethods = {
      kiem_tong: "Dẫn Khí Kiếm Quyết (Nhập môn)",
      huyen_co: "Huyền Cơ Nạp Khí Pháp (Nhập môn)",
      van_duoc: "Thanh Mộc Dưỡng Khí Kinh (Nhập môn)",
      am_duong: "Âm Dương Thổ Nạp Thuật (Nhập môn)"
    };
    const hiddenRate = window.PATH_FATE_RELATIONS?.hidden_fates?.luan_hoi_tien?.roll_probability_percent ?? 0.0000075;
    const hiddenFates = Math.random() < hiddenRate / 100 ? ["luan_hoi_tien"] : [];
    return {
      startRegionId: regionId,
      startLocationId: originSituation.startLocationId || START_LOCATIONS[regionId],
      originSituation,
      race: weightedValue(REGION_RACE_WEIGHTS[regionId]),
      realmId: "di_menh",
      aptitude: gaussianAttribute(),
      comprehension: gaussianAttribute(),
      spiritualRoots,
      spiritualRootBranch,
      personalityTraits: sampleDistinct(PERSONALITY_POOL, 2),
      background: BACKGROUND_POOL[rnd(0, BACKGROUND_POOL.length - 1)],
      hiddenGoal: HIDDEN_GOALS[rnd(0, HIDDEN_GOALS.length - 1)],
      basePhy: rnd(10, 20),
      baseMag: rnd(10, 20),
      baseFortune: rnd(0, 10),
      archetypeId,
      cultivationMethod: cultivationMethods[archetypeId],
      fates: drawInitialFates(5, 6, "di_menh"),
      hiddenFates,
      hiddenProfessionCandidate: hiddenFates.includes("luan_hoi_tien") ? "luan_hoi_tien" : null,
      hiddenProfession: null
    };
  }

  /* ---------- Quan hệ Mệnh Số ---------- */
  function computeRelationshipEffects(character) {
    const rel = D().FATE_RELATIONSHIPS || {};
    const owned = new Set(character.fates || []);
    const result = {
      activePairs: [],
      activeCombos: [],
      phyMult: 0,
      magMult: 0,
      allStatMult: 0,
      fortune: 0,
      madness: 0,
      sanDrainMult: 0,
      sanResist: 0
    };

    // pairwise (tương sinh/tương khắc)
    (rel.pairwise_relationships || []).forEach((p) => {
      if (owned.has(p.from) && owned.has(p.to)) {
        if (p.type === "TUONG_SINH") {
          result.phyMult += (p.bonusPct || 0) / 100;
          result.magMult += (p.bonusPct || 0) / 100;
        } else if (p.type === "TUONG_KHAC") {
          const penalty = (p.penaltyPct || 0) / 100;
          result.phyMult -= penalty;
          result.magMult -= penalty;
          result.madness += (p.madnessDelta || 5);
          result.sanDrainMult += 0.05;
        }
        result.activePairs.push(p);
      }
    });

    // combo sets
    (rel.combo_sets || []).forEach((c) => {
      const members = c.members || [];
      if (!members.length) return;
      const hasAll = members.every((m) => owned.has(m.id));
      if (!hasAll) return;
      result.activeCombos.push(c);
      const pct = (c.bonusPct || 0) / 100;
      if (c.isNghich) {
        result.allStatMult += pct;
        result.madness += (c.madnessDelta || 0);
      } else {
        result.phyMult += pct;
        result.magMult += pct;
        result.fortune += (c.fortuneBonus || 0);
      }
    });

    return result;
  }

  /* ---------- Stats ---------- */
  function sanStatus(character) {
    const value = clamp(Number(character?.san ?? 100), 0, Number(character?.maxSan || 100));
    if (value <= 0) return { id: "mat_tri", name: "Thần Thức Tịch Diệt", multiplier: 0, desc: "Thanh Tỉnh đã cạn; nhân vật rơi vào Mất Trí và chịu hình phạt Tha Hóa." };
    if (value < 25) return { id: "ran_vo", name: "Thần Thức Rạn Vỡ", multiplier: 0.75, desc: "Ý thức gần tan rã; Thể phách và Linh lực chỉ còn 75% hiệu quả." };
    if (value < 50) return { id: "ta_niem", name: "Tà Niệm Quấn Thân", multiplier: 0.9, desc: "Tà niệm xâm nhiễm; Thể phách và Linh lực chỉ còn 90% hiệu quả." };
    if (value < 75) return { id: "dao_dong", name: "Tâm Hồ Dao Động", multiplier: 0.98, desc: "Tâm cảnh bất ổn; Thể phách và Linh lực giảm nhẹ còn 98%." };
    return { id: "minh_triet", name: "Tâm Trí Minh Triệt", multiplier: 1, desc: "Thần thức ổn định, mọi chỉ số vận hành bình thường." };
  }

  function fortuneStatus(value) {
    const score = Math.round(Number(value || 0));
    if (score < 10) return { id: "tai_tinh", name: "Tai Tinh Chuyển Thế", min: 0, max: 9, desc: "Điềm dữ thường tìm đến; cơ duyên dễ hóa thành kiếp số." };
    if (score < 30) return { id: "menh_bac", name: "Mệnh Bạc Chi Nhân", min: 10, max: 29, desc: "Khí số mỏng, muốn đoạt cơ duyên phải trả giá nhiều hơn thường nhân." };
    if (score < 50) return { id: "pham_nhan", name: "Phàm Nhân Khí Vận", min: 30, max: 49, desc: "Phúc họa cân bằng, thành bại chủ yếu do lựa chọn và chuẩn bị." };
    if (score < 70) return { id: "tieu_thien_kieu", name: "Tiểu Thiên Kiêu", min: 50, max: 69, desc: "Dễ gặp quý nhân và cơ hội nhỏ, nhưng chưa đủ xoay chuyển đại thế." };
    if (score < 100) return { id: "yeu_nghiet", name: "Yêu Nghiệt Chi Tư", min: 70, max: 99, desc: "Khí vận vượt đồng thế hệ, thường gặp hiểm cảnh tương xứng với thiên tư." };
    if (score < 150) return { id: "dai_dia_chi_tu", name: "Đại Địa Chi Tử", min: 100, max: 149, desc: "Được địa mạch một phương nâng đỡ, vào tuyệt địa vẫn có cơ hội tìm sinh môn." };
    if (score < 250) return { id: "thien_dao_sung_nhi", name: "Thiên Đạo Sủng Nhi", min: 150, max: 249, desc: "Thiên cơ thường nghiêng về phía mệnh nhân, đồng thời dẫn tới những đại kiếp hiếm có." };
    if (score < 500) return { id: "vi_dien_chi_tu", name: "Vị Diện Chi Tử", min: 250, max: 499, desc: "Khí số đủ ảnh hưởng vận mệnh một giới; cơ duyên và tai kiếp đều mang quy mô vị diện." };
    return { id: "thien_menh_chi_nhan", name: "Thiên Mệnh Chi Nhân", min: 500, max: 999, desc: "Mang đại thế của thời đại, mỗi lựa chọn đều có thể viết lại thiên mệnh." };
  }

  const AMBIENT_DREAD = {
    low: ["Có tiếng chim hót, nhưng khi ngẩng đầu, ngươi không tìm thấy con chim nào.", "Gió lướt qua, để lại cảm giác như có ai vừa đứng sau lưng."],
    medium: ["Bóng của vật đi qua đôi lúc đổ sai hướng so với ánh sáng.", "Một âm thanh quen thuộc lặp lại chậm hơn nửa nhịp, như vọng từ nơi khác."],
    high: ["Ngươi đếm được sáu ngón tay trên bàn tay người đối diện; chớp mắt, chỉ còn năm.", "Vết nứt trên đá khẽ co giãn, tựa một mí mắt đang cố không mở ra."],
    extreme: ["Trong một nhịp tim, ngươi không chắc đôi tay trước mắt còn thuộc về mình.", "Mọi âm thanh quanh đây cùng ngừng lại đúng ba nhịp, rồi giả vờ chưa từng xảy ra."]
  };
  function worldviewWrongness(state) {
    const p = state?.player || {};
    const mapLoc = D().WORLD_MAP?.locations?.[state?.locationId];
    const distance = mapLoc ? Math.hypot(Number(mapLoc.x || 48) - 48, Number(mapLoc.y || 78) - 78) / 1.8 : 0;
    const sanRatio = Number(p.maxSan || 100) > 0 ? Number(p.san || 0) / Number(p.maxSan || 100) : 0;
    return clamp(Math.round(distance * 0.35 + Number(p.corruptionRating || 0) * 0.4 + (1 - sanRatio) * 35), 0, 100);
  }
  function atmosphereRoll(state, key) {
    let hash = Number(state?.meta?.turn || 0) * 31 + String(state?.locationId || "").length * 17 + String(key || "").length * 13;
    for (const ch of String(key || "")) hash = (hash * 33 + ch.charCodeAt(0)) % 10007;
    return (Math.abs(hash) % 100) / 100;
  }
  function weaveAtmosphere(state, text, key = "ambient") {
    const level = worldviewWrongness(state);
    const chance = level <= 20 ? 0.05 : level <= 50 ? 0.15 : level <= 75 ? 0.35 : 0.60;
    if (atmosphereRoll(state, key) >= chance) return text;
    const band = level <= 20 ? "low" : level <= 50 ? "medium" : level <= 75 ? "high" : "extreme";
    const lines = AMBIENT_DREAD[band];
    return text + "\n— " + lines[Math.floor(atmosphereRoll(state, key + band) * lines.length)];
  }
  function perceivedValue(state, value, key) {
    const p = state?.player || {};
    const ratio = Number(p.maxSan || 100) > 0 ? Number(p.san || 0) / Number(p.maxSan || 100) : 0;
    if (ratio >= 0.4 || atmosphereRoll(state, "perception:" + key) >= 0.3) return value;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return value;
    const variance = Math.max(1, Math.round(Math.abs(numeric) * 0.12));
    return Math.max(0, numeric + (atmosphereRoll(state, key + ":sign") < 0.5 ? -variance : variance));
  }

  const ORIGIN_PROFILES = {
    tan_tu: {
      name: "Tán Tu",
      description: "Tự do sinh tồn, chiến đấu mạnh nhưng tu luyện thiếu tài nguyên ổn định.",
      baseModifiers: { combatDamagePct: 10, maxStaminaPct: 10, cultivationSpeedPct: -10 },
      baseTraits: ["survivor"],
      starterItems: { hoan_huyet_dan: 1, pha_cam_phu: 1 },
      specializations: {
        kiem_tu: { name: "Kiếm Tu Lang Bạt", modifiers: { combatDamagePct: 5 }, traits: ["wandering_swordsman"] },
        the_tu: { name: "Luyện Thể Sinh Tồn", modifiers: { maxStaminaPct: 10 }, traits: ["iron_survivor"] },
        du_hiep: { name: "Du Hiệp Truy Dấu", modifiers: { searchDiscoveryPct: 12, searchRiskReductionPct: 8 }, traits: ["spirit_hunter"] }
      }
    },
    the_gia: {
      name: "Thế Gia",
      description: "Có linh mạch và tài nguyên gia tộc, thiên về Linh Khí và quan hệ.",
      baseModifiers: { maxQiPct: 15, qiRecoveryPct: 10 },
      baseTraits: ["family_heir"],
      starterItems: { linh_thach: 8, boi_nguyen_dan: 1 },
      specializations: {
        linh_mach: { name: "Linh Mạch Truyền Thừa", modifiers: { maxQiPct: 10 }, traits: ["spirit_vein_heir"] },
        dan_duoc: { name: "Đan Dược Thế Gia", modifiers: { searchRarePct: 6 }, traits: ["family_alchemist"], starterItems: { tu_khi_dan: 1 } },
        giao_thuong: { name: "Gia Tộc Thương Mạch", modifiers: { fortuneFlat: 5 }, traits: ["family_connections"], starterItems: { linh_thach: 7 } }
      }
    }
  };
  function originOptions() {
    return JSON.parse(JSON.stringify(ORIGIN_PROFILES));
  }

  function computeStats(character) {
    const realm = realmById(character.realmId);
    const patterns = D().FATE_PATTERNS;
    const eff = {
      phyMult: realm.phyMult, magMult: realm.magMult,
      allStatMult: 0, phyFlat: 0, qiFlat: 0, fortune: 0,
      sanResist: 0, breakBonus: 0, lootMult: 1, lightFireMult: 1,
      hpRegen: false, sanDrainMult: 0, phyDef: 0,
      combatDamagePct: 0, maxStaminaPct: 0, cultivationSpeedPct: 0,
      maxQiPct: 0, qiRecoveryPct: 0, searchDiscoveryPct: 0,
      searchRarePct: 0, searchRiskReductionPct: 0
    };
    (character.fates || []).forEach((f) => {
      const p = patterns.find((x) => x.id === f);
      if (!p) return;
      const e = enhancedFateEffects(character, p);
      if (e.phyMult) eff.phyMult += e.phyMult;
      if (e.magMult) eff.magMult += e.magMult;
      if (e.allStatMult) eff.allStatMult += e.allStatMult;
      if (e.phyFlat) eff.phyFlat += e.phyFlat;
      if (e.qiFlat) eff.qiFlat += e.qiFlat;
      if (e.fortune) eff.fortune += e.fortune;
      if (e.sanResist) eff.sanResist += e.sanResist;
      if (e.breakBonus) eff.breakBonus += e.breakBonus;
      if (e.lootMult) eff.lootMult *= e.lootMult;
      if (e.lightFireMult) eff.lightFireMult *= e.lightFireMult;
      if (e.hpRegen) eff.hpRegen = true;
      if (e.sanDrainMult) eff.sanDrainMult += e.sanDrainMult;
    });

    // Trang bị tĩnh và vật phẩm procedural dùng chung schema chỉ số.
    equippedItemIds(character.equipment).forEach((itemId) => {
      const item = D().ITEMS[itemId];
      if (!item) return;
      if (item.phy) eff.phyFlat += item.phy;
      if (item.mag) eff.qiFlat += item.mag;
      if (item.sanResist) eff.sanResist += item.sanResist;
      if (item.phyDef) eff.phyDef += item.phyDef;
    });

    // áp dụng quan hệ mệnh số
    const rel = computeRelationshipEffects(character);
    eff.phyMult += rel.phyMult;
    eff.magMult += rel.magMult;
    eff.allStatMult += rel.allStatMult;
    eff.fortune += rel.fortune;
    eff.sanDrainMult += rel.sanDrainMult;
    eff.sanResist += rel.sanResist;

    const originModifiers = character.origin?.modifiers || {};
    Object.keys(originModifiers).forEach((key) => {
      if (key === "fortuneFlat") eff.fortune += Number(originModifiers[key] || 0);
      else if (Object.prototype.hasOwnProperty.call(eff, key)) eff[key] += Number(originModifiers[key] || 0);
    });

    // Tâm Pháp là nội tại luôn bật; tiến độ mastery thuộc về nhân vật, định nghĩa catalog bất biến.
    Object.keys(character.techniques || {}).forEach((id) => {
      const technique = techniqueCatalog()[id];
      if (!technique || technique.category !== "tam_phap") return;
      if (technique.requiredFaction && technique.requiredFaction !== character.tainted?.faction) return;
      const stage = Number(character.techniques[id]?.masteryStage || 0);
      const mastery = (typeof window !== "undefined" && window.CONG_PHAP_DATA?.masteryMultipliers?.[stage]) || [0.6, 0.8, 1, 1.15, 1.3][stage] || 0.6;
      eff.allStatMult += Number(technique.visibleStats?.allStatMultiplier || 0) * mastery;
    });

    const basePhy = character.basePhy || 10;
    const baseMag = character.baseMag || 10;
    const totalFate = computeFate(character).total;
    const fateMult = 1 + 0.01 * Math.max(0, totalFate);

    let phy = basePhy * (1 + eff.phyMult) * (1 + eff.allStatMult) * fateMult + eff.phyFlat;
    let mag = baseMag * (1 + eff.magMult) * (1 + eff.allStatMult) * fateMult + eff.qiFlat;
    const mental = sanStatus(character);
    phy = Math.max(1, Math.round(phy * mental.multiplier));
    mag = Math.max(1, Math.round(mag * mental.multiplier));

    const fortune = Math.round(clamp((character.baseFortune || 0) + eff.fortune, 0, 999));
    const staminaMax = Math.max(1, Math.round((100 + phy * 2) * (1 + eff.maxStaminaPct / 100)));
    const tainted = character.tainted || {};
    const tier = realmLevelOf(character);
    const faction = tainted.faction;
    const rank = faction ? Math.max(0, tier - 7) : 0;
    if (faction === "loyal_heaven") { phy *= 1 + rank * 0.01; mag *= 1 + rank * 0.01; }
    if (faction === "rebel_heaven") { phy *= 1 + rank * 0.02; mag *= 1 + rank * 0.02; }
    if (faction === "neutral") { phy *= 1 + (tier >= 13 ? 0.08 : tier >= 11 ? 0.06 : tier >= 8 ? 0.04 : 0); mag *= 1 + (tier >= 13 ? 0.08 : tier >= 11 ? 0.06 : tier >= 8 ? 0.04 : 0); }
    const staminaPenalty = Number(tainted.staminaPenalty || 0) + (faction === "rebel_heaven" ? rank * 5 : 0);
    const stamina = clamp(staminaMax - staminaPenalty, 1, staminaMax);
    const staminaCostMultiplier = faction === "neutral" ? 0.75 : faction === "loyal_heaven" ? 0.9 : faction === "rebel_heaven" ? 1.15 : 1;
    return { phy: Math.round(phy), mag: Math.round(mag), fortune, sat: Number(character.sat || 0), stamina, staminaMax, staminaCostMultiplier, eff, rel, mental };
  }

  function maxQi(stats) {
    return Math.max(1, Math.round((stats.mag * 4 + 20) * (1 + Number(stats.eff?.maxQiPct || 0) / 100)));
  }
  function maxHp(stats) {
    return stats.phy * 8 + 40;
  }

  /* ---------- Lifespan ---------- */
  function computeLifespan(character) {
    const realm = realmById(character.realmId);
    const { eff } = computeStats(character);
    let base = realm.lifespanBase + realm.lifespanBonus;
    // hung cách hinh_rieu / kiep_sat
    const patterns = D().FATE_PATTERNS;
    let mult = 1;
    (character.fates || []).forEach((f) => {
      const p = patterns.find((x) => x.id === f);
      if (p && p.effects && p.effects.lifespanMult) mult += p.effects.lifespanMult;
      if (p && p.effects && p.effects.lifespanBonus) base += p.effects.lifespanBonus;
    });
    // Diên Thọ Đan là phần thưởng vĩnh viễn; phải nằm trong công thức
    // trần thọ nguyên để updateDerived không ghi đè ngay sau khi dùng thuốc.
    base += Math.max(0, Number(character.lifespanConsumableBonus || 0));
    return Math.max(1, Math.round(base * mult));
  }

  const FATE_STATUS_LABELS = {
    ELDRITCH_INTERVENTION: "Tà Thần Can Thiệp",
    FATE_BACKFIRE: "Mệnh Vận Phản Phệ",
    NORMAL_GROWTH: "Chính Thường Tu Hành",
    ASCENDANT_UNBOUND: "Đạo Ngoại Siêu Thoát"
  };
  function fateStatusLabel(state) {
    return FATE_STATUS_LABELS[state._fateState] || "Chưa Định Danh";
  }

  function normalizeEquipment(raw = {}) {
    const artifacts = Array.isArray(raw.artifacts) ? raw.artifacts.slice(0, 2) : [];
    if (raw.weapon && !artifacts.includes(raw.weapon)) artifacts.push(raw.weapon);
    const protection = { armor: null, boots: null, pants: null, helmet: null, ...(raw.protection || {}) };
    if (raw.armor && !protection.armor) protection.armor = raw.armor;
    return {
      artifacts: artifacts.slice(0, 2),
      protection,
      personal: Array.isArray(raw.personal) ? raw.personal.slice(0, 3) : [],
      spiritTreasure: raw.spiritTreasure || null,
      lifestyle: raw.lifestyle || null
    };
  }

  function equippedItemIds(equipment) {
    const e = normalizeEquipment(equipment || {});
    return e.artifacts.concat(Object.values(e.protection).filter(Boolean), e.personal, e.spiritTreasure || [], e.lifestyle || []).filter(Boolean);
  }

  function equippedItemQuantity(equipment, itemId) {
    return equippedItemIds(equipment).filter((id) => id === itemId).length;
  }

  function freeItemQuantity(state, itemId) {
    return Math.max(0, Number(state.inventory?.[itemId] || 0) - equippedItemQuantity(state.player?.equipment, itemId));
  }

  function normalizedText(value) {
    return String(value || "").toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  }

  function equipmentCategory(item) {
    if (!item) return null;
    if (item.equipmentType) return item.equipmentType;
    const text = normalizedText(item.name);
    if (item.kind === "weapon") return /chuong|dinh|linh bao|linh bao/.test(text) ? "spirit" : "artifact";
    if (item.kind === "armor") return "protection";
    if (["artifact", "protection", "personal_artifact", "spirit_treasure", "lifestyle_artifact"].includes(item.kind)) {
      return item.kind === "personal_artifact" ? "personal" : item.kind === "spirit_treasure" ? "spirit" : item.kind === "lifestyle_artifact" ? "lifestyle" : item.kind;
    }
    return null;
  }

  function equipmentCategoryLabel(item) {
    const labels = {
      artifact: "Pháp khí",
      protection: "Hộ thân Pháp khí",
      personal: "Tùy thân Pháp khí",
      spirit: "Bản mệnh Linh bảo",
      lifestyle: "Pháp khí Sinh hoạt"
    };
    return labels[equipmentCategory(item)] || item?.kind || "Vật phẩm";
  }

  function protectionSlot(item) {
    if (item.protectionSlot) return item.protectionSlot;
    const text = normalizedText(item.name);
    if (/giay|ngoai|ngọa/.test(text)) return "boots";
    if (/quan/.test(text)) return "pants";
    if (/mu/.test(text)) return "helmet";
    return "armor";
  }

  function canEquipLifestyle(state, item) {
    const guild = getGuildBenefits(state).guild;
    if (!guild) return false;
    const guildText = normalizedText(guild.name + " " + guild.type);
    const itemText = normalizedText(item.name);
    if (/kiem/.test(guildText)) return /kiem/.test(itemText);
    if (/dan|duoc/.test(guildText)) return /dinh|dan|duoc/.test(itemText);
    if (/phu/.test(guildText)) return /phu/.test(itemText);
    return /phap|cong cu/.test(itemText);
  }

  function equipmentEligibility(state, itemId, targetSlot = null) {
    const item = D().ITEMS[itemId];
    const category = equipmentCategory(item);
    const equipment = normalizeEquipment(state.player.equipment);
    const blockers = [];
    if (!item || !category) blockers.push("Vật phẩm này không phải trang bị Pháp khí.");
    if (item && category && freeItemQuantity(state, itemId) <= 0 && !equippedItemIds(equipment).includes(itemId)) blockers.push("Không còn đơn vị tự do trong Hành Trang.");
    let slot = targetSlot;
    let occupiedBy = null;
    if (category === "protection") slot = protectionSlot(item);
    if (category === "artifact") {
      const index = targetSlot == null || targetSlot === "" ? equipment.artifacts.length : Number(targetSlot);
      if (equipment.artifacts.length >= 2 && (index < 0 || index >= 2)) blockers.push("Pháp khí đã đủ 2 ô; hãy chọn món cần thay.");
      slot = Math.max(0, Math.min(1, index)); occupiedBy = equipment.artifacts[slot] || null;
    } else if (category === "protection") occupiedBy = equipment.protection[slot] || null;
    else if (category === "personal") {
      const index = targetSlot == null || targetSlot === "" ? equipment.personal.length : Number(targetSlot);
      if (equipment.personal.length >= 3 && (index < 0 || index >= 3)) blockers.push("Tùy thân Pháp khí đã đủ 3 ô; hãy chọn món cần thay.");
      slot = Math.max(0, Math.min(2, index)); occupiedBy = equipment.personal[slot] || null;
    } else if (category === "spirit") { slot = "spiritTreasure"; occupiedBy = equipment.spiritTreasure; }
    else if (category === "lifestyle") {
      slot = "lifestyle"; occupiedBy = equipment.lifestyle;
      if (!canEquipLifestyle(state, item)) blockers.push(state.guildMembership ? "Pháp khí Sinh hoạt không phù hợp với chuyên môn của tông môn hiện tại." : "Cần gia nhập tông môn phù hợp để dùng Pháp khí Sinh hoạt.");
    }
    const oldItem = D().ITEMS[occupiedBy];
    const statDelta = Object.fromEntries(["phy", "mag", "sanResist", "phyDef"].map((key) => [key, Number(item?.[key] || 0) - Number(oldItem?.[key] || 0)]).filter(([, value]) => value !== 0));
    const requirements = category === "lifestyle" ? [state.guildMembership ? "Tông môn/chuyên môn phù hợp" : "Gia nhập tông môn phù hợp"] : [];
    return { eligible: blockers.length === 0, category, targetSlot: slot, occupiedBy, requirements, blockers, statDelta, reason: blockers.join(" · ") };
  }

  function equipItem(state, itemId, targetSlot = null) {
    const item = D().ITEMS[itemId];
    const eligibility = equipmentEligibility(state, itemId, targetSlot);
    if (!eligibility.eligible) return eligibility.reason;
    const category = eligibility.category;
    const equipment = state.player.equipment = normalizeEquipment(state.player.equipment);
    if (category === "artifact") {
      if (!equipment.artifacts.includes(itemId)) equipment.artifacts[eligibility.targetSlot] = itemId;
    } else if (category === "protection") {
      equipment.protection[eligibility.targetSlot] = itemId;
    } else if (category === "personal") {
      if (!equipment.personal.includes(itemId)) equipment.personal[eligibility.targetSlot] = itemId;
    } else if (category === "spirit") {
      equipment.spiritTreasure = itemId;
    } else if (category === "lifestyle") {
      equipment.lifestyle = itemId;
    }
    equipment.artifacts = equipment.artifacts.filter(Boolean);
    equipment.personal = equipment.personal.filter(Boolean);
    updateDerived(state);
    pushHistory(state, { type: "sys", text: "§ Đã " + (eligibility.occupiedBy ? "thay " + (D().ITEMS[eligibility.occupiedBy]?.name || eligibility.occupiedBy) + " bằng " : "trang bị ") + item.name + "." });
    return true;
  }

  function equipmentSummary(state) {
    const e = normalizeEquipment(state.player.equipment);
    return {
      artifacts: e.artifacts,
      protection: e.protection,
      personal: e.personal,
      spiritTreasure: e.spiritTreasure ? [e.spiritTreasure] : [],
      lifestyle: e.lifestyle ? [e.lifestyle] : []
    };
  }

  function inventoryActions(state, itemId) {
    const item = D().ITEMS[itemId];
    if (!item) return [];
    const equipped = equippedItemIds(state.player.equipment).includes(itemId);
    const category = equipmentCategory(item);
    if (category) return equipped ? [{ id: "unequip", label: "Tháo Trang Bị" }, { id: "inspect", label: "Xem Chỉ Số" }] : [{ id: "equip", label: "Trang Bị" }, { id: "inspect", label: "Xem Chỉ Số" }, { id: "discard", label: "Vứt Bỏ" }];
    if (item.kind === "consumable") return [{ id: "use", label: "Dùng" }, { id: "inspect", label: "Xem Hiệu Ứng" }, { id: "discard", label: "Vứt Bỏ" }];
    if (item.kind === "key" || item.questItem) return [{ id: "inspect", label: "Xem Chi Tiết" }];
    return [{ id: "inspect", label: "Xem Chi Tiết" }, { id: "discard", label: "Vứt Bỏ" }];
  }
  function unequipItem(state, itemId) {
    const e = normalizeEquipment(state.player.equipment);
    e.artifacts = e.artifacts.filter((id) => id !== itemId);
    e.personal = e.personal.filter((id) => id !== itemId);
    Object.keys(e.protection).forEach((slot) => { if (e.protection[slot] === itemId) e.protection[slot] = null; });
    if (e.spiritTreasure === itemId) e.spiritTreasure = null;
    if (e.lifestyle === itemId) e.lifestyle = null;
    state.player.equipment = e; updateDerived(state); return true;
  }
  function handleInventoryAction(state, itemId, actionId) {
    const item = D().ITEMS[itemId]; if (!item || !state.inventory[itemId]) return false;
    if (actionId === "equip") { const result = equipItem(state, itemId); if (result !== true) pushHistory(state, { type: "warn", text: "× " + result }); return result; }
    if (actionId === "unequip") return unequipItem(state, itemId);
    if (actionId === "use") { useItem(state, item.name); return true; }
    if (actionId === "discard") { removeItem(state, itemId, 1); pushHistory(state, { type: "sys", text: "Đã vứt bỏ " + item.name + "." }); return true; }
    if (actionId === "inspect") { pushHistory(state, { type: "sys", text: item.name + ": " + (item.desc || "Không có mô tả.") }); return true; }
    return false;
  }

  /* ---------- Skill check (PHY/MAG based) ---------- */
  function skillCheck(statValue, difficulty) {
    const roll = rnd(1, 20);
    const total = statValue + roll;
    return { roll, total, success: total >= difficulty };
  }

  /* ---------- SAN check ---------- */
  function sanCheck(character, corruption) {
    const stats = computeStats(character);
    // sanResist: kháng tà niệm (giảm khả năng mất SAN).
    // sanDrainMult: hung cách làm tổn thất tà niệm nặng hơn.
    const resist = stats.eff.sanResist;
    const drainMult = stats.eff.sanDrainMult;
    const sanStat = 100;
    const threshold = clamp(sanStat + resist * 100 - (corruption || 1) * 5 - drainMult * 100, 5, 95);
    const roll = rnd(1, 100);
    return { roll, threshold, success: roll <= threshold };
  }

  /* ---------- Character factory ---------- */
  function createCharacter(input) {
    const arch = D().ARCHETYPES.find((a) => a.id === input.archetypeId) || D().ARCHETYPES[0];
    const realmId = realmById(input.realmId || "di_menh").id;
    const fates = input.fates || [];
    const character = {
      id: input.id || "char_" + Date.now() + "_" + rnd(1000, 9999),
      name: input.name || "Vô Danh",
      archetypeId: arch.id,
      portrait: arch.portrait,
      realmId,
      race: input.race || "Nhân Tộc",
      aptitude: clamp(input.aptitude ?? 50, 1, 100),
      comprehension: clamp(input.comprehension ?? 50, 1, 100),
      spiritualRoots: Array.isArray(input.spiritualRoots) ? input.spiritualRoots.slice() : [],
      spiritualRootBranch: input.spiritualRootBranch || null,
      spiritualRootGrade: input.spiritualRootGrade || spiritualRootGrade(input.spiritualRoots),
      spiritualRootProfile: spiritualRootProfile({ spiritualRoots: input.spiritualRoots, spiritualRootBranch: input.spiritualRootBranch, aptitude: input.aptitude }),
      personalityTraits: Array.isArray(input.personalityTraits) ? input.personalityTraits.slice(0, 2) : [],
      background: input.background || "Vô Danh",
      origin: input.origin || input.originProfile || null,
      hiddenGoal: input.hiddenGoal || "Trường sinh",
      cultivationMethod: input.cultivationMethod || "Dẫn Khí Nhập Môn",
      techniques: input.techniques || {
        kiem_khi_so_cap: { masteryStage: 0, masteryExp: 0, usageCount: 0 },
        tam_phap_dan_dien: { masteryStage: 0, masteryExp: 0, usageCount: 0 }
      },
      techniqueCooldowns: input.techniqueCooldowns || {},
      corruptionRating: Number(input.corruptionRating || 0),
      startRegionId: input.startRegionId || "trung_vuc",
      basePhy: input.basePhy ?? input.phy ?? 10,
      baseMag: input.baseMag ?? input.mag ?? 10,
      baseFortune: input.baseFortune ?? input.fortune ?? 0,
      sat: Number(input.sat || 0),
      merit: Math.max(0, Number(input.merit || 0)),
      stamina: clamp(input.stamina ?? 100, 0, 100),
      fates,
      hiddenFates: Array.isArray(input.hiddenFates) ? input.hiddenFates.slice() : [],
      hiddenProfessionCandidate: input.hiddenProfessionCandidate || (Array.isArray(input.hiddenFates) && input.hiddenFates.includes("luan_hoi_tien") ? "luan_hoi_tien" : null),
      hiddenProfession: input.hiddenProfession || null,
      pathId: input.pathId || null,
      daoTam: clamp(input.daoTam ?? 50, 0, 100),
      cultivation: { velocity24h: 0, velocitySamples: [], deviationCount: 0, lastDeviationAt: null, pendingDeviation: null, ...(input.cultivation || {}) },
      cultivationJournal: Array.isArray(input.cultivationJournal) ? input.cultivationJournal.slice(-500) : [],
      secludedSession: input.secludedSession || null,
      fateDebt: Number(input.fateDebt || 0),
      fateSurplus: Number(input.fateSurplus || 0),
      fatePacts: Array.isArray(input.fatePacts) ? input.fatePacts.slice() : [],
      fateEnhancements: { ...(input.fateEnhancements || {}) },
      fateRelationships: JSON.parse(JSON.stringify(input.fateRelationships || {})),
      fateEvolutions: JSON.parse(JSON.stringify(input.fateEvolutions || {})),
      anchors: Array.isArray(input.anchors) ? input.anchors.map((anchor) => ({ ...anchor })) : [],
      tainted: input.tainted || { attention: false, vocation: null, faction: null, quests: 0, finalConflictPreparation: false, taintedGodDefeated: false, rewards: {} },
      equipment: normalizeEquipment(input.equipment),
      hp: 0, qi: 0, san: 100,
      exp: 0,
      lifespan: 0,
      lifespanConsumableBonus: Math.max(0, Number(input.lifespanConsumableBonus || 0)),
      currentAge: Number(input.currentAge || 0),
      maxQa: realmById(realmId).maxQa
    };
    const stats = computeStats(character);
    character.hp = maxHp(stats);
    character.qi = maxQi(stats);
    character.lifespan = computeLifespan(character);
    character.stats = stats;
    // áp Điểm Điên Loạn từ Tương Khắc / Nghịch Mệnh Combo vào SAN
    const madness = (stats.rel && stats.rel.madness) || 0;
    if (madness > 0) {
      character.san = Math.max(0, character.san - madness);
    }
    return character;
  }

  /* ---------- Công pháp / kỹ năng ---------- */
  function techniqueCatalog() {
    const catalog = (typeof window !== "undefined" && window.CONG_PHAP_DATA?.techniques) || {};
    // Mỗi tổ chức có một bí pháp truyền thừa riêng, tạo ổn định từ guild id để
    // save cũ vẫn giữ nguyên id và không cần nhân bản thủ công 150 bản ghi.
    const guilds = (typeof window !== "undefined" && window.GUILD_DATA?.guilds) || [];
    guilds.forEach((guild) => {
      const id = "guild_signature_" + guild.id;
      if (catalog[id]) return;
      const tier = Math.max(1, Number(guild.pyramid_tier || 5));
      const affinity = (guild.traits || []).slice(0, 2).join(" · ") || guild.type || "bản sắc riêng";
      catalog[id] = {
        id,
        name: "Bí Pháp Truyền Thừa · " + guild.name,
        category: "guild_signature",
        family: "guild",
        grade: tier <= 2 ? "linh" : "pham",
        quality: tier <= 2 ? "trung" : "ha",
        element: "vo_he",
        minRealmLevel: 1,
        spiritualRootRequirements: [],
        isCore: false,
        sourceGuildId: guild.id,
        description: "Bí pháp chỉ truyền trong " + guild.name + "; cộng hưởng với bản sắc " + affinity + ".",
        visibleStats: {
          powerCoefficient: 0.45 + Math.max(0, 5 - tier) * 0.05,
          manaCost: 8,
          staminaCost: 2,
          corruptionCost: 0,
          sanCost: 0,
          lifespanCost: 0,
          cooldownSeconds: 8,
          castTimeSeconds: 1,
          baseEffect: "Cộng hưởng tông môn",
          allStatMultiplier: 0.015 + Math.max(0, 5 - tier) * 0.005
        },
        hiddenAttributes: [],
        corruptionProfile: null,
        mastery: { stage: 0, exp: 0, usageCount: 0 },
        evolutionPaths: []
      };
      [
        { suffix: "support", label: "Phụ Trợ", category: "phu_tro", bonus: 0.01, effect: "Hỗ trợ tu luyện và hồi phục" },
        { suffix: "secret", label: "Mật Truyền", category: "chieu_thuc", bonus: 0.02, effect: "Tuyệt kỹ đặc hữu của tông môn" }
      ].forEach((variant) => {
        const variantId = id + "_" + variant.suffix;
        if (catalog[variantId]) return;
        catalog[variantId] = {
          ...catalog[id],
          id: variantId,
          name: variant.label + " · " + guild.name,
          category: variant.category,
          description: variant.effect + "; chỉ truyền trong " + guild.name + ".",
          visibleStats: { ...catalog[id].visibleStats, baseEffect: variant.effect, allStatMultiplier: Number(catalog[id].visibleStats.allStatMultiplier || 0) + variant.bonus }
        };
      });
    });
    return catalog;
  }
  function initialTechniqueProgress(technique) {
    const mastery = technique?.mastery || {};
    return { masteryStage: Number(mastery.stage || 0), masteryExp: Number(mastery.exp || 0), usageCount: Number(mastery.usageCount || 0) };
  }
  function getKnownTechniques(state) {
    const known = state.player.techniques || {};
    return Object.keys(known).map((id) => techniqueCatalog()[id]).filter(Boolean);
  }
  function hasCoreTechnique(state) {
    return getKnownTechniques(state).some((technique) => technique && (technique.isCore === true || technique.isCore === 1 || technique.isCore === "true"));
  }
  function markForbiddenKnowledge(state, source) {
    if (!source?.isForbiddenKnowledge) return;
    state.flags.forbiddenKnowledge = true;
    state.flags.forbiddenKnowledgeCount = Number(state.flags.forbiddenKnowledgeCount || 0) + 1;
    pushMemory(state, "Tri thức cấm đã in dấu; từ nay ngươi nhìn thấy những đường viền trước đây vô hình.");
  }
  function learnTechnique(state, id) {
    const technique = techniqueCatalog()[id];
    if (!technique) return false;
    const faction = state.player.tainted?.faction;
    if (technique.requiredFaction && faction !== technique.requiredFaction && !factionStatus(state).forbiddenTechniqueBypass) return false;
    if (Number(technique.minRealmLevel || 1) > cultivationTier(state)) return false;
    state.player.techniques = state.player.techniques || {};
    if (state.player.techniques[id]) return false;
    state.player.techniques[id] = initialTechniqueProgress(technique);
    markForbiddenKnowledge(state, technique);
    pushHistory(state, { type: "sys", text: "§ Đã lĩnh ngộ Công pháp: " + technique.name + "." });
    return true;
  }

  const ELEMENT_GENERATES = { kim: "thuy", thuy: "moc", moc: "hoa", hoa: "tho", tho: "kim" };
  const ELEMENT_OVERCOMES = { kim: "moc", moc: "tho", tho: "thuy", thuy: "hoa", hoa: "kim" };
  function elementRelation(a, b) {
    a = normalizedText(a || "vo_he").replace(/ /g, "_"); b = normalizedText(b || "vo_he").replace(/ /g, "_");
    if (a === "vo_he" || b === "vo_he" || a === b) return "neutral";
    if (a === "di_he") return "overcomes";
    if (b === "di_he") return "overcome_by";
    if (ELEMENT_GENERATES[a] === b) return "generates";
    if (ELEMENT_GENERATES[b] === a) return "generated_by";
    if (ELEMENT_OVERCOMES[a] === b) return "overcomes";
    if (ELEMENT_OVERCOMES[b] === a) return "overcome_by";
    return "neutral";
  }

  function activeCoreMethod(state) {
    return getKnownTechniques(state).find((technique) => technique.category === "tam_phap") || null;
  }

  function familyMatchup(attackerFamily, defenderFamily) {
    if (attackerFamily === "thien_dao_thuat" && defenderFamily === "cam_thuat") return 1.25;
    if (attackerFamily === "cam_thuat" && defenderFamily === "thuong") return 1.20;
    if (attackerFamily === "nguyen_thuat" && ["thien_dao_thuat", "cam_thuat"].includes(defenderFamily)) return 1.15;
    return 1;
  }

  function updateTechniqueMastery(state, technique, progress, activity) {
    const category = technique?.category;
    const isCombatMethod = category === "chieu_thuc" || category === "cam_thuat";
    if (activity === "combat" && !isCombatMethod) return 0;
    if (activity !== "combat" && activity !== "cultivation") return 0;
    const thresholds = window.CONG_PHAP_DATA?.masteryThresholds || [0, 100, 300, 700, 1500];
    const cultivationBase = category === "tam_phap" ? 12 : isCombatMethod ? 3 : 8;
    const base = activity === "combat" ? 4 : cultivationBase;
    const gain = Math.max(1, Math.round(base * (1 + Number(state.player.comprehension || 0) / 100)));
    const oldStage = Number(progress.masteryStage || 0);
    progress.masteryExp = Number(progress.masteryExp || 0) + gain;
    if (activity === "combat") progress.usageCount = Number(progress.usageCount || 0) + 1;
    let stage = 0;
    thresholds.forEach((threshold, index) => { if (progress.masteryExp >= threshold) stage = index; });
    progress.masteryStage = Math.min(4, stage);
    if (progress.masteryStage > oldStage) {
      const stages = window.CONG_PHAP_DATA?.masteryStages || ["Nhập Môn", "Tiểu Thành", "Đại Thành", "Viên Mãn", "Đại Viên Mãn"];
      pushHistory(state, { type: "sys", text: "§ Công pháp " + technique.name + " thăng tới " + stages[progress.masteryStage] + "." });
    }
    return gain;
  }

  function techniquePreview(state, id) {
    const technique = techniqueCatalog()[id];
    if (!technique || !state.player.techniques?.[id]) return { success: false, reason: "Chưa lĩnh ngộ Công pháp này." };
    if (technique.category === "tam_phap") return { success: false, reason: "Tâm Pháp là nội tại bị động, không cần thi triển." };
    if (Number(technique.minRealmLevel || 1) > cultivationTier(state)) return { success: false, reason: "Cảnh giới chưa đủ để thi triển." };
    const progress = state.player.techniques[id];
    const cooldownUntil = state.player.techniqueCooldowns?.[id] || 0;
    if (cooldownUntil > state.meta.turn) return { success: false, reason: "Công pháp đang hồi chiêu." };
    const stats = computeStats(state.player);
    const visible = technique.visibleStats || {};
    const evolution = typeof window !== "undefined" && window.GameExpansion?.techniqueEvolutionModifiers
      ? window.GameExpansion.techniqueEvolutionModifiers(state, id)
      : {};
    const masteryStage = Number(progress.masteryStage || 0);
    const masteryCostMultiplier = masteryStage >= 3 ? 0.85 : 1;
    const manaCost = Math.max(0, Math.ceil(Number(visible.manaCost || 0) * masteryCostMultiplier * Number(evolution.manaCostMult || 1)));
    const staminaCost = Math.max(0, Math.ceil(Number(visible.staminaCost || 0) * masteryCostMultiplier * (stats.staminaCostMultiplier || 1)));
    const sanCost = Math.max(0, Number(visible.sanCost || 0) * Number(evolution.sanCostMult || 1));
    const lifespanCost = Math.max(0, Number(visible.lifespanCost || 0));
    const corruptionCost = Math.max(0, Number(visible.corruptionCost || technique.corruptionProfile?.baseCorruptionGainPerUse || 0) * Number(evolution.corruptionCostMult || 1));
    const dangerous = technique.family === "cam_thuat" || sanCost > 0 || lifespanCost > 0 || corruptionCost > 0;
    const worldModifiers = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
      ? window.GameExpansion.getWorldModifiers(state, { activity: "technique", element: technique.element })
      : { combatPowerByElement: {} };
    return {
      success: true, id, name: technique.name, family: technique.family, category: technique.category,
      requiresConfirmation: dangerous,
      costs: { manaCost, staminaCost, sanCost, lifespanCost, corruptionCost },
      worldModifiers,
      powerMultiplier: Number(worldModifiers.combatPowerByElement?.[technique.element] || 1)
    };
  }
  function useTechnique(state, id, options = {}) {
    const technique = techniqueCatalog()[id];
    if (!technique || !state.player.techniques?.[id]) return { success: false, reason: "Chưa lĩnh ngộ Công pháp này." };
    if (technique.category === "tam_phap") return { success: false, reason: "Tâm Pháp là nội tại bị động, không cần thi triển." };
    if (Number(technique.minRealmLevel || 1) > cultivationTier(state)) return { success: false, reason: "Cảnh giới chưa đủ để thi triển." };
    const progress = state.player.techniques[id];
    const cooldownUntil = state.player.techniqueCooldowns?.[id] || 0;
    if (cooldownUntil > state.meta.turn) return { success: false, reason: "Công pháp đang hồi chiêu." };
    const stats = computeStats(state.player);
    const visible = technique.visibleStats || {};
    const evolution = typeof window !== "undefined" && window.GameExpansion?.techniqueEvolutionModifiers
      ? window.GameExpansion.techniqueEvolutionModifiers(state, id)
      : {};
    const masteryStage = Number(progress.masteryStage || 0);
    const masteryCostMultiplier = masteryStage >= 3 ? 0.85 : 1;
    const manaCost = Math.max(0, Math.ceil(Number(visible.manaCost || 0) * masteryCostMultiplier * Number(evolution.manaCostMult || 1)));
    const staminaCost = Math.max(0, Math.ceil(Number(visible.staminaCost || 0) * masteryCostMultiplier * (stats.staminaCostMultiplier || 1)));
    const sanCost = Math.max(0, Number(visible.sanCost || 0) * Number(evolution.sanCostMult || 1));
    const lifespanCost = Math.max(0, Number(visible.lifespanCost || 0));
    const corruptionCost = Math.max(0, Number(visible.corruptionCost || technique.corruptionProfile?.baseCorruptionGainPerUse || 0) * Number(evolution.corruptionCostMult || 1));
    const dangerous = technique.family === "cam_thuat" || sanCost > 0 || lifespanCost > 0 || corruptionCost > 0;
    if (dangerous && !options.confirmed) return { success: false, requiresConfirmation: true, reason: "Công pháp nguy hiểm cần được xác nhận trước khi trả giá." };
    const supportedCategories = ["chieu_thuc", "cam_thuat", "than_phap", "phu_tro", "tran_phap"];
    if (!supportedCategories.includes(technique.category)) return { success: false, reason: "Loại Công pháp này phải dùng qua action chuyên biệt." };
    if (state.player.qi < manaCost) return { success: false, reason: "Linh khí không đủ." };
    if (state.player.stamina < staminaCost) return { success: false, reason: "Thể lực không đủ." };
    if (state.player.san < sanCost) return { success: false, reason: "Thanh Tỉnh không đủ để trả giá." };
    if (state.player.lifespan <= lifespanCost) return { success: false, reason: "Thọ Nguyên không đủ để trả giá." };
    state.player.stamina -= staminaCost;
    state.player.qi -= manaCost;
    state.player.san -= sanCost;
    state.player.lifespan -= lifespanCost;
    state.player.corruptionRating = clamp(Number(state.player.corruptionRating || 0) + corruptionCost, 0, 100);
    if (state.player.san <= 0) {
      triggerMadness(state, "cái giá của " + technique.name);
      updateDerived(state);
      return { success: false, reason: "Thanh Tỉnh đã cạn; hình phạt Mất Trí được kích hoạt." };
    }
    state.player.techniqueCooldowns = state.player.techniqueCooldowns || {};
    const baseCooldownTurns = visible.cooldownSeconds != null ? Math.ceil(Number(visible.cooldownSeconds || 0) / 5) : Number(visible.cooldownTurns || 0);
    const cooldown = Math.max(0, Math.ceil(baseCooldownTurns * (masteryStage >= 3 ? 0.9 : 1)));
    state.player.techniqueCooldowns[id] = state.meta.turn + cooldown;
    const isOffensive = technique.category === "chieu_thuc" || technique.category === "cam_thuat";
    const enemyId = isOffensive ? (Object.keys(state.enemies || {})[0] || (beginCombat(state) ? Object.keys(state.enemies || {})[0] : null)) : null;
    const enemy = enemyId && combatEntity(state, enemyId);
    if (isOffensive && enemy) updateTechniqueMastery(state, technique, progress, "combat");
    if (technique.category === "than_phap") {
      state.flags.phiVanActiveUntil = state.meta.turn + 2;
      pushHistory(state, { type: "sys", text: "§ " + technique.name + " khai triển: tăng thân pháp trong 1 lượt." });
    } else if (technique.category === "phu_tro") {
      const recovery = Math.max(1, Math.round(stats.mag * Number(visible.powerCoefficient || 0.5)));
      state.player.hp = clamp(state.player.hp + recovery, 0, state.player.maxHp);
      pushHistory(state, { type: "sys", text: "§ " + technique.name + " hồi phục " + recovery + " Khí Huyết." });
    } else if (technique.category === "tran_phap") {
      state.flags.activeFormation = { techniqueId: id, untilTurn: state.meta.turn + Math.max(1, cooldown) };
      pushHistory(state, { type: "sys", text: "§ Đã triển khai trận pháp " + technique.name + "." });
    } else {
      if (!enemy) {
        updateDerived(state);
        return { success: true, reason: "Công pháp được vận chuyển nhưng không có mục tiêu." };
      }
      const mastery = (window.CONG_PHAP_DATA?.masteryMultipliers || [0.6, 0.8, 1, 1.15, 1.3])[progress.masteryStage || 0];
      const core = activeCoreMethod(state);
      const relation = core ? elementRelation(core.element, technique.element) : "neutral";
      const gradeIndex = { pham: 0, hoang: 1, huyen: 2, dia: 3, thien: 4, tien: 5, cam_thuat: 5 }[technique.grade] || 0;
      let elementMult = relation === "generates" ? 1 + (10 + 2 * gradeIndex) / 100 : relation === "overcomes" || relation === "overcome_by" ? 1 - (8 + 3 * gradeIndex) / 100 : 1;
      if (technique.element === "di_he" && core && core.family !== "cam_thuat") elementMult = Math.max(0.1, elementMult - 2 * (8 + 3 * gradeIndex) / 100);
      const family = technique.family || "thuong";
      let familyMult = familyMatchup(family, enemy.family || "thuong");
      const ownsCommon = Object.keys(state.player.techniques || {}).some((tid) => techniqueCatalog()[tid]?.family === "thuong");
      if (ownsCommon && ["nguyen_thuat", "thien_dao_thuat"].includes(family)) familyMult *= 1.1;
      const fateElementCount = (state.player.fates || []).filter((fid) => fateTags(D().FATE_PATTERNS.find((item) => item.id === fid) || {}).includes(normalizedText(technique.element))).length;
      const fateElementMult = 1 + fateElementCount * 0.01;
      const corruptionPenalty = state.player.corruptionRating > 70 ? Math.min(0.15, (state.player.corruptionRating - 70) / 200) : 0;
      const basePower = Number(visible.powerCoefficient || 1);
      const worldElementPower = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
        ? Number(window.GameExpansion.getWorldModifiers(state, { activity: "combat", element: technique.element }).combatPowerByElement?.[technique.element] || 1)
        : 1;
      const evolvedPower = basePower * Number(evolution.powerMult || 1) * worldElementPower;
      const power = family === "cam_thuat" ? evolvedPower * (1 + state.player.corruptionRating / 50) : evolvedPower;
      const originDamageMult = 1 + Number(stats.eff?.combatDamagePct || 0) / 100;
      const damage = Math.max(1, Math.round(stats.mag * power * mastery * elementMult * (1 + state.player.comprehension / 200) * fateElementMult * familyMult * (1 - corruptionPenalty) * originDamageMult + rnd(0, 6)));
      pushHistory(state, { type: "sys", text: "§ Thi triển " + technique.name + ", gây " + damage + " sát thương lên " + enemy.name + "." });
      applyPlayerDamage(state, enemyId, damage);
      afterPlayerCombatAction(state);
      return { success: true };
    }
    afterPlayerCombatAction(state);
    return { success: true };
  }

  function techniqueStatus(state) {
    return getKnownTechniques(state).map((t) => {
      const p = state.player.techniques[t.id] || {};
      const stages = window.CONG_PHAP_DATA?.masteryStages || ["Nhập Môn", "Tiểu Thành", "Đại Thành", "Viên Mãn", "Đại Viên Mãn"];
      const hidden = (t.hiddenAttributes || []).filter((attribute) => {
        const condition = attribute.revealCondition || {};
        return Number(state.player.comprehension || 0) >= Number(condition.comprehensionAtLeast || Infinity) || Number(p.masteryStage || 0) >= Number(condition.masteryStageAtLeast || Infinity);
      });
      return t.name + " · " + t.element + " · " + stages[p.masteryStage || 0] + " · " + (p.masteryExp || 0) + " mastery EXP" + (hidden.length ? " · ẩn tính: " + hidden.map((item) => item.attribute).join(", ") : "");
    }).join("\n");
  }

  function techniqueProgress(state, id) {
    const technique = techniqueCatalog()[id];
    const progress = state.player.techniques?.[id];
    if (!technique || !progress) return null;
    const stages = window.CONG_PHAP_DATA?.masteryStages || ["Nhập Môn", "Tiểu Thành", "Đại Thành", "Viên Mãn", "Đại Viên Mãn"];
    const thresholds = window.CONG_PHAP_DATA?.masteryThresholds || [0, 100, 300, 700, 1500];
    const stage = Math.min(stages.length - 1, Number(progress.masteryStage || 0));
    const nextThreshold = thresholds[stage + 1] ?? null;
    return {
      id, stage, stageName: stages[stage], masteryExp: Number(progress.masteryExp || 0),
      nextStageName: nextThreshold == null ? null : stages[stage + 1], nextThreshold,
      remaining: nextThreshold == null ? 0 : Math.max(0, nextThreshold - Number(progress.masteryExp || 0)),
      usageCount: Number(progress.usageCount || 0),
      guide: technique.category === "tam_phap"
        ? "Tâm Pháp nhận nhiều Thông Thạo nhất qua tu luyện."
        : (["chieu_thuc", "cam_thuat"].includes(technique.category)
          ? "Công pháp chiến đấu nhận ít Thông Thạo khi tu luyện và chỉ công pháp thực sự thi triển mới nhận thêm trong giao chiến."
          : "Công pháp phụ trợ nhận Thông Thạo qua tu luyện; không tăng nhờ giao chiến.")
    };
  }

  /* ---------- Game state factory ---------- */
  function createState(input) {
    const canonicalInput = input.character?.realm && input.character?.fate ? input.character : null;
    const character = canonicalInput ? fromCanonicalCharacter(canonicalInput) : (input.character || createCharacter(input));
    character.realmId = realmById(character.realmId).id;
    const state = {
      meta: {
        saveId: "save_" + Date.now() + "_" + rnd(1000, 9999),
        worldId: input.worldId || "co_di_dien",
        turn: 1,
        chapter: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      gameClock: {
        currentYear: 1,
        currentEra: "Kỷ Nguyên Linh Khí Dị Biến",
        currentMonth: 1,
        currentDay: 1,
        dayProgress: 0,
        realTimeToGameTimeRatio: 1 / 30,
        timeScaleVersion: 3,
        eraIndex: 1,
        lastRealTimestamp: Date.now()
      },
      player: character,
      startRegionId: input.startRegionId || character.startRegionId || "trung_vuc",
      locationId: input.locationId || "son_mon",
      homeLocationId: input.homeLocationId || input.locationId || "son_mon",
      visitedLocations: [input.locationId || "son_mon"],
      openWorld: { coordinates: { [input.locationId || "son_mon"]: [0, 0] }, nodes: {}, exits: {} },
      generatedItems: {}, // itemId -> định nghĩa item procedural, được lưu cùng save
      inventory: {},       // itemId -> quantity
      fateInventory: canonicalInput?.fate?.vaultIds?.slice() || [],   // Mệnh Số chưa gắn; dung lượng = 2 x số Mệnh Số đang gắn
      fateExcessEssence: Number(canonicalInput?.fate?.excessEssence || 0),
      fateInstances: canonicalInput?.fate?.instances ? JSON.parse(JSON.stringify(canonicalInput.fate.instances)) : {},
      guildMembership: null, // Chỉ được quyết định sau khi bước vào Luyện Khí.
      guildPursuit: null,
      autoCultivation: null,
      searchSites: {},
      pendingSearch: null,
      pendingFateReward: null,
      pendingFateRewards: [],
      pendingGuildChoice: false,
      relationships: {},   // npcId -> { trust, fear, respect, suspicion }
      quests: {},          // questId -> { status, objectives }
      flags: { originChoicePending: Boolean(character.originSituation), originSituation: character.originSituation || null, originChoice: null },
      memory: { shortTerm: [], longTerm: [], worldFacts: [] },
      history: [],
      enemies: {},
      pendingEnding: null,
      pendingRewardSummaries: [],
      market: { generatedAt: 0, refreshIntervalMs: 60000, offers: [], purchased: {} },
      _fateState: "NORMAL_GROWTH",
      fateCatalogVersion: "v1-regraded-phase3",
      fateMigration: { phase3Regrade: "phase3-20260908" }
      ,dialogueStates: {}
    };

    // starting item
    const arch = D().ARCHETYPES.find((a) => a.id === character.archetypeId);
    if (arch && arch.startItem) addItem(state, arch.startItem, 1);
    ensureStarterKit(state);

    // register quests available
    Object.keys(D().QUESTS).forEach((qid) => {
      const def = D().QUESTS[qid];
      state.quests[qid] = { id: qid, type: def.type || def.kind || "khu_vuc", title: def.title, priority: def.priority || 1, status: "available", objectives: def.objectives.map((o) => ({ ...o, done: false })), branches: def.branches || [], alternatives: def.alternatives || [], consequences: def.consequences || {}, tracked: false, discoveredAt: null, completedAt: null, failedAt: null };
    });
    if (character.originSituation?.questSeed && state.quests[character.originSituation.questSeed]) state.quests[character.originSituation.questSeed].status = "hidden";
    state._fateState = fateState(character);
    updateDerived(state);
    if (state.player.san <= 0) triggerMadness(state, "Mệnh Số tương khắc khi thức tỉnh");
    const startRegion = D().WORLD_MAP?.regions?.find((region) => region.id === state.startRegionId);
    pushMemory(state, "Bắt đầu hành trình tại " + (startRegion?.name || "Trung Vực") + ".");
    pushHistory(state, { type: "sys", text: "Ngươi tỉnh giấc tại " + (startRegion?.name || "Trung Vực") + "." });
    if (character.originSituation) pushHistory(state, { type: "narr", text: "Bối cảnh: " + character.originSituation.title + ". Hãy chọn thân phận hành đạo trước khi tìm đến bất kỳ Tông Môn nào." });
    return state;
  }

  function updateDerived(state) {
    state.player.stats = computeStats(state.player);
    state.player.maxHp = maxHp(state.player.stats);
    state.player.maxQi = maxQi(state.player.stats);
    state.player.maxStamina = state.player.stats.staminaMax || 100;
    state.player.corruptionRating = clamp(Number(state.player.corruptionRating || 0), 0, 100);
    state.player.maxSan = Math.max(70, 100 - Math.floor(state.player.corruptionRating / 20) * 5);
    const calculatedMaxLifespan = computeLifespan(state.player);
    state.player.maxLifespan = calculatedMaxLifespan;
    if (!Number.isFinite(Number(state.player.lifespan))) state.player.lifespan = calculatedMaxLifespan;
    state.player.lifespan = clamp(state.player.lifespan, 0, state.player.maxLifespan);
    state.player.hp = clamp(state.player.hp, 0, state.player.maxHp);
    state.player.qi = clamp(state.player.qi, 0, state.player.maxQi);
    state.player.san = clamp(state.player.san, 0, state.player.maxSan);
    state.player.stamina = clamp(state.player.stamina ?? 100, 0, state.player.maxStamina || 100);
    state._fateState = fateState(state.player);
    state.player.fate = computeFate(state.player);
    if (state.guildPursuit && cultivationTier(state) > Number(state.guildPursuit.startRealmLevel || 0)) {
      pushHistory(state, { type: "sys", text: "§ Ngươi đã vượt qua một đại cảnh; lệnh truy sát của " + state.guildPursuit.guildName + " mất hiệu lực." });
      state.guildPursuit = null;
    }
    validateFateInventory(state, "updateDerived");
  }

  function refreshMarket(state, now = Date.now()) {
    state.market = state.market || { generatedAt: 0, refreshIntervalMs: 60000, offers: [], purchased: {} };
    if (state.market.offers.length && now - Number(state.market.generatedAt || 0) < Number(state.market.refreshIntervalMs || 60000)) return state.market;
    const worldPriceMult = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
      ? Number(window.GameExpansion.getWorldModifiers(state, { activity: "market" }).marketPriceMult || 1)
      : 1;
    const fates = D().FATE_PATTERNS.filter((f) => f.grade === "phan" && f.sign !== "hung").sort(() => Math.random() - 0.5).slice(0, 3).map((f) => ({ kind: "fate", id: f.id, price: { linhThach: Math.max(1, Math.round(30 * worldPriceMult)) } }));
    const items = Object.values(D().ITEMS).filter((item) => item.kind === "consumable" || window.GameEngine?.equipmentCategory?.(item)).sort(() => Math.random() - 0.5).slice(0, 4).map((item) => ({ kind: item.kind === "consumable" ? "consumable" : "equipment", id: item.id, price: { linhThach: Math.max(1, Math.round((item.kind === "consumable" ? 12 : 25) * worldPriceMult)) } }));
    state.market.generatedAt = now; state.market.offers = [...fates, ...items]; state.market.purchased = {};
    return state.market;
  }

  function marketOffers(state, now = Date.now()) { return refreshMarket(state, now).offers; }
  function buyMarketOffer(state, offerId) {
    const market = refreshMarket(state); const offer = market.offers.find((item) => item.id === offerId);
    if (!offer || market.purchased[offerId]) return { success: false, reason: "Giao dịch không còn hiệu lực." };
    const cost = Number(offer.price.linhThach || 0); const stones = Number(state.inventory?.linh_thach || 0);
    if (stones < cost) return { success: false, reason: "Không đủ Linh thạch." };
    state.inventory.linh_thach = stones - cost;
    let result = { added: false };
    if (offer.kind === "fate") result = receiveFate(state, offer.id);
    else result.added = addItem(state, offer.id, 1);
    if (!result.added) { state.inventory.linh_thach += cost; return { success: false, reason: result.reason || "Không thể nhận vật phẩm." }; }
    market.purchased[offerId] = true; state.flags.lastMarketResult = offer.kind === "fate" ? "Mệnh Số · " + (D().FATE_PATTERNS.find((f) => f.id === offer.id)?.name || offer.id) : "Vật phẩm · " + (D().ITEMS[offer.id]?.name || offer.id); pushHistory(state, { type: "sys", text: "§ Phường thị giao dịch thành công: " + offer.id + "." }); return { success: true, offer };
  }
  function refreshBlackMarket(state) {
    const owned = new Set([...(state.player.fates || []), ...(state.fateInventory || [])]);
    const pool = D().FATE_PATTERNS.filter((f) => !owned.has(f.id) && Number(GRADE_TO_TIER[f.grade] || 0) >= 2 && Number(GRADE_TO_TIER[f.grade] || 0) <= 8);
    state.blackMarketOffers = pool.slice().sort(() => Math.random() - 0.5).slice(0, 3).map((f) => {
      const tier = Number(GRADE_TO_TIER[f.grade] || 2);
      return { fateId: f.id, tier, lifespan: 5 + tier * 5 };
    });
    return state.blackMarketOffers.map((offer) => ({ ...offer, fate: D().FATE_PATTERNS.find((f) => f.id === offer.fateId) })).filter((offer) => offer.fate);
  }
  function blackMarketOffers(state) {
    if (!Array.isArray(state.blackMarketOffers)) return refreshBlackMarket(state);
    return state.blackMarketOffers.map((offer) => ({ ...offer, fate: D().FATE_PATTERNS.find((f) => f.id === offer.fateId) })).filter((offer) => offer.fate);
  }
  function buyBlackMarketOffer(state, fateId) {
    const offer = blackMarketOffers(state).find((entry) => entry.fateId === fateId);
    if (!offer) return { success: false, reason: "Hàng chợ đen không còn." };
    if (Number(state.player.lifespan || 0) < offer.lifespan) return { success: false, reason: "Không đủ Thọ Nguyên để trả giá." };
    const result = receiveFate(state, fateId, { source: "Nghịch Thương Nhân", allowPending: true });
    if (!result.added && !result.pending) return { success: false, reason: result.reason || "Mệnh Kho không thể tiếp nhận." };
    state.player.lifespan -= offer.lifespan; state.blackMarketOffers = state.blackMarketOffers.filter((entry) => entry.fateId !== fateId); state.flags.blackMarketOpen = true;
    pushHistory(state, { type: "sys", text: "☽ Nghịch Thương Nhân giao " + offer.fate.name + " · trả " + offer.lifespan + " năm Thọ Nguyên." }); updateDerived(state);
    return { success: true, offer, result };
  }

  function cauldronItemSafety(state, itemId) {
    const item = D().ITEMS[itemId];
    if (!item) return { selectable: false, quickSafe: false, reason: "Vật phẩm không tồn tại." };
    const equipped = equippedItemIds(state.player?.equipment).includes(itemId);
    const protectedItem = Boolean(item.questItem || item.kind === "key" || equipped || item.kind === "currency" || item.kind === "consumable");
    const quickSafe = !protectedItem && (item.kind === "material" || item.generated === true || item.refineMaterial === true);
    return { selectable: !item.questItem && item.kind !== "key" && !equipped, quickSafe, reason: protectedItem ? "Vật phẩm được bảo vệ khỏi chọn nhanh." : "" };
  }
  function normalizeCauldronSelection(selection) {
    const counts = {};
    (Array.isArray(selection) ? selection : []).forEach((entry) => {
      const id = typeof entry === "string" ? entry : entry?.itemId;
      const quantity = typeof entry === "string" ? 1 : Math.max(0, Math.floor(Number(entry?.quantity || 0)));
      if (id && quantity) counts[id] = Number(counts[id] || 0) + quantity;
    });
    return Object.entries(counts).map(([itemId, quantity]) => ({ itemId, quantity }));
  }
  function refineAtVoidCauldron(state, selection) {
    const normalized = normalizeCauldronSelection(selection);
    const totalQuantity = normalized.reduce((sum, entry) => sum + entry.quantity, 0);
    if (totalQuantity < 3 || totalQuantity > 9) return { success: false, reason: "Hư Thiên Đỉnh cần tổng cộng từ 3 đến 9 đơn vị vật phẩm." };
    for (const { itemId, quantity } of normalized) {
      const item = D().ITEMS[itemId];
      if (!item || item.questItem || item.kind === "key") return { success: false, reason: "Vật phẩm " + (item?.name || itemId) + " không thể dùng để dung luyện." };
      if (freeItemQuantity(state, itemId) < quantity) return { success: false, reason: "Không đủ số lượng tự do của " + item.name + ": có " + freeItemQuantity(state, itemId) + ", đã chọn " + quantity + "." };
    }
    normalized.forEach(({ itemId, quantity }) => removeItem(state, itemId, quantity));
    const gradeByCount = totalQuantity >= 7 ? ["phan", "linh", "hoang"] : totalQuantity >= 5 ? ["phan", "linh"] : ["phan"];
    const equipmentPool = Object.values(D().ITEMS).filter((item) => equipmentCategory(item) && !equippedItemIds(state.player.equipment).includes(item.id));
    if (equipmentPool.length && Math.random() < Math.min(0.7, 0.28 + totalQuantity * 0.045)) {
      const item = equipmentPool[rnd(0, equipmentPool.length - 1)];
      addItem(state, item.id, 1);
      state.flags.lastCauldronResult = "Pháp bảo · " + item.name;
      pushHistory(state, { type: "sys", text: "§ Hư Thiên Đỉnh dung luyện " + totalQuantity + " đơn vị, kết tinh thành pháp bảo " + item.name + "." });
      return { success: true, consumed: normalized, totalQuantity, result: { kind: "item", item } };
    }
    const fate = rollFateByProgression(state, { level: Math.max(1, totalQuantity - 1), gradeCap: gradeByCount.length, minimumGrade: 1 });
    const result = fate && receiveFate(state, fate.id);
    if (!fate || !result?.added) { normalized.forEach(({ itemId, quantity }) => addItem(state, itemId, quantity)); return { success: false, reason: result?.reason || "Lò luyện chưa tìm thấy cách cục tương hợp." }; }
    state.flags.lastCauldronResult = "Mệnh Số · " + fate.name;
    pushHistory(state, { type: "sys", text: "§ Hư Thiên Đỉnh dung luyện " + totalQuantity + " đơn vị, kết thành " + fate.name + "." });
    return { success: true, consumed: normalized, totalQuantity, result: { kind: "fate", fate } };
  }

  /* ---------- Inventory ---------- */
  function addItem(state, itemId, qty = 1) {
    if (!D().ITEMS[itemId]) return false;
    state.inventory[itemId] = (state.inventory[itemId] || 0) + qty;
    return true;
  }

  // Bảo đảm mọi mệnh nhân đều có kiếm khởi đầu; save cũ được migrate một lần.
  function ensureStarterKit(state) {
    state.flags = state.flags || {};
    if (state.flags.starterKitGranted) return;
    if (!state.inventory || typeof state.inventory !== "object") state.inventory = {};
    if (!state.inventory.hac_thiet_kiem && D().ITEMS.hac_thiet_kiem) addItem(state, "hac_thiet_kiem", 1);
    state.flags.starterKitGranted = true;
  }
  function removeItem(state, itemId, qty = 1) {
    if (!state.inventory[itemId]) return false;
    state.inventory[itemId] -= qty;
    if (state.inventory[itemId] <= 0) delete state.inventory[itemId];
    return true;
  }

  /* ---------- Mệnh Kho ---------- */
  function fateVaultCapacity(state) {
    state.flags = state.flags || {};
    const realmSlots = Number(realmById(state.player.realmId)?.activeSlots || 0);
    const unlockedSlots = Math.max(Number(state.flags.fateSlotCapacity || 0), realmSlots, Number((state.player.fates || []).length || 0));
    state.flags.fateSlotCapacity = unlockedSlots;
    return Math.max(0, unlockedSlots * 2);
  }
  function fateTags(fate) {
    const effects = Array.isArray(fate.effects) ? fate.effects : Object.entries(fate.effects || {}).flatMap(([key, value]) => [key, String(value)]);
    const source = [fate.name, fate.type, ...effects, ...(fate.tags || [])].join(" ");
    return normalizedText(source);
  }
  function pathRelation(pathId) {
    return (typeof window !== "undefined" && window.PATH_FATE_RELATIONS?.paths?.[pathId]) || null;
  }
  function selectPath(state, pathId) {
    if (cultivationTier(state) < 2) return { success: false, reason: "Chỉ được chọn Con Đường hoặc Ngoại Đạo Giả khi đã bước vào cảnh giới thứ 2." };
    const relation = pathRelation(pathId);
    if (!relation) return { success: false, reason: "Con Đường không tồn tại." };
    if (state.player.pathId && state.player.pathId !== pathId) return { success: false, reason: "Muốn đổi Con Đường phải hoàn thành quest chuyển đường." };
    if (pathId === "ngoai_dao_gia") {
      if (state.player.hiddenProfession) return { success: false, reason: "Ngoại Đạo Giả không thể đồng thời mang nghề ẩn." };
      state.player.pathId = pathId;
      state.player.unboundTrials = state.player.unboundTrials || {};
      state.flags.pathChoicePending = false;
      pushHistory(state, { type: "sys", text: "§ Đã bước vào lộ trình Kẻ Vô Lộ — Ngoại Đạo Giả." });
      return { success: true, pathId, score: 0 };
    }
    const summary = pathMatchSummary(state.player, pathId);
    if (summary.lead < 1 || summary.score < 3 || summary.allHung) return { success: false, reason: "Mệnh Số chưa đủ Mệnh dẫn hoặc tương hợp để mở Con Đường." };
    state.player.pathId = pathId;
    state.flags.pathChoicePending = false;
    pushHistory(state, { type: "sys", text: "§ Đã chọn Con Đường: " + getPathDisplayName(pathId) + "." });
    if (!state.flags.pathFateGranted) {
      const owned = new Set([...(state.player.fates || []), ...(state.fateInventory || [])]);
      const gift = D().FATE_PATTERNS.filter((fate) => fate.grade === "phan" && !owned.has(fate.id) && fateCompatibility(pathId, fate) >= 3)
        .sort((a, b) => fateCompatibility(pathId, b) - fateCompatibility(pathId, a) || Number(b.score || 0) - Number(a.score || 0))[0];
      if (gift) {
        const received = receiveFate(state, gift.id, { source: "chọn Con Đường", allowPending: true });
        if (received.added) pushHistory(state, { type: "sys", text: "◇ Con Đường đáp lại: " + gift.name + " đã vào Mệnh Kho." });
      }
      state.flags.pathFateGranted = true;
    }
    return { success: true, pathId, score: summary.score };
  }
  function pathTitle(state) {
    const tier = cultivationTier(state);
    if (tier === 1) return "Di Mệnh Cảnh";
    if (!state.player.pathId) return tier === 2 ? "Khai Lộ Cảnh · Chờ Chọn Con Đường" : "Đạo Lộ Chưa Định";
    const titles = window.PATH_FATE_RELATIONS?.path_titles?.[state.player.pathId] || [];
    return titles[Math.min(titles.length - 1, Math.max(0, tier - 1))] || "Đạo Lộ Chưa Định";
  }

  const REALM_LORE = {
    1: { insight: "mệnh nhân vừa thức tỉnh Mệnh Số, bắt đầu nhìn thấy những sợi nhân quả quấn quanh bản thân", benefit: "khai mở Tử Vi Mệnh Bàn và khả năng hấp thu linh khí sơ khai", price: "thân phàm chưa có đạo thai, Hung Mệnh và tà niệm có thể trực tiếp làm thần thức rạn vỡ" },
    2: { insight: "kinh mạch hóa thành cửa ngõ, buộc mệnh nhân chọn một Con Đường để linh khí có nơi quy tụ", benefit: "mở đạo lộ, tư cách nhập môn và khả năng dựng nền Công pháp Cốt Lõi", price: "mỗi lựa chọn loại bỏ vô số khả năng khác; Mệnh Số trái đường bắt đầu phản phệ" },
    3: { insight: "đạo ý kết thành phôi thai vô hình trong đan điền, mang hình thái riêng của Con Đường", benefit: "Thể phách và Linh lực tăng vọt, Công pháp bắt đầu sinh dị tượng", price: "đạo thai non yếu; căn cơ, Mệnh Số hoặc tâm cảnh bất hòa sẽ để lại đạo thương lâu dài" },
    4: { insight: "đạo thai được khắc thành Kim Ấn, ghi tên mệnh nhân vào pháp tắc của một phương", benefit: "uy lực Công pháp ổn định và có thể trấn áp tu sĩ dưới cảnh", price: "Kim Ấn càng mạnh càng khó sửa; phá ấn đồng nghĩa tự đoạn căn cơ" },
    5: { insight: "Kim Ấn thai nghén Anh Linh, một cái tôi siêu phàm có thể nhìn lại chủ nhân từ trong thần thức", benefit: "thần thức xuất ngoại, điều khiển pháp khí và cảm nhận tà dị từ xa", price: "Anh Linh có thể bị ô nhiễm, đoạt xá hoặc nuôi lớn chấp niệm thành một bản ngã khác" },
    6: { insight: "Anh Linh chạm vào Thần Tính, bắt đầu mang quyền năng không còn hoàn toàn thuộc về phàm sinh", benefit: "lĩnh vực đạo ý thành hình và tuổi thọ vượt xa sinh linh thường", price: "nhân tính bị bào mòn; mỗi lần vận dụng quyền năng đều khiến Cổ Thần dễ nhận ra mệnh nhân hơn" },
    7: { insight: "thần thức mở một Hư Giới nội tại, nơi ý niệm có thể tạm thời trở thành quy tắc", benefit: "vượt cương phong, hư không và đặt chân tới Thiên Không Vực", price: "Hư Giới có khe nứt sẽ mời gọi những thứ ở ngoài thực tại nhìn vào" },
    8: { insight: "thân, hồn, Mệnh và Con Đường tạm thời Hợp Đạo thành một chỉnh thể", benefit: "đạo vực áp chế pháp tắc ngoại lai, Công pháp có thể chạm tới bản chất", price: "mọi món nợ nhân quả cùng hội tụ; một mắt xích sụp đổ sẽ kéo theo toàn bộ đạo cơ" },
    9: { insight: "thiên địa giáng kiếp để xác nhận kẻ tu hành có xứng đáng mang đạo của riêng mình", benefit: "sống qua thiên kiếp sẽ luyện sạch tạp chất và khiến đạo vực tự vận chuyển", price: "kiếp số đánh vào đúng điểm yếu sâu nhất; thất bại có thể xóa cả thân, hồn lẫn dấu vết trong Mệnh" },
    10: { insight: "đạo vực hoàn chỉnh khiến mệnh nhân trở thành Chủ Tể của một miền pháp tắc", benefit: "đủ sức mở cõi, trấn tông và bước vào U Minh Giới mà không lập tức bị đồng hóa", price: "quyền năng gắn với trách nhiệm và lãnh thổ; mất đạo vực sẽ chịu phản chấn như thế giới sụp đổ" },
    11: { insight: "mệnh nhân bước ra ngoài lớp chân thực quen thuộc, nhìn thấy các vị diện như những mặt gương chồng lấn", benefit: "du hành Ngoại Vực và can thiệp pháp tắc dị giới", price: "càng xa bản giới càng khó giữ Chân Danh; kẻ quên mình sẽ biến thành dị vật vô chủ" },
    12: { insight: "thân, hồn và đạo ấn được tôi qua vạn kiếp thành cấu trúc Kim Bất Hoại", benefit: "khó bị tiêu diệt bằng thủ đoạn thông thường và có thể tái tạo từ đạo ấn", price: "bất hoại không đồng nghĩa bất nhiễm; tà tính bám vào đạo ấn cũng trở nên gần như vĩnh cửu" },
    13: { insight: "mệnh nhân chạm Thái Ất, có thể bóc tách nhân quả và tạo ra Quyền Năng độc nhất", benefit: "viết lại một phần luật trời, chuẩn bị tranh đoạt quyền định nghĩa thiên mệnh", price: "mọi lần sửa luật đều tạo Mệnh Trái; Thiên Đạo và Tà Thần cùng xem mệnh nhân là biến số phải xử lý" },
    14: { insight: "Con Đường thoát khỏi khuôn mẫu của bản giới, tự chứng tồn tại ở bên ngoài Đạo", benefit: "không còn bị một hệ pháp tắc duy nhất định đoạt và có thể lập đạo thống mới", price: "không còn thiên địa che chở; một ý niệm sai có thể hóa thành tai họa cho vô số thế giới" }
  };

  function realmLore(state, realmOrLevel) {
    const realm = typeof realmOrLevel === "object" ? realmOrLevel : D().REALMS.find((item) => Number(item.level) === Number(realmOrLevel));
    const level = Number(realm?.level || 1);
    const lore = REALM_LORE[level] || REALM_LORE[1];
    const pathTitles = window.PATH_FATE_RELATIONS?.path_titles?.[state?.player?.pathId] || [];
    if (level > 2 && state?.player && !state.player.pathId) {
      return { level, title: "???", insight: "đạo lộ chưa được lựa chọn", benefit: "chưa thể suy diễn", price: "chưa thể suy diễn", text: "Thiên cơ chưa định. Hãy chọn Con Đường tại Khai Lộ Cảnh để nhìn thấy cảnh giới kế tiếp." };
    }
    const title = level === 1 ? "Di Mệnh Cảnh" : level === 2 ? (pathTitles[1] || "Khai Lộ Cảnh") : (pathTitles[level - 1] || realm?.name || "Vô Danh Cảnh");
    return { level, title, ...lore, text: title + " — " + lore.insight + ". Ích lợi: " + lore.benefit + ". Cái giá: " + lore.price + "." };
  }
  function fateCompatibility(pathId, fate) {
    const relation = pathRelation(pathId); if (!relation || !fate) return 0;
    if (relation.unbound) return 0;
    if (fate.id && !fate.name) fate = D().FATE_PATTERNS.find((item) => item.id === fate.id) || fate;
    const affinity = fatePathAffinity(fate);
    if (affinity.lead.includes(pathId)) return 10;
    if (affinity.support.includes(pathId)) return 6;
    if (affinity.forbidden.includes(pathId)) return 1;
    const text = fateTags(fate);
    const lead = relation.lead.filter((tag) => normalizedText(text).includes(normalizedText(tag))).length;
    const support = relation.support.filter((tag) => normalizedText(text).includes(normalizedText(tag))).length;
    const forbidden = relation.forbidden.filter((tag) => normalizedText(text).includes(normalizedText(tag))).length;
    return clamp(lead * 3 + support - forbidden * 2, 0, 10);
  }
  function pathMatchSummary(character, pathId) {
    const relation = pathRelation(pathId);
    if (!relation || relation.unbound) return { score: 0, lead: 0, support: 0, forbidden: 0, allHung: false };
    let lead = 0; let support = 0; let forbidden = 0; let known = 0; let hung = 0;
    (character.fates || []).forEach((id) => {
      const fate = D().FATE_PATTERNS.find((item) => item.id === id); if (!fate) return;
      known += 1; if (fate.sign === "hung" || String(fate.type || "").toLowerCase().includes("hung")) hung += 1;
      const text = fateTags(fate);
      lead += relation.lead.filter((tag) => text.includes(normalizedText(tag))).length;
      support += relation.support.filter((tag) => text.includes(normalizedText(tag))).length;
      forbidden += relation.forbidden.filter((tag) => text.includes(normalizedText(tag))).length;
    });
    const daoBonus = Number(character.daoTam || 0) >= 80 ? 10 : 0;
    return { score: clamp(lead * 3 + support - forbidden * 2 + daoBonus, 0, 20), lead, support, forbidden, daoBonus, allHung: known > 0 && known === hung };
  }
  const PATH_LABELS = {
    kiem_dao: "Kiếm Đạo", dan_dao: "Đan Đạo", phu_dao: "Phù Đạo", phong_thuy_dao: "Phong Thủy Đạo",
    ngu_thu_dao: "Ngự Thú Đạo", khoi_loi_dao: "Khôi Lỗi Đạo", am_luat_dao: "Âm Luật Đạo",
    mong_canh_dao: "Mộng Cảnh Đạo", luyen_the_dao: "Luyện Thể Đạo", tinh_tuong_dao: "Tinh Tượng Đạo",
    ngoai_dao_gia: "Kẻ Vô Lộ — Ngoại Đạo Giả"
  };
  function getPathDisplayName(pathId) {
    return PATH_LABELS[pathId] || "Con Đường chưa định danh";
  }
  function availablePaths(state) {
    return Object.keys(window.PATH_FATE_RELATIONS?.paths || {}).filter((pathId) => {
      if (pathId === "ngoai_dao_gia") return !state.player.hiddenProfession;
      const summary = pathMatchSummary(state.player, pathId);
      return cultivationTier(state) >= 2 && summary.lead >= 1 && summary.score >= 3 && !summary.allHung;
    });
  }
  function pathProgression(state) {
    const tier = cultivationTier(state);
    const current = state.player.pathId ? getPathDisplayName(state.player.pathId) : "Chưa chọn Con Đường";
    const summary = state.player.pathId ? pathMatchSummary(state.player, state.player.pathId) : { lead: 0, score: 0 };
    return { current, realm: tier, next: tier < 2 ? "Đạt Khai Lộ Cảnh" : state.player.pathId ? "Bồi đắp Mệnh Dẫn và Công Pháp Cốt Lõi" : "Chọn một Con Đường tương hợp", requirements: ["Đạt Khai Lộ Cảnh", "Có ít nhất 1 Mệnh Dẫn", "Điểm tương hợp Con Đường ≥ 3", "Không mang toàn Hung Mệnh", "Công Pháp Cốt Lõi đạt tầng yêu cầu"], summary };
  }

  function completeUnboundTrial(state, trialId) {
    if (state.player.pathId !== "ngoai_dao_gia") return { success: false, reason: "Chỉ Ngoại Đạo Giả có thử thách Vô Lộ." };
    const trials = {
      self_proof: { minLevel: 7, field: "selfProof" }, sever_law: { minLevel: 10, field: "severLaw" },
      establish_path: { minLevel: 12, field: "establishPath" }, prove_unbound: { minLevel: 13, field: "unboundPathProven" }
    };
    const trial = trials[trialId];
    if (!trial || cultivationTier(state) < trial.minLevel) return { success: false, reason: "Thử thách chưa mở." };
    if (trial.field === "unboundPathProven") state.player.unboundPathProven = true;
    else {
      state.player.unboundTrials = state.player.unboundTrials || {};
      state.player.unboundTrials[trial.field] = true;
    }
    pushHistory(state, { type: "sys", text: "§ Hoàn thành thử thách Ngoại Đạo: " + trialId + "." });
    return { success: true, trialId };
  }
  function receiveFate(state, fateId, options = {}) {
    const fate = D().FATE_PATTERNS.find((item) => item.id === fateId || String(item.id) === String(fateId));
    if (!fate) return { added: false, reason: "Mệnh Số không tồn tại." };
    state.fateInventory = Array.isArray(state.fateInventory) ? state.fateInventory : [];
    const uniqueOwner = fateUniqueOwner(state, fate);
    if (fate.grade === "tien" && uniqueOwner && uniqueOwner !== (state.player?.id || "local")) {
      return { added: false, uniqueLocked: true, reason: "Mệnh Số Tiên đã được khóa bởi chủ nhân duy nhất trong thế giới này." };
    }
    if ((state.player.fates || []).includes(fate.id) || state.fateInventory.includes(fate.id)) {
      // Duplicate cấp thấp không bị nuốt mất: chuyển thành Tinh Hoa Dư để nuôi Mệnh Số.
      const essenceByGrade = { phan: 1, linh: 3, hoang: 8 };
      const essence = essenceByGrade[fate.grade];
      if (essence) {
        state.player.fateExcessEssence = Number(state.player.fateExcessEssence || 0) + essence;
        state.fateExcessEssence = state.player.fateExcessEssence;
        pushHistory(state, { type: "sys", text: "◆ Mệnh Số trùng " + fate.name + " đã chuyển thành Tinh Hoa Dư +" + essence + "." });
        return { added: false, duplicate: true, converted: true, essenceGained: essence, reason: "Mệnh Số trùng đã chuyển thành Tinh Hoa Dư." };
      }
      return { added: false, duplicate: true, reason: "Mệnh Số đã sở hữu; cấp này cần xử lý thay thế hoặc dung hợp." };
    }
    state.player.fateInstances = state.player.fateInstances || {};
    const instance = { fateId: fate.id, acquiredAtTurn: Number(state.meta?.turn || 0), source: options.source || "không rõ", relationshipStage: 0, resonanceProgress: 0, nurtureLevel: 0 };
    const capacity = fateVaultCapacity(state);
    if (state.fateInventory.length < capacity) { state.fateInventory.push(fate.id); state.player.fateInstances[fate.id] = instance; markForbiddenKnowledge(state, fate); return { added: true, destination: "vault", replaced: null, source: options.source || "không rõ" }; }
    if (options.allowPending) {
      const reward = { fateId: fate.id, source: options.source || "phần thưởng", createdAtTurn: Number(state.meta?.turn || 0) };
      state.pendingFateRewards = Array.isArray(state.pendingFateRewards) ? state.pendingFateRewards : [];
      if (!state.pendingFateReward) state.pendingFateReward = reward;
      else if (state.pendingFateReward.fateId !== fate.id && !state.pendingFateRewards.some((entry) => entry.fateId === fate.id)) state.pendingFateRewards.push(reward);
      return { added: false, pending: true, queued: Boolean(state.pendingFateReward !== reward), reason: "Mệnh Kho đã đầy; phần thưởng được giữ ở trạng thái chờ xử lý." };
    }
    const pathId = state.player.pathId;
    const incomingScore = fateCompatibility(pathId, fate);
    let replaceIndex = -1; let lowest = Infinity;
    state.fateInventory.forEach((id, index) => {
      const current = D().FATE_PATTERNS.find((item) => item.id === id);
      const score = fateCompatibility(pathId, current);
      if (score < lowest) { lowest = score; replaceIndex = index; }
    });
    if (replaceIndex >= 0 && incomingScore > lowest) { const replaced = state.fateInventory[replaceIndex]; state.fateInventory[replaceIndex] = fate.id; delete state.player.fateInstances[replaced]; state.player.fateInstances[fate.id] = instance; markForbiddenKnowledge(state, fate); return { added: true, destination: "vault", replaced, source: options.source || "không rõ" }; }
    return { added: false, reason: "Mệnh Kho đã đầy; Mệnh Số mới không tương hợp hơn các Mệnh đang giữ." };
  }
  function grantMerit(state, amount, source = "hành thiện") {
    const gain = Math.max(0, Math.floor(Number(amount) || 0));
    if (!gain) return 0;
    state.player.merit = Math.max(0, Number(state.player.merit || 0) + gain);
    pushHistory(state, { type: "sys", text: "✧ Công Đức +" + gain + " · " + source + "." });
    return gain;
  }
  function meritFateOffers(state) {
    const owned = new Set([...(state.player.fates || []), ...(state.fateInventory || [])]);
    if (!Array.isArray(state.meritFateOffers) || !state.meritFateOffers.length) {
      const pool = D().FATE_PATTERNS.filter((f) => !owned.has(f.id) && ["phan", "linh", "hoang"].includes(f.grade) && f.sign !== "hung");
      const picked = pool.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 3);
      state.meritFateOffers = picked.map((f) => ({ fateId: f.id, merit: ({ phan: 10, linh: 25, hoang: 50 }[f.grade] || 50) }));
    }
    return state.meritFateOffers.map((offer) => ({ ...offer, fate: D().FATE_PATTERNS.find((f) => f.id === offer.fateId) })).filter((offer) => offer.fate);
  }
  function buyFateWithMerit(state, fateId) {
    const offer = meritFateOffers(state).find((entry) => entry.fateId === fateId);
    if (!offer) return { success: false, reason: "Mệnh Số này không còn trong quầy Công Đức." };
    const merit = Number(state.player.merit || 0);
    if (merit < offer.merit) return { success: false, reason: "Thiếu Công Đức: cần " + offer.merit + "." };
    const result = receiveFate(state, fateId, { source: "đổi Công Đức", allowPending: true });
    if (!result.added && !result.pending) return { success: false, reason: result.reason || "Không thể nhận Mệnh Số." };
    state.player.merit = merit - offer.merit;
    state.meritFateOffers = state.meritFateOffers.filter((entry) => entry.fateId !== fateId);
    state.flags.lastMeritFateResult = "Đổi " + offer.merit + " Công Đức lấy " + offer.fate.name + (result.pending ? " · chờ xử lý" : " · Mệnh Kho");
    pushHistory(state, { type: "sys", text: "✧ " + state.flags.lastMeritFateResult + "." }); updateDerived(state);
    return { success: true, offer, result };
  }
  function explorationMilestone(state) {
    const count = Array.isArray(state.visitedLocations) ? state.visitedLocations.length : 0;
    state.flags = state.flags || {};
    const awarded = Number(state.flags.explorationMeritMilestone || 0);
    const milestone = Math.floor(count / 5);
    if (milestone > awarded) {
      state.flags.explorationMeritMilestone = milestone;
      grantMerit(state, milestone * 2, "khai mở " + count + " địa mạch");
      return milestone * 2;
    }
    return 0;
  }
  function sacrificeFate(state, fateId) {
    state.fateInventory = Array.isArray(state.fateInventory) ? state.fateInventory : [];
    const index = state.fateInventory.findIndex((id) => String(id) === String(fateId));
    if (index < 0) return { success: false, reason: "Mệnh Số không nằm trong Mệnh Kho." };
    if (!state.player.pathId) return { success: false, reason: "Chưa chọn Con Đường nhân vật." };
    if (state.player.pathId === "ngoai_dao_gia") return { success: false, reason: "Ngoại Đạo Giả không dùng hiến tế Mệnh để đi đường." };
    const relation = pathRelation(state.player.pathId);
    if (!relation) return { success: false, reason: "Con Đường chưa có bảng liên kết Mệnh Số." };
    const offered = D().FATE_PATTERNS.find((item) => item.id === state.fateInventory[index]);
    const candidate = D().FATE_PATTERNS.filter((item) => !(state.player.fates || []).includes(item.id) && !state.fateInventory.includes(item.id))
      .map((item) => ({ item, score: fateCompatibility(state.player.pathId, item) })).filter((x) => x.score >= 3)
      .sort((a, b) => b.score - a.score || b.item.score - a.item.score)[0];
    if (!candidate) return { success: false, reason: "Chưa tìm thấy Mệnh Số tương hợp để triệu hoán." };
    state.fateInventory.splice(index, 1);
    const result = receiveFate(state, candidate.item.id);
    if (!result.added) { state.fateInventory.splice(index, 0, offered.id); return { success: false, reason: result.reason || "Mệnh Kho không thể tiếp nhận Mệnh mới." }; }
    drainSan(state, 5, "hiến tế Mệnh Số");
    pushHistory(state, { type: "warn", text: "Hiến tế " + (offered?.name || fateId) + ", triệu hoán " + candidate.item.name + "." });
    updateDerived(state);
    return { success: result.added, fateId: candidate.item.id, reason: result.reason };
  }
  function fateVaultSummary(state) {
    const ids = Array.isArray(state.fateInventory) ? state.fateInventory : [];
    const activeIds = Array.isArray(state.player?.fates) ? state.player.fates : [];
    const ownedIds = [...new Set([...activeIds, ...ids])];
    return { capacity: fateVaultCapacity(state), used: ids.length, ids, activeCount: activeIds.length, ownedCount: ownedIds.length, items: ids.map((id) => D().FATE_PATTERNS.find((fate) => fate.id === id)).filter(Boolean) };
  }

  function validateFateInventory(state, source = "runtime") {
    const summary = fateVaultSummary(state);
    const actual = new Set([...(state.player?.fates || []), ...(state.fateInventory || [])]).size;
    const valid = actual === summary.ownedCount;
    if (!valid && typeof console !== "undefined") console.warn("[FateInvariant]", source, { actual, displayed: summary.ownedCount, active: summary.activeCount, vault: summary.used });
    return { ...summary, actualOwnedCount: actual, valid };
  }

  function swapFateFromVault(state, activeIndex, vaultId) {
    const active = Array.isArray(state.player?.fates) ? state.player.fates : [];
    const vault = Array.isArray(state.fateInventory) ? state.fateInventory : [];
    const index = Number(activeIndex);
    const vaultIndex = vault.findIndex((id) => String(id) === String(vaultId));
    const maxSlots = Number(realmById(state.player.realmId).activeSlots || active.length);
    if (index < 0 || index >= maxSlots || vaultIndex < 0) return { success: false, reason: "Ấn ký Mệnh Số không hợp lệ." };
    const oldId = active[index];
    active[index] = vault[vaultIndex];
    if (oldId) vault[vaultIndex] = oldId; else vault.splice(vaultIndex, 1);
    updateDerived(state);
    pushHistory(state, { type: "sys", text: "§ Hoán đổi Ấn ký Mệnh Số thành công." });
    return { success: true, activeId: active[index], vaultId: vault[vaultIndex] };
  }
  function fateSwapPreview(state, activeIndex, vaultId) {
    const index = Number(activeIndex);
    const incoming = D().FATE_PATTERNS.find((f) => f.id === vaultId);
    const outgoingId = (state.player.fates || [])[index];
    const outgoing = D().FATE_PATTERNS.find((f) => f.id === outgoingId);
    const simulated = { ...state.player, fates: [...(state.player.fates || [])] };
    simulated.fates[index] = vaultId;
    const beforeFate = computeFate(state.player); const afterFate = computeFate(simulated);
    const beforeStats = computeStats(state.player); const afterStats = computeStats(simulated);
    const beforeMatch = state.player.pathId ? pathMatchSummary(state.player, state.player.pathId) : { score: 0 };
    const afterMatch = state.player.pathId ? pathMatchSummary(simulated, state.player.pathId) : { score: 0 };
    return { index, incoming, outgoing, beforeFate, afterFate, beforeStats, afterStats, beforeMatch, afterMatch };
  }
  function storeFateToVault(state, activeIndex) {
    const active = Array.isArray(state.player?.fates) ? state.player.fates : [];
    const index = Number(activeIndex); const id = active[index];
    if (!id) return { success: false, reason: "Ô Ấn ký này đang trống." };
    const vault = state.fateInventory = Array.isArray(state.fateInventory) ? state.fateInventory : [];
    if (vault.length >= fateVaultCapacity(state)) return { success: false, reason: "Mệnh Kho đã đầy." };
    vault.push(id); active.splice(index, 1); updateDerived(state);
    pushHistory(state, { type: "sys", text: "Đã tháo Mệnh Số khỏi Ấn ký và đưa vào Mệnh Kho." });
    return { success: true, fateId: id };
  }
  function equipFateFromVault(state, vaultId, activeIndex = -1) {
    const active = Array.isArray(state.player?.fates) ? state.player.fates : [];
    const index = activeIndex >= 0 ? Number(activeIndex) : active.findIndex((id) => !id);
    const maxSlots = Number(realmById(state.player.realmId).activeSlots || active.length);
    if (index < 0 && active.length >= maxSlots) return { success: false, requiresReplacement: true, vaultId, reason: "Tất cả Ấn ký đã đầy. Hãy chọn một Mệnh đang kích hoạt để thay thế." };
    const target = index >= 0 ? index : active.length;
    return swapFateFromVault(state, target, vaultId);
  }
  function fateUpgradePreview(state, targetId, materialId = null) {
    const target = D().FATE_PATTERNS.find((f) => f.id === targetId);
    const material = materialId ? D().FATE_PATTERNS.find((f) => f.id === materialId) : null;
    const level = fateEnhancementLevel(state.player, targetId);
    const beforeScore = Number(target?.score || 0) + level * 2;
    const afterLevel = Math.min(5, level + 1);
    const beforeEffects = enhancedFateEffects(state.player, target);
    const simulated = { ...state.player, fateEnhancements: { ...(state.player.fateEnhancements || {}), [targetId]: afterLevel } };
    const afterEffects = enhancedFateEffects(simulated, target);
    return { target, material, level, afterLevel, beforeScore, afterScore: Number(target?.score || 0) + afterLevel * 2, beforeEffects, afterEffects, validMaterial: Boolean(target && material && target.id !== material.id && target.grade === material.grade && (state.fateInventory || []).includes(material.id)), capped: level >= 5 };
  }
  function upgradeFate(state, targetId, materialId) {
    const owned = [...(state.player.fates || []), ...(state.fateInventory || [])];
    if (!owned.includes(targetId)) return { success: false, reason: "Mệnh Số mục tiêu chưa thuộc quyền sở hữu." };
    const vault = state.fateInventory || []; const materialIndex = vault.indexOf(materialId);
    if (materialIndex < 0 || materialId === targetId) return { success: false, reason: "Cần một Mệnh Số khác trong Mệnh Kho làm chất liệu." };
    const target = D().FATE_PATTERNS.find((f) => f.id === targetId); const material = D().FATE_PATTERNS.find((f) => f.id === materialId);
    if (!target || !material || target.grade !== material.grade) return { success: false, reason: "Chỉ dung hợp Mệnh Số cùng phẩm trật." };
    if (state.player.fateEvolutions?.[materialId]?.status === "evolved") return { success: false, reason: "Mệnh đã Tiến Hóa không thể dùng làm chất liệu mặc định." };
    if (fateEnhancementLevel(state.player, targetId) >= 5) return { success: false, reason: "Mệnh Số đã đạt Cường Hóa tối đa +5." };
    const before = fateUpgradePreview(state, targetId, materialId);
    vault.splice(materialIndex, 1); state.player.fateEnhancements = state.player.fateEnhancements || {};
    state.player.fateEnhancements[targetId] = Number(state.player.fateEnhancements[targetId] || 0) + 1;
    updateDerived(state); state.flags.lastFateUpgrade = target.name + " · Cường Hóa +" + state.player.fateEnhancements[targetId] + " · Mệnh Điểm " + before.beforeScore + " → " + before.afterScore;
    pushHistory(state, { type: "sys", text: "✦ " + state.flags.lastFateUpgrade + "." });
    if (state.player.fateEnhancements[targetId] === 5 && typeof window !== "undefined" && window.GameExpansion?.fateEvolutionEligibility) {
      const evolutionGate = window.GameExpansion.fateEvolutionEligibility(state, targetId);
      pushHistory(state, { type: evolutionGate.eligible ? "sys" : "warn", text: evolutionGate.eligible ? "✦ Mệnh đã đủ điều kiện mở Mệnh Kiếp trong Thế Sự." : "◇ Mệnh đạt +5 nhưng chưa thể Tiến Hóa: " + evolutionGate.blockers.join(" · ") });
    }
    return { success: true, level: state.player.fateEnhancements[targetId], preview: before };
  }
  function resolvePendingFateReward(state, replaceVaultId = null) {
    const pending = state.pendingFateReward;
    const fate = D().FATE_PATTERNS.find((item) => item.id === pending?.fateId);
    if (!pending || !fate) return { success: false, reason: "Không có Mệnh Số chờ xử lý." };
    const vault = state.fateInventory = Array.isArray(state.fateInventory) ? state.fateInventory : [];
    let replaced = null;
    if (vault.length < fateVaultCapacity(state)) vault.push(fate.id);
    else {
      const index = vault.findIndex((id) => id === replaceVaultId);
      if (index < 0) return { success: false, requiresReplacement: true, reason: "Mệnh Kho vẫn đầy; hãy chọn một Mệnh trong kho để thay." };
      replaced = vault[index]; vault[index] = fate.id;
    }
    state.pendingFateRewards = Array.isArray(state.pendingFateRewards) ? state.pendingFateRewards : [];
    state.pendingFateReward = state.pendingFateRewards.shift() || null; markForbiddenKnowledge(state, fate); updateDerived(state);
    pushHistory(state, { type: "sys", text: "◇ Đã nhận " + fate.name + " từ " + pending.source + " vào Mệnh Kho" + (replaced ? ", thay cho " + (D().FATE_PATTERNS.find((f) => f.id === replaced)?.name || replaced) : "") + "." });
    return { success: true, fate, replaced };
  }
  function dismissPendingFateReward(state) {
    if (!state.pendingFateReward) return false;
    const fate = D().FATE_PATTERNS.find((item) => item.id === state.pendingFateReward.fateId);
    pushHistory(state, { type: "warn", text: "Đã từ chối Mệnh Số chờ nhận: " + (fate?.name || state.pendingFateReward.fateId) + "." });
    state.pendingFateRewards = Array.isArray(state.pendingFateRewards) ? state.pendingFateRewards : [];
    state.pendingFateReward = state.pendingFateRewards.shift() || null; return true;
  }
  function mergeFates(state, fateIds) {
    const ids = [...new Set(fateIds || [])]; const vault = state.fateInventory || [];
    if (ids.length < 2 || ids.some((id) => !vault.includes(id))) return { success: false, reason: "Cần ít nhất 2 Mệnh Số trong Mệnh Kho." };
    if (ids.some((id) => state.player.fateEvolutions?.[id]?.status === "evolved")) return { success: false, reason: "Mệnh đã Tiến Hóa cần Giải Thể riêng, không thể dung hợp mặc định." };
    ids.forEach((id) => vault.splice(vault.indexOf(id), 1));
    const rank = FATE_GRADE_RANK;
    const minRank = Math.min(...ids.map((id) => rank[D().FATE_PATTERNS.find((f) => f.id === id)?.grade] || 1));
    const fate = rollFateByProgression(state, { level: Math.max(3, minRank + 1), minimumGrade: Math.min(8, minRank + 1), gradeCap: Math.min(6, minRank + 2) });
    const result = fate && receiveFate(state, fate.id);
    if (!result?.added) { ids.forEach((id) => vault.push(id)); return { success: false, reason: result?.reason || "Không thể dung hợp lúc này." }; }
    pushHistory(state, { type: "sys", text: "Mệnh Kho dung hợp " + ids.length + " Mệnh Số, sinh ra " + fate.name + "." });
    return { success: true, fate };
  }

  function registerGeneratedItem(state, item) {
    if (!item || !item.id || !item.name || !item.kind) return false;
    state.generatedItems = state.generatedItems || {};
    state.fateInventory = Array.isArray(state.fateInventory) ? state.fateInventory : [];
    state.generatedItems[item.id] = { ...item };
    D().ITEMS[item.id] = state.generatedItems[item.id];
    return true;
  }

  function createLootItem(state, targetKind = null) {
    const generator = typeof window !== "undefined" ? window.ItemGenerator : null;
    if (!generator || typeof generator.createRandomItem !== "function") return null;
    const item = generator.createRandomItem(targetKind);
    if (!registerGeneratedItem(state, item)) return null;
    addItem(state, item.id, 1);
    return item;
  }

  /* ---------- Quest ---------- */
  function chooseOrigin(state, branch, specializationId) {
    if (!state.flags.originChoicePending) return { success: false, reason: "Thân phận hành đạo đã được định." };
    const profile = ORIGIN_PROFILES[branch];
    const specialization = profile?.specializations?.[specializationId];
    if (!profile || !specialization) return { success: false, reason: "Xuất thân hoặc thiên hướng không hợp lệ." };
    const previousMaxQi = Number(state.player.maxQi || 0);
    const previousMaxStamina = Number(state.player.maxStamina || 0);
    const modifiers = { ...profile.baseModifiers };
    Object.entries(specialization.modifiers || {}).forEach(([key, value]) => { modifiers[key] = Number(modifiers[key] || 0) + Number(value || 0); });
    const traits = [...new Set([...(profile.baseTraits || []), ...(specialization.traits || [])])];
    state.player.origin = { type: branch, specialization: specializationId, name: profile.name, specializationName: specialization.name, modifiers, traits, confirmed: true };
    state.player.background = profile.name;
    state.flags.originChoicePending = false;
    state.flags.originChoice = { branch, specialization: specializationId, chosenAt: Date.now(), consequences: [], confirmed: true };
    state.flags.originLocked = true;
    [profile.starterItems || {}, specialization.starterItems || {}].forEach((items) => {
      Object.entries(items).forEach(([itemId, qty]) => addItem(state, itemId, Number(qty || 0)));
    });
    if (branch === "the_gia") state.player.merit = Number(state.player.merit || 0) + 2;
    const seed = state.flags.originSituation?.questSeed;
    if (seed && state.quests[seed]) { state.quests[seed].status = "active"; state.flags.originChoice.starterQuestId = seed; }
    pushMemory(state, "Xuất thân: " + profile.name + " · " + specialization.name + ".");
    pushHistory(state, { type: "sys", text: "§ Xuất thân đã định: " + profile.name + " · " + specialization.name + ". Lựa chọn này được lưu vĩnh viễn cho nhân vật." });
    checkAllQuests(state);
    updateDerived(state);
    state.player.qi = Math.min(state.player.maxQi, Number(state.player.qi || 0) + Math.max(0, state.player.maxQi - previousMaxQi));
    state.player.stamina = Math.min(state.player.maxStamina, Number(state.player.stamina || 0) + Math.max(0, state.player.maxStamina - previousMaxStamina));
    return { success: true, branch, specialization: specializationId, origin: state.player.origin };
  }
  function chooseOriginBranch(state, branch) {
    const defaults = { tan_tu: "kiem_tu", the_gia: "linh_mach" };
    return chooseOrigin(state, branch, defaults[branch]);
  }
  function activateQuest(state, questId) {
    const q = state.quests[questId];
    if (q && (q.status === "available" || q.status === "locked")) {
      q.status = "active"; q.discoveredAt = q.discoveredAt || Date.now(); q.tracked = true;
    }
  }
  function trackQuest(state, questId, tracked = true) {
    const q = state.quests?.[questId]; if (!q || !["active", "available"].includes(q.status)) return false;
    Object.values(state.quests).forEach((item) => { item.tracked = false; }); q.tracked = Boolean(tracked); return true;
  }
  function abandonQuest(state, questId, reason = "Người chơi từ bỏ") {
    const q = state.quests?.[questId]; if (!q || !["active", "available"].includes(q.status)) return false;
    q.status = "failed"; q.failedAt = Date.now(); q.failureReason = reason; pushHistory(state, { type: "warn", text: "× Đã từ bỏ nhiệm vụ: " + (q.title || questId) + "." }); return true;
  }
  function maybeSpawnDynamicQuest(state) {
    state.flags.dynamicQuestCooldown = Number(state.flags.dynamicQuestCooldown || 0);
    if (state.flags.dynamicQuestCooldown > Number(state.meta.turn || 0)) return;
    const activeDynamic = Object.values(state.quests || {}).some((q) => q.id.startsWith("dynamic_") && q.status === "active");
    if (activeDynamic || Math.random() >= 0.2) return;
    const loc = D().LOCATIONS[state.locationId]; if (!loc) return;
    const id = "dynamic_trace_" + state.meta.turn;
    const title = "Dấu Chân Chưa Khép · " + loc.name;
    D().QUESTS[id] = { id, title, kind: "co_duyen", priority: 2, objectives: [{ id: "observe", label: "Quan Sát hoặc Tìm Kiếm tại khu vực này", check: (st) => Number(st.flags.searches?.[st.locationId] || 0) > 0 || st.flags.lastCombatOutcome === "fled" }], reward: { exp: 25, merit: 3 } };
    state.quests[id] = { id, type: "co_duyen", title, priority: 2, status: "active", tracked: true, discoveredAt: Date.now(), objectives: [{ id: "observe", label: "Quan Sát hoặc Tìm Kiếm tại khu vực này", done: false }], branches: [{ id: "investigate", label: "Điều tra dấu vết", alternatives: ["search", "talk"] }], alternatives: ["search", "talk", "combat"], consequences: {}, expiresAt: Date.now() + 86400000 };
    state.flags.dynamicQuestCooldown = Number(state.meta.turn || 0) + 6;
    pushHistory(state, { type: "narr", text: "✦ Cơ duyên động: " + title + ". Hãy Quan Sát hoặc Tìm Kiếm để lần theo dấu vết." });
  }
  function checkQuestObjectives(state, questId) {
    const q = state.quests[questId];
    if (!q || q.status !== "active") return;
    const def = D().QUESTS[questId];
    let allDone = true;
    q.objectives.forEach((o) => {
      const defO = def.objectives.find((x) => x.id === o.id);
      if (defO && !o.done && defO.check(state)) o.done = true;
      if (!o.done) allDone = false;
    });
    if (allDone) {
      q.status = "completed";
      q.completedAt = Date.now();
      const r = def.reward || {};
      const summary = { questId, title: def.title, kind: def.kind || "normal", rewards: [] };
      if (r.exp) { gainExp(state, r.exp); summary.rewards.push({ type: "Tu vi", value: r.exp }); }
      if (r.linhThach || r.money) summary.rewards.push({ type: "Linh thạch", value: Number(r.linhThach || r.money) });
      if (r.item) { addItem(state, r.item, 1); summary.rewards.push({ type: "Vật phẩm", value: D().ITEMS[r.item]?.name || r.item }); }
      const fateIds = r.fates || (r.fate ? [r.fate] : []);
      fateIds.forEach((id) => { const result = receiveFate(state, id, { source: "nhiệm vụ " + def.title, allowPending: true }); const fate = D().FATE_PATTERNS.find((f) => f.id === id); if (result.added || result.pending) summary.rewards.push({ type: "Mệnh Số", value: fate ? fate.name + " · " + (fate.gradeLabel || fate.grade || "") + (result.pending ? " · chờ xử lý" : " · Mệnh Kho") : id }); });
      const techniqueIds = r.techniques || (r.technique ? [r.technique] : []);
      techniqueIds.forEach((id) => { if (learnTechnique(state, id)) summary.rewards.push({ type: "Công Pháp", value: techniqueCatalog()[id]?.name || id }); });
      const merit = Math.max(0, Number(r.merit ?? 2));
      state.player.merit = Math.max(0, Number(state.player.merit || 0) + merit);
      if (merit) summary.rewards.push({ type: "Công Đức", value: merit });
      if (r.contribution) { state.player.contribution = Number(state.player.contribution || 0) + Number(r.contribution); summary.rewards.push({ type: "Cống Hiến", value: r.contribution }); }
      state.pendingRewardSummaries = Array.isArray(state.pendingRewardSummaries) ? state.pendingRewardSummaries : [];
      state.pendingRewardSummaries.push(summary);
      pushMemory(state, "Hoàn thành nhiệm vụ: " + def.title);
      pushHistory(state, { type: "sys", text: "§ Nhiệm vụ hoàn thành: " + def.title + (merit ? " · Công Đức +" + merit : "") });
    }
  }
  function failQuest(state, questId, reason) {
    const q = state.quests[questId];
    if (q && q.status === "active") {
      q.status = "failed"; q.failedAt = Date.now(); q.failureReason = reason || "Không hoàn thành mục tiêu";
      pushHistory(state, { type: "warn", text: "× Nhiệm vụ thất bại: " + D().QUESTS[questId].title + (reason ? " (" + reason + ")" : "") });
    }
  }

  /* ---------- Môn phái / tổ chức ---------- */
  function currentRegionId(state) {
    return D().WORLD_MAP?.locations?.[state.locationId]?.region || "trung_vuc";
  }

  function travelHubCatalog() {
    return D().FACTION_DATA?.world?.travel_hubs || [
      { id: "son_mon", name: "Sơn Môn Thiên Huyền Tông", region_id: "trung_vuc", role: "tong_mon", human_npc: true, safe_for_ritual: true },
      { id: "van_phong", name: "Vạn Phong Điện", region_id: "trung_vuc", role: "tong_mon", human_npc: true, safe_for_ritual: true },
      { id: "tay_mac_khoi_diem", name: "Sa Thành Tây Mạc", region_id: "tay_mac", role: "thanh_chinh", human_npc: true, safe_for_ritual: true },
      { id: "vo_tan_hai_khoi_diem", name: "Lưu Vân Hải Cảng", region_id: "vo_tan_hai", role: "thanh_chinh", human_npc: true, safe_for_ritual: true },
      { id: "bac_nguyen_khoi_diem", name: "Băng Trại Bắc Nguyên", region_id: "bac_nguyen", role: "thanh_chinh", human_npc: true, safe_for_ritual: true }
    ];
  }
  function safeTravelDestination(state) {
    const hubs = travelHubCatalog().filter((hub) => D().LOCATIONS[hub.id]);
    const ritual = breakthroughRitualStatus(state);
    const needsHuman = Boolean(ritual?.remaining?.length) || Boolean(state.flags?.originChoicePending);
    const home = state.homeLocationId && D().LOCATIONS[state.homeLocationId] ? state.homeLocationId : "son_mon";
    if (needsHuman) {
      const ritualHub = hubs.find((hub) => hub.safe_for_ritual && hub.human_npc && hub.id !== state.locationId);
      if (ritualHub) return { ...ritualHub, reason: "Nghi thức cần nhân vật và không gian an toàn." };
    }
    const regional = hubs.find((hub) => hub.region_id === currentRegionId(state) && hub.id !== state.locationId);
    if (regional) return { ...regional, reason: "Điểm trú ẩn gần nhất trong khu vực." };
    const homeHub = hubs.find((hub) => hub.id === home && hub.id !== state.locationId) || hubs.find((hub) => hub.id === "son_mon");
    return homeHub ? { ...homeHub, reason: "Trở về điểm neo hành trình." } : null;
  }
  function travelToSafeHub(state) {
    const destination = safeTravelDestination(state);
    if (!destination) return { success: false, reason: "Chưa có điểm trú ẩn phù hợp trên bản đồ." };
    if (Object.keys(state.enemies || {}).length) return { success: false, reason: "Không thể rút lui nhanh khi đang giao chiến." };
    state.pendingSearch = null;
    state.locationId = destination.id;
    state.visitedLocations = Array.isArray(state.visitedLocations) ? state.visitedLocations : [];
    if (!state.visitedLocations.includes(destination.id)) state.visitedLocations.push(destination.id);
    state.flags.lastSafeTravel = destination.id;
    pushHistory(state, { type: "sys", text: "⌂ Trở về " + destination.name + ". " + destination.reason });
    return { success: true, destination };
  }

  function guildRank(contribution) {
    if (contribution >= 700) return { name: "Trưởng Lão", factor: 1 };
    if (contribution >= 300) return { name: "Chân Truyền", factor: 0.8 };
    if (contribution >= 100) return { name: "Nội Môn", factor: 0.6 };
    return { name: "Ngoại Môn", factor: 0.35 };
  }

  const GUILD_TIER_RULES = {
    1: { name: "Thái Cổ Thánh Địa · Tối Cao Thế Lực", minRealm: 9, minFate: 180, contributionCost: 500, meritCost: 50 },
    2: { name: "Đại Tông Môn · Nhất Lưu Thế Lực", minRealm: 7, minFate: 100, contributionCost: 300, meritCost: 30 },
    3: { name: "Trung Cấp Tông Môn · Nhị Lưu Thế Lực", minRealm: 5, minFate: 55, contributionCost: 150, meritCost: 15 },
    4: { name: "Tiểu Thế Lực · Tam Lưu Tông Môn", minRealm: 3, minFate: 20, contributionCost: 75, meritCost: 8 },
    5: { name: "Môn Phái Nhỏ · Hắc Đạo · Tán Tu Liên Minh", minRealm: 2, minFate: 6, contributionCost: 30, meritCost: 3 }
  };
  const REGION_GUILD_MIN_TIER = { vo_tan_hai: 3, dong_hoang: 3 };

  function guildTierInfo(guildOrTier) {
    const tier = clamp(Number(typeof guildOrTier === "object" ? guildOrTier?.pyramid_tier : guildOrTier) || 5, 1, 5);
    return { tier, ...GUILD_TIER_RULES[tier] };
  }

  function guildEligibility(state, guild) {
    const rule = guildTierInfo(guild);
    const regionMinTier = REGION_GUILD_MIN_TIER[guild.region_id || currentRegionId(state)] || 1;
    const realm = cultivationTier(state);
    const fate = computeFate(state.player).effective;
    const reasons = [];
    if (rule.tier < regionMinTier) reasons.push("Vùng này chỉ tiếp nhận Tông Môn cấp " + regionMinTier + " trở lên");
    if (realm < rule.minRealm) reasons.push("Cảnh giới " + realm + "/" + rule.minRealm);
    if (fate < rule.minFate) reasons.push("Hiệu Mệnh " + fate + "/" + rule.minFate);
    return { eligible: reasons.length === 0, visible: rule.tier >= regionMinTier && fate >= Math.max(0, rule.minFate - 15) && realm >= Math.max(2, rule.minRealm - 1), reasons, realm, fate, rule, regionMinTier };
  }

  function guildExitCost(guild) {
    const rule = guildTierInfo(guild);
    return { contribution: rule.contributionCost, merit: rule.meritCost };
  }

  function guildTechniqueIds(guild, rankName) {
    const ids = ["tong_mon_noi_tuc"];
    if (guild?.id) ids.push("guild_signature_" + guild.id);
    const source = normalizedText([guild?.name, guild?.type, guild?.allegiance, ...(guild?.traits || [])].join(" "));
    if (/ma|hắc|hac|huyết|huyet|tà|ta|sát|sat/.test(source)) ids.push("huyet_sat_bi_luc");
    else if (/mộc|moc|dược|duoc|yêu|yeu/.test(source)) ids.push("bich_moc_hoi_xuan");
    else if (/trận|tran|huyền|huyen|thổ|tho/.test(source)) ids.push("huyen_mon_tran_giai");
    else ids.push("thanh_phong_kiem_quyet");
    // Mỗi tổ chức có một pháp môn bản sắc ngay từ Ngoại Môn; lên cấp mới mở thêm pháp môn.
    if (rankName === "Ngoại Môn") return ids;
    if (guild?.id) ids.push("guild_signature_" + guild.id + "_support");
    if (/kiếm|kiem/.test(source) && !ids.includes("thanh_phong_kiem_quyet")) ids.push("thanh_phong_kiem_quyet");
    if (/đan|duoc|dược/.test(source) && !ids.includes("bich_moc_hoi_xuan")) ids.push("bich_moc_hoi_xuan");
    if ((rankName === "Chân Truyền" || rankName === "Trưởng Lão") && guild?.id) ids.push("guild_signature_" + guild.id + "_secret");
    return ids;
  }

  function grantGuildTechniques(state) {
    const benefits = getGuildBenefits(state);
    if (!benefits.guild) return [];
    const learned = [];
    guildTechniqueIds(benefits.guild, benefits.rank.name).forEach((id) => {
      if (state.player.techniques?.[id]) return;
      if (learnTechnique(state, id)) {
        state.player.techniques[id].sourceGuildId = benefits.guild.id;
        learned.push(id);
      }
    });
    return learned;
  }

  function getGuildBenefits(state) {
    const membership = state.guildMembership;
    if (!membership) return { guild: null, expBonusPct: 0, cityPenaltyReductionPct: 0 };
    const guild = D().GUILDS.find((item) => item.id === membership.guildId);
    if (!guild) return { guild: null, expBonusPct: 0, cityPenaltyReductionPct: 0 };
    const rank = guildRank(membership.contribution || 0);
    const interpolate = (range) => range.min + (range.max - range.min) * rank.factor;
    return {
      guild,
      rank,
      expBonusPct: Math.round(interpolate(guild.cultivation_exp_bonus_pct)),
      cityPenaltyReductionPct: Math.round(interpolate(guild.city_penalty_reduction_pct))
    };
  }

  function joinGuild(state, query) {
    if (cultivationTier(state) === 1) {
      pushHistory(state, { type: "warn", text: "× Di Mệnh Cảnh chưa khai mở đạo lộ. Hãy bước vào Khai Lộ Cảnh trước khi cầu nhập môn." });
      return false;
    }
    if (state.guildMembership) {
      pushHistory(state, { type: "warn", text: "× Ngươi phải rời tổ chức hiện tại trước." });
      return false;
    }
    const normalized = String(query || "").trim().toLowerCase();
    const regionId = currentRegionId(state);
    const guild = D().GUILDS.find((item) => item.region_id === regionId &&
      (item.id === normalized || item.name.toLowerCase().includes(normalized)));
    if (!guild || !normalized) {
      pushHistory(state, { type: "warn", text: "× Không tìm thấy tổ chức đó trong vùng hiện tại." });
      return false;
    }
    const eligibility = guildEligibility(state, guild);
    if (!eligibility.eligible) {
      pushHistory(state, { type: "warn", text: "× " + eligibility.rule.name + " chưa chấp nhận mệnh cách của ngươi: " + eligibility.reasons.join(" · ") + "." });
      return false;
    }
    state.guildMembership = {
      guildId: guild.id,
      contribution: 0,
      rank: "Ngoại Môn",
      joinedAtTurn: state.meta.turn
    };
    state.pendingGuildChoice = false;
    state.flags.guildDecision = "guild:" + guild.id;
    const learnedTechniques = grantGuildTechniques(state);
    if (learnedTechniques.length) {
      state.flags.lastGuildTechniques = learnedTechniques.slice();
      const names = learnedTechniques.map((id) => techniqueCatalog()[id]?.name || id);
      pushHistory(state, { type: "sys", text: "§ Tông môn truyền thụ công pháp: " + names.join(", ") + ". Có thể mở mục Công Pháp để luyện và xem hiệu ứng." });
    }
    pushMemory(state, "Gia nhập " + guild.name + ".");
    pushHistory(state, { type: "sys", text: "§ Ngươi đã gia nhập " + guild.name + " với thân phận Ngoại Môn." });
    checkQuestObjectives(state, "chon_dao_lo");
    return true;
  }

  function refuseGuild(state, path) {
    if (state.player.origin?.confirmed || state.flags?.originLocked) {
      state.pendingGuildChoice = false;
      state.flags.guildDecision = state.flags.guildDecision || "origin:" + (state.player.origin?.type || state.player.background || "independent");
      pushHistory(state, { type: "warn", text: "× Xuất thân đã được định khi bắt đầu game; không thể đổi Tán Tu/Thế Gia. Hãy chọn gia nhập tổ chức nếu muốn." });
      return false;
    }
    if (!state.pendingGuildChoice) {
      pushHistory(state, { type: "warn", text: "× Hiện không có lời mời nhập môn nào cần quyết định." });
      return false;
    }
    const normalized = String(path || "").trim().toLowerCase();
    const isFamily = /thế gia|the gia|gia tộc|gia toc/.test(normalized);
    const legacyBackground = isFamily ? "Thế Gia" : "Tán Tu";
    state.pendingGuildChoice = false;
    state.flags.guildDecision = isFamily ? "the_gia" : "tan_tu";
    if (!state.player.origin) state.player.background = legacyBackground;
    const organizationPath = isFamily ? "nương nhờ thế lực gia tộc" : "tiếp tục hành đạo độc lập";
    pushMemory(state, "Từ chối nhập môn và " + organizationPath + ".");
    pushHistory(state, { type: "sys", text: "§ Ngươi từ chối lời mời nhập môn và " + organizationPath + ". Xuất thân " + (state.player.origin?.name || state.player.background) + " không thay đổi." });
    checkQuestObjectives(state, "chon_dao_lo");
    return true;
  }

  function leaveGuild(state) {
    const benefits = getGuildBenefits(state);
    if (!benefits.guild) {
      pushHistory(state, { type: "warn", text: "× Ngươi chưa gia nhập tổ chức nào." });
      return false;
    }
    const cost = guildExitCost(benefits.guild);
    const contribution = Number(state.guildMembership.contribution || 0);
    const merit = Number(state.player.merit || 0);
    const contributionDebt = Math.max(0, cost.contribution - contribution);
    const meritDebt = Math.max(0, cost.merit - merit);
    state.player.merit = Math.max(0, merit - cost.merit);
    pushMemory(state, "Thoát ly " + benefits.guild.name + ".");
    if (contributionDebt || meritDebt) {
      state.guildPursuit = { guildId: benefits.guild.id, guildName: benefits.guild.name, startRealmLevel: cultivationTier(state), contributionDebt, meritDebt };
      pushHistory(state, { type: "warn", text: "× Ngươi cưỡng ép thoát ly " + benefits.guild.name + "; còn thiếu " + contributionDebt + " Cống Hiến và " + meritDebt + " Công Đức. Tông môn sẽ truy sát cho tới khi ngươi vượt đại cảnh kế tiếp." });
    } else {
      pushHistory(state, { type: "sys", text: "§ Ngươi trả " + cost.contribution + " Cống Hiến và " + cost.merit + " Công Đức để đường đường chính chính thoát ly " + benefits.guild.name + "." });
    }
    state.guildMembership = null;
    return true;
  }

  function describeGuild(state) {
    const benefits = getGuildBenefits(state);
    if (benefits.guild) {
      const membership = state.guildMembership;
      return "§ Môn Phái / Tổ Chức:\n" +
        "  " + benefits.guild.name + " [" + guildTierInfo(benefits.guild).name + "]\n" +
        "  Thân phận: " + benefits.rank.name + " | Cống hiến: " + membership.contribution + "\n" +
        "  EXP tu luyện: +" + benefits.expBonusPct + "% | Giảm ảnh hưởng tiêu cực: " + benefits.cityPenaltyReductionPct + "%";
    }
    if (cultivationTier(state) === 1) {
      return "§ Môn Phái / Đạo Lộ:\n  Di Mệnh Cảnh chưa thể nhập môn. Cần đủ 100 Tu vi hoặc dùng đan khai mạch để bước vào Khai Lộ Cảnh.";
    }
    const regionId = currentRegionId(state);
    const available = D().GUILDS.filter((guild) => guild.region_id === regionId && guildEligibility(state, guild).visible).slice(0, 10);
    return "§ Tổ chức trong vùng:\n" + available.map((guild) =>
      "  · " + guild.name + " [" + guildTierInfo(guild).name + " · " + guild.allegiance + "]"
    ).join("\n") + "\n  Dùng: gia nhập <tên tổ chức>" +
      (state.pendingGuildChoice ? " | tiếp tục hành đạo độc lập (xuất thân đã khóa)" : "");
  }

  /* ---------- EXP / realm ---------- */
  function enterLuyenKhi(state, source) {
    if (cultivationTier(state) !== 1) return false;
    const next = D().REALMS.find((realm) => realm.level === 2) || D().REALMS[realmIndex(state) + 1];
    if (!next) return false;
    const previousMaxLifespan = Number(state.player.maxLifespan || computeLifespan(state.player));
    state.player.realmId = next.id;
    const upgradedMaxLifespan = computeLifespan(state.player);
    const lifespanDelta = Math.max(0, upgradedMaxLifespan - previousMaxLifespan);
    if (lifespanDelta) state.player.lifespan = Number(state.player.lifespan || 0) + lifespanDelta;
    state.flags.pathChoicePending = !state.player.pathId;
    const originLocked = Boolean(state.player.origin?.confirmed || state.flags?.originLocked);
    state.pendingGuildChoice = !originLocked;
    state.flags.enteredKhaiLo = true;
    state.flags.guildDecision = originLocked ? "origin:" + (state.player.origin?.type || state.player.background || "independent") : null;
    activateQuest(state, "chon_dao_lo");
    pushMemory(state, "Bước vào Khai Lộ Cảnh nhờ " + source + ".");
    pushHistory(state, { type: "sys", text: "§ KHAI LỘ THÀNH CÔNG — " + next.name + " (" + source + ")." });
    pushHistory(state, { type: "sys", text: "§ Xuất thân đã định từ đầu game: " + (state.player.origin?.name || state.player.background || "độc lập") + ". Từ đây chỉ lựa chọn gia nhập tổ chức; có thể tiếp tục hành đạo độc lập." });
    updateDerived(state);
    return true;
  }

  function gainExp(state, amount) {
    const gained = Math.max(0, Math.round(Number(amount || 0) * factionStatus(state).expMultiplier));
    state.player.exp += gained;
    recordCultivationGain(state, gained, "other");
    updateDerived(state);
  }

  function cultivationDay(state) {
    const c = ensureGameClock(state);
    return (Number(c.currentYear || 1) - 1) * GAME_TIME_CONFIG.gameDaysPerYear
      + (Number(c.currentMonth || 1) - 1) * GAME_TIME_CONFIG.gameDaysPerMonth + Number(c.currentDay || 1);
  }
  function cultivationJournalPush(state, entry) {
    state.player.cultivationJournal = Array.isArray(state.player.cultivationJournal) ? state.player.cultivationJournal : [];
    state.player.cultivationJournal.push({ ...entry, gameDay: entry.gameDay ?? cultivationDay(state) });
    if (state.player.cultivationJournal.length > 500) state.player.cultivationJournal.splice(0, state.player.cultivationJournal.length - 500);
  }
  function recordCultivationGain(state, amount, source = "other", metadata = {}) {
    const gained = Math.max(0, Math.round(Number(amount || 0)));
    if (!gained) return { gained: 0, velocity24h: Number(state.player.cultivation?.velocity24h || 0), deviationChance: 0 };
    state.player.cultivation = { velocity24h: 0, velocitySamples: [], deviationCount: 0, lastDeviationAt: null, pendingDeviation: null, ...(state.player.cultivation || {}) };
    const day = cultivationDay(state);
    state.player.cultivation.velocitySamples.push({ amount: gained, source, gameDay: day, timestamp: Date.now(), realmLevel: cultivationTier(state), metadata });
    state.player.cultivation.velocitySamples = state.player.cultivation.velocitySamples.filter((s) => day - Number(s.gameDay || day) <= 24).slice(-128);
    state.player.cultivation.velocity24h = state.player.cultivation.velocitySamples.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    cultivationJournalPush(state, { type: "insight", amount: gained, source, realmId: state.player.realmId, note: metadata.note || source });
    const next = D().REALMS[realmIndex(state) + 1];
    const safe = Math.max(1, Number(next?.breakExp || 0) * 0.05);
    const ratio = state.player.cultivation.velocity24h / safe;
    const deviationChance = ratio > 1.5 ? clamp((ratio - 1.5) * 0.40, 0, 0.30) : 0;
    if (deviationChance && Math.random() < deviationChance && !state.player.cultivation._rolledThisGain) {
      state.player.cultivation._rolledThisGain = true;
      const severe = Math.random() < clamp(0.20 + Number(state.player.corruptionRating || 0) / 200, 0.20, 0.70);
      state.player.cultivation.deviationCount += 1;
      state.player.cultivation.lastDeviationAt = day;
      let loss = 0;
      if (severe) state.player.cultivation.pendingDeviation = { kind: "body_mutation", createdAt: day, source };
      else { loss = Math.ceil(state.player.exp * (rnd(10, 20) / 100)); state.player.exp = Math.max(0, state.player.exp - loss); state.player.madnessPoints = Number(state.player.madnessPoints || 0) + 5; }
      pushHistory(state, { type: "warn", text: severe ? "× Tẩu Hỏa Nhập Ma: một biến dị thân thể đang chờ xử lý." : "× Tẩu Hỏa Nhập Ma: mất " + loss + " Tu vi chưa chốt, Điểm Điên Loạn +5." });
      cultivationJournalPush(state, { type: "deviation", amount: 0, source, note: severe ? "biến dị thân thể" : "mất Tu vi" });
    }
    delete state.player.cultivation._rolledThisGain;
    return { gained, velocity24h: state.player.cultivation.velocity24h, safeVelocity: safe, ratio, deviationChance };
  }
  function cultivationVelocityStatus(state) {
    const next = D().REALMS[realmIndex(state) + 1];
    const velocity = Number(state.player.cultivation?.velocity24h || 0);
    const safeVelocity = Math.max(1, Number(next?.breakExp || 0) * 0.05);
    return { velocity24h: velocity, safeVelocity, ratio: velocity / safeVelocity, deviationChance: velocity / safeVelocity > 1.5 ? clamp((velocity / safeVelocity - 1.5) * 0.4, 0, 0.3) : 0 };
  }
  function adjustDaoTam(state, delta, reason, metadata = {}) {
    const before = clamp(Number(state.player.daoTam ?? 50), 0, 100);
    const after = clamp(before + Number(delta || 0), 0, 100);
    state.player.daoTam = after;
    state.flags.daoTamHistory = Array.isArray(state.flags.daoTamHistory) ? state.flags.daoTamHistory : [];
    state.flags.daoTamHistory.push({ before, after, delta: after - before, reason, gameDay: cultivationDay(state), metadata });
    if (state.flags.daoTamHistory.length > 100) state.flags.daoTamHistory.splice(0, state.flags.daoTamHistory.length - 100);
    return after;
  }

  function realmIndex(state) {
    return D().REALMS.findIndex((realm) => realm.id === realmById(state.player.realmId).id);
  }

  // 14 cấp phẳng; không có tiểu cảnh.
  function cultivationTier(state) {
    return realmLevelOf(state.player);
  }

  // Nghi thức được mở dần theo cấp đích: cấp thấp dễ học, cấp cao mới cần đủ 5 cửa.
  function breakthroughRitualPlan(level) {
    if (level <= 2) return [];
    if (level <= 4) return ["call_fate", "compare"];
    if (level <= 7) return ["call_fate", "compare", "anchor"];
    if (level <= 10) return ["call_fate", "compare", "anchor", "omen"];
    if (level <= 13) return ["call_fate", "compare", "anchor", "omen", "cost"];
    return ["call_fate", "compare", "anchor", "omen", "cost", "trial"];
  }
  const BREAKTHROUGH_RITUAL_LABELS = {
    call_fate: "Gọi Mệnh",
    anchor: "Dựng Neo",
    compare: "Đối Chiếu Con Đường",
    omen: "Vượt Dị Tượng",
    cost: "Trả Giá",
    trial: "Thử Thách Cuối"
  };
  function breakthroughRitualStatus(state) {
    const next = D().REALMS[realmIndex(state) + 1];
    if (!next) return { next: null, plan: [], completed: [], remaining: [], ready: true };
    const plan = breakthroughRitualPlan(Number(next.level || 1));
    const saved = state.flags?.breakthroughRitual;
    const completed = saved && saved.targetRealmId === next.id ? [...(saved.completed || [])] : [];
    return { next, plan, completed, remaining: plan.filter((step) => !completed.includes(step)), ready: plan.every((step) => completed.includes(step)) };
  }
  function breakthroughRitualGateRequirements(state, step) {
    const requirements = breakthroughRequirements(state).requirements || [];
    const matches = {
      call_fate: (label) => /^Tu vi$|Mệnh hiệu dụng|Mệnh Cát|Tỷ lệ R/.test(label),
      compare: (label) => /Con Đường|tương hợp|Mệnh dẫn|Công pháp Cốt Lõi|nghi thức Con Đường|Hợp nhất Công pháp/.test(label),
      anchor: (label) => /Neo Nhân Tính/.test(label),
      omen: (label) => /Tà Nhiễm/.test(label),
      cost: (label) => /Mệnh Nợ/.test(label),
      trial: (label) => /Đánh bại|Chuẩn bị quyết chiến|Thử thách Chân Danh|Quyền Năng|Nhiệm vụ trận doanh|Đại nghi thức/.test(label)
    };
    return requirements.filter((item) => matches[step]?.(item.label));
  }
  function anchorCandidates(state) {
    const relationships = state.relationships || {};
    const entities = { ...(D().NPCS || {}), ...entityCatalog() };
    return Object.entries(relationships).map(([npcId, relation]) => {
      const npc = entities[npcId];
      if (!npc) return null;
      const trust = Number(relation?.trust || 0); const respect = Number(relation?.respect || 0);
      if (trust < 20 && respect < 15) return null;
      return { npcId, name: npc.name || npcId, trust, respect, stability: clamp(Math.round(35 + trust * 0.55 + respect * 0.35), 25, 100) };
    }).filter(Boolean).sort((a, b) => b.stability - a.stability);
  }
  function establishHumanAnchor(state, npcId) {
    const candidate = anchorCandidates(state).find((entry) => entry.npcId === npcId);
    if (!candidate) return { success: false, reason: "NPC chưa đủ tin cậy hoặc tôn trọng để trở thành Neo Nhân Tính." };
    state.player.anchors = Array.isArray(state.player.anchors) ? state.player.anchors : [];
    const active = state.player.anchors.find((anchor) => !anchor.broken && Number(anchor.stability || 0) > 0);
    if (active) return { success: false, reason: "Đã có một Neo Nhân Tính đang giữ tâm. Không thể dựng thêm neo." };
    const anchor = { id: "anchor_npc_" + npcId, name: "Neo Nhân Tính · " + candidate.name, source: "npc", npcId, stability: candidate.stability, integrity: "intact", broken: false, establishedAtTurn: Number(state.meta?.turn || 0) };
    state.player.anchors.push(anchor);
    pushHistory(state, { type: "sys", text: "✦ Đã chọn " + candidate.name + " làm Neo Nhân Tính (ổn định " + candidate.stability + ")." });
    return { success: true, anchor };
  }
  function performBreakthroughRitualStep(state, step) {
    const status = breakthroughRitualStatus(state);
    if (!status.next || cultivationTier(state) <= 1) return { changed: false, reason: "Cảnh giới này chưa cần nghi thức phân đoạn." };
    const expected = status.remaining[0];
    if (step !== expected) return { changed: false, reason: "Nghi thức phải theo thứ tự: " + (BREAKTHROUGH_RITUAL_LABELS[expected] || expected) + "." };
    const flags = state.flags.breakthroughRitual = state.flags.breakthroughRitual && state.flags.breakthroughRitual.targetRealmId === status.next.id ? state.flags.breakthroughRitual : { targetRealmId: status.next.id, completed: [] };
    if (step === "call_fate" && computeFate(state.player).effective <= 0) return { changed: false, reason: "Cần ít nhất một Mệnh đang hiệu dụng để gọi Mệnh." };
    if (step === "call_fate") {
      const missing = breakthroughRitualGateRequirements(state, step).filter((item) => !item.met);
      if (missing.length) return { changed: false, reason: "Gọi Mệnh chưa đạt: " + missing.map((item) => item.label + " " + item.current + "/" + item.target).join("; ") };
    }
    if (step === "anchor") {
      const anchors = (state.player.anchors || []).filter((a) => !a.broken && Number(a.stability || 0) > 0);
      if (!anchors.length) return { changed: false, reason: "Hãy chọn một NPC đủ tin cậy trong Nhân Duyên để dựng Neo Nhân Tính trước." };
      if (!anchors.some((anchor) => anchor.source === "npc" && anchor.integrity !== "broken")) return { changed: false, reason: "Neo hiện tại không phải Neo Nhân Tính từ NPC; hãy chọn lại một NPC phù hợp." };
    }
    if (step === "compare") {
      const blockers = breakthroughRitualGateRequirements(state, step).filter((item) => !item.met).map((item) => item.label + ": " + item.current + " / " + item.target);
      if (blockers.length) return { changed: false, reason: "Đối chiếu thất bại: " + blockers.join("; ") };
    }
    if (step === "omen") {
      const level = Number(status.next.level || 8);
      const chance = clamp(82 - Math.max(0, level - 8) * 8 + (Number(state.player.aptitude || 0) - 50) * 0.5 + (Number(state.player.comprehension || 0) - 50) * 0.3, 10, 95);
      const success = rnd(1, 100) <= chance;
      if (!success) {
        const sanCost = rnd(1, 100) <= Math.min(80, 25 + level * 3) ? 3 : 0;
        if (sanCost) drainSan(state, sanCost, "vượt dị tượng thất bại");
        flags.attemptLog = Array.isArray(flags.attemptLog) ? flags.attemptLog : [];
        flags.attemptLog.push({ gate: step, timestamp: Date.now(), result: "fail", sanCost: sanCost || null });
        adjustDaoTam(state, -2, "vượt dị tượng thất bại", { target: level });
        return { changed: false, reason: "Dị tượng áp đảo; xác suất lần này " + Math.round(chance) + "%. Hãy ổn định Thanh Tỉnh rồi thử lại." };
      }
      pushHistory(state, { type: "sys", text: "✦ Ngươi xuyên qua Dị Tượng, nghe thấy tiếng vọng ngoài kia rồi giữ được Chân Tâm." });
      flags.bodyMindPassed = true;
    }
    if (step === "cost") {
      if (Number(state.player.san || 0) < 5) return { changed: false, reason: "Cần ít nhất 5 Thanh Tỉnh để trả giá." };
      drainSan(state, 5, "trả giá nghi thức đột phá");
      flags.costCommitted = true;
    }
    if (step === "trial") {
      const passed = Boolean(state.player.hiddenProfession === "luan_hoi_tien" || state.player.tainted?.taintedGodDefeated || state.flags.finalVictory);
      if (!passed) return { changed: false, reason: "Cần đánh bại Tà Thần hoặc Ngoại Đạo Giả trước khi vượt thử thách cuối." };
    }
    flags.completed = [...new Set([...(flags.completed || []), step])];
    flags.requiredGates = status.plan.slice();
    flags.gatesPassed = flags.completed.slice();
    flags.currentGate = breakthroughRitualStatus(state).remaining?.[0] || null;
    flags.attemptLog = Array.isArray(flags.attemptLog) ? flags.attemptLog : [];
    flags.attemptLog.push({ gate: step, timestamp: Date.now(), result: "pass", sanCost: step === "cost" ? 5 : null });
    pushHistory(state, { type: "sys", text: "✓ Nghi thức: " + BREAKTHROUGH_RITUAL_LABELS[step] + " đã hoàn tất." });
    updateDerived(state);
    return { changed: true, reason: "Đã hoàn tất bước " + BREAKTHROUGH_RITUAL_LABELS[step] + "." };
  }
  function breakthroughRitualGateHint(state, step) {
    if (step === "call_fate" || step === "compare" || step === "omen") return breakthroughRitualGateRequirements(state, step).filter((item) => !item.met).map((item) => item.label + ": " + item.current + " / " + item.target).join("; ");
    if (step === "anchor" && !anchorCandidates(state).length && !(state.player.anchors || []).some((anchor) => anchor.source === "npc" && !anchor.broken && Number(anchor.stability || 0) > 0)) return "Chưa có NPC đủ quan hệ để dựng Neo Nhân Tính.";
    if (step === "cost" && Number(state.player.san || 0) < 5) return "Thanh Tỉnh: " + state.player.san + " / 5";
    if (step === "trial" && !Boolean(state.player.hiddenProfession === "luan_hoi_tien" || state.player.tainted?.taintedGodDefeated || state.flags.finalVictory)) return "Cần đánh bại Tà Thần hoặc Ngoại Đạo Giả.";
    return "";
  }

  function breakthroughRequirements(state) {
    const current = D().REALMS[realmIndex(state)];
    const next = D().REALMS[realmIndex(state) + 1];
    if (!next) return { current, next: null, ready: true, requirements: [] };
    const player = state.player;
    const isUnbound = player.pathId === "ngoai_dao_gia";
    const fate = computeFate(player);
    const match = player.pathId ? pathMatchSummary(player, player.pathId) : { score: 0, lead: 0, support: 0 };
    const known = getKnownTechniques(state);
    const anchors = (player.anchors || []).filter((anchor) => !anchor.broken && Number(anchor.stability || 0) > 0);
    const requiredExp = Number(current.breakExp || Infinity) * (isUnbound ? 5 : 1);
    const fateMultiplier = isUnbound ? 2 : 1;
    const requirements = [];
    const add = (label, currentValue, target, met) => requirements.push({ label, current: currentValue, target, met: Boolean(met) });
    add("Tu vi", player.exp, requiredExp, player.exp >= requiredExp);
    if (cultivationTier(state) === 1) return { current, next, requiredExp, ready: requirements.every((item) => item.met), requirements };
    const ritual = breakthroughRitualStatus(state);
    add("Nghi thức đột phá", ritual.completed.length, ritual.plan.length, ritual.ready);
    if (cultivationTier(state) > 1 && !player.pathId) add("Con Đường", "Chưa chọn", "Chọn một Con Đường", false);
    if (Number(next.minFate || 0) > 0) add("Mệnh hiệu dụng", fate.effective, Number(next.minFate) * fateMultiplier, fate.effective >= Number(next.minFate) * fateMultiplier);
    if (Number(next.minNormalFate || 0) > 0) add("Mệnh Cát/Bình", fate.normal, Number(next.minNormalFate) * fateMultiplier, fate.normal >= Number(next.minNormalFate) * fateMultiplier);
    if (next.minRatioR != null) add("Tỷ lệ R", fate.ratio.toFixed(2), next.minRatioR, fate.ratio >= next.minRatioR);
    if (!isUnbound && Number(next.requiredPathScore || 0) > 0) add("Điểm tương hợp Con Đường", match.score, next.requiredPathScore, match.score >= next.requiredPathScore);
    if (!isUnbound && Number(next.requiredLeadTags || 0) > 0) add("Mệnh dẫn", match.lead, next.requiredLeadTags, match.lead >= next.requiredLeadTags);
    if (!isUnbound && Number(next.requiredCompatibleTags || 0) > 0) add("Mệnh dẫn + trợ", match.lead + match.support, next.requiredCompatibleTags, match.lead + match.support >= next.requiredCompatibleTags);
    if (next.requiresCoreTechnique) add("Công pháp Cốt Lõi", hasCoreTechnique(state) ? "Đã lĩnh ngộ" : "Chưa có", "1", hasCoreTechnique(state));
    if (next.requiresActiveAnchor || next.requiresStableAnchor || next.requiresHighAnchor) {
      const stability = next.requiresHighAnchor ? 75 : next.requiresStableAnchor ? 50 : 1;
      add("Neo Nhân Tính", Math.max(0, ...anchors.map((item) => Number(item.stability || 0))), "ổn định ≥ " + stability, anchors.some((item) => Number(item.stability || 0) >= stability));
    }
    if (next.maxCorruption != null) add("Tà Nhiễm", player.corruptionRating || 0, "≤ " + next.maxCorruption, Number(player.corruptionRating || 0) <= next.maxCorruption);
    [
      [next.requiresPathRitual, "Nghi thức Con Đường", Boolean(state.flags.pathRituals?.includes(next.requiresPathRitual))],
      [next.requiresCoreTechniqueFusion, "Hợp nhất Công pháp Cốt Lõi", Boolean(state.flags.coreTechniqueFusionCompleted)],
      [next.requiresGreatRitual, "Đại nghi thức", Boolean(state.flags.greatRitualCompleted)],
      [next.requiresUniquePower, "Quyền Năng độc nhất", Boolean(state.flags.uniquePowerCreated)],
      [next.requiresFactionQuest && !isUnbound, "Nhiệm vụ trận doanh", Boolean(state.flags.factionQuestCompleted)],
      [next.requiresTrueNameTrial, "Thử thách Chân Danh", Boolean(state.flags.trueNameTrialPassed)],
      [next.requiresFinalPreparation && !isUnbound, "Chuẩn bị quyết chiến", Boolean(player.tainted?.finalConflictPreparation || state.flags.finalConflictPreparation)],
      [next.requiresFinalVictory && !isUnbound, "Đánh bại Tà Thần", Boolean(player.hiddenProfession === "luan_hoi_tien" || player.tainted?.taintedGodDefeated)]
    ].forEach(([needed, label, met]) => { if (needed) add(label, met ? "Đã hoàn thành" : "Chưa hoàn thành", "Bắt buộc", met); });
    if (next.requiresNoOverdueDebt) add("Mệnh Nợ quá hạn", Number(player.overdueFateDebt || 0), "0", Number(player.overdueFateDebt || 0) === 0);
    return { current, next, requiredExp, ready: requirements.every((item) => item.met), requirements };
  }
  function getBreakthroughBlockers(state) {
    const progress = breakthroughRequirements(state);
    return (progress.requirements || []).filter((item) => !item.met).map((item) => item.label + ": " + item.current + " / " + item.target);
  }

  function suggestFateForRealmRequirement(character, requirementType) {
    const player = character?.player || character || {};
    const pathId = player.pathId;
    const owned = new Set([...(player.fates || []), ...(character?.fateInventory || [])]);
    const baseFate = computeFate(player);
    const candidates = D().FATE_PATTERNS.filter((fate) => !owned.has(fate.id)).map((fate) => {
      const simulated = { ...player, fates: [...(player.fates || []), fate.id] };
      const afterFate = computeFate(simulated);
      const beforeMatch = pathId ? pathMatchSummary(player, pathId) : { score: 0, lead: 0, support: 0 };
      const afterMatch = pathId ? pathMatchSummary(simulated, pathId) : { score: 0, lead: 0, support: 0 };
      const compatibility = pathId ? fateCompatibility(pathId, fate) : 0;
      let impact = afterFate.effective - baseFate.effective;
      const type = String(requirementType || "effective").toLowerCase();
      if (type.includes("normal") || type.includes("cat")) impact = afterFate.normal - baseFate.normal;
      else if (type.includes("path") || type.includes("tương hợp") || type.includes("score")) impact = afterMatch.score - beforeMatch.score;
      else if (type.includes("lead")) impact = afterMatch.lead - beforeMatch.lead;
      else if (type.includes("support") || type.includes("compatible")) impact = (afterMatch.lead + afterMatch.support) - (beforeMatch.lead + beforeMatch.support);
      const rarity = { pham: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 }[fate.grade] || 1;
      const source = rarity >= 7 ? "Ngộ Đạo hoặc chiến lợi phẩm Boss/đại cơ duyên" : rarity >= 5 ? "Quest vùng hiểm và chiến lợi phẩm quái tinh anh" : rarity >= 3 ? "Quái vật tinh anh, tìm kiếm tại Linh Vực hoặc Mệnh Kho" : "Quest thường, mua/đổi tại phường thị và quái vật địa phương";
      return { id: fate.id, name: fate.name, grade: fate.gradeLabel || fate.grade, sign: fate.sign, score: fate.score, compatibility, impact, source };
    }).sort((a, b) => b.impact - a.impact || b.compatibility - a.compatibility || b.score - a.score).slice(0, 5);
    return candidates;
  }

  function auditFateRolls(state, iterations = 1000) {
    const total = Math.max(1, Math.floor(Number(iterations) || 1000));
    const counts = {};
    for (let i = 0; i < total; i++) {
      drawInitialFates(1, 0, state?.player?.realmId || "di_menh").forEach((fate) => { if (fate) counts[fate.grade] = (counts[fate.grade] || 0) + 1; });
    }
    const rates = Object.fromEntries(Object.entries(counts).map(([grade, count]) => [grade, Number((count / total).toFixed(4))]));
    if (state?.meta) state.meta.lastFateRollAudit = { iterations: total, counts, rates, turn: state.meta.turn };
    return { iterations: total, counts, rates };
  }
  function buyFateAtMarket(state, fateId) {
    const fate = D().FATE_PATTERNS.find((f) => f.id === fateId);
    const cost = 30;
    if (!fate) return { success: false, reason: "Mệnh Số không tồn tại." };
    const stones = Number(state.inventory?.linh_thach || 0);
    if (stones < cost) return { success: false, reason: "Không đủ Linh thạch." };
    state.inventory.linh_thach = stones - cost;
    const result = receiveFate(state, fate.id);
    if (!result.added) { state.inventory.linh_thach += cost; return { success: false, reason: result.reason }; }
    pushHistory(state, { type: "sys", text: "§ Phường thị giao dịch " + fate.name + " · Linh thạch -" + cost + "." });
    return { success: true, fate };
  }
  function dominantFateGrade(state) {
    const rank = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };
    const counts = {};
    (state.player.fates || []).forEach((id) => { const fate = D().FATE_PATTERNS.find((f) => f.id === id); if (fate) counts[fate.grade] = (counts[fate.grade] || 0) + 1; });
    const grade = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || (rank[b] || 1) - (rank[a] || 1))[0] || "phan";
    return { grade, rank: rank[grade] || 1, rankTable: rank };
  }
  // Resolver duy nhất cho mọi nguồn nhận Mệnh Số. Luôn chọn phẩm trước rồi mới chọn entry,
  // giúp tỷ lệ theo cảnh giới không bị lệch bởi kích thước pool sau Phase 3.
  const FATE_GRADE_ORDER = ["phan", "linh", "hoang", "huyen", "dia", "thien", "thanh", "tien"];
  const FATE_GRADE_RANK = Object.freeze(FATE_GRADE_ORDER.reduce((out, grade, index) => { out[grade] = index + 1; return out; }, {}));
  const FATE_REWARD_WEIGHTS = Object.freeze({
    "1-2": { phan: 65, linh: 30, hoang: 5 },
    "3-4": { phan: 15, linh: 45, hoang: 25, huyen: 10, dia: 5 },
    "5-6": { phan: 5, linh: 20, hoang: 35, huyen: 25, dia: 10, thien: 5 },
    "7-8": { phan: 2, linh: 10, hoang: 25, huyen: 30, dia: 20, thien: 10, thanh: 3 },
    "9+": { phan: 1, linh: 5, hoang: 15, huyen: 25, dia: 25, thien: 18, thanh: 11, tien: 0.01 }
  });
  function fateRewardWeights(level = 1) {
    const n = Number(level) || 1;
    return n <= 2 ? FATE_REWARD_WEIGHTS["1-2"] : n <= 4 ? FATE_REWARD_WEIGHTS["3-4"] : n <= 6 ? FATE_REWARD_WEIGHTS["5-6"] : n <= 8 ? FATE_REWARD_WEIGHTS["7-8"] : FATE_REWARD_WEIGHTS["9+"];
  }
  function fateUniqueOwner(state, fate) {
    if (fate?.grade !== "tien") return null;
    state.meta = state.meta || {};
    state.meta.uniqueFateOwnership = state.meta.uniqueFateOwnership || {};
    const localOwned = (state.player?.fates || []).includes(fate.id) || (state.fateInventory || []).includes(fate.id);
    if (localOwned && !state.meta.uniqueFateOwnership[fate.id]) state.meta.uniqueFateOwnership[fate.id] = state.player?.id || "local";
    return state.meta.uniqueFateOwnership[fate.id] || null;
  }
  function rollFateByProgression(state, options = {}) {
    const level = Number(options.level || cultivationTier(state) || 1);
    const weights = { ...fateRewardWeights(level) };
    const cap = Number(options.gradeCap || 0);
    const minimum = Number(options.minimumGrade || 1);
    const owned = new Set([...(state.player?.fates || []), ...(state.fateInventory || [])]);
    const pool = D().FATE_PATTERNS.filter((fate) => {
      const rank = FATE_GRADE_RANK[fate.grade] || 1;
      if (rank < minimum || (cap && rank > cap) || fate.sign === "hung") return false;
      if (owned.has(fate.id)) return false;
      if (fate.grade === "tien" && fateUniqueOwner(state, fate) && !options.allowUniqueTien) return false;
      return true;
    });
    if (!pool.length) return null;
    const availableGrades = new Set(pool.map((fate) => fate.grade));
    const gradeWeights = Object.entries(weights).filter(([grade, weight]) => availableGrades.has(grade) && Number(weight) > 0);
    let grade;
    if (gradeWeights.length) {
      const total = gradeWeights.reduce((sum, [, weight]) => sum + Number(weight), 0);
      let roll = Math.random() * total;
      grade = gradeWeights.find(([, weight]) => (roll -= Number(weight)) <= 0)?.[0] || gradeWeights[gradeWeights.length - 1][0];
    } else {
      grade = pool.slice().sort((a, b) => (FATE_GRADE_RANK[a.grade] || 1) - (FATE_GRADE_RANK[b.grade] || 1))[0].grade;
    }
    const candidates = pool.filter((fate) => fate.grade === grade);
    return candidates[rnd(0, candidates.length - 1)] || pool[rnd(0, pool.length - 1)];
  }
  function rollQintianFate(state, method) {
    const dominant = dominantFateGrade(state);
    // Tỷ lệ vượt một phẩm rất thấp, nhưng không bao giờ vượt quá +1 cấp.
    const upgradeChance = method === "ratio" ? 0.1 : 0.035;
    const targetRank = Math.min(8, dominant.rank + (Math.random() < upgradeChance ? 1 : 0));
    return rollFateByProgression(state, { level: Math.max(1, cultivationTier(state)), minimumGrade: targetRank, gradeCap: targetRank });
  }
  function sacrificeLifespanForFate(state, method = "fixed") {
    const mode = method === "ratio" || method === "proportional" ? "ratio" : "fixed";
    const maxLifespan = Number(state.player.maxLifespan || computeLifespan(state.player) || 75);
    const cost = mode === "ratio" ? Math.max(1, Math.floor(maxLifespan / 10)) : 10;
    if (Number(state.player.lifespan || 0) <= cost) return { success: false, reason: "Thọ nguyên không đủ để hiến tế." };
    const fate = rollQintianFate(state, mode);
    if (!fate) return { success: false, reason: "Thiên cơ chưa tìm thấy Mệnh Số phù hợp trong kho gacha." };
    state.player.lifespan -= cost; state.flags = state.flags || {};
    const result = receiveFate(state, fate.id);
    if (!result.added) { state.player.lifespan += cost; return { success: false, reason: result.reason }; }
    state.flags.qintianSacrificeCount = Number(state.flags.qintianSacrificeCount || 0) + 1;
    state.flags[mode === "ratio" ? "qintianRatioCount" : "qintianFixedCount"] = Number(state.flags[mode === "ratio" ? "qintianRatioCount" : "qintianFixedCount"] || 0) + 1;
    state.flags.lastQintianResult = fate.name + " · " + (fate.gradeLabel || fate.grade);
    pushHistory(state, { type: "warn", text: "§ Khâm Thiên Giám mở gacha " + (mode === "ratio" ? "Hiến Thọ 1/10" : "Hiến Tế Cố Định") + ": -" + cost + " năm, nhận được " + fate.name + " (neo theo phẩm " + dominantFateGrade(state).grade + ")." });
    return { success: true, fate, cost, method: mode };
  }
  function qintianFateOffers(state) {
    const dominant = dominantFateGrade(state);
    return [{ id: "fixed", method: "fixed", label: "Hiến Tế Cố Định", cost: 10, desc: "Đốt đúng 10 năm Thọ Nguyên; phẩm trật neo theo Mệnh Số chiếm đa số, cơ hội +1 cấp rất thấp." }, { id: "ratio", method: "ratio", label: "Hiến Thọ Tỷ Lệ", cost: Math.max(1, Math.floor(Number(state.player.maxLifespan || computeLifespan(state.player) || 75) / 10)), desc: "Đốt 1/10 Thọ Nguyên tối đa; banner độc lập, cơ hội +1 cấp cao hơn nhưng vẫn không vượt quá một phẩm." }].map((offer) => ({ ...offer, dominantGrade: dominant.grade }));
  }

  function excludedFromTainted(state) {
    return state.player.pathId === "ngoai_dao_gia" || state.player.hiddenProfession === "luan_hoi_tien";
  }

  function chooseTaintedAttention(state, vocation) {
    const p = state.player;
    const allowed = ["blessing", "suspicion", "indifference"];
    if (excludedFromTainted(state)) return { success: false, reason: "Nhân vật này được miễn hệ thống Tà Thần." };
    if (cultivationTier(state) < 5) return { success: false, reason: "Chưa đạt cấp 5." };
    if (!allowed.includes(vocation)) return { success: false, reason: "Lựa chọn dị hóa không hợp lệ.", choices: allowed };
    p.tainted = p.tainted || {};
    if (p.tainted.attention) return { success: false, reason: "Kết quả dị hóa đã được chọn và lưu vĩnh viễn." };
    p.tainted.attention = true;
    p.tainted.attentionPending = false;
    p.tainted.vocation = vocation;
    if (vocation === "blessing") {
      p.basePhy += 3; p.baseMag += 3;
    } else if (vocation === "suspicion") {
      p.sat = Number(p.sat || 0) - 5;
      p.tainted.staminaPenalty = Number(p.tainted.staminaPenalty || 0) + 15;
    } else {
      p.tainted.staminaPenalty = Number(p.tainted.staminaPenalty || 0) + 15;
    }
    pushHistory(state, { type: "sys", text: "☍ Tà Thần chú ý ở cấp 5: " + vocation + "." });
    updateDerived(state);
    return { success: true, vocation };
  }

  function rollTaintedAttention(state, vocation) {
    return chooseTaintedAttention(state, vocation);
  }

  function chooseTaintedFaction(state, faction, patron) {
    const allowed = ["rebel_heaven", "loyal_heaven", "neutral"];
    if (cultivationTier(state) < 8 || !allowed.includes(faction)) return { success: false, reason: "Chỉ được chọn trận doanh từ cảnh giới cấp 8." };
    if (excludedFromTainted(state)) return { success: false, reason: "Nhân vật này không chịu cơ chế trận doanh Tà Thần." };
    state.player.tainted = state.player.tainted || {};
    if (state.player.tainted.faction && state.player.tainted.faction !== faction) return { success: false, reason: "Trận doanh đã bị khóa." };
    state.player.tainted.faction = faction;
    if (faction === "rebel_heaven") state.player.tainted.patron = patron || TAINTED_GODS[rnd(0, TAINTED_GODS.length - 1)];
    state.player.tainted.factionMultiplier = faction === "loyal_heaven" ? { suspicion: 2 } : faction === "neutral" ? { indifference: 2 } : {};
    state.player.tainted.rewards = state.player.tainted.rewards || {};
    if (faction === "loyal_heaven") {
      state.player.tainted.rewards.heaven_merit = Number(state.player.tainted.rewards.heaven_merit || 0) + 1;
      state.player.tainted.rewards.heaven_seal = true;
    }
    if (faction === "neutral") state.player.tainted.rewards.balance_token = Number(state.player.tainted.rewards.balance_token || 0) + 1;
    state.player.tainted.factionPending = false;
    state.player.tainted.questsActive = true;
    pushHistory(state, { type: "sys", text: "§ Đã chọn trận doanh: " + faction + "." });
    return { success: true, faction };
  }

  function canUnlockDevourHeaven(state) {
    if (excludedFromTainted(state)) return false;
    const paths = [].concat(state.player.pathId || [], state.player.professionIds || []).filter(Boolean);
    const fates = state.player.fates || [];
    const fateText = fates.map((id) => { const p = D().FATE_PATTERNS.find((x) => x.id === id); return [id, p?.name, ...(p?.tags || [])].join(" "); }).join(" ").toLowerCase();
    const hasTinh = paths.includes("tinh_tuong_dao") || /tinh|thiên|mệnh/.test(fateText);
    const hasPhong = paths.includes("phong_thuy_dao") || /địa|sơn|thủy|trận|long|huyệt/.test(fateText);
    return cultivationTier(state) >= 13 && hasTinh && hasPhong && Boolean(state.player.tainted?.finalConflictPreparation);
  }

  function factionStatus(state) {
    if (state.player.pathId === "ngoai_dao_gia") return { faction: null, expMultiplier: 1, pursuitRate: 0, pursuers: [], hiddenPotential: [], titles: [], inventoryLimitBypass: false, forbiddenTechniqueBypass: false };
    const faction = state.player.tainted?.faction || null;
    const tier = cultivationTier(state);
    const potentials = tier >= 13 ? ["chi_ton", "chan_gia", "an_the"] : tier >= 11 ? ["chan_gia", "an_the"] : tier >= 8 ? ["an_the"] : [];
    const titles = faction === "neutral" ? (tier >= 13 ? ["Ẩn Thế", "Chân Giả", "Chí Tôn"] : tier >= 11 ? ["Ẩn Thế", "Chân Giả"] : tier >= 8 ? ["Ẩn Thế"] : []) : faction ? Array.from({ length: Math.max(0, tier - 7) }, (_, i) => (faction === "loyal_heaven" ? "Thiên Đạo Hộ Đạo " : "Tà Thần Dị Danh ") + (i + 1)) : [];
    return { faction, expMultiplier: faction === "rebel_heaven" ? 0.8 : faction === "loyal_heaven" ? 1.05 : 1, pursuitRate: faction === "neutral" ? 0.5 : 1,
      pursuers: faction === "rebel_heaven" ? ["ho_dao_gia"] : faction === "loyal_heaven" ? ["ma_dau", "phan_boi_gia", "ma_su"] : ["ho_dao_gia", "ma_dau", "ma_su"],
      hiddenPotential: faction === "neutral" ? potentials : [], titles, inventoryLimitBypass: faction === "rebel_heaven" && tier >= 11, forbiddenTechniqueBypass: faction === "rebel_heaven" && tier >= 11 };
  }

  function grantQuestMerit(state, min = 1, max = 3) {
    const amount = rnd(min, max);
    state.player.tainted = state.player.tainted || {};
    state.player.tainted.rewards = state.player.tainted.rewards || {};
    state.player.tainted.rewards.heaven_merit = Number(state.player.tainted.rewards.heaven_merit || 0) + amount;
    return amount;
  }

  function switchTaintedFaction(state, target, options = {}) {
    const current = state.player.tainted?.faction;
    if (!["rebel_heaven", "loyal_heaven", "neutral"].includes(target) || !current || target === current) return { success: false, reason: "Lựa chọn đổi phe không hợp lệ." };
    const t = state.player.tainted;
    const questGranted = Boolean(options.questGranted || t.factionChangeQuestGranted);
    const questCompleted = Boolean(options.questCompleted || t.factionChangeQuestCompleted);
    if (current !== "rebel_heaven" && !(questGranted && questCompleted)) return { success: false, reason: "Cần quest chuyển hóa và phải hoàn thành quest trước." };
    if (current === "rebel_heaven") {
      const reborn = Boolean(options.reborn || t.reincarnatedThisLife || state.flags?.reincarnated);
      const cost = Number(options.meritCost ?? 10);
      const merit = Number(t.rewards?.heaven_merit || 0);
      if (!reborn) return { success: false, reason: "Phản Bội chỉ được đổi phe sau khi chết hoặc luân hồi." };
      if (merit < cost) return { success: false, reason: "Không đủ Công Đức để chuộc tội đổi phe." };
      t.rewards.heaven_merit = merit - cost;
    }
    t.faction = target;
    t.factionChangeQuestGranted = false; t.factionChangeQuestCompleted = false;
    t.blessingOnFactionChange = true;
    state.player.basePhy += 2; state.player.baseMag += 2;
    if (target === "loyal_heaven") t.rewards.heaven_seal = true;
    if (target === "neutral") t.rewards.balance_token = Number(t.rewards.balance_token || 0) + 1;
    pushHistory(state, { type: "sys", text: "Đổi trận doanh thành công: " + target + ". Tà Thần ban phước cho lựa chọn mới." });
    updateDerived(state);
    return { success: true, faction: target };
  }

  function resolveFactionHunt(state, pursuerId) {
    const status = factionStatus(state);
    const pursuer = getEntity(pursuerId);
    if (!pursuer) return { success: false, reason: "Thực thể truy sát không tồn tại." };
    state.player.tainted = state.player.tainted || {};
    state.player.tainted.rewards = state.player.tainted.rewards || {};
    if (status.faction && status.pursuers.includes(pursuerId)) {
      const reward = status.faction === "loyal_heaven" ? { heaven_merit: 1, spiritStones: 2 } : status.faction === "rebel_heaven" ? { taintedFavor: 1 } : { balance_token: 1 };
      Object.entries(reward).forEach(([key, value]) => { state.player.tainted.rewards[key] = typeof value === "boolean" ? value : Number(state.player.tainted.rewards[key] || 0) + value; });
      const merit = grantQuestMerit(state);
      pushHistory(state, { type: "loot", text: "Đã hạ " + pursuer.name + ", nhận phần thưởng trận doanh." });
      return { success: true, reward, merit };
    }
    pushHistory(state, { type: "loot", text: "Đã hạ " + pursuer.name + "." });
    return { success: true };
  }

  function recordTaintedMilestones(state) {
    const tier = cultivationTier(state);
    const p = state.player;
    p.tainted = p.tainted || { attention: false, vocation: null, faction: null, quests: 0, finalConflictPreparation: false, taintedGodDefeated: false, rewards: {} };
    if (excludedFromTainted(state)) {
      p.tainted.attentionPending = false;
      p.tainted.factionPending = false;
      p.tainted.questsActive = false;
      p.tainted.finalConflictPreparation = false;
      return;
    }
    if (tier >= 5 && !p.tainted.attention) p.tainted.attentionPending = true;
    if (tier >= 8 && !p.tainted.faction) p.tainted.factionPending = true;
    if (tier >= 8 && p.tainted.faction) p.tainted.questsActive = true;
    if (tier >= 13) p.tainted.finalConflictPreparation = true;
  }

  function grantBreakthroughFate(state, targetLevel) {
    if (Number(targetLevel || 0) < 3 || !state.player.pathId || state.player.pathId === "ngoai_dao_gia") return null;
    state.flags.fatePityMisses = Number(state.flags.fatePityMisses || 0);
    const guaranteed = state.flags.fatePityMisses >= 1;
    if (!guaranteed && Math.random() >= 0.5) {
      state.flags.fatePityMisses += 1;
      pushHistory(state, { type: "sys", text: "◇ Thiên Cơ tích lũy 1/2 · lần Đột Phá kế tiếp bảo đảm xuất hiện Mệnh Số." });
      return null;
    }
    const cap = Math.min(8, 1 + Math.floor((Number(targetLevel) - 2) / 2));
    const fate = rollFateByProgression(state, { level: Number(targetLevel), gradeCap: cap });
    if (!fate) return null;
    const result = receiveFate(state, fate.id, { source: "Đột Phá Cấp " + targetLevel, allowPending: true });
    state.flags.fatePityMisses = result.added ? 0 : state.flags.fatePityMisses;
    pushHistory(state, { type: result.added ? "sys" : "warn", text: result.added ? "◇ Đột Phá dẫn Mệnh: " + fate.name + " đã vào Mệnh Kho." : "◇ Đột Phá dẫn Mệnh: " + fate.name + " đang chờ xử lý vì Mệnh Kho đầy." });
    return { fate, ...result };
  }

  function maybeBreakthrough(state) {
    const idx = realmIndex(state);
    const realm = D().REALMS[idx];
    const next = D().REALMS[idx + 1];
    if (!next) return { changed: false, reason: "Đã đạt cảnh giới tối thượng." };
    const blockers = getBreakthroughBlockers(state);
    if (blockers.length) {
      if (typeof console !== "undefined") console.warn("[BreakthroughRejected]", { blockers, realm: state.player.realmId, exp: state.player.exp });
      return { changed: false, reason: "Chưa đủ điều kiện Đột Phá: " + blockers.join("; "), blockers };
    }
    const isUnbound = state.player.pathId === "ngoai_dao_gia";
    const expRequired = Number(realm.breakExp || Infinity) * (isUnbound ? 5 : 1);
    if (state.player.exp < expRequired) return { changed: false, reason: "Tu vi chưa đủ để đột phá (" + state.player.exp + "/" + expRequired + ")." };
    if (cultivationTier(state) === 1) {
      const changed = enterLuyenKhi(state, "tích đủ 100 EXP");
      return { changed, reason: changed ? "Khai mở vận mệnh, bước vào Khai Lộ Cảnh." : "Không thể bước vào Khai Lộ Cảnh." };
    }
    if (!state.player.pathId) return { changed: false, reason: "Phải chọn Con Đường hoặc Ngoại Đạo Giả trước khi tiếp tục đột phá." };

    const fate = computeFate(state.player);
    const fateMultiplier = isUnbound ? 2 : 1;
    const minTotal = Number(next.minFate || 0) * fateMultiplier;
    const minNormal = Number(next.minNormalFate || 0) * fateMultiplier;
    if (fate.effective < minTotal) return { changed: false, reason: "Mệnh hiệu dụng chưa đủ (" + fate.effective + "/" + minTotal + ")." };
    if (fate.normal < minNormal) return { changed: false, reason: "Mệnh Cát/Bình chưa đủ (" + fate.normal + "/" + minNormal + ")." };
    if (next.minRatioR != null && fate.ratio < next.minRatioR) return { changed: false, reason: "Tỷ lệ R chưa đạt " + next.minRatioR + "." };

    if (isUnbound) {
      if (next.level === 8 && !state.player.unboundTrials?.selfProof) return { changed: false, reason: "Cần hoàn thành thử thách Tự Chứng." };
      if (next.level === 11 && !state.player.unboundTrials?.severLaw) return { changed: false, reason: "Cần hoàn thành thử thách Đoạn Luật." };
      if (next.level === 13 && !state.player.unboundTrials?.establishPath) return { changed: false, reason: "Cần hoàn thành thử thách Lập Đạo." };
      if (next.level === 14 && !state.player.unboundPathProven) return { changed: false, reason: "Cần hoàn thành Vô Lộ Chứng Đạo." };
    } else {
      const match = pathMatchSummary(state.player, state.player.pathId);
      if (match.lead < Number(next.requiredLeadTags || 0) || match.lead + match.support < Number(next.requiredCompatibleTags || 0) || match.score < Number(next.requiredPathScore || 0)) {
        return { changed: false, reason: "Mệnh dẫn/trợ hoặc path_score chưa đạt điều kiện Con Đường." };
      }
      if (next.requiresFinalVictory && state.player.hiddenProfession !== "luan_hoi_tien" && !state.player.tainted?.taintedGodDefeated) {
        return { changed: false, reason: "Cần đánh bại Tà Thần trước khi tiến vào cảnh giới cuối." };
      }
    }

    const activeAnchors = (state.player.anchors || []).filter((anchor) => !anchor.broken && Number(anchor.stability || 0) > 0);
    if ((next.requiresStableAnchor || next.requiresActiveAnchor) && !activeAnchors.length) return { changed: false, reason: "Cần ít nhất một Neo Nhân Tính đang hoạt động." };
    if (next.requiresStableAnchor && !activeAnchors.some((anchor) => Number(anchor.stability || 0) >= 50)) return { changed: false, reason: "Neo Nhân Tính chưa đủ ổn định." };
    if (next.requiresHighAnchor && !activeAnchors.some((anchor) => Number(anchor.stability || 0) >= 75)) return { changed: false, reason: "Cần một Neo Nhân Tính cấp cao có độ ổn định từ 75." };
    if (next.maxCorruption != null && Number(state.player.corruptionRating || 0) > Number(next.maxCorruption)) return { changed: false, reason: "Corruption vượt giới hạn của nghi thức." };

    if (next.requiresCoreTechnique && !hasCoreTechnique(state)) return { changed: false, reason: "Cần lĩnh ngộ ít nhất một Công Pháp Cốt Lõi." };
    if (next.requiresPathRitual && !state.flags.pathRituals?.includes(next.requiresPathRitual)) return { changed: false, reason: "Chưa hoàn thành nghi thức Con Đường: " + next.requiresPathRitual + "." };
    if (next.requiresCoreTechniqueFusion && !state.flags.coreTechniqueFusionCompleted) return { changed: false, reason: "Chưa hợp nhất Công Pháp Cốt Lõi với Con Đường." };
    if (next.requiresGreatRitual && !state.flags.greatRitualCompleted) return { changed: false, reason: "Chưa hoàn thành đại nghi thức." };
    if (next.requiresUniquePower && !state.flags.uniquePowerCreated) return { changed: false, reason: "Chưa tạo Quyền Năng độc nhất." };
    if (next.requiresFactionQuest && !isUnbound && !state.flags.factionQuestCompleted) return { changed: false, reason: "Chưa hoàn thành quest trận doanh." };
    if (next.requiresNoOverdueDebt && Number(state.player.overdueFateDebt || 0) > 0) return { changed: false, reason: "Còn Mệnh Nợ quá hạn." };
    if (next.requiresTrueNameTrial && !state.flags.trueNameTrialPassed) return { changed: false, reason: "Chưa giữ được Chân Danh qua phản phệ." };
    if (next.requiresFinalPreparation && !isUnbound && !state.player.tainted?.finalConflictPreparation && !state.flags.finalConflictPreparation) return { changed: false, reason: "Chưa hoàn tất chuẩn bị quyết chiến." };

    const ritualFlags = state.flags.breakthroughRitual || {};
    // Ritual gates are the sole body/mind risk point. Once all gates pass,
    // commit is deterministic and must not repeat the legacy random roll.
    const ritualStatus = breakthroughRitualStatus(state);
    if (ritualStatus.plan.length && !ritualStatus.ready) return { changed: false, reason: "Nghi thức đột phá chưa hoàn tất.", blockers: ritualStatus.remaining };
    if (ritualStatus.ready && ritualStatus.plan.length) {
      const previousMaxLifespan = Number(state.player.maxLifespan || computeLifespan(state.player));
      state.player.realmId = next.id;
      const upgradedMaxLifespan = computeLifespan(state.player);
      const lifespanDelta = Math.max(0, upgradedMaxLifespan - previousMaxLifespan);
      if (lifespanDelta) state.player.lifespan = Number(state.player.lifespan || 0) + lifespanDelta;
      state.player.exp = Math.max(0, state.player.exp - expRequired);
      state.flags.breakthroughRitual = null;
      adjustDaoTam(state, 2, "đột phá thành công liên tiếp");
      cultivationJournalPush(state, { type: "breakthrough", amount: 0, realmId: next.id, note: "Đột phá thành công" });
      recordTaintedMilestones(state);
      pushMemory(state, "Đột phá thành công: " + pathTitle(state));
      pushHistory(state, { type: "sys", text: "§ ĐỘT PHÁ THÀNH CÔNG — " + pathTitle(state) + "!" });
      grantBreakthroughFate(state, next.level);
      updateDerived(state);
      return { changed: true, reason: "Đột phá thành công." };
    }
    const stats = computeStats(state.player);
    const difficulty = 10 + Number(next.level || 1) * 3 + (isUnbound ? 15 : 0);
    const body = ritualFlags.bodyMindPassed ? { success: true } : skillCheck(Number(state.player.aptitude || 0), difficulty);
    const mind = ritualFlags.bodyMindPassed ? { success: true } : skillCheck(Number(state.player.comprehension || 0), difficulty);
    const pendingTribulation = state.pendingTribulation;
    const tribulationBonus = pendingTribulation?.status === "resolved" && Number(pendingTribulation.targetRealmLevel) === Number(next.level) ? Number(pendingTribulation.result?.bonus || 0) : 0;
    const chance = clamp(35 + state.player.aptitude * 0.25 + state.player.comprehension * 0.20 + Math.min(20, Math.max(0, fate.effective - minTotal) * 0.05) - state.player.corruptionRating * 0.15 + tribulationBonus, 5, 95);
    const chanceRoll = rnd(1, 100);
    if (!body.success || !mind.success || chanceRoll > chance) {
      const expLoss = Math.ceil(state.player.exp * rnd(5, 15) / 100);
      state.player.exp = Math.max(0, state.player.exp - expLoss);
      drainSan(state, rnd(3, 10), "đột phá thất bại");
      pushHistory(state, { type: "warn", text: "× Đột phá thất bại; mất " + expLoss + " EXP." });
      return { changed: false, reason: "Đột phá thất bại." };
    }
    const previousMaxLifespan = Number(state.player.maxLifespan || computeLifespan(state.player));
    state.player.realmId = next.id;
    const upgradedMaxLifespan = computeLifespan(state.player);
    const lifespanDelta = Math.max(0, upgradedMaxLifespan - previousMaxLifespan);
    if (lifespanDelta) state.player.lifespan = Number(state.player.lifespan || 0) + lifespanDelta;
    state.player.exp = Math.max(0, state.player.exp - expRequired);
    state.flags.breakthroughRitual = null;
    recordTaintedMilestones(state);
    pushMemory(state, "Đột phá thành công: " + pathTitle(state));
    pushHistory(state, { type: "sys", text: "§ ĐỘT PHÁ THÀNH CÔNG — " + pathTitle(state) + "!" + (lifespanDelta ? " Thọ Nguyên tối đa +" + lifespanDelta + " năm, hiện tại +" + lifespanDelta + " năm." : "") });
    grantBreakthroughFate(state, next.level);
    updateDerived(state);
    return { changed: true, reason: "Đột phá thành công." };
  }

  function doBreakthrough(state) {
    const r = maybeBreakthrough(state);
    if (!r.changed) {
      pushHistory(state, { type: "warn", text: "× " + r.reason });
    } else if (typeof window !== "undefined" && window.GameExpansion?.afterBreakthrough) {
      window.GameExpansion.afterBreakthrough(state, r);
    }
    if (typeof window !== "undefined" && window.GameExpansion?.afterBreakthroughAttempt) window.GameExpansion.afterBreakthroughAttempt(state, r);
    updateDerived(state);
    return r;
  }

  /* ---------- Cultivation ---------- */
  function cultivate(state) {
    const stats = computeStats(state.player);
    const qiCost = Math.max(5, Math.round(30 - stats.mag * 0.4));
    if (state.player.qi < qiCost) {
      pushHistory(state, { type: "warn", text: "× Linh khí không đủ để tu luyện (cần " + qiCost + ")." });
      return;
    }
    state.player.qi -= qiCost;
    const baseExp = Math.max(5, Math.round(stats.mag * 1.2 + rnd(0, 10)));
    const guildBenefits = getGuildBenefits(state);
    const linhCanMultiplier = spiritualRootProfile(state.player).expMultiplierTotal;
    const originCultivationMult = Math.max(0.1, 1 + Number(stats.eff?.cultivationSpeedPct || 0) / 100);
    const worldCultivationMult = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
      ? Number(window.GameExpansion.getWorldModifiers(state, { activity: "cultivation" }).cultivationMult || 1)
      : 1;
    const techniqueCultivationMult = typeof window !== "undefined" && window.GameExpansion?.techniqueEvolutionModifiers
      ? Object.keys(state.player.techniques || {}).reduce((mult, id) => mult * Number(window.GameExpansion.techniqueEvolutionModifiers(state, id).cultivationMult || 1), 1)
      : 1;
    const exp = Math.max(1, Math.round(baseExp * linhCanMultiplier * (1 + guildBenefits.expBonusPct / 100) * originCultivationMult * worldCultivationMult * techniqueCultivationMult));
    if (state.guildMembership) {
      const oldRank = guildRank(state.guildMembership.contribution).name;
      state.guildMembership.contribution += Math.max(1, Math.round(baseExp / 10));
      state.guildMembership.rank = guildRank(state.guildMembership.contribution).name;
      if (state.guildMembership.rank !== oldRank) {
        pushHistory(state, { type: "sys", text: "§ Thân phận tông môn thăng lên " + state.guildMembership.rank + "." });
      }
      grantGuildTechniques(state);
    }
    gainExp(state, exp);
    let masteryTotal = 0;
    getKnownTechniques(state).forEach((technique) => {
      masteryTotal += updateTechniqueMastery(state, technique, state.player.techniques[technique.id], "cultivation");
    });

    // corruption SAN risk
    const loc = D().LOCATIONS[state.locationId];
    const rawCorruption = loc ? loc.corruption : 1;
    const corruption = Math.max(0.5, rawCorruption * (1 - guildBenefits.cityPenaltyReductionPct / 100));
    const sanCheckRes = sanCheck(state.player, corruption);
    if (!sanCheckRes.success) {
      const drain = rnd(3, 8) * corruption;
      drainSan(state, drain, "linh khí dị biến khi tu luyện");
      if (state.player.san <= 0) return;
    }
    state.flags.didCultivate = true;
    const guildText = guildBenefits.guild ? " · môn phái +" + guildBenefits.expBonusPct + "%" : "";
    pushHistory(state, { type: "sys", text: weaveAtmosphere(state, "§ Ngươi vận công tu luyện, Tu vi +" + exp + " · tổng Thông Thạo Công pháp +" + masteryTotal + " (căn cốt " + state.player.aptitude + "/100" + guildText + ").", "cultivate") });
    checkQuestObjectives(state, "nhan_mon");
    updateDerived(state);
  }

  /* ---------- Rest ---------- */
  function rest(state) {
    const inCombat = Object.keys(state.enemies || {}).length > 0;
    if (inCombat) {
      pushHistory(state, { type: "warn", text: "× Không thể nghỉ ngơi trong lúc giao chiến." });
      return;
    }
    state.flags.fledUntilTurn = 0;
    const hpRecover = Math.max(1, Math.round(state.player.maxHp * 0.25));
    const qiRecover = Math.max(1, Math.round(state.player.maxQi * 0.25 * (1 + Number(state.player.stats?.eff?.qiRecoveryPct || 0) / 100)));
    state.player.hp = clamp(state.player.hp + hpRecover, 0, state.player.maxHp);
    state.player.qi = clamp(state.player.qi + qiRecover, 0, state.player.maxQi);
    const restoredSan = restoreSan(state, rnd(5, 12));
    state.player.stamina = clamp((state.player.stamina ?? 0) + 20, 0, state.player.maxStamina || 100);
    pushHistory(state, { type: "sys", text: "§ Ngươi tĩnh tọa nghỉ ngơi, hồi Khí Huyết +" + hpRecover + ", Linh Khí +" + qiRecover + ", Thanh Tỉnh +" + restoredSan + " và phục hồi thể lực." });
    updateDerived(state);
  }

  /* ---------- SAN / Madness ---------- */
  function restoreSan(state, amount) {
    const corruption = Number(state.player.corruptionRating || 0);
    const recoveryRate = Math.max(0.5, 1 - corruption / 200);
    const restored = Math.max(0, Math.round(Number(amount || 0) * recoveryRate));
    const before = Number(state.player.san || 0);
    state.player.san = clamp(before + restored, 0, state.player.maxSan || 100);
    return state.player.san - before;
  }

  function drainSan(state, amount, source) {
    const stats = computeStats(state.player);
    const resist = stats.eff.sanResist;
    const corruptionSensitivity = 1 + Number(state.player.corruptionRating || 0) / 200;
    const drainMult = Math.max(0.1, 1 + stats.eff.sanDrainMult);
    const worldSanMult = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
      ? Number(window.GameExpansion.getWorldModifiers(state, { activity: "sanity" }).sanDrainMult || 1)
      : 1;
    const reduced = Math.max(0, Math.round(amount * Math.max(0.1, 1 - resist) * drainMult * corruptionSensitivity * worldSanMult));
    if (state.flags.sanShield) {
      state.flags.sanShield = false;
      pushHistory(state, { type: "sys", text: "§ Phá Cấm Phù bảo vệ ngươi khỏi tà niệm." });
      return;
    }
    const beforeStatus = sanStatus(state.player).name;
    state.player.san = clamp(state.player.san - reduced, 0, state.player.maxSan || 100);
    const afterStatus = sanStatus(state.player).name;
    pushHistory(state, { type: "warn", text: "× Tà niệm xâm nhập! Thanh Tỉnh -" + reduced + (source ? " (" + source + ")" : "") + "." });
    if (beforeStatus !== afterStatus && state.player.san > 0) pushHistory(state, { type: "warn", text: "× Tâm cảnh chuyển thành " + afterStatus + ": " + sanStatus(state.player).desc });
    if (state.player.san <= 0) triggerMadness(state, source || "Tà niệm");
    updateDerived(state);
  }

  function triggerMadness(state, source = "Tà niệm") {
    if (state.flags.madness) return true;
    state.player.san = 0;
    state.flags.madness = true;
    state.flags.madnessPenalty = {
      source,
      lostExp: Math.min(state.player.exp, Math.ceil(state.player.exp * 0.1)),
      corruptionGained: Math.min(100 - Number(state.player.corruptionRating || 0), 10)
    };
    state.player.exp -= state.flags.madnessPenalty.lostExp;
    state.player.corruptionRating = clamp(Number(state.player.corruptionRating || 0) + state.flags.madnessPenalty.corruptionGained, 0, 100);
    pushMemory(state, "Rơi vào trạng thái Mất Trí.");
    pushHistory(state, { type: "warn", text: "§ NGƯƠI ĐÃ MẤT TRÍ — " + source + ". Hình phạt: mất " + state.flags.madnessPenalty.lostExp + " Tu vi, Corruption +" + state.flags.madnessPenalty.corruptionGained + "." });
    state.pendingEnding = "succumb";
    return true;
  }

  function autoCultivate(state, rounds = 5) {
    const target = clamp(Math.floor(Number(rounds) || 5), 1, 240);
    if (aliveEnemies(state).length || state.pendingEnding) return { success: false, completed: 0, reason: "Không thể tự động tu luyện khi đang giao chiến hoặc hành trình đã kết thúc." };
    let cultivated = 0;
    let rested = 0;
    let reason = "Đã hoàn thành số chu kỳ đã chọn.";
    for (let i = 0; i < target; i += 1) {
      if (state.player.san <= 25) { reason = "Dừng vì Thanh Tỉnh đã xuống ngưỡng nguy hiểm."; break; }
      if (breakthroughRequirements(state).ready) { reason = "Đã đủ điều kiện đột phá; cần mệnh nhân tự quyết định phá cảnh."; break; }
      state.meta.turn += 1;
      const beforeExp = state.player.exp;
      cultivate(state);
      if (state.player.exp > beforeExp) cultivated += 1;
      else {
        rest(state);
        rested += 1;
      }
      if (state.pendingEnding || state.flags.madness) { reason = "Dừng vì thần thức đã sụp đổ."; break; }
    }
    state.autoCultivation = { requested: target, cultivated, rested, reason, turn: state.meta.turn };
    pushHistory(state, { type: "sys", text: "§ Tự động tu luyện: vận công " + cultivated + " lượt, điều tức " + rested + " lượt. " + reason });
    updateDerived(state);
    return { success: cultivated > 0, completed: cultivated, rested, reason };
  }

  // AFK-safe cultivation: only available at a relatively stable location and
  // bounded to a short session so it cannot bypass encounters or unattended SAN
  // consequences. One hour represents six cultivation/rest cycles.
  function secludedCultivation(state, hours = 1) {
    const loc = D().LOCATIONS[state.locationId];
    const duration = clamp(Math.floor(Number(hours) || 1), 1, 8);
    if (aliveEnemies(state).length || state.pendingEnding) {
      return { success: false, completed: 0, reason: "Không thể bế quan khi đang giao chiến hoặc hành trình đã kết thúc." };
    }
    if (!loc || Number(loc.corruption || 0) > 2) {
      pushHistory(state, { type: "warn", text: "× Nơi này linh khí quá hỗn loạn; hãy tìm một nơi an toàn (Tà Nhiễm ≤ 2) rồi mới bế quan." });
      return { success: false, completed: 0, reason: "Địa điểm không an toàn." };
    }
    const daysPerHour = Math.max(1, Math.round(3600 / Number(GAME_TIME_CONFIG?.realSecondsPerGameDay || 30)));
    const result = autoCultivate(state, duration * daysPerHour);
    state.autoCultivation = {
      mode: "be_quan",
      hours: duration,
      completed: result.completed,
      rested: result.rested,
      reason: result.reason,
      turn: state.meta.turn,
      locationId: state.locationId
    };
    pushHistory(state, { type: "sys", text: "§ Bế quan kết thúc sau " + duration + " giờ: vận công " + result.completed + " lượt, điều tức " + result.rested + " lượt. " + result.reason });
    updateDerived(state);
    return { ...result, hours: duration };
  }

  function applyOfflineProgress(state, now = Date.now()) {
    const clock = ensureGameClock(state);
    const previous = Number(clock.lastRealTimestamp || now);
    const elapsedSeconds = Math.max(0, (Number(now) - previous) / 1000);
    clock.lastRealTimestamp = Number(now);
    const secondsPerGameDay = Number(GAME_TIME_CONFIG.realSecondsPerGameDay);
    const elapsedGameDays = elapsedSeconds / secondsPerGameDay;
    const gameDays = Math.floor(elapsedGameDays);
    if (state.pendingEnding) return { elapsedSeconds, gameDays, cultivated: 0, rested: 0, skipped: true };
    if (gameDays < 1) {
      advanceGameTime(state, elapsedGameDays);
      state.autoCultivation = { mode: "offline", elapsedSeconds, gameDays: 0, cultivated: 0, rested: 0, skipped: false, completedAt: Number(now) };
      updateDerived(state);
      return { elapsedSeconds, gameDays: 0, cultivated: 0, rested: 0, skipped: false };
    }
    // Offline chỉ mô phỏng thời gian và world state; không tự ý luyện công,
    // sinh encounter hoặc tiêu hao vật phẩm. Luân Hồi vẫn được xử lý nếu
    // số năm sinh mệnh cạn trong quá trình advanceGameTime.
    state._offlineSimulation = true;
    state._suppressHistory = true;
    try {
      advanceGameTime(state, elapsedGameDays);
      // applyOfflineProgress is also a public API.  When it is called directly
      // (instead of through the expansion deserialize wrapper), keep the world
      // simulation on the exact same day as the canonical game clock.
      if (typeof window !== "undefined" && window.GameExpansion?.simulateWorldUntil) {
        const ordinal = (Number(clock.currentYear || 1) - 1) * GAME_TIME_CONFIG.gameDaysPerYear
          + (Number(clock.currentMonth || 1) - 1) * GAME_TIME_CONFIG.gameDaysPerMonth
          + Number(clock.currentDay || 1);
        window.GameExpansion.simulateWorldUntil(state, ordinal);
      }
    } finally {
      state._suppressHistory = false;
      state._offlineSimulation = false;
    }
    const forcedReincarnation = state.pendingEnding === "reincarnation";
    state.autoCultivation = { mode: "offline", elapsedSeconds, gameDays, cultivated: 0, rested: 0, skipped: false, forcedReincarnation, completedAt: Number(now) };
    pushHistory(state, { type: "sys", text: "§ Offline: thế giới đã đồng bộ " + gameDays + " ngày game." + (forcedReincarnation ? " Thọ Nguyên đã cạn, Luân Hồi được kích hoạt." : "") });
    updateDerived(state);
    return { elapsedSeconds, gameDays, cultivated: 0, rested: 0, skipped: false, forcedReincarnation };
  }

  /* ---------- Movement ---------- */
  const OPEN_WORLD_DELTAS = { bac: [0, 1], nam: [0, -1], dong: [1, 0], tay: [-1, 0] };
  const OPEN_WORLD_OPPOSITE = { bac: "nam", nam: "bac", dong: "tay", tay: "dong" };
  function openWorldHash(x, y) {
    let h = 2166136261;
    for (const ch of String(x) + ":" + String(y)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  function ensureOpenWorld(state) {
    state.openWorld = state.openWorld || { coordinates: {}, nodes: {}, exits: {} };
    state.openWorld.coordinates = state.openWorld.coordinates || {};
    state.openWorld.nodes = state.openWorld.nodes || {};
    state.openWorld.exits = state.openWorld.exits || {};
    if (!state.openWorld.coordinates[state.locationId]) state.openWorld.coordinates[state.locationId] = [0, 0];
    Object.entries(state.openWorld.nodes).forEach(([id, node]) => {
      state.openWorld.exits[id] = { ...(node.exits || {}), ...(state.openWorld.exits[id] || {}) };
      D().LOCATIONS[id] = node;
    });
    // Old saves stored only the generated node's return edge. Rebuild the
    // reciprocal edge so a reload does not erase the route from the old node.
    Object.entries(state.openWorld.exits).forEach(([from, exits]) => {
      Object.entries(exits).forEach(([dir, to]) => {
        const reverse = OPEN_WORLD_OPPOSITE[dir];
        if (!to || !reverse) return;
        const knownReverse = state.openWorld.exits[to]?.[reverse] || D().LOCATIONS[to]?.exits?.[reverse];
        if (!knownReverse) state.openWorld.exits[to] = { ...(state.openWorld.exits[to] || {}), [reverse]: from };
      });
    });
    return state.openWorld;
  }
  function locationExits(state, locationId = state.locationId) {
    const base = D().LOCATIONS[locationId]?.exits || {};
    const overrides = ensureOpenWorld(state).exits[locationId] || {};
    return { ...base, ...overrides };
  }
  function generateOpenWorldNode(state, x, y) {
    const world = ensureOpenWorld(state);
    const id = "open_" + x + "_" + y;
    if (world.nodes[id]) { D().LOCATIONS[id] = world.nodes[id]; return id; }
    const hash = openWorldHash(x, y);
    const distance = Math.abs(x) + Math.abs(y);
    const region = distance < 6 ? "trung_vuc" : distance < 16 ? ["dong_hoang", "nam_chuong", "tay_mac"][hash % 3] : distance < 30 ? ["bac_nguyen", "vo_tan_hai", "dong_hoang"][hash % 3] : ["thien_khong_vuc", "u_minh_gioi", "vo_tan_hai"][hash % 3];
    const danger = Math.min(5, 1 + Math.floor(distance / 8) + (hash % 2));
    const names = ["Dã Lộ Vô Danh", "Cổ Trạm Tàn Nguyệt", "Linh Hoang Vực", "Hắc Thủy Bến", "Thiên Khuyết Ngoại Biên"];
    const node = { id, name: names[hash % names.length] + " · " + x + "," + y, x, y, region, corruption: Math.max(1, danger - 1), dangerLevel: danger, linhKhiDensity: Math.max(1, 5 - Math.floor(distance / 12)), npcs: [], enemies: danger >= 3 ? [hash % 2 ? "yeu_thu" : "di_qui"] : [], searchable: ["linh_thach", "tu_khi_dan"], exits: { bac: null, nam: null, dong: null, tay: null }, openWorld: true, desc: "Một khoảng đất chưa từng được ghi vào địa đồ. Linh khí trôi dạt thành những dòng xoáy, còn bóng tối dường như đang học cách gọi tên ngươi." };
    D().LOCATIONS[id] = node;
    world.nodes[id] = node;
    world.coordinates[id] = [x, y];
    return id;
  }
  function openWorldTarget(state, dir) {
    const world = ensureOpenWorld(state);
    const current = world.coordinates[state.locationId] || [0, 0];
    const delta = OPEN_WORLD_DELTAS[dir];
    if (!delta) return null;
    const x = current[0] + delta[0], y = current[1] + delta[1];
    let target = locationExits(state)[dir];
    if (!target || !D().LOCATIONS[target]) target = generateOpenWorldNode(state, x, y);
    world.coordinates[target] = world.coordinates[target] || [x, y];
    world.exits[state.locationId] = { ...(world.exits[state.locationId] || {}), [dir]: target };
    const destination = D().LOCATIONS[target];
    const reverse = OPEN_WORLD_OPPOSITE[dir];
    if (!locationExits(state, target)[reverse]) {
      world.exits[target] = { ...(world.exits[target] || {}), [reverse]: state.locationId };
    }
    return target;
  }
  function move(state, dir) {
    ensureOpenWorld(state);
    const loc = D().LOCATIONS[state.locationId];
    if (!loc || !loc.exits) {
      pushHistory(state, { type: "warn", text: "× Không thể đi từ đây." });
      return;
    }
    const target = openWorldTarget(state, dir);
    if (!target || !D().LOCATIONS[target]) {
      pushHistory(state, { type: "warn", text: "× Không có lối về hướng đó." });
      return;
    }
    if (state.pendingSearch && state.pendingSearch.locationId !== target) {
      state.pendingSearch = null;
      pushHistory(state, { type: "sys", text: "Ngươi rời khu vực, những phát hiện chưa xử lý trong phiên tìm kiếm bị bỏ lại." });
    }
    state.locationId = target;
    if (!Array.isArray(state.visitedLocations)) state.visitedLocations = [];
    if (!state.visitedLocations.includes(target)) state.visitedLocations.push(target);
    explorationMilestone(state);
    const newLoc = D().LOCATIONS[target];
    pushHistory(state, { type: "sys", text: weaveAtmosphere(state, "→ Ngươi tiến đến " + newLoc.name + ".", "move:" + target) });
    maybeSpawnDynamicQuest(state);
    // corruption SAN check on entry
    if (newLoc.corruption >= 3) {
      const res = sanCheck(state.player, newLoc.corruption);
      if (!res.success) drainSan(state, rnd(4, 10) * newLoc.corruption, "môi trường dị biến");
    }
    state.flags.enteredCamDia = state.flags.enteredCamDia || target === "cam_dia";
    if (target === "cam_dia") activateQuest(state, "bi_mat_cam_dia");
    checkQuestObjectives(state, "bi_mat_cam_dia");
    maybeTriggerRandomEncounter(state);
    maybeSpawnCombatExtras(state);
    updateDerived(state);
  }

  /* ---------- Look ---------- */
  function look(state) {
    const loc = D().LOCATIONS[state.locationId];
    const lines = [];
    lines.push(loc.desc);
    const specialNpcs = presentEntities(state).map((e) => e.name);
    if (loc.npcs && loc.npcs.length) lines.push("Nhân vật: " + loc.npcs.map((n) => D().NPCS[n].name + " (" + D().NPCS[n].title + ")").join(", "));
    if (specialNpcs.length) lines.push("Nhân vật đặc biệt: " + specialNpcs.join(", "));
    if (loc.enemies && loc.enemies.length) lines.push("Nguy hiểm: " + loc.enemies.map((e) => D().ENEMIES[e].name).join(", "));
    const exits = Object.keys(locationExits(state));
    if (exits.length) lines.push("Lối đi: " + exits.map((d) => ({ bac: "bắc", nam: "nam", dong: "đông", tay: "tây" }[d] || d)).join(", "));
    return weaveAtmosphere(state, lines.join("\n"), "look:" + state.locationId);
  }

  /* ---------- Search ---------- */
  function ensureSearchSite(state, locationId = state.locationId) {
    state.searchSites = state.searchSites || {};
    const turn = Number(state.meta?.turn || 0);
    let site = state.searchSites[locationId];
    if (!site) site = state.searchSites[locationId] = { depth: 5, maxDepth: 5, sessions: 0, chainStage: 0, recoverAtTurn: 0 };
    if (Number(site.depth || 0) <= 0 && Number(site.recoverAtTurn || 0) > 0 && turn >= Number(site.recoverAtTurn)) {
      site.depth = Number(site.maxDepth || 5);
      site.recoverAtTurn = 0;
    }
    return site;
  }
  function searchStatus(state, locationId = state.locationId) {
    const loc = D().LOCATIONS[locationId];
    const site = ensureSearchSite(state, locationId);
    const depth = Math.max(0, Number(site.depth || 0));
    const rolls = depth >= 4 ? 3 : depth >= 2 ? 2 : depth > 0 ? 1 : 0;
    const stats = computeStats(state.player);
    return {
      searchable: Boolean(loc?.searchable?.length), depth, maxDepth: Number(site.maxDepth || 5), rolls,
      depleted: depth <= 0,
      recoverIn: depth <= 0 ? Math.max(0, Number(site.recoverAtTurn || 0) - Number(state.meta?.turn || 0)) : 0,
      pending: state.pendingSearch?.locationId === locationId ? state.pendingSearch : null,
      resourcePct: Math.round(depth / Math.max(1, Number(site.maxDepth || 5)) * 100),
      riskPct: Math.round(searchRisk(state, loc, stats) * 100)
    };
  }
  function searchRisk(state, loc, stats) {
    const danger = Number(loc?.dangerLevel || loc?.corruption || 1);
    const powerMitigation = Math.min(0.24, (Number(stats.phy || 0) + Number(stats.mag || 0)) / 500);
    const originReduction = Number(stats.eff?.searchRiskReductionPct || 0) / 100;
    const worldRisk = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
      ? Number(window.GameExpansion.getWorldModifiers(state, { activity: "search" }).searchRiskDelta || 0)
      : 0;
    return clamp(0.05 + danger * 0.07 + Number(loc?.corruption || 0) * 0.025 - powerMitigation - originReduction + worldRisk, 0.03, 0.58);
  }
  function ensureSearchChainQuest(state, locationId, requiredSearches) {
    const loc = D().LOCATIONS[locationId];
    const id = "search_chain_" + locationId;
    const owned = new Set([...(state.player.fates || []), ...(state.fateInventory || [])]);
    const savedRewardId = state.quests?.[id]?.rewardFateId;
    const fateReward = D().FATE_PATTERNS.find((fate) => fate.id === savedRewardId) || D().FATE_PATTERNS.filter((fate) => !owned.has(fate.id))
      .sort((a, b) => fateCompatibility(state.player.pathId, b) - fateCompatibility(state.player.pathId, a) || Number(b.score || 0) - Number(a.score || 0))[0];
    D().QUESTS[id] = {
      id, title: "Dấu Vết Dưới " + (loc?.name || "Vùng Vô Danh"), kind: "co_duyen", priority: 2,
      objectives: [{ id: "follow_trace", label: "Tìm kiếm thêm để lần theo dấu vết", check: (st) => Number(st.flags.searches?.[locationId] || 0) >= Number(requiredSearches || 1) }],
      reward: { exp: 45, merit: 2, ...(fateReward ? { fate: fateReward.id } : {}) }
    };
    if (!state.quests[id]) state.quests[id] = { id, type: "co_duyen", title: D().QUESTS[id].title, priority: 2, status: "active", tracked: true, discoveredAt: Date.now(), searchLocationId: locationId, requiredSearches: Number(requiredSearches || 1), rewardFateId: fateReward?.id || null, objectives: [{ id: "follow_trace", label: "Tìm kiếm thêm để lần theo dấu vết", done: false }], branches: [], alternatives: ["search"], consequences: {} };
    return id;
  }
  function search(state) {
    const loc = D().LOCATIONS[state.locationId];
    const status = searchStatus(state);
    if (state.pendingSearch) {
      pushHistory(state, { type: "warn", text: "× Hãy xử lý những gì vừa phát hiện trước khi tiếp tục tìm kiếm." });
      return { success: false, reason: "Search Session trước chưa kết thúc." };
    }
    if (!status.searchable) {
      pushHistory(state, { type: "sys", text: "Khu vực này không có tài nguyên hoặc dấu vết có thể tìm kiếm." });
      return { success: false, reason: "Khu vực không thể tìm kiếm." };
    }
    if (status.depleted) {
      pushHistory(state, { type: "warn", text: "× Khu vực đã bị lục soát. Tài nguyên có thể hồi lại sau " + status.recoverIn + " lượt." });
      return { success: false, reason: "Search Depth đã cạn." };
    }
    const staminaCost = 5;
    if (Number(state.player.stamina || 0) < staminaCost) {
      pushHistory(state, { type: "warn", text: "× Cần ít nhất " + staminaCost + " Thể Lực để bắt đầu một phiên tìm kiếm." });
      return { success: false, reason: "Không đủ Thể Lực." };
    }
    state.player.stamina = Math.max(0, Number(state.player.stamina || 0) - staminaCost);
    state.flags.searches = state.flags.searches || {};
    const sessionNumber = Number(state.flags.searches[state.locationId] || 0) + 1;
    state.flags.searches[state.locationId] = sessionNumber;
    const site = ensureSearchSite(state);
    const stats = computeStats(state.player);
    const worldSearchMult = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
      ? Number(window.GameExpansion.getWorldModifiers(state, { activity: "search" }).searchRewardMult || 1)
      : 1;
    const discoveryChance = clamp(0.34 + Number(stats.mag || 0) / 180 + Number(state.player.comprehension || 0) / 350 + Number(stats.eff?.searchDiscoveryPct || 0) / 100, 0.38, 0.92);
    const rareChance = clamp(0.04 + Number(stats.fortune || 0) / 1600 + Number(stats.eff?.searchRarePct || 0) / 100, 0.04, 0.28);
    const findings = [];
    const resources = {};
    for (let roll = 0; roll < status.rolls; roll++) {
      if (Math.random() > discoveryChance) { findings.push({ type: "miss" }); continue; }
      const resultRoll = Math.random();
      if (resultRoll < rareChance) {
        findings.push({ type: "rare", label: "Một hộp ngọc bị vùi dưới lớp đất cũ" });
      } else if (resultRoll < rareChance + 0.2) {
        findings.push({ type: "information", label: site.chainStage > 0 ? "Dấu vết cũ tiếp tục dẫn sâu vào khu vực" : "Một chuỗi dấu vết lạ dưới mặt đất" });
      } else {
        const itemId = loc.searchable[rnd(0, loc.searchable.length - 1)];
        const qty = 1 + (Math.random() < Math.min(0.5, Number(stats.fortune || 0) / 700) ? 1 : 0);
        resources[itemId] = Number(resources[itemId] || 0) + Math.max(1, Math.round(qty * worldSearchMult));
      }
    }
    // Mỗi phiên tìm kiếm thành công luôn có một lượng Linh Thạch nền để người chơi
    // duy trì vòng lặp mua sắm; các tài nguyên/rare roll vẫn cộng thêm như cũ.
    const guaranteedLinhThach = 2 + (Math.random() < Math.min(0.45, Number(stats.fortune || 0) / 600) ? 1 : 0);
    resources.linh_thach = Number(resources.linh_thach || 0) + Math.max(1, Math.round(guaranteedLinhThach * worldSearchMult));
    Object.entries(resources).forEach(([itemId, qty]) => findings.push({ type: "resource", itemId, qty, label: (D().ITEMS[itemId]?.name || itemId) + " ×" + qty }));
    const depthCost = status.depth >= 2 ? 2 : 1;
    site.depth = Math.max(0, Number(site.depth || 0) - depthCost);
    site.sessions = Number(site.sessions || 0) + 1;
    site.lastSearchedTurn = Number(state.meta.turn || 0);
    if (site.depth <= 0) site.recoverAtTurn = Number(state.meta.turn || 0) + 8;
    const encounter = Math.random() < searchRisk(state, loc, stats);
    if (encounter) {
      const enemyPool = (loc.enemies || []).filter((id) => getEntity(id));
      const enemyId = enemyPool.length ? enemyPool[rnd(0, enemyPool.length - 1)] : "yeu_thu";
      if (spawnCombatEntity(state, enemyId)) findings.push({ type: "encounter", enemyId, label: (combatEntity(state, enemyId)?.name || "Yêu thú") + " đã phát hiện ngươi" });
    }
    const actionable = findings.filter((finding) => ["resource", "rare", "information"].includes(finding.type));
    state.pendingSearch = actionable.length ? { locationId: state.locationId, session: sessionNumber, findings: actionable, createdAtTurn: state.meta.turn } : null;
    const lines = findings.length ? findings.map((finding) => {
      if (finding.type === "resource") return "✓ " + finding.label;
      if (finding.type === "rare") return "✨ " + finding.label;
      if (finding.type === "information") return "? " + finding.label;
      if (finding.type === "encounter") return "⚠ " + finding.label;
      return "× Không phát hiện gì ở một lượt dò tìm";
    }) : ["× Không phát hiện thêm tài nguyên."];
    pushHistory(state, { type: encounter ? "warn" : "sys", text: "§ Phiên tìm kiếm " + sessionNumber + " tại " + loc.name + " (" + status.rolls + " lượt dò, Thể Lực -" + staminaCost + "):\n" + lines.join("\n") + "\nSearch Depth còn " + site.depth + "/" + site.maxDepth + "." });
    if (encounter) pushHistory(state, { type: "warn", text: "§ Giao chiến bắt đầu vì tiếng động trong lúc tìm kiếm." });
    updateDerived(state);
    checkAllQuests(state);
    return { success: true, findings, encounter, depth: site.depth, rolls: status.rolls };
  }
  function collectSearchFindings(state) {
    const pending = state.pendingSearch;
    if (!pending || pending.locationId !== state.locationId) return { success: false, reason: "Không có tài nguyên chờ thu thập." };
    const collected = [];
    pending.findings.filter((finding) => finding.type === "resource").forEach((finding) => {
      if (addItem(state, finding.itemId, finding.qty)) {
        collected.push((D().ITEMS[finding.itemId]?.name || finding.itemId) + " ×" + finding.qty);
        if (state.locationId === "truyen_phap" && finding.itemId === "co_tich_tan_trang") state.flags.foundTich = true;
      }
    });
    pending.findings.filter((finding) => finding.type === "rare").forEach(() => {
      const generated = createLootItem(state, Math.random() < 0.7 ? "consumable" : null);
      if (generated) collected.push(generated.name);
    });
    pending.findings = pending.findings.filter((finding) => finding.type === "information");
    if (!pending.findings.length) state.pendingSearch = null;
    if (state.locationId === "linh_dien" && collected.length) state.flags.searchedLinhDien = true;
    pushHistory(state, { type: "sys", text: collected.length ? "§ Thu thập hoàn tất: " + collected.join(" · ") + "." : "Không có tài nguyên hữu hình để thu thập." });
    checkQuestObjectives(state, "thu_linh_thao");
    checkQuestObjectives(state, "co_tich");
    updateDerived(state);
    return { success: true, collected };
  }
  function investigateSearchFinding(state) {
    const pending = state.pendingSearch;
    if (!pending || pending.locationId !== state.locationId || !pending.findings.some((finding) => finding.type === "information")) return { success: false, reason: "Không có dấu vết để điều tra." };
    const site = ensureSearchSite(state);
    site.chainStage = Math.min(3, Number(site.chainStage || 0) + 1);
    pending.findings = pending.findings.filter((finding) => finding.type !== "information");
    if (!pending.findings.length) state.pendingSearch = null;
    const beats = [
      "Dấu chân không thuộc người sống dẫn về phía một vách đá rỗng.",
      "Sau vách đá là dấu tích một động phủ đã bị cố tình xóa tên.",
      "Một mảnh ngọc giản hé lộ tuyến đường của tu sĩ mất tích; một Cơ Duyên mới đã mở."
    ];
    const text = beats[site.chainStage - 1];
    pushMemory(state, text);
    pushHistory(state, { type: "narr", text: "§ Điều tra dấu vết " + site.chainStage + "/3: " + text });
    let questId = null;
    if (site.chainStage === 2 && !site.secretLocationId) {
      const exits = locationExits(state);
      const secretDirection = Object.keys(OPEN_WORLD_DELTAS).find((direction) => !exits[direction]);
      if (secretDirection) {
        const secretId = openWorldTarget(state, secretDirection);
        const secret = D().LOCATIONS[secretId];
        if (secret?.openWorld) {
          secret.name = "Động Phủ Bị Xóa Tên · " + secret.x + "," + secret.y;
          secret.desc = "Một động phủ bị cạo sạch môn huy và tên chủ nhân. Những vết khắc còn sót lại khớp với dấu chân ngươi vừa lần theo.";
        }
        site.secretLocationId = secretId;
        site.secretDirection = secretDirection;
        pushHistory(state, { type: "sys", text: "✦ Mở khu vực bí mật: " + (secret?.name || secretId) + " về hướng " + ({ bac: "Bắc", nam: "Nam", dong: "Đông", tay: "Tây" }[secretDirection] || secretDirection) + "." });
      }
    }
    if (site.chainStage >= 3) {
      questId = ensureSearchChainQuest(state, state.locationId, Number(state.flags.searches?.[state.locationId] || 0) + 1);
      pushHistory(state, { type: "sys", text: "✦ Mở nhiệm vụ: " + D().QUESTS[questId].title + "." });
    }
    return { success: true, chainStage: site.chainStage, questId };
  }
  function leaveSearchSession(state) {
    if (!state.pendingSearch) return { success: false, reason: "Không có phiên tìm kiếm đang chờ." };
    state.pendingSearch = null;
    pushHistory(state, { type: "sys", text: "Ngươi rời các phát hiện lại phía sau và kết thúc phiên tìm kiếm." });
    return { success: true };
  }

  /* ---------- Use item ---------- */
  function useItem(state, name) {
    const itemId = Object.keys(state.inventory).find((id) => {
      const it = D().ITEMS[id];
      return it && it.name.toLowerCase().includes(name.toLowerCase());
    });
    if (!itemId) {
      pushHistory(state, { type: "warn", text: "× Ngươi không có vật phẩm nào tên như vậy." });
      return;
    }
    const it = D().ITEMS[itemId];
    if (equipmentCategory(it)) {
      const equipped = equipItem(state, itemId);
      if (equipped !== true) {
        pushHistory(state, { type: "warn", text: "× " + equipped });
        return;
      }
      pushHistory(state, { type: "sys", text: "§ Đã trang bị " + it.name + "." });
      return;
    }
    if (it.kind === "currency") {
      pushHistory(state, { type: "sys", text: "Đó là vật phẩm quy đổi, không thể dùng trực tiếp." });
      return;
    }
    if (it.kind === "key") {
      pushHistory(state, { type: "sys", text: it.name + " là vật phẩm nhiệm vụ, không thể dùng trực tiếp." });
      return;
    }
    if (it.realmCatalyst && cultivationTier(state) === 1) {
      enterLuyenKhi(state, "dùng " + it.name);
    }
    if (it.exp > 0) gainExp(state, it.exp);
    if (it.exp < 0) state.player.exp = Math.max(0, state.player.exp + it.exp);
    if (it.heal) {
      const heal = Math.round(state.player.maxHp * it.heal);
      state.player.hp = clamp(state.player.hp + heal, 0, state.player.maxHp);
      state.player.qi = clamp(state.player.qi + Math.round(state.player.maxQi * 0.3), 0, state.player.maxQi);
    }
    if (it.san > 0) restoreSan(state, it.san);
    if (it.san < 0) drainSan(state, Math.abs(it.san), "vật phẩm nguyền rủa");
    if (it.sanShield) state.flags.sanShield = true;
    if (it.lifespanBonus || /Diên Thọ Đan/i.test(it.name || "")) {
      state.player.lifespanPillsByRealm = state.player.lifespanPillsByRealm || {};
      const realmKey = state.player.realmId || "di_menh";
      const used = Number(state.player.lifespanPillsByRealm[realmKey] || 0);
      const efficiency = Math.max(0.5, 1 - used * 0.1);
      const gradeBonus = { "Hạ Phẩm": 50, "Trung Phẩm": 150, "Thượng Phẩm": 500 };
      const rawBonus = Number(it.lifespanBonus || gradeBonus[it.grade] || 0);
      const gain = Math.max(1, Math.round(rawBonus * efficiency));
      state.player.lifespanConsumableBonus = Math.max(0, Number(state.player.lifespanConsumableBonus || 0)) + gain;
      state.player.lifespan = Number(state.player.lifespan || 0) + gain;
      state.player.lifespanPillsByRealm[realmKey] = used + 1;
      pushHistory(state, { type: "sys", text: "Diên Thọ Đan · " + (it.grade || "phẩm trật hiện tại") + " kéo dài " + gain + " năm Thọ Nguyên (hiệu suất " + Math.round(efficiency * 100) + "%)." });
    }
    removeItem(state, itemId, 1);
    pushHistory(state, { type: "sys", text: "§ Ngươi dùng " + it.name + "." });
    updateDerived(state);
  }

  /* ---------- Talk ---------- */
  /* ---------- NPC / Monster entity system ---------- */
  function entityCatalog() { return (typeof window !== "undefined" && window.NPC_MONSTER_DATA?.entities) || {}; }
  function getEntity(id) { return entityCatalog()[id] || D().NPCS[id] || D().ENEMIES[id] || null; }
  function entityForPlayer(state, entityId) {
    const entity = getEntity(entityId);
    if (!entity || entity.god_domain || entity.server_wide) return entity;
    const index = Math.max(0, realmIndex(state));
    const factor = 1 + Math.min(8, index) * 0.18;
    return { ...entity, realm: state.player.realmId, level_tier: Math.min(8, 1 + Math.floor(index / 4)),
      stats: entity.stats ? { ...entity.stats, PHY: Math.round((entity.stats.PHY || 0) * factor), MAG: Math.round((entity.stats.MAG || 0) * factor), HP: Math.round((entity.stats.HP || 0) * factor) } : entity.stats };
  }
  function dialogueState(state, entityId) {
    state.dialogueStates = state.dialogueStates || {};
    return state.dialogueStates[entityId] || "IDLE_GREET";
  }
  function regionOfLocation(state) {
    return D().WORLD_MAP?.locations?.[state.locationId]?.region || D().LOCATIONS?.[state.locationId]?.region || null;
  }
  function presentEntities(state) {
    const regionId = regionOfLocation(state);
    const entities = [];
    Object.keys(entityCatalog()).forEach((id) => {
      const entity = getEntity(id);
      if (!entity || entity.entity_type === "monster" || entity.entity_type === "boss" || entity.server_wide || entity.god_domain) return;
      // Dị Sĩ có appearance_weight là biến cố ngẫu nhiên, không phải NPC thường trú trên taskbar.
      if (entity.interaction_type && Number(entity.appearance_weight || 0) > 0) return;
      if (entity.requires_lifespan_zero && state.player.lifespan > 0) return;
      if (entity.location_tags?.length && regionId && !entity.location_tags.includes(regionId)) return;
      entities.push({ id, ...entity });
    });
    return entities;
  }
  function maybeTriggerRandomEncounter(state) {
    const regionId = regionOfLocation(state);
    const worldTravel = typeof window !== "undefined" && window.GameExpansion?.getWorldModifiers
      ? window.GameExpansion.getWorldModifiers(state, { activity: "travel", regionId })
      : { encounterChanceMult: 1, travelRiskDelta: 0 };
    const candidates = Object.keys(entityCatalog()).map((id) => ({ id, ...getEntity(id) })).filter((entity) =>
      entity.interaction_type && Number(entity.appearance_weight || 0) > 0 &&
      (!entity.location_tags?.length || entity.location_tags.includes(regionId)) &&
      !(entity.disappear_after_interaction && state.flags["met_" + entity.id])
    );
    for (const entity of candidates) {
      if (Math.random() < Number(entity.appearance_weight) * Number(worldTravel.encounterChanceMult || 1)) {
        pushHistory(state, { type: "narr", text: "Một dị tượng chợt hiện — " + entity.name + " bước ra từ màn linh vụ." });
        interactEntity(state, entity.id);
        return entity.id;
      }
    }
    // Biến cố bản đồ là cơ hội ngẫu nhiên, tăng theo độ nguy hiểm; không ép mỗi lượt.
    const loc = D().LOCATIONS[state.locationId];
    const eventChance = clamp((0.18 + Number(loc?.dangerLevel || loc?.corruption || 1) * 0.08 + Number(worldTravel.travelRiskDelta || 0)) * Number(worldTravel.encounterChanceMult || 1), 0.05, 0.9);
    if (Math.random() > eventChance) return null;
    state.flags.mapEventCount = Number(state.flags.mapEventCount || 0) + 1;
    if (loc?.enemies?.length && !aliveEnemies(state).length && Math.random() < Math.min(0.78, 0.28 + Number(loc.dangerLevel || loc.corruption || 1) * 0.1)) {
      pushHistory(state, { type: "warn", text: "⚠ Biến cố bản đồ: thú săn trong vùng đã ngửi thấy linh tức của ngươi." });
      beginCombat(state);
      return "regional_predator";
    }
    const eventRoll = Math.random();
    if (eventRoll < 0.34) {
      const amount = 1 + Math.max(0, Number(loc?.linhKhiDensity || 1) - 2);
      addItem(state, "linh_thach", amount);
      pushHistory(state, { type: "sys", text: "✦ Biến cố bản đồ: ngươi phát hiện một mạch Linh Thạch lộ thiên (" + amount + ")." });
      return "resource_cache";
    }
    if (eventRoll < 0.67) {
      const sanLoss = 1 + Math.max(0, Number(loc?.corruption || 1) - 1);
      drainSan(state, sanLoss, "dư âm dị biến trên tuyến đường");
      pushHistory(state, { type: "narr", text: "Một dấu chân không thuộc về bất cứ sinh linh nào in ngược trên mặt đất. Ngươi buộc phải đổi hướng." });
      return "omen";
    }
    if (Math.random() < 0.12) {
      const dominant = dominantFateGrade(state);
      const fate = rollFateByProgression(state, { level: cultivationTier(state), gradeCap: Math.min(8, dominant.rank + 1) });
      const fateResult = fate ? receiveFate(state, fate.id, { source: "manh mối bản đồ", allowPending: true }) : null;
      if (fate && (fateResult?.added || fateResult?.pending)) {
        grantMerit(state, 1, "giải mã điềm mệnh trên bản đồ");
        pushHistory(state, { type: "sys", text: "◇ Manh mối hé lộ một Mệnh Số: " + fate.name + (fateResult.pending ? " đang chờ xử lý vì Mệnh Kho đầy." : " đã rơi vào Mệnh Kho.") });
        return "fate_clue";
      }
    }
    pushHistory(state, { type: "sys", text: "◇ Biến cố bản đồ: một luồng khí lạ đánh dấu node này; lần khám phá tiếp theo sẽ có dấu vết sâu hơn." });
    return "map_clue";
  }
  function findEntityByName(name) {
    const norm = normalizedText(name);
    const all = { ...entityCatalog(), ...D().NPCS };
    const id = Object.keys(all).find((id) => {
      const e = all[id];
      return e && normalizedText(e.name).includes(norm);
    });
    return id ? { id, ...all[id] } : null;
  }
  function interactEntity(state, entityId, choice) {
    const entity = entityForPlayer(state, entityId);
    if (!entity) return false;
    if (entity.reincarnation_envoy) {
      if (state.player.lifespan > 0) { pushHistory(state, { type: "warn", text: "Luân Hồi Sứ Giả chỉ xuất hiện khi Thọ Nguyên đã tận." }); return false; }
      state.flags.reincarnationOffered = true; pushHistory(state, { type: "sys", text: "Luân Hồi Sứ Giả mở cánh cửa chuyển sinh." }); return true;
    }
    if (entity.min_realm && cultivationTier(state) < Number(realmById(entity.min_realm).level || 1)) {
      pushHistory(state, { type: "warn", text: "Cảnh giới chưa đủ để chạm tới thực thể này." }); return false;
    }
    if (entity.black_market) { state.flags.blackMarketOpen = true; refreshBlackMarket(state); pushHistory(state, { type: "sys", text: "Nghịch Thương Nhân làm mới chợ đen: hàng hóa Mệnh Số cấp 2-8." }); return true; }
    if (entity.interaction_type) {
      const roll = Math.random() * 100;
      if (roll < 65) { state.player.baseFortune += 10; pushHistory(state, { type: "sys", text: "Dị Sĩ ban một cơ duyên, Khí Vận +10." }); }
      else if (roll < 90) { drainSan(state, 8, "thí luyện của " + entity.name); }
      else pushHistory(state, { type: "sys", text: "Dị Sĩ chỉ để lại một mẩu lore khó hiểu." });
      state.dialogueStates[entityId] = "GENERIC_CHAT"; state.flags["met_" + entityId] = true; return true;
    }
    state.dialogueStates[entityId] = choice === "quest" ? "QUEST_OFFER" : "GENERIC_CHAT";
    return true;
  }
  function lootTable(id) {
    return (typeof window !== "undefined" && window.NPC_MONSTER_DATA?.lootTables?.[id]) || null;
  }

  function combatEntity(state, entityId) {
    const legacy = D().ENEMIES[entityId];
    const entity = entityForPlayer(state, entityId);
    if (!entity) return null;
    const stats = entity.stats || {};
    const hpMax = Number(stats.HP) > 0 ? Number(stats.HP) : Number(entity.hp || 0);
    return {
      id: entityId,
      name: entity.name,
      portrait: entity.portrait || legacy?.portrait,
      hpMax,
      phy: Number(stats.PHY) > 0 ? Number(stats.PHY) : Number(entity.diff || 10),
      mag: Number(stats.MAG || 0),
      sanHit: Number(stats.SAN_influence) || Number(entity.sanHit || 0),
      diff: Number(entity.diff) || Math.max(1, Math.round((Number(stats.PHY || 10)) / 4)),
      family: entity.family || legacy?.family || "thuong",
      exp: Number(entity.exp || 0) || Math.max(1, Math.round((Number(stats.PHY || 0) + Number(stats.MAG || 0)) * 4 + Number(stats.HP || 0) / 20)),
      loot: Array.isArray(entity.loot) ? entity.loot : [],
      lootTableId: entity.loot_table_id || null,
      entity
    };
  }

  function rollEntityLoot(state, info) {
    const drops = [];
    if (info.loot.length) drops.push(...info.loot);
    const table = info.lootTableId ? lootTable(info.lootTableId) : null;
    if (table) {
      table.forEach((entry) => {
        if (!entry.item) return;
        if (Math.random() < Number(entry.chance || 0)) drops.push(...Array(entry.quantity || 1).fill(entry.item));
      });
    }
    drops.forEach((itemId) => addItem(state, itemId, 1));
    return drops;
  }

  function rollDefeatBonus(state, info) {
    const roll = Math.random() * 100;
    let text = null;
    if (roll < 30) {
      const amount = rnd(1, 3);
      addItem(state, "linh_thach", amount);
      text = "Linh Thạch ×" + amount;
    } else if (roll < 60) {
      const bonus = Math.max(1, Math.round(info.exp * rnd(2, 5) / 10));
      gainExp(state, bonus);
      text = "Tu vi cộng thêm +" + bonus;
    } else if (roll < 85) {
      const generated = createLootItem(state, Math.random() < 0.5 ? "weapon" : "consumable");
      if (generated) text = generated.name;
    } else {
      const heal = Math.round(state.player.maxHp * rnd(5, 15) / 100);
      state.player.hp = clamp(state.player.hp + heal, 0, state.player.maxHp);
      state.player.qi = clamp(state.player.qi + Math.round(state.player.maxQi * rnd(5, 15) / 100), 0, state.player.maxQi);
      text = "Khí Huyết/Linh Khí hồi phục";
    }
    return text;
  }

  function spawnCombatEntity(state, entityId) {
    const info = combatEntity(state, entityId);
    if (!info || info.hpMax <= 0) return false;
    state.enemies = state.enemies || {};
    state.enemies[entityId] = info.hpMax;
    return true;
  }

  function monsterAction(state, entityId) {
    const info = combatEntity(state, entityId);
    if (!info) return null;
    const hp = state.enemies?.[entityId] ?? info.hpMax;
    const hpRatio = Number(hp) / Math.max(1, info.hpMax);
    const action = hpRatio <= 0.25 ? "desperation" : hpRatio <= 0.6 ? "special" : "basic";
    const base = info.phy || 10;
    const damage = Math.max(1, Math.round(base * (action === "special" ? 1.4 : 1)));
    if (info.sanHit) drainSan(state, info.sanHit, info.name);
    state.player.hp = clamp(state.player.hp - damage, 0, state.player.maxHp);
    pushHistory(state, { type: "warn", text: info.name + " dùng đòn " + action + ", HP -" + damage + ".", portrait: info.portrait });
    return action;
  }

  function beginCombat(state) {
    const loc = D().LOCATIONS[state.locationId];
    const ids = (loc?.enemies || []).filter((id) => getEntity(id));
    if (!ids.length) {
      pushHistory(state, { type: "sys", text: "Không có kẻ thù ở đây." });
      return false;
    }
    if (Object.keys(state.enemies || {}).length) return true;
    state.enemies = {};
    ids.forEach((id) => { const info = combatEntity(state, id); if (info) state.enemies[id] = info.hpMax; });
    maybeSpawnCombatExtras(state);
    const names = Object.keys(state.enemies).map((id) => (combatEntity(state, id) || {}).name).filter(Boolean);
    pushHistory(state, { type: "warn", text: "§ Giao chiến bắt đầu! Đối thủ: " + names.join(", ") + "." });
    return true;
  }

  function maybeSpawnCombatExtras(state) {
    if (state.guildPursuit && !state.enemies.ho_dao_gia && Math.random() < 0.35) {
      if (spawnCombatEntity(state, "ho_dao_gia")) {
        pushHistory(state, { type: "warn", text: "Hộ Đạo Giả của " + state.guildPursuit.guildName + " lần theo truy sát lệnh mà tới!" });
      }
    }
    const status = factionStatus(state);
    const pursuers = Array.isArray(status.pursuers) ? status.pursuers.filter((id) => getEntity(id) && !state.enemies[id]) : [];
    if (status.faction && pursuers.length && Math.random() < status.pursuitRate) {
      const pursuerId = pursuers[rnd(0, pursuers.length - 1)];
      if (spawnCombatEntity(state, pursuerId)) {
        pushHistory(state, { type: "warn", text: "Một " + (combatEntity(state, pursuerId)?.name || "kẻ truy sát") + " xuất hiện để săn đuổi ngươi!" });
      }
    }
    const forbidden = ["cam_dia", "co_mieu", "abyss", "u_minh_khoi_diem"];
    if (forbidden.includes(state.locationId) && !state.enemies["ho_phap_huyen_lan"]) {
      if (spawnCombatEntity(state, "ho_phap_huyen_lan")) {
        pushHistory(state, { type: "warn", text: "Hộ Pháp Huyền Lân gầm lên, chặn đường ngươi." });
      }
    }
    const loc = D().LOCATIONS[state.locationId];
    if (loc?.enemies?.length && !aliveEnemies(state).length && Math.random() < Math.min(0.35, 0.08 + Number(loc.dangerLevel || 1) * 0.04)) {
      const predator = loc.enemies.find((id) => getEntity(id));
      if (predator && spawnCombatEntity(state, predator)) {
        pushHistory(state, { type: "warn", text: "☠ Quái vật địa phương chủ động rời ổ, khóa đường lui của ngươi." });
      }
    }
  }

  function aliveEnemies(state) {
    return Object.entries(state.enemies || {}).filter(([, hp]) => Number(hp) > 0);
  }

  function firstAliveEnemy(state) {
    const entry = aliveEnemies(state)[0];
    if (!entry) return null;
    const info = combatEntity(state, entry[0]);
    return info ? [entry[0], info] : null;
  }

  function applyPlayerDamage(state, enemyId, damage) {
    const info = combatEntity(state, enemyId);
    if (!info) return;
    state.enemies[enemyId] = (state.enemies[enemyId] ?? info.hpMax) - damage;
    if (state.enemies[enemyId] > 0) return;
    delete state.enemies[enemyId];
    gainExp(state, info.exp);
    rollEntityLoot(state, info);
    if (info.entity?.guardian || info.entity?.nemesis) resolveFactionHunt(state, enemyId);
    const bonus = rollDefeatBonus(state, info);
    const elite = Boolean(info.entity?.guardian || info.entity?.nemesis || Number(info.exp || 0) >= 100);
    const fateChance = elite ? 0.25 : 0.06;
    if (Math.random() < fateChance) {
      const dominant = dominantFateGrade(state);
      const fate = rollFateByProgression(state, { level: cultivationTier(state), gradeCap: Math.min(8, dominant.rank + (elite ? 1 : 0)) });
      if (fate) {
        const received = receiveFate(state, fate.id, { source: (elite ? "tinh anh/boss " : "chiến lợi phẩm ") + info.name, allowPending: true });
        pushHistory(state, { type: received.added ? "sys" : "warn", text: "◇ Chiến lợi phẩm Mệnh Số: " + fate.name + (received.pending ? " đang chờ xử lý." : " đã vào Mệnh Kho.") });
      }
    }
    pushHistory(state, { type: "sys", text: "§ Hạ gục " + info.name + "! Tu vi +" + info.exp + ".", portrait: info.portrait });
    if (bonus) pushHistory(state, { type: "sys", text: "§ Thưởng ngẫu nhiên: " + bonus + "." });
    if (enemyId === "ta_than_phan_than") state.flags.cleansedMieu = true;
    checkQuestObjectives(state, "cursed");
    if (Object.keys(state.enemies || {}).length === 0) endCombat(state);
  }

  function enemyTurn(state) {
    const alive = aliveEnemies(state);
    for (const [enemyId] of alive) {
      if (state.pendingEnding) break;
      monsterAction(state, enemyId);
    }
    if (!state.pendingEnding && state.player.hp <= 0) state.pendingEnding = "succumb";
  }

  function afterPlayerCombatAction(state) {
    if (Object.keys(state.enemies || {}).length === 0) { updateDerived(state); return; }
    enemyTurn(state);
    updateDerived(state);
  }

  function endCombat(state) {
    state.enemies = {};
    const loc = D().LOCATIONS[state.locationId];
    if (loc?.enemies?.length) {
      state.flags.clearedLocations = state.flags.clearedLocations || {};
      state.flags.clearedLocations[state.locationId] = true;
    }
    pushHistory(state, { type: "sys", text: "§ Chiến thắng! Toàn bộ kẻ thù đã bị hạ." });
    updateDerived(state);
  }
  function talk(state, name) {
    const found = findEntityByName(name);
    if (!found) {
      pushHistory(state, { type: "warn", text: "× Không có nhân vật nào như vậy." });
      return;
    }
    const entityId = found.id;
    const special = entityCatalog()[entityId];
    if (special) {
      if (special.interaction_type && Number(special.appearance_weight || 0) > 0) {
        pushHistory(state, { type: "warn", text: "× " + found.name + " là Dị Sĩ ngẫu nhiên; chỉ hệ thống mới có thể kích hoạt cuộc gặp." });
        return;
      }
      const loc = D().LOCATIONS[state.locationId];
      const regionId = regionOfLocation(state);
      const isRegionMatch = !special.location_tags?.length || (regionId && special.location_tags.includes(regionId));
      const present = loc && (loc.npcs?.includes(entityId) || isRegionMatch);
      if (!present) {
        pushHistory(state, { type: "warn", text: "× " + found.name + " không có ở đây." });
        return;
      }
      if (interactEntity(state, entityId)) updateDerived(state);
      return;
    }
    const npc = D().NPCS[entityId];
    const loc = D().LOCATIONS[state.locationId];
    const present = loc && loc.npcs && loc.npcs.includes(entityId);
    if (!present) {
      pushHistory(state, { type: "warn", text: "× " + npc.name + " không có ở đây." });
      return;
    }
    let text = npc.dialogue.default;
    if (state._fateState !== "NORMAL_GROWTH" && npc.dialogue.corruption) text = npc.dialogue.corruption;
    if (npc.dialogue.clue) text += "\n" + npc.dialogue.clue;
    text = weaveAtmosphere(state, text, "talk:" + entityId);
    pushHistory(state, { type: "sys", text: "§ " + npc.name + " nói: \"" + text + "\"", portrait: npc.portrait });
    if (entityId === "su_phu") state.flags.metSuPhu = true;
    if (!state.relationships[entityId]) state.relationships[entityId] = { trust: 5, fear: 0, respect: 0, suspicion: 0, interactionCount: 0 };
    const relation = state.relationships[entityId];
    relation.interactionCount = Number(relation.interactionCount || 0) + 1;
    relation.trust = clamp(Number(relation.trust || 0) + 3, 0, 100);
    relation.respect = clamp(Number(relation.respect || 0) + 1, 0, 100);
    if (relation.trust >= 20 || relation.respect >= 15) pushHistory(state, { type: "sys", text: "◇ Quan hệ với " + npc.name + " đã đủ nền tảng để cân nhắc Neo Nhân Tính." });
    checkQuestObjectives(state, "nhan_mon");
    updateDerived(state);
  }

  /* ---------- Combat (turn-based) ---------- */
  function combat(state) {
    if (!beginCombat(state)) return;
    const stats = computeStats(state.player);
    const eff = stats.eff;
    const first = firstAliveEnemy(state);
    if (!first) return;
    const [enemyId, enemy] = first;
    const difficulty = enemy.diff * (state._fateState === "FATE_BACKFIRE" ? 1.2 : 1);
    const attack = skillCheck(stats.phy, Math.round(difficulty * 0.8));
    let dmg = Math.max(1, Math.round((stats.phy * 0.8 + attack.roll) * (eff.lightFireMult > 1 ? 1.2 : 1) * (1 + Number(eff.combatDamagePct || 0) / 100)));
    if (!attack.success) dmg = Math.max(0, Math.round(dmg * 0.5));
    pushHistory(state, { type: "sys", text: "Ngươi tấn công " + enemy.name + " gây " + dmg + " sát thương.", portrait: enemy.portrait });
    applyPlayerDamage(state, enemyId, dmg);
    afterPlayerCombatAction(state);
  }

  /* ---------- Memory ---------- */
  function pushMemory(state, text) {
    state.memory.shortTerm.push({ turn: state.meta.turn, summary: text });
    if (state.memory.shortTerm.length > 10) state.memory.shortTerm.shift();
    if (!state.memory.longTerm.includes(text)) state.memory.longTerm.push(text);
    if (state.memory.longTerm.length > 30) state.memory.longTerm.shift();
  }
  const GAME_TIME_CONFIG = Object.freeze({ version: 3, realSecondsPerGameDay: 30, gameDaysPerMonth: 30, monthsPerYear: 12, gameDaysPerYear: 360, onlineFateIntervalDays: 30 });
  function gameDayIndex(clock) {
    return (Number(clock.currentYear) - 1) * GAME_TIME_CONFIG.gameDaysPerYear + (Number(clock.currentMonth) - 1) * GAME_TIME_CONFIG.gameDaysPerMonth + Number(clock.currentDay);
  }
  function ensureGameClock(state) {
    state.gameClock = state.gameClock || {};
    const clock = state.gameClock;
    if (!Number.isFinite(Number(clock.currentYear))) clock.currentYear = 1;
    if (!Number.isFinite(Number(clock.currentMonth))) clock.currentMonth = 1;
    if (!Number.isFinite(Number(clock.currentDay))) clock.currentDay = 1;
    if (!Number.isFinite(Number(clock.dayProgress))) clock.dayProgress = 0;
    if (!Number.isFinite(Number(clock.realTimeToGameTimeRatio))) clock.realTimeToGameTimeRatio = 1 / GAME_TIME_CONFIG.realSecondsPerGameDay;
    if (!Number.isFinite(Number(clock.timeScaleVersion))) clock.timeScaleVersion = 1;
    if (Number(clock.timeScaleVersion) < GAME_TIME_CONFIG.version) {
      // Các save cũ dùng tỷ lệ mặc định 60 hoặc 120 giây/ngày; chuyển sang chuẩn 30 giây/ngày.
      const ratio = Number(clock.realTimeToGameTimeRatio);
      if (Math.abs(ratio - 1 / 60) < 0.000001 || Math.abs(ratio - 1 / 120) < 0.000001) {
        clock.realTimeToGameTimeRatio = 1 / GAME_TIME_CONFIG.realSecondsPerGameDay;
      }
      clock.timeScaleVersion = GAME_TIME_CONFIG.version;
    }
    if (!clock.currentEra) clock.currentEra = "Kỷ Nguyên Linh Khí Dị Biến";
    if (!Number.isFinite(Number(clock.eraIndex))) clock.eraIndex = 1;
    const dayIndex = gameDayIndex(clock);
    if (!Number.isFinite(Number(clock.nextOnlineFateDay))) clock.nextOnlineFateDay = dayIndex + GAME_TIME_CONFIG.onlineFateIntervalDays;
    return clock;
  }
  function processOnlineFateReward(state) {
    const clock = ensureGameClock(state);
    const dayIndex = gameDayIndex(clock);
    if (dayIndex < Number(clock.nextOnlineFateDay || 0)) return null;
    const dominant = dominantFateGrade(state); const maxRank = Math.min(8, Number(dominant.rank || 1) + 1);
    const fate = rollFateByProgression(state, { source: "online", level: cultivationTier(state), gradeCap: maxRank });
    clock.nextOnlineFateDay = dayIndex + GAME_TIME_CONFIG.onlineFateIntervalDays;
    if (!fate) return null;
    const received = receiveFate(state, fate.id, { source: "cơ duyên online · ngày " + dayIndex, allowPending: true });
    const destination = received.pending ? "đang chờ xử lý vì Mệnh Kho đầy" : "đã vào Mệnh Kho";
    pushHistory(state, { type: received.pending ? "warn" : "sys", text: "◇ Cơ duyên online: nhận được Mệnh Số " + fate.name + " · " + destination + "." });
    state.pendingRewardSummaries = Array.isArray(state.pendingRewardSummaries) ? state.pendingRewardSummaries : [];
    state.pendingRewardSummaries.push({ type: "Mệnh Số", value: fate.name + " · " + (fate.gradeLabel || fate.grade) + " · " + destination });
    return { fate, received, dayIndex, nextOnlineFateDay: clock.nextOnlineFateDay };
  }
  function clockLabel(state) {
    const c = ensureGameClock(state);
    return "Năm " + c.currentYear + ", Tháng " + c.currentMonth + " ngày " + c.currentDay + " · " + c.currentEra;
  }
  function onGameYearPass(state) {
    const p = state.player;
    if (!p) return;
    p.currentAge = Number(p.currentAge || 0) + 1;
    p.lifespan = Math.max(0, Number(p.lifespan || 0) - 1);
    const max = Number(p.maxLifespan || computeLifespan(p));
    if (p.lifespan <= Math.max(1, Math.ceil(max * 0.1))) {
      pushHistory(state, { type: "warn", text: "⚠ Thọ Nguyên sắp cạn: chỉ còn " + p.lifespan + " năm." });
    }
    if (p.lifespan <= 0) processLuanHoi(state);
  }
  function advanceGameTime(state, gameDays = 1) {
    const c = ensureGameClock(state);
    let days = Math.max(0, Number(gameDays) || 0);
    c.dayProgress += days;
    while (c.dayProgress >= 1) {
      c.dayProgress -= 1;
      c.currentDay += 1;
      if (c.currentDay > GAME_TIME_CONFIG.gameDaysPerMonth) {
        c.currentDay = 1; c.currentMonth += 1;
        if (c.currentMonth > GAME_TIME_CONFIG.monthsPerYear) {
          c.currentMonth = 1; c.currentYear += 1;
          onGameYearPass(state);
          if (c.currentYear % 500 === 0) {
            c.eraIndex += 1;
            c.currentEra = "Kỷ Nguyên " + c.eraIndex + " · Linh Khí Dị Biến";
            pushHistory(state, { type: "warn", text: weaveAtmosphere(state, "✦ Đại Kiếp chuyển thế: một Kỷ Nguyên mới bắt đầu. Những vì sao đã đổi vị trí.", "era:" + c.currentYear) });
          }
        }
      }
      // Tính sau khi chuẩn hóa ngày/tháng để reward luôn gắn đúng clock label đang hiển thị.
      processOnlineFateReward(state);
    }
    return c;
  }
  function pushHistory(state, entry) {
    if (state._suppressHistory) return;
    const normalized = { ...entry };
    if (typeof normalized.text === "string" && typeof window !== "undefined" && window.GameI18n?.formatHistory) {
      normalized.text = window.GameI18n.formatHistory(normalized.text, state);
    }
    state.history.push({ turn: state.meta.turn, clock: clockLabel(state), ...normalized });
    if (state.history.length > 200) state.history.shift();
  }

  /* ---------- Turn resolution ---------- */
  const ACTION_DEFINITIONS = [
    { id: "act_tu_luyen", label: "Tu Luyện", aliases: ["tu", "tu luyen", "tu luyện", "cultivate"], priority: 1 },
    { id: "act_tu_luyen_tu_dong", label: "Tự Động Tu Luyện ×5", aliases: ["tu luyen tu dong", "tu luyện tự động", "auto cultivate"], priority: 1 },
    { id: "act_be_quan", label: "Bế Quan Tu Luyện", aliases: ["be quan", "bế quan", "be quan tu luyen", "bế quan tu luyện", "afk"], priority: 1 },
    { id: "act_tan_cong_thuong", label: "Tấn Công Thường", aliases: ["a", "atk", "danh", "tan cong", "tấn công"], priority: 1 },
    { id: "act_nhin", label: "Quan Sát", aliases: ["nhin", "nhìn", "look"], priority: 1 },
    { id: "act_hanh_trang", label: "Hành Trang", aliases: ["inventory", "hanh trang", "hành trang"], priority: 1 },
    { id: "act_trang_thai", label: "Trạng Thái", aliases: ["trang thai", "trạng thái", "status"], priority: 1 },
    { id: "act_nhiem_vu", label: "Nhiệm Vụ", aliases: ["nhiem vu", "nhiệm vụ", "quest"], priority: 1 },
    { id: "act_menh", label: "Tử Vi Mệnh Số", aliases: ["menh", "mệnh", "fate", "tử vi"], priority: 1 },
    { id: "act_cong_phap", label: "Công Pháp", aliases: ["cong phap", "công pháp", "kỹ năng", "ky nang", "skills"], priority: 1 },
    { id: "act_ban_do", label: "Bản Đồ", aliases: ["ban do", "bản đồ", "map"], priority: 1 },
    { id: "act_ve_noi_an_toan", label: "Về Thành / Tông Môn", aliases: ["ve thanh", "về thành", "ve tong mon", "về tông môn", "tro ve noi an toan", "trở về nơi an toàn"], priority: 1 },
    { id: "act_to_chuc", label: "Tổ Chức", aliases: ["to chuc", "tổ chức", "guild", "môn phái", "mon phai"], priority: 1 },
    { id: "act_tim_tong_mon", label: "Tìm Tông Môn", aliases: ["tìm tông môn", "tim tong mon"], priority: 1 },
    { id: "act_giup", label: "Giúp", aliases: ["giup", "giúp", "help"], priority: 1 },
    { id: "act_tim_kiem", label: "Tìm Kiếm", aliases: ["tim kiem", "tìm kiếm", "tìm", "search"], priority: 1 },
    { id: "act_dot_pha", label: "Đột Phá", aliases: ["dot pha", "đột phá", "breakthrough"], priority: 1 },
    { id: "act_ritual_call_fate", label: "Nghi Thức · Gọi Mệnh", aliases: ["gọi mệnh", "goi menh"], priority: 1 },
    { id: "act_ritual_anchor", label: "Nghi Thức · Dựng Neo", aliases: ["dựng neo", "dung neo"], priority: 1 },
    { id: "act_ritual_compare", label: "Nghi Thức · Đối Chiếu", aliases: ["đối chiếu", "doi chieu"], priority: 1 },
    { id: "act_ritual_omen", label: "Nghi Thức · Vượt Dị Tượng", aliases: ["vượt dị tượng", "vuot di tuong"], priority: 1 },
    { id: "act_ritual_cost", label: "Nghi Thức · Trả Giá", aliases: ["trả giá", "tra gia"], priority: 1 },
    { id: "act_nghi_ngoi", label: "Nghỉ Ngơi", aliases: ["nghi ngoi", "nghỉ ngơi", "rest", "nghi", "ngủ"], priority: 1 },
    { id: "act_bo_chay", label: "Bỏ Chạy", aliases: ["run", "chay", "bỏ chạy", "flee"], priority: 0 },
    { id: "act_chon_ban_phuoc", label: "Chọn Ban Phước", aliases: ["ban phuoc", "ban phước", "chon ban phuoc", "chọn ban phước"], priority: 1 },
    { id: "act_chon_nghi_ky", label: "Chọn Nghi Kỵ", aliases: ["nghi ky", "nghi kỵ", "chon nghi ky", "chọn nghi kỵ"], priority: 1 },
    { id: "act_chon_ho_hung", label: "Chọn Hờ Hững", aliases: ["ho hung", "hờ hững", "chon ho hung", "chọn hờ hững"], priority: 1 }
  ];
  function moveActions(state) {
    const loc = D().LOCATIONS[state.locationId];
    const dirMap = { bac: "Bắc", nam: "Nam", dong: "Đông", tay: "Tây" };
    if (!loc?.exits) return [];
    // Only directions declared by the current location are available actions.
    // A declared null target is an unexplored open-world exit and remains valid.
    return Object.keys(locationExits(state)).filter((dir) => OPEN_WORLD_DELTAS[dir]).map((dir) => ({
      id: "act_move_" + dir,
      label: "Đi " + (dirMap[dir] || dir),
      aliases: ["đi " + dir, "di " + dir, dir, (dirMap[dir] || dir).toLowerCase()],
      priority: 1
    }));
  }
  function talkActions(state) {
    const loc = D().LOCATIONS[state.locationId];
    const actions = [];
    (loc?.npcs || []).forEach((npcId) => {
      const npc = D().NPCS[npcId];
      if (!npc) return;
      actions.push({ id: "act_talk_" + npcId, label: "Nói Chuyện " + npc.name, aliases: ["nói chuyện " + npc.name, "noi chuyen " + npc.name], priority: 1 });
    });
    presentEntities(state).forEach((entity) => {
      if (loc?.npcs?.includes(entity.id)) return;
      actions.push({ id: "act_talk_" + entity.id, label: "Gặp " + entity.name, aliases: ["gặp " + entity.name, "gap " + entity.name, "nói chuyện " + entity.name], priority: 1 });
    });
    return actions;
  }
  function skillActions(state) {
    return getKnownTechniques(state)
      .filter((t) => t.category === "chieu_thuc" || t.category === "cam_thuat" || t.category === "than_phap" || t.category === "phu_tro" || t.category === "tran_phap" || t.category === "guild_signature")
      .map((t) => {
        const preview = techniquePreview(state, t.id);
        return { id: "act_skill_" + t.id, label: "Dùng " + t.name, aliases: [t.name, t.id], priority: 1, requiresConfirmation: preview.requiresConfirmation, preview };
      });
  }
  function contextState(state) {
    const forced = ["ELDRITCH_INTERVENTION", "FATE_BACKFIRE"].includes(state._fateState);
    const inCombat = Object.keys(state.enemies || {}).length > 0;
    const loc = D().LOCATIONS[state.locationId];
    const nearbyEnemies = Boolean(loc?.enemies?.length && !state.flags.clearedLocations?.[state.locationId] && Number(state.flags.fledUntilTurn || 0) <= Number(state.meta?.turn || 0));
    const combatPossible = inCombat || nearbyEnemies;
    if (forced) return { inCombat, forced: true, state: state._fateState, actions: ACTION_DEFINITIONS.filter((a) => a.priority === 0) };
    if (state.player.tainted?.attentionPending) {
      return { inCombat: false, forced: true, state: "TAINTED_ATTENTION_CHOICE", actions: ACTION_DEFINITIONS.filter((action) => action.id.startsWith("act_chon_")) };
    }
    if (state.flags.originChoicePending) {
      return { inCombat: false, forced: true, state: "ORIGIN_CHOICE", actions: [] };
    }
    if (state.flags.pathChoicePending && !state.player.pathId) {
      const actions = availablePaths(state).map((pathId) => ({ id: "act_path_" + pathId, label: PATH_LABELS[pathId] || pathId, aliases: [pathId, PATH_LABELS[pathId] || pathId], priority: 1 }));
      return { inCombat: false, forced: true, state: "PATH_CHOICE", actions };
    }
    if (state.player.tainted?.factionPending) {
      const choices = [["rebel_heaven", "Phản Thiên — Tà Thần"], ["loyal_heaven", "Trung Thành Thiên Đạo"], ["neutral", "Trung Lập"]];
      return { inCombat: false, forced: true, state: "TAINTED_FACTION_CHOICE", actions: choices.map(([id, label]) => ({ id: "act_faction_" + id, label, aliases: [id, label], priority: 1 })) };
    }
    const actions = ACTION_DEFINITIONS.filter((a) => a.id !== "act_be_quan").filter((a) => !forced || a.priority === 0).filter((a) => {
      if (a.id.startsWith("act_chon_")) return false;
      if (a.id.startsWith("act_ritual_")) return false;
      if (a.id === "act_tu_luyen" || a.id === "act_tu_luyen_tu_dong") return !combatPossible;
      if (a.id === "act_nghi_ngoi") return !combatPossible;
      if (a.id === "act_tan_cong_thuong" || a.id === "act_bo_chay") return combatPossible;
      if (a.id === "act_nhin" || a.id === "act_hanh_trang") return true;
      if (a.id === "act_tim_kiem") {
        const status = searchStatus(state);
        return !combatPossible && status.searchable && !status.depleted && !state.pendingSearch;
      }
      if (a.id === "act_tim_tong_mon") return !combatPossible && cultivationTier(state) >= 2 && !state.guildMembership;
      if (a.id === "act_ve_noi_an_toan") return !combatPossible && Boolean(safeTravelDestination(state));
      if (a.id === "act_dot_pha") return !combatPossible;
      return !combatPossible;
    }).map((action) => ({ ...action }));
    const searchAction = actions.find((action) => action.id === "act_tim_kiem");
    if (searchAction) {
      const status = searchStatus(state);
      searchAction.label = "Tìm Kiếm · " + status.rolls + " lượt dò";
      searchAction.searchStatus = status;
      searchAction.description = "Search Depth " + status.depth + "/" + status.maxDepth + " · Tài nguyên " + status.resourcePct + "% · Rủi ro " + status.riskPct + "% · tốn 5 Thể Lực";
      if (Number(state.player.stamina || 0) < 5) searchAction.disabled_reason = "Cần ít nhất 5 Thể Lực.";
    }
    const breakthrough = breakthroughRequirements(state);
    const safeTravel = actions.find((a) => a.id === "act_ve_noi_an_toan");
    if (safeTravel) {
      const destination = safeTravelDestination(state);
      safeTravel.label = destination ? "Về " + destination.name : safeTravel.label;
      safeTravel.description = destination?.reason || "Di chuyển nhanh tới điểm trú ẩn đã biết.";
    }
    const breakthroughAction = actions.find((a) => a.id === "act_dot_pha");
    const ritualStatus = breakthroughRitualStatus(state);
    if (breakthroughAction && ritualStatus.remaining.length) {
      breakthroughAction.label = "Nghi Thức Đột Phá · Xem tiến trình";
      breakthroughAction.open_only = true;
      breakthroughAction.description = "Mở cổng nghi thức hiện tại; xác nhận bước này trong modal để tiếp tục.";
    } else if (breakthroughAction && !breakthrough.ready) breakthroughAction.disabled_reason = "Chưa đủ toàn bộ điều kiện Đột Phá.";
    if (!combatPossible && cultivationTier(state) > 1) {
      const ritual = breakthroughRitualStatus(state);
      if (ritual.remaining.length) {
        const step = ritual.remaining[0];
        const ritualAction = { id: "act_ritual_" + step, label: "Nghi Thức · " + BREAKTHROUGH_RITUAL_LABELS[step], aliases: [BREAKTHROUGH_RITUAL_LABELS[step]], priority: 1, open_only: true };
        const hint = breakthroughRitualGateHint(state, step);
        if (hint && step !== "omen") ritualAction.disabled_reason = hint;
        actions.unshift(ritualAction);
      }
    }
    const secludedAction = actions.find((a) => a.id === "act_be_quan");
    if (secludedAction && Number(loc?.corruption || 0) > 2) secludedAction.disabled_reason = "Địa điểm có Tà Nhiễm quá cao; hãy tìm nơi an toàn hơn.";
    if (combatPossible) actions.push(...skillActions(state));
    if (!combatPossible) {
      actions.push(...moveActions(state));
      actions.push(...talkActions(state));
      const pendingSearch = state.pendingSearch?.locationId === state.locationId ? state.pendingSearch : null;
      if (pendingSearch) {
        if (pendingSearch.findings.some((finding) => finding.type === "resource" || finding.type === "rare")) actions.unshift({ id: "act_search_collect", label: "Thu Thập Phát Hiện", aliases: ["thu thập", "thu thap"], priority: 1, category: "interaction" });
        if (pendingSearch.findings.some((finding) => finding.type === "information")) actions.unshift({ id: "act_search_investigate", label: "Điều Tra Dấu Vết", aliases: ["điều tra dấu vết", "dieu tra dau vet"], priority: 1, category: "interaction" });
        actions.push({ id: "act_search_leave", label: "Bỏ Qua Phát Hiện", aliases: ["bỏ qua phát hiện", "bo qua phat hien"], priority: 1, category: "interaction" });
      }
    }
    return { inCombat, forced, state: state._fateState, actions };
  }
  function parseAction(raw, actions) {
    const text = normalizedText(raw).trim();
    const list = (actions || ACTION_DEFINITIONS).map((a) => ({ action: a, aliases: a.aliases.map(normalizedText) }));
    const exact = list.find((x) => x.aliases.includes(text));
    if (exact) return { actionId: exact.action.id, suggestion: null };
    const prefix = list.filter((x) => x.aliases.some((alias) => alias.startsWith(text)));
    if (prefix.length === 1) return { actionId: prefix[0].action.id, suggestion: "Ý mày là: " + prefix[0].action.label + "?" };
    const distance = (a, b) => { const row = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let prev = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const cur = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } } return row[b.length]; };
    const fuzzy = list.map((x) => ({ x, d: Math.min(...x.aliases.map((alias) => distance(text, alias))) })).filter((x) => x.d <= 2).sort((a, b) => a.d - b.d);
    return fuzzy.length && (fuzzy.length === 1 || fuzzy[0].d < fuzzy[1].d) ? { actionId: fuzzy[0].x.action.id, suggestion: "Ý mày là: " + fuzzy[0].x.action.label + "?" } : null;
  }
  function resolveAction(state, actionId, options = {}) {
    if (actionId.startsWith("act_ritual_")) return performBreakthroughRitualStep(state, actionId.slice("act_ritual_".length));
    if (actionId.startsWith("act_path_")) return selectPath(state, actionId.slice("act_path_".length));
    if (actionId.startsWith("act_faction_")) return chooseTaintedFaction(state, actionId.slice("act_faction_".length));
    if (actionId.startsWith("act_move_")) { move(state, actionId.slice("act_move_".length)); return true; }
    if (actionId.startsWith("act_talk_")) { talk(state, (D().NPCS[actionId.slice("act_talk_".length)] || getEntity(actionId.slice("act_talk_".length)) || {}).name); return true; }
    if (actionId.startsWith("act_skill_")) { useTechnique(state, actionId.slice("act_skill_".length), options); return true; }
    const handlers = {
      act_ve_noi_an_toan: () => travelToSafeHub(state),
      act_tu_luyen: () => cultivate(state), act_tu_luyen_tu_dong: () => autoCultivate(state, 5), act_be_quan: () => secludedCultivation(state, Number(options.hours || 1)), act_tan_cong_thuong: () => combat(state), act_nhin: () => pushHistory(state, { type: "sys", text: look(state) }),
      act_hanh_trang: () => pushHistory(state, { type: "sys", text: describeInventory(state) }),
      act_trang_thai: () => pushHistory(state, { type: "sys", text: describeStatus(state) }),
      act_nhiem_vu: () => pushHistory(state, { type: "sys", text: describeQuests(state) }),
      act_menh: () => pushHistory(state, { type: "sys", text: describeFate(state) }),
      act_cong_phap: () => pushHistory(state, { type: "sys", text: techniqueStatus(state) || "Chưa lĩnh ngộ Công pháp nào." }),
      act_ban_do: () => pushHistory(state, { type: "sys", text: describeMap(state) }),
      act_to_chuc: () => pushHistory(state, { type: "sys", text: describeGuild(state) }),
      act_tim_tong_mon: () => pushHistory(state, { type: "sys", text: describeGuild(state) }),
      act_giup: () => pushHistory(state, { type: "sys", text: D().HELP_TEXT }),
      act_tim_kiem: () => search(state),
      act_search_collect: () => collectSearchFindings(state),
      act_search_investigate: () => investigateSearchFinding(state),
      act_search_leave: () => leaveSearchSession(state),
      act_dot_pha: () => breakthroughRitualStatus(state).remaining.length ? { changed: false, reason: "Hãy mở Nghi Thức Đột Phá và hoàn tất cổng đang active trước." } : doBreakthrough(state),
      act_nghi_ngoi: () => rest(state),
      act_bo_chay: () => { const stayedAt = state.locationId; state.enemies = {}; state.flags.fledUntilTurn = Number(state.meta.turn || 0) + 1; state.flags.lastCombatOutcome = "fled"; state.flags.threatLevel = Math.min(5, Number(state.flags.threatLevel || 0) + 1); state.locationId = stayedAt; pushHistory(state, { type: "sys", text: "Ngươi bỏ chạy khỏi giao chiến nhưng vẫn trụ lại tại khu vực này. Các lối đi vẫn thông; hãy nghỉ ngơi hoặc rời đi khi sẵn sàng." }); },
      act_chon_ban_phuoc: () => chooseTaintedAttention(state, "blessing"),
      act_chon_nghi_ky: () => chooseTaintedAttention(state, "suspicion"),
      act_chon_ho_hung: () => chooseTaintedAttention(state, "indifference")
    };
    return handlers[actionId] ? handlers[actionId]() : false;
  }
  function submitActionId(state, actionId, options = {}) {
    const action = contextState(state).actions.find((item) => item.id === actionId);
    if (!action) return false;
    state.meta.turn += 1;
    state.meta.updatedAt = new Date().toISOString();
    pushHistory(state, { type: "action", text: "> [" + action.label + "]" });
    const result = resolveAction(state, actionId, options);
    updateDerived(state);
    checkAllQuests(state);
    if (checkEndings(state)) return result;
    updateDerived(state);
    return result;
  }
  function submitTurn(state, action) {
    const text = (action.text || "").trim();
    if (!text) {
      pushHistory(state, { type: "warn", text: "× Hãy nhập một hành động." });
      return;
    }
    state.meta.turn += 1;
    state.meta.updatedAt = new Date().toISOString();
    pushHistory(state, { type: "action", text: "> " + text });
    const norm = text.toLowerCase();
    const available = contextState(state).actions;
    const parsed = parseAction(text, available);
    if (parsed && !/^dùng |^dung |^đi |^di |^nói |^noi |^gia nhập |^gia nhap /.test(norm)) {
      resolveAction(state, parsed.actionId);
      if (parsed.suggestion) pushHistory(state, { type: "sys", text: parsed.suggestion });
      updateDerived(state);
      return;
    }

    // command dispatch
    if (/^(giúp|giup|help)$/.test(norm)) { pushHistory(state, { type: "sys", text: D().HELP_TEXT }); return; }
    if (/^(nhìn|nhin|quan sát|quan sat|look)$/.test(norm)) { pushHistory(state, { type: "sys", text: look(state) }); return; }
    const autoMatch = norm.match(/^(?:tu luyện tự động|tu luyen tu dong|auto cultivate)(?:\s+(\d+))?$/);
    if (autoMatch) { autoCultivate(state, Number(autoMatch[1] || 5)); return; }
    if (/^(tu luyện|tu luyen|cultivate|tu hành)$/.test(norm)) { cultivate(state); return; }
    if (/^(bế quan|be quan|bế quan tu luyện|be quan tu luyen|afk)(?:\s+(\d+))?$/.test(norm)) { pushHistory(state, { type: "warn", text: "Bế Quan thủ công đã được thay bằng tu luyện offline theo timestamp. Hãy thoát game an toàn; khi quay lại hệ thống sẽ tự bù tiến trình." }); return; }
    if (/^(đột phá|dot pha|breakthrough)$/.test(norm)) { doBreakthrough(state); return; }
    if (/^(tìm kiếm|tim kiem|tìm|search)$/.test(norm)) { search(state); return; }
    if (/^(tấn công|tan cong|attack|chiến đấu)$/.test(norm)) { combat(state); return; }
    if (/^(trạng thái|trang thai|status)$/.test(norm)) { pushHistory(state, { type: "sys", text: describeStatus(state) }); return; }
    if (/^(hành trang|hanh trang|inventory|túi)$/.test(norm)) { pushHistory(state, { type: "sys", text: describeInventory(state) }); return; }
    if (/^(nhiệm vụ|nhiem vu|quest)$/.test(norm)) { pushHistory(state, { type: "sys", text: describeQuests(state) }); return; }
    if (/^(mệnh|menh|fate|tử vi)$/.test(norm)) { pushHistory(state, { type: "sys", text: describeFate(state) }); return; }
    if (/^(công pháp|cong phap|kỹ năng|ky nang|skills)$/.test(norm)) { pushHistory(state, { type: "sys", text: techniqueStatus(state) || "Chưa lĩnh ngộ Công pháp nào." }); return; }
    if (/^(bản đồ|ban do|map)$/.test(norm)) { pushHistory(state, { type: "sys", text: describeMap(state) }); return; }
    if (/^(môn phái|mon phai|tổ chức|to chuc|guild)$/.test(norm)) { pushHistory(state, { type: "sys", text: describeGuild(state) }); return; }
    if (/^(rời môn|roi mon|rời tổ chức|roi to chuc|leave guild)$/.test(norm)) { leaveGuild(state); return; }
    if (/^(từ chối gia nhập|tu choi gia nhap|từ chối tán tu|tu choi tan tu|chọn tán tu|chon tan tu)$/.test(norm)) { refuseGuild(state, "tán tu"); return; }
    if (/^(từ chối thế gia|tu choi the gia|chọn thế gia|chon the gia|chọn gia tộc|chon gia toc)$/.test(norm)) { refuseGuild(state, "thế gia"); return; }
    if (/^(lưu|luu|save)$/.test(norm)) { return { save: true }; }
    if (/^(tải|tai|load)$/.test(norm)) { return { load: true }; }

    let m;
    if ((m = norm.match(/^đi (.+)/)) || (m = norm.match(/^di (.+)/))) {
      const dirMap = { bắc: "bac", bac: "bac", b: "bac", nam: "nam", n: "nam", đông: "dong", dong: "dong", d: "dong", tây: "tay", tay: "tay", t: "tay" };
      const dir = dirMap[m[1].trim()];
      if (dir) { move(state, dir); return; }
    }
    if ((m = norm.match(/^dùng (.+)/)) || (m = norm.match(/^dung (.+)/))) {
      useItem(state, m[1].trim());
      return;
    }
    if ((m = norm.match(/^nói chuyện (.+)/)) || (m = norm.match(/^noi chuyen (.+)/)) || (m = norm.match(/^trò chuyện (.+)/))) {
      talk(state, m[1].trim());
      return;
    }
    if ((m = norm.match(/^gia nhập (.+)/)) || (m = norm.match(/^gia nhap (.+)/)) || (m = norm.match(/^join (.+)/))) {
      joinGuild(state, m[1].trim());
      return;
    }

    // free-form action -> narrative interpretation
    resolveFreeAction(state, text);

    // quest / ending check
    checkAllQuests(state);
    if (checkEndings(state)) return;
    updateDerived(state);
  }

  function resolveFreeAction(state, text) {
    const loc = D().LOCATIONS[state.locationId];
    const stats = computeStats(state.player);
    // heuristics
    if (/trấn tĩnh|bình tâm|hít thở|thiền/.test(text.toLowerCase())) {
      const restored = restoreSan(state, rnd(5, 15));
      pushHistory(state, { type: "sys", text: "Ngươi trấn tĩnh tâm thần, Thanh Tỉnh +" + restored + "." });
      return;
    }
    if (/đọc|nghiên cứu|cổ tịch|sách/.test(text.toLowerCase())) {
      if (state.inventory["co_tich_tan_trang"] || state.flags.foundTich) {
        drainSan(state, rnd(8, 18), "cổ tịch tà thần");
        pushHistory(state, { type: "sys", text: "Trang cổ tịch hé lộ: Cổ Thần từng ngủ dưới vực sâu, và linh khí chính là hơi thở của nó." });
        state.flags.learnedTruth = true;
        return;
      }
    }
    // generic skill check
    const check = skillCheck((stats.phy + stats.mag) / 2, 12);
    if (check.success) {
      pushHistory(state, { type: "sys", text: "Hành động của ngươi diễn ra suôn sẻ." });
      if (loc.corruption >= 3) drainSan(state, rnd(3, 7), "môi trường");
    } else {
      pushHistory(state, { type: "warn", text: "Hành động không đạt kết quả như mong đợi." });
    }
  }

  function checkAllQuests(state) {
    Object.keys(state.quests).forEach((qid) => {
      if (state.quests[qid].status === "active") checkQuestObjectives(state, qid);
    });
  }

  function checkEndings(state) {
    if (state.pendingEnding) return true;
    if (state.flags.madness) { state.pendingEnding = "succumb"; return true; }
    if (state.player.lifespan <= 0) { processLuanHoi(state); return true; }
    // these are triggered via explicit player decision handled in UI, but a couple auto:
    if (state.flags.learnedTruth && state.flags.metCoThan) {
      // player still decides; not auto
    }
    return false;
  }

  function getChuyenSinhBlockers(state) {
    const blockers = [];
    if (cultivationTier(state) < 8) blockers.push("Cảnh giới hiện tại: " + cultivationTier(state) + "/8");
    if (state.player.lifespan <= 0) blockers.push("Thọ Nguyên đã cạn — đây là Luân Hồi bắt buộc");
    if (state.flags?.chuyenSinhCooldownUntil && Date.now() < state.flags.chuyenSinhCooldownUntil) blockers.push("Chuyển Sinh đang trong thời gian hồi");
    return blockers;
  }
  function processLuanHoi(state) {
    const fates = state.player.fates || [];
    const patterns = D().FATE_PATTERNS;
    const retained = fates.map((id) => patterns.find((f) => f.id === id)).filter(Boolean).sort((a, b) => b.score - a.score)[0];
    if (typeof window !== "undefined" && window.GameExpansion?.beforeReincarnation) window.GameExpansion.beforeReincarnation(state, retained?.id || null);
    state.player.realmId = "di_menh"; state.player.exp = 0; state.player.lifespan = 75; state.player.currentAge = 0; state.player.fates = retained ? [retained.id] : [];
    state.fateInventory = []; state.player.techniques = { kiem_khi_so_cap: { masteryStage: 0, masteryExp: 0, usageCount: 0 } }; state.pendingEnding = "reincarnation";
    if (typeof window !== "undefined" && window.GameExpansion?.afterReincarnation) window.GameExpansion.afterReincarnation(state, retained?.id || null, "luan_hoi");
    pushHistory(state, { type: "sys", text: "§ Luân Hồi bắt buộc: Thọ Nguyên đã cạn. Giữ lại một Mệnh Số cao nhất để mở kiếp mới." });
    updateDerived(state); return { success: true, retainedFate: retained?.id || null };
  }
  function processChuyenSinh(state) {
    const blockers = getChuyenSinhBlockers(state);
    if (blockers.length) return { success: false, blockers, reason: blockers.join("; ") };
    if (typeof window !== "undefined" && window.GameExpansion?.beforeReincarnation) window.GameExpansion.beforeReincarnation(state, state.player.fates?.[0] || null);
    state.flags = state.flags || {}; state.flags.chuyenSinhPoints = Number(state.flags.chuyenSinhPoints || 0) + 1; state.flags.chuyenSinhCooldownUntil = Date.now() + 86400000;
    state.player.aptitude = Number(state.player.aptitude || 0) + 2; state.player.realmId = "di_menh"; state.player.exp = 0; state.player.lifespan = 75; state.player.currentAge = 0;
    state.pendingEnding = "reincarnation"; pushHistory(state, { type: "sys", text: "§ Chuyển Sinh thành công: Chuyển Sinh Điểm +1, Căn Cốt nền +2." }); updateDerived(state);
    if (typeof window !== "undefined" && window.GameExpansion?.afterReincarnation) window.GameExpansion.afterReincarnation(state, state.player.fates?.[0] || null, "chuyen_sinh");
    return { success: true, points: state.flags.chuyenSinhPoints };
  }

  /* ---------- Descriptions ---------- */
  function describeStatus(state) {
    const p = state.player;
    const s = p.stats;
    const r = realmById(p.realmId);
    const next = D().REALMS[D().REALMS.findIndex((x) => x.id === p.realmId) + 1];
    const expRequired = next ? Number(r.breakExp || 0) * (p.pathId === "ngoai_dao_gia" ? 5 : 1) : null;
    const perceivedHp = perceivedValue(state, p.hp, "hp");
    const perceivedQi = perceivedValue(state, p.qi, "qi");
    const perceivedFortune = perceivedValue(state, s.fortune, "fortune");
    return [
      "§ " + p.name + " — " + pathTitle(state),
      "Cảnh giới: " + pathTitle(state) + " (tầng " + cultivationTier(state) + ")",
      "Khí Huyết: " + perceivedHp + "/" + p.maxHp,
      "Linh Khí: " + perceivedQi + "/" + p.maxQi,
      "Thanh Tỉnh: " + p.san + "/" + (p.maxSan || 100) + " · " + sanStatus(p).name,
      "Tuổi: " + Number(p.currentAge || 0) + " năm · Thọ Nguyên: " + p.lifespan + "/" + (p.maxLifespan || p.lifespan) + " năm",
      "Tà Nhiễm: " + p.corruptionRating + "/100 | Công Đức: " + Number(p.merit || 0),
      "Tu Vi: " + p.exp + (next ? " / " + expRequired + " (đột phá cấp " + next.level + ")" : " (tối thượng)"),
      "Thể phách: " + s.phy + "  |  Linh lực: " + s.mag + "  |  Khí Vận: " + perceivedFortune,
      "Mệnh Trạng Thái: " + fateStatusLabel(state),
      "Pháp khí (0-2): " + equipmentSummary(state).artifacts.length,
      "Hộ thân Pháp khí (0-4): " + Object.values(equipmentSummary(state).protection).filter(Boolean).length,
      "Tùy thân Pháp khí (0-3): " + equipmentSummary(state).personal.length,
      "Bản mệnh Linh bảo: " + (equipmentSummary(state).spiritTreasure[0] || "Chưa trang bị"),
      "Pháp khí Sinh hoạt: " + (equipmentSummary(state).lifestyle[0] || "Chưa trang bị")
    ].concat(worldviewWrongness(state) >= 51 ? ["Cảm quan: Có gì đó trong thế giới này đang lệch khỏi điều ngươi nhớ."] : []).join("\n");
  }
  function describeInventory(state) {
    const ids = Object.keys(state.inventory);
    const equippedIds = new Set(equippedItemIds(state.player.equipment));
    if (!ids.length) return "Hành trang trống rỗng.";
    return weaveAtmosphere(state, "§ Hành trang:\n" + ids.map((id) => {
      const item = D().ITEMS[id];
      if (!item) return "  Vật phẩm không xác định: " + id;
      const equipped = equippedIds.has(id) ? " [Đang trang bị]" : "";
      return "  " + item.name + " ×" + state.inventory[id] + equipped + " — " + (item.desc || "Không rõ lai lịch.");
    }).join("\n"), "inventory");
  }
  function describeQuests(state) {
    const list = Object.values(state.quests).filter((q) => q.status !== "available");
    if (!list.length) return "Chưa có nhiệm vụ nào.";
    return "§ Nhiệm vụ:\n" + list.map((q) => {
      const def = D().QUESTS[q.id];
      const mark = q.status === "completed" ? "[✓]" : q.status === "failed" ? "[×]" : "[·]";
      const objs = q.objectives.map((o) => (o.done ? "  ✓ " : "  ○ ") + o.label).join("\n");
      return "  " + mark + " " + def.title + " (" + q.status + ")\n" + objs;
    }).join("\n");
  }
  function describeFate(state) {
    const f = computeFate(state.player);
    const patterns = (state.player.fates || []).map((id) => {
      const p = D().FATE_PATTERNS.find((x) => x.id === id);
      if (!p) return "  · " + id;
      const label = p.gradeLabel || (p.grade ? p.grade.toUpperCase() : "");
      const signLabel = p.sign === "cat" ? "Cát" : p.sign === "hung" ? "Hung" : "Bình";
      return "  · " + p.name + " [" + label + " · " + signLabel + " · " + p.score + " điểm]";
    });
    const rel = state.player.stats && state.player.stats.rel;
    let relText = "";
    if (rel && (rel.activePairs.length || rel.activeCombos.length)) {
      relText = "\n  Quan hệ kích hoạt:";
      rel.activePairs.forEach((p) => {
        relText += "\n    " + (p.type === "TUONG_SINH" ? "⟷ Tương Sinh" : "✕ Tương Khắc") + ": " + p.label;
      });
      rel.activeCombos.forEach((c) => {
        relText += "\n    ★ Combo \"" + c.name + "\": " + c.effect;
      });
    }
    return weaveAtmosphere(state, "§ Tử Vi Mệnh Số:\n" +
      "  Tổng Mệnh: " + f.total + " | Cát/Bình: " + f.normal + " | Hiệu dụng: " + f.effective + " | Ngưỡng: " + f.minFate + " | R: " + f.ratio.toFixed(2) + "\n" +
      "  Trạng thái: " + state._fateState + "\n" +
      "  Cách cục:\n" + (patterns.length ? patterns.join("\n") : "    (chưa có)") +
      relText, "fate");
  }

  function describeMap(state) {
    const loc = D().LOCATIONS[state.locationId];
    const directions = { bac: "Bắc", nam: "Nam", dong: "Đông", tay: "Tây" };
    const exits = Object.entries(locationExits(state)).filter(([, id]) => id && D().LOCATIONS[id]).map(([dir, id]) => {
      return "  " + directions[dir] + " → " + D().LOCATIONS[id].name;
    });
    return weaveAtmosphere(state, "§ Bản Đồ — " + (D().WORLD_MAP?.name || "Vạn Giới Lộ") + "\n" +
      "  Hiện tại: " + loc.name + "\n" +
      (exits.length ? "  Lối đi:\n" + exits.join("\n") : "  Không có lối đi khả dụng."), "map:" + state.locationId);
  }

  /* ---------- Serialization ---------- */
  function toCanonicalCharacter(player, state) {
    const fate = computeFate(player);
    const realm = realmById(player.realmId);
    const tainted = player.tainted || {};
    const canonicalFaction = {
      id: tainted.faction || null,
      titles: factionStatus(state).titles,
      heavenMerit: Number(tainted.rewards?.heaven_merit || 0),
      balanceTokens: Number(tainted.rewards?.balance_token || 0),
      eldritchAttentionChosen: Boolean(tainted.attention),
      vocation: tainted.vocation || null,
      patron: tainted.patron || null,
      attentionPending: Boolean(tainted.attentionPending),
      factionPending: Boolean(tainted.factionPending),
      questsActive: Boolean(tainted.questsActive),
      finalConflictPreparation: Boolean(tainted.finalConflictPreparation),
      taintedGodDefeated: Boolean(tainted.taintedGodDefeated)
    };
    return {
      id: player.id,
      name: player.name,
      origin: { regionId: player.startRegionId || state.startRegionId, locationId: state.locationId, race: player.race, background: player.background, profile: player.origin ? JSON.parse(JSON.stringify(player.origin)) : null, personality: (player.personalityTraits || []).slice(), hiddenGoal: player.hiddenGoal, spiritualRoots: (player.spiritualRoots || []).slice(), spiritualRootBranch: player.spiritualRootBranch || null },
      presentation: { archetypeId: player.archetypeId, portrait: player.portrait },
      realm: { id: realm.id, level: realm.level, title: pathTitle(state), exp: player.exp },
      path: { primary: player.pathId || null, secondary: player.secondaryPathId || null, pathScore: player.pathId ? pathMatchSummary(player, player.pathId).score : 0, professionStage: player.professionStage || null },
      stats: { phy: player.basePhy, mag: player.baseMag, aptitude: player.aptitude, comprehension: player.comprehension, vitality: player.hp, vitalityMax: player.maxHp, qi: player.qi, qiMax: player.maxQi, staminaCurrent: player.stamina, staminaMax: player.maxStamina, san: player.san, sanMax: player.maxSan, corruption: player.corruptionRating, lifespan: player.lifespan, lifespanConsumableBonus: Number(player.lifespanConsumableBonus || 0), currentAge: player.currentAge, fortune: player.baseFortune, sat: player.sat, merit: player.merit },
      fate: { equippedIds: (player.fates || []).slice(), vaultIds: (state.fateInventory || []).slice(), vaultCapacity: fateVaultCapacity(state), total: fate.total, normal: fate.normal, ratioR: fate.ratio, debt: fate.debt, surplus: fate.surplus, excessEssence: Number(state.fateExcessEssence || player.fateExcessEssence || 0), instances: JSON.parse(JSON.stringify(state.fateInstances || player.fateInstances || {})), pacts: (player.fatePacts || []).slice(), enhancements: { ...(player.fateEnhancements || {}) }, relationships: JSON.parse(JSON.stringify(player.fateRelationships || {})), evolutions: JSON.parse(JSON.stringify(player.fateEvolutions || {})) },
      anchors: (player.anchors || []).map((anchor) => ({ ...anchor })),
      techniqueIds: Object.keys(player.techniques || {}),
      techniqueProgress: JSON.parse(JSON.stringify(player.techniques || {})),
      techniqueCooldowns: { ...(player.techniqueCooldowns || {}) },
      hiddenFates: (player.hiddenFates || []).slice(), hiddenProfessionCandidate: player.hiddenProfessionCandidate || null, hiddenProfession: player.hiddenProfession || null,
      faction: canonicalFaction,
      state: state._fateState,
      pathDebt: (player.pathDebt || []).slice(),
      unboundTrials: { ...(player.unboundTrials || {}) }, unboundPathProven: Boolean(player.unboundPathProven),
      equipment: JSON.parse(JSON.stringify(player.equipment || {}))
    };
  }

  function fromCanonicalCharacter(character) {
    const stats = character.stats || {}; const origin = character.origin || {}; const faction = character.faction || {};
    const tainted = Object.prototype.hasOwnProperty.call(faction, "faction") ? faction : {
      faction: faction.id || null,
      attention: Boolean(faction.eldritchAttentionChosen),
      vocation: faction.vocation || null,
      patron: faction.patron || null,
      attentionPending: Boolean(faction.attentionPending),
      factionPending: Boolean(faction.factionPending),
      questsActive: Boolean(faction.questsActive),
      finalConflictPreparation: Boolean(faction.finalConflictPreparation),
      taintedGodDefeated: Boolean(faction.taintedGodDefeated),
      rewards: { heaven_merit: Number(faction.heavenMerit || 0), balance_token: Number(faction.balanceTokens || 0) }
    };
    return createCharacter({
      id: character.id, name: character.name, archetypeId: character.presentation?.archetypeId,
      portrait: character.presentation?.portrait, realmId: character.realm?.id,
      race: origin.race, startRegionId: origin.regionId, spiritualRoots: origin.spiritualRoots, spiritualRootBranch: origin.spiritualRootBranch,
      personalityTraits: origin.personality, background: origin.background, originProfile: origin.profile, hiddenGoal: origin.hiddenGoal,
      basePhy: stats.phy, baseMag: stats.mag, aptitude: stats.aptitude, comprehension: stats.comprehension,
      baseFortune: stats.fortune, sat: stats.sat, merit: stats.merit, stamina: stats.staminaCurrent, lifespanConsumableBonus: stats.lifespanConsumableBonus, currentAge: stats.currentAge,
      corruptionRating: stats.corruption, fates: character.fate?.equippedIds,
      fateDebt: character.fate?.debt, fateSurplus: character.fate?.surplus, fatePacts: character.fate?.pacts, fateEnhancements: character.fate?.enhancements,
      fateRelationships: character.fate?.relationships, fateEvolutions: character.fate?.evolutions,
      anchors: character.anchors, techniques: character.techniqueProgress || Object.fromEntries((character.techniqueIds || []).map((id) => [id, { masteryStage: 0, masteryExp: 0, usageCount: 0 }])),
      hiddenFates: character.hiddenFates, hiddenProfessionCandidate: character.hiddenProfessionCandidate,
      hiddenProfession: character.hiddenProfession, pathId: character.path?.primary, tainted, equipment: character.equipment
    });
  }

  function serialize(state) {
    const persisted = JSON.parse(JSON.stringify(state));
    persisted.player = toCanonicalCharacter(state.player, state);
    delete persisted.fateInventory;
    return JSON.stringify({
      version: 12,
      schema: "tu_vi_quy_di_final",
      state: persisted,
      savedAt: new Date().toISOString()
    });
  }
  function deserialize(json) {
    const data = JSON.parse(json);
    const state = data.state;
    // Save cũ chỉ lưu timestamp ở metadata ngoài; đưa nó vào gameClock để
    // khoảng thời gian người chơi offline vẫn được mô phỏng khi đăng nhập lại.
    const savedAtMs = Date.parse(data.savedAt || "");
    if (state && Number.isFinite(savedAtMs)) {
      state.gameClock = state.gameClock || {};
      const clockStamp = Number(state.gameClock.lastRealTimestamp || 0);
      // savedAt là mốc chắc chắn của lần xuất file; dùng mốc mới hơn để
      // không bị timestamp trong state cũ làm mất toàn bộ thời gian offline.
      state.gameClock.lastRealTimestamp = Math.max(clockStamp, savedAtMs);
    }
    if (state.player?.realm && state.player?.fate) {
      const canonical = state.player;
      state.player = fromCanonicalCharacter(canonical);
      state.player.exp = Number(canonical.realm.exp || 0);
      state.player.hp = Number(canonical.stats?.vitality ?? state.player.hp);
      state.player.qi = Number(canonical.stats?.qi ?? state.player.qi);
      state.player.san = Number(canonical.stats?.san ?? state.player.san);
      state.player.merit = Number(canonical.stats?.merit ?? state.player.merit ?? 0);
      state.player.lifespan = Number(canonical.stats?.lifespan ?? state.player.lifespan);
      state.player.currentAge = Number(canonical.stats?.currentAge ?? state.player.currentAge ?? 0);
      state.player.unboundTrials = { ...(canonical.unboundTrials || {}) };
      state.player.unboundPathProven = Boolean(canonical.unboundPathProven);
      state.fateInventory = (canonical.fate.vaultIds || []).slice();
      state.fateExcessEssence = Number(canonical.fate.excessEssence || 0);
      state.fateInstances = canonical.fate.instances ? JSON.parse(JSON.stringify(canonical.fate.instances)) : {};
      state._fateState = canonical.state || state._fateState;
    }
    state.player.realmId = realmById(state.player.realmId).id;
    if (!Array.isArray(state.visitedLocations)) state.visitedLocations = [state.locationId];
    state.flags = state.flags || {};
    const savedOriginBranch = state.flags.originChoice?.branch;
    if (!state.player.origin && ORIGIN_PROFILES[savedOriginBranch]) {
      const specializationId = state.flags.originChoice?.specialization || (savedOriginBranch === "tan_tu" ? "kiem_tu" : "linh_mach");
      const profile = ORIGIN_PROFILES[savedOriginBranch];
      const specialization = profile.specializations[specializationId] || Object.values(profile.specializations)[0];
      const resolvedSpecializationId = profile.specializations[specializationId] ? specializationId : Object.keys(profile.specializations)[0];
      const modifiers = { ...profile.baseModifiers };
      Object.entries(specialization.modifiers || {}).forEach(([key, value]) => { modifiers[key] = Number(modifiers[key] || 0) + Number(value || 0); });
      state.player.origin = { type: savedOriginBranch, specialization: resolvedSpecializationId, name: profile.name, specializationName: specialization.name, modifiers, traits: [...new Set([...(profile.baseTraits || []), ...(specialization.traits || [])])], confirmed: true };
      state.flags.originChoicePending = false;
      state.flags.originLocked = true;
    } else if (!state.player.origin && state.flags.originSituation && savedOriginBranch === "seek_guild") {
      state.flags.originChoicePending = true;
      state.flags.originLocked = false;
    }
    state.quests = state.quests || {};
    Object.keys(D().QUESTS).forEach((questId) => {
      if (!state.quests[questId]) {
        state.quests[questId] = {
          id: questId,
          status: "available",
          objectives: D().QUESTS[questId].objectives.map((objective) => ({ ...objective, done: false }))
        };
      }
    });
    state.generatedItems = state.generatedItems || {};
    Object.assign(D().ITEMS, state.generatedItems);
    ensureStarterKit(state);
    state.player.equipment = normalizeEquipment(state.player.equipment);
    state.player.race = state.player.race || "Nhân Tộc";
    state.player.aptitude = clamp(state.player.aptitude || 50, 1, 100);
    state.player.comprehension = clamp(state.player.comprehension || 50, 1, 100);
    state.player.daoTam = clamp(Number(state.player.daoTam ?? 50), 0, 100);
    state.player.cultivation = { velocity24h: 0, velocitySamples: [], deviationCount: 0, lastDeviationAt: null, pendingDeviation: null, ...(state.player.cultivation || {}) };
    state.player.cultivationJournal = Array.isArray(state.player.cultivationJournal) ? state.player.cultivationJournal.slice(-500) : [];
    state.player.secludedSession = state.player.secludedSession || null;
    state.flags.daoTamHistory = Array.isArray(state.flags.daoTamHistory) ? state.flags.daoTamHistory.slice(-100) : [];
    state.flags.minorTrial = state.flags.minorTrial || null;
    state.flags.ritualTutorial = { lastTargetRealmId: null, lastGate: null, suppressed: false, ...(state.flags.ritualTutorial || {}) };
    state.player.spiritualRoots = state.player.spiritualRoots || [];
    state.player.spiritualRootBranch = state.player.spiritualRootBranch || null;
    state.player.spiritualRootGrade = spiritualRootGrade(state.player.spiritualRoots);
    state.player.spiritualRootProfile = spiritualRootProfile(state.player);
    state.player.personalityTraits = state.player.personalityTraits || [];
    state.player.background = state.player.background || "Vô Danh";
    state.player.origin = state.player.origin || null;
    if (state.player.origin?.confirmed) {
      state.flags.originChoicePending = false;
      state.flags.originLocked = true;
    }
    state.player.hiddenGoal = state.player.hiddenGoal || "Trường sinh";
    state.player.cultivationMethod = state.player.cultivationMethod || "Dẫn Khí Nhập Môn";
    state.player.techniques = state.player.techniques || {
      kiem_khi_so_cap: { masteryStage: 0, masteryExp: 0, usageCount: 0 },
      tam_phap_dan_dien: { masteryStage: 0, masteryExp: 0, usageCount: 0 }
    };
    state.player.techniqueCooldowns = state.player.techniqueCooldowns || {};
    state.player.tainted = state.player.tainted || { attention: false, vocation: null, faction: null, quests: 0, finalConflictPreparation: false, taintedGodDefeated: false, rewards: {} };
    state.player.fateDebt = Number(state.player.fateDebt || 0);
    state.player.fateSurplus = Number(state.player.fateSurplus || 0);
    state.player.fatePacts = Array.isArray(state.player.fatePacts) ? state.player.fatePacts : [];
    state.player.anchors = Array.isArray(state.player.anchors) ? state.player.anchors : [];
    if ((state.player.hiddenFates || []).includes("luan_hoi_tien")) {
      state.player.hiddenProfessionCandidate = "luan_hoi_tien";
      if (state.player.hiddenProfession === "luan_hoi_tien" && !state.flags?.luanHoiTienUnlocked) state.player.hiddenProfession = null;
    }
    state.player.corruptionRating = Number(state.player.corruptionRating || 0);
    state.player.merit = Math.max(0, Number(state.player.merit || 0));
    state.player.lifespanConsumableBonus = Math.max(0, Number(state.player.lifespanConsumableBonus || 0));
    const stateAliases = { STATE_NORMAL_GROWTH: "NORMAL_GROWTH", STATE_FATE_BACKFIRE: "FATE_BACKFIRE", STATE_ELDRITCH_INTERVENTION: "ELDRITCH_INTERVENTION" };
    state._fateState = stateAliases[state._fateState] || state._fateState || "NORMAL_GROWTH";
    state.startRegionId = state.startRegionId || state.player.startRegionId || currentRegionId(state);
    state.guildMembership = state.guildMembership || null;
    state.guildPursuit = state.guildPursuit || null;
    state.autoCultivation = state.autoCultivation || null;
    state.searchSites = state.searchSites || {};
    state.pendingSearch = state.pendingSearch || null;
    state.pendingFateReward = state.pendingFateReward || null;
    state.pendingFateRewards = Array.isArray(state.pendingFateRewards) ? state.pendingFateRewards : [];
    state.fateExcessEssence = Number(state.fateExcessEssence || state.player.fateExcessEssence || 0);
    state.player.fateExcessEssence = state.fateExcessEssence;
    state.fateInstances = state.fateInstances || {};
    [...(state.player.fates || []), ...(state.fateInventory || [])].forEach((id) => {
      if (!state.fateInstances[id]) state.fateInstances[id] = { fateId: id, acquiredAtTurn: 0, source: "save cũ", relationshipStage: 0, resonanceProgress: 0, nurtureLevel: 0 };
    });
    state.meta = state.meta || {};
    state.meta.uniqueFateOwnership = state.meta.uniqueFateOwnership || {};
    // Grandfather Tiên hiện có trong save, nhưng khóa các lần nhận tiếp theo.
    (state.player.fates || []).concat(state.fateInventory || []).forEach((id) => {
      const fate = D().FATE_PATTERNS.find((entry) => entry.id === id);
      if (fate?.grade === "tien" && !state.meta.uniqueFateOwnership[id]) state.meta.uniqueFateOwnership[id] = state.player.id || "local";
    });
    Object.values(state.quests || {}).filter((quest) => quest.id?.startsWith("search_chain_")).forEach((quest) => {
      ensureSearchChainQuest(state, quest.searchLocationId || quest.id.slice("search_chain_".length), quest.requiredSearches || 1);
    });
    ensureGameClock(state);
    applyOfflineProgress(state);
    ensureOpenWorld(state);
    state.pendingRewardSummaries = Array.isArray(state.pendingRewardSummaries) ? state.pendingRewardSummaries : [];
    state.market = state.market && Array.isArray(state.market.offers) ? state.market : { generatedAt: 0, refreshIntervalMs: 60000, offers: [], purchased: {} };
    state.pendingGuildChoice = Boolean(state.pendingGuildChoice);
    if (state.player.origin?.confirmed || state.flags.originLocked) {
      // Save cũ từng tạo lại lựa chọn Tán Tu/Thế Gia sau khi đột phá. Xuất thân
      // mới chỉ được chọn một lần ở đầu game, vì vậy tự chuẩn hóa trạng thái.
      state.pendingGuildChoice = false;
      state.flags.guildDecision = state.flags.guildDecision || "origin:" + (state.player.origin?.type || state.player.background || "independent");
    } else if (cultivationTier(state) >= 2 && !state.guildMembership && !state.flags.guildDecision) {
      state.pendingGuildChoice = false;
      state.flags.guildDecision = "origin:" + (state.player.background || "independent");
      activateQuest(state, "chon_dao_lo");
    }
    recordTaintedMilestones(state);
    updateDerived(state);
    return state;
  }

  return {
    rnd, clamp, computeFate, fateState, fateStatusLabel, drawInitialFates, rollCharacterCreation, rollSpiritualRootBranch, spiritualRootProfile, startRegionEligibility, availableStartRegions, computeStats, computeRelationshipEffects, skillCheck, sanCheck, sanStatus, fortuneStatus, worldviewWrongness, weaveAtmosphere, perceivedValue, realmLore, getPathDisplayName, spiritualRootGrade,
    createCharacter, createState, updateDerived, originOptions, chooseOrigin, chooseOriginBranch,
    addItem, removeItem, registerGeneratedItem, createLootItem, activateQuest, trackQuest, abandonQuest, checkQuestObjectives, failQuest,
    getGuildBenefits, guildTierInfo, guildEligibility, guildExitCost, joinGuild, refuseGuild, leaveGuild, describeGuild, travelHubCatalog, safeTravelDestination, travelToSafeHub,
    normalizeEquipment, equippedItemIds, equippedItemQuantity, freeItemQuantity, equipmentCategory, equipmentCategoryLabel, equipmentSummary, equipmentEligibility, protectionSlot, equipItem, inventoryActions, handleInventoryAction, cauldronItemSafety,
    GRADE_TO_TIER, TIER_TO_GRADE, SIGN_TO_TYPE_LABEL, TYPE_LABEL_TO_SIGN, fateDefinition, fateElement, fatePathAffinity, splitFateEffects, fateRelationshipsFor, fateCombosFor, fateFusionRecipesFor, fateRelationshipStatus, nurtureFate, resonateFate, meritFateOffers, buyFateWithMerit,
    fateVaultCapacity, fateCompatibility, fateEnhancementLevel, enhancedFateEffects, pathMatchSummary, availablePaths, pathProgression, receiveFate, sacrificeFate, fateVaultSummary, validateFateInventory, swapFateFromVault, fateSwapPreview, storeFateToVault, equipFateFromVault, fateUpgradePreview, upgradeFate, resolvePendingFateReward, dismissPendingFateReward, mergeFates, suggestFateForRealmRequirement, auditFateRolls, buyFateAtMarket, sacrificeLifespanForFate, qintianFateOffers, refreshMarket, marketOffers, buyMarketOffer, refreshBlackMarket, blackMarketOffers, buyBlackMarketOffer, meritFateOffers, buyFateWithMerit, refineAtVoidCauldron,
    cultivationTier, fateRewardWeights, rollFateByProgression, anchorCandidates, establishHumanAnchor, breakthroughRitualPlan, breakthroughRitualStatus, breakthroughRitualGateRequirements, performBreakthroughRitualStep, breakthroughRequirements, getBreakthroughBlockers, getChuyenSinhBlockers, processLuanHoi, processChuyenSinh, chooseTaintedAttention, rollTaintedAttention, chooseTaintedFaction, factionStatus, grantQuestMerit, resolveFactionHunt, switchTaintedFaction, selectPath, pathTitle, completeUnboundTrial, canUnlockDevourHeaven, recordTaintedMilestones,
    elementRelation, familyMatchup, toCanonicalCharacter, fromCanonicalCharacter,
    gainExp, recordCultivationGain, cultivationVelocityStatus, adjustDaoTam, cultivationJournalPush, enterLuyenKhi, cultivate, autoCultivate, secludedCultivation, rest, doBreakthrough, drainSan, restoreSan, move, locationExits, look, ensureSearchSite, searchStatus, search, collectSearchFindings, investigateSearchFinding, leaveSearchSession, useItem,
    talk, combat, beginCombat, aliveEnemies, firstAliveEnemy, enemyTurn, afterPlayerCombatAction, applyPlayerDamage, endCombat, combatEntity, spawnCombatEntity, maybeSpawnCombatExtras, lootTable, rollEntityLoot, rollDefeatBonus, entityCatalog, getEntity, entityForPlayer, dialogueState, presentEntities, maybeTriggerRandomEncounter, findEntityByName, interactEntity, monsterAction, useTechnique, techniquePreview, learnTechnique, getKnownTechniques, techniqueStatus, techniqueProgress, contextState, moveActions, talkActions, skillActions, parseAction, resolveAction, submitActionId, submitTurn, describeStatus, describeInventory, describeQuests,
    describeFate, describeMap, serialize, deserialize, pushMemory, pushHistory, ensureGameClock, clockLabel, advanceGameTime, processOnlineFateReward, applyOfflineProgress, GAME_TIME_CONFIG
  };
})();
