# ĐẶC TẢ HỢP NHẤT — TU VI, CON ĐƯỜNG & NGHI THỨC ĐỘT PHÁ (GAP SPEC)

> Tài liệu này hợp nhất các phần còn thiếu của `PHAC_THAO_TU_VI_CON_DUONG_V3.md` và
> `BREAKTHROUGH_RITUAL_DETAIL.md` sau khi đối chiếu với code hiện tại.
>
> Mục tiêu: bổ sung logic chưa tồn tại, không sao chép lại hệ thống đã có và không đưa vào
> đặc tả các quy trình mâu thuẫn với implementation hiện tại.

## 1. Phạm vi và baseline bắt buộc

Các module hiện có và được xem là nguồn sự thật:

- `js/engine.js`: Tu Vi, Mệnh Số, Con Đường, điều kiện đột phá, action dispatcher,
  Neo Nhân Tính, Bế Quan cơ bản.
- `js/expansion.js`: đồng bộ thời gian/thế giới và các hook mở rộng.
- `js/ui.js`, `js/main.js`: Action Bar, tab Cảnh Giới, modal nghi thức và event handler.
- `requirement/NEO_NHAN_TINH_DESIGN.md`: khái niệm Neo hiện có.
- `requirement/FATE_SYSTEM_SPEC.md`, `CONG_PHAP_SYSTEM.md`, `NPC_MONSTER_SYSTEM.md`:
  nguồn dữ liệu Mệnh Số, Công Pháp, NPC/quái.

Không được tạo lại các API đã có như `breakthroughRequirements()`,
`getBreakthroughBlockers()`, `breakthroughRitualStatus()`,
`performBreakthroughRitualStep()`, `anchorCandidates()`, `establishHumanAnchor()`.
Tính năng mới phải gọi các API này hoặc mở rộng bằng API mới có prefix rõ ràng.

## 2. Quyết định tương thích (loại bỏ xung đột)

### 2.1. Nghi thức đột phá

Implementation hiện tại dùng các ID:

```text
call_fate → compare → anchor → omen → cost → trial
```

Các tài liệu cũ dùng tên `realm_gate`, `path_gate`, `body_mind_check`,
`cost_commit`. Những tên cũ không được dùng làm ID runtime mới. Nếu cần trao đổi
với API ngoài, dùng bảng ánh xạ:

```js
{
  realm_gate: "call_fate",
  path_gate: "compare",
  anchor_gate: "anchor",
  body_mind_check: "omen",
  cost_commit: "cost"
}
```

Các cấp 1→2 và logic khai mạch hiện tại giữ nguyên, không đưa vào feature mới.
Nghi thức mới chỉ bổ sung dữ liệu/hành vi còn thiếu từ cấp 3 trở lên.

### 2.2. Nguyên tắc commit

- Không tạo một pipeline đột phá thứ hai.
- Không trừ EXP/Tu Vi lần nữa ở bước nghi thức.
- `performBreakthroughRitualStep()` chỉ hoàn tất cổng; `maybeBreakthrough()` là
  commit cảnh giới cuối cùng.
- Khi ritual đã đủ cổng, `maybeBreakthrough()` phải bỏ qua roll thân/tâm cũ.
  Roll ngẫu nhiên duy nhất của pipeline là `omen`.
- Không đưa vào đặc tả cơ chế “5 cổng cố định cho mọi cấp”. Số cổng lấy từ
  `breakthroughRitualPlan()` hiện tại và dữ liệu REALMS.

## 3. Mô hình dữ liệu bổ sung

### 3.1. Tu Vi velocity và Tẩu Hỏa Nhập Ma

Thêm các field có migration an toàn:

```js
state.player.cultivation = {
  velocity24h: 0,
  velocitySamples: [],       // tối đa 128 mẫu
  deviationCount: 0,
  lastDeviationAt: null,
  pendingDeviation: null
}
```

Mỗi nguồn cộng Tu Vi phải gọi một hàm duy nhất:

```js
recordCultivationGain(state, amount, source, metadata = {})
```

`source` thuộc một trong: `cultivate`, `auto`, `be_quan`, `combat_insight`,
`environment_insight`, `dao_insight`, `spar_insight`, `minor_trial`, `other`.

Mẫu lưu dạng:

```js
{ amount, source, gameDay, timestamp, realmLevel }
```

Chỉ giữ mẫu trong 24 ngày game gần nhất (dùng GameClock, không dùng thời gian
thực). `velocity24h` là tổng `amount` của các mẫu còn hạn.

### 3.2. Công thức ngưỡng an toàn

```js
safeVelocity = requiredExpForNextRealm(state) * 0.05
ratio = safeVelocity > 0 ? velocity24h / safeVelocity : 0
deviationChance = ratio > 1.5
  ? clamp((ratio - 1.5) * 0.40, 0, 0.30)
  : 0
```

