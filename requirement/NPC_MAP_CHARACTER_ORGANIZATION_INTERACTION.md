# TƯƠNG TÁC NPC × MAP × NHÂN VẬT × TÔNG MÔN — THIẾT KẾ CHI TIẾT
> Mở rộng từ nền đã có (NPC schedule/patrol, Neo Nhân Tính, factionReputation, Binh Đoàn, Node
> History) — KHÔNG lặp lại, chỉ thêm cơ chế MỚI theo 3 trục: NPC×Map, Nhân Vật×NPC, Nhân Vật×Tông
> Môn. Nhóm A không thuộc phạm vi "Đạo Lữ/Sư Đồ" đã loại trước đó — đây là quan hệ NPC thường, khác
> quan hệ đặc biệt kiểu song tu.

---

## A. NPC × BẢN ĐỒ (LIFE SIMULATION SÂU HƠN PATROL/SCHEDULE ĐÃ CÓ)

### A.1. Sinh Hoạt Theo Giờ (Hourly Routine)
```
NotableNPC.dailyRoutine: [
  { hourStart, hourEnd, subLocationId, activity: "ngủ"|"buôn bán"|"luyện công"|"tuần tra"|"ăn uống" }
]
```
- Ban đêm (giờ Tý-Dần theo GameClock): đa số NPC về `subLocationId` loại "nơi ở", action "Nói
  Chuyện" bị thay bằng "Đánh Thức" (risk giảm Thiện Cảm nếu làm phiền vô cớ).
- Tạo cơ hội GAMEPLAY: đột nhập ban đêm khi NPC ngủ (trộm/điều tra) dễ hơn nhưng bị phát hiện thì
  phản ứng gay gắt hơn hẳn ban ngày.

### A.2. Lão Hóa & Kế Vị (NPC Aging & Succession)
```
NotableNPC.age, NotableNPC.maxLifespan (dùng chung công thức Thọ Nguyên đã có theo Cảnh Giới NPC)
Khi age >= maxLifespan -> NPC "viên tịch" tự nhiên (không phải bị giết):
  - Nếu có đệ tử/quan hệ "su_do" trong relationshipsWithOtherNPCs -> đệ tử KẾ VỊ, thừa hưởng 1 phần
    vai trò (subLocationId, 1 vài quest daily) NHƯNG tính cách/dialogue RIÊNG (không copy y hệt)
  - Nếu KHÔNG có người kế vị -> vai trò đó BỎ TRỐNG, tạo cơ hội (quest "Tân Nhiệm" cho player hoặc
    NPC khác tranh giành — nối vào mục C.2 Nội Bộ Chính Trị)
  - Ghi vào Node History Log (đã có) như 1 sự kiện "notable_npc_visit"→"death"
```

### A.3. Di Cư Theo Mùa/Sự Kiện (Seasonal & Event Migration)
NPC loại `itinerant` ưu tiên di chuyển theo mùa (Xem Lịch Tu Luyện Theo Mùa đã có): thương nhân bán
đồ ấm di chuyển theo mùa Đông, thầy bói xuất hiện nhiều hơn quanh thời điểm World Event lớn sắp
xảy ra (nối Thiên Tượng Dị Biến đã thiết kế).

### A.4. Dấu Vết NPC (NPC Footprint Trail)
```
Khi player Thám Hiểm 1 node mà 1 NPC vừa rời đi trong X giờ gần đây -> % nhỏ tìm thấy "dấu vết"
(mảnh vải, mùi hương đặc trưng, dấu chân lạ) -> mở action "Truy Tung Dấu Vết" chỉ hướng NPC đó VỪA
đi, không lộ chính xác vị trí hiện tại (phải tự đuổi theo, có thể trật nếu NPC đổi hướng).
```
Dùng cho: truy tìm NPC gián điệp bỏ trốn, tìm Neo Nhân Tính bị thất lạc, theo dõi Ma Đầu.

### A.5. NPC Lập Nghiệp Tại Node (Settlement Growth)
```
NPC `itinerant` sau nhiều lần ghé qua CÙNG 1 node vô chủ (đủ ngưỡng lần) có % "định cư" — tự thêm 1
subLocation MỚI vào node đó (VD 1 quầy hàng nhỏ) → node "lớn lên" tự nhiên qua thời gian, không chỉ
do player/Faction chủ động xây (khác Structure Building đã có ở MAP_SYSTEM_V2 — đây là tăng trưởng
TỰ PHÁT từ chính NPC, không cần player đầu tư).
```

