# Catalog Balance Boundary Validator — 2026-09-17

## Canonical boundaries

- Weather travel risk: `0..0.25`; default duration không quá 7 ngày.
- Recipe materials/costs: số hữu hạn, không âm, không vượt 99 cho một transaction.
- Dị Thể cost số: `0..100`; cost boolean được phép cho điều kiện đặc biệt.
- Công Trình: build cost `1..100`, upgrade base không vượt hai lần build cost, refund rate `0..0.5`.
- Reward policy và Path fusion policy phải pass cùng balance gate.

## Runtime

`validateBalanceCatalog()` được gọi trong `validateExpansionState()` và export qua `GameExpansion.validateBalanceCatalog()`.

## Regression

`tools/verify_dichi_deep.js` kiểm tra toàn bộ catalog hiện hành và yêu cầu balance audit pass.

## Chưa hoàn thiện

Các ngưỡng trên là invariant chống giá trị lỗi và runaway economy; tuning cảm nhận người chơi theo từng difficulty vẫn là quyết định content riêng.
