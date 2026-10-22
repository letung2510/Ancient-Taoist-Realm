# Cross-system

## Phạm vi

Hợp đồng liên feature: nền chung của hệ mở rộng (RNG thế giới, modifier, transaction, product policy), nhân mô phỏng và sự kiện thế giới, thế lực/chiến tranh/công trình, tông môn (membership, Đại Hội, quan hệ tổ chức), NPC nổi bật, tiến hóa Công Pháp/Mệnh, khế ước/tình báo, vật phẩm/đấu giá/đồng hành, khám phá/Bí Cảnh, Thiên Kiếp/Luân Hồi và sự kiện ngẫu nhiên trên bản đồ. Luật nội bộ của từng feature nằm ở feature đó; file ở đây chỉ chứa phần nối nhiều feature. Không chứa giao diện chung ([ui-action-log](../ui-action-log/README.md)) hay save/clock ([data-runtime](../data-runtime/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Nền tảng chung, product policy | [foundation.md](foundation.md) | `CSX-FND-` | expansion.js:`getWorldModifiers`, `worldRandom`, `productPolicySnapshot`, `validateProductPolicies` |
| Nhân mô phỏng, sự kiện thế giới, mùa/thời tiết | [world-kernel-and-events.md](world-kernel-and-events.md) | `CSX-WK-`, `CSX-WE-` | expansion.js:`simulateWorldUntil`, `simulateWorldAggregate`, `actorHistorySnapshot` |
| Thế lực, chiến tranh, dự án tông môn, công trình | [faction-war-and-structures.md](faction-war-and-structures.md) | `CSX-FAC-`, `CSX-PRJ-`, `CSX-STR-` | expansion.js:`structureManagerDecision`, `STRUCTURE_CATALOG`, `guildProject` |
| Tông Môn Đại Hội | [guild-tournament.md](guild-tournament.md) | `CSX-TRN-` | expansion.js: `worldSimulation.tournament` |
| Membership tông môn × Công Pháp | [guild-membership.md](guild-membership.md) | `CSX-TG-` | expansion.js:`transitionGuildMembership`, `guildVaultSnapshot` |
| Tương tác tổ chức | [organization-interaction.md](organization-interaction.md) | `CSX-ORG-` | expansion.js:`organizationInteract`, `organizationSnapshot` |
| NPC nổi bật, ký ức, thư, truy nã, hộ tống | [npc-memory-mail-bounty.md](npc-memory-mail-bounty.md) | `CSX-NPC-` | expansion.js:`relationshipEvents`, `mailbox`, `bounty` |
| Tiến hóa Công Pháp, khung Nghề | [technique-and-profession-evolution.md](technique-and-profession-evolution.md) | `CSX-EVO-`, `CSX-PRF-` | engine.js:`updateTechniqueMastery`, `registerGeneratedItem`; expansion.js:`placedFormations` |
| Khế ước, bắt sống, thẩm vấn, tình báo | [contract-capture-intel.md](contract-capture-intel.md) | `CSX-INT-` | expansion.js:`contractBoard`, `prisoners`, `coverIdentity` |
| Vật phẩm thức tỉnh, đấu giá, Dị Thú | [item-legacy-auction-companion.md](item-legacy-auction-companion.md) | `CSX-ITM-`, `CSX-CMP-` | expansion.js:`heirloom`, auction, `companion` |
| Khám phá, cơ duyên tranh chấp, Bí Cảnh | [discovery-and-hidden-realm.md](discovery-and-hidden-realm.md) | `CSX-DSC-`, `CSX-OPP-`, `CSX-HR-` | expansion.js:`discoveries`, `hiddenRealms` |
| Thiên Kiếp, di sản Luân Hồi | [tribulation-and-reincarnation.md](tribulation-and-reincarnation.md) | `CSX-TRB-`, `CSX-LGC-` | expansion.js:`pendingTribulation`, `reincarnationLegacy` |
| Tiến hóa Mệnh Số | [fate-evolution.md](fate-evolution.md) | `CSX-FEV-` | expansion.js:`evolveFate`, `fateEvolutionPreview` |
| Sự kiện ngẫu nhiên bản đồ | [map-random-events.md](map-random-events.md) | `CSX-RE-` | engine.js:`maybeTriggerRandomEncounter`, `rollMapEvent` |

## Phụ thuộc

[fate](../fate/README.md) · [technique](../technique/README.md) · [profession](../profession/README.md) · [path](../path/README.md) · [realm-progression](../realm-progression/README.md) · [map](../map/README.md) · [weather](../weather/README.md) · [world-simulation](../world-simulation/README.md) · [npc](../npc/README.md) · [relationship](../relationship/README.md) · [companion](../companion/README.md) · [discovery](../discovery/README.md) · [reward](../reward/README.md) · [data-runtime](../data-runtime/README.md) · [ui-action-log](../ui-action-log/README.md)

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | Hệ thống tương tác tổ chức (nguồn archive mất dấu tiếng Việt) được viết lại theo nghĩa gốc và lấy runtime `organizationInteract` làm chuẩn: phải có mặt tại node tổ chức; giới hạn 1 tương tác/ngày miễn cho `request_aid` và mọi `commission*`; ba tầng ủy thác thường/đặc biệt/sinh tử. Chuyển từ file UI sang đây. | CSX-ORG-* |
| 2026-10-22 | Đại Hội dùng bracket 4 vòng (đăng ký tới ngày 3, đóng ngày 10, can thiệp aggressive/read/conserve, chỉ vô địch nhận thưởng) — thay mục SYS-02 cũ "30 ngày, 3 vòng PvE, nhánh quan sát/gian lận". | CSX-TRN-* |
| 2026-10-22 | `membership.revision` phải tăng bên trong `transitionGuildMembership` (không để caller tự tăng). | CSX-TG-02 |
| 2026-10-22 | Cooldown sự kiện bản đồ tính theo lượt game (NPC 5, Quái 3, Cơ Duyên 30, Động Phủ 10) như runtime; bỏ cooldown theo phút thực. Bỏ chiếm Động Phủ bởi "player khác" (single-player). | CSX-RE-006, CSX-RE-032 |
| 2026-10-22 | Tàn Quyển Rơi Rớt là lựa chọn Nghiên cứu như runtime; bỏ câu hỏi mở "bao nhiêu mảnh ghép Công Pháp". | CSX-RE-021 |
| 2026-10-22 | Tick thế giới chạy trong `simulateWorldUntil`; không bắt buộc API `simulateWorldTick` riêng. Preview tiến hóa Công Pháp dùng `techniquePreview` (không cần `resolveTechniqueModifiers`). | CSX-WK-002, CSX-EVO-002 |
| 2026-10-22 | Gỡ thứ tự phase triển khai (Phase 0–5), danh sách "việc cần làm tiếp" và trạng thái triển khai — là lịch sử, không phải rule. | — |
| 2026-10-22 | Hợp đồng thời tiết (CSX-WE-006), tháp canh/trạm giao thương (CSX-STR-004/005), hộ tống (CSX-NPC-020) và catalog công trình (CSX-STR-001) chuyển về đây từ file data-runtime/UI cũ. | CSX-WE-006, CSX-STR-*, CSX-NPC-020 |
| 2026-09-17 | Product policy mục 29–33: Mệnh `decayPolicy: "none"`, NPC `event_only`, Con Đường 2 slot `explicit_once`, Dị Thể theo catalog, NPC offline `aggregate_then_actor_window`. | CSX-FND-030…034 |

## Gate

```powershell
node tools/verify_game.js
node tools/verify_review_batches.js
node tools/verify_world_producer_matrix.js
node tools/verify_map_producer_matrix.js
node tools/verify_companion_runtime.js
node tools/verify_dichi_deep.js
node tools/verify_33_item_coverage.js
node tools/verify_canonical_contracts.js
node tools/verify_offline_parity.js
node tools/run_regression_suite.js
```
