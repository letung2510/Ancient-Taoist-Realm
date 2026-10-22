# Cross-system — Khế ước, bắt sống, thẩm vấn, tình báo (SYS-05)

## Mục đích

Bảng khế ước theo vùng, bắt sống mục tiêu thay vì giết, thẩm vấn ra tin tình báo (có thể sai), chợ tình báo và thân phận giả/phản gián.

## Dữ liệu & trạng thái

```js
ContractInstance { id, templateId, issuerFactionId, targetEntityId, regionId, generatedDay,
  expiresDay, seed, status, objectives: [], allowedOutcomes: [], rewardTableId, acceptedAtDay }
prisoners[id] = { entityId, capturedDay, locationId, resolveByDay, resistance, intelPoolId, status }
IntelRecord { id, topicType, targetId, claim, confidence /* 0..1 */, truthKey, sourceId,
  acquiredDay, expiresDay, verified }
coverIdentity = { id, targetFactionId, alias, quality, suspicion, createdDay,
  status: "active"|"burned"|"retired" }
```

## Rules

| ID | Rule |
|---|---|
| CSX-INT-001 | Bảng khế ước refresh theo GameClock, tối đa 3 offer/vùng; template: truy săn, điều tra, bắt sống, hộ tống, thu hồi. Phần thưởng cố định từ seed lúc sinh, không reroll khi mở UI. |
| CSX-INT-002 | Action Chế Ngự xuất hiện khi mục tiêu `capturable: true`, HP ≤ 25%, người chơi không mất trí và có dây/ấn phù hợp. Check dùng PHY hoặc MAG theo dụng cụ, chênh cảnh giới và trạng thái mục tiêu. Boss/thần/NPC trọng yếu mặc định không bắt được trừ khi template override. |
| CSX-INT-003 | Bắt thành công gọi `endCombat` với outcome `captured`; không nhận đồng thời loot giết đầy đủ. |
| CSX-INT-004 | Thẩm vấn ba cách: thuyết phục (trust/reputation/comprehension, không Tà Nhiễm); uy hiếp (fear/PHY, tăng suspicion/tiếng xấu); tà thuật (MAG + Tà Nhiễm, tốn SAN, tăng Tà Nhiễm, phải xác nhận). Kết quả là `IntelRecord`, không trả raw secret state. Sau đó chọn thả, giao tông môn hoặc xử tử, mỗi lựa chọn có hậu quả. Chi phí/thưởng atomic. |
| CSX-INT-005 | Tin sai chỉ sai ở `claim`; `truthKey` dùng nội bộ, không render; tin sai không đổi sự thật thế giới. Mua/bán qua chợ tình báo; quẻ/Tướng Sư/điều tra tăng confidence hoặc xác minh. |
| CSX-INT-006 | Tối đa một thân phận giả active. Phát hiện dựa trên quality, danh tiếng thật, tag mâu thuẫn và phản gián của thế lực; bị lộ không luôn combat — bảng kết quả gồm cảnh cáo, trục xuất, truy sát hoặc combat tùy node. Phản gián sinh tù nhân/khế ước và manh mối thế lực nguồn. Thân phận giả không cho gia nhập hai tông môn thật hay giữ vĩnh viễn Công Pháp đặc trưng của phe giả. |

## Acceptance

- Bắt sống không đồng thời nhận loot giết; thẩm vấn nguy hiểm có xác nhận; tin sai không đổi world truth.
- Gate: `verify_review_batches.js`, `verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-INT-001 | expansion.js:`contractBoard`; i18n.js:`CONTRACTS` | Khớp |
| CSX-INT-002/003 | expansion.js: `capturable`, `prisoners` | Khớp |
| CSX-INT-005 | expansion.js: `truthKey`, `intel` | Khớp |
| CSX-INT-006 | expansion.js:`coverIdentity` (`burned`) | Khớp |
