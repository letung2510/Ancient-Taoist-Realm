# HỆ THỐNG ACTION HYBRID (CONTEXTUAL BUTTONS + FREE-TEXT INPUT)
> Giải quyết vấn đề: người chơi phải gõ nguyên câu ("tu luyện", "tôi muốn...") mỗi lượt — rất phiền trên web/mobile. Giải pháp: **nút bấm hiện theo ngữ cảnh làm chính, ô gõ tự do vẫn luôn có sẵn** cho trường hợp đặc biệt hoặc người thích gõ.

---

## 1. NGUYÊN TẮC THIẾT KẾ

1. **80/20:** ~80% hành động lặp lại (tu luyện, tấn công, nói chuyện, rời đi, nhận quest...) → PHẢI có nút bấm sẵn, không ép gõ.
2. **Ô gõ tự do KHÔNG BAO GIỜ biến mất** — luôn nằm dưới cùng màn hình, dùng cho: đặt tên, nhập số lượng, roleplay tự do, câu hỏi mở với NPC, hoặc gõ tắt nếu người chơi nhớ lệnh và muốn nhanh hơn cả bấm nút.
3. **Nút bấm là danh sách ĐỘNG (data-driven)** — không hardcode theo màn hình, mà tính toán lại mỗi lượt dựa trên `context_state` hiện tại (đang ở đâu, đang nói chuyện với ai, có quest nào khả dụng, có đang bị Eldritch Intervention không...).
4. **Free-text và Button dùng CHUNG 1 tầng xử lý lệnh (Action Resolver)** — bấm nút = gửi thẳng `action_id`, gõ chữ = parser tìm `action_id` tương ứng rồi xử lý y hệt. Không có 2 luồng logic riêng biệt.
5. **Sự kiện Priority 0 (Eldritch/Backfire) có quyền ghi đè toàn bộ nút bấm hiện tại** — đúng theo Event Priority System đã có trong spec gốc.

---

## 2. CẤU TRÚC DỮ LIỆU ACTION

```
Action {
  action_id: string              // định danh duy nhất, vd "act_tu_luyen", "act_tan_cong_thuong"
  label: string                  // text hiển thị trên nút, vd "Tu Luyện"
  icon: string | null            // optional, icon hiển thị kèm label
  aliases: string[]              // các cách gõ tắt tương đương, vd ["tl", "tu luyen", "tu"]
  requires_context: string[]     // điều kiện để nút này XUẤT HIỆN, vd ["location:tong_mon", "not_in_combat"]
  priority_tier: 0 | 1 | 2       // ĐỒNG BỘ Event Priority System — 0 = cưỡng chế (không thể bỏ qua)
  disabled_reason: string | null // nếu điều kiện chưa đủ nhưng vẫn muốn HIỂN THỊ (xám/mờ) kèm lý do
  handler: string                // tên hàm xử lý phía server khi action được gọi (button hoặc text đều gọi hàm này)
}
```

**Nguyên tắc quan trọng:** `handler` là điểm hội tụ — dù người chơi bấm nút hay gõ chữ khớp `aliases`, cuối cùng đều gọi đúng 1 hàm xử lý, đảm bảo **không có 2 đường logic** cho cùng 1 hành động.

---

## 3. LUỒNG XỬ LÝ MỖI LƯỢT (TURN FLOW)

```
[Server tính context_state hiện tại của player]
   (vị trí, đang chat với NPC nào, trong combat hay không,
    có Quest khả dụng không, có đang STATE_ELDRITCH_INTERVENTION không...)
        │
        ▼
[Context Resolver: lọc toàn bộ Action trong hệ thống theo requires_context]
        │
        ▼
[Danh sách Action khả dụng → render thành NÚT BẤM]
        │         (kèm 1 ô gõ tự do LUÔN hiện, không phụ thuộc context)
        ▼
[Player chọn 1 trong 2]
   ├── Bấm nút → gửi thẳng action_id đã biết chắc chắn
   └── Gõ chữ  → đưa qua ACTION PARSER (mục 4) → suy ra action_id (hoặc báo "không hiểu")
        │
        ▼
[Action Resolver gọi handler tương ứng — xử lý y hệt nhau bất kể nguồn vào]
        │
        ▼
[Trả kết quả → tính lại context_state mới → lặp lại]
```

