# Bản đồ sao và điểm đản sinh theo khu vực

## Quy tắc canonical

- Mỗi lựa chọn khu vực bắt đầu phải ánh xạ tới một node đản sinh riêng.
- Trung Vực không sinh thẳng tại Sơn Môn hay bất kỳ tông môn nào; node mặc định là `trung_vuc_khoi_diem` (Vân Đài Ngoại Vi).
- Điểm đản sinh phải thuộc đúng `region` đã chọn và có tọa độ canonical trong `WORLD_MAP.locations`.
- `rollCharacterCreation(regionId)` là nguồn duy nhất quyết định `startLocationId`; tình huống xuất thân không được ghi đè quy tắc điểm đản sinh khu vực đối với Trung Vực.

## Topology và hệ tọa độ

- Trục bản đồ dùng `x` tăng về Đông, `y` tăng về Nam.
- Hướng Bắc phải giảm `y`; hướng Nam phải tăng `y`.
- Open-world procedural nodes phải kế thừa tọa độ canonical và không được tự tạo cạnh làm ngược trục.
- Node/region route phải đi qua topology được khai báo; không dùng khoảng cách hình học để tự nối xuyên vùng.

## Bản đồ sao

- World overview hiển thị vùng như các tinh điểm quanh lõi Trung Vực.
- Các quỹ đạo chỉ là lớp định hướng thị giác; cạnh route canonical mới quyết định khả năng di chuyển.
- Faction/guild pin tiếp tục nằm trên cùng hệ tọa độ và không được thay đổi topology.

## Trạng thái chưa hoàn thiện

- Cần bổ sung validator độc lập kiểm tra mọi cạnh location có hướng phù hợp với chênh lệch tọa độ và region route.
- Cần QA trực tiếp trên browser để cân chỉnh độ đọc tên tinh điểm ở màn hình nhỏ.
