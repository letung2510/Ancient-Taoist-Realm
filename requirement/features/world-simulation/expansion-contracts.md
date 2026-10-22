# Mô phỏng thế giới — Hợp đồng mở rộng và ranh giới UI

## Mục đích

Các quyết định thiết kế đã chốt cho những hệ thống mở rộng gắn với world simulation (bắt giữ, thức tỉnh vật phẩm, thiên kiếp, đại hội, biên cảnh) và ranh giới hiển thị của các tab thế giới.

## Dữ liệu & trạng thái

`item.legacy { usageCounters, marks, awakeningStatus, awakeningId, bondLevel, heirloom, reincarnations }`, `worldSimulation.tournament { rounds, status }`, `pendingTribulation`, catalog Yêu Thú (`capturable`, `beast`).

## Rules

| ID | Rule |
|---|---|
| WSIM-CON-001 | Bắt sống/đồng hành MVP chỉ áp cho Yêu Thú Dị Biến đánh dấu `capturable:true` hoặc `beast:true`; quy tắc loại trừ ở NPC-ENT-021 ([npc/entity-classes.md](../npc/entity-classes.md)). |
| WSIM-CON-002 | Thức tỉnh vật phẩm chọn template theo loại trang bị, trạng thái nguyền và thành tích chiến đấu (`usageCounters`); luôn hiển thị lợi ích/đánh đổi trước khi xác nhận; vật phẩm đã thức tỉnh không thức tỉnh lại. |
| WSIM-CON-003 | Thiên kiếp luôn có một phương án tài nguyên phổ quát và tối đa hai phương án điều kiện theo Mệnh, Neo Nhân Tính, Công Pháp, chiến sử, sự kiện hoặc tâm cảnh. |
| WSIM-CON-004 | Đại hội gồm ba trận combat thật, không phải một lần roll; trạng thái đóng (`closed`/`completed`/`eliminated`/`incomplete`) được làm mới theo chu kỳ 120 ngày; save cũ không có `rounds` chuyển `legacy_completed`. |
| WSIM-CON-005 | Node biên cảnh chỉ được ghi nhận khi người chơi đã quan sát/mở; phe NPC chỉ cạnh tranh node đó sau mốc này. |
| WSIM-UI-001 | Tab Thế sự hiển thị biến cố, mặt trận ngoại giao/chiến tranh, thời tiết/mùa và cơ hội tranh đoạt. |
| WSIM-UI-002 | Tab Nhiệm vụ gom quest, khế ước, biến cố và thử thách theo hạn ngày game. |
| WSIM-UI-003 | Tab Cảnh giới hiển thị lựa chọn thiên kiếp đang chờ; túi đồ chỉ hiện nút thức tỉnh khi preview hợp lệ. |
| WSIM-UI-004 | Dữ liệu bí mật (roll RNG, seed, thông tin NPC ngoài allowlist) không bao giờ render ra UI. |
| WSIM-UI-005 | Mọi tab canonical (`status`, `inventory`, `quests`, `relations`, `guilds`, `map`, `memory`, `world`, `oddities`, `expansion`, `market`, `qintian`, `cauldron`) render được với state mới hợp lệ qua `GameUI.renderPanel`: không throw, HTML không rỗng, không chứa `undefined`, `NaN`, `Cannot read`, `TypeError`. |

## Acceptance

- Gate: `node tools/verify_game.js` (invariant + DOM regression + headless render từng tab), `node tools/verify_ui_variant_render_matrix.js`.
- Pixel layout, font, responsive, network asset và FPS thật thuộc QA trình duyệt/thiết bị, không thuộc harness này.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| WSIM-CON-001 | `js/expansion.js` (capturable check) | Khớp |
| WSIM-CON-002 | `js/expansion.js:awakenItem` | Khớp |
| WSIM-CON-003 | `js/expansion.js:prepareTribulation`, `chooseTribulation` | Khớp |
| WSIM-CON-004 | `js/expansion.js:updateTournament` | Khớp |
| WSIM-CON-005 | `js/expansion.js:mapFogState`, `petitionFactionTerritory` | Khớp |
| WSIM-UI-001..004 | `js/ui.js:renderPanel` (tab world/quests/status/inventory) | Khớp |
| WSIM-UI-005 | `js/ui.js:renderPanel`; `tools/verify_game.js` | Khớp |
