# Ma trận bằng chứng 33 mục — 2026-09-16

Đây là audit hiện trạng sau các đợt coding. `ĐÃ CODE` chỉ có nghĩa runtime chính đã có; mục chỉ được nâng thành `ĐÃ HOÀN TẤT` khi đủ UI, migration và regression đúng phạm vi.

| # | Trạng thái hiện tại | Bằng chứng chính | Phần còn thiếu / gate |
|---:|---|---|---|
| 1 | ĐÃ CODE | `mapInfluenceSnapshot`, fog/completion/travel/construction dùng resolver; player/faction structure, event influence, cache invalidation và offline round-trip có test | Browser visual QA |
| 2 | ĐÃ CODE | build/repair/upgrade/disable/transfer, UI Thế giới, structure history | Benchmark UI và cân bằng resource |
| 3 | ĐÃ CODE | `chooseProfessionLocked`, namespace primary/secondary/hidden, save normalization | Audit mọi producer alias còn lại |
| 4 | ĐÃ CODE MỘT PHẦN | canonical log renderer, error narrative map, narrative lint; static audit `tools/verify_log_producers.js` đạt 66/66 producer literal | Browser visual QA và audit các producer động/ngoài `engine.js` + `expansion.js` |
| 5 | ĐÃ CODE | namespace Fate phase 3, advanced action records và effect-layer contract | Browser card/rollback failure UI QA |
| 6 | ĐÃ CODE | `decayPolicy: none`, không tick decay; regression 120 ngày giữ nguyên stage/XP/points | Browser hiển thị lịch sử dài ngày |
| 7 | ĐÃ CODE | base/enhancement/relationship/evolution/suppression/advanced breakdown; preview/commit evolution deep-equal regression | Audit browser hiển thị từng layer |
| 8 | ĐÃ CODE | UI definition/instance, history relationship/resonance | Visual QA browser |
| 9 | ĐÃ CODE MỘT PHẦN | node history/completion có sub-location/structure/faction/actor/weather, retention 50 và UI “Dấu vết gần đây tại node” | Coverage từng producer/action và browser visual QA |
| 10 | ĐÃ CODE | travelPlan dùng distance/weather/danger/war/contested/ward/anchor; engine movement dùng cùng resolver và OXY canonical | Fast travel/route UI browser QA |
| 11 | ĐÃ CODE MỘT PHẦN | weather catalog/alias/severity/history/default duration/transition pool/resolver; World UI hiển thị severity, ngày hết hạn và 5 chuyển đổi gần nhất | Browser kiểm tra đầy đủ transition/fog/NPC surface |
| 12 | ĐÃ CODE | war outcome/cascadeApplied, faction/map cascade và seeded world tick | UI chiến tuyến/chi tiết mặt trận còn cần browser QA |
| 13 | ĐÃ CODE | NPC edge scheduler, needs, shelter/travel states, deterministic node capacity queue | Dedicated queue/interact UI và actor benchmark |
| 14 | ĐÃ CODE MỘT PHẦN | rumor confidence/expiry/priority/source ledger, một hop mỗi tick, relay multi-node; canonical `factionBulletin` projection và UI panel đã nối | Browser/content QA và faction-specific balance |
| 15 | ĐÃ CODE | relationship dimensions + companion contract/ledger/recovery | Actor simulation benchmark |
| 16 | ĐÃ CODE | technique DTO và recipe transaction canonical | Snapshot catalog tĩnh mở rộng |
| 17 | ĐÃ CODE | Dị Chí state machine/UI statuses, tách khỏi path/profession/Di Thể | Visual QA từng trạng thái |
| 18 | ĐÃ CODE | contested expiry trước reward, hidden realm enter/exit/reward receipt; offline expiry regression | Offline cycle đầy đủ cho mọi reward branch |
| 19 | ĐÃ CODE | action priority resolver, pending/combat gates, regression | Duplicate listener browser QA |
| 20 | ĐÃ CODE | legacy deterministic ID/statDisplay/schema normalization | Multi-version fixture rộng hơn |
| 21 | ĐÃ CODE MỘT PHẦN | replay RNG cho map/search/loot/cultivation/combat/breakthrough/market; procedural item ID dùng seed + state sequence; character creation/factory nhận injected RNG; đã có deep-equal discovery, combat transcript và character-creation replay | Random producer độc lập ngoài state còn lại và audit toàn bộ producer `Math.random()` |
| 22 | ĐÃ CODE MỘT PHẦN | influence cache revision + runtime metrics/profile gate | Browser/device profiling |
| 23 | ĐÃ CODE MỘT PHẦN | Dị Thể catalog có trigger/threshold/stage/branch/benefit/stageEffects/endingTags/factionAffinity/cost/exclusions; modifier stage-aware, `specialPhysiqueOutcome` resolver và save regression | Catalog mở rộng và balance |
| 24 | ĐÃ CODE | structure cost/durability/repair/upgrade/transfer/dismantle, 40% level-scaled refund, history retention | Balance audit và browser confirmation |
| 25 | ĐÃ CODE | ward influence/danger/SAN effects, player/faction ownership, invalidation; regression active > disabled và repair tái kích hoạt | Browser/UI score matrix |
| 26 | ĐÃ CODE | reward ledger/source receipts cho quest (EXP/Công Đức/Linh Thạch/Fate/Công Pháp), contract/realm/opportunity/collection, world event, tournament, war, prisoner, auction, companion scout, tomb, legacy và companion release | Catalog balance/pity policy và audit reward producer ngoài canonical expansion |
| 27 | ĐÃ CODE MỘT PHẦN | history 300/100 retention, IndexedDB retry queue; large-save profile đạt 3,750,755 bytes dưới baseline localStorage 5MB | Browser quota thực tế và archive benchmark IndexedDB lớn |
| 28 | ĐÃ CODE MỘT PHẦN | runtime budget snapshot + Node profile; influence average 0.138ms, cache metrics và save-size profile | FPS thiết bị yếu |
| 29 | ĐÃ CODE | Fate relationship không decay | Long-day regression |
| 30 | ĐÃ CODE MỘT PHẦN | Path/Profession/Di Thể namespace tách riêng; explicit secondary path transition/cost/save regression | Fusion-specific affinity cap, content và ending balance |
| 31 | ĐÃ CODE MỘT PHẦN | Dị Thể là modifier/branch riêng, stage-aware, có endingTags/factionAffinity metadata, outcome projection và claim guard đọc exclusions theo path/profession | Exclusion content và balance |
| 32 | ĐÃ CODE MỘT PHẦN | ownerType/ownerId/transferHistory + NPC transfer; world UI có tháo dỡ structure, lập trạm và petition faction | Browser UI QA, faction petition content/balance |
| 33 | ĐÃ CODE MỘT PHẦN | `offlinePolicy` canonical: aggregate phần cũ, actor-level 30 ngày cuối với `actorHistorySnapshot`, `lastOfflineAudit`, mode/idempotency và stress 30/60 ngày | Browser save/load lớn, thiết bị yếu và nội dung lịch sử actor ngoài projection |

