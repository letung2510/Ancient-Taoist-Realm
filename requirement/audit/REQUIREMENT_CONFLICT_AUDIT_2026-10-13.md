# Requirement conflict audit — 2026-10-13

## Phạm vi

Audit này đối chiếu requirement đang active với runtime, catalog và regression gate. Các tài liệu lịch sử vẫn được giữ nguyên để truy vết; quyết định hiệu lực nằm trong các canonical document mới hơn và trong mục kết luận dưới đây.

## Kết quả gate

| Gate | Kết quả |
|---|---|
| `validate_requirement_docs.js` | PASS — không broken link, fence lỗi, file cũ hoặc replacement character |
| `verify_canonical_contracts.js` | PASS |
| `verify_audit_closure.js` | PASS |
| `verify_action_dispatch_matrix.js` | PASS |
| `verify_review_batches.js` | PASS sau khi đồng bộ assertion với contract resonance |
| `verify_technique_channel_matrix.js` | PASS sau khi catalog có technique preparation thực sự |

## Conflict đã xác nhận và đã xử lý

### 1. Resonance Mệnh bị hiểu không thống nhất khi Fate lặp

Requirement quy định mỗi Fate ID chỉ là một nguồn resonance và tối đa ba nguồn có ID ổn định. Runtime đã dedupe bằng `Set`, nhưng regression cũ chỉ kiểm tra một ngưỡng `<= 1`, không tương ứng với catalog mới dùng phần trăm (`samePathPct: 5`, cap `18`).

Quyết định: giữ phần trăm canonical của catalog; test kiểm tra uniqueness của source ID và cap `18%`, không dùng ngưỡng cũ `1`.

### 2. `technique_prepare` thiếu technique có preparation trong catalog

Requirement có phase Prepare → Channel → Commit, nhưng catalog active trước audit không khai báo technique có `preparation`/`prepareCost`; command bridge vì vậy chuyển sang nhánh instant-use đúng theo code, khiến test channel không có fixture hợp lệ.

Quyết định: `Huyền Môn Trận Giải` là technique đầu tiên có preparation một lượt, chi phí chuẩn bị `4 Linh Khí + 1 Thể Lực`, có thể bị gián đoạn và không hoàn tiền. Instant technique vẫn dùng trực tiếp, không bị ép qua Prepare.

## Quyết định canonical đang có hiệu lực

- `SYSTEM_LOGIC_CATALOG/features/06-content/TECHNIQUE_CANONICAL.md` là nguồn ưu tiên cho source namespace, resonance, Prepare/Channel/Commit, guild, Tự Lập và Cấm Thuật (đã hợp nhất từ `TECHNIQUE_FATE_INTERACTION_CANONICAL.md` ngày 2026-10-22).
- Fate chỉ modifier/risk/requirement; không bypass ownership, guild rank, intent hoặc access policy.
- Fate ID trùng chỉ tính một lần; suppressed Fate không cộng resonance.
- `technique_prepare` là preview read-only khi chưa xác nhận; chỉ commit mới trừ cost và tạo receipt.
- Technique không có preparation dùng instant action; không hiển thị Prepare giả.
- Tài liệu lịch sử liệt kê E1–E10 không được dùng làm blocker mới nếu không có failing probe tương ứng. E1/E10 đã có quyết định reconcile event-only; E9 là test cũ đã được thay bằng action contract hiện hành.

## Các mục còn là evidence debt, không phải conflict logic

- Browser click-through/full responsive và native file chooser vẫn là evidence debt.
- Cân bằng catalog, chi phí công trình, weather tuning và visual regression cần playtest/evidence riêng.
- Các bảng “MISSING/CHƯA CÓ” trong `AUDIT_CANONICAL.md` là register lịch sử; không tự động xem là runtime defect nếu canonical feature gate tương ứng đã PASS.

## Quy tắc duy trì

Mỗi thay đổi requirement phải cập nhật đồng thời canonical document, catalog/runtime contract và regression fixture. Không hạ assertion để làm xanh gate; nếu test cũ lệch contract thì sửa test và ghi rõ lý do trong audit này.
