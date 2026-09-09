# SPEC FIX — HỆ THỐNG NGÔN NGỮ VÀ BỐ TRÍ FEATURE

## 1. Mục tiêu

Chuẩn hóa toàn bộ nội dung hiển thị của các feature mở rộng, loại bỏ ID kỹ thuật khỏi story log/UI, đồng thời đưa từng feature về đúng ngữ cảnh gameplay hiện có.

Phạm vi bản fix này gồm cả ngôn ngữ, bố trí UI và các logic tối thiểu cần thiết để những feature được đặt lại có entry point hoạt động đúng:

- dịch thuật và format text;
- mapping ID → tên hiển thị;
- log hành động/lịch sử;
- bố trí feature vào panel/modal phù hợp;
- không thay đổi công thức lõi đang cân bằng; chỉ bổ sung action/điều kiện/metadata cần thiết cho item, nghề ẩn, thời tiết và khóa nghề;
- save schema chỉ mở rộng backward-compatible cho các record mới, không phá save cũ.

## 2. Vấn đề đã xác nhận

### 2.1. Raw ID xuất hiện trong log

Ví dụ hiện tại:

```text
§ Đã nhận khế ước escort · mục tiêu null.
§ Đã nhận khế ước hunt · mục tiêu ta_than_phan_than.
```

Nguyên nhân:

- `templateId` đang được ghi thẳng vào history;
- `targetEntityId` được dùng cho mọi loại khế ước, dù escort/retrieve không có entity target;
- không có lớp formatter trung tâm cho action ID, contract ID, NPC ID, location ID, item ID, technique ID và fate ID.

### 2.2. Công Pháp Tiến Hóa hiển thị ID kỹ thuật

Ví dụ:

```text
kiem_khi_so_cap
locked
tam_phap_dan_dien
locked
```

Nguyên nhân:

- UI dùng trực tiếp key trong `state.player.techniques`;
- trạng thái `locked/trial/ready/chosen` chưa có label tiếng Việt;
- thiếu tên Công Pháp lấy từ `GameData`/technique catalog.

### 2.3. Sai ngữ cảnh UI

Hiện tại toàn bộ nội dung bị dồn vào tab `Thế Sự & Dị Chí`, làm người chơi khó tìm và không phản ánh mental model của game.

Vị trí bắt buộc sau fix:

| Feature | Vị trí mới | Cách mở |
|---|---|---|
| Nghề nghiệp | Panel Nhân Vật | section trong hồ sơ nhân vật |
| Công Pháp Tiến Hóa | Panel Công Pháp/Kỹ Năng | section hoặc modal chi tiết Công Pháp |
| Mệnh Số Tiến Hóa | Modal chi tiết Mệnh Số | chỉ hiển thị khi xem Fate cụ thể |
| Công Trình Tông Môn | Modal Tông Môn | mở từ panel Tông Môn hiện hữu |
| Cơ Duyên Tranh Đoạt | Modal Cơ Duyên | mở từ cảnh báo/action hoặc nút Thế Sự |
| Dị Triều/Thời tiết/Chiến tranh | Tab Thế Sự | giữ ở dashboard thế giới |
| Khám phá/lore/Cổ Tịch/clue nghề ẩn | Tab Dị Chí | vòng lặp điều tra và mở khóa |
| Hợp đồng/Truyền thư/Tình báo | Thế Sự hoặc modal riêng theo entry point | không trộn với nghề nghiệp |
| Di Sản Luân Hồi/Mộ Tiền Kiếp | Đặc biệt → Ký ức | meta-progression, legacy và preview transfer |

`Thế Sự` và `Dị Chí` là hai tab độc lập, không gộp chung. `Thế Sự` chỉ hiển thị nhịp vận hành của thế giới; `Dị Chí` hiển thị vòng lặp khám phá, lore, Cổ Tịch và manh mối nghề ẩn.

## 3. Quy tắc ngôn ngữ

### 3.1. Không hiển thị raw ID cho người chơi

Không được xuất hiện trực tiếp trong text/UI các dạng:

```text
escort, hunt, retrieve, investigate, capture
kiem_khi_so_cap, tam_phap_dan_dien
ta_than_phan_than, co_mo_vo_danh
locked, trial, ready, chosen
```

Ngoại lệ duy nhất: debug console hoặc save raw data, không được đưa vào `history`, story, button label, tooltip hay modal.

### 3.2. Formatter trung tâm

Tạo module `js/i18n.js` hoặc namespace `GameEngine.I18n` với API:

```js
I18n.label(kind, id, context)
I18n.status(kind, status)
I18n.formatContract(contract)
I18n.formatAction(actionId)
I18n.formatHistory(entry)
```

Các loại bắt buộc:

```text
contract, outcome, entity, npc, location, item,
technique, techniqueStatus, fate, fateStatus,
profession, hiddenProfession, professionNode, codex, clueStatus,
weather, season, element, event, faction, warStatus
```

Formatter phải có fallback an toàn:

1. tìm trong dictionary;
2. tìm tên từ `GameData`/`EXPANSION_DATA`;
3. tạo label thân thiện từ ID (`ta_than_phan_than` → `Tà Thần Phân Thân`);
4. nếu vẫn không biết, hiển thị `Mục tiêu chưa xác định`, tuyệt đối không hiển thị `null` hoặc raw snake_case.

### 3.3. Dictionary chuẩn

#### Khế ước

| ID | Label | Mục tiêu hiển thị |
|---|---|---|
| `hunt` | Truy Săn | tên Dị Thú/kẻ địch |
| `capture` | Bắt Sống | tên Dị Thú/kẻ địch |
| `investigate` | Điều Tra | tên khu vực/điểm điều tra |
| `escort` | Hộ Tống | tên điểm đến hoặc NPC cần hộ tống |
| `retrieve` | Thu Hồi | tên vật phẩm |

#### Trạng thái Công Pháp

| Raw | Label |
|---|---|
| `locked` | Chưa mở Thí Luyện |
| `trial` | Đang Thí Luyện |
| `ready` | Đã hoàn tất, chờ chọn nhánh |
| `chosen` | Đã tiến hóa |

#### Công Pháp hiện có

| ID | Tên |
|---|---|
| `kiem_khi_so_cap` | Kiếm Khí Sơ Cấp |
| `tam_phap_dan_dien` | Tâm Pháp Đan Điền |
| `cam_thuat_huyet_te` | Cấm Thuật Huyết Tế |

#### Nhánh Tiến Hóa Mệnh Số

