# DISCOVERY CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\06-expansion\DISCOVERY_STATE_AND_REWARD_CANONICAL_2026-09-16.md`

# Discovery / Dị Chí / Reward State Canonical — 2026-09-16

## Phân biệt khái niệm

`Dị Chí` là lớp tri thức và phát hiện. Nó không tự tạo Con Đường, Nghề Ẩn hay Dị Thể. Các hệ thống đó chỉ đọc discovery làm điều kiện khi requirement riêng cho phép.

Một record discovery có bốn trạng thái đơn điệu:

```js
{
  firstSeenDay, source, level,
  status: "discovered" | "verified" | "collected" | "rewarded",
  verifiedDay, collectedDay, rewardedDay,
  clueIds, completedSetIds, lastTransitionSource
}
```

Không được lùi trạng thái hoặc phát thưởng lại khi load/replay. Reward source phải gọi `rewardDiscovery`; reward catalog/quest có unique key riêng.

## API

## Canonical read model bổ sung

Runtime cung cấp `discoveryStatusSummary(state)` để UI, save diagnostics và regression đọc cùng một nguồn dữ liệu. Resolver trả về `total`, `byStatus` và `byCategory` với bốn trạng thái độc quyền `discovered → verified → collected → rewarded`. Mọi status không hợp lệ của save cũ được chuẩn hoá về `discovered`; không có phép chuyển lùi.

Tab Dị Thể phải hiển thị tổng số và số lượng theo từng trạng thái, đồng thời chỉ đưa ra hành động kế tiếp hợp lệ cho từng record. Regression bắt buộc kiểm tra summary toàn cục, summary theo category và transition rollback.

**Note chưa hoàn thiện:** browser visual QA và content/balance của từng discovery category vẫn là gate riêng; resolver/state contract đã hoàn tất.

- `discover(state, category, id, source, level)` — tạo/nâng cấp phát hiện.
- `verifyDiscovery(...)` — xác nhận bằng đối chiếu/quan sát hợp lệ.
- `collectDiscovery(...)` — thu thập vật chứng/lõi.
- `rewardDiscovery(...)` — ghi nhận đã phát thưởng.

## UI

UI phải hiển thị status hiện tại và hành động hợp lệ kế tiếp; không dùng `level` để suy diễn đã thu thập hay đã nhận thưởng.

## Acceptance

- Dị Chí chưa verified không được hiển thị như fact chắc chắn.
- Cùng một reward không thể nhận hai lần sau serialize/deserialize.
- Dị Chí không đổi namespace sang Con Đường/Nghề/Dị Thể.


### Source: `archive-requirements\logic-history\06-expansion\HIDDEN_REALM_OFFLINE_CYCLE_REGRESSION_2026-09-17.md`

# Hidden Realm Offline Cycle Regression — 2026-09-17

## Canonical rule

Hidden Realm cycle expiry is processed by the same world tick used for offline catch-up. Once `closesDay` has passed, the runtime cannot remain open and the core reward cannot be claimed.

## Regression

`tools/verify_review_batches.js` creates an open cycle, enters it, advances three days offline past the close window, asserts the cycle is closed and verifies reward claim rejection plus final runtime validator success.

## Chưa hoàn thiện

Reward/content balance giữa các Hidden Realm khác nhau vẫn là tuning sản phẩm; lifecycle expiry and claim guard are canonical.

## Consolidated addendum: quest discovery and skill checks

- Quest discovery may be explicit, dynamic, NPC-derived, or hidden-world discovery. Hidden discovery remains absent from the normal quest list until its clue is verified.
- Quest dialogue may use existing character values (aptitude, comprehension, SAN, corruption, faction reputation) as checks; no new parallel stat system is introduced.
- Quest state, objectives, branches, alternatives, consequences, expiry, and reward receipts remain canonical state rather than text-only log output.
