# Fate Phase 3 — Canonical Advanced Actions

## Scope

Nghịch Mệnh, Trấn Mệnh, Thiên Cơ và Mệnh Đổi là action vận hành trên instance Mệnh đang sở hữu/kích hoạt. Chúng không sửa catalog Fate, không tự cộng lại enhancement, relationship hoặc evolution effect.

## Canonical action catalog

| Action | Scope | Cost | Điều kiện | Output |
|---|---|---|---|---|
| `nghichMenh` | một Fate | 15 Thanh Tỉnh | Fate đang kích hoạt và là Hung Cách | tăng một use, tối đa 5; mỗi use đóng góp 0.03 all-stat multiplier, tối đa 0.15 |
| `tranMenh` | một Fate | 8 Thanh Tỉnh | Fate đang kích hoạt | suppression trong 3 turn mặc định; không xóa Fate hay relationship |
| `thienCo` | toàn nhân vật | 5 Thanh Tỉnh | hết cooldown | soi trạng thái đột phá; cooldown 12 turn |
| `menhDoi` | một Fate | 5 + 2×gradeTier Mệnh Tinh Hoa, 10 + 5×gradeTier Công Đức, 10 Thanh Tỉnh | Fate active, relationship stage 4, enhancement +5 | ủy quyền cho Fate evolution branch đã preview và xác nhận |

`GameEngine.fateAdvancedActionCatalog()` là nguồn policy duy nhất cho scope, cost và giới hạn. Runtime record dùng `fateAdvancedActions`; Fate-specific action nằm dưới Fate ID, `thienCo` duy nhất nằm dưới `_global`.

## Invariant chống cộng kép

- `effectSource` của mọi record phải là `advanced_fate_action`.
- `nghichMenh` chỉ đọc use từ `fateAdvancedActions[fateId].nghichMenh`; không cộng thêm một nguồn thứ hai từ `fateDefiance`.
- `tranMenh` chỉ tạo suppression tạm thời; khi hết turn, effect trở lại qua cùng pipeline.
- `menhDoi` chỉ ghi branch/use sau khi `evolveFate` commit thành công; preview không tiêu hao tài nguyên.
- Deserialize giữ nguyên namespace và số use; validator từ chối scope/action không hợp lệ, use âm/vượt cap, hoặc branch không phải chuỗi.

## Regression bắt buộc

1. Gọi đủ bốn action tạo đúng namespace record.
2. Nghịch Mệnh quá 5 lần bị giới hạn effect.
3. Trấn Mệnh hết thời gian thì effect phục hồi.
4. Thiên Cơ bị chặn trong cooldown.
5. Mệnh Đổi preview không thay đổi state; commit chỉ ghi advanced record khi evolution thành công.
6. `validateExpansionState` phải báo lỗi nếu save chứa advanced action sai namespace hoặc sai `effectSource`.

## Chưa hoàn thiện

- Cân bằng cost và multiplier vẫn cần playtest dài hạn; schema đã chốt, nhưng balance không thể chứng minh chỉ bằng unit test.
- UI hiện đã có entry point cho các action, nhưng cần visual QA trên trình duyệt thật để xác nhận hiển thị blocker/cost nhất quán.
