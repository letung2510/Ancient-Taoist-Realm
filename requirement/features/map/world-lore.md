# Bản đồ — Bối cảnh Vạn Giới Lộ

## Mục đích

Bối cảnh thế giới và bảng trọng số dùng khi sinh vùng, thế lực, NPC nổi bật. Chỉ là dữ liệu nguồn cho sinh procedural; luật mô phỏng thế lực/chiến tranh thuộc [../world-simulation/README.md](../world-simulation/README.md), thang cảnh giới thuộc [../realm-progression/README.md](../realm-progression/README.md).

## Dữ liệu & trạng thái

- Thế giới **Vạn Giới Lộ**: đại lục Trung Vực ở trung tâm, bốn vực phụ Đông Hoang, Tây Mạc, Nam Chướng, Bắc Nguyên, cùng Vô Tận Hải, Thiên Không Vực, U Minh Giới.
- Thời gian lớn tính theo **Kỷ** (500–1000 năm); **Đại Kiếp** có thể reset một phần bản đồ thế lực.

## Rules

### Loại vùng (region type)

| ID | Loại vùng | Đặc điểm | Linh khí | Nguy hiểm |
|---|---|---|---|---|
| MAP-LORE-001 | Linh Vực | Đất thánh, tông môn lớn tranh giành | Rất cao | Cao (cường giả) |
| MAP-LORE-002 | Hoang Dã | Rừng núi chưa khai phá | Trung bình–cao | Cao (yêu thú) |
| MAP-LORE-003 | Biên Thành | Thành trấn tán tu, chợ đen | Thấp–trung | Trung bình (trộm cướp) |
| MAP-LORE-004 | Cấm Địa | Di tích thượng cổ, tử vực | Cực cao | Cực cao |
| MAP-LORE-005 | Vương Kinh | Thủ đô thế tục, thế gia quyền quý | Trung bình | Trung bình (chính trị) |
| MAP-LORE-006 | Hải Vực/Không Vực | Đảo trôi, hạm đội tu sĩ | Biến động | Biến động |

### Chủng tộc

| ID | Chủng tộc | Thiên phú | Tuổi thọ nền | Ghi chú |
|---|---|---|---|---|
| MAP-LORE-010 | Nhân Tộc | Cân bằng, dễ đột phá cảnh giới thấp | ~120 năm | Mặc định, đa dạng thế lực nhất |
| MAP-LORE-011 | Yêu Tộc | Thân thể mạnh, linh hồn yếu | 300–800 năm | Nhiều loài (Hổ, Xà, Cầm, Long…) |
| MAP-LORE-012 | Ma Tộc | Tu luyện bằng sát khí/oán khí | ~500 năm | Bị Chính Đạo cảnh giác, sống ở Ma Vực |
| MAP-LORE-013 | Cổ Tộc (Yêu Cổ Chủng) | Sức mạnh huyết mạch thượng cổ | Gần bất tử nếu không chết trận | Cực ít, huyết mạch loãng dần |
| MAP-LORE-014 | Linh Tộc (Tinh Linh) | Ngự ngũ hành/thiên địa chi lực | ~1000 năm | Ẩn dật |
| MAP-LORE-015 | Ma Thần Hậu Duệ | Lai Ma Tộc và Nhân Tộc | Biến động | Bị kỳ thị; thường tán tu hoặc phản diện |
| MAP-LORE-016 | Cơ Quan Tộc | Luyện chế bằng trận pháp/cơ quan | Vô hạn (bảo trì) | Hiếm, gắn 1–2 môn phái kỳ môn |

| ID | Rule |
|---|---|
| MAP-LORE-017 | Chủng tộc roll theo trọng số vùng (ví dụ Yêu Tộc dày ở Hoang Dã, Ma Tộc ở Cấm Địa/Ma Vực). |
| MAP-LORE-018 | Bản đồ không định nghĩa thang tu vi riêng: player, NPC, thế lực dùng 14 cấp phẳng của [../realm-progression/README.md](../realm-progression/README.md). NPC/thế lực roll cấp theo phân phối hình tháp; player mới luôn ở cấp 1. |

### Loại thế lực

