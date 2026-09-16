# FIX LOG SYSTEM — TỪ "NHẬT KÝ HỆ THỐNG" SANG "VĂN TIỂU THUYẾT"
> Đọc kèm `ANCIENT_TAOIST_REALM_GAME_LOG_SYSTEM.md` (giữ nguyên kiến trúc Event/Narrative/Template
> đã có — KHÔNG viết lại từ đầu). File này CHỈ giải quyết 1 việc: bản deploy thực tế đang VI PHẠM
> chính nguyên tắc của tài liệu đó. Mọi hướng dẫn dưới đây đều PRESCRIPTIVE (quy tắc cứng, có thể
> test được), không phải gợi ý chung chung như bản trước.

---

## 1. CHẨN ĐOÁN — 6 LỖI CỤ THỂ TRONG LOG THẬT MÀY GỬI (trích dẫn nguyên văn)

| # | Dòng lỗi thật | Vi phạm nguyên tắc nào (đối chiếu file gốc) | Mức độ |
|---|---|---|---|
| 1 | `[Năm 1, Tháng 1 ngày 8 · ...]` lặp lại NGUYÊN VẸN 10 lần liên tiếp cho 10 hành động trong CÙNG 1 ngày | Không có nguyên tắc dedupe timestamp trong file gốc — đây là LỖ HỔNG của chính spec, không phải lỗi implement sai spec | Nghiêm trọng — chiếm hơn nửa dung lượng log chỉ để lặp lại thông tin không đổi |
| 2 | `> [Thu Thập Phát Hiện]` — echo lại TÊN LỆNH thô trước khi hiện kết quả | Vi phạm mục 29 "Tách Narrative và Mechanics" — đây là hiện UI command, không phải narrative | Nghiêm trọng — đọc như terminal, không phải tiểu thuyết |
| 3 | `§ Thu thập hoàn tất: Cổ Tịch Tàn Trang ×1 · Linh Thạch Hạ Phẩm ×2.` | Vi phạm mục 7 (Narrative Template System) — đây là Result Formatter thô, KHÔNG hề qua Narrative Generator dù file gốc yêu cầu | Nghiêm trọng — bỏ qua hoàn toàn tầng narrative đã thiết kế |
| 4 | `× Không thể bắt đầu hành trình: TRAVEL_ALREADY_ACTIVE.` | Vi phạm NẶNG NHẤT — 1 HẰNG SỐ NỘI BỘ (`SCREAMING_SNAKE_CASE`) lọt thẳng ra UI người chơi. File gốc mục 39 nói rõ "đừng biến log thành debug log" nhưng đây CHÍNH XÁC là debug log | **Nghiêm trọng nhất — bug thật, không phải vấn đề văn phong** |
| 5 | `§ Phiên tìm kiếm 2 tại Phù Không Đảo (2 lượt dò, Thể Lực -5): ✓ ... Depth còn 1/5.` | Từ "Depth" tiếng Anh lọt vào câu tiếng Việt; "Phiên tìm kiếm 2" là session counter nội bộ; dấu ✓ liệt kê như checklist thay vì câu văn | Nghiêm trọng — lộ nguyên state variable ra ngoài |
| 6 | Mỗi lần Tìm Kiếm xong lại cần 1 action "Thu Thập Phát Hiện" RIÊNG, tạo 2 block log cho 1 hành động logic duy nhất | Vi phạm tinh thần mục 10 (Narrative Frequency) — 1 hành động của người chơi không nên bị TÁCH thành 2 block log rời | Trung bình — vấn đề luồng game, không chỉ văn phong |

---

## 2. QUY TẮC CỨNG BẮT BUỘC (có thể viết thành test/lint, không phải gợi ý)

### 2.1. RULE — Cấm tuyệt đối hằng số nội bộ lọt ra log người chơi
```
LINT RULE: quét toàn bộ text sẽ hiện cho player, nếu match regex /^[A-Z_]{4,}$/ hoặc chứa chuỗi
toàn UPPER_SNAKE_CASE bất kỳ đâu trong câu -> FAIL BUILD, không được deploy.

Mọi mã lỗi nội bộ (TRAVEL_ALREADY_ACTIVE, INVALID_STATE, v.v.) BẮT BUỘC đi qua bảng dịch:

ERROR_NARRATIVE_MAP = {
  TRAVEL_ALREADY_ACTIVE: [
    "Ngươi vẫn còn đang trên đường, chưa thể khởi hành thêm lần nữa.",
    "Đôi chân vẫn chưa dừng bước, hãy đợi hành trình này kết thúc đã.",
  ],
  // ... mọi mã lỗi khác đều phải có ít nhất 1 câu dịch trong bảng này TRƯỚC KHI được dùng trong code
}
```
Không có ngoại lệ — nếu 1 lỗi mới được thêm vào engine mà CHƯA có trong `ERROR_NARRATIVE_MAP`, hệ
thống phải dùng 1 câu fallback trung tính ("Có điều gì đó cản trở hành động này.") chứ KHÔNG BAO GIỜ
được hiện thẳng tên hằng số.

