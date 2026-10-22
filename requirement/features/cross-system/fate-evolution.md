# Cross-system — Tiến hóa Mệnh Số (SYS-12)

## Mục đích

Biến Cường Hóa +1…+5 thành hành trình có đích: Mệnh đã đầu tư tối đa, đạt Cộng Minh và vượt thí luyện sẽ tiến hóa thành dạng riêng của instance đó (quan hệ lên stage 4 — **Nhân Mệnh Hợp Nhất**). Không sinh Fate ID mới, không nhân bản catalog. Luật Mệnh nền (cường hóa, quan hệ, kho, combo): [fate](../fate/README.md).

## Dữ liệu & trạng thái

```js
player.fateEvolutions = { [fateId]: { status: "trial"|"ready"|"evolved", trialStartedDay, seed,
  candidateBranchIds: [], branchId, evolvedAtDay, sourceEnhancementLevel: 5, version: 1 } }
FateEvolutionTemplate { id, namePattern,
  eligibility: { signs: [], grades: [], elements: [], pathTags: [] },
  branchType: "thuan_dien"|"nghich_dien"|"quy_nguyen",
  effectOps: [], scoreDelta, persistentCosts: [], ritualCost: { fateEssence, merit, san },
  trialTags: [], descriptionPattern }
```

API: `fateEvolutionEligibility`, `startFateEvolutionTrial`, `recordFateEvolutionProgress`, `fateEvolutionCandidates`, `fateEvolutionPreview`, `evolveFate`, `applyFateEvolutionOps`.

## Rules

### Điều kiện và thí luyện

| ID | Rule |
|---|---|
| CSX-FEV-001 | Đủ điều kiện khi đồng thời: sở hữu và đang kích hoạt; `fateEnhancementLevel === 5`; quan hệ Cộng Minh (`stage === 3`, `resonanceUnlocked`); tương hợp Con Đường ≥ 8 cho Thuận Diễn (nhánh khác theo template); chưa tiến hóa và không trong transaction chờ; người chơi không Tha Hóa/mất trí và SAN ≥ 20. Đủ điều kiện chỉ mở **Mệnh Kiếp Thí Luyện**, không tự tiến hóa. |
| CSX-FEV-002 | Tiến độ dùng `fateRelationshipRecord`: thắng encounter `elite` khi Mệnh active và outcome phù hợp → `eliteTrials +1` (tính tối đa 2); chọn option quest/event có tag trùng `fatePathAffinity`, `element` hoặc `sign` → `alignedChoices +1` (tối đa 3). Hoàn thành thí luyện khi `eliteTrials ≥ 2` **hoặc** `alignedChoices ≥ 3`. Counter chỉ tăng khi thí luyện active, event có `uniqueKey` chống farm. |
| CSX-FEV-003 | Resolver chọn hai nhánh ứng viên bằng seed và đặc tính Mệnh; luôn có ít nhất một nhánh an toàn. Không ghi nhánh trực tiếp vào từng Fate record trừ Mệnh đặc biệt có tiến hóa authored. Mỗi tiến hóa chọn một nhánh, không respec. |

### Ba nhánh

| ID | Nhánh | Rule |
|---|---|---|
| CSX-FEV-010 | Thuận Diễn — Hợp Đạo | Cần tương hợp ≥ 8; `scoreDelta +2`; +10% các effect số dương khi Con Đường hiện tại vẫn tương hợp; đổi path và tương hợp < 8 thì bonus ngủ, không bị xóa; không thêm Tà Nhiễm. |
| CSX-FEV-011 | Nghịch Diễn — Đoạt Mệnh | Xuất hiện cho Hung Mệnh, Mệnh có tag cấm hoặc người chơi Tà Nhiễm ≥ 30; `scoreDelta +3`, +18% effect dương chính; chi phí vĩnh viễn `fateDebt +1` (một lần) và mỗi lần Đột Phá thành công khi Mệnh active +2 Tà Nhiễm. UI cảnh báo và xác nhận. |
| CSX-FEV-012 | Quy Nguyên — Hóa Linh | `scoreDelta 0`; +5% effect dương và giảm 25% độ lớn một effect âm được template cho phép; không có effect âm hợp lệ thì thay bằng +5% kháng SAN/tiện ích tu luyện trong whitelist, không tạo key lạ. |

### Nghi thức và hiệu ứng

