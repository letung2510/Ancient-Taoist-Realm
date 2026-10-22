# Mệnh Số — Catalog và schema

## Mục đích

Chốt nguồn dữ liệu runtime, định nghĩa `FateDefinition`, map chéo schema giữa catalog và bảng quan hệ, cách tách effect trực tiếp/điều kiện và cách suy ra element/path affinity.

## Dữ liệu & trạng thái

| Nguồn | Vai trò |
|---|---|
| `data/fate_data.js` → `window.FATE_DATA` | Catalog 10.000 Mệnh (canonical) |
| `data/fate_relationships.js` → `window.FATE_RELATIONSHIPS` | `pairwise_relationships`, `combo_sets`, `fusion_recipes` |
| `data/path_fate_relations.js` → `window.PATH_FATE_RELATIONS` | Tag `lead/support/forbidden` của Con Đường, `hidden_fates` (bridge browser) |
| `data/path_fate_relations.json` | Nguồn JSON cho tool Node; cặp nguồn/bridge, không phải bản trùng |
| `data/data.js` | Aggregator, expose `GameData.FATE_PATTERNS` |

## Rules

### FATE-CAT-001 Nguồn runtime duy nhất
`index.html` chỉ nạp đúng 4 file: `fate_data.js`, `fate_relationships.js`, `path_fate_relations.js`, `data.js`. File trong `fate_system_update/` (staging `fate_data_with_tags.json`, `resonance_effects_v2.json`, manifest, report, `grade_sign_maps.js`, `sample_review.json`, backup) không được nạp vào browser.

### FATE-CAT-002 Legacy bị cấm
Không dùng `fate-pool.json`, `fate-relationships.json`, `generate_fate_pool.js` hay thang tier Trắng/Lục/Lam/Chàm/Tím/Cam Kim/Đỏ/Cầu Vồng (1.300 Mệnh). `tools/generate_fates*.js` chỉ được ghi ra `fate_system_update/generated/`, không ghi đè catalog runtime.

### FATE-CAT-003 Phân bố catalog
| Grade | phan | linh | hoang | huyen | dia | thien | thanh | tien | Tổng |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Số entry | 5.000 | 2.500 | 1.200 | 700 | 400 | 150 | 49 | 1 | 10.000 |

Tỷ lệ catalog là độ dày nội dung, không phải xác suất rơi (xác suất: [pool-and-generation.md](pool-and-generation.md)).

### FATE-CAT-004 FateDefinition
```js
FateDefinition {
  id, name,
  grade: "phan"|"linh"|"hoang"|"huyen"|"dia"|"thien"|"thanh"|"tien",
  gradeLabel, sign: "cat"|"binh"|"hung", score, effects: {}, desc,
  tags: string[], element: "kim"|"moc"|"thuy"|"hoa"|"tho"|"vo_he",
  resonanceEffect?   // 130 entry được chỉ định
}
```
Trạng thái active/vault/pending và mọi tiến trình (stage, insight, stagnantDays, enhancement) thuộc instance của nhân vật, không ghi vào catalog. Không có field `passive`: mọi effect của Mệnh active là passive khi active.

### FATE-CAT-005 Map chéo schema duy nhất
```js
GRADE_TO_TIER = { phan:1, linh:2, hoang:3, huyen:4, dia:5, thien:6, thanh:7, tien:8 }
TIER_TO_GRADE = đảo của GRADE_TO_TIER
SIGN_TO_TYPE_LABEL = { cat:"Cát Cách", binh:"Bình Cách", hung:"Hung Cách" }
TYPE_LABEL_TO_SIGN = đảo của SIGN_TO_TYPE_LABEL
```
Catalog dùng `grade`/`sign`; `fate_relationships.js` dùng `tier` số và `type` nhãn. Mọi so sánh chéo phải qua map này; cấm so trực tiếp `grade` với `tier` hoặc `sign` với `type`.

