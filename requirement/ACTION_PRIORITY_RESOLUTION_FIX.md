# ACTION PRIORITY RESOLUTION — FIX ACTION BAR KHÔNG THEO LOGIC ƯU TIÊN
> Đọc kèm `EXPLORATION_SEARCH_SYSTEM_REQUIREMENT.md` (đã có `pendingExploration`,
> `pendingContestedOpportunity`, quy tắc "Pending chặn phiên mới"). Bug trong ảnh: có Cơ Duyên
> (Mật Sứ đưa hàng lén lút) vừa xảy ra trong narrative, nhưng action bar KHÔNG có nút xử lý nó —
> chỉ hiện `Thám Hiểm · 3 lượt dò` như chưa có gì xảy ra, vi phạm chính quy tắc "Pending chặn phiên
> mới" đã định nghĩa.

---

## 1. CHẨN ĐOÁN: TẠI SAO CƠ DUYÊN "BIẾN MẤT" KHỎI ACTION BAR

Theo đúng `EXPLORATION_SEARCH_SYSTEM_REQUIREMENT.md` mục 6, khi có `pendingExploration`/
`pendingContestedOpportunity`, action bar PHẢI hiện: `Thu Thập Phát Hiện`, `Điều Tra Dấu Vết`,
`Nhờ NPC Dẫn Dấu`, `Bỏ Qua Phát Hiện`. Ảnh KHÔNG thấy nút nào trong 4 nút này — nghĩa là 1 trong 2:

1. **Cơ Duyên đã bị tự động "thất lạc"** (theo đúng mục 3.5: "Rời node tự động đánh dấu phát hiện
   chưa xử lý là thất lạc") — nếu player đã di chuyển/đổi node mà CHƯA xử lý Cơ Duyên, nó bị hủy âm
   thầm, KHÔNG BÁO TRƯỚC. Đây là hành vi ĐÚNG THEO SPEC nhưng UX tệ — người chơi không biết mình vừa
   bỏ lỡ gì.
2. **Action bar builder KHÔNG kiểm tra `pendingExploration`/`pendingContestedOpportunity` khi build
   danh sách nút** — đây là bug thật, cần audit hàm build action bar (nghi ngờ hàm này chỉ tra
   `nodeType`/`npcsPresent` như thiết kế cũ, CHƯA được update để tra thêm 2 field pending này).

**Việc cần làm trước tiên:** log ra giá trị `state.pendingExploration`/
`state.pendingContestedOpportunity` ngay tại đúng thời điểm chụp ảnh này — nếu 2 field đó là `null`
thì đúng nguyên nhân 1 (Cơ Duyên đã mất do rời node), nếu KHÔNG null mà bar vẫn không hiện nút thì
đúng nguyên nhân 2 (bug ở action bar builder).

---

## 2. THIẾT KẾ: ACTION PRIORITY RESOLUTION (4 TẦNG, RESOLVE THEO THỨ TỰ CỨNG)

```
Tầng 0 — BẮT BUỘC/CHẶN TẤT CẢ (Priority 0, đã có khái niệm này ở STATE_ELDRITCH_INTERVENTION cũ):
  - pendingContestedOpportunity đang mở với hạn xử lý
  - pendingExploration đang chờ (Thu Thập/Điều Tra/Nhờ NPC/Bỏ Qua)
  - combat đang diễn ra
  - STATE_ELDRITCH_INTERVENTION / STATE_FATE_BACKFIRE
  => NẾU tầng này có action -> CHỈ hiện action của tầng này (+ action luôn an toàn như "Trạng Thái"
     xem thông tin), ẨN HOÀN TOÀN Tầng 1-3. Không có ngoại lệ "hiện xen kẽ".

Tầng 1 — NGỮ CẢNH TRỰC TIẾP (chỉ xét khi Tầng 0 rỗng):
  - NPC đang hiện diện tại node/sub-location -> Nói Chuyện [Tên NPC]
  - Incident đang active tại node -> action tương ứng incident đó

Tầng 2 — CHUẨN TẠI ĐỊA ĐIỂM (luôn có sẵn nếu Tầng 0-1 rỗng):
  - Thám Hiểm (CHỈ hiện nếu pendingExploration == null — nếu còn pending, nút này phải bị ẨN hoặc
    disable kèm lý do, không hiện song song như hiện tại)
  - Tu Luyện / Tự Động Tu Luyện / Nghỉ Ngơi
  - Di chuyển (Về [Tông Môn], các hướng...)

Tầng 3 — TOÀN CỤC (luôn gộp vào "Thêm ▾", không chiếm hàng chính):
  - Hành Trang, Bản Đồ, Công Pháp, Trạng Thái, Tổ Chức, Tử Vi Mệnh Số, Nhiệm Vụ, Giúp
  - Đột Phá: CHỈ hiện sáng (không phải disabled xám) khi đủ điều kiện — nếu chưa đủ, ẨN HẲN khỏi cả
    Tầng 3 thay vì hiện dạng mờ gây khó hiểu (đối chiếu `BREAKTHROUGH_RITUAL_DETAIL.md` — nút cổng
    hiện tại mới là thứ nên hiện, không phải "Đột Phá" trực tiếp)
```

### 2.1. Áp trực tiếp vào tình huống trong ảnh
```
Đúng dữ liệu trong ảnh: có Mật Sứ (NPC) + có vẻ có Cơ Duyên giao dịch ngầm vừa xảy ra.

NẾU pendingContestedOpportunity còn tồn tại lúc chụp ảnh -> action bar ĐÚNG PHẢI LÀ:
  [Tranh Đoạt] [Nhường] [Chia Sẻ] [Trạng Thái]   <- CHỈ 4 nút này (Tầng 0), ẨN hết phần còn lại

Nhưng ảnh thực tế hiện: Quan Sát, Nói Chuyện Hắc chủ, Nói Chuyện Mật sứ, Thám Hiểm, Tu Luyện, Hành
Trang, Nghỉ Ngơi, Về Sơn Môn... => ĐÂY CHÍNH XÁC LÀ TẦNG 1-3 hiện đầy đủ trong khi ĐÁNG LẼ Tầng 0
phải chặn hết — xác nhận bug đúng theo chẩn đoán mục 1.
```

---

## 3. QUY TẮC HIỂN THỊ TRỰC QUAN (phân biệt Tầng bằng mắt, không chỉ bằng vị trí)

| Tầng | Vị trí | Màu/kiểu |
|---|---|---|
| 0 | Đầu tiên, hàng riêng nếu có | Viền sáng/nhấp nháy nhẹ, màu cảnh báo (vàng/cam tùy loại) |
| 1 | Ngay sau Tầng 0 | Màu chuẩn, không nhấn mạnh |
| 2 | Giữa hàng | Màu chuẩn |
| 3 | Luôn cuối cùng, gộp "Thêm ▾" | Màu mờ hơn 1 chút |

Không để tất cả nút cùng 1 màu/kiểu như ảnh hiện tại — đây cũng là lý do người chơi "không biết ưu
tiên cái nào", ngay cả khi bug Tầng 0 được sửa, PHÂN CẤP THỊ GIÁC vẫn cần thiết để mắt tự nhiên nhìn
đúng thứ tự quan trọng.

---

## 4. TRÁNH CƠ DUYÊN "THẤT LẠC ÂM THẦM" (cải thiện mục 3.5 Exploration Requirement)

Spec gốc: "Rời node tự động đánh dấu phát hiện chưa xử lý là thất lạc" — đúng nhưng THIẾU CẢNH BÁO.
Đề xuất bổ sung (không đổi logic, chỉ thêm 1 bước xác nhận):
```
Nếu player chọn action DI CHUYỂN trong khi pendingExploration/pendingContestedOpportunity != null:
  -> Chặn action đó lại NGAY LẬP TỨC (không cho đi luôn), hiện 1 confirm modal:
     "Ngươi còn [Cơ Duyên/Phát Hiện] chưa xử lý tại đây — rời đi sẽ bỏ lỡ vĩnh viễn. Vẫn muốn đi?"
     [Ở Lại Xử Lý] [Vẫn Rời Đi (mất Cơ Duyên)]
```
Đây tái dùng ĐÚNG rule "Pending chặn phiên mới" đã có (mục 7 Exploration Requirement: "Pending chặn
phiên mới") — chỉ mở rộng áp dụng rule đó sang action Di Chuyển, không chỉ chặn action Thám Hiểm
mới như hiện tại.

---

## 5. GHI CHÚ PHỤ — LẶP NARRATIVE 3 LẦN TRONG ẢNH (không phải trọng tâm câu hỏi, nhưng nên biết)

Ảnh cho thấy CÙNG 1 câu mở đầu ("Âm vũ rơi lạnh buốt...") xuất hiện 3 lần với độ dài tăng dần (lần 1
ngắn, lần 2 thêm "Quan hệ với...", lần 3 thêm đoạn Mật Sứ) — đúng dấu hiệu VI PHẠM quy tắc
`sceneId` ổn định đã định nghĩa ở `GAME_LOG_NOVEL_STYLE_FIX_IMPLEMENTATION_PLAN.md` mục "Scene dài
ngày": *"chỉ mở scene mới khi ngày, node, thời tiết hoặc trạng thái thay đổi"*. Nhiều khả năng 3 sự
kiện (đến node + hé lộ quan hệ Faction + gặp Mật Sứ) đang được coi là 3 SCENE RIÊNG thay vì 1 scene
nối tiếp — mỗi scene lại tự ý VIẾT LẠI câu mở đầu thay vì chỉ tiếp nối. Khuyến nghị audit CHUNG với
việc sửa Action Bar ở tài liệu này, vì cả 2 bug có thể cùng gốc: **state của "1 lượt tương tác tại
node" đang bị tách thành nhiều đơn vị rời rạc thay vì 1 luồng liên tục** — sửa cách gom nhóm state
sẽ giải quyết được cả 2 vấn đề cùng lúc.

---

## 6. VIỆC CẦN LÀM TIẾP
1. **Ưu tiên tuyệt đối:** log giá trị `pendingExploration`/`pendingContestedOpportunity` đúng thời
   điểm bug xảy ra (mục 1) — xác định đây là "Cơ Duyên đã mất" hay "bug action bar builder" TRƯỚC
   khi sửa, vì hướng fix khác nhau hoàn toàn.
2. Implement 4 tầng ưu tiên (mục 2) vào hàm build action bar — đây là thay đổi logic CỐT LÕI, cần
   audit lại MỌI action hiện có xem thuộc tầng nào (bảng phân loại trong mục 2 mới chỉ là ví dụ,
   cần liệt kê hết action thật đang có trong game).
3. Thêm confirm modal khi Di Chuyển lúc còn pending (mục 4) — fix nhanh, độc lập với mục 2.
4. Audit chung nguyên nhân gốc của lỗi lặp narrative (mục 5) cùng lúc với mục 2, vì nghi ngờ chung 1
   gốc rễ (gom state theo "lượt tương tác" chưa đúng).
