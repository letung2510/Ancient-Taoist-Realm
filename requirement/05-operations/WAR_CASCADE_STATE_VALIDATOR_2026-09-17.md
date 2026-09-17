# War front và incident cascade validator

War canonical state gồm hai faction hợp lệ, score không âm, `active|ended` status,
intervention list và cascade outcome. Khi war kết thúc, `cascadeApplied=true`, winner /
loser / resolved day phải tồn tại; cascade giảm stability loser, tăng stability/resources
winner, ghi influence event và node history có key idempotent.

`validateWarState` được gọi bởi `validateExpansionState`. `updateWars` dùng seeded key theo
war/day; `cascadeApplied` ngăn apply outcome lần hai. Regression chạy hai save clone cùng
seed qua offline catch-up, so sánh toàn bộ war/faction state và thử topology faction sai.
