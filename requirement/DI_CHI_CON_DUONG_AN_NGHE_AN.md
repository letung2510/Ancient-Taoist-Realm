# Dị Thể · CON ĐƯỜNG ẨN · NGHỀ ẨN TÀ TỊCH — THIẾT KẾ + KHUNG TRIỂN KHAI HỢP LÝ
> Giải quyết đúng vấn đề: đây là những mô-típ tiên hiệp RẤT mạnh (dễ phá cân bằng nếu làm ẩu) nên
> cần 1 KHUNG GATING rõ ràng trước khi viết nội dung cụ thể — không phải thiếu ý tưởng mà thiếu
> NGUYÊN TẮC để ý tưởng không tràn lan/phá vỡ hệ thống đã có.

---

## 0. NGUYÊN TẮC GATING CHUNG (áp dụng cho cả 3 hệ dưới đây)

```
1. KHÔNG BAO GIỜ roll ngẫu nhiên lúc tạo nhân vật — cả 3 hệ đều chỉ MỞ KHÓA qua hành động/sự kiện
   cụ thể trong lúc chơi, không phải "may mắn từ đầu". Đây là điểm khác biệt CỐT LÕI so với Mệnh Số/
   Linh Căn (vốn roll random lúc tạo nhân vật) — Dị Thể/Con Đường Ẩn/Nghề Ẩn phải được "CHỨNG MINH
   XỨNG ĐÁNG" qua gameplay, không phải nhận không.
2. MỌI sức mạnh đều đi kèm cái giá RÕ RÀNG NGANG BẰNG (đúng triết lý xuyên suốt dự án) — không có
   ngoại lệ "OP miễn phí" nào trong 3 hệ này.
3. Tái sử dụng field/cơ chế ĐÃ CÓ làm điều kiện mở khóa (Corruption_Rating, daoTam, factionReputation,
   Luân Hồi Thất Bại, Tà Thần "Lắng Nghe"...) — KHÔNG tạo hệ điều kiện hoàn toàn mới cho riêng 3 hệ
   này, tránh phình to độ phức tạp.
4. Độ hiếm giảm dần nghiêm ngặt: Con Đường Ẩn (hiếm) > Nghề Ẩn Tà Tịch (hiếm hơn) > Dị Thể (hiếm nhất
   trong 3, ngang hoặc hơn Mệnh Số Tiên Phẩm).
```

---

## 1. Dị Thể (SPECIAL PHYSIQUE) — KHÁC LINH CĂN, LÀ BẢN CHẤT CƠ THỂ

Linh Căn = channel được hệ nguyên tố nào. Dị Thể = **bản thân cơ thể** đặc biệt ra sao — 2 trục hoàn
toàn khác nhau, 1 nhân vật có Linh Căn phổ thông vẫn có thể sở hữu Dị Thể hiếm.

### 1.1. Bảng Dị Thể đề xuất (mỗi cái đều 2 lưỡi, không có cái nào miễn phí)
| Dị Thể | Lợi ích | Cái giá |
|---|---|---|
| **Thánh Thể** | Kháng 30% tốc độ nhiễm Corruption | Tà Thần "dòm ngó" (mục 16 Worldview) tăng gấp đôi tần suất — ánh sáng quá chói thu hút bóng tối |
| **Hỗn Độn Thể** | Dùng MỌI hệ Ngũ Hành không bị phạt Tương Khắc nội bộ (mục 3B Công Pháp) | `daoTam` tích lũy chậm hơn 50% (hỗn mang khó kiên định 1 hướng) |
| **Vạn Độc Thể** | Miễn nhiễm poison/debuff độc, +20% sát thương lên Quái Dị Biến | SAN hồi phục khi Nghỉ Ngơi giảm 30% (cơ thể chai lì cũng làm tâm trí chai lì) |
| **Cửu U Thể** | Tự động thấy Ambient Dread mức Cao mà KHÔNG mất SAN (đã quen bóng tối) | -20% hiệu quả Công Pháp hệ Hỏa/Quang lên chính mình |
| **Bất Tử Thể** | 1 lần/Cấp: sống sót đòn chí mạng lẽ ra gây tử vong | Mỗi lần dùng, +1 Biến Dị Thân Thể VĨNH VIỄN (bất tử trả giá bằng nhân tính) |
| **Thiên Sinh Đạo Thể** | +15% match_score TRẦN với MỌI Con Đường | Cực hiếm (xem 1.2) + Tà Thần chú ý từ Cấp 1 (không chờ tới Cấp 5 như thường) |

