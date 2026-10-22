# Nhân Vật — Neo Nhân Tính

## Mục đích

Neo Nhân Tính giữ bản ngã của nhân vật trước tri thức và quyền năng siêu nhiên. Neo là một mối quan hệ với NPC có thật (Nhân Duyên), không phải vật phẩm, được dùng ở bước Dựng Neo của nghi thức đột phá. Điểm quan hệ, sự kiện quan hệ và quà tặng thuộc [../relationship/README.md](../relationship/README.md); phân lớp NPC thuộc [../npc/README.md](../npc/README.md); cổng Neo theo cảnh giới thuộc [../realm-progression/README.md](../realm-progression/README.md).

## Dữ liệu & trạng thái

```js
player.anchors = [{
  id: "anchor_npc_<npcId>", npcId, name,
  type: "npc", source: "npc_relationship" | "legacy_anchor",
  stability, maxStability: 100,
  status: "active" | "stable" | "strained" | "broken",
  integrity: "intact" | "strained" | "broken", broken: boolean,
  establishedAtTurn, lastNurturedAt, lastNurturedDay, lastLifecycleDay
}]
state.relationships[npcId] = { trust, respect, fear, suspicion, identityRemembered?, ... }
state.relationshipEvents[npcId] = [{ tag, ... }]
player.knownNpcIdentities[npcId]
```

## Rules

### CHR-ANC-001 Neo là quan hệ NPC
Neo tham chiếu `npcId`, không lưu chỉ bằng tên. Không nhặt Neo trên bản đồ, không tự sinh Neo ("Neo nơi sinh thành"). Quà tặng không tự biến thành Neo.

### CHR-ANC-002 Ứng viên
`anchorCandidates(state)` chỉ trả NPC thỏa đồng thời:
- NPC tồn tại trong catalog/thế giới.
- `trust ≥ 55`, `respect ≥ 35`, `suspicion ≤ 35`, `fear ≤ 50`.
- Lớp NPC `persistent_named` hoặc `bondable_encounter`; `transactional_ephemeral` (thương nhân random, chợ đen, Nghịch Thương Nhân, người qua đường) không bao giờ là Neo.
- Có ít nhất một sự kiện ý nghĩa (`saved`, `kept_promise`, `shared_reward`, `supported_faction`) hoặc đã "Ghi nhớ danh tính" (`identityRemembered`). Nói chuyện lặp lại không đủ.

Ứng viên sắp xếp theo độ ổn định dự kiến giảm dần.

### CHR-ANC-003 Hình thành Neo
`establishHumanAnchor(state, npcId)`: NPC phải là ứng viên; tối đa 3 Neo hợp lệ (CHR-ANC-007) đang hoạt động. `stability` ban đầu `clamp(round(35 + 0,55×trust + 0,35×respect − 0,2×suspicion − 0,1×fear), 25, 100)` (ngưỡng ứng viên đảm bảo ≥ 65); **`maxStability = 100` cố định, không bằng `stability` ban đầu**; `status = anchorStatus(stability)`; `integrity = "intact"`, `broken = false`, `source = "npc_relationship"`, `type = "npc"`. Thành công ghi history.

### CHR-ANC-004 Ghi nhớ danh tính
`rememberNpcIdentity(state, npcId)` chỉ cho NPC còn sống và không phải `transactional_ephemeral`; lưu `knownNpcIdentities[npcId]` (tên, lớp, roleTags, homeLocationId, ngày). NPC `bondable_encounter` chưa ghi nhớ có thể mất dấu khi encounter hết hạn.