---

## B. NHÂN VẬT × NPC (QUAN HỆ SÂU HƠN TALK/QUEST/TRADE ĐÃ CÓ)

### B.1. Trục Quan Hệ 3 Chiều (mở rộng Trust/Respect đã thấy trong Exploration Requirement)
```
NPCRelationship {
  trust: 0-100,      // tin tưởng — ảnh hưởng NPC có nhờ hỗ trợ/chia sẻ bí mật không
  respect: 0-100,    // nể trọng — ảnh hưởng NPC có nghe theo đề nghị mạo hiểm không
  affection: 0-100,  // thiện cảm — ảnh hưởng giá giao dịch/quà tặng phản hồi
}
```
3 trục ĐỘC LẬP — 1 NPC có thể Trust cao (tin ngươi giữ lời) nhưng Affection thấp (không thích ngươi
cá nhân) — tạo sắc thái phong phú hơn 1 con số Danh Vọng chung chung.

### B.2. Tặng Quà (Gift Giving)
```
Mỗi NPC có `preferences: [itemTag]` (dựa theo vai trò/tính cách đã roll — thương nhân thích Linh
Thạch, tu sĩ thích Đan Dược hiếm, trẻ mồ côi thích đồ ăn) — tặng đúng sở thích: +Affection nhiều;
tặng ngẫu nhiên không hợp: +Affection rất ít hoặc 0; tặng vật phẩm phản chủ đề (VD tặng vũ khí cho
NPC theo Con Đường hòa bình): CÓ THỂ -Affection (hiểu lầm/xúc phạm).
```

### B.3. Uy Hiếp / Ép Buộc (Intimidation) — thay thế thuyết phục khi Danh Vọng xấu/Corruption cao
```
Thay vì luôn cần Trust/Respect cao để nhờ vả, player Corruption_Rating/Danh Vọng Hắc Đạo cao có thể
"Uy Hiếp" NPC yếu hơn (Cảnh Giới thấp hơn nhiều) để lấy thông tin/vật phẩm — THÀNH CÔNG nhưng
Trust/Affection về 0 VĨNH VIỄN với NPC đó (không hồi phục lại như Affection thường), và NPC có %
báo lại cho Faction của họ (ảnh hưởng factionReputation xấu đi).
```

### B.4. Mạng Lưới Tin Đồn (NPC Gossip Network)
```
Hành động NỔI BẬT của player (thắng trận Binh Đoàn, học Cấm Thuật công khai, Đột Phá lớn) LAN TRUYỀN
giữa NPC theo thời gian (worldTick) — NPC CHƯA từng gặp player vẫn có thể đã "nghe danh" (hoặc "nghe
tiếng xấu") -> ảnh hưởng thái độ ban đầu khi gặp lần đầu (đã có gợi ý ở Exploration Requirement "tin
đồn có nguồn/độ tin cậy" — giờ gắn CỤ THỂ vào hành động player làm, không chỉ tin đồn chung chung).
```

### B.5. Thử Thách Lòng Tin (Trust Trial)
```
NPC quan trọng (tiềm năng làm Neo/dạy Công Pháp hiếm) không tin ngay — TỰ ĐỘNG tạo 1 quest ẩn nhỏ
"thử lòng" (nhờ giữ bí mật, nhờ làm 1 việc có vẻ vô nghĩa nhưng thực ra để test) TRƯỚC KHI cho phép
hành động quan trọng (dạy nghề/làm Neo) — vượt qua thì Trust nhảy vọt, thất bại thì phải đợi rất lâu
mới có cơ hội thử lại.
```

