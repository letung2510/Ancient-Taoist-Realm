# PHÁC THẢO TÍNH NĂNG MỚI — VÒNG 3: ĐÀO SÂU TU VI & CON ĐƯỜNG
> Tiếp nối 2 vòng brainstorm trước (đã deploy) + `WORLD_INTERCONNECTION_SYSTEM.md`. Lần này tập
> trung làm GIÀU hệ thống Tu Vi/Cấp/Con Đường — hiện tại chỉ có "tích EXP → đủ 5 cổng → Đột Phá",
> khá một chiều. Đồng thời dệt thêm tương tác Map/NPC VÀO CHÍNH quá trình tu luyện, không tách rời.

---

## 1. ĐA DẠNG HÓA NGUỒN TU VI (hiện chỉ có "Tu Luyện"/"Tự Động Tu Luyện"/"Bế Quan")

| Nguồn mới | Cơ chế | Tại sao khác "Tu Luyện" thường |
|---|---:|---|
| **Chiến Ngộ** (Insight from Combat) | Thắng Quái/NPC có Cảnh Giới ngang hoặc cao hơn mình → +Tu Vi bonus theo % chênh lệch sức mạnh | Thưởng người dám đánh "vượt cấp", không chỉ ai cày node an toàn lâu nhất |
| **Cảnh Ngộ** (Insight from Environment) | Đứng tại node có `linhKhiDensity` cao ĐỦ LÂU (không thao tác gì) → Tu Vi tích lũy thụ động NHANH hơn Tu Luyện chủ động, nhưng dễ bị gián đoạn (bất kỳ combat/sự kiện nào xảy ra sẽ reset đồng hồ tích lũy) | Đánh đổi rủi ro (đứng yên dễ bị phục kích) lấy tốc độ |
| **Vấn Đạo** (Insight from NPC Dialogue) | Hỏi chuyện 1 NPC CÙNG Con Đường (roll ngẫu nhiên gặp trên map, xem mục 5) → +Tu Vi 1 lần, lượng theo Cảnh Giới NPC đó so với mình | Biến việc gặp NPC ngẫu nhiên thành có giá trị cơ học thật, không chỉ lore |
| **Đấu Ngộ** (Insight from Friendly Spar) | Tỷ thí giao hữu (không sát thương thật, dùng % giả lập) với NPC/Quái cùng Con Đường → nhỏ hơn Chiến Ngộ nhưng KHÔNG rủi ro chết | Lựa chọn an toàn hơn cho người sợ rủi ro |
| **Độc Ngộ** (Insight from Solitude — chỉ khi Bế Quan) | Xem mục 2 | — |

> Tất cả nguồn trên CỘNG DỒN vào cùng 1 thanh Tu Vi hiện có — không tạo thanh EXP riêng, chỉ đa
> dạng hóa CÁCH LẤP ĐẦY thanh đó.

---

## 2. BẾ QUAN TU LUYỆN — CHÍNH THỨC HÓA (đã có nút, giờ thêm cơ chế thật)

