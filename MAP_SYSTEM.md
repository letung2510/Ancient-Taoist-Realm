# HỆ THỐNG BẢN ĐỒ (MAP SYSTEM) — NODE-GRAPH MỞ RỘNG
> Đặc tả riêng cho Map + Action tại Map — dùng chung với `Xianxin_map.md` (thế giới/vùng/thế lực),
> `NPC_MONSTER_SYSTEM.md` (14 lớp thực thể), `ACTION_HYBRID_SYSTEM.md` (action bar theo ngữ cảnh).
> File này giải quyết đúng vấn đề: bản đồ hiện tại (dạng node-graph, xem ảnh mẫu: Sơn Môn Thiên
> Huyền Tông → Vạn Phong Điện/Truyền Pháp Các/Linh Dược Viện + các node "Chưa khám phá") chỉ có
> Di Chuyển + Nói Chuyện — quá nghèo thao tác.

---

## 1. MÔ HÌNH DỮ LIỆU NỀN: NODE-GRAPH + FOG OF WAR

Bản đồ là 1 đồ thị vô hướng: `nodes[]` (địa điểm) + `edges[]` (đường nối giữa 2 node). Node có 2
trạng thái hiển thị: **Đã khám phá** (hiện tên thật, viền màu theo loại) và **Chưa khám phá** (hiện
"Chưa khám phá", viền xám mờ, vị trí có thể xê dịch nhẹ ngẫu nhiên trên UI để tạo cảm giác mù mờ).

```
MapNode {
  id: string
  name: string | null              // null nếu chưa khám phá
  nodeType: "tong_mon" | "thanh_tran" | "hoang_da" | "cam_dia" | "dong_phu" | "bi_canh" |
            "di_tich" | "vuong_kinh" | "hai_vuc_khong_vuc" | "nga_re" | "then_chot_cot_truyen"
  regionTag: "linh_vuc" | "hoang_da" | "bien_thanh" | "cam_dia" | "vuong_kinh" | "hai_vuc_khong_vuc"
             // dùng ĐÚNG 6 loại vùng đã định nghĩa ở Xianxin_map.md mục 1.1
  discovered: boolean
  dangerLevel: 1-5                  // ảnh hưởng độ mạnh Quái/NPC roll ra khi Explore node này
  linhKhiDensity: 1-5               // ảnh hưởng tốc độ tu luyện khi dừng lại node này
  ownerFactionId: string | null     // null nếu vô chủ, ngược lại trỏ tới Faction (Xianxin_map.md 5.1)
  availableActions: string[]        // xem mục 3, tính động theo nodeType + discovered + trạng thái nhân vật
  eventPoolTag: string              // trỏ tới bảng trọng số sự kiện tương ứng trong RANDOM_EVENT_SYSTEM.md
  cooldownUntil: timestamp | null   // node vừa bị "vét cạn" sự kiện, tạm khóa random event 1 thời gian
  claimedByPlayerId: string | null  // CHỈ áp dụng nodeType "dong_phu" sau khi player chinh phục (mục 5.2 file event)
}

MapEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  travelType: "walk" | "ngự_khí" | "truyền_tống_trận" | "thuyền_hải_vực"
  travelTimeSeconds: number         // ảnh hưởng số lần roll sự kiện dọc đường (mục 2)
  revealsOnArrival: string[]        // danh sách node ẨN sẽ lộ ra (chuyển discovered=false->true) khi
                                     // nhân vật ĐẾN được 1 đầu của cạnh này — đây là cơ chế "mở rộng
                                     // bản đồ" chính, thay vì random toàn bản đồ ngay từ đầu
}
```

---

## 2. CƠ CHẾ MỞ RỘNG BẢN ĐỒ (KHÁM PHÁ DẦN, KHÔNG LỘ HẾT NGAY)

Đúng như ảnh mẫu — nhiều node "Chưa khám phá" nối bằng nét đứt tới các node đã biết. Quy tắc:

