# Mô phỏng thế giới — Phiên Thám Hiểm

## Mục đích

Thay nút "Tìm kiếm" một lần bằng phiên Thám Hiểm có chuẩn bị, dò tìm, phân loại phát hiện, xử lý và hậu quả; chịu tác động của thời tiết, influence, NPC hiện diện và fog.

## Dữ liệu & trạng thái

```js
state.searchSites[nodeId] = { depth: 5, maxDepth: 5, sessions, chainStage /*0..3*/, recoverAtTurn, lastSearchedTurn, secretLocationId }
state.pendingExploration = { locationId, nodeId, session, findings: [{ type, label, … }], risk, weather, npcAssistId, createdTurn, expiresTurn }
// state.pendingSearch là alias tương thích ngược, luôn đồng bộ với pendingExploration
```

## Rules

### Vòng đời phiên

| ID | Rule |
|---|---|
| WSIM-XPL-001 | Chuẩn bị: từ chối khi đang giao chiến, đang có hành trình `planned/active`, thời tiết chặn hoạt động, còn pending chưa xử lý, node không tìm được hoặc độ sâu đã cạn (báo số lượt hồi phục). Cần ≥ 5 Thể Lực; trừ 5 khi bắt đầu. |
| WSIM-XPL-002 | Dò tìm: nhiều lượt theo depth; kết quả chịu ảnh hưởng MAG, Ngộ Tính, May Mắn, nghề, thời tiết, địa hình, influence và nguy hiểm node; RNG replay theo `search:<node>:<turn>`. |
| WSIM-XPL-003 | Phân loại phát hiện: tài nguyên thường; tài nguyên hiếm/vật phẩm sinh ngẫu nhiên; dấu vết thông tin mở chuỗi; gặp NPC hoặc phục kích; công trình/đường tắt/mật địa. |
| WSIM-XPL-004 | Tài nguyên thường và vật phẩm hiếm tự nhập kho ngay khi phiên xác nhận phát hiện; bản ghi giữ lại để trace (phẩm cấp, nguồn, ngày, node nguồn). Người chơi chỉ quyết định với dấu vết/cơ duyên. |
| WSIM-XPL-005 | Mỗi phiên không bị gián đoạn luôn có phần thưởng nền nhỏ (Linh Thạch hoặc tài nguyên node). |
| WSIM-XPL-006 | Pending phải được xử lý (Thu Thập / Điều Tra / Nhờ NPC Dẫn Dấu / Bỏ Qua) trước phiên kế tiếp. Rời node khi còn pending → pending thất lạc, không tạo vật phẩm. |

### Xử lý phát hiện

| ID | Rule |
|---|---|
| WSIM-XPL-010 | Thu Thập: xử lý phát hiện đặc biệt chưa tự thu gom (tương thích save cũ); idempotent theo `session`/`findingId`, không nhận hai lần, tài nguyên đã tự thu không tạo nút nhận lần hai. |
| WSIM-XPL-011 | Điều Tra: tăng `chainStage` (tối đa 3); stage 2 có thể mở mật địa (`secretLocationId`); stage 1–3 mở thưởng riêng: vật phẩm, Công Đức, Mảnh Sử hoặc node runtime/quest chuỗi. |
| WSIM-XPL-012 | Nhờ NPC Dẫn Dấu: cần NPC hiện diện cùng node; gán `npcAssistId`, giảm risk 15, ghi sự kiện quan hệ `shared_reward` (key `search-assist:<session>`), rồi điều tra. NPC vắng mặt → từ chối. |
| WSIM-XPL-013 | Bỏ Qua: xóa phát hiện, ghi nhận cơ hội thất lạc, không nhận thưởng. |
| WSIM-XPL-014 | Mọi lựa chọn trả `{ success, reason, data }`, có idempotency key và ghi log gồm node, vùng, thời tiết, NPC liên quan và phần thưởng thực nhận. |

### Tác động thế giới

| ID | Rule |
|---|---|
| WSIM-XPL-020 | NPC cùng node/sub-location có thể là người dẫn đường, kẻ tranh đoạt, người trao đổi hoặc nhân chứng. |
| WSIM-XPL-021 | Thời tiết: Mưa/Sương giảm hiệu quả dò; Tuyết tăng chi phí thời gian; Linh Phong có thể khóa Ngự Khí; Âm Vũ tăng nguy cơ phục kích nhưng tăng cơ hội dấu vết tà đạo. Giá trị lấy từ [weather](../weather/README.md) và `getWorldModifiers`. |
| WSIM-XPL-022 | Influence `stable`/`contested`/`frontier` điều chỉnh bảng tài nguyên và tỉ lệ gặp tuần tra thế lực. |
| WSIM-XPL-023 | Fog thấp chỉ cho tin đồn; chi tiết phát hiện và NPC hiện diện chỉ hiển thị khi đủ fog. |

## UI

- Hành động chính: "Thám Hiểm · N lượt dò".
- Khi có pending chỉ hiện: "Thu Thập Phát Hiện" (khi có resource/rare), "Điều Tra Dấu Vết" (khi có information), "Nhờ NPC Dẫn Dấu" (information + có NPC), "Bỏ Qua Phát Hiện"; ẩn Tu Luyện, Di Chuyển, Thám Hiểm thường.
- Hiển thị depth, risk, ảnh hưởng thời tiết, NPC hiện diện, số phát hiện theo loại và hạn xử lý.

## Acceptance

- Không bắt đầu khi đang combat hoặc travel active; pending chặn phiên mới.
- Thu Thập/Bỏ Qua/Điều Tra chạy đúng một lần; NPC vắng mặt bị từ chối hỗ trợ.
- Thời tiết và influence làm đổi risk/reward; rời node làm pending thất lạc không tạo vật phẩm.
- Save/load giữ site, pending, chain stage và lịch sử; `pendingExploration` và `pendingSearch` cho cùng kết quả.
- Gate: `node tools/verify_game.js`, `node tools/verify_action_dispatch_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WSIM-XPL-001..005 | `js/engine.js:search`, `ensureSearchSite`, `searchStatus`, `searchRisk` | Khớp |
| WSIM-XPL-006 | `js/engine.js:pendingExplorationAt`, `setPendingSearch`, `clearPendingSearch`, move handler | Khớp |
| WSIM-XPL-010 | `js/engine.js:collectSearchFindings` | Khớp |
| WSIM-XPL-011 | `js/engine.js:investigateSearchFinding`, `ensureSearchChainQuest` | Khớp |
| WSIM-XPL-012 | `js/engine.js:investigateWithNpcAssist` | Khớp |
| WSIM-XPL-013 | `js/engine.js:leaveSearchSession` | Khớp |
| WSIM-XPL-014, 020..023 | `js/engine.js:search`, `pendingDiscoveryActions` | Khớp |
