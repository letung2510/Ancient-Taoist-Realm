# Mô phỏng thế giới — Công trình, Hộ Giới Đại Trận, world modifier

## Mục đích

Công trình gắn node là bản ghi runtime có vòng đời giao dịch; Hộ Giới Đại Trận tác động qua resolver chung, không qua cờ UI. `getWorldModifiers` là nơi duy nhất tổng hợp các lớp modifier thế giới cho các hệ khác. Catalog công trình, alias loại và hành động xây nằm ở [map](../map/README.md).

## Dữ liệu & trạng thái

`mapState.structures[nodeId] = [{ id, type, status: "active" | "damaged" | "disabled" | "dismantled", integrity, ownerType: "player" | "npc" | "faction", ownerId, effects: { encounterRisk, curseRisk, influence, sanDrainReduction } }]`.

## Rules

### Vòng đời công trình

| ID | Rule |
|---|---|
| WSIM-WRD-001 | Build, repair, upgrade, disable, dismantle, transfer là hành động giao dịch: kiểm quyền, tài nguyên, trạng thái; ghi node-history; vô hiệu cache influence. Gọi trùng là idempotent hoặc bị từ chối, không trừ tài nguyên lần hai. Catalog không bị sửa lúc chạy. |
| WSIM-WRD-002 | Hành động thay đổi công trình cần người chơi ở node đó, trừ khi luật chủ sở hữu/quản lý cho phép. Quyền: chủ là người chơi → repair/upgrade/dismantle/transfer; công trình thế lực → chỉ thành viên tổ chức đó được repair, không upgrade; còn lại từ chối (`owner_permission`). |
| WSIM-WRD-003 | Hiệu ứng công trình đóng góp vào influence bản đồ và bảo hộ qua snapshot dẫn xuất (`mapInfluenceSnapshot`), không đọc owner rời rạc. |

### Hộ Giới Đại Trận

| ID | Rule |
|---|---|
| WSIM-WRD-010 | `wardProtectionAtNode(state, nodeId)` cộng hiệu ứng mọi ward ở node có status khác `disabled`/`dismantled` và `integrity > 0`: `encounterRisk`, `curseRisk`, `influence`, `sanDrainReduction`. |
| WSIM-WRD-011 | `corruptionReduction = min(0.5, |curseRisk|)` khi có ward; `sanDrainReduction` clamp 0..0.75. Ward active giảm rủi ro gặp địch, áp lực nguyền/Tà Nhiễm và SAN drain; bị hư/tắt thì mất hiệu ứng đến khi sửa xong. |
| WSIM-WRD-012 | Ward đóng góp vào `getWorldModifiers` và resolver influence bản đồ; risk di chuyển dùng ward qua `travelPlan`. |

### World modifier

| ID | Rule |
|---|---|
| WSIM-MOD-001 | `getWorldModifiers(state, context)` trả một DTO (`cultivationMult`, `combatPowerByElement`, `encounterChanceMult`, `searchRiskDelta`, `searchRewardMult`, `marketPriceMult`, `sanDrainMult`, `travelRiskDelta`, `qiRecoveryMult`, `sanRecoveryFlat`, `corruptionResist`, `stealth`, `tags`…) tổng hợp các lớp: Dị Thể, bộ trang bị, thời tiết, influence, công trình, sự kiện thế giới, nghề, tuyến ẩn. Consumer không tự cộng lớp nào bên ngoài DTO này. |
| WSIM-MOD-002 | `worldModifierPreview(state, context)` dùng cùng resolver, không mutate. |
| WSIM-MOD-003 | Thành phần đoàn cho resolver di chuyển: `partySize = 1 + (đồng hành active/mutated ? 1 : 0) + số thành viên party`; `partyWeight = 1 + 0.05 × (partySize − 1)`; tốc độ hiệu lực = `baseSpeed / partyWeight`. Công thức di chuyển dùng giá trị này theo MAP-LC-030 ([map](../map/README.md)). |
| WSIM-MOD-004 | Di chuyển offline/world tick dùng cùng resolver di chuyển và thời tiết như online; catch-up không tạo travel event ngoài số `eventRolls` của plan. Đổi thời tiết/công trình/influence làm plan cũ mất hiệu lực và risk được tính lại. |

## Acceptance

- Tắt ward → hiệu ứng mất ngay; sửa → hiệu ứng trở lại; mỗi chuyển đổi một node-history.
- Gọi build/repair trùng không trừ tài nguyên lần hai.
- Gate: `node tools/verify_map_producer_matrix.js`, `node tools/verify_local_movement_weather.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WSIM-WRD-001 | `js/expansion.js:buildMapStructure`, `repairMapStructure`, `upgradeMapStructure`, `disableMapStructure`, `dismantleMapStructure`, `transferMapStructure`, `validateStructureRuntimeState` | Khớp |
| WSIM-WRD-002 | `js/expansion.js:structureManagerDecision`, `PRODUCT_POLICY` | Khớp |
| WSIM-WRD-003 | `js/expansion.js:mapInfluenceSnapshot` | Khớp |
| WSIM-WRD-010..012 | `js/expansion.js:wardProtectionAtNode`, `getWorldModifiers` | Khớp |
| WSIM-MOD-001..002 | `js/expansion.js:getWorldModifiers`, `worldModifierPreview` | Khớp |
| WSIM-MOD-003 | `js/expansion.js:canonicalTravelPlan` | Khớp |
| WSIM-MOD-004 | `js/expansion.js:canonicalTravelPlan`, `advanceTravelTask` | Khớp |
