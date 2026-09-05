# HỆ THỐNG SỰ KIỆN NGẪU NHIÊN (RANDOM EVENT SYSTEM)
> Đặc tả chi tiết cho 4 nhóm sự kiện xuất hiện khi Di Chuyển/Khám Phá trên bản đồ: **NPC**, **Quái
> Vật**, **Cơ Duyên**, **Động Phủ**. Dùng chung với `MAP_SYSTEM.md` (nơi gọi), `NPC_MONSTER_SYSTEM.md`
> (14 lớp thực thể), `Xianxin_map.md` (bảng trọng số vùng gốc), `CONG_PHAP_SYSTEM.md` &
> `HE_THONG_HOP_NHAT.md` (Mệnh Số, Công Pháp, Con Đường — dùng làm phần thưởng Cơ Duyên).

---

## 1. CƠ CHẾ ROLL SỰ KIỆN TỔNG QUÁT

```
rollMapEvent(node, character, trigger):
  // trigger: "moving_through" (dọc đường di chuyển) | "explore_action" (bấm nút Khám Phá) |
  //          "first_discovery" (node vừa lộ ra lần đầu, xem MAP_SYSTEM.md mục 2)

  1. Nếu node.cooldownUntil > now -> KHÔNG roll gì (node vừa vét cạn sự kiện gần đây)
  2. Roll xác suất CÓ sự kiện hay không:
       trigger == "moving_through"   -> 25% có sự kiện dọc đường
       trigger == "explore_action"   -> 90% có sự kiện (người chơi chủ động bỏ công Khám Phá)
       trigger == "first_discovery"  -> 100% có sự kiện (đảm bảo không node nào trống trơn lần đầu)
  3. Nếu CÓ sự kiện -> roll NHÓM sự kiện theo bảng trọng số của node.eventPoolTag (mục 2)
  4. Trong nhóm đã chọn -> roll SỰ KIỆN CỤ THỂ theo bảng chi tiết tương ứng (mục 3-6)
  5. Sau khi sự kiện kết thúc -> node.cooldownUntil = now + cooldownDuration (mục 7)
```

---

## 2. BẢNG TRỌNG SỐ NHÓM SỰ KIỆN THEO `eventPoolTag` (mở rộng từ `Xianxin_map.md` mục 5.3)

| eventPoolTag | NPC | Quái Vật | Cơ Duyên | Động Phủ |
|---|---|---|---|---|
| `tong_mon_an_toan` (trong tông môn) | 70% | 5% | 20% | 5% |
| `co_dinh_cot_truyen` (node cốt truyện) | 60% | 10% | 25% | 5% |
| `linh_vuc` (Linh Vực) | 40% | 30% | 25% | 5% |
| `hoang_da` (Hoang Dã) | 15% | 55% | 25% | 5% |
| `bien_thanh` (Biên Thành) | 50% | 20% | 20% | 10% |
| `cam_dia` (Cấm Địa) | 10% | 50% | 30% | 10% |
| `vuong_kinh` (Vương Kinh) | 65% | 5% | 20% | 10% |
| `hai_vuc_khong_vuc` (Hải Vực/Không Vực) | 25% | 35% | 30% | 10% |

> Động Phủ CỐ ĐỊNH tỷ lệ thấp (5-10%) ở mọi vùng vì đây là sự kiện hiếm/đáng giá — không nên xuất
> hiện tràn lan như NPC/Quái thường.

---

## 3. NHÓM SỰ KIỆN: NPC ENCOUNTER

Roll theo đúng bảng 14 lớp thực thể đã định nghĩa ở `NPC_MONSTER_SYSTEM.md` (mục 1 + 1B), NHƯNG
áp trọng số RIÊNG cho ngữ cảnh "gặp ngẫu nhiên trên đường" (khác với trọng số spawn cố định trong
quest):

| Lớp NPC | Trọng số gặp ngẫu nhiên | Ghi chú |
|---|---|---|
| NPC Thường Dân | 35% | Lữ khách, nông dân, thương lái nhỏ |
| Tán Tu (dùng schema NPC Tông Môn nhưng `faction=null`) | 25% | Có thể thù địch/trung lập/kết bạn tùy Danh Vọng |
| NPC Tông Môn (không phải của mình) | 15% | Cơ hội giao lưu/xung đột liên môn phái |
| Thương Nhân | 10% | Chợ di động, giá cả biến động theo vùng |
| Ma Đầu/Nghịch Đồ (chỉ nếu đã có `nemesis_trigger_condition` kích hoạt) | 5% | Xem `NPC_MONSTER_SYSTEM.md` 1B.3 |
| Dị Sĩ | 3% | Xem 1B.1 — có thể ban phúc/giáng họa |
| Nghịch Thương Nhân | 2% | Xem 1B.5 — trả bằng Thọ Nguyên/SAN |
| NPC Ẩn/Sự Kiện | 5% | Trigger Hidden Lore Quest |

