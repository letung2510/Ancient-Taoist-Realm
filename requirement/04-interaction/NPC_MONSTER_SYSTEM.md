# HỆ THỐNG NPC & QUÁI VẬT (NPC / MONSTER INTERACTION SYSTEM)
> Tài liệu đặc tả — dùng chung với `character_generator.js`, `fate-pool.json`, `fate-relationships.json` đã có. File này KHÔNG kèm code, chỉ đặc tả để mày tự triển khai (hoặc báo tao code sau).

---

## 1. PHÂN LOẠI TỔNG QUÁT

| Loại | Có chiến đấu? | Có Quest? | Có Giao Dịch? | Ví dụ |
|---|---|---|---|---|
| **NPC Thường Dân** | Không | Hiếm (fetch quest nhỏ) | Có (bán vặt) | Nông dân, dân chài, lữ khách |
| **NPC Tông Môn** | Có (PvE hỗ trợ/thử luyện) | Có (chuỗi quest môn phái) | Có (đổi công đức) | Trưởng Lão, Sư Huynh, Chưởng Môn |
| **NPC Thương Nhân** | Không (trốn khi bị tấn công) | Hiếm | Chính (chợ, đấu giá) | Thương Hội, Hắc Thị |
| **NPC Nhiệm Vụ (Quest Giver)** | Không/Có tùy loại | Chính | Không | Trưởng Thôn, Sứ Giả Tông Môn |
| **Quái Thường (Trash Mob)** | Có | Không | Không (chỉ rớt đồ) | Yêu thú cấp thấp, Cương Thi |
| **Yêu Thú Tinh Anh (Elite)** | Có, mạnh hơn | Đôi khi (kill quest) | Không | Thủ lĩnh bầy, Yêu Thú trấn giữ Bí Cảnh |
| **Boss/Dị Quỷ (Cổ Thần Tàn Niệm)** | Có, cơ chế đặc biệt | Có (chuỗi quest dẫn tới) | Không | Trùm Cấm Địa, Hóa Thân Tà Thần |
| **NPC Ẩn/Sự Kiện** | Tùy | Có (Hidden Lore Quest) | Tùy | Lữ khách bí ẩn, "người" xuất hiện giữa Dị Biến |

> Ghi chú: **Quái** và **NPC** dùng chung 1 schema nền (`Entity Base Schema` ở mục 2), chỉ khác `entity_type` và các field mở rộng riêng.

### 1B. MỞ RỘNG PHÂN LOẠI — 6 LỚP MỚI

8 lớp gốc là khung sinh tồn cơ bản, chưa đủ chất "tiên hiệp kỳ ngộ + Cthulhu world-ending". Bổ sung 6 lớp sau, **tất cả vẫn kế thừa `Entity Base Schema`** (mục 2), chỉ thêm field riêng.

| Lớp mới | Có chiến đấu? | Có Quest? | Có Giao Dịch? | Đặc trưng cốt lõi |
|---|---|---|---|---|
| **Dị Sĩ (Eccentric Benefactor)** | Không (né combat) | Không (dùng "Thí Luyện" thay quest) | Không | Ban thưởng **stat/Mệnh Số ngẫu nhiên** — có thể là phúc HOẶC họa, khó lường |
| **Tà Thần (World-Tier Evil God)** | Có, world-boss multi-phase | Có (dẫn tới bằng chuỗi Hidden Lore) | Không | Chỉ xuất hiện từ **Hóa Thần Kỳ+**, ảnh hưởng **toàn server** khi thức tỉnh |
| **Ma Đầu / Nghịch Đồ (Rival Nemesis)** | Có, tăng theo người chơi | Có (chuỗi ân oán cá nhân) | Không | Đối thủ **bám theo xuyên suốt**, mạnh lên cùng tốc độ người chơi |
| **Hộ Pháp Thú (Guardian Beast)** | Có, nhưng có đường vòng | Không | Không | Canh cổng Bí Cảnh/Cấm Địa — vượt qua bằng đánh bại **HOẶC** trả giá **HOẶC** giải đố |
| **Nghịch Thương Nhân (Fate Black Market)** | Không | Không | Chính, nhưng **trả bằng Thọ Nguyên/SAN** thay tiền | Bán hàng tier 6-8, xuất hiện random cực hiếm |
| **Luân Hồi Sứ Giả (Reincarnation Envoy)** | Không | Có (quest đặc biệt 1 lần) | Không | Chỉ xuất hiện khi **Thọ Nguyên = 0**, dẫn dắt Luân Hồi Trọng Sinh |

