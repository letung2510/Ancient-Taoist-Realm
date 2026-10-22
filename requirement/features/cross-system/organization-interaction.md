# Cross-system — Tương tác tổ chức

## Mục đích

Mọi tông môn, thế gia, thương hội, vương triều, liên minh và tổ chức bí mật là tác nhân có quan hệ, tài nguyên, chính sách và phản ứng — không chỉ là dữ liệu hiển thị hay điều kiện gia nhập. Quan hệ người chơi–tổ chức độc lập với membership ([guild-membership.md](guild-membership.md)).

> Nguồn: hệ thống tương tác tổ chức trong archive bị mất dấu tiếng Việt ngay từ commit đầu; nội dung dưới đây được viết lại theo đúng nghĩa bản gốc và đối chiếu runtime `organizationInteract`.

## Dữ liệu & trạng thái

```js
state.organizationState = {
  version: 1,
  relations: { [organizationId]: {
    organizationId, reputation /* -100..100 */, favor /* 0..100 */, trust /* 0..100 */,
    heat /* 0..100 */, status: "neutral"|"friendly"|"allied"|"distrusted"|"hostile",
    servicesUnlocked: [], lastInteractionDay } },
  activeRequests: { [requestId]: { id, organizationId, tier: "common"|"special"|"life_death",
    regionId, createdDay, expiresDay, status: "open"|"ready"|"completed"|"failed"|"expired",
    targetProgress, progress, qualifyingActions: ["move","search","combat"], warId,
    lastProgressTurn, lastProgressDay, resolvedDay, outcome } },
  specialCommissions: { ["<orgId>:<tháng>"]: count },
  history: [] /* giữ 100 */
}
```

`organizationId` là ID canonical của `GUILDS` hoặc `WORLD_MAP.factions`; không tạo bản sao cho cùng một tổ chức. Định nghĩa tổ chức (danh tính, alignment, vùng, trait, dịch vụ, hồ sơ node) khai báo một lần trong catalog; save chỉ giữ `organizationId` và record quan hệ.

## Rules

### API và quan hệ

| ID | Rule |
|---|---|
| CSX-ORG-001 | `organizationSnapshot(state, organizationId)` đọc, không mutate. `organizationInteract(state, organizationId, action, amount)` trả `{ success, reason, data }`. |
| CSX-ORG-002 | Sau migration mọi tổ chức trong catalog đều có record quan hệ; giá trị bị clamp vào khoảng ở schema; `servicesUnlocked` khử trùng. Quan hệ không mất khi rời tông môn hay reload. |
| CSX-ORG-003 | Trạng thái quan hệ tính lại sau mỗi thay đổi theo thứ tự: `heat ≥ 60` → `hostile`; `reputation ≥ 50` và `trust ≥ 40` → `allied`; `reputation ≥ 20` → `friendly`; `reputation ≤ −30` → `distrusted`; còn lại `neutral`. |
| CSX-ORG-004 | Tương tác mutate (trừ `status`) yêu cầu tổ chức có địa chỉ node hợp lệ và người chơi đang ở đúng node đó. |
| CSX-ORG-005 | Mỗi tổ chức nhận tối đa một tương tác mutate mỗi ngày game; ngoại lệ: `request_aid` và các loại `commission*`. |

### Hành động

| ID | Action | Điều kiện | Hiệu ứng |
|---|---|---|---|
| CSX-ORG-010 | `status` | — | Trả snapshot |
| CSX-ORG-011 | `donate` (amount mặc định 3, tối thiểu 1) | Đủ Linh Thạch | Trừ Linh Thạch = amount; reputation +amount, favor +⌈amount/2⌉, trust +1 |
| CSX-ORG-012 | `request_aid` | favor ≥ 10 | favor −10, nhận vật phẩm viện trợ (Bồi Nguyên Đan ×1) |
| CSX-ORG-013 | `share_intel` | Có tình báo chưa dùng | Tình báo → `spent`; reputation +5, trust +8, favor +2 |
| CSX-ORG-014 | `commission` / `commission_special` / `commission_life` | Không có ủy thác cùng tầng đang `open`/`ready`; đặc biệt tối đa 2/tổ chức/tháng; sinh tử chỉ khi tổ chức là faction đang trực tiếp tham chiến | Tạo request (mục tiêu 2/4/5, hạn 7/15/10 ngày); reputation +2/+4/+6, favor +1/+3/+3, trust +2/+4/+4 |
| CSX-ORG-015 | `mediate` | Tổ chức là faction và reputation ≥ 10 | reputation +3, trust +5, favor +2 |

