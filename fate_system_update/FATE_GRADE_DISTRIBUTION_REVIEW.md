# Review phân bố phẩm cấp Mệnh Số

Ngày review: 2026-09-08

Phạm vi: toàn bộ nguồn FATE ngoài thư mục `fate_system_update/`. Tài liệu này chỉ đánh giá và đề xuất, chưa thay đổi runtime.

## 1. Kết luận ngắn

Tỷ lệ catalog hiện tại là:

| Phẩm cấp | Số entry | Tỷ lệ catalog |
|---|---:|---:|
| Phàm | 8.000 | 80,00% |
| Linh | 1.500 | 15,00% |
| Hoàng | 250 | 2,50% |
| Huyền | 120 | 1,20% |
| Địa | 70 | 0,70% |
| Thiên | 50 | 0,50% |
| Thánh | 9 | 0,09% |
| Tiên | 1 | 0,01% |
| **Tổng** | **10.000** | **100%** |

Phân bố này hợp lý nếu được hiểu là **độ rộng của kho nội dung và độ hiếm lore**. Nó chưa hợp lý nếu được dùng trực tiếp làm tỷ lệ rơi cho mọi nguồn trong mọi giai đoạn.

Khuyến nghị chính: **không đổi catalog Phàm xuống 15% ngay lập tức**. Thay vào đó, giữ catalog để bảo toàn độ phong phú và độ hiếm của các phẩm cao, nhưng thêm bảng trọng số nhận Mệnh Số theo cảnh giới/nguồn nhận. Riêng từ cấp 3 trở đi, tỷ lệ Phàm trong phần thưởng gameplay nên giảm mạnh, có thể bắt đầu ở khoảng 15%.

## 2. Dữ liệu và runtime hiện tại

### 2.1. Catalog không đồng nghĩa tỷ lệ roll

`data/fate_data.js` có đúng 10.000 entry với phân bố 8.000/1.500/250/120/70/50/9/1.

Engine có nhiều cách chọn Mệnh Số:

- `drawInitialFates()` khi tạo nhân vật: cấp Di Mệnh dùng trọng số tier `65/30/5` cho Phàm/Linh/Hoàng, không dùng trực tiếp tỷ lệ 80/15/2,5.
- `receiveFate()` chỉ chịu trách nhiệm đưa ID vào Mệnh Kho hoặc hàng chờ; nó không tự cân bằng phẩm cấp.
- phần thưởng chiến đấu, manh mối bản đồ và nhiều cơ duyên lọc theo phẩm cấp tối đa rồi chọn một entry ngẫu nhiên trong pool. Khi pool gồm nhiều cấp, số entry Phàm áp đảo kết quả.
- phần thưởng online hiện giới hạn tối đa ở tier 3 (Hoàng), sau đó cũng chọn đều trong pool đủ điều kiện.
- Hư Thiên Đỉnh dùng pool `Phàm/Linh/Hoàng` theo số lượng nguyên liệu.
- Phường thị thường chỉ tạo offer Phàm; Công Đức hiện chủ yếu mở Phàm/Linh/Hoàng.
- Khâm Thiên Giám có logic neo theo phẩm đang chiếm đa số và có cơ hội tăng một cấp; đây là nguồn hiếm hoi đã có cơ chế nhắm tới phẩm cấp.

Do đó, vấn đề hiện tại là **sampling bias**: chọn đều trên catalog sau khi lọc không phản ánh đúng tiến trình mong muốn.

### 2.2. Tác động theo cảnh giới

Trong `data/canh_gioi_tien_hiep.json`:

- cấp 1: Di Mệnh;
- cấp 2: Khai Lộ;
- cấp 3: Dựng Thai, yêu cầu tổng Mệnh Số tối thiểu 20;
- cấp 4: Kim Ấn, yêu cầu tối thiểu 35;
- cấp 5: Anh Linh, yêu cầu tối thiểu 55;
- cấp 6: Thần Tính, yêu cầu tối thiểu 80;
- từ cấp 7 bắt đầu có thêm ngưỡng `minNormalFate`, tỷ lệ và các cửa nghi thức khác.

