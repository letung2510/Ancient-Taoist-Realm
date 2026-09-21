# CON DUONG CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\01-core\HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`

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

> Chi tiết thuật toán roll, nhãn, cách cục, Harmony Score và hệ số EXP/Purity nằm tại `LinhCan_System.txt` và được engine implement tại `js/engine.js` (`rollSpiritualRootBranch`, `spiritualRootProfile`).

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
- Runtime hiện tại áp dụng hình phạt Mất Trí thống nhất: mất 10% Tu vi hiện tại (làm tròn lên), Corruption `+10` tối đa 100, ghi nguồn và chuyển tới kết cục Tha Hóa. UI phải hiện rõ các khoản phạt.
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

UI Mệnh phải tách Mệnh đang gắn và Mệnh Kho, hiển thị modifier, độ tương hợp Con Đường cùng Tương Sinh/Tương Khắc/Combo. Mệnh không có EXP riêng; tiến triển đến từ thu nhận/đổi Mệnh và quan hệ.

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
- UI dùng Di Mệnh ở cấp 1, Khai Lộ khi đang chờ chọn đường và danh xưng riêng của Con Đường sau khi đã chọn; checklist thăng cấp vẫn sinh từ cùng field điều kiện mà engine đột phá kiểm tra.
- UI chỉ tiết lộ cảnh hiện tại và một cảnh kế tiếp; tầng xa hơn hiện `???`. Mỗi mô tả cảnh giới phải nêu bản chất biến đổi, ích lợi và cái giá tà dị thay vì câu “cấp N trong hệ 14 cấp”.
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

#### 6.4.1. Requirement triển khai nghi thức theo cấp

Nghi thức được phân tầng theo cảnh giới đích, không ép năm bước từ cấp thấp:

| Cấp đích | Số bước | Chuỗi hành động |
|---|---:|---|
| 3–4 | 2 | Gọi Mệnh → Đối Chiếu Con Đường |
| 5–7 | 3 | + Dựng Neo |
| 8–10 | 4 | + Vượt Dị Tượng |
| 11–13 | 5 | + Trả Giá |
| 14 | 6 | + Thử Thách Cuối bespoke |

Engine lưu `state.flags.breakthroughRitual` và chỉ mở một hành động kế tiếp trên Action Bar. Cấp 1→2 vẫn dùng Khai Mạch riêng, không qua nghi thức này. Luồng nguyên tử là `realm_gate → path_gate → anchor_gate → body/mind_check → cost_commit`; cấp 14 thêm thử thách cuối. Chỉ Vượt Dị Tượng có roll; các cổng còn lại là deterministic/setup. Chỉ commit cảnh giới sau khi mọi bước hợp lệ; thất bại Dị Tượng không trừ Tu vi, chỉ ghi log và có thể mất 3 Thanh Tỉnh.

#### 6.4.2. Hướng dẫn người chơi

Khi đạt mốc Tu vi, mở tab Cảnh giới và thực hiện lần lượt bước đang sáng trên Action Bar. Cấp 3–4 chỉ cần Gọi Mệnh và Đối Chiếu; cấp 5–7 thêm Dựng Neo; cấp 8–10 thêm Vượt Dị Tượng; cấp 11–13 thêm Trả Giá; cấp 14 phải hoàn tất Thử Thách Cuối. Không thể bỏ qua thứ tự hoặc xác nhận khi còn blocker.

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

UI Công Pháp phải hiện tầng, EXP hiện tại, mốc kế tiếp, cách tăng cấp và nhóm màu theo chức năng. Tu luyện tăng mastery cho mọi Công Pháp đã học nhưng Chiêu Thức/Cấm Thuật nhận ít hơn; trong giao chiến chỉ Công Pháp chiến đấu thực sự được thi triển mới nhận mastery.

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

### Source: `archive-requirements\logic-history\02-progression\BREAKTHROUGH_RITUAL_DETAIL.md`

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

### Source: `archive-requirements\logic-history\02-progression\PATH_FUSION_AND_DITHE_BALANCE_VALIDATION_2026-09-17.md`

# Path Fusion và Dị Thể — Catalog/Balance Validation — 2026-09-17

## Path fusion

`validatePathFusionCatalog()` kiểm tra mọi Con Đường có lead/support/forbidden
terms và path titles; sau đó duyệt toàn bộ cặp Con Đường khác nhau, bảo đảm
affinity hữu hạn, không âm và không vượt cap canonical `0.75`.

## Dị Thể

`validateSpecialPhysiqueCatalog()` kiểm tra progress threshold trong khoảng
1–10, số stage khớp stageEffects, các modifier dạng tỷ lệ nằm trong `[0,1]`,
faction affinity trong `[-10,10]`, ending/exclusion metadata và các trường bắt
buộc. Đây là lớp chặn catalog/balance trước khi claim hoặc stage progression.

## Regression

`tools/verify_dichi_deep.js` chạy cả hai validator, cùng với claim, stage
modifier, outcome, exclusion path/profession và save round-trip.


### Source: `archive-requirements\logic-history\02-progression\PATH_FUSION_TRANSITION_CANONICAL_2026-09-16.md`

# PATH FUSION / SECONDARY PATH TRANSITION — 2026-09-16

## Baseline decision

The player has one primary Path and at most one secondary Path. Selecting the primary Path remains permanent under the normal selection lock. A secondary Path never appears automatically from Fate, profession or Dị Thể effects.

## Explicit transition

`GameExpansion.transitionSecondaryPath(state, pathId, { confirmed: true })` is the only runtime entry point. The baseline cost is 20 Mệnh Tinh Hoa, 15 Công Đức and 10 Thanh Tỉnh. The transaction validates the Path, rejects the primary Path and rejects a second transition before deducting any resource.

Canonical state:

```js
state.pathState = {
  primaryPathId,
  secondaryPathId,
  hiddenPathId,
  history: [{ type: "secondary_path", from, to, day, cost }]
}
state.player.pathId = primaryPathId
state.player.secondaryPathId = secondaryPathId
```

The secondary Path is additive metadata for explicit affinity/resolver rules; it does not overwrite the primary breakthrough ritual, profession namespace or Dị Thể namespace. A future balance pass may add fusion-specific affinity caps, but no automatic effect stacking is allowed.

## Regression gate

`tools/verify_review_batches.js` verifies confirmation gating, resource transaction, duplicate transition rejection and serialize/deserialize preservation.

## Remaining note

Fusion-specific content, affinity caps and ending branches remain balance/content work; the state transition and namespace separation are implemented.
## Fusion affinity and cap

