# UI & Action Log — Bản đồ Lân Cận (giao diện)

## Mục đích

Hợp đồng giao diện của bề mặt **Lân Cận** (V2.5, quyết định D01–D15 ngày 2026-10-09): bố cục, xem trước hướng đi, cam kết di chuyển, ngôn từ, marker, nhật ký, truyền tống, trợ năng và chuyển động. Logic di chuyển/ứng viên/cước trình thuộc [map](../map/README.md) (`MAP-LC-*`). Ảnh concept chỉ là định hướng mỹ thuật; tọa độ, tuyến và cân bằng không lấy từ ảnh.

## Dữ liệu & trạng thái

| Nguồn | Dùng cho |
|---|---|
| `movementCandidatePreview(state, dir)` | Tập chốn có thể tới theo hướng (`candidates[]`) + `travelPlan` (ngày, thể lực) |
| `travelPlan(state, from, to, mode)` | Cước trình, hao tổn, điểm truyền tống hợp lệ |
| Bản ghi node (`visitedLocations`, trạng thái khám phá, màu node gameplay) | Marker, nhãn |
| Weather/terrain resolver | Dòng thời tiết/cước, sương mù vùng |

Preview đọc trên bản sao trạng thái; không tạo node, không đổi ảnh hưởng bản đồ, không tiêu tài nguyên/RNG.

## Rules

### Bố cục và điều hướng

| ID | Rule |
|---|---|
| UI-LM-001 | Tiêu đề **LÂN CẬN**; breadcrumb `Vùng / Node` (ví dụ Trung Vực / Truyền Pháp Các). **Thiên Đồ** là nút header riêng sang bản đồ thế giới, không phải tiêu đề hay con của breadcrumb. |
| UI-LM-002 | Desktop: bản đồ ≈62–68% bên trái, panel ≈32–38% bên phải (grid `minmax(0,1fr) minmax(320px,380px)`, gap 16–20px, bản đồ cao tối thiểu ≈500px, clamp 500–680px); nhật ký và action địa điểm bên dưới; truyền tống thu gọn. Một cột khi < ≈1100px hoặc không đọc được. Mobile: bản đồ ≈40–50dvh, panel là sheet/khối bên dưới, nút hướng và CTA trong tầm tay, sheet không che toàn bộ vùng ứng viên. Không thu nhỏ chữ để giữ bố cục. Thang khoảng cách 4/8/12/16/24/32/48px; `min-width: 0`, tên xuống dòng; panel không cố định chiều cao. |
| UI-LM-004 | Bề mặt Lân Cận luôn dùng renderer chòm sao (constellation); renderer route-graph cũ không phải fallback hợp lệ. |
| UI-LM-003 | Các lớp tách riêng: nền địa hình minh họa, ornament không tương tác (≤24–32px mỗi cạnh, không nhận pointer), lớp node/tuyến tương tác, chữ và control HTML/SVG thật. Không dùng ảnh chụp cả trang làm UI. |

### Xem trước hướng và cam kết