Một Mệnh Phàm vẫn có thể còn giá trị ở cấp cao nếu tương hợp Con Đường, có hiệu ứng điều kiện hoặc dùng làm nguyên liệu dung hợp. Tuy nhiên, nếu phần thưởng mới liên tục rơi Phàm thì trải nghiệm bị cảm giác “đang tiến cấp nhưng loot không tiến cấp”.

## 3. Đánh giá hai phương án đang được cân nhắc

### Phương án A — đổi Phàm trong catalog từ 80% xuống 15%

Ưu điểm:

- giảm mạnh hiện tượng chọn đều nhưng toàn ra Phàm;
- các phẩm Linh–Địa xuất hiện thường xuyên hơn nếu mọi nguồn vẫn chọn đều.

Nhược điểm:

- thay đổi ý nghĩa của toàn bộ catalog 10.000 entry;
- các hệ thống cũ đang lọc theo số lượng entry sẽ bị thay đổi ngầm, khó cân bằng riêng từng nguồn;
- Phàm mất vai trò nguyên liệu phổ thông cho hiến tế, Hư Thiên Đỉnh, nhiệm vụ và giai đoạn đầu;
- vẫn không giải quyết đúng bài toán nếu một nguồn không được lọc theo cảnh giới: chỉ chuyển từ “quá nhiều Phàm” sang “pool không có chủ đích”.

Kết luận: **không nên dùng đây làm bản sửa đầu tiên**.

### Phương án B — giữ catalog, nhưng từ cấp 3 giảm Phàm còn khoảng 15% trong phần thưởng

Ưu điểm:

- đúng với nhu cầu tiến trình của người chơi;
- không phá rarity/lore của catalog;
- có thể điều chỉnh theo từng nguồn và từng cấp;
- giữ được Phàm cho nhiệm vụ, mua bán, dung luyện và hoạt động cấp thấp.

Nhược điểm:

- cần đưa logic trọng số vào một nơi dùng chung, tránh mỗi action tự đặt tỷ lệ;
- cần quy định rõ “cấp 3” là cấp nhân vật hay phẩm cấp mục tiêu của phần thưởng.

Kết luận: **đây là phương án nên triển khai**.

## 4. Đề xuất cân bằng

### 4.1. Tách ba lớp dữ liệu

1. `catalogWeight`: độ dày nội dung trong catalog, hiện giữ nguyên 80/15/2,5/1,2/0,7/0,5/0,09/0,01.
2. `rewardGradeWeights`: tỷ lệ rơi theo cảnh giới và loại nguồn.
3. `gradeCap`: phẩm cấp tối đa mà nguồn đó được phép trao.

Không được dùng `catalog.length` để ngầm quyết định tỷ lệ rơi cho phần thưởng gameplay.

### 4.2. Bảng đề xuất cho phần thưởng thông thường

Các tỷ lệ dưới đây áp dụng cho một lần nhận Mệnh Số thông thường, không áp dụng cho Tiên phẩm duy nhất hoặc phần thưởng cốt truyện đặc biệt.

| Cấp nhân vật | Phàm | Linh | Hoàng | Huyền | Địa | Thiên | Thánh | Tiên |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–2 | 65% | 30% | 5% | 0% | 0% | 0% | 0% | 0% |
| 3–4 | 15% | 45% | 25% | 10% | 5% | 0% | 0% | 0% |
| 5–6 | 5% | 20% | 35% | 25% | 10% | 5% | 0% | 0% |
| 7–8 | 2% | 10% | 25% | 30% | 20% | 10% | 3% | 0% |
| 9+ | 1% | 5% | 15% | 25% | 25% | 18% | 11% | 0% |

Đây là phân bố khởi điểm để test, không phải giá trị bất biến. Có thể thêm `sourceModifier`:

- chiến đấu thường: lệch xuống một bậc;
- tinh anh/boss: lệch lên một bậc hoặc tăng cơ hội phẩm cao;
- nhiệm vụ/cơ duyên cốt truyện: dùng bảng riêng, có thể bảo đảm phẩm tối thiểu;
- online/AFK: ưu tiên Phàm–Hoàng, không nên trao Huyền+ quá dễ;
- Khâm Thiên Giám: giữ cơ chế neo theo phẩm đang kích hoạt và pity riêng; Tiên phẩm chỉ mở qua nguồn đặc biệt;
- Hư Thiên Đỉnh: phẩm đầu vào quyết định cap, không roll từ toàn bộ catalog.

