# Bản đồ — Di chuyển theo hướng và chi phí

## Mục đích

Hợp đồng di chuyển của người chơi: hướng là ý định, ứng viên stride, commit deterministic, chi phí đi bộ, tác động thời tiết lên đoạn đường và trace. Hành trình nhiều ngày, phương tiện và fast travel: [travel-and-fast-travel.md](travel-and-fast-travel.md). Trình bày xem trước: [../ui-action-log/README.md](../ui-action-log/README.md) (`UI-LM-063`).

## Dữ liệu & trạng thái

- `state.movementCommitments[commitmentKey] = { a, b, x, y, index }`, `commitmentKey = turn + ":" + locationId + ":" + direction`.
- `state.openWorld.exitMeta[nodeId][dir] = { movement: "stride", a, b, commitmentKey, committedTurn, reverseOf? }`.
- Resolver chi phí duy nhất: `GameExpansion.travelPlan` = `canonicalTravelPlan` (sở hữu chung với [../world-simulation/README.md](../world-simulation/README.md)).
- `movementTrace` (kho debug/replay, không phải payload UI).

## Rules

### Điểm vào và action

| ID | Rule |
|---|---|
| MAP-MV-001 | `move(state, direction, options)` là điểm vào duy nhất. Lệnh chữ `đi <hướng>`, nút panel và click node kề đều gọi cùng handler. |
| MAP-MV-002 | `moveActions(state)` luôn hiện bốn action `act_move_bac/nam/dong/tay`. Trong miền: có thể materialize đích lazy. Không có ứng viên hợp lệ: action vẫn hiện nhưng disabled kèm lý do (MAP-LC-012). `act_explore_<hướng>` đã bị loại khỏi hợp đồng. |
| MAP-MV-003 | Resolve và validate đích trước khi đổi `state.locationId`; khi có, ủy thác cost/risk/thời tiết/chiến tranh cho `travelPlan`; plan thất bại thì không commit. |
| MAP-MV-004 | Guard rời node (tìm kiếm đang chờ, phát hiện ẩn, cơ duyên tranh đoạt…) có quyền chặn trước khi di chuyển; khi có phát hiện chờ, mở modal xử lý và chỉ tiếp tục sau khi xử lý xong. |
| MAP-MV-005 | Thứ tự sau commit đích: xử lý vòng đời exploration/map-event của node cũ → commit đích → discovery, quest, encounter (`maybeTriggerRandomEncounter`), SAN, history, state dẫn xuất → `serialize()`. |
| MAP-MV-006 | Bỏ chạy khỏi combat không dời người chơi lùi lại; di chuyển theo hướng vẫn khả dụng từ node hiện tại. |
| MAP-MV-007 | `moveWithinNode` chỉ đổi ngữ cảnh sub-location, không đổi node, không chạy transaction di chuyển, không roll encounter ([node-content.md](node-content.md)). |

### Di chuyển stride