| ID | Rule |
|---|---|
| UI-LM-010 | Bốn nút Bắc/Tây/Đông/Nam chỉ chọn ý định (kể cả khi ghi Đông/Tây/Nam/Bắc hành). Khi chọn: (1) tô vùng bất quy tắc quanh vị trí layout của các node có thể tới, nhãn **Những chốn có thể tới**; (2) dùng lại chấm và tên node sẵn có — không thêm lớp node, không chấm vô danh, không lưới 2×3; (3) giữ màu khám phá, thêm accent phụ; chấm hiện tại nổi bật nhất; (4) panel liệt kê cùng tập node bằng tên (xuống dòng hoặc cắt + tooltip, không đánh số 1–6); (5) bấm tên chỉ focus chấm và hiện mô tả, không chọn đích; (6) chỉ **Khởi hành về <Hướng>** mới cam kết. Tối đa sáu mục; ít hơn khi bị lọc; không độn. Polygon chỉ để nhìn — thành viên tập xác định theo identity node. |
| UI-LM-011 | Ma trận hướng: Đông → `ĐÔNG HÀNH` / `Khởi hành về Đông`; Tây → `TÂY HÀNH` / `Khởi hành về Tây`; Nam → `NAM HÀNH` / `Khởi hành về Nam`; Bắc → `BẮC HÀNH` / `Khởi hành về Bắc`. Nút phụ **Thôi xét**. Tên, số lượng, cảnh sắc, thời tiết, cảnh báo và cước lấy từ tập node của đúng hướng (không chép dữ liệu, không tên mẫu cứng). Từ cảnh sắc (rừng, mưa, sương, núi) chỉ dùng khi dữ liệu hỗ trợ; nếu không, câu dẫn trung tính. Đổi hướng nhanh: chỉ preview mới nhất (request ID/state version) điều khiển highlight và camera. |
| UI-LM-012 | Kết quả tương tác: bấm hướng/tên → đổi panel/highlight, chỉ pan tối thiểu nếu bị khuất, không di chuyển/RNG/thời gian/tài nguyên; Khởi hành → trạng thái đang đi, khóa cam kết trùng, camera theo khi cần; Thôi xét → xóa preview, giữ camera; **Về chỗ đứng** → chỉ căn giữa lại; đến nơi → hiện chốn thực tới, kết quả thực và action mới, xóa preview, lần đi sau cần Khởi hành mới. |
| UI-LM-013 | Một lối vào di chuyển: Khởi hành, nút di chuyển ở Action Bar và phím tắt đều dispatch `submitActionId` → `move` canonical; component bản đồ không tự roll ngẫu nhiên, không tự tính thời gian/thể lực. UI gửi hướng + action/state version, không gửi pixel hay đích do client chọn. Animation chỉ minh họa kết quả engine. Truyền tống là cơ chế riêng. |
| UI-LM-014 | Câu dẫn nói rõ đích chưa cố định ("ngươi có thể dừng chân ở một trong những chốn dưới đây"); văn chương không được ngụ ý sẽ tới chốn vừa bấm. Bấm địa danh ngoài tập chỉ hiện mô tả và hướng tương đối. |

### Ngôn từ, công bố thông tin, trạng thái

| ID | Rule |
|---|---|
| UI-LM-020 | UI chính không hiện "Tiến 1–3 ô", "lệch", "ô", "ngẫu nhiên/RNG", "ứng viên", "hệ số/multiplier", Oxy/tọa độ, trace ID, công thức, "đi N bước". Từ vựng: hướng → `Đông hành · Khởi hành về Đông` (tương tự Tây/Nam/Bắc); tập ứng viên → `Những chốn có thể tới`; chi tiết cước → `Dự liệu hành trình`; hủy preview → `Thôi xét`; dừng đi → `Dừng chân`; hiện tại/đã đến/chưa đến → `Đang đứng / Đã ghé / Chưa ghé`; căn giữa → `Về chỗ đứng`. |
| UI-LM-021 | **Dự liệu hành trình ›** là disclosure trong panel, mở được trước khi cam kết, nhãn `Cước trình`, `Hao tổn thể lực`, `Trở ngại`; số là giá trị engine theo đơn vị gameplay hiện có, hiển thị **khoảng min–max trên toàn tập chốn có thể tới**, "Ước tính" cho dự báo; không đơn vị bịa (canh/khắc/dặm). Thiếu hụt và cước tăng hiện bên ngoài vùng thu gọn. Sau khi tới hiện thời gian/thể lực thực tế. |
| UI-LM-022 | Trạng thái và câu bắt buộc: chưa chọn hướng "Ngươi dừng bước, đưa mắt nhìn bốn phía."; rìa thế giới "Phía <hướng> đã tới tận cùng cõi này. Hãy chọn lối khác." + "Bị giới hạn bởi rìa thế giới"; chặn đã biết "Vách đá dựng đứng chắn lối, chưa thể qua."; thiếu thể lực "Thể lực chưa đủ để lên đường." kèm mức thiếu thực; đang đi "Đang men đường về phía <hướng>…" (khóa cam kết); dừng "Dừng chân" ở điểm an toàn kế tiếp; đến nơi nêu node thực; không rõ nguyên nhân "Chưa tìm được lối đi về phía này." (không lộ bí mật). |
| UI-LM-023 | Dòng thời tiết/cước lấy từ resolver: chậm vì mưa "Mưa nặng hạt, đường rừng lầy lội. Chuyến đi e sẽ lâu hơn thường lệ."; bão chặn "Cuồng phong chắn lối, lúc này khó thể vượt qua." (khóa Khởi hành); dự báo bất định "Mây trời chuyển biến, cước trình khó định."; cước tăng sau preview "Mưa đã nặng hạt hơn. Ngươi nên xét lại đường đi." hiện trước khi cam kết. Thời tiết là sương/đường viền mềm theo vùng thực, nhãn gọn (ví dụ "Mưa lớn · Trôi về Tây"); không gạch chéo ô vuông, không hạt mưa đè lên chữ/CTA. |

