# WORLD SIMULATION CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic

### Live-world interaction and unified event log

- The detailed cross-system world simulation source is [`WORLD_SIMULATION_CANONICAL.md`](WORLD_SIMULATION_CANONICAL.md). Its map, faction, NPC, weather, and scheduled-world changes are represented by the feature canonicals linked below; this file remains the canonical home for world-tick orchestration.
- Player-facing narration for world-tick results follows [`UI_ACTION_LOG_CANONICAL.md`](../07-ui/UI_ACTION_LOG_CANONICAL.md) and the [`UI_ACTION_LOG_CANONICAL.md`](../07-ui/UI_ACTION_LOG_CANONICAL.md) event/scene contract. Producers emit structured history events; they do not write to the DOM or bypass `emitEvent()`.
- Map transitions/events: [`MAP_CANONICAL.md`](MAP_CANONICAL.md). Weather history and its narrative context: [`WEATHER_CANONICAL.md`](WEATHER_CANONICAL.md). NPC schedules and reactions: [`NPC_CANONICAL.md`](../05-interaction/NPC_CANONICAL.md). Inter-NPC ties: [`RELATIONSHIP_CANONICAL.md`](../05-interaction/RELATIONSHIP_CANONICAL.md).


### Source: `archive-requirements\logic-history\03-world\EXPLORATION_SEARCH_SYSTEM_REQUIREMENT.md`

# EXPLORATION SEARCH SYSTEM REQUIREMENT

## 1. Mc tiu

Thay th m hnh bm Tm kim mt ln bng h thng **Thm Him** c phin, la chn v hu qu. Thm Him bao ph ton b vng đi: chun b, d tm, pht hin, điu tra, thu thp, b qua, rt lui v quay li.

## 2. Nguyn tc d liu

- Mi node c mt `explorationSite`: `depth`, `maxDepth`, `recoverAtTurn`, `chainStage`, `sessions`, `lastSearchedTurn`.
- Mi phin to `pendingExploration` (tng thch ngc vi `pendingSearch`) gm `nodeId`, `findings`, `risk`, `weather`, `npcAssistId`, `createdTurn`, `expiresTurn`.
- Ti nguyn thng v vt phm him đc t đng nhp kho ngay khi phin d xc nhn pht hin; bn ghi vn gi li đ trace. Ngi chi ch phi quyt đnh vi du vt/c duyn v c th ch đng B Qua.
- Mi la chn c `success`, `reason`, `data`, idempotency key v ghi log c node, vng, thi tit, NPC lin quan.

## 3. Vng đi phin

1. **Chun b**: kim tra đang giao chin, đang di chuyn, gi hot đng, th lc, fog v depth.
2. **D tm**: nhiu lt d ty depth; kt qu chu nh hng MAG, Ng tnh, May mn, ngh, thi tit, đa hnh, influence v nguy him node.
3. **Phn loi pht hin**:
   - ti nguyn thng;
   - ti nguyn him/vt phm to ngu nhin;
   - du vt thng tin m chui;
   - cuc gp NPC hoc phc kch;
   - cng trnh, đng tt, mt đa.
4. **X l**:
   - Thu Thp: x l cc pht hin đc bit cha t thu gom (tng thch save ci);
   - Điu Tra: tng chain stage, m manh mi hoc node runtime;
   - Nh NPC Dn Du: tng đ an ton, quan h v thng tin, yu cu NPC hin din;
   - B Qua: xa pht hin, ghi nhn c hi tht lc, khng nhn thng.
5. **Kt thc**: pending phi đc điu tra hoc b qua trc phin k tip; ti nguyn đ t thu gom khng to nt nhn ln hai. Ri node t đng đnh du pht hin cha x l l tht lc.

## 4. Tng tc Map/NPC/Weather

- NPC ti cng node/sub-location c th lm ngi dn đng, ngi tranh đot, ngi trao đi hoc nhn chng.
- NPC h tr to `npcAssistId`, tng Trust/Respect v gim risk cho ln thu thp; khng đc h tr nu NPC vng mt.
- Ma/sng gim hiu qu d; Tuyt tng chi ph thi gian; Linh Phong c th kha Ng Kh; m Vi tng nguy c phc kch nhng tng c hi du vt t đo.
- Influence `stable/contested/frontier` điu chnh bng ti nguyn v t l gp faction patrol.
- Fog thp ch cho php tin đn; pht hin chi tit v NPC hin din ch hin th khi đ fog.

## 5. Ti nguyn v phn thng

- Mi phin lun c phn thng nn nh (Linh Thch hoc ti nguyn node) nu khng b gin đon.
- Ti nguyn him c cp phm, ngun, ngy pht hin v node ngun đ trace.
- Chain stage 13 m reward ring: vt phm, Cng Đc, Mnh S hoc node runtime.
- Thu Thp phi idempotent; khng th nhn hai ln cng `session`/`findingId`.

## 6. UI/UX

- Action chnh: `Thm Him  N lt d`.
- Khi c pending: `Thu Thp Pht Hin`, `Điu Tra Du Vt`, `Nh NPC Dn Du`, `B Qua Pht Hin`.
- Hin th depth, risk, weather modifier, NPC đang hin din, s pht hin theo loi v thi hn x l.
- Log phi ni r: node, vng, thi tit, NPC h tr/tranh đot v phn thng thc nhn.

## 7. Kim th bt buc

- Khng th bt đu khi đang combat hoc travel active.
- Pending chn phin mi.
- Thu thp/b qua/điu tra chy đng mt ln.
- NPC vng mt b t chi h tr.
- Weather v influence lm thay đi risk/reward.
- Ri node lm pending tht lc, khng to vt phm.
- Save/load gi nguyn site, pending, chain stage v lch s.


### Source: `archive-requirements\logic-history\03-world\STRUCTURE_SAN_PROTECTION_AND_HISTORY_CANONICAL_2026-09-17.md`

# Construction protection and lifecycle addendum — 2026-09-17

`ward_formation` (Hộ Giới Đại Trận) contributes through `wardProtectionAtNode` and
`getWorldModifiers`, not through a UI-only flag. While active it reduces encounter risk,
curse/corruption pressure, and SAN drain by `sanDrainReduction`; damage/disable removes
those effects until repair restores the structure. Its influence contribution is also
included in the canonical map-influence resolver.

Every disable/repair/upgrade/build/dismantle transition invalidates influence cache and
writes node history. Duplicate lifecycle calls are idempotent or rejected with no second
resource mutation.

**Note chưa hoàn thiện:** numerical balance and browser visual confirmation remain gates;
the SAN effect and lifecycle history are now runtime-tested.


### Source: `archive-requirements\logic-history\03-world\TRAVEL_WEIGHT_RESOLVER_CANONICAL_2026-09-17.md`

# Travel weight resolver canonical

`travelPlan`/`canonicalTravelPlan` trả một DTO duy nhất cho preview và commit. DTO gồm distance, base/effective speed, party weight, risk, influence, world modifiers và `weights`.

## Weight layers

- terrain/biome: đường, đồng bằng, rừng, núi, đầm lầy, sa mạc;
- weather: severity/catalog weather hiện tại;
- influence: pressure và contested từ `resolveMapInfluence`;
- structure: ward đang active giảm risk;
- party: companion/member làm giảm tốc độ theo trọng lượng nhóm;
- world event/profession/hidden route: `getWorldModifiers`.

