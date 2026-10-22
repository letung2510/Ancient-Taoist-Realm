# Bản đồ — Hành trình, phương tiện và dịch chuyển nhanh

## Mục đích

Hành trình nhiều ngày giữa hai node (travel task), phương thức di chuyển, trạng thái cạnh, rủi ro, hộ tống, lập tuyến, Truyền Tống Trận và về điểm neo. Di chuyển theo hướng từng bước: [movement-and-cost.md](movement-and-cost.md).

## Dữ liệu & trạng thái

```ts
TravelTask {
  id; status: "planned" | "active" | "interrupted" | "completed" | "cancelled" | "failed";
  fromId; toId; routeSnapshot: string[]; mode: TravelMode; distance; etaDays; elapsedDays;
  risk; riskSeed; escortId?; interruption?: { type; day; resolved };
  costSnapshot: Record<string, number>; createdDay; updatedDay; stateVersion;
}
EdgeState {
  availability: "open" | "restricted" | "blocked" | "unknown";
  reason?: "war" | "weather" | "patrol" | "collapse" | "customs" | "quest";
  riskBand: "low" | "medium" | "high" | "extreme"; patrolCount; traffic: "empty" | "normal" | "busy";
  lastVerifiedDay; alternateEdges: string[];
}
```

- `state.travelTask` (nguồn sự thật duy nhất khi đang đi); `state.mapState.fastTravel[nodeId]` (điểm đã mở).
- API: `startTravel`, `advanceTravelTask`, `interruptTravel`, `resumeTravel`, `cancelTravel`, `travelTaskSnapshot`, `listRouteOptions`, `edgeState`, `teleportAnchorEligibility`.

## Rules

### Phương thức di chuyển

| ID | Phương thức | Điều kiện | Tốc độ | Đặc tính |
|---|---|---|---:|---|
| MAP-TRV-001 | Đi bộ (`walk`) | Luôn có nếu tuyến mở | 1,0× | Rẻ, nhiều cơ hội dọc đường; tốn thể lực (MAP-LC-030) |
| MAP-TRV-002 | Ngự khí (`ngự_khí`) | Có công pháp/thân pháp phù hợp | 3,0× | Nhanh, tốn Linh Thạch, không dùng ở tuyến cấm; bị chặn khi Bão Linh Khí |
| MAP-TRV-003 | Thú cưỡi | Có thú cưỡi/đồng hành hợp lệ | 2,0× | Giảm rủi ro đường bộ |
| MAP-TRV-004 | Thuyền | Hai đầu là bến/nước | 2,0× | Chịu bão, không đi tuyến nội địa |
| MAP-TRV-005 | Đoàn xe | Có caravan và tuyến đường | 1,5× | Giảm rủi ro, tốn phí duy trì |
| MAP-TRV-006 | Đoàn thương nhân | Hub thương mại đã mở | 1,25× | Giảm giá/nhận tin, dễ bị phục kích |
| MAP-TRV-007 | Truyền Tống Trận (`truyền_tống_trận`) | Fast travel mở ở cả hai đầu | Tức thời | Không roll sự kiện đường, tốn Linh Thạch, không chịu thời tiết |

| ID | Rule |
|---|---|
| MAP-TRV-008 | Hệ số thời tiết lên tốc độ: Mưa ×0,8; Tuyết ×0,6; Bão Linh Khí chặn ngự khí ("Bão Linh Khí khiến ngự khí không thể cất cánh."), đi bộ không đổi; Truyền Tống Trận không chịu thời tiết. Ví dụ ngự khí: Mưa 2,4×, Tuyết 1,8×. Danh mục thời tiết: [../weather/README.md](../weather/README.md). |
| MAP-TRV-009 | Số lần roll sự kiện dọc đường = số ngày đi (`eventRolls = gameDays`); đi càng xa càng nhiều cơ hội/rủi ro. Nội dung sự kiện thuộc [../discovery/README.md](../discovery/README.md). |
| MAP-TRV-010 | Action phương tiện chỉ vào Action Bar khi `travelPreview()` trả `success=true`; không đủ điều kiện thì hiện trong mục "Phương thức khác" ở trạng thái disabled kèm lý do. |

### Travel task

