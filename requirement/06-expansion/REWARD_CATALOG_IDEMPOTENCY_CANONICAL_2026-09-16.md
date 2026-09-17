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
