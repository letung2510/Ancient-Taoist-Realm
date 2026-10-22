# Phần thưởng — Receipt ledger & policy

## Mục đích

Ranh giới duy nhất phát thưởng một lần (one-time reward): receipt, ledger chống trùng, preview, migration/quarantine, policy duplicate/pity/pending vault và namespace thưởng phe tà. Output lặp lại của hoạt động (combat/search/craft/gather) không thuộc file này.

## Dữ liệu & trạng thái

- `state.rewardLedger[key]` = receipt `{ key, sourceId, day, exp, merit, item, quantity, linhThach, contribution, fates[], techniques[], taintedRewards{}, policy, pendingFateCount, fateResults, techniqueResults, status?, legacyPayload? }`.
- `REWARD_POLICY = { id: canonical_once_v1, duplicate: reject, pity: none, fateVaultFull: pending_vault, pendingRewardReplay: idempotent, repeatableOutputs: activity_resolver }`.

## Rules

### Ledger

| ID | Rule |
|---|---|
| RWD-LED-001 | Mọi reward một lần từ quest, contract, hidden realm, contested opportunity, discovery, world event, tournament, war intervention, prisoner resolution, auction delivery, companion scouting, tomb, legacy, companion release và thưởng phe tà phải đi qua `grantCanonicalReward(state, sourceId, reward, uniqueKey)`; không cộng tài nguyên thưởng ngoài receipt. `state.rewardLedger[key]` là nguồn sự thật chống phát lại. |
| RWD-LED-002 | Status transition của content và reward receipt là hai lớp độc lập; content chỉ chuyển sang completed/rewarded sau khi commit reward thành công. |
| RWD-LED-003 | Key đã có trong ledger → trả `{ success: false, duplicate: true, receipt }` và không cộng gì, kể cả sau deserialize/replay. |
| RWD-LED-004 | Preview (`previewCanonicalReward`) chỉ trả reward DTO, không ghi `rewardLedger`; item không tồn tại trong catalog/runtime → reject. |
| RWD-LED-005 | Key chuẩn: `contract:<id>`, `hidden_realm:<realmId>:<cycle>:<reward>`, `opportunity:<id>`, `prisoner:<id>:<outcome>`; nguồn legacy được normalize về các dạng này. |
| RWD-LED-006 | `ensureExpansionState()` migrate receipt cũ về schema canonical (numeric field, `fates`, `techniques`, `taintedRewards`). Receipt hỏng hoặc field âm/không hữu hạn → `status: "quarantined"`, giá trị gốc giữ trong `legacyPayload`; không xóa dữ liệu, không làm hỏng toàn save. |
| RWD-LED-007 | `validateExpansionState()` kiểm tra receipt (key, field số không âm, shape). Receipt được serialize cùng save và giữ sau load. |
| RWD-PRS-001 | Xử lý tù binh đổi trạng thái một lần; Công Đức và đóng góp của `released`/`turned_in` có key riêng, gọi lại action không cộng lại. |

### Policy

| ID | Rule |
|---|---|
| RWD-POL-001 | Không có pity counter ẩn; mọi kết quả bảo đảm phải biểu diễn tường minh trong catalog/source resolver. |
| RWD-POL-002 | Fate thưởng khi kho Mệnh đầy: receipt vẫn granted và Fate vào hàng chờ (`receiveFate(..., { allowPending: true })`); không reroll, không mất. Receipt ghi `pendingFateCount`. |
| RWD-POL-003 | Output lặp lại của combat/search/craft/gather do activity resolver quản lý bằng action key deterministic, không dùng receipt một lần. |
| RWD-POL-004 | `rewardPolicySnapshot()` và `validateRewardPolicy()` công bố policy; receipt ghi `policy` để audit/UI mà không đổi identity của reward. |
| RWD-TNT-001 | Thưởng phe tà (`heaven_merit`, `balance_token`, `heaven_seal`, cờ phe) là namespace riêng `taintedRewards`, không phải item inventory; giao qua `grantTaintedRewardCanonical` → `grantCanonicalReward` với key theo nguồn. Không có đường cộng ngoài ledger. |

## Acceptance

- Contract hoàn thành lặp lại không nhân đôi EXP/merit/item.
- Hidden realm core chỉ phát một lần mỗi key/cycle; contested opportunity chỉ có một receipt khi thắng.
- Receipt serialize cùng save, giữ sau load; receipt legacy hỏng ở trạng thái quarantined.
- Fate thưởng khi kho đầy vào hàng chờ; replay không cấp lại.
- Gate: `verify_review_batches.js`, `verify_expansion_stress.js`, `verify_save_envelope.js`.

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| RWD-LED-001, 003, 004 | expansion.js:`previewCanonicalReward`, `grantCanonicalReward` | Khớp | |
| RWD-LED-001 (Công Pháp) | expansion.js:`grantCanonicalReward` (`E.learnTechnique`) | Lệch | học thẳng qua `learnTechnique`, không ghi acquisition receipt theo TEC-070 |
| RWD-LED-002 | expansion.js:`claimHiddenRealmCore`, `completeContract` | Khớp | |
| RWD-LED-005 | expansion.js:`previewCanonicalReward` (scoped `hidden_realm:`), `completeContract`, `resolveContestedOpportunity` | Khớp | |
| RWD-LED-006, 007 | expansion.js:`ensure` (migration `rewardLedger`, `legacyPayload`), `validateExpansionState` | Khớp | |
| RWD-PRS-001 | expansion.js: xử lý tù binh (`prisoner:<id>:released/turned_in`) | Lệch | `turned_in` cộng `guildMembership.contribution += 5` ngoài receipt |
| RWD-POL-001..004 | expansion.js:`REWARD_POLICY`, `rewardPolicySnapshot`, `validateRewardPolicy`, `grantCanonicalReward` (`allowPending`) | Khớp | |
| RWD-TNT-001 | engine.js:`grantTaintedRewardCanonical` | Lệch | khi thiếu `GameExpansion` fallback cộng thẳng `player.tainted.rewards`, không qua ledger |
