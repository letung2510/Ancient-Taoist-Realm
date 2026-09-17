# ĐỊNH NGHĨA ĐẦY ĐỦ: NOVEL-STYLE GAME LOG
> Đọc kèm `GAME_LOG_NOVEL_STYLE_FIX_IMPLEMENTATION_PLAN.md` (đã áp dụng). File này giải quyết đúng
> 1 việc: dòng `"NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời."` VẪN lọt
> qua dù đã fix — nghĩa là có 1 LỖ HỔNG CẤU TRÚC mà bảng banned-word cũ không bắt được, và/hoặc 1
> đường phát event riêng chưa được migrate. Định nghĩa dưới đây đủ chi tiết để: (1) tự kiểm tra BẤT
> KỲ câu log nào có đạt chuẩn novel hay không, (2) tìm đúng chỗ code đang lọt.

---

## 1. CHẨN ĐOÁN TRƯỚC: TẠI SAO DÒNG NÀY VẪN LỌT QUA DÙ ĐÃ FIX

```
"NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời."
```

Phân tích cấu trúc: `[Chủ thể] + [động từ báo cáo "phản ứng với"] + [đối tượng] + [:] + [mô tả hiệu
ứng]` — đây là NGUYÊN VĂN 1 câu log hệ thống (system announcement), không phải câu văn kể chuyện.
Đối chiếu với kế hoạch đã áp dụng:

1. **Khả năng 1 (cao nhất):** đây là event loại `"npc_weather_reaction"` hoặc tương tự, được emit từ
   1 nơi trong code KHÔNG NẰM trong danh sách "search/travel/collect/opportunity" mà kế hoạch cũ liệt
   kê ở mục 4 (`js/engine.js` — chỉ nhắc thêm `sceneId`/`relation` cho 4 loại đó). Nếu hệ thống NPC
   phản ứng thời tiết (đã thiết kế ở `MAP_SYSTEM_V2_COMPLETE.md` mục 10.5) được code RIÊNG, độc lập
   khỏi pipeline search/travel, nó vẫn đang gọi thẳng `pushHistory()` với text thô, CHƯA đi qua
   `NarrativeSceneBuilder`.
2. **Khả năng 2:** event NÀY có `playerVisible: true` nhưng KHÔNG có `narrativeKey` map tới template
   nào — hệ thống fallback về in thẳng `event.text` gốc (thô) thay vì fallback về 1 CÂU TRUNG TÍNH
   có văn phong (kế hoạch cũ có nói fallback cho ERROR, nhưng có thể CHƯA có fallback tương tự cho
   loại event "status announcement" như thế này).
3. **Việc cần làm ngay:** grep toàn bộ codebase tìm chuỗi `"phản ứng với thời tiết"` hoặc pattern
   `${npcName} phản ứng` — xác định CHÍNH XÁC file/hàm đang sinh ra nó, xác nhận nó có đi qua
   `renderScene()`/`NarrativeSceneBuilder` hay không. Đây là bước đầu tiên BẮT BUỘC trước khi sửa gì
   khác — không đoán mò.

---

## 2. ĐỊNH NGHĨA CHÍNH THỨC: THẾ NÀO LÀ "NOVEL-STYLE"

Một câu/đoạn log ĐẠT chuẩn novel-style khi và chỉ khi thỏa **CẢ 6 điều kiện** sau — thiếu 1 điều kiện
là KHÔNG đạt, không có khái niệm "gần đạt":

### 2.1. Không có cấu trúc "Thông Báo" (Announcement Structure)
```
CẤM cấu trúc: [Chủ thể] + [động từ hệ thống: phản ứng/thực hiện/kích hoạt/cập nhật/ghi nhận] +
              [:  hoặc  —] + [mô tả]

Dấu hiệu nhận biết cấu trúc CẤM: có dấu HAI CHẤM (:) ngăn cách giữa "sự kiện" và "hệ quả", hoặc câu
đọc được thành công thức "X làm Y" mà không có bối cảnh/cảm giác nào bao quanh.
```
Ví dụ CẤM: "NPC A phản ứng với thời tiết B: giảm hoạt động ngoài trời."
Ví dụ ĐẠT: "Tuyết phủ trắng con đường trước cửa tiệm — Tạ Hải Sinh kéo áo choàng chặt hơn, quyết
định dẹp sạp hàng sớm hơn thường lệ."

