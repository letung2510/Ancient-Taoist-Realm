# Bản đồ — Thiên Đồ (bản đồ thế giới)

## Mục đích

Lớp xem toàn thế giới dạng Thiên Đồ chòm sao: vùng, tổ chức, landmark, mức chi tiết theo zoom, camera, ghim thế lực và hồ sơ tổ chức. Chỉ là lớp trình bày: không đổi ID địa điểm, vùng, tuyến, fog, visited, locked, vị trí nhân vật, travel hay action. Token màu/typography chung: [../ui-action-log/README.md](../ui-action-log/README.md).

## Dữ liệu & trạng thái

- `renderWorldMap(state, data, map)`, `mapCamera { zoom, panX, panY }`.
- Hai lớp xem: **Thiên Đồ** (toàn thế giới) và **Lân Cận** ([local-view.md](local-view.md)).

## Rules

### Nguyên tắc thị giác

| ID | Rule |
|---|---|
| MAP-TD-001 | Thiên Đồ là bản đồ sao không gian, không phải flowchart/cây/dependency graph. Thứ bậc dữ liệu (Thế giới → Vùng → Khu → Địa điểm) không quyết định bố cục; vị trí lấy từ tọa độ handcrafted hoặc seed ổn định, tránh lưới/hàng/cột/radial/force layout dày. |
| MAP-TD-002 | Canvas lớn hơn viewport, có khoảng trống có chủ đích; không tự fit toàn thế giới vào khung. Nền tinh vân xanh đen, sao xanh/trắng, điểm vàng cho landmark, tím/đỏ cho vùng nguy hiểm, xanh lục cho nơi bí ẩn; không HUD sci-fi/neon. |
| MAP-TD-003 | Vùng là khí quyển/tinh vân và cụm sao (glow, mật độ sao, màu nhẹ, tiêu đề mờ), không phải khung chữ nhật/panel. Vùng hiện tại được đánh dấu bằng quầng vàng/pulse; vùng có biến cố có trạng thái riêng. |
| MAP-TD-004 | Địa điểm là sao: thường — sao nhỏ glow nhẹ; quan trọng — lớn sáng hơn; thành lớn — sao lớn riêng; tông môn — biểu tượng sao riêng; dungeon — sao tối đặc biệt; cấm địa — thiên thể tối đỏ/tím; người chơi — sao sáng nhất có quầng xung động. |
| MAP-TD-005 | Tuyến là đường chòm sao mảnh, mờ, không mũi tên, luôn yếu hơn sao. Quỹ đạo/đường chòm sao chỉ là lớp định hướng thị giác; cạnh canonical mới quyết định khả năng di chuyển. |
| MAP-TD-006 | Trạng thái khám phá: chưa khám phá — sao rất mờ, không nhãn, tuyến ẩn; đã biết — sáng hơn, tuyến lân cận hiện; đã tới — marker bền, glow mạnh hơn; hiện tại — glow mạnh nhất; khóa — sao tối, tuyến cực mờ, biểu tượng khóa tùy ngữ cảnh. Khám phá tạo cảm giác ghép dần chòm sao. Marker Nguy hiểm, NPC, Cơ duyên chỉ render khi đã thám hiểm. |
| MAP-TD-007 | Hiện tượng: linh khí cao — sao dày, tinh vân cyan/vàng; vùng ma — sao thưa, đỏ/tím, chòm sao méo; cấm địa — gần trống, méo thiên thể; di tích — đường chòm sao đứt; vùng tiên — chòm sao rất sáng, sao vàng hiếm. Hiệu ứng nhẹ, không giảm độ đọc. Thời tiết, influence, phong tỏa, tuần tra, incident, NPC hiện bằng màu/glow/icon phụ; badge nhỏ, không đổi hình dạng sao quá mạnh. |

### Mức chi tiết và camera

| ID | Mức zoom | Hiện | Ẩn |
|---|---|---|---|
| MAP-TD-010 | 0,7–1,0 Cosmic | Vùng lớn, sao quan trọng, tinh vân | Nhãn thường, tuyến xa |
| MAP-TD-011 | 1,0–1,5 Region | Cụm chòm sao, tuyến trong vùng, thế lực, nhãn tổ chức cấp cao (mờ) | Chi tiết sub-location |
| MAP-TD-012 | 1,5–2,0 Local | Địa điểm đã khám phá, NPC/tuần tra, thời tiết, tổ chức cấp thấp | Dữ liệu chưa đủ fog |
| MAP-TD-013 | 2,0–2,4 Close | Nhãn gần, bảng tin, sub-location, action | Sao trang trí không tương tác |

