# BỔ SUNG TƯƠNG TÁC BẢN ĐỒ — DỰA TRÊN KIẾN TRÚC OXY/CONSTELLATION/EXPLORATION ĐÃ CÓ
> Đọc kèm `MAP_OXY_COORDINATE_ARCHITECTURE_REQUIREMENT.md`,
> `OPEN_WORLD_COSMIC_CONSTELLATION_MAP_REQUIREMENT.md`,
> `EXPLORATION_SEARCH_SYSTEM_REQUIREMENT.md`. KHÔNG đề xuất lại thứ đã có (coverage/influence, fog 4
> cấp, weather, NPC patrol, edge zone action, exploration session) — chỉ bổ sung phần còn trống,
> dùng ĐÚNG schema/thuật ngữ đã chốt (`mapNodeType`, `regionId`, `WORLD_MAP.nodePool`,
> `coordinateIndex`, `organizationCoverageSnapshot`).

---

## 1. CHÒM SAO TỔ CHỨC (ASTERISM GROUPING) — tận dụng ĐÚNG ẩn dụ "chòm sao" đang dùng

**Vấn đề:** hiện tại mỗi node tổ chức là 1 sao độc lập trên Constellation Map; ở Region View, người
chơi thấy nhiều sao rời rạc thay vì CẢM NHẬN được "đây là lãnh thổ của 1 tổ chức".

**Đề xuất:**
```js
// Field mới trên tổ chức, KHÔNG đổi schema node đã có
Organization.asterismShape: [{ dx, dy }]  // hình dạng chòm sao tương đối, vẽ NỐI các node có
                                            // organizationId trùng nhau + coverage > ngưỡng
```
- Ở **Region View** (mục "Chòm sao và mức chi tiết" đã có), các node cùng `organizationId` với
  `organizationCoverageSnapshot() > threshold` được nối bằng 1 đường mảnh MÀU RIÊNG theo alignment
  (đã có sẵn bảng màu alignment) — tạo thành 1 "chòm sao" có tên (dùng tên tổ chức) hiện mờ khi zoom
  Region, đúng quy tắc "Nhãn cấp cao có thể hiển thị mờ ở zoom Vùng" đã có.
- KHÔNG cần field hình học phức tạp — chỉ cần: mọi node coverage > threshold của CÙNG 1
  `organizationId` tự động nối với NHAU (không cần thiết kế shape thủ công), thuật toán tối thiểu
  spanning tree là đủ để không rối mắt.

---

## 2. NHẬT KÝ ĐỊA DANH (NODE HISTORY LOG) — nối `incident` đã có thành sử liệu tích lũy

**Vấn đề:** `incident` hiện là pulse tạm thời (cam/đỏ, "thời gian hữu hạn") rồi biến mất — không có
nơi nào LƯU LẠI những gì đã xảy ra tại 1 node theo thời gian.

**Đề xuất:**
```js
WORLD_MAP.nodePool[nodeId].history: [
  { turn, type: "war"|"incident"|"notable_npc_visit"|"faction_change", summary, regionId }
]
```
- Mỗi khi 1 `incident` kết thúc, hoặc `organizationCoverageSnapshot()` đổi chủ node (chiến tranh có
  kết quả), hoặc 1 NPC nổi bật ghé qua lần đầu — ghi 1 dòng vào `history`.
- UI: khi zoom **Close view** (đã có 4 mức LOD), thêm 1 tab nhỏ "Sử Ký" trong panel node hiện ra —
  không phải feature mới tách biệt, chỉ là 1 tab bổ sung trong panel `Current Region View Model` đã
  định nghĩa sẵn.
- Giá trị: biến node từ "1 điểm chấm trên bản đồ" thành "1 nơi có quá khứ", đặc biệt hiệu quả với
  node runtime lazy-generated (mục 8 Oxy requirement) — những node này hiện KHÔNG có gì đặc biệt
  ngoài tên/terrain, `history` cho chúng lý do để người chơi quay lại.

---

## 3. TUYẾN THƯƠNG MẠI SỐNG (nâng cấp action "Mở tuyến thương mại" đã có ở Edge Zone)

**Vấn đề:** `edgeActions` đã có "Mở tuyến thương mại" nhưng chỉ là 1 action đơn (transaction contract
1 lần) — chưa mô tả tuyến đó VẬN HÀNH ra sao sau khi mở.

**Đề xuất:**
```js
TradeRoute {
  id, fromNodeId, toNodeId,   // 2 node đã có coordinate, dùng Manhattan distance có sẵn
  caravanPosition: { x, y },   // cập nhật mỗi turn, di chuyển dọc đường thẳng nối 2 tọa độ
  status: "active" | "raided" | "blockaded"  // "blockaded" tái dùng đúng khái niệm phong tỏa đã có
                                               // ở mục 11 Oxy requirement (chỉ modifier, không xóa liên kết)
}
```
- `caravanPosition` là 1 sao NHỎ di chuyển thật trên Constellation Map dọc route đã mở (khác NPC
  patrol edge đã có — đoàn buôn di chuyển theo ĐƯỜNG THẲNG tọa độ, không theo edge cố định).
- Player có thể "Hộ Tống" (tăng an toàn, nhận phí) hoặc gặp sự kiện "Bị Cướp" (nếu đi qua vùng
  `dangerLevel` cao dọc đường) — tái dùng nguyên bảng rủi ro/thời tiết đã có ở Exploration
  Requirement mục 4, không tạo bảng risk riêng.
