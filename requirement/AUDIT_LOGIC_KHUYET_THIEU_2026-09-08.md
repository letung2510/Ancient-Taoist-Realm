# AUDIT LOGIC KHUYẾT THIẾU — HỆ THỐNG FEATURE

Ngày rà soát: 2026-09-08  
Phạm vi: toàn bộ file `.md` trong `requirement` và code hiện tại trong `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`.

## Kết luận nhanh

Code hiện đã có nền cho world simulation, thời gian thực, Cổ Tịch, nghề ẩn cơ bản, collection cơ bản, nghề chính/phụ, weather/NPC cơ bản, tab Thế Sự/Dị Chí, đấu giá và modal entry point.

Tuy nhiên chưa đạt Definition of Done của toàn bộ requirement. Ba nhóm thiếu lớn nhất là:

1. Đồng bộ offline/world tick chính xác.
2. Formatter ngôn ngữ trung tâm và audit raw ID toàn UI.
3. Hoàn thiện transaction/action thật cho modal, nghề ẩn, item nghề nghiệp, collection và achievement.

## P0 — Lỗi logic cần xử lý trước

### 1. Offline progress có thể không cộng đủ ngày

Trong `js/engine.js`:

- `applyOfflineProgress()` gọi `autoCultivate(state, batch)`.
- `autoCultivate()` hiện không còn gọi `advanceGameTime()`.
- Nhánh an toàn chỉ cộng phần lẻ qua `advanceGameTime(state, elapsedGameDays - gameDays)`.

Hậu quả: offline nhiều ngày ở địa điểm an toàn có thể tăng tiến độ tu luyện nhưng không tăng đủ world clock. Event, thời tiết, NPC, deadline và chiến sự có thể không chạy đúng.

Notee: Bộ time của hệ thống vẫn chạy, khi offline thời gian chạy thì người chơi chỉ chịu ảnh hưởng của việc đếm thời gian. Khi offline thì Event, thời tiết, NPC, deadline và chiến sự tự gen random. Coi như refresh 1 lần.
Hoặc Event, thời tiết, NPC, deadline và chiến sự cứ tiếp tục chạy, khi load lại thì sync time với hệ thống và đưa ra Event, thời tiết, NPC, deadline và chiến sự hiện tại.
Cái nào logic hơn thì làm

### 2. Spec thời gian đang mâu thuẫn

- `SPEC_FIX_HE_THONG_NGON_NGU_VA_BO_TRI_FEATURE.md` quy định chỉ dùng thời gian thực, `30 giây = 1 ngày`, action không cộng ngày.
- Một số tài liệu cũ như `ACTION_HYBRID_SYSTEM.md` và `MASTER_GAME_REQUIREMENTS.md` vẫn mô tả gameplay theo turn/action.
- Chưa có tài liệu canonical precedence xác định spec nào được ưu tiên khi xung đột.

Notee: SPEC_FIX_HE_THONG_NGON_NGU_VA_BO_TRI_FEATURE.md là tài liệu chuẩn nhất, canonical.

### 3. Catch-up offline chưa đúng spec hợp nhất

Spec yêu cầu:

- tối đa 30 tick chi tiết;
- phần còn lại chạy aggregate;
- omen chưa nhìn thấy không tự động chuyển active;
- offline không gây chết, mất item hoặc cưỡng bức Luân Hồi.

Code hiện tại:

- cap offline là 8 giờ;
- chưa có giới hạn 30 tick rõ ràng;
- chưa có cơ chế giữ omen qua phiên đăng nhập;
- chưa có transaction bảo vệ toàn bộ hậu quả offline.

Notee: Thêm cơ chế nếu offline quá lâu sẽ cưỡng bức Luân Hồi do hết Thọ nguyên
Phần này tạo logic cho nó nhé:
Code hiện tại:

- cap offline là 8 giờ;
- chưa có giới hạn 30 tick rõ ràng;
- chưa có cơ chế giữ omen qua phiên đăng nhập;
- chưa có transaction bảo vệ toàn bộ hậu quả offline

## P1 — Feature có khung nhưng thiếu logic hoàn chỉnh

### 4. Cổ Tịch Tà Thần chưa có đủ đồ thị mở nghề ẩn

