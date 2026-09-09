# UI LAYOUT REQUIREMENT — GIỮ NGUYÊN CẤU TRÚC, CHỈ TĂNG CHIỀU RỘNG SIDEBAR KHI CẦN

## 1. Mục tiêu

Tôi muốn chỉnh lại UI hiện tại theo **cấu trúc của UI ban đầu (ảnh 1)**.

### Nguyên tắc quan trọng nhất

> **GIỮ NGUYÊN CẤU TRÚC UI BAN ĐẦU. CHỈ ĐIỀU CHỈNH CHIỀU RỘNG SIDEBAR Ở MỨC TỐI THIỂU CẦN THIẾT ĐỂ TEXT KHÔNG BỊ WRAP.**

Không redesign UI.

Không thay đổi cấu trúc 2 cột.

Không chuyển Character Panel lên phía trên toàn bộ giao diện.

Không chuyển Story Panel xuống dưới Sidebar.

Không thay đổi logic game.

---

# 2. Reference layout

## Ảnh 1 là source of truth về STRUCTURE

Ảnh 1 thể hiện cấu trúc UI mong muốn:

```text
┌──────────────────────┬───────────────────────────────────┐
│      SIDEBAR         │          STORY PANEL              │
│                      │                                   │
│  ┌────────────────┐  │  Sơn Môn Thiên Huyền Tông         │
│  │    Nhân Vật    │  │                                   │
│  └────────────────┘  │                                   │
│                      │                                   │
│  Trạng thái          │                                   │
│  Hành trang          │                                   │
│  Mệnh số             │                                   │
│  Công pháp           │                                   │
│  Cảnh giới           │                                   │
│                      │                                   │
│  ┌────────┐ ┌──────┐ │                                   │
│  │Thế Giới│ │Đặc  │ │                                   │
│  │        │ │Biệt │ │                                   │
│  └────────┘ └──────┘ │                                   │
│                      │                                   │
│      Avatar          │                                   │
│      Tên nhân vật    │                                   │
│      Khí Huyết       │                                   │
│      Linh Khí        │                                   │
│      Thanh Tĩnh      │                                   │
│      Tâm cảnh        │                                   │
│      Chủng tộc       │                                   │
│      Căn cốt         │                                   │
│      Ngộ tính        │                                   │
│      Tà Nhiễm        │                                   │
│      Linh Căn        │                                   │
│                      │                                   │
│       scroll ↓       │                                   │
└──────────────────────┴───────────────────────────────────┘
```

Ảnh 2 chỉ được dùng để xác định **những gì đang bị sai**, không được dùng làm layout đích.

---

# 3. Giữ nguyên cấu trúc UI

Bắt buộc giữ cấu trúc:

```text
App
├── Sidebar LEFT
│   ├── Nhân Vật header
│   ├── TabGroupNav
│   │   ├── Trạng thái
│   │   ├── Hành trang
│   │   ├── Mệnh số
│   │   ├── Công pháp
│   │   └── Cảnh giới
│   ├── Action buttons
│   │   ├── Thế Giới
│   │   └── Đặc Biệt
│   └── Character Summary
│       ├── Avatar
│       ├── Tên nhân vật
│       ├── Khí Huyết
│       ├── Linh Khí
│       ├── Thanh Tĩnh
│       ├── Tâm cảnh
│       ├── Chủng tộc
│       ├── Mô tả chủng tộc
│       ├── Căn cốt
│       ├── Ngộ tính
│       ├── Tà Nhiễm
│       └── Linh Căn
│
└── Story Panel RIGHT
    ├── Story title
    ├── Story content
    ├── Action bar
    └── Input / actions
```

**Không được thay đổi hierarchy này nếu không thực sự cần thiết.**

---

# 4. Character Summary phải nằm trong Sidebar

`PinnedCharacterSummary` / Character Summary phải nằm **bên trong Sidebar trái**.

Nó không phải là một panel độc lập của toàn trang.

### Đúng

```text
Sidebar
│
├── Nhân Vật
├── Tabs
├── Thế Giới / Đặc Biệt
└── Character Summary
```

### Sai

```text
Character Summary
────────────────────────────────────────
Sidebar             Story Panel
```

### Sai

