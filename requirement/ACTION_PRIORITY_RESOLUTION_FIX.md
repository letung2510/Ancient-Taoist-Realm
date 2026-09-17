# ACTION PRIORITY RESOLUTION — THIẾT KẾ TÁCH ĐỘ ƯU TIÊN ACTION

## 1. Mục tiêu

Action bar phải xử lý được nhiều nguồn action cùng lúc: combat, pending exploration, cơ duyên tranh đoạt, NPC, incident, travel, breakthrough và các tiện ích toàn cục.

Không dùng một trường `priority: 0/1` cho tất cả mục đích. Một action có thể quan trọng về gameplay nhưng không nên chiếm quick bar; ngược lại, action an toàn như Trạng Thái luôn cần truy cập nhưng không được phá luật pending.

## 2. Mô hình dữ liệu chuẩn

Mỗi action sau khi được tạo phải được chuẩn hóa về dạng:

```js
{
  id: "act_exp_opportunity",
  label: "Ứng biến Cơ Duyên",
  tier: 0,                  // quyền chặn gameplay
  urgency: 100,             // thứ tự trong cùng tier, càng cao càng trước
  scope: "pending",         // pending | combat | local | global | system
  category: "opportunity",  // nhóm UI và giới hạn số nút
  surface: "quick",         // quick | overflow | modal
  blocking: true,           // có khóa context khác không
  consumesTurn: true,
  enabled: true,
  disabledReason: null,
  source: "expansion"
}
```

Các trường phải độc lập:

| Trường | Chức năng | Không dùng cho |
|---|---|---|
| `tier` | Chọn context gameplay đang thắng | Màu sắc hoặc thứ tự tuyệt đối |
| `urgency` | Sort trong cùng context | Quyết định action có chặn hay không |
| `blocking` | Chặn context khác | Đánh dấu action quan trọng chung chung |
| `surface` | Quick bar, Thêm hoặc modal | Luật gameplay |
| `category` | Nhóm, icon, quota UI | Quyết định context thắng |
| `enabled` | Có thể thực hiện hay không | Ẩn action không phù hợp |
| `consumesTurn` | Có tăng lượt hay chỉ mở thông tin | Thứ tự ưu tiên |

Action thiếu trường mới phải được normalize về giá trị mặc định, không suy luận từ vị trí push vào mảng.

## 3. Các tầng gameplay

Tầng nhỏ hơn có quyền chặn tầng lớn hơn. Chỉ xét tầng thấp nhất có action hợp lệ và `blocking: true`.

### Tier 0 — Bắt buộc xử lý ngay

- `STATE_ELDRITCH_INTERVENTION`, `STATE_FATE_BACKFIRE` và các state lựa chọn bắt buộc.
- Combat đang diễn ra: Tấn Công, Bỏ Chạy, skill hợp lệ.
- Pending cơ duyên tranh đoạt còn hạn.
- Pending exploration tại node hiện tại.
- Pending dialogue/incident có quyết định bắt buộc.

Tier 0 không trộn với action thông thường. Chỉ thêm action an toàn không tiêu lượt như `Trạng Thái`, `Quan Sát`, `Hành Trang` nếu hệ thống cho phép.

### Tier 1 — Ngữ cảnh trực tiếp

- NPC hiện diện tại đúng node/sub-location.
- Incident active tại node.
- Quest turn-in hoặc lựa chọn cục bộ đã sẵn sàng.

Chỉ xét khi không có Tier 0 blocking. Nhiều action cùng Tier 1 sort theo `urgency`, sau đó `sourceOrder` ổn định.

### Tier 2 — Action chuẩn tại địa điểm

- Thám Hiểm khi không còn pending.
- Tu Luyện, Tự Động Tu Luyện, Nghỉ Ngơi.
- Di chuyển và Về nơi an toàn.
- Hoạt động map cục bộ không bắt buộc.

### Tier 3 — Action toàn cục

- Trạng Thái, Hành Trang, Bản Đồ, Công Pháp, Tử Vi Mệnh Số.
- Nhiệm Vụ, Tổ Chức, Giúp.
- Đột Phá hoặc mở modal nghi thức khi đủ điều kiện.

Tier 3 mặc định nằm trong `Thêm`. Chỉ action có `surface: "quick"` rõ ràng mới được lên quick bar.

## 4. Resolver bắt buộc

```text
collect từ engine core + expansion + map + NPC
→ normalize schema
→ loại action không hợp lệ / hết hạn
→ dedupe theo action.id
→ xác định blocking context thắng
→ loại tier bị chặn
→ sort theo tier, urgency, sourceOrder
→ đóng gói quick bar / overflow / modal
```

UI chỉ trình bày kết quả resolver, không tự quyết định action nào được phép tồn tại.

```js
function resolveActions(state, rawActions) {
  const actions = dedupe(rawActions.map(normalizeAction));
  const blocking = actions
    .filter(a => a.enabled && a.blocking)
    .sort((a, b) => a.tier - b.tier || b.urgency - a.urgency);

  const winner = blocking[0] || null;
  const visible = winner
    ? actions.filter(a => a.tier === winner.tier || isSafeAction(a, state))
    : actions;

  return packSurfaces(sortStable(visible));
}
```

`isSafeAction()` phải là allow-list, không phải điều kiện “không phải action nguy hiểm”.

## 5. Collision giữa các context

Thứ tự mặc định:

1. Fate/system choice bắt buộc.
2. Combat.
3. Pending cơ duyên tranh đoạt.
4. Pending exploration tại node hiện tại.
5. Pending dialogue/incident bắt buộc.
6. NPC/incident thông thường.
7. Action địa điểm.
8. Action toàn cục.

