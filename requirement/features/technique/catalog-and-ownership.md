# Công Pháp — Danh mục & quyền sở hữu

## Mục đích

Định nghĩa catalog Công Pháp (schema, namespace nguồn, category hành vi), cách học/ghi nhận sở hữu (acquisition receipt), interaction catalog, migration và validator. Eligibility/cost ở [eligibility-and-cost.md](eligibility-and-cost.md); Tông Môn/Tự Lập ở [guild-and-tu-lap.md](guild-and-tu-lap.md).

## Dữ liệu & trạng thái

```text
catalog technique (data/cong_phap.js + guild signature sinh từ GUILD_DATA)
  ├─ access resolver ─────► learned / dormant / blocked   (GameExpansion.techniqueEligibility)
  ├─ fate resonance ──────► power / cost / risk modifier  (GameEngine.techniqueFateResonance)
  ├─ action resolver ─────► target, stance, prepare/channel, cooldown
  └─ commit transaction ──► cost, effect, mastery, receipt, narrative (GameEngine.useTechnique)
Thứ tự ưu tiên tầng dữ liệu: Mệnh Số → Công Pháp → Kỹ năng/action
```

- Catalog: `CONG_PHAP_DATA.techniques`, `CONG_PHAP_DATA.interactionCatalog` (`priority: [fate, technique, skill]`), guild signature sinh trong `techniqueCatalog()`.
- Progress: `state.player.techniques[id]`; receipt học: `state.flags.techniqueAcquisitionReceipts`.

## Rules

### Nguyên tắc nền

| ID | Rule |
|---|---|
| TEC-001 | `id` là định danh duy nhất, ổn định sau khi phát hành save. Tên hiển thị, alias, tên cũ/dịch không dùng để resolve hay kiểm tra quyền. |
| TEC-002 | Catalog chỉ đọc. Accessor trả bản sao; modifier là snapshot của action, không ghi ngược vào catalog Công Pháp, dữ liệu Mệnh hay `CONG_PHAP_DATA`. |
| TEC-008 | Không xóa Công Pháp đã học khi rời Tông Môn, mất nghề, đổi Con Đường/Ý Định/cảnh giới. Chỉ chuyển `dormant`/`blocked` kèm blocker; giữ mastery, receipt, trial, evolution; hoạt động lại khi đủ điều kiện. |
| TEC-012 | Response resolver được clone; không trả tham chiếu nested tới save hay catalog. |
| TEC-013 | API & sở hữu: Engine sở hữu cost/effect resolver và transaction (`techniquePreview`, `useTechnique`, `prepareTechnique`, `advanceTechniqueChannel`, `cancelTechniquePreparation`, `techniqueFateResonance`, `resolveTechniqueCosts`); Expansion sở hữu eligibility, policy catalog, event producer, membership hook (`techniqueEligibility`, `guildTechniqueSnapshot`, `guildTechniqueCombatBonus`, `acquireTechnique`, `buildTechniqueContext`, `resolveTechnique` (thuần), `commitTechniqueResolution`, `transitionGuildMembership`, `validateTechniqueCrossSystemCatalog`, `validateTechniqueCrossSystemState`). `buildTechniqueContext` trả context chỉ đọc: `characterId`, `actionId`, `phase` (preview/learn/cast/cultivate/duel), `realmLevel`, `pathId`, `pathTags`, `equippedFateIds`, `guild { guildId, rankId, rankIndex, member, status, revision }`, `techniqueProgress { masteryExp, masteryStage, evolutionId }`, `world { regionId, weatherId, eventIds }`; field thiếu ở save cũ = trung tính (null, [], 0). Resolution có `snapshotKey` = technique + character revision + membership revision + equipped Fate IDs + turn. |

### TEC-020 — `source.kind` (namespace quyền sở hữu)

Một record có một `source.kind` chính, có thể nhiều `acquisition`; không suy ra từ tên.