Every committed secondary-path transition stores `pathState.fusionAffinity`.
The resolver compares lead/support terms and forbidden-term conflicts, returns
raw affinity plus `effective = min(raw, 0.75)`, and persists the profile for UI,
save migration and later balance work. This affinity is informational and does
not silently change the primary path; transition remains explicit, permanent,
and costed.


### Source: `archive-requirements\logic-history\02-progression\PHAC_THAO_TU_VI_CON_DUONG_V3.md`

# PHÁC THẢO TÍNH NĂNG MỚI — VÒNG 3: ĐÀO SÂU TU VI & CON ĐƯỜNG
> Tiếp nối 2 vòng brainstorm trước (đã deploy) + `WORLD_INTERCONNECTION_SYSTEM.md`. Lần này tập
> trung làm GIÀU hệ thống Tu Vi/Cấp/Con Đường — hiện tại chỉ có "tích EXP → đủ 5 cổng → Đột Phá",
> khá một chiều. Đồng thời dệt thêm tương tác Map/NPC VÀO CHÍNH quá trình tu luyện, không tách rời.

---

## 1. ĐA DẠNG HÓA NGUỒN TU VI (hiện chỉ có "Tu Luyện"/"Tự Động Tu Luyện"/"Bế Quan")

| Nguồn mới | Cơ chế | Tại sao khác "Tu Luyện" thường |
|---|---:|---|
| **Chiến Ngộ** (Insight from Combat) | Thắng Quái/NPC có Cảnh Giới ngang hoặc cao hơn mình → +Tu Vi bonus theo % chênh lệch sức mạnh | Thưởng người dám đánh "vượt cấp", không chỉ ai cày node an toàn lâu nhất |
| **Cảnh Ngộ** (Insight from Environment) | Đứng tại node có `linhKhiDensity` cao ĐỦ LÂU (không thao tác gì) → Tu Vi tích lũy thụ động NHANH hơn Tu Luyện chủ động, nhưng dễ bị gián đoạn (bất kỳ combat/sự kiện nào xảy ra sẽ reset đồng hồ tích lũy) | Đánh đổi rủi ro (đứng yên dễ bị phục kích) lấy tốc độ |
| **Vấn Đạo** (Insight from NPC Dialogue) | Hỏi chuyện 1 NPC CÙNG Con Đường (roll ngẫu nhiên gặp trên map, xem mục 5) → +Tu Vi 1 lần, lượng theo Cảnh Giới NPC đó so với mình | Biến việc gặp NPC ngẫu nhiên thành có giá trị cơ học thật, không chỉ lore |
| **Đấu Ngộ** (Insight from Friendly Spar) | Tỷ thí giao hữu (không sát thương thật, dùng % giả lập) với NPC/Quái cùng Con Đường → nhỏ hơn Chiến Ngộ nhưng KHÔNG rủi ro chết | Lựa chọn an toàn hơn cho người sợ rủi ro |
| **Độc Ngộ** (Insight from Solitude — chỉ khi Bế Quan) | Xem mục 2 | — |

> Tất cả nguồn trên CỘNG DỒN vào cùng 1 thanh Tu Vi hiện có — không tạo thanh EXP riêng, chỉ đa
> dạng hóa CÁCH LẤP ĐẦY thanh đó.

---

## 2. BẾ QUAN TU LUYỆN — CHÍNH THỨC HÓA (đã có nút, giờ thêm cơ chế thật)

```
Bế Quan {
  durationDays: number (người chơi tự chọn, 1-30 ngày game)
  tuViMultiplier: 1.5x - 3.0x (dài hơn = hệ số cao hơn, nhưng xem rủi ro dưới)
  isVulnerable: true   // trong lúc Bế Quan, KHÔNG thể phản ứng action nào khác — nếu bị tấn công/
                        // sự kiện ập tới, tự động dùng phản ứng MẶC ĐỊNH yếu nhất
}

Rủi ro theo thời lượng đã chọn (càng dài càng nguy hiểm, đúng tinh thần world này):
  - 1-5 ngày: an toàn, hệ số 1.5x
  - 6-15 ngày: 10% cơ hội bị "Tiếng Vọng Từ Ngoài Kia" ghé thăm GIỮA lúc Bế Quan (không thể từ
    chối/chọn nhánh như bình thường — tự động roll kết quả xấu nhất trong 3 lựa chọn cũ), hệ số 2.0x
  - 16-30 ngày: 25% cơ hội bị NPC/Quái thù địch phát hiện đột nhập trong lúc không phòng bị (combat
    tự động với stat GIẢM 50% do đang "nhập định"), hệ số 3.0x
  Thoát Bế Quan SỚM (chủ động) bất cứ lúc nào: nhận Tu Vi theo TỶ LỆ thời gian đã qua, không phạt.
}
```
Liên kết Map: chọn Bế Quan tại node có `ownerFactionId` là Tông Môn mình đang phục vụ → GIẢM 50% rủi
ro ở 2 mốc trên (có đệ tử canh gác) — biến việc "thuộc về 1 tổ chức" có lợi ích cơ học rõ ràng ngoài
lore, và tạo lý do quay lại Tông Môn thường xuyên thay vì luôn Bế Quan giữa hoang dã cho tiện.

---

## 3. TẨU HỎA NHẬP MA (CULTIVATION DEVIATION) — RỦI RO KHI CÀY QUÁ NHANH

```
Mỗi lần nhận Tu Vi từ bất kỳ nguồn nào ở mục 1, cộng vào `recentTuViVelocity` (tốc độ nhận trong 24h
game gần nhất). Nếu vượt ngưỡng an toàn theo Cấp hiện tại:
  roll % Tẩu Hỏa Nhập Ma = min(30%, (velocity - safeThreshold) / safeThreshold × 20%)

Nếu trúng:
  - Nhẹ: mất 10-20% Tu Vi ĐANG TÍCH LŨY (không mất Tu Vi đã CHỐT của Cấp trước), +5 Điểm Điên Loạn
  - Nặng (Corruption_Rating > 50 làm tăng xác suất rơi vào nhánh này): 1 Biến Dị Thân Thể MỚI xuất
    hiện ngay lập tức (dùng bảng đã có ở WORLDVIEW_ATMOSPHERE.md mục 9), bù lại +Tu Vi vẫn giữ
    nguyên (không mất) — "cái giá trả bằng thân thể thay vì tiến độ"
```
> Mục đích: KHÔNG cấm cày nhanh (vẫn cho phép, người chơi thích rủi ro cao được lợi), nhưng tạo lý
> do để KHÔNG PHẢI lúc nào cũng dồn hết mọi nguồn Tu Vi cùng lúc — nhịp độ trở thành 1 quyết định
> chiến thuật thật.

---

## 4. ĐẠO TÂM (DAO HEART) — CHỈ SỐ MỚI ĐO ĐỘ KIÊN ĐỊNH VỚI CON ĐƯỜNG

