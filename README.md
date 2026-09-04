# CỔ DỊ ĐIỂN — RPG tu vi quỷ dị

Web game text RPG dùng JavaScript thuần. Luật chuẩn duy nhất của hệ thống nằm tại [`HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`](HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md).

## Luật runtime đã chốt

- Tiến trình có đúng **14 cấp phẳng**, không chia Sơ/Trung/Hậu/Đỉnh.
- Player mới bắt đầu ở **Di Mệnh Cảnh**, có 5 Mệnh Số cơ bản không trùng và hai Công pháp Phàm nhập môn.
- Từ cấp 2, nhân vật chọn một Con Đường đủ điều kiện hoặc chọn **Kẻ Vô Lộ — Ngoại Đạo Giả**.
- Ngoại Đạo Giả giữ danh xưng cảnh giới mặc định, cần `5× EXP`, ngưỡng Mệnh `2×`, kiểm tra đột phá khó hơn và không tham gia hệ Tà Thần/trận doanh.
- 10 Con Đường thường có bộ danh xưng riêng đủ 14 cấp.
- Tà Thần chú ý ở cấp 5 là lựa chọn chủ động, chỉ xác nhận một lần và được lưu vĩnh viễn.
- Save chuẩn dùng schema `tu_vi_quy_di_final`, version 12; save cũ được adapter trong engine chuyển đổi khi tải.

## Cấu trúc thư mục

- `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`: đặc tả nền tảng nhân vật, tu vi và Công Pháp có thẩm quyền cao nhất.
- `requirement/character_creation_system.md`: hợp đồng module tạo nhân vật.
- `requirement/CONG_PHAP_SYSTEM.md`: hợp đồng module Công pháp.
- `requirement/Xianxin_map.md`: bối cảnh bản đồ/thế giới; luật cảnh giới dẫn chiếu về bản FINAL.
- `data/`: nguồn JSON và dữ liệu runtime cho trình duyệt.
- `js/engine.js`: state machine, chiến đấu, tu luyện, Mệnh, Con Đường, Tà Thần và save/load.
- `js/ui.js`, `js/main.js`: giao diện và điều phối ứng dụng.
- `tools/`: script sinh dữ liệu và kiểm thử.

## Chạy game

Mở `index.html` bằng trình duyệt. Game không yêu cầu build frontend.

## Sinh lại dữ liệu và kiểm thử

```bash
node tools/generate_guild_data.js
node tools/generate_world_data.js
node tools/verify_game.js
```

`verify_game.js` kiểm tra 10.000 lượt sinh nhân vật, tính toàn vẹn dữ liệu, 14 cấp phẳng, save migration, bản đồ, trang bị, Công pháp, Ngoại Đạo Giả, UI và DOM.

Muốn cập nhật năm nhân vật mẫu theo schema hiện hành:

```bash
node tools/verify_game.js --update-samples
```

## Nguồn dữ liệu chính

- `data/canh_gioi_tien_hiep.json`: đúng 14 cảnh giới phẳng và alias để migrate ID cũ.
- `data/path_fate_relations.json`: liên kết Mệnh–Con Đường, danh xưng 14 cấp và ngoại lệ Ngoại Đạo Giả.
- `data/fate-pool.json`: pool Mệnh Số.
- `data/tu_tien_factions.json`: vùng, tuyến đường, thế lực và tổ chức.
- `data/cong_phap.js`: catalog Công pháp bất biến; tiến độ từng Công pháp được lưu trong nhân vật.

Các file `.js` bridge trong `data/` phục vụ trình duyệt; không phải bản sao thừa của nguồn JSON.
