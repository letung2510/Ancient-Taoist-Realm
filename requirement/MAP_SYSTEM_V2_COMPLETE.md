# MAP SYSTEM V2 — THIẾT KẾ TOÀN DIỆN CHO OPEN WORLD THỰC SỰ
> Thay thế/hợp nhất `MAP_SYSTEM.md` + phần bản đồ trong `WORLD_INTERCONNECTION_SYSTEM.md` mục 1-4.
> Vấn đề cốt lõi cần sửa: bản đồ hiện tại vẫn là "node-graph có sinh procedural" nhưng CẢM GIÁC như
> danh sách hộp nối nhau, không phải thế giới sống — thế lực không thật sự "chiếm không gian", người
> chơi không có công cụ định hình bản đồ, di chuyển không có trọng lượng.

---

## 1. KIẾN TRÚC 4 LỚP BẢN ĐỒ (thay vì 1 lớp node-graph phẳng)

```
Lớp 1 — THẾ GIỚI (World Map):     tổng quan toàn vùng, hiện vùng ảnh hưởng Faction dạng heatmap,
                                    dùng để lên kế hoạch di chuyển xa, KHÔNG hiện chi tiết từng node
Lớp 2 — VÙNG (Regional Map):       chính là node-graph hiện có (grid tọa độ x,y từ MAP_SYSTEM.md 6),
                                    đây là lớp chơi chính hàng ngày
Lớp 3 — ĐỊA ĐIỂM (Node Detail):    MỚI — bấm vào 1 node đã khám phá, mở ra sub-map các điểm nhỏ BÊN
                                    TRONG node đó (chợ/sảnh chính/hẻm sau/kho...), NPC đứng ở ĐÚNG
                                    điểm nhỏ cụ thể, không còn "cả node là 1 hộp mờ"
Lớp 4 — INSTANCE (Bí Cảnh/Mộng Cảnh/Nội thất Động Phủ): tách biệt hoàn toàn khỏi lưới chính, đã có
                                    khung ở các tài liệu trước, giữ nguyên
```
Đây là thay đổi NỀN TẢNG quan trọng nhất — giải quyết trực tiếp cảm giác "chưa phải open world thật"
vì trước giờ chỉ có Lớp 2, khiến mọi node dù to (Vương Kinh) hay nhỏ (trạm gác) đều cảm giác như
nhau (1 hộp bấm vào là xong).

---

## 2. LỚP 3 CHI TIẾT — NODE DETAIL VIEW (giải quyết "node là hộp rỗng")

```
NodeDetailLayout {
  nodeId,
  subLocations: [
    { id, name, type: "market"|"hall"|"alley"|"warehouse"|"gate"|"shrine"|"training_ground",
      npcsPresent: [npcId], actionsAvailable: [...], visualTag }
  ]
}
```
- Số lượng `subLocations` tùy quy mô node: Trạm gác nhỏ = 1-2 điểm; Tông Môn/Vương Kinh lớn = 5-8
  điểm khác nhau.
- NPC giờ gắn vào ĐÚNG 1 `subLocation` cụ thể (không còn "NPC ở node" mơ hồ) — Trưởng Lão ở "Sảnh
  Chính", Thương Nhân ở "Chợ", gián điệp/Ma Đầu thường xuất hiện ở "Hẻm Sau" (dùng đúng ý tưởng Mật
  Hội đã thiết kế, giờ có VỊ TRÍ CỤ THỂ để player phải chủ động tới đúng chỗ mới bắt gặp).
- Action Bar tại Lớp 3 chỉ hiện action liên quan tới `subLocation` đang đứng (VD "Chợ" mới có Giao
  Dịch, "Hẻm Sau" mới có Điều Tra Mật Hội) — biến việc di chuyển TRONG 1 node cũng có ý nghĩa chọn
  lựa, không chỉ di chuyển GIỮA các node.

---

## 3. LÃNH THỔ THEO GRADIENT (KHÔNG CÒN NHỊ PHÂN SỞ HỮU/KHÔNG SỞ HỮU)

