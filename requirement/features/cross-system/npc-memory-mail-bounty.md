# Cross-system — NPC nổi bật, ký ức quan hệ, truyền thư, truy nã, hộ tống (SYS-03)

## Mục đích

NPC nổi bật có lịch di chuyển, tương tác với nhau, nhớ hành vi người chơi; người chơi gửi thư, treo truy nã, thuê hộ tống. Luật NPC chung: [npc](../npc/README.md); quan hệ/danh tiếng: [relationship](../relationship/README.md).

## Dữ liệu & trạng thái

```js
NotableNpcRuntime { npcId, currentNodeId, homeNodeId,
  scheduleType: "static"|"patrol"|"itinerant", route: [], routeIndex, nextMoveDay,
  status: "alive"|"missing"|"captured"|"dead", factionId, role,
  relationshipsWithNpcs: {}, memoryWithPlayer: [], mailbox: [] }
relationshipEvents[npcId] = [{ id, tag, day, locationId, questId, outcome, deltas, uniqueKey }]
```

## Rules

| ID | Rule |
|---|---|
| CSX-NPC-001 | Chỉ NPC `notable: true` được tick lịch (MVP tối đa 20); không mô phỏng mọi NPC catalog. |
| CSX-NPC-002 | Hai NPC nổi bật cùng node: tối đa một tương tác/node/ngày (giao dịch, đấu khẩu, tỷ thí, mật hội). Người chơi có mặt → sinh action nghe lén/can thiệp/quan sát; vắng mặt → chỉ ghi world fact quan trọng, không tạo loot miễn phí. |
| CSX-NPC-003 | Giữ bốn chỉ số `trust/fear/respect/suspicion`, clamp 0–100. Tag sự kiện MVP: `saved`, `threatened`, `kept_promise`, `broke_promise`, `shared_reward`, `used_forbidden_art`, `supported_faction`, `abandoned`. Mỗi `uniqueKey` chỉ áp delta một lần. |
| CSX-NPC-004 | Tầng hội thoại lấy từ resolver tổ hợp, không đọc một chỉ số đơn. Ân tình yêu cầu tổ hợp (ví dụ trust ≥ 60 và suspicion < 40). Fear mở ép buộc nhanh nhưng tăng suspicion/nguy cơ phản bội. Tự nguyện làm Neo yêu cầu trust hoặc respect; cưỡng ép Neo bị cấm. |
| CSX-NPC-010 | Truyền thư chỉ tới NPC đã gặp hoặc Neo; phí theo khoảng cách vùng; thư có `dueDay`; gửi được template tin nhắn + một vật phẩm (reserve ngay, hoàn lại nếu NPC chết/mất tích trước khi giao). Hồi âm là task mới, không tức thời. |
| CSX-NPC-011 | Truy nã cá nhân: người chơi treo Linh Thạch lên NPC nổi bật thù địch; thợ săn NPC nhận qua world tick; kết quả là làm suy yếu/định vị/bắt giữ, không tự giết boss/NPC cốt truyện. Persist seed và người nhận để reload không reroll. |
| CSX-NPC-012 | UI: bản đồ hiện avatar NPC nổi bật đã biết vị trí, thông tin cũ có mốc thời gian; Nhân duyên hiện tầng, bốn chỉ số, ký ức gần nhất và action. |
| CSX-NPC-020 | Hộ tống là NPC còn sống tại node xuất phát. Task travel lưu `escortProfile`, áp `riskReduction` vào rủi ro persist của task, trừ `dailyCost` đúng một lần mỗi ngày travel mô phỏng; không trả được phí thì hộ tống chuyển `fled`. |

## Acceptance

- Lịch NPC, va chạm tương tác, ký ức trùng, giao/hoàn thư, truy nã không xóa NPC trọng yếu.
- Gate: `verify_world_producer_matrix.js`, `verify_review_batches.js`, `verify_local_movement_weather.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-NPC-001/002 | expansion.js: `worldSimulation.npcState` | Khớp |
| CSX-NPC-003 | expansion.js:`relationshipEvents` | Khớp |
| CSX-NPC-010 | expansion.js:`mailbox` | Khớp |
| CSX-NPC-011 | expansion.js:`bounty` | Khớp |
| CSX-NPC-020 | — (`escortProfile`, `dailyCost` không có trong runtime) | Thiếu |
