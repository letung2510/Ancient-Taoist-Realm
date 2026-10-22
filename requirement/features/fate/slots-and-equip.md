# Mệnh Số — Ấn ký và Mệnh Kho

## Mục đích

Quy định ô kích hoạt (Ấn ký), Mệnh Kho, dung lượng, trang bị/tháo/hoán đổi, phần thưởng chờ và hiến tế Mệnh.

## Dữ liệu & trạng thái

| State | Ý nghĩa |
|---|---|
| `state.player.fates[]` | ID Mệnh active (Ấn ký), tối đa `realm.activeSlots` |
| `state.fateInventory[]` | Mệnh Kho, không hiệu lực |
| `state.pendingFateReward` + `state.pendingFateRewards[]` | Phần thưởng chờ khi kho đầy (một đang hiển thị + hàng đợi) |
| `state.flags.fateSlotCapacity` | Dung lượng kho đã đạt (không giảm) |

## Rules

### FATE-SLOT-001 Chỉ active có hiệu lực
Mọi Mệnh trong `player.fates` đều tính stats/score/match/quan hệ/combo; Mệnh Kho bị loại khỏi mọi pipeline đó. Mô hình nhiều ô active được giữ (số ô theo cảnh giới). Mệnh Kho tách khỏi hành trang vật lý (không chiếm ô vật phẩm).

### FATE-SLOT-002 Dung lượng Mệnh Kho
`capacity = max(2 × số Mệnh active, 2 × realm.activeSlots, flags.fateSlotCapacity)`; giá trị được lưu lại nên không giảm khi tháo Mệnh hay render UI. Nhân vật mới: 5 active → 10.

### FATE-SLOT-003 Trang bị
`equipFateFromVault(vaultId, activeIndex?)`: không chỉ định ô thì dùng ô trống; mọi ô đầy → trả `requiresReplacement` và UI yêu cầu chọn Mệnh active để thay. Thay thế = hoán đổi: Mệnh cũ về đúng vị trí của Mệnh mới trong kho.

### FATE-SLOT-004 Tháo
`storeFateToVault(activeIndex)`: ô trống → blocker; kho đầy → blocker "Mệnh Kho đã đầy"; thành công thì Mệnh vào kho, giữ nguyên quan hệ/enhancement.

### FATE-SLOT-005 Preview hoán đổi
`fateSwapPreview` trả Mệnh vào/ra, `computeFate`, `computeStats` và `pathMatchSummary` trước/sau; UI hiển thị trước khi xác nhận.

### FATE-SLOT-006 Mệnh Kho đầy
`receiveFate(state, fateId, { source, allowPending })` khi `fateInventory.length ≥ capacity`:
| `allowPending` | Hành vi |
|---|---|
| `true` | Tạo pending `{ fateId, source, createdAtTurn }` (kết quả `{ added: false, pending: true }`); đã có pending thì xếp hàng; không xếp trùng `fateId` |
| `false`/thiếu | Trả `{ added: false, vaultFull: true, reason: "Mệnh Kho đã đầy; hãy giải phóng một ô rồi thử lại." }`. **Không bao giờ** thay Mệnh trong kho (xóa nhánh "thay Mệnh tương hợp thấp nhất") |

Phân loại nguồn (mọi call site `receiveFate` phải nằm trong đúng một nhóm):
| Nhóm | Nguồn | `allowPending` | Xử lý kho đầy |
|---|---|---|---|
| Phần thưởng | combat/tinh anh, manh mối bản đồ, cơ duyên online, đột phá, nhiệm vụ, chọn Con Đường, Công Đức, Nghịch Thương Nhân, Dung Hợp, `grantCanonicalReward` | `true` | pending |
| Giao dịch trả trước | mua Phường Thị/chợ đen (`buyMarketOffer`, `buyFateAtMarket`), Hư Thiên Đỉnh (`refineAtVoidCauldron`), Khâm Thiên Giám (`sacrificeLifespanForFate`) | `false` | **kiểm tra kho trước khi trừ bất kỳ tài nguyên nào**; đầy → blocker "Mệnh Kho đã đầy; hãy giải phóng một ô rồi thử lại.", không trừ gì, không tiêu nguyên liệu (nếu vẫn nhận `vaultFull` sau khi trừ thì hoàn đủ như trước khi gọi) |
| Hiến tế Mệnh | `sacrificeFate` | `false` | luôn còn ô vì Mệnh hiến tế rời kho trước; lỗi thì trả Mệnh về đúng vị trí cũ |

