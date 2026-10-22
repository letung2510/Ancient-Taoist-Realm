# Nhân Vật — Thuộc tính và chỉ số suy ra

## Mục đích

Thuộc tính gốc roll khi tạo nhân vật và các chỉ số suy ra một lần từ chúng (profile Linh Căn, cách cục, hệ số EXP, archetype). Chỉ số chiến đấu/tu luyện tổng hợp thuộc pipeline `computeStats` của các feature tiêu thụ.

## Dữ liệu & trạng thái

| Field | Miền | Nguồn |
|---|---|---|
| `basePhy`, `baseMag` | 10–20 | roll đều |
| `baseFortune` | 0–10 | roll đều |
| `aptitude` (Căn Cốt) | 1–100 | Gaussian |
| `comprehension` (Ngộ Tính) | 1–100 | Gaussian |
| `spiritualRoots[]` | nguyên tố thuần | `COMMON_ROOTS` Kim/Mộc/Thủy/Hỏa/Thổ; `EXOTIC_ROOTS` Băng/Lôi/Phong/Âm/Dương/Không Gian |
| `spiritualRootBranch` | `tap`/`song_tam`/`don`/`hiem`/`di` | nhánh đã roll |
| `daoTam` | 0–100, mặc định 50 | |
| `san` | 100 khi tạo | |
| `stamina` | 0–100, mặc định 100 | |

## Rules

### CHR-ATT-001 Căn Cốt và Ngộ Tính
Hai lần roll độc lập Gaussian `μ = 50`, `σ = 15` (Box–Muller), làm tròn, clamp 1–100.

### CHR-ATT-002 Nhánh Linh Căn
| Roll (%) | Nhánh | Nguyên tố |
|---|---|---|
| 0–50 | `tap` | 4–5 hệ thường khác nhau |
| 50–85 | `song_tam` | 2–3 hệ thường khác nhau |
| 85–95 | `don` | 1 hệ thường |
| 95–99 | `hiem` | 1 bộ 2–3 hệ thường mà mọi cặp đều tương sinh |
| 99–100 | `di` | 1 hệ dị |

### CHR-ATT-003 Lưu Linh Căn
`origin.spiritualRoots` là danh sách nguyên tố thuần, không kèm nhãn. `origin.spiritualRootBranch` giữ đúng nhánh đã roll để profile không suy diễn sai (nhân vật 1 nguyên tố hoặc có dị hệ). Chỉ khi thiếu branch mới suy ra: 0 hệ → `unknown`; 1 hệ → `di`/`don`; có dị hệ → `hiem`; 4–5 hệ → `tap`; còn lại `song_tam`.

### CHR-ATT-004 Profile Linh Căn
`spiritualRootProfile(character)` suy ra một lần, không lặp nhãn trên từng nguyên tố:
| Nhãn | purity | exp |
|---|---:|---:|
| Dị Linh Căn | 130 | 2,0 |
| Đơn Linh Căn | 100 | 1,5 |
| Song Linh Căn Hiếm | 85 | 1,35 |
| Song Linh Căn | 70 | 1,2 |
| Tam Linh Căn Hiếm | 60 | 1,1 |
| Tam Linh Căn | 50 | 1,0 |
| Tứ Linh Căn (Phế) | 30 | 0,8 |
| Ngũ Hành Câu Toàn (Phế Linh Căn) | 10 | 0,5 |

- `harmonyScore` = tổng điểm tương sinh/khắc của mọi cặp nguyên tố.
- Khi `harmonyScore < 0`: `damping = clamp(1 − (aptitude − 50)/100, 0,3, 1,8)`, `effectiveHarmony = harmonyScore × damping`; ngược lại `effectiveHarmony = harmonyScore`.
- `purityScoreFinal = clamp(purity × (1 + 0,05 × effectiveHarmony), 10, 200)`.
- `expMultiplierLinhCanFinal = clamp(exp × (1 + 0,03 × effectiveHarmony), 0,3, 3,0)`.
- `expMultiplierTotal = expMultiplierLinhCanFinal × aptitude / 50`.
- Cách cục (`cachCucName`, `cachCucAlignment` cat/trung/hung) suy từ số nguyên tố và quan hệ sinh/khắc nội tại (1 hệ: "Thuần X Chi Thể" hoặc "Dị Linh Căn — X"; 2 hệ: tên cặp; 3 hệ: theo số cặp sinh/khắc).

### CHR-ATT-005 Archetype và công pháp dẫn khí
| Linh Căn chứa | Archetype | Công pháp nhập môn |
|---|---|---|
| Lôi / Phong / Kim | `kiem_tong` | Dẫn Khí Kiếm Quyết |
| Mộc / Thủy / Băng | `van_duoc` | Thanh Mộc Dưỡng Khí Kinh |
| Âm / Dương / Không Gian | `am_duong` | Âm Dương Thổ Nạp Thuật |
| còn lại | `huyen_co` | Huyền Cơ Nạp Khí Pháp |

Xét theo thứ tự bảng; dòng đầu khớp được chọn.

### CHR-ATT-006 Thọ nguyên
Thọ nguyên tối đa = `lifespanBase + lifespanBonus` của cảnh giới, nhân hệ số `lifespanBonus` từ Mệnh active không bị Trấn ([../fate/effects-and-stats.md](../fate/effects-and-stats.md)).

## Acceptance

- Phân bố Căn Cốt/Ngộ Tính qua Monte Carlo có trung bình ≈ 50, độ lệch ≈ 15, không ngoài 1–100.
- Tỉ lệ nhánh Linh Căn khớp CHR-ATT-002 (±1 điểm %).
- Nhân vật 1 nguyên tố thường có branch `don`, 1 nguyên tố dị có branch `di` sau round-trip.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CHR-ATT-001 | `js/engine.js:gaussianAttribute`; `character_generator.js:gaussianAttribute` | Khớp |
| CHR-ATT-002 | `js/engine.js:rollSpiritualRootBranch`, `validHarmonySets`; `character_generator.js:rollSpiritualRootBranch` | Khớp |
| CHR-ATT-003 | `js/engine.js:inferRootBranch`, `toCanonicalCharacter` | Khớp |
| CHR-ATT-004 | `js/engine.js:spiritualRootProfile`, `LINH_CAN_STATS`, `cachCucInfo`, `harmonyScoreOf` | Khớp |
| CHR-ATT-005 | `js/engine.js:archetypeForRoots`, `rollCharacterCreation` | Khớp |
| CHR-ATT-006 | `js/engine.js:computeLifespan` | Khớp |
