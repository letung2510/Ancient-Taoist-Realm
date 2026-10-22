# Công Pháp — Cấm Thuật

## Mục đích

Cấm Thuật (`cam_thuat`) và mọi Công Pháp có giá thật: policy giá/phản phệ, xác nhận nguy hiểm inline. Seed phản phệ ở [execution.md](execution.md) (TEC-114); risk từ Mệnh Hung ở [fate-resonance.md](fate-resonance.md) (TEC-086); phe tà thuộc [path](../path/README.md).

## Dữ liệu & trạng thái

- Catalog: `forbiddenArt: { dangerLevel, price, backlash: { corruption, hpPct, chancePct }, requiresFaction }`, `ui.confirmation: "tainted"`; `CONG_PHAP_DATA.forbiddenArts`.
- Preview: cờ `dangerous` = `cam_thuat` hoặc có `forbiddenArt.backlash` hoặc cost SAN/Thọ Nguyên/Tà Nhiễm > 0 hoặc `riskPct > 0`.

## Rules

| ID | Rule |
|---|---|
| TEC-108 | **Xác nhận nguy hiểm:** không dùng browser `confirm()` ở bất kỳ phase Công Pháp nào (prepare, commit, evolve); kỹ năng không có giá thật commit không cần xác nhận. Khi preview `dangerous`, picker hiện **danger sheet inline** liệt kê toàn bộ giá SAN, Tà Nhiễm, Thọ Nguyên, HP, xác suất phản phệ, faction/curse; xác nhận là action explicit của người chơi (`confirmed: true`). Với Cấm Thuật, danger sheet bắt buộc **mỗi lần cast** (không nhớ theo phiên hay theo Công Pháp); engine từ chối commit Cấm Thuật thiếu xác nhận, không mutate. |
| TEC-130 | Cấm Thuật là behavior `cam_thuat`, thường source `tainted_god`. Bắt buộc `forbiddenArt` đầy đủ và `ui.confirmation: "tainted"` (validator chặn nếu thiếu). |
| TEC-131 | Có thể mạnh hơn (power × (1 + corruptionRating/50)) nhưng luôn tạo consequence truy nguyên được: preview hiển thị toàn bộ giá trước commit (TEC-108), backlash theo TEC-114. |
| TEC-132 | Catalog: `huyet_sat_bi_luc` (high; giá Tà Nhiễm 1, SAN 2; backlash Tà Nhiễm 5, HP 4%, 12%), `cam_thuat_huyet_te` (critical; giá Tà Nhiễm 4, SAN 5, Thọ 1; backlash Tà Nhiễm 12, HP 12%, 20%); cả hai `requiresFaction: rebel_heaven`. |

## UI

Danger sheet nằm trong inline picker của thẻ/action Công Pháp (xem [ui.md](ui.md)); hủy sheet không tiêu gì.

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-14 | Cấm Thuật: cast 2 lần liên tiếp; commit thiếu xác nhận | danger sheet hiện cả 2 lần, giá đúng, backlash seed deterministic; thiếu xác nhận → reject không mutate | `verify_random_boundaries.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-108 | main.js:`commitTechniqueAction`; ui.js:`renderTechniqueDangerSheet` | Khớp | danger sheet inline mỗi lần cast/tụ lực Cấm Thuật (2026-10-22) |
| TEC-130, 131, 132 | engine.js:`validateTechniqueCatalog`, `useTechnique`; data/cong_phap.js:`forbiddenArts` | Khớp | |