- Tuyến thương mại bị cướp nhiều lần tự động chuyển `status: "blockaded"` — ảnh hưởng NGƯỢC lại
  `organizationCoverageSnapshot` của 2 tổ chức đầu tuyến (thương mại đứt = tài nguyên giảm = coverage
  giảm) — đóng vòng lặp kinh tế-lãnh thổ thay vì 2 hệ tách rời.

---

## 4. ĐƯỜNG NỐI CHUỖI NHIỆM VỤ (QUEST CONSTELLATION LINE)

**Vấn đề:** Constellation Map hiện chỉ vẽ route di chuyển (mảnh, mờ) — không có cách nào NHÌN THẤY
1 chuỗi quest đang trải dài qua nhiều node trên bản đồ.

**Đề xuất:**
```
Khi player có 1 quest chain ĐANG ACTIVE có >= 2 node liên quan (node nhận + node hoàn thành, hoặc
chuỗi world_discovery nhiều bước đã thiết kế trước) -> vẽ 1 đường nối ĐẬM HƠN route thường, màu
riêng theo questType (main_story/world_discovery/moral_choice), CHỈ hiện khi quest đó đang active
(tự ẩn khi hoàn thành/hủy).
```
- Đây là lớp HIỂN THỊ THUẦN TÚY (không đổi logic quest/travel/exploration đã có) — chỉ đọc lại
  `questLog` hiện có + `coordinate` của node liên quan, vẽ thêm 1 đường trên layer Constellation.
- Giải quyết đúng vấn đề UX: chuỗi quest `world_discovery` (thiết kế trước đó, cố ý KHÔNG hiện rõ
  trong quest log để giữ cảm giác khám phá) vẫn có thể "gợi ý mơ hồ" bằng 1 đường nối lờ mờ, KHÔNG
  ghi rõ tên quest — vừa giữ bí ẩn vừa tránh cảm giác lạc lối hoàn toàn.

---

## 5. NODE "CỘNG HƯỞNG" VỚI CON ĐƯỜNG NGƯỜI CHƠI (Path Resonance Marker)

**Vấn đề:** `searchable` (tài nguyên có thể tìm ở node, đã có trong schema) hiện không phân biệt gì
theo Con Đường người chơi đang đi — mọi node như nhau với mọi Con Đường.

**Đề xuất:**
```js
// Không đổi schema node — chỉ thêm 1 bước TÍNH TOÁN PHÍA CLIENT khi render:
nodeResonance(node, character) = matchScore giữa node.searchable/node.terrain (tra qua tags đã có
  ở hệ Mệnh Số/Con Đường — dùng LẠI bảng lead/support/forbidden tags, không tạo bảng mới) và
  character.currentPathId
```
- Node có `nodeResonance` cao hiện thêm 1 GLOW PHỤ nhẹ (không đổi hình dạng sao, đúng nguyên tắc
  "Event/war/patrol dùng badge nhỏ, không thay đổi hình dạng sao quá mạnh" đã có) — gợi ý MƠ HỒ
  "nơi này có gì đó hợp với con đường ngươi" mà không spoil chính xác cái gì.
- Đặc biệt hữu ích với node runtime lazy-generated (vô số node hoang dã sinh ra khi khám phá) — cho
  người chơi 1 tín hiệu ĐỊNH HƯỚNG giữa thế giới mở rộng lớn, tránh cảm giác đi lung tung vô định.

---

## 6. TRẠM QUAN SÁT HOÀN THIỆN CHÒM SAO (Exploration Completion Tracker)

**Vấn đề:** ẩn dụ "từng mảnh chòm sao được nối lại" đã có trong yêu cầu gốc nhưng chưa có thước đo
CỤ THỂ cho người chơi thấy tiến độ này.

**Đề xuất:**
- 1 chỉ số % đơn giản ở góc UI bản đồ: `visitedLocations.length / totalKnownNodesInRegion` — CHỈ
  tính node đã sinh ra thực sự (không tính node lazy chưa từng generate, tránh số ảo vô nghĩa với
  thế giới vô hạn).
- Đạt mốc % nhất định trong 1 `regionId` (VD 80%) → mở 1 danh hiệu (đã có hệ Danh Hiệu ở nhóm D
  trước đó) "Người Vẽ Bản Đồ [Tên Vùng]" — không cần thưởng cơ chế mạnh, chỉ là cột mốc ghi nhận.

---

## 7. VIỆC CẦN LÀM TIẾP
1. Mục 1 (Asterism) và mục 6 (Completion Tracker) là THUẦN HIỂN THỊ (đọc data có sẵn, không đổi
   logic gameplay) — nên làm trước vì rẻ nhất, không đụng vào contract `startTravel()`/exploration
   đã ổn định.
2. Mục 3 (Tuyến Thương Mại sống) phức tạp nhất — cần thêm 1 "tick" riêng cập nhật `caravanPosition`
   mỗi turn, nên làm SAU KHI đã có vòng lặp thế giới dạng tick ổn định (nếu đã implement từ trước)
   — không nên là vòng lặp độc lập thứ 2 chạy song song gây khó đồng bộ.
3. Mục 5 (Node Resonance) cần bảng tags Con Đường đã dùng cho Mệnh Số (đã có, tái dùng) — chỉ cần
   viết hàm tính, không cần data mới.
4. Mục 2 và mục 4 nên làm cùng đợt vì cùng đụng vào panel `Current Region View Model` đã có sẵn —
   tránh sửa panel này 2 lần riêng biệt.