| ID | Tên |
|---|---|
| `thuan_dien` | Thuận Diễn — Hợp Đạo |
| `nghich_dien` | Nghịch Diễn — Đoạt Mệnh |
| `quy_nguyen` | Quy Nguyên — Hóa Linh |

### 3.4. Ngữ pháp log

Log phải dùng câu hoàn chỉnh, có chủ thể và mục tiêu cụ thể.

Ví dụ bắt buộc:

```text
§ Đã nhận khế ước Truy Săn · mục tiêu Tà Thần Phân Thân.
§ Đã nhận khế ước Hộ Tống · điểm đến Vân Phong.
§ Đã nhận khế ước Thu Hồi · vật phẩm Linh Thạch.
§ Công Pháp Kiếm Khí Sơ Cấp đã mở Thí Luyện Tiến Hóa.
◇ Công Pháp Tâm Pháp Đan Điền · Chưa mở Thí Luyện.
✦ Mệnh Số đã tiến hóa thành Thuận Diễn — Hợp Đạo.
```

Không được nối chuỗi `targetEntityId` nếu target không thuộc loại entity. Formatter phải chọn `targetLocationId`, `targetItemId`, `regionId` theo `contract.outcome`.

## 4. Bố trí UI chi tiết

### 4.1. Panel Nhân Vật — Nghề nghiệp

Thêm section `Nghề Nghiệp` sau chỉ số nhân vật/trước trang bị:

- nghề chính hiện tại;
- bốn nghề và bậc thục luyện;
- nút chọn nghề chính;
- nút rèn luyện;
- nút Luyện Đan/Luyện Khí/Đặt Trận Pháp/Xem Tướng tùy nghề;
- chi phí và lý do disabled bằng tiếng Việt.

Tab Thế Sự chỉ hiển thị một summary: `Nghề chính: Luyện Đan Sư · Bậc 1` và nút `Mở hồ sơ nghề nghiệp`.

### 4.2. Panel Công Pháp/Kỹ Năng — Công Pháp Tiến Hóa

Trong danh sách Công Pháp hiện hữu, mỗi card thêm:

- tên Công Pháp tiếng Việt;
- mastery hiện tại;
- trạng thái tiến hóa đã dịch;
- tiến độ thí luyện (`Tinh anh 1/2`, `Tu luyện 3/5`);
- nút mở modal chọn nhánh khi `ready`.

Modal nhánh hiển thị tên nhánh, preview hiệu ứng trước/sau và trade-off. Không đưa section này vào dashboard Thế Sự.

### 4.3. Modal Mệnh Số — Mệnh Số Tiến Hóa

Khi mở chi tiết một Mệnh Số:

- hiển thị cấp Cường Hóa `+0…+5`;
- relationship stage và thanh Cộng Minh;
- điều kiện mở Mệnh Kiếp;
- tiến độ tinh anh/tương ứng;
- nút `Mở Mệnh Kiếp` nếu đủ điều kiện;
- modal chọn nhánh với preview score/effect/cost/drawback;
- cảnh báo xác nhận riêng cho Nghịch Diễn.

Dashboard Thế Sự chỉ có card summary `Mệnh Số đủ điều kiện tiến hóa: 1` và nút `Mở Mệnh Số`.

### 4.4. Modal Tông Môn — Công Trình

Modal dùng state `guildProject` hiện hữu:

- công trình đang chạy;
- tiến độ, hạn ngày, đóng góp cá nhân;
- phần thưởng sau hoàn thành;
- lịch sử công trình gần nhất;
- nút khởi công/đóng góp.

Nếu người chơi rời tông môn giữa dự án, modal phải hiển thị `Dự án bị đình chỉ` và không làm mất state audit.

### 4.5. Modal Cơ Duyên — Cơ Duyên Tranh Đoạt

Khi `pendingContestedOpportunity` tồn tại:

- mở từ action bar hoặc nút `Xem Cơ Duyên`;
- hiển thị địa điểm, đối thủ, hạn ngày, phần thưởng dự kiến;
- ba lựa chọn: `Cường Đoạt`, `Dùng Mưu`, `Chia Sẻ`;
- kết quả và hậu quả hiển thị bằng label tiếng Việt;
- modal tự đóng sau resolve và ghi một history entry.

Không render ba nút này lẫn vào section nghề nghiệp hoặc công pháp.

### 4.6. Tab Thế Sự sau khi tinh gọn

Chỉ giữ:

- ngày/mùa/thời tiết;
- Dị Triều và phase;
- chiến tranh/ngoại giao;
- NPC notable và các thay đổi lớn của bản đồ;
- hợp đồng đang nhận;
- nút mở các modal liên quan;
- cảnh báo Cơ Duyên/Bí Cảnh/Thiên Kiếp.

Không render Cổ Tịch, clue, lore hoặc danh sách khám phá chi tiết trong tab này.

### 4.7. Tab Dị Chí — vòng lặp khám phá và mở nghề ẩn

Tab `Dị Chí` là nơi người chơi theo dõi toàn bộ manh mối chưa giải:

- bản đồ lớn đã đặt chân tới;
- Cổ Tịch Tà Thần I–VII;
- clue theo từng Cổ Tịch và clue nghề ẩn;
- item đặc biệt đã phát hiện nhưng chưa hiểu công dụng;
- bộ sưu tầm Dị Thú, NPC, thực thể đặc biệt và các biến thể hiếm;
- event/lore đã chứng kiến;
- NPC, địa điểm, thời tiết hoặc Mệnh Số liên quan tới một con đường ẩn;
- tiến độ điều tra và confidence của từng manh mối;
- nút `Điều Tra`, `Đọc`, `Giải Mật`, `Đối Chiếu` và `Mở Con Đường` khi đủ điều kiện.

Section `Sưu Tầm` trong Dị Chí phải chia thành `Dị Thú`, `NPC`, `Thực Thể` và `NPC Hiếm`. Mỗi entry hiển thị portrait/tên, khu vực gặp đầu tiên, ngày gặp, độ hiếm, trạng thái đã biết/chưa biết và phần thưởng đã nhận.

Mỗi Cổ Tịch Tà Thần phải xuất hiện trong một loop Dị Chí hoàn chỉnh:

```text
Phát hiện dấu vết → xác minh clue → tìm item/key → giải event/NPC gate
→ đọc Cổ Tịch → cập nhật tiến độ nghề ẩn → mở action nghề ẩn
```

## 5. API và thay đổi code bắt buộc

### 5.1. Tách formatter khỏi gameplay

Không sửa state để phục vụ dịch thuật. `I18n` chỉ đọc state/data và trả string.

