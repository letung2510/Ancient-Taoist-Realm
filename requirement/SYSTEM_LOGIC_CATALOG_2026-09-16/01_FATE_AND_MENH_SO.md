# CORE-FATE — MỆNH SỐ VÀ TOÀN BỘ LOGIC LIÊN QUAN

## 1. Phạm vi và thuật ngữ

Mệnh Số là thực thể dữ liệu có định nghĩa bất biến và instance sở hữu riêng. `FateDefinition` chỉ mô tả catalog; `FateInstance` mới giữ quan hệ, lần dưỡng, tiến hóa, lịch sử và trạng thái khóa. Mệnh đang kích hoạt và Mệnh trong Mệnh Kho là hai trạng thái khác nhau.

Các lớp: phẩm cấp, dấu Cát/Bình/Hung, nguyên tố, tag, effect tĩnh, effect điều kiện, tương hợp với Con Đường, quan hệ nhân vật–Mệnh, quan hệ Mệnh–Mệnh, combo, Hoán Mệnh và tiến hóa.

## 2. Nguồn dữ liệu

| Dữ liệu | File/runtime | Bất biến |
|---|---|---|
| catalog Mệnh | `data/fate_data.js`, `window.FATE_DATA` | Có |
| quan hệ cặp/combo/fusion | `data/fate_relationships.js` | Có |
| quan hệ Mệnh–Con Đường | `data/path_fate_relations.js` | Có |
| instance người chơi | `state.fateInstances` | Không |
| slot đang dùng | `state.player.fates` | Không |
| kho | `state.fateInventory` | Không |
| tiến hóa | `state.player.fateEvolutions` hoặc instance tương ứng | Không |

Catalog phải được normalize về một schema chung trước khi tính. Không lấy trực tiếp field tùy ý từ UI.

## 3. Schema canonical

```js
FateDefinition = {
  id, name, sign, grade, score, element,
  tags: [], effects: {}, conditionalEffects: {},
  path_affinity: { lead: [], support: [], forbidden: [] },
  resonanceEffect, combo_sets: [], fusion_recipes: []
}

FateInstance = {
  instanceId, fateId, acquiredAtDay,
  relationship: { level: 0, xp: 0, lastActiveDay: 0, history: [] },
  nurture: { uses: 0, lastDay: null, cooldownUntil: null },
  resonance: { count: 0, lastDay: null },
  evolution: { status: "base", branch: null, progress: 0, debt: 0 },
  locked: false, metadata: {}
}
```

Nếu save cũ chỉ lưu ID, migration tạo instance ổn định và không nhân đôi cùng một bản ghi.

## 4. Quy trình tính hiệu lực

1. `resolveFateDefinition(fateId)` đọc catalog đã normalize.
2. `resolveFateInstance(state, fateId/instanceId)` lấy record sở hữu.
3. `computeFate(state.player)` tính các tổng `effective`, `normal`, `ratioR`, `debt`, `surplus`.
4. `splitFateEffects` tách modifier trực tiếp và hiệu ứng điều kiện.
5. Cộng ảnh hưởng phẩm cấp, sign, enhancement, evolution, relationship, path affinity, combo và world modifier theo thứ tự canonical.
6. Resolver trả DTO; action mới commit thay đổi.

Không cộng cùng một effect hai lần khi Mệnh vừa nằm trong slot vừa xuất hiện trong kho. Một Mệnh chỉ được tính một lần trong active set.

## 5. Phẩm cấp, dấu và match

Phẩm cấp được so sánh theo registry, không so sánh chuỗi. `sign` phân thành Cát/Bình/Hung; `grade` là phẩm chất. `match_score` với Con Đường dựa trên `path_fate_relations`, ưu tiên `lead`, sau đó `support`, loại trừ `forbidden`. Thiếu match không tự động nghĩa là forbidden.

Tương sinh/tương khắc là quan hệ pairwise giữa nguyên tố/tag. Cộng hưởng là set bonus khi đủ các ID hoặc tag của combo. Fusion recipe không được tự suy diễn từ tên; phải có recipe catalog.

## 6. Quan hệ nhân vật ↔ Mệnh

