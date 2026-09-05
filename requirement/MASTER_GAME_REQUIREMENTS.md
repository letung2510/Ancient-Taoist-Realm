# Cổ Dị Diện — Master Game Requirements

Đây là tài liệu canonical để trace toàn bộ UI, engine, Cảnh Giới, Con Đường, Mệnh Số, Công Pháp, Hành Trang và vòng đời nhân vật. Các tài liệu patch cũ đã được hợp nhất vào đây.

## Nguyên tắc kiến trúc

- `js/engine.js` là nguồn sự thật duy nhất cho state, công thức, điều kiện, phần thưởng và transaction.
- `js/ui.js` chỉ render state và phát event; `js/main.js` điều phối modal, taskbar, save và render-after-turn.
- Mọi tên hiển thị Con Đường dùng `getPathDisplayName(pathId)`; không nối raw ID vào UI/story.
- Mọi thay đổi state phải gọi `updateDerived(state)` và lưu qua `serialize`.

## Cảnh Giới và Con Đường

- Đột Phá là thao tác thủ công, không tự động khi EXP đầy.
- `breakthroughRequirements(state)` tạo checklist; `getBreakthroughBlockers(state)` là validator chung cho UI và engine.
- Điều kiện gồm Tu vi, Hiệu Mệnh, Mệnh Dẫn/Trợ, điểm tương hợp, Công Pháp Cốt Lõi và các nghi thức/Neo Nhân Tính theo từng cảnh.
- `pathProgression(state)` mô tả bước kế tiếp; sau Khai Lộ, danh xưng cảnh giới lấy theo Con Đường đã chọn.
- Action definitions phải clone trước khi gắn `disabled_reason`, tránh nút Đột Phá bị khóa vĩnh viễn.

## Mệnh Số

- Tách rõ `ownedCount`, `activeCount`, `fateVaultSummary` và tổng điểm `Tổng Mệnh`/`Thuận Mệnh`/`Hiệu Mệnh`/`Mệnh Hòa Tỷ`.
- `validateFateInventory` kiểm tra invariant mỗi lần `updateDerived`.
- `receiveFate` chống trùng; khi kho đầy chỉ thay Mệnh kém tương hợp hơn.
- Modal Tử Vi có paperdoll `assets/ui/fate-paperdoll.png`, toggle cơ thể/lưới và hoán đổi Mệnh Kho.
- Phẩm cấp có màu riêng; tooltip hiển thị effect và diễn giải Hán–Việt.
- `suggestFateForRealmRequirement` trả tối đa 5 gợi ý theo hiệu quả, tương hợp và nguồn nhận.

## Công Pháp

- Công Pháp chia nhóm Tâm Pháp, Chiêu Thức, Thân Pháp, Phụ Trợ, Trận Pháp, Cấm Thuật và Dị Pháp.
- Tu luyện nhận Tu vi và Thông Thạo; Chiêu Thức/Cấm Thuật chỉ nhận mastery chiến đấu khi thật sự sử dụng.
- `isCore` là điều kiện Công Pháp Cốt Lõi cho các cảnh giới yêu cầu.
- Công Pháp tông môn được cấp theo thân phận và cấp bậc môn phái.

## Môn Phái và bản đồ

- Tông Môn dùng `pyramid_tier`, `guildEligibility` và ngưỡng Mệnh/Cảnh Giới.
- Đông Hoang và Vô Tận Hải chỉ hiển thị/cho gia nhập Tông Môn cấp 3 trở lên.
- Thiên Không Vực và U Minh Giới bị khóa ở bước chọn nơi xuất thân cho nhân vật cấp thấp.
- Thoát ly thiếu Công Đức/Cống Hiến tạo truy sát tới khi vượt đại cảnh.

## Hành Trang, Phường Thị và Hư Thiên Đỉnh

