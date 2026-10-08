# TECHNIQUE CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\06-expansion\TECHNIQUE_RECIPE_CANONICAL_2026-09-16.md`

# Canonical Công Pháp và Recipe — 2026-09-16

## Mục tiêu

Mọi Công Pháp và mọi hành động chế tác phải có schema runtime thống nhất. Tên hiển thị chỉ dùng để trình bày; resolver luôn dùng `id`.

## Công Pháp

`techniqueCatalog()` chuẩn hóa mỗi bản ghi về các nhóm:

```js
{
  id, category, family, grade, element,
  minRealmLevel, isCore,
  cost: { mana, stamina, san, corruption, lifespan, cooldownTurns, castTimeSeconds },
  effect: { powerCoefficient, baseEffect, allStatMultiplier },
  risk: { corruptionProfile, hiddenAttributes },
  mastery: { stage, exp, usageCount },
  evolutionPaths: []
}
```

`visibleStats` vẫn được giữ để tương thích UI hiện hành, nhưng `cost`, `effect` và `risk` là DTO canonical cho resolver mới. Tâm Pháp (`category: tam_phap`) là passive, không đi qua action thi triển.

## Recipe

Recipe canonical có dạng:

```js
{
  id,
  professionId,
  materials: { itemId: quantity },
  output: { itemId | kind, quantity, purpose? },
  costs: { stamina?, qi?, san?, merit? },
  successBase?,
  perfectMultiplier?
}
```

Nguồn runtime hiện tại là `GameExpansion.recipeCatalog()`. `recipeCanCommit()` kiểm tra toàn bộ nguyên liệu và chi phí trước; `commitRecipeCosts()` trừ một lần sau khi kiểm tra thành công. Không được trừ từng phần trước khi biết recipe hợp lệ.

Các recipe canonical hiện có:

- `tu_khi_dan`, `hoan_huyet_dan`, `dien_tho_dan_ha` — Luyện Đan Sư.
- `procedural_artifact` — Luyện Khí Sư.
- `gathering_formation`, `ward_formation` — Trận Pháp Sư.

## Reward và log

Thưởng collection hiếm, contract, hidden realm và contested opportunity phải đi qua `grantCanonicalReward()` để tạo receipt chống phát thưởng trùng. Log kết quả phải dùng narrative producer; chi phí và thay đổi chỉ được đưa vào `statDisplay`/DTO.

## Invariant

1. Preview không trừ nguyên liệu, stamina hoặc RNG commit.
2. Commit lỗi không làm mất một phần nguyên liệu.
3. Recipe không tồn tại không được fallback âm thầm sang recipe khác, ngoại trừ alias được khai báo rõ.
4. Mastery tăng sau khi action đã xác định kết quả và chỉ tăng một lần cho một commit.

## Trạng thái

- Runtime schema và resolver recipe: **ĐÃ CODE**.
- Canonical DTO Công Pháp: **ĐÃ CODE**, regression đang kiểm tra record đã biết và cần mở rộng thêm snapshot toàn catalog tĩnh.
- Benchmark thời gian chế tác và UI recipe trên thiết bị yếu: **CHƯA ĐO**.



## New feature: C-ng Ph-p v?n h-nh theo hi?p

Add a preparation cycle to active techniques. Each learned active technique has `combatState: { cooldownRemaining, channelProgress, lastResolvedActionId }` under its progress record. `prepareTechnique(state,id,actionId)` validates learned state, realm, cost, and cooldown; charges the declared resource once; then marks the technique prepared for the current encounter. `useTechnique` resolves an explicit stance: `steady` uses catalog values; `burst` raises effect coefficient 20% and corruption cost 50%; `guarded` lowers effect 15% and halves incoming technique risk. Choices are previewable and idempotent by action ID. Successful resolution starts catalog cooldown; failed validation spends nothing. T-m Ph-p may modify preparation/cooldown through a read-only modifier snapshot, never by mutating catalog data.

UI shows Prepare, stance, cooldown, cost and effect preview. Combat and duel callers use the same resolver; existing non-combat use remains supported. Migration initializes new fields without altering mastery. This is a design contract pending runtime implementation.

