# UI LAYOUT + ACTION SYSTEM REQUIREMENT
## GIỮ NGUYÊN CẤU TRÚC UI, TỐI ƯU ACTIONS THEO KIỂU BẢNG BUTTON

---

# 12. ACTION SYSTEM — THAY ĐỔI QUAN TRỌNG

## 12.1 Mục tiêu

Hiện tại game có:

```text
[nhìn] [trạng thái] [tu luyện] [hành trang] [bản đồ] [tổ chức] [giúp]
```

và có ô:

```text
Bạn làm gì?
```

Vấn đề:

- Người chơi chủ yếu click button.
- Free-text command không phải phương thức tương tác tối ưu cho gameplay chính.
- Nếu action quan trọng bị đưa hết vào menu `Thêm`, người chơi phải click nhiều lần.
- Người chơi khó biết tại thời điểm hiện tại mình có thể làm gì.
- Action list cố định không phản ánh context của game.
- Một danh sách command dài sẽ làm UI giống command console hơn là RPG interface.

### Mục tiêu mới

> **Biến `#action-list` thành một ACTION TABLE / QUICK ACTION PANEL là trung tâm tương tác chính của người chơi.**

Free-text command vẫn được giữ lại nhưng trở thành **secondary / advanced input**.

---

# 13. ACTION TABLE — UI mong muốn

Không cần làm action thành một dòng button dài vô tận.

Ưu tiên dạng **bảng/grid action buttons** dễ quét bằng mắt.

Ví dụ:

```text
┌──────────────────────────────────────────────┐
│ HÀNH ĐỘNG                                    │
├──────────────┬──────────────┬───────────────┤
│ 👁 Nhìn      │ 🧘 Tu luyện  │ 🧭 Di chuyển  │
├──────────────┼──────────────┼───────────────┤
│ 💬 Nói       │ 🔎 Kiểm tra  │ 🎒 Vật phẩm   │
├──────────────┼──────────────┼───────────────┤
│ 📜 Nhiệm vụ  │ 🗺 Bản đồ    │ ⋯ Thêm        │
└──────────────┴──────────────┴───────────────┘
```

Hoặc tùy theo kích thước Story Panel:

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Nhìn         │ Tu luyện     │ Di chuyển    │ Nói chuyện   │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Kiểm tra     │ Vật phẩm     │ Nhiệm vụ     │ Thêm          │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Quan trọng

Không bắt buộc đúng số cột.

Hãy để grid thích ứng với chiều rộng Story Panel:

```css
grid-template-columns: repeat(auto-fit, minmax(...));
```

hoặc giải pháp tương đương phù hợp với architecture hiện tại.

**Không hard-code một layout mới nếu code hiện tại đã có hệ thống layout phù hợp.**

---

# 14. Action button là phương thức tương tác chính

Người chơi nên có thể thực hiện phần lớn gameplay bằng:

```text
Click → Action → Game xử lý → Story update → Action table update
```

Không nên bắt người chơi:

```text
Click input
→ gõ command
→ submit
→ đọc kết quả
→ lại gõ command
```

đối với các action phổ biến.

### Gameplay loop mong muốn

```text
Story
  ↓
Action Table
  ↓
Player click action
  ↓
Game State thay đổi
  ↓
Story update
  ↓
Action Table được cập nhật theo context mới
```

Đây là flow chính.

---

# 15. Contextual Actions — ACTION PHẢI THAY ĐỔI THEO GAME STATE

Không nên luôn hiển thị cùng một danh sách action.

Action table phải ưu tiên action phù hợp với context hiện tại.

## Context bình thường

Ví dụ:

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 👁 Nhìn      │ 🧘 Tu luyện  │ 🧭 Di chuyển │ 🎒 Vật phẩm  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 📜 Nhiệm vụ  │ 🗺 Bản đồ    │ ⋯ Thêm       │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

