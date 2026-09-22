# Đặc tả liên kết Công Pháp · Mệnh Số · Nhân Vật · Tông Môn

**Trạng thái:** đặc tả review; runtime đã áp dụng các phần được liệt kê ở cuối tài liệu.
**Ngày:** 2026-09-22
**Phạm vi:** năm gap 1–5 trong rà soát runtime. Bổ sung hành vi liên feature; không thay schema save hiện có hoặc tự chỉnh catalog đã sở hữu.

## Mục tiêu và nguyên tắc chung

Mọi luồng học, xem trước, thi triển, luyện thành và tiến hóa Công Pháp dùng cùng ngữ cảnh nhân vật và cùng phép tính. Mệnh đang kích hoạt, con đường, cảnh giới, mastery, evolution và tư cách Tông Môn chỉ tác động khi có rule cụ thể. Modifier có nguồn truy vết, giới hạn, không sửa catalog và không cộng kép qua computeStats lẫn cast resolver.

1. **Catalog bất biến:** resolver đọc theo ID; modifier là snapshot của action, không ghi ngược vào technique catalog, dữ liệu Mệnh hay CONG_PHAP_DATA.
2. **Một nguồn sự thật:** preview và commit gọi cùng resolver thuần. Commit làm mới context và kiểm tra tài nguyên trước transaction.
3. **Chỉ Mệnh kích hoạt cộng hưởng:** Fate trong kho, đã gỡ, bị phong ấn hay không còn thuộc sở hữu không tăng hiệu quả. UI nêu Fate nguồn.
4. **Quyền lợi môn phái không phải quyền sở hữu:** rời môn không xóa Công Pháp/mastery/trial/evolution; chỉ access, truyền thụ, kho và modifier đang cấp bị thu hồi.
5. **Không tự hủy tiến trình:** đổi path, cảnh giới hoặc membership không xóa record. Kỹ năng có thể thành dormant/blocked kèm lý do, rồi hoạt động lại khi đủ điều kiện.
6. **Idempotency:** cùng actionId/eventId không thể trừ tài nguyên, tăng mastery/trial hay phát thưởng lần hai.
7. **Thứ tự:** base catalog → mastery → evolution → Mệnh cộng hưởng → snapshot Tông Môn → world/combat → stance. Mỗi nhóm cộng phần trăm nội bộ rồi nhân một lần; cap áp dụng theo nhóm.

## Context và response dùng chung

buildTechniqueContext(state, options) là hàm thuần, chỉ chuẩn hóa và đọc:

```ts
TechniqueContext {
  characterId: string;
  actionId: string | null;
  phase: "preview" | "learn" | "cast" | "cultivate" | "duel";
  realmLevel: number;
  pathId: string | null;
  pathTags: string[];
  equippedFateIds: string[];
  guild: {
    guildId: string | null; rankId: string | null; rankIndex: number;
    member: boolean; status: "active" | "suspended" | "none"; revision: number
  };
  techniqueProgress: { masteryExp: number; masteryStage: number; evolutionId: string | null };
  world: { regionId: string | null; weatherId: string | null; eventIds: string[] };
}
```

Save cũ thiếu field dùng trung tính: null, [], rankIndex 0, revision 0. Context không gọi RNG, không sửa state/catalog. Kết quả resolver:

```ts
TechniqueResolution {
  ok: boolean; techniqueId: string; actionId: string | null;
  blockers: Blocker[]; sources: ModifierSource[];
  costs: { qi: number; stamina: number; san: number; lifespan: number; corruption: number };
  effect: { powerCoefficient: number; cooldownTurns: number; secondary: Record<string, number> };
  snapshotKey: string;
}
```

Response clone/đóng băng; không trả tham chiếu nested tới save hay catalog.

---

## 1. Mệnh Số → Công Pháp: cộng hưởng nguyên tố và con đường

### Gap và rule

Combat hiện dùng chuỗi fateTags để suy ra nguyên tố. Tag chủ đề không phải element canonical, dễ bỏ sót Mệnh có field element, nhầm alias hoặc đếm Fate dormant. Nguồn chuẩn phải là fateDefinition/fateElement/fatePathAffinity và technique catalog.

