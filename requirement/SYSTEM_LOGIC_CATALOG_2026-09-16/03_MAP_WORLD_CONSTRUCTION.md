# WORLD-MAP — MAP V2, TỌA ĐỘ, TƯƠNG TÁC VÀ CÔNG TRÌNH

## 1. Bốn lớp bản đồ

1. World map: vùng lớn, faction heatmap, fog và tuyến chính.
2. Region map: node, cạnh, khoảng cách, influence gradient và travel cost.
3. Node detail: sub-location, actor, structure, resource, weather và interaction.
4. Scene state: vị trí player, NPC, event, log context và camera/UI.

Node không phải toàn bộ địa điểm. Node có thể chứa nhiều sub-location và actor độc lập.

## 2. Schema MapNode

```js
MapNode = {
  id, name, region, x, y, biome, dangerLevel,
  exits: { north, south, east, west },
  subLocations: [{ id, name, tags, capacity, actions }],
  factionPresence: {}, structures: [], resources: [], npcs: [],
  fogTier: 0, discovered: false, history: []
}
```

`x/y` là nguồn định vị; không suy ra khoảng cách từ thứ tự object. Edge hợp lệ phải được kiểm tra hai chiều hoặc có policy one-way rõ ràng.

## 3. Influence gradient

Canonical API phải trả influence của từng faction tại node:

```js
resolveMapInfluence(state, nodeId) -> {
  factions: [{ factionId, score, tier, color, sourceNodes }],
  ownerFactionId, contested, pressure, confidence
}
```

Score bắt đầu từ faction anchor và giảm theo khoảng cách, terrain, structure, war pressure, reputation và world event. Không dùng binary owner làm thay thế gradient. `contested` khi top scores gần nhau hoặc chiến tranh tạo pressure.

Map UI dùng cùng DTO cho heatmap, node detail, faction panel, travel weighting và structure eligibility.

## 4. Fog, completion và node history

Fog có tier: chưa biết, đã thấy vùng, đã biết node, đã khám phá chi tiết. Completion không chỉ là boolean; nó gồm route discovered, sub-location visited, resource/quest clue và structure state. `nodeHistory` ghi lần đến, event, faction change, weather, actor seen và last known state.

History phục vụ UI và resolver nhưng phải giới hạn kích thước, prune theo policy và serialize được.

## 5. Travel

Chi phí di chuyển lấy từ distance, terrain, danger, weather, influence/war, party, carried load và structure. Fast travel chỉ mở đến anchor/waypoint đã biết; không cho teleport đến node chưa discovered. Travel action có pending departure, confirm, interruption, arrival và failure path.

Travel weighting được dùng cho route preview và NPC scheduler, không chỉ cho player.

## 6. Map agency

Player có thể claim outpost, build structure và petition faction. Action cần resource, ownership/pressure, safe location, cooldown và rollback. Claim ảnh hưởng influence nhưng không tự biến thành faction ownership tuyệt đối nếu chưa đạt threshold.

## 7. Công Trình trong tab Thế giới

`Công Trình` là feature riêng trong tab Thế giới, không trộn vào nghề. Registry tối thiểu:

- Truyền Tống Trận: mở fast travel giữa các anchor hợp lệ, có cost/charge/repair.
- Hộ Giới Đại Trận: giảm danger, bảo vệ node, ảnh hưởng NPC shelter và faction pressure.
- Tụ Linh Trận/Hộ Tâm Trận và các structure mở rộng.

Mỗi structure có `id`, `nodeId`, `owner`, `level`, `status`, `builtAtDay`, `durability/charge`, `effects`, `requirements`, `upgradeCost`. Build → active → damaged/disabled → repair/upgrade → dismantle nếu policy cho phép. UI chỉ gọi project resolver; không tự cộng effect.

## 8. UI map

UI cần render current region, influence gradient, fog tier, completion, node history, sub-location selector, travel preview, structure cards và camera cosmic constellation. Tín hiệu influence/completion phải đến từ API canonical; không đọc field rời rạc trong `world_data`.

## Note chưa hoàn thiện

- **MỘT PHẦN**: cần thống nhất một API influence runtime duy nhất và loại bỏ các đường đọc faction rời rạc còn lại.
- **MỘT PHẦN**: completion và node history đã có contract nhưng cần audit mọi action để ghi đủ sub-location/structure.
- **THIẾT KẾ**: cần chốt bảng cost/durability/upgrade cho Truyền Tống Trận và Hộ Giới Đại Trận.
- **MỘT PHẦN**: fast travel cần test đầy đủ với weather/war/contested weighting.
