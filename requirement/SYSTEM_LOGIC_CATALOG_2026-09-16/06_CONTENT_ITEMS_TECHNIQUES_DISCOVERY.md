# CONTENT — CÔNG PHÁP, VẬT PHẨM, NGHỀ, CHẾ TÁC, DỊ CHÍ VÀ KHÁM PHÁ

## 1. Công Pháp

Catalog `data/cong_phap.js` định nghĩa category, family, realm requirement, visible cost, effect, corruption profile và evolution. Player progress giữ masteryExp/stage/usage. `techniquePreview` tính cost và danger; `useTechnique` yêu cầu confirm với Công Pháp nguy hiểm, trừ resource, áp effect, cooldown và ghi log.

Tâm Pháp là passive; không dùng action thi triển. Công Pháp combat/thân pháp/phụ trợ có resolver riêng. Mastery update theo activity, không cộng cho category không phù hợp.

## 2. Vật phẩm và inventory

Item catalog định nghĩa kind, stack, quest/key protection, effect, recipe và rarity. Inventory có quantity, equipment có slot, protected item không được quick-use/dung luyện. Add/remove phải kiểm tra quantity và rollback transaction.

## 3. Luyện đan, luyện khí, trận pháp, tướng sư

Profession action lấy profession definition, recipe, skill/proficiency, material và random outcome. Primary profession là một slot; hidden profession là slot phụ. Cost, success, perfect result và failure đều ghi DTO/log. Không dùng tên hiển thị để lookup recipe.

## 4. Dị Chí và registry khám phá

Discovery registry có type, source, clue, region, status, progress, verified/collected và reward. Dị Chí là lớp phát hiện/tri thức, không phải Con Đường và không tự thi hành effect path. Set clue có thể mở hidden profession, quest, region hoặc lore khi đủ điều kiện.

`inspectCodex`, `codexProgress`, `hiddenProfessionClue` phải phân biệt discovered, verified, collected. Không cho collect hai lần. Clue không được ghi thẳng vào hidden profession state trước khi commit.

## 5. Xem Quẻ, sinh tồn, dấu vết

Divination dùng context Mệnh/path/weather/region để trả hint; hint là narrative hoặc DTO, không phải source of truth. Survival log/player mark ghi dấu cá nhân, location, day, choice và consequence. Dấu vết có expiry hoặc chain stage nếu quest yêu cầu.

## 6. Cơ duyên tranh chấp và bí cảnh

Opportunity có owner/claimants, expiry, contest state, choice, reward và risk. Hidden realm có entry/exit, requirement, discover record, safe anchor và one-time reward. Enter/exit phải cập nhật map/history/location, không mất player nếu action fail.

## 7. Item awakening, heirloom và auction

Awaken item thêm state awakened/traits/owner; heirloom ghi lineage, repair/decay và migration. Auction có lot, bidder, currentBid, expiry, delivered. Bid trừ tiền transaction; delivery chỉ một lần; auction offline refresh không cấp duplicate.

## Note chưa hoàn thiện

- **ĐÃ CODE**: catalog Công Pháp/recipe đã có DTO và resolver transaction; chi tiết tại `06-expansion/TECHNIQUE_RECIPE_CANONICAL_2026-09-16.md`.
- **MỘT PHẦN**: UI Dị Chí cần phân biệt tri thức đã đọc, đã xác minh và đã thu thập rõ hơn.
- **ĐÃ CODE**: contested opportunity và hidden realm đã có test expiry/enter/exit/claim; offline replay tiếp tục dùng world seed.
- **ĐANG TRIỂN KHAI**: reward table của một số discovery vẫn cần chuyển toàn bộ producer còn lại sang catalog receipt.
