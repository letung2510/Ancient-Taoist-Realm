# Mệnh Số — Hiệu ứng và chỉ số

## Mục đích

Định nghĩa các lớp hiệu ứng của một Mệnh, công thức hệ số, điểm Mệnh và cách hợp nhất vào chỉ số nhân vật đúng một lần.

## Dữ liệu & trạng thái

- `player.fateEnhancements[fateId]` (0–5), `player.fateRelationships[fateId].stage` (0–4), `player.fateEvolutions[fateId]`, `player.suppressedFates[fateId].untilTurn`, `player.fateAdvancedActions`.
- `player.fateDebt`, `player.fateSurplus`, `player.corruptionRating`, `realm.minFate`.

## Rules

### FATE-EFF-001 Lớp độc lập
Hiệu ứng một Mệnh gồm các lớp: base (catalog), enhancement, relationship stage, resonance (bậc ≥3), evolution branch, suppression, advanced action. Không lớp nào mutate catalog hay đọc chéo record của lớp khác. Tổng chỉ được hợp nhất một lần trong `computeStats`.

### FATE-EFF-002 Breakdown
`fateEffectBreakdown(character, fate)` trả `{ base, enhanced, relationshipStage, resonance: { active, effect }, evolutionScore, suppression, advanced }`. UI/API chỉ đọc breakdown này; resonance chỉ active khi `stage ≥ 3` và `resonanceUnlocked`.

### FATE-EFF-003 Hệ số enhanced
`multiplier = 1 + 0,05 × enhancementLevel + [0; 0,05; 0,10; 0,20; 0,35][stage]`, chỉ nhân vào giá trị số dương; giá trị âm/không phải số giữ nguyên. Sau đó áp evolution ops của nhánh đã tiến hóa đúng một lần. Kết quả phải tất định (hai lần tính giống nhau).

### FATE-EFF-004 Hợp nhất vào chỉ số
`computeStats` duyệt Mệnh active không bị Trấn Mệnh, lấy `enhancedFateEffects`: cộng `phyMult`, `magMult`, `allStatMult`, `phyFlat`, `qiFlat`, `fortune`, `sanResist`, `breakBonus`, `sanDrainMult`; nhân `lootMult`, `lightFireMult`; `hpRegen` là cờ. Sau đó cộng `allStatMult` của Nghịch Mệnh (nếu không bị Trấn) và hiệu ứng quan hệ Mệnh–Mệnh ([relationships.md](relationships.md#fate-rel-001-quan-hệ-mệnhmệnh)). `computeLifespan` dùng cùng pipeline.

### FATE-EFF-005 Điểm Mệnh
`computeFate` với mỗi Mệnh active không bị Trấn: `score = catalog.score + 2 × enhancement + evolutionScoreDelta`.
- `total` = tổng score; `normal` = tổng score của Mệnh không Hung.
- `ratio = total / max(1, |normal|)`.
- `effective = total + 2 × surplus − 3 × debt − 0,5 × corruption`.
- `minFate` lấy từ cảnh giới hiện tại (cổng đột phá thuộc [../realm-progression/README.md](../realm-progression/README.md)).

### FATE-EFF-006 Không nhân match vào điểm
Match score Con Đường không nhân vào `total`/chỉ số; vai trò của match ở [resonance.md](resonance.md).

### FATE-EFF-007 Trạng thái Mệnh của nhân vật
`fateState(character)` theo thứ tự: Corruption ≥ 91 hoặc có Neo bị vỡ → `ELDRITCH_INTERVENTION`; phe `loyal_heaven` ở cấp ≥ 11 → `NORMAL_GROWTH`; `debt > surplus` hoặc `fateConflict` → `FATE_BACKFIRE`; còn lại `NORMAL_GROWTH`.

## Acceptance

- Mệnh +5, stage 3: preview Tiến Hóa, commit và breakdown sau commit nhất quán (`verify_review_batches.js`).
- Mệnh bị Trấn Mệnh không đóng góp stats/score/thọ nguyên đến hết hạn, sau đó tự phục hồi.
- Không effect nào bị cộng hai lần giữa enhancement/relationship/evolution/advanced.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-EFF-001 | `js/engine.js:validateFateEffectComposition` | Khớp |
| FATE-EFF-002 | `js/engine.js:fateEffectBreakdown` | Khớp |
| FATE-EFF-003 | `js/engine.js:enhancedFateEffects`; `js/expansion.js:applyFateEvolutionOps` | Khớp |
| FATE-EFF-004 | `js/engine.js:computeStats`, `computeLifespan` | Khớp |
| FATE-EFF-005 | `js/engine.js:computeFate`; `js/expansion.js:fateEvolutionScoreDelta` | Khớp |
| FATE-EFF-007 | `js/engine.js:fateState` | Khớp |