| `source.kind` | Ý nghĩa | Điều kiện chính | Rời nguồn | Tương tác Mệnh |
|---|---|---|---|---|
| `universal` | Công Pháp nền/phổ thông | realm, tài nguyên, discovery | giữ | cộng hưởng nguyên tố cơ bản |
| `independent` | Tự Lập/Tán Tu | discovery, mentor, recipe, trial | giữ | không có guild bonus |
| `path` | Con Đường | `pathId`, stage, affinity | giữ; eligibility tính lại khi đổi nhánh | path resonance; lệch đường không cộng |
| `hidden_path` | Con Đường Ẩn từ Cổ Tịch | hidden path unlocked, clue chain | giữ; có thể dormant | cần Mệnh/insight phù hợp nếu khai báo |
| `profession` | Nghề chính hoặc Nghề Ẩn (`sourceType: hidden_profession` quy về kind này) | profession id, stage | giữ, trừ policy riêng | Mệnh chỉ modifier |
| `guild` | Được Tông Môn truyền dạy | membership, rank, standing, taught receipt | giữ ownership; chỉ bonus/teaching bị thu hồi | guild bonus chỉ khi membership active |
| `guild_signature` | Bí pháp đặc trưng | đúng guild, rank, membership active | ownership giữ, quyền dùng `blocked` | Mệnh không bypass membership |
| `tainted_god` | Tà Thần/Cấm Thuật | knowledge, corruption, omen, faction | giữ; không học lại bình thường | bắt buộc price/backfire policy |
| `discovery` | Mở qua khám phá thế giới | map event, hidden realm, đấu giá, NPC hiếm | giữ | theo element/tag |
| `legacy` | Record save cũ không rõ nguồn | — | giữ | theo element/tag |

Field legacy `sourceType` chấp nhận thêm `fate` (Công Pháp/biến thể do Mệnh cấp).

| ID | Rule |
|---|---|
| TEC-021 | Ghi mới chỉ dùng `source.kind`; đọc tương thích `sourceType`, `sourceGuildId`. Record không rõ nguồn → `universal`, không tự gán `guild`. Suy luận legacy: có `sourceGuildId` → `guild`; category `cam_thuat` → `tainted_god`; có `pathAffinity` → `path`. |
| TEC-022 | `source.kind`/`sourceType` không tự quyết quyền học. Quyền = `accessPolicy` + acquisition + phase + context. |
| TEC-023 | `behavior.category` ∈ `chieu_thuc`, `cam_thuat`, `than_phap`, `phu_tro`, `tran_phap`, `tam_phap`. `guild_signature` là namespace nguồn, KHÔNG phải category; record `guild_signature` vẫn có category hành vi hợp lệ (TEC-122). `source.kind` và category độc lập (vd. `path` có thể là `cam_thuat`). |
| TEC-024 | `tam_phap` là passive: không có nút Dùng/Prepare/commit, chỉ hiển thị trạng thái; có thể là modifier chỉ-đọc cho preparation/cooldown, không sửa catalog. |
| TEC-025 | Category: `chieu_thuc` tấn công trực tiếp, cần target/encounter; `cam_thuat` cấm thuật có giá riêng; `than_phap` né/di chuyển/thế, không tự trở thành movement action; `phu_tro` hồi phục/thanh tẩy/bảo hộ/tăng chỉ số; `tran_phap` triển khai vùng/ward có thời hạn và phạm vi vị trí. |

### TEC-030 — Tách namespace Nghề / Con Đường / Tông Môn

| Field | Ý nghĩa | Không được thay bằng |
|---|---|---|
| `professionId` | Nghề chính (`luyen_dan`, `tuong_su`…) | `pathId` |
| `pathId` | Con Đường (`kiem_dao`, `phu_dao`…) | `professionId`, `guildId` |
| `guildId` | Tổ chức hiện tại | “đang ở Tông Môn” |
| `hiddenProfessionId` (`professionState.hiddenId`) | Nghề Ẩn | `hiddenPathId` |
| `hiddenPathId` (`pathState.hiddenPathId`) | Con Đường Ẩn | `hiddenProfessionId` |

`professionAffinity` ≠ `pathAffinity` ≠ `requiredGuildId`; mapping giữa chúng phải khai báo trong catalog. Nghề Ẩn và Con Đường Ẩn là hai điều kiện độc lập, không dùng chung resolver/formatter. So sánh rank/nghề/Con Đường bằng ID/canonical index, không bằng tên.

### TEC-031 — Ma trận phối hợp namespace

| Tổ hợp | Kết quả |
|---|---|
| Nghề + Công Pháp nghề | Nghề cấp access; Mệnh chỉ modifier |
| Con Đường + Công Pháp path | Path cấp access và resonance |
| Con Đường Ẩn + Công Pháp hidden path | Clue/unlock cấp access; không tạo Nghề Ẩn |
| Tông Môn + guild skill | Membership/rank cấp access; guild bonus chỉ khi active |
| Tự Lập + independent | Được học/dùng; không nhận guild signature |
| Tự Lập + path | Được dùng nếu tự khám phá và đúng path |
| Mệnh + bất kỳ | Chỉ resonance/requirement/consequence, không thay ownership |

