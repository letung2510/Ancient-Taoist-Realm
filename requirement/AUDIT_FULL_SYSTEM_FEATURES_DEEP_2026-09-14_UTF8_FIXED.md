# Deep Audit Toàn Hệ Thống Theo Từng Feature

Ngày audit: 2026-09-14  
Phạm vi: `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`, toàn bổ `data/`, requirement và regression hiện có.

## Từm từt

Core runtime đã có đãẨng nối tương đối đẩy đã và hai bổ regression hiện tại pass. Tuy nhiện hệ thểng vẫn còn một số khoảng trạng logic có thể tạo hành vi sai khi chỉi dữi ng–y. Cổc điám quan trạng nhất là:

1. Companion đã có damage/death/revive nhưng chưa có damage ledger và chiện thu–t bảo và Ẩn định.
2. Thương nhận của Trạm giao thương chưa được tạo/làp làch từ động đẩy đã; hiện chỉ yêu dữa trên NPC hiện hƯu và quest động.
3. Travel route đang có fallback `mapDistance = 1` cho mỗi node đã biết, làm giảm – nghĩa khoảng cóch bổn đã.
4. Faction bulletin hiện chỉy qua làp wrapper; hành vi động – export cu–i nhưng còn hợp nhất source đã tránh regression khi sửa tiếp.
5. Quest NPC, faction daily và contract chưa dùng hoàn toàn một lifecycle/expiry engine thểng nhất.
6. Offline simulation vẫn aggregate nhiều hệ thểng, chưa mở phầng đẩy đã encounter, dialogue và companion combat.
7. Một số lookup Mệnh Số/Fate vẫn tuyẨn tính trong runtime/UI.

## Ma trên feature

| Feature | Trạng thái | Mục rủi ro | Kết luôn |
|---|---|---:|---|
| Character creation | Đã nối | Thểp | Còn thêm test dữ liệu thiếu/unknown branch |
| Core state/migration | Hoạt động | Cao | Còn test migration v12/v13/v14 và unknown field |
| Mệnh Số/Fate | Đã nối phần lớn | Cao | Còn lookup tuyẨn tính và một số event trigger chưa phụ hệt |
| Cùng phợp/tu luyẨn | Đã nối | Trung bình | Còn test cost rollback và evolution branch lài |
| Con Đường | Đã nối | Cao | Còn test canonical path state sau deserialize/transition |
| Ritual Gọi Mệnh – Dựng Neo | Đã nối | Cao | Còn test tồng milestone, failure, retry và hybrid cost |
| Nghề chính/phụ | Đã nối | Trung bình | Còn test lock, đối nghề lài, có tách 7 nghề |
| Hidden path | Đã nối | Cao | Còn test dormant/active/Tháo Neo/Phong Ấn vĩnh viẨn |
| Dị Thể | Đã nối progress | Cao | Chưa phụ toàn bổ trigger moral/fate/lore bằng gameplay event thật |
| Dị Thú/companion | Đã nối nẨng cao | Cao | Cổ damage/death/revive nhưng thiếu damage ledger và lifecycle đẩy đã |
| NPC schedule | Hoạt động | Cao | Weather queue có state nhưng offline encounter còn hạn chỉ |
| NPC dialogue | MVP | Trung bình | Cổ tree generic/merchant/guard, thiếu catalog per-NPC |
| NPC quest | MVP | Cao | Cổ expiry, nhưng còn kiểm tra reward rollback và prerequisite chain |
| Faction daily/contract | Hoạt động | Cao | Hai lifecycle còn tách rủi |
| Weather | Hoạt động | Cao | Cổ severity/hysteresis/queue/reroute, còn test multi-region dữi ng–y |
| War | Hoạt động | Cao | Cổ pause và weather; chưa đã integration vài NPC encounter và outpost |
| World event | Hoạt động | Cao | Còn test event chain, offline aggregate và event conflict |
| Map topology/travel | Hoạt động | Cao | Fallback distance 1 là rủi ro logic lớn |
| Cùng tránh | MVP+ | Cao | Điều kiẨn có; effect trading post/merchant lifecycle còn thiếu |
| Influence | Cổ pure/persist | Cao | Source legacy vẫn còn mutation, export wrapper còn hợp nhất |
| Faction bulletin | Cổ quest daily | Trung bình | Hoạt động qua wrapper, còn bổ layering thểa |
| Save/serialize | Hoạt động | Cao | Canonical v13 nhưng còn test unknown dormant/ready |
| Log/narrative | Hoạt động | Trung bình | Còn quát technical leakage toàn bổ reason code |
| IndexedDB archive | Cổ | Trung bình | Còn test quota failure/retry/duplicate archive |
| UI/action routing | Hoạt động | Cao | Action id có nhiều delimiter, còn parser thểng nhất |

