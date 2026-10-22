# Mô phỏng thế giới — Biến cố, Bí Cảnh, tin đồn

## Mục đích

Biến cố vùng có pha và lựa chọn, Bí Cảnh mở/đóng theo chu kỳ, tin đồn lan qua NPC theo cạnh bản đồ với độ tin cậy giảm dần; mọi thứ xác định và idempotent.

## Dữ liệu & trạng thái

```js
worldSimulation.events[id] = { id, templateId, regionId, phaseIndex, startedDay, phaseStartedDay, phaseEndsDay, seed, playerContribution, choiceHistory: [{ choiceId, day }], status: "active" | "resolved" | "cancelled", outcomeId, resolvedDay }
regionState[regionId].activeEventId, lastEventDay
worldSimulation.hiddenRealms[id] = { cycleIndex, opensDay, closesDay, status: "sealed" | "omen" | "open", competitors, claimLedger }
state.activeHiddenRealm = { realmId, cycleIndex, entryNodeId, coreNodeId, parentNodeId }
npc.rumors = [{ key, text, confidence, priority, sourceNpcId, sourceFactionId, receivedDay, expiresDay, alignment }]   // ≤ 12
npc.rumorLedger[key] = { confidence, priority, sourceNpcId, sourceFactionId, receivedDay, expiresDay, alignment }
worldSimulation.playerRumors[key]
```

## Rules

### Biến cố thế giới

| ID | Rule |
|---|---|
| WSIM-EVT-001 | `startWorldEvent(state, templateId, regionId, day)`: mỗi vùng tối đa một biến cố active; tôn trọng `cooldownDays` của template; tạo event ở pha 0, seed riêng, đặt `activeEventId`; sinh NPC-INT-002 (Tử Vi Du Nhân); log điềm báo nếu là vùng hiện tại. |
| WSIM-EVT-002 | `advanceEvent` mỗi tick: tới `phaseEndsDay` thì sang pha kế; hết pha → `resolved` với `outcomeId` theo đóng góp người chơi: ≥4 `contained`, ≥1 `survived`, 0 `ignored`; giải phóng `activeEventId`. |
| WSIM-EVT-003 | `resolveWorldEventChoice`: chỉ khi event active, người chơi ở đúng vùng, choice chưa chọn; kiểm đủ vật phẩm trước khi trừ; thưởng qua reward ledger key `<eventId>:<choiceId>` một lần; áp SAN, Tà Nhiễm, influence tạm thời (mặc định 7 ngày), cộng đóng góp. |
| WSIM-EVT-004 | Biến cố có thể đổi corruption vùng, resources/stability thế lực, influence, tin đồn và cơ hội tranh đoạt; consumer đọc state hiện tại, không đọc icon tĩnh. |

### Bí Cảnh

| ID | Rule |
|---|---|
| WSIM-HR-001 | Chu kỳ theo template: `cycleIndex = floor((day−1)/cycleDays)`, `opensDay = cycleIndex×cycleDays + 1`, `closesDay = opensDay + durationDays − 1`. |
| WSIM-HR-002 | Trạng thái: chưa mở khóa (`unlock` visited/path) → `sealed`; trong [opensDay, closesDay] → `open`; 2 ngày trước `opensDay` → `omen`; còn lại `sealed`. |
| WSIM-HR-003 | Bí Cảnh đóng hoặc sang chu kỳ khác khi người chơi đang ở trong → đưa về `parentNodeId` (hoặc nhà), xóa `activeHiddenRealm`, một log cảnh báo. |
| WSIM-HR-004 | Lõi Bí Cảnh có `claimLedger` theo chu kỳ; phe NPC cạnh tranh qua `competitors`; nhận lõi một lần mỗi chu kỳ. |

### Tin đồn

