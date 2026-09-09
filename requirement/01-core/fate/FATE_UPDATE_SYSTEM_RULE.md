# FATE UPDATE SYSTEM RULE

> Tài liệu rule canonical duy nhất cho feature FATE/Mệnh Số sau đợt hợp nhất.
> Phạm vi: dữ liệu, phẩm cấp, roll, Con Đường, quan hệ, Mệnh Kho, trang bị, phần thưởng,
> UI/action, migration và lộ trình runtime.
> Trạng thái: **rule nền tảng để triển khai**. Những phần được đánh dấu `CHỜ DUYỆT` không được tự ý code.
> Ngày hợp nhất: 2026-09-08.

---

## 0. Quy tắc ưu tiên và phạm vi nguồn

Đã đối chiếu các tài liệu FATE được chỉ định và các tài liệu hệ thống liên quan trong repository.
Khi có mâu thuẫn, dùng thứ tự sau:

1. Quyết định mới nhất của người dùng trong `FATE_GRADE_DISTRIBUTION_REVIEW.md` cho **phân bố catalog và phẩm cấp roll**.
2. Nguyên tắc schema, active/vault, action, UI, migration và acceptance trong `FATE_SYSTEM_SPEC.md`.
3. Đối chiếu schema thật và gap trong `FATE_SYSTEM_COMPLETE.md`.
4. Quan hệ Nhân Vật–Mệnh, Dưỡng Mệnh và Cộng Minh trong `FATE_RELATIONSHIP_COMPLETE.md`.
5. Duplicate, Fate Whisper, Mệnh Nguội và độc bản Tiên trong `FATE_NEW_LOGIC_ADDENDUM.md`.
6. Kỹ thuật chọn grade/fallback trong `FATE_GRADE_WEIGHT_BY_LEVEL.md`; bảng tỷ lệ cũ trong file này bị thay thế bởi bảng tại mục 3 của rule này, nhưng thuật toán fallback vẫn được giữ.
7. Wiring data/tags/element/resonance trong `prompt_wire_fate_data_to_engine.md`.
8. Các tài liệu nền khác chỉ cung cấp dependency và bối cảnh: `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`, `MASTER_GAME_REQUIREMENTS.md`, `ARCHIVE_BREAKTHROUGH_RITUAL_DETAIL.md`, `RANDOM_EVENT_SYSTEM.md`, `ACTION_HYBRID_SYSTEM.md`, `RELATIONSHIP_SYSTEM.md`, `character_creation_system.md`, `NPC_MONSTER_SYSTEM.md`, `WORLDVIEW_ATMOSPHERE.md`, `MAP_SYSTEM.md`, `UI_LAYOUT_AND_ACTION_TABLE_REQUIREMENTS.md` và các README.

Không dùng rule cũ của `fate-pool.json`, `fate-relationships.json` hoặc generator 1.300 Mệnh làm nguồn runtime.

---

## 1. Mục tiêu thiết kế

Mệnh Số là lớp tiến triển giữa nhân vật, Cảnh Giới, Con Đường và cơ duyên. Một Mệnh có thể:

- thay đổi chỉ số, tài nguyên và điểm Mệnh;
- tạo tương hợp/tương khắc với Con Đường;
- tạo quan hệ với Mệnh khác và combo/dung hợp;
- mở lựa chọn rủi ro–phần thưởng;
- được cất trong Mệnh Kho mà không tác động khi chưa kích hoạt;
- phát triển quan hệ qua hành vi, không chỉ qua việc bấm nhận EXP.

Nguyên tắc bắt buộc:

1. **Phẩm cấp không đồng nghĩa sức mạnh tuyệt đối.** Tương hợp, hiệu ứng, quan hệ và build có thể khiến Mệnh phẩm thấp hữu ích hơn Mệnh phẩm cao nhưng lệch đường.
2. **Mệnh Kho không có hiệu lực.** Chỉ Mệnh đang active mới tính stats, score, path match, quan hệ và combo.
3. **Mọi kết quả phải giải thích được.** Blocker, phẩm cấp, nguồn nhận, hiệu ứng trước/sau và giao dịch phải hiện rõ cho người chơi.
4. **Không làm mất Mệnh âm thầm.** Kho đầy dùng pending hoặc yêu cầu thay thế/giải quyết rõ ràng.
5. **Một nguồn roll chung.** Không cho từng action tự `filter(...).random()` với quy tắc riêng nếu không được nêu trong source matrix.

---

## 2. Nguồn dữ liệu canonical và schema

### 2.1. Nguồn thật

| Nguồn | Vai trò | Rule |
|---|---|---|
| `data/fate_data.js` / `window.FATE_DATA` | catalog runtime | canonical cho `id`, `name`, `sign`, `grade`, `gradeLabel`, `score`, `effects`, `desc`, và sau Gate 0 là `tags`, `element`, `resonanceEffect` |
| `data/fate_relationships.js` / `window.FATE_RELATIONSHIPS` | quan hệ Mệnh–Mệnh, combo, fusion | canonical normalized, sinh từ bộ 10.000 entry |
| `data/path_fate_relations.js` + `.json` | mapping Con Đường, hidden fate, path tags | bridge/runtime; không ghi đè catalog |
| `fate_system_update/fate_data_with_tags.json` | staging/source review | dùng để merge tags/element, không load trực tiếp trong browser |
| `fate_system_update/resonance_effects_v2.json` | staging hiệu ứng Cộng Minh | merge theo `id` vào 130 entry được chỉ định |
| `fate_system_update/grade_sign_maps.js` | map canonical | mọi code cross-schema phải dùng map này hoặc bản tương đương trong engine |
| `fate_system_update/sample_review.json` | QA mẫu | không load vào runtime |

