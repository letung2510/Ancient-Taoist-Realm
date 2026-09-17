# UNRESOLVED PRODUCT POLICIES — ĐÃ CHỐT VÀ CODE 2026-09-17

Tài liệu này chốt các mục 29–33 của `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`. Các policy là canonical cho runtime, save migration và UI view model.

## 29 — Quan hệ Mệnh

- Quan hệ Mệnh không bị decay thụ động theo thời gian, offline hay world tick.
- `stagnantDays` chỉ là bộ đếm không tương tác; nó không trừ `points`, `stage`, `xp` hay effect.
- `decayPolicy` canonical là `none`; policy khác là state lỗi cần phát hiện, không tự âm thầm áp dụng.
- Khi đủ 60 ngày nguội, người chơi có thể dùng luồng giải phóng Mệnh đã có; đây là hành động chủ động, không phải decay tự động.

## 30 — Song tu/Dung Hợp Con Đường

- Player có tối đa hai slot: một Con Đường chính và một Con Đường phụ.
- Con Đường phụ chỉ mở qua explicit transition đã xác nhận, tiêu hao tài nguyên và không cho ghi đè bằng action thường.
- Không cho chọn trùng primary/secondary; affinity dung hợp bị giới hạn `0.75`.
- `pathState` là nguồn canonical; mirror trên `player` chỉ phục vụ tương thích save cũ.

## 31 — Dị Thể và loại trừ

- Dị Thể là modifier/progression branch độc lập; mặc định không khóa Nghề, Con Đường, faction hoặc ending.
- Chỉ các mảng `exclusions.paths` và `exclusions.professions` trong catalog mới tạo blocker khi claim.
- Không được suy diễn exclusion từ tên Dị Thể, branch hoặc ending tag.

## 32 — Ownership Công Trình

- Mọi công trình active phải có `ownerType` thuộc `player`, `npc` hoặc `faction` và có `ownerId`.
- Công trình mới do player tạo thuộc player; chuyển chủ là action explicit, phải ghi `transferHistory` và node history.
- Công trình faction sau petition thuộc faction; công trình NPC sau transfer thuộc NPC.
- Quyền repair/upgrade/dismantle kiểm tra owner hiện tại; không dùng quyền của chủ cũ sau transfer.

## 33 — NPC offline

- Offline dùng hai lớp: aggregate simulation cho phần thời gian xa và actor-level deterministic projection cho cửa sổ gần.
- Cửa sổ actor mặc định và retention là 30 ngày; batch aggregate mặc định 3 ngày.
- Actor projection giữ final state, incident, actor history, memory/rumor giới hạn; không giả lập từng frame hoặc từng UI action.
- `lastProcessedDay` là idempotency key; gọi lại cùng target không được nhân đôi event/reward.

## Runtime contract và phần chưa hoàn thiện

`GameExpansion.designPolicySnapshot()` công bố policy; `validateDesignPolicies()` kiểm tra save/runtime. Regression nằm trong `verify_review_batches.js`.

Các giá trị balance chi tiết, tần suất NPC cụ thể và FPS thiết bị yếu vẫn là tuning gate riêng; không được coi là thay đổi policy ở tài liệu này.
