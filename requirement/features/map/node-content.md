# Bản đồ — Nội dung node, sub-location và hoạt động tại chỗ

## Mục đích

Bên trong một node: sub-location, chi tiết node, action theo ngữ cảnh (Khám Phá, Điều Tra, Thu Thập…), hoạt động tại chỗ, incident cục bộ, ghi chú cá nhân, kinh tế địa phương. Luật Action Bar chung (tầng ưu tiên, số nút) thuộc [../ui-action-log/README.md](../ui-action-log/README.md); nội dung sự kiện thuộc [../discovery/README.md](../discovery/README.md).

## Dữ liệu & trạng thái

```ts
SubLocation { id; type: "market" | "hall" | "alley" | "warehouse" | "gate" | "shrine" | "training_ground" | "wild" | …;
  displayName; actions: string[]; capacity; visibilityFog; indoor: boolean; npcsPresent: string[]; visualTag }
LocalState { population; prosperity; security; scarcity; weather; openingHours; activeEvents }
LocalActivity { id; requirements; duration; cost; risk; effects; cooldown; sourceSubLocationId }
LocalIncident { id; status: "rumor" | "emerging" | "active" | "resolved" | "expired"; nodeId; edgeIds; requiredFog; expiresDay; choices[≥2] }
```

API: `getNodeDetail`, `enterSubLocation`, `moveWithinNode`, `availableNodeActions`, `getLocalState`, `listLocalActivities`, `previewLocalActivity`, `resolveLocalActivity`, `mapIncidentPreview`, `resolveMapIncident`, `setMapNote`.

## Rules

### Sub-location

| ID | Rule |
|---|---|
| MAP-NODE-001 | Số sub-location theo loại node: tông môn/vương kinh/căn cứ thế lực lớn 6–8 (Sảnh Chính trong nhà, Chợ Nội Môn ngoài trời, Hẻm Sau ngoài trời, Kho Tàng Trữ trong nhà, Đài Luyện Công ngoài trời, Thư Viện trong nhà); thành trấn 3–5 (Chợ, Quán Trọ, Cổng Thành); thôn/làng 2–4; trạm nhỏ, động phủ, trạm người chơi 1–2 (Chính Điện, Sân Ngoài); ngã rẽ 1 (Điểm Quan Sát); hoang dã/cấm địa procedural đúng 1 sub-location ngầm định `main`. |
| MAP-NODE-002 | Mỗi node khai báo profile riêng; không cho mọi node mặc định cùng danh sách `market/hall/alley`. |
| MAP-NODE-003 | State machine: `outside_node → entering_node → inside_sub_location → leaving_node`. Chuyển sub-location trong cùng node không roll encounter, không đổi `nodeId`. Action luôn gửi `nodeId + subLocationId`; save giữ hai field tách biệt. |
| MAP-NODE-004 | NPC chỉ xuất hiện tại sub-location cụ thể (Trưởng Lão ở Sảnh Chính, Thương Nhân ở Chợ, gián điệp/Ma Đầu thường ở Hẻm Sau); sub-location đầy hoặc bị khóa thì NPC fallback về `main`. |
| MAP-NODE-005 | Action Bar ở chi tiết node chỉ hiện action của sub-location đang đứng (Chợ mới có Giao Dịch, Hẻm Sau mới có Điều Tra Mật Hội); action sub-location chỉ hiện sau khi thực sự vào. |

### Chi tiết node