### Marker và nhãn

| ID | Rule |
|---|---|
| UI-LM-030 | Marker chỉ là chấm tròn (không sao, hành tinh, quỹ đạo, mắt, xúc tu). Chấm thường 8–10px; hiện tại 14–16px, nhãn "Bạn ở đây" khi cần; đã ghé tô đặc; biết-chưa-ghé rỗng (vòng 1.5–2px, lõi tối); chặn đã biết có ổ khóa nhỏ cạnh tên; trạm truyền tống có ký hiệu nhỏ cạnh tên; có thể tới = chấm sẵn có + accent phụ, không nhân bản. Tuyến thường 1–1.5px; tuyến preview/chọn 1.5–2px đứt nét. Trạng thái không chỉ dựa vào màu. Màu node gameplay của [map](../map/README.md) thắng các màu dự phòng này. |
| UI-LM-031 | Vùng chạm ≈44×44 CSS px qua hit area vô hình (thay mức 12px trong quy tắc mật độ của map); chồng lấn giải bằng danh sách hoặc zoom, không dời chấm. Nhãn cách chấm 6–8px, dời nhãn trước khi đổi layout. |
| UI-LM-032 | Ưu tiên nhãn: node hiện tại, mọi node có thể tới của hướng đang chọn, node đang focus, địa danh ghim, nơi gần liên quan; ≈25–40 nhãn nổi bật khi đủ chỗ. Khi chật, bỏ nhãn ưu tiên thấp hoặc đưa vào danh sách — node có thể tới không bao giờ vô danh. Mobile luôn có danh sách tên có thể tới dưới bản đồ (chạm tên ↔ sáng chấm). Nhãn nền tối `rgba(8,15,16,0.85)`, padding 2px 4px, không glow. |

### Nhật ký, action địa điểm, truyền tống

| ID | Rule |
|---|---|
| UI-LM-040 | Nhật ký hành trình 1–3 câu; thời gian/thể lực ở dòng phụ, không công thức trong văn. Câu đến nơi dùng tên chính node dừng chân thực, không lấy POI gần nhất. Chọn hướng hay xem địa điểm không ghi log di chuyển. Auto-scroll theo [UI-LOG-014](novel-log.md). |
| UI-LM-041 | Quan sát/lắng nghe/nghỉ thuộc vị trí hiện tại và nói rõ điều đó; không tương tác từ xa vượt khả năng engine. Chỉ hiện action tồn tại và khả dụng; không hai nút cùng action id; không nút ý tưởng rỗng. Combat/lựa chọn bắt buộc tạm dừng hành trình và chiếm ưu tiên vùng truyện. |
| UI-LM-042 | Thanh truyền tống đóng: "Truyền tống · N điểm đã mở", N đếm đích engine đánh dấu hợp lệ; rỗng: "Chưa có điểm truyền tống — khám phá và kích hoạt trạm để mở khóa". Drawer: đích, điều kiện, cước thực, CTA "Truyền tống đến…"; đi bộ tới trạm khác với truyền tống; biết tên trạm không có nghĩa đủ điều kiện; drawer không tự mở khi chọn node, quản lý focus, có nút đóng và trả focus. |

### Trợ năng, chữ, chuyển động