### FATE-CAT-006 Adapter `fateDefinition()`
Là API duy nhất trả schema chuẩn: `alignment = sign`, `tier`, `element`, `path_affinity`, `modifiers`, `conditionalEffects`. Không mutate catalog.

### FATE-CAT-007 Tách effect
| Nhóm | Key |
|---|---|
| `modifiers` (trực tiếp) | `magMult`, `phyMult`, `allStatMult`, `lifespanBonus`, `hpRegen`, `qiFlat`, `phyFlat`, `maxQiPct`, `qiRecoveryPct`, `maxStaminaPct`, `combatDamagePct`, `cultivationSpeedPct` |
| `conditionalEffects` | mọi key còn lại: `breakBonus`, `breakFailPenalty`, `fortune`, `lootMult`, `sanDrainMult`, `sanResist`, `sanShield`, `lightFireMult`, `resistPossession`… |

Object `effects` trong catalog giữ nguyên; `splitFateEffects()` tách khi tính.

### FATE-CAT-008 Element
Element lưu tĩnh trên cả 10.000 entry. Nếu thiếu, engine suy ra từ tên/mô tả theo keyword Ngũ Hành, mặc định `vo_he`; UI không tự suy luận.

### FATE-CAT-009 Path affinity
Nếu entry có `path_affinity` thì dùng nguyên; nếu không, engine suy ra từ tag Mệnh (tên, type, element, effects, `tags`) so với tag `lead/support/forbidden` của từng Con Đường có ràng buộc. Path `unbound` bị bỏ qua. `forbidden` chỉ đến từ tag forbidden đã review, không suy ra vì thiếu match.

### FATE-CAT-010 Dữ liệu quan hệ chuẩn hóa
`pairwise_relationships` 13.976 cạnh (13.874 `TUONG_SINH`, 102 `TUONG_KHAC`), `combo_sets` 150, `fusion_recipes` 78; mọi ID trỏ tới entry tồn tại. Không nhúng `relationship`/`potential` vào entry; tra qua `fateRelationshipsFor`, `fateCombosFor`, `fateFusionRecipesFor`. Mệnh Bình không có cạnh nghĩa là "không có quan hệ", không phải lỗi dữ liệu.

### FATE-CAT-011 Entry Tiên
Catalog có đúng 1 entry Tiên: `than_dao_151`. Luật sở hữu: [pool-and-generation.md](pool-and-generation.md#fate-roll-009-tiên-độc-bản).

## Acceptance

- Catalog đúng 10.000 ID, không trùng, phân bố khớp FATE-CAT-003, đúng 1 Tiên.
- Quan hệ/combo/fusion không trỏ ID thiếu; giữ 13.976/150/78 trừ khi có manifest.
- Không file runtime nào so `tier`/`type` bỏ qua map; không file legacy nào được nạp.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-CAT-001 | `index.html` script list; `data/data.js` | Khớp |
| FATE-CAT-003 | `data/fate_data.js` (đếm grade 5000/2500/1200/700/400/150/49/1) | Khớp |
| FATE-CAT-005 | `js/engine.js:GRADE_TO_TIER`, `TIER_TO_GRADE`, `SIGN_TO_TYPE_LABEL`, `TYPE_LABEL_TO_SIGN` | Khớp |
| FATE-CAT-006 | `js/engine.js:fateDefinition` | Khớp |
| FATE-CAT-007 | `js/engine.js:FATE_MODIFIER_KEYS`, `splitFateEffects` | Khớp |
| FATE-CAT-008 | `js/engine.js:fateElement`; `data/fate_data.js` (10.000 `element`) | Khớp |
| FATE-CAT-009 | `js/engine.js:fatePathAffinity`, `fateTags` | Khớp |
| FATE-CAT-010 | `js/engine.js:fateRelationshipIndex`, `fateRelationshipsFor`, `fateCombosFor`, `fateFusionRecipesFor` | Khớp |