| ID | Rule |
|---|---|
| MAP-TRV-020 | Chuyển trạng thái hợp lệ: `planned → active → completed`; `active → interrupted → active`; `planned/active/interrupted → cancelled`; `active → failed` chỉ khi tuyến bị thế giới hủy và không thể tiếp tục. Transition sai bị chặn. |
| MAP-TRV-021 | `startTravel(fromId, toId, mode)`: xác nhận hai node tồn tại trong registry; khoảng cách Manhattan; hệ số tốc độ, thời tiết, địa hình; kiểm tra combat/travel task đang chạy; kiểm tra cost; không kiểm tra membership tổ chức; ghi `fromCoordinate`, `toCoordinate`, `distance`, `mode`, `weather`, `risk`. Snapshot khóa tuyến, khoảng cách, ETA, risk seed, hộ tống và chi phí. |
| MAP-TRV-022 | Mỗi ngày chỉ resolve một lần theo `taskId + dayIndex`; retry idempotent, không trừ tiền, roll sự kiện hay ghi log lần hai. Reload giữa `active/interrupted` khôi phục đúng ETA/risk seed. |
| MAP-TRV-023 | Khi task `active`, `state.locationId` vẫn là node xuất phát; không cho combat, giao dịch hay tương tác NPC ở node đích trước khi `completed`. UI hiện "đang trên đường" và khóa action xung đột; khi travel active các nút travel khác disabled kèm lý do. |
| MAP-TRV-024 | Nguyên nhân gián đoạn: quái/mai phục; bão, lũ, sạt lở; tuần tra kiểm tra; thế lực phong tỏa; phương tiện hỏng; thiếu phí duy trì caravan/hộ tống; node đích chuyển thành không thể tiếp cận. |
| MAP-TRV-025 | Route invalidation: cạnh trong `routeSnapshot` chuyển `blocked` → task `active` chuyển `interrupted` kèm `reason`, không teleport. Tạo tối đa ba phương án: chờ mở lại, đường vòng an toàn, đổi phương tiện/hộ tống. Không có phương án → `failed`, hoàn phần chi phí chưa dùng theo policy. |
| MAP-TRV-026 | Hủy hành trình chỉ hiện khi task `planned/active/interrupted`; Tiếp tục chỉ hiện khi gián đoạn đã có phương án xử lý. Không hoàn tiền hai lần khi cancel/interruption; không nhận thưởng khi task chưa `completed`. |
| MAP-TRV-027 | Khi tới nơi: camera focus vào node mới, fog tăng theo hợp đồng, log ghi node/vùng/thời tiết. |

### Cạnh và rủi ro

| ID | Rule |
|---|---|
| MAP-TRV-030 | Cạnh bị phong tỏa không bị xóa khỏi graph; chỉ đổi `EdgeState` để giữ lịch sử, đường vòng và khả năng mở lại. Phong tỏa/coverage chỉ đổi risk, cost, encounter hoặc phương thức, không xóa liên kết. Nhiều incident cùng tác động một cạnh: `blocked > restricted > open`. |
| MAP-TRV-031 | `edgeRisk = clamp(baseRisk + terrainRisk + weatherRisk + patrolRisk + incidentRisk + factionRisk − escortReduction − structureReduction, 0, 0.95)`; `taskRisk = 1 − Π(1 − edgeRisk_i)` trên toàn chặng. UI hiện dải thấp/vừa/cao/cực cao; log lưu giá trị số và seed. Không reroll risk khi chỉ mở lại preview. |
| MAP-TRV-032 | Rủi ro tới node đích hiện hành: `risk = clamp(danger/100 × contestedWeight(1,25 nếu tranh chấp) × terrainWeight × weatherWeight × influenceWeight × structureWeight + travelRiskDelta, 0, 1)`; `influenceWeight = 1 + min(0.25, pressure/400) + 0.15 nếu tranh chấp`; `structureWeight = clamp(1 − sanDrainReduction × 0.25 + encounterRisk, 0.55, 1.25)`. |
| MAP-TRV-033 | Hộ tống: NPC hộ tống (thuê ở phường thị hoặc thế lực cử khi cống hiến cao) giảm % sự kiện quái/hắc đạo dọc đường; có `riskReduction`, `dailyCost` (tỉ lệ độ dài quãng đường), `canFlee`. |

