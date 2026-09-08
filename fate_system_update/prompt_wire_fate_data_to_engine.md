CONTEXT: Cổ Dị Diện — hệ thống Fate/Mệnh Số. Đã có sẵn `FATE_SYSTEM_SPEC.md` (chuẩn gốc),
`FATE_SYSTEM_COMPLETE.md`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_NEW_LOGIC_ADDENDUM.md` (bổ sung
mới). Đính kèm 4 file DATA THẬT đã sinh sẵn, cần nối vào engine — KHÔNG cần sinh lại, chỉ cần code
phần đọc/dùng chúng đúng cách.

============================================================
FILE ĐÍNH KÈM — Ý NGHĨA TỪNG FILE
============================================================
1. `grade_sign_maps.js` — export `GRADE_TO_TIER`, `TIER_TO_GRADE`, `SIGN_TO_TYPE_LABEL`,
   `TYPE_LABEL_TO_SIGN`. Import module này ở MỌI nơi engine cần so sánh/tra cứu chéo giữa
   `data/fate_data.js` (dùng `grade` string) và `fate_relationships.js` (dùng `tier` số + `type`
   nhãn đầy đủ) — thay thế MỌI đoạn code đang tự so sánh 2 field này bằng cách khác.

2. `fate_data_with_tags.json` — bản `fate_data.js` gốc đã bổ sung 2 field MỚI trên toàn bộ 10.000
   entry: `tags: string[]` (dùng để tính `match_score` với Con Đường theo đúng công thức
   `3×lead + 1×support - 2×forbidden` đã có) và `element: "kim"|"moc"|"thuy"|"hoa"|"tho"|"vo_he"`.
   Việc cần làm: THAY THẾ `data/fate_data.js` hiện tại bằng nội dung file này (giữ nguyên format
   `window.FATE_DATA = [...]`, chỉ cần export lại đúng cú pháp cũ).
   LƯU Ý CHẤT LƯỢNG DATA: field `tags` sinh bằng keyword-matching trên `desc`, đạt 87.3% coverage,
   NHƯNG có false-positive do đồng âm tiếng Việt (VD "sinh" trong "bẩm sinh" bị nhận nhầm thành tag
   chủ đề "sinh trưởng"). Trước khi dùng production, cần 1 pass review thủ công ít nhất cho các
   Mệnh grade Huyền trở lên (190 entry) — xem `sample_review.json` để biết dạng lỗi cụ thể.

3. `resonance_effects_v2.json` — hiệu ứng ẩn độc quyền bậc Cộng Minh (mục 4
   `FATE_RELATIONSHIP_COMPLETE.md`) cho 130 Mệnh Địa Phẩm trở lên, sinh CỤ THỂ theo đúng
   concept1/concept2 parse từ `desc` gốc (không phải template chung chung theo element). Việc cần
   làm: thêm field `resonanceEffect` (string) vào ĐÚNG 130 entry tương ứng trong `fate_data.js`
   (match theo `id`), dùng làm nội dung hiển thị + hiệu ứng khi `relationshipStage` đạt bậc 3.
   Field `resonanceEffect` hiện là TEXT MÔ TẢ + SỐ ĐỀ XUẤT — cần tự parse số trong chuỗi hoặc viết
   lại thành object có field số riêng (`{ description, effectValue, effectType }`) nếu engine cần
   xử lý số trực tiếp thay vì chỉ hiển thị text.

4. `sample_review.json` — 15 entry ngẫu nhiên để QA/dev tự đối chiếu chất lượng tags/element trước
   khi merge toàn bộ, không cần đưa vào engine.

============================================================
VIỆC CẦN CODE (theo đúng thứ tự)
============================================================
1. Import `grade_sign_maps.js` vào engine, thay thế mọi so sánh grade/tier hoặc sign/type thủ công
   hiện có bằng 2 bảng map này.
2. Merge `fate_data_with_tags.json` vào `data/fate_data.js` (thay thế hoàn toàn hoặc merge field
   theo `id` nếu engine đã có thêm field khác từ trước cần giữ lại).
3. Viết hàm `computeMatchScore(characterActiveTags, pathId)` dùng bảng 10 Con Đường (lead/support/
   forbidden tags) đã có sẵn trong tài liệu hệ thống hợp nhất — trả về số theo đúng công thức
   `3×lead + 1×support - 2×forbidden`.
4. Merge `resonanceEffect` từ `resonance_effects_v2.json` vào 130 entry tương ứng trong
   `fate_data.js` theo `id`.
5. Code 4 logic mới ở `FATE_NEW_LOGIC_ADDENDUM.md`:
   - Xử lý Mệnh trùng lặp (mục 1) — convert "Tinh Hoa Dư" hoặc hỏi người chơi tùy grade.
   - Giác Ngộ Ẩn (mục 2) — field `insightRevealed`, điều kiện Ngộ Tính/relationshipStage.
   - Mệnh Nguội (mục 3) — field `stagnantDays`, action "Buông Mệnh".
   - Khóa độc bản grade `tien` (mục 4) — bảng `serverUniqueFateOwnership` ở tầng server.
6. Code hệ quan hệ Nhân Vật↔Mệnh bậc 0-4 đầy đủ theo `FATE_RELATIONSHIP_COMPLETE.md` mục 2-4
   (nếu chưa có) — ĐÂY LÀ ĐIỀU KIỆN TIÊN QUYẾT để bước 5 (Giác Ngộ/Mệnh Nguội) hoạt động, vì cả 2
   đều phụ thuộc `relationshipStage`.

============================================================
CẦN XÁC NHẬN TRƯỚC KHI CODE (KHÔNG tự ý quyết định)
============================================================
- Phase 3 (`DEFY_FATE`/`SUPPRESS_FATE`/`HEAVENLY_OMEN`/`FATE_TRANSFORM`, mục 6
  `FATE_RELATIONSHIP_COMPLETE.md`): hiện CHỈ là phác thảo tham khảo, CHƯA duyệt — KHÔNG code phần
  này cho tới khi có xác nhận rõ ràng từng action muốn giữ/bỏ/sửa gì.
- Cơ chế suy giảm bậc quan hệ khi vault lâu (mục 2.4 `FATE_RELATIONSHIP_COMPLETE.md`) — đề xuất,
  chưa chốt có áp dụng hay không.
- Ngưỡng số cụ thể ở mục 5 `FATE_NEW_LOGIC_ADDENDUM.md` (60 ngày Mệnh Nguội, ngưỡng grade convert
  Tinh Hoa Dư) — placeholder hợp lý, cần cân bằng qua playtest thật, không lấy làm số cuối cùng.
