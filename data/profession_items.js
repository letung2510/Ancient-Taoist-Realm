/* Catalog độc lập cho vật phẩm nghề nghiệp. Không trộn với loot table thường. */
(function () {
  "use strict";
  window.PROFESSION_ITEMS_SCHEMA_VERSION = 2;
  window.PROFESSION_ITEMS = {
    phuong_thuoc: { id: "phuong_thuoc", name: "Phương Thuốc", kind: "profession_item", professionId: "luyen_dan", action: "ghi_nho_cong_thuc", charges: 3, cooldownDays: 1, recipe: { linh_thach: 2 }, effect: { alchemyChance: 0.12 }, desc: "Ghi lại một phương thuốc; dùng để tăng xác suất luyện đan." },
    ban_do_tinh_tu: { id: "ban_do_tinh_tu", name: "Bản Đồ Tinh Tú", kind: "profession_item", professionId: "tuong_su", action: "doi_chieu_tinh_tu", charges: 3, cooldownDays: 1, recipe: { linh_thach: 2 }, effect: { divinationConfidence: 0.2 }, desc: "Đối chiếu thiên tượng để tăng độ rõ của quẻ." },
    phuong_phap_chiem_tinh: { id: "phuong_phap_chiem_tinh", name: "Phương Pháp Chiêm Tinh", kind: "profession_item", professionId: "tuong_su", action: "chiem_tinh", charges: 5, effect: { clueConfidence: 0.15 }, desc: "Một phương pháp chiêm tinh giúp soi rõ manh mối." },
    ban_ve_linh_khi: { id: "ban_ve_linh_khi", name: "Bản Vẽ Linh Khí", kind: "profession_item", professionId: "luyen_khi", action: "phan_tich_phap_khi", charges: 3, effect: { craftQuality: 0.15 }, desc: "Bản vẽ dùng để phân tích và sửa chữa pháp khí." },
    so_tay_tran_van: { id: "so_tay_tran_van", name: "Sổ Tay Trận Văn", kind: "profession_item", professionId: "tran_phap", action: "ghi_tran_van", charges: 3, effect: { formationDuration: 2 }, desc: "Sổ tay giúp kéo dài hiệu lực trận pháp." }
  };
})();