- Hành Trang mở bằng modal; vật phẩm đã trang bị ẩn mặc định, bộ chọn Trang Bị chỉ hiện item cùng loại/slot.
- Phường Thị rotation theo `state.market.generatedAt`, mỗi 60 giây đổi Mệnh Số, Đan dược và Trang bị; mua bằng Linh thạch.
- Khâm Thiên Giám hiến tế Thọ Nguyên để nhận Mệnh Số; thành tựu hiến tế tăng trần phẩm cấp đúng một bậc.
- Hư Thiên Đỉnh nhận 3–9 vật phẩm hợp lệ, transaction rollback khi thất bại, kết quả đi qua `receiveFate` nếu là Mệnh Số.

## Thọ Nguyên, Luân Hồi và Chuyển Sinh

- Diên Thọ Đan Hạ/Trung/Thượng Phẩm lần lượt +50/+150/+500; hiệu quả giảm 10% mỗi lần trong cùng cảnh, trần cộng dồn +50% Thọ Nguyên nền.
- `processLuanHoi(state)` là bắt buộc khi Thọ Nguyên về 0, reset cảnh/EXP và giữ một Mệnh Số cao nhất.
- `processChuyenSinh(state)` là lựa chọn tự nguyện từ Cảnh Giới 8+, xác nhận hai lần, giữ tài sản được quy định và cộng Chuyển Sinh Điểm/Căn Cốt nền.
- `getChuyenSinhBlockers` trả lý do cụ thể khi chưa đủ điều kiện.
- `Tha Hóa` luôn hiển thị lựa chọn Luân hồi, Thi giải (nạp save) và Chuyển sinh.

## Story, SAN và action context

- Sau Bỏ Chạy, Story Panel phải append history ngay; encounter bị trì hoãn một lượt để Nghỉ Ngơi hồi phục.
- Thanh Tỉnh về 0 kích hoạt hình phạt Mất Trí và kết thúc Tha Hóa với modal lựa chọn.
- Action random encounter không xuất hiện trực tiếp trên taskbar.

## Kiểm thử bắt buộc

- `node tools/verify_game.js` phải pass.
- Đột Phá: đủ/thiếu từng điều kiện, blocker phải khớp checklist.
- Hành Trang: dùng consumable, trang bị/tháo, modal mở lại vẫn đúng state.
- Market: không đổi trong cùng phút, đổi sau 60 giây và lưu qua reload.
- Khâm Thiên Giám/Hư Thiên Đỉnh: hoàn tác chi phí khi nhận thất bại, không tạo Mệnh trùng.
- Luân Hồi/Chuyển Sinh: kiểm tra điều kiện, tài sản giữ lại và reset đúng cơ chế.
## Story/action robustness

- Story Panel tracks history entries by object identity so trimmed history cannot hide newly appended entries; missing DOM nodes are handled safely.
- State-changing actions are processed through a FIFO queue, keeping rapid clicks from racing the render pipeline and preserving later actions.

## Map, random event and AFK rules

- MAP_SYSTEM.md and RANDOM_EVENT_SYSTEM.md are implemented through `move()`, `maybeTriggerRandomEncounter()`, region/guild eligibility and persistent history.
- `Bế Quan Tu Luyện` is a bounded 1–8 hour AFK action (six cycles/hour), only at locations with Tà Nhiễm ≤ 2; it stops on low Thanh Tỉnh, missing resources, breakthrough readiness or madness.
- `Lưu tệp` downloads the canonical serialized save as JSON while localStorage autosave remains enabled.
- Đông Hoang/Vô Tận Hải retain a Tán Tu progression route until the character reaches the regional Tông Môn threshold (minimum tier, Cảnh giới and Hiệu Mệnh); locked high-tier guilds are not falsely offered at creation.

## Worldview atmosphere

- `WORLDVIEW_ATMOSPHERE.md` is applied through a continuous Wrongness gradient derived from distance, Tà Nhiễm and Thanh Tỉnh.
- Descriptions and Story entries may receive deterministic Ambient Dread details; low Thanh Tỉnh can also produce bounded, presentation-only perceived values without changing real state.
- Forbidden knowledge flags are persisted when marked Mệnh Số/Công pháp are acquired, allowing later narrative systems to react without inventing a second corruption stat.
