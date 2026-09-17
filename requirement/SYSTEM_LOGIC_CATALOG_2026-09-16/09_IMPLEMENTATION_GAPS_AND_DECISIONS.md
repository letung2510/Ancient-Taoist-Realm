# GAPS — SỔ ĐĂNG KÝ LOGIC CHƯA HOÀN THIỆN VÀ QUYẾT ĐỊNH CẦN CHỐT

## Đã có runtime và đã được regression

- Mệnh inventory/active, affinity và resolver effect cơ bản.
- Con Đường/path ritual, nghề chính/nghề ẩn lock và Dị Thể state nền.
- Map node/sub-location, cosmic map view, fog/completion signal và travel guard nền.
- World simulation weather/faction/NPC context, NPC weather narrative cùng scene.
- Novel log boundary, command echo filter, scene batching và stat separation.
- Save migration, IndexedDB archive retry và các test matrix hiện hành.

## Gap ưu tiên P0

1. Chuẩn hóa một API influence gradient duy nhất, nối heatmap, travel weighting, fog và structure eligibility.
2. Hoàn thiện `Công Trình` registry/runtime/UI cho Truyền Tống Trận và Hộ Giới Đại Trận.
3. Chốt schema duy nhất cho `hiddenProfession`, `professionState.hiddenId` và save legacy.
4. Mở rộng `ERROR_NARRATIVE_MAP`/fallback coverage và audit mọi producer log cũ.

## Gap ưu tiên P1

1. Fate Phase 3: Nghịch Mệnh, Trấn Mệnh, Thiên Cơ, Mệnh Đổi.
2. NPC scheduler nhu cầu/congestion, movement topology, witness/rumor propagation.
3. Weather catalog đầy đủ và severity/hysteresis data-driven.
4. Deterministic replay cho war, contested opportunity, hidden realm, auction.
5. UI view model audit và visual regression.

## Mâu thuẫn cần quyết định

| Chủ đề | Quyết định hiện tại | Rủi ro |
|---|---|---|
| Con Đường vs Nghề | namespace tách hoàn toàn | save cũ còn alias lẫn nhau |
| Nghề chính/phụ | chọn nghề chính khóa nghề thường ngay; nghề ẩn là slot phụ | UI cũ có thể cho chọn lại |
| Dị Thể | lớp thân thể/dị hóa, không phải path/profession | catalog effect chưa đủ |
| Mệnh relationship decay | chưa tự giảm nếu chưa chốt policy | lâu dài có thể quá mạnh |
| Influence | gradient canonical, owner chỉ là kết quả/threshold | API cũ còn rời rạc |
| Công Trình | feature trong tab Thế Giới | cost/durability chưa chốt |
| Log | narrative riêng, stat riêng, group theo scene | legacy history cần migration |

## Quy tắc bổ sung feature mới

Feature mới chỉ được merge khi có: catalog schema, state schema, resolver API, action transaction, UI DTO, log narrative/stat, save migration, cross-system impact, invariant, test và mục note chưa hoàn thiện.

## Definition of done cho catalog này

- Một người mới chỉ đọc thư mục này có thể biết feature nằm ở đâu, state nào, gọi resolver nào, action nào, UI nào và save/migration ra sao.
- Mọi feature đều ghi rõ phụ thuộc và gap.
- Không dùng tên Con Đường cho Nghề, không dùng Dị Thể cho Mệnh hoặc Nghề Ẩn.
- Mọi claim “ĐÃ CODE” phải đối chiếu runtime/test; phần chưa chắc phải ghi **MỘT PHẦN** hoặc **THIẾT KẾ**.
