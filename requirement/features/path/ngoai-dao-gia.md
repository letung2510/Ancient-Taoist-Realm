# Path — Ngoại Đạo Giả (Kẻ Vô Lộ)

## Mục đích

Lộ trình độc lập cho nhân vật không đi Con Đường thường: không cần Mệnh dẫn, không dính hệ Tà Thần/trận doanh, đổi lại thăng cấp khắc nghiệt hơn và có bốn thử thách Vô Lộ riêng.

## Dữ liệu & trạng thái

```js
state.player.pathId = "ngoai_dao_gia"; state.player.unbound = true; state.player.pathNamespace = "unbound"
state.pathState.unbound = true; state.pathState.primaryPathId = null
state.player.unboundTrials = { selfProof, severLaw, establishPath }; state.player.unboundPathProven = false
```
`data/path_fate_relations.json:paths.ngoai_dao_gia = { unbound: true, exp_multiplier: 5, fate_threshold_multiplier: 2, check_difficulty_bonus: 15, excluded_from_tainted_system: true }`.

## Rules

### PATH-UNB-001 Lựa chọn tại Khai Lộ
Ngoại Đạo Giả luôn có trong lựa chọn đường ở cấp 2 (không cần Mệnh dẫn, không hiến tế Mệnh), trừ khi nhân vật đã có nghề ẩn. Là lộ trình chính thức, không phải trạng thái chờ tìm nghề. Hiển thị "Kẻ Vô Lộ — Ngoại Đạo Giả"; namespace `unbound`, không thuộc mười đường chính.

### PATH-UNB-002 Migration
Save cũ chỉ có `pathState.unbound = true` được bổ sung `pathId = "ngoai_dao_gia"`, `unbound`, `pathNamespace`.

### PATH-UNB-003 EXP ×5
EXP cần cho mọi lần đột phá = 5 × `breakExp` chuẩn của cùng cấp.

### PATH-UNB-004 Ngưỡng Mệnh ×2
Mọi ngưỡng `minFate` (so với Mệnh hiệu dụng) và `minNormalFate` nhân đôi. Bỏ qua mọi điều kiện gắn với `requiredPathScore`, Mệnh dẫn/trợ, trận doanh, Tà Thần và `taintedGodDefeated`; mọi điều kiện nền khác (Neo, Công Pháp Cốt Lõi, Tà Nhiễm, đại nghi thức, Chân Danh…) vẫn áp dụng.

### PATH-UNB-005 Kiểm tra khắc nghiệt
Từ cấp 3, mọi lần đột phá phải vượt cả kiểm tra thân và tâm; độ khó mỗi kiểm tra +15 (áp vào cổng Vượt Dị Tượng). Không được dùng Cấm Thuật, hiến tế Mệnh hoặc quyền miễn điều kiện để bỏ qua cổng.

### PATH-UNB-006 Nghi thức
Chuỗi `call_fate → anchor → omen` (cấp đích 3–10), thêm `cost` (11–14); không có `compare` và không có `trial` Tà Thần ([PRG-BT-003](../realm-progression/breakthrough.md)).

### PATH-UNB-007 Miễn hệ Tà Thần
Không thực hiện bất kỳ action, lựa chọn, quest, chọn phe, danh hiệu, phần thưởng, truy sát hay khóa cấp nào của [tainted-god.md](tainted-god.md); không mở Thôn Phệ Thiên Đạo; bước event mốc trận doanh trong lượt bị bỏ qua.

### PATH-UNB-008 Độc quyền
Không đồng thời mang Con Đường thường hoặc nghề ẩn. Muốn nhận nghề/đường khác phải rời Ngoại Đạo Giả qua quest chuyển đường và mất toàn bộ EXP của cấp hiện tại.

### PATH-UNB-009 Danh xưng
Giữ tên cảnh giới mặc định mọi cấp ([PATH-TTL-002](path-titles.md)).

### PATH-UNB-010 Bốn thử thách Vô Lộ
| Cấp đích | ID | Tên | Mở từ cấp | Field |
|---:|---|---|---:|---|
| 8 | `self_proof` | Tự Chứng | 7 | `unboundTrials.selfProof` |
| 11 | `sever_law` | Đoạn Luật | 10 | `unboundTrials.severLaw` |
| 13 | `establish_path` | Lập Đạo | 12 | `unboundTrials.establishPath` |
| 14 | `prove_unbound` | Vô Lộ Chứng Đạo | 13 | `unboundPathProven` |

Thay cho điều kiện trận doanh ở cấp 8/11/13 và cờ chiến thắng Tà Thần ở cấp 14. Expose trên Action Bar bằng `act_exp_unbound_trial:<id>`, xuất hiện trong `breakthroughRequirements` để UI không báo sẵn sàng giả. Nguồn sự thật duy nhất là `UNBOUND_TRIAL_DEFINITIONS` + `UNBOUND_TRIAL_BY_TARGET_LEVEL`; `breakthroughRequirements`, `maybeBreakthrough`, `expansionActions` đọc qua `unboundTrialStatus()`, không tự khai báo lại bảng.

## Acceptance

- Nhân vật không có Mệnh dẫn chọn được Ngoại Đạo Giả ở cấp 2 mà không hiến tế Mệnh.
- Cần EXP ×5, ngưỡng Mệnh ×2, không nhận event Tà Thần nào; cấp 14 kiểm `unboundPathProven`.
- Có nghề ẩn → không chọn được Ngoại Đạo Giả.
- Gate: `node tools/verify_progression_requirement_matrix.js`, `node tools/verify_game.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PATH-UNB-001 | `js/engine.js:selectPath`, `availablePaths`, `PATH_LABELS` | Khớp |
| PATH-UNB-002 | `js/engine.js:deserialize` | Khớp |
| PATH-UNB-003, 004 | `js/engine.js:breakthroughRequirements`, `maybeBreakthrough` | Khớp |
| PATH-UNB-005 | `js/engine.js:performBreakthroughRitualStep` (omen không cộng +15 cho Ngoại Đạo Giả) | Lệch |
| PATH-UNB-006 | `js/engine.js:breakthroughRitualPlan` | Khớp |
| PATH-UNB-007 | `js/engine.js:excludedFromTainted`, `factionStatus` | Khớp |
| PATH-UNB-008 | `js/engine.js:selectPath` (chặn nghề ẩn); quest rời lộ trình chưa có | Lệch |
| PATH-UNB-010 | `js/engine.js:UNBOUND_TRIAL_DEFINITIONS`, `unboundTrialStatus`, `completeUnboundTrial`; `js/expansion.js` action `act_exp_unbound_trial` | Khớp |