### 3.1. Vùng Ảnh Hưởng (Influence Radius) thay vì `ownerFactionId` cứng
```
Mỗi Faction node (Tông Môn/Thế Gia chính) phát ra "sức ảnh hưởng" giảm dần theo khoảng cách:
  influenceAt(node, faction) = faction.power × decayFactor^(distance(node, faction.homeNode))
  // decayFactor ví dụ 0.7 — mỗi ô xa thêm, ảnh hưởng còn 70% ô trước

Mỗi node THƯỜNG (không phải Faction chính) có `influenceMap: { factionId: number }` — TÍNH LẠI mỗi
worldTick, không cố định. `ownerFactionId` cũ giờ SUY RA từ influenceMap (Faction có influence cao
nhất tại node đó > ngưỡng nào đó mới được coi là "chủ", nếu không ai vượt ngưỡng -> node "vô chủ
thực sự", không phải mặc định thuộc về Faction gần nhất).
```

### 3.2. Vùng Tranh Chấp (Contested Zone) — hệ quả trực tiếp của gradient
```
Node có 2+ Faction cùng influence gần bằng nhau (chênh lệch < 15%) -> đánh dấu "Tranh Chấp":
  - `eventPoolTag` đổi thành hỗn hợp (trộn trọng số sự kiện của CẢ 2 Faction liên quan)
  - Cả 2 Faction đều có thể giao nhiệm vụ TẠI node này (dù không "sở hữu" chính thức)
  - Player hoàn thành quest cho 1 bên tại đây sẽ đẩy influence bên đó lên — GIÚP NGƯỜI CHƠI THỰC SỰ
    ĐỊNH HÌNH BẢN ĐỒ bằng hành động, không chỉ đứng xem thế lực tự chiến tranh (đã có ở
    WORLD_INTERCONNECTION_SYSTEM.md mục 2.2, giờ có thêm 1 con đường ẢNH HƯỞNG MỀM song song
    chiến tranh trực diện)
```

### 3.3. Bản đồ Heatmap ở Lớp 1 (World Map)
Hiện màu chồng lấp theo `influenceMap` tổng hợp toàn vùng — người chơi nhìn Lớp 1 thấy NGAY "vùng
này đang là của ai, vùng nào đang tranh chấp nóng" mà không cần bấm từng node ở Lớp 2.

---

## 4. NGƯỜI CHƠI ĐỊNH HÌNH BẢN ĐỒ (MAP AGENCY — hiện hoàn toàn thụ động)

### 4.1. Cắm Cờ/Lập Trạm (Claim Outpost)
```
Tại 1 node VÔ CHỦ THỰC SỰ (không Faction nào vượt ngưỡng influence, mục 3.1), player có action mới
"Lập Trạm" — cần Linh Thạch + thời gian (vài ngày GameClock), sau đó:
  - Node đó có `ownerFactionId = "player_outpost_" + characterId` (player CHÍNH THỨC là 1 thực thể
    có lãnh thổ trên bản đồ, không chỉ có Động Phủ đơn lẻ)
  - Tự phát ra influence NHỎ quanh nó (dùng công thức mục 3.1, `power` thấp hơn Faction thật nhiều)
  - Có thể bị Faction khác "lấn" nếu không củng cố (đúng cơ chế gradient, không phải bất tử)
```

### 4.2. Xây Dựng Tại Trạm/Động Phủ (Structure Building)
| Công trình | Hiệu ứng lên bản đồ |
|---|---|
| Vọng Gác (Watchtower) | Tăng bán kính `revealAdjacentNodes` (MAP_SYSTEM.md mục 2) quanh trạm — nhìn xa hơn mà không cần tự đi |
| Trạm Dịch (Waystation) | Thêm 1 điểm Fast Travel (mục 5) miễn phí tại đây |
| Thị Tập Nhỏ (Trading Post) | NPC Thương Nhân tự động ghé qua theo lịch (dùng `scheduleType: itinerant` đã có), không cần player chủ động tìm |
| Trận Pháp Phòng Thủ | Tăng "power" phát influence của trạm (đã nối ở `PHAC_THAO_TU_VI_CON_DUONG_V3.md` — Trận Pháp Sư nghề mới) |

