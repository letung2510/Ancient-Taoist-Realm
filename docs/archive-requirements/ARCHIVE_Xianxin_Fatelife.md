# CỔ DỊ DIỆN (ANCIENT ABYSSAL REALM) - MASTER SPECIFICATION V11.1
> **Tài liệu Kỹ thuật Tổng hợp System Architecture (Lịch sử cập nhật từ V1 đến V11.1)**

---

## I. LỊCH SỬ PHÁT TRIỂN HỆ THỐNG (VERSION HISTORY)

* **V1.0 - V5.0 (Cơ sở ban đầu):** Đặt nền móng về thế giới Cổ Dị Diện, chỉ số thuộc tính cơ bản (Sức mạnh/trí tuệ/phòng ngự/nhanh nhẹn: Chủ yếu để đi đánh quái làm quest), Điên loạn/ Tỉnh táo/ SAN (Sanity), Ngộ tính (chỉ số này càng cao thì mệnh số nhận được càng đẹp, tu luyện càng nhanh) và Thọ Nguyên (Lifespan).
Thế giới Cổ Dị Diện được thiết kế theo mô hình **Tiên Hiệp Phương Đông kết hợp Cthulhu/Lovecraft Horrors**:
* **Linh Khí Biến Dạng (Corrupted Qi):** Linh khí trong thiên địa không còn thuần khiết mà bị lây nhiễm bởi tàn niệm của các Cổ Thần / Dị Quỷ. Năng lượng tu luyện càng cao thì nguy cơ bị tha hóa càng lớn.
* **Quy Luật Sinh-Lão-Bệnh-Tử:** Mọi sinh linh sinh ra đều bị ràng buộc bởi Thọ Nguyên (Lifespan). Khi Thọ Nguyên về $0$, nhân vật bắt buộc phải đi vào Luân Hồi Trọng Sinh.

---

## II. HỆ THỐNG CHỈ SỐ CỐT LÕI (BASE ATTRIBUTES & SURVIVAL)

### 1. Chỉ Số Chiến Đấu Cơ Bản
* **Physical (PHY):** Đại diện cho Thể Phách, Sức Lực và Căn Cơ Thể Chất.
* **Magic (MAG):** Đại diện cho Linh Lực, Thần Thức và Ngộ Tính Tu Diệu Pháp.

### 2. Chỉ Số Sinh Tồn & Tâm Lý
* **SAN (Sanity - Điểm Tỉnh Táo):** 
  * Ngưỡng ban đầu: $100/100$.
  * Giảm khi tiếp xúc với Dị Quỷ, đọc Cổ Thư Tà Thần, hoặc đi vào Môi trường Dị Biến.
  * **Cơ chế Điên Loạn (Madness State):** Khi $\text{SAN} = 0$, nhân vật rơi vào trạng thái Mất Trí Hoàn Toàn $\rightarrow$ Bị tước quyền điều khiển chủ động, tự động tấn công ngẫu nhiên hoặc tự sát.
* **Thọ Nguyên (Lifespan):** 
  * Giới hạn tuổi thọ của nhân vật.
  * Có thể tiêu hao như một loại tài nguyên đặc biệt để kích hoạt Bạo Phát Sức Mạnh (Life-force Burn).

---

## III. MÔI TRƯỜNG DỊ BIẾN & QUEST CĂN BẢN (ENVIRONMENT & QUESTS)

### 1. Môi Trường Dị Biến (Eldritch Environment)
* Phân cấp theo mức độ ô nhiễm Linh Khí (Cấp 1 đến Cấp 5).
* Mỗi phút di chuyển trong vùng Dị Biến sẽ liên tục Check SAN ($Roll\_SAN < SAN\_Stat$). Nếu Fail $\rightarrow$ Trừ SAN trực tiếp và gán Debuff "Ảo Giác".