```
Bế Quan {
  durationDays: number (người chơi tự chọn, 1-30 ngày game)
  tuViMultiplier: 1.5x - 3.0x (dài hơn = hệ số cao hơn, nhưng xem rủi ro dưới)
  isVulnerable: true   // trong lúc Bế Quan, KHÔNG thể phản ứng action nào khác — nếu bị tấn công/
                        // sự kiện ập tới, tự động dùng phản ứng MẶC ĐỊNH yếu nhất
}

Rủi ro theo thời lượng đã chọn (càng dài càng nguy hiểm, đúng tinh thần world này):
  - 1-5 ngày: an toàn, hệ số 1.5x
  - 6-15 ngày: 10% cơ hội bị "Tiếng Vọng Từ Ngoài Kia" ghé thăm GIỮA lúc Bế Quan (không thể từ
    chối/chọn nhánh như bình thường — tự động roll kết quả xấu nhất trong 3 lựa chọn cũ), hệ số 2.0x
  - 16-30 ngày: 25% cơ hội bị NPC/Quái thù địch phát hiện đột nhập trong lúc không phòng bị (combat
    tự động với stat GIẢM 50% do đang "nhập định"), hệ số 3.0x
  Thoát Bế Quan SỚM (chủ động) bất cứ lúc nào: nhận Tu Vi theo TỶ LỆ thời gian đã qua, không phạt.
}
```
Liên kết Map: chọn Bế Quan tại node có `ownerFactionId` là Tông Môn mình đang phục vụ → GIẢM 50% rủi
ro ở 2 mốc trên (có đệ tử canh gác) — biến việc "thuộc về 1 tổ chức" có lợi ích cơ học rõ ràng ngoài
lore, và tạo lý do quay lại Tông Môn thường xuyên thay vì luôn Bế Quan giữa hoang dã cho tiện.

---

## 3. TẨU HỎA NHẬP MA (CULTIVATION DEVIATION) — RỦI RO KHI CÀY QUÁ NHANH

```
Mỗi lần nhận Tu Vi từ bất kỳ nguồn nào ở mục 1, cộng vào `recentTuViVelocity` (tốc độ nhận trong 24h
game gần nhất). Nếu vượt ngưỡng an toàn theo Cấp hiện tại:
  roll % Tẩu Hỏa Nhập Ma = min(30%, (velocity - safeThreshold) / safeThreshold × 20%)

Nếu trúng:
  - Nhẹ: mất 10-20% Tu Vi ĐANG TÍCH LŨY (không mất Tu Vi đã CHỐT của Cấp trước), +5 Điểm Điên Loạn
  - Nặng (Corruption_Rating > 50 làm tăng xác suất rơi vào nhánh này): 1 Biến Dị Thân Thể MỚI xuất
    hiện ngay lập tức (dùng bảng đã có ở WORLDVIEW_ATMOSPHERE.md mục 9), bù lại +Tu Vi vẫn giữ
    nguyên (không mất) — "cái giá trả bằng thân thể thay vì tiến độ"
```
> Mục đích: KHÔNG cấm cày nhanh (vẫn cho phép, người chơi thích rủi ro cao được lợi), nhưng tạo lý
> do để KHÔNG PHẢI lúc nào cũng dồn hết mọi nguồn Tu Vi cùng lúc — nhịp độ trở thành 1 quyết định
> chiến thuật thật.

---

## 4. ĐẠO TÂM (DAO HEART) — CHỈ SỐ MỚI ĐO ĐỘ KIÊN ĐỊNH VỚI CON ĐƯỜNG

```
daoTam: 0-100, KHÔNG roll ngẫu nhiên lúc tạo nhân vật (khác Aptitude/Ngộ Tính) — chỉ tăng/giảm qua
HÀNH VI liên quan trực tiếp tới Con Đường đã chọn:
  + tăng khi: hoàn thành quest moral_choice ĐÚNG hướng Con Đường, Đột Phá thành công liên tiếp không
    đổi Con Đường, từ chối 1 Cơ Duyên/phần thưởng không hợp Con Đường dù hấp dẫn hơn
  - giảm khi: dùng Cấm Thuật trái hệ với Con Đường, đổi Con Đường (mục 6), thất bại Vượt Dị Tượng
    liên tiếp nhiều lần

Hiệu ứng:
  daoTam >= 80: +10% match_score TRẦN (cộng thêm, không nhân) với Con Đường hiện tại
  daoTam <= 20: dễ bị Nghịch Hành Đạo "dụ dỗ" hơn — tăng % xuất hiện lựa chọn dị hóa xấu ở các mốc
                Tà Thần dòm ngó (đã thiết kế ở WORLDVIEW_ATMOSPHERE.md mục 16)
```
Đạo Tâm là chỉ số DUY NHẤT không thể "farm" nhanh bằng tài nguyên/Linh Thạch — chỉ tích lũy qua thời
gian và lựa chọn nhất quán, tạo chiều sâu roleplay thật cho việc "kiên định 1 con đường".