- Chuẩn hóa, khử trùng lặp ID từ player.fates; chỉ xét Fate đang kích hoạt, tồn tại trong catalog và không bị suppress.
- Đối chiếu canonical element của Fate và technique, không đọc tên/mô tả/tag tự do.
- Element rỗng, vo_he, unknown hoặc lỗi dữ liệu cho kết quả neutral.
- Mỗi Fate cùng element cho +1% power; cap tổng +5% mỗi cast. Chỉ áp dụng kỹ thuật combat có element; passive/support mặc định không nhận.
- Fate path affinity matches the active path and explicit technique `pathAffinity`; eligible matches contribute within the shared +5% Fate-resonance cap and are listed in preview.
- Fate bị Trấn Mệnh không cấp resonance tích cực. Relation generates/overcomes không tự tạo bonus.
- Một Fate chỉ đóng góp một lần; evolution modifier là nguồn riêng, không tính lại thành Fate thứ hai.

```js
const FATE_TECHNIQUE_RESONANCE = {
  version: 1, sameElementPowerPctPerFate: 1, maxElementPowerPct: 5,
  countOnlyEquipped: true, countSuppressed: false, unknownElement: "neutral"
};
```

Pseudocode:

```js
function techniqueFateResonance(state, technique, context) {
  const matched = unique(context.equippedFateIds).filter(id => {
    const fate = fateDefinition(id);
    return fate && !isFateSuppressed(state, id) &&
      canonicalElement(fate.element) !== "vo_he" &&
      canonicalElement(fate.element) === canonicalElement(technique.element);
  });
  return {
    bonusPct: Math.min(5, matched.length),
    matchedFateIds: matched,
    pathAffinity: resolvePathAffinity(context, technique)
  };
}
```

Áp dụng bonus vào powerCoefficient đúng một lần trước khi tách damage components. Không mutate Fate, technique catalog, enemy hay player.stats. Preview hiển thị Fate đã khớp và tổng bonus; log chỉ nêu nguồn khi bonus >0.

### Bổ sung schema Công Pháp

```ts
TechniqueDefinition {
  id: string;
  element: CanonicalElement;
  pathAffinity?: string[];
  fateResonance?: { mode: "same_element" | "none" };
}
```

Record cũ không cần sửa: mặc định same_element cho combat technique có element, none cho passive/support nếu chưa khai báo. Mức bonus nằm trong policy versioned, không cho từng record đặt multiplier tự do.

## 2. Công Pháp → Nhân Vật: preview/commit parity

Thay phép tính tách rời trong techniquePreview và useTechnique bằng resolver thuần resolveTechnique(state,id,{phase,stance,confirmed,actionId,targetId}). Resolver kiểm tra ownership, category, realm, path restrictions, cooldown, target, costs và modifiers; không mutate. commitTechniqueResolution áp dụng transaction sau khi xác thực lại.

### Stance matrix

| Thế | Power | SAN | Corruption | Qi/Stamina/Lifespan | Cooldown |
|---|---:|---:|---:|---:|---:|
| steady | ×1.00 | ×1.00 | ×1.00 | ×1.00 | ×1.00 |
| burst | ×1.20 | ×1.00 | ×1.50 | ×1.00 | ×1.00 |
| guarded | ×0.85 | ×0.50 | ×0.50 | ×1.00 | ×1.00 |

Đây là cách diễn giải runtime addendum hiện hành: guarded giảm SAN/Corruption cost, không giảm incoming damage. Nếu cần incomingRiskMultiplier cho duel, đó là field/action pipeline khác và chưa bật trong MVP.

Cost thứ tự duy nhất: catalog base → mastery cost multiplier → evolution → guild → stance → làm tròn. Qi/stamina dùng ceil; SAN/lifespan/corruption làm tròn 2 chữ số. Preview nêu requested/applied corruption nếu chạm cap. Power thứ tự: catalog → mastery → evolution → Fate → guild → world → stance → matchup. Percent trong cùng nhóm cộng rồi nhân một lần.

### Transaction và lỗi