| ID | Rule |
|---|---|
| MAP-NODE-010 | Thẻ chi tiết node gồm: ảnh minh họa theo `visualTag`, mô tả ngắn và thời tiết, influence gradient/heatmap, danh sách sub-location dạng thẻ, NPC hiện diện tại đúng sub-location, công trình/trạm và độ bền, bảng tin thế lực đã lọc theo fog và thời hạn, nút Lập Trạm / Xây Tháp Canh / Xây Trạm Giao Thông chỉ khi đủ điều kiện. |
| MAP-NODE-011 | `visualTag`/mô tả node đổi theo chủ sở hữu: Chính Đạo ("Cổng Tông Môn uy nghiêm"), Hắc Đạo ("Trại lán xiêu vẹo của sơn tặc"), vô chủ ("Tàn tích hoang phế không người canh giữ"). |
| MAP-NODE-012 | Mỗi node có `localState` rebuild được (dân cư, phồn vinh, an ninh, khan hiếm tài nguyên, thời tiết, giờ mở cửa, sự kiện đang diễn ra); các giá trị tác động giá chợ, NPC, nhiệm vụ và rủi ro di chuyển. |
| MAP-NODE-013 | Mô tả sub-location ngoài trời tự thêm một câu theo thời tiết hiện tại; sub-location trong nhà không đổi mô tả. |
| MAP-NODE-014 | Nhãn kỹ thuật (`watchtower`, `trading_post`, `stable`, `contested`, `frontier`…) không bao giờ hiện cho người chơi; mã lỗi kỹ thuật được dịch sang tiếng Việt. |

### Action theo ngữ cảnh node

| ID | Action | Điều kiện xuất hiện | Hiệu ứng |
|---|---|---|---|
| MAP-NODE-020 | Di Chuyển | Luôn có (bốn hướng, MAP-MV-002) | Di chuyển; roll sự kiện dọc đường |
| MAP-NODE-021 | Nói Chuyện | Node/sub-location có NPC hiện diện | Vào luồng hội thoại ([../npc/README.md](../npc/README.md)) |
| MAP-NODE-022 | Khám Phá | Node đã khám phá, chưa vét cạn sự kiện (`cooldownUntil`) | Roll một sự kiện tại chỗ, có cooldown |
| MAP-NODE-023 | Điều Tra | Node có đặc sắc bí ẩn (nội bộ lục đục, di tích) | Hé lộ lore/manh mối, có thể mở quest ẩn |
| MAP-NODE-024 | Thu Thập | Node hoang dã/cấm địa, `linhKhiDensity ≥ 3` | Thu linh thảo/nguyên liệu theo bảng tài nguyên vùng |
| MAP-NODE-025 | Đả Tọa Tu Luyện / Tự Luyện / Bế Quan | Node an toàn (`dangerLevel ≤ 2`, Tà Nhiễm thấp), không trong combat | Tăng tốc EXP theo `linhKhiDensity` |
| MAP-NODE-026 | Cắm Trại/Nghỉ Ngơi | `dangerLevel ≤ 2` | Hồi SAN/HP, không roll sự kiện khi nghỉ |
| MAP-NODE-027 | Chinh Phục Động Phủ | Node `dong_phu` chưa có `claimedByPlayerId` | Chuỗi thử thách chiếm làm căn cứ |
| MAP-NODE-028 | Giao Dịch | Có NPC thương nhân | Luồng giao dịch |
| MAP-NODE-029 | Xin Gia Nhập/Rời Khỏi | Node tông môn có chủ | Quest Đạo Lộ / thoát ly; eligibility riêng |
| MAP-NODE-030 | Bố Trận Phòng Thủ | Động phủ đã chiếm của mình | Đặt trận pháp (công pháp `tran_phap`) |
| MAP-NODE-031 | Nhìn Toàn Cảnh | Node ngã rẽ/điểm cao | Nâng fog các node lân cận lên cấp 1 ngay (tối đa một cấp, MAP-FOG-010) |

| ID | Rule |
|---|---|
| MAP-NODE-032 | Action Bar chính 4–6 nút; action hiếm (Bố Trận, Xin Gia Nhập…) gộp vào "Thêm ▾". Action map chỉ hiện khi đủ điều kiện; gọi trực tiếp qua API vẫn bị chặn đúng. Không action map nào commit mà thiếu preview tương ứng. |
| MAP-NODE-033 | Node ngã rẽ có icon/viền riêng để nhận biết action Nhìn Toàn Cảnh. |

### Hoạt động tại chỗ và incident