**Ngoại lệ ghi đè (Priority 0):**
```
[Bất kỳ lúc nào, nếu STATE_ELDRITCH_INTERVENTION hoặc STATE_FATE_BACKFIRE được kích hoạt]
        │
        ▼
[Toàn bộ nút bấm Priority 1/2 hiện tại bị ẨN hoặc chuyển màu xám ("disabled_reason": "Bị Tà Thần cưỡng chế")]
        │
        ▼
[Chỉ còn nút bấm Priority 0 hiển thị: "Xử Lý Quest Tà Thần", "Hiến Tế Thọ Nguyên", "Bỏ Chạy (phạt nặng)"]
        │
        ▼
[Ô gõ tự do vẫn hoạt động NHƯNG parser chỉ chấp nhận alias thuộc nhóm Priority 0, còn lại trả về
 "Không thể làm việc khác lúc này — phải xử lý sự kiện trước."]
```

---

## 4. ACTION PARSER (XỬ LÝ Ô GÕ TỰ DO)

Không cần AI/NLP nặng — dùng **matching phân tầng** theo thứ tự ưu tiên, đủ dùng cho hầu hết input:

```
parseInput(rawText, availableActions):
  1. Chuẩn hóa text: lowercase, bỏ dấu câu thừa, trim khoảng trắng
  2. EXACT MATCH: rawText trùng y hệt 1 alias trong availableActions → trả action_id ngay
  3. PREFIX MATCH: rawText là tiền tố của 1 alias duy nhất (vd gõ "tu" khi chỉ có 1 action bắt đầu bằng "tu")
     → trả action_id đó kèm gợi ý "Ý mày là: Tu Luyện?"
  4. FUZZY MATCH (Levenshtein distance <= 2): bắt lỗi chính tả nhẹ (vd "tu luyn" -> "tu luyện")
  5. KHÔNG KHỚP GÌ:
     - Nếu đang trong DIALOGUE_FLOW với NPC → coi như câu hỏi tự do, chuyển cho hệ thống thoại xử lý
       (hoặc trả lời mặc định của NPC nếu không có nhánh khớp)
     - Nếu không trong ngữ cảnh nào đặc biệt → trả "Không hiểu lệnh này. Xem các lựa chọn bên dưới."
       kèm HIỆN LẠI danh sách nút bấm khả dụng (để không bao giờ bí đường)
```

> Bảng `aliases` nên **tự sinh thêm biến thể không dấu** (vd "tu luyen" cho "tu luyện") để bắt được người gõ nhanh không bật tiếng Việt có dấu.

---

## 5. VÍ DỤ MÀN HÌNH THEO TỪNG NGỮ CẢNH

### 5.1 Tại Tông Môn (bình thường)
```
[Nút bấm hiển thị]
 [ Tu Luyện ]  [ Nhận Nhiệm Vụ ]  [ Chợ Tông Môn ]  [ Nghỉ Ngơi ]  [ Rời Khỏi ]

[Ô gõ tự do]
 > _______________________________
```

### 5.2 Đang nói chuyện với NPC có Quest
```
[Nút bấm hiển thị — ưu tiên theo mục 3.1-3.3 của NPC_MONSTER_SYSTEM.md]
 [ Nhận Nhiệm Vụ: "Thu Linh Thảo Ngàn Năm" ]
 [ Hỏi Thêm Về Tông Môn ]   [ Mua Bán ]   [ Rời Đi ]

[Ô gõ tự do — vẫn dùng được để hỏi lore tự do không có trong nút]
 > hỏi về Vô Diện Cuồng Vương là ai______
```

### 5.3 Trong combat với Quái
```
[Nút bấm hiển thị — action_id gắn thẳng vào bảng hành động mục 4 của NPC_MONSTER_SYSTEM.md]
 [ Tấn Công Thường ]  [ Dùng Kỹ Năng ▾ ]  [ Dùng Vật Phẩm ▾ ]  [ Bỏ Chạy ]

[Ô gõ tự do — vẫn nhận, vd gõ tắt "sk1" = dùng kỹ năng số 1]
 > _______________________________
```

