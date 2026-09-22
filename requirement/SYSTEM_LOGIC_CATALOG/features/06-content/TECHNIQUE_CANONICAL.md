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



## New feature: C-ng Ph-p v?n h-nh theo hi?p

Add a preparation cycle to active techniques. Each learned active technique has `combatState: { cooldownRemaining, channelProgress, lastResolvedActionId }` under its progress record. `prepareTechnique(state,id,actionId)` validates learned state, realm, cost, and cooldown; charges the declared resource once; then marks the technique prepared for the current encounter. `useTechnique` resolves an explicit stance: `steady` uses catalog values; `burst` raises effect coefficient 20% and corruption cost 50%; `guarded` lowers effect 15% and halves incoming technique risk. Choices are previewable and idempotent by action ID. Successful resolution starts catalog cooldown; failed validation spends nothing. T-m Ph-p may modify preparation/cooldown through a read-only modifier snapshot, never by mutating catalog data.

UI shows Prepare, stance, cooldown, cost and effect preview. Combat and duel callers use the same resolver; existing non-combat use remains supported. Migration initializes new fields without altering mastery. This is a design contract pending runtime implementation.

## Runtime feature update (2026-09-22)
The implemented feature is a per-cast stance choice using the existing technique cooldown transaction; it supersedes the earlier proposed separate prepare/channel substate. `steady` uses catalog effects, `burst` raises effect by 20% and corruption cost by 50%, and `guarded` lowers effect by 15% and halves SAN/corruption costs. UI asks for a stance before committing an active-technique action. Invalid stance and resource failures spend nothing. Cooldown and mastery remain resolved by the existing `useTechnique` path.

## Runtime cross-feature additions (2026-09-22)

- Combat Fate resonance counts distinct, catalog-owned, active and unsuppressed Fate IDs. Same-element and explicit `pathAffinity` matches share one catalog policy and a hard +5% power cap; support/passive techniques and unknown/neutral elements receive no Fate bonus. Preview exposes matched IDs and sources.
- `guild_elemental_array_support` grants +5% power only while a guild-taught formation from the current active guild remains deployed, for a disciple-rank-or-higher member and an allowed technique element. Membership suspension, expiry, mismatched source guild, or invalid formation removes the bonus. The source formation record is captured at deployment; old saves without it receive no bonus.
- Shared eligibility rechecks active Fate count/element/ID and suspended membership. Realm/path/faction and training location remain blockers as declared by the scope requirements.
- UI action receipts retain the latest 64 results and a monotonic high-water sequence for generated `technique-ui:N` IDs. A replay after receipt eviction is rejected without costs/effects; retained IDs return their original receipt.
- Regression coverage exercises duplicate/suppressed Fate handling, path bonus, guild bonus/suspension and evicted-receipt replay.