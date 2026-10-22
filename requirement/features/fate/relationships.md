# Mệnh Số — Quan hệ

## Mục đích

Hai loại quan hệ: Mệnh–Mệnh (Tương Sinh/Tương Khắc/Combo giữa các Mệnh active, từ dữ liệu) và Nhân Vật–Mệnh (bậc 0–4 theo hành vi), cùng các action Dưỡng Mệnh, Cộng Minh, Giác Ngộ, Mệnh Nguội/Buông Mệnh và tài nguyên Tinh Hoa Dư.

## Dữ liệu & trạng thái

```js
player.fateRelationships[fateId] = {
  stage: 0,               // 0..4, clamp
  points: 0, eliteTrials: 0, alignedChoices: 0, behaviorCount: 0,
  activeDays: 0, stagnantDays: 0,
  resonanceUnlocked: false, resonanceEffect: null,
  insightRevealed: false, insight: null,
  lastNurtureDay, lastNurtureTurn,
  nurtureHistory: [],     // giữ 30 bản ghi gần nhất
  resonanceHistory: [],
  decayPolicy: "none"
}
```
Field cũ `relationshipStage`/`relationshipPoints` được đọc như `stage`/`points`.

## Rules

### FATE-REL-001 Quan hệ Mệnh–Mệnh
Chỉ xét cặp/bộ mà mọi thành viên đều active:
| Loại | Hiệu ứng |
|---|---|
| `TUONG_SINH` | `phyMult`, `magMult` += `bonusPct/100` |
| `TUONG_KHAC` | `phyMult`, `magMult` −= `penaltyPct/100`; `madness` += `madnessDelta` (mặc định 5); `sanDrainMult` += 0,05 |
| Combo thường | `phyMult`, `magMult` += `bonusPct/100`; `fortune` += `fortuneBonus` |
| Combo `isNghich` | `allStatMult` += `bonusPct/100`; `madness` += `madnessDelta` |

### FATE-REL-002 Điều kiện quan hệ tối thiểu của combo
Combo có thể có `minRelationshipStageRequired` (0–4, áp lên mọi thành viên); thiếu/`null` = chỉ cần sở hữu đủ thành viên active. 150 combo hiện có không đặt field này.

### FATE-REL-003 Bậc Nhân Vật–Mệnh
| Bậc | Tên | Hệ số thêm (FATE-EFF-003) | Mở |
|---:|---|---:|---|
| 0 | Sơ Ngộ | 0 | — |
| 1 | Đồng Hành | +5% | — |
| 2 | Tương Ứng | +10% | Giác Ngộ (không cần Ngộ Tính), xem tiềm năng combo, cổng Cộng Minh |
| 3 | Cộng Minh | +20% | `resonanceEffect`, cổng Tiến Hóa |
| 4 | Nhân Mệnh Hợp Nhất | +35% | Mệnh Đổi (FATE-ADV-007) |

Quan hệ chỉ tiến triển khi Mệnh active; mọi thay đổi bậc ghi history.

### FATE-REL-004 Bậc 0→1
Khi `eliteTrials ≥ 1` (thắng tinh anh/boss khi Mệnh active) hoặc `activeDays ≥ 7`. Lên bậc reset `stagnantDays = 0`.

### FATE-REL-005 Bậc 1→2
Điều kiện (một trong hai), kiểm trong `recordFateBehavior` và tick ngày: `alignedChoices ≥ 3` **hoặc** `points ≥ 25` (đường bù để mọi Mệnh active đều đạt được bậc 2 dù ít gặp lựa chọn đạo đức). Lên bậc không reset `alignedChoices`.

Một "lựa chọn đạo đức" phát sinh từ đúng ba nguồn; engine gọi `recordFateChoice(state, { moral, uniqueKey })` (mới) một lần cho mỗi nguồn; hàm này lặp mọi Mệnh active, tính `aligned` theo bảng sign rồi gọi `recordFateBehavior(state, fateId, { kind: "choice", aligned, uniqueKey })` và (khi `aligned`, expansion đã nạp) `recordFateEvolutionProgress(state, "aligned", uniqueKey)`:
| Nguồn (hook) | Điều kiện | `moral` | `uniqueKey` |
|---|---|---|---|
| `recordRelationshipEvent` (mọi quest/hội thoại/quà qua đây; gọi sau khi event ghi thành công, không trùng) | tag `saved`, `kept_promise`, `shared_reward`, `supported_faction` | `thien` | `rel:<npcId>:<event.uniqueKey>` |
| như trên | tag `threatened`, `broke_promise`, `abandoned`, `used_forbidden_art` | `ac` | như trên |
| như trên | tag khác (`talked`, `sent_gift`, `heard_rumor`, `disturbed_sleep`, `shared_opportunity`) | không tính | — |
| `resolveContestedOpportunity` | `share` → `thien`; `fight`, `scheme` → `loi` | theo cột trái | `opp:<opportunity.id>` |
| `resolveMapEvent` | effect `spring`, `study`, `talk` → `thien`; `treasure`, `cave` → `loi` | theo cột trái | `mapevent:<pending.id>` |

