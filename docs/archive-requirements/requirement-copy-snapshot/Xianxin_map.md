# THẾ GIỚI TIÊN HIỆP — "VẠN GIỚI LỘ" (Tài liệu nền tảng game)

> Tài liệu này mô tả bối cảnh thế giới mở cho game text RPG tiên hiệp: nhiều chủng tộc, hàng trăm tông môn/thế gia/vương triều, tán tu, thế lực hắc đạo, cùng hệ thống stats ngẫu nhiên để sinh (procedural generate) thế lực và nhân vật.

---

## 1. TỔNG QUAN THẾ GIỚI

**Tên thế giới:** Vạn Giới Lộ — một đại lục trung tâm (Trung Vực) bao quanh bởi 4 vực phụ (Đông Hoang, Tây Mạc, Nam Chướng, Bắc Nguyên) và các hải vực, không vực, minh giới rải rác.

- Thế giới **mở**: người chơi có thể đi bất kỳ đâu, tất cả khu vực đều có thể sinh sự kiện/thế lực ngẫu nhiên.
- Linh khí thiên địa không đồng đều → độ giàu tài nguyên/độ khó tu luyện khác nhau theo vùng → tạo động lực tranh đoạt lãnh thổ.
- Thời gian trò chơi trôi theo **Kỷ Nguyên** (Kỷ) — mỗi Kỷ khoảng 500-1000 năm, có thể xảy ra "Đại Kiếp" (thiên tai/chiến tranh diệt thế) làm reset một phần bản đồ thế lực.

### 1.1 Các vùng lớn (region types – dùng để gắn tag sinh thế lực)
| Loại vùng | Đặc điểm | Linh khí | Nguy hiểm |
|---|---|---|---|
| Linh Vực | Đất thánh, tông môn lớn tranh giành | Rất cao | Cao (nhiều cường giả) |
| Hoang Dã | Rừng núi chưa khai phá | Trung bình-cao | Cao (yêu thú) |
| Biên Thành | Thành trấn tán tu, chợ đen | Thấp-trung | Trung bình (trộm cướp) |
| Cấm Địa | Di tích thượng cổ, tử vực | Cực cao | Cực cao |
| Vương Kinh | Thủ đô thế tục, thế gia quyền quý | Trung bình | Trung bình (chính trị) |
| Hải Vực/Không Vực | Đảo trôi, hạm đội tu sĩ | Biến động | Biến động |

---

## 2. CHỦNG TỘC (RACES)

Mỗi chủng tộc có thiên phú tu luyện, tuổi thọ nền, và thái độ với "Nhân Tộc" (mặc định phe trung lập/đa số).

| Chủng tộc | Thiên phú | Tuổi thọ nền | Ghi chú |
|---|---|---|---|
| Nhân Tộc | Cân bằng, dễ đột phá cảnh giới thấp | ~120 năm | Chủng tộc mặc định, đa dạng thế lực nhất |
| Yêu Tộc | Thân thể mạnh, linh hồn yếu | ~300-800 năm (tùy loài) | Chia làm hàng chục "loài yêu" (Hổ, Xà, Cầm, Long...) |
| Ma Tộc | Hấp thụ sát khí/oán khí tu luyện | ~500 năm | Bị Chính Đạo cảnh giác, sống ở Ma Vực |
| Cổ Tộc (Yêu Cổ Chủng) | Thượng cổ tàn tồn, sức mạnh dòng máu | Gần bất tử nếu không chết trận | Số lượng cực ít, huyết mạch loãng dần |
| Linh Tộc (Tinh Linh) | Ngự ngũ hành/thiên địa chi lực | ~1000 năm | Sống ẩn dật, kén giao tiếp |
| Ma Thần Hậu Duệ | Lai giữa Ma Tộc và Nhân Tộc | Biến động | Bị kỳ thị, thường thành tán tu hoặc phản diện |
| Cơ Quan Tộc | Sinh vật luyện chế bằng trận pháp/cơ quan | Vô hạn (bảo trì được) | Hiếm, gắn với 1-2 môn phái kỳ môn |

