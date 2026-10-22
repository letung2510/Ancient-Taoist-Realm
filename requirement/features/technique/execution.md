# Công Pháp — Thi triển (Preview / Prepare / Channel / Commit)

## Mục đích

Transaction thi triển Công Pháp: preview thuần, commit nguyên tử, Prepare/Channel/Cancel, target, receipt, replay và save. Cost/stance ở [eligibility-and-cost.md](eligibility-and-cost.md); xác nhận nguy hiểm ở [cam-thuat.md](cam-thuat.md); hiển thị ở [ui.md](ui.md).

## Dữ liệu & trạng thái

- `player.techniques[id].combatState`: `prepared`, `preparedActionId`, `preparedTurn`, `preparedStance`, `preparedTargetId`, `channelProgress`, `cooldownRemaining`, `lastResolvedActionId`.
- `player.techniqueActionSequence`, `player.techniqueActionReceipts` (64), `techniqueActionReceiptHighWater`, `player.techniquePrepareReceipts` (64).
- Payload UI: `{ techniqueId, phase, stance, targetId, actionId, confirmed }`, `phase ∈ preview/prepare/channel/commit/cancel`.

## Rules

### Transaction

| ID | Rule |
|---|---|
| TEC-003 | `techniquePreview()` thuần: không trừ tài nguyên, không tăng mastery, không ghi receipt, không gọi RNG commit, không thêm vào `player.techniques`. |
| TEC-004 | Preview và commit dùng chung access resolver, cost calculator, resonance resolver và seed. Commit làm mới context và xác thực lại; nếu state đổi giữa preview và click (Fate, membership, turn…), engine resolve lại và UI hiển thị lại nếu cost/effect đổi. |
| TEC-005 | Kiểm tra toàn bộ blocker/tài nguyên/target/cooldown trước mutation. Lỗi trước commit không đổi resource, cooldown, mastery. Mọi thay đổi sau điểm commit là một transaction nguyên tử. |
| TEC-006 | UI không tự tính damage, cost, cooldown, eligibility, rank hay resonance và không tự sinh gameplay action ID (lấy qua `nextTechniqueActionId`); UI chỉ gửi payload ở mục Dữ liệu. |
| TEC-007 | `learn`, `training`, `prepare`, `channel`, `use` (commit), `cancel`, `evolve` là phase riêng; hợp lệ ở phase này có thể bị chặn ở phase khác. |
| TEC-009 | Mọi roll dùng seed từ `turn`, `actionId`, `techniqueId`, `targetId`, replay seed. Cấm `Math.random()`/`Date.now()` trong resolver. |
| TEC-109 | Cast làm Thanh Tỉnh về 0 là transaction đã commit: kích hoạt Mất Trí, trả `committed: true, outcome: madness`; caller không retry. |
| TEC-10A | Target: `chieu_thuc`/`cam_thuat` cần target/encounter (mặc định enemy đầu hoặc mở combat); preview và commit dùng cùng target policy. Không có target → `outcome: no_target`, không tăng combat mastery. |

### Luồng Instant và Prepare/Channel