```text
Character Summary
       ↓
Sidebar
       ↓
Story Panel
```

### Sai

```text
Character Summary ← fixed ở top viewport
Sidebar
Story Panel
```

---

# 5. Ý nghĩa của "Pinned"

Pinned chỉ có nghĩa là:

> **Character Summary luôn tồn tại trong Sidebar và không bị thay thế khi người dùng chuyển tab.**

Ví dụ:

```text
Trạng thái  → Character Summary vẫn hiển thị
Hành trang  → Character Summary vẫn hiển thị
Mệnh số     → Character Summary vẫn hiển thị
Công pháp   → Character Summary vẫn hiển thị
Cảnh giới   → Character Summary vẫn hiển thị
```

Pinned **KHÔNG có nghĩa**:

- Đưa Character Summary lên đầu trang.
- Đưa Character Summary ra ngoài Sidebar.
- Làm Character Summary chiếm toàn bộ chiều ngang.
- Dùng `position: fixed` đối với toàn viewport.
- Thay đổi layout 2 cột.

Nếu cần sticky behavior thì sticky chỉ được áp dụng **trong Sidebar**, không phải toàn trang.

---

# 6. Sidebar width — yêu cầu chính

## Không chỉ định tỷ lệ Sidebar cố định

**Không dùng yêu cầu kiểu:**

```text
sidebar = 28%
sidebar = 30%
sidebar = 32%
```

Không tự ý đổi toàn bộ `grid-template-columns` sang một tỷ lệ mới.

Không tự ý tăng Sidebar lên một kích thước lớn.

---

## Nguyên tắc width

> **Hãy giữ width hiện tại và chỉ điều chỉnh tối thiểu nếu text bị wrap.**

Đây là nguyên tắc bắt buộc.

Nếu text vẫn hiển thị đẹp:

```text
→ KHÔNG thay đổi width.
```

Nếu một số stat bị wrap:

```text
→ tăng Sidebar một lượng nhỏ.
→ kiểm tra lại.
→ chỉ tăng tiếp nếu thực sự cần.
```

Không được tăng width theo một tỷ lệ cố định chỉ vì screenshot.

---

# 7. Mục tiêu của việc tăng width

Mục tiêu duy nhất của việc tăng Sidebar width là:

> **Đảm bảo nội dung/stat hiển thị tự nhiên và hạn chế wrap không cần thiết.**

Ví dụ hiện tại:

```text
Linh Căn
Kim · Thổ ·
Hỏa · Mộc
· Thủy
```

Mong muốn:

```text
Linh Căn
Kim · Thổ · Hỏa · Mộc · Thủy
```

Hoặc ít nhất phải wrap ở vị trí hợp lý, không cắt giữa một giá trị hoặc làm UI khó đọc.

---

# 8. Kiểm tra TOÀN BỘ stat

Không chỉ kiểm tra `Linh Căn`.

Sau khi điều chỉnh width phải kiểm tra:

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

Đặc biệt kiểm tra các giá trị dài như:

```text
Nhân Tộc
Thiên Mệnh Chi Nhân
Kim · Thổ · Hỏa · Mộc · Thủy
```

Không được làm một dòng đẹp thành nhiều dòng chỉ vì thay đổi layout.

---

# 9. Không làm Story Panel bị bóp quá nhỏ

Khi tăng Sidebar width:

```text
Sidebar ↑
Story Panel ↓
```

là điều bình thường.

Nhưng phải đảm bảo Story Panel vẫn có đủ không gian sử dụng.

Không được:

```text
Sidebar quá rộng
        ↓
Story Panel quá hẹp
        ↓
Story title / story text / action bar bị wrap hoặc vỡ layout
```

Vì vậy:

> **Sidebar chỉ tăng vừa đủ để giải quyết vấn đề text wrapping.**

Không tối ưu Sidebar bằng cách hy sinh quá nhiều không gian của Story Panel.

---

# 10. Không thay đổi kích thước tổng thể application

Giữ nguyên:

- App width
- App height
- viewport behavior
- body layout
- root layout
- overall page dimensions
- global font-size
- global scale

Không tăng chiều cao application chỉ để chứa Character Summary.

Nếu nội dung Character Summary dài:

```text
Sidebar
└── overflow-y: auto
```

