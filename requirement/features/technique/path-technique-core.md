# Path — Công Pháp nền (tạm giữ, thuộc `technique/`)

> Các rule `TEC-CD-*` tách từ canonical Con Đường và hợp đồng Công Pháp cũ (nằm trong canonical Nghề). Chúng thuộc phạm vi [../technique/README.md](../technique/README.md) và sẽ được chuyển sang đó; ID giữ nguyên khi chuyển.

## Mục đích

Phân loại, cấp/phẩm, thục luyện, Ngũ Hành, family theo trận doanh, công thức hiệu ứng, dung hợp/tiến hóa, nguồn học, schema và thứ tự resolve của Công Pháp.

## Dữ liệu & trạng thái

```ts
type TechniqueDefinition = {
  id; name; isCore: boolean;
  category: "tam_phap"|"chieu_thuc"|"than_phap"|"tran_phap"|"phu_tro"|"cam_thuat"|"dan_phu_phap";
  family: "thien_dao_thuat"|"cam_thuat"|"nguyen_thuat"|"thuong";
  requiredFaction: "loyal_heaven"|"rebel_heaven"|"neutral"|null;
  grade: "pham"|"hoang"|"huyen"|"dia"|"thien"|"tien"|"cam_thuat"; quality: "ha"|"trung"|"thuong"|null;
  element: "kim"|"moc"|"thuy"|"hoa"|"tho"|"vo_he"|"di_he"; minRealmLevel: number; spiritualRootRequirements: string[];
  visibleStats: { powerCoefficient, manaCost, staminaCost, corruptionCost, sanCost, lifespanCost, cooldownSeconds, castTimeSeconds, baseEffect };
  hiddenAttributes: { revealCondition, attribute, isBeneficial }[];   // "comprehension >= 50 | mastery_stage >= 3 | random_on_use:0.15"
  corruptionProfile: { baseCorruptionGainPerUse } | null;
  mastery: { stage: 0..4, exp, usageCount };                          // mẫu khởi tạo
  evolutionPaths: { condition, evolvesInto, pathType: "chinh_dao"|"ta_dao" }[];
};
type TechniqueProgress = { masteryStage: 0..4; masteryExp; usageCount; sourceGuildId? };   // player.techniques[id]
```
Catalog: `data/cong_phap.js`. Không dùng `minRealm`, `cooldownTurns`, `damageMultiplier`, grade `di/thanh`, element `Quang/Huyết/Nguyên` trong dữ liệu mới; save cũ đi qua adapter khi deserialize.

## Rules

### TEC-CD-001 Phân loại chức năng
Tâm Pháp (bị động, nền, luôn bật, không là action, không chi phí thi triển mặc định); Chiêu Thức (sát thương/hiệu ứng chủ động); Thân Pháp (cơ động/né/thoát); Trận Pháp (khu vực, hỗ trợ nghi lễ); Phụ Trợ (hồi phục, buff, bảo vệ SAN); Cấm Thuật/Tà Pháp (vượt ngưỡng bằng SAN/Corruption/Stamina/Thọ Nguyên); Đan/Phù Pháp (chế tạo ngoài chiến đấu). Category = chức năng, family = quan hệ chiến đấu; mỗi Công Pháp có cả hai.

### TEC-CD-002 Cấp và phẩm
| Cấp | Hạ / Trung / Thượng | Cảnh giới tối thiểu |
|---|---|---:|
| Phàm | 0,6 / 0,7 / 0,8 | 1 |
| Hoàng | 1,0 / 1,1 / 1,2 | 2 |
| Huyền | (theo catalog) | 3 |
| Địa | 2,5 / 3,0 / 3,5 | 4 |
| Thiên | 4,5 / 5,5 / 6,5 | 5 |
| Tiên | 8,0 / 10,0 / 12,0 | 6+ |

Cấm Thuật không phân phẩm, hệ số 3,0–20,0, học được ở mọi cấp nếu nguồn cho phép; dùng dưới cấp khuyến nghị làm chi phí tăng mạnh. `minRealmLevel` so với cấp 1–14.