## Batch 17 evidence

- Discovery lifecycle now has the canonical `discoveryStatusSummary(state)` read model
  with global/category counters, invalid-status normalization and monotonic transition
  semantics. The Dị Thể UI shows the four lifecycle totals; regression checks summary,
  category projection and rollback rejection.
- Remaining gates for item 17 are limited to browser visual QA and content/balance review.

## Batch 18 evidence

- Node-history regression now covers sub-location, structure, faction, actor, weather
  and completion event types, duplicate-key idempotency, required day/region metadata
  and the 50-entry retention boundary.

## Batch 19 evidence

- Profession namespace migration now normalizes legacy hidden-primary/hiddenId/player
  aliases into the canonical hidden secondary slot, filters normal-profession aliases,
  mirrors compatibility fields and preserves hidden IDs deterministically. Regression
  covers repeated normalization and invalid legacy secondary data.

## Batch 20 evidence

- Dị Thể now has `validateSpecialPhysiqueCatalog()` enforcing required identity,
  progression, stage-effect, ending, affinity, cost and exclusion fields. Deep
  regression verifies every catalog entry before stage/outcome tests.

## Batch 21 evidence

- Hộ Giới Đại Trận now applies its canonical `sanDrainReduction` through the world
  modifier resolver; disabling a structure writes node history and invalidates influence.
  Deep regression verifies active ward SAN protection alongside corruption/encounter effects.