### 3.1 Sub-event khi gặp NPC (ngẫu nhiên hóa phản ứng ban đầu, tăng đa dạng)
```
[Gặp NPC] -> roll thái độ ban đầu:
  60% Trung Lập     -> action bar: Nói Chuyện / Bỏ Qua / Tấn Công (mất Danh Vọng)
  20% Thân Thiện     -> có thể tặng info/dẫn đường/giảm giá nếu là Thương Nhân
  15% Cảnh Giác      -> phải vượt qua 1 check nhỏ (Danh Vọng/Aptitude) mới Nói Chuyện được
  5%  Thù Địch ngay  -> vào thẳng Combat Flow (nếu NPC hostile theo faction quan hệ)
```

---

## 4. NHÓM SỰ KIỆN: QUÁI VẬT ENCOUNTER

Roll độ mạnh quái theo `node.dangerLevel` (1-5), map sang các lớp trong `NPC_MONSTER_SYSTEM.md`:

| dangerLevel | Loại quái chủ yếu | % Elite | % Boss/Dị Quỷ |
|---|---|---|---|
| 1 | Trash Mob yếu (tier thấp) | 5% | 0% |
| 2 | Trash Mob thường | 12% | 0% |
| 3 | Trash Mob mạnh + Elite | 25% | 1% |
| 4 | Elite phổ biến | 40% | 3% |
| 5 (Cấm Địa/vùng cực nguy hiểm) | Elite mạnh, có Dị Quỷ | 50% | 8% |

- Quái Dị Biến (Eldritch Monster, mục 4.3 `NPC_MONSTER_SYSTEM.md`) chỉ xuất hiện ở `regionTag` là
  `cam_dia` hoặc `hai_vuc_khong_vuc`, cộng thêm +10% nếu nhân vật đang `Corruption_Rating > 40`
  (nhiễm tà thu hút Dị Biến — tạo vòng lặp rủi ro).
- Sau combat thắng: roll loot theo `loot_table_id` của quái đó (đã có cơ chế, tái sử dụng thẳng).

---

## 5. NHÓM SỰ KIỆN: CƠ DUYÊN (FORTUITOUS ENCOUNTER) — DANH SÁCH CHI TIẾT

Đây là nhóm cần đa dạng nhất để tạo cảm giác "thế giới sống động". Chia làm 6 loại con, mỗi loại
roll đều (hoặc theo trọng số riêng nếu muốn tinh chỉnh sau):

### 5.1 Cơ Duyên loại "Tự Nhiên Sinh Trưởng" (18%)
| Tên sự kiện cụ thể | Mô tả ngắn | Phần thưởng |
|---|---|---|
| Linh Thảo Ngộ Chủ | Phát hiện 1 khóm linh thảo hiếm mọc đúng lúc đúng chỗ | 1-3 nguyên liệu luyện đan tier ngẫu nhiên (theo `dangerLevel` node) |
| Linh Tuyền Ẩn Hiện | Tìm thấy mạch nước linh khí ngầm | Hồi đầy SAN + Linh Lực ngay lập tức, +Khí Vận tạm thời 1 giờ |
| Thiên Địa Dị Tượng | Chứng kiến hiện tượng thiên nhiên kỳ lạ (mây ngũ sắc, mưa hoa...) | +1 điểm Ngộ Tính vĩnh viễn (hiếm, hồi max 1 lần/tuần) |
| Yêu Thú Sản Noãn | Bắt gặp ổ trứng/con non của yêu thú | Lựa chọn: mang về nuôi (thú cưỡi tương lai) hoặc lấy trứng bán |