### B.6. Phản Bội (NPC Betrayal Mechanic)
```
NPC đồng hành tạm thời/đang có quan hệ Trust cao có % nhỏ PHẢN BỘI nếu:
  - Player Corruption_Rating vượt ngưỡng NPC đó chịu đựng được (mỗi NPC có `corruptionTolerance`
    riêng theo alignment)
  - Đối thủ (Faction khác) đưa ra "giá" đủ cao (factionReputation của đối thủ với NPC đó đã ngầm
    tích lũy qua thời gian)
Phản bội KHÔNG xảy ra vô cớ ngẫu nhiên — luôn có ĐIỀU KIỆN cụ thể trên, và luôn có 1 dấu hiệu NHỎ
báo trước (Ambient Dread nhẹ liên quan tới đúng NPC đó) trước khi phản bội thật sự xảy ra.
```

---

## C. NHÂN VẬT/NPC × TÔNG MÔN (TỔ CHỨC) — SÂU HƠN GIA NHẬP/CỐNG HIẾN ĐÃ CÓ

### C.1. Hệ Thống Cấp Bậc Nội Bộ (Rank Ladder)
```
Ngoại Môn -> Nội Môn -> Chân Truyền Đệ Tử -> Trưởng Lão -> (hiếm) Chưởng Môn
Thăng cấp theo: factionReputation đủ ngưỡng + Cảnh Giới bản thân đủ ngưỡng + (từ Trưởng Lão trở lên)
vượt qua 1 kỳ khảo hạch/thi đấu nội bộ (dùng cơ chế combat/skill-check đã có).
Mỗi cấp mở thêm: quyền vào subLocation giới hạn (VD "Tàng Kinh Các" chỉ Chân Truyền trở lên), tỷ lệ
nhận Công Pháp/Mệnh Số thưởng cao hơn, và... trách nhiệm (bị réo gọi tham chiến/Binh Đoàn thường
xuyên hơn khi cấp cao).
```

### C.2. Chính Trị Nội Bộ (Internal Politics)
```
Khi NPC lãnh đạo (Chưởng Môn) lão hóa gần hết Thọ Nguyên (nối mục A.2) MÀ CHƯA có người kế vị rõ
ràng -> kích hoạt "Khủng Hoảng Kế Vị": 2+ Trưởng Lão trong Tổ Chức cạnh tranh nhau (tăng tensionScore
NỘI BỘ, khác tensionScore giữa 2 Faction khác nhau) -> player (nếu đã lên Trưởng Lão hoặc cao hơn) có
thể ỦNG HỘ 1 phe -> kết quả ảnh hưởng lâu dài tới định hướng CHÍNH ĐẠO/TRUNG LẬP/NGHIÊNG TÀ của cả
Tổ Chức (không chỉ 1 NPC, mà ĐỊNH HƯỚNG TƯƠNG LAI của cả Faction có thể đổi theo ai lên nắm quyền).
```

### C.3. Phản Bội Tổ Chức (Defection)
```
Player rời Tổ Chức A gia nhập Tổ Chức B (đối địch) -> Tổ Chức A đánh dấu player là "Phản Đồ":
  - Mọi NPC thuộc A trở nên thù địch mặc định (bất kể Affection/Trust cũ)
  - Faction A có thể cử 1 Ma Đầu-tier NPC truy sát (nối cơ chế Ma Đầu đã có, giờ có NGUỒN GỐC rõ
    ràng: "cựu đồng môn phản bội" thay vì ngẫu nhiên)
  - Neo Nhân Tính là NPC thuộc Faction A (nếu có) TỰ ĐỘNG bị đe dọa/mất — cảnh báo rõ TRƯỚC khi
    player xác nhận phản bội, để đây luôn là lựa chọn CÓ CÂN NHẮC, không phải bấm nhầm.
```

### C.4. Kho Bí Pháp Theo Cấp Bậc (Rank-Gated Secret Vault)
Công Pháp/Mệnh Số ĐỘC QUYỀN của Tổ Chức (không roll được từ nguồn khác) chỉ mở khóa xem/học khi đạt
đúng Rank (mục C.1) — biến việc leo rank có phần thưởng CƠ CHẾ THẬT, không chỉ danh xưng.

### C.5. Ủy Thác Đa Tầng (Tiered Commission — mở rộng nút "Đặt Ủy Thác Tổ Chức" đã thấy trên UI)
```
Ủy Thác không phải 1 loại — chia 3 tầng theo độ khó/thưởng:
  Tầng Thường: lặp vô hạn kiểu Radiant Quest đã có (faction_daily)
  Tầng Đặc Biệt: giới hạn số lần/tháng game, thưởng Mệnh Số/Công Pháp thật
  Tầng Sinh Tử: chỉ mở khi Tổ Chức đang Chiến Tranh (nối Binh Đoàn) — thất bại có hậu quả thật
  (mất Rank, không chỉ mất thưởng)
```

