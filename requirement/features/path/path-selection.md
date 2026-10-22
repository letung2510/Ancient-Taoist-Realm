# Path — Chọn & duy trì Con Đường

## Mục đích

Registry mười Con Đường chính, công thức tương hợp Mệnh (`match_score`), điều kiện mở đường ở cấp 2, năm nấc chuyên môn, namespace `pathState`, Chuyển Đạo và Con Đường phụ (Song Tu/Dung Hợp).

## Dữ liệu & trạng thái

| Nguồn | Nội dung |
|---|---|
| `data/path_fate_relations.json:paths` (+ `data/path_fate_relations.js`) | `lead`, `support`, `forbidden` theo `pathId`; entry `ngoai_dao_gia` (`unbound: true`) |
| `js/engine.js:PATH_LABELS` | Tên hiển thị |
| `js/engine.js:PATH_ID_ALIASES` | Alias nhập liệu → ID chuẩn |

```js
state.pathState = { schemaVersion: 2, primaryPathId, secondaryPathId, hiddenPathId, unbound,
  history: [{ type: "secondary_path" | "path_switch", from, to, day, cost }], fusionAffinity }
state.player.pathId / secondaryPathId / hiddenPathId / unbound / pathNamespace   // mirror
state.flags.pathChoicePending, state.flags.pathFateGranted
```

## Rules

### PATH-SEL-001 Registry và ID chuẩn
Mỗi Con Đường có đúng một entry; `pathId` là key duy nhất cho state, match, nghi thức, quest, log, test. `displayName` chỉ cho UI.

| `pathId` | Hiển thị | Mệnh dẫn | Mệnh trợ | Mệnh cấm | Chỉ số chủ | Mặt trái |
|---|---|---|---|---|---|---|
| `kiem_dao` | Kiếm Chủ | kim, kiếm, sát | phong, lôi, chiến | mộng, ảo, nô | PHY, Căn Cốt | Phải cắt quan hệ/lời thề ở nghi thức lớn |
| `dan_dao` | Thôn Linh | đan, dược, hỏa | sinh, mộc, lô | độc, hàn, tử | MAG, Ngộ Tính | Đan độc, biến đổi thân thể tích lũy |
| `phu_dao` | Thiên Cơ | phù, ấn, văn | lôi, hỏa, kim | câm, vô danh | Ngộ Tính, MAG | Phù mạnh có thể xóa ký ức |
| `phong_thuy_dao` | Phong Thủy | địa, sơn, thủy | trận, long, huyệt | vực, hư vô | Ngộ Tính, SAN | Sai long mạch phản chấn khu vực |
| `ngu_thu_dao` | Ngự Thú | thú, yêu, huyết | sinh, sơn, nguyên | diệt, độc | Căn Cốt, PHY | Đồng cảm sâu, bản ngã người mỏng đi |
| `khoi_loi_dao` | Khôi Lỗi | khôi, cơ, hồn | kim, mộc, ấn | sinh, mộng | MAG, Ngộ Tính | Khôi lỗi bào mòn cảm xúc |
| `am_luat_dao` | Tà Âm | âm, hồn, tử | mộng, nguyệt, nhạc | lôi, quang | Ngộ Tính, SAN | Có thể gọi nhầm người chết |
| `mong_canh_dao` | Mộng Cảnh | mộng, tâm, ảo | nguyệt, hồn, vô | kiếm, sát | Ngộ Tính, SAN | Ký ức thật/giả hòa lẫn |
| `luyen_the_dao` | Luyện Thể | thể, huyết, cốt | lôi, hỏa, sơn | hồn, mộng | Căn Cốt, PHY | Cường hóa cần đau đớn thật, thất bại gây dị hóa |
| `tinh_tuong_dao` | Tinh Tượng | tinh, thiên, mệnh | nhật, nguyệt, địa | vô danh, đoạn mệnh | Ngộ Tính, MAG | Biết tương lai làm giảm tự do lựa chọn |

`ngoai_dao_gia` (Kẻ Vô Lộ — Ngoại Đạo Giả) không thuộc mười đường: [ngoai-dao-gia.md](ngoai-dao-gia.md).

