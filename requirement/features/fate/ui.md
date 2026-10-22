# Mệnh Số — Giao diện

## Mục đích

Hợp đồng hiển thị và wiring action của panel Mệnh Số. UI chỉ đọc DTO/resolver của engine, không tự tính effect, match hay score. Quy ước chung về action surface/log: [../ui-action-log/README.md](../ui-action-log/README.md).

## Dữ liệu & trạng thái

DTO đọc từ: `fateRelationshipStatus`, `fateEnhancementLevel`, `fateEffectBreakdown`, `fateAdvancedActionCatalog`, `fateVaultSummary`, `fateSwapPreview`, `fateUpgradePreview`, `fateEvolutionEligibility`/`fateEvolutionPreview`, `pathMatchSummary`, `computeRelationshipEffects`.

## Rules

### FATE-UI-001 Thẻ instance
Mỗi thẻ mô tả instance đang sở hữu, không chỉ definition: tên, grade, sign (Cát/Bình/Hung), element, match `x/10 + nhãn`, điểm hiệu dụng (có Cường Hóa), effect đang áp dụng (modifier và conditional tách riêng), Cường Hóa +n, bậc quan hệ + điểm, số lần Dưỡng Mệnh/Cộng Minh, nguồn nhận (`fateInstances[id].source`), trạng thái Tiến Hóa (`status`/`branchId`), số lượt action nâng cao đã dùng/còn lại, cảnh báo Mệnh Nguội, trạng thái Trấn Mệnh.

### FATE-UI-002 Thẻ Mệnh Kho
Luôn ghi "Mệnh Kho · Không kích hoạt · Không cộng chỉ số"; hiển thị grade, nguồn nhận; nút Trang bị (hoặc Thay thế khi Ấn ký đầy, kèm preview trước/sau), chọn Dung Hợp, Nâng cấp. Header hiện `Sở hữu · Đang kích hoạt · Trong Mệnh Kho` và Tinh Hoa Dư.

### FATE-UI-003 Action theo ngữ cảnh
| Nút | Hiện khi | Gọi |
|---|---|---|
| Tháo xuống Mệnh Kho | Mệnh active | `storeFateToVault` |
| Dưỡng Mệnh | Mệnh active | `nurtureFate` |
| Cộng Minh | Mệnh active; disabled + lý do khi `stage ≠ 2` | `resonateFate` |
| Nâng cấp | Mọi Mệnh; disabled khi +5 | `upgradeFate` (qua preview) |
| Giác Ngộ | Đủ điều kiện FATE-REL-011, chưa reveal | `revealFateInsight` |
| Buông Mệnh | `stagnantDays ≥ 60` | `releaseStagnantFate` |
| Nghịch Mệnh | Mệnh Hung active, còn lượt | `defyFate` |
| Trấn Mệnh | Mệnh active, không đang bị Trấn | `suppressFate` |
| Mệnh Kiếp / Tiến Hóa | Đủ `fateEvolutionEligibility` / trial `ready` | expansion `fate_trial`, `fate_evolve` |
| Mệnh Đổi | Mệnh active `evolved` (blocker FATE-ADV-009 hiện cạnh nút) | overlay FATE-ADV-014 → `transformFate` (expansion `fate_transform`) |
| Thiên Cơ · Xem điềm | Luôn (global) | expansion `fate_omen` |

Nút bị khóa hiển thị lý do ngay cạnh nút; action chưa khả dụng không giả vờ thành công.

### FATE-UI-004 Quan hệ đang kích hoạt
Khối riêng liệt kê Tương Sinh (↔), Tương Khắc (⚡) và Combo đang active; rỗng thì ghi "Chưa có Tương Sinh, Tương Khắc hoặc Combo được kích hoạt."

### FATE-UI-005 Pending reward
Khi có pending: banner tên Mệnh + nguồn + số phần thưởng còn chờ, nút "Chọn Mệnh trong kho để thay" và "Từ chối".

### FATE-UI-006 Xác nhận và kết quả
Thao tác mất Mệnh/tài nguyên (hiến tế, dung hợp, Buông Mệnh, nhánh Nghịch Diễn) có modal nêu điều kiện, chi phí, thay đổi dự kiến, rủi ro, nút xác nhận/hủy. Kết quả phải nêu cụ thể chỉ số/điểm đã đổi (ví dụ banner `lastFateUpgrade`), không dùng thông báo chung chung.

### FATE-UI-007 Hai chế độ xem
Panel có chế độ "cơ thể" (paperdoll Ấn ký) và "lưới"; số ô theo `realm.activeSlots`.

## Acceptance

- Thẻ active và thẻ kho phân biệt rõ; thẻ definition không bao giờ hiển thị như instance active.
- Mọi nút gọi đúng resolver engine/expansion, không sửa state trực tiếp.
- Contract UI kiểm tra thẻ có metadata instance và action delegation (`tools/verify_ui_surface_contract.js`).

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-UI-001 | `js/ui.js` (fate panel, đọc `fateInstances`) | Khớp |
| FATE-UI-002 | `js/ui.js` (fate panel) | Khớp |
| FATE-UI-003 | `js/ui.js` (`data-fate-*`, `expansionButton('fate_omen')`); `js/main.js` (handler `data-fate-*`); `js/expansion.js` command map | Khớp |
| FATE-UI-004 | `js/ui.js` (`relation.activePairs`) | Khớp |
| FATE-UI-005 | `js/ui.js` (`pending-fate-banner`) | Khớp |
| FATE-UI-007 | `js/ui.js` (`data-fate-view`) | Khớp |
| FATE-UI-001 nhãn match | `js/ui.js` | Thiếu — xem FATE-RES-003 |