| ID | Rule |
|---|---|
| CSX-FEV-020 | Chi phí theo grade rank 1–8: Mệnh Tinh Hoa `5 + 2 × gradeRank` (dùng field `state.fateExcessEssence`, không tạo tiền tệ mới); Công Đức `10 + 5 × gradeRank`; SAN tức thời 10. Không đòi thêm Mệnh cùng phẩm. Validate đủ chi phí, thí luyện và slot trước khi trừ; thất bại thì rollback. |
| CSX-FEV-021 | Pipeline: effect gốc → `enhancedFateEffects` (+0…+5 và hệ số quan hệ) → `applyFateEvolutionOps` → `computeRelationshipEffects`/combo → `computeStats`. `computeFate()` cộng `scoreDelta` đúng một lần cho Mệnh active; Mệnh trong kho không tính vào stats/score. |
| CSX-FEV-022 | Tiến hóa thuộc character + Fate ID duy nhất; persist qua `fate.evolutions` và `fate.relationships` (DATA-SAV-010); không dùng `fateInstances.relationshipStage` làm nguồn thứ hai. |

### Tương tác hệ Mệnh

| ID | Rule |
|---|---|
| CSX-FEV-030 | `upgradeFate` vẫn trần +5; sau lần +5 ghi thông báo đủ/thiếu điều kiện tiến hóa. Dưỡng Mệnh giữ stage 0→3; tiến hóa là đường duy nhất lên stage 4. |
| CSX-FEV-031 | Kho Mệnh: tiến hóa giữ khi tháo/lắp, hiệu ứng ngủ khi không active. Mệnh đã tiến hóa không mặc định làm nguyên liệu dung hợp/nâng cấp; muốn phá phải dùng "Giải Thể Tiến Hóa" xác nhận hai lần. |
| CSX-FEV-032 | Pact/combo vẫn dùng Fate ID gốc; tiến hóa chỉ sửa effect sau hệ số quan hệ, không đổi recipe ID. |
| CSX-FEV-033 | Luân Hồi: Mệnh tiến hóa là Mệnh được giữ theo luật hiện hành thì giữ tiến hóa; không được giữ thì mất; preview transfer nói rõ. Nghịch Diễn dùng `fateDebt`/Tà Nhiễm hiện có, không tạo stat mới. |
| CSX-FEV-034 | UI: chi tiết Mệnh hiện `+5`, stage quan hệ, thanh thí luyện; nút "Mở Mệnh Kiếp" chỉ hiện khi +5, disabled reason liệt kê Cộng Minh/SAN/active; modal ứng viên so sánh effect trước/sau, score, chi phí, nhược điểm vĩnh viễn; Mệnh tiến hóa có hậu tố danh xưng và sigil nhỏ, tên Fate gốc không đổi. Log ghi mở thí luyện, mốc tiến độ, hoàn thành; không log action không tiến bộ. |
| CSX-FEV-035 | Migration: save v12 → `fateEvolutions = {}`; Mệnh đã +5/stage 3 không tự tiến hóa, chỉ đánh dấu eligibility, không trừ chi phí; không suy diễn stage 4 cho save cũ; nhánh/template lạ → `ready`, chọn lại, giữ đầu tư. |

## Acceptance

- +4 không đủ điều kiện; +5 stage 2 không đủ; +5/stage 3/active đủ.
- Counter chỉ tăng từ event hợp lệ duy nhất, dừng đúng ngưỡng; preview bằng runtime cho cả ba nhánh; chi phí rollback khi lỗi.
- Mệnh tiến hóa trong kho không tăng stats/score; đổi path làm Thuận Diễn ngủ/thức đúng; Nghịch Diễn tăng `fateDebt` một lần và Tà Nhiễm đúng lúc Đột Phá; dung hợp/nâng cấp không tiêu Mệnh tiến hóa ngoài ý muốn; Luân Hồi giữ/mất đúng; serialize v13 và migrate v12 pass.
- Gate: `verify_review_batches.js`, `verify_game.js`, `verify_behavior_first_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-FEV-001 | engine.js/expansion.js:`fateEvolutionEligibility` | Khớp |
| CSX-FEV-002 | expansion.js:`startFateEvolutionTrial`, `recordFateEvolutionProgress`; engine.js `eliteTrials`/`alignedChoices` | Khớp |
| CSX-FEV-003 | expansion.js:`fateEvolutionCandidates`; data/expansion_data.js `thuan_dien`/`nghich_dien`/`quy_nguyen` | Khớp |
| CSX-FEV-020/021 | expansion.js:`evolveFate`; engine.js:`applyFateEvolutionOps`, `fateExcessEssence` | Khớp |
| CSX-FEV-034 | ui.js: "Mệnh Số Tiến Hóa" panel, `fateEvolutionPreview` | Khớp |
