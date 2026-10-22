# Realm Progression — Nền tảng nhân vật (tạm giữ, thuộc `character/`)

> File này giữ các rule nền tảng nhân vật tách từ canonical Con Đường/Progression cũ. Toàn bộ rule `CHR-CD-*` thuộc phạm vi [../character/README.md](../character/README.md) và sẽ được chuyển sang đó; ID giữ nguyên khi chuyển.

## Mục đích

Mô hình lớp nhân vật, luồng tạo Player, chỉ số nền, SAN/Corruption, Neo Nhân Tính, trạng thái quyền năng, hành trình mở đầu (journey intent) và thứ tự xử lý mỗi lượt.

## Dữ liệu & trạng thái

| Field | Ý nghĩa |
|---|---|
| `player.origin { regionId, locationId, race, background, personality[2], hiddenGoal }` | Hồ sơ roll một lần |
| `player.basePhy/baseMag`, `aptitude` (Căn Cốt), `comprehension` (Ngộ Tính) | Chỉ số nền 1–100 |
| `player.hp` (Khí Huyết), `stamina`, `lifespan`, `san/maxSan`, `corruptionRating` | Sinh tồn |
| `player.anchors[] { id, type, source, npcId, stability, maxStability, status, integrity, broken, lastNurturedAt }` | Neo Nhân Tính |
| `player.journeyIntent`, `player.openingPlan { targetOrganizationId, targetOrganizationKind, … }` (mirror trong `flags`) | Hành trình mở đầu |
| `player.eventHistory[]` | Chi phí vĩnh viễn và lựa chọn không đảo ngược |

## Rules

### CHR-CD-001 Mô hình lớp
| Lớp | Chức năng | Không được thay thế |
|---|---|---|
| Cảnh giới | Độ sâu tồn tại, giới hạn quyền năng | Con Đường, Công Pháp |
| Con Đường | Cách biểu hiện quyền năng | Cảnh giới |
| Mệnh Số | Tư cách, thiên hướng, nhân quả | EXP, trang bị |
| Công Pháp | Kỹ thuật chiến đấu/tu luyện/nghi thức | Mệnh dẫn, điều kiện cảnh giới |
| Neo Nhân Tính | Giữ bản ngã | SAN |
| SAN | Sức khỏe tinh thần hồi phục được | Corruption |
| Corruption | Tha hóa dài hạn | SAN |
| Trận doanh | Lập trường Thiên Đạo–Tà Thần | Con Đường |
| Nghề ẩn | Luật ngoại lệ bổ sung | `realmId`, lịch sử Con Đường |

Sáu nguyên tắc: Mệnh Số mở cửa; Căn Cốt chịu tải; Ngộ Tính giải mã; Công Pháp là công cụ (không mở cảnh giới); quyền năng luôn có giá (Linh Khí, Stamina, SAN, Thọ Nguyên, Mệnh, ký ức, quan hệ, Corruption/Mệnh Nợ); Tà Thần là ngoại lệ thế giới, không phải "cấp 15". Nội dung mới phải khai báo thuộc lớp nào; không tạo hệ điểm trùng chức năng; giá trị cân bằng nằm trong config, invariant và thứ tự xử lý nằm trong code; ngoại lệ phải khai báo rõ và có test.

### CHR-CD-002 Luồng tạo Player
1. Chọn vùng khởi đầu. 2. Roll toàn bộ hồ sơ đúng một lần, không có nút gieo lại. 3. Gán cấp 1 Di Mệnh. 4. Roll chủng tộc theo trọng số vùng. 5. Roll PHY/MAG nền, Căn Cốt, Ngộ Tính, Linh Căn, 2 tính cách không trùng, xuất thân, mục tiêu ẩn. 6. SAN = 100/100; tính Stamina, Khí Huyết, Thọ Nguyên cơ sở. 7. Roll 5 Mệnh Số cơ bản ([FATE-CD-006](../fate/progression-gates.md)). 8. Roll độc lập Mệnh ẩn Luân Hồi Tiên ([FATE-CD-007](../fate/progression-gates.md)). 9. Cấp 2 Công Pháp Phàm nhập môn (1 Chiêu Thức + 1 Tâm Pháp), không mặc định là Công Pháp Cốt Lõi. 10. Tính chỉ số Mệnh, Final Stats, khởi tạo Mệnh Kho. 11. Lưu nhân vật cùng vùng/địa điểm rồi vào game.

