# Mệnh Số — Action nâng cao

## Mục đích

Bốn action vận hành trên instance Mệnh đã sở hữu: Nghịch Mệnh, Trấn Mệnh, Thiên Cơ, Mệnh Đổi (đổi nhánh Tiến Hóa của Mệnh đã Tiến Hóa). Không sửa catalog, không cộng lại enhancement/relationship/evolution.

## Dữ liệu & trạng thái

```js
player.fateAdvancedActions = {
  [fateId]: {
    nghichMenh: { uses, effectSource: "advanced_fate_action", maxBonus: 0.15 },
    tranMenh:   { uses, untilTurn, effectSource },
    menhDoi:    {
      uses,                 // số lần Mệnh Đổi đã commit, 0…3 (không tính lần Tiến Hóa đầu)
      branchId,             // phản chiếu fateEvolutions[fateId].branchId sau lần đổi gần nhất (null khi uses = 0)
      lastChangedDay,       // ngày game của lần đổi gần nhất (null khi uses = 0)
      history: [{ day, turn, fromBranchId, toBranchId, cost: { essence, merit, san }, fateDebtDelta, actionId }],  // giữ 10 gần nhất
      receipts: { [actionId]: { actionId, fromBranchId, toBranchId, day, turn, cost } },                          // giữ 8 gần nhất
      effectSource: "advanced_fate_action"
    }
  },
  _global: { thienCo: { uses, lastTurn, cooldownUntil, effectSource } }
}
player.fateDefiance[fateId]            // mirror số lần Nghịch Mệnh
player.suppressedFates[fateId] = { untilTurn }
player.heavenlyOmenCooldownUntil
```

## Rules

### FATE-ADV-001 Catalog policy duy nhất
`fateAdvancedActionCatalog()` (bản sao của `FATE_ADVANCED_ACTION_CATALOG`) là nguồn duy nhất cho scope, cost, giới hạn:
| Action | Scope | Cost | Giới hạn/điều kiện | Kết quả |
|---|---|---|---|---|
| `nghichMenh` Nghịch Mệnh | fate | 15 SAN | Mệnh active, Hung; tối đa 5 lần trọn đời instance | mỗi lần +0,03 `allStatMult` (tối đa 0,15) |
| `tranMenh` Trấn Mệnh | fate | 8 SAN | Mệnh active; không đang bị Trấn | vô hiệu Mệnh 3 turn |
| `thienCo` Thiên Cơ | global | 5 SAN | hết cooldown 12 turn | báo trạng thái đột phá |
| `menhDoi` Mệnh Đổi | fate | Tinh Hoa Dư `(5 + 2×tier) × (1 + uses)`, Công Đức `(10 + 5×tier) × (1 + uses)`, SAN 10 (không nhân) | điều kiện FATE-ADV-009; tối đa 3 lần/instance; hồi 30 ngày game | đổi nhánh Tiến Hóa (FATE-ADV-007) |

`tier` = hạng grade (phan 1, linh 2, hoang 3, huyen 4, dia 5, thien 6, thanh 7, tien 8); `uses` = `menhDoi.uses` hiện tại. Catalog `menhDoi`: `{ id, scope: "fate", sanCost: 10, effectSource, requiresRelationshipStage: 4, requiresEnhancement: 5, maxUses: 3, cooldownDays: 30 }`.

### FATE-ADV-002 Namespace
Action theo Mệnh nằm dưới `fateAdvancedActions[fateId]`; `thienCo` chỉ nằm dưới `_global`. Mọi record có `effectSource: "advanced_fate_action"`. Validator từ chối: scope không phải Fate ID đã biết hoặc `_global`, action sai scope, `uses` âm/không nguyên/vượt `maxUses`, `effectSource` khác, `untilTurn < 0`, `branchId` không phải chuỗi.

