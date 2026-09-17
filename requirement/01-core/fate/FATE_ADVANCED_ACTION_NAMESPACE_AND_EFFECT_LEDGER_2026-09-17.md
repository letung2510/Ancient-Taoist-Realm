# Fate Advanced Actions — Namespace và Effect Ledger — 2026-09-17

## Canonical namespace

Mọi action nâng cao của Mệnh Số dùng `player.fateAdvancedActions`:

- theo instance Mệnh: `nghichMenh`, `tranMenh`, `menhDoi`;
- action toàn cục: `_global.thienCo`.

Mỗi record có `uses` và `effectSource: "advanced_fate_action"`; các field
riêng như `untilTurn`, `cooldownUntil`, `branchId` chỉ là metadata của action.

## Effect isolation

`fateAdvancedEffectBreakdown()` là resolver duy nhất cho effect Nghịch Mệnh.
Enhancement, relationship, evolution và advanced action không được đọc chéo
hoặc cộng lại cùng một record. Trấn Mệnh chỉ suppress Fate trong thời hạn;
Thiên Cơ chỉ lưu cooldown/omen; Mệnh Đổi ghi branch transition, còn effect
branch do Fate evolution resolver sở hữu.

## Save

Canonical serialization lưu `fate.advancedActions`; deserialization khôi phục
về `player.fateAdvancedActions`. Regression kiểm tra action namespace,
suppression/effect breakdown và save round-trip.