Combat thắng pending interaction vì người chơi phải có quyền sinh tồn tức thời. Pending ở node khác không chặn thao tác hiện tại; khi bắt đầu rời node, engine xử lý thất lạc theo spec và ghi log.

Nếu cơ duyên phải thắng combat, đó phải là state forced riêng, không mô phỏng bằng cách tăng `urgency`.

## 6. Pending exploration và contested opportunity

### Pending exploration

Chuẩn hóa alias bằng một hàm duy nhất:

```js
getPendingExploration(state) // ưu tiên pendingExploration, fallback pendingSearch
```

Khi pending ở node hiện tại, chỉ tạo action thật sự áp dụng:

- `act_search_collect` nếu còn resource/rare chưa thu.
- `act_search_investigate` nếu còn information.
- `act_explore_npc_assist` nếu NPC hiện diện.
- `act_search_leave` luôn có.
- Action an toàn theo allow-list.

Không hiển thị đồng thời Thám Hiểm, Tu Luyện hoặc Di Chuyển như action bình thường.

### Pending contested opportunity

Action bar chỉ cần một action mở modal:

```text
Ứng biến Cơ Duyên → modal gồm yield / fight / scheme / share
```

Không tạo action giả có tên khác choice thật. Choice phải resolve bằng `runExpansionCommand("opportunity", choice)` và chỉ xử lý một lần theo `opportunity.id`.

## 7. Movement guard

Mọi đường di chuyển — action bar, bản đồ, fast travel, safe travel và command text — phải đi qua cùng một engine guard.

Khi còn pending tại node hiện tại:

1. Mặc định từ chối di chuyển.
2. UI hiển thị confirm modal.
3. Chỉ khi xác nhận, engine ghi pending là `lost`, xóa cả alias state rồi cho di chuyển.
4. Log ghi node, loại pending và lý do thất lạc.

Không đặt confirm chỉ trong callback UI vì map hoặc command text có thể bypass callback.

## 8. Quick bar và overflow

- `surface: "quick"`: được xem xét vào quick bar.
- `surface: "overflow"`: luôn ở menu Thêm.
- `surface: "modal"`: không render như chip action.
- Action disabled có lý do chỉ hiển thị khi người chơi cần biết; action không áp dụng thì ẩn.
- Quota category chỉ áp dụng lúc pack UI, không được làm mất action blocking.
- Action blocking không bị đẩy vào overflow vì quota.

Màu sắc không phải nguồn sự thật. Tier 0 cần thêm icon/nhãn/`aria-label` để không phụ thuộc màu.

### 8.1. Bố cục hiển thị chuẩn

Quick bar được đóng gói theo bốn vùng, theo đúng thứ tự:

```text
Context bắt buộc  →  Action chính  →  Action phụ  →  Tiện ích
```

- **Context:** pending, combat, incident hoặc lựa chọn bắt buộc; tối đa 6 nút quick, phần vượt quá được gom theo nhóm.
- **Action chính:** tối đa 2 nút có urgency cao nhất, thường gồm Tìm Kiếm và Tu Luyện.
- **Action phụ:** tối đa 5 nút có liên quan trực tiếp, gồm Hành Trang và Trạng Thái là hai tiện ích kiểm tra nhanh.
- **Tiện ích:** không cạnh tranh với gameplay action; nằm trong `Thêm` hoặc thanh tiện ích riêng.

Các hướng di chuyển được gom thành một nút `Di Chuyển` mở bản đồ. Skill chỉ bung thành nhiều nút khi đang combat; ngoài combat, skill nằm trong nhóm `Công Pháp`. NPC chỉ đưa tương tác nổi bật vào action phụ, các NPC còn lại nằm trong nhóm `NPC`.

Overflow không còn là danh sách phẳng. Các action phải được nhóm tối thiểu theo `category`: `Di chuyển`, `NPC`, `Công pháp`, `Nhiệm vụ`, `Tiện ích`, `Khác`.

## 9. Cache và invalidation

Fingerprint action context phải bao gồm pending exploration/search, pending opportunity, combat enemy IDs, forced state, dialogue/incident ID và phase, travel status, location/sub-location.

Mutation làm thay đổi các field này phải invalidate cache. Không dùng riêng `turn` hoặc `history.length` làm tín hiệu refresh.

## 10. Acceptance tests

- Pending exploration chỉ hiện choice áp dụng và action an toàn.
- `pendingExploration` và `pendingSearch` cho cùng kết quả.
- Pending opportunity không hiện Tu Luyện, NPC, Thám Hiểm hoặc Di Chuyển.
- Combat luôn có Tấn Công/Bỏ Chạy; action an toàn không bị quota làm mất.
- Pending node khác bị đánh dấu thất lạc khi rời node.
- Mọi movement path đều chạy movement guard.
- Action global luôn ở overflow nếu không được đánh dấu quick.
- Hai provider cùng `id` chỉ tạo một nút.
- Action hết hạn bị loại trước khi pack UI.
- Action thông tin không tăng lượt; action gameplay chỉ tăng lượt một lần.
- Save/load giữ nguyên context thắng và pending IDs.
- Cache không trả action cũ sau khi pending/combat/dialogue thay đổi.
- Trạng thái bình thường không có quá 2 action chính và 5 action phụ.
- Nhiều hướng đi chỉ tạo một nút `Di Chuyển` trên quick bar.
- Utility không chiếm slot quick của action gameplay.
- Overflow hiển thị theo nhóm, không phải một danh sách phẳng.

## 11. Nguyên tắc mở rộng

Action mới chỉ cần khai báo `tier`, `urgency`, `scope`, `category`, `surface`, `blocking` và `consumesTurn`. Không sửa các nhánh sort cũ trong UI.

Nếu action cần luật chặn khác thường, thêm một context resolver có tên và test riêng; không dùng `urgency` để mô phỏng luật chặn mới.