### CHR-CD-003 Trọng số roll
- Căn Cốt, Ngộ Tính: phân bố chuẩn μ = 50, σ = 15, clamp 1–100.
- Linh Căn: Tạp (4–5 hệ) 50%; Song/Tam thường 35%; Đơn thuần 10%; Song/Tam hiếm 4%; Dị Linh Căn (Băng, Lôi, Phong, Âm, Dương, Không Gian) 1%. Thuật toán chi tiết: `rollSpiritualRootBranch`, `spiritualRootProfile`.
- Chủng tộc theo vùng (ví dụ): Đông Hoang Phàm Nhân Giới — Nhân 85 / Yêu 10 / Linh 4 / Cổ 1 / Ma 0; Bắc Nguyên Yêu Sương — 20 / 70 / 0 / 8 / 2.
- Tính cách (đúng 2, không trùng): Chính trực, Tàn nhẫn, Tham lam, Trung thành, Cơ trí, Lỗ mãng, Lãnh đạm, Nhiệt huyết, Xảo quyệt, Ẩn nhẫn.
- Mục tiêu ẩn (quyết định AI NPC; Player có thể để trống): Báo thù, Tìm cơ duyên, Bảo vệ môn phái, Trốn tránh quá khứ, Trường sinh.

### CHR-CD-004 Xuất thân
| Enum | Hiển thị | Hiệu ứng khởi đầu |
|---|---|---|
| `tong_mon` | Tông Môn | +Linh Thạch, mở NPC sư phụ, `path_score` +1 nếu Con Đường khớp môn phái |
| `the_gia` | Thế Gia | +thu nhập định kỳ, Neo `npc` người thân sẵn, dễ vướng Mệnh Khế gia tộc |
| `tan_tu` | Tán Tu | +5% EXP tự tu, không Neo khởi đầu |
| `hac_dao` | Hắc Đạo | +10% trọng số Mệnh Hung, mở sớm Nghịch Hành Đạo ở cấp 2 |
| `vo_danh` | Vô Danh | +tỷ lệ sự kiện Ngộ Đạo/nghề ẩn, không tổ chức/Neo khởi đầu |

Gia nhập tổ chức cụ thể là gameplay sau cấp 2 (CHR-CD-013), không phải bước tạo nhân vật.

### CHR-CD-005 Căn Cốt và Ngộ Tính
`body_resistance = aptitude + 0.5 × PHY + bonus_tam_phap`; `cultivation_exp_gain = base_exp × aptitude / 50`. `comprehension_check = comprehension + 0.5 × MAG + bonus_cong_phap`; `mastery_exp_gain = base_gain × (1 + comprehension / 100)`. Căn Cốt ảnh hưởng tốc độ tu luyện, Stamina/Khí Huyết, Thiên Kiếp, chi phí Linh Khí; Ngộ Tính tăng tốc lĩnh ngộ, lộ thuộc tính ẩn sớm, giảm SAN loss khi giải mã dị tượng. Không chỉ số nào thay thế điều kiện Mệnh.

### CHR-CD-006 SAN và Corruption
SAN giảm khi gặp Dị Quỷ, đọc cấm thư, thất bại nghi thức, dùng kỹ thuật có SAN cost; hồi phục được. Corruption (0–100) tăng do Cấm Thuật, Linh Khí biến dạng, khế ước Tà Thần, Nghịch Hành; chỉ giảm bằng cơ chế thanh tẩy khai báo rõ. Mọi phép cộng/trừ clamp vào miền hợp lệ.

| Corruption | Hậu quả |
|---:|---|
| 0–20 | Không phạt |
| 21–40 | SAN tối đa −5, Khí Vận −5 |
| 41–70 | Chính Đạo cảnh giác, giảm danh vọng, tăng Eldritch Quest |
| 71–90 | Dị hóa ngoại hình, một số NPC từ chối giao dịch |
| 91–100 | Có thể kích hoạt `ELDRITCH_INTERVENTION` độc lập Mệnh Số |

### CHR-CD-007 Mất Trí
SAN về 0: khóa điều khiển chủ động; phạt thống nhất mất 10% Tu vi hiện tại (làm tròn lên), Corruption +10 (tối đa 100), ghi nguồn, chuyển kết cục Tha Hóa (`pendingEnding = "succumb"`). UI hiện rõ các khoản phạt.

### CHR-CD-008 Neo Nhân Tính
Loại `npc | place | memory | oath`; có `stability`, `lastRenewedTurn/lastNurturedAt`, `broken`. Neo ổn định giảm 10–30% SAN loss trong nghi thức; Neo suy yếu tăng nguy cơ mất kiểm soát; Neo vỡ tạo Mệnh Nợ và có thể kích hoạt `ELDRITCH_INTERVENTION`. Tối đa 3 Neo NPC active; Neo NPC chỉ dựng được với NPC đủ tin cậy/tôn trọng (`anchorCandidates`).

### CHR-CD-009 Trạng thái quyền năng
| State | Điều kiện | Hành vi |
|---|---|---|
| `NORMAL_GROWTH` | Mệnh Nợ thấp, Neo ổn định | Bình thường |
| `FATE_BACKFIRE` | Mệnh xung khắc hoặc Mệnh Nợ cao | Phản chấn hành động mạnh; tăng SAN cost/Corruption |
| `ELDRITCH_INTERVENTION` | Corruption ≥ 91, Neo vỡ hoặc trigger Tà Thần | Chỉ action Priority 0 |
| `ASCENDANT_UNBOUND` | Cấp 14 và xong nghi thức cuối | Mở ending biến số thế giới |

