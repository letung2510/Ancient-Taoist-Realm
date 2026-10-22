# Mô phỏng thế giới — Thế lực, ngoại giao, chiến tranh

## Mục đích

Thế lực tự vận động theo tick: căng thẳng ngoại giao giữa thế lực giáp ranh, chiến tranh có điểm số và cascade một lần, biến cố nội bộ; UI chỉ đọc DTO.

## Dữ liệu & trạng thái

```js
worldSimulation.factionState[id] = { factionId, name, basePower, resources /*0..200*/, stability /*0..100*/, ownedNodeIds, playerReputation, lastInternalEvent, lastInternalEventDay, successionCrisis, leaderNpcId, alignment }
worldSimulation.diplomacy[pairKey] = { factionA, factionB, tension /*-100..100*/, status: "dong_minh" | "trung_lap" | "thu_dich", reasons, lastChangedDay, warCooldownUntil }
worldSimulation.wars[id] = { id, factionA, factionB, startedDay, frontNodeIds, scoreA, scoreB, status: "active" | "ended", endedDay, outcome: { winner, loser, resolvedDay }, cascadeApplied, playerInterventions: [{ day, side: "A" | "B" }] }
worldSimulation.warLedger[id] // ≤ 100
```

## Rules

### Sức mạnh và ngoại giao

| ID | Rule |
|---|---|
| WSIM-FAC-001 | `power = max(1, basePower + resources×0.35 + stability×0.25)` (làm tròn 2 chữ số); resources clamp 0..200, stability 0..100. |
| WSIM-FAC-002 | Ngoại giao cập nhật mỗi 7 ngày (`day % 7 = 0`), chỉ cho cặp thế lực (tối đa 12 thế lực đầu) có node sở hữu kề nhau qua `exits`; các node kề đó là mặt trận. |
| WSIM-FAC-003 | Mỗi lần cập nhật tension trôi seeded ±2; status: tension ≤ −60 `dong_minh`, ≥ 60 `thu_dich`, còn lại `trung_lap`; đổi status ghi `lastChangedDay`. |
| WSIM-FAC-004 | Cặp `thu_dich`, hết `warCooldownUntil`, chưa có chiến tranh active và có mặt trận → mở chiến tranh mới với `frontNodeIds`, đặt cooldown 30 ngày. |
| WSIM-FAC-005 | Biến cố nội bộ mỗi 30 ngày, cách lần trước ≥ 30 ngày: seeded <15% `suy_tan` (resources −8, stability −5); >88% `troi_day` (resources +8, stability +5); còn lại không đổi. Biến cố được ghi nhận vào codex thế lực. |

### Chiến tranh

| ID | Rule |
|---|---|
| WSIM-WAR-001 | Chiến tranh active cập nhật mỗi 3 ngày: seeded roll < `powerA/(powerA+powerB)` → scoreA +1, ngược lại scoreB +1. |
| WSIM-WAR-002 | Kết thúc khi `max(score) ≥ 10` và chênh lệch ≥ 3: `status="ended"`, `endedDay`; ngoại giao cặp về tension 25, `trung_lap`, cooldown 30 ngày. |
| WSIM-WAR-003 | Cascade áp đúng một lần nhờ `cascadeApplied`: ghi `outcome`; bên thua stability −8; bên thắng stability +4, resources +8; mỗi node của bên thua nhận influence tạm thời +8 cho bên thắng (30 ngày) và một node-history `faction_change` key `war:<id>:<day>`; log tường thuật nếu người chơi thuộc một bên. |
| WSIM-WAR-004 | Chiến tranh mất một phe → đóng `resolved/orphan_cleanup`, ghi `warLedger` (giữ 100), hết hạn ủy thác gắn chiến tranh đó, một log cảnh báo. |
| WSIM-WAR-005 | Can thiệp của người chơi chỉ cộng điểm sau khi một trận combat thật kết thúc bằng chiến thắng; mỗi ngày mỗi bên tối đa một can thiệp (`day:side` duy nhất). |
| WSIM-WAR-006 | `validateWarState` kiểm phe tồn tại và khác nhau, score hữu hạn ≥ 0, status hợp lệ, war ended có cascade/outcome/endedDay, can thiệp hợp lệ không trùng. |

### Read model

| ID | Rule |
|---|---|
| WSIM-WAR-010 | `warFrontSnapshot(state)` trả mỗi chiến tranh: id, status, phe + tên, `frontNodeIds`, score, `lead` (`draw` hoặc phe dẫn), ngày bắt đầu/kết thúc, `cascadeApplied`, `outcome`; active xếp trước, rồi theo ngày bắt đầu mới nhất. Gồm cả chiến tranh đã kết thúc để làm lịch sử. |
| WSIM-WAR-011 | UI không tự suy người thắng/cascade từ score thô; chỉ dùng `lead`, `cascadeApplied`, `outcome`. Snapshot không mutate state. |
| WSIM-FAC-010 | Sĩ khí/quân số Army cập nhật mỗi tick qua `updateArmies`; Trinh Sát khi Army địch còn xa lộ `soldierCount`/`morale` thật (chi tiết ở [map](../map/README.md)). |

## UI

Tab Thế sự: mặt trận ngoại giao/chiến tranh, phe dẫn, sự kiện, cơ hội tranh đoạt. Không hiện roll, power hay seed.

## Acceptance

- Replay/deserialize: chiến tranh kết thúc cùng ngày, cùng người thắng; cascade không áp lần hai.
- Score bị chặn, DTO đúng lead/outcome.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_world_producer_matrix.js`, `node tools/verify_expansion_stress.js --runs=1000 --days=1000`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WSIM-FAC-001 | `js/expansion.js:factionPowerSnapshot` | Khớp |
| WSIM-FAC-002..004 | `js/expansion.js:updateDiplomacy` | Khớp |
| WSIM-FAC-005 | `js/expansion.js:updateFactionInternalEvents` | Khớp |
| WSIM-FAC-010 | `js/expansion.js:updateArmies` | Khớp |
| WSIM-WAR-001..003 | `js/expansion.js:updateWars` | Khớp |
| WSIM-WAR-004 | `js/expansion.js:updateFactionInternalEvents` | Khớp |
| WSIM-WAR-005..006 | `js/expansion.js:validateWarState`, war intervention action | Khớp |
| WSIM-WAR-010..011 | `js/expansion.js:warFrontSnapshot` | Khớp |
