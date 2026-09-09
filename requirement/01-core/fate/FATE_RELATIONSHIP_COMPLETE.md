# FATE RELATIONSHIP — HOÀN CHỈNH (đọc kèm `FATE_SYSTEM_SPEC.md` mục 7 + `FATE_SYSTEM_COMPLETE.md`)
> Spec gốc mục 7 mới liệt kê KHUNG (bậc 0-4, khái niệm Dưỡng Mệnh/Cộng Minh) và đánh dấu phần lớn
> là **Chưa có** — file này thiết kế CHI TIẾT đủ để code, đối chiếu với khả năng THẬT của
> `fate_relationships.js` hiện có (chỉ có quan hệ Mệnh-Mệnh, CHƯA có quan hệ Nhân Vật-Mệnh).

---

## 1. PHÂN TẦNG QUAN HỆ ĐÃ CÓ vs CHƯA CÓ

| Loại quan hệ | Trạng thái | Nguồn dữ liệu |
|---|---|---|
| Mệnh ↔ Mệnh (Tương Sinh/Tương Khắc giữa 2 Mệnh đang active) | **Đã có** | `fate_relationships.js` → `pairwise_relationships[]` (13.976 cặp) |
| Mệnh ↔ Mệnh (Combo 2-3 Mệnh) | **Đã có** | `fate_relationships.js` → `combo_sets[]` (150 bộ) |
| Mệnh + Mệnh → Mệnh mới (Dung Hợp) | **Đã có** | `fate_relationships.js` → `fusion_recipes[]` (78 công thức) |
| **Nhân Vật ↔ Mệnh (bậc 0-4)** | **CHƯA CÓ — thiết kế đầy đủ ở mục 2** | Không có trong bất kỳ file nào đã cung cấp |
| **Dưỡng Mệnh (NURTURE_FATE)** | **CHƯA CÓ — thiết kế ở mục 3** | — |
| **Cộng Minh (RESONATE)** | **CHƯA CÓ — thiết kế ở mục 4** | — |
| Nghịch Mệnh/Trấn Mệnh/Thiên Cơ/Mệnh Đổi (Phase 3) | **CHƯA CÓ — phác thảo sơ bộ ở mục 6, CẦN XÁC NHẬN trước khi code** | — |

> Lưu ý bắt buộc trước khi code bất kỳ mục nào dưới đây: xử lý xong lệch schema `grade`↔`tier` và
> `sign`↔`type` đã nêu ở `FATE_SYSTEM_COMPLETE.md` mục 3 — mọi công thức dưới đây giả định đã có
> sẵn 2 hàm map đó.

---

## 2. QUAN HỆ NHÂN VẬT ↔ MỆNH (BẬC 0-4) — THIẾT KẾ ĐẦY ĐỦ

### 2.1. Cấu trúc dữ liệu (gắn vào INSTANCE Mệnh nhân vật sở hữu, không phải `FateDefinition` catalog)
```js
// state.player.fates[i] hoặc state.fateInventory[i] — mỗi instance Mệnh nhân vật đang giữ
FateInstance {
  fateId,                    // trỏ tới FateDefinition trong fate_data.js
  isActive: boolean,         // đang ở ô active hay trong vault
  relationshipStage: 0-4,    // Sơ Ngộ..Nhân Mệnh Hợp Nhất, theo đúng bảng spec mục 7.1
  relationshipPoints: number,// tích lũy qua HÀNH VI (không phải EXP thuần túy — xem mục 2.2)
  firstAcquiredAt: timestamp,
  lastActiveStreakDays: number  // số ngày liên tục đang active KHÔNG bị tháo ra — dùng cho điều
                                  // kiện lên bậc, xem mục 2.2
}
```

### 2.2. Điều kiện lên bậc (CỤ THỂ HÓA "hành vi và lựa chọn có liên quan" mà spec chỉ nói chung chung)

| Bậc | Tên | Điều kiện lên bậc CỤ THỂ |
|---|---|---|
| 0 → 1 | Sơ Ngộ → Đồng Hành | Mệnh đang active và ĐÃ TỒN TẠI qua ít nhất 1 lần combat với Quái Elite/Boss trở lên, HOẶC đã active liên tục >= 7 ngày game (`lastActiveStreakDays >= 7`) — "đã dùng qua thử thách" theo đúng nghĩa đen |
| 1 → 2 | Đồng Hành → Tương Ứng | Người chơi thực hiện >= 3 lựa chọn quest/hội thoại CÙNG HƯỚNG với `alignment` của Mệnh (Mệnh Cát Cách tính lựa chọn `moral_choice` nghiêng thiện; Mệnh Hung Cách tính lựa chọn nghiêng ác/lợi ích) trong lúc Mệnh đang active — tái dùng `questType: "moral_choice"` đã thiết kế ở hệ thống nhiệm vụ |
| 2 → 3 | Tương Ứng → Cộng Minh | BẮT BUỘC qua action `RESONATE` thành công (mục 4) — không tự động theo thời gian, cần người chơi CHỦ ĐỘNG kích hoạt |
| 3 → 4 | Cộng Minh → Nhân Mệnh Hợp Nhất | Mệnh đang ở bậc Cộng Minh + nhân vật Đột Phá thành công lên 1 Cấp MỚI trong khi Mệnh này active xuyên suốt toàn bộ nghi thức Đột Phá (không tháo ra giữa chừng) — gắn thẳng vào `BREAKTHROUGH_RITUAL_DETAIL.md` đã có, không tạo trigger tách biệt |