### 2.2. Nguồn legacy không được dùng

`fate-pool.json`, `fate-relationships.json`, `generate_fate_pool.js` và tài liệu quan hệ 1.300 entry chỉ giữ tham khảo lịch sử. Chúng dùng thang Trắng/Lục/Lam/Chàm/Tím/Cam Kim/Đỏ/Cầu Vồng và không được trộn với thang Phàm→Tiên.

### 2.3. FateDefinition canonical

```js
FateDefinition {
  id: string,
  name: string,
  grade: "phan" | "linh" | "hoang" | "huyen" | "dia" | "thien" | "thanh" | "tien",
  gradeLabel: string,
  sign: "cat" | "binh" | "hung",
  alignment: "cat" | "binh" | "hung", // derived alias, không ghi đè sign
  score: number,
  tags: string[],
  element: "kim" | "moc" | "thuy" | "hoa" | "tho" | "vo_he",
  effects: object,
  modifiers: object,           // derived split, không bắt buộc lưu duplicate
  conditionalEffects: object, // derived split
  desc: string,
  resonanceEffect?: { description: string, effectType?: string, effectValue?: number }
}
```

Map duy nhất:

```js
GRADE_TO_TIER = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 }
TIER_TO_GRADE = { 1: "phan", 2: "linh", 3: "hoang", 4: "huyen", 5: "dia", 6: "thien", 7: "thanh", 8: "tien" }
SIGN_TO_TYPE_LABEL = { cat: "Cát Cách", binh: "Bình Cách", hung: "Hung Cách" }
TYPE_LABEL_TO_SIGN = { "Cát Cách": "cat", "Bình Cách": "binh", "Hung Cách": "hung" }
```

Không so sánh trực tiếp `grade` với `tier`, hoặc `sign` với `type` tiếng Việt.

### 2.4. Split effect

Các key `phyMult`, `magMult`, `allStatMult`, `lifespanBonus`, `hpRegen`, `qiFlat`, `maxQiPct`, `qiRecoveryPct`, `maxStaminaPct`, `combatDamagePct`, `cultivationSpeedPct` là modifier trực tiếp.

`breakBonus`, `breakFailPenalty`, `fortune`, `lootMult`, `sanDrainMult`, `sanResist`, `sanShield`, `lightFireMult`, `resistPossession` là conditional effect theo ngữ cảnh. Runtime vẫn có thể giữ nguyên object `effects`; `fateDefinition()` phải tách ra khi tính.

---

## 3. Phân bố catalog và trọng số roll — quyết định canonical

### 3.1. Catalog 10.000 entry

Phân bố được chốt theo `FATE_GRADE_DISTRIBUTION_REVIEW.md` và thay thế phân bố 80% cũ:

| Grade | Số entry | Tỷ lệ catalog |
|---|---:|---:|
| Phàm | 5.000 | 50,00% |
| Linh | 2.500 | 25,00% |
| Hoàng | 1.200 | 12,00% |
| Huyền | 700 | 7,00% |
| Địa | 400 | 4,00% |
| Thiên | 150 | 1,50% |
| Thánh | 49 | 0,49% |
| Tiên | 1 | 0,01% |
| **Tổng** | **10.000** | **100%** |

Catalog ratio là độ dày nội dung, không phải xác suất rơi. Mỗi lần roll phải chọn grade trước, sau đó chọn đều một entry khả dụng trong grade đó.

### 3.2. Reward grade weights theo cấp nhân vật

Bảng này là tỷ lệ canonical cho reward thông thường. Nó thay thế bảng 40/35/20/5 ở `FATE_GRADE_WEIGHT_BY_LEVEL.md` vì quyết định mới yêu cầu Phàm giảm còn 15% từ cấp 3:

| Cấp nhân vật | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–2 | 65% | 30% | 5% | 0% | 0% | 0% | 0% | 0% |
| 3–4 | 15% | 45% | 25% | 10% | 5% | 0% | 0% | 0% |
| 5–6 | 5% | 20% | 35% | 25% | 10% | 5% | 0% | 0% |
| 7–8 | 2% | 10% | 25% | 30% | 20% | 10% | 3% | 0% |
| 9+ | 1% | 5% | 15% | 25% | 25% | 18% | 11% | 0% |

Tiên không nằm trong reward thường. Nó chỉ được mở bởi nguồn đặc biệt/cốt truyện/pity đã cấu hình và vẫn phải qua khóa độc bản.

### 3.3. Modifier theo nguồn

- Combat thường: dùng bảng theo cấp, có thể lệch xuống một bậc nếu phần thưởng là bonus nhỏ.
- Elite/Boss: dùng bảng theo cấp, tăng grade cap hoặc lệch lên một bậc có giới hạn.
- Quest/cơ duyên cốt truyện: có thể đặt `minimumGrade`, nhưng phải ghi rõ trong reward definition.
- Online/AFK: ưu tiên 1–3, không tự trao Huyền+ nếu chưa qua cap của nguồn.
- Phường Thị/Công Đức: dùng bảng theo cấp nhưng có cap và giá; không khóa cứng toàn bộ vào Phàm.
- Khâm Thiên Giám: neo theo grade dominant, cơ hội +1 grade thấp, không vượt cap và không tự sinh Tiên thường.
- Hư Thiên Đỉnh: grade đầu vào và quantity quyết định cap; không roll toàn catalog mù.

---

## 4. Thuật toán roll, fallback và duplicate

