# Thiết kế map địa hình phân nhánh · Di chuyển ngẫu nhiên · Cthulhu Text RPG

Bản V2.5 thay thế thiết kế lưới 4 hướng cố định; bổ sung tên địa điểm và văn phong tiên hiệp. Ngày cập nhật: 09/10/2026.

> **Quy tắc duy trì từ 09/10/2026:** Mọi thảo luận liên quan thiết kế này phải được phản ánh vào file, không chỉ sửa ảnh hoặc trả lời trong chat. Yêu cầu mới sửa trực tiếp mục liên quan, đồng thời thêm bản ghi quyết định ở mục 21. Phân biệt yêu cầu người dùng, đề xuất thiết kế và điều cần đối chiếu code. Ảnh chỉ minh họa; file là đặc tả hiện hành. Trạng thái hiện tại: **đã triển khai phần lõi trên code game; còn thiếu preview cước trình chi tiết theo từng ứng viên và bộ WT01–WT13 độc lập**.

## 1. Mục tiêu và lựa chọn hình bản đồ

Phiên bản V2.5 — 09/10/2026. Phần map và cơ chế di chuyển được thay thế theo yêu cầu mới; giữ phong cách Cthulhu, cấu trúc panel, nhật ký, hành động và truyền tống đã thống nhất.

**Chọn: bản đồ địa hình phân nhánh với bố cục UI hữu cơ (organic local map).** Địa điểm rải tự nhiên, có khoảng trống xa–gần; các tuyến đã biết tạo nhánh và vòng nối. Tọa độ gameplay giữ nguyên, vị trí UI được rải lệch có seed để bỏ cảm giác hàng/cột. Không hiện bàn cờ, không vẽ toàn bộ 10.000 dot cùng lúc, không dùng cây phân cấp làm vị trí địa lý.

| Phương án | Đánh giá |
| --- | --- |
| Cây thuần túy | Rõ nhánh nhưng dễ làm sai khoảng cách, mất đường vòng và lặp địa điểm. Chỉ phù hợp cho lịch sử lựa chọn, không dùng làm map chính |
| Mạng node tự do bằng force layout liên tục | Dễ gây nhảy vị trí và khó định hướng; không dùng mô phỏng thả nổi mỗi lần mở map |
| Bản đồ địa hình với tuyến phân nhánh và độ lệch UI ổn định | Giữ dữ liệu tọa độ, hướng và cảm giác xa–gần tương đối; UI rải tự nhiên. Là phương án được chọn |

Trải nghiệm: **Đọc cảnh vật → chọn hướng → xem vùng có thể đến và khoảng chi phí → xác nhận đi → nhận kết quả thực tế.**

Ảnh đi kèm là concept mỹ thuật. Khoảng cách, xác suất và địa hình trong ảnh không phải dữ liệu để nhập vào engine. Khi triển khai, dùng tọa độ và dữ liệu thật, giảm độ nổi của tranh nền để ưu tiên việc đọc.

## 2. Hợp đồng thế giới và tọa độ

- Thế giới vẫn là Oxy 100×100. Minh họa dùng miền nguyên `0..99`; nếu engine dùng `1..100`, cấu hình min/max tương ứng, không dịch tọa độ save cũ.
- `+x` là Đông; `+y` là Bắc. Khi chiếu lên màn hình, trục y đảo chiều để Bắc nằm phía trên.
- Bốn hướng giờ là **ý định di chuyển**, không còn là bốn cạnh kề dài một ô. Một hành động có thể tiến 1–3 ô và lệch ngang 0–1 ô theo công thức dưới.
- Quy tắc cũ “không có đường chéo, một node chéo cần hai bước” bị thay thế. Đoạn di chuyển mới có thể xiên; không giả vẽ thành bậc thang để che điều này.
- Mỗi node tọa độ đều có tên được sinh bằng thuật toán và giữ ổn định. Node thường cũng có tên, không chỉ POI đặc biệt. Việc giới hạn số nhãn khi zoom xa là quyết định hiển thị, không có nghĩa những node khác không tồn tại hoặc không có tên.
- Mọi marker địa điểm là dot tròn. Không dùng hình sao, hành tinh hoặc vòng quỹ đạo; giữ hệ thống màu trạng thái của dự án.
- Không tự thêm tài nguyên mới. Thể lực, Thanh tỉnh, linh lực, thời tiết và trạng thái khám phá lấy từ engine.
- Giao diện không làm lộ tên, địa hình hoặc sự kiện bí mật chưa được phép biết.

## 3. Hai lớp tọa độ: gameplay chính xác, UI phân bố tự nhiên

### Nguyên tắc mới thay thế yêu cầu chiếu cứng trước đây

Người dùng chấp nhận xê dịch vị trí dot trên UI để bỏ hàng/cột, trong khi tọa độ thật trong code giữ nguyên. Không còn yêu cầu khoảng cách pixel phải tỷ lệ tuyệt đối với Oxy. Map thể hiện **khoảng cách tương đối**; số quãng đường/time thực lấy từ engine.

| Lớp | Dữ liệu | Dùng cho |
| --- | --- | --- |
| Gameplay | worldX, worldY, nodeId | Di chuyển, biên, địa hình, thời tiết, khoảng cách và chi phí |
| Trình bày | layoutX, layoutY theo nodeId | Vẽ dot, nối tuyến hiển thị, vùng highlight, nhãn và hit testing |

Không ghi layoutX/layoutY đè vào worldX/worldY. Click dot phải resolve nodeId, không lấy pixel suy ngược thành tọa độ gameplay.

### Rải lệch ổn định

```text
seedUI = stableHash(worldSeed, nodeId, layoutVersion)
(offsetX, offsetY) = boundedJitter(seedUI)
layoutX = worldX + offsetX
layoutY = worldY + offsetY
screenX = centerX + (layoutX - cameraLayoutX) * zoomScale
screenY = centerY - (layoutY - cameraLayoutY) * zoomScale
```

- Dùng seed UI riêng với RNG di chuyển và RNG tên. Mở map, đổi hướng, hover, zoom hoặc đổi panel không bốc lại offset.
- Điểm khởi đầu đề xuất: mỗi trục offset giới hạn ±0,3 ô nội bộ. Đây là tham số để thử bố cục, không phải luật gameplay hoặc chữ UI.
- Với giới hạn dưới 0,5 ô mỗi node, chênh lệch ít nhất một ô ở trục chính vẫn giữ thứ tự Đông/Tây hoặc Bắc/Nam; các node cùng hàng/cột được phép lệch lên/xuống/trái/phải nhẹ.
- Không cam kết thứ tự xa–gần tuyệt đối giữa những node có khoảng cách gần bằng nhau. Giữ cảm giác nhóm gần/nhóm xa; chi phí không tính từ hình vẽ.
- Nếu vẫn chật, tăng zoom/không gian map hoặc dời nhãn trước, không tự tăng jitter vô hạn. Không chạy force layout làm trôi cả cụm ở mỗi frame.
- Offset phụ thuộc nodeId và seed thế giới, không phụ thuộc hướng đang chọn, node trung tâm, số node đang thấy hoặc kích thước màn hình. Node đi ra rồi vào viewport vẫn có cùng vị trí trong hệ tọa độ trình bày.
- Camera bám layout position của nhân vật. Khi chuyển vị trí, camera dịch chứ không sắp xếp lại những node còn lại.
- Nếu cần bộ giải tránh va chạm, dùng bước tiền xử lý deterministic, thứ tự node ổn định, giới hạn displacement và lưu cache theo layoutVersion; không giải lại dựa trên sáu node của riêng hướng đang chọn.

### Sáu địa điểm trong vùng hướng đi

Sáu dot không còn là bảng 2×3. Chúng nằm rải cao thấp và cách nhau không đều, nhưng vẫn ở phía hướng tiến chủ đạo. Tên và trạng thái không đổi. Tô một vùng bất quy tắc bao quanh vị trí hiển thị của tập node có thể tới; lớp này không tạo node mới và không quyết định membership bằng việc dot nằm trong polygon.

Một node không thuộc tập có thể tình cờ nằm trong đường bao do hình dạng bố cục: chỉ những node thực sự thuộc tập mới được nhấn tên/dot và xuất hiện trong danh sách. Hình bao mang tính gợi ý, danh tính node mới là chuẩn.

### Khoảng cách, địa hình và tuyến hiển thị

- La bàn giữ hướng tổng thể; “Gần — Xa” chỉ là chú giải định tính, không phải thước pixel chính xác. Không dùng thước ô/km chính xác cho layout đã biến dạng.
- Dự liệu hành trình tính độ dời/quãng đường từ tọa độ và tuyến gameplay thật. Tuyệt đối không dùng độ dài đường cong trên UI tính time.
- Tuyến hiển thị nối các layout position theo kết nối thực, có thể làm cong nhẹ. Bản đồ trình bày không tạo cạnh hoặc khả năng đi mới.
- Rừng/sương minh họa có thể dùng nền nghệ thuật. Sông, vách núi, cầu và vùng weather mang ý nghĩa gameplay phải được chiếu/biểu diễn nhất quán với vị trí marker đã dịch.
- Nếu không có phép biến dạng chung cho địa hình, biểu diễn nguy cơ quan trọng bằng dấu/nhãn gắn node và tuyến; không vẽ con sông “chính xác” gây hiểu nhầm marker đang ở bờ khác. Dữ liệu engine luôn quyết định khả năng qua sông.
- Minimap thế giới có thể dùng tọa độ thật và thước chính xác vì là bề mặt khác; đánh dấu rõ local view chỉ biểu diễn tương đối.
- Điểm sinh ra/trạm ghim ngoài viewport hiện chỉ hướng, không kéo dot vào màn hình để giả khoảng cách.

### Mật độ

Gợi ý 25–40 nhãn nổi bật khi đủ không gian, ưu tiên vị trí hiện tại, toàn bộ điểm có thể tới, node đang xem và mốc ghim. Tất cả node vẫn có tên. Không thêm dot giả, không cố hiện cả 10.000 node. Mobile dùng danh sách hỗ trợ khi không đủ chỗ cho tên.

## 4. Công thức di chuyển ngẫu nhiên theo bốn hướng

### Cấu hình mặc định bám yêu cầu

Mỗi lần cam kết hành động, xét `a ∈ {1,2,3}` và `b ∈ {0,1}`. Trong khu vực trống, các tổ hợp có xác suất bằng nhau.

| Hướng | Điểm đến ứng viên | Ý nghĩa |
| --- | --- | --- |
| Đông | `(x+a, y+b)` | Tiến Đông 1–3, lệch Bắc 0–1 |
| Tây — đề xuất bổ sung | `(x-a, y+b)` | Tiến Tây 1–3, lệch Bắc 0–1 |
| Bắc | `(x+b, y+a)` | Tiến Bắc 1–3, lệch Đông 0–1 |
| Nam | `(x+b, y-a)` | Tiến Nam 1–3, lệch Đông 0–1 |

Bắc/Nam dùng tên biến khác so với ví dụ của người dùng nhưng cùng tập kết quả. Công thức Tây là giả định thiết kế do chưa được chỉ định; cấu hình riêng để dễ đổi.

**Thiên lệch cần biết:** Đông/Tây đều có xu hướng lệch Bắc; Bắc/Nam đều có xu hướng lệch Đông. Đi Đông rồi Tây không bảo đảm quay lại điểm cũ. Ở vùng trống, chọn đều bốn hướng tạo độ trôi kỳ vọng `(+0,25; +0,25)` mỗi hành động. Đây là hệ quả của công thức đang giữ, không phải lỗi render.

Phương án tùy chọn nếu sau này muốn cân đối: giữ tiến chính 1–3, dùng độ lệch phụ `{-1,0,+1}` với trọng số `{0,25; 0,50; 0,25}`. **Không kích hoạt mặc định hoặc tự sửa công thức người dùng.**

### Điểm đến và tuyến đi là hai việc khác nhau

