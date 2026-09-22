# Äáº·c táº£ liÃªn káº¿t CÃ´ng PhÃ¡p Â· Má»‡nh Sá»‘ Â· NhÃ¢n Váº­t Â· TÃ´ng MÃ´n

**Tráº¡ng thÃ¡i:** Ä‘áº·c táº£ review; runtime Ä‘Ã£ Ã¡p dá»¥ng cÃ¡c pháº§n Ä‘Æ°á»£c liá»‡t kÃª á»Ÿ cuá»‘i tÃ i liá»‡u.
**NgÃ y:** 2026-09-22
**Pháº¡m vi:** nÄƒm gap 1â€“5 trong rÃ  soÃ¡t runtime. Bá»• sung hÃ nh vi liÃªn feature; khÃ´ng thay schema save hiá»‡n cÃ³ hoáº·c tá»± chá»‰nh catalog Ä‘Ã£ sá»Ÿ há»¯u.

## Má»¥c tiÃªu vÃ  nguyÃªn táº¯c chung

Má»i luá»“ng há»c, xem trÆ°á»›c, thi triá»ƒn, luyá»‡n thÃ nh vÃ  tiáº¿n hÃ³a CÃ´ng PhÃ¡p dÃ¹ng cÃ¹ng ngá»¯ cáº£nh nhÃ¢n váº­t vÃ  cÃ¹ng phÃ©p tÃ­nh. Má»‡nh Ä‘ang kÃ­ch hoáº¡t, con Ä‘Æ°á»ng, cáº£nh giá»›i, mastery, evolution vÃ  tÆ° cÃ¡ch TÃ´ng MÃ´n chá»‰ tÃ¡c Ä‘á»™ng khi cÃ³ rule cá»¥ thá»ƒ. Modifier cÃ³ nguá»“n truy váº¿t, giá»›i háº¡n, khÃ´ng sá»­a catalog vÃ  khÃ´ng cá»™ng kÃ©p qua computeStats láº«n cast resolver.

1. **Catalog báº¥t biáº¿n:** resolver Ä‘á»c theo ID; modifier lÃ  snapshot cá»§a action, khÃ´ng ghi ngÆ°á»£c vÃ o technique catalog, dá»¯ liá»‡u Má»‡nh hay CONG_PHAP_DATA.
2. **Má»™t nguá»“n sá»± tháº­t:** preview vÃ  commit gá»i cÃ¹ng resolver thuáº§n. Commit lÃ m má»›i context vÃ  kiá»ƒm tra tÃ i nguyÃªn trÆ°á»›c transaction.
3. **Chá»‰ Má»‡nh kÃ­ch hoáº¡t cá»™ng hÆ°á»Ÿng:** Fate trong kho, Ä‘Ã£ gá»¡, bá»‹ phong áº¥n hay khÃ´ng cÃ²n thuá»™c sá»Ÿ há»¯u khÃ´ng tÄƒng hiá»‡u quáº£. UI nÃªu Fate nguá»“n.
4. **Quyá»n lá»£i mÃ´n phÃ¡i khÃ´ng pháº£i quyá»n sá»Ÿ há»¯u:** rá»i mÃ´n khÃ´ng xÃ³a CÃ´ng PhÃ¡p/mastery/trial/evolution; chá»‰ access, truyá»n thá»¥, kho vÃ  modifier Ä‘ang cáº¥p bá»‹ thu há»“i.
5. **KhÃ´ng tá»± há»§y tiáº¿n trÃ¬nh:** Ä‘á»•i path, cáº£nh giá»›i hoáº·c membership khÃ´ng xÃ³a record. Ká»¹ nÄƒng cÃ³ thá»ƒ thÃ nh dormant/blocked kÃ¨m lÃ½ do, rá»“i hoáº¡t Ä‘á»™ng láº¡i khi Ä‘á»§ Ä‘iá»u kiá»‡n.
6. **Idempotency:** cÃ¹ng actionId/eventId khÃ´ng thá»ƒ trá»« tÃ i nguyÃªn, tÄƒng mastery/trial hay phÃ¡t thÆ°á»Ÿng láº§n hai.
7. **Thá»© tá»±:** base catalog â†’ mastery â†’ evolution â†’ Má»‡nh cá»™ng hÆ°á»Ÿng â†’ snapshot TÃ´ng MÃ´n â†’ world/combat â†’ stance. Má»—i nhÃ³m cá»™ng pháº§n trÄƒm ná»™i bá»™ rá»“i nhÃ¢n má»™t láº§n; cap Ã¡p dá»¥ng theo nhÃ³m.