### PATH-SEL-002 Alias nhập liệu
`di_hoa→dan_dao`, `thien_co→tinh_tuong_dao`, `linh_van→phu_dao`, `thien_menh→phong_thuy_dao`, `dao_the→luyen_the_dao`, `ngu_thu→ngu_thu_dao`, `khoi_loi→khoi_loi_dao`, `ta_am→am_luat_dao`, `mong_canh→mong_canh_dao`. Alias chỉ được chuẩn hóa qua `canonicalPathId()` ở biên nhập; không bao giờ ghi alias vào state/save. Alias chỉ tra theo **ID**, không bao giờ theo nhãn: nhãn hiển thị luôn là `PATH_LABELS[canonicalPathId(id)]` (`thien_co` → `tinh_tuong_dao` → "Tinh Tượng"; nhãn "Thiên Cơ" chỉ thuộc `phu_dao`, tức alias `linh_van`). Không tạo `pathId` trùng `professionId` hay `hiddenPathId`.

### PATH-SEL-003 `match_score`
`pathMatchSummary(character, pathId)` (thuần, suy ra mỗi lần gọi, không lưu vào save):
1. Duyệt Mệnh active (`player.fates`, ID có trong catalog); Mệnh Kho không tham gia.
2. Với mỗi Mệnh: `text` = tên + `type` + `element` + khóa `effects` + `tags`, chuẩn hóa chữ thường không dấu. `leadHits`/`supportHits`/`forbiddenHits` = số tag của Con Đường (`lead`/`support`/`forbidden`) xuất hiện trong `text`; mỗi tag tính tối đa một lần cho mỗi Mệnh.
3. Mệnh có `forbiddenHits ≥ 1`: `leadHits` của Mệnh đó coi là 0 (forbidden thắng, không là Mệnh dẫn); `supportHits` và `forbiddenHits` vẫn tính.
4. `lead = Σ leadHits`, `support = Σ supportHits`, `forbidden = Σ forbiddenHits`; `rawScore = max(0, 3 × lead + support − 2 × forbidden)` — **không có trần** (ngưỡng cảnh giới dữ liệu tới 13).
5. `daoBonus = 1` khi Đạo Tâm ≥ 80 **và** `rawScore ≥ 1`, ngược lại 0; `score = rawScore + daoBonus` ([PRG-CUL-006](../realm-progression/exp-and-cultivation.md)).
6. Trả `{ score, rawScore, lead, support, forbidden, daoBonus, allHung }`. Mọi cổng (PATH-SEL-004/005/011, `requiredPathScore` của cảnh giới, `availablePaths`, preview hoán đổi) so với `score`; `requiredLeadTags` so với `lead`; `requiredCompatibleTags` so với `lead + support`. UI hiển thị `score` và ghi chú "(+1 Đạo Tâm)" khi `daoBonus = 1`.
Ngoại Đạo Giả/unbound → `score 0`. Tag chưa có trong `FATE_DATA` là reserved, không sinh ứng viên giả. Không cần migration save (giá trị dẫn xuất).

Ví dụ: lead 4, support 1, forbidden 0 → `rawScore 13` (cấp 14 đạt được); lead 1 + forbidden 1 ở hai Mệnh khác nhau → `1`; một Mệnh khớp cả lead lẫn forbidden → phần lead của Mệnh đó bằng 0.

### PATH-SEL-004 Ngưỡng theo cảnh giới
Ngưỡng `requiredPathScore`, số Mệnh dẫn và dẫn+trợ lấy từ dữ liệu cảnh giới ([PRG-RLM-003](../realm-progression/realms-14.md)), kiểm ở cổng Đối Chiếu.

### PATH-SEL-005 Điều kiện mở đường
Chỉ từ cấp 2 (`pathChoicePending`). Con Đường thường mở khi: ≥ 1 Mệnh dẫn, `match_score ≥ 3`, bộ Mệnh đang gắn không toàn Hung. Action `act_path_<pathId>` liệt kê từ `availablePaths()`; Ngoại Đạo Giả luôn có trong danh sách trừ khi đã có nghề ẩn.

### PATH-SEL-006 Con Đường chính cố định
`selectPath()` từ chối đổi sang đường khác khi đã có `pathId`; đổi chỉ qua Chuyển Đạo (PATH-SEL-012).

