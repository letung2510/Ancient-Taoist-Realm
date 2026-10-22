# Bản đồ — NPC sống trên bản đồ

## Mục đích

Hợp đồng NPC ở góc nhìn bản đồ: quần thể NPC theo node/sub-location, lịch sinh hoạt gắn topology, phản ứng thời tiết và cảnh quan, tương tác NPC–NPC tại node, danh sách NPC đông. Hội thoại, quan hệ người chơi–NPC và hồ sơ NPC thuộc [../npc/README.md](../npc/README.md) và [../relationship/README.md](../relationship/README.md).

## Dữ liệu & trạng thái

```ts
NpcRuntime { npcId; instanceId; kind: "persistent_named" | "persistent_role" | "population_citizen" | "traveler" | "crowd_ephemeral" | "event_actor";
  displayName; role; factionId?; homeNodeId; currentNodeId; currentSubLocationId; routePlan?; schedule;
  scheduleStatus: "working" | "resting" | "traveling" | "sheltering" | "patrolling" | "missing" | "dead";
  availabilityReason; needs: { food; shelter; safety; social } /* 0–100, 100 = cấp bách */; traits; goals; mood; health; stamina;
  weatherAffinity; relationshipsWithNpcs; memoryWithPlayer; memoryWithWorld; inventory;
  status: "alive" | "injured" | "missing" | "captured" | "dead" | "retired"; lastDecisionDay }
NpcEcologyProfile { populationCapacity; roles[{ roleId, baseCount, variance, preferredSubLocations, scheduleTemplate }];
  factionPresence[{ factionId, share, allowedRoles, taxPolicy }]; weatherShelters; gatheringSpots; dangerResponses;
  localRumors; migrationEdges; uniqueActors }
NpcNodeView { instanceId; displayName; roleLabel; nodeId; subLocationId; presence: "visible" | "rumored" | "absent";
  scheduleLabel; weatherMood; availableActions; relationSummary?; reasonUnavailable? }
```

## Rules

### Quần thể và hiện diện

| ID | Rule |
|---|---|
| MAP-NPC-001 | NPC dùng `currentNodeId` (+ tùy chọn `currentSubLocationId`); quái dùng `spawnNodeId`/`currentNodeId`. NPC chỉ xuất hiện tại node/sub-location khi scheduler xác nhận hiện diện; không hiện NPC ảo chỉ vì có trong catalog; không xuất hiện ở node chưa có trong registry. Dialogue/quest không suy ra chỉ từ tên NPC. |
| MAP-NPC-002 | Sáu lớp NPC: `persistent_named` (ID cố định, quan hệ bền), `persistent_role` (ID theo node), `population_citizen` (instance ổn định theo node, quan hệ hạn chế), `traveler` (instance theo hành trình), `crowd_ephemeral` (pool tái dùng, không quan hệ), `event_actor` (ID theo incident). Không dùng tên hiển thị làm khóa quan hệ. |
| MAP-NPC-003 | Quy mô: node nhỏ 5–30 NPC runtime; làng 30–150; thành thị 150–1.000; sơn môn/vương kinh 500–5.000; sự kiện lớn thêm crowd pool có quota theo node. |
| MAP-NPC-004 | `backgroundCount` chỉ là thống kê; actor materialize khi ở viewport/chi tiết node, có quest/quan hệ, là nhân chứng, tham gia incident, trên tuyến người chơi hoặc được thế lực đánh dấu. `instanceId = hash(worldSeed + nodeId + roleId + populationSlot + generation)`; reload cùng khóa không tạo actor mới. Actor tạm rời node về pool hoặc lưu `lastKnownNodeId`. `visibleCount` tách `backgroundCount`. |
| MAP-NPC-005 | Mỗi node khai báo `NpcEcologyProfile` riêng (ví dụ sơn môn: đệ tử ở sân luyện, trưởng lão ở chính điện, tạp dịch ở kho, khách ở cổng). |
| MAP-NPC-006 | Sub-location có `capacity`, `queuePolicy`, `priorityRoles`. Vượt sức chứa: actor khẩn cấp (bị thương, trẻ em, hộ tống) ưu tiên; khác xếp hàng hoặc chuyển shelter/sub-location gần nhất; mọi nơi đầy thì rời node theo cạnh mở rẻ nhất. Không spawn vô hạn. |

