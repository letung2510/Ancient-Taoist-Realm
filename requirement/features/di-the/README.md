# Dị Thể

## Phạm vi

Thể chất đặc biệt (`specialPhysiqueState`): catalog, dấu mốc mở khóa, tiếp nhận có giá, giai đoạn, modifier, projection kết cục/thế lực và chính sách không tự khóa Con Đường/Nghề. Không bao gồm Linh Căn ([../character/README.md](../character/README.md)), Dị Chí/tri thức ([../discovery/README.md](../discovery/README.md)), Con Đường Ẩn ([../path/path-variants.md](../path/path-variants.md)) hay Nghề Ẩn ([../profession/hidden-professions.md](../profession/hidden-professions.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Catalog, tiến độ, tiếp nhận, giai đoạn, outcome | [special-physique.md](special-physique.md) | `DT-` | `js/expansion.js:SPECIAL_PHYSIQUE_CATALOG`, `recordSpecialPhysiqueProgress`, `claimSpecialPhysique`, `specialPhysiqueModifiers`, `specialPhysiqueOutcome`, `validateSpecialPhysiqueCatalog` |

## Phụ thuộc

- [../path/path-selection.md](../path/path-selection.md) — namespace `pathState` (PATH-SEL-010).
- [../profession/profession-list.md](../profession/profession-list.md) — namespace `professionState`.
- [../path/tainted-god.md](../path/tainted-god.md) — chi phí "Tà Thần chú ý" của Thánh Thể.
- [../realm-progression/exp-and-cultivation.md](../realm-progression/exp-and-cultivation.md) — hệ số tích Đạo Tâm.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | Catalog, trigger, ngưỡng và cost theo runtime `SPECIAL_PHYSIQUE_CATALOG` (9 entry); thay các điều kiện mô tả cũ ("10 quest thiện liên tiếp", "5 Công Pháp khác hệ ở Tiểu Thành", "Luân Hồi Thất Bại đúng 1 lần"…) và lợi ích cũ ("+15% match_score trần", "+20% sát thương Quái Dị Biến"). | DT-CAT-001 |
| 2026-10-22 | "Độc bản server-wide" của Thiên Sinh Đạo Thể hiểu là độc bản trong một save (game single-player). | DT-CAT-001, DT-CLM-001 |
| 2026-10-22 | Áp giới hạn 1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn đồng thời (câu hỏi mở cũ). | DT-LIM-001 |
| 2026-10-22 | Nhãn "Dị Thể" thay "Dị Chí" cho thể chất; "Dị Chí" chỉ dành cho lớp khám phá. | DT-NS-001 |

## Gate

`node tools/verify_dichi_deep.js` · `node tools/verify_canonical_contracts.js`
