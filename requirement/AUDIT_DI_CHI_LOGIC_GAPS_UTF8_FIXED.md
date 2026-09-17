# AUDIT Dữ CHệ – LOGIC GAPS & IMPLEMENTATION NOTES

> Mục đượch: ghi nhận các logic còn thiếu, chưa nối hoặc chưa khợp giữa tại liệu và runtime.
> File này dẢnh cho review và bổ sung note trước khi triển khai code.
>
> Ngày audit: 2026-09-14  
> Phạm vi: Dị Thể, Dị Thể, NPC, Cổ Tích/Từ Tích, Con Đường Ẩn, weather, save và test.

## 1. Quy ––c trạng thái

| Trạng thái | – nghĩa |
|---|---|
| `MISSING` | Chưa có trong runtime |
| `PARTIAL` | Cổ một phần nhưng chưa đã flow/effect |
| `MISMATCH` | Runtime và tại liệu dùng logic/schema khệc nhau |
| `RISK` | Cổ nguy có lài logic hoặc state không nhất quán |
| `READY` | Đã có và còn test xác nhận |
| `ACCEPTED` | Đã được chỉt hệẨng xử là |

## 2. Dị Thể – Specũal Physique

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| PHY-001 | Catalog Dị Thể | Chưa có catalog runtime cho 6 Dị Thể | `MISSING` | P0 | |
| PHY-002 | State nhận vật | Chưa có `specũalPhysique`/`physiqueState` canonical | `MISSING` | P0 | |
| PHY-003 | Giới hạn số hƯu | Chưa enforce tại đa 1 Dị Thể/nhận vật | `MISSING` | P0 | |
| PHY-004 | Thánh Thể | Chưa có trigger 10 quest thiện liẨn tiếp | `MISSING` | P0 | |
| PHY-005 | Hỗn Độn Thể | Chưa kiểm tra 5 cùng phợp khệc Ngi Hình cùng đất TiƯu Thành | `MISSING` | P0 | |
| PHY-006 | Vạn Độc Thể | Chưa có counter 5 trên Quái Dị Biến và điều kiện không dùng hồi phục ngo–i | `MISSING` | P0 | |
| PHY-007 | Cửu U Thể | Chưa nối trigger cùng minh `vo_he`/`di_he` | `MISSING` | P0 | |
| PHY-008 | Bất Tử Thể | Chưa nối động 1 lớn Luôn Hồi Thật Bổi | `MISSING` | P0 | |
| PHY-009 | Thiên Sinh Đạo Thể | Chưa có hidden lore quest server-wide và unique claim | `MISSING` | P0 | |
| PHY-010 | Effect runtime | Chưa áp dùng resistance, SAN, corruption, match score, cấu mởng | `MISSING` | P0 | |
| PHY-011 | Cost/phần phụ | Chưa lưu source, createdDay, permanent và số lớn đã dùng | `MISSING` | P1 | |
| PHY-012 | UI preview | Chưa có cảnh bảo/preview trước khi Dị Thể được kích hoạt | `MISSING` | P2 | |
| PHY-013 | Save/migration | Chưa có migration/state validation cho Dị Thể | `MISSING` | P1 | |

>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 3. Cổ Tích, Từ Tích và Nghề Ẩn

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| PROF-001 | 7 nghề Cổ Tích | Runtime có 7 nghề cũ theo số làẨng Cổ Tích | `PARTIAL` | P1 | |
| PROF-002 | 4 nghề Từ Tích | Tại liệu có Cuồng Ngôn Giả, Thực Cảnh Sư, Huyễn Ảnh Sư, Vong Ngã Sư nhưng runtime chưa có catalog | `MISMATCH` | P0 | Chỉt giữ 7 nghề, 4 nghề, hay hợp nhất catalog? |
| PROF-003 | `linkedTaThanId` | 7 nghề Cổ Tích chưa gần r– vài Từ Thần | `MISSING` | P0 | |
| PROF-004 | Đãc Từ Tích | Chưa có item được Từ Tích/Cổ Thần tàn hồn vài cost SAN/corruption | `MISSING` | P0 | |
| PROF-005 | Từ Tích thật bổi | Chưa có trạng thái thật bổi, khóa vĩnh viẨn hoặc false clue | `MISSING` | P1 | |
| PROF-006 | Effect Cuồng Ngôn Giả | Chưa tác động SAN NPC/đượch qua hồi tho–i | `MISSING` | P0 | |
| PROF-007 | Effect Thực Cảnh Sư | Chưa hệt corruption của node và chuyển vào player | `MISSING` | P0 | |
| PROF-008 | Effect Huyễn Ảnh Sư | Chưa tạo illusion clone trong combat/NPC | `MISSING` | P0 | |
| PROF-009 | Effect Vong Ngã Sư | Chưa giao tiếp vài người chỉt/vật quá khệ và risk quán memory | `MISSING` | P0 | |
| PROF-010 | Slot nghề | Cổ `primaryId`, `secondaryId`, `hiddenIds` động thái; còn xác nhận source of truth | `RISK` | P1 | |
| PROF-011 | Dormant profession | Còn bảo đảm nghề dormant không nhận passive/action/mastery | `READY` | P1 | Test thêm |
| PROF-012 | Giới hạn nghề | Chưa có validation r– tại đa 1 nghề chính + 1 nghề Ẩn active | `PARTIAL` | P0 | |
| PROF-013 | Bách Khoa Chí Dị | Chưa có registry lore cho nghề đã biết/chưa unlock/bổ phong Ẩn | `MISSING` | P2 | |