### CHR-ANC-005 Nuôi dưỡng Neo
`nurtureHumanAnchor(state, anchorId, amount = 10)`: Neo tồn tại và chưa vỡ; chi phí `ceil(amount / 5)` Linh Thạch (thiếu → không đổi gì); `stability = min(maxStability, stability + amount)`; ghi `lastNurturedAt`/`lastNurturedDay`; `status = anchorStatus(stability)`, `integrity` theo bảng dưới. Hàm duy nhất dùng cho establish, nurture, lifecycle và migration:
| `anchorStatus(stability, broken)` | Điều kiện | `status` | `integrity` |
|---|---|---|---|
| Vỡ | `broken` hoặc `stability ≤ 0` | `broken` | `broken` |
| Căng | `stability < 50` | `strained` | `strained` |
| Hoạt động | `50 ≤ stability < 75` | `active` | `intact` |
| Vững | `stability ≥ 75` | `stable` | `intact` |

### CHR-ANC-006 Vòng đời
`resolveHumanAnchorLifecycle(state, anchorId, { pressure, repair, break })`: `stability = clamp(stability − pressure + repair, 0, maxStability)`; `break` hoặc `stability ≤ 0` → broken (stability 0); các trường hợp còn lại `status`/`integrity` theo `anchorStatus` (CHR-ANC-005). Mức gợi ý cho nguồn sự kiện:
| Sự kiện | Δ ổn định |
|---|---:|
| Hoàn thành quest chung | +8…+15 |
| Bảo vệ NPC qua biến cố | +10…+20 |
| Quà đúng sở thích | +2…+6 |
| Đối thoại đúng lựa chọn cốt lõi | +3…+8 |
| Cùng chiến đấu và sống sót | +5…+12 |
| Bỏ rơi lời hứa / phản bội | −10…−30 |
| NPC bị thương, mất tích, đổi phe | −5…−25 |

NPC chết/phản bội/đổi sang phe đối địch → Neo broken. Neo broken không bị xóa, giữ lịch sử và có thể mở quest hàn gắn/thay thế. Mỗi thay đổi ghi history; UI hiển thị `ổn định hiện tại / ngưỡng cần`.

### CHR-ANC-007 Dùng trong nghi thức
**Neo hợp lệ** = `isValidHumanAnchor(anchor)`: `type === "npc"`, `source === "npc_relationship"`, có `npcId`, `broken === false`, `status ≠ "broken"`, `integrity ≠ "broken"`, `stability > 0`. Một predicate duy nhất cho bước Dựng Neo, gợi ý của bước (`breakthroughRitualGateHint`), các yêu cầu `Neo Nhân Tính` của cảnh giới (`breakthroughRequirements`, `maybeBreakthrough`) và đếm giới hạn 3 Neo (CHR-ANC-003); không còn kiểm `source === "npc"` hay chỉ `!broken && stability > 0`. Bước Dựng Neo hoàn tất khi có ≥ 1 Neo hợp lệ. Cổng cảnh giới: `requiresActiveAnchor` ≥ 1 Neo hợp lệ, `requiresStableAnchor` có Neo hợp lệ `stability ≥ 50`, `requiresHighAnchor` có Neo hợp lệ `stability ≥ 75`; chỉ cần một Neo đạt ngưỡng (không có khái niệm Neo chủ đạo). Neo `legacy_anchor` được giữ khi load nhưng không là Neo hợp lệ (không thỏa bước Dựng Neo lẫn các cổng trên). Neo đặt vào nghi thức không bị xóa khỏi quan hệ. Neo hợp lệ cũng mở lựa chọn "Nhờ Neo Nhân Tính" (+12) khi chống phản phệ.

### CHR-ANC-008 Dẫn đường khi thiếu Neo
Thiếu Neo phải báo rõ: "Chưa có Neo Nhân Tính. Hãy mở tab Nhân Duyên, xây dựng quan hệ với một NPC phù hợp rồi quay lại nghi thức." và modal Dựng Neo có nút `Mở Nhân Duyên` đi thẳng tới danh sách NPC. Tab Nhân Duyên hiển thị NPC, nơi gặp gần nhất, phe, Trust/Respect/Affinity/Suspicion, điều kiện còn thiếu, nút Tặng Quà (kèm lý do khóa), nút Thỉnh làm Neo khi đủ điều kiện, Neo hiện có và ngưỡng cảnh giới đang yêu cầu.

