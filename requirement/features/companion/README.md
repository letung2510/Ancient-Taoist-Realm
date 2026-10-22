# Đồng hành

## Phạm vi

- Dị Thú đồng hành (`state.companion`): state machine chiến đấu, sát thương, hồi phục, cứu sinh, Dị Biến, save/offline.
- Loyalty của đồng hành là ledger riêng, không ghi đè loyalty quan hệ NPC ([relationship](../relationship/README.md)).
- Không sở hữu luật bắt giữ quái (xem [world-simulation/expansion-contracts.md](../world-simulation/expansion-contracts.md)) hay phần thưởng phóng sinh (xem [reward](../reward/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| State, sát thương, hồi phục, cứu sinh, Dị Biến | [companion-runtime.md](companion-runtime.md) | `CMP-STA-`, `CMP-CBT-`, `CMP-REC-`, `CMP-MUT-`, `CMP-SAV-` | `js/expansion.js:normalizeCompanion`, `recordCompanionDamage`, `recoverCompanion`, `reviveCompanion`, `resolveCompanionMutation`, `validateCompanionState` |

## Phụ thuộc

- [di-the](../di-the/README.md) — Dị Biến/Tà Nhiễm của nhân vật khi chấp nhận mutation.
- [world-simulation/daily-tick-and-offline.md](../world-simulation/daily-tick-and-offline.md) — tick ngày tự hồi phục, tăng corruption theo node, combat offline.
- [reward](../reward/README.md) — reward ledger khi phóng sinh.
- [data-runtime](../data-runtime/README.md) — `validateExpansionState` gọi validator companion.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-05 | Cứu sinh tại node an toàn tốn 3 Linh Thạch, hồi 25% HP. Mức cũ 12 Linh Thạch/35%/`soul_scar` bị thay thế. | CMP-REC-003 |
| 2026-10-22 | Chi phí thanh tẩy Dị Biến chốt theo runtime: 10 Linh Thạch, corruption đồng hành về 15, loyalty +10. | CMP-MUT-003 |

## Gate

- `node tools/verify_companion_runtime.js`
- `node tools/verify_review_batches.js`
