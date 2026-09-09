# FATE Feature Audit — 2026-09-09

## Đã apply runtime

- Catalog 10.000, grade/sign maps, element/path affinity và split effects.
- Weighted resolver theo cấp, fallback grade, duplicate essence, pending reward và khóa Tiên trong single-save.
- Active/Vault invariant, equip/unequip/swap, sacrifice, fusion, upgrade.
- Pairwise relationship, combo, relationship stage 0–4.
- Dưỡng Mệnh có cooldown ngày, điểm quan hệ và hành vi thật.
- Cộng Minh, Giác Ngộ, Buông Mệnh Nguội, Nghịch Mệnh, Trấn Mệnh, Thiên Cơ.
- Fate Evolution đã là hệ thống nhánh biến thể; `transformFate` cung cấp contract và công thức chi phí, ủy quyền commit cho expansion transaction.

## Đã có code nhưng chưa có nút UI riêng

`revealFateInsight`, `releaseStagnantFate`, `defyFate`, `suppressFate`, `heavenlyOmen` và `transformFate` hiện đã public trong `GameEngine`, nhưng một số action chưa có nút riêng trong card Mệnh. Chúng vẫn có thể gọi qua action/console tích hợp; việc bổ sung UI button là task presentation, không thay đổi gameplay contract.

## Giới hạn còn lại

1. `FATE_TRANSFORM` chưa có biến thể riêng cho từng ID trong catalog; hệ thống dùng branch definitions của `GameExpansion` làm nguồn canonical.
2. Khóa Mệnh Tiên là per-save (`state.meta.uniqueFateOwnership`), chưa phải server multiplayer thật.
3. Relationship stage 3→4 vẫn gắn với nghi thức đột phá; không tự động tăng chỉ bằng Dưỡng Mệnh.

## Kiểm chứng

`node --check js/engine.js`, `node --check js/ui.js`, `node tools/verify_game.js` phải pass trước mỗi release.