- UI cast bắt buộc actionId ổn định; legacy call được cấp ID từ sequence theo lượt, không dùng timestamp/random.
- Ledger giữ tối thiểu 64 action IDs gần nhất. Duplicate trả receipt cũ, không chạy cost/effect lại.
- Validate toàn bộ blocker/resource/target/cooldown trước mutation.
- Cast làm SAN về 0 là transaction đã commit nếu madness được kích hoạt; trả committed:true, outcome:madness; không để caller retry.
- Lỗi trước commit không đổi resource/cooldown/mastery.
- Cooldown 0 không lưu record. Với cooldown >0 dùng readyAtTurn; cast được phép khi turn >= readyAtTurn.
- Mastery tăng một lần sau khi outcome được quyết định; cast không có target không tăng combat mastery nếu category cần target.

Preview trả blocker, thiếu bao nhiêu resource, cooldown còn lại, power, costs và sources. snapshotKey ràng buộc technique, character revision, membership revision, equipped Fate IDs và turn. Nếu state đổi trước click, engine resolve lại; UI xác nhận lại nếu cost/effect đổi.

## 3. Công Pháp → Tông Môn: catalog quyền lợi

Không cài rule trong UI hoặc ghi đè technique khi join. Thêm guildTechniquePolicies:

```ts
GuildTechniquePolicy {
  id: string; guildId: string; revision: number;
  learnGrants?: { techniqueId: string; rankMin?: string; oncePerMember?: boolean }[];
  teachings?: { techniqueId: string; rankMin: string; cost?: ResourceCost }[];
  modifiers?: {
    id: string; rankMin: string; category?: string[]; element?: string[];
    pathId?: string[];
    effect: { powerPct?: number; qiCostPct?: number; cooldownPct?: number; masteryGainPct?: number };
    caps?: { powerPct?: number; qiCostReductionPct?: number; cooldownReductionPct?: number; masteryGainPct?: number };
  }[];
  exitPolicy: { preserveLearnedTechniques: true; revokeAccess: true };
}
```

### Nội dung catalog mẫu để review

| ID mẫu | Scope | Điều kiện | Hiệu lực đề xuất |
|---|---|---|---|
| guild_common_manual_training | Công Pháp môn đã học | membership active | +5% mastery gain |
| guild_inner_manual_training | Kỹ thuật được policy liệt kê | rank inner+ | tổng guild mastery cap +10% |
| guild_elemental_array_support | tran_phap, element của môn | rank core+ và địa bàn/resource môn | +5% power, chỉ trong trận pháp |

Đây là mức balance đề xuất, không phải claim rằng mọi guild hiện có đủ dữ liệu. Chỉ seed khi guild/rank/element được xác nhận; không cấp combat power toàn cục vì membership đơn thuần. Catalog validator báo policy trỏ ID/rank/category không tồn tại.

### Snapshot và vòng đời membership

guildTechniqueSnapshot(state,technique,context) trả guildId, rankId, revision, valid, modifiers, sourceIds, blockers. Member hợp lệ phải có guild ID và rank trong catalog, status active, không suspended. Rank so qua canonical rank index, không so tên hiển thị. Không cache qua turn; revision phải tăng ở join/leave/promotion/demotion/suspension/reinstatement.

Teaching cần cùng guildId giữa NPC và membership, NPC có quyền dạy, technique ở vault snapshot, rank đủ và cost trả được. Quyền dạy không tự học skill.

Join/leave/rank change/loyalty test đi qua transitionGuildMembership:

1. Validate membership/rank, transaction đang chờ, và policy.
2. Ghi transition một lần, tăng revision, invalidate snapshot.
3. Refresh derived stats nhưng không grant trùng và không xóa mastery/evolution.
4. Training pending hủy/hoàn theo receipt; project xử lý theo SYS-02; transaction committed giữ nguyên.
5. Leave/suspend thu hồi ngay guild access, vault và teaching. Formation đã đặt chạy đến expiry theo record; không cho đặt mới.
6. Grant oncePerMember có receipt vĩnh viễn theo member+guild; rejoin không cấp lại nếu policy không quy định cooldown/regrant.

## 4. Công Pháp → Tiến trình Nhân Vật: evolution trial

### Schema

