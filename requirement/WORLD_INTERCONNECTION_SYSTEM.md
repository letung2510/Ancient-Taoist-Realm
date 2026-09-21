# HỆ THỐNG LIÊN KẾT THẾ GIỚI MỞ — MAP × NPC × THẾ LỰC × SỰ KIỆN × BÍ CẢNH
> Mục tiêu: chuyển từ "nội dung tĩnh + random encounter rời rạc" sang **world simulation** thật —
> thế lực/NPC tự vận động theo thời gian (dùng GameClock đã có) dù người chơi không ở đó, và MỌI hệ
> thống dưới đây phải LIÊN KẾT CHÉO với nhau, không tồn tại độc lập. Đã gộp B/C/D theo yêu cầu
> (được duyệt), bỏ A/E ra khỏi trọng tâm file này.

---

## 1. NGUYÊN TẮC NỀN: THẾ GIỚI SỐNG DÙ KHÔNG AI NHÌN (WORLD SIMULATION TICK)

```
Mỗi lần GameClock advance 1 ngày game (đã có cơ chế `advanceGameTime()`), chạy thêm 1 bước
`simulateWorldTick()` — XỬ LÝ TOÀN BỘ thế lực/NPC nổi bật trên server, KHÔNG PHỤ THUỘC người chơi
có đang online/đứng ở node đó hay không:
  1. Mỗi Faction: cập nhật quan hệ ngoại giao (mục 2), roll sự kiện nội bộ (mục 2.3)
  2. Mỗi NPC nổi bật: di chuyển theo lịch trình, roll tương tác NPC-NPC (mục 3)
  3. Kiểm tra điều kiện mở/đóng Bí Cảnh theo lịch (mục 6)
  4. Kiểm tra Corruption Spread trên map (đã có ở MAP_SYSTEM.md 6.6, giờ chạy CÙNG NHỊP GameClock)
```
Người chơi quay lại 1 vùng sau nhiều ngày vắng mặt sẽ thấy THẾ GIỚI ĐÃ THAY ĐỔI thật (tông môn mất
lãnh thổ, NPC quen đã chết/thăng chức/phản bội) — đây là khác biệt cốt lõi so với thiết kế cũ.

---

## 2. THẾ LỰC TƯƠNG TÁC ĐỘNG (FACTION INTERACTION SYSTEM)

### 2.1. Mở rộng field `Quan Hệ Ngoại Giao` đã có (Xianxin_map.md 5.1) từ TĨNH sang ĐỘNG
```
Faction.diplomacy[otherFactionId] = {
  status: "dong_minh" | "trung_lap" | "thu_dich",
  tensionScore: -100..100,   // MỚI — tích lũy dần, khi vượt ngưỡng mới đổi status thật sự
}

Mỗi worldTick, tensionScore thay đổi theo:
  + tranh chấp Linh Mạch chung vùng (2 Faction cùng claim tài nguyên gần nhau) -> tension tăng
  + Đặc Sắc "Nợ máu với thế lực khác" (đã có sẵn trait) -> tension khởi điểm cao, giảm chậm
  + Player can thiệp trực tiếp (giúp đỡ/tấn công 1 bên) -> tension đổi mạnh ngay lập tức
  + có kẻ thù chung (VD cùng bị Corruption Spread đe dọa lãnh thổ) -> tension GIẢM (liên minh tạm
    thời trước mối đe dọa lớn hơn — đúng logic địa chính trị)

tensionScore <= -60 -> status = "dong_minh"
tensionScore >= 60  -> status = "thu_dich" -> mở TRẠNG THÁI CHIẾN TRANH (mục 2.2)
```

### 2.2. Trạng thái Chiến Tranh giữa 2 Thế Lực
```
Khi 2 Faction status = "thu_dich" đủ lâu (hoặc trigger tức thời do sự kiện lớn):
  -> Các node BIÊN GIỚI giữa lãnh thổ 2 bên (node có ownerFactionId thuộc 1 trong 2, cạnh (edge)
     với node thuộc bên kia) chuyển `dangerLevel +2`, `eventPoolTag` đổi thành "chien_truong" (bảng
     trọng số mới: NPC 60% loại lính/Ngoại Môn giao tranh, Quái giảm, Cơ Duyên tăng — chiến lợi
     phẩm rơi ra giữa chiến trường)
  -> Mỗi worldTick, server tự giải quyết 1 "trận" theo công thức so sánh sức mạnh tổng (
     factionPower = tổng Cảnh Giới cao nhất × Quy Mô × Tài Nguyên, đã có sẵn field ở
     Xianxin_map.md 5.1) — bên thắng CHIẾM node biên giới (đổi ownerFactionId), bên thua rút lui
  -> Player CÓ THỂ can thiệp: tham gia 1 trận cụ thể (combat thật, thắng thì cộng thêm hẳn 1 "trận"
     nghiêng về phe mình bất kể factionPower) — biến chiến tranh diện rộng thành có điểm chạm cá
     nhân hóa được, không chỉ mô phỏng nền.
  -> Chiến tranh KẾT THÚC khi 1 bên mất hết node biên giới VÀO SÂU lãnh thổ (mất Sơn Môn chính) HOẶC
     tensionScore tự nhiên giảm đủ (bên ngoài can thiệp, thời gian trôi qua).
```

