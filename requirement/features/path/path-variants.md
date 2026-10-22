# Path — Nghịch Hành & Con Đường Ẩn

## Mục đích

Hai lớp biến thể của Con Đường: Nghịch Hành Đạo (biến thể đối nghịch của đường chính, trả giá vĩnh viễn) và Con Đường Ẩn (nhánh mở qua gameplay/Cổ Thần Tàn Hồn). Không lớp nào tạo slot Con Đường thứ ba.

## Dữ liệu & trạng thái

```js
state.pathState.variant          // null | "nghich_hanh_<id>"  (pathVariant)
state.pathState.hiddenPathId     // một Con Đường Ẩn active hoặc null
state.hiddenPathState = { status: "dormant"|"active", unlocked: {}, clues: { [pathId]: [] }, encounters: {} }
state.discoveries.hiddenPathClues[pathId]
state.player.pathDebt = [{ source, createdDay, permanent, ... }]   // ledger nợ Nghịch Hành/chuyển đường
state.player.fateDebt                                              // tổng nợ Mệnh
state.pathState.detachHistory = []
```

## Rules

### PATH-VAR-001 Nghịch Hành là biến thể
Nghịch Hành chọn ở cấp 2 hoặc chuyển hóa về sau; là `pathVariant` của đường chính, không phải Con Đường thứ 11, không phải nghề, không tạo `hiddenPathId`, không dùng `linkedTaThanId`, không xuất hiện trong catalog Con Đường Ẩn.

### PATH-VAR-002 Cổng và chi phí
`negative_path_gate = Total_Fate ≥ normal_gate + 25 AND lead_fates ≥ 2 AND contrary_fates ≥ 1`; `negative_cost = base_cost × (1 + fate_debt × 0.10)`; khi đang có Con Đường phụ (hybrid) cost thêm +25%. Xuất thân Hắc Đạo mở lựa chọn Nghịch Hành ngay ở cấp 2.

### PATH-VAR-003 Bảy biến thể
| Biến thể | Mệnh dẫn | Mệnh nghịch | Chi phí chính | Rủi ro thất bại |
|---|---|---|---|---|
| Sát Thần | sát, chiến, huyết | nghiệp, hung, diệt | Stamina tối đa −8%/nghi thức; SAN −3/boss | Hóa quái |
| Huyết Đan | đan, huyết, hỏa | độc, tử, hao mệnh | Khí Huyết −12%; Thọ Nguyên −2–8 năm | Chết hoặc mất phần lớn EXP cấp hiện tại |
| Thi Giải | thi, hồn, âm | tử, oán, vô danh | SAN tối đa −5; Khí Huyết −5% | Bị chiếm xác tạm thời |
| Phệ Mệnh | mệnh, đoạt, tham | phản, hung, vực | Corruption +8; tổn hại Mệnh mục tiêu | `FATE_BACKFIRE` |
| Tà Tụng | tà, tụng, ngoại | điên, mộng, vô danh | SAN −10; Corruption +12 | Bị Tà Thần đánh dấu |
| Khổ Hành | khổ, thể, cốt | đoạn, huyết, đau | HP hiện tại −15%; Stamina tối đa −5% | Thương tật vĩnh viễn |
| Vong Niệm | quên, vô, đoạn mệnh | tâm, hồn, gia | Mất ký ức và quan hệ NPC | Neo vỡ |

### PATH-VAR-004 Ledger nợ
Mọi giảm chỉ số vĩnh viễn lưu trong `pathDebt`, không reset khi đổi đường. `fateDebt` là tổng nợ Mệnh, `pathDebt` là ledger riêng Nghịch Hành/chuyển đường; mỗi entry có `source`, `createdDay`, `permanent`; một penalty chỉ ghi vào một ledger. `player.corruption`/`corruptionRating` là state canonical (mirror UI không phải nguồn). `hybridPath` giữ hiệu ứng nền, `pathVariant` giữ cost/phản phệ.