### TEC-CD-003 Thục luyện
| Mức | Ngưỡng EXP | Hệ số | Mở khóa |
|---|---:|---:|---|
| Nhập Môn | 0 | 0,60 | Hiệu ứng cơ bản |
| Tiểu Thành | 100 | 0,80 | Bắt đầu lộ thuộc tính ẩn ngẫu nhiên |
| Đại Thành | 300 | 1,00 | Lộ thuộc tính yêu cầu mastery |
| Viên Mãn | 700 | 1,15 | Mana cost −15%, cooldown −10% |
| Đại Viên Mãn | 1500 | 1,30 | Xét tiến hóa |

EXP mỗi lần dùng thành công trong encounter thật: `round(base_gain × (1 + Ngộ Tính / 100))`, tối thiểu 1. Nguồn theo hoạt động: `cultivation` — mọi Công Pháp đã học nhận, base Tâm Pháp 12, Thân/Phụ Trợ/Trận/Tạp 8, Chiêu Thức/Cấm Thuật 3; `combat` — chỉ Chiêu Thức/Cấm Thuật thực sự thi triển, base 4 (đánh thường không phát sinh). Catalog chỉ lưu mastery mẫu; học thì sao chép sang tiến độ riêng, không sửa ngược catalog.

### TEC-CD-004 Ngũ Hành
Tương Sinh: Kim → Thủy → Mộc → Hỏa → Thổ → Kim. Tương Khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim.
- Tâm Pháp A sinh Chiêu Thức B: +`10 + 2 × min(grade_index)`% hiệu ứng.
- Tâm Pháp và Chiêu Thức của cùng người khắc nhau: −`8 + 3 × min(grade_index)`% và +3 Điên Loạn mỗi lần dùng.
- Chiêu Thức A khắc hệ phòng thủ B của địch: +`15 + 3 × min(grade_index)`% sát thương.
- Vô Hệ trung tính; Dị Hệ khắc cả năm hệ khi tấn công nhưng xung đột mọi Tâm Pháp chính đạo, phạt nội bộ nhân đôi.

### TEC-CD-005 Bốn family theo trận doanh
| Family | Truy cập | Quan hệ |
|---|---|---|
| `thien_dao_thuat` | Trung Thành Thiên Đạo | Khắc Cấm Thuật; cộng nhiều stat, giá thấp |
| `cam_thuat` | Phản Bội/Tà Thần | Khắc Phép thường; mạnh, giá sinh mệnh/Corruption lớn |
| `nguyen_thuat` | Trung Gian | Khắc chế cân bằng hai bên |
| `thuong` | Mọi phe | Cộng hưởng nhẹ cho Nguyên Thuật và Thiên Đạo Thuật |

Family matchup dùng family phòng thủ của mục tiêu; cộng hưởng sở hữu là hệ số riêng.

### TEC-CD-006 Công thức hiệu ứng
`Final_Effect = Base_Stat × Grade_Coefficient × Mastery_Multiplier × Element_Resonance × (1 + Ngộ Tính / 200) × Fate_Element_Modifier × Family_Matchup × (1 − Corruption_Penalty)`. Cấm Thuật: `Forbidden_Power = Base_Power × (1 + corruption / 50) × Sacrifice_Multiplier`; vẫn chịu hậu quả Corruption và chi phí khai báo, không miễn phản phệ.

### TEC-CD-007 Thứ tự resolve
validate sở hữu/phe/cảnh giới/Linh Căn → validate toàn bộ chi phí → commit chi phí nguyên tử → hệ số cấp/phẩm → thục luyện → Ngũ Hành nội/ngoại → Ngộ Tính → Mệnh cùng hệ → family matchup → Corruption penalty → buff/debuff tình huống → effect handler theo category → mastery trong encounter thật → clamp + ghi event.