## Runtime feature update (2026-09-22)
The implemented feature is a per-cast stance choice using the existing technique cooldown transaction; it supersedes the earlier proposed separate prepare/channel substate. `steady` uses catalog effects, `burst` raises effect by 20% and corruption cost by 50%, and `guarded` lowers effect by 15% and halves SAN/corruption costs. UI asks for a stance before committing an active-technique action. Invalid stance and resource failures spend nothing. Cooldown and mastery remain resolved by the existing `useTechnique` path.

## Runtime cross-feature additions (2026-09-22)

- Combat Fate resonance counts distinct, catalog-owned, active and unsuppressed Fate IDs. Same-element and explicit `pathAffinity` matches share one catalog policy and a hard +5% power cap; support/passive techniques and unknown/neutral elements receive no Fate bonus. Preview exposes matched IDs and sources.
- `guild_elemental_array_support` grants +5% power only while a guild-taught formation from the current active guild remains deployed, for a disciple-rank-or-higher member and an allowed technique element. Membership suspension, expiry, mismatched source guild, or invalid formation removes the bonus. The source formation record is captured at deployment; old saves without it receive no bonus.
- Shared eligibility rechecks active Fate count/element/ID and suspended membership. Realm/path/faction and training location remain blockers as declared by the scope requirements.
- UI action receipts retain the latest 64 results and a monotonic high-water sequence for generated `technique-ui:N` IDs. A replay after receipt eviction is rejected without costs/effects; retained IDs return their original receipt.
- Regression coverage exercises duplicate/suppressed Fate handling, path bonus, guild bonus/suspension and evicted-receipt replay.
-
## Nền Công pháp và lộ trình tu luyện độc lập — đặc tả tích hợp

### 1. Mục đích

Phần này bổ sung nền dữ liệu và quy tắc tiến triển cho hệ thống Công pháp hiện có. Mục tiêu là để mọi nhân vật có một lộ trình tu luyện hợp lệ ngay cả khi không gia nhập Tông Môn, đồng thời không biến Ý định `Tự Lập` thành một cờ chặn đơn giản.

Đặc tả này phải được tích hợp vào `data/cong_phap.js`, `GameEngine` và `GameExpansion` hiện có. Không tạo một hệ thống Công pháp thứ hai, không tạo resolver riêng cho `Tự Lập`, và không xóa công pháp đã học trong save cũ.

### 2. Phạm vi và bất biến nền

1. `id` là định danh duy nhất của Công pháp. Tên hiển thị, tên cũ và tên dịch không được dùng để kiểm tra quyền truy cập.
2. Catalog là dữ liệu chỉ đọc. Accessor phải trả bản sao; resolver không được sửa catalog.
3. `techniquePreview()` là hàm thuần: không trừ tài nguyên, không tăng mastery, không ghi receipt và không gọi RNG commit.
4. `learn`, `training`, `prepare`, `channel`, `use` và `evolve` là các phase khác nhau. Một Công pháp có thể hợp lệ ở phase này nhưng bị chặn ở phase khác.
5. Công pháp đã học không bị xóa khi nhân vật rời Tông Môn, mất nghề, đổi Con Đường hoặc thay đổi Ý định. Điều kiện mới chỉ ảnh hưởng quyền học tiếp, sử dụng hoặc modifier runtime theo policy của Công pháp.
6. Mọi thay đổi tài nguyên, mastery, cooldown, corruption, Fate resonance và phần thưởng phải đi qua transaction/receipt canonical.
7. Resolver phải trả blocker DTO ổn định gồm `code`, `message`, `phase`, `techniqueId` và `details` tùy trường hợp. UI không tự đoán điều kiện từ catalog.

### 3. Phân loại nguồn Công pháp

Mỗi record phải có `sourceType`. Một Công pháp có thể có nhiều `acquisition` nhưng chỉ có một `sourceType` chính.

