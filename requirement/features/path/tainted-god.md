# Path — Tà Thần & trận doanh

## Mục đích

Các mốc Tà Thần chú ý (5/8/11/13), ba trận doanh Thiên Đạo, đổi phe, Thôn Phệ Thiên Đạo và khóa cấp 14. Hợp đồng liên feature Tà Thần × Công Pháp × Mệnh nằm ở [../cross-system/README.md](../cross-system/README.md).

## Dữ liệu & trạng thái

```js
state.player.tainted = { attention, attentionPending, vocation: "blessing"|"suspicion"|"indifference",
  faction: "loyal_heaven"|"rebel_heaven"|"neutral"|null, patron, factionPending, factionMultiplier,
  quests, questsActive, staminaPenalty, finalConflictPreparation, taintedGodDefeated,
  rewards: { heaven_merit, heaven_seal, balance_token, ... }, factionChangeQuestGranted, factionChangeQuestCompleted }
```
`data/path_fate_relations.json:tainted_intervention` (mốc, hệ số phe, `quest_merit_range [1,3]`, `rebel_exp_multiplier 0.8`, `neutral_pursuit_rate 0.5`); `hidden_fates.thon_phe_thien_dao`.

## Rules

### PATH-TG-001 Phạm vi
Áp dụng cho Con Đường thường, Nghịch Hành và mọi nghề ẩn, trừ Luân Hồi Tiên (chuỗi quest luân hồi riêng) và Ngoại Đạo Giả ([PATH-UNB-007](ngoai-dao-gia.md)). Tà Thần không scale theo người chơi, không phải "cấp 15".

### PATH-TG-002 Bốn mốc bắt buộc
| Cấp | Sự kiện |
|---:|---|
| 5 | Tà Thần chú ý lần đầu; người chơi chủ động chọn một kết quả dị hóa, lưu vĩnh viễn |
| 8 | Chọn trận doanh; mở chuỗi quest Tà Thần liên tục |
| 11 | Can thiệp tăng cường: quest khó hơn, kiểm Mệnh thường hơn, mở ưu quyền cấp cao |
| 13 | Bắt đầu quyết chiến, chuẩn bị điều kiện cấp 14 (`finalConflictPreparation`) |

Mốc chỉ chạy tại 5/8/11/13 (ghi bởi `recordTaintedMilestones` khi đột phá); không dùng mốc cũ.

### PATH-TG-003 Lựa chọn dị hóa cấp 5
Chọn đúng một, xác nhận một lần, không hiển thị lại khi load; UI cho xem đầy đủ lợi ích, hình phạt, liên kết Tà Thần trước khi xác nhận.

| Lựa chọn | Hiệu ứng |
|---|---|
| `blessing` (Ban Phước) | PHY +3, MAG +3; luôn để lại liên kết Tà Thần |
| `suspicion` (Nghi Kỵ) | Sát −5; phạt Stamina 15; có thể tăng Corruption/Mệnh Nợ |
| `indifference` (Hờ Hững) | Không cộng stat; phạt Stamina 15 |

Đạo Tâm ≤ 20 tăng tỷ lệ kết quả bất lợi ở các mốc ([PRG-CUL-006](../realm-progression/exp-and-cultivation.md)).

### PATH-TG-004 Chọn trận doanh
Từ cấp 8; ID runtime `loyal_heaven`, `rebel_heaven`, `neutral` (tên hiển thị không thay ID trong save/điều kiện Công Pháp). Chọn xong khóa; phần thưởng chọn phe trao qua `grantCanonicalReward` một lần.

### PATH-TG-005 Ba trận doanh
| | Trung Thành Thiên Đạo (`loyal_heaven`) | Phản Bội Thiên Đạo (`rebel_heaven`) | Trung Gian (`neutral`) |
|---|---|---|---|
| Khi chọn | `heaven_merit` +1, Thiên Đạo Hộ Ấn (`heaven_seal`) | Khế ước với 1 trong 4 Tà Thần (`patron`, chọn hoặc roll) | `balance_token` +1 |
| Can thiệp Tà Thần | Nghi Kỵ ×2 | — | Hờ Hững ×2 |
| Hệ số EXP | ×1,05 | ×0,8 (Linh Khí/EXP) | ×1 |
| Nguồn lợi | `heaven_merit` khi phá quest Tà Thần, cứu Neo, bảo vệ phàm giới | Mệnh dị hóa, Cấm Thuật, quyền triệu hồi | Tăng 10% tỷ lệ Mệnh phù hợp đường |
| Danh hiệu | Từ cấp 8 mỗi cấp một danh hiệu nhỏ (PHY/MAG nhẹ, giảm Stamina cost); cấp 11 Hộ Đạo Linh Khí; cấp 13 Thiên Mệnh Chiếu Lệnh | Từ cấp 8 mỗi cấp một danh hiệu (nhiều stat hơn, tăng Stamina cost) | Chỉ 3: Ẩn Thế (8), Chân Giả (11), Chí Tôn (13), mạnh hơn hai phe |
| Cấp 11 | Miễn `FATE_BACKFIRE` (không miễn SAN/Corruption) | Bỏ giới hạn inventory thường và khóa Cấm Thuật (Mệnh Kho vẫn giới hạn) | — |
| Truy sát | Ma Đầu, Phản Bội Giả, Ma Sứ | Hộ Đạo Giả | Cả hai phía, tần suất 50% |
| Ràng buộc | — | Corruption và nghĩa vụ quest cao nhất; khóa phe tới hết kiếp | — |