### 2. Hệ Thống Quest Căn Bản (V5.0)
* **Normal Quest:** Nhiệm vụ tông môn, thu thập linh thảo, diệt trừ Yêu Thú thường.
* **Eldritch Quest:** Nhiệm vụ do Môi trường Dị Biến hoặc Cổ Thần cưỡng chế giao phó (Thưởng lớn nhưng trừ SAN nặng).
* **V6.0 - V8.0 (Tà Thần & Cổ Thần):** Bổ sung hệ thống Tà Thần Ban Phước, Cursed Quest, và cơ chế đánh đổi Thọ Nguyên lấy sức mạnh.
# CỔ DỊ DIỆN (ANCIENT ABYSSAL REALM) - MASTER SPECIFICATION V8.0
> **Tài liệu Kỹ thuật Architecture: Fate Ratio R & Eldritch Intervention Priority System**

---

## I. CÔNG THỨC FATE RATIO R (V8.0 CORE ENGINE)

Hệ thống bắt đầu theo dõi sự cân bằng giữa **Tổng Mệnh Số sở hữu** và **Cảnh Giới Tu Vi hiện tại** thông qua chỉ số Tỷ Lệ Mệnh Số ($R$):

$$R = \frac{\text{Total\_Fate\_Score}}{\text{Min\_Fate\_Score}}$$

* **`Total_Fate_Score`:** Tổng điểm số nguyên của toàn bộ Mệnh Số (Cát Cách & Hung Cách) nhân vật đang gánh.
* **`Min_Fate_Score`:** Ngưỡng Mệnh Số tối thiểu bắt buộc phải có tương ứng với Cảnh Giới Tu Vi.

---

## II. MA TRẬN PHÂN LUỒNG TRẠNG THÁI (SERVER DECISION TABLE V8.0)

Dựa vào giá trị $R$, Server Decision Engine sẽ phân luồng xử lý và kích hoạt các Event tương ứng:

| Tỷ Lệ Fate Ratio ($R$) | Event Kích Hoạt | Hình Phạt Khi Fail Quest | Trạng Thái System (State) |
| :--- | :--- | :--- | :--- |
| **$R < 0.2$** | **Tà Thần Ghé Thăm** + Eldritch Quest | Phạt $\times 2$ Debuff, trừ Thọ Nguyên | `STATE_ELDRITCH_INTERVENTION` |
| **$0.2 \le R \le 5.0$** | Tăng trưởng bình thường | Không phạt đặc biệt | `STATE_NORMAL_GROWTH` |
| **$R > 5.0$** | **Fate Backfire** (Hell Quest $+200\%$ Độ Khó) | Trừ trực tiếp Thọ Nguyên & SAN | `STATE_FATE_BACKFIRE` |

---

## III. HỆ THỐNG ƯU TIÊN SỰ KIỆN (EVENT PRIORITY SYSTEM)

Để đảm bảo các sự kiện Tà Thần và Trừng Phạt không bị đè lên bởi các Quest thường, Server áp dụng **Priority Queue Logic**:

* **Priority 0 (Highest / Unstoppable):** `STATE_ELDRITCH_INTERVENTION` & `STATE_FATE_BACKFIRE`. 
  * Cưỡng chế ngắt toàn bộ các hoạt động AFK, Luyện Danh, hoặc Quest Tông Môn.
  * Buộc người chơi phải xử lý Quest Tà Thần hoặc giải phóng bớt Mệnh Số trước khi tiếp tục chơi.
* **Priority 1 (Normal):** Quái vật tấn công, Quest Tông Môn, Đột phá Cảnh Giới.
* **Priority 2 (Low):** AFK Rewards, Trồng Linh Thảo, Giao dịch Chợ.

---

## IV. CƠ CHẾ ĐỐT THỌ NGUYÊN (LIFE-FORCE BURN)

* **Kích hoạt:** Trong trạng thái `STATE_ELDRITCH_INTERVENTION`, người chơi có thể chủ động chọn "Hiến Tế Thọ Nguyên".
* **Quy đổi:** $10 \text{ Năm Thọ Nguyên} = +100\%$ PHY/MAG Stats trong $30 \text{ Giây}$ (Dùng để lật kèo Quest Tà Thần).
* **V9.0 (Breakpoints & Lifespan Standard):** 
  * Thiết lập mốc nhảy vọt chỉ số (Threshold Breakpoint Scaling: x1.0, x1.5, x3.0, x6.0, x10.0+).
  * Quy định trực tiếp Max Lifespan cộng thêm khi đột phá Cảnh Giới Tiên Hiệp (Luyện Khí +50 năm, Trúc Cơ +150 năm, Kim Đan +500 năm, Nguyên Anh +2,000 năm, Hóa Thần+ +10,000 năm).
