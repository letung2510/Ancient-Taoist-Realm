# Ancient Taoist Realm — Game Log / Narrative Log System

## 1. Mục tiêu

Hệ thống Log phải phục vụ đồng thời 4 việc:

```text
GAME ENGINE
    │
    ├── Tính toán kết quả
    │
    ├── Thay đổi State
    │
    └── Tạo Event
          │
          ▼
    LOG ENGINE
          │
          ├── Narrative Generator
          ├── Result Formatter
          ├── Stat Formatter
          └── Importance / Rarity
          │
          ▼
       GAME LOG
          │
          ├── Người chơi đọc
          ├── History
          └── Debug
```

**Nguyên tắc quan trọng nhất:**

> **Không để narrative quyết định gameplay. Gameplay quyết định narrative.**

Ví dụ:

```text
cultivation_gain = 75
mastery_gain = 24
event = NORMAL_CULTIVATION
```

Sau đó mới sinh:

> Ngươi tĩnh tọa nhập định, chậm rãi vận chuyển công pháp. Linh khí quanh thân theo kinh mạch lưu chuyển, từng chút bồi đắp tu vi.

---

## 2. Phân biệt 3 loại Log

Nên dùng **3 layer** thay vì chỉ 2.

### Layer 1 — System Log

Dành cho debug/dev.

```text
[ACTION]
cultivate

[RESULT]
cultivation +75
technique_mastery +24
constitution 51

[EVENT]
NORMAL_CULTIVATION
```

Người chơi bình thường **không cần nhìn thấy**.

### Layer 2 — Game Log

Đây là log chính trong UI.

> § Ngươi vận công nhập định. Linh khí chậm rãi lưu chuyển qua kinh mạch, tu vi theo đó dần tăng tiến.
>
> **✦ Tu vi +75 · ✧ Công pháp +24**

### Layer 3 — Narrative Log

Dành cho những event quan trọng.

> § Trong lúc vận công, ngươi chợt cảm nhận một tia huyền diệu ẩn sâu trong khẩu quyết.
>
> Khoảnh khắc ấy chỉ kéo dài trong vài nhịp thở, nhưng đủ để khiến ngươi hiểu thêm về con đường tu hành trước mắt.
>
> **✧ Ngộ đạo!**
>
> Công pháp **Thanh Vân Quyết** thông thạo +86.

Layer này chỉ xuất hiện khi event đáng kể.

---

## 3. Cấu trúc một Log Event

Mỗi hành động nên tạo một object tương tự:

```json
{
  "id": "evt_0001842",
  "type": "CULTIVATION",
  "subtype": "NORMAL",

  "timestamp": {
    "year": 1,
    "month": 2,
    "day": 2
  },

  "action": {
    "id": "cultivate",
    "name": "Tu luyện"
  },

  "context": {
    "location": "Thanh Vân Sơn",
    "technique": "Thanh Vân Quyết",
    "realm": "Luyện Khí tầng 3"
  },

  "result": {
    "cultivation": 75,
    "mastery": 24
  },

  "changes": [
    {
      "stat": "cultivation",
      "delta": 75
    },
    {
      "stat": "technique_mastery",
      "delta": 24
    }
  ],

  "event_flags": [],

  "importance": "normal",

  "narrative": {
    "template": "cultivation.normal.03"
  }
}
```

Điểm quan trọng:

**Narrative chỉ tham chiếu event.**

Không lưu kiểu:

```json
"message": "Ngươi vận công tu luyện..."
```

ngay trong logic gameplay.

---

## 4. Event Type

Đây sẽ là xương sống của hệ thống.

```text
ACTION
├── CULTIVATION
├── REST
├── EXPLORE
├── TRAVEL
├── GATHER
├── HUNT
├── MEDITATE
├── BREAKTHROUGH
├── COMBAT
├── ESCAPE
├── TALK
├── TRADE
├── QUEST
├── NPC
├── DISCOVERY
├── LOOT
├── INJURY
├── DEATH
├── WEATHER
├── WORLD_EVENT
├── SECT
├── FAMILY
├── TREASURE
├── AUCTION
├── HEAVENLY_TRIBULATION
└── SYSTEM
```

---

## 5. Sub-event

Ví dụ `CULTIVATION` không chỉ có NORMAL.