### 4.3. Tuyên Bố Chủ Quyền Lên Faction Thật (Territory Petition)
Nếu player đang phục vụ 1 Faction (đã gia nhập), có thể "hiến" 1 Trạm của mình cho Faction đó —
Trạm trở thành lãnh thổ chính thức của Faction (tăng `power` gốc của Faction đó lâu dài), đổi lại
Cống Hiến/factionReputation tăng vọt — biến việc mở rộng bản đồ cá nhân thành ĐÓNG GÓP thực sự cho
tổ chức mình chọn, không phải 2 hệ thống tách rời.

---

## 5. DI CHUYỂN CÓ TRỌNG LƯỢNG (TRAVEL AS MEANINGFUL MECHANIC)

### 5.1. Chi phí di chuyển thật (không còn tức thời vô hạn)
```
travelTimeGameDays = distance(from, to) / travelSpeed(travelType)
  travelType "walk" (mặc định): speed chuẩn
  travelType "ngự_khí" (cần Công Pháp/Thân Pháp phù hợp): speed ×3
  travelType "truyền_tống_trận": tức thời NHƯNG cần đã có Trạm Dịch/Fast Travel ở CẢ 2 đầu (mục 4.2)

Trong lúc di chuyển nhiều ngày: roll sự kiện dọc đường theo ĐÚNG cơ chế đã có
(RANDOM_EVENT_SYSTEM.md mục 1, trigger "moving_through"), nhưng giờ SỐ LẦN ROLL tỷ lệ với số ngày
di chuyển thực (đi càng xa càng nhiều cơ hội/rủi ro dọc đường, không phải 1 lần duy nhất bất kể xa
gần như hiện tại).
```

### 5.2. Fast Travel — mở dần, không có sẵn từ đầu
```
Điểm Fast Travel CHỈ tồn tại tại: node cốt truyện đã khám phá LẦN ĐẦU (tự động unlock), hoặc Trạm
Dịch do player/Faction xây (mục 4.2). Di chuyển bằng Fast Travel giữa 2 điểm đã unlock: tốn Linh
Thạch (không tốn ngày GameClock), KHÔNG roll sự kiện dọc đường (an toàn tuyệt đối, đó là cái giá
Linh Thạch phải trả) — tạo lựa chọn rõ ràng: đi bộ (rẻ, chậm, rủi ro/cơ hội) vs Fast Travel (đắt,
nhanh, an toàn).
```

### 5.3. Đoàn Đồng Hành Giảm Rủi Ro
Nếu có NPC "hộ tống" (thuê tại Phường Thị hoặc Faction cử theo nếu Cống Hiến đủ cao) đi cùng trong
chuyến di chuyển dài, giảm % sự kiện Quái Vật/Hắc Đạo dọc đường — chi phí thuê tỷ lệ với độ dài
quãng đường, tạo lựa chọn kinh tế thật (tự đi rẻ nhưng rủi ro, thuê hộ tống đắt nhưng an toàn hơn).

---

## 6. THẾ LỰC HIỆN DIỆN THẬT TRÊN BẢN ĐỒ (không chỉ là con số ẩn)

### 6.1. Đội Tuần Tra Di Động (Patrol Icons)
NPC lính/đệ tử tuần tra (đã có `scheduleType: patrol`) giờ hiển thị NGAY TRÊN BẢN ĐỒ LỚP 2 dưới dạng
1 icon nhỏ DI CHUYỂN DỌC EDGE giữa các node theo lịch trình thật (không phải chỉ xuất hiện khi
player tình cờ ở cùng node) — người chơi nhìn bản đồ thấy được "vùng này đang có bao nhiêu lính
tuần tra qua lại", tạo cảm giác lãnh thổ được BẢO VỆ THẬT chứ không phải nhãn dán.