Đã có 7 Cổ Tịch và trạng thái điều tra/đọc/thu thập, nhưng còn thiếu:

- clue theo NPC, địa điểm, Dị Thú, thời tiết và event;
- điều kiện giải mã riêng cho từng nghề;
- nhánh thất bại/manh mối giả;
- action `Đánh dấu vị trí`, `Đối Chiếu`, `Giải Mật`;
- skill/passive/item/action riêng cho từng nghề ẩn.
Notee: Sẽ bổ sung sau, hoặc tự gen logic
### 5. Sưu tầm Dị Thú/NPC chưa đủ

`registerCollection()` mới được gọi chủ yếu khi nói chuyện với NPC.

Thiếu:

- đăng ký khi bắt sống/thuần hóa Dị Thú;
- đăng ký NPC hiếm theo rarity thật;
- phân loại `Dị Thú / NPC / Thực Thể / NPC Hiếm`;
- portrait, khu vực gặp đầu tiên, ngày gặp, trạng thái đã biết;
- phần thưởng idempotent theo từng collection entry.
Notee: Hãy tạo logic cho nó theo đúng dòng game tiên hiệp

### 6. Nghề chính/phụ chưa khóa ở mọi API

`runExpansionCommand()` dùng hàm khóa nghề mới, nhưng hàm `chooseProfession()` cũ vẫn tồn tại và được export. Code bên ngoài có thể gọi trực tiếp để đổi nghề.

Cần:

- chỉ giữ một API chọn nghề duy nhất;
- khóa vĩnh viễn sau khi chọn;
- UI hiển thị đúng `Chọn nghề chính` hoặc `Chọn nghề phụ`;
- nghề ẩn dùng cùng cơ chế khóa.
Notee: Hãy tạo logic và code để thỏa mãn hoàn toàn yêu cầu khóa nghề duy nhất

### 7. Item chuyên nghề mới chỉ là catalog/starter item

Hiện item được thêm vào catalog runtime và phát khi chọn nghề, nhưng thiếu:

- action dùng item;
- hiệu ứng cụ thể;
- recipe/charge/cooldown;
- điều kiện nghề chính/phụ;
- save migration;
- phân biệt item refer từ catalog cũ với item tạo mới;
- test item cùng tên nhưng khác nguồn.
Notee: Hãy tạo logic cho nó theo đúng dòng game tiên hiệp
### 8. Achievement bộ trang bị chưa kiểm tra đủ bộ

`unlockAchievements()` hiện chỉ kiểm tra một item có `setName`.

Chưa kiểm tra:

- toàn bộ slot bắt buộc;
- đúng `equipmentSetId`;
- item đang trang bị thật;
- điều kiện kích hoạt/tắt bonus;
- achievement chỉ mở một lần sau reload.
Notee: Hãy tạo logic cho nó theo đúng dòng game tiên hiệp
- toàn bộ slot bắt buộc; giải quyết bằng cách check slot item
- đúng `equipmentSetId`; 
- item đang trang bị thật;
- điều kiện kích hoạt/tắt bonus; tạo kiểu bonus bằng cách nâng ratio lên hoặc cho hiệu ứng đặc biệt
- achievement chỉ mở một lần sau reload. - Phải tạo realtime chứ, reload thì không ổn lắm, có thể tạo logic mỗi lần trang bị thì gọi lại biến 1 lần
### 9. Modal chưa nối đủ transaction

Đã có renderer riêng cho Mệnh Số Tiến Hóa, Công Trình Tông Môn và Cơ Duyên Tranh Đoạt, nhưng:

- modal Công Trình chưa có nút khởi công/đóng góp thật;
- modal Cơ Duyên chưa hiển thị đầy đủ location/reward/consequence;
- modal Mệnh Số chưa có flow chọn nhánh và xác nhận Nghịch Diễn đầy đủ;
- một số modal mới render trạng thái, chưa hoàn thiện action loop.

Notee: Tiếp tục code để nối đủ.

### 10. UI tab chưa tái cấu trúc hoàn toàn

`renderExpansion()` cũ vẫn chứa Nghề Nghiệp, Công Pháp Tiến Hóa, Mệnh Số Tiến Hóa, Tù Binh/Dị Thú, Công Trình và Quan Hệ.

