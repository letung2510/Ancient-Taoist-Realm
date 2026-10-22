# Công Pháp — UI

## Mục đích

Hiển thị Công Pháp cho người chơi: thẻ Công Pháp, action bar, nút theo phase, narrative. UI chỉ hiển thị DTO từ resolver (TEC-006 ở [execution.md](execution.md)). Quy tắc chung action surface/log thuộc [ui-action-log](../ui-action-log/README.md).

## Dữ liệu & trạng thái

DTO từ `techniquePreview`, `techniqueEligibility`, `techniqueFateResonance`; nhãn qua formatter tên hiển thị.

## Rules

| ID | Rule |
|---|---|
| TEC-010 | Tên hiển thị luôn qua formatter. Không để lọt raw ID, `guardian`, `guild_signature_x`, tên hàm, tên field schema (`techniquePrepareReceipts`…) hoặc object debug ra UI/log. |
| TEC-10B | Action bar chỉ chứa skill hợp lệ trong context, không trùng action giữa action bar và More; skill không dùng được nằm trong thẻ Công Pháp kèm blocker. Mất membership → ẩn guild skill khỏi action bar hoặc hiện blocker. `guild_signature` không được xuất hiện rồi trả “phải dùng qua action chuyên biệt”. |
| TEC-160 | Thẻ Công Pháp hiển thị: tên đã format; nguồn (Universal/Tự Lập/Con Đường/Nghề/Tông Môn/Tà Thần); category tiếng Việt; mastery; trạng thái ready/dormant/blocked + blocker; acquisition tiếp theo; ảnh hưởng đột phá; affinity Nghề/Đường tách riêng; Mệnh đang cộng hưởng + modifier tổng; thế thi triển; cost cuối cùng; cooldown riêng; target. |
| TEC-161 | Nút theo phase bằng tiếng Việt: `Thi triển` (chỉ bật khi `ready`), `Tụ lực`, `Vận công (chờ 1 lượt)` (TEC-CH-001), `Hủy`. Dòng trạng thái khi đang channel: `Đang tụ lực · Vận công {elapsed}/{required} lượt`; khi `ready`: `Đã tụ đủ lực · có thể Thi triển`; khi bị gián đoạn: `Tụ lực bị gián đoạn ({lý do: thoát giao chiến | rời nơi này | đã hủy})`. Không hiển thị phần trăm hay `+25%`. |
| TEC-162 | Narrative kết quả ngắn, vd. “Kiếm Khí Sơ Cấp đánh trúng … · -12 HP · còn 1 lượt hồi chiêu”. |

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-11 | Instant: inline picker, commit không modal | đúng TEC-101 | `verify_ui_surface_contract.js` |
| RG-18 | Action bar/More | không trùng action, không raw ID/hàm | `verify_action_dispatch_matrix.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-010 | expansion.js:`advanceTechniqueTrials` | Lệch | log “Thí Luyện Công Pháp ” + raw `id` |
| TEC-161 | ui.js: `techniqueChannelControls` ("Tụ lực", "Vận công +25%" + `data-expansion-arg2="0.25"`, "Hủy") | Lệch | nhãn Việt hóa (2026-10-22); còn nút `+25%` và dòng `%`, chưa theo lượt (TEC-CH-001) |