| ID | Rule |
|---|---|
| MAP-LC-010 | Hướng là ý định di chuyển, không phải láng giềng cố định. Tập ứng viên mỗi lần commit: tiến `a ∈ {1,2,3}`, lệch ngang `b ∈ {0,1}` → tối đa 6 ứng viên, lọc theo miền `[0,100]` (MAP-LC-011), thứ tự sinh `a` tăng dần rồi `b` tăng dần; `index` của commitment là vị trí trong danh sách đã lọc. Trục theo MAP-LC-003 (Bắc = `y−1`): Bắc `(x+b, y−a)`, Nam `(x+b, y+a)`, Đông `(x+a, y−b)`, Tây `(x−a, y−b)`. Lệch ngang của Bắc/Nam là +x (Đông), của Đông/Tây là về phía Bắc (`−y`), giữ đúng ngữ nghĩa thiết kế D04; độ trôi kỳ vọng (+0,25 Đông, +0,25 Bắc mỗi action trung bình bốn hướng trong vùng trống) được chấp nhận. Lệch đối xứng `{-1,0,+1}` không hoạt động. Đoạn chéo được phép và không vẽ thành bậc thang. Ví dụ tại `(50,50)`: Bắc → `(50,49) (51,49) (50,48) (51,48) (50,47) (51,47)`; Nam → `(50,51) (51,51) (50,52) (51,52) (50,53) (51,53)`; Đông → `(51,50) (51,49) (52,50) (52,49) (53,50) (53,49)`; Tây → `(49,50) (49,49) (48,50) (48,49) (47,50) (47,49)`. **Migration:** cạnh stride và node đã lưu giữ nguyên tọa độ (là cạnh thật, MAP-LC-013) kể cả khi sinh từ công thức cũ; khi load xóa các `movementCommitments` có `turn` khác lượt hiện tại và các mục cùng lượt có `(x,y)` không thuộc tập ứng viên mới của hướng đó (commitment chỉ có nghĩa trong một lượt). |
| MAP-LC-011 | Lọc trước, chọn sau: bỏ ứng viên ngoài miền; kiểm tra toàn đoạn thẳng (supercover traversal, luật góc bảo thủ, không lách giữa hai ô chặn, chạm góc độ dài 0 không tính); bỏ tuyến không hợp lệ và trùng; chọn đều `1/k` trong ứng viên hợp lệ. Không clamp, wrap, dội lại hay reroll. Ví dụ tại `(47,52)` Đông vùng trống: `(48,52) (48,53) (49,52) (49,53) (50,52) (50,53)`. |
| MAP-LC-012 | Không có ứng viên hợp lệ → hướng disabled kèm lý do ("Đã tới rìa thế giới theo hướng này.", vật cản đã biết, hoặc trung tính "Chưa tìm được lối…" khi nguyên nhân bí mật); không tốn thời gian/thể lực; không tạo lối thoát giả. |
| MAP-LC-013 | Commit deterministic: xem hướng hoặc preview không tiêu RNG di chuyển hay tài nguyên. Ứng viên chọn được lưu theo commitment key (lượt + node + hướng / action ID) trước khi đi; reload, render lại, double click hay bề mặt thứ hai không chọn lại. Commit ghi cạnh xuôi và cạnh ngược với `exitMeta = { movement: "stride", a, b, commitmentKey }`; validator, save/load và Lân Cận coi cạnh stride là cạnh thật. |
| MAP-LC-014 | Vật cản: vách không qua được; sông chỉ qua bằng cầu/đò/bơi nếu engine hỗ trợ; thời tiết không làm vật cản cứng thành qua được; cầu đóng/lũ/sạt lở là điều kiện khả dụng, không phải hệ số vô hạn. V1 không tự đi vòng (đường vòng là tuyến riêng có hình học và chi phí riêng) và không tự đi tới landmark đã chọn (không Dijkstra). |
| MAP-LC-015 | Phân biệt đại lượng: một action; độ dời `sqrt(dx²+dy²)` (chỉ hiển thị); độ dài tuyến (= độ dời ở V1). Không ghi stride ngẫu nhiên là "N bước". Thước đo khoảng cách chi phí thuộc resolver travel (Manhattan, MAP-WS-004); UI không tự tính lại. |
| MAP-LC-016 | Hành trình bị gián đoạn: nếu điều kiện đổi chặn phần tiếp theo hoặc đẩy chi phí vượt mức đã chấp nhận, dừng ở điểm nguyên an toàn cuối cùng đã hoàn thành (chia tại `gcd(abs(dx), abs(dy))` điểm lưới), chỉ tính phần đã đi, giữ đích đã chọn, không ghi tọa độ lẻ. "Dừng chân" có hiệu lực ở điểm an toàn kế tiếp. |
| MAP-LC-017 | Thiếu thể lực: không reroll ứng viên rẻ hơn. Chỉ commit khi cận trên an toàn do engine kiểm tra là trả được; nếu không, disabled và hiện phần thiếu. Địa hình chưa biết dùng cận bảo thủ công khai. |
| MAP-LC-018 | Riêng tư fog: với dữ liệu chưa khám phá, preview không lộ số ứng viên bị chặn, xác suất thật, nguyên nhân bí mật hay chi phí chính xác; hiện "Địa hình chưa rõ". Engine vẫn validate tập ứng viên thật. |
| MAP-LC-019 | Sau khi tới, tập ứng viên tính lại từ vị trí mới; không tự lặp; tập cũ bị bỏ. Trạng thái bị chặn/thiếu/đã đổi lúc commit làm mới preview và lý do thay vì tiếp tục với dữ liệu cũ. |
| MAP-LC-020 | Xem trước hướng chỉ hiện tập đích có thể tới và khoảng min/max (thời gian, thể lực); không đánh dấu, không lộ ứng viên đã được chốt sẵn cho lượt (chốt 2026-10-22, khớp `UI-LM-063`). **Hợp đồng engine:** `movementDirectionPublicPreview(state, dir)` (thuần, mới; UI chỉ gọi hàm này) gọi `movementCandidatePreview` rồi trả `{ success, direction, reason?, targets[], range }`: `targets[]` = mọi ứng viên hợp lệ sau lọc MAP-LC-011, theo thứ tự `(a, b)`, mỗi phần tử `{ nodeId \| null, name \| null, coordinates, known }` — `known = true` khi ô đã có node và `fogLevel ≥ 1` hoặc đã visited (theo MAP-LC-041); `range = { minDays, maxDays, minStamina, maxStamina }` = min/max của `travelPlan` trên **tất cả** ứng viên hợp lệ (mỗi ứng viên chạy `travelPlan` trên bản sao cô lập, thời tiết theo từng đoạn, MAP-LC-034; địa hình chưa biết dùng cận bảo thủ MAP-LC-017). Public preview **không** chứa `index`, `commitmentKey`, `selected`, `travelPlan` của từng ứng viên hay cờ nào cho biết ứng viên nào được chốt; thứ tự `targets[]` cố định theo `(a, b)` nên không rò chỉ số chốt. Số ứng viên bằng 1 thì min = max (không thể tránh lộ, chấp nhận). |

