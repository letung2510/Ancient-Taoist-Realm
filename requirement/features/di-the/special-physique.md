# Dị Thể — Catalog, tiếp nhận & giai đoạn

## Mục đích

Dị Thể là bản chất thân thể đặc biệt (khác Linh Căn — kênh Ngũ Hành): mở qua dấu mốc gameplay, tiếp nhận có giá, tăng giai đoạn theo tiến độ, cung cấp modifier và metadata kết cục/thế lực. Không roll lúc tạo nhân vật.

## Dữ liệu & trạng thái

```js
state.specialPhysiqueState = {
  schemaVersion: 2, activeId: null,
  candidates: { [id]: { id, progress, discoveredDay, stage: 1 } },
  progress: { [trigger]: number }, progressEvents: [{ eventId, trigger, day, amount }],
  history: [{ id, trigger, day, cost, stage, result: { stage, branch }, stageDay }],   // ≤ 50, ledger claim
  rejectedIds: []                                                                   // ≤ 50
}
state.player.specialPhysique   // mirror của activeId
```
Mỗi entry catalog: `id`, `name`, `trigger`, `progressThreshold` (1–10), `maxStage`, `branch`, `benefit`, `stageEffects[maxStage]`, `endingTags`, `factionAffinity` (−10…10), `cost`, `exclusions { paths: [], professions: [] }`.

## Rules

### DT-NS-001 Namespace riêng
Dị Thể là `specialPhysiqueState`, độc lập `pathState` (Con Đường), `professionState` (Nghề) và `discoveries` (Dị Chí/tri thức). UI dùng nhãn "Dị Thể"; không dùng "Dị Chí" cho trạng thái thân thể. Resolver canonical đọc `specialPhysiqueState`, field legacy chỉ được migrate.

### DT-CAT-001 Catalog
| `id` | Tên | `trigger` (ngưỡng) | Lợi ích stage 1 → 3 | Cái giá khi tiếp nhận |
|---|---|---|---|---|
| `thanh_the` | Thánh Thể | `mercy_chain` (3) | Kháng Corruption 0,30 → 0,45 + hồi SAN 1 → 0,60 + 2 | Tà Thần chú ý (`taintedAttention`); không tiếp nhận được nếu đã bị chú ý |
| `hon_don_the` | Hỗn Độn Thể | `five_elements` (5) | Không phạt Ngũ Hành nội bộ; + cộng hưởng Mệnh 0,05 → 0,10 + kháng Corruption 0,10 | Tích Đạo Tâm ×0,5 |
| `van_doc_the` | Vạn Độc Thể | `eldritch_beast_survival` (3) | Kháng độc 0,50 → 0,70 (+Corruption 0,05) → 0,90 (+0,10, ẩn thân 0,05) | Chặn hồi phục (`healingBlocked`) |
| `cuu_u_the` | Cửu U Thể | `vo_he_oath` (1) | Ẩn thân 0,20 → 0,35 (+kháng Corruption 0,05) → 0,50 (+0,12, cộng hưởng 0,05) | Corruption +1 |
| `bat_tu_the` | Bất Tử Thể | `lifespan_break` (1) | Hồi sinh 1 lần; + kháng Corruption 0,05 → 0,12 | Thọ Nguyên −12 (phải còn > 12) |
| `thien_sinh_dao_the` | Thiên Sinh Đạo Thể | `server_lore_claim` (1) | Cộng hưởng Mệnh 0,15 → 0,25 (+0,05) → 0,35 (+0,10, hồi SAN 1) | Độc bản mỗi save (`uniqueClaim`) |
| `qing_luan_bone` | Thanh Loan Linh Cốt | `survive_storms` (4) | Kháng độc 0,15 → 0,30 + ẩn thân 0,05 → 0,45 + 0,10 | 12 SAN |
| `ming_yang_spirit_root` | Minh Dương Linh Căn | `restore_san` (4) | Hồi SAN 1 → 1,5 + cộng hưởng 0,05 → 2 + 0,10 | 12 SAN |
| `xuan_ming_scale` | Huyền Minh Lân Giáp | `survive_corruption` (5) | Kháng Corruption 0,15 → 0,30 → 0,45 + hồi sinh 1 lần | 12 SAN |

Key hiệu ứng hợp lệ: `corruptionResist`, `poisonResist`, `fateResonance`, `stealth`, `elementPenalty`, `sanRecoveryFlat`, `reviveOnce`; các tỷ lệ nằm trong [0, 1]. Mỗi entry có `branch`, `endingTags`, `factionAffinity` riêng (ví dụ `thanh_the` → `thien_huyen_tong +4`). Số liệu là giá trị cân bằng ban đầu, tinh chỉnh qua playtest.

### DT-PRG-001 Ghi tiến độ
`recordSpecialPhysiqueProgress(state, { type|trigger, amount = 1, eventId, success })`: trigger phải có trong catalog; `eventId` trùng → trả `duplicate`, không cộng (khóa sự kiện mỗi ngày game chống farm); `success === false` không cộng; `amount` âm/không hữu hạn bị từ chối. Ledger tiến độ (`progress`, `progressEvents`) tách khỏi ledger claim (`history`).