### 4.1. Resolver dùng chung

Mọi nguồn mới phải gọi `rollFateByProgression(state, source, options)` hoặc API tương đương:

```js
rollFateByProgression(state, {
  source,
  gradeCap,
  minimumGrade,
  pathAffinity: true|false,
  pityKey,
  allowUniqueTien: false
})
```

Resolver thực hiện theo thứ tự:

1. xác định realm level và bảng trọng số;
2. áp dụng source modifier, cap/minimum và path affinity nếu có;
3. loại ID đã sở hữu, bị khóa độc bản hoặc không còn khả dụng;
4. nếu grade hết entry, dồn trọng số về grade liền kề thấp hơn còn entry;
5. chọn grade trước, chọn đều entry trong grade;
6. gọi `receiveFate()` để transaction vào Mệnh Kho/pending;
7. xử lý duplicate, unique lock và reward summary;
8. ghi source, grade, destination và lý do vào history.

### 4.2. Duplicate

- Không tạo instance thứ hai cùng `fateId` trên cùng nhân vật.
- Phàm/Linh/Hoàng trùng: tự chuyển thành `Tinh Hoa Dư`.
- Huyền trở lên trùng: mở lựa chọn nhận Tinh Hoa Dư hoặc giao dịch/tặng theo nguồn được phép; không tự quy đổi im lặng.
- Tiên không dùng duplicate flow thường; xử lý theo unique ownership.

### 4.3. Tiên độc bản

`than_dao_151` là entry Tiên duy nhất. Nếu có backend/server: dùng `serverUniqueFateOwnership[fateId] = characterId|null`, transaction lock trước khi trao. Nếu game single-player: dùng ownership trong world/save nhưng không giả vờ là server-wide.

Khi Tiên đã có chủ, loại khỏi mọi roll thường; UI có thể hiển thị “Đã có chủ”. Khi chủ mất Mệnh theo một luật đã được game định nghĩa, ownership mới được giải phóng. Không tự giải phóng khi chỉ reload save.

---

## 5. Active, Mệnh Kho, Fate Instance và migration

### 5.1. Luật hiệu lực

- `state.player.fates[]`: ID Mệnh đang active, tính stats/score/match/relations/combo.
- `state.fateInventory[]`: ID Mệnh trong Mệnh Kho, không tính hiệu lực.
- `pendingFateReward(s)`: phần thưởng chưa đưa vào kho vì đầy.
- Capacity = `2 × số active slots đã mở`, có migration bảo toàn dữ liệu.

Catalog là definition dùng chung; relationship stage, insight, stagnant days và timestamp là metadata của instance nhân vật, không ghi vào catalog.

Để không phá save ID hiện tại, dùng adapter:

```js
state.player.fateInstances[fateId] = {
  fateId, relationshipStage: 0, relationshipPoints: 0,
  firstAcquiredAt, lastActiveAt, lastActiveStreakDays: 0,
  stagnantDays: 0, insightRevealed: false
}
```

Nếu tương lai cho phép cùng ID nhiều instance, chuyển key sang instance ID; hiện tại duplicate bị chặn nên `fateId` là key tương thích.

### 5.2. Migration invariant

- thiếu mảng thì tạo rỗng;
- ID không tồn tại bị loại nhưng phải ghi warning;
- không mất Mệnh khi kho đầy; dùng pending;
- migration nhiều ô ↔ một ô phải giữ Mệnh mạnh nhất/được chọn và đưa phần còn lại vào kho;
- `validateFateInventory()` chạy trong `updateDerived`;
- save version 12 adapter `player.fate.vaultIds` ↔ `state.fateInventory` phải giữ nguyên.

---

## 6. Match, score, stats và tương hợp Con Đường

`match_score` độc lập với `normal_fate_score` và `total_fate_score`.

- 0: Tuyệt Không, vẫn cho trang bị nhưng là off-build;
- 1–2: Xa Lạ, có penalty/rủi ro;
- 3–4: Tương Hợp, không bonus lớn;
- 5–7: Tương Hợp Cao;
- 8–9: Tương Sinh;
- 10: Đại Đạo Tương Sinh, mở ngưỡng combo/hiệu ứng đặc biệt.

Khi có tags/path affinity, công thức nền là `3 × lead + 1 × support − 2 × forbidden`, sau đó clamp 0–10 và áp dụng rule đặc biệt của Con Đường. Không cho UI tự tính lại.

`normal_fate_score` chỉ tính Mệnh thường và modifier hợp lệ; `total_fate_score` tính quan hệ/combo/hiệu ứng đặc biệt; Mệnh Kho không đóng góp.

Gate đột phá dùng score/match theo `ARCHIVE_BREAKTHROUGH_RITUAL_DETAIL.md`: Gọi Mệnh → Đối Chiếu Con Đường → Dựng Neo → Vượt Dị Tượng → Trả Giá → Thử Thách theo cấp đích. Cấp thấp chỉ mở prefix cần thiết.

---

## 7. Quan hệ Mệnh–Mệnh và Nhân Vật–Mệnh

### 7.1. Quan hệ normalized

- `pairwise_relationships`: 13.976 cạnh hiện có;
- `combo_sets`: 150 combo;
- `fusion_recipes`: 78 công thức;
- chỉ xét Mệnh active, không xét Mệnh Kho;
- combo cũ mặc định `minRelationshipStageRequired = null` để không phá hành vi;
- mọi tier/type cross-schema đi qua map canonical.

### 7.2. Bậc quan hệ instance

