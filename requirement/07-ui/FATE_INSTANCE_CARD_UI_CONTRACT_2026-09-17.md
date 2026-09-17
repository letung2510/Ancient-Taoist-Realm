# UI Mệnh Số theo instance — Contract

Mỗi card Mệnh phải mô tả instance đang sở hữu, không chỉ definition catalog. Card active và card trong Mệnh Kho đều phải phân biệt trạng thái kích hoạt.

## Dữ liệu bắt buộc hiển thị

- Tên/grade/sign của definition.
- Enhancement level và effective score của instance.
- Relationship stage/points, số lần Dưỡng Mệnh và Cộng Minh lấy từ `fateRelationships[fateId]`.
- Nguồn nhận lấy từ `fateInstances[fateId].source` khi có.
- Tiến hóa: `status`, `branchId` hoặc trạng thái chưa mở.
- Số lượt advanced action đã dùng của instance; suppression vẫn do runtime resolver quyết định.
- Instance trong Mệnh Kho phải ghi rõ không cộng chỉ số và không phải active effect.

## Invariant

UI chỉ đọc DTO/resolver (`fateRelationshipStatus`, `fateEnhancementLevel`, `fateAdvancedAction...`, `fateEvolution...`); không tự tính effect. Definition card không được hiển thị như instance active.

## Regression

Test runtime phải giữ nguyên `fateInstances`, relationship history, evolution và advanced namespace sau serialize/deserialize. UI contract kiểm tra card có instance metadata và action delegation vẫn hoạt động.

## Chưa hoàn thiện

Visual screenshot trên browser thật chưa được xác nhận do môi trường local browser hiện chặn URL; runtime/UI string contract đã được kiểm tra.
