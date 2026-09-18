# Patch — Phát hiện ẩn trên bản đồ

## Contract

- Một node chỉ có tối đa một `pendingMapEvent` tại một thời điểm.
- Event pending gắn chặt với `nodeId`; không được xử lý từ node khác.
- Event đã phát hiện ghi vào `mapEvents.nodes[nodeId]`, có cooldown và `resolvedIds` chống lặp.
- Rời node khi event còn pending chuyển event sang `abandoned`, ghi history và cooldown; không trao thưởng.
- Chọn event hợp lệ chuyển sang `resolved`, ghi choice/history và xóa pending.
- Trigger first-discovery/explore/moving dùng replay random; không tạo event ngoài catalog.
- Log player-facing dùng novel style, có địa điểm và diễn biến, không lộ tên hàm hoặc action ID.

## Đã triển khai

- Chặn resolve khi người chơi không còn đứng tại node phát hiện.
- Bổ sung `validateMapEventState` và đưa validator vào `validateExpansionState`.
- Chuẩn hóa log phát hiện, giải quyết và bỏ lại phát hiện thành các đoạn văn novel-style.
- Regression kiểm tra pending state, wrong-node guard, resolve, validator và log output.

## Gate

```text
node --check js/engine.js
node --check js/expansion.js
node tools/verify_game.js
node tools/verify_log_narrative.js
```
