# CORE-PROGRESSION — TU VI, CẢNH GIỚI, CON ĐƯỜNG, DỊ THỂ VÀ NGHỀ

## 1. Phân lớp canonical

| Lớp | Ý nghĩa | State chính |
|---|---|---|
| Tu vi/cảnh giới | tiến triển sức mạnh và điều kiện mở | `player.exp`, `player.realmId`, `gameClock` |
| Con Đường | hướng vận mệnh/ritual/affinity | `player.pathId`, `pathRitualState` |
| Dị Thể | trạng thái dị hóa/thân thể đặc biệt | `player.tainted.vocation`, physique state |
| Nghề chính | nghề nghiệp cốt lõi duy nhất | `professionState.primaryId` |
| Nghề ẩn/phụ | nghề phụ mở bằng Cổ Tịch Tà Thần | `professionState.hiddenId` hoặc `player.hiddenProfession` |

Con Đường không phải Nghề. Dị Thể cũng không phải Nghề Ẩn. Không dùng một ID registry cho hai namespace.

## 2. Tu vi và cảnh giới

`cultivationTier(state)` đọc realm catalog; `computeStats` lấy multiplier/flat từ realm, Mệnh, origin, equipment, quan hệ và nghề. `gainExp`/`recordCultivationGain` cập nhật exp và ghi milestone. Không để UI tự tính exp requirement.

Đột phá gồm preview điều kiện, ritual state, commit thành công/thất bại. Điều kiện có thể gồm exp, Mệnh hiệu dụng, Mệnh thường, ratio, Con Đường, Neo Nhân Tính, Công Pháp cốt lõi, nghi thức và giới hạn corruption. Khi thất bại, chỉ áp dụng penalty đã định; không đổi realm.

## 3. Con Đường

Con Đường được chọn khi đạt điều kiện cảnh giới và match Mệnh. `path_fate_relations` là nguồn affinity. Chọn đường khóa `pathId`; đổi đường cần quest/ritual transition. Con Đường có thể có:

- nghi thức Gọi Mệnh;
- dựng Neo Nhân Tính;
- milestone theo cảnh giới;
- song tu/dung hợp nếu registry cho phép;
- Nghịch Hành Đạo hoặc Ngoại Đạo Giả với luật riêng;
- path debt/corruption/trial.

Ritual phải lưu từng bước, expected step, realm và failure log. Commit chỉ khi toàn bộ điều kiện đủ. Không ghi “đã hoàn thành” trước commit.

## 4. Dị Thể

Dị Thể là lớp thân thể/dị hóa độc lập, có trigger, lựa chọn, effect và trạng thái khóa. Nó có thể ảnh hưởng faction, corruption, attention, combat hoặc resistance nhưng không tự cấp Con Đường hay Nghề Ẩn.

Schema khuyến nghị: `physiqueId`, `stage`, `progress`, `choices`, `locked`, `source`, `effects`, `exclusionTags`. Resolver phải xác định Dị Thể có bị loại bởi origin/tainted immunity hay không.

## 5. Nghề chính và Nghề Ẩn

Flow canonical:

```text
Chưa chọn
  -> chọn Nghề chính
  -> khóa vĩnh viễn lựa chọn nghề thường
  -> dùng Cổ Tịch Tà Thần mở điều kiện Nghề Ẩn
  -> chọn Nghề Ẩn vào đúng một slot phụ
```

Ngay sau khi chọn nghề chính, `selectionLocked = true`; không được giữ trạng thái “đã có nghề chính nhưng vẫn chọn nghề thường khác”. Nghề ẩn chiếm slot phụ và không thay thế nghề chính. Thanh trạng thái chỉ hiển thị nghề chính trước khi mở khóa; sau khi mở hiển thị thêm nghề ẩn với nhãn phụ.

Nghề chính là Luyện Đan Sư, Trận Pháp Sư, Luyện Khí Sư, Tướng Sư hoặc registry tương ứng. Nghề ẩn mở bởi graph Cổ Tịch, chiếm một slot phụ, có action/cost/progression riêng. Việc mở Cổ Tịch không đồng nghĩa đã chọn Nghề Ẩn; phải có bước preview và commit.

## 6. Cổ Tịch và điều kiện nghề ẩn

Mỗi Cổ Tịch có ID, thứ tự graph, clue, trạng thái discovered/verified/collected, prerequisite và hidden profession mapping. `hiddenProfessionClue` không được trực tiếp cấp nghề nếu thiếu số lượng/độ xác thực cần thiết. Khi đủ graph, `hiddenProfessionChoices` mở danh sách hợp lệ; lựa chọn bị khóa sau commit.

## 7. Nghề và Công Pháp

Profession item có thể cấp mastery, mở action hoặc làm nguyên liệu. Công Pháp là năng lực chiến đấu/tâm pháp; nghề là hệ sản xuất/chuyên môn. Không dùng `professionId` để lookup technique. Modifier nghề đi qua `updateDerived`, còn mastery Công Pháp đi qua technique progress.

## 8. Chuyển đổi và rollback

Chọn path/profession/hidden profession cần validate trước. Nếu action thất bại, không đổi slot, không trừ Cổ Tịch và không ghi success log. Save cũ có field `professionId`/`hiddenProfession` phải migrate về `professionState` canonical, giữ alias đọc cũ nhưng chỉ ghi schema mới.

## 9. Tác động chéo

- Mệnh quyết định affinity và điều kiện Con Đường.
- Con Đường mở ritual và điều kiện đột phá.
- Dị Thể thay đổi tainted/faction/corruption, có thể cấm path hoặc nghề.
- Nghề chính/phụ ảnh hưởng action, vật phẩm, UI status và log.
- Cổ Tịch/khám phá map là nguồn mở nghề ẩn.
- Đột phá có thể khóa thêm lựa chọn path/ritual.

## Note chưa hoàn thiện

- **MỘT PHẦN**: cần chuẩn hóa toàn bộ tên field nghề giữa `player.hiddenProfession`, `professionState.hiddenId` và các save cũ.
- **MỘT PHẦN**: UI cần kiểm tra trực tiếp trạng thái khóa nghề sau reload, không chỉ lúc click.
- **THIẾT KẾ**: cần catalog đầy đủ effect riêng của từng Dị Thể và quy tắc loại trừ.
- **MỘT PHẦN**: một số nghề ẩn còn dùng text action thay vì DTO action canonical.
