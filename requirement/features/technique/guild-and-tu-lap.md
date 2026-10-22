# Công Pháp — Tông Môn & Tự Lập

## Mục đích

Quyền và bonus Công Pháp gắn với Tông Môn (truyền dạy, bí pháp, policy, formation support) và lộ trình Tự Lập (không gia nhập Tông Môn). Vòng đời membership Tông Môn thuộc [cross-system](../cross-system/README.md); Ý Định khởi đầu thuộc [character](../character/README.md).

## Dữ liệu & trạng thái

- `state.guildMembership` (`guildId`, rank, status, `suspended`), `journeyIntent`.
- Catalog: `CONG_PHAP_DATA.interactionCatalog.guildSkillPolicies`, `guildTechniquePolicies` (data/expansion_data.js), `GUILD_DATA`.
- `flags.activeFormation` (`sourceGuildId`, hạn), `flags.guildTeaching`.

## Rules

### Tự Lập

| ID | Rule |
|---|---|
| TEC-060 | `Tự Lập` (`journeyIntent: tu_lap`) là lộ trình đầy đủ, nghĩa là không gia nhập Tông Môn để nhận đạo thống/nghĩa vụ thành viên. Không cấm Công Pháp có chữ “Tông”, không cấm học từ NPC, không cấm dùng Công Pháp tìm được bên ngoài. Không có resolver riêng cho Tự Lập. |
| TEC-061 | Tự Lập ĐƯỢC: học `universal`, `independent`, `discovery`, `path`, `profession`, `hidden_profession`, `hidden_path`; nhận từ NPC tán tu, thương nhân, di tích, đấu giá, Cổ Tịch; phát triển Con Đường; tự fusion/evolve khi đủ điều kiện. |
| TEC-062 | Tự Lập KHÔNG: `joinGuild()` thành công; nhận `guildTechniqueIds()` như phần thưởng thành viên; nhận guild rank/mastery bonus/formation support; học record `guild`/`guild_signature` yêu cầu membership hiện tại. |
| TEC-063 | Khi chốt Tự Lập (opening plan), cấp `tu_lap_tam_phap` đúng một lần qua acquisition (`acquisition.id = independent_opening`, receipt `technique-learn:tu_lap_tam_phap:independent_opening`). Save có `journeyIntent === "tu_lap"` và chưa có core technique được cấp bù một lần khi migrate. |
| TEC-064 | Save cũ: không xóa Công Pháp/mastery; thêm `legacyAcquired: true` nếu thiếu receipt; chặn nhận mới sau migration; Công Pháp cũ không còn dùng được sau khi rời Tông Môn trả blocker rõ ràng thay vì xóa state. |
| TEC-065 | Lộ trình: (1) **Dẫn khí** — nhận tâm pháp nền; (2) **Tự tìm pháp** — sau Khai Lộ mở mentor tán tu, bản chép map event, đổi merit, đấu giá, discovery reward, thử thách Con Đường; (3) **Chọn nhánh** — `pathId` mở nhóm ưu tiên, không tự cấp cả catalog; (4) **Tự hợp pháp** — fusion/evolution (TEC-115). Mỗi acquisition có cost, điều kiện, thất bại và preview không mutation. |
| TEC-066 | `isCore` chỉ đánh dấu Công Pháp có thể làm nền/thuộc build lõi: không tự cấp access, không bỏ qua cooldown/cost/path score/Fate/anchor/ritual/realm, không biến passive thành active. Breakthrough resolver kiểm tra core hợp lệ, mastery nếu cần, path/Fate/anchor/ritual và không phụ thuộc guild membership với nhân vật Tự Lập. |

### TEC-067 — Bộ Công Pháp nền Tự Lập (ID ổn định, tên có thể đổi)

