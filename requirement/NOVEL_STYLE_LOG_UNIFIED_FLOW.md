# NOVEL STYLE LOG — LUỒNG KHỞI TẠO HỢP NHẤT (THAY THẾ TOÀN BỘ FILE LOG TRƯỚC ĐÓ)
> File này HỢP NHẤT và THAY THẾ: `GAME_LOG_NOVEL_STYLE_FIX.md`,
> `GAME_LOG_NOVEL_STYLE_FIX_IMPLEMENTATION_PLAN.md`, `NOVEL_STYLE_LOG_FULL_DEFINITION.md`, và mục 5
> của `ACTION_PRIORITY_RESOLUTION_FIX.md` (lỗi lặp narrative). Lý do hợp nhất: áp dụng từng phần
> riêng lẻ trước đó VẪN CHƯA CHẠY ĐÚNG — nghĩa là vấn đề không chỉ ở "thiếu 1 rule" mà có thể ở
> CHÍNH LUỒNG WIRING (event không thực sự đi qua pipeline mới). File này định nghĩa lại TOÀN BỘ luồng
> từ đầu tới cuối bằng pseudocode CỤ THỂ, không chỉ nguyên tắc — dùng làm nguồn THAM CHIẾU DUY NHẤT
> từ nay, không đọc lẫn lộn 3 file cũ nữa.

---

## 0. TẠI SAO CÁC LẦN FIX TRƯỚC CHƯA CHẠY — CHECKLIST TỰ KIỂM TRA TRƯỚC KHI ĐỌC TIẾP

Trước khi implement lại, xác nhận NHANH 4 điều sau bằng cách tự hỏi (hoặc grep code):
```
1. Hàm renderScene() có TỒN TẠI trong js/ui.js không, hay mới chỉ có trong tài liệu?
2. Nếu renderScene() đã tồn tại — nó có THỰC SỰ ĐƯỢC GỌI ở nơi render Player Log không, hay code
   vẫn đang gọi hàm render CŨ song song (2 đường render cùng tồn tại, đường cũ vẫn đang active)?
3. MỌI nơi emit event (search, travel, collect, NPC status, weather, combat...) có ĐI QUA
   pushHistory() → normalizeHistoryEvent() không, hay 1 số subsystem (đặc biệt NPC/weather reaction,
   đã xác nhận là thủ phạm ở `NOVEL_STYLE_LOG_FULL_DEFINITION.md`) vẫn gọi thẳng 1 hàm log riêng?
4. `tools/verify_log_narrative.js` (lint) đã được thêm vào quy trình build/test THẬT chưa, hay mới
   chỉ là file nằm đó không ai chạy?
```
Nếu câu trả lời BẤT KỲ câu nào là "chưa"/"không chắc" — đó chính là lý do fix trước không chạy. Luồng
dưới đây viết lại để address CHÍNH XÁC cả 4 điểm này.

---

## 1. TOÀN BỘ LUỒNG — TỪ EVENT THÔ ĐẾN CÂU VĂN CUỐI CÙNG

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MỌI subsystem (search/travel/collect/combat/NPC/weather/faction/army)   │
│  KHÔNG ĐƯỢC gọi trực tiếp bất kỳ hàm render/log nào khác ngoài 1 CỔNG    │
│  DUY NHẤT:  emitEvent(rawEvent)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    normalizeHistoryEvent(rawEvent)
                    (chuẩn hóa thành Event Envelope đầy đủ field, xem mục 2)
                              │
                              ▼
                    pushHistory(state, normalizedEvent)
                    (lưu vào state.history — KHÔNG render gì ở bước này)
                              │
                              ▼ (khi UI cần vẽ lại Player Log)
                    groupIntoScenes(state.history)
                    (gom theo timestamp+locationId+sceneId+quan hệ nhân-quả, xem mục 3)
                              │
                              ▼
                    Với MỖI scene:
                      1. Lọc bỏ debugOnly / COMMAND_ECHO
                      2. narrativeError() cho mọi event type ERROR/BLOCKED (xem mục 4)
                      3. NarrativeSceneBuilder(scene) -> chọn/ghép template (xem mục 5-6)
                      4. runBannedPatternLint(text) -> FAIL BUILD nếu dính (xem mục 7)
                      5. Gom Stat Display cuối scene
                              │
                              ▼
                    renderScene(scene) -> [1 timestamp] + [1 đoạn văn] + [1 dòng stat]
                              │
                              ▼
                    Hiện trong Player Log (System Log riêng vẫn giữ event thô cho debug)