* **V10.0 (Separation of Concerns & Tử Vi Matrix):**
  * Tách biệt hoàn toàn Hệ thống Tu Vi (EXP/AFK) và Hệ thống Mệnh Số (Công Đức/Tử Vi).
  * Bổ sung Bảng Tử Vi Cách Cục (Bát Đại Cát Cách / Bát Đại Hung Cách với Chính Tinh & Phụ Tinh).
  * Đưa vào khái niệm Fate Backfire khi Mệnh Số xung đột Tu Vi.
* **V11.0 (Rune Page Inventory & ACID Transactions):**
  * Tách biệt **Active Slots (Trang Bị)** và **Fate Inventory (Mệnh Kho)** theo mô hình Bảng Ngọc LoL.
  * Thiết lập công thức dung lượng Mệnh Kho: `Max_Inventory_Slots = floor(Total_Fate / 3)`.
  * Rải rộng các kênh nhận Mệnh Số ngẫu nhiên (Online AFK, Cơ Duyên, Luân Hồi, Quest Ẩn).
  * Đóng gói thao tác Dung Hợp Mệnh Số vào Database ACID Transaction (Auto-Rollback khi Server Crash).
* **V11.1 (Clamping Boundaries & State Immunity - CURRENT):**
  * Áp dụng cơ chế **Clamping (Min/Max Boundaries)** cho Mệnh Kho để chống nổ kho / mất đồ.
  * Bảo vệ Mệnh Kho: Điểm Mệnh Số bị trừ do Fail Quest trong `STATE_FATE_BACKFIRE` chỉ dùng để kéo Ratio $R$ về dải an toàn, hoàn toàn **bất xâm phạm (Immune)** đối với Mệnh Kho.
  * Mở rộng dải Ratio an toàn: $0.2 \le R \le 5.0$.

---

## II. CHI TIẾT HỆ THỐNG KIẾN TRÚC V11.1

### 1. TÁCH BIỆT HỆ THỐNG TU VI & MỆNH SỐ (SRP PRINCIPLE)

#### 1.1. Luồng Tu Vi (Realm Progression Engine)
* **Thụ động (AFK / Idle Time):** Server chạy Background Job cộng EXP theo thời gian thực ($1 \text{ giây} = x \text{ EXP}$).
* **Chủ động (Active Farming):** Làm Quest, diệt Boss/Dị Quỷ.
* **Phần thưởng Tu Vi:** Tăng Cảnh Giới và cộng trực tiếp Max Lifespan:
  * Phàm Nhân (Mệnh 8-14): 60 - 80 năm.
  * Luyện Khí Kỳ: +50 năm (~130 năm).
  * Trúc Cơ Kỳ: +150 năm (~300 năm).
  * Kim Đan Kỳ: +500 năm (~800 năm).
  * Nguyên Anh Kỳ: +2,000 năm.
  * Hóa Thần Kỳ+: +10,000 năm.

#### 1.2. Luồng Mệnh Số (Fate Point Acquisition)
* **Đột phá Cảnh Giới:** Thưởng $1 - 2$ điểm Mệnh Số gốc và mở rộng Active Slots.
* **Cống Hiến Công Đức / Âm Đức:** Quy đổi tỷ lệ lệch ($10,000 \text{ Điểm Công Đức} = 1 \text{ Điểm Mệnh}$).

---

### 2. MỆNH KHO (FATE INVENTORY) & BẢNG SLOT TRANG BỊ