## Khi có NPC gần đó

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 👁 Nhìn      │ 💬 Nói       │ ❓ Hỏi        │ 🔎 Kiểm tra  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 🧘 Tu luyện  │ 🎒 Vật phẩm  │ ⋯ Thêm       │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

`Nói` có thể được nâng lên thành action priority cao hơn.

## Khi có item / vật thể có thể tương tác

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 👁 Nhìn      │ ✋ Nhặt      │ 🔎 Kiểm tra  │ 🖐 Tương tác  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 🧘 Tu luyện  │ 🎒 Vật phẩm  │ ⋯ Thêm       │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

## Khi đang combat

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ ⚔ Tấn công   │ 🛡 Phòng thủ │ ✨ Kỹ năng   │ 🎒 Vật phẩm  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 🏃 Rút lui   │ 🔎 Quan sát  │ ⋯ Thêm       │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Không hard-code các ví dụ trên nếu game hiện tại có action khác.**

Hãy inspect action system hiện tại và tận dụng action/state đang có.

---

# 16. Priority system

Mỗi action nên có metadata tương tự:

```js
{
  id: "cultivate",
  label: "Tu luyện",
  command: "tu luyện",
  priority: 95,
  category: "core",
  available: true,
  context: "normal"
}
```

Nếu architecture hiện tại đã có action object tương tự thì **tái sử dụng**, không tạo hệ thống song song không cần thiết.

Có thể sử dụng priority concept:

```text
Nhìn          100
Tu luyện       95
Di chuyển      90
Nói chuyện     85
Kiểm tra       80
Tấn công      120  // khi combat
Phòng thủ     115  // khi combat
Kỹ năng       110  // khi combat
Vật phẩm       70
Trạng thái     50
Hành trang     45
Bản đồ         40
Tổ chức        35
Nhiệm vụ       30
Nhân duyên     25
Ký ức          20
Phường thị     15
Khâm Thiên Giám 10
Hư Thiên Đỉnh   10
Giúp             5
```

Đây chỉ là **initial guideline**, không phải giá trị bắt buộc.

Quan trọng hơn là:

> **Context có thể override priority.**

Ví dụ:

```text
NPC nearby
→ Nói chuyện priority tăng mạnh.

Combat
→ Tấn công / Phòng thủ / Kỹ năng tăng mạnh.

Interactable item nearby
→ Nhặt / Tương tác tăng mạnh.
```

---

# 17. Quick Actions và More Actions

Không nên đưa tất cả action lên màn hình cùng lúc.

Chia thành:

```text
VISIBLE QUICK ACTIONS
        +
OVERFLOW / THÊM
```

Ví dụ:

```text
VISIBLE:

[ Nhìn ]
[ Tu luyện ]
[ Di chuyển ]
[ Nói ]
[ Kiểm tra ]
[ Thêm ]
```

Trong `Thêm`:

```text
Trạng thái
Hành trang
Bản đồ
Tổ chức
Nhiệm vụ
Nhân duyên
Ký ức
Phường thị
Khâm Thiên Giám
Hư Thiên Đỉnh
Giúp
```

### Nhưng:

> **Các action thường xuyên / quan trọng KHÔNG được giấu trong `Thêm`.**

Nếu một action được sử dụng thường xuyên trong gameplay, nó phải được cân nhắc đưa ra Quick Actions.

`Thêm` chỉ dành cho:

- action ít dùng
- utility
- navigation phụ
- thông tin
- advanced actions

---

# 18. Không để "Thêm" trở thành nơi chứa gần như toàn bộ game

Sai:

```text
[ Nhìn ]
[ Thêm ]

Thêm:
- Tu luyện
- Di chuyển
- Nói
- Kiểm tra
- Nhặt
- Tấn công
- Kỹ năng
- ...
```

Nếu người chơi phải mở `Thêm` cho các action cốt lõi thì UX không tốt.

Đúng:

```text
[ Nhìn ]
[ Tu luyện ]
[ Di chuyển ]
[ Nói / Tương tác ]
[ Kiểm tra ]
[ Thêm ]
```