1. Lập tối đa sáu tọa độ ứng viên của hướng được chọn.
2. Loại tọa độ ngoài biên.
3. Với từng ứng viên còn lại, kiểm tra toàn tuyến đi và điều kiện địa hình.
4. Loại tuyến không hợp lệ; loại tọa độ trùng nếu có từ adapter.
5. Bốc đều một lần trong tập hợp lệ; không dùng thời gian/độ khó làm trọng số ngầm.
6. Lưu kết quả cùng action ID trước khi bắt đầu hành trình; không bốc lại khi render, reload hay bấm nút lặp.

Nếu có `k` điểm hợp lệ, xác suất mỗi điểm là `1/k`. Nếu địa hình và biên lọc mất điểm, phân bố không còn như vùng trống. Việc lọc hoặc bốc chỉ thay tập kết quả, tuyệt đối không sinh lại tên node. Không lấy x và y độc lập sau khi lọc vì sẽ tạo điểm không thuộc tập hợp lệ.

Chạm hướng hoặc xem preview không dùng RNG và không tiêu hao tài nguyên. Đổi hướng không đổi kết quả cho một hành động đã cam kết.

## 5. Vùng biên, chướng ngại và địa hình

### Biên thế giới

Dùng **lọc trước, bốc sau**. Không clamp, không wrap sang bên kia thế giới, không bật ngược hướng và không reroll vô hạn.

Ví dụ miền `0..99`:

| Vị trí và hướng | Kết quả |
| --- | --- |
| `(98,50)` → Đông | Chỉ `(99,50)` hoặc `(99,51)` nếu đường thông; mỗi điểm 1/2 |
| `(99,50)` → Đông | Không có ứng viên; nút bị khóa, ghi “Đã tới rìa Đông” |
| `(50,99)` → Đông | Chỉ y=99; x có thể 51,52,53 |
| `(99,99)` → Tây | Chỉ `(98,99)`, `(97,99)`, `(96,99)` |
| `(99,99)` → Nam | Chỉ `(99,98)`, `(99,97)`, `(99,96)` |
| Mọi hướng đều không hợp lệ | Hiện nguyên nhân và hành động khả dụng từ engine; không tạo đường thoát giả |

Chọn hướng không có kết quả không mất thời gian/thể lực. UI thu hẹp vùng có thể đến theo biên và ghi “Bị giới hạn bởi rìa thế giới”.

### Kiểm tra trên toàn đoạn đường

V1 đề xuất đi theo đoạn thẳng từ tâm tọa độ gốc tới tâm ứng viên, với kiểm tra giao cắt địa hình. Bốn hướng là hướng tiến chủ đạo nên đoạn xiên được phép.

- Không chỉ kiểm tra ô đích. Dùng traversal/supercover để phát hiện mọi ô/vật cản mà đoạn đi giao cắt.
- Tiếp xúc góc chặn phải có quy tắc nhất quán: mặc định bảo thủ, không lách giữa hai ô không thể đi. Những ô chỉ chạm góc có chiều dài 0 không bị tính thêm time.
- Nếu engine chưa hỗ trợ đoạn xiên, cần adapter tuyến thực và phép đo lại quãng đường; không âm thầm giả thành cạnh cũ.
- Không tự đi vòng qua núi ở V1. Nếu muốn đường vòng, đó là một tuyến có geometry, độ dài và chi phí riêng; không gọi độ lệch thẳng 1–3 ô là tổng quãng đường vòng.

### Địa hình đề xuất để cân bằng sau

Các hệ số sau là ví dụ, phải đối chiếu cơ chế hiện có trước khi áp dụng:

| Địa hình | Hệ số time gợi ý | Điều kiện |
| --- | --- | --- |
| Đường mòn | 1,0 | Đi bình thường |
| Đồng cỏ | 1,1 | Đi bình thường |
| Rừng rậm | 1,5 | Chậm, ảnh hưởng tầm nhìn theo engine |
| Đồi dốc | 1,7 | Chậm, thể lực theo engine |
| Đầm lầy | 2,2 | Có thể cần điều kiện theo luật hiện có |
| Vách núi | Không qua được | Cần tuyến/cơ chế vượt chướng ngại thật |
| Sông | Không qua mặc định | Chỉ qua cầu/đò/bơi nếu engine có và cho phép |

Thời tiết không làm vật cản cứng trở nên đi được. Cầu đóng, sông lũ, đường sạt là điều kiện khả dụng riêng, không biểu diễn bằng hệ số vô hạn.

## 6. Quãng đường, time và cơ chế thời tiết

### Phân biệt ba đại lượng

- **Một hành động**: một lần chọn hướng và cam kết kết quả ngẫu nhiên.
- **Độ dời**: `sqrt(dx²+dy²)`, mặc định trong khoảng `1..sqrt(10)` ô trước lọc.
- **Quãng đường thực đi**: tổng độ dài các đoạn hành trình. Với V1 đi thẳng, bằng độ dời; khi có vòng tránh, lớn hơn.

Không tiếp tục dùng nhãn “2 bước” cho một hành động ngẫu nhiên chỉ vì nó dịch hai ô.

### Tính chi phí theo từng phần đường

```text
T = Σ [độ_dài_đoạn_i × thời_gian_cơ_sở_mỗi_ô
       × hệ_số_địa_hình_i × hệ_số_thời_tiết_i(t)]
```

Đây là đề xuất kết hợp nếu engine chưa có công thức tương đương. Nếu hệ số hiện tại đã bao gồm tương tác mưa + bùn, không nhân thêm lần nữa. Điểm tích hợp duy nhất trả về chi phí cuối cùng, nguyên nhân và dữ liệu preview để UI/engine không tính khác nhau.

Ví dụ chỉ để minh họa ảnh: cơ sở 2 phút/ô, toàn đoạn rừng ×1,5, mưa ×1,25. Sáu kết quả hướng Đông có thời gian `3,75 × sqrt(a²+b²)` phút, min 3,75 và max khoảng 11,86. Các số 3,75–11,86 phút chỉ là ví dụ kỹ thuật, không đưa thành bảng chỉ số trên UI chính. Phần “Dự liệu hành trình” có thể hiện khoảng thời gian trong đơn vị game đã xác định. Không tự đổi phút sang khắc/canh nếu chưa định nghĩa tỷ lệ; không dùng giá trị làm tròn để kiểm tra tài nguyên.

Thể lực dùng hàm hiện có theo quãng đường và địa hình; không mặc định lấy thời gian nhân hệ số để trừ thể lực. Thanh tỉnh không tự mất vì đổi theme.

### Đồng bộ thời tiết đang có

**Trace chi tiết bắt buộc:** xem mục 22 với chuỗi W01–W10, nguồn hệ số, công thức, bản ghi preview/thực tế và ca nghiệm thu. Không chỉ dùng câu cảnh báo thời tiết trên UI thay cho tích hợp cost trong movement.

- Giữ nguồn dữ liệu, luật dịch chuyển và hệ số thời tiết hiện tại. Dùng adapter để hỏi thời tiết tại vị trí và thời điểm đi qua.
- Nếu thời tiết cập nhật theo tick thời gian, chia hành trình tại các mốc tick và ranh giới địa hình, tính từng đoạn bằng cùng game clock.
- Nếu engine chỉ cập nhật theo lượt hành động, V1 giữ weather snapshot trong một hành động rồi cập nhật ở cuối lượt. Ghi rõ giới hạn này; không tự cập nhật bão một lần mỗi ô hoặc vừa theo time vừa theo lượt.
- Preview cho khoảng min–max trên các kết quả có thể hiển thị, ghi “Ước tính” nếu thời tiết tương lai không chắc chắn.
- Với dữ liệu chưa khám phá, không hiển thị số lượng ứng viên bị chặn/xác suất thật hoặc nguyên nhân bí mật. Hiện vùng khả dĩ theo tri thức nhân vật và nhãn “Địa hình chưa rõ”; tập bốc thực tế vẫn được engine kiểm tra.
- V1 không bốc lại để chọn kết quả rẻ hơn khi người chơi thiếu thể lực. Chỉ cho cam kết nếu đủ mức trần chi phí an toàn do engine kiểm tra; nếu không đủ thì khóa và đề nghị hồi phục. Với vùng chưa rõ, dùng trần bảo thủ công khai, không lộ dữ liệu bí mật qua tooltip.
- Nếu điều kiện thay đổi trong hành trình làm tăng chi phí vượt mức đã chấp nhận hoặc chặn tuyến: dừng tại vị trí an toàn đã hoàn tất, tính đúng phần đã đi, không bốc điểm mới. Hiện tiếp tục/quay lại chỉ khi hợp lệ.
- Nếu save chỉ lưu tọa độ nguyên, chia đoạn tại các điểm nguyên trên đoạn (`gcd(abs(dx),abs(dy))`); mỗi đoạn giữa hai điểm nguyên là một phần nguyên tử được kiểm tra trước. Nút Dừng có hiệu lực tại điểm an toàn kế tiếp; không tạo tọa độ phân số vào save. Dùng transient position cho animation nếu cần.
- Kiểm tra trước mỗi phần nguyên tử phải bao quát tick thời tiết dự báo trong phần đó; nếu engine không bảo đảm được, dùng snapshot/lock đã nêu. Không hoàn tác một đoạn đã trả phí hoặc âm thầm cho vượt vật cản.

## 7. Mỹ thuật Cthulhu tiết chế

### Bảng màu bề mặt đề xuất

| Vai trò | Màu gợi ý |
| --- | --- |
| Nền vực tối | `#080F10` |
| Mặt panel | `#111C1C` |
| Đường phân cách | `#344443` |
| Chữ chính màu giấy ngà | `#E8E0CC` |
| Chữ phụ | `#AFBDB7` |
| Đồng cổ cho CTA | `#C8AD6F` |
| Xanh ngọc cho chi tiết không khí | `#72AAA4` |
| Hổ phách cảnh báo | `#E4B965` |

Đây là palette bề mặt, không phải yêu cầu thay toàn bộ màu trạng thái node hiện có. Ánh xạ màu thực tế phải giữ nhất quán với game và kiểm tra tương phản khi triển khai.

### Chất liệu và trang trí

- Hoa văn xúc tu, ký tự cổ và vết khắc dùng ở góc ngoài; không len qua dòng chữ, nút hoặc node.
- Giấy/đá cũ chỉ là texture rất nhẹ; mặt đọc văn bản gần như phẳng.
- Cảnh núi, tháp và sương ở rìa map có độ nổi thấp hơn tên địa điểm.
- Không cần hình Cthulhu khổng lồ. Nỗi bất an đến từ khoảng trống và mô tả: “Tiếng gõ vẫn tiếp tục sau khi ngươi dừng bước”.
- Không thêm con mắt, xúc tu hoặc ngôi sao làm marker thay dot tròn.
- Không rung màn hình, chớp sáng hay làm chữ méo theo Thanh tỉnh. Nếu có cơ chế này, biểu đạt bằng nội dung và dấu hiệu ngoại vi; số liệu và nút vẫn rõ.

### Typography

- Tiêu đề dùng serif có đủ dấu tiếng Việt; nội dung dài và dữ liệu dùng sans-serif hỗ trợ tiếng Việt.
- Nội dung 16–18px, line-height 1,55–1,7; nhãn map ưu tiên 13–14px. Không dùng 11px cho thông tin thiết yếu.
- Đoạn truyện khoảng 55–75 ký tự mỗi dòng khi đủ không gian.
- Font trang trí chỉ dùng tiêu đề ngắn; không dùng cho tooltip, nhật ký dài hay số liệu.
- Tương phản mục tiêu: chữ thường ≥4,5:1, chữ lớn ≥3:1, dấu focus và điều khiển thiết yếu ≥3:1.

## 8. UX/UI map mới và lời dẫn tiên hiệp

### Tên màn hình và bố cục