### Metadata cạnh (`MapEdgeMeta`)

| ID | Rule |
|---|---|
| MAP-MV-010 | Mỗi cạnh có `MapEdgeMeta` lưu cạnh `exitMeta` (mở rộng additive của `{ movement, a, b, commitmentKey }`, MAP-LC-013): `terrain` ∈ `road`, `mountain`, `forest`, `river`, `sea`, `ruins`; `baseRisk` số ≥ 0 (đầu vào của rủi ro chặng, không do caller gửi — MAP-RT-030); `allowedModes` = danh sách phương tiện được phép (`TravelMode`, xem [travel-and-fast-travel.md](travel-and-fast-travel.md)); `blockadeState` ∈ `open`, `restricted`, `blocked`; `patrolLevel` số nguyên ≥ 0; `seasonalState?` chuỗi tùy chọn. Khoảng cách không lưu trong meta mà tính theo MAP-WS-004. |
| MAP-MV-011 | Cạnh thiếu meta (save cũ, cạnh authored) đọc là mặc định `terrain` theo node đích, `baseRisk` theo `dangerLevel`, `allowedModes` mọi phương tiện hợp lệ, `blockadeState = open`, `patrolLevel = 0` (migration additive, MAP-WS-061). `blocked` loại cạnh khỏi tập ứng viên (MAP-LC-011); `restricted` giữ cạnh nhưng thêm điều kiện/chi phí và hiện lý do (MAP-LV-042). |

### Chi phí và trace thời tiết