### 4.3. Bảo toàn ý nghĩa của Phàm phẩm

Không nên coi Phàm là “vật bỏ đi” từ cấp 3. Phàm vẫn nên có ít nhất một trong các vai trò:

- nguyên liệu hiến tế/dung luyện;
- Mệnh tương hợp cao nhưng chỉ số thấp;
- mảnh ghép để nâng cấp hoặc mở quan hệ;
- phần thưởng bảo đảm khi người chơi đã hết Mệnh Kho;
- vật phẩm trao đổi giá thấp.

Như vậy giảm tỷ lệ rơi mới không biến Phàm thành dữ liệu vô dụng.

## 5. Điểm cần sửa trong runtime nếu chấp thuận

1. Tạo một hàm dùng chung, ví dụ `rollFateByProgression(state, source, options)`, nhận `realmLevel`, `source`, `gradeCap`, `pity` và `pathAffinity`.
2. Sửa combat, map clue, online, quest và cơ duyên để gọi hàm chung thay vì `filter(...).random()`.
3. Giữ `drawInitialFates()` riêng vì khởi tạo có trải nghiệm roll khác phần thưởng giữa game.
4. Đặt giới hạn online theo tiến trình: hiện tại `processOnlineFateReward()` đang cap ở tier 3, cần ghi rõ đây là chủ ý hay bug thiết kế.
5. Với mọi kết quả, ghi vào history/pending summary cả phẩm cấp và nguồn để người chơi thấy tiến bộ.
6. Thêm pity/bảo đảm nhẹ cho chuỗi phần thưởng cấp cao, ví dụ sau N lần không nhận được phẩm tối thiểu thì lần kế tiếp nâng cap hoặc tăng trọng số.
7. Viết test phân bố bằng seed/Monte Carlo cho từng cấp và từng nguồn; kiểm tra không có nguồn nào quay về sampling theo số lượng catalog ngoài chủ ý.

## 6. Ý kiến cuối cùng

- Ý kiến “từ cấp 3 người chơi không còn cần nhiều Phàm” là **đúng ở tầng phần thưởng**, nhưng không nên sửa bằng cách cắt catalog 80% xuống 15%.
- Tỷ lệ Phàm **15% từ cấp 3** là điểm khởi đầu hợp lý cho phần thưởng thông thường, không phải tỷ lệ toàn hệ thống.
- Nên giữ Tiên phẩm là entry duy nhất, nhưng không nên đưa Tiên vào bảng rơi thường với 1% ở mọi nguồn; Tiên nên có nguồn đặc biệt, điều kiện hoặc pity rất rõ.
- Cần phân biệt `phẩm cấp của Mệnh nhận được` với `độ phù hợp Con Đường`: Mệnh Linh/Huyền không tự động tốt hơn một Mệnh Phàm tương hợp 10/10.

**Khuyến nghị phê duyệt:** giữ catalog hiện tại; triển khai reward-grade weights theo cảnh giới, bắt đầu Phàm 15% từ cấp 3 cho phần thưởng thông thường; sau đó chạy mô phỏng và điều chỉnh theo tốc độ tăng `total_fate_score`, không chỉ theo số Mệnh nhận được.

---

## 7. Prompt triển khai chờ phê duyệt

> **Mục tiêu:** Cải thiện phân bố Mệnh Số nhưng không làm mất tính hiếm của Thánh/Tiên và không phá save/runtime hiện tại.
>
> ### Quyết định đã chốt
>
> - Phàm phẩm trong catalog mới: **50%**.
> - Tổng catalog vẫn giữ **10.000 entry**.
> - Tiên phẩm vẫn chỉ có **1 entry duy nhất**.
> - Catalog weight chỉ mô tả độ dày dữ liệu; không được dùng làm cơ chế duy nhất để quyết định loot.
>
> ### Phân bố catalog đề xuất
>
> | Phẩm | Số entry | Tỷ lệ |
> |---|---:|---:|
> | Phàm | 5.000 | 50,00% |
> | Linh | 2.500 | 25,00% |
> | Hoàng | 1.200 | 12,00% |
> | Huyền | 700 | 7,00% |
> | Địa | 400 | 4,00% |
> | Thiên | 150 | 1,50% |
> | Thánh | 49 | 0,49% |
> | Tiên | 1 | 0,01% |
> | **Tổng** | **10.000** | **100%** |
>
> ### Kế hoạch thay đổi data
>
> 1. Xác định file nguồn sinh catalog trong `fate_system_update/`; không sửa thủ công ngẫu nhiên các entry đã sinh nếu còn generator/source metadata.
> 2. Điều chỉnh generator hoặc source dataset để tạo đúng số lượng theo bảng trên; bảo toàn schema, ID ổn định của các Mệnh đã tồn tại và giữ nguyên entry Tiên duy nhất.
> 3. Regenerate `data/fate_data.js` bằng quy trình deterministic; không thay đổi `id`, `sign`, `effects`, `score` của entry đang được save tham chiếu nếu không thật sự cần.
> 4. Tạo báo cáo kiểm tra: tổng entry, count theo grade, duplicate ID, gradeLabel/grade, score/effects bắt buộc và số entry Tiên.
> 5. Nếu không thể giữ ID ổn định khi regenerate, dừng triển khai và tạo migration map trước; không ghi đè catalog đang chạy.
>
> ### Kế hoạch thay đổi code
>
> 1. Thêm một resolver dùng chung, ví dụ `rollFateByProgression(state, source, options)`, để chọn phẩm theo `realmLevel`, `source`, `gradeCap`, `pathAffinity` và pity.
> 2. Giữ riêng logic khởi tạo `drawInitialFates()`; không tự động biến catalog 50% thành tỷ lệ khởi tạo mới.
> 3. Với phần thưởng thông thường, áp dụng trọng số theo giai đoạn:
>    - cấp 1–2: Phàm 65%, Linh 30%, Hoàng 5%;
>    - cấp 3–4: Phàm 15%, Linh 45%, Hoàng 25%, Huyền 10%, Địa 5%;
>    - cấp 5–6: Phàm 5%, Linh 20%, Hoàng 35%, Huyền 25%, Địa 10%, Thiên 5%;
>    - cấp 7+: ưu tiên Huyền/Địa/Thiên/Thánh; Tiên không rơi từ bảng thường.
> 4. Chuyển combat, map clue, quest/cơ duyên và online reward sang resolver chung; không dùng `filter(...).random()` nếu pool chứa nhiều phẩm cấp.
> 5. Giữ nguồn đặc biệt riêng: Khâm Thiên Giám, cốt truyện, hidden fate, pity và Tiên phẩm.
> 6. Giữ Hư Thiên Đỉnh theo phẩm cấp nguyên liệu/cap riêng, không cho catalog 50% làm thay đổi ngầm kết quả dung luyện.
> 7. Hiển thị rõ phẩm cấp, nguồn nhận và tiến trình bảo đảm/pity trong history hoặc reward summary.
>
> ### Kế hoạch kiểm thử
>
> - Test schema và count catalog: 10.000 entry, Phàm 5.000, Tiên đúng 1.
> - Test migration save cũ: mọi ID trong `player.fates`, `fateInventory`, `pendingFateRewards` vẫn resolve được.
> - Monte Carlo có seed cho từng cấp 1–2, 3–4, 5–6, 7+ và từng nguồn reward; sai số mục tiêu không quá ±1 điểm phần trăm sau tối thiểu 100.000 lượt.
> - Test không thể nhận Tiên từ reward thông thường.
> - Test Mệnh tương hợp thấp nhưng grade cao không tự động vượt Mệnh tương hợp cao grade thấp trong các gate đã quy định.
> - Chạy `node --check`, `node tools/verify_game.js`, kiểm tra diff và kiểm tra giao diện Mệnh Kho/nhận thưởng.
>
> ### Điều kiện rollback
>
> Rollback nếu có ID mất khỏi catalog, save cũ không migrate được, tỷ lệ cấp 3+ vẫn lệch quá 5 điểm phần trăm so với bảng, hoặc Hư Thiên Đỉnh/Khâm Thiên Giám bị thay đổi ngoài phạm vi. Rollback phải khôi phục cả data catalog và resolver reward, không chỉ khôi phục UI.

**Trạng thái:** Chờ người dùng approve prompt và bảng phân bố trên trước khi bắt đầu sửa code/data.
