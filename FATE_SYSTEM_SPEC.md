# FATE SYSTEM SPEC

> Đặc tả canonical cho hệ thống Mệnh Số (Fate System).  
> Nguồn hợp nhất: `New Text Document.txt`, `FATE_RELATIONSHIP_COMPLETE.md`, `FATE_SYSTEM_COMPLETE.md` · Cập nhật: 2026-09-07.

> **Trạng thái:** Bản đặc tả để review trước khi triển khai. Ba file FATE là một bộ spec nền tảng;
> chưa được xem là đã triển khai runtime chỉ vì có mô tả trong tài liệu.

## 1. Mục đích và phạm vi

Mệnh Số là lớp tiến triển nằm giữa nhân vật, Con Đường và cơ duyên. Một Mệnh Số có thể:

- thay đổi chỉ số và điểm Mệnh Số của nhân vật;
- tạo tương hợp/tương khắc với Con Đường và các Mệnh Số khác;
- mở ra lựa chọn rủi ro–phần thưởng;
- được cất giữ để dùng trong tương lai nhưng không tác động khi chưa kích hoạt.

Spec này mô tả dữ liệu, luật tính, hành động, UI, giao dịch, lưu game, tiêu chí nghiệm thu và lộ trình. Các nhãn trong bảng đối chiếu:

| Nhãn | Ý nghĩa |
|---|---|
| **Đã có** | Runtime hiện tại đã đáp ứng đúng hoặc tương đương |
| **Có nhưng khác** | Đã có nền tảng nhưng khác thiết kế nguồn; cần quyết định/điều chỉnh |
| **Chưa có** | Chỉ là yêu cầu thiết kế hoặc roadmap |

## 2. Nguyên tắc thiết kế

1. **Mệnh đang kích hoạt mới có hiệu lực.** Mệnh trong Mệnh Kho chỉ là bộ sưu tập, không cộng chỉ số, điểm, tương hợp hay combo.
2. **Phẩm cấp không đồng nghĩa sức mạnh tuyệt đối.** Phẩm cấp quyết định độ hiếm, trần phát triển, độ phức tạp hiệu ứng, tiềm năng combo và giá trị; sức mạnh thực tế còn phụ thuộc tương hợp, trạng thái và quan hệ.
3. **Tương hợp là quan hệ với Con Đường**, không chỉ là một con số trang trí. Tương Sinh tạo lợi thế; Tương Khắc tạo chi phí/rủi ro; build ngoài đường vẫn có thể được trang bị.
4. **Cát/Hung là đánh đổi.** Cát không luôn luôn tốt và Hung không phải luôn luôn vô dụng; hiệu ứng phải thể hiện rõ phần thưởng và hệ quả.
5. **Hành động phải giải thích được kết quả.** Mọi nút trang bị, tháo, nâng cấp, dung luyện hoặc chuyển mệnh phải hiển thị điều kiện, thay đổi dự kiến và lý do bị chặn.
6. **Giao dịch nguyên tử.** Trừ tài nguyên, thay đổi kho/trang bị và ghi log phải cùng thành công hoặc cùng rollback.

## 3. Kiến trúc hệ thống

```text
Con Đường đã chọn
        │
        ├─ affinity / match score ─┐
        │                          ▼
Mệnh Số đang kích hoạt ─────► stats, fate score, relations, combo
        │
        └─ Mệnh Kho ─────────► lưu trữ / tiềm năng tương lai (không buff)
```

### 3.1. Khái niệm “đang kích hoạt”

Thiết kế nguồn dùng một Mệnh Số đang hoạt động. Runtime hiện tại dùng nhiều ô đang kích hoạt theo tiến trình (`state.player.fates` và số ô mở được). Quy tắc thống nhất:

- mọi Mệnh trong các ô đang kích hoạt đều được tính hiệu lực;
- mọi Mệnh trong `state.fateInventory` đều bị loại khỏi tính chỉ số/điểm/quan hệ;
- nếu sản phẩm quyết định quay về đúng một ô, phải migration bằng cách giữ Mệnh mạnh nhất/được chọn, đưa các ô còn lại vào Mệnh Kho; không tự động làm mất dữ liệu.