| ID | Rule |
|---|---|
| MAP-NODE-040 | Mỗi node có 3–8 hoạt động theo loại node và sub-location: quan sát, tìm kiếm, giao dịch, nghỉ trọ, sửa phương tiện, thuê hộ tống, nhận tin, dò thám tuần tra, hỗ trợ dân cư, mở đường tắt, đặt mốc cá nhân. Mỗi hoạt động khai báo `requirements`, `duration`, `cost`, `risk`, `effects`, `cooldown`, `sourceSubLocationId`. Hoạt động hết giờ, đang cooldown hoặc thiếu điều kiện không vào Action Bar chính. |
| MAP-NODE-041 | `LocalIncident` vòng đời `rumor → emerging → active → resolved/expired` (ví dụ chợ cháy, cầu sập, thú triều, kiểm tra cổng, thương đoàn đến, dịch bệnh, tranh chấp đất, hội chợ). Incident tác động node/cạnh, có yêu cầu fog, thời hạn, ít nhất hai lựa chọn có đánh đổi, ghi log, không nhân đôi sau reload/retry. Incident hết hạn không còn nút xử lý. Incident/encounter hiện pulse cam/đỏ trong thời gian hữu hạn; click mở lựa chọn, không tự thực hiện. |
| MAP-NODE-042 | Tương tác thế lực tại node: xin giấy thông hành, nộp phí, nhận nhiệm vụ bảng tin, thương lượng giảm phong tỏa, do thám hoặc phá tuần tra, xin hộ tống, hiến outpost, xử lý incident. Mỗi thế lực có profile riêng về kiến trúc, luật địa phương, tuần tra, thuế, điều kiện vào và phản ứng danh tiếng. |
| MAP-NODE-043 | Kinh tế địa phương: giá chợ/trạm thương mại tính từ phồn vinh, khan hiếm, thuế thế lực, thời tiết, incident và nguồn cung di chuyển; biến động có giới hạn mỗi ngày, deterministic theo world tick. Trạm thương mại chỉ tăng yield khi node có sub-location chợ và công trình còn integrity. |
| MAP-NODE-044 | Ghi chú cá nhân: ghim node, ghi chú tối đa 200 ký tự, đánh dấu nguy hiểm/cơ hội/quay lại sau, lưu tuyến yêu thích. Ghi chú không đổi topology, không làm lộ fog. |

## Luồng

```text
Mở Lân Cận → đọc tóm tắt node → xem tuyến/incident/ảnh hưởng → chọn node hoặc sub-location
  → chọn hoạt động hoặc Lập tuyến → xem preview chi phí/rủi ro → xác nhận → theo dõi task và nhật ký
```

## Acceptance

- Đúng NPC/action theo sub-location; chuyển sub-location không roll encounter.
- Hoạt động hết giờ/cooldown không vào Action Bar; NPC vắng mặt không tương tác được.
- Giá chợ deterministic theo world tick; ghi chú không lộ fog hay sửa graph.
- Gate: `node tools/verify_map_producer_matrix.js`, `node tools/verify_action_dispatch_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-NODE-001..005 | js/expansion.js:`getNodeDetail`, `enterSubLocation`, `moveWithinNode`, `NodeDetailLayout` | Khớp |
| MAP-NODE-001 (thành trấn 3–5) | js/engine.js:`runtimeLocationPool` (node static không khai báo `subLocations`; mặc định chỉ `main`; runtime không ép khoảng 3–5 hay 4–6) | Lệch |
| MAP-NODE-010..014 | js/expansion.js:`getNodeDetail`, js/ui.js | Khớp |
| MAP-NODE-020..031 | js/expansion.js:`availableNodeActions`, js/engine.js:`search`, `investigateSearchFinding`, `rest` | Khớp |
| MAP-NODE-040 | js/expansion.js:`listLocalActivities`, `previewLocalActivity`, `resolveLocalActivity` | Khớp |
| MAP-NODE-041 | js/expansion.js:`mapIncidentPreview`, `resolveMapIncident` | Khớp |
| MAP-NODE-042..043 | js/expansion.js:`getLocalState` | Khớp |
| MAP-NODE-044 | js/expansion.js:`setMapNote` | Khớp |