| `sourceType` | Ý nghĩa | Ví dụ nguồn mở khóa |
|---|---|---|
| `universal` | Công pháp nền mà mọi nhân vật đủ điều kiện đều có thể học | người hướng dẫn, mở đầu, phần thưởng phổ thông |
| `path` | Công pháp gắn với một Con Đường | thử thách Con Đường, di tích tương ứng |
| `guild` | Công pháp do một Tông Môn/Tổ chức truyền thụ | kho Công pháp, NPC sư truyền, rank tối thiểu |
| `independent` | Công pháp dành cho hoặc đặc biệt phù hợp với Tự Lập | bản chép tán tu, khám phá, chế tác, trao đổi |
| `profession` | Công pháp mở qua Nghề chính | nhiệm vụ nghề, vật phẩm nghề, mentor nghề |
| `hidden_profession` | Công pháp của Nghề Ẩn | nhánh manh mối Nghề Ẩn đã mở |
| `hidden_path` | Công pháp của Con Đường Ẩn từ Cổ Tịch | đủ Cổ Tịch, ba manh mối và nghi thức mở đường |
| `fate` | Công pháp hoặc biến thể do Mệnh Số cấp | phần thưởng Fate, trial, reconciliation |
| `discovery` | Công pháp mở qua khám phá thế giới | map event, hidden realm, đấu giá, NPC hiếm |

`sourceType` không tự quyết định quyền học. Quyền học luôn được tính từ `accessPolicy`, nguồn acquisition, phase và context hiện tại.

### 4. Schema Công pháp nền

Schema mới mở rộng record cũ; các trường cũ như `visibleStats`, `pathAffinity`, `requiredFaction`, `minRealmLevel`, `isCore`, `mastery` vẫn được đọc để tương thích.

```js
{
  id: "tu_lap_tam_phap",
  schemaVersion: 2,
  name: "Tán Tu Dẫn Khí Quyết",
  aliases: ["tán tu dẫn khí", "tâm pháp tự lập"],
  category: "tam_phap",
  family: "independent",
  sourceType: "independent",
  grade: "pham",
  quality: "ha",
  element: "vo_he",
  pathAffinity: [],
  professionAffinity: [],
  minRealmLevel: 1,
  isCore: true,
  role: "core_cultivation",
  accessPolicy: {
    allowedJourneyIntents: ["tu_lap"],
    allowedPathIds: [],
    requiredGuildId: null,
    forbiddenGuildMembership: false,
    requiredProfessionIds: [],
    requiredHiddenIds: [],
    requiredCodexProgress: 0,
    requiredFlags: []
  },
  acquisition: [
    { id: "independent_opening", type: "opening_grant", requiredIntent: "tu_lap", oncePerCharacter: true },
    { id: "independent_mentor", type: "mentor", npcTags: ["tan_tu", "mentor_cultivation"], cost: { merit: 3 } }
  ],
  progression: {
    masteryCap: 5,
    baseMasteryGain: 1,
    breakthroughRole: "core",
    fusionEligible: true,
    evolutionIds: ["tu_lap_tam_phap_tu_chu"]
  },
  cost: {
    prepare: { qi: 0, stamina: 0, san: 0 },
    use: { qi: 0, stamina: 0, san: 0, corruption: 0, lifespan: 0 }
  },
  effect: { cultivationMultiplier: 0.05, powerCoefficient: 0.7, baseEffect: "Ổn định vận khí và mở nền tảng tu luyện độc lập." },
  risk: { corruptionProfile: null, hiddenAttributes: [] },
  ui: { categoryLabel: "Tâm Pháp Tán Tu", sourceLabel: "Con đường Tự Lập", showAcquisitionHints: true }
}
```

Các trường bắt buộc của schema v2: `id`, `schemaVersion`, `name`, `category`, `family`, `sourceType`, `minRealmLevel`, `isCore`, `role`, `accessPolicy`, `acquisition`, `progression`, `cost`, `effect` và `risk`. `accessPolicy` phải có giá trị mặc định rõ ràng, không dùng `undefined` để biểu thị “không giới hạn”.

### 5. `accessPolicy` và thứ tự kiểm tra

Resolver kiểm tra theo thứ tự: catalog/schema; sở hữu Công pháp; Ý định; membership/rank; Con Đường; Nghề/Nghề Ẩn/Con Đường Ẩn; Cổ Tịch/Fate/faction/NPC/địa điểm; cảnh giới/mastery/cooldown/tài nguyên; cuối cùng là replay/idempotency.