Nếu renderer cũ được gọi lại, các feature sẽ quay về sai ngữ cảnh.
Notee: Tiếp tục code để tái cấu trúc hoàn toàn
### 11. Nhân Duyên chưa gom đủ

Spec yêu cầu `Thế Giới → Nhân Duyên` chứa:

- Tù Binh & Dị Thú;
- Quan Hệ;
- Truyền Thư;
- Truy Nã.

Hiện các phần này vẫn phân tán giữa `renderExpansion()`, tab `relations`, action bar và state riêng.

Notee: Tạo logic để không bị lỗi này nữa

## P2 — Audit ngôn ngữ còn thiếu

### 12. Raw ID vẫn còn trong history/log

Các dạng còn có thể lọt ra:

- `contract.templateId`;
- `entityId`;
- `factionId`;
- `targetEntityId`;
- `npcId`;
- `outcome`;
- `status`;
- mã weather/element.

Notee: Check và hoàn thiện cho tôi

### 13. Chưa có `GameEngine.I18n` thực sự

Logic dịch vẫn nằm rải rác trong `ui.js`, `expansion.js` và các string template.

Cần formatter trung tâm:

```js
GameEngine.I18n.formatContract()
GameEngine.I18n.formatTarget()
GameEngine.I18n.formatStatus()
GameEngine.I18n.formatHistory()
```
Notee: Tạo đi, tôi approval phần này


### 14. Một số nhãn kỹ thuật còn có thể lọt ra UI

Cần audit toàn bộ:

- `locked`, `trial`, `ready`, `chosen`;
- `procedural`;
- `itemId`, `regionId`;
- `null`, `undefined`;
- mã element/weather;
- category công pháp chưa có dictionary.

Notee: Giải quyết toàn bộ không để loạt nhãn kỹ thuật ra UI

## P3 — World/NPC còn thiếu chiều sâu

### 15. Thời tiết chưa tác động đủ NPC/world

Đã có giảm HP khi mưa, giảm Thanh Tỉnh khi sương và cập nhật mood/schedule NPC cơ bản.

Thiếu:

- NPC-NPC encounter;
- lịch theo trait;
- quan hệ/mail/rumor cascade;
- ảnh hưởng faction, market, quest, combat, travel;
- `processedKey` cho từng NPC reaction;
- cooldown chống spam.

Notee: Hoàn thiện nốt nhé

### 16. Thiếu API World Simulation theo spec

Spec yêu cầu:

```js
ensureWorldSimulation()
scheduleWorldTask()
cancelWorldTask()
processScheduledWorldTasks()
worldSimulationSummary()
```

Hiện logic tương đương nằm rải trong `expansion.js`, chưa có API transaction thống nhất.

Notee: Tạo API transaction thống nhất và refactor lại theo logic bây giờ

### 17. Weather/Event modifier chưa preview nhất quán

Spec yêu cầu preview giống runtime trong Status, Map, technique preview, cultivation, search và market.

Hiện modifier runtime có, nhưng preview UI chưa đồng nhất toàn bộ.

Notee: Hoàn thiện nốt nhé

### 18. Thiếu bảo vệ offline cho event nguy hiểm

Chưa có đầy đủ rule:

- offline không gây chết;
- offline không mất item;
- offline không cưỡng bức Luân Hồi;
- thay đổi permanent chỉ xảy ra sau khi người chơi quan sát/chơi.

Notee: Hoàn thiện nốt nhé
## Checklist hoàn thiện spec

- [x] Chốt tài liệu canonical precedence.
- [x] Sửa offline progress và world tick.
- [x] Chuẩn hóa API time/world simulation.
- [x] Hoàn thiện đồ thị clue và nghề ẩn.
- [x] Hoàn thiện collection Dị Thú/NPC/thực thể.
- [x] Khóa nghề ở mọi API.
- [x] Hoàn thiện item chuyên nghề.
- [x] Chuẩn hóa achievement bộ trang bị.
- [x] Hoàn thiện transaction cho từng modal.
- [x] Loại bỏ renderer expansion cũ hoặc tách hoàn toàn.
- [x] Gom Nhân Duyên về đúng tab.
- [x] Tạo `GameEngine.I18n` trung tâm.
- [x] Audit raw ID toàn bộ UI/history.
- [x] Bổ sung propagation NPC/world.
- [x] Bổ sung unit, integration, DOM và simulation test.

