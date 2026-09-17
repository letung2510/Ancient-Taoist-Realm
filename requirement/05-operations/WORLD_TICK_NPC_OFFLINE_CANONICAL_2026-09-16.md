# World Tick / NPC / Offline Canonical — 2026-09-16

## Mục tiêu

World tick phải deterministic theo `worldSimulation.seed + scope + day + index`, chạy lại cùng ngày không nhân đôi kết quả, không cho NPC nhảy qua edge không tồn tại và không biến offline catch-up thành log rác.

## Canonical world tick

Thứ tự mỗi ngày:

1. Hết hạn quest/event và chuyển phase event.
2. Resolver weather canonical cập nhật `weather`, `weatherSeverity`, `weatherIntensity`, `weatherUntilDay`, `weatherHistory`.
3. Trade route, map influence/faction change và daily world effect.
4. Diplomacy/war; khi war kết thúc chỉ cascade một lần qua `cascadeApplied`.
5. NPC scheduler, encounter và rumor propagation.
6. Hidden realm, scheduled tasks, contract/auction/tournament.
7. Companion/contested opportunity và producer log.

Mỗi producer phải có unique key theo ngày hoặc task ID. Không producer nào được dùng `Math.random()` cho kết quả cần replay.

## NPC state machine

`npc.aiState` chỉ nhận các trạng thái: `idle`, `present`, `travel`, `shelter`, `combat`, `interact`. NPC chỉ được chuyển tới node nằm trong `D.LOCATIONS[currentNodeId].exits`; route cũ không được hiểu là danh sách teleport.

Các trường runtime:

```js
{
  npcId, currentNodeId, currentSubLocationId, homeNodeId,
  aiState, travelFrom, travelTo, nextMoveDay,
  needs: { shelter, social, duty },
  rumors: [], rumorLedger: {}, memoryWithPlayer: [], processedKeys: {}
}
```

NPC tĩnh giữ `present`; NPC patrol/wander chọn một edge hợp lệ bằng seeded resolver. Nếu không có edge thì vào `shelter` và thử lại ngày sau.

## Witness / rumor

Rumor có `key`, `day`, `expiresDay`, `confidence`, `priority`, `sourceNpcId`. Cùng key chỉ ghi nhận bản có confidence/priority cao hơn. Rumor truyền trong cùng node với suy giảm nhỏ và sang node kề với suy giảm lớn hơn; không truyền vô hạn qua toàn bản đồ trong một tick.

## War cascade

War kết thúc khi một bên đạt ngưỡng score và cách biệt. `outcome` lưu winner/loser/resolvedDay; `cascadeApplied` bảo đảm idempotent. Cascade cập nhật stability/resources, event influence tạm thời và node history; chạy lại tick không cộng lại.

## Offline

Offline aggregate có thể bỏ qua actor-level detail nhưng phải cập nhật `lastProcessedDay`. `resolveOfflineNpcEncounters` dedupe theo encounter key và giữ tối đa 100 kết quả gần nhất. Rehydrate không được phát thưởng hai lần.

## Acceptance

- Chạy `simulateWorldUntil` tới cùng target lần hai trả `processed: 0`.
- NPC không xuất hiện tại node không có edge từ node trước.
- Rumor cùng key không phình vô hạn sau offline replay.
- War cascade chỉ áp dụng một lần sau deserialize/replay.
- Weather, NPC reaction, travel và log đọc cùng weather resolver.
