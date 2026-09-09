# CỔ DỊ DIỆN — SPEC HỆ THỐNG TÍNH NĂNG MỚI TOÀN BỘ

> Implementation specification hợp nhất từ `PLAN_TINH_NANG_MOI.md`, `WORLD_INTERCONNECTION_SYSTEM.md` và `PHAC_THAO_TINH_NANG_MOI_V2.md`. Tài liệu này bổ sung hệ Tiến Hóa Mệnh Số và là contract để chia phase triển khai; không tự thay thế các luật canonical hiện hành.

## 1. Mục tiêu và quyết định kiến trúc

### 1.1. Mục tiêu

- Biến các module hiện có thành một thế giới có nhịp, có ký ức và phản ứng chéo.
- Tăng lựa chọn trong combat, khám phá, tu luyện, quan hệ, phe phái và Luân Hồi.
- Mọi feature mới phải dùng state machine, GameClock, quest, action context, UI và save hiện tại.
- Nội dung mở rộng theo data template; không hard-code riêng cho hàng trăm tông môn, NPC hoặc hàng nghìn Mệnh Số.

### 1.2. Quyết định bắt buộc

1. Game tiếp tục là **single-player, per-save world state**. “Server-wide” trong tài liệu cũ được hiểu là “toàn thế giới của save hiện tại”. Không thêm backend, leaderboard hoặc shared ownership.
2. `js/engine.js` sở hữu rule và transaction. `js/ui.js` chỉ render; `js/main.js` chỉ điều phối event/render/save.
3. Simulation dùng GameClock nhưng phải deterministic và có giới hạn catch-up. Không roll bằng `Math.random()` trong world tick mới.
4. Không tạo combat/map/quest/inventory thứ hai. Bí Cảnh vẫn dùng `LOCATIONS`, `locationExits`, search, entity và combat hiện tại với namespace riêng.
5. Mọi state mới có default ở `createState`, normalize ở `deserialize`, serialize round-trip và test migration.
6. Khi feature persistent đầu tiên được phát hành, tăng save từ version 12 lên **version 13** một lần; các module sau dùng `featureVersions` thay vì tăng version cho từng field nhỏ.
7. Các thay đổi sức mạnh phải đi qua resolver tập trung; UI preview phải gọi cùng resolver với runtime.

## 2. Phạm vi feature và truy vết nguồn

| Spec ID | Feature hợp nhất | Nguồn được bao phủ |
|---|---|---|
| SYS-00 | World Simulation Kernel | World tick, offline simulation, nền cho mọi world feature |
| SYS-01 | Dị Triều, thiên tượng, mùa, thời tiết, thiên tai | PLAN F01; V2 J.2/J.3/L.1/L.2; tiền triệu Tà Thần |
| SYS-02 | Ngoại giao, chiến tranh, nội bộ faction, đại hội, công trình tông môn | WORLD 2; PLAN F06; Tông Môn Đại Hội |
| SYS-03 | NPC schedule, tương tác NPC-NPC, Nhân Duyên Có Trí Nhớ, truyền thư, bounty | WORLD 3; PLAN F02; V2 M.2/O.1 |
| SYS-04 | Công Pháp tiến hóa và khung Nghề Nghiệp | PLAN F03; V2 H.1–H.4 |
| SYS-05 | Contract, bắt sống, thẩm vấn, tình báo và thân phận giả | PLAN F04; V2 I.1–I.3/N.1–N.2 |
| SYS-06 | Vật phẩm thức tỉnh, luyện khí, di truyền và đấu giá | PLAN F05; V2 H.2/K.2/O.2 |
| SYS-07 | Chế ngự/thuần hóa Dị Thú | PLAN F07; WORLD 7.C |
| SYS-08 | Dị Chí, xem quẻ, sổ sinh tồn và dấu vết | PLAN F08; V2 J.1/M.1/O.3; WORLD 7.D |
| SYS-09 | Cơ duyên tranh chấp và Bí Cảnh Ẩn | WORLD 5–6 |
| SYS-10 | Thiên Kiếp cá nhân hóa | PLAN F09; mở rộng nghi thức hiện tại |
| SYS-11 | Di sản Luân Hồi và mộ tiền kiếp | PLAN F10; V2 K.1–K.2 |
| SYS-12 | Tiến Hóa Mệnh Số | Yêu cầu bổ sung; nối nâng cấp, quan hệ, cộng minh và thí luyện |

Các feature nghề Luyện Khí và item awakening dùng chung SYS-06; không được triển khai thành hai catalog vật phẩm khác nhau. Thời tiết là modifier con của SYS-01; không tạo stat thời tiết trong player.

## 3. Nền dữ liệu và state chung

### 3.1. State root version 13

```js
state.meta.featureVersions = {
  worldSimulation: 1,
  relationships: 1,
  techniqueEvolution: 1,
  professions: 1,
  contracts: 1,
  itemLegacy: 1,
  companions: 1,
  discoveries: 1,
  reincarnationLegacy: 1,
  fateEvolution: 1
};

state.worldSimulation = {
  seed: string,
  lastProcessedDay: number,
  nextEventSeq: number,
  events: {},             // eventInstanceId -> WorldEventInstance
  regionState: {},        // regionId -> RegionRuntimeState
  factionState: {},       // factionId -> FactionRuntimeState
  diplomacy: {},          // stablePairKey -> DiplomacyRecord
  wars: {},               // warId -> WarRecord
  npcState: {},           // notableNpcId -> NotableNpcRuntime
  hiddenRealms: {},       // realmId -> HiddenRealmRuntime
  scheduledTasks: []      // compact tasks ordered by dueDay
};
```

Không persist cache dẫn xuất như active modifier tổng, icon class hoặc pathfinding result. Chúng được tính lại sau load.

### 3.2. Ngày tuyệt đối

Thêm helper thuần:

```js
gameDayOrdinal(gameClock) -> integer
```

Mọi `startDay`, `endDay`, `dueDay`, cooldown và lịch mùa dùng ordinal; không dùng `Date.now()` cho luật gameplay mới. Thời gian thực chỉ dùng xác định lượng offline đã trôi trước khi quy đổi sang game day.

### 3.3. RNG deterministic

```js
worldRandom(state, scopeKey, dayOrdinal, rollIndex = 0) -> number [0, 1)
```