### TEC-CD-008 Effect handler
`tam_phap` → derived stats; `chieu_thuc` → damage/status; `than_phap` → movement/evasion; `tran_phap` → persistent area; `phu_tro` → buff/heal/SAN support; `cam_thuat` → xác nhận + resource-burn; `dan_phu_phap` → crafting ngoài combat. Category không có handler trả `UNSUPPORTED_TECHNIQUE_CATEGORY`, không mặc định thành damage.

### TEC-CD-009 Đơn vị thời gian
Schema dùng giây; runtime theo lượt quy đổi cố định `1 turn = 5 seconds`: cooldown = `ceil(cooldownSeconds / 5)`; `castTimeSeconds` 0–5 resolve trong lượt, > 5 tạo trạng thái niệm kéo dài tương ứng số lượt; cửa sổ combo mặc định 3–5 giây.

### TEC-CD-010 Combo, dung hợp, tiến hóa
Combo: chuỗi 2–3 chiêu đúng thứ tự trong cửa sổ cấu hình. Dung hợp 2–3 Công Pháp cùng cấp và cùng hệ/tương sinh → Công Pháp cấp kế tiếp; tỷ lệ cùng hệ 80–95%, tương sinh 60–75%, tương khắc/Dị Hệ 20–35%; thất bại không xóa nguyên liệu, trường hợp tương khắc/Dị Hệ +5 Corruption; thành công tạo kết quả trước rồi xóa nguyên liệu trong cùng transaction. Ở Đại Viên Mãn có thể tiến hóa sang nhánh thuần hóa/tà hóa nếu dữ liệu khai báo; lựa chọn vĩnh viễn, ghi event history.

### TEC-CD-011 Nguồn học
Tông Môn truyền thụ (Phàm–Địa; Ngoại Môn nhận "Tông Môn Nội Tức", Nội Môn trở lên thêm một Công Pháp theo đặc tính thế lực, lưu `sourceGuildId`); mua chợ/thương nhân (Phàm–Huyền, Linh Thạch); loot quái/Boss (Địa–Thiên); Ngộ Đạo theo Ngộ Tính (mọi cấp, Tiên cực hiếm); Tà Thần truyền dạy (luôn `cam_thuat`, có `corruptionProfile`); dung hợp (+1 cấp); thương nhân bí ẩn (Thiên–Tiên, trả bằng Thọ Nguyên/SAN).

### TEC-CD-012 Invariant
Không Công Pháp nào tự tăng cảnh giới; Cấm Thuật không bỏ qua cổng Gọi Mệnh/Đối Chiếu; Tâm Pháp không bị trừ Stamina chỉ vì thiếu field chi phí; Corruption luôn 0–100 sau mỗi lần dùng; kỹ thuật tiêu hao SAN, Thọ Nguyên, Mệnh hoặc Corruption phải có bước xác nhận UI. Học được không có nghĩa là đủ điều kiện thi triển an toàn.

## UI

Hiển thị tầng, EXP hiện tại, mốc kế tiếp, cách tăng cấp; nhóm màu riêng: Tâm Pháp, Chiến Đấu, Thân Pháp, Phụ Trợ, Trận Pháp, Cấm Thuật, Dị Pháp.

## Acceptance

- Công Pháp cấp cao không mở cảnh giới khi thiếu Mệnh.
- Category lạ trả `UNSUPPORTED_TECHNIQUE_CATEGORY`.
- Gate: `node tools/verify_technique_channel_matrix.js`, `node tools/verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| TEC-CD-003 | `data/cong_phap.js` (ngưỡng 0/100/300/700/1500, hệ số 0,6–1,3), `js/engine.js:techniqueProgress` | Khớp |
| TEC-CD-008 | — (không có `UNSUPPORTED_TECHNIQUE_CATEGORY`) | Thiếu |
| TEC-CD-009 | `js/engine.js` (`cooldownSeconds` quy đổi lượt) | Khớp |
| TEC-CD-011 | `js/engine.js` (`tong_mon_noi_tuc`, `sourceGuildId`) | Khớp |
