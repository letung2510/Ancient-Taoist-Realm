# HỆ THỐNG QUAN HỆ MỆNH SỐ (FATE RELATIONSHIP SYSTEM)
> Tài liệu mô tả `fate_relationship_generator.js` — sinh 3 loại quan hệ giữa 1300 Mệnh Số trong `fate-pool.json`: **Tương Sinh/Tương Khắc**, **Cộng Hưởng (Combo)**, **Dung Hợp (Fusion)**.

---

## 0. Tổng quan kết quả đã sinh

| Loại quan hệ | Số lượng |
|---|---|
| Tương Sinh (cặp) | 1,924 |
| Tương Khắc (cặp) | 14 |
| Combo Set (Cộng Hưởng, 2-4 mệnh) | 150 |
| Công thức Dung Hợp (Fusion) | 78 |

File output: **`fate-relationships.json`** — chạy `node fate_relationship_generator.js` để tái sinh (mỗi lần chạy random lại toàn bộ do dùng `Math.random()`).

---

## 1. TƯƠNG SINH / TƯƠNG KHẮC (Pairwise Relationship)

Quan hệ **giữa 2 mệnh cụ thể** — kiểm tra khi nhân vật sở hữu đồng thời cả 2 trong Mệnh Kho.

### 1.1 Quy tắc sinh
- **Tương Sinh:** 2 mệnh **cùng phe** (Cát-Cát hoặc Hung-Hung) và **tier lệch ≤ 1** → được xem là "cùng khí chất", cộng hưởng nhẹ.
  - Công thức bonus: `+ (3 + 2 × min(tier1, tier2))%` hiệu quả của cả 2 mệnh khi sở hữu chung.
  - Mỗi mệnh được gán ngẫu nhiên 1-2 quan hệ Tương Sinh.
- **Tương Khắc:** 1 mệnh Cát Cách + 1 mệnh Hung Cách có **chung "gốc sao"** (2 từ đầu tên trùng nhau, ví dụ cùng bắt nguồn từ "Tử Vi", "Thiên Phủ"...) → xung khắc vì cùng 1 sao nhưng số phận đối nghịch.
  - Công thức phạt: `- (5 + 3 × min(tier1, tier2))%` hiệu quả cả 2 mệnh, kèm `+5 Điểm Điên Loạn` (SAN giảm) khi sở hữu chung.
  - Số lượng ít (14 cặp) vì điều kiện "chung gốc sao" khá hiếm — đúng tinh thần "khắc thật sự phải có lý do", không phải random vô cớ.

### 1.2 Ví dụ thực tế (từ data đã sinh)

**Tương Sinh:**
```
Ân Quang Văn Xương Đồng Cung ⟷ Thái Âm Chiếu Mệnh
→ Sở hữu đồng thời: +5% hiệu quả toàn bộ hiệu ứng của cả 2 mệnh
```

**Tương Khắc:**
```
Tử Vi Củng Văn Khúc ✕ Tử Vi Hãm Địa
→ Sở hữu đồng thời: -8% hiệu quả cả 2 mệnh, +5 Điểm Điên Loạn do khí vận xung đột

Thiên Phủ Nhập Miếu ✕ Thiên Phủ Vong Thân
→ Sở hữu đồng thời: -11% hiệu quả cả 2 mệnh, +5 Điểm Điên Loạn do khí vận xung đột
```
→ Nhận thấy pattern: cùng 1 Chính Tinh (Tử Vi, Thiên Phủ...) nhưng 1 bên "Nhập Miếu/Củng" (tốt) và 1 bên "Hãm Địa/Vong Thân" (xấu) — đúng logic tử vi thật, 1 sao không thể vừa vượng vừa hãm cùng lúc trên 1 người.

---

## 2. CỘNG HƯỞNG / COMBO (Set Bonus)

Bộ **2-4 mệnh cụ thể**, khi sở hữu **đủ tất cả thành viên trong bộ**, kích hoạt hiệu ứng cộng hưởng mạnh hơn tổng các hiệu ứng lẻ.