```ts
TechniqueProgress {
  masteryExp: number; masteryStage: 0 | 1 | 2 | 3 | 4; usageCount: number;
  evolution: {
    status: "locked" | "trial" | "ready" | "chosen";
    trialType?: "cultivation" | "elite"; progress: number; target: number;
    eventKeys: string[]; startedDay?: number; completedDay?: number;
    evolutionId?: string | null; chosenAtDay?: number;
  };
}
TechniqueEvolutionDefinition {
  id: string; techniqueId: string; name: string;
  trial: { type: "cultivation" | "elite"; target: number; requiresUse?: boolean };
  requires?: { minRealmLevel?: number; pathIds?: string[]; guildIds?: string[]; fateElements?: string[] };
  modifiers: { powerPct?: number; qiCostPct?: number; cooldownPct?: number; effectTags?: string[] };
  caps: { powerPct?: number; qiCostReductionPct?: number; cooldownReductionPct?: number };
  irreversible: boolean;
}
```

Giữ catalog techniqueEvolutions đang có. Save cũ migrate eventKeys=[] và target theo rule hiện hành (elite 2, cultivation 5); không cấp bù progress.

### Event và idempotency

recordTechniqueTrialEvent(state,{type,eventId,techniqueId,source}) là producer duy nhất. Trial mở khi learned, catalog có evolution hợp lệ, mastery đạt threshold hiện hữu (stage 2), status locked. Mở UI/load không tăng progress.

- cultivation: một tick cho action tu luyện đã commit, eventId = cultivationActionId.
- elite: một tick cho encounter elite đã kết thúc hợp lệ, eventId = combatEncounterId, không phải animation/turn/cast.
- Chỉ trial cùng type tăng. requiresUse=true bắt buộc event techniqueId khớp.
- Duplicate key no-op; action preview/fail no-op.
- progress = min(target, progress+1); chuyển ready và log đúng một lần khi đủ.
- Trial ready/chosen không nhận tick thêm. Dọn ledger sau khi hoàn tất nhưng lưu archive/hash bounded để ngăn replay.
- Event legacy thiếu ID lấy từ canonical action/encounter sequence, không dùng Date.now.

Chọn branch cần status ready, branch đúng technique, requirements còn hợp lệ và actionId mới. Preview cho before/after, yêu cầu membership/path/Fate, irreversible và modifier bị cap. Nếu requirement mất sau khi chọn, evolution giữ nguyên nhưng modifier dormancy cho tới khi đủ điều kiện; không xóa đầu tư.

## 5. Eligibility liên kết học/thi triển/luyện Công Pháp

### Schema optional/backward-compatible

```ts
requirements?: {
  minRealmLevel?: number; maxRealmLevel?: number;
  pathIds?: string[]; pathTagsAny?: string[]; pathTagsAll?: string[];
  fateIdsAny?: string[]; fateElementsAny?: CanonicalElement[];
  fateScope?: "owned" | "equipped"; minActiveFates?: number;
  guildIds?: string[]; guildRankMin?: string;
  taintedFactionIds?: string[]; forbiddenKnowledge?: boolean;
  requireAtTrainingHall?: boolean; allowLegacyUse?: boolean;
};
learnRequirements?: RequirementSet;
useRequirements?: RequirementSet;
trainingRequirements?: RequirementSet;
```

requiredFaction cũ tiếp tục alias cho taintedFactionIds; tuyệt đối không map sang guild membership. Không khai báo requirements có nghĩa là không thêm giới hạn. fateScope mặc định equipped khi rule yêu cầu Fate, tránh Mệnh kho cấp buff.

### Scope

- **Learn:** xác minh source (grant/loot/teacher), realm, path/Fate/guild/faction và forbidden knowledge; ghi progress record một lần.
- **Use:** learned, realm, ongoing path/Fate/member rules, target, cooldown, cost. Chỉ requirement được khai báo trong useRequirements làm ongoing restriction.
- **Training:** action đã commit, training requirements và action id chưa dùng. Guild mastery policy có thể áp dụng, tự tu vẫn có base progress.
- Mỗi scope dùng cùng evaluator, cùng blocker shape và catalog IDs; rule sets cho phép phân biệt điều kiện.
- Kỹ năng learned nhưng không hợp điều kiện use trở thành derived dormant/blocked; không xóa record/mastery.