## Context vÃ  response dÃ¹ng chung

buildTechniqueContext(state, options) lÃ  hÃ m thuáº§n, chá»‰ chuáº©n hÃ³a vÃ  Ä‘á»c:

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

Save cÅ© thiáº¿u field dÃ¹ng trung tÃ­nh: null, [], rankIndex 0, revision 0. Context khÃ´ng gá»i RNG, khÃ´ng sá»­a state/catalog. Káº¿t quáº£ resolver:

```ts
TechniqueResolution {
  ok: boolean; techniqueId: string; actionId: string | null;
  blockers: Blocker[]; sources: ModifierSource[];
  costs: { qi: number; stamina: number; san: number; lifespan: number; corruption: number };
  effect: { powerCoefficient: number; cooldownTurns: number; secondary: Record<string, number> };
  snapshotKey: string;
}
```

Response clone/Ä‘Ã³ng bÄƒng; khÃ´ng tráº£ tham chiáº¿u nested tá»›i save hay catalog.

---

## 1. Má»‡nh Sá»‘ â†’ CÃ´ng PhÃ¡p: cá»™ng hÆ°á»Ÿng nguyÃªn tá»‘ vÃ  con Ä‘Æ°á»ng

### Gap vÃ  rule

Combat hiá»‡n dÃ¹ng chuá»—i fateTags Ä‘á»ƒ suy ra nguyÃªn tá»‘. Tag chá»§ Ä‘á» khÃ´ng pháº£i element canonical, dá»… bá» sÃ³t Má»‡nh cÃ³ field element, nháº§m alias hoáº·c Ä‘áº¿m Fate dormant. Nguá»“n chuáº©n pháº£i lÃ  fateDefinition/fateElement/fatePathAffinity vÃ  technique catalog.

- Chuáº©n hÃ³a, khá»­ trÃ¹ng láº·p ID tá»« player.fates; chá»‰ xÃ©t Fate Ä‘ang kÃ­ch hoáº¡t, tá»“n táº¡i trong catalog vÃ  khÃ´ng bá»‹ suppress.
- Äá»‘i chiáº¿u canonical element cá»§a Fate vÃ  technique, khÃ´ng Ä‘á»c tÃªn/mÃ´ táº£/tag tá»± do.
- Element rá»—ng, vo_he, unknown hoáº·c lá»—i dá»¯ liá»‡u cho káº¿t quáº£ neutral.
- Má»—i Fate cÃ¹ng element cho +1% power; cap tá»•ng +5% má»—i cast. Chá»‰ Ã¡p dá»¥ng ká»¹ thuáº­t combat cÃ³ element; passive/support máº·c Ä‘á»‹nh khÃ´ng nháº­n.
- Fate path affinity trÃ¹ng path hiá»‡n hÃ nh vÃ  path affinity cá»§a technique tráº£ thÃ´ng tin resonance trong preview, chÆ°a cá»™ng power á»Ÿ MVP Ä‘á»ƒ trÃ¡nh buff chÆ°a cÃ¢n báº±ng.
- Fate bá»‹ Tráº¥n Má»‡nh khÃ´ng cáº¥p resonance tÃ­ch cá»±c. Relation generates/overcomes khÃ´ng tá»± táº¡o bonus.
- Má»™t Fate chá»‰ Ä‘Ã³ng gÃ³p má»™t láº§n; evolution modifier lÃ  nguá»“n riÃªng, khÃ´ng tÃ­nh láº¡i thÃ nh Fate thá»© hai.

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