## Batch 22 evidence

- Log producer audit now scans every `js/*.js` source for literal history/event producers,
  while runtime expansion matrix covers concatenated messages. Results remain 66/66 and
  43/43 with mapped/unmapped internal-code fallback checks green.

## Batch 23 evidence

- Runtime profile now measures grouped novel-log rendering after a 360-event retention
  stress. It verifies non-empty same-day paragraphs and a 100ms render budget in addition
  to map/NPC/offline/save budgets.

## Batch 24 evidence

- Map V2 now exposes `validateMapCoordinates(state)` for missing/out-of-bounds/duplicate
  coordinates and influence fails closed instead of treating invalid nodes as `[0,0]`.
  Regression validates the complete current node pool and the canonical influence DTO.

## Batch 25 evidence

- Travel preview/commit now share the exported canonical resolver with weather/ward/world
  modifiers, deterministic party size/weight, effective speed, risk and game-day output.
  Regression checks solo, companion party and committed-plan parity.

## Batch 26 evidence

- Periodic online Fate rewards now use canonical reward receipts keyed by absolute day,
  including pending-vault handling and replay idempotency. Regression verifies duplicate
  day processing does not add another Fate.

## Batch 27 evidence

- Offline actor projection regression now advances 35 days, verifies the 30-day bounded
  history and `lastOfflineAudit.targetDay`, then checks exact save round-trip preservation.

## Batch 28 evidence

- Tainted faction reward payloads now use the canonical reward ledger with an explicit
  `taintedRewards` namespace. Regression verifies receipt creation, flag/currency update
  and replay idempotency without double-incrementing Heaven Merit.

## Batch 16 evidence

## Batch 29 evidence

- Character creation now routes every random branch through an injected RNG;
  the only direct entropy call is the explicit `defaultRandom` boundary.
  Static audit covers all three known runtime producers and a dedicated
  deep-equal character replay regression passes.

## Batch 30 evidence

- Random boundary audit now discovers every `js/*.js` source dynamically in
  addition to the root runtime generators, so a newly added direct
  `Math.random()` producer cannot be silently omitted from the gate.

## Batch 31 evidence

- Added `verify_ui_surface_contract.js` and its canonical requirement. The gate
  verifies tab/script ordering, World/Dị Thể surfaces, map influence/fog/
  completion/route climate signals, structure/node-history rendering,
  progression namespace labels, delegated actions, save/render hooks and grouped
  novel-log consumption. The remaining browser gate is explicitly retained.

## Batch 32 evidence

- Added catalog/balance validators for Path fusion and Dị Thể. The regression
  now enumerates all path pairs against the affinity cap `0.75`, validates path
  terms/titles, checks Dị Thể threshold/effect/affinity ranges, and preserves
  claim/stage/outcome/save coverage.

## Batch 33 evidence

- Added `validateWorldCatalogs()` for weather transitions/severity/duration,
  profession recipes and the four canonical map-structure costs/effects. Deep
  regression now runs this validator alongside structure lifecycle, weather,
  Path fusion and Dị Thể tests.

- Randomness is centralized into explicit entropy boundaries; static audit
  `verify_random_boundaries.js` covers engine and procedural item generator,
  while replay/character tests cover injected deterministic RNG.

## Batch 15 evidence