| Bậc | Tên | Điều kiện |
|---:|---|---|
| 0 | Sơ Ngộ | hiệu ứng gốc |
| 1 | Đồng Hành | active qua elite/boss hoặc active liên tục 7 ngày |
| 2 | Tương Ứng | ít nhất 3 lựa chọn quest/hội thoại cùng hướng alignment khi active |
| 3 | Cộng Minh | action `RESONATE`, match ≥ 8, đủ SAN, đang active |
| 4 | Nhân Mệnh Hợp Nhất | Cộng Minh + đột phá thành công lên cấp mới khi vẫn active xuyên nghi thức |

Hiệu ứng bậc: 0 = 100%; 1 = +5% modifiers; 2 = +10% và xem potential; 3 = +20% và mở resonance effect; 4 = +35%, không tháo/hi sinh/dung hợp được nữa.

`NURTURE_FATE` chỉ chạy với active, có cost/cooldown/diminishing return; không thay thế hành vi thật. `RESONATE` chỉ trừ SAN sau khi đủ điều kiện và thực sự bắt đầu nghi thức.

Suy giảm quan hệ khi để trong Vault quá 30 ngày là **CHỜ DUYỆT**, chưa được code.

---

## 8. Bốn logic bổ sung

### 8.1. Fate Whisper

`insightRevealed=false` khi nhận. Khi `Ngoại Tính/Ngộ Tính >= 60` hoặc stage >= 2, lần đầu mở chi tiết sẽ mở diễn giải Giác Ngộ vĩnh viễn. Sinh text từ concept1/concept2; ưu tiên review thủ công nhóm Địa+ từ `resonance_effects_v2.json`/metadata. Mệnh Hung hoặc concept u ám khi reveal sẽ đánh dấu forbidden knowledge theo `WORLDVIEW_ATMOSPHERE.md`; không tạo corruption stat thứ hai.

### 8.2. Mệnh Nguội

Metadata `stagnantDays` tăng khi active liên tục nhưng stage không đổi. Từ 60 ngày game, chỉ hiển thị cảnh báo và mở action “Buông Mệnh”; không debuff tự động. Buông trả về Tinh Hoa Dư, không mất phí. Ngưỡng 60 ngày vẫn cần playtest nhưng là default rule được ghi nhận.

### 8.3. Tinh Hoa Dư

Là kết quả duplicate hoặc Buông Mệnh, dùng cho Dưỡng Mệnh và/hoặc Hư Thiên Đỉnh sau khi chốt tỷ lệ quy đổi. Không được tự tạo tài nguyên nếu transaction nhận thưởng thất bại.

### 8.4. Unique Tiên

Tuân mục 4.3. Không dùng tỷ lệ Tiên 1% trong reward thường dù một số tài liệu cũ từng đề xuất; chỉ nguồn đặc biệt được phép mở khóa.

---

## 9. Nguồn nhận Mệnh Số và contract

| Nguồn | Contract canonical |
|---|---|
| Khởi tạo | 5 Mệnh không trùng, tổng điểm > 5, cap cao nhất Hoàng; dùng 65/30/5 riêng |
| Con Đường | quà tương hợp, đưa vào Vault/pending, không tự active |
| Combat elite/boss | resolver theo cấp + source modifier, history phải báo phẩm và điểm đến |
| Search/Map clue | reward chuẩn, pending khi kho đầy; có merit nếu tài liệu event quy định |
| Quest/Cơ Duyên | reward definition có thể có cap/minimum, không roll mù |
| Online/AFK | theo cấp hiện tại và interval game clock; reward summary rõ destination |
| Phường Thị | refresh 60 giây theo market state, giá theo grade/source; không hardcode chỉ Phàm |
| Công Đức | offer theo quan hệ/grade/cap, đổi trực tiếp phải chống trùng |
| Khâm Thiên Giám | fixed 10 năm hoặc 1/10 thọ nguyên, neo dominant grade, cơ hội +1 thấp |
| Hư Thiên Đỉnh | nhận quantity thật, lọc material an toàn, cap theo số lượng/phẩm nguyên liệu, rollback |
| Luân Hồi | giữ một Mệnh mạnh nhất theo luật hiện hành, không reset nhầm unique ownership |

Các event `RANDOM_EVENT_SYSTEM.md` có reward Mệnh phải gọi cùng resolver; không dùng thang tier legacy. NPC Nghịch Thương Nhân cấp 6–8 nếu giữ feature phải dùng grade `thien/thanh/tien` theo map canonical, giá và điều kiện riêng, không tự chuyển sang tier cũ.

---

## 10. Action, UI và transaction

Action chuẩn: `EQUIP_FATE`, `UNEQUIP_FATE`, `READ_FATE/QUAN_MENH`, `CHANGE_FATE`, `SACRIFICE_FATE`, `FUSE_FATE`, `NURTURE_FATE`, `RESONATE`.

Action phase 3 `DEFY_FATE`, `SUPPRESS_FATE`, `HEAVENLY_OMEN`, `FATE_TRANSFORM` chỉ là roadmap **CHỜ DUYỆT**, không giả vờ hoạt động.

UI bắt buộc:

- thẻ active hiển thị grade, sign, match, normal/total score, modifiers, conditional effects, stage và trạng thái Nguội;
- thẻ Vault hiển thị rõ “không cộng stats”, nguồn nhận, grade và nút trang bị/thay thế;
- khi active đầy, cho tháo/thay thế có preview before/after;
- upgrade phải báo vật liệu đã trừ, level trước/sau, score/effect trước/sau;
- merge/dung luyện hiển thị quantity thật, không đếm mỗi loại là 1;
- pending reward luôn có nút nhận/thay thế/từ chối với hậu quả rõ;
- action bị khóa hiển thị blocker ngay cạnh nút;
- mọi action nguy hiểm có confirm và rollback transaction.

