# Cross-system — Nhân mô phỏng thế giới và sự kiện thế giới (SYS-00, SYS-01)

## Mục đích

Tick thế giới theo ngày game (deterministic, idempotent, catch-up có giới hạn) và các sự kiện thế giới nhiều pha (Dị Triều, thiên tượng, thiên tai, tiền triệu Tà Thần) cùng modifier mùa/thời tiết. Mô phỏng thế lực/NPC chi tiết: [world-simulation](../world-simulation/README.md); thời tiết vùng: [weather](../weather/README.md).

## Dữ liệu & trạng thái

```js
WorldEventTemplate { id, name, category: "di_trieu"|"sky_omen"|"natural_disaster"|"tainted_omen",
  eligibleRegionTags: [], weight, cooldownDays,
  phases: [{ id: "omen"|"active"|"aftermath", durationDays, modifiers, narrativeKey }],
  questTemplateIds: [], encounterTags: [],
  choices: [{ id, label, requirements, costs, contribution, consequences }],
  outcomes: [{ id, threshold, regionEffects, rewards, permanentChanges }] }
WorldEventInstance { id, templateId, regionId, phaseIndex, phaseStartedDay, phaseEndsDay,
  seed, playerContribution, choiceHistory: [], status, outcomeId }
```

API kernel: `ensureWorldSimulation`, `simulateWorldUntil(state, targetDay, options)` (chạy tick từng ngày bên trong), `simulateWorldAggregate(state, startDay, endDay)`, `scheduleWorldTask`, `cancelWorldTask`, `processScheduledWorldTasks`, `worldSimulationSummary`, `actorHistorySnapshot(state, npcId)`.

## Rules

### Kernel

| ID | Rule |
|---|---|
| CSX-WK-001 | `advanceGameTime()` gọi `simulateWorldUntil()` sau mỗi ngày đã chuẩn hóa; `deserialize()` gọi sau khi `applyOfflineProgress()` xác định ngày đích (owner: expansion wrapper, DATA-CLK-007). |
| CSX-WK-002 | Thứ tự một tick: (1) chuyển pha/kết thúc event đến hạn; (2) cập nhật mùa và thời tiết vùng; (3) ngoại giao/sự kiện nội bộ thế lực/mặt trận; (4) lịch NPC nổi bật, task thư/truy nã; (5) kiểm tra cửa Bí Cảnh; (6) sinh tối đa một event mới mỗi vùng đã hết cooldown; (7) ghi tối đa một tóm tắt history nếu người chơi bị ảnh hưởng trực tiếp, thay đổi nền vào biên niên Thế Sự. |
| CSX-WK-003 | Gọi lại cùng ngày đích không đổi state; save/load giữa tick không nhân đôi task hay reward. |
| CSX-WK-010 | Catch-up offline: tối đa 30 tick đầy đủ gần nhất; phần vượt dùng `simulateWorldAggregate` — chỉ chuyển pha, hết hạn, lịch deterministic và kết quả chiến tranh theo lô; không sinh chuỗi encounter/quest bị bỏ lỡ. 10.000 ngày catch-up không treo UI và không tạo 10.000 history entry. |
| CSX-WK-011 | Omen người chơi chưa thấy phải giữ ít nhất một phiên đăng nhập trước khi chuyển active. Offline không gây chết, mất vật phẩm hay cưỡng bức Luân Hồi. |
| CSX-WK-020 | Projection actor offline: mỗi NPC có mẫu theo ngày (`day, node/sub-location, AI state, status, needs, weather, mood, queue rank, rumor count`), cửa sổ chi tiết 30 ngày, mẫu cũ bị prune; tổng hợp audit ở `worldSimulation.lastOfflineAudit`. Serialize/deserialize giữ nguyên byte projection; không replay cùng ngày đích hai lần. Projection không giữ mọi micro-event combat/hội thoại (thuộc incident tổng hợp và nhật ký). |

