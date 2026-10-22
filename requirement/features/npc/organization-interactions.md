# NPC — Tương tác tổ chức (cấp bậc, ủy thác, kế vị, phản đồ, mật khố, hòa giải, thử trung thành)

## Mục đích

Các hệ thống tổ chức mà người chơi tương tác qua NPC: thăng/giáng cấp, ủy thác, chính trị kế vị, phản đồ, mật khố, hòa giải liên minh và thử thách trung thành. Danh tiếng tổ chức (`organizationState.relations[orgId].reputation`, −100..100) thuộc file này.

## Dữ liệu & trạng thái

`state.guildMembership { guildId, rankIndex, rankId, contribution, promotionRetryDay, promotionTrialPassed, defectionPending }`, `state.organizationState { relations, activeRequests, specialCommissions, loyaltyTests }`, `worldSimulation.factionState[id].successionCrisis`, `worldSimulation.mediationAttempts[pairKey]`, `worldSimulation.diplomacy[pairKey].tension`, `state.guildPursuit`.

| Bậc | ID | Cống hiến | Danh tiếng | Cảnh giới tối thiểu | Khảo hạch |
|---|---|---|---|---|---|
| Ngoại Môn | `outer` | 0 | 0 | 2 | — |
| Nội Môn | `inner` | 100 | 10 | 3 | — |
| Chân Truyền Đệ Tử | `disciple` | 300 | 30 | 5 | — |
| Trưởng Lão | `elder` | 800 | 60 | 8 | Có |
| Chưởng Môn | `leader` | 1600 | 80 | 10 | Có |

## Rules

### Cấp bậc

| ID | Rule |
|---|---|
| NPC-ORG-001 | Thứ tự bậc `outer → inner → disciple → elder → leader`. Một resolver `promotionEligibility` kiểm cống hiến, danh tiếng tổ chức, cảnh giới, khảo hạch theo bậc và yêu cầu có mặt tại sơn môn. |
| NPC-ORG-002 | Trưởng Lão/Chưởng Môn cần khảo hạch: điểm = Tư Chất×0.35 + Ngộ Tính×0.35 + Đạo Tâm×0.3 + seeded×25 ≥ 65 (Chưởng Môn 78). Trượt: −20 cống hiến, chờ 7 ngày. |
| NPC-ORG-003 | Thăng bậc chỉ mở sub-location và nội dung tổ chức gắn tag bậc mới. Giáng bậc là sự kiện tường minh có lý do và ngày hiệu lực, đi qua `transitionGuildMembership`. |

### Ủy thác

| ID | Rule |
|---|---|
| NPC-ORG-010 | Ba tầng `common`, `special`, `life_death`; mỗi tầng tối đa một ủy thác `open/ready` mỗi tổ chức. Hạn: 7 / 15 / 10 ngày; tiến độ cần 2 / 4 / 5 hành động hợp lệ (`move`, `search`, `combat`) trong vùng, tối đa 1 tiến độ mỗi lượt. |
| NPC-ORG-011 | `special` tối đa 2 lần mỗi tháng game (30 ngày) mỗi người chơi/tổ chức. `life_death` chỉ khi tổ chức (loại faction) đang trực tiếp tham chiến; gắn `warId`. |
| NPC-ORG-012 | Giao ủy thác phải ở địa điểm tổ chức và trạng thái `ready`. Thưởng: common EXP 30, Công Đức 4, cống hiến 8, Linh Thạch 3; special EXP 80, Công Đức 12, cống hiến 25, Linh Thạch 8 + một Mệnh theo tiến trình; life_death EXP 140, Công Đức 20, cống hiến 50, Linh Thạch 15. Phát một lần qua reward ledger. |
| NPC-ORG-013 | Hết hạn/thất bại settle đúng một lần. `life_death` thất bại, hết hạn hoặc chiến sự kết thúc trước khi giao → giáng một bậc qua sự kiện ghi nhận (`reason: "commission_failure"`). |

### Kế vị

| ID | Rule |
|---|---|
| NPC-ORG-020 | Khủng hoảng kế vị bắt đầu khi người đứng đầu tổ chức còn ≤ 30 ngày thọ nguyên và không có người kế nhiệm chỉ định: tạo một khủng hoảng với ≥ 2 trưởng lão đủ điều kiện (không phải người sắp mất), căng thẳng nội bộ và hạn chót. |
| NPC-ORG-021 | Người chơi chỉ ủng hộ một phe khi đạt bậc Trưởng Lão trở lên. Kết quả đổi người đứng đầu, hướng đi và stability trong một giao dịch world simulation; không có ứng viên → vị trí bỏ trống và stability giảm có giới hạn. |

### Phản đồ