### PATH-HID-001 Con Đường Ẩn
Nhánh/biến thể mở qua gameplay, giữ tags/match nền của đường gốc (trừ ngoại lệ khai báo) và thêm điều kiện + cái giá riêng; không được thuần lợi so với gốc. Không roll lúc tạo nhân vật. Mỗi entry phải trả lời: rẽ nhánh từ đường nào (hoặc ngoại lệ độc lập), mở bằng field/cơ chế đã có nào, đánh đổi cụ thể là gì.

### PATH-HID-002 Vòng đời
Có thể biết nhiều Con Đường Ẩn `dormant`, chỉ một `hiddenPathId` active. Dormant không nhận hiệu ứng/nghi thức/danh xưng. Đổi Con Đường Ẩn phải qua nghi thức tháo Neo: trả 8 SAN, nhận 5 Corruption, ghi risk record vào `detachHistory`. Một nhân vật đồng thời giữ tối đa 1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn.

### PATH-HID-003 Registry
Một registry chung `hiddenPathCatalog()`; mỗi entry bắt buộc có `sourceType`: `co_than_tan_hon` (chỉ cho encounter Cổ Thần Tàn Hồn) hoặc `gameplay_trigger`. Mỗi entry khai báo `unlockTrigger`, `requiredState`, `effects`, `costs`, `risks`, `status`.

### PATH-HID-004 Bốn Con Đường Ẩn Cổ Thần Tàn Hồn
| ID | Cổ Thần liên kết | Hiệu ứng lõi | Cái giá vận hành |
|---|---|---|---|
| `cuong_ngon_gia` (Cuồng Ngôn Giả) | Vô Diện Cuồng Vương | Gây SAN Drain qua hội thoại/ý niệm | Người dùng cũng chịu SAN Drain |
| `thuc_canh_su` (Thực Cảnh Sư) | Thực Cảnh Đại Đế | Hấp thụ Corruption của node Dị Biến | Corruption chuyển vào nhân vật |
| `huyen_anh_su` (Huyễn Ảnh Sư) | Huyễn Sắc Cổ Thần | Tạo phân thân/ảo ảnh | Khó tăng danh vọng phe chính đạo |
| `vong_nga_su` (Vong Ngữ Sư) | Vong Danh Chi Chủ | Giao tiếp người/vật đã mất | Nguy cơ quên thông tin hoặc quan hệ |

Mỗi entry bắt buộc có `linkedTaThanId` riêng; không tạo nhánh thứ năm bằng cách sao chép hiệu ứng. Không phải nghề sinh hoạt, không chiếm slot nghề, không tự cấp mastery, không biến nhân vật thành tín đồ Tà Thần. Mở dấu vết: `hiddenPathClue(state, pathId, action)` khi đã thu thập đủ số Cổ Tịch `requiresCodex`; đủ 3 clue + `unlock` → active.

### PATH-HID-005 Encounter Cổ Thần Tàn Hồn
Không nằm trong hành trang, không tìm bằng Search thường. Điều kiện kết hợp ít nhất ba nhóm: khu vực/node đặc biệt; Corruption/world event/thời tiết; hành vi hoặc bộ Mệnh. Được xét khi vào node hoặc thời tiết chuyển `am_vu`, nhưng chỉ tạo encounter sau action chủ động "Lắng Nghe"; có thể không xuất hiện. Luồng: dấu hiệu → xác định Cổ Thần → tiếp cận/đối đầu → chọn → trả giá → ghi `hiddenPathId`.

| Lựa chọn | Kết quả | Cái giá |
|---|---|---|
| `seal` (Phong ấn) | Nhận clue sâu, Con Đường Ẩn vẫn dormant; kết thúc encounter vĩnh viễn | 5 SAN |
| `merge` (Dung hợp) | Con Đường Ẩn active | 5 SAN, Corruption +5, Neo bị đánh dấu |
| `devour` (Thôn phệ) | Biến thể mạnh/rủi ro cao, active | 5 SAN, Corruption +12, Mệnh Nợ/phản phệ hoặc `ELDRITCH_INTERVENTION` |