---

## 5. TƯƠNG TÁC NPC XOAY QUANH TU LUYỆN (nối trực tiếp mục 1 "Vấn Đạo"/"Đấu Ngộ")

### 5.1. Đạo Hữu Ngẫu Nhiên (Random Fellow Cultivator)
Roll trên map (dùng đúng cơ chế NPC Encounter đã có ở `RANDOM_EVENT_SYSTEM.md`), NHƯNG thêm điều
kiện: nếu NPC roll ra CÙNG Con Đường với player → mở thêm 2 action đặc biệt "Vấn Đạo" và "Đấu Ngộ"
(mục 1) thay vì chỉ Nói Chuyện/Bỏ Qua/Tấn Công thông thường.

### 5.2. Bảng Xếp Hạng Tu Vi Vùng (Regional Cultivation Rankboard)
Tại mỗi Vương Kinh/Tông Môn lớn, có 1 "bảng đá" hiển thị Top NPC nổi bật + player (nếu đủ nổi tiếng)
theo Cấp hiện tại trong VÙNG đó — tạo áp lực cạnh tranh nhẹ, và là nguồn TIN TỨC (biết trước NPC nào
mạnh đáng để Vấn Đạo/tránh Đấu Ngộ nhầm đối thủ quá tầm).

### 5.3. Trưởng Lão Chỉ Điểm (Master's Guidance)
NPC cấp cao thuộc Tông Môn mình phục vụ, mỗi worldTick có % nhỏ chủ động MỜI player (thông báo
Story Panel, không cần player chủ động tìm) tới "chỉ điểm" — 1 buổi hội thoại ngắn cho Tu Vi bonus
+ khả năng hé lộ suggestFateForRealmRequirement() sớm hơn dự kiến. Chỉ xảy ra nếu factionReputation
đủ cao — biến việc đóng góp Tông Môn có hồi đáp chủ động thay vì chỉ mở khóa quest thụ động.

---

## 6. CHUYỂN ĐẠO (THAY ĐỔI CON ĐƯỜNG) — HIỆN CHƯA CÓ CƠ CHẾ NÀO

```
Điều kiện: cần tìm đúng 1 NPC "Chuyển Đạo Nhân" hiếm (loại NPC Ẩn, không phải lúc nào cũng có sẵn
trên map — random spawn cực thấp, hoặc mở qua world_discovery quest)

Cái giá:
  - daoTam hiện tại giảm mạnh về gần 0 (mất hết tích lũy kiên định cũ)
  - MẤT toàn bộ bonus tương hợp đã tích với Con Đường cũ (nhưng Mệnh Số/Công Pháp vật lý vẫn giữ)
  - Tu Vi ĐÃ CHỐT của Cấp hiện tại KHÔNG mất — chỉ đổi "hướng" tính match_score từ Cấp tiếp theo
  - Cooldown dài (không đổi lại được ngay, tránh việc thử tất cả 10 Con Đường tùy hứng)

Lý do tồn tại: cho phép sửa sai lựa chọn ban đầu (đặc biệt nếu Giai đoạn 1 khởi đầu đã roll/chọn
không như ý — nối vào bug đã sửa trước đó về bối cảnh khởi đầu) mà không cần Luân Hồi/Chuyển Sinh
toàn bộ nhân vật chỉ vì hối hận 1 lựa chọn Con Đường.
```

---

## 7. TIỂU KIẾP (MINOR TRIAL GIỮA CHỪNG 1 CẤP, KHÔNG CHỈ LÚC ĐỘT PHÁ)

