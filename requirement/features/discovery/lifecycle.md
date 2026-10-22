# Khám phá — Vòng đời Dị Chí

## Mục đích

Trạng thái phát hiện (Dị Chí) theo bốn bước đơn điệu, API chuyển trạng thái, read model tổng hợp và hiển thị. Phát thưởng thật đi qua [reward/receipt-ledger.md](../reward/receipt-ledger.md).

## Dữ liệu & trạng thái

`state.discoveries[category][id]`:

```js
{
  firstSeenDay, source, level,               // level 1–3
  status: "discovered" | "verified" | "collected" | "rewarded",
  verifiedDay, collectedDay, rewardedDay,
  clueIds, completedSetIds, lastTransitionSource
}
```

## Rules

| ID | Rule |
|---|---|
| DSC-ST-001 | Dị Chí là lớp tri thức/phát hiện; không tự tạo Con Đường, Nghề Ẩn hay Dị Thể và không đổi namespace sang chúng. Các hệ đó chỉ đọc discovery làm điều kiện khi requirement riêng cho phép. |
| DSC-ST-002 | Bốn trạng thái độc quyền, đơn điệu `discovered → verified → collected → rewarded`; không chuyển lùi (trả lỗi, không mutate). Ngày chuyển (`<status>Day`) ghi lần đầu và không bị ghi đè. |
| DSC-ST-003 | API: `discover(state, category, id, source, level)` tạo/nâng cấp phát hiện (level chỉ tăng, kẹp 1–3); `verifyDiscovery` xác nhận bằng đối chiếu/quan sát hợp lệ; `collectDiscovery` thu thập vật chứng/lõi; `rewardDiscovery` ghi nhận đã phát thưởng. Mỗi transition ghi `lastTransitionSource`. |
| DSC-ST-004 | Chỉ chuyển sang `rewarded` sau khi reward commit thành công qua ledger (RWD-LED-002); load/replay không phát thưởng lại. |
| DSC-ST-005 | Status không hợp lệ ở save cũ được chuẩn hóa về `discovered`. |
| DSC-ST-006 | Read model `discoveryStatusSummary(state)` trả `{ total, byStatus, byCategory }`; UI, save diagnostics và regression đọc cùng nguồn này, không suy diễn từ ngày hay `level`. |

## UI

| ID | Rule |
|---|---|
| DSC-UI-001 | Hiển thị status hiện tại và chỉ hành động hợp lệ kế tiếp cho từng record; không dùng `level` để suy diễn đã thu thập/đã nhận thưởng. |
| DSC-UI-002 | Khối “Trạng thái khám phá” hiển thị tổng số và số lượng theo từng trạng thái, kèm danh sách theo category. |
| DSC-UI-003 | Dị Chí chưa `verified` không được hiển thị như fact chắc chắn. |

## Acceptance

- Summary toàn cục, summary theo category và transition lùi bị từ chối (gate `verify_review_batches.js`, `verify_dichi_deep.js`).
- Cùng một reward không thể nhận hai lần sau serialize/deserialize.
- Dị Chí không đổi namespace sang Con Đường/Nghề/Dị Thể.

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| DSC-ST-002, 003 | expansion.js:`discover`, `transitionDiscovery`, `verifyDiscovery`, `collectDiscovery`, `rewardDiscovery` | Khớp | `order[next] < order[current]` → lỗi “không thể lùi” |
| DSC-ST-004 | expansion.js:`claimHiddenRealmCore` | Khớp | `grantCanonicalReward` thành công rồi mới `rewardDiscovery` |
| DSC-ST-005, 006 | expansion.js:`discoveryStatusSummary`, `validateDiscoveryLifecycle` | Khớp | |
| DSC-UI-002 | ui.js: khối “Trạng thái khám phá” (`discoveryStatusSummary`) | Khớp | |
