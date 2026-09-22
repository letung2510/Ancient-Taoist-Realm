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



## Content design: D? Th? catalog expansion

Add three distinct data-driven physiques using supported effect keys: `qing_luan_bone` (poison resistance and stealth), `ming_yang_spirit_root` (SAN recovery and Fate resonance), and `xuan_ming_scale` (corruption resistance and one bounded revive). Each has three stage thresholds, explicit activation cost, branch, ending tags, and faction affinity. None excludes a path/profession by default; D? Th? remains independent from Con -u?ng/Ngh?. Eligibility is trigger-based and deterministic. Claim checks active slot, candidate/rejected state, stage threshold, and costs atomically. Stage effects are applied only through `specialPhysiqueModifiers`; no direct duplicate stat application.

Acceptance: validator accepts unique IDs/effect keys/stages; migration preserves legacy IDs as history without applying unsupported effects; rejected claims spend nothing; replay cannot duplicate history/modifiers. Numbers are initial balance values for later playtest.

## Runtime content update (2026-09-22)
The catalog now includes Thanh Loan Linh Cot (`survive_storms`), Minh Duong Linh Can (`restore_san`), and Huyen Minh Lan Giap (`survive_corruption`). Each uses supported staged effects and costs 12 SAN to claim. Once-per-game-day event keys prevent repeated post-action progress farming; claims atomically validate and consume SAN. The progress ledger is separate from active-physique claim history so save validation can distinguish progress from claims.