### FATE-ADV-003 Nghịch Mệnh
`defyFate(state, fateId)` kiểm tra theo thứ tự: Mệnh active → Hung → bộ đếm hợp lệ (nguyên, 0…5) → `< 5` (lần thứ 6 trả `MAX_USES`, không trừ SAN) → SAN ≥ 15. Thành công: −15 SAN, `fateDefiance[id] +1`, `nghichMenh.uses = fateDefiance[id]`. Effect chỉ đọc `nghichMenh.uses` (min 5) qua `fateAdvancedEffectBreakdown`; không đọc thêm `fateDefiance`. Không reset theo ngày. Không đổi effect Hung gốc.

### FATE-ADV-004 Breakdown advanced
`fateAdvancedEffectBreakdown(character, fateId?)` trả `{ allStatMult, defianceUses, suppressed, actions }`. `computeStats` chỉ cộng `allStatMult` của Mệnh active không bị Trấn.

### FATE-ADV-005 Trấn Mệnh
`suppressFate(state, fateId)`: đang bị Trấn → trả `cooldownUntil`, không trừ SAN; Mệnh active; SAN ≥ 8. Thành công: −8 SAN, `suppressedFates[id].untilTurn = turn + 3` (chỉ đọc từ catalog), ghi record. Trong thời hạn, Mệnh bị bỏ khỏi `computeStats`, `computeFate`, `computeLifespan` và Nghịch Mệnh; không xóa Mệnh, quan hệ hay enhancement; hết hạn tự phục hồi qua cùng pipeline.

### FATE-ADV-006 Thiên Cơ
`heavenlyOmen(state)`: còn cooldown → blocker; SAN ≥ 5. Thành công: −5 SAN, `cooldownUntil = turn + 12`, trả "Cửa đột phá đã mở" hoặc tối đa 3 blocker đột phá đọc từ state thật. Không tiêu RNG, không thay đổi state nào khác.

### FATE-ADV-007 Mệnh Đổi — mục đích và phân biệt
Mệnh Đổi = **đổi nhánh Tiến Hóa** của một Mệnh đã Tiến Hóa (bậc 4). Tiến Hóa là lựa chọn nhánh lần đầu; Mệnh Đổi cho phép sửa lựa chọn đó có giá và có giới hạn. Mệnh Đổi **không** đổi `id`, grade, sign, tag hay effect gốc của Mệnh trong catalog.
| Thao tác | Đối tượng | Kết quả | Bậc quan hệ |
|---|---|---|---|
| Cường Hóa ([FATE-UPG-001](upgrade-replace-ritual.md)) | Mệnh + 1 Mệnh cùng grade trong kho | `enhancement +1` | giữ |
| Dung Hợp (FATE-UPG-004) | ≥ 2 Mệnh trong kho | Mệnh mới theo công thức | Mệnh mới bắt đầu bậc 0 |
| Tiến Hóa (FATE-UPG-006/007) | Mệnh +5, bậc 3, trial `ready` | chọn nhánh lần đầu | 3 → 4 |
| **Mệnh Đổi** | Mệnh đã `evolved`, bậc 4 | đổi sang nhánh khác của cùng Mệnh | giữ 4 |

`transformFate(state, fateId, branchId?, { confirmed, actionId })` (engine, điểm vào duy nhất; expansion command `fate_transform`) thực thi trên module expansion (`fateRebranchPreview`, `rebranchFateEvolution`); **không** gọi `evolveFate` (Tiến Hóa chỉ chạy ở trial `ready`).
1. Không có `branchId` → preview thuần (không đổi state, không RNG): `{ success: true, preview: true, fateId, currentBranchId, candidates[], costs, uses, maxUses, readyDay }`; mỗi ứng viên `{ branchId, name, description, dangerous, scoreBefore, scoreAfter, effectsBefore, effectsAfter, fateDebtDelta }` lấy từ cùng pipeline commit (`fateEvolutionPreview` mô phỏng nhánh mới trên bản sao; `afterEffects` phải deep-equal effect sau commit, FATE-UPG-008). Có blocker → `{ success: false, blockers[], costs }`.
2. Có `branchId` → kiểm FATE-ADV-009 + nhánh ∈ ứng viên → idempotency (FATE-ADV-012) → xác nhận nhánh nguy hiểm → commit nguyên tử (FATE-ADV-015).
3. Thất bại trả `{ success: false, blockers[] | reason }`; thành công trả `{ success: true, fromBranchId, toBranchId, scoreBefore, scoreAfter, cost, fateDebtDelta, receipt }`.
Không sinh biến thể ngoài `fateEvolutionBranches`; chưa nạp expansion → blocker "Chưa nạp nhánh biến thể canonical."

