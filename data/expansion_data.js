/* CỔ DỊ DIỆN — data-driven content for the world expansion systems. */
(function () {
  "use strict";

  const worldEvents = [
    {
      id: "huyet_nguyet", name: "Huyết Nguyệt", category: "di_trieu", weight: 4, cooldownDays: 24,
      phases: [
        { id: "omen", durationDays: 2, modifiers: {}, text: "Trăng bắt đầu rỉ một quầng đỏ như máu cũ." },
        { id: "active", durationDays: 4, modifiers: { encounterChanceMult: 1.35, searchRewardMult: 1.25, sanDrainMult: 1.2 }, text: "Huyết Nguyệt phủ xuống; dã thú và lòng tham cùng thức giấc." },
        { id: "aftermath", durationDays: 2, modifiers: { searchRewardMult: 1.1 }, text: "Ánh đỏ rút đi, để lại những dấu chân không hướng về đâu." }
      ],
      choices: [
        { id: "relief", label: "Cứu trợ dân chúng", merit: 4, contribution: 2 },
        { id: "hunt", label: "Săn sinh vật dị biến", exp: 35, corruption: 1, contribution: 2 },
        { id: "exploit", label: "Khai thác dị khí", item: "linh_thach", quantity: 6, san: -5, corruption: 3, contribution: 1 }
      ]
    },
    {
      id: "linh_mach_nghich_luu", name: "Linh Mạch Nghịch Lưu", category: "di_trieu", weight: 4, cooldownDays: 22,
      phases: [
        { id: "omen", durationDays: 2, modifiers: {}, text: "Địa mạch rền như có vật khổng lồ trở mình dưới đất." },
        { id: "active", durationDays: 3, modifiers: { cultivationMult: 0.75, searchRiskDelta: 0.12, searchRewardMult: 1.5 }, text: "Linh khí chảy ngược, tu hành khó khăn nhưng khoáng mạch trồi lên." },
        { id: "aftermath", durationDays: 2, modifiers: { cultivationMult: 1.1 }, text: "Địa mạch ổn định lại trong một nhịp thở sâu." }
      ],
      choices: [
        { id: "stabilize", label: "Ổn định địa mạch", merit: 5, contribution: 3 },
        { id: "mine", label: "Đào Linh Thạch", item: "linh_thach", quantity: 8, corruption: 1, contribution: 2 },
        { id: "study", label: "Quan sát quy luật nghịch lưu", exp: 45, san: -3, contribution: 2 }
      ]
    },
    {
      id: "bao_linh_khi", name: "Bão Linh Khí", category: "natural_disaster", weight: 3, cooldownDays: 18,
      phases: [
        { id: "omen", durationDays: 1, modifiers: {}, text: "Mây linh khí xoắn thành một con mắt đục trên tầng trời." },
        { id: "active", durationDays: 2, modifiers: { combatPowerByElement: { loi: 1.2, phong: 1.1 }, travelRiskDelta: 0.15, searchRewardMult: 1.2 }, text: "Bão Linh Khí quét qua đường đi và xé mở các hốc đá cổ." },
        { id: "aftermath", durationDays: 1, modifiers: {}, text: "Cơn bão tan, những vết nứt vẫn phát sáng yếu ớt." }
      ],
      choices: [
        { id: "rescue", label: "Cứu người mắc kẹt", merit: 4, contribution: 3 },
        { id: "salvage", label: "Thu gom khoáng lộ thiên", item: "linh_thach", quantity: 5, contribution: 1 }
      ]
    },
    {
      id: "ta_than_tien_trieu", name: "Tà Thần Tiền Triệu", category: "tainted_omen", weight: 1, cooldownDays: 90,
      phases: [
        { id: "omen", durationDays: 4, modifiers: { marketPriceMult: 1.15, sanDrainMult: 1.1 }, text: "Các vì sao đồng loạt lệch khỏi quỹ đạo mà người phàm vẫn gọi là đúng." },
        { id: "active", durationDays: 3, modifiers: { encounterChanceMult: 1.25, sanDrainMult: 1.35, marketPriceMult: 1.3 }, text: "Một ý niệm cổ xưa lướt qua mọi sinh linh đang mơ." },
        { id: "aftermath", durationDays: 3, modifiers: { sanDrainMult: 1.1 }, text: "Thế giới giả vờ rằng chưa từng có gì thức dậy." }
      ],
      choices: [
        { id: "ward", label: "Dựng pháp đàn phòng hộ", merit: 6, itemCost: { linh_thach: 5 }, contribution: 3 },
        { id: "listen", label: "Lắng nghe tiếng gọi", exp: 60, san: -10, corruption: 5, contribution: 2 }
      ]
    }
  ];

  const techniqueEvolutions = {
    kiem_khi_so_cap: [
      { id: "doan_niem", name: "Đoạn Niệm Kiếm Khí", trial: "elite", modifiers: { powerMult: 1.18, manaCostMult: 1.1 }, tradeoff: "Uy lực cao hơn nhưng tốn Linh Khí." },
      { id: "ho_tam", name: "Hộ Tâm Kiếm Khí", trial: "cultivation", modifiers: { powerMult: 1.05, sanCostMult: 0.7, manaCostMult: 0.9 }, tradeoff: "Ổn định, tiết kiệm và hộ tâm." }
    ],
    tam_phap_dan_dien: [
      { id: "hai_nap", name: "Hải Nạp Đan Điền", trial: "cultivation", modifiers: { cultivationMult: 1.12, qiRecoveryMult: 1.08 }, tradeoff: "Thiên về tích lũy lâu dài." },
      { id: "nghich_tuc", name: "Nghịch Tức Đan Điền", trial: "elite", modifiers: { cultivationMult: 1.18, sanDrainMult: 1.1 }, tradeoff: "Tu nhanh hơn nhưng tâm cảnh bất ổn." }
    ],
    cam_thuat_huyet_te: [
      { id: "huyet_no", name: "Huyết Nộ", trial: "elite", modifiers: { powerMult: 1.25, corruptionCostMult: 1.2 }, tradeoff: "Cực mạnh, phản phệ sâu." },
      { id: "huyet_an", name: "Huyết Ẩn", trial: "cultivation", modifiers: { powerMult: 1.08, corruptionCostMult: 0.75 }, tradeoff: "Giảm phản phệ, đổi lấy uy lực." }
    ]
  };

  const guildTechniquePolicies = [
    { id: "guild_manual_training", guildId: "*", revision: 1, rankMin: 0, appliesTo: "guild_taught", modifiers: { masteryGainPct: 5 }, caps: { masteryGainPct: 10 } },
    { id: "guild_inner_training", guildId: "*", revision: 1, rankMin: 1, modifiers: { masteryGainPct: 5 }, caps: { masteryGainPct: 10 } },
    { id: "guild_elemental_array_support", guildId: "*", revision: 1, rankMin: 2, appliesTo: "formation_support", elements: ["kim", "moc", "thuy", "hoa", "tho"], modifiers: { combatPowerPct: 5 }, caps: { combatPowerPct: 5 } }
  ];

  const heavenlyTreasures = [
    { id: "linh_tuyen", name: "Linh Tuyền", element: "thuy", rarity: "uncommon", baseAmount: 2, stat: "comprehension", years: [100, 1000, 10000], yearWeights: [72, 24, 4], tierMultipliers: { 100: 1, 1000: 2.5, 10000: 5 }, minRealmLevel: 1 },
    { id: "dia_nhu", name: "Địa Nhũ", element: "tho", rarity: "uncommon", baseAmount: 2, stat: "basePhy", years: [100, 1000, 10000], yearWeights: [72, 24, 4], tierMultipliers: { 100: 1, 1000: 2.5, 10000: 5 }, minRealmLevel: 1 },
    { id: "nhan_sam", name: "Nhân Sâm", element: "moc", rarity: "uncommon", baseAmount: 5, stat: "lifespanConsumableBonus", years: [100, 1000, 10000], yearWeights: [72, 24, 4], tierMultipliers: { 100: 1, 1000: 2.5, 10000: 5 }, minRealmLevel: 1 },
    { id: "bach_bang", name: "Bách Băng", element: "thuy", rarity: "uncommon", baseAmount: 10, stat: "san", years: [100, 1000, 10000], yearWeights: [72, 24, 4], tierMultipliers: { 100: 1, 1000: 2.5, 10000: 5 }, minRealmLevel: 1 },
    { id: "loi_truc", name: "Lôi Trúc", element: "hoa", rarity: "rare", baseAmount: 3, stat: "lightningTribulationBonus", years: [100, 1000, 10000], yearWeights: [72, 24, 4], tierMultipliers: { 100: 1, 1000: 2.5, 10000: 5 }, minRealmLevel: 1 },
    { id: "tu_dan", name: "Tử Đàn", element: "tho", rarity: "rare", baseAmount: 3, stat: "daoTam", years: [100, 1000, 10000], yearWeights: [72, 24, 4], tierMultipliers: { 100: 1, 1000: 2.5, 10000: 5 }, minRealmLevel: 1 },
    { id: "bat_than_moc", name: "Bát Thần Mộc", element: "moc", rarity: "rare", baseAmount: 2, stat: "maxQiPct", years: [100, 1000, 10000], yearWeights: [72, 24, 4], tierMultipliers: { 100: 1, 1000: 2.5, 10000: 5 }, minRealmLevel: 1 }
  ];

  const professionDefinitions = {
    luyen_dan: { id: "luyen_dan", name: "Luyện Đan Sư", relatedPaths: ["dan_dao"], recipes: ["tu_khi_dan", "hoan_huyet_dan", "dien_tho_dan_ha"] },
    luyen_khi: { id: "luyen_khi", name: "Luyện Khí Sư", relatedPaths: ["kiem_dao", "khoi_loi_dao"], recipes: ["procedural_artifact", "repair_heirloom"] },
    tran_phap: { id: "tran_phap", name: "Trận Pháp Sư", relatedPaths: ["phong_thuy_dao", "phu_dao"], recipes: ["gathering_formation", "ward_formation"] },
    tuong_su: { id: "tuong_su", name: "Tướng Sư", relatedPaths: ["tinh_tuong_dao"], recipes: ["read_npc", "read_fate"] }
  };

  const contractTemplates = [
    { id: "hunt", name: "Truy Săn", outcome: "kill", reward: { exp: 40, merit: 2 } },
    { id: "capture", name: "Bắt Sống", outcome: "capture", reward: { exp: 30, merit: 4 } },
    { id: "investigate", name: "Điều Tra", outcome: "search", reward: { exp: 25, merit: 3 } },
    { id: "escort", name: "Hộ Tống", outcome: "travel", reward: { exp: 30, merit: 4 } },
    { id: "retrieve", name: "Thu Hồi", outcome: "item", reward: { exp: 20, merit: 2, item: "linh_thach", quantity: 3 } }
  ];

  const fateEvolutionBranches = [
    { id: "thuan_dien", name: "Thuận Diễn · Hợp Đạo", scoreDelta: 2, positiveMult: 1.10, requiresCompatibility: 8, description: "Cùng Con Đường cộng hưởng, mọi hiệu ứng dương tăng 10%." },
    { id: "nghich_dien", name: "Nghịch Diễn · Đoạt Mệnh", scoreDelta: 3, primaryMult: 1.18, fateDebt: 1, corruptionOnBreakthrough: 2, dangerous: true, description: "Đoạt thêm uy lực bằng Mệnh Nợ và phản phệ khi Đột Phá." },
    { id: "quy_nguyen", name: "Quy Nguyên · Hóa Linh", scoreDelta: 0, positiveMult: 1.05, negativeMult: 0.75, description: "Điều hòa cát hung, giảm một phần tác dụng bất lợi." }
  ];

  const guildProjects = [
    { id: "repair_vein", name: "Tu Sửa Linh Mạch", durationDays: 12, target: 30, reward: { cultivationMult: 1.1, durationDays: 15 } },
    { id: "mountain_ward", name: "Dựng Hộ Sơn Trận", durationDays: 15, target: 40, reward: { sanDrainMult: 0.85, durationDays: 20 } },
    { id: "lost_art", name: "Truy Tìm Bí Pháp", durationDays: 18, target: 50, reward: { techniqueTrialToken: 1 } }
  ];

  const hiddenRealms = [
    { id: "co_mo_vo_danh", name: "Cổ Mộ Vô Danh", parentNodeId: "co_mieu", durationDays: 5, cycleDays: 60, unlock: { type: "visited", value: "co_mieu" }, reward: { exp: 120, merit: 8 } },
    { id: "tinh_hai_bi_canh", name: "Tinh Hải Bí Cảnh", parentNodeId: "van_phong", durationDays: 4, cycleDays: 90, unlock: { type: "path", value: "tinh_tuong_dao" }, reward: { exp: 160, merit: 10 } }
  ];

  const codexDefinitions = Array.from({ length: 7 }, (_, index) => ({
    id: "ta_than_codex_" + String(index + 1).padStart(2, "0"), index: index + 1,
    name: "Cổ Tịch Tà Thần " + ["I", "II", "III", "IV", "V", "VI", "VII"][index],
    // Exactly one codex fragment per major region. Never duplicate a region.
    mapId: ["trung_vuc", "nam_chuong", "bac_nguyen", "vo_tan_hai", "tay_mac", "thien_khong_vuc", "u_minh_gioi"][index],
    clue: "Một mảnh ký hiệu tà thần ẩn trong Dị Thể; cần điều tra và đối chiếu trước khi thu thập.",
    unlocksHiddenProfession: ["nguoi_giai_mong", "doc_gia_co_tich", "nguoi_dan_duong", "tho_san_di_trieu", "nguoi_giu_cua", "thay_tuong_menh", "hanh_gia_vo_danh"][index]
  }));
  const hiddenProfessions = {
    nguoi_giai_mong: { id: "nguoi_giai_mong", name: "Người Giải Mộng", requiresCodex: 1, actionName: "Giải Mộng", actionCost: { san: 2 }, cooldownDays: 3, passive: { sanDrainMult: 0.95 }, description: "Đọc dư âm giấc mộng để hồi phục tâm cảnh và tìm manh mối." },
    doc_gia_co_tich: { id: "doc_gia_co_tich", name: "Độc Giả Cổ Tịch", requiresCodex: 2, actionName: "Chú Giải Cổ Văn", actionCost: { san: 3 }, cooldownDays: 3, passive: { clueConfidence: 0.15 }, description: "Chú giải một manh mối chưa xác minh trong Dị Thể." },
    nguoi_dan_duong: { id: "nguoi_dan_duong", name: "Người Dẫn Đường Dị Giới", requiresCodex: 3, actionName: "Định Tuyến Dị Lộ", actionCost: { stamina: 5 }, cooldownDays: 2, passive: { travelRiskDelta: -0.05 }, description: "Định tuyến an toàn qua vùng linh khí hỗn loạn." },
    tho_san_di_trieu: { id: "tho_san_di_trieu", name: "Thợ Săn Dị Triều", requiresCodex: 4, actionName: "Truy Dấu Dị Triều", actionCost: { stamina: 8 }, cooldownDays: 2, passive: { searchRewardMult: 1.08 }, description: "Truy dấu mục tiêu hiếm và tăng hiệu quả tìm kiếm." },
    nguoi_giu_cua: { id: "nguoi_giu_cua", name: "Người Giữ Cửa", requiresCodex: 5, actionName: "Niêm Phong Giới Môn", actionCost: { qi: 10 }, cooldownDays: 5, passive: { encounterChanceMult: 0.92 }, description: "Tạm thời ổn định cổng giới và giảm nguy cơ gặp địch." },
    thay_tuong_menh: { id: "thay_tuong_menh", name: "Thầy Tướng Mệnh", requiresCodex: 6, actionName: "Soi Mệnh Tuyến", actionCost: { merit: 2 }, cooldownDays: 4, passive: { fortuneFlat: 3 }, description: "Soi rõ một nhánh thiên cơ trong vài ngày." },
    hanh_gia_vo_danh: { id: "hanh_gia_vo_danh", name: "Hành Giả Vô Danh", requiresCodex: 7, actionName: "Vô Danh Hành", actionCost: { san: 5, stamina: 5 }, cooldownDays: 7, passive: { cultivationMult: 1.08 }, description: "Bước ngoài danh tính để nhận một lần gia trì tu luyện." },
    cuong_ngon_gia: { id: "cuong_ngon_gia", name: "Cuong Ngon Gia", kind: "tu_tich", linkedTaThanId: "ta_than_tien_trieu", requiresCodex: 2, actionName: "Cuong Ngon", actionCost: { san: 4 }, cooldownDays: 4, passive: { dialoguePressure: 0.1 }, failPolicy: "false_clue", description: "Dùng lời nói cưỡng ép để làm chao đảo ý chí NPC; thất bại để lại nghi ngờ." },
    thuc_canh_su: { id: "thuc_canh_su", name: "Thuc Canh Su", kind: "tu_tich", linkedTaThanId: "ta_than_tien_trieu", requiresCodex: 3, actionName: "Thuc Canh", actionCost: { san: 5, corruption: 2 }, cooldownDays: 5, passive: { nodeCorruptionSense: 0.2 }, failPolicy: "corruption_scar", description: "Nhìn xuyên lớp cảnh giả của node và kéo một phần ô nhiễm về thân mình." },
    huyen_anh_su: { id: "huyen_anh_su", name: "Huyen Anh Su", kind: "tu_tich", linkedTaThanId: "ta_than_tien_trieu", requiresCodex: 4, actionName: "Huyen Anh", actionCost: { qi: 8, san: 3 }, cooldownDays: 5, passive: { illusionAvoidance: 0.12 }, failPolicy: "false_clue", description: "Dựng một ảnh ảo chiến đấu ngắn ngủi để đánh lạc hướng NPC và đối thủ." },
    vong_nga_su: { id: "vong_nga_su", name: "Vong Nga Su", kind: "tu_tich", linkedTaThanId: "ta_than_tien_trieu", requiresCodex: 5, actionName: "Vong Nga", actionCost: { san: 6, corruption: 3 }, cooldownDays: 6, passive: { memoryRiskReduction: 0.15 }, failPolicy: "memory_scar", description: "Gọi vọng âm của người đã chết; nhận thông tin nhưng có nguy cơ mất mảnh ký ức." }
  };
  const professionItems = {
    phuong_thuoc: { id: "phuong_thuoc", name: "Phương Thuốc", kind: "profession_item", professionId: "luyen_dan", desc: "Mở công thức luyện đan cơ bản." },
    ban_do_tinh_tu: { id: "ban_do_tinh_tu", name: "Bản Đồ Tinh Tú", kind: "profession_item", professionId: "tuong_su", desc: "Tăng độ chính xác khi xem quẻ." },
    phuong_phap_chiem_tinh: { id: "phuong_phap_chiem_tinh", name: "Phương Pháp Chiêm Tinh", kind: "profession_item", professionId: "tuong_su", desc: "Mở hành động đối chiếu thiên tượng." }
  };
  const achievementDefinitions = {
    set_ba_vuong: { id: "set_ba_vuong", name: "Bá Vương Toàn Bộ", type: "equipment_set", equipmentSetId: "Bá Vương", setName: "Bá Vương", requiredCount: 2, requiredSlots: ["artifact", "protection"], bonus: { combatPowerMult: 0.12, phyDef: 3 } },
    set_thien_menh: { id: "set_thien_menh", name: "Thiên Mệnh Hội Tụ", type: "equipment_set", equipmentSetId: "Thiên Mệnh", setName: "Thiên Mệnh", requiredCount: 2, requiredSlots: ["artifact", "personal"], bonus: { fortuneFlat: 8, cultivationMult: 0.08 } },
    profession_luyen_dan: { id: "profession_luyen_dan", name: "Bách Luyện Thành Đan", type: "profession", professionId: "luyen_dan", masteryStage: 3 },
    profession_tuong_su: { id: "profession_tuong_su", name: "Thông Thiên Tướng Nhãn", type: "profession", professionId: "tuong_su", masteryStage: 3 },
    codex_complete: { id: "codex_complete", name: "Bảy Quyển Tà Thần", type: "collection", target: 7 }
  };
  const companionSkills = {
    guard_bite: { id: "guard_bite", roles: ["striker"], powerMultiplier: 1, loyaltyDamagePct: 8, description: "Đòn cận chiến ổn định, tăng nhẹ theo trung thành." },
    scout_strike: { id: "scout_strike", roles: ["scout"], powerMultiplier: 0.9, loyaltyDamagePct: 10, description: "Đòn đánh nhanh của trinh sát, tăng theo trung thành." }
  };

  window.EXPANSION_DATA = {
    version: 1,
    worldEvents,
    techniqueEvolutions,
    guildTechniquePolicies,
    heavenlyTreasures,
    professionDefinitions,
    contractTemplates,
    fateEvolutionBranches,
    guildProjects,
    hiddenRealms,
    codexDefinitions,
    hiddenProfessions,
    professionItems,
    achievementDefinitions,
    companionSkills,
    seasons: [
      { id: "xuan", name: "Xuân", element: "moc" },
      { id: "ha", name: "Hạ", element: "hoa" },
      { id: "thu", name: "Thu", element: "kim" },
      { id: "dong", name: "Đông", element: "thuy" }
    ],
    weather: ["quang", "mua", "suong", "loi_vu", "linh_phong"]
  };
})();