### 1.2. Điều kiện mở khóa (KHÔNG random, theo mục 0.1)
```
Mỗi Dị Thể gắn với ĐÚNG 1 trigger cụ thể, không dùng chung công thức:
  Thánh Thể         -> hoàn thành 10 quest moral_choice theo hướng THIỆN liên tiếp không đứt quãng
  Hỗn Độn Thể        -> sở hữu đủ 5 Công Pháp khác hệ Ngũ Hành CÙNG LÚC ở mastery >= Tiểu Thành
  Vạn Độc Thể        -> sống sót qua 5 lần combat với Quái Dị Biến (NPC_MONSTER_SYSTEM.md mục 4.3)
                        mà KHÔNG dùng Diên Thọ Đan/hồi phục ngoài
  Cửu U Thể          -> đạt bậc Cộng Minh (FATE_RELATIONSHIP_COMPLETE.md) với 1 Mệnh hệ "vo_he"/"di_he"
  Bất Tử Thể         -> trải qua Luân Hồi Thất Bại (WORLDVIEW_ATMOSPHERE.md mục 14) ĐÚNG 1 lần — đây
                        là phần thưởng an ủi cho rủi ro nặng nhất của cơ chế đó
  Thiên Sinh Đạo Thể -> KHÓA ĐỘC BẢN SERVER-WIDE (tái dùng cơ chế mục 4 FATE_NEW_LOGIC_ADDENDUM.md),
                        chỉ 1 người toàn server, mở qua Hidden Lore Quest chuỗi dài nhất game
```

---

## 2. CON ĐƯỜNG ẨN (HIDDEN PATH) — TIẾN HÓA/RẼ NHÁNH TỪ 10 CON ĐƯỜNG GỐC

KHÔNG phải Con Đường thứ 11 độc lập — mỗi Con Đường Ẩn là **rẽ nhánh** của 1 trong 10 Con Đường gốc,
giữ nguyên `tags`/`match_score` nền nhưng có thêm lớp riêng.

### 2.1. Ví dụ cụ thể (mẫu để mở rộng thêm sau)
| Con Đường Ẩn | Rẽ nhánh từ | Điều kiện mở khóa | Khác biệt so với gốc |
|---|---|---|---|
| **Ma Kiếm Đạo** | Kiếm Đạo | Corruption_Rating >= 70 duy trì liên tục >= 30 ngày game TRONG KHI đang đi Kiếm Đạo | Vượt Dị Tượng đổi từ "Kiếm Ảnh" thành đối đầu chính cái bóng tà niệm của mình — qua được thì Kiếm Đạo "tà hóa" vĩnh viễn, sát thương cao hơn gốc nhưng Trả Giá giờ trừ CẢ Khí Huyết lẫn Thanh Tỉnh |
| **Vô Danh Đạo** | Bất kỳ (không rẽ nhánh, ĐỘC LẬP) | CHỈ mở nếu `origin.background == "vo_danh"` (mục 3.4.4 HE_THONG_HOP_NHAT) VÀ chưa từng gia nhập Faction nào tới Cấp 8 | Không có `tags` cố định — match_score LUÔN bằng đúng 0 (không sinh không khắc với path nào), NHƯNG mọi hiệu ứng Cấm Kỵ Tri Thức đến sớm hơn 50% (kẻ vô danh dễ chạm chân lý hơn) |
| **Tà Thần Khế Đạo** | Bất kỳ | Chọn "Lắng Nghe" (mục 16 Worldview) đủ 5 lần với CÙNG 1 Tà Thần | Con Đường gốc vẫn giữ, nhưng giờ có thêm 1 lớp "Khế Ước" — nhận trực tiếp 1 Cấm Thuật độc quyền của vị Tà Thần đó, đổi lại `daoTam` không thể vượt quá 50 (đã "bán" một phần ý chí) |

