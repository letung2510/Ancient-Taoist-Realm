# Cổ Dị Diện — Master Game Requirements

Đây là tài liệu canonical để trace toàn bộ UI, engine, Cảnh Giới, Con Đường, Mệnh Số, Công Pháp, Hành Trang, bản đồ, bối cảnh và vòng đời nhân vật. Các requirement đã triển khai không được tạo luật mới ngoài tài liệu này.

## Registry tài liệu

- Đang áp dụng: tài liệu này, `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`, `MAP_SYSTEM.md`, `RANDOM_EVENT_SYSTEM.md`, `WORLDVIEW_ATMOSPHERE.md`, `ACTION_HYBRID_SYSTEM.md`, `character_creation_system.md`, `CONG_PHAP_SYSTEM.md`, `NPC_MONSTER_SYSTEM.md`, `RELATIONSHIP_SYSTEM.md`, `Xianxin_map.md`, `UI_LAYOUT_REQUIREMENT_KEEP_STRUCTURE_ADJUST_WIDTH.md`.
- Requirement đã triển khai và lưu để truy vết lịch sử: `ARCHIVE_BREAKTHROUGH_RITUAL_DETAIL.md`, `ARCHIVE_QUEST_SYSTEM_REDESIGN.md`.
- Tài liệu thiết kế đời đầu chỉ lưu tham khảo: `ARCHIVE_AI_Interactive_Story_RPG_Master_Plan.md`, `ARCHIVE_Xianxin_Fatelife.md`.
- Các file `prompt_*.md` là phiếu công việc tạm thời; sau khi apply phải xóa, không dùng làm nguồn luật.

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
- Khâm Thiên Giám có hai gacha độc lập: Hiến Tế Cố Định mất 10 năm và Hiến Thọ Tỷ Lệ mất 1/10 Thọ Nguyên tối đa; cả hai neo theo phẩm trật chiếm đa số, chỉ có xác suất thấp rơi cao hơn đúng một bậc, không mua trực tiếp Mệnh Số.
- Nguồn Mệnh Số mở rộng: mốc khám phá bản đồ mỗi 5 node thưởng Công Đức, manh mối bản đồ có xác suất thấp rơi Mệnh Số vào Mệnh Kho; phần thưởng được ghi vào Story Panel.
- Công Đức là tài nguyên danh dự: nhận từ quest, hành thiện, khai mở địa mạch và giải mã điềm mệnh; dùng cho gia nhập/thoát ly tông môn, nghi thức và các lựa chọn rủi ro.
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

## GameClock and web UX audit