Seed được tạo từ `state.worldSimulation.seed + scopeKey + dayOrdinal + rollIndex`. Cùng save, cùng day và cùng scope phải cho cùng kết quả. Transaction chỉ commit `nextEventSeq` sau khi instance được tạo thành công.

### 3.4. Modifier pipeline chung

```js
getWorldModifiers(state, context) -> {
  cultivationMult, combatPowerByElement, encounterChanceMult,
  searchRiskDelta, searchRewardMult, marketPriceMult,
  sanDrainMult, travelRiskDelta, tags
}
```

`context` gồm `regionId`, `locationId`, `activity`, `element`, `entityId`. Resolver hợp nhất season → weather → region event → war → formation. Mỗi field có cap:

- Multiplier tổng: 0.50–2.00.
- Delta chance: -0.30–+0.30.
- SAN multiplier: 0.50–2.00.
- Giá: 0.60–2.50.

### 3.5. Transaction và idempotency

- Mọi resolve function trả `{success, changes, rewards, consequences, history}`.
- Chi phí chỉ trừ sau validation đầy đủ.
- Task/event có `resolvedAtDay` hoặc `processedKey` để không nhận thưởng hai lần khi load.
- Những action nguy hiểm có `requiresConfirmation` giống `useTechnique`.

## 4. SYS-00 — World Simulation Kernel

### 4.1. API

```js
ensureWorldSimulation(state)
simulateWorldUntil(state, targetDay, options = {})
simulateWorldTick(state, dayOrdinal)
scheduleWorldTask(state, task)
cancelWorldTask(state, taskId)
processScheduledWorldTasks(state, dayOrdinal)
worldSimulationSummary(state)
```

`advanceGameTime()` gọi `simulateWorldUntil()` sau mỗi ngày đã chuẩn hóa. `deserialize()` gọi nó sau khi `applyOfflineProgress()` xác định target day.

### 4.2. Thứ tự một tick

1. Chuyển phase/kết thúc event đến hạn.
2. Cập nhật mùa và weather region.
3. Xử lý diplomacy/faction internal event/war front.
4. Xử lý lịch Notable NPC và task truyền thư/bounty.
5. Kiểm tra cửa Bí Cảnh.
6. Sinh tối đa một event mới mỗi region đủ cooldown.
7. Ghi tối đa một history summary nếu người chơi bị ảnh hưởng trực tiếp; thay đổi nền đi vào Dị Chí “Thế Sự”.

### 4.3. Catch-up offline

- Tối đa 30 tick đầy đủ gần nhất.
- Phần vượt 30 ngày dùng `simulateWorldAggregate(startDay, endDay)`: chỉ chuyển phase, expiry, schedule deterministic và kết quả chiến tranh theo batch; không sinh chuỗi encounter/quest bỏ lỡ.
- Omen chưa được người chơi nhìn thấy phải giữ tối thiểu một phiên đăng nhập trước khi chuyển active.
- Không cho event gây chết, mất item hoặc cưỡng bức Luân Hồi khi offline.

### 4.4. Acceptance

- Hai clone cùng seed và input cho state world giống nhau.
- Gọi lại cùng target day không thay đổi state.
- 10.000 ngày catch-up không treo UI và không tạo 10.000 history entry.
- Save/load giữa tick không nhân đôi task hoặc reward.

## 5. SYS-01 — Dị Triều, Thiên Tượng, Mùa, Thời Tiết và Thiên Tai

### 5.1. Data schema

```js
WorldEventTemplate {
  id, name, category: "di_trieu"|"sky_omen"|"natural_disaster"|"tainted_omen",
  eligibleRegionTags: [], weight, cooldownDays,
  phases: [{id:"omen"|"active"|"aftermath", durationDays, modifiers, narrativeKey}],
  questTemplateIds: [], encounterTags: [],
  choices: [{id, label, requirements, costs, contribution, consequences}],
  outcomes: [{id, threshold, regionEffects, rewards, permanentChanges}]
}

WorldEventInstance {
  id, templateId, regionId, phaseIndex, phaseStartedDay, phaseEndsDay,
  seed, playerContribution, choiceHistory: [], status, outcomeId
}
```

### 5.2. Mùa và weather

- 12 tháng chia bốn mùa, mỗi mùa ba tháng.
- Season modifier theo Ngũ Hành: Hạ/Hỏa, Đông/Thủy, Xuân/Mộc, Thu/Kim; Thổ nhận bonus nhỏ ở thời điểm giao mùa.
- Bonus/penalty MVP: ±10% cultivation effect và ±10% element combat coefficient; không tác động base stat.
- Mỗi region có weather đổi theo 1–3 ngày: quang, mưa, sương, lôi vũ, linh phong.
- UI phải preview modifier tại Status/Map và trong `techniquePreview`.

### 5.3. Event MVP và cascade

Tối thiểu bốn template:

1. **Huyết Nguyệt:** predator/elite tăng, rare loot tăng, SAN drain tăng.
2. **Linh Mạch Nghịch Lưu:** cultivation giảm nhưng search lộ khoáng/vật liệu hiếm.
3. **Bão Linh Khí:** một đến hai node nguy hiểm; cứu trợ hoặc khai thác.
4. **Tà Thần Tiền Triệu:** omen toàn world, faction tension tạm giảm vì kẻ thù chung, market phòng hộ tăng giá.

World event cao cấp được phép tạo refugee quest, giảm resource faction và đổi node thành Cấm Địa sau outcome thất bại. Permanent change phải là outcome đã được chơi/quan sát, không xảy ra âm thầm khi offline.

### 5.4. UI/action

- Game clock thêm icon mùa/weather.
- World map có badge event, phase và số ngày còn lại.
- Quest tab nhóm objective theo event.
- `contextState` thêm action event khi đúng vùng; action không cấp bách nằm trong overflow.

### 5.5. Acceptance

- Modifier preview bằng đúng modifier áp trong combat/cultivation/search/market.
- Event chuyển phase và cleanup modifier chính xác.
- Rời vùng là lựa chọn hợp lệ; không khóa Đột Phá.
- Tà Thần omen không spam history mỗi tick.

## 6. SYS-02 — Thế Lực Động, Chiến Tranh, Đại Hội và Công Trình

### 6.1. State

