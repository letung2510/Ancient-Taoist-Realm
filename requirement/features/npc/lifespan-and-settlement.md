# NPC — Thọ nguyên, kế nhiệm, định cư

## Mục đích

NPC già đi và mất theo ngày tuyệt đối; vai trò được kế nhiệm có kiểm soát; thương nhân lưu lạc có thể định cư thành điểm chợ nhỏ.

## Dữ liệu & trạng thái

`npcState[npcId]`: `birthAge`, `birthDay`, `ageDays`, `age`, `lifespanDays`, `maxLifespan`, `deathDay`, `status`, `successorOf`, `inheritedRole`, `relationshipsWithNpcs[otherId] = { type: "su_do", score }`, `nodeVisitDays`.
`worldSimulation.vacantRoles[npcId]`, `worldSimulation.settlements["settlement:<npcId>:<nodeId>"]`.

## Rules

| ID | Rule |
|---|---|
| NPC-LIF-001 | Tuổi tính từ ngày tuyệt đối (năm = 360 ngày): `birthAge` seeded 25–69, `birthDay = day − birthAge×360` khi khởi tạo, `ageDays = day − birthDay`. |
| NPC-LIF-002 | Thọ nguyên phân giải một lần từ cảnh giới NPC (`lifespanBase + lifespanBonus` năm) hoặc seeded 90–159 năm khi không có cảnh giới; lưu `lifespanDays` và không tính lại. |
| NPC-LIF-003 | Ở tick đầu tiên `ageDays ≥ lifespanDays`: nguyên tử đặt `status="deceased"`, `deathDay`, dừng lịch/di chuyển, đóng quest đang mở do NPC giao (trừ quest ngày `transferable`), ghi đúng một node-history `npc-death:<npcId>`. NPC đã mất bị loại khỏi các pha sau cùng ngày. |
| NPC-LIF-004 | Người kế nhiệm chỉ là NPC còn sống có quan hệ `su_do` với người mất, chọn theo `score` cao nhất rồi `npcId`. Kế nhiệm nhận vai trò, node/sub-location và chỉ quest ngày `transferable`; danh tính, tính cách, quan hệ và ký ức riêng giữ nguyên. |
| NPC-LIF-005 | Không có người kế nhiệm → ghi `vacantRoles[npcId] = { role, nodeId, factionId, vacantDay, status:"vacant" }` cho chính trị kế vị ([organization-interactions.md](organization-interactions.md)). |
| NPC-LIF-010 | Thương nhân `itinerant` chỉ định cư tại node không có chủ (không organization/faction/NPC owner) sau ≥ 8 lần ghé ở các ngày khác nhau. |
| NPC-LIF-011 | Kiểm tra định cư mỗi 30 ngày (`day % 30 === 0`): seeded `settlement-month:<npcId>:<nodeId>:<tháng>` < 20% và node còn `settlementCapacity` (mặc định 1) → tạo một sub-location chợ "Quầy Lưu Lạc" `itinerant_stall:<npcId>` và một node-history. Key duy nhất NPC + node; không roll lặp tạo bản sao. |
| NPC-LIF-012 | `settlementSnapshot(state, nodeId)` là read model: capacity, occupied, available, danh sách định cư sắp theo ID. |

## Acceptance

- Replay cùng khoảng ngày không tạo cái chết/định cư thứ hai.
- NPC chết không di chuyển, không hội thoại; quest không chuyển được bị fail.
- Gate: `node tools/verify_n90_n114_behavior.js`, `node tools/verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| NPC-LIF-001..002 | `js/expansion.js:updateNpcSchedules` | Khớp |
| NPC-LIF-003..005 | `js/expansion.js:resolveNpcSuccession` | Khớp |
| NPC-LIF-010..011 | `js/expansion.js:resolveNpcSettlements` | Khớp |
| NPC-LIF-012 | `js/expansion.js:settlementSnapshot` | Khớp |