| ID | Rule |
|---|---|
| TEC-100 | Mỗi Công Pháp có một action canonical; Prepare/Tụ lực, Channel, Commit, Cancel là phase của cùng action, không phải skill/reward mới và không tạo receipt effect lần hai. |
| TEC-101 | **Instant:** bấm Dùng → inline picker Ổn định/Bộc phát/Hộ thể (preview cost + cooldown + blocker từng thế) → bấm thế → commit KHÔNG dialog xác nhận (trừ danger sheet TEC-108) → narrative kết quả + cooldown. |
| TEC-102 | **Prepare/Channel:** chỉ Công Pháp có `preparation.enabled`/`prepareCost`. Picker thêm Tụ lực → Prepare (trừ `prepareCost` một lần) → Channel/hủy → Commit effect cuối. Công Pháp không có preparation dùng instant; không hiển thị Prepare giả; `technique_prepare` gọi cho instant chuyển sang instant-use. |
| TEC-103 | `technique_prepare` khi chưa `confirmed` là preview read-only; chỉ khi xác nhận mới trừ cost và ghi receipt `player.techniquePrepareReceipts[actionId]` (giữ 64 gần nhất). Prepare lặp cùng actionId trả receipt cũ. Không Prepare khi đang cooldown hoặc đã prepared. |
| TEC-CH-001 | **Channel theo lượt game.** `channelTurns = max(1, floor(preparation.turns))` (Công Pháp có `prepareCost` nhưng `turns` thiếu/0 → 1 lượt). Với `elapsed = max(0, turn − preparedTurn)`: `channelProgress = min(1, elapsed / channelTurns)` là giá trị **suy ra** (không cộng dồn theo nút), `ready ⇔ elapsed ≥ channelTurns`. `turn` = `state.meta.turn`, chỉ tăng qua action tiêu lượt của `submitTurn`; Prepare ghi `preparedTurn = turn` lúc trừ `prepareCost` (elapsed = 0 ngay sau Prepare, nên Công Pháp 1 lượt phải qua ≥ 1 action tiêu lượt mới `ready`). Nút **Vận công** (`technique_channel`) là action chờ tiêu đúng 1 lượt game (đi qua `submitTurn`, địch hành động bình thường nếu đang combat); số lần bấm không tăng tiến độ ngoài số lượt thực trôi qua; tham số `delta`/`+25%` bị xóa. `advanceTechniqueChannel(state, id)` chỉ đồng bộ `combatState.channelProgress` từ công thức trên (idempotent, trả `{ success, techniqueId, elapsed, required, channelProgress, ready }`); đồng bộ cũng chạy khi load và khi `useTechnique` kiểm `ready`. Turn bị rollback (action tiêu lượt thất bại) tự co elapsed lại. Gián đoạn: chỉ khi `preparation.interruptible !== false`, thì `endCombat` (hết/thoát combat) và đổi node hủy qua `cancelTechniquePreparation(state, id, "interrupted")` theo `refundPolicy` (TEC-105); nhận sát thương không tự hủy. Migration save cũ: `prepared` mà `preparedTurn == null` → `preparedTurn = turn − round(channelProgress × channelTurns)`; `preparedTurn` có sẵn giữ nguyên và `channelProgress` lưu cũ bị ghi đè bằng giá trị suy ra. |
| TEC-104 | Commit sau Prepare yêu cầu: `prepared`, channel hoàn tất (TEC-CH-001), cùng `preparedActionId` (nếu gửi), cùng stance và target đã chuẩn bị. |
| TEC-105 | Cancel/Interrupt: xóa preparation (prepared/stance/target/channel), hoàn theo `refundPolicy` (`none` mặc định; `half`/`full`/object theo lý do), cập nhật receipt `cancelled` kèm refund; không xóa receipt commit khác. Cấm Thuật cancel channel không hoàn cost đã trả. |
| TEC-106 | Save/load giữ nguyên `combatState`. Commit thành công reset preparation. |
| TEC-107 | **Huyền Môn Trận Giải** (`huyen_mon_tran_giai`, `tran_phap`, thổ) là Công Pháp có preparation: `preparation.turns = 1`, `prepareCost` 4 Linh Khí + 1 Thể Lực, gián đoạn được, không hoàn. |

### Receipt, replay và save

| ID | Rule |
|---|---|
| TEC-110 | UI cast bắt buộc actionId ổn định `technique-ui:N` (N tăng đơn điệu, `player.techniqueActionSequence`). Legacy call không có ID dùng khóa theo lượt `turn:<turn>:technique:<id>`, không timestamp/random. |
| TEC-111 | Ledger `player.techniqueActionReceipts` giữ 64 action gần nhất; high-water `techniqueActionReceiptHighWater`. Replay ID còn giữ → trả receipt gốc (`duplicate: true`), không cost/effect/mastery. Replay `technique-ui:N ≤ highWater` đã bị evict → reject, không cost/effect. Cùng ID nhưng khác technique/stance/target → reject (duplicate action). |
| TEC-112 | Action receipt: `actionId`, `techniqueId`, `stance`, `targetId`, `phase`, `fateSourceIds`, `inputHash`, `seed`, `costs`, `outcome`/`success`, `backlash`, `turn`, `status`. Acquisition/fusion/evolution dùng receipt riêng cùng shape `kind`. |
| TEC-113 | Save/load serialize: action receipts, sequence, high-water, prepare receipts, cooldown, preparation, mastery, evolution, acquisition receipts. Save cũ thiếu marker giữ hành vi trung tính và progress đã học. Offline replay cho kết quả giống online. |
| TEC-114 | Phản phệ dùng seed `technique-backlash:<actionId>`, ghi vào receipt, không roll lại khi replay. |