Không được dùng điều kiện “đang ở Tông Môn” để thay cho `requiredGuildId`. Không được dùng tên hiển thị rank, nghề hoặc Con Đường để so sánh.

Blocker chuẩn:

```js
{
  code: "JOURNEY_INTENT_BLOCKED",
  phase: "learn",
  techniqueId: "guild_signature_huyen_thien_tong",
  message: "Công pháp này chỉ được truyền trong Tông Môn tương ứng.",
  details: { requiredGuildId: "guild_huyen_thien_tong", currentIntent: "tu_lap" }
}
```

### 6. Quy tắc riêng cho `Tự Lập`

`Tự Lập` nghĩa là không gia nhập Tông Môn để nhận đạo thống và nghĩa vụ thành viên. Nó không cấm mọi Công pháp có chữ “Tông”, không cấm học từ NPC và không cấm sử dụng Công pháp tìm được bên ngoài.

Được phép: học `universal`, `independent`, `discovery`, `path`, `profession`, `hidden_profession`, `hidden_path`; nhận Công pháp từ NPC tán tu, thương nhân, di tích, đấu giá và Cổ Tịch; phát triển Con Đường; tự ghép/evolve khi đủ điều kiện.

Không được phép: `joinGuild()` thành công; nhận `guildTechniqueIds()` như phần thưởng thành viên; nhận guild rank/mastery bonus/formation support khi không có membership; học record `sourceType: guild` nếu policy yêu cầu membership hiện tại.

Save cũ không bị phá: không xóa Công pháp/mastery; thêm `legacyAcquired: true` nếu thiếu receipt; chặn nhận mới sau migration; nếu Công pháp cũ có policy không cho dùng sau khi rời Tông Môn thì trả blocker rõ ràng thay vì xóa state.

### 7. Bộ Công pháp nền cho Tự Lập

| ID đề xuất | Vai trò | Nguồn | Mốc mở |
|---|---|---|---|
| `tu_lap_tam_phap` | Tâm Pháp nền | opening grant | xác lập `Tự Lập` |
| `tan_tu_dan_khi_quyet` | Tâm Pháp nâng cao | mentor/đổi merit | Khai Lộ + insight |
| `bach_giai_tap_luc` | Công pháp đa dụng | khám phá/đấu giá | Dựng Thai |
| `tu_lap_kiem_thuc` | Nhánh Kiếm Chủ | thử thách Con Đường | `kiem_dao` + lead tag |
| `tu_lap_luyen_the_phap` | Nhánh Luyện Thể | NPC/di tích | `luyen_the_dao` + body score |
| `tu_lap_tran_giai` | Nhánh Phong Thủy/Thiên Cơ | Cổ Tịch/map discovery | `phong_thuy_dao` hoặc `phu_dao` |
| `co_tich_tu_lap_bien` | Nhánh Con Đường Ẩn | đủ Cổ Tịch | hidden path unlock |
| `tu_lap_dao_thong_phoi` | Công pháp hợp nhất | fusion/evolution | Hợp Đạo hoặc điều kiện tương đương |
Tên hiển thị có thể thay đổi; ID phải ổn định sau khi phát save.

### 8. Acquisition receipt và state

Mọi cách học phải tạo receipt ổn định:

```js
{
  receiptId: "technique-learn:tu_lap_tam_phap:opening:001",
  techniqueId: "tu_lap_tam_phap",
  sourceType: "independent",
  sourceId: "independent_opening",
  acquiredAt: { turn: 0, worldDay: 1 },
  journeyIntent: "tu_lap",
  pathId: null,
  guildId: null,
  legacyAcquired: false
}
```

State mở rộng dưới `state.player.techniques[id]` gồm `learnedAtTurn`, `sourceType`, `acquisitionReceiptId`, `sourceContext` và `combatState`. Mastery cũ phải được chuẩn hóa mà không reset. Học lại trả `duplicate: true`, không cấp lại phần thưởng.

### 9. Lộ trình tiến triển