### Lịch và quyết định

| ID | Rule |
|---|---|
| MAP-NPC-010 | Mỗi tick: cập nhật thời tiết/cảnh báo → kiểm tra lịch/giờ mở cửa → đánh giá nhu cầu → chọn hành động bằng utility deterministic → di chuyển hoặc tìm shelter → resolve tương tác NPC–NPC/cảnh quan/người chơi → ghi sự kiện, invalidate view model node bị ảnh hưởng. |
| MAP-NPC-011 | `score = goalWeight × 0.40 + needUrgency × 0.30 + weatherFit × 0.15 + relation/factionBias × 0.10 − travelCost × 0.05`, `needUrgency = max(food, shelter, safety, social)`; tie-break theo `actionId`. Random chỉ dùng seed `worldSeed + npcInstanceId + day + decisionIndex`. |
| MAP-NPC-012 | Ưu tiên: sống sót > nhiệm vụ khẩn > bảo vệ thế lực > nhu cầu cá nhân > xã hội > đi lang thang. Lịch cố định có thể bị incident, thời tiết cực đoan, chiến tranh, thương vong hoặc người chơi ghi đè. NPC đang trú không giao dịch nếu sub-location đóng cửa; NPC bị thương tìm y sư. |
| MAP-NPC-013 | State machine: `idle → planning → traveling → arrived → acting → cooldown → idle`; nhánh `sheltering`, `injured → treated/recovering → idle`, `missing → found/retired/dead`. Mỗi transition ghi `reason`, `source`, `day`, `decisionSeed`; transition không hợp lệ bị từ chối. |
| MAP-NPC-014 | NPC dùng cùng `resolveMapTopology()`/`edgeState()` với người chơi; không đi qua cạnh `blocked`, không mở cạnh tĩnh. Tuyến hỏng → `rerouting` (tìm đường vòng BFS/A* trên node đã biết); ba lần thất bại → `sheltering` hoặc `missing` tùy vai. Tuần tra thế lực được mở cạnh runtime riêng nếu data khai báo `authorityAction`. |

### Thời tiết và cảnh quan

| ID | Thời tiết | Hành vi NPC | Tác động bản đồ |
|---|---|---|---|
| MAP-NPC-020 | Quang | Lịch bình thường | Cạnh mở, lưu lượng chuẩn |
| MAP-NPC-021 | Mưa | Tìm mái che, giảm giao dịch ngoài trời | Đường đất tăng nguy cơ |
| MAP-NPC-022 | Bão (Lôi Vũ/Bão Linh Khí) | Trú ẩn, hủy hành trình | Đường biển có thể phong tỏa |
| MAP-NPC-023 | Sương | Đi theo người dẫn đường, giảm tầm nhìn | Tuần tra/đi lạc tăng |
| MAP-NPC-024 | Tuyết | Tiêu hao thể lực, ưu tiên lửa | Đèo có thể hạn chế |
| MAP-NPC-025 | Dị tượng (Âm Vũ) | Hoảng loạn, cầu khấn hoặc lợi dụng | Incident/influence biến động |