### PATH-TG-006 Công Đức quest
Mỗi quest Tà Thần/Thiên Đạo trao Công Đức roll trong `quest_merit_range` (mặc định 1–3), không cộng cố định; idempotent theo khóa quest.

### PATH-TG-007 Đổi phe
- Trung Thành/Trung Gian: chỉ qua quest chuyển hóa do thực thể liên quan phát, phải hoàn thành quest.
- Phản Bội: khóa tới hết kiếp; chỉ xét sau cái chết hợp lệ/luân hồi và phải trả 10 Công Đức chuộc tội.
- Thành công nhận một Ban Phước phe mới (PHY/MAG +2; `heaven_seal` nếu sang Thiên Đạo; +1 `balance_token` nếu sang Trung Gian).

### PATH-TG-008 Thôn Phệ Thiên Đạo
Ở cấp 13, mọi đường/nghề ẩn/trận doanh (trừ Luân Hồi Tiên, Ngoại Đạo Giả) có thể mở chuyển hóa `thon_phe_thien_dao` khi: bộ Mệnh đang gắn có ≥ 1 Mệnh dẫn của `tinh_tuong_dao` và ≥ 1 Mệnh dẫn của `phong_thuy_dao`; `match_score` mỗi nhánh ≥ 3 và không bị Mệnh cấm lấn át; đã xong nghi thức cấp 13 và `finalConflictPreparation = true`. Không xóa lịch sử đường cũ. Sau khi thắng Tà Thần có thể hấp thu một phần luật trời; mỗi lần dùng tăng Corruption và Mệnh Nợ. Thất bại khóa vĩnh viễn lối Thôn Phệ trong kiếp hiện tại (không khóa các lối cấp 14 khác trừ khi quest ghi rõ).

### PATH-TG-009 Khóa cấp cuối
Không vào cấp 14 chỉ bằng EXP/Mệnh/Công Pháp. Phải hoàn tất chuỗi chuẩn bị quyết chiến, đạt mọi điều kiện cấp/đường, đánh bại Tà Thần đã khóa làm đối thủ (hoặc đối đầu tương đương theo trận doanh) và ghi `taintedGodDefeated = true` cùng chiến thắng vào lịch sử. Thiếu cờ → [PRG-BT-014](../realm-progression/breakthrough.md).

## Acceptance

- Lựa chọn cấp 5 và trận doanh cấp 8 không lặp lại khi load save.
- Ngoại Đạo Giả và Luân Hồi Tiên không nhận event nào của file này.
- Phản Bội cấp 11 bỏ khóa inventory thường nhưng Mệnh Kho vẫn giới hạn.
- Gate: `node tools/verify_game.js`, `node tools/verify_canonical_contracts.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PATH-TG-001 | `js/engine.js:excludedFromTainted` | Khớp |
| PATH-TG-002 | `js/engine.js:recordTaintedMilestones` | Khớp |
| PATH-TG-003 | `js/engine.js:chooseTaintedAttention` (Nghi Kỵ chưa tăng Corruption/Mệnh Nợ) | Lệch |
| PATH-TG-004 | `js/engine.js:chooseTaintedFaction`, `grantTaintedRewardCanonical` | Khớp |
| PATH-TG-005 | `js/engine.js:factionStatus` (danh hiệu Thiên Đạo/Phản Bội sinh tên số thứ tự; miễn `FATE_BACKFIRE` cấp 11 chưa có) | Lệch |
| PATH-TG-006 | `js/engine.js:grantQuestMerit` | Khớp |
| PATH-TG-007 | `js/engine.js:switchTaintedFaction` | Khớp |
| PATH-TG-008 | `js/engine.js:canUnlockDevourHeaven` (so khớp regex tag thay vì Mệnh dẫn + `match_score ≥ 3`; chưa có resolver hấp thu/khóa khi thất bại) | Lệch |
| PATH-TG-009 | `js/engine.js:maybeBreakthrough`, `performBreakthroughRitualStep` (trial) | Khớp |
