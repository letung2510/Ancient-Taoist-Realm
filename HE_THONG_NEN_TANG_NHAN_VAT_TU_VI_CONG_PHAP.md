# HỆ THỐNG NỀN TẢNG NHÂN VẬT — TU VI — CÔNG PHÁP

> **Trạng thái:** CANONICAL 2.0 — nguồn luật có thẩm quyền cao nhất  
> **Phạm vi:** khởi tạo nhân vật, Mệnh Số, tu vi, Con Đường, Công Pháp, Neo Nhân Tính, SAN/Corruption, Tà Thần, trận doanh và nghề ẩn.  
> **Nguồn ưu tiên:** chính tài liệu này. Mọi module, dữ liệu và runtime phải tuân theo định nghĩa tại đây.
>
> **Phạm vi hợp nhất:** tài liệu đã tích hợp dữ liệu khởi tạo chi tiết, nguồn học Công Pháp và ví dụ schema cần cho coding. Những cơ chế cũ trùng với hệ 14 cấp, Con Đường, Mệnh và trận doanh đã bị loại bỏ.
>
> **Nguyên tắc hợp nhất:** không tạo hệ điểm mới trùng chức năng; mọi bổ sung phải nằm ngay trong mục chuẩn liên quan, không tạo một bản luật song song.

---

## 1. Tầm nhìn và nguyên tắc nền

Hệ thống kết hợp tiên hiệp với kinh dị vũ trụ. Tu vi không chỉ là thước đo sức mạnh mà là độ sâu tồn tại: càng tiến xa, nhân vật càng có quyền can thiệp vào quy luật và càng dễ mất đi nhân tính.

Sáu nguyên tắc bất biến:

1. **Mệnh Số mở cửa:** nhân vật phải có tư cách về Mệnh mới được bước tới tầng tiếp theo.
2. **Căn Cốt chịu tải:** quyết định thân thể có sống sót qua tu luyện và nghi thức hay không.
3. **Ngộ Tính giải mã:** quyết định tốc độ lĩnh ngộ và khả năng hiểu đúng tri thức quỷ dị.
4. **Công Pháp là công cụ:** Công Pháp tăng hiệu quả hoặc thay đổi cái giá, không tự mở cảnh giới.
5. **Quyền năng luôn có giá:** sức mạnh lớn phải tiêu hao Linh Khí, Stamina, SAN, Thọ Nguyên, Mệnh Số, ký ức, quan hệ hoặc làm tăng Corruption/Mệnh Nợ.
6. **Tà Thần là ngoại lệ thế giới:** không phải “cấp 15”, không scale theo người chơi và không chịu luật đột phá thông thường.

---

## 2. Mô hình hệ thống thống nhất

Một nhân vật được mô tả bởi các lớp độc lập nhưng liên kết với nhau:

| Lớp | Chức năng | Không được dùng để thay thế |
|---|---|---|
| **Cảnh giới** | Độ sâu tồn tại, giới hạn quyền năng | Con Đường hoặc Công Pháp |
| **Con Đường** | Cách nhân vật biểu hiện quyền năng | Cảnh giới |
| **Mệnh Số** | Tư cách, thiên hướng và quan hệ nhân quả | EXP hoặc trang bị |
| **Công Pháp** | Kỹ thuật chiến đấu, tu luyện và hỗ trợ nghi thức | Mệnh dẫn hoặc điều kiện cảnh giới |
| **Neo Nhân Tính** | Giữ bản ngã trước tri thức và quyền năng siêu nhiên | SAN |
| **SAN** | Sức khỏe tinh thần có thể hồi phục | Corruption |
| **Corruption** | Mức tha hóa dài hạn, khó thanh tẩy | SAN |
| **Trận doanh** | Lập trường trong xung đột Thiên Đạo–Tà Thần | Con Đường |
| **Nghề ẩn** | Luật ngoại lệ bổ sung cho nhân vật | `realm_id` hoặc lịch sử Con Đường |

### 2.1. Thuật ngữ chuẩn

- **Cấp tu vi:** số từ 1 đến 14, dùng cho logic chung.
- **Danh xưng cảnh giới:** tên hiển thị theo Con Đường.
- **Tiến độ cấp:** EXP tích lũy trong cấp hiện tại; hệ thống không chia Sơ/Trung/Hậu Kỳ hay tiểu cảnh.
- **Mệnh dẫn:** tag bắt buộc để mở hoặc duy trì một Con Đường.
- **Mệnh trợ:** tag tăng tương hợp và hỗ trợ nghi thức.
- **Mệnh cấm:** tag gây xung đột, tăng chi phí hoặc phản phệ.
- **Mệnh nghịch:** tag bắt buộc riêng của Nghịch Hành Đạo.
- **Mệnh Khế:** lời thề, món nợ hoặc quan hệ nhân quả đang ràng buộc nhân vật.

---

## 3. Khởi tạo nhân vật

### 3.1. Luồng tạo Player

1. Người chơi chọn vùng khởi đầu.
2. Hệ thống roll toàn bộ hồ sơ đúng một lần; không có nút gieo lại.
3. Gán cấp 1 cố định là **Di Mệnh Cảnh**.
4. Roll chủng tộc theo trọng số vùng.
5. Roll PHY/MAG nền, Căn Cốt, Ngộ Tính, Linh Căn, hai tính cách không trùng, xuất thân và mục tiêu ẩn.
6. Gán `SAN = 100/100`, tính Stamina, Khí Huyết và Thọ Nguyên cơ sở.
7. Roll đúng **5 Mệnh Số cơ bản** không trùng; tổng điểm phải lớn hơn 5; phẩm cao nhất khi khởi tạo là Hoàng.
8. Roll độc lập Mệnh ẩn **Luân Hồi Tiên** với xác suất `0.0000075%`. Roll này không chiếm một trong 5 Mệnh cơ bản.
9. Cấp hai Công pháp Phàm khởi đầu: một Chiêu Thức và một Tâm Pháp; cả hai chỉ là kỹ năng nhập môn, không mặc định là Công Pháp Cốt Lõi của Con Đường.
10. Tính các chỉ số Mệnh, trạng thái, Final Stats và khởi tạo Mệnh Kho.
11. Lưu nhân vật cùng vùng/địa điểm khởi đầu rồi vào game.

Không roll cảnh giới cho Player mới. Phân bố cảnh giới hình tháp chỉ dùng khi sinh NPC hoặc quần thể thế giới.

### 3.2. Trọng số khởi tạo

**Căn Cốt và Ngộ Tính:** thang 1–100, khuyến nghị phân bố chuẩn `μ = 50`, `σ = 15`, clamp về 1–100.

**Linh Căn:**

| Nhóm | Tỷ lệ |
|---|---:|
| Tạp Linh Căn, 4–5 thuộc tính | 50% |
| Song/Tam Linh Căn thường | 35% |
| Đơn Linh Căn thuần khiết | 10% |
| Song/Tam Linh Căn hiếm | 4% |
| Dị Linh Căn: Băng, Lôi, Phong, Âm, Dương, Không Gian | 1% |

**Mệnh Số cơ bản:**

| Phẩm | Tỷ lệ mỗi lượt roll | Ghi chú |
|---|---:|---|
| Phàm | 65% | Phổ thông |
| Linh | 30% | Sơ cấp |
| Hoàng | 5% | Hiếm ở đầu game |
| Huyền–Tiên | 0% | Chỉ nhận qua gameplay |

Nếu 5 Mệnh bị trùng hoặc tổng điểm không lớn hơn 5, chỉ roll lại nội bộ phần Mệnh trước khi tạo nhân vật; đây không phải quyền reroll của người chơi.

### 3.3. Luân Hồi Tiên lúc khởi tạo

Khi trúng roll độc lập:

```json
{
  "hiddenFates": ["luan_hoi_tien"],
  "hiddenProfessionCandidate": "luan_hoi_tien",
  "hiddenProfession": null
}
```

Chỉ Mệnh Số được ghi nhận lúc tạo nhân vật. Nghề ẩn chưa kích hoạt cho tới khi thỏa toàn bộ điều kiện ở mục 10.2.

### 3.4. Dữ liệu tham chiếu khởi tạo (hợp nhất từ `character_creation_system.md`)

Các bảng dưới lấp đầy phần "roll chủng tộc theo trọng số vùng", "hai tính cách không trùng" và "mục tiêu ẩn" đã nêu ở mục 3.1 bước 5, để coding không phải tự bịa enum.

#### 3.4.1. Ví dụ Trọng Số Vùng (Region Weight Map)
Chủng tộc roll theo bảng trọng số gắn với vùng khởi đầu người chơi chọn ở bước 1. Vùng là dữ liệu mở rộng được (world data), đây chỉ là ví dụ mẫu:

| Vùng | Nhân Tộc | Yêu Tộc | Linh Tộc | Cổ Tộc | Ma Tộc |
|---|---:|---:|---:|---:|---:|
| Đông Hoang Phàm Nhân Giới | 85% | 10% | 4% | 1% | 0% |
| Bắc Nguyên Yêu Sương | 20% | 70% | 0% | 8% | 2% |

#### 3.4.2. Pool Tính Cách (roll đúng 2, không trùng)
```
["Chính trực", "Tàn nhẫn", "Tham lam", "Trung thành", "Cơ trí",
 "Lỗ mãng", "Lãnh đạm", "Nhiệt huyết", "Xảo quyệt", "Ẩn nhẫn"]
```