### FATE-ADV-008 Kiểm tra trước khi trừ
Mọi action kiểm tra blocker trước khi trừ tài nguyên; history ghi sau commit thành công; narrative không quyết định gameplay.

### FATE-ADV-009 Điều kiện Mệnh Đổi
Mọi điều kiện phải đạt; thiếu → trả **toàn bộ** blocker theo thứ tự bảng, không trừ gì:
| # | Điều kiện | Blocker (hiển thị) |
|---|---|---|
| 1 | Expansion đã nạp | Chưa nạp nhánh biến thể canonical. |
| 2 | Mệnh ∈ `player.fates` (Ấn ký); Mệnh Kho không đủ | Mệnh phải đang kích hoạt. |
| 3 | Không bị Trấn Mệnh (`suppressedFates[id].untilTurn ≤ turn`) | Mệnh đang bị Trấn Mệnh. |
| 4 | `fateEvolutions[id].status === "evolved"`, `branchId` hợp lệ, `stage === 4` | Mệnh chưa Tiến Hóa; hãy hoàn tất Mệnh Kiếp trước. |
| 5 | `fateEnhancements[id] ≥ 5` | Cần Cường Hóa Mệnh +5. |
| 6 | `menhDoi.uses < 3` | Đã dùng hết 3 lần Mệnh Đổi của Mệnh này. |
| 7 | `ngày hiện tại − max(evolvedAtDay, lastChangedDay) ≥ 30` | Cần chờ thêm `N` ngày game. |
| 8 | Không có địch sống (`aliveEnemies(state).length === 0`) | Không thể Mệnh Đổi khi đang giao chiến. |
| 9 | `fateExcessEssence ≥ costs.essence`, `merit ≥ costs.merit`, `san ≥ 20` (trừ 10, giữ SAN ≥ 10 để không kích hoạt Mất Trí) | Thiếu Tinh Hoa Dư / Công Đức (kèm cần/có) · Cần ít nhất 20 Thanh Tỉnh. |
| 10 | Có ≥ 1 ứng viên (FATE-ADV-011) | Không có nhánh nào khác khả dụng. |

Nối với Tiến Hóa: bậc 4 chỉ đạt qua commit Tiến Hóa (FATE-REL-006, FATE-UPG-007). Mệnh Đổi chỉ chạy **sau** bước đó nên không có phụ thuộc vòng; đường mở khóa đầy đủ: bậc 0→1→2 (FATE-REL-004/005) → Cộng Minh (bậc 3) → Cường Hóa +5 → Mệnh Kiếp `ready` → Tiến Hóa (bậc 4) → Mệnh Đổi.

### FATE-ADV-010 Save
Serialize lưu `fate.advancedActions` và `fateRuntime.{ defiance, suppressed, omenCooldownUntil }`; deserialize khôi phục nguyên namespace và số lần dùng, gồm `menhDoi.{ uses, branchId, lastChangedDay, history, receipts }`.