1. Khi nhân vật **đến** 1 node đã khám phá, hệ thống duyệt toàn bộ `edges` có `fromNodeId`/`toNodeId`
   trỏ tới node đó → với mỗi node ĐẦU KIA còn `discovered=false`, có % cơ hội lộ ra (không phải lộ
   100% ngay, tạo cảm giác thăm dò dần):
   ```
   RevealChance = 40% + (10% × số lần đã Explore tại node hiện tại) + bonus theo nodeType
                  (VD node "nga_re" — Ngã Rẽ — luôn +30% vì bản chất là điểm giao lộ nhiều đường)
   ```
2. Khi 1 node được lộ ra (`discovered = true` lần đầu), random ngay 1 **Sự Kiện Khám Phá Đầu Tiên**
   (xem file `RANDOM_EVENT_SYSTEM.md` mục 3) — luôn có ít nhất 1 sự kiện, không để node trống trơn
   ngay lần đầu ghé thăm (tạo động lực đi khám phá).
3. Số node "Chưa khám phá" xung quanh 1 node LUÔN được giữ tối thiểu 2-4 (nếu tụt xuống dưới 2 do
   đã khám phá hết, hệ thống tự sinh thêm node mới ngẫu nhiên nối vào — bản đồ "vô hạn mở rộng" ra
   biên, không có giới hạn cứng, đúng tinh thần thế giới mở đã định nghĩa ở `Xianxin_map.md`).

---

## 3. MAP ACTION SYSTEM — MỞ RỘNG NGOÀI DI CHUYỂN/NÓI CHUYỆN

Áp dụng đúng nguyên tắc `ACTION_HYBRID_SYSTEM.md`: action bar tính ĐỘNG theo `context_state` (ở
đây là node hiện tại + trạng thái nhân vật), không hardcode chỉ 2 nút Move/Talk.

| Action | Điều kiện xuất hiện | Hiệu ứng |
|---|---|---|
| **Di Chuyển** | Luôn có (nếu có edge tới node khác đã khám phá) | Di chuyển, có thể roll sự kiện dọc đường (mục 2 file event) |
| **Nói Chuyện** | Node có NPC đang đứng | Vào `DIALOGUE_FLOW` (NPC_MONSTER_SYSTEM.md mục 3) |
| **Khám Phá (Explore)** | Node có `discovered=true` nhưng chưa "vét cạn" sự kiện | Roll 1 sự kiện ngẫu nhiên tại chỗ (NPC/Quái/Cơ Duyên/Động Phủ — file event), có cooldown sau khi dùng |
| **Điều Tra (Investigate)** | Node có Đặc Sắc dạng bí ẩn (VD "Nội bộ lục đục", di tích) | Hé lộ 1 phần lore/manh mối, có thể mở khóa quest ẩn |
| **Thu Thập (Gather)** | Node loại `hoang_da`/`cam_dia`, `linhKhiDensity >= 3` | Thu Linh Thảo/nguyên liệu, roll theo bảng tài nguyên vùng |
| **Đả Tọa Tu Luyện** | Bất kỳ node an toàn (`dangerLevel <= 2`) | Tăng tốc EXP tạm thời theo `linhKhiDensity` của node, đứng yên trong X phút |
| **Cắm Trại/Nghỉ Ngơi** | Bất kỳ node `dangerLevel <= 2` | Hồi SAN/HP, KHÔNG roll sự kiện trong thời gian nghỉ (an toàn) |
| **Chinh Phục Động Phủ** | Node loại `dong_phu`, chưa có `claimedByPlayerId` | Trigger chuỗi thử thách (file event mục 5) để chiếm làm căn cứ riêng |
| **Giao Dịch** | Node có NPC Thương Nhân | Vào luồng Giao Dịch (NPC_MONSTER_SYSTEM.md mục 5.1) |
| **Xin Gia Nhập/Rời Khỏi** | Node loại `tong_mon`, có `ownerFactionId` | Quest Đạo Lộ / thoát ly tông môn (đã có ở hệ thống khởi tạo nhân vật) |
| **Bố Trận Phòng Thủ** | Chỉ tại Động Phủ đã chiếm (`claimedByPlayerId == mình`) | Đặt Trận Pháp bảo vệ căn cứ (dùng Công Pháp loại `tran_phap`) |
| **Nhìn Toàn Cảnh (Scout)** | Node loại `nga_re`/độ cao | Hé lộ thêm 1-2 node ẩn xung quanh NGAY LẬP TỨC không cần đợi roll % (mục 2) |