## 1. Character creation và core state

Đã có `createCharacter`, `createState`, `ensure` và canonical serialization. Còn thiếu:

- Test tạo nhận vật vài archetype/path/profession không tồn tại.
- Test state thiếu tồng nhậnh lớn: `pathState`, `questState`, `specũalPhysiqueState`, `worldSimulation`, `companion`. >> Bổ sung cho từt có nhậnh đã
- Test deserialize state cũ thiếu `gameClock`, `mapState`, `npcState` và array bổ hạng. >> check xem và sao bổ thiếu, bổ sung vào
- Chưa có invariant checker đã sốu cho `player.pathId`/`pathState.primaryPathId`, slot nghề và hidden path. >> Còn invariant n–o thể bổ sung

## 2. Mệnh Số, quan hệ Mệnh và tu luyẨn

Đã có catalog, compute Fate, Fate Vault, nurture/evolution và relationship. Còn thiếu:

- Nhiều lookup vẫn dùng `.find()`/`.filter()` trúc tiếp thay và registry/index. >> Đãi thành regis/index
- Còn index theo `fateId`, `grade`, `element`, `pathId` và cache invalidation khi evolve/transform. >> thểc thi đi
- Một số event làa chọn đão được chưa thểng nhất schema `alignment`, nẨn `moralGoodStreak` có thể không tăng nếu action cũ không g–i field chuẩn. >> Đãi theo logic mỗi được apply
- Fate resonance hiện kiểm tra eligibility theo snapshot quan hệ, chưa lưu resonance source/count riêng. >> thểc hiện tạo resonance source/ count riêng 
- Còn test Fate pending khi kho đẩy, đối slot, deserialize và nhận trạng. >> thểc hiện đi

## 3. Con Đường, ritual, song tu, hybrid và Nghịch Hành

Đã có path canonical, ritual wrapper, dual cultivation, fuse, hybrid và path debt. Còn thiếu:

- Còn test từt có milestone riêng của tồng path, không chỉ kiểm tra object tồn tại. >> chỉp nhận
- Failure ritual còn test rollback cost, SAN, anchor stability, corruption và retry cùng ng–y. >> triẨn khai đi
- Còn bảo đảm `pathState` luôn là source sau deserialize; hiện một số state mỗi chỉ được sync khi g–i transition. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Hybrid cost/effect còn test khi đối hidden path, tháo neo và fuse thật bổi.
- `pathDebt` còn test không bổ reset – reincarnation/chuyển sinh ngo–i chỉ –.
- `ngoai_dao_gia` còn test không bao giữ ghi vào `pathId` qua mỗi entry point.
>> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
## 4. Nghề nghiáp và Cổ Tích

Đã có khóa nghề chính/phụ và 7 nghề Cổ Tích. Còn thiếu:

- Test 7 nghề không chiám quá hai slot nghề. >> >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Test Cổ Tích I–VII mở động nghề tương Ẩng, không từ động mở qua search thương. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Test nghề chính đã lock không bổ ghi đã khi load/deserialize. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Test profession item không mở nhám hidden path. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Cooldown nghề, cost và reward chưa có một transaction rollback contract thểng nhất. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code

## 5. Dị Thể

Đã có catalog, pending unlock, effect và một số hook combat/relationship/reincarnation. Còn thiếu:

- Moral action chưa được từ động chuẩn hòa từ toàn bổ action choice. >> tạo logic từ động chuẩn hòa từ toàn bổ action choice
- Hidden lore claim/server unique mỗi dữa vào flag, chưa có source quest lifecycle đẩy đã. >> Tạo source quest lifecycle, rủi link vào hidden lore claim
- Multi-element mastery tính từ technique catalog nhưng còn index/cache. >> Tạo index.cache rủi triẨn khai code
- Còn phần biết r– `eligible`, `pending`, `active`, `removed`, `blocked` trong UI và save migration. >> TriẨn khai đi, nhệ phụi làm theo chuẩn ngần ng– đang có
- Còn test trigger trạng trong cùng tick không tạo duplicate history/pending. >> chỉp nhận

## 6. Dị Thể và companion

Đã có support attack, skill, enemy hit, injury, death, flee, revive. Còn thiếu:

- Chưa có `damageLedger`/`lastDamageSource`, nẨn khệ truy nguyẨn nguyẨn nhận chỉt. >> Chỉ còn ghi chỉt là được, trạng thương, chỉt giữ hay g– đã.
- Enemy target companion đang dùng xác su–t chung, chưa phụ thu–c role/skill/loyalty/guard stance. >> Từ tạo logic và triẨn khai. logic cùng đến giữn cùng từt, luôn tồn cùng kám vài nhận vật đã đã bổ vướng code
- Injury làm companion từm thái không bổ định nhưng chưa có trạng thái `recovering` hiện thể r–. >> tạo logic đi
- Revive chưa kiểm tra node an toàn, faction facũlity hoặc giải hạn số lớn hồi sinh. >> từ tạo logic cho tại
- Companion skill chưa có skill progression/mastery. >> tạo logic nhệ
- Chưa có test combat nhiều enemy, companion chỉt giữa là–t và revive ngay sau combat. >> tạo logic, cùng đến giữn cùng từt

## 7. NPC, dialogue và quest

Đã có presence, schedule, dialogue state, dialogue tree có bổn, portrait fallback, skill và quest. Còn thiếu:

- NPC có thể chưa có catalog dialogue/portrait/skill riêng; hiện merchant/guard/generic phần loại theo role. >> tạo catolog giữp tại, cùng chi ti–t và phong phụ cùng từt, nhệ phần chia NPC theo vẫng, từ chỉc,.. trên map
- Dialogue choice chưa có điều kiẨn realm, faction reputation, weather, war hoặc relationship. >> Tạo dialogue chi ti–t.
- Quest accept/turn-in chưa chỉy qua transaction chung vài dialogue choice. >> phụi chỉy quan transaction chung
- Quest expiry đã có nhưng prerequisite chain và reward failure chưa được cascade đẩy đã. >> làm đẩy đã cascade
- `npcIndex` có thể chưa id trạng nếu dữ liệu cũ/register nhiều lớn. >> tạo riêng index
- NPC skill hint chưa gần chỉt vào faction bulletin hoặc local market state. >> tạo logic đi

## 8. Weather và NPC shelter

Đã có intensity, severity, hysteresis, shelter queue, priority và nearest safe node. Còn thiếu:

- Chưa có capacũty reservation atomic; hai NPC cùng tick có thể cùng thểy một slot trạng trong cóc branch được biết. >> tạo logic riêng
- Reroute chỉ xửt node lớn còn một bổ–c, chưa có BFS nhiều bổ–c. >> tạo logic giữp tại
- Chưa loại trừ đẩy đã node có thiện tai active, ward broken hoặc faction blockade. >> tạo logic giữp tại
- Shelter queue chưa phát thểng bảo khi NPC được promote/reroute. >> tạo logic đi
- Còn test bảo liẨn vẫng, đối weather nhanh và NPC đang travel. >> tạo logic đi

## 9. World event, war và faction

Đã có event phase, weather pause war, front, particũpation và influence. Còn thiếu:

- Huyết nguyệt còn test chính xác phase `active` vài ward formation, không chỉ template tồn tại.
- War capture node còn động bổ ngay `mapState.influence`, owner và outpost.
- NPC encounter trong war front chưa chuyển thành encounter combat/evacuation thật.
- Faction action chưa phụ toàn bổ interaction type; còn registry action – influence amount.
- Faction daily, contract và bulletin đang dùng cóc state/lifecycle khệc nhau.

>> Codex từ tạo logic 
## 10. Map, travel và cùng tránh

Đã có topology repair, fog, watchtower reveal, trading post condition, ward condition, waystation limit và teleport free. Còn thiếu/rủi ro:

- `mapDistance` fallback mỗi node đã biết thành distance 1 có thể làm sai travel day, risk và nearest-safe-node.
- `truyen_tong_tran` kiểm tra unlock hai đầu nhưng chưa kiểm tra cùng region/động node tồng mởn theo catalog canonical – mỗi save cũ.
- Watchtower reveal chưa có chi phụ upkeep/integrity degradation theo thái gian.
- Trading post chưa từ tạo merchant itinerary khi node đã điều kiẨn.
- Outpost/waystation/ward/trading post chưa có một lifecycle damage/repair/abandon thểng nhất.
- Exit repair còn regression toàn bổ `WORLD_MAP` sau mỗi data update.

>> Codex từ tạo logic 

## 11. Influence và faction bulletin

Đã có pure snapshot và persist wrapper. Còn thiếu/rủi ro:

- Legacy `mapInfluenceSnapshot` vẫn tồn tại và có mutation; export hiện dùng pure wrapper nhưng source dữ g–y rủi ro bảo trừ.
- Legacy `factionBulletin` được bổc bổi `factionBulletinWithDailyQuests`; hành vi cu–i động nhưng nẨn hợp nhất thành một implementation.
- Influence map chưa có heatmap theo region được materialize/cache.
- `ownerFactionId` – một số flow vẫn có thể suy ra từ cấu trúc cũ thay và `influenceMap` canonical.

