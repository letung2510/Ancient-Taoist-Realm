# Nhân Vật — Shape lưu canonical

## Mục đích

Object nhân vật canonical dùng chung cho generator, save envelope và import/export. Envelope, version và migration chung thuộc [../data-runtime/README.md](../data-runtime/README.md); chi tiết block Mệnh Số thuộc [../fate/save-and-migration.md](../fate/save-and-migration.md).

## Dữ liệu & trạng thái

```js
CanonicalCharacter {
  id, name,
  origin: { regionId, locationId, race, background, profile, journeyIntent, openingPlan,
            personality: [2], hiddenGoal, spiritualRoots: [nguyên tố thuần], spiritualRootBranch },
  presentation: { archetypeId, portrait },
  realm: { id, level, title, exp },
  path: { primary, secondary, pathScore, professionStage },
  pathNamespace: "unbound" | null, unbound: boolean,
  stats: { phy, mag, aptitude, comprehension, vitality, vitalityMax, qi, qiMax,
           staminaCurrent, staminaMax, san, sanMax, corruption, lifespan,
           lifespanConsumableBonus, currentAge, fortune, sat, merit },
  fate: { ... },              // xem ../fate/save-and-migration.md
  fateRuntime: { ... },
  anchors: [ ... ],           // xem human-anchor.md
  techniqueIds, techniqueProgress, techniqueCooldowns,
  techniqueActionReceipts, techniqueActionReceiptHighWater, techniqueActionSequence,
  hiddenFates, hiddenProfessionCandidate, hiddenProfession,
  faction, state, pathDebt,
  unboundTrials, unboundPathProven, techniqueTrialTokens,
  equipment
}
```

## Rules

### CHR-SAVE-001 Một shape canonical
`toCanonicalCharacter(player, state)` là serializer duy nhất của nhân vật; `fromCanonicalCharacter(character)` là deserializer duy nhất. Save envelope (`serialize`, `version: 13`) nhúng object này.

### CHR-SAVE-002 Field gameplay bắt buộc khi tạo mới
Nhân vật vừa tạo: `realm = { id: "di_menh", level: 1, exp: 0 }`; `path.primary = null`; `fate.equippedIds` 5 ID, `vaultIds = []`, `vaultCapacity = 10`, `debt = surplus = 0`; `anchors = []`; `techniqueIds = ["kiem_khi_so_cap", "tam_phap_dan_dien"]`; `hiddenProfession = null`; `state = "NORMAL_GROWTH"`; `stats.san = sanMax = 100`, `staminaCurrent = 100`, `corruption = 0`.

### CHR-SAVE-003 Metadata không phải dữ liệu replay
`createdAt` là thời điểm tạo, bị loại khi so sánh replay. Mọi field khác phải tất định theo input + RNG.

### CHR-SAVE-004 Linh Căn
`origin.spiritualRoots` chỉ chứa nguyên tố thuần; `origin.spiritualRootBranch` giữ nhánh đã roll ([attributes-and-derived.md](attributes-and-derived.md#chr-att-003-lưu-linh-căn)). Nhãn/cách cục không được lưu lặp trên từng nguyên tố.

### CHR-SAVE-005 Round-trip
`fromCanonicalCharacter(toCanonicalCharacter(x))` giữ nguyên mọi field gameplay ở trên, kể cả namespace Mệnh Số, Neo, tiến trình Công Pháp và `equipment`.

## Acceptance

- `tools/verify_save_envelope.js` và `tools/verify_character_generator_replay.js` đạt.
- Nhân vật export từ generator Node load được vào browser runtime mà không mất field.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CHR-SAVE-001 | `js/engine.js:toCanonicalCharacter`, `fromCanonicalCharacter`, `serialize` | Khớp |
| CHR-SAVE-002 | `character_generator.js:generateCharacter`; `js/engine.js:createCharacter` | Khớp |
| CHR-SAVE-003 | `character_generator.js:generateCharacter` (`createdAt`) | Khớp |
| CHR-SAVE-004 | `js/engine.js:toCanonicalCharacter` (`origin.spiritualRoots`, `spiritualRootBranch`) | Khớp |
| CHR-SAVE-005 | `js/engine.js:fromCanonicalCharacter`, `deserialize` | Khớp |
