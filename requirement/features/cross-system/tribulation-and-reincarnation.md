# Cross-system — Thiên Kiếp cá nhân hóa, di sản Luân Hồi, mộ tiền kiếp (SYS-10, SYS-11)

## Mục đích

Thử thách Thiên Kiếp sinh theo build người chơi tại cổng Đột Phá; trước khi Luân Hồi tạo snapshot kiếp trước và cho chọn một di sản; mộ tiền kiếp trên bản đồ. Luật cảnh giới/Đột Phá: [realm-progression](../realm-progression/README.md).

## Dữ liệu & trạng thái

```js
pendingTribulation = { targetRealmLevel, seed, generatedDay, options: [], chosenId,
  status: "pending"|"resolved", result }
reincarnationLegacy = { generation, previousLives: [{ id, name, deathDay, deathLocationId, pathId,
  highestRealm, signatureFateId, signatureTechniqueId, summaryKeys: [] }],
  pendingChoices: [], chosenLegacyId, tombs: [], marksRetained: false }
```

## Rules

### Thiên Kiếp cá nhân hóa

| ID | Rule |
|---|---|
| CSX-TRB-001 | Tại cổng `Vượt Dị Tượng` sinh tối đa 3 option từ: Con Đường và hệ; Mệnh tương sinh/tương khắc/combo active; family/mastery Công Pháp; SAN/Tà Nhiễm; Neo Nhân Tính và tầng quan hệ; thế lực/chiến tranh/sự kiện vùng hiện tại. |
| CSX-TRB-002 | Không đổi số cổng theo cấp, không tự commit cảnh giới. Luôn có một option phổ quát trả bằng tài nguyên/công đức nếu build không thỏa option đặc thù; option đặc thù là cách giải khác, không cộng thêm cổng. |
| CSX-TRB-003 | Roll đúng một lần và persist trước khi render; reload không đổi option/kết quả; hai build khác nhau cùng cảnh giới đích sinh option khác nhau; `getBreakthroughBlockers` và checklist UI vẫn khớp. |

### Di sản Luân Hồi

| ID | Rule |
|---|---|
| CSX-LGC-001 | Trước reset tạo snapshot gọn; giữ tối đa 3 kiếp trước; summary là key/text đã sanitize, không chép toàn history. Reset canonical vẫn đúng; di sản chỉ thêm ngoại lệ đã preview. |
| CSX-LGC-002 | Ba di sản MVP: **Ký Ức Công Pháp** (mở thí luyện học lại nhanh hơn, không giữ đủ mastery); **Duyên Mệnh** (tăng xác suất gặp lại một manh mối Mệnh, không cấp thẳng Mệnh ngoài luật giữ một Mệnh); **Nợ Nhân Gian** (giữ một dư âm quan hệ/quest, không giữ toàn bộ quan hệ). |
| CSX-LGC-003 | Mộ xuất hiện ở node chết nếu hợp lệ; chết trong Bí Cảnh đã đóng → chuyển về node cha an toàn. Bái tế một lần/kiếp cho ký ức, manh mối hoặc trang trí; không farm chỉ số. |
| CSX-LGC-004 | Vật phẩm di truyền và wear do [CSX-ITM-003](item-legacy-auction-companion.md) quyết định. |
| CSX-LGC-005 | Luân Hồi/Chuyển Sinh dùng một resolver chung `buildReincarnationTransferPlan()` để preview UI và commit engine ra cùng kết quả; không nhân đôi Mệnh/vật phẩm qua transfer. |

## Acceptance

- Reload không đổi option Thiên Kiếp; mộ có vị trí dự phòng và chỉ nhận thưởng một lần.
- Gate: `verify_progression_requirement_matrix.js`, `verify_review_batches.js`, `verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-TRB-001–003 | engine.js/expansion.js:`pendingTribulation`; engine.js `universal` option | Khớp |
| CSX-LGC-001–003 | expansion.js:`reincarnationLegacy`, `tomb` | Khớp |
| CSX-LGC-005 | — (`buildReincarnationTransferPlan` không có trong runtime) | Thiếu |
