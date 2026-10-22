# UI & Action Log — Văn bản, định dạng và tiếng Việt

## Mục đích

Mọi chữ người chơi thấy (log, alert, nút, modal, bản đồ, NPC, vật phẩm) là tiếng Việt UTF-8 hợp lệ, không lộ ID thô, mã lỗi hay từ kỹ thuật. Quy tắc văn tiểu thuyết của log: [novel-log](novel-log.md).

## Dữ liệu & trạng thái

| Thành phần | Nội dung |
|---|---|
| `window.GameI18n` (js/i18n.js) | `formatItemName`, `formatTechniqueName`, `formatFateName`, `formatQuestName`, `formatLocationName`, `formatActionLabel`, `formatStatus`, `formatElement`, `formatContract`, `formatHistory`, `playerClockLabel` |
| Engine | `clockLabel`, `worldClockLabel`, `playerFacingReason`, `repairMojibakeText`, `narrativeSafe` |
| DTO cho UI | `id` ổn định, `label`, `description`, `available`, `cost`, `disabledReason` |

## Rules

| ID | Rule |
|---|---|
| UI-TXT-001 | Không hiện ID thô của item, quest, Công Pháp, Mệnh, NPC, địa điểm, khế ước hay action. Mọi tên đi qua formatter trung tâm. |
| UI-TXT-002 | Formatter tách khỏi gameplay, có fallback tiếng Việt trung tính ("Vật phẩm chưa xác định", "Địa điểm chưa xác định"…) và không throw khi thiếu dữ liệu; không trả `undefined`/`null`/chuỗi rỗng. |
| UI-TXT-003 | Cơ chế dùng khóa ổn định (thời tiết, ngũ hành, trạng thái); UI chỉ hiện label/icon tương ứng. |
| UI-TXT-004 | **Ranh giới lỗi người chơi:** `playerFacingReason()` là boundary chung cho action `reason`, blocker và mã lỗi trước khi vào alert hoặc log: mã có trong `ERROR_NARRATIVE_MAP` dùng câu tương ứng; mã chưa map dùng câu trung tính có nghĩa; loại các từ namespace/canonical/validator/internal/payload và tên field; mảng blocker gộp thành một thông báo đọc được. Runtime/debug vẫn giữ reason kỹ thuật. Alert và log dùng cùng boundary. |
| UI-TXT-005 | Thông báo lỗi người chơi không chứa `SCREAMING_SNAKE_CASE`, tên field, `Depth`, `session`, `counter`, `state`, `cooldown`, `multiplier`; không thành chuỗi rỗng. |
| UI-TXT-006 | **UTF-8:** không đưa chuỗi byte legacy, marker mất mã hóa hoặc ký tự thay thế (U+FFFD) vào chữ người chơi. Chuỗi từ save cũ, payload NPC/event và dữ liệu ngoài bundle đi qua `repairMojibakeText` (boundary trong `narrativeSafe`) trước khi vào log/văn; chỉ sửa một lần trên đoạn nghi ngờ, không giải mã lặp tiếng Việt hợp lệ. Lỗi phải sửa ở nguồn, không che bằng CSS/thay thế tại UI. File runtime và requirement có mojibake là lỗi chặn phát hành. |
| UI-TXT-007 | Text kỹ thuật chỉ ở vùng debug, không chảy sang log người chơi. |
| UI-TXT-008 | Nhãn legacy **"Dị Chí"** bị cấm trong UI source. Sổ khám phá hiển thị là tab **Cổ Tịch**; biên niên thế giới là **Thế Sự**. |
| UI-TXT-009 | Văn bản người chơi nhập (dấu vết node, tên vật phẩm tự đặt) được escape HTML, giới hạn độ dài và không dùng làm sự thật gameplay. |
| UI-TXT-010 | Thành tựu, vật phẩm nghề, phần thưởng NPC và action mới phải có label tiếng Việt, migration và version khi thêm vào; vật phẩm mới ưu tiên tham chiếu item đã có trong catalog. |

## Acceptance

- Mọi formatter trả chuỗi tiếng Việt khi ID không tồn tại.
- `node tools/repair_mojibake.js` báo `Would update 0 files`; `verify_utf8_integrity.js` pass.
- `verify_ui_surface_contract.js` không tìm thấy "Dị Chí" trong UI source.
- Alert lỗi với mã đã map/chưa map đều ra câu có nghĩa.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| UI-TXT-001/002 | i18n.js:`formatItemName`, `formatTechniqueName`, `formatFateName`, `formatQuestName`, `formatLocationName`, `formatActionLabel`, `lookup` | Khớp |
| UI-TXT-004/005 | engine.js:`playerFacingReason`; main.js alert | Khớp |
| UI-TXT-006 | engine.js:`repairMojibakeText`, `narrativeSafe`; tools/repair_mojibake.js | Khớp |
| UI-TXT-008 | index.html tab `oddities` = "Cổ Tịch", `world` = "Thế Sự" | Khớp |
| UI-TXT-002 | ui.js: Lân Cận dùng `displayNodeName(targetId)` fallback "Dã Lộ Vô Danh" | Khớp |