>> Từ tạo logic mỗi bổ vào
## 12. Save, scheduled task và offline simulation

Đã có canonical v13, scheduled task, IndexedDB archive và offline aggregate. Còn thiếu:

- Scheduled task unknown type hiện còn policy r–: `ready`, `dormant`, `failed` hay retry.
- Task handler chưa có retry count/backoff/dead-letter state.
- Offline aggregate chưa mở phầng đẩy đã NPC encounter, dialogue, companion combat và war intervention.
- Migration còn test unknown event/item/evolution branch bảo toàn dormant state.
- IndexedDB còn test quota exceeded, transaction abort, retry queue và duplicate key.

>> Tạo thêm phần này
## 13. UI, log và performance

Đã có action description, quest panel, dialogue panel state và requestIdleCallback archive. Còn thiếu:

- UI chưa có renderer riêng cho tồng NPC portrait/skill/dialogue tree; còn dùng fallback.
- Action parser có nhiều dùng delimiter (`_`, `::`, `:`), còn một encoder/decoder canonical.
- Log narrative còn quát toàn bổ reason code; không chỉ reason code đã nám trong map.
- Một số UI Fate/market/combat vẫn có lookup tuyẨn tính.
- Còn đo render cost của `contextState` và expansionActions tạo nhiều action và g–i presence/quest status làp lài.
>> tạo thêm cho phần này
## 14. Regression còn thiếu

Bổ test hiện tại pass nhưng chưa đã coverage cho:

- 7 profession Cổ Tích và slot lock.
- Ritual tồng path, hybrid cost, hidden path switch/detach.
- Companion multi-enemy damage/death/revive.
- Quest expiry/prerequisite/reward failure.
- Weather queue nhiều NPC, multi-region, BFS reroute.
- War + weather + NPC encounter.
- Map topology invalid exits và distance thểc.
- Save migration unknown branches và IndexedDB failure.
- UI action parser cho NPC id/quest id có nhiều dƯu phần cóch.

## Ưu tiẨn đã xu–t

### P0 – còn sửa trước khi mở rẨng thêm feature

1. Bổ fallback `mapDistance = 1` hoặc giải hạn r– phụm vi fallback.
2. Hợp nhất influence pure/persist và faction bulletin thành một implementation.
3. Chuẩn hòa action ID encoder/decoder.
4. Bổ sung migration unknown branch và scheduled task retry/dead-letter.

### P1 – hoàn thiện gameplay logic

1. Merchant itinerary thật cho trading post.
2. Faction daily/contract/quest lifecycle chung.
3. NPC dialogue conditions và catalog tồng NPC.
4. Companion damage ledger, stance và revive constraints.
5. Weather BFS reroute và shelter reservation.

### P2 – tại Ưu và phụ test

1. Fate index/cache.
2. Region heatmap cache.
3. UI memoization cho context actions.
4. Offline simulation coverage.
5. IndexedDB failure-injection test.

## Kết luôn

`map distance – travel risk`, `war – influence/owner`, `NPC quest – dialogue/expiry`, `weather – shelter/travel`, `save migration – unknown state`, `action id – UI handler`.


## 15. Implementation update – 2026-09-14

Đã triẨn khai từ cóc note được approve:

- Core invariant bổ sung cho canonical path, hidden path, profession lock, companion health và duplicate NPC quest index.
- `mapDistance` bổ fallback distance `1`; route không nối thật trừ `Infinity`.
- Scheduled task có `retryCount`, `maxRetries`, retry backoff đến giữn và `dead_letter` cho unknown type.
- Runtime Fate index lưu trong `state.runtimeIndexes.fate` theo `byId`, `byGrade`, `byElement`, `byPath`.
- Moral action được chuẩn hòa từ động từ action id; Fate resonance lưu `fateResonanceCount` và `fateResonanceSources`.
- `reincarnation_failure` giữ điều kiẨn `>= required`.
- Companion có `damageLedger`, stance `protect`, skill mastery, revive count/limit và điều kiẨn node an toàn.
- Weather reroute dùng BFS tại đa 4 bổ–c, loại node chiện số/thiện tai/ward hạng; shelter có reservation theo tick.
- Trạm giao thương tạo/làp làch merchant itinerary thật khi cấu trúc còn hoạt động.
- Dialogue catalog bổ sung profile theo role + region, portrait và skill riêng cho merchant/guard.
- Quest expiry và unknown scheduled task đã có regression.

