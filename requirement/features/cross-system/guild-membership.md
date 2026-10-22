# Cross-system — Công Pháp × Tông Môn × Nhân vật: vòng đời membership và grant

## Mục đích

Hợp đồng chuyển trạng thái thành viên tông môn và hệ quả lên quyền dùng Công Pháp, kho tông môn, giảng dạy, grant khởi đầu và Luân Hồi. Rule thuần Công Pháp tương ứng ở [technique](../technique/README.md) (TEC-120…128, TEC-057, TEC-059, TEC-063). Quan hệ xã hội với tổ chức (độc lập membership): [organization-interaction.md](organization-interaction.md).

## Dữ liệu & trạng thái

| Thành phần | Nội dung |
|---|---|
| `state.guildMembership` | `guildId, rankIndex, rankId, rank, status: "active" \| "suspended" \| "departed", joinedDay, contribution, revision` |
| `state.guildMembershipHistory[]` | `{ day, from, to, reason }`, giữ 50 bản gần nhất |
| Receipt grant | Khóa vĩnh viễn theo `member + guild + grantId` |

## Rules

| ID | Rule |
|---|---|
| CSX-TG-01 | Gia nhập/rời/thăng/giáng/đình chỉ/phục hồi/thử thách trung thành đều đi qua `transitionGuildMembership(state, nextMembership, { reason, expectedGuildId })`: validate membership/rank, transaction đang chờ và policy; `expectedGuildId` lệch → `GUILD_VERSION_CONFLICT`; ghi transition đúng một lần vào `guildMembershipHistory` (giữ 50). |
| CSX-TG-02 | Mỗi transition tăng `membership.revision` **bên trong** `transitionGuildMembership` và invalidate snapshot Công Pháp tông môn; refresh chỉ số dẫn xuất nhưng không grant trùng, không xóa mastery/tiến hóa. |
| CSX-TG-03 | Rời/bị đình chỉ thu hồi ngay quyền truy cập Công Pháp tông môn, kho và giảng dạy. Trận pháp đã đặt chạy tới hết hạn theo record nhưng không đặt mới và mất bonus Tông Môn. Thành viên `departed` vẫn giữ quyền sở hữu/mastery Công Pháp đã học nhưng bị khóa dùng theo policy. |
| CSX-TG-04 | Rời tông môn: training đang chờ bị hủy và hoàn theo receipt; dự án tông môn xử lý theo [CSX-PRJ-003](faction-war-and-structures.md); transaction đã commit giữ nguyên. |
| CSX-TG-05 | Grant `oncePerMember` có receipt vĩnh viễn theo member + guild; gia nhập lại không cấp lại trừ khi policy khai báo cooldown/regrant. |
| CSX-TG-06 | Character generator cấp Công Pháp khởi đầu qua `originGrant` có nguồn audit, dùng cùng validator ở chế độ khởi tạo (TEC-057). |
| CSX-TG-07 | Luân Hồi: chỉ record mà transfer policy cho giữ mới được chuyển; có preview ([CSX-LGC-005](tribulation-and-reincarnation.md)); không kế thừa ngầm bonus tông môn. |
| CSX-TG-08 | Thiên tài địa bảo có catalog riêng trong data expansion; map event lấy loại/niên đại từ catalog; nhận có receipt; validator kiểm ID, whitelist stat, lượng, bảng niên đại/trọng số và multiplier. |
| CSX-TG-09 | Thất bại ủy thác sinh tử (hết hạn, bỏ dở hoặc chiến sự kết thúc trước khi giao) của chính tông môn mình giáng một chức vị trong `ORG_RANKS` qua `transitionGuildMembership` (`reason: "commission_failure"`) và ghi log cảnh báo. |

## Acceptance

- Transition với `expectedGuildId` sai bị từ chối, history không đổi; transition hợp lệ tăng revision đúng 1.
- Rời rồi gia nhập lại không nhận lại grant `oncePerMember`.
- Gate: `verify_technique_channel_matrix.js`, `verify_review_batches.js`, `verify_character_generator_replay.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-TG-01 | expansion.js:`transitionGuildMembership` | Khớp |
| CSX-TG-02 | expansion.js:`transitionGuildMembership` (không tăng `revision`); engine.js:`joinGuild`, `leaveGuild`, promotion/demotion tự tăng | Lệch — revision tăng ở caller; đình chỉ/phục hồi chưa chắc tăng |
| CSX-TG-03 | expansion.js:`guildTechniqueCombatBonus`, `guildVaultSnapshot`, `validateTechniqueCrossSystemState` | Khớp |
| CSX-TG-04 | expansion.js: membership hooks | Thiếu — chưa có hoàn training theo receipt |
| CSX-TG-05 | — (`oncePerMember` không có trong runtime) | Thiếu |
| CSX-TG-06 | engine.js: opening plan → `learnTechnique` (không có `originGrant`) | Lệch — thiếu nguồn audit `originGrant` (xem TEC-063) |
| CSX-TG-07 | — | Thiếu |
| CSX-TG-08 | data/expansion_data.js, expansion.js (heavenly treasure) | Khớp |
| CSX-TG-09 | expansion.js:`promoteAfterFailedLifeCommission` | Khớp |
