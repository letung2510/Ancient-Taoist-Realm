# Bản đồ — Binh đoàn và không khí thế giới trên bản đồ

## Mục đích

Binh đoàn là thực thể sống trên bản đồ, trực quan hóa chiến tranh thế lực; và lớp "Wrongness"/Ambient Dread phủ lên mọi lớp bản đồ. Công thức chiến tranh trừu tượng, tension, world tick: [../world-simulation/README.md](../world-simulation/README.md). Công thức WrongnessLevel và Ambient Dread gốc: [../world-simulation/README.md](../world-simulation/README.md) (worldview atmosphere).

## Dữ liệu & trạng thái

```js
Army { id, factionId, originNodeId, nodeId, soldierCount, eliteCount?, generalNpcId?, morale /* 0–100 */,
  status: "garrison" | "marching" | "sieging" | "in_battle" | "routed" | "disbanded",
  route: [nodeId], targetNodeId, corruptionExposure, lastUpdatedDay }
MapNode.battlefieldState = { isBattlefield, expiresAtTurn, corruptionSpreadBonus } | null
MapNode.subLocationWrongnessOverride = { [subLocationId]: number }
```

- `state.worldSimulation.armies`; API `ensureArmyState`, `updateArmies(state, day)`, `armyAction(state, armyId, action, options)`; `subLocationWrongness(state, subLocationId)`.

## Rules

### Binh đoàn

| ID | Rule |
|---|---|
| MAP-ARMY-001 | Vị trí binh đoàn là `nodeId` trên registry; di chuyển theo `route` mỗi ngày GameClock với tốc độ theo phương thức di chuyển và chịu thời tiết như người chơi (Tuyết làm hành quân chậm). |
| MAP-ARMY-002 | Vòng đời: thế lực đủ tài nguyên + tension vượt ngưỡng chiến tranh → sinh binh đoàn `garrison` tại node nhà → `marching` theo mục tiêu world tick → tới node biên đối phương: `sieging` nếu node có phòng thủ, hoặc `in_battle` khi hai binh đoàn chạm nhau trên đường. |
| MAP-ARMY-003 | Giải quyết trận: so sánh `soldierCount × avgLevel + eliteCount × 5` mỗi bên, cộng modifier tướng (cảnh giới `generalNpcId`), thời tiết, địa hình node. Thắng: morale tăng, tiếp tục vây/chiếm node. Thua: morale giảm, `routed`, rút về node cùng phe gần nhất, mất % quân. |
| MAP-ARMY-004 | Mô phỏng ngày: hành quân qua node có Corruption ≥ 3 làm giảm morale mỗi ngày (qua tâm lý tướng). Morale ≤ 20 → `routed` và mất 15% quân (`soldierCount × 0.85`, tối thiểu 1). |
| MAP-ARMY-005 | Bão Linh Khí hoặc Tuyết cường độ ≥ 4 ở vùng đang chiến tranh → Đình Chiến Tạm Thời: không giải quyết trận nào ở vùng đó tới khi thời tiết dịu (MAP-WTH-030). |
| MAP-ARMY-006 | Action người chơi: `join_battle` (cùng node binh đoàn `in_battle`/`sieging`; combat thật, thắng thì cộng một đơn vị elite tạm thời vào công thức trận); `scout` (khi binh đoàn địch còn xa; lộ `soldierCount`/`morale` thật); `sabotage` (cần Thân Phận Giả hoặc Nghề Ẩn phù hợp; giảm morale/quân địch trước giao tranh); `command` (cần danh tiếng thế lực đủ cao + quest chiến dịch; người chơi tự quyết hướng một binh đoàn trong thời gian giới hạn). |
| MAP-ARMY-007 | Marker Binh Đoàn cùng cấp với Tuần Tra/Quái/Cơ Duyên; icon theo `status`: garrison tĩnh có viền, marching có glow đuôi theo hướng, in_battle pulse đỏ và ưu tiên hiển thị cao nhất. Hai binh đoàn đối địch trong bán kính cảnh báo → đường nối đỏ nhấp nháy giữa hai vị trí để người chơi kịp can thiệp. |

### Không khí thế giới trên bản đồ

| ID | Rule |
|---|---|
| MAP-ATM-001 | Mọi mô tả node (kể cả `dangerLevel = 1`) và từng sub-location đi qua WrongnessLevel = f(khoảng cách tới origin, Corruption_Rating nhân vật, tỉ lệ SAN) và roll Ambient Dread theo đúng mức. Sub-location roll độc lập với node cha (Sảnh Chính yên bình, Hẻm Sau có thể bất an hơn). |
| MAP-ATM-002 | `subLocationWrongness(state, subLocationId)` = wrongness worldview của người chơi + override/corruption cục bộ; mọi consumer map/UI dùng helper này, không tự đặt công thức thứ hai. |
| MAP-ATM-003 | Node vừa có `in_battle` mang mô tả Chiến Trường tạm thời (vài ngày GameClock), giọng tả thực cụ thể theo nguyên tắc worldview (không viết chung chung "xác chết la liệt"); Chiến Trường tăng % lan Corruption sang node lân cận. |
| MAP-ATM-004 | WrongnessLevel Cực Cao (76–100) ở một vùng: chấm node/binh đoàn/NPC trong vùng thỉnh thoảng đổi sai màu (tím/đỏ) trong đúng một khung hình rồi tự trở lại — hiệu ứng "người kể không đáng tin" trên thị giác bản đồ, không phải lỗi. Tôn trọng reduced motion. |
| MAP-ATM-005 | Tin đồn fog cấp 1 ở node có WrongnessLevel ≥ Trung bình ưu tiên giọng bất an (MAP-FOG-013). |

## Acceptance

- Binh đoàn routed khi morale ≤ 20 với tổn thất 15%; save/load giữ binh đoàn.
- Bốn action binh đoàn kiểm tra điều kiện; `command` bị chặn khi thiếu danh tiếng.
- Wrongness sub-location dùng một helper duy nhất.
- Gate: `node tools/verify_world_producer_matrix.js`, `node tools/verify_expansion_stress.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-ARMY-001..002 | js/expansion.js:`ensureArmyState`, `updateArmies` | Khớp |
| MAP-ARMY-003 | js/expansion.js:`updateArmies` | Thiếu |
| MAP-ARMY-004 | js/expansion.js:`updateArmies` | Khớp |
| MAP-ARMY-005 | — | Thiếu |
| MAP-ARMY-006 | js/expansion.js:`armyAction` | Khớp |
| MAP-ARMY-007 | js/ui.js | Thiếu |
| MAP-ATM-001..002 | js/engine.js:`subLocationWrongness` | Khớp |
| MAP-ATM-003 | — (`battlefieldState`) | Thiếu |
| MAP-ATM-004..005 | — | Thiếu |
