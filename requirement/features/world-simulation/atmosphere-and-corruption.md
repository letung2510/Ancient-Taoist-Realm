# Mô phỏng thế giới — Không khí dị đoan và lan nhiễm

## Mục đích

Không khí kinh dị cổ thần thấm vào mọi hệ thống theo một gradient liên tục ("Độ Sai Lệch") thay vì bật/tắt theo vùng; mọi chi tiết dị đoan có hiệu ứng cơ chế nhỏ hoặc là texture thuần túy được khai báo rõ.

## Dữ liệu & trạng thái

`player.san`, `player.maxSan`, `player.corruptionRating`, vị trí node (x, y), `subLocation.wrongness`/`corruptionLevel`, `mapState.subLocationWrongnessOverride`, `flags.forbiddenKnowledge`, `flags.forbiddenKnowledgeCount`, bảng `AMBIENT_DREAD { low, medium, high, extreme }`.

## Rules

### Độ Sai Lệch và Ambient Dread

| ID | Rule |
|---|---|
| WSIM-ATM-001 | `WrongnessLevel = clamp(round(dist×0.35 + corruptionRating×0.4 + (1 − SAN/maxSAN)×35), 0, 100)`, `dist = hypot(x−48, y−78)/1.8` tính từ gốc bản đồ. Không có hệ điểm riêng. |
| WSIM-ATM-002 | Wrongness sub-location = override nếu có, ngược lại `0.7×WrongnessLevel + 0.3×wrongness cục bộ`. |
| WSIM-ATM-003 | Ambient Dread chèn thêm đúng một câu (không thay nội dung gốc) vào mô tả node, hội thoại NPC, mô tả vật phẩm với xác suất theo dải: 0–20 → 5% (`low`), 21–50 → 15% (`medium`), 51–75 → 35% (`high`), 76–100 → 60% (`extreme`). Roll xác định theo lượt/node/key. Câu chèn là texture: không trừ SAN, không là sự kiện. |
| WSIM-ATM-004 | Bảng câu mỗi dải có cả câu bất an thường và câu body horror; nguyên tắc viết: chi tiết giải phẫu cụ thể, "gần như bình thường nhưng sai một chi tiết". |
| WSIM-ATM-005 | Dải `extreme` còn tác động UI: chỉ số HP/Linh Lực nhấp nháy sai ~1 giây trước khi hiện đúng; tên NPC đôi khi hiện sai trong một khung hình. |
| WSIM-ATM-006 | Wrongness ≥ 51: UI hiển thị cảnh báo "Cảm quan lệch tầng" và bảng trạng thái thêm dòng cảm quan lệch. |

### Người kể chuyện không đáng tin

| ID | Rule |
|---|---|
| WSIM-ATM-010 | SAN/maxSAN < 40%: 30% (roll xác định theo key) một giá trị số hiển thị (HP, Linh Lực, số địch) lệch ±12% (tối thiểu 1) so với thật; giá trị thật không đổi. |
| WSIM-ATM-011 | SAN/maxSAN < 40%: 15% tên NPC/địa điểm hiện nhầm sang tên đã gặp rồi tự sửa; 10% một câu thoại NPC "vấp" sang câu đe dọa hơn rồi trở lại (chỉ ở node Wrongness ≥ 21). Tần suất tăng khi SAN càng thấp; SAN = 0 thì toàn UI méo nặng vài giây trước khi trạng thái Điên Loạn tiếp quản. |

### Tri thức cấm kỵ

| ID | Rule |
|---|---|
| WSIM-ATM-020 | Công Pháp/Mệnh Số/lore có `isForbiddenKnowledge: true` khi học/nhận đặt `flags.forbiddenKnowledge` và tăng bộ đếm (chi tiết ở TEC-073, [technique](../technique/README.md)); không thể quên. |
| WSIM-ATM-021 | Sau khi có tri thức cấm, mọi node vĩnh viễn được mở thêm câu Ambient Dread của dải cao hơn một bậc. |
| WSIM-ATM-022 | NPC Chính Đạo phản ứng dè chừng/sợ hãi khi phát hiện tri thức cấm, dùng cùng ngưỡng hiệu ứng Tà Nhiễm hiện có cộng điều kiện "đã có tri thức cấm"; điều kiện gia nhập tổ chức có thể yêu cầu dấu ấn này. |

