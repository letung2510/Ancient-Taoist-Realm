# Mệnh Số — Save, migration và regrade

## Mục đích

Shape lưu Mệnh Số trong save v13, luật migration save cũ, và chính sách thay đổi catalog đã sở hữu (regrade).

## Dữ liệu & trạng thái

```js
character.fate = {
  equippedIds, vaultIds, vaultCapacity,
  total, normal, ratioR, debt, surplus,
  excessEssence, instances, pacts, enhancements,
  relationships, evolutions, advancedActions
}
character.fateRuntime = { instances, defiance, suppressed, omenCooldownUntil }
character.hiddenFates, hiddenProfessionCandidate, hiddenProfession
state.pendingFateReward, state.pendingFateRewards
state.meta.uniqueFateOwnership, state.meta.fateCatalogVersion = "v1-regraded-phase3",
state.meta.fateMigration.phase3Regrade = "phase3-20260908"
```

## Rules

### FATE-SAVE-001 Round-trip
Serialize/deserialize giữ nguyên: active, kho, capacity, pending, enhancement, `fateInstances`, `fateRelationships` (kể cả history, `decayPolicy`), `fateEvolutions`, `fateAdvancedActions`, `fateDefiance`, `suppressedFates`, cooldown Thiên Cơ, Tinh Hoa Dư. Adapter v13 `fate.vaultIds` ↔ `state.fateInventory`.

### FATE-SAVE-002 Migration save cũ
- Thiếu mảng/object → khởi tạo rỗng.
- Tham chiếu Mệnh dạng chỉ số mảng (legacy) đổi sang ID qua `canonicalFateId`.
- Khi hydrate state: loại ID trùng và ID không có trong catalog khỏi active/kho kèm cảnh báo; một ID chỉ ở một nơi (ưu tiên active).
- Active vượt `activeSlots` → Mệnh cuối bị chuyển lên đầu kho; không mất Mệnh.
- Mệnh thiếu instance được tạo instance `source: "save cũ"`.
- `relationshipStage`/`relationshipPoints` cũ đọc thành `stage`/`points`.
- Save đang giữ Mệnh Tiên được ghi chủ vào `uniqueFateOwnership` (grandfather).
- Save v12 đi qua migration tương thích lên v13.

### FATE-SAVE-003 Bất biến ID
Không đổi, xóa hoặc tái sử dụng `id` đã có. Không xóa entry đang được tham chiếu bởi active, kho, pending, quest, combo, fusion, quan hệ hoặc hidden fate.

### FATE-SAVE-004 Regrade có kiểm soát
Mọi thay đổi grade catalog phải đi qua manifest (`id`, `oldGrade`, `newGrade`, `reason`, `affectedSystems`, `rollbackGrade`) với snapshot checksum SHA-256, chạy trên bản sao, deterministic seed, ưu tiên entry chưa sở hữu và không có combo/fusion/hidden/resonance; regenerate hoặc migrate quan hệ theo tier mới; dừng nếu mất ID, sai quota, đổi stats ngoài manifest hoặc Tiên bị nhân bản. Rollback: tắt cờ, khôi phục catalog/save từ snapshot hoặc chạy reverse manifest. Không chạy trực tiếp trên working tree.

### FATE-SAVE-005 Quyền lợi khi regrade
Mặc định grandfathering: instance đã sở hữu giữ `effectiveGradeAtAcquisition`; catalog mới áp cho lần roll sau. Không trộn chính sách trong cùng một world; không giảm âm thầm quyền lợi Mệnh đang active.

### FATE-SAVE-006 Catalog versioning
Nếu cần thay nội dung lớn mà vẫn giữ save cũ: dùng catalog v1/v2 song song (`state.meta.fateCatalogVersion`), ID v1 không tái sử dụng cho nghĩa mới.

## Acceptance

- Load save rỗng, save cũ, save có active/kho/pending, save có duplicate và save có `than_dao_151` đều không mất dữ liệu.
- `tools/verify_save_envelope.js` và `tools/verify_review_batches.js` (round-trip namespace) đạt.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| FATE-SAVE-001 | `js/engine.js:toCanonicalCharacter`, `fromCanonicalCharacter`, `serialize` (`version: 13`), `deserialize` | Khớp |
| FATE-SAVE-002 | `js/engine.js:canonicalFateId`, `deserialize` (repair fates/pending/instances/uniqueFateOwnership) | Lệch — ID không có trong catalog bị lọc bỏ không ghi cảnh báo |
| FATE-SAVE-004 | `fate_system_update/phase3_regrade.js`, `fate_regrade_manifest.json` | Khớp |
| FATE-SAVE-005 | `js/engine.js` instance metadata | Thiếu — chưa có field `effectiveGradeAtAcquisition` |
