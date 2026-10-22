# Profession — Danh sách nghề & slot

## Mục đích

Catalog Nghề Nghiệp sinh hoạt, mô hình slot Nghề chính/Nghề Ẩn, luật khóa lựa chọn, namespace và migration save. Mastery ở [profession-progression.md](profession-progression.md); chế tạo ở [crafting-recipes.md](crafting-recipes.md); Nghề Ẩn ở [hidden-professions.md](hidden-professions.md).

## Dữ liệu & trạng thái

```js
state.professionState = {
  schemaVersion: 2,
  primaryId: null,          // đúng một Nghề chính thường hoặc null
  secondaryId: null,        // đúng một Nghề Ẩn hoặc null — slot canonical
  hiddenId: null,           // mirror của secondaryId (tương thích)
  hiddenIds: [],            // Nghề Ẩn đã mở/đã biết, khử trùng, chỉ ID thuộc catalog Nghề Ẩn
  selectionLocked: false,   // = Boolean(primaryId)
  professions: { [id]: { masteryExp, masteryStage, recipesKnown: [], specializations: [], lastActionDay } }
}
state.player.hiddenProfession   // mirror tương thích, luôn = secondaryId
```
Catalog: `data/expansion_data.js:professionDefinitions` (nghề thường), `hiddenProfessions` (Nghề Ẩn; entry `kind: "tu_tich"` là Con Đường Ẩn, không phải nghề).

## Rules

### PROF-LST-001 Nghề Nghiệp sinh hoạt
| `professionId` | Tên | Con Đường liên quan (chỉ gợi ý) | Công thức/hành động |
|---|---|---|---|
| `luyen_dan` | Luyện Đan Sư | `dan_dao` | `tu_khi_dan`, `hoan_huyet_dan`, `dien_tho_dan_ha` |
| `luyen_khi` | Luyện Khí Sư | `kiem_dao`, `khoi_loi_dao` | `procedural_artifact`, tu bổ di vật |
| `tran_phap` | Trận Pháp Sư | `phong_thuy_dao`, `phu_dao` | `gathering_formation`, `ward_formation` |
| `tuong_su` | Tướng Sư | `tinh_tuong_dao` | Xem tướng NPC, xem Mệnh |

Nghề học qua thầy, guild, recipe hoặc quest nghề; là chuyên môn hành động, không phải trục tu luyện. `relatedPaths` không cộng hiệu ứng trùng với Con Đường.

### PROF-NS-001 Bốn lớp tách biệt
| Lớp | Bản chất | Nơi hiển thị | State |
|---|---|---|---|
| Con Đường | Trục tu luyện | Nhân vật/Con Đường | `pathState` |
| Nghề chính | Chuyên môn, chế tạo, giao dịch | Nhân vật/Nghề Nghiệp | `professionState.primaryId` |
| Nghề Ẩn (nghề phụ) | Nghề ngoại lệ, chỉ mở qua Cổ Tịch | Nhân vật/Nghề Nghiệp + Dị Chí (clue) | `professionState.secondaryId` |
| Con Đường Ẩn | Nhánh Con Đường | Con Đường/Dị Chí | `pathState.hiddenPathId` |

Mệnh Số chỉ là điều kiện/nguồn tương hợp: không tự thành nghề, không nhận hiệu ứng nghề chỉ vì cùng tag. Không dùng `pathId` lookup nghề, không dùng `hiddenProfession` kết luận Con Đường, không dùng Dị Thể ghi đè hai hệ kia. Một ID không được dùng chung cho `pathVariant`, `hiddenPathId` và `professionId`.