| ID | Vai trò | Nguồn | Mốc mở |
|---|---|---|---|
| `tu_lap_tam_phap` | Tâm Pháp nền | opening grant | xác lập Tự Lập |
| `tan_tu_dan_khi_quyet` | Tâm Pháp nâng cao | mentor/đổi 3 merit | Khai Lộ + insight |
| `tu_lap_kiem_thuc` | Nhánh Kiếm Chủ | thử thách Con Đường | `kiem_dao` + lead tag |
| `tu_lap_luyen_the_phap` | Nhánh Luyện Thể | NPC/di tích/path trial | `luyen_the_dao` + body score |
| `bach_giai_tap_luc` | Đa dụng | khám phá/đấu giá | Dựng Thai |
| `tu_lap_tran_giai` | Nhánh Phong Thủy/Thiên Cơ | Cổ Tịch/map discovery | `phong_thuy_dao` hoặc `phu_dao` |
| `co_tich_tu_lap_bien` | Nhánh Con Đường Ẩn | đủ Cổ Tịch | hidden path unlock |
| `tu_lap_dao_thong_phoi` | Hợp nhất | fusion/evolution | Hợp Đạo hoặc tương đương |

### Tông Môn

| ID | Rule |
|---|---|
| TEC-120 | `guild` (truyền dạy): ownership giữ sau khi rời môn; vẫn dùng được với uy lực gốc nhưng mất mọi guild bonus (mastery/power/formation), không chịu penalty; quyền dùng chỉ khóa nếu khai báo (TEC-046). `guild_signature` (bí pháp): yêu cầu đúng guild + rank + membership active; rời/suspended/expelled → `blocked` (trừ policy `retainedKnowledge`). Ownership/mastery/receipt luôn giữ. |
| TEC-121 | Mỗi guild technique có `guildSkillPolicy` (access, retention, mastery bonus, departed). Catalog: `signature = { access: membership_and_rank, retention: membership, masteryBonusWhenActivePct: 5, formationBonusRequiresRank: 2, departed: blocked }`; `taught = { access: taught_receipt, retention: knowledge, masteryBonusWhenActivePct: 5, departed: dormant }`. |
| TEC-122 | Mỗi tổ chức có bí pháp sinh ổn định từ guild id; category theo effect thực (gây damage → `chieu_thuc`, ngược lại → `phu_tro`): `guild_signature_<guildId>` gốc (cộng hưởng tông môn qua `allStatMultiplier`, không damage) → `phu_tro`; `_support` (hỗ trợ tu luyện/hồi phục) → `phu_tro`; `_secret` (tuyệt kỹ đặc hữu, đòn đánh) → `chieu_thuc`. Save cũ giữ nguyên ID. |
| TEC-123 | `guildTechniquePolicies` (catalog, versioned): `{ id, guildId ('*' = mọi guild), revision, rankMin, appliesTo?, elements?, modifiers, caps }`. Không cài rule trong UI, không ghi đè technique khi join. Validator báo policy trỏ ID/rank/category không tồn tại. Không cấp combat power toàn cục chỉ vì là thành viên. |
| TEC-124 | `guildTechniqueSnapshot(state, technique)`: hợp lệ khi có guildId, status `active`, không suspended; rank so qua canonical rank index; trả `{ valid, guildId, rankId, revision, masteryGainPct, sourceIds }`, mastery bonus ≤ cap của policy. Không cache qua lượt. |
| TEC-125 | Mỗi policy bắt buộc có `appliesTo` ∈ {`guild_taught`, `formation_support`}; validator báo lỗi policy thiếu hoặc sai `appliesTo` (không còn nghĩa "áp cho mọi Công Pháp"). `guild_taught` = Công Pháp có `taughtGuildId === membership.guildId`, với `taughtGuildId = technique.sourceGuildId \|\| progress.sourceGuildId \|\| progress.sourceContext.guildId` (gồm cả bí pháp `guild_signature` của chính môn đó); thiếu `taughtGuildId` (Công Pháp universal/path/độc lập/legacy) → không bonus. Policy: `guild_manual_training` (rank ≥ 0, `appliesTo: guild_taught`: +5% mastery, cap 10); `guild_inner_training` (rank ≥ 1, **`appliesTo: "guild_taught"`**: +5% mastery); hai policy cùng áp thì cộng dồn 5 + 5 = 10, kẹp bằng cap lớn nhất trong các policy đang áp (10). Rank 0: chỉ `manual` (5%); rank ≥ 1: 10%. `guild_elemental_array_support` (`appliesTo: formation_support`, TEC-126). Thay đổi chỉ ở data (`revision` của `guild_inner_training` tăng 1 → 2); không cần migration save vì bonus tính lại mỗi lần (TEC-124). |
| TEC-126 | Formation support: +5% power (cap 5) chỉ khi trận pháp `tran_phap` do Tông Môn hiện tại truyền dạy đang được triển khai (`flags.activeFormation`, chưa hết hạn), member active rank ≥ 2 (đệ tử chính thức trở lên), element Công Pháp ∈ {kim, mộc, thủy, hỏa, thổ}. `sourceGuildId` của trận được chụp lúc triển khai từ catalog hoặc progress (Công Pháp học qua teaching); save cũ không có field → không bonus. Suspension/expiry/khác guild/trận không hợp lệ → mất bonus. |
| TEC-127 | Teaching: NPC và membership cùng guildId, NPC có quyền dạy, Công Pháp có trong vault snapshot, rank đủ, cost trả được — kiểm tra hết trước khi ghi bất kỳ cờ/state nào; quyền dạy không tự học skill. Học qua teaching ghi receipt (TEC-070) với `sourceGuildId`. |
| TEC-128 | Guild bonus áp dụng một lần trong `guildTechniqueSnapshot`/`guildTechniqueCombatBonus`. Kỹ năng môn phái sinh từ `skillBlueprint` luôn đi qua `techniquePreview → useTechnique`, không có action handler riêng. |

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-08 | Tự Lập: grant một lần, chặn join, chặn guild skill/bonus, học universal/path/discovery, core Tự Lập tham gia đột phá đúng điều kiện, acquisition deterministic | đúng TEC-061..066 | `verify_opening_intent.js` |
| RG-09 | Guild signature active/departed/suspended; rank đổi; rời/rejoin; guild skill đã học sau khi rời | active dùng được, signature bị chặn khi không active; skill truyền dạy dùng được nhưng không bonus; snapshot đổi tức thì; không grant lặp; skill/mastery giữ | `verify_review_batches.js` |
| RG-09a | Member rank 1 của guild G; Công Pháp học qua teaching của G (`sourceGuildId G`) vs Công Pháp universal vs Công Pháp truyền dạy bởi guild H | `masteryGainPct` = 10 / 0 / 0; rank 0 với Công Pháp của G → 5; policy thiếu `appliesTo` → validator báo lỗi | `verify_review_batches.js` |
| RG-10 | Formation support bonus/suspension | +5% chỉ khi đủ TEC-126 | `verify_review_batches.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-057, 063 | engine.js: opening plan (`intentId === "tu_lap"`) → `learnTechnique` | Lệch | cấp một lần đúng nhưng không ghi vào `flags.techniqueAcquisitionReceipts` (chỉ được tạo bù khi migrate, kèm `legacyAcquired`) |
| TEC-062 | engine.js:`joinGuild` (chặn `tu_lap`) | Khớp | |
| TEC-067 | data/cong_phap.js:`techniques` | Thiếu | thiếu `bach_giai_tap_luc`, `tu_lap_tran_giai`, `co_tich_tu_lap_bien`, `tu_lap_dao_thong_phoi` |
| TEC-120, 121, 122 | expansion.js:`techniqueEligibility` (`GUILD_DEPARTED`); data/cong_phap.js:`guildSkillPolicies`; engine.js:`techniqueCatalog` | Khớp | ID/biến thể đúng; category của bản gốc xem dòng TEC-023 ở [catalog-and-ownership.md](catalog-and-ownership.md) |
| TEC-124 | expansion.js:`guildTechniqueSnapshot` | Khớp | |
| TEC-125 | data/expansion_data.js:`guildTechniquePolicies` (`guild_inner_training` thiếu `appliesTo`, `revision` 1); expansion.js:`guildTechniqueSnapshot` (đã lọc `guild_taught`); validator catalog (chưa kiểm `appliesTo`) | Lệch | thêm `appliesTo: "guild_taught"` + `revision: 2` vào data; thêm kiểm validator |
| TEC-126 | engine.js:`useTechnique` (`progress.sourceGuildId ?? technique.sourceGuildId`); expansion.js:`guildTechniqueCombatBonus` | Khớp | (2026-10-22) |
| TEC-127 | expansion.js:`act_exp_org_study:` → `learnTechnique({ sourceType: "guild", guildId })` | Lệch | hết rò cờ (2026-10-22); còn thiếu acquisition receipt `technique-learn:<id>:guild:<guildId>` |
