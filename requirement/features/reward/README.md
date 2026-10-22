# Phần thưởng

## Phạm vi

Ranh giới phát thưởng một lần: receipt ledger chống trùng, preview, migration/quarantine, policy duplicate/pity/pending vault, thưởng phe tà, và cơ duyên tranh đoạt. Không gồm: output lặp lại của combat/search/craft/gather (activity resolver), cân bằng giá trị thưởng (tuning catalog), trạng thái content nguồn (quest/contract/discovery thuộc feature tương ứng).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Receipt ledger & policy | [receipt-ledger.md](receipt-ledger.md) | RWD-LED-, RWD-POL-, RWD-TNT-, RWD-PRS- | expansion.js:`grantCanonicalReward`, `previewCanonicalReward`, `rewardPolicySnapshot`; engine.js:`grantTaintedRewardCanonical` |
| Cơ duyên tranh đoạt | [contested-opportunity.md](contested-opportunity.md) | RWD-OPP- | expansion.js:`createContestedOpportunity`, `resolveContestedOpportunity`, `validateContestedOpportunity` |

## Phụ thuộc

- [discovery](../discovery/README.md): `rewardDiscovery` sau khi ledger commit; Bí cảnh.
- [fate](../fate/README.md): `receiveFate` + hàng chờ khi kho đầy.
- [technique](../technique/README.md): Công Pháp thưởng ghi acquisition receipt (TEC-070).
- [relationship](../relationship/README.md): event `shared_opportunity`.
- [npc](../npc/README.md), [world-simulation](../world-simulation/README.md): quest/contract/war/tournament là nguồn thưởng.
- [data-runtime](../data-runtime/README.md): save/migration.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-09-16 | Mọi reward một lần qua `grantCanonicalReward`; status content và receipt là hai lớp độc lập. | RWD-LED-001, 002 |
| 2026-09-17 | Policy `canonical_once_v1`: duplicate reject, không pity ẩn, Fate kho đầy vào hàng chờ, output lặp lại thuộc activity resolver. | RWD-POL-001..004 |
| 2026-09-17 | Thưởng phe tà là namespace `taintedRewards` riêng nhưng dùng chung ledger. | RWD-TNT-001 |
| 2026-10-22 | Receipt legacy hỏng được quarantine (giữ `legacyPayload`), không loại khỏi ledger (thay câu “bị loại khỏi ledger” của 2026-09-17, theo runtime). | RWD-LED-006 |
| 2026-10-22 | Cân bằng reward theo rival/faction và giá trị thưởng phe tà là tuning catalog; UI xem lịch sử 30 cơ duyên không phải requirement hiện hành. | — |

## Gate

`node tools/verify_review_batches.js`, `node tools/verify_expansion_stress.js`, `node tools/verify_save_envelope.js`, `node tools/verify_long_range_replay.js`.
