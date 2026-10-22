# Realm Progression — Bế Quan

## Mục đích

Tu luyện kéo dài có phiên (Bế Quan): thời lượng, hệ số, rủi ro khi không phòng bị, thoát sớm và ràng buộc an toàn. Nguồn EXP chung và Tẩu Hỏa nằm ở [exp-and-cultivation.md](exp-and-cultivation.md).

## Dữ liệu & trạng thái

```js
state.player.secludedSession = {
  id, status: "active" | "completed" | "stopped" | "interrupted",
  locationId, startedDay, totalDays, completedDays,
  multiplier, riskRolls: { echo: null, intrusion: null },
  result: { cultivated, completedDays, gainedExp } | null,
  interruptedBy: null, stoppedDay, completedDay
}
state.autoCultivation = { mode: "be_quan", hours, completed, rested, reason, turn, locationId }   // Bế Quan theo giờ
```

## Rules

### PRG-SEC-001 Bế Quan theo giờ
`secludedCultivation(state, hours)`: 1–8 giờ; chỉ tại location có Tà Nhiễm ≤ 2, không khi đang giao chiến hoặc `pendingEnding`. Mỗi giờ quy đổi thành số chu kỳ tự động tu luyện theo `GAME_TIME_CONFIG.realSecondsPerGameDay`; ghi `state.autoCultivation`.

### PRG-SEC-002 Phiên Bế Quan theo ngày
`startSecludedCultivation(state, days)`: `days` 1–30 (client chỉ gửi `hours` thì quy đổi qua GameClock). Chỉ một phiên `active`; không mở khi giao chiến/`pendingEnding`. Mỗi ngày phiên chạy 6 chu kỳ tu luyện và tiến 1 ngày game; phiên kết thúc (`completed`) khi đủ ngày, khi Mất Trí, khi hành trình kết thúc hoặc khi đã đủ điều kiện đột phá.

### PRG-SEC-003 Hệ số theo thời lượng
| Thời lượng | Hệ số EXP |
|---|---:|
| 1–5 ngày | ×1,5 |
| 6–15 ngày | ×2,0 |
| 16–30 ngày | ×3,0 |

### PRG-SEC-004 Rủi ro khi nhập định
- 6–15 ngày: 10% bị "Tiếng Vọng Từ Ngoài Kia" ghé thăm; không chọn nhánh, tự nhận kết quả xấu nhất trong ba lựa chọn.
- 16–30 ngày: 25% bị NPC/quái thù địch đột nhập; combat tự động với chỉ số −50%.
- Location có `ownerFactionId` trùng thế lực player đang phục vụ: giảm một nửa cả hai rủi ro.
- Mỗi phiên roll mỗi mốc đúng một lần, lưu vào `riskRolls` để reload không roll lại; bị gián đoạn → `status = "interrupted"`, `interruptedBy`.

### PRG-SEC-005 Khóa action khi Bế Quan
Phiên `active` khóa action chủ động; chỉ cho `stop` và phản ứng hệ thống.

### PRG-SEC-006 Thoát sớm
`stopSecludedCultivation(state)` dừng phiên `active` bất cứ lúc nào: giữ Tu vi tương ứng số ngày đã chạy, không phạt; `status = "stopped"`. `secludedCultivationStatus(state)` trả bản sao phiên hoặc `{ status: "idle" }`.

### PRG-SEC-007 Không nhân đôi khi reload
Reload giữa phiên không cộng lại EXP của ngày đã chạy và không roll lại rủi ro đã lưu.

## Acceptance

- Bế Quan 1–30 ngày, thoát sớm đúng tỷ lệ, không nhân đôi phần thưởng khi reload.
- Không thể Bế Quan tại nơi Tà Nhiễm > 2 (theo giờ) hoặc khi đang giao chiến.
- Gate: `node tools/verify_cultivation_controls.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PRG-SEC-001 | `js/engine.js:secludedCultivation` | Khớp |
| PRG-SEC-002 | `js/engine.js:startSecludedCultivation`, `advanceSecludedCultivation` | Khớp |
| PRG-SEC-003 | — (không áp hệ số) | Thiếu |
| PRG-SEC-004 | — (không có `riskRolls`) | Thiếu |
| PRG-SEC-005 | `js/engine.js` action state khi `secludedSession.status === "active"` | Khớp |
| PRG-SEC-006 | `js/expansion.js:stopSecludedCultivation`, `secludedCultivationStatus` | Khớp |
| PRG-SEC-007 | `js/engine.js:advanceSecludedCultivation` (tích lũy theo ngày) | Khớp |