| ID | Rule |
|---|---|
| NPC-ORG-030 | Rời tổ chức A sang đối thủ B cần xác nhận riêng lần hai sau khi hiển thị hậu quả, kể cả danh sách Neo Nhân Tính gắn với A có nguy cơ (cảnh báo trước mọi thay đổi neo). |
| NPC-ORG-031 | Xác nhận: đánh dấu phản đồ với A (`betrayedOrganizations`), cập nhật danh tiếng A một lần, NPC thuộc A thù địch theo chính sách nhưng giữ bản ghi quan hệ lịch sử; neo gắn A bị phá có ghi dấu `defectionThreatened`. |
| NPC-ORG-032 | Sinh tối đa một kẻ truy sát "Chấp Pháp Truy Đồ" có nguồn gốc truy được (`source:"defection"`), giải quyết bằng encounter/thoát/đầu hàng thông thường. |

### Mật khố

| ID | Rule |
|---|---|
| NPC-INT-005 | Nội dung mật khố theo bậc là độc quyền tổ chức (không lấy được từ nguồn khác) và mở xem/học từ bậc Chân Truyền Đệ Tử trở lên; thăng bậc chỉ cấp nội dung gắn tag bậc mới. |
| NPC-ORG-040 | Mỗi entry mang `organizationId`, bậc tối thiểu, content ID duy nhất (prefix `guild_signature_<orgId>_`). Xem là read-only; học dùng giao dịch nhận Công Pháp/Mệnh hiện hành. Không drop ngẫu nhiên nào được cấp nội dung độc quyền tổ chức. |

### Hòa giải liên minh

| ID | Rule |
|---|---|
| NPC-ORG-050 | Điều kiện: danh tiếng với cả hai tổ chức ≥ 60, căng thẳng song phương ≥ 70, không có chiến tranh active giữa hai bên, đã qua cooldown cặp 30 ngày. |
| NPC-ORG-051 | Một kiểm tra seeded: `score = Đạo Tâm + rep A + rep B`, `chance = clamp(0.3 + score/400, 0.1, 0.9)`, `score ≥ 200` luôn thành công. Thành công tension −30; thất bại +5; cả hai ghi lần thử và cooldown 30 ngày. Không bao giờ hủy hay sửa chiến tranh đang diễn ra. |
| NPC-ORG-052 | Save cũ lưu lần thử dạng số ngày được migrate thành cooldown hết hạn ngày đó + 30 (hoặc hôm nay + 30 khi thiếu ngày). |

### Thử thách trung thành

| ID | Rule |
|---|---|
| NPC-ORG-060 | Chỉ cấp cho thành viên active có bậc có trách nhiệm (≥ Nội Môn), tối đa một lần mỗi tổ chức/người chơi mỗi 30 ngày; tick tháng roll seeded 6%. Lưu `id`, `status`, `createdDay`, `deadlineDay = createdDay + 7`, `investigated`, bằng chứng, khóa resolve. |
| NPC-ORG-061 | Tạo là hành động idempotent riêng, không gộp với lựa chọn. `investigate` ghi bằng chứng, không resolve; chỉ sau điều tra mới chọn `spare` (bảo vệ làng) hoặc `attack` (tuân lệnh). Không có lựa chọn đạo đức ẩn. |
| NPC-ORG-062 | Resolve một lần trước hạn: `spare` → passed, cống hiến +8, danh tiếng +5; `attack` → failed, cống hiến −12, danh tiếng −8. Hết hạn → expired một lần, cống hiến −3, danh tiếng −2, không giáng bậc ngầm. Mất tư cách thành viên → hết hạn không thưởng. Đổi bậc chỉ qua resolver thăng/giáng. |

## Acceptance

- Ủy thác special thứ ba trong cùng tháng bị từ chối; life_death không cấp khi tổ chức không tham chiến.
- Hòa giải khi đang chiến tranh bị từ chối; cooldown 30 ngày.
- Thử trung thành không thể chọn trước khi điều tra.
- Gate: `node tools/verify_n90_n114_behavior.js`, `node tools/verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| NPC-ORG-001..003 | `js/expansion.js:ORG_RANKS`, `guildPromotionStatus`, `promoteGuildMember`, `promotionEligibility` | Khớp |
| NPC-ORG-010..013 | `js/expansion.js:organizationInteract` (commission), `advanceOrganizationCommissions`, `resolveOrganizationCommission`, `expireOrganizationCommissions`, `promoteAfterFailedLifeCommission` | Khớp |
| NPC-ORG-020 | `js/expansion.js:updateFactionInternalEvents` (kích hoạt khi trưởng lão/chưởng môn còn ≤ 5 năm; ứng viên là chính người sắp mất) | Lệch |
| NPC-ORG-021 | `js/expansion.js:handleExpansionAction` (`act_exp_org_politics:`) | Khớp |
| NPC-ORG-030..032 | `js/expansion.js:resolveOrganizationDefection` | Khớp |
| NPC-INT-005, NPC-ORG-040 | `js/expansion.js:guildVaultSnapshot` | Khớp |
| NPC-ORG-050 | `js/expansion.js:resolveAllianceMediation` (ngưỡng tension ≥ 50) | Lệch |
| NPC-ORG-051..052 | `js/expansion.js:resolveAllianceMediation`, `mediateAlliance` | Khớp |
| NPC-ORG-060..062 | `js/expansion.js:resolveLoyaltyTest`, `updateFactionInternalEvents`, `tick` | Khớp |