## Ghi chú kiểm thử hiện tại

Lệnh hiện tại vẫn pass:

```text
node --check js/engine.js
node --check js/expansion.js
node --check js/ui.js
node --check js/main.js
node tools/verify_game.js
```

Tuy nhiên việc pass test hiện tại chỉ xác nhận regression cơ bản; chưa chứng minh toàn bộ logic trong các spec đã hoàn chỉnh.

## Quyết định bổ sung theo Notee

- **Offline:** không refresh ngẫu nhiên độc lập. Hệ thống tiếp tục mô phỏng theo elapsed time và đồng bộ về ngày hiện tại khi load. Offline không tự tạo encounter chiến đấu, không tự trừ item; nếu Thọ Nguyên cạn thì cho phép kích hoạt Luân Hồi cưỡng bức theo rule nhân vật.
- **Canonical:** `SPEC_FIX_HE_THONG_NGON_NGU_VA_BO_TRI_FEATURE.md` là tài liệu ưu tiên cao nhất khi xung đột với spec/archive cũ.
- **Collection:** bắt sống/thuần hóa Dị Thú ghi vào bộ sưu tầm; NPC nói chuyện ghi NPC; NPC hiếm nhận thưởng một lần theo processed key.
- **Nghề nghiệp:** API chọn nghề duy nhất, khóa một nghề chính và một nghề phụ vĩnh viễn; không đổi slot sau khi đã chọn.
- **Bộ trang bị:** achievement chỉ mở khi toàn bộ trang bị đang dùng thuộc cùng bộ, có tối thiểu hai món, và kiểm tra lại realtime sau mỗi lần trang bị/tháo.
- **World API:** chuẩn hóa `ensureWorldSimulation`, `scheduleWorldTask`, `cancelWorldTask`, `processScheduledWorldTasks`, `worldSimulationSummary` làm lớp transaction dùng chung.

## Audit bổ sung toàn workspace — 2026-09-08

Phạm vi kiểm tra mở rộng: toàn bộ `js/`, `data/`, `tools/`, `index.html`, `styles.css`, các file save và toàn bộ tài liệu trong `requirement/`.

### 19. Thiếu module I18n trung tâm

Requirement đang tham chiếu `js/i18n.js`, nhưng file chưa tồn tại. `GameEngine.I18n` và các formatter sau cũng chưa được triển khai đầy đủ:

```js
GameEngine.I18n.formatContract()
GameEngine.I18n.formatTarget()
GameEngine.I18n.formatStatus()
GameEngine.I18n.formatHistory()
```

Logic dịch hiện vẫn phân tán trong `ui.js` và `expansion.js`, nên raw ID có thể tiếp tục lọt vào history/UI.
Notee:  1. Tạo GameEngine.I18n và apply toàn bộ vào code

### 20. Thiếu file dữ liệu item nghề nghiệp

Requirement có tham chiếu `data/profession_items.js`, nhưng file này chưa tồn tại. Item nghề hiện được tạo runtime trong `expansion_data.js`, chưa có catalog độc lập, schema version và migration riêng.
Notee: Tạo catalog độc lập, schema version và migration riêng và apply code
### 21. Cổ Tịch chưa có hidden profession graph

Chưa có schema/logic đầy đủ cho:

```text
codexClues
hiddenProfessionGraph
```

Hiện chỉ dùng số lượng Cổ Tịch để mở nghề. Còn thiếu clue theo NPC/địa điểm/event, clue giả, điều kiện đối chiếu, nhánh nghề, tiến độ điều tra và hậu quả thất bại.
Notee: Tạo NPC/địa điểm/event, clue giả, điều kiện đối chiếu, nhánh nghề, tiến độ điều tra và hậu quả thất bại, logic này Codex tự quyết đinh dựa trên dữ liệu game
### 22. NPC/world reaction chưa có API chuẩn

Requirement yêu cầu:

```js
npcWorldContext()
resolveNpcWorldReaction()
```