> Số action hiển thị mỗi lúc nên giới hạn 4-6 nút chính (theo đúng khuyến nghị UI ở
> `ACTION_HYBRID_SYSTEM.md` mục 7) — action hiếm dùng (Bố Trận, Xin Gia Nhập...) có thể gộp vào 1
> nút "Thêm ▾" phụ.

---

## 4. VÍ DỤ DỮ LIỆU NODE THEO ĐÚNG ẢNH MẪU

```json
{
  "id": "node_thien_huyen_tong",
  "name": "Sơn Môn Thiên Huyền Tông",
  "nodeType": "tong_mon",
  "regionTag": "linh_vuc",
  "discovered": true,
  "dangerLevel": 1,
  "linhKhiDensity": 4,
  "ownerFactionId": "faction_thien_huyen_tong",
  "availableActions": ["di_chuyen", "noi_chuyen", "dam_toa_tu_luyen", "giao_dich", "xin_gia_nhap"],
  "eventPoolTag": "tong_mon_an_toan",
  "cooldownUntil": null,
  "claimedByPlayerId": null
}
```
```json
{
  "id": "node_van_phong_dien",
  "name": "Vạn Phong Điện",
  "nodeType": "then_chot_cot_truyen",
  "regionTag": "linh_vuc",
  "discovered": true,
  "dangerLevel": 2,
  "linhKhiDensity": 3,
  "ownerFactionId": "faction_thien_huyen_tong",
  "availableActions": ["di_chuyen", "noi_chuyen", "dieu_tra"],
  "eventPoolTag": "co_dinh_cot_truyen",
  "cooldownUntil": null,
  "claimedByPlayerId": null
}
```
```json
{
  "id": "node_unknown_north_1",
  "name": null,
  "nodeType": null,
  "regionTag": "linh_vuc",
  "discovered": false,
  "dangerLevel": null,
  "linhKhiDensity": null,
  "ownerFactionId": null,
  "availableActions": [],
  "eventPoolTag": null,
  "cooldownUntil": null,
  "claimedByPlayerId": null
}
```
> Node chưa khám phá KHÔNG lộ `nodeType`/`dangerLevel` thật — các field này chỉ được roll và gán
> giá trị thật ĐÚNG THỜI ĐIỂM `discovered` chuyển thành `true` (tránh client đọc trộm dữ liệu ẩn
> qua DevTools/network tab trước khi khám phá).

---

## 5. TÍCH HỢP VỚI RANDOM EVENT SYSTEM

Mọi hành động **Di Chuyển** (dọc đường), **Khám Phá**, và **lần đầu một node được lộ ra** (mục 2)
đều gọi sang bảng sự kiện chi tiết ở file `RANDOM_EVENT_SYSTEM.md` — file đó định nghĩa ĐẦY ĐỦ 4
nhóm sự kiện (NPC/Quái/Cơ Duyên/Động Phủ), bảng trọng số theo vùng, và cấu trúc dữ liệu Event.
Map System chỉ chịu trách nhiệm "GỌI ĐÚNG LÚC, ĐÚNG NGỮ CẢNH" (`eventPoolTag` của node quyết định
dùng bảng trọng số nào), KHÔNG tự định nghĩa lại nội dung sự kiện ở đây (tránh trùng lặp 2 nguồn).

---