#### 3.4.3. Pool Mục Tiêu Ẩn (Hidden Goal — quyết định AI behavior của NPC)
```
["Báo thù", "Tìm cơ duyên", "Bảo vệ môn phái", "Thống nhất vùng",
 "Trốn tránh quá khứ", "Trường sinh"]
```
> Dùng cho NPC là chính; Player có thể để trống hoặc tự chọn qua onboarding UI.

#### 3.4.4. Bảng Xuất Thân (`origin.background`) — mô tả và hiệu ứng khởi đầu
| Giá trị enum | Tên hiển thị | Mô tả | Hiệu ứng khởi đầu gợi ý |
|---|---|---|---|
| `tong_mon` | Tông Môn | Được hưởng phúc lợi tài nguyên, có sư thừa | +Linh Thạch khởi đầu, mở NPC sư phụ, `path_score` khởi điểm +1 nếu Con Đường khớp môn phái |
| `the_gia` | Thế Gia | Thu nhập linh thạch ổn định, có quan hệ huyết thống | +thu nhập định kỳ, có Neo loại `npc` (người thân) sẵn, dễ vướng Mệnh Khế gia tộc |
| `tan_tu` | Tán Tu | Độc lập, khả năng sinh tồn cao, tài nguyên kém | +5% EXP tự tu (không phụ thuộc tông môn), không có Neo khởi đầu |
| `hac_dao` | Hắc Đạo | Tỷ lệ xung đột cao, tâm tính nguy hiểm | dễ roll Mệnh Hung hơn (+10% trọng số), mở sớm lựa chọn Nghịch Hành Đạo ở cấp 2 |
| `vo_danh` | Vô Danh | Hành tung bí ẩn, dễ có kỳ duyên/ẩn tình | +tỷ lệ gặp sự kiện Ngộ Đạo/nghề ẩn, không có tổ chức/Neo khởi đầu |

> Đây KHÔNG phải quest "Lựa Chọn Đạo Lộ" tách rời như bản cũ — `background` được roll thẳng ở bước 5 của mục 3.1, cùng lúc với chủng tộc và Linh Căn. Việc gia nhập một Tông Môn/Thế Gia **cụ thể** (chọn đúng tổ chức nào trong vùng) là hành động gameplay diễn ra tự nhiên khi Player tương tác NPC tuyển mộ sau cấp 2 (mục 6.2), không phải bước bắt buộc trong luồng khởi tạo.

---

## 4. Chỉ số nhân vật

### 4.1. Chỉ số chiến đấu và sinh tồn

| Chỉ số | Ý nghĩa |
|---|---|
| `PHY` | Thể phách, sức lực và nền sát thương vật lý |
| `MAG` | Linh lực, thần thức và nền hiệu ứng pháp thuật |
| `vitality` | Khí Huyết; về 0 thì chết |
| `stamina_current/max` | Khả năng hành động; hiện tại về 0 thì kiệt sức |
| `lifespan` | Thọ Nguyên; về 0 là chết tự nhiên |
| `SAN` | Tỉnh táo hiện tại, mặc định tối đa 100 |
| `corruption` | Nhiễm tà dài hạn, thang 0–100 |

### 4.2. Căn Cốt

`aptitude` nằm trong 1–100, trả lời câu hỏi “thân có chịu nổi không?”.

```text
body_resistance = aptitude + 0.5 × PHY + bonus_tam_phap
cultivation_exp_gain = base_exp × aptitude / 50
```

Căn Cốt ảnh hưởng tốc độ tu luyện, Stamina/Khí Huyết, sức chịu Thiên Kiếp, chi phí Linh Khí và số lần cưỡng ép có thể chịu. Nó không thay thế điều kiện Mệnh Số.

### 4.3. Ngộ Tính

`comprehension` nằm trong 1–100, trả lời câu hỏi “tâm có hiểu đúng không?”.

```text
comprehension_check = comprehension + 0.5 × MAG + bonus_cong_phap
mastery_exp_gain = base_gain × (1 + comprehension / 100)
```

Ngộ Tính tăng tốc lĩnh ngộ, mở thuộc tính ẩn của Công Pháp sớm hơn và giảm tổn thất SAN khi giải mã dị tượng. Ngộ Tính cao chỉ giúp thấy sự thật sớm, không bảo đảm sự thật đó có lợi.

### 4.4. SAN và Corruption

- SAN giảm khi gặp Dị Quỷ, đọc cấm thư, thất bại nghi thức hoặc dùng kỹ thuật có SAN cost; SAN có thể hồi phục.
- SAN về 0 kích hoạt mất trí: khóa điều khiển chủ động và chuyển sang hành vi cưỡng chế theo encounter.
- Corruption tăng do Cấm Thuật, Linh Khí Biến Dạng, khế ước Tà Thần và một số Nghịch Hành; chỉ giảm bằng cơ chế thanh tẩy được khai báo rõ.
- Mọi phép cộng/trừ phải clamp SAN và Corruption vào miền hợp lệ.

| Corruption | Hậu quả |
|---:|---|
| 0–20 | Chưa có phạt hệ thống |
| 21–40 | SAN tối đa `-5`, Khí Vận `-5` |
| 41–70 | Chính Đạo cảnh giác, giảm danh vọng, tăng Eldritch Quest |
| 71–90 | Dị hóa ngoại hình, một số NPC từ chối giao dịch |
| 91–100 | Có thể kích hoạt `ELDRITCH_INTERVENTION` độc lập với Mệnh Số |

---

## 5. Hệ thống Mệnh Số

### 5.1. Ba lớp Mệnh

```text
Mệnh Điểm = lượng quyền năng có thể vay từ thế giới
Mệnh Tính = Cát / Bình / Hung / Dị
Mệnh Khế  = lời thề, món nợ và quan hệ nhân quả
```

Các giá trị tổng hợp:

```text
Total_Fate_Score  = tổng điểm của Mệnh Số đang gắn
Normal_Fate_Score = tổng điểm Mệnh Cát/Bình đang gắn, không tính Hung
R = Total_Fate_Score / max(1, abs(Normal_Fate_Score))

effective_fate = Total_Fate_Score
  + fate_surplus × 2
  - fate_debt × 3
  - corruption × 0.5
```

`effective_fate` chỉ dùng để kiểm tra đột phá; không sửa điểm gốc của Mệnh Số hay vật phẩm trong Mệnh Kho. `R` là chỉ số cân bằng phục vụ điều kiện riêng và cảnh báo, không dùng ma trận trạng thái 0.2–5.0 cũ.

### 5.2. Mệnh Dư và Mệnh Nợ

- Hoàn thành quest, giữ lời thề, cứu NPC hoặc bảo vệ Neo tạo **Mệnh Dư**.
- Cưỡng ép đột phá, dùng Cấm Thuật để vượt điều kiện hoặc phá Mệnh Khế tạo **Mệnh Nợ**.
- Khi Mệnh Nợ lớn hơn Mệnh Dư, chi phí SAN/Thọ Nguyên ở lần đột phá kế tiếp tăng.
- Có thể trả Mệnh Nợ bằng Mệnh Cát, quan hệ quan trọng, ký ức hoặc quest thanh toán nhân quả.

### 5.3. Phẩm Mệnh Số

Thang phẩm thống nhất gồm: **Phàm → Linh → Hoàng → Huyền → Địa → Thiên → Thánh → Tiên**. Phẩm thể hiện độ hiếm và tiềm năng, không tự quyết định Mệnh đó là Cát hay Hung.

### 5.4. Mệnh đang gắn và Mệnh Kho

- Chỉ Mệnh đang gắn mới tham gia `Total_Fate_Score`, `Normal_Fate_Score`, `match_score` và hiệu ứng nhân vật.
- Mệnh trong kho là vật phẩm lưu trữ, không tự động kích hoạt.
- Dung lượng kho:

```text
Fate_Vault_Capacity = 2 × equipped_fate_count
```

Khi nhận Mệnh mới:

1. Từ chối nếu trùng `fate_id` với Mệnh đang gắn hoặc trong kho.
2. Nếu kho còn chỗ, thêm vào kho.
3. Nếu kho đầy, so `match_score` với Con Đường hiện tại.
4. Chỉ thay Mệnh trong kho kém tương hợp nhất khi Mệnh mới tốt hơn rõ ràng.
5. Nếu không có ứng viên tốt hơn, giữ nguyên kho và trả kết quả không nhận.

Không được làm mất vật phẩm khi thay thế thất bại. Mọi thao tác gắn, tháo, dung hợp, hiến tế hoặc thay Mệnh phải là transaction nguyên tử và rollback khi lỗi.

### 5.5. Hiến tế Mệnh Số

`sacrificeFate(state, fateId)` chỉ hợp lệ khi nhân vật đã chọn Con Đường và `fateId` đang nằm trong Mệnh Kho.

Kết quả thành công:

- Xóa Mệnh hiến tế khỏi kho.
- Chọn ngẫu nhiên một Mệnh không trùng có `match_score >= 3` với Con Đường.
- Đưa Mệnh mới vào kho, không tự gắn.
- Trừ 5 SAN.

Nếu không có Mệnh phù hợp, transaction hủy và không tiêu hao gì.

---

## 6. Hệ 14 cấp tu vi

### 6.1. Quy tắc chung

