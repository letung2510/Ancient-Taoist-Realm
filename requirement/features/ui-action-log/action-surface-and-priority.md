# UI & Action Log — Action surface và độ ưu tiên

## Mục đích

Thu thập action từ engine/expansion/map/NPC, chuẩn hóa, khử trùng lặp, chọn context gameplay đang thắng và đóng gói lên quick bar / Thêm / modal. UI chỉ trình bày kết quả resolver; mỗi click/lệnh chữ thực thi đúng một lần.

## Dữ liệu & trạng thái

Action DTO sau `normalizeAction`:

```js
{ id, label, description, tier, urgency, scope, category, surface, blocking,
  consumesTurn, enabled, disabledReason, danger, requiresConfirmation,
  target, payload, duration, cost, preview, source, sourceOrder }
```

| Trường | Chức năng | Không dùng cho |
|---|---|---|
| `tier` | Context gameplay đang thắng (số nhỏ chặn số lớn) | Màu, thứ tự tuyệt đối |
| `urgency` | Sắp xếp trong cùng tier (cao trước) | Quyết định có chặn |
| `blocking` | Chặn context khác | Đánh dấu "quan trọng" chung |
| `surface` | `quick` / `overflow` / `modal` | Luật gameplay |
| `category` | Nhóm, icon, quota UI | Chọn context thắng |
| `enabled` + `disabledReason` | Thực hiện được hay không, kèm lý do | Ẩn action không áp dụng |
| `consumesTurn` | Tăng lượt hay chỉ mở thông tin | Thứ tự |

Mặc định khi thiếu trường: `tier 2, urgency 0, scope "local", category "other", blocking false, consumesTurn true, enabled true`; `surface` = `overflow` nếu `tier ≥ 3`, ngược lại `quick`. Không suy luận từ vị trí push vào mảng.

## Rules

### Tầng gameplay

| ID | Rule |
|---|---|
| UI-ACT-001 | **Tier 0 — bắt buộc xử lý ngay:** state lựa chọn bắt buộc (`STATE_ELDRITCH_INTERVENTION`, `STATE_FATE_BACKFIRE`, `act_chon_*`, `act_journey_*`, `act_path_*`, `act_faction_*`, `act_ritual_*`), combat (Tấn Công, Bỏ Chạy, skill hợp lệ), cơ duyên tranh đoạt còn hạn, pending exploration tại node hiện tại, dialogue/incident bắt buộc. Tier 0 mặc định `blocking: true`. |
| UI-ACT-002 | **Tier 1 — ngữ cảnh trực tiếp:** NPC hiện diện đúng node/sub-location, incident active tại node, quest turn-in/lựa chọn cục bộ sẵn sàng. Chỉ xét khi không có Tier 0 blocking. |
| UI-ACT-003 | **Tier 2 — action địa điểm:** Thám Hiểm (khi không pending), Tu Luyện, Tự Động Tu Luyện, Nghỉ Ngơi, Di chuyển, Về nơi an toàn, hoạt động map không bắt buộc. |
| UI-ACT-004 | **Tier 3 — toàn cục:** Trạng Thái, Hành Trang, Bản Đồ, Công Pháp, Tử Vi Mệnh Số, Nhiệm Vụ, Tổ Chức, Giúp, Đột Phá/modal nghi thức khi đủ điều kiện. Mặc định ở `Thêm`; chỉ lên quick bar khi khai báo `surface: "quick"`. |
| UI-ACT-005 | Thứ tự va chạm: lựa chọn Mệnh/hệ thống bắt buộc → combat → cơ duyên tranh đoạt → pending exploration tại node → dialogue/incident bắt buộc → NPC/incident thường → action địa điểm → toàn cục. Combat thắng pending interaction (quyền sinh tồn). Nếu cơ duyên phải thắng combat thì đó là forced state riêng, không mô phỏng bằng `urgency`. |
| UI-ACT-006 | Safe action là allow-list: `act_trang_thai`, `act_nhin`, `act_hanh_trang`, và action `scope: "system"` không tiêu lượt. Safe action được tồn tại cạnh blocking action. |
| UI-ACT-007 | Action mới chỉ khai báo `tier/urgency/scope/category/surface/blocking/consumesTurn`; luật chặn khác thường phải là context resolver có tên và test riêng, không dùng `urgency` để giả lập. |

### Resolver