### 2.2. Nguyên tắc mở rộng thêm Con Đường Ẩn sau này
```
Mỗi Con Đường Ẩn PHẢI trả lời được 3 câu hỏi trước khi thêm vào bảng:
  1. Rẽ nhánh từ Con Đường gốc nào (hoặc xác nhận rõ là ngoại lệ độc lập như Vô Danh Đạo)?
  2. Điều kiện mở khóa dùng field/cơ chế ĐÃ CÓ nào (không tạo field mới)?
  3. Đánh đổi cụ thể là gì — không có Con Đường Ẩn nào được phép THUẦN LỢI so với gốc?
```

---

## 3. NGHỀ ẨN TỪ CỔ THẦN TÀ TỊCH (nối trực tiếp Nghề Ẩn + Tà Thần đã có)

Khác Nghề Nghiệp thường (Luyện Đan Sư/Luyện Khí Sư/Trận Pháp Sư ở `PHAC_THAO_TU_VI_CON_DUONG_V3.md`
mục H — những nghề đó học được qua thầy dạy bình thường) — Nghề Ẩn Tà Tịch CHỈ đến từ 1 nguồn duy
nhất: **Tà Tịch** (Cổ Thư Tà Thần) — vật phẩm cực hiếm, đọc là có giá ngay (không đọc thử vô hại).

### 3.1. Vật phẩm "Tà Tịch" — nguồn gốc và cái giá khi ĐỌC (chưa cần học nghề đã có giá)
```
Tà Tịch {
  linkedTaThanId: 1 trong 4 vị đã có (NPC_MONSTER_SYSTEM.md mục 1B.2)
  onRead: {
    corruptionGain: 15-25 (tùy vị Tà Thần),
    sanLoss: 10-20,
    unlockNgheAnId: string  // chỉ mở khóa NGHỀ, chưa tự động thành thạo — vẫn cần luyện tập như
                             // nghề thường sau khi đã "biết tới" nó
  }
}
```
Nguồn nhận Tà Tịch: RẤT hạn chế — chỉ rơi ra từ Bí Cảnh liên quan Tà Thần (mục 6
`WORLD_INTERCONNECTION_SYSTEM.md`), hoặc phần thưởng chuỗi quest "Tổ Chức Ngầm Thờ Tà Thần" (đã
phác thảo trước, hướng "Thâm Nhập Thật Sự").

### 3.2. Bảng Nghề Ẩn theo từng Tà Thần (mỗi vị 1 nghề, tránh dàn trải quá nhiều)
| Tà Thần | Nghề Ẩn | Khả năng đặc trưng | Giới hạn/cái giá vận hành |
|---|---|---|---|
| Vô Diện Cuồng Vương (Điên Loạn) | **Cuồng Ngôn Giả** | Có thể gây SAN Drain trực tiếp lên NPC/địch qua HỘI THOẠI (không cần combat) | Mỗi lần dùng, bản thân cũng chịu SAN Drain nhẹ (nói lời điên loạn cũng tự làm tâm trí mình lung lay) |
| Thực Cảnh Đại Đế (Hủy Diệt) | **Thực Cảnh Sư** | Có thể "ăn" 1 phần Corruption của node Dị Biến để tạm thời hạ cấp độ ô nhiễm (MAP_SYSTEM.md 6.6) | Corruption đã "ăn" CHUYỂN THẲNG vào Corruption_Rating bản thân — dọn dẹp thế giới bằng cách tự nhiễm độc |
| Huyễn Sắc Cổ Thần (Dục Vọng) | **Huyễn Ảnh Sư** | Tạo phân thân ảo đánh lừa địch/NPC (combat utility mạnh) | NPC Chính Đạo có % nhận ra "sự giả dối" trong người dùng nghề này, factionReputation khó tăng hơn vĩnh viễn |
| Vong Danh Chi Chủ (Lãng Quên) | **Vong Ngữ Sư** | Giao tiếp được với NPC/vật đã "chết"/Mộ Phần Tiền Kiếp (K.1 đã phác thảo) — mở lore ẩn không ai khác tiếp cận được | Mỗi lần dùng có % nhỏ QUÊN 1 thông tin/quan hệ NPC ngẫu nhiên của chính mình (đúng bản chất Lãng Quên) |

### 3.3. Vì sao GIỚI HẠN đúng 4 nghề (1 nghề/Tà Thần), không nhiều hơn
```
Tránh dàn trải nội dung mỏng — 4 nghề CHẤT LƯỢNG CAO, mỗi nghề gắn chặt bản sắc 1 vị Tà Thần, dễ
nhớ/dễ tạo lore xoay quanh, hơn là 10-15 nghề na ná nhau khó phân biệt. Nếu sau này cần mở rộng,
ưu tiên làm SÂU thêm (nhánh trong 4 nghề này) trước khi thêm nghề thứ 5.
```