Khuyến nghị hiện tại: giữ mô hình nhiều ô vì phù hợp tiến trình đã có, nhưng áp dụng đầy đủ ngữ nghĩa active/vault của thiết kế nguồn cho từng ô.

## 4. Mô hình dữ liệu

### 4.0. Nguồn dữ liệu bắt buộc

| Nguồn | Vai trò | Quyết định canonical |
|---|---|---|
| `data/fate_data.js` / `window.FATE_DATA` | catalog 10.000 Mệnh | nguồn thật cho `id`, `name`, `sign`, `grade`, `score`, `effects`, `desc` |
| `data/fate_relationships.js` / `window.FATE_RELATIONSHIPS` | quan hệ Mệnh–Mệnh, combo, fusion | nguồn thật đã sinh từ `fate_data_10000` |
| `data/path_fate_relations.js` + `.json` | cầu nối Con Đường–Mệnh hiện có | dùng để đối chiếu/migrate, không tự ghi đè catalog |
| `fate-pool.json`, `fate-relationships.json` | bộ 1.300 Mệnh cũ | legacy, không đưa vào runtime mới |
| `generate_fate_pool.js` | generator cũ | legacy, không dùng để tái sinh dữ liệu canonical |

Đã loại ba file legacy khỏi runtime/repository sau khi kiểm tra import: `generate_fate_pool.js`,
`fate-pool.json`, `fate-relationships.json`. Save cũ không phụ thuộc trực tiếp các file này; generator
Node đã chuyển sang đọc `data/fate_data.js`. Các script tooling còn tham chiếu tên legacy không được chạy.

### 4.0.1. Chuẩn hóa schema bắt buộc

Engine phải là nơi duy nhất map schema; UI không tự map lại:

```js
const GRADE_TO_TIER = {
  phan: 1, linh: 2, hoang: 3, huyen: 4,
  dia: 5, thien: 6, thanh: 7, tien: 8
};
const SIGN_TO_TYPE_LABEL = {
  cat: "Cát Cách", binh: "Bình Cách", hung: "Hung Cách"
};
```

`grade ↔ tier` và `sign ↔ type` phải dùng hai bảng này khi tra `fate_relationships.js`. Mệnh Bình
không được bị loại chỉ vì bảng quan hệ hiện tại chủ yếu chứa Cát/Hung; khi không có cạnh quan hệ,
đó là “không có quan hệ”, không phải lỗi dữ liệu.

### 4.1. Định nghĩa Mệnh Số

```js
FateDefinition {
  id,
  name,
  grade,              // Phàm, Linh, Hoàng, Huyền, Địa, Thiên, Thánh, Tiên
  alignment,          // Cát, Hung, Bình hoặc mở rộng theo thiết kế
  element,
  path_affinity: {
    lead:    [pathId],
    support:  [pathId],
    forbidden: [pathId]
  },
  modifiers,           // chỉ số trực tiếp
  effects,             // hiệu ứng điều kiện
  passive,
  relationship,        // quan hệ với Mệnh khác/Con Đường
  potential,            // trần thức tỉnh, combo, biến đổi
  state                 // active, vault, pending, locked...
}
```

Mapping runtime hiện tại:

- danh mục mẫu: `data/fate_data.js` (`D().FATE_PATTERNS`);
- Mệnh đang kích hoạt: ID trong `state.player.fates`;
- Mệnh Kho: `state.fateInventory`;
- nâng cấp: `state.player.fateEnhancements`;
- phần thưởng chờ xử lý khi kho đầy: `state.pendingFateReward`/`state.pendingFateRewards`.

### 4.2. Dung lượng Mệnh Kho

`vaultCapacity = 2 × số ô Mệnh đang kích hoạt đã mở`. Runtime đã dùng công thức ổn định theo số ô mở, có tối thiểu 5 trong dữ liệu tiến trình hiện tại. Không được tăng/giảm dung lượng chỉ vì một lần render UI.