- Tiêu đề lớn **LÂN CẬN**. **Thiên đồ** chỉ là bản đồ thế giới, xuất hiện như nút/link điều hướng riêng; không làm tiêu đề map địa phương hoặc một cấp con của breadcrumb địa điểm.
- Breadcrumb địa phương: **Trung Vực / Truyền Pháp Các**.
- Giữ map trái khoảng 62–68%, panel phải 32–38%, nhật ký và action phía dưới, truyền tống thu gọn. Không sửa lại các phần đã được duyệt.
- Chỉ số Thanh tỉnh nếu đã tồn tại vẫn dùng dữ liệu thật. Nội dung hướng đi dùng văn phong tiên hiệp, không thành bảng giải thích thuật toán.

### Chọn hướng

Bốn nút Bắc/Tây/Đông/Nam chỉ chọn ý định. Nếu dùng tên Tây hành/Nam hành/Bắc hành cho nút chọn hướng thì vẫn chỉ chọn hướng, không tự di chuyển. Cả bốn hướng dùng cùng quy tắc ở mục 20. Khi chọn Đông:

1. Nhấn nhẹ vùng chứa các node có thể tới trên map; nhãn vùng **Những chốn có thể tới**.
2. Dùng lại dot và tên của từng node hiện hữu. Không thêm một lớp sáu node mới, không biến sáu node thành chấm vàng vô danh.
3. Giữ màu khám phá đã có, thêm nhấn phụ vào tên/nền vùng. Dot hiện tại vẫn rõ nhất và tách khỏi mũi tên hướng.
4. Panel hiện cùng danh sách địa danh như map. Tên dài được xuống dòng hoặc rút gọn có tooltip; không dùng số 1–6 thay tên.
5. Bấm tên trong danh sách làm focus dot tương ứng và mở mô tả; không chọn chắc chắn nơi đáp xuống.
6. Chỉ **Khởi hành về Đông** mới bốc kết quả và thực hiện hành động.

Vùng highlight là lớp nhìn, không phải vùng mới được tạo. Đổi hướng chỉ thay lớp nhấn và danh sách; tọa độ thật, vị trí layout đã seed và tên giữ nguyên. Tối đa sáu kết quả trong cấu hình hiện tại, có thể ít hơn do biên/đường chặn; không thêm điểm cho đủ sáu.

### Mẫu panel hướng Đông

**Dõi về phía Đông**  
**ĐÔNG HÀNH**

> Rừng già khuất trong mưa. Men theo lối cũ về phía đông, ngươi có thể dừng chân ở một trong những chốn dưới đây.

**Những chốn có thể tới**

- Tùng Ảnh Lâm
- Hàn Yên Khê
- Thanh Đằng Pha
- Cổ Sam Lĩnh
- Vụ Ẩn Cốc
- Tịch Phong Nhai

> Mưa nặng hạt, đường rừng lầy lội. Chuyến đi e sẽ lâu hơn thường lệ.

**Dự liệu hành trình ›** — nội dung mở theo nhu cầu, gồm thời gian và hao tổn dự kiến trong đơn vị gameplay thật.

CTA: **Khởi hành về Đông**. Hành động phụ: **Thôi xét**.

Các tên trên chỉ là dữ liệu minh họa. Khi triển khai, đọc tên từ cùng catalog node với phần map, không hardcode danh sách này.

### Chữ trên UI và dữ liệu nội bộ

Không hiện “Tiến 1–3 ô”, “Lệch Bắc 0–1 ô”, “Điểm đến: Ngẫu nhiên”, “RNG”, “ứng viên”, “hệ số”, “tọa độ” trong panel chính. Các công thức vẫn ở phần kỹ thuật của tài liệu và chế độ debug cho dev.

Giữ sự rõ ràng: câu “có thể dừng chân ở một trong những chốn dưới đây” truyền đạt việc chưa chốt đích. Không dùng thơ văn khiến người chơi hiểu nhầm sẽ đến đúng địa điểm vừa bấm.

Phần **Dự liệu hành trình** không giấu thông tin quyết định: mở được trước cam kết; dùng nhãn “Cước trình”, “Hao tổn thể lực”, “Trở ngại”. Số tài nguyên và thời gian phải chính xác theo engine, có khoảng khi cần. Đơn vị chưa có quy đổi thì dùng đơn vị gameplay đang tồn tại, không tự gán canh/khắc/dặm. Khi thiếu tài nguyên hoặc chi phí tăng, thông báo phải hiện ngay ngoài vùng thu gọn.

### Trạng thái cần có

| Trạng thái | Câu chữ minh họa / hành vi |
| --- | --- |
| Chưa chọn hướng | “Ngươi dừng bước, đưa mắt nhìn bốn phía.” |
| Rìa Đông | “Phía đông đã tới tận cùng cõi này. Hãy chọn lối khác.” |
| Đường bị chặn đã biết | “Vách đá dựng đứng chắn lối, chưa thể qua.” |
| Chưa đủ thể lực | “Thể lực chưa đủ để lên đường.” Kèm mức thiếu theo dữ liệu thật |
| Đang đi | “Đang men đường về phía đông…”; khóa cam kết trùng |
| Dừng | “Dừng chân” có hiệu lực tại điểm an toàn kế tiếp |
| Đến nơi | “Vượt qua màn mưa, ngươi đặt chân tới Tùng Ảnh Lâm.” Tên lấy từ node thật |
| Không có nơi đặt chân hợp lệ nhưng chưa rõ nguyên nhân | “Chưa tìm được lối đi về phía này.” Không lộ vật cản bí mật |

Chọn landmark ngoài tập chỉ xem mô tả và hướng tương đối; không hứa một lần khởi hành sẽ đến đó. V1 không dùng Dijkstra cũ để tự đi tới đích chắc chắn. Nếu có chế độ đi đường đã biết thì thiết kế thành cơ chế riêng.

## 9. Dot, nhãn và thời tiết trên nền địa hình

| Trạng thái | Dấu hiệu bổ sung ngoài màu |
| --- | --- |
| Hiện tại | Dot lớn hơn, tên nổi rõ, nhãn “Bạn ở đây” khi cần |
| Đã thăm | Dot đặc |
| Đã biết, chưa thăm | Dot rỗng |
| Chưa ghé | Vẫn có tên đã sinh theo quy tắc hiển thị; mô tả và sự kiện có thể chưa biết |
| Bị chặn đã biết | Khóa nhỏ bên tên, thông tin trong panel |
| Chốn có thể tới | Chính dot của node hiện hữu được nhấn phụ; không tạo dot/POI bản sao |
| Có truyền tống | Ký hiệu nhỏ bên tên, không vòng quỹ đạo |

Giữ logic màu hiện có. Vùng ứng viên dùng lớp nhấn phụ; không đổi tất cả landmark thành màu vàng/đỏ theo ảnh concept.

Tên ưu tiên: vị trí hiện tại, toàn bộ node có thể tới theo hướng đang chọn, node đang xem, mốc ghim, địa điểm gần có liên quan. Dời nhãn trước khi thay bố cục; dot dùng layout position đã seed, không dịch tùy tiện mỗi lần tránh chữ. Có chế độ danh sách địa điểm cho bàn phím và khi mật độ cao.

Thời tiết hiển thị thành sương/contour mềm theo vùng thực, không còn hatch ô vuông. Model thời tiết nội bộ vẫn giữ nguyên. Nhãn gọn **Mưa lớn · Trôi về Tây** khi có dữ liệu; chi tiết mở theo nhu cầu. Không vẽ hạt mưa liên tục lên chữ hoặc CTA.

Mỹ thuật địa hình không tự quyết định khả năng đi: cây trang trí không phải vật cản, sông minh họa phải khớp lớp dữ liệu khi triển khai. Vùng sương nhìn thấy không được coi là bản đồ hazard chính xác nếu không có dữ liệu hỗ trợ.

## 10. Nhật ký và hành động cho text RPG

**Ví dụ dòng kể chuyện tại vị trí hiện tại:**

> Gió lạnh lùa qua Truyền Pháp Các. Phía đông, những phiến đá cổ khẽ rung như đang thở.

**Dòng trạng thái riêng:**

> Bạn vẫn ở Truyền Pháp Các. Ngươi dõi mắt về phía đông, vẫn chưa rời Truyền Pháp Các.

Sau khi thực sự đến một địa điểm mới ghi tên địa điểm đó; nếu dừng ở node thường, dùng tên đã sinh của chính node đó và mô tả cảnh vật, không gán tên POI gần đó. Ví dụ: “Men theo triền đá ướt, ngươi đặt chân tới Hàn Yên Khê.” Tên lấy từ node dừng thực tế, không đoán theo POI gần nhất. Ghi thời gian và tài nguyên thực tế, chỉ trừ một lần qua engine. Việc chọn hướng hoặc xem địa điểm không sinh log giả như đã di chuyển.

- Mỗi sự kiện ngắn 1–3 câu; kết quả thể lực/thời gian hiển thị ở dòng phụ, không chen công thức giữa câu truyện.
- Chỉ tự cuộn khi người chơi đang ở cuối nhật ký. Nếu đang đọc cũ, hiện “Có diễn biến mới”.
- Khi xem một đích xa, các nút Quan sát/Lắng nghe/Nghỉ ngơi vẫn thuộc **vị trí hiện tại** và phải ghi rõ. Không cho tương tác từ xa ngoài khả năng engine.
- Đây là tên hành động gợi ý; chỉ hiện nếu đã tồn tại và đang khả dụng. Không thêm chức năng rỗng để giống concept.
- Khi chiến đấu hoặc sự kiện cần lựa chọn, ưu tiên vùng truyện và các lựa chọn đó, tạm dừng hành trình.

## 11. Truyền tống

- Thanh đóng: **Truyền tống · 1 điểm đã mở**; khi rỗng: **Chưa có điểm truyền tống — khám phá và kích hoạt trạm để mở khóa** nếu đúng luật game.
- Drawer mở chứa tên đích, điều kiện, chi phí thật và CTA riêng **Truyền tống đến…**.
- Phân biệt rõ “đi bộ đến trạm” và “truyền tống qua trạm”; số bước đi bộ không phải chi phí teleport.
- Không suy ra khả năng truyền tống chỉ vì đã biết tên trạm. Engine quyết định có cần đứng tại trạm, đã kích hoạt và đủ linh lực hay không.
- Drawer không tự bật khi chọn node. Khi mở phải quản lý focus, có nút đóng và trả focus về nút gọi.

## 12. Responsive, khả năng đọc và điều khiển

- Desktop giữ map và panel hai cột; khi chật chuyển một cột. Không ép nhỏ chữ để giữ bố cục.
- Mobile: map khoảng 40–50% chiều cao màn hình; bốn nút hướng và CTA ở vùng dễ chạm. Chọn hướng mở sheet gọn, không che hết vùng ứng viên.
- Dot có thể nhỏ nhưng vùng chạm khoảng 44×44 CSS px, tránh chồng nhau; hỗ trợ danh sách địa điểm thay thế.
- Mũi tên bàn phím chọn hướng khi focus trong điều khiển bản đồ; Tab đến CTA, Enter để cam kết. Escape hủy preview/đóng sheet. Không tự di chuyển bằng phím mũi tên và không bắt phím khi nhập văn bản.
- Pan/zoom không thay kết quả RNG hoặc chi phí. Có nút Về vị trí và thước tỷ lệ cập nhật theo zoom.
- Trình đọc màn hình nhận hướng, khoảng cách, chi phí ước tính và kết quả thật; không đọc lại toàn bộ map mỗi frame.
- Reduced motion tắt dịch camera/sương động không thiết yếu. Không chớp sáng, không làm chữ méo theo Thanh tỉnh.
- Đọc được tên, CTA và chi phí ngay cả khi giảm nền địa hình về màu phẳng. Tương phản và typography theo mục 7.

## 13. Triển khai theo ưu tiên

### P0 — Hợp đồng engine và hành vi