### Lập tuyến

| ID | Rule |
|---|---|
| MAP-TRV-040 | Chế độ Lập tuyến: chọn node đích, hiện 1–3 tuyến tốt nhất theo nhanh nhất/an toàn nhất/rẻ nhất/kín đáo nhất, so sánh ETA, chi phí, phong tỏa, tuần tra, thời tiết, cơ hội dọc đường; cho waypoint và đổi phương tiện theo chặng; chỉ tạo `travelTask` sau khi xác nhận. Không tự đi bộ tới landmark ở V1 (MAP-LC-014). |
| MAP-TRV-041 | Mọi hành động mất ngày, tài nguyên, độ bền, danh tiếng hoặc tăng rủi ro có preview trước/sau, thời gian, dải rủi ro, tác động thế lực, điều kiện thất bại và nút quay lại. |

### Dịch chuyển nhanh

| ID | Rule |
|---|---|
| MAP-TRV-050 | Điểm fast travel không có sẵn: chỉ tồn tại ở node cốt truyện khám phá lần đầu (tự mở) hoặc nơi có Truyền Tống Trận (`teleport_array`) do người chơi/thế lực xây ([influence-and-structures.md](influence-and-structures.md)). |
| MAP-TRV-051 | Endpoint phải là teleport anchor hợp lệ (`teleportAnchorEligibility`): node sinh ra, node tông môn đang tham gia, hoặc phường thị hợp lệ đã xây công trình. Hai đầu khác nhau và đều đã mở. |
| MAP-TRV-052 | Fast travel: tốn Linh Thạch `max(1, distance × 2)`, `gameDays = 0`, không roll sự kiện đường, vẫn ghi travel log. Không dùng trong combat/instance; không bỏ qua quest lock, combat lock hay incident bắt buộc. |
| MAP-TRV-053 | Về điểm neo: khi không giao chiến, Action Bar hiện "Về [điểm neo]" đưa nhân vật về hub phù hợp trong vùng (MAP-WS-032); nếu có nghi thức đang chờ ưu tiên hub có NPC nhân tộc. Tốn một lượt game, hủy phiên tìm kiếm chưa thu thập, không dùng trong giao chiến. |

## Acceptance

- Mọi transition hợp lệ có UI; transition sai bị chặn; action gọi trực tiếp qua API vẫn bị chặn đúng.
- Retry/reload không nhân đôi chi phí, sự kiện hay log.
- Phong tỏa luôn có đường vòng hoặc chuyển interrupted; không đổi `locationId` sai.
- Hộ tống, thuyền, thú cưỡi, caravan, truyền tống có điều kiện riêng.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_world_producer_matrix.js`, `node tools/verify_map_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-TRV-001..002, 007 | js/expansion.js:`travelPlan` | Khớp |
| MAP-TRV-003..006 | — (chỉ có `walk`, `ngự_khí`, `truyền_tống_trận`) | Thiếu |
| MAP-TRV-008..009 | js/expansion.js:`travelPlan`, `canonicalTravelPlan` | Khớp |
| MAP-TRV-020..027 | js/expansion.js:`startTravel`, `advanceTravelTask`, `interruptTravel`, `resumeTravel`, `cancelTravel` | Khớp |
| MAP-TRV-030 | js/expansion.js:`edgeState` | Khớp |
| MAP-TRV-031 | js/expansion.js:`canonicalTravelPlan` (dùng công thức MAP-TRV-032, chưa có `edgeRisk`/`taskRisk` theo chặng) | Lệch |
| MAP-TRV-032 | js/expansion.js:`canonicalTravelPlan`, `travelWeightSnapshot` | Khớp |
| MAP-TRV-033 | js/expansion.js (`escort`) | Thiếu |
| MAP-TRV-040 | js/expansion.js:`listRouteOptions` (chỉ liệt kê exits, chưa xếp hạng tiêu chí) | Lệch |
| MAP-TRV-050..052 | js/expansion.js:`travelPlan`, `teleportAnchorEligibility` | Khớp |
| MAP-TRV-053 | js/engine.js (`travel_hubs`) | Khớp |