```
daoTam: 0-100, KHÔNG roll ngẫu nhiên lúc tạo nhân vật (khác Aptitude/Ngộ Tính) — chỉ tăng/giảm qua
HÀNH VI liên quan trực tiếp tới Con Đường đã chọn:
  + tăng khi: hoàn thành quest moral_choice ĐÚNG hướng Con Đường, Đột Phá thành công liên tiếp không
    đổi Con Đường, từ chối 1 Cơ Duyên/phần thưởng không hợp Con Đường dù hấp dẫn hơn
  - giảm khi: dùng Cấm Thuật trái hệ với Con Đường, đổi Con Đường (mục 6), thất bại Vượt Dị Tượng
    liên tiếp nhiều lần

Hiệu ứng:
  daoTam >= 80: +10% match_score TRẦN (cộng thêm, không nhân) với Con Đường hiện tại
  daoTam <= 20: dễ bị Nghịch Hành Đạo "dụ dỗ" hơn — tăng % xuất hiện lựa chọn dị hóa xấu ở các mốc
                Tà Thần dòm ngó (đã thiết kế ở WORLDVIEW_ATMOSPHERE.md mục 16)
```
Đạo Tâm là chỉ số DUY NHẤT không thể "farm" nhanh bằng tài nguyên/Linh Thạch — chỉ tích lũy qua thời
gian và lựa chọn nhất quán, tạo chiều sâu roleplay thật cho việc "kiên định 1 con đường".

---

## 5. TƯƠNG TÁC NPC XOAY QUANH TU LUYỆN (nối trực tiếp mục 1 "Vấn Đạo"/"Đấu Ngộ")

### 5.1. Đạo Hữu Ngẫu Nhiên (Random Fellow Cultivator)
Roll trên map (dùng đúng cơ chế NPC Encounter đã có ở `RANDOM_EVENT_SYSTEM.md`), NHƯNG thêm điều
kiện: nếu NPC roll ra CÙNG Con Đường với player → mở thêm 2 action đặc biệt "Vấn Đạo" và "Đấu Ngộ"
(mục 1) thay vì chỉ Nói Chuyện/Bỏ Qua/Tấn Công thông thường.

### 5.2. Bảng Xếp Hạng Tu Vi Vùng (Regional Cultivation Rankboard)
Tại mỗi Vương Kinh/Tông Môn lớn, có 1 "bảng đá" hiển thị Top NPC nổi bật + player (nếu đủ nổi tiếng)
theo Cấp hiện tại trong VÙNG đó — tạo áp lực cạnh tranh nhẹ, và là nguồn TIN TỨC (biết trước NPC nào
mạnh đáng để Vấn Đạo/tránh Đấu Ngộ nhầm đối thủ quá tầm).

### 5.3. Trưởng Lão Chỉ Điểm (Master's Guidance)
NPC cấp cao thuộc Tông Môn mình phục vụ, mỗi worldTick có % nhỏ chủ động MỜI player (thông báo
Story Panel, không cần player chủ động tìm) tới "chỉ điểm" — 1 buổi hội thoại ngắn cho Tu Vi bonus
+ khả năng hé lộ suggestFateForRealmRequirement() sớm hơn dự kiến. Chỉ xảy ra nếu factionReputation
đủ cao — biến việc đóng góp Tông Môn có hồi đáp chủ động thay vì chỉ mở khóa quest thụ động.

---

## 6. CHUYỂN ĐẠO (THAY ĐỔI CON ĐƯỜNG) — HIỆN CHƯA CÓ CƠ CHẾ NÀO

```
Điều kiện: cần tìm đúng 1 NPC "Chuyển Đạo Nhân" hiếm (loại NPC Ẩn, không phải lúc nào cũng có sẵn
trên map — random spawn cực thấp, hoặc mở qua world_discovery quest)

Cái giá:
  - daoTam hiện tại giảm mạnh về gần 0 (mất hết tích lũy kiên định cũ)
  - MẤT toàn bộ bonus tương hợp đã tích với Con Đường cũ (nhưng Mệnh Số/Công Pháp vật lý vẫn giữ)
  - Tu Vi ĐÃ CHỐT của Cấp hiện tại KHÔNG mất — chỉ đổi "hướng" tính match_score từ Cấp tiếp theo
  - Cooldown dài (không đổi lại được ngay, tránh việc thử tất cả 10 Con Đường tùy hứng)

Lý do tồn tại: cho phép sửa sai lựa chọn ban đầu (đặc biệt nếu Giai đoạn 1 khởi đầu đã roll/chọn
không như ý — nối vào bug đã sửa trước đó về bối cảnh khởi đầu) mà không cần Luân Hồi/Chuyển Sinh
toàn bộ nhân vật chỉ vì hối hận 1 lựa chọn Con Đường.
```

---

## 7. TIỂU KIẾP (MINOR TRIAL GIỮA CHỪNG 1 CẤP, KHÔNG CHỈ LÚC ĐỘT PHÁ)

```
Khi Tu Vi đạt ĐÚNG 50% ngưỡng yêu cầu của Cấp đích hiện tại (đang ở giữa chừng, chưa đủ Đột Phá),
trigger 1 LẦN DUY NHẤT "Tiểu Kiếp" — thử thách TỰ CHỌN (không bắt buộc, có thể bỏ qua không phạt):
  Vượt qua: +1 Điểm Chuyển Sinh KHÔNG cần chờ Chuyển Sinh thật (dự trữ sẵn), hoặc +Tu Vi bonus tức
            thời (người chơi chọn 1 trong 2)
  Thất bại: mất 1 phần nhỏ Tu Vi đang tích (như Vượt Dị Tượng đã có, không mất Cấp đã chốt)
  Bỏ qua: không mất gì, chỉ không có cơ hội thưởng thêm — HOÀN TOÀN optional
```
Tạo thêm 1 điểm chạm giữa chu kỳ tu luyện dài (đặc biệt Cấp cao mất nhiều thời gian), tránh cảm giác
"im lặng cày cuốc" kéo dài giữa 2 lần Đột Phá.

---

## 8. CON ĐƯỜNG × CHỦNG TỘC/LINH CĂN (thiên phú bẩm sinh, chưa khai thác)