1. Xác định quy ước tọa độ, game clock, save, terrain và weather adapter hiện có.
2. Thêm bộ sinh tập ứng viên bốn hướng, lọc biên, kiểm tra toàn đoạn và RNG chỉ tại commit.
3. Tính quãng đường/time theo cùng một dịch vụ cho engine và preview; xử lý chi phí ẩn, thiếu tài nguyên và chống thao tác kép.
4. Lưu action ID, điểm đến đã bốc và tiến trình để reload không reroll hoặc trả phí hai lần.
5. Thay CTA đích cố định thành CTA hướng; xử lý dừng tại điểm an toàn.

### P1 — Map không bàn cờ

1. Bỏ lưới/dot nền; thêm lớp layout coordinates với bounded seeded jitter, tách hoàn toàn khỏi world coordinates.
2. Thêm địa hình nhẹ, tuyến thực phân nhánh, chú giải xa–gần tương đối, la bàn và vùng kết quả theo layout positions.
3. Giữ các panel đã ổn; cập nhật nội dung theo trạng thái random.
4. Mobile, bàn phím, danh sách địa điểm và chế độ giảm hiệu ứng.

### P2 — Hoàn thiện

Tối ưu mật độ nhãn, minimap, dự báo thời tiết theo khả năng engine. Chế độ đi theo đường đã biết hoặc drift đối xứng là mở rộng riêng, không lẫn vào V1.

## 14. Tiêu chí nghiệm thu

### Đúng cơ chế

- Vùng trống tại (47,52), Đông tạo đúng sáu điểm: (48,52), (48,53), (49,52), (49,53), (50,52), (50,53).
- Từng hướng đúng bảng công thức; trục Bắc trên màn hình không bị đảo do tọa độ UI.
- Các ví dụ biên trong mục 5 đúng; không xuất hiện tọa độ ngoài miền, tự wrap/clamp hoặc đi ngược hướng đã chọn.
- Tên sinh ổn định theo world seed và node ID; preview/zoom/đổi hướng/reload không đổi tên. Map, panel và nhật ký luôn cùng tên.
- Có test đường đi qua vách núi/sông dù đích hợp lệ; có test đường chạm góc, qua cầu và đường bị weather đóng theo engine.
- Sáu ứng viên không bị nhân đôi; RNG phân phối theo tập hợp lệ đã chốt. Preview không tiêu thụ RNG.
- Reload/double click không đổi kết quả hoặc trả phí hai lần. Không bốc lại để né địa hình đắt.
- Kiểm tra công thức time trên tuyến một địa hình và tuyến hỗn hợp; weather chỉ nhân một lần.
- Thời tiết không chạy hai đồng hồ khác nhau; dừng giữ đúng vị trí an toàn và chi phí đã tiêu hao.
- Chưa khám phá không làm lộ địa hình qua tên, xác suất, số ứng viên hoặc mức chi phí chính xác.

### Đúng UX/UI

- Không còn hình bàn cờ, hàng dot nền hoặc cây phân cấp tự làm sai vị trí.
- Bố cục rải lệch có seed, không còn 2×3 cứng; mở lại/đổi hướng/zoom không reroll layout. Hướng chính giữ đúng, khoảng cách pixel chỉ tương đối; số liệu chi phí lấy từ world coordinates.
- Vùng nhấn dùng các node hiện hữu có tên ổn định; không hiển thị đích đã chắc chắn trước khi commit.
- Bấm landmark chỉ xem thông tin; không tiêu hao và không bảo đảm sẽ đến landmark đó.
- Không còn câu “đi 2 bước” dùng lẫn với một hành động random hoặc Dijkstra cũ.
- Văn phong panel là tiên hiệp; phần Dự liệu hành trình cho xem khoảng ước tính trước đi và kết quả thực sau đi. Không hiển thị công thức ô/lệch/RNG trong UI chính.
- Panel, nhật ký, action tại vị trí hiện tại và truyền tống vẫn hoạt động như thiết kế được duyệt.
- Màn hẹp, bàn phím, zoom và reduced motion đều sử dụng được; không chỉ dựa vào màu.

## 15. Prompt bàn giao triển khai

> Cập nhật riêng phần map và cơ chế di chuyển trong UI Cthulhu text RPG theo V2.5 này. Giữ các phần hồ sơ, nhật ký, action và truyền tống đã ổn. Đổi tiêu đề thành LÂN CẬN; Thiên đồ là link riêng tới bản đồ thế giới. Mọi node có tên sinh ổn định, kể cả node thường. Vùng có thể tới dùng lại các node đó và hiện tên tương ứng trên map lẫn panel. Panel hướng đi phải là lời dẫn tiên hiệp, không lộ công thức hoặc thuật ngữ RNG; thông tin chi phí cần thiết xem tại Dự liệu hành trình. Thay lưới bàn cờ bằng bố cục địa hình phân nhánh hữu cơ: world coordinates giữ nguyên, layout coordinates được rải lệch deterministic bằng seed riêng. Có la bàn, xa–gần tương đối, node dot tròn và khoảng trống tự nhiên. Không dùng force layout thả nổi hoặc reroll vị trí mỗi lần render. Không dùng layout coordinates để tính movement. Bốn hướng là ý định di chuyển random theo bảng công thức; preview chỉ hiện vùng kết quả và khoảng chi phí, CTA mới commit. Lọc biên và kiểm tra toàn tuyến trước khi bốc; không clamp, wrap, reroll khi render hoặc nhảy xuyên chướng ngại. Tích hợp địa hình và weather hiện có bằng một nguồn tính cost, giữ game clock nhất quán. Không để lộ dữ liệu chưa khám phá; hỗ trợ lưu kết quả RNG, chống thao tác kép và dừng tại điểm an toàn. Phân biệt hành động, độ dời, quãng đường và thời gian. Đối chiếu engine trước khi thay adapter, chạy các kiểm tra mục 14. Ảnh chỉ làm mẫu mỹ thuật, không lấy tọa độ, đường nối hoặc hệ số cân bằng từ ảnh.

## 16. Brief ảnh minh họa V2.5

- Chỉnh từ đúng ảnh UI được chọn: giữ nền mực xanh đen, chữ ngà, đồng cổ, viền Cthulhu và bố cục.
- Tiêu đề **LÂN CẬN**, link riêng **Thiên đồ** để mở map thế giới.
- Vùng hướng Đông có sáu node thường mang tên tiên hiệp, hiện cùng tên trong panel, không chấm vô danh.
- Panel dùng mẫu **ĐÔNG HÀNH** ở mục 8; bỏ bảng công thức ô/lệch/ngẫu nhiên và thời gian kỹ thuật khỏi mặt chính.
- Bản minh họa được tạo bằng imagegen tích hợp. Nó là concept thị giác; quy tắc tách world/layout coordinates ở mục 3 là chuẩn khi triển khai.
- Node hướng Đông có thể hiển thị hơi cao/thấp do jitter UI dù tọa độ gameplay không đổi. Không sao chép pixel ảnh thành dữ liệu world coordinates; kiểm soát độ lệch như mục 3.

## 17. Thuật toán tên node và cách hiện trong vùng di chuyển

### Danh tính ổn định

Mọi node có `nodeId`, tọa độ, `displayName`, địa hình và trạng thái khám phá. Đích di chuyển được chọn bằng `nodeId`, không dùng tên làm khóa vì tên có thể trùng.

Ưu tiên dùng thuật toán sinh tên đang có của game. Yêu cầu hợp đồng:

```text
nameSeed = stableHash(worldSeed, nodeId, namingVersion)
name = generateName(nameSeed, region, terrain)
persist(nodeId, name, namingVersion)
```

- Sinh một lần khi tạo thế giới hoặc lazily ở lần truy cập đầu, sau đó giữ nguyên. Không lấy RNG di chuyển để sinh tên.
- Save cũ giữ tên đã lưu. Update bộ từ vựng không âm thầm đổi tên thế giới đang chơi.
- Biến động thời tiết không đổi tên. Địa hình thay đổi sau này cũng không tự đổi tên đã lưu, trừ một sự kiện đổi tên được thiết kế rõ.
- Có thể ghép tiền tố/hình ảnh/suffix theo vùng và địa hình: Tùng + Ảnh + Lâm; Hàn + Yên + Khê. Bộ ghép phải lọc tổ hợp vô nghĩa và tránh trùng landmark cố định; ví dụ không tạo “Hồ” ở vách núi nếu quy tắc tên cần phản ánh địa hình.
- Khi trùng tên trong cùng phạm vi, dùng một bộ phân giải trùng ổn định theo node ID/seed, hoặc phụ chú vùng. Không reroll tên mỗi lần vẽ; không thêm mã kỹ thuật lên map.
- Tên đã biết không có nghĩa đã ghé. Mặc định node trong phạm vi local đều được hiện tên kể cả chưa ghé, phù hợp yêu cầu; nội dung bên trong và sự kiện vẫn có thể chưa khám phá. Chỉ che tên nếu game có luật bí mật riêng cho chính node đó, không tự che toàn bộ node chưa ghé.

### Ví dụ sáu nơi có thể tới khi chọn Đông

Tọa độ trong bảng là dữ liệu thiết kế, không phải chữ UI:

| Tọa độ | Tên minh họa cố định | Quan hệ trong tọa độ gameplay |
| --- | --- | --- |
| (48,52) | Tùng Ảnh Lâm | Đông 1, ngang vị trí gốc |
| (48,53) | Hàn Yên Khê | Đông 1, Bắc 1 |
| (49,52) | Thanh Đằng Pha | Đông 2, ngang vị trí gốc |
| (49,53) | Cổ Sam Lĩnh | Đông 2, Bắc 1 |
| (50,52) | Vụ Ẩn Cốc | Đông 3, ngang vị trí gốc |
| (50,53) | Tịch Phong Nhai | Đông 3, Bắc 1 |

Đây là tên ví dụ, không ép thế giới thật có đúng các tên này. Khi chọn hướng, truy vấn sáu node từ catalog; dùng cùng object/danh tính cho marker và danh sách. Nếu điểm bị loại do biên/vật cản được biết, bỏ khỏi danh sách có thể tới nhưng node vẫn tồn tại trong thế giới.

### Tránh rối nhãn

- Luôn ưu tiên tên vị trí hiện tại và tối đa sáu node trong tập đang xem; dùng dời nhãn và đường dẫn nhãn ngắn nếu cần, dot giữ layout position ổn định theo mục 3.
- Những node xung quanh vẫn giữ tên theo mức zoom. Khi quá chật, giảm nhãn ít ưu tiên hoặc đưa vào danh sách, không biến các node trong vùng chọn thành chấm vô danh.
- Trên mobile, danh sách sáu tên dưới map luôn truy cập được; chạm tên focus dot, chạm dot làm nổi dòng tương ứng. Nếu không đủ chỗ cho sáu nhãn map, tên đầy đủ nằm trong danh sách và nhãn nổi khi focus.
- Không vẽ một bảng sáu dot giả phía trên map để thay cho các điểm thực. Bảng danh sách panel chỉ là một cách xem khác của cùng các node.
- Khi nhân vật tới node được chọn ngẫu nhiên, node đó chuyển trạng thái đã ghé, tên không đổi. Camera có thể dịch theo nhân vật; vị trí thế giới của các node còn lại không đổi.

## 18. Nguyên tắc câu chữ tiên hiệp

| Dữ liệu nội bộ | Câu trên UI |
| --- | --- |
| Hướng Đông | Đông hành · Khởi hành về Đông |
| Hướng Tây | Tây hành · Khởi hành về Tây |
| Hướng Nam | Nam hành · Khởi hành về Nam |
| Hướng Bắc | Bắc hành · Khởi hành về Bắc |
| Candidate destination set | Những chốn có thể tới |
| Chưa chốt kết quả | Ngươi có thể dừng chân ở một trong những chốn dưới đây |
| Terrain/weather penalty | Mưa nặng hạt, đường rừng lầy lội. Chuyến đi e sẽ lâu hơn thường lệ |
| Cost details | Dự liệu hành trình |
| Cancel preview | Thôi xét |
| Stop traversal | Dừng chân |
| Current / visited / unvisited | Đang đứng / Đã ghé / Chưa ghé |
| Recenter camera | Về chỗ đứng |

