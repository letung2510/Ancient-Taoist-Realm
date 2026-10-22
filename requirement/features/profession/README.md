# Profession — Nghề Nghiệp

## Phạm vi

Nghề Nghiệp sinh hoạt (Nghề chính), Nghề Ẩn (nghề phụ mở bằng Cổ Tịch Tà Thần, Luân Hồi Tiên), slot/khóa lựa chọn, mastery nghề, công thức chế tạo và vật phẩm nghề. Không bao gồm Con Đường/Con Đường Ẩn ([../path/README.md](../path/README.md)), Dị Thể ([../di-the/README.md](../di-the/README.md)) hay Dị Chí ([../discovery/README.md](../discovery/README.md)).

## Chức năng

| Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
|---|---|---|---|
| Danh sách nghề, slot, namespace | [profession-list.md](profession-list.md) | `PROF-LST-`, `PROF-NS-` | `js/expansion.js:professionAvailability`, `chooseProfessionLocked`, `validateProfessionNamespace`; `js/engine.js:canonicalHiddenProfessionId` |
| Thục luyện nghề | [profession-progression.md](profession-progression.md) | `PROF-MST-` | `js/expansion.js:practiceProfession` |
| Chế tạo & vật phẩm nghề | [crafting-recipes.md](crafting-recipes.md) | `PROF-CRF-` | `js/expansion.js:RECIPE_CATALOG`, `brewPill`, `craftArtifact`, `placeFormation`, `readNpc`; `data/profession_items.js` |
| Nghề Ẩn | [hidden-professions.md](hidden-professions.md) | `PROF-HID-` | `js/expansion.js:inspectCodex`, `hiddenProfessionClue`, `useHiddenProfessionAction` |

## Phụ thuộc

- [../path/path-selection.md](../path/path-selection.md) — Con Đường tách khỏi Nghề (PATH-SEL-009/010).
- [../path/ngoai-dao-gia.md](../path/ngoai-dao-gia.md) — Ngoại Đạo Giả không mang Nghề Ẩn.
- [../fate/progression-gates.md](../fate/progression-gates.md) — Mệnh ẩn Luân Hồi Tiên.
- [../technique/README.md](../technique/README.md) — Công Pháp `tran_phap` cho đặt trận; [../discovery/README.md](../discovery/README.md) — clue.

## Quyết định đã chốt

| Ngày | Quyết định | Rule bị ảnh hưởng |
|---|---|---|
| 2026-10-22 | Nghề Ẩn chỉ chọn được sau khi đã có Nghề chính (runtime); bỏ khả năng chọn Nghề Ẩn trước. | PROF-NS-002 |
| 2026-10-22 | Không còn quyền đổi Nghề thường sau khi khóa; rule canonical mới thắng rule cũ. | PROF-NS-002 |
| 2026-10-22 | ID Nghề Ẩn IV là `tho_san_di_trieu` (không dấu, theo runtime) thay `tho_san_di_triều`. | PROF-HID-002, PROF-HID-005 |
| 2026-10-22 | Danh sách nghề thường, công thức, vật phẩm nghề và ngưỡng mastery (25/100/300/600) lấy theo runtime/data làm requirement. | PROF-LST-001, PROF-MST-003, PROF-CRF-001..006 |
| 2026-10-22 | "Nghề Ẩn Tà Tịch" (đọc Tà Tịch +15–25 Corruption, 4 nghề theo Tà Thần) bị thay bằng: Cổ Tịch I–VII → 7 Nghề Ẩn; Cổ Thần Tàn Hồn → 4 Con Đường Ẩn. | PROF-HID-001 |
| 2026-10-22 | Luân Hồi Tiên giữ điều kiện kích hoạt đầy đủ (Mệnh, quest, cấp 5, Neo, chết tự nhiên); Luân Hồi bắt buộc khi hết Thọ Nguyên cho nhân vật thường là cơ chế khác của `character/`. | PROF-HID-009 |

## Gate

`node tools/verify_review_batches.js` · `node tools/verify_canonical_contracts.js` · `node tools/verify_dichi_deep.js` · `node tools/verify_catalog_balance.js`