| ID | Rule |
|---|---|
| UI-ACT-010 | `resolveActions`: thu thập engine + expansion + map + NPC → normalize → loại action không hợp lệ/hết hạn → dedupe theo `id` (giữ bản đầu) → chọn blocking thắng (`tier` ↑, `urgency` ↓, `sourceOrder` ↑) → chỉ giữ cùng tier với winner + safe action → sort `tier → urgency → sourceOrder` → đóng gói surface. Kết quả deterministic. |
| UI-ACT-011 | `resolveActionPriority`: forced → combat (chỉ Tấn Công, Bỏ Chạy, `act_skill_*`, safe action) → pending dialogue/cơ duyên → pending exploration tại node (chỉ choice áp dụng + safe action) → bình thường. Engine guard là authority cuối cho xung đột combat/travel/ritual/cơ duyên. |
| UI-ACT-012 | Action không áp dụng thì ẩn; action có `disabledReason` chỉ hiện khi người chơi cần biết. UI đọc cả `disabledReason` và `disabled_reason`; action disabled không commit được qua `submitActionId`. |
| UI-ACT-013 | Nếu có cache action context, fingerprint phải gồm pending exploration/search, pending opportunity, ID kẻ địch, forced state, dialogue/incident ID và phase, trạng thái travel, location/sub-location; mutation các field này invalidate cache. Không dùng riêng `turn` hay `history.length`. |

### Pending exploration và cơ duyên tranh đoạt

| ID | Rule |
|---|---|
| UI-ACT-020 | Một hàm đọc alias duy nhất: ưu tiên `pendingExploration`, fallback `pendingSearch`; hai alias cho cùng kết quả. |
| UI-ACT-021 | Pending tại node hiện tại chỉ tạo action thật sự áp dụng: `act_search_collect` (còn tài nguyên/hiếm chưa thu), `act_search_investigate` (còn thông tin), `act_explore_npc_assist` (NPC hiện diện), `act_search_leave` (luôn có), `act_exp_map_event` (nếu có) + safe action. Không hiện Thám Hiểm/Tu Luyện/Di Chuyển như bình thường. |
| UI-ACT-022 | Cơ duyên tranh đoạt: action bar chỉ có một action **Ứng biến Cơ Duyên** mở modal (nhường / tranh / mưu / chia sẻ). Không tạo action giả khác tên choice thật. Choice resolve bằng `runExpansionCommand("opportunity", choice)` một lần theo `opportunity.id`. Khi pending không hiện Tu Luyện, NPC, Thám Hiểm, Di Chuyển. |
| UI-ACT-023 | Pending ở node khác không chặn thao tác hiện tại. |

### Movement guard

| ID | Rule |
|---|---|
| UI-ACT-030 | Mọi đường di chuyển (action bar, bản đồ, fast travel, safe travel, lệnh chữ) đi qua cùng engine guard. Còn pending tại node: mặc định từ chối → UI hỏi xác nhận ([UI-MOD-010](modals-and-confirmations.md)) → chỉ khi xác nhận engine ghi pending `lost`, xóa cả hai alias, cho đi và ghi log node/loại pending/lý do. Không đặt xác nhận chỉ ở callback UI. |

### Quick bar và Thêm

| ID | Rule |
|---|---|
| UI-ACT-040 | Quick bar gồm bốn vùng theo thứ tự: **Context** (tier 0, tối đa 6) → **Action chính** (tối đa 2, urgency cao nhất, thường Tìm Kiếm/Tu Luyện) → **Action phụ** (tối đa 5, gồm Hành Trang, Trạng Thái) → **Tiện ích** (không chiếm slot gameplay; ở `Thêm` hoặc thanh riêng). Một action chỉ xuất hiện ở một vùng. |
| UI-ACT-041 | Quota chỉ áp dụng khi đóng gói; action blocking không bao giờ bị đẩy vào overflow vì quota; combat luôn có Tấn Công/Bỏ Chạy. |
| UI-ACT-042 | Nhiều hướng đi gộp thành một nút `Di Chuyển` mở bản đồ. Skill chỉ bung nhiều nút khi combat; ngoài combat nằm trong nhóm `Công Pháp`. NPC nổi bật vào action phụ, NPC khác trong nhóm `NPC`. |
| UI-ACT-043 | `Thêm` nhóm theo category tối thiểu: Di chuyển, NPC, Công pháp, Nhiệm vụ, Tiện ích, Khác — không phải danh sách phẳng. Xác nhận một action thì đóng dropdown/popover. |
| UI-ACT-044 | Màu không phải nguồn sự thật: tier 0 có icon/nhãn/`aria-label`. |
| UI-ACT-045 | Bề mặt của tính năng mở rộng — Quick: sinh tồn combat, deadline sự kiện trong ngày, Chế Ngự khi mục tiêu đủ điều kiện HP. Overflow: nghe lén, gửi thư, đặt dấu, xem quẻ, mở thí luyện, công trình tông môn. Modal-only: chọn tiến hóa, đặt giá đấu giá, luyện theo mẻ, duyệt Cổ Tịch. |

### Khử trùng lặp

| ID | Rule |
|---|---|
| UI-ACT-DEDUP-001 | NPC nổi bật có thể nằm ở `location.npcs` (catalog tĩnh) và `worldSimulation.npcState` (scheduler) — là một người. `talkActions` dùng bản ghi scheduler khi NPC còn sống và ở đúng `locationId`/sub-location; chỉ dùng bản tĩnh khi không có scheduler. ID ổn định `act_talk_<npcId>`, phát đúng một lần. |
| UI-ACT-DEDUP-002 | Action pending discovery (`act_search_collect`, `act_search_investigate`, `act_explore_npc_assist`, `act_exp_map_event`, `act_search_leave`) đi qua `resolveActions` đúng một lần, dedupe theo id trước khi đóng gói; lớp trình bày không append lại. |
| UI-ACT-DEDUP-003 | Regression: `tools/verify_local_movement_weather.js` tạo bản ghi tĩnh và scheduler cho `hai_su_tu`; kết quả có đúng một `act_talk_hai_su_tu`. |