## 6. NÂNG CẤP: THẾ GIỚI MỞ VÔ HẠN (PROCEDURAL GRID-BASED GENERATION)

Nâng cấp này giữ NGUYÊN toàn bộ schema `MapNode`/`MapEdge` và UI node-graph đã có (mục 1-5) — chỉ
đổi CÁCH node được TẠO RA: thay vì random % lộ dần từ 1 tập node dựng sẵn hữu hạn, node được **sinh
mới ngay khi cần** (lazy generation) khi người chơi bấm hành động theo HƯỚNG, trên 1 lưới tọa độ
vô hạn — đúng ý "đi Nam/đi Bắc thì tạo node mới nối tiếp vào bản đồ".

### 6.1 Hệ tọa độ + Action theo hướng
Mỗi node giờ có thêm tọa độ nguyên `(x, y)` trên lưới vô hạn. Node cụm ban đầu (Sơn Môn Thiên Huyền
Tông, Vạn Phong Điện... như ảnh mẫu) được đặt cố định quanh gốc `(0, 0)` — coi là "Vùng Khởi Nguyên"
đã dựng sẵn tay, KHÔNG sinh procedural. Mọi ô lưới ngoài vùng này đều sinh động.

Thay/bổ sung action "Di Chuyển" (mục 3) bằng 4 action theo hướng, LUÔN hiển thị khi đang ở 1 node
thuộc lưới mở (không hiển thị nếu node hiện tại là node cốt truyện cố định không cho tự do đi hướng):
```
"di_bac"  -> target = (x, y+1)
"di_nam"  -> target = (x, y-1)
"di_dong" -> target = (x+1, y)
"di_tay"  -> target = (x-1, y)
```
> Có thể mở rộng thêm 4 hướng chéo (Đông Bắc/Tây Bắc/Đông Nam/Tây Nam) nếu muốn lưới mịn hơn — cùng
> 1 cơ chế, chỉ thêm 4 delta tọa độ.

### 6.2 Luồng xử lý khi bấm 1 hướng đi
```
[Player bấm "Đi Bắc" tại node (x, y)]
        │
        ▼
   target = (x, y+1) — đã tồn tại trong DB (đã từng sinh trước đó)?
      ├── CÓ  -> di chuyển thẳng tới node đã lưu, roll sự kiện "moving_through" như bình thường
      │          (RANDOM_EVENT_SYSTEM.md mục 1)
      └── CHƯA -> gọi generateNodeAt(x, y+1) (mục 6.3) để SINH MỚI từ data, LƯU VĨNH VIỄN vào DB,
                  rồi coi node vừa sinh là 1 lần "first_discovery" (100% có sự kiện, đúng mục 2 cũ)
        │
        ▼
[Tự động tạo/khớp MapEdge giữa (x,y) và (x,y+1) — với lưới vuông, edge LUÔN ngầm định tồn tại giữa
 2 ô liền kề, không cần author tay từng cạnh như node-graph cũ]
```

### 6.3 Thuật toán sinh node MỚI TỪ DATA (deterministic, không sinh bừa)
```
generateNodeAt(x, y):
  seed = hash(WORLD_SEED, x, y)          // deterministic: cùng tọa độ luôn ra cùng kết quả nếu
                                           // chưa từng bị thay đổi bởi hành động người chơi (chiếm
                                           // Động Phủ, phe phái sụp đổ...)
  regionTag = resolveRegionTag(x, y)      // mục 6.4
  nodeType  = rollNodeType(regionTag, seed)   // dùng lại bảng trọng số Faction Types đã có ở
                                                // Xianxin_map.md mục 4-5 (Tông Môn/Thế Gia/Vương
                                                // Triều/Tán Tu/Hắc Đạo/Thế Lực Ẩn theo đúng trọng
                                                // số vùng mục 5.3 của file đó)
  node = buildNodeFromTemplate(nodeType, regionTag, seed)   // roll tên, dangerLevel, linhKhiDensity,
                                                              // ownerFactionId (nếu là Tông Môn/Thế
                                                              // Gia, sinh luôn 1 Faction mới theo
                                                              // schema Faction đã có)
  PERSIST node vào DB vĩnh viễn (KHÔNG sinh lại lần sau, kể cả khi player khác đi qua cùng tọa độ —
  thế giới dùng CHUNG 1 bản đồ persistent, không phải mỗi người 1 bản riêng)
  return node
```
> "Từ data" nghĩa là: KHÔNG tự bịa nội dung ngẫu nhiên vô căn cứ — mọi bước roll ở trên đều tra lại
> đúng các bảng đã build sẵn (Faction Types, Race Weight, Region Weight — `Xianxin_map.md`; NPC/Quái
> — `NPC_MONSTER_SYSTEM.md`; Event Pool — `RANDOM_EVENT_SYSTEM.md`). Generation chỉ là "gọi đúng bảng
> đúng lúc", không phải hệ thống nội dung riêng biệt.

