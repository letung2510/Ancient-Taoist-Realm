# THIẾT KẾ NEO NHÂN TÍNH · NHÂN DUYÊN → NGHI THỨC ĐỘT PHÁ

> Tài liệu thiết kế trước triển khai runtime. Mục tiêu là biến Neo Nhân Tính thành một mối quan hệ có ý nghĩa, có lựa chọn và có rủi ro; không phải một vật phẩm được engine tự sinh.

## 1. Kết luận thiết kế

Neo Nhân Tính nên được tạo từ một NPC đã hình thành **Nhân Duyên** với nhân vật. Người chơi không “nhặt Neo” trên bản đồ. Người chơi gặp một người, xây dựng quan hệ, chọn cách gắn bó, rồi mời người đó làm điểm neo trong nghi thức đột phá.

Tặng quà chỉ là một phương án tăng thiện cảm. Quà không được tự động biến thành Neo; Neo cần một lời thỉnh cầu và một nghi thức xác nhận giữa hai bên.

## 2. Vấn đề của logic hiện tại

Runtime hiện có `state.relationships[npcId]` với `trust`, `respect`, `fear`, `suspicion`, nhưng mới chủ yếu tăng `trust` khi nói chuyện. Bước Dựng Neo lại tự tạo `Neo nơi sinh thành` độ ổn định 30 nếu chưa có Neo.

Điều này tạo ba lỗi trải nghiệm:

1. Người chơi không biết phải xây dựng quan hệ với ai.
2. Tặng quà chưa có ngữ cảnh, giới hạn hoặc hậu quả.
3. Một số cảnh giới yêu cầu Neo ổn định 50/75 nhưng không có đường chơi rõ ràng để đạt mức đó.

Tài liệu này đề xuất bỏ Neo tự sinh trong runtime mới. Save cũ có Neo tự sinh được giữ lại như `legacy_anchor`, nhưng không được dùng làm mẫu cho Neo mới.

## 3. Mô hình dữ liệu

### 3.1. Quan hệ NPC

```js
state.relationships[npcId] = {
  trust: 0,             // 0–100: tin tưởng
  respect: 0,           // 0–100: kính trọng
  fear: 0,              // 0–100: sợ hãi; cao không đồng nghĩa đủ điều kiện
  suspicion: 0,         // 0–100: nghi ngờ
  affinity: 0,          // 0–100: mức đồng điệu để làm Neo
  stage: "陌生|quen_biet|tin_cay|dong_hanh|sinh_tu",
  metCount: 0,
  sharedQuests: 0,
  gifts: { total: 0, lastTurn: 0, byItem: {} },
  anchor: null          // { status, stability, type, formedAt, lastNurturedAt }
};
```

`stage` không thay thế các chỉ số cũ; nó là nhãn UI được suy ra từ điểm và lịch sử. `fear` hoặc `suspicion` cao phải làm giảm khả năng nhận lời.

### 3.2. Neo trong nhân vật

```js
player.anchors = [{
  id: "anchor_npc_<npcId>",
  npcId: "su_phu",
  name: "Lạc Trần Tử",
  type: "su_phu|tri_ky|dong_hanh|gia_dinh|the_luc",
  stability: 0,
  maxStability: 100,
  status: "active|strained|broken",
  source: "npc_relationship",
  formedAt: gameClock,
  lastEventAt: gameClock
}];
```

Neo phải tham chiếu `npcId`. Không lưu Neo chỉ bằng tên hiển thị vì NPC có thể đổi trạng thái, phe phái hoặc chết.

## 4. Điều kiện chọn NPC làm Neo

NPC được chọn phải thỏa tất cả điều kiện:

- Là NPC nhân tộc hoặc nhân vật có nhận thức nhân tính rõ ràng; không phải quái, Dị Sĩ thuần sự kiện hoặc thực thể thần tính.
- Người chơi đã gặp NPC ít nhất một lần và NPC hiện còn tồn tại.
- `trust >= 55`, `respect >= 35`, `suspicion <= 35`, `fear <= 50`.
- Đã có ít nhất một tương tác có ý nghĩa: hoàn thành quest chung, cứu NPC, nhận truyền thừa, hoặc đối thoại đặc biệt. Nói chuyện lặp lại không đủ.
- NPC không thù địch với người chơi và không bị cờ phản bội/không thể tiếp cận.
- Không vượt quá số Neo đang hoạt động cho phép.

Ngưỡng đề xuất theo loại quan hệ:

| Loại Neo | Điều kiện chính | Độ ổn định ban đầu |
|---|---|---:|
| Người dẫn đạo / sư phụ | Quest hoặc truyền thừa chung, trust 60, respect 50 | 45 |
| Tri kỷ | affinity 70, trust 70, một lựa chọn đồng sinh cộng tử | 50 |
| Đồng hành | sharedQuests ≥ 2, trust 60, respect 40 | 40 |
| Gia đình / huyết thân | cờ nguồn gốc hoặc quest huyết mạch | 55 |
| Thế lực / tông môn | danh vọng đủ, có người bảo chứng, không phải Neo cá nhân | 35 |

`stability` ban đầu chỉ là nền. Cảnh giới yêu cầu 50 hoặc 75 vẫn cần người chơi nuôi dưỡng Neo sau khi hình thành.

## 5. Luồng người chơi

### Bước A · Gặp và xây dựng Nhân Duyên

Người chơi gặp NPC tại node, thành hoặc tông môn. Action bar có `Nói Chuyện`, `Giúp Đỡ`, `Nhận Nhiệm Vụ`, `Tặng Quà` hoặc `Bảo Hộ` tùy NPC.

### Bước B · Tặng quà trong options Nhân Duyên

Trong tab **Nhân Duyên**, mỗi NPC đủ điều kiện hiển thị nút **Tương tác**. Modal này có:

- Tặng quà.
- Hỏi thăm / chia sẻ tâm sự.
- Giúp NPC hoàn thành việc riêng.
- Mời đồng hành hoặc bảo hộ.
- `Thỉnh làm Neo Nhân Tính` nếu đã đủ điều kiện.

Quà phải có tag phù hợp với NPC: sách cho học giả, linh dược cho người bị thương, vật phẩm vùng biển cho thủy thủ, chiến lợi phẩm đúng phe cho tu sĩ chiến đấu. Quà sai tag vẫn có thể tặng nhưng tăng rất ít hoặc tăng nghi ngờ.

Quà không được là cách mua quan hệ vô hạn:

- Có cooldown theo NPC và theo game day.
- Mỗi ngày chỉ tính một lượng điểm hữu hạn.
- Quà cùng loại liên tiếp bị giảm hiệu quả.
- Quà quý có thể tăng mạnh nhưng tạo nghĩa vụ, nợ ân hoặc cờ lòng tham.
- Quà nhiệm vụ, vật đang trang bị và vật phẩm khóa không được dùng.

### Bước C · Thỉnh Neo

Khi đủ điều kiện, nút **Thỉnh làm Neo Nhân Tính** mở xác nhận hai chiều:

1. Hiển thị NPC, quan hệ hiện tại, loại Neo, độ ổn định ban đầu.
2. Hiển thị lợi ích và rủi ro: mất NPC, phản bội, xung đột phe phái, giới hạn số Neo.
3. Người chơi xác nhận.
4. NPC roll phản hồi dựa trên trust, respect, suspicion, cờ quest và trạng thái thế giới.
5. Nếu đồng ý, tạo anchor `active`; nếu từ chối, tăng cooldown và có thể giảm trust.

### Bước D · Dựng Neo trong nghi thức

Trong modal **Nghi Thức Đột Phá**, cổng `Dựng Neo` không tự sinh Neo. Nó mở danh sách các NPC đã được thỉnh thành Neo và cho chọn một Neo cụ thể.

Nếu chưa có NPC đủ điều kiện, modal phải nói rõ:

> Chưa có Neo Nhân Tính. Hãy mở tab Nhân Duyên, xây dựng quan hệ với một NPC phù hợp rồi quay lại nghi thức.

Sau khi chọn, Neo được “đặt vào nghi thức”, không bị xóa khỏi quan hệ. Bước này chỉ hoàn tất khi độ ổn định đạt ngưỡng của cảnh giới.

## 6. Tăng độ ổn định Neo

Độ ổn định tăng từ hành động có ý nghĩa, không chỉ bằng tiền:

| Hành động | Tác động đề xuất |
|---|---:|
| Hoàn thành quest chung | +8 đến +15 |
| Bảo vệ NPC qua một biến cố | +10 đến +20 |
| Tặng quà đúng tag, trong cooldown | +2 đến +6 |
| Đối thoại đúng lựa chọn cốt lõi | +3 đến +8 |
| Cùng chiến đấu và sống sót | +5 đến +12 |
| Bỏ rơi lời hứa / phản bội | -10 đến -30 |
| NPC bị thương, mất tích hoặc đổi phe | -5 đến -25 |

