# Product policy canonical — Mục 29–33

## Mệnh relationship decay

Quan hệ Mệnh dùng `decayPolicy: "none"`; stage, points và history không tự giảm theo
thời gian. Quan hệ NPC dùng `event_only`, chỉ thay đổi qua event/action có nguyên nhân.

## Con Đường fusion

Nhân vật có tối đa hai slot Con Đường: một chính và một phụ. Chuyển/dung hợp là
`explicit_once`, không tự đổi theo modifier. Affinity fusion bị chặn trong 0..0.75;
path trùng nhau và quá số slot bị validator từ chối.

## Dị Thể

Dị Thể là modifier theo catalog, có exclusion rõ ràng nếu catalog khai báo; không tự
động khóa Nghề chính, Con Đường, faction hay tạo ending ngoài metadata catalog.
Ending/faction affinity chỉ xuất hiện qua outcome của Dị Thể đã claim.

## Structure ownership

Structure phải có `ownerType` là `player | npc | faction` và `ownerId`. Chủ player được
repair/upgrade/dismantle/transfer. Thành viên faction sở hữu được repair; faction không
được upgrade/dismantle bằng action player. NPC-owned không cho player tự quản lý.
Transfer phải ghi `from`, `to`, `day` vào `transferHistory`; petition outpost là transition
riêng từ player sang faction.

## NPC offline

Offline dùng `aggregate_then_actor_window`: phần cũ aggregate, cửa sổ chi tiết cuối giữ
actor projection; `lastProcessedDay` là idempotency key. Actor history chỉ là projection
có giới hạn, không giả lập vô hạn micro-event.

## Runtime evidence

`productPolicySnapshot`, `validateProductPolicies` và `structureManagerDecision` là API
canonical; `validateExpansionState` gọi policy validator. Regression kiểm tra faction
repair nhưng không upgrade và kiểm tra toàn bộ policy sau save/runtime.

## Giới hạn còn lại

- Cân bằng số liệu gameplay và browser FPS vẫn cần playtest trên thiết bị thật.
- NPC aggregate không lưu toàn bộ lịch sử micro-event; chỉ final state, incident và actor
  projection trong cửa sổ chi tiết.