```text
CULTIVATION
│
├── NORMAL
├── GOOD
├── POOR
├── CRITICAL
├── INSIGHT
├── MINOR_BREAKTHROUGH
├── BREAKTHROUGH
├── GREAT_BREAKTHROUGH
├── QI_DEVIATION
├── DISTURBED
└── INTERRUPTED
```

Như vậy game có thể tạo narrative khác nhau.

---

## 6. Rarity / Importance

Không phải log nào cũng cần nổi bật.

Đề xuất:

```text
TRACE
NORMAL
IMPORTANT
RARE
EPIC
LEGENDARY
MYTHIC
```

### TRACE

Không cần narrative dài.

```text
Tu vi +3
```

### NORMAL

```text
§ Ngươi vận công một vòng đại chu thiên.

Tu vi +75 · Công pháp +24
```

### IMPORTANT

```text
§ Một vòng đại chu thiên hoàn tất.

Linh khí trong đan điền dần trở nên tinh thuần hơn.
Ngươi cảm nhận khoảng cách tới bình cảnh đã gần thêm một bước.

✦ Tu vi +126
✧ Công pháp +38
```

### RARE

```text
§ Trong lúc vận công, linh khí quanh thân đột nhiên hội tụ.

Một tia cảm ngộ bất chợt lóe lên trong tâm trí.

✧ Ngộ đạo!

Thanh Vân Quyết thông thạo +86
```

### LEGENDARY

```text
§ Thiên địa bỗng nhiên im lặng.

Linh khí quanh ngươi ngưng tụ thành vòng xoáy,
khiến toàn bộ Thanh Vân Sơn rung chuyển.

Một đạo huyền quang từ hư không giáng xuống.

【Thiên Đạo Cảm Ứng】

Ngươi đã chạm tới một tia quy tắc của thiên địa.
```

---

## 7. Narrative Template System

Đây là phần quan trọng nhất.

Thay vì hard-code:

```javascript
if (action === "cultivate") {
    log("Ngươi vận công tu luyện...");
}
```

hãy dùng template.

Ví dụ:

```text
narratives/
├── cultivation/
│   ├── normal.json
│   ├── good.json
│   ├── poor.json
│   ├── insight.json
│   ├── breakthrough.json
│   └── deviation.json
│
├── combat/
│   ├── attack.json
│   ├── defend.json
│   ├── victory.json
│   ├── defeat.json
│   └── escape.json
│
├── exploration/
├── travel/
├── npc/
├── treasure/
├── sect/
└── world/
```

Ví dụ:

```json
{
  "id": "cultivation.normal",
  "templates": [
    "Ngươi khoanh chân nhập định, chậm rãi vận chuyển công pháp.",
    "Ngươi tĩnh tâm vận công, dẫn linh khí tuần hoàn qua kinh mạch.",
    "Ngươi thu liễm tâm thần, bắt đầu một vòng đại chu thiên.",
    "Ngươi ngồi xuống nhập định, từng tia linh khí dần hội tụ quanh thân."
  ]
}
```

Engine random một câu.

---

## 8. Context Injection

Template không nên chỉ là câu cố định.

Ví dụ:

```text
Ngươi vận chuyển {technique},
dẫn {qi_quality} linh khí xuyên qua {location}.
```

Engine có:

```json
{
  "technique": "Thanh Vân Quyết",
  "qi_quality": "tinh thuần",
  "location": "Thanh Vân Sơn"
}
```

Kết quả:

> Ngươi vận chuyển **Thanh Vân Quyết**, dẫn **tinh thuần linh khí** xuyên qua **Thanh Vân Sơn**.

---

## 9. Narrative Context

Narrative generator có thể nhận:

```json
{
  "player": {
    "name": "Lê Tùng",
    "realm": "Luyện Khí tầng 3",
    "origin": "Tán Tu",
    "constitution": 51
  },

  "world": {
    "era": "Kỷ Nguyên Linh Khí Dị Biến",
    "year": 1,
    "month": 2,
    "day": 2
  },

  "location": {
    "name": "Thanh Vân Sơn",
    "qi_density": "high",
    "danger": "low"
  },

  "action": {
    "type": "CULTIVATION"
  },

  "result": {
    "cultivation": 75,
    "mastery": 24
  }
}
```

Narrative sẽ dựa vào context này.

---

## 10. Không phải lúc nào cũng viết Narrative

Đây là lỗi nhiều game text mắc phải.

