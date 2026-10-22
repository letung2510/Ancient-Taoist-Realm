# Công Pháp — Backlog (chưa phải rule active)

Đề xuất từ bản thiết kế V2, chưa có runtime và chưa được quyết định nào xác nhận. Muốn bật phải chuyển thành rule `TEC-<NHÓM>-NNN` trong file chức năng và ghi vào bảng Quyết định ở [README.md](README.md).

| ID | Đề xuất |
|---|---|
| BL-01 | Hàm `normalizeTechniqueV2`, `techniqueAccessPolicy`, `techniqueCostCalculator`, `techniqueCooldownSnapshot` tách riêng (Phase A–E roadmap V2). |
| BL-02 | Namespace key trong receipt: `profession:<id>:<tid>`, `path:<id>:<tid>`, `hidden_path:<id>:<tid>`, `guild:<id>:<tid>`, `guild_signature:<guildId>`; reward receipt ghi `grantedAtTurn`. |
| BL-03 | Blocker code chi tiết: `TARGET_REQUIRED`, `TARGET_INVALID`, `COMBAT_REQUIRED`, `PREPARATION_ACTIVE`, `PREPARATION_INTERRUPTED`, `TAINTED_PRICE`, `DUPLICATE_ACTION`, tách `RESOURCE_*`. |
| BL-04 | Preview DTO đầy đủ: `cooldown: { turns, remaining, readyAtTurn }`, `target: { required, valid, candidates }`, `action: { phase, canPrepare, canCommit }`. |
| BL-05 | `accessPolicy.realms` theo danh sách cảnh giới, `membership: none/active/rank/taught/signature`, `forbiddenIf: [dead, sealed, departed_source]`, `discovery: { required, clueType }`. |
| BL-06 | `behavior.effects[]` (`{ type, element, coefficient }`), `preparation.channelAction`, `costs.stanceMultipliers` khai báo theo record. |
| BL-07 | `fatePolicy` per-record (`activeOnly`, `suppressedCountsAsResonant`, `maxResonanceSources`, `sameElementMultiplier 1.05`, `opposingElementMultiplier 0.9`, `pathMismatchMultiplier 0.85`) thay cho policy toàn cục. |
| BL-08 | Tà Thần: `taintedPrice`, `corruptionPolicy`, `sanPolicy`, `backfirePolicy`, `knowledgeGate`, curse ledger, faction hostility. |
| BL-09 | `companion` source kind cho skill đồng hành (không cộng build nhân vật). |
| BL-10 | Universal content mẫu: “Dẫn Khí Hồi Nguyên” (phụ trợ hồi Khí, không phải heal miễn phí), “Bộ Bộ Sinh Liên” (thân pháp né/reposition). |
| BL-11 | `ui.icon` asset per technique; `incomingRiskMultiplier` cho thế `guarded` trong duel. |
| BL-12 | Mỗi lần tạo progress lưu `lastUsedTurn`, `branchId`; serialize active effects tạm thời của skill. |
| BL-13 | Combat state theo encounter cho Prepare (`prepareTechnique(state,id,actionId)` chuẩn bị theo encounter, Tâm Pháp modifier preparation) — thiết kế 2026-09 đã bị thay bởi stance per-cast, giữ để tham khảo. |
