# Realm Progression — Đột phá

## Mục đích

Quy trình đưa nhân vật từ cấp N lên N+1: khai mạch 1→2, nghi thức phân tầng theo cấp đích (cấp 3–14), commit cảnh giới, hướng dẫn UI. Điều kiện số của từng cấp nằm ở [PRG-RLM-003](realms-14.md).

## Dữ liệu & trạng thái

```js
state.flags.breakthroughRitual = {
  targetRealmId,            // nghi thức chỉ có hiệu lực cho đúng cấp đích này
  completed: [],            // = gatesPassed
  requiredGates: [],        // breakthroughRitualPlan(targetLevel, state)
  gatesPassed: [],
  currentGate: null,        // bước đầu tiên trong requiredGates chưa qua; null = sẵn sàng commit
  attemptLog: [{ gate, timestamp, result: "pass" | "fail", sanCost }],
  bodyMindPassed, costCommitted
}
state.flags.ritualTutorial = { lastTargetRealmId: null, lastGate: null, suppressed: false }
```

ID cổng runtime: `call_fate` (Gọi Mệnh), `anchor` (Dựng Neo), `compare` (Đối Chiếu Con Đường), `omen` (Vượt Dị Tượng), `cost` (Trả Giá), `trial` (Thử Thách Cuối).

## Rules

### PRG-BT-001 Khai mạch 1→2
Cấp 1→2 không dùng nghi thức: đủ 100 EXP (trừ 100 EXP) hoặc dùng vật phẩm khai mạch → vào Khai Lộ Cảnh. Không kiểm điều kiện Mệnh Số.

### PRG-BT-002 Chọn đường trước đột phá kế tiếp
Vào cấp 2 đặt `flags.pathChoicePending = true`; action bị ép về lựa chọn Con Đường/Ngoại Đạo Giả ([PATH-SEL-005](../path/path-selection.md)). Không đột phá lên cấp 3 khi chưa có `pathId`.

### PRG-BT-003 Phân tầng nghi thức theo cấp đích

| Cấp đích | Con Đường thường | Ngoại Đạo Giả |
|---|---|---|
| 3–4 | `call_fate → anchor → compare` | `call_fate → anchor → omen` |
| 5–10 | `call_fate → anchor → compare → omen` | `call_fate → anchor → omen` |
| 11–13 | `call_fate → anchor → compare → omen → cost` | `call_fate → anchor → omen → cost` |
| 14 | `call_fate → anchor → compare → omen → cost → trial` | `call_fate → anchor → omen → cost` (+ Vô Lộ Chứng Đạo, [PATH-UNB-010](../path/ngoai-dao-gia.md)) |

Số bước lấy từ `breakthroughRitualPlan()`; không có "5 cổng cố định cho mọi cấp".

### PRG-BT-004 Thứ tự cố định
Chỉ `currentGate` được thực hiện. Gửi bước sai thứ tự bị từ chối với lý do "phải theo thứ tự", không tiêu hao. Tên cổng cũ (`realm_gate`, `path_gate`, `anchor_gate`, `body_mind_check`, `cost_commit`) chỉ là alias tài liệu, không phải ID runtime.

### PRG-BT-005 Gọi Mệnh (`call_fate`)
Deterministic. Cần Mệnh hiệu dụng > 0 và mọi yêu cầu nhóm Tu vi / Mệnh hiệu dụng / Mệnh Cát-Bình / Tỷ lệ R của cấp đích đều đạt. Thiếu → nút khóa, hint ghi chính xác `label current/target`.