| ID | Rule |
|---|---|
| UI-LM-050 | Bàn phím: phím mũi tên chọn hướng chỉ khi control bản đồ có focus (không di chuyển, không bắt phím trong ô nhập); Tab tới CTA; Enter cam kết; Escape hủy preview/đóng sheet. Screen reader nhận hướng, dải khoảng cách, cước ước tính và kết quả thực, không đọc lại cả bản đồ mỗi khung. Có nút căn giữa và thước tỉ lệ theo zoom. |
| UI-LM-051 | Tương phản: chữ thường ≥4.5:1, chữ lớn/control thiết yếu/focus ≥3:1, đo trên nền minh họa. Thân 16–18px (line-height 1.55–1.7), nhãn bản đồ 13–14px, không gì thiết yếu ở 11px; dòng truyện ≈55–75 ký tự. Tiêu đề serif đủ tiếng Việt (Noto Serif, Georgia); thân/dữ liệu sans (Noto Sans, system-ui); font trang trí chỉ cho tiêu đề ngắn; font đóng gói hoặc fallback, không bắt buộc font mạng. Không VIẾT HOA văn dài; letter-spacing tiêu đề 0.04–0.08em, nhãn nhỏ ≤0.04em. |
| UI-LM-052 | Nút: bo panel 8px, control 6px, viền 1px; CTA chính cao ≥48px, rộng hết panel; nút hướng ≥44px; focus ring 2px offset 3px; disabled dùng nền nổi + chữ mờ + lý do bằng chữ (không làm mờ cả nút); đang xử lý khóa gửi lại mà không xô layout. |
| UI-LM-053 | Chuyển động: hover 120–180ms; disclosure 180–220ms không mất focus; pan camera cần thiết 200–300ms, không overshoot; không animation force-layout liên tục, không chấm nhấp nháy mạnh, không rung/flash/méo chữ gắn với Thanh Tỉnh. Reduced motion tắt pan tween và sương trang trí nhưng giữ mọi cập nhật trạng thái. |
| UI-LM-054 | Token màu (dự phòng bề mặt, không ghi đè màu node gameplay): canvas `#080F10`, surface `#111C1C`, surface-raised `#182727`, surface-hover `#213333`, border `#344443`, brass-muted `#796846`, brass `#C8AD6F` (hover `#DBC38B`, active `#B69A5D`, on-brass `#17150E`), text `#E8E0CC` / secondary `#AFBDB7` / muted `#8F9F99`, jade `#72AAA4`, focus `#9AE0D7`, warning `#E4B965` trên `#292316`, danger `#E28A80` trên `#2A1818`, node-unknown `#A8B4AE`; overlay có thể tới fill `rgba(200,173,111,0.10)`, viền đứt `rgba(200,173,111,0.70)`. Ornament chỉ ở góc ngoài; texture panel ≤3–6% opacity. |

## Acceptance

