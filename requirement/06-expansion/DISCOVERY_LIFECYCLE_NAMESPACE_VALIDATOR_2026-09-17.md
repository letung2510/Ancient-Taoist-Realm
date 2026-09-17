# Discovery/Dị Chí lifecycle namespace validator

Discovery chỉ dùng các trạng thái tăng dần `discovered → verified → collected → rewarded`.
Mỗi record phải có first-seen day và các transition day tương ứng; không được lùi trạng
thái hoặc suy diễn discovery thành Con Đường, Nghề Ẩn hay Dị Thể. `codexClues` là metadata
manh mối riêng, không bị ép vào lifecycle record.

`validateDiscoveryLifecycle` được gọi trong `validateExpansionState`, UI đọc
`discoveryStatusSummary` và hiển thị đủ bốn trạng thái. Regression đưa status namespace
sai vào record và buộc validator từ chối.