### C.6. Môi Giới Liên Minh (Alliance Brokering)
```
Nếu player có factionReputation cao với CẢ 2 Tổ Chức đang tensionScore cao (gần chiến tranh), mở
action ẩn "Hòa Giải" — skill-check (Danh Vọng + Đạo Tâm) một lần, thành công thì tensionScore giữa
2 bên giảm mạnh ngay lập tức (tránh được 1 cuộc chiến trước khi nó bắt đầu) — đây là cách DUY NHẤT
player có thể chủ động NGĂN chiến tranh thay vì chỉ tham gia/xem sau khi nó đã xảy ra.
```

### C.7. Thử Thách Trung Thành Định Kỳ (Loyalty Test)
```
Tổ Chức thỉnh thoảng (worldTick roll thấp) giao 1 quest DẠNG BẪY — nhìn giống ủy thác thường nhưng
thực chất kiểm tra đạo đức/trung thành (VD "tiêu diệt 1 làng bị nghi ngờ thông đồng địch" — có thật
không do player tự điều tra) — quyết định ẢNH HƯỞNG rank tăng/giảm khác biệt hẳn so với nhìn bề mặt.
```

---

## D. TRẠNG THÁI TRIỂN KHAI

Thứ tự ưu tiên cũ bên dưới đã được thay bằng trạng thái thực thi để tránh hiển thị A.1/B.1/C.1/C.5
hoặc các hạng mục vừa bổ sung như việc còn chờ. Các hạng mục A.2–A.5, B.2–B.6, C.2–C.3, C.6–C.7
và phần còn lại C.4 đã được nối vào runtime/action lifecycle và có kiểm thử hồi quy.

Đích di cư mùa đọc từ `seasonalTags` trên node trong `GameData.LOCATIONS` hoặc
`GameData.WORLD_MAP.locations`. Thêm node mới kèm tag mùa phù hợp là node tự được xét vào tuyến, không
cần sửa danh sách ID trong scheduler.
# Trạng thái triển khai (2026-09-22)

Đã triển khai theo thứ tự ưu tiên ở mục D:

- **A.1 Sinh hoạt theo giờ:** NPC có dailyRoutine 24 giờ, tự chọn hoạt động/tiểu cảnh theo vai trò; ban đêm action đổi thành “Đánh Thức”. Đánh thức NPC ghi nhận rủi ro bị phát hiện và giảm Thiện Cảm/Tín.
- **B.1 Quan hệ ba trục:** Tín, Kính Trọng và Thiện Cảm được lưu độc lập; Thiện Cảm có migration từ Tín cho save cũ, có sự kiện tăng/giảm riêng và được hiển thị trong tab quan hệ.
- **C.1 Cấp bậc nội bộ:** Ngoại Môn → Nội Môn → Chân Truyền Đệ Tử → Trưởng Lão → Chưởng Môn; xét cống hiến, danh tiếng, cảnh giới; hai bậc cuối có khảo hạch. Trượt mất cống hiến và chờ bảy ngày. Thăng cấp mở truyền thừa theo bậc.
- **C.5 Ủy thác nhiều tầng:** Thường, Đặc Biệt (tối đa hai nhiệm vụ/tháng game), Sinh Tử (chỉ khi tổ chức faction trực tiếp tham chiến). Có tiến độ, thời hạn, giao nhiệm vụ tại tổ chức và thưởng qua reward ledger; thất bại ủy thác Sinh Tử có thể mất một bậc.

**Cập nhật triển khai (2026-09-22, đợt tiếp theo):**