Action Hybrid dùng `fate_token`/Mệnh Kho tách khỏi inventory vật lý, nhưng dùng chung resolver UI theo context. Không để UI map grade/type riêng.

---

## 11. Lộ trình triển khai

### Gate 0 — data và schema

1. QA `fate_data_with_tags.json`, `sample_review.json`, element/tags coverage.
2. Tạo catalog 10.000 entry theo bảng 50/25/12/7/4/1,5/0,49/0,01; giữ ID ổn định.
3. Merge resonanceEffect đúng ID; chuẩn hóa object số nếu cần.
4. Kiểm tra relationships không trỏ ID thiếu; map grade/tier/sign/type.
5. Sinh report count/duplicate/unique Tiên trước khi thay file runtime.

### Phase 1 — runtime roll và migration

1. Implement resolver chọn grade trước rồi entry.
2. Chuyển combat/map/quest/online/market/merit/cauldron qua resolver hoặc contract riêng đã quy định.
3. Duplicate, pending, fallback và unique lock.
4. Save migration và invariant tests.

### Phase 2 — relationship/UI

1. Fate instance metadata/stage.
2. Nurture/resonate, resonanceEffect, Fate Whisper, Mệnh Nguội.
3. Preview/transaction/UI đồng bộ.

### Phase 3 — mở rộng sau khi duyệt

Chỉ triển khai sau approval riêng cho từng action: Nghịch Mệnh, Trấn Mệnh, Thiên Cơ, Mệnh Đổi và suy giảm stage trong Vault.

---

## 12. Test và acceptance

- Catalog đúng 10.000 entry và đúng bảng grade mới; Tiên đúng 1 entry.
- Không ID duplicate; relationships/combo/fusion đều trỏ ID tồn tại.
- Save cũ load được, active/Vault/pending/enhancement/relationship metadata không mất.
- Mệnh Kho không thay đổi stats, score, match hoặc combo.
- Roll grade qua seed/Monte Carlo tối thiểu 100.000 lượt mỗi bucket; sai số không quá ±1 điểm phần trăm.
- Cấp 3–4 không còn sampling mặc định 80% Phàm; target canonical là 15% Phàm ở reward thường.
- Tiên không rơi từ reward thường và unique lock không race/duplicate.
- Duplicate Phàm–Hoàng chuyển Tinh Hoa Dư; Huyền+ có lựa chọn.
- Hư Thiên Đỉnh tính đúng quantity và rollback khi nhận Mệnh thất bại.
- UI hiển thị before/after, blocker, source, grade, destination và trạng thái pending.
- `node --check js/engine.js`, `node --check js/ui.js`, `node --check js/main.js`, `node tools/verify_game.js`, `git diff --check` đều đạt.

---

## 13. Các điểm không được tự ý quyết định

- Không dùng lại bảng 80% catalog như tỷ lệ loot.
- Không lấy bảng 40/35/20/5 cũ làm canonical sau khi người dùng đã chốt giảm Phàm.
- Không code Phase 3 khi chưa có approval riêng.
- Không tự bật suy giảm relationship stage trong Vault.
- Không tạo 10.000 resonance effect thủ công; dùng data staging và ưu tiên nhóm Địa+.
- Không xóa hoặc đổi ID đã có trong save để đạt tỷ lệ mới.
- Không đưa file trong `fate_system_update/` trực tiếp vào browser nếu chưa build thành runtime asset.

**Đây là rule chính cho mọi task FATE_UPDATE_SYSTEM tiếp theo. Mọi thay đổi code/data phải đối chiếu file này và cập nhật rule nếu làm thay đổi quyết định canonical.**

---

## 14. Chiến lược thay đổi catalog và phương án regrade trực tiếp

Phần này bổ sung phương án triển khai để AI không tự overwrite dữ liệu cũ khi thay đổi phân bố phẩm cấp.

### 14.1. Phương án 1 — giữ catalog, chỉ đổi trọng số roll

Giữ nguyên `data/fate_data.js`, ID, grade, effect và relationship. Thêm resolver chọn grade theo bảng mục 3.2. Đây là phương án an toàn mặc định và không cần migration save.

### 14.2. Phương án 2 — catalog versioning v1/v2

Giữ catalog v1 cho save cũ, tạo catalog v2 và relationship v2 cho nhân vật/world mới:

```text
data/fate_data_v1.js
data/fate_relationships_v1.js
data/fate_data_v2.js
data/fate_relationships_v2.js
state.meta.fateCatalogVersion = 1 | 2
```

ID v1 không bị tái sử dụng cho entry có nghĩa mới. Engine chọn catalog theo version của save/world. Đây là phương án phù hợp khi muốn thay đổi nội dung lớn nhưng vẫn bảo toàn save cũ.

### 14.3. Phương án 3 — regrade trực tiếp catalog hiện tại (controlled migration)

Phương án này **được phép triển khai trong tương lai**, nhưng không được chạy trực tiếp trên working tree/live data. Nó chỉ được thực hiện sau khi hoàn tất toàn bộ Phase 3 dưới đây và có snapshot rollback.

Mục tiêu là đưa catalog hiện tại về phân bố 10.000 entry:

```text
Phàm 5.000 · Linh 2.500 · Hoàng 1.200 · Huyền 700
Địa 400 · Thiên 150 · Thánh 49 · Tiên 1
```