- Mọi nhân vật bắt đầu ở cấp 1, **Di Mệnh Cảnh**.
- Khi lên cấp 2, người chơi chọn Con Đường hợp lệ; danh xưng từ cấp 2 trở đi lấy theo Con Đường.
- Tên cảnh giới cổ điển chỉ có thể tồn tại dưới dạng tag tương thích dữ liệu, không dùng trong UI chính.
- Hệ thống có đúng 14 cấp phẳng; không có tiểu cảnh bên trong từng cấp.
- EXP chỉ mở quyền thực hiện nghi thức; đạt EXP không đồng nghĩa đột phá tự động.
- Bảng dưới là chuẩn cho Con Đường thường. **Ngoại Đạo Giả** vẫn phải vượt đủ 14 cấp và toàn bộ điều kiện nền, nhưng áp dụng bộ luật khắc nghiệt riêng ở mục 6.3.

### 6.2. Điều kiện 14 cấp

| Cấp | Mẫu cảnh giới chung | Điều kiện ngoài EXP | Điều kiện Mệnh tối thiểu |
|---:|---|---|---|
| 1 | Di Mệnh | Khởi tạo | 5 Mệnh cơ bản, tổng điểm > 5 |
| 2 | Khai Lộ | Đủ 100 EXP hoặc vật phẩm khai mạch; chọn đường | ≥1 Mệnh dẫn, `path_score >= 3` |
| 3 | Dựng Thai | Nghi thức nền, có Công Pháp lõi | ≥2 tag dẫn/trợ, `Total_Fate >= 20` |
| 4 | Kim Ấn | Neo Nhân Tính ổn định | ≥2 Mệnh dẫn, `Total_Fate >= 35` |
| 5 | Anh Linh | Vượt kiểm tra Căn Cốt và Ngộ Tính | ≥3 tag tương hợp, `Total_Fate >= 55` |
| 6 | Thần Tính | Nghi thức Chưởng Quyền riêng | ≥3 Mệnh dẫn/trợ, `Total_Fate >= 80` |
| 7 | Hư Giới | Neo không vỡ; Corruption trong giới hạn nghi thức | `Normal_Fate >= 30`, `R >= 0.5` |
| 8 | Hợp Đạo | Hợp nhất Công Pháp lõi với Con Đường; chọn trận doanh | `path_score >= 8`, `Total_Fate >= 140` |
| 9 | Thiên Kiếp | Hoàn thành đại nghi thức và sống sót | ≥4 tag dẫn/trợ, `Normal_Fate >= 55` |
| 10 | Chủ Tể | Tạo một Quyền Năng độc quyền | `Total_Fate >= 220`, Neo cấp cao |
| 11 | Chân Ngoại | Vượt quest theo trận doanh | `path_score >= 12`, không có Mệnh Nợ quá hạn |
| 12 | Kim Bất Hoại | Giữ Chân Danh qua phản phệ | `Total_Fate >= 320`, `Normal_Fate >= 110` |
| 13 | Thái Ất | Hoàn tất chuẩn bị quyết chiến | ≥4 Mệnh dẫn, `Total_Fate >= 450` |
| 14 | Đạo Ngoại | Thắng thử thách cuối | `tainted_god_defeated = true` và đủ ngưỡng riêng của đường |

Nếu không có Con Đường đạt điều kiện khi đủ 100 EXP, nhân vật được quyền trở thành **Kẻ Vô Lộ**, nghề chính thức là **Ngoại Đạo Giả** (`ngoai_dao_gia`). Đây là một lộ trình độc lập, không còn là trạng thái tạm chờ tìm nghề.

### 6.3. Luật riêng của Ngoại Đạo Giả

Ngoại Đạo Giả không dựa vào Mệnh dẫn, không gia nhập Con Đường thường và không cần hiến tế Mệnh Số để nhập hoặc tiếp tục lộ trình. Đổi lại, quá trình thăng cấp khắc nghiệt hơn:

1. EXP yêu cầu ở mọi cấp bằng **5 lần** EXP chuẩn của cùng cấp.
2. Vẫn áp dụng mọi điều kiện nền trong bảng 6.2, trừ điều kiện gắn với `path_score`, Mệnh dẫn/trợ, trận doanh, Tà Thần và `tainted_god_defeated`.
3. Mọi ngưỡng `Total_Fate` và `Normal_Fate` trong bảng 6.2 được nhân đôi. Ở cấp không ghi ngưỡng điểm cụ thể, phải đạt `effective_fate` tối thiểu bằng hai lần `min_total_fate` cấu hình của cấp đó.
4. Mọi lần đột phá từ cấp 3 trở đi phải vượt **cả** `body_check` và `mind_check`, với độ khó mỗi check tăng 15.
5. Không được dùng Cấm Thuật, hiến tế Mệnh hoặc quyền miễn điều kiện để bỏ qua cửa đột phá.
6. Không chọn trận doanh, không nhận chú ý/quest/danh hiệu/phần thưởng Tà Thần–Thiên Đạo và không mở Thôn Phệ Thiên Đạo.
7. Không thể đồng thời mang Con Đường thường hoặc nghề ẩn. Muốn nhận nghề khác phải rời Ngoại Đạo Giả theo quest chuyển đường và mất toàn bộ tiến độ EXP của cấp hiện tại.
8. Ở cấp 8, 11 và 13, các điều kiện trận doanh được thay bằng ba thử thách **Tự Chứng**, **Đoạn Luật** và **Lập Đạo**. Cấp 14 yêu cầu hoàn tất **Vô Lộ Chứng Đạo** và ghi `unbound_path_proven = true` thay cho cờ chiến thắng Tà Thần.

Ngoại Đạo Giả giữ nguyên tên cảnh giới mặc định ở mọi cấp:

| Cấp | Danh xưng mặc định |
|---:|---|
| 1 | Di Mệnh Cảnh |
| 2 | Khai Lộ Cảnh |
| 3 | Dựng Thai Cảnh |
| 4 | Kim Ấn Cảnh |
| 5 | Anh Linh Cảnh |
| 6 | Thần Tính Cảnh |
| 7 | Hư Giới Cảnh |
| 8 | Hợp Đạo Cảnh |
| 9 | Thiên Kiếp Cảnh |
| 10 | Chủ Tể Cảnh |
| 11 | Chân Ngoại Cảnh |
| 12 | Kim Bất Hoại Cảnh |
| 13 | Thái Ất Cảnh |
| 14 | Đạo Ngoại Cảnh |

### 6.4. Nghi thức đột phá

Mỗi lần đột phá từ cấp 2 trở đi gồm:

1. **Gọi Mệnh:** dùng Chân Danh hoặc vật dẫn.
2. **Dựng Neo:** chọn NPC, địa điểm, ký ức hoặc lời thề làm Neo.
3. **Đối Chiếu:** kiểm tra điều kiện cấp và Con Đường bằng `effective_fate`.
4. **Vượt Dị Tượng:** kiểm tra Căn Cốt/Ngộ Tính theo nghi thức.
5. **Trả Giá:** tiêu hao tài nguyên và ghi hậu quả.

Thứ tự xử lý bắt buộc:

```text
realm_gate → path_gate → anchor_gate → body/mind_check → cost_commit
```

Chỉ commit thay đổi sau khi tất cả bước hợp lệ. UI phải hiển thị điều kiện thiếu, giá phải trả và nguy cơ cưỡng ép trước khi xác nhận.

### 6.5. Công thức xác suất

```text
fate_gate = effective_fate >= min_total_fate
virtue_gate = Normal_Fate_Score >= min_normal_fate
body_check = aptitude + random(1..20) >= min_aptitude
mind_check = comprehension + random(1..20) >= min_comprehension

breakthrough_chance = clamp(
  35%
  + aptitude × 0.25%
  + comprehension × 0.20%
  + min(20%, (effective_fate - min_total_fate) × 0.05%)
  - corruption × 0.15%,
  configured_min_chance,
  configured_max_chance
)
```

- Trượt `fate_gate` hoặc `path_gate`: từ chối nghi thức, không tiêu hao.
- Trượt `virtue_gate`: chỉ được cưỡng ép nếu có kỹ thuật cho phép; luôn tăng Corruption và Mệnh Nợ.
- Thất bại sau khi nghi thức bắt đầu: mất 5–15% EXP của cấp hiện tại, giảm SAN và có thể tổn thương Thọ Nguyên/Neo.
- Cấm Thuật có thể thay đổi một phần `body_check`, không được xóa `realm_gate` hay `path_gate`.
- Mọi lần cưỡng ép phải lưu `fate_debt`, `san_cost`, `corruption_gain`, `anchor_impact` và kết quả roll.

---

## 7. Mười Con Đường chính

### 7.1. Chọn và duy trì Con Đường

```text
match_score = 3 × matched_lead_tags
            + 1 × matched_support_tags
            - 2 × matched_forbidden_tags

required_path_score(realm) = 3 + floor(realm_index / 2)
```

Điều kiện mở đường: có ít nhất một Mệnh dẫn, `match_score >= 3` và bộ Mệnh không phải toàn Hung Cách. Tên, mô tả, `effects`, `type` và `tags` của Mệnh phải được chuẩn hóa chữ thường không dấu trước khi so khớp.