| ID | Rule |
|---|---|
| MAP-NPC-026 | Severity có hysteresis: vào shelter khi `severity ≥ enterThreshold`, rời khi `severity ≤ leaveThreshold` (`leaveThreshold < enterThreshold`); không đổi trạng thái mỗi tick. Modifier thời tiết có `sourceRegion`, `startDay`, `endDay`, `severity`. |
| MAP-NPC-027 | Mỗi node khai báo shelter (sức chứa, loại NPC được vào, phí, độ an toàn); đầy thì NPC xếp hàng, tìm sub-location phụ hoặc rời node; UI hiện "Nơi trú đã đầy". |
| MAP-NPC-028 | NPC nhận biết cổng đóng/mở, chợ, kho, bến, lửa trại, miếu, trận pháp, cầu sập, đường ngập, tuyết lở, vùng nhiễm tà, outpost/tháp canh/trạm thương mại/trạm dịch, mật độ người, an ninh, tài nguyên. NPC sửa cầu, dựng shelter, mở chợ, dọn đường tạo `landscapeMutation` qua transaction map (`ownerNpcId`, `requiredItems`, `duration`, `integrity`, `expiresDay`, undo policy); chỉ là overlay runtime. |

### Tương tác NPC–NPC tại node

| ID | Rule |
|---|---|
| MAP-NPC-030 | Loại: giao dịch/mặc cả/vận chuyển; chào hỏi/kết bạn/tranh luận; dạy học/tỷ thí/tuyển mộ; tuần tra/kiểm tra giấy tờ; bảo vệ/cứu thương/chăm sóc; gián điệp/tố giác/đe dọa; yêu đương/hận cũ/thù hằn; tranh chấp tài nguyên/địa vị; mật hội/trao đổi tin; cùng xử lý cảnh quan nguy hiểm. Ít nhất 5 loại có hậu quả state rõ ràng. |
| MAP-NPC-031 | Vòng đời encounter `detected → proposed → accepted/rejected → resolving → resolved` (nhánh `interrupted`); có `encounterId`, cặp actor đã sort, sub-location, danh sách nhân chứng, snapshot thời tiết, lịch sử lựa chọn, cooldown. Một cặp không resolve hai lần trong cùng tick. Resolver kiểm tra thế lực, quan hệ, thời tiết, sub-location, số nhân chứng, mục tiêu, cooldown. |
| MAP-NPC-032 | Encounter bí mật cần sub-location kín, fog đủ, không nhân chứng; bị phát hiện tạo `suspicion`/incident. |
| MAP-NPC-033 | Tin đồn: `rumorStrength = eventImportance × witnessReliability × visibility × distanceDecay × weatherVisibility`; tin có `knownBy`, `confidence`, `expiresDay`, lan tối đa một hop mỗi tick. |
| MAP-NPC-034 | Quan hệ NPC–NPC trục `trust/respect/fear/suspicion` 0–100; mỗi event có `uniqueKey`, không cộng hai lần; ký ức giảm theo half-life trừ event Neo/quest/phản bội (chỉ `suppressed`/`resolved`). NPC tạm thời không tạo quan hệ bền nếu chưa được ghi nhớ. |
| MAP-NPC-035 | Khi người chơi bắt đầu nói chuyện/giao dịch/đấu với NPC, actor bị lock tạm; hết timeout tự giải phóng; reload không để actor bị khóa vĩnh viễn. |
| MAP-NPC-036 | Kinh tế: inventory background dạng aggregate; thương vụ actor dùng inventory instance; không tạo vật phẩm vô hạn từ `backgroundCount`; giao dịch khóa giá/stock ở preview, commit qua transaction, ghi buyer/seller/day. |
| MAP-NPC-037 | Offline: không materialize hàng nghìn actor, không resolve encounter ngẫu nhiên không quan sát được; dùng aggregate cho quần thể; chỉ resolve actor bền, quest, travel, shelter, incident, quan hệ có tác động; UI ghi rõ là mô phỏng nền. |

### UI danh sách NPC tại node