```
Khi Tu Vi đạt ĐÚNG 50% ngưỡng yêu cầu của Cấp đích hiện tại (đang ở giữa chừng, chưa đủ Đột Phá),
trigger 1 LẦN DUY NHẤT "Tiểu Kiếp" — thử thách TỰ CHỌN (không bắt buộc, có thể bỏ qua không phạt):
  Vượt qua: +1 Điểm Chuyển Sinh KHÔNG cần chờ Chuyển Sinh thật (dự trữ sẵn), hoặc +Tu Vi bonus tức
            thời (người chơi chọn 1 trong 2)
  Thất bại: mất 1 phần nhỏ Tu Vi đang tích (như Vượt Dị Tượng đã có, không mất Cấp đã chốt)
  Bỏ qua: không mất gì, chỉ không có cơ hội thưởng thêm — HOÀN TOÀN optional
```
Tạo thêm 1 điểm chạm giữa chu kỳ tu luyện dài (đặc biệt Cấp cao mất nhiều thời gian), tránh cảm giác
"im lặng cày cuốc" kéo dài giữa 2 lần Đột Phá.

---

## 8. CON ĐƯỜNG × CHỦNG TỘC/LINH CĂN (thiên phú bẩm sinh, chưa khai thác)

```
Mỗi chủng tộc (Nhân/Yêu/Ma/Cổ/Linh/Ma Thần Hậu Duệ/Cơ Quan Tộc — đã có ở Xianxin_map.md mục 2) có
1 danh sách 2-3 Con Đường "Thiên Phú" (innate affinity):
  Yêu Tộc -> Ngũ Thú Đạo (+bonus daoTam tích lũy nhanh hơn 20%)
  Ma Tộc -> Âm Luật Đạo (+bonus tương tự)
  Linh Tộc -> Phong Thủy Đạo
  Cơ Quan Tộc -> Khôi Lỗ Đạo
  ...

Đây KHÔNG phải ép buộc (player vẫn chọn Con Đường bất kỳ tự do) — chỉ là bonus NẾU trùng, tạo thêm
1 lớp quyết định thú vị lúc chọn Hướng Khởi Đầu (đã thiết kế ở phần bối cảnh mở đầu trước đó): chọn
Con Đường thuận thiên phú chủng tộc (dễ hơn) hay đi ngược lại (khó hơn nhưng độc đáo hơn)?
```

---

## 9. TU VI THƯ (CULTIVATION JOURNAL — trực quan hóa tiến trình)

UI mới trong tab Cảnh Giới: biểu đồ Tu Vi theo thời gian (dùng GameClock timestamp có sẵn từ Story
Panel log), đánh dấu các mốc Đột Phá/Tiểu Kiếp/Tẩu Hỏa Nhập Ma đã trải qua — biến quá trình tu luyện
trừu tượng thành 1 "đường đời" có thể nhìn lại, đặc biệt có giá trị SAU Luân Hồi (đối chiếu đường
cong kiếp này vs kiếp trước nếu có Mộ Phần Tiền Kiếp đã thiết kế).

---

## 10. KHÁC BIỆT HÓA NGHI THỨC ĐỘT PHÁ THEO TỪNG CON ĐƯỜNG (GIỮ NGUYÊN QUY TRÌNH GỐC)

Quy trình 5 cổng gốc (`Gọi Mệnh → Đối Chiếu Con Đường → Dựng Neo → Vượt Dị Tượng → Trả Giá`) GIỮ
NGUYÊN 100% — không đổi số bước, không đổi thứ tự, không đổi Cấp nào cần bao nhiêu bước (đã chốt ở
`BREAKTHROUGH_RITUAL_DETAIL.md`). Chỉ NỘI DUNG BÊN TRONG 3 cổng "Dựng Neo"/"Vượt Dị Tượng"/"Trả Giá"
thay đổi theo Con Đường — 2 cổng đầu (Gọi Mệnh/Đối Chiếu Con Đường) là kiểm tra số liệu thuần, giữ
nguyên chung cho mọi Con Đường vì bản chất không cần khác biệt hóa.

