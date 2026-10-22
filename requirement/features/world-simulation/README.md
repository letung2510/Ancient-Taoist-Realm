# Mô phỏng thế giới

## Phạm vi

- Điều phối tick ngày tuyệt đối duy nhất cho online, catch-up và offline: thứ tự producer, tính xác định, idempotency, lịch sử node.
- Thế lực, ngoại giao, chiến tranh; biến cố vùng, Bí Cảnh, tin đồn; công trình/Hộ Giới Đại Trận và world modifier; phiên Thám Hiểm; không khí dị đoan và lan nhiễm.
- Không sở hữu catalog thời tiết ([weather](../weather/README.md)), hành vi NPC ([npc](../npc/README.md)), ngữ nghĩa quan hệ ([relationship](../relationship/README.md)), công thức di chuyển/catalog công trình ([map](../map/README.md)), bố cục log ([ui-action-log](../ui-action-log/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Tick ngày, offline, lịch sử node | [daily-tick-and-offline.md](daily-tick-and-offline.md) | `WSIM-TICK-`, `WSIM-OFF-`, `WSIM-HIS-` | `js/expansion.js:tick`, `simulateWorldUntil`, `simulateWorldAggregate`, `recordActorHistory`, `validateNodeHistory` |
| Thế lực, ngoại giao, chiến tranh | [factions-and-wars.md](factions-and-wars.md) | `WSIM-FAC-`, `WSIM-WAR-` | `js/expansion.js:updateDiplomacy`, `updateWars`, `updateFactionInternalEvents`, `warFrontSnapshot` |
| Biến cố, Bí Cảnh, tin đồn | [events-and-rumors.md](events-and-rumors.md) | `WSIM-EVT-`, `WSIM-HR-`, `WSIM-RUM-` | `js/expansion.js:startWorldEvent`, `advanceEvent`, `updateHiddenRealms`, `propagateNpcRumors`, `factionBulletin` |
| Công trình, Hộ Giới Đại Trận, world modifier | [structures-and-wards.md](structures-and-wards.md) | `WSIM-WRD-`, `WSIM-MOD-` | `js/expansion.js:wardProtectionAtNode`, `getWorldModifiers`, `structureManagerDecision` |
| Phiên Thám Hiểm | [exploration-sessions.md](exploration-sessions.md) | `WSIM-XPL-` | `js/engine.js:search`, `collectSearchFindings`, `investigateSearchFinding`, `investigateWithNpcAssist` |
| Hợp đồng mở rộng, ranh giới UI | [expansion-contracts.md](expansion-contracts.md) | `WSIM-CON-`, `WSIM-UI-` | `js/expansion.js:awakenItem`, `updateTournament`; `js/ui.js:renderPanel` |
| Không khí dị đoan, lan nhiễm | [atmosphere-and-corruption.md](atmosphere-and-corruption.md) | `WSIM-ATM-` | `js/engine.js:worldviewWrongness`, `weaveAtmosphere`, `perceivedValue`, `markForbiddenKnowledge` |

## Phụ thuộc

- [weather](../weather/README.md), [npc](../npc/README.md), [relationship](../relationship/README.md), [companion](../companion/README.md) — producer chạy trong tick.
- [map](../map/README.md) — influence, `travelPlan` (MAP-LC-030), catalog/alias công trình, fog.
- [ui-action-log](../ui-action-log/README.md) — producer phát sự kiện có cấu trúc, câu tường thuật theo hợp đồng scene.
- [technique](../technique/README.md) (TEC-073 tri thức cấm), [di-the](../di-the/README.md), [path](../path/README.md) (Tà Thần, Con Đường), [realm-progression](../realm-progression/README.md) (Đột Phá, thiên kiếp), [reward](../reward/README.md).
- [data-runtime](../data-runtime/README.md) — `validateExpansionState`, save envelope.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | Aggregate offline chốt theo runtime: phần ≤ 365 ngày replay `tick` từng ngày (parity với online), > 365 ngày dùng checkpoint projection; thay mô tả "aggregate batch 3 ngày không chạy actor". | WSIM-OFF-002..003 |
| 2026-10-22 | Tin đồn dùng một chính sách duy nhất theo runtime `RUMOR_POLICY` (TTL 14 ngày, −0.05 cùng node, −0.20 node kề, sàn 0.1, 12 tin/NPC). Bỏ các biến thể 30 ngày / −20 điểm mỗi bước / bỏ qua dưới 20 / 120 ngày. | WSIM-RUM-001..006 |
| 2026-10-22 | Tác động tin đồn lên quan hệ chỉ qua sự kiện quan hệ (REL-SOC-006); nhánh ghi thẳng trong `npcTalk` là Lệch. | WSIM-RUM-007 |
| 2026-10-22 | Công thức Độ Sai Lệch và độ lệch hiển thị khi SAN thấp chốt theo runtime (hệ số 0.35/0.4/35; lệch ±12%). | WSIM-ATM-001, WSIM-ATM-010 |
| 2026-10-22 | Đề xuất không khí dị đoan (Ambient Dread, người kể không đáng tin, tri thức cấm, lan nhiễm, Biến Dị, Khế Ước Thân Xác, Luân Hồi Thất Bại, Tiếng Vọng Đột Phá, Phản Phệ mọi Công Pháp, nội dung Tà Thần/sinh vật) là requirement hiệu lực; thứ tự ưu tiên triển khai cũ bị bỏ, trạng thái theo dõi ở `STATUS.md`. | WSIM-ATM-* |
| 2026-10-22 | Hợp đồng render headless của các tab và ranh giới UI của tab thế giới gộp vào file hợp đồng mở rộng. | WSIM-UI-001..005 |
| 2026-10-22 | Đoạn "trace recovery" và các ghi chú "chưa hoàn thiện"/benchmark là lịch sử, bị loại. | — |

## Gate

- `node tools/verify_offline_parity.js`
- `node tools/verify_long_range_replay.js`
- `node tools/verify_world_producer_matrix.js`
- `node tools/verify_expansion_stress.js --runs=1000 --days=1000`
- `node tools/verify_review_batches.js`
- `node tools/verify_game.js`
