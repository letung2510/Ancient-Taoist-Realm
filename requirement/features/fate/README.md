# Mệnh Số (Fate)

## Phạm vi

Mệnh Số là lớp tiến triển giữa nhân vật, Cảnh Giới, Con Đường và cơ duyên: catalog 10.000 Mệnh, roll theo cấp, ô kích hoạt (Ấn ký) và Mệnh Kho, hiệu lực chỉ số, tương hợp Con Đường, quan hệ Mệnh–Mệnh và Nhân Vật–Mệnh, Cường Hóa/Dung Hợp/Tiến Hóa, action nâng cao (Nghịch Mệnh, Trấn Mệnh, Thiên Cơ, Mệnh Đổi).
Không sở hữu: luật Con Đường/Ngoại Đạo Giả (`../path/`), nghi thức đột phá (`../realm-progression/`), tiêu thụ Mệnh ở Công Pháp (`../technique/`), receipt phần thưởng chung (`../reward/`), khởi tạo nhân vật (`../character/`).

Nguyên tắc chung (áp dụng mọi file): chỉ Mệnh active có hiệu lực; phẩm cấp không đồng nghĩa sức mạnh tuyệt đối; mọi kết quả phải giải thích được (blocker, cost, trước/sau); không làm mất Mệnh âm thầm; engine là nguồn tính duy nhất, UI không tự tính.

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Catalog, schema, map grade/sign, split effect | [catalog-and-schema.md](catalog-and-schema.md) | `FATE-CAT-` | `js/engine.js:fateDefinition`, `splitFateEffects`, `GRADE_TO_TIER` |
| Roll, trọng số theo cấp, nguồn nhận, trùng lặp, độc bản Tiên | [pool-and-generation.md](pool-and-generation.md) | `FATE-ROLL-` | `js/engine.js:rollFateByProgression`, `receiveFate` |
| Ấn ký, Mệnh Kho, trang bị/tháo, pending, hiến tế | [slots-and-equip.md](slots-and-equip.md) | `FATE-SLOT-` | `js/engine.js:equipFateFromVault`, `storeFateToVault`, `fateVaultCapacity` |
| Lớp hiệu ứng, điểm Mệnh, chỉ số | [effects-and-stats.md](effects-and-stats.md) | `FATE-EFF-` | `js/engine.js:fateEffectBreakdown`, `enhancedFateEffects`, `computeFate` |
| Tương hợp Con Đường (match score) | [resonance.md](resonance.md) | `FATE-RES-` | `js/engine.js:fateCompatibility`, `pathMatchSummary` |
| Quan hệ Mệnh–Mệnh, Nhân Vật–Mệnh, Dưỡng Mệnh, Cộng Minh, Giác Ngộ, Mệnh Nguội | [relationships.md](relationships.md) | `FATE-REL-` | `js/engine.js:nurtureFate`, `resonateFate`, `computeRelationshipEffects` |
| Cường Hóa, Dung Hợp, Tiến Hóa (Mệnh Kiếp) | [upgrade-replace-ritual.md](upgrade-replace-ritual.md) | `FATE-UPG-` | `js/engine.js:upgradeFate`, `mergeFates`; `js/expansion.js:evolveFate` |
| Action nâng cao Phase 3 | [advanced-actions.md](advanced-actions.md) | `FATE-ADV-` | `js/engine.js:FATE_ADVANCED_ACTION_CATALOG`, `defyFate`, `suppressFate`, `heavenlyOmen`, `transformFate` |
| Giao diện Mệnh Số | [ui.md](ui.md) | `FATE-UI-` | `js/ui.js` (fate panel), `js/main.js` (`data-fate-*`) |
| Save, migration, regrade catalog | [save-and-migration.md](save-and-migration.md) | `FATE-SAVE-` | `js/engine.js:toCanonicalCharacter`, `fromCanonicalCharacter`, `validateFateInventory` |
| Cổng Mệnh Số cho tiến trình (Mệnh hiệu dụng, hiến tế, Mệnh ẩn) | [progression-gates.md](progression-gates.md) | `FATE-CD-` | `js/engine.js:computeFate`, `sacrificeFate` |

## Phụ thuộc