### 2.2. RULE — Cấm từ/thuật ngữ kỹ thuật lọt vào câu narrative
```
BANNED_WORDS_IN_NARRATIVE = ["Depth", "session", "phiên", "lượt dò", "counter", "index", "ID",
                              "state", "buff", "debuff", "multiplier", "cooldown"]

Nếu 1 template narrative chứa bất kỳ từ nào trong danh sách này -> FAIL, phải viết lại.
"Depth còn 1/5" -> đổi thành ý nghĩa TƯỜNG THUẬT: "nơi đây dường như vẫn còn điều gì đó chưa lộ
diện" (mơ hồ, đúng chất khám phá) HOẶC nếu cần rõ ràng cho UI: tách RIÊNG thành 1 dòng Stat Display
(mục 11 file gốc) KHÔNG nằm trong câu văn, dạng "◇ Còn có thể dò thêm: 1 lượt".
```

### 2.3. RULE — Dedupe Timestamp (lỗ hổng chưa có trong spec gốc, bổ sung mới)
```
lastRenderedTimestamp = null

renderLogEntry(event):
  if (event.timestamp !== lastRenderedTimestamp):
      hiện dòng timestamp MỚI (dạng nổi bật, 1 lần)
      lastRenderedTimestamp = event.timestamp
  // Nếu timestamp KHÔNG đổi so với dòng ngay trước -> KHÔNG lặp lại, coi các event cùng timestamp
  // là CÙNG 1 "CẢNH" (scene), nối narrative của chúng liền mạch (xem mục 2.4)
```

### 2.4. RULE — Gộp Cảnh (Scene Batching) thay vì mỗi action 1 block riêng
```
2 event LIÊN TIẾP được gộp thành 1 đoạn narrative DUY NHẤT (không tách dòng, không lặp timestamp)
NẾU CẢ 3 điều kiện đúng:
  1. Cùng timestamp (cùng ngày game)
  2. Cùng location
  3. Có quan hệ NHÂN-QUẢ trực tiếp (VD "Tìm Kiếm" luôn kéo theo "Thu Thập" ngay sau — đây là 1 CẶP
     bắt buộc gộp, không phải 2 hành động độc lập của người chơi)

Danh sách cặp LUÔN gộp: [Tìm Kiếm + Thu Thập], [Di Chuyển + Đến Nơi], [Tấn Công + Kết Quả Đòn Đánh]
```
Với ví dụ log thật của mày: "Tìm Kiếm · 2 lượt dò" + "Thu Thập Phát Hiện" ngay sau đó PHẢI render
thành 1 đoạn văn LIỀN MẠCH, không phải 2 block với 2 lần lặp timestamp như hiện tại.

---

## 3. VIẾT LẠI CHÍNH XÁC LOG THẬT CỦA MÀY (before/after, dùng làm chuẩn hiệu chỉnh)

### TRƯỚC (nguyên văn mày gửi):
```
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Thu Thập Phát Hiện]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
§ Thu thập hoàn tất: Cổ Tịch Tàn Trang ×1 · Linh Thạch Hạ Phẩm ×2.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
⚔ Phát hiện cơ duyên có người tranh đoạt. Hãy chọn cách ứng biến trong Thế Sự.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Đi Bắc]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
× Không thể bắt đầu hành trình: TRAVEL_ALREADY_ACTIVE.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Đi Đông]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
→ Ngươi tiến đến Phù Không Đảo.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Tìm Kiếm · 2 lượt dò]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
§ Phiên tìm kiếm 2 tại Phù Không Đảo (2 lượt dò, Thể Lực -5): ✓ Tụ Khí Đan ×2 ✓ Linh Thạch Hạ Phẩm
×2 điều tra Depth còn 1/5.
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
> [Thu Thập Phát Hiện]
[Năm 1, Tháng 1 ngày 8 · Kỷ Nguyên Linh Khí Dị Biến]
§ Thu thập hoàn tất: Tụ Khí Đan ×2 · Linh Thạch Hạ Phẩm ×2.
```