### Sự kiện thế giới và mùa

| ID | Rule |
|---|---|
| CSX-WE-001 | 12 tháng chia 4 mùa × 3 tháng. Modifier mùa theo Ngũ Hành: Xuân/Mộc, Hạ/Hỏa, Thu/Kim, Đông/Thủy; Thổ nhận bonus nhỏ lúc giao mùa. Mức MVP ±10% hiệu quả tu luyện và ±10% hệ số combat theo hệ; không đụng base stat. |
| CSX-WE-002 | Mỗi vùng đổi thời tiết mỗi 1–3 ngày trong: quang, mưa, sương, lôi vũ, linh phong. Thời tiết là modifier con của SYS-01; không tạo stat thời tiết trong player. UI preview modifier ở Trạng thái/Bản đồ và trong `techniquePreview`. |
| CSX-WE-003 | Bốn template tối thiểu: **Huyết Nguyệt** (predator/elite tăng, loot hiếm tăng, SAN drain tăng); **Linh Mạch Nghịch Lưu** (tu luyện giảm, tìm kiếm lộ khoáng/vật liệu hiếm); **Bão Linh Khí** (1–2 node nguy hiểm; cứu trợ hoặc khai thác); **Tà Thần Tiền Triệu** (omen toàn thế giới, căng thẳng thế lực tạm giảm vì kẻ thù chung, giá vật phẩm phòng hộ tăng). |
| CSX-WE-004 | Event cao cấp được tạo quest tị nạn, giảm tài nguyên thế lực và biến node thành Cấm Địa khi outcome thất bại. Thay đổi vĩnh viễn phải là outcome đã được chơi/quan sát, không âm thầm xảy ra khi offline. Rời vùng luôn là lựa chọn hợp lệ; event không khóa Đột Phá. Omen Tà Thần không spam history mỗi tick. |
| CSX-WE-005 | UI: đồng hồ có icon mùa/thời tiết; bản đồ thế giới có badge event, pha, số ngày còn lại; Nhiệm vụ nhóm objective theo event; `contextState` thêm action event khi ở đúng vùng, action không gấp nằm trong `Thêm`. |
| CSX-WE-006 | Mọi thay đổi thời tiết ghi `weather`, `weatherIntensity`, `weatherUntilDay`, `weatherSource` và `weatherHistory` có giới hạn (30). Cường độ dùng chung cho travel, NPC trú ẩn, tạm dừng chiến tranh và ngưỡng thiên tai. |

## Acceptance

- Hai clone cùng seed/input cho state thế giới giống nhau; event chuyển pha và dọn modifier chính xác; modifier preview = modifier áp trong combat/tu luyện/tìm kiếm/chợ.
- Gate: `verify_offline_parity.js`, `verify_world_producer_matrix.js`, `verify_expansion_stress.js`, `verify_review_batches.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-WK-001 | expansion.js:`simulateWorldUntil` (wrapper `advanceGameTime`) | Khớp |
| CSX-WK-002 | expansion.js: tick từng ngày bên trong `simulateWorldUntil` | Khớp |
| CSX-WK-010 | expansion.js:`simulateWorldAggregate` | Khớp |
| CSX-WK-020 | expansion.js:`actorHistorySnapshot`, `lastOfflineAudit` | Khớp |
| CSX-WE-003 | data/expansion_data.js: Huyết Nguyệt, Linh Mạch Nghịch Lưu, Bão Linh Khí, Tà Thần Tiền Triệu | Khớp |
| CSX-WE-006 | expansion.js: `weatherIntensity`, `weatherUntilDay`, `weatherSource`, `weatherHistory` | Khớp |
| CSX-WK-001 (API) | expansion.js:`scheduleWorldTask`, `cancelWorldTask`, `processScheduledWorldTasks`, `worldSimulationSummary`, `ensureWorldSimulation` | Khớp |