---

#### 1B.1 Dị Sĩ (Eccentric Benefactor)

Người/thực thể kỳ quái đi lang thang thiên hạ, gặp là do "duyên phận" chứ không phải quest tuyến tính. Tương tác qua **Thí Luyện** (một minigame nhỏ: đối đáp/giải đố/mời rượu/tỷ thí giao hữu/dâng vật phẩm) thay vì hội thoại quest thường.

```
Entity_DiSi extends Entity {
  interaction_type: "riddle" | "gift_offering" | "friendly_duel" | "drink_challenge" | "pure_random"
  boon_pool_id: string          // trỏ tới bảng thưởng — CÓ THỂ ÂM (dị = khó lường, không phải luôn tốt)
  boon_roll: {
    good_outcome_pct: number,   // vd 70% ra buff/Mệnh Số tốt
    bad_outcome_pct: number,    // vd 20% ra debuff/Mệnh Hung Cách ngẫu nhiên
    neutral_outcome_pct: number // vd 10% không có gì, chỉ vài câu thoại lore
  }
  appearance_weight: number     // CỰC THẤP trong bảng spawn ngẫu nhiên toàn map
  disappear_after_interaction: true   // biến mất khỏi map với player đó sau 1 lần (không farm được)
}
```

**Luồng tương tác:**
```
[Player gặp Dị Sĩ] → [Chọn 1 trong các interaction_type khả dụng]
        │
        ▼
   [Roll boon_roll theo %]
        │
   ┌────┼────────────┐
   ▼    ▼             ▼
 Good  Bad           Neutral
   │    │              │
   ▼    ▼              ▼
+Stat/Mệnh Cát   +Mệnh Hung/    Vài câu thoại
 ngẫu nhiên       Debuff tạm     lore, không thưởng
                  thời
```
> Gợi ý cân bằng: outcome tốt nên roll trong **cùng bảng Mệnh Số 8 tier đã có** (`fate-pool.json`), không tạo bảng thưởng riêng — tái dùng `rollSingleFate()`.

---

#### 1B.2 Tà Thần (World-Tier Evil God) — 4 vị cao nhất

Đỉnh của kim tự tháp đe dọa thế giới. **Không thể gặp trước Hóa Thần Kỳ+** — hệ thống chặn cứng bằng `min_realm`. Đây là raid boss ảnh hưởng **toàn server**, không phải PvE cá nhân đơn thuần.

```
Entity_TaThan extends Entity {
  min_realm: "hoa_than"          // KHÓA CỨNG — dưới cảnh giới này không thể trigger encounter
  god_domain: "Điên Loạn" | "Hủy Diệt" | "Dục Vọng" | "Lãng Quên"
  phases: [
    { phase: 1, hp_threshold_pct: 100, mechanic: "..." },
    { phase: 2, hp_threshold_pct: 60,  mechanic: "..." },
    { phase: 3, hp_threshold_pct: 25,  mechanic: "SAN Check liên tục toàn bộ raid party" }
  ]
  world_event_on_awaken: string   // sự kiện server-wide khi Tà Thần "thức tỉnh" (không phải lúc nào cũng do player kích hoạt)
  world_event_on_defeat: string   // hệ quả toàn server nếu bị đánh bại (vd mở khóa vùng đất mới)
  world_event_on_fail: string     // hệu quả toàn server nếu raid thất bại (vd 1 vùng bị "Dị Biến hóa" vĩnh viễn)
  server_wide: true
}
```

**4 vị Tà Thần gợi ý (đặt tên + domain, mày có thể đổi tên):**

| Tên | Domain | Ảnh hưởng đặc trưng khi thức tỉnh |
|---|---|---|
| **Vô Diện Cuồng Vương** | Điên Loạn | SAN toàn server giảm dần theo thời gian cho tới khi bị trấn áp |
| **Thực Cảnh Đại Đế** | Hủy Diệt | 1 vùng bản đồ ngẫu nhiên chuyển thành Cấm Địa Cấp 5 vĩnh viễn nếu không ngăn kịp |
| **Huyễn Sắc Cổ Thần** | Dục Vọng | NPC/Player dễ bị "mê hoặc" — tăng tỷ lệ Quest Tà Thần cưỡng chế toàn server |
| **Vong Danh Chi Chủ** | Lãng Quên | Người chơi ngẫu nhiên bị xóa 1 phần Mệnh Kho nếu không có ai trấn áp trong X ngày |

