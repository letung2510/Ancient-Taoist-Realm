# Profession — Nghề Ẩn

## Mục đích

Nghề phụ ngoại lệ chỉ mở qua chuỗi Cổ Tịch Tà Thần I–VII (bảy nghề, tối đa một active ở slot phụ) và Nghề Ẩn Luân Hồi Tiên gắn Mệnh ẩn. Con Đường Ẩn (Cổ Thần Tàn Hồn) ở [../path/path-variants.md](../path/path-variants.md).

## Dữ liệu & trạng thái

```js
state.codexState[codexId] = { id, status: "unknown"|"revealed"|"verified"|"collected", clues: [], firstSeenDay, collectedDay, regionId }
state.discoveries.codexClues["trace:"|"lore:" + codexId] = { codexId, source, day, confidence, verified }
state.hiddenProfessionGraph[professionId] = { schemaVersion: 2, requiredCodex, nodes: [lead, crosscheck, unlock], failure: { san: -2, result: "false_clue" } }
state.hiddenProfessionState = { clues: { "<id>:<node>": {...} }, branches: {}, attempts: {}, failures: [{ key, day, retryDay, consequence }], unlocked: { [id]: { day, clueKeys } } }
state.hiddenProfessionActions[id] = { uses, lastUseDay, lastResult }
```
Catalog: `data/expansion_data.js:codexDefinitions`, `hiddenProfessions` (entry không có `kind: "tu_tich"`).

## Rules

### PROF-HID-001 Nguồn duy nhất
Nghề Ẩn không xuất hiện ở màn chọn đường/nghề thường và không được roll. Cổ Tịch Tà Thần chỉ tác động `secondaryId`; không mở Nghề chính, không mở Con Đường Ẩn. Cổ Thần Tàn Hồn là hệ vật phẩm khác, không thay thế Cổ Tịch.

### PROF-HID-002 Bảy mảnh Cổ Tịch
| Mảnh | Đại vực (`mapId`) | Mở Nghề Ẩn | Cần số mảnh đã thu |
|---|---|---|---:|
| `ta_than_codex_01` (I) | `trung_vuc` | `nguoi_giai_mong` | 1 |
| `ta_than_codex_02` (II) | `nam_chuong` | `doc_gia_co_tich` | 2 |
| `ta_than_codex_03` (III) | `bac_nguyen` | `nguoi_dan_duong` | 3 |
| `ta_than_codex_04` (IV) | `vo_tan_hai` | `tho_san_di_trieu` | 4 |
| `ta_than_codex_05` (V) | `tay_mac` | `nguoi_giu_cua` | 5 |
| `ta_than_codex_06` (VI) | `thien_khong_vuc` | `thay_tuong_menh` | 6 |
| `ta_than_codex_07` (VII) | `u_minh_gioi` | `hanh_gia_vo_danh` | 7 |

Đúng một mảnh mỗi đại vực, không trùng vùng. Thu đủ 7 mảnh chỉ hoàn tất bộ (thành tựu "Bảy Quyển Tà Thần"), không tự chọn nghề, không tự tăng mastery, không mở Con Đường Ẩn.

### PROF-HID-003 Chuỗi thu thập mảnh
`inspectCodex(state, codexId, action)` chỉ hợp lệ khi đang ở đúng đại vực: `investigate` → trace chưa xác minh (độ tin 0,45, mảnh `revealed`) → `read` văn tự (độ tin 0,7) → `decrypt` (`verified`, độ tin 1) → thu thập (`collected`). Một lần Tìm Kiếm chỉ tạo dấu vết, không trả thẳng Cổ Tịch, `secondaryId` hay quyền mở nghề; thiếu bước nào thì không thu thập được.

### PROF-HID-004 Đồ thị mở nghề
`hiddenProfessionClue(state, professionId, nodeId)`, ba nút theo thứ tự:
- `lead` (Cổ Tịch) — cần đủ số mảnh `requiredCodex`.
- `crosscheck` — cần đã có `lead` và thỏa điều kiện loại nút: NPC đã ghi nhận / ≥ 2 địa điểm / chứng kiến biến cố / thiên tượng khác Quang Đãng / một Mệnh tới Giao Cảm / bắt sống-thuần hóa Dị Thú / một ký ức quan hệ; mỗi nghề dùng loại khác nhau, không dùng ba lần tìm kiếm cùng node.
- `unlock` (giải mật) — cần đã đối chiếu đủ hai nguồn; thành công ghi `unlocked[id]`, nghề ở trạng thái dormant.
Mỗi lần thử có 18% là manh mối giả: −2 SAN, khóa thử lại tới ngày hôm sau, không mất clue đã xác minh. Clue trùng bị từ chối.