### 6.2. Kiến Trúc Node Đổi Theo Chủ Sở Hữu
Node do Faction Chính Đạo sở hữu vs Hắc Đạo vs vô chủ có visualTag khác nhau (không cần chi tiết đồ
họa, chỉ cần field mô tả đổi: "Cổng Tông Môn uy nghiêm" vs "Trại lán xiêu vẹo của sơn tặc" vs "Tàn
tích hoang phế không người canh giữ") — đọc mô tả node là biết ngay tính chất khu vực.

### 6.3. Bảng Tin Faction (Bulletin Board) tại node Faction sở hữu
Hiện danh sách `faction_daily` quest hiện tại CỦA FACTION ĐÓ ngay khi player vào node (không cần
tìm NPC cụ thể mới thấy quest) — đồng thời hiện "Tin Tức Vùng" (world event gần đây liên quan
Faction này: thắng/thua trận nào, Bí Cảnh nào sắp mở) — biến node Faction thành điểm THÔNG TIN
trung tâm, không chỉ điểm giao dịch/nhiệm vụ.

---

## 7. SƯƠNG MÙ CHIẾN TRANH — 4 CẤP ĐỘ (thay vì chỉ discovered=true/false)

| Cấp | Tên | Điều kiện | Hiển thị |
|---|---|---|---|
| 0 | Chưa Biết | Chưa từng nghe nói | "Chưa khám phá" (như hiện tại) |
| 1 | Nghe Đồn | NPC tại node lân cận nhắc tới (qua hội thoại/Bảng Tin mục 6.3) NHƯNG chưa tới | Hiện TÊN node (không còn ẩn hoàn toàn) + mô tả mơ hồ 1 câu, vị trí gần đúng trên Lớp 1 nhưng KHÔNG hiện trên Lớp 2 grid chính xác |
| 2 | Đã Khám Phá | Đã từng tới | Đầy đủ như thiết kế gốc |
| 3 | Thông Thuộc | Tới >= 5 lần HOẶC có Trạm/Động Phủ tại đây | Mở thêm: nhìn thấy `subLocations` (Lớp 3) NGAY TỪ Lớp 2 không cần bấm vào, và thấy `influenceMap` chi tiết (không chỉ chủ sở hữu chính) |

Cấp 1 "Nghe Đồn" là bổ sung MỚI quan trọng — giải quyết cảm giác thế giới mở hiện tại "hoặc biết 100%
hoặc không biết gì" khá cứng, giờ có trạng thái trung gian tạo động lực THẬT SỰ muốn đi tới (đã
nghe tên, tò mò muốn xác nhận) thay vì random hoàn toàn mù mờ.

---

## 8. SCHEMA TỔNG HỢP (cập nhật `MapNode` đã có ở `MAP_SYSTEM.md` mục 1 và 6.7)

```
MapNode {
  ...(giữ nguyên toàn bộ field cũ: id, nodeType, regionTag, x, y, isProcedural, dangerLevel,
      linhKhiDensity, eventPoolTag, cooldownUntil, claimedByPlayerId)...

  fogState: 0-3,                          // thay thế `discovered: boolean` cũ (mục 7)
  influenceMap: { factionId: number },     // thay thế `ownerFactionId` tĩnh (mục 3.1) — ownerFactionId
                                            // giờ là GETTER tính từ influenceMap, không lưu trực tiếp
  subLocations: NodeDetailLayout | null,    // null nếu node quá nhỏ để cần Lớp 3 (mục 2)
  patrolSchedule: [{ npcId, fromNode, toNode, cycleHours }],  // mục 6.1
  playerStructures: [{ type, builtByCharacterId, builtAt }],   // mục 4.2
  fastTravelUnlocked: boolean,              // mục 5.2
}
```

---

## 10. HỆ THỐNG THỜI TIẾT (WEATHER SYSTEM) — TÍCH HỢP SÂU VÀO MỌI MỤC TRÊN

### 10.1. 6 Loại Thời Tiết (5 hệ Ngũ Hành + 1 loại horror riêng)