Ãp dá»¥ng bonus vÃ o powerCoefficient Ä‘Ãºng má»™t láº§n trÆ°á»›c khi tÃ¡ch damage components. KhÃ´ng mutate Fate, technique catalog, enemy hay player.stats. Preview hiá»ƒn thá»‹ Fate Ä‘Ã£ khá»›p vÃ  tá»•ng bonus; log chá»‰ nÃªu nguá»“n khi bonus >0.

### Bá»• sung schema CÃ´ng PhÃ¡p

```ts
TechniqueDefinition {
  id: string;
  element: CanonicalElement;
  pathAffinity?: string[];
  fateResonance?: { mode: "same_element" | "none" };
}
```

Record cÅ© khÃ´ng cáº§n sá»­a: máº·c Ä‘á»‹nh same_element cho combat technique cÃ³ element, none cho passive/support náº¿u chÆ°a khai bÃ¡o. Má»©c bonus náº±m trong policy versioned, khÃ´ng cho tá»«ng record Ä‘áº·t multiplier tá»± do.

## 2. CÃ´ng PhÃ¡p â†’ NhÃ¢n Váº­t: preview/commit parity

Thay phÃ©p tÃ­nh tÃ¡ch rá»i trong techniquePreview vÃ  useTechnique báº±ng resolver thuáº§n resolveTechnique(state,id,{phase,stance,confirmed,actionId,targetId}). Resolver kiá»ƒm tra ownership, category, realm, path restrictions, cooldown, target, costs vÃ  modifiers; khÃ´ng mutate. commitTechniqueResolution Ã¡p dá»¥ng transaction sau khi xÃ¡c thá»±c láº¡i.

### Stance matrix

| Tháº¿ | Power | SAN | Corruption | Qi/Stamina/Lifespan | Cooldown |
|---|---:|---:|---:|---:|---:|
| steady | Ã—1.00 | Ã—1.00 | Ã—1.00 | Ã—1.00 | Ã—1.00 |
| burst | Ã—1.20 | Ã—1.00 | Ã—1.50 | Ã—1.00 | Ã—1.00 |
| guarded | Ã—0.85 | Ã—0.50 | Ã—0.50 | Ã—1.00 | Ã—1.00 |

ÄÃ¢y lÃ  cÃ¡ch diá»…n giáº£i runtime addendum hiá»‡n hÃ nh: guarded giáº£m SAN/Corruption cost, khÃ´ng giáº£m incoming damage. Náº¿u cáº§n incomingRiskMultiplier cho duel, Ä‘Ã³ lÃ  field/action pipeline khÃ¡c vÃ  chÆ°a báº­t trong MVP.

Cost thá»© tá»± duy nháº¥t: catalog base â†’ mastery cost multiplier â†’ evolution â†’ guild â†’ stance â†’ lÃ m trÃ²n. Qi/stamina dÃ¹ng ceil; SAN/lifespan/corruption lÃ m trÃ²n 2 chá»¯ sá»‘. Preview nÃªu requested/applied corruption náº¿u cháº¡m cap. Power thá»© tá»±: catalog â†’ mastery â†’ evolution â†’ Fate â†’ guild â†’ world â†’ stance â†’ matchup. Percent trong cÃ¹ng nhÃ³m cá»™ng rá»“i nhÃ¢n má»™t láº§n.

### Transaction vÃ  lá»—i

- UI cast báº¯t buá»™c actionId á»•n Ä‘á»‹nh; legacy call Ä‘Æ°á»£c cáº¥p ID tá»« sequence theo lÆ°á»£t, khÃ´ng dÃ¹ng timestamp/random.
- Ledger giá»¯ tá»‘i thiá»ƒu 64 action IDs gáº§n nháº¥t. Duplicate tráº£ receipt cÅ©, khÃ´ng cháº¡y cost/effect láº¡i.
- Validate toÃ n bá»™ blocker/resource/target/cooldown trÆ°á»›c mutation.
- Cast lÃ m SAN vá» 0 lÃ  transaction Ä‘Ã£ commit náº¿u madness Ä‘Æ°á»£c kÃ­ch hoáº¡t; tráº£ committed:true, outcome:madness; khÃ´ng Ä‘á»ƒ caller retry.
- Lá»—i trÆ°á»›c commit khÃ´ng Ä‘á»•i resource/cooldown/mastery.
- Cooldown 0 khÃ´ng lÆ°u record. Vá»›i cooldown >0 dÃ¹ng readyAtTurn; cast Ä‘Æ°á»£c phÃ©p khi turn >= readyAtTurn.
- Mastery tÄƒng má»™t láº§n sau khi outcome Ä‘Æ°á»£c quyáº¿t Ä‘á»‹nh; cast khÃ´ng cÃ³ target khÃ´ng tÄƒng combat mastery náº¿u category cáº§n target.