```
Mỗi chủng tộc (Nhân/Yêu/Ma/Cổ/Linh/Ma Thần Hậu Duệ/Cơ Quan Tộc — đã có ở Xianxin_map.md mục 2) có
1 danh sách 2-3 Con Đường "Thiên Phú" (innate affinity):
  Yêu Tộc -> Ngũ Thú Đạo (+bonus daoTam tích lũy nhanh hơn 20%)
  Ma Tộc -> Âm Luật Đạo (+bonus tương tự)
  Linh Tộc -> Phong Thủy Đạo
  Cơ Quan Tộc -> Khôi Lỗ Đạo
  ...

Đây KHÔNG phải ép buộc (player vẫn chọn Con Đường bất kỳ tự do) — chỉ là bonus NẾU trùng, tạo thêm
1 lớp quyết định thú vị lúc chọn Hướng Khởi Đầu (đã thiết kế ở phần bối cảnh mở đầu trước đó): chọn
Con Đường thuận thiên phú chủng tộc (dễ hơn) hay đi ngược lại (khó hơn nhưng độc đáo hơn)?
```

---

## 9. TU VI THƯ (CULTIVATION JOURNAL — trực quan hóa tiến trình)

UI mới trong tab Cảnh Giới: biểu đồ Tu Vi theo thời gian (dùng GameClock timestamp có sẵn từ Story
Panel log), đánh dấu các mốc Đột Phá/Tiểu Kiếp/Tẩu Hỏa Nhập Ma đã trải qua — biến quá trình tu luyện
trừu tượng thành 1 "đường đời" có thể nhìn lại, đặc biệt có giá trị SAU Luân Hồi (đối chiếu đường
cong kiếp này vs kiếp trước nếu có Mộ Phần Tiền Kiếp đã thiết kế).

---

## 10. KHÁC BIỆT HÓA NGHI THỨC ĐỘT PHÁ THEO TỪNG CON ĐƯỜNG (GIỮ NGUYÊN QUY TRÌNH GỐC)

Quy trình 5 cổng gốc (`Gọi Mệnh → Đối Chiếu Con Đường → Dựng Neo → Vượt Dị Tượng → Trả Giá`) GIỮ
NGUYÊN 100% — không đổi số bước, không đổi thứ tự, không đổi Cấp nào cần bao nhiêu bước (đã chốt ở
`BREAKTHROUGH_RITUAL_DETAIL.md`). Chỉ NỘI DUNG BÊN TRONG 3 cổng "Dựng Neo"/"Vượt Dị Tượng"/"Trả Giá"
thay đổi theo Con Đường — 2 cổng đầu (Gọi Mệnh/Đối Chiếu Con Đường) là kiểm tra số liệu thuần, giữ
nguyên chung cho mọi Con Đường vì bản chất không cần khác biệt hóa.

### 11.1. Bảng khác biệt hóa đầy đủ 10 Con Đường

| Con Đường | Vượt Dị Tượng (hình thức + cách vượt) | Thiên hướng Dựng Neo | Trả Giá (đổi loại tài nguyên) |
|---|---|---|---|
| **Kiếm Đạo** | Đối mặt "Kiếm Ảnh" — 1 bản sao ảo của chính mình cầm kiếm, thắng bằng combat check thuần (PHY/Aptitude) | Neo VẬT PHẨM — 1 vũ khí cụ thể đã gắn bó | Trừ **Khí Huyết tối đa tạm thời** (10%, hồi dần sau vài ngày) thay vì Thanh Tỉnh |
| **Đan Đạo** | Phải luyện thành công 1 viên đan NGAY TRONG nghi thức (skill check Đan Đạo riêng nếu có nghề, hoặc Ngộ Tính nếu chưa) | Neo ĐỊA ĐIỂM — 1 lò luyện đan/dược viên cụ thể | Trừ **nguyên liệu quý** (Linh Thạch/thảo dược hiếm) thay vì Thanh Tỉnh |
| **Phù Đạo** | Giải mã 1 đạo phù cổ xuất hiện ngẫu nhiên (skill check Ngộ Tính thuần) | Neo VẬT PHẨM — 1 bùa hộ mệnh tự vẽ | Giữ NGUYÊN Thanh Tỉnh (chuẩn gốc) |
| **Phong Thủy Đạo** | **BẮT BUỘC di chuyển** tới 1 node "long mạch" cụ thể trên bản đồ mới thực hiện được cổng này (không làm tại chỗ) | Neo ĐỊA ĐIỂM bắt buộc (không cho chọn loại khác) | Giữ nguyên Thanh Tỉnh |
| **Ngũ Thú Đạo** | Phải thuần hóa/chiến thắng 1 Dị Thú thật xuất hiện riêng cho nghi thức (nối thẳng hệ Thuần Hóa Dị Thú) | Neo THÚ ĐỒNG HÀNH (loại đặc biệt, không phải người/vật/địa điểm) | Trừ **Khí Huyết** như Kiếm Đạo |
| **Khôi Lỗi Đạo** | Phải sửa/lắp ráp đúng 1 cơ quan phức tạp trong thời gian giới hạn (skill check kỹ thuật) | Neo VẬT PHẨM — 1 cơ quan/con rối tự chế | Trừ **Linh Thạch** số lượng lớn thay vì Thanh Tỉnh |
| **Âm Luật Đạo** | Đối mặt 1 vong hồn/oán khí THẬT (SAN-based, khó hơn mức chuẩn 1.5x) | Neo NGƯỜI ĐÃ MẤT (loại khó dựng nhất — cần tìm đúng 1 vong hồn chịu làm Neo) | Trừ **Thọ Nguyên** (2-5 năm) thay vì Thanh Tỉnh — "âm luật đòi mạng, không đòi tâm trí" |
| **Mộng Cảnh Đạo** | Diễn ra TRONG lớp Mộng Cảnh riêng (nếu đã build) — thời gian trôi khác, thất bại có % nhỏ "lạc" thêm 1 lượt trước khi thoát được | Neo KÝ ỨC (biến thể của Neo người/địa điểm, mang tính trừu tượng hơn) | Giữ nguyên Thanh Tỉnh, nhưng số lượng gấp đôi (15 thay vì 5 nếu Cấp 11+) |
| **Luyện Thể Đạo** | Thử thách THỂ CHẤT thuần túy (PHY/Aptitude, KHÔNG dùng Ngộ Tính) — fail có % nhỏ sinh luôn 1 Biến Dị Thân Thể | Neo THÂN THỂ (một vết sẹo thề nguyện/1 phần cơ thể hiến tế nhỏ, không hồi phục) | Trừ **Khí Huyết tối đa VĨNH VIỄN** 2-3% mỗi lần (không hồi, tích lũy qua nhiều lần Đột Phá — cái giá thật sự của Luyện Thể) |
| **Tinh Tướng Đạo** | CHỈ thực hiện được vào đúng khung giờ "sao chiếu mệnh" theo GameClock (time-gated, phải chờ đúng lúc) | Neo MỆNH SỐ — dùng chính 1 Mệnh Số đang sở hữu làm Neo thay vì người/vật/địa điểm | Hiến **1 điểm Mệnh Điểm** từ 1 Mệnh đang active thay vì Thanh Tỉnh |

