# DI THE CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\02-progression\DI_THE_CATALOG_AND_EXCLUSION_CANONICAL_2026-09-16.md`

# Dị Thể Catalog / Exclusion Canonical — 2026-09-16

## Namespace

Dị Thể là `specialPhysiqueState`, khác hoàn toàn với `pathState` (Con Đường), `professionState` (Nghề) và `discoveries` (Dị Chí/tri thức). UI dùng nhãn Dị Thể; không dùng Dị Chí để chỉ trạng thái thân thể.

```js
specialPhysiqueState: {
  schemaVersion, activeId, candidates, progress,
  history: [{ id, trigger, day, cost, result }], rejectedIds
}
```

## Baseline catalog

Runtime catalog hiện có: Thánh Thể, Hỗn Độn Thể, Vạn Độc Thể, Cửu U Thể, Bất Tử Thể và Thiên Sinh Đạo Thể. Mỗi entry có `trigger`, `progressThreshold`, `maxStage`, `branch`, `benefit`, `stageEffects`, `endingTags`, `factionAffinity`, `cost`, `exclusions`; modifier đi qua `specialPhysiqueModifiers` và không được cộng trực tiếp lần hai trong Fate/Con Đường/Nghề. Progress đạt ngưỡng theo stage sẽ ghi vào `specialPhysiqueState.history`, không tạo thêm active instance.

## Exclusion policy

Dị Thể mặc định là modifier, không tự khóa Nghề chính, Nghề Ẩn hoặc Con Đường. Chỉ một entry có `exclusions.paths` hoặc `exclusions.professions` explicit mới được chặn lựa chọn; blocker phải trả về reason. Dị Thể có thể đổi corruption/resistance/combat/ending và affinity faction qua resolver riêng, không sửa trực tiếp `pathId`.

## Acceptance

- Một nhân vật chỉ có một `activeId`.
- Candidate/rejected/active là các trạng thái khác nhau và serialize được.
- Kích hoạt cùng Dị Thể hai lần không cộng modifier hai lần.
- Stage 1/2/3 đọc từ `stageEffects` và chỉ stage hiện tại được áp dụng.
- `endingTags` và `factionAffinity` là metadata cho ending/faction resolver, không tự động đổi faction.
- Đổi Con Đường/Nghề không làm mất Dị Thể nếu không có rule exclusion explicit.

`progressionNamespaceSnapshot()` trả DTO kiểm tra độc lập ba namespace. Catalog baseline hiện để `exclusions.paths/professions` rỗng; không có rule sản phẩm nào được phép tự khóa nghề/path nếu chưa được khai báo trong chính entry đó.
## Outcome projection

`specialPhysiqueOutcome(state)` is the canonical read model for active Dị Thể:
it returns active id, stage, branch, ending tags, and stage-scaled faction
affinity. The projection is read-only; stage 1 uses the catalog affinity and
later stages scale it by `stage / maxStage`. UI may display the projection but
must not mutate the claim/history record.