```js
FactionRuntimeState {
  factionId, power, resources, stability, reputationWithPlayer,
  ownedNodeIds: [], traits: [], activeProjectId, lastInternalEventDay
}
DiplomacyRecord {
  factionA, factionB, tension: -100..100,
  status: "dong_minh"|"trung_lap"|"thu_dich", reasons: [], lastChangedDay
}
WarRecord {
  id, factionA, factionB, startedDay, frontNodeIds: [], scoreA, scoreB,
  status: "active"|"truce"|"ended", playerInterventions: []
}
```

Pair key phải sort hai faction ID để không có hai bản ghi A–B/B–A.

### 6.2. Diplomacy rule

- Base tension lấy từ alignment/trait/diplomacy data hiện có.
- Mỗi 7 ngày mới drift một lần, không đổi hàng ngày.
- Tranh tài nguyên: +2 đến +5; nợ máu: +5; kẻ thù chung: -5; player can thiệp: tối đa ±15/event.
- `tension <= -60` là đồng minh; `>= 60` là thù địch. Chiến tranh chỉ mở khi thù địch đủ 7 ngày hoặc có trigger đặc biệt.
- Cooldown 30 ngày sau hòa ước để tránh chiến tranh lặp.

### 6.3. War

- Front chỉ gồm node thuộc hai bên có edge giáp nhau.
- `factionPower = highestRealmWeight × scale × resourceFactor × stabilityFactor`.
- Mỗi 3 ngày resolve một battle deterministic, tối đa một node đổi chủ.
- Player tham chiến qua quest/combat thật; thắng cộng war score, không tự động bảo đảm chiếm node.
- Sơn Môn chính không bị xóa; khi thua chuyển thành `occupied` và mở liberation quest.

### 6.4. Nội bộ faction

Trait → event template: lục đục/phản bội, suy tàn/mất resource, trỗi dậy/claim node, thánh địa/mở Bí Cảnh, bí pháp thất truyền/discovery quest. Mỗi faction tối đa một internal event active.

### 6.5. Tông Môn Đại Hội

- Scheduled world event 30 ngày, mở theo năm hoặc era rule.
- Player đủ membership/rank tham dự bracket PvE 3 vòng dùng entity scaling hiện tại.
- Có nhánh quan sát, tham dự, gian lận hoặc bỏ qua; gian lận dùng intel/cover và có suspicion.
- Reward: contribution, merit, technique trial token; không phát thẳng Tiên Phẩm.

### 6.6. Công Trình Tông Môn

```js
GuildProject { id, guildId, templateId, startDay, endDay, progress,
  playerContributions: {}, milestones: [], status }
```

Ba template MVP: tu sửa Linh Mạch, dựng Hộ Sơn Trận, truy tìm Bí Pháp. Đóng góp item/merit/combat objective. Contribution dự án tách khỏi `guildMembership.contribution` dùng cho rank.

### 6.7. UI/test

- Map edge tô theo diplomacy; node chiến tranh có icon kiếm.
- Guild panel có diplomacy, project và Đại Hội.
- Test threshold, pair key, cooldown, front detection, project expiry, leave guild giữa project và save round-trip.

## 7. SYS-03 — NPC Sống, Nhân Duyên Có Trí Nhớ, Truyền Thư và Bounty

### 7.1. Notable NPC runtime

```js
NotableNpcRuntime {
  npcId, currentNodeId, homeNodeId,
  scheduleType: "static"|"patrol"|"itinerant",
  route: [], routeIndex, nextMoveDay, status: "alive"|"missing"|"captured"|"dead",
  factionId, role, relationshipsWithNpcs: {}, memoryWithPlayer: [], mailbox: []
}
```

Chỉ NPC có `notable:true` được tick lịch. MVP tối đa 20 NPC; không simulate mọi NPC catalog.

### 7.2. NPC-NPC encounter

Khi hai notable NPC cùng node, tối đa một interaction/node/day: giao dịch, đấu khẩu, tỷ thí hoặc mật hội. Nếu player có mặt, sinh action nghe lén/can thiệp/quan sát; nếu vắng mặt chỉ ghi world fact quan trọng, không tạo loot miễn phí.

### 7.3. Quan hệ người chơi

Record hiện hữu `trust/fear/respect/suspicion` được giữ, clamp 0–100. Bổ sung:

```js
relationshipEvents[npcId] = [{
  id, tag, day, locationId, questId, outcome, deltas, uniqueKey
}];
```

Tag MVP: `saved`, `threatened`, `kept_promise`, `broke_promise`, `shared_reward`, `used_forbidden_art`, `supported_faction`, `abandoned`.

- Mỗi unique event chỉ áp delta một lần.
- Dialogue tier lấy từ resolver, không đọc một stat đơn lẻ.
- Favor yêu cầu tổ hợp; ví dụ trust ≥60 và suspicion <40.
- Fear mở ép buộc nhanh nhưng tăng suspicion/betrayal.
- Tự nguyện làm Neo yêu cầu trust hoặc respect; cưỡng ép Neo bị cấm.

### 7.4. Truyền thư

Chỉ gửi tới NPC đã gặp hoặc Neo. Chi phí theo khoảng cách region, thư có `dueDay`. Có thể gửi message template và một item; item bị reserve ngay, hoàn lại nếu NPC chết/mất trước khi gửi. Reply là task mới, không tức thời.

### 7.5. Personal bounty

Player treo Linh Thạch lên hostile notable NPC. NPC hunter nhận bounty theo world tick; kết quả là weaken/locate/capture, không tự giết boss/story NPC. Persist seed và claimant để chống reload reroll.

### 7.6. UI/test

- Map hiện avatar notable NPC đã biết vị trí; thông tin cũ có timestamp.
- Nhân duyên hiện tier, bốn chỉ số, ký ức gần nhất và action.
- Test schedule, collision interaction, duplicate memory, mail delivery/refund, bounty không xóa critical NPC.

## 8. SYS-04 — Tiến Hóa Công Pháp và Khung Nghề Nghiệp

### 8.1. Tiến Hóa Công Pháp

Giữ schema `evolutionPaths` hiện hữu và bổ sung:

```js
evolutionPaths: [{
  id, name, trigger: {masteryStage: 2}, trialTemplateId,
  modifiers, tradeoff, pathRequirements: [], description
}]
techniqueProgress[id].evolution = {
  status: "locked"|"trial"|"ready"|"chosen",
  trialQuestId, evolutionId, chosenAtDay
}
```