#### Quy tắc bất biến

1. Không đổi `id` của bất kỳ entry nào.
2. Không đổi `name`, `effects`, `score`, `desc`, `sign` nếu không có migration record riêng.
3. Không chuyển grade tùy tiện các Mệnh đã được người chơi sở hữu mà chưa có chính sách bù/giữ quyền lợi.
4. Không xóa entry đang được tham chiếu trong active, Vault, pending reward, quest, combo, fusion hoặc relationship.
5. Entry Tiên duy nhất vẫn phải là cùng một ID `than_dao_151` và luôn qua unique lock.
6. Mọi thay đổi grade phải có `fate_regrade_manifest.json` ghi `id`, `oldGrade`, `newGrade`, `reason`, `affectedSystems`, `rollbackGrade`.

#### Cách thực hiện regrade

- Tạo snapshot bất biến của `fate_data.js`, `fate_relationships.js`, path mapping và mọi save trước khi chạy.
- Tính chênh lệch số lượng theo grade; chỉ chọn các entry chưa từng xuất hiện trong save production để chuyển grade trước.
- Nếu vẫn thiếu quota, chuyển các entry phổ thông chưa có quan hệ đặc biệt; không chuyển entry có `fusion`, `combo`, `hidden fate`, `resonanceEffect` hoặc đang được quest tham chiếu nếu chưa regenerate dependency.
- Ưu tiên chuyển theo thứ tự Phàm → Linh → Hoàng → Huyền → Địa → Thiên → Thánh; không tự tạo thêm Tiên.
- Khi chuyển grade, cập nhật `gradeLabel` và mọi chỉ mục/cache theo grade; giữ nguyên ID và các field gameplay khác.
- Regenerate hoặc migrate `pairwise_relationships`, `combo_sets`, `fusion_recipes` nếu dependency dùng tier/grade của entry bị chuyển.
- Recalculate các bảng offer/market/merit/cauldron không lưu cứng kết quả cũ.
- Với save cũ, ghi `state.meta.fateRegradeVersion` và áp dụng chính sách compensation đã duyệt; không âm thầm làm giảm Mệnh đang active.

#### Chính sách người chơi khi entry đang sở hữu bị regrade

Mặc định chọn **grandfathering**: instance đã sở hữu giữ `effectiveGradeAtAcquisition`, còn catalog mới dùng grade mới cho những lần roll sau. Nếu muốn đồng bộ grade mới cho instance cũ, phải chọn một chính sách rõ ràng trước rollout:

- giữ nguyên chỉ số/grade cũ vĩnh viễn;
- cập nhật grade và bù Tinh Hoa Dư/nguyên liệu tương ứng;
- đóng băng instance cũ thành legacy definition, chỉ entry mới dùng catalog mới.

Không được trộn các chính sách trong cùng một world.

---

## 15. Phase 3 — kế hoạch triển khai regrade trực tiếp

Phase 3 chỉ áp dụng cho Phương án 3. Nếu chưa được bật cờ rollout, hệ thống tiếp tục dùng Phương án 1 hoặc 2.

### Phase 3.0 — khóa thay đổi và snapshot

1. Freeze catalog/relationship/save trong lúc tạo migration.
2. Tạo snapshot có checksum SHA-256 cho `fate_data.js`, `fate_relationships.js`, path mapping và toàn bộ save production.
3. Tạo `fate_regrade_manifest.json`, `fate_regrade_report.json` và thư mục rollback chỉ đọc.
4. Gán `catalogVersion`, `regradeVersion` và `migrationRunId`; mọi kết quả phải truy vết được.

### Phase 3.1 — phân tích dependency

1. Index toàn bộ reference tới `fateId` trong active, Vault, pending, quest, market, black market, merit, combo, fusion, hidden fate, relationship và sample save.
2. Phân loại entry: `owned`, `referenced`, `special`, `free`.
3. Chỉ nhóm `free` được chuyển grade tự động. Nhóm còn lại phải có mapping và compensation.
4. Kiểm tra tổng quota mới đúng 10.000 và Tiên đúng 1.

### Phase 3.2 — lập kế hoạch chuyển grade

1. Tính `deltaByGrade = targetCount - currentCount`.
2. Chọn ứng viên theo deterministic seed để chạy lại cho cùng kết quả.
3. Ưu tiên entry chưa sở hữu, không có dependency quan hệ đặc biệt và không có effect duy nhất.
4. Sinh manifest trước, chưa ghi đè catalog.
5. Sinh preview report: count trước/sau, danh sách ID đổi grade, dependency bị ảnh hưởng và compensation dự kiến.
6. Dừng Phase 3 nếu có ID active/pending bị mất, score/effect bị thay đổi ngoài manifest hoặc quota không khớp.

### Phase 3.3 — migrate catalog và relationship

1. Áp dụng manifest lên bản sao catalog.
2. Cập nhật `gradeLabel`, grade index và các bảng roll/cache.
3. Kiểm tra lại `GRADE_TO_TIER`/`TIER_TO_GRADE` và mọi combo/fusion có tier cũ.
4. Regenerate relationship output từ catalog sau regrade hoặc tạo migration map tương ứng; không trộn output v1/v2.
5. Chạy schema audit: ID tồn tại, không duplicate, sign hợp lệ, effect hợp lệ, Tiên duy nhất.

### Phase 3.4 — migrate save và compensation

