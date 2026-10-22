# Legacy audit ↔ canonical reconciliation

Tài liệu này đối chiếu các finding trong `CODE_REQUIREMENT_AUDIT_MASTER.md` với canonical hiện hành và behavior-first test suite. Các finding cũ không được coi là lỗi hiện tại nếu chúng kiểm tra một API/schema đã bị canonical thay thế; ngược lại, finding chỉ được đóng khi có runtime invariant hoặc test hành vi chứng minh.

## Trạng thái đã đối chiếu

| Nhóm legacy | Kết luận hiện tại | Bằng chứng |
|---|---|---|
| G1–G3 / validator và performance | Đã sửa | Runtime validation ở deserialize/post-action; performance metric không còn quyết định tính hợp lệ của save; `verify_canonical_contracts.js`, `profile_runtime_budget.js` |
| G7 / entropy boundary | Đã kiểm lại | `verify_random_boundaries.js`, `verify_character_generator_replay.js`, runtime seeded/replay paths |
| G9 / offline bundle | Đã sửa | `verify_offline_bundle.js`, bundle được rebuild từ nguồn hiện tại |
| Movement UI vs movement engine | Finding legacy cần phân biệt | Engine giữ 4 direction actions; UI dùng nhóm `act_move_group`; `verify_canonical_contracts.js`, `verify_ui_surface_contract.js` |
| Footprint/settlement NPC | Đã sửa theo canonical mới | Không lưu destination; expiry 3 ngày; 8 distinct visit days + monthly roll; `verify_audit_closure.js`, `verify_completion_tasks.js` |
| Technique cross-system | Đã sửa và mở rộng | DTO/context, prepare/channel/use, idempotency, cooldown; `verify_audit_closure.js`, `verify_canonical_contracts.js` |
| Companion UI/targeting | Đã sửa và mở rộng | Recovery/revive/mutation UI, threat/woundedness/guard seeded targeting; `verify_companion_runtime.js`, `verify_audit_closure.js` |
| Fate/path/anchor | Đã sửa các contract đã được xác nhận | Fate source/path/pity, Hung pool, unbound namespace, anchor threshold/max-3, Song Tu gate; `verify_review_batches.js`, `verify_audit_closure.js` |
| Generator/profession identifiers | Đã sửa | `phan` grade và `tho_san_di_trieu`; `verify_character_generator_replay.js`, `verify_utf8_integrity.js` |
| Log command echo/error boundary | Đã sửa | COMMAND_ECHO hidden, error mapping, grouped scene check; `verify_log_narrative.js`, `verify_canonical_contracts.js` |

## Các finding cũ phải đọc lại, không được copy nguyên trạng

1. Finding kiểm tra `index.offline.html` trước lần rebuild hiện tại đã obsolete; phải dùng `verify_offline_bundle.js` để so sánh marker/runtime thực tế.
2. Finding yêu cầu từng movement action xuất hiện trên action bar đã obsolete; canonical mới yêu cầu engine direction contract và UI grouped presentation.
3. Finding yêu cầu footprint chứa `destinationHint` là ngược canonical mới; destination không được lộ cho player.
4. Finding yêu cầu settlement ngay ở visit thứ tám là ngược canonical mới; phải là tám ngày khác nhau và monthly eligibility roll.
5. Finding Song Tu không có realm/match gate là test legacy sai; canonical hiện tại yêu cầu realm 6 và match score tối thiểu 5.
6. Finding về `fateVaultCapacity` phải phân biệt active slot projection với mảng runtime legacy; test không được ép capacity bằng kích thước array sau thao tác splice.

## Cách đóng một finding còn lại

Một finding chỉ được đánh dấu `resolved` khi đủ cả ba điều kiện:

- canonical file hiện hành mô tả cùng schema/behavior;
- runtime có API hoặc state invariant tương ứng;
- behavior-first test tái hiện cả happy path, blocker và round-trip/idempotency nếu applicable.

Gate chính hiện tại:

```text
node tools/run_regression_suite.js
```

Trong đó `verify_canonical_contracts.js` là gate mới thay cho các smoke assertion chỉ kiểm tra symbol/source string.
