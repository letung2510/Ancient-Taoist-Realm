# Nhân Vật — Khởi tạo

## Mục đích

Đầu vào, quy trình roll, đầu ra và invariant của character generator. Không định nghĩa lại cảnh giới, Mệnh Số hay Công Pháp.

## Dữ liệu & trạng thái

```ts
type CharacterCreationInput = {
  name?: string;
  startRegionId: string;            // bắt buộc, phải tồn tại
  race?: string;
  basePhy?: number; baseMag?: number;
  aptitude?: number; comprehension?: number;
  spiritualRoots?: string[];
  spiritualRootBranch?: "tap" | "song_tam" | "don" | "hiem" | "di" | null;
  personalityTraits?: string[]; background?: string; hiddenGoal?: string;
  journeyIntent?: string; originNodeId?: string;
  rng?: () => number;               // [0, 1)
};
```

## Rules

### CHR-CRE-001 Quy trình canonical
1. Validate vùng và cổng xuất thân ([origin-intent.md](origin-intent.md#chr-ori-001-cổng-vùng-xuất-thân)).
2. Roll chủng tộc theo trọng số vùng.
3. Roll PHY/MAG 10–20, Khí Vận gốc 0–10.
4. Roll Căn Cốt và Ngộ Tính độc lập ([attributes-and-derived.md](attributes-and-derived.md)).
5. Roll Linh Căn theo nhánh, suy ra archetype và công pháp dẫn khí nhập môn.
6. Chọn 2 tính cách khác nhau, 1 xuất thân, 1 mục tiêu ẩn, 1 tình huống khởi đầu, origin node.
7. Gán `realm.id = "di_menh"`, `level = 1`, EXP 0.
8. Roll 5 Mệnh khởi tạo (CHR-CRE-003); Mệnh Kho rỗng, capacity 10.
9. Roll Mệnh ẩn Luân Hồi Tiên độc lập (CHR-CRE-004).
10. Gán 2 Công Pháp Phàm Giai nhập môn `kiem_khi_so_cap`, `tam_phap_dan_dien`; không tính là Công Pháp lõi khi kiểm tra cấp 3.
11. Tính derived stats, validate invariant, trả object canonical ([save-shape.md](save-shape.md)).

Override phục vụ test vẫn qua validate và clamp như dữ liệu roll.

### CHR-CRE-002 Invariant
- Nhân vật mới luôn Di Mệnh Cảnh cấp 1, không có tiểu cảnh.
- `origin.personality` có đúng 2 giá trị khác nhau.
- Căn Cốt và Ngộ Tính là hai biến độc lập.
- `hiddenProfession` luôn `null` khi vừa tạo.
- Lựa chọn Con Đường và lựa chọn tổ chức là hai quyết định độc lập.

### CHR-CRE-003 Năm Mệnh khởi tạo
Đúng 5 ID khác nhau trong `fate.equippedIds`, grade ≤ Hoàng, tổng điểm ≥ 6. `vaultIds = []`, `vaultCapacity = 2 × equippedIds.length = 10`. Nguồn catalog: `data/fate_data.js`. Cả hai generator (`drawInitialFates` ở `js/engine.js`, `rollFates` ở `character_generator.js`) dùng đúng thuật toán:
1. `eligible` = Mệnh có hạng grade ≤ 3 (phan 1, linh 2, hoang 3).
2. Thử tối đa 500 lần. Mỗi lần: lặp 5 lượt; mỗi lượt chọn tier theo trọng số Phàm/Linh/Hoàng `65/30/5` rồi chọn đều trong các Mệnh còn lại của tier đó (tier hết → chọn đều trong toàn bộ Mệnh còn lại); bỏ Mệnh đã chọn khỏi tập còn lại. Lần thử đạt khi tổng `score ≥ 6` → trả ngay.
3. Hết 500 lần không đạt → **fallback tất định, không gọi RNG**: sắp `eligible` theo `score` giảm dần, hòa thì `id` tăng dần (so sánh chuỗi thứ tự), lấy 5 Mệnh đầu. Tổng điểm fallback vẫn < 6 → ném `Error("Fate Pool không thể tạo bộ Mệnh Số đạt điểm tối thiểu.")` (lỗi dữ liệu catalog, không phải lỗi người chơi). Không bao giờ ném lỗi chỉ vì hết 500 lần.
4. `eligible.length < 5` → ném `Error("Fate Pool không đủ Mệnh Số hợp lệ.")`.
Tỷ lệ đầu ra sau rejection có thể lệch nhẹ khỏi 65/30/5 và phải đo bằng test thống kê.

### CHR-CRE-004 Mệnh ẩn Luân Hồi Tiên
Tỉ lệ `PATH_FATE_RELATIONS.hidden_fates.luan_hoi_tien.roll_probability_percent` (%). Trúng chỉ gán `hiddenFates = ["luan_hoi_tien"]` và `hiddenProfessionCandidate = "luan_hoi_tien"`; không kích hoạt nghề.

### CHR-CRE-005 RNG có thể replay
`generateCharacter({ rng })` / `rollCharacterCreation(regionId, { rng })` dùng duy nhất `rng` cho mọi nhánh random: Mệnh, Mệnh ẩn, thuộc tính, Linh Căn, chủng tộc, xuất thân, tính cách, mục tiêu, tuổi thọ, suffix ID. Không truyền `rng` thì chỉ dùng boundary entropy duy nhất (`defaultRandom`/`entropyRandom`), không có `Math.random()` rời rạc. Preview/UI không gọi `rng` khi chưa commit. Cùng input + cùng chuỗi RNG → output gameplay deep-equal (trừ metadata `createdAt`).

### CHR-CRE-006 Hai generator đồng nhất
Generator Node (`character_generator.js`) và browser (`js/engine.js`) dùng cùng tỉ lệ Linh Căn (CHR-ATT-002), cùng luật 5 Mệnh (CHR-CRE-003, gồm fallback), cùng Gaussian (CHR-ATT-001) và cùng cổng vùng. Quy tắc override Linh Căn (cả hai generator):
| Input | Kết quả `origin` |
|---|---|
| Không có `spiritualRoots` | roll `rollSpiritualRootBranch(rng)`: `spiritualRoots` + `spiritualRootBranch` từ cùng một roll |
| Có `spiritualRoots`, không có `spiritualRootBranch` | `spiritualRoots` = đầu vào; `spiritualRootBranch = null` (suy ra theo CHR-ATT-003 khi cần); không gọi `rng` cho Linh Căn |
| Có cả hai | giữ nguyên `spiritualRootBranch` đầu vào; không gọi `rng` cho Linh Căn |
Validate (cả hai, `RangeError("Nhánh Linh Căn không khớp nguyên tố.")`): `spiritualRootBranch` ∈ {`tap`, `song_tam`, `don`, `hiem`, `di`, `null`}; số nguyên tố khớp nhánh (`tap` 4–5, `song_tam` 2–3, `don` 1 hệ thường, `hiem` 2–3, `di` 1 hệ dị).

## Acceptance

- `tools/verify_character_generator_replay.js`: hai nhân vật cùng input + RNG cùng chuỗi deep-equal sau khi bỏ `createdAt`.
- `tools/verify_random_boundaries.js` audit cả `character_generator.js`.
- 5 Mệnh không trùng, ≤ Hoàng, tổng ≥ 6; Mệnh Kho rỗng, capacity 10; `hiddenProfession` null.
- Fallback (cả hai generator, catalog giả lập 6 Mệnh Phàm `score 1` id `a1…a6` + 1 Mệnh Hoàng `score 3` id `h1`, `rng = () => 0`): mọi lần thử chọn 5 Phàm đầu tổng 5 < 6 → sau 500 lần trả `[h1, a1, a2, a3, a4]` (tổng 7), không ném lỗi, không gọi `rng` ở bước fallback; Node và browser trả cùng kết quả.
- Override: `generateCharacter({ spiritualRoots: ["Kim","Mộc"], spiritualRootBranch: "song_tam" })` → `origin.spiritualRootBranch === "song_tam"`; bỏ `spiritualRootBranch` → `null`; `spiritualRootBranch: "don"` với 2 nguyên tố → `RangeError`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CHR-CRE-001 | `js/engine.js:rollCharacterCreation`, `createCharacter` | Khớp |
| CHR-CRE-002 | `js/engine.js:rollCharacterCreation` (`sampleDistinct(PERSONALITY_POOL, 2)`) | Khớp |
| CHR-CRE-003 | `js/engine.js:drawInitialFates` (fallback sort chỉ theo `score`, chưa tie-break `id`); `character_generator.js:rollFates` | Lệch — bản Node không có fallback tất định, ném lỗi sau 500 lần; thêm fallback `score` giảm dần rồi `id` tăng dần |
| CHR-CRE-004 | `js/engine.js:rollCharacterCreation`; `character_generator.js:generateCharacter` | Khớp |
| CHR-CRE-005 | `character_generator.js:generateCharacter`, `defaultRandom`; `js/engine.js:entropyRandom` | Khớp |
| CHR-CRE-006 | `character_generator.js:generateCharacter` (`rootRoll = { elements, branch: null }`); `js/engine.js:rollCharacterCreation`, `createCharacter` | Lệch — override `spiritualRoots` đặt `spiritualRootBranch = null` thay vì giữ nhánh đầu vào (vi phạm CHR-ATT-003); chưa validate nhánh |