### 6.4 Phân bố Vùng (regionTag) trên lưới — kết hợp Vòng Khoảng Cách + Nhiễu (Noise)
```
distanceFromOrigin = |x| + |y|   // hoặc sqrt(x²+y²) nếu muốn vòng tròn thay vì hình thoi

// Bước 1: xác định "vòng an toàn" theo khoảng cách (world design chuẩn open-world: gần nhà an
// toàn, càng xa càng nguy hiểm — tạo động lực dịch chuyển ra xa dần theo sức mạnh nhân vật)
if distanceFromOrigin <= 5:    baseDanger = 1-2   // quanh Vùng Khởi Nguyên: Vương Kinh/Linh Vực
if distanceFromOrigin <= 15:   baseDanger = 2-3   // Biên Thành/Hoang Dã
if distanceFromOrigin <= 30:   baseDanger = 3-4   // Hoang Dã sâu/Hải Vực-Không Vực
if distanceFromOrigin > 30:    baseDanger = 4-5   // Cấm Địa dày đặc

// Bước 2: nhiễu Perlin/Simplex 2D theo (x,y) để phá vỡ tính đối xứng thuần vòng tròn (tránh bản đồ
// nhàm chán kiểu "cứ đi xa là y hệt nhau"), cho phép 1 túi Cấm Địa xuất hiện lệch gần origin hoặc
// ngược lại — CHỈ dùng để CHỌN regionTag cụ thể trong dải baseDanger đã xác định, không phá vỡ
// hẳn quy luật an toàn gần/nguy hiểm xa ở bước 1:
noiseValue = simplexNoise2D(x * 0.05, y * 0.05, WORLD_SEED)   // scale 0.05 quyết định độ "to" của
                                                                 // từng túi vùng, chỉnh theo nhu cầu
regionTag = mapNoiseToRegionTag(noiseValue, baseDanger)   // tra bảng trọng số vùng theo dải danger
```

### 6.5 Cụm Tông Môn → Thành Trấn vệ tinh ("nối tiếp thành trấn")
Đúng yêu cầu — khi 1 node sinh ra là `nodeType: "tong_mon"` hoặc `"the_gia"`, hệ thống PRE-RESERVE
(đặt trước, chưa sinh chi tiết) 2-4 ô liền kề xung quanh làm "cụm vệ tinh" thuộc cùng thế lực đó:
```
onGenerateFaction(node, faction):
  neighborCells = 2-4 ô random trong bán kính 1-2 ô quanh (node.x, node.y)
  với mỗi ô đó:
    reserve nodeType theo danh sách: ["thanh_tran" (chợ/thị trấn phụ thuộc),
                                       "bien_thanh" (khu ngoại vi tán tu quanh tông môn),
                                       "hoang_da" (đất săn luyện của đệ tử ngoại môn)]
    gán sẵn ownerFactionId = faction.id cho các ô "thanh_tran" (thành trấn PHỤ THUỘC tông môn này)
  // Các ô này CHƯA sinh chi tiết đầy đủ ngay — chỉ "khóa trước loại + chủ sở hữu", nội dung cụ thể
  // (tên, NPC, action) vẫn chờ tới khi player thật sự đi hướng đó tới mới generateNodeAt() đầy đủ
```
→ Kết quả: người chơi đi về hướng 1 Tông Môn sẽ tự nhiên gặp 1-2 thành trấn/khu vệ tinh THUỘC tông
môn đó TRƯỚC khi chạm sơn môn chính — đúng cảm giác "thế giới có tổ chức" thay vì các node rời rạc
vô nghĩa nối với nhau.

