# Công Pháp — Cộng hưởng Mệnh Số

## Mục đích

Cách Công Pháp tiêu thụ Mệnh Số đang kích hoạt để tạo modifier power/cost/risk. Phía Mệnh (element/tag/path affinity của Fate, Trấn Mệnh, layer effect) thuộc [fate](../fate/README.md); file này chỉ quy định phía Công Pháp.

## Dữ liệu & trạng thái

- Policy duy nhất: `CONG_PHAP_DATA.interactionCatalog.resonance` (`sameElementPct 4`, `samePathPct 5`, `matchingTagPct 3`, `opposingElementPct -4`, `hungRiskPct 3`, `capPct 18`, `maxSources 3`); `interactionCatalog.reverseRules`.
- Nguồn: `player.fates` (đang kích hoạt), `suppressedFates`, `pathId`, `technique.pathAffinity`, `interaction.preferredFateTags`, `behavior.tags`, `element`.
- DTO `techniqueFateResonance`: `bonusPct`, `riskPct`, `costPct`, `elementFateIds`, `pathFateIds`, `matchingFateIds`, `reverseFateIds`, `pathId`, `techniquePathAffinity`, `skillBlueprint`.

## Rules

| ID | Rule |
|---|---|
| TEC-080 | `GameEngine.techniqueFateResonance(state, technique)` chỉ đọc state. Nguồn: ID duy nhất trong `player.fates` (đang kích hoạt), tồn tại trong catalog Fate, không bị Trấn Mệnh (`suppressedFates[id].untilTurn > turn` → loại). Fate trong kho, đã gỡ hoặc không còn sở hữu không cộng. Một Fate ID chỉ đóng góp một lần. |
| TEC-081 | Chấm điểm bằng canonical element, tags, path affinity (lead/support) và sign của Fate; không đọc tên/mô tả/tag tự do của Công Pháp ngoài `interaction.preferredFateTags`, `behavior.tags`, `element`. |
| TEC-082 | **Công thức.** Với mỗi Fate qua TEC-080: `rankScore = 3×sameElement + 4×samePath + 2×matchingTags + 1×hungRisk` (cờ 0/1, `matchingTags` là số tag khớp) — chỉ dùng để xếp hạng. Giữ Fate có `rankScore > 0` (Fate chỉ có cờ `opposingElement` mà `rankScore = 0` bị loại), sắp `rankScore` giảm dần, hòa thì `id` tăng dần, lấy tối đa `maxSources`. Trên tập đã chọn: `bonusRaw = Σ (sameElement×sameElementPct + samePath×samePathPct + matchingTags×matchingTagPct + opposingElement×opposingElementPct)`; `bonusPct = clamp(bonusRaw, −capPct, +capPct)`; `riskPct = Σ hungRisk×hungRiskPct` (+ TEC-086). **Policy duy nhất** `interactionCatalog.resonance`, không có giá trị mặc định trong resolver (bỏ `\|\| 18`, `\|\| 3`) và không có policy dự phòng: field legacy `CONG_PHAP_DATA.resonancePolicy` bị xóa khỏi data, resolver không đọc. Validator (`validateTechniqueCatalog`): thiếu `interactionCatalog.resonance` hoặc sai kiểu → lỗi `technique:resonance-policy`; `sameElementPct`, `samePathPct`, `matchingTagPct`, `hungRiskPct` hữu hạn ≥ 0; `opposingElementPct` hữu hạn ≤ 0; `capPct` hữu hạn, `0 < capPct ≤ 18`; `maxSources` số nguyên `1…5`; còn `resonancePolicy` → lỗi `technique:resonance-policy-legacy`. Policy hỏng khi chạy production → resolver trả kết quả trung tính (`bonusPct 0`, `riskPct 0`, `costPct 0`, mảng ID rỗng), không dừng game. Không cần migration save (chỉ data). |
| TEC-083 | Same-element chỉ khi element của Công Pháp không phải `vo_he`/`di_he`/rỗng/unknown; element trung tính cho kết quả neutral. Quan hệ sinh/khắc không tự tạo bonus ngoài policy. |
| TEC-084 | Path resonance chỉ khi `pathId` đang hoạt động ∈ `technique.pathAffinity` (khai báo tường minh) VÀ Fate có path đó trong lead/support. Dùng chung cap với element. |
| TEC-085 | Nguyên tố đối nghịch (technique hỏa ← Fate thủy, kim ← hỏa, mộc ← kim, thổ ← mộc) cộng `opposingElementPct` (âm) vào bonus và `costPct` = \|`opposingElementPct`\| vào mọi cost. |
| TEC-086 | Mệnh Hung có tag `phan_phuc`/`ta_than`, hoặc Công Pháp `cam_thuat`, tạo `riskPct` (+`hungRiskPct` mỗi nguồn; + `reverseFate.corruptionPct` nếu rule `hungOnly`). Risk chỉ áp dụng khi commit; preview chỉ tính trước; không âm thầm làm skill fail nếu không có blocker. `riskPct` cộng vào corruption cost (÷100). Hệ quả phản phệ hợp lệ: tăng SAN/corruption cost, tăng backfire chance theo seed, tạo omen/relationship consequence, giảm power hoặc tăng cooldown. |
| TEC-087 | Trả DTO ở mục Dữ liệu. Preview hiển thị Fate nguồn + tổng modifier; log chỉ nêu nguồn khi bonus ≠ 0. |
| TEC-088 | Mệnh chỉ là modifier/requirement/consequence; không bypass ownership, guild rank, intent hay access policy; không thay source namespace. |
| TEC-089 | Resonance áp dụng cho mọi Công Pháp active qua cùng power pipeline, gồm `phu_tro` hồi phục (preview = commit); `tam_phap` không nhận. |
| TEC-08A | Fate có thể khai báo phía Mệnh `techniqueResonance: { tags, categories, powerPct, cost, risk }`, không tham chiếu hàm runtime/tên hiển thị; resolver đọc qua cùng policy/cap. |
| TEC-08B | `interactionCatalog.reverseRules` (`fate_hung_overload`, `fate_suppressed_break`, `fate_opposed_element`) là data rule phản phệ; mọi rule được dùng phải đi qua resolver và có `narrativeKey`. |

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-04 | Fate trùng ID / suppressed / kho / unknown element | đếm một lần; không cộng; `bonusPct ≤ 18`; source ID unique | `verify_review_batches.js` |
| RG-04a | Policy 4/5/3/−4/3, cap 18, `maxSources 3`; Fate A cùng element + cùng path + 2 tag khớp (`rankScore 3+4+4 = 11`), Fate B cùng element (`3`), Fate C chỉ khắc hệ (`0`, bị loại) | chọn A, B; `bonusRaw = (4+5+6) + 4 = 19` → `bonusPct 18` (kẹp); `riskPct 0`; đổi `capPct = 30` hoặc xóa `interactionCatalog.resonance` → validator báo `technique:resonance-policy`, resolver trả neutral | `verify_review_batches.js` |
| RG-04b | Data còn `CONG_PHAP_DATA.resonancePolicy` | validator báo `technique:resonance-policy-legacy` | `verify_review_batches.js` |
| RG-05 | Mất Mệnh cộng hưởng; Mệnh bắt buộc thiếu | modifier giảm, vẫn dùng nếu không yêu cầu; `FATE_REQUIRED` không mutate | `verify_review_batches.js` |
| RG-13 | `phu_tro` hồi phục | preview = commit cùng power pipeline | `verify_review_batches.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-074, 08A | expansion.js:`techniqueEligibility` | Thiếu | không đọc `requiredFateTags`/`requiredFateIds` của accessPolicy; Fate chưa có `techniqueResonance` |
| TEC-080…087 | engine.js:`techniqueFateResonance`; data/cong_phap.js:`interactionCatalog.resonance` | Khớp | cap 18, maxSources 3, dedupe Set, suppressed loại |
| TEC-082 | engine.js:`validateTechniqueCatalog` (dòng `resonancePolicy … > 5`), `techniqueFateResonance` (`interaction.resonance \|\| resonancePolicy`, `capPct \|\| 18`, `maxSources \|\| 3`); data/cong_phap.js:`resonancePolicy` (cuối `CONG_PHAP_DATA`) | Lệch | xóa field data và nhánh fallback; validator kiểm `interactionCatalog.resonance` theo TEC-082; tính `bonusRaw` theo công thức mới (kết quả số không đổi khi policy hiện hành hợp lệ) |
| TEC-089 | engine.js:`useTechnique` (`phu_tro` → `techniqueCombatProjection`) | Khớp | |
| TEC-08B | data/cong_phap.js:`interactionCatalog.reverseRules` | Thiếu | data có nhưng không resolver nào đọc |