| Con Đường | Mệnh dẫn | Mệnh trợ | Mệnh cấm | Chỉ số chủ | Mặt trái |
|---|---|---|---|---|---|
| Kiếm Đạo | `kim`, `kiếm`, `sát` | `phong`, `lôi`, `chiến` | `mộng`, `ảo`, `nô` | PHY, Căn Cốt | Phải cắt quan hệ hoặc lời thề ở các nghi thức lớn |
| Đan Đạo | `đan`, `dược`, `hỏa` | `sinh`, `mộc`, `lô` | `độc`, `hàn`, `tử` | MAG, Ngộ Tính | Đan độc và biến đổi thân thể tích lũy |
| Phù Đạo | `phù`, `ấn`, `văn` | `lôi`, `hỏa`, `kim` | `câm`, `vô danh` | Ngộ Tính, MAG | Phù mạnh có thể xóa ký ức |
| Phong Thủy Đạo | `địa`, `sơn`, `thủy` | `trận`, `long`, `huyệt` | `vực`, `hư vô` | Ngộ Tính, SAN | Sai long mạch phản chấn lên khu vực |
| Ngự Thú Đạo | `thú`, `yêu`, `huyết` | `sinh`, `sơn`, `nguyên` | `diệt`, `độc` | Căn Cốt, PHY | Đồng cảm càng sâu, bản ngã người càng mỏng |
| Khôi Lỗi Đạo | `khôi`, `cơ`, `hồn` | `kim`, `mộc`, `ấn` | `sinh`, `mộng` | MAG, Ngộ Tính | Khôi lỗi hoạt hóa bào mòn cảm xúc |
| Âm Luật Đạo | `âm`, `hồn`, `tử` | `mộng`, `nguyệt`, `nhạc` | `lôi`, `quang` | Ngộ Tính, SAN | Nghi thức có thể gọi nhầm người chết |
| Mộng Cảnh Đạo | `mộng`, `tâm`, `ảo` | `nguyệt`, `hồn`, `vô` | `kiếm`, `sát` | Ngộ Tính, SAN | Ký ức thật và giả dần hòa lẫn |
| Luyện Thể Đạo | `thể`, `huyết`, `cốt` | `lôi`, `hỏa`, `sơn` | `hồn`, `mộng` | Căn Cốt, PHY | Cường hóa cần đau đớn thật, thất bại gây dị hóa |
| Tinh Tượng Đạo | `tinh`, `thiên`, `mệnh` | `nhật`, `nguyệt`, `địa` | `vô danh`, `đoạn mệnh` | Ngộ Tính, MAG | Biết tương lai làm giảm tự do lựa chọn |

### 7.2. Năm nấc chuyên môn

| Nấc | Mốc mở | Điều kiện cốt lõi |
|---|---:|---|
| Khai Lộ | 2 | Chọn đường và có Mệnh dẫn |
| Lập Ấn | 3 | Có hai tag dẫn/trợ và Công Pháp lõi |
| Chưởng Quyền | 6 | Hoàn tất nghi thức riêng của đường |
| Thần Tính | 10 | Có Neo ổn định, quyền năng riêng, không nợ quá hạn |
| Thành Thần | 14 | Tạo Quyền Năng độc quyền; là cách cấp 14 biểu hiện, không phải cấp 15 |

### 7.3. Nghi thức đặc trưng

| Con Đường | Khai Lộ | Chưởng Quyền | Thành Thần |
|---|---|---|---|
| Kiếm | Chém vật dẫn bằng kiếm chưa dính máu | Chém đứt một Mệnh Khế | Chém được “tên” của dị tượng |
| Đan | Luyện đan bằng linh hỏa tự thân | Luyện đan chứa ký ức người chết | Tạo Sinh Đan không cần nguyên liệu |
| Phù | Viết phù bằng máu hoặc linh sa | Viết phù lên không gian | Ban Phù Luật buộc thế giới tuân theo |
| Phong Thủy | Nhận biết linh mạch trong một giờ | Đổi hướng một long mạch | Dựng Tiểu Thiên Địa ổn định |
| Ngự Thú | Kết khế ước không cưỡng ép | Đồng hóa cảm giác với linh thú | Thành tổ huyết của một loài |
| Khôi Lỗi | Tạo khôi lỗi có tên | Cho khôi lỗi tự chọn mệnh lệnh | Tạo thân thứ hai tự chủ |
| Âm Luật | Gọi đúng một linh hồn | Chỉ huy nghi lễ bảy hồi | Gọi linh hồn chưa từng tồn tại |
| Mộng Cảnh | Ngủ qua dị mộng có chủ | Thắng bản ngã trong mộng | Viết lại giấc mơ của toàn vùng |
| Luyện Thể | Chịu lôi kích không hộ pháp | Phá thân rồi tái tạo | Sống khi Chân Danh bị xóa |
| Tinh Tượng | Đọc đúng một thiên tượng | Đổi một xác suất nhỏ của tương lai | Tạo chòm sao mang tên mình |

### 7.4. Danh xưng 14 cấp theo Con Đường

Từ cấp 2, mỗi Con Đường dùng một hệ danh xưng riêng theo bản chất quyền năng; không ghép lặp máy móc tên cấp chung vào mọi đường. Cấp 1 vẫn là Di Mệnh vì đây là điểm xuất phát trước khi chọn đường.

| Con Đường | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kiếm | Di Mệnh | Mầm Gươm Thức Tỉnh | Thai Kiếm Tàng Phong | Kiếm Tâm Đúc Ấn | Vạn Nhận Hóa Linh | Tàng Kiếm Vực Chủ | Hư Không Trảm Bộ | Nhất Kiếm Thành Luật | Cửu Kiếp Phá Thiên | Nhân Quả Kiếm Quân | Ngoại Vực Kiếm Thánh | Bất Diệt Kiếm Cốt | Thái Ất Trảm Mệnh | Vô Thượng Kiếm Tổ |
| Đan | Di Mệnh | Linh Hỏa Nhập Lô | Dược Thai Kết Châu | Sinh Đan Huyền Chủ | Bách Thảo Hóa Hồn | Vạn Dược Tôn Sư | Đan Hải Du Tiên | Sinh Tử Đồng Luyện | Cửu Lô Độ Ách | Tạo Hóa Đan Vương | Vực Ngoại Dược Thánh | Bất Hủ Linh Dược | Thái Ất Hồi Sinh | Vạn Sinh Đan Tổ |
| Phù | Di Mệnh | Linh Văn Sơ Hiện | Phù Thai Kết Chú | Cửu Ấn Minh Sư | Hộ Phách Phù Linh | Vạn Pháp Chú Vực | Hư Không Hành Văn | Nhất Ngôn Thành Luật | Lôi Kiếp Thiên Thư | Mệnh Phù Tôn Giả | Ngoại Thiên Chân Lục | Bất Hủy Kim Văn | Thái Ất Sắc Mệnh | Vô Cực Phù Tổ |
| Phong Thủy | Di Mệnh | Tầm Long Khởi Bộ | Huyệt Nhãn Sinh Căn | Sơn Hà Trấn Ấn | Địa Linh Hiển Tướng | Long Mạch Chưởng Sư | Hư Địa Du Long | Càn Khôn Chuyển Mạch | Vạn Sơn Địa Kiếp | Sơn Hà Định Chủ | Thiên Ngoại Địa Tiên | Bất Động Long Cốt | Thái Ất Định Thế | Đại Địa Đạo Tôn |
| Ngự Thú | Di Mệnh | Linh Thú Kết Duyên | Huyết Khế Đồng Sinh | Bách Thú Hiệu Lệnh | Hoang Linh Hóa Tướng | Vạn Linh Ngự Chủ | Dị Giới Thú Hành | Tổ Huyết Quy Nhất | Hoang Cổ Thú Kiếp | Vạn Loài Cộng Chủ | Thiên Ngoại Thú Hoàng | Bất Tử Tổ Huyết | Thái Ất Linh Vương | Vạn Thú Nguyên Tổ |
| Khôi Lỗi | Di Mệnh | Cơ Tâm Khởi Động | Linh Mộc Thành Khu | Thiên Cơ Tạo Ấn | Khôi Hồn Tự Thức | Vạn Cơ Điều Ngự | Hư Vực Cơ Hành | Cơ Luật Đồng Quy | Khôi Thành Độ Kiếp | Thiên Cơ Chúa Tể | Ngoại Vực Cơ Thần | Bất Hoại Khôi Thân | Thái Ất Cơ Mệnh | Vô Tận Khôi Tổ |
| Âm Luật | Di Mệnh | Nhất Âm Khai Hồn | U Khúc Dưỡng Phách | Minh Thanh Trấn Ấn | Vong Ca Dẫn Linh | U Minh Nhạc Tướng | Hư Âm Độ Giới | Vạn Thanh Quy Luật | Thiên Khúc Hồn Kiếp | U Minh Nhạc Đế | Ngoại Vực Âm Thánh | Bất Diệt Hồn Ca | Thái Ất Tịch Thanh | Vô Thanh Nhạc Tổ |
| Mộng Cảnh | Di Mệnh | Mộng Nhãn Sơ Khai | Tâm Ảnh Kết Thai | Nguyệt Mộng Chân Nhân | Thiên Mộng Hóa Linh | Mộng Hải Dệt Sư | Vô Gian Du Mộng | Chân Huyễn Đồng Quy | Vạn Mộng Tâm Kiếp | Mộng Giới Quân Vương | Ngoại Cảnh Chân Mộng | Bất Tỉnh Mộng Thân | Thái Ất Huyễn Mệnh | Vĩnh Dạ Mộng Tổ |
| Luyện Thể | Di Mệnh | Khí Huyết Khai Môn | Thiết Cốt Dựng Thân | Kim Cương Tạo Thể | Bất Khuất Chiến Hồn | Ma Khu Trấn Thế | Phá Giới Võ Thân | Huyết Cốt Đồng Nguyên | Bách Luyện Thần Kiếp | Cực Đạo Võ Tôn | Ngoại Thiên Chiến Thánh | Vạn Kiếp Bất Hoại | Thái Ất Huyết Tôn | Hỗn Nguyên Thể Tổ |
| Tinh Tượng | Di Mệnh | Tinh Nhãn Quan Thiên | Thiên Bàn Định Vị | Nhật Nguyệt Chiêm Quan | Tinh Hồn Giáng Thế | Bắc Đẩu Mệnh Sư | Tinh Hải Viễn Du | Chư Thiên Định Quỹ | Tinh Lạc Đại Kiếp | Thiên Mệnh Tinh Quân | Vực Ngoại Quan Tinh | Bất Diệt Tinh Thể | Thái Ất Toán Chủ | Tinh Hải Đạo Tổ |

