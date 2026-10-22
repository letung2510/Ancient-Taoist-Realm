# Bản đồ — Ảnh hưởng thế lực, công trình và tuyến thương mại

## Mục đích

Ảnh hưởng thế lực dạng gradient trên node, trạng thái địa bàn, công trình bản đồ (Truyền Tống Trận, Hộ Giới Đại Trận…), trạm tiền tiêu người chơi, hiến lãnh thổ, tuyến thương mại, tuần tra, bảng tin và chòm sao tổ chức. Chiến tranh và sức mạnh thế lực ở cấp mô phỏng thuộc [../world-simulation/README.md](../world-simulation/README.md); binh đoàn: [armies-and-atmosphere.md](armies-and-atmosphere.md).

## Dữ liệu & trạng thái

```js
InfluenceDTO { nodeId, discovered, source, factions: [{ factionId, score, tier }], influenceMap,
  ownerFactionId, contested, pressure, confidence, revision, coordinateValid }
Structure { id, type, nodeId, ownerType, ownerId, builtByCharacterId, builtAt, integrity, level,
  charges, effects, upkeep, transferHistory, status: "active" | "damaged" | "disabled" | "dismantled" }
TradeRoute { id, fromNodeId, toNodeId, caravanPosition: { x, y }, status: "active" | "raided" | "blockaded" }
```

- `state.mapState.structures[nodeId]`, `state.mapState.eventInfluence`, `influenceRevision`.
- API: `mapInfluenceSnapshot`, `computeMapInfluence`, `refreshMapInfluence`, `recordMapEventInfluence`, `mapOwner`, `mapZoneStatus`, `organizationCoverageSnapshot`, `buildMapStructure`, `repairMapStructure`, `upgradeMapStructure`, `disableMapStructure`, `dismantleMapStructure`, `transferMapStructure`, `wardProtectionAtNode`, `claimOutpost`, `petitionOutpostToFaction`, `createTradeRoute`, `updateTradeRoutes`.

## Rules

### Ảnh hưởng (influence)

| ID | Rule |
|---|---|
| MAP-INF-001 | Influence là state dẫn xuất, không lưu owner tĩnh. BFS từ node nhà của thế lực: `influence = power × 0.70^distance × (1 + structureBonus + outpostBonus + eventBonus)`, clamp `[0, 100]`. `ownerFactionId` là getter suy ra từ influence. |
| MAP-INF-002 | Trạng thái địa bàn: **Ổn định** khi top ≥ 35 và chênh lệch top/second ≥ 15%; **Tranh chấp** khi hai thế lực đầu chênh < 15%; còn lại **Biên giới** (không ai vượt ngưỡng — vô chủ thực sự, không mặc định thuộc thế lực gần nhất). |
| MAP-INF-003 | Influence chi tiết chỉ tính cho node đã khám phá (`fogState ≥ 2`, đã ghé hoặc đang đứng). Node chưa khám phá không lộ gradient; chỉ nhận tín hiệu từ world/random event đã ghi trong `mapState.eventInfluence`. Event influence hết hạn theo ngày và không thành ownership vĩnh viễn nếu chưa có claim/ngưỡng. |
| MAP-INF-004 | Cache theo `worldTick + factionVersion + structureVersion + eventVersion`, rebuild deterministic; invalidate sau sự kiện faction/war/structure/claim/ownership/weather. |
| MAP-INF-005 | `mapInfluenceSnapshot`, UI bản đồ, travel plan và điều kiện xây dựng dùng cùng resolver; UI không tự tính luật. |
| MAP-INF-006 | `organizationCoverageSnapshot(state, nodeId)` dựa trên khoảng cách Oxy tới tổng đàn, cấp tổ chức, tài nguyên/sức mạnh, outpost/structure tại node, ngoại giao, chiến tranh/phong tỏa. Coverage không làm mất liên kết di chuyển. |
| MAP-INF-007 | `faction.power = (cảnh giới cao nhất × 10) + (quy mô × 5) + 0,5 × (Linh Thạch + Linh Mạch + Đan Dược + Pháp Bảo) + 3 × (số node đang sở hữu theo influence)`; ×0,7 nếu trait "Đang suy tàn", ×1,3 nếu "Đang trỗi dậy"; ×0,5 khi đang Đình Chiến do thời tiết (MAP-WTH-030). |
| MAP-INF-008 | Node Tranh chấp: `eventPoolTag` trộn trọng số sự kiện của cả hai thế lực; cả hai có thể giao nhiệm vụ tại node; hoàn thành quest cho một bên đẩy influence bên đó lên. |
| MAP-INF-009 | UI Lân Cận hiển thị gradient màu mềm phía sau nhãn, không chỉ một nhãn owner. |

### Công trình bản đồ

