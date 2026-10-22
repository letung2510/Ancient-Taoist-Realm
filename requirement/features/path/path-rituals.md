# Path — Nghi thức Con Đường

## Mục đích

Ba mốc nghi thức đặc trưng của mỗi Con Đường (Khai Lộ, Chưởng Quyền, Thành Thần), cách chúng dùng pipeline đột phá, profile khác biệt hóa theo đường và ghi nhận thất bại. Pipeline cổng chung ở [../realm-progression/breakthrough.md](../realm-progression/breakthrough.md).

## Dữ liệu & trạng thái

```js
state.flags.pathRituals = ["chuong_quyen", ...]            // mốc đã hoàn tất của đường chính
state.pathRitualState.paths[pathId].milestones[milestoneId] = {
  failureLog: [{ step: "call_fate"|"anchor"|"compare"|"omen"|"cost"|"commit",
    reason, message, failedDay, impact: { san, corruption, fateDebt, anchor }, permanent }],
  lastFailure: null
}
state.pathState.ritualProfiles[pathId]                     // PATH_RITUAL_PROFILES đã áp dụng
```

## Rules

### PATH-RIT-001 Ba mốc thuộc Con Đường
| Mốc | Mục đích | Kết quả |
|---|---|---|
| `khai_lo` | Xác lập đường | Mở path state và path level đầu |
| `chuong_quyen` | Xác lập quyền năng | Mở hiệu ứng/năng lực riêng của đường; bắt buộc để vào cấp 6 |
| `thanh_than` | Hoàn tất đường | Quyền năng cấp cao / điều kiện cấp 14 |

Nghi thức thuộc Con Đường, không thuộc Nghề Nghiệp hay Con Đường Ẩn; không dùng để mở Con Đường Ẩn hay tạo catalog nghề.

### PATH-RIT-002 Catalog nghi thức (fantasy/mục tiêu)
| `pathId` | Khai Lộ | Chưởng Quyền | Thành Thần |
|---|---|---|---|
| `kiem_dao` | Chém vật dẫn bằng kiếm chưa dính máu | Chém đứt một Mệnh Khế | Chém được "tên" của dị tượng |
| `dan_dao` | Luyện đan bằng linh hỏa tự thân | Luyện đan chứa ký ức người chết | Tạo Sinh Đan không cần nguyên liệu |
| `phu_dao` | Viết phù bằng máu hoặc linh sa | Viết phù lên không gian | Ban Phù Luật buộc thế giới tuân theo |
| `phong_thuy_dao` | Nhận biết linh mạch trong một giờ | Đổi hướng một long mạch | Dựng Tiểu Thiên Địa ổn định |
| `ngu_thu_dao` | Kết khế ước không cưỡng ép | Đồng hóa cảm giác với linh thú | Thành tổ huyết của một loài |
| `khoi_loi_dao` | Tạo khôi lỗi có tên | Cho khôi lỗi tự chọn mệnh lệnh | Tạo thân thứ hai tự chủ |
| `am_luat_dao` | Gọi đúng một linh hồn | Chỉ huy nghi lễ bảy hồi | Gọi linh hồn chưa từng tồn tại |
| `mong_canh_dao` | Ngủ qua dị mộng có chủ | Thắng bản ngã trong mộng | Viết lại giấc mơ của toàn vùng |
| `luyen_the_dao` | Chịu lôi kích không hộ pháp | Phá thân rồi tái tạo | Sống khi Chân Danh bị xóa |
| `tinh_tuong_dao` | Đọc đúng một thiên tượng | Đổi một xác suất nhỏ của tương lai | Tạo chòm sao mang tên mình |

`ritualCatalogKey` phải trùng `pathId`.

### PATH-RIT-003 Dùng chung pipeline
`performPathRitualStep(state, pathId, [realmId,] step)` chỉ hợp lệ khi `pathId` là đường chính hiện tại và `realmId` (nếu có) khớp cảnh giới; sai thì ghi `failureLog` (`path mismatch` / `realm mismatch`) và từ chối. Hợp lệ thì ủy quyền cho `performBreakthroughRitualStep` — không có pipeline thứ hai.