Nếu người chơi spam:

```text
Tu luyện
Tu luyện
Tu luyện
Tu luyện
Tu luyện
Tu luyện
```

thì không thể mỗi lần đều:

> Ngươi khoanh chân nhập định...

Sẽ rất nhanh chán.

Nên có **Narrative Frequency**.

```text
NORMAL ACTION
    ↓
70% → compact log
20% → short narrative
8%  → extended narrative
2%  → special event
```

Ví dụ:

### Compact

> § Tu luyện hoàn tất · **Tu vi +75 · Công pháp +24**

### Short

> § Ngươi vận công nhập định. Linh khí thuận theo kinh mạch lưu chuyển.
>
> **Tu vi +75 · Công pháp +24**

### Extended

> § Ngươi khoanh chân dưới tán cổ thụ, chậm rãi vận chuyển Thanh Vân Quyết.
>
> Linh khí quanh thân dần hội tụ, theo từng vòng đại chu thiên mà chìm xuống đan điền.
>
> **Tu vi +75 · Công pháp +24**

---

## 11. Stat Display System

Không nên viết:

```text
Tu vi +75 · tổng Thông Thạo Công pháp +24 (căn cốt 51/100)
```

Tách ra.

```text
✦ Tu vi +75
✧ Công pháp +24
```

Nếu có thay đổi quan trọng:

```text
✦ Tu vi +75
✧ Thanh Vân Quyết +24

Căn cốt: 50 → 51
```

Nếu không quan trọng thì **đừng show stat không thay đổi**.

---

## 12. Stat Delta Rules

Mỗi stat có rule.

```text
cultivation
→ luôn show khi > 0

health
→ show khi thay đổi đáng kể

qi
→ chỉ show khi action liên quan

mastery
→ show nếu gain >= threshold

gold
→ show khi transaction

reputation
→ show khi thay đổi

hidden_stat
→ không show trực tiếp
```

Ví dụ:

```text
Căn cốt +1
```

không nhất thiết phải show mỗi lần.

Nhưng:

```text
Căn cốt 99 → 100
```

thì phải tạo:

```text
✧ Căn cốt đã đạt cực hạn!

【Căn Cốt Viên Mãn】
```

---

## 13. Milestone Detection

Đây là thứ giúp log có cảm giác **game thật**.

Engine luôn kiểm tra:

```text
before
   ↓
action
   ↓
after
   ↓
milestone detector
```

Ví dụ:

```text
Mastery:
49 → 50
```

→

> ✧ Ngươi đã hiểu thêm một tầng huyền diệu của công pháp.

```text
Cultivation:
999 → 1000
```

→

> ✦ Tu vi đã đạt viên mãn!

```text
Realm:
Luyện Khí tầng 9
→ Trúc Cơ
```

→

> ═══════════════════
>
> **ĐẠI CẢNH GIỚI ĐỘT PHÁ**
>
> Linh khí cuồn cuộn tràn vào đan điền.
>
> Bình cảnh đã bị phá vỡ.
>
> **Luyện Khí → Trúc Cơ**
>
> ═══════════════════

---

## 14. Combat Log

Combat không nên dùng cùng format cultivation.

Ví dụ:

```text
⚔ Giao chiến

§ Hắc Lân Lang gầm lên, lao thẳng về phía ngươi.

Ngươi nghiêng người tránh móng vuốt, đồng thời vận chuyển linh lực tung ra một chưởng.

【Thanh Vân Chưởng】
Hắc Lân Lang -126 HP

Hắc Lân Lang phản kích.
Ngươi -43 HP
```

---

## 15. Combat Compression

Combat nhiều lượt sẽ cực kỳ spam.

Không nên:

```text
Turn 1
Turn 2
Turn 3
Turn 4
Turn 5
...
```

Mà có thể gom:

```text
⚔ Sau 5 lượt giao chiến

Ngươi liên tục áp chế Hắc Lân Lang.

→ Gây 426 sát thương
→ Nhận 183 sát thương
→ Hắc Lân Lang trọng thương
```

Chỉ mở detail khi người chơi click.

---

## 16. Exploration Log

Ví dụ:

> § Ngươi tiến sâu vào rừng.
>
> Những cây cổ thụ che khuất ánh mặt trời. Không khí nơi đây lạnh hơn hẳn bên ngoài.
>
> **Đã phát hiện: Huyết Linh Thảo**