### Lan nhiễm môi trường

| ID | Rule |
|---|---|
| WSIM-ATM-030 | Node gần nơi Tà Thần thức tỉnh/raid thất bại, nếu N ngày không ai ghé hoặc trấn áp, tự lên cấp Dị Biến 1 → … → 5; node kề node Dị Biến có xác suất nhỏ mỗi ngày nhiễm cấp thấp hơn. Chạy trong tick ngày, seeded, có công tắc cấu hình bật/tắt. |
| WSIM-ATM-031 | Người chơi/tông môn "Trấn Áp" node Dị Biến bằng Trận Pháp/Công Pháp phù hợp để hạ cấp ô nhiễm. |
| WSIM-ATM-032 | Mô tả cảnh quan cố định theo cấp gán vào node khi cấp đổi: 1 vân gỗ xoáy như vân tay, côn trùng bay đội hình hình học; 2 đất ấm, lún như thịt rồi phồng lại, suối tanh dù trong; 3 thực vật mọc dạng ống/mạch chảy chất sẫm, gió như hơi thở; 4 đá đất có nhịp đập, thú mọc thêm mắt; 5 cả vùng là một khối mô sống khoác vỏ đất đá, âm thanh vọng chậm một nhịp. |

### Biến dị thân thể và Khế Ước Thân Xác

| ID | Rule |
|---|---|
| WSIM-ATM-040 | Mỗi lần Tà Nhiễm vượt ngưỡng 21/41/71/91, chọn ngẫu nhiên một Biến Dị của dải đó, tích lũy trên Character Sheet, không xóa được (chỉ che bằng trang bị/phù chú). Dải 21–40: hoa văn mạch máu, móng cứng bất thường, vị giác chỉ còn máu tươi; 41–70: một mắt đổi màu phản quang, khớp xương thừa, bóng có thêm chi; 71–90: da mỏng thấy bóng cử động bên dưới, giọng thứ hai; 91–100: cơ thể sai giải phẫu khi ngủ/bất tỉnh (ngay trước Eldritch Intervention). |
| WSIM-ATM-041 | Mỗi Biến Dị kèm một hiệu ứng hai lưỡi nhỏ (ví dụ khớp thừa +2% tốc đánh, −5% chuẩn xác vũ khí thường; mắt thú +10% tầm nhìn đêm, NPC thường +20% nhận ra bất thường và giảm giá trị giao dịch). |
| WSIM-ATM-042 | Khế Ước Thân Xác đổi vĩnh viễn, không hoàn tác: một mắt → +30% thấy Dị Biến/bẫy ẩn, +1 slot Cấm Thuật, mù một bên, Ambient Dread mạnh hơn; giọng nói → +50% Cấm Thuật Tinh Thần/SAN, chỉ giao tiếp bằng chữ/thần thức, NPC thường sợ; bóng đổ → miễn một loại khống chế, ai thấy cũng biết, mất Danh Vọng diện rộng; ký ức một người thân → +1 Chuyển Sinh Điểm ngay, quên hẳn một NPC/quan hệ (NPC vẫn nhớ, thoại một chiều). |
| WSIM-ATM-043 | Luân Hồi Thất Bại: `% = Tà Nhiễm lúc chết / 4`; thất bại → kiếp mới là "Bán Thành" với 2–3 Biến Dị sẵn có và một "Ký Ức Vụn" ngẫu nhiên (ảo giác định kỳ, không hại; chủ động tìm hiểu mở quest ẩn). |

### Tiếng Vọng khi Đột Phá và Phản Phệ Công Pháp