| Thời tiết | Hệ liên quan | Ảnh hưởng chính |
|---|---|---|
| **Quang Đãng** | Trung tính | Baseline, không modifier gì — trạng thái mặc định |
| **Vũ (Mưa)** | Thủy | Combat: +10% hiệu quả Công Pháp hệ Thủy, -10% hệ Hỏa. Di chuyển: speed ×0.8. `linhKhiDensity` +10% (mưa nuôi dưỡng linh khí) |
| **Sương Mù** | Trung tính (che khuất) | `fogState` khó tăng từ 0→1 hơn (mục 7, -30% cơ hội "Nghe Đồn" lan tới trong sương mù). Di chuyển: +15% cơ hội bị phục kích. Corruption Spread (MAP_SYSTEM.md 6.6): +10% tốc độ lan (sương che giấu Dị Biến đang lan) |
| **Bão Linh Khí** | Hỗn loạn | Combat: MỖI NGÀY random 1 hệ được +20%/1 hệ bị -20% (đổi mỗi ngày, không đoán trước được). Di chuyển: travelType "ngự_khí" bị VÔ HIỆU HÓA (quá nguy hiểm để phi hành). `linhKhiDensity` +30% NHƯNG Tẩu Hỏa Nhập Ma risk (PHAC_THAO_TU_VI_CON_DUONG_V3.md mục 3) +10% |
| **Tuyết** | Thổ/Kim | Combat: +10% hệ Thổ/Kim, -10% hệ Mộc. Di chuyển: speed ×0.6 (chậm nhất). Patrol Schedule (mục 6.1) TẠM DỪNG — lính tuần tra trú ẩn. `dangerLevel` hiệu lực -1 (quái vật cũng trú đông, nghịch lý AN TOÀN hơn) |
| **Âm Vũ** (hiếm, chỉ ban đêm GameClock HOẶC vùng Corruption cao) | Âm/Tà | Ambient Dread `WrongnessLevel` +2 bậc trong suốt thời gian hiệu lực. Corruption Spread tốc độ ×2. Tăng % Tà Thần "dòm ngó" (đã có ở WORLDVIEW_ATMOSPHERE.md mục 16). NGOẠI LỆ: Con Đường Âm Luật Đạo nhận +15% hiệu quả tu luyện trong Âm Vũ (đúng thiên hướng) |

### 10.2. Thuật Toán Sinh Thời Tiết (lan truyền như mặt trận, không random độc lập từng vùng)
```
Mỗi worldTick (1 ngày game), với MỖI Vùng (regionTag):
  baseWeights = seasonalWeightTable[currentSeason][regionTag]   // đã có khung ở mục J.3
                                                                  // (PHAC_THAO_TINH_NANG_MOI_V2.md)
  neighborBias = với mỗi Vùng LÂN CẬN (kề trên bản đồ Lớp 1):
      nếu neighborWeather == "bao_linh_khi" hoặc "am_vu" -> +20% cơ hội Vùng này CŨNG chuyển sang
      loại đó trong 1-3 ngày tới (mô phỏng "mặt trận thời tiết" lan tỏa, không phải mỗi ô random
      độc lập — tạo cảm giác thời tiết THẬT có tính liên tục trên bản đồ)
  finalWeather = roll theo (baseWeights + neighborBias)
  Nếu finalWeather ĐỔI so với hôm qua -> ghi 1 dòng Story Panel tự động cho player đang ở vùng đó
  ("Trời bắt đầu đổ mưa." / "Sương mù dày đặc bao trùm.")
```

### 10.3. Dự Báo Thời Tiết (nối vào Xem Quẻ đã phác thảo — mục J.1)
NPC "Toán Mệnh Sư" có thể dự báo thời tiết 1-3 ngày tới — độ chính xác = f(Aptitude của NPC đó), có
thể SAI (không phải Oracle hoàn hảo, đúng tinh thần Unreliable Narrator) — dùng để lên kế hoạch: né
Bão Linh Khí trước khi Đột Phá (tránh Tẩu Hỏa Nhập Ma cộng dồn), hoặc tận dụng Âm Vũ nếu đi Âm Luật
Đạo.

