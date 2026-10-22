# Bản đồ — Node đản sinh theo vùng

## Mục đích

Catalog không gian các node xuất phát theo vùng và quy tắc chọn node. Ngữ nghĩa tạo nhân vật và ý định hành trình thuộc [../character/README.md](../character/README.md); feature này chỉ sở hữu catalog và vị trí.

## Dữ liệu & trạng thái

- `ORIGIN_NODE_CATALOG` (js/engine.js), `resolveOriginNode(regionId, options)`.
- `player.originNode = { id, locationId, regionId, kind, label, selection: "explicit" | "policy_default" | "legacy_fallback" }`.
- `rollCharacterCreation(regionId)` là nguồn duy nhất quyết định `startLocationId`.

## Rules

| ID | Rule |
|---|---|
| MAP-ORG-001 | Ba lớp tách biệt: vùng khởi đầu (địa lý, khí hậu, chủng tộc, tập node hợp lệ); node đản sinh (vị trí bắt đầu và xuất thân xã hội, không bao giờ là membership); ý định hành trình (`tam_su`, `tu_lap`, `quy_tong`, `an_the`). Sinh gần tông môn không ngụ ý là thành viên; chỉ action gia nhập hợp lệ mới tạo `guildMembership`. |
| MAP-ORG-002 | Schema lưu `player.originNode` như trên. `allowedIntents` là metadata catalog, không lưu. Node được dùng làm `startLocationId`. |
| MAP-ORG-003 | Catalog: Trung Vực — Tân Thủ Thôn (mặc định `trung_vuc_tan_thu_thon` → `tan_thu_thon_trung_vuc`), Phường Thị Lạc Vân, Bạch Thủy Trấn; Đông Hoang — Thanh Mộc Biên Trấn, Hắc Lâm Ngoại Vi (frontier, chỉ `tu_lap`/`an_the`); Tây Mạc — Sa Thành Tây Mạc; Nam Chướng — Dược Khê Trấn (không bao giờ là Linh Dược Viên của tông môn); Bắc Nguyên — Tuyết Tùng Trấn; Vô Tận Hải — khu cư trú bến cảng độc lập (Lưu Vân Hải Cảng); Thiên Không Vực — Vân Bạc Bến; U Minh Giới — Minh Hà Trấn (giới hạn theo ý định). |
| MAP-ORG-004 | Cấm node tông môn: catalog không chứa kind hoặc địa chỉ `sect_adjacent`, `guild`, `sect_gate`, `son_mon`, `truyen_phap`, `van_phong`, hay bất kỳ mục nào của `MAP_GUILD_ADDRESSES`. Tên mô tả thôn, trấn, thành, phường thị, bến cảng, linh điền hoặc trạm biên. Trung Vực không sinh thẳng tại Sơn Môn hay tông môn nào. |
| MAP-ORG-005 | Resolve: mặc định theo policy chọn từ catalog vùng lọc theo ý định (`an_the` ưu tiên frontier, còn lại thôn/khu cư trú). `originNodeId` tường minh chỉ được nhận nếu thuộc vùng đó, tồn tại trong `WORLD_MAP.locations` và cho phép ý định; nếu không, dùng mặc định vùng với `selection` ghi nguồn gốc — không bao giờ lặng lẽ rơi về tông môn như Huyền Thiên Tông. Node đản sinh phải đúng vùng đã chọn và có tọa độ canonical. |
| MAP-ORG-006 | Hiệu ứng ý định: `tu_lap` bắt đầu ở khu cư trú độc lập, không membership, không công pháp tông môn, không coi lời mời là membership; `quy_tong` cũng bắt đầu ở khu cư trú độc lập và chỉ mở luồng tìm thầy/lời mời sau khi rời đi; `tam_su` ưu tiên nơi có thư khố/dân sự và mở tìm thầy; `an_the` ưu tiên frontier/phế tích, không mở theo đuổi tông môn. Kỹ năng, công pháp, đột phá, nghề đọc ý định/membership, không đọc `originNode.kind`. Đổi ý định sau đó không dời node đản sinh đã khóa. Tình huống xuất thân không ghi đè quy tắc node đản sinh. |
| MAP-ORG-007 | Migration: save chỉ có `startRegionId/startLocationId` nhận `originNode` qua bảng ngược location → node; location legacy `truyen_phap` giữ vị trí với `selection: "legacy_fallback"`; nhân vật đang chơi không bị dời. |
| MAP-ORG-008 | UI hiện ba dòng riêng (vùng, node đản sinh, ý định hành trình) chỉ bằng nhãn cho người chơi (không id/tên hàm). Nút Quy Tông mở luồng lời mời, không bao giờ gọi gia nhập trực tiếp. |
| MAP-ORG-009 | Regression: mỗi vùng ≥ 1 node hợp lệ; mặc định Trung Vực là `tan_thu_thon_trung_vuc`; không node catalog nào là địa chỉ tông môn/guild; `quy_tong` không dời origin tới tông môn; `tu_lap` không nhận node sát tông môn khi còn frontier/khu cư trú hợp lệ; node tường minh sai vùng rơi về mặc định kèm nguồn gốc; serialize/deserialize giữ `originNode`; origin không tạo `guildMembership`; đổi ý định không dời node; location của mọi node tồn tại và đúng vùng. |

## UI

Ba dòng tạo nhân vật: Vùng · Nơi đản sinh · Ý định hành trình (MAP-ORG-008).

## Acceptance

- MAP-ORG-009.
- Gate: `node tools/verify_opening_intent.js`, `node tools/verify_character_generator_replay.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-ORG-001..006 | js/engine.js:`ORIGIN_NODE_CATALOG`, `resolveOriginNode` | Khớp |
| MAP-ORG-007 | js/engine.js:`resolveOriginNode` (`legacy_fallback`) | Khớp |
| MAP-ORG-008 | js/ui.js (màn tạo nhân vật) | Khớp |
| MAP-ORG-009 | tools/verify_opening_intent.js | Khớp |