- [../character/README.md](../character/README.md) — 5 Mệnh khởi tạo, Mệnh ẩn Luân Hồi Tiên.
- [../path/README.md](../path/README.md) — bảng `lead/support/forbidden` của Con Đường, Ngoại Đạo Giả, hidden fate bridge.
- [../technique/README.md](../technique/README.md) — cộng hưởng Mệnh × Công Pháp (element/tag), phía tiêu thụ.
- [../realm-progression/README.md](../realm-progression/README.md) — `activeSlots`, `minFate`, nghi thức Gọi Mệnh, pity Mệnh khi đột phá.
- [../reward/README.md](../reward/README.md) — `grantCanonicalReward`, receipt idempotent.
- [../data-runtime/README.md](../data-runtime/README.md) — envelope save, version.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-09-08 | Catalog regrade Phương án 3 (manifest `phase3-20260908`) thành 50/25/12/7/4/1,5/0,49/0,01; thay phân bố 80% Phàm cũ. | FATE-CAT-003, FATE-SAVE-004 |
| 2026-09-09 | Bảng trọng số reward 5 bậc cấp (1–2/3–4/5–6/7–8/9+) thay bảng 6 bậc cũ (40/35/20/5 ở cấp 3–4, Tiên 0,5–1%). | FATE-ROLL-003 |
| 2026-09-09 | Tiên độc bản trong phạm vi save (`state.meta.uniqueFateOwnership`); không giả lập server-wide. | FATE-ROLL-009 |
| 2026-09-22 | Bốn action Phase 3 là runtime production; mọi nhãn "CHỜ DUYỆT/Chưa có" cũ bị hủy. Trấn Mệnh cố định 3 turn, caller không chọn thời lượng. | FATE-ADV-* |
| 2026-10-05 | `decayPolicy: "none"`: Mệnh Kho không làm suy giảm bậc quan hệ; đề xuất giảm 1 bậc sau 30 ngày bị hủy. | FATE-REL-013 |
| 2026-10-22 | Bậc 3→4 (Nhân Mệnh Hợp Nhất) chỉ đạt qua commit Tiến Hóa Mệnh (`evolveFate`); trigger "đột phá khi Mệnh active" bị hủy. | FATE-REL-006, FATE-UPG-007 |
| 2026-10-22 | Bậc 4 không khóa tháo/hiến tế/dung hợp; chỉ Mệnh đã Tiến Hóa bị cấm làm chất liệu Cường Hóa/Dung Hợp. | FATE-REL-007, FATE-UPG-003 |
| 2026-10-22 | **Thay quyết định "Mệnh Đổi là wrapper của Tiến Hóa"** (khiến Mệnh Đổi trùng Tiến Hóa và, trong runtime, không thể commit vì `stage ≥ 4` chỉ do chính `evolveFate` gán): Mệnh Đổi = đổi nhánh Tiến Hóa của Mệnh đã `evolved` (bậc 4); không gọi `evolveFate`; chi phí tăng theo lần, tối đa 3 lần, hồi 30 ngày. Bậc 3→4 vẫn chỉ qua Tiến Hóa. Spec đầy đủ ở FATE-ADV-007…015. | FATE-ADV-001, 007, 009, 011…015 |
| 2026-10-22 | Bậc 1→2: `alignedChoices ≥ 3` hoặc `points ≥ 25`; lựa chọn đạo đức chỉ từ sự kiện quan hệ NPC, cơ duyên tranh đoạt và sự kiện bản đồ (qua `recordFateChoice`); `eliteTrials`/`alignedChoices` của `recordFateBehavior` chỉ tăng ở bậc 0/1 để không đếm kép với Mệnh Kiếp. | FATE-REL-005, 006, 008 |
| 2026-10-22 | Trùng lặp Huyền+: trả blocker `duplicate`, không popup bán/tặng. Tinh Hoa Dư tự quy đổi chỉ cho Phàm/Linh/Hoàng (1/3/8). | FATE-ROLL-007 |
| 2026-10-22 | Mệnh Kho đầy: nguồn phần thưởng dùng pending; nguồn giao dịch trả trước kiểm kho trước khi trừ chi phí và trả `vaultFull`; cấm tự thay Mệnh trong kho. | FATE-SLOT-006 |
| 2026-10-22 | Trấn Mệnh vô hiệu toàn bộ Mệnh (effect + score) trong thời hạn, không khóa theo từng effect key. | FATE-ADV-005 |
| 2026-10-22 | Bộ đếm Nghịch Mệnh: effect đọc `fateAdvancedActions[id].nghichMenh.uses`; `fateDefiance[id]` là bản phản chiếu để chặn trần, phải bằng nhau. | FATE-ADV-003 |
| 2026-10-22 | Match score không nhân trực tiếp vào chỉ số; dùng làm cổng (Cộng Minh ≥8, chọn Con Đường ≥3, nhánh Tiến Hóa) và nhãn UI. Công thức `normal × path × relationship × combo` bị hủy; dùng `computeFate`. | FATE-RES-004, FATE-EFF-006 |
| 2026-10-22 | Dưỡng Mệnh không có diminishing return riêng; giới hạn bằng cooldown 1 lần/ngày/Mệnh và +1 điểm. | FATE-REL-009 |
| 2026-10-22 | Phường Thị bán 3 Mệnh Phàm không Hung, làm mới mỗi ngày game; phẩm cao hơn lấy qua Công Đức/Khâm Thiên Giám/nguồn khác. | FATE-ROLL-006 |
| 2026-10-22 | Mệnh Nguội 60 ngày và tỷ lệ Tinh Hoa Dư là số chốt. | FATE-REL-012 |
| 2026-10-22 | Giác Ngộ: chỉ Mệnh Hung tăng tri thức cấm; tiêu chí "concept u ám" bị hủy. | FATE-REL-011 |
| 2026-10-22 | Khuôn kết quả chung `{ ok, action, preview, cost, warnings, blockers, changes, rollbackToken }` bị hủy; mỗi resolver trả `{ success, reason \| blockers, … }` kèm dữ liệu riêng. | FATE-SLOT-010, FATE-ADV-008 |

## Gate

```text
node --check js/engine.js
node --check js/expansion.js
node tools/verify_review_batches.js
node tools/verify_game.js
node tools/verify_33_item_coverage.js
```
