# FATE SYSTEM — HOÀN CHỈNH (đọc kèm `FATE_SYSTEM_SPEC.md`, không lặp lại nội dung đã có ở đó)
> File này CHỈ bổ sung phần `FATE_SYSTEM_SPEC.md` còn để trống: đối chiếu schema THẬT của
> `data/fate_data.js` (10.000 mệnh, đang chạy) với `FateDefinition` mục tiêu (spec mục 4.1), và kế
> hoạch lấp từng gap cụ thể. Đọc `FATE_SYSTEM_SPEC.md` trước — nó vẫn là nguồn chân lý cho nguyên
> tắc, luồng giao dịch, action, UI, roadmap. File này KHÔNG được mâu thuẫn với spec đó.

---

## 1. PHÂN LOẠI FILE — CÁI NÀO LÀ NGUỒN THẬT, CÁI NÀO ĐÃ LỖI THỜI

| File | Trạng thái | Lý do |
|---|---|---|
| `data/fate_data.js` (10.000 mệnh, `window.FATE_DATA`) | **NGUỒN THẬT** — khớp `data/fate_data.js` mà spec mục 4.1/16 trỏ tới | grade dùng đúng thang Phàm→Tiên theo spec mục 5.1 |
| `fate_relationships.js` (`window.FATE_RELATIONSHIPS`, source: `fate_data_10000`) | **NGUỒN THẬT nhưng LỆCH SCHEMA** với `fate_data.js` (xem mục 3) | Sinh từ đúng 10.000 mệnh, nhưng dùng field khác tên |
| `generate_fate_pool.js` | **LỖI THỜI — bỏ hẳn** | Sinh thang 8 tier "Trắng/Lục/Lam/Chàm/Tím/Cam Kim/Đỏ/Cầu Vồng" — SAI thang chuẩn (spec mục 5.1 chốt `Phàm→Linh→Hoàng→Huyền→Địa→Thiên→Thánh→Tiên`). Ghi ra `data/fate-pool.json` (có gạch nối) — KHÔNG PHẢI đường dẫn `data/fate_data.js` mà runtime/spec dùng. |
| `fate-pool.json` (1300 mệnh, tier Trắng...Cầu Vồng) | **LỖI THỜI — bỏ hẳn** | Output của script lỗi thời ở trên, sai thang tier, sai quy mô (1300 vs 10.000 mục tiêu) |
| `fate-relationships.json` (source: `fate-pool_1300`) | **LỖI THỜI — bỏ hẳn** | Sinh từ `fate-pool.json` lỗi thời, thừa hưởng luôn lỗi thang tier |

> Không cần migrate bất kỳ dữ liệu nào từ 3 file lỗi thời — quy mô (1300) và thang tier đều đã bị
> thay thế hoàn toàn bởi bộ 10.000 mệnh + thang Phàm→Tiên. Chỉ giữ lại nếu cần THAM KHẢO ý tưởng
> ngân hàng từ (Chính Tinh/Phụ Tinh Tử Vi Đẩu Số) cho việc SINH THÊM biến thể sau này — không dùng
> trực tiếp output của nó.

---

## 2. ĐỐI CHIẾU `FateDefinition` (spec mục 4.1) vs SCHEMA THẬT CỦA `fate_data.js`

Field thật hiện có trên mỗi entry: `id, name, sign, grade, gradeLabel, score, effects{...}, desc`.

