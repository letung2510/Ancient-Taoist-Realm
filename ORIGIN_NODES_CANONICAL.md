# ORIGIN NODES CANONICAL — Nền xuất thân theo vùng

## 1. Mục tiêu

`startRegionId`, `originNode` và `journeyIntent` là ba lớp khác nhau:

1. **Vùng xuất thân** xác định địa lý, khí hậu, chủng tộc và tập node hợp lệ.
2. **Node xuất thân** xác định nơi nhân vật bắt đầu và bối cảnh xã hội; nó không tự động tạo membership.
3. **Ý định hành đạo** xác định hướng phát triển sau khi bắt đầu: Tầm Sư, Tự Lập, Quy Tông hoặc Ẩn Thế.

Không được suy ra “sinh ra gần tông môn” thành “đã gia nhập tông môn”. Membership chỉ được tạo bởi action gia nhập hợp lệ.

## 2. Schema v1

```js
originNode: {
  id: "trung_vuc_tan_thu_thon",
  locationId: "tan_thu_thon_trung_vuc",
  regionId: "trung_vuc",
  kind: "archive_civic",
  label: "Vạn Phong Điện · học đồ ngoại viện",
  selection: "explicit|policy_default|legacy_fallback"
}
```

`allowedIntents` là metadata catalog, không lưu lại nếu có thể tái tạo; save chỉ cần lưu `id`, `locationId`, `regionId`, `kind` và `selection`. Validator phải từ chối node không thuộc vùng hoặc không tồn tại trong `WORLD_MAP.locations`.

## 3. Catalog và chính sách

- **Trung Vực**: `Tân Thủ Thôn`, `Phường Thị Lạc Vân`, `Bạch Thủy Trấn`. Đây là các node dân cư độc lập, cách xa sơn môn và không có tổ chức tông phái sở hữu.
- **Đông Hoang**: `Thanh Mộc Biên Trấn` là node dân cư chính; Hắc Lâm Ngoại Vi chỉ dành cho Tự Lập/Ẩn Thế sau khi đã bắt đầu.
- **Tây Mạc**: `Sa Thành Tây Mạc` là phường buôn độc lập.
- **Nam Chướng**: `Dược Khê Trấn` là chợ linh thảo dân sự; không dùng Linh Dược Viên của cụm tông môn làm điểm sinh.
- **Bắc Nguyên**: `Tuyết Tùng Trấn` là thành trấn của đoàn xe dân sự.
- **Vô Tận Hải**: `Lưu Vân Hải Cảng` là hải cảng độc lập.
- **Thiên Không Vực**: `Vân Bạc Bến` là bến neo dân cư ngoài đạo thống.
- **U Minh Giới**: `Minh Hà Trấn` là biên trấn người sống sót; chỉ mở cho ý định phù hợp với gate cảnh giới.

### 3.1. Luật cấm node tông môn

Catalog xuất thân không được chứa `sect_adjacent`, `guild`, `sect_gate`, `son_mon`, `truyen_phap`, `van_phong` hoặc địa chỉ được lấy từ `MAP_GUILD_ADDRESSES`. Tên node phải mô tả làng, trấn, thành, phường thị, hải cảng, linh điền hoặc trạm biên. Ý định `Quy Tông` chỉ mở hướng tìm/gặp tông môn sau khi nhân vật rời node xuất thân; nó không thay đổi nơi sinh và không tạo membership.

Policy mặc định chỉ chọn trong catalog đã lọc theo `journeyIntent`. Nếu người chơi truyền `originNodeId`, engine kiểm tra node đó trước khi chấp nhận. Nếu không hợp lệ, engine dùng policy default cùng vùng, không rơi im lặng về Huyền Thiên Tông.

## 4. Tương tác với ý định hành đạo

- `tu_lap`: ưu tiên Tân Thủ Thôn/settlement độc lập; không được cấp `guildMembership`, guild technique hoặc lời mời giả thành membership.
- `quy_tong`: cũng bắt đầu ở node dân cư độc lập, sau đó mở tuyến tìm sư/đăng môn; vẫn chưa gia nhập cho đến action `joinGuild`.
- `tam_su`: ưu tiên archive/civic và mở đường tìm sư; không tự khóa vào tông môn tại node khởi đầu.
- `an_the`: ưu tiên frontier/ruin và không tự mở guild pursuit.

Kỹ năng, công pháp, đột phá và nghề nghiệp đọc `journeyIntent`/membership riêng; không đọc `originNode.kind` như một quyền sở hữu.

## 5. Save/migration

Save cũ chỉ có `startRegionId/startLocationId` được nâng thành `originNode` bằng bảng ngược location → node. Nếu location cũ là `truyen_phap`, migration giữ nguyên vị trí và gắn `selection: "legacy_fallback"`; không chuyển nhân vật đang chơi. Nhân vật mới không truyền node dùng policy default `trung_vuc_tan_thu_thon`.

## 6. UI và validator

UI phải hiển thị ba dòng riêng: vùng, node xuất thân, ý định hành đạo. Nhãn node là tên người chơi; không hiển thị function name hoặc id nội bộ. Nút Quy Tông chỉ mở invitation flow, không gọi thẳng join.

Regression tối thiểu:

- mỗi vùng có ít nhất một node hợp lệ;
- Trung Vực default là `tan_thu_thon_trung_vuc`;
- mọi node catalog xuất thân không phải địa chỉ tông môn/guild và không nằm trong `MAP_GUILD_ADDRESSES`;
- `quy_tong` không làm đổi node xuất thân sang sơn môn;
- `tu_lap` không trả sect-adjacent node nếu còn frontier hợp lệ;
- explicit node sai vùng bị từ chối/fallback có ghi provenance;
- serialize/deserialize giữ nguyên `originNode`;
- origin node không tạo `guildMembership`;
- intent thay đổi không làm đổi node đã khóa;
- node location tồn tại và region khớp.

## 7. Trạng thái triển khai

Engine đã có `ORIGIN_NODE_CATALOG`, `originNodeOptions`, `resolveOriginNode`, lưu `player.originNode` và dùng node đó làm `startLocationId`. Movement UI và WT01–WT13 dùng cùng canonical travel resolver. UI khởi tạo nhân vật cần tiếp tục hiển thị catalog node nếu flow tạo nhân vật được mở rộng thành bước chọn explicit; policy engine đã sẵn sàng và không còn hard-code Trung Vực vào Huyền Thiên Tông.