**Luồng gặp Tà Thần (khác hẳn combat thường):**
```
[Server: 1 Tà Thần bắt đầu "thức tỉnh" — world_event broadcast toàn server]
        │
        ▼
[Chuỗi Hidden Lore Quest mở ra — chỉ player Hóa Thần+ mới thấy/nhận được]
        │
        ▼
[Raid Party (nhiều player) tập hợp → tiếp cận địa điểm thức tỉnh]
        │
        ▼
[Trận đánh multi-phase — Phase cuối luôn có SAN Check liên tục toàn party]
        │
   ┌────┴────┐
   ▼         ▼
Thắng      Thua/Hết giờ
   │         │
   ▼         ▼
world_event_on_defeat   world_event_on_fail
(thưởng cực hiếm cho     (hậu quả tiêu cực server-wide,
 raid party, có thể      KHÔNG xóa sạch — chỉ đẩy lùi,
 rớt Mệnh Cầu Vồng)       Tà Thần "ngủ lại" chờ chu kỳ sau)
```

---

#### 1B.3 Ma Đầu / Nghịch Đồ (Rival Nemesis)

Đối thủ cá nhân bám theo xuyên suốt hành trình — không phải quái random, mà là 1 NPC có **tên, cốt truyện, và tăng trưởng đồng bộ** với người chơi.

```
Entity_MaDau extends Entity {
  nemesis_trigger_condition: string   // vd "player sở hữu Mệnh Hung Cách tier >= 5" hoặc "player giết NPC phe X"
  growth_scaling: true                // realm/level_tier của Ma Đầu tự động bám theo player (luôn nhỉnh hơn 1 chút)
  encounter_count: number             // số lần đã chạm trán (dùng để mở khóa thoại/lore mới mỗi lần gặp)
  encounter_type_by_count: {
    1: "cảnh cáo/khiêu khích, không đánh thật",
    2: "giao chiến nhỏ, 1 trong 2 bỏ chạy giữa chừng",
    "3+": "giao chiến toàn lực, có thể thắng/thua thật"
  }
  final_showdown_quest_id: string     // trigger khi player đạt 1 mốc realm nhất định (vd cùng đạt Kim Đan)
}
```
> Thiết kế này biến 1 con quái thành nhân vật có cảm xúc/đầu tư — nên viết thoại riêng cho mỗi lần `encounter_count` tăng thay vì lặp lại thoại cũ.

---

#### 1B.4 Hộ Pháp Thú (Guardian Beast)

Canh cổng vào Bí Cảnh/Cấm Địa — khác quái thường ở chỗ **có nhiều đường vượt qua**, không chỉ đánh cho chết.

```
Entity_HoPhap extends Entity {
  guard_location_id: string
  passage_conditions: [
    { method: "combat_defeat", requirement: "hạ HP về 0" },
    { method: "fate_toll", requirement: "nộp 1 Mệnh Số Cát Cách tier >= X" },
    { method: "riddle", requirement: "giải đúng câu đố cổ" },
    { method: "faction_token", requirement: "sở hữu tín vật của Tông Môn liên quan" }
  ]
  hostile_on_trespass: true   // chỉ tấn công nếu player cố xâm nhập KHÔNG qua điều kiện hợp lệ nào ở trên
}
```

---

#### 1B.5 Nghịch Thương Nhân (Fate Black Market)

Thương nhân bí ẩn, xuất hiện random cực hiếm (tương tự cơ chế `appearance_weight` của Dị Sĩ), bán hàng **tier 6-8** nhưng không nhận Linh Thạch — chỉ nhận Thọ Nguyên/SAN/hi sinh Mệnh Số khác.

```
Entity_NghichThuongNhan extends Entity {
  payment_type: ["lifespan_years", "san_points", "fate_sacrifice"]
  stock: [
    { fate_id: number, price: { type: "lifespan_years", amount: 50 } },
    { fate_id: number, price: { type: "san_points", amount: 30 } }
  ]
  stock_refresh_condition: "server_reset_weekly" | "random_reappear"
  warning_flag: true   // UI PHẢI cảnh báo rõ ràng trước khi player xác nhận giao dịch (tránh trade nhầm Thọ Nguyên)
}
```

---

#### 1B.6 Luân Hồi Sứ Giả (Reincarnation Envoy)

NPC đặc biệt chỉ xuất hiện đúng 1 lần khi `Thọ Nguyên = 0` — nối thẳng vào cơ chế **Luân Hồi Trọng Sinh** đã có trong spec gốc (mục V11.0 nguồn thu Mệnh Số kênh "4. Luân Hồi Trọng Sinh").