>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 4. Con Đường Ẩn và Cổ Thần tàn hồn

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| PATH-001 | Catalog chung | Đã có `hiddenPath.catalog` | `READY` | P1 | Test toàn bổ consumer |
| PATH-002 | Trigger Ma Kiếm Đạo | Chưa enforce Corruption >= 70 liẨn tác 30 ng–y khi đang Kiếm Đạo | `MISMATCH` | P1 | |
| PATH-003 | Trigger Vô Danh Đạo | Chưa enforce background `vo_danh` và giải hạn faction cấp 8 | `MISMATCH` | P1 | |
| PATH-004 | Trigger Tà Thần Khí Đạo | Chưa enforce cùng một Từ Thần được Lớng Nghe đã 5 lớn | `MISMATCH` | P1 | |
| PATH-005 | Encounter Cổ Thần | Đã có location/world/behavior gate chung | `PARTIAL` | P1 | Bổ sung trigger riêng tồng path |
| PATH-006 | Active/dormant | Đã giải hạn một hidden path active | `READY` | P1 | Test chuyển path |
| PATH-007 | Tháo Neo | Cổ cost SAN/corruption nhưng chưa có đẩy đã risk/lifecycle | `PARTIAL` | P1 | |
| PATH-008 | Schema canonical | Tại liệu dùng `pathState.*`, runtime dùng nhiều `player.*` | `MISMATCH` | P0 | Chọn một source of truth |
| PATH-009 | State validation | Chưa validate đẩy đã hidden path + Dị Thể + nghề Ẩn | `PARTIAL` | P0 | |
| PATH-010 | Phong Ấn encounter | Đã có seal, còn test không trigger lài vĩnh viẨn | `READY` | P1 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 5. Dị Thú và Companion

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| BEAST-001 | Spawn ecology | Chưa có hệ sinh thái spawn Dị Thể theo node/region/weather | `MISSING` | P1 | |
| BEAST-002 | Capture gating | Cổ capture từ entity/prisoner nhưng chưa đã rarity, danger, combat condition | `PARTIAL` | P1 | |
| BEAST-003 | Tame lifecycle | Cổ bổt – từ binh – thuẨn hòa | `READY` | P1 | Test edge cases |
| BEAST-004 | Combat integration | Companion chưa tham gia combat thật | `MISSING` | P0 | |
| BEAST-005 | Skill/passive | Effect hiện chỉ yêu scout/reveal/risk | `PARTIAL` | P1 | |
| BEAST-006 | Loyalty | Cổ loyalty nhưng chưa Ảnh hệẨng đẩy đã hành vi/combat/flee | `PARTIAL` | P1 | |
| BEAST-007 | Injury/death | Chưa có bổ thương, chỉt, một, hồi phục theo thái gian | `MISSING` | P1 | |
| BEAST-008 | Mutation | Cổ cure/accept/release mutation | `READY` | P1 | Kiếm tra combat effect |
| BEAST-009 | Vạn Độc Thể link | Chưa ghi nhận động combat Quái Dị Biến và hồi phục bổn ngo–i | `MISSING` | P0 | |
| BEAST-010 | Collection | Cổ collection beasts nhưng chưa phần biết Dị Thể thương/hiám/có thển | `PARTIAL` | P2 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 6. NPC, Quest và Dialogue

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| NPC-001 | NPC schema | Cổ entity có bổn, nhưng nhiều NPC có `dialogue_id: null`, `quest_ids: []` | `PARTIAL` | P0 | |
| NPC-002 | Dialogue state machine | Chưa nối đẩy đã IDLE – CHECK – OFFER – PROGRESS – TURN_IN | `MISSING` | P0 | |
| NPC-003 | Quest giver | Chưa có `giver_npc_id` runtime | `MISSING` | P0 | |
| NPC-004 | Quest objective | Faction daily chỉ yêu dùng `faction_action` | `PARTIAL` | P1 | |
| NPC-005 | Quest prerequisite | Chưa xử là đẩy đã level/faction/prerequisite quest | `MISSING` | P1 | |
| NPC-006 | Quest icon | Chưa có `!`/`?` theo trạng thái quest trên NPC | `MISSING` | P1 | |
| NPC-007 | NPC encounter | Cổ encounter NPC-NPC và relationship delta | `PARTIAL` | P1 | Nối thêm quest/lore/faction |
| NPC-008 | NPC identity | Cổ persistent NPC có bổn nhưng chưa materialize deterministic theo population slot | `PARTIAL` | P1 | |
| NPC-009 | NPC state machine | Chưa có transition validator, reason/source/decũsionSeed | `MISSING` | P1 | |
| NPC-010 | NPC injury/missing | Chưa có injured/recovering/missing/found/retired lifecycle | `MISSING` | P1 | |
| NPC-011 | NPC trade | Merchant visit đã có fallback NPC, chưa có transaction/stock/schedule đẩy đã | `PARTIAL` | P1 | |
| NPC-012 | NPC faction order | Chưa có faction order thểc từ cho patrol, escort, war, bulletin | `PARTIAL` | P1 | |
| NPC-013 | NPC weather shelter | Cổ shelter nhưng schedule và reaction có thể ghi đã `subLocationId` | `RISK` | P1 | |
| NPC-014 | NPC scale | Chưa chọng minh được 1.000 NPC không scan O(N) mỗi frame | `MISSING` | P2 | Performance test |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 7. Weather, War và World Event

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| WORLD-001 | Weather canonical fields | Cổ weather/intensity/until/source/history | `READY` | P1 | |
| WORLD-002 | Weather hysteresis | Chưa có ng–Ẩng vào/ra shelter r– rẨng | `MISSING` | P1 | |
| WORLD-003 | War weather pause | Chưa xác nhận bảo/tuy–t nẨng định chiện động được từ | `PARTIAL` | P1 | |
| WORLD-004 | Natural disaster | Cổ trigger Bảo Linh Khệ cường đã 5 k–o dữi | `READY` | P1 | Test duration/reset |
| WORLD-005 | Disaster consequences | Incũdent có tạo nhưng chưa nối đẩy đã NPC/faction/map consequence | `PARTIAL` | P1 | |
| WORLD-006 | NPC weather behavior | Cổ mood/reaction/shelter nhưng chưa đã route/need integration | `PARTIAL` | P1 | |
| WORLD-007 | Itinerant merchant | Cổ cadence 3 ng–y và fallback merchant | `PARTIAL` | P1 | Nối giao dữch thật |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 8. Save, canonical state và validation

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| SAVE-001 | Canonical version | Runtime serialize canonical v13 | `READY` | P1 | |
| SAVE-002 | Unknown content | Cổ lưu unknown world event/item/branch dormant/sealed | `READY` | P1 | |
| SAVE-003 | Dị Thể migration | Chưa có | `MISSING` | P0 | |
| SAVE-004 | Path state migration | `player.*` và `pathState.*` chưa động nhất | `MISMATCH` | P0 | |
| SAVE-005 | NPC runtime migration | Chưa validate đẩy đã node/subLocation/schedule state | `PARTIAL` | P1 | |
| SAVE-006 | Companion migration | Cổ companion default nhưng chưa version hòa riêng | `PARTIAL` | P1 | |
| SAVE-007 | Duplicate reward safety | Còn test quest/NPC/merchant retry không nhận thương hai lớn | `PARTIAL` | P1 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 9. UI và action wiring

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| UI-001 | Dị Thể panel | Chưa có view/state hiện thể Dị Thể | `MISSING` | P1 | |
| UI-002 | Hidden profession panel | Cổ thể hiện thể 7 nghề, chưa phần Ảnh 4 Từ Tích | `MISMATCH` | P0 | |
| UI-003 | NPC quest icon | Chưa có | `MISSING` | P1 | |
| UI-004 | NPC dialogue action | Chưa có action đẩy đã | `MISSING` | P0 | |
| UI-005 | Warning/confirm | Chưa có preview cost/risk trước unlock | `MISSING` | P1 | |
| UI-006 | Narrative errors | Đã có wrapper nhưng còn kiểm tra reason code mỗi của NPC/Dị Chí | `PARTIAL` | P2 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 10. Test coverage còn thiếu

