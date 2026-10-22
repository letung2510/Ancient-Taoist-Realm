# Cross-system — Tông Môn Đại Hội

## Mục đích

Đại Hội tông môn là sự kiện thế giới định kỳ có bracket tương tác bốn vòng; nối membership tông môn, sức mạnh/độ thành thạo Công Pháp, thể lực, tick thế giới và receipt phần thưởng.

## Dữ liệu & trạng thái

```js
state.worldSimulation.tournament = {
  id, startDay, registrationEndDay /* start + 3 */, endDay /* start + 10 */,
  status: "open"|"registration"|"in_progress"|"completed"|"incomplete"|"closed"|"legacy_completed",
  joined, playerId, seed, currentRound, roundsWon,
  rounds: [{ id: "preliminary"|"quarter_final"|"semi_final"|"final", index,
             opponentId /* seed */, intervention, result, resolvedDay }],
  rewardReceiptId, closedDay
}
```

## Rules

| ID | Rule |
|---|---|
| CSX-TRN-001 | Đăng ký chỉ trong cửa sổ đến `registrationEndDay` (ngày 3) và chỉ khi có `guildMembership`; tham gia lưu bracket seed và snapshot đối thủ. Sự kiện đóng ở ngày 10. |
| CSX-TRN-002 | Bốn vòng: sơ loại, tứ kết, bán kết, chung kết. Mỗi vòng người chơi can thiệp đúng một lần, chọn `aggressive` / `read` / `conserve`; commit một lần theo `(tournamentId, roundId)`, kết hợp sức mạnh người chơi, độ thành thạo Công Pháp, thể lực và sức mạnh đối thủ deterministic. |
| CSX-TRN-003 | `aggressive`: tăng lợi thế/tỉ lệ thắng nhưng có thể bị thương nhẹ. `read` ("Quan Sát Đối Thủ"): thắng thì vòng sau có lợi thế nhỏ. `conserve`: hồi thể lực nhưng giảm lợi thế vòng này. |
| CSX-TRN-004 | Thua kết thúc tham gia; thắng tiến đúng một vòng. Chỉ nhà vô địch quyết toán phần thưởng qua receipt canonical đúng một lần (EXP, công lao, contribution tông môn); ghi thứ hạng, contribution, thương tích và log. Không phát thẳng Công Pháp Tiên Phẩm. |
| CSX-TRN-005 | Tick thế giới tiến hạn; người tham gia chưa xong khi hết hạn bị đóng (`incomplete`) không thưởng. |
| CSX-TRN-006 | Validator save kiểm tra hình dạng bracket, thứ tự vòng, `completed` phải có `rewardReceiptId`. Save cũ dạng một lượt (`joined`/`roundsWon`) chuyển `legacy_completed`, không nhận thưởng bracket lần nữa. |
| CSX-TRN-007 | Tab Thế Sự hiện trạng thái, đối thủ, preview, lựa chọn và lịch sử vòng. |

## Acceptance

- Reload giữa vòng không đổi đối thủ/kết quả; bấm lặp cùng vòng không commit hai lần; phần thưởng chỉ một receipt.
- Gate: `verify_review_batches.js`, `verify_world_producer_matrix.js`, `verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-TRN-001 | expansion.js: `tournament.registrationEndDay = day + 3`, `endDay = day + 10`, `act_exp_tournament_join` | Khớp |
| CSX-TRN-002/003 | expansion.js: `tournament.rounds` (4 vòng), `act_exp_tournament_round_*` | Khớp |
| CSX-TRN-004 | expansion.js:`grantCanonicalReward("tournament:<id>")` | Khớp |
| CSX-TRN-005/006 | expansion.js: status `incomplete`/`legacy_completed`, check `reward-receipt` | Khớp |
| CSX-TRN-007 | ui.js: tournament panel | Khớp |
