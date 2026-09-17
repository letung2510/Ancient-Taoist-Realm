# UI Surface Contract Regression — 2026-09-17

## Phạm vi

Đây là gate tự động cho các bề mặt UI liên quan trực tiếp tới 33 mục review:

- thứ tự tải `engine → expansion → ui → main`;
- tab Thế Sự, Dị Thể và các tab chức năng;
- bản đồ thế giới/local map có influence, fog, completion, route climate;
- Thế Sự có weather, weather history, node history và Công Trình Tông Môn;
- phân biệt Con Đường, Nghề chính, Nghề Ẩn và Dị Thể;
- interaction delegation của map pin, expansion command, save và render-after-turn;
- story log lấy grouped novel paragraphs.

## Regression

`tools/verify_ui_surface_contract.js` kiểm tra source contract và cấm nhãn legacy
`Dị Chí` trong UI source. Đây là static contract gate; browser visual QA vẫn là
gate bổ sung khi môi trường trình duyệt cho phép tải local runtime.

## Trạng thái

ĐÃ CODE + static regression. Không thay thế browser visual QA.
