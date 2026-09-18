# Batch 02 — Tổ chức: địa chỉ bản đồ và interaction runtime

## Phạm vi

Batch này nối catalog `GUILDS`/`WORLD_MAP.factions` vào node Oxy thật và bổ sung sổ quan hệ tổ chức độc lập với membership.

## Contract

- Mỗi guild/faction có một `nodeId` ổn định và `oxyNode` nguyên trong miền `0..100`.
- Organization node được đăng ký vào `GameData.LOCATIONS`, `WORLD_MAP.locations` và `state.openWorld` khi runtime khởi tạo; không nhân bản catalog tổ chức vào save.
- `organizationId` là ID canonical duy nhất; `guildMembership` chỉ biểu thị tư cách thành viên, không thay thế quan hệ xã hội.
- `organizationState.relations[id]` lưu reputation, favor, trust, heat, status, dịch vụ đã mở và ngày tương tác cuối.
- Interaction hợp lệ: `status`, `donate`, `request_aid`, `commission`, `share_intel`, `mediate`.
- `donate`, `commission`, `share_intel`, `mediate` giới hạn một lần mỗi ngày cho mỗi tổ chức; `request_aid` dùng Favor và là ngoại lệ.
- Interaction mutate yêu cầu người chơi đang đứng tại organization node; status chỉ đọc có thể gọi ở mọi nơi.
- Tọa độ tổ chức được lượng tử hóa về ô nguyên và chống trùng với node authored hiện hữu.

## Đã triển khai

- Bổ sung `nodeId` cho toàn bộ faction/guild address và đưa các address vào `byNodeId`.
- Runtime tự dựng authored organization node có `organizationId`, `mapNodeType`, region và tọa độ Oxy.
- Thêm `organizationSnapshot`, `organizationInteract`, `ensureOrganizationState`.
- Thêm action tại organization node cho xem quan hệ, quyên trợ và ủy thác.
- UI danh sách tổ chức hiển thị địa chỉ Oxy.

## Regression gate Batch 02

```text
node --check data/data.js
node --check js/engine.js
node --check js/expansion.js
node --check js/ui.js
node tools/verify_game.js
```

Không chuyển sang batch chiến sự/sự kiện tổ chức nếu địa chỉ node hoặc interaction contract chưa đạt gate.