- Khi `updateTechniqueMastery()` lần đầu đạt stage 2, tạo trial.
- Trial phải dùng chính family/category của Công Pháp.
- Hai nhánh là sidegrade; preview gọi `resolveTechniqueModifiers()` giống runtime.
- MVP: ba technique phổ biến, mỗi technique hai nhánh.

### 8.2. Profession framework

```js
professionState = {
  primaryId: null,
  professions: {
    [id]: { masteryExp, masteryStage, recipesKnown: [], specializations: [], lastActionDay }
  }
}
ProfessionDefinition {
  id, name, relatedPathIds, relatedTechniqueFamilies,
  masteryThresholds, recipeIds, actionTemplates
}
```

Chỉ có một nghề chính nhận 100% mastery; nghề phụ nhận 25%. Profession mastery khác technique mastery nhưng dùng chung threshold resolver/UI component.

### 8.3. Luyện Đan

- Recipe dùng material từ inventory; transaction rollback nếu input invalid, không rollback khi roll luyện thất bại hợp lệ.
- Kết quả `fail/normal/perfect` theo aptitude + profession mastery + cauldron/item quality.
- Perfect pill dùng affix data-driven, không tạo effect ngoài whitelist.
- Diên Thọ Đan tiếp tục chịu diminishing return/trần canonical.

### 8.4. Luyện Khí

- Dùng material quái/khoáng + base recipe → `registerGeneratedItem`.
- Cho đặt tên sau khi item được tạo; lọc độ dài như tên nhân vật.
- Tỷ lệ spiritual awakening chuyển qua SYS-06; không copy logic quan hệ Mệnh.

### 8.5. Trận Pháp Sư

```js
PlacedFormation { id, techniqueId, ownerId, nodeId, createdDay,
  expiresDay, charges, purpose: "combat"|"protect"|"gather"|"trap" }
```

Formation dùng Công Pháp `tran_phap`, material và world task. Offline chỉ tiêu charges/cho reward theo cap; không farm vô hạn. Mỗi player tối đa ba trận active MVP.

### 8.6. Tướng Sư

Action xem tướng dùng comprehension/aptitude skill check, chỉ reveal field nằm trong allowlist: alignment hint, element, faction suspicion hoặc hidden tag clue. Thất bại có thể trả kết quả mơ hồ nhưng không được mutate fact thật. Với Mệnh, chỉ reveal hidden insight khi fate definition cho phép.

### 8.7. Acceptance

- Evolution trial chỉ sinh một lần.
- Recipe atomic; generated item save/load được.
- Formation offline reward có cap.
- Tướng Sư không lộ boss/ending flag và perceived info được đánh dấu khác fact.

## 9. SYS-05 — Contract, Bắt Sống, Thẩm Vấn và Tình Báo

### 9.1. Contract board

```js
ContractInstance {
  id, templateId, issuerFactionId, targetEntityId, regionId,
  generatedDay, expiresDay, seed, status,
  objectives: [], allowedOutcomes: [], rewardTableId, acceptedAtDay
}
```

Board refresh theo GameClock, tối đa ba offer/region. Template: hunt, investigate, capture, escort, retrieve. Reward cố định từ seed lúc sinh, không reroll khi mở UI.

### 9.2. Capture

- Action Chế Ngự xuất hiện khi target có `capturable:true`, HP ≤25%, player không ở trạng thái mất trí và có dây/ấn phù hợp.
- Check dùng PHY hoặc MAG theo dụng cụ, chênh realm và trạng thái target.
- Thành công gọi `endCombat` với outcome `captured`; không roll kill loot đầy đủ.
- Boss/god/quest-critical mặc định không capturable trừ template override.

```js
prisoners[id] = { entityId, capturedDay, locationId, resolveByDay,
  resistance, intelPoolId, status }
```

### 9.3. Interrogation

Ba cách:

- Thuyết phục: trust/reputation/comprehension, không Corruption.
- Uy hiếp: fear/PHY, tăng suspicion/danh tiếng xấu.
- Tà thuật: MAG + Corruption, tốn SAN và tăng Corruption; cần xác nhận.

Kết quả reveal `IntelRecord`, không trả trực tiếp raw secret state. Sau đó chọn thả, giao tông môn hoặc xử tử; mỗi lựa chọn có consequence.

### 9.4. Intel market

```js
IntelRecord { id, topicType, targetId, claim, confidence: 0..1,
  truthKey, sourceId, acquiredDay, expiresDay, verified }
```

Thông tin sai chỉ sai ở `claim`; `truthKey` dùng nội bộ và không render. Mua/bán qua market extension. Divination/Tướng Sư/điều tra có thể tăng confidence hoặc verify.

### 9.5. Cover identity và counter-intel

```js
coverIdentity = { id, targetFactionId, alias, quality, suspicion,
  createdDay, status: "active"|"burned"|"retired" }
```

- Chỉ một cover active.
- Detection dựa trên quality, player fame/reputation thật, contradiction tag và counter-intel của faction.
- Bị lộ không luôn combat tức thời: result table gồm cảnh cáo, trục xuất, truy sát hoặc combat tùy node.
- Counter-intel event sinh prisoner/contract và source faction clue.

### 9.6. Acceptance

- Capture outcome không đồng thời nhận kill loot.
- Interrogation cost/reward atomic và dangerous action xác nhận.
- Intel sai không thay đổi world truth.
- Cover không cho gia nhập hai guild thật hoặc nhận vĩnh viễn signature technique của phe giả.

## 10. SYS-06 — Vật Phẩm Thức Tỉnh, Di Truyền và Đấu Giá

### 10.1. Item legacy

Chỉ generated equipment hoặc item definition có `canAwaken:true` tham gia.

```js
generatedItems[id].legacy = {
  usageCounters: {combatWins, eliteWins, forbiddenUses, regionsVisited},
  marks: [], awakeningStatus: "dormant"|"ready"|"awakened"|"sealed",
  awakeningId, bondLevel, heirloom: false, reincarnations: 0, wear: 0
}
```

Awakening template chọn theo item category, element, marks và hành vi. Mỗi template có một boon và một trade-off. Không tự thức tỉnh; player xác nhận tại Inventory/Hư Thiên Đỉnh.