| ID | Test | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| TEST-001 | Dị Thể unlock/effect | Chưa có | `MISSING` | P0 | |
| TEST-002 | Từ Tích read/fail/lock | Chưa có | `MISSING` | P0 | |
| TEST-003 | Hidden path exact triggers | Chưa có đã | `PARTIAL` | P1 | |
| TEST-004 | Dị Thể combat/loyalty/death | Chưa có | `MISSING` | P0 | |
| TEST-005 | NPC dialogue/quest lifecycle | Chưa có | `MISSING` | P0 | |
| TEST-006 | Weather shelter hysteresis | Chưa có | `MISSING` | P1 | |
| TEST-007 | Merchant cadence/trade | Chưa có | `MISSING` | P1 | |
| TEST-008 | Save round-trip Dị Chí | Chưa có | `MISSING` | P0 | |
| TEST-009 | Duplicate reward/retry | Chưa có đẩy đã | `PARTIAL` | P1 | |
| TEST-010 | 1.000 NPC performance | Chưa có | `MISSING` | P2 | |

## 11. Cổc quyết định còn chỉt trước khi coding

1. Giữ song song 7 nghề Cổ Tích và 4 nghề Từ Tích, hay xem 4 nghề Từ Tích là catalog mỗi thay thể?
>> 7 nghề có tách là nghề phụ, 4 nghề Từ thển tồn hạn là con đãẨng phụ.
Nếu đã desgin 4 nghề con đãẨng phụ done rủi, xửy ra trạng làp vài 4 nghề từ tách thể bổ 4 nghề từ tách đi.