### SAU (viết lại theo đúng 4 quy tắc mục 2, dùng làm chuẩn hiệu chỉnh cho engine):
```
【Năm 1, Tháng 1, Ngày 8 · Kỷ Nguyên Linh Khí Dị Biến】

§ Ngươi thu vào tay mảnh Cổ Tịch Tàn Trang phủ đầy bụi thời gian, cùng hai viên Linh Thạch Hạ Phẩm
còn vương hơi lạnh của đất.

⚔ Trong lúc cúi nhặt, ngươi cảm nhận có ánh mắt khác cũng đang dõi theo món cơ duyên này — dường như
không chỉ mình ngươi để tâm tới nó. (Xem Thế Sự để ứng biến.)

Ngươi định rẽ hướng Bắc, nhưng đôi chân vẫn còn vương vấn hành trình dở dang, chưa thể cất bước thêm
lần nữa. Đổi ý, ngươi quay sang hướng Đông — không bao lâu sau, Phù Không Đảo đã hiện ra trước mắt.

Đứng giữa đảo, ngươi lặng người dò xét từng ngóc ngách. Hai lượt tìm kiếm trôi qua, thân thể có phần
mệt mỏi, nhưng bù lại ngươi tìm được hai viên Tụ Khí Đan và thêm hai viên Linh Thạch Hạ Phẩm — dường
như nơi đây vẫn còn điều gì đó chưa lộ diện hết.

✦ Thu được: Cổ Tịch Tàn Trang ×1 · Linh Thạch Hạ Phẩm ×4 · Tụ Khí Đan ×2
◇ Thể Lực -5 · Còn có thể dò thêm tại đây: 1 lượt
```

**Điểm khác biệt cốt lõi:**
- 1 timestamp DUY NHẤT cho cả cảnh, không lặp 10 lần.
- KHÔNG còn dòng echo `> [Tên Lệnh]` nào — hành động của người chơi được NGẦM HIỂU qua chính câu
  narrative kể lại nó (đây là điểm quan trọng nhất biến "nhật ký" thành "tiểu thuyết": tiểu thuyết
  không bao giờ viết "Nhân vật thực hiện lệnh X" rồi mới kể chuyện — nó kể chuyện luôn).
- Sự kiện Bỏ hướng Bắc/đổi hướng Đông được GỘP thành 1 câu tường thuật tự nhiên thay vì 1 dòng lỗi
  kỹ thuật + 1 dòng hành động riêng biệt.
- "Tìm Kiếm" + "Thu Thập" gộp thành 1 đoạn, số liệu cộng dồn hiện Ở CUỐI thành 1 dòng Stat Display
  duy nhất (✦/◇), tách biệt hoàn toàn khỏi câu văn — đúng mục 11 file gốc nhưng lần này làm ĐÚNG.

---

## 4. MỞ RỘNG NGÂN HÀNG TEMPLATE CHO ĐÚNG 3 HÀNH ĐỘNG ĐANG BỊ LỘ RA THÔ NHẤT

### 4.1. Tìm Kiếm (Search) — theo số lượt dò VÀ kết quả (nhiều biến thể, tránh lặp)
```json
{
  "id": "explore.search.success_partial",
  "templates": [
    "Ngươi lặng người dò xét từng ngóc ngách của {location}. {n_luot} lượt tìm kiếm trôi qua, thân
     thể có phần mệt mỏi, nhưng bù lại thu được {items}.",
    "Từng bước chân ngươi in dấu khắp {location}, mắt không rời từng phiến đá, gốc cây.
     Sau {n_luot} lượt kiếm tìm, ngươi có được {items} — dường như nơi đây vẫn còn điều gì đó chưa
     lộ diện hết.",
    "Ngươi kiên nhẫn lục soát {location}, không bỏ sót một xó xỉnh nào. {n_luot} lượt dò xét mang
     lại {items}, dù sức lực cũng theo đó hao tổn không ít."
  ]
}
```
```json
{
  "id": "explore.search.exhausted",
  "templates": [
    "Ngươi đã dò xét {location} tới mức không còn gì để tìm thêm nữa — nơi này đã hoàn toàn thuộc
     về những gì ngươi biết.",
    "Không còn ngóc ngách nào của {location} chưa qua tay ngươi — đã đến lúc rời đi tìm vận may ở
     nơi khác."
  ]
}
```

