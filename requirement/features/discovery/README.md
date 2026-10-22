# Khám phá

## Phạm vi

Lớp tri thức/phát hiện (Dị Chí): trạng thái phát hiện bốn bước, read model, hiển thị; vòng đời Bí cảnh gắn với world tick; cách nhiệm vụ được khám phá. Không gồm: phát thưởng (→ [reward](../reward/README.md)), Con Đường/Nghề Ẩn/Dị Thể (chỉ đọc discovery làm điều kiện), Cổ Tịch/manh mối nghề ẩn (→ [profession](../profession/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Vòng đời Dị Chí | [lifecycle.md](lifecycle.md) | DSC-ST-, DSC-UI- | expansion.js:`discover`, `transitionDiscovery`, `discoveryStatusSummary` |
| Bí cảnh & khám phá nhiệm vụ | [hidden-realm-and-quest.md](hidden-realm-and-quest.md) | DSC-HR-, DSC-QST- | expansion.js:`hiddenRealmEnter`, `claimHiddenRealmCore`, `exitHiddenRealm` |

## Phụ thuộc

- [reward](../reward/README.md): ledger phát thưởng (RWD-LED-*).
- [world-simulation](../world-simulation/README.md): world tick/offline catch-up.
- [npc](../npc/README.md): nhiệm vụ NPC, hội thoại.
- [path](../path/README.md), [profession](../profession/README.md), [di-the](../di-the/README.md): đọc discovery làm điều kiện.
- [technique](../technique/README.md): acquisition `discovery`.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-09-16 | Bốn trạng thái đơn điệu; reward đi qua `rewardDiscovery` + ledger có unique key riêng. | DSC-ST-002..004 |
| 2026-09-17 | Hết hạn Bí cảnh xử lý bởi cùng world tick với offline catch-up. | DSC-HR-001 |
| 2026-10-22 | Cân bằng reward/content từng Bí cảnh và từng category discovery là tuning catalog, không phải requirement logic. | — |

## Gate

`node tools/verify_review_batches.js`, `node tools/verify_dichi_deep.js`, `node tools/verify_offline_parity.js`.
