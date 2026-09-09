# Đặc tả đề xuất: Bối cảnh xuất thân, thế giới mở và hệ thống Nhiệm Vụ

> Tài liệu review — chưa phải thay đổi runtime. Sau khi duyệt mới triển khai vào `js/engine.js`, `js/ui.js` và dữ liệu.

## 1. Mục tiêu trải nghiệm

Mỗi nhân vật phải tỉnh dậy trong một câu chuyện khác nhau, có lý do hợp lý cho vị trí xuất thân và con đường ban đầu. Bản đồ là một đồ thị mở: gặp một NPC mạnh không biến khu vực đó thành ngõ cụt. Nhiệm vụ cần tạo lựa chọn, hậu quả, mối quan hệ và lý do để quay lại bản đồ.

Các nguyên tắc tham chiếu: quest có mục tiêu rõ nhưng nhiều cách giải (Fallout/New Vegas), lựa chọn tạo hậu quả trễ và thay đổi cách thế giới phản ứng (Assassin's Creed Odyssey/Tyranny), nhiệm vụ động lấp đầy theo trạng thái bản đồ (Skyrim Radiant Story), và MUD event gắn trực tiếp với NPC, địa điểm, điều kiện kỹ năng. Không bê nguyên cơ chế; mọi nhánh phải tuân luật Mệnh Số, Con Đường, Tà Nhiễm và Thanh Tỉnh của game.

## 2. Bối cảnh xuất thân phân nhánh

### 2.1. Roll bối cảnh

Khi tạo nhân vật, engine thực hiện hai lần roll độc lập:

1. `originRegion`: vùng rộng (Trung Vực, Đông Hoang, Vô Tận Hải, Bắc Minh...).
2. `originSituation`: tình huống tỉnh dậy trong vùng đó.

Tình huống được chọn có trọng số theo Chủng Tộc, background, Mệnh Số khởi đầu và vùng; không chọn ngẫu nhiên thuần túy. Mỗi tình huống phải chỉ định `startLocationId`, `firstChoiceId`, `availableGuildIds`, `blockedGuildIds`, `introTags` và `questSeed`.

Các archetype tối thiểu:

| Bối cảnh | Vị trí hợp lý | Lựa chọn tỉnh dậy | Hệ quả đầu game |
|---|---|---|---|
| Tán tu lưu lạc | trấn, bến đò, hoang lộ | tìm việc / tự tu / theo dấu dị vật | mở nhiệm vụ kiếm tài nguyên, chưa có môn phái |
| Thế gia suy tàn | phủ tổ, thôn họ tộc | khôi phục gia phả / cắt huyết thệ | có quan hệ và nợ gia tộc, tăng quest thế gia |
| Kẻ sống sót tai biến | rìa vùng Tà Nhiễm | cứu người / điều tra / rời đi | mở chuỗi sinh tồn và ký ức dị biến |
| Người được cứu | dược phường, đạo quán, thuyền khách | trả ân / giấu thân phận | có NPC hộ mệnh, mở quest ân nghĩa |
| Kẻ trốn truy sát | ngõ phụ, mật đạo, bến cảng | cải danh / phản kích / cầu che chở | có truy nã, không spawn trước cổng tông môn |
| Cơ duyên lạc giới | di tích, linh điền, khe giới | chạm vật dẫn / phong ấn / bỏ chạy | mở quest Mệnh Số hiếm và nguy cơ Tà Nhiễm |

Không đặt nhân vật mặc định trước cổng tông môn. Nếu tình huống có liên quan tông môn, vị trí phải là trạm dịch, làng phụ, bến tiếp dẫn hoặc vùng ngoài sơn môn; chỉ sau lựa chọn đầu tiên mới có quyền tiếp cận tuyến gia nhập.

### 2.2. Lựa chọn đầu tiên sau khi tỉnh dậy

Action bắt buộc đầu tiên là `Chọn thân phận hành đạo`, không phải `Cầu nhập môn`:

- **Tán Tu:** tự do di chuyển, nhận quest địa phương, đổi tài nguyên lấy Công Đức; không có bảo hộ môn phái.
- **Thế Gia:** nhận gia pháp, quan hệ huyết tộc và quest gia tộc; phải trả nợ hoặc chịu danh dự gia tộc.
- **Tìm Tông Môn:** chỉ mở danh sách môn phái đủ điều kiện tại vùng; không được xem/đi vào cấp cao khi chưa đạt yêu cầu.

Tán Tu và Thế Gia là bước tiền đề ở cấp 1–2. Sau khi đạt Khai Lộ hoặc hoàn thành quest giới thiệu, nhân vật mới được xét gia nhập tông môn. Tuyến Tìm Tông Môn không bỏ qua điều kiện: chỉ là quyền bắt đầu tìm hiểu, không phải quyền gia nhập.

State đề xuất:

```js
state.flags.originChoice = {
  branch: "tan_tu|the_gia|seek_guild",
  chosenAt: timestamp,
  starterQuestId: "...",
  consequences: []
}
```

## 3. Bỏ chạy và bản đồ mở

### 3.1. Luật bắt buộc

`Bỏ Chạy` phải xóa trạng thái giao chiến nhưng giữ nguyên `state.locationId`. Không gọi `move()` ngược, không gán `previousLocationId`, không teleport về node trước. Nhân vật ở lại khu vực hiện tại, được phép đi mọi exit hợp lệ ở lượt kế tiếp.

Sau khi bỏ chạy:

- đặt `fledUntilTurn` để ngăn tái giao chiến tức thì một lượt;
- ghi `lastCombatOutcome = "fled"`;
- giữ NPC/quái tại node, có thể tái xuất hiện theo cooldown hoặc hành vi AI;
- thêm lựa chọn Nghỉ Ngơi, Quan Sát, Đi theo các exit và quest liên quan;
- nếu vùng bị săn đuổi, tăng `threatLevel` thay vì khóa map.

### 3.2. AI và node nguy hiểm

NPC mạnh không phải cổng chặn cứng. Mỗi node có `dangerProfile`: `powerBand`, `awareness`, `patrolRoutes`, `fleePenalty`, `safeExits`. AI chọn đuổi, cảnh cáo, canh cửa, gọi viện binh hoặc bỏ qua tùy chênh lệch cảnh giới và quan hệ. Chỉ encounter có cờ `hard_lock: true` mới khóa tạm một hướng, và phải có ít nhất một `safeExit` hoặc phương án thương lượng.

Bản đồ giữ liên thông bằng invariant:

```text
mọi node đã khám phá phải có ít nhất 1 exit khả dụng;
flee không làm giảm số exit;
encounter không được biến node thành teleport/backtrack bắt buộc.
```

## 4. Hệ thống Nhiệm Vụ 2.0

### 4.1. Bốn lớp nhiệm vụ

1. **Mạch Chính (主線):** đẩy bí ẩn Cổ Dị Diện, Con Đường và các mốc cảnh giới; có checkpoint cố định, nhánh kết thúc.
2. **Mạch Khu Vực (地域線):** thay đổi quyền lực, an toàn và tài nguyên của từng vùng; hoàn thành hoặc bỏ mặc đều biến đổi node.
3. **Mạch Nhân Vật (人物線):** NPC có mục tiêu, nỗi sợ, bí mật và quan hệ; ưu tiên đối thoại/trao đổi trước chiến đấu.
4. **Cơ Duyên Động (机缘):** sinh từ di chuyển, thời gian, Tà Nhiễm, Mệnh Số và vật phẩm; có hạn sử dụng hoặc tái xuất hiện.

### 4.2. Schema nhiệm vụ

```js
{
  id, type, title, giverId, regionId,
  status: "hidden|available|active|paused|completed|failed|expired",
  priority, expiresAt, repeatable, cooldown,
  prerequisites: [{ flag, op, value }],
  objectives: [{ id, kind, target, count, hidden, alternatives }],
  branches: [{ id, condition, label, effects }],
  consequences: { success: [], failure: [], abandon: [], timeout: [] },
  rewards: [{ type: "exp|merit|fate|item|relation|access", value }],
  memoryBeats: [], worldMutations: []
}
```

Mỗi objective có nhiều `alternatives`: thuyết phục, điều tra, chiến đấu, giao vật phẩm, dùng Công Pháp, hoặc bỏ qua để nhận hậu quả khác. Không thiết kế quest chỉ có một vật phẩm duy nhất ở một địa điểm xa nếu game không cung cấp manh mối hoặc phương án thay thế.

### 4.3. Vòng đời và nhịp chơi

`discover → accept → investigate → choose → resolve → consequence → reward → follow_up`.

Mỗi quest đang hoạt động phải hiển thị trong tab Nhiệm Vụ:

- mục tiêu hiện tại và bước kế tiếp;
- vùng/NPC liên quan, khoảng cách hoặc hướng gợi ý;
- điều kiện còn thiếu bằng ngôn ngữ người chơi;
- nguy cơ khi thất bại, hạn thời gian và hậu quả bỏ nhiệm vụ;
- nhánh đã chọn và nhánh bị che khuất (nếu có).

Tab không tự nhận mọi quest: người chơi phải chấp nhận hoặc từ chối, trừ biến cố bắt buộc đã đánh dấu `forcedEvent`.

### 4.4. Hậu quả có độ trễ

Quest thành công không chỉ trả thưởng ngay. Nó có thể:

- mở/đóng NPC, lối đi, chợ hoặc Tông Môn;
- đổi thái độ NPC và giá Phường Thị;
- thay đổi mật độ quái, threatLevel và random event của vùng;
- thêm Mệnh Nợ, Tà Nhiễm hoặc lời thề;
- mở follow-up sau vài lượt/ngày game;
- ghi một Memory Beat để Story Panel nhắc lại quyết định cũ.

Quest thất bại phải là trạng thái có nội dung, không phải xóa im lặng: ghi lý do, hậu quả, đường chuộc lỗi hoặc tuyến thay thế nếu thiết kế cho phép.

### 4.5. Nhiệm vụ động theo bản đồ

Sau mỗi lần di chuyển, hệ thống có thể tạo một quest seed với xác suất theo vùng; không bắt buộc mọi lần di chuyển. Seed chọn NPC, node chưa hoàn thành, threat hiện tại và tài nguyên còn thiếu. Quest động không được trùng objective trong cùng cooldown và không sinh phần thưởng vượt cấp.

Ví dụ: sau khi bỏ chạy khỏi một yêu thú ở khe núi, có thể xuất hiện `Dấu Chân Chưa Khép`: quay lại điều tra (Mệnh/Ngộ Tính), dẫn NPC ra khỏi vùng (quan hệ), hoặc đặt bẫy (Công Pháp). Mỗi cách tạo hậu quả khác nhau; map vẫn giữ các exit.

### 4.6. Phần thưởng và Công Đức

Phần thưởng chia thành tức thời và tích lũy:

- tức thời: Tu Vi, vật phẩm, Linh thạch, Mệnh Số xác suất thấp;
- tích lũy: Công Đức, danh vọng vùng, quan hệ NPC, quyền tiếp cận, giảm threat;
- phần thưởng ẩn: Memory Beat, Mệnh duyên, thông tin về Con Đường.

Quest không biến thành bảng nhiệm vụ lặp vô hạn: quest repeatable phải có cooldown, giới hạn phần thưởng và biến thể mục tiêu. Công Đức thưởng cao hơn cho cứu trợ, giữ lời thề, giải quyết không sát phạt; nhiệm vụ phản bội hoặc lạm dụng có thể cho tài nguyên mạnh nhưng tăng Tà Nhiễm/Mệnh Nợ.

## 5. UX/UI đề xuất

- Story Panel luôn hiển thị bước quest vừa kích hoạt, lựa chọn đã chọn và hậu quả sắp tới.
- Tab Nhiệm Vụ có bộ lọc: Chính, Khu vực, Nhân vật, Cơ duyên; mặc định chỉ mở 3 quest đang liên quan gần nhất.
- Mỗi quest có nút `Theo dấu`, `Tạm gác`, `Từ bỏ` và `Xem hậu quả`; không dùng marker bản đồ nếu người chơi chưa có thông tin IC hợp lý.
- Action Bar chỉ đưa action nhiệm vụ vào khi đúng ngữ cảnh (đang cạnh NPC, node, vật phẩm hoặc mục tiêu), phần còn lại nằm trong `Thêm`.
- Khi quest hết hạn hoặc bị thay đổi bởi world event, hiện một Story Beat giải thích thay vì silently fail.

## 6. Lộ trình triển khai sau khi duyệt

1. Tách `originSituation` khỏi `startRegionId`, thêm `originChoice` và seed quest.
2. Sửa `act_bo_chay` giữ nguyên `locationId`, thêm invariant kiểm tra liên thông map.
3. Mở rộng state quest với lifecycle, alternatives, branches, consequences và world mutations; giữ migration cho save cũ.
4. Viết resolver objective theo event (`move`, `talk`, `combat`, `search`, `item`, `choice`, `time`).
5. Cập nhật `renderQuests`, Story Panel và map marker theo `Theo dấu`.
6. Thêm test: roll bối cảnh không trùng, spawn không ở trước sơn môn, bỏ chạy không đổi node, quest branch/reward/migration và quest dynamic cooldown.

## 7. Tài liệu tham khảo thiết kế

- [Ubisoft — Assassin's Creed Odyssey: lựa chọn thay đổi thế giới](https://www.ubisoft.com/en-us/game/assassins-creed/news/75MY4drXihVfDJRnZcsx/choose-your-own-odyssey)
- [GameDesign.gg — cấu trúc quest, nhánh và quest động](https://gamedesign.gg/articles/quest-design/)
- [Lysator MUD Quest Design — nguyên tắc tránh khóa mềm và dead-end](https://www.lysator.liu.se/mud/questdesign.html)
- [Mudproto — xây dựng story/world cho MUD](https://github.com/WilliamSmithEdward/mudproto/blob/main/docs/story_and_world_building.md)