### 10.2. Heirloom

- Đánh dấu Di Truyền tốn material + merit, tối đa một item.
- `processLuanHoi/processChuyenSinh` giữ item này theo luật mới, tăng `reincarnations` và `wear`.
- Mỗi kiếp giảm tối đa 5% hiệu lực, cap 25%; Luyện Khí Sư có recipe Tu Bổ.
- Không cho đánh dấu quest item, consumable hoặc cursed item chưa giám định.

### 10.3. Auction

Auction là local NPC simulation:

```js
AuctionLot { id, itemKind, itemId, sellerId, startDay, endDay,
  reservePrice, currentBid, bidderId, npcBidProfileIds: [], status }
```

Bid NPC deterministic theo wealth proxy faction/resource và preference tag. Player tiền được reserve khi dẫn đầu, hoàn lại khi bị vượt. Không dùng realtime; mỗi lượt hoặc game day xử lý bid tới hạn.

### 10.4. Acceptance

- Item awakening không mutate static catalog.
- Heirloom giữ đúng một item và wear cap đúng.
- Auction load không reroll đối thủ; tiền reserve không nhân đôi/mất sai.

## 11. SYS-07 — Chế Ngự và Thuần Hóa Dị Thú

### 11.1. State và rule

```js
companion = {
  entityId, customName, bondedDay, loyalty: 0..100,
  element, originRegionId, corruption: 0..100,
  passiveId, state: "active"|"resting"|"mutated"|"lost"
}
```

- Dùng capture framework SYS-05 với target `beast:true`.
- Sau capture, chọn thuần hóa hoặc giao nộp; thuần hóa check aptitude + Ngự Thú path bonus + element relation.
- MVP chỉ một companion, không có turn AI riêng.
- Passive: trinh sát node, giảm travel risk hoặc combat opener nhỏ; mỗi companion chỉ một passive active.
- Ở vùng corruption cao lâu ngày tăng mutation meter; mutation tạo event lựa chọn chữa trị, chấp nhận biến dị hoặc mất thú.

### 11.2. Faction/map link

Thú trinh sát gọi reveal API của open-world map, không tự generate vô hạn; một lần/ngày, một node. Faction phản ứng chỉ bằng relationship event nhỏ theo tag beast/origin, không đổi diplomacy trực tiếp trong MVP.

### 11.3. Acceptance

- Chế Ngự chỉ hiện đúng HP/target.
- Không nhận cả companion và full kill loot.
- Scout không reveal node bị realm gate khóa.
- Mutation không xảy ra gây mất companion khi offline mà không cho player phản ứng.

## 12. SYS-08 — Dị Chí, Xem Quẻ, Sổ Sinh Tồn và Dấu Vết

### 12.1. Discovery registry

```js
discoveries = {
  fates: {}, techniques: {}, entities: {}, locations: {},
  worldEvents: {}, factions: {}, hiddenRealms: {}, intel: {}
};
DiscoveryEntry { firstSeenDay, level: 1..3, source, clueIds: [], completedSetIds: [] }
```

Level 1 biết tên/dấu hiệu; level 2 biết rule quan sát được; level 3 biết counter/source. Hidden/forbidden info không unlock chỉ vì catalog tồn tại.

### 12.2. Dị Chí và set clue

- Hook tại `receiveFate`, `learnTechnique`, encounter, location visit, event resolve và intel verify.
- Bộ khám phá không thưởng raw stat lớn; reward là clue, recipe, quest seed hoặc cosmetic title.
- Mục “Thế Sự” ghi chiến tranh, Bí Cảnh, NPC notable mất tích/chết và permanent map change.

### 12.3. Xem Quẻ

- Toán Mệnh Sư hoặc nghề Tướng Sư tạo `DivinationHint` về một hướng, event, Đột Phá hoặc contract.
- Hint dựa trên future seed thật nhưng giảm độ chính xác theo skill/SAN; không thay kết quả sau khi xem.
- Text mơ hồ, UI hiển thị expiry và confidence tier, không hiển thị phần trăm thật.

### 12.4. Survival log

Tính từ lifespan còn lại, EXP/cultivation trung bình 20 action gần nhất và requirement cảnh kế. Chỉ cảnh báo khi sample đủ và projected days vượt lifespan buffer. Đưa ra action hợp lệ hiện tại: bế quan, tìm đan, quest, cải thiện Mệnh; không tự chơi.

### 12.5. Player marks

Single-player only: tối đa một note/node, 120 ký tự, tồn tại xuyên kiếp nếu chọn legacy tương ứng. Note là local text, không render HTML, không dùng làm gameplay truth.

### 12.6. Acceptance

- Không spoil discovery chưa gặp.
- Divination không reroll future event.
- Survival warning biến mất khi projection đủ an toàn.
- Mark escape HTML và save/load đúng.

## 13. SYS-09 — Cơ Duyên Tranh Chấp và Bí Cảnh Ẩn

### 13.1. Contested opportunity

Rare search/fate/technique reward có thể tạo contender notable NPC. Player chọn:

- Nhường: relation/reputation tăng, không nhận main reward.
- Tranh: skill check hoặc combat; thất bại không được reward.
- Chia sẻ: reward table giảm theo rule, tạo relationship event.

Contender và reward seed persist trước khi choice UI mở.

### 13.2. Hidden Realm data

```js
HiddenRealmDefinition {
  id, name, parentNodeId, ownerFactionId,
  unlockCondition: {type:"item_key"|"fate_combo"|"faction_reputation"|"world_event", value},
  openRule: {cycleDays, durationDays, oneShot},
  nodeTemplates: [], competingFactionIds: [], rewardTableId
}
HiddenRealmRuntime {
  id, cycleIndex, status: "sealed"|"omen"|"open"|"closed"|"exhausted",
  opensDay, closesDay, generatedNodeIds: [], claimedRewardKeys: [], competitorProgress: {}
}
```

### 13.3. Rule

- Instanced nodes dùng `LOCATIONS` runtime namespace `hidden:<realmId>:<cycle>:<node>` và cùng move/search/combat APIs.
- Unlock `fate_combo` gọi đúng `computeRelationshipEffects`; không copy điều kiện.
- Competitor progress chỉ tiến trong tick khi realm open, deterministic và có cap; main reward không bị NPC lấy trước khi người chơi có ít nhất một phiên biết realm đang mở.
- Hết hạn khi player đang trong realm: cho action rời; không xóa node cho tới khi thoát, nhưng khóa reward mới.

