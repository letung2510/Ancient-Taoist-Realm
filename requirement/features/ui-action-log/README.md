# UI & Action Log

## Phạm vi

Giao diện người chơi: khung màn hình và panel, action surface (thu thập/ưu tiên/đóng gói action, thực thi một lần), nhật ký văn tiểu thuyết, bề mặt bản đồ Lân Cận, modal/xác nhận và quy tắc chữ tiếng Việt. Không định nghĩa luật gameplay (di chuyển, combat, Công Pháp, tổ chức…): UI chỉ trình bày kết quả resolver của engine. Đồng hồ game, save, hiệu năng thuộc [data-runtime](../data-runtime/README.md); tương tác tổ chức/tông môn thuộc [cross-system](../cross-system/README.md).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Bố cục, panel ghim, phân bổ tab | [layout-and-panels.md](layout-and-panels.md) | `UI-LAY-` | ui.js: pinned mount, `renderStructureOwnershipPolicy`; main.js:`updateClockDisplay` |
| Action surface và độ ưu tiên | [action-surface-and-priority.md](action-surface-and-priority.md) | `UI-ACT-`, `UI-ACT-DEDUP-` | engine.js:`resolveActions`, `resolveActionPriority`, `resolveActionSurfaces`, `talkActions`; main.js:`enqueueAction`, `submitActionId` |
| Nhật ký tiểu thuyết | [novel-log.md](novel-log.md) | `UI-LOG-` | engine.js:`emitEvent`, `pushHistory`, `createGameEvent`, `novelLogParagraphs`, `renderScene`, `formatPlayerLogText`, `narrativeSafe` |
| Bản đồ Lân Cận (giao diện) | [local-map-ui.md](local-map-ui.md) | `UI-LM-` | ui.js: local map shell, `renderLocalMap`; engine.js:`movementCandidatePreview` |
| Modal và xác nhận | [modals-and-confirmations.md](modals-and-confirmations.md) | `UI-MOD-` | main.js:`commitTechniqueAction`, confirm handlers |
| Văn bản, định dạng, tiếng Việt | [i18n-text-rules.md](i18n-text-rules.md) | `UI-TXT-` | i18n.js:`format*`; engine.js:`playerFacingReason`, `repairMojibakeText` |

## Phụ thuộc

- [map](../map/README.md) — logic Lân Cận, ứng viên di chuyển, cước trình (`MAP-LC-*`).
- [technique](../technique/README.md) — giá Cấm Thuật, Prepare/Channel/Commit (TEC-100…108, TEC-130, TEC-161).
- [data-runtime](../data-runtime/README.md) — đồng hồ, retention history/archive, profile hiệu năng.
- [cross-system](../cross-system/README.md) — tổ chức, Đại Hội, tiến hóa, khế ước… (nội dung các panel).
- [world-simulation](../world-simulation/README.md), [npc](../npc/README.md), [weather](../weather/README.md) — producer log dùng chung gateway.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | Preview hướng đi chỉ hiện tập chốn có thể tới + khoảng min–max cước/thể lực; **ẩn ứng viên engine đã chọn trước** (thay bản cũ "không hiện đích như chắc chắn"). | UI-LM-021, UI-LM-063 |
| 2026-10-22 | Cấm Thuật bắt buộc danger sheet inline **mỗi lần thi triển**; không dùng browser `confirm()` cho Công Pháp (loại bỏ phương án "xác nhận một lần mỗi phiên"). | UI-MOD-002 |
| 2026-10-22 | Nút Công Pháp bằng tiếng Việt: "Thi triển", "Tụ lực", "Vận công +25%", "Hủy". | UI-MOD-003 |
| 2026-10-22 | Xác nhận hệ thống ngoài Công Pháp (rời pending, bỏ nhiệm vụ, từ chối Mệnh, command expansion) giữ hộp xác nhận trình duyệt như runtime hiện tại. | UI-MOD-004, UI-MOD-010 |
| 2026-10-22 | Nhóm cảnh theo ngày + `sceneId` (+ node, + quan hệ nhân–quả); bỏ amendment 2026-09-16 "cả ngày một đoạn kể cả khi đổi node". | UI-LOG-010 |
| 2026-10-22 | Heading cảnh dùng `【<Player Clock>】` như runtime `renderScene`; bỏ dạng `[Năm…, Tháng… ngày… · Kỷ Nguyên…]`. | UI-LOG-011 |
| 2026-10-22 | Nhãn topbar theo runtime: "Nhân vật · …" và "Thái Thanh đại lục · …"; bỏ nhãn "Hành Trình"/"Thiên Đạo". | UI-LAY-002 |
| 2026-10-22 | Nhãn "Dị Chí" bị cấm; sổ khám phá là tab Cổ Tịch, biên niên là Thế Sự (thay mục "Đặc Biệt thêm Dị Chí" của spec SYS). | UI-TXT-008, UI-LAY-020 |
| 2026-10-22 | Hệ thống tương tác tổ chức và Tông Môn Đại Hội (trước nằm lẫn trong file UI, nguồn archive mất dấu) chuyển sang cross-system. | CSX-ORG-*, CSX-TRN-* |
| 2026-10-22 | Catalog Công Trình/validate catalog thế giới (trước nằm trong file UI) chuyển sang data-runtime/cross-system. | DATA-VAL-005, CSX-STR-* |
| 2026-10-09 | Lân Cận V2.5 (D01–D15); vùng chạm 44×44px thay mức 12px của map. | UI-LM-* , UI-LM-031 |
| 2026-09-16 | Bỏ trường `priority: 0/1` đa mục đích; tách `tier/urgency/blocking/surface/category/enabled/consumesTurn`. | UI-ACT-001…007 |

## Gate

```powershell
node tools/verify_ui_surface_contract.js
node tools/verify_browser_ui_contract.js
node tools/verify_ui_variant_render_matrix.js
node tools/verify_log_narrative.js
node tools/verify_log_producers.js
node tools/verify_expansion_log_matrix.js
node tools/verify_legacy_log_matrix.js
node tools/verify_action_dispatch_matrix.js
node tools/verify_technique_channel_matrix.js
node tools/verify_local_movement_weather.js
node tools/verify_utf8_integrity.js
node tools/run_regression_suite.js
```