### 2.1 Quy tắc sinh
- 70% combo chọn từ **cùng 1 tier** (dễ đạt hơn, dùng để định hướng người chơi sưu tầm theo tier).
- 30% combo **xuyên tier** (khó đạt hơn, thường thưởng cao hơn).
- Tên combo random ghép từ các cụm phong thủy/tiên hiệp kinh điển: *Tam Tài, Thiên Địa Nhân, Tam Quang, Ngũ Hành Tương Hợp, Song Hùng, Tứ Tượng, Cửu Cung, Thất Diệu, Lục Hợp, Bát Quái*.
- **2 nhánh hiệu ứng:**
  - **Cộng Hưởng Thuận** (toàn Cát hoặc toàn Hung): `+ (tổng |score| các thành viên × 1.2)%` hiệu ứng liên quan, `+ Khí Vận (avg_tier × 5)`.
  - **Nghịch Mệnh Cộng Hưởng** (pha trộn Cát + Hung trong cùng combo): `+ (tổng |score| × 1.5)%` Final Stats — mạnh hơn hẳn, nhưng đánh đổi `+ avg_tier Điểm Điên Loạn` khi kích hoạt (rủi ro/phần thưởng cao, đúng chất Cthulhu-xianxia).

### 2.2 Ví dụ thực tế

```
Combo: "Thất Diệu Tam Cách" (Nghịch Mệnh)
Thành viên: Vũ Khúc Xung Địa Kiếp (Hung, tier 4) + Thiên Đồng Triều Viên (Cát, tier 1)
            + Thiên Cơ Nhập Miếu (Cát, tier 3)
Hiệu ứng: Nghịch Mệnh Cộng Hưởng — +20% Final Stats, nhưng +3 Điểm Điên Loạn khi kích hoạt
```
```
Combo: "Tam Quang Tứ Cách" (Cộng Hưởng Thuận, toàn Cát)
Thành viên: Thiên Phủ Tọa Mệnh (t3) + Thiên Việt Phùng Bát Tọa (t1)
            + Nguyệt Đức Tam Thai Đồng Cung (t1) + Thiên Phủ Củng Lộc Tồn (t4)
Hiệu ứng: +19% hiệu ứng liên quan, Khí Vận +11
```

---

## 3. TIẾN HÓA / DUNG HỢP (Fusion Recipes)

Công thức: **3-4 mệnh cùng tier N** → đốt (tiêu hao) → ra **1 mệnh tier N+1** ngẫu nhiên. Áp dụng cho tier 1→7 (Cầu Vồng/tier 8 là max, không dung hợp lên tiếp được).

### 3.1 Quy tắc sinh
- Số công thức mỗi tier tỉ lệ nghịch độ hiếm: `max(3, round(30 / tier))` — tier 1 có nhiều công thức nhất (~30), tier 7 chỉ có vài công thức.
- **Dung hợp thuận** (80% số công thức): 3-4 nguyên liệu **cùng phe** (toàn Cát hoặc toàn Hung) → tỷ lệ thành công **70-95%**, thất bại chỉ mất nguyên liệu.
- **Dung hợp lai** (20% số công thức): nguyên liệu pha Cát+Hung → tỷ lệ thành công thấp hơn **30-55%**, thất bại còn bị `SAN -5` (phản phệ do 2 luồng khí vận xung đột trong lò dung hợp) — đổi lại xác suất ra mệnh hiếm/mạnh vẫn giữ nguyên nếu thành công.
- Khớp với cơ chế **ACID Transaction** đã thiết kế trong spec gốc (`BEGIN...DELETE nguyên liệu...INSERT kết quả...COMMIT`, auto-rollback nếu fail giữa chừng).

### 3.2 Ví dụ thực tế

