# Canonical implementation note — Map, NPC, Novel Log và Dị Chí

Encoding: UTF-8 (không dùng ANSI; file được đọc bằng UTF-8 và giữ BOM nếu hệ
soạn thảo yêu cầu). Đây là requirement bổ sung để khóa các khoảng trống logic
được phát hiện khi áp dụng audit ngày 2026-09-14.

## Runtime contract

- Mọi save có `pathState` và `specialPhysiqueState`; migration chỉ khởi tạo
  state rỗng, không tự unlock.
- Dị Thể không roll khi tạo nhân vật. Gameplay event gọi
  `recordSpecialPhysiqueProgress`; người chơi phải claim một ứng viên duy nhất.
- `WORLD_MAP.nodePool`/`openWorld.coordinateIndex` là registry spatial additive;
  node procedural có `regionId`, `mapNodeType`, `subLocations` và reciprocal exits.
- NPC hiện diện được resolve theo `npcState.currentNodeId`; dialogue và quest
  không được suy ra chỉ từ tên NPC.
- Mọi player-visible log đi qua `narrativeSafe`; event debug-only mới được giữ
  command echo và mã nội bộ.
- Archive log là queue retry độc lập, không được làm thất bại hoặc chặn action
  gameplay khi IndexedDB unavailable.

## Determinism và tương thích

Các resolver dùng save state, ngày game và event key; deserialize save cũ phải
idempotent. Các field mới đều additive, và các thay đổi map/NPC/log không được
thay đổi schema dữ liệu tĩnh hiện có.
---

## AMENDMENT 2026-09-16 — PHẠM VI TRIỂN KHAI BỔ SUNG

Tên canonical của nhánh thể chất/thức tỉnh là **Dị Thể**. Map V2/interaction là trọng tâm còn thiếu: influence gradient, fog, completion, node history, sub-location và travel weighting phải nối qua resolver runtime canonical. Tab Thế giới quản lý Công Trình, gồm Truyền Tống Trận và Hộ Giới Đại Trận. Con Đường Ẩn và Nghề Ẩn tách namespace; Nghề Ẩn chỉ là nghề phụ mở bằng Cổ Tịch Tà Thần sau khi nghề chính đã khóa.

Log phải novel style và gộp các event cùng ngày/tháng/cùng scene thành một đoạn văn.