### 11.1. Bảng khác biệt hóa đầy đủ 10 Con Đường

| Con Đường | Vượt Dị Tượng (hình thức + cách vượt) | Thiên hướng Dựng Neo | Trả Giá (đổi loại tài nguyên) |
|---|---|---|---|
| **Kiếm Đạo** | Đối mặt "Kiếm Ảnh" — 1 bản sao ảo của chính mình cầm kiếm, thắng bằng combat check thuần (PHY/Aptitude) | Neo VẬT PHẨM — 1 vũ khí cụ thể đã gắn bó | Trừ **Khí Huyết tối đa tạm thời** (10%, hồi dần sau vài ngày) thay vì Thanh Tỉnh |
| **Đan Đạo** | Phải luyện thành công 1 viên đan NGAY TRONG nghi thức (skill check Đan Đạo riêng nếu có nghề, hoặc Ngộ Tính nếu chưa) | Neo ĐỊA ĐIỂM — 1 lò luyện đan/dược viên cụ thể | Trừ **nguyên liệu quý** (Linh Thạch/thảo dược hiếm) thay vì Thanh Tỉnh |
| **Phù Đạo** | Giải mã 1 đạo phù cổ xuất hiện ngẫu nhiên (skill check Ngộ Tính thuần) | Neo VẬT PHẨM — 1 bùa hộ mệnh tự vẽ | Giữ NGUYÊN Thanh Tỉnh (chuẩn gốc) |
| **Phong Thủy Đạo** | **BẮT BUỘC di chuyển** tới 1 node "long mạch" cụ thể trên bản đồ mới thực hiện được cổng này (không làm tại chỗ) | Neo ĐỊA ĐIỂM bắt buộc (không cho chọn loại khác) | Giữ nguyên Thanh Tỉnh |
| **Ngũ Thú Đạo** | Phải thuần hóa/chiến thắng 1 Dị Thú thật xuất hiện riêng cho nghi thức (nối thẳng hệ Thuần Hóa Dị Thú) | Neo THÚ ĐỒNG HÀNH (loại đặc biệt, không phải người/vật/địa điểm) | Trừ **Khí Huyết** như Kiếm Đạo |
| **Khôi Lỗi Đạo** | Phải sửa/lắp ráp đúng 1 cơ quan phức tạp trong thời gian giới hạn (skill check kỹ thuật) | Neo VẬT PHẨM — 1 cơ quan/con rối tự chế | Trừ **Linh Thạch** số lượng lớn thay vì Thanh Tỉnh |
| **Âm Luật Đạo** | Đối mặt 1 vong hồn/oán khí THẬT (SAN-based, khó hơn mức chuẩn 1.5x) | Neo NGƯỜI ĐÃ MẤT (loại khó dựng nhất — cần tìm đúng 1 vong hồn chịu làm Neo) | Trừ **Thọ Nguyên** (2-5 năm) thay vì Thanh Tỉnh — "âm luật đòi mạng, không đòi tâm trí" |
| **Mộng Cảnh Đạo** | Diễn ra TRONG lớp Mộng Cảnh riêng (nếu đã build) — thời gian trôi khác, thất bại có % nhỏ "lạc" thêm 1 lượt trước khi thoát được | Neo KÝ ỨC (biến thể của Neo người/địa điểm, mang tính trừu tượng hơn) | Giữ nguyên Thanh Tỉnh, nhưng số lượng gấp đôi (15 thay vì 5 nếu Cấp 11+) |
| **Luyện Thể Đạo** | Thử thách THỂ CHẤT thuần túy (PHY/Aptitude, KHÔNG dùng Ngộ Tính) — fail có % nhỏ sinh luôn 1 Biến Dị Thân Thể | Neo THÂN THỂ (một vết sẹo thề nguyện/1 phần cơ thể hiến tế nhỏ, không hồi phục) | Trừ **Khí Huyết tối đa VĨNH VIỄN** 2-3% mỗi lần (không hồi, tích lũy qua nhiều lần Đột Phá — cái giá thật sự của Luyện Thể) |
| **Tinh Tướng Đạo** | CHỈ thực hiện được vào đúng khung giờ "sao chiếu mệnh" theo GameClock (time-gated, phải chờ đúng lúc) | Neo MỆNH SỐ — dùng chính 1 Mệnh Số đang sở hữu làm Neo thay vì người/vật/địa điểm | Hiến **1 điểm Mệnh Điểm** từ 1 Mệnh đang active thay vì Thanh Tỉnh |

