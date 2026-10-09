# Lân cận — implementation status (2026-10-09)

Tài liệu này ghi trạng thái triển khai mới nhất và supersede các checklist lịch sử trong `LOCAL_MAP_CTHULHU_UX_UI.md` khi hai nội dung khác nhau.

## Đã đóng

- Mỗi ứng viên Lân cận dùng `GameEngine.movementCandidatePreview` và hiển thị độ dời, cước trình theo game-day, hao thể lực và trạng thái thiếu thể lực trước commit.
- Preview cô lập state; không sinh node thật, không sửa influence, không tiêu RNG/tài nguyên.
- Commit và preview dùng duy nhất `GameExpansion.travelPlan`/`canonicalTravelPlan`.
- `GameEngine.move` kiểm tra thể lực trước khi đổi vị trí và trừ đúng một lần; thất bại giữ nguyên vị trí và tài nguyên.
- WT01–WT13 độc lập: `tools/verify_local_movement_weather.js` — PASS.
- Offline bundle đã rebuild; parity/bundle gate PASS.

## Chính sách cost

`walk_distance_weighted_v1`:

```text
staminaCost = ceil(distance * max(0.55, terrainWeight * weatherWeight * structureWeight) * partyWeight)
gameDays = ceil(distance / effectiveSpeed)
```

Không đưa multiplier hoặc RNG lên UI; chỉ đưa kết quả gameplay cần để quyết định.

## Node xuất thân

`ORIGIN_NODE_CATALOG` và `ORIGIN_NODES_CANONICAL.md` tách ba lớp vùng, node và ý định hành đạo. Tất cả vùng đều có node dân cư độc lập: Trung Vực có Tân Thủ Thôn/Phường Thị Lạc Vân/Bạch Thủy Trấn; Đông Hoang có Thanh Mộc Biên Trấn; Nam Chướng có Dược Khê Trấn; Bắc Nguyên có Tuyết Tùng Trấn; Thiên Không Vực có Vân Bạc Bến; U Minh Giới có Minh Hà Trấn; Tây Mạc và Vô Tận Hải dùng Sa Thành và Lưu Vân Hải Cảng. Không node nào là cổng hoặc khu vực thuộc tông môn. `Quy Tông` chỉ mở tuyến tìm sư sau khi khởi đầu, còn `Tự Lập` giữ quyền độc lập và không cấp membership.
