# Companion/Dị Thể — Mutation, Recovery và Save Invariant

## Mục tiêu

Companion là thực thể chiến đấu độc lập, có thể nhận Dị Biến, bị thương, hồi phục,
được lưu và khôi phục qua save-load. Mutation không được làm mất trạng thái chiến
đấu, mastery, loyalty, corruption hoặc damage ledger.

## State canonical

`state.companion` là namespace duy nhất. Các trường chính:

- `entityId`, `customName`, `state`: `active | mutated | recovering | dead | released`.
- `hp`, `hpMax`, `loyalty`, `corruption`: số hữu hạn; loyalty/corruption trong 0..100.
- `mutationPending`: lựa chọn Dị Biến đang chờ xử lý.
- `mutation`, `passiveId`: kết quả mutation đã commit; ví dụ `tainted_claw` và `corrupted_scout`.
- `skillMastery`: map skill → số lần/mastery không âm.
- `damageLedger`: tối đa 20 bản ghi, mỗi bản ghi có `day` hữu hạn và `amount` không âm.
- `recoveryUntilDay`, `reviveCount`: số hữu hạn; reviveCount không âm.

## Transition canonical

1. `mutationPending=true` chỉ được resolve một lần.
2. `accept` đặt trạng thái chiến đấu, tắt pending, ghi mutation/passive và tăng corruption của nhân vật.
3. `cure` yêu cầu tài nguyên, đặt mutation `purified`, giữ companion hoạt động và giảm rủi ro Dị Biến.
4. `release` đặt `released`, ghi ngày phóng sinh và phát reward qua canonical reward ledger.
5. Damage chỉ ghi qua `recordCompanionDamage`; khi HP về 0 chuyển sang `recovering` và đặt ngày hồi phục.
6. `normalizeCompanion` chạy khi ensure/load/action, nhưng validator vẫn phải báo lỗi nếu giá trị sau normalize còn vi phạm invariant.

## Save/load và offline

Save phải giữ mutation/passive, loyalty/corruption, mastery, damage ledger, recovery
và revive count. Load cũ được bổ sung default an toàn; không được tạo reward lần hai.
Offline combat chỉ được ghi damage qua cùng ledger/action như online.

## Runtime và regression

- `validateCompanionState(state)` kiểm tra state enum, chỉ số, mastery, ledger và recovery.
- `validateExpansionState` gọi validator này sau mỗi ensure/rehydrate boundary.
- Regression phải resolve mutation, serialize/deserialize, kiểm tra mutation còn nguyên,
  rồi cố tình đặt loyalty ngoài miền để validator từ chối.

## Chưa hoàn thiện / giới hạn hiện tại

- Chưa có catalog data-driven đầy đủ cho từng loài companion và passive; hiện runtime
  chỉ bảo vệ invariant chung và các mutation đã có.
- Chưa có UI card chuyên biệt hiển thị toàn bộ damage ledger/recovery timeline; UI hiện
  chỉ dùng các trường companion đang được render bởi màn hình hiện hành.