### 6.6 Node cốt truyện cố định (không procedural) chồng lên lưới
Các địa điểm cốt truyện quan trọng (`nodeType: "then_chot_cot_truyen"`, ví dụ Vạn Phong Điện) vẫn
được đặt TAY tại tọa độ cố định cụ thể (không dùng `generateNodeAt`), đảm bảo luôn xuất hiện đúng vị
trí thiết kế dù thế giới sinh procedural. Khi `generateNodeAt(x,y)` được gọi mà tọa độ đó trùng với
1 vị trí cốt truyện đã định trước, ưu tiên trả về node cốt truyện đã author tay thay vì random.

### 6.7 Bổ sung field cho `MapNode` (mục 1)
```
MapNode {
  ...(giữ nguyên toàn bộ field cũ)...
  x: integer
  y: integer
  isProcedural: boolean       // false cho Vùng Khởi Nguyên + node cốt truyện author tay
  generatedAtTimestamp: timestamp | null
  reservedNodeType: string | null   // dùng cho cơ chế pre-reserve mục 6.5, null sau khi đã generate đầy đủ
}
```

### 6.8 Việc cần làm tiếp riêng cho mục 6
1. Chọn thư viện/thuật toán noise cụ thể (Simplex/Perlin) và tune giá trị scale (0.05 chỉ là gợi ý
   khởi điểm) bằng cách sinh thử và visualize bản đồ trước khi gắn vào game thật.
2. Quyết định bán kính "Vùng Khởi Nguyên" chính xác (gợi ý ở trên là distanceFromOrigin <= 5, có
   thể điều chỉnh theo số node đã author tay thật sự).
3. Viết migration: các node/edge hiện có (author tay) cần được gán tọa độ `(x,y)` cụ thể để tích
   hợp vào lưới mới mà không bị xung đột vị trí.
4. Quyết định thế giới dùng CHUNG 1 bản đồ persistent cho mọi người chơi (multiplayer shared world)
   hay MỖI người chơi 1 bản đồ procedural riêng (mỗi người 1 `WORLD_SEED` khác nhau) — ảnh hưởng
   trực tiếp thiết kế PvP chiếm Động Phủ ở `RANDOM_EVENT_SYSTEM.md` mục 6.2.

---

## 7. VIỆC CẦN LÀM TIẾP (chưa code, đang chờ xác nhận)

1. Viết `revealAdjacentNodes(currentNodeId)` — xử lý mục 2 (roll % lộ node lân cận + tự sinh node
   mới nếu số node ẩn xung quanh tụt dưới ngưỡng tối thiểu).
2. Viết `getAvailableMapActions(node, character)` — tính động danh sách action theo mục 3, dùng
   chung pattern Context Resolver đã có ở `ACTION_HYBRID_SYSTEM.md`.
3. Thiết kế UI cho node "Ngã Rẽ" (nga_re) — vì đây là loại node đặc biệt luôn có action "Nhìn Toàn
   Cảnh" và bonus reveal cao hơn, cần icon/viền riêng để người chơi nhận biết ngay trên bản đồ.
4. Quyết định: Động Phủ đã bị player khác chiếm thì có hiển thị khác gì với Động Phủ vô chủ không
   (màu viền khác, action "Tấn Công Chiếm Đoạt" thay vì "Chinh Phục")?