Nếu discovery hiếm:

> § Một tia linh quang lóe lên dưới lớp lá mục.
>
> Ngươi cúi xuống.
>
> **【Thiên Niên Huyết Linh Chi】**
>
> Một linh dược hiếm có, e rằng đã sinh trưởng ở đây hơn nghìn năm.

---

## 17. NPC Log

NPC không nên chỉ:

```text
NPC: +10 friendship
```

Mà:

> § Lão giả nhìn ngươi hồi lâu rồi khẽ gật đầu.
>
> “Không tệ. Ngươi cuối cùng cũng hiểu được đạo lý này.”
>
> **Hảo cảm với Mặc Vân chân nhân +10**

Nhưng system vẫn lưu:

```json
{
  "npc_id": "mo_yun",
  "relationship_delta": 10
}
```

---

## 18. World Event

Đây là chỗ game có thể trở nên rất hay.

Ví dụ:

> **[Thiên Địa Dị Biến]**
>
> § Bầu trời phía Tây đột nhiên xuất hiện một vệt huyết quang.
>
> Các tu sĩ trong bán kính hàng trăm dặm đều cảm nhận được linh khí dao động bất thường.
>
> **Một đại sự kiện đã xảy ra.**

Sau đó world state thay đổi:

```text
world_event:
    BLOOD_MOON_APPEARS

effects:
    monster_spawn +30%
    qi_density +20%
    rare_treasure +10%
    npc_behavior = altered
```

---

## 19. Hidden Event

Không nên nói rõ tất cả.

Ví dụ:

```text
§ Ngươi cảm thấy có thứ gì đó đang nhìn mình từ trong bóng tối.
```

Không:

```text
Hidden NPC detected.
NPC ID = ghost_001.
```

Player phải tự khám phá.

---

## 20. Log Severity

Đề xuất thêm severity:

```text
INFO
SUCCESS
WARNING
DANGER
CRITICAL
DISCOVERY
ACHIEVEMENT
DEATH
```

Ví dụ:

```text
INFO
§ Ngươi bắt đầu tu luyện.

SUCCESS
✦ Tu luyện hoàn tất.

WARNING
⚠ Linh khí trong cơ thể bắt đầu hỗn loạn.

DANGER
⚠ Ngươi đã tiến vào khu vực nguy hiểm.

CRITICAL
☠ Kinh mạch bị tổn thương nghiêm trọng.

DISCOVERY
◆ Phát hiện bí cảnh.

ACHIEVEMENT
★ Thành tựu đạt được.
```

---

## 21. Time Header

Header hiện tại:

> `[Năm 1, Tháng 2 ngày 2 · Kỷ Nguyên Linh Khí Dị Biến]`

Có thể giữ nguyên hoặc làm:

```text
━━ Năm 1 · Tháng 2 · Ngày 2 ━━
Kỷ Nguyên Linh Khí Dị Biến
```

Hoặc compact:

```text
[Năm 1 · Tháng 2 · Ngày 2]
Kỷ Nguyên Linh Khí Dị Biến
```

**Không cần lặp timestamp cho từng log nếu cùng ngày.**

---

## 22. Log Grouping

Ví dụ người chơi thực hiện:

```text
Tu luyện
Tu luyện
Tu luyện
Tu luyện
```

UI có thể gom:

```text
[Năm 1 · Tháng 2 · Ngày 2]

§ Ngươi liên tục vận công tu luyện.

4 lần tu luyện hoàn tất.

✦ Tu vi +312
✧ Công pháp +94
```

Nhưng nếu trong 4 lần có:

```text
INSIGHT
```

thì tách riêng:

```text
§ Ngươi liên tục vận công...

✦ Tu vi +312
✧ Công pháp +94

────────────────────

◆ Một tia cảm ngộ bất chợt xuất hiện.

【Thanh Vân Quyết】
Thông thạo +86
```

---

## 23. Action → Event → Log

Flow đề xuất:

```text
Player clicks "Tu luyện"
             │
             ▼
       Action Engine
             │
             ▼
       Calculate Result
             │
             ▼
       Update Game State
             │
             ▼
       Event Detector
             │
       ┌─────┴─────┐
       │           │
    NORMAL      SPECIAL
       │           │
       └─────┬─────┘
             ▼
       Narrative Engine
             │
             ▼
       Result Formatter
             │
             ▼
          Game Log
             │
             ▼
             UI
```