### Thực thi và replay

| ID | Rule |
|---|---|
| UI-ACT-050 | Nút là phương thức chính; lệnh chữ bổ sung: normalize, alias, parse intent/target (`parseAction`); mơ hồ thì hỏi lại; không hợp lệ thì fallback dễ hiểu. Command echo chỉ vào System Log. |
| UI-ACT-051 | `tab-content` có một delegated click listener; render lại không đăng ký listener trùng. Mọi action vào hàng đợi FIFO `enqueueAction()` rồi dispatch đúng một lần qua `submitActionId`/`runExpansionCommand`. Transaction/expected version chống action cũ. |
| UI-ACT-052 | Action ném lỗi: hàng đợi tự giải phóng, ghi một câu phục hồi cho người chơi và vẽ lại action surface. |
| UI-ACT-053 | Sau mọi thay đổi state: refresh action table, hành trang, panel và log. Action thông tin không tăng lượt; action gameplay tăng lượt đúng một lần. |
| UI-ACT-054 | Preview không đổi state và không tiêu RNG. Commit dùng action key duy nhất/turn; world event, encounter bản đồ, thời tiết, đấu giá, gặp NPC dùng resolver seeded hoặc idempotency key. |
| UI-ACT-055 | Hành trang: phân biệt vũ khí/giáp/pháp bảo/linh bảo, đan dược/tiêu hao, nguyên liệu/vật phẩm nhiệm vụ và Kho Mệnh. Trang bị kiểm tra xung đột slot/xác nhận; Dùng xử lý số lượng. |
| UI-ACT-056 | `act_journey_*` là họ action forced: luôn hiện và thực thi được khi journey intent đang chờ. |

## Acceptance

- Pending exploration chỉ hiện choice áp dụng + safe action; `pendingExploration`/`pendingSearch` cho cùng kết quả.
- Cơ duyên tranh đoạt không hiện Tu Luyện/NPC/Thám Hiểm/Di Chuyển; hai provider cùng `id` chỉ một nút; action hết hạn bị loại trước khi đóng gói.
- Mọi đường di chuyển chạy movement guard; pending node khác đánh dấu `lost` khi rời node sau xác nhận.
- Trạng thái thường ≤2 action chính, ≤5 action phụ; nhiều hướng chỉ một nút `Di Chuyển`; `Thêm` có nhóm.
- Save/load giữ context thắng và pending ID; hai save từ cùng snapshot + cùng input cho transcript người chơi giống hệt ở `type`, `text`, `clock`, `statDisplay`.
- Click nhanh liên tục vẫn qua FIFO, không thực thi đôi.
- Gate: `verify_action_dispatch_matrix.js`, `verify_ui_surface_contract.js`, `verify_review_batches.js`, `verify_local_movement_weather.js`, `verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| UI-ACT-001, 006, 010 | engine.js:`resolveActions`, `normalizeAction`, `isSafeAction`, `ACTION_DEFAULTS` | Khớp |
| UI-ACT-002, 004 | engine.js:`normalizeAction` (chỉ suy ra tier 0 hoặc 2; global không tự vào tier 3) | Lệch — action toàn cục không khai báo `tier: 3` vẫn mặc định `quick` |
| UI-ACT-011 | engine.js:`resolveActionPriority` | Lệch — khi pending exploration chỉ giữ `act_trang_thai`, bỏ `act_nhin`/`act_hanh_trang` khỏi allow-list |
| UI-ACT-012 | engine.js:`normalizeAction`; ui.js action render | Khớp |
| UI-ACT-013 | engine.js:`contextState` (tính lại mỗi lần, không cache) | Khớp |
| UI-ACT-020 | engine.js:`pendingExplorationAt` | Khớp |
| UI-ACT-022 | expansion.js:`runExpansionCommand("opportunity")` | Khớp |
| UI-ACT-030 | main.js: `confirm("Ngươi còn … tại đây…")` | Khớp (xác nhận qua confirm, xem UI-MOD-010) |
| UI-ACT-040–043 | engine.js:`resolveActionSurfaces`; ui.js category labels | Khớp |
| UI-ACT-DEDUP-001 | engine.js:`talkActions`; ui.js:`preferAction` | Khớp |
| UI-ACT-050 | engine.js:`parseAction` | Khớp |
| UI-ACT-051/052 | main.js:`enqueueAction`, `submitActionId` | Khớp |
| UI-ACT-056 | engine.js:`resolveActions` (prefix `act_journey_`) | Khớp |