#### 2.1. Công Thức & Clamping Dung Lượng Mệnh Kho
$$\text{Max\_Inventory\_Slots} = \text{Clamp}\left(\left\lfloor \frac{\text{Normal\_Fate\_Score}}{3} \right\rfloor, \text{MIN\_SLOTS}, \text{MAX\_SLOTS}\right)$$
* **Bảo vệ dữ liệu:** Dung lượng kho chỉ tính theo `Normal_Fate_Score`. Khi ở trạng thái `STATE_FATE_BACKFIRE`, việc trừ điểm Mệnh Số do Fail Quest không làm sụt giảm dung lượng kho hiện tại.

#### 2.2. Ma Trận Giới Hạn Slot Trang Bị (Active Slots)

| Cảnh Giới Tu Vi | Active Slots Tối Đa | Ngưỡng Mệnh Tối Thiểu (`Min_Fate`) | Sức Chứa Mệnh Kho (Normal Fate / 3) |
| :--- | :--- | :--- | :--- |
| **Phàm Nhân** | **3 Slots** | 8 Điểm | 2 - 4 Slots Kho |
| **Luyện Khí Kỳ** | **5 Slots** | 20 Điểm | 6 - 10 Slots Kho |
| **Trúc Cơ Kỳ** | **10 Slots** | 50 Điểm | 16 - 25 Slots Kho |
| **Kim Đan Kỳ** | **15 Slots** | 100 Điểm | 33 - 45 Slots Kho |
| **Nguyên Anh Kỳ** | **20 Slots** | 150 Điểm | 50 - 60 Slots Kho |
| **Hóa Thần Kỳ+** | **30 Slots (MAX)** | 200 Điểm | 66+ Slots Kho (Clamped) |

---

### 3. MA TRẬN NGUỒN THU NHẬN MỆNH SỐ (RANDOM ACQUISITION)

| Kênh Thu Nhận | Tỷ Lệ / Điều Kiện Kích Hoạt | Phẩm Cấp Mệnh Số |
| :--- | :--- | :--- |
| **1. Online AFK Drop** | Roll 5% mỗi 15 phút Online | 90% Xám, 9% Trắng, 1% Lục | Nâng dần theo tu vi
| **2. Tà Thần Ban Phước** | Khí Vận $< 10$ hoặc $R < 0.2$ | Mệnh Dị Biến (Xám Đột Biến / Tím Đen) |
| **3. Ngộ Đạo (Serendipity)** | Tích lũy Cơ Duyên $\ge 100$ | 70% Lam, 25% Chàm, 5% Tím |
| **4. Luân Hồi Trọng Sinh** | Thọ Nguyên = 0 | Bảo lưu 1 Mệnh Số Tím/Kim kiếp trước |
| **5. Hidden Lore Quest** | Trả lời đúng câu hỏi suy luận Cthulhu | Mệnh Số Cổ Đại (Tím / Kim) |
| **6. Đột Phá Cảnh Giới** | Vượt Đại Cảnh Giới | 1 Mệnh Số Bản Mệnh ngẫu nhiên |

---

### 4. DỮ LIỆU TỬ VI CÁCH CỤC & TÍNH ĐIỂM SỐ NGUYÊN (INTEGER WEIGHTS)
### 1. Bát Đại Cát Cách (Mệnh Đẹp)[cite: 1]
* **Tử Phủ Đồng Cung ($+15 \to +20$ Điểm):** Khí Vận $+100$, $+20\%$ Breakpoint Stats. Kháng cưỡng chế đoạt xá[cite: 1].
* **Nhật Xuất Đản Diêu ($+12$ Điểm):** Khí Vận $+50$, x1.5 Sát thương Quang/Hỏa, kháng 30% SAN Drain[cite: 1].
* **Sát Cực Ngưỡng Đẩu ($+10$ Điểm):** Tăng mạnh PHY Stats[cite: 1].
* **Thị Huyết ($+1$ Điểm - Phẩm Xám):** Tăng khả năng hồi phục, Điểm Điên Loạn $+5$[cite: 1].