### 11.2. Nguyên tắc thiết kế đằng sau bảng trên (để mở rộng thêm Con Đường sau này nếu cần)
- **Vượt Dị Tượng** luôn đổi HÌNH THỨC thử thách theo chủ đề Con Đường (combat/skill-check/time-
  gated/map-gated) nhưng GIỮ NGUYÊN cơ chế nền (vẫn là 1 roll thành/bại theo công thức đã có ở
  `BREAKTHROUGH_RITUAL_DETAIL.md` mục 6.4.1, chỉ đổi input stat nào được dùng để tính successChance).
- **Dựng Neo** luôn gợi ý/ưu tiên 1 LOẠI Neo cụ thể khớp chủ đề (không cấm hoàn toàn loại khác, trừ
  Phong Thủy Đạo là ngoại lệ BẮT BUỘC vì bản chất Con Đường này gắn chặt với địa điểm).
- **Trả Giá** đổi LOẠI TÀI NGUYÊN bị trừ (không phải luôn là Thanh Tỉnh) theo đúng triết lý "cái giá
  phải khớp bản chất Con Đường" — Kiếm/Ngũ Thú Đạo trả bằng máu thịt, Đan/Khôi Lỗi Đạo trả bằng vật
  chất, Âm Luật Đạo trả bằng sinh mệnh, Luyện Thể Đạo trả bằng chính thân thể VĨNH VIỄN (nặng nhất
  trong 10 Con Đường, đúng tinh thần "tu luyện thân thể là con đường tàn khốc nhất").

---


## 11. GIẢI QUYẾT DỨT ĐIỂM 4 VIỆC ĐÃ TREO (không còn là câu hỏi mở — đây là quyết định cuối)

### 11.1. Số liệu cụ thể cho Tẩu Hỏa Nhập Ma (mục 3) và Bế Quan (mục 2)
```
safeThreshold(level) = requiredExpForLevel(level) × 5% MỖI NGÀY GAME
  // nghĩa là: tích đủ 1 Cấp trong ~20 ngày game liên tục là NHỊP AN TOÀN chuẩn

recentTuViVelocity = tổng Tu Vi nhận được trong 24h game gần nhất (cộng dồn TẤT CẢ nguồn ở mục 1)

if (recentTuViVelocity > safeThreshold × 150%):
    tyLeTauHoa = min(30%, (recentTuViVelocity / safeThreshold - 1.5) × 40%)
    // VD velocity = 300% safeThreshold -> (3.0-1.5)*40% = 60%, clamp về 30% (trần tuyệt đối)
else:
    tyLeTauHoa = 0%   // dưới 150% nhịp chuẩn, không có rủi ro gì
```
Bế Quan (mục 2) giữ nguyên 3 mốc hệ số đã đề xuất (1.5x/2.0x/3.0x theo 1-5/6-15/16-30 ngày) — số này
đã đủ cụ thể để code thẳng, không cần chỉnh thêm.