### 13.4. Acceptance

- Cổng chỉ mở đúng condition/window.
- Save trong Bí Cảnh load lại được.
- Reward key chỉ claim một lần.
- Đóng cửa không kẹt player hoặc phá `locationId`.

## 14. SYS-10 — Thiên Kiếp Cá Nhân Hóa

### 14.1. Generation

Tại gate `Vượt Dị Tượng`, tạo tối đa ba challenge option từ:

- path và element;
- Mệnh tương sinh/tương khắc/active combo;
- technique family/mastery;
- SAN/Corruption;
- Neo Nhân Tính và relationship tier;
- faction/war/event vùng hiện tại.

```js
pendingTribulation = {
  targetRealmLevel, seed, generatedDay, options: [], chosenId,
  status: "pending"|"resolved", result
}
```

### 14.2. Constraint

- Không đổi số gate theo cấp và không tự commit Cảnh Giới.
- Luôn có một universal option trả resource/công đức nếu build không thỏa option đặc thù.
- Option đặc thù là cách giải khác, không cộng thêm một gate.
- Roll chỉ xảy ra một lần và persist trước render.

### 14.3. Acceptance

- Hai build khác nhau sinh option khác với cùng target realm.
- Reload không đổi option/result.
- `getBreakthroughBlockers` và checklist UI vẫn khớp.

## 15. SYS-11 — Di Sản Luân Hồi, Mộ Tiền Kiếp và Vật Di Truyền

### 15.1. Legacy snapshot

Trước reset, tạo snapshot gọn:

```js
reincarnationLegacy = {
  generation, previousLives: [{
    id, name, deathDay, deathLocationId, pathId, highestRealm,
    signatureFateId, signatureTechniqueId, summaryKeys: []
  }],
  pendingChoices: [], chosenLegacyId, tombs: [], marksRetained: false
}
```

Giữ tối đa ba previous lives; summary là key/text đã sanitize, không copy toàn history.

### 15.2. Ba di sản MVP

- **Ký Ức Công Pháp:** mở trial học lại nhanh hơn, không giữ mastery đầy đủ.
- **Duyên Mệnh:** tăng xác suất gặp lại một fate clue, không cấp thẳng Mệnh ngoài luật giữ một Mệnh hiện tại.
- **Nợ Nhân Gian:** giữ một relationship echo/quest, không giữ toàn bộ quan hệ.

### 15.3. Mộ tiền kiếp

Tomb xuất hiện ở node chết nếu node hợp lệ; nếu chết trong Bí Cảnh đóng, chuyển về safe parent node. Bái tế một lần/kiếp cho memory, clue hoặc cosmetic; không farm stat.

### 15.4. Heirloom integration

SYS-06 quyết định item giữ lại và wear. Luân Hồi/Chuyển Sinh gọi một resolver chung `buildReincarnationTransferPlan()` để UI preview và engine commit cùng kết quả.

### 15.5. Acceptance

- Reset canonical vẫn đúng; legacy chỉ thêm ngoại lệ đã preview.
- Không nhân đôi Mệnh/item qua transfer.
- Tomb có fallback location và chỉ nhận reward một lần.

## 16. SYS-12 — Tiến Hóa Mệnh Số

### 16.1. Mục tiêu

Biến Cường Hóa `+1…+5` từ tăng số tuyến tính thành hành trình có đích. Một Mệnh đã được đầu tư nhiều lần, sống cùng người chơi và vượt thí luyện sẽ tiến hóa thành dạng riêng của instance đó. Không sinh Fate ID mới và không nhân bản catalog 10.000 Mệnh.

### 16.2. Điều kiện mở

Một Mệnh đủ điều kiện khi đồng thời:

1. Thuộc sở hữu và đang kích hoạt.
2. `fateEnhancementLevel(...) === 5`.
3. Quan hệ ở bậc **Cộng Minh** (`stage === 3`, `resonanceUnlocked === true`).
4. Tương hợp Con Đường ≥8 cho nhánh Thuận Diễn; nhánh khác theo template.
5. Không có evolution và không nằm trong pending transaction.
6. Player không Tha Hóa/mất trí và SAN hiện tại ≥20.

Đạt điều kiện chỉ mở **Mệnh Kiếp Thí Luyện**, không tiến hóa tự động.

### 16.3. Tái sử dụng record hiện hữu

`fateRelationshipRecord` đã có `eliteTrials` và `alignedChoices`. Spec sử dụng chúng:

- Thắng encounter `elite` khi Mệnh đang active và outcome phù hợp: `eliteTrials +1`, tối đa 2 tính cho trial.
- Chọn quest/event option mang tag trùng `fatePathAffinity`, `element` hoặc `sign`: `alignedChoices +1`, tối đa 3.
- Điều kiện trial: `eliteTrials >= 2` **hoặc** `alignedChoices >= 3`.
- Khi hoàn tất nghi thức tiến hóa, relationship chuyển `stage = 4` — **Nhân Mệnh Hợp Nhất**.

Counter chỉ tăng khi trial active; event có `uniqueKey` để không farm lặp.

### 16.4. State schema

```js
player.fateEvolutions = {
  [fateId]: {
    status: "trial"|"ready"|"evolved",
    trialStartedDay,
    seed,
    candidateBranchIds: [],
    branchId: null,
    evolvedAtDay: null,
    sourceEnhancementLevel: 5,
    version: 1
  }
};
```

Evolution thuộc character/fate ID duy nhất vì `receiveFate` hiện chống trùng. `toCanonicalCharacter/fromCanonicalCharacter` phải persist `fate.evolutions`.

Hai hàm canonical cũng phải persist `fate.relationships` từ `player.fateRelationships`; nếu không, stage Cộng Minh và tiến độ `eliteTrials/alignedChoices` sẽ mất sau export/import. Không dùng `fateInstances.relationshipStage` làm nguồn sự thật thứ hai.

### 16.5. Template data-driven

```js
FateEvolutionTemplate {
  id, namePattern,
  eligibility: {signs:[], grades:[], elements:[], pathTags:[]},
  branchType: "thuan_dien"|"nghich_dien"|"quy_nguyen",
  effectOps: [], scoreDelta, persistentCosts: [],
  ritualCost: {fateEssence, merit, san},
  trialTags: [], descriptionPattern
}
```