### FATE-ADV-015 Commit nguyên tử của Mệnh Đổi
Sau khi qua FATE-ADV-009/011/012: snapshot (`fateEvolutions[id]`, `fateRelationships[id]`, `fateAdvancedActions[id].menhDoi`, `fateExcessEssence` cả hai bản, `merit`, `san`, `fateDebt`, history) → trừ chi phí → ghi → `updateDerived` → log; ném lỗi ở bất kỳ bước nào → khôi phục snapshot, trả `{ success: false, reason }`.
| Thay đổi | Giá trị |
|---|---|
| Chi phí | `costs.essence` trừ **cả** `state.fateExcessEssence` và `state.player.fateExcessEssence` (luôn bằng nhau); `merit −= costs.merit`; `san −= 10` (trừ trực tiếp, sàn 0) |
| `fateEvolutions[id].branchId` | = nhánh mới; thêm `lastRebranchDay`; `status`, `evolvedAtDay`, `candidateBranchIds`, `sourceEnhancementLevel`, `progressKeys` giữ nguyên |
| Effect / điểm | tính lại qua `applyFateEvolutionOps` + `fateEvolutionScoreDelta` của nhánh mới (đúng một nhánh áp, không cộng dồn nhánh cũ): `thuan_dien` +2, `nghich_dien` +3, `quy_nguyen` 0 |
| `fateDebt` | `+= branch.fateDebt` (nghich_dien = 1) mỗi lần **vào** nhánh đó; rời nhánh **không** hoàn Mệnh Nợ |
| Phạt đột phá | `corruptionOnBreakthrough` đọc theo `branchId` hiện tại (nghich_dien +2/lần đột phá); rời nhánh thì ngừng |
| `menhDoi` | `uses +1`, `branchId`, `lastChangedDay = ngày hiện tại`, thêm `history`, `receipts` (cắt 10/8 bản ghi cuối) |
| Giữ nguyên | `fateInstances[id]` (nguồn, `acquiredAtTurn`), vị trí ô Ấn ký, `fateEnhancements` (+5), toàn bộ `fateRelationships[id]` (bậc 4, `points`, `resonanceEffect`, các history), `nghichMenh`/`tranMenh`, `fateDefiance`, catalog (id/grade/sign/tag/effect gốc) |

### FATE-ADV-011 Ứng viên nhánh
Tập ứng viên = `fateEvolutionBranches` loại nhánh hiện tại, lọc: `requiresCompatibility ≤ fateCompatibility(pathId, fate)`; `nghich_dien` chỉ khi Mệnh Hung hoặc `corruptionRating ≥ 30`. Không giới hạn 2 như lúc mở trial (nhánh mới không cần thuộc `candidateBranchIds`); `quy_nguyen` luôn khả dụng nếu không phải nhánh hiện tại. Nhánh `dangerous` cần `confirmed: true` (thiếu → `{ success: false, requiresConfirmation: true, reason: "Nghịch Diễn cần xác nhận phản phệ." }`, không trừ gì).

### FATE-ADV-012 Idempotency và giới hạn
- `actionId` (chuỗi) bắt buộc khi commit; UI sinh một lần khi mở modal (`menhdoi:<fateId>:<uses>:<turn>`) và giữ qua double-click.
- Replay cùng `actionId` còn trong `receipts` → `{ success: true, duplicate: true, receipt }`, không trừ gì, không ghi history lần hai. Cùng `actionId` nhưng `branchId` khác → `{ success: false, reason: "Action ID đã dùng cho nhánh khác." }`.
- Tối đa 3 lần/instance (`maxUses` trong catalog); cooldown 30 ngày game giữa hai lần và giữa Tiến Hóa → lần đầu. Chi phí tăng tuyến tính theo `uses` (lần 1 ×1, lần 2 ×2, lần 3 ×3 cho Tinh Hoa Dư và Công Đức).
- Mệnh Đổi không có roll; kết quả deterministic.