| ID | Rule |
|---|---|
| WSIM-RUM-001 | Chính sách duy nhất `RUMOR_POLICY`: cùng node −0.05, node kề −0.20, confidence clamp `[0.1, 1]`, TTL mặc định 14 ngày, tối đa 12 tin mỗi NPC. Áp cho mọi producer (tin đồn người chơi, bản sao NPC, tin sự kiện). |
| WSIM-RUM-002 | Mỗi tick: xóa tin và ledger hết hạn (`expiresDay < day`) trước khi lan; đóng băng ảnh chụp tin nguồn trước khi ghi đích để mỗi tin chỉ đi tối đa một cạnh mỗi tick, không phụ thuộc thứ tự object. |
| WSIM-RUM-003 | Nguồn và đích đều là NPC `alive`; đích cùng node hoặc ở node nằm trong `exits` của node nguồn. |
| WSIM-RUM-004 | Relay giữ source/priority; `expiresDay` của bản relay = `min(expiresDay gốc, day + 14)` — relay không bao giờ kéo dài hạn. |
| WSIM-RUM-005 | `rumorLedger` là nguồn dedupe theo key: nhận bản mới chỉ khi priority cao hơn, hoặc cùng priority và confidence cao hơn. Danh sách `rumors` là bản tường thuật có giới hạn, đồng bộ với ledger. |
| WSIM-RUM-006 | Tin đồn người chơi (`publishPlayerRumor`): key duy nhất, confidence 0.95, priority mặc định 2, `alignment` (`heroic`/`villainous`), TTL 14 ngày; nhân chứng ban đầu là NPC cùng node hoặc cùng tổ chức với người chơi. |
| WSIM-RUM-007 | Tin đồn chỉ tác động quan hệ qua REL-SOC-006 ([relationship/social-effects.md](../relationship/social-effects.md)). |
| WSIM-RUM-008 | `factionBulletin(state, factionId?)` là read model: gộp `rumors` + `rumorLedger` của NPC còn sống (lọc theo thế lực), bỏ tin hết hạn và key kỹ thuật (`npc-encounter:`, `npc-reaction:`), dedupe theo key (giữ confidence/priority/hạn lớn nhất, gom `sourceNpcIds`), xếp theo priority ↓, confidence ↓, hạn ↑, tối đa 24 dòng. Không mutate. |
| WSIM-RUM-009 | `rumorBulletinSnapshot` thêm `remainingDays` cho UI; tin hết hạn không bao giờ hiển thị. Bảng tin/quest thế lực đọc confidence từ ledger, không đọc toàn bộ world state. |
| WSIM-RUM-010 | `validateRumorPolicy` từ chối policy sai miền, NPC vượt 12 tin, tin thiếu key/confidence < 0.1/hạn không hữu hạn, ledger thiếu nguồn. |

## Acceptance

- Nguồn → relay → nhân chứng qua hai cạnh hợp lệ trong hai tick, confidence giảm đúng, hết hạn bị dọn.
- Replay offline cùng ngày không tạo bản ghi mạnh hơn hay kéo dài hạn.
- Bí Cảnh đóng khi người chơi bên trong → trả về node cha.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WSIM-EVT-001..002 | `js/expansion.js:startWorldEvent`, `advanceEvent` | Khớp |
| WSIM-EVT-003 | `js/expansion.js:resolveWorldEventChoice` | Khớp |
| WSIM-EVT-004 | `js/expansion.js:resolveWorldEventChoice`, `recordMapEventInfluence` | Khớp |
| WSIM-HR-001..003 | `js/expansion.js:updateHiddenRealms` | Khớp |
| WSIM-HR-004 | `js/expansion.js:claimHiddenRealmCore`, `hiddenRealmEnter`, `exitHiddenRealm` | Khớp |
| WSIM-RUM-001..004 | `js/expansion.js:RUMOR_POLICY`, `propagateNpcRumors` | Khớp |
| WSIM-RUM-005 | `js/expansion.js:propagateNpcRumors` (chỉ so confidence, bỏ qua priority) | Lệch |
| WSIM-RUM-006 | `js/expansion.js:publishPlayerRumor` | Khớp |
| WSIM-RUM-007 | `js/expansion.js:npcTalk` → `recordRelationshipEvent("heard_rumor")` | Khớp (2026-10-22) |
| WSIM-RUM-008..009 | `js/expansion.js:factionBulletin`, `rumorBulletinSnapshot` | Khớp |
| WSIM-RUM-010 | `js/expansion.js:validateRumorPolicy`, `rumorPolicySnapshot` | Khớp |