### TEC-040 — DTO canonical sau `techniqueCatalog()`

Schema v2 mở rộng record cũ; field cũ (`visibleStats`, `pathAffinity`, `requiredFaction`, `minRealmLevel`, `isCore`, `mastery`, `sourceGuildId`) vẫn được đọc.

| Nhóm | Field |
|---|---|
| Định danh | `id`, `schemaVersion`, `name`/`nameKey`, `aliases`, `grade`, `quality`, `element`, `family`, `category` |
| Nguồn | `sourceType` (legacy), `source: { kind, sourceId, acquisitionIds, retention }`, `acquisition[]` |
| Hành vi | `behavior: { category, family, target: { mode, required, max }, timing: instant/channel, tags }`, `role` (`core_cultivation`/`active`/`path_core`) |
| Quyền | `minRealmLevel`, `pathAffinity`, `professionAffinity`, `accessPolicy`, `learnRequirements`/`useRequirements`/`trainingRequirements`/`requirements`, `requiredFaction` (alias) |
| Giá | `cost: { mana, stamina, san, corruption, lifespan, items, cooldownTurns, castTimeSeconds }`; `prepareCost: { mana, stamina }` hoặc `cost.prepare` |
| Chuẩn bị | `preparation: { enabled, turns, interruptible, refundPolicy }` |
| Hiệu ứng | `effect: { powerCoefficient, baseEffect, allStatMultiplier, cultivationMultiplier? }`; `scaling: { stat, coefficient, mastery, fateResonance, pathResonance, guildBonus }` |
| Rủi ro | `risk: { corruptionProfile, hiddenAttributes }`; `forbiddenArt` (Cấm Thuật) |
| Tiến trình | `isCore`, `mastery: { stage, exp, usageCount }`, `progression: { masteryCap, breakthroughRole, fusionEligible, evolutionIds }`, `evolutionPaths` |
| Tương tác | `interaction` (từ `interactionCatalog.techniqueRules`), `skillBlueprint`, `guildSkillPolicy` |
| UI | `ui: { categoryLabel, sourceLabel, showAcquisitionHints, actionLabelKey, showInActionBar, showCost, showCooldown, confirmation: none/tainted }` |

| ID | Rule |
|---|---|
| TEC-041 | Field bắt buộc của record `schemaVersion: 2`: `id`, `schemaVersion`, `name`, `category`, `family`, `sourceType`/`source`, `minRealmLevel`, `isCore`, `role`, `accessPolicy`, `acquisition`, `progression`, `cost`, `effect`, `risk`. |
| TEC-042 | `accessPolicy` luôn có default tường minh: `allowedJourneyIntents: []`, `allowedPathIds: []`, `requiredGuildId: null`, `forbiddenGuildMembership: false`, `requiredProfessionIds: []`, `requiredHiddenIds: []`, `requiredCodexProgress: 0`, `requiredFlags: []`, `requiredFateIds: []`, `requiredFateTags: []`. Mảng rỗng = không giới hạn; không dùng `undefined`. |
| TEC-043 | Mapping legacy → contract: `sourceType`/`sourceGuildId` → `source.kind`/`source.sourceId`; `professions` → `accessPolicy.requiredProfessionIds`; `intent` → `accessPolicy.allowedJourneyIntents` (không dùng `journeyIntent` làm source namespace); `visibleStats.cooldownSeconds` → `cost.cooldownTurns` (TEC-096); `visibleStats.*Cost` → `cost.*`. |
| TEC-044 | Requirement theo scope (`learnRequirements`/`useRequirements`/`trainingRequirements`, fallback `requirements`), tất cả optional: `minRealmLevel`, `maxRealmLevel`, `pathIds`, `pathTagsAny`, `pathTagsAll`, `fateIdsAny`, `fateElementsAny`, `fateScope` (`equipped` mặc định / `owned`), `minActiveFates`, `guildIds`, `guildRankMin`, `taintedFactionIds`, `forbiddenKnowledge`, `requireAtTrainingHall`, `allowLegacyUse`. Không khai báo = không giới hạn. |
| TEC-045 | `requiredFaction` cũ là alias của `taintedFactionIds` (phe tà); không bao giờ map sang guild membership. |
| TEC-046 | Guild restriction chỉ ràng buộc dùng liên tục khi khai báo trong `useRequirements` (hoặc `source.kind = guild_signature`); mặc định kỹ năng đã học không tự khóa. |