### 2.2. Luôn có ÍT NHẤT 1 chi tiết giác quan cụ thể (Sensory Grounding)
Không được kể sự kiện thuần khái niệm ("trời lạnh", "NPC ở trong nhà") — phải có ít nhất 1 trong:
hình ảnh (màu sắc, ánh sáng), âm thanh, xúc giác (lạnh/nóng/đau), khứu giác. Câu ví dụ CẤM ở trên
("giảm hoạt động ngoài trời") HOÀN TOÀN không có chi tiết giác quan nào — chỉ là mô tả trạng thái
trừu tượng.

### 2.3. Chủ thể có ĐỘNG CƠ/PHẢN ỨNG CÁ NHÂN, không phải quy tắc chung
Không viết "NPC làm X vì lý do hệ thống Y" — phải viết NHƯ THỂ chính NPC đó đang tự quyết định dựa
trên tính cách/vai trò/hoàn cảnh riêng. "Tạ Hải Sinh dẹp sạp sớm" (quyết định cá nhân, có thể vì anh
ta là thương nhân sợ lạnh, hoặc vì đang mong nhà) khác hẳn "giảm hoạt động ngoài trời" (mô tả 1 biến
tăng/giảm số học).

### 2.4. Không bao giờ lộ TÊN CƠ CHẾ, dù đã dịch nghĩa
Ngay cả khi không còn "Depth"/"session" tiếng Anh, nếu câu vẫn đọc như đang MÔ TẢ 1 CÔNG THỨC ("giảm
hoạt động" = giảm 1 biến số ẩn danh nào đó) thay vì 1 HÀNH VI CỤ THỂ ("dẹp sạp hàng", "trốn vào quán
trọ", "co ro dưới mái hiên") — vẫn tính là LỘ CƠ CHẾ, dù không dùng từ tiếng Anh nào.

### 2.5. Có tính LIÊN TỤC (Continuity) với các câu trước/sau trong cùng scene
Câu không được đứng ĐỘC LẬP tuyệt đối — phải có khả năng nối với câu trước đó (nếu người chơi vừa
tới node, câu NPC phản ứng thời tiết nên nối liền cảm giác "vừa bước vào X thì thấy Y", không phải
1 dòng thông báo chen ngang không liên quan bối cảnh).

### 2.6. Đọc to lên nghe như 1 câu trong TIỂU THUYẾT THẬT, không phải phụ đề game
Phép thử cuối cùng, đơn giản nhất: đọc thành tiếng — nếu nghe như đang đọc 1 dòng trạng thái HUD/
debug console dịch sang tiếng Việt, KHÔNG ĐẠT. Nếu nghe như 1 câu có thể xuất hiện trong tiểu thuyết
kiếm hiệp/tiên hiệp XUẤT BẢN THẬT, ĐẠT.

---

## 3. BẢNG PHÂN LOẠI NHANH — TỰ TEST BẤT KỲ CÂU LOG NÀO

| Câu | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 2.6 | Kết luận |
|---|---|---|---|---|---|---|---|
| "NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời." | ✗ (có dấu :) | ✗ | ✗ | ✗ (thuật ngữ "hoạt động" trừu tượng) | ✗ | ✗ | **KHÔNG ĐẠT — 0/6** |
| "Tuyết phủ trắng con đường trước cửa tiệm — Tạ Hải Sinh kéo áo choàng chặt hơn, quyết định dẹp sạp hàng sớm hơn thường lệ." | ✓ | ✓ (tuyết trắng, kéo áo) | ✓ (quyết định cá nhân) | ✓ | ✓ (có thể nối cảnh) | ✓ | **ĐẠT — 6/6** |
| "Trời trở lạnh. NPC ở trong nhà." | ✓ (không dấu :) | ✗ (chưa đủ cụ thể) | ✗ | △ | ✗ | ✗ | **KHÔNG ĐẠT — vẫn quá khô dù bỏ dấu :** |

> Lưu ý quan trọng ở dòng 3: chỉ BỎ dấu hai chấm KHÔNG ĐỦ để đạt chuẩn — đây là lỗi thường gặp khi
> sửa vội (chỉ đổi format, không đổi CHẤT LƯỢNG câu văn). Phải đạt ĐỦ CẢ 6 điều kiện, không phải chỉ
> điều kiện 2.1.

---

## 4. BỔ SUNG LINT RULE MỚI — BẮT CẤU TRÚC "THÔNG BÁO", KHÔNG CHỈ TỪ CẤM

Bảng banned-word cũ (`Depth`, `session`...) CHỈ bắt được TỪ VỰNG kỹ thuật, không bắt được CẤU TRÚC
câu kiểu thông báo. Bổ sung thêm 1 rule cấu trúc riêng:

```js
// tools/verify_log_narrative.js — THÊM rule mới, không thay rule cũ

const ANNOUNCEMENT_STRUCTURE_PATTERN =
  /^.{2,30}\s(phản ứng|thực hiện|kích hoạt|cập nhật|ghi nhận|xử lý|áp dụng)\s.{2,40}[:：]/;
  // Bắt cấu trúc "[chủ thể ngắn] + [động từ hệ thống] + [...] + dấu hai chấm"

if (ANNOUNCEMENT_STRUCTURE_PATTERN.test(narrativeText)) {
  FAIL("Câu có cấu trúc thông báo hệ thống, không phải văn kể chuyện: " + narrativeText);
}

// Rule bổ sung 2: cấm MỌI dấu hai chấm (:) trong narrative paragraph (không phải Stat Display)
if (narrativeText.includes(':') || narrativeText.includes('：')) {
  FAIL("Narrative paragraph không được chứa dấu hai chấm — đó là dấu hiệu của cấu trúc liệt kê/" +
       "thông báo, không phải câu văn.");
}
```
> Dấu hai chấm CHỈ được phép xuất hiện trong dòng Stat Display (`✦`/`◇`) đã tách riêng khỏi đoạn văn
> — KHÔNG BAO GIỜ trong chính đoạn narrative.

---

## 5. NGÂN HÀNG TEMPLATE ĐẦY ĐỦ CHO NPC × THỜI TIẾT (lấp đúng lỗ hổng đang lộ)

Viết theo đúng 6 điều kiện ở mục 2, đa dạng theo LOẠI thời tiết × VAI TRÒ NPC (không dùng chung 1
câu cho mọi NPC — thương nhân phản ứng khác nông dân, khác tu sĩ):

### 5.1. Tuyết (Snow) — NPC loại Thương Nhân
```
"Tuyết rơi mỗi lúc một dày trên mái sạp — {npcName} thở dài, bắt đầu thu dọn hàng hóa vào bao, ánh
mắt thoáng tiếc nuối vì phiên chợ hôm nay đành kết thúc sớm."

"{npcName} đứng nép dưới mái hiên, hai tay xoa vào nhau cho ấm, nhìn những bông tuyết rơi phủ dần
lên gánh hàng còn dang dở."
```

### 5.2. Tuyết — NPC loại Tu Sĩ/Đệ Tử Tông Môn
```
"Gió tuyết lùa qua vạt áo, nhưng {npcName} vẫn đứng yên trước sân luyện công — chỉ khẽ nheo mắt,
dường như cái lạnh này chẳng đáng bận tâm với người tu đạo."
```

### 5.3. Mưa (Rain) — NPC bất kỳ (mẫu chung, ưu tiên viết riêng theo vai trò nếu có thời gian)
```
"Mưa bất chợt đổ xuống, {npcName} vội kéo nón che đầu, bước nhanh về phía mái hiên gần nhất, để lại
vài vũng nước loang trên nền đất."
```

### 5.4. Bão Linh Khí — NPC (phản ứng phải khác hẳn mưa/tuyết thường vì đây là hiện tượng SIÊU NHIÊN)
```
"Không khí đột nhiên đặc quánh, linh lực cuộn xoáy vô hình quanh {npcName} — hắn/nàng tái mặt, vội
niệm quyết hộ thân, lùi sâu vào trong tường viện."
```

> Nguyên tắc chọn template: roll theo (loại thời tiết × vai trò NPC × tính cách đã roll nếu có) —
> KHÔNG dùng 1 template duy nhất cho mọi tổ hợp, đúng nguyên tắc "mỗi vùng/node/tổ chức có từ vựng
> riêng" đã ghi trong kế hoạch cũ (mục "Giọng kể và continuity").

---

## 6. QUY TRÌNH BẮT BUỘC TRƯỚC KHI MERGE BẤT KỲ TEMPLATE MỚI NÀO

```
1. Viết câu.
2. Tự chấm theo bảng 6 điều kiện (mục 2/3) — PHẢI đạt 6/6, không có ngoại lệ "tạm chấp nhận 5/6".
3. Chạy qua ANNOUNCEMENT_STRUCTURE_PATTERN (mục 4) — fail thì viết lại, không sửa chữa (patch) câu
   cũ bằng cách chỉ xóa dấu hai chấm.
4. Đọc thành tiếng (2.6) — nếu tự thấy ngượng/nghe như debug console, viết lại từ đầu.
5. CHỈ SAU KHI qua cả 4 bước trên mới thêm vào ngân hàng template.
```

---

## 7. VIỆC CẦN LÀM TIẾP
1. **Ưu tiên tuyệt đối:** grep codebase tìm nguồn phát sinh câu lỗi cụ thể (mục 1.3) — xác nhận đây
   là subsystem NPC-weather CHƯA migrate, hay bug ở tầng khác.
2. Thêm `ANNOUNCEMENT_STRUCTURE_PATTERN` + rule cấm dấu hai chấm (mục 4) vào
   `tools/verify_log_narrative.js` đã có — chạy lại lint trên TOÀN BỘ template hiện có để tìm các
   câu tương tự có thể đang lọt qua ở chỗ khác (rất có thể không chỉ NPC-weather bị lỗi này).
3. Viết đủ template cho MỌI tổ hợp (loại thời tiết × loại vai trò NPC) theo mục 5 — bảng hiện tại
   mới có mẫu cho Tuyết/Mưa/Bão Linh Khí, cần bổ sung Sương Mù/Âm Vũ theo đúng 6 loại đã thiết kế ở
   `MAP_SYSTEM_V2_COMPLETE.md` mục 10.1.
4. Audit lại TOÀN BỘ các loại event khác ngoài NPC-weather (faction war result, incident, structure
   built...) xem có đang dùng cấu trúc thông báo tương tự không — dùng CHÍNH bảng 6 điều kiện này
   làm checklist review, không chỉ riêng NPC-weather.
---

## AMENDMENT 2026-09-16 — DAILY SCENE GROUPING CONTRACT

`renderScene`, `GameEngine.novelLogParagraphs()` và UI story log dùng cùng một
date key: Năm + Tháng + Ngày. Mọi sự kiện trong cùng ngày được nối bằng khoảng
trắng thành một đoạn văn theo văn phong tiểu thuyết, kể cả khi nhân vật đổi
node/sub-location; timestamp chỉ xuất một lần. Đây là contract bắt buộc cho cả
log online và log khôi phục từ save.

## IMPLEMENTATION STATUS 2026-09-16

- Đã nối NPC/weather vào cùng narrative boundary; NPC chỉ phát log khi đang ở cùng node/sub-location với người chơi, còn mô phỏng nền không spam nhật ký.
- Đã có template theo thời tiết và vai trò NPC cho tuyết, mưa/âm vũ, sương, lôi vũ và linh phong; mỗi template có hình ảnh hoặc âm thanh, phản ứng cá nhân và hành động cụ thể.
- `narrativeSafe()` xử lý fallback cuối cùng, chuyển cấu trúc announcement thành câu kể, loại technical token và cấm dấu `:` trong narrative paragraph. Stat Display là kênh riêng.
- `novelLogParagraphs()` là grouping API canonical; `renderScene()` và UI story window dùng cùng date grouping, đặt stat summary ở cuối đoạn văn.
- Regression bắt buộc đã được chạy qua `verify_log_narrative.js`, `verify_expansion_log_matrix.js`, `verify_game.js`, `verify_dichi_deep.js` và `verify_indexeddb_archive.js`.