### 2.3. Sự kiện nội bộ Faction (roll độc lập mỗi worldTick, dùng lại `Đặc Sắc` trait đã có)
| Trait sẵn có | Sự kiện nội bộ tương ứng có thể roll |
|---|---|
| "Nội bộ lục đục" | % roll ra 1 NPC nổi bật rời bỏ/phản bội Faction (trở thành Tán Tu hoặc gia nhập Faction khác) |
| "Đang suy tàn" | Mất dần Tài Nguyên mỗi tick, tăng khả năng bị Faction khác tấn công (tension tăng nhanh hơn) |
| "Đang trỗi dậy" | Mở rộng lãnh thổ TỰ ĐỘNG — claim thêm node lân cận vô chủ theo đúng cơ chế "cụm vệ tinh" đã có ở MAP_SYSTEM.md 6.5, giờ chạy LẶP LẠI theo thời gian chứ không chỉ 1 lần lúc sinh |
| "Có Thánh Địa/Bí Cảnh riêng" | Trigger mở Bí Cảnh theo lịch (mục 6) |
| "Bí pháp thất truyền" | % nhỏ mỗi tick roll ra 1 world_discovery quest liên quan (NPC Faction đó đang tìm lại bí pháp) |

---

## 3. NPC TƯƠNG TÁC (NPC SOCIAL SIMULATION)

### 3.1. NPC nổi bật có LỊCH TRÌNH riêng (không đứng yên 1 chỗ vĩnh viễn)
```
NotableNPC {
  ...(kế thừa Entity Base Schema đã có)...
  homeNodeId: string,
  scheduleType: "static" | "patrol" | "itinerant",
  // static: đứng yên (đa số NPC quest giver quan trọng)
  // patrol: di chuyển giữa 2-3 node cố định theo chu kỳ (VD Trưởng Lão tuần tra biên giới)
  // itinerant: di chuyển NGẪU NHIÊN có định hướng (Thương Nhân, Tán Tu — dùng chung logic
  //            generateNodeAt để họ cũng "khám phá" map giống người chơi)
  relationshipsWithOtherNPCs: [{ npcId, type: "dong_mon" | "doi_dau" | "su_do" | "tinh_nhan" }]
}
```

### 3.2. Sự kiện NPC-NPC ngẫu nhiên (người chơi có thể CHỨNG KIẾN nếu đứng cùng node)
```
Khi 2+ NotableNPC ở cùng node cùng lúc (do lịch trình trùng), roll % xảy ra 1 tương tác:
  - "Giao Dịch" (2 NPC trung lập/đồng minh): đổi vật phẩm/tin tức — nếu player đứng gần, có thể
    "Nghe Lén" (action mới) để lấy thông tin (gợi ý Cơ Duyên gần đó, hoặc lộ blocker Con Đường)
  - "Tranh Chấp/Đấu Khẩu" (2 NPC tension cao do Faction họ thù địch): player có thể can thiệp
    (đứng về 1 bên -> ảnh hưởng Danh Vọng cả 2 Faction) hoặc bỏ qua
  - "Tỷ Thí" (2 NPC cùng Con Đường, cả 2 mạnh): combat NPC-NPC tự giải quyết theo factionPower-style
    formula, người chơi CHỈ xem (không tham gia được) — kết quả ảnh hưởng relationshipsWithOtherNPCs
  - "Mật Hội" (2 NPC thuộc phe Tà Thần/Nghịch Hành Đạo gặp nhau): CHỈ xảy ra ở node dangerLevel cao/
    Cấm Địa, nếu player phát hiện (cần action "Điều Tra" thành công) -> mở world_discovery quest
    dạng "Tổ Chức Ngầm" (đã phác thảo ở bản brainstorm trước, nay có cơ chế nền để thực sự chạy)
```

### 3.3. Trí Nhớ NPC với người chơi (mở rộng Danh Vọng tĩnh thành lịch sử cụ thể)
```
NPC.memoryWithPlayer: [{ eventType, timestamp, outcome }]  // log CỤ THỂ, không chỉ 1 con số Danh Vọng

Khi hội thoại lại, NPC có thể nhắc CHÍNH XÁC sự kiện cũ:
  "Ngươi... vẫn nhớ lần ta nhờ ngươi giải cứu ở [tên node] năm ngoái chứ?" — dùng đúng dữ liệu
  memoryWithPlayer, không phải câu thoại chung chung.
```

