# Cross-system — Nền tảng chung của hệ mở rộng

## Mục đích

Nguyên tắc kiến trúc, RNG thế giới, pipeline modifier, transaction/idempotency và product policy áp cho mọi tính năng liên feature (SYS-00…SYS-12). Save schema v13 và migration: [data-runtime/save-schema-and-migration](../data-runtime/save-schema-and-migration.md). Đồng hồ/ordinal ngày: [data-runtime/game-clock](../data-runtime/game-clock.md).

## Dữ liệu & trạng thái

| Spec ID | Tính năng | File |
|---|---|---|
| SYS-00 | World Simulation Kernel | [world-kernel-and-events.md](world-kernel-and-events.md) |
| SYS-01 | Dị Triều, thiên tượng, mùa, thời tiết, thiên tai | [world-kernel-and-events.md](world-kernel-and-events.md) |
| SYS-02 | Ngoại giao, chiến tranh, nội bộ thế lực, Đại Hội, Công Trình Tông Môn | [faction-war-and-structures.md](faction-war-and-structures.md), [guild-tournament.md](guild-tournament.md) |
| SYS-03 | NPC nổi bật, Nhân Duyên có ký ức, truyền thư, truy nã | [npc-memory-mail-bounty.md](npc-memory-mail-bounty.md) |
| SYS-04 | Tiến hóa Công Pháp, khung Nghề | [technique-and-profession-evolution.md](technique-and-profession-evolution.md) |
| SYS-05 | Khế ước, bắt sống, thẩm vấn, tình báo, thân phận giả | [contract-capture-intel.md](contract-capture-intel.md) |
| SYS-06/07 | Vật phẩm thức tỉnh, di truyền, đấu giá; thuần hóa Dị Thú | [item-legacy-auction-companion.md](item-legacy-auction-companion.md) |
| SYS-08/09 | Sổ khám phá, xem quẻ, sổ sinh tồn, dấu vết; cơ duyên tranh chấp, Bí Cảnh Ẩn | [discovery-and-hidden-realm.md](discovery-and-hidden-realm.md) |
| SYS-10/11 | Thiên Kiếp cá nhân hóa; di sản Luân Hồi, mộ tiền kiếp | [tribulation-and-reincarnation.md](tribulation-and-reincarnation.md) |
| SYS-12 | Tiến hóa Mệnh Số | [fate-evolution.md](fate-evolution.md) |

## Rules

### Kiến trúc

| ID | Rule |
|---|---|
| CSX-FND-001 | Game là single-player, thế giới theo từng save. "Toàn server" trong tài liệu cũ nghĩa là "toàn thế giới của save hiện tại". Không backend, leaderboard hay sở hữu chung. |
| CSX-FND-002 | `js/engine.js` (và expansion) sở hữu rule và transaction; `js/ui.js` chỉ render; `js/main.js` chỉ điều phối event/render/save. |
| CSX-FND-003 | Không tạo combat/map/quest/inventory thứ hai. Nội dung mới mở rộng bằng data template, không hard-code riêng cho từng tông môn/NPC/Mệnh. |
| CSX-FND-004 | Mọi thay đổi sức mạnh đi qua resolver tập trung; preview UI gọi đúng resolver của runtime. |
| CSX-FND-005 | Mô phỏng dùng ngày game, deterministic, catch-up có giới hạn; không `Math.random()` trong world tick (xem DATA-VAL-006). |

### RNG và modifier

| ID | Rule |
|---|---|
| CSX-FND-010 | `worldRandom(state, scopeKey, dayOrdinal, rollIndex = 0) → [0,1)`, seed từ `worldSimulation.seed + scopeKey + dayOrdinal + rollIndex`. Cùng save, cùng ngày, cùng scope → cùng kết quả. `nextEventSeq` chỉ commit sau khi instance tạo thành công. |
| CSX-FND-011 | `getWorldModifiers(state, context)` trả `cultivationMult, combatPowerByElement, encounterChanceMult, searchRiskDelta, searchRewardMult, marketPriceMult, sanDrainMult, travelRiskDelta, tags`; `context` = `regionId, locationId, activity, element, entityId`. Thứ tự hợp nhất: mùa → thời tiết → sự kiện vùng → chiến tranh → trận pháp. |
| CSX-FND-012 | Trần: multiplier tổng 0.50–2.00; delta xác suất −0.30…+0.30; SAN multiplier 0.50–2.00; giá 0.60–2.50. |

