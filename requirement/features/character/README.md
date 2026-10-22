# Nhân Vật (Character)

## Phạm vi

Tạo nhân vật mới (input, quy trình roll, invariant, RNG replay), thuộc tính gốc và chỉ số suy ra (Linh Căn, Căn Cốt, Ngộ Tính), xuất thân và Ý Định hành đạo, Neo Nhân Tính của nhân vật, shape lưu nhân vật canonical, và panel Nhân Vật/Trạng Thái/clock.
Không sở hữu: luật Mệnh Số (`../fate/`), cảnh giới/nghi thức đột phá (`../realm-progression/`), Con Đường (`../path/`), quan hệ NPC/quà tặng (`../relationship/`), origin node trên bản đồ (`../map/`), Dị Thể (`../di-the/`).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Khởi tạo nhân vật | [creation.md](creation.md) | `CHR-CRE-` | `js/engine.js:rollCharacterCreation`, `createCharacter`, `drawInitialFates`; `character_generator.js:generateCharacter` |
| Thuộc tính và chỉ số suy ra | [attributes-and-derived.md](attributes-and-derived.md) | `CHR-ATT-` | `js/engine.js:gaussianAttribute`, `rollSpiritualRootBranch`, `spiritualRootProfile` |
| Xuất thân và Ý Định hành đạo | [origin-intent.md](origin-intent.md) | `CHR-ORI-` | `js/engine.js:startRegionEligibility`, `journeyIntentOptions`, `rollJourneyOpening` |
| Neo Nhân Tính | [human-anchor.md](human-anchor.md) | `CHR-ANC-` | `js/engine.js:anchorCandidates`, `establishHumanAnchor`; `js/expansion.js:nurtureHumanAnchor` |
| Shape lưu nhân vật | [save-shape.md](save-shape.md) | `CHR-SAVE-` | `js/engine.js:toCanonicalCharacter`, `fromCanonicalCharacter` |
| Panel Nhân Vật, Trạng Thái, clock | [panel-and-clock-ui.md](panel-and-clock-ui.md) | `CHR-UI-` | `js/ui.js:renderStatus`; `js/engine.js:clockLabel`, `worldClockLabel` |
| Nền tảng nhân vật (lớp dữ liệu, luồng tạo, SAN/Corruption, Neo, thứ tự lượt, journey intent) | [foundation.md](foundation.md) | `CHR-CD-` | `js/engine.js:createCharacter`, `rollCharacterCreation` |

## Phụ thuộc

- [../fate/README.md](../fate/README.md) — 5 Mệnh khởi tạo, Mệnh ẩn, dung lượng Mệnh Kho.
- [../realm-progression/README.md](../realm-progression/README.md) — Di Mệnh Cảnh cấp 1, cổng Neo trong nghi thức đột phá.
- [../path/README.md](../path/README.md) — chọn Con Đường độc lập với tổ chức.
- [../map/README.md](../map/README.md) — vùng, origin node, `START_LOCATIONS`.
- [../relationship/README.md](../relationship/README.md) — điểm quan hệ NPC, sự kiện quan hệ, quà tặng.
- [../npc/README.md](../npc/README.md) — phân lớp NPC (`persistent_named`, `bondable_encounter`, `transactional_ephemeral`).
- [../profession/README.md](../profession/README.md) — kích hoạt nghề ẩn Luân Hồi Tiên.
- [../technique/README.md](../technique/README.md) — Công Pháp nhập môn.
- [../world-simulation/README.md](../world-simulation/README.md) — world clock.
- [../di-the/README.md](../di-the/README.md) — trạng thái Dị Thể hiển thị ở tab Nhân Vật.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-09-17 | Character generator dùng RNG truyền vào; `defaultRandom` là boundary entropy duy nhất. | CHR-CRE-005 |
| 2026-09-17 | Dị Thể là tab riêng `dithe` trong nhóm Nhân Vật; Công Trình là tab riêng `structures` trong nhóm Thế Giới. | CHR-UI-001, CHR-UI-002 |
| 2026-10-22 | Generator đọc `data/fate_data.js`; tham chiếu `fate-pool.json` bị hủy. | CHR-CRE-003 |
| 2026-10-22 | Neo Nhân Tính dùng ngưỡng ứng viên và công thức ổn định của runtime; bảng ổn định ban đầu theo loại Neo (45/50/40/55/35) và roll phản hồi NPC bị hủy. | CHR-ANC-002, CHR-ANC-003 |
| 2026-10-22 | Ổn định Neo tăng qua sự kiện quan hệ và qua Nuôi Dưỡng Neo trả Linh Thạch (`ceil(amount/5)`); không giới hạn "chỉ qua quest". | CHR-ANC-005 |
| 2026-10-22 | Neo tự sinh "Neo nơi sinh thành" bị bỏ; Neo cũ không có `npcId` được giữ với `source: "legacy_anchor"` nhưng không qua cổng Neo Nhân Tính. | CHR-ANC-001, CHR-ANC-007 |
| 2026-10-22 | Bộ 5 Mệnh khởi tạo: tổng điểm ≥ 6 (tức > 5 với điểm nguyên), thử tối đa 500 lần rồi fallback tất định (không RNG) 5 Mệnh điểm cao nhất trong cap, hòa thì `id` tăng dần; cả hai generator dùng cùng thuật toán; hết 500 lần không phải lỗi. | CHR-CRE-003 |
| 2026-10-22 | Override `spiritualRoots` giữ `spiritualRootBranch` đầu vào (không có thì `null`, suy ra theo CHR-ATT-003), không gọi `rng` cho Linh Căn, nhánh phải khớp số nguyên tố. | CHR-CRE-006 |
| 2026-10-22 | Neo: `maxStability = 100`; trạng thái theo ổn định `<50` strained, `50–74` active, `≥75` stable; không có "Neo chủ đạo" — cổng cảnh giới thỏa khi một Neo bất kỳ đạt ngưỡng; tối đa 3 Neo hoạt động. | CHR-ANC-003, CHR-ANC-005, CHR-ANC-007 |
| 2026-10-22 | "Neo hợp lệ" có một predicate duy nhất `isValidHumanAnchor` (`source: "npc_relationship"`, chưa vỡ, `stability > 0`) dùng cho bước Dựng Neo, mọi cổng cảnh giới và giới hạn 3 Neo; `legacy_anchor` không được đếm ở cổng nào. Load save nâng `maxStability` về 100 và đổi `source: "npc"` cũ thành `npc_relationship`. | CHR-ANC-007, CHR-ANC-009, PRG-BT-006 |
| 2026-10-22 | Hợp đồng UI tab Dị Thể/Công Trình, nút action Trạng thái và hai clock do feature Nhân Vật sở hữu; luật nghiệp vụ Dị Thể/công trình/world sim thuộc feature tương ứng. | CHR-UI-* |

## Gate

```text
node --check js/engine.js
node tools/verify_character_generator_replay.js
node tools/verify_random_boundaries.js
node tools/verify_game.js
```