## Acceptance

| ID | Kịch bản | Kỳ vọng | Gate |
|---|---|---|---|
| RG-12 | Prepare → Channel → Commit, cancel, save/load giữa channel | đúng TEC-102..106, TEC-CH-001; Huyền Môn Trận Giải 4+1, hoàn tất sau 1 lượt | `verify_technique_channel_matrix.js` |
| RG-12a | `huyen_mon_tran_giai` (`turns: 1`), turn 10: Prepare (−4 Linh Khí, −1 Thể Lực, `preparedTurn = 10`) | `elapsed 0`, `channelProgress 0`; Commit bị chặn "Công pháp vẫn đang vận công (0/1 lượt)" | `verify_technique_channel_matrix.js` |
| RG-12b | Tiếp: bấm Vận công (turn 11); gọi `advanceTechniqueChannel` hai lần liên tiếp | `elapsed 1`, `channelProgress 1`, `ready`; hai lần gọi cho cùng kết quả; Commit thành công, `preparedTurn` reset | `verify_technique_channel_matrix.js` |
| RG-12c | Công Pháp `turns: 3`, Prepare turn 5; save/load ở turn 7 | `elapsed 2`, `channelProgress 0,667` sau load; turn 8 → `ready` | `verify_technique_channel_matrix.js` |
| RG-12d | Save cũ `prepared: true`, `preparedTurn: null`, `channelProgress 0,5`, `turns 2`, turn 20 | sau load `preparedTurn = 19` | `verify_save_envelope.js` |
| RG-15 | Replay cùng actionId / evicted / khác stance-target | duplicate, không cộng kép; evicted reject | `verify_review_batches.js` |
| RG-19 | Offline save/load, migration | replay giống online; không reset mastery/cooldown; legacy round-trip có diagnostic | `verify_offline_parity.js`, `verify_save_envelope.js` |

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| TEC-003, 004, 005 | engine.js:`techniquePreview`, `resolveTechniqueExecutionInputs`, `useTechnique` | Khớp | transaction snapshot trước commit |
| TEC-006 | main.js:`commitTechniqueAction`; expansion.js:`nextTechniqueActionId` | Khớp | |
| TEC-009, 114 | engine.js:`replayRandom("technique-backlash:"…)`, `replayInt` | Khớp | |
| TEC-024, 109 | engine.js:`useTechnique` | Khớp | |
| TEC-101 | main.js:`commitTechniqueAction`, inline picker | Khớp | |
| TEC-102, 103, 104, 105, 106 | engine.js:`prepareTechnique`, `advanceTechniqueChannel`, `cancelTechniquePreparation`; expansion.js:`runExpansionCommand.technique_prepare` | Khớp | |
| TEC-107, TEC-CH-001 | data/cong_phap.js:`huyen_mon_tran_giai`; engine.js:`advanceTechniqueChannel`, `useTechnique` (`channelProgress < 1`), `normalizeTechniqueProgress`/`ensureTechniqueCombatState` (migration `preparedTurn`), `endCombat`, `move`; expansion.js:`runExpansionCommand.technique_channel` (phải đi qua action tiêu lượt); ui.js:`techniqueChannelControls` | Lệch | data đúng 4+1/1 lượt; `preparation.turns` không được dùng — channel tăng theo nút (`+25%`/lần, `channelProgress + delta`), không gắn lượt |
| TEC-10A | engine.js:`useTechnique` | Khớp | |
| TEC-110, 111, 113 | engine.js:`useTechnique`; expansion.js:`nextTechniqueActionId` | Khớp | |
| TEC-111 (target) | engine.js:`useTechnique` (so receipt) | Lệch | chỉ so technique + stance, không so `targetId` |