```
Entity_LuanHoi extends Entity {
  trigger_condition: "lifespan_current == 0"
  dialogue_flow: "rebirth_choice"
  retained_fate_tier_range: [5, 6]   // bảo lưu 1 Mệnh Số Tím/Kim kiếp trước, đúng bảng gốc
  rebirth_options: [
    { option: "Đầu thai giữ Mệnh mạnh nhất", effect: "reset stats, giữ 1 fate tier cao nhất đang sở hữu" },
    { option: "Đầu thai giữ ký ức (Ngộ Tính)", effect: "reset fate, +Ngộ Tính vĩnh viễn cho kiếp sau" }
  ]
}
```

---

## 2. SCHEMA DỮ LIỆU NỀN (ENTITY BASE SCHEMA)

Mọi thực thể (NPC lẫn Quái) đều kế thừa base này:

```
Entity {
  id: string
  entity_type: "npc" | "monster" | "boss"
  name: string
  race: string                      // dùng chung bảng chủng tộc đã có
  faction: string | null            // gắn với Tông Môn/Thế Gia nào (null nếu vô chủ)
  realm: string                     // dùng chung bảng Cảnh Giới (Phàm Nhân -> Hóa Thần+)
  level_tier: 1-8                   // dùng CHUNG thang 8 cấp Trắng->Cầu Vồng của Mệnh Số,
                                     // áp cho độ mạnh NPC/Quái để đồng bộ độ khó với hệ thống hiện có
  stats: { PHY: number, MAG: number, HP: number, SAN_influence: number }
                                     // SAN_influence: mức trừ SAN của người chơi khi giao chiến/tiếp xúc thực thể này (0 với NPC thường)
  dialogue_id: string | null        // trỏ tới bộ hội thoại (mục 4)
  quest_ids: string[]               // danh sách quest thực thể này có thể giao
  loot_table_id: string | null      // trỏ tới bảng rớt đồ (mục 5.3)
  location_tags: string[]           // vùng xuất hiện, dùng chung tag vùng đã định nghĩa trước đó
  is_hostile_by_default: boolean
  respawn_seconds: number | null    // null = unique/không hồi sinh (boss cốt truyện)
}
```

---

## 3. LUỒNG NPC GIAO QUEST (QUEST DIALOGUE FLOW)

### 3.1 Trạng thái hội thoại (Dialogue State Machine)

```
[Player tiếp cận NPC]
        │
        ▼
  ┌─────────────┐
  │ IDLE_GREET   │  <- NPC chào hỏi mặc định, hiện icon quest phía trên đầu nếu có
  └─────┬────────┘
        │ player chọn "Nói chuyện"
        ▼
  ┌───────────────────────┐
  │ CHECK_QUEST_STATE      │
  └───────────────────────┘
        │
   ┌────┼─────────────┬─────────────────┐
   ▼    ▼              ▼                 ▼
 Chưa   Đang làm      Đã hoàn thành     Không có quest
 nhận   (chưa đủ ĐK)   (đủ điều kiện)    liên quan
   │      │              │                 │
   ▼      ▼              ▼                 ▼
[QUEST_OFFER]  [QUEST_PROGRESS_HINT]  [QUEST_TURN_IN]  [GENERIC_CHAT]
   │              │                     │                 │
   ▼              ▼                     ▼                 ▼
Player chọn:   Hiện gợi ý tiến độ    Trả thưởng +       Hội thoại
 - Nhận         (vd "còn thiếu       cập nhật quest      phiếm/lore/
 - Từ chối      3 Yêu Đan")          log = DONE          bán đồ (nếu
 - Hỏi thêm lore                                          NPC có shop)
```

### 3.2 Icon/trạng thái hiển thị trên đầu NPC (chuẩn hóa để dễ code UI)
| Icon | Điều kiện |
|---|---|
| `!` vàng | Có quest mới có thể nhận |
| `?` vàng | Có quest đã đủ điều kiện hoàn thành, chưa trả |
| `!` xám | Có quest nhưng chưa đủ điều kiện nhận (level/faction rep chưa đủ) |
| `?` xám | Đang làm quest của NPC này, chưa đủ điều kiện trả |
| Không icon | Không có quest liên quan hiện tại |

### 3.3 Cấu trúc dữ liệu Quest