| ID | Rule |
|---|---|
| MAP-LC-030 | Một resolver `GameExpansion.travelPlan`/`canonicalTravelPlan` cho preview và commit. Chính sách đi bộ `walk_distance_weighted_v1`: `staminaCost = max(1, ceil(distance × max(0.55, terrainWeight × weatherWeight × structureWeight) × partyWeight))`; `gameDays = max(1, ceil(distance / effectiveSpeed))`; `distance` Manhattan, đơn vị thời gian là ngày game. `partyWeight = 1 + 0.05 × (partySize − 1)`, `effectiveSpeed = baseSpeed / partyWeight`. Trọng số địa hình: road 0,8; plains 1; forest 1,12; mountain 1,28; swamp 1,24; coast 1,05; desert 1,18. Preview chạy trên bản sao state cô lập: không tạo node, không đổi influence, không RNG, không tiêu tài nguyên. `move` kiểm tra thể lực trước khi đổi vị trí và trừ đúng một lần; thất bại giữ nguyên vị trí và tài nguyên. UI chỉ hiện kết quả, không hiện hệ số hay RNG. |
| MAP-LC-031 | Chuỗi trace W01–W10: W01 thời tiết tại đoạn (vị trí + thời gian game) → W02 tra luật → W03 hệ số thời gian, hệ số thể lực riêng, cờ qua được → W04 chia tuyến theo địa hình/thời tiết/tick → W05 chi phí từng đoạn và tổng → W06 preview min/max theo hướng → W07 kiểm tra lại lúc commit (phiên bản, điều kiện, chi phí) → W08 thực thi theo chính sách thời tiết đã chọn → W09 chênh lệch preview–thực tế và mã lý do → W10 tường thuật + "Dự liệu hành trình". UI không nhân lại hệ số engine đã áp. |
| MAP-LC-032 | Chuẩn hóa hệ số: hệ số tốc độ `M` → thời gian `1/M` (tốc độ ×0,8 → thời gian ×1,25); phạt thời gian 25% → ×1,25; ghi loại gốc. Dữ liệu thời tiết thiếu/hỏng không coi là "quang": dùng fallback khai báo kèm trace hoặc chặn commit. Hệ số phải hữu hạn, dương; hệ số giảm thời gian chỉ từ buff tường minh; không clamp ngầm. |
| MAP-LC-033 | Không tính hai lần: `compositionMode = independent` nhân địa hình × thời tiết; `combined` dùng một hệ số gộp và không gì khác. Thể lực có nhánh riêng; thời tiết chỉ đổi thể lực hay Thanh Tỉnh qua luật tường minh. |
| MAP-LC-034 | Hệ số thời tiết của tuyến = `T_total / T_terrain_only` (trọng số theo độ dài), không lấy trung bình hệ số ô; không tách được thì báo "không tách riêng được". Mỗi ứng viên được ước tính riêng trước khi lấy min/max; không áp một hệ số của node xuất phát cho mọi ứng viên. |
| MAP-LC-035 | Mỗi engine đúng một chính sách thời tiết, ghi trong trace: snapshot theo action (vẫn lấy mẫu thời tiết dọc tuyến) hoặc tích phân thời gian (tiến tới mốc/tick kế, cập nhật, tiếp — không vòng ước tính lại). Một đồng hồ engine điều khiển di chuyển và thời tiết; thời lượng animation không phải thời gian gameplay. Đổi trước commit → đánh giá lại và preview lại; đổi giữa tuyến → giữ đích, áp MAP-LC-016. |
| MAP-LC-036 | `movementTrace`: actionId, previewId, direction, nodeId xuất phát/đích đã resolve (đích rỗng trước commit), phiên bản world/cost/weather, weatherPolicy, estimateKind (`exact_snapshot`/`forecast`/`conservative_bound`), segments (vị trí, độ dài, thời gian, id địa hình/thời tiết, id luật, hệ số gốc và chuẩn hóa, compositionMode, passable/blockedReason, thời gian/thể lực nền, ước tính, thực tế), totals (thời gian min/max/thực, thời gian chỉ địa hình, hệ số thời tiết hiệu dụng, thời gian thêm, thể lực thực, node dừng, trạng thái hoàn thành, lý do thay đổi). Field không áp dụng là null kèm lý do, không bao giờ 0. Reload dùng lại action đã lưu, không tính phí lại. |
| MAP-LC-037 | Acceptance WT01–WT13: thời tiết quang = mốc địa hình; tốc độ 0,8 → thời gian 1,25; ví dụ hai đoạn 8 → 10,4 (thêm 2,4, tuyến ×1,3); tuyến mưa một phần chỉ phạt phần mưa; luật combined không nhân hai lần; sáu ứng viên ước tính riêng không dùng RNG preview; thời tiết đổi giữa preview và commit buộc kiểm tra lại; tick giữa tuyến theo một chính sách; bão chặn phần kế → dừng trước đó, tính phần đã đi, không reroll; thời tiết không có luật thể lực giữ nguyên thể lực/Thanh Tỉnh; thiếu dữ liệu → fallback hoặc chặn; reload/double click → một action, một lần trừ; thời tiết chưa khám phá không lộ ra UI. |