---

## 4. MAP ICON PHẢN ÁNH TRẠNG THÁI SỐNG (không còn icon tĩnh)

| Trạng thái node | Icon/hiển thị thay đổi |
|---|---|
| Đang trong Chiến Tranh (mục 2.2) | Viền đỏ nhấp nháy nhẹ, icon kiếm chéo góc node |
| Có NotableNPC đang đứng | Hiện avatar nhỏ NPC đó góc node (thay vì phải bấm vào mới biết) |
| Corruption Spread cấp 3+ (đã có cơ chế) | Icon node chuyển màu xám/tím dần theo cấp độ ô nhiễm |
| Bí Cảnh đang MỞ (mục 6) | Icon phát sáng đặc biệt + đếm ngược thời gian còn mở trên map |
| Có quest `world_discovery` đã kích hoạt tại đây | Icon "?" mờ (không rõ ràng như quest thường, đúng tinh thần khám phá) |

**Đường nối (edge) giữa 2 node Faction khác nhau** — thêm màu đường viền theo `diplomacy.status` hiện
tại giữa 2 Faction sở hữu 2 đầu node đó: xanh lá (đồng minh), xám (trung lập), đỏ (thù địch/chiến
tranh) — nhìn bản đồ là biết ngay bức tranh chính trị khu vực, không cần bấm từng node.

---

## 5. SỰ KIỆN NGẪU NHIÊN LAN TỎA (CASCADING EVENTS) — mở rộng RANDOM_EVENT_SYSTEM.md

### 5.1. Cơ Duyên có thể bị TRANH CHẤP
```
Khi player kích hoạt 1 sự kiện Cơ Duyên giá trị cao (VD "Cổ Mộ Tàn Tích", "Tàn Quyển Rơi Rớt"), roll
thêm % (tăng theo độ hiếm phần thưởng): có 1 NotableNPC KHÁC cũng đang tìm thứ này, xuất hiện NGAY
sau khi player phát hiện -> 3 lựa chọn: Nhường (Danh Vọng+/NPC ghi nhớ tích cực), Tranh Giành
(combat hoặc so Aptitude), Chia Sẻ (cả 2 nhận phần thưởng giảm nửa, NPC trở thành quen biết).
```

### 5.2. World Event cấp cao CASCADE sang Faction/Map (không chỉ ảnh hưởng cá nhân)
```
Tà Thần Thức Tỉnh / Đại Kiếp xảy ra tại vùng X:
  -> Faction có lãnh thổ trong vùng X: Tài Nguyên giảm mạnh, tensionScore với TẤT CẢ Faction khác
     GIẢM tạm thời (kẻ thù chung, xem 2.1) trong suốt thời gian world_event_on_awaken còn hiệu lực
  -> NPC dân thường tại các node bị ảnh hưởng: sinh ra dòng "NPC tị nạn" di cư sang node lân cận an
     toàn hơn (dùng scheduleType: itinerant tạm thời) — mở quest hộ tống/hỗ trợ tị nạn tự nhiên
  -> Sau khi world_event kết thúc (thắng hoặc thua), map VĨNH VIỄN đổi (node bị hủy thành Cấm Địa
     cấp 5 nếu thua, hoặc mở khóa vùng mới nếu thắng — đã có ở NPC_MONSTER_SYSTEM.md 1B.2)
```

---

## 6. BÍ CẢNH ẨN (HIDDEN REALM) — TÍNH NĂNG MỚI HOÀN TOÀN

### 6.1. Cấu trúc
```
HiddenRealm {
  id, name, parentFactionId (Faction sở hữu/bảo hộ, có thể null nếu vô chủ),
  unlockCondition: { type: "item_key" | "fate_combo" | "faction_reputation" | "world_event_trigger",
                      detail },
  openWindow: { startDay, durationDays },   // CHỈ mở trong khung thời gian giới hạn theo GameClock,
                                              // đúng ý "Tông môn khai mở bí cảnh" đã có ở
                                              // Xianxin_map.md mục 6, giờ thực sự có cơ chế lịch
  instancedMap: MapNode[],   // 1 tập node RIÊNG, không thuộc lưới thế giới mở chính, vào qua 1
                              // "cổng" đặc biệt tại node mẹ
  guaranteedRewards: { fateGradeMin: string, congPhapGradeMin: string },
  competingFactions: [factionId],  // các Faction CŨNG đang muốn vào — tạo đua tranh
}
```