---

## 4. GỢI Ý KHÁC ĐỂ TĂNG TRẢI NGHIỆM (ngắn gọn, ngoài 3 hệ chính đã yêu cầu)

| Gợi ý | Lý do |
|---|---|
| UI cảnh báo TRƯỚC khi hành động sẽ kích hoạt điều kiện mở khóa Dị Thể/Con Đường Ẩn/Nghề Ẩn (không phải spoil trước, chỉ gợi ý mơ hồ kiểu "ngươi cảm thấy có gì đó đang thay đổi trong mình") | Tránh người chơi vô tình unlock rồi ngỡ ngàng không hiểu vì sao — vẫn giữ bí ẩn nhưng không đột ngột phi lý |
| Bách Khoa Chí Dị (đã có ở nhóm D) nên có mục riêng "Truyền Thuyết" liệt kê Dị Thể/Nghề Ẩn đã xác nhận tồn tại trong lore dù CHƯA ai đạt được — tạo mục tiêu dài hạn rõ ràng cho người chơi | Biến 3 hệ này thành động lực chơi tiếp, không chỉ bí mật ngẫu nhiên gặp được |
| Giới hạn: 1 nhân vật KHÔNG thể sở hữu quá 1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn Tà Tịch CÙNG LÚC (dù đủ điều kiện mở nhiều hơn) — buộc chọn lựa, tránh 1 nhân vật cộng dồn quá nhiều hệ hiếm gây phá vỡ cân bằng | Đúng tinh thần "đánh đổi", không phải "sưu tập hết mọi thứ hiếm" |

---

## 5. VIỆC CẦN LÀM TIẾP
1. Xác nhận giới hạn "1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn/nhân vật" ở mục 4 có áp dụng hay để tự
   do — đây là quyết định cân bằng quan trọng cần chốt trước khi code.
2. Viết thêm 2-4 Dị Thể nữa nếu 6 cái ở mục 1.1 chưa đủ đa dạng cho lâu dài (nhưng KHÔNG vội — giữ
   độ hiếm/chất lượng trước số lượng, đúng nguyên tắc mục 3.3 áp dụng chung).
3. Cân bằng số liệu cụ thể (% Corruption gain khi đọc Tà Tịch, ngưỡng ngày cho Ma Kiếm Đạo...) qua
   playtest thật, các số hiện tại là đề xuất định hướng.
---

## PHỤ LỤC CANONICAL 2026-09-16 — ĐỔI TÊN DỊ THỂ VÀ TÁCH HAI KHÁI NIỆM

Đây là bản hiệu chỉnh thuật ngữ áp dụng cho code mới và UI mới; các đoạn lịch sử giữ nguyên để truy vết.

1. **Dị Thể** là tên canonical thay cho cụm cũ “Dị Chí” khi nói về nhánh thức tỉnh/thể chất đặc biệt. Không dùng “Dị Chí” cho `specialPhysique`, trạng thái thức tỉnh hoặc tab tương ứng.
2. **Con Đường Ẩn** là một tuyến/định hướng vận mệnh độc lập (`pathId`/path state). Nó không chiếm slot nghề, không phải nghề, và không được đưa vào `professionState`.
3. **Nghề Ẩn** là một nghề phụ (`secondaryId`) mở bằng Cổ Tịch Tà Thần và chiếm đúng một slot nghề phụ. Nghề chính được chọn trước; sau lựa chọn đó, mọi nghề thường khác bị khóa vĩnh viễn. Chỉ Nghề Ẩn đã mở mới có thể lấp slot phụ.
4. Thanh trạng thái chỉ hiển thị Nghề chính trước khi Nghề Ẩn được mở; sau khi mở và cố định nghề phụ thì hiển thị thêm Nghề Ẩn. Không hiển thị Con Đường Ẩn trong danh sách nghề.
5. Các field legacy vẫn được migrate đọc được, nhưng resolver canonical phải ưu tiên `pathState` cho Con Đường Ẩn, `specialPhysiqueState` cho Dị Thể và `professionState.secondaryId` cho Nghề Ẩn.