### Blocker

```ts
Blocker {
  code: "NOT_LEARNED" | "REALM_TOO_LOW" | "REALM_TOO_HIGH" | "PATH_MISMATCH" |
    "FATE_REQUIRED" | "GUILD_REQUIRED" | "GUILD_RANK_REQUIRED" | "FACTION_REQUIRED" |
    "TECHNIQUE_DORMANT" | "COOLDOWN" | "RESOURCE_SHORTAGE";
  scope: "learn" | "use" | "training"; sourceId?: string;
  playerText: string; recoverable: boolean;
}
```

Thứ tự ổn định: learned → realm → path/Fate → guild/faction → target/cooldown → resource. API giữ code kỹ thuật; UI dùng playerFacingReason.

### Recheck khi state đổi

| Sự kiện | Tính lại | Giữ nguyên | Hiệu lực |
|---|---|---|---|
| Equip/unequip Fate | resonance + Fate requirement | technique progress | cast kế tiếp |
| Đổi path | use eligibility + affinity | ownership/mastery | dormant/blocker nếu lệch |
| Đổi realm | min/max realm | mọi progress | mở/khóa tạm |
| Join/rank/leave/suspend môn | policy snapshot + guild requirement | ownership/mastery | access/bonus tức thì |
| Đổi phe tà | tainted faction requirement | guild membership | faction blocker riêng |
| Luân Hồi | transfer policy/preview | chỉ record được giữ | không kế thừa guild bonus ngầm |

Character generator cấp starter techniques qua originGrant có audit source; grant phải gọi cùng validator ở chế độ khởi tạo, không được mở lỗ hổng cho learn API thông thường.

## Migration, validator và API triển khai

- Optional fields/defaults có thể không tăng save version; action ledger hoặc cross-system semantics mới phải ghi featureVersions.techniqueCrossSystem=1.
- Migration chỉ tạo field rỗng/default, không reward, không tăng mastery/trial.
- Unknown requirement key: catalog diagnostic; production fallback neutral nhưng dev/regression gate fail.
- Unknown evolution/policy save: giữ raw progress, modifier dormant, migration note; không xóa mastery.
- Catalog validator kiểm tra IDs technique/path/Fate/guild/rank/element, realm range, target dương, cap hữu hạn, không NaN/modifier lỗi.
- State validator kiểm tra progress range, event/action ID unique và bounded, ready đạt target, chosen có evolution hợp lệ, membership rank hợp lệ, snapshot không stale.

```js
buildTechniqueContext(state, options)
techniqueEligibility(state, techniqueId, scope, context)
techniqueFateResonance(state, technique, context)
guildTechniqueSnapshot(state, technique, context)
resolveTechnique(state, techniqueId, options) // pure
commitTechniqueResolution(state, resolution, options)
recordTechniqueTrialEvent(state, event)
transitionGuildMembership(state, nextMembership, reason)
validateTechniqueCrossSystemCatalog()
validateTechniqueCrossSystemState(state)
```

Engine sở hữu eligibility, cost/effect resolver và transaction. Expansion sở hữu policy catalog, event producers và membership hooks. UI chỉ render preview DTO rồi gửi stance/target/action ID. Không tính cost/rank/resonance trong UI.

## Acceptance matrix

### 1 — Fate resonance

- Hai Fate equipped cùng element = +2%; duplicate ID chỉ +1%; cap +5%.
- Fate trong kho, suppressed hoặc unknown element không cấp bonus.
- Preview và hit dùng cùng coefficient; thay Fate giữa preview/commit buộc resolve lại.
- generates/overcomes không cho bonus ngoài policy.

### 2 — Preview/commit

- Preview và receipt cast khớp cả ba stance.
- Invalid stance, resource thiếu, cooldown, target sai: resource/cooldown/mastery không đổi.
- Retry action ID không lặp cost/effect; SAN=0 trả committed outcome rõ.
- Evolution/Fate/guild/weather đúng thứ tự, mỗi nguồn đúng một lần.

### 3 — Guild policy

