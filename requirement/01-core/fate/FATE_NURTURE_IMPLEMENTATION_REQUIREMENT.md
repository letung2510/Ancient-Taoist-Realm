# FATE — Dưỡng Mệnh Implementation Requirement

## Mục tiêu

Dưỡng Mệnh là hoạt động đầu tư có giới hạn cho một Mệnh đang kích hoạt. Nó bổ trợ hành vi thật, không được trở thành vòng lặp bấm nút để bỏ qua combat/quest.

## Contract

```js
engine.nurtureFate(state, fateId) => {
  success, cost, status, cooldown?, reason?
}
```

## Luật bắt buộc

1. Chỉ `state.player.fates` được Dưỡng; Mệnh Kho luôn không có hiệu lực.
2. Chi phí Linh Thạch là `5 + relationshipStage * 5`.
3. Mỗi Mệnh chỉ được Dưỡng một lần trong một ngày game (`lastNurtureDay`). Không đủ tài nguyên hoặc còn cooldown thì state không đổi.
4. Thành công tăng `relationshipPoints +1`, reset `stagnantDays = 0`, ghi `lastNurtureTurn/lastNurtureDay` và log kết quả.
5. Bậc 0→1 cần một thử thách elite/boss hoặc 7 ngày active; bậc 1→2 cần 3 lựa chọn aligned. Dưỡng Mệnh chỉ đóng góp điểm, không tự nhảy qua bậc 2.
6. Hành vi thật gọi `recordFateBehavior`: combat elite/boss, tu luyện và lựa chọn aligned. Mọi thay đổi stage phải trace trong history.
7. Khi active theo ngày mà stage không đổi, `activeDays` và `stagnantDays` tăng. `stagnantDays >= 60` mở action Buông Mệnh, không tự động gỡ hoặc phạt stat.

## Tương thích

Quan hệ được lưu trong `state.player.fateRelationships[fateId]`, migration giữ các field cũ (`relationshipStage`, `relationshipPoints`). Gameplay state cập nhật trước; narrative chỉ phản ánh kết quả.

## API liên quan

`nurtureFate`, `recordFateBehavior`, `resonateFate`, `releaseStagnantFate`, `fateRelationshipStatus` trong `js/engine.js`.