### 5.4 STATE_ELDRITCH_INTERVENTION (Priority 0 ghi đè)
```
⚠️ TÀ THẦN GHÉ THĂM — các hành động khác đã bị khóa.

[Nút bấm — CHỈ còn nhóm Priority 0]
 [ Đối Mặt Quest Tà Thần ]   [ Hiến Tế Thọ Nguyên (10 năm = +100% Stats 30s) ]   [ Bỏ Chạy (phạt x2) ]

(Các nút Tu Luyện/Chợ/... đã ẩn — đúng theo Priority Queue Logic)

[Ô gõ tự do — chỉ chấp nhận alias thuộc 3 action trên, còn lại bị chặn kèm cảnh báo]
 > _______________________________
```

### 5.5 Gặp Dị Sĩ (ngữ cảnh đặc biệt, hiếm)
```
[Nút bấm — dựa theo interaction_type của Dị Sĩ đó, vd "drink_challenge"]
 [ Nhận Lời Mời Rượu ]   [ Từ Chối, Rời Đi ]

[Ô gõ tự do]
 > _______________________________
```

---

## 6. BẢNG ALIAS MẪU (tham khảo nhanh, mở rộng tùy ý)

| action_id | label | aliases |
|---|---|---|
| `act_tu_luyen` | Tu Luyện | `tl`, `tu`, `tu luyen`, `tu luyện` |
| `act_tan_cong_thuong` | Tấn Công Thường | `a`, `atk`, `danh`, `tấn công` |
| `act_bo_chay` | Bỏ Chạy | `run`, `chay`, `bỏ chạy`, `flee` |
| `act_noi_chuyen` | Nói Chuyện | `talk`, `noi chuyen`, `chat` |
| `act_nhan_nhiem_vu` | Nhận Nhiệm Vụ | `quest`, `nhiem vu`, `nhận` |
| `act_hien_te_tho_nguyen` | Hiến Tế Thọ Nguyên | `sacrifice`, `hien te`, `đốt thọ` |
| `act_nghi_ngoi` | Nghỉ Ngơi | `rest`, `nghi`, `ngủ` |
| `act_roi_di` | Rời Đi | `leave`, `roi di`, `đi`, `back` |

---

## 7. GỢI Ý CẤU TRÚC UI (WEB, KHÔNG ANIMATION)

```
┌─────────────────────────────────────────┐
│  [Vùng text tường thuật / hội thoại]      │  ← nội dung chính, dạng text/markdown
│  ...........................................│
├─────────────────────────────────────────┤
│  [ Nút 1 ]  [ Nút 2 ]  [ Nút 3 ]  [ Nút 4 ] │  ← action bar, render động theo context
├─────────────────────────────────────────┤
│  >  [ô nhập tự do....................] [Gửi] │  ← luôn hiện, không phụ thuộc context
└─────────────────────────────────────────┘
```
- Action bar tự **wrap dòng** nếu nhiều nút (không giới hạn cứng số lượng, nhưng nên gợi ý tối đa 4-6 nút/hàng để không rối mắt).
- Nút có `disabled_reason` vẫn hiển thị (màu xám) kèm tooltip lý do — giúp người chơi hiểu tại sao chưa làm được, thay vì ẩn hoàn toàn gây khó hiểu.
- Submit bằng cả **click nút "Gửi"** lẫn phím **Enter** trong ô gõ tự do.

---

## 8. TÍCH HỢP VỚI CÁC HỆ THỐNG ĐÃ CÓ

| Hệ thống đã có | Điểm nối với Action Hybrid |
|---|---|
| `character_generator.js` (Fate Ratio R) | `context_state.state` (`STATE_ELDRITCH_INTERVENTION`/`STATE_FATE_BACKFIRE`/`STATE_NORMAL_GROWTH`) quyết định nhóm Action nào bị khóa/mở |
| `NPC_MONSTER_SYSTEM.md` mục 3 (Quest Flow) | Mỗi trạng thái hội thoại (`IDLE_GREET`, `QUEST_OFFER`...) map thẳng sang 1 bộ Action khả dụng tương ứng |
| `NPC_MONSTER_SYSTEM.md` mục 4 (Combat Flow) | Action combat (`Tấn Công`, `Dùng Kỹ Năng`...) chính là các nút ở màn hình 5.3, `disabled_reason` dùng khi bị Stunned/CC |
| `fate-relationships.json` | Khi player định dùng/dung hợp Mệnh Số Tương Khắc, Action Resolver có thể chèn thêm bước xác nhận cảnh báo trước khi gọi `handler` |

