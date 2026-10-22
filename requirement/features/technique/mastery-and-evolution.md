# Công Pháp — Mastery, evolution, fusion

## Mục đích

Tăng mastery, thí luyện (trial) mở nhánh tiến hóa, chọn nhánh và hợp nhất (fusion) Công Pháp. Khung SYS-04 evolution dùng chung thuộc [cross-system](../cross-system/README.md).

## Dữ liệu & trạng thái

- `player.techniques[id]`: `masteryStage` (0–4), `masteryExp`, `usageCount`, `evolution { status: locked/ready/chosen, type, progress, target, eventKeys[≤64], archive, branchId, … }`.
- Catalog: `techniqueEvolutions`, `progression.evolutionIds`, `progression.fusionEligible`.
- Ngưỡng mastery `[0, 100, 300, 700, 1500]`.

## Rules

| ID | Rule |
|---|---|
| TEC-116 | Mastery tăng đúng một lần sau khi outcome được quyết định; không tăng ở preview, blocker, duplicate, cancel. Combat mastery chỉ cho `chieu_thuc`/`cam_thuat`; base combat 4, tu luyện 12 (`tam_phap`)/3 (combat method)/8 (khác); × (1 + Ngộ Tính/100) × (1 + guild `masteryGainPct`/100), tối thiểu 1. Stage theo ngưỡng ở mục Dữ liệu. Training phải qua eligibility `training`. |
| TEC-117 | **Evolution trial:** mở khi learned + catalog `techniqueEvolutions` có nhánh + mastery stage ≥ 2 + status `locked`; target `cultivation` 5, `elite` 2. Mở UI/load không tăng progress. |
| TEC-118 | Trial event: một producer duy nhất; `cultivation` = một tick mỗi action tu luyện đã commit (eventId = actionId); `elite` = một tick mỗi encounter elite kết thúc hợp lệ (eventId = encounterId, không phải animation/turn/cast). Chỉ trial cùng type tăng; `requiresUse` bắt buộc techniqueId khớp. Duplicate eventId no-op; `eventKeys` ≤ 64; progress = min(target, progress+1); đủ → `ready` + log một lần; `ready`/`chosen` không nhận tick; archive bounded `{count, lastHash, policy: bounded_trial_archive_v1}`. Event legacy thiếu ID lấy từ sequence canonical. |
| TEC-119 | Chọn nhánh: status `ready`, nhánh thuộc technique, requirement (realm/path/guild/fateElements) còn hợp lệ, actionId mới; preview before/after, irreversible, modifier bị cap; transaction một lần ghi `{ branchId, parentTechniqueId, sourceFateIds, sourcePathId, sourceProfessionId, selectedAtTurn, receiptId }`. Mất requirement sau khi chọn → giữ evolution, modifier dormant đến khi đủ lại. |
| TEC-11A | Save cũ: `evolution.eventKeys = []`, target theo rule hiện hành; không cấp bù progress. Unknown evolution/policy trong save: giữ raw progress, modifier dormant, ghi migration note; không xóa mastery. |
| TEC-115 | **Fusion:** khai báo input IDs, mastery tối thiểu, insight/vật liệu, output ID, điều kiện realm/path/Fate; kiểm tra cycle, category/namespace/element compatibility, source ownership và tổng cost; tạo ID catalog persistent ổn định (không random); receipt ghi `parentIds`, `fusionReceiptId`, Mệnh nguồn (Mệnh không bị tiêu hủy nếu contract không nói rõ). |

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-16 | Trial: event lặp, sai type, 2 encounter khác ID | tăng đúng, không vượt target, save/load giữ idempotency | `verify_review_batches.js` |
| RG-17 | Evolution/fusion | receipt có Mệnh/path/Nghề nguồn; validator chặn cycle | — |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-115, 119, 11A | expansion.js:`chooseTechniqueEvolution` | Thiếu | không có fusion; chọn nhánh không kiểm requirement/actionId, không receipt, không dormancy |
| TEC-116 | engine.js:`updateTechniqueMastery` | Khớp | |
| TEC-117, 118 | expansion.js:`ensureTechniqueTrials`, `advanceTechniqueTrials` | Khớp | |
| TEC-118 (producer) | expansion.js:`recordTechniqueTrialEvent` | Lệch | tên trùng nghĩa nhưng chỉ append log `techniqueTrialEvents` (không dedupe); producer thật là `advanceTechniqueTrials` |