### FATE-ADV-013 Tương tác
| Tình huống | Hành vi |
|---|---|
| Mệnh bị tháo về Mệnh Kho | Bị chặn (blocker #2); sau khi trang bị lại, `menhDoi` và nhánh giữ nguyên |
| Đang Trấn Mệnh | Bị chặn (blocker #3); hết hạn thì dùng được |
| Nghịch Mệnh | Độc lập: `nghichMenh.uses` và `allStatMult` giữ nguyên qua Mệnh Đổi |
| Buông Mệnh / hiến tế | Xóa instance kéo theo xóa `fateAdvancedActions[id]` và `fateEvolutions[id]` (không còn `menhDoi`) |
| Nhánh biến mất khỏi catalog khi load | FATE-UPG-009 hạ về `ready` kèm `menhDoi.branchId = null`; Mệnh Đổi bị chặn tới khi Tiến Hóa lại |
| Validator | Báo lỗi khi: `uses` > 3; `branchId` không có trong catalog; `uses ≥ 1` mà `menhDoi.branchId ≠ fateEvolutions[id].branchId`; `lastChangedDay` không nguyên ≥ 0; `history`/`receipts` sai shape |

### FATE-ADV-014 UI Mệnh Đổi (preview → xác nhận → kết quả)
- Nút **Mệnh Đổi** trên thẻ Mệnh active khi `status === "evolved"`; blocker FATE-ADV-009 hiển thị cạnh nút (disabled), không dùng `alert`/`confirm`.
- Bấm nút → overlay **"Mệnh Đổi · {tên Mệnh}"** (qua `enqueueAction`, gọi `transformFate(state, id)` để lấy preview):
  1. Khối "Nhánh hiện tại": tên, mô tả, điểm Mệnh hiện tại.
  2. Danh sách ứng viên dạng chọn một (radio): tên nhánh, mô tả, "Điểm Mệnh {trước} → {sau}", bảng hiệu ứng trước → sau, nhãn **Nguy hiểm** cho nhánh `dangerous` (kèm "Mệnh Nợ +1, +2 Tà Nhiễm mỗi lần Đột Phá").
  3. Khối "Chi phí lần này": `{essence} Tinh Hoa Dư · {merit} Công Đức · 10 Thanh Tỉnh` kèm "hiện có"; "Lần đổi {uses+1}/3 · Lần sau tốn ×{uses+2}".
  4. Nút **Xác nhận Mệnh Đổi** (disabled tới khi chọn nhánh; nhánh nguy hiểm thêm ô tích "Ta hiểu và chấp nhận phản phệ"), nút **Hủy** (đóng, không đổi state).
- Xác nhận → `transformFate(state, id, branchId, { confirmed, actionId })`; thành công đổi overlay sang **kết quả**: "Nhánh: {cũ} → {mới} · Điểm Mệnh {a} → {b} · Chi phí đã trừ · Còn {3−uses} lần · Có thể đổi lại sau {30} ngày"; thất bại hiện blocker, giữ overlay mở.
- Log (`type: "sys"`): `✦ Mệnh Đổi: {Mệnh} đổi nhánh {cũ} → {mới} · Điểm Mệnh {a} → {b} · Tinh Hoa Dư −{e}, Công Đức −{m}, Thanh Tỉnh −10.`; replay: `Mệnh Đổi đã được ghi nhận trước đó.`

## Acceptance

`tools/verify_review_batches.js`: đủ 4 action tạo đúng namespace; Nghịch Mệnh lần 6 bị chặn và effect không vượt 0,15; Trấn Mệnh hết 3 turn thì effect phục hồi và dùng lại khi còn hiệu lực bị chặn không trừ SAN; Thiên Cơ bị chặn trong cooldown; `validateExpansionState` báo lỗi namespace/`effectSource` sai; save round-trip giữ nguyên.

Mệnh Đổi (Mệnh hạng Hoàng `tier 3`, +5, bậc 4, `evolved` nhánh `thuan_dien`, `evolvedAtDay = 100`, ngày hiện tại 140, `fateExcessEssence = 30` ở cả hai bản, Công Đức 40, SAN 50, `fateDebt = 0`, Corruption 10, Mệnh Cát):
| ID | Given / When | Then |
|---|---|---|
| MD-01 | Preview không `branchId` | `candidates = [quy_nguyen]` (nghich_dien bị loại: Mệnh Cát, Corruption < 30); `costs = { essence: 11, merit: 25, san: 10 }`; state không đổi (deep-equal trước/sau) |
| MD-02 | Commit `quy_nguyen`, `actionId = A1` | tài nguyên: Tinh Hoa Dư 19 (cả hai bản), Công Đức 15, SAN 40; `branchId = quy_nguyen`; `scoreDelta` +2 → 0 nên `computeFate.total` giảm 2; `uses = 1`, `lastChangedDay = 140`; stage vẫn 4, `evolvedAtDay = 100`, `enhancement = 5`, `fateRelationships[id]` deep-equal trước |
| MD-03 | Replay `A1` | `duplicate: true`; tài nguyên và `uses` không đổi |
| MD-04 | Ngày 141, commit `thuan_dien` | blocker "Cần chờ thêm 29 ngày game"; không trừ gì |
| MD-05 | Ngày 170, `essence = 30`, commit `thuan_dien` | chi phí ×2 = `22` Tinh Hoa Dư, `50` Công Đức → thiếu Công Đức (có 15): blocker "Thiếu Công Đức (cần 50, có 15)", state không đổi |
| MD-06 | Mệnh Hung, Corruption 35, đổi sang `nghich_dien` không `confirmed` | `requiresConfirmation: true`, không trừ; với `confirmed: true`: `fateDebt +1`, `scoreDelta` +3 |
| MD-07 | Đổi rời `nghich_dien` | `fateDebt` giữ nguyên; `corruptionOnBreakthrough` ngừng áp |
| MD-08 | `uses = 3` | blocker "Đã dùng hết 3 lần Mệnh Đổi của Mệnh này." |
| MD-09 | Mệnh ở Mệnh Kho, hoặc bậc 3 (`ready` chưa Tiến Hóa), hoặc đang bị Trấn Mệnh | trả blocker tương ứng; không đổi state |
| MD-10 | Save → load giữa chừng | `menhDoi` (uses, history, receipts) và `fateEvolutions[id].branchId` giữ nguyên; replay `A1` vẫn `duplicate` |
| MD-11 | Ném lỗi giữa commit (stub `updateDerived`) | rollback: tài nguyên, branchId, `menhDoi`, `fateDebt` về snapshot |

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-ADV-001 | `js/engine.js:FATE_ADVANCED_ACTION_CATALOG`, `fateAdvancedActionCatalog` | Lệch — `menhDoi` thiếu `maxUses: 3`, `cooldownDays: 30`, `costEscalation`; còn `delegatesTo: "fateEvolution"` (bỏ) |
| FATE-ADV-002 | `js/engine.js:validateFateAdvancedActionState`, `fateAdvancedActionRecord` | Khớp (cần thêm kiểm `menhDoi` theo FATE-ADV-013) |
| FATE-ADV-003 | `js/engine.js:defyFate` | Khớp |
| FATE-ADV-004 | `js/engine.js:fateAdvancedEffectBreakdown`, `computeStats` | Khớp |
| FATE-ADV-005 | `js/engine.js:suppressFate`, `computeFate`, `computeLifespan` | Khớp |
| FATE-ADV-006 | `js/engine.js:heavenlyOmen` | Khớp |
| FATE-ADV-007, 009, 011, 012 | `js/engine.js:transformFate` (đòi `stage ≥ 4` rồi gọi `evolveFate` — luôn thất bại vì `evolveFate` chỉ nhận `ready`); thiếu `js/expansion.js:fateRebranchPreview`, `rebranchFateEvolution` | Lệch — cần viết hai hàm expansion, `transformFate` ủy quyền cho chúng, thêm `actionId`, `receipts`, cooldown, `maxUses`, loại nhánh hiện tại; chi phí dùng `GRADE_RANK` × `(1 + uses)` |
| FATE-ADV-010 | `js/engine.js:toCanonicalCharacter`, `fromCanonicalCharacter` | Khớp (cần giữ `lastChangedDay`, `history`, `receipts`) |
| FATE-ADV-015 | `js/expansion.js:rebranchFateEvolution`; `evolveFate` hiện chỉ trừ `state.fateExcessEssence` (không trừ `player.fateExcessEssence`) | Thiếu / Lệch (sửa cả `evolveFate` trừ hai bản) |
| FATE-ADV-013 | `js/engine.js:validateFateAdvancedActionState`, `releaseStagnantFate`; `js/expansion.js` (normalize `fateEvolutions` khi load) | Thiếu |
| FATE-ADV-014 | `js/main.js` (`data-fate-transform`: hiện chọn `candidates[0]` + `confirm()`); `js/ui.js:fateAdvancedActions` (hiện nút khi `stage ≥ 4 && level ≥ 5`) | Lệch — cần overlay `renderFateTransformModal`, nút chỉ khi `evolved`, bỏ `alert`/`confirm` |