- `state.gameClock` stores year/era/month/day, fractional day progress and real-time ratio (1 real minute = 1 game day by default); action turns and realtime ticks advance it safely.
- Year rollover consumes one year of Thọ Nguyên, warns below 10%, and invokes Luân Hồi at zero; every 500 years emits a Đại Kiếp atmosphere beat.
- History remains fully persisted while the DOM shows the latest 20 entries with an incremental “Xem thêm lịch sử” control and game timestamps.
- Game screen uses a bounded `100dvh` two-column layout; Sidebar trái giữ navigation và Character Summary, Story Panel/Action Bar nằm bên phải; mỗi vùng có overflow độc lập.
- Open-world map runtime now lazily generates deterministic neighboring nodes on all four directions, persists coordinates/nodes per save, and renders discovered procedural nodes in the local map graph.
- Save files support both Export (`Lưu tệp`) and Import (`Nạp tệp`) JSON flows.
- Nghi thức Đột Phá được phân tầng theo cấp đích, mở từng action theo thứ tự Gọi Mệnh → Đối Chiếu Con Đường → Dựng Neo → Vượt Dị Tượng → Trả Giá → Thử Thách Cuối; cấp thấp chỉ dùng tiền tố cần thiết của chuỗi này và chỉ commit cảnh giới khi toàn bộ gate hợp lệ.
- BREAKTHROUGH_RITUAL_DETAIL.md là đặc tả chuẩn: cấp 1→2 dùng Khai Mạch; cấp 3–4 có 2 gate, 5–7 có 3, 8–10 có 4, 11–13 có 5 và cấp 14 thêm Thử Thách Cuối. Action Bar chỉ hiện gate kế tiếp; Vượt Dị Tượng là roll duy nhất, các gate khác deterministic/setup, tutorial modal hiển thị mỗi lượt.
- Command input giữ tối đa 50 lệnh gần nhất và hỗ trợ ↑/↓; hành động Tìm Kiếm có thể lặp lại tại địa điểm, ghi số lần thử và kết quả riêng trong Story Panel.
- Điều hướng tab được gom thành ba cụm Nhân Vật / Thế Giới / Đặc Biệt; Hư Thiên Đỉnh có Chọn tự động, lưu kết quả dung luyện; Phường thị và Khâm Thiên Giám lưu kết quả giao dịch/gacha gần nhất.
- UI giữ cấu trúc hai cột nguyên bản: Sidebar trái chứa Nhân Vật/TabGroupNav/TabContent; Story Panel và Action Bar nằm bên phải. Tab Trạng thái render toàn bộ bảng trạng thái trong `#tab-content` theo UX legacy, không tạo bảng Character Summary ghim riêng để tránh trùng lặp và lỗi hiển thị `[object Object]`.
- QUEST_SYSTEM_REDESIGN.md đã được triển khai một phần lõi: roll bối cảnh tỉnh dậy theo vùng, bắt buộc chọn Tán Tu/Thế Gia/Tìm Tông Môn, bỏ chạy giữ nguyên node, quest record có lifecycle/tracking và Cơ Duyên Động xuất hiện theo cooldown khi di chuyển.
- Mệnh Kho hỗ trợ trực tiếp Trang bị, Nâng cấp bằng chất liệu cùng phẩm trật và Dung hợp chọn nhiều Mệnh Số; kết quả được đưa lại vào Mệnh Kho hoặc Ấn ký theo luật sức chứa.

## Đề xuất UX và luật giao dịch Mệnh Số, Trang Bị, Nghi Thức, Hư Thiên Đỉnh (chờ duyệt)

> Trạng thái: bản requirement để review, chưa xác nhận là runtime đã triển khai. Mục này thay thế các mô tả UI/giao dịch mơ hồ trước đó khi được duyệt; không thay đổi công thức Cảnh Giới ngoài các điểm được ghi rõ bên dưới.

### 1. Phân biệt Tương hợp và khả năng trang bị Mệnh Số

- `fateCompatibility(pathId, fate)` là điểm tư vấn build, không phải điều kiện khóa thao tác Trang bị. Mệnh có Tương hợp `3` vẫn không thể gắn nếu không còn Ấn ký trống; UI phải nói rõ nguyên nhân là **đầy Ấn ký**, không được báo chung chung “Ấn ký không hợp lệ”.
- Mỗi thẻ Mệnh phải hiển thị riêng: phẩm trật, Cát/Bình/Hung, Mệnh Điểm hiệu dụng, cấp Cường Hóa, Tương hợp Con Đường, modifier đang có và thay đổi dự kiến nếu gắn.
- Trạng thái nút phải có đúng một trong ba nhãn:
  - `Trang bị`: còn Ấn ký trống.
  - `Thay thế…`: toàn bộ Ấn ký đã đầy; mở bộ chọn Mệnh đang kích hoạt để thay.
  - `Đang kích hoạt`: Mệnh đã nằm trên người, kèm nút `Tháo xuống Mệnh Kho`.
- Khi thay thế, UI phải preview `Trước → Sau` cho Tổng Mệnh, Thuận Mệnh, Hiệu Mệnh, điểm Tương hợp, Tương Sinh/Tương Khắc/Combo và các stat thay đổi. Chỉ commit sau khi người chơi xác nhận.
- Thao tác gắn/tháo/thay phải là transaction nguyên tử. Lỗi sức chứa hoặc dữ liệu không hợp lệ không được làm mất hay nhân đôi Mệnh.