- Runtime budget now measures map influence, NPC view and offline catch-up;
  profile exercises all paths and large-save retention in one gate.

## Batch 14 evidence

- Unknown internal log codes now receive a meaningful neutral narrative
  fallback; mapped codes still use `ERROR_NARRATIVE_MAP`. Narrative regression
  covers both paths.

## Batch 13 evidence

- Player-facing tab and error fallback now use Dị Thể; UI regression strips HTML
  comments and asserts the legacy Dị Chí label is absent from visible output.

## Batch 12 evidence

- Path fusion now persists a lead/support affinity profile with effective cap
  `0.75`; `verify_review_batches.js` checks commit and save round-trip.

## Regression hiện đã có

- `verify_review_batches.js`
- `verify_companion_runtime.js`
- `verify_indexeddb_archive.js`
- `verify_dichi_deep.js`
- `verify_expansion_log_matrix.js` — 43/43
- `verify_log_narrative.js`
- `verify_expansion_stress.js`
- `profile_runtime_budget.js`
- Batch 5 additions in `BATCH_5_RUNTIME_CANONICAL_STATUS_2026-09-16.md`: travel preview/commit, rumor relay/expiry, NPC queue, Fate evolution invariant, quest reward ledger and secondary Path transition.
- Batch 6 additions in `BATCH_6_RUNTIME_UI_STATUS_2026-09-16.md`: NPC queue/rumor UI, node-history UI, Nghề Ẩn slot guard and player-log grouping/error regression.
- Offline simulation contract in `04-interaction/OFFLINE_WORLD_SIMULATION_CANONICAL_2026-09-16.md`: aggregate/actor-window policy, audit receipt and repeated-target idempotency.
- Batch 7 additions in `BATCH_7_OFFLINE_LOG_DITHE_STATUS_2026-09-16.md`: offline 30/60-day gate, combat transcript replay, canonical novel grouping, weather view model, Dị Thể stage effects and disabled-structure reactivation.

## Quy tắc chuyển trạng thái

## Batch 34 evidence

- `ensureExpansionState()` normalizes legacy reward receipts and
  `validateExpansionState()` enforces reward, weather, NPC retention and actor
  history invariants. Game, review-batch, expansion-stress and IndexedDB archive
  regression remain green.

## Batch 35 evidence

- Corrupt/legacy reward receipts are now quarantined with their original
  payload preserved instead of being deleted. Regression covers deserialize,
  preservation and post-migration state validation.

## Batch 36 evidence

- Fate advanced actions now share one canonical namespace and effect resolver.
  Nghịch Mệnh, Trấn Mệnh, Thiên Cơ and Mệnh Đổi are separated from
  enhancement/relationship/evolution effects; canonical serialize/deserialize
  preserves the action ledger and regression verifies suppression and replay.

## Batch 37 evidence

## Batch 38 evidence

## Batch 39 evidence

- Performance budget now distinguishes the measured Node/runtime baseline
  (`offlineAverageMs < 500` for a 30-day actor window) from the still-pending
  weak-device browser FPS gate. The profile passes with map cache, save-size,
  history-retention and novel-log measurements.

- Added `canonicalHiddenProfessionId()` as the runtime read boundary. Legacy
  `player.hiddenProfession` remains a compatibility mirror only; path/trial/
  victory guards now resolve canonical secondary profession first. Regression
  covers canonical and legacy fallback states.

- Runtime performance profiling now separates VM warm-up from steady-state
  offline catch-up. Three consecutive profile runs passed with offline average
  below 250ms, map influence cache metrics, save-size and novel-log budgets.

Không chuyển mục sang `ĐÃ HOÀN TẤT` chỉ vì resolver tồn tại. Cần bổ sung test đúng nhánh, kiểm tra save round-trip, UI nếu có bề mặt người chơi và kiểm tra không phát sinh log kỹ thuật. Ma trận này phải được cập nhật sau mỗi batch.
# Batch 40 — Technical token sanitization (2026-09-17)

