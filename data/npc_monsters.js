(function () {
  "use strict";
  const base = (entity) => ({ entity_type: "npc", race: "Nhân Tộc", faction: null, realm: "phan_nhan", level_tier: 1,
    stats: { PHY: 10, MAG: 10, HP: 100, SAN_influence: 0 }, dialogue_id: null, quest_ids: [], loot_table_id: null,
    location_tags: [], is_hostile_by_default: false, respawn_seconds: null, ...entity });
  const entities = {
    disi_ruou_tien_nhan: base({ name: "Túy Tiên Nhân", interaction_type: "drink_challenge", appearance_weight: 0.05, disappear_after_interaction: true, location_tags: ["trung_vuc"] }),
    tathan_vo_dien_cuong_vuong: base({ entity_type: "boss", name: "Vô Diện Cuồng Vương", race: "Cổ Thần", realm: "hoa_than_so_ky", level_tier: 8,
      stats: { PHY: 2000, MAG: 5000, HP: 500000, SAN_influence: 60 }, god_domain: "Điên Loạn", min_realm: "hoa_than_so_ky",
      phases: [{ phase: 1, hp_threshold_pct: 100 }, { phase: 2, hp_threshold_pct: 60 }, { phase: 3, hp_threshold_pct: 25 }], server_wide: true }),
    ma_dau_nghich_do: base({ entity_type: "monster", name: "Ma Đầu Nghịch Đồ", race: "Nhân Tộc", level_tier: 5, is_hostile_by_default: true, stats: { PHY: 90, MAG: 70, HP: 900, SAN_influence: 8 }, nemesis: true }),
    ho_dao_gia: base({ entity_type: "monster", name: "Hộ Đạo Giả", level_tier: 6, is_hostile_by_default: true, guardian: true, stats: { PHY: 130, MAG: 90, HP: 1500, SAN_influence: 6 } }),
    phan_boi_gia: base({ entity_type: "monster", name: "Phản Bội Giả", level_tier: 6, is_hostile_by_default: true, stats: { PHY: 120, MAG: 110, HP: 1400, SAN_influence: 10 } }),
    ma_su: base({ entity_type: "monster", name: "Ma Sứ", level_tier: 7, is_hostile_by_default: true, stats: { PHY: 100, MAG: 150, HP: 1600, SAN_influence: 14 } }),
    ho_phap_huyen_lan: base({ entity_type: "monster", name: "Hộ Pháp Huyền Lân", race: "Yêu Tộc", level_tier: 4, is_hostile_by_default: true, guardian: true, stats: { PHY: 110, MAG: 40, HP: 1200, SAN_influence: 4 } }),
    nghich_thuong_nhan: base({ name: "Nghịch Thương Nhân", race: "Vô Danh", black_market: true, trade_currency: "lifespan", shop_tier: [6, 8], location_tags: ["vo_tan_hai"] }),
    luan_hoi_su_gia: base({ name: "Luân Hồi Sứ Giả", race: "U Minh", reincarnation_envoy: true, requires_lifespan_zero: true, location_tags: ["u_minh_gioi"] })
  };
  const lootTables = {
    loot_hac_lang_vuong: [{ item: "linh_thach", chance: 0.6, quantity: 2 }, { item: "dai_hoan_dan", chance: 0.25, quantity: 1 }, { fateTier: [1, 4], chance: 0.15 }],
    loot_vong_nhan_chi_nhan: [{ item: "linh_thach", chance: 0.5, quantity: 5 }, { fateTier: [6, 8], chance: 0.05 }]
  };
  window.NPC_MONSTER_DATA = { entities, lootTables, dialogueStates: ["IDLE_GREET", "CHECK_QUEST_STATE", "QUEST_OFFER", "QUEST_PROGRESS_HINT", "QUEST_TURN_IN", "GENERIC_CHAT"] };
})();