### 2. Mệnh đang kích hoạt và Mệnh Kho

- `active_fate_slot_capacity` lấy từ `realm.activeSlots`; không suy ra từ độ dài mảng Mệnh đang gắn.
- Sức chứa Mệnh Kho ổn định theo số Ấn ký đã mở:

```text
Fate_Vault_Capacity = 2 × active_fate_slot_capacity
```

- Việc tháo một Mệnh không được làm co sức chứa kho. Nếu kho đã đầy, thao tác `Tháo xuống Mệnh Kho` bị khóa với lý do cụ thể và UI phải đề xuất `Thay thế trực tiếp` hoặc `Dung hợp/Hiến tế` để giải phóng chỗ.
- Mệnh đang kích hoạt có thể tháo riêng từng ô. Mệnh trong kho có thể:
  - gắn vào ô trống;
  - thay trực tiếp một Mệnh đang kích hoạt;
  - dùng làm nguyên liệu nâng cấp, dung hợp hoặc hiến tế khi đủ điều kiện.
- Tóm tắt đầu modal dùng ba số độc lập: `Sở hữu`, `Đang kích hoạt`, `Trong Mệnh Kho`; không dùng câu `5 sở hữu · 5 đang kích hoạt` mà thiếu trạng thái kho/slot.
- Bộ lọc/sắp xếp Mệnh Kho tối thiểu gồm: Tương hợp cao nhất, Mệnh Điểm, phẩm trật, Cát/Hung và modifier chính.

### 3. Nâng cấp Mệnh Số

- Không tự chọn và tiêu hao “Mệnh cùng phẩm đầu tiên”. Bấm `Nâng cấp` phải mở modal chọn nguyên liệu hợp lệ trong Mệnh Kho.
- Modal xác nhận phải hiển thị:
  - Mệnh mục tiêu và `Cường Hóa +N → +(N+1)`;
  - nguyên liệu sẽ bị tiêu hao;
  - Mệnh Điểm `trước → sau`;
  - Hiệu Mệnh và các chỉ số nhân vật `trước → sau` nếu Mệnh đang kích hoạt;
  - cảnh báo transaction không thể hoàn tác.
- Công thức đề xuất cho mỗi tầng Cường Hóa, tối đa `+5`:

```text
effective_fate_score = base_fate_score + 2 × enhancement_level
positive_numeric_effect = base_effect × (1 + 0.05 × enhancement_level)
```

- Hiệu ứng boolean và modifier bất lợi không được tự khuếch đại bởi Cường Hóa. Mọi phép làm tròn phải dùng cùng một helper giữa preview và `computeStats`.
- Sau khi thành công phải có phản hồi rõ: banner kết quả, animation/highlight ngắn trên thẻ, cấp Cường Hóa mới và danh sách delta thực tế. Save/load phải giữ nguyên cấp và stat sau nâng cấp.
- Nếu thiếu nguyên liệu, nút vẫn có thể được hiển thị nhưng disabled và ghi rõ: cần phẩm nào, hiện có bao nhiêu, tìm tại đâu.

### 4. Thu nhận Mệnh Số và chống kẹt tiến trình

- Năm Mệnh khởi đầu chỉ là bộ đang kích hoạt; game phải tạo được Mệnh mới trong Mệnh Kho qua gameplay thông thường, không buộc người chơi chỉ dùng Phường Thị hoặc hiến Thọ Nguyên.
- Các nguồn bắt buộc và phải xuất hiện trong mục `Nguồn thu nhận` của modal Mệnh:
  - lần đầu chọn Con Đường: bảo đảm một Mệnh Phàm tương hợp `≥3` vào Mệnh Kho;
  - Đột Phá từ Cấp 3 trở đi: một cơ hội Mệnh theo phẩm trật của cảnh, có pity bảo đảm sau hai lần Đột Phá liên tiếp không nhận được Mệnh;
  - quest có `reward.fate`/`reward.fates`: trao qua `receiveFate` và Reward Summary;
  - boss/tinh anh, Discovery Chain/Search và manh mối bản đồ: có bảng xác suất và log nguồn;
  - Phường Thị, Khâm Thiên Giám, Hiến tế Mệnh và Hư Thiên Đỉnh: giữ là nguồn chủ động có chi phí.