### 10.4. Thời Tiết × Faction War (mục 2.2 ở `WORLD_INTERCONNECTION_SYSTEM.md`)
```
Nếu Tuyết hoặc Bão Linh Khí cường độ >= 4 tại vùng đang Chiến Tranh:
  -> "Đình Chiến Tạm Thời" — server KHÔNG giải quyết trận nào tại vùng đó cho tới khi thời tiết dịu
     (quân đội 2 bên đều không thể hành quân) — tạo nhịp nghỉ tự nhiên cho các cuộc chiến kéo dài,
     tránh chiến tranh gõ liên tục không ngừng nghỉ.
```

### 10.5. Thời Tiết × NPC (mục 3.1 `WORLD_INTERCONNECTION_SYSTEM.md` — NPC lịch trình)
```
Khi thời tiết cường độ >= 3 (bất kỳ loại xấu nào): NPC `scheduleType: itinerant` TẠM DỪNG di chuyển
tự do, thay vào đó di chuyển tới node Faction gần nhất để "trú ẩn" — tạo hiện tượng NHIỀU NPC dồn
về CÙNG 1 node trong thời gian xấu trời, tăng khả năng player chứng kiến tương tác NPC-NPC (mục 3.2
đã thiết kế) chỉ vì cùng tránh bão tại 1 chỗ — thời tiết trở thành CHẤT XÚC TÁC xã hội, không chỉ
cản trở.
```

### 10.6. Hiển Thị Thời Tiết Trên Bản Đồ
- Lớp 1 (World Map): overlay animation nhẹ theo Vùng (mưa/tuyết/sương phủ lên toàn Vùng đang chịu
  ảnh hưởng), có thể thấy "mặt trận" thời tiết đang di chuyển qua các Vùng lân cận theo mục 10.2.
- Lớp 2 (node cụ thể): icon nhỏ góc node phản ánh thời tiết Vùng đang áp dụng.
- Node Detail (Lớp 3, mục 2): nếu `subLocation.type == "outdoor"` (chợ ngoài trời, cổng...), mô tả
  tự động thêm 1 câu theo thời tiết hiện tại; `subLocation.type == "indoor"` (sảnh chính, kho) KHÔNG
  bị ảnh hưởng mô tả — tạo lý do cơ học để chọn subLocation trong nhà lúc trời xấu.

### 10.7. Thời Tiết Là Nguồn Thiên Tai Thường (nối L.1 đã phác thảo)
```
Nếu Bão Linh Khí duy trì cường độ 5 liên tục >= 3 ngày tại 1 Vùng -> tự động trigger 1 "Thiên Tai
Thường" (L.1, PHAC_THAO_TINH_NANG_MOI_V2.md) tại 1 node ngẫu nhiên trong Vùng đó — không phải sự
kiện độc lập nữa mà là HỆ QUẢ TỰ NHIÊN của thời tiết cực đoan kéo dài, logic nhân-quả rõ ràng thay
vì random vô căn cứ.
```

---

## 11. LÀM RÕ THÊM CHI TIẾT CÁC MỤC TRƯỚC (theo yêu cầu "càng chi tiết càng tốt")

### 11.1. Công thức `faction.power` đầy đủ (dùng trong mục 3.1 và Faction War)
```
faction.power = (Cảnh Giới cao nhất trong Faction × 10)
              + (Quy Mô đã có ở Xianxin_map.md 5.1 × 5)
              + (Tổng Tài Nguyên: Linh Thạch+Linh Mạch+Đan Dược+Pháp Bảo, mỗi loại × 0.5)
              + (số node đang sở hữu thực tế theo influenceMap × 3)
              - (nếu có trait "Đang suy tàn": ×0.7 toàn bộ power)
              + (nếu có trait "Đang trỗi dậy": ×1.3 toàn bộ power)
              × (0.5 nếu đang chịu Đình Chiến do thời tiết mục 10.4 — quân lực không phát huy được)
```