## 5. Phẩm cấp, thuộc tính và tương hợp

### 5.1. Thứ tự phẩm cấp

`Phàm → Linh → Hoàng → Huyền → Địa → Thiên → Thánh → Tiên`.

Phẩm cấp ảnh hưởng rarity, cap, độ phức tạp hiệu ứng, combo potential và giá trị trao đổi; không được dùng làm công thức cộng sức mạnh duy nhất.

### 5.2. Match score

Điểm tương hợp phải tách khỏi điểm sức mạnh:

- `match_score`: độ hợp với Con Đường;
- `normal_fate_score`: điểm Mệnh cơ bản sau hiệu ứng thường/nâng cấp;
- `total_fate_score`: điểm sau quan hệ, combo và hiệu ứng đặc biệt.

| Điểm | Nhãn hiển thị | Ý nghĩa |
|---:|---|---|
| 0 | Tuyệt Không | Build ngoài đường; cho phép trang bị, có bất lợi |
| 1–2 | Xa Lạ | Có thể dùng nhưng có phạt/rủi ro |
| 3–4 | Tương Hợp | Không có bonus lớn |
| 5–7 | Tương Hợp Cao | Bonus vừa |
| 8–9 | Tương Sinh | Bonus mạnh |
| 10 | Đại Đạo Tương Sinh | Ngưỡng tối đa, mở combo/hiệu ứng đặc biệt |

UI phải hiển thị cả số và nhãn. Giá trị nội bộ cần clamp về `0..10` trước khi hiển thị hoặc tính tier.

### 5.3. Luật Tương Sinh/Tương Khắc

- `match >= 8`: bonus tương sinh;
- `match 5..7`: bonus nhỏ;
- `match 3..4`: không bonus;
- `match 1..2`: penalty hoặc rủi ro;
- `match === 0`: vẫn cho trang bị, nhưng là off-build rõ ràng.

Quan hệ hiện tại giữa các Mệnh đang kích hoạt tiếp tục được tính riêng trong `computeRelationshipEffects`; quan hệ với Con Đường dùng `fateCompatibility`/`pathMatchSummary`.

## 6. Công thức điểm và hiệu lực

Mục tiêu chuẩn hóa:

```text
normal_fate_score = base(fate) + enhancement + normal effects
total_fate_score  = normal_fate_score
                 × path_multiplier(match tier)
                 × relationship_multiplier
                 × combo_multiplier
```

Runtime hiện tại đã có `computeFate`, `fateCompatibility` và hiệu ứng quan hệ, nhưng chưa chuẩn hóa đầy đủ các multiplier thành một API công khai duy nhất. Khi hoàn thiện, mọi UI và tooltip phải lấy cùng một kết quả từ engine, không tự tính lại.

`computeStats` chỉ áp dụng modifiers/effects của Mệnh đang kích hoạt. Mệnh Kho tuyệt đối không được đi qua pipeline này.

## 7. Quan hệ, dưỡng mệnh và cộng minh

### 7.1. Quan hệ nhân vật–Mệnh

Các bậc đề xuất:

| Bậc | Tên | Ý nghĩa |
|---:|---|---|
| 0 | Sơ Ngộ | mới nhận, hiệu ứng cơ bản |
| 1 | Đồng Hành | đã dùng qua thử thách |
| 2 | Tương Ứng | lựa chọn phù hợp tính cách/Con Đường |
| 3 | Cộng Minh | mở hiệu ứng hoặc combo nâng cao |
| 4 | Nhân Mệnh Hợp Nhất | trạng thái tối đa/thức tỉnh |

Quan hệ tăng qua hành vi và lựa chọn có liên quan, không dùng EXP thuần túy. Runtime hiện mới có quan hệ giữa các Mệnh đang kích hoạt; quan hệ nhân vật–Mệnh và bậc 0–4 là phần cần triển khai.

### 7.2. Combo