Preview tráº£ blocker, thiáº¿u bao nhiÃªu resource, cooldown cÃ²n láº¡i, power, costs vÃ  sources. snapshotKey rÃ ng buá»™c technique, character revision, membership revision, equipped Fate IDs vÃ  turn. Náº¿u state Ä‘á»•i trÆ°á»›c click, engine resolve láº¡i; UI xÃ¡c nháº­n láº¡i náº¿u cost/effect Ä‘á»•i.

## 3. CÃ´ng PhÃ¡p â†’ TÃ´ng MÃ´n: catalog quyá»n lá»£i

KhÃ´ng cÃ i rule trong UI hoáº·c ghi Ä‘Ã¨ technique khi join. ThÃªm guildTechniquePolicies:

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

### Ná»™i dung catalog máº«u Ä‘á»ƒ review

| ID máº«u | Scope | Äiá»u kiá»‡n | Hiá»‡u lá»±c Ä‘á» xuáº¥t |
|---|---|---|---|
| guild_common_manual_training | CÃ´ng PhÃ¡p mÃ´n Ä‘Ã£ há»c | membership active | +5% mastery gain |
| guild_inner_manual_training | Ká»¹ thuáº­t Ä‘Æ°á»£c policy liá»‡t kÃª | rank inner+ | tá»•ng guild mastery cap +10% |
| guild_elemental_array_support | tran_phap, element cá»§a mÃ´n | rank core+ vÃ  Ä‘á»‹a bÃ n/resource mÃ´n | +5% power, chá»‰ trong tráº­n phÃ¡p |

ÄÃ¢y lÃ  má»©c balance Ä‘á» xuáº¥t, khÃ´ng pháº£i claim ráº±ng má»i guild hiá»‡n cÃ³ Ä‘á»§ dá»¯ liá»‡u. Chá»‰ seed khi guild/rank/element Ä‘Æ°á»£c xÃ¡c nháº­n; khÃ´ng cáº¥p combat power toÃ n cá»¥c vÃ¬ membership Ä‘Æ¡n thuáº§n. Catalog validator bÃ¡o policy trá» ID/rank/category khÃ´ng tá»“n táº¡i.

### Snapshot vÃ  vÃ²ng Ä‘á»i membership

guildTechniqueSnapshot(state,technique,context) tráº£ guildId, rankId, revision, valid, modifiers, sourceIds, blockers. Member há»£p lá»‡ pháº£i cÃ³ guild ID vÃ  rank trong catalog, status active, khÃ´ng suspended. Rank so qua canonical rank index, khÃ´ng so tÃªn hiá»ƒn thá»‹. KhÃ´ng cache qua turn; revision pháº£i tÄƒng á»Ÿ join/leave/promotion/demotion/suspension/reinstatement.

Teaching cáº§n cÃ¹ng guildId giá»¯a NPC vÃ  membership, NPC cÃ³ quyá»n dáº¡y, technique á»Ÿ vault snapshot, rank Ä‘á»§ vÃ  cost tráº£ Ä‘Æ°á»£c. Quyá»n dáº¡y khÃ´ng tá»± há»c skill.

Join/leave/rank change/loyalty test Ä‘i qua transitionGuildMembership:

1. Validate membership/rank, transaction Ä‘ang chá», vÃ  policy.
2. Ghi transition má»™t láº§n, tÄƒng revision, invalidate snapshot.
3. Refresh derived stats nhÆ°ng khÃ´ng grant trÃ¹ng vÃ  khÃ´ng xÃ³a mastery/evolution.
4. Training pending há»§y/hoÃ n theo receipt; project xá»­ lÃ½ theo SYS-02; transaction committed giá»¯ nguyÃªn.
5. Leave/suspend thu há»“i ngay guild access, vault vÃ  teaching. Formation Ä‘Ã£ Ä‘áº·t cháº¡y Ä‘áº¿n expiry theo record; khÃ´ng cho Ä‘áº·t má»›i.
6. Grant oncePerMember cÃ³ receipt vÄ©nh viá»…n theo member+guild; rejoin khÃ´ng cáº¥p láº¡i náº¿u policy khÃ´ng quy Ä‘á»‹nh cooldown/regrant.

## 4. CÃ´ng PhÃ¡p â†’ Tiáº¿n trÃ¬nh NhÃ¢n Váº­t: evolution trial

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

Giá»¯ catalog techniqueEvolutions Ä‘ang cÃ³. Save cÅ© migrate eventKeys=[] vÃ  target theo rule hiá»‡n hÃ nh (elite 2, cultivation 5); khÃ´ng cáº¥p bÃ¹ progress.

### Event vÃ  idempotency

recordTechniqueTrialEvent(state,{type,eventId,techniqueId,source}) lÃ  producer duy nháº¥t. Trial má»Ÿ khi learned, catalog cÃ³ evolution há»£p lá»‡, mastery Ä‘áº¡t threshold hiá»‡n há»¯u (stage 2), status locked. Má»Ÿ UI/load khÃ´ng tÄƒng progress.

- cultivation: má»™t tick cho action tu luyá»‡n Ä‘Ã£ commit, eventId = cultivationActionId.
- elite: má»™t tick cho encounter elite Ä‘Ã£ káº¿t thÃºc há»£p lá»‡, eventId = combatEncounterId, khÃ´ng pháº£i animation/turn/cast.
- Chá»‰ trial cÃ¹ng type tÄƒng. requiresUse=true báº¯t buá»™c event techniqueId khá»›p.
- Duplicate key no-op; action preview/fail no-op.
- progress = min(target, progress+1); chuyá»ƒn ready vÃ  log Ä‘Ãºng má»™t láº§n khi Ä‘á»§.
- Trial ready/chosen khÃ´ng nháº­n tick thÃªm. Dá»n ledger sau khi hoÃ n táº¥t nhÆ°ng lÆ°u archive/hash bounded Ä‘á»ƒ ngÄƒn replay.
- Event legacy thiáº¿u ID láº¥y tá»« canonical action/encounter sequence, khÃ´ng dÃ¹ng Date.now.

Chá»n branch cáº§n status ready, branch Ä‘Ãºng technique, requirements cÃ²n há»£p lá»‡ vÃ  actionId má»›i. Preview cho before/after, yÃªu cáº§u membership/path/Fate, irreversible vÃ  modifier bá»‹ cap. Náº¿u requirement máº¥t sau khi chá»n, evolution giá»¯ nguyÃªn nhÆ°ng modifier dormancy cho tá»›i khi Ä‘á»§ Ä‘iá»u kiá»‡n; khÃ´ng xÃ³a Ä‘áº§u tÆ°.

## 5. Eligibility liÃªn káº¿t há»c/thi triá»ƒn/luyá»‡n CÃ´ng PhÃ¡p

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

requiredFaction cÅ© tiáº¿p tá»¥c alias cho taintedFactionIds; tuyá»‡t Ä‘á»‘i khÃ´ng map sang guild membership. KhÃ´ng khai bÃ¡o requirements cÃ³ nghÄ©a lÃ  khÃ´ng thÃªm giá»›i háº¡n. fateScope máº·c Ä‘á»‹nh equipped khi rule yÃªu cáº§u Fate, trÃ¡nh Má»‡nh kho cáº¥p buff.

### Scope