### 2.3. Hiệu ứng mỗi bậc (không đổi số liệu gốc của Mệnh, chỉ CỘNG THÊM theo bậc quan hệ)
```
Bậc 0 (Sơ Ngộ):              hiệu ứng cơ bản, đúng 100% giá trị gốc trong fate_data.js
Bậc 1 (Đồng Hành):           +5% toàn bộ modifiers (mục 4.3 FATE_SYSTEM_COMPLETE.md)
Bậc 2 (Tương Ứng):           +10% modifiers, mở khóa xem trước `potential` (combo khả dụng)
Bậc 3 (Cộng Minh):            +20% modifiers, mở 1 hiệu ứng ẩn ĐỘC QUYỀN chỉ có ở bậc này (xem 4.3)
Bậc 4 (Nhân Mệnh Hợp Nhất):  +35% modifiers, Mệnh này KHÔNG THỂ bị tháo/hi sinh/dung hợp nữa (đã
                              "hợp nhất" vĩnh viễn với nhân vật — đánh đổi: mất tính linh hoạt đổi
                              build, nhưng đây là lựa chọn CHỦ ĐỘNG của người chơi khi đạt tới đây)
```

### 2.4. Suy giảm bậc quan hệ khi VAULT LÂU (ĐỀ XUẤT — CẦN XÁC NHẬN, spec gốc không nêu rõ)
```
Nếu 1 FateInstance đã đạt bậc >= 1 nhưng bị tháo vào Mệnh Kho và ĐỂ YÊN quá 30 ngày game liên tục:
  relationshipStage -= 1 (tối thiểu về 0, không âm)
```
> Lý do đề xuất: nếu không có cơ chế suy giảm, người chơi có thể "farm" hết bậc trên 1 Mệnh rồi vault
> vĩnh viễn không dùng nhưng vẫn giữ nguyên bậc cao — không hợp lý về mặt gameplay. Tuy nhiên spec
> gốc KHÔNG đề cập cơ chế này, nên đánh dấu rõ: cần XÁC NHẬN trước khi code, không tự ý thêm nếu
> chưa duyệt (tôn trọng nguyên tắc không tự ý mở rộng ngoài spec đã thống nhất).

---

## 3. DƯỠNG MỆNH (`NURTURE_FATE`) — THIẾT KẾ ĐẦY ĐỦ

```
Điều kiện gọi action: fate.isActive == true (Mệnh trong Vault KHÔNG dưỡng được — đúng nguyên tắc #1
                       "Mệnh Kho không có hiệu lực" của spec, áp dụng cả cho việc bồi dưỡng)

Chi phí mỗi lần Dưỡng Mệnh: Linh Thạch (tăng dần theo relationshipStage hiện tại — dưỡng Mệnh bậc
cao tốn hơn bậc thấp, tránh rush bậc 4 quá nhanh) + có cooldown (VD 1 lần/ngày game/Mệnh)

Hiệu quả: += relationshipPoints (số lượng cụ thể do cân bằng quyết định sau), CÓ diminishing return
nếu dùng liên tục nhiều ngày mà không xen kẽ hoạt động thật (combat/quest) — Dưỡng Mệnh nên là
BỔ SUNG cho hành vi thật (mục 2.2), KHÔNG PHẢI cách duy nhất/nhanh nhất để lên bậc, tránh biến toàn
bộ hệ thống quan hệ thành 1 vòng lặp bấm nút vô nghĩa.
```

---

## 4. CỘNG MINH (`RESONATE`) — THIẾT KẾ ĐẦY ĐỦ

```
canResonate(character, fateInstance):
  relationshipStage == 2 (Tương Ứng)          // chỉ gọi được ở ĐÚNG bậc này, không nhảy cóc
  AND match_score(fateInstance, character.currentPath) >= 8   // "Tương Sinh" trở lên, spec mục 5.2
  AND character.SAN >= chi phí cố định (đề xuất 10, cần cân bằng)
  AND fateInstance.isActive == true

onResonateSuccess:
  relationshipStage = 3
  character.SAN -= chi phí
  unlock 1 hiệu ứng ẩn ĐỘC QUYỀN của riêng Mệnh đó ở bậc Cộng Minh (dữ liệu hiệu ứng ẩn này CẦN
  soạn riêng cho từng Mệnh — không phải mọi 10.000 Mệnh đều cần ngay, ưu tiên soạn trước cho nhóm
  Địa Phẩm trở lên vì tần suất người chơi thật sự đạt bậc Cộng Minh với Mệnh phẩm thấp là rất hiếm)

onResonateFail (không đủ điều kiện):
  Hiện rõ blocker đang thiếu (đúng nguyên tắc #5 của spec: "Hành động phải giải thích được kết quả")
  KHÔNG trừ SAN nếu chưa đủ điều kiện để thử — chỉ trừ SAN khi đã đủ điều kiện và THỰC SỰ thực hiện
  nghi thức Cộng Minh (không phạt người chơi vì bấm nhầm lúc chưa đủ điều kiện)
```

