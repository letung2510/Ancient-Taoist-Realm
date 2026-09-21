CONTEXT: Local Constellation View (`KHU VỰC LÂN CẬN`) — đối chiếu ảnh chụp thực tế: hiện chỉ hiện
~15 sao, bố trí theo hình elip trang trí (không phản ánh tọa độ Oxy thật), node to, màu sắc gần như
đồng nhất (đa số sao "Chưa khám phá" cùng 1 màu xám-xanh, khó phân biệt loại/trạng thái). Đọc kèm
`OPEN_WORLD_COSMIC_CONSTELLATION_MAP_REQUIREMENT.md` (giữ nguyên toàn bộ luật fog/LOD/travel đã có,
CHỈ sửa 4 điểm dưới đây).

============================================================
1. MẬT ĐỘ NODE: 30-40 THAY VÌ ~15
============================================================
Vấn đề: bán kính hiển thị Local Constellation hiện tại đang query quá ít node xung quanh vị trí
nhân vật (`coordinateIndex`), hoặc đang lọc bớt trước khi render.

Yêu cầu sửa:
- Tăng bán kính query node xung quanh `state.locationId` (Manhattan hoặc Chebyshev distance tùy
  cách đã implement) đủ để lấy ĐÚNG 30-40 node — kể cả node CHƯA từng sinh runtime (theo đúng cơ chế
  lazy-generate 4 hướng đã có ở Oxy Requirement: khi query 1 khu vực để hiển thị, các ô còn thiếu
  PHẢI được resolve/generate ngay tại thời điểm build view, không đợi player thật sự di chuyển tới).
- Nếu hiện tại code chỉ hiện node đã có sẵn trong `WORLD_MAP.nodePool` (bỏ qua ô chưa sinh), đây
  chính là lý do số lượng ít — sửa để Local View TỰ TRIGGER generate đủ số node cần thiết cho bán
  kính hiển thị, không phụ thuộc việc đã sinh trước đó hay chưa.
- Cận trên 40: nếu bán kính tính ra > 40 node khả dụng, ưu tiên hiển thị theo thứ tự: node đã
  `visited` > node `discovered` > node gần nhất trong số còn lại — KHÔNG cắt ngẫu nhiên.

============================================================
2. LAYOUT THEO TỌA ĐỘ THẬT (KHÔNG DÀN THEO HÌNH ELIP TRANG TRÍ)
============================================================
Vấn đề: vị trí sao trên ảnh hiện tại rõ ràng KHÔNG tỷ lệ với tọa độ (x,y) thật — nhìn cách bố trí
đối xứng hình elip là dấu hiệu of layout đang dùng công thức trang trí (góc chia đều theo số lượng
node) thay vì đọc `coordinateIndex` thật.

Yêu cầu sửa:
```
screenX = viewportCenterX + (node.x - character.x) × scaleFactor
screenY = viewportCenterY + (node.y - character.y) × scaleFactor
```
- `scaleFactor` điều chỉnh theo zoom level đã có (0.7–2.4) — CHÍNH XÁC tỷ lệ khoảng cách, node ở xa
  (x,y) hiện xa hơn trên màn hình, node gần hiện gần hơn — không còn dàn đều theo hình học trang trí.
- Cho phép jitter NHẸ (±5-10px ngẫu nhiên cố định theo node.id, không đổi mỗi lần render) để tránh
  node thẳng hàng cứng nhắc trông giả tạo — nhưng vị trí TƯƠNG ĐỐI giữa các node vẫn phải phản ánh
  đúng tọa độ thật, jitter chỉ phá vỡ độ cứng nhắc chứ không được đảo lộn khoảng cách tương đối.
- Test chấp nhận: 2 node có `distance(a,b)` gần nhau theo tọa độ thật PHẢI hiện gần nhau trên màn
  hình; 2 node xa nhau theo tọa độ PHẢI hiện xa nhau — hiện tại (hình elip đều) không đảm bảo được
  điều này.