### DT-PRG-002 Ứng viên
Tiến độ trigger ≥ `progressThreshold`, chưa có Dị Thể active và id không nằm trong `rejectedIds` → thêm vào `candidates`. Candidate, rejected, active là ba trạng thái khác nhau và serialize được.

### DT-CLM-001 Tiếp nhận nguyên tử
`claimSpecialPhysique(state, id)`: kiểm slot active trống, id là candidate, đủ mọi cost (SAN, Thọ Nguyên, điều kiện chú ý Tà Thần, độc bản) trước khi trừ; bị từ chối thì không tiêu hao gì. Thành công: trừ cost, `activeId = id`, ghi `history` (stage 1). Mỗi nhân vật chỉ một `activeId`; kích hoạt cùng Dị Thể hai lần không cộng modifier hai lần.

### DT-CLM-002 Từ chối
`rejectSpecialPhysique(state, id)` xóa candidate, đưa vào `rejectedIds` (không trùng, ≤ 50); id bị từ chối không trở lại candidate.

### DT-STG-001 Giai đoạn
Dị Thể active tăng stage khi tiến độ trigger của nó ≥ `progressThreshold × (stage + 1)`, tới `maxStage`; ghi `stage`, `stageDay` vào bản ghi history hiện có, không tạo instance mới. Chỉ `stageEffects[stage − 1]` của stage hiện tại được áp dụng.

### DT-MOD-001 Modifier qua một cổng
Hiệu ứng chỉ đi qua `specialPhysiqueModifiers(state)`; Fate/Con Đường/Nghề không cộng trực tiếp lần hai.

### DT-OUT-001 Outcome projection
`specialPhysiqueOutcome(state)` là read model: `activeId`, `stage`, `maxStage`, `branch`, `endingTags`, `factionAffinity` scale theo `stage / maxStage`. Chỉ đọc; `endingTags`/`factionAffinity` là metadata cho resolver kết cục/thế lực, không tự đổi faction. UI hiển thị projection, không sửa history.

### DT-EXC-001 Không tự khóa
Dị Thể mặc định là modifier, không khóa Nghề chính, Nghề Ẩn hay Con Đường, không sửa `pathId`. Chỉ entry có `exclusions.paths`/`exclusions.professions` explicit mới được chặn lựa chọn và blocker phải trả reason. Catalog baseline để exclusions rỗng. Đổi Con Đường/Nghề không làm mất Dị Thể.

### DT-LIM-001 Giới hạn hệ hiếm
Một nhân vật đồng thời giữ tối đa 1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn.

### DT-VAL-001 Kiểm catalog và state
`validateSpecialPhysiqueCatalog()`: field bắt buộc, `progressThreshold` 1–10, `stageEffects.length = maxStage`, key hiệu ứng hợp lệ, tỷ lệ trong [0, 1], `factionAffinity` trong [−10, 10], exclusion là chuỗi không rỗng. `validateSpecialPhysiqueState()`: `activeId` thuộc catalog và khớp mirror, candidate đạt ngưỡng, history không trùng id và stage hợp lệ, `rejectedIds` không trùng. Migration giữ ID legacy dưới dạng history, không áp hiệu ứng không hỗ trợ.

## UI

Tab Dị Thể: candidate (tiếp nhận/từ chối kèm cost), Dị Thể active với stage, nhánh, hiệu ứng hiện tại. Cảnh báo mơ hồ trước hành động sắp đạt ngưỡng; Bách Khoa có mục "Truyền Thuyết" liệt kê Dị Thể đã biết trong lore dù chưa ai đạt.

## Acceptance

- Một `activeId`; claim bị từ chối không tiêu SAN; replay không nhân đôi history/modifier.
- Stage 1/2/3 đọc đúng `stageEffects`; đổi Con Đường/Nghề không mất Dị Thể.
- Gate: `node tools/verify_dichi_deep.js` (cả hai validator, claim, stage, outcome, exclusion, save round-trip).

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| DT-NS-001 | `js/expansion.js:progressionNamespaceSnapshot`, `validateCanonicalNamespaces` | Khớp |
| DT-CAT-001 | `js/expansion.js:SPECIAL_PHYSIQUE_CATALOG` | Khớp |
| DT-PRG-001, 002 | `js/expansion.js:recordSpecialPhysiqueProgress` | Khớp |
| DT-CLM-001 | `js/expansion.js:claimSpecialPhysique` (độc bản dùng chung cờ `flags.uniquePowerCreated` với điều kiện cấp 10 "Quyền Năng độc nhất") | Lệch |
| DT-CLM-002 | `js/expansion.js:rejectSpecialPhysique` | Khớp |
| DT-STG-001 | `js/expansion.js:recordSpecialPhysiqueProgress` | Khớp |
| DT-MOD-001 | `js/expansion.js:specialPhysiqueModifiers` | Khớp |
| DT-OUT-001 | `js/expansion.js:specialPhysiqueOutcome` | Khớp |
| DT-EXC-001 | `js/expansion.js:SPECIAL_PHYSIQUE_CATALOG.exclusions`, `PRODUCT_POLICY.diTheLocksPath/diTheLocksProfession = false` | Khớp |
| DT-LIM-001 | — (không có kiểm tra chéo ba hệ) | Thiếu |
| DT-VAL-001 | `js/expansion.js:validateSpecialPhysiqueCatalog`, `validateSpecialPhysiqueState` | Khớp |