| ID | Rule |
|---|---|
| WSIM-ATM-050 | Mỗi lần Đột Phá có "Tiếng Vọng Từ Ngoài Kia" ngay sau thông báo thành công, giữ nguyên cảm giác thành tựu: Cấp 1–3 một câu dải `low`, không mất gì; Cấp 4–7 một câu `medium` + âm thầm roll 15% Tà Nhiễm +1 (không báo); Cấp 8–11 một Tà Thần (chọn theo độ tương đồng Con Đường ↔ domain) hỏi thăm với 3 lựa chọn: Phớt Lờ (−3 SAN), Lắng Nghe (+Tà Nhiễm theo Cấp, +% hệ số uy lực Công Pháp học kế tiếp), Cự Tuyệt Bằng Ý Chí (tốn % SAN hiện tại, chặn tick Tà Nhiễm lần này; chỉ hiện khi SAN đủ cao); Cấp 12–14 gắn vào mốc chọn phe/dị hóa sẵn có kèm câu `extreme`. |
| WSIM-ATM-051 | Mọi Công Pháp không phải Cấm Thuật khi phát huy roll Phản Phệ Cơ Bản `1% + 0.5% × mastery_stage (0–4)`; trúng → hiệu ứng nhỏ tạm thời (chảy máu mũi, ù tai 1 lượt, −5% chỉ số liên quan lượt kế) + một câu Ambient Dread `low/medium` gắn đúng bộ phận vừa dùng. Cấm Thuật giữ nguyên `forbiddenArt.backlash`. |

### Nội dung Tà Thần và sinh vật Dị Biến

| ID | Rule |
|---|---|
| WSIM-ATM-060 | Hình tượng khi lộ diện: Vô Diện Cuồng Vương (mỗi người thấy một gương mặt mình sợ/yêu nhất đã mất; tín đồ tự khoét mắt, mặt cứng như sáp); Thực Cảnh Đại Đế (khối thịt-đá nứt mọc mắt rồi tự nuốt; tín đồ hóa đá/rễ, hợp nhất >50% không rời thánh địa); Huyễn Sắc Cổ Thần (đẹp tới đau mắt, đối xứng giả; tín đồ thấy ai cũng giống Ngài); Vong Danh Chi Chủ (khoảng trống hình người nuốt ánh sáng/âm thanh, ai quanh đó quên một điều nhỏ; tín đồ xăm tên lên da, bậc cao chỉ còn số). |
| WSIM-ATM-061 | Sinh vật body horror cho Cấm Địa/Hải Vực-Không Vực: Cụm Thịt Biết Nói (đánh đúng miệng nói thật ×3 sát thương, cần check Tư Chất); Người Da Rỗng (giống NPC/người quen, chỉ lộ khi bị đánh hoặc Thần Thức soi); Trẻ Con Trăm Tuổi (gây "Do Dự" nếu chậm tấn công); Đàn Ong Xác Thịt (cần AOE; diệt một phần gây SAN drain diện rộng). |

## Acceptance

- Wrongness và Ambient Dread xác định theo state; câu chèn không đổi chỉ số.
- SAN < 40% làm lệch hiển thị nhưng giá trị lưu không đổi.
- Lan nhiễm tắt được bằng cấu hình; replay cùng seed cho cùng bản đồ ô nhiễm.
- Gate: `node tools/verify_log_narrative.js`, `node tools/verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WSIM-ATM-001..004 | `js/engine.js:worldviewWrongness`, `subLocationWrongness`, `weaveAtmosphere`, `AMBIENT_DREAD` | Khớp |
| WSIM-ATM-005 | — | Thiếu |
| WSIM-ATM-006 | `js/ui.js` (perceptionNote), `js/engine.js` status text | Khớp |
| WSIM-ATM-010 | `js/engine.js:perceivedValue` | Khớp |
| WSIM-ATM-011 | — | Thiếu |
| WSIM-ATM-020 | `js/engine.js:markForbiddenKnowledge` | Khớp |
| WSIM-ATM-021 | — | Thiếu |
| WSIM-ATM-022 | `js/expansion.js` (yêu cầu `forbiddenKnowledge` của tổ chức); phản ứng NPC Chính Đạo chưa có | Thiếu |
| WSIM-ATM-030..032 | — | Thiếu |
| WSIM-ATM-040..041 | `js/engine.js` (chỉ có `pendingDeviation: body_mutation` từ Tẩu Hỏa Nhập Ma) | Thiếu |
| WSIM-ATM-042..043 | — | Thiếu |
| WSIM-ATM-050 | `js/engine.js` breakthrough omen (chỉ câu tường thuật, chưa có lựa chọn Cấp 8–11) | Thiếu |
| WSIM-ATM-051 | `js/engine.js` (chỉ Cấm Thuật có `forbiddenArt.backlash`) | Thiếu |
| WSIM-ATM-060..061 | — | Thiếu |