1. Load save vào bản sao, không mutate file gốc.
2. Gắn `fateRegradeVersion` và `effectiveGradeAtAcquisition` theo chính sách đã duyệt.
3. Bảo toàn active/Vault/pending/enhancement/relationship stage.
4. Nếu grade instance bị giảm, bù Tinh Hoa Dư hoặc vật liệu theo manifest; không giảm im lặng tổng quyền lợi.
5. Validate rồi mới ghi save migrated; save lỗi được đưa vào quarantine để rollback thủ công.

### Phase 3.5 — kiểm thử và rollout

1. Chạy unit test migration trên save rỗng, save cũ, save có Mệnh active/Vault/pending, save có duplicate và save có Tiên.
2. Chạy relationship/combo/fusion audit sau regrade.
3. Chạy Monte Carlo reward theo cấp và kiểm tra bảng mục 3.2 không bị catalog size lấn át.
4. Canary rollout trên một world/save thử nghiệm; theo dõi lỗi resolve ID, reward, stats và UI.
5. Chỉ rollout production sau khi checksum, report và canary đạt acceptance.

### Phase 3.6 — rollback

Rollback ngay nếu có mất ID, sai quota, thay đổi stats ngoài manifest, relationship trỏ ID thiếu, unique Tiên bị nhân bản hoặc save không load được.

1. Tắt cờ `regradeEnabled`.
2. Khôi phục catalog/relationship từ snapshot checksum.
3. Khôi phục save từ snapshot hoặc chạy reverse manifest theo `rollbackGrade`.
4. Xóa cache/index sinh sau migration.
5. Ghi incident report và không chạy lại cùng manifest cho tới khi nguyên nhân được sửa.

### Phase 3 acceptance

- Catalog đúng 10.000 entry theo bảng 50/25/12/7/4/1,5/0,49/0,01.
- Không đổi ID và không có reference tới ID thiếu.
- Active/Vault/pending/enhancement/relationship của save cũ không mất.
- Mọi regrade có manifest và compensation hoặc grandfathering rõ ràng.
- Relationship/combo/fusion sau migration nhất quán với tier mới.
- Tiên vẫn chỉ có một entry và unique lock không bị bypass.
- Rollback phục hồi được catalog và save về checksum trước migration.

**Phase 3 là kế hoạch triển khai, không phải lệnh chạy ngay. AI chỉ được thực hiện sau khi có approval rollout rõ ràng cho Phương án 3.**

---

## 16. Audit dữ liệu và runtime thực tế — 2026-09-08

Phần này là trạng thái kiểm chứng trực tiếp trong workspace. Nó phân biệt **đang có thật**, **đang staging** và **mới là rule thiết kế**.

### 16.1. Catalog runtime hiện tại

`data/fate_data.js` hiện có đúng 10.000 entry, nhưng vẫn là phân bố cũ:

```text
phan 8000 · linh 1500 · hoang 250 · huyen 120
dia 70 · thien 50 · thanh 9 · tien 1
```

Catalog runtime hiện chỉ có các field:

```text
id, name, sign, grade, gradeLabel, score, effects, desc
```

Chưa có trực tiếp `tags`, `element` hoặc `resonanceEffect`.

`fate_system_update/fate_data_with_tags.json` có đủ 10.000 ID khớp catalog runtime, nhưng vẫn mang phân bố cũ 80/15/2,5/...; đây là staging data, chưa được nạp trong `index.html`. Audit staging ghi nhận:

- `tags` trống ở 1.266/10.000 entry;
- 36 tag khác nhau;
- element: `vo_he` 7.938, `tho` 762, `kim` 400, `moc` 300, `thuy` 300, `hoa` 300;
- dữ liệu tags có false-positive keyword đã được ghi trong prompt wiring, phải review trước production.

`sample_review.json` có 15 mẫu QA; `resonance_effects_v2.json` có 130 entry, đúng các grade `dia/thien/thanh/tien` (70/50/9/1), chưa merge vào runtime.

### 16.2. Quan hệ và mapping

`data/fate_relationships.js` là output hiện tại từ `fate_data_10000`:

- 13.976 `pairwise_relationships`;
- 13.874 `TUONG_SINH`, 102 `TUONG_KHAC`;
- 150 `combo_sets`;
- 78 `fusion_recipes`;
- audit ID: không có pair/combo/material/result trỏ tới ID thiếu.

Quan hệ dùng `tier` số và `type` nhãn, trong khi catalog dùng `grade` và `sign`; engine bắt buộc qua map canonical. Không được regenerate quan hệ từ catalog 50% nếu chưa có manifest/review vì thay đổi grade có thể làm đổi tier điều kiện combo/fusion.

`data/path_fate_relations.json` có 10 Con Đường ràng buộc và `ngoai_dao_gia` unbound; mỗi path có `lead/support/forbidden`. File runtime `.js` là bridge được index nạp. `fate_data_with_tags.json` chưa được nối vào bridge nên hiện engine vẫn suy luận tags từ name/type/effects/desc và element bằng keyword fallback.

### 16.3. Cảnh giới, save và schema thật

- `data/canh_gioi_tien_hiep.json` là nguồn chuẩn 14 cấp phẳng, từ `di_menh` đến `dao_ngoai`.
- Cấp 3 là `dung_thai`, cấp 4 `kim_an`, cấp 5 `anh_linh`, cấp 6 `than_tinh`; cấp 7 bắt đầu có `minNormalFate`.
- Save runtime version 12 lưu `player.fate.equippedIds`, `vaultIds`, `vaultCapacity`, `total`, `normal`, `ratioR`, `debt`, `surplus`, `pacts`, `enhancements`; engine adapter chuyển `vaultIds` thành `state.fateInventory`.
- Save hiện chưa có metadata đầy đủ `fateInstances`, `relationshipStage`, `insightRevealed`, `stagnantDays` hoặc `effectiveGradeAtAcquisition`; Phase 2 phải migration bổ sung mà không phá format version 12.
- Save mẫu hiện có `than_dao_151`; migration unique lock phải grandfather chủ sở hữu hiện tại, không invalid một save hợp lệ.