---

## 10. TÍCH HỢP VỚI HÀNH TRANG / TRANG BỊ (INVENTORY & EQUIP ACTIONS)

### 10.0 Nguyên nhân lỗi hiện tại ("Hắc Thiết Kiếm không hiện nút Trang Bị")
Nút hành động của 1 item **không tự sinh ra** — nó phải được tra từ `item_type` qua **Action Mapping Table** (mục 10.2). Nếu hệ thống hiện tại chỉ render `name / item_type / description` như mày thấy mà không kèm action bar, gần như chắc chắn 1 trong các lý do sau:
- Context Resolver (mục 3) mới xử lý ngữ cảnh NPC/Combat, **chưa có nhánh xử lý `context: "inventory_item_selected"`**.
- Item thiếu field `equip_slot` (nếu `equip_slot = null` thì hệ thống không biết đây là đồ trang bị được).
- Action Mapping Table chưa được implement — cần bảng tra cứu `item_type → action_id[]` như dưới đây.

### 10.1 Mở rộng Item Schema (bắt buộc để action bar hoạt động)
```
Item {
  item_id: string
  name: string                 // "Hắc Thiết Kiếm"
  quantity: number              // 1
  item_type: "weapon" | "armor" | "accessory" | "consumable" | "material" | "quest_item" | "fate_token"
  equip_slot: "weapon" | "armor_body" | "accessory_1" | "accessory_2" | null   // BẮT BUỘC có nếu equippable, null nếu không
  is_equipped: boolean          // false nếu chưa mặc
  rarity_tier: 1-8 | null       // optional, dùng chung thang 8 tier đã có
  description: string           // "Kiếm thép đen, sắc bén."
  stack_max: number             // 1 cho weapon/armor, >1 cho consumable/material
}
```

Ví dụ đúng cho trường hợp mày gặp:
```json
{
  "item_id": "wpn_hac_thiet_kiem",
  "name": "Hắc Thiết Kiếm",
  "quantity": 1,
  "item_type": "weapon",
  "equip_slot": "weapon",
  "is_equipped": false,
  "rarity_tier": 2,
  "description": "Kiếm thép đen, sắc bén.",
  "stack_max": 1
}
```

### 10.2 Action Mapping Table (theo `item_type`) — CỐT LÕI của việc fix lỗi

| item_type | Action hiện ra khi CHƯA trang bị/dùng | Action hiện ra khi ĐÃ trang bị |
|---|---|---|
| `weapon` / `armor` / `accessory` | `[ Trang Bị ]` `[ Xem Chỉ Số ]` `[ Bán ]` `[ Vứt Bỏ ]` | `[ Tháo Trang Bị ]` `[ Xem Chỉ Số ]` |
| `consumable` (đan dược) | `[ Dùng ]` `[ Xem Hiệu Ứng ]` `[ Bán ]` `[ Vứt Bỏ ]` | — (không có trạng thái "đã dùng") |
| `material` | `[ Xem Chi Tiết ]` `[ Dùng Để Dung Hợp ]`* `[ Bán ]` `[ Vứt Bỏ ]` | — |
| `quest_item` | `[ Xem Chi Tiết ]` (KHÔNG cho Bán/Vứt — khóa) | — |
| `fate_token`** | `[ Đưa Vào Mệnh Kho ]` `[ Dung Hợp ]` `[ Xem Chi Tiết ]` (KHÔNG cho Bán) | — |

\* chỉ hiện nếu material đó khớp `materials` trong 1 `fusion_recipe` (`fate-relationships.json`).
\** chỉ áp dụng nếu game để Mệnh Số rơi ra dạng vật phẩm nhặt được trước khi vào thẳng Mệnh Kho.

> **Quy tắc:** đây chính là bảng mà `contextResolver()` (mục 3) phải tra cứu khi `context_state.selected_item` khác null — parallel với cách nó tra cứu `dialogue_state` cho NPC.