---

# 19. Action Table phải phản ánh action AVAILABLE

Không hiển thị button nếu action không thể thực hiện.

Ví dụ:

```text
NPC không tồn tại
→ Không hiển thị "Nói chuyện"
```

```text
Không có item tương tác
→ Không hiển thị "Nhặt"
```

```text
Không ở combat
→ Không hiển thị "Tấn công"
```

Hoặc nếu architecture hiện tại yêu cầu giữ button:

```text
→ disabled + tooltip/reason
```

Nhưng ưu tiên:

> **Ẩn action không liên quan thay vì làm đầy UI bằng disabled buttons.**

---

# 20. Action Table phải cập nhật sau mỗi state change

Sau mỗi action:

```text
Player click action
        ↓
Execute action
        ↓
Update game state
        ↓
Update story
        ↓
Recalculate available actions
        ↓
Recalculate action priority
        ↓
Render Action Table
```

Ví dụ:

```text
Player đang ở ngoài thành
→ [Nhìn] [Tu luyện] [Đi Bắc] [Đi Đông] [Thêm]

Player đi vào thành
→ [Nhìn] [Nói chuyện] [Mua bán] [Nhiệm vụ] [Thêm]

Player gặp NPC quan trọng
→ [Nhìn] [Nói] [Hỏi] [Giao dịch] [Thêm]

Player vào combat
→ [Tấn công] [Phòng thủ] [Kỹ năng] [Vật phẩm] [Rút lui]
```

---

# 21. Movement Actions

Nếu game có hệ thống di chuyển, **không hard-code**:

```text
[Đi Bắc] [Đi Đông] [Đi Tây]
```

nếu các hướng này không phải lúc nào cũng tồn tại.

Action phải dựa trên world/game state:

```js
availableDirections
```

hoặc dữ liệu tương đương hiện có.

Ví dụ:

```text
Current location:
┌─────────────────────┐
│ available exits     │
│ north: true         │
│ east: true          │
│ south: false        │
│ west: true          │
└─────────────────────┘
```

thì UI:

```text
[ Đi Bắc ]
[ Đi Đông ]
[ Đi Tây ]
```

Không render:

```text
[ Đi Nam ]
```

---

# 22. Free-text Command Input — GIỮ LẠI NHƯNG GIẢM VAI TRÒ

Không xóa hoàn toàn command input nếu hệ thống hiện tại đang sử dụng nó.

Free-text command vẫn hữu ích cho:

- advanced player
- debug
- command không có button
- action hiếm
- power user
- nhập lệnh trực tiếp

Nhưng:

> **Free-text không còn là primary interaction.**

UI nên thể hiện rõ:

```text
ACTION TABLE
    ↓
Primary interaction

----------------

Free Command
    ↓
Secondary / Advanced interaction
```

Có thể đặt command input ở phía dưới Action Table:

```text
┌──────────────────────────────────────────┐
│ ACTIONS                                  │
│                                          │
│ [Nhìn] [Tu luyện] [Di chuyển] [Nói]      │
│ [Kiểm tra] [Vật phẩm] [Nhiệm vụ] [Thêm]  │
└──────────────────────────────────────────┘

Bạn làm gì? __________________ [Thực hiện]
```

Không cần xóa command input trừ khi code hiện tại cho thấy nó không còn cần thiết.

---

# 23. Không để command input chiếm quá nhiều diện tích

Command input không được cạnh tranh không gian với Story.

Không biến thành:

```text
┌─────────────────────────────┐
│ Story                       │
│                             │
├─────────────────────────────┤
│ HUGE COMMAND CONSOLE        │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

Mong muốn:

```text
┌─────────────────────────────┐
│ Story                       │
│                             │
│                             │
├─────────────────────────────┤
│ ACTION TABLE                │
├─────────────────────────────┤
│ Small command input         │
└─────────────────────────────┘
```

---

# 24. Action Table UX requirements

Action buttons phải:

- dễ nhận biết
- dễ click
- có label rõ ràng
- không quá nhỏ
- không cần đọc command syntax
- không yêu cầu người chơi nhớ câu lệnh
- có trạng thái hover/focus/active phù hợp
- có disabled state nếu cần
- giữ theme hiện tại của game

Không cần thêm animation phức tạp.

Không thay đổi theme chỉ vì action table.

---

# 25. Không dùng icon nếu icon làm giảm khả năng đọc

Có thể sử dụng:

```text
👁 Nhìn
🧘 Tu luyện
🧭 Di chuyển
💬 Nói
```

nhưng icon chỉ là enhancement.

Nếu project hiện tại không có icon system:

> **Không bắt buộc thêm icon library chỉ để làm action table.**

Text label phải luôn đủ rõ.

---

# 26. Responsive behavior

Desktop:

```text
Action Table
→ grid nhiều cột
```

Narrow screen:

```text
Action Table
→ giảm số cột
→ hoặc horizontal scroll nếu phù hợp
→ hoặc giảm Quick Actions
→ phần còn lại đưa vào Thêm
```

Không làm:

```text
button quá nhỏ
text bị cắt
button overflow khỏi Story Panel
```

---

# 27. Action architecture — ưu tiên tái sử dụng code hiện tại

Trước khi tạo architecture mới, inspect:

- `#action-list`
- action rendering function
- command handler
- action definitions
- game state
- available actions
- click handlers
- command parser
- event dispatch
- story update flow

Nếu code hiện tại đã có:

```js
actions[]
```

hoặc:

```js
availableActions
```

hoặc:

```js
handleAction()
```

hãy **tái sử dụng chúng**.

Không tạo một action engine thứ hai nếu không cần thiết.

---

# 28. Gợi ý abstraction

Nếu phù hợp với code hiện tại, có thể tổ chức theo:

```js
{
  id,
  label,
  command,
  priority,
  category,
  available,
  context,
  execute
}
```

Sau đó:

```js
getVisibleQuickActions(gameState)
```

và:

```js
getOverflowActions(gameState)
```

Ví dụ logic:

```text
1. lấy tất cả action
2. filter action available
3. xác định context
4. tính priority
5. sort theo priority
6. lấy nhóm visible
7. phần còn lại đưa vào More
8. render grid
```

Không bắt buộc dùng đúng tên function trên.

Đây chỉ là architecture guideline.

---

# 29. Ưu tiên context trước priority tĩnh

Không nên chỉ làm:

```js
actions.sort((a, b) => b.priority - a.priority)
```

rồi luôn hiển thị cùng một danh sách.

Nên có logic tương tự:

```text
base priority
        +
context modifier
        ↓
effective priority
```

Ví dụ:

```text
base:
Nói = 85

NPC nearby:
Nói = 85 + 40
     = 125
```

Combat:

```text
Tấn công = 100 + combat bonus
Kỹ năng  = 95  + combat bonus
Phòng thủ = 90 + combat bonus
```

Mục tiêu:

> **UI phải phản ánh điều người chơi nên làm ở thời điểm hiện tại.**

---

# 30. Action categories

Có thể chia action thành:

```text
CORE
COMBAT
MOVEMENT
SOCIAL
INTERACTION
INVENTORY
WORLD
UTILITY
ADVANCED
```

Ví dụ:

```text
CORE
- Nhìn
- Tu luyện

MOVEMENT
- Đi Bắc
- Đi Đông
- Đi Tây

SOCIAL
- Nói chuyện
- Hỏi

INTERACTION
- Nhặt
- Kiểm tra
- Tương tác

COMBAT
- Tấn công
- Phòng thủ
- Kỹ năng
- Rút lui

UTILITY
- Trạng thái
- Hành trang
- Bản đồ

ADVANCED
- Giúp
```

