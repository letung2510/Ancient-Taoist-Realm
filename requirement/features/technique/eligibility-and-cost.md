# Công Pháp — Eligibility & chi phí

## Mục đích

Evaluator duy nhất cho quyền học/dùng/luyện (blocker, thứ tự, dormant) và resolver duy nhất cho cost, power, stance, cooldown. Cộng hưởng Mệnh ở [fate-resonance.md](fate-resonance.md); guild bonus ở [guild-and-tu-lap.md](guild-and-tu-lap.md).

## Dữ liệu & trạng thái

- Input: catalog record ([catalog-and-ownership.md](catalog-and-ownership.md) TEC-040..046), `state.player.techniques[id]`, membership, `player.fates`, `pathId`, `professionState`.
- Output eligibility: `{ ok, blockers, scope, techniqueId, state: ready/dormant/blocked, access: { sourceKind, learned, realm, path, profession, guild, intent, fate } }`.
- Cooldown: `player.techniqueCooldowns[id] = { readyAtTurn }`.

## Rules

### Eligibility

| ID | Rule |
|---|---|
| TEC-050 | `GameExpansion.techniqueEligibility(state, techniqueId, scope, options)`, `scope ∈ learn/use/training`, là evaluator duy nhất cho mọi scope, cùng blocker shape và catalog ID; trả DTO ở mục Dữ liệu. |
| TEC-051 | Blocker DTO: `{ code, scope/phase, techniqueId/sourceId, message/playerText, messageKey, params, severity: error/warning/info, source, recoverable, details? }`. API giữ `code` kỹ thuật; UI chỉ dùng `playerText`/`messageKey`, không tự đoán từ catalog. |
| TEC-052 | Thứ tự blocker: (1) catalog/ID → (2) đã học + receipt → (3) cảnh giới → (4) Ý Định → (5) Con Đường/Con Đường Ẩn → (6) Nghề/Nghề Ẩn → (7) Tông Môn, rank, departed/suspended → (8) Mệnh bắt buộc → (9) Cổ Tịch/faction/vị trí → (10) target/context → (11) cooldown/preparation → (12) tài nguyên → (13) replay/idempotency. |
| TEC-053 | Learn: xác minh nguồn (grant/loot/teacher/acquisition), realm, path/Fate/guild/faction, forbidden knowledge; ghi progress đúng một lần. Use: learned, realm, ràng buộc ongoing trong `useRequirements`, target, cooldown, cost. Training: action đã commit, `trainingRequirements`, action id chưa dùng; tự tu vẫn có base progress. |
| TEC-054 | Đã học nhưng không đạt gate use (realm/path/Fate/guild/rank/faction) → thêm `TECHNIQUE_DORMANT`; không xóa record/mastery. |
| TEC-055 | Fate trong requirement đếm theo ID duy nhất, đang kích hoạt, có trong catalog, không bị Trấn Mệnh; riêng `fateScope: owned` cho `fateIdsAny` gồm cả kho. |
| TEC-056 | Membership `suspended`/`expelled`/`left`/`departed`/`inactive` không thỏa bất kỳ guild requirement nào. |
| TEC-057 | Grant khởi tạo nhân vật (`originGrant`/opening) dùng cùng validator ở chế độ khởi tạo, ghi provenance; không mở lỗ hổng cho learn API thường. |
| TEC-ELG-001 | Skill nghề dùng được ngoài node/địa điểm nghề; chỉ bị chặn hoặc chịu penalty khi `accessPolicy`/`useRequirements` khai báo (vd. `requireAtTrainingHall`). |

### TEC-058 — Bộ blocker code canonical

| Code | Khi nào |
|---|---|
| `UNKNOWN_TECHNIQUE` | ID không có trong catalog |
| `NOT_LEARNED` | use/training khi chưa học |
| `REALM_TOO_LOW` / `REALM_TOO_HIGH` | ngoài khoảng cảnh giới |
| `JOURNEY_INTENT_BLOCKED` | Ý Định không thuộc `allowedJourneyIntents` |
| `PATH_MISMATCH` | sai `pathId`/thiếu path tag |
| `PROFESSION_REQUIRED` | thiếu Nghề yêu cầu |
| `DISCOVERY_REQUIRED` | chưa mở Nghề Ẩn/Con Đường Ẩn yêu cầu |
| `CODEX_REQUIRED` | thiếu tiến độ Cổ Tịch |
| `GUILD_REQUIRED` | sai/không có Tông Môn, membership không active, không ở sơn môn khi `requireAtTrainingHall` |
| `GUILD_RANK_REQUIRED` | rank thấp |
| `GUILD_DEPARTED` | bí pháp `guild_signature` khi không còn membership active đúng guild |
| `GUILD_FORBIDDEN` | `forbiddenGuildMembership` mà đang có membership |
| `FATE_REQUIRED` | thiếu Mệnh/nguyên tố/số Mệnh active |
| `FACTION_REQUIRED` | sai phe tà hoặc thiếu dấu ấn tri thức cấm |
| `TECHNIQUE_DORMANT` | kèm theo khi đã học nhưng gate use thất bại |
| `COOLDOWN` | `turn < readyAtTurn` |
| `RESOURCE_SHORTAGE` | thiếu Linh Khí/Thể Lực/Thanh Tỉnh/Thọ Nguyên (message nêu thiếu bao nhiêu) |

Alias chỉ đọc khi migrate test: `INTENT_FORBIDS_GUILD` → `JOURNEY_INTENT_BLOCKED`; `GUILD_MEMBERSHIP_REQUIRED`/`GUILD_SUSPENDED` → `GUILD_REQUIRED`; `GUILD_RANK_TOO_LOW` → `GUILD_RANK_REQUIRED`; `RESOURCE_MANA/STAMINA/SAN/ITEM` → `RESOURCE_SHORTAGE`.