Mỗi Cổ Thần Tàn Hồn chỉ xử lý một lần/nhân vật; ghi `linkedTaThanId`, lựa chọn, cost, risk, trạng thái; cần ≥ 5 SAN để xử lý.

### PATH-HID-006 Con Đường Ẩn gameplay
| ID | Nguồn | Điều kiện | Đánh đổi |
|---|---|---|---|
| `ma_kiem_dao` (Ma Kiếm Đạo) | `kiem_dao` | Corruption ≥ 70 liên tục ≥ 30 ngày game khi đang đi Kiếm Đạo | Vượt Dị Tượng thành đối đầu bóng tà niệm; sát thương cao hơn gốc; Trả Giá trừ cả Khí Huyết lẫn Thanh Tỉnh |
| `vo_danh_dao` (Vô Danh Đạo) | Ngoại lệ độc lập | `origin.background = vo_danh` và chưa gia nhập thế lực nào tới cấp 8 | `match_score` luôn 0; hiệu ứng Cấm Kỵ Tri Thức đến sớm hơn 50% |
| `ta_than_khe_dao` (Tà Thần Khế Đạo) | Bất kỳ | Chọn "Lắng Nghe" cùng một Tà Thần đủ 5 lần | Nhận 1 Cấm Thuật độc quyền của Tà Thần đó; Đạo Tâm tối đa 50 |

`vo_danh_dao` không phải alias của `ngoai_dao_gia`.

### PATH-HID-007 Dị Chí chỉ ghi clue
Clue Con Đường Ẩn nằm ở `discoveries.hiddenPathClues` và hiển thị trong tab Dị Chí; Dị Chí không tự cấp hiệu ứng, không chạy nghi thức, không chứa bản sao catalog. Luồng: event/quest/action → clue → đủ điều kiện → unlock resolver → commit state. UI cảnh báo mơ hồ trước hành động sắp kích hoạt điều kiện mở khóa ("ngươi cảm thấy có gì đó đang thay đổi").

## Acceptance

- Nghịch Hành không tạo slot path mới; `pathDebt` tồn tại qua đổi đường và save round-trip.
- Encounter Cổ Thần xử lý lần hai trả `alreadyResolved`; `seal` không gán `hiddenPathId`.
- Không có hai Con Đường Ẩn active cùng lúc.
- Gate: `node tools/verify_dichi_deep.js`, `node tools/verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PATH-VAR-001..003 | `js/expansion.js:pathVariant` (chỉ đọc `pathState.variant`; không có cổng/catalog Nghịch Hành) | Thiếu |
| PATH-VAR-004 | `js/engine.js` (`pathDebt` chỉ serialize) | Thiếu |
| PATH-HID-002 | `js/expansion.js:hiddenPathStatus`, `detachHistory` (không có nghi thức tháo Neo) | Lệch |
| PATH-HID-003 | `js/expansion.js:hiddenPathCatalog` (fallback còn chứa `luan_hoi_tien` – vốn là Nghề Ẩn) | Lệch |
| PATH-HID-004 | `data/expansion_data.js:hiddenProfessions` (`kind: "tu_tich"`) → `hiddenPathDefinitions`; cả bốn cùng `linkedTaThanId: "ta_than_tien_trieu"`, tên không dấu | Lệch |
| PATH-HID-004 | `js/expansion.js:hiddenPathClue` | Khớp |
| PATH-HID-005 | `js/expansion.js:resolveCoThanTanHonEncounter` (một encounter chung `co_than_tan_hon`, gán `hiddenPathId = "co_than_tan_hon"`, không theo 4 Cổ Thần; chưa gắn trigger Lắng Nghe/`am_vu`) | Lệch |
| PATH-HID-006 | — | Thiếu |
| PATH-HID-007 | `js/expansion.js:hiddenPathClues`, `discoveries.hiddenPathClues` | Khớp |
