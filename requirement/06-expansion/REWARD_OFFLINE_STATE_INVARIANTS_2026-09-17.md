# Reward Ledger và Offline State Invariants — 2026-09-17

`ensureExpansionState()` migrate reward receipts cũ về schema canonical:
`key/sourceId/day`, numeric reward fields, `fates`, `techniques` và
`taintedRewards`. Receipt hỏng bị loại khỏi ledger thay vì làm hỏng toàn save.

`validateExpansionState()` kiểm tra reward receipt, weather severity/history,
NPC memory/rumor retention, actor history projection tối đa 30 ngày, scheduled
task và companion state. Mục tiêu là bảo vệ idempotency reward, save migration,
offline simulation và bounded history trong cùng một state gate.

Receipt legacy không hợp lệ được giữ trong `legacyPayload` với trạng thái
`quarantined`; migration không xóa dữ liệu của người chơi.
