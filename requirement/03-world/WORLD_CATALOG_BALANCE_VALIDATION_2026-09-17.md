# World Catalog Balance Validation — 2026-09-17

`validateWorldCatalogs()` là invariant runtime cho các catalog ảnh hưởng trực
tiếp đến Map V2:

- weather phải có severity `0..5`, duration dương và transition chỉ trỏ tới
  weather tồn tại;
- recipe phải có profession, output, material/cost không âm và hữu hạn;
- Công Trình phải giữ đủ bốn loại canonical với cost dương; Hộ Giới Đại Trận
  có SAN protection dương, influence dương và không vượt trần `0.75` sau upgrade.

Regression nằm trong `tools/verify_dichi_deep.js`, chạy cùng map structure,
weather, Path fusion và Dị Thể contract. Đây là catalog/balance gate; cân bằng
thực nghiệm trên browser vẫn là gate riêng.
