# Review Batch 93 — Map Structure/Travel Closure

## Phạm vi

Đóng ba nhánh còn thiếu trong canonical map runtime:

1. Công trình có trạng thái `dismantled` không được góp influence.
2. Hộ Giới Đại Trận có trạng thái `dismantled` không được góp ward protection, encounter-risk reduction hoặc san-drain reduction.
3. Travel weighting phải đọc weather của region thuộc node đích, không dùng nhầm weather của region hiện tại/người xuất phát.

## Runtime contract

- `mapInfluenceSnapshot` chỉ cộng effect của structure không thuộc `disabled` hoặc `dismantled` và còn integrity.
- `wardProtectionAtNode` chỉ lấy ward đang hoạt động, không bị disable/dismantle và còn integrity.
- `travelWeightSnapshot` resolve `node.regionId` trước khi đọc `worldSimulation.regionState`.

## Regression

`tools/verify_review_batches.js` kiểm tra sau dismantle: influence player giảm và ward protection tắt. Syntax, review batches, game/headless UI, deep Dị Thể và performance profile đều pass sau thay đổi.