2. Dị Thể lưu – `state.player.specũalPhysique` hay `state.physiqueState`? >> – `state.player.specũalPhysique`
3. `state.player.*` hay `state.pathState.*` là source of truth cho path? >> Giới thểch cho tại 2 hám này trước
4. Dị Thể có được tham gia combat trúc tiếp hay chỉ là companion utility? >> Tham gia combat trúc tiếp.
5. NPC quest dùng chung `contractBoard` hay tạo `questState` riêng? >> Quest state riêng
6. Khi NPC không đã shelter, NPC số reroute, xửp hạng hay chuyển trạng thái `missing`? >> Codex từ chọn logic hợp là nhất
7. Cổc effect Dị Thể/Từ Tích có permanent hay có thể tháo/giải trừ? >> Cổ thể giải trừ, codex từ tạo logic

## 12. Kết quá kiểm tra hiện tại

- Syntax JavaScript: đất – các file runtime đã kiểm tra.
- Regression có bổn: đất.
- Semantic coverage Dị Thể: chưa đất.
- Semantic coverage Từ Tích: chưa đất.
- Semantic coverage NPC Quest/Dialogue: chưa đất.
- Semantic coverage Dị Thể combat lifecycle: chưa đất.
- Stress offline world event/war/NPC: chưa dùng làm blocker theo phụm vi đã thểng nhất.

## 13. Ghi chỉ người review

<!-- Bổ sung note, quyết định hoặc yêu cấu thay đối tại đẩy. -->

### Note 1

- Người ghi:
- Ngày:
- Nối dung:

### Note 2

- Người ghi:
- Ngày:
- Nối dung:

## 14. Quyết định đã approve – canonical implementation contract

Phần này là nguồn chỉ dẫn trúc tiếp cho Codex khi triển khai. Không được quay lài mở hành cũ nếu trủi vài các quyết định dữ–i đẩy.

### 14.1. Phần loại namespace

```text
7 Cổ Tích
  – Nghề Nghiáp phụ
  – dùng secondaryId
  – PROF-003 đến PROF-005

4 Cổ Thần tàn hồn
  – Con Đường Ẩn
  – dùng hiddenPathId
  – PROF-006 đến PROF-009 là effect của hidden path
```

Không tạo 4 Nghề Từ Tích riêng nếu effect tương Ẩng đã thu–c 4 hidden path. Không dùng chung một ID cho `professionId`, `pathId`, `hiddenPathId` hoặc `pathVariant`.

### 14.2. Slot nghề canonical

```js
state.professionState = {
  primaryId: "luyen_dan",
  secondaryId: "doc_gia_co_tich",
  primaryLocked: true,
  secondaryLocked: true,
  discoveredHiddenIds: []
};
```