- **Learn:** xÃ¡c minh source (grant/loot/teacher), realm, path/Fate/guild/faction vÃ  forbidden knowledge; ghi progress record má»™t láº§n.
- **Use:** learned, realm, ongoing path/Fate/member rules, target, cooldown, cost. Chá»‰ requirement Ä‘Æ°á»£c khai bÃ¡o trong useRequirements lÃ m ongoing restriction.
- **Training:** action Ä‘Ã£ commit, training requirements vÃ  action id chÆ°a dÃ¹ng. Guild mastery policy cÃ³ thá»ƒ Ã¡p dá»¥ng, tá»± tu váº«n cÃ³ base progress.
- Má»—i scope dÃ¹ng cÃ¹ng evaluator, cÃ¹ng blocker shape vÃ  catalog IDs; rule sets cho phÃ©p phÃ¢n biá»‡t Ä‘iá»u kiá»‡n.
- Ká»¹ nÄƒng learned nhÆ°ng khÃ´ng há»£p Ä‘iá»u kiá»‡n use trá»Ÿ thÃ nh derived dormant/blocked; khÃ´ng xÃ³a record/mastery.

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

Thá»© tá»± á»•n Ä‘á»‹nh: learned â†’ realm â†’ path/Fate â†’ guild/faction â†’ target/cooldown â†’ resource. API giá»¯ code ká»¹ thuáº­t; UI dÃ¹ng playerFacingReason.

### Recheck khi state Ä‘á»•i

| Sá»± kiá»‡n | TÃ­nh láº¡i | Giá»¯ nguyÃªn | Hiá»‡u lá»±c |
|---|---|---|---|
| Equip/unequip Fate | resonance + Fate requirement | technique progress | cast káº¿ tiáº¿p |
| Äá»•i path | use eligibility + affinity | ownership/mastery | dormant/blocker náº¿u lá»‡ch |
| Äá»•i realm | min/max realm | má»i progress | má»Ÿ/khÃ³a táº¡m |
| Join/rank/leave/suspend mÃ´n | policy snapshot + guild requirement | ownership/mastery | access/bonus tá»©c thÃ¬ |
| Äá»•i phe tÃ  | tainted faction requirement | guild membership | faction blocker riÃªng |
| LuÃ¢n Há»“i | transfer policy/preview | chá»‰ record Ä‘Æ°á»£c giá»¯ | khÃ´ng káº¿ thá»«a guild bonus ngáº§m |

Character generator cáº¥p starter techniques qua originGrant cÃ³ audit source; grant pháº£i gá»i cÃ¹ng validator á»Ÿ cháº¿ Ä‘á»™ khá»Ÿi táº¡o, khÃ´ng Ä‘Æ°á»£c má»Ÿ lá»— há»•ng cho learn API thÃ´ng thÆ°á»ng.

## Migration, validator vÃ  API triá»ƒn khai

- Optional fields/defaults cÃ³ thá»ƒ khÃ´ng tÄƒng save version; action ledger hoáº·c cross-system semantics má»›i pháº£i ghi featureVersions.techniqueCrossSystem=1.
- Migration chá»‰ táº¡o field rá»—ng/default, khÃ´ng reward, khÃ´ng tÄƒng mastery/trial.
- Unknown requirement key: catalog diagnostic; production fallback neutral nhÆ°ng dev/regression gate fail.
- Unknown evolution/policy save: giá»¯ raw progress, modifier dormant, migration note; khÃ´ng xÃ³a mastery.
- Catalog validator kiá»ƒm tra IDs technique/path/Fate/guild/rank/element, realm range, target dÆ°Æ¡ng, cap há»¯u háº¡n, khÃ´ng NaN/modifier lá»—i.
- State validator kiá»ƒm tra progress range, event/action ID unique vÃ  bounded, ready Ä‘áº¡t target, chosen cÃ³ evolution há»£p lá»‡, membership rank há»£p lá»‡, snapshot khÃ´ng stale.

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

Engine sá»Ÿ há»¯u eligibility, cost/effect resolver vÃ  transaction. Expansion sá»Ÿ há»¯u policy catalog, event producers vÃ  membership hooks. UI chá»‰ render preview DTO rá»“i gá»­i stance/target/action ID. KhÃ´ng tÃ­nh cost/rank/resonance trong UI.

## Acceptance matrix