| Field trong `FateDefinition` mục tiêu | Trạng thái thật | Gap cụ thể cần lấp |
|---|---|---|
| `id` | **Đã có** | — |
| `name` | **Đã có** | — |
| `grade` | **Đã có** (`grade` + `gradeLabel` song song, đúng thang Phàm→Tiên) | — |
| `alignment` | **Có nhưng khác** | Field thật tên là `sign`, giá trị `cat/binh/hung` (khớp ngữ nghĩa Cát/Bình/Hung của spec) — CHỈ cần map lại tên field khi engine đọc, không cần đổi data: `alignment = sign` |
| `element` | **CHƯA CÓ — gap lớn** | Không có field Ngũ Hành nào trên 10.000 entry. Cần pass sinh bổ sung (mục 4.1) |
| `path_affinity {lead, support, forbidden}` | **CHƯA CÓ — gap NGHIÊM TRỌNG NHẤT** | Đây là field mà toàn bộ mục 5.2-5.3 của spec (match_score, tương sinh/khắc Con Đường) phụ thuộc vào — hiện KHÔNG có bất kỳ liên kết nào giữa 1 Mệnh Số và Con Đường nào cả. Không có field này thì `match_score` không thể tính được từ chính Mệnh, phải tính từ nguồn khác (không đúng nguyên tắc #3 của spec). BẮT BUỘC lấp trước khi triển khai Phase 1 mục "Read/Quan Mệnh" hiển thị match. Xem thuật toán sinh ở mục 4.2. |
| `modifiers` | **Có nhưng khác** | Field thật gộp CHUNG vào `effects` (VD `magMult`, `phyMult`, `lifespanBonus`, `hpRegen`, `qiFlat`, `allStatMult` — đây đều là chỉ số TRỰC TIẾP, đúng nghĩa `modifiers` của spec) |
| `effects` | **Có nhưng khác** | Cùng field `effects` thật đang LẪN cả modifier trực tiếp VÀ hiệu ứng điều kiện (`breakBonus`, `fortune`, `lootMult`, `sanDrainMult`, `breakFailPenalty`, `sanResist`, `sanShield`, `lightFireMult`, `resistPossession`) — cần TÁCH thành 2 nhóm, xem bảng phân loại mục 4.3 |
| `passive` | **CHƯA CÓ** | Không có field đánh dấu hiệu ứng nào luôn bật (passive) vs có điều kiện — mặc định coi TẤT CẢ hiệu ứng của Mệnh đang kích hoạt là passive (luôn bật khi active) cho tới khi có hệ thống điều kiện trigger riêng (Phase 3) |
| `relationship` | **Có nhưng khác (kiến trúc, không phải thiếu)** | KHÔNG nên nhúng trực tiếp vào từng `FateDefinition` — quan hệ đang lưu ở bảng riêng `fate_relationships.js` (`pairwise_relationships`, tra theo `from`/`to` id). Đây là thiết kế CHUẨN HÓA (normalized), TỐT HƠN nhúng — chỉ cần engine cung cấp hàm `getRelationshipsFor(fateId)` tra ngược bảng đó, không cần đổi schema `fate_data.js` |
| `potential` | **CHƯA CÓ trên entry, có RẢI RÁC ở bảng khác** | Trần thức tỉnh/combo nằm ở `combo_sets`/`fusion_recipes` riêng (tra theo id thành viên) — tương tự `relationship`, đây là thiết kế chuẩn hóa hợp lý, chỉ cần thêm 2 hàm tra cứu `getComboEligibility(fateId)`/`getFusionRecipesUsing(fateId)`, KHÔNG cần nhúng field `potential` vào từng entry |
| `state` | **Đúng theo thiết kế — KHÔNG phải gap** | `state` (active/vault/pending) là thuộc tính của INSTANCE nhân vật sở hữu (`state.player.fates`/`state.fateInventory`), không phải của `FateDefinition` (bản mẫu/catalog dùng chung) — spec mục 4.1 đã map đúng chỗ này rồi, không cần sửa gì |

**Tóm tắt 2 gap THẬT SỰ cần code/data mới:** `element` và `path_affinity` (đều thiếu hoàn toàn trên
data thật). Còn lại là vấn đề ĐẶT TÊN LẠI field khi đọc (`sign`→`alignment`) hoặc TÁCH nhóm trong
cùng field `effects` sẵn có (`modifiers` vs `effects` điều kiện) — không cần sinh lại data.

---

## 3. LỆCH SCHEMA GIỮA `fate_data.js` VÀ `fate_relationships.js` (2 FILE "THẬT" TỰ MÂU THUẪN NHAU)

| Điểm lệch | `fate_data.js` dùng | `fate_relationships.js` dùng | Rủi ro nếu không sửa |
|---|---|---|---|
| Cấp bậc | `grade` (string: `phan/linh/hoang/huyen/dia/thien/thanh/tien`) | `tier` (number, trong `combo_sets.members[].tier` và `fusion_recipes.tier_from/tier_to`) | Engine đọc 2 file phải tự đoán mapping `grade↔tier`, dễ sai lệch nếu không có 1 hàm chuyển đổi DUY NHẤT dùng chung |
| Nhãn Cát/Hung | `sign` (code ngắn: `cat/binh/hung`) | `type` (nhãn tiếng Việt đầy đủ: `"Cát Cách"`/`"Hung Cách"`, trong `combo_sets.members[].type` và `fusion_recipes.materials[].type`/`result.type`) | Cùng 1 khái niệm nhưng 2 định dạng khác nhau — so sánh trực tiếp `sign === type` sẽ LUÔN false dù cùng ý nghĩa |

### Fix bắt buộc TRƯỚC khi code Phase 1 dùng tới quan hệ/combo/fusion:
```js
// Đặt trong engine, dùng DUY NHẤT 1 nguồn cho toàn bộ codebase — không để UI/action tự map riêng

const GRADE_TO_TIER = { phan: 1, linh: 2, hoang: 3, huyen: 4, dia: 5, thien: 6, thanh: 7, tien: 8 };
const TIER_TO_GRADE = Object.fromEntries(Object.entries(GRADE_TO_TIER).map(([g,t]) => [t,g]));

const SIGN_TO_TYPE_LABEL = { cat: "Cát Cách", hung: "Hung Cách", binh: "Bình Cách" };
const TYPE_LABEL_TO_SIGN = Object.fromEntries(Object.entries(SIGN_TO_TYPE_LABEL).map(([s,l]) => [l,s]));
```
- Mọi nơi trong engine cần so sánh/tra cứu chéo giữa 2 file PHẢI đi qua 2 bảng map này — không tự
  viết if/else rời rạc ở nhiều chỗ (đúng nguyên tắc "1 nguồn chân lý" đã có ở spec mục 6: "mọi UI và
  tooltip phải lấy cùng 1 kết quả từ engine, không tự tính lại").
- Lưu ý: `binh` (Bình Cách) có trong `sign` của `fate_data.js` nhưng KHÔNG thấy xuất hiện trong
  `type` của `fate_relationships.js` (chỉ thấy Cát Cách/Hung Cách trong dữ liệu quan hệ hiện tại) —
  cần kiểm tra xem Mệnh `sign: "binh"` có bị bỏ sót hoàn toàn khỏi hệ thống quan hệ (không có
  Tương Sinh/Khắc/Combo nào chứa Mệnh Bình Cách) hay đây là thiếu sót cần bổ sung thêm khi sinh lại
  quan hệ.

---

## 4. KẾ HOẠCH LẤP 2 GAP THẬT SỰ

### 4.1. Sinh `element` (Ngũ Hành) cho 10.000 entry
```
Nguồn suy luận: field `desc` đã có sẵn text mô tả ngữ nghĩa cho mỗi Mệnh (VD "Thần thánh, tinh
thần, siêu nhiên kết hợp với con đường..." hay "Thoát tục, trường sinh, cõi tiên kết hợp với sức
lực, thành quả, võ công").

elementKeywordMap = {
  kim:   ["kiếm", "đao", "kim loại", "sắc bén", "chiến", "sát"],
  moc:   ["mộc", "sinh trưởng", "cây", "sinh sôi", "hồi phục"],
  thuy:  ["thủy", "nước", "linh hoạt", "biến hóa", "ẩn tàng"],
  hoa:   ["hỏa", "lửa", "thiêu đốt", "nhiệt huyết", "bùng nổ"],
  tho:   ["thổ", "đất", "vững chắc", "trấn", "ổn định"],
  vo_he: [] // fallback mặc định nếu không khớp từ khóa nào — phần lớn Mệnh trừu tượng (Thần Đạo,
            // Thần Mệnh, Vĩnh Đạo...) sẽ rơi vào đây, ĐÚNG vì bản chất chúng trừu tượng không
            // thuộc Ngũ Hành vật lý
  di_he: [] // gán TAY cho nhóm Mệnh liên quan Tà/Cấm (không suy luận tự động, cần review thủ công)
}

Với mỗi entry: quét desc, đếm số từ khóa khớp mỗi hệ, chọn hệ có điểm cao nhất; nếu không khớp gì
-> element = "vo_he" (mặc định an toàn, KHÔNG ép gán bừa).
```
- Chạy 1 lần offline, ghi thẳng field `element` vào từng entry trong `fate_data.js` — không tính
  runtime (tính 1 lần, lưu tĩnh, giống cách `grade`/`score` đã được tính sẵn).
- Sau khi sinh xong, SAMPLE lại thủ công 50-100 entry ngẫu nhiên để kiểm tra độ chính xác trước khi
  áp dụng toàn bộ 10.000 — từ khóa tiếng Việt dễ nhầm (VD "chiến" có thể vừa hợp Kim vừa hợp chủ đề
  khác), cần tinh chỉnh `elementKeywordMap` qua vài vòng thử.

### 4.2. Sinh `path_affinity {lead, support, forbidden}` cho 10.000 entry
```
Điều kiện tiên quyết: cần có danh sách đầy đủ 10 Con Đường chính + bộ từ khóa chủ đề của MỖI Con
Đường (pathId -> themeKeywords[]) — đây LÀ DỮ LIỆU CHƯA CÓ trong bất kỳ file nào đã cung cấp, PHẢI
lấy từ tài liệu Con Đường gốc (mục "Mười Con Đường chính" trong tài liệu hệ thống hợp nhất) trước
khi chạy bước này.

Thuật toán (song song logic với 4.1, dùng chung cơ chế quét desc):
  Với mỗi entry, so desc với themeKeywords của cả 10 Con Đường:
    match_score_với_path = số từ khóa khớp
    nếu match_score cao nhất >= ngưỡng X -> path đó vào path_affinity.lead
    nếu match_score ở mức trung bình (dưới X nhưng > 0) với path khác -> vào path_affinity.support
    nếu desc mang ý nghĩa ĐỐI NGHỊCH rõ ràng với chủ đề 1 Con Đường (cần bộ từ khóa "phản đề" riêng
    cho mỗi Con Đường, KHÔNG chỉ suy luận thiếu khớp = forbidden) -> path_affinity.forbidden
  Mệnh không khớp path nào rõ ràng (nhóm trừu tượng như "Thần Đạo", "Vĩnh Đạo"...) -> để
  path_affinity = { lead: [], support: [], forbidden: [] } (rỗng cả 3, tương ứng match_score = 0,
  "Tuyệt Không" theo bảng spec mục 5.2 — ĐÚNG THIẾT KẾ, không phải lỗi, vì đây chính là nhóm
  "off-build" hợp lệ mà spec đã tính tới).
```
- Đây là bước CẦN REVIEW THỦ CÔNG NHIỀU HƠN 4.1 (vì `forbidden` sai sẽ tạo trải nghiệm khó chịu —
  người chơi bị phạt oan vì Mệnh bị gán nhầm forbidden với Con Đường họ đang đi) — khuyến nghị CHỈ
  tự động gán `lead`/`support`, để `forbidden` bắt đầu RỖNG cho toàn bộ 10.000 entry ở bản đầu tiên,
  bổ sung `forbidden` dần qua vài đợt review thay vì suy luận tự động ngay từ đầu.

### 4.3. Bảng tách `modifiers` vs `effects` từ field `effects` thật hiện có
| Key hiện có trong `effects` | Phân loại | Lý do |
|---|---|---|
| `magMult`, `phyMult`, `allStatMult` | `modifiers` | Nhân trực tiếp vào chỉ số nền, không điều kiện |
| `lifespanBonus`, `hpRegen`, `qiFlat` | `modifiers` | Cộng/trừ trực tiếp 1 giá trị tài nguyên, không điều kiện |
| `breakBonus`, `breakFailPenalty` | `effects` (điều kiện) | Chỉ áp dụng LÚC Đột Phá, không phải lúc nào cũng có tác dụng |
| `fortune`, `lootMult` | `effects` (điều kiện) | Chỉ áp dụng khi roll Khí Vận/loot, có tính xác suất |
| `sanDrainMult`, `sanResist`, `sanShield` | `effects` (điều kiện) | Chỉ kích hoạt khi có sự kiện liên quan SAN xảy ra |
| `lightFireMult` | `effects` (điều kiện) | Chỉ áp dụng khi dùng đòn thuộc tính Quang/Hỏa |
| `resistPossession` | `effects` (điều kiện) | Chỉ áp dụng khi bị 1 hiệu ứng khống chế/đoạt xá cụ thể nhắm tới |

- KHÔNG cần đổi cấu trúc data thật (`effects` object vẫn để nguyên) — chỉ cần hàm engine
  `splitFateEffects(fate)` trả về `{ modifiers: {...}, conditionalEffects: {...} }` dựa theo bảng
  trên, dùng NGAY TRONG `computeFate()`/`computeStats()` đã có, tránh phải chạy lại migration data.

---

## 5. VIỆC CẦN LÀM TIẾP (đúng thứ tự, không đảo)
1. Loại bỏ hẳn 3 file lỗi thời khỏi pipeline build/deploy (mục 1) — tránh nhầm lẫn cho dev sau này.
2. Viết 2 bảng map `GRADE_TO_TIER`/`SIGN_TO_TYPE_LABEL` (mục 3) — làm NGAY vì rẻ, chặn được lỗi so
   sánh sai ở bất kỳ chỗ nào dùng chung 2 file.
3. Chạy pass sinh `element` (mục 4.1), review mẫu, tinh chỉnh từ khóa, áp dụng toàn bộ.
4. Lấy danh sách 10 Con Đường + từ khóa chủ đề (điều kiện tiên quyết còn thiếu) → chạy pass sinh
   `path_affinity.lead/support` (mục 4.2), để `forbidden` rỗng ở bản đầu.
5. Viết hàm `splitFateEffects()` (mục 4.3) — không cần sinh lại data, code thuần.
6. SAU KHI 4 bước trên xong mới bắt đầu code Phase 1 của `FATE_SYSTEM_SPEC.md` (Equip/Unequip/
   Change/Read/Sacrifice) — vì match_score (phụ thuộc path_affinity) là điều kiện HIỂN THỊ bắt buộc
   ở mọi action theo spec mục 11.1, làm Phase 1 trước khi có `path_affinity` sẽ phải sửa lại sau.
