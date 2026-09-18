# Patch — Tương tác tổ chức và novel-style log

## Contract

- Tương tác organization phải đi qua `organizationInteract`, không mutate relation trực tiếp từ UI.
- `status` là read-only; các action còn lại trả kết quả `{ success, reason, data }`.
- Log player-facing không được lộ tên hàm, action ID, key runtime hoặc câu thông báo HUD.
- Log thành công phải ghi theo văn phong liên tục: địa điểm, hành động của nhân vật, tổ chức và trạng thái quan hệ sau cùng.
- Log dùng `narr` để đi qua pipeline `narrativeSafe`/`novelLogParagraphs`, vì vậy hiển thị cùng kiểu đoạn văn với các cảnh truyện.

## Đã chuẩn hóa

`organizationInteract` hiện ghi dạng:

> Tại [địa điểm] tại tọa độ [x, y], ngươi [hành động] cho [tổ chức]. Mối quan hệ hiện ở trạng thái [trạng thái].

Regression kiểm tra log có địa điểm/trạng thái và không chứa token kỹ thuật như `organizationInteract`.

## Gate

```text
node --check js/expansion.js
node --check tools/verify_game.js
node tools/verify_game.js
node tools/verify_log_narrative.js
```