### 11.2. Nguyên tắc thiết kế đằng sau bảng trên (để mở rộng thêm Con Đường sau này nếu cần)
- **Vượt Dị Tượng** luôn đổi HÌNH THỨC thử thách theo chủ đề Con Đường (combat/skill-check/time-
  gated/map-gated) nhưng GIỮ NGUYÊN cơ chế nền (vẫn là 1 roll thành/bại theo công thức đã có ở
  `BREAKTHROUGH_RITUAL_DETAIL.md` mục 6.4.1, chỉ đổi input stat nào được dùng để tính successChance).
- **Dựng Neo** luôn gợi ý/ưu tiên 1 LOẠI Neo cụ thể khớp chủ đề (không cấm hoàn toàn loại khác, trừ
  Phong Thủy Đạo là ngoại lệ BẮT BUỘC vì bản chất Con Đường này gắn chặt với địa điểm).
- **Trả Giá** đổi LOẠI TÀI NGUYÊN bị trừ (không phải luôn là Thanh Tỉnh) theo đúng triết lý "cái giá
  phải khớp bản chất Con Đường" — Kiếm/Ngũ Thú Đạo trả bằng máu thịt, Đan/Khôi Lỗi Đạo trả bằng vật
  chất, Âm Luật Đạo trả bằng sinh mệnh, Luyện Thể Đạo trả bằng chính thân thể VĨNH VIỄN (nặng nhất
  trong 10 Con Đường, đúng tinh thần "tu luyện thân thể là con đường tàn khốc nhất").

---


## 11. GIẢI QUYẾT DỨT ĐIỂM 4 VIỆC ĐÃ TREO (không còn là câu hỏi mở — đây là quyết định cuối)

### 11.1. Số liệu cụ thể cho Tẩu Hỏa Nhập Ma (mục 3) và Bế Quan (mục 2)
```
safeThreshold(level) = requiredExpForLevel(level) × 5% MỖI NGÀY GAME
  // nghĩa là: tích đủ 1 Cấp trong ~20 ngày game liên tục là NHỊP AN TOÀN chuẩn

recentTuViVelocity = tổng Tu Vi nhận được trong 24h game gần nhất (cộng dồn TẤT CẢ nguồn ở mục 1)

if (recentTuViVelocity > safeThreshold × 150%):
    tyLeTauHoa = min(30%, (recentTuViVelocity / safeThreshold - 1.5) × 40%)
    // VD velocity = 300% safeThreshold -> (3.0-1.5)*40% = 60%, clamp về 30% (trần tuyệt đối)
else:
    tyLeTauHoa = 0%   // dưới 150% nhịp chuẩn, không có rủi ro gì
```
Bế Quan (mục 2) giữ nguyên 3 mốc hệ số đã đề xuất (1.5x/2.0x/3.0x theo 1-5/6-15/16-30 ngày) — số này
đã đủ cụ thể để code thẳng, không cần chỉnh thêm.

### 11.2. `daoTam` — QUYẾT ĐỊNH: TÁCH RIÊNG, KHÔNG GỘP VỚI CORRUPTION, NHƯNG CÓ TƯƠNG TÁC RÕ RÀNG
Lý do không gộp: 2 chỉ số đo 2 THỨ KHÁC NHAU về bản chất — Corruption đo mức độ **bị nhiễm tà từ
bên ngoài** (có thể xảy ra ngoài ý muốn), còn `daoTam` đo mức độ **kiên định nội tại với lựa chọn đã
đưa ra** (chỉ đổi qua hành vi chủ động). 1 nhân vật hoàn toàn có thể vừa Corruption cao vừa `daoTam`
cao (1 tà tu kiên định dấn thân theo tà đạo, biết rõ mình đang làm gì) — nếu gộp chung 1 field theo
hướng ngược dấu thì KHÔNG THỂ biểu diễn được trường hợp này, mất đi 1 chiều sâu roleplay quan trọng.

Thay vào đó, thêm ĐÚNG 1 công thức tương tác rõ ràng (không tạo field mới, chỉ thêm phép tính):
```
effectiveCorruptionGain = baseCorruptionGain × (1 - daoTam / 200)
// daoTam=0 -> không giảm gì; daoTam=100 -> giảm 50% tốc độ nhiễm Corruption
// Ý nghĩa: ý chí kiên định giúp CHẬM quá trình tha hóa, nhưng không ngăn được hoàn toàn nếu nhân
// vật chủ động chọn hành vi gây Corruption (daoTam không phải "miễn nhiễm", chỉ là "đề kháng")
```

### 11.3. Chuyển Đạo (mục 6) — XÁC NHẬN: không cần data mới
Đúng như đã ghi — `match_score`/`tags` theo 10 Con Đường đã có sẵn (từ `HE_THONG_HOP_NHAT.md` mục
7.1, đã dùng để sinh `path_affinity` cho Mệnh Số ở pha trước). Chuyển Đạo chỉ cần 1 hàm
`switchPathContext(character, newPathId)` đổi lại `character.currentPathId` rồi TÍNH LẠI match_score
theo bảng cũ với path mới — không viết thêm bảng nào khác.

### 11.4. Thiên Phú Chủng Tộc × Con Đường — HOÀN THIỆN ĐỦ 7/7 CHỦNG TỘC
| Chủng tộc | Con Đường Thiên Phú | Hiệu ứng |
|---|---|---|
| Yêu Tộc | Ngũ Thú Đạo | +20% tốc độ tích `daoTam` nếu theo Con Đường này |
| Ma Tộc | Âm Luật Đạo | +20% tốc độ tích `daoTam` |
| Linh Tộc | Phong Thủy Đạo | +20% tốc độ tích `daoTam` |
| Cơ Quan Tộc | Khôi Lỗi Đạo | +20% tốc độ tích `daoTam` |
| **Nhân Tộc** | KHÔNG thiên vị Con Đường nào (đúng lore "căn cơ cân bằng, thích nghi cao" đã có sẵn) | Thay vào đó: +5% tốc độ tích `daoTam` áp dụng CHO MỌI Con Đường bất kể chọn gì — bù lại bằng tính linh hoạt thay vì chuyên sâu 1 hướng |
| **Ma Thần Hậu Duệ** | Âm Luật Đạo VÀ Luyện Thể Đạo (2 Con Đường cùng lúc, hiệu ứng thấp hơn 1 chút mỗi cái) | +12% tốc độ tích `daoTam` cho MỖI Con Đường trong 2 cái trên (phản ánh bản chất lai Ma Tộc/Nhân Tộc — vừa dính dáng âm giới vừa mang thân xác người) |
| **Cổ Tộc** | Tinh Tướng Đạo | +20% tốc độ tích `daoTam` (căn cơ thượng cổ hiểu thiên tượng/vận mệnh sâu sắc hơn chủng tộc khác) |