### Acquisition, progress và receipt học

| ID | Rule |
|---|---|
| TEC-070 | Mọi cách học (opening, mentor, discovery, path trial, guild teaching, Fate, reward) tạo receipt ổn định `technique-learn:<techniqueId>:<acquisitionId>` gồm `receiptId`, `techniqueId`, `acquisitionId`, `source: { kind, sourceId, acquisitionId }`, `sourceType`, `turn`, `worldDay`, `journeyIntent`, `pathId`, `guildId`, `legacyAcquired`; lưu ở `state.flags.techniqueAcquisitionReceipts`. |
| TEC-071 | `acquireTechnique(state, id, acquisitionId)`: receipt đã có → `{ success: true, duplicate: true }`, không cấp lại; eligibility `learn` chạy trước; cost (vd. merit) trừ sau khi hợp lệ và hoàn lại nếu `learnTechnique` thất bại. |
| TEC-072 | Progress `state.player.techniques[id]`: `masteryStage`, `masteryExp`, `usageCount`, `learnedAtTurn`, `sourceType`, `sourceGuildId`, `acquisitionReceiptId`, `sourceContext: { intentId, pathId, guildId, acquisitionId }`, `combatState`, `evolution`. Mastery cũ (`stage`/`exp`) chuẩn hóa sang `masteryStage`/`masteryExp`, không reset. |
| TEC-073 | Học Công Pháp có `isForbiddenKnowledge` đánh dấu `flags.forbiddenKnowledge` (+count) một lần mỗi lần học. |
| TEC-074 | Mở khóa bằng Mệnh (`requiredFateIds`/`requiredFateTags`) chỉ qua discovery/acquisition receipt; preview không tự thêm vào known techniques. |

### Interaction catalog và tiêu chí content

| ID | Rule |
|---|---|
| TEC-140 | `fateProfiles`: `kim` {kiem, kim, sat_phat}; `moc` {sinh_truong, hoi_phuc, mong}; `hoa` {boc_phat, dot_pha, dan}; `tho` {phong_ngu, tran, luyen_the}; `vo_he` {can_bang, tinh, menh}; `di_he` {ta_than, cam_thuat, phan_phuc}. Fate thật chấm bằng element/tag/path affinity/sign, không theo tên. |
| TEC-141 | `techniqueRules` (skill blueprint): `kiem_khi_so_cap` single_target_strike/damage; `hon_hoa_chuong` burning_arc/damage+burn; `thanh_phong_kiem_quyet` wind_sword/damage+reposition; `than_phap_phi_van` evasion_step/evasion; `bich_moc_hoi_xuan` life_recovery/heal; `huyen_mon_tran_giai` counter_formation/ward+counter; `huyet_sat_bi_luc` blood_curse/damage+corruption; `cam_thuat_huyet_te` blood_ritual/damage+backlash; `tu_lap_kiem_thuc` independent_sword/damage+mastery; `tu_lap_luyen_the_phap` independent_body/guard+recovery. Record khác fallback từ element/pathAffinity/category/family. |
| TEC-142 | Blueprint chỉ mô tả action/target/effect family/stance; damage, cost, cooldown, target validity, guild buff do resolver tính. Content mới phải có interaction rule trước khi có UI action riêng. |
| TEC-143 | Content mới chỉ “hoàn tất” khi có: (1) record + interaction rule; (2) source namespace + access policy; (3) preferred Fate tags hoặc `no_resonance`; (4) skill blueprint + target policy; (5) preview hiển thị nguồn Mệnh/modifier; (6) commit dùng đúng cost/risk đã preview; (7) phản phệ có seed/receipt; (8) save/load giữ mastery, cooldown, receipt, resonance tái tạo được; (9) test positive/opposed/suppressed/replay. Cân bằng chỉ chỉnh trong catalog. |

### Migration và validator