### 1 â€” Fate resonance

- Hai Fate equipped cÃ¹ng element = +2%; duplicate ID chá»‰ +1%; cap +5%.
- Fate trong kho, suppressed hoáº·c unknown element khÃ´ng cáº¥p bonus.
- Preview vÃ  hit dÃ¹ng cÃ¹ng coefficient; thay Fate giá»¯a preview/commit buá»™c resolve láº¡i.
- generates/overcomes khÃ´ng cho bonus ngoÃ i policy.

### 2 â€” Preview/commit

- Preview vÃ  receipt cast khá»›p cáº£ ba stance.
- Invalid stance, resource thiáº¿u, cooldown, target sai: resource/cooldown/mastery khÃ´ng Ä‘á»•i.
- Retry action ID khÃ´ng láº·p cost/effect; SAN=0 tráº£ committed outcome rÃµ.
- Evolution/Fate/guild/weather Ä‘Ãºng thá»© tá»±, má»—i nguá»“n Ä‘Ãºng má»™t láº§n.

### 3 â€” Guild policy

- Nonmember/suspended/rank tháº¥p khÃ´ng nháº­n modifier/teaching.
- Rank change invalidates snapshot tá»©c thÃ¬.
- Leave thu há»“i quyá»n lá»£i nhÆ°ng giá»¯ skill/mastery/evolution.
- Rejoin khÃ´ng nháº­n one-time grant hai láº§n; pending training xá»­ lÃ½ qua receipt.

### 4 â€” Trial

- Event láº·p khÃ´ng tÄƒng; sai type/preview/fail khÃ´ng tÄƒng.
- Hai elite encounter ID khÃ¡c nhau tÄƒng Ä‘Ãºng 2; gá»i producer láº·p cho má»™t encounter váº«n tÄƒng 1.
- Progress khÃ´ng vÆ°á»£t target, ready/chosen khÃ´ng tÄƒng tiáº¿p.
- Save/load giá»¯ idempotency vÃ  ledger bounded.

### 5 â€” Eligibility

- Learn/use/training Ä‘Æ°á»£c kiá»ƒm tra riÃªng; catalog cÅ© khÃ´ng khai bÃ¡o rule váº«n tÆ°Æ¡ng thÃ­ch.
- requiredFaction váº«n lÃ  phe tÃ ; guild kiá»ƒm tra riÃªng.
- Äá»•i path/Fate/realm/membership táº¡o blocker/dormant nhÆ°ng khÃ´ng xÃ³a record.
- Legacy vÃ  unknown requirement save round-trip an toÃ n, cÃ³ diagnostic.
- Starter grant cÃ³ provenance vÃ  khÃ´ng bypass learn API.

### End-to-end

Táº¡o nhÃ¢n váº­t â†’ há»c tá»« TÃ´ng MÃ´n â†’ tÄƒng mastery â†’ má»Ÿ trial â†’ nháº­n event duy nháº¥t â†’ chá»n evolution â†’ equip/unequip Fate â†’ preview/cast ba stance â†’ lÃªn/xuá»‘ng háº¡ng/rá»i mÃ´n â†’ Ä‘á»•i path/realm â†’ save/load/luÃ¢n há»“i preview. KhÃ´ng máº¥t mastery, khÃ´ng giá»¯ bonus guild khi háº¿t tÆ° cÃ¡ch vÃ  khÃ´ng cá»™ng trÃ¹ng Fate/evolution.

## Quyáº¿t Ä‘á»‹nh cáº§n review

1. Duyá»‡t resonance +1%/Fate cÃ¹ng nguyÃªn tá»‘, cap +5%, chá»‰ combat.
2. Duyá»‡t guarded giáº£m SAN/Corruption cost, chÆ°a giáº£m incoming damage/risk.
3. Chá»n báº­t ba guild policy máº«u hay chá»‰ dá»±ng framework trÆ°á»›c khi cÃ¢n báº±ng.
4. Duyá»‡t ráº±ng guild restriction chá»‰ ongoing náº¿u Ä‘Æ°á»£c khai bÃ¡o trong useRequirements; máº·c Ä‘á»‹nh skill Ä‘Ã£ há»c khÃ´ng tá»± khÃ³a.
5. Duyá»‡t ledger 64 event/action IDs, migration rá»—ng vÃ  khÃ´ng cáº¥p bÃ¹.

