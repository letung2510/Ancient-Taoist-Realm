# Khám phá — Bí cảnh & khám phá nhiệm vụ

## Mục đích

Vòng đời Bí cảnh (Hidden Realm) gắn với world tick/offline và cách nhiệm vụ được khám phá. Trạng thái nhiệm vụ/hội thoại NPC thuộc [npc](../npc/README.md); world tick thuộc [world-simulation](../world-simulation/README.md).

## Dữ liệu & trạng thái

- `worldSimulation.hiddenRealms[id] = { id, cycleIndex, status: sealed/omen/open, opensDay, closesDay, claimedRewardKeys[], competitorProgress }`.
- `questState` (`available`, `active`, `completed`, `failed`).

## Rules

| ID | Rule |
|---|---|
| DSC-HR-001 | Hết hạn chu kỳ Bí cảnh được xử lý bởi cùng world tick dùng cho offline catch-up. Sau `closesDay`, runtime không còn `open` và core reward không thể nhận. |
| DSC-HR-002 | Core reward chỉ phát một lần mỗi key `hidden_realm:<realmId>:<cycleIndex>:main` (RWD-LED-005); key đã nhận lưu ở `claimedRewardKeys` (không trùng). |
| DSC-QST-001 | Nhiệm vụ có thể được khám phá theo dạng explicit, dynamic, NPC-derived hoặc hidden-world. Nhiệm vụ hidden không xuất hiện trong danh sách nhiệm vụ thường cho tới khi manh mối của nó được `verified`. |
| DSC-QST-002 | Hội thoại nhiệm vụ dùng chỉ số nhân vật sẵn có (tư chất, ngộ tính, SAN, tà nhiễm, danh tiếng phe) làm skill check; không tạo hệ chỉ số song song. |
| DSC-QST-003 | Trạng thái nhiệm vụ, objective, nhánh, phương án thay thế, hậu quả, hạn và reward receipt là state canonical, không chỉ là text trong log. |

## Acceptance

- `verify_review_batches.js`: tạo chu kỳ mở, vào Bí cảnh, chạy offline 3 ngày qua hạn → chu kỳ đóng, nhận thưởng bị từ chối, validator runtime pass.
- Nhiệm vụ hidden chỉ hiện sau khi manh mối verified; skill check đọc chỉ số hiện có.

## Runtime mapping

| Rule | File:symbol | Trạng thái | Ghi chú |
|---|---|---|---|
| DSC-HR-001 | expansion.js: world tick hidden realm (`closesDay`, status theo ngày), `claimHiddenRealmCore` (`status !== "open"` → từ chối) | Khớp | |
| DSC-HR-002 | expansion.js:`claimHiddenRealmCore`, `validateHiddenRealmRuntimeState` (`claimedRewardKeys` unique) | Khớp | |
| DSC-QST-001 | expansion.js: `questState` | Thiếu | không thấy cờ hidden/clue-gate trong quest state |
| DSC-QST-002, 003 | expansion.js: `acceptNpcQuest`, `npcQuestStatus`, `validateNpcQuestState` | Thiếu | không thấy skill check/branch/alternative trong quest resolver |
