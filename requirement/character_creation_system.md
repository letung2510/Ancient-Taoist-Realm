# MODULE CONTRACT — KHỞI TẠO NHÂN VẬT

> Luật gameplay chuẩn nằm trong `../HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`. File này chỉ quy định đầu vào, đầu ra và invariant riêng của character generator; không định nghĩa lại cảnh giới, Mệnh Số hay Công Pháp.

## 1. Đầu vào

```ts
type CharacterCreationInput = {
  name?: string;
  startRegionId: string;
  race?: string;
  basePhy?: number;
  baseMag?: number;
  aptitude?: number;
  comprehension?: number;
  spiritualRoots?: string[];
  personalityTraits?: string[];
  background?: string;
  hiddenGoal?: string;
};
```

`startRegionId` phải tồn tại. Mọi override phục vụ test vẫn phải qua validate và clamp như dữ liệu roll.

## 2. Quy trình canonical

1. Validate vùng và xác định địa điểm khởi đầu.
2. Roll chủng tộc theo trọng số vùng.
3. Roll PHY/MAG trong 10–20.
4. Roll Căn Cốt và Ngộ Tính độc lập theo Gaussian `μ=50`, `σ=15`, clamp 1–100.
5. Roll Linh Căn theo tỷ lệ trong bản final.
6. Chọn hai tính cách không trùng, một xuất thân và một mục tiêu ẩn.
7. Gán `realm.id = di_menh`, `realm.level = 1`, EXP bằng 0.
8. Roll đúng năm Mệnh cơ bản theo trọng số Phàm/Linh/Hoàng `65/30/5`; không trùng và tổng điểm lớn hơn 5.
9. Đưa năm Mệnh vào `fate.equippedIds`; Mệnh Kho rỗng, capacity bằng 10.
10. Roll Mệnh ẩn Luân Hồi Tiên độc lập. Nếu trúng, chỉ gán candidate; không kích hoạt nghề.
11. Gán hai Công Pháp Phàm Giai nhập môn; chúng không được tính là Công Pháp lõi khi kiểm tra cấp 3.
12. Tính derived stats, validate invariant rồi trả object canonical.

Trọng số `65/30/5` là trọng số của từng lượt thử trước bước loại bộ Mệnh không hợp lệ. Tỷ lệ đầu ra sau rejection có thể lệch nhẹ và phải được đo trong test thống kê.

## 3. Invariant

- Player mới luôn là Di Mệnh Cảnh cấp 1; không có tiểu cảnh.
- `origin.personality` có đúng hai giá trị khác nhau.
- Căn Cốt và Ngộ Tính là hai biến độc lập.
- Có đúng năm `equippedIds`, không trùng, phẩm không quá Hoàng và tổng điểm > 5.
- `vaultIds` rỗng; `vaultCapacity = equippedIds.length × 2`.
- `hiddenProfession` luôn là `null` khi vừa tạo.
- Trúng Luân Hồi Tiên chỉ tạo `hiddenProfessionCandidate = "luan_hoi_tien"`.
- Lựa chọn Con Đường và lựa chọn tổ chức là hai quyết định độc lập.

## 4. Nguồn triển khai

- Node generator: `../character_generator.js`.
- Browser generator và save migration: `../js/engine.js`.
- Mệnh Số: `../data/fate-pool.json`.
- Quan hệ Con Đường: `../data/path_fate_relations.json` và bản runtime `.js`.
- Bộ test: `../tools/verify_game.js`.