> Gợi ý sinh ngẫu nhiên: gán trọng số xuất hiện theo vùng (VD: Yêu Tộc dày đặc ở Hoang Dã, Ma Tộc ở Cấm Địa/Ma Vực).

---

## 3. HỆ THỐNG CẢNH GIỚI TU LUYỆN

Tài liệu bản đồ không định nghĩa một thang tu vi riêng. Player, NPC và thế lực đều dùng đúng **14 cấp phẳng, không có tiểu cảnh** tại mục 6 của `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`; dữ liệu máy đọc nằm trong `data/canh_gioi_tien_hiep.json`.

**Quy tắc random hóa NPC/thế lực:** roll cấp theo phân phối hình tháp trên 14 cấp chuẩn — số đông ở cấp thấp, càng lên cao càng hiếm. Việc random này không áp dụng cho Player mới, vốn luôn bắt đầu ở cấp 1, Di Mệnh Cảnh.

---

## 4. PHÂN LOẠI THẾ LỰC (FACTION TYPES)

### 4.1 Tông Môn (Sects) — hàng trăm cái, sinh ngẫu nhiên theo template
- **Chính Đạo Tông Môn**: Kiếm Tông, Đan Tông, Phù Tông, Trận Pháp Tông, Đạo Tông, Phật Tông...
- **Ma Đạo Tông Môn**: Huyết Tông, Quỷ Tông, Tà Đan Môn...
- **Trung Lập/Kỳ Môn**: Thương hội tu sĩ, Săn Yêu Đường, Cơ Quan Môn, Luyện Khí Sư Công Hội

### 4.2 Thế Gia (Clans/Noble Houses)
- Gia tộc huyết mạch, thường kiểm soát 1 vùng lãnh thổ + quan hệ với vương triều thế tục.
- VD template: "OOO Thế Gia" — sở hữu Gia Tộc Bí Pháp, Trưởng Lão Hội, Tổ Nghiệp Linh Mạch.

### 4.3 Vương Triều (Kingdoms/Dynasties)
- Thế lực thế tục (phi tu sĩ hoặc bán tu sĩ), quản lý dân chúng, thuế, quân đội.
- Quan hệ với tông môn/thế gia: bảo trợ, đối đầu, hoặc bị khống chế ngầm.

### 4.4 Tán Tu (Rogue Cultivators)
- Cá nhân/nhóm nhỏ không thuộc môn phái, sinh sống bằng săn yêu, buôn bán, làm nhiệm vụ thuê.
- Nguồn nhân vật phụ/random encounter chính trong thế giới mở.

### 4.5 Thế Lực Hắc Đạo (Cướp, Sát Thủ, Buôn Lậu)
- Sơn Trại (giặc cướp núi), Sát Thủ Tổ Chức, Hắc Thị (chợ đen linh dược/pháp bảo trộm cắp), Nô Lệ Thương Đoàn.

### 4.6 Thế Lực Ẩn/Truyền Kỳ
- Cổ tông diệt vong còn di tích, giáo phái tà thần, tổ chức bí mật xuyên vương triều.

---

## 5. HỆ THỐNG STAT NGẪU NHIÊN (dành cho procedural generation)

### 5.1 Stat cấp Thế Lực (Faction Stats)
```
Faction {
  Loại: [Tông Môn | Thế Gia | Vương Triều | Tán Tu Liên Minh | Hắc Đạo]
  Chính/Tà/Trung Lập: roll trọng số theo loại
  Quy Mô: 1-10 (số đệ tử/thành viên, log-scale)
  Cảnh Giới Cao Nhất: roll theo bảng phân phối (mục 3)
  Tài Nguyên: {Linh Thạch, Linh Mạch, Đan Dược, Pháp Bảo} - mỗi loại 1-100
  Danh Vọng: -100 (khét tiếng) → +100 (được kính trọng)
  Quan Hệ Ngoại Giao: map tới các thế lực lân cận {Đồng Minh|Trung Lập|Thù Địch}
  Đặc Sắc (Trait, roll 1-3): [Thiện chiến, Giàu tài nguyên, Bí pháp thất truyền,
                              Nội bộ lục đục, Đang suy tàn, Đang trỗi dậy,
                              Có Thánh Địa/Bí Cảnh riêng, Nợ máu với thế lực khác...]
}
```