Văn phong ngắn, dễ hiểu, có không khí nhưng không che điều kiện hành động. Các con số trong công thức dành cho dev; các số thời gian/tài nguyên cần cho quyết định vẫn được xem trước bằng nhãn phù hợp thế giới, không tự ý bịa đơn vị hoặc hứa kết quả cố định.

## 19. “Khởi hành” tích hợp feature movement

**Khởi hành là UI điều khiển movement, không phải tính năng dịch chuyển riêng và không chỉ chạy animation.** Tài liệu/ảnh hiện tại là đặc tả tích hợp; chưa có sửa hay kiểm chứng code game thật.

Luồng dự kiến:

1. Chọn Bắc/Tây/Đông/Nam → gọi preview/read model của movement bằng vị trí gameplay hiện tại và hướng.
2. Movement trả tập node được phép hiển thị, dự liệu hao tổn và lý do bị khóa. UI resolve nodeId sang tên và layout position.
3. Bấm Khởi hành → gửi ý định hướng, action ID và phiên bản trạng thái; không gửi pixel hoặc để client tùy chọn một đích random mình thích.
4. Movement kiểm tra lại biên, terrain, weather và tài nguyên; bốc một kết quả, lưu nó rồi bắt đầu hành trình theo quy tắc mục 4–6.
5. Movement phát trạng thái tiến trình/sự kiện; UI chạy animation nối các layout position. Animation không quyết định đã đến nơi hay trừ tài nguyên.
6. Movement báo hoàn tất/dừng → UI cập nhật vị trí, node đã ghé, nhật ký và hành động khả dụng từ cùng kết quả.

Các nút di chuyển ở Action Bar hoặc phím tắt, nếu có, phải dùng cùng entry point và khóa hành động đang chạy. Không nhân đôi bộ random, tính time hoặc trừ thể lực ở component bản đồ. Thôi xét chỉ hủy preview; Dừng chân mới yêu cầu dừng một hành trình đang chạy. Truyền tống vẫn là cơ chế riêng.

Tên hàm/API cụ thể cần đối chiếu code dự án; đây là hợp đồng trách nhiệm, không khẳng định dự án đã có sẵn những endpoint tương ứng.

### Kiểm tra bổ sung

- Thay seed/layoutVersion chỉ đổi cách vẽ, không đổi tọa độ, tên, tập kết quả hoặc chi phí movement.
- Hai node lệch trên UI vẫn resolve đúng nodeId khi click/chạm.
- Chọn cùng hướng nhiều lần không đổi bố cục và không tiêu thụ RNG movement.
- Di chuyển camera hoặc resize không làm các node đổi vị trí tương đối trong layout world.
- Bấm Khởi hành từ nhiều bề mặt chỉ tạo một hành động; animation không gây trả phí hai lần.

## 20. Phản hồi UI khi chọn Đông/Tây/Nam/Bắc

### Ba chuyển động phải tách rõ

| Tình huống | UI/panel | Camera | Nhân vật và tài nguyên |
| --- | --- | --- | --- |
| Bấm hướng hoặc nhãn Đông/Tây/Nam/Bắc hành | Đổi tiêu đề, lời dẫn, danh sách node, vùng nhấn và CTA theo hướng đó | Giữ nguyên nếu nhìn đủ; chỉ pan nhẹ nếu vùng cần xem bị khuất | Không di chuyển, không bốc RNG, không trừ time/tài nguyên |
| Bấm tên một địa điểm | Xem mô tả, nhấn tên/dot tương ứng | Pan tối thiểu nếu điểm ngoài vùng nhìn | Không di chuyển, không chọn chắc kết quả |
| Bấm Khởi hành về hướng đã chọn | Chuyển sang đang đi, khóa cam kết trùng | Theo nhân vật khi cần, không xoay map | Movement kiểm tra và thực hiện theo mục 19 |
| Bấm Thôi xét | Xóa preview, về nội dung vị trí hiện tại | Giữ camera hiện có; không giật về tâm | Không di chuyển, không tiêu hao |
| Bấm Về chỗ đứng | Giữ dữ liệu thế giới và lựa chọn đang xem | Đưa vị trí hiện tại vào vùng đọc trung tâm | Không di chuyển nhân vật |
| Movement hoàn tất | Hiện địa điểm đã tới, kết quả thực và action mới | Giữ vị trí mới trong vùng đọc | Cập nhật world position từ kết quả engine |

**Kết luận hành vi:** UI tự đổi theo hướng; camera có thể dịch để phục vụ xem trước; nhân vật chỉ đi khi xác nhận Khởi hành. Không có auto-walk chỉ vì đổi sang Tây hành/Nam hành/Bắc hành.

### Ma trận bốn hướng

| Nút chọn | Tiêu đề panel | Vùng nhấn | CTA |
| --- | --- | --- | --- |
| Đông | ĐÔNG HÀNH | Những node hợp lệ phía Đông theo công thức và tri thức hiện tại | Khởi hành về Đông |
| Tây | TÂY HÀNH | Những node hợp lệ phía Tây | Khởi hành về Tây |
| Nam | NAM HÀNH | Những node hợp lệ phía Nam | Khởi hành về Nam |
| Bắc | BẮC HÀNH | Những node hợp lệ phía Bắc | Khởi hành về Bắc |

Tên, số điểm, cảnh vật, thời tiết, cảnh báo và hao tổn phải lấy từ tập node tương ứng, không chỉ đổi chữ Đông thành Tây trên dữ liệu cũ. Không hardcode sáu tên minh họa cho mọi hướng. Không xoay map để hướng đang chọn luôn nằm bên phải: Bắc vẫn ở phía trên, Tây trái, Đông phải, Nam dưới, có sai lệch UI nhỏ theo mục 3.

Mẫu lời dẫn trung tính khi chưa có cảnh vật phù hợp:

- Tây: “Ngươi đưa mắt về phía tây. Theo lối ấy, có thể dừng chân tại một trong những chốn dưới đây.”
- Nam: “Ngươi dõi về phương nam, cân nhắc những nơi có thể đặt chân.”
- Bắc: “Ngươi nhìn về phương bắc. Hành trình phía trước có thể đưa ngươi tới những chốn này.”

Chỉ thêm rừng, mưa, sương, núi khi dữ liệu đã biết hỗ trợ. Không tự gán mưa cho tất cả hướng vì mẫu ảnh hướng Đông có mưa.

### Camera và bố cục ổn định

- Mặc định giữ zoom. Nếu vị trí hiện tại và vùng xem trước đã nằm trong vùng an toàn của map thì không pan.
- Nếu vùng bị che bởi panel/sheet hoặc ra khỏi viewport, pan tối thiểu để thấy vị trí hiện tại và các điểm đang xét. Nếu không thể chứa hết, dùng fit-to-view có giới hạn hoặc nút xem toàn vùng; không kéo dot lại gần nhau.
- Reduced motion dùng chuyển trạng thái tức thời; không bắt buộc animation.
- Đổi hướng nhanh chỉ cho preview mới nhất điều khiển highlight và camera; hủy/bỏ qua response cũ bằng request ID hoặc state version.
- Không bốc lại offset layout, tên node hay kết quả di chuyển khi camera dịch. Vùng nhấn được tính từ layout position đã lưu của tập node mới.

### Sau khi đi và khi đang đi

- Khi đang thực hiện một hành động, khóa đổi hướng dùng để cam kết tiếp; không tự xếp hàng một chuyến khác. Dừng chân theo quy tắc điểm an toàn ở mục 6/19.
- Sau khi hoàn tất: mặc định quay về nội dung vị trí hiện tại, xóa preview cũ. Bốn hướng có thể được tính lại từ vị trí mới nhưng không tự gọi commit.
- Muốn đi tiếp, người chơi chọn/xem hướng và bấm Khởi hành lần nữa. Không tự động lặp cùng hướng và không dùng tập kết quả từ vị trí cũ.
- Nếu bị chặn/thiếu tài nguyên/trạng thái đã thay đổi khi commit, cập nhật preview và lý do, không tiếp tục bằng kết quả cũ.

### Tiêu chí kiểm tra bổ sung

1. Với mỗi hướng, title/CTA/danh sách/highlight đồng bộ và dùng đúng tập node của hướng đó.
2. Chọn liên tiếp Tây → Nam → Bắc không làm thay đổi world position, RNG, clock hoặc tài nguyên.
3. Response preview Tây trả muộn không ghi đè preview Bắc đang chọn.
4. Pan/zoom hoặc Về chỗ đứng không phát sinh movement.
5. Nhấn Khởi hành một lần chỉ tạo một hành động; không tự tạo hành động tiếp khi đến nơi.
6. Đi tới node mới rồi chọn lại hướng phải tính tập mới; không giữ sáu điểm quanh node cũ.
7. Các mốc world edge/terrain/weather vẫn kiểm tra theo tọa độ thật bất kể vị trí layout lệch ra sao.

## 21. Nhật ký quyết định và quy tắc cập nhật để GPT truy vết

### Cách sử dụng tài liệu từ bây giờ

1. Đọc đặc tả hiện hành và nhật ký này trước khi sửa thiết kế/code; không suy ngược yêu cầu từ một ảnh cũ.
2. Mỗi yêu cầu hoặc làm rõ mới: sửa trực tiếp các mục chịu ảnh hưởng; cập nhật ảnh nếu có thay đổi hình ảnh; thêm bản ghi có ngày, nguồn, lý do, phạm vi và trạng thái.
3. Không chỉ nối một note cuối file trong khi quy tắc cũ mâu thuẫn vẫn còn trong thân tài liệu. Quy tắc thay thế chỉ giữ ở lịch sử, ghi rõ đã bỏ.
4. Điều người dùng chưa chốt phải ghi **đề xuất** hoặc **cần đối chiếu**, không biến thành yêu cầu đã duyệt. Không tự yêu cầu phê duyệt lại những phần đã được cho phép.
5. File giữ một đặc tả hiện hành; số phiên bản thiết kế độc lập với số version lưu file. Bump phiên bản khi thay đổi nội dung, giữ identity của file khi cập nhật.
6. Ghi đúng trạng thái: thiết kế khác triển khai; viết ảnh/mockup không có nghĩa đã nối movement hoặc đã chạy kiểm thử game.
7. Nếu một trao đổi chưa dẫn tới quyết định, lưu vào mục còn mở với tác động cụ thể. Không cần chép nguyên hội thoại hoặc các đoạn không liên quan.
8. Sau khi cập nhật thành công, trả lại file hiện hành cho người dùng. Nếu có xung đột phiên bản, đối chiếu thay đổi mới trước khi ghi, không ghi đè mù.

### Các quyết định đến hiện tại — 09/10/2026

