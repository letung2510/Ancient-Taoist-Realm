/* ============================================================
 * CỔ DỊ DIỆN — Dữ liệu thế giới & cốt truyện
 * Tham chiếu: gemini-code-1788421511033.md (V11.1)
 * ============================================================ */
window.GameData = (function () {
  "use strict";

  const WORLDS = {
    co_di_dien: {
      id: "co_di_dien",
      name: "Cổ Dị Diện",
      genre: ["tiên hiệp", "eldritch", "lovecraft", "tu chân"],
      intro:
        "Thiên địa linh khí không còn thuần khiết. Tàn niệm của Cổ Thần đã thấm vào từng hơi thở của tu sĩ. Ngươi bước vào Thiên Huyền Tông — nơi ngọn núi còn giữ chút thanh minh cuối cùng."
    }
  };

  /* ---------- Cảnh giới tu vi ---------- */
  const FALLBACK_REALMS = [
    {
      id: "phan_nhan", name: "Phàm Nhân",
      minFate: 8, activeSlots: 5, lifespanBase: 75, lifespanBonus: 0,
      breakExp: 100, phyMult: 1.0, magMult: 1.0, maxQa: 40, desc: "Thân phàm, tích đủ 100 EXP hoặc dùng đan khai mạch để bước vào Luyện Khí."
    },
    {
      id: "luyen_khi", name: "Luyện Khí Kỳ",
      minFate: 20, activeSlots: 5, lifespanBonus: 50,
      breakExp: 600, phyMult: 1.2, magMult: 1.2, maxQa: 80, desc: "Dẫn khí nhập thể, khai mở đan điền."
    },
    {
      id: "truc_co", name: "Trúc Cơ Kỳ",
      minFate: 50, activeSlots: 10, lifespanBonus: 150,
      breakExp: 3000, phyMult: 1.5, magMult: 1.5, maxQa: 140, desc: "Trúc nền đạo căn, thọ nguyên đại tăng."
    },
    {
      id: "kim_dan", name: "Kim Đan Kỳ",
      minFate: 100, activeSlots: 15, lifespanBonus: 500,
      breakExp: 15000, phyMult: 2.2, magMult: 2.2, maxQa: 260, desc: "Ngưng luyện kim đan, thoát tục."
    },
    {
      id: "nguyen_anh", name: "Nguyên Anh Kỳ",
      minFate: 150, activeSlots: 20, lifespanBonus: 2000,
      breakExp: 60000, phyMult: 3.5, magMult: 3.5, maxQa: 450, desc: "Nguyên anh xuất khiếu, thần thức linh thiêng."
    },
    {
      id: "hoa_than", name: "Hóa Thần Kỳ",
      minFate: 200, activeSlots: 30, lifespanBonus: 10000,
      breakExp: Infinity, phyMult: 6.0, magMult: 6.0, maxQa: 800, desc: "Hóa thần thông thiên, gần chạm đạo quả."
    }
  ];

  const REALMS = (window.CULTIVATION_DATA?.realms || FALLBACK_REALMS).map((realm) => ({
    id: realm.id,
    name: realm.name,
    level: realm.level ?? null,
    legacyIds: realm.legacy_ids || realm.legacyIds || [],
    spawnWeight: realm.spawn_weight || 0,
    minFate: realm.min_fate ?? realm.minFate,
    minNormalFate: realm.min_normal_fate ?? realm.minNormalFate ?? 0,
    minRatioR: realm.min_ratio_R ?? realm.minRatioR ?? null,
    requiredPathScore: realm.required_path_score ?? realm.requiredPathScore ?? 0,
    requiredLeadTags: realm.required_lead_tags ?? realm.requiredLeadTags ?? 0,
    requiredCompatibleTags: realm.required_compatible_tags ?? realm.requiredCompatibleTags ?? 0,
    requiresCoreTechnique: Boolean(realm.requires_core_technique ?? realm.requiresCoreTechnique),
    requiresStableAnchor: Boolean(realm.requires_stable_anchor ?? realm.requiresStableAnchor),
    requiresActiveAnchor: Boolean(realm.requires_active_anchor ?? realm.requiresActiveAnchor),
    requiresBodyAndMind: Boolean(realm.requires_body_and_mind ?? realm.requiresBodyAndMind),
    requiresFinalVictory: Boolean(realm.requires_final_victory ?? realm.requiresFinalVictory),
    activeSlots: realm.active_slots ?? realm.activeSlots,
    lifespanBase: realm.lifespan_base ?? realm.lifespanBase ?? 75,
    lifespanBonus: realm.lifespan_bonus ?? realm.lifespanBonus,
    breakExp: Object.prototype.hasOwnProperty.call(realm, "break_exp")
      ? (realm.break_exp == null ? Infinity : realm.break_exp)
      : (realm.breakExp === "Infinity" ? Infinity : realm.breakExp),
    phyMult: realm.stat_multiplier ?? realm.phyMult,
    magMult: realm.stat_multiplier ?? realm.magMult,
    maxQa: realm.max_qi ?? realm.maxQa,
    desc: realm.description || realm.desc
  }));

  /* ---------- Môn phái / Căn cơ ---------- */
  const ARCHETYPES = [
    {
      id: "kiem_tong", name: "Kiếm Tông", desc: "Lấy kiếm nhập đạo, thể phách cường hãn.",
      portrait: "assets/characters/char_03.jpg",
      bonus: { phy: 3, mag: 1 }, startItem: "hac_thiet_kiem",
      hint: "Thiên về PHY (thể phách)"
    },
    {
      id: "huyen_co", name: "Huyền Cơ Cung", desc: "Thôi diễn thiên cơ, linh lực thâm hậu.",
      portrait: "assets/characters/char_04.jpg",
      bonus: { phy: 1, mag: 3 }, startItem: "truyen_thua_ngoc_phu",
      hint: "Thiên về MAG (linh lực)"
    },
    {
      id: "van_duoc", name: "Vạn Dược Cốc", desc: "Tinh thông dược lý, chữa lành thân tâm.",
      portrait: "assets/characters/char_10.jpg",
      bonus: { phy: 2, mag: 2 }, startItem: "boi_nguyen_dan",
      hint: "Cân bằng, nhiều đan dược"
    },
    {
      id: "am_duong", name: "Âm Dương Các", desc: "Nắm Tử Vi mệnh lý, xoay chuyển khí vận.",
      portrait: "assets/characters/char_06.jpg",
      bonus: { phy: 1, mag: 2 }, startItem: "pha_cam_phu",
      hint: "Thiên về Mệnh Số / khí vận"
    }
  ];

  /* ---------- Tử Vi Mệnh Số (9900 cách cục từ fate_data.js) ---------- */
  const FATE_PATTERNS_BASE = (typeof window !== "undefined" && window.FATE_DATA && window.FATE_DATA.length)
    ? window.FATE_DATA
    : [
        // fallback cục bộ (nếu fate_data.js chưa được nạp)
        { id: "tu_phu", name: "Tử Phủ Đồng Cung", sign: "cat", grade: "kim", score: 18,
          effects: { fortune: 100, breakBonus: 0.2, resistPossession: true },
          desc: "Khí vận +100, +20% đột phá, kháng đoạt xá." },
        { id: "nhat_xuat", name: "Nhật Xuất Đản Diêu", sign: "cat", grade: "tim", score: 12,
          effects: { fortune: 50, lightFireMult: 1.5, sanResist: 0.3 },
          desc: "Khí vận +50, x1.5 sát thương Quang/Hỏa, kháng 30% SAN drain." }
      ];
  const FATE_PATTERNS = FATE_PATTERNS_BASE.concat([{ id: "luan_hoi_tien", name: "Luân Hồi Tiên", sign: "cat", grade: "tien", tier: 8, score: 0,
    type: "Nghề Ẩn", tags: ["luân hồi", "tiên", "sinh tử"], effects: { reincarnation: true }, desc: "Mệnh Số Tiên Phẩm độc quyền cho Nghề Ẩn Luân Hồi Tiên." }]);

  /* ---------- Quan hệ Mệnh Số (tương sinh/khắc, combo, fusion) ---------- */
  const FATE_RELATIONSHIPS = (typeof window !== "undefined" && window.FATE_RELATIONSHIPS)
    ? window.FATE_RELATIONSHIPS
    : { pairwise_relationships: [], combo_sets: [], fusion_recipes: [] };

  const GUILDS = window.GUILD_DATA?.guilds || [];

  /* ---------- Vật phẩm ---------- */
  const ITEMS = {
    thong_mach_dan: { id: "thong_mach_dan", name: "Thông Mạch Đan", kind: "consumable", exp: 15, realmCatalyst: true,
      desc: "Khai thông kinh mạch; Phàm Nhân dùng sẽ trực tiếp bước vào Luyện Khí." },
    tu_khi_dan: { id: "tu_khi_dan", name: "Tụ Khí Đan", kind: "consumable", exp: 40, realmCatalyst: true,
      desc: "Tụ linh nhập thể; Phàm Nhân dùng sẽ trực tiếp bước vào Luyện Khí." },
    hoan_huyet_dan: { id: "hoan_huyet_dan", name: "Hoán Huyết Đan", kind: "consumable", exp: 25, realmCatalyst: true,
      desc: "Tẩy luyện khí huyết; Phàm Nhân dùng sẽ trực tiếp bước vào Luyện Khí." },
    dai_hoan_dan: { id: "dai_hoan_dan", name: "Đại Hoàn Đan", kind: "consumable", exp: 180,
      desc: "Đan dược thượng phẩm, tu vi tăng vọt." },
    hoi_than_dan: { id: "hoi_than_dan", name: "Hồi Thần Đan", kind: "consumable", san: 30,
      desc: "Ổn định tâm thần, hồi phục Tỉnh Táo." },
    boi_nguyen_dan: { id: "boi_nguyen_dan", name: "Bồi Nguyên Đan", kind: "consumable", heal: 0.4,
      desc: "Hồi phục khí huyết và linh lực." },
    pha_cam_phu: { id: "pha_cam_phu", name: "Phá Cấm Phù", kind: "consumable", sanShield: true,
      desc: "Miễn một lần SAN drain khi dùng trước." },
    linh_thach: { id: "linh_thach", name: "Linh Thạch Hạ Phẩm", kind: "currency", exp: 10,
      desc: "Đá linh chứa linh khí loãng." },
    co_tich_tan_trang: { id: "co_tich_tan_trang", name: "Cổ Tịch Tàn Trang", kind: "key",
      desc: "Một trang sách cổ ghi chép về Cổ Thần." },
    hac_thiet_kiem: { id: "hac_thiet_kiem", name: "Hắc Thiết Kiếm", kind: "weapon", equipmentType: "artifact", phy: 3,
      desc: "Kiếm thép đen, sắc bén." },
    truyen_thua_ngoc_phu: { id: "truyen_thua_ngoc_phu", name: "Truyền Thừa Ngọc Phù", kind: "armor", equipmentType: "protection", protectionSlot: "armor", sanResist: 0.15,
      desc: "Ngọc phù trấn tâm, kháng tà niệm." }
  };

  /* ---------- Địa điểm ---------- */
  const LOCATIONS = {
    son_mon: {
      id: "son_mon", name: "Sơn Môn Thiên Huyền Tông", corruption: 1,
      desc: "Cổng đá khắc đầy phù văn đã phai màu. Dưới chân núi, mây mù lượn lờ như có sinh mệnh.",
      exits: { bac: "van_phong", dong: "linh_dien", tay: "truyen_phap" },
      searchable: ["thong_mach_dan", "tu_khi_dan"]
    },
    van_phong: {
      id: "van_phong", name: "Vạn Phong Điện", corruption: 1,
      desc: "Đại điện uy nghiêm, khói hương lãng đãng. Trên điện, chưởng môn Ngọc Hư Tử thường ngồi tĩnh tọa.",
      exits: { nam: "son_mon", bac: "cam_dia" },
      npcs: ["su_phu", "dien_chu"],
      searchable: []
    },
    truyen_phap: {
      id: "truyen_phap", name: "Truyền Pháp Các", corruption: 1,
      desc: "Tàng kinh các chất đầy ngọc giản. Một vài giá sách đã bị khóa chặt vì 'điển tịch cấm kỵ'.",
      exits: { dong: "son_mon" },
      npcs: ["dai_su_huynh"],
      searchable: ["co_tich_tan_trang"]
    },
    linh_dien: {
      id: "linh_dien", name: "Linh Dược Viên", corruption: 2,
      desc: "Vườn linh thảo xanh um, nhưng linh khí ở đây có mùi tanh khó tả. Vài gốc linh thảo đã chuyển sang màu đen.",
      exits: { tay: "son_mon", bac: "hac_lam" },
      npcs: ["tieu_su_muoi"],
      searchable: ["linh_thach", "boi_nguyen_dan", "hoan_huyet_dan"]
    },
    hac_lam: {
      id: "hac_lam", name: "Hắc Lâm", corruption: 3,
      desc: "Rừng cây cành khô cong queo như bàn tay quỷ. Tiếng rì rào nghe như tiếng thì thầm gọi tên ngươi.",
      exits: { nam: "linh_dien", bac: "co_mieu", dong: "abyss" },
      npcs: [],
      enemies: ["di_qui", "yeu_thu"],
      searchable: ["dai_hoan_dan"]
    },
    co_mieu: {
      id: "co_mieu", name: "Cổ Miếu Tà Thần", corruption: 4,
      desc: "Ngôi miếu đổ nát thờ một thực thể không có danh xưng. Bức tượng đá có hàng nghìn con mắt đang nhìn ngươi.",
      exits: { nam: "hac_lam" },
      npcs: ["co_than_ngu"],
      enemies: ["ta_than_phan_than"],
      searchable: ["co_tich_tan_trang"]
    },
    abyss: {
      id: "abyss", name: "Vực Sâu Dị Biến", corruption: 5,
      desc: "Khe nứt sâu hun hút, linh khí ở đây đặc quánh như máu. Đáy vực vọng lên tiếng gầm không thuộc về nhân gian.",
      exits: { tay: "hac_lam" },
      npcs: [],
      enemies: ["ta_than_phan_than"],
      searchable: ["dai_hoan_dan"]
    },
    cam_dia: {
      id: "cam_dia", name: "Cấm Địa Ngoại Vi", corruption: 3,
      desc: "Khu vực bị phong tỏa bằng trận pháp. Từng tấm phù lục vàng đã rách nát, linh khí dị biến tràn ra.",
      exits: { nam: "van_phong" },
      npcs: [],
      searchable: ["co_tich_tan_trang"]
    },
    tay_mac_khoi_diem: {
      id: "tay_mac_khoi_diem", name: "Sa Thành Tây Mạc", corruption: 2,
      desc: "Một ốc đảo thành trì nằm giữa biển cát. Thương đội và Phật tu cùng che giấu bí mật dưới lớp cát vàng.",
      exits: { dong: "son_mon" }, npcs: [], enemies: [], searchable: ["linh_thach", "thong_mach_dan"]
    },
    bac_nguyen_khoi_diem: {
      id: "bac_nguyen_khoi_diem", name: "Băng Trại Bắc Nguyên", corruption: 2,
      desc: "Gió tuyết phủ kín thảo nguyên, yêu khí và tiếng tù và của các cổ tộc vọng qua màn sương.",
      exits: { nam: "hac_lam" }, npcs: [], enemies: ["yeu_thu"], searchable: ["tu_khi_dan", "hoan_huyet_dan"]
    },
    vo_tan_hai_khoi_diem: {
      id: "vo_tan_hai_khoi_diem", name: "Lưu Vân Hải Cảng", corruption: 2,
      desc: "Hải cảng dựng trên những đảo đá trôi, nơi hạm đội tu sĩ neo đậu giữa tiếng hải thú gầm xa.",
      exits: { tay: "linh_dien" }, npcs: [], enemies: [], searchable: ["linh_thach"]
    },
    thien_khong_khoi_diem: {
      id: "thien_khong_khoi_diem", name: "Phù Không Đảo", corruption: 3,
      desc: "Đảo nổi lơ lửng trên biển mây, linh áp dày đặc khiến mỗi bước chân đều nặng như núi.",
      exits: { nam: "van_phong" }, npcs: [], enemies: [], searchable: ["tu_khi_dan"]
    },
    u_minh_khoi_diem: {
      id: "u_minh_khoi_diem", name: "U Minh Quan", corruption: 5,
      desc: "Biên ải sát khe nứt minh giới, tử khí cuộn thành sương và tà niệm rình rập mọi sinh linh.",
      exits: { dong: "abyss" }, npcs: [], enemies: ["di_qui"], searchable: ["co_tich_tan_trang"]
    }
  };

  /* ---------- Bản đồ Vạn Giới Lộ (tọa độ % trong khung bản đồ) ---------- */
  const WORLD_MAP = {
    name: window.FACTION_DATA?.world?.name || "Vạn Giới Lộ",
    regions: window.FACTION_DATA?.world?.regions || [
      { id: "trung_vuc", name: "Trung Vực", desc: "Tông môn và linh mạch hội tụ." },
      { id: "dong_hoang", name: "Đông Hoang", desc: "Hoang dã và yêu thú chiếm cứ." },
      { id: "tay_mac", name: "Tây Mạc", desc: "Sa hải, cổ thành và Phật tông." },
      { id: "nam_chuong", name: "Nam Chướng", desc: "Độc chướng và linh dược sinh sôi." },
      { id: "bac_nguyen", name: "Bắc Nguyên", desc: "Băng nguyên cùng các bộ tộc cổ." }
    ],
    routes: window.FACTION_DATA?.world?.routes || [],
    factions: window.FACTION_DATA?.factions || [],
    guilds: GUILDS,
    locations: {
      son_mon: { x: 48, y: 78, region: "trung_vuc" },
      truyen_phap: { x: 17, y: 78, region: "trung_vuc" },
      linh_dien: { x: 77, y: 78, region: "nam_chuong" },
      van_phong: { x: 48, y: 54, region: "trung_vuc" },
      cam_dia: { x: 48, y: 20, region: "trung_vuc" },
      hac_lam: { x: 77, y: 54, region: "dong_hoang" },
      co_mieu: { x: 77, y: 20, region: "dong_hoang" },
      abyss: { x: 94, y: 40, region: "dong_hoang" },
      tay_mac_khoi_diem: { x: 20, y: 52, region: "tay_mac" },
      bac_nguyen_khoi_diem: { x: 50, y: 18, region: "bac_nguyen" },
      vo_tan_hai_khoi_diem: { x: 88, y: 80, region: "vo_tan_hai" },
      thien_khong_khoi_diem: { x: 80, y: 15, region: "thien_khong_vuc" },
      u_minh_khoi_diem: { x: 15, y: 82, region: "u_minh_gioi" }
    }
  };

  /* ---------- NPC ---------- */
  const NPCS = {
    su_phu: {
      id: "su_phu", name: "Lạc Trần Tử", title: "Chưởng môn",
      portrait: "assets/characters/char_01.jpg",
      desc: "Lão nhân tóc trắng, đôi mắt thâm trầm như chứa cả một kiếp người.",
      dialogue: {
        default: "Đạo đồ dài đằng đẵng. Hãy giữ tâm thần thanh minh, đừng để tà niệm chen vào.",
        corruption: "Ta đã thấy nhiều đệ tử rời núi... rồi không trở về. Cẩn thận với Cấm Địa."
      }
    },
    dai_su_huynh: {
      id: "dai_su_huynh", name: "Tô Vô Nhai", title: "Đại sư huynh",
      portrait: "assets/characters/char_07.jpg",
      desc: "Nam tử trẻ tuổi, vẻ ngoài ôn hòa nhưng ánh mắt lúc nào cũng cảnh giác.",
      dialogue: {
        default: "Sư đệ cứ tu luyện cho vững đã. Ngoài kia không yên bình như ngươi tưởng đâu.",
        clue: "Trong Truyền Pháp Các có một trang cổ tịch bị khóa. Ta nghi nó liên quan đến linh khí biến dị."
      }
    },
    tieu_su_muoi: {
      id: "tieu_su_muoi", name: "Linh Diệu", title: "Tiểu sư muội",
      portrait: "assets/characters/char_13.jpg",
      desc: "Thiếu nữ hoạt bát, nhưng gần đây thường thất thần nhìn về phía Hắc Lâm.",
      dialogue: {
        default: "Sư huynh... ngươi có nghe thấy tiếng gì trong rừng không? Nó gọi ta bằng tên đấy.",
        clue: "Linh thảo trong viên dạo này mọc ngược, sư tỷ nói do linh khí bị 'ô nhiễm'."
      }
    },
    dien_chu: {
      id: "dien_chu", name: "Ngọc Hư Tử", title: "Trưởng lão Vạn Phong",
      portrait: "assets/characters/char_05.jpg",
      desc: "Trưởng lão nghiêm khắc, luôn nhắc đến 'đại sự' nhưng không bao giờ nói rõ.",
      dialogue: {
        default: "Đừng hỏi nhiều. Ngươi chỉ cần tuân lệnh và giữ miệng.",
        clue: "Cấm Địa... là nơi chúng ta đã đánh đổi thứ gì đó. Đừng bao giờ tới đó."
      }
    },
    co_than_ngu: {
      id: "co_than_ngu", name: "Cổ Thần Ngữ", title: "Thực thể vô danh",
      portrait: "assets/characters/char_19.jpg",
      desc: "Một bóng người không có mặt, chỉ có hàng nghìn con mắt phát sáng.",
      dialogue: {
        default: "Ta không phải thù địch. Ta chỉ là... chân lý bị lãng quên của thế giới này.",
        truth: "Các ngươi tu luyện bằng linh khí đã bị ta nuốt vào giấc mộng. Buông bỏ đi, hoặc tan biến."
      }
    }
  };

  /* ---------- Kẻ thù ---------- */
  const ENEMIES = {
    di_qui: { id: "di_qui", name: "Dị Quỷ Cấp Thấp", diff: 8, hp: 20, exp: 40, sanHit: 5,
      portrait: "assets/characters/char_02.jpg", loot: ["linh_thach"] },
    yeu_thu: { id: "yeu_thu", name: "Yêu Thú Dị Biến", diff: 11, hp: 34, exp: 70, sanHit: 8,
      portrait: "assets/characters/char_12.jpg", loot: ["tu_khi_dan"] },
    ta_than_phan_than: { id: "ta_than_phan_than", name: "Tà Thần Phân Thân", diff: 16, hp: 60, exp: 220, sanHit: 20,
      portrait: "assets/characters/char_20.jpg", loot: ["dai_hoan_dan"] }
  };

  /* ---------- Nhiệm vụ ---------- */
  const QUESTS = {
    chon_dao_lo: {
      id: "chon_dao_lo", title: "Lựa Chọn Đạo Lộ",
      kind: "realm",
      desc: "Sau khi bước vào Luyện Khí, chọn gia nhập một môn phái trong vùng hoặc từ chối để theo con đường Tán Tu/Thế Gia.",
      objectives: [
        { id: "quyet_dinh", label: "Chọn Môn Phái, Tán Tu hoặc Thế Gia", check: (st) => Boolean(st.flags.guildDecision) }
      ],
      reward: { exp: 20 }
    },
    nhan_mon: {
      id: "nhan_mon", title: "Nhập Môn Thiên Huyền",
      kind: "normal",
      desc: "Làm quen với tông môn, gặp gỡ mọi người và tu luyện lần đầu.",
      objectives: [
        { id: "tu_luyen", label: "Tu luyện một lần", check: (st) => st.flags.didCultivate },
        { id: "gap_mat", label: "Nói chuyện với Lạc Trần Tử", check: (st) => st.flags.metSuPhu }
      ],
      reward: { exp: 50, item: "tu_khi_dan" }
    },
    thu_linh_thao: {
      id: "thu_linh_thao", title: "Thu Thập Linh Thảo",
      kind: "normal",
      desc: "Linh Diệu nhờ ngươi thu thập linh thạch và dược liệu trong Linh Dược Viên.",
      objectives: [
        { id: "lay_vat", label: "Tìm kiếm vật phẩm trong Linh Dược Viên", check: (st) => st.flags.searchedLinhDien }
      ],
      reward: { exp: 80, item: "boi_nguyen_dan" }
    },
    co_tich: {
      id: "co_tich", title: "Tàn Trang Cổ Tịch",
      kind: "eldritch",
      desc: "Tìm trang cổ tịch ghi chép về nguồn gốc linh khí biến dị.",
      objectives: [
        { id: "tim_sach", label: "Tìm Cổ Tịch Tàn Trang trong Truyền Pháp Các", check: (st) => (st.inventory["co_tich_tan_trang"] || 0) > 0 }
      ],
      reward: { exp: 150, item: "dai_hoan_dan" }
    },
    bi_mat_cam_dia: {
      id: "bi_mat_cam_dia", title: "Bí Mật Cấm Địa",
      kind: "eldritch",
      desc: "Khám phá sự thật bị chôn giấu tại Cấm Địa Ngoại Vi.",
      objectives: [
        { id: "vao_cam_dia", label: "Đặt chân tới Cấm Địa Ngoại Vi", check: (st) => st.flags.enteredCamDia },
        { id: "gap_co_than", label: "Đối mặt Cổ Thần Ngữ", check: (st) => st.flags.metCoThan }
      ],
      reward: { exp: 300, item: "dai_hoan_dan" }
    },
    cursed: {
      id: "cursed", title: "Mệnh Kiếp Tà Thần",
      kind: "cursed",
      desc: "Mệnh số của ngươi đã đánh thức Tà Thần. Hoàn thành hoặc gánh lấy cơn thịnh nộ.",
      objectives: [
        { id: "hoan_thanh", label: "Giải quyết dị biến tại Cổ Miếu", check: (st) => st.flags.cleansedMieu }
      ],
      reward: { exp: 200 }
    }
  };

  /* ---------- Kết cục ---------- */
  const ENDINGS = {
    truth: { id: "truth", title: "Chân Lý Bị Lãng Quên", tone: "good",
      text: "Ngươi nhìn vào vực sâu và hiểu rằng linh khí chưa từng thuần khiết. Mang theo tri thức nguy hiểm, ngươi rời đi để cảnh tỉnh thế gian." },
    escape: { id: "escape", title: "Kẻ Đào Thoát", tone: "neutral",
      text: "Ngươi chọn buông bỏ đạo đồ và trốn khỏi Thiên Huyền Tông trước khi quá muộn. Sống sót, nhưng mãi bị bóng đen bám theo." },
    succumb: { id: "succumb", title: "Tha Hóa", tone: "bad",
      text: "Tỉnh Táo của ngươi vụn vỡ. Ngươi trở thành một phần của dị biến, mãi mãi thì thầm tên những kẻ đến sau." },
    reincarnation: { id: "reincarnation", title: "Luân Hồi Trọng Sinh", tone: "neutral",
      text: "Thọ nguyên cạn kiệt. Trong khoảnh khắc cuối, một mảnh ký ức được giữ lại để bước sang kiếp mới." },
    godhood: { id: "godhood", title: "Đồng Hóa Cổ Thần", tone: "bad",
      text: "Ngươi chấp nhận lời mời của Cổ Thần. Thân xác tan biến, ý thức hòa vào giấc mộng vô tận." }
  };

  const HELP_TEXT = [
    "§LỆNH CƠ BẢN§",
    "  nhìn / quan sát — quan sát nơi hiện tại",
    "  đi <hướng> — đi theo hướng: bắc / nam / đông / tây",
    "  tu luyện — vận công tăng tu vi (tốn linh khí, rủi ro tà niệm)",
    "  đột phá — cố gắng phá cảnh giới",
    "  tìm kiếm — tìm vật phẩm tại nơi hiện tại",
    "  dùng <vật phẩm> — sử dụng vật phẩm",
    "  gia nhập <môn phái> — chọn tông môn sau khi đạt Luyện Khí",
    "  từ chối tán tu / chọn thế gia — từ chối nhập môn và chọn đạo lộ",
    "  nói chuyện <tên> — trò chuyện với nhân vật",
    "  tấn công — giao chiến với kẻ thù quanh đây",
    "  trạng thái / hành trang / nhiệm vụ / mệnh — xem thông tin",
    "  bản đồ — xem vị trí, nơi đã khám phá và các lối có thể đi",
    "  tổ chức — xem môn phái; gia nhập <tên>; rời môn",
    "  lưu / tải / giúp — hệ thống",
    "§GỢI Ý§ Bạn cũng có thể gõ bất kỳ hành động tự do nào, ví dụ:",
    "  'ta cẩn thận quan sát bức tượng'",
    "  'ta đọc trang cổ tịch'",
    "  'ta hít thở sâu để trấn tĩnh'"
  ].join("\n");

  /* 8 loại phẩm chất mệnh số */
  const GRADES = [
    { id: "phan", label: "Phàm Phẩm" },
    { id: "linh", label: "Linh Phẩm" },
    { id: "hoang", label: "Hoàng Phẩm" },
    { id: "huyen", label: "Huyền Phẩm" },
    { id: "dia", label: "Địa Phẩm" },
    { id: "thien", label: "Thiên Phẩm" },
    { id: "thanh", label: "Thánh Phẩm" },
    { id: "tien", label: "Tiên Phẩm" }
  ];

  return {
    WORLDS, REALMS, ARCHETYPES, FATE_PATTERNS, FATE_RELATIONSHIPS, GUILDS, ITEMS, GRADES, WORLD_MAP,
    LOCATIONS, NPCS, ENEMIES, QUESTS, ENDINGS, HELP_TEXT
  };
})();