Mỗi lần tăng phải ghi lịch sử và hiển thị banner. Người chơi luôn thấy `ổn định hiện tại / ngưỡng cần`.

## 7. Số lượng Neo và rủi ro

- Có thể có tối đa 3 Neo đã hình thành.
- Chỉ 1 Neo được chọn làm **Neo chủ đạo** cho một nghi thức.
- Các Neo còn lại là Neo phụ, dùng để giảm rủi ro hoặc mở lựa chọn khác nhưng không cộng dồn vô hạn.
- Nếu NPC chết, phản bội hoặc bị mất khỏi thế giới, Neo chuyển `strained` hoặc `broken`; không được âm thầm xóa.
- Neo broken vẫn lưu lịch sử và có thể tạo quest hàn gắn, trả giá hoặc thay thế.

## 8. Đồng bộ với điều kiện cảnh giới

Ritual plan phải sinh theo dữ liệu cảnh giới, không theo số cấp hardcode:

```js
if (next.requiresActiveAnchor || next.requiresStableAnchor || next.requiresHighAnchor) {
  plan.push("anchor");
}
```

Nếu một cảnh giới yêu cầu Neo ổn định 50 thì bước `Dựng Neo` phải xuất hiện trước khi engine kiểm tra điều kiện đó. Không được để người chơi thấy “Neo 30/50” nhưng không có action tăng hoặc chọn Neo.

Các mức đề xuất:

- `requiresActiveAnchor`: một Neo active, ổn định >0.
- `requiresStableAnchor`: Neo chủ đạo ổn định ≥50.
- `requiresHighAnchor`: Neo chủ đạo ổn định ≥75 và có loại Neo phù hợp.

## 9. UI bắt buộc

Tab Nhân Duyên phải hiển thị:

- NPC, nơi gặp gần nhất, phe phái.
- Trust / Respect / Affinity / Suspicion.
- Stage quan hệ.
- Quest hoặc hành động còn thiếu để được thỉnh Neo.
- Nút Tặng Quà với danh sách vật phẩm hợp lệ và lý do bị khóa.
- Nút Thỉnh làm Neo khi đủ điều kiện.
- Neo hiện có, độ ổn định và cảnh giới đang yêu cầu.

Modal Dựng Neo phải có nút `Mở Nhân Duyên` để người chơi đi thẳng tới danh sách NPC, thay vì chỉ báo lỗi.

## 10. Quyết định cần chốt trước khi code

Đề xuất chốt theo hướng sau:

1. Neo là quan hệ với NPC, không phải vật phẩm.
2. Tặng quà là một nhánh trong Nhân Duyên, có tag, cooldown và diminishing return.
3. Thỉnh Neo là lựa chọn có phản hồi từ NPC, không auto-success.
4. Một nhân vật có tối đa 3 Neo, mỗi nghi thức chọn 1 Neo chủ đạo.
5. Độ ổn định tăng chủ yếu từ quest, bảo hộ và lựa chọn; quà chỉ là hỗ trợ.
6. Nghi thức lấy yêu cầu từ schema cảnh giới để tự chèn cổng Neo đúng lúc.
7. Mọi thiếu điều kiện phải dẫn được người chơi tới tab hoặc node cần thiết.

## 11. Tiêu chí nghiệm thu

- Người chơi mới xem điều kiện Neo có thể mở Nhân Duyên và biết chính xác cần làm gì.
- Có thể gặp NPC ở nhiều vùng; Vô Tận Hải có ít nhất một NPC nhân tộc tại hải cảng.
- Không thể tạo Neo bằng cách bấm nghi thức khi chưa có quan hệ phù hợp.
- Có thể tạo Neo, tăng ổn định và đạt ngưỡng 50/75 bằng gameplay.
- Dựng Neo không tự sinh `Neo nơi sinh thành` không có nguồn.
- Save/load giữ nguyên `npcId`, stage, cooldown, stability và trạng thái broken.
- Các hệ thống Mệnh Số, chiến đấu, tìm kiếm và bế quan không bị thay đổi ngoài phần tích hợp được ghi rõ.

## 12. NPC ngẫu nhiên, thương nhân và tính bền vững của Nhân Duyên

Không phải NPC nào xuất hiện trên bản đồ cũng được phép trở thành Neo. Runtime cần phân biệt **loại xuất hiện** và **danh tính bền vững**.