- `primaryId`: nghề sinh hoạt chính duy nhất.
- `secondaryId`: một trong bảy nghề Cổ Tích đang active.
- `discoveredHiddenIds`: danh sốch nghề Cổ Tích đã biết nhưng chưa chọn.
- Không dùng `hiddenIds` đã cấp passive/action/mastery nếu nghề chưa nám trong `secondaryId`.
- Nếu thật bổi chu–i Cổ Tích, `secondaryId` giữ `null`; nhận vật vẫn dùng nghề chính bình thương.
- Nghề phụ đã lock không được đối trúc tiếp; nếu còn đối phải qua nghi thểc phụ tách/giải khóa riêng.

### 14.3. Source of truth của Con Đường

```js
state.pathState = {
  primaryPathId: "di_hoa",
  secondaryPathId: null,
  hiddenPathId: null,
  pathVariant: "normal",
  hybridPath: null,
  pathLevel: 0,
  ritualMilestone: null,
  ritualByPath: {},
  transitionHistory: [],
  detachHistory: []
};
```

- `state.pathState` là canonical source cho mỗi logic Con Đường.
- `state.player.pathId`, `state.player.secondaryPathId`, `state.player.hiddenPathId` và `state.player.pathVariant` chỉ là runtime projection đã giữ tương thểch vài engine hiện tại.
- Mỗi thay đối path phải đi qua một API trung từm, cấp nhất `pathState` trước rủi mỗi động bổ sang `player`.
- `ensure()` phải khồi phục `pathState` từ canonical save; không từ suy diẨn hai state khệc nhau.
- `pathState.primaryPathId` phải phần Ảnh động path chính; không được đã null khi `player.pathId` đang active.

### 14.4. Ngoại Đạo Giả

Ngoại Đạo Giả là namespace `unbound`, không phải path chính và không ghi vào `pathId`.

Flow chọn Ngoại Đạo Giả phải được xử là trước mỗi kiểm tra `pathRelation()` hoặc kiểm tra path chính:

```text
Khai Là – chọn Ngoại Đạo Giả
        – player.pathId = null
        – player.unboundStatus.active = true
        – pathState.primaryPathId = null
        – không nhận path effect chính
```

Không đã `isUnboundPlayer()` chọn chính action dùng đã chọn Ngoại Đạo Giả. Sau khi đã unbound, không được chọn path chính nếu chưa có flow tháo trạng thái unbound hợp là.

### 14.5. Ritual Gọi Mệnh – Dựng Neo

Pipeline canonical:

```text
Gọi Mệnh
– Dựng Neo
– Đãi ChiƯu Con Đường
– V––t Dữ Tương
– Trừ Giữ
– Commit
```

Chuẩn field milestone:

```js
{
  id: "khai_lo",
  realmLevel: 2,
  pathLevel: 1
}
```

Không được dùng lài `milestone.level`. Mỗi điều kiện cảnh giải phải được `realmLevel`; mỗi tiên triển Con Đường phải được `pathLevel`.

Neo phải lưu đẩy đã:

```js
{
  anchorId,
  anchorType,
  stability,
  lastRenewedTurn,
  maintenance,
  broken
}
```

Quy tác:

- Gọi Mệnh và Dựng Neo chỉ là setup, không trừ cost commit.
- Neo phải tồn tại, có stability dữẨng và được reserve cho ritual đang chỉy.
- Không được dùng một Neo cho nhiều ritual active.
- Failure phải ghi `failureLog`, step, reason, impact và có thể tác động SAN/Corruption/Mệnh Nợ/Neo.
- Chỉ bổ–c Commit mỗi cấp nhất milestone và effect.
- Mỗi path phải có ritual state riêng trong `pathState.ritualByPath`.

### 14.6. Chuyển đãẨng

- Trước cảnh giải 4: một EXP của path hiện tại theo field path progression thểc từ.
- Từ cảnh giải 4: phụ một Mệnh Khí, tăng `fateDebt`, giảm stability Neo và ghi `transitionHistory`.
- Không reset `pathDebt` khi đối path.
- `pathVariant` thu–c path cũ không được từ động mang sang path mỗi.
- Nếu đang có ritual active, không cho chuyển đãẨng.
- Nếu đang hybrid, phải yêu cấu xử là hybrid trước hoặc chuyển trạng thái r– rẨng; không đã hybrid cũ ám thêm áp lớn path mỗi.

### 14.7. Song tu

- Mở từ cảnh giải 6.
- Hai path phải có `match_score >= 5`.
- Lưu hai path trong `pathState.primaryPathId` và `pathState.secondaryPathId`.
- Không tạo slot nghề hoặc path thể ba.
- Ritual liẨn quan tại song tu tăng 10% SAN cost.
- Không cho song tu nếu đã có secondary path khệc hoặc hybrid chưa được xử là.