### 2. Bát Đại Hung Cách (Mệnh Xấu)[cite: 1]
* **Yểu Mệnh ($-2$ Điểm - Phẩm Xám):** STR $-5$, Linh Khí $-1$[cite: 1].
* **Mệnh Vô Chính Diệu ($-5$ Điểm):** Giảm 30% Base Stats, dễ bị Tà Thần chú ý[cite: 1].
* **Cự Môn Kình Dương ($-8$ Điểm):** Khí Vận $< 10$, nhận Eldritch Quest lập tức[cite: 1].
* **Hình Riêu Không Kiếp ($-12$ Điểm):** Thọ Nguyên bị rút 20%, Fail Quest phạt x4[cite: 1].
* **Cát Cách (Mệnh Đẹp):**
  * *Tử Phủ Đồng Cung:* $+15$ đến $+20$ Điểm Mệnh | Khí Vận $+100$, $+20\%$ Breakpoint Stats. Kháng cưỡng chế đoạt xá.
  * *Nhật Xuất Đản Diêu:* $+12$ Điểm Mệnh | Khí Vận $+50$, x1.5 Sát thương Quang/Hỏa, kháng 30% SAN Drain.
  * *Sát Cực Ngưỡng Đẩu:* $+10$ Điểm Mệnh | Tăng mạnh PHY Stats.
  * *Thị Huyết (Xám):* $+1$ Điểm Mệnh | Tăng khả năng hồi phục, Điểm Điên Loạn $+5$.
* **Hung Cách (Mệnh Xấu):**
  * *Yểu Mệnh (Xám):* $-2$ Điểm Mệnh | STR $-5$, Linh Khí $-1$.
  * *Mệnh Vô Chính Diệu:* $-5$ Điểm Mệnh | Giảm 30% Base Stats, dễ bị Tà Thần chú ý.
  * *Cự Môn Kình Dương:* $-8$ Điểm Mệnh | Khí Vận $< 10$, nhận Eldritch Quest lập tức.
  * *Hình Riêu Không Kiếp:* $-12$ Điểm Mệnh | Thọ Nguyên bị rút 20%, Fail Quest phạt x4.

---
Phần này tạo SQL riêng tổ hợp từ 1000-1500 mệnh số, tự random đặt tên vào tạo stats cho các mệnh số đó. Nói chung là càng nhiều càng tốt. Tự phân loại và chia điểm nhé.

### 5. AN TOÀN DỮ LIỆU FUSION (ACID TRANSACTION ROLLBACK)

Toàn bộ thao tác Dung Hợp (Gộp 3-4 Token) được thực hiện dưới dạng Atomic Transaction:

```sql
BEGIN TRANSACTION;
  -- 1. Validate Active Slots & Materials
  -- 2. DELETE 4 Old Ingredient Tokens from Inventory/Slots
  -- 3. INSERT 1 New Fused Token into Inventory
  -- 4. UPDATE Total_Fate_Score
COMMIT TRANSACTION;
-- IF ERROR / SERVER CRASH -> AUTOMATIC ROLLBACK TO PREVIOUS STATE

6. CÔNG THỨC STATS & SERVER DECISION TABLE (V11.1 FINAL)6.1. Công Thức Stats$$\text{Final\_Stats} = \text{Base\_Stats} \times (1 + \text{Hệ\_Số\_Tu\_Vi}) \times (1 + 0.01 \times \text{Total\_Fate\_Score}) \times \text{Stat\_Scaling\_Factor}$$6.2. Server Decision Table ($R = \frac{\text{Total\_Fate}}{\text{Min\_Fate}}$)Ratio (R)Event Kích HoạtHình Phạt Khi Fail QuestTrạng Thái Xuất Ra$R < 0.2$ ($<20\%$ Min)Tà Thần Ghé Thăm + Cursed QuestPhạt $\times 2$ Debuff, trừ Thọ NguyênSTATE_ELDRITCH_INTERVENTION$0.2 \le R \le 5.0$ (Normal)Chạy Stats chuẩn, không phạtKhông cóSTATE_NORMAL_GROWTH$R > 5.0$ ($>500\%$ Min)STATE_FATE_BACKFIRE (Priority = 0) + Hell Quest (+200% Độ Khó)Trừ Điểm Mệnh Số cho tới khi $R \le 5.0$ (Mệnh Kho miễn nhiễm)STATE_FATE_BACKFIRE