Risk được clamp 0..1; fast travel vẫn yêu cầu hai anchor hợp lệ và không chạy qua nhánh đi bộ. Không được đọc faction owner rời rạc thay cho influence DTO.

## Acceptance

Preview và commit dùng cùng resolver, save giữ `lastTravelPlan`, thay đổi weather/structure/influence làm invalidation và tính lại risk. Offline catch-up không tạo thêm travel event ngoài số `eventRolls` của plan.

## Chưa hoàn thiện

Hệ số terrain/weather là baseline cần playtest trên toàn map; chưa phải cam kết cân bằng cuối cùng.


### Source: `archive-requirements\logic-history\03-world\TRAVEL_WEIGHTING_CANONICAL_2026-09-17.md`

# Travel weighting canonical — 2026-09-17

`GameExpansion.travelPlan` is the single preview/commit resolver. The exported resolver
wraps distance, terrain/weather speed, destination danger, contested influence, ward
protection and `getWorldModifiers` into one DTO. It also exposes:

- `partySize`: player plus active/mutated companion and explicit party members;
- `partyWeight`: `1 + 0.05 × extra members`;
- `baseSpeed` and effective `speed` after party weighting;
- `modifiers`, `risk`, `gameDays`, and `eventRolls`.

The engine movement commit calls the same exported resolver used by route preview, so
weather/ward/companion changes cannot silently produce a different travel result.
Teleport travel remains a separate zero-day branch requiring valid anchors at both ends.

**Note chưa hoàn thiện:** map content balance for long-distance routes and future party
formation abilities remains a product tuning gate; deterministic weighting and parity are
implemented and regression-tested.


### Source: `archive-requirements\logic-history\03-world\WORLDVIEW_ATMOSPHERE.md`

# CẢI THIỆN WORLDVIEW — LÀM CHO KHÔNG KHÍ CTHULHU THẤM ĐỀU TOÀN GAME
> Chẩn đoán: vì sao game hiện tại "chưa đủ Cthulhu" dù đã có SAN/Corruption/Tà Thần, và giải pháp
> hệ thống để không khí eldritch-horror THẤM VÀO mọi hệ thống đã build, thay vì bị nhốt riêng.

---

## 1. CHẨN ĐOÁN: TẠI SAO CHƯA "CTHULHU" DÙ ĐÃ CÓ ĐỦ CƠ CHẾ

Nhìn lại toàn bộ hệ thống đã build (`HE_THONG_HOP_NHAT.md`, `NPC_MONSTER_SYSTEM.md`,
`CONG_PHAP_SYSTEM.md`, `MAP_SYSTEM.md`, `RANDOM_EVENT_SYSTEM.md`), yếu tố Cthulhu hiện chỉ tồn tại
ở dạng **cơ chế số học biệt lập**:
- SAN chỉ là 1 con số giảm/tăng, không ảnh hưởng gì tới CÁCH người chơi NHÌN THẤY thế giới.
- Corruption_Rating chỉ ảnh hưởng buff/debuff, không có biểu hiện tường thuật liên tục.
- Tà Thần chỉ xuất hiện ở Hóa Thần Kỳ+ — 95% thời gian chơi (Phàm Nhân → gần Hóa Thần) HOÀN TOÀN
  không chạm tới không khí cosmic horror, chơi y hệt 1 game tiên hiệp thường.
- Mô tả node bản đồ, NPC, item, quest đều viết theo giọng tiên hiệp chuẩn — không có dấu hiệu "cái
  gì đó không ổn" cài cắm vào nội dung hàng ngày.

**Kết luận:** Cthulhu-horror trong thiết kế hiện tại là **1 lớp phủ lên trên** (topping) chứ không
phải **chất liệu nền** (base ingredient). Giải pháp không phải "thêm nhiều quái/Tà Thần hơn" — mà
là làm cho MỌI hệ thống, kể cả lúc chơi bình thường ở Phàm Nhân/Luyện Khí, đều có gợn sóng bất an.

---

## 2. NGUYÊN TẮC THIẾT KẾ: "WRONGNESS GRADIENT" (Độ Sai Lệch Tăng Dần)

Thay vì horror chỉ bật ON/OFF (an toàn hoàn toàn ở vùng thấp, kinh dị hoàn toàn ở vùng cao), dùng 1
**gradient liên tục** áp lên MỌI mô tả trong game, dựa trên 2 biến đã có sẵn (không cần hệ điểm mới,
đúng nguyên tắc mục 16 `HE_THONG_HOP_NHAT.md`):
```
WrongnessLevel = f(distanceFromOrigin trên map, Corruption_Rating cá nhân, SAN hiện tại/max)
```
- **distanceFromOrigin thấp + SAN cao + Corruption thấp** → mô tả bình thường, NHƯNG cài 1 chi
  tiết "hơi lạ" ngẫu nhiên với xác suất thấp (mục 3).
- **Giữa** → chi tiết lạ xuất hiện thường xuyên hơn, một số con số/thoại NPC bắt đầu không đáng tin
  (mục 4 — Unreliable Narrator).
- **Cao (xa/nhiễm tà nặng/SAN cạn)** → thế giới mô tả hiển nhiên sai lệch, ngôn ngữ tường thuật vỡ
  vụn, đây mới là lúc Cthulhu-horror lộ rõ hoàn toàn.

---

## 3. LỚP "AMBIENT DREAD" — CHI TIẾT BẤT AN CÀI VÀO MỌI NODE/NPC/ITEM (KỂ CẢ BÌNH THƯỜNG)

Thêm 1 bảng flavor-text RIÊNG, độc lập với nội dung chính, được cộng thêm ngẫu nhiên vào MỌI mô tả
(node bản đồ, hội thoại NPC, mô tả item) theo `WrongnessLevel`, không thay thế nội dung gốc mà
CHÈN THÊM 1 câu/chi tiết:

| WrongnessLevel | Xác suất chèn | Ví dụ cụ thể (map/NPC/item) |
|---|---|---|
| Thấp (0-20) | 5% | "Có tiếng chim hót, nhưng khi bạn ngẩng đầu tìm, không thấy con chim nào." / Một thương nhân đếm tiền, "ông ta đếm đi đếm lại 3 lần dù số tiền không đổi." |
| Trung bình (21-50) | 15% | "Bóng của những người qua đường đôi lúc đổ sai hướng so với ánh nắng." / Item: "Lưỡi kiếm này ấm hơn nhiệt độ cơ thể một chút, dù đã để trong túi cả ngày." |
| Cao (51-75) | 35% | "Bạn đếm được 6 ngón trên bàn tay người bán hàng, nhưng khi nhìn lại là 5." / NPC nói 1 câu bằng giọng khác hẳn trong nửa giây rồi trở lại bình thường, không ai khác nhận ra. |
| Cực cao (76-100) | 60% + luôn ảnh hưởng UI | Số liệu HP/Linh Lực hiển thị NHẤP NHÁY sai trong 1 giây trước khi hiện đúng; tên NPC đôi khi hiển thị SAI TÊN trong 1 khung hình. |

