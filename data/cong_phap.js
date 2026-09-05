/* Canonical Công Pháp data — HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md. */
(function () {
  "use strict";

  const masteryStages = ["Nhập Môn", "Tiểu Thành", "Đại Thành", "Viên Mãn", "Đại Viên Mãn"];
  const masteryMultipliers = [0.6, 0.8, 1, 1.15, 1.3];
  const masteryThresholds = [0, 100, 300, 700, 1500];

  const techniques = {
    kiem_khi_so_cap: {
      id: "kiem_khi_so_cap", name: "Kiếm Khí Sơ Cấp", category: "chieu_thuc", family: "thuong",
      grade: "pham", quality: "ha", element: "kim", minRealmLevel: 1,
      spiritualRootRequirements: [], isCore: false,
      visibleStats: { powerCoefficient: 0.6, manaCost: 12, staminaCost: 5, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 10, castTimeSeconds: 1, baseEffect: "Kiếm khí trực tiếp" },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    tam_phap_dan_dien: {
      id: "tam_phap_dan_dien", name: "Dẫn Khí Tâm Pháp", category: "tam_phap", family: "thuong",
      grade: "pham", quality: "ha", element: "tho", minRealmLevel: 1,
      spiritualRootRequirements: [], isCore: false,
      visibleStats: { powerCoefficient: 0.6, manaCost: 0, staminaCost: 0, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 0, castTimeSeconds: 0, baseEffect: "Bị động tăng 5% Thể phách/Linh lực và hiệu quả tu luyện", allStatMultiplier: 0.05 },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    hon_hoa_chuong: {
      id: "hon_hoa_chuong", name: "Hồn Hỏa Chưởng", category: "chieu_thuc", family: "thuong",
      grade: "hoang", quality: "trung", element: "hoa", minRealmLevel: 2,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 1.1, manaCost: 20, staminaCost: 7, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 15, castTimeSeconds: 2, baseEffect: "Hỏa diễm thiêu đốt" },
      hiddenAttributes: [{ revealCondition: { masteryStageAtLeast: 2 }, attribute: "Đòn đánh gây thêm thiêu đốt", isBeneficial: true }],
      corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    than_phap_phi_van: {
      id: "than_phap_phi_van", name: "Thân Pháp Phi Vân", category: "than_phap", family: "thuong",
      grade: "pham", quality: "ha", element: "moc", minRealmLevel: 1,
      spiritualRootRequirements: [], isCore: false,
      visibleStats: { powerCoefficient: 0.6, manaCost: 10, staminaCost: 4, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 15, castTimeSeconds: 1, baseEffect: "Tăng né tránh trong một lượt" },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    thien_dao_ho_the: {
      id: "thien_dao_ho_the", name: "Thiên Đạo Hộ Thể", category: "tam_phap", family: "thien_dao_thuat",
      requiredFaction: "loyal_heaven", grade: "thien", quality: "ha", element: "vo_he", minRealmLevel: 5,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 4.5, manaCost: 0, staminaCost: 0, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 0, castTimeSeconds: 0, baseEffect: "Bị động gia trì toàn bộ chỉ số", allStatMultiplier: 0.12 },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    cam_thuat_huyet_te: {
      id: "cam_thuat_huyet_te", name: "Huyết Tế Cấm Thuật", category: "cam_thuat", family: "cam_thuat",
      requiredFaction: "rebel_heaven", grade: "cam_thuat", quality: null, element: "di_he", minRealmLevel: 4,
      spiritualRootRequirements: [], isCore: false,
      visibleStats: { powerCoefficient: 6, manaCost: 30, staminaCost: 15, corruptionCost: 4, sanCost: 5, lifespanCost: 1, cooldownSeconds: 20, castTimeSeconds: 2, baseEffect: "Đổi sinh lực lấy sát thương" },
      hiddenAttributes: [], corruptionProfile: { baseCorruptionGainPerUse: 4 }, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    nguyen_thuat_can_bang: {
      id: "nguyen_thuat_can_bang", name: "Nguyên Thuật Cân Bằng", category: "chieu_thuc", family: "nguyen_thuat",
      requiredFaction: "neutral", grade: "tien", quality: "ha", element: "vo_he", minRealmLevel: 6,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 8, manaCost: 16, staminaCost: 4, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 15, castTimeSeconds: 2, baseEffect: "Khắc chế cân bằng Thiên Đạo Thuật và Cấm Thuật" },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    tong_mon_noi_tuc: {
      id: "tong_mon_noi_tuc", name: "Tông Môn Nội Tức", category: "tam_phap", family: "thuong",
      grade: "hoang", quality: "trung", element: "vo_he", minRealmLevel: 2,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 0.8, manaCost: 0, staminaCost: 0, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 0, castTimeSeconds: 0, baseEffect: "Tông môn truyền thụ pháp môn điều tức nhập môn, giúp căn cơ thêm vững.", allStatMultiplier: 0.08 },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    thanh_phong_kiem_quyet: {
      id: "thanh_phong_kiem_quyet", name: "Thanh Phong Kiếm Quyết", category: "chieu_thuc", family: "thuong",
      grade: "hoang", quality: "trung", element: "kim", minRealmLevel: 2,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 1.25, manaCost: 16, staminaCost: 6, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 12, castTimeSeconds: 1, baseEffect: "Kiếm thế thanh linh, lấy nhanh phá chậm." },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    bich_moc_hoi_xuan: {
      id: "bich_moc_hoi_xuan", name: "Bích Mộc Hồi Xuân", category: "phu_tro", family: "thuong",
      grade: "hoang", quality: "trung", element: "moc", minRealmLevel: 2,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 0.9, manaCost: 18, staminaCost: 3, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 16, castTimeSeconds: 2, baseEffect: "Mượn mộc linh ôn dưỡng kinh mạch và khí huyết." },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    huyen_mon_tran_giai: {
      id: "huyen_mon_tran_giai", name: "Huyền Môn Trận Giải", category: "tran_phap", family: "thuong",
      grade: "hoang", quality: "trung", element: "tho", minRealmLevel: 2,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 1.1, manaCost: 20, staminaCost: 4, corruptionCost: 0, sanCost: 0, lifespanCost: 0, cooldownSeconds: 18, castTimeSeconds: 2, baseEffect: "Lấy trận văn dẫn địa khí, thủ thế rồi phản kích." },
      hiddenAttributes: [], corruptionProfile: null, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    },
    huyet_sat_bi_luc: {
      id: "huyet_sat_bi_luc", name: "Huyết Sát Bí Lục", category: "cam_thuat", family: "cam_thuat",
      grade: "huyen", quality: "trung", element: "di_he", minRealmLevel: 3,
      spiritualRootRequirements: [], isCore: true,
      visibleStats: { powerCoefficient: 2.2, manaCost: 18, staminaCost: 8, corruptionCost: 1, sanCost: 2, lifespanCost: 0, cooldownSeconds: 15, castTimeSeconds: 1, baseEffect: "Dẫn sát ý nhập huyết, đổi tâm thần lấy uy lực." },
      hiddenAttributes: [], corruptionProfile: { baseCorruptionGainPerUse: 1 }, mastery: { stage: 0, exp: 0, usageCount: 0 }, evolutionPaths: []
    }
  };

  window.CONG_PHAP_DATA = { techniques, masteryStages, masteryMultipliers, masteryThresholds };
})();
