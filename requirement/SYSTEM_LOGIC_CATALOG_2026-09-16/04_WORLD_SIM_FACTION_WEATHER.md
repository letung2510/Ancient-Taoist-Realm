# WORLD-SIM — TICK THẾ GIỚI, THỜI TIẾT, THẾ LỰC, CHIẾN TRANH VÀ CÔNG TRÌNH

## 1. Kernel tick

World simulation chạy theo absolute day/turn. Một tick chuẩn: advance clock → season/weather → faction/diplomacy → war/incident → NPC scheduler → structure decay/reward → quest/mail/rumor → map influence/completion → derived state → log/archive.

Online và offline catch-up phải gọi cùng resolver. Offline chỉ giảm chi tiết actor-level nếu có budget, không đổi kết quả canonical của faction, weather, resource và deadline.

## 2. Thời gian, mùa, weather

`gameClock` có năm/tháng/ngày và absolute day. Weather catalog hiện có quang, mưa, sương, lôi vũ, linh phong; resolver vùng có thể thêm âm vũ/tuyết khi catalog được mở rộng. Weather lưu ở region state, có severity, start/end day, source và forecast.

Weather ảnh hưởng travel risk/cost, NPC shelter/schedule, visibility/fog, resource, faction operation, encounter chance và narrative. Hysteresis tránh đổi trạng thái liên tục ở ranh giới severity.

## 3. Faction state

Faction state gồm reputation, stability, resources, influence anchors, diplomatic relations, active war, internal factions, bulletin/task và structure ownership. Reputation player là quan hệ cá nhân; influence map là áp lực lãnh thổ; không đồng nhất hai giá trị.

Diplomacy action phải validate faction tồn tại, target hợp lệ, cooldown và điều kiện quest/standing. War có factionA/B, status, front/node, score, pressure, start/end, intervention history và outcome.

## 4. Chiến tranh và event cascade

War tick cập nhật pressure, faction stability/resources, front nodes và actor risk. Incident/event có trigger, location, participants, expiry, choices, outcome, cascade effects và history. Cascade phải có idempotency key để offline catch-up không nhân đôi.

Player intervention ghi contribution, reputation, war score và narrative. Không ghi outcome trước khi resolver hoàn tất.

## 5. Tông Môn Đại Hội

Tournament state có schedule, rounds, participants, wins, currentRound, reward và cooldown. Begin → choose/resolve round → update wins → conclude. Reward chỉ cấp một lần khi completed; log kể sự kiện, kết quả số vòng đặt vào stat display.

## 6. Công trình thế giới

Guild project và map structure dùng chung nguyên tắc project: template, target, progress, contributors, status, rewardUntilDay, node/faction. Tông môn project không được thay thế structure node; một cái là tiến độ tổ chức, một cái là thực thể trên map.

## 7. NPC/weather integration

Weather resolver cập nhật reaction, mood, scheduleDelay, rumor và faction side effect. NPC ở cùng scene mới tạo narrative player-visible; NPC ở nơi khác chỉ cập nhật state/rumor. Reaction phải có role, weather và personal action, không dùng câu announcement.

## 8. Offline simulation

Catch-up giới hạn số tick, gom event theo ngày, giữ deadline và prune history. Mỗi subsystem cần `lastProcessedDay` hoặc event key. Không đẩy hàng nghìn log nền vào story window.

## Note chưa hoàn thiện

- **ĐÃ CODE**: weather catalog runtime đã bao phủ quang/mưa/sương/tuyết/lôi vũ/linh phong/âm vũ/bão linh khí, có label, severity, default duration, transition pool, alias và history; regression nằm trong `verify_review_batches.js`.
- **MỘT PHẦN**: war front/incident cascade cần thêm deterministic replay test.
- **MỘT PHẦN**: offline NPC simulation chưa đầy đủ state machine nhu cầu/congestion.
- **THIẾT KẾ**: cần chốt công thức influence contribution của structure so với faction anchor.