### 4.2. Thất bại di chuyển (Travel Blocked) — KHÔNG BAO GIỜ hiện mã lỗi
```json
{
  "id": "travel.blocked.already_active",
  "templates": [
    "Ngươi vẫn còn đang trên đường, đôi chân chưa thể cất bước thêm lần nữa.",
    "Hành trình hiện tại vẫn chưa dứt, ngươi đành gác lại ý định đổi hướng.",
    "Có điều gì đó ngăn bước chân ngươi lúc này — hành trình cũ vẫn chưa khép lại."
  ]
}
```

### 4.3. Cơ Duyên Bị Tranh Chấp (đã có ở RANDOM_EVENT_SYSTEM.md 5.1, giờ thêm bản narrative đúng chuẩn)
```json
{
  "id": "opportunity.contested",
  "templates": [
    "Trong lúc cúi nhặt, ngươi cảm nhận có ánh mắt khác cũng đang dõi theo món cơ duyên này.",
    "Một luồng khí tức lạ thoáng qua sau lưng — dường như ngươi không phải người duy nhất để tâm
     tới thứ này."
  ]
}
```

---

## 5. ALGORITHM TỔNG HỢP — LUỒNG XỬ LÝ 1 "CẢNH" TRƯỚC KHI RENDER

```
renderScene(events[]):  // events[] = danh sách event CÙNG timestamp, CÙNG location
  1. Nhóm events theo cặp bắt buộc gộp (mục 2.4: Tìm Kiếm+Thu Thập, Di Chuyển+Đến Nơi...)
  2. Với mỗi nhóm đã gộp: gọi 1 LẦN DUY NHẤT Narrative Generator, TRUYỀN VÀO context tổng hợp
     (không gọi riêng lẻ cho từng event con trong nhóm)
  3. Lọc bỏ HOÀN TOÀN mọi event có type "COMMAND_ECHO" (loại `> [Tên Lệnh]`) — KHÔNG render loại
     event này ra UI player, chỉ giữ lại ở System Log (Layer 1) cho debug nếu cần
  4. Chạy qua ERROR_NARRATIVE_MAP (mục 2.1) cho MỌI event type "ERROR"/"BLOCKED"
  5. Chạy BANNED_WORDS_IN_NARRATIVE check (mục 2.2) trên kết quả cuối — nếu dính từ cấm, throw lỗi
     ngay lúc BUILD (không phải runtime) để dev bắt lỗi sớm
  6. Gộp toàn bộ Stat Display (✦/◇/✧) của các event trong cùng 1 cảnh thành 1 dòng DUY NHẤT ở cuối
     đoạn văn (không rải rác nhiều dòng số liệu xen giữa)
  7. Render: [1 timestamp] + [1 đoạn narrative liền mạch] + [1 dòng stat tổng hợp]
```

---

## 6. VIỆC CẦN LÀM TIẾP
1. Audit TOÀN BỘ codebase tìm mọi chỗ đang throw/hiện trực tiếp tên hằng số lỗi ra player-facing
   text (mục 2.1) — đây là bug ưu tiên SỐ 1, sửa trước mọi thứ khác vì ảnh hưởng trải nghiệm nặng
   nhất và dễ gây mất niềm tin ("thấy code lỗi" phá vỡ immersion ngay lập tức).
2. Implement `renderScene()` (mục 5) thay thế cách render event-by-event hiện tại.
3. Viết đầy đủ `ERROR_NARRATIVE_MAP` cho MỌI mã lỗi hiện có trong engine (không chỉ
   `TRAVEL_ALREADY_ACTIVE` — cần liệt kê hết, có thể có hàng chục mã khác chưa lộ ra vì chưa ai gặp
   phải tình huống đó).
4. Chạy lại chính đoạn log mày vừa gửi qua engine SAU KHI fix — đối chiếu với bản "SAU" ở mục 3 để
   xác nhận đã đúng, dùng làm regression test cho log system.
---

## AMENDMENT 2026-09-16 — GỘP NHẬT KÝ THEO NGÀY

Mọi log người chơi nhìn thấy phải đi qua narrative renderer; không render `COMMAND_ECHO`, mã lỗi, tên field hoặc câu lệnh debug. Các entry liên tiếp có cùng **Năm/Tháng/Ngày** và cùng bối cảnh node/sub-location được gộp thành một đoạn văn liền mạch, chỉ giữ một timestamp ở đầu. Stat summary nếu có đặt ở cuối đoạn, không chen giữa các câu kể. Entry khác ngày hoặc khác scene bắt đầu đoạn mới.