| ID | Rule |
|---|---|
| TEC-170 | Migration catalog: record thiếu version → `schemaVersion: 1`; chuẩn hóa `visibleStats` vào `cost`/`effect`/`risk`, giữ field cũ; suy ra `source` theo TEC-021. |
| TEC-171 | Migration save: giữ mastery/cooldown; thêm `sourceType` (legacy nếu không rõ), receipt `technique-learn:legacy:<id>` với `legacyAcquired: true`, `combatState` mặc định; chỉ cấp tâm pháp Tự Lập theo TEC-063. Migration chỉ tạo field rỗng/default, không reward, không tăng mastery/trial. Unknown technique: quarantine, không tự cấp lại. |
| TEC-172 | Field optional/default không tăng save version; ledger/semantics cross-system ghi `featureVersions.techniqueCrossSystem = 1`. |
| TEC-173 | Catalog validator (`validateTechniqueCatalog`, `validateTechniqueCrossSystemCatalog`): ID duy nhất, khớp key; name/category/family; schemaVersion; enum `sourceType`/`source.kind`/category; cost/cooldown hữu hạn, không âm; effect/mastery range; `pathAffinity`/path/profession/guild/Fate/rank tham chiếu tồn tại; acquisition ID duy nhất; core/progression không mâu thuẫn; `guild` có policy guild; `independent` có acquisition ngoài guild; `guild_signature` có sourceId + policy và category hành vi; `cam_thuat` có forbiddenArt + tainted; `tam_phap` không có action commit; target/timing tương thích; evolution/fusion không vòng lặp; `interactionCatalog.resonance` có `capPct` hữu hạn, > 0, ≤ 18 và `maxSources` ≥ 1, không tồn tại `CONG_PHAP_DATA.resonancePolicy`; guild policy có id/rankMin/modifiers/caps; không raw function name trong label. Unknown requirement key: dev/regression fail, production fallback neutral. |
| TEC-174 | State validator (`validateTechniqueRuntimeState`, `validateTechniqueCrossSystemState`): technique tồn tại; mastery range; evolution status/progress ≤ target; `eventKeys` unique ≤ 64; ready đạt target; chosen có evolution hợp lệ; membership status/rank hợp lệ; trial event retention bounded; snapshot không stale. |

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-06 | Path đúng/sai, đổi nhánh | access + path resonance đúng; ownership giữ | `verify_progression_requirement_matrix.js` |
| RG-07 | Nghề chính/Nghề Ẩn/Con Đường Ẩn | chỉ namespace tương ứng có hiệu lực | `verify_progression_requirement_matrix.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-001, 021, 022, 040, 042, 043 | engine.js:`techniqueCatalog` | Khớp | normalize cost/effect/risk/source/behavior/accessPolicy |
| TEC-002 | engine.js:`techniqueCatalog` | Lệch | trả thẳng object cache `TECHNIQUE_CATALOG_CACHE`, caller có thể mutate; chỉ `buildTechniqueContext` copy |
| TEC-013 | expansion.js:`buildTechniqueContext`, `resolveTechnique` | Lệch | context trả `{ technique, progress, preview, guild, membership }` thay vì DTO context; `resolveTechnique` chỉ là alias; chưa có `snapshotKey` |
| TEC-020 | engine.js:`validateTechniqueCatalog` (`sourceKinds`) | Khớp | |
| TEC-023 | engine.js:`techniqueCatalog` (guild signature base), `useTechnique` (`supportedCategories`) | Lệch | bản gốc `guild_signature_<id>` có `category: "guild_signature"`; theo TEC-122 phải là `phu_tro` |
| TEC-030 | expansion.js:`techniqueEligibility` (`requiredHiddenIds`) | Lệch | gộp Nghề Ẩn và Con Đường Ẩn vào một danh sách `currentHiddenIds` |
| TEC-041, 173 | engine.js:`validateTechniqueCatalog`; expansion.js:`validateTechniqueCrossSystemCatalog` | Thiếu | chưa kiểm field bắt buộc v2, acquisition ID unique, evolution cycle, profession/guild/Fate ref, `tam_phap` không commit, category guild signature |
| TEC-044, 045, 046, 055, 056 | expansion.js:`techniqueEligibility` | Khớp | |
| TEC-070, 071, 072 | expansion.js:`acquireTechnique`; engine.js:`learnTechnique` | Khớp | |
| TEC-140…142 | data/cong_phap.js:`interactionCatalog` | Khớp | |
| TEC-171, 172 | expansion.js:`ensure` (migration techniques, `featureVersions.techniqueCrossSystem`) | Khớp | |
| TEC-174 | expansion.js:`validateTechniqueRuntimeState`, `validateTechniqueCrossSystemState` | Khớp | |