### Runtime update â€” 2026-09-22

ÄÃ£ Ã¡p dá»¥ng:

- Fate resonance Ä‘á»c element canonical cá»§a Fate Ä‘ang kÃ­ch hoáº¡t, loáº¡i trá»« Má»‡nh cÃ²n bá»‹ Tráº¥n Má»‡nh vÃ  cap á»Ÿ +5% combat power.
- Stance Ä‘Æ°á»£c chá»n trÆ°á»›c khi xÃ¡c nháº­n; preview hiá»ƒn thá»‹ cost theo stance vÃ  dá»± bÃ¡o sÃ¡t thÆ°Æ¡ng. Preview vÃ  cast gá»i chung combat projection cho mastery, evolution, nguyÃªn tá»‘, resonance, world modifier, stance vÃ  matchup.
- CÃ³ catalog heavenly treasure riÃªng trong expansion data; map event hiá»‡n há»¯u láº¥y loáº¡i/niÃªn Ä‘áº¡i tá»« catalog. Claim cÃ³ receipt vÃ  validator kiá»ƒm tra ID, stat whitelist, amount, báº£ng niÃªn Ä‘áº¡i/trá»ng sá»‘ vÃ  multiplier.
- CÃ³ catalog guild technique policies. MVP Ã¡p dá»¥ng mastery bonus giá»›i háº¡n cho technique do Ä‘Ãºng TÃ´ng MÃ´n truyá»n thá»¥; snapshot Ä‘á»c membership/rank hiá»‡n táº¡i vÃ  membership revision tÄƒng khi join/leave/promotion.
- Trial evolution lÆ°u eventKeys bounded, target rÃµ, deduplicate theo action/encounter ID, cap progress vÃ  validate ngÆ°á»¡ng.
- Evaluator Ä‘iá»u kiá»‡n learn/use/training há»— trá»£ realm, path ID/tag, Fate ID/element/sá»‘ Má»‡nh, guild/rank, faction tÃ , forbidden knowledge vÃ  vá»‹ trÃ­ luyá»‡n táº­p. Ká»¹ nÄƒng Ä‘Ã£ há»c khÃ´ng bá»‹ xÃ³a khi táº¡m máº¥t Ä‘iá»u kiá»‡n.

ChÆ°a báº­t trong MVP: path resonance má»›i hiá»ƒn thá»‹ affinity, chÆ°a cá»™ng power; chÆ°a cÃ³ guild power bonus tráº­n phÃ¡p; chÆ°a cÃ³ má»™t hÃ m resolver bao trÃ¹m toÃ n bá»™ Ä‘iá»u kiá»‡n learn/use/training/cast. RiÃªng cost Ä‘Ã£ dÃ¹ng chung resolver cho preview vÃ  cast. Cast cÃ³ action receipt trong save, giá»¯ tá»‘i Ä‘a 64 action gáº§n nháº¥t; receipt chá»‘ng retry trong save hiá»‡n táº¡i nhÆ°ng khÃ´ng chá»‘ng replay náº¿u táº£i láº¡i save Ä‘Æ°á»£c táº¡o trÆ°á»›c cast. CÃ¡c pháº§n cÃ²n thiáº¿u nÃ y giá»¯ trong Ä‘áº·c táº£ Ä‘á»ƒ review trÆ°á»›c khi má»Ÿ rá»™ng.

ÄÃ£ cháº¡y regression suite: cÃ¡c kiá»ƒm tra gameplay, UI contract, log vÃ  catalog Ä‘á»u pass. Hai gate encoding cÃ²n fail trÃªn hai tÃ i liá»‡u constellation cÅ© Ä‘Ã£ Ä‘Æ°á»£c giá»¯ nguyÃªn theo yÃªu cáº§u; Ä‘Ã¢y khÃ´ng pháº£i file do patch nÃ y sá»­a.