`history()` phải gọi formatter trước khi `E.pushHistory()` hoặc các resolve function phải truyền payload semantic:

```js
history(state, "sys", I18n.formatContractAccepted(contract));
```

### 5.2. Chuẩn hóa Contract DTO

Contract phải có một target semantic:

```js
{
  outcome: "travel",
  targetEntityId: null,
  targetLocationId: "van_phong",
  targetItemId: null,
  regionId: "trung_vuc"
}
```

`formatContractTarget(contract)` là nơi duy nhất quyết định text mục tiêu.

### 5.3. Chuẩn hóa Technique DTO cho UI

UI dùng:

```js
E.techniqueDisplayInfo(state, techniqueId)
```

API trả `{ id, name, familyName, masteryStage, status, statusLabel, progressLabel, choices }`. Không để UI tự đọc key raw.

### 5.4. Chuẩn hóa feature entry point

Thêm các API UI:

```js
UI.renderProfessionSection(state)
UI.renderTechniqueEvolutionSection(state)
UI.renderFateEvolutionModal(state, fateId)
UI.renderGuildProjectModal(state)
UI.renderContestedOpportunityModal(state)
```

`renderExpansion()` chỉ gọi summary/card và nút mở modal.

### 5.5. Escape và fallback

- mọi label qua `escapeHtml`;
- formatter không trả `null`, `undefined`, chuỗi rỗng hoặc raw ID;
- unknown ID phải có label fallback và ghi `migrationNotes` chỉ một lần nếu cần audit;
- raw ID chỉ được giữ trong `data-*` attribute để dispatcher, không đưa vào text node.

## 6. Migration và tương thích

- Không đổi `version` save chỉ vì fix ngôn ngữ/UI.
- Save cũ vẫn giữ nguyên `templateId`, `targetEntityId`, `techniqueId`.
- Khi load save cũ, formatter tự xử lý target null/field thiếu.
- Không sửa raw history cũ trong save; chỉ các log mới dùng formatter chuẩn.
- Nếu cần hiển thị lại history cũ, chạy `I18n.formatHistory(entry)` theo `entry.meta` nếu có, nếu không giữ nguyên nhưng không tạo log lỗi mới.

## 7. Test bắt buộc

### 7.1. Unit

- `escort` không bao giờ hiển thị `mục tiêu null`;
- `hunt` hiển thị tên Dị Thú tiếng Việt;
- `retrieve` hiển thị tên vật phẩm;
- unknown ID không xuất hiện raw snake_case;
- `locked/trial/ready/chosen` có label tiếng Việt;
- formatter không trả null/undefined.

### 7.2. Integration

- nhận từng loại khế ước tạo history đúng tiếng Việt;
- nhận khế ước không làm thay đổi reward/state gameplay;
- Công Pháp Tiến Hóa hiển thị trong panel Công Pháp, không còn trong dashboard detail Thế Sự;
- Nghề nghiệp hiển thị trong panel Nhân Vật;
- Mệnh Số Tiến Hóa chỉ hiển thị trong modal Mệnh Số;
- Công Trình/Cơ Duyên mở đúng modal và resolve qua dispatcher cũ;
- save/load không đổi raw IDs hoặc mất state.

### 7.3. DOM/UI

- query text `escort`, `hunt`, `locked`, `kiem_khi_so_cap` không xuất hiện trong text content người chơi;
- tab Thế Sự không chứa card detail nghề nghiệp/công pháp/fate;
- click các nút mở modal không mutate state trước khi người chơi xác nhận;
- modal đóng/mở không tạo history duplicate;
- disabled reason dùng tiếng Việt.

### 7.4. Regression gate

```text
node --check js/i18n.js
node --check js/expansion.js
node tools/verify_game.js
```

Bổ sung test snapshot text cho các log ví dụ ở mục 3.4.

## 8. Thứ tự triển khai sau khi spec được duyệt

1. Tạo dictionary và formatter trung tâm.
2. Sửa contract log/target semantic.
3. Sửa label Công Pháp và trạng thái tiến hóa.
4. Tách section Nghề nghiệp sang Panel Nhân Vật.
5. Tách Công Pháp sang Panel Công Pháp.
6. Tách Mệnh Số sang modal Fate.
7. Tạo modal Công Trình và Cơ Duyên.
8. Tách tab `Thế Sự` và `Dị Chí`, đưa Cổ Tịch vào loop Dị Chí.
9. Tinh gọn dashboard Thế Sự.
10. Bổ sung graph nghề ẩn, action và clue unlock.
11. Bổ sung unit/integration/DOM regression.
12. Chạy verify và review trực quan.

## 9. Definition of Done

- Không còn raw ID/null trong text người chơi đối với các feature nêu trên.
- Mọi feature nằm đúng nhóm UI tương ứng.
- Log nhận escort/hunt/retrieve đọc tự nhiên bằng tiếng Việt.
- Công Pháp, Nghề nghiệp, Mệnh Số, Công Trình, Cơ Duyên có entry point rõ ràng.
- Không thay đổi logic gameplay ngoài việc sửa target semantic và text.
- Test hiện hữu và test mới đều pass.

## 10. Addendum — các thay đổi gameplay/UI bắt buộc

### 10.1. Cổ Tịch Tà Thần và nghề ẩn

#### Mục tiêu

Mỗi đại bản đồ chỉ có đúng một Cổ Tịch Tà Thần. Tổng cộng có bảy quyển, đánh số `I` đến `VII`. Đây là collectible độc lập theo map, không dùng chung item stack thông thường.

#### Data schema

```js
{
  id: "ta_than_codex_01",
  index: 1,
  name: "Cổ Tịch Tà Thần I",
  mapId: "trung_vuc",
  locationId: "...",
  discoveryType: "hidden_clue",
  state: "unknown|revealed|collected",
  clueIds: ["..."],
  unlocksHiddenProfession: "..."
}
```

Quy tắc:

- mỗi `mapId` chỉ có một record;
- không spawn lại sau khi `collected`;
- không đưa Cổ Tịch vào loot table, đấu giá, dung hợp hoặc vật liệu Hư Thiên Đỉnh;
- item có action riêng `Đọc Cổ Tịch`, `Đánh dấu vị trí`, `Thu Thập`;
- `Đọc Cổ Tịch` chỉ mở lore/clue, không trao nghề ngay;
- thu thập đủ 7 quyển mới mở màn hình chọn nghề ẩn.

#### Action và manh mối

Mỗi Cổ Tịch có chuỗi ba bước:

1. `Điều Tra Dấu Ấn`: yêu cầu đúng khu vực và đủ Thanh Tỉnh;
2. `Giải Mật Cổ Tịch`: dùng Tướng Sư, Xem Quẻ, NPC hoặc event liên quan;
3. `Thu Thập Cổ Tịch`: kiểm tra điều kiện cuối, ghi discovery và khóa collectible.

Manh mối phải được ghi vào `discoveries.codexClues`, có `source`, `day`, `confidence`. Manh mối sai chỉ thay đổi perceived text, không thay đổi vị trí thật.

#### Nghề ẩn

Nghề ẩn phải là một catalog data-driven, không giới hạn ở bốn nghề. Mỗi nghề có một đồ thị mở khóa riêng gồm Cổ Tịch, item, event, NPC, thời tiết, Mệnh Số hoặc hành vi người chơi. Bốn nghề dưới đây là vertical slice bắt buộc; các nghề tiếp theo kế thừa cùng schema:

| Nghề ẩn | Điều kiện mở | Action riêng |
|---|---|---|
| Tà Thần Học Giả | đủ 7 Cổ Tịch + đọc toàn bộ lore | Giải Mật Cấm Văn, tạo clue Tà Thần |
| Vạn Tượng Sư | đủ 7 Cổ Tịch + hoàn thành 3 Dị Triều | Dựng Mô Hình Thiên Tượng |
| Mệnh Khắc Sư | đủ 7 Cổ Tịch + một Mệnh Số Tiến Hóa | Khắc lại một effect trong whitelist |
| Luân Hồi Dẫn Lộ | đủ 7 Cổ Tịch + đã thăm mộ tiền kiếp | Mở action soi đường Luân Hồi |

Nghề ẩn cũng tuân luật một nghề chính/một nghề phụ ở mục 10.2. Không nghề ẩn nào được mở chỉ bằng việc sở hữu raw item mà không qua clue/action.

### 10.8. Đồ thị mở khóa nghề ẩn trong Dị Chí

#### Schema

```js
{
  id: "nghe_an_x",
  name: "...",
  category: "hidden_profession",
  codexRequirements: ["ta_than_codex_01", "ta_than_codex_04"],
  itemRequirements: [{ itemId: "...", quantity: 1, action: "identify" }],
  eventRequirements: [{ eventId: "...", outcomeId: "..." }],
  npcRequirements: [{ npcId: "...", relationTier: "tin_cay" }],
  worldRequirements: [{ type: "weather", value: "loi_vu", count: 2 }],
  fateRequirements: [{ type: "evolved", branchId: "..." }],
  behaviorRequirements: [{ type: "used_action", actionId: "...", count: 3 }],
  clueChain: ["clue_1", "clue_2", "clue_3"],
  unlockAction: "unlock_hidden_profession",
  professionActions: ["..."],
  conflicts: [],
  visibility: "hidden_until_clue"
}
```

#### Rule engine

- `hiddenProfessionProgress(state, professionId)` trả từng node `met/missing/unknown`, không trả raw ID cho UI;
- clue có thể mở theo nhiều nguồn nhưng không được tự hoàn tất node chưa được chứng kiến;
- item/event/NPC chỉ là một phần của điều kiện, phải đi qua action xác minh tương ứng;
- Cổ Tịch Tà Thần là backbone chung: mỗi nghề ẩn yêu cầu một subset hoặc thứ tự đọc khác nhau, đủ 7 quyển chỉ là điều kiện của nhóm nghề cấp cao;
- nghề ẩn cấp thấp có thể mở từ 1–2 Cổ Tịch + một event/item; nghề ẩn cấp cao yêu cầu chuỗi 4–7 Cổ Tịch và nhiều node liên kết;
- khi đủ graph, Dị Chí mở nút `Mở Con Đường`; action này chỉ ghi unlock, không tự chọn nghề nếu slot chính/phụ đã khóa;
- nghề đã unlock phải hiển thị trong catalog nghề với tên, lore, action, cost, conflict và điều kiện nâng bậc;
- nghề ẩn không được xuất hiện trong Panel Nhân Vật trước khi có ít nhất một clue liên quan.

#### Các loại node hỗ trợ

| Node | Ví dụ | Cách hoàn thành |
|---|---|---|
| Cổ Tịch | Cổ Tịch Tà Thần IV | thu thập và đọc |
| Item | Mảnh Thiên Cơ, Huyết Mặc | nhận/giám định/dùng đúng action |
| Event | Dị Triều Tà Thần | chọn outcome tương ứng |
| NPC | Tà Tu Ẩn Danh | đạt relation tier hoặc thẩm vấn |
| World | Lôi Vũ tại đúng map | chứng kiến đủ số lần |
| Fate | Mệnh Số đã tiến hóa | kiểm tra branch/active |
| Behavior | dùng action cấm | đếm unique event, không đếm click lặp |

#### Ví dụ các nghề ẩn bổ sung

| Nghề | Chuỗi mở khóa | Action đặc trưng |
|---|---|---|
| Tinh Tượng Sư | Cổ Tịch II + III, chứng kiến Lôi Vũ 2 lần, event Bão Linh Khí | đọc thiên tượng và dự báo event |
| Huyết Khế Sư | Cổ Tịch I + V, Cấm Thuật Huyết Tế đã tiến hóa, thẩm vấn Tà Tu | lập huyết khế với tù binh |
| Vô Danh Thợ Săn | Cổ Tịch III + VI, bắt sống 3 Dị Thú, không giết mục tiêu quest | truy dấu mục tiêu ẩn |
| Thủ Mộ Nhân | Cổ Tịch IV + VII, thăm 2 mộ tiền kiếp, quan hệ NPC đạt Tin Cậy | bảo hộ và khai quật mộ |
| Kẻ Giải Luật | đủ 7 Cổ Tịch, hoàn thành 3 event khác outcome, Mệnh Số Quy Nguyên | giải một modifier thế giới |

### 10.9. Sưu Tầm Dị Thú, NPC và phần thưởng NPC hiếm

#### Registry sưu tầm

Mọi lần gặp entity/NPC phải đi qua một registry thống nhất, kế thừa `state.discoveries` hiện hữu:

```js
{
  collectionId: "npc|beast|entity",
  entryId: "...",
  rarity: "common|uncommon|rare|legendary|mythic",
  firstSeenDay: 17,
  firstSeenLocationId: "...",
  encounterCount: 1,
  variantsSeen: [],
  known: true,
  rewardClaimed: false,
  clueIds: []
}
```

Quy tắc:

- gặp lần đầu ghi một entry duy nhất bằng `processedKey = collectionId + ":" + entryId + ":" + generation`;
- gặp lại chỉ tăng `encounterCount`, không phát lại phần thưởng lần đầu;
- cùng một NPC ở nhiều địa điểm vẫn là một entry, nhưng lưu toàn bộ `variantsSeen`/lịch sử địa điểm;
- Dị Thú bị bắt sống hoặc thuần hóa vẫn giữ entry sưu tầm, không nhận thêm full kill loot;
- entity quest-critical, boss hoặc Tà Thần chỉ ghi discovery khi đã đủ điều kiện nhìn thấy, không spoil trước trong Codex;
- entry có thể làm prerequisite cho nghề ẩn nhưng không tự mở nghề nếu chưa hoàn tất clue graph.

#### Rarity của NPC và Dị Thú

Rarity được lấy từ data catalog, không suy ra từ tên hiển thị:

| Rarity | Tần suất | Hiển thị |
|---|---:|---|
| Thường | cao | entry cơ bản |
| Hiếm | thấp | viền/biểu tượng hiếm + reward lần đầu |
| Huyền Thoại | rất thấp | event riêng + reward lớn hơn |
| Thần Thoại | điều kiện đặc biệt | chỉ xuất hiện khi đúng event/era/route |

`rare/legendary/mythic` NPC phải có ít nhất một trong các hook: thời gian xuất hiện, weather/season, Dị Triều, path, faction reputation, Cổ Tịch hoặc clue trước đó.

#### Thưởng khi gặp NPC hiếm

Ngay lần gặp đầu tiên, nếu NPC có rarity từ `rare` trở lên, gọi `grantRareEncounterReward(state, npcId)` một lần. Reward table ưu tiên nội dung mở rộng, không phá kinh tế:

| Rarity | Phần thưởng đề xuất |
|---|---|
| Hiếm | clue nghề ẩn hoặc clue Cổ Tịch + 1–2 Công Đức/EXP nhỏ |
| Huyền Thoại | item recipe, intel xác thực hoặc token Thí Luyện + Công Đức |
| Thần Thoại | mở một nhánh event/hidden realm seed, title cosmetic hoặc legacy clue |

Không phát thẳng Tiên Phẩm, Mệnh Số cấp cao hoặc raw stat lớn. Reward phải có `rewardKey`, `grantedDay`, `sourceNpcId`, `generation` để chống nhận trùng khi reload/đi qua lại.

Log mẫu:

```text
◇ Đã gặp NPC Hiếm: Lão Nhân Giữ Cổ Tịch · Clue Nghề ẩn nhận được.
✦ Gặp NPC Huyền Thoại: Sứ Giả Tinh Hải · nhận Công Thức Tinh Tượng Sư.
```

#### Action trong Dị Chí

- `Ghi Vào Dị Chí`: xác nhận entry sau lần gặp;
- `Quan Sát Biến Thể`: mở variant/clue nếu Tướng Sư hoặc Xem Quẻ đạt điều kiện;
- `Theo Dấu`: tạo route/quest seed tới lần gặp tiếp theo;
- `Đối Chiếu NPC Hiếm`: kiểm tra reward/clue đã nhận và điều kiện nghề ẩn liên quan.

Các action trên không được nằm trong Panel Nhân Vật hay tab Thế Sự; chỉ xuất hiện trong entry Codex hoặc action context khi NPC/entity đang hiện diện.

### 10.2. Khóa cố định một nghề chính và một nghề phụ

State:

```js
professionState: {
  primaryId: null,
  secondaryId: null,
  selectionLocked: false,
  selectedDay: null,
  hiddenUnlocked: []
}
```

Quy tắc chọn:

- chỉ được có một `primaryId` và một `secondaryId`;
- nghề phụ phải khác nghề chính;
- khi chọn đủ hai nghề, `selectionLocked = true`;
- đã khóa thì không đổi, không swap, không reset khi Luân Hồi;
- nếu mới chọn một nghề, người chơi được chọn nghề còn lại một lần;
- không cho chọn nghề phụ khi chưa có nghề chính;
- nghề ẩn chỉ xuất hiện trong danh sách sau khi đủ clue/unlock condition;
- UI phải hiển thị rõ `Còn 1 lượt chọn nghề phụ` hoặc `Bộ nghề đã khóa`.

Mọi action nghề nghiệp đọc cùng resolver `professionAvailability(state, professionId)`, không tự bypass lock trong UI.

### 10.3. Tái cấu trúc tab “Thế Giới” và “Nhân Duyên”

Tạo nhóm tab/panel mới:

```text
Thế Giới
├─ Tổng Quan Thế Giới
├─ Thế Sự: Dị Triều, mùa, thời tiết, chiến tranh, Đại Hội
├─ Cơ Duyên Tranh Đoạt
├─ Bí Cảnh
└─ Công Trình Tông Môn

Nhân Duyên
├─ Tù Binh & Dị Thú
├─ Quan Hệ NPC
├─ Truyền Thư
├─ Truy Nã
└─ Tình Báo / Thân Phận
```

`Tù Binh & Dị Thú` và `Quan Hệ, Truyền Thư & Truy Nã` không còn nằm trong dashboard Thế Sự chi tiết. Các state/runtime cũ giữ nguyên, chỉ thay entry point và renderer.

`Cơ Duyên Tranh Đoạt`, `Chiến Sự & Đại Hội`, `Công Trình Tông Môn` chuyển vào nhóm `Thế Giới`; có thể dùng modal con nhưng phải mở từ đúng nhóm.

### 10.4. Element cạnh clock và hệ quả thời tiết

Thanh clock phải hiển thị:

```text
[Năm 1, Tháng 2 ngày 17] [Kỷ Nguyên Linh Khí Dị Biến] [Mùa Xuân · Mộc] [☔ Mưa]
```

Thời tiết dùng record runtime:

```js
weatherState: {
  id: "mua",
  label: "Mưa",
  element: "thuy",
  startedDay: 17,
  endsDay: 19,
  regionId: "..."
}
```

Tác động tối thiểu:

| Thời tiết | Nhân vật | Thế giới |
|---|---|---|
| Mưa | mỗi ngày mất 1–2% HP hiện tại nếu ở ngoài trời; Hỏa damage -10%, Thủy damage +10% | travel risk +5%, encounter thú nước tăng |
| Sương | giảm 5% accuracy/perception; Tướng Sư khó xem tướng hơn | NPC schedule có thể trễ 1 ngày, discovery confidence giảm |
| Lôi Vũ | mỗi ngày có xác suất nhỏ mất 1 SAN hoặc 1 stamina | Lôi damage +20%, đường nguy hiểm hơn |
| Linh Phong | hồi phục Qi +5%, damage Phong +10% | travel risk -5%, mở clue di chuyển |
| Quang | không penalty | baseline |

Giới hạn:

- không để weather gây chết trực tiếp khi offline;
- damage theo ngày có cap và phải ghi `weatherTickKey` để idempotent;
- bonus/penalty chỉ đi qua `getWorldModifiers()`/`computeWeatherEffects()`, không cộng trực tiếp ở nhiều nơi;
- UI hiển thị icon + tooltip text, không chỉ dùng màu.

### 10.5. Thiên Kiếp Cá Nhân trong Panel Nhân Vật

Thiên Kiếp không nằm trong dashboard Thế Sự chi tiết. Panel Nhân Vật hiển thị card `Thiên Kiếp Cá Nhân` và nút mở modal.

Điều kiện tạo:

- nhân vật đạt EXP yêu cầu của cảnh giới kế tiếp;
- hoàn tất blocker của `getBreakthroughBlockers()`;
- đã ở cùng cảnh giới tối thiểu 3 ngày;
- không có `pendingTribulation` chưa resolve;
- SAN ≥ 20 và không đang `madness`;
- mỗi target realm chỉ roll một lần, persist trước khi render.

Modal phải hiển thị điều kiện đang thiếu, ba phương án hộ kiếp, chi phí và bonus. Khi Đột Phá thất bại, phương án đã chọn bị tiêu hao và không tự tạo lại cho cùng target.

### 10.6. Di Sản Luân Hồi trong Đặc biệt → Ký ức

Di Sản Luân Hồi, mộ tiền kiếp, lựa chọn legacy và preview transfer chuyển sang tab `Đặc biệt → Ký ức`. Đây là nhóm meta-progression lưu dấu các kiếp trước, không phải chỉ số build hiện tại. Thế Giới chỉ có discovery marker `Mộ tiền kiếp đã phát hiện` và nút dẫn sang Ký ức.

Điều kiện hiển thị:

- luôn hiển thị generation và số tiền kiếp;
- chỉ hiển thị lựa chọn legacy khi `pendingChoices.length > 0`;
- mộ chỉ hiện action khi player ở đúng `locationId` fallback;
- reward mộ nhận một lần, giữ audit khi location bị thay đổi;
- heirloom và fate evolution transfer phải hiển thị rõ giữ/mất trong preview Luân Hồi;
- tab Ký ức phải tách `Ký ức cốt truyện`, `Di Sản Luân Hồi`, `Mộ tiền kiếp` và `Vật Phẩm Di Truyền` thành các section gần nhau.

### 10.7. Phường Thị — tách Phường Thị và Đấu Giá trong cùng tab

Tab `Phường Thị` có hai section độc lập:

```text
Phường Thị
├─ Cửa Hàng / Nghịch Thương Nhân / Khâm Thiên Giám
└─ Đấu Giá
   ├─ danh sách lô hàng
   ├─ giá hiện tại và hạn đóng
   ├─ đấu giá lô hàng
   └─ lịch sử thắng/thua
```

Đấu Giá không xuất hiện trong `Thế Sự` hoặc `Tình Báo`. Hai section dùng chung currency formatter nhưng state `market` và `auction` tách biệt.

## 11. Quy tắc nhóm feature theo quan hệ

Khi thêm feature mới, áp dụng thứ tự ưu tiên:

1. feature tác động trực tiếp lên chỉ số/build → Panel Nhân Vật;
2. feature nâng cấp Công Pháp → Panel Công Pháp;
3. feature nâng cấp Mệnh Số → Modal Mệnh Số;
4. feature tác động node/faction/weather/war → Thế Giới;
5. feature tác động NPC/prisoner/mail/bounty → Nhân Duyên;
6. feature Luân Hồi/tiền kiếp/legacy → Đặc biệt → Ký ức;
7. feature giao dịch/currency → Phường Thị;
8. lore/collectible → Dị Chí/Codex, chỉ mở action khi có clue.

Không tạo tab mới nếu feature có thể kế thừa state/action/modal của nhóm tương ứng.

## 12. Test bổ sung cho addendum

- bảy Cổ Tịch có map/location duy nhất, không respawn và serialize đúng;
- từng Cổ Tịch có action `Điều Tra → Giải Mật → Thu Thập` và clue hiển thị tiếng Việt;
- đủ 7 Cổ Tịch mới mở nghề ẩn, thiếu một quyển phải hiển thị blocker cụ thể;
- chỉ chọn được một nghề chính và một nghề phụ; sau lock không đổi được;
- nghề ẩn không xuất hiện trước khi đủ điều kiện;
- Tù Binh/Dị Thú render trong Nhân Duyên, không render detail trong Thế Giới;
- Cơ Duyên/Chiến Sự/Đại Hội/Công Trình render trong Thế Giới;
- `Thế Sự` và `Dị Chí` tồn tại như hai tab độc lập, không dùng chung renderer detail;
- Cổ Tịch I–VII và clue nghề ẩn chỉ render trong `Dị Chí`;
- mỗi nghề ẩn có progress graph và blocker được dịch, không hiển thị raw node ID;
- Dị Chí có registry sưu tầm Dị Thú/NPC/thực thể với rarity và ngày gặp đầu tiên;
- NPC Hiếm/Huyền Thoại/Thần Thoại phát thưởng đúng một lần, rewardKey bền qua save/load;
- encounter lặp chỉ tăng bộ đếm, không nhân đôi reward hoặc clue;
- clock có element/mùa/weather label;
- weather tick gây đúng effect, không damage lặp khi load cùng ngày;
- Thiên Kiếp chỉ tạo đúng điều kiện và render ở Nhân Vật;
- Di Sản chỉ render ở Đặc biệt → Ký ức, mộ nhận reward một lần;
- Phường Thị có hai section độc lập, auction không làm reroll market;
- DOM scan không còn `escort`, `hunt`, `locked`, snake_case hoặc `null` trong text người chơi.

## 13. Definition of Done cập nhật

- Bảy Cổ Tịch Tà Thần và nghề ẩn có data, clue, action, unlock condition và save round-trip.
- `Thế Sự` và `Dị Chí` là hai tab độc lập; toàn bộ Cổ Tịch/clue/lore nằm trong `Dị Chí`.
- Nghề ẩn được mở qua graph gồm item, event, NPC, weather, Mệnh Số và hành vi; không unlock bằng raw item đơn lẻ.
- `Dị Chí` có bộ sưu tầm Dị Thú/NPC/thực thể, rarity và phần thưởng gặp NPC hiếm idempotent.
- Một nghề chính/một nghề phụ được khóa vĩnh viễn sau khi chọn đủ.
- UI được phân nhóm theo `Nhân Vật`, `Công Pháp`, `Mệnh Số`, `Thế Giới`, `Nhân Duyên`, `Đặc biệt → Ký ức`, `Phường Thị`, `Dị Chí`.
- Clock hiển thị element, mùa và weather; weather có tác động gameplay có giới hạn và idempotent.
- Thiên Kiếp nằm trong Panel Nhân Vật; Di Sản Luân Hồi nằm trong `Đặc biệt → Ký ức`.
- Không feature detail nào bị dồn sai vào dashboard Thế Sự.
- Tất cả test cũ và test addendum pass trước khi bắt đầu apply code.

## 14. Addendum — thành tựu, item nghề nghiệp và tương tác NPC toàn thế giới

### 14.1. Thành tựu bộ trang bị theo tên riêng

Các bộ trang bị có tên riêng trong hệ thống hiện tại, ví dụ `Bá Vương`, `Thiên Mệnh`, không chỉ là nhãn hiển thị mà trở thành một achievement set.

```js
{
  id: "set_ba_vuong",
  name: "Bá Vương",
  requiredSlots: ["artifact", "armor", "boots", "helmet"],
  matchingRule: "equipmentSetId",
  milestones: [2, 3, 4],
  achievements: ["..."],
  bonuses: { 2: {}, 3: {}, 4: {} },
  cosmeticTitle: "..."
}
```

Quy tắc:

- set nhận diện bằng `equipmentSetId`/`setTags` trong item catalog, không parse từ tên tự do;
- đạt mốc 2/3/full set tạo achievement một lần, có `achievementKey` và `unlockedDay`;
- chỉ item đang trang bị mới tính vào set; item trong kho không kích hoạt bonus;
- bộ hoàn chỉnh có thể mở title/cosmetic hoặc passive nhỏ trong whitelist, không cộng stat lớn ngoài pipeline trang bị;
- tháo một món làm bonus set mất hiệu lực nhưng achievement đã mở không bị mất;
- item procedural được refer set chỉ khi generator nhận `allowedSetIds`; không tự gắn vào bộ chỉ vì tên giống nhau;
- UI hiển thị tên set, số ô đang kích hoạt, mốc kế tiếp và phần thưởng; không hiển thị `equipmentSetId`.

### 14.2. Thành tựu nghề nghiệp

Mỗi nghề chính/phụ và nghề ẩn có achievement track riêng, dùng cùng registry thành tựu:

| Nhóm | Ví dụ mốc | Phần thưởng |
|---|---|---|
| Luyện Đan | luyện 10/50/100 lần, đạt Perfect 3 lần | công thức, title, cosmetic đan hỏa |
| Luyện Khí | tạo 5/20 pháp khí, tu bổ Di Truyền 3 lần | recipe, material discount nhỏ |
| Trận Pháp | đặt 5/25 trận, bảo vệ thành công 3 event | formation recipe, title |
| Tướng Sư | xem tướng 10 NPC, xác minh 5 clue | clue nghề ẩn, confidence bonus nhỏ |
| Nghề ẩn | hoàn tất action signature và chain lore | title nghề, action cosmetic/utility |

State achievement:

```js
professionAchievements: {
  [achievementId]: { progress: 0, target: 10, unlocked: false, unlockedDay: null, rewardClaimed: false }
}
```

Progress chỉ tăng từ action resolve thành công và `processedKey` duy nhất, không tăng do click lặp hoặc preview. Thành tựu không thay đổi luật một nghề chính/một nghề phụ.

### 14.3. Item chuyên cho nghề nghiệp

Tạo catalog item nghề nghiệp trong `data/profession_items.js` hoặc namespace tương đương:

| Item | Nghề | Action |
|---|---|---|
| Phương Thuốc | Luyện Đan | học recipe, tăng chất lượng một mẻ |
| Lò Đan Du Hỏa | Luyện Đan | mở batch Perfect có giới hạn |
| Bản Đồ Tinh Tú | Tướng Sư | mở action lập phương pháp chiêm tinh |
| Phương Pháp Chiêm Tinh | Tướng Sư | tạo DivinationHint theo future seed |
| Bút Khắc Trận | Trận Pháp | đặt formation đặc biệt |
| Chùy Luyện Khí | Luyện Khí | tạo/tu bổ pháp khí |
| Mực Huyết Cổ | nghề ẩn Huyết Khế Sư | mở action signature có Corruption cost |

Mỗi item phải có:

```js
{
  id, name, kind: "profession_item", professionId,
  actionId, recipeId, quality, charges,
  consumable, sourceTags, forbiddenFor: [],
  effectsWhitelist: []
}
```

Item nghề nghiệp có action rõ ràng trong context của nghề; nếu người chơi chưa sở hữu nghề tương ứng, UI chỉ hiển thị `Chưa đủ nghề để sử dụng`, không hiển thị raw action ID.

### 14.4. Quy tắc refer item có sẵn và tạo item mới

#### Ưu tiên refer item có sẵn

Một feature phải refer item catalog hiện hữu khi item đã có đủ:

- `id` ổn định;
- `kind` phù hợp;
- stat/effect nằm trong whitelist;
- economy/source/stacking đã được game sử dụng;
- không xung đột với item quest hoặc item cấm tiêu hao.

Ví dụ: `Linh Thạch`, `Tụ Khí Đan`, vật liệu khoáng có sẵn được dùng trực tiếp qua `itemId`; không tạo bản sao `profession_linh_thach`.

#### Khi nào tạo item mới

Chỉ tạo item mới nếu item cần một trong các thuộc tính mà catalog hiện hữu không thể biểu đạt:

- action nghề riêng;
- charges/quality/provenance;
- recipe hoặc clue identity;
- achievement/hidden profession gate;
- trạng thái generated item cần serialize.

Item mới phải đăng ký qua `registerGeneratedItem`/catalog data, có schema, tên tiếng Việt, source, rarity, economy cost và migration fallback. Không mutate static item để biến thành item nghề cho toàn bộ người chơi.

#### Không được làm

- không tạo item mới chỉ để đổi tên một item đã có;
- không copy stat/effect thủ công từ item cũ sang item mới nếu có thể refer;
- không đưa item nghề vào loot/market mặc định nếu chưa có `sourceTags`;
- không cho item nghề trở thành chất liệu Dung Hợp Mệnh Số hoặc Hư Thiên Đỉnh nếu chưa khai báo rõ.

### 14.5. Audit ngôn ngữ toàn bộ UX/UI

Thực hiện static scan và runtime scan trên toàn bộ text node, label, tooltip, modal, history, action bar, map badge và reward banner.

Các nhóm phải bắt lỗi:

```text
snake_case/camelCase;
function name/variable name;
null/undefined/NaN;
locked/trial/ready/chosen;
ID item/NPC/location/faction/event/quest;
English label chưa được phê duyệt.
```

Rule:

- raw ID chỉ được phép trong `data-*`, debug console và save raw;
- mọi text người chơi phải đi qua `GameEngine.I18n`;
- unknown key dùng fallback tiếng Việt `Chưa xác định` + context;
- lint dictionary phải báo key thiếu trước khi build;
- test DOM phải kiểm tra cả text content và `aria-label/title/placeholder`;
- tên riêng đã được duyệt như `Bá Vương`, `Thiên Mệnh`, `Cổ Tịch Tà Thần` được giữ nguyên, không dịch máy.

### 14.6. Propagation thời tiết/Dị Triều tới toàn bộ NPC

Thời tiết, mùa, Dị Triều, chiến tranh và thay đổi node phải tác động tới `npcState` của mọi NPC sống, không chỉ player.

Mỗi NPC cần resolver chung:

```js
E.npcWorldContext(state, npcId)
E.resolveNpcWorldReaction(state, npcId, context)
```

Context gồm:

```js
{
  regionId, weather, season, activeEvent,
  factionStatus, warFront, corruption,
  playerPresence, npcSchedule, npcTraits
}
```

Tác động tối thiểu:

- Mưa: NPC ngoài trời đổi lịch/trễ 1 ngày; NPC y sư có thể mở cứu trợ; thương nhân giảm hàng outdoor;
- Sương: NPC di chuyển chậm, gặp nhau ít hơn, confidence của tin đồn giảm;
- Lôi Vũ: NPC hệ Lôi/Pháp Sư nhận behavior bonus; dân thường tìm nơi trú, có thể mở rescue event;
- Linh Phong: NPC lữ hành di chuyển xa hơn, tăng cơ hội encounter/trao đổi;
- Dị Triều: NPC có trait/faction liên quan chọn hành vi khác nhau (săn, cứu trợ, khai thác, phong tỏa);
- chiến tranh: NPC thuộc faction tại front có thể mất tích, đổi node, bị bắt hoặc phát quest; NPC quest-critical không bị xóa, chuyển sang `missing/occupied`;
- player đứng cùng node: phản ứng được ghi vào history/relationship chỉ một lần mỗi event phase.

NPC reaction phải dùng deterministic seed theo `npcId + eventId + phase + day`, có cooldown và `processedKey`; không tạo history spam mỗi tick.

NPC reaction có thể tạo cascade hợp lệ:

```text
weather/event → NPC schedule → NPC-NPC encounter
→ relationship/mail/rumor → clue/contract/hidden profession progress
```

Không NPC nào được tự ý thay đổi world truth chỉ vì perceived rumor. Mọi consequence phải đi qua event/quest/state transition đã định nghĩa.

## 15. Test và Definition of Done bổ sung

- Bộ `Bá Vương`/`Thiên Mệnh` nhận achievement đúng mốc khi đang trang bị, tháo ra thì bonus mất nhưng achievement không mất;
- hai item cùng tên nhưng khác `equipmentSetId` không kích hoạt nhầm bộ;
- achievement nghề nghiệp tăng đúng một lần cho mỗi action resolve và save/load không nhân đôi;
- item `Phương Thuốc`, `Bản Đồ Tinh Tú`, `Phương Pháp Chiêm Tinh` có action, cost, charge và restriction rõ ràng;
- item đã có trong catalog được refer bằng `itemId`, không tạo bản sao; item mới có schema và serialize được;
- static/runtime UX scan không tìm thấy raw function/variable/ID/null trong text người chơi;
- NPC ở mọi region nhận cùng weather/event context theo seed deterministic;
- NPC reaction thay đổi schedule/dialogue/rumor/quest đúng trait và cooldown;
- weather/Dị Triều không chỉ tác động player mà còn tạo NPC-NPC và NPC-world cascade;
- NPC quest-critical không bị xóa khi chiến tranh/Dị Triều, chỉ chuyển trạng thái audit hợp lệ;
- reward gặp NPC hiếm, achievement set và achievement nghề nghiệp đều idempotent;
- `Thế Sự` và `Dị Chí` vẫn là hai tab độc lập; Cổ Tịch, collection và hidden-profession clue chỉ nằm trong `Dị Chí`.

Definition of Done mở rộng:

- Có catalog achievement cho set trang bị và nghề nghiệp.
- Có catalog item nghề nghiệp và quy tắc refer/create rõ ràng.
- Có audit ngôn ngữ tự động cho toàn bộ surface UI.
- Có resolver world context dùng chung cho player và toàn bộ NPC.
- Mọi phần thưởng/achievement/reaction có processed key, save round-trip và không lặp khi reload.

## 16. CHUẨN HÓA NGUỒN THỜI GIAN GAME (BỔ SUNG)

- Chỉ dùng thời gian thực: 30 giây thực = 1 ngày game; 15 phút = 1 tháng (30 ngày).
- Action/turn không cộng thêm ngày. Offline progress dùng cùng tỷ lệ và không tính trùng thời gian online.
- Mọi feature có thời gian (mùa, thời tiết, Dị Triều, tuổi thọ, Thiên Kiếp, Luân Hồi/Ký Ức, nhiệm vụ, deadline, cooldown, lịch NPC, quan hệ, mail, Tù Binh/Dị Thú, Cơ Duyên Tranh Đoạt, Chiến Sự, Đại Hội, Phường Thị, Đấu Giá, Công Pháp, Mệnh Số, nghề nghiệp, achievement, item charge, event nghề ẩn) phải dùng chung game clock/world context.
- Không feature nào tự đọc Date.now() hoặc tạo bộ đếm riêng; phải bảo đảm pause/reload/import/offline không nhân đôi elapsed time và event mỗi ngày chỉ resolve một lần.
- Kiểm thử: 30 giây tăng đúng 1 ngày; 29,9 giây giữ phần lẻ; 15 phút đúng 30 ngày; 10 action không làm tăng thêm ngày.