### 7.5. Chuyển, song tu và dung hợp đường

- Trước cấp 4, chuyển đường chỉ mất EXP và phải thỏa điều kiện đường mới.
- Từ cấp 4, chuyển đường phải phá một Mệnh Khế, tăng Mệnh Nợ và tác động Neo.
- Song đường mở từ cấp 6, yêu cầu `match_score >= 5` cho cả hai và tăng thêm 10% SAN cost.
- Dung hợp đường mở từ cấp 10 khi hai đường có ít nhất một Mệnh trợ chung; kết quả là một Thần Tính Lai nhưng vẫn giữ lịch sử hai đường gốc.
- Khi có ít nhất hai Mệnh cấm chưa hóa giải, nhân vật có thể sa sang Dị Hệ; mỗi nghi thức sau đó tăng Corruption.

---

## 8. Nghịch Hành Đạo

Nghịch Hành là lựa chọn Con Đường cấp 2 hoặc chuyển hóa về sau, không phải buff miễn phí.

```text
negative_path_gate = Total_Fate >= normal_gate + 25
  AND matched_lead_fates >= 2
  AND matched_contrary_fates >= 1

negative_cost = base_cost × (1 + fate_debt × 0.10)
```

| Nghịch Hành | Mệnh dẫn | Mệnh nghịch | Chi phí trực tiếp chính | Rủi ro thất bại |
|---|---|---|---|---|
| Sát Thần | `sát`, `chiến`, `huyết` | `nghiệp`, `hung`, `diệt` | Stamina tối đa `-8%`/nghi thức; SAN `-3`/boss | Hóa quái |
| Huyết Đan | `đan`, `huyết`, `hỏa` | `độc`, `tử`, `hao mệnh` | Khí Huyết `-12%`, Thọ Nguyên `-2–8 năm` | Chết hoặc mất phần lớn EXP cấp hiện tại |
| Thi Giải | `thi`, `hồn`, `âm` | `tử`, `oán`, `vô danh` | SAN tối đa `-5`, Khí Huyết `-5%` | Bị chiếm xác tạm thời |
| Phệ Mệnh | `mệnh`, `đoạt`, `tham` | `phản`, `hung`, `vực` | Corruption `+8`, tổn hại Mệnh mục tiêu | `FATE_BACKFIRE` |
| Tà Tụng | `tà`, `tụng`, `ngoại` | `điên`, `mộng`, `vô danh` | SAN `-10`, Corruption `+12` | Bị Tà Thần đánh dấu |
| Khổ Hành | `khổ`, `thể`, `cốt` | `đoạn`, `huyết`, `đau` | HP hiện tại `-15%`, Stamina tối đa `-5%` | Thương tật vĩnh viễn |
| Vong Niệm | `quên`, `vô`, `đoạn mệnh` | `tâm`, `hồn`, `gia` | Mất ký ức và quan hệ NPC | Neo vỡ |

Mọi giảm stat vĩnh viễn được lưu trong `path_debt`, không reset khi đổi đường. Danh xưng mặc định của Nghịch Hành dùng mẫu `[tên Nghịch Hành] · [mẫu cảnh giới chung]`; chỉ dùng bảng riêng khi dữ liệu đường đó khai báo đủ 14 tên.

---

## 9. Neo Nhân Tính và trạng thái hệ thống

### 9.1. Neo Nhân Tính

Neo có thể là NPC, địa điểm, ký ức hoặc lời thề.

```json
{
  "type": "npc|place|memory|oath",
  "id": "su_phu",
  "stability": 72,
  "lastRenewedTurn": 18,
  "broken": false
}
```

- Neo ổn định giảm 10–30% SAN loss trong nghi thức.
- Neo suy yếu tăng nguy cơ mất kiểm soát và lộ tác dụng ẩn bất lợi.
- Neo vỡ tạo Mệnh Nợ và có thể kích hoạt `ELDRITCH_INTERVENTION`.
- Từ cấp 6 trở lên phải có ít nhất một Neo hoạt động.

### 9.2. Trạng thái quyền năng

| State chuẩn | Điều kiện | Hành vi |
|---|---|---|
| `NORMAL_GROWTH` | Mệnh Nợ thấp, Neo ổn định | Gameplay bình thường |
| `FATE_BACKFIRE` | Mệnh xung khắc hoặc Mệnh Nợ cao | Phản chấn hành động mạnh; tăng SAN cost/Corruption |
| `ELDRITCH_INTERVENTION` | Corruption 91+, Neo vỡ hoặc trigger Tà Thần | Ngữ cảnh cưỡng chế, chỉ action Priority 0 |
| `ASCENDANT_UNBOUND` | Cấp 14 và hoàn thành nghi thức cuối | Mở ending biến số thế giới |

State ID phải dùng đúng tên trên, không trộn biến thể có tiền tố `STATE_`. Priority 0 chỉ ghi đè action trong lúc trạng thái cưỡng chế tồn tại, không xóa quest hay dữ liệu tiến độ.

---

## 10. Nghề ẩn

### 10.1. Luật chung

Nghề ẩn không xuất hiện trong màn hình chọn đường và không được roll trực tiếp. Hệ thống phát hiện nghề khi nhân vật có Mệnh độc quyền và thỏa quest, cảnh giới, Neo hoặc điều kiện tử vong tương ứng.

Thứ tự kiểm tra:

```text
Mệnh độc quyền → cấp tối thiểu → quest/Neo/tử vong
→ cảnh báo giá phải trả → commit nghề vào save
```

Nghề ẩn không ghi đè `realm_id`; nó chỉ sửa luật tử vong, Mệnh, Mệnh Khế, quyền năng hoặc cách tương tác với thế giới.

### 10.2. Luân Hồi Tiên

Điều kiện kích hoạt:

1. Sở hữu đúng Mệnh độc quyền `luan_hoi_tien` phẩm Tiên.
2. Hoàn thành quest **Ký Ức Qua Ba Kiếp**.
3. Đạt tối thiểu cấp 5.
4. Có một Neo ổn định.
5. Chết tự nhiên do Thọ Nguyên về 0.

Khi luân hồi:

- Giữ Mệnh độc quyền, ký ức lõi, một Mệnh Khế và một phần Ngộ Tính.
- Mất phần lớn vật phẩm, một phần Căn Cốt và tiến độ Công Pháp hiện tại.
- Tăng `rebirth_count`, giảm dần Thọ Nguyên cơ sở và mở biến thể nghề mới.
- Không kích hoạt bằng tự sát, bị giết, Cấm Thuật hoặc cơ chế hồi sinh bị lạm dụng.

Luân Hồi Tiên là ngoại lệ duy nhất không chịu các mốc Tà Thần, trận doanh và phần thưởng ở mục 12; nó dùng chuỗi quest luân hồi riêng.

### 10.3. Các nghề ẩn khác

| Nghề | Mệnh độc quyền | Cách mở | Luật riêng |
|---|---|---|---|
| Kẻ Ghi Chép Tận Thế | Tận Thế Thư Sinh — Tiên | Đọc 7 mảnh cấm thư, SAN vẫn trên 1 | Thấy trước world event nhưng không sửa trực tiếp |
| Thần Quan Neo Nhân Tính | Vạn Dân Tín Niệm — Thánh | Được 5 NPC tự nguyện lấy làm Neo | Chia SAN; Neo chết gây phản chấn diện rộng |
| Kẻ Không Có Chân Danh | Vô Danh Ngoại Đạo — Dị | Xóa Chân Danh ở Hư Giới | Khó bị truy tìm nhưng mất buff Danh Vị thường |
| Ngục Tốt Nhân Quả | Thiên Lao Mệnh Khế — Thiên | Nhận 3 Mệnh Nợ thay NPC | Khóa một action Boss, đổi bằng Thọ Nguyên |
| Thực Tử Giả | Phệ Hồn Cầu Sinh — Dị | Sống sót 3 lần HP về 0 nhờ Tà Pháp | Hồi sinh một lần/chương, tăng mạnh Corruption |
| Mộng Du Tiên Nhân | Mộng Ngoại Chi Nhân — Tiên | Hoàn thành quest trong Mộng Cảnh | Hành động ngoài lượt, mất mảnh ký ức |

