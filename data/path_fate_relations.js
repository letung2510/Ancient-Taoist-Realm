/* Runtime bridge for data/path_fate_relations.json. */
(function () {
  "use strict";
  window.PATH_FATE_RELATIONS = {
    hidden_fates: {
      luan_hoi_tien: { roll_probability_percent: 0.0000075, exclusive_profession: "luan_hoi_tien", natural_death_only: true, quest_required: "ky_uc_qua_ba_kiep" },
      thon_phe_thien_dao: { name: "Thôn Phệ Thiên Đạo", unlock_realm_tier: 13, required_paths: ["tinh_tuong_dao", "phong_thuy_dao"], requires_final_conflict_preparation: true, requires_tainted_god_defeat: true, excluded_paths: ["ngoai_dao_gia"] }
    },
    tainted_intervention: { attention_tier: 5, faction_tier: 8, quest_tier: 8, final_conflict_tier: 13, player_selects_vocation: true, excluded_paths: ["ngoai_dao_gia"], excluded_professions: ["luan_hoi_tien"], vocations: ["blessing", "suspicion", "indifference"], faction_multipliers: { loyal_heaven: { suspicion: 2 }, neutral: { indifference: 2 } }, neutral_potentials_by_tier: { 8: "an_the", 11: "chan_gia", 13: "chi_ton" }, quest_merit_range: [1, 3], rebel_exp_multiplier: 0.8, neutral_pursuit_rate: 0.5 },
    paths: {
      kiem_dao: { lead: ["kim", "kiếm", "sát"], support: ["phong", "lôi", "chiến"], forbidden: ["mộng", "ảo", "nô"] },
      dan_dao: { lead: ["đan", "dược", "hỏa"], support: ["sinh", "mộc", "lô"], forbidden: ["độc", "hàn", "tử"] },
      phu_dao: { lead: ["phù", "ấn", "văn"], support: ["lôi", "hỏa", "kim"], forbidden: ["câm", "vô danh"] },
      phong_thuy_dao: { lead: ["địa", "sơn", "thủy"], support: ["trận", "long", "huyệt"], forbidden: ["vực", "hư vô"] },
      ngu_thu_dao: { lead: ["thú", "yêu", "huyết"], support: ["sinh", "sơn", "nguyên"], forbidden: ["diệt", "độc"] },
      khoi_loi_dao: { lead: ["khôi", "cơ", "hồn"], support: ["kim", "mộc", "ấn"], forbidden: ["sinh", "mộng"] },
      am_luat_dao: { lead: ["âm", "hồn", "tử"], support: ["mộng", "nguyệt", "nhạc"], forbidden: ["lôi", "quang"] },
      mong_canh_dao: { lead: ["mộng", "tâm", "ảo"], support: ["nguyệt", "hồn", "vô"], forbidden: ["kiếm", "sát"] },
      luyen_the_dao: { lead: ["thể", "huyết", "cốt"], support: ["lôi", "hỏa", "sơn"], forbidden: ["hồn", "mộng"] },
      tinh_tuong_dao: { lead: ["tinh", "thiên", "mệnh"], support: ["nhật", "nguyệt", "địa"], forbidden: ["vô danh", "đoạn mệnh"] },
      ngoai_dao_gia: { lead: [], support: [], forbidden: [], unbound: true, exp_multiplier: 5, fate_threshold_multiplier: 2, check_difficulty_bonus: 15, excluded_from_tainted_system: true }
    },
    path_titles: {
      kiem_dao: ["Di Mệnh Cảnh", "Mầm Gươm Thức Tỉnh", "Thai Kiếm Tàng Phong", "Kiếm Tâm Đúc Ấn", "Vạn Nhận Hóa Linh", "Tàng Kiếm Vực Chủ", "Hư Không Trảm Bộ", "Nhất Kiếm Thành Luật", "Cửu Kiếp Phá Thiên", "Nhân Quả Kiếm Quân", "Ngoại Vực Kiếm Thánh", "Bất Diệt Kiếm Cốt", "Thái Ất Trảm Mệnh", "Vô Thượng Kiếm Tổ"],
      dan_dao: ["Di Mệnh Cảnh", "Linh Hỏa Nhập Lô", "Dược Thai Kết Châu", "Sinh Đan Huyền Chủ", "Bách Thảo Hóa Hồn", "Vạn Dược Tôn Sư", "Đan Hải Du Tiên", "Sinh Tử Đồng Luyện", "Cửu Lô Độ Ách", "Tạo Hóa Đan Vương", "Vực Ngoại Dược Thánh", "Bất Hủ Linh Dược", "Thái Ất Hồi Sinh", "Vạn Sinh Đan Tổ"],
      phu_dao: ["Di Mệnh Cảnh", "Linh Văn Sơ Hiện", "Phù Thai Kết Chú", "Cửu Ấn Minh Sư", "Hộ Phách Phù Linh", "Vạn Pháp Chú Vực", "Hư Không Hành Văn", "Nhất Ngôn Thành Luật", "Lôi Kiếp Thiên Thư", "Mệnh Phù Tôn Giả", "Ngoại Thiên Chân Lục", "Bất Hủy Kim Văn", "Thái Ất Sắc Mệnh", "Vô Cực Phù Tổ"],
      phong_thuy_dao: ["Di Mệnh Cảnh", "Tầm Long Khởi Bộ", "Huyệt Nhãn Sinh Căn", "Sơn Hà Trấn Ấn", "Địa Linh Hiển Tướng", "Long Mạch Chưởng Sư", "Hư Địa Du Long", "Càn Khôn Chuyển Mạch", "Vạn Sơn Địa Kiếp", "Sơn Hà Định Chủ", "Thiên Ngoại Địa Tiên", "Bất Động Long Cốt", "Thái Ất Định Thế", "Đại Địa Đạo Tôn"],
      ngu_thu_dao: ["Di Mệnh Cảnh", "Linh Thú Kết Duyên", "Huyết Khế Đồng Sinh", "Bách Thú Hiệu Lệnh", "Hoang Linh Hóa Tướng", "Vạn Linh Ngự Chủ", "Dị Giới Thú Hành", "Tổ Huyết Quy Nhất", "Hoang Cổ Thú Kiếp", "Vạn Loài Cộng Chủ", "Thiên Ngoại Thú Hoàng", "Bất Tử Tổ Huyết", "Thái Ất Linh Vương", "Vạn Thú Nguyên Tổ"],
      khoi_loi_dao: ["Di Mệnh Cảnh", "Cơ Tâm Khởi Động", "Linh Mộc Thành Khu", "Thiên Cơ Tạo Ấn", "Khôi Hồn Tự Thức", "Vạn Cơ Điều Ngự", "Hư Vực Cơ Hành", "Cơ Luật Đồng Quy", "Khôi Thành Độ Kiếp", "Thiên Cơ Chúa Tể", "Ngoại Vực Cơ Thần", "Bất Hoại Khôi Thân", "Thái Ất Cơ Mệnh", "Vô Tận Khôi Tổ"],
      am_luat_dao: ["Di Mệnh Cảnh", "Nhất Âm Khai Hồn", "U Khúc Dưỡng Phách", "Minh Thanh Trấn Ấn", "Vong Ca Dẫn Linh", "U Minh Nhạc Tướng", "Hư Âm Độ Giới", "Vạn Thanh Quy Luật", "Thiên Khúc Hồn Kiếp", "U Minh Nhạc Đế", "Ngoại Vực Âm Thánh", "Bất Diệt Hồn Ca", "Thái Ất Tịch Thanh", "Vô Thanh Nhạc Tổ"],
      mong_canh_dao: ["Di Mệnh Cảnh", "Mộng Nhãn Sơ Khai", "Tâm Ảnh Kết Thai", "Nguyệt Mộng Chân Nhân", "Thiên Mộng Hóa Linh", "Mộng Hải Dệt Sư", "Vô Gian Du Mộng", "Chân Huyễn Đồng Quy", "Vạn Mộng Tâm Kiếp", "Mộng Giới Quân Vương", "Ngoại Cảnh Chân Mộng", "Bất Tỉnh Mộng Thân", "Thái Ất Huyễn Mệnh", "Vĩnh Dạ Mộng Tổ"],
      luyen_the_dao: ["Di Mệnh Cảnh", "Khí Huyết Khai Môn", "Thiết Cốt Dựng Thân", "Kim Cương Tạo Thể", "Bất Khuất Chiến Hồn", "Ma Khu Trấn Thế", "Phá Giới Võ Thân", "Huyết Cốt Đồng Nguyên", "Bách Luyện Thần Kiếp", "Cực Đạo Võ Tôn", "Ngoại Thiên Chiến Thánh", "Vạn Kiếp Bất Hoại", "Thái Ất Huyết Tôn", "Hỗn Nguyên Thể Tổ"],
      tinh_tuong_dao: ["Di Mệnh Cảnh", "Tinh Nhãn Quan Thiên", "Thiên Bàn Định Vị", "Nhật Nguyệt Chiêm Quan", "Tinh Hồn Giáng Thế", "Bắc Đẩu Mệnh Sư", "Tinh Hải Viễn Du", "Chư Thiên Định Quỹ", "Tinh Lạc Đại Kiếp", "Thiên Mệnh Tinh Quân", "Vực Ngoại Quan Tinh", "Bất Diệt Tinh Thể", "Thái Ất Toán Chủ", "Tinh Hải Đạo Tổ"],
      ngoai_dao_gia: ["Di Mệnh Cảnh", "Khai Lộ Cảnh", "Dựng Thai Cảnh", "Kim Ấn Cảnh", "Anh Linh Cảnh", "Thần Tính Cảnh", "Hư Giới Cảnh", "Hợp Đạo Cảnh", "Thiên Kiếp Cảnh", "Chủ Tể Cảnh", "Chân Ngoại Cảnh", "Kim Bất Hoại Cảnh", "Thái Ất Cảnh", "Đạo Ngoại Cảnh"]
    }
  };
})();
