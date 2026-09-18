# TECHNIQUE CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\06-expansion\TECHNIQUE_RECIPE_CANONICAL_2026-09-16.md`

# Canonical Công Pháp và Recipe — 2026-09-16

## Mục tiêu

Mọi Công Pháp và mọi hành động chế tác phải có schema runtime thống nhất. Tên hiển thị chỉ dùng để trình bày; resolver luôn dùng `id`.

## Công Pháp

`techniqueCatalog()` chuẩn hóa mỗi bản ghi về các nhóm:

```js
{
  id, category, family, grade, element,
  minRealmLevel, isCore,
  cost: { mana, stamina, san, corruption, lifespan, cooldownTurns, castTimeSeconds },
  effect: { powerCoefficient, baseEffect, allStatMultiplier },
  risk: { corruptionProfile, hiddenAttributes },
  mastery: { stage, exp, usageCount },
  evolutionPaths: []
}
```

`visibleStats` vẫn được giữ để tương thích UI hiện hành, nhưng `cost`, `effect` và `risk` là DTO canonical cho resolver mới. Tâm Pháp (`category: tam_phap`) là passive, không đi qua action thi triển.

## Recipe

Recipe canonical có dạng:

```js
{
  id,
  professionId,
  materials: { itemId: quantity },
  output: { itemId | kind, quantity, purpose? },
  costs: { stamina?, qi?, san?, merit? },
  successBase?,
  perfectMultiplier?
}
```

Nguồn runtime hiện tại là `GameExpansion.recipeCatalog()`. `recipeCanCommit()` kiểm tra toàn bộ nguyên liệu và chi phí trước; `commitRecipeCosts()` trừ một lần sau khi kiểm tra thành công. Không được trừ từng phần trước khi biết recipe hợp lệ.

Các recipe canonical hiện có:

- `tu_khi_dan`, `hoan_huyet_dan`, `dien_tho_dan_ha` — Luyện Đan Sư.
- `procedural_artifact` — Luyện Khí Sư.
- `gathering_formation`, `ward_formation` — Trận Pháp Sư.

## Reward và log

Thưởng collection hiếm, contract, hidden realm và contested opportunity phải đi qua `grantCanonicalReward()` để tạo receipt chống phát thưởng trùng. Log kết quả phải dùng narrative producer; chi phí và thay đổi chỉ được đưa vào `statDisplay`/DTO.

## Invariant

1. Preview không trừ nguyên liệu, stamina hoặc RNG commit.
2. Commit lỗi không làm mất một phần nguyên liệu.
3. Recipe không tồn tại không được fallback âm thầm sang recipe khác, ngoại trừ alias được khai báo rõ.
4. Mastery tăng sau khi action đã xác định kết quả và chỉ tăng một lần cho một commit.

## Trạng thái

- Runtime schema và resolver recipe: **ĐÃ CODE**.
- Canonical DTO Công Pháp: **ĐÃ CODE**, regression đang kiểm tra record đã biết và cần mở rộng thêm snapshot toàn catalog tĩnh.
- Benchmark thời gian chế tác và UI recipe trên thiết bị yếu: **CHƯA ĐO**.