### PROF-HID-005 Registry bảy Nghề Ẩn
| Cổ Tịch | ID | Tên | Action / chi phí / hồi | Passive (chỉ khi active) | Hiệu ứng action |
|---:|---|---|---|---|---|
| I | `nguoi_giai_mong` | Người Giải Mộng | Giải Mộng / 2 SAN / 3 ngày | Hao SAN ×0,95 | +6 SAN |
| II | `doc_gia_co_tich` | Độc Giả Cổ Tịch | Chú Giải Cổ Văn / 3 SAN / 3 ngày | Độ tin clue +0,15 | Một clue Cổ Tịch chưa xác minh +0,25 độ tin |
| III | `nguoi_dan_duong` | Người Dẫn Đường Dị Giới | Định Tuyến Dị Lộ / 5 Thể Lực / 2 ngày | Rủi ro di chuyển −0,05 | Dẫn đường 3 ngày |
| IV | `tho_san_di_trieu` | Thợ Săn Dị Triều | Truy Dấu Dị Triều / 8 Thể Lực / 2 ngày | Phần thưởng tìm kiếm ×1,08 | Truy săn 3 ngày |
| V | `nguoi_giu_cua` | Người Giữ Cửa | Niêm Phong Giới Môn / 10 Linh Khí / 5 ngày | Tỷ lệ chạm trán ×0,92 | Phong ấn cổng 3 ngày |
| VI | `thay_tuong_menh` | Thầy Tướng Mệnh | Soi Mệnh Tuyến / 2 Công Đức / 4 ngày | Khí Vận +3 | Gợi ý thiên cơ 4 ngày |
| VII | `hanh_gia_vo_danh` | Hành Giả Vô Danh | Vô Danh Hành / 5 SAN + 5 Thể Lực / 7 ngày | Tu luyện ×1,08 | Gia trì tu luyện 3 ngày |

Mỗi Nghề Ẩn khai báo `professionId`, `unlockTrigger`, `requiredState`, `effects`, `costs`, `risks`, `mastery`, `disableRules`, `discoveryClue`. Biết/mở khóa không tự cộng chỉ số; passive/action chỉ hiệu lực khi nghề nằm ở `secondaryId`.

### PROF-HID-006 Thi triển
`useHiddenProfessionAction(state, professionId)`: nghề phải ở slot phụ; tôn trọng cooldown theo ngày; kiểm đủ mọi chi phí (SAN, Thể Lực, Linh Khí, Công Đức) trước khi trừ; ghi `hiddenProfessionActions`, cộng mastery.

### PROF-HID-007 Khóa slot phụ
Biết nhiều Nghề Ẩn được, nhưng `secondaryId` chỉ nhận một và khóa vĩnh viễn sau khi chọn. Ngoại Đạo Giả không mang Nghề Ẩn và ngược lại.

### PROF-HID-008 Dị Chí chỉ lưu clue
Clue Cổ Tịch nằm ở `discoveries.codexClues`/`hiddenProfessionClues`; Dị Chí không tự mở nghề hay thực thi hiệu ứng.

### PROF-HID-009 Luân Hồi Tiên — điều kiện
Nghề Ẩn đặc biệt gắn Mệnh độc quyền `luan_hoi_tien` (phẩm Tiên, roll ẩn lúc tạo nhân vật — [FATE-CD-007](../fate/progression-gates.md)). Kích hoạt khi đủ cả: sở hữu Mệnh `luan_hoi_tien`; hoàn thành quest "Ký Ức Qua Ba Kiếp" (`ky_uc_qua_ba_kiep`); cấp ≥ 5; có một Neo ổn định; chết tự nhiên do Thọ Nguyên về 0. Không kích hoạt do tự sát, bị giết, Cấm Thuật hay lạm dụng hồi sinh. Trình tự: Mệnh độc quyền → cấp tối thiểu → quest/Neo/tử vong → cảnh báo giá phải trả → commit vào save. Không ghi đè `realmId`.

### PROF-HID-010 Luân Hồi Tiên — hiệu ứng
Khi luân hồi: giữ Mệnh độc quyền, ký ức lõi, một Mệnh Khế và một phần Ngộ Tính; mất phần lớn vật phẩm, một phần Căn Cốt và tiến độ Công Pháp; tăng `rebirth_count`, giảm dần Thọ Nguyên cơ sở, mở biến thể nghề mới. Miễn toàn bộ hệ Tà Thần/trận doanh ([PATH-TG-001](../path/tainted-god.md)); thử thách cấp 14 tính là đạt ([PRG-BT-010](../realm-progression/breakthrough.md)).

## Acceptance

- Một lần Tìm Kiếm không trả Cổ Tịch hay quyền mở nghề; thiếu `lead/crosscheck/decrypt` không mở.
- Chỉ Nghề Ẩn đã hoàn tất đồ thị và đã có Nghề chính mới vào `secondaryId`.
- Luân Hồi Tiên không kích hoạt do tự sát, bị giết hoặc Cấm Thuật.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_dichi_deep.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PROF-HID-001 | `js/expansion.js:professionAvailability`, `isHiddenProfession` | Khớp |
| PROF-HID-002 | `data/expansion_data.js:codexDefinitions`, `hiddenProfessions.requiresCodex` | Khớp |
| PROF-HID-003 | `js/expansion.js:inspectCodex`, `codexProgress` | Khớp |
| PROF-HID-004 | `js/expansion.js:hiddenProfessionClue`, `hiddenClueRequirement`, `hiddenProfessionGraph` | Khớp |
| PROF-HID-005, 006 | `data/expansion_data.js:hiddenProfessions`, `js/expansion.js:useHiddenProfessionAction` | Khớp |
| PROF-HID-007 | `js/expansion.js:professionAvailability`; `js/engine.js:selectPath` | Khớp |
| PROF-HID-008 | `js/expansion.js:hiddenProfessionClues` | Khớp |
| PROF-HID-009 | `js/engine.js:processLuanHoi` chạy cho mọi nhân vật khi Thọ Nguyên = 0, không kiểm Mệnh/quest/cấp/Neo; `luan_hoi_tien` không có trong catalog `hiddenProfessions` | Lệch |
| PROF-HID-010 | `js/engine.js:processLuanHoi` (giữ 1 Mệnh cao nhất, reset Công Pháp; chưa có `rebirth_count`, Mệnh Khế, ký ức lõi) | Lệch |
