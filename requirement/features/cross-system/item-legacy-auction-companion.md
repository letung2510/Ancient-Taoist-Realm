# Cross-system — Vật phẩm thức tỉnh, di truyền, đấu giá, thuần hóa Dị Thú (SYS-06, SYS-07)

## Mục đích

Vật phẩm sinh ra tích lũy dấu ấn và thức tỉnh; một vật phẩm di truyền qua Luân Hồi; đấu giá NPC cục bộ; bắt và thuần hóa Dị Thú làm đồng hành. Luật đồng hành chung: [companion](../companion/README.md).

## Dữ liệu & trạng thái

```js
generatedItems[id].legacy = { usageCounters: { combatWins, eliteWins, forbiddenUses, regionsVisited },
  marks: [], awakeningStatus: "dormant"|"ready"|"awakened"|"sealed", awakeningId,
  bondLevel, heirloom: false, reincarnations: 0, wear: 0 }
AuctionLot { id, lotId, itemKind, itemId, sellerId, startDay, endDay, reservePrice,
  currentBid, bidderId, npcBidProfileIds: [], status }
companion = { entityId, customName, bondedDay, loyalty /* 0..100 */, element, originRegionId,
  corruption /* 0..100 */, passiveId, state: "active"|"resting"|"mutated"|"lost" }
```

## Rules

### Thức tỉnh và di truyền

| ID | Rule |
|---|---|
| CSX-ITM-001 | Chỉ trang bị sinh ra hoặc định nghĩa có `canAwaken: true` tham gia. Template thức tỉnh chọn theo loại, hệ, dấu ấn và hành vi; mỗi template có một lợi và một đánh đổi. Không tự thức tỉnh — người chơi xác nhận tại Hành Trang/Hư Thiên Đỉnh. Thức tỉnh không mutate catalog tĩnh. Luyện Khí và thức tỉnh dùng chung một catalog vật phẩm. |
| CSX-ITM-002 | Đánh dấu Di Truyền tốn nguyên liệu + công lao, tối đa một vật phẩm; không cho vật phẩm nhiệm vụ, tiêu hao hoặc vật bị nguyền chưa giám định. |
| CSX-ITM-003 | Luân Hồi/Chuyển Sinh giữ vật phẩm di truyền, tăng `reincarnations` và `wear`; mỗi kiếp giảm tối đa 5% hiệu lực, trần 25%; Luyện Khí Sư có công thức Tu Bổ. |

### Đấu giá

| ID | Rule |
|---|---|
| CSX-ITM-010 | Đấu giá là mô phỏng NPC cục bộ, không realtime: mỗi lượt hoặc ngày game xử lý bid tới hạn. Bid NPC deterministic theo proxy tài lực/tài nguyên thế lực và tag sở thích. Save mới và cũ có ngay một phiên đấu giá chơi được. |
| CSX-ITM-011 | Tiền người chơi được reserve khi dẫn đầu, hoàn lại khi bị vượt; không nhân đôi/mất sai. Load không reroll đối thủ. Lô được định danh deterministic bằng `lotId`/`itemId`, tên vật phẩm lấy từ catalog. |

### Thuần hóa Dị Thú

| ID | Rule |
|---|---|
| CSX-CMP-001 | Dùng khung bắt sống ([CSX-INT-002](contract-capture-intel.md)) với mục tiêu `beast: true`; sau bắt chọn thuần hóa hoặc giao nộp; thuần hóa check aptitude + bonus Con Đường Ngự Thú + quan hệ ngũ hành. Không nhận cả đồng hành và loot giết đầy đủ. |
| CSX-CMP-002 | MVP một đồng hành, không có lượt AI riêng; mỗi đồng hành một passive active: trinh sát node, giảm rủi ro travel hoặc đòn mở đầu nhỏ. |
| CSX-CMP-003 | Trinh sát gọi reveal API của bản đồ, một lần/ngày, một node; không lộ node bị khóa bởi realm gate. |
| CSX-CMP-004 | Ở vùng Tà Nhiễm cao lâu ngày tăng mutation meter; đột biến tạo sự kiện lựa chọn chữa trị/chấp nhận/mất thú; không mất đồng hành khi offline mà người chơi chưa kịp phản ứng. |
| CSX-CMP-005 | Thế lực phản ứng chỉ bằng relationship event nhỏ theo tag thú/nguồn gốc, không đổi ngoại giao trực tiếp. |

## Acceptance

- Thức tỉnh không đổi catalog; di truyền giữ đúng một vật và trần wear đúng; đấu giá load không reroll, tiền reserve đúng.
- Gate: `verify_companion_runtime.js`, `verify_review_batches.js`, `verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-ITM-001 | expansion.js: `canAwaken`, `generatedItems` legacy | Khớp |
| CSX-ITM-002/003 | expansion.js:`heirloom`, `wear` | Khớp |
| CSX-ITM-010/011 | expansion.js: auction (`reserve`) | Khớp |
| CSX-CMP-001–005 | expansion.js:`companion`, `mutation` | Khớp |