- Nonmember/suspended/rank thấp không nhận modifier/teaching.
- Rank change invalidates snapshot tức thì.
- Leave thu hồi quyền lợi nhưng giữ skill/mastery/evolution.
- Rejoin không nhận one-time grant hai lần; pending training xử lý qua receipt.

### 4 — Trial

- Event lặp không tăng; sai type/preview/fail không tăng.
- Hai elite encounter ID khác nhau tăng đúng 2; gọi producer lặp cho một encounter vẫn tăng 1.
- Progress không vượt target, ready/chosen không tăng tiếp.
- Save/load giữ idempotency và ledger bounded.

### 5 — Eligibility

- Learn/use/training được kiểm tra riêng; catalog cũ không khai báo rule vẫn tương thích.
- requiredFaction vẫn là phe tà; guild kiểm tra riêng.
- Đổi path/Fate/realm/membership tạo blocker/dormant nhưng không xóa record.
- Legacy và unknown requirement save round-trip an toàn, có diagnostic.
- Starter grant có provenance và không bypass learn API.

### End-to-end

Tạo nhân vật → học từ Tông Môn → tăng mastery → mở trial → nhận event duy nhất → chọn evolution → equip/unequip Fate → preview/cast ba stance → lên/xuống hạng/rời môn → đổi path/realm → save/load/luân hồi preview. Không mất mastery, không giữ bonus guild khi hết tư cách và không cộng trùng Fate/evolution.

## Quyết định cần review

1. Duyệt resonance +1%/Fate cùng nguyên tố, cap +5%, chỉ combat.
2. Duyệt guarded giảm SAN/Corruption cost, chưa giảm incoming damage/risk.
3. Chọn bật ba guild policy mẫu hay chỉ dựng framework trước khi cân bằng.
4. Duyệt rằng guild restriction chỉ ongoing nếu được khai báo trong useRequirements; mặc định skill đã học không tự khóa.
5. Duyệt ledger 64 event/action IDs, migration rỗng và không cấp bù.

### Runtime update — 2026-09-22

Đã áp dụng:

- Fate resonance đọc element canonical của Fate đang kích hoạt, loại trừ Mệnh còn bị Trấn Mệnh và cap ở +5% combat power.
- Stance được chọn trước khi xác nhận; preview hiển thị cost theo stance và dự báo sát thương. Preview và cast gọi chung combat projection cho mastery, evolution, nguyên tố, resonance, world modifier, stance và matchup.
- Có catalog heavenly treasure riêng trong expansion data; map event hiện hữu lấy loại/niên đại từ catalog. Claim có receipt và validator kiểm tra ID, stat whitelist, amount, bảng niên đại/trọng số và multiplier.
- Có catalog guild technique policies. MVP áp dụng mastery bonus giới hạn cho technique do đúng Tông Môn truyền thụ; snapshot đọc membership/rank hiện tại và membership revision tăng khi join/leave/promotion.
- Trial evolution lưu eventKeys bounded, target rõ, deduplicate theo action/encounter ID, cap progress và validate ngưỡng.
- Evaluator điều kiện learn/use/training hỗ trợ realm, path ID/tag, Fate ID/element/số Mệnh, guild/rank, faction tà, forbidden knowledge và vị trí luyện tập. Kỹ năng đã học không bị xóa khi tạm mất điều kiện.

Implementation update (2026-09-22): combat resonance now counts unique active, unsuppressed Fate IDs and shares one +5% cap between canonical same-element and explicit path-affinity matches. Guild-taught formations snapshot their source guild; an active formation grants +5% combat power only for an active disciple-rank-or-higher member, with the policy sourced and capped by catalog. Eligibility rechecks unique active Fate requirements and suspended membership; preview/cast share the technique cost resolver. UI-generated technique action IDs carry a monotonic sequence and save a high-water mark, so an evicted receipt cannot be replayed. Legacy saves without that marker retain neutral behavior and learned progress.

Cập nhật 2026-09-22: runtime resonance, quyền lợi trận pháp và replay guard đã được áp dụng; xem phụ lục triển khai cuối tài liệu. Trạng thái regression suite được xác nhận riêng theo lượt chạy mới nhất.