Các nghề này vẫn chịu mốc 5/8/11/13, trận doanh và điều kiện cấp 14 như nhân vật thường.

---

## 11. Hệ thống Công Pháp

### 11.1. Phân loại theo chức năng

| Loại | Vai trò |
|---|---|
| Tâm Pháp | Bị động; tăng trưởng nền và hệ thân thuộc |
| Chiêu Thức | Sát thương hoặc hiệu ứng chủ động |
| Thân Pháp | Cơ động, né tránh, thoát thân |
| Trận Pháp | Hiệu ứng khu vực, hỗ trợ nghi lễ |
| Phụ Trợ Pháp | Hồi phục, buff, bảo vệ SAN/đồng đội |
| Cấm Thuật/Tà Pháp | Vượt ngưỡng cục bộ bằng giá SAN, Corruption, Stamina hoặc Thọ Nguyên |
| Đan/Phù Pháp | Chế tạo ngoài chiến đấu |

### 11.2. Cấp và phẩm

| Cấp | Hạ/Trung/Thượng Phẩm — hệ số nền | Cấp tu vi tối thiểu |
|---|---|---:|
| Phàm | `0.6 / 0.7 / 0.8` | 1 |
| Hoàng | `1.0 / 1.1 / 1.2` | 2 |
| Huyền | `1.5 / 1.7 / 2.0` | 3 |
| Địa | `2.5 / 3.0 / 3.5` | 4 |
| Thiên | `4.5 / 5.5 / 6.5` | 5 |
| Tiên | `8.0 / 10.0 / 12.0` | 6+ |

Cấm Thuật không phân phẩm, có hệ số biến thiên `3.0–20.0` và có thể học ở bất kỳ cấp nào nếu nguồn cấp phép; dùng dưới cấp khuyến nghị làm chi phí tăng mạnh. Học được không có nghĩa là đủ điều kiện thi triển an toàn.

### 11.3. Năm mức thục luyện

| Mức | Hệ số nhận | Mở khóa |
|---|---:|---|
| Nhập Môn | 0.60 | Hiệu ứng cơ bản |
| Tiểu Thành | 0.80 | Bắt đầu lộ thuộc tính ẩn ngẫu nhiên |
| Đại Thành | 1.00 | Lộ thuộc tính yêu cầu mastery |
| Viên Mãn | 1.15 | Mana cost `-15%`, cooldown `-10%` |
| Đại Viên Mãn | 1.30 | Có thể mở nhánh tiến hóa |

Chỉ lần dùng thành công trong encounter thật tăng đầy đủ `usage_count`; luyện tập nhận hệ số thấp hơn do cấu hình.

### 11.4. Ngũ Hành

```text
Tương Sinh: Kim → Thủy → Mộc → Hỏa → Thổ → Kim
Tương Khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim
```

- Tâm Pháp A sinh Chiêu Thức B: cộng `10 + 2 × min(grade_index)` phần trăm hiệu ứng.
- Tâm Pháp và Chiêu Thức của cùng người khắc nhau: trừ `8 + 3 × min(grade_index)` phần trăm và tăng 3 Điên Loạn mỗi lần dùng.
- Chiêu Thức A khắc hệ phòng thủ B của địch: cộng `15 + 3 × min(grade_index)` phần trăm sát thương.
- Vô Hệ trung tính.
- Dị Hệ khắc cả năm hệ khi tấn công nhưng xung đột với mọi Tâm Pháp chính đạo; phạt nội bộ nhân đôi.

### 11.5. Bốn khối Công Pháp theo trận doanh

| Family | Quyền truy cập | Quan hệ |
|---|---|---|
| `thien_dao_thuat` | Trung Thành Thiên Đạo | Khắc Cấm Thuật; cộng nhiều stat, giá thấp |
| `cam_thuat` | Phản Bội/Tà Thần | Khắc Phép thường; sức mạnh cao, giá sinh mệnh/Corruption lớn |
| `nguyen_thuat` | Trung Gian | Khắc chế cân bằng Thiên Đạo Thuật và Cấm Thuật |
| `thuong` | Mọi phe | Cộng hưởng nhẹ cho Nguyên Thuật và Thiên Đạo Thuật |

Family là lớp quan hệ chiến đấu, còn category là chức năng. Một Công Pháp phải có cả hai field; ví dụ một `chieu_thuc` có thể thuộc family `thien_dao_thuat`.

### 11.6. Công thức hiệu ứng

```text
Final_Effect = Base_Stat
  × Grade_Coefficient
  × Mastery_Multiplier
  × Element_Resonance
  × (1 + comprehension / 200)
  × Fate_Element_Modifier
  × Family_Matchup
  × (1 - Corruption_Penalty)
```

Với Cấm Thuật:

```text
Forbidden_Power = Base_Power
  × (1 + corruption / 50)
  × Sacrifice_Multiplier
```

Corruption làm Cấm Thuật mạnh hơn nhưng vẫn áp dụng hậu quả Corruption và các chi phí khai báo; không tạo miễn nhiễm phản phệ.

### 11.7. Combo, dung hợp và tiến hóa

- Combo kích hoạt khi chuỗi hai hoặc ba chiêu đúng thứ tự trong cửa sổ cấu hình, mặc định 3–5 giây.
- Dung hợp dùng 2–3 Công Pháp cùng cấp và cùng hệ hoặc tương sinh để tạo một Công Pháp cấp kế tiếp.
- Cùng hệ có tỷ lệ 80–95%; tương sinh 60–75%; tương khắc/Dị Hệ 20–35% và thất bại tăng Corruption 5.
- Dung hợp là transaction nguyên tử; chỉ xóa nguyên liệu khi kết quả đã tạo thành công.
- Ở Đại Viên Mãn, Công Pháp có thể tiến hóa sang nhánh thuần hóa hoặc tà hóa nếu dữ liệu khai báo. Lựa chọn là vĩnh viễn.

Runtime hiện vận hành theo lượt nhưng schema Công Pháp vẫn dùng giây làm đơn vị chuẩn. Quy đổi cố định `1 turn = 5 seconds`; cooldown khi thi triển là `ceil(cooldownSeconds / 5)`. `castTimeSeconds` bằng 0–5 được resolve trong lượt hiện tại, lớn hơn 5 tạo trạng thái niệm kéo dài tương ứng số lượt. Mastery trong catalog là giá trị khởi tạo; khi nhân vật học Công Pháp, tiến độ này được sao chép vào state riêng của nhân vật và không sửa ngược catalog.

### 11.8. Nguồn gốc và cách học Công Pháp (hợp nhất từ `CONG_PHAP_SYSTEM.md`)

| Nguồn | Mô tả | Cấp/Family thường gặp |
|---|---|---|
| Tông Môn truyền thụ | NPC tông môn dạy theo mức tương hợp/đóng góp đủ ngưỡng | Phàm–Địa, `family: thuong` hoặc `thien_dao_thuat` nếu tông môn Chính Đạo |
| Mua ở chợ/thương nhân | Linh Thạch đổi Bí Tịch | Phàm–Huyền |
| Nhặt được (loot Quái/Boss) | Rớt từ `loot_table_id` | Địa–Thiên (Elite/Boss) |
| Ngộ Đạo (Comprehension) | Tự lĩnh ngộ giữa dị tượng hoặc sau trận sinh tử; phụ thuộc `comprehension` | Bất kỳ, kể cả Tiên (cực hiếm) |
| Tà Thần truyền dạy | Chỉ qua tương tác trực tiếp với Tà Thần đã khóa (mục 12) | Luôn là `cam_thuat`, luôn có `corruptionProfile` |
| Dung hợp | Ghép 2-3 Công Pháp theo mục 11.7 | +1 Cấp so với nguyên liệu |
| Thương nhân bí ẩn | Bán Công Pháp Thiên/Tiên, trả bằng Thọ Nguyên/SAN thay Linh Thạch | Thiên–Tiên, `family: cam_thuat` phổ biến |

---

## 12. Tà Thần và trận doanh

Toàn bộ mục 12 áp dụng cho Con Đường thường, Nghịch Hành và các nghề ẩn, ngoại trừ Luân Hồi Tiên. **Kẻ Vô Lộ / Ngoại Đạo Giả không thực hiện bất kỳ action, lựa chọn, quest, chọn phe, danh hiệu, phần thưởng, truy sát hay khóa cấp nào trong mục này.** Ngoại Đạo Giả dùng các thử thách riêng ở mục 6.3.

### 12.1. Bốn mốc bắt buộc

| Cấp | Sự kiện |
|---:|---|
| 5 | Tà Thần chú ý lần đầu; người chơi chủ động chọn một kết quả dị hóa và lưu vĩnh viễn |
| 8 | Chọn trận doanh; mở chuỗi quest Tà Thần liên tục |
| 11 | Can thiệp tăng cường; quest khó hơn, kiểm tra Mệnh thường hơn, mở ưu quyền cấp cao |
| 13 | Bắt đầu quyết chiến và chuẩn bị điều kiện mở cấp 14 |

Khi đạt cấp 5, hệ thống hiển thị ba lựa chọn để người chơi **chủ động chọn đúng một**:

