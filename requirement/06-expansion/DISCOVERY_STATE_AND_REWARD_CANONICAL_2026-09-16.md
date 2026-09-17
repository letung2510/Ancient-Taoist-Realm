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