| ID | Rule |
|---|---|
| MAP-NPC-040 | UI chỉ nhận `NpcNodeView[]`; không tự đọc `npcState`. Có bộ lọc vai trò/thế lực/trạng thái, tìm theo tên/nghề, nhóm theo sub-location, phân trang/virtual list, badge (đang di chuyển, đang trú, có nhiệm vụ, đang giao dịch), lý do không thể tương tác, nút theo dõi/đặt lịch gặp, heatmap mật độ dân cư (không render hàng nghìn nút). |
| MAP-NPC-041 | Action Bar chỉ đưa 3–6 NPC quan trọng nhất theo ngữ cảnh; danh sách đầy đủ ở mục Danh sách cư dân. Lân Cận hiện NPC đang ở đâu, giờ có thể gặp, lúc quay lại. |
| MAP-NPC-042 | Mã lỗi tối thiểu (dịch sang tiếng Việt ở UI): `NPC_NOT_PRESENT`, `NPC_BUSY`, `NPC_WEATHER_SHELTER_FULL`, `NPC_ROUTE_BLOCKED`, `NPC_ENCOUNTER_EXPIRED`, `NPC_LOCK_CONFLICT`, `NPC_STATE_CONFLICT`. |
| MAP-NPC-043 | API (preview/commit tương ứng, trả `{ success, reason, data, transactionId, stateVersion }`): `ensureNpcWorldState`, `npcPopulationSnapshot`, `npcPresenceAt`, `npcSchedulePreview`, `npcDecisionPreview`, `moveNpc`, `previewNpcEncounter`, `resolveNpcEncounter`, `npcWeatherPreview`, `resolveNpcWeatherReaction`, `listNodeShelters`, `applyLandscapeMutation`. |

### Hiệu năng và bất biến

| ID | Rule |
|---|---|
| MAP-NPC-050 | Spatial index theo `regionId/nodeId/subLocationId`; không scan toàn bộ NPC mỗi frame; chỉ serialize danh tính bền, actor có quest/quan hệ/incident và seed quần thể; event log giới hạn cửa sổ. Mục tiêu: 5.000 NPC trong một node mở chi tiết < 500 ms, tick < 100 ms trên máy tầm trung. |
| MAP-NPC-051 | Bất biến: NPC sống có đúng một vị trí; `currentSubLocationId` thuộc node hiện tại và không vượt capacity khi không có bản ghi hàng đợi; NPC `traveling` không đồng thời `acting`/giao dịch; NPC `dead/retired` không ở presence list; phản ứng thời tiết, encounter, landscape mutation idempotent; không mutation NPC nào sửa catalog bản đồ tĩnh. |

## Acceptance

- Node thành thị chứa ≥ 1.000 NPC logic không tràn UI, không scan O(N) mỗi frame.
- NPC luôn có `nodeId + subLocationId` hợp lệ khi hiển thị; reload deterministic.
- Hai tương tác cùng tick vào một NPC: chỉ một mutation thành công.
- NPC tuyến không qua cạnh phong tỏa và tìm được đường vòng hợp lệ.
- Save/load giữ instanceId, schedule, route, memory, shelter, lock timeout, encounter journal.
- Gate: `node tools/verify_world_producer_matrix.js`, `node tools/verify_expansion_stress.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-NPC-001 | js/expansion.js:`ensureNpcWorldState`, `updateNpcSchedules` | Khớp |
| MAP-NPC-002..006 | — (`npcPopulationSnapshot`, ecology profile) | Thiếu |
| MAP-NPC-010..014 | js/expansion.js:`updateNpcSchedules` (chưa có utility `needUrgency`, `decisionSeed`, `rerouting`) | Lệch |
| MAP-NPC-020..027 | js/expansion.js:`resolveNpcWeatherReaction` | Khớp |
| MAP-NPC-028 | — (`applyLandscapeMutation`) | Thiếu |
| MAP-NPC-030..032 | js/expansion.js:`resolveOfflineNpcEncounters` (chưa có vòng đời encounter đầy đủ) | Lệch |
| MAP-NPC-037 | js/expansion.js:`simulateWorldAggregate`, `resolveOfflineNpcEncounters` | Khớp |
| MAP-NPC-040..041 | js/ui.js (chưa có `NpcNodeView`) | Lệch |
| MAP-NPC-043 | — (`npcPresenceAt`, `npcPopulationSnapshot`, `previewNpcEncounter`, `listNodeShelters`, `npcWeatherPreview`, `applyLandscapeMutation`) | Thiếu |
