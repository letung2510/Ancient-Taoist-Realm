# GAPS — SỔ ĐĂNG KÝ LOGIC CHƯA HOÀN THIỆN VÀ QUYẾT ĐỊNH CẦN CHỐT

## Đã có runtime và đã được regression

- Mệnh inventory/active, affinity và resolver effect cơ bản.
- Con Đường/path ritual, nghề chính/nghề ẩn lock và Dị Thể state nền.
- Map node/sub-location, cosmic map view, fog/completion signal và travel guard nền.
- World simulation weather/faction/NPC context, NPC weather narrative cùng scene.
- Novel log boundary, command echo filter, scene batching và stat separation.
- Save migration, IndexedDB archive retry và các test matrix hiện hành.

## Current gap snapshot — 2026-10-05

### Confirmed schema/API decisions — P0 closure

- `professionState.hiddenId` is the canonical hidden-profession slot identifier. `professionState.secondaryId` and `player.hiddenProfession` remain synchronized compatibility aliases; a hidden profession may not occupy `primaryId`.
- Hidden-profession runtime state is separate from the slot: `hiddenProfessionState` owns clues, unlocks, attempts, branches and failures. `hiddenProfessionGraph` owns the versioned discovery graph. Neither replaces `professionState.hiddenId`.
- The canonical MAP influence surface is `computeMapInfluence`/`resolveMapInfluence`; owner, zone status, structure preview and faction-territory petition are adapters over that resolver and must not calculate a second gradient.
- `Truyền Tống Trận` uses runtime type `waystation` and compatibility input alias `teleport_array`; `Hộ Giới Đại Trận` uses `ward_formation` and alias `world_ward`. The registry, build/repair/upgrade/dismantle runtime and UI preview consume the same definitions.
- `ERROR_NARRATIVE_MAP` is the only player-facing translation layer for canonical producer codes. Producers may return codes, but formatted novel logs must not expose implementation identifiers.

This is the active register. Older P0/P1 lists below are retained as roadmap
history and must not be read as fresh runtime findings.

### Logic/product work still open

- P1 Fate Phase 3 is production runtime: fixed costs/windows, namespace
  isolation, save round-trip and cap/cooldown rejection are covered by the
  review-batch fixture.
- NPC scheduler, needs/congestion/topology and witness/rumor producers are
  covered by the world/deep producer matrices; only browser presentation
  evidence remains separate.
- Weather catalog, severity thresholds, shelter transitions and hysteresis
  durations are data-driven and pass the world producer/review matrices.
- Deterministic replay now covers a 1,000-day fixture with seeded war,
  contested-opportunity resolution, hidden-realm enter/claim/exit and auction
  bid state, in addition to character and offline replay.
- UI view-model/static/variant/browser contract gates pass; real-browser visual
  regression and native file chooser persistence remain incomplete evidence.

### P2–P4 verification status — 2026-10-05

- B.2–B.10 runtime surfaces have canonical exports and passing targeted
  matrices: progression, world, expansion stress, deterministic character
  replay, technique channel, completion tasks, browser contract, UI variants
  and log producers.
- B.11 offline/static parity is closed; native chooser import/export and full
  responsive visual evidence remain open because the connector rejects file
  injection.
- The aggregate register is therefore `ĐÃ SỬA` for runtime/testable P1–P4
  surfaces and `SỬA MỘT PHẦN` for browser/platform evidence; it is not a claim
  that every historical requirement row has independent fixture coverage.

### Evidence/data work still open

- `OPEN-01`: native file chooser import/export evidence is blocked by the
  connector permission.
- `OPEN-02`/`OPEN-03`: full browser click-through, responsive and reload
  persistence evidence is not covered by headless tests.
- `OPEN-05`: independent asymmetric-route, fallback-realm and orphan-loot
  data audit is not complete.
- Requirement encoding cleanup is still blocked in the three canonical files
  reported by `validate_requirement_docs.js`; the validator intentionally fails
  until the lost source text is restored.

The current snapshot does not reopen runtime items already closed by the audit,
offline parity, save-envelope validation, or UI/action contract gates.

## Historical roadmap — former P0

1. Chuẩn hóa một API influence gradient duy nhất, nối heatmap, travel weighting, fog và structure eligibility.
2. Hoàn thiện `Công Trình` registry/runtime/UI cho Truyền Tống Trận và Hộ Giới Đại Trận.
3. Chốt schema duy nhất cho `hiddenProfession`, `professionState.hiddenId` và save legacy.
4. Mở rộng `ERROR_NARRATIVE_MAP`/fallback coverage và audit mọi producer log cũ.

## Historical roadmap — former P1

1. Fate Phase 3: Nghịch Mệnh, Trấn Mệnh, Thiên Cơ, Mệnh Đổi.
2. NPC scheduler nhu cầu/congestion, movement topology, witness/rumor propagation.
3. Weather catalog đầy đủ và severity/hysteresis data-driven.
4. Deterministic replay cho war, contested opportunity, hidden realm, auction.
5. UI view model audit và visual regression.

## Current decisions and residual risks

The seven rows below are no longer competing requirements. Their first
column is the canonical product decision; the last column records migration,
coverage, or balance work that may remain. None of these rows authorizes a
second namespace or an unapproved runtime policy.

- Path and profession remain separate namespaces; legacy aliases are migration
  input only.
- Main/secondary profession selection is stateful and must not be reopened by
  legacy UI paths.
- Dị Thể remains a physique/mutation system, separate from path and profession.
- Fate relationship decay is `decayPolicy: "none"`; Vault time does not mutate
  relationship state.
- Influence is resolved through the canonical gradient; owner is derived from
  thresholds, not a second source of truth.
- Công Trình belongs to the Thế Giới surface; unresolved cost/durability
  values are balance work, not a schema conflict.
- Narrative and stat output remain separate, with legacy history handled by
  migration/projection.

| Chủ đề | Quyết định hiện tại | Rủi ro |
|---|---|---|
| Con Đường vs Nghề | namespace tách hoàn toàn | save cũ còn alias lẫn nhau |
| Nghề chính/phụ | chọn nghề chính khóa nghề thường ngay; nghề ẩn là slot phụ | UI cũ có thể cho chọn lại |
| Dị Thể | lớp thân thể/dị hóa, không phải path/profession | catalog effect chưa đủ |
| Mệnh relationship decay | chưa tự giảm nếu chưa chốt policy | lâu dài có thể quá mạnh |
| Influence | gradient canonical, owner chỉ là kết quả/threshold | API cũ còn rời rạc |
| Công Trình | feature trong tab Thế Giới | cost/durability chưa chốt |
| Log | narrative riêng, stat riêng, group theo scene | legacy history cần migration |

## Quy tắc bổ sung feature mới

Feature mới chỉ được merge khi có: catalog schema, state schema, resolver API, action transaction, UI DTO, log narrative/stat, save migration, cross-system impact, invariant, test và mục note chưa hoàn thiện.

## Definition of done cho catalog này

- Một người mới chỉ đọc thư mục này có thể biết feature nằm ở đâu, state nào, gọi resolver nào, action nào, UI nào và save/migration ra sao.
- Mọi feature đều ghi rõ phụ thuộc và gap.
- Không dùng tên Con Đường cho Nghề, không dùng Dị Thể cho Mệnh hoặc Nghề Ẩn.
- Mọi claim “ĐÃ CODE” phải đối chiếu runtime/test; phần chưa chắc phải ghi **MỘT PHẦN** hoặc **THIẾT KẾ**.
