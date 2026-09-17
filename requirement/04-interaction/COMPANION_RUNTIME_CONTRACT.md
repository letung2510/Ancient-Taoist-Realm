# Companion Runtime Contract

## Mục tiêu

Companion là state runtime độc lập, tương thích với save cũ và không làm thay đổi catalog tĩnh. Mọi thay đổi chiến đấu phải truy nguyên được nguồn sát thương và không được để companion chết im lặng trong save.

## State tối thiểu

```js
companion: {
  state: "active" | "mutated" | "recovering" | "released",
  hp: 30,
  hpMax: 30,
  role: "scout" | "striker",
  guardStance: "balanced" | "guard",
  skillMastery: {},
  damageLedger: [],
  lastDamageSource: null,
  recoveryUntilDay: 0,
  reviveCount: 0
}
```

`normalizeCompanion()` bổ sung default khi load save cũ. `damageLedger` chỉ giữ 20 entry gần nhất và lưu `day`, `amount`, `source`, `damageType`.

## API

- `selectCompanionTarget(state, options)`: chọn mục tiêu còn sống theo mức đe dọa, độ bị thương, role và guard stance; kết quả có seed nên replay được.
- `recordCompanionDamage(state, amount, source, damageType)`: ghi ledger, cập nhật HP và chuyển sang `recovering` khi HP về 0.
- `recoverCompanion(state)`: hồi 50% HP sau 3 game-day hoặc ngay tại node an toàn.
- `reviveCompanion(state)`: tại node an toàn, tốn 3 Linh Thạch, hồi 25% HP và tăng `reviveCount`.

Các hàm đều trả `{ success, reason, ...data }`, không phát reward hai lần và không dùng thời gian máy cho gameplay. Regression nằm ở `tools/verify_companion_runtime.js`.