```
Quest {
  id: string
  giver_npc_id: string
  type: "Normal" | "Eldritch" | "Cursed" | "Hidden_Lore" | "Faction_Chain"
  title: string
  description: string
  requirements: {
    min_realm: string | null,
    faction_reputation: number | null,
    prerequisite_quest_ids: string[]
  }
  objectives: [
    { type: "kill" | "collect" | "escort" | "explore" | "answer_riddle" | "sacrifice_lifespan",
      target: string, count: number }
  ]
  rewards: {
    exp: number,
    fate_points: number,             // theo hệ Mệnh Số đã có
    fate_drop_pool_id: string | null, // nếu quest có thể rớt thẳng 1 Mệnh Số cụ thể
    linh_thach: number,
    faction_reputation: number,
    items: string[]
  }
  fail_conditions: {
    san_check: boolean,               // Eldritch Quest luôn true — check SAN theo mục III.1 spec gốc
    time_limit_seconds: number | null,
    penalty_on_fail: string           // vd "Phạt x2 Debuff, trừ Thọ Nguyên" (đồng bộ bảng Fate Ratio R)
  }
  priority: 0 | 1 | 2                 // ĐỒNG BỘ với Event Priority System đã có trong spec gốc:
                                       // 0 = Eldritch/Backfire (cưỡng chế), 1 = Normal, 2 = Low (AFK-tier)
}
```

> **Quan trọng:** `Eldritch Quest` và `Cursed Quest` do NPC giao **không tuân theo luồng chọn tự nguyện** ở mục 3.1 — chúng bị **cưỡng chế kích hoạt** khi `STATE_ELDRITCH_INTERVENTION` hoặc `STATE_FATE_BACKFIRE` trả về từ hệ thống Fate Ratio R (đã build ở `character_generator.js`). Khi đó luồng là:

```
[Server detect STATE_ELDRITCH_INTERVENTION hoặc STATE_FATE_BACKFIRE]
        │
        ▼
[Ngắt AFK / Luyện Đan / Quest Tông Môn đang chạy — Priority 0 chiếm quyền]
        │
        ▼
[Một "NPC Tà Thần" (không cần đứng gần) tự động hiện popup giao Quest]
        │
        ▼
[Player BẮT BUỘC xử lý: hoàn thành Quest / Hiến Tế Thọ Nguyên để lật kèo / Fail và nhận phạt]
        │
        ▼
[R quay lại dải an toàn 0.2-5.0 -> trả quyền điều khiển bình thường]
```

---

## 4. LUỒNG HÀNH ĐỘNG QUÁI VẬT (MONSTER ACTION FLOW)

### 4.1 Vòng lặp AI cơ bản (mỗi tick chiến đấu)

```
[Combat Start / Player vào vùng Aggro Range]
        │
        ▼
  ┌───────────────┐
  │ STATE: IDLE     │ ── phát hiện player trong aggro_range? ──▶ chuyển AGGRO
  └───────────────┘
        │ không phát hiện
        ▼ (patrol/loop tại chỗ)
      IDLE tiếp tục

  ┌───────────────┐
  │ STATE: AGGRO    │
  └───────┬─────────┘
          ▼
  ┌─────────────────────────┐
  │ CHECK: HP% hiện tại       │
  └─────────────────────────┘
     │            │            │
   HP>50%       HP 20-50%    HP<20%
     │            │            │
     ▼            ▼            ▼
 [NORMAL_ATK]  [SKILL_PHASE]  [ENRAGE / DESPERATE]
     │            │            │
     └─────┬──────┴──────┬─────┘
           ▼              ▼
     [Player chạy khỏi   [Player hạ gục quái]
      aggro_range đủ lâu]        │
           │                     ▼
           ▼                [STATE: DEAD]
     [STATE: RESET/IDLE]         │
     (hồi máu, quay về vị trí)   ▼
                            [Trigger loot_table_id]
                            [Trigger respawn_seconds nếu có]
```

### 4.2 Bảng hành động theo % HP (Action Priority Table — áp dụng chung, tùy chỉnh số liệu theo từng quái)

| Ngưỡng HP | Hành vi | Tần suất | Ghi chú |
|---|---|---|---|
| 100-50% | `NORMAL_ATK` (đòn thường) | Mỗi lượt | Sát thương chuẩn theo PHY/MAG |
| 50-20% | `SKILL_PHASE` — dùng 1 kỹ năng đặc trưng | 30-50% mỗi lượt | Loại quái Dị Biến có thể kèm `SAN_DRAIN` phụ |
| <20% | `ENRAGE` — buff sát thương bản thân, có thể triệu hồi thêm quái nhỏ (chỉ Elite/Boss) | Kích hoạt 1 lần | Boss: mở thêm cơ chế né/phase 2 |
| Bị khống chế (CC) | `STUNNED/FROZEN` — bỏ lượt | — | Không áp dụng với Boss miễn nhiễm CC |
| Aggro mất mục tiêu > X giây | `RESET` — hồi máu, quay vị trí gốc | — | X tùy độ khó vùng |