Code hiện chỉ có weather effect đơn giản trong `applyDailyWorldEffects()`. Chưa có pipeline đầy đủ cho NPC-NPC encounter, lịch theo trait, relationship/mail/rumor cascade, phản ứng faction/war/event, cooldown và `processedKey`.
Notee: Codex tự thiết kế pipeline đầy đủ cho NPC-NPC encounter, lịch theo trait, relationship/mail/rumor cascade, phản ứng faction/war/event, cooldown và `processedKey` phù hợp với logic game.
### 23. Weather chưa có resolver điều khiển và preview thống nhất

Chưa có `setWeather()`. Weather hiện được roll nội bộ theo tick, chưa có resolver dùng chung cho Status, Map, combat preview, technique preview, cultivation, search và market.
Notee: Cho phép Codex tự thiết kế resolver dùng chung cho Status, Map, combat preview, technique preview, cultivation, search và market.
### 24. Thiếu test chuyên biệt cho offline/world tick

Regression test hiện tại chưa kiểm tra:

- offline 1 ngày, 30 ngày và 1.000 ngày;
- save/load giữa world tick;
- event không resolve hai lần;
- deadline/cooldown không nhân đôi;
- Luân Hồi khi offline làm cạn Thọ Nguyên;
- weather/NPC/faction sau catch-up.
Notee: Cho phép Codex tự thiết kế
### 25. Catalog equipment set chưa chuẩn hóa đầy đủ

Achievement đã có kiểm tra nhiều item cùng bộ, nhưng toàn bộ trang bị hiện hữu chưa có metadata `equipmentSetId` chuẩn. Item chỉ có tên riêng như `Bá Vương` hoặc `Thiên Mệnh` có thể không kích hoạt achievement ổn định nếu thiếu set metadata.
Notee: Cho phép Codex tự thiết kế, có thể tạo metadata và các file liên quan.
### 26. Item nghề nghiệp chưa hoàn thiện action

Item nghề đã được thêm runtime và phát khi chọn nghề, nhưng còn thiếu action sử dụng, hiệu ứng nghề, recipe, charge/cooldown, điều kiện nghề chính/phụ, quy tắc refer item cũ/tạo item mới, migration và test độc lập.
Notee: Cho phép Codex tự thiết kế action sử dụng, hiệu ứng nghề, recipe, charge/cooldown, điều kiện nghề chính/phụ, quy tắc refer item cũ/tạo item mới, migration và test độc lập
### 27. Nghề chính/phụ còn đường bypass API

`chooseProfessionLocked()` đã tồn tại, nhưng implementation legacy `chooseProfession()` vẫn còn trong module và được export. Cần dọn thành một API duy nhất để không thể đổi nghề qua đường gọi trực tiếp.
Notee: Đồng ý phương án dọn thành 1 API
### 28. Modal chưa nối đầy đủ transaction

Các renderer modal đã tách nhưng chưa đủ flow:

- Công Trình: thiếu khởi công/đóng góp thật;
- Cơ Duyên: thiếu location/reward/consequence đầy đủ;
- Mệnh Số Tiến Hóa: thiếu xác nhận nhánh nguy hiểm và commit cost/effect hoàn chỉnh.
Notee: Cho phép Codex tự thiết kế, logic phù hợp.
### 29. Renderer expansion cũ vẫn còn tồn tại

`renderExpansion()` vẫn chứa Nghề Nghiệp, Công Pháp Tiến Hóa, Mệnh Số Tiến Hóa, Tù Binh/Dị Thú, Công Trình và Quan Hệ. Nếu code path cũ gọi lại renderer này, feature sẽ quay về sai ngữ cảnh tab.
Notee: Cho phép Codex tự đưa ra phương án coding để tránh bị sai ngữ cảnh.
### 30. Nhân Duyên chưa gom hoàn toàn

Tù Binh, Dị Thú, Quan Hệ, Truyền Thư và Truy Nã vẫn phân tán giữa `renderExpansion()`, tab `relations`, action bar và state riêng.
Notee: Codex sẽ code để tránh trường hợp phân tán giữa `renderExpansion()`, tab `relations`, action bar và state riêng.
### 31. Thiếu API contract test tự động

Chưa có test tự động đối chiếu rằng mọi API bắt buộc trong spec đều tồn tại, được export đúng và đi qua transaction/idempotency.
Notee: Codex sẽ code, apply code test.

