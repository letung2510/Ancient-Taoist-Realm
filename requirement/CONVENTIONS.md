# Quy ước tài liệu requirement

Tài liệu được chia **theo feature → theo chức năng** (mẫu tham khảo: `liyw0205/nonebot_plugin_xiuxian_3/docs`, mỗi domain một thư mục với README làm chỉ mục và file chi tiết theo chức năng). Mục tiêu: muốn check một chức năng chỉ cần mở 1 thư mục, 1–2 file.

## Cấu trúc

```text
requirement/
  README.md            Quy tắc quản trị + bảng "cần gì đọc ở đâu"
  CONVENTIONS.md       File này
  STATUS.md            Trạng thái hiện hành DUY NHẤT: gap runtime, quyết định mới, gate
  INDEX.md             Sinh tự động: file → mục (khoảng dòng), số rule ID mỗi file
  overview/            Bản đồ liên feature, symbol index runtime, nguyên tắc chung
  features/<feature>/  README.md + các file chức năng
  audit/               Lịch sử audit/review (chỉ đọc, không phải nguồn logic)
  prompts/             Prompt AI tái sử dụng (không phải requirement)
```

### Danh sách feature

| Thư mục `features/` | Phạm vi | Prefix rule |
|---|---|---|
| `character/` | Tạo nhân vật, thuộc tính, origin intent | `CHR-` |
| `fate/` | Mệnh Số: pool, grade, slot, cộng hưởng, nâng cấp, quan hệ | `FATE-` |
| `realm-progression/` | 14 cảnh giới phẳng, EXP, đột phá, tu luyện | `PRG-` |
| `path/` | Con Đường, Ngoại Đạo Giả, danh xưng, Tà Thần | `PATH-` |
| `di-the/` | Dị Thể | `DT-` |
| `profession/` | Nghề nghiệp, nghề ẩn, chế tạo | `PROF-` |
| `map/` | Bản đồ thế giới, Lân Cận, di chuyển, origin node, fast travel | `MAP-` |
| `weather/` | Thời tiết | `WTH-` |
| `world-simulation/` | Mô phỏng thế giới, thế lực, chiến tranh, offline | `WSIM-` |
| `npc/` | NPC, lịch sinh hoạt, hội thoại, tương tác | `NPC-` |
| `relationship/` | Quan hệ, danh tiếng, sự kiện quan hệ | `REL-` |
| `companion/` | Đồng hành | `CMP-` |
| `technique/` | Công Pháp, kỹ năng, cộng hưởng Mệnh, Prepare/Channel/Commit | `TEC-` |
| `discovery/` | Khám phá | `DSC-` |
| `reward/` | Phần thưởng, loot | `RWD-` |
| `ui-action-log/` | Giao diện, action surface, game log | `UI-` |
| `data-runtime/` | Save/load, schema, migration, hiệu năng, bundle | `DATA-` |
| `cross-system/` | Hợp đồng liên feature (tông môn × công pháp × mệnh …) | `CSX-` |

## Mẫu thư mục feature

`features/<feature>/README.md` (ngắn, ≤ 8KB):

```markdown
# <Tên feature>
## Phạm vi            3–6 dòng: feature làm gì, không làm gì
## Chức năng          | Chức năng | File | Prefix rule | Runtime chính (file:symbol) |
## Phụ thuộc          link tới feature khác
## Quyết định đã chốt | Ngày | Quyết định | Rule bị ảnh hưởng |
## Gate               lệnh tools/verify_* liên quan
```

`features/<feature>/<chuc-nang>.md` (kebab-case, mục tiêu ≤ 40KB; lớn hơn thì tách tiếp):

```markdown
# <Feature> — <Chức năng>
## Mục đích
## Dữ liệu & trạng thái     state/schema/catalog liên quan
## Rules                    mỗi rule: `### <ID> <tiêu đề>` hoặc dòng bảng có ID ở cột đầu
## Luồng                    (tùy chọn) state machine / thứ tự xử lý
## UI                       (tùy chọn) hiển thị cho người chơi
## Acceptance               tiêu chí kiểm thử + gate
## Runtime mapping          | Rule | file:symbol | Khớp/Lệch/Thiếu |
```

## Quy tắc nội dung

- Mỗi requirement xuất hiện **đúng một lần**. Chỗ khác chỉ link tới.
- Chỉ ghi rule đang hiệu lực. Rule bị thay thế bị xóa; quyết định thay thế ghi vào bảng "Quyết định đã chốt" của README feature.
- Không ghi trạng thái/tiến độ/evidence trong file feature (trừ cột trạng thái của Runtime mapping). Trạng thái hiện hành ghi ở `STATUS.md`; lịch sử ở `audit/`.
- Rule ID ổn định: `<PREFIX><NHÓM>-<số 3 chữ số>` (ví dụ `MAP-LC-012`, `FATE-RES-004`). Giữ nguyên ID cũ đã có (`TEC-001`, `MAP-LC-001`, `UI-LM-010`, `CSX-TG-01`…). Không đánh lại số ID đã tồn tại.
- Bảng hơn văn xuôi; mỗi rule 1 dòng hoặc 1 khối ngắn, có số liệu/điều kiện cụ thể.
- Tiếng Việt có dấu, UTF-8 không BOM, link tương đối.
- Sau khi sửa: `node tools/build_requirement_index.js` rồi `node validate_requirement_docs.js` (trong `requirement/`).
