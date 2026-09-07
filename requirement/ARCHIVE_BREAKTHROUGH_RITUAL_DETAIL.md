#### 6.4.1. Nghi Thức Đột Phá Phân Tầng Theo Cấp (chi tiết đầy đủ)

Nghi thức KHÔNG ép 5 bước cố định cho mọi cấp — số bước tăng dần theo độ khó của Cấp đích, mỗi bước
là 1 "cổng" (gate) độc lập, chỉ cổng đang active mới hiện nút trên Action Bar. Cảnh giới CHỈ commit
(tăng thật) sau khi TOÀN BỘ cổng bắt buộc của Cấp đích đã qua.

##### Bảng cấp/bước (ĐÃ CẬP NHẬT — Cấp 2 KHÔNG thuộc nghi thức này)

> Lưu ý quan trọng: Cấp 1→2 (Phàm Nhân → Luyện Khí) dùng cơ chế khai mạch riêng đã có từ trước (100
> EXP hoặc 1 trong 3 đan dược, KHÔNG điều kiện Mệnh Số — xem `character_creation_system.md` mục
> 2.2). Nghi thức phân tầng dưới đây CHỈ áp dụng từ Cấp đích 3 trở lên.

| Cấp đích | Số bước | Chuỗi cổng |
|---|---:|---|
| 3–4 | 2 | Gọi Mệnh → Đối Chiếu Con Đường |
| 5–7 | 3 | + Dựng Neo |
| 8–10 | 4 | + Vượt Dị Tượng |
| 11–13 | 5 | + Trả Giá |
| 14 | 5 + 1 thử thách riêng | giữ nguyên 5 cổng, CỘNG THÊM 1 thử thách cuối cùng bespoke (đánh bại 1 Tà Thần/Ngoại Đạo Giả — đã note là mốc đặc biệt ở `HE_THONG_HOP_NHAT.md` mục 6, KHÔNG dùng chung công thức Vượt Dị Tượng thường vì đây là trận chiến thật, không phải roll xác suất) |

> Chỉ đúng 1 cổng trong toàn chuỗi (Vượt Dị Tượng) có xác suất thất bại thật — 3 cổng còn lại
> (Gọi Mệnh/Đối Chiếu Con Đường/Dựng Neo) là gate nhị phân hoặc setup action, cộng thêm Trả Giá là
> xác nhận có điều kiện. Điều này giới hạn rủi ro ngẫu nhiên vào ĐÚNG 1 điểm duy nhất trong toàn bộ
> nghi thức, tránh cảm giác "random chồng random" gây ức chế cho người chơi.

##### Chi tiết từng cổng

**1. Gọi Mệnh** (`realm_gate`, mọi Cấp đích ≥ 3)
- Điều kiện: `currentExp >= requiredExp(targetLevel)` VÀ `effectiveFateScore >= minFateRequired(targetLevel)`
- Loại: deterministic — bấm nút, engine so ngưỡng, qua ngay nếu đủ.
- Nếu chưa đủ: nút hiện dạng khóa/mờ, tooltip liệt kê CHÍNH XÁC đang thiếu bao nhiêu (tái dùng
  `getBreakthroughBlockers()` đã có), KHÔNG cho bấm thử (tránh log rác các lần bấm chắc chắn fail).

**2. Đối Chiếu Con Đường** (`path_gate`, mọi Cấp đích ≥ 3)
- Điều kiện: `pathMatchScore >= threshold(targetLevel)`.
- Loại: deterministic.
- UI: liệt kê **blocker cụ thể** + gợi ý (tái dùng `suggestFateForRealmRequirement()` đã thiết kế) —
  ví dụ "Cần thêm 3 điểm tương hợp — Mệnh 'X' hoặc Công Pháp hệ 'Y' sẽ giúp tăng nhanh nhất".
- Nếu `targetLevel` trong khoảng 3–4: đây là cổng CUỐI CÙNG — qua cổng này xong, engine mở thẳng nút
  "Đột Phá" (không có Dựng Neo/Vượt Dị Tượng/Trả Giá ở nhóm Cấp này).

