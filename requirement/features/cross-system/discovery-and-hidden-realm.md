# Cross-system — Sổ khám phá, xem quẻ, sinh tồn, dấu vết; cơ duyên tranh chấp, Bí Cảnh Ẩn (SYS-08, SYS-09)

## Mục đích

Sổ khám phá (tab Cổ Tịch) ghi nhận mọi thứ người chơi đã gặp theo mức hiểu biết; xem quẻ, cảnh báo sinh tồn, dấu vết cá nhân; cơ duyên có đối thủ tranh đoạt; Bí Cảnh Ẩn mở theo chu kỳ. Luật khám phá chung: [discovery](../discovery/README.md); phần thưởng: [reward](../reward/README.md).

## Dữ liệu & trạng thái

```js
discoveries = { fates: {}, techniques: {}, entities: {}, locations: {},
  worldEvents: {}, factions: {}, hiddenRealms: {}, intel: {} }
DiscoveryEntry { firstSeenDay, level /* 1..3 */, source, clueIds: [], completedSetIds: [] }
HiddenRealmDefinition { id, name, parentNodeId, ownerFactionId,
  unlockCondition: { type: "item_key"|"fate_combo"|"faction_reputation"|"world_event", value },
  openRule: { cycleDays, durationDays, oneShot }, nodeTemplates: [], competingFactionIds: [], rewardTableId }
HiddenRealmRuntime { id, cycleIndex, status: "sealed"|"omen"|"open"|"closed"|"exhausted",
  opensDay, closesDay, generatedNodeIds: [], claimedRewardKeys: [], competitorProgress: {} }
```

## Rules

### Sổ khám phá và tiện ích

| ID | Rule |
|---|---|
| CSX-DSC-001 | Mức 1 biết tên/dấu hiệu; mức 2 biết quy luật quan sát được; mức 3 biết cách khắc chế/nguồn gốc. Thông tin ẩn/cấm không mở chỉ vì catalog tồn tại; không spoil mục chưa gặp. |
| CSX-DSC-002 | Hook tại `receiveFate`, `learnTechnique`, encounter, ghé địa điểm, resolve sự kiện và xác minh tình báo. Bộ sưu tập không thưởng chỉ số thô lớn; thưởng là manh mối, công thức, hạt giống quest hoặc danh hiệu trang trí. |
| CSX-DSC-003 | Biên niên Thế Sự ghi chiến tranh, Bí Cảnh, NPC nổi bật mất tích/chết và thay đổi bản đồ vĩnh viễn. |
| CSX-DSC-010 | Xem quẻ (Toán Mệnh Sư hoặc Tướng Sư) tạo gợi ý về một hướng, sự kiện, Đột Phá hoặc khế ước dựa trên seed tương lai thật, độ chính xác giảm theo kỹ năng/SAN; xem không đổi kết quả tương lai. Văn mơ hồ; UI hiện hạn và bậc tin cậy, không hiện phần trăm thật. |
| CSX-DSC-011 | Sổ sinh tồn tính từ thọ nguyên còn lại, EXP/tu luyện trung bình 20 action gần nhất và yêu cầu cảnh giới kế; chỉ cảnh báo khi đủ mẫu và dự phóng vượt vùng đệm thọ nguyên; gợi ý action hợp lệ (bế quan, tìm đan, quest, cải thiện Mệnh), không tự chơi; cảnh báo biến mất khi đủ an toàn. |
| CSX-DSC-012 | Dấu vết người chơi: tối đa một ghi chú/node, 120 ký tự, có thể giữ qua kiếp nếu chọn di sản tương ứng; escape HTML, không là sự thật gameplay. |

### Cơ duyên tranh chấp

| ID | Rule |
|---|---|
| CSX-OPP-001 | Phần thưởng hiếm từ tìm kiếm/Mệnh/Công Pháp có thể sinh NPC nổi bật tranh đoạt. Lựa chọn: **Nhường** (quan hệ/danh tiếng tăng, không nhận thưởng chính); **Tranh** (skill check hoặc combat, thất bại không thưởng); **Chia sẻ** (bảng thưởng giảm theo luật, tạo relationship event). Đối thủ và seed thưởng persist trước khi mở UI lựa chọn (UI: UI-MOD-011). |

### Bí Cảnh Ẩn

| ID | Rule |
|---|---|
| CSX-HR-001 | Node instanced dùng namespace runtime `hidden:<realmId>:<cycle>:<node>` và cùng API di chuyển/tìm kiếm/combat. |
| CSX-HR-002 | Điều kiện `fate_combo` gọi đúng `computeRelationshipEffects`, không chép điều kiện. Cổng chỉ mở đúng điều kiện và cửa sổ chu kỳ. |
| CSX-HR-003 | Tiến độ đối thủ chỉ tăng trong tick khi realm mở, deterministic, có trần; thưởng chính không bị NPC lấy trước khi người chơi có ít nhất một phiên biết realm đang mở. |
| CSX-HR-004 | Hết hạn khi người chơi đang ở trong: cho action rời, không xóa node tới khi thoát nhưng khóa thưởng mới; đóng cửa không làm kẹt hay hỏng `locationId`. Save trong Bí Cảnh load lại được; reward key chỉ nhận một lần. |

## Acceptance

- Không spoil; quẻ không reroll tương lai; dấu vết escape HTML và save/load đúng.
- Gate: `verify_dichi_deep.js`, `verify_review_batches.js`, `verify_map_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| CSX-DSC-001–003 | expansion.js:`discoveries`; ui.js discovery panel | Khớp |
| CSX-DSC-010 | expansion.js: divination | Khớp |
| CSX-DSC-011 | expansion.js: survival | Khớp |
| CSX-DSC-012 | expansion.js/main.js: player mark | Khớp |
| CSX-OPP-001 | engine.js:`pendingContestedOpportunity`; expansion.js `opportunity` | Khớp |
| CSX-HR-001–004 | expansion.js:`hiddenRealms`, namespace `hidden:` | Khớp |