Không roll nếu `deviationChance === 0`. Khi roll trúng:

```js
severityChance = clamp(0.20 + corruptionRating / 200, 0.20, 0.70)
```

- Nhánh nhẹ: mất ngẫu nhiên 10–20% EXP chưa chốt, cộng 5 Madness.
- Nhánh nặng: tạo một `pendingDeviation` loại biến dị thân thể, không mất EXP.
- Không bao giờ trừ EXP đã chốt ở cảnh giới trước.
- Một lần nhận EXP chỉ được roll tối đa một lần; tránh nested roll khi Bế Quan.

API mới:

```js
recordCultivationGain(state, amount, source, metadata)
cultivationVelocityStatus(state)
resolveCultivationDeviation(state, choice)
```

`resolveCultivationDeviation()` chỉ nhận các choice được engine trả về; không
cho client tự gửi hiệu ứng tùy ý.

## 4. Đa dạng hóa nguồn Tu Vi

Các nguồn sau chưa có trong code và phải dùng chung `recordCultivationGain()`.

### 4.1. Chiến Ngộ

Sau combat thắng NPC/quái:

```js
combatInsight = baseGain
  * clamp((enemyRealm - playerRealm) * 0.25, 0, 1.5)
  * clamp(enemyPower / Math.max(1, playerPower), 0.75, 1.5)
```

- Chỉ kích hoạt nếu đối thủ có cảnh giới ngang hoặc cao hơn.
- Không kích hoạt khi đối thủ chết do môi trường, bẫy hoặc auto-resolve.
- Giới hạn một phần thưởng mỗi encounter.
- Ghi log nguồn và enemyId để audit.

### 4.2. Cảnh Ngộ

Tại location có `linhKhiDensity >= 3`, nếu người chơi đứng yên liên tục:

```js
state.player.environmentInsight = {
  locationId,
  startedDay,
  accumulatedDays,
  interrupted: false
}
```

- Mỗi ngày game hoàn chỉnh cộng `baseCultivationGain * densityMultiplier`.
- `densityMultiplier = 1 + (linhKhiDensity - 3) * 0.25`, tối đa 2.0.
- Move, combat, encounter hoặc action chủ động reset bộ đếm.
- Không cộng khi đang `pendingEnding`, đang giao chiến hoặc location không hợp lệ.

### 4.3. Vấn Đạo và Đấu Ngộ

Chỉ NPC có `pathId` trùng player mới mở action.

- `Vấn Đạo`: một lần/NPC/kiếp, roll theo chênh lệch cảnh giới; thành công cộng
  Tu Vi và một insight log.
- `Đấu Ngộ`: mô phỏng spar, không gây HP damage; dùng công thức combat nhưng chỉ
  trả về `win/loss`, cộng Tu Vi nhỏ hơn Vấn Đạo.
- Mỗi NPC lưu cooldown bằng `state.flags.pathInsight[npcId]`.
- Không tạo NPC mới ngoài hệ thống encounter hiện có.

API:

```js
pathInsightOptions(state, npcId)
performPathInsight(state, npcId, type) // type: "ask" | "spar"
```

## 5. Bế Quan mở rộng

Không thay thế `secludedCultivation()`. Mở rộng hàm bằng tùy chọn `days` và giữ
đường tương thích với `hours` cũ.

```js
startSecludedCultivation(state, { days, locationId })
stopSecludedCultivation(state)
secludedCultivationStatus(state)
```

Quy tắc:

- `days` từ 1 đến 30; nếu client chỉ gửi `hours`, quy đổi theo cấu hình GameClock.
- Hệ số: 1–5 ngày = 1.5x; 6–15 = 2.0x; 16–30 = 3.0x.
- Đang Bế Quan khóa action chủ động, chỉ cho phép `stop`/phản ứng hệ thống.
- Thoát sớm trả Tu Vi theo tỷ lệ thời gian đã chạy, không phạt.
- Mốc 6–15 ngày: rủi ro Tiếng Vọng = 10%.
- Mốc 16–30 ngày: rủi ro đột nhập = 25%, combat auto dùng stat giảm 50%.
- Location có `ownerFactionId` trùng faction phục vụ giảm một nửa các rủi ro trên.
- Mỗi phiên chỉ roll rủi ro một lần cho mỗi mốc; lưu vào session để không roll lại
  khi reload.

Schema:

```js
state.player.secludedSession = {
  status: "active" | "completed" | "stopped" | "interrupted",
  locationId,
  startedDay,
  plannedDays,
  elapsedDays,
  multiplier,
  riskRolls: { echo: null, intrusion: null },
  gainedExp,
  interruptedBy: null
}
```

## 6. Đạo Tâm

Thêm field độc lập với Corruption:

```js
state.player.daoTam = 50
state.flags.daoTamHistory = [] // tối đa 100 entries
```