### 10.3 Luồng chọn Item trong Hành Trang

```
[Player mở Hành Trang] → danh sách item hiện ra (tên, số lượng ×N, item_type, mô tả)
        │
        ▼
[Player BẤM VÀO 1 item] → context_state.selected_item = item đó
        │
        ▼
[Context Resolver tra Action Mapping Table (10.2) theo item.item_type + item.is_equipped]
        │
        ▼
[Render action bar RIÊNG cho item đó ngay dưới/cạnh thông tin item]
        │
        ▼
[Player bấm 1 action → handler xử lý → cập nhật is_equipped/quantity → re-render]
```

**Áp vào đúng ví dụ của mày:**
```
Hắc Thiết Kiếm ×1
weapon
Kiếm thép đen, sắc bén.

[ Trang Bị ]   [ Xem Chỉ Số ]   [ Bán ]   [ Vứt Bỏ ]   ← ĐÂY LÀ PHẦN ĐANG BỊ THIẾU
```

### 10.4 Luồng Trang Bị (Equip) — có xử lý xung đột slot

```
[Player bấm "Trang Bị" cho item có equip_slot = "weapon"]
        │
        ▼
   Slot "weapon" đã có item khác đang is_equipped=true?
      ├── Có  → Hỏi xác nhận: "Thay [Tên vũ khí cũ] bằng [Tên vũ khí mới]?"
      │           [Xác nhận] → item cũ.is_equipped=false, item mới.is_equipped=true
      │           [Hủy]      → không đổi gì
      └── Không → Trang bị ngay lập tức, is_equipped=true
        │
        ▼
[Cập nhật Final_Stats nhân vật nếu vũ khí/trang bị có bonus PHY/MAG riêng]
```

### 10.5 Luồng Dùng (Use) — có xử lý số lượng cho Đan Dược

```
[Player bấm "Dùng" cho consumable có quantity > 1]
        │
        ▼
[Hỏi số lượng muốn dùng — mặc định 1, có nút +/- hoặc gõ số vào ô tự do]
        │
        ▼
[Xác nhận] → áp effect × số lượng → quantity -= n
        │
        ▼
   quantity == 0? → Xóa item khỏi Hành Trang → Không
                                              → Giữ lại, cập nhật số hiển thị (×N mới)
```

### 10.6 Phân biệt với Mệnh Kho (Fate Inventory) đã có
**Hành Trang (Inventory)** ở đây dùng cho vật phẩm vật lý (vũ khí/trang bị/đan dược/nguyên liệu) — **khác** với **Mệnh Kho** (`Max_Inventory_Slots` đã tính trong `character_generator.js` cho riêng Mệnh Số). Hai hệ thống inventory **tách biệt**, nhưng dùng **chung 1 cơ chế Action Hybrid** (nút theo `item_type`/`fate.tier` tương ứng) — không cần viết 2 bộ logic UI riêng, chỉ cần 2 Action Mapping Table khác nhau tra theo `context_state.inventory_kind` (`"item"` hay `"fate"`).

---

## 11. VIỆC CẦN LÀM TIẾP (chưa code, đang chờ xác nhận)

1. Viết bảng Action đầy đủ dạng data file (JSON) — liệt kê tất cả action_id trong game, không chỉ ví dụ ở mục 6.
2. Code `contextResolver()` — hàm tính `context_state` và lọc Action khả dụng mỗi lượt, **bao gồm cả nhánh `inventory_item_selected` mới thêm ở mục 10**.
3. Code `parseInput()` — action parser mô tả ở mục 4 (exact/prefix/fuzzy match).
4. Thiết kế thêm UI cho trường hợp **nút có sub-menu** (vd "Dùng Kỹ Năng ▾" mở ra danh sách kỹ năng con) nếu cần.
5. **Kiểm tra ngay dữ liệu item hiện có trong game** (vd Hắc Thiết Kiếm) đã có đủ field `equip_slot` và `is_equipped` chưa — nếu thiếu, action bar sẽ KHÔNG BAO GIỜ hiện dù code Resolver đúng.
6. Áp Action Mapping Table (10.2) vào toàn bộ item hiện có trong DB/data trước khi test lại.