Đã hoàn thiện đủ 7/7 — không còn khoảng trống nào trong bảng Thiên Phú Chủng Tộc.


### Source: `archive-requirements\logic-history\02-progression\TU_VI_CON_DUONG_BREAKTHROUGH_GAP_SPEC.md`

# ĐẶC TẢ HỢP NHẤT — TU VI, CON ĐƯỜNG & NGHI THỨC ĐỘT PHÁ (GAP SPEC)

> Tài liệu này hợp nhất các phần còn thiếu của `PHAC_THAO_TU_VI_CON_DUONG_V3.md` và
> `BREAKTHROUGH_RITUAL_DETAIL.md` cùng thư mục sau khi đối chiếu với code hiện tại.
>
> Mục tiêu: bổ sung logic chưa tồn tại, không sao chép lại hệ thống đã có và không đưa vào
> đặc tả các quy trình mâu thuẫn với implementation hiện tại.

## 1. Phạm vi và baseline bắt buộc

Các module hiện có và được xem là nguồn sự thật:

- `js/engine.js`: Tu Vi, Mệnh Số, Con Đường, điều kiện đột phá, action dispatcher,
  Neo Nhân Tính, Bế Quan cơ bản.
- `js/expansion.js`: đồng bộ thời gian/thế giới và các hook mở rộng.
- `js/ui.js`, `js/main.js`: Action Bar, tab Cảnh Giới, modal nghi thức và event handler.
- `requirement/NEO_NHAN_TINH_DESIGN.md`: khái niệm Neo hiện có.
- `requirement/FATE_SYSTEM_SPEC.md`, `CONG_PHAP_SYSTEM.md`, `NPC_MONSTER_SYSTEM.md`:
  nguồn dữ liệu Mệnh Số, Công Pháp, NPC/quái.

Không được tạo lại các API đã có như `breakthroughRequirements()`,
`getBreakthroughBlockers()`, `breakthroughRitualStatus()`,
`performBreakthroughRitualStep()`, `anchorCandidates()`, `establishHumanAnchor()`.
Tính năng mới phải gọi các API này hoặc mở rộng bằng API mới có prefix rõ ràng.

## 2. Quyết định tương thích (loại bỏ xung đột)

### 2.1. Nghi thức đột phá

Implementation hiện tại dùng các ID:

```text
call_fate → compare → anchor → omen → cost → trial
```

Các tài liệu cũ dùng tên `realm_gate`, `path_gate`, `body_mind_check`,
`cost_commit`. Những tên cũ không được dùng làm ID runtime mới. Nếu cần trao đổi
với API ngoài, dùng bảng ánh xạ:

```js
{
  realm_gate: "call_fate",
  path_gate: "compare",
  anchor_gate: "anchor",
  body_mind_check: "omen",
  cost_commit: "cost"
}
```

Các cấp 1→2 và logic khai mạch hiện tại giữ nguyên, không đưa vào feature mới.
Nghi thức mới chỉ bổ sung dữ liệu/hành vi còn thiếu từ cấp 3 trở lên.

### 2.2. Nguyên tắc commit

- Không tạo một pipeline đột phá thứ hai.
- Không trừ EXP/Tu Vi lần nữa ở bước nghi thức.
- `performBreakthroughRitualStep()` chỉ hoàn tất cổng; `maybeBreakthrough()` là
  commit cảnh giới cuối cùng.
- Khi ritual đã đủ cổng, `maybeBreakthrough()` phải bỏ qua roll thân/tâm cũ.
  Roll ngẫu nhiên duy nhất của pipeline là `omen`.
- Không đưa vào đặc tả cơ chế “5 cổng cố định cho mọi cấp”. Số cổng lấy từ
  `breakthroughRitualPlan()` hiện tại và dữ liệu REALMS.

## 3. Mô hình dữ liệu bổ sung

### 3.1. Tu Vi velocity và Tẩu Hỏa Nhập Ma

Thêm các field có migration an toàn:

```js
state.player.cultivation = {
  velocity24h: 0,
  velocitySamples: [],       // tối đa 128 mẫu
  deviationCount: 0,
  lastDeviationAt: null,
  pendingDeviation: null
}
```

Mỗi nguồn cộng Tu Vi phải gọi một hàm duy nhất:

```js
recordCultivationGain(state, amount, source, metadata = {})
```

`source` thuộc một trong: `cultivate`, `auto`, `be_quan`, `combat_insight`,
`environment_insight`, `dao_insight`, `spar_insight`, `minor_trial`, `other`.

Mẫu lưu dạng:

```js
{ amount, source, gameDay, timestamp, realmLevel }
```

Chỉ giữ mẫu trong 24 ngày game gần nhất (dùng GameClock, không dùng thời gian
thực). `velocity24h` là tổng `amount` của các mẫu còn hạn.

### 3.2. Công thức ngưỡng an toàn

```js
safeVelocity = requiredExpForNextRealm(state) * 0.05
ratio = safeVelocity > 0 ? velocity24h / safeVelocity : 0
deviationChance = ratio > 1.5
  ? clamp((ratio - 1.5) * 0.40, 0, 0.30)
  : 0
```

Không roll nếu `deviationChance === 0`. Khi roll trúng:

```js
severityChance = clamp(0.20 + corruptionRating / 200, 0.20, 0.70)
```

- Nhánh nhẹ: mất ngẫu nhiên 10–20% EXP chưa chốt, cộng 5 Madness.
- Nhánh nặng: tạo một `pendingDeviation` loại biến dị thân thể, không mất EXP.
- Không bao giờ trừ EXP đã chốt ở cảnh giới trước.
- Một lần nhận EXP chỉ được roll tối đa một lần; tránh nested roll khi Bế Quan.

API mới:

```js
recordCultivationGain(state, amount, source, metadata)
cultivationVelocityStatus(state)
resolveCultivationDeviation(state, choice)
```

`resolveCultivationDeviation()` chỉ nhận các choice được engine trả về; không
cho client tự gửi hiệu ứng tùy ý.

## 4. Đa dạng hóa nguồn Tu Vi

Các nguồn sau chưa có trong code và phải dùng chung `recordCultivationGain()`.

### 4.1. Chiến Ngộ

Sau combat thắng NPC/quái:

```js
combatInsight = baseGain
  * clamp((enemyRealm - playerRealm) * 0.25, 0, 1.5)
  * clamp(enemyPower / Math.max(1, playerPower), 0.75, 1.5)
```