### PATH-SEL-007 Quà chọn đường
Lần chọn đường đầu tiên (`flags.pathFateGranted`) trao một Mệnh phẩm Phàm chưa sở hữu có tương hợp ≥ 3 vào Mệnh Kho (cho phép pending nếu kho đầy).

### PATH-SEL-008 Năm nấc chuyên môn
| Nấc | Mốc | Điều kiện cốt lõi |
|---|---:|---|
| Khai Lộ | 2 | Chọn đường, có Mệnh dẫn |
| Lập Ấn | 3 | Hai tag dẫn/trợ và Công Pháp lõi |
| Chưởng Quyền | 6 | Hoàn tất nghi thức riêng của đường |
| Thần Tính | 10 | Neo ổn định, quyền năng riêng, không nợ quá hạn |
| Thành Thần | 14 | Quyền Năng độc quyền; là cách cấp 14 biểu hiện, không phải cấp 15 |

### PATH-SEL-009 Con Đường ≠ Nghề
Con Đường trả lời "tu luyện theo triết lý nào"; Nghề trả lời "làm chuyên môn gì". Có thể đồng thời đi `dan_dao` và học Luyện Đan Sư; không cộng hiệu ứng trùng chỉ vì tên/tag gần nhau. Không dùng tên nghề làm `pathId` hay ngược lại.

### PATH-SEL-010 Namespace và cấp độ tách biệt
`pathState`, `professionState`, `specialPhysiqueState` là ba namespace độc lập ([../di-the/special-physique.md](../di-the/special-physique.md), [../profession/profession-list.md](../profession/profession-list.md)). Mirror `player.pathId/secondaryPathId/hiddenPathId` luôn bằng `pathState.primaryPathId/secondaryPathId/hiddenPathId`; `primaryPathId ≠ secondaryPathId`. `realmLevel` (cảnh giới), `pathLevel` (cấp Con Đường), `ritualMilestone` (mốc nghi thức), `professionMasteryStage` (mastery nghề) là các field khác nhau; không dùng field nghề để kiểm điều kiện path.

### PATH-SEL-011 Con Đường phụ (Song Tu/Dung Hợp)
Tối đa 1 Con Đường chính + 1 Con Đường phụ; không có slot thứ ba (Nghịch Hành, hybrid là biến thể). Con Đường phụ chỉ mở bằng `transitionSecondaryPath(state, pathId, { confirmed: true })`:
- Điều kiện: cấp ≥ 6; đã có đường chính; `match_score ≥ 5` với cả đường chính và đường phụ; khác đường chính; chưa có đường phụ.
- Chi phí nguyên tử, kiểm đủ trước khi trừ: 20 Mệnh Tinh Hoa, 15 Công Đức, 10 Thanh Tỉnh. Chưa xác nhận → `requiresConfirmation`, không trừ gì.
- Lưu `history` (`type: "secondary_path"`) và `fusionAffinity = { raw = clamp(0.5 + 0.125 × shared − 0.2 × conflicts, 0, 1), effective = min(raw, 0.75), sharedTerms, conflictTerms }`. Affinity chỉ là thông tin cho UI/cân bằng, không đổi đường chính, không cộng hiệu ứng tự động.
- Nghi thức liên quan đường phụ tăng 10% SAN cost. Đường phụ không ghi đè nghi thức đột phá của đường chính, namespace nghề hay Dị Thể; không bao giờ tự xuất hiện từ Mệnh/Nghề/Dị Thể. `hybridPath(state)` = có `secondaryPathId`.

### PATH-SEL-012 Chuyển Đạo (đổi Con Đường chính)
`switchPathContext(state, newPathId, npcId)` + `pathSwitchStatus(state)` + `pathSwitchCandidates(state)`:
- Điều kiện: có NPC "Chuyển Đạo Nhân" (NPC ẩn, spawn hiếm hoặc mở qua quest khám phá) đang active và đạt quan hệ tối thiểu; không trong combat/Bế Quan/nghi thức đang mở; cooldown 30 ngày game; đường mới thỏa PATH-SEL-005.
- Kết quả: giữ EXP đã chốt, Mệnh, Công Pháp, cảnh giới; đổi `pathId` và tính lại `pathMatchSummary`; xóa bonus tương hợp tạm của đường cũ; Đạo Tâm về tối đa 10; reset nghi thức đột phá về `null`; ghi cooldown, `pathState.history` và Tu Vi Thư.
- Từ cấp 4: thêm phá một Mệnh Khế, tăng `fateDebt` và tác động Neo.