### 16.4. Runtime đang thiếu so với rule

Các điểm sau **chưa được coi là đã triển khai** chỉ vì tài liệu đã mô tả:

1. Chưa có resolver chọn grade trước rồi entry; combat, map clue và online còn lọc pool rồi chọn đều.
2. `processOnlineFateReward()` hiện cap tối đa tier 3 và chưa dùng bảng reward canonical theo cấp.
3. `receiveFate()` chống duplicate bằng cách từ chối; chưa có Tinh Hoa Dư/duplicate policy.
4. Chưa có server-wide unique ownership cho Tiên.
5. `mergeFates()` hiện chỉ có rank đến Thiên và chọn pool ngẫu nhiên; chưa phải fusion recipe normalized đầy đủ.
6. `fateDefinition()` đã có split effects, map sign/grade, element/path fallback; nhưng chưa đọc staging tags/element/resonanceEffect.
7. Quan hệ `nurture/resonate` có nền runtime nhưng metadata instance, điều kiện/hiệu ứng theo rule cần audit lại trước khi bật production.
8. Các offer market/merit/black market và cauldron còn có filter grade riêng; phải đưa vào source matrix/resolver khi triển khai Phase 1.

### 16.5. Quyết định data migration sau audit

Do catalog 50% chưa tồn tại trong runtime và save đã có ID thật, mặc định triển khai là **Phương án 1 — giữ catalog cũ, áp dụng reward weights trước**. Phương án 3 chỉ được chạy qua Phase 3 controlled migration, không overwrite trực tiếp.

Nếu chấp thuận catalog 50% về sau:

- phải chọn rõ Phương án 2 hoặc 3;
- không dùng `fate_data_with_tags.json` staging làm catalog production nguyên trạng vì nó vẫn là phân bố 80%;
- phải merge tags/element/resonance sau QA, rồi mới build catalog target;
- relationship output phải gắn `catalogVersion` và được audit lại;
- save có Tiên/grade cũ phải grandfather hoặc compensation theo manifest.

---

## 17. Checklist chuẩn hóa trước khi code FATE_UPDATE_SYSTEM

### Gate A — dữ liệu

- [ ] Chốt Phương án 1, 2 hoặc 3; không vừa đổi weights vừa regrade mà không version.
- [ ] Catalog target 50/25/12/7/4/1,5/0,49/0,01 có report count.
- [ ] Tags/element đạt coverage đã duyệt; review false-positive và 1.266 tag trống.
- [ ] 130 `resonanceEffect` match ID và có schema effect rõ ràng.
- [ ] Relationship audit giữ 13.976/150/78 hoặc có manifest thay đổi.
- [ ] Path mapping 10 path + unbound được giữ nguyên.

### Gate B — engine

- [ ] Resolver grade-first/source-aware và fallback khi grade hết.
- [ ] Tất cả nguồn nhận Mệnh dùng source matrix.
- [ ] Duplicate/Tinh Hoa Dư/pending/unique lock có transaction.
- [ ] `fateDefinition()` là API duy nhất cho grade/sign/element/path/effects.
- [ ] Mệnh Kho không ảnh hưởng stats/score/match/combo.

### Gate C — save/UI

- [ ] Adapter save v12 giữ nguyên equipped/vault/enhancements.
- [ ] Metadata instance có default/migration rõ ràng.
- [ ] Save đang sở hữu `than_dao_151` không bị mất hoặc bị khóa sai.
- [ ] UI hiển thị source, grade, score, match, effect before/after và pending.
- [ ] Upgrade/merge/cauldron xử lý quantity và rollback.

### Gate D — test

- [ ] Schema/ID/relationship audit.
- [ ] Monte Carlo theo cấp và source, không bị catalog size lấn át.
- [ ] Test 14 cấp, 10 path, Ngoại Đạo Giả, duplicate, pending, unique Tiên và save cũ.
- [ ] `node --check` cho engine/UI/main và `node tools/verify_game.js`.

**Audit này là phần bổ sung bắt buộc của rule: tài liệu thiết kế không được coi là bằng chứng runtime đã hoàn thành.**

## 18. PHASE 3 NORMALIZATION STATUS (2026-09-08)

- [x] Phương án 3 đã chạy với manifest `phase3-20260908` và backup rollback.
- [x] Runtime catalog và staging catalog cùng đạt 10.000 entry theo tỷ lệ 50/25/12/7/4/1,5/0,49/0,01.
- [x] ID runtime/staging khớp 100%; tags, element và 130 resonance effects đã được hợp nhất.
- [x] Relationship audit giữ 13.976 pairwise, 150 combo và 78 fusion; không có reference ID hỏng.
- [x] Resolver grade-first đã nối vào online, map clue, combat, breakthrough, Qintian, cauldron và fusion.
- [x] Duplicate/Tinh Hoa Dư, unique Tiên, metadata instance, save migration và UI source/essence đã được triển khai.
- [x] `index.html` chỉ load catalog/relationship/path bridge runtime; staging và backup không được load.
- [x] Legacy generators chuyển output sang `fate_system_update/generated/`, không còn ghi đè catalog runtime.
- [x] Đã chạy schema/ID audit, `node --check` và `node tools/verify_game.js`.