- combo đôi: 2 Mệnh có quan hệ tương sinh/điều kiện chung;
- combo ba: yêu cầu phẩm cấp, match tier hoặc quan hệ tối thiểu;
- combo phải ghi rõ điều kiện đang thiếu và hiệu ứng nhận được;
- combo chỉ xét Mệnh đang kích hoạt, không xét Mệnh Kho.

## 8. Hành động Mệnh Số

Action Bar phải là ngữ cảnh động, chỉ hiển thị hành động hợp lệ với Mệnh/slot/trạng thái hiện tại.

| Action | Điều kiện/kết quả | Trạng thái runtime |
|---|---|---|
| `EQUIP_FATE` | đưa Mệnh từ kho vào ô active; nếu đầy thì yêu cầu thay thế | **Đã có**: `equipFateFromVault`, preview thay thế |
| `UNEQUIP_FATE` | tháo khỏi active, chuyển vào kho | **Đã có**: `storeFateToVault` |
| `READ_FATE` / `QUAN_MENH` | xem giải thích, match, hiệu ứng, quan hệ | **Có nhưng khác**: modal đã có thông tin, chưa phải action chuẩn hóa |
| `CHANGE_FATE` | đổi Mệnh; phải hiển thị cost/cooldown/ảnh hưởng quan hệ | **Có nhưng khác**: swap có preview, chưa có cost/cooldown đầy đủ |
| `SACRIFICE_FATE` | tiêu hủy Mệnh, nhận tài nguyên/cơ hội; xác nhận bắt buộc | **Đã có**: có ứng viên và ảnh hưởng SAN |
| `FUSE_FATE` | dung hợp nguyên liệu, tạo Mệnh mới/tiềm năng | **Có nhưng khác**: `mergeFates` mới là merge kho tổng quát |
| `NURTURE_FATE` / `DUONG_MENH` | tăng quan hệ qua hành vi phù hợp | **Chưa có** |
| `RESONATE` / `CONG_MINH` | kiểm tra path + quan hệ + điều kiện để mở cộng minh | **Chưa có** |
| `DEFY_FATE` / `NGHICH_MENH` | phá lựa chọn định sẵn, giá phải trả lớn | **Chưa có** |
| `SUPPRESS_FATE` / `TRAN_MENH` | giảm/khóa tác động Hung hoặc hiệu ứng nguy hiểm | **Chưa có** |
| `HEAVENLY_OMEN` / `THIEN_CO` | xem tín hiệu tương lai, tiêu tài nguyên/cooldown | **Chưa có** |
| `FATE_TRANSFORM` / `MENH_DOI` | biến đổi theo quan hệ, phẩm cấp, vật liệu | **Chưa có** |

Mọi action phải trả về cấu trúc thống nhất:

```js
{ ok, action, preview, cost, warnings, blockers, changes, rollbackToken }
```

## 9. Giao dịch và rollback

Luồng bắt buộc:

1. kiểm tra state, ownership, capacity, cooldown và điều kiện path;
2. dựng preview: tài nguyên mất, Mệnh chuyển trạng thái, chỉ số trước/sau;
3. giữ snapshot tối thiểu của player, inventory, vault và log;
4. commit một lần;
5. nếu bất kỳ bước nào lỗi: rollback toàn bộ và trả blocker có thể đọc được;
6. ghi event/log sau commit thành công.

Áp dụng cho equip/swap, sacrifice, fusion, cauldron, market và các action Mệnh mới. Không trừ vật phẩm theo “số dòng”; luôn trừ theo `quantity` thực tế của stack.

## 10. Thu thập và phần thưởng

Nguồn Mệnh hợp lệ gồm:

- quà khởi đầu tương hợp với Con Đường;
- đột phá/cột mốc (có pity hoặc phần thưởng chắc chắn theo thiết kế);
- chiến đấu elite/boss;
- Search Chain/quest;
- thị trường, Khâm Thiên Giám và dung luyện.

Khi kho đầy, phần thưởng không được mất: đưa vào pending reward, cho phép chọn thay thế Mệnh trong kho hoặc bỏ qua có xác nhận. Runtime đã có cơ chế pending cho tình huống này.