### Ủy thác

| ID | Rule |
|---|---|
| CSX-ORG-020 | Tiến độ ủy thác tăng 1 khi người chơi làm action thuộc `qualifyingActions` (di chuyển/tìm kiếm/combat) trong đúng vùng của request, tối đa một lần mỗi lượt; đủ mục tiêu → `ready` kèm câu kể nhắc trở về giao. |
| CSX-ORG-021 | Giao ủy thác phải ở node tổ chức và request `ready`; thưởng qua receipt canonical: thường EXP 30, công lao 4, contribution 8, Linh Thạch 3; đặc biệt EXP 80, công lao 12, contribution 25, Linh Thạch 8 + một Mệnh theo tiến trình (phẩm ≤ min(4, tầng tu vi + 1)); sinh tử EXP 140, công lao 20, contribution 50, Linh Thạch 15. |
| CSX-ORG-022 | World tick đánh dấu request quá hạn `expired`/`failed` một cách idempotent. Ủy thác sinh tử thất bại áp CSX-TG-09; chiến tranh liên quan kết thúc trước khi giao → thất bại. |

### Hiệu ứng liên hệ thống

| ID | Rule |
|---|---|
| CSX-ORG-030 | Reputation mở khóa tin đồn, giảm giá và tiếp viện; favor dùng cho viện trợ, hộ tống, truyền tống nhanh hoặc dự án tông môn; heat cao làm tổ chức thù địch, tăng tuần tra và phong tỏa. |
| CSX-ORG-031 | Quyên góp/ủy thác cập nhật tài nguyên thế lực và ảnh hưởng bản đồ; điều đình cập nhật ngoại giao/ổn định/sẵn sàng chiến tranh của thế lực. |
| CSX-ORG-032 | Dự án tông môn, Đại Hội, khế ước và phản ứng NPC đọc cùng record quan hệ; bảng tin hiển thị theo chủ thế lực và reputation của người chơi. |
| CSX-ORG-033 | Log tương tác là câu kể tiểu thuyết (UI-LOG-030…036): không lộ tọa độ, mã trạng thái (`hostile`…) hay số liệu trong câu; số liệu vào `statDisplay`. |

## Acceptance

- Mọi guild/faction có record sau migration; không trùng organizationId trong catalog.
- Quyên góp, viện trợ, ủy thác, tình báo, điều đình tạo thay đổi state đo được; tương tác thứ hai trong ngày bị từ chối (trừ ngoại lệ).
- Request được resolve idempotent ở world tick; reload không mất quan hệ.
- Gate: `verify_review_batches.js`, `verify_world_producer_matrix.js`, `verify_log_producers.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-ORG-001–005, 010–015 | expansion.js:`organizationSnapshot`, `organizationInteract`, `ensureOrganizationState` | Khớp |
| CSX-ORG-020–022 | expansion.js:`advanceOrganizationCommissions`, `resolveOrganizationCommission`, `expireOrganizationCommissions` | Khớp |
| CSX-ORG-030 | expansion.js | Thiếu — chưa thấy giảm giá/tuần tra/phong tỏa theo heat/reputation |
| CSX-ORG-031 | expansion.js:`organizationInteract` (`mediate`, `donate`) | Lệch — chỉ đổi record quan hệ, không đổi tài nguyên/ổn định thế lực |
| CSX-ORG-033 | expansion.js:`organizationInteract` (log "tại tọa độ x, y", "trạng thái hostile") | Lệch — lộ tọa độ và mã trạng thái |