### PATH-RIT-004 Quy tắc commit nghi thức
1. Gọi Mệnh và Dựng Neo là setup: không roll, không trừ cost. Gọi Mệnh xác định Mệnh dẫn/trợ dùng cho nghi thức (Chân Danh, Mệnh Khế hoặc vật dẫn hợp lệ); thiếu nguồn hợp lệ → dừng, không tiêu hao; không tự đổi đường hay mở Con Đường Ẩn.
2. Mọi cổng phía sau phải pass trước khi trừ cost; roll chỉ ở Vượt Dị Tượng hoặc Thử Thách Cuối.
3. Thất bại ghi `failureLog` với bước, reason code ổn định, impact SAN/Corruption/Mệnh Nợ/Neo; không âm thầm đổi Con Đường.
4. Chỉ sau Trả Giá/commit mới cập nhật `flags.pathRituals` và hiệu ứng mốc.
5. Nghi thức không được: cấp Nghề Nghiệp, tạo field nghề mới, bỏ qua điều kiện Con Đường, trao buff không ghi cost/risk, dùng tên nghề đại diện nghi thức path.
6. Con Đường Ẩn đang active không chặn nghi thức đường chính; hiệu ứng nghề chỉ sửa modifier đã khai báo, không thay pipeline.

### PATH-RIT-005 Profile khác biệt hóa theo đường
`PATH_RITUAL_PROFILES[pathId] = { anchorType, omenCheck, locationRequirement, failureEffect }` chỉ thay nội dung cổng Dựng Neo/Vượt Dị Tượng; không đổi số cổng, thứ tự hay loại chi phí Trả Giá (luôn 5 Thanh Tỉnh). Gọi Mệnh và Đối Chiếu giữ chung.

| `pathId` | Vượt Dị Tượng (hình thức, input) | Dựng Neo / ràng buộc |
|---|---|---|
| `kiem_dao` | Đối mặt "Kiếm Ảnh" — combat check PHY/Căn Cốt | Ưu tiên Neo vật phẩm (vũ khí gắn bó); fallback Neo NPC |
| `dan_dao` | Luyện thành một viên đan trong nghi thức (kỹ năng Luyện Đan nếu có, nếu không Ngộ Tính) | Yêu cầu location có lò luyện nếu dữ liệu location hỗ trợ |
| `phu_dao` | Giải mã đạo phù cổ (Ngộ Tính) | Ưu tiên Neo vật phẩm (bùa tự vẽ) |
| `phong_thuy_dao` | Bắt buộc thực hiện tại node có `longMai` | Neo địa điểm bắt buộc |
| `ngu_thu_dao` | Thuần hóa/thắng một Dị Thú riêng cho nghi thức | Ưu tiên đồng hành hợp lệ; thiếu thì không tự pass |
| `khoi_loi_dao` | Lắp ráp cơ quan trong thời gian giới hạn | Ưu tiên Neo vật phẩm (khôi lỗi tự chế) |
| `am_luat_dao` | Đối mặt vong hồn thật, độ khó SAN ×1,5 | Neo người đã mất |
| `mong_canh_dao` | Diễn ra trong lớp Mộng Cảnh; thất bại có % lạc thêm 1 lượt | Neo ký ức |
| `luyen_the_dao` | Thử thách thể chất thuần (PHY/Căn Cốt, không Ngộ Tính); thất bại có % sinh Biến Dị Thân Thể | Neo thân thể (vết sẹo thề nguyện) |
| `tinh_tuong_dao` | Chỉ thực hiện trong khung giờ "sao chiếu mệnh" của GameClock | Neo Mệnh Số đang sở hữu |

Thiếu entity/tài nguyên mà profile yêu cầu → cổng trả blocker rõ ràng, không giả lập thành công.

## Acceptance

- Gọi nghi thức với `pathId` khác đường chính bị từ chối và ghi `failureLog`.
- Cấp 6 không mở khi chưa có `chuong_quyen` trong `flags.pathRituals`.
- Profile Phong Thủy ngoài node `longMai` trả blocker, không pass.
- Gate: `node tools/verify_progression_requirement_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PATH-RIT-001 | `js/engine.js:breakthroughRequirements` (`requiresPathRitual`), `flags.pathRituals` | Khớp |
| PATH-RIT-002 | — (chưa có catalog fantasy trong data) | Thiếu |
| PATH-RIT-003 | `js/expansion.js:performPathRitualStep`, `pathRitualStatus` | Khớp |
| PATH-RIT-004 | `js/engine.js:performBreakthroughRitualStep`; `failureLog` chỉ ghi lỗi path/realm, thiếu `step/impact` | Lệch |
| PATH-RIT-005 | `js/expansion.js:pathRitualProfiles`, `ritualByPath` (chỉ đọc `pathState.ritualProfiles`, không có `PATH_RITUAL_PROFILES`) | Thiếu |