Quan hệ nằm trên instance, không nằm trên definition. Bậc 0–4 có XP, lịch sử và điều kiện tăng bậc. XP đến từ hành vi liên quan: kích hoạt Mệnh đúng ngữ cảnh, chọn quyết định hợp affinity, Dưỡng Mệnh, Cộng Minh và các milestone được catalog cho phép.

Hiệu ứng quan hệ là phần cộng thêm, không sửa definition. Khi Mệnh bị tháo khỏi active slot, quan hệ vẫn tồn tại; hiệu ứng chỉ không được áp dụng cho đến khi kích hoạt lại. Suy giảm do để lâu trong kho chỉ được dùng nếu policy đã chốt; không tự âm thầm giảm quan hệ khi chưa có quyết định sản phẩm.

## 7. Dưỡng Mệnh

`NURTURE_FATE` là action transaction:

1. Kiểm tra Mệnh tồn tại, người chơi sở hữu và mục tiêu hợp lệ.
2. Kiểm tra cooldown/ngày, tài nguyên và điều kiện cảnh giới.
3. Tính gain từ hành động, comprehension, affinity và modifier thế giới.
4. Cập nhật instance relationship/nurture, ghi history.
5. Cập nhật derived stats sau commit.

Dưỡng Mệnh không được tạo bản sao definition, không tự mở slot và không bỏ qua khóa nghề/Con Đường. Lỗi phải trả reason cho UI và không trừ tài nguyên.

## 8. Cộng Minh

Cộng Minh là kiểm tra quan hệ Mệnh–Mệnh hoặc Mệnh–bối cảnh. Resolver xác định cặp đủ điều kiện, combo đã kích hoạt, số lần cộng hưởng và hiệu ứng. Action phải idempotent theo `day + comboId`, tránh tick lặp tạo thưởng vô hạn. Hiệu ứng tạm thời phải có thời điểm hết hạn rõ ràng.

## 9. Hoán Mệnh, dung hợp và nâng cấp

Hoán Mệnh là thay đổi active set hoặc thay instance đang kích hoạt, không phải xóa definition. Flow chuẩn: preview → xác nhận → kiểm tra slot/cost → transaction → ghi event. Khi kho đầy, action phải trả trạng thái `requiresReplacement`, không tự xóa Mệnh.

Dung hợp/fusion kiểm tra recipe, số lượng, phẩm cấp và không cho dùng instance đang bị khóa hoặc đang active nếu policy cấm. Rollback toàn bộ nguyên liệu khi kết quả thất bại.

Nâng cấp enhancement giữ `fateEnhancements[fateId]` hoặc record instance canonical, giới hạn cấp, chi phí và không làm thay đổi catalog. Progress/evolution sử dụng record riêng để tránh lẫn với relationship XP.

## 10. Tiến hóa Mệnh

Tiến hóa có điều kiện mở, ritual, branch và effect pipeline. Ba nhánh chuẩn trong spec là Thuận Diễn — Hợp Đạo, Nghịch Diễn — Đoạt Mệnh, Quy Nguyên — Hóa Linh. Mỗi branch phải có preview trước khi commit, cost, failure penalty và migration field.

## 11. UI, log, save

UI cần hiển thị: active Mệnh, Mệnh Kho, slot, bậc quan hệ, progress Dưỡng Mệnh, affinity, combo, preview cost và reason lỗi. Không hiển thị object catalog thô.

Log kể hành động và kết quả; số lượng/cost đưa vào stat display. Save phải serialize cả active IDs, vault IDs, instances, relationship, nurture, resonance, enhancement và evolution. Deserialize chạy normalize trước khi render.

## Note chưa hoàn thiện

- **MỘT PHẦN**: Phase 3 các action Nghịch Mệnh/Trấn Mệnh/Thiên Cơ/Mệnh Đổi chưa có contract runtime hoàn chỉnh.
- **MỘT PHẦN**: cần chốt policy suy giảm quan hệ khi Mệnh nằm lâu trong kho.
- **MỘT PHẦN**: cần audit mọi effect tiến hóa để chắc chắn không bị cộng kép với effect base.
- **MỘT PHẦN**: UI preview quan hệ/combo chưa thể hiện toàn bộ điều kiện theo instance.
