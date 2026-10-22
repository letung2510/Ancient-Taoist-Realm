# Công Pháp

## Phạm vi

Catalog Công Pháp và quyền sở hữu/học/dùng, eligibility và chi phí, thi triển Instant/Prepare/Channel/Commit, cộng hưởng Mệnh Số phía Công Pháp, Công Pháp Tông Môn và lộ trình Tự Lập, Cấm Thuật, mastery/evolution/fusion, UI Công Pháp và contract recipe chế tác. Không gồm: logic phía Mệnh (Trấn Mệnh, affinity của Fate), vòng đời membership Tông Môn, Con Đường, Nghề.

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Danh mục & quyền sở hữu | [catalog-and-ownership.md](catalog-and-ownership.md) | TEC-001..002, 008, 012..013, 020..046, 070..074, 140..143, 170..174 | engine.js:`techniqueCatalog`, `validateTechniqueCatalog`; expansion.js:`acquireTechnique`, `buildTechniqueContext` |
| Eligibility & chi phí | [eligibility-and-cost.md](eligibility-and-cost.md) | TEC-011, 050..059, 090..096, TEC-ELG- | expansion.js:`techniqueEligibility`; engine.js:`resolveTechniqueCosts`, `techniqueCombatProjection` |
| Thi triển | [execution.md](execution.md) | TEC-003..007, 009, 100..107, 109..114, 10A, TEC-CH- | engine.js:`techniquePreview`, `useTechnique`, `prepareTechnique`, `advanceTechniqueChannel`, `cancelTechniquePreparation` |
| Cộng hưởng Mệnh | [fate-resonance.md](fate-resonance.md) | TEC-080..089, 08A, 08B | engine.js:`techniqueFateResonance` |
| Tông Môn & Tự Lập | [guild-and-tu-lap.md](guild-and-tu-lap.md) | TEC-060..067, 120..128 | expansion.js:`guildTechniqueSnapshot`, `guildTechniqueCombatBonus`; engine.js:`joinGuild` |
| Cấm Thuật | [cam-thuat.md](cam-thuat.md) | TEC-108, 130..132 | engine.js:`useTechnique`; main.js:`commitTechniqueAction` |
| Mastery & evolution | [mastery-and-evolution.md](mastery-and-evolution.md) | TEC-115..119, 11A | engine.js:`updateTechniqueMastery`; expansion.js:`advanceTechniqueTrials`, `chooseTechniqueEvolution` |
| UI | [ui.md](ui.md) | TEC-010, 10B, 160..162 | ui.js: thẻ Công Pháp; main.js:`commitTechniqueAction` |
| Recipe chế tác | [recipe.md](recipe.md) | TEC-150..154 | expansion.js:`recipeDefinition`, `recipeCanCommit`, `commitRecipeCosts` |
| Backlog (không active) | [backlog.md](backlog.md) | BL-01..13 | — |
| Công Pháp nền theo Con Đường | [path-technique-core.md](path-technique-core.md) | `TEC-CD-` | `data/cong_phap.js`, `js/engine.js:techniqueProgress` |

## Phụ thuộc