### 11.2. Bảng số lượng/loại `subLocations` theo `nodeType` (mục 2)
| nodeType | Số subLocations | Loại điển hình |
|---|---|---|
| `tong_mon` (lớn) | 6-8 | Sảnh Chính(indoor), Chợ Nội Môn(outdoor), Hẻm Sau(outdoor), Kho Tàng Trữ(indoor), Đài Luyện Công(outdoor), Thư Viện(indoor) |
| `thanh_tran` | 3-5 | Chợ(outdoor), Quán Trọ(indoor), Cổng Thành(outdoor) |
| `dong_phu`/Trạm player | 1-2 | Chính Điện(indoor), Sân Ngoài(outdoor) |
| `hoang_da`/`cam_dia` | 0 | Không có Lớp 3 — quá hoang vu để chia điểm nhỏ, giữ nguyên trải nghiệm Lớp 2 thuần |
| `nga_re` | 1 | Điểm Quan Sát(outdoor) — chỉ đủ cho action Scout đã có |

### 11.3. Bảng tốc độ di chuyển đầy đủ (mục 5.1, cộng dồn với modifier thời tiết mục 10.1)
| travelType | Speed nền | Speed thực tế khi Vũ/Tuyết/Bão |
|---|---|---|
| walk | 1.0x | Vũ: 0.8x / Tuyết: 0.6x / Bão: 1.0x (không bị ảnh hưởng, đi bộ vẫn được) |
| ngự_khí | 3.0x | Vũ: 2.4x / Tuyết: 1.8x / Bão: **VÔ HIỆU HÓA hoàn toàn** (mục 10.1) |
| truyền_tống_trận | tức thời | Không bị ảnh hưởng bởi bất kỳ thời tiết nào (trận pháp không phụ thuộc môi trường) |

---

## 12. VIỆC CẦN LÀM TIẾP (đã gộp thêm phần Thời Tiết vào thứ tự ưu tiên cũ)
1. **Làm trước tiên:** mục 3.1 (influence gradient) — không đổi so với bản trước.
2. **Làm thứ hai:** mục 7 (4 cấp sương mù) + mục 10.1-10.2 (thời tiết cơ bản, CHƯA cần tích hợp
   Faction/NPC ngay) — 2 mục này độc lập tương đối, có thể làm song song.
3. **Làm thứ ba:** mục 2 (Lớp 3) + bảng 11.2 cụ thể.
4. **Làm thứ tư:** tích hợp Thời Tiết sâu (mục 10.4-10.7 — Đình Chiến/NPC trú ẩn/Thiên Tai) — CẦN
   mục 2 (Faction War) và mục 3 (NPC schedule) đã chạy ổn định trước, vì đây là lớp NỐI thêm vào hệ
   đã có, không phải hệ độc lập.
5. **Làm sau cùng:** mục 4-5 (Player Map Agency, Fast Travel) như bản trước.
6. Câu hỏi multiplayer vẫn treo — giờ ẢNH HƯỞNG THÊM tới thời tiết: thời tiết nên là SERVER-WIDE
   dùng chung (mọi người trong 1 Vùng thấy cùng thời tiết) hay mỗi người chơi có thời tiết riêng?
   Khuyến nghị: server-wide hợp lý hơn nhiều vì thời tiết vốn là hiện tượng KHÔNG GIAN chung, tách
   riêng theo từng người sẽ phá vỡ logic "mặt trận thời tiết lan truyền" ở mục 10.2.
---

## IMPLEMENTATION UPDATE 2026-09-16 — WIRED RUNTIME

Đã nối runtime Map V2 qua mapInfluenceSnapshot, mapFogState, mapCompletion, appendNodeHistory, nodeResonance, mapNode, moveWithinNode, travelPlan, buildMapStructure, claimOutpost, petitionOutpostToFaction và updateTradeRoutes. ownerFactionId được suy ra từ influence gradient; fog, completion, history, sub-location và travel weighting dùng resolver chung.

Đã áp dụng lớp hiển thị Cosmic Constellation cho World Map: sao vùng thay cho card vùng, đường nối mờ như chòm sao, nhãn theo mức quan sát, trạng thái vùng hiện tại/biến cố, zoom/reset, wheel zoom và kéo camera. Local Map dùng fog 0–3: chưa biết, nghe đồn, đã khám phá, thông thuộc.

Hai công trình canonical teleport_array và world_ward được alias tương thích với waystation và ward_formation; tab Thế giới gọi command xây dựng duy nhất.