### Transaction

| ID | Rule |
|---|---|
| CSX-FND-020 | Hàm resolve trả `{ success, changes, rewards, consequences, history }` (hoặc `{ success, reason, data }` cho command); chi phí chỉ trừ sau validation đầy đủ. |
| CSX-FND-021 | Task/event có `resolvedAtDay` hoặc `processedKey`; load lại không nhận thưởng hai lần. Thưởng đi qua receipt canonical ([reward](../reward/README.md)). |
| CSX-FND-022 | Action nguy hiểm có `requiresConfirmation` (xem [UI-MOD-001](../ui-action-log/modals-and-confirmations.md)). |

### Product policy (mục 29–33)

| ID | Rule |
|---|---|
| CSX-FND-030 | Quan hệ Mệnh `decayPolicy: "none"` — stage/points/history không tự giảm. Quan hệ NPC `event_only` — chỉ đổi qua event/action có nguyên nhân. |
| CSX-FND-031 | Con Đường tối đa 2 slot (chính + phụ); chuyển/dung hợp `explicit_once`, không tự đổi theo modifier; affinity dung hợp trong 0..0.75; trùng path hoặc vượt slot bị validator từ chối. |
| CSX-FND-032 | Dị Thể là modifier theo catalog, exclusion chỉ khi catalog khai báo; không tự khóa Nghề chính, Con Đường, thế lực hay tạo ending ngoài metadata; affinity ending/thế lực chỉ qua outcome của Dị Thể đã nhận. |
| CSX-FND-033 | NPC offline dùng `aggregate_then_actor_window` (xem CSX-WK-020). |
| CSX-FND-034 | `productPolicySnapshot`, `validateProductPolicies` là API canonical; `validateExpansionState` gọi policy validator. |

### Definition of Done của một subsystem

| ID | Rule |
|---|---|
| CSX-FND-040 | Có data schema + validator; default/migration/serialize; rule trong engine và preview cùng resolver; lối vào trên UI/action hiện có; ít nhất một lát cắt dọc chơi được từ trigger tới hậu quả persist; test unit, integration, UI, save round-trip; không backend, không hệ song song; `verify_game.js` và test mới pass. Không sửa test cũ để hợp thức hóa hành vi vi phạm bất biến canonical. |
| CSX-FND-041 | Mô phỏng: 1.000 save × 1.000 ngày — số event, chiến tranh, task NPC, scheduled task có giới hạn; không thế lực nào nuốt toàn bản đồ ở median run khi người chơi không can thiệp; reward/thời gian của nghề, khế ước, sự kiện, đấu giá không vượt baseline kinh tế; không nhánh tiến hóa nào chiếm >60% lựa chọn trong playtest mục tiêu. |
| CSX-FND-042 | Chuỗi tích hợp phải chạy: sự kiện + thời tiết + trận pháp cùng tác động một trận; chiến tranh → khế ước; bắt sống → tình báo; tình báo → mở Bí Cảnh; ký ức NPC đổi hội thoại và điều kiện Neo; Luân Hồi giữa sự kiện thế giới/đấu giá/thư/tù nhân/đồng hành/Bí Cảnh; tiến hóa Mệnh với kho, đổi path, đột phá, Luân Hồi. |

## Acceptance

- Hai bản clone cùng seed/input cho state thế giới giống hệt; modifier preview bằng modifier áp thật.
- Gate: `verify_game.js`, `verify_review_batches.js`, `verify_33_item_coverage.js`, `verify_canonical_contracts.js`, `verify_random_boundaries.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-FND-010 | engine.js/expansion.js:`worldRandom` | Khớp |
| CSX-FND-011/012 | expansion.js:`getWorldModifiers` | Khớp |
| CSX-FND-030–034 | expansion.js:`productPolicySnapshot`, `validateProductPolicies` | Khớp |
