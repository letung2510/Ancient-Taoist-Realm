# REWARD CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\05-operations\CONTESTED_OPPORTUNITY_ROLLBACK_REWARD_LEDGER_2026-09-17.md`

# Contested Opportunity — rollback, expiry và reward ledger

## Canonical state

- `pendingContestedOpportunity` chỉ chứa một cơ duyên ở trạng thái `pending`.
- Khi đã `won`, `lost` hoặc `expired`, cơ duyên được ghi vào `opportunityHistory` và
  pending được xoá.
- `opportunityHistory` giữ tối đa 30 bản ghi, mỗi `id` chỉ xuất hiện một lần.
- Bản ghi giữ node, rival, choice, created/resolved day, status và reward thực tế.

## Transition

1. Tạo cơ duyên sinh `id`, node, region, rival, reward và hạn `createdDay + 3`.
2. Chọn `fight`, `scheme` hoặc `share` chỉ được resolve khi còn hạn.
3. `share` luôn thắng nhưng nhận nửa reward và ghi relationship event có unique key.
4. `fight/scheme` dùng seeded RNG theo opportunity id; thắng mới gọi canonical reward ledger.
5. Thua chỉ gây damage một lần, không phát reward.
6. Quá hạn online hoặc offline đều chuyển `expired`, ghi history, xoá pending và không reward.
7. Resolve lặp lại sau khi pending đã xoá luôn thất bại; history không bị nhân đôi.

## Validation và regression

`validateContestedOpportunity` kiểm tra status, id duy nhất, ngày hợp lệ, reward không âm,
pending không trùng history và history không vượt retention. Regression kiểm tra expiry,
offline expiry và idempotency.

## Chưa hoàn thiện

- Chưa có UI history viewer riêng cho toàn bộ 30 cơ duyên; hiện chỉ canonical state và
  log/action surface được bảo vệ.
- Chưa cân bằng lại reward theo từng loại rival/faction; reward hiện vẫn theo catalog cơ
  duyên đang có.


### Source: `archive-requirements\logic-history\06-expansion\REWARD_CATALOG_IDEMPOTENCY_CANONICAL_2026-09-16.md`

# Reward Catalog / Idempotency Canonical — 2026-09-16

## Reward receipt

Mọi reward từ quest, contract, hidden realm, contested opportunity, discovery, world event, tournament, war intervention, prisoner resolution, auction delivery, companion scouting, tomb, legacy và companion release phải đi qua `grantCanonicalReward`. Receipt có `key`, `sourceId`, `day`, `exp`, `merit`, `item`, `quantity`, `linhThach`, `contribution`, `fates`, `techniques`; `state.rewardLedger[key]` là nguồn sự thật chống phát thưởng lại.

## Rules

- Status transition của content và reward receipt là hai lớp độc lập.
- Commit reward thành công mới chuyển content sang completed/rewarded.
- Deserialize/replay cùng `key` trả duplicate và không cộng lại tài nguyên.
- Preview chỉ trả reward DTO, không ghi `rewardLedger`.
- Nguồn legacy có thể được normalize sang key `contract:<id>`, `hidden_realm:<id>:<cycle>:<reward>`, `opportunity:<id>`.

## Acceptance

- Contract completion lặp lại không nhân đôi EXP/merit/item.
- Hidden realm core chỉ phát một lần mỗi reward key/cycle.
- Contested opportunity chỉ có một receipt khi thắng.
- Reward receipt được serialize cùng save và giữ lại sau load.
- Xử lý tù binh chỉ đổi trạng thái một lần; Công Đức của `released`/`turned_in` có key riêng và không thể cộng lại bằng cách gọi lại action.


### Source: `archive-requirements\logic-history\06-expansion\REWARD_OFFLINE_STATE_INVARIANTS_2026-09-17.md`

# Reward Ledger và Offline State Invariants — 2026-09-17

`ensureExpansionState()` migrate reward receipts cũ về schema canonical:
`key/sourceId/day`, numeric reward fields, `fates`, `techniques` và
`taintedRewards`. Receipt hỏng bị loại khỏi ledger thay vì làm hỏng toàn save.

`validateExpansionState()` kiểm tra reward receipt, weather severity/history,
NPC memory/rumor retention, actor history projection tối đa 30 ngày, scheduled
task và companion state. Mục tiêu là bảo vệ idempotency reward, save migration,
offline simulation và bounded history trong cùng một state gate.

Receipt legacy không hợp lệ được giữ trong `legacyPayload` với trạng thái
`quarantined`; migration không xóa dữ liệu của người chơi.


### Source: `archive-requirements\logic-history\06-expansion\REWARD_POLICY_PITY_AND_PENDING_VAULT_2026-09-17.md`

# REWARD POLICY — DUPLICATE / PITY / PENDING VAULT 2026-09-17

## Decision

- One-time reward receipt duplicate is rejected by stable `uniqueKey`; replay never grants resources twice.
- There is no hidden generic pity counter. Any guaranteed result must be represented explicitly by the catalog/source resolver.
- When a Fate reward is guaranteed but the Fate vault is full, the receipt remains granted and `receiveFate(..., allowPending:true)` places the Fate in the pending-vault queue. It is not rerolled or silently lost.
- Repeatable combat/search/craft/gather outputs remain activity-resolver outputs and are governed by deterministic action keys, not one-time reward receipts.

## Runtime API

`rewardPolicySnapshot()` and `validateRewardPolicy()` expose the policy. Canonical receipts record `policy` and `pendingFateCount` for audit/UI summary without changing reward identity.

## Regression

Reward ledger/quest/online-Fate/tainted-reward tests verify duplicate idempotency, receipt persistence and pending behavior. Save validation preserves legacy/quarantined receipts.


### Source: `archive-requirements\logic-history\06-expansion\TAINTED_FACTION_REWARD_LEDGER_CANONICAL_2026-09-17.md`

# Tainted faction reward ledger canonical — 2026-09-17

Tainted-faction currencies and flags are a separate reward namespace from ordinary
EXP/Linh Thạch/Fate rewards, but their delivery still uses the same canonical receipt
boundary. `grantTaintedRewardCanonical` delegates to `grantCanonicalReward` with a
`taintedRewards` payload and a source-specific unique key.

Faction selection, faction-hunt merit and other one-time tainted rewards can therefore
be audited and replayed without incrementing the reward twice. The receipt explicitly
stores the tainted payload; it does not pretend `heaven_merit`, `balance_token`, or
`heaven_seal` are ordinary inventory items.

**Note chưa hoàn thiện:** balance/pity values for faction rewards remain content tuning;
namespace separation and idempotent delivery are implemented.