### PROF-NS-002 Slot và khóa
- Chọn Nghề chính trước; commit đặt `selectionLocked = true` trong cùng transaction và khóa vĩnh viễn mọi nghề thường khác (không có nghề thường thứ hai, kể cả qua alias/save cũ).
- Nghề Ẩn chỉ chọn được sau khi đã có Nghề chính, đã có clue và đã hoàn tất đồ thị mở khóa; chỉ một Nghề Ẩn vào `secondaryId`, sau đó slot cố định.
- Mở khóa Nghề Ẩn không tự trang bị; người chơi phải chọn. Không giải được đồ thị → `secondaryId = null`, không bị phạt.
- Chọn nghề lần đầu trao một vật phẩm nghề khởi đầu tương ứng (nếu có).
- Yêu cầu chọn lại nghề thường sau khi đã khóa: trả `compatibilityOnly`, không đổi nghề.

### PROF-NS-003 Read boundary
`canonicalHiddenProfessionId(state)` là điểm đọc duy nhất cho logic cần biết Nghề Ẩn (điều kiện Con Đường, Ngoại Đạo Giả, thử thách, chiến thắng cuối). Ghi canonical luôn qua `professionState.secondaryId`; `hiddenId`, `player.hiddenProfession` chỉ là mirror.

### PROF-NS-004 Invariant
`primaryId` không phải ID Nghề Ẩn; `secondaryId` thuộc catalog Nghề Ẩn (không phải nghề thường, không phải `tu_tich`); `primaryId ≠ secondaryId`; `hiddenIds` chỉ chứa ID Nghề Ẩn; `hiddenId = secondaryId = player.hiddenProfession`; `selectionLocked = Boolean(primaryId)`; mỗi record nghề có `masteryExp ≥ 0`, `masteryStage` 0–4, `recipesKnown`/`specializations` là mảng. `validateProfessionNamespace()` và `validateExpansionState()` báo lỗi khi vi phạm.

### PROF-NS-005 Migration save
Chạy trong `ensureExpansionState`, cộng dồn, deterministic, an toàn khi chạy lặp:
1. Nghề Ẩn hợp lệ nằm ở `primaryId` và chưa có nghề phụ → chuyển sang `secondaryId`, xóa `primaryId`.
2. Ưu tiên `secondaryId` hợp lệ; nếu không, khôi phục từ `hiddenId` hoặc `player.hiddenProfession` hợp lệ đã mở khóa.
3. `player.hiddenProfession` trùng nghề chính mà không có hidden unlock → xóa projection sai, giữ nghề chính.
4. Nhiều Nghề Ẩn active → giữ `secondaryId`, phần còn lại thành history (`hiddenIds`).
5. Loại alias không hợp lệ/nghề thường khỏi namespace ẩn, không xóa record/mastery của nghề chính; không migrate path ID sang profession ID.
6. Đồng bộ mirror; khử trùng và lọc `hiddenIds` theo catalog.

### PROF-NS-006 Hiển thị
Thanh trạng thái hiển thị Nghề chính; chỉ sau khi Nghề Ẩn được mở và cố định mới hiển thị thêm Nghề Ẩn. Không hiển thị Con Đường Ẩn trong danh sách nghề. UI/log dùng đúng nhãn "Nghề chính", "Nghề phụ", "Nghề Ẩn", "Con Đường Ẩn".

## Acceptance

- Chọn Nghề chính tạo record và khóa slot nghề thường ngay; không có secondary là nghề thường; không alias drift.
- Save legacy hidden-primary và alias nghề thường sai được chuẩn hóa, giữ mastery/clue (`testProfessionLegacyNamespaceMigration`).
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_canonical_contracts.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PROF-LST-001 | `data/expansion_data.js:professionDefinitions` | Khớp |
| PROF-NS-001 | `js/expansion.js:progressionNamespaceSnapshot`, `validateCanonicalNamespaces` | Khớp |
| PROF-NS-002 | `js/expansion.js:professionAvailability`, `chooseProfessionLocked` | Khớp |
| PROF-NS-003 | `js/engine.js:canonicalHiddenProfessionId` (đọc `hiddenId` trước `secondaryId`) | Lệch |
| PROF-NS-004 | `js/expansion.js:validateProfessionNamespace` | Khớp |
| PROF-NS-005 | `js/expansion.js:ensure` (`ensureExpansionState`) | Khớp |
| PROF-NS-006 | `js/ui.js` | Khớp |