Chỉ engine được thay đổi giá trị qua:

```js
adjustDaoTam(state, delta, reason, metadata = {})
```

Giới hạn 0–100, ghi `before/after/reason/gameDay`.

Các sự kiện tối thiểu:

- Thành công ritual không đổi Con Đường: +2.
- Thất bại `omen`: -2; thất bại liên tiếp lần 3 trở đi thêm -1.
- Đổi Con Đường hợp lệ: đặt về tối đa 10.
- Từ chối cơ duyên trái Con Đường: +1.
- Dùng kỹ thuật cấm trái hệ: -3.

Tương tác:

```js
daoTamMatchBonus = daoTam >= 80 ? 10 : 0
effectiveCorruptionGain = baseGain * (1 - daoTam / 200)
```

Bonus chỉ cộng vào `match_score` ở lớp tổng hợp, không sửa điểm gốc của Mệnh Số.

## 7. Chuyển Đạo

Không cho đổi trực tiếp qua `selectPath()`. Thêm quest/NPC gate:

```js
pathSwitchStatus(state)
pathSwitchCandidates(state)
switchPathContext(state, newPathId, npcId)
```

Điều kiện:

- Có NPC chuyển đạo đang active và đã đạt quan hệ tối thiểu.
- Không trong combat, Bế Quan hoặc ritual đang mở.
- Cooldown mặc định 30 ngày game.

Khi thành công:

1. Giữ EXP, Mệnh Số vật lý, Công Pháp và cảnh giới.
2. Đổi `player.pathId`, tính lại `pathMatchSummary()`.
3. Xóa bonus tương hợp tạm thời của đường cũ.
4. Giảm `daoTam` về tối đa 10.
5. Reset ritual đang dở về `null`.
6. Ghi cooldown và log lý do.

## 8. Tiểu Kiếp

Tạo một event duy nhất ở mốc 50% EXP của cảnh giới kế tiếp:

```js
state.flags.minorTrial = {
  targetRealmId,
  thresholdExp,
  status: "available" | "accepted" | "passed" | "skipped",
  offeredAtDay,
  resolvedAtDay
}
```

- Chỉ tạo một lần cho mỗi `targetRealmId`.
- Người chơi được bỏ qua, không bị phạt.
- Thành công chọn một trong hai phần thưởng: +1 điểm Chuyển Sinh dự trữ hoặc
  bonus Tu Vi cố định theo cảnh giới.
- Không được tự động mở ritual hoặc commit cảnh giới.
- Event phải đi qua action dispatcher, không sửa state trực tiếp từ UI.

## 9. Khác biệt hóa nghi thức theo Con Đường

Không thay đổi thứ tự gate hiện tại. Chỉ thêm adapter dữ liệu:

```js
PATH_RITUAL_PROFILES[pathId] = {
  anchorType,
  omenCheck,
  costType,
  costAmount,
  locationRequirement,
  failureEffect
}
```

MVP chỉ triển khai các profile không phá vỡ schema tài nguyên hiện có:

- Kiếm Đạo: ưu tiên anchor vật phẩm; fallback Neo NPC hiện tại.
- Đan Đạo: yêu cầu location có lò luyện nếu dữ liệu location hỗ trợ.
- Phong Thủy Đạo: yêu cầu location có `longMai`.
- Ngũ Thú Đạo: ưu tiên companion hợp lệ; fallback không được tự động pass.
- Tinh Tướng Đạo: kiểm tra khung giờ GameClock.

Nếu tài nguyên hoặc entity chưa tồn tại, gate phải trả blocker rõ ràng thay vì
giả lập thành công. Không đưa các cost mới như Khí Huyết tối đa vĩnh viễn,
Thọ Nguyên hoặc nguyên liệu quý vào runtime cho tới khi inventory/lifespan API
đã hỗ trợ transaction nguyên tử.

## 10. Tutorial và UI bổ sung

UI hiện có modal ritual và quick hint. Chỉ bổ sung:

- `data-ritual-tutorial` mở nội dung giải thích theo gate.
- Quick hint lấy từ blocker thật, không dùng text tĩnh.
- Tự mở tutorial một lần ở mỗi lần `currentGate` thay đổi; trạng thái lưu:

```js
state.flags.ritualTutorial = {
  lastTargetRealmId: null,
  lastGate: null,
  suppressed: false
}
```

- Không khóa action vì tutorial; tutorial chỉ là lớp hướng dẫn.
- Action Bar chỉ hiển thị action runtime hiện có, không thêm một bộ action song song.

## 11. Rankboard và Tu Vi Thư

### 11.1. Rankboard vùng

Tạo API read-only:

```js
getRegionalCultivationRankboard(state, regionId, limit = 10)
```

