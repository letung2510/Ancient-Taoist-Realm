# Nguyên tắc chung & quyết định liên feature

Quyết định riêng của một feature nằm trong bảng “Quyết định đã chốt” của README feature đó. File này chỉ giữ nguyên tắc áp dụng cho mọi feature và quyết định schema/API cắt ngang nhiều feature. Trạng thái gap/evidence hiện hành: [STATUS.md](../STATUS.md).

## Nguyên tắc chung

| Nguyên tắc | Nội dung |
|---|---|
| Namespace tách biệt | Con Đường ≠ Nghề ≠ Tông Môn ≠ Dị Thể ≠ Mệnh. Không dùng tên Con Đường cho Nghề, không dùng Dị Thể cho Mệnh hoặc Nghề Ẩn. Alias legacy chỉ là input migration. |
| Resolver duy nhất | Mỗi đại lượng (cost, eligibility, influence, reward…) có một resolver; preview và commit dùng chung resolver, preview không mutation. |
| Transaction | Kiểm tra toàn bộ điều kiện trước khi mutate; commit nguyên tử; lỗi không để lại thay đổi một phần. |
| Idempotency | Action/reward/event có key ổn định; replay, load, offline catch-up không áp dụng lại. RNG gameplay dùng seed, không `Math.random()`/`Date.now()`. |
| Narrative tách stat | Log novel chỉ chứa narrative; số liệu nằm ở stat/DTO. Không lộ raw ID, tên hàm, field schema ra UI/log. |
| Save | Mọi state mới có `ensure`/migration, default trung tính, round-trip save/load và offline parity. |

## Checklist khi thêm feature/chức năng mới

Chỉ merge khi có: catalog/data schema; state schema + `ensure`/migration; pure resolver preview; action transaction + rollback; cross-system modifier (nếu có) khai báo ở [cross-system](../features/cross-system/README.md); narrative + stat người chơi thấy được; UI DTO/tab; save/archive round-trip; invariant/validator; test positive/negative/idempotency/offline; dòng Runtime mapping trong file chức năng.

## Định nghĩa hoàn tất của bộ requirement

- Người mới chỉ đọc `requirement/` biết feature nằm ở đâu, state nào, resolver nào, action nào, UI nào, save/migration ra sao ([cross-system-map.md](cross-system-map.md), [runtime-symbol-index.md](runtime-symbol-index.md)).
- Mọi feature ghi rõ phụ thuộc (README) và trạng thái runtime theo rule (Runtime mapping: Khớp/Lệch/Thiếu).

## Quyết định liên feature đã chốt

| Ngày | Quyết định | Feature |
|---|---|---|
| 2026-10-05 | `professionState.hiddenId` là slot Nghề Ẩn canonical; `professionState.secondaryId` và `player.hiddenProfession` là alias tương thích được đồng bộ; Nghề Ẩn không chiếm `primaryId`. | profession |
| 2026-10-05 | `hiddenProfessionState` sở hữu clue/unlock/attempt/branch/failure; `hiddenProfessionGraph` sở hữu discovery graph có version; không thay `professionState.hiddenId`. | profession, discovery |
| 2026-10-05 | Bề mặt ảnh hưởng MAP canonical là `computeMapInfluence`/`resolveMapInfluence`; owner, zone status, structure preview, faction-territory petition là adapter, không tính gradient thứ hai; owner suy ra từ ngưỡng. | map, world-simulation |
| 2026-10-05 | `Truyền Tống Trận` dùng type `waystation` (alias input `teleport_array`); `Hộ Giới Đại Trận` dùng `ward_formation` (alias `world_ward`); registry, build/repair/upgrade/dismantle và UI preview dùng chung định nghĩa. Công Trình thuộc tab Thế Giới. | map, world-simulation, ui-action-log |
| 2026-10-05 | `ERROR_NARRATIVE_MAP` là lớp dịch duy nhất từ producer code sang lời người chơi; log đã format không lộ identifier. | ui-action-log |
| 2026-10-05 | Chọn nghề chính khóa nghề thường ngay, có state; Nghề Ẩn là slot phụ; UI legacy không được mở lại lựa chọn. | profession |
| 2026-10-05 | Dị Thể là lớp thân thể/dị hóa, không phải path/profession. | di-the |
| 2026-10-05 | Quan hệ Mệnh `decayPolicy: "none"`; thời gian trong kho không đổi relationship state. | fate |
| 2026-10-05 | Log: narrative riêng, stat riêng, group theo scene; history cũ xử lý bằng migration/projection. | ui-action-log, data-runtime |