### 11.2. `daoTam` — QUYẾT ĐỊNH: TÁCH RIÊNG, KHÔNG GỘP VỚI CORRUPTION, NHƯNG CÓ TƯƠNG TÁC RÕ RÀNG
Lý do không gộp: 2 chỉ số đo 2 THỨ KHÁC NHAU về bản chất — Corruption đo mức độ **bị nhiễm tà từ
bên ngoài** (có thể xảy ra ngoài ý muốn), còn `daoTam` đo mức độ **kiên định nội tại với lựa chọn đã
đưa ra** (chỉ đổi qua hành vi chủ động). 1 nhân vật hoàn toàn có thể vừa Corruption cao vừa `daoTam`
cao (1 tà tu kiên định dấn thân theo tà đạo, biết rõ mình đang làm gì) — nếu gộp chung 1 field theo
hướng ngược dấu thì KHÔNG THỂ biểu diễn được trường hợp này, mất đi 1 chiều sâu roleplay quan trọng.

Thay vào đó, thêm ĐÚNG 1 công thức tương tác rõ ràng (không tạo field mới, chỉ thêm phép tính):
```
effectiveCorruptionGain = baseCorruptionGain × (1 - daoTam / 200)
// daoTam=0 -> không giảm gì; daoTam=100 -> giảm 50% tốc độ nhiễm Corruption
// Ý nghĩa: ý chí kiên định giúp CHẬM quá trình tha hóa, nhưng không ngăn được hoàn toàn nếu nhân
// vật chủ động chọn hành vi gây Corruption (daoTam không phải "miễn nhiễm", chỉ là "đề kháng")
```

### 11.3. Chuyển Đạo (mục 6) — XÁC NHẬN: không cần data mới
Đúng như đã ghi — `match_score`/`tags` theo 10 Con Đường đã có sẵn (từ `HE_THONG_HOP_NHAT.md` mục
7.1, đã dùng để sinh `path_affinity` cho Mệnh Số ở pha trước). Chuyển Đạo chỉ cần 1 hàm
`switchPathContext(character, newPathId)` đổi lại `character.currentPathId` rồi TÍNH LẠI match_score
theo bảng cũ với path mới — không viết thêm bảng nào khác.

### 11.4. Thiên Phú Chủng Tộc × Con Đường — HOÀN THIỆN ĐỦ 7/7 CHỦNG TỘC
| Chủng tộc | Con Đường Thiên Phú | Hiệu ứng |
|---|---|---|
| Yêu Tộc | Ngũ Thú Đạo | +20% tốc độ tích `daoTam` nếu theo Con Đường này |
| Ma Tộc | Âm Luật Đạo | +20% tốc độ tích `daoTam` |
| Linh Tộc | Phong Thủy Đạo | +20% tốc độ tích `daoTam` |
| Cơ Quan Tộc | Khôi Lỗi Đạo | +20% tốc độ tích `daoTam` |
| **Nhân Tộc** | KHÔNG thiên vị Con Đường nào (đúng lore "căn cơ cân bằng, thích nghi cao" đã có sẵn) | Thay vào đó: +5% tốc độ tích `daoTam` áp dụng CHO MỌI Con Đường bất kể chọn gì — bù lại bằng tính linh hoạt thay vì chuyên sâu 1 hướng |
| **Ma Thần Hậu Duệ** | Âm Luật Đạo VÀ Luyện Thể Đạo (2 Con Đường cùng lúc, hiệu ứng thấp hơn 1 chút mỗi cái) | +12% tốc độ tích `daoTam` cho MỖI Con Đường trong 2 cái trên (phản ánh bản chất lai Ma Tộc/Nhân Tộc — vừa dính dáng âm giới vừa mang thân xác người) |
| **Cổ Tộc** | Tinh Tướng Đạo | +20% tốc độ tích `daoTam` (căn cơ thượng cổ hiểu thiên tượng/vận mệnh sâu sắc hơn chủng tộc khác) |

Đã hoàn thiện đủ 7/7 — không còn khoảng trống nào trong bảng Thiên Phú Chủng Tộc.