### PATH-SEL-013 Dị Hệ
Có từ hai Mệnh cấm chưa hóa giải trong bộ Mệnh đang gắn → đánh dấu Dị Hệ; mỗi nghi thức sau đó tăng Corruption.

### PATH-SEL-014 Kiểm catalog
`validatePathFusionCatalog()`: mọi path có mảng `lead/support/forbidden` và `path_titles` (≥ 2 mục); mọi cặp path khác nhau có affinity hữu hạn, không âm, ≤ cap 0,75.

### PATH-SEL-015 Checklist nội dung mới
Trước khi thêm logic: thuộc path / path variant / ritual / hidden path / hidden profession? state nào sở hữu? trigger là gameplay event cụ thể? cái giá và rủi ro đã ghi? có trùng hiệu ứng/ID lớp khác? Dị Chí chỉ ghi clue hay đang thực thi?

## UI

Màn chọn đường (cấp 2): danh sách `availablePaths` kèm điểm tương hợp, Mệnh dẫn/trợ/cấm khớp, mặt trái. Con Đường và Nghề hiển thị ở hai nhãn riêng ("Con Đường: …", "Nghề Nghiệp: …").

## Acceptance

- Không có Mệnh dẫn → không mở đường thường nhưng vẫn chọn được Ngoại Đạo Giả.
- Chọn đường lần hai bị từ chối; Con Đường phụ: xác nhận, đủ tài nguyên, không lặp, round-trip save.
- `match_score` đạt 12–13 được ở cấp cao (không bị trần): fixture lead 4 / support 1 / forbidden 0 → `rawScore 13`; Đạo Tâm 80 và `rawScore 12` → `score 13`; Đạo Tâm 80 và `rawScore 0` → `score 0`.
- `canonicalPathId("thien_co") === "tinh_tuong_dao"`, `PATH_LABELS.tinh_tuong_dao === "Tinh Tượng"`, `PATH_LABELS[canonicalPathId("linh_van")] === "Thiên Cơ"`; save không chứa alias.
- Gate: `node tools/verify_review_batches.js`, `node tools/verify_progression_requirement_matrix.js`, `node tools/verify_dichi_deep.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| PATH-SEL-001 | `data/path_fate_relations.json:paths`, `js/engine.js:PATH_LABELS` | Khớp |
| PATH-SEL-002 | `js/engine.js:PATH_ID_ALIASES`, `canonicalPathId`, `PATH_LABELS` | Khớp (alias theo ID; không đổi code, thêm test nhãn) |
| PATH-SEL-003 | `js/engine.js:pathMatchSummary` (bỏ `clamp(…, 0, 10)`; Mệnh khớp forbidden → `leadHits = 0`; trả `rawScore`; `score = rawScore + daoBonus`); consumer `breakthroughRequirements` (dòng `requiredPathScore`), `availablePaths`, `fateSwapPreview` | Lệch |
| PATH-SEL-004 | `js/engine.js:breakthroughRequirements` | Khớp |
| PATH-SEL-005 | `js/engine.js:selectPath`, `availablePaths` | Khớp |
| PATH-SEL-006 | `js/engine.js:selectPath` | Khớp |
| PATH-SEL-007 | `js/engine.js:selectPath` (`pathFateGranted`) | Khớp |
| PATH-SEL-008 | `data/canh_gioi_tien_hiep.json` (cờ cấp 3/6/10/14) | Khớp |
| PATH-SEL-010 | `js/expansion.js:progressionNamespaceSnapshot`, `validateCanonicalNamespaces` | Khớp |
| PATH-SEL-011 | `js/expansion.js:transitionSecondaryPath`, `pathFusionAffinity`, `hybridPath` (chỉ kiểm `match ≥ 5` với đường chính; chưa +10% SAN) | Lệch |
| PATH-SEL-012 | `js/expansion.js:switchPathContext` chỉ gọi `transitionSecondaryPath` (thêm đường phụ, không đổi đường chính) | Lệch |
| PATH-SEL-013 | — | Thiếu |
| PATH-SEL-014 | `js/expansion.js:validatePathFusionCatalog` | Khớp |