---

## 5. COMBO NÂNG CAO GẮN VỚI BẬC QUAN HỆ (mở rộng `combo_sets` đã có)

Spec mục 7.2 ghi: "combo ba: yêu cầu phẩm cấp, match tier HOẶC QUAN HỆ TỐI THIỂU". Dữ liệu
`combo_sets` hiện tại (150 bộ) CHƯA có field nào biểu diễn điều kiện quan hệ tối thiểu. Đề xuất bổ
sung field mới vào combo (không phá field cũ):
```js
ComboSet {
  ...(giữ nguyên toàn bộ field cũ: combo_id, name, members, required_count, avg_tier, effect,
      isNghich, bonusPct, fortuneBonus, madnessDelta)...
  minRelationshipStageRequired: 0-4 | null   // null = không yêu cầu gì thêm ngoài sở hữu đủ member,
                                               // giữ hành vi CŨ cho 150 combo hiện có (không phá vỡ)
}
```
- 150 combo hiện có: mặc định `minRelationshipStageRequired = null` (không đổi hành vi cũ).
- Combo MỚI thêm sau này (nếu muốn tạo chiều sâu) có thể đặt yêu cầu bậc quan hệ cụ thể trên TẤT CẢ
  member — đây là hướng mở rộng, không bắt buộc làm ngay.

---

## 6. PHÁC THẢO SƠ BỘ PHASE 3 (Nghịch Mệnh/Trấn Mệnh/Thiên Cơ/Mệnh Đổi) — CẦN XÁC NHẬN TRƯỚC KHI CODE

Spec chỉ liệt kê tên 4 action này ở mục 8, không có chi tiết. Phác thảo Ý TƯỞNG (KHÔNG PHẢI spec
chính thức, chỉ để tham khảo khi tới Phase 3):

| Action | Ý tưởng sơ bộ |
|---|---|
| `DEFY_FATE` (Nghịch Mệnh) | Chủ động HÀNH ĐỘNG NGƯỢC với `alignment` của 1 Mệnh Hung Cách đang active nhiều lần liên tục → có thể "phá" bản chất Hung của nó, đổi 1 phần hiệu ứng xấu thành trung tính, ĐỔI LẠI mất hẳn phần hiệu ứng tốt đi kèm (nếu có) — giá phải trả lớn đúng như spec mô tả |
| `SUPPRESS_FATE` (Trấn Mệnh) | Dùng Công Pháp loại `tran_phap` + tiêu hao SAN để TẠM THỜI khóa phần `effects` điều kiện nguy hiểm của 1 Mệnh Hung (không xóa vĩnh viễn, chỉ khóa trong X thời gian, cần lặp lại) |
| `HEAVENLY_OMEN` (Thiên Cơ) | Tiêu hao tài nguyên + cooldown dài để "nhìn trước" — hé lộ trước kết quả 1 lần Đột Phá/Cộng Minh SẮP thực hiện (tỷ lệ thành công thật, không phải đoán mò) trước khi thực sự bấm nút, giúp người chơi ra quyết định sáng suốt hơn |
| `FATE_TRANSFORM` (Mệnh Đổi) | Biến đổi 1 Mệnh THEO QUAN HỆ nó đang có (VD 1 Mệnh đang ở bậc Nhân Mệnh Hợp Nhất + đủ vật liệu hiếm) → chuyển hẳn sang 1 biến thể khác cùng gốc nhưng tính chất khác (gần giống `evolutionPaths` đã thiết kế ở hệ thống Công Pháp — tái dùng ý tưởng, không tạo cơ chế hoàn toàn mới) |

---

## 7. VIỆC CẦN LÀM TIẾP
1. Xác nhận cơ chế suy giảm bậc khi vault lâu (mục 2.4) — CÓ áp dụng hay KHÔNG, trước khi code.
2. Cân bằng số liệu cụ thể: chi phí Linh Thạch/SAN cho Dưỡng Mệnh và Cộng Minh (mục 3-4 mới chỉ có
   khung, chưa có số thật).
3. Soạn hiệu ứng ẩn độc quyền bậc Cộng Minh (mục 4) cho ưu tiên nhóm Địa Phẩm trở lên trước.
4. Duyệt phác thảo Phase 3 (mục 6) trước khi bắt đầu code — hiện chỉ là ý tưởng tham khảo, CHƯA phải
   spec chính thức như phần còn lại của tài liệu này.