| ID | Nội dung và nguồn | Đặc tả liên quan | Trạng thái / thay thế |
| --- | --- | --- | --- |
| D01 | Người dùng yêu cầu text RPG pha linh dị Cthulhu | 1, 7, 10 | Yêu cầu hiện hành; nền tối, chữ dễ đọc, trang trí ngoại vi |
| D02 | Người dùng muốn bỏ bàn cờ, thể hiện xa–gần và phân nhánh | 1, 3 | Hiện hành; dùng mạng địa hình hữu cơ, không cây phân cấp bắt buộc |
| D03 | Người dùng đưa công thức di chuyển random Đông/Bắc/Nam và yêu cầu xử lý biên | 2, 4, 5 | Công thức hiện hành; thay luật cạnh kề cố định/không đường chéo |
| D04 | Công thức Tây chưa được người dùng nêu chi tiết; thiết kế đề xuất x−a,y+b | 4 | Đề xuất cấu hình, chưa coi là công thức đã được người dùng xác nhận riêng |
| D05 | Người dùng yêu cầu địa hình tốn time, tương tác thời tiết sẵn có | 5, 6 | Yêu cầu hiện hành; hệ số minh họa, adapter/tick phải đối chiếu code |
| D06 | Người dùng sửa: đây là Lân cận; Thiên đồ là thế giới | 8, 16 | Đã cập nhật; title THIÊN ĐỒ của ảnh cũ không còn áp dụng |
| D07 | Người dùng yêu cầu câu chữ tiên hiệp, không bảng thuật ngữ kỹ thuật | 8, 10, 18 | Đã cập nhật; công thức chỉ trong đặc tả dev, chi phí cần thiết xem ở Dự liệu hành trình |
| D08 | Người dùng xác định mọi node sinh tên bằng thuật toán | 2, 9, 17 | Hiện hành; tên ổn định, vùng xem trước dùng lại node và tên, không dot vô danh |
| D09 | Người dùng yêu cầu rải vị trí UI random nhưng giữ tọa độ code | 3, 14, 16, 17 | Hiện hành; thay yêu cầu chiếu pixel chính xác và cấm jitter của bản trước |
| D10 | Thiết kế dùng jitter có seed, giới hạn, giữ layout ổn định | 3 | Cách triển khai đề xuất cho D09; ±0,3 là giá trị thử, không luật gameplay |
| D11 | Người dùng hỏi Khởi hành có tích hợp movement không | 19 | Đặc tả đã làm rõ: một entry point movement; chưa triển khai code |
| D12 | Người dùng hỏi hành vi Tây/Nam/Bắc hành | 8, 18, 20 | Đặc tả cả bốn hướng: đổi preview tự động, không đi ngay; camera pan có điều kiện |
| D13 | Người dùng yêu cầu mọi thảo luận được cập nhật file để GPT trace | Đầu file, 21 | Quy tắc bắt buộc cho công việc tiếp theo với thiết kế này |
| D14 | Người dùng yêu cầu trace rõ ảnh hưởng thời tiết để tính hệ số di chuyển | 6, 19, 22 | Yêu cầu hiện hành; bổ sung chuỗi W01–W10 và dữ liệu kiểm chứng; chưa đối chiếu code |
| D15 | Người dùng yêu cầu hình ảnh và thông số màu sắc/thiết kế để đưa AI làm mẫu | 23 | Bổ sung design tokens, layout, trạng thái, prompt bàn giao; chưa phải CSS đã tích hợp game |

### Lược sử phiên bản thiết kế

| Phiên bản | Thay đổi chính |
| --- | --- |
| V1 | Theme Cthulhu, cải thiện đọc và thao tác trên bản đồ lưới cũ |
| V2 / V2.1 | Bỏ bàn cờ; random theo hướng, biên/địa hình/weather; Lân cận, lời dẫn tiên hiệp và tên node |
| V2.2 | Tách world/layout coordinates, rải UI có seed; hợp đồng tích hợp movement |
| V2.3 | Phản hồi đủ bốn hướng, camera vs movement, chống preview cũ, quy tắc cập nhật và nhật ký quyết định |
| V2.4 | Trace weather → hệ số movement → chi phí preview/thực tế, nguồn cấu hình và kiểm tra chống tính trùng |
| V2.5 — hiện hành | Ảnh tham chiếu và bộ thông số màu/font/layout/component để giao AI triển khai |

### Các điểm vẫn cần đối chiếu khi có code

- Quy ước Oxy 0..99 hay 1..100; định dạng save và namingVersion hiện tại.
- Chọn adapter weather theo clock/tick thật; không dùng đồng thời hai cơ chế cập nhật.
- Công thức Tây và thiên lệch hướng trong bảng hiện tại; drift đối xứng vẫn là tùy chọn chưa kích hoạt.
- Hệ số terrain/time, đơn vị lore và trần tài nguyên cho địa hình chưa biết.
- Mức jitter, khoảng trống nhãn và cách đồng bộ sông/cầu/weather với layer UI; cần kiểm tra trên dữ liệu thật.
- Tên module/API movement và nơi duy nhất chịu trách nhiệm RNG, trừ chi phí, save và action ID.

Các điểm này không chặn việc hoàn thiện thiết kế/ảnh; không được tự coi chúng là tính năng đã có trong dự án.

## 22. Trace bắt buộc: thời tiết → hệ số movement → hao tổn

Ngày bổ sung: 09/10/2026. Nguồn: yêu cầu D14 của người dùng. Mục này làm rõ hợp đồng tính toán tại mục 6 và tích hợp movement tại mục 19. Đây là đặc tả cần triển khai/đối chiếu, không khẳng định code hiện có đã tính đúng.

### 22.1. Chuỗi ảnh hưởng và nơi chịu trách nhiệm

| Trace ID | Đầu vào → xử lý → đầu ra | Thành phần chịu trách nhiệm | Bằng chứng cần lưu |
| --- | --- | --- | --- |
| W01 | World position + game time → đọc thời tiết tại đoạn sẽ đi | Weather hiện có / adapter | weather state/version, thời điểm lấy mẫu, nguồn dữ liệu |
| W02 | Thời tiết + cường độ + địa hình + khả năng nhân vật → tra quy tắc áp dụng | Bộ quy tắc movement cost dùng chung | rule ID, config version, điều kiện khớp |
| W03 | Quy tắc → hệ số thời gian, hệ số thể lực riêng, trạng thái có thể đi | Cost resolver | hệ số gốc, loại hệ số, phép chuyển đổi, lý do chặn |
| W04 | Tuyến gameplay → chia theo địa hình/vùng thời tiết và tick được hỗ trợ | Movement traversal | đoạn, độ dài thật, thời điểm vào/ra dự kiến |
| W05 | Chi phí cơ sở + terrain + weather → chi phí từng đoạn và tổng | Cost resolver | breakdown và hệ số tổng hợp có nghĩa rõ ràng |
| W06 | Chi phí các kết quả của một hướng → khoảng dự liệu được phép hiển thị | Movement preview | preview ID, world/weather/config version, min/max và độ chắc chắn |
| W07 | Người chơi Khởi hành → kiểm tra lại phiên bản, điều kiện và chi phí | Movement commit | action ID, preview tham chiếu, snapshot/version thực dùng |
| W08 | Di chuyển thực → áp dụng cost theo policy weather đã chọn | Movement execution | đoạn đã hoàn tất, weather đã áp dụng, thời gian/thể lực thực |
| W09 | So preview với thực tế → lý do chênh lệch / dừng / kết thúc | Movement result | delta, reason code, vị trí an toàn cuối cùng |
| W10 | Kết quả engine → lời dẫn tiên hiệp + Dự liệu hành trình | UI / nhật ký | reason key dùng cho câu chữ; không tự tính lại cost |

**Luồng chính:** Weather → Cost resolver → Movement preview/commit/execute → Result → UI. Không để UI tự nhân một hệ số rồi engine lại nhân lần nữa.

### 22.2. Nguồn hệ số và quy ước bắt buộc

Ưu tiên đọc cấu hình thời tiết/movement đang có trong dự án. Khi nối code, phải ghi được tên module, file cấu hình, hàm và test tương ứng trong bảng mục 22.9; không bịa tên hàm khi chưa đọc source.

Quy ước chuẩn trong đặc tả này:

- `K_weather_time`: hệ số nhân **thời gian trên một đơn vị quãng đường**, trung tính là 1. Hệ số lớn hơn 1 nghĩa là đi lâu hơn.
- `K_weather_stamina`: hệ số thể lực, chỉ dùng nếu gameplay đã có luật thời tiết ảnh hưởng thể lực. Không lấy mặc định bằng hệ số time.
- `passable`: điều kiện đi được riêng. Một cơn bão đóng đường phải trả blocked reason; không dùng hệ số vô hạn hoặc trừ cost rồi mới báo chặn.
- Nếu nguồn trả **hệ số tốc độ** `M_speed`, chuyển bằng `K_weather_time = 1 / M_speed` với tốc độ dương. Ví dụ tốc độ ×0,8 tương ứng thời gian ×1,25; không lấy 0,8 nhân time.
- Nếu nguồn trả **mức phạt thời gian** 25%, chuyển thành hệ số 1,25. Ghi rõ loại và đơn vị của giá trị gốc; không tự đoán một số 0,25 là speed hay penalty.
- Không tự đặt bảng hệ số cố định theo tên “Mưa/Bão/Sương” nếu game đã có quy tắc khác. Các hệ số trong ví dụ mục này chỉ minh họa, chưa là cấu hình production.
- Chỉ dùng nội suy theo cường độ, hướng gió, trang bị hoặc tương tác bùn/rừng nếu có quy tắc được khai báo. Nếu phải bổ sung luật mới, ghi là đề xuất cân bằng riêng.
- Thiếu dữ liệu khác với trời quang. Trời quang được nguồn xác nhận có thể cho hệ số 1; dữ liệu lỗi/thiếu không được âm thầm coi là 1. Áp dụng fallback được dự án quy định và ghi trace; nếu chưa có fallback đáng tin, không cho commit bằng một chi phí đoán.
- Kiểm tra hệ số hữu hạn, dương. Hệ số giảm time chỉ được chấp nhận nếu gameplay có buff tương ứng; không clamp ngầm để che lỗi dữ liệu.

### 22.3. Terrain và weather không tính trùng

Đối với đoạn i có hệ số không đổi:

```text
baseTime_i    = length_i * baseTimePerDistance
terrainTime_i = baseTime_i * K_terrain_time_i
actualTime_i  = terrainTime_i * K_weather_time_i
T_total       = sum(actualTime_i)
```

Chỉ áp dụng công thức nhân độc lập nếu cost resolver hiện có xác nhận terrain chưa bao gồm tác động weather. Nếu nguồn trả một `combinedTimeMultiplier` đã bao gồm rừng ướt/mưa/bùn thì:

```text
actualTime_i = baseTime_i * combinedTimeMultiplier_i
```

Không tiếp tục nhân terrain và weather lên combined multiplier. Trace ghi `compositionMode` là independent hoặc combined và danh sách rule đã được tính vào. Những modifier khác chỉ áp dụng một lần theo thứ tự/luật stacking của engine.

Thể lực phải có nhánh công thức riêng. Nếu không có tác động weather lên thể lực, ghi “không áp dụng” hoặc trung tính theo hợp đồng engine; không suy từ việc thời gian tăng mà tự tăng thể lực hoặc giảm Thanh tỉnh.

### 22.4. Hệ số toàn hành trình được hiểu thế nào?

Không lấy trung bình cộng hệ số các ô. Một đoạn dài hoặc địa hình chậm có trọng số lớn hơn.

```text
T_terrain_only = sum(length_i * baseTimePerDistance * K_terrain_time_i)
K_weather_route = T_total / T_terrain_only
weatherExtraTime = T_total - T_terrain_only
```

Công thức hệ số route ở trên dùng khi weather độc lập với terrain và baseline xác định được, mẫu số > 0. Nếu engine dùng combined rules, tính baseline bằng cùng resolver với weather trung tính chỉ khi luật cho phép so sánh đó. Nếu không tách được, ghi “không tách riêng được”, không dựng hệ số weather giả.

**Ví dụ kiểm chứng, không phải cấu hình game:**

| Đoạn | Độ dài nội bộ | Cơ sở | Terrain | Weather time | Time thực |
| --- | --- | --- | --- | --- | --- |
| A: đường mòn, trời quang | 1 | 2 phút/đơn vị | 1,0 | 1,0 | 2 phút |
| B: rừng, mưa | 2 | 2 phút/đơn vị | 1,5 | 1,4 | 8,4 phút |
| Tổng | 3 | — | — | — | 10,4 phút |

Không có weather penalty: `2 + 2×2×1,5 = 8 phút`. Có weather: `10,4 phút`. Vì vậy weather làm tăng `2,4 phút`, tương đương hệ số toàn tuyến `1,3`, **không phải** trung bình cộng `(1+1,4)/2 = 1,2`.

Với một hướng random, tính mỗi đường ứng viên riêng trước khi lấy min/max. Không áp dụng một hệ số lấy tại node xuất phát cho tất cả sáu đường nếu chúng đi qua weather khác nhau.

### 22.5. Weather thay đổi trong lúc di chuyển

Phải chọn đúng một policy phù hợp engine và lưu tên policy trong trace:

| Policy | Cách xử lý | Khi dùng |
| --- | --- | --- |
| Snapshot theo hành động | Lấy trường weather tại commit, giữ trong hành động; cập nhật theo vòng đời lượt hiện tại của game | Engine weather chỉ tiến theo lượt hành động |
| Tích phân theo game time | Đi tới ranh giới địa hình/weather hoặc tick tiếp theo; cập nhật điều kiện rồi tính phần tiếp | Engine có weather tiến theo thời gian |

Snapshot vẫn tra weather theo vị trí trên tuyến, không đồng nghĩa lấy weather ở điểm xuất phát cho toàn map.

Với policy theo time, tránh vòng lặp “ước lượng giờ đến → weather mới → ước lượng lại vô hạn”. Thực hiện tuần tự: từ thời gian hiện tại và tốc độ của đoạn, đi tới sự kiện gần nhất (ranh giới/tick); cập nhật thời gian và weather rồi tiếp tục. Preview dùng snapshot/dự báo có version rõ ràng, không giả rằng forecast chắc chắn.

Cùng một engine clock quyết định movement và dịch chuyển front thời tiết. Không dùng thời gian animation hoặc tốc độ FPS để tính hao tổn. Các giới hạn điểm dừng và phần nguyên tử trong mục 6 vẫn áp dụng.

- Weather đổi trước commit: đánh giá lại; nếu preview/chi phí/rủi ro đã thay đổi cần quyết định mới, trả preview cập nhật để người chơi xem lại.
- Weather đổi giữa hành trình: giữ kết quả đích đã bốc, không reroll. Tính phần đã đi theo điều kiện thực đã áp dụng.
- Phần sắp đi bị chặn hoặc vượt mức chấp nhận: dừng trước phần đó tại điểm an toàn, ghi lý do. Không trừ phí toàn tuyến rồi hoàn tiền tùy ý.
- Không có thay đổi ảnh hưởng cost/passability: có thể tiếp tục; trace cho thấy kiểm tra lại đã xảy ra.

### 22.6. Bản ghi trace cho dev/GPT

Dạng logic đề xuất; tên field có thể ánh xạ sang schema thực khi đọc code:

```text
movementTrace
  actionId, previewId, direction, originNodeId, resolvedDestinationNodeId
  worldStateVersion, costConfigVersion, weatherPolicy
  estimateKind: exact_snapshot | forecast | conservative_bound
  segments[]
    segmentId, fromWorldPosition, toWorldPosition, length
    startedAtGameTime, endedAtGameTime
    terrainId, terrainRuleId, terrainTimeMultiplier
    weatherStateId, weatherVersion, sampledAtGameTime
    weatherType, intensity, weatherRuleId
    rawModifierKind, rawModifierValue, weatherTimeMultiplier
    compositionMode, combinedMultiplier, appliedRuleIds
    passable, blockedReason
    baseTime, estimatedTime, actualTime
    estimatedStamina, actualStamina, staminaRuleId
  totals
    estimatedTimeMin, estimatedTimeMax, actualTime
    terrainOnlyTime, effectiveWeatherMultiplier, weatherExtraTime
    actualStamina, stoppedAtNodeId, completionStatus, changeReasons[]
```

- Trường không áp dụng ghi null/not-applicable kèm lý do, không điền số 0 như có phép tính thật.
- Preview chưa bốc đích; không điền `resolvedDestinationNodeId` trước commit. Chi tiết mỗi ứng viên giữ ở estimate tương ứng, không trộn tổng min/max với breakdown của một đường chưa chọn.
- Lưu bản ghi ở nơi dự án dùng cho debug/replay; không đưa dữ liệu thế giới chưa khám phá vào payload UI chỉ vì muốn log tiện.
- UI nhận bản đã lọc theo tri thức nhân vật. Tooltip/lời dẫn không được làm lộ bão hoặc vật cản bí mật qua hệ số chính xác.
- Reload tiếp tục dùng action ID, snapshot và kết quả đã lưu; không nhân lại hệ số lên chi phí đã trả.

### 22.7. Trace ra UI nhưng vẫn giữ văn phong tiên hiệp

| Kết quả cost resolver | Hiển thị chính | Dự liệu hành trình |
| --- | --- | --- |
| Mưa làm tăng time qua rừng đã biết | “Mưa nặng hạt, đường rừng lầy lội. Chuyến đi e sẽ lâu hơn thường lệ.” | Thời gian dự kiến từ resolver; giải thích “Chậm hơn vì mưa” |
| Đường bị bão chặn đã biết | “Cuồng phong chắn lối, lúc này khó thể vượt qua.” | Khóa Khởi hành, nêu điều kiện hợp lệ nếu engine biết |
| Forecast chưa chắc | “Mây trời chuyển biến, cước trình khó định.” | Ghi ước tính hoặc khoảng bảo thủ phù hợp, không giá trị chính xác giả |
| Weather làm tăng cost sau preview | “Mưa đã nặng hạt hơn. Ngươi nên xét lại đường đi.” | Hiện thay đổi có ý nghĩa trước cam kết, không giấu trong vùng thu gọn |
| Đã tới nơi | Câu đến địa danh thực tế | Time/thể lực đã dùng, không tiếp tục ghi chi phí dự kiến |

Không hiện W01, multiplier, RNG hoặc công thức lên UI người chơi. Trace chi tiết dành cho phát triển; lời dẫn là bản trình bày của cùng dữ liệu, không là hệ thống tính cost thứ hai.

### 22.8. Ca nghiệm thu trace

| ID | Tình huống | Kết quả cần chứng minh |
| --- | --- | --- |
| WT01 | Trời quang được xác nhận, weather time = 1 | Time bằng terrain baseline; rule source/version có trong trace |
| WT02 | Nguồn speed = 0,8 | Chuẩn hóa time = 1,25, không = 0,8 |
| WT03 | Hai đoạn như ví dụ mục 22.4 | Tổng 10,4; baseline 8; weather extra 2,4; route multiplier 1,3 |
| WT04 | Chỉ một phần đường trong mưa | Chỉ phần giao vùng đó nhận penalty; không lấy weather node gốc cho tất cả |
| WT05 | Combined rule đã gồm mưa + rừng | Không nhân thêm terrain/weather lần thứ hai |
| WT06 | Sáu kết quả đi qua weather khác nhau | Mỗi đường có estimate riêng; min/max đúng tập, không bốc RNG trong preview |
| WT07 | Weather đổi giữa preview và commit | Kiểm tra version, cập nhật cost/cảnh báo; không commit mù từ dữ liệu cũ |
| WT08 | Weather đổi ở tick giữa hành trình | Tính đúng các đoạn theo policy đã chọn; không vừa snapshot vừa tick |
| WT09 | Bão khiến phần tiếp theo không thể qua | Dừng trước phần đó, chỉ tính chi phí phần hoàn tất; không reroll đích |
| WT10 | Weather không có luật thể lực | Time có thể tăng nhưng không tự nhân thể lực/Thanh tỉnh |
| WT11 | Dữ liệu weather lỗi hoặc thiếu | Có fallback khai báo và trace hoặc chặn commit; không âm thầm coi trời quang |
| WT12 | Reload, bấm hai lần hoặc animation lặp | Một action, không tính hệ số/tiêu hao hai lần |
| WT13 | Vùng weather chưa được khám phá | Trace nội bộ đầy đủ; dữ liệu/câu chữ UI không rò thông tin bí mật |

### 22.9. Điểm nối code phải điền khi triển khai

| Hạng mục | Đường dẫn/hàm thực | Trạng thái hiện tại |
| --- | --- | --- |
| Nguồn weather và game clock | Chưa đối chiếu repository | Cần xác định |
| Config hệ số, loại speed/time và luật stacking | Chưa đối chiếu repository | Cần xác định |
| Bộ tra terrain/weather trên đoạn đi | Chưa đối chiếu repository | Cần xác định |
| Cost resolver dùng chung preview/execute | Chưa đối chiếu repository | Cần xác định hoặc bổ sung |
| Movement commit, action ID và save tiến trình | Chưa đối chiếu repository | Cần xác định |
| UI Dự liệu hành trình và nhật ký | Chưa đối chiếu repository | Cần xác định |
| Test WT01–WT13 | Chưa có code/test chạy trong công việc thiết kế này | Chưa triển khai |

Khi GPT sửa code, cập nhật cột đường dẫn/hàm bằng vị trí thật, ghi test nào đã chạy và kết quả. Không đánh dấu hoàn tất chỉ vì đã viết mục này hoặc vẽ cảnh mưa trong ảnh.

**Cập nhật triển khai 09/10/2026:** Bảng trên là checklist thiết kế ban đầu. Các mục nguồn weather/game clock, movement commit, action ID, save và UI đã được đối chiếu với `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`; implementation hiện dùng `GameExpansion.travelPlan` ở commit, `GameEngine.movementCandidatePreview`/`movementCommitments` cho lựa chọn deterministic và `openWorld.exitMeta` cho cạnh stride. Preview UI hiện mới công khai hướng, độ dời và commitment; chưa công khai cước trình/hao thể lực cho từng ứng viên vì cần adapter preview không tạo node giả. WT01–WT13 chưa có bộ test độc lập và tiếp tục là evidence debt, không tuyên bố hoàn tất.

## 23. Bộ mẫu thiết kế bàn giao cho AI — V2.5

### 23.1. Ảnh tham chiếu và mức độ ưu tiên

Ảnh chuẩn bố cục: **LÂN CẬN**, panel **ĐÔNG HÀNH**, sáu địa danh rải lệch tự nhiên trong vùng “Những chốn có thể tới”, nhật ký và truyền tống ở dưới. Đây là ảnh chỉnh gần nhất sau yêu cầu rải node UI, không phải ảnh bàn cờ hoặc ảnh sáu node xếp 2×3.

Tên ảnh tham chiếu của phiên làm việc: `exec-fe770e2b-5a20-43d8-a7fa-2e69b2185b0a.png`. Khi chuyển giao cho một AI khác, đính kèm ảnh cùng file này; tên file không đảm bảo AI khác tự truy cập được ảnh. Ảnh là concept tạo bằng imagegen tích hợp, không phải screenshot code đã chạy.

Thứ tự ưu tiên: **yêu cầu mới nhất trong tài liệu → design tokens mục 23 → ảnh định hướng mỹ thuật**. Không dùng ảnh để suy ra tọa độ, công thức hoặc chức năng. Nếu ảnh thiếu chữ/khác số liệu, dùng đặc tả chữ. Bảng token dưới đây là mục tiêu triển khai được đề xuất, không phải kết quả đo từng pixel trong tranh.

### 23.2. Palette triển khai

| Token | HEX | Vai trò |
| --- | --- | --- |
| canvas | `#080F10` | Nền toàn màn hình |
| surface | `#111C1C` | Panel nội dung |
| surface-raised | `#182727` | Drawer, tooltip, nhóm nội dung nổi |
| surface-hover | `#213333` | Hover nút phụ/dòng địa danh |
| border-subtle | `#344443` | Vạch chia và viền phụ |
| brass-muted | `#796846` | Viền trang trí cổ, không dùng cho chữ nhỏ |
| brass | `#C8AD6F` | Nhấn chính, viền chọn, nét hướng đi |
| brass-hover | `#DBC38B` | Nền CTA khi hover |
| brass-active | `#B69A5D` | Nền CTA khi nhấn |
| on-brass | `#17150E` | Chữ trên CTA vàng |
| text-primary | `#E8E0CC` | Nội dung chính |
| text-secondary | `#AFBDB7` | Mô tả phụ |
| text-muted | `#8F9F99` | Thông tin ít ưu tiên, không dùng opacity để làm chìm thêm |
| jade | `#72AAA4` | Link, dấu đã ghé nếu phù hợp màu hiện có |
| focus | `#9AE0D7` | Focus bàn phím và liên kết hoạt động |
| warning | `#E4B965` | Cảnh báo thời tiết/chi phí |
| warning-bg | `#292316` | Nền cảnh báo |
| danger | `#E28A80` | Lỗi, đường chặn hoặc nguy hiểm đã xác định |
| danger-bg | `#2A1818` | Nền lỗi |
| node-unknown | `#A8B4AE` | Dot chưa ghé nếu phù hợp logic màu dự án |

