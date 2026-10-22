# Data & Runtime — Ngân sách hiệu năng và lưu trữ

## Mục đích

Giữ game mượt khi chơi lâu: giới hạn kích thước history/save, archive log cũ ra IndexedDB, ngân sách render/offline theo profile thiết bị, tra cứu catalog O(1). Profile chỉ đổi ngân sách hiển thị/chẩn đoán, không đổi luật gameplay.

## Dữ liệu & trạng thái

| Giới hạn | Giá trị |
|---|---|
| `state.history` runtime | ≤ 300 event |
| `history` trong save | 100 event gần nhất + `logState.totalEvents` (tổng số) |
| Lịch sử node | ≤ 50 record/node |
| Lịch sử thời tiết | ≤ 30 |
| Lịch sử actor (NPC) | ≤ 30 mẫu (cửa sổ chi tiết offline) |
| Ký ức / tin đồn NPC | ≤ 20 / ≤ 12 record |
| Archive encounter offline | ≤ 100 |
| Payload save serialized | < 5 MB (baseline profile hiện hành) |

| Profile | Chọn khi | FPS mục tiêu | Map render | Story window | NPC record/tick | Offline chi tiết |
|---|---|---|---|---|---|---|
| `standard` | mặc định | 60 | 80 | 20 | 100 | 30 ngày |
| `weak` | `hardwareConcurrency ≤ 2` hoặc `deviceMemory ≤ 2 GB` | 30 | 24 | 12 | 50 | 14 ngày |
| `reduced` | người dùng yêu cầu reduced-motion | 45 | giới hạn | giới hạn | giới hạn | như standard |

## Rules

| ID | Rule |
|---|---|
| DATA-PRF-001 | Áp các giới hạn retention ở bảng trên; event cột mốc/quan trọng/hiếm/sử thi không bị prune khỏi bộ đếm canonical, văn cũ chỉ giữ nếu nằm trong retention. Validator state kiểm tra giới hạn của history phụ (quan hệ, narrative). |
| DATA-PRF-002 | Log cũ archive độc lập vào IndexedDB, object store `events`, keyPath `id`, mỗi bản ghi có `archivedAt` (đọc lại theo mới nhất). Lỗi archive không chặn save hay lượt chơi; hàng đợi chỉ xóa batch sau khi transaction đã tạo; lỗi open/transaction đưa batch về retry queue; archive không đổi state gameplay. Không dùng localStorage cho lịch sử lớn. |
| DATA-PRF-003 | DOM story panel chỉ render cửa sổ đoạn gần nhất theo profile (20/12), đã nhóm cảnh trước khi append; không render toàn bộ lịch sử. |
| DATA-PRF-004 | UI bản đồ chỉ gọi influence resolver cho node đang render, cache theo `influenceRevision`; Lân Cận render node đã ghé/có thể tới/chưa biết, không render chi tiết actor cho node trong sương. |
| DATA-PRF-005 | Offline: tối đa 30 ngày gần nhất chạy tick chi tiết (14 với `weak`), phần xa hơn tổng hợp (aggregate); tick idempotent theo `lastProcessedDay` và key event/task/encounter; offline không phát văn từng actor, chỉ lưu aggregate/cascade cần thiết. Luật catch-up thế giới: [cross-system/world-kernel-and-events](../cross-system/world-kernel-and-events.md). |
| DATA-PRF-006 | `resolvePerformanceProfile()` là hàm thuần; `performanceProfile(state)` chỉ ghi profile runtime đang dùng. Profile không được đổi reward, RNG key, tiến trình, giá trị influence, schema save hay kết quả action. |
| DATA-PRF-007 | Catalog lớn (10.000 Mệnh, ~14.000 quan hệ) được index một lần khi load: `Map` theo ID và theo `fateId` cho quan hệ; mọi tra cứu nóng là O(1)/O(k), không `find`/`filter` trên mảng catalog mỗi lần render. |
| DATA-PRF-008 | `runtimeBudgetSnapshot()` báo thời gian trung bình map influence, sinh NPC view-model, offline catch-up, cùng số lần gọi/tỉ lệ cache hit và kích thước save; profile Node áp ngân sách canonical trước khi batch được coi là xanh. |

## Acceptance

- Stress 360 event + save lớn: history runtime ≤300, payload < 5 MB; cắt history không làm mất entry mới nhất trên story panel.
- Inject lỗi open IndexedDB → retry → event thực sự được ghi khi IndexedDB hoạt động lại.
- Chọn profile weak/standard đúng điều kiện, thứ tự ngân sách đúng; FPS thật và quota IndexedDB từng thiết bị là QA thủ công.
- Gate: `profile_runtime_budget.js`, `verify_indexeddb_archive.js`, `verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| DATA-PRF-001 | engine.js: `state.history.splice(... - 300)`, `persisted.history = fullHistory.slice(-100)`, `totalEvents` | Khớp |
| DATA-PRF-002 | main.js: IndexedDB archive (`indexedDB`, `archivedAt`) | Khớp |
| DATA-PRF-004 | expansion.js: influence cache theo `influenceRevision` | Khớp |
| DATA-PRF-005 | expansion.js:`simulateWorldAggregate`, `simulateWorldUntil` | Khớp |
| DATA-PRF-006 | expansion.js:`resolvePerformanceProfile`, `performanceProfile` | Khớp |
| DATA-PRF-007 | engine.js:`fateById` | Khớp |
| DATA-PRF-008 | expansion.js:`runtimeBudgetSnapshot` | Khớp |