Không bắt buộc phải tạo category nếu project hiện tại chưa cần.

---

# 31. Không thay đổi game logic ngoài phạm vi Action Presentation

Được phép thay đổi:

- action selection cho UI
- action priority
- action grouping
- action visibility
- action rendering
- action table layout
- mapping click → existing action handler

Không được tự ý thay đổi:

- damage calculation
- character stats
- story generation
- NPC logic
- world data
- inventory logic
- combat rules
- cultivation rules
- save/load logic
- AI generation logic

Nếu cần thay đổi logic để xác định `available action`, phải sử dụng state hiện tại và giữ behavior cũ.

---

# 32. Không thay đổi command behavior nếu không cần

Nếu hiện tại:

```text
click action button
→ gửi command
→ command parser xử lý
```

thì có thể giữ nguyên flow.

Ví dụ:

```text
Button "Tu luyện"
        ↓
dispatch existing command
        ↓
"tu luyện"
        ↓
existing command handler
```

Mục tiêu chính là:

> **Thay cách action được PRESENTED, không rewrite command engine.**

---

# 33. Không tạo duplicate action execution

Tránh:

```text
Button
→ executeAction()

Command
→ executeAction()

Command handler
→ executeAction()
```

dẫn tới action chạy 2 lần.

Phải xác định rõ:

```text
UI Button
      ↓
Existing Action/Command Pipeline
      ↓
Game State
```

Một click chỉ được execute action **một lần**.

---

# 34. "Thêm" nên là compact menu

Không tạo một panel lớn chiếm Story Panel.

Mong muốn:

```text
[ ⋯ Thêm ]
```

click:

```text
┌────────────────────┐
│ Trạng thái         │
│ Hành trang         │
│ Bản đồ             │
│ Tổ chức            │
│ Nhiệm vụ           │
│ Nhân duyên         │
│ Ký ức              │
│ Phường thị         │
│ Khâm Thiên Giám    │
│ Hư Thiên Đỉnh      │
│ Giúp               │
└────────────────────┘
```

Có thể dùng dropdown/popover/menu phù hợp với framework hiện tại.

Không tạo modal nếu dropdown/popover đủ dùng.

---

# 35. Definition of Done — ACTION SYSTEM

Sau khi sửa:

- [ ] `#action-list` trở thành khu vực Action Table / Quick Actions.
- [ ] Button click là primary interaction.
- [ ] Free-text command vẫn hoạt động.
- [ ] Free-text command là secondary/advanced interaction.
- [ ] Action phổ biến được hiển thị trực tiếp.
- [ ] Action ít dùng nằm trong `Thêm`.
- [ ] Không giấu action gameplay quan trọng vào `Thêm`.
- [ ] Action được filter theo availability.
- [ ] Action phản ánh game context.
- [ ] Combat có action phù hợp khi combat.
- [ ] NPC có action phù hợp khi NPC xuất hiện.
- [ ] Item/interactable có action phù hợp khi có object tương tác.
- [ ] Movement action phản ánh exits thực tế.
- [ ] Action Table cập nhật sau state change.
- [ ] Không tạo duplicate action execution.
- [ ] Không rewrite command engine nếu không cần.
- [ ] Không tạo action engine song song nếu code hiện tại đã có hệ thống action.
- [ ] Responsive trên màn hình hẹp.
- [ ] Không làm Story Panel vỡ layout.
- [ ] Không làm button quá nhỏ.
- [ ] Không thay đổi theme hiện tại.

---

# 36. Definition of Done — LAYOUT

Sau khi sửa, UI phải thỏa mãn tất cả:

- [ ] Giữ nguyên cấu trúc UI ban đầu.
- [ ] Sidebar nằm bên trái.
- [ ] Story Panel nằm bên phải.
- [ ] Character Summary nằm trong Sidebar.
- [ ] Character Summary nằm sau navigation/action controls theo cấu trúc ban đầu.
- [ ] Character Summary không xuất hiện phía trên toàn bộ application.
- [ ] Đổi tab không làm Character Summary biến mất.
- [ ] Sidebar có thể scroll độc lập nếu nội dung dài.
- [ ] Story Panel không bị đẩy xuống dưới.
- [ ] Tổng thể application không bị phóng to/thu nhỏ.
- [ ] Không thay đổi global font-size.
- [ ] Không thay đổi game logic.
- [ ] Không thay đổi character data.
- [ ] Sidebar width chỉ được tăng nếu thực sự cần để tránh text wrap.
- [ ] Không sử dụng tỷ lệ Sidebar cố định như 28%, 30%, 32%.
- [ ] Width được tăng theo kiểu tối thiểu cần thiết.
- [ ] Kiểm tra toàn bộ stat sau khi tăng width.
- [ ] `Linh Căn` không bị wrap bất hợp lý.
- [ ] Các giá trị dài không bị cắt giữa từ.
- [ ] Story Panel vẫn có đủ không gian.
- [ ] Không redesign UI ngoài Action Table.

---

# 37. Quy trình bắt buộc trước khi sửa code

**Không được sửa code ngay.**

Trước tiên hãy inspect code hiện tại và xác định:

### Layout

1. App root nằm ở đâu?
2. Sidebar component/container nằm ở đâu?
3. Story Panel component/container nằm ở đâu?
4. `PinnedCharacterSummary` nằm ở đâu?
5. `TabGroupNav` nằm ở đâu?
6. CSS nào đang quyết định Sidebar width?
7. CSS nào đang quyết định Story Panel width?
8. CSS nào khiến Character Summary bị đưa lên sai vị trí?
9. Sidebar hiện tại có `overflow` như thế nào?
10. Có CSS `position: fixed`, `absolute`, `sticky`, `grid`, `flex` nào đang gây ra layout sai không?

### Action system

11. `#action-list` được render ở file/function nào?
12. Action definitions nằm ở đâu?
13. Có `actions[]`, `availableActions`, hoặc hệ thống tương đương không?
14. Action button hiện tại gọi handler nào?
15. Free-text command gọi handler nào?
16. Command parser nằm ở đâu?
17. Game state chứa thông tin về NPC / item / combat / exits ở đâu?
18. Có cơ chế xác định action availability hiện tại không?
19. Có action priority hiện tại không?
20. Có action category/group hiện tại không?
21. Có cơ chế update UI sau mỗi state change không?

Sau đó mới sửa.

---

# 38. Nguyên tắc "minimal change"

Ưu tiên:

```text
Sửa ít nhất có thể.
```

Nếu vấn đề layout chỉ nằm ở:

```css
grid-template-columns
```

thì chỉ sửa rule đó.

Nếu vấn đề action list chỉ nằm ở:

```text
renderActionList()
```

thì ưu tiên sửa function đó.

Nếu project đã có action metadata:

```js
actions[]
```

thì mở rộng nó thay vì tạo hệ thống mới.

**Không rewrite toàn bộ component hoặc CSS architecture nếu không cần thiết.**

---

# 39. Không được tự ý redesign

AI KHÔNG được:

- Tạo layout mới cho toàn application.
- Gom Character Summary thành một header lớn.
- Đưa Character Summary lên đầu trang.
- Thay đổi Sidebar thành top panel.
- Chuyển 2-column thành 1-column.
- Thay đổi toàn bộ spacing chỉ vì muốn UI "đẹp hơn".
- Thay đổi typography toàn bộ application.
- Thay đổi màu sắc/theme nếu không cần.
- Thay đổi kích thước toàn bộ application.
- Biến game thành command-line UI.
- Xóa free-text command nếu chưa có lý do kỹ thuật rõ ràng.
- Đưa toàn bộ actions vào một menu `Thêm`.
- Tạo action table chiếm quá nhiều diện tích Story Panel.
- Tạo modal lớn chỉ để chứa các action phụ nếu dropdown/popover đủ dùng.

