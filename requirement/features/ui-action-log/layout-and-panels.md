# UI & Action Log — Bố cục và panel

## Mục đích

Khung màn hình (topbar, sidebar, story panel, action bar), panel nhân vật ghim, phân bổ tính năng vào tab hiện có và hợp đồng hiển thị của các tab chức năng. Không định nghĩa luật gameplay; panel chỉ đọc view-model/resolver.

## Dữ liệu & trạng thái

| Thành phần | Nguồn |
|---|---|
| Thứ tự tải script | `engine.js → expansion.js → ui.js → main.js` (sau data và `i18n.js`) |
| Đồng hồ | `clockLabel(state)`, `worldClockLabel(state)` — xem [data-runtime/game-clock](../data-runtime/game-clock.md) |
| Panel nhân vật | `player.hp/maxHp`, `player.qi/maxQi`, Thanh Tỉnh, tên, cảnh giới, nghề |
| Tab sidebar (index.html) | Trạng thái, Dị Thể, Công Trình, Tổ chức, Nhiệm vụ, Nhân duyên, Ký ức, Thế Sự, Cổ Tịch, Phường thị, Khâm Thiên Giám, Hư Thiên Đỉnh |

## Rules

### Khung và responsive

| ID | Rule |
|---|---|
| UI-LAY-001 | Giữ story panel bên phải; Character Summary nằm trong sidebar với cấu trúc ghim. Không redesign toàn app, không tự đổi kích thước tổng thể. Sidebar chỉ tăng bề rộng khi cần đọc stat, không bóp story panel; không chuyển summary vào story panel để né overflow. |
| UI-LAY-002 | Topbar hiện hai đồng hồ: `Nhân vật · Năm Y, Tháng M, Ngày D` (Player Clock) và `Thái Thanh đại lục · Năm Y · <Kỷ Nguyên>` (World Clock), mỗi cái có tooltip giải thích; mùa/thời tiết là ngữ cảnh phụ. Đồng hồ không xuống dòng phá layout. |
| UI-LAY-003 | Action table nhóm theo category/priority ([action-surface-and-priority](action-surface-and-priority.md)); nhãn nút đọc được; `Thêm` không giấu toàn bộ gameplay; ô lệnh chữ không chiếm diện tích chính. |
| UI-LAY-004 | Desktop giữ rõ sidebar/story/action table. Mobile giữ nội dung, nút đủ lớn, overlay cuộn được, văn dài xuống dòng đúng. |

### Panel nhân vật ghim

| ID | Rule |
|---|---|
| UI-LAY-010 | `PinnedCharacterSummary` có mount riêng ngoài tab content, render trước mọi tab và độc lập với `activeSidebarTab`; đổi tab, overlay bản đồ, combat, hội thoại và rerender action không được gỡ/thay mount. |
| UI-LAY-011 | Responsive: sidebar cố định trên desktop, khối thường ở đầu trên màn hẹp; không có panel trạng thái trùng bên trong vùng ghim. |
| UI-LAY-012 | Tab Trạng thái sở hữu tên, Khí Huyết, Linh Khí, Thanh Tỉnh; khi tab này mở, panel ghim bị ẩn để không render trùng. |
| UI-LAY-013 | Thanh Linh Khí đọc `player.qi`/`player.maxQi`; `mana`/`maxMana` không phải field hợp lệ. |
| UI-LAY-014 | Thanh trạng thái hiện nghề chính trước, thêm Nghề Ẩn (phụ) sau khi đã cố định. |

### Phân bổ tính năng vào bề mặt

| ID | Rule |
|---|---|
| UI-LAY-020 | Không thêm nhóm sidebar thứ tư hay màn hình độc lập; tính năng mới vào bề mặt hiện có theo bảng dưới. |
| UI-LAY-021 | Feature đặt theo mô hình tư duy người chơi: nghề → Nhân vật/Trạng thái; tiến hóa Công Pháp → Công Pháp; tiến hóa Mệnh → Mệnh Số; công trình/dự án tông môn → Tổ chức; cơ duyên tranh đoạt → modal cơ duyên; manh mối ẩn → Cổ Tịch; chợ/đấu giá → Phường thị (tab con riêng); di sản Luân Hồi → Ký ức; Thiên Kiếp cá nhân → Cảnh giới; bộ sưu tập/phần thưởng NPC hiếm → Cổ Tịch. |