### 12.1. Ba lớp NPC

| Lớp | Ví dụ | Có thể làm Neo? | Cách lưu |
|---|---|---:|---|
| `persistent_named` | Sư phụ, trưởng lão, Tạ Hải Sinh | Có | `npcId` cố định trong `data/data.js` |
| `bondable_encounter` | Lữ khách cứu được, thương nhân có tuyến truyện riêng | Có, sau khi neo danh tính | `instanceId` cố định + hồ sơ quan hệ |
| `transactional_ephemeral` | Thương nhân random chỉ mở shop, người qua đường | Không | Chỉ lưu lịch sử giao dịch/cooldown ngắn |

NPC random ban đầu phải là `transactional_ephemeral` hoặc `bondable_encounter` tùy data. Không được suy luận “đã nói chuyện một lần” là đủ để tạo quan hệ.

### 12.2. Danh tính của NPC random

Mỗi encounter random cần có khóa ổn định:

```js
{
  entityId: "merchant_random",
  instanceId: "merchant_random:<worldSeed>:<nodeId>:<spawnSeed>",
  persistence: "transactional_ephemeral|bondable_encounter",
  roleTags: ["merchant", "human", "anchor_candidate"],
  homeLocationId: null,
  expiresAt: gameClock
}
```

Nếu chỉ có `merchant_random` mà không có `instanceId`, các lần gặp sau sẽ bị gộp nhầm thành cùng một người. Nếu NPC có tuyến quan hệ, lần đầu người chơi chọn **Ghi nhớ danh tính** hoặc hoàn thành quest riêng sẽ chuyển hồ sơ sang `state.relationships[instanceId]` và lưu vĩnh viễn.

### 12.3. Thương nhân thường không phải Neo

Thương nhân xuất hiện để giao dịch nên ưu tiên:

- hàng hóa, giá, chiết khấu, nợ giao dịch;
- mở lại shop theo lịch hoặc tuyến đường;
- không tăng Trust/Neo chỉ vì mua nhiều đồ;
- quà tặng chỉ ảnh hưởng thái độ thương mại, không tự biến thành quan hệ nhân sinh.

Một thương nhân chỉ được làm Neo nếu data có `persistence: "bondable_encounter"`, `roleTags` chứa `human` và `anchor_candidate`, đồng thời có ít nhất một quest hoặc biến cố chung. Khi đó người chơi phải hoàn tất bước **Ghi nhớ danh tính** trước khi thấy nút **Thỉnh làm Neo**.

### 12.4. Hai loại quà cho thương nhân

Tách rõ hai action để tránh người chơi hiểu sai:

- **Quà giao thương**: tăng ưu đãi, mở hàng, giảm giá; dùng cho mọi merchant.
- **Quà nhân duyên**: chỉ xuất hiện với merchant `bondable_encounter`, tăng affinity/trust và chịu cooldown; có thể mở quest cá nhân.

Một merchant không có tuyến cá nhân sẽ không hiển thị nút Quà Nhân Duyên hoặc Thỉnh Neo, dù người chơi đã mua hàng nhiều lần.

### 12.5. Khi NPC random rời bản đồ

- `transactional_ephemeral`: giữ lại giao dịch, giá, cooldown; không giữ quan hệ Neo.
- `bondable_encounter` chưa được ghi nhớ: quan hệ hết hạn theo `expiresAt` và UI báo “đã mất dấu”.
- `bondable_encounter` đã được ghi nhớ: NPC chuyển thành nhân vật persistent, có `homeLocationId`, lịch tái xuất hiện hoặc quest tìm lại.
- NPC đã là Neo không được biến mất âm thầm; nếu chết, phản bội hoặc mất liên lạc phải chuyển `strained/broken` và tạo hậu quả/quest.

### 12.6. Nguyên tắc cho các NPC đặc biệt

Nghịch Thương Nhân, merchant chợ đen và các NPC chỉ mở modal giao dịch mặc định là `transactional_ephemeral`. Chúng không thể làm Neo để tránh việc người chơi farm encounter hoặc mua bán để đạt điều kiện đột phá.

NPC như Tạ Hải Sinh ở Lưu Vân Hải Cảng là `persistent_named`, nên có thể xây dựng Nhân Duyên và làm Neo nếu đủ điều kiện. Một merchant có thể được nâng từ random lên nhân vật dài hạn, nhưng phải là quyết định rõ ràng của data và quest, không phải hành vi tự động của engine.