### 5.2 Stat cấp Cá Nhân (NPC/Nhân vật)
```
Character {
  Chủng Tộc: roll theo trọng số vùng
  Cảnh Giới: roll lệch (xem mục 3)
  Căn Cốt (Aptitude): 1-100 (ảnh hưởng tốc độ đột phá)
  Thuộc Tính Linh Căn: [Kim, Mộc, Thủy, Hỏa, Thổ, Song/Tam Linh Căn (hiếm), Dị Linh Căn (cực hiếm)]
  Tính Cách: roll 2 trait [Chính trực, Tàn nhẫn, Tham lam, Trung thành, Cơ trí, Lỗ mãng, Lãnh đạm, Nhiệt huyết...]
  Xuất Thân: [Tông Môn | Thế Gia | Tán Tu | Hắc Đạo | Vô Danh]
  Trang Bị: roll pháp bảo/công pháp theo cảnh giới (không vượt cấp)
  Mục Tiêu Ẩn: [Báo thù, Tìm cơ duyên, Bảo vệ môn phái, Thống nhất vùng, Trốn tránh quá khứ...]
}
```

### 5.3 Gợi ý bảng trọng số theo vùng (weight table)
- Linh Vực: Tông Môn 60%, Thế Gia 20%, Tán Tu 15%, Hắc Đạo 5%
- Biên Thành: Tán Tu 50%, Hắc Đạo 30%, Thương hội 15%, Tông môn nhỏ 5%
- Cấm Địa: Ma Tộc/Cổ Tộc 40%, Thế lực ẩn 30%, Tán tu liều mạng 30%

---

## 6. KINH TẾ & TÀI NGUYÊN

- **Tiền tệ:** Linh Thạch (Hạ/Trung/Thượng/Cực Phẩm) — tỷ giá 1 Thượng = 100 Trung = 10.000 Hạ (tùy chỉnh).
- **Tài nguyên chiến lược:** Linh Mạch (mỏ linh khí cố định vị trí — mục tiêu tranh đoạt giữa các thế lực), Đan Dược, Yêu Đan (lõi yêu thú), Cổ Tịch (sách công pháp thất truyền).
- **Nhiệm vụ sinh thái (world events ngẫu nhiên):**
  - Tông môn khai mở bí cảnh (giới hạn thời gian, thu hút tán tu khắp nơi)
  - Chiến tranh lãnh thổ giữa 2 thế gia
  - Yêu thú bạo động tràn ra khỏi Hoang Dã
  - Đại Kiếp/thiên tai định kỳ reset một phần bản đồ

---

## 7. GỢI Ý TRIỂN KHAI GAME TEXT RPG

1. Sinh bản đồ gồm N vùng (region), mỗi vùng gắn loại + trọng số chủng tộc/thế lực.
2. Mỗi vùng random 3-8 thế lực theo bảng mục 5.1, liên kết quan hệ ngoại giao lẫn nhau.
3. Sinh NPC nổi bật (Tông Chủ, Trưởng Lão, Thiên Kiêu đệ tử...) theo mục 5.2, gắn vào thế lực tương ứng.
4. Dùng "Đặc Sắc" (trait) của thế lực để tự sinh quest hook (VD: "Nội bộ lục đục" → quest điều tra phản đồ).
5. Người chơi bắt đầu là Tán Tu hoặc đệ tử ngoại môn, có thể gia nhập/phản bội/tiêu diệt bất kỳ thế lực nào — thế giới cập nhật lại quan hệ & bản đồ quyền lực sau mỗi sự kiện lớn.

---

*File này là khung sườn — có thể mở rộng thêm bảng công pháp, pháp bảo, yêu thú theo nhu cầu cụ thể của game.*
