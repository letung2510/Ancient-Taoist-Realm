# FATE ADVANCED ACTIONS CANONICAL — PHASE 3

## Nguyên tắc chống cộng effect hai lần

Base definition, enhancement, relationship, combo và evolution là năm lớp riêng. Resolver trả từng lớp trong `breakdown`; tổng effect chỉ được hợp nhất một lần ở `computeStats`. Action advanced không mutate effect trực tiếp.

## Nghịch Mệnh

- Mục tiêu: trả giá để đổi hướng một effect Mệnh.
- Điều kiện: Mệnh active, relationship tối thiểu, corruption/SAN phù hợp, không đang trial khác.
- Kết quả: tạo `fateAdvancedActions[fateId].nghichMenh` record và modifier conditional; không sửa `FateDefinition`.
- Thất bại: trừ cost đã commit nhưng không tạo modifier; ghi failure history.

## Trấn Mệnh

- Mục tiêu: khóa một tác động bất lợi của Mệnh trong thời hạn.
- Điều kiện: có anchor/ritual và tài nguyên phòng hộ.
- Kết quả: tạo suppression window có `startsAtDay`, `expiresAtDay`, `suppressedEffectKeys`.
- Không cộng điểm tích cực thay cho effect bị khóa.

## Thiên Cơ

- Mục tiêu: xem trước một nhánh/điều kiện Mệnh.
- Là preview thuần, không tiêu hao RNG, không commit state và không tăng relationship.
- Chỉ khi chọn commit mới ghi `insightRevealed`.

## Mệnh Đổi

- Mục tiêu: chuyển một Mệnh active với cost/slot rõ ràng.
- Không xóa instance cũ; chuyển nó về vault hoặc `released` theo lựa chọn.
- Transaction kiểm tra capacity trước khi trừ cost.
