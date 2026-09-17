# MAP INFLUENCE + CÔNG TRÌNH CANONICAL 2026-09-16

## Quyết định đã chốt

1. Influence chính xác chỉ được tính chi tiết cho node nhân vật đã khám phá (`fogState >= 2`, đã ghé hoặc đang đứng tại node).
2. Node chưa khám phá không lộ faction gradient. Node đó chỉ nhận tín hiệu ảnh hưởng từ world event/random event đã được ghi vào `mapState.eventInfluence`.
3. Map dùng tọa độ 100×100 hiện hành; mọi start location phải có tọa độ hợp lệ trước khi tạo state.
4. Truyền Tống Trận có thể đặt tại node sinh ra, node tông môn nhân vật đang tham gia, hoặc phường thị hợp lệ nơi đã xây công trình. Endpoint phải là teleport anchor hợp lệ.
5. Hộ Giới Đại Trận giảm SAN drain tại node, đồng thời giảm encounter/curse pressure theo integrity.
6. Structure có thể chuyển chủ cho NPC bằng một transaction riêng; không xóa structure khi chuyển chủ.

## Additional ownership lifecycle decisions

- Player-owned structures support an explicit dismantle transaction. The record is
  retained with `status: "dismantled"` for history/audit, influence is invalidated
  immediately, and refund is `floor(baseCost[type] * level * 0.4)` Linh Thạch.
- Player outposts support a petition/donate transaction to the faction currently
  served by the player. It changes `ownerType/ownerId`, grants faction power and
  player reputation, and writes a `faction_change` node-history entry.
- Regression must cover owner guards, refund, influence invalidation, idempotent
  second petition rejection, and save round-trip.

## Influence DTO

```js
{
  nodeId, discovered, source,
  factions: [{ factionId, score, tier }],
  influenceMap, ownerFactionId, contested,
  pressure, confidence, revision
}
```

## Invariants

- `mapInfluenceSnapshot`, map UI, travel plan và construction eligibility dùng cùng resolver.
- Unknown node không expose `influenceMap` faction đầy đủ.
- Event influence hết hạn theo day và không biến thành ownership vĩnh viễn nếu chưa có claim/threshold.
- Influence cache invalidates sau faction/war/structure/claim/ownership/weather event.

## Structure schema

```js
{
  id, type, nodeId, ownerType, ownerId,
  builtByCharacterId, builtAt, integrity, level,
  charges, effects, transferHistory, status
}
```

Truyền Tống Trận dùng `type: "waystation"`, Hộ Giới Đại Trận dùng `type: "ward_formation"`. Không dùng tên hiển thị làm ID.

## Cost baseline

- Truyền Tống Trận: 20 Linh Thạch, integrity 100, charge 100.
- Hộ Giới Đại Trận: 15 Linh Thạch, integrity 100, SAN drain reduction 25%, encounter risk -20%, curse risk -25%.
- Mỗi lần repair/upgrade phải dùng resolver cost, không hard-code trong UI.
- `disable` làm công trình mất ảnh hưởng ngay lập tức nhưng không xóa dữ liệu.
  `repair` trên công trình disabled phải trả tối thiểu 1 Linh Thạch để tái kích
  hoạt ngay cả khi integrity vẫn là 100; repair công trình damaged vừa khôi phục
  integrity vừa chuyển status về `active`.
- Regression bắt buộc kiểm tra score active > disabled và score được phục hồi sau
  repair, kèm save round-trip.