### PRG-BT-006 Dựng Neo (`anchor`)
Setup action. Cần ít nhất một **Neo hợp lệ** (`isValidHumanAnchor`, định nghĩa duy nhất ở [CHR-ANC-007](../character/human-anchor.md#chr-anc-007-dùng-trong-nghi-thức): `source: "npc_relationship"`, chưa vỡ, `stability > 0`). Nếu chưa có, mở chọn NPC từ `anchorCandidates()` và dựng bằng `establishHumanAnchor()` (tối đa 3 Neo hợp lệ) ngay tại tab Cảnh giới. Neo `legacy_anchor`/địa điểm/ký ức/lời thề không thỏa cổng này. Lý do từ chối: không có Neo → "Hãy chọn một NPC đủ tin cậy trong Nhân Duyên để dựng Neo Nhân Tính trước."; chỉ có Neo không hợp lệ → "Neo hiện tại không phải Neo Nhân Tính từ NPC; hãy chọn lại một NPC phù hợp."

### PRG-BT-007 Đối Chiếu Con Đường (`compare`)
Deterministic. Mọi yêu cầu nhóm Con Đường của cấp đích (điểm tương hợp, Mệnh dẫn, dẫn+trợ, Công Pháp Cốt Lõi, nghi thức Con Đường, Hợp nhất Công Pháp) phải đạt. Hint kèm gợi ý từ `suggestFateForRealmRequirement()` (tối đa 5 Mệnh chưa sở hữu, xếp theo mức tăng + nguồn kiếm).

### PRG-BT-008 Vượt Dị Tượng (`omen`) — roll duy nhất
`chance = clamp(82 − max(0, level − 8) × 8 + (Căn Cốt − 50) × 0.5 + (Ngộ Tính − 50) × 0.3 + lightningTribulationBonus, 10, 95)` (%), roll replay-deterministic theo cấp đích.
- Thành công: `bodyMindPassed = true`.
- Thất bại: không mất EXP/Tu vi; xác suất `min(80, 25 + 3 × level)`% mất 3 Thanh Tỉnh; Đạo Tâm −2 (lần thất bại liên tiếp thứ 3 trở đi −1 thêm); ghi `attemptLog`; được thử lại ngay, không cooldown.

### PRG-BT-009 Trả Giá (`cost`)
Cần Thanh Tỉnh ≥ 5; trừ đúng 5 Thanh Tỉnh, không hoàn lại kể cả khi không commit sau đó. Loại tài nguyên luôn là Thanh Tỉnh cho mọi Con Đường.

### PRG-BT-010 Thử Thách Cuối (`trial`, cấp 14 thường)
Qua khi `player.tainted.taintedGodDefeated` hoặc `flags.finalVictory`, hoặc nghề ẩn canonical là `luan_hoi_tien`. Là trận chiến/quest thật; không pass bằng cờ giả lập ngoài resolver.

### PRG-BT-011 Commit deterministic
`maybeBreakthrough()` kiểm lại toàn bộ `getBreakthroughBlockers()`; khi nghi thức đủ cổng thì commit không roll lần hai: `realmId` = cấp đích, `exp −= breakExp` (×5 với Ngoại Đạo Giả), cộng Thọ Nguyên ([PRG-RLM-005](realms-14.md)), `breakthroughRitual = null`, Đạo Tâm +2, ghi Tu Vi Thư, chạy mốc Tà Thần, trao Mệnh thưởng. `performBreakthroughRitualStep()` chỉ hoàn tất cổng; chỉ `maybeBreakthrough()` commit cảnh giới.

### PRG-BT-012 Từ chối không tiêu hao
Thiếu điều kiện Mệnh/Con Đường/Neo/cờ cấp → trả `{ changed: false, reason, blockers }`, không trừ EXP/SAN/tài nguyên.

### PRG-BT-013 Cưỡng ép đột phá
Chỉ được cưỡng ép khi thiếu điều kiện Mệnh Cát (`minNormalFate`) và nhân vật có kỹ thuật cho phép. Cấm Thuật chỉ được thay đổi một phần độ khó `omen`, không bỏ qua `call_fate`/`compare`. Mỗi lần cưỡng ép luôn tăng Corruption và Mệnh Nợ, lưu `fate_debt`, `san_cost`, `corruption_gain`, `anchor_impact`, kết quả roll vào `eventHistory`. Ngoại Đạo Giả không được cưỡng ép.

### PRG-BT-014 Khóa cấp cuối
Thiếu cờ chiến thắng ở cấp 14 → từ chối với code `FINAL_REALM_LOCKED_BY_ELDRITCH_GOD`, không tiêu hao. Ngoại Đạo Giả kiểm `unboundPathProven` thay thế.

### PRG-BT-015 Vòng đời trạng thái nghi thức
Trạng thái nghi thức chỉ hợp lệ khi `targetRealmId` trùng cấp kế tiếp; khác cấp thì bắt đầu lại từ đầu. Reset về `null` sau commit thành công hoặc khi Chuyển Đạo ([PATH-SEL-012](../path/path-selection.md)).

## Luồng

```text
EXP đủ → call_fate → anchor → [compare] → [omen] → [cost] → [trial]
→ currentGate = null → nút "Đột Phá" → maybeBreakthrough (validate lại) → commit + event log
```

## UI

| ID | Rule |
|---|---|
| PRG-BT-UI-001 | Action Bar chỉ hiện đúng 1 nút cho `currentGate`; khi `currentGate = null` mới hiện nút "Đột Phá" (tách khỏi nút cổng). Nút có subtext blocker; không cho bấm hành động chắc chắn thất bại, trừ `omen`. |
| PRG-BT-UI-002 | Modal giải thích cổng tự mở mỗi lần `currentGate` đổi (mọi lần đột phá, không chỉ lần đầu), hiển thị dữ liệu thật tại thời điểm đó; icon "?" mở lại. Checkbox tùy chọn "Không hiện lại ở lượt sau" theo cổng, mặc định không tick; tutorial không khóa action. |
| PRG-BT-UI-003 | Nội dung modal (ngôn ngữ thường): Gọi Mệnh = game tự so Tu Vi/Mệnh; Đối Chiếu = Mệnh/Công Pháp có hợp Con Đường không, bấm gợi ý để biết thứ cần kiếm; Dựng Neo = chọn NPC đủ tin cậy làm điểm tựa; Vượt Dị Tượng = bước duy nhất có thể thất bại, không mất Tu Vi, nên nghỉ nếu Thanh Tỉnh < 50%; Trả Giá = hiến 5 Thanh Tỉnh không hoàn lại. |
| PRG-BT-UI-004 | Dòng "Gợi Ý Nhanh" luôn hiện dưới cổng active, sinh từ `getBreakthroughBlockers()` + `suggestFateForRealmRequirement()`; không hiển thị gợi ý lỗi thời. |

## Acceptance

- Cấp 3–4 cần đúng 3 cổng; 5–10 cần 4; 11–13 cần 5; 14 thường cần 6; Ngoại Đạo Giả không có `compare`/`trial`.
- Chỉ `omen` có roll; sau khi đủ cổng, đột phá không roll lại và không trừ EXP lần hai.
- Thiếu `taintedGodDefeated` ở cấp 14 bị từ chối không mất tài nguyên.
- Công Pháp cấp cao không mở cảnh giới khi thiếu Mệnh.
- Gate: `node tools/verify_game.js`, `node tools/verify_progression_requirement_matrix.js`, `node tools/verify_cultivation_controls.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PRG-BT-001 | `js/engine.js:maybeBreakthrough`, `enterLuyenKhi` | Khớp |
| PRG-BT-002 | `js/engine.js:enterLuyenKhi`, action state `PATH_CHOICE` | Khớp |
| PRG-BT-003 | `js/engine.js:breakthroughRitualPlan` | Khớp |
| PRG-BT-004 | `js/engine.js:performBreakthroughRitualStep`, `BREAKTHROUGH_RITUAL_LABELS` | Khớp |
| PRG-BT-005 | `js/engine.js:breakthroughRitualGateRequirements` | Khớp |
| PRG-BT-006 | `js/engine.js:performBreakthroughRitualStep` (`anchor.source === "npc"` → dùng `isValidHumanAnchor`), `breakthroughRitualGateHint` | Lệch |
| PRG-BT-007 | `js/engine.js:suggestFateForRealmRequirement` | Khớp |
| PRG-BT-008 | `js/engine.js:performBreakthroughRitualStep` (omen); phạt thêm −1 Đạo Tâm từ lần thứ 3 chưa có | Lệch |
| PRG-BT-009 | `js/engine.js:performBreakthroughRitualStep` (cost) | Khớp |
| PRG-BT-010 | `js/engine.js:performBreakthroughRitualStep` (trial) | Khớp |
| PRG-BT-011 | `js/engine.js:maybeBreakthrough` | Khớp |
| PRG-BT-012 | `js/engine.js:getBreakthroughBlockers` | Khớp |
| PRG-BT-013 | — | Thiếu |
| PRG-BT-014 | `js/engine.js:maybeBreakthrough` (chỉ trả text, không có code) | Lệch |
| PRG-BT-015 | `js/engine.js:breakthroughRitualStatus` | Khớp |
| PRG-BT-UI-001..004 | `js/ui.js`, `js/main.js`; `flags.ritualTutorial` được migrate (`js/engine.js:deserialize`) nhưng không có `data-ritual-tutorial` | Lệch |
