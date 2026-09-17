# Save Migration Multi-Version Fixtures — 2026-09-17

## Phạm vi

Mục 3 (namespace Nghề chính/Nghề Ẩn) và mục 20 (legacy history/statDisplay migration) phải được kiểm tra qua deserialize thật, không chỉ gọi `ensureExpansionState` trên object đang sống.

## Hợp đồng

- Save v1 có thể chỉ chứa `player.hiddenProfession`, thiếu `professionState`, map state và Dị Thể state.
- Save v7 có thể chứa `professionState.hiddenId`, nhưng `secondaryId` và compatibility mirror chưa được chuẩn hóa.
- History legacy không có ID/statDisplay phải được nâng cấp deterministic.
- Sau migration, `validateExpansionState` phải pass và canonical serialize → deserialize không làm đổi namespace.
- Save cũ thiếu `meta.saveId` được cấp một ID deterministic từ identity ổn định của nhân vật để replay envelope không bị phá.

## Regression

`tools/verify_review_batches.js` tạo fixture v1/v7, deserialize qua runtime thật, kiểm tra hidden profession vào đúng slot phụ, kiểm tra `legacy_0`, validate invariant và round-trip canonical.

## Chưa hoàn thiện

Không còn thiếu logic migration trong các fixture đã định nghĩa. Các save format ngoài v1/v7 chưa có fixture riêng; nếu phát sinh version mới phải bổ sung fixture trước khi nâng version runtime.
