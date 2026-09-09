# FATE SYSTEM — REQUIREMENTS TỔNG HỢP

**Ngày hợp nhất:** 2026-09-09  
**Phạm vi:** toàn bộ tính năng Mệnh Số/FATE trong game Ancient Taoist Realm.

Tài liệu này là bản tổng hợp chức năng duy nhất để tra cứu nhanh. Các tài liệu phân tích chi tiết (`FATE_UPDATE_SYSTEM_RULE.md`, `FATE_SYSTEM_COMPLETE.md`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_NEW_LOGIC_ADDENDUM.md`, `FATE_GRADE_WEIGHT_BY_LEVEL.md`) được giữ lại để audit nguồn; khi có khác biệt, ưu tiên quyết định mới nhất trong tài liệu này và code `js/engine.js`.

## 1. Kiến trúc và nguồn dữ liệu

- `data/fate_data.js`: catalog canonical 10.000 Fate (`id`, `name`, `grade`, `sign`, `score`, `effects`, `desc`).
- `data/fate_relationships.js`: pairwise relationship, combo set và fusion recipe.
- `data/path_fate_relations.js`: Con Đường, affinity tags, forbidden tags và hidden fate.
- `state.player.fates`: Fate đang kích hoạt; chỉ nhóm này tạo stat, score, affinity, relationship và combo.
- `state.fateInventory`: Mệnh Kho; không tạo hiệu lực gameplay.
- `state.player.fateInstances` và `state.player.fateRelationships`: tiến trình instance/quan hệ.
- `state.pendingFateRewards`: phần thưởng chờ khi Mệnh Kho đầy.

Engine là nguồn tính toán duy nhất. UI không tự tính điểm hoặc affinity.

## 2. Chuẩn hóa schema

Engine dùng các map duy nhất:

```js
GRADE_TO_TIER = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 }
SIGN_TO_TYPE_LABEL = { cat: "Cát Cách", binh: "Bình Cách", hung: "Hung Cách" }
```

`fateDefinition()` cung cấp alias `alignment`, `tier`, `element`, `path_affinity`, `modifiers` và `conditionalEffects`. `effects` được tách thành modifier trực tiếp và hiệu ứng theo ngữ cảnh; không sửa catalog gốc ở runtime.

## 3. Roll và nhận Fate

Mọi reward thông thường gọi `rollFateByProgression(state, options)` theo luồng:

1. Chọn grade theo cấp nhân vật và bảng trọng số.
2. Áp dụng `gradeCap`, `minimumGrade`, source modifier và loại Fate đã sở hữu/khóa.
3. Nếu grade hết entry khả dụng, dồn trọng số sang grade còn lại.
4. Chọn đều một entry trong grade.
5. Gọi `receiveFate()` để xử lý active/vault/pending.

Trọng số canonical (Phàm→Tiên):

| Cấp | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–2 | 65 | 30 | 5 | 0 | 0 | 0 | 0 | 0 |
| 3–4 | 15 | 45 | 25 | 10 | 5 | 0 | 0 | 0 |
| 5–6 | 5 | 20 | 35 | 25 | 10 | 5 | 0 | 0 |
| 7–8 | 2 | 10 | 25 | 30 | 20 | 10 | 3 | 0 |
| 9+ | 1 | 5 | 15 | 25 | 25 | 18 | 11 | 0 |

Fate Tiên là entry độc bản trong single-save (`state.meta.uniqueFateOwnership`). Duplicate Phàm/Linh/Hoàng đổi thành Tinh Hoa Dư theo tỷ lệ 1/3/8; duplicate hiếm trả blocker rõ ràng. Kho đầy không làm mất reward: dùng pending hoặc thay thế có xác nhận.

## 4. Hiệu lực và tương hợp

- Active Fate mới đi qua `computeStats()` và `computeFate()`.
- Match 0 vẫn được trang bị, nhưng là off-build hợp lệ.
- `pathMatchSummary()` tính lead/support/forbidden; forbidden chỉ đến từ tag đã định nghĩa, không suy luận vì thiếu match.
- Pairwise relationship và combo chỉ xét active Fate.
- Fate bị Trấn Mệnh tạm thời bỏ khỏi stat pipeline đến `untilTurn`, không bị xóa.

## 5. Quan hệ nhân vật–Fate

Stage 0–4: **Sơ Ngộ → Đồng Hành → Tương Ứng → Cộng Minh → Nhân Mệnh Hợp Nhất**.

- `recordFateBehavior`: ghi hành vi tu luyện, combat elite/boss và lựa chọn aligned.
- Bậc 0→1: elite/boss hoặc active đủ 7 ngày.
- Bậc 1→2: ít nhất 3 lựa chọn aligned.
- Bậc 2→3: bắt buộc `resonateFate`, match ≥8 và đủ SAN.
- Bậc 3→4: gắn với đột phá thành công khi Fate vẫn active.

## 6. Dưỡng Mệnh

`nurtureFate(state, fateId)` chỉ áp dụng cho Fate active.

- Chi phí: `5 + relationshipStage × 5` Linh Thạch.
- Cooldown: mỗi Fate một lần/ngày game.
- Thành công: `relationshipPoints +1`, reset `stagnantDays`, ghi turn/day và history.
- Không đủ tài nguyên/còn cooldown: state không đổi.
- Dưỡng Mệnh chỉ hỗ trợ điểm; không được bỏ qua điều kiện hành vi để nhảy thẳng bậc cao.

## 7. Action nâng cao

| Action | Điều kiện và hiệu quả |
|---|---|
| Giác Ngộ | Ngộ Tính ≥60 hoặc stage ≥2; mở insight vĩnh viễn, Hung insight tăng tri thức cấm |
| Buông Mệnh | Active `stagnantDays ≥60`; tháo Fate và hoàn Tinh Hoa Dư |
| Nghịch Mệnh | Hung active; tốn 15 SAN, tăng bộ đếm defiance |
| Trấn Mệnh | Active; tốn 8 SAN, khóa hiệu lực tạm thời |
| Thiên Cơ | Tốn 5 SAN, cooldown 12 turn, trả blocker đột phá từ state thật |
| Cộng Minh | Stage 2, match ≥8, tốn 10 SAN, chuyển stage 3 |
| Mệnh Đổi | Stage 4 + Cường Hóa +5; dùng công thức biến thể ở mục 8 |

## 8. FATE_TRANSFORM / Mệnh Đổi

Mệnh Đổi tái sử dụng hệ thống `fateEvolutionBranches` làm catalog nhánh biến thể canonical.

Điều kiện:

- Fate đang active.
- Quan hệ Nhân Mệnh Hợp Nhất (stage 4).
- Cường Hóa Fate đạt +5.
- Có branch hợp lệ cho Fate/Con Đường.

Công thức chi phí theo `gradeTier`:

```text
Mệnh Tinh Hoa = 5 + 2 × gradeTier
Công Đức      = 10 + 5 × gradeTier
Thanh Tỉnh    = 10
```

`transformFate()` hỗ trợ preview candidate branch, hiển thị chi phí và commit qua `GameExpansion.evolveFate()`. Nhánh nguy hiểm bắt buộc xác nhận. Không tự sinh biến thể nếu catalog không có branch; trả blocker có thể truy vết.

## 9. UI và action wiring

Fate overlay hiển thị active/vault, grade, sign, score, match, effects, relationship và nguồn nhận. Các nút nâng cao được decorate động khi đủ điều kiện: Giác Ngộ, Buông Mệnh, Nghịch Mệnh, Trấn Mệnh, Mệnh Đổi. Thiên Cơ expose qua expansion command `fate_omen`.

## 10. Save, transaction và migration

Mọi action phải kiểm tra blocker trước, snapshot thay đổi cần thiết, commit nguyên tử và ghi log sau commit. Save cũ được migration về các field Fate hiện hành; không xóa Fate âm thầm. `validateFateInventory()` dùng để kiểm tra invariant active/vault.

## 11. API canonical

`fateDefinition`, `fateCompatibility`, `pathMatchSummary`, `rollFateByProgression`, `receiveFate`, `fateVaultSummary`, `equipFateFromVault`, `storeFateToVault`, `sacrificeFate`, `mergeFates`, `nurtureFate`, `recordFateBehavior`, `resonateFate`, `revealFateInsight`, `releaseStagnantFate`, `defyFate`, `suppressFate`, `heavenlyOmen`, `transformFate`.

## 12. Trạng thái và giới hạn

Đã triển khai và kiểm thử trong runtime hiện tại. Giới hạn còn lại là dữ liệu branch biến thể chưa có riêng cho từng 10.000 Fate và uniqueness Tiên chưa dùng server multiplayer thật.

Kiểm tra release:

```text
node --check js/engine.js
node --check js/expansion.js
node --check js/main.js
node tools/verify_game.js
```