1. **Dẫn khí:** khi chốt `Tự Lập`, nhận `tu_lap_tam_phap` đúng một lần.
2. **Tự tìm pháp:** sau Khai Lộ, mở mentor tán tu, bản chép map event, đổi merit, đấu giá, discovery reward và thử thách Con Đường.
3. **Chọn nhánh:** `pathId` mở nhóm Công pháp ưu tiên nhưng không tự cấp toàn bộ catalog.
4. **Tự hợp pháp:** fusion/evolution khai báo input IDs, mastery tối thiểu, insight/vật liệu, output ID, điều kiện realm/path/Fate và receipt.

Mỗi acquisition phải có cost, điều kiện, thất bại và preview rõ ràng. Preview không mutation.

### 10. Đột phá và `isCore`

`isCore` chỉ đánh dấu Công pháp có thể đóng vai trò nền; không tự động bỏ qua path score, Fate, anchor, ritual hoặc điều kiện realm. Breakthrough resolver phải kiểm tra core hợp lệ, mastery nếu cần, path/Fate/anchor/ritual và không phụ thuộc guild membership đối với nhân vật `Tự Lập`.

### 11. Tách namespace

- `professionId`: Nghề chính, ví dụ `luyen_dan`, `tuong_su`.
- `pathId`: Con Đường, ví dụ `kiem_dao`, `phu_dao`.
- `guildId`: Tổ chức hiện tại.
- `hiddenProfessionId` và `hiddenPathId`: hai điều kiện độc lập.

`professionAffinity` không thay `pathAffinity`; `pathAffinity` không thay `requiredGuildId`. Không viết rule `professionId === pathId`; mapping phải khai báo trong catalog.

### 12. UI và migration

Màn Công Pháp phải hiển thị tên, category, source label, trạng thái, acquisition tiếp theo, blocker, ảnh hưởng đột phá, affinity riêng biệt, cost/effect preview và đúng nút Prepare/Channel/Cancel. Không hiển thị raw ID hoặc tên hàm.

Migration catalog: record cũ thiếu version nhận `schemaVersion: 1`; chuẩn hóa `visibleStats` vào DTO mới nhưng giữ field cũ; suy ra `sourceType` từ `pathAffinity`/`sourceGuildId`; record không rõ nguồn nhận `universal`, không tự gán `guild`.

Migration save: giữ mastery; thêm `sourceType: "legacy"`, receipt `legacy:<id>`, combatState mặc định; chỉ cấp tâm pháp Tự Lập một lần cho save có `journeyIntent === "tu_lap"` và chưa có core technique.

### 13. Validator và regression contract

Validator phải kiểm tra ID/source/category, tham chiếu path/profession/guild tồn tại, số hữu hạn, acquisition ID duy nhất, core/progression không mâu thuẫn, source guild có policy guild, source independent có acquisition ngoài guild và evolution không tạo vòng lặp vô hạn.

Regression tối thiểu: cấp tâm pháp Tự Lập một lần; chặn gia nhập Tông Môn; học được universal/path/discovery; không nhận guild bonus; rời Tông Môn không mất Công pháp; migration không reset mastery/cooldown; preview không mutation; receipt chống replay; core Tự Lập tham gia đột phá đúng điều kiện; namespace Nghề/Đường/Tông Môn không chồng chéo; UI không raw ID; acquisition/fusion deterministic.

### 14. Trình tự triển khai

1. Schema normalization và catalog validator.
2. Catalog nền `Tự Lập` và acquisition receipt.
3. Nối `learnTechnique()` với eligibility/source policy.
4. Cấp tâm pháp nền từ opening plan một lần.
5. Tách guild grant khỏi generic learning.
6. Thêm mentor/discovery/path-trial acquisition.
7. Thêm fusion/evolution.
8. Cập nhật UI/action log, migration, regression và offline parity.

Quyết định sản phẩm: `Tự Lập` là một lộ trình đầy đủ, không phải trạng thái thiếu Tông Môn; Công pháp Tông Môn độc quyền theo membership; Công pháp thế giới có thể tiếp cận ngoài Tông Môn; mọi acquisition quan trọng đều data-driven và có receipt; cân bằng chỉ chỉnh trong catalog.

Trạng thái: **Đặc tả thiết kế — chờ triển khai runtime và catalog nền**.
