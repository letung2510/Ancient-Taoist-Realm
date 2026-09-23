# **THIẾT KẾ TÍNH NĂNG: MAPS \> LÂN CẬN (CONSTELLATION & LAZY-GEN)**

# **1\. TỔNG QUAN HỆ THỐNG**

Hệ thống bản đồ được thiết kế theo mô hình lưới tọa độ động, kết hợp giữa các điểm mốc cố định và các khu vực phát sinh ngẫu nhiên để tối ưu hóa hiệu suất và trải nghiệm khám phá.

* **Kích thước thế giới:** Lưới tọa độ $100 \\times 100$ ($X: 0 \\to 100, Y: 0 \\to 100$).  
* **Cấu trúc Map:**  
  * **Constellation Map (Tổng quan):** Bao gồm các **Anchor Nodes** cố định (Thành chính, Landmark câu chuyện, Boss).  
  * **Sub-Nodes (Map con):** Các node địa hình nhỏ, được tạo tự động thông qua cơ chế **Lazy-Gen** khi người chơi di chuyển tới gần.  
* **Tâm di chuyển:** Mỗi thao tác di chuyển của người chơi ứng với 1 bước chuyển node từ tọa độ hiện tại $A(X\_1, Y\_1)$ sang node mục tiêu $B(X\_2, Y\_2)$.

# **2\. LOGIC TÍNH KHOẢNG CÁCH (DISTANCE LOGIC)**

## **2.1. Khoảng cách Euclidean thực tế**

Khoảng cách thực tế giữa node hiện tại $A(X\_1, Y\_1)$ và node mục tiêu $B(X\_2, Y\_2)$ được tính theo công thức Euclidean nhằm đảm bảo tính chính xác về mặt không gian:

$$D\_{\\text{real}} \= \\sqrt{(X\_2 \- X\_1)^2 \+ (Y\_2 \- Y\_1)^2}$$

## **2.2. Khoảng cách bước nhảy biến thiên (Step-Range Distance)**

Khoảng cách cơ sở $D\_{\\text{base}}$ cho mỗi lượt di chuyển là một số nguyên ngẫu nhiên thuộc khoảng $\[1, 5\]$ units:  
$$D\_{\\text{base}} \\in \[1, 5\]$$

## **2.3. Quy đổi sang Gameplay Cost (Stamina & Thời gian)**

Khoảng cách $D\_{\\text{real}}$ trực tiếp quyết định lượng tài nguyên tiêu hao của người chơi dựa trên các hệ số môi trường:

* **Tiêu hao Thể lực (Stamina Cost):** $\\text{Stamina Cost} \= \\text{round}(D\_{\\text{real}} \\times \\text{Terrain Multiplier})$  
* **Thời gian trôi qua (Game Time):** $\\text{Time Elapsed} \= \\text{round}(D\_{\\text{real}} \\times 10 \\text{ phút})$

**Bảng hệ số địa hình (Terrain Multiplier)**

| Loại địa hình (Biome) | $D\_{\\text{base}}$ đề xuất | Hệ số địa hình |
| :---- | :---- | :---- |
| Đồng bằng (Plains) | $1 \- 2$ units | $1.0$ |
| Đường mòn / Làng (Road) | $1 \- 3$ units | $0.8$ |
| Rừng rậm / Đồi (Forest) | $2 \- 4$ units | $1.2$ |
| Đầm lầy / Núi đá (Swamp/Mountain) | $4 \- 5$ units | $1.5$ |

# **3\. LOGIC TÍNH NODE & LỆCH TỌA ĐỘ (NODE & ANGULAR OFFSET LOGIC)**

Để tránh cảm giác bản đồ lưới vuông (cờ caro) xơ cứng, hệ thống áp dụng **Góc lệch (Offset Angle $\\alpha$)** khi xác định vị trí node mới ở 4 hướng chính.

## **3.1. Phân vùng góc chuẩn 4 Hướng**

* **Bắc (North):** Angle $\\theta\_0 \= 90^\\circ$ (Trục $+Y$)  
* **Nam (South):** Angle $\\theta\_0 \= \-90^\\circ$ (Trục $-Y$)  
* **Đông (East):** Angle $\\theta\_0 \= 0^\\circ$ (Trục $+X$)  
* **Tây (West):** Angle $\\theta\_0 \= 180^\\circ$ (Trục $-X$)

## **3.2. Công thức tính Tọa độ Node mới**

Khi di chuyển theo một hướng với góc chuẩn $\\theta\_0$, quy trình tính toán như sau:

1. Random khoảng cách cơ sở $D\_{\\text{base}} \\in \[1, 5\]$.  
2. Random góc lệch $\\alpha \\in \[-20^\\circ, 20^\\circ\]$.  
3. Tính góc di chuyển thực tế: $\\theta \= \\theta\_0 \+ \\alpha$.  
4. Tọa độ chênh lệch $(\\Delta X, \\Delta Y)$:  
   $$\\Delta X \= \\text{round}(D\_{\\text{base}} \\cdot \\cos(\\theta))$$  
   $$\\Delta Y \= \\text{round}(D\_{\\text{base}} \\cdot \\sin(\\theta))$$  
   *(Lưu ý: Đảm bảo $(\\Delta X, \\Delta Y) \\neq (0, 0)$. Nếu bằng $(0, 0)$, làm tròn tối thiểu là 1 đơn vị theo hướng chính).*  
