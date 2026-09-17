# 33-Item Evidence Coverage Gate — 2026-09-17

## Mục đích

Đây là completion audit cho `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`. Gate không tự biến một mục thành “hoàn tất”; nó chỉ fail khi một mục không có đủ ba liên kết tối thiểu:

1. requirement/schema canonical;
2. runtime hoặc UI source symbol;
3. regression executable.

## Cách chạy

```text
node tools/verify_33_item_coverage.js
```

Gate yêu cầu đúng 33 entry, kiểm tra file tồn tại và kiểm tra symbol runtime thật sự xuất hiện trong source. Các gate browser visual, quota thiết bị thật và product balance được ghi riêng, không được che bằng coverage manifest.

## Trạng thái hiện tại

- 33/33 mục đã có evidence mapping requirement → runtime/schema → regression.
- Runtime regression hiện tại đã pass theo các tool chuyên biệt.
- Browser visual QA và tuning balance vẫn là gate mở; chúng không được tuyên bố hoàn tất chỉ từ static coverage.