- [fate](../fate/README.md): element/tag/path affinity của Fate, Trấn Mệnh, `techniqueResonance` phía Mệnh.
- [path](../path/README.md): `pathId`, Con Đường Ẩn, phe tà.
- [profession](../profession/README.md): Nghề/Nghề Ẩn, mastery nghề.
- [character](../character/README.md): Ý Định khởi đầu (Tự Lập), opening grant.
- [cross-system](../cross-system/README.md): vòng đời membership Tông Môn, khung SYS-04 evolution, hợp đồng `CSX-TG-*`.
- [reward](../reward/README.md): ledger thưởng; [discovery](../discovery/README.md): acquisition qua khám phá.
- [ui-action-log](../ui-action-log/README.md), [data-runtime](../data-runtime/README.md): action surface, save/migration.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-09-16 | Recipe/Công Pháp dùng `id`; preview recipe không mutation; thưởng qua `grantCanonicalReward`. | TEC-150..154 |
| 2026-09-22 | Stance chọn mỗi lần cast trên transaction cooldown hiện có (thay đề xuất prepare/channel substate riêng cho mọi kỹ năng → BL-13); `guarded` giảm SAN/Tà Nhiễm, không giảm incoming damage. | TEC-094 |
| 2026-09-22 | Ledger 64 action ID + high-water; migration rỗng, không cấp bù. Guild restriction chỉ ongoing khi khai báo `useRequirements`. Formation support +5% cho rank ≥ 2. | TEC-111, 046, 126 |
| 2026-10 | `cam_thuat` là category, `tainted_god` là source. Cooldown runtime `readyAtTurn`, `cooldownSeconds` chỉ là input legacy. Guild departed khóa quyền dùng bí pháp nhưng giữ ownership/mastery/receipt. Tự Lập không có quyền guild. Mệnh không thay source namespace. Prepare/Channel/Tụ lực là phase, không phải skill/reward mới. Mọi tên qua formatter. Fusion tạo ID persistent ổn định. | TEC-023, 095, 120, 062, 088, 100, 010, 115 |
| 2026-10-13 | Resonance dùng `interactionCatalog.resonance`, cap **18%** (thay +1%/Fate cap 5% của 2026-09-22); Fate ID trùng tính một lần; suppressed không cộng. | TEC-080..082 |
| 2026-10-13 | Huyền Môn Trận Giải là Công Pháp đầu tiên có preparation (1 lượt, 4 Linh Khí + 1 Thể Lực, gián đoạn được, không hoàn). Instant không có Prepare giả. `technique_prepare` chưa xác nhận là preview. | TEC-102, 103, 107 |
| 2026-10-22 | `phu_tro` nhận resonance qua cùng power pipeline (thay rule 2026-09-22 “support/passive không nhận”). Bộ blocker code canonical = bộ runtime; code V2 là alias/backlog. Cấm Thuật cancel channel không hoàn cost đã trả. Skill nghề dùng được ngoài node, chịu blocker/penalty theo access policy. | TEC-089, 058, 105, TEC-ELG-001 |
| 2026-10-22 | Q1: Channel hoàn tất theo lượt game (`turn − preparedTurn >= channelTurns`, `channelTurns = max(1, preparation.turns)`); bỏ cơ chế nút `+25%`; Vận công = action chờ 1 lượt; gián đoạn tự động chỉ khi `endCombat`/đổi node (nếu `interruptible`), nhận sát thương không hủy. | TEC-CH-001, 104, 107, 161 |
| 2026-10-22 | Q2: Danger sheet inline bắt buộc mỗi lần cast Cấm Thuật; không browser `confirm()` ở mọi phase Công Pháp (thay “xác nhận một lần”). | TEC-108 |
| 2026-10-22 | Q3: Xóa `CONG_PHAP_DATA.resonancePolicy` (cap 5), không fallback; validator kiểm `interactionCatalog.resonance` (`capPct` hữu hạn, 0 < cap ≤ 18; `maxSources` nguyên 1…5; các `…Pct` hữu hạn, `opposingElementPct ≤ 0`); policy hỏng → resolver trung tính, không default trong code. | TEC-082, 173 |
| 2026-10-22 | Q4: Category bí pháp Tông Môn theo effect thực: gây damage → `chieu_thuc`, khác → `phu_tro`. Runtime: bản gốc `guild_signature_<id>` chỉ có `allStatMultiplier` “Cộng hưởng tông môn” → `phu_tro`; `_support` → `phu_tro`; `_secret` → `chieu_thuc`. | TEC-122, 023 |
| 2026-10-22 | Q5: `guild_inner_training` chỉ áp cho Công Pháp do đúng môn đó truyền dạy (`appliesTo: guild_taught`); mọi policy bắt buộc có `appliesTo` hợp lệ; data tăng `revision` 2. | TEC-125 |
| 2026-10-22 | Q6: Rời Tông Môn: Công Pháp truyền dạy vẫn dùng được, mất guild bonus, không penalty uy lực. | TEC-120 |
| 2026-10-22 | Làm rõ: teaching kiểm toàn bộ điều kiện trước khi ghi cờ/state; `sourceGuildId` của trận lấy từ catalog hoặc progress (Công Pháp học qua teaching). | TEC-126, 127 |
| 2026-10-22 | Công Pháp nhận qua reward ledger cũng ghi acquisition receipt; quy tắc ledger chung chỉ nằm ở RWD-LED-001, TEC-154 giữ phần narrative/stat. | TEC-070, 154 |

## Gate

- `node tools/verify_review_batches.js`, `verify_technique_channel_matrix.js`, `verify_progression_requirement_matrix.js`, `verify_opening_intent.js`, `verify_ui_surface_contract.js`, `verify_action_dispatch_matrix.js`, `verify_random_boundaries.js`, `verify_offline_parity.js`, `verify_save_envelope.js`, `verify_dichi_deep.js`.
- E2E (`verify_long_range_replay.js`): tạo nhân vật → học từ Tông Môn → mastery → trial → evolution → equip/unequip Fate → cast 3 thế → đổi rank/rời môn → đổi path/realm → save/load/Luân Hồi preview; không mất mastery, không giữ guild bonus khi hết tư cách, không cộng trùng Fate/evolution.