---

## 24. Data Model

Đề xuất chuẩn hóa event:

```javascript
GameEvent = {
    id,
    timestamp,
    type,
    subtype,
    importance,
    severity,

    actor,
    target,
    location,

    action,

    context,

    changes,

    rewards,

    flags,

    narrative,

    metadata
}
```

Ví dụ:

```javascript
{
    id: "evt_01842",

    type: "CULTIVATION",
    subtype: "INSIGHT",

    importance: "RARE",
    severity: "DISCOVERY",

    actor: "player",

    location: "qingyun_mountain",

    action: {
        id: "cultivate"
    },

    changes: [
        {
            stat: "cultivation",
            delta: 75
        },
        {
            stat: "technique_mastery",
            target: "qingyun_jue",
            delta: 86
        }
    ],

    flags: [
        "INSIGHT"
    ],

    narrative: {
        template: "cultivation.insight.04"
    }
}
```

---

## 25. Template Selection Algorithm

Có thể dùng:

```text
event
 ↓
type
 ↓
subtype
 ↓
importance
 ↓
context
 ↓
template pool
 ↓
anti-repeat filter
 ↓
random selection
 ↓
render
```

Ví dụ:

```text
CULTIVATION
+
INSIGHT
+
RARE
+
NIGHT
+
HIGH_QI
```

có thể chọn:

```text
cultivation.insight.night.high_qi.01
cultivation.insight.night.high_qi.02
cultivation.insight.night.high_qi.03
```

---

## 26. Anti-Repetition

Cực kỳ quan trọng.

Nếu vừa hiện:

> Ngươi khoanh chân nhập định...

thì 3 action tiếp theo **không được dùng lại**.

Lưu:

```javascript
recentNarratives = [
    "cultivation.normal.03",
    "cultivation.normal.08",
    "cultivation.normal.01"
]
```

Template selector loại chúng ra.

Có thể thêm cooldown:

```text
same template:
5 events

same opening phrase:
10 events

same narrative category:
3 events
```

---

## 27. Narrative Variation

Không chỉ random nguyên câu.

Có thể random từng component:

```text
OPENING
├── Ngươi khoanh chân nhập định
├── Ngươi thu liễm tâm thần
├── Ngươi ngồi xuống tĩnh tọa
└── Ngươi bắt đầu vận chuyển công pháp

QI_DESCRIPTION
├── linh khí chậm rãi lưu chuyển
├── linh khí hội tụ quanh thân
├── từng tia linh lực tràn vào kinh mạch
└── khí tức thiên địa theo đó dao động

ENDING
├── tu vi dần có thêm tiến triển
├── căn cơ được củng cố thêm một phần
└── cảm ngộ đối với công pháp cũng sâu hơn
```

Kết quả có hàng trăm biến thể mà không cần viết hàng trăm đoạn hoàn chỉnh.

---

## 28. Narrative Style

Game nên có một **Narrative Style Guide** cố định.

Đề xuất:

```text
POV:
Ngôi thứ hai

Pronoun:
Ngươi

Tone:
Tiên hiệp / cổ phong / trang trọng

Sentence:
Ngắn → vừa

Avoid:
- văn hiện đại
- slang
- giải thích game mechanics trong narrative
- spam số liệu
- câu quá dài
- lặp từ

Prefer:
- hình ảnh
- cảm giác
- thiên địa
- linh khí
- khí tức
- kinh mạch
- đạo
- nhân quả
- cảnh giới
```

---

## 29. Tách Narrative và Mechanics

Ví dụ **không nên**:

> Ngươi nhận buff `QI_DENSITY_HIGH`, giúp tăng 25% tu vi.

Mà:

> § Linh khí nơi này nồng đậm khác thường. Chỉ cần hít thở, ngươi cũng cảm nhận được từng tia linh lực tràn vào cơ thể.

Sau đó:

```text
✦ Tu vi nhận được +25%
```

Mechanic vẫn rõ, nhưng không phá immersion.

---

## 30. Player-facing Stat Language

Tạo dictionary:

```javascript
STAT_LABELS = {
    cultivation: "Tu vi",
    qi: "Linh lực",
    hp: "Sinh lực",
    constitution: "Căn cốt",
    comprehension: "Ngộ tính",
    technique_mastery: "Thông thạo công pháp",
    spirit_stones: "Linh thạch",
    reputation: "Danh vọng",
    karma: "Nghiệp lực"
}
```

