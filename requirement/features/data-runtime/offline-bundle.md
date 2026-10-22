# Data & Runtime — Bundle offline (`index.offline.html`)

## Mục đích

Quy định vòng đời bản phát hành một-file `index.offline.html` (chạy không cần server) so với nguồn online (`index.html`, `js/`, `data/`).

## Dữ liệu & trạng thái

| Thành phần | Vai trò |
|---|---|
| `index.offline.html` | Bundle phát hành riêng, sinh từ nguồn online |
| `tools/build_offline_bundle.ps1` | Script build bundle |
| `tools/verify_offline_bundle.js` | Gate đối chiếu bundle với nguồn |
| `tools/run_regression_suite.js` | Bộ regression chung |

## Rules

| ID | Rule |
|---|---|
| DATA-OFF-001 | `index.offline.html` **chỉ được rebuild khi người dùng yêu cầu rõ ràng**. Sửa code/data/requirement, audit hay sửa lỗi thông thường không tự rebuild hay chỉnh tay bundle. |
| DATA-OFF-002 | `tools/run_regression_suite.js` mặc định **bỏ qua** `verify_offline_bundle` (in dòng `SKIP verify_offline_bundle …`); chỉ chạy khi truyền `--with-offline-bundle`, dùng sau khi đã rebuild bundle. |
| DATA-OFF-003 | Công cụ sửa hàng loạt nguồn (ví dụ `tools/repair_mojibake.js`) loại trừ `index.offline.html`. |
| DATA-OFF-004 | Khi người dùng yêu cầu phát hành offline: chạy `tools/build_offline_bundle.ps1` rồi `node tools/run_regression_suite.js --with-offline-bundle`; bundle chỉ hợp lệ khi gate pass. |
| DATA-OFF-005 | `verify_offline_parity.js` là gate tiến trình offline (catch-up thế giới), không phải gate bundle; luôn chạy trong suite. |

## Acceptance

- `node tools/run_regression_suite.js` không có flag: in dòng SKIP và không đọc `index.offline.html`.
- Với `--with-offline-bundle` sau khi rebuild: `verify_offline_bundle` pass.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| DATA-OFF-002 | tools/run_regression_suite.js: `withOfflineBundle`, filter `verify_offline_bundle` | Khớp |
| DATA-OFF-003 | tools/repair_mojibake.js (loại trừ bundle) | Khớp |