| Sign của Mệnh | `aligned` |
|---|---|
| Cát | `moral === "thien"` |
| Hung | `moral === "ac"` hoặc `"loi"` |
| Bình | luôn `true` |

`recordFateBehavior` bỏ qua `uniqueKey` đã gặp (`record.behaviorKeys`, giữ 32 key gần nhất) và trả `{ changed: false, duplicate: true }`.

### FATE-REL-006 Bậc 2→3 và 3→4
2→3 chỉ qua Cộng Minh (FATE-REL-010). 3→4 chỉ qua commit Tiến Hóa Mệnh ([upgrade-replace-ritual.md](upgrade-replace-ritual.md#fate-upg-007-commit-tiến-hóa)). Không có trigger tự động khác. Mệnh có `fateCompatibility < 8` dừng ở bậc 2 (có chủ đích: cần Mệnh dẫn của Con Đường hiện tại để Cộng Minh). Mệnh Đổi không nâng bậc (FATE-ADV-007).

### FATE-REL-007 Bậc 4 không khóa thao tác
Mệnh bậc 4 vẫn tháo, hiến tế, dung hợp được theo luật thường; giới hạn riêng chỉ áp cho Mệnh đã Tiến Hóa (FATE-UPG-003).

### FATE-REL-008 Ghi hành vi
`recordFateBehavior(state, fateId, { kind, aligned, uniqueKey })` chỉ cho Mệnh active: `behaviorCount +1`; `points += aligned ? 1 : 0,25`; rồi kiểm tra FATE-REL-004/005. Bộ đếm theo bậc (tránh đếm kép với Mệnh Kiếp, nơi `eliteTrials`/`alignedChoices` được `startFateEvolutionTrial` reset và chỉ đổi qua `recordFateEvolutionProgress`):
| Bộ đếm | Tăng khi | Chỉ ở bậc |
|---|---|---|
| `eliteTrials +1` | `kind` là `elite` hoặc `boss` | 0 |
| `alignedChoices +1` | `kind === "choice"` và `aligned` | 1 |
Nguồn gọi: tu luyện (`cultivation`, aligned); combat thắng (`elite` khi địch tinh anh — cùng predicate `elite` đang dùng cho `recordFateEvolutionProgress`; `boss` khi độ khó ≥ 70; ngược lại `combat`); lựa chọn đạo đức theo FATE-REL-005 (`choice`). Mỗi lần thắng/tu luyện gọi một lần cho mỗi Mệnh active.

### FATE-REL-009 Dưỡng Mệnh
`nurtureFate(state, fateId)`: chỉ Mệnh active; chi phí `5 + 5 × stage` Linh Thạch; mỗi Mệnh 1 lần/ngày game (`lastNurtureDay`). Thành công: `points +1`, `stagnantDays = 0`, ghi turn/day/history, log. Thiếu tài nguyên/cooldown: state không đổi. Không tự đổi bậc.

### FATE-REL-010 Cộng Minh
`resonateFate(state, fateId)` điều kiện đồng thời: Mệnh active, `stage === 2`, `fateCompatibility ≥ 8`, SAN ≥ 10. Thiếu điều kiện → trả mọi blocker, không trừ SAN. Thành công: −10 SAN, `stage = 3`, `resonanceUnlocked = true`, chép `resonanceEffect` từ catalog (có thể null), ghi `resonanceHistory`.

### FATE-REL-011 Giác Ngộ (Fate Whisper)
`revealFateInsight(state, fateId)`: cần Ngộ Tính ≥ 60 hoặc `stage ≥ 2`. Lần đầu sinh dòng "Giác Ngộ" từ tối đa 2 khái niệm đầu của `desc`, lưu vĩnh viễn (`insightRevealed`, `insight`); lần sau trả lại insight cũ. Mệnh Hung: `player.forbiddenKnowledgeCount +1` đúng một lần khi reveal.

### FATE-REL-012 Mệnh Nguội và Buông Mệnh
Mỗi ngày game, mọi Mệnh active: `activeDays +1`, `stagnantDays +1`; lên bậc hoặc Dưỡng Mệnh reset `stagnantDays`. `stagnantDays ≥ 60` chỉ hiển thị cảnh báo "Mệnh Nguội" và mở `releaseStagnantFate`: tháo khỏi Ấn ký không qua kho, xóa quan hệ/instance, không phí, không phạt danh vọng, nhận Tinh Hoa Dư:
| phan | linh | hoang | huyen | dia | thien | thanh | tien |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 3 | 8 | 15 | 25 | 40 | 60 | 100 |

Không tự tháo, không debuff khi nguội.

### FATE-REL-013 Không suy giảm trong Mệnh Kho
`decayPolicy: "none"`: thời gian nằm trong kho không đổi bậc/điểm. Chỉ event gameplay hợp lệ thay đổi quan hệ. Mọi policy decay tương lai cần quyết định mới có rate, migration và regression.

### FATE-REL-014 Tinh Hoa Dư
Nguồn: trùng lặp Phàm/Linh/Hoàng (FATE-ROLL-007), Buông Mệnh (FATE-REL-012), thưởng `fate_affinity` của expansion. Dùng cho: chi phí Tiến Hóa/Mệnh Đổi (`essence`), Dung Hợp Con Đường (`../path/`). Không được sinh ra nếu giao dịch nhận thưởng thất bại.

## Acceptance

- Mệnh trong kho không tham gia FATE-REL-001 và không đổi bậc theo thời gian.
- Dưỡng Mệnh lần 2 cùng ngày bị chặn, không trừ Linh Thạch.
- Cộng Minh thiếu điều kiện không trừ SAN; đủ điều kiện → bậc 3.
- Buông Mệnh trước 60 ngày bị chặn; đủ 60 ngày trả Tinh Hoa Dư đúng bảng.
- Save round-trip giữ `fateRelationships`, history và `decayPolicy`.
- Tiến bậc (Mệnh Cát active, stage 0, `activeDays 0`): `recordFateBehavior(boss)` 1 lần → stage 1. Mệnh stage 1: 2 lựa chọn `thien` → `alignedChoices = 2`, vẫn stage 1; lựa chọn thứ 3 → stage 2. Cùng `uniqueKey` gọi lại → không đổi.
- Mệnh Hung stage 1: `moral = thien` → `aligned = false`, `alignedChoices` giữ nguyên, `points +0,25`; `moral = loi` → `aligned = true`.
- Mệnh Bình stage 1, `points = 24`, một hành vi aligned (+1) → `points = 25` → stage 2 dù `alignedChoices = 0`.
- Mệnh stage 3 đang trial: một lần thắng tinh anh tăng `eliteTrials` đúng +1 (không đếm kép).

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-REL-001 | `js/engine.js:computeRelationshipEffects` | Khớp |
| FATE-REL-002 | `js/engine.js:computeRelationshipEffects`, `getComboEligibility` | Thiếu — chưa đọc `minRelationshipStageRequired` (chưa combo nào dùng) |
| FATE-REL-003 | `js/engine.js:fateRelationshipRecord`, `fateRelationshipStatus`, `enhancedFateEffects` | Khớp |
| FATE-REL-004 | `js/engine.js:recordFateBehavior`, `advanceGameTime` | Khớp |
| FATE-REL-005 | `js/engine.js:recordFateBehavior`; thiếu `recordFateChoice`; hook trong `js/expansion.js:recordRelationshipEvent`, `resolveContestedOpportunity` và `js/engine.js:resolveMapEvent` | Thiếu — không có call site `kind: "choice"`; chưa có đường bù `points ≥ 25`, chưa có `uniqueKey`/`behaviorKeys` |
| FATE-REL-006 | `js/engine.js:resonateFate`; `js/expansion.js:evolveFate` | Khớp |
| FATE-REL-008 | `js/engine.js:recordFateBehavior` (call site tu luyện, combat) | Lệch — `eliteTrials`/`alignedChoices` tăng ở mọi bậc (đếm kép với `recordFateEvolutionProgress` khi trial); thắng tinh anh chưa gọi kind `elite` |
| FATE-REL-009 | `js/engine.js:nurtureFate` | Khớp |
| FATE-REL-010 | `js/engine.js:resonateFate` | Khớp |
| FATE-REL-011 | `js/engine.js:revealFateInsight` | Khớp |
| FATE-REL-012 | `js/engine.js:advanceGameTime`, `releaseStagnantFate` | Khớp |
| FATE-REL-013 | `js/engine.js:fateRelationshipRecord` (`decayPolicy`) | Khớp |
| FATE-REL-014 | `js/engine.js:receiveFate`, `releaseStagnantFate`; `js/expansion.js:evolveFate` | Khớp |
