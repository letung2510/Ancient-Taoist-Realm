# INTERACTION — NPC, QUAN HỆ, COMPANION, QUEST, THƯ VÀ BOUNTY

## 1. NPC state

Notable NPC có identity, role, faction, home/current node và sub-location, schedule, needs, mood, relationships, memory, rumor, mailbox, active quest, status alive/dead/missing. Population nền không được nhầm với actor có identity.

## 2. Scheduler

Mỗi tick chọn mục tiêu theo priority: danger/shelter, quest, need, faction duty, social, travel, idle. Resolver kiểm tra topology, congestion, weather, player lock và current event. Movement phải ghi source/destination, arrival day và không teleport qua edge không tồn tại.

## 3. NPC state machine

`idle → traveling → present → interacting → sheltering/combat → cooldown` với terminal `dead/missing`. Mỗi transition có guard và event key. Weather severity có hysteresis, không đổi shelter liên tục.

## 4. Player–NPC relationship

Quan hệ gồm score/level, trust/respect/fear hoặc canonical dimensions, memory, last interaction, favors, hostility và quest history. Talk/quest/gift/intervention thay đổi relationship theo context. Memory phải lưu reason/day, không chỉ cộng số không truy vết.

## 5. NPC–NPC

Encounter có participants, location, reason, witnessed, outcome, rumor propagation và cooldown. Encounter có thể ảnh hưởng faction, relationship, stock, quest và map history. Không tạo loop encounter vô hạn trong cùng tick.

## 6. Quest và truyền thư

Quest có giver, objectives, progress, status, expiry, reward và failure. Accept/advance/complete/fail là transaction. Mail có sender/recipient, createdDay, delivery state, payload, read state, expiry. Truyền thư cần cost, route/delay và failure.

## 7. Companion

Companion có identity, customName, status, mutation/trait, equipment/skill, loyalty, current node, recovery state và action. Rescue/recover/expedition/tame phải idempotent. Companion modifier đi qua derived pipeline, không tự sửa stat UI.

## 8. Bounty và tình báo

Bounty có target, issuer, cost/reward, expiry, claimant, heat và completion. Intel có source, confidence, region, expiry, rumor/verified. Mua tin chưa kiểm chứng không đánh dấu verified. Cover identity/counter-intel tách khỏi faction ownership.

## 9. Map/UI/log coupling

NPC chỉ xuất trong node detail nếu đúng node/sub-location và status. Weather reaction narrative chỉ hiện trong cùng scene. UI dùng NPC view model thống nhất, không đọc object simulation trực tiếp. Log chỉ ghi transition/outcome, không ghi toàn bộ scheduler internals.

## Note chưa hoàn thiện

- **MỘT PHẦN**: scheduler nhu cầu/congestion và travel topology chưa đạt đầy đủ contract NPC V2.
- **MỘT PHẦN**: witness/rumor propagation cần test lan truyền qua nhiều node và offline catch-up.
- **MỘT PHẦN**: player relationship có runtime nhưng bảng level/decay canonical chưa thống nhất ở mọi NPC.
- **MỘT PHẦN**: companion mutation/equipment UI cần audit save round-trip.