### 14.8. Dung hợp

- Mở từ cảnh giải 10.
- Hai path phải có –t nhất một Mệnh trụ chung.
- Dung hợp phải qua commit/cost/risk riêng, không chỉ gần object `hybridPath`.
- Kết quá lưu tại `pathState.hybridPath`, giữ làch số hai path g–c.
- Không tạo slot path mỗi và không xửa hidden path.
- Nếu có từ hai Mệnh cấm chưa hòa giải, ghi trạng thái `Dữ Hệ` và tăng Corruption cho các ritual sau.
- Không cho dung hợp lớn hai nếu chưa có flow tại cấu trúc r– rẨng.

### 14.9. Nghịch Hành

Nghịch Hành là `pathVariant`, không phải hidden path.

- Không ghi vào `hiddenPathId`.
- Không dùng `linkedTaThanId`.
- Cost Nghịch Hành ghi vào `pathDebt`, không cùng trạng cùng một penalty vào `fateDebt`.
- Khi Hybrid, cost Nghịch Hành tăng 25%.
- Corruption và path debt phải có ledger:

```js
{
  amount,
  source,
  createdDay,
  permanent,
  pathVariant,
  hybrid
}
```

- Không g–i legacy activation rủi rollback state nếu có thể tách flow canonical trúc tiếp.
- `pathDebt` không reset khi chuyển path.

### 14.10. Hidden path từ Cổ Thần tàn hồn

- 4 nhậnh Cổ Thần tàn hồn là hidden path, không phải nghề.
- Cổ thể discovered/unlocked nhiều hidden path – dormant.
- Chỉ một hidden path active.
- Hidden path dormant không nhận effect, ritual hoặc title active.
- `seal` là kết thểc encounter vĩnh viẨn.
- `detach` còn Neo, cost, corruption và risk.
- Trigger tồng hidden path phải được kiểm tra riêng; không dùng duy nhất gate location/world/behavior chung.

### 14.11. Dị Thể

Dị Thể lưu tại:

```js
state.player.specũalPhysique = {
  id,
  status: "active",
  unlockedDay,
  source,
  createdDay,
  permanent: false,
  uses: 0,
  scars: [],
  removalState: null
};
```

- Chỉ được số hƯu tại đa một Dị Thể.
- Unlock bằng gameplay trigger, không roll làc tạo nhận vật.
- Effect phải được được từ catalog runtime, không hard-code rủi r–c trong combat.
- Cổ thể giải trừ bằng nghi thểc Từy Thể; phải có cost, risk và scar/penalty.
- Mỗi unlock/removal/effect phải ghi source, day và history.

### 14.12. Dị Thể

- Companion tham gia combat trúc tiếp, không chỉ scout utility.
- Mỗi companion có combat profile, skill/passive, loyalty, health, corruption, injury và lifecycle.
- Loyalty Ảnh hệẨng khệ năng hệ trừ, bổ chỉy và mutation.
- Capture phải kiểm tra rarity, danger, trạng thái combat và điều kiện node.
- Vạn Độc Thể phải nhận progress từ combat Quái Dị Biến thật; dùng hồi phục ngo–i phải reset hoặc loại progress theo được từ.

### 14.13. NPC Quest

NPC quest dùng `questState` riêng, không dùng `contractBoard` làm source of truth.

```js
state.questState = {
  available: {},
  active: {},
  completed: {},
  failed: {},
  npcIndex: {}
};
```

`contractBoard` chỉ dẢnh cho contract/faction bulletin projection.

Quest NPC phải hệ trừ:

- `giverNpcId`;
- dialogue state machine;
- prerequisite;
- objective progress;
- reward/penalty;
- quest icon;
- turn-in và duplicate reward protection.

### 14.14. Weather shelter

Khi shelter đẩy, NPC xử là theo thể từ:

1. Từm shelter hợp là gần nhất trong node.
2. Nếu không còn chỉ, xửp hạng vài `queuePosition`.
3. Nếu quá thái gian chỉ, reroute sang node an toàn gần nhất.
4. Chỉ chuyển `missing` sau khi reroute thật bổi theo số lớn giải hạn.

Không đã `updateNpcSchedules()` ghi đã shelter do `resolveNpcWeatherReaction()` vàa chọn. Mỗi thay đối phải đi qua transition API có `reason`, `source`, `day` và `decũsionSeed`.

## 15. Ưu tiên triển khai sau khi approve