### 6.2. Luồng mở Bí Cảnh
```
[GameClock chạm `openWindow.startDay`] -> node mẹ đổi icon (mục 4), broadcast tin tức tới NPC gần đó
        │
        ▼
[Player + các NotableNPC thuộc competingFactions ĐỀU có thể vào trong `durationDays`]
        │
        ▼
[Bên trong: bản đồ instanced riêng, có thể gặp NotableNPC đối thủ ĐANG THI TRIỂN CÙNG LÚC — không
 combat trực tiếp bắt buộc, nhưng ai lấy được reward chính trước thì node đó "cạn" cho người sau]
        │
        ▼
[Hết `durationDays`] -> cổng đóng, ai chưa vào kịp phải chờ chu kỳ mở tiếp theo (nếu có) hoặc vĩnh
 viễn bỏ lỡ nếu là Bí Cảnh 1 lần (world_event_trigger loại)
```

### 6.3. Liên kết chéo bắt buộc (không để Bí Cảnh là hệ thống cô lập)
- `unlockCondition` loại `fate_combo` dùng ĐÚNG `combo_sets`/`minRelationshipStageRequired` đã thiết
  kế ở `FATE_RELATIONSHIP_COMPLETE.md` mục 5 — không tạo điều kiện mở khóa riêng.
- `competingFactions` roll theo đúng `factionReputation`/quan hệ ngoại giao đang có (mục 2) — Faction
  đang chiến tranh với chủ nhân Bí Cảnh có thể KHÔNG được mời (`competingFactions` loại trừ thù địch
  quá mức), tạo hệ quả thật từ việc chọn phe trước đó của người chơi.
- Phần thưởng `guaranteedRewards` có thể là chính 130 Mệnh Địa Phẩm+ đã soạn hiệu ứng Cộng Minh
  riêng (`resonance_effects_v2.json`) — Bí Cảnh là NGUỒN HỢP LÝ NHẤT để phát những Mệnh hiếm này,
  thay vì rải đều qua roll thường.

---

## 7. TÍCH HỢP B/C/D VÀO TOÀN BỘ HỆ TRÊN

| Nhóm đã duyệt | Điểm nối vào hệ thống liên kết mới |
|---|---|
| **B. Sự kiện định kỳ** | Tông Môn Đại Hội = 1 loại `HiddenRealm`-adjacent event (không instanced nhưng cùng cơ chế `openWindow`); Tà Thần Tiền Triệu = giai đoạn TRƯỚC mục 5.2, tăng Ambient Dread + kích hoạt sớm phản ứng Faction (mục 2.3 "Đang suy tàn" tăng tốc nếu gần tâm chấn) |
| **C. Thuần Hóa Dị Thú** | Thú cưỡi có thể dùng làm "trinh sát" — cử đi 1 node lân cận, tăng % `revealAdjacentNodes` (MAP_SYSTEM.md mục 2) mà không cần player tự đi; thú cưỡi hợp Faction nào (nếu thuần hóa từ Yêu Thú của vùng đó) có thể ảnh hưởng nhẹ `tensionScore` khi xuất hiện cùng player tại lãnh thổ Faction đó |
| **D. Bách Khoa Chí Dị** | Mở thêm mục "Thế Sự" (World Events Log) — tự động ghi lại lịch sử Chiến Tranh/Bí Cảnh đã mở/NPC đã mất do worldTick, biến Codex thành sử biên niên sống của server, không chỉ sổ tay cá nhân |

---

## 8. VIỆC CẦN LÀM TIẾP (ưu tiên theo thứ tự)
1. `simulateWorldTick()` (mục 1) là NỀN TẢNG bắt buộc code TRƯỚC — mọi mục khác phụ thuộc nó chạy
   đúng nhịp GameClock.
2. Faction diplomacy động (mục 2.1-2.2) — logic phức tạp nhất, cần cân bằng kỹ để chiến tranh không
   nổ ra liên tục gây loạn bản đồ, cũng không quá hiếm tới mức vô nghĩa.
3. NPC schedule + tương tác NPC-NPC (mục 3) — có thể làm SONG SONG với mục 2 vì tương đối độc lập.
4. Map icon động (mục 4) — thuần UI, làm sau khi mục 2-3 có dữ liệu thật để hiển thị.
5. Bí Cảnh Ẩn (mục 6) — nên làm SAU CÙNG vì phụ thuộc cả Faction (competingFactions) lẫn Fate combo
   đã có, tận dụng được nhiều nhất khi làm cuối.
6. Quyết định giới hạn "server-wide" hay "per-player world state" cho TOÀN BỘ hệ này (đã treo câu
   hỏi này từ `MAP_SYSTEM.md` mục 6.8, giờ CÀNG quan trọng hơn vì Faction War/Bí Cảnh có ý nghĩa
   khác hẳn nếu multiplayer thật vs single-player với NPC giả lập).