- Mục liên quan: #4 — novel-style log.
- Đã bổ sung boundary sanitization cho `internal`, `debug`, `raw`, `payload`, `field_name`, `undefined`, `null` và regression producer trực tiếp.
- Requirement/schema bổ sung: `requirement/07-ui/LOG_TECHNICAL_TOKEN_SANITIZATION_2026-09-17.md`.
- Verification: `node tools/verify_log_narrative.js`, `node tools/verify_log_producers.js`, `node tools/verify_expansion_log_matrix.js` đều PASS.
- Còn mở: browser visual QA/pixel-level log panel; các mục content/UX khác vẫn giữ trạng thái partial theo gate hiện hành.
# Batch 53 — Relationship dimensions policy (2026-09-17)

- Added canonical relationship policy/validator for trust, fear, respect, suspicion, loyalty and derived score.
- Explicitly separates NPC `event_only` policy from Fate `none` decay policy.
- Requirement bổ sung: `requirement/05-operations/RELATIONSHIP_DIMENSIONS_POLICY_2026-09-17.md`.
- Regression verifies event idempotency, policy, score and save round-trip.

# Batch 52 — War front and rumor bulletin view-model (2026-09-17)

- Added `warFrontSnapshot()` and `rumorBulletinSnapshot()` canonical read models.
- Expansion summary now exposes `warFronts` and `rumorBulletin`; UI/runtime can consume status, score, cascade, source and expiry without raw-state inference.
- Requirement bổ sung: `requirement/04-interaction/WAR_FRONT_RUMOR_BULLETIN_VIEWMODEL_2026-09-17.md`.
- Regression adds war-front cascade/outcome DTO checks and retains offline/rumor determinism coverage.

# Batch 51 — Structure influence effect schema (2026-09-17)

- Structure catalog now owns type effects; build merges canonical effects into runtime records.
- Added validation for effect object/max level/refund range; influence resolver remains active-only and revision-invalidated.
- Requirement bổ sung: `requirement/03-world/STRUCTURE_INFLUENCE_EFFECT_SCHEMA_2026-09-17.md`.
- Regression retains active/disabled/repair influence and save/offline lifecycle coverage.

# Batch 50 — Canonical reward policy / pending Fate vault (2026-09-17)

- Chốt duplicate=`reject`, pity=`none`, Fate vault full=`pending_vault`, replay=`idempotent`.
- Added `rewardPolicySnapshot()`/`validateRewardPolicy()` and receipt audit fields `policy`/`pendingFateCount`.
- Requirement bổ sung: `requirement/06-expansion/REWARD_POLICY_PITY_AND_PENDING_VAULT_2026-09-17.md`.
- Regression reward ledger/quest/online Fate/tainted reward tiếp tục pass.

# Batch 49 — UI view-model and action delegation regression (2026-09-17)

- UI contract now checks all four Dị Thể/discovery lifecycle states, exactly one delegated tab-content click listener, serialized action queue and engine priority guard.
- Requirement bổ sung: `requirement/07-ui/UI_VIEWMODEL_ACTION_DELEGATION_REGRESSION_2026-09-17.md`.
- `verify_ui_surface_contract.js` PASS; review/game regressions continue to pass legacy log/action priority coverage.
- Pixel-level browser QA remains explicitly separate.

# Batch 48 — Dị Thể effect/exclusion schema (2026-09-17)

- Validator now rejects unknown Dị Thể effect/benefit keys and malformed exclusion entries.
- Claim resolver checks primary/secondary Con Đường and all canonical Nghề slots against explicit catalog exclusions.
- Requirement bổ sung: `requirement/02-progression/DITHE_CATALOG_EFFECT_EXCLUSION_SCHEMA_2026-09-17.md`.
- Deep regression continues to validate catalog, stage effects, modifiers, outcome and save round-trip.

# Batch 47 — Canonical structure catalog (2026-09-17)