### CHR-ANC-009 Lưu và migration
Save giữ nguyên `npcId`, stability, status, integrity. Load (idempotent) với mỗi Neo: thiếu `id` → `legacy_anchor_<i>`; `source` thiếu → `npc_relationship` nếu có `npcId`, ngược lại `legacy_anchor`; `source === "npc"` (giá trị cũ) có `npcId` → `npc_relationship`; **`maxStability = 100`** (Neo cũ có `maxStability` bằng ổn định ban đầu được nâng lên 100, giá trị > 100 bị kẹp về 100); `stability` clamp `[0, 100]`; `status`/`integrity` tính lại bằng `anchorStatus` (Neo broken giữ broken).

## Acceptance

- Không thể tạo Neo khi chưa có quan hệ đạt ngưỡng hoặc NPC là `transactional_ephemeral`.
- Có thể tạo Neo, tăng ổn định và đạt 50/75 bằng gameplay: Neo mới `stability 66`, `maxStability 100`, `active`; Nuôi dưỡng +10 ×1 → `76`, `stable`, trừ 2 Linh Thạch; `stability 49` → `strained`; `stability 50` → `active`; `75` → `stable`; Nuôi dưỡng khi `stability 95` → `100` (kẹp).
- Dựng Neo không tự sinh Neo; Neo từ `establishHumanAnchor` thỏa bước Dựng Neo (`isValidHumanAnchor`); Neo `legacy_anchor` không thỏa bước Dựng Neo và không được đếm ở `requiresActiveAnchor`/`requiresStableAnchor`/`requiresHighAnchor`.
- Save cũ có Neo `{ stability: 66, maxStability: 66, source: "npc" , npcId }` → sau load `maxStability 100`, `source "npc_relationship"`, `status active`; load lần hai không đổi thêm.
- Save/load giữ `npcId`, stability, trạng thái broken.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CHR-ANC-002 | `js/engine.js:anchorCandidates` | Khớp |
| CHR-ANC-003 | `js/engine.js:establishHumanAnchor` (`maxStability: candidate.stability` → `100`; `status` qua `anchorStatus`; đếm giới hạn 3 qua `isValidHumanAnchor`) | Lệch |
| CHR-ANC-004 | `js/expansion.js:rememberNpcIdentity` | Khớp |
| CHR-ANC-005 | `js/expansion.js:nurtureHumanAnchor`; thiếu hàm dùng chung `anchorStatus` (engine, export) | Lệch — 50–74 bị gán `strained`; `resolveHumanAnchorLifecycle` không có mức `stable` |
| CHR-ANC-006 | `js/expansion.js:resolveHumanAnchorLifecycle`, `resolveOrganizationDefection` (đổi phe tổ chức làm vỡ Neo) | Lệch — dùng `anchorStatus` (CHR-ANC-005) |
| CHR-ANC-007 | `js/engine.js:performBreakthroughRitualStep` (`source === "npc"`), `breakthroughRitualGateHint` (`source === "npc"`), `breakthroughRequirements` (`anchors` lọc `!broken && stability > 0`), `maybeBreakthrough` (`activeAnchors`); thiếu `isValidHumanAnchor` | Lệch — bước Dựng Neo đòi `source === "npc"` trong khi `establishHumanAnchor` ghi `"npc_relationship"` → Neo hợp lệ bị từ chối; các cổng khác đếm cả `legacy_anchor` |
| CHR-ANC-008 | `js/ui.js` (modal Dựng Neo) | Thiếu — chưa có nút `Mở Nhân Duyên` |
| CHR-ANC-009 | `js/expansion.js` (normalize `player.anchors` khi load, dòng `maxStability: Math.max(1, anchor.maxStability \|\| 100)`); `js/engine.js:toCanonicalCharacter` | Lệch — chưa nâng `maxStability` về 100, chưa đổi `source: "npc"`, chưa tính lại `status` |