| ID | Rule |
|---|---|
| UI-LM-060 | Không bàn cờ, lưới chấm nền hay cây phân cấp thay cho địa lý; layout rải seeded giữ nguyên khi mở lại/đổi hướng/zoom; hướng chính đúng; cước tính từ tọa độ thế giới. |
| UI-LM-061 | Mỗi hướng: tiêu đề/CTA/danh sách/highlight đồng bộ và dùng tập node của hướng đó; chuyển Tây → Nam → Bắc không đổi vị trí, RNG, đồng hồ, tài nguyên; phản hồi Tây đến muộn không ghi đè preview Bắc; pan/zoom/căn giữa không tạo di chuyển. |
| UI-LM-062 | Một lần Khởi hành từ bất kỳ bề mặt nào tạo đúng một action và một lần trừ cước; không tự đi tiếp khi tới; sau di chuyển tập được tính lại; chấm chồng lấn vẫn trả đúng `nodeId`. |
| UI-LM-063 | Trước khi cam kết, preview **chỉ** hiện tập chốn có thể tới và khoảng min–max (cước trình, thể lực); **ẩn ứng viên đã được engine chọn trước**. Hợp đồng dữ liệu/hiển thị: (1) UI chỉ đọc `movementDirectionPublicPreview` ([MAP-LC-020](../map/movement-and-cost.md)), không gọi `movementCandidatePreview`, không đọc `index`, `commitmentKey`, `travelPlan` từng ứng viên; (2) vùng tô bất quy tắc bao mọi `targets[]` như nhau (vị trí chiếu theo MAP-LC-003) — không `preview-selected`, không tuyến `preview-edge` riêng, không nút "Ứng viên n"/"Khám phá n", không thuộc tính `data-map-candidate-index`; (3) node `known` hiện bằng chấm/tên sẵn có (UI-LM-010 mục 2), `known = false` chỉ góp vào vùng tô và một dòng "Còn những chốn chưa rõ" (không đếm số); (4) khoảng hiển thị `Cước trình {minDays}–{maxDays} ngày · Thể lực {minStamina}–{maxStamina}` (min = max thì một giá trị); thiếu thể lực theo `maxStamina` → CTA disabled kèm "Thiếu {n} thể lực"; (5) `aria-label`/tooltip chỉ ở cấp nhóm ("Những chốn có thể tới về phía Bắc: {tên}"), không có tọa độ, "Oxy", tên đích đơn lẻ hay số liệu riêng của một ứng viên. Không công thức/RNG/từ "ô" trên UI chính; màn hẹp, bàn phím, zoom, reduced motion đều dùng được; trạng thái không chỉ bằng màu. **Kiểm thử:** với cùng state, ép `movementCommitments` chọn index 0 rồi index 3 (hoặc đổi `meta.turn` đổi seed chọn) → HTML preview (kể cả `aria-label`, `title`, `data-*`) giống hệt nhau; HTML không chứa `preview-selected`, `data-map-candidate-index`, `Ứng viên`, `Khám phá `. |

Gate: `verify_ui_surface_contract.js`, `verify_browser_ui_contract.js`, `verify_ui_variant_render_matrix.js`, `verify_local_movement_weather.js`, `verify_map_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| UI-LM-001 | ui.js: local map shell (`local-map-title`) | Lệch — chưa có nút Thiên Đồ trong header |
| UI-LM-010, 063 | ui.js:`renderLocalMap` (`previewPoints`, `previewRoutes`, `previewNodes`: `preview-selected`, `data-map-candidate-index`, nhãn "Ứng viên n"/"Khám phá n", tọa độ Oxy trong `aria-label`, `travelPlan` ứng viên chốt); ui.js: direction cards dùng `movementCandidatePreview` → `travelPlan.toNodeId`; engine.js:`movementDirectionPublicPreview` (thiếu) | Lệch — mỗi hướng hiện tên đích đã chọn trước và số liệu riêng của nó (cả trong `aria-label`) |
| UI-LM-011 | ui.js: `ĐỔI VỀ PHÍA …` / `… HÀNH` | Thiếu — chưa có CTA `Khởi hành về <Hướng>` và `Thôi xét` |
| UI-LM-020 | ui.js: `routeDetail`, `multiplierLabel` (không còn "ô/lệch/×hệ số") | Khớp (2026-10-22) |
| UI-LM-021 | ui.js: nút `Dữ liệu hành trình ›` mở `act_ban_do` | Lệch — sai nhãn ("Dữ liệu"), không phải disclosure, không có khoảng min–max |
| UI-LM-022/023 | engine.js:`movementCandidatePreview` (reason "Đã tới rìa thế giới theo hướng này.") | Lệch — câu khác chuẩn; chưa có bộ câu thời tiết |
| UI-LM-030, 032 | ui.js:`renderLocalMap` | Thiếu — chưa có "Bạn ở đây"/danh sách tên mobile (không thấy chuỗi) |
| UI-LM-041 | ui.js: chỉ còn "Quan sát" → `act_nhin` | Khớp (2026-10-22) |
| UI-LM-042 | ui.js: `Truyền tống · N điểm đã mở` với N = `visited.length` | Lệch — N đếm cả đích không hợp lệ; câu rỗng khác chuẩn |
| UI-LM-013 | main.js:`submitActionId` → engine `move` | Khớp |
| UI-LM-012 | — (không có `Về chỗ đứng`) | Thiếu |