Các token node là fallback mỹ thuật: **không ghi đè hệ thống màu gameplay hiện có**. Trạng thái được phân biệt bằng đặc/rỗng, chữ và icon bổ sung, không chỉ màu.

Overlay vùng có thể tới: nền `rgba(200,173,111,0.10)`, viền `rgba(200,173,111,0.70)` nét đứt. Không phủ một lớp vàng đậm làm mất chữ/địa hình. Vùng đang hover/focus không biến thành một trạng thái khám phá mới.

### 23.3. Font và kiểu chữ

Font dưới đây là lựa chọn thiết kế; chỉ sử dụng nếu có tài nguyên font hỗ trợ tiếng Việt trong dự án hoặc có thể đóng gói hợp lệ. Có fallback, không phụ thuộc bắt buộc vào mạng ngoài.

| Nội dung | Font stack đề xuất | Desktop | Mobile | Weight / line-height |
| --- | --- | --- | --- | --- |
| Tiêu đề LÂN CẬN | Noto Serif, Georgia, serif | 36px | 26px | 600 / 1,15 |
| Tiêu đề Đông/Tây/Nam/Bắc hành | Noto Serif, Georgia, serif | 30px | 24px | 600 / 1,2 |
| Tên địa điểm trên map | Noto Serif, Georgia, serif | 14px | 14px | 500 / 1,35 |
| Câu dẫn ngắn | Noto Serif, Georgia, serif | 17px | 16px | 400 / 1,65 |
| Nhật ký dài, nội dung chung | Noto Sans, system-ui, sans-serif | 16px | 16px | 400 / 1,65 |
| Nút và danh sách địa danh | Noto Sans, system-ui, sans-serif | 15px | 15px | 600 / 1,4 |
| Nhãn mục nhỏ | Noto Sans, system-ui, sans-serif | 12px | 12px | 600 / 1,4 |

Không dùng ALL CAPS cho đoạn truyện hoặc nhật ký dài. Letter-spacing tiêu đề khoảng 0,04–0,08em; label nhỏ tối đa 0,04em để dấu tiếng Việt không bị rời. Chữ nghiêng chỉ dùng câu dẫn ngắn; nội dung dài vẫn thẳng dễ đọc.

Tên trên map có bóng tối mảnh hoặc backing nền `rgba(8,15,16,0.85)` với padding 2px 4px. Không dùng glow sáng quanh chữ. Kiểm tra tương phản sau khi ghép nền tranh, không chỉ trên màu phẳng: chữ thường ≥4,5:1, chữ lớn/điều khiển thiết yếu ≥3:1.

### 23.4. Kích thước và bố cục

Artboard tham chiếu khoảng 1536×1024; triển khai responsive, không ép mọi màn hình giữ tỷ lệ ảnh.

| Thành phần | Thông số triển khai gợi ý |
| --- | --- |
| Khung nội dung | max-width 1600px, căn giữa; padding 24px desktop, 12px mobile |
| Khoảng cách map–panel | 16–20px |
| Grid chính | `minmax(0, 1fr) minmax(320px, 380px)`; map lấy phần còn lại |
| Map desktop | min-height khoảng 500px; clamp chiều cao 500–680px theo viewport |
| Header | min-height 72px; title và breadcrumb có thể wrap khi cần |
| Panel padding | 24px desktop, 16px mobile |
| Khoảng cách đoạn/mục | 16px/24px; vạch chia 1px |
| Nhật ký | Nằm dưới map/panel; padding 20–24px; không chồng lên map |
| Truyền tống đóng | min-height 56px, một hàng có thể wrap hợp lý |
| Responsive một cột | Khi rộng dưới khoảng 1100px hoặc panel/map không đủ đọc |
| Mobile | Map cao khoảng 40–50dvh; panel chuyển sheet/khối dưới, CTA không che nội dung |

Thang spacing: **4 / 8 / 12 / 16 / 24 / 32 / 48px**. Dùng `min-width: 0`, wrap tên và văn bản; không khóa chiều cao panel nếu nội dung dài.

### 23.5. Nút, panel và trạng thái

- Góc panel 8px; nút 6px; viền 1px. Hoa văn chỉ ở khung ngoài/corner, không đặt cạnh mọi đoạn chữ.
- CTA chính cao tối thiểu 48px, rộng toàn panel; nền brass, chữ on-brass, padding ngang 16px.
- Nút hướng tối thiểu 44px cao; bốn nút chia đều khi đủ chỗ. Đông/Tây/Nam/Bắc đang chọn dùng nền brass và nhãn rõ.
- Nút phụ nền trong suốt/surface, viền border-subtle; hover surface-hover.
- Focus ring 2px màu focus, offset 3px; không chỉ dùng shadow mờ.
- Disabled: nền surface-raised, chữ text-muted, không hover; lý do thiếu tài nguyên/đường chặn hiện bằng văn bản cạnh đó. Không chỉ giảm opacity cả nút khiến chữ khó đọc.
- Đang xử lý: khóa submit lặp, nhãn trạng thái bằng tiếng Việt phù hợp ngữ cảnh; không đổi layout vì icon loading.
- Panel Dự liệu hành trình là disclosure có nhãn rõ; cảnh báo quan trọng vẫn hiện bên ngoài ngay cả khi đóng.
- Link Thiên đồ đặt thành hành động riêng ở header, không nhập vào breadcrumb như cấp con của địa điểm.

### 23.6. Map, marker và mức độ trang trí

| Hạng mục | Mục tiêu |
| --- | --- |
| Dot thường | Đường kính 8–10px |
| Dot hiện tại | 14–16px; không vòng quỹ đạo lớn |
| Dot chưa ghé | Viền khoảng 1,5–2px, lòng tối |
| Hit target | Tối thiểu khoảng 44×44 CSS px, xử lý overlap bằng danh sách/zoom |
| Nhãn so với dot | Cách khoảng 6–8px; dời nhãn để tránh va chạm |
| Tuyến thường | 1–1,5px, độ nổi thấp hơn dot/nhãn |
| Hướng/vùng đang xem | 1,5–2px, nét đứt nếu là dự kiến |
| Tranh nền | Ưu tiên tối và ít tương phản ở vùng đọc; giảm saturation nếu tranh quá nổi |
| Texture trên panel đọc | Opacity 3–6% tối đa gợi ý |
| Ornament mép ngoài | Không chiếm quá khoảng 24–32px chiều rộng mỗi mép, không bắt sự kiện chuột |

Giữ rải lệch có seed theo mục 3. Ảnh có thể kéo giãn một số khoảng trống để đọc rõ; code không lấy pixel trong ảnh làm world coordinates. Nếu dot quá chật, ưu tiên zoom/danh sách và dời nhãn trước khi phá giới hạn bố cục.

Không dùng screenshot toàn trang làm background để giả UI. Tách ít nhất: nền địa hình minh họa, ornament trang trí, lớp node/tuyến tương tác, text và control thực bằng HTML/SVG/canvas tùy dự án. Chữ/nút phải là thành phần tương tác thật, không nhúng thành ảnh.

### 23.7. Chuyển động

- Hover/focus màu: 120–180ms.
- Mở/đóng disclosure: khoảng 180–220ms, không làm mất focus.
- Camera pan cần thiết: 200–300ms, easing nhẹ, không overshoot.
- Không chạy animation force layout liên tục. Không làm dot nhấp nháy hoặc “thở” quá mạnh.
- Reduced motion: tắt pan có tween và hiệu ứng sương trang trí, giữ cập nhật trạng thái đầy đủ.
- Animation movement chỉ minh họa kết quả engine; duration animation không dùng làm time gameplay.

### 23.8. CSS tokens khởi đầu

Đoạn này là mẫu để AI chuyển vào hệ thống style của dự án, chưa phải code đã tích hợp:

```css
:root {
  --map-canvas: #080f10;
  --map-surface: #111c1c;
  --map-surface-raised: #182727;
  --map-surface-hover: #213333;
  --map-border: #344443;
  --map-brass-muted: #796846;
  --map-brass: #c8ad6f;
  --map-brass-hover: #dbc38b;
  --map-brass-active: #b69a5d;
  --map-on-brass: #17150e;
  --map-text: #e8e0cc;
  --map-text-secondary: #afbdb7;
  --map-text-muted: #8f9f99;
  --map-jade: #72aaa4;
  --map-focus: #9ae0d7;
  --map-warning: #e4b965;
  --map-warning-bg: #292316;
  --map-danger: #e28a80;
  --map-danger-bg: #2a1818;
  --map-range-fill: rgb(200 173 111 / 10%);
  --map-range-stroke: rgb(200 173 111 / 70%);
  --map-font-title: 'Noto Serif', Georgia, serif;
  --map-font-body: 'Noto Sans', system-ui, sans-serif;
  --map-radius-panel: 8px;
  --map-radius-control: 6px;
  --map-gap: 16px;
  --map-control-min: 44px;
  --map-cta-min: 48px;
}
```

### 23.8.1. Trạng thái triển khai 09/10/2026

Đã nối bản thiết kế vào runtime hiện hành. `Bản đồ → Lân cận` dùng local constellation hiện có làm lớp trình bày, bổ sung panel chọn hướng và bốn thẻ hành trình; không tự di chuyển khi chỉ mở map. `movementCandidatePreview` sinh tập ứng viên deterministic theo công thức tiến 1–3 ô và lệch 0–1 ô, còn `movementCommitments` lưu lựa chọn theo lượt trước khi commit. Các cạnh stride được ghi trong `openWorld.exitMeta` để validator, save/load và local map không nhầm với cạnh kề ô cũ.

Action Bar ghim một nút `⌖ Lân cận`, hiển thị mô tả hành động và giữ thao tác di chuyển qua cùng `submitActionId`/`move` canonical. CSS đã thêm token/panel/card responsive theo palette V2.5. Các kiểm tra đã chạy: syntax engine/UI/main, `verify_game`, action dispatch, expansion stress, UTF-8, requirement docs và offline bundle/parity. Phần cân bằng cost/weather trên từng đoạn vẫn lấy từ `travelPlan` canonical; UI không tạo resolver thứ hai.

### 23.9. Prompt đưa cho AI cùng ảnh

> Dùng ảnh LÂN CẬN đính kèm làm mẫu mỹ thuật và file LOCAL_MAP_CTHULHU_UX_UI.md V2.5 làm đặc tả hiện hành. Trước khi sửa, đọc code liên quan để xác định cấu trúc UI, node catalog, movement, weather và game clock. Giữ phong cách tiên hiệp Cthulhu: mực xanh đen, chữ ngà, đồng cổ, ornament ngoại vi tiết chế; áp dụng màu/font/layout/component ở mục 23. Không dùng ảnh toàn trang làm UI. Mọi node có tên ổn định, rải vị trí hiển thị bằng seed riêng và giữ nguyên world coordinates. Sáu điểm có thể tới không được xếp cứng 2×3. Tên màn hình là LÂN CẬN; Thiên đồ là link tới map thế giới. Chọn bốn hướng chỉ đổi preview/panel/vùng nhấn, camera pan khi cần, không tự đi. Khởi hành gọi cùng movement engine của game. Tích hợp weather theo trace W01–W10, kiểm tra WT01–WT13; không chỉ vẽ mưa và hiện cảnh báo mà bỏ hệ số cost. UI dùng lời dẫn tiên hiệp; công thức để trong logic/dev, dự liệu cần thiết vẫn xem được trước đi. Giữ những phần ngoài phạm vi đã ổn. Nếu code khác giả định tài liệu, ghi điểm khác và cập nhật quyết định thay vì âm thầm tạo engine song song. Hoàn thành thì cập nhật đường dẫn/hàm thật và kết quả kiểm tra vào file, không khẳng định đã test nếu chưa chạy.
