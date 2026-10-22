# Đồng hành — State, chiến đấu, hồi phục, Dị Biến

## Mục đích

Đồng hành là state runtime độc lập, tương thích save cũ, không sửa catalog tĩnh; mọi thay đổi chiến đấu truy được nguồn và đồng hành không bao giờ "chết im lặng" trong save.

## Dữ liệu & trạng thái

```js
state.companion = {
  entityId, customName,
  state: "active" | "mutated" | "recovering" | "dead" | "released",
  hp, hpMax,                 // mặc định 30/30
  role: "scout" | "striker", guardStance: "balanced" | "guard" | "protect",
  loyalty, corruption,       // 0..100
  mutationPending, mutation, passiveId,
  skillMastery: {},          // skill → số không âm
  damageLedger: [],          // ≤ 20 entry { day, amount, source, damageType }
  lastDamageSource, recoveryUntilDay, reviveCount
}
```

## Rules

| ID | Rule |
|---|---|
| CMP-STA-001 | `state.companion` là namespace duy nhất. `normalizeCompanion()` bổ sung default an toàn khi ensure/load/action; validator vẫn báo lỗi nếu sau normalize còn vi phạm invariant. |
| CMP-STA-002 | Invariant: `state` thuộc enum; `hp`, `hpMax`, `loyalty`, `corruption`, `recoveryUntilDay`, `reviveCount` là số hữu hạn; loyalty/corruption trong 0..100; `reviveCount`, mastery ≥ 0; mỗi entry ledger có `day` hữu hạn và `amount` ≥ 0. |
| CMP-STA-003 | Mọi API trả `{ success, reason, ...data }`, không dùng thời gian máy cho gameplay và không phát reward hai lần. |
| CMP-CBT-001 | `selectCompanionTarget(state, options)` chọn mục tiêu còn sống theo mức đe dọa, độ bị thương, `role` và `guardStance`; seeded nên replay được. |
| CMP-CBT-002 | Sát thương chỉ ghi qua `recordCompanionDamage(state, amount, source, damageType)`: chỉ nhận khi state `active`/`mutated`; ghi ledger (giữ 20 gần nhất), cập nhật `lastDamageSource`, trừ HP (clamp 0..hpMax). |
| CMP-CBT-003 | HP về 0 → `state="recovering"`, `recoveryUntilDay = day + 3`, ghi một dòng log cảnh báo. |
| CMP-CBT-004 | Combat offline chỉ ghi sát thương qua cùng `recordCompanionDamage`: mỗi ngày seeded, 35% không bị thương, còn lại nhận 1–5 sát thương nguồn "biến cố ngoại tuyến". |
| CMP-CBT-006 | Khi quái tấn công, đồng hành `active`/`mutated` đỡ đòn với xác suất seeded: `guard` 45%, `protect` 35%, mặc định 12%, cộng `min(0.1, loyalty/1000)`; đòn đỡ ghi qua CMP-CBT-002. |
| CMP-CBT-005 | Tick ngày: đồng hành `active`/`mutated` tăng corruption `max(0, corruption node + (1 nếu vùng có sự kiện) − 2)`, clamp 0..100. |
| CMP-REC-001 | `recoverCompanion(state)`: chỉ cho state `recovering`; thành công khi đã tới `recoveryUntilDay` hoặc đang ở node an toàn (`safe`/`safe_for_ritual`); hồi `ceil(50% hpMax)`, state về `active`. |
| CMP-REC-002 | Tick ngày tự gọi hồi phục khi `day ≥ recoveryUntilDay`. |
| CMP-REC-003 | `reviveCompanion(state)`: chỉ cho state `dead`/`recovering`, chỉ tại node an toàn, tốn 3 Linh Thạch, hồi `ceil(25% hpMax)` (tối thiểu 1), state `active`, `reviveCount+1`, xóa `recoveryUntilDay`. |
| CMP-MUT-001 | `mutationPending=true` chỉ được resolve một lần qua `resolveCompanionMutation(state, choice)`; choice ∈ `accept`, `cure`, `release`. |
| CMP-MUT-002 | `accept`: state `active`, tắt pending, `mutation="tainted_claw"`, `passiveId="corrupted_scout"`, loyalty +5, Tà Nhiễm nhân vật +5 qua `applyCorruptionGain`. |
| CMP-MUT-003 | `cure`: cần 10 Linh Thạch; `mutation="purified"`, corruption đồng hành = 15, loyalty +10, giữ đồng hành hoạt động. |
| CMP-MUT-004 | `release`: state `released`, ghi `releasedDay`, phát Công Đức +3 qua reward ledger canonical với key `companion-release:<entityId>` đúng một lần. |
| CMP-SAV-001 | Save giữ mutation/passive, loyalty/corruption, mastery, damage ledger, recovery và reviveCount; load cũ bổ sung default, không tạo reward lần hai. |
| CMP-SAV-002 | `validateCompanionState(state)` kiểm tra enum, chỉ số, mastery, ledger, recovery; `validateExpansionState` gọi nó sau mỗi ensure/rehydrate. |
| CMP-DAT-001 | Loài đồng hành và passive phải được khai báo data-driven theo catalog (loài → role, hpMax, mutation/passive khả dụng) thay vì hardcode `tainted_claw`/`corrupted_scout`. |
| CMP-UI-001 | Có thẻ đồng hành hiển thị HP, trạng thái, mốc hồi phục và damage ledger gần nhất bằng nhãn tiếng Việt. |

## Luồng

`active ⇄ mutated` → (HP=0) `recovering` → (3 ngày hoặc node an toàn) `active`; `recovering|dead` → (revive) `active`; `mutationPending` → `accept|cure` (`active`) hoặc `release` (`released`, terminal).

## Acceptance

- Resolve mutation, serialize/deserialize: mutation/passive còn nguyên; đặt loyalty ngoài 0..100 → validator từ chối.
- Ledger không vượt 20; HP 0 luôn dẫn tới `recovering`, không có state "chết im lặng".
- Revive ngoài node an toàn hoặc thiếu 3 Linh Thạch thất bại không đổi state.
- Gate: `node tools/verify_companion_runtime.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CMP-STA-001..003 | `js/expansion.js:normalizeCompanion` | Khớp |
| CMP-CBT-001 | `js/expansion.js:selectCompanionTarget` | Khớp |
| CMP-CBT-002..003 | `js/expansion.js:recordCompanionDamage` | Khớp |
| CMP-CBT-004 | `js/expansion.js:simulateOfflineCompanionCombat` | Khớp |
| CMP-CBT-005, CMP-REC-002 | `js/expansion.js:tick` | Khớp |
| CMP-CBT-006 | `js/engine.js:monsterAction` | Khớp |
| CMP-REC-001 | `js/expansion.js:recoverCompanion` | Khớp |
| CMP-REC-003 | `js/expansion.js:reviveCompanion` | Khớp |
| CMP-MUT-001..004 | `js/expansion.js:resolveCompanionMutation` | Khớp |
| CMP-SAV-001..002 | `js/expansion.js:validateCompanionState`, `validateExpansionState` | Khớp |
| CMP-DAT-001 | — | Thiếu |
| CMP-UI-001 | `js/ui.js` (chưa có thẻ ledger/timeline) | Thiếu |
