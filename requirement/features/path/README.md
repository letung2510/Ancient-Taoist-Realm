# Path — Con Đường

## Phạm vi

Mười Con Đường chính, tương hợp Mệnh, chọn/chuyển/song tu đường, danh xưng 14 cấp theo đường, nghi thức đặc trưng, Nghịch Hành, Con Đường Ẩn (gồm Cổ Thần Tàn Hồn), lộ trình Ngoại Đạo Giả và hệ Tà Thần/trận doanh. Không định nghĩa cảnh giới/đột phá chung ([../realm-progression/README.md](../realm-progression/README.md)), Nghề/Nghề Ẩn ([../profession/README.md](../profession/README.md)) hay Dị Thể ([../di-the/README.md](../di-the/README.md)). `technique-core.md` tạm giữ rule Công Pháp (`TEC-CD-`) cho tới khi chuyển sang `technique/`.

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Chọn & duy trì Con Đường | [path-selection.md](path-selection.md) | `PATH-SEL-` | `js/engine.js:selectPath`, `pathMatchSummary`; `js/expansion.js:transitionSecondaryPath` |
| Danh xưng theo đường | [path-titles.md](path-titles.md) | `PATH-TTL-` | `js/engine.js:pathTitle`, `data/path_fate_relations.json:path_titles` |
| Nghi thức Con Đường | [path-rituals.md](path-rituals.md) | `PATH-RIT-` | `js/expansion.js:performPathRitualStep` |
| Nghịch Hành & Con Đường Ẩn | [path-variants.md](path-variants.md) | `PATH-VAR-`, `PATH-HID-` | `js/expansion.js:hiddenPathCatalog`, `resolveCoThanTanHonEncounter` |
| Ngoại Đạo Giả | [ngoai-dao-gia.md](ngoai-dao-gia.md) | `PATH-UNB-` | `js/engine.js:UNBOUND_TRIAL_DEFINITIONS`, `unboundTrialStatus` |
| Tà Thần & trận doanh | [tainted-god.md](tainted-god.md) | `PATH-TG-` | `js/engine.js:chooseTaintedAttention`, `chooseTaintedFaction`, `factionStatus` |

## Phụ thuộc

- [../realm-progression/breakthrough.md](../realm-progression/breakthrough.md) — cổng Đối Chiếu, thứ tự nghi thức, khóa cấp 14.
- [../fate/progression-gates.md](../fate/progression-gates.md) — điểm Mệnh, hiến tế Mệnh.
- [../fate/README.md](../fate/README.md), [../profession/README.md](../profession/README.md), [../di-the/README.md](../di-the/README.md), [../discovery/README.md](../discovery/README.md) (Dị Chí), [../cross-system/README.md](../cross-system/README.md).

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | `pathId` chuẩn giữ theo runtime (`kiem_dao`, `dan_dao`, `phu_dao`, `phong_thuy_dao`, `ngu_thu_dao`, `khoi_loi_dao`, `am_luat_dao`, `mong_canh_dao`, `luyen_the_dao`, `tinh_tuong_dao`); bộ ID mới (`di_hoa`, `thien_co`, `linh_van`, `thien_menh`, `dao_the`, `ta_am`…) chỉ là alias nhập liệu. Thay quyết định cũ "đổi trực tiếp pathId, không alias". Tên hiển thị theo `PATH_LABELS`. | PATH-SEL-001, PATH-SEL-002 |
| 2026-10-22 | Pool tag lead/support/forbidden theo `data/path_fate_relations.json` (3/3/2–3 tag); bỏ bảng "pool mở rộng" 5–6 tag. | PATH-SEL-001 |
| 2026-10-22 | `match_score` không có trần (ngưỡng dữ liệu tới 13); Mệnh vừa lead vừa forbidden thì forbidden thắng (phần lead của Mệnh đó = 0); `daoBonus +1` cộng vào `score` khi Đạo Tâm ≥ 80 và `rawScore ≥ 1`. | PATH-SEL-003 |
| 2026-10-22 | Song Tu và Dung Hợp hợp nhất thành một transition Con Đường phụ duy nhất (cấp ≥ 6, cost 20 Mệnh Tinh Hoa/15 Công Đức/10 SAN, affinity cap 0,75); bỏ mốc Dung Hợp cấp 10 "Thần Tính Lai" riêng. | PATH-SEL-011 |
| 2026-10-22 | Chuyển Đạo giữ EXP đã chốt (theo gap spec), bỏ "trước cấp 4 mất EXP"; từ cấp 4 thêm phá Mệnh Khế + Mệnh Nợ + tác động Neo. | PATH-SEL-012 |
| 2026-10-22 | Ngoại Đạo Giả luôn chọn được ở cấp 2 (trừ khi có nghề ẩn), thay "chỉ khi không có đường đạt điều kiện". Tên hiển thị giữ "Kẻ Vô Lộ — Ngoại Đạo Giả". | PATH-UNB-001 |
| 2026-10-22 | Nghi thức Con Đường không có biến thể chi phí Trả Giá theo đường (luôn 5 Thanh Tỉnh); profile chỉ đổi nội dung Dựng Neo/Vượt Dị Tượng. | PATH-RIT-005 |
| 2026-10-22 | Bốn Con Đường Ẩn Cổ Thần dùng ID runtime `cuong_ngon_gia`, `thuc_canh_su`, `huyen_anh_su`, `vong_nga_su` (thay `cuong_ngon_dao`, `thuc_canh_dao`, `huyen_anh_dao`, `vong_ngu_dao`). Tên "Tà Tịch" bị loại, thay bằng "Cổ Thần Tàn Hồn". | PATH-HID-004, PATH-HID-005 |
| 2026-10-22 | Áp giới hạn đồng thời 1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn. | PATH-HID-002 |
| 2026-10-22 | Hiệu ứng Tà Thần cấp 5 và hệ số phe theo runtime (Ban Phước PHY/MAG +3; Nghi Kỵ Sát −5 + phạt Stamina 15; Hờ Hững phạt Stamina 15; Thiên Đạo EXP ×1,05; Phản Bội đổi phe cần luân hồi + 10 Công Đức). | PATH-TG-003, PATH-TG-005, PATH-TG-007 |
| 2026-10-22 | Bỏ bảng "nghề ẩn khác" cũ (Kẻ Ghi Chép Tận Thế, Thần Quan Neo Nhân Tính, Kẻ Không Có Chân Danh, Ngục Tốt Nhân Quả, Thực Tử Giả, Mộng Du Tiên Nhân); nguồn ẩn chỉ còn Cổ Tịch (Nghề Ẩn) và Cổ Thần Tàn Hồn (Con Đường Ẩn). | PATH-HID-003 |

## Gate

`node tools/verify_review_batches.js` · `node tools/verify_dichi_deep.js` · `node tools/verify_progression_requirement_matrix.js` · `node tools/verify_game.js`