Nguồn gồm player và NPC đã biết trong region. Sắp xếp theo level, EXP, danh vọng;
ẩn NPC chưa được khám phá. Cache theo `worldTick` và invalid khi player/NPC tăng
cảnh giới.

### 11.2. Tu Vi Thư

Ghi các mốc vào:

```js
state.player.cultivationJournal = [
  { type, gameDay, realmId, amount, source, note }
]
```

Chỉ ghi breakthrough, minor trial, deviation, insight và path switch; giới hạn
500 bản ghi, loại cũ nhất trước. UI hiển thị dạng timeline, không tạo chart engine
mới nếu chưa có thư viện biểu đồ.

## 12. Migration và transaction

`deserialize()` phải thêm mặc định:

```js
player.cultivation ??= { velocity24h: 0, velocitySamples: [], deviationCount: 0,
  lastDeviationAt: null, pendingDeviation: null };
player.daoTam ??= 50;
flags.daoTamHistory ??= [];
flags.minorTrial ??= null;
flags.ritualTutorial ??= { lastTargetRealmId: null, lastGate: null, suppressed: false };
```

Mọi action mới phải snapshot trước/sau và rollback nếu transaction thất bại.
Không để UI tự trừ EXP, SAN, HP, lifespan hoặc inventory.

## 13. Acceptance checklist

- Nhận EXP từ mọi nguồn đều cập nhật velocity đúng một lần.
- Velocity hết hạn theo GameClock sau 24 ngày.
- Tẩu Hỏa không làm mất EXP đã chốt.
- Bế Quan 1–30 ngày, thoát sớm đúng tỷ lệ, không nhân đôi phần thưởng khi reload.
- NPC cùng Con Đường mở đúng Vấn Đạo/Đấu Ngộ và có cooldown.
- `daoTam` độc lập với Corruption, có audit history và ảnh hưởng match score.
- Chuyển Đạo reset ritual, giữ EXP/Mệnh/Công Pháp, áp cooldown.
- Tiểu Kiếp chỉ xuất hiện một lần ở 50% và không tự commit cảnh giới.
- Ritual chỉ có một roll thất bại (`omen`); sau khi đủ cổng, đột phá không roll lại
  và không mất EXP lần hai.
- Cấp 14 chỉ mở thử thách cuối khi có combat/quest backend thật; không pass bằng cờ
  giả lập ngoài ý muốn.
- Save cũ load được không lỗi; save mới không làm hỏng các API hiện tại.
- `node tools/verify_game.js` và toàn bộ `node --check js/*.js` phải pass.

## 14. Không nằm trong tài liệu này

Để tránh trùng lặp hoặc lệch code, tài liệu này không đặc tả lại:

- Công thức Mệnh Số, path matching và điều kiện breakthrough nền đã có.
- Combat, encounter, inventory, lifespan và faction system hiện có.
- Cơ chế khai mạch cấp 1→2.
- Các tên gate cũ như một API runtime độc lập.
- Các cost tài nguyên chưa có transaction backend.
- Nội dung lore, hội thoại hoặc asset hình ảnh không cần cho logic.

## 15. Nhật ký triển khai (2026-09-09)

Phần nền đã được triển khai trực tiếp trong `js/engine.js`:

- `createCharacter()` khởi tạo `daoTam`, `cultivation`, `cultivationJournal` và
  `secludedSession` với giá trị mặc định an toàn.
- `deserialize()` tự migrate các field mới cho save cũ.
- `gainExp()` đi qua `recordCultivationGain()` để mọi nguồn EXP đều có velocity
  và nhật ký; dùng chung một điểm vào để tránh ghi trùng.
- `cultivationVelocityStatus()` cung cấp velocity/ngưỡng/rủi ro cho UI và audit.
- `adjustDaoTam()` ghi lịch sử thay đổi, giới hạn 0–100; `pathMatchSummary()` đã
  cộng bonus +10 khi Đạo Tâm ≥ 80.
- `performBreakthroughRitualStep()` ghi `requiredGates`, `gatesPassed`,
  `currentGate`, `attemptLog` và giảm Đạo Tâm khi Vượt Dị Tượng thất bại.
- `maybeBreakthrough()` không còn roll thân/tâm lần hai sau khi toàn bộ ritual
  hoàn tất; commit cảnh giới trở thành deterministic.
- `breakthroughRitualPlan()` đã chuẩn hóa cấp 3–4 cùng dùng 2 cổng.

Các phần còn lại trong tài liệu (Chiến Ngộ/Cảnh Ngộ, Vấn Đạo/Đấu Ngộ, Bế Quan
1–30 ngày, Chuyển Đạo, Tiểu Kiếp, profile nghi thức theo Con Đường, rankboard,
Tu Vi Thư UI) vẫn là backlog; chưa đánh dấu hoàn tất cho tới khi có action,
transaction và test tương ứng.