## 11. UI/UX bắt buộc

### 11.1. Thẻ Mệnh đang kích hoạt

Hiển thị: tên, phẩm cấp, Cát/Hung, nguyên tố, match `x/10 + nhãn`, score trước/sau, hiệu ứng đang áp dụng, quan hệ, nâng cấp, tháo xuống và thay thế. Nút bị khóa phải có lý do ngay cạnh nút.

### 11.2. Thẻ Mệnh Kho

Luôn có nhãn rõ: **“Mệnh Kho · Không kích hoạt · Không cộng chỉ số”**. Có preview khi trang bị, thay thế hoặc hi sinh; hiển thị `Sở hữu · Đang kích hoạt · Trong Mệnh Kho`.

### 11.3. Modal xác nhận

Các thao tác mất Mệnh/tài nguyên phải có modal nêu: điều kiện, cost, thay đổi dự kiến, rủi ro, nút xác nhận/hủy. Không dùng thông báo thành công chung chung nếu không cho biết chỉ số đã đổi.

## 12. Lưu game và migration

Schema phải bảo toàn:

```js
player.fates[]
fateInventory[]
fateEnhancements{}
pendingFateRewards[]
```

Khi đọc save cũ:

- thiếu mảng thì khởi tạo rỗng;
- loại bỏ ID không tồn tại khỏi active/vault nhưng ghi warning;
- không làm mất Mệnh khi kho đầy;
- migration nhiều ô ↔ một ô phải có chiến lược rõ ràng, không âm thầm ghi đè.

## 13. Đối chiếu với code hiện tại

### 13.0. Gap dữ liệu trước khi triển khai

Catalog thật hiện chưa có `element`, `path_affinity`, `passive` và `potential` dạng trực tiếp.
Đây là gap dữ liệu/schema, không được che bằng giá trị suy đoán ở UI:

- `element`: sinh offline từ `desc` theo bộ từ khóa Ngũ Hành, fallback `vo_he`, sau đó review mẫu;
- `path_affinity`: sinh `lead`/`support` từ chủ đề Con Đường; bản đầu để `forbidden` rỗng, chỉ bổ sung
  khi có bộ phản đề được review;
- `passive`: tạm coi các modifier đang active là hiệu lực nền; hiệu ứng điều kiện vẫn tách bằng
  `splitFateEffects()`;
- `potential`: tra chuẩn hóa từ `combo_sets`/`fusion_recipes`, không nhân bản vào 10.000 entry.

Không chạy Phase 1 mới dựa trên `path_affinity` cho đến khi pass dữ liệu này được kiểm tra.

| Khu vực | Runtime hiện tại | Khoảng cách cần xử lý |
|---|---|---|
| Active/vault | Có active nhiều ô và vault riêng | khác mô hình “1 active” nguồn; giữ nhiều ô theo quyết định hiện tại |
| Vault không buff | Đã tách khỏi tính stats | giữ regression test |
| Capacity | Đã ổn định theo số ô mở, công thức 2× | bổ sung hiển thị công thức nếu cần |
| Match | Có `fateCompatibility`, summary | chuẩn hóa clamp 0–10 và tier label |
| Score | Có normal/total/effective trong `computeFate` | hợp nhất multiplier path/relationship/combo |
| Quan hệ active-active | Có `computeRelationshipEffects` | bổ sung quan hệ nhân vật–Mệnh và stage |
| Trang bị/tháo/thay thế | Đã có preview, blocker và transaction | chuẩn hóa action result/API |
| Nâng cấp | Có material chooser, level và effect scaling | bổ sung log before/after rõ ràng |
| Merge/fusion | Có merge kho tổng quát | chưa phải fusion/transform theo tiềm năng |
| Sacrifice | Có ứng viên, cost và xác nhận | bổ sung hệ quả quan hệ/omen theo spec |
| Pending reward | Đã có khi kho đầy | thêm UI thống nhất cho mọi nguồn reward |
| Quan Mệnh/Dưỡng Mệnh/Cộng Minh | Chưa có action riêng | Phase 2 |
| Nghịch Mệnh/Trấn Mệnh/Thiên Cơ/Mệnh Đổi | Chưa có | Phase 3 |
| Dynamic Action Bar | Có action contextual tổng quát | thêm taxonomy action Mệnh và blocker chuẩn |
| Transaction/rollback | Có ở các flow chính | áp dụng thống nhất cho action tương lai |