### 4.3 Quái thuộc "Dị Biến" (Eldritch Monster) — cơ chế riêng
Theo đúng tinh thần world Cổ Dị Diện (mục III spec gốc), quái Dị Biến có thêm:
- **SAN Check khi giao chiến:** mỗi đòn trúng của quái có % kèm `Roll_SAN < SAN_Stat` → fail thì trừ SAN trực tiếp + gán debuff "Ảo Giác" (giảm chính xác/gây lag hình ảnh UI).
- **Không thể diệt bằng sát thương thường ở % HP cuối** với Dị Quỷ cấp cao — cần cơ chế "Trấn Áp bằng Mệnh Số Cát Cách" (gợi ý: player phải sở hữu tổng Mệnh Số Cát Cách ≥ ngưỡng mới gây được sát thương thật ở phase cuối) — tùy chỉnh theo ý đồ game.

### 4.4 Loot Table (rớt đồ) — tích hợp thẳng hệ thống Mệnh Số đã có

```
LootTable {
  id: string
  entries: [
    { type: "linh_thach", amount_range: [min, max], weight: number },
    { type: "item", item_id: string, weight: number },
    { type: "fate", fate_tier_range: [min_tier, max_tier], weight: number }
      // dùng ĐÚNG bảng 8 tier Trắng->Cầu Vồng trong fate-pool.json
      // quái thường: chỉ roll tier 1-3 (Trắng/Lục/Lam)
      // Elite: tier 1-5
      // Boss/Dị Quỷ: tier 4-8 (có xác suất nhỏ ra Cầu Vồng)
  ]
}
```
→ Cơ chế roll dùng lại thẳng hàm `rollSingleFate(tierCap)` đã có trong `character_generator.js` — chỉ cần đổi input `tierCap` theo cấp độ quái.

---

## 5. LUỒNG TƯƠNG TÁC TỔNG QUÁT NGƯỜI CHƠI ↔ NPC/QUÁI

### 5.1 Ma trận tương tác theo loại thực thể

| Hành động Player | NPC Thường | NPC Tông Môn | Thương Nhân | Quái Thường | Elite/Boss |
|---|---|---|---|---|---|
| Nói chuyện | ✅ (mục 3) | ✅ (mục 3) | ✅ (chào hàng) | ❌ | ❌ (gầm gừ/cutscene) |
| Nhận Quest | ✅ (hiếm) | ✅ (chính) | ❌ | ❌ | ✅ (thường qua NPC khác dẫn tới) |
| Giao dịch | ✅ (vặt) | ✅ (đổi công đức) | ✅ (chính) | ❌ | ❌ |
| Tấn công | ❌ (trung lập, tấn công = mất Danh Vọng/bị lính bắt) | ⚠️ (PK, tùy server rule) | ❌ (NPC bỏ chạy + gọi bảo vệ) | ✅ | ✅ |
| Bị tấn công | Có thể (cướp/sự kiện) | Có thể | Có thể (cướp) | ✅ (aggro) | ✅ |
| Kích hoạt Cutscene/Lore | Đôi khi | Thường xuyên | Hiếm | ❌ | ✅ (trước/giữa/sau trận) |

### 5.2 Luồng tổng quát khi Player tương tác với 1 Entity bất kỳ

```
[Player click/tiếp cận Entity]
        │
        ▼
  entity_type == "npc"?
   ├── Yes ──▶ is_hostile_by_default == true?
   │             ├── Yes (NPC phản diện) ──▶ Vào COMBAT_FLOW (mục 4, dùng schema NPC làm "quái")
   │             └── No ──▶ Vào DIALOGUE_FLOW (mục 3)
   │
   └── No (entity_type == "monster"/"boss") 
                 ──▶ is_hostile_by_default == true (mặc định true)?
                        ├── Yes ──▶ Vào COMBAT_FLOW (mục 4) ngay khi vào aggro_range
                        └── No (quái thuần/không aggro, vd thú cưỡi hoang) ──▶ 
                              Player chọn "Thuần Hóa"/"Bỏ qua"/"Tấn công chủ động"
```

### 5.3 Hook tích hợp với hệ thống hiện có (BẮT BUỘC đồng bộ)