### 32. Tình trạng kiểm tra tài nguyên

- Không phát hiện script trong `index.html` bị thiếu.
- Toàn bộ JSON trong `data/` parse hợp lệ.
- Hai tài nguyên requirement tham chiếu nhưng chưa tồn tại: `js/i18n.js`, `data/profession_items.js`.
Notee: Ok
### Kết quả kiểm tra cú pháp/regression

```text
node --check js/*.js
node tools/verify_game.js
```

Kết quả hiện tại: pass regression cơ bản. Kết quả này chưa chứng minh toàn bộ logic trong requirement đã hoàn chỉnh.

### Notee

Bạn có thể ghi ý kiến bắt đầu bằng `Notee:` bên dưới từng mục 19–32 để chốt hướng triển khai.

## Trạng thái triển khai sau approval (2026-09-08)

- [x] Nạp `GameI18n` trung tâm và chuẩn hóa log lịch sử; các mã hợp đồng, trạng thái, thời tiết, thuộc tính và giá trị rỗng không còn lộ trực tiếp trong log.
- [x] Tách catalog `data/profession_items.js`; vật phẩm nghề có hành động sử dụng, kiểm tra nghề đang cố định và hiệu ứng lưu trong save.
- [x] Khóa nghề chính/phụ qua API `chooseProfessionLocked`; không cho đổi sau khi đã chọn.
- [x] Offline đồng bộ thời gian 30 giây = 1 ngày; không tạo sự kiện/bounty nguy hiểm mới trong mô phỏng offline, nhưng vẫn cập nhật ngày và hạn.
- [x] Bổ sung API manh mối nghề ẩn có nhánh manh mối giả và hậu quả Thanh Tỉnh.
- [x] Bổ sung giao dịch modal Công Trình Tông Môn/Cơ Duyên: sau thao tác modal được cập nhật lại từ state mới.
- [x] Achievement bộ trang bị có metadata bonus và được đánh giá lại sau mỗi action.
- [x] Renderer mở rộng cũ chuyển sang cầu nối các tab chuyên biệt; không còn là nguồn hiển thị chính.
- [x] Bổ sung contract test cho I18n, catalog nghề, API nghề ẩn và world modifier.

Kiểm tra: `node --check js/i18n.js`, `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js` và `node tools/verify_game.js` đều đạt.

## Bổ sung xử lý ngày 2026-09-09

- [x] Xuất thân hiển thị tên nhánh cụ thể và mô tả ảnh hưởng, không còn chỉ dùng nhãn chung “Xuất thân”.
- [x] Sửa bố cục thẻ tổ chức: nhãn cấp như “Môn Phái Nhỏ · Hắc Đạo · Tán Tu Liên Minh” không còn chồng lên tên tổ chức.
- [x] Hoàn thiện chuyển đổi Mệnh Số giữa dạng cơ thể và dạng lưới trong modal.
- [x] Bổ sung `npcWorldContext()` và `resolveNpcWorldReaction()`; phản ứng NPC theo thời tiết có cooldown `processedKey`.
- [x] Bổ sung alias I18n theo contract: `formatContract`, `formatTarget`, `formatStatus`.
- [x] Mở rộng contract test cho API NPC/world.

## Triển khai hoàn thiện nhóm 19–32 — 2026-09-09