---

# 40. Testing checklist

Sau khi code xong phải test ít nhất các scenario:

## Scenario A — Normal

```text
Mở game
→ Action Table hiển thị action cơ bản
→ click "Nhìn"
→ story update
→ Action Table vẫn hoạt động
```

## Scenario B — Cultivation

```text
click "Tu luyện"
→ action chạy đúng 1 lần
→ state thay đổi đúng
→ story update
→ action table refresh
```

## Scenario C — NPC

```text
NPC xuất hiện
→ "Nói chuyện" được đưa lên Quick Actions
→ click
→ đúng NPC được xử lý
```

## Scenario D — Combat

```text
combat bắt đầu
→ Action Table đổi sang combat actions
→ Tấn công / Phòng thủ / Kỹ năng / Vật phẩm
→ click action
→ action chỉ chạy 1 lần
```

## Scenario E — Movement

```text
location có exits:
north
east
west

→ chỉ hiển thị các hướng có thật
```

## Scenario F — More

```text
click "Thêm"
→ menu mở
→ action phụ hiển thị
→ click action
→ menu đóng
→ action thực thi đúng
```

## Scenario G — Free command

```text
nhập command bằng tay
→ command vẫn hoạt động như trước
```

## Scenario H — Tab

```text
Trạng thái
Hành trang
Mệnh số
Công pháp
Cảnh giới

→ Character Summary vẫn tồn tại trong Sidebar
```

## Scenario I — Long text

Kiểm tra:

```text
Khí Huyết
Linh Khí
Thanh Tĩnh
Tâm cảnh
Chủng tộc
Mô tả chủng tộc
Căn cốt
Ngộ tính
Tà Nhiễm
Linh Căn
```

Không được có wrap/cắt bất hợp lý.

---

# 41. Câu lệnh cuối cùng cho AI

Hãy thực hiện yêu cầu này theo đúng thứ tự:

```text
17. Convert #action-list into an Action Table / Quick Action Panel.
18. Make button click the primary interaction method.
19. Keep free-text command as secondary/advanced input.
20. Reuse the existing action/command execution pipeline whenever possible.
21. Do not create a second action engine unless technically necessary.
22. Make visible actions contextual to the current game state.
23. Prioritize frequently used and contextually important actions.
24. Put less frequently used actions into a compact "Thêm" menu.
25. Do NOT hide core gameplay actions inside "Thêm".
26. Filter actions by actual availability.
27. Update the Action Table after each relevant state change.
28. Make movement actions reflect actual available exits.
29. Make NPC/combat/item actions reflect the current context.
30. Ensure one button click executes exactly one action.
31. Keep free-text command behavior working.
32. Test normal, cultivation, NPC, combat, movement, More, command input, tabs, and long-text scenarios.
33. Do not redesign unrelated UI.
34. Do not modify game rules, story logic, character data, or AI generation logic.
35. Show me a concise summary of files changed and why.
```

---

# FINAL RULE

> **STRUCTURE = giữ nguyên theo UI ban đầu.**

> **DIMENSIONS = giữ nguyên kích thước application hiện tại.**

> **SIDEBAR WIDTH = chỉ tăng tối thiểu khi text bị wrap.**

> **PINNED CHARACTER SUMMARY = luôn nằm trong Sidebar và không biến mất khi đổi tab.**

> **ACTION TABLE = phương thức tương tác chính của người chơi.**

> **FREE-TEXT COMMAND = phương thức phụ / advanced.**

> **VISIBLE ACTIONS = ưu tiên action quan trọng + action phù hợp context.**

> **THÊM = chỉ chứa action ít dùng, không phải nơi giấu gameplay cốt lõi.**

> **ACTION SYSTEM = ưu tiên tái sử dụng logic hiện tại, không rewrite không cần thiết.**

> **KHÔNG được hiểu "pinned" là đưa Character Summary lên đầu toàn trang.**