1. P0: Dị Thể catalog/state/trigger/effect/save/validation.
2. P0: Chuẩn hòa `pathState` và sửa Ngoại Đạo Giả unreachable.
3. P0: Sửa `milestone.level` thành `realmLevel`, hoàn chính ritual failure/Neo.
4. P0: Tích 7 Cổ Tích thành nghề phụ và 4 Cổ Thần tàn hồn thành hidden path.
5. P1: Hoàn thiện chuyển đãẨng/song tu/dung hợp/Nghịch Hành.
6. P0: Companion combat lifecycle và Vạn Độc Thể integration.
7. P0: `questState` riêng cho NPC dialogue/quest.
8. P1: Weather shelter transition/reroute/hysteresis.
9. P1: Save round-trip và regression cho toàn bổ path/Dị Chí.

## 16. Điều Codex không được làm

- Không tạo thêm 4 nghề Từ Tích nếu chọng trạng effect vài 4 hidden path.
- Không dùng `professionId` đã đối diẨn cho hidden path.
- Không ghi Ngoại Đạo Giả vào `pathId`.
- Không cùng cùng một penalty vào có `fateDebt` và `pathDebt`.
- Không reset `pathDebt` khi đối path.
- Không cấp effect cho dormant hidden path/profession.
- Không commit ritual trước khi Gọi Mệnh, Dựng Neo và các gate trước đã hoàn từt.
- Không đã `player.*` và `pathState.*` từ thay đối được làp.
- Không dùng contract board làm quest state cho NPC.
- Không dùng regression syntax/pass có bổn làm bằng chọng rẨng logic Dị Chí đã hoàn chính.

## 17. Changelog triển khai Codex – 2026-09-14

### Đã triển khai

- Catalog `specũalPhysiques` gám 6 Dị Thể và state `player.specũalPhysique`.
- API unlock/status/remove/progress cho Dị Thể.
- Save round-trip cho Dị Thể.
- `pathState.canonicalSource` làm có xác định state canonical; runtime projection được động bổ và `player.*`.
- Ngoại Đạo Giả được xử là trước `pathRelation()` và không ghi vào `pathId`.
- Ritual milestone dùng `realmLevel` và `pathLevel`; loại bổ phụ thu–c logic vào field `level` cũ.
- Ritual failure ghi SAN/Corruption/Neo impact và failure log.
- Song tu tăng thêm 10% SAN cost – bổ–c cost ritual.
- Không cho chuyển path khi Hybrid Path còn active.
- Dung hợp ghi forbidden fate, trạng thái `diHe` và corruption khi có từ hai Mệnh cấm chưa hòa giải.
- Hidden path trigger riêng cho Ma Kiếm Đạo, Vô Danh Đạo và Tà Thần Khí Đạo.
- Companion có đến hệ trừ combat trúc tiếp.
- CuẨng Ngần hidden path g–y SAN drain khi can thiáp vào NPC encounter.
- HuyẨn Ảnh hidden path có có hồi tạo đến illusion trong combat.
- NPC có `questState` riêng vài available/active/completed/failed, prerequisite, objective progress và reward protection.

### Còn tiếp tác test/chính

- Trigger Dị Thể vẫn còn hook vào toàn bổ event gameplay thật thay và chỉ API progress.
- Companion còn bổ sung injury/death/flee/skill catalog và deterministic combat roll.
- UI NPC dialogue, quest icon và UI preview cost/risk chưa hoàn thiện.
- Thểc Cảnh và Vong Ng– đã có effect nẨn nhưng còn test integration vài node corruption và memory loss.
- Weather shelter queue/reroute/hysteresis chưa hoàn từt.
- Còn regression chuyển biết cho pathState canonical, ritual failure, Hybrid và hidden path exact trigger.
## 18. Hoàn thiện sốu đã apply

### UI quest/dialogue/icon NPC

- NPC hiện có `dialogueState` theo các trạng thái `IDLE_GREET`, `QUEST_OFFER`, `QUEST_PROGRESS_HINT`, `QUEST_TURN_IN`, `GENERIC_CHAT`.
- NPC hiện diẨn tại node tạo action `Nối chuyển`, action nhận/trừ quest và icon `!/?` từ trạng thái quest.
- Quest động cho NPC thương nhận và NPC tiên tiƯu được đăng k– theo ng–y, có expiry và reward.
- Mỗi quest đi qua `questState` chung, không tạo state UI riêng.

### Companion

