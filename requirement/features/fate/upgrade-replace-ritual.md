# Mệnh Số — Cường Hóa, Dung Hợp, Tiến Hóa

## Mục đích

Ba cách đầu tư lâu dài vào Mệnh: Cường Hóa (+0…+5) bằng Mệnh cùng phẩm, Dung Hợp theo công thức dữ liệu, và Tiến Hóa Mệnh (Mệnh Kiếp) đưa quan hệ lên Nhân Mệnh Hợp Nhất.

## Dữ liệu & trạng thái

- `player.fateEnhancements[fateId]`: 0–5.
- `FATE_RELATIONSHIPS.fusion_recipes[]`: `{ recipe_id, materials[], result, success_rate_pct, fail_consequence, tier_from, tier_to }`.
- `player.fateEvolutions[fateId] = { status: "trial"|"ready"|"evolved", trialStartedDay, seed, candidateBranchIds[], branchId, evolvedAtDay, sourceEnhancementLevel: 5, progressKeys[], version: 1 }`.
- `GameExpansionData.fateEvolutionBranches` (`data/expansion_data.js`):

| Nhánh | scoreDelta | Thao tác effect | Điều kiện/hệ quả |
|---|---:|---|---|
| `thuan_dien` Thuận Diễn · Hợp Đạo | +2 | effect dương ×1,10 | match ≥ 8 |
| `nghich_dien` Nghịch Diễn · Đoạt Mệnh | +3 | effect chính ×1,18 | Mệnh Hung hoặc Corruption ≥ 30; `fateDebt +1`; +2 Corruption mỗi lần đột phá; nguy hiểm, cần xác nhận |
| `quy_nguyen` Quy Nguyên · Hóa Linh | 0 | dương ×1,05, âm ×0,75 | mặc định khi không còn ứng viên |

## Rules

### FATE-UPG-001 Cường Hóa
`upgradeFate(state, targetId, materialId)`: mục tiêu thuộc sở hữu (active hoặc kho); chất liệu là Mệnh khác, nằm trong kho, cùng grade; mục tiêu < +5. Thành công: tiêu chất liệu, `enhancement +1`, log "Mệnh Điểm trước → sau". Mỗi cấp: +2 điểm Mệnh và +5% hệ số effect (FATE-EFF-003).

### FATE-UPG-002 Preview Cường Hóa
`fateUpgradePreview` trả cấp trước/sau, điểm trước/sau, effect trước/sau, `validMaterial`, `capped`. UI phải báo vật liệu sẽ bị trừ.

### FATE-UPG-003 Mệnh đã Tiến Hóa
Mệnh `evolved` không được làm chất liệu Cường Hóa hoặc Dung Hợp.

### FATE-UPG-004 Dung Hợp theo công thức
`mergeFates(state, fateIds)`: ≥2 Mệnh khác nhau trong kho; bộ ID phải khớp chính xác `materials` của một `fusion_recipe` (không phân biệt thứ tự); `result.id` phải tồn tại trong catalog. Không roll pool tự do.

### FATE-UPG-005 Kết quả Dung Hợp
Nguyên liệu bị tiêu trước khi roll `success_rate_pct` (mặc định 100%, roll replay). Thất bại: nguyên liệu mất; nếu `fail_consequence` chứa "SAN -5" thì −5 SAN. Thành công: `receiveFate(result, { source: "fusion_recipe:<id>", allowPending: true })`; nhận lỗi → rollback kho/instance/pending/Tinh Hoa Dư.

### FATE-UPG-006 Mở Mệnh Kiếp (Tiến Hóa)
`fateEvolutionEligibility`: Mệnh sở hữu và active, Cường Hóa +5, `stage ≥ 3` và `resonanceUnlocked`, SAN ≥ 20, chưa `evolved`. Đạt +5 thì log báo đủ/thiếu điều kiện. `startFateEvolutionTrial` tạo record `trial`, chọn tối đa 2 nhánh ứng viên (lọc `requiresCompatibility`, `nghich_dien` chỉ khi Hung hoặc Corruption ≥ 30; rỗng → `quy_nguyen`), reset `eliteTrials`/`alignedChoices` của quan hệ.

### FATE-UPG-007 Commit Tiến Hóa
Trial chuyển `ready` khi thắng 2 tinh anh hoặc 3 lựa chọn tương ứng trong lúc Mệnh active (mỗi `uniqueKey` tính một lần). `evolveFate(state, fateId, branchId, { confirmed })`: cần `ready`, nhánh thuộc ứng viên, nhánh nguy hiểm cần `confirmed`. Chi phí theo `gradeTier`: Tinh Hoa Dư `5 + 2 × tier`, Công Đức `10 + 5 × tier`, SAN 10; thiếu → không trừ gì. Tinh Hoa Dư trừ **cả** `state.fateExcessEssence` và `state.player.fateExcessEssence` (hai bản luôn bằng nhau). Thành công: trừ chi phí, `status = evolved`, ghi `branchId`, `evolvedAtDay`, `stage = 4`, cộng `fateDebt` của nhánh, cập nhật derived. Đổi nhánh sau đó là Mệnh Đổi ([advanced-actions.md](advanced-actions.md#fate-adv-007-mệnh-đổi--mục-đích-và-phân-biệt)), không chạy lại `evolveFate`.

### FATE-UPG-008 Preview Tiến Hóa khớp commit
`fateEvolutionPreview(state, fateId, branchId)` mô phỏng đúng trạng thái sau commit (stage 4 + `evolved` + `branchId`) và áp nhánh đúng một lần qua `enhancedFateEffects`. `afterEffects` của preview phải deep-equal effect sau commit. Preview không tiêu hao tài nguyên hay RNG.

### FATE-UPG-009 Save Tiến Hóa
Branch không còn trong catalog khi load → hạ về `ready`, xóa `branchId` (và `fateAdvancedActions[id].menhDoi.branchId = null`), mở lại toàn bộ nhánh; `evolved` thiếu `branchId` là lỗi validator.

## Acceptance

- Cường Hóa khác grade, chất liệu ở Ấn ký, hoặc đã +5 đều bị chặn, state không đổi.
- Dung Hợp không khớp công thức bị chặn; thất bại do roll vẫn tiêu nguyên liệu; lỗi nhận thì rollback.
- Mệnh +5, stage 3: preview = commit; thiếu chi phí không ghi branch và không trừ tài nguyên.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-UPG-001/002 | `js/engine.js:upgradeFate`, `fateUpgradePreview` | Khớp |
| FATE-UPG-003 | `js/engine.js:upgradeFate`, `mergeFates` | Khớp |
| FATE-UPG-004/005 | `js/engine.js:mergeFates` | Khớp |
| FATE-UPG-006 | `js/expansion.js:fateEvolutionEligibility`, `fateEvolutionCandidates`, `startFateEvolutionTrial` | Khớp |
| FATE-UPG-007 | `js/expansion.js:recordFateEvolutionProgress`, `evolveFate` | Lệch — `evolveFate` chỉ trừ `state.fateExcessEssence`, thiếu `player.fateExcessEssence` |
| FATE-UPG-008 | `js/expansion.js:fateEvolutionPreview`; gate `tools/verify_review_batches.js` | Khớp |
| FATE-UPG-009 | `js/expansion.js` (normalize `fateEvolutions` khi load) | Khớp |