| ID | Rule |
|---|---|
| MAP-INF-020 | Tab Thế Giới sở hữu feature **Công Trình Bản Đồ**, gọi một command xây dựng duy nhất. Hai loại canonical người chơi xây: **Truyền Tống Trận** `teleport_array` (mở đầu fast travel ở node) và **Hộ Giới Đại Trận** `world_ward` (giảm encounter/curse risk, tăng influence). Alias legacy `waystation`/`ward_formation` được migrate về canonical mà không mất save. Không dùng tên hiển thị làm ID; không đặt logic này vào Con Đường hay Nghề Ẩn. |
| MAP-INF-021 | Cost baseline: Truyền Tống Trận 20 Linh Thạch, integrity 100, charge 100. Hộ Giới Đại Trận 15 Linh Thạch, integrity 100, giảm SAN drain 25%, encounter risk −20%, curse risk −25% (theo integrity). Repair/upgrade dùng resolver cost, không hard-code trong UI. |
| MAP-INF-022 | Mọi lần xây kiểm tra node hiện tại, không giao chiến, trùng công trình, chi phí, quyền (outpost người chơi hoặc node biên được phép khai phá) và ghi node history. Tối đa ba công trình mỗi node, không trùng `type`. |
| MAP-INF-023 | Vòng đời `preview → establish → maintain`: preview không mutate; establish trừ cost một lần và tạo id; maintain trừ upkeep mỗi world tick; integrity về 0 thì vô hiệu hóa, không xóa lịch sử. |
| MAP-INF-024 | `disable` làm mất ảnh hưởng ngay, giữ dữ liệu. `repair` công trình disabled trả tối thiểu 1 Linh Thạch để tái kích hoạt kể cả khi integrity 100; repair công trình damaged khôi phục integrity và chuyển về `active`. Score active > disabled; score phục hồi sau repair. |
| MAP-INF-025 | `dismantle` (chỉ chủ người chơi): giữ bản ghi `status: "dismantled"`, invalidate influence ngay, hoàn `floor(baseCost[type] × level × 0.4)` Linh Thạch. |
| MAP-INF-026 | Chuyển chủ công trình cho NPC qua transaction riêng, ghi `transferHistory`, không xóa công trình. |
| MAP-INF-027 | Công trình mở rộng: Tháp Canh (tăng bán kính nâng fog quanh trạm), Trạm Dịch (thêm điểm fast travel miễn phí tại đó), Trạm Thương Mại (thương nhân lưu động ghé theo lịch `scheduleType: itinerant`), Trận Pháp Phòng Thủ (tăng power phát influence của trạm). |

### Trạm tiền tiêu và hiến lãnh thổ

| ID | Rule |
|---|---|
| MAP-INF-030 | Lập Trạm (`claimOutpost`) chỉ tại node Biên giới/Tranh chấp chưa có outpost, không giao chiến, đủ chi phí (Linh Thạch + vài ngày GameClock). Node nhận chủ `player_outpost_<characterId>`, phát influence nhỏ theo MAP-INF-001 (power thấp); có thể bị thế lực khác lấn nếu không củng cố. |
| MAP-INF-031 | Hiến trạm (`petitionOutpostToFaction`): người chơi đang phục vụ một thế lực hiến outpost cho thế lực đó → đổi `ownerType/ownerId`, tăng power thế lực, thưởng cống hiến/danh tiếng, ghi history `faction_change`. Lần hiến thứ hai bị từ chối idempotent. |
| MAP-INF-032 | Regression: owner guard, hoàn tiền, invalidate influence, từ chối petition lặp, save round-trip. |

### Tuyến thương mại, tuần tra, bảng tin

| ID | Rule |
|---|---|
| MAP-INF-040 | `TradeRoute` giữa hai node có tọa độ; `caravanPosition` cập nhật mỗi turn dọc đường thẳng nối hai tọa độ, chạy trong world tick chung (không vòng lặp riêng). Người chơi có thể Hộ Tống (tăng an toàn, nhận phí) hoặc gặp Bị Cướp khi đi qua vùng nguy hiểm (tái dùng bảng rủi ro/thời tiết). Bị cướp nhiều lần → `blockaded`, giảm coverage của hai tổ chức đầu tuyến. |
| MAP-INF-041 | Tuần tra là projection trên cạnh `{ patrolCount, factionId, threat, nextTransitionTick }`, icon di chuyển dọc cạnh theo lịch thật; không tạo node. Tuyết tạm dừng tuần tra. |
| MAP-INF-042 | Bảng tin tại node thế lực sở hữu: tối đa ba tin (`faction_daily` quest và "Tin Tức Vùng" — thắng/thua trận, bí cảnh sắp mở), mỗi tin có `requiredFog`, `expiresAt`, `actionId`; lọc trước khi render. Bảng tin chỉ nhận tin đồn đạt confidence tối thiểu. |
| MAP-INF-043 | Chòm sao tổ chức: ở zoom Vùng, các node cùng `organizationId` có coverage > ngưỡng được nối bằng cây khung mảnh màu alignment, kèm tên tổ chức mờ; chỉ là lớp hiển thị. |

## Acceptance

- Influence BFS và ngưỡng tranh chấp đúng; node chưa khám phá không lộ gradient.
- Công trình: thiếu cost bị chặn; maintenance/disable/repair/dismantle đúng; save round-trip giữ dữ liệu.
- Patrol trên cạnh, bulletin hết hạn bị lọc.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-INF-001..005 | js/expansion.js:`computeMapInfluence`, `mapInfluenceSnapshot`, `mapZoneStatus`, `mapOwner` | Khớp |
| MAP-INF-006 | — (`organizationCoverageSnapshot`) | Thiếu |
| MAP-INF-007..009 | js/expansion.js:`computeMapInfluence` | Khớp |
| MAP-INF-020..022 | js/expansion.js:`buildMapStructure`, `mapStructurePreview` | Khớp |
| MAP-INF-023 | js/expansion.js (không có `upkeep`) | Lệch |
| MAP-INF-024..026 | js/expansion.js:`repairMapStructure`, `disableMapStructure`, `dismantleMapStructure`, `transferMapStructure` | Khớp |
| MAP-INF-027 | — | Thiếu |
| MAP-INF-030..032 | js/expansion.js:`claimOutpost`, `petitionOutpostToFaction`, `petitionFactionTerritory` | Khớp |
| MAP-INF-040 | js/expansion.js:`createTradeRoute`, `updateTradeRoutes`, `validateTradeRouteState` | Khớp |
| MAP-INF-041 | — (`patrolCount`) | Thiếu |
| MAP-INF-042 | js/expansion.js (bulletin) | Khớp |
| MAP-INF-043 | — | Thiếu |