## Trạng thái triển khai trong engine

### 8. Open World Runtime đã áp dụng

Engine hiện vận hành bản đồ như một đồ thị mở vô hạn thay vì danh sách địa điểm đóng:

- Mỗi save có `openWorld.coordinates` và `openWorld.nodes`; node sinh ra được lưu lại, không roll lại khi quay về hoặc nạp save.
- Bốn hướng Bắc/Nam/Đông/Tây luôn là cạnh tiềm năng. Nếu node tĩnh không có lối đi, engine lazy-generate node mới tại tọa độ kế bên và tự nối cạnh ngược.
- Node procedural dùng hash tọa độ để tạo kết quả ổn định: vùng, cấp nguy hiểm, mật độ linh khí, tà nhiễm, quái và tài nguyên. Cùng một tọa độ luôn cho cùng một địa điểm trong cùng thế giới.
- Khoảng cách từ vùng khởi nguyên điều khiển độ nguy hiểm; các vùng Đông Hoang, Nam Chướng, Tây Mạc, Bắc Nguyên, Vô Tận Hải, Thiên Không Vực và U Minh Giới đan xen theo các vành sinh thái.
- Node mới có mô tả, lối quay về, tài nguyên và quái phù hợp, nên mọi hướng di chuyển đều mở rộng thành mạng lưới liên thông thay vì ngõ cụt giả.
- `visitedLocations` tiếp tục làm fog-of-war cho người chơi; `openWorld.nodes` là dữ liệu đã biết, còn node chưa đi tới không bị lộ nội dung.
- Hư Thiên Đỉnh, sự kiện ngẫu nhiên, chiến đấu và tu luyện dùng chung `locationId`, vì vậy node procedural hoạt động như node authored và không cần nhánh logic riêng.

### 9. Nguyên tắc thiết kế thế giới mở

1. **Liên thông trước, nội dung sau:** mọi node phải có ít nhất một cạnh quay lại; vùng biên được mở lazy thay vì khóa bản đồ.
2. **Tính liên tục:** tọa độ, vùng và nguy cơ quyết định cảm giác hành trình; di chuyển xa tăng giá phải trả nhưng không chặn khám phá tuyệt đối.
3. **Điểm neo:** node tĩnh (tông môn, thành trấn, di tích, cấm địa) là landmark; node procedural tạo khoảng thở, đường tắt, tài nguyên và bí mật nối giữa landmark.
4. **Thông tin theo lớp:** bản đồ chỉ hiển thị tên thật sau khi đến; trước đó chỉ có hướng, khoảng cách ước lượng và dấu hiệu khí tượng.
5. **Thế giới sống:** mỗi node có cooldown sự kiện, trạng thái chiếm cứ, dấu vết người chơi và biến động tà nhiễm; quay lại một nơi không đồng nghĩa trải nghiệm lặp lại.
6. **Không sinh bừa:** seed tọa độ phải quyết định kết quả; thay đổi do người chơi (chiếm động phủ, thanh tẩy, phá hủy) ghi đè lên node đã lưu.

- `WORLD_MAP`, `LOCATIONS`, `startRegionEligibility()` và `guildEligibility()` là nguồn dữ liệu/luật đang chạy trong `data/data.js` và `js/engine.js`.
- Vùng có ngưỡng Tông Môn từ cấp 3 (Đông Hoang, Vô Tận Hải) không ép nhân vật gia nhập ngay: UI hiển thị lộ trình Tán Tu, điều kiện Cảnh giới/Hiệu Mệnh và tự mở thế lực khi đủ chuẩn.
- Di chuyển gọi `move()` và `maybeTriggerRandomEncounter()`; mọi thay đổi state đều được lưu qua `serialize()`.
- Action an toàn tại địa điểm có Tà Nhiễm thấp gồm Tự Luyện, Bế Quan Tu Luyện và Nghỉ Ngơi; không cho bế quan trong chiến đấu hoặc vùng nguy hiểm.