Và delta formatter:

```text
+75  → +75
-43  → -43
```

Nếu lớn:

```text
+1250 → +1.25K
```

nhưng **chỉ dùng UI**, không dùng trong narrative.

---

## 31. Special Formatting

Tạo các marker:

```text
§ Narrative
✦ Tu vi
✧ Công pháp
◆ Discovery
⚔ Combat
⚠ Warning
☠ Death
★ Achievement
◇ Item
◎ NPC
☁ World Event
```

Ví dụ:

> § Ngươi bước vào khu rừng sâu.
>
> ◆ Phát hiện **Huyết Linh Thảo**
>
> ✦ Thu được Huyết Linh Thảo ×3

---

## 32. Log Priority

Mỗi event có priority:

```text
0 = hidden
1 = minor
2 = normal
3 = important
4 = major
5 = legendary
```

UI có thể filter:

```text
[ Tất cả ]

[ Hành động ]

[ Chiến đấu ]

[ Khám phá ]

[ NPC ]

[ Đột phá ]

[ Thế giới ]

[ Quan trọng ]
```

---

## 33. History

Game Log nên lưu **event**, không lưu chỉ text.

Ví dụ:

```text
Event #1842
Event #1843
Event #1844
```

Khi cần UI mới render text.

Lợi ích:

```text
Save game
Replay
Debug
Search history
Achievement
Statistics
AI context
```

đều dễ hơn.

---

## 34. AI Narrative Integration

Sau này nếu muốn kết nối AI miễn phí vào game, kiến trúc này rất phù hợp.

**Không gửi toàn bộ game state cho AI.**

Chỉ gửi:

```json
{
  "event": "CULTIVATION_INSIGHT",

  "player": {
    "realm": "Luyện Khí tầng 3"
  },

  "location": "Thanh Vân Sơn",

  "recent_events": [
    "cultivation",
    "cultivation",
    "cultivation"
  ],

  "result": {
    "mastery_gain": 86
  },

  "style": "xianxia",
  "max_words": 80
}
```

AI chỉ tạo:

```text
Narrative
```

Còn:

```text
+86 mastery
```

do game engine quyết định.

**Tuyệt đối không để AI tự quyết định stat.**

---

## 35. Fallback khi AI lỗi

Nếu AI không trả lời:

```text
AI
 ↓
timeout/error
 ↓
Template Narrative
```

Game vẫn chạy bình thường.

```text
Narrative AI = enhancement
Game Engine = authority
```

Đây là kiến trúc rất quan trọng.

---

## 36. Ví dụ hoàn chỉnh

### Người chơi tu luyện

Input:

```text
Action: cultivate
```

Engine:

```text
cultivation +75
mastery +24
```

Event:

```text
CULTIVATION.NORMAL
```

Output:

> **[Năm 1 · Tháng 2 · Ngày 2]**
>
> § Ngươi khoanh chân nhập định, chậm rãi vận chuyển công pháp.
>
> Linh khí theo kinh mạch tuần hoàn, từng chút củng cố căn cơ.
>
> ✦ **Tu vi +75**  
> ✧ **Công pháp +24**

### Lần sau

> § Một vòng đại chu thiên hoàn tất. Khí tức trong đan điền càng thêm vững chắc.
>
> ✦ **Tu vi +81**  
> ✧ **Công pháp +19**

### Đột nhiên ngộ đạo

> ◆ **Cảm ngộ**
>
> § Trong lúc vận công, một ý niệm bất chợt lóe lên.
>
> Những khẩu quyết vốn tối nghĩa nay dần trở nên sáng tỏ. Ngươi dường như đã chạm tới một tầng huyền diệu khác của công pháp.
>
> ✧ **Thanh Vân Quyết thông thạo +86**
>
> **【Ngộ tính tăng trưởng】**

### Đột phá

> ═══════════════════
>
> **✦ ĐỘT PHÁ CẢNH GIỚI ✦**
>
> § Linh khí quanh thân đột nhiên cuộn trào.
>
> Bình cảnh đã kìm hãm ngươi bấy lâu nay cuối cùng cũng xuất hiện một vết nứt.
>
> Ngươi dồn toàn bộ linh lực, phá tan xiềng xích cuối cùng.
>
> **Luyện Khí tầng 9 → Trúc Cơ sơ kỳ**
>
> ═══════════════════