- **Ban Phước:** cộng stat theo dấu ấn, luôn để lại liên kết Tà Thần.
- **Nghi Kỵ:** trừ Sát và giảm Stamina; có thể tăng Corruption/Mệnh Nợ.
- **Hờ Hững:** không cộng stat, chỉ giảm Stamina.

Lựa chọn chỉ được xác nhận một lần, lưu vĩnh viễn và không hiển thị lại khi load save. Trước khi xác nhận, UI phải cho xem đầy đủ lợi ích, hình phạt và liên kết Tà Thần của từng phương án.

### 12.2. Ba trận doanh

ID runtime chuẩn của ba trận doanh lần lượt là `loyal_heaven`, `rebel_heaven` và `neutral`. Tên hiển thị không được dùng thay cho ID trong save hoặc điều kiện Công Pháp.

#### Trung Thành Thiên Đạo

- Chống ảnh hưởng Tà Thần; các can thiệp mới chịu Nghi Kỵ ×2.
- Nhận `heaven_merit` khi phá quest Tà Thần, cứu Neo và bảo vệ phàm giới.
- Cấp 8 nhận **Thiên Đạo Hộ Ấn**; cấp 11 nhận **Hộ Đạo Linh Khí**; cấp 13 nhận **Thiên Mệnh Chiếu Lệnh**.
- Từ cấp 8, mỗi cấp mới nhận một danh hiệu nhỏ tăng nhẹ PHY/MAG và giảm Stamina cost.
- Từ cấp 11 miễn `FATE_BACKFIRE`; không miễn hiệu ứng SAN hoặc Corruption.
- Bị Ma Đầu, Phản Bội Giả và Ma Sứ truy sát.

#### Phản Bội Thiên Đạo

- Phải ký khế ước với một trong bốn Tà Thần; khóa phe đến hết một kiếp trừ quest ngoại lệ.
- Nhận Mệnh dị hóa, Cấm Thuật và quyền triệu hồi; có Corruption và nghĩa vụ quest cao nhất.
- Giảm Linh Khí/EXP thu thập mặc định 20%; bị Hộ Đạo Giả truy sát.
- Từ cấp 8, mỗi cấp nhận danh hiệu cho nhiều stat hơn Thiên Đạo nhưng tăng Stamina cost.
- Từ cấp 11, bỏ giới hạn dung lượng inventory thường và bỏ khóa điều kiện `forbidden`; mọi chi phí và điều kiện an toàn vẫn áp dụng. Mệnh Kho vẫn tuân theo luật riêng ở mục 5.4.

#### Trung Gian

- Không tuyên thệ với bên nào; các can thiệp chịu Hờ Hững ×2.
- Nhận `balance_token`; tăng nhẹ tỷ lệ Mệnh phù hợp với đường, mặc định 10%.
- Bị cả hai phía truy sát với tần suất mặc định bằng 50% phe đối địch.
- Chỉ có ba danh hiệu: **Ẩn Thế** ở cấp 8, **Chân Giả** ở cấp 11, **Chí Tôn** ở cấp 13.
- Danh hiệu cho stat và giảm Stamina mạnh hơn hai phe, nhưng không có danh hiệu ở cấp xen giữa.

### 12.3. Đổi phe

- Trung Thành và Trung Gian chỉ đổi phe qua quest chuyển hóa do thực thể liên quan phát; thành công nhận một Ban Phước của phe mới.
- Phản Bội bị khóa tới hết kiếp. Sau cái chết hợp lệ/luân hồi mới được xét đổi, hoặc phải dùng Công Đức nếu có quest chuộc tội đặc biệt.
- Công Đức quest roll trong khoảng cấu hình, mặc định 1–3; không cộng cố định.

### 12.4. Thôn Phệ Thiên Đạo

Ở cấp 13, mọi Con Đường, nghề ẩn và trận doanh trừ Luân Hồi Tiên và Ngoại Đạo Giả có thể mở chuyển hóa `thon_phe_thien_dao` khi:

1. Bộ Mệnh đang gắn thỏa ít nhất một Mệnh dẫn của Tinh Tượng Đạo và một Mệnh dẫn của Phong Thủy Đạo.
2. `match_score` riêng của cả hai nhánh đều từ 3 trở lên và không bị Mệnh cấm lấn át.
3. Đã hoàn thành nghi thức cấp 13 và có `final_conflict_preparation = true`.

Chuyển hóa không xóa lịch sử đường cũ. Sau khi thắng Tà Thần, nhân vật có thể hấp thu một phần luật trời; mỗi lần dùng tăng Corruption và Mệnh Nợ. Thất bại thử thách khóa vĩnh viễn lối Thôn Phệ trong kiếp hiện tại, không khóa mọi con đường đạt cấp 14 khác trừ khi quest ghi rõ.

### 12.5. Khóa cấp cuối

Không thể vào cấp 14 chỉ bằng EXP, Mệnh Số hoặc Công Pháp. Nhân vật thuộc phạm vi mục 12 phải:

- Hoàn tất chuỗi chuẩn bị quyết chiến.
- Đạt mọi điều kiện cấp và đường.
- Đánh bại Tà Thần đã khóa làm đối thủ hoặc hoàn thành đối đầu tương đương theo trận doanh.
- Ghi `tainted_god_defeated = true` cùng chiến thắng vào lịch sử.

Nếu thiếu cờ chiến thắng, trả `FINAL_REALM_LOCKED_BY_ELDRITCH_GOD` và không tiêu hao tài nguyên đột phá. Ngoại Đạo Giả không kiểm tra cờ này; sử dụng `unbound_path_proven` theo mục 6.3.

---

## 13. Thứ tự xử lý runtime

### 13.1. Mỗi lượt thường

```text
1. Nạp state và validate schema
2. Tính state cưỡng chế
3. Nếu ELDRITCH_INTERVENTION/FATE_BACKFIRE đang cưỡng chế: sinh action Priority 0
4. Nếu không: xử lý action người chơi
5. Resolve Công Pháp, Ngũ Hành, family matchup và chi phí
6. Resolve hậu quả: HP/Stamina/SAN/Corruption/Mệnh/Neo/quan hệ
7. Chạy event theo mốc cảnh giới và trận doanh; bỏ qua toàn bộ bước này nếu là Ngoại Đạo Giả
8. Validate invariant
9. Commit nguyên tử và ghi event log
```

### 13.2. Đột phá

```text
validate EXP
→ realm_gate
→ path_gate
→ anchor_gate
→ xác nhận chi phí
→ body_check/mind_check
→ roll xác suất
→ áp dụng thành công hoặc hậu quả thất bại
→ kiểm tra mốc Tà Thần
→ commit + event log
```

### 13.3. Thứ tự tính hiệu ứng chiến đấu

```text
Base Stat
→ hệ số cấp/phẩm
→ thục luyện
→ tương sinh/tương khắc Ngũ Hành
→ Ngộ Tính và Mệnh cùng hệ
→ khắc chế family
→ Corruption penalty
→ buff/debuff tình huống
→ clamp và commit chi phí
```

---

## 14. Schema dữ liệu chuẩn

### 14.1. Character

```json
{
  "id": "uuid",
  "name": "Lâm Phong",
  "origin": {
    "regionId": "dong_hoang",
    "locationId": "thon_vo_danh",
    "race": "nhan_toc",
    "background": "tan_tu",
    "personality": ["co_tri", "an_nhan"],
    "hiddenGoal": "bao_thu"
  },
  "realm": {
    "level": 6,
    "title": "Tàng Kiếm Vực Chủ",
    "exp": 4200
  },
  "path": {
    "primary": "kiem_dao",
    "secondary": null,
    "pathScore": 8,
    "professionStage": "chuong_quyen"
  },
  "stats": {
    "phy": 62,
    "mag": 38,
    "aptitude": 67,
    "comprehension": 58,
    "vitality": 410,
    "staminaCurrent": 170,
    "staminaMax": 190,
    "san": 82,
    "sanMax": 100,
    "corruption": 12,
    "lifespan": 640
  },
  "fate": {
    "equippedIds": ["fate_1", "fate_2", "fate_3", "fate_4", "fate_5"],
    "vaultIds": ["fate_6"],
    "total": 96,
    "normal": 71,
    "ratioR": 1.35,
    "debt": 2,
    "surplus": 5,
    "pacts": []
  },
  "anchors": [
    { "type": "npc", "id": "su_phu", "stability": 72, "broken": false }
  ],
  "techniqueIds": ["tam_phap_1", "kiem_thuc_1"],
  "hiddenFates": [],
  "hiddenProfession": null,
  "faction": {
    "id": null,
    "titles": [],
    "heavenMerit": 0,
    "balanceTokens": 0,
    "eldritchAttentionChosen": false,
    "finalConflictPreparation": false,
    "taintedGodDefeated": false
  },
  "state": "NORMAL_GROWTH",
  "pathDebt": [],
  "eventHistory": []
}
```

### 14.2. Fate

```json
{
  "id": "fate_kiem_tinh_sat_van",
  "name": "Kiếm Tinh Sát Vận",
  "tier": "hoang",
  "nature": "cat|binh|hung|di",
  "score": 8,
  "tags": ["kiem", "sat"],
  "effects": [],
  "exclusiveProfession": null
}
```

### 14.3. Công Pháp