### FATE-SLOT-007 Giải quyết pending
`resolvePendingFateReward(replaceVaultId?)`: kho còn chỗ → thêm; kho đầy → bắt buộc chọn Mệnh trong kho để thay (Mệnh bị thay bị loại). `dismissPendingFateReward` từ chối có log. Sau mỗi thao tác, pending kế tiếp trong hàng đợi được đưa lên.

### FATE-SLOT-008 Hiến tế Mệnh
`sacrificeFate(fateId)` chỉ cho Mệnh trong kho, cần đã chọn Con Đường có bảng liên kết, cấm Ngoại Đạo Giả. Triệu hoán Mệnh chưa sở hữu có `fateCompatibility ≥ 3` cao nhất (hòa thì điểm Mệnh cao hơn); không có ứng viên → blocker, state không đổi. Nhận thất bại → trả Mệnh hiến tế về vị trí cũ. Thành công trừ 5 SAN.

### FATE-SLOT-009 Invariant
`validateFateInventory()` chạy trong `updateDerived`: không trùng ID giữa active/kho, mọi ID tồn tại trong catalog, `active ≤ activeSlots`, `kho ≤ capacity`. Vi phạm thì cảnh báo `[FateInvariant]`, không tự xóa Mệnh.

### FATE-SLOT-010 Giao dịch nguyên tử
Mọi action Mệnh: kiểm tra blocker → snapshot (kho, instance, pending, Tinh Hoa Dư, tài nguyên) → commit một lần → lỗi thì rollback toàn bộ và trả blocker đọc được → ghi log sau commit. Vật phẩm trừ theo `quantity` thực tế.

## UI

Xem [ui.md](ui.md): thẻ kho ghi "Không kích hoạt · Không cộng chỉ số", pending banner có nút thay/từ chối.

## Acceptance

- Mệnh Kho không đổi stats/score/match/combo.
- Kho đầy không làm mất Mệnh: pending hoặc từ chối trước khi trừ chi phí. Capacity 10, kho 10/10: nhận phần thưởng Mệnh → `pending`, kho không đổi; `buyFateAtMarket` → `vaultFull`, Linh Thạch giữ nguyên; `refineAtVoidCauldron` → blocker, nguyên liệu giữ nguyên; kho còn 1 ô → vào kho bình thường. Không có trường hợp nào Mệnh trong kho bị thay.
- Hoán đổi giữ đúng vị trí và có preview trước/sau.
- Save/load giữ active, kho, pending, capacity.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-SLOT-001 | `js/engine.js:computeStats`, `computeFate` (chỉ duyệt `fates`) | Khớp |
| FATE-SLOT-002 | `js/engine.js:fateVaultCapacity` | Khớp |
| FATE-SLOT-003 | `js/engine.js:equipFateFromVault`, `swapFateFromVault` | Khớp |
| FATE-SLOT-004 | `js/engine.js:storeFateToVault` | Khớp |
| FATE-SLOT-005 | `js/engine.js:fateSwapPreview` | Khớp |
| FATE-SLOT-006 | `js/engine.js:receiveFate` (nhánh không pending tự thay Mệnh kho tương hợp thấp nhất — xóa); call site không `allowPending`: `buyMarketOffer`, `buyFateAtMarket`, `refineAtVoidCauldron`, `sacrificeLifespanForFate`, `sacrificeFate` (thêm kiểm tra kho trước khi trừ) | Lệch |
| FATE-SLOT-007 | `js/engine.js:resolvePendingFateReward`, `dismissPendingFateReward` | Khớp |
| FATE-SLOT-008 | `js/engine.js:sacrificeFate` | Khớp |
| FATE-SLOT-009 | `js/engine.js:validateFateInventory` | Khớp |
| FATE-SLOT-010 | `js/engine.js:buyMarketOffer`, `mergeFates` (snapshot/rollback) | Khớp |