## Luồng

```text
chọn hướng → movementCandidatePreview (không RNG, không mutate)
  → [không ứng viên] disabled + lý do
  → commit: lấy/ghi movementCommitments[key] → guard rời node → travelPlan (cô lập)
  → kiểm tra thể lực → generateOpenWorldNode nếu cần → ghi exits + exitMeta hai chiều
  → đổi locationId → trừ thể lực một lần → discovery/encounter/log → serialize
```

## Acceptance

- Bốn action hướng luôn hiện; ở biên hướng ra ngoài disabled, không tạo node/cạnh.
- Bắc giảm `y`, Nam tăng `y` cho cả ứng viên stride lẫn hiển thị.
- Preview không đổi save/RNG; reload giữa preview và commit không đổi đích.
- Đi bộ trừ thể lực đúng một lần; thất bại giữ nguyên vị trí.
- WT01–WT13 (MAP-LC-037).
- Gate: `node tools/verify_local_movement_weather.js`, `node tools/verify_game.js`, `node tools/verify_action_dispatch_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-MV-001..003 | js/engine.js:`move`, `openWorldTarget` | Khớp |
| MAP-MV-002 | js/engine.js:`moveActions` | Khớp |
| MAP-MV-004 | js/engine.js:`pendingDepartureGuard`, `confirmPendingDeparture` | Khớp |
| MAP-MV-005 | js/engine.js:`move`, `maybeTriggerRandomEncounter` | Khớp |
| MAP-MV-007 | js/expansion.js:`moveWithinNode` | Khớp |
| MAP-MV-010..011 | js/engine.js:`exitMeta` (chỉ `movement`, `a`, `b`, `commitmentKey`, `reverseOf`; không có `terrain`, `baseRisk`, `allowedModes`, `blockadeState`, `patrolLevel`, `seasonalState`); js/expansion.js:`edgeState` (chỉ `connected`) | Thiếu |
| MAP-LC-010 | js/engine.js:`movementCandidatesFrom` (`sign`: Bắc `y + a`, Nam `y − a`, Đông/Tây `y + b` — cả bốn hướng sai dấu trục y so với MAP-LC-003; x đúng) | Lệch |
| MAP-LC-011 | js/engine.js:`movementCandidates` (chỉ lọc biên, chưa kiểm tra đoạn/vật cản; chọn bằng `replayRandom`) | Lệch |
| MAP-LC-012 | js/engine.js:`movementCandidatePreview` | Khớp |
| MAP-LC-013 | js/engine.js:`movementCandidatePreview`, `openWorldTarget` (`exitMeta`) | Khớp |
| MAP-LC-014 | — | Thiếu |
| MAP-LC-016 | — (`gcd` split) | Thiếu |
| MAP-LC-017..019 | js/engine.js:`move` | Khớp |
| MAP-LC-020 | js/engine.js:`movementCandidatePreview` (trả `index`, `selected`, `travelPlan` của ứng viên chốt — chỉ dùng nội bộ); thiếu `movementDirectionPublicPreview`; js/ui.js:`renderLocalMap` (đánh dấu `preview-selected`, `data-map-candidate-index`, ngày/thể lực riêng) | Lệch |
| MAP-LC-030 | js/expansion.js:`canonicalTravelPlan`, `travelWeightSnapshot` | Khớp |
| MAP-LC-031..033 | js/expansion.js:`canonicalTravelPlan` | Thiếu |
| MAP-LC-034 | js/expansion.js:`travelPlan` (thời tiết lấy theo vùng node xuất phát cho mọi ứng viên) | Lệch |
| MAP-LC-035..036 | — (`weatherPolicy`, `movementTrace`) | Thiếu |