### 5.2 Cơ Duyên loại "Di Sản Người Xưa" (18%)
| Tên sự kiện cụ thể | Mô tả ngắn | Phần thưởng |
|---|---|---|
| Cổ Mộ Tàn Tích | Phát hiện mộ phần cổ xưa, có thể bị bẫy | Roll: Công Pháp cũ (grade ngẫu nhiên theo dangerLevel) HOẶC bẫy gây sát thương nhẹ |
| Tàn Quyển Rơi Rớt | Nhặt được 1 trang sách rách nát | Mảnh ghép Công Pháp (cần đủ N mảnh mới ráp thành 1 Công Pháp hoàn chỉnh — tạo động lực explore lặp lại) |
| Kiếm Gãy Cắm Đất | Một thanh kiếm gãy cắm sâu dưới đất, tỏa hàn khí | Vũ khí tier theo dangerLevel, có % nhỏ là Pháp Bảo có linh hồn (unique) |
| Bia Đá Khắc Chữ Cổ | Bia đá ghi lại 1 đoạn Con Đường thất truyền | +Điểm tương hợp Con Đường hiện tại (nếu Con Đường khớp nội dung bia) |

### 5.3 Cơ Duyên loại "Gặp Cao Nhân" (15%)
| Tên sự kiện cụ thể | Mô tả ngắn | Phần thưởng |
|---|---|---|
| Ẩn Sĩ Chỉ Điểm | Một lão giả ẩn danh tình cờ chỉ điểm 1 câu | +EXP tức thời (theo dangerLevel), có % nhỏ mở khóa Nghề Ẩn |
| Tiền Bối Độ Kiếp | Chứng kiến 1 tiền bối đang vượt kiếp gần đó (nguy hiểm nếu lại gần) | Đứng xem an toàn: học lỏm +Ngộ Tính tạm thời; Lại gần giúp đỡ: rủi ro/thưởng cao hơn |
| Đồng Đạo Lữ Hành | Gặp 1 tu sĩ cùng cảnh giới muốn kết bạn đồng hành | Tùy chọn: kết giao (mở NPC đồng hành tạm thời) hoặc từ chối |

### 5.4 Cơ Duyên loại "Thử Thách Nhỏ" (15%)
| Tên sự kiện cụ thể | Mô tả ngắn | Phần thưởng |
|---|---|---|
| Trận Pháp Mê Cung Nhỏ | Lạc vào 1 trận pháp mê hoặc quy mô nhỏ | Giải đố (dùng Trí/Aptitude) -> thưởng Linh Thạch/Mệnh Số nhỏ nếu qua |
| Hồ Ly Thử Lòng | 1 sinh vật biến hình thử thách đạo tâm người chơi | Chọn lựa đạo đức -> ảnh hưởng Corruption_Rating hoặc Danh Vọng tùy lựa chọn |
| Cầu Cứu Giả/Thật | Nghe tiếng kêu cứu — có thể là bẫy của Hắc Đạo hoặc thật | Cứu đúng: +Danh Vọng/thưởng; Cứu nhầm: rơi vào bẫy PK/cướp |

### 5.5 Cơ Duyên loại "Mệnh Số Trực Tiếp" (17%)
| Tên sự kiện cụ thể | Mô tả ngắn | Phần thưởng |
|---|---|---|
| Khí Vận Đột Biến | Vận may bất chợt ập tới không lý do | 1 Mệnh Số ngẫu nhiên (roll theo bảng chuẩn, KHÔNG ép tier) |
| Ngộ Đạo Giữa Đường | Đột nhiên lĩnh ngộ điều gì đó khi đang đi | 1 Mệnh Số HOẶC 1 Công Pháp Ngộ Đạo (xem nguồn gốc Công Pháp mục 11.8 HE_THONG_HOP_NHAT) |
| Mệnh Khế Vô Chủ | Tìm thấy 1 mảnh Mệnh Khế bị bỏ rơi | Mệnh Số + cảnh báo rủi ro nếu là Hung Cách (đúng cơ chế Mệnh Khế đã có) |

### 5.6 Cơ Duyên loại "Dị Biến/Rủi Ro Cao" (17%, CHỈ xuất hiện ở Cấm Địa/Hải Vực-Không Vực)
| Tên sự kiện cụ thể | Mô tả ngắn | Phần thưởng/Rủi ro |
|---|---|---|
| Tiếng Vọng Từ Vực Sâu | Nghe thấy âm thanh kỳ lạ không rõ nguồn gốc | -SAN nếu lại gần điều tra, nhưng có % ra Mệnh Số/Công Pháp Dị Hệ hiếm |
| Di Vật Tà Thần | Phát hiện 1 vật phẩm ám khí tà ác | Sở hữu: +sức mạnh nhưng +Corruption_Rating; Phá hủy: an toàn nhưng mất cơ hội |
| Cánh Cổng Không Toàn Vẹn | Một khe nứt không gian tạm thời mở ra | Vào: teleport tới 1 node ẩn xa xôi ngẫu nhiên (rủi ro lạc đường); Không vào: bỏ qua an toàn |

