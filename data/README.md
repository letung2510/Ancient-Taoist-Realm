# Dữ liệu runtime (data/)

Thư mục `data/` tách thành **nguồn (`data/src/`)** và **bundle runtime (`data/*.js`)**.

## 1) Nguồn (`data/src/`)

- `data/src/fate/`
  - `fates.json`: nguồn Mệnh Số canonical.
  - `relationships.json`: nguồn quan hệ/cộng minh Mệnh Số.
- `data/src/path/`
  - `path_fate_relations.json`: nguồn JSON cho quan hệ Mệnh ↔ Con Đường.
- `data/src/world/`
  - `tu_tien_factions.json`: nguồn vùng, tuyến đường, thế lực, guild.
  - `Xianxin_guild.md`: bảng nguồn guild.
- `data/src/realm/`
  - `canh_gioi_tien_hiep.json`: nguồn cảnh giới phẳng + legacyIds migration.

## 2) Bundle runtime (`data/*.js`)

Browser chỉ nạp các file JS theo thứ tự runtime (xem `data/manifest.json`).

- **Generated (`generated: true`)**: được sinh bởi `tools/build_data.js`.
- **Hand-edited (`generated: false`)**: chỉnh tay trực tiếp.

> Quy tắc bắt buộc: **không sửa tay bất kỳ file `data/*.js` nào được đánh dấu `generated: true` trong `data/manifest.json`.**

## 3) Manifest runtime

- `data/manifest.json` là nguồn sự thật cho:
  - thứ tự script runtime,
  - metadata từng bundle (`feature`, `sourceFiles`, `generated`).
- `tools/lib/load_runtime.js` đọc manifest (fallback parse `index.html` nếu thiếu manifest).

## 4) Build dữ liệu

```bash
node tools/build_data.js
```

Lệnh trên sẽ:

1. Sinh lại các bundle `generated: true` từ nguồn trong `data/src/`.
2. Đồng bộ block script runtime trong `index.html` giữa marker:
   - `<!-- runtime-scripts:start -->`
   - `<!-- runtime-scripts:end -->`

Giữ nguyên query version `?v=...` hiện có cho từng script.

## 5) Chế độ kiểm tra CI/gate

```bash
node tools/build_data.js --check
```

- Exit code `1` nếu có file generated hoặc block runtime script của `index.html` bị lệch so với kết quả build.
- Dùng trong regression suite để chặn drift dữ liệu.

## 6) In danh sách runtime scripts

```bash
node tools/build_data.js --print-scripts
```

Dùng cho tooling khác (ví dụ offline bundle) để tránh hard-code danh sách script.