- Thêm tiến trình nhìn thấy được `Thiên Cơ / Fate Pity`. Mỗi quest lớn, boss đầu tiên, mốc khám phá 5 node và lần Đột Phá không rơi Mệnh cộng một điểm; đủ ngưỡng quy định phải tạo một Mệnh không trùng, ưu tiên tương hợp với Con Đường.
- Mọi lần nhận Mệnh phải trả kết quả có cấu trúc: `added`, `destination`, `replaced`, `reason`, `source`. Nếu kho đầy, không được âm thầm loại Mệnh: mở đề nghị thay thế và giữ phần thưởng chờ xử lý cho tới khi người chơi nhận hoặc từ chối.
- Story/Reward Summary phải ghi tên Mệnh, phẩm trật, nguồn, đích đến (Mệnh Kho/Ấn ký/chờ xử lý) và lý do nếu chưa nhận được.

### 5. UI Nghi Thức Đột Phá

- Bỏ modal dạng đoạn văn `Hướng dẫn · ... / Cổng đang sẵn sàng / Xác nhận bước này`. Modal Nghi Thức là một màn trạng thái có cấu trúc:
  - tiêu đề: cảnh giới hiện tại → cảnh giới đích;
  - stepper hiển thị toàn bộ bước của cấp đích với trạng thái `Đã xong / Hiện tại / Chưa mở`;
  - tên bước hiện tại và mô tả một câu bằng ngôn ngữ gameplay;
  - checklist điều kiện gồm giá trị hiện tại, yêu cầu và trạng thái đạt/thiếu;
  - khối `Kết quả khi hoàn tất`, `Chi phí` và `Rủi ro`;
  - CTA cụ thể như `Hoàn tất Đối Chiếu`, không dùng `Xác nhận bước này`.
- `Đối Chiếu Con Đường` phải hiển thị riêng: điểm Tương hợp hiện tại/yêu cầu, số Mệnh Dẫn, số Mệnh Trợ, Công Pháp Cốt Lõi và các blocker khác. Tương hợp đạt `3/3` chỉ đánh dấu riêng điều kiện đó đã đạt; nếu cổng còn bị khóa, UI phải chỉ đúng điều kiện còn thiếu.
- Khi thiếu Mệnh/Công Pháp, modal cung cấp shortcut `Mở Tử Vi Mệnh Số` hoặc `Mở Công Pháp`. Khi không có blocker, CTA enabled và ghi rõ thao tác deterministic, không tạo cảm giác đây là một roll.
- Sau khi hoàn tất một bước, modal cập nhật stepper và hiển thị biên nhận kết quả trước khi đóng hoặc chuyển sang bước kế tiếp. Bước có roll phải công bố xác suất trước khi xác nhận và kết quả roll sau khi thực hiện.
- Đóng modal không làm tiêu hao lượt. Chỉ thao tác hoàn tất gate mới đi qua Action Engine; một click chỉ được tính đúng một lượt.

### 6. Trang bị vật phẩm

- Engine phải có một validator chung `equipmentEligibility(state, itemId, targetSlot)` trả về `eligible`, `category`, `targetSlot`, `occupiedBy`, `requirements`, `blockers`, `statDelta`. UI và thao tác commit phải dùng cùng kết quả này.
- Không suy loại trang bị chủ yếu từ tên vật phẩm. Item trang bị mới bắt buộc khai báo `equipmentType`; Hộ thân bắt buộc có `protectionSlot`. Heuristic tên chỉ dùng để migrate item cũ và phải ghi cảnh báo kiểm thử.
- Nếu ô đơn đã có vật phẩm, nút phải là `Thay thế` và preview món cũ/mới; không được im lặng ghi đè. Với Pháp khí/Tùy thân nhiều ô, khi đầy phải cho chọn ô cần thay.
- Pháp khí Sinh hoạt bị khóa phải hiển thị chính xác yêu cầu tông môn/chuyên môn còn thiếu. Không dùng thông báo chung “không phù hợp với môn phái hiện tại”.
- Inventory dạng stack phải tính số đơn vị tự do:

```text
free_quantity(itemId) = inventory_quantity(itemId) - equipped_quantity(itemId)
```

- Một bản đang trang bị không được làm toàn bộ stack cùng `itemId` biến mất hoặc bị cấm dùng/dung luyện. Bộ chọn trang bị và Hư Thiên Đỉnh chỉ thao tác trên `free_quantity`.
- Mọi lỗi trang bị phải hiển thị inline trong modal và Story log; không chỉ dùng `alert`.

### 7. Hư Thiên Đỉnh và số lượng vật phẩm

- Đơn vị dung luyện là **số lượng**, không phải số loại item. `Linh Thạch ×10` có thể chọn từ 0 đến 9 đơn vị; chọn 3 Linh Thạch được tính là 3/9 nguyên liệu.
- Mỗi dòng vật phẩm dùng quantity stepper/input có miền `0..min(free_quantity, 9)`. Toolbar hiển thị `Tổng đơn vị đã chọn: N/9` và tóm tắt `Tên × số lượng`.
- Payload chuẩn cho engine:

```js
[
  { itemId: "linh_thach", quantity: 3 },
  { itemId: "thanh_tam_thao", quantity: 2 }
]
```

- `refineAtVoidCauldron` phải normalize payload, tổng quantity trong khoảng `3..9`, kiểm tra tồn kho tự do, rồi trừ đúng quantity. Không mở rộng payload thành mảng ID ở UI.
- `Chọn tự động` chọn theo từng đơn vị tự do cho đến 9, không chỉ chọn tối đa 9 dòng. Mặc định ưu tiên nguyên liệu phẩm thấp, không trang bị, không quest item và không bị khóa.
- Trước khi dung luyện phải có preview tổng số đơn vị, các stack sẽ bị trừ và dải kết quả có thể nhận. Sau thành công hiển thị biên nhận `đã dùng` và `nhận được`; nếu thất bại transaction rollback toàn bộ quantity.

### 8. Migration và acceptance criteria

- Save cũ có `player.fates` dạng mảng dày 5 phần tử phải giữ đúng thứ tự Ấn ký. `fateEnhancements`, Mệnh Kho và trang bị cũ không bị mất khi migrate.
- Ca kiểm thử bắt buộc:
  1. Năm Ấn ký đầy, Mệnh Kho có Mệnh tương hợp 3: bấm từ kho mở luồng thay thế và thay thành công.
  2. Tháo một Mệnh đang kích hoạt vào kho còn chỗ; gắn lại và save/load không đổi stat.
  3. Kho đầy: tháo bị chặn có lý do, thay trực tiếp vẫn hoạt động và không mất Mệnh.
  4. Nâng cấp Mệnh đang đeo: tiêu hao đúng nguyên liệu đã chọn, cấp/delta hiển thị và stat thực tăng sau reload.
  5. Đối Chiếu có Tương hợp 3/3 nhưng thiếu Công Pháp: checklist đánh dấu Tương hợp đạt và chỉ rõ Công Pháp còn thiếu.
  6. Trang bị sai loại/sai tông môn/đầy ô: mỗi trường hợp trả blocker riêng; thay món giữ đúng inventory quantity.
  7. Stack Linh Thạch ×10 chọn quantity 9: UI báo 9/9, engine trừ đúng 9; một bản trang bị trong stack chỉ làm giảm free quantity đúng một.
  8. Quest, Đột Phá, khám phá/pity và boss có thể đưa Mệnh mới vào Mệnh Kho; kết quả không bị rơi mất khi kho đầy.
  9. Mọi thao tác thất bại giữ nguyên state trước transaction và `node tools/verify_game.js` phải pass.