```

**QUY TẮC CỨNG TUYỆT ĐỐI (vi phạm = bug, không phải "chưa tối ưu"):**
```
KHÔNG có subsystem nào được phép gọi thẳng vào DOM/UI render hoặc ghép chuỗi text rồi hiện ra Player
Log mà KHÔNG đi qua emitEvent() -> ... -> renderScene(). Nếu tìm thấy 1 chỗ code làm vậy (kể cả 1
dòng nhỏ như "NPC phản ứng thời tiết"), đó CHÍNH LÀ bug gốc rễ, sửa nó TRƯỚC KHI viết thêm template gì.
```

---

## 2. EVENT ENVELOPE — FIELD ĐẦY ĐỦ (chuẩn hóa qua `normalizeHistoryEvent()`)

```js
{
  id,
  type,                    // "search"|"travel"|"collect"|"npc_weather_reaction"|"combat"|... KHÔNG
                            // GIỚI HẠN danh sách — mọi loại event MỚI thêm sau này đều bắt buộc có type
  rawText: string | null,  // text gốc chưa qua narrative, CHỈ dùng nội bộ để build, KHÔNG render thẳng
  timestamp,                // { year, month, day, era } — dùng để nhóm scene
  locationId,
  sceneId: string | null,   // null thì normalizeHistoryEvent() tự sinh dựa trên timestamp+locationId
  relation: "standalone" | "cause" | "result",
  causedBy: eventId | null, // trỏ tới event là NGUYÊN NHÂN trực tiếp (VD collect.causedBy = search.id)
  playerVisible: boolean,
  debugOnly: boolean,
  errorCode: string | null, // VD "TRAVEL_ALREADY_ACTIVE" — GIỮ LẠI cho System Log, KHÔNG render thẳng
  stats: [],                 // dữ liệu số cho Stat Display, tách khỏi narrative
  narrativeKey: string | null, // trỏ tới template group sẽ dùng ở NarrativeSceneBuilder
  npcContext: { npcId, role, personality } | null,  // MỚI — cần cho template NPC đa dạng (mục 6)
  weatherContext: { type, intensity } | null          // MỚI — cần cho template thời tiết
}
```

---

## 3. `groupIntoScenes()` — GOM SỰ KIỆN THÀNH CẢNH

```js
function groupIntoScenes(history) {
  const scenes = [];
  let current = null;
  for (const event of history) {
    const sameScene = current &&
      current.timestamp === event.timestamp &&
      current.locationId === event.locationId &&
      (event.relation === "result" && event.causedBy === current.lastEventId
       || current.sceneId === event.sceneId);
    if (sameScene) {
      current.events.push(event);
      current.lastEventId = event.id;
    } else {
      if (current) scenes.push(current);
      current = { sceneId: event.sceneId ?? generateSceneId(event), timestamp: event.timestamp,
                  locationId: event.locationId, events: [event], lastEventId: event.id };
    }
  }
  if (current) scenes.push(current);
  return scenes;
}
```
Cặp LUÔN gộp theo `causedBy` (đã định nghĩa trước, giữ nguyên): search+collect, move+arrival,
attack+combat_result. Event KHÔNG có quan hệ nhân-quả với event trước nhưng CÙNG timestamp+location
(VD "hé lộ quan hệ Faction" + "gặp NPC" xảy ra cùng lúc khi vừa tới node — đúng tình huống lỗi lặp 3
lần trong ảnh trước đó) PHẢI ĐƯỢC GOM CHUNG 1 scene nếu cùng `sceneId` — sceneId nên được gán CHUNG
cho "1 lần đến 1 node" thay vì để mỗi event tự sinh sceneId riêng (đây là nguyên nhân cụ thể của lỗi
lặp 3 lần đã phát hiện).

---

## 4. `narrativeError()` + `ERROR_NARRATIVE_MAP` (đầy đủ, mở rộng từ bản cũ)

```js
const ERROR_NARRATIVE_MAP = {
  TRAVEL_ALREADY_ACTIVE: ["Ngươi vẫn còn trên đường, chưa thể khởi hành thêm lần nữa.",
                           "Đôi chân vẫn chưa dừng bước; hãy đợi hành trình này kết thúc đã."],
  ROUTE_NOT_FOUND: ["Con đường trước mặt chưa hiện hình rõ ràng."],
  IN_COMBAT: ["Giữa lúc giao chiến, ngươi không thể rời bước."],
  INSUFFICIENT_TRAVEL_COST: ["Hành trang chưa đủ để tiếp tục chuyến đi."],
  SUB_LOCATION_UNKNOWN: ["Lối rẽ này chưa thuộc về địa đồ hiện tại."],
  PENDING_EXPLORATION_BLOCKED: ["Còn điều gì đó ở đây chưa được giải quyết — hãy xong việc trước đã."],
  // BẮT BUỘC: mọi mã lỗi MỚI thêm vào engine phải có mặt ở đây TRƯỚC KHI merge code, không sau
};

function narrativeError(errorCode, context) {
  const options = ERROR_NARRATIVE_MAP[errorCode];
  if (!options) {
    logToSystemOnly("MISSING_ERROR_NARRATIVE: " + errorCode); // cảnh báo dev, KHÔNG throw ra player
    return pickFallbackNeutral(context); // "Có điều gì đó cản trở hành động này."
  }
  return pickByContext(options, context); // đang mưa/combat/hết tài nguyên... chọn câu phù hợp nhất
}
```

---

## 5. `NarrativeSceneBuilder(scene)` — GHÉP TEMPLATE THÀNH ĐOẠN VĂN

```
Với scene có nhiều event (VD search+collect):
  1. Lấy narrativeKey của event ĐẦU (event nguyên nhân) làm khung mở đầu
  2. Lấy kết quả TỔNG HỢP (cộng dồn item/stat của TẤT CẢ event trong scene) để điền vào template
  3. Nếu có event "result" phụ (VD Cơ Duyên tranh chấp xuất hiện giữa lúc collect) -> nối thêm 1 câu
     PHỤ vào cuối đoạn văn chính (không tách dòng riêng, không lặp timestamp)
  4. Output: 1 đoạn văn liền mạch + 1 mảng stats gộp (render riêng ở Stat Display)
```

---

## 6. NGÂN HÀNG TEMPLATE — HỢP NHẤT TOÀN BỘ (search/travel/error/NPC×thời tiết)

### 6.1. Search + Collect (giữ nguyên từ bản trước, đã đạt 6/6 tiêu chí)
```
"Ngươi lặng người dò xét từng ngóc ngách của {location}. {n_luot} lượt tìm kiếm trôi qua, thân thể
có phần mệt mỏi, nhưng bù lại thu được {items}."
```

### 6.2. Travel Blocked
```
"Ngươi vẫn còn đang trên đường, đôi chân chưa thể cất bước thêm lần nữa."
```

### 6.3. NPC × Thời Tiết (ĐẦY ĐỦ theo vai trò, thay thế hoàn toàn câu "phản ứng với thời tiết X: Y")
```
Thương Nhân + Tuyết: "Tuyết rơi mỗi lúc một dày trên mái sạp — {npcName} thở dài, bắt đầu thu dọn
  hàng hóa vào bao, ánh mắt thoáng tiếc nuối vì phiên chợ hôm nay đành kết thúc sớm."
Tu Sĩ/Đệ Tử + Tuyết: "Gió tuyết lùa qua vạt áo, nhưng {npcName} vẫn đứng yên trước sân luyện công —
  chỉ khẽ nheo mắt, dường như cái lạnh này chẳng đáng bận tâm với người tu đạo."
Bất kỳ + Mưa: "Mưa bất chợt đổ xuống, {npcName} vội kéo nón che đầu, bước nhanh về phía mái hiên gần
  nhất, để lại vài vũng nước loang trên nền đất."
Bất kỳ + Bão Linh Khí: "Không khí đột nhiên đặc quánh, linh lực cuộn xoáy vô hình quanh {npcName} —
  hắn/nàng tái mặt, vội niệm quyết hộ thân, lùi sâu vào trong tường viện."
```
> TUYỆT ĐỐI KHÔNG dùng 1 template chung `"{npcName} phản ứng với thời tiết {weather}: {effect}"` —
> đây CHÍNH LÀ câu đã xác nhận sai ở `NOVEL_STYLE_LOG_FULL_DEFINITION.md`.

### 6.4. Cơ Duyên tranh chấp
```
"Trong lúc cúi nhặt, ngươi cảm nhận có ánh mắt khác cũng đang dõi theo món cơ duyên này."
```

---

## 7. LINT — BẮT BUỘC CHẠY TRƯỚC MỖI LẦN RENDER (không chỉ lúc build)

```js
const BANNED_WORDS = ["Depth", "session", "counter", "index", "state", "buff", "debuff",
                       "cooldown", "multiplier"];
const ERROR_CODE_PATTERN = /\b[A-Z][A-Z0-9_]{3,}\b/;
const ANNOUNCEMENT_STRUCTURE_PATTERN =
  /^.{2,30}\s(phản ứng|thực hiện|kích hoạt|cập nhật|ghi nhận|xử lý|áp dụng)\s.{2,40}[:：]/;

function runBannedPatternLint(text) {
  if (ERROR_CODE_PATTERN.test(text)) return fail("Lộ mã lỗi nội bộ: " + text);
  if (BANNED_WORDS.some(w => text.includes(w))) return fail("Chứa từ cấm kỹ thuật: " + text);
  if (ANNOUNCEMENT_STRUCTURE_PATTERN.test(text)) return fail("Cấu trúc thông báo hệ thống: " + text);
  if (text.includes(':') || text.includes('：')) return fail("Dấu hai chấm trong narrative: " + text);
  return pass();
}
```
Chạy hàm này ở **CẢ 2 nơi**: (1) `tools/verify_log_narrative.js` lúc build/test (chặn merge code lỗi),
VÀ (2) ngay trong `renderScene()` lúc runtime thật (chặn ngay cả khi lint build bị bỏ qua vì lý do
gì đó — đây là lớp phòng thủ THỨ 2, đảm bảo dù quy trình build có lỗ hổng, runtime vẫn không bao giờ
hiện câu vi phạm ra Player Log — nếu lint runtime fail, dùng NGAY câu fallback trung tính thay vì
crash hay hiện text thô).

---

## 8. TEST TOÀN DIỆN (regression suite — chạy lại TOÀN BỘ sau khi implement)

```
□ 10 event cùng ngày, cùng node -> chỉ 1 timestamp hiện ra (không lặp 10 lần)
□ 3 event khác nhau (đến node + hé lộ quan hệ Faction + gặp NPC) cùng lúc đến 1 node -> gộp 1 scene,
  KHÔNG viết lại câu mở đầu 3 lần (đúng bug đã thấy ở ảnh trước)
□ Search + Collect -> 1 scene duy nhất, không phải 2 block
□ Travel blocked -> hiện câu narrative, KHÔNG hiện "TRAVEL_ALREADY_ACTIVE"
□ NPC phản ứng thời tiết -> hiện đúng template theo vai trò (mục 6.3), KHÔNG hiện cấu trúc
  "X phản ứng với Y: Z"
□ Chạy runBannedPatternLint() trên TOÀN BỘ text đã render trong 1 phiên chơi test 30 phút -> 0 lỗi
□ Command echo (`> [Tên lệnh]`) KHÔNG xuất hiện ở Player Log
□ System Log (debug) vẫn giữ đầy đủ event thô + errorCode gốc để truy vết
□ Save cũ (thiếu sceneId/relation) vẫn render được qua normalizeHistoryEvent() tự sinh field thiếu
```

---

## 9. VIỆC CẦN LÀM TIẾP — THEO ĐÚNG THỨ TỰ, KHÔNG NHẢY BƯỚC
1. Chạy checklist mục 0 TRƯỚC — xác định chính xác đang thiếu wiring ở đâu (nhiều khả năng: NPC/
   weather reaction vẫn gọi thẳng 1 hàm log riêng, chưa qua `emitEvent()`).
2. Đảm bảo TẤT CẢ subsystem (không riêng search/travel/collect) đều gọi qua `emitEvent()` — grep
   toàn bộ codebase tìm mọi nơi còn ghép chuỗi text rồi push thẳng vào history/DOM.
3. Implement `groupIntoScenes()` (mục 3) — ĐẶC BIỆT chú ý phần sceneId chung cho "1 lần đến node"
   để sửa dứt điểm lỗi lặp 3 lần.
4. Implement lint 2 lớp (build-time VÀ runtime, mục 7) — đây là lớp phòng thủ khiến bug KHÔNG THỂ
   lọt ra player dù code ở đâu đó vẫn còn sai.
5. Chạy đủ 9 test ở mục 8, KHÔNG coi là xong nếu còn bất kỳ ô nào fail.
6. Sau khi 5 bước trên xong và test pass — XÓA hẳn 4 file log cũ đã liệt kê ở đầu tài liệu này (hoặc
   archive) để tránh dev sau đọc nhầm tài liệu đã lỗi thời.