```json
{
  "id": "cp_thanh_van_kiem_khi",
  "name": "Thanh Vân Kiếm Khí",
  "category": "chieu_thuc",
  "family": "thuong",
  "requiredFaction": null,
  "grade": "dia",
  "quality": "trung",
  "element": "kim",
  "minRealmLevel": 4,
  "spiritualRootRequirements": [],
  "visibleStats": {
    "powerCoefficient": 3.0,
    "manaCost": 25,
    "staminaCost": 8,
    "corruptionCost": 0,
    "sanCost": 0,
    "lifespanCost": 0,
    "cooldownSeconds": 8,
    "castTimeSeconds": 1,
    "baseEffect": "Sát thương Kim diện hẹp"
  },
  "hiddenAttributes": [],
  "corruptionProfile": null,
  "mastery": {
    "stage": 0,
    "exp": 0,
    "usageCount": 0
  },
  "evolutionPaths": []
}
```

### 14.4. Chi tiết cấu trúc phần tử còn để trống ở 14.3 + ví dụ đầy đủ (hợp nhất từ `CONG_PHAP_SYSTEM.md`)

`hiddenAttributes[]` và `evolutionPaths[]` trong 14.3 để trống vì là mảng — cấu trúc từng phần tử:

```json
// hiddenAttributes[i]
{
  "revealCondition": "comprehension >= 50 | mastery_stage >= 3 | random_on_use:0.15",
  "attribute": "Mô tả hiệu ứng ẩn, vd '10% cơ hội xuyên giáp hoàn toàn'",
  "isBeneficial": true
}

// evolutionPaths[i]
{
  "condition": "corruption <= 10 tại Đại Viên Mãn",
  "evolvesInto": "cp_thanh_van_kiem_y",
  "pathType": "chinh_dao | ta_dao"
}
```

**Ví dụ 1 — Chiêu Thức chính đạo, Địa Giai Trung Phẩm:**
```json
{
  "id": "cp_thanh_van_kiem_khi",
  "name": "Thanh Vân Kiếm Khí",
  "category": "chieu_thuc",
  "family": "thien_dao_thuat",
  "requiredFaction": null,
  "grade": "dia",
  "quality": "trung",
  "element": "kim",
  "minRealmLevel": 4,
  "spiritualRootRequirements": [],
  "visibleStats": {
    "powerCoefficient": 3.0,
    "manaCost": 25,
    "staminaCost": 8,
    "corruptionCost": 0,
    "cooldownSeconds": 8,
    "castTimeSeconds": 1,
    "baseEffect": "Phóng 1 luồng kiếm khí gây sát thương Kim diện hẹp"
  },
  "hiddenAttributes": [
    { "revealCondition": "comprehension >= 50", "attribute": "10% cơ hội xuyên giáp hoàn toàn", "isBeneficial": true }
  ],
  "corruptionProfile": null,
  "mastery": { "stage": 0, "exp": 0, "usageCount": 0 },
  "evolutionPaths": [
    { "condition": "corruption <= 10 tại Đại Viên Mãn", "evolvesInto": "cp_thanh_van_kiem_y", "pathType": "chinh_dao" }
  ]
}
```

**Ví dụ 2 — Cấm Thuật, nguồn gốc Tà Thần:**
```json
{
  "id": "cp_cuong_vuong_chi_nhan",
  "name": "Cuồng Vương Chi Nhãn",
  "category": "cam_thuat",
  "family": "cam_thuat",
  "requiredFaction": "rebel_heaven",
  "grade": "cam_thuat",
  "quality": null,
  "element": "di_he",
  "minRealmLevel": 6,
  "spiritualRootRequirements": [],
  "visibleStats": {
    "powerCoefficient": 6.0,
    "manaCost": 60,
    "staminaCost": 20,
    "corruptionCost": 4,
    "cooldownSeconds": 30,
    "castTimeSeconds": 2,
    "baseEffect": "Nhìn thẳng mục tiêu, gây sát thương Tinh Thần lớn + -20 SAN mục tiêu"
  },
  "hiddenAttributes": [
    { "revealCondition": "random_on_use:0.15", "attribute": "Bản thân người dùng cũng bị -5 SAN mỗi lần kích hoạt", "isBeneficial": false }
  ],
  "corruptionProfile": { "baseCorruptionGainPerUse": 4 },
  "mastery": { "stage": 0, "exp": 0, "usageCount": 0 },
  "evolutionPaths": []
}
```

**Ví dụ 3 — Tâm Pháp bị động, trung lập:**
```json
{
  "id": "cp_ngu_hanh_quy_nguyen_quyet",
  "name": "Ngũ Hành Quy Nguyên Quyết",
  "category": "tam_phap",
  "family": "thuong",
  "requiredFaction": null,
  "grade": "huyen",
  "quality": "thuong",
  "element": "vo_he",
  "minRealmLevel": 3,
  "spiritualRootRequirements": [],
  "visibleStats": {
    "powerCoefficient": 2.0,
    "manaCost": 0,
    "staminaCost": 0,
    "corruptionCost": 0,
    "cooldownSeconds": 0,
    "castTimeSeconds": 0,
    "baseEffect": "Bị động: +15% tốc độ hồi Linh Lực, +10% MAG nền"
  },
  "hiddenAttributes": [],
  "corruptionProfile": null,
  "mastery": { "stage": 2, "exp": 1800, "usageCount": 340 },
  "evolutionPaths": []
}
```

---

## 15. Bất biến dữ liệu và tiêu chí kiểm thử

### 15.1. Bất biến

1. Player mới luôn ở cấp 1 và có đúng 5 Mệnh cơ bản không trùng, tổng điểm > 5.
2. Mệnh `luan_hoi_tien` không chiếm 5 Mệnh cơ bản và không tự kích hoạt nghề.
3. Không Công Pháp nào tự tăng `realm.level`.
4. Không đột phá nào bỏ qua `realm_gate` và `path_gate`.
5. Dung lượng Mệnh Kho luôn bằng `2 × equipped_fate_count`; quyền inventory vô hạn của phe Phản Bội không áp dụng cho Mệnh Kho.
6. Mệnh trong kho không góp vào điểm hoặc hiệu ứng đang hoạt động.
7. SAN/Corruption luôn nằm trong miền hợp lệ sau khi resolve.
8. Lựa chọn dị hóa cấp 5 và lựa chọn phe cấp 8 không lặp lại khi load save.
9. Mọi nghề ẩn trừ Luân Hồi Tiên chịu mốc 5/8/11/13; Ngoại Đạo Giả miễn toàn bộ mục 12.
10. Cấp 14 luôn cần cờ kết thúc hợp lệ: `tainted_god_defeated` cho hệ thường hoặc `unbound_path_proven` cho Ngoại Đạo Giả.
11. Mọi thao tác phá hủy/đổi vật phẩm hoặc Mệnh phải atomic và có rollback.
12. Mọi chi phí vĩnh viễn và lựa chọn không thể đảo ngược phải xuất hiện trong `eventHistory`.

### 15.2. Ca kiểm thử tối thiểu

- Tạo 10.000 nhân vật: không ai trên cấp 1; không bộ nào sai số lượng, trùng Mệnh hoặc tổng điểm ≤ 5.
- Nhân vật không có Mệnh dẫn có thể chọn Ngoại Đạo Giả ở cấp 2 mà không hiến tế Mệnh.
- Ngoại Đạo Giả cần EXP gấp 5, ngưỡng Mệnh gấp đôi, vượt cả hai check tăng khó 15 và không nhận bất kỳ event nào của mục 12.
- Công Pháp cấp cao không thể mở cảnh giới khi thiếu Mệnh.
- Hiến tế khi không có kết quả phù hợp không làm mất Mệnh hay SAN.
- Kho đầy chỉ thay đúng Mệnh kém tương hợp hơn; crash giữa transaction không mất dữ liệu.
- Neo vỡ hoặc Corruption 91 có thể kích hoạt `ELDRITCH_INTERVENTION`.
- Với nhân vật thuộc phạm vi mục 12, mốc Tà Thần chỉ chạy tại 5/8/11/13; cấp 5 là lựa chọn chủ động và không dùng các mốc cũ.
- Luân Hồi Tiên không kích hoạt do tự sát, bị giết hoặc dùng Cấm Thuật.
- Phe Phản Bội cấp 11 bỏ khóa inventory thường nhưng Mệnh Kho vẫn giữ giới hạn.
- Nhân vật thuộc mục 12 thiếu `tainted_god_defeated` bị từ chối cấp 14 mà không mất tài nguyên; Ngoại Đạo Giả kiểm tra `unbound_path_proven` thay thế.

---

## 16. Quy tắc mở rộng về sau

- Nội dung mới phải khai báo nó thuộc lớp nào: Cảnh giới, Con Đường, Mệnh, Công Pháp, nghề ẩn hay trận doanh.
- Không tạo hệ điểm mới nếu một chỉ số hiện có đã mô tả đúng chức năng.
- Không thêm phiên bản luật bằng phụ lục nối đuôi. Mọi thay đổi được sửa trực tiếp vào mục chuẩn và ghi changelog riêng.
- Giá trị cân bằng như tỷ lệ, hệ số, giới hạn và cửa sổ combo phải nằm trong config; invariant và thứ tự xử lý nằm trong code.
- Nếu một luật đặc thù mâu thuẫn luật chung, dữ liệu phải khai báo ngoại lệ rõ ràng và có test riêng; ngoại lệ không được suy diễn ngầm.
