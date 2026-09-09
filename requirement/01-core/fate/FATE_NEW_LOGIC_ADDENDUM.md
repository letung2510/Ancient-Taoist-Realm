# MỆNH SỐ — 4 LOGIC MỚI BỔ SUNG (đọc kèm `FATE_SYSTEM_COMPLETE.md` + `FATE_RELATIONSHIP_COMPLETE.md`)
> Phát sinh trong lúc chạy pass sinh dữ liệu thật (tags/element/resonance) — đây là các lỗ hổng
> logic lộ ra khi thao tác trên data thật 10.000 mệnh, không có trong bản spec gốc.

---

## 1. XỬ LÝ MỆNH TRÙNG LẶP (DUPLICATE FATE)

**Phát hiện:** phân bố grade thật là Phàm 8000 (80%)/Linh 1500/Hoàng 250/Huyền 120/Địa 70/Thiên
50/Thánh 9/**Tiên chỉ 1 DUY NHẤT**. Với Phàm/Linh, xác suất roll trùng CÙNG 1 `id` nhiều lần trong
đời chơi là chắc chắn xảy ra (80% pool chỉ có ~8000 lựa chọn cho hàng chục nghìn lượt roll của toàn
server) — nhưng spec/data hiện KHÔNG có quy tắc nào xử lý khi roll trúng 1 `id` mà nhân vật ĐÃ sở
hữu sẵn.

```
onFateRolled(character, fateId):
  existingInstance = character.fates.find(f => f.fateId === fateId)
  if (!existingInstance):
      tạo FateInstance mới bình thường (như đã thiết kế)
  else:
      // ĐÃ sở hữu Mệnh này rồi — không tạo instance thứ 2 (tránh 2 bản y hệt cùng active gây
      // double-dip hiệu ứng phi lý)
      grade = existingInstance's grade
      if grade <= "hoang" (Phàm/Linh/Hoàng — phổ thông):
          convert thành "Tinh Hoa Dư" (Excess Essence) — 1 loại tài nguyên phụ, dùng làm nguyên
          liệu Dưỡng Mệnh (mục 3 FATE_RELATIONSHIP_COMPLETE.md) hoặc Dung Hợp ở Hư Thiên Đỉnh —
          KHÔNG lãng phí hoàn toàn, nhưng cũng không tạo instance trùng vô nghĩa
      if grade >= "huyen" (Huyền trở lên — hiếm):
          KHÔNG tự động convert — hiện popup cho người chơi CHỌN: giữ Tinh Hoa Dư (như trên) HOẶC
          "Tặng/Bán lại" cho NPC/thị trường (Mệnh hiếm trùng có giá trị giao dịch riêng, không nên
          âm thầm quy đổi rẻ mạt)
```
> Riêng grade `tien` (Tiên Phẩm, chỉ 1 entry toàn bộ pool): xem mục 4 — không áp dụng quy tắc trùng
> lặp thông thường vì bản chất đã là độc bản.

---

## 2. GIÁC NGỘ ẨN (FATE WHISPER) — NỐI VỚI NGỘ TÍNH + CẤM KỴ TRI THỨC

**Phát hiện:** mỗi Mệnh có `desc` mô tả 2 khái niệm trừu tượng ghép lại (VD "Thần thánh... kết hợp
với con đường..."), nhưng người chơi thường KHÔNG hiểu tại sao 1 Mệnh lại có tên/hiệu ứng như vậy —
`desc` hiện chỉ hiện dạng thô, không có lớp diễn giải sâu hơn.

```
Field mới: fate.insightRevealed: boolean (mặc định false khi mới nhận Mệnh)

revealInsight(character, fateInstance):
  điều kiện: character.ngoTinh >= 60 HOẶC fateInstance.relationshipStage >= 2 (Tương Ứng)
  khi đủ điều kiện, LẦN ĐẦU xem chi tiết Mệnh trong UI, `insightRevealed` tự chuyển true VĨNH VIỄN
  và mở thêm 1 dòng diễn giải "Giác Ngộ" (sinh từ concept1+concept2 đã parse, KHÔNG phải desc thô):
    VD "Thần Đạo": desc thô "Thần thánh... kết hợp với con đường, quy luật tối cao, tôn giáo" ->
    dòng Giác Ngộ: "Ngươi thoáng hiểu: đây không phải một con đường phàm tục, mà là quy luật vận
    hành của chính tầng trời — sở hữu nó nghĩa là mang theo 1 phần trách nhiệm không thể thoái thác."
```
- Đây là hàm SINH TỰ ĐỘNG (template hóa từ concept1/concept2), không cần soạn tay 10.000 dòng —
  nhưng nên ưu tiên soạn tay cho đúng 130 Mệnh Địa Phẩm+ (đã có concept1/concept2 parse sẵn ở
  `resonance_effects_v2.json`) vì đây là nhóm người chơi sẽ đọc kỹ nhất.
- Nối vào `Cấm Kỵ Tri Thức` đã thiết kế ở `WORLDVIEW_ATMOSPHERE.md` mục 5: nếu Mệnh có `sign: "hung"`
  hoặc concept2 thuộc nhóm u ám (tai nạn lớn/giết chóc/bí mật), `revealInsight` thành công ĐỒNG THỜI
  đánh dấu `character.forbiddenKnowledgeCount += 1` — biết sự thật về 1 Mệnh Hung cũng là 1 dạng
  tri thức cấm kỵ, không thể "quên" lại được.

---

## 3. MỆNH NGUỘI (COOLING FATE) — CHỐNG TRẠNG THÁI "ACTIVE NHƯNG LÃNG QUÊN"

**Phát hiện:** hệ thống bậc quan hệ (mục 2 `FATE_RELATIONSHIP_COMPLETE.md`) có `lastActiveStreakDays`
nhưng CHƯA có xử lý cho trường hợp Mệnh active liên tục RẤT LÂU mà KHÔNG hề lên bậc (VD do
`alignment` không khớp lối chơi của người chơi — 1 Mệnh Hung Cách nhưng người chơi toàn chọn lựa
chọn thiện lành, không bao giờ đủ điều kiện lên bậc 1→2 ở mục 2.2).

```
Field mới: fate.stagnantDays: number (số ngày active LIÊN TỤC mà relationshipStage KHÔNG đổi)

Nếu stagnantDays >= 60 (ngày game):
  gán trạng thái hiển thị "Mệnh Nguội" trên UI (icon/màu khác, KHÔNG phải debuff cơ chế, chỉ là
  CẢNH BÁO trực quan)
  Cho phép hành động MỚI: "Buông Mệnh" (Release Fate) — tháo Mệnh Nguội này ra khỏi active KHÔNG
  cần qua Mệnh Kho trung gian, trả thẳng về dạng "Tinh Hoa Dư" (như mục 1) NGAY LẬP TỨC, không mất
  phí, không phạt Danh Vọng — khuyến khích người chơi chủ động dọn build thay vì giữ Mệnh không hợp
  chỉ vì tiếc.
```
> Đây KHÔNG phải hình phạt (không tự động tháo, không giảm stat trong lúc Nguội) — chỉ là công cụ
> UI + 1 action tiện lợi giúp người chơi nhận ra và dọn dẹp build không hiệu quả, đúng tinh thần
> "Hành động phải giải thích được kết quả" (nguyên tắc #5 của spec gốc).

---

## 4. KHÓA ĐỘC BẢN CHO GRADE `tien` (SERVER-WIDE UNIQUENESS LOCK)

**Phát hiện:** toàn bộ pool 10.000 mệnh chỉ có ĐÚNG 1 entry grade `tien` ("Thần Đạo", id
`than_dao_151`, score 96) — đây không chỉ là "hiếm" như Thánh Phẩm (9 entry), mà là ĐỘC NHẤT theo
đúng nghĩa đen. Cần cơ chế khóa RÕ RÀNG, không để game xử lý nó như 1 entry hiếm bình thường (có
thể vô tình cho phép nhiều người chơi cùng roll trúng nếu không khóa).

```
onFateRolled(anyCharacter, "than_dao_151"):
  KIỂM TRA server-wide: đã có bất kỳ nhân vật NÀO (của bất kỳ người chơi nào) đang sở hữu Mệnh này
  chưa (kể cả đang ở Mệnh Kho, chưa active)?
    Nếu CHƯA: cho roll bình thường, sau đó KHÓA vĩnh viễn — loại `than_dao_151` khỏi weight table
    chung của TOÀN SERVER (không ai khác roll trúng được nữa cho tới khi chủ nhân hiện tại MẤT nó
    — qua Luân Hồi Thất Bại/PvP tước đoạt nếu game có cơ chế đó/chủ động phá hủy)
    Nếu ĐÃ CÓ chủ: loại bỏ `than_dao_151` khỏi TOÀN BỘ weight table trước khi roll cho bất kỳ ai
    khác (không hiển thị lại như 1 khả năng cho tới khi được giải phóng)
```
- Cần 1 bảng riêng `serverUniqueFateOwnership: { fateId -> characterId | null }` ở tầng server,
  KHÔNG lưu riêng theo từng nhân vật (vì bản chất là ràng buộc TOÀN SERVER, không phải per-player).
- UI khi hiển thị Mệnh này (nếu đã có chủ) cho người khác xem qua leaderboard/lore: hiện rõ "Đã có
  chủ — [Tên Nhân Vật]" thay vì ẩn hoàn toàn, tạo giá trị xã hội/mục tiêu để tranh đoạt nếu game có
  PvP.

---

## 5. VIỆC CẦN LÀM TIẾP
1. Xác nhận ngưỡng cụ thể mục 3 (60 ngày game) và mục 1 (ngưỡng grade nào tự convert vs hỏi người
   chơi) — số hiện tại là đề xuất hợp lý, chưa qua cân bằng thật.
2. Quyết định "Tinh Hoa Dư" dùng làm nguyên liệu cho ĐÚNG những hệ thống nào (Dưỡng Mệnh/Hư Thiên
   Đỉnh/cả 2?) — cần 1 tỷ lệ quy đổi cụ thể trước khi code.
3. Nếu game KHÔNG có PvP tước đoạt, mục 4 cần thêm quy tắc: chủ nhân `than_dao_151` MẤT nó trong
   trường hợp nào khác ngoài Luân Hồi Thất Bại (VD có thể KHÔNG BAO GIỜ mất nếu Luân Hồi thường giữ
   được — cần đối chiếu lại điều kiện "giữ 1 Mệnh cao nhất" đã thiết kế ở Luân Hồi để đảm bảo
   `than_dao_151` không bị kẹt vĩnh viễn với 1 người chơi đã ngừng chơi).