**3. Dựng Neo** (`anchor_gate`, Cấp đích ≥ 5)
- Điều kiện: nhân vật có ít nhất 1 Neo Nhân Tính đang active, cấp Neo tối thiểu tùy `targetLevel`
  (Cấp 5-7 chỉ cần **Neo địa điểm cơ bản** — dễ dựng nhất, ví dụ "nhận nơi này làm chốn quy về"; Cấp
  cao hơn đòi Neo loại người/vật phức tạp hơn — xem thang Neo đã định nghĩa ở mục 9 Neo Nhân Tính).
- Loại: setup action — nếu CHƯA có Neo hợp lệ, bấm nút mở 1 mini-flow chọn/xác nhận đối tượng Neo
  ngay tại chỗ (không rời màn hình Cảnh Giới); nếu ĐÃ có Neo hợp lệ từ trước, bấm là qua ngay.
- Nếu `targetLevel` trong khoảng 5–7: cổng CUỐI CÙNG, qua xong mở nút "Đột Phá".

**4. Vượt Dị Tượng** (`body_mind_check`, Cấp đích ≥ 8) — CỔNG DUY NHẤT CÓ ROLL THẬT
- Cơ chế: nhân vật đối mặt 1 biểu hiện Dị Tượng (ảo giác/tiếng vọng — nối trực tiếp "Tiếng Vọng Từ
  Ngoài Kia" ở `WORLDVIEW_ATMOSPHERE.md` mục 16, TÁI DÙNG không tạo nội dung trùng lặp).
- Công thức:
  ```
  successChance = baseChance(targetLevel) + (Aptitude - 50) × 0.5% + (NgoTinh - 50) × 0.3%
  // baseChance giảm dần theo targetLevel (Cấp 8 dễ hơn Cấp 10), tune số cụ thể khi cân bằng
  clamp successChance về [10%, 95%] (không bao giờ chắc chắn 100% hay 0% tuyệt đối)
  ```
- **Thành công**: qua cổng, log lại 1 dòng tường thuật ngắn (thắng được Dị Tượng).
- **Thất bại**: KHÔNG trừ Tu Vi/EXP đã tích — chỉ ghi log thất bại, roll thêm % (tăng theo
  `targetLevel`) khả năng bị trừ **3 Thanh Tỉnh** (SAN) như "cái giá của lần đối mặt hụt". Cổng vẫn ở
  trạng thái chưa qua, người chơi có thể bấm thử lại NGAY (không cooldown cứng), nhưng mỗi lần thử
  đều tốn Thanh Tỉnh theo xác suất trên — tạo áp lực tự nhiên không spam vô hạn.
- Nếu `targetLevel` trong khoảng 8–10: cổng CUỐI CÙNG, qua xong mở nút "Đột Phá".

**5. Trả Giá** (`cost_commit`, Cấp đích ≥ 11)
- Điều kiện: `currentSAN >= 5` (chi phí cố định 5 Thanh Tỉnh, không scale theo Cấp trong bản này —
  có thể tune lại nếu cần scale).
- Loại: xác nhận có điều kiện — nút CHỈ sáng khi đủ 5 Thanh Tỉnh; bấm xong trừ thẳng
  `currentSAN -= 5`, KHÔNG hoàn lại dù sau đó hủy không bấm "Đột Phá" (đây là "giá của sự chấp
  nhận", không phải giá của kết quả).
- Đây LUÔN là cổng cuối cùng cho Cấp 11–13 — qua xong mở nút "Đột Phá" thật. Cấp 14 CỘNG THÊM 1
  thử thách bespoke sau cổng này (xem ghi chú ở bảng cấp/bước phía trên), KHÔNG mở thẳng "Đột Phá"
  ngay sau Trả Giá như các cấp khác.
- Gợi ý mở rộng (đã note ở `WORLDVIEW_ATMOSPHERE.md` mục 16): tại cổng này có thể chèn lựa chọn 3
  nhánh Phớt Lờ/Lắng Nghe/Cự Tuyệt Bằng Ý Chí cho Cấp 8-11 thay vì chỉ trừ SAN đơn thuần — coi đây
  là điểm mở rộng tùy chọn, KHÔNG bắt buộc cho bản tối thiểu.

##### State Engine

```
state.flags.breakthroughRitual = {
  targetLevel: number,
  requiredGates: string[],        // tính 1 lần khi bắt đầu, theo bảng cấp/bước ở trên
  gatesPassed: string[],          // cổng nào đã qua
  currentGate: string | null,     // cổng ĐANG active — Action Bar CHỈ hiện đúng 1 nút này
  attemptLog: [
    { gate: string, timestamp, result: "pass"|"fail", sanCost: number|null }
  ],
  startedAt: timestamp
}
```
- Luồng nguyên tử: `realm_gate → path_gate → anchor_gate → body_mind_check → cost_commit`. Engine
  chỉ tính `currentGate` = cổng ĐẦU TIÊN trong `requiredGates` chưa nằm trong `gatesPassed`.
- Khi `gatesPassed.length == requiredGates.length` → `currentGate = null`, Action Bar đổi nút thành
  "Đột Phá" (nút commit thật, tách biệt khỏi các nút cổng) — bấm nút này mới thật sự tăng Cấp.
- Reset `state.flags.breakthroughRitual` về `null` sau khi Đột Phá thành công (chuẩn bị chuỗi mới
  cho lần Đột Phá kế tiếp lên Cấp tiếp theo).

##### Quy tắc UI Action Bar
- CHỈ hiện đúng 1 nút tương ứng `currentGate` — không hiện cả 5 nút cùng lúc dù đã biết trước chuỗi
  (giữ cảm giác từng bước, không gây rối mắt/ngợp thông tin).
- Mỗi nút có tooltip/subtext ngắn hiện NGAY trạng thái blocker nếu chưa đủ điều kiện bấm (đồng bộ
  nguyên tắc: không bao giờ để người chơi bấm vào 1 hành động chắc chắn thất bại mà không cảnh báo
  trước — trừ đúng cổng Vượt Dị Tượng, nơi bấm luôn CÓ THỂ fail vì bản chất là roll).

---

#### 6.4.2. Hướng Dẫn Người Chơi (chi tiết đầy đủ, ĐÃ CẬP NHẬT theo bảng mới)

Khi đạt mốc Tu Vi đủ, mở tab **Cảnh Giới**, khu điều kiện hiện sáng ĐÚNG 1 bước đang chờ xử lý theo
thứ tự cố định — làm lần lượt, không thể nhảy cóc hay đảo thứ tự. (Cấp 1→2 không qua nghi thức này,
xem ghi chú ở bảng cấp/bước.)

**Cấp 3–4 (2 bước):**
1. Bấm "Gọi Mệnh" — nếu đủ Tu Vi + Mệnh hiệu dụng, qua ngay.
2. Bấm "Đối Chiếu Con Đường" — nếu đủ điểm tương hợp, mở nút "Đột Phá".
> Không cần Neo, không cần vượt Dị Tượng, không trả giá gì thêm ở nhóm cấp này.

**Cấp 5–7 (3 bước):** thêm bước **Dựng Neo** sau Đối Chiếu Con Đường — nếu chưa có Neo, hệ thống
mở luôn màn chọn Neo cơ bản (1 địa điểm quen thuộc), xác nhận là qua.

**Cấp 8–10 (4 bước):** thêm bước **Vượt Dị Tượng** — đây là bước DUY NHẤT có thể thất bại thật. Thất
bại KHÔNG mất Tu Vi đã tích, nhưng có thể mất 3 Thanh Tỉnh — nên đảm bảo Thanh Tỉnh đủ cao (khuyến
nghị > 50%) trước khi thử bước này, và có thể bấm thử lại ngay nếu fail lần đầu.

**Cấp 11–13 (5 bước):** thêm bước cuối **Trả Giá** — cần đủ 5 Thanh Tỉnh mới bấm được; bấm xong trừ
thẳng Thanh Tỉnh (không hoàn lại), sau đó mới thấy nút "Đột Phá" thật sự xuất hiện.

**Cấp 14:** giữ nguyên 5 bước như Cấp 11-13, nhưng sau Trả Giá KHÔNG mở thẳng "Đột Phá" — thay vào
đó mở 1 thử thách riêng (đánh bại Tà Thần/Ngoại Đạo Giả), xem chi tiết ở `HE_THONG_HOP_NHAT.md`.

**Lưu ý chung:**
- KHÔNG THỂ bỏ qua bất kỳ bước nào hay bấm "Đột Phá" khi còn bước chưa qua (Action Bar sẽ không
  hiện nút Đột Phá cho tới khi `currentGate == null`).
- Mọi bước trừ Vượt Dị Tượng đều KHÔNG có yếu tố may rủi — cứ đủ điều kiện là qua, nên có thể chuẩn
  bị trước (tích Mệnh hiệu dụng, tăng điểm tương hợp Con Đường, dựng Neo, tích Thanh Tỉnh) trước khi
  bắt đầu chuỗi nghi thức để không bị kẹt giữa chừng.

---

#### 6.4.3. Hướng Dẫn Tân Thủ Theo Từng Cổng (First-Time Gate Tutorial) — MỚI

Vấn đề cần giải quyết: người chơi mới nhìn thấy tên cổng ("Dựng Neo", "Vượt Dị Tượng"...) sẽ KHÔNG
hiểu ngay cần làm gì cụ thể — tên cổng mang tính tường thuật/thẩm mỹ, không tự giải thích cơ chế.

##### Cơ chế: Modal giải thích LUÔN HIỆN MỖI LẦN ĐỘT PHÁ (đã đổi theo yêu cầu — KHÔNG còn chỉ hiện lần đầu)

```
state.flags.tutorialSeen = {}   // ĐÃ LOẠI BỎ cơ chế "chỉ hiện lần đầu" — không dùng field này nữa
```
- MỖI LẦN `currentGate` chuyển sang 1 giá trị mới (tức là mỗi lần người chơi tới lượt xử lý 1 cổng,
  dù đã từng qua cổng cùng loại ở lượt Đột Phá trước đó bao nhiêu lần), modal giải thích (nội dung ở
  dưới) TỰ ĐỘNG bật lên TRƯỚC KHI cho phép bấm nút xử lý cổng đó — không còn phụ thuộc đã xem hay
  chưa.
- Modal LUÔN hiển thị dữ liệu THẬT tại thời điểm đó (không phải text tĩnh cố định) — vì mỗi lần Đột
  Phá lên Cấp khác nhau, ngưỡng yêu cầu/blocker cụ thể sẽ khác nhau, nên việc hiện lại mỗi lần giúp
  người chơi luôn thấy đúng tình trạng hiện tại thay vì nhớ nhầm từ lần trước.
- Icon "?" cạnh tên cổng vẫn giữ nguyên — dùng để mở lại modal giữa chừng nếu người chơi lỡ đóng
  quá nhanh mà chưa đọc kịp.
- Tùy chọn (optional, không bắt buộc): có thể thêm 1 checkbox nhỏ "Không hiện lại ở lượt sau" trong
  modal — nếu người chơi CHỦ ĐỘNG tick, hệ thống mới ghi nhớ để bỏ qua auto-show cho ĐÚNG cổng đó ở
  các lượt Đột Phá tiếp theo; mặc định KHÔNG tick, tức là mặc định luôn hiện đúng như yêu cầu.

##### Nội dung modal giải thích cho từng cổng (viết bằng ngôn ngữ thường, không thuật ngữ hệ thống)

**Gọi Mệnh:**
> "Đây là bước kiểm tra CĂN BẢN — game sẽ tự so Tu Vi và Mệnh Số hiện tại của bạn với yêu cầu của
> cấp tiếp theo. Bạn KHÔNG cần làm gì thêm ở bước này ngoài việc tu luyện đủ và có đủ Mệnh Số tốt.
> Nếu nút đang khóa, xem dòng chữ nhỏ bên dưới nút — nó sẽ nói CHÍNH XÁC bạn còn thiếu bao nhiêu."

**Đối Chiếu Con Đường:**
> "Con Đường là hướng tu luyện bạn đã chọn (VD Kiếm Đạo, Đan Đạo...). Bước này kiểm tra xem Mệnh Số
> và Công Pháp bạn đang có có 'hợp' với Con Đường đó không. Nếu chưa đủ điểm, bấm vào dòng gợi ý
> bên dưới — game sẽ chỉ đích danh Mệnh Số hoặc Công Pháp nào giúp bạn tăng điểm nhanh nhất, và
> gợi ý luôn nơi có thể kiếm được thứ đó."

**Dựng Neo:**
> "Neo là 1 người/địa điểm/vật mà tâm trí bạn 'bám víu' vào để giữ mình không lạc lối khi sức mạnh
> tăng lên. Ở bước này, nếu bạn CHƯA có Neo nào, hãy bấm nút — game sẽ cho bạn chọn ngay 1 địa điểm
> bạn từng ghé qua làm Neo cơ bản (đơn giản, không cần chuẩn bị gì trước). Nếu bạn ĐÃ có Neo hợp lệ
> rồi, bấm nút là qua ngay, không cần làm gì thêm."

**Vượt Dị Tượng:**
> "Đây là bước DUY NHẤT có thể thất bại thật. Bạn sẽ đối mặt 1 hiện tượng kỳ lạ, và game sẽ roll
> theo Căn Cốt + Ngộ Tính của bạn (2 chỉ số này xem ở tab Trạng Thái). Nếu thất bại, bạn KHÔNG mất
> Tu Vi — chỉ có thể mất 1 chút Thanh Tỉnh (SAN) và có thể bấm thử lại ngay. Lời khuyên: nếu Thanh
> Tỉnh của bạn đang thấp (dưới 50%), nên nghỉ ngơi hồi Thanh Tỉnh trước khi thử bước này."

**Trả Giá:**
> "Bước cuối cùng trước khi Đột Phá thật sự — bạn cần hiến 5 điểm Thanh Tỉnh (SAN) như một lời cam
> kết. Số Thanh Tỉnh này KHÔNG lấy lại được dù bạn đổi ý sau đó, vì vậy chỉ bấm khi bạn thật sự sẵn
> sàng Đột Phá ngay sau đó. Nếu Thanh Tỉnh không đủ 5, hãy nghỉ ngơi hoặc dùng vật phẩm hồi Thanh
> Tỉnh trước."

##### Bổ sung: "Gợi Ý Nhanh" panel (rút gọn, luôn hiện, không cần bấm "?")

Ngay dưới tên cổng đang active, LUÔN hiện 1 dòng ngắn gọn tóm tắt "cần làm gì NGAY BÂY GIỜ" bằng
ngôn ngữ hành động cụ thể (không lặp lại lý thuyết trong modal), ví dụ:
```
Cổng đang active: Đối Chiếu Con Đường
Gợi Ý Nhanh: "Còn thiếu 3 điểm tương hợp → hãy học Công Pháp hệ Hỏa ở Phường Thị hoặc tìm Mệnh Số
              cùng hệ với Con Đường của bạn."
```
Dòng này sinh động theo dữ liệu THẬT của nhân vật tại thời điểm xem (không phải text tĩnh), tái
dùng đúng `getBreakthroughBlockers()` + `suggestFateForRealmRequirement()` đã có — không tạo tầng
logic mới, chỉ hiển thị lại output của 2 hàm đó ở vị trí dễ thấy hơn (ngay cạnh Action Bar thay vì
phải mở tooltip).

##### Acceptance
- MỌI lần Đột Phá (không chỉ lần đầu tiên chơi), khi tới lượt xử lý 1 cổng, modal giải thích PHẢI
  tự động hiện trước khi nút xử lý cổng đó có thể bấm được.
- Nếu người chơi đã tick "Không hiện lại ở lượt sau" cho 1 cổng cụ thể (tùy chọn optional), modal
  đó không tự động bật nữa NHƯNG icon "?" vẫn luôn bấm được để xem lại thủ công.
- "Gợi Ý Nhanh" luôn phản ánh ĐÚNG dữ liệu nhân vật hiện tại, không hiển thị gợi ý đã lỗi thời (VD
  đã đủ điều kiện rồi mà vẫn hiện "còn thiếu X").
