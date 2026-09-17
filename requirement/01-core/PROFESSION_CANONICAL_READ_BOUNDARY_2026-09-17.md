# Profession Canonical Read Boundary — 2026-09-17

`canonicalHiddenProfessionId(state)` là read boundary duy nhất cho logic runtime
cần biết Nghề Ẩn. Resolver ưu tiên `professionState.secondaryId`, sau đó mới
dùng `player.hiddenProfession` như compatibility mirror của save cũ.

Các điều kiện Con Đường, Ngoại Đạo Giả, trial và final victory không còn đọc
trực tiếp field legacy. Migration vẫn mirror `player.hiddenProfession` để UI và
save cũ không mất dữ liệu, nhưng write canonical phải đi qua
`professionState.secondaryId`.

Regression kiểm tra cả canonical secondary và legacy fallback.