| ID | Loại | Nội dung |
|---|---|---|
| MAP-LORE-020 | Tông Môn | Chính Đạo (Kiếm, Đan, Phù, Trận Pháp, Đạo, Phật Tông…); Ma Đạo (Huyết Tông, Quỷ Tông, Tà Đan Môn…); Trung lập/Kỳ Môn (thương hội tu sĩ, Săn Yêu Đường, Cơ Quan Môn, Luyện Khí Sư Công Hội) |
| MAP-LORE-021 | Thế Gia | Gia tộc huyết mạch kiểm soát một vùng; có Gia Tộc Bí Pháp, Trưởng Lão Hội, Tổ Nghiệp Linh Mạch |
| MAP-LORE-022 | Vương Triều | Thế lực thế tục quản dân, thuế, quân; bảo trợ/đối đầu/bị khống chế bởi tông môn |
| MAP-LORE-023 | Tán Tu | Cá nhân/nhóm nhỏ; nguồn nhân vật phụ và random encounter chính |
| MAP-LORE-024 | Hắc Đạo | Sơn Trại, sát thủ, buôn lậu |
| MAP-LORE-025 | Thế Lực Ẩn/Truyền Kỳ | Cổ tông diệt vong, giáo phái tà thần, tổ chức bí mật xuyên vương triều |

### Stat sinh procedural

| ID | Rule |
|---|---|
| MAP-LORE-030 | `Faction { loại, chính/tà/trung lập (trọng số theo loại), quyMô 1–10 (log), cảnhGiớiCaoNhất, tàiNguyên {linhThạch, linhMạch, đanDược, phápBảo} 1–100 mỗi loại, danhVọng −100..+100, ngoạiGiao {đồng minh / trung lập / thù địch}, traits 1–3 }`. Trait: Thiện chiến, Giàu tài nguyên, Bí pháp thất truyền, Nội bộ lục đục, Đang suy tàn, Đang trỗi dậy, Có Thánh Địa/Bí Cảnh riêng, Nợ máu với thế lực khác. |
| MAP-LORE-031 | `Character { chủngTộc (trọng số vùng), cảnhGiới (roll lệch), cănCốt 1–100, linhCăn [Kim, Mộc, Thủy, Hỏa, Thổ, Song/Tam (hiếm), Dị (cực hiếm)], tínhCách 2 trait, xuấtThân [Tông Môn / Thế Gia / Tán Tu / Hắc Đạo / Vô Danh], trangBị (không vượt cấp), mụcTiêuẨn }`. |
| MAP-LORE-032 | Trọng số thế lực theo vùng: Linh Vực — Tông Môn 60%, Thế Gia 20%, Tán Tu 15%, Hắc Đạo 5%; Biên Thành — Tán Tu 50%, Hắc Đạo 30%, Thương hội 15%, Tông môn nhỏ 5%; Cấm Địa — Ma Tộc/Cổ Tộc 40%, Thế lực ẩn 30%, Tán tu liều mạng 30%. |
| MAP-LORE-033 | Mỗi vùng sinh 3–8 thế lực, liên kết ngoại giao lẫn nhau; NPC nổi bật (Tông Chủ, Trưởng Lão, Thiên Kiêu) gắn vào thế lực. Trait thế lực sinh quest hook (ví dụ Nội bộ lục đục → quest điều tra phản đồ). |
| MAP-LORE-034 | Kinh tế: Linh Thạch Hạ/Trung/Thượng/Cực Phẩm, tỷ giá 1 Thượng = 100 Trung = 10.000 Hạ. Tài nguyên chiến lược: Linh Mạch (cố định vị trí, mục tiêu tranh đoạt), Đan Dược, Yêu Đan, Cổ Tịch. |
| MAP-LORE-035 | Sự kiện sinh thái thế giới: tông môn mở bí cảnh có thời hạn, chiến tranh lãnh thổ thế gia, yêu thú bạo động tràn khỏi Hoang Dã, Đại Kiếp định kỳ reset một phần bản đồ. Luật thực thi: [../world-simulation/README.md](../world-simulation/README.md). |

## Acceptance

- Bảng trọng số và tên loại dùng đúng chuỗi trên khi sinh dữ liệu; không tạo thang cảnh giới riêng cho bản đồ.
- Gate: `node tools/verify_world_data_audit.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-LORE-001..006 | data (`WORLD_MAP.regions`) | Khớp |
| MAP-LORE-018 | data/canh_gioi_tien_hiep.json | Khớp |
| MAP-LORE-030..033 | data (`FACTION_DATA`) | Khớp |
| MAP-LORE-034..035 | js/expansion.js:`startWorldEvent` | Khớp |