```
Recipe #2 (Tier 1 → Tier 2, Dung hợp thuận)
Nguyên liệu: Ân Quang Hóa Khoa Đồng Cung + Ân Quang Văn Xương Đồng Cung
             + Hóa Quyền Triều Viên + Hóa Quyền Hóa Cát   (toàn Cát Cách)
Kết quả: Ân Quang Củng Hóa Quyền (Cát Cách, Tier 2)
Tỷ lệ thành công: 94%
Thất bại: Mất nguyên liệu, không mất gì thêm
```

```
Recipe #1 (Tier 1 → Tier 2, Dung hợp thuận, phe Hung)
Nguyên liệu: Linh Tinh Vong Thân + Thiên Đồng Xung Thiên Sứ + Thiên Sứ Xung Thiên Hình
Kết quả: Vũ Khúc Xung Bạch Hổ (Hung Cách, Tier 2)
Tỷ lệ thành công: 75%
```

---

## 4. CẤU TRÚC FILE OUTPUT (`fate-relationships.json`)

```json
{
  "generated_at": "...",
  "summary": { "total_fates": 1300, "pairwise_relationships": 1938, "tuong_sinh": 1924, "tuong_khac": 14, "combo_sets": 150, "fusion_recipes": 78 },
  "pairwise_relationships": [
    { "from": <fate_id>, "to": <fate_id>, "type": "TUONG_SINH | TUONG_KHAC", "label": "...", "effect": "..." }
  ],
  "combo_sets": [
    { "combo_id": 1, "name": "...", "members": [{ "id", "name", "tier", "type" }], "required_count": 3, "avg_tier": 2.3, "effect": "..." }
  ],
  "fusion_recipes": [
    { "recipe_id": 1, "tier_from": 1, "tier_to": 2, "materials": [...], "result": {...}, "success_rate_pct": 94, "fail_consequence": "...", "note": "..." }
  ]
}
```

## 5. GỢI Ý TÍCH HỢP VÀO CHARACTER GENERATOR

Khi tính `Final_Stats` của nhân vật (đã có ở `character_generator.js`), có thể mở rộng thêm bước:
1. Sau khi roll xong `owned_fates`, quét qua `pairwise_relationships` để tìm cặp Tương Sinh/Tương Khắc đang sở hữu đồng thời → cộng/trừ % vào `fateMultiplier`.
2. Quét `combo_sets` xem nhân vật có đủ toàn bộ `members` của combo nào không → nếu có, áp thêm hiệu ứng combo (và trừ SAN nếu là Nghịch Mệnh Cộng Hưởng).
3. `fusion_recipes` dùng ở tính năng riêng (bàn Dung Hợp trong UI game) — không tính vào lúc tạo nhân vật, mà là hành động chủ động sau này của người chơi.

*(Chưa code phần tích hợp này vào `character_generator.js` — báo nếu mày muốn nối luôn vào luồng generateCharacter().)*

---

## 6. BẢNG SQL GỢI Ý (khi migrate Postgres)

```sql
CREATE TABLE fate_pairwise_relations (
  id SERIAL PRIMARY KEY,
  from_fate_id INT REFERENCES fate_pool(id),
  to_fate_id INT REFERENCES fate_pool(id),
  relation_type TEXT NOT NULL, -- 'TUONG_SINH' | 'TUONG_KHAC'
  effect_desc TEXT NOT NULL
);

CREATE TABLE fate_combo_sets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  required_count SMALLINT NOT NULL,
  effect_desc TEXT NOT NULL
);
CREATE TABLE fate_combo_members (
  combo_id INT REFERENCES fate_combo_sets(id),
  fate_id INT REFERENCES fate_pool(id),
  PRIMARY KEY (combo_id, fate_id)
);

CREATE TABLE fate_fusion_recipes (
  id SERIAL PRIMARY KEY,
  tier_from SMALLINT, tier_to SMALLINT,
  result_fate_id INT REFERENCES fate_pool(id),
  success_rate_pct SMALLINT,
  fail_consequence TEXT
);
CREATE TABLE fate_fusion_materials (
  recipe_id INT REFERENCES fate_fusion_recipes(id),
  fate_id INT REFERENCES fate_pool(id)
);
```