5. Tọa độ Node mới:  
   $$X\_{\\text{new}} \= \\text{Clamp}(X\_{\\text{current}} \+ \\Delta X, 0, 100)$$  
   $$Y\_{\\text{new}} \= \\text{Clamp}(Y\_{\\text{current}} \+ \\Delta Y, 0, 100)$$

# **4\. RULE TẠO MAP (MAP GENERATION & LAZY-GEN RULES)**

## **4.1. Phân loại Node**

* **Anchor Node (Static):** Các mốc cố định trên Constellation Map tổng (Thành phố, Dungeon lớn, Boss). Được khởi tạo cố định trong dữ liệu game và không bị thay thế.  
* **Procedural Sub-Node (Lazy-Gen):** Được sinh ra tự động khi người chơi đứng ở node lân cận và hướng đó chưa có Node. Trạng thái ban đầu là `UNEXPLORED`.  
* **Discovered Sub-Node:** Sub-node sau khi người chơi đã đặt chân tới. Lưu trữ dữ liệu quái, tài nguyên, và sự kiện.

## **4.2. Quy tắc Lazy-Gen xung quanh Player**

Khi Player dừng chân tại Node $A(X\_{\\text{cur}}, Y\_{\\text{cur}})$:

1. **Quét 4 hướng (N, S, E, W):** Trong bán kính quét $R\_{\\text{scan}} \= 8$ units.  
2. **Kiểm tra Anchor Node:** Nếu trong hướng đó đã có Anchor Node hoặc Sub-node cũ, giữ nguyên kết nối với Node đó.  
3. **Sinh Node mới (nếu chưa có):**  
   * Áp dụng Logic tính Node (Mục 3\) để tính ra $(X\_{\\text{new}}, Y\_{\\text{new}})$.  
   * Gán Seed ngẫu nhiên dựa trên tọa độ $(X\_{\\text{new}}, Y\_{\\text{new}})$ để đảm bảo tính nhất quán khi quay lại.  
   * Xác định Biome dựa theo khu vực chung trên hệ tọa độ.

## **4.3. Quy tắc làm sạch Node (Clean-up Rule)**

Để tránh bùng nổ dữ liệu (Node Sprawl), các Sub-node không có sự kiện quan trọng và không thuộc tuyến đường chính sẽ bị ẩn khỏi Constellation Map tổng, chỉ lưu vết trên bộ nhớ đệm vùng gần của người chơi.

# **5\. MÔ PHỎNG CẤU TRÚC GIAO DIỆN TEXT UI (CONSTELLATION VIEW)**

┌───────────────────────────────────────────────────────────────────────────┐

│ 📍 MAPS \> LÂN CẬN (CONSTELLATION VIEW)                        \[🗺️ Full Map\]│

├───────────────────────────────────────────────────────────────────────────┤

│                                                                           │

│                     ✦ Tên node                                 │

│                    /                                                      │

│                   /                                                       │

│                  /                                                        │

│  ✦ Tên node B   /                                                         │

│    \[58, 70\] ───● Node hiện tại của nhân vật \[63, 71\] ── ── ── ✦  Vùng Tối                 │

│                 │                                \[68, 72\]                 │

│                 │                                                         │

│                 \\                                                         │

│                  \\                                                        │

│                   ✦ Thành Oakhaven ✦ \[62, 67\]                             │

│                                                                           │

├───────────────────────────────────────────────────────────────────────────┤

│ 🧭 DỊCH CHUYỂN & DỰ BÁO                                                   │

│                                                                           │

│  \[1\] ⬆️ HƯỚNG BẮC  │ ✦ Map\_057 \[64, 73\]       │ 📏 2.2m │ 🌿 Đồng bằng    │

│  \[2\] ⬇️ HƯỚNG NAM  │ ✦ Thành Oakhaven \[62, 67\]│ 📏 4.1m │ 🏰 Thành chính  │

│  \[3\] ⬅️ HƯỚNG TÂY  │ ✦ Rừng U Uẩn \[58, 70\]    │ 📏 5.1m │ ⚠️ Quái Lv12    │

│  \[4\] ➡️ HƯỚNG ĐÔNG │ ✦ ❓ Vùng Tối \[68, 72\]    │ 📏 5.1m │ 🌫️ Chưa khám phá│

│                                                                           │

│ Lựa chọn hành động (1-4): \_                                               │

└───────────────────────────────────────────────────────────────────────────┘  
- Apply màu cho rule màu sắc node/ dot cho các node 
- Tạo logic tuyến đường đã qua, node đã đi qua chuyển màu đã khám phá│
- Nốt chưa khám phá có màu chưa khám phá│