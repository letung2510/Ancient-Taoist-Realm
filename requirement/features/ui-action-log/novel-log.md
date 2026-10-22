# UI & Action Log — Nhật ký tiểu thuyết

## Mục đích

Mọi sự kiện người chơi nhìn thấy được kể thành văn tiểu thuyết tiên hiệp, nhóm theo cảnh, tách số liệu sang kênh riêng; dữ liệu chẩn đoán vẫn được giữ nguyên trong `state.history`.

## Dữ liệu & trạng thái

| Thành phần | Nội dung |
|---|---|
| Envelope sự kiện (`state.history[]`) | `id` (deterministic), `type`, `text`, `narrative.text`, `errorCode`, `relation`/`causedBy`, `sceneId`, `locationId`/node/sub-location, `weather`, `clock`, `worldClock`, `timestamp`, `playerDayIndex`, `worldDayIndex`, `visibility`/`playerVisible`, `debugOnly`, `importance`, `context`, `changes`, `statDisplay[]` |
| Ba lớp log | System Log (debug/audit/error/command echo) · Game Log (event cơ chế có cấu trúc) · Narrative Log (văn người chơi đọc) |
| Event type chính | `CULTIVATION`, `REST`, `BREAKTHROUGH`, `COMBAT`, `LOOT`, `EXPLORE`, `TRAVEL`, `TALK`, `WORLD_EVENT`, `SYSTEM`, `COMMAND_ECHO` |
| Importance | `TRACE`, `NORMAL`, `IMPORTANT`, `RARE`, `LEGENDARY`, `MYTHIC` — chỉ quyết định độ dài/hiển thị văn, không đổi cơ chế |
| Bảng dịch lỗi | `ERROR_NARRATIVE_MAP[code] = [câu văn…]` |

Giới hạn lưu trữ history/archive: xem [data-runtime/performance-budget](../data-runtime/performance-budget.md). Ranh giới lỗi hiển thị (alert): xem [i18n-text-rules](i18n-text-rules.md).

## Rules

### Gateway và envelope

| ID | Rule |
|---|---|
| UI-LOG-001 | Mọi producer ghi lịch sử qua `emitEvent()`; `pushHistory(state, entry)` là alias tương thích, dùng chung chuẩn hóa/persist: `pushHistory` → `createGameEvent` → `narrativeSafe`. Không producer nào render trực tiếp vào DOM. |
| UI-LOG-002 | Envelope persist giữ raw text, mã lỗi, quan hệ sự kiện, cảnh/vị trí, visibility, context và `statDisplay`. Player Log là **projection**; không được xóa dữ liệu chẩn đoán khỏi `state.history`. |
| UI-LOG-003 | Render lịch sử dùng snapshot `clock` lưu trong event, không dùng clock hiện tại để ghi đè. |
| UI-LOG-004 | Lịch sử legacy (không có ID/statDisplay) được chuẩn hóa deterministic khi deserialize (`legacy_<n>`), không sinh ID bằng random; render qua cùng grouping. |
| UI-LOG-005 | Producer thế giới (world simulation, NPC, thời tiết, tổ chức, đấu giá, công trình, offline projection) dùng cùng gateway; NPC chỉ phát log khi ở cùng node/sub-location với người chơi; mô phỏng nền không spam nhật ký. |

### Nhóm cảnh và hiển thị

| ID | Rule |
|---|---|
| UI-LOG-010 | `novelLogParagraphs()` là API nhóm canonical; `renderScene()` và story panel dùng chung. Hai event liền kề cùng cảnh khi cùng ngày game (Năm/Tháng/Ngày) **và** cùng `sceneId`; event `relation: "result"` có `causedBy` nhập vào cảnh của event gây ra nếu cùng ngày và cùng `locationId`. Khác ngày, khác node hoặc khác `sceneId` mở đoạn mới. |
| UI-LOG-011 | Mỗi cảnh = `【<nhãn Player Clock>】` một lần + một đoạn văn liền mạch (các câu nối bằng khoảng trắng) + tối đa một dòng stat tổng hợp `◇ …` ở cuối đoạn. Không dùng dạng `[clock]: nội dung`, không lặp timestamp cho từng event. |
| UI-LOG-012 | Cặp nhân–quả luôn gộp một đoạn: Tìm Kiếm + Thu Thập, Di Chuyển + Đến Nơi, Tấn Công + Kết quả đòn đánh. Một hành động của người chơi không tách thành hai block. |
| UI-LOG-013 | `COMMAND_ECHO`, `debugOnly`, `playerVisible: false` và event lỗi kỹ thuật không vào Player Log; System Log/diagnostic giữ chúng. |
| UI-LOG-014 | Story panel append theo đoạn đã nhóm; auto-scroll chỉ khi người đọc đang ở cuối, nếu không hiện "Có diễn biến mới". |
| UI-LOG-015 | Template chọn theo type/importance/context (player, cảnh giới, clock, vị trí, thời tiết, NPC, faction, combat, loot, kết quả). Độ dài: Compact cho event lặp; Short cho event quan trọng; Extended cho đột phá/thế giới/ẩn/cột mốc. Combat được nén vừa đủ. Chọn biến thể phải deterministic theo seed, không ảnh hưởng cơ chế. |
| UI-LOG-016 | Văn không được lộ thông tin chưa unlock (khám phá, NPC, thế giới, sự kiện ẩn). AI (nếu có) chỉ viết văn, không quyết định state; lỗi AI → template fallback + ghi System Log. |

### Kênh số liệu

| ID | Rule |
|---|---|
| UI-LOG-020 | Số lượt, delta, phần thưởng, chi phí, tỷ lệ, lý do dừng và kết quả định lượng nằm trong `statDisplay`/`changes`; `createGameEvent()` tách `changes` thành `statDisplay`, `renderGameEvent()` chỉ trả văn. |
| UI-LOG-021 | Stat của mọi event trong cảnh gộp, khử trùng lặp thành một dòng ở cuối đoạn (`✦` thu được, `◇` hao tổn/còn lại). Dấu `:` chỉ được phép trong dòng stat. `statDisplay` không được dùng để bypass lint. |

### Chuẩn văn tiểu thuyết (lint)

Một câu/đoạn đạt chuẩn khi thỏa **cả 6** tiêu chí; thiếu một là không đạt.

| ID | Rule |
|---|---|
| UI-LOG-030 | **Không cấu trúc thông báo:** cấm `[chủ thể] + [động từ hệ thống: phản ứng/thực hiện/kích hoạt/cập nhật/ghi nhận/xử lý/áp dụng] + [:] + [hệ quả]`; regex lint `^.{2,30}\s(phản ứng\|thực hiện\|kích hoạt\|cập nhật\|ghi nhận\|xử lý\|áp dụng)\s.{2,40}[:：]`. Cấm mọi dấu `:`/`：` trong đoạn văn. |
| UI-LOG-031 | **Chi tiết giác quan:** ít nhất một hình ảnh, âm thanh, xúc giác hoặc khứu giác cụ thể. |
| UI-LOG-032 | **Động cơ cá nhân:** chủ thể hành động theo tính cách/vai trò/hoàn cảnh riêng, không phải "do hệ thống". |
| UI-LOG-033 | **Không lộ cơ chế:** không mô tả công thức hay biến số ("giảm hoạt động"), kể hành vi cụ thể ("dẹp sạp hàng", "co ro dưới mái hiên"). |
| UI-LOG-034 | **Liên tục:** câu nối được với câu trước/sau trong cảnh. |
| UI-LOG-035 | **Đọc như tiểu thuyết xuất bản**, không như HUD/debug console dịch sang tiếng Việt. Chỉ xóa dấu `:` mà không viết lại câu là không đạt. |
| UI-LOG-036 | Token kỹ thuật cấm trong văn: mã `SCREAMING_SNAKE_CASE` (≥4 ký tự), tên hàm/field/namespace, `internal`, `debug`, `raw`, `payload`, `field_name`, `undefined`, `null`, `Depth`, `Search`, `session`, `phiên`, `lượt dò`, `counter`, `index`, `ID`, `state`, `buff`, `debuff`, `multiplier`, `cooldown`. Câu bắt đầu bằng tên action/hàm cũng cấm. |
| UI-LOG-037 | Mã lỗi/blocked đi qua `ERROR_NARRATIVE_MAP`; mã chưa có mapping thay bằng một câu trung tính có nghĩa (ví dụ "Có điều gì đó cản trở hành động này."), không bao giờ để chuỗi rỗng hay lộ mã. Mỗi mã lỗi mới phải có ít nhất một câu dịch trước khi dùng. |
| UI-LOG-038 | `narrativeSafe()` là fallback cuối: chuyển cấu trúc thông báo thành câu kể, loại token kỹ thuật, bỏ `:`; áp dụng cả cho log legacy khôi phục từ save. Lint chạy ở build/test (`verify_log_narrative.js`) và tại boundary render (`formatPlayerLogText`, `validateLogSurfaceState`). |
| UI-LOG-039 | Template mới chỉ được thêm khi: tự chấm đạt 6/6 → qua regex UI-LOG-030 → đọc thành tiếng không giống debug. |

### Ngân hàng template tối thiểu

| ID | Rule |
|---|---|
| UI-LOG-040 | Có template theo key: `explore.search.success_partial`, `explore.search.exhausted`, `travel.blocked.already_active`, `opportunity.contested`; mỗi key ≥2 biến thể. |
| UI-LOG-041 | NPC × thời tiết: template chọn theo (loại thời tiết × vai trò NPC × tính cách nếu có), phủ tuyết, mưa/âm vũ, sương, lôi vũ, linh phong, bão linh khí; thương nhân, tu sĩ/đệ tử, thường dân phản ứng khác nhau; hiện tượng siêu nhiên (bão linh khí) phải khác thời tiết thường. Mỗi template có chi tiết giác quan, phản ứng cá nhân và hành động cụ thể. |

Ví dụ chuẩn (dùng làm fixture hiệu chỉnh):

```text
【Nhân vật · Năm 1, Tháng 1, Ngày 8】

Ngươi thu vào tay mảnh Cổ Tịch Tàn Trang phủ đầy bụi thời gian, cùng hai viên Linh Thạch Hạ Phẩm còn vương hơi lạnh của đất. Ngươi định rẽ hướng Bắc, nhưng hành trình dở dang chưa khép lại, đành quay sang hướng Đông — không bao lâu sau, Phù Không Đảo đã hiện ra trước mắt.
✦ Thu được Cổ Tịch Tàn Trang ×1 · Linh Thạch Hạ Phẩm ×2
◇ Thể Lực -5 · Còn có thể dò thêm 1 lượt
```

Ví dụ cấm: `Tự động tu luyện: vận công 5 lượt…`, `NPC Tạ Hải Sinh phản ứng với thời tiết Tuyết: giảm hoạt động ngoài trời.`, `× Không thể bắt đầu hành trình: TRAVEL_ALREADY_ACTIVE.`

## Luồng

```text
Action → mechanics → createGameEvent (tách statDisplay) → state.history
→ novelLogParagraphs (lọc echo/debug, nhóm cảnh) → formatPlayerLogText/narrativeSafe (lint, ERROR_NARRATIVE_MAP)
→ story panel: 【clock】 + đoạn văn + dòng stat
```

## Acceptance

- Log mẫu 10 hành động cùng ngày tại một node cho đúng một heading; không còn dòng `> [Tên Lệnh]`.
- Mã đã map và chưa map đều ra câu văn có nghĩa; không token ở UI-LOG-036 lọt ra.
- Deserialize cùng snapshot giữ nguyên event ID và `statDisplay`.
- Gate: `verify_log_narrative.js`, `verify_log_producers.js`, `verify_expansion_log_matrix.js`, `verify_legacy_log_matrix.js`, `verify_game.js` (đều trong `tools/run_regression_suite.js`).

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| UI-LOG-001 | engine.js:`emitEvent`, `pushHistory`, `createGameEvent` | Khớp |
| UI-LOG-002, 013 | engine.js:`groupIntoScenes` (lọc `debugOnly`/`playerVisible`/`COMMAND_ECHO`) | Khớp |
| UI-LOG-004 | engine.js:`normalizeHistoryEvent` | Khớp |
| UI-LOG-010 | engine.js:`novelLogParagraphs`, `groupIntoScenes` | Lệch — so khớp ngày + `sceneId` (hoặc `causedBy`), không so `locationId` khi `sceneId` trùng |
| UI-LOG-011 | engine.js:`renderScene` (`【clock】`), ui.js:`addStory` | Khớp |
| UI-LOG-014 | ui.js story panel | Thiếu — chưa có nhãn "Có diễn biến mới" |
| UI-LOG-020/021 | engine.js:`createGameEvent`, `renderGameEvent`, `novelLogParagraphs.statDisplay` | Khớp |
| UI-LOG-030–038 | engine.js:`narrativeSafe`, `lintNarrativeText`, `formatPlayerLogText`, `ERROR_NARRATIVE_MAP`, `validateLogSurfaceState` | Khớp |
| UI-LOG-005 | expansion.js:`organizationInteract` (log nối "tại tọa độ x, y", in trạng thái `hostile/allied` thô) | Lệch — lộ tọa độ và mã trạng thái trong văn |