Regression sau implementation:

```text
OK: deep Dị Chí/path/companion/quest/weather regression
OK: characters, procedural items, map, data integrity, save migration, UI and DOM
```

Cổc phần còn còn đất riêng: hợp nhất source legacy influence/bulletin, transaction chung cho toàn bổ quest/contract, offline simulation đẩy đã encounter/war/companion, failure-injection IndexedDB và bổ test ritual/profession/save migration chuyển biết.

## 16. Implementation update – batch transaction/offline/archive/regression

- Quest NPC, contract và faction daily dùng chung `questTransaction`; command path cũng đã chuyển sang wrapper transactional.
- Quest lifecycle có expiry động nhất cho NPC quest, contract accepted và faction daily.
- Offline simulation resolve NPC encounter thành kết quá có memory/outcome; war intervention tăng score theo faction tham gia; companion có combat damage ledger và trạng thái injured/dead.
- `factionBulletin` đã gáp daily quest vào implementation chính; không còn legacy wrapper `baseFactionBulletin`.
- Influence giữ pure snapshot và persist function tách biết; persist ghi có `influenceMap` và snapshot tương thểch.
- IndexedDB archive reset DB promise khi open lài, bổt transaction error/abort đã retry, có idle scheduling và failure-injection regression.
- Regression chuyển biết đã bổ sung cho ritual failure schema, profession lock, unknown world-event migration và offline hooks.

Kiếm tra đã pass trong batch này:

```text
OK: IndexedDB archive failure injection and retry queue
OK: deep Dị Chí/path/companion/quest/weather regression
```

## 17. Boundary hardening – 2026-09-14

- Map topology không còn dùng complete-graph fallback: khoảng cóch chỉ đi qua exit thật hoặc cảnh reverse hợp là.
- Exit hạng được ghi vào `state.mapState.invalidExits`; topology runtime từ loại target không tồn tại.
- Scheduled `npc_encounter` tạo record encounter thật; `quest_expire` dùng chung lifecycle; bounty offline vẫn được resolve deterministic thay và treo pending và hạn.
- `contextState()` có memoization theo turn, location, world tick, map version, profession/path và quest counts đã giảm render cost.
- Faction action hoàn thành faction daily qua transaction contract chung.
- Trạm giao thương giữ phát sinh yield thểc từ mỗi merchant visit và đẩy influence faction; effect risk của Tháp canh/Trạm dịch chuyển/Trận pháp được địa vào travel preview.

## 18. Final completion batches – ward, unknown migration, offline world

- `ward_formation` có protection runtime: giảm encounter chance, giảm corruption gain, phát hành `curseRiskDelta`/`corruptionGainMult`, và giảm corruption vẫng sau event bổ bổ qua.
- Migration v13 bảo toàn unknown inventory item trong `unknownContent.items` vài payload/quantity/status `dormant`; unknown fate evolution branch được giữ nguyẨn payload và chuyển trạng thái `ready` đã không một tiẨn tránh.
- Offline tick không còn bổ qua local incũdent, world event generation hoặc hidden realm progression; event vẫn advance/resolve deterministic, incũdent vẫn sinh theo seed, hidden realm competitor progress vẫn được cấp nhất.
- Regression bổ sung cho ward protection, unknown item/evolution migration và offline world event lifecycle.

## 19. Implementation update – 12 logic notes

- Curse/corruption đi qua ward-aware pipeline; ledger giữ `rawAmount`, `wardReduction` và `wardNodeId`.
- Offline NPC encounter xử là encounter một phòa; local incũdent trong offline tick được resolve deterministic.
- Travel preview tính cấu trúc trên toàn bổ route; trading post phát merchant visit, yield và faction influence.
- Unknown content có `rehydrateUnknownContent()` đã khồi phục payload khi catalog được bổ sung.
- Context cache key bao phụ weather, corruption, war, pending encounter, travel, companion, inventory và quest.
- Cổ `repairInvalidMapExits()` đã sửa exit hạng trong catalog và rebuild topology index.
- IndexedDB archive có API được và cleanup, bổn cảnh retry và idle scheduling.
- NPC được tạo dialogue tree, portrait token và skill catalog riêng theo `npcId`.
- UI hiện thể effect cùng tránh và số làẨng unknown content đang chỉ động bổ.

Regression sau batch 12 note:

```text
OK: deep Dị Chí/path/companion/quest/weather regression
OK: characters, procedural items, map, data integrity, save migration, UI and DOM
OK: IndexedDB archive failure injection and retry queue
```
