# Action Priority / Replay Canonical — 2026-09-16

## Priority tiers

`tier 0` là forced/blocking: combat, ritual, pending search, contested opportunity. `tier 1` là action mở rộng có thể tiêu lượt. `tier 2` là navigation/status/overflow. Safe action (`Trạng Thái`, `Quan Sát`, `Hành Trang`) được phép tồn tại cùng blocking action.

Mỗi action phải có `id`, `category`, `scope`, `urgency`, `blocking`, `consumesTurn`, `enabled` và `sourceOrder`. `resolveActionPriority` dedupe theo ID, chọn winner theo `tier → urgency → sourceOrder`, rồi lọc action không hợp lệ.

## Replay

Preview không được thay đổi state hoặc tiêu hao RNG. Commit dùng unique action key/turn; world event, map encounter, weather, auction và NPC encounter dùng seeded resolver hoặc unique idempotency key. Legacy history không tạo ID bằng random khi deserialize.

## UI listener

Action handler chỉ dispatch một lần qua `submitActionId`/`runExpansionCommand`; render lại không được đăng ký listener trùng. Feature mới phải đi qua view model/resolver thay vì tự đọc raw effect field để quyết định blocking.

## Acceptance

- Combat/search/ritual/opportunity/travel/structure không đồng thời cho phép action xung đột.
- Deserialize cùng snapshot giữ nguyên log/event ID và statDisplay.
- Chạy world tick cùng target lần hai không nhân đôi cascade/reward/encounter.
- Hai save được deserialize từ cùng một snapshot, chạy cùng nhánh combat và
  cùng input phải tạo transcript player-visible giống hệt nhau ở `type`, `text`,
  `clock` và `statDisplay`; event ID/timestamp kỹ thuật không được dùng làm
  tiêu chí khác biệt của replay.