## 14. Lộ trình triển khai

### Gate 0 — dữ liệu và schema (bắt buộc trước Phase 1)

1. Đóng băng nguồn thật và đánh dấu legacy.
2. Thêm map grade/tier và sign/type trong engine.
3. Sinh/review `element` và `path_affinity` tĩnh.
4. Thêm `splitFateEffects`, tra combo/fusion và kiểm tra Mệnh Bình.
5. Chạy regression: 10.000 catalog, 13.976 quan hệ, 150 combo, 78 fusion không mất ID.

### Phase 1 — nền tảng

Equip, Unequip, Change, Read/Quan Mệnh, Sacrifice; hoàn thiện preview, blocker, capacity, pending reward và test active/vault không bị lẫn.

### Phase 2 — quan hệ

Resonance/Cộng Minh, quan hệ 0–4, Dưỡng Mệnh theo hành vi, combo đôi/ba, thức tỉnh và multiplier thống nhất.

### Phase 3 — vận mệnh nâng cao

Defy Fate, Suppress Fate, Heavenly Omen, Fate Transformation, fusion theo tiềm năng, cooldown/cost và các hệ quả dài hạn.

## 15. Tiêu chí nghiệm thu

- Không file runtime nào đọc trực tiếp tier/type mà bỏ qua map canonical.
- Không dùng `fate-pool.json` hoặc `fate-relationships.json` legacy làm nguồn phần thưởng mới.
- Catalog sau Gate 0 vẫn đủ 10.000 ID và quan hệ không trỏ tới ID không tồn tại.

- Mệnh Kho không làm thay đổi stats, score, path match hoặc combo.
- Trang bị Mệnh luôn có preview trước/sau; nếu đầy phải cho thay thế hoặc báo rõ blocker.
- `match_score` hiển thị đúng tier; điểm 0 vẫn có thể trang bị theo luật off-build.
- Không có thao tác nào làm mất Mệnh do kho đầy; reward được pending.
- Nâng cấp thể hiện level, vật liệu đã trừ và hiệu ứng trước/sau.
- Mọi stack vật phẩm được xử lý theo quantity.
- Action nguy hiểm có xác nhận và rollback khi lỗi.
- Save/load giữ nguyên active, vault, enhancement và pending reward.
- Mọi action nâng cao chưa triển khai phải hiển thị là chưa khả dụng, không giả vờ thành công.

## 16. Tham chiếu triển khai hiện tại

- Engine: `js/engine.js`
- UI: `js/ui.js`
- Main flow: `js/main.js`
- Fate data: `data/fate_data.js`
- Dữ liệu nền: `data/data.js`
- Kiểm thử: `tools/verify_game.js`
- Thiết kế nguồn: `New Text Document.txt`

## Phụ lục A — Quan hệ Mệnh chi tiết (hợp nhất từ FATE_RELATIONSHIP_COMPLETE)

### A.1. Phân tầng năng lực

| Quan hệ | Nguồn/trạng thái |
|---|---|
| Mệnh ↔ Mệnh | `window.FATE_RELATIONSHIPS.pairwise_relationships` — 13.976 cạnh |
| Combo 2/3 Mệnh | `combo_sets` — 150 bộ |
| Dung hợp Mệnh | `fusion_recipes` — 78 công thức |
| Nhân vật ↔ Mệnh | instance sở hữu, stage 0–4; cần lưu riêng |
| Dưỡng Mệnh/Cộng Minh | action engine đã có nền tảng, cần cân bằng và mở rộng |

Instance sở hữu dùng schema:

```js
player.fateRelationships[fateId] = {
  stage: 0, points: 0, eliteTrials: 0, alignedChoices: 0,
  resonanceUnlocked: false, lastNurtureTurn: 0
}
```

Stage: `0 Sơ Ngộ → 1 Đồng Hành → 2 Tương Ứng → 3 Cộng Minh → 4 Nhân Mệnh Hợp Nhất`.

Điều kiện mục tiêu:

- 0→1: active qua elite/boss hoặc chuỗi hoạt động tương đương;
- 1→2: tối thiểu 3 lựa chọn quest/hội thoại cùng alignment;
- 2→3: bắt buộc action `RESONATE`, match ≥ 8 và đủ SAN;
- 3→4: Cộng Minh + đột phá thành công khi Mệnh vẫn active.

Hiệu lực quan hệ: stage 0 = 0%, stage 1 = +5%, stage 2 = +10%, stage 3 = +20%, stage 4 = +35%
trên modifier dương. Stage 4 là lựa chọn cam kết; việc khóa tháo/hi sinh cần UI xác nhận riêng trước
khi bật production. Chưa áp dụng suy giảm stage do nằm trong Mệnh Kho 30 ngày.

`NURTURE_FATE` chỉ nhận Mệnh active, tốn Linh Thạch tăng theo stage và có diminishing return. Runtime
hiện dùng cost nền `5 + stage × 5`, tăng điểm quan hệ có kiểm soát và ghi lịch sử. `RESONATE` yêu cầu
stage 2, match ≥ 8, SAN ≥ 10; chỉ trừ SAN sau khi mọi điều kiện đã hợp lệ.

Combo mới có thể thêm `minRelationshipStageRequired`; 150 combo hiện tại giữ nguyên hành vi khi field
này null.

### A.2. Phase 3 (chưa bật production)

`DEFY_FATE`, `SUPPRESS_FATE`, `HEAVENLY_OMEN`, `FATE_TRANSFORM` cần cost, cooldown, preview và
rollback riêng. Không giả lập thành công trong UI khi chưa có recipe/hiệu ứng dữ liệu.

## Phụ lục B — Schema/data gap và kế hoạch Gate 0 (hợp nhất từ FATE_SYSTEM_COMPLETE)

Catalog 10.000 entry hiện có `id`, `name`, `sign`, `grade`, `gradeLabel`, `score`, `effects`, `desc`.
Engine đã cung cấp adapter runtime:

- `fateDefinition()` — trả schema canonical, gồm `alignment`, `tier`, `element`, `path_affinity`;
- `splitFateEffects()` — tách modifier trực tiếp và conditional effects;
- `fateRelationshipsFor()`, `fateCombosFor()`, `fateFusionRecipesFor()` — tra dữ liệu normalized;
- `GRADE_TO_TIER`, `SIGN_TO_TYPE_LABEL` — map duy nhất cho toàn codebase.

`element` được suy luận an toàn từ tên/mô tả, fallback `vo_he`. `path_affinity` được suy luận từ bộ
keyword Con Đường hiện có; `forbidden` chỉ lấy khi keyword phản đề thực sự xuất hiện, không suy ra
chỉ vì thiếu match. Khi cần độ chính xác production, có thể materialize kết quả thành data tĩnh sau
review mẫu; không được để UI tự suy luận khác engine.

Legacy không phải nguồn runtime mới; ba file nêu trên đã được xóa khỏi pipeline. Mọi tooling còn tham
chiếu tên cũ phải được dọn riêng trước khi dùng lại.

## Phụ lục C — API/action đã áp dụng

Runtime đã có các action nền: equip, unequip, swap preview, upgrade preview/commit, sacrifice,
merge, pending reward và vault capacity. Bổ sung theo spec này: chuẩn hóa schema adapter, match clamp
0–10, trạng thái quan hệ theo instance, `nurtureFate`, `resonateFate`, cùng nút UI Dưỡng Mệnh/Cộng Minh.

Mọi action mới vẫn phải trả blocker đọc được, preview cost/thay đổi và rollback nếu commit thất bại.
