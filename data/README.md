# Data runtime và nguồn dữ liệu

Các tệp trong thư mục này được trình duyệt nạp trực tiếp hoặc được các script build dùng làm nguồn sinh dữ liệu:

- `world_data.js`, `data.js`, `fate_data.js`, `fate_relationships.js`, `cong_phap.js`: dữ liệu runtime.
- `canh_gioi_tien_hiep.json`, `tu_tien_factions.json`: nguồn JSON/build data. Không có `fate-pool.json` hoặc `fate-relationships.json` runtime riêng; FATE canonical nằm ở các file JS được liệt kê trong source map.
- `Xianxin_guild.md`: nguồn sinh dữ liệu môn phái.
- `path_fate_relations.json` là nguồn Node/build; `path_fate_relations.js` là bridge duy nhất được browser load: liên kết tag Mệnh Số với Con Đường/Nghề Ẩn, bao gồm tỷ lệ roll Luân Hồi Tiên.
- Bảng phân nhóm và audit toàn bộ nguồn FATE: `fate_system_update/FATE_DATA_SOURCE_MAP.md`.
- Mệnh Kho runtime lưu trong `state.fateInventory`, có sức chứa bằng 2× số Mệnh Số đang gắn và hỗ trợ tiếp nhận ưu tiên/hiến tế.
- `canh_gioi_tien_hiep.json` là nguồn chuẩn của đúng 14 cấp phẳng; `legacyIds` chỉ dùng để migrate save cũ, không tạo tiểu cảnh runtime.
- Save version 12 đóng gói Mệnh Kho trong `player.fate.vaultIds`; `state.fateInventory` chỉ là adapter nội bộ khi game đang chạy.