| ID | Rule |
|---|---|
| MAP-TD-014 | Nhãn chỉ hiện khi hover, selected, current, nearby hoặc important; zoom xa ẩn phần lớn nhãn. Nhãn tổ chức cấp thấp chỉ hiện khi hover. |
| MAP-TD-015 | Thanh công cụ: nút về sao nhân vật (reset zoom/pan), phóng/thu bước 0,2 trong giới hạn 0,7–2,4, cuộn chuột zoom, kéo nền để pan (không kích hoạt khi bắt đầu trên nút, ghim hoặc sao); nút có `aria-label`, focus-visible, đủ tương phản. Mobile: điều khiển cố định góc, toolbar thành hàng cuộn. |
| MAP-TD-016 | Camera: chọn/đi tới sao → pan mềm, có thể zoom nhẹ, không giật; khi di chuyển camera theo người chơi giữ bối cảnh. Zoom/pan/reset chỉ đổi projection và mật độ hiển thị, không đổi tọa độ gameplay hay registry. |
| MAP-TD-017 | Hover: tăng glow, hiện tên và loại sao; focus bàn phím giống hover, Enter mở hồ sơ vùng; sao hiện tại có halo nhịp chậm (không nhấp nháy nhanh). Chọn sao mở Current Region View Model, bảng tin, thời tiết, NPC, sub-location và action hợp lệ. |

### Ghim thế lực và hồ sơ tổ chức

| ID | Rule |
|---|---|
| MAP-TD-020 | Màu vàng chỉ dành cho vùng/sao chứa `state.locationId`; không dùng cho ghim hay sao tổ chức. |
| MAP-TD-021 | Ghim tổ chức màu theo alignment/allegiance (Chính đạo xanh lam, Ma/Tà đỏ tím, Trung lập tím xám); kích thước tỉ lệ nghịch `pyramid_tier` (Tier 1 lớn nhất). Nhãn tổ chức cùng màu alignment. Sao tổ chức phụ chỉ là lớp dẫn đường mờ, không che hay giả trạng thái vùng hiện tại. |
| MAP-TD-022 | Bấm ghim hoặc dòng thế lực mở hồ sơ (vùng, quy mô, cảnh giới, tổ chức liên quan, điều kiện gia nhập và lý do bị khóa); không di chuyển camera ngoài ý muốn. Ghim không tự dịch chuyển hay cho gia nhập từ xa; gia nhập, nhận nhiệm vụ, giao dịch chỉ khi nhân vật ở đúng khu vực. |
| MAP-TD-023 | Hồ sơ tổ chức không hiện cảnh giới legacy (Luyện Khí, Trúc Cơ, Kim Đan); `guild.highest_realm` chỉ là khóa tương thích, map sang `GameData.REALMS` rồi `PATH_FATE_RELATIONS.path_titles[pathId]`; chưa chọn Con Đường thì hiện "Con Đường bậc N". Điều kiện gia nhập diễn giải bằng tên cảnh giới Con Đường tương ứng `minRealm`, không hiện số (trừ tooltip kỹ thuật). |
| MAP-TD-024 | Vùng ngưỡng tông môn từ cấp 3 (Đông Hoang, Vô Tận Hải) không ép gia nhập ngay: UI hiện lộ trình Tán Tu, điều kiện Cảnh giới/Hiệu Mệnh và tự mở thế lực khi đủ chuẩn. |

### Hiệu năng

| ID | Rule |
|---|---|
| MAP-TD-030 | Ưu tiên Canvas hoặc SVG tối ưu; tách lớp: sao trang trí, khí quyển vùng, đường chòm sao, sao gameplay, nhãn/overlay. Sao trang trí ở lớp riêng không chặn click. Không panel DOM nặng cho mỗi địa điểm. |
| MAP-TD-031 | Trên 500 địa điểm: chỉ render sao trong viewport + vùng đệm; node ngoài viewport bị culling; node gần nhau gom cluster và tách khi zoom vào; tuyến xa batch SVG/Canvas. Debounce cập nhật camera; pan không render lại toàn bộ panel. Cache sprite theo vùng; không chạy BFS mỗi frame. |
| MAP-TD-032 | Lớp bật/tắt: tổ chức, node dân cư, NPC, quái, cơ duyên, influence, tuyến thương mại. Asset lỗi có fallback SVG/CSS và vẫn thao tác được. |

## Acceptance

- Không còn cảm giác flowchart hay node-card; zoom/center hoạt động, không mất click vào sao hoặc ghim.
- Vùng hiện tại, thời tiết, NPC và travel khớp cùng một nguồn node/vùng.
- Save cũ load nguyên trạng; mọi action/travel cũ vẫn chạy.
- Screenshot desktop 1440 px, tablet 1024 px, mobile 390 px: không tràn chữ tiếng Việt, không chồng tooltip, không mất focus.
- Gate: `node tools/verify_browser_ui_contract.js`, `node tools/verify_ui_variant_render_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-TD-001..007 | js/ui.js:`renderWorldMap` | Khớp |
| MAP-TD-010..014 | js/ui.js:`renderWorldMap` | Khớp |
| MAP-TD-015..017 | js/ui.js:`mapCamera` (zoom tối đa 2,4, bước 0,2) | Khớp |
| MAP-TD-020..022 | js/ui.js:`renderWorldMap` (`pyramid_tier`) | Khớp |
| MAP-TD-023..024 | js/ui.js (hồ sơ tổ chức) | Khớp |
| MAP-TD-030..031 | js/ui.js:`renderWorldMap` | Khớp |
| MAP-TD-032 | js/ui.js:`renderWorldMap` | Thiếu |
