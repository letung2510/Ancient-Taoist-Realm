# Realm Progression — EXP & tu luyện

## Mục đích

Nguồn Tu vi (EXP), điểm vào duy nhất ghi nhận EXP, rủi ro Tẩu Hỏa Nhập Ma khi cày quá nhanh, chỉ số Đạo Tâm, các nguồn ngộ đạo, Tiểu Kiếp, bảng xếp hạng vùng và Tu Vi Thư. Bế Quan nằm ở [seclusion.md](seclusion.md).

## Dữ liệu & trạng thái

```js
state.player.cultivation = { velocity24h: 0, velocitySamples: [], deviationCount: 0, lastDeviationAt: null, pendingDeviation: null }
// velocitySamples[i] = { amount, source, gameDay, timestamp, realmLevel, metadata }
state.player.daoTam = 50                     // 0–100
state.flags.daoTamHistory = []               // ≤ 100: { before, after, delta, reason, gameDay, metadata }
state.flags.minorTrial = { targetRealmId, thresholdExp, status: "available"|"accepted"|"passed"|"skipped", offeredAtDay, resolvedAtDay }
state.flags.pathInsight = { [npcId]: { askedLife, sparCooldownUntil } }
state.player.cultivationJournal = []         // ≤ 500: { type, gameDay, realmId, amount, source, note }
```

`deserialize()` bổ sung mặc định cho mọi field trên khi load save cũ.

## Rules

### PRG-CUL-001 Điểm vào EXP duy nhất
Mọi nguồn cộng Tu vi đi qua `gainExp()` → `recordCultivationGain(state, amount, source, metadata)`. `amount` làm tròn, ≥ 0. `source` thuộc `CULTIVATION_SOURCE_CATALOG`: `cultivate`, `combat`, `combat_insight`, `quest_reward`, `item_use`, `environment_insight`, `canonical_reward`, `system_other`; giá trị lạ chuẩn hóa thành `system_other`. Mỗi lần nhận EXP cập nhật velocity đúng một lần.

### PRG-CUL-002 Velocity
Mẫu velocity giữ trong 24 ngày game gần nhất (GameClock, không dùng thời gian thực), tối đa 128 mẫu. `velocity24h` = tổng `amount` các mẫu còn hạn.

### PRG-CUL-003 Tẩu Hỏa Nhập Ma
`safeVelocity = breakExp(cấp hiện tại) × 0.05`; `ratio = velocity24h / safeVelocity`; `deviationChance = ratio > 1.5 ? clamp((ratio − 1.5) × 0.40, 0, 0.30) : 0`. Không roll khi chance = 0; mỗi lần nhận EXP tối đa một roll (không roll lồng khi Bế Quan). Trúng: `severityChance = clamp(0.20 + Tà Nhiễm / 200, 0.20, 0.70)`.
- Nhẹ: mất ngẫu nhiên 10–20% EXP chưa chốt, Điểm Điên Loạn +5.
- Nặng: tạo `pendingDeviation = { kind: "body_mutation" }`, không mất EXP.
Không bao giờ trừ EXP đã chốt của cảnh giới trước.

### PRG-CUL-004 Xử lý Tẩu Hỏa
Khi có `pendingDeviation`, action bị ép về trạng thái `CULTIVATION_DEVIATION` với đúng hai lựa chọn do engine trả: `accept` (nhận biến dị) hoặc `purify` (−10 Thanh Tỉnh). Client không được gửi hiệu ứng tùy ý.

### PRG-CUL-005 Đạo Tâm
Field độc lập với Corruption, 0–100, mặc định 50, không roll khi tạo nhân vật; chỉ thay đổi qua `adjustDaoTam(state, delta, reason, metadata)`.

| Sự kiện | Δ |
|---|---:|
| Đột phá thành công không đổi Con Đường | +2 |
| Thất bại `omen` | −2 (từ lần liên tiếp thứ 3: thêm −1) |
| Từ chối cơ duyên/phần thưởng trái Con Đường | +1 |
| Dùng Cấm Thuật trái hệ Con Đường | −3 |
| Chuyển Đạo hợp lệ | đặt về tối đa 10 |