- **A.2 Lão hóa/Kế vị:** NPC có tuổi, ngày sinh mô phỏng và thọ nguyên lấy từ `REALMS`; đến hạn thì viên tịch, đệ tử có liên kết `su_do` kế thừa một phần chức trách, nếu không thì ghi vai trò trống; sự kiện được ghi vào Node History. Đã có kiểm thử cho nhánh vai trò trống.
- **A.3 Di cư mùa/Sự kiện:** NPC itinerant chọn tuyến theo mùa tới các điểm trú đông/hội tụ đã cấu hình; khi World Event bắt đầu ở pha điềm báo, một Tử Vi Du Nhân được đưa tới node trong vùng, mang tin đồn về biến cố rồi rời đi sau khi sự kiện khép lại.
- **A.4 Dấu vết:** mỗi lần NPC di chuyển để dấu vết có hạn ba ngày; action Truy Tung chỉ trả hướng vừa rời đi, có xác suất dấu giả và không tiết lộ vị trí hiện tại.
- **A.5 Lập nghiệp:** thương nhân itinerant đếm lượt ghé node vô chủ; từ ngưỡng tám lượt có xác suất dựng quầy, ghi lịch sử node và lưu settlement riêng theo save.
- **B.2 Quà tặng:** action tặng một vật phẩm có trong túi; sở thích theo nhóm vai trò/tags tạo mức Thiện Cảm khác nhau, quà phản chủ đề có thể làm giảm Thiện Cảm. Vật phẩm được trừ đúng một đơn vị.
- **B.3 Uy hiếp:** chỉ mở với Tà Nhiễm ≥50 và chênh lệch lực đủ lớn; hành động làm đứt Tín/Thiện Cảm, tạo lời khai tình báo và có xác suất gây tổn hại quan hệ tổ chức.
- **B.4 Tin đồn:** thắng cường địch, đột phá và hành động bị cấm có thể phát tin đồn có nguồn/độ tin cậy/hạn dùng; nhân chứng và mạng NPC chuyển tiếp tin theo tick, NPC ghi nhận tin trước lần gặp đầu để điều chỉnh thái độ.
- **B.5 Thử lòng:** NPC quan trọng buộc thử thách trước khi lập Neo Nhân Tính hoặc thỉnh giáo bí pháp; thử thách có hạn 14 ngày, hoàn thành/vi phạm tác động lên Tín và thời gian thử lại.
- **B.6 Phản bội NPC:** chỉ có điều kiện khi NPC đồng hành hoặc Tín cao và Tà Nhiễm vượt ngưỡng riêng/đối thủ đưa giá cao; ghi dấu hiệu trước một ngày rồi mới chuyển NPC sang thù địch.
- **C.2 Chính trị:** lão hóa lãnh đạo có thể mở khủng hoảng kế vị; Trưởng Lão trở lên chọn phe, kết quả lưu người đứng đầu/hướng faction/ổn định. Đòi hỏi NPC faction có role và lifespan hợp lệ.
- **C.3 Rời tổ chức:** yêu cầu xác nhận lần hai sau cảnh báo rủi ro Neo; xác nhận sẽ làm hỏng Neo gắn với NPC thuộc tổ chức cũ, NPC cũ chuyển thù địch, tạo actor “Chấp Pháp Truy Đồ” truy theo đường bản đồ. Khi áp sát, action encounter cho phép đối đầu, thoát thân hoặc nộp Công Đức chuộc lỗi; thù địch tổ chức vẫn còn sau encounter.
- **C.4 Kho bí pháp:** snapshot và action tra cứu/thỉnh học bí pháp độc quyền được khóa đến Chân Truyền; kỹ thuật được cấp theo promotion hiện hữu.
- **C.6 Hòa giải:** action chỉ khả dụng khi uy tín với hai bên đủ và căng thẳng ngoại giao cao; một lần thử theo cặp, skill check Danh Vọng/Đạo Tâm, thành công hạ tension và đặt cooldown ngăn chiến tranh nổ ngay.
- **C.7 Trung thành:** mỗi tick tháng có xác suất thấp tạo mật lệnh điều tra; bằng chứng và hai lựa chọn được hiển thị tách biệt, kết quả điều chỉnh cống hiến/uy tín khác nhau.

**Ghi chú kiểm thử/nội dung:** bộ kiểm thử xác nhận cả bốn mùa đều có node đích khai báo và NPC đọc danh sách đích từ metadata. Khi mở rộng bản đồ, gắn các tag như `winter_market`, `winter_shelter`, `event_market`, `event_gathering`, `spring_trade` hoặc `autumn_harvest` vào node mới; scheduler sẽ tự thêm node đó làm ứng viên.
