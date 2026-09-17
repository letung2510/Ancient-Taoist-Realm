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