> Các chi tiết này KHÔNG có hiệu ứng cơ chế (không trừ SAN thật, không phải sự kiện) — chúng thuần
> là **texture khí quyển**, rẻ để viết (chỉ là bảng câu string), nhưng hiệu quả rất cao vì xuất hiện
> ở MỌI nơi thay vì chỉ trong sự kiện Eldritch chuyên biệt.

---

## 4. UNRELIABLE NARRATOR — SAN THẤP LÀM THÔNG TIN HIỂN THỊ KHÔNG ĐÁNG TIN

Mở rộng ý nghĩa của SAN: hiện tại SAN chỉ là điều kiện trigger Eldritch Quest. Đề xuất thêm: khi
`SAN hiện tại / SAN max < 40%`, UI bắt đầu **cố ý hiển thị sai lệch một số thông tin** (không phải
lỗi thật, là feature mô phỏng tâm trí không còn tin cậy):
```
if (SAN_ratio < 0.4):
    30% cơ hội: số liệu 1 chỉ số (HP/Linh Lực/số lượng quái đối diện) hiển thị SAI ±10-20% so với
                giá trị thật trong 2-3 giây trước khi tự sửa lại đúng
    15% cơ hội: tên 1 NPC/địa điểm hiển thị NHẦM sang tên khác đã gặp trước đó, rồi tự sửa
    10% cơ hội: 1 dòng hội thoại NPC hiện ra rồi "vấp", thay bằng 1 câu khác nghe đe dọa hơn, rồi
                quay lại câu gốc như chưa có gì (chỉ áp dụng ở node có WrongnessLevel >= Trung bình)
```
- Càng SAN thấp, tần suất càng tăng. Về mức SAN = 0 (Madness State đã có sẵn), TOÀN BỘ UI có thể
  render sai lệch nặng trong vài giây trước khi hệ thống Madness tiếp quản (mất quyền điều khiển).
- Đây là cách RẺ để biến SAN từ "1 con số điều kiện" thành "1 trải nghiệm người chơi thật sự cảm
  nhận được", đúng tinh thần Cthulhu (không tin được vào giác quan/lý trí của chính mình).

---

## 5. CƠ CHẾ MỚI: CẤM KỴ TRI THỨC (FORBIDDEN KNOWLEDGE)