---

## 37. Cấu trúc code đề xuất

Nếu game hiện tại là web game JS, có thể tổ chức:

```text
src/
├── engine/
│   ├── action-engine.js
│   ├── event-engine.js
│   ├── state-engine.js
│   └── milestone-engine.js
│
├── log/
│   ├── log-engine.js
│   ├── narrative-engine.js
│   ├── template-engine.js
│   ├── result-formatter.js
│   ├── stat-formatter.js
│   ├── log-filter.js
│   └── log-history.js
│
├── narratives/
│   ├── cultivation/
│   ├── combat/
│   ├── exploration/
│   ├── npc/
│   ├── breakthrough/
│   └── world/
│
└── ui/
    ├── game-log.js
    ├── log-entry.js
    └── log-filter.js
```

---

## 38. Luồng cuối cùng

Architecture đề xuất:

```text
                    PLAYER
                       │
                       ▼
                 ACTION BUTTON
                       │
                       ▼
                ACTION ENGINE
                       │
                       ▼
                GAME CALCULATION
                       │
                       ▼
                  GAME STATE
                       │
                       ▼
                 EVENT ENGINE
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       MILESTONE              NORMAL
       DETECTOR                EVENT
             │                   │
             └─────────┬─────────┘
                       ▼
                NARRATIVE ENGINE
                       │
                ┌──────┴──────┐
                │             │
             TEMPLATE         AI
                │             │
                └──────┬──────┘
                       ▼
                 LOG FORMATTER
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Narrative     Changes      Rewards
          │            │            │
          └────────────┼────────────┘
                       ▼
                   GAME LOG
                       │
                       ▼
                       UI
```

---

## 39. Nguyên tắc triển khai quan trọng

**Game Log không phải Debug Log.**

Đừng biến log thành:

```text
[14:32:01]
ACTION=cultivate
cultivation=75
mastery=24
constitution=51
qi=823
multiplier=1.25
...
```

Cũng đừng biến nó thành văn tiểu thuyết quá dài:

> Ngươi ngồi dưới ánh trăng, tâm thần phiêu đãng giữa thiên địa...

mỗi lần click.

Hãy để nó có **3 nhịp**:

```text
ACTION
  ↓
NARRATIVE
  ↓
RESULT
```

Ví dụ lý tưởng:

> § Ngươi vận chuyển Thanh Vân Quyết, linh khí chậm rãi lưu chuyển qua kinh mạch.
>
> **✦ Tu vi +75 · ✧ Công pháp +24**

Còn khi có chuyện đặc biệt:

> ◆ **NGỘ ĐẠO**
>
> § Một tia huyền diệu bất chợt hiện lên trong tâm trí...
>
> **Thanh Vân Quyết thông thạo +86**

Như vậy người chơi sẽ cảm nhận được **“mình vừa làm một hành động trong thế giới”**, chứ không phải **“mình vừa gọi một function tăng stat.”**

Nếu triển khai đúng kiến trúc này, sau này có thể dùng **cùng một Event System cho Action Bar, Story Panel, Combat, NPC, World Event và AI-generated storyline**, thay vì mỗi hệ thống tự sinh text riêng.
## 16. Trạng thái triển khai

Lớp log đã được tích hợp trong `js/engine.js` và là điểm ghi log duy nhất cho engine.

- `createGameEvent(state, input)` chuẩn hóa event theo contract (`id`, `type`, `timestamp`, `action`, `context`, `result`, `changes`, `event_flags`, `importance`, `severity`, `narrative`).
- `emitGameEvent`/`pushHistory` giữ tương thích với lệnh cũ (`type/text`), đồng thời chuyển chúng thành structured event.
- `renderGameEvent` sinh narrative từ template và chống lặp ngắn hạn; gameplay state không phụ thuộc narrative.
- `getGameLog` hỗ trợ lọc theo type, severity và importance; `formatEventChanges` chuẩn hóa stat delta; `detectMilestones` phát hiện chuyển cảnh giới và mốc chỉ số.
- Save migration tự bổ sung `logState` và chuyển history legacy sang event an toàn; UI vẫn dùng `event.text` nên không vỡ giao diện cũ.

Kiểm tra: `node --check js/engine.js` và `node tools/verify_game.js` đều pass.