- Chỉ kích hoạt nếu đối thủ có cảnh giới ngang hoặc cao hơn.
- Không kích hoạt khi đối thủ chết do môi trường, bẫy hoặc auto-resolve.
- Giới hạn một phần thưởng mỗi encounter.
- Ghi log nguồn và enemyId để audit.

### 4.2. Cảnh Ngộ

Tại location có `linhKhiDensity >= 3`, nếu người chơi đứng yên liên tục:

```js
state.player.environmentInsight = {
  locationId,
  startedDay,
  accumulatedDays,
  interrupted: false
}
```

- Mỗi ngày game hoàn chỉnh cộng `baseCultivationGain * densityMultiplier`.
- `densityMultiplier = 1 + (linhKhiDensity - 3) * 0.25`, tối đa 2.0.
- Move, combat, encounter hoặc action chủ động reset bộ đếm.
- Không cộng khi đang `pendingEnding`, đang giao chiến hoặc location không hợp lệ.

### 4.3. Vấn Đạo và Đấu Ngộ

Chỉ NPC có `pathId` trùng player mới mở action.

- `Vấn Đạo`: một lần/NPC/kiếp, roll theo chênh lệch cảnh giới; thành công cộng
  Tu Vi và một insight log.
- `Đấu Ngộ`: mô phỏng spar, không gây HP damage; dùng công thức combat nhưng chỉ
  trả về `win/loss`, cộng Tu Vi nhỏ hơn Vấn Đạo.
- Mỗi NPC lưu cooldown bằng `state.flags.pathInsight[npcId]`.
- Không tạo NPC mới ngoài hệ thống encounter hiện có.

API:

```js
pathInsightOptions(state, npcId)
performPathInsight(state, npcId, type) // type: "ask" | "spar"
```

## 5. Bế Quan mở rộng

Không thay thế `secludedCultivation()`. Mở rộng hàm bằng tùy chọn `days` và giữ
đường tương thích với `hours` cũ.

```js
startSecludedCultivation(state, { days, locationId })
stopSecludedCultivation(state)
secludedCultivationStatus(state)
```

Quy tắc:

- `days` từ 1 đến 30; nếu client chỉ gửi `hours`, quy đổi theo cấu hình GameClock.
- Hệ số: 1–5 ngày = 1.5x; 6–15 = 2.0x; 16–30 = 3.0x.
- Đang Bế Quan khóa action chủ động, chỉ cho phép `stop`/phản ứng hệ thống.
- Thoát sớm trả Tu Vi theo tỷ lệ thời gian đã chạy, không phạt.
- Mốc 6–15 ngày: rủi ro Tiếng Vọng = 10%.
- Mốc 16–30 ngày: rủi ro đột nhập = 25%, combat auto dùng stat giảm 50%.
- Location có `ownerFactionId` trùng faction phục vụ giảm một nửa các rủi ro trên.
- Mỗi phiên chỉ roll rủi ro một lần cho mỗi mốc; lưu vào session để không roll lại
  khi reload.

Schema:

```js
state.player.secludedSession = {
  status: "active" | "completed" | "stopped" | "interrupted",
  locationId,
  startedDay,
  plannedDays,
  elapsedDays,
  multiplier,
  riskRolls: { echo: null, intrusion: null },
  gainedExp,
  interruptedBy: null
}
```

## 6. Đạo Tâm

Thêm field độc lập với Corruption:

```js
state.player.daoTam = 50
state.flags.daoTamHistory = [] // tối đa 100 entries
```

Chỉ engine được thay đổi giá trị qua:

```js
adjustDaoTam(state, delta, reason, metadata = {})
```

Giới hạn 0–100, ghi `before/after/reason/gameDay`.

Các sự kiện tối thiểu:

- Thành công ritual không đổi Con Đường: +2.
- Thất bại `omen`: -2; thất bại liên tiếp lần 3 trở đi thêm -1.
- Đổi Con Đường hợp lệ: đặt về tối đa 10.
- Từ chối cơ duyên trái Con Đường: +1.
- Dùng kỹ thuật cấm trái hệ: -3.

Tương tác:

```js
daoTamMatchBonus = daoTam >= 80 ? 10 : 0
effectiveCorruptionGain = baseGain * (1 - daoTam / 200)
```

Bonus chỉ cộng vào `match_score` ở lớp tổng hợp, không sửa điểm gốc của Mệnh Số.

## 7. Chuyển Đạo

Không cho đổi trực tiếp qua `selectPath()`. Thêm quest/NPC gate:

```js
pathSwitchStatus(state)
pathSwitchCandidates(state)
switchPathContext(state, newPathId, npcId)
```

Điều kiện:

- Có NPC chuyển đạo đang active và đã đạt quan hệ tối thiểu.
- Không trong combat, Bế Quan hoặc ritual đang mở.
- Cooldown mặc định 30 ngày game.

Khi thành công:

1. Giữ EXP, Mệnh Số vật lý, Công Pháp và cảnh giới.
2. Đổi `player.pathId`, tính lại `pathMatchSummary()`.
3. Xóa bonus tương hợp tạm thời của đường cũ.
4. Giảm `daoTam` về tối đa 10.
5. Reset ritual đang dở về `null`.
6. Ghi cooldown và log lý do.

## 8. Tiểu Kiếp

Tạo một event duy nhất ở mốc 50% EXP của cảnh giới kế tiếp:

```js
state.flags.minorTrial = {
  targetRealmId,
  thresholdExp,
  status: "available" | "accepted" | "passed" | "skipped",
  offeredAtDay,
  resolvedAtDay
}
```

- Chỉ tạo một lần cho mỗi `targetRealmId`.
- Người chơi được bỏ qua, không bị phạt.
- Thành công chọn một trong hai phần thưởng: +1 điểm Chuyển Sinh dự trữ hoặc
  bonus Tu Vi cố định theo cảnh giới.
- Không được tự động mở ritual hoặc commit cảnh giới.
- Event phải đi qua action dispatcher, không sửa state trực tiếp từ UI.

## 9. Khác biệt hóa nghi thức theo Con Đường

Không thay đổi thứ tự gate hiện tại. Chỉ thêm adapter dữ liệu:

```js
PATH_RITUAL_PROFILES[pathId] = {
  anchorType,
  omenCheck,
  costType,
  costAmount,
  locationRequirement,
  failureEffect
}
```

MVP chỉ triển khai các profile không phá vỡ schema tài nguyên hiện có:

- Kiếm Đạo: ưu tiên anchor vật phẩm; fallback Neo NPC hiện tại.
- Đan Đạo: yêu cầu location có lò luyện nếu dữ liệu location hỗ trợ.
- Phong Thủy Đạo: yêu cầu location có `longMai`.
- Ngũ Thú Đạo: ưu tiên companion hợp lệ; fallback không được tự động pass.
- Tinh Tướng Đạo: kiểm tra khung giờ GameClock.