- Catalog skill dùng `EXPANSION_DATA.companionSkills`, gám damage, cooldown, loyalty cost và effect.
- Companion có `health`, `maxHealth`, `injury`, `skillCooldowns`, `fleeCount`.
- Combat victory có xác su–t thương tách deterministic; loyalty và 0 chuyển companion sang `fled`.
- Skill được g–i bằng action UI hoặc `runExpansionCommand("companion_skill")`.

### Từ động trigger Dị Thể

- Combat hệ Dị Thể từ ghi progress `eldritch_beast_survival`.
- Progress đã điều kiện không từ chiám slot ngay mở tạo `pendingUnlocks`; người chỉi phải xác nhận action thểc tính.
- Cổ chỉ pending áp dùng chung cho moral streak, fate resonance, multi-element, reincarnation failure và hidden lore.

### Weather shelter

- Severity `>=3` vào shelter; severity `<=1` mỗi rủi shelter, có hysteresis tại thiếu một ng–y.
- Shelter đẩy chuyển NPC sang `shelter_queue`, lưu `queuePosition`; làch di chuyển không được ghi đã trạng thái trừ Ẩn.
- Mỗi NPC lưu `weatherState` gám severity, mode, lastTransitionDay và rerouteCount.

### Regression

- Thêm `tools/verify_dichi_deep.js`.
- Kiếm tra riêng path canonical/ritual, NPC dialogue/quest/icon, companion skill, Dị Thể progress và weather shelter hysteresis.
- Lớnh kiểm tra: `node tools/verify_dichi_deep.js` và `node tools/verify_game.js`.

### Ghi chỉ thi–t k–

- Icon hiện dùng text token `!/?` đã tương thểch renderer hiện tại; UI có thể thay bằng sprite mở không đối contract action.
- Companion injury hiện là state gameplay tại thiếu; hồi phục theo `recoveryDay`, chưa có item chưa thương riêng.
- Dị Thể dùng có chỉ pending đã tránh từ động thay đối build người chỉi trong làc đang render hoặc đang combat.
## 19. Bổ sung vẫng hoàn thiện tiếp theo

- Companion có trạng thái `dead`, `fled`, `injury`, action hồi sinh tồn 12 Linh Thạch và hồi phục vài `soul_scar`.
- Thật bổi Luôn Hồi/Chuyển Sinh được ghi vào `reincarnationLegacy.failureCount`, động bổ sang `flags` và kiểm tra Dị Thể.
- Quan hệ NPC đất ng–Ẩng trust/respect số kích hoạt kiểm tra resonance Dị Thể.
- Weather queue được promote mỗi world tick; queue quá 3 nhợp số reroute và `homeNodeId`.
- Quest panel hiện thể quest NPC, objective progress, icon và dialogue state; action runtime vẫn là nguồn số thật.
- `shadow_scout` reveal node exit thật qua discovery registry.
- NPC base catalog có dialogue states và icon mục định; NPC runtime có thể override bằng `displayName`/`icon`.
- Regression deep mở rẨng thêm scheduled task và war summary hook.

Trạng thái kiểm chọng: `node tools/verify_dichi_deep.js` và `node tools/verify_game.js` đầu pass.
## 20. Hoàn thiện 3 nhám logic còn thiếu

### Companion

- Enemy có thể chuyển mục tiƯu sang companion vài xác su–t bảo và chỉ; damage được trừ trúc tiếp vào `companion.health`.
- Companion chuyển `injury` hoặc `dead` theo ng–Ẩng health; trạng thái chỉt hiện thể action hồi sinh.
- Hồi sinh tồn 12 Linh Thạch, hồi 35% health và tạo `soul_scar` trong 5 ng–y.

### Quest và Dị Thể

- Quest NPC hệt hạn trong world tick được chuyển từ `available/active` sang `failed`.
- `reincarnation_failure` dùng `progress >= required`, không một eligibility khi và–t mục.
- Scheduled task hệ trừ `quest_expire`, `npc_encounter`, `faction_influence`.

### Weather

- Shelter queue có `queuePriority` theo faction/role và `queuedDay`.
- Khi chỉ quá 3 nhợp, NPC từm node lớn còn có danger thểp, không có chiện số; nếu không có thể và node nhệ.

### Dialogue/NPC catalog

- Cổ catalog dialogue theo generic/merchant/guard, portrait, node làa chọn và skill riêng.
- NPC có action dialogue branch và NPC skill cooldown.
- NPC skill hiện gám quan sốt rumor, market insight và frontier scan.

Kiếm chọng sau thay đối:

- `node tools/verify_dichi_deep.js` – pass.
- `node tools/verify_game.js` – pass.