| Bề mặt | Nội dung |
|---|---|
| Trạng thái | Mùa/thời tiết, cảnh báo sinh tồn, nghề chính, đồng hành |
| Hành trang (modal) | Thức tỉnh vật phẩm, di truyền, action công thức/nguyên liệu |
| Mệnh Số (modal) | Thí luyện/preview tiến hóa, trạng thái Nhân Mệnh Hợp Nhất |
| Công Pháp (modal) | Thí luyện/tiến hóa Công Pháp, liên hệ nghề |
| Cảnh giới (modal) | Preview Thiên Kiếp cá nhân |
| Bản đồ (modal) | Icon sự kiện/chiến tranh/NPC/Bí Cảnh/thời tiết, cạnh ngoại giao |
| Tổ chức | Dự án, Đại Hội, tóm tắt ngoại giao/chiến tranh, quan hệ tổ chức |
| Nhiệm vụ | Nhóm khế ước/sự kiện/thí luyện, hạn theo ngày game |
| Nhân duyên | Ký ức NPC, thư, ân tình, trạng thái mục tiêu truy nã |
| Ký ức | Kiếp trước, mộ, liên kết biên niên |
| Phường thị | Chợ tình báo, đấu giá (tab con) |
| Khâm Thiên Giám | Quẻ, lore tiến hóa Mệnh (không bán tiến hóa) |
| Hư Thiên Đỉnh | Thức tỉnh/phong ấn/tu bổ khi đủ điều kiện |
| Cổ Tịch | Sổ khám phá (thay nhãn legacy "Dị Chí") |

### Tab chức năng

| ID | Rule |
|---|---|
| UI-LAY-030 | Panel Bản đồ/Thế Sự/Công Trình/thời tiết/thế lực tiêu thụ output resolver/view-model canonical, không tự suy luật từ raw state. |
| UI-LAY-031 | Bản đồ thế giới và Lân Cận hiển thị ảnh hưởng (influence), sương mù, mức hoàn thành, khí hậu tuyến; icon/cạnh bản đồ có văn bản thay thế, không chỉ dựa vào màu. |
| UI-LAY-032 | Thế Sự hiển thị thời tiết, lịch sử thời tiết, lịch sử node, mùa và Công Trình Tông Môn. |
| UI-LAY-033 | Khu Công Trình Bản Đồ: công trình tại node hiện tại, chi phí, hiệu quả, trạng thái; nút xây gọi command canonical, không sửa state trong UI. Tối thiểu có Truyền Tống Trận và Hộ Giới Đại Trận. |
| UI-LAY-034 | Mỗi công trình hiện chủ (`player`/`faction`/`npc`) và quyền hiện tại (sửa/nâng cấp/tháo dỡ) lấy từ `GameExpansion.structureManagerDecision`; `renderStructureOwnershipPolicy` hiện policy cạnh danh sách. UI không chép luật quyền; action runtime là authority cuối. |
| UI-LAY-035 | Phân biệt rõ Con Đường, Nghề chính, Nghề Ẩn và Dị Thể. Khu nghề chỉ hiện nghề chính sau khi chọn; không cho chọn nghề thường thứ hai; Nghề Ẩn chỉ xuất hiện như lựa chọn nghề phụ sau khi Cổ Tịch Tà Thần mở khóa. |
| UI-LAY-036 | UI Dị Thể/khám phá hiện vòng đời `discovered` → `verified` → `collected` → `rewarded`, không suy ra từ state Con Đường/Nghề. |
| UI-LAY-037 | Lựa chọn hành trình mở đầu nhận **toàn bộ state** để tính tổ chức theo vùng giống resolver engine; nhãn intent và tổ chức đích lấy từ cùng hợp đồng option của engine, không suy từ văn nền hay object player rời. |

## Acceptance

- Đổi qua mọi tab, mở bản đồ, vào combat/hội thoại: mount panel ghim vẫn còn, không có panel trạng thái trùng.
- Topbar hiện cả hai đồng hồ, không wrap trên mobile 360px.
- Gate: `verify_ui_surface_contract.js` (thứ tự tải, tab, map/Thế Sự, phân biệt Con Đường/Nghề/Nghề Ẩn/Dị Thể, delegation, lifecycle Dị Thể), `verify_browser_ui_contract.js`, `verify_ui_variant_render_matrix.js`, `verify_opening_intent.js`. Kiểm tra trực quan pixel trên trình duyệt là gate thủ công bổ sung.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| UI-LAY-002 | main.js:`updateClockDisplay`; engine.js:`clockLabel`, `worldClockLabel` | Khớp |
| UI-LAY-010–012 | ui.js: pinned mount (`pinned`) | Khớp |
| UI-LAY-013 | ui.js: thanh Linh Khí | Khớp (theo regression) |
| UI-LAY-033/034 | ui.js:`renderStructureOwnershipPolicy`; expansion.js:`structureManagerDecision`, `STRUCTURE_CATALOG` | Khớp |
| UI-LAY-036 | ui.js: Dị Thể panel (`Đã hé lộ`, `Tiếp nhận Dị Thể`) | Khớp |
| UI-LAY-037 | engine.js: journey options; ui.js guild roadmap | Khớp |
| UI-LAY-032 | ui.js: Thế Sự (`weatherHistory`, mùa) | Khớp |