---

## 6. NHÓM SỰ KIỆN: ĐỘNG PHỦ (CAVE ABODE DISCOVERY)

Khác hẳn 3 nhóm trên — Động Phủ là 1 NODE RIÊNG trên bản đồ (`nodeType: "dong_phu"`), không phải
sự kiện thoáng qua. Khi random ra "Động Phủ" trong roll nhóm sự kiện (mục 2), nghĩa là 1 node ẩn
lân cận được XÁC ĐỊNH LÀ Động Phủ khi lộ ra (thay vì Hoang Dã/Cấm Địa thường).

### 6.1 Chuỗi chinh phục Động Phủ (kích hoạt qua action "Chinh Phục Động Phủ" ở `MAP_SYSTEM.md` mục 3)
```
[Bấm "Chinh Phục Động Phủ"]
        │
        ▼
[Roll loại Trở Ngại — 1 trong 3, có thể lặp lại 1-3 lớp tùy dangerLevel node]
   ├── "Hộ Pháp Thú canh giữ"     -> vào Combat Flow với Hộ Pháp Thú (NPC_MONSTER_SYSTEM.md 1B.4)
   ├── "Trận Pháp Phong Ấn"      -> giải đố/phá trận (dùng Công Pháp loại tran_phap nếu có, dễ hơn)
   └── "Cấm Chế Mệnh Số"          -> yêu cầu nộp/sở hữu 1 Mệnh Số đạt tier tối thiểu mới mở được
        │
        ▼ (vượt qua hết các lớp)
[Động Phủ được CHIẾM] -> node.claimedByPlayerId = character.id
        │
        ▼
[Nhận thưởng khởi tạo]: Linh Thạch + 1 Công Pháp/Mệnh Số ngẫu nhiên có sẵn trong động phủ (loot 1 lần)
        │
        ▼
[Trở thành căn cứ cá nhân]: mở khóa action "Bố Trận Phòng Thủ", "Đả Tọa Tu Luyện" tại đây có bonus
EXP cao hơn node thường (do đã thuộc sở hữu, linh khí không bị chia sẻ), có thể bị NPC/player khác
tấn công chiếm đoạt nếu không Bố Trận đủ mạnh (tùy chọn PvP, xem mục 6.2).
```

### 6.2 Rủi ro giữ Động Phủ
- Nếu lâu không quay lại (không re-log/không củng cố Trận Pháp trong X ngày), % bị NPC Hắc Đạo
  hoặc player khác tới chiếm tăng dần theo thời gian vắng mặt.
- Đây là điểm neo tạo động lực quay lại bản đồ thường xuyên — không chỉ đi tới rồi bỏ quên.

---

## 7. COOLDOWN & CHỐNG SPAM

```
cooldownDuration theo loại sự kiện vừa xảy ra:
  NPC Encounter thường     -> 5 phút
  Quái Vật thường           -> 3 phút (để farm được nhưng không spam liên tục)
  Cơ Duyên bất kỳ loại nào  -> 30 phút (Cơ Duyên phải HIẾM mới có giá trị)
  Động Phủ (sau khi roll ra 1 lần) -> KHÔNG cooldown lặp lại — vì Động Phủ gắn cố định vào 1 node,
                                        không random lại nữa sau khi đã xác định
```
Trigger `"explore_action"` (bấm nút chủ động) có cooldown DÀI HƠN trigger `"moving_through"` (đi
ngang qua) cho CÙNG 1 node, để tránh việc đứng 1 chỗ bấm Khám Phá liên tục farm event.

---

## 8. CẤU TRÚC DỮ LIỆU EVENT CHUẨN (dùng chung cho cả 4 nhóm)