Nếu tài nguyên hoặc entity chưa tồn tại, gate phải trả blocker rõ ràng thay vì
giả lập thành công. Không đưa các cost mới như Khí Huyết tối đa vĩnh viễn,
Thọ Nguyên hoặc nguyên liệu quý vào runtime cho tới khi inventory/lifespan API
đã hỗ trợ transaction nguyên tử.

## 10. Tutorial và UI bổ sung

UI hiện có modal ritual và quick hint. Chỉ bổ sung:

- `data-ritual-tutorial` mở nội dung giải thích theo gate.
- Quick hint lấy từ blocker thật, không dùng text tĩnh.
- Tự mở tutorial một lần ở mỗi lần `currentGate` thay đổi; trạng thái lưu:

```js
state.flags.ritualTutorial = {
  lastTargetRealmId: null,
  lastGate: null,
  suppressed: false
}
```

- Không khóa action vì tutorial; tutorial chỉ là lớp hướng dẫn.
- Action Bar chỉ hiển thị action runtime hiện có, không thêm một bộ action song song.

## 11. Rankboard và Tu Vi Thư

### 11.1. Rankboard vùng

Tạo API read-only:

```js
getRegionalCultivationRankboard(state, regionId, limit = 10)
```

Nguồn gồm player và NPC đã biết trong region. Sắp xếp theo level, EXP, danh vọng;
ẩn NPC chưa được khám phá. Cache theo `worldTick` và invalid khi player/NPC tăng
cảnh giới.

### 11.2. Tu Vi Thư

Ghi các mốc vào:

```js
state.player.cultivationJournal = [
  { type, gameDay, realmId, amount, source, note }
]
```

Chỉ ghi breakthrough, minor trial, deviation, insight và path switch; giới hạn
500 bản ghi, loại cũ nhất trước. UI hiển thị dạng timeline, không tạo chart engine
mới nếu chưa có thư viện biểu đồ.

## 12. Migration và transaction

`deserialize()` phải thêm mặc định:

```js
player.cultivation ??= { velocity24h: 0, velocitySamples: [], deviationCount: 0,
  lastDeviationAt: null, pendingDeviation: null };
player.daoTam ??= 50;
flags.daoTamHistory ??= [];
flags.minorTrial ??= null;
flags.ritualTutorial ??= { lastTargetRealmId: null, lastGate: null, suppressed: false };
```

Mọi action mới phải snapshot trước/sau và rollback nếu transaction thất bại.
Không để UI tự trừ EXP, SAN, HP, lifespan hoặc inventory.

## 13. Acceptance checklist

- Nhận EXP từ mọi nguồn đều cập nhật velocity đúng một lần.
- Velocity hết hạn theo GameClock sau 24 ngày.
- Tẩu Hỏa không làm mất EXP đã chốt.
- Bế Quan 1–30 ngày, thoát sớm đúng tỷ lệ, không nhân đôi phần thưởng khi reload.
- NPC cùng Con Đường mở đúng Vấn Đạo/Đấu Ngộ và có cooldown.
- `daoTam` độc lập với Corruption, có audit history và ảnh hưởng match score.
- Chuyển Đạo reset ritual, giữ EXP/Mệnh/Công Pháp, áp cooldown.
- Tiểu Kiếp chỉ xuất hiện một lần ở 50% và không tự commit cảnh giới.
- Ritual chỉ có một roll thất bại (`omen`); sau khi đủ cổng, đột phá không roll lại
  và không mất EXP lần hai.
- Cấp 14 chỉ mở thử thách cuối khi có combat/quest backend thật; không pass bằng cờ
  giả lập ngoài ý muốn.
- Save cũ load được không lỗi; save mới không làm hỏng các API hiện tại.
- `node tools/verify_game.js` và toàn bộ `node --check js/*.js` phải pass.

## 14. Không nằm trong tài liệu này

Để tránh trùng lặp hoặc lệch code, tài liệu này không đặc tả lại:

- Công thức Mệnh Số, path matching và điều kiện breakthrough nền đã có.
- Combat, encounter, inventory, lifespan và faction system hiện có.
- Cơ chế khai mạch cấp 1→2.
- Các tên gate cũ như một API runtime độc lập.
- Các cost tài nguyên chưa có transaction backend.
- Nội dung lore, hội thoại hoặc asset hình ảnh không cần cho logic.

## 15. Nhật ký triển khai (2026-09-09)

Phần nền đã được triển khai trực tiếp trong `js/engine.js`:

- `createCharacter()` khởi tạo `daoTam`, `cultivation`, `cultivationJournal` và
  `secludedSession` với giá trị mặc định an toàn.
- `deserialize()` tự migrate các field mới cho save cũ.
- `gainExp()` đi qua `recordCultivationGain()` để mọi nguồn EXP đều có velocity
  và nhật ký; dùng chung một điểm vào để tránh ghi trùng.
- `cultivationVelocityStatus()` cung cấp velocity/ngưỡng/rủi ro cho UI và audit.
- `adjustDaoTam()` ghi lịch sử thay đổi, giới hạn 0–100; `pathMatchSummary()` đã
  cộng bonus +10 khi Đạo Tâm ≥ 80.
- `performBreakthroughRitualStep()` ghi `requiredGates`, `gatesPassed`,
  `currentGate`, `attemptLog` và giảm Đạo Tâm khi Vượt Dị Tượng thất bại.
- `maybeBreakthrough()` không còn roll thân/tâm lần hai sau khi toàn bộ ritual
  hoàn tất; commit cảnh giới trở thành deterministic.
- `breakthroughRitualPlan()` đã chuẩn hóa cấp 3–4 cùng dùng 2 cổng.

Các phần còn lại trong tài liệu (Chiến Ngộ/Cảnh Ngộ, Vấn Đạo/Đấu Ngộ, Bế Quan
1–30 ngày, Chuyển Đạo, Tiểu Kiếp, profile nghi thức theo Con Đường, rankboard,
Tu Vi Thư UI) vẫn là backlog; chưa đánh dấu hoàn tất cho tới khi có action,
transaction và test tương ứng.
## Journey intent and stage-2 organization gate

- `Tầm Sư` stores one concrete regional sect in `openingPlan.targetOrganizationId`.
- `Quy Tông` stores one concrete regional family-style organization in the same field.
- Organization classification uses explicit family markers; a bare `Tộc` or `Bộ` label is not enough because it can describe a tribe, alliance, or species.
- On entering Khai Lộ, a valid targeted journey sets `pendingGuildChoice`. Save migration reconstructs that flag when the canonical target exists, the character is at stage 2+, has no membership, and has no recorded guild decision.
- `Tự Lập` records an independent journey decision and never creates a guild target.