Sidebar được phép scroll độc lập.

---

# 11. Story Panel phải giữ bên phải

Bắt buộc:

```text
┌───────────────┬────────────────────┐
│ Sidebar       │ Story Panel        │
│               │                    │
│               │                    │
│ scroll        │                    │
└───────────────┴────────────────────┘
```

Không được biến thành:

```text
┌────────────────────────────────────┐
│ Character Summary                  │
├────────────────────────────────────┤
│ Sidebar                            │
├────────────────────────────────────┤
│ Story Panel                        │
└────────────────────────────────────┘
```

---

# 12. Không thay đổi logic

Không sửa:

- Game logic
- Character data
- Story data
- State management
- Tab state
- Event handlers
- Action system
- Navigation logic
- AI/story generation logic

Chỉ sửa những phần cần thiết liên quan đến:

- Layout
- DOM order nếu thật sự cần
- Sidebar width
- Grid/Flex
- Overflow
- Sticky behavior
- Text wrapping

---

# 13. Quy trình bắt buộc trước khi sửa code

**Không được sửa code ngay.**

Trước tiên hãy inspect code hiện tại và xác định:

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

Sau đó mới sửa.

---

# 14. Nguyên tắc "minimal change"

Ưu tiên:

```text
Sửa ít nhất có thể.
```

Ví dụ nếu vấn đề chỉ nằm ở:

```css
grid-template-columns
```

thì chỉ sửa rule đó.

Nếu vấn đề nằm ở:

```css
flex-direction
```

thì chỉ sửa rule đó.

Nếu vấn đề nằm ở:

```css
position
```

thì chỉ sửa rule đó.

**Không rewrite toàn bộ component hoặc CSS architecture nếu không cần thiết.**

---

# 15. Không được tự ý redesign

AI KHÔNG được:

- Tạo layout mới.
- Gom Character Summary thành một header lớn.
- Đưa Character Summary lên đầu trang.
- Thay đổi Sidebar thành top panel.
- Chuyển 2-column thành 1-column.
- Thay đổi toàn bộ spacing chỉ vì muốn UI "đẹp hơn".
- Thay đổi typography toàn bộ application.
- Thay đổi màu sắc/theme nếu không cần.
- Thay đổi kích thước toàn bộ application.

---

# 16. Definition of Done

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
- [ ] Không redesign UI.

---

# 17. Câu lệnh cuối cùng cho AI

Hãy thực hiện yêu cầu này theo đúng thứ tự:

```text
1. Inspect existing code.
2. Identify current layout hierarchy.
3. Compare it against the original UI structure.
4. Identify exactly what caused the current layout deviation.
5. Restore the original structure.
6. Keep Character Summary inside the Sidebar.
7. Make Character Summary persistent across tab changes.
8. Keep the existing application dimensions.
9. Keep the existing Sidebar width initially.
10. Only increase Sidebar width if text wrapping requires it.
11. Increase width minimally, not by a predefined percentage.
12. Re-check ALL character stats after the width adjustment.
13. Make sure Story Panel remains usable.
14. Do not redesign anything else.
```

## FINAL RULE

> **STRUCTURE = giữ nguyên theo UI ban đầu.**
>
> **DIMENSIONS = giữ nguyên kích thước application hiện tại.**
>
> **SIDEBAR WIDTH = chỉ tăng tối thiểu khi text bị wrap.**
>
> **PINNED CHARACTER SUMMARY = luôn nằm trong Sidebar và không biến mất khi đổi tab.**
>
> **KHÔNG được hiểu "pinned" là đưa Character Summary lên đầu toàn trang.**

## Override hiện hành (2026-09-07)

Sau rà soát UX, yêu cầu Character Summary ghim riêng được thu hồi. Trạng thái nhân vật phải trở về cấu trúc legacy: khi chọn tab **Trạng thái**, toàn bộ thông tin (thanh tài nguyên, tâm cảnh, chủng tộc, thuộc tính, linh căn, khí vận, trang bị và cảnh giới) được render trực tiếp trong `#tab-content`. Không thêm panel tóm tắt thứ hai trong Sidebar. Các thay đổi về Story Panel, Action Bar, bản đồ và logic gameplay vẫn giữ nguyên.