```json
{
  "eventId": "co_duyen_linh_thao_ngo_chu",
  "group": "co_duyen",
  "subType": "tu_nhien_sinh_truong",
  "name": "Linh Thảo Ngộ Chủ",
  "description": "Bạn phát hiện một khóm linh thảo hiếm mọc đúng lúc đúng chỗ.",
  "weight": 100,
  "minDangerLevel": 1,
  "maxDangerLevel": 5,
  "regionRestriction": null,
  "rewards": [
    { "type": "material", "tierScaleWithDanger": true, "amountRange": [1, 3] }
  ],
  "choices": null,
  "cooldownGroup": "co_duyen"
}
```
Sự kiện có lựa chọn (VD "Hồ Ly Thử Lòng", "Cầu Cứu Giả/Thật") dùng thêm field `choices[]`:
```json
"choices": [
  { "label": "Giúp đỡ", "outcome": { "danhVong": +5, "rewardId": "thuong_giup_do" } },
  { "label": "Bỏ qua", "outcome": { "danhVong": 0 } },
  { "label": "Tấn công/Lợi dụng", "outcome": { "danhVong": -10, "rewardId": "cuop_doat" } }
]
```

---

## 9. VIỆC CẦN LÀM TIẾP (chưa code, đang chờ xác nhận)

1. Viết đầy đủ data file (JSON) liệt kê TẤT CẢ event cụ thể ở mục 5 theo đúng schema mục 8 — bảng
   trên mới là danh sách rút gọn tên+mô tả, cần bổ sung `weight`/`rewards` cụ thể từng cái.
2. Code `rollMapEvent()` (mục 1) nối vào `MAP_SYSTEM.md`'s action Di Chuyển/Khám Phá.
3. Quyết định: "Mảnh ghép Công Pháp" (mục 5.2) cần bao nhiêu mảnh mới ráp đủ 1 Công Pháp hoàn
   chỉnh — số này ảnh hưởng trực tiếp tần suất phải lặp lại Cơ Duyên loại đó.
4. Cân bằng lại % cooldown/trọng số sau khi có số liệu chơi thử thật (giống cách đã làm ở tài liệu
   cân bằng tốc độ lên cấp trước đó — đo trước, chỉnh sau, không đoán mò).
## Trạng thái triển khai trong engine

### Đồng bộ bắt buộc với Open World Map

- Mỗi lần `move()` thành công đều đi qua `maybeTriggerRandomEncounter()`; cổng này luôn ghi nhận một biến cố bản đồ, kể cả khi không roll trúng NPC dị sĩ.
- Biến cố được chọn theo node hiện tại: thú săn địa phương, mạch Linh Thạch, điềm báo tà nhiễm hoặc manh mối khám phá. Không có random event nào xuất hiện thành nút taskbar cố định.
- Node procedural dùng chung `region`, `dangerLevel`, `corruption`, `linhKhiDensity`, `enemies` và `searchable`, nên event tự đồng bộ với sinh thái nơi chốn thay vì bảng random toàn cục.
- Quái chủ động theo lãnh địa: node có `enemies` có thể phát động phục kích ngay khi tới nơi; `maybeSpawnCombatExtras()` tiếp tục kiểm tra thú săn, truy sát tông môn và hộ pháp cấm địa.
- Encounter được ghi vào Story Panel, tăng `state.flags.mapEventCount`, tôn trọng giao chiến/Thanh Tỉnh/cooldown và không chặn lượt kế tiếp khi event không hợp lệ.

### Quy tắc nhịp sự kiện

1. Di chuyển vào node nguy hiểm: ưu tiên predator/ambush trước phần thưởng.
2. Di chuyển vào node linh khí cao: tăng xác suất tài nguyên hoặc cơ duyên tu luyện.
3. Di chuyển vào node tà nhiễm cao: bắt buộc có dấu hiệu bất thường và có thể trừ Thanh Tỉnh.
4. Quay lại node đã khám phá: event không lặp y nguyên; trạng thái node, loot và cờ đã gặp được lưu trong save.

- `maybeTriggerRandomEncounter(state)` là cổng duy nhất cho sự kiện phát sinh khi di chuyển/khám phá; encounter được ghi vào `state.history` để Story Panel hiển thị tuần tự.
- Encounter random không được đưa thành nút taskbar; người chơi chỉ gặp qua hành động bản đồ và các bảng NPC/quái vật/cơ duyên hiện có.
- Sự kiện tôn trọng `state.pendingEnding`, trạng thái chiến đấu, Thanh Tỉnh và cooldown vùng; kết quả đi qua `updateDerived()` và autosave.
- Khi không có event hợp lệ, engine ghi thông báo an toàn thay vì chặn lượt tiếp theo.
