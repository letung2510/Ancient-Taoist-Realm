# Phần thưởng — Cơ duyên tranh đoạt

## Mục đích

Cơ duyên tranh đoạt (contested opportunity): tạo, chọn cách tranh, hết hạn, lịch sử và phát thưởng idempotent.

## Dữ liệu & trạng thái

- `state.pendingContestedOpportunity` = `{ id, nodeId, regionId, rivalId, createdDay, expiresDay, reward, status: "pending", choices: { fight, scheme, share } }` (tối đa một).
- `state.opportunityHistory[]` (≤ 30, `id` duy nhất): `{ id, nodeId, rivalId, status: won/lost/expired, choice, reward, createdDay, resolvedDay }`.

## Rules

| ID | Rule |
|---|---|
| RWD-OPP-001 | Chỉ một cơ duyên `pending`. Khi `won`/`lost`/`expired`, ghi vào `opportunityHistory` và xóa pending. |
| RWD-OPP-002 | Tạo cơ duyên sinh `id`, node, region, rival, reward (seeded) và hạn `expiresDay = createdDay + 3`. |
| RWD-OPP-003 | `fight`/`scheme`/`share` chỉ resolve khi còn hạn; lựa chọn khác → lỗi, không mutate. |
| RWD-OPP-004 | `share` luôn thắng, nhận `ceil(reward/2)`, ghi relationship event `shared_opportunity` với unique key = opportunity id. |
| RWD-OPP-005 | `fight`/`scheme` dùng seeded RNG theo `opportunity-resolve:<id>:<choice>`, tỉ lệ kẹp [0.15, 0.95]; thắng mới gọi ledger với key `opportunity:<id>`. |
| RWD-OPP-006 | Thua gây damage đúng một lần (15% Khí Huyết tối đa, HP còn ≥ 1), không reward. |
| RWD-OPP-007 | Quá hạn online hoặc offline đều chuyển `expired`, ghi history, xóa pending, không reward. Resolve lặp lại sau khi pending đã xóa luôn thất bại; history không bị nhân đôi. |
| RWD-OPP-008 | `validateContestedOpportunity` kiểm tra status hợp lệ, id duy nhất, ngày hữu hạn, reward không âm, pending không trùng history, history ≤ 30. |

## Acceptance

Regression kiểm tra expiry online, expiry offline, idempotency resolve và một receipt duy nhất khi thắng (`verify_review_batches.js`, `verify_long_range_replay.js`).

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| RWD-OPP-001, 007 | expansion.js:`resolveContestedOpportunity`, `recordContestedOpportunity`, world tick (expire pending) | Khớp | |
| RWD-OPP-002 | expansion.js:`createContestedOpportunity` | Lệch | `expiresDay = day + 12` thay vì `+ 3` |
| RWD-OPP-003..006 | expansion.js:`resolveContestedOpportunity` | Khớp | |
| RWD-OPP-008 | expansion.js:`validateContestedOpportunity` | Khớp | |