Dùng đúng tên trên (không tiền tố `STATE_`). Priority 0 chỉ ghi đè action khi trạng thái cưỡng chế tồn tại, không xóa quest/tiến độ.

### CHR-CD-010 Thứ tự xử lý mỗi lượt
1 nạp + validate state → 2 tính state cưỡng chế → 3 nếu cưỡng chế: action Priority 0 → 4 xử lý action người chơi → 5 resolve Công Pháp, Ngũ Hành, family, chi phí → 6 hậu quả HP/Stamina/SAN/Corruption/Mệnh/Neo/quan hệ → 7 event mốc cảnh giới/trận doanh (bỏ qua với Ngoại Đạo Giả) → 8 validate invariant → 9 commit nguyên tử + event log.

### CHR-CD-011 Journey intent
Chủng tộc, Linh Căn, tính cách, xuất thân là input ngẫu nhiên bất biến. Trước vòng chơi chính, người chơi chọn đúng một intent — lựa chọn duy nhất trước main loop:
- `tam_su` (Tầm Sư): roll một tông môn hợp lệ của vùng, lưu ID làm mục tiêu nhập môn giai đoạn 2; cảnh mở đầu nêu tên tông môn.
- `tu_lap` (Tự Lập): resolver riêng, roll 1 trong 5 cảnh Tán Tu, không tạo mục tiêu tổ chức.
- `quy_tong` (Quy Tông): roll một gia tộc/thế lực `family` của vùng; chỉ có khi xuất thân không phải Tông Môn/Hắc Đạo/Vô Danh và vùng có tổ chức `family` hợp lệ.
- `an_the` (Ẩn Thế): thay Quy Tông cho Hắc Đạo và Vô Danh. Xuất thân Tông Môn chỉ có Tầm Sư và Tự Lập. So khớp lựa chọn chuẩn hóa không dấu, độc lập encoding.

### CHR-CD-012 Opening plan
Intent và `openingPlan` lưu ở cả `player` và `flags`. Mục tiêu dùng `targetOrganizationId` + `targetOrganizationKind` trung tính; roll chỉ từ catalog vùng đúng loại tổ chức; pool rỗng là lỗi deterministic, không chọn tổ chức khác. Phân loại `family` cần marker gia tộc rõ ràng (chữ "Tộc"/"Bộ" đơn lẻ không đủ). `act_journey_*` đi qua action dispatcher chung; UI chỉ gọi cùng lệnh engine. `originSituation` legacy không dùng để ẩn quest hay ghi lịch sử mở đầu.

### CHR-CD-013 Lời mời tổ chức giai đoạn 2
Vào Khai Lộ với intent có mục tiêu hợp lệ đặt `pendingGuildChoice`. Migration dựng lại cờ này khi có mục tiêu canonical, cấp ≥ 2, chưa là thành viên và chưa có quyết định guild. `originLocked` không được xóa lời mời khi save/load. Từ chối ghi journey decline, không mở lại state machine Origin legacy. Tự Lập ghi quyết định độc lập, không tạo mục tiêu.

### CHR-CD-014 Migration origin legacy
Save có `originChoicePending` legacy được migrate một lần vào cổng journey intent; nhân vật mới không vào nhánh origin-choice legacy.

### CHR-CD-015 Lịch sử không đảo ngược
Mọi chi phí vĩnh viễn và lựa chọn không thể đảo ngược phải xuất hiện trong `eventHistory`; mọi thao tác phá hủy/đổi vật phẩm hoặc Mệnh là atomic có rollback.

## Acceptance

- Tạo 10.000 nhân vật: không reroll, đúng 2 tính cách không trùng, SAN 100.
- Hắc Đạo/Vô Danh thấy Ẩn Thế thay Quy Tông; Tông Môn chỉ thấy Tầm Sư/Tự Lập.
- Neo vỡ hoặc Corruption 91 có thể kích hoạt `ELDRITCH_INTERVENTION`.
- Gate: `node tools/verify_opening_intent.js`, `node tools/verify_character_generator_replay.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CHR-CD-002, 003 | `js/engine.js:createCharacter`, `rollSpiritualRootBranch`, `spiritualRootProfile` | Khớp |
| CHR-CD-007 | `js/engine.js:triggerMadness` | Khớp |
| CHR-CD-008 | `js/engine.js:anchorCandidates`, `establishHumanAnchor` | Khớp |
| CHR-CD-011..014 | `js/engine.js` (`journeyIntent`, `pendingGuildChoice`) | Khớp |