- Added `STRUCTURE_CATALOG` and `structureCatalog()` for build/repair/upgrade/refund parameters.
- Structure creation now rejects types missing from the canonical catalog; world catalog validation derives costs from it.
- Requirement bổ sung: `requirement/03-world/STRUCTURE_CATALOG_BALANCE_SCHEMA_2026-09-17.md`.
- Regression adds catalog assertions and retains full structure lifecycle/influence tests.

# Batch 46 — Replay and cache invariants (2026-09-17)

- Mở rộng `validateExpansionState()` để kiểm tra map influence revision/cache và metric counters.
- Requirement bổ sung: `requirement/08_DATA_REPLAY_CACHE_INVARIANTS_2026-09-17.md`.
- Regression map invalidation + serialize/offline round-trip và dynamic random-boundary audit tiếp tục pass.
- Các producer random hiện đã qua centralized allowance; gate còn lại là browser/device profiling thực tế.

# Batch 45 — Weak-device performance profiles (2026-09-17)

- Added pure `resolvePerformanceProfile()` and runtime `performanceProfile()` with standard/weak/reduced budgets.
- Main render applies the profile to story-window sizing and root diagnostic attribute; gameplay/save logic is unaffected.
- Requirement bổ sung: `requirement/08_DATA_RUNTIME_PERFORMANCE_PROFILE_2026-09-17.md`.
- Regression verifies capability selection, budget ordering and runtime state application.
- Remaining gate: real browser/device FPS benchmark.

# Batch 44 — Archive retention and durable IndexedDB retry (2026-09-17)

- Archive log đã chuyển từ queue-clear giả lập sang IndexedDB object store `events` thật, có transaction put, `archivedAt`, retry khi open/transaction lỗi và API đọc gần nhất.
- Requirement bổ sung: `requirement/07-ui/ARCHIVE_RETENTION_AND_QUOTA_CONTRACT_2026-09-17.md`.
- Regression archive đã xác nhận failure injection → retry → event persistence; profile vẫn kiểm tra 300 history và save payload dưới 5 MB.
- Gate còn mở chỉ là quota/FPS/visual QA trên browser/device thật.

# Batch 43 — Reward producer canonical audit (2026-09-17)

- Quest reward contribution double-application was fixed at the engine/expansion boundary.
- Requirement bổ sung: `requirement/06-expansion/REWARD_PRODUCER_CANONICAL_AUDIT_2026-09-17.md`.
- Regression now checks quest EXP/merit/currency/item/contribution idempotency across repeated objective evaluation.
- Repeatable combat/search/craft outputs are explicitly separated from one-time canonical receipts.

# Batch 42 — Node/weather/rumor history invariant (2026-09-17)

- Bổ sung `validateNodeHistory()` kiểm tra metadata bắt buộc, duplicate key và retention 50 record.
- Requirement bổ sung: `requirement/03-world/NODE_WEATHER_RUMOR_HISTORY_COVERAGE_2026-09-17.md`.
- Regression `testNodeHistoryProjection()` đã kiểm tra đủ producer-type đại diện, idempotency, retention và metadata.
- Mục 9/11/14 được củng cố ở data invariant; browser visual/content balance vẫn là gate riêng.

# Batch 41 — Chốt policy các mục 29–33 (2026-09-17)

- Đã chốt và code policy quan hệ Mệnh không decay, tối đa 2 Con Đường, Dị Thể chỉ loại trừ theo catalog, ownership Công Trình explicit và offline NPC aggregate + actor window.
- Runtime mới: `designPolicySnapshot()` và `validateDesignPolicies()`; migration bổ sung mode/resolution/retention cho `offlinePolicy`.
- Requirement bổ sung: `requirement/01-core/UNRESOLVED_PRODUCT_POLICIES_DECIDED_2026-09-17.md`.
- Verification: regression `testUnresolvedDesignPoliciesAreCanonical()` trong `verify_review_batches.js`.
- Còn mở: tuning balance, browser visual QA và các gate nội dung/UX; policy không còn ở trạng thái CHƯA CHỐT.
