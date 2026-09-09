# FATE SYSTEM MASTER — Canonical Implementation Contract

Tài liệu này hợp nhất các rule trong cùng thư mục (`FATE_UPDATE_SYSTEM_RULE.md`, `FATE_SYSTEM_COMPLETE.md`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_NEW_LOGIC_ADDENDUM.md`, `FATE_GRADE_WEIGHT_BY_LEVEL.md`) và `requirement/01-core/FATE_SYSTEM_SPEC.md`. Đây là bản dùng để đối chiếu runtime; các file nguồn cũ giữ lại để audit lịch sử.

## 1. Nguồn dữ liệu và bất biến

- `data/fate_data.js` là catalog canonical 10.000 Mệnh; không dùng pool legacy 1.300.
- `data/fate_relationships.js` là bảng pairwise/combo/fusion chuẩn hóa.
- `data/path_fate_relations.js` là mapping Con Đường, affinity và hidden fate.
- `GRADE_TO_TIER` và `SIGN_TO_TYPE_LABEL` trong `js/engine.js` là map duy nhất.
- `state.player.fates` là Mệnh đang kích hoạt; `state.fateInventory` là Mệnh Kho và không tạo buff/score/relationship.
- `state.player.fateInstances` lưu tiến trình từng instance; `state.pendingFateRewards` bảo toàn phần thưởng khi kho đầy.

## 2. Resolver nhận Mệnh

Mọi nguồn reward phải chọn grade trước rồi chọn đều một entry khả dụng trong grade. `rollFateByProgression` áp dụng level, cap, minimum grade, loại ID đã sở hữu và khóa Tiên; khi grade hết entry, trọng số được tái phân bổ sang grade còn khả dụng. `receiveFate` là transaction cuối: duplicate Phàm/Linh/Hoàng đổi thành Tinh Hoa Dư (1/3/8), kho đầy chuyển pending hoặc yêu cầu thay thế, không mất Mệnh âm thầm.

Reward weights canonical: cấp 1–2 `65/30/5`; 3–4 `15/45/25/10/5`; 5–6 `5/20/35/25/10/5`; 7–8 `2/10/25/30/20/10/3`; 9+ `1/5/15/25/25/18/11/0` theo thứ tự Phàm→Tiên. Tiên chỉ mở từ nguồn đặc biệt/pity và duy nhất trong world save hiện tại.

## 3. Hiệu lực, affinity và quan hệ

`fateDefinition` chuẩn hóa `sign→alignment`, `grade→tier`, `element`, `path_affinity`, đồng thời tách `effects` thành `modifiers` và `conditionalEffects`. Chỉ active fate đi qua `computeStats`, `computeFate`, `pathMatchSummary`, pairwise relationship và combo. Match 0 vẫn equip được nhưng là off-build; forbidden chỉ đến từ tag forbidden đã review.

Quan hệ nhân vật–Mệnh dùng stage 0–4: Sơ Ngộ, Đồng Hành, Tương Ứng, Cộng Minh, Nhân Mệnh Hợp Nhất. `nurtureFate` chỉ dành cho active fate, tốn `5 + stage*5` Linh Thạch và cooldown một ngày game; `resonateFate` yêu cầu stage 2, match ≥8 và 10 SAN. Insight được mở khi Ngộ Tính ≥60 hoặc stage ≥2; Hung insight tăng `forbiddenKnowledgeCount`.

## 4. Action nâng cao

- `releaseStagnantFate`: chỉ cho Mệnh active nguội ≥60 ngày, tháo trực tiếp và hoàn Tinh Hoa Dư.
- `defyFate`: Hung active, tốn 15 SAN, ghi số lần Nghịch Mệnh.
- `suppressFate`: Hung/active, tốn 8 SAN, tạm bỏ hiệu lực stat đến `untilTurn`; không xóa dữ liệu.
- `heavenlyOmen`: tốn 5 SAN, cooldown 12 turn, trả dự báo blocker đột phá từ state thật.
- `transformFate`: chỉ mở ở stage 4 và Cường Hóa +5. Công thức canonical hiện tại tái sử dụng nhánh Fate Evolution: `essence = 5 + 2×gradeTier`, `merit = 10 + 5×gradeTier`, `SAN = 10`; preview trả candidate branches và thay đổi trước/sau, commit gọi `GameExpansion.evolveFate` có xác nhận cho nhánh nguy hiểm. Không tự sinh biến thể ngoài catalog; nếu chưa có branch hợp lệ thì trả blocker.

Các action đều phải kiểm tra blocker trước khi trừ tài nguyên và chỉ ghi history sau commit thành công. Narrative không quyết định gameplay.

## 5. Migration và kiểm thử

Save cũ được chuẩn hóa về `fateInstances`, `fateRelationships`, `fateInventory`, `pendingFateRewards`, `uniqueFateOwnership` và các field action mới theo kiểu backward-compatible. API engine liên quan nằm trong `js/engine.js`; UI đọc kết quả từ engine, không tự tính affinity/score.

## 6. Đối chiếu triển khai ngày 2026-09-09

Đã có: catalog/maps, active-vault invariant, weighted resolver/fallback, duplicate essence, pending reward, equip/swap/sacrifice/fusion/upgrade, pairwise/combo, nurture/resonate, insight, stagnant release, defy, suppress, omen, transform guard, structured log và save migration. Còn mở rộng: recipe cụ thể cho Fate Transform và server đa người chơi thực sự (runtime hiện là single-save; uniqueness Tiên được khóa trong `state.meta.uniqueFateOwnership`).

Kiểm tra bắt buộc: `node --check js/engine.js`, `node --check js/ui.js`, `node tools/verify_game.js`.
