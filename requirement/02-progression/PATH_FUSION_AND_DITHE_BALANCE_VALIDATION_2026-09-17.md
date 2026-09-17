# Path Fusion và Dị Thể — Catalog/Balance Validation — 2026-09-17

## Path fusion

`validatePathFusionCatalog()` kiểm tra mọi Con Đường có lead/support/forbidden
terms và path titles; sau đó duyệt toàn bộ cặp Con Đường khác nhau, bảo đảm
affinity hữu hạn, không âm và không vượt cap canonical `0.75`.

## Dị Thể

`validateSpecialPhysiqueCatalog()` kiểm tra progress threshold trong khoảng
1–10, số stage khớp stageEffects, các modifier dạng tỷ lệ nằm trong `[0,1]`,
faction affinity trong `[-10,10]`, ending/exclusion metadata và các trường bắt
buộc. Đây là lớp chặn catalog/balance trước khi claim hoặc stage progression.

## Regression

`tools/verify_dichi_deep.js` chạy cả hai validator, cùng với claim, stage
modifier, outcome, exclusion path/profession và save round-trip.