============================================================
3. GIẢM KÍCH THƯỚC NODE (để 30-40 node không chồng chéo)
============================================================
- Giảm bán kính sao mặc định (ước tính hiện tại quá to so với mật độ mục tiêu) — đề xuất: sao
  thường ~40-50% kích thước hiện tại, sao hiện tại của nhân vật (glow động) vẫn giữ to nhất làm mốc
  neo mắt nhìn.
- Giảm tương ứng bán kính glow/halo xung quanh mỗi sao — halo lớn đang là nguyên nhân chính gây
  chồng lấn khi tăng mật độ, cần giảm TỈ LỆ THUẬN với giảm kích thước lõi sao.
- Nhãn tên node CHỈ hiện khi hover/selected/current/nearby quan trọng (đã có rule này trong spec
  gốc) — với mật độ 30-40 node, PHẢI tuân thủ nghiêm rule này, không hiện nhãn tràn lan gây rối mắt.

============================================================
4. BẢNG MÀU RÕ RÀNG THEO LOẠI/TRẠNG THÁI (thay vì gần như đồng nhất như hiện tại)
============================================================
Đối chiếu đúng bảng màu ĐÃ ĐỊNH NGHĨA trong spec gốc (Chính đạo xanh lam / Ma-Tà đạo đỏ tím / Trung
lập tím xám / điểm vàng cho địa danh quan trọng / tím-đỏ cho vùng nguy hiểm) — ảnh hiện tại KHÔNG
thể hiện đủ các màu này, xác nhận bảng màu spec gốc CHƯA được áp dụng đầy đủ vào render thật:

| Loại/Trạng thái node | Màu bắt buộc |
|---|---|
| Vị trí nhân vật hiện tại | Vàng sáng, glow động (giữ nguyên, đã đúng trong ảnh) |
| Chưa khám phá (`fogState=0`) | Xám-xanh mờ, KHÔNG glow — giữ tối giản đúng tinh thần bí ẩn |
| Đã khám phá, vô chủ/hoang dã | Trắng/xanh nhạt |
| Đã khám phá, thuộc Tổ Chức Chính Đạo | Xanh lam |
| Đã khám phá, thuộc Tổ Chức Ma/Tà Đạo | Đỏ tím |
| Đã khám phá, thuộc Tổ Chức Trung Lập | Tím xám |
| Địa danh quan trọng (cốt truyện/Vương Kinh) | Vàng (nhạt hơn màu nhân vật để không nhầm) |
| Vùng nguy hiểm/Cấm Địa (`dangerLevel` cao) | Tím/đỏ — RÕ RÀNG hơn viền cam nhạt hiện tại trong ảnh |
| Node "Nghe Đồn" (fogState=1, nếu đã implement) | Xám nhạt CÓ tên hiện mờ, không glow |

Yêu cầu kỹ thuật: đảm bảo TẤT CẢ 8 trạng thái trên có mã màu KHÁC NHAU đủ để phân biệt qua 1 lần
nhìn thoáng qua (không chỉ khác sắc độ nhẹ) — hiện tại ảnh cho thấy phần lớn node "Chưa khám phá"
và node có tên (Cấm Địa Ngoại Vi, Khám phá - Bắc/Nam/Tây) dùng màu QUÁ GIỐNG nhau (chỉ khác viền),
cần tách biệt màu LÕI sao rõ hơn, không chỉ dựa vào viền/ring.

============================================================
GHI CHÚ
============================================================
Thứ tự sửa nên là: mục 2 (layout tọa độ thật) trước tiên vì mục 1 (tăng mật độ) phụ thuộc vào layout
đúng để không rối khi có nhiều node hơn; mục 3-4 (size/màu) làm sau cùng vì là tinh chỉnh trực quan,
làm khi đã thấy layout thật với mật độ đích để canh chỉnh số liệu chính xác thay vì đoán mò.
