# Mệnh Số — Tương hợp Con Đường

## Mục đích

Tính độ hợp giữa Mệnh và Con Đường (`match_score` 0–10), độc lập với điểm Mệnh, và quy định vai trò của nó. Luật Con Đường thuộc [../path/README.md](../path/README.md); cộng hưởng Mệnh × Công Pháp (element/tag) phía tiêu thụ thuộc [../technique/README.md](../technique/README.md).

## Dữ liệu & trạng thái

- `PATH_FATE_RELATIONS.paths[pathId] = { lead[], support[], forbidden[], unbound? }` — 10 Con Đường ràng buộc + `ngoai_dao_gia` unbound.
- Tag Mệnh: tên, `type`, `element`, effects, `tags` (chuẩn hóa không dấu).
- `player.pathId`, `player.daoTam`.

## Rules

### FATE-RES-001 Match của một Mệnh
`fateCompatibility(pathId, fate)`:
1. Path không tồn tại hoặc unbound → 0.
2. `path_affinity.lead` chứa path → 10; `support` chứa path → 6; `forbidden` chứa path → 0.
3. Ngược lại: `clamp(3 × lead + 1 × support − 2 × forbidden, 0, 10)` theo số tag khớp.

### FATE-RES-002 Match của bộ Mệnh active
`pathMatchSummary(character, pathId)` tính điểm bộ Mệnh active theo thuật toán duy nhất ở [PATH-SEL-003](../path/path-selection.md#path-sel-003-match_score) (không trần, có `rawScore`, `daoBonus`, `allHung`). Ngoại Đạo Giả/unbound → `score 0`, `namespace: "unbound"`. Mệnh Kho không tham gia.

### FATE-RES-003 Nhãn
| Điểm | Nhãn |
|---:|---|
| 0 | Tuyệt Không (off-build, vẫn được trang bị) |
| 1–2 | Xa Lạ |
| 3–4 | Tương Hợp |
| 5–7 | Tương Hợp Cao |
| 8–9 | Tương Sinh |
| 10 | Đại Đạo Tương Sinh |

UI hiển thị `x/10 + nhãn`; giá trị luôn clamp 0–10.

### FATE-RES-004 Vai trò của match
Match là cổng và thông tin, không nhân trực tiếp vào chỉ số:
| Dùng ở | Ngưỡng |
|---|---|
| Cộng Minh (bậc 2→3) | `fateCompatibility ≥ 8` |
| Con Đường khả dụng | Cảnh giới ≥2, `lead ≥ 1`, `score ≥ 3`, không `allHung` (chi tiết ở `../path/`) |
| Hiến tế Mệnh | Ứng viên `≥ 3` |
| Nhánh Tiến Hóa | `branch.requiresCompatibility` |
| Preview hoán đổi | Hiển thị trước/sau |

### FATE-RES-005 Off-build hợp lệ
Match 0 không chặn trang bị. Forbidden chỉ đến từ tag forbidden đã định nghĩa (FATE-CAT-009).

## Acceptance

- Mệnh có `lead` khớp path trả 10; Mệnh trừu tượng không khớp tag nào trả 0 và vẫn trang bị được.
- Ngoại Đạo Giả luôn match 0.
- UI hiển thị đúng nhãn theo bảng FATE-RES-003.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-RES-001 | `js/engine.js:fateCompatibility` | Khớp |
| FATE-RES-002 | `js/engine.js:pathMatchSummary` | Khớp |
| FATE-RES-003 | `js/ui.js` (fate panel) | Thiếu — chưa có hàm/nhãn Tuyệt Không…Đại Đạo Tương Sinh |
| FATE-RES-004 | `js/engine.js:resonateFate`, `availablePaths`, `sacrificeFate`; `js/expansion.js:fateEvolutionCandidates` | Khớp |
