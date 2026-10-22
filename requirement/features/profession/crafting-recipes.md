# Profession — Chế tạo & vật phẩm nghề

## Mục đích

Công thức chế tạo của nghề thường, hành động nghề (luyện đan, luyện khí, đặt trận, xem tướng) và vật phẩm nghề có số lần dùng/hồi.

## Dữ liệu & trạng thái

| Nguồn | Nội dung |
|---|---|
| `js/expansion.js:RECIPE_CATALOG` | `{ id, professionId, materials, output, costs, successBase?, perfectMultiplier? }` |
| `data/profession_items.js:PROFESSION_ITEMS` (schema v2) | Vật phẩm nghề: `professionId`, `action`, `charges`, `cooldownDays`, `recipe` (nạp lại), `effect` |
| `state.professionItemState[action] = { uses, charges, lastUseDay, effects }` | Trạng thái vật phẩm nghề |
| `state.placedFormations[id] = { techniqueId, ownerId, nodeId, createdDay, expiresDay, charges, purpose }` | Trận đã đặt |

## Rules

### PROF-CRF-001 Công thức
| Recipe | Nghề | Nguyên liệu | Đầu ra | Chi phí | Thành công |
|---|---|---|---|---|---|
| `tu_khi_dan` | `luyen_dan` | 2 Linh Thảo | 1 Tụ Khí Đan | 5 Thể Lực | base 0,45 |
| `hoan_huyet_dan` | `luyen_dan` | 3 Linh Thảo | 1 Hoàn Huyết Đan | 5 Thể Lực | base 0,45 |
| `dien_tho_dan_ha` | `luyen_dan` | 5 Linh Thảo | 1 Diên Thọ Đan (Hạ) | 5 Thể Lực | base 0,45 |
| `procedural_artifact` | `luyen_khi` | 8 Linh Thạch | 1 pháp khí sinh thủ tục | 5 Thể Lực | luôn (nếu sinh được) |
| `gathering_formation` | `tran_phap` | 5 Linh Thạch | Tụ Linh Trận | — | luôn |
| `ward_formation` | `tran_phap` | 5 Linh Thạch | Hộ Tâm Trận | — | luôn |

Kiểm đủ nguyên liệu và chi phí trước khi trừ (`recipeCanCommit`); thiếu → lý do cụ thể "Thiếu X (cần N)", không tiêu hao. Đầu ra phải tồn tại trong catalog item canonical.

### PROF-CRF-002 Luyện đan
`brewPill(state, recipeId)` yêu cầu Luyện Đan Sư đã cố định. `chance = clamp(successBase + Căn Cốt / 250 + masteryStage × 0.08 + alchemyChance(vật phẩm nghề), 0.1, 0.95)`; roll seeded theo lượt. Nguyên liệu bị tiêu hao cả khi thất bại ("dược liệu hóa tro"). Roll < `chance × perfectMultiplier` (0,15) → Hoàn Mỹ, đầu ra ×2. Mỗi lần luyện cộng mastery.

### PROF-CRF-003 Luyện khí
`craftArtifact(state)` yêu cầu Luyện Khí Sư; trừ nguyên liệu, sinh pháp khí bằng `createLootItem`. Sinh thất bại → rollback toàn bộ (hành trang, Thể Lực, record nghề, history, log). Hiệu ứng `craftQuality` của vật phẩm nghề cộng `allStatMult` cho pháp khí. `repairHeirloom(state, itemId)`: vật phẩm Di Truyền có hao mòn, tốn 5 Linh Thạch + 5 Thể Lực, giảm 5% hao mòn.

### PROF-CRF-004 Đặt trận
`placeFormation(state, "gather" | "protect")` yêu cầu Trận Pháp Sư và đã biết một Công Pháp category `tran_phap`; tối đa 3 trận đặt cùng lúc; trận tồn tại 7 ngày (+`formationDuration` từ vật phẩm nghề), 3 lượt hiệu lực, lên lịch world task mỗi 2 ngày.

### PROF-CRF-005 Xem tướng
`readNpc(state, npcId)` yêu cầu Tướng Sư; tỷ lệ `clamp(0.4 + Ngộ Tính / 200, 0.4, 0.9)`; ghi intel `face:<npcId>` (độ tin 0,8 nếu thành, 0,3 nếu hỏng, hạn 30 ngày); mỗi lần cộng mastery.

### PROF-CRF-006 Vật phẩm nghề
| Vật phẩm | Nghề | Action | Lần dùng | Hồi | Nạp lại | Hiệu ứng |
|---|---|---|---:|---:|---|---|
| Phương Thuốc `phuong_thuoc` | `luyen_dan` | `ghi_nho_cong_thuc` | 3 | 1 ngày | 2 Linh Thạch | `alchemyChance +0,12` |
| Bản Đồ Tinh Tú `ban_do_tinh_tu` | `tuong_su` | `doi_chieu_tinh_tu` | 3 | 1 ngày | 2 Linh Thạch | `divinationConfidence +0,2` |
| Phương Pháp Chiêm Tinh `phuong_phap_chiem_tinh` | `tuong_su` | `chiem_tinh` | 5 | — | — | `clueConfidence +0,15` |
| Bản Vẽ Linh Khí `ban_ve_linh_khi` | `luyen_khi` | `phan_tich_phap_khi` | 3 | — | — | `craftQuality +0,15` |
| Sổ Tay Trận Văn `so_tay_tran_van` | `tran_phap` | `ghi_tran_van` | 3 | — | — | `formationDuration +2` |

`useProfessionItem`: phải có trong hành trang và nghề tương ứng đã cố định; tôn trọng cooldown và số lần còn lại. `rechargeProfessionItem`: nạp đầy lần dùng bằng `recipe` của vật phẩm, chỉ cho Nghề chính/phụ. Catalog vật phẩm nghề tách khỏi loot table thường.

## Acceptance

- Thiếu nguyên liệu không tiêu hao; luyện khí lỗi rollback toàn bộ.
- Không đặt trận thứ 4; vật phẩm nghề hết lần dùng bị từ chối tới khi nạp lại.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_catalog_balance.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PROF-CRF-001 | `js/expansion.js:RECIPE_CATALOG`, `recipeCanCommit`, `commitRecipeCosts` | Khớp |
| PROF-CRF-002 | `js/expansion.js:brewPill` | Khớp |
| PROF-CRF-003 | `js/expansion.js:craftArtifact`, `repairHeirloom` | Khớp |
| PROF-CRF-004 | `js/expansion.js:placeFormation` | Khớp |
| PROF-CRF-005 | `js/expansion.js:readNpc` | Khớp |
| PROF-CRF-006 | `data/profession_items.js:PROFESSION_ITEMS`, `js/expansion.js:useProfessionItem`, `rechargeProfessionItem` | Khớp |