Hiện tại học Công Pháp/Cấm Thuật chỉ có giá bằng số (Corruption tăng). Đề xuất thêm YẾU TỐ TƯỜNG
THUẬT: một số lore/Công Pháp/Mệnh Số được đánh dấu `isForbiddenKnowledge: true` — SAU KHI học/biết,
**không thể "quên" được nữa**, và:
- Mở khóa vĩnh viễn 1 vài dòng Ambient Dread (mục 3) ở mức cao hơn bình thường tại MỌI node từ đó
  về sau (nhân vật giờ "biết nhìn thấy" những chi tiết mà trước đây vô hình) — cơ chế này biến kiến
  thức thành gánh nặng vĩnh viễn, đúng mô-típ Lovecraft kinh điển ("biết quá nhiều thì không thể
  sống bình yên như trước").
- Một số NPC Chính Đạo sẽ có phản ứng khác (dè chừng/sợ hãi) nếu phát hiện nhân vật mang tri thức
  cấm kỵ — dùng ĐÚNG cơ chế Corruption_Rating threshold effects đã có (`CONG_PHAP_SYSTEM.md` mục 8),
  không cần hệ điểm riêng, chỉ cần gắn thêm điều kiện "và/hoặc đã học Forbidden Knowledge X".

---

## 6. LAN NHIỄM MÔI TRƯỜNG TRÊN BẢN ĐỒ (CORRUPTION SPREAD)

Nối vào `MAP_SYSTEM.md`: một số node (đặc biệt gần nơi Tà Thần từng "thức tỉnh" — xem
`NPC_MONSTER_SYSTEM.md` mục 1B.2 `world_event_on_fail`) có thể **tự chuyển loại theo thời gian**
nếu không ai xử lý:
```
node bình thường --(qua N ngày không ai ghé/không ai trấn áp)--> node Dị Biến cấp 1
                 --(tiếp tục bị bỏ mặc)--> Dị Biến cấp 2 -> ... -> cấp 5 (đã định nghĩa sẵn ở
                 spec gốc "Môi Trường Dị Biến")
```
- Node lân cận node Dị Biến có % nhỏ mỗi ngày bị "lây" sang cấp Dị Biến thấp hơn — tạo cảm giác
  world đang **mục ruỗng dần nếu người chơi không hành động**, thay vì thế giới tĩnh chờ người chơi
  tới khám phá theo nhịp độ của họ.
- Player/Tông Môn có thể chủ động "Trấn Áp" (dùng Trận Pháp/Công Pháp phù hợp) 1 node Dị Biến để
  đẩy lùi lại cấp độ ô nhiễm — tạo gameplay loop giữ-đất thay vì horror chỉ là thứ để tránh.

---

## 7. VIẾT LẠI GIỌNG TƯỜNG THUẬT CHO HỆ THỐNG "TU LUYỆN" NỀN TẢNG

Đây là thay đổi rẻ nhất nhưng tác động lớn nhất: **KHÔNG đổi số/cơ chế gì cả**, chỉ viết lại flavor
text nền cho các khái niệm CỐT LÕI đã có, nhấn mạnh lại đúng lore gốc "Linh Khí Biến Dạng" (đã có
sẵn trong spec V1-V5 nhưng bị lãng quên dần qua các bản sau):

| Khái niệm cũ (giọng tiên hiệp thuần) | Viết lại (giọng Cthulhu-xianxia) |
|---|---|
| "Tu luyện là hấp thụ linh khí trời đất để tăng sức mạnh" | "Tu luyện là học cách nuốt trọn phần dư của một cơn ác mộng đã ngủ quên trong đất trời — mỗi lần Đột Phá là một lần cơ thể phải học lại cách chịu đựng thứ không dành cho người sống." |
| "Mệnh Số là số phận trời định" | "Mệnh Số là những mảnh vỡ ký ức của thứ gì đó đã chết từ rất lâu, trôi dạt vào người còn sống như mảnh gương vỡ cắm vào da thịt — đôi khi phản chiếu tương lai, đôi khi phản chiếu thứ không nên được nhìn thấy." |
| "Đan dược bồi bổ cơ thể" | "Đan dược là cách rút ngắn con đường tu luyện bằng việc ép cơ thể tiêu hóa nhanh thứ đáng lẽ phải mất hàng chục năm để dung nạp an toàn — không phải lần luyện đan nào cũng thành công theo nghĩa tốt." |
| "Đột Phá cảnh giới là mừng cho nhân vật" | Giữ NGUYÊN cảm giác thành tựu (không nên phá hỏng dopamine của việc lên cấp), NHƯNG thêm 1 dòng mô tả ngắn ở MỖI lần Đột Phá kiểu: "Trong khoảnh khắc Đột Phá, bạn thoáng nghe thấy [1 câu ambient dread ngẫu nhiên theo mục 3] — rồi nó biến mất, và bạn chỉ còn cảm nhận sức mạnh mới." |

> Việc này áp dụng NGAY LẬP TỨC, không cần code gì — chỉ cần thay bảng string flavor text đang dùng
> ở tooltip/mô tả hệ thống hiện tại. Đây nên là việc làm ĐẦU TIÊN vì rẻ nhất, hiệu quả tức thì.

---

## 8. THỨ TỰ ƯU TIÊN TRIỂN KHAI (từ rẻ/nhanh đến đắt/lâu)

1. **Mục 7** (viết lại flavor text nền) — không cần code, chỉ cần viết lại string, làm ngay được.
2. **Mục 3** (Ambient Dread bảng câu bất an) — chỉ cần 1 bảng data + 1 hàm chèn random vào text
   render, độ phức tạp thấp.
3. **Mục 5** (Cấm Kỵ Tri Thức) — cần thêm 1 field boolean vào Công Pháp/Mệnh Số đã có sẵn schema,
   không phá vỡ gì.
4. **Mục 4** (Unreliable Narrator) — cần động vào tầng render UI, phức tạp hơn, nên làm sau khi 3
   mục trên đã chứng minh hiệu quả qua phản hồi người chơi thử nghiệm.
5. **Mục 6** (Corruption Spread trên map) — thay đổi gameplay loop thật sự (không chỉ atmosphere),
   cần cân bằng kỹ, nên làm cuối cùng và có thể cần bật/tắt được (config toggle) để tránh phá vỡ
   trải nghiệm nếu tần suất lan nhiễm tính sai.

---

## 9. BIẾN DỊ THÂN THỂ (PHYSICAL MUTATION) — GẮN TRỰC TIẾP VÀO CORRUPTION_RATING

Mở rộng bảng ngưỡng Corruption đã có ở `CONG_PHAP_SYSTEM.md` mục 8 (hiện chỉ nói chung chung
"ngoại hình bắt đầu biến đổi") thành mô tả CỤ THỂ, hiển thị dần trên Character Sheet như 1 danh
sách "Biến Dị" tích lũy (không xóa được, chỉ có thể che giấu bằng Trang Bị/Phù Chú):

| Ngưỡng Corruption | Biến Dị cụ thể (chọn ngẫu nhiên 1 trong danh sách khi chạm ngưỡng, tích lũy dần) |
|---|---|
| 21-40 | Mạch máu dưới da đôi khi hiện lên thành hoa văn không đối xứng, tự mờ đi sau vài phút; Móng tay mọc chậm hơn nhưng cứng bất thường, gõ vào đá không mẻ; Vị giác đổi khác — mọi thức ăn đều nhạt, chỉ máu tươi còn "có vị" |
| 41-70 | Một bên mắt đổi màu hoàn toàn (không rõ nguyên nhân y học), phản chiếu ánh sáng như mắt thú ban đêm; Xuất hiện 1-2 khớp xương THỪA ở ngón tay/cột sống — vẫn cử động bình thường nhưng khi nắm chặt tay có tiếng "lục cục" không nên có; Bóng đổ trên tường đôi khi có thêm 1 chi không tồn tại trên cơ thể thật |
| 71-90 | Da tại 1 vùng cơ thể (thường là lưng/gáy) mỏng dần tới mức nhìn thấy DẠNG BÓNG của thứ gì đó đang cử động bên dưới — không đau, không chảy máu, nhưng người khác nhìn thấy sẽ hoảng sợ; Hơi thở đôi khi phát ra 1 âm vực thứ 2 chồng lên giọng nói thật, như có 1 "giọng khác" nói cùng lúc rất khẽ |
| 91-100 | Cơ thể bắt đầu KHÔNG CÒN TUÂN THEO GIẢI PHẪU BÌNH THƯỜNG khi nhân vật ngủ hoặc bất tỉnh — nhân chứng kể lại tư thế cơ thể lúc đó "sai" một cách khó diễn tả (khớp gập sai chiều, số ngón tay đếm được khác lúc tỉnh); đây là ngưỡng ngay trước khi world tự kích hoạt Eldritch Intervention độc lập (đã có ở bảng gốc) |

> Mỗi Biến Dị đi kèm 1 hiệu ứng cơ nhỏ (VD: khớp thừa +2% tốc độ đánh nhưng -5% độ chuẩn khi dùng
> vũ khí thường; mắt thú +10% tầm nhìn ban đêm nhưng NPC thường +20% khả năng nhận ra "có gì đó
> không ổn" và giảm giá trị giao dịch) — biến dị luôn là CON DAO 2 LƯỠI, không thuần trang trí.

---

## 10. TỨ ĐẠI TÀ THẦN — CHI TIẾT HÓA HÌNH TƯỢNG VÀ TÍN ĐỒ (mở rộng `NPC_MONSTER_SYSTEM.md` 1B.2)

| Tà Thần | Hình tượng chi tiết (khi lộ diện thật, không phải hóa thân) | Tín đồ/Giáo phái biến đổi thế nào |
|---|---|---|
| **Vô Diện Cuồng Vương** (Điên Loạn) | Không có khuôn mặt cố định — mỗi người nhìn vào thấy 1 gương mặt khác nhau, thường là gương mặt của người họ SỢ NHẤT hoặc YÊU NHẤT đã mất. Thân hình cao gầy bất thường, tay dài chấm đất, các ngón tay uốn cong như đang đếm nhịp 1 bài nhạc không ai nghe thấy | Tín đồ tự khoét mắt để "không còn thấy gương mặt sai" nhưng vẫn nghe được giọng nói của Ngài trong đầu; da mặt họ dần mất biểu cảm, cứng lại như mặt nạ sáp |
| **Thực Cảnh Đại Đế** (Hủy Diệt) | Một khối thịt-đá khổng lồ không ngừng nứt vỡ rồi tự liền lại, mỗi lần nứt lộ ra 1 "mắt" mới mọc từ bên trong rồi lại khép miệng đá nuốt chửng chính nó | Tín đồ tự nguyện để cơ thể "hợp nhất" dần với đất đá nơi thờ phụng — chân biến thành rễ cây/đá, không thể rời khỏi thánh địa nếu đã hợp nhất quá 50% |
| **Huyễn Sắc Cổ Thần** (Dục Vọng) | Hình dạng đẹp đẽ hoàn hảo tới mức GÂY ĐAU MẮT khi nhìn thẳng — vẻ đẹp không thuộc về giải phẫu người thật, đối xứng hoàn hảo tới mức trông "giả", da phát sáng nhẹ như ánh trăng phản chiếu qua nước | Tín đồ dần đánh mất khả năng phân biệt gương mặt người khác — với họ mọi người đều "giống Ngài", dẫn tới hành vi ám ảnh/nguy hiểm với người lạ mặt mà họ tưởng nhầm |
| **Vong Danh Chi Chủ** (Lãng Quên) | KHÔNG có hình dạng ổn định — chỉ là 1 khoảng trống hình người trong không khí, nơi ánh sáng/âm thanh đều bị nuốt mất, nhận biết được Ngài qua việc MỌI NGƯỜI XUNG QUANH ĐỒNG LOẠT QUÊN 1 điều gì đó nhỏ (tên 1 người bạn, đường về nhà) ngay khi Ngài đi ngang qua | Tín đồ dần quên chính danh tính bản thân — phải xăm tên mình lên da mỗi ngày vì tỉnh dậy không còn nhớ, cấp bậc cao nhất trong giáo phái là những kẻ đã quên hoàn toàn tên thật, chỉ còn được gọi bằng số |

---

## 11. KHẾ ƯỚC THÂN XÁC (BODY PACT) — CƠ CHẾ HIẾN TẾ MỚI, TRẢ GIÁ BẰNG CƠ THỂ THAY VÌ SỐ

Bổ sung song song với "Hiến Tế Thọ Nguyên" đã có (đốt năm tuổi thọ đổi sức mạnh tạm thời) — Khế
Ước Thân Xác đổi TRỰC TIẾP 1 bộ phận/giác quan lấy sức mạnh VĨNH VIỄN, không hồi phục được:

| Bộ phận hiến tế | Thưởng vĩnh viễn | Mất mát vĩnh viễn (mô tả + cơ chế) |
|---|---|---|
| 1 con mắt | +30% khả năng nhìn thấy Dị Biến/bẫy ẩn, unlock 1 slot Cấm Thuật | Mù vĩnh viễn 1 bên mắt (giảm tầm nhìn thường), hốc mắt đôi khi "nhìn thấy" cảnh tượng không tồn tại — random chèn Ambient Dread cường độ cao hơn hẳn ở mắt đó |
| Giọng nói | +50% hiệu quả Cấm Thuật liên quan Tinh Thần/SAN | Không thể nói chuyện bằng giọng thật nữa (giao tiếp qua chữ viết/thần thức), NPC thường sợ hãi khi biết |
| Bóng đổ của bản thân | Miễn nhiễm 1 loại debuff khống chế cụ thể | Không còn đổ bóng dưới ánh sáng — bất kỳ ai nhìn thấy đều biết ngay nhân vật đã ký Khế Ước, mất Danh Vọng diện rộng |
| Ký ức về 1 người thân | +1 Chuyển Sinh Điểm ngay lập tức (không cần chờ Chuyển Sinh thật) | Quên hoàn toàn 1 NPC/mối quan hệ đã có trong game — NPC đó vẫn nhớ nhân vật, tạo ra các đoạn hội thoại một chiều đau lòng |

> Khế Ước Thân Xác KHÔNG THỂ hoàn tác — đây là điểm khác biệt cốt lõi với mọi cơ chế đánh đổi khác
> trong game (Hiến Tế Thọ Nguyên là tạm thời, Khế Ước Thân Xác là vĩnh viễn), dành cho người chơi
> thật sự muốn cảm giác "cái giá không thể lấy lại" đúng chất Cthulhu.

---

## 12. SINH VẬT DỊ BIẾN KIỂU MỚI — BODY HORROR THUẦN, KHÔNG PHẢI "QUÁI VẬT" THÔNG THƯỜNG

Bổ sung nhóm quái hoàn toàn mới cho Cấm Địa/Hải Vực-Không Vực, khác hẳn "Yêu Thú" tiên hiệp thường
(hổ/xà/cầm biến dị) — đây là quái THUẦN THỊT, phi tự nhiên:

| Tên | Mô tả | Cơ chế đặc trưng |
|---|---|---|
| **Cụm Thịt Biết Nói** | Một khối thịt không hình dạng cố định, bề mặt lồi lõm thành hàng chục MIỆNG nhỏ, mỗi miệng nói 1 câu khác nhau cùng lúc — đa số là lời nói dối, 1 câu trong đó luôn là sự thật quan trọng | Khi giao chiến, tấn công vào ĐÚNG miệng đang nói sự thật gây x3 sát thương, nhưng phải nghe/phân biệt được (check Aptitude) |
| **Người Da Rỗng** | Nhìn ngoài hệt 1 NPC thường/người quen của nhân vật — chỉ khi bị thương mới lộ ra bên trong RỖNG KHÔNG, không xương không máu, chỉ là lớp da khoác lên hư vô | Không thể phát hiện qua nhìn thường, chỉ lộ ra khi tấn công hoặc dùng Công Pháp Thần Thức soi xét |
| **Trẻ Con Trăm Tuổi** | Ngoại hình là 1 đứa trẻ, nhưng giọng nói/cách dùng từ già dặn bất thường, không bao giờ chớp mắt cùng lúc cả 2 mắt (luôn lệch nhịp vài giây) | NPC/Quái lai — có thể lừa được lòng thương hại của người chơi thiếu kinh nghiệm, gây debuff "Do Dự" nếu tấn công chậm |
| **Đàn Ong Xác Thịt** | Không phải 1 con quái mà là ĐÀN hàng trăm sinh vật nhỏ bằng ngón tay, mỗi con là 1 mảnh thịt-xương thu nhỏ có cánh, hoạt động như 1 ý thức tập thể duy nhất | Không thể diệt hết bằng sát thương diện hẹp, cần AOE; tiêu diệt 1 phần đàn khiến phần còn lại "gào thét" gây SAN Drain diện rộng |

---

## 13. MÔI TRƯỜNG DỊ BIẾN — MÔ TẢ CẢNH QUAN BODY HORROR (nối `RANDOM_EVENT_SYSTEM.md` mục 6, `MAP_SYSTEM.md` mục 6.6 Corruption Spread)

Khi 1 node chuyển sang cấp Dị Biến (Cấp 1→5 theo spec gốc), thay mô tả môi trường chung chung bằng
chi tiết cụ thể theo từng cấp — dùng làm bảng string cố định để gán vào node khi cấp độ thay đổi:

| Cấp Dị Biến | Mô tả cảnh quan |
|---|---|
| Cấp 1 | Cây cối vẫn xanh nhưng vân gỗ khi chẻ ra có hình xoáy giống dấu vân tay người; côn trùng bay theo đội hình hình học không tự nhiên |
| Cấp 2 | Mặt đất hơi ấm và hơi lún như da thịt khi giẫm lên, tự phồng lại sau vài giây; nước suối trong khu vực có vị hơi tanh dù nhìn trong vắt |
| Cấp 3 | Thực vật trong vùng bắt đầu mọc theo dạng ống/mạch giống tĩnh mạch, bên trong "chảy" 1 chất lỏng sẫm màu thay vì nhựa cây; tiếng gió nghe như hơi thở đều đặn của 1 sinh vật khổng lồ vô hình |
| Cấp 4 | Đá và đất tại khu vực có "nhịp đập" yếu ớt quan sát được bằng mắt thường (như tim đập dưới da); động vật trong vùng mọc thêm mắt ở vị trí bất thường trên thân, không ảnh hưởng hành vi |
| Cấp 5 | Toàn bộ địa hình khu vực là 1 khối MÔ SỐNG duy nhất khoác lớp vỏ đất đá bên ngoài — đi trên đó là đi trên da của 1 thực thể đang ngủ; mọi âm thanh trong vùng vọng lại chậm hơn bình thường 1 nhịp, như có 1 thứ khác đang "nhắc lại" lời người chơi vài giây sau |

---

## 14. LUÂN HỒI THẤT BẠI — HẬU QUẢ GROTESQUE KHI QUÁ TRÌNH ĐẦU THAI SAI LỆCH

Mở rộng cơ chế Luân Hồi đã có: thêm % nhỏ (tăng theo Corruption_Rating tại thời điểm chết) Luân Hồi
KHÔNG diễn ra suôn sẻ:
```
% Luân Hồi Thất Bại = Corruption_Rating_tại_lúc_chết / 4   (VD Corruption 80 -> 20% thất bại)

Nếu thất bại:
  Nhân vật KHÔNG đầu thai thành người bình thường — trở thành 1 "Bán Thành" (Half-Formed):
  - Cơ thể mới mang hình hài đúng chủng tộc NHƯNG với 2-3 Biến Dị (mục 9) sẵn có ngay từ khi
    "sinh ra" (không cần tích Corruption mới đạt) — nhân vật khởi đầu kiếp mới đã bất thường
  - Nhận thêm 1 "Ký Ức Vụn" ngẫu nhiên — đoạn hồi ức không phải của mình, có thể là của Tà Thần
    hoặc 1 nạn nhân Dị Biến khác từng chết ở vùng đó, xuất hiện dưới dạng ảo giác định kỳ (không
    hại, chỉ tường thuật) trừ khi người chơi chủ động tìm hiểu (mở quest ẩn)
```
→ Đây là "phần thưởng rủi ro" cho lối chơi nhiễm tà nặng: Luân Hồi Thất Bại KHÔNG hẳn là xấu hoàn
toàn (Ký Ức Vụn có thể dẫn tới lore/Cơ Duyên hiếm), nhưng luôn đi kèm cảm giác "kiếp này không còn
là mình nữa" đúng tinh thần cosmic horror (danh tính con người là thứ mong manh, dễ vỡ).

---

## 15. BẢNG AMBIENT DREAD MỞ RỘNG — THÊM NHIỀU CÂU BODY HORROR CỤ THỂ (bổ sung mục 3)

| WrongnessLevel | Câu bổ sung (body horror thiên hướng) |
|---|---|
| Thấp | "Bạn nghe tiếng khớp mình kêu răng rắc khi đứng dậy — quen thuộc, nhưng hôm nay hơi nhiều tiếng hơn bình thường." |
| Trung bình | "Một người bán hàng cười với bạn, và trong khoảnh khắc đó bạn thấy hàm răng của ông ta nhiều hơn 1 hàng." / "Con mèo hoang bên đường quay đầu nhìn bạn 180 độ mà thân không xoay theo." |
| Cao | "Bạn chạm vào một bức tường đá cũ — nó ấm, và trong một nhịp tim, bạn cảm giác nó hơi PHỒNG LÊN dưới lòng bàn tay như đang thở." / "Vết thương cũ trên tay bạn tự nhiên hé miệng, phát ra 1 tiếng thì thầm quá nhỏ để nghe rõ, rồi khép lại." |
| Cực cao | "Bạn nhìn xuống tay mình đang cầm vũ khí — có đúng 1 khoảnh khắc, đó không phải là tay bạn." / "Tất cả NPC xung quanh đồng loạt ngừng chớp mắt trong đúng 3 giây, rồi tiếp tục như chưa có gì." |

---

## 16. TÀ THẦN DÒM NGÓ MỖI LẦN ĐỘT PHÁ (nối mục 10 + mốc Cấp đã có ở `HE_THONG_HOP_NHAT.md` mục 12.1)

Hiện tại Tà Thần chỉ "chú ý" 1 lần cố định ở Cấp 5 (mốc dị hóa) và ở các mốc lớn 8/11/13/14. Bổ
sung: MỌI LẦN Đột Phá (bất kỳ Cấp nào) đều kèm theo 1 "Tiếng Vọng Từ Ngoài Kia" ngay sau màn ăn
mừng thành tựu — cường độ và mức độ can thiệp tăng dần theo Cấp, tận dụng ĐÚNG khung mốc đã có sẵn
thay vì tạo hệ thống rẽ nhánh mới chồng chéo:

```
Cấp 1-3   -> Chỉ 1 câu Ambient Dread mức Thấp (mục 3), KHÔNG lựa chọn, KHÔNG mất gì — thuần cảm giác
             "có ai đó vừa nhìn thấy mình đột phá" thoáng qua rồi biến mất ngay.

Cấp 4-7   -> 1 câu Ambient Dread mức Trung bình + ÂM THẦM roll 15% Corruption_Rating +1 (KHÔNG
             thông báo cho người chơi biết ngay lúc đó — đúng tinh thần "gặm nhấm không hay biết",
             chỉ lộ ra sau này khi xem lại Corruption_Rating trong Character Sheet).

Cấp 8-11  -> XUẤT HIỆN LỰA CHỌN tường thuật rõ ràng: 1 trong 4 Tà Thần (roll theo mức tương đồng chủ
             đề giữa Con Đường hiện tại và domain Tà Thần — VD Con Đường thiên về Thần Thức/Ma Đạo dễ
             kéo Vô Diện Cuồng Vương hơn, Con Đường thiên về hủy diệt/sát phạt dễ kéo Thực Cảnh Đại Đế
             — bảng match cụ thể theo 10 Con Đường cần điền sau khi có đủ mô tả chi tiết từng Con
             Đường) "hỏi thăm" bằng 1 đoạn thoại ngắn kèm 3 lựa chọn:
               - "Phớt Lờ"        -> an toàn, nhưng -3 SAN (khước từ cũng có giá — nỗi bất an dai dẳng)
               - "Lắng Nghe"      -> +Corruption_Rating (mức theo Cấp), ĐỔI LẠI +% nhỏ vào Power
                                      Coefficient của Công Pháp KẾ TIẾP học được (Tà Thần "giúp đỡ" để
                                      đổi lấy sự chú ý duy trì, không phải cho không)
               - "Cự Tuyệt Bằng Ý Chí" -> tiêu hao SAN hiện tại theo %, NHƯNG chặn đứng hoàn toàn
                                      Corruption tick lần này — CHỈ hiện lựa chọn này nếu SAN hiện tại
                                      đủ cao (rủi ro cho nhân vật SAN thấp: không có đường lui an toàn)

Cấp 12-14 -> GẮN THẲNG vào các mốc Phản Bội/chọn phe/final đã có sẵn (mục 12.1 `HE_THONG_HOP_NHAT.md`)
             — không tạo lựa chọn riêng biệt nữa, mà "Tiếng Vọng" ở các Cấp này CHÍNH LÀ các quyết
             định trận doanh/dị hóa đã thiết kế, chỉ bổ sung thêm mô tả Ambient Dread mức Cực cao đi
             kèm để tăng trọng lượng cảm xúc cho khoảnh khắc vốn đã quan trọng về cơ chế.
```

> Nguyên tắc cốt lõi: Cấp thấp = cảm giác thuần túy (không cái giá), Cấp trung = cái giá âm thầm
> (không cảnh báo trước), Cấp cao = cái giá TƯỜNG MINH có lựa chọn thật — đúng đúng nhịp độ tăng dần
> mà cơ chế Corruption/SAN gốc đã thiết lập, không phá vỡ cân bằng đã có, chỉ LÀM DÀY thêm trải
> nghiệm ở những khoảnh khắc vốn đã là cột mốc quan trọng (Đột Phá).

---

## 17. CÔNG PHÁP PHẢN PHỆ — MỌI CÔNG PHÁP ĐỀU CÓ GIÁ, KHÔNG CHỈ CẤM THUẬT

Hiện tại chỉ Cấm Thuật có `corruption_profile` (cái giá rõ ràng). Bổ sung 1 lớp "cái giá nhỏ" áp
dụng cho MỌI Công Pháp kể cả Chính Đạo/Trung Lập — đúng lore gốc "Linh Khí Biến Dạng" (năng lượng
tu luyện trong thế giới này KHÔNG BAO GIỜ hoàn toàn sạch, kể cả công pháp lương thiện nhất):

```
Mỗi lần phát huy Công Pháp bất kỳ (không phân biệt category), roll Phản Phệ Cơ Bản:

BaseBacklashChance = 1% + 0.5% × mastery_stage (0-4, xem CONG_PHAP_SYSTEM.md mục 6)
  // Nghịch lý cố ý: Công Pháp CÀNG THỤC LUYỆN cao càng dễ Phản Phệ khi dùng dồn dập — vì càng
  // thục luyện, người dùng càng đẩy công lực tới giới hạn thật sự thay vì dùng dè dặt như lúc mới
  // Nhập Môn. Đây là lý do NARRATIVE hợp lý cho việc power-scaling luôn có ma sát đi kèm.

Nếu trúng Phản Phệ:
  - Công Pháp Chính Đạo/Trung Lập (family != "cam_thuat"):
      1 hiệu ứng nhỏ TẠM THỜI (chảy máu mũi, ù tai 1 lượt, -5% chỉ số liên quan trong lượt kế) +
      1 câu Ambient Dread mức Thấp/Trung bình GẮN CỤ THỂ vào đúng bộ phận cơ thể vừa dùng để phát
      Công Pháp (tay dùng Quyền Pháp -> tay "hơi lạ" 1 lúc; mắt dùng Thần Thức -> mắt "nhìn thấy
      thứ gì đó rồi biến mất ngay") — tái sử dụng ĐÚNG bảng Ambient Dread đã có ở mục 3/15, không
      tạo bảng câu mới riêng.
  - Cấm Thuật (family == "cam_thuat"): dùng NGUYÊN VẸN `corruption_profile` đã có sẵn ở
    `CONG_PHAP_SYSTEM.md`/`HE_THONG_HOP_NHAT.md` — mục này KHÔNG thay đổi gì cơ chế Cấm Thuật cũ,
    chỉ mở rộng khái niệm "trả giá" sang phần Công Pháp thường vốn trước đây miễn nhiễm hoàn toàn.
```

> Acceptance khi triển khai: Công Pháp Chính Đạo dùng 1-2 lần liên tiếp gần như không bao giờ thấy
> Phản Phệ (đúng cảm giác an toàn của gameplay thường) — chỉ lộ rõ khi SPAM liên tục hoặc ở
> mastery cao, tạo lý do cơ học hợp lý để không dùng 1 chiêu lặp lại vô hạn, đồng thời củng cố
> đúng thông điệp thế giới quan: KHÔNG CÓ SỨC MẠNH NÀO TRONG GAME NÀY LÀ HOÀN TOÀN MIỄN PHÍ.

---

## 18. GHI CHÚ TRIỂN KHAI

Tất cả nội dung ở mục 9-17 đều CỘNG THÊM vào nền tảng mục 1-8 đã có (không thay thế) — đẩy mạnh độ
grotesque/body horror như yêu cầu, tập trung vào 3 nguyên tắc khi viết thêm nội dung mới nếu cần mở
rộng tiếp: **(1) luôn có chi tiết giải phẫu/thân thể cụ thể** (không mô tả trừu tượng chung chung
kiểu "đáng sợ"), **(2) luôn có mâu thuẫn giữa BÌNH THƯỜNG và SAI LỆCH** (thứ đáng sợ nhất là thứ gần
giống bình thường nhưng sai 1 chi tiết nhỏ, không phải quái vật hiển nhiên), **(3) luôn gắn 1 hiệu
ứng cơ chế nhỏ đi kèm mô tả** (để nội dung không chỉ là văn nếm mà thật sự ảnh hưởng gameplay).


### Source: `archive-requirements\logic-history\04-interaction\OFFLINE_WORLD_SIMULATION_CANONICAL_2026-09-16.md`

# OFFLINE WORLD SIMULATION — CANONICAL CONTRACT

## Mục đích

Mô phỏng ngoại tuyến phải giữ đúng các biến cố có ảnh hưởng đến save nhưng không
được chạy actor-level vô hạn trong thời gian người chơi vắng mặt.

## Chính sách baseline

`state.worldSimulation.offlinePolicy`:

```js
{
  schemaVersion: 1,
  detailedWindowDays: 30,
  aggregateBatchDays: 3,
  actorStateProjection: "final_state_plus_incidents",
  idempotencyKey: "lastProcessedDay"
}
```

- Khoảng thời gian cũ hơn 30 ngày được xử lý bằng aggregate projection.
- 30 ngày cuối được chạy theo actor/world tick hiện hành để giữ NPC, weather,
  war, hidden realm, contract và incident ở trạng thái có thể giải thích.
- Kết quả aggregate không được tạo log chi tiết giả cho từng actor; chỉ được
  tạo các state tổng hợp, cascade và incident cần thiết.
- `lastProcessedDay` là khóa idempotency. Gọi lại cùng target day không được
  cộng reward, tạo event, trừ tài nguyên hoặc thay đổi inventory lần nữa.
- `lastOfflineAudit` ghi `processed`, `aggregate`, `detailed`, `mode`,
  `targetDay` và `source` để chẩn đoán save/catch-up.

## Actor history projection

During the detailed window, `worldSimulation.actorHistory[npcId]` retains up to
30 daily projected snapshots: node/sub-location, AI state, status, needs,
weather/mood, queue rank and rumor count. Older days remain aggregate-only;
final actor state and local incidents remain authoritative.

## Các mode được phép

- `actor_window`: toàn bộ khoảng cần xử lý nằm trong cửa sổ chi tiết.
- `aggregate_then_actor_window`: xử lý aggregate phần cũ rồi actor-level 30 ngày
  cuối.
- `idempotent`: target không vượt `lastProcessedDay`, không có mutation.

## Acceptance

1. Kết quả 30 ngày và 60 ngày đều có mode đúng chính sách.
2. Gọi lặp cùng target day giữ nguyên inventory và world simulation.
3. Deserialize rồi catch-up tiếp tục từ `lastProcessedDay`, không chạy lại ngày
   đã xử lý.
4. Seed world giữ deterministic giữa hai state có cùng save identity.
5. `validateExpansionState` chấp nhận save có policy/audit hoặc tự normalize save
   thiếu các field này.

## Phần chưa hoàn thiện

- Chưa có browser benchmark trên thiết bị yếu và save archive kích thước lớn.
- Actor-level projection của từng NPC trong phần aggregate vẫn là trạng thái cuối
  và incident; chưa mô phỏng lại toàn bộ lịch sử hành vi từng ngày.


### Source: `archive-requirements\logic-history\06-expansion\CONTRACT_COMPLETION_DECISIONS.md`

# Quyt đnh hon thin contract Expansion

Ti liu ny ghi li cc quyt đnh thit k đc php suy din khi SPEC khng kha mt tr s hoc catalog c th. N l phn b sung cho `SPEC_HE_THONG_TINH_NANG_MOI_TOAN_BO.md`, khng thay đi cc invariant bt buc trong SPEC.

## Quyt đnh chung

- Tt c thi hn dng `gameClock.dayIndex`/`absoluteDay`; khng dng thi gian my đ gii quyt gameplay.
- Mi kt qu ngu nhin ca world simulation đc ly t seed lu trong save, `systemId`, ngy v ordinal. Gi li cng state khng sinh reward hoc task ln hai.
- Catch-up di ch m phng chi tit 30 ngy cui. Giai đon aggregate ch thay đi state th gii, khng t thng combat, nhn loot, hon thnh action cn la chn hoc lm cht NPC do ngi chi cha gp.
- D liu đng (đi th đi hi, can thip chin tranh, node b cnh) nm trong runtime/save; catalog t)nh khng b sa bi tick.

## Gameplay đc suy din

- `Yu Th D Bin` l lt chi capture/companion MVP v đc đnh du r `capturable:true`, `beast:true`. Cc monster khc khng t đng bt sng đc.
- Vt phm thc tnh chn template theo loi equipment, curse v thnh tch chin đu. Template lun hin th boon/tradeoff trc confirm.
- Thin kip lun c phng n ti nguyn ph qut v ti đa hai phng n điu kin theo Mnh, neo nhn tnh, cng php, chin s, event hoc tm cnh.
- Đi hi l ba trn combat tht, khng phi mt ln roll. Can thip chin tranh cing ch tng đim sau khi trn combat sinh đng kt thc bng chin thng.
- B cnh ch ghi nhn khi ngi chi đ quan st/m; phe NPC ch c th cnh tranh sau mc đ.

## Ranh gii UI

- Th s hin th event, diplomacy/war front, thi tit/ma v c hi tranh đot.
- Nhim v nhm quest, contract, event v trial theo game-day expiry.
- Cnh gii hin th la chn thin kip đang ch; inventory hin th nt thc tnh ch khi preview hp l.
- D liu b mt nh RNG roll v thng tin NPC ngoi allowlist khng đc render ra UI.

## Cng kim th

- `node tools/verify_game.js`: invariant v DOM regression.
- `node tools/verify_expansion_stress.js --runs=1000 --days=1000`: determinism, gii hn state v khng pht sinh reward offline.



### Source: `archive-requirements\logic-history\07-ui\HEADLESS_TAB_RENDER_CONTRACT_2026-09-17.md`

# Headless Tab Render Contract — 2026-09-17

## Mục tiêu

Kiểm tra hành vi render thật của toàn bộ panel UI trong một DOM harness, bổ sung cho static surface contract. Mỗi tab canonical phải render được với state mới hợp lệ, không throw exception và không đưa placeholder runtime ra HTML.

## Phạm vi tab

`status`, `inventory`, `quests`, `relations`, `guilds`, `map`, `memory`, `world`, `oddities`, `expansion`, `market`, `qintian`, `cauldron`.

## Regression

`tools/verify_game.js` gọi `GameUI.renderPanel` trên từng tab, bắt exception, HTML rỗng và token `undefined`, `NaN`, `Cannot read`, `TypeError`.

## Giới hạn

Harness không đo pixel layout, font, responsive breakpoints, asset network loading hoặc FPS thật; các gate đó vẫn cần browser/device QA.




## TRACE RECOVERY - RUNTIME-DERIVED WORLD SIMULATION CONTRACT

This section reconstructs damaged historical wording from js/expansion.js, js/engine.js, world data, and surviving validator contracts.

### Weather and travel

- weatherSnapshot(state, regionId) is the read boundary for current regional weather.
- Weather affects travel and narrative projections through shared resolver inputs; UI must not invent a second weather rule.
- travelPlan(state, fromNodeId, toNodeId, travelType) is the canonical preview and weighting boundary. It combines route validity, distance, travel mode, influence, weather, risk, and world conditions before movement commits.
- Online movement and offline/world-tick movement use the same travel and weather resolvers.

### Structures and influence

- Structures are runtime records attached to a node. Build, repair, upgrade, disable, and dismantle are transactional actions with access checks, resource checks, status transitions, history entries, and influence-cache invalidation.
- Structure effects contribute to map influence and protection through derived snapshots; the catalog is immutable at runtime.
- Current-node access is required for mutating structure actions unless an explicit owner or manager rule grants access.

### World tick and offline projection

- worldSimulationSummary(state) is a read model over region state, NPC state, hidden realms, events, and runtime locations.
- Offline simulation advances the same state domains as online ticks, then projects player-visible consequences through the normal history/narrative boundary.
- Offline processing is deterministic and idempotent for the same clock interval; it must not duplicate rewards, events, or history entries.
- World events, faction and organization changes, weather, NPC movement, and structure lifecycle are state transitions first; UI receives projections only.

### Recovery status

Recovered from runtime symbols: weatherSnapshot, travelPlan, mapInfluenceSnapshot, structure lifecycle functions, worldSimulationSummary, and offline tick integration. Damaged atmosphere prose is superseded by this runtime-derived contract.
## Consolidated addendum: live interconnection simulation

- World simulation advances idempotently by absolute day and updates diplomacy, wars, NPC schedules/memory, hidden realms, scheduled tasks, and Army morale.
- NPC records may carry schedules, current node/sub-location, relationships, rumors, and bounded memory with the player.
- Hidden realms use a sealed/omen/open lifecycle with cycle index, opening/closing day, competitors, claim ledger, and active entry/core node links.
- World events may update region corruption, faction resources/stability, map influence, rumors, and contested opportunities; consumers read the current state rather than static icons.

### NPC lifecycle and organization consequences

- The absolute game-day tick is the only clock for NPC aging, schedule changes, seasonal routes, rumor propagation, succession, and commission expiry. Each system uses a stable `(systemId, entityId, day, ordinal)` idempotency key; replaying or catching up the same interval cannot duplicate an event or reward.
- Resolve NPC schedules from game hour without advancing simulation state. Age/death checks, route movement, footprint creation, and settlement growth run once per absolute day in a fixed order: expire records; resolve lifespan; resolve world-event couriers; move scheduled/itinerant NPCs; emit footprints; evaluate settlement growth; propagate rumors; then resolve organization crises and deadlines. A deceased NPC is excluded from later phases that day.
- World-tick outputs are structured events consumed by NPC history, node history, organization state, map projections, and the novel-log producer. The tick must not write UI text directly. Rumor source/confidence/expiry and event origin remain inspectable to explain later NPC reactions.
- NPC/map/organization rules and thresholds are specified in [`NPC_CANONICAL.md`](../05-interaction/NPC_CANONICAL.md); relationship dimensions and event-only mutation are specified in [`RELATIONSHIP_CANONICAL.md`](../05-interaction/RELATIONSHIP_CANONICAL.md). A feature may add a tick phase only with a stable order, deterministic input, idempotency key, and bounded offline behavior.

## Rumor lifetime and propagation

All significant deed rumors, including player-originated rumors and NPC copies, use a 30 game-day lifetime measured from creation. Propagation never refreshes `createdDay` or `expiresDay`. Each world tick expires records when `day > expiresDay`, propagates each fact at most one valid map edge, reduces confidence by 20 percentage points per edge, and deduplicates by stable event/fact key. Ignore expired or confidence-below-20 rumors. First-meeting attitude may change once by at most -10 total; direct relationship events take precedence. Apply this to every producer so no 14/30/120-day variants remain.