CONTEXT: Cổ Dị Diện — Tiên Hiệp Text RPG (https://letung2510.github.io/Ancient-Taoist-Realm/).
UI: MUD-style, action bar hybrid (quick command + free text), 13 tab: Trạng thái/Hành trang/Nhiệm
vụ/Nhân duyên/Tổ chức/Bản đồ/Mệnh số/Công pháp/Cảnh giới/Ký ức/Phường thị/Khâm Thiên Giám/Hư Thiên
Đỉnh. Đã implement đúng hệ thống Mệnh Số/Công Pháp/Cảnh Giới/SAN/Corruption đã thiết kế trước đó.

Yêu cầu sửa 6 mục sau, viết code trực tiếp — KHÔNG cần giải thích lại lý thuyết, chỉ cần diff/patch.

============================================================
1. TỶ LỆ TAB-CONTENT vs ACTION-BAR BỊ LỆCH — STATUS BỊ THU NHỎ
============================================================
Triệu chứng: khung tab-content (nơi hiện Trạng Thái/Hành Trang...) đang bị bóp nhỏ vì action bar
(quick command + ô gõ tự do) chiếm quá nhiều không gian dọc/ngang.
Fix:
- Đưa toàn bộ layout chính (tab-content + action-bar) vào 1 flex container `flex-direction: column`,
  `height: 100vh` (hoặc `100dvh` cho mobile để tránh lỗi viewport khi có thanh địa chỉ browser).
- tab-content: `flex: 1 1 auto; min-height: 0; overflow-y: auto` — PHẢI có `min-height: 0` để flex
  item co giãn đúng trong container overflow (lỗi phổ biến nhất khiến content bị tràn/không co).
- action-bar: `flex: 0 0 auto` (chiều cao cố định theo nội dung, KHÔNG được để `flex-grow` > 0).
- Nếu action-bar đang có nhiều nút quick-command wrap nhiều dòng chiếm không gian: giới hạn
  `max-height` cho khu quick-command kèm `overflow-x: auto; white-space: nowrap` (cuộn ngang thay vì
  wrap dọc), hoặc gộp bớt nút hiếm dùng vào 1 dropdown "Thêm ▾".
- Trên mobile: kiểm tra `100vh` có bị lỗi do thanh URL bar co giãn không — đổi sang `100dvh` hoặc
  dùng JS `window.visualViewport` để set height chính xác.

============================================================
2. STORY-PANEL: CHỈ HIỆN 20 ACTION GẦN NHẤT (GIẢM TẢI DOM/LOGCAT)
============================================================
Giải pháp (windowing, không mất dữ liệu):
- Lưu TOÀN BỘ lịch sử log vào 1 mảng `fullLogHistory[]` (state/store, không đụng vào DOM trực tiếp).
- DOM chỉ render `fullLogHistory.slice(-20)` mặc định.
- Thêm nút/link "Xem thêm lịch sử ▲" ở đầu story-panel — bấm vào thì render thêm 20 dòng cũ hơn
  (tăng dần window size, hoặc chuyển sang modal riêng "Nhật Ký Đầy Đủ" load full history khi cần).
- Nếu dùng React/Vue: cân nhắc `react-window`/`vue-virtual-scroller` cho virtualization thật sự nếu
  lịch sử có thể lên tới hàng nghìn dòng — nhưng với ngưỡng 20 dòng hiển thị mặc định, chỉ cần
  slice() là đủ, KHÔNG cần virtualization phức tạp trừ khi mở "Xem thêm" nhiều lần.
- Định kỳ (mỗi N action hoặc mỗi phiên) flush `fullLogHistory` cũ hơn M dòng xuống localStorage/
  IndexedDB thay vì giữ hết trong memory nếu phiên chơi dài (tránh phình RAM tab trình duyệt).

============================================================
3. HỆ THỐNG ĐẾM THỜI GIAN THẾ GIỚI TU TIÊN + TÍCH HỢP STORY-PANEL
============================================================
```
GameClock {
  currentYear: int          // năm hiện tại trong Kỷ Nguyên (Xianxin_map.md: 1 Kỷ = 500-1000 năm)
  currentEra: string        // tên Kỷ Nguyên hiện tại
  currentMonth: 1-12
  currentDay: 1-30
  realTimeToGameTimeRatio: number   // VD 1 phút thực = 1 ngày game (điều chỉnh theo nhịp mong muốn)
}
advanceGameTime(realSecondsElapsed):
  gameDaysElapsed = realSecondsElapsed × realTimeToGameTimeRatio
  cộng dồn vào currentDay, tự rollover currentMonth/currentYear/currentEra khi tràn
  MỖI LẦN rollover Era -> trigger world event "Đại Kiếp" (đã thiết kế ở Xianxin_map.md mục 6)
```
- Tích hợp story-panel: MỖI dòng log ghi kèm timestamp game (VD "[Năm 3, Tháng 7 - Kỷ Thái Hòa]
  Bạn tu luyện tại Vạn Phong Điện.") — không chỉ hiện action, mà hiện ĐÚNG lúc nào trong thế giới.
- Đưa `GameClock` vào 1 nơi hiển thị cố định (header hoặc tab Trạng Thái), cập nhật real-time.

============================================================
4. ÁP DỤNG GAMECLOCK VÀO THỌ NGUYÊN (HIỆN ĐANG "VÔ TRI")
============================================================
```
onGameYearPass(character):
  character.currentAge += 1
  if character.currentAge >= character.maxLifespan:
      trigger processLuanHoi(character)   // đã thiết kế trước đó, tách riêng khỏi processChuyenSinh
  else if character.currentAge >= character.maxLifespan × 0.9:
      hiện cảnh báo đỏ "Thọ Nguyên sắp cạn" (đã thiết kế ở tài liệu breakthrough/lifespan trước)
```
- Hook `onGameYearPass` vào đúng `advanceGameTime()` ở mục 3 — mỗi lần currentYear tăng thật (không
  phải mỗi tick nhỏ) mới gọi, tránh gọi thừa.
- Diên Thọ Đan (đã thiết kế) cộng thẳng vào `maxLifespan`, không ảnh hưởng `currentAge` — đảm bảo
  logic 2 field tách biệt đúng như thiết kế gốc.
- Hiển thị Thọ Nguyên dạng "X/Y năm" ở tab Trạng Thái, có thanh progress đổi màu theo % còn lại
  (xanh > 50%, vàng 20-50%, đỏ nhấp nháy < 10%).

============================================================
5. ÁP DỤNG WORLDVIEW ATMOSPHERE VÀO LOGIC THỜI GIAN
============================================================
Nối `WORLDVIEW_ATMOSPHERE.md` (Ambient Dread, Wrongness Gradient) vào GameClock:
- Roll Ambient Dread NGẪU NHIÊN không chỉ theo action mà còn theo THỜI ĐIỂM trong ngày game — giờ
  Tý (23h-1h giờ game) tăng `WrongnessLevel` tạm thời +1 bậc so với ban ngày (giờ "âm khí thịnh").
- Mỗi lần Đột Phá đã có "Tiếng Vọng Từ Ngoài Kia" (mục 16 file atmosphere) — giờ GẮN THÊM: nếu Đột
  Phá xảy ra đúng giờ Tý game, tăng gấp đôi % Corruption tick ngầm ở khung Cấp 4-7 (đã thiết kế).
- Mỗi lần chuyển Kỷ Nguyên (world event Đại Kiếp, mục 3) -> LUÔN chèn 1 đoạn Ambient Dread mức Cực
  cao vào story-panel cho MỌI người chơi đang online, bất kể đang làm gì (world-wide flavor beat).
- Corruption Spread trên map (đã thiết kế ở MAP_SYSTEM.md mục 6.6) giờ tick theo GAME DAY thay vì
  real-time thuần — 1 ngày game = 1 lần roll lan nhiễm cho node Dị Biến, đồng bộ nhịp độ với toàn
  bộ hệ thống thời gian mới này thay vì chạy timer riêng biệt.

============================================================
6. AUDIT UX TOÀN SITE — ĐIỂM CẦN CẢI THIỆN
============================================================
- **13 tab dàn hàng ngang là QUÁ NHIỀU** cho 1 dòng — nhóm lại 3 cụm bằng segmented control/dropdown:
  (a) Nhân Vật: Trạng thái, Hành trang, Mệnh số, Công pháp, Cảnh giới
  (b) Thế Giới: Bản đồ, Tổ chức, Nhiệm vụ, Nhân duyên
  (c) Đặc Biệt: Ký ức, Phường thị, Khâm Thiên Giám, Hư Thiên Đỉnh
  Giảm tải nhận thức ngay từ lần đầu mở game, đúng nguyên tắc "Ambient Dread không nên bị pha loãng
  bởi UI rối rắm".
- **Thiếu tutorial/first-time overlay**: hệ thống Mệnh Số/Công Pháp/Cảnh Giới đã build RẤT sâu (Fate
  Ratio R, Corruption, 5 điều kiện Đột Phá...) — người chơi mới vào sẽ choáng ngợp không hiểu gì.
  Thêm 1 overlay hướng dẫn 3-4 bước đầu tiên (VD "Đây là Thọ Nguyên — nó sẽ giảm theo thời gian
  game...").
- **Command history**: ô gõ tự do MUD-style nên hỗ trợ phím ↑/↓ gọi lại lệnh cũ (terminal-style),
  giảm gõ lặp lại.
- **Autocomplete gợi ý lệnh**: khi gõ dở "tu lu..." hiện gợi ý "tu luyện" (đã có action tương ứng
  trong quick-command, tận dụng lại danh sách đó làm nguồn autocomplete).
- **Visual feedback cho SAN/Corruption thấp**: áp dụng Unreliable Narrator (đã thiết kế) bằng CSS
  filter nhẹ (hue-rotate/text-shadow glitch) lên story-panel khi SAN < 40%, tăng cường độ khi < 20%
  — biến cơ chế thành TRẢI NGHIỆM THỊ GIÁC thật, không chỉ số liệu ẩn.
- **"Ký ức" tab** nên tận dụng làm nơi hiện "Ký Ức Vụn" (đã thiết kế ở Luân Hồi Thất Bại,
  WORLDVIEW_ATMOSPHERE.md mục 14) — biến 1 tab hiện đang có thể còn sơ khai thành điểm chạm lore đặc
  sắc riêng biệt của game này.
- **Lưu tệp**: đảm bảo có cả Export (tải file .json về máy) lẫn Import — không chỉ lưu localStorage,
  tránh mất tiến trình khi đổi máy/xóa cache trình duyệt.
- **Độc đáo hóa Đột Phá**: mỗi lần Đột Phá thành công nên có 1 khoảnh khắc UI RIÊNG (không chỉ là 1
  dòng log) — full-screen flash ngắn + âm thanh (nếu có) + đúng lúc này chèn "Tiếng Vọng" (mục 5) —
  biến cột mốc quan trọng nhất của gameplay loop thành khoảnh khắc đáng nhớ nhất về mặt UI.

============================================================
GHI CHÚ
============================================================
Thứ tự làm nên là: 1 → 2 (UI/hiệu năng trước) → 3 → 4 → 5 (thời gian, phụ thuộc lẫn nhau tuần tự)
→ 6 (UX audit làm dần, không cần 1 lần). Mục 3-5 phụ thuộc chuỗi (4 cần 3 xong trước, 5 cần 3+4).