- [x] I18n trung tâm đủ `formatContract`, `formatTarget`, `formatStatus`, `formatHistory`; formatter tự tra cứu tên item/NPC/địa điểm/thế lực để giảm raw ID trong log.
- [x] Catalog nghề có `PROFESSION_ITEMS_SCHEMA_VERSION`, state version migration và action item có charge/cooldown/recipe metadata.
- [x] Hidden profession graph được khởi tạo theo từng nghề, có node Cổ Tịch → đối chiếu → giải mật, manh mối giả và hậu quả thất bại; đã đưa action vào tab Dị Chí.
- [x] Collection lưu tên, loại nguồn, ngày gặp, khu vực đầu tiên, trạng thái và thưởng idempotent.
- [x] Nghề chính/phụ dùng một API khóa duy nhất; code legacy bypass đã được loại bỏ khỏi thân hàm.
- [x] Achievement bộ trang bị có metadata `requiredCount`, tự chuẩn hóa set ID từ tên item và áp bonus vào stat khi cập nhật derived.
- [x] Modal Công Trình có danh sách khởi công/đóng góp; modal Cơ Duyên hiển thị địa điểm, đối thủ, thưởng và hậu quả.
- [x] Renderer expansion chỉ còn bridge; renderer Nhân Duyên gom quan hệ, Tù Binh/Dị Thú, Truyền Thư/Truy Nã và khế ước.
- [x] Weather có `setWeather()` và `worldModifierPreview()`; runtime và preview dùng chung `getWorldModifiers()`.
- [x] World API transaction đã export đầy đủ; NPC có encounter định kỳ, phản ứng thời tiết và `processedKey` chống lặp.
- [x] Offline bỏ giới hạn 8 giờ, mô phỏng 30 tick chi tiết + aggregate, không tạo event/bounty nguy hiểm mới; test catch-up 1/30/1.000 ngày đã thêm.
- [x] Contract test mở rộng cho toàn bộ API bắt buộc của nhóm 19–32.

Kiểm tra batch 19–32: toàn bộ `node --check` liên quan và `node tools/verify_game.js` đều pass.

## Hoàn thiện transaction và entry point — 2026-09-09

- [x] `applyOfflineProgress()` đồng bộ trực tiếp world simulation trong cùng transaction, có `try/finally` bảo đảm không lưu cờ offline/history suppression nếu resolver lỗi.
- [x] Xóa API nghề legacy `chooseProfession`; mọi lựa chọn đi qua `chooseProfessionLocked()` và `professionAvailability()`, lưu `selectionLocked` bền qua save.
- [x] Khóa cả action nghề: không thể rèn luyện, luyện đan, luyện khí, đặt trận, xem tướng hoặc tu bổ nếu nghề tương ứng chưa được cố định.
- [x] Vật phẩm nghề là công cụ có charge/cooldown; validation chạy trước mutation, có recipe nạp lại và hiệu ứng thật cho luyện đan/luyện khí/trận pháp.
- [x] Graph nghề ẩn schema 2 có nguồn Cổ Tịch và gate NPC/location/event/weather/Fate/Dị Thú/hành vi; giải mật chỉ mở con đường, không tự chiếm slot nghề.
- [x] Bảy nghề ẩn có passive, action, cost và cooldown riêng; state action được serialize.
- [x] Cổ Tịch dùng vòng `Điều Tra → Đọc → Giải Mật/Đối Chiếu → Thu Thập`; clue lưu tại `discoveries.codexClues` với source/day/confidence/verified.
- [x] Collection phân loại Dị Thú/NPC/Thực Thể/NPC Hiếm, có portrait, vùng/ngày gặp, rarity và reward key idempotent.
- [x] Achievement bộ trang bị dùng `equipmentSetId`, `requiredCount`, `requiredSlots`; kiểm tra realtime qua `updateDerived()` sau trang bị/tháo.
- [x] World task API xác thực schema, chống trùng, hủy và resolve idempotent; mail/trận pháp/truy nã đều đi qua API chung.
- [x] NPC world context dùng đúng vùng của NPC; reaction có processed key, retention 30 ngày, trait schedule, encounter cooldown, rumor và faction cascade.
- [x] Modal Công Trình dùng đúng field runtime, có đóng góp cá nhân, phần thưởng, đình chỉ và lịch sử; modal Cơ Duyên có reward/consequence từng lựa chọn và tự đóng sau resolve.
- [x] Nghề/Công Pháp/Mệnh Số/Công Trình/Cơ Duyên/Nhân Duyên/Dị Chí có entry point đúng canonical; renderer expansion chi tiết cũ đã bị loại bỏ.
- [x] Weather/event preview dùng chung resolver trong Thế Sự, Bản Đồ, Công Pháp, tu luyện, chiến đấu, tìm kiếm, di chuyển và thị trường.
- [x] Regression bổ sung kiểm tra API contract, bypass nghề, transaction item nghề, save nghề ẩn, offline world sync, tab separation và Cổ Tịch state machine.

Kiểm tra cuối: `node --check` toàn bộ module liên quan và `node tools/verify_game.js` đều pass.