| Sự kiện tương tác | Kết nối với hệ thống nào đã có |
|---|---|
| Nhận Eldritch Quest từ NPC/Quái Dị Biến | `STATE_ELDRITCH_INTERVENTION` — Priority 0, cưỡng chế (đã có trong spec gốc) |
| Hoàn thành Quest → thưởng Mệnh Số | Roll từ `fate-pool.json`, cộng vào `Total_Fate_Score` → có thể đẩy `R` sang `STATE_FATE_BACKFIRE` nếu quá nhiều |
| Giết Quái rớt Mệnh Số trùng "gốc sao" với Mệnh đang sở hữu | Check `fate-relationships.json` (Tương Khắc) → cảnh báo player trước khi nhặt/dung hợp |
| NPC Tông Môn giao Quest theo chuỗi (Faction Chain) | Có thể set điều kiện `requirements.faction_reputation` dựa theo `Danh Vọng` của Faction (đã định nghĩa trong file thế giới tiên hiệp mở) |
| Boss rớt Mệnh Số Cầu Vồng | Cực hiếm (đúng trọng số 0.2% đã set trong `fate-pool.json`) — nên giới hạn thêm 1 lần/tuần/server để tránh lạm phát |

---

## 6. VÍ DỤ MẪU (THAM KHẢO NHANH)

### 6.1 NPC mẫu — Trưởng Lão Tông Môn
```
{
  "id": "npc_truong_lao_kiem_tong",
  "entity_type": "npc",
  "name": "Kiếm Trưởng Lão Vân Thanh",
  "race": "Nhân Tộc",
  "faction": "Thanh Vân Kiếm Tông",
  "realm": "Nguyên Anh Kỳ",
  "level_tier": 5,
  "is_hostile_by_default": false,
  "quest_ids": ["quest_thu_linh_thao_ngan_nien", "quest_dan_ap_yeu_thu_hau_son"],
  "dialogue_id": "dlg_vanthanh_default"
}
```

### 6.2 Quái mẫu — Yêu Thú Tinh Anh
```
{
  "id": "mob_hac_lang_vuong",
  "entity_type": "monster",
  "name": "Hắc Lang Vương",
  "race": "Yêu Tộc",
  "realm": "Trúc Cơ Kỳ",
  "level_tier": 3,
  "is_hostile_by_default": true,
  "stats": { "PHY": 85, "MAG": 20, "HP": 4200, "SAN_influence": 3 },
  "loot_table_id": "loot_hac_lang_vuong",
  "respawn_seconds": 3600
}
```
Loot table tương ứng: 60% Linh Thạch, 25% item da/nanh sói, **15% roll Mệnh Số tier 1-4**.

### 6.3 Boss mẫu — Dị Quỷ Cấm Địa
```
{
  "id": "boss_vong_nhan_chi_nhan",
  "entity_type": "boss",
  "name": "Vong Nhãn Chi Nhân",
  "race": "Ma Tộc",
  "realm": "Hóa Thần Kỳ+",
  "level_tier": 8,
  "is_hostile_by_default": true,
  "stats": { "PHY": 500, "MAG": 900, "HP": 50000, "SAN_influence": 25 },
  "loot_table_id": "loot_vong_nhan_chi_nhan",  // 5% roll Mệnh Số Cầu Vồng
  "quest_ids": ["quest_hidden_lore_vong_nhan"],
  "respawn_seconds": null
}
```

---

### 6.4 Dị Sĩ mẫu
```json
{
  "id": "disi_ruou_tien_nhan",
  "entity_type": "npc",
  "name": "Túy Tiên Nhân",
  "race": "Vô Danh (không xác định)",
  "faction": null,
  "level_tier": 0,
  "is_hostile_by_default": false,
  "interaction_type": "drink_challenge",
  "boon_pool_id": "boon_pool_default",
  "boon_roll": { "good_outcome_pct": 65, "bad_outcome_pct": 25, "neutral_outcome_pct": 10 },
  "appearance_weight": 0.05,
  "disappear_after_interaction": true
}
```

