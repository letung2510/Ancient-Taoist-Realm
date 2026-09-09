# TRỌNG SỐ ROLL MỆNH SỐ THEO CẤP — BỔ SUNG (đọc kèm `FATE_NEW_LOGIC_ADDENDUM.md`)
> Giải quyết đúng vấn đề: pool 10.000 mệnh có 80% là Phàm Phẩm — nếu dùng NGUYÊN kích thước pool
> làm xác suất roll thì nhân vật Cấp 10 vẫn 80% ra Phàm mỗi lần nhận Mệnh, dù lúc này Phàm gần như
> vô dụng. Cần TÁCH BIỆT 2 khái niệm.

---

## 1. TÁCH BIỆT 2 KHÁI NIỆM ĐANG BỊ LẪN

| Khái niệm | Ý nghĩa | Có nên đổi theo Cấp không |
|---|---|---|
| **Kích thước pool** (Phàm 8000/Linh 1500/.../Tiên 1) | Số lượng BIẾN THỂ TÊN GỌI khác nhau có sẵn trong catalog — chỉ để tránh lặp tên khi roll trúng cùng grade nhiều lần | **KHÔNG cần đổi** — giữ nguyên 10.000, đây là kho từ vựng, không phải xác suất |
| **Trọng số roll theo Cấp** (mục 2 dưới đây) | Xác suất THỰC TẾ ra grade nào mỗi lần roll, tại thời điểm nhân vật đang ở Cấp bao nhiêu | **ĐÂY LÀ THỨ CẦN THÊM MỚI** — hiện chưa tồn tại, là nguyên nhân gây cảm giác bất hợp lý mày nêu |

**Cách hoạt động đúng:** khi roll 1 Mệnh Số, engine chọn **GRADE trước** (theo bảng trọng số Cấp ở
mục 2), rồi mới chọn **ngẫu nhiên ĐỀU 1 entry cụ thể trong đúng grade đó** từ pool 10.000 sẵn có.
Pool không đổi, chỉ đổi cách chọn grade trước khi vào pool.

---

## 2. BẢNG TRỌNG SỐ MỚI THEO CẤP (dùng đúng mốc đã có ở nghi thức Đột Phá phân tầng)

| Cấp | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1-2 | 65% | 30% | 5% | 0% | 0% | 0% | 0% | 0% |
| 3-4 | 40% | 35% | 20% | 5% | 0% | 0% | 0% | 0% |
| 5-7 | 15% | 30% | 30% | 18% | 6% | 1% | 0% | 0% |
| 8-10 | 3% | 12% | 25% | 30% | 22% | 7% | 1% | 0% |
| 11-13 | 0% | 3% | 12% | 25% | 30% | 22% | 6% | 0.5% |
| 14 | 0% | 0% | 5% | 15% | 28% | 32% | 19% | 1% |

> Cấp 1-2 GIỮ NGUYÊN đúng bảng gốc đã thống nhất từ đầu (character_creation_system.md) — không đổi
> gì ở giai đoạn khởi tạo nhân vật, chỉ thêm các mốc SAU đó vốn trước đây chưa có bảng nào cả.

**Điểm quan trọng đã sửa sau khi test bằng data thật:** bản nháp đầu tiên đặt `tien` = 5% ở Cấp 14 —
QUÁ CAO so với việc pool `tien` chỉ có ĐÚNG 1 entry duy nhất toàn server (xem mục 4
`FATE_NEW_LOGIC_ADDENDUM.md` — khóa độc bản). Với 5%, Mệnh độc bản đó gần như chắc chắn bị "dùng
hết" chỉ sau vài chục lượt roll của TOÀN SERVER, sau đó mọi người chơi khác roll trúng ô `tien`
sẽ gặp lỗ hổng không có gì để trả. Đã hạ xuống 0.5-1% và thêm cơ chế fallback ở mục 3.

---

## 3. CƠ CHẾ FALLBACK KHI 1 GRADE ĐÃ CẠN/BỊ KHÓA ĐỘC BẢN

```
rollFateForLevel(characterLevel, fatePoolByGrade, availableCountByGrade):
  lấy bảng trọng số theo Cấp (mục 2)
  DUYỆT từ grade cao xuống thấp: nếu grade nào có trọng số > 0 nhưng availableCountByGrade[grade] == 0
  (đã cạn hoặc bị khóa độc bản — tra bảng serverUniqueFateOwnership) -> DỒN trọng số đó sang grade
  liền kề THẤP HƠN gần nhất còn entry khả dụng (không mất trọng số, không roll hụt)
  rồi mới random chọn grade theo trọng số đã dồn, và random đều 1 entry trong grade đó
```
Đã test bằng data thật (script `grade_weight_by_level.js`): giả lập `tien` bị khóa (đã có chủ) ở
Cấp 14 → toàn bộ 1% trọng số dồn đúng sang `thanh`, không bị mất hay lỗi.

---

## 4. VIỆC CẦN LÀM TIẾP
1. Số % ở bảng mục 2 là ĐỀ XUẤT dựa trên logic tiến triển hợp lý — cần cân bằng qua playtest thật,
   đặc biệt đoạn 8-14 vì đây là vùng game có ít dữ liệu tham chiếu nhất.
2. Áp dụng CÙNG 1 bảng trọng số này cho MỌI nguồn nhận Mệnh Số (quest reward, Phường Thị, Cơ Duyên,
   Khâm Thiên Giám...) — không để mỗi nguồn tự định nghĩa 1 bảng riêng, tránh lặp lại đúng vấn đề
   "80% Phàm bất kể ngữ cảnh" ở nơi khác dù đã sửa ở nơi này.
3. `availableCountByGrade` cần tính LẠI mỗi lần roll (trừ những entry đã bị khóa độc bản — hiện chỉ
   áp dụng thật sự cho `tien`, nhưng nên viết tổng quát để dễ mở rộng nếu sau này khóa thêm entry
   khác ở `thanh`/`thien`).