### PRG-CUL-006 Hiệu ứng Đạo Tâm
- Đạo Tâm ≥ 80: `daoBonus = +1` vào `match_score` ở lớp tổng hợp khi `rawScore ≥ 1` (không sửa điểm gốc Mệnh; thuật toán ở [PATH-SEL-003](../path/path-selection.md#path-sel-003-match_score)).
- `effectiveCorruptionGain = baseGain × (1 − daoTam / 200)`.
- Đạo Tâm ≤ 20: tăng tỷ lệ xuất hiện lựa chọn dị hóa bất lợi ở các mốc Tà Thần.
- Dị Thể/Con Đường Ẩn có thể đặt hệ số tích Đạo Tâm hoặc trần Đạo Tâm (ví dụ Hỗn Độn Thể ×0,5; Tà Thần Khế Đạo trần 50).

### PRG-CUL-007 Thiên phú chủng tộc × Con Đường
Không ép lựa chọn; chỉ tăng tốc tích Đạo Tâm khi đi đúng đường:

| Chủng tộc | Con Đường thiên phú | Tốc độ tích Đạo Tâm |
|---|---|---:|
| Yêu Tộc | `ngu_thu_dao` | +20% |
| Ma Tộc | `am_luat_dao` | +20% |
| Linh Tộc | `phong_thuy_dao` | +20% |
| Cơ Quan Tộc | `khoi_loi_dao` | +20% |
| Cổ Tộc | `tinh_tuong_dao` | +20% |
| Ma Thần Hậu Duệ | `am_luat_dao`, `luyen_the_dao` | +12% mỗi đường |
| Nhân Tộc | mọi đường | +5% |

### PRG-CUL-008 Chiến Ngộ
Thắng NPC/quái cảnh giới ngang hoặc cao hơn: `combatInsight = baseGain × clamp((enemyRealm − playerRealm) × 0.25, 0, 1.5) × clamp(enemyPower / max(1, playerPower), 0.75, 1.5)`, source `combat_insight`. Không kích hoạt khi đối thủ chết do môi trường/bẫy/auto-resolve; tối đa 1 lần/encounter; log `enemyId`.

### PRG-CUL-009 Cảnh Ngộ
Tại location `linhKhiDensity ≥ 3`, đứng yên đủ một ngày game cộng `baseCultivationGain × densityMultiplier`, `densityMultiplier = min(2.0, 1 + (density − 3) × 0.25)`, source `environment_insight`. State `player.environmentInsight = { locationId, startedDay, accumulatedDays, interrupted }`. Move/combat/encounter/action chủ động reset; không cộng khi `pendingEnding`, đang giao chiến hoặc location không hợp lệ.

### PRG-CUL-010 Vấn Đạo và Đấu Ngộ
Chỉ mở với NPC có `pathId` trùng player (qua encounter hiện có, không sinh NPC mới). `pathInsightOptions(state, npcId)`, `performPathInsight(state, npcId, "ask" | "spar")`.
- Vấn Đạo (`ask`): 1 lần/NPC/kiếp, roll theo chênh cảnh giới; thành công cộng Tu vi + insight log.
- Đấu Ngộ (`spar`): mô phỏng bằng công thức combat, chỉ trả `win/loss`, không gây sát thương HP; Tu vi nhỏ hơn Vấn Đạo; cooldown lưu `flags.pathInsight[npcId]`.

### PRG-CUL-011 Tiểu Kiếp
Khi EXP đạt đúng 50% `breakExp` của lần đột phá kế tiếp, tạo một event duy nhất cho mỗi `targetRealmId`, đi qua action dispatcher. Người chơi được bỏ qua không phạt. Thành công chọn 1: +1 Điểm Chuyển Sinh dự trữ hoặc bonus Tu vi cố định theo cảnh giới; thất bại mất một phần nhỏ EXP chưa chốt. Không tự mở nghi thức hay commit cảnh giới.

### PRG-CUL-012 Bảng xếp hạng vùng
`getRegionalCultivationRankboard(state, regionId, limit = 10)` read-only: player + NPC đã biết trong region, sắp theo cấp → EXP → danh vọng, ẩn NPC chưa khám phá; cache theo `worldTick`, invalid khi player/NPC lên cấp. Hiển thị tại Vương Kinh/Tông Môn lớn.

### PRG-CUL-013 Tu Vi Thư
`cultivationJournal` chỉ ghi các mốc: breakthrough, minor trial, deviation, insight, path switch; tối đa 500 bản ghi, bỏ cũ nhất trước. UI tab Cảnh giới hiển thị dạng timeline (không tạo chart engine mới).

### PRG-CUL-014 Tự động tu luyện
Tự động tu luyện tối đa 20 chu kỳ mỗi lệnh, tự điều tức khi thiếu Linh Khí; dừng khi Thanh Tỉnh ≤ 25, khi đã đủ điều kiện đột phá, khi đang giao chiến hoặc hành trình đã kết thúc.

## Acceptance

- Nhận EXP từ mọi nguồn cập nhật velocity đúng một lần; velocity hết hạn sau 24 ngày game.
- Tẩu Hỏa không làm mất EXP đã chốt.
- NPC cùng Con Đường mở đúng Vấn Đạo/Đấu Ngộ có cooldown; Tiểu Kiếp chỉ 1 lần ở 50%, không tự commit.
- Đạo Tâm có audit history, độc lập Corruption, ảnh hưởng match score.
- Save cũ load được với giá trị mặc định.
- Gate: `node tools/verify_cultivation_producers.js`, `node tools/verify_cultivation_controls.js`, `node tools/verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PRG-CUL-001 | `js/engine.js:gainExp`, `recordCultivationGain`, `CULTIVATION_SOURCE_CATALOG`, `validateCultivationAttribution` | Khớp |
| PRG-CUL-002 | `js/engine.js:recordCultivationGain` | Khớp |
| PRG-CUL-003 | `js/engine.js:recordCultivationGain`, `cultivationVelocityStatus` dùng `REALMS[idx + 1].breakExp` (cấp kế tiếp) thay vì `breakExp` cấp hiện tại | Lệch |
| PRG-CUL-004 | `js/expansion.js:resolveCultivationDeviation`; action `act_cultivation_deviation_*` | Khớp |
| PRG-CUL-005 | `js/engine.js:adjustDaoTam`; thiếu sự kiện +1/−3 và −1 lần thứ 3 | Lệch |
| PRG-CUL-006 | `js/engine.js:pathMatchSummary` (xem PATH-SEL-003: `score = rawScore + daoBonus`); hệ số Corruption theo Đạo Tâm chưa có | Lệch |
| PRG-CUL-007 | — | Thiếu |
| PRG-CUL-008 | `js/engine.js` (thưởng ngẫu nhiên 20–50% EXP khi hạ địch, source `combat_insight`) không theo công thức | Lệch |
| PRG-CUL-009 | — | Thiếu |
| PRG-CUL-010 | `js/expansion.js:pathInsightOptions`, `performPathInsight` (stub `observe/meditate/trial`, không theo NPC) | Lệch |
| PRG-CUL-011 | `js/expansion.js:triggerMinorTrial` (stub, không kiểm mốc 50%) | Lệch |
| PRG-CUL-012 | `js/expansion.js:getRegionalCultivationRankboard` (không lọc region/limit/discovered) | Lệch |
| PRG-CUL-013 | `js/engine.js:cultivationJournalPush` (ghi cả mọi lần nhận EXP dạng `insight`) | Lệch |
| PRG-CUL-014 | `js/engine.js:autoCultivate` (action `act_tu_luyen_tu_dong` = 5 chu kỳ, nhưng lệnh văn bản cho tới 240) | Lệch |