### 6.5 Tà Thần mẫu
```json
{
  "id": "tathan_vo_dien_cuong_vuong",
  "entity_type": "boss",
  "name": "Vô Diện Cuồng Vương",
  "race": "Cổ Thần",
  "min_realm": "hoa_than",
  "level_tier": 8,
  "god_domain": "Điên Loạn",
  "stats": { "PHY": 2000, "MAG": 5000, "HP": 500000, "SAN_influence": 60 },
  "phases": [
    { "phase": 1, "hp_threshold_pct": 100, "mechanic": "AOE SAN Drain diện rộng mỗi 30s" },
    { "phase": 2, "hp_threshold_pct": 60, "mechanic": "Triệu hồi Ảo Ảnh (bản sao yếu của raid members)" },
    { "phase": 3, "hp_threshold_pct": 25, "mechanic": "SAN Check liên tục toàn party, fail liên tiếp 3 lần = wipe" }
  ],
  "world_event_on_defeat": "Mở khóa vùng đất mới 'Tỉnh Thức Chi Nguyên', server nhận buff EXP 7 ngày",
  "world_event_on_fail": "1 vùng ngẫu nhiên nâng cấp Cấp Độ Ô Nhiễm Linh Khí +1 vĩnh viễn",
  "server_wide": true,
  "respawn_seconds": null
}
```

### 6.6 Ma Đầu mẫu
```json
{
  "id": "madau_huyet_sat_lang_nhan",
  "entity_type": "npc",
  "name": "Huyết Sát Lãng Nhân",
  "race": "Nhân Tộc",
  "is_hostile_by_default": false,
  "nemesis_trigger_condition": "player sở hữu mệnh 'Thất Sát Suy Bại' hoặc tương đương Hung Cách tier>=3",
  "growth_scaling": true,
  "encounter_count": 0,
  "final_showdown_quest_id": "quest_huyet_sat_final"
}
```

### 6.7 Hộ Pháp Thú mẫu
```json
{
  "id": "hophap_thanh_van_bi_canh",
  "entity_type": "monster",
  "name": "Bích Nhãn Thanh Sư",
  "race": "Yêu Tộc",
  "realm": "Kim Đan Kỳ",
  "level_tier": 4,
  "guard_location_id": "bicanh_thanh_van_tong",
  "passage_conditions": [
    { "method": "combat_defeat", "requirement": "hạ HP về 0" },
    { "method": "fate_toll", "requirement": "nộp 1 Mệnh Cát Cách tier>=4" },
    { "method": "faction_token", "requirement": "sở hữu tín vật Thanh Vân Kiếm Tông" }
  ],
  "hostile_on_trespass": true
}
```

### 6.8 Nghịch Thương Nhân mẫu
```json
{
  "id": "nghichthuong_vo_danh_khach",
  "entity_type": "npc",
  "name": "Vô Danh Khách Thương",
  "race": "Ma Thần Hậu Duệ",
  "is_hostile_by_default": false,
  "payment_type": ["lifespan_years", "san_points", "fate_sacrifice"],
  "stock_refresh_condition": "random_reappear",
  "warning_flag": true,
  "appearance_weight": 0.03
}
```

### 6.9 Luân Hồi Sứ Giả mẫu
```json
{
  "id": "luanhoi_su_gia",
  "entity_type": "npc",
  "name": "Bỉ Ngạn Dẫn Lộ Nhân",
  "race": "Không xác định",
  "is_hostile_by_default": false,
  "trigger_condition": "lifespan_current == 0",
  "dialogue_flow": "rebirth_choice",
  "retained_fate_tier_range": [5, 6]
}
```

---

## 7. GỢI Ý TRIỂN KHAI TIẾP THEO (chưa code, đang chờ xác nhận)

1. Sinh bộ **data mẫu NPC/Quái ngẫu nhiên** (giống cách đã làm với `fate-pool.json`) theo vùng/faction đã có trong file thế giới mở — nay gồm cả 14 lớp (8 gốc + 6 mới) — nếu cần, báo tao viết `npc_monster_generator.js`.
2. Nối **loot table** vào thẳng `rollSingleFate()` trong `character_generator.js` để dùng lại code, không viết trùng.
3. Viết **Quest Log system** (theo dõi tiến độ nhiều quest cùng lúc, ưu tiên hiển thị Eldritch Quest lên đầu do Priority 0).
4. Cân nhắc thêm **bảng hội thoại (dialogue tree)** chi tiết nếu muốn NPC có nhánh chọn thoại (không chỉ quest offer/turn-in đơn giản).
5. **Chốt tên chính thức cho 4 Tà Thần** (mục 1B.2) — tên hiện tại chỉ là gợi ý, đổi tùy ý mà không ảnh hưởng cấu trúc field.
6. Cân nhắc giới hạn tần suất world event của Tà Thần (vd 1 lần "thức tỉnh"/tháng/server) để tránh nội dung end-game bị lạm phát hoặc quá tải raid.
