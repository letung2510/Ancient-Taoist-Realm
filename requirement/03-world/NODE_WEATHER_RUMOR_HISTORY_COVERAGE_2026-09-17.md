# NODE / WEATHER / RUMOR HISTORY COVERAGE — 2026-09-17

## Canonical contract

- Mọi node-history record phải có `type`, `key`, `day` hữu hạn và `regionId`.
- `key` là idempotency key trong phạm vi node; producer gửi lại cùng sự kiện không được nhân bản.
- History của node giữ tối đa 50 record gần nhất.
- Weather giữ tối đa 30 chuyển đổi gần nhất, có `day`, `from`, `to`, `severity` và `source`.
- Rumor có source, confidence, received/expiry day và ledger chống relay trùng; relay chỉ đi một hop mỗi world tick.
- Actor history offline được giữ trong cửa sổ retention canonical và phải round-trip qua save.

## Runtime / regression

`validateNodeHistory(state, nodeId?)` kiểm tra metadata, duplicate key và retention. Các producer hiện được audit gồm sub-location, structure lifecycle/transfer, faction/outpost/war, actor presence, weather và completion. Regression node-history kiểm tra đủ nhóm type, idempotency, retention và metadata.

## Phần còn lại

Browser visual QA cho panel history và tuning nội dung rumor/weather vẫn là gate UX/content, không phải thiếu invariant dữ liệu.
