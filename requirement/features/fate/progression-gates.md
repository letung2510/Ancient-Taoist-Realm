# Realm Progression — Cổng Mệnh Số (tạm giữ, thuộc `fate/`)

> Các rule `FATE-CD-*` tách từ canonical Con Đường cũ, là nền Mệnh Số mà đột phá và Con Đường đọc vào. Chúng thuộc phạm vi [../fate/README.md](../fate/README.md) và sẽ được chuyển sang đó; ID giữ nguyên khi chuyển.

## Mục đích

Công thức điểm Mệnh dùng cho cổng đột phá, Mệnh Dư/Mệnh Nợ, thang phẩm, Mệnh đang gắn vs Mệnh Kho, hiến tế Mệnh, roll Mệnh khởi tạo và Mệnh ẩn Luân Hồi Tiên.

## Dữ liệu & trạng thái

```json
{ "id": "fate_kiem_tinh_sat_van", "name": "Kiếm Tinh Sát Vận", "tier": "hoang",
  "nature": "cat|binh|hung|di", "score": 8, "tags": ["kiem", "sat"], "effects": [], "exclusiveProfession": null }
```

`player.fates` (đang gắn), `state.fateInventory` (Mệnh Kho), `player.fateDebt`, `player.fateSurplus`, `player.overdueFateDebt`, `player.pacts` (Mệnh Khế), `player.hiddenFates`.

## Rules

### FATE-CD-001 Điểm Mệnh và Mệnh hiệu dụng
```text
Total_Fate_Score  = tổng điểm Mệnh đang gắn
Normal_Fate_Score = tổng điểm Mệnh Cát/Bình đang gắn (không tính Hung)
R = Total_Fate_Score / max(1, |Normal_Fate_Score|)
effective_fate = Total_Fate_Score + fate_surplus × 2 − fate_debt × 3 − corruption × 0.5
```
`effective_fate` chỉ dùng kiểm tra đột phá ([PRG-RLM-003](../realm-progression/realms-14.md)); không sửa điểm gốc Mệnh hay vật phẩm trong kho. R chỉ phục vụ điều kiện riêng và cảnh báo (không dùng ma trận trạng thái 0,2–5,0 cũ).

### FATE-CD-002 Ba lớp Mệnh
Mệnh Điểm = quyền năng vay từ thế giới; Mệnh Tính = Cát/Bình/Hung/Dị; Mệnh Khế = lời thề, món nợ, quan hệ nhân quả đang ràng buộc.

### FATE-CD-003 Mệnh Dư và Mệnh Nợ
Hoàn thành quest, giữ lời thề, cứu NPC, bảo vệ Neo → Mệnh Dư. Cưỡng ép đột phá, dùng Cấm Thuật vượt điều kiện, phá Mệnh Khế → Mệnh Nợ. Mệnh Nợ > Mệnh Dư làm tăng chi phí SAN/Thọ Nguyên của lần đột phá kế tiếp. Trả Mệnh Nợ bằng Mệnh Cát, quan hệ quan trọng, ký ức hoặc quest thanh toán nhân quả. Mệnh Nợ quá hạn chặn cấp 11 ([PRG-RLM-003](../realm-progression/realms-14.md)).

### FATE-CD-004 Thang phẩm
Phàm → Linh → Hoàng → Huyền → Địa → Thiên → Thánh → Tiên. Phẩm thể hiện độ hiếm/tiềm năng, không quyết định Cát/Hung.

### FATE-CD-005 Mệnh đang gắn và Mệnh Kho
Chỉ Mệnh đang gắn tham gia Total/Normal/`match_score` và hiệu ứng; Mệnh trong kho không tự kích hoạt. Dung lượng kho = `max(2 × số Mệnh đang gắn, 2 × activeSlots của cảnh giới, dung lượng đã đạt trước đó)`; quyền inventory vô hạn của phe Phản Bội không áp dụng cho Mệnh Kho. Nhận Mệnh mới: (1) từ chối nếu trùng `fate_id` đang gắn/trong kho; (2) kho còn chỗ → thêm vào kho; (3) kho đầy → so `match_score` với Con Đường hiện tại, chỉ thay Mệnh kém tương hợp nhất khi Mệnh mới tốt hơn rõ ràng; (4) không có ứng viên → giữ nguyên, trả "không nhận". Gắn/tháo/dung hợp/hiến tế/thay Mệnh là transaction nguyên tử có rollback, không làm mất vật phẩm. UI tách Mệnh đang gắn và Mệnh Kho, hiển thị modifier, độ tương hợp Con Đường, Tương Sinh/Tương Khắc/Combo. Mệnh không có EXP riêng.

### FATE-CD-006 Năm Mệnh khởi tạo
Roll đúng 5 Mệnh cơ bản không trùng, tổng điểm > 5; mỗi lượt roll: Phàm 65%, Linh 30%, Hoàng 5%, Huyền–Tiên 0% (chỉ qua gameplay). Sai số lượng/trùng/tổng ≤ 5 thì roll lại nội bộ phần Mệnh, không phải quyền reroll của người chơi.

### FATE-CD-007 Mệnh ẩn Luân Hồi Tiên
Roll độc lập xác suất 0,0000075%, không chiếm 5 Mệnh cơ bản. Trúng: `hiddenFates: ["luan_hoi_tien"]`, `hiddenProfessionCandidate: "luan_hoi_tien"`, `hiddenProfession: null`; nghề ẩn chưa kích hoạt tới khi đủ điều kiện [PROF-HID-009](../profession/hidden-professions.md).

### FATE-CD-008 Hiến tế Mệnh
`sacrificeFate(state, fateId)` chỉ hợp lệ khi đã chọn Con Đường thường (không phải Ngoại Đạo Giả) và `fateId` nằm trong Mệnh Kho. Thành công: xóa Mệnh hiến tế, chọn một Mệnh không trùng có `match_score ≥ 3` với Con Đường, đưa vào kho (không tự gắn), trừ 5 SAN. Không có ứng viên hoặc kho không nhận → hủy transaction, không tiêu hao.

## Acceptance

- Mệnh trong kho không góp điểm/hiệu ứng; kho đầy chỉ thay Mệnh kém tương hợp hơn; crash giữa transaction không mất dữ liệu.
- Hiến tế không có kết quả phù hợp không mất Mệnh hay SAN.
- Phe Phản Bội cấp 11 bỏ khóa inventory thường nhưng Mệnh Kho giữ giới hạn.
- Gate: `node tools/verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-CD-001 | `js/engine.js:computeFate` | Khớp |
| FATE-CD-005 | `js/engine.js:fateVaultCapacity`, `receiveFate` | Khớp |
| FATE-CD-006 | `js/engine.js:drawInitialFates` | Khớp |
| FATE-CD-007 | `data/path_fate_relations.json:hidden_fates.luan_hoi_tien` | Khớp |
| FATE-CD-008 | `js/engine.js:sacrificeFate` (chọn ứng viên tương hợp cao nhất, không ngẫu nhiên) | Lệch |
