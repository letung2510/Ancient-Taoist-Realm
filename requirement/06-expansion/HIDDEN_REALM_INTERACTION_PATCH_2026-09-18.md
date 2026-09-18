# Bản vá tương tác Bí Cảnh — 2026-09-18

## Luật vào/ra

- Không thể mở Bí Cảnh mới khi nhân vật đang ở trong một Bí Cảnh khác.
- Node runtime phải thuộc đúng `realmId` và `cycleIndex` hiện tại.
- Claim lõi chỉ hợp lệ tại core node, trong cửa sổ mở và qua reward ledger theo cycle.
- Thoát Bí Cảnh trả nhân vật về parent node; log dùng văn phong novel.

## Kiểm định

Validator kiểm tra liên kết active realm, cycle, node runtime và vị trí hiện tại; regression test bao phủ enter, serialize/deserialize node runtime và exit.