### TEC-059 — Tính lại khi state đổi

| Sự kiện | Tính lại | Giữ nguyên | Hiệu lực |
|---|---|---|---|
| Equip/unequip Fate | resonance + Fate requirement | technique progress | cast kế tiếp |
| Đổi path | use eligibility + affinity | ownership/mastery | dormant/blocker nếu lệch |
| Đổi realm | min/max realm | mọi progress | mở/khóa tạm |
| Join/rank/leave/suspend môn | guild snapshot + guild requirement | ownership/mastery | access/bonus tức thì |
| Đổi phe tà | tainted faction requirement | guild membership | faction blocker riêng |
| Luân Hồi | transfer policy/preview | chỉ record được giữ | không kế thừa guild bonus ngầm |

### Cost, power, cooldown

| ID | Rule |
|---|---|
| TEC-011 | Một nguồn modifier chỉ áp dụng một lần: không cộng ở cả `computeStats` và `techniqueCombatProjection`; evolution không tính lại thành Fate thứ hai. |
| TEC-090 | `resolveTechniqueCosts(technique, progress, stats, evolution, stance, resonance)` là nguồn cost DUY NHẤT cho eligibility, preview, prepare và commit. Thứ tự: catalog base → mastery (stage ≥ 3: ×0.85 cho Linh Khí/Thể Lực/Thanh Tỉnh) → stat multiplier (`staminaCostMultiplier`, `sanCostMultiplier`) → evolution (`*CostMult`) → stance → resonance `costPct` → guild/profession modifier hợp lệ → clamp ≥ 0 và làm tròn. |
| TEC-091 | Làm tròn: Linh Khí/Thể Lực `ceil`; Thanh Tỉnh/Thọ Nguyên/Tà Nhiễm 2 chữ số thập phân. Thọ Nguyên phải còn > cost. |
| TEC-092 | Power: catalog `powerCoefficient` → mastery multiplier `[0.6, 0.8, 1, 1.15, 1.3]` → evolution `powerMult` → Fate (`1 + bonusPct/100`) → guild (`1 + powerPct/100`) → world/element (`combatPowerByElement`, `elementPenalty`, quan hệ với tâm pháp lõi) → stance → matchup family. Phần trăm cùng nhóm cộng rồi nhân một lần; cap theo nhóm; áp dụng một lần trước khi tách damage component. |
| TEC-093 | Corruption cost đi qua `effectiveCorruptionGain`; nếu chạm trần, preview nêu requested/applied. |
| TEC-095 | Cooldown chuẩn hóa thành `player.techniqueCooldowns[id] = { readyAtTurn }`; cast hợp lệ khi `turn >= readyAtTurn`. Cooldown riêng từng Công Pháp, không timer chung. |
| TEC-096 | Legacy `cooldownSeconds` quy đổi một lần khi normalize: `cooldownTurns = ceil(seconds / 5)`. Cooldown thực = `ceil(base × (stage ≥ 3 ? 0.9 : 1) × (1 − evolution.cooldownPct/100))`. Cooldown 0 không lưu record. Cooldown tính theo lượt, không theo ngày game. |

### TEC-094 — Ma trận thế thi triển (stance)

| Thế | Power | Thanh Tỉnh | Tà Nhiễm | Linh Khí/Thể Lực/Thọ Nguyên | Cooldown |
|---|---:|---:|---:|---:|---:|
| `steady` (Ổn định) | ×1.00 | ×1.00 | ×1.00 | ×1.00 | ×1.00 |
| `burst` (Bộc phát) | ×1.20 | ×1.00 | ×1.50 | ×1.00 | ×1.00 |
| `guarded` (Hộ thể) | ×0.85 | ×0.50 | ×0.50 | ×1.00 | ×1.00 |

`guarded` chỉ giảm phí SAN/Tà Nhiễm, KHÔNG giảm incoming damage/risk. Stance không hợp lệ → reject, không tiêu gì.

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-01 | Preview/commit cùng stance + Mệnh, cả ba thế | cost/power/effect giống receipt | `verify_review_batches.js` |
| RG-02 | Thiếu từng resource, cooldown, target sai, stance sai | blocker cụ thể, không mutate | `verify_review_batches.js` |
| RG-03 | Cooldown 0/1/seconds legacy | `readyAtTurn` đúng, không record khi 0 | `verify_review_batches.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-008, 054 | expansion.js:`techniqueEligibility` | Khớp | `TECHNIQUE_DORMANT` |
| TEC-050 | expansion.js:`techniqueEligibility` | Thiếu | chưa trả `state` ready/dormant/blocked và map `access` |
| TEC-052 | expansion.js:`techniqueEligibility` | Lệch | blocker push theo thứ tự intent → guild_signature → profession → hidden → guild → path → codex → learned → realm… |
| TEC-058 | expansion.js:`techniqueEligibility` | Khớp | bộ code canonical lấy theo runtime |
| TEC-090, 091 | expansion.js:`techniqueEligibility` → engine.js:`resolveTechniqueExecutionInputs` | Khớp | một nguồn tính cost cho eligibility/preview/commit (2026-10-22) |
| TEC-092, 094 | engine.js:`techniqueCombatProjection`, `resolveTechniqueCosts` | Khớp | |
| TEC-093 | engine.js:`techniquePreview` | Thiếu | không trả requested/applied corruption |
| TEC-095, 096 | engine.js:`useTechnique`, `techniqueCatalog` | Khớp | |
