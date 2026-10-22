# Công Pháp — Recipe chế tác

## Mục đích

Contract recipe chế tác dùng chung bởi Nghề (Luyện Đan, Luyện Khí, Trận Pháp). Logic nghề, mastery nghề và catalog nghề thuộc [profession](../profession/README.md); thưởng qua ledger thuộc [reward/receipt-ledger.md](../reward/receipt-ledger.md).

## Dữ liệu & trạng thái

Recipe: `{ id, professionId, materials: { itemId: qty }, output: { itemId | kind, quantity, purpose? }, costs: { stamina?, qi?, san?, merit? }, successBase?, perfectMultiplier? }`; nguồn `GameExpansion.recipeCatalog()`.

## Rules

| ID | Rule |
|---|---|
| TEC-150 | Recipe canonical theo shape ở mục Dữ liệu; resolver dùng `id`. |
| TEC-151 | `recipeCanCommit()` kiểm tra toàn bộ nguyên liệu và chi phí trước; `commitRecipeCosts()` trừ một lần sau khi hợp lệ. Không trừ từng phần trước khi biết recipe hợp lệ; commit lỗi không mất một phần nguyên liệu. |
| TEC-152 | Preview recipe không trừ nguyên liệu/stamina/RNG commit. Recipe không tồn tại không fallback âm thầm (trừ alias khai báo). Mastery nghề tăng một lần sau khi có kết quả. |
| TEC-153 | Recipe hiện có: `tu_khi_dan`, `hoan_huyet_dan`, `dien_tho_dan_ha` (Luyện Đan Sư); `procedural_artifact` (Luyện Khí Sư); `gathering_formation`, `ward_formation` (Trận Pháp Sư). |
| TEC-154 | Thưởng collection hiếm, contract, hidden realm, contested opportunity giao qua ledger (RWD-LED-001). Log kết quả dùng narrative producer; chi phí/thay đổi số liệu chỉ ở `statDisplay`/DTO. |

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-20 | Recipe thiếu nguyên liệu/chi phí | không trừ một phần | `verify_dichi_deep.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-150…154 | expansion.js:`recipeDefinition`, `recipeCanCommit`, `commitRecipeCosts`, `grantCanonicalReward` | Khớp | |
