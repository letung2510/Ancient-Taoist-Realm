# OFFLINE WORLD SIMULATION — CANONICAL CONTRACT

## Mục đích

Mô phỏng ngoại tuyến phải giữ đúng các biến cố có ảnh hưởng đến save nhưng không
được chạy actor-level vô hạn trong thời gian người chơi vắng mặt.

## Chính sách baseline

`state.worldSimulation.offlinePolicy`:

```js
{
  schemaVersion: 1,
  detailedWindowDays: 30,
  aggregateBatchDays: 3,
  actorStateProjection: "final_state_plus_incidents",
  idempotencyKey: "lastProcessedDay"
}
```

- Khoảng thời gian cũ hơn 30 ngày được xử lý bằng aggregate projection.
- 30 ngày cuối được chạy theo actor/world tick hiện hành để giữ NPC, weather,
  war, hidden realm, contract và incident ở trạng thái có thể giải thích.
- Kết quả aggregate không được tạo log chi tiết giả cho từng actor; chỉ được
  tạo các state tổng hợp, cascade và incident cần thiết.
- `lastProcessedDay` là khóa idempotency. Gọi lại cùng target day không được
  cộng reward, tạo event, trừ tài nguyên hoặc thay đổi inventory lần nữa.
- `lastOfflineAudit` ghi `processed`, `aggregate`, `detailed`, `mode`,
  `targetDay` và `source` để chẩn đoán save/catch-up.

## Actor history projection

During the detailed window, `worldSimulation.actorHistory[npcId]` retains up to
30 daily projected snapshots: node/sub-location, AI state, status, needs,
weather/mood, queue rank and rumor count. Older days remain aggregate-only;
final actor state and local incidents remain authoritative.

## Các mode được phép

- `actor_window`: toàn bộ khoảng cần xử lý nằm trong cửa sổ chi tiết.
- `aggregate_then_actor_window`: xử lý aggregate phần cũ rồi actor-level 30 ngày
  cuối.
- `idempotent`: target không vượt `lastProcessedDay`, không có mutation.

## Acceptance

1. Kết quả 30 ngày và 60 ngày đều có mode đúng chính sách.
2. Gọi lặp cùng target day giữ nguyên inventory và world simulation.
3. Deserialize rồi catch-up tiếp tục từ `lastProcessedDay`, không chạy lại ngày
   đã xử lý.
4. Seed world giữ deterministic giữa hai state có cùng save identity.
5. `validateExpansionState` chấp nhận save có policy/audit hoặc tự normalize save
   thiếu các field này.

## Phần chưa hoàn thiện

- Chưa có browser benchmark trên thiết bị yếu và save archive kích thước lớn.
- Actor-level projection của từng NPC trong phần aggregate vẫn là trạng thái cuối
  và incident; chưa mô phỏng lại toàn bộ lịch sử hành vi từng ngày.