Resolver chọn hai candidate branch bằng seed và đặc tính fate; luôn có ít nhất một branch an toàn. Không ghi branch trực tiếp vào từng Fate record trừ Mệnh đặc biệt cần authored evolution.

### 16.6. Ba nhánh chuẩn

#### Thuận Diễn — Hợp Đạo

- Yêu cầu compatibility ≥8.
- `scoreDelta = +2`.
- Tăng thêm 10% các numeric effect dương khi path hiện tại vẫn tương hợp.
- Nếu đổi path và compatibility <8, bonus evolution ngủ, không bị xóa.
- Không thêm Corruption.

#### Nghịch Diễn — Đoạt Mệnh

- Có thể xuất hiện cho Hung Mệnh, fate có forbidden tag hoặc player Corruption ≥30.
- `scoreDelta = +3` và tăng 18% primary positive effect.
- Persistent cost: `fateDebt +1`; mỗi lần Đột Phá thành công khi Mệnh active tăng Corruption +2.
- UI phải cảnh báo và xác nhận.

#### Quy Nguyên — Hóa Linh

- `scoreDelta = 0`.
- Tăng 5% effect dương và giảm 25% độ lớn một effect âm được template cho phép.
- Nếu Fate không có effect âm hợp lệ, thay bằng +5% SAN resistance/cultivation utility trong whitelist; không tự tạo key lạ.

Mỗi evolution chỉ chọn một nhánh và không respec trong MVP.

### 16.7. Ritual cost

Theo grade rank 1–8:

```text
Mệnh Tinh Hoa = 5 + 2 × gradeRank
Công Đức       = 10 + 5 × gradeRank
SAN tức thời   = 10
```

“Mệnh Tinh Hoa” trong UI dùng trực tiếp field hiện hữu `state.fateExcessEssence`, không tạo currency mới. Không yêu cầu thêm Mệnh cùng phẩm vì Cường Hóa +5 đã tiêu thụ năm chất liệu. Transaction validate đủ cost, trial và slot trước khi trừ.

### 16.8. Effect pipeline

```js
base fate effects
  -> enhancedFateEffects(+0..+5 và relationship multiplier)
  -> applyFateEvolutionOps(instance evolution)
  -> computeRelationshipEffects/combo aggregation
  -> computeStats
```

`computeFate()` cộng `scoreDelta` evolution đúng một lần cho Mệnh active. Không tính evolution của Mệnh nằm trong kho vào stats/score.

API:

```js
fateEvolutionEligibility(state, fateId)
startFateEvolutionTrial(state, fateId)
recordFateEvolutionProgress(state, gameplayEvent)
fateEvolutionCandidates(state, fateId)
fateEvolutionPreview(state, fateId, branchId)
evolveFate(state, fateId, branchId, options = {})
applyFateEvolutionOps(character, fate, effects)
```

### 16.9. Tương tác với hệ Mệnh hiện tại

- **Nâng cấp:** `upgradeFate` vẫn cap +5; sau lần +5 ghi thông báo nếu đủ/thiếu điều kiện tiến hóa.
- **Dưỡng Mệnh/Cộng Minh:** giữ flow stage 0→3; tiến hóa là đường duy nhất lên stage 4 trong MVP.
- **Mệnh Kho:** evolution được giữ khi tháo/lắp; effect ngủ khi không active.
- **Dung hợp/chất liệu:** Mệnh evolved không xuất hiện làm material mặc định. Muốn phá phải dùng action “Giải Thể Tiến Hóa”, xác nhận hai lần; MVP có thể chưa cung cấp action này.
- **Pact/combo:** combo membership vẫn dùng Fate ID gốc. Evolution chỉ sửa effect sau relationship multiplier, không thay recipe ID.
- **Luân Hồi:** nếu Mệnh evolved là Mệnh cao nhất được giữ theo luật hiện tại, evolution đi cùng. Nếu không được giữ, evolution mất; preview transfer phải nói rõ.
- **Tha Hóa:** Nghịch Diễn tham gia fateDebt/Corruption hiện hữu, không tạo corruption stat mới.

### 16.10. UI/UX

- Fate detail hiển thị `+5`, relationship stage và thanh trial.
- Nút “Mở Mệnh Kiếp” chỉ hiện khi +5; disabled reason liệt kê Cộng Minh/SAN/active.
- Candidate modal so sánh before/after effect, score, ritual cost và persistent drawback.
- Mệnh evolved có suffix danh xưng từ template và sigil nhỏ; tên Fate ID gốc không đổi.
- Story log ghi mở trial, từng progress milestone và evolution completion; không log mỗi action không tiến bộ.

### 16.11. Migration

- Save v12: `fateEvolutions = {}`.
- Mệnh đã +5 và stage 3 không tự tiến hóa; lần mở Fate detail hoặc updateDerived chỉ đánh dấu eligibility, không trừ cost.
- Không tự suy diễn stage 4 cho save cũ.
- Canonical save thêm `fate.evolutions`; unknown branch/template khi load chuyển status `ready` và yêu cầu chọn lại, không xóa investment.
- Canonical save thêm `fate.relationships`; adapter ưu tiên record này, chỉ fallback từ dữ liệu cũ nếu thật sự tồn tại.

### 16.12. Test bắt buộc

- +4 không eligible; +5 nhưng stage 2 không eligible; +5/stage 3/active eligible.
- Trial counter chỉ tăng từ unique eligible event và dừng đúng threshold.
- Preview bằng runtime cho cả ba branch.
- Cost rollback khi evolve fail.
- Evolved Fate trong vault không tăng stats/score.
- Path đổi làm Thuận Diễn dormant/active đúng.
- Nghịch Diễn tăng fateDebt một lần và Corruption đúng lúc Đột Phá.
- Dung hợp/upgrade không tiêu evolved Fate ngoài ý muốn.
- Luân Hồi giữ/mất evolution đúng theo Fate được giữ.
- Serialize/deserialize v13 và migrate v12 pass.

## 17. UI hợp nhất

Không thêm sidebar group thứ tư. Bố trí:

| Bề mặt hiện tại | Nội dung mới |
|---|---|
| Trạng thái | Mùa/weather, survival warning, profession chính, companion |
| Hành trang modal | item awakening, heirloom, recipe/material action |
| Mệnh số modal | trial/evolution preview và status Nhân Mệnh Hợp Nhất |
| Công pháp modal | technique trial/evolution và profession relation |
| Cảnh giới modal | personalized tribulation preview |
| Bản đồ modal | event/war/NPC/Bí Cảnh/weather icon và diplomacy edge |
| Tổ chức | project, Đại Hội, diplomacy/war summary |
| Nhiệm vụ | contract/event/trial group và expiry theo game day |
| Nhân duyên | NPC memories, mail, favor, bounty target status |
| Ký ức | previous lives/tomb/world chronicle link |
| Phường thị | intel market và auction tab con |
| Khâm Thiên Giám | divination hint và Fate evolution lore; không bán evolution |
| Hư Thiên Đỉnh | awakening/seal/repair recipe khi đủ điều kiện |
| Đặc Biệt | thêm Dị Chí như một tab; không thêm màn hình độc lập |

Action priority:

- Quick: combat survival, event deadline trong ngày, capture khi target đủ HP.
- Overflow: nghe lén, gửi thư, đặt dấu, xem quẻ, mở trial, guild project.
- Modal-only: chọn evolution, auction bid, recipe batch, codex browsing.

## 18. Save migration và compatibility

### 18.1. Version 13 adapter

```js
function migrateV12ToV13(state) {
  ensureWorldSimulation(state);
  state.relationshipEvents ||= {};
  state.professionState ||= { primaryId: null, professions: {} };
  state.contractBoard ||= { offers: {}, accepted: {} };
  state.prisoners ||= {};
  state.intel ||= {};
  state.companion ||= null;
  state.discoveries ||= emptyDiscoveries();
  state.player.fateEvolutions ||= {};
  state.reincarnationLegacy ||= emptyLegacy();
  state.meta.featureVersions ||= {};
}
```

Chỉ tạo state rỗng; không phát reward, sinh event hoặc đổi relationship trong migration.

### 18.2. Unknown data

- Unknown event/template: mark `cancelled`, cleanup modifier, ghi một migration note.
- Unknown item awakening: giữ raw state nhưng effect dormant.
- Unknown Fate evolution branch: chuyển `ready`, giữ trial/cost chưa trừ.
- Unknown location khi load: dùng `safeTravelDestination`, nhưng giữ tomb/hidden realm record để audit.

## 19. Test strategy toàn hệ

### 19.1. Unit/invariant

- Deterministic RNG/day ordinal/modifier cap.
- State normalize và transaction rollback.
- Threshold/cooldown/expiry/idempotency từng subsystem.

### 19.2. Simulation

- 1.000 save × 1.000 game day: số event, war, NPC task và scheduled task có bound.
- Không faction nào snowball chiếm toàn map trong median run nếu player không can thiệp.
- Reward/time của profession, contract, event và auction không vượt baseline economy đã chốt.
- Fate/technique/item evolution không tạo dominant branch >60% lựa chọn trong playtest mục tiêu.

### 19.3. Integration

- Event + weather + formation cùng tác động một combat.
- War tạo contract; capture tạo intel; intel mở Hidden Realm.
- NPC memory thay dialogue và Neo eligibility.
- Luân Hồi giữa world event, auction, mail, prisoner, companion và Bí Cảnh.
- Fate evolution tương tác vault, path switch, breakthrough và reincarnation.

### 19.4. UI/DOM

- Disabled reason đầy đủ.
- Map icon/edge có text alternative và không chỉ dựa vào màu.
- Modal preview không mutate state.
- Rapid click vẫn đi qua FIFO queue.
- History trimming không giấu entry mới.

### 19.5. Regression gate

Mỗi phase phải chạy `node tools/verify_game.js`. Không sửa test cũ chỉ để hợp thức hóa behavior mới nếu behavior đó vi phạm canonical invariant.

## 20. Thứ tự triển khai bắt buộc

### Phase 0 — Foundation

SYS-00, version 13 adapter, deterministic RNG, ordinal và modifier pipeline. Không làm content lớn.

### Phase 1 — Giá trị sớm

1. SYS-04 Tiến Hóa Công Pháp MVP.
2. SYS-12 Tiến Hóa Mệnh Số MVP.
3. SYS-08 Dị Chí + Survival Log MVP.

### Phase 2 — Thế giới phản ứng

1. SYS-01 season/weather + hai Dị Triều.
2. SYS-02 diplomacy/project MVP, chưa mở full war.
3. SYS-03 relationship memory + ba notable NPC.

### Phase 3 — Lựa chọn encounter

1. SYS-05 contract/capture/interrogation.
2. SYS-07 một companion/two beasts.
3. SYS-06 item awakening/heirloom.

### Phase 4 — Simulation sâu

1. SYS-02 war/internal faction/Đại Hội.
2. SYS-03 schedules/NPC-NPC/mail/bounty.
3. SYS-05 cover/intel/counter-intel.
4. SYS-06 auction.

### Phase 5 — Endgame và replay

1. SYS-09 contested opportunity/Hidden Realm.
2. SYS-10 personalized tribulation.
3. SYS-11 legacy/tomb.
4. Mở rộng profession, event, evolution template và content.

Không bắt đầu phase sau nếu save round-trip, deterministic test và regression gate của phase trước chưa pass.

## 21. Definition of Done

Một subsystem hoàn thành khi:

- Có data schema và validator.
- Có state default/migration/serialization.
- Rule nằm trong engine và preview dùng cùng resolver.
- Có entry point trên UI/action hiện hữu.
- Có ít nhất một vertical slice chơi được từ trigger tới persistent consequence.
- Có unit, integration, UI và save round-trip test.
- Không cần backend và không tạo hệ gameplay song song.
- `node tools/verify_game.js` cùng test mới đều pass.

Toàn bộ chương trình mở rộng hoàn thành khi mọi feature trong bảng truy vết Mục 2 đã có ít nhất một lát cắt dọc, các hệ liên kết qua world event/quest/NPC/memory thay vì tồn tại cô lập, và Tiến Hóa Mệnh Số hoạt động an toàn từ Cường Hóa +5 tới Nhân Mệnh Hợp Nhất qua save/load và Luân Hồi.
