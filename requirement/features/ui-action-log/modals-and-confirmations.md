# UI & Action Log — Modal và xác nhận

## Mục đích

Quy tắc chung cho modal, overlay và bước xác nhận hành động có giá thật: khi nào phải xác nhận, dùng loại xác nhận nào, nội dung bắt buộc và bảo đảm không thực thi đôi.

## Dữ liệu & trạng thái

| Thành phần | Nội dung |
|---|---|
| Kết quả engine cần xác nhận | `{ success: false, requiresConfirmation: true, reason, preview }` |
| Lệnh xác nhận | Gọi lại cùng command với `{ confirmed: true }`; engine kiểm tra lại toàn bộ điều kiện |
| Danger sheet | Khối inline trong picker/modal liệt kê giá: SAN, Tà Nhiễm, Thọ Nguyên, HP, xác suất phản phệ, hậu quả faction/lời nguyền |

## Rules

| ID | Rule |
|---|---|
| UI-MOD-001 | Action nguy hiểm khai báo `danger`/`requiresConfirmation`. Engine trả `requiresConfirmation` kèm lý do/preview khi chưa xác nhận; UI chỉ gửi `{ confirmed: true }` sau khi người chơi xác nhận; engine validate lại trước khi trừ chi phí. Chi phí chỉ trừ sau validation đầy đủ. |
| UI-MOD-002 | Công Pháp thường không có bước xác nhận. **Cấm Thuật** (và mọi Công Pháp có giá thật: SAN/Thọ Nguyên/Tà Nhiễm > 0, backlash, `riskPct > 0`) bắt buộc hiện **danger sheet inline ở mỗi lần thi triển** (không nhớ theo phiên, không bỏ qua theo Công Pháp), liệt kê đủ giá ở bảng trên; nút xác nhận và **Hủy** nằm trong sheet. Không dùng `window.confirm()` cho Công Pháp. Luật giá/backlash: [technique](../technique/README.md) (TEC-108, TEC-130). |
| UI-MOD-003 | Nút phase Công Pháp bằng tiếng Việt: **Thi triển** (instant/commit), **Tụ lực** (Prepare), **Vận công +25%** (Channel), **Hủy** (Cancel); không hiện chữ "Channel"/"Prepare"/"Cancel". Hiện tiến độ vận công và lý do bị ngắt. Prepare chỉ hiện cho Công Pháp có `preparation.enabled`; không dùng `confirm()` cho Tụ lực. |
| UI-MOD-004 | Xác nhận hệ thống ngoài Công Pháp (rời node còn pending, từ bỏ nhiệm vụ, từ chối Mệnh chờ nhận, command `requiresConfirmation` của expansion) được dùng hộp xác nhận chuẩn của trình duyệt hoặc modal; nội dung phải là câu tiếng Việt nêu rõ hậu quả không hoàn tác. |
| UI-MOD-005 | Hành động hai bước nguy hiểm cao (ví dụ "Giải Thể Tiến Hóa" Mệnh) xác nhận hai lần; tà thuật thẩm vấn, nhánh Nghịch Diễn và thức tỉnh vật phẩm phải xác nhận một lần kèm cảnh báo hậu quả. |
| UI-MOD-010 | Rời node khi còn pending: thông điệp "Ngươi còn <loại> tại đây. Rời đi sẽ làm mất vĩnh viễn. Vẫn muốn rời đi?"; xác nhận → engine xử lý theo [UI-ACT-030](action-surface-and-priority.md). |
| UI-MOD-011 | Modal cơ duyên tranh đoạt hiện bốn lựa chọn thật (nhường / tranh / mưu / chia sẻ) với hậu quả dự kiến; contender và reward seed đã persist trước khi modal mở; chọn một lần theo `opportunity.id`. |
| UI-MOD-012 | Modal preview (tiến hóa Mệnh/Công Pháp, chuyển kiếp, đột phá, đấu giá, công thức luyện) gọi cùng resolver với runtime và **không mutate state**. Disabled reason liệt kê đủ điều kiện thiếu. |
| UI-MOD-013 | Overlay/modal: cuộn được trên mobile, có nút đóng, Escape đóng, quản lý focus và trả focus về phần tử mở; không tự mở khi chỉ chọn node/mục. |

## Acceptance

- Thi triển Cấm Thuật hai lần liên tiếp hiện danger sheet cả hai lần; Hủy không trừ gì.
- Công Pháp thường và Tụ lực không gọi `confirm()`.
- Gửi lại lệnh với `confirmed: true` khi điều kiện đã đổi bị engine từ chối.
- Gate: `verify_technique_channel_matrix.js`, `verify_random_boundaries.js` (backlash seed), `verify_action_dispatch_matrix.js`, `verify_browser_ui_contract.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| UI-MOD-001 | main.js: `result?.requiresConfirmation && confirm(...)` → `runExpansionCommand(..., { confirmed: true })` | Khớp |
| UI-MOD-002 | main.js:`commitTechniqueAction`; ui.js:`renderTechniqueDangerSheet`, `isDangerousTechniquePreview` | Khớp (2026-10-22) |
| UI-MOD-003 | main.js: `technique_prepare` (Cấm Thuật qua danger sheet, còn lại không hỏi); nhãn "Tụ lực"/"Vận công +25%" | Khớp (2026-10-22) |
| UI-MOD-004, 010 | main.js: confirm rời pending, từ bỏ nhiệm vụ, từ chối Mệnh | Khớp |
| UI-MOD-011 | expansion.js: `opportunity` command | Khớp |
| UI-MOD-012 | ui.js: `fateEvolutionPreview`, `techniquePreview` | Khớp |
