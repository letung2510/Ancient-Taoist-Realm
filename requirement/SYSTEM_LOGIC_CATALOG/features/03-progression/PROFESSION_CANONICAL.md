# PROFESSION CANONICAL

> Canonical requirement logic for this feature. New requirement logic must be added here.

## Consolidated logic


### Source: `archive-requirements\logic-history\01-core\CONG_PHAP_SYSTEM.md`

# MODULE CONTRACT — CÔNG PHÁP

> Luật gameplay chuẩn nằm trong `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md` cùng thư mục. File này chỉ quy định contract dữ liệu và runtime của module Công Pháp; không lặp lại hệ cảnh giới, trận doanh hay Mệnh Số.

## 1. Mô hình dữ liệu

Catalog Công Pháp là dữ liệu bất biến. Trường `mastery` trong catalog là mẫu khởi tạo; khi học, engine sao chép nó thành tiến độ riêng của nhân vật.

```ts
type TechniqueDefinition = {
  id: string;
  name: string;
  category: "tam_phap" | "chieu_thuc" | "than_phap" | "tran_phap" | "phu_tro" | "cam_thuat" | "dan_phu_phap";
  family: "thien_dao_thuat" | "cam_thuat" | "nguyen_thuat" | "thuong";
  requiredFaction: "loyal_heaven" | "rebel_heaven" | "neutral" | null;
  grade: "pham" | "hoang" | "huyen" | "dia" | "thien" | "tien" | "cam_thuat";
  quality: "ha" | "trung" | "thuong" | null;
  element: "kim" | "moc" | "thuy" | "hoa" | "tho" | "vo_he" | "di_he";
  minRealmLevel: number;
  spiritualRootRequirements: string[];
  isCore: boolean;
  visibleStats: {
    powerCoefficient: number;
    manaCost: number;
    staminaCost: number;
    corruptionCost: number;
    sanCost: number;
    lifespanCost: number;
    cooldownSeconds: number;
    castTimeSeconds: number;
    baseEffect: string;
  };
  hiddenAttributes: HiddenAttribute[];
  corruptionProfile: object | null;
  mastery: { stage: 0 | 1 | 2 | 3 | 4; exp: number; usageCount: number };
  evolutionPaths: EvolutionPath[];
};

type TechniqueProgress = {
  masteryStage: 0 | 1 | 2 | 3 | 4;
  masteryExp: number;
  usageCount: number;
};
```

Không dùng `minRealm`, `cooldownTurns`, `damageMultiplier`, grade `di/thanh` hoặc element `Quang/Huyết/Nguyên` trong dữ liệu mới. Save cũ được adapter chuyển đổi khi deserialize.

## 2. Thứ tự resolve

```text
validate ownership/faction/realm/root
→ validate toàn bộ chi phí
→ commit chi phí nguyên tử
→ grade coefficient
→ mastery multiplier
→ Ngũ Hành nội/ngoại
→ comprehension modifier
→ Fate element modifier
→ family matchup với phòng thủ mục tiêu
→ corruption penalty
→ effect handler theo category
→ mastery gain trong encounter thật
→ clamp state và ghi event
```

Tâm Pháp là nội tại luôn bật, không xuất hiện như action và không chịu chi phí thi triển mặc định.

## 3. Đơn vị thời gian

Schema chuẩn dùng `cooldownSeconds`, `castTimeSeconds` và cửa sổ combo tính bằng giây. Runtime hiện là turn-based nên quy đổi cố định `1 turn = 5 seconds`; không dùng timestamp thời gian thực.

## 4. Mastery

- Mốc mặc định: `[0, 100, 300, 700, 1500]`.
- Hệ số: `[0.60, 0.80, 1.00, 1.15, 1.30]`.
- EXP mastery mỗi lần dùng thành công trong encounter: `round(base_gain × (1 + comprehension/100))`.
- Viên Mãn giảm 15% chi phí mana và 10% cooldown.
- Đại Viên Mãn mới được xét evolution.

## 5. Dung hợp và tiến hóa

- Dung hợp 2–3 Công Pháp cùng cấp.
- Cùng hệ: 80–95%; tương sinh: 60–75%; tương khắc hoặc Dị Hệ: 20–35%.
- Thất bại không xóa nguyên liệu, nhưng trường hợp tương khắc/Dị Hệ tăng 5 Corruption.
- Thành công tạo kết quả trước rồi mới xóa nguyên liệu trong cùng transaction.
- Evolution là lựa chọn vĩnh viễn và phải ghi event history.

## 6. Effect handler bắt buộc

| Category | Handler |
|---|---|
| `tam_phap` | Tính trong derived stats |
| `chieu_thuc` | Damage/status resolver |
| `than_phap` | Movement/evasion resolver |
| `tran_phap` | Persistent area effect resolver |
| `phu_tro` | Buff/heal/SAN support resolver |
| `cam_thuat` | Confirmation và resource-burn resolver |
| `dan_phu_phap` | Crafting resolver ngoài combat |

Category không có handler phải trả lỗi `UNSUPPORTED_TECHNIQUE_CATEGORY`; không được mặc định biến thành damage.

## 7. Invariant

- Catalog chỉ lưu mastery mẫu; không lưu tiến độ mastery đang thay đổi của người chơi.
- Tâm Pháp không bị trừ Stamina chỉ vì thiếu field chi phí.
- `minRealmLevel` so với cấp 1–14, không so index mảng hoặc ID legacy.
- Corruption luôn thuộc 0–100 và cập nhật state sau mỗi lần dùng.
- Cấm Thuật không bỏ qua `realm_gate` hoặc `path_gate`.
- Family matchup dùng family phòng thủ của mục tiêu; cộng hưởng sở hữu là hệ số riêng.
- Mọi kỹ thuật tiêu hao SAN, Thọ Nguyên, Mệnh hoặc Corruption phải có bước xác nhận ở UI.

## 8. Nguồn triển khai

- Catalog runtime: `../data/cong_phap.js`.
- Resolver: `../js/engine.js`.
- UI/action: `../js/ui.js` và `../js/main.js`.
- Test: `../tools/verify_game.js`.

## 9. Truyền thừa tông môn và tự động tu luyện (Revision 2026-09)

- Ngoại Môn được truyền `Tông Môn Nội Tức`; Nội Môn trở lên được truyền thêm một Công pháp theo đặc tính thế lực.
- Nguồn truyền thừa được lưu trong tiến độ nhân vật (`sourceGuildId`), còn catalog Công pháp là bất biến.
- Thăng cấp mastery giữ năm mốc: Nhập Môn 0, Tiểu Thành 100, Đại Thành 300, Viên Mãn 700, Đại Viên Mãn 1500.
- Tu luyện tự động chỉ lặp tối đa 20 chu kỳ, tự điều tức khi thiếu Linh Khí và dừng ở ngưỡng Thanh Tỉnh nguy hiểm hoặc trước khi Đột Phá.

## 10. Nguồn Thông Thạo theo hoạt động

- `cultivation`: mọi Công pháp đã học nhận Thông Thạo; Tâm Pháp dùng base 12, Thân/Phụ Trợ/Trận/Tạp Pháp base 8, Chiêu Thức/Cấm Thuật base 3.
- `combat`: chỉ Chiêu Thức hoặc Cấm Thuật thực sự được thi triển nhận Thông Thạo, base 4. Đánh thường và Công pháp không được dùng không phát sinh Thông Thạo.
- Mọi base nhân với `1 + Ngộ tính/100`, làm tròn và tối thiểu 1.
- UI nhóm riêng Tâm Pháp, Chiến Đấu, Thân Pháp, Phụ Trợ, Trận Pháp, Cấm Thuật và Dị Pháp; mỗi nhóm có màu nhận diện riêng.

### Source: `archive-requirements\logic-history\01-core\HE_THONG_CON_DUONG_NGHE_AN_CANONICAL.md`

# Hệ thống Con Đường, Nghịch Hành và Nghề Nghiệp — Canonical Consolidation

> Tài liệu này hợp nhất các phần trùng hoặc chồng chéo giữa
> `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md` và
> `DI_CHI_CON_DUONG_AN_NGHE_AN.md`.
>
> Khi tài liệu cũ có diễn giải khác tài liệu này, tài liệu này được ưu tiên.

## 1. Phân lớp bắt buộc

Hệ thống có bốn lớp riêng. Không được dùng tên hoặc trigger của lớp này để thực hiện
logic của lớp khác.

| Lớp | Bản chất | Nơi hiển thị | Quyền sở hữu logic |
|---|---|---|---|---|
| Con Đường thường | Trục tu luyện chính của nhân vật | Character/Con Đường | path state, path level, path EXP |
| Nghịch Hành Đạo | Biến thể đối nghịch của Con Đường | Character/Con Đường | path debt, corruption, phản phệ |
| Nghi thức đặc trưng | Hành động mở các mốc của Con Đường | Action Bar/Character | ritual progress, gate, cost, result |
| Nghề Nghiệp sinh hoạt | Chuyên môn hành động, chế tạo và giao dịch | Character/Nghề Nghiệp | profession state, mastery, profession effects |
| Nghề Ẩn | Nghề phụ ngoại lệ, chỉ mở qua chuỗi Cổ Tịch | Character/Dị Chí | secondary profession state, hidden profession effects |

Mệnh Số chỉ là điều kiện hoặc nguồn tương hợp. Mệnh Số không tự biến thành nghề nghiệp,
không thay thế Con Đường và không được nhận effect nghề nghiệp chỉ vì có cùng tag.

## 2. Quy tắc canonical cho Nghề Ẩn và Con Đường Ẩn

1. `professionId` là Nghề Nghiệp sinh hoạt; người chơi phải chọn nghề chính trước.
2. Sau khi chọn, nghề chính được khóa vào `primaryId`; không thể đổi bằng việc thu thập Cổ Tịch.
3. Cổ Tịch Tà Thần I–VII chỉ mở tối đa một Nghề Ẩn phụ vào `secondaryId`.
4. Cổ Thần Tàn Hồn mở `hiddenPathId`, không mở `professionId` hoặc `secondaryId`.
5. Một nhân vật có tối đa một `pathId` chính và một `hiddenPathId` active.
6. Nghề Ẩn/Con Đường Ẩn chưa chọn ở trạng thái `dormant`, không nhận effect active.
7. Nghịch Hành và Dung Hợp là biến thể của `pathId`, không tạo slot path thứ ba.
8. Mọi Nghề Ẩn phải khai báo `professionId`, `unlockTrigger`, `requiredState`, `effects`,
   `costs`, `risks`, `mastery`, `disableRules` và `discoveryClue`.

### 2.1. Nguồn mở Nghề Ẩn và Con Đường Ẩn

Các nội dung từng được ghi là “Nghề Ẩn” trong mục 10.3 cũ phải được phân loại lại. Cổ Tịch
mở một Nghề Ẩn phụ; Cổ Thần Tàn Hồn mở một Con Đường Ẩn. Nghề Nghiệp sinh hoạt vẫn là
lớp riêng và mỗi nhân vật chỉ chọn một nghề sinh hoạt active.

| Nguồn | Loại unlock | Số nhánh | Quy tắc |
|---|---|---:|---|
| Cổ Tịch Tà Thần I–VII | `secondaryId` / Nghề Ẩn | 7 catalog, tối đa 1 active | Mỗi mảnh có graph riêng; thất bại thì nghề tương ứng không được mở |
| Cổ Thần Tàn Hồn | `hiddenPathId` | 4 | Gặp/đối đầu/tiếp nhận tàn hồn và trả giá |
| Quest/Dị Chí khác | Theo registry | Theo registry | Không tự tạo thêm slot nghề hoặc path |

Không dùng hai nguồn vật phẩm này để mở Nghề Nghiệp sinh hoạt. Nghề sinh hoạt phải học qua
thầy, guild, recipe hoặc quest nghề nghiệp và được chọn vào `primaryId` trước.

### 2.2. Cổ Thần Tàn Hồn `[LOGIC MỚI — THAY TÊN TÀ TỊCH]`

Tên `Tà Tịch` được loại bỏ khỏi canonical để tránh nhầm với mảnh Cổ Tịch. Vật phẩm mới là
`Cổ Thần Tàn Hồn`: một mảnh ý thức còn sót lại của Cổ Thần, không phải sách và không
được nhận bằng thao tác tìm kiếm thông thường.

Luồng mở canonical:

```text
phát hiện dấu hiệu tàn hồn
→ xác định Cổ Thần liên kết
→ tiếp cận/đối thoại hoặc đối đầu
→ chọn phong ấn, dung hợp hoặc thôn phệ
→ trả giá Corruption/SAN/Neo
→ ghi `hiddenPathId` ở trạng thái dormant
→ hoàn tất nghi thức nhập đường
→ kích hoạt Con Đường Ẩn
```

Tàn hồn không tự cấp Nghề Nghiệp sinh hoạt, không tự cấp mastery và không tự biến nhân vật
thành tín đồ Tà Thần. Mỗi tàn hồn chỉ mở một hidden path tương ứng.

Registry hidden path từ Cổ Thần Tàn Hồn:

| `linkedTaThanId` | `hiddenPathId` | Effect lõi | Cái giá vận hành |
|---|---|---|---|
| Vô Diện Cuồng Vương | `cuong_ngon_dao` | Tác động SAN qua ngôn ngữ và ý niệm | Người dùng cũng chịu SAN Drain |
| Thực Cảnh Đại Đế | `thuc_canh_dao` | Hấp thụ Corruption của node Dị Biến | Corruption chuyển vào nhân vật |
| Huyễn Sắc Cổ Thần | `huyen_anh_dao` | Tạo phân thân/ảo ảnh | Khó tăng faction reputation với phe chính đạo |
| Vong Danh Chi Chủ | `vong_ngu_dao` | Giao tiếp với người/vật đã mất | Có nguy cơ quên thông tin hoặc quan hệ |

Các dòng mô tả nghề ở bảng legacy bên dưới chỉ được giữ để đối chiếu lore; không dùng làm
`professionId`, không tạo mastery nghề và không được xem là catalog nghề nghiệp.

| `linkedTaThanId` | `hiddenPathId` | Effect lõi | Cái giá vận hành |
|---|---|---|---|
| Vô Diện Cuồng Vương | Cuồng Ngôn Giả | Gây SAN Drain qua hội thoại | Người dùng cũng chịu SAN Drain |
| Thực Cảnh Đại Đế | Thực Cảnh Sư | Hấp thụ Corruption của node Dị Biến | Corruption chuyển vào nhân vật |
| Huyền Sắc Cổ Thần | Huyễn Ảnh Sư | Tạo phân thân/ảo ảnh | Khó tăng faction reputation với phe chính đạo |
| Vong Danh Chi Chủ | Vong Ngữ Sư | Giao tiếp với người/vật đã mất | Có nguy cơ quên thông tin hoặc quan hệ |

`linkedTaThanId` là dữ liệu định danh bắt buộc. Không tạo hidden path Cổ Thần Tàn Hồn thứ năm bằng
cách sao chép effect của bốn nghề trên.

#### 2.2.1. Cơ chế xuất hiện Cổ Thần Tàn Hồn `[ĐÃ TRIỂN KHAI — RUNTIME COMMAND/API]`

Cổ Thần Tàn Hồn không nằm sẵn trong hành trang và không được tìm thấy bằng Search thông thường.
Nó xuất hiện như một encounter có điều kiện:

```text
điều kiện tàn hồn tại region/node
→ omen hoặc NPC cảnh báo
→ encounter Cổ Thần Tàn Hồn
→ đối thoại / chiến đấu / phong ấn
→ chọn tiếp nhận một hidden path
→ trả giá và ghi dấu ấn tàn hồn
```

Điều kiện tối thiểu phải kết hợp ít nhất ba nhóm: khu vực hoặc node đặc biệt, Corruption/
world event/weather, và hành vi hoặc bộ Mệnh của nhân vật. Encounter có thể thất bại hoặc
biến mất; không bảo đảm mỗi lần đi qua đều xuất hiện.

Ba lựa chọn khi encounter:

| Lựa chọn | Kết quả | Cái giá |
|---|---|---|
| Phong ấn | Nhận clue sâu, chưa mở đường ngay | Tốn tài nguyên/Neo, có thể bị truy đuổi |
| Dung hợp | Đủ điều kiện mở `hiddenPathId` tương ứng | Corruption và SAN tăng, Neo bị đánh dấu |
| Thôn phệ | Nhận biến thể mạnh/rủi ro cao | Mệnh Nợ, phản phệ hoặc `ELDRITCH_INTERVENTION` |

Mỗi Cổ Thần Tàn Hồn chỉ được xử lý một lần cho một nhân vật. Dấu ấn đã nhận phải ghi
`linkedTaThanId`, lựa chọn, cost, risk và trạng thái hidden path; không tạo nghề sinh hoạt mới.

### 2.3. Bảy Nghề Ẩn phụ từ chuỗi Cổ Tịch Tà Thần I–VII `[GIỮ NGUYÊN LOGIC CŨ]`

Mỗi mảnh Cổ Tịch Tà Thần mở một `hiddenProfessionId` riêng vào danh sách Nghề Ẩn đã biết, không
mở Nghề Nghiệp sinh hoạt chính và không mở `hiddenPathId`. Bảy mảnh tương ứng bảy nghề riêng
theo logic cũ; `secondaryId` chỉ là slot kích hoạt tối đa một nghề trong bảy nghề đó.

Mảnh Cổ Tịch Tà Thần là một hệ vật phẩm khác với `Cổ Thần Tàn Hồn`. Không được dùng hai loại
vật phẩm này thay thế cho nhau:

| Nguồn | Dữ liệu | Số nghề | Bản chất |
|---|---|---:|---|
| `Cổ Thần Tàn Hồn` | Một vật phẩm liên kết `linkedTaThanId` | 4 | Hidden path gắn với Cổ Thần, cái giá Corruption/SAN/Neo |
| `Cổ Tịch Tà Thần I–VII` | 7 mảnh, mỗi mảnh thuộc một đại vực | 7 | Bảy Nghề Ẩn riêng, mở qua điều tra–đọc–giải mật–thu thập |

Luồng của mảnh Cổ Tịch Tà Thần:

```text
điều tra mảnh tại đúng đại vực
→ đọc văn tự
→ giải mật/đối chiếu
→ thu thập mảnh
→ ghi clue vào Dị Chí
→ hoàn tất đồ thị của nghề tương ứng
→ mở đúng Nghề Ẩn tương ứng ở trạng thái dormant
→ người chơi chọn một nghề vào `secondaryId` nếu chưa có nghề phụ
```

Registry 7 mảnh hiện có:

| Mảnh | Đại vực | Chặng trong đồ thị Nghề Ẩn |
|---|---|---|
| `ta_than_codex_01` | Trung Vực | `nguoi_giai_mong` — Người Giải Mộng |
| `ta_than_codex_02` | Nam Chướng | `doc_gia_co_tich` — Độc Giả Cổ Tịch |
| `ta_than_codex_03` | Bắc Nguyên | `nguoi_dan_duong` — Người Dẫn Đường Dị Giới |
| `ta_than_codex_04` | Vô Tận Hải | `tho_san_di_triều` — Thợ Săn Dị Triều |
| `ta_than_codex_05` | Tây Mạc | `nguoi_giu_cua` — Người Giữ Cửa |
| `ta_than_codex_06` | Thiên Không Vực | `thay_tuong_menh` — Thầy Tướng Mệnh |
| `ta_than_codex_07` | U Minh Giới | `hanh_gia_vo_danh` — Hành Giả Vô Danh |

Bảy mảnh mở đủ bảy Nghề Ẩn tương ứng. Thu thập đủ mảnh không tự động chọn nghề, không tự động
tăng mastery và không mở Con Đường Ẩn; người chơi vẫn chỉ được kích hoạt tối đa một nghề phụ.

#### 2.3.1. Chống mở Nghề Ẩn quá dễ `[ĐÃ TRIỂN KHAI — GRAPH CỔ TỊCH]`

Một lần bấm Tìm Kiếm chỉ tạo dấu vết, không được trả thẳng Cổ Tịch, `secondaryId` hoặc
quyền mở Nghề Ẩn. Luồng tối thiểu cho mỗi mảnh:

```text
thăm đúng đại vực
→ tìm kiếm tạo trace chưa xác minh
→ đọc trace tại địa điểm phù hợp
→ đối chiếu với NPC/địa danh/biến cố hoặc thiên tượng
→ giải mật đạt confidence tối thiểu
→ thu thập mảnh thật
→ hoàn tất đồ thị Nghề Ẩn
```

- Mỗi chặng Cổ Tịch cần ít nhất ba loại bằng chứng khác nhau; không dùng ba lần tìm kiếm cùng một node.
- `lead`, `crosscheck` và `decrypt` là ba bước khác nhau; thiếu bước nào thì không thể thu thập.
- Trace có thể là manh mối giả, làm giảm SAN hoặc tăng thời gian retry, nhưng không được làm mất dữ liệu đã xác minh.
- Điều tra đúng đại vực chỉ mở cơ hội; phải thỏa điều kiện node, NPC, event/weather/fate theo graph của chặng.
- Mỗi mảnh hoàn tất đúng một graph và mở đúng một Nghề Ẩn ở trạng thái dormant.
- Thu thập đủ 7 mảnh chỉ hoàn tất bộ Cổ Tịch; không tự chọn `secondaryId` và không mở Con Đường Ẩn.

#### 2.3.2. Registry bảy Nghề Ẩn Cổ Tịch `[GIỮ LOGIC CŨ]`

Mỗi nghề giữ một action, cost, cooldown và passive riêng. Các passive/action chỉ có hiệu lực sau
khi nghề được chọn vào `secondaryId` và chuyển sang `active`; việc biết hoặc mở khóa nghề không
được tự động cộng chỉ số.

| Cổ Tịch | Stable ID | Nghề | Action/cost | Passive chính |
|---:|---|---|---|---|
| I | `nguoi_giai_mong` | Người Giải Mộng | Giải Mộng / SAN 2 / 3 ngày | Giảm hao SAN 5% |
| II | `doc_gia_co_tich` | Độc Giả Cổ Tịch | Chú Giải Cổ Văn / SAN 3 / 3 ngày | Tăng confidence clue chưa xác minh |
| III | `nguoi_dan_duong` | Người Dẫn Đường Dị Giới | Định Tuyến Dị Lộ / Thể lực 5 / 2 ngày | Giảm travel risk |
| IV | `tho_san_di_triều` | Thợ Săn Dị Triều | Truy Dấu Dị Triều / Thể lực 8 / 2 ngày | Tăng search reward |
| V | `nguoi_giu_cua` | Người Giữ Cửa | Niêm Phong Giới Môn / Khí 10 / 5 ngày | Giảm encounter risk |
| VI | `thay_tuong_menh` | Thầy Tướng Mệnh | Soi Mệnh Tuyến / Công đức 2 / 4 ngày | Tăng fortune |
| VII | `hanh_gia_vo_danh` | Hành Giả Vô Danh | Vô Danh Hành / SAN 5 + Thể lực 5 / 7 ngày | Tăng cultivation |

Quy tắc chọn: nhân vật có thể mở/biết nhiều ID trong bảng, nhưng `secondaryId` chỉ nhận một ID;
`secondaryLocked = true` là khóa vĩnh viễn theo thiết kế hiện tại. Nếu không giải được graph hoặc
không chọn nghề, nhân vật vẫn chỉ có Nghề Nghiệp sinh hoạt chính.

### 2.4. Mô hình slot canonical `[LOGIC MỚI — SỬA LẠI THUẬT NGỮ]`

Phải phân biệt ba lớp và trạng thái:

| Lớp/trạng thái | Có thể có bao nhiêu | Ý nghĩa |
|---|---:|---|
| Nghề Nghiệp sinh hoạt active | 1 | `professionId`, nhận mastery và effect nghề |
| Nghề Ẩn phụ active | 1 | `secondaryId`, nhận effect/action nghề ẩn |
| Con Đường chính active | 1 | `pathId`, trục tu luyện và cảnh giới |
| Con Đường Ẩn active | 1 | `hiddenPathId`, nhánh/biến thể bổ sung cho path chính |
| discovered/unlocked | Nhiều | Clue, bảy Nghề Ẩn và path ẩn chưa kích hoạt |

Quy tắc canonical:

1. `professionId`, `pathId` và `hiddenPathId` là ba namespace khác nhau.
2. Cổ Tịch Tà Thần chỉ tác động `secondaryId`; Cổ Thần Tàn Hồn chỉ tác động `hiddenPathId`.
3. Nghề Ẩn phụ dormant không nhận passive/action/mastery; chỉ có clue và tiến độ mở khóa.
4. Con Đường Ẩn dormant không nhận effect/ritual/title active.
5. Một nhân vật có thể biết tối đa bảy Nghề Ẩn Cổ Tịch và nhiều hidden path, nhưng chỉ kích hoạt một của mỗi loại.
6. Nghịch Hành và Dung Hợp nằm trong `pathVariant`/`hybridPath`, không tạo slot mới.

Schema slot canonical:

```json
{
  "professionState": {
    "primaryId": "luyen_dan",
    "secondaryId": "doc_gia_co_tich",
    "primaryLocked": true,
    "secondaryLocked": true
  },
  "pathState": {
    "pathId": "di_hoa",
    "pathVariant": "normal",
    "hiddenPathId": "cuong_ngon_dao"
  }
}
```

`secondaryId` có thể là bất kỳ một trong bảy ID: `nguoi_giai_mong`, `doc_gia_co_tich`,
`nguoi_dan_duong`, `tho_san_di_triều`, `nguoi_giu_cua`, `thay_tuong_menh` hoặc
`hanh_gia_vo_danh`; ví dụ trên chỉ minh họa một lựa chọn.

Nếu chuỗi Cổ Tịch thất bại, `secondaryId` giữ `null`; nhân vật vẫn sử dụng bình thường
`primaryId`, `pathId` và không bị phạt vì chưa có Nghề Ẩn hoặc Con Đường Ẩn.

## 3. Nghi thức đặc trưng của Con Đường `[ĐÃ TRIỂN KHAI — PATH RITUAL STATE]`

Nghi thức đặc trưng thuộc về Con Đường, không thuộc về Nghề Nghiệp sinh hoạt hay Con Đường Ẩn. Bảng nghi thức ở mục
7.3 cũ chỉ mô tả fantasy/effect của path; nó không phải catalog profession và không
được dùng để unlock Con Đường Ẩn.

Mỗi Con Đường có tối đa ba mốc nghi thức:

| Mốc | Mục đích | Kết quả |
|---|---|---|
| Khai Lộ | xác lập đường | mở path state và path level đầu |
| Chưởng Quyền | xác lập quyền năng | mở effect/path ability riêng |
| Thành Thần | hoàn tất đường | tạo quyền năng cấp cao hoặc điều kiện cấp 14 |

Nghi thức dùng chung pipeline:

```text
 Gọi Mệnh → Dựng Neo → Đối Chiếu Con Đường → Vượt Dị Tượng → Trả Giá → Commit nghi thức
```

### 3.1. Logic nghi thức canonical — Gọi Mệnh → Dựng Neo

Chuỗi nghi thức đúng không bắt đầu bằng việc kiểm tra khô `realm_gate` hoặc `path_gate`. Hai công đoạn đầu tiên là hành động có chủ ý của nhân vật:

```text
Gọi Mệnh → Dựng Neo → Đối Chiếu Con Đường → Vượt Dị Tượng
→ Trả Giá → Commit nghi thức
```

#### Gọi Mệnh

- Nhân vật dùng Chân Danh, Mệnh Khế hoặc vật dẫn đã được cho phép.
- Hành động này xác định Mệnh dẫn/trợ đang được dùng cho nghi thức.
- Nếu không có nguồn Gọi Mệnh hợp lệ, nghi thức dừng và không tiêu hao.
- Gọi Mệnh không tự đổi Con Đường, không mở Con Đường Ẩn và không commit effect.

#### Dựng Neo

- Sau khi Gọi Mệnh thành công, nhân vật chọn một Neo: `npc`, `place`, `memory` hoặc `oath`.
- Neo phải có định danh, độ ổn định và cách duy trì; không được dùng Neo ảo hoặc chưa tồn tại.
- Dựng Neo ghi `anchorId`, `anchorType`, `stability`, `lastRenewedTurn` vào ritual state.
- Neo không đủ điều kiện thì không được chuyển sang bước Đối Chiếu Con Đường.

#### Phân tầng theo cấp

| Cấp đích | Chuỗi bắt buộc |
|---:|---|
| 2 | Gọi Mệnh → Dựng Neo → Đối Chiếu Con Đường |
| 3–4 | Gọi Mệnh → Dựng Neo → Đối Chiếu |
| 5–7 | Gọi Mệnh → Dựng Neo → Đối Chiếu → Vượt Dị Tượng |
| 8–13 | Gọi Mệnh → Dựng Neo → Đối Chiếu → Vượt Dị Tượng → Trả Giá |
| 14 | Chuỗi cấp 11–13 → Thử Thách Cuối riêng của Con Đường |

`Dựng Neo` là bước setup bắt buộc ở mọi cấp nghi thức của Con Đường, bao gồm cả nghi thức mở đường cấp 2. Nghi thức nhập Con Đường Ẩn từ Cổ Tịch/Cổ Thần Tàn Hồn có pipeline riêng và không dùng bảng này.

#### Quy tắc commit

1. Gọi Mệnh và Dựng Neo là setup, không roll và không trừ chi phí commit.
2. Mọi gate phía sau phải pass trước khi trừ cost.
3. Roll chỉ xuất hiện ở `Vượt Dị Tượng` hoặc `Thử Thách Cuối`.
4. Nếu thất bại, ritual state ghi rõ bước thất bại, SAN/Corruption/Mệnh Nợ/Neo impact; không âm thầm đổi Con Đường.
5. Chỉ sau `cost_commit` mới cập nhật path milestone và effect nghi thức.

Nghi thức không được:

- mở hoặc cấp trực tiếp Nghề Nghiệp sinh hoạt từ Cổ Tịch/Cổ Thần Tàn Hồn;
- tạo field nghề nghiệp mới;
- bỏ qua điều kiện Con Đường;
- trao buff mà không ghi cost/risk vào state;
- dùng tên nghề để đại diện cho một nghi thức path.

Nếu nhân vật đang active Con Đường Ẩn từ Cổ Tịch/Cổ Thần Tàn Hồn, nghi thức path chính vẫn có thể dùng nếu thỏa điều
kiện path. Effect nghề chỉ sửa modifier đã được khai báo, không thay pipeline nghi thức.

## 4. Chuyển, song tu và dung hợp đường `[ĐÃ TRIỂN KHAI — PATH TRANSITION STATE]`

### 4.1. Chuyển đường

- Trước cấp 4: mất EXP path hiện tại và kiểm tra điều kiện đường mới.
- Từ cấp 4: phá một Mệnh Khế, tăng `fateDebt` và tác động Neo.
- Lịch sử đường cũ giữ trong `pathHistory`; effect đường cũ ngừng active.

### 4.2. Song tu

- Mở từ cấp 6.
- Cả hai đường phải đạt `match_score >= 5`.
- Tăng 10% SAN cost cho nghi thức có liên quan.
- Hai đường vẫn là hai path state; không tạo nghề mới.

### 4.3. Dung hợp đường

- Mở từ cấp 10.
- Hai đường phải có ít nhất một Mệnh trợ chung.
- Kết quả là `hybridPath`, giữ nguyên lịch sử hai đường gốc.
- Hybrid path chỉ thay effect path sau khi commit; không đổi Nghề Nghiệp và không xóa Con Đường Ẩn.
- Nếu có từ hai Mệnh cấm chưa hóa giải, đánh dấu `Dị Hệ` và tăng Corruption ở các
  nghi thức sau.

## 5. Nghịch Hành Đạo `[ĐÃ TRIỂN KHAI — PATH VARIANT STATE]`

Nghịch Hành là biến thể của Con Đường, không phải Con Đường Ẩn.

```text
negative_path_gate = Total_Fate >= normal_gate + 25
  AND matched_lead_fates >= 2
  AND matched_contrary_fates >= 1

negative_cost = base_cost × (1 + fate_debt × 0.10)
```

Nghịch Hành sử dụng các field hiện có:

- `pathId`/`pathVariant` để xác định đường;
- `pathDebt` hoặc `fateDebt` để lưu giá phải trả;
- `corruption` và `san` cho phản phệ;
- `pathHistory` để không mất lịch sử.

Nghịch Hành không tạo `hiddenPathId`, không dùng `linkedTaThanId` và không được
hiển thị trong catalog Con Đường Ẩn. Mọi giảm stat vĩnh viễn phải lưu trong `path_debt` và
không reset khi đổi đường.

## 6. Dị Chí là lớp phát hiện, không phải lớp thực thi

Dị Chí ghi clue và lịch sử cho các hệ thống ẩn:

```text
event/quest/action → discovery clue → đủ điều kiện → unlock resolver → state commit
```

Dị Chí không tự cấp effect path, không chứa một bản sao của path catalog và không được tự
chạy nghi thức path. UI đặt clue Con Đường Ẩn ở tab Dị Chí; effect/ritual của đường vẫn
đọc từ `hidden path state`.

## 7. Quy tắc chống trùng và mapping cũ

| Logic cũ | Mapping canonical |
|---|---|
| Nghi thức Kiếm/Đan/Phù/... ở mục 7.3 | `path.rituals[pathId][milestone]` |
| Chuyển/song tu/dung hợp ở mục 7.5 | `pathTransition` và `hybridPath` |
| Sát Thần, Huyết Đan, ... ở mục 8 | `pathVariant = nghich_hanh_*` |
| Nghề Ẩn phụ từ chuỗi Cổ Tịch | `hiddenProfession.catalog` gồm đủ 7 nghề tương ứng bảy mảnh |
| Bốn nhánh Cổ Thần trong DI_CHI mục 3.2 | `hiddenPath.catalog` nhóm `co_than_tan_hon` |
| Clue Cổ Tịch | `discoveries.hiddenProfessionClues` |
| Clue Cổ Thần Tàn Hồn | `discoveries.hiddenPathClues` |

Không được tạo thêm catalog nghề nghiệp từ bảng nghi thức path. Không được dùng một ID cho cả
`pathVariant`, `hiddenPathId` và `professionId`.

## 8. Quy hoạch đổi tên Con Đường để tránh trùng Nghề Nghiệp

Một số tên Con Đường hiện tại trùng hoặc quá gần với tên Nghề Nghiệp, gây nhầm lẫn
giữa “trục tu luyện” và “chuyên môn hành động”. Phương án đã chốt là đổi trực tiếp
`pathId` và `displayName` cho registry mới; không duy trì tương thích save cũ.

### 8.1. Nguyên tắc đổi tên an toàn

- Đổi `pathId` và `displayName` theo registry mới.
- Giữ nguyên `professionId`, `fateId`, `techniqueId`, tags, effects, requirements và
  unlock rules của từng path.
- Không tạo `legacyName`, `legacyPathId` hoặc alias để đọc save cũ.
- Mọi reference trong data, code, quest, event, log, UI và test phải dùng `pathId` mới.
- Không cần migration dữ liệu gameplay cũ; dữ liệu cũ nằm ngoài phạm vi hỗ trợ.
- Con Đường và Nghề Nghiệp phải hiển thị ở hai namespace riêng:

```text
Con Đường: <displayName của path>
Nghề Nghiệp: <displayName của profession>
```

### 8.2. Registry path ID và display name mới `[ĐÃ CHỐT THEO PHƯƠNG ÁN MỚI]`

| Stable path ID mới | Tên cũ | Display name mới | Lý do |
|---|---|---|---|
| `di_hoa` | Đan Đạo | Dị Hỏa | Tách khỏi nghề Luyện Đan Sư |
| `thien_co` | Tinh Tượng Đạo | Thiên Cơ | Tách khỏi nghề Tinh Tượng Sư |
| `linh_van` | Phù Đạo | Linh Văn | Tách khỏi nghề chế tác phù |
| `thien_menh` | Phong Thủy Đạo | Thiên Mệnh | Nhấn mạnh long mạch và thế giới |
| `dao_the` | Luyện Thể Đạo | Đạo Thể | Tách khỏi nghề rèn thân/thể thuật |
| `kiem_dao` | Kiếm Đạo | Kiếm Đạo | Giữ nguyên vì không trùng trực tiếp |
| `ngu_thu` | Ngự Thú Đạo | Ngự Thú | Tên UI đã rút gọn |
| `khoi_loi` | Khôi Lỗi Đạo | Khôi Lỗi | Tên UI đã rút gọn |
| `ta_am` | Âm Luật Đạo | Tà Âm | Tách khỏi cách gọi nghề âm luật |
| `mong_canh` | Mộng Cảnh Đạo | Mộng Cảnh | Tên UI đã rút gọn |

Các ID mới là stable ID chính thức trong phạm vi tài liệu này. Không dùng tên cũ làm key runtime.

### 8.3. Phân biệt Con Đường và Nghề Nghiệp

| Đối tượng | Trả lời câu hỏi | Ví dụ |
|---|---|---|
| Con Đường | Nhân vật tu luyện theo triết lý nào? | Dị Hỏa, Thiên Cơ |
| Nghề Nghiệp | Nhân vật thực hiện chuyên môn gì? | Luyện Đan Sư, Tinh Tượng Sư |
| Nghi thức path | Nhân vật chứng minh quyền năng của đường ra sao? | Sinh Đan, Đọc Thiên Tượng |
| Công Pháp | Nhân vật sử dụng kỹ thuật nào? | công pháp Đan/Hỏa/Tinh Tượng |

Một nhân vật có thể đồng thời đi `di_hoa` và học nghề `Luyện Đan Sư`; hai hệ
thống này không được cộng effect trùng chỉ vì tên hoặc tag gần nhau.

### 8.4. Schema path mới

```json
{
  "pathId": "di_hoa",
  "displayName": "Dị Hỏa",
  "namespace": "path"
}
```

Parser/UI chỉ nhận `pathId` mới. State, event, quest, relationship, Fate, Công Pháp,
log và test đều tham chiếu ID mới; không có lớp chuyển đổi save cũ.

### 8.5. Checklist trước khi apply code

1. Thay toàn bộ path key cũ bằng stable ID mới trong data/code/test.
2. Cập nhật `displayName` và text UI/log theo registry mới.
3. Kiểm tra nghề nghiệp trùng tên hoặc trùng fantasy với từng đường.
4. Kiểm tra mô tả nghi thức không biến thành mô tả nghề nghiệp.
5. Chạy regression cho path selection, profession, Fate và Công Pháp.

## 9. Checklist khi bổ sung nội dung mới

Trước khi thêm một logic mới, phải trả lời:

1. Đây là path, path variant, ritual hay hidden profession?
2. State canonical nào sở hữu nó?
3. Trigger unlock có phải gameplay event cụ thể không?
4. Cái giá và rủi ro đã được ghi rõ chưa?
5. Nội dung có trùng effect hoặc ID của lớp khác không?
6. Dị Chí chỉ ghi clue hay đang vô tình thực thi effect?

---

## 10. Registry đầy đủ của mười Con Đường `[GIỮ NGUYÊN]`

Phần này giữ nguyên dữ liệu nền trong `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`. Các tên
hiển thị mới ở mục 8 chỉ là đề xuất UI; stable ID, tag, Mệnh, effect và mặt trái không thay đổi.

| Stable ID | Display name | Mệnh dẫn đầy đủ | Mệnh trợ đầy đủ | Mệnh cấm đầy đủ | Chỉ số chủ | Mặt trái |
|---|---|---|---|---|---|---|
| `kiem_dao` | Kiếm Đạo | `kim`, `kiếm`, `sát`, `chiến`, `lôi` | `phong`, `hỏa`, `thể`, `cốt` | `mộng`, `ảo`, `vô`, `tâm` | PHY, Căn Cốt | Phải cắt quan hệ hoặc lời thề ở nghi thức lớn |
| `di_hoa` | Dị Hỏa | `đan`, `hỏa`, `sinh`, `mộc`, `cốt` | `thể`, `lô`, `tử`, `nguyên` | `độc`, `hàn`, `diệt`, `vô` | MAG, Ngộ Tính | Đan độc và biến đổi thân thể tích lũy |
| `linh_van` | Linh Văn | `phù`, `ấn`, `cơ`, `phong`, `lôi` | `kim`, `tinh`, `trận`, `vô` | `tử`, `huyết`, `diệt`, `vực` | Ngộ Tính, MAG | Phù mạnh có thể xóa ký ức |
| `thien_menh` | Thiên Mệnh | `địa`, `sơn`, `thủy`, `trận`, `long`, `vực` | `tinh`, `mệnh`, `cơ`, `sinh` | `hư vô`, `diệt`, `sát`, `ảo` | Ngộ Tính, SAN | Sai long mạch phản chấn khu vực |
| `ngu_thu` | Ngự Thú | `thú`, `yêu`, `huyết`, `sinh`, `thể` | `sơn`, `nguyên`, `mộc`, `tâm` | `diệt`, `độc`, `vô`, `cơ` | Căn Cốt, PHY | Đồng cảm sâu làm bản ngã người mỏng đi |
| `khoi_loi` | Khôi Lỗi | `khôi`, `cơ`, `hồn`, `ấn`, `kim` | `mộc`, `phù`, `tinh`, `trận` | `sinh`, `mộng`, `tâm`, `huyết` | MAG, Ngộ Tính | Khôi lỗi hoạt hóa bào mòn cảm xúc |
| `ta_am` | Tà Âm | `âm`, `hồn`, `tử`, `tâm`, `vô` | `mộng`, `ảo`, `nguyệt`, `tinh` | `lôi`, `quang`, `sinh`, `thiên` | Ngộ Tính, SAN | Có thể gọi nhầm người chết |
| `mong_canh` | Mộng Cảnh | `mộng`, `tâm`, `ảo`, `vô`, `âm` | `hồn`, `tinh`, `thủy`, `nguyệt` | `kiếm`, `sát`, `kim`, `chiến` | Ngộ Tính, SAN | Ký ức thật và giả hòa lẫn |
| `dao_the` | Đạo Thể | `thể`, `huyết`, `cốt`, `kim`, `hỏa`, `lôi` | `sơn`, `sinh`, `chiến`, `tử` | `hồn`, `mộng`, `ảo`, `vô` | Căn Cốt, PHY | Cường hóa cần đau đớn thật |
| `thien_co` | Thiên Cơ | `tinh`, `thiên`, `mệnh`, `cơ`, `địa` | `nhật`, `nguyệt`, `trận`, `long`, `vực` | `vô danh`, `đoạn mệnh`, `huyết`, `diệt` | Ngộ Tính, MAG | Biết tương lai làm giảm tự do lựa chọn |

### 10.1. Luật chọn và duy trì `[GIỮ NGUYÊN]`

```text
match_score = 3 × matched_lead_tags
            + 1 × matched_support_tags
            - 2 × matched_forbidden_tags

required_path_score(realm) = 3 + floor(realm_index / 2)
```

- Mở đường cần ít nhất một Mệnh dẫn.
- `match_score` phải đạt ngưỡng theo cảnh giới.
- Bộ Mệnh không được toàn Hung Cách.
- Tên, mô tả, `effects`, `type` và `tags` của Mệnh được chuẩn hóa chữ thường không dấu trước khi so khớp.
- Mệnh Số là nguồn tương hợp/điều kiện, không thay thế `pathId`.

### 10.2. Năm nấc chuyên môn `[GIỮ NGUYÊN]`

| Nấc | Mốc mở | Điều kiện cốt lõi |
|---|---:|---|
| Khai Lộ | 2 | Chọn đường và có Mệnh dẫn |
| Lập Ấn | 3 | Có hai tag dẫn/trợ và Công Pháp lõi |
| Chưởng Quyền | 6 | Hoàn tất nghi thức riêng của đường |
| Thần Tính | 10 | Có Neo ổn định, quyền năng riêng, không nợ quá hạn |
| Thành Thần | 14 | Tạo Quyền Năng độc quyền; không phải cấp 15 |

### 10.3. Hợp đồng registry canonical `[LOGIC MỚI — ĐÃ CHỐT]`

Mỗi path phải tồn tại đúng một entry trong registry. `pathId` là key duy nhất để runtime
tham chiếu; `displayName` chỉ phục vụ UI và narrative.

```json
{
  "pathId": "di_hoa",
  "displayName": "Dị Hỏa",
  "namespace": "path",
  "pathVariant": "normal",
  "ritualCatalogKey": "di_hoa",
  "professionNamespace": "separate"
}
```

- Không dùng tên nghề nghiệp làm `pathId`.
- Không dùng `displayName` để tính match, lưu state hoặc resolve effect.
- `ritualCatalogKey` phải trùng `pathId` để tránh catalog nghi thức trỏ nhầm đường.
- `pathVariant` của Nghịch Hành là lớp riêng, không tạo entry nghề nghiệp mới.
- Mọi effect cũ tiếp tục đọc từ path entry tương ứng sau khi đổi ID.

### 10.4. Chính sách phủ Mệnh Số `[LOGIC MỚI — BỔ SUNG DATA, GIỮ NGUYÊN LOGIC TÍNH ĐIỂM]`

Mỗi path không được chỉ trỏ vào vài Mệnh cụ thể. Resolver phải lấy toàn bộ Mệnh trong
`FATE_DATA` có tag thuộc pool của path, sau đó áp dụng công thức `match_score` cũ. Các
Fate cùng một family (`kim_*`, `kiem_*`, `than_*`, `tien_*`...) đều là ứng viên hợp lệ;
không hard-code một ID duy nhất làm Mệnh dẫn.

| Path ID | Lead tag pool mở rộng | Support tag pool mở rộng | Forbidden tag pool |
|---|---|---|---|
| `kiem_dao` | `kim`, `kiếm`, `sát`, `chiến`, `lôi` | `phong`, `hỏa`, `thể`, `cốt` | `mộng`, `ảo`, `vô`, `tâm` |
| `di_hoa` | `đan`, `hỏa`, `sinh`, `mộc`, `cốt` | `thể`, `lô`, `tử`, `nguyên` | `độc`, `hàn`, `diệt`, `vô` |
| `linh_van` | `phù`, `ấn`, `cơ`, `phong`, `lôi` | `kim`, `tinh`, `trận`, `vô` | `tử`, `huyết`, `diệt`, `vực` |
| `thien_menh` | `địa`, `sơn`, `thủy`, `trận`, `long`, `vực` | `tinh`, `mệnh`, `cơ`, `sinh` | `hư vô`, `diệt`, `sát`, `ảo` |
| `ngu_thu` | `thú`, `yêu`, `huyết`, `sinh`, `thể` | `sơn`, `nguyên`, `mộc`, `tâm` | `diệt`, `độc`, `vô`, `cơ` |
| `khoi_loi` | `khôi`, `cơ`, `hồn`, `ấn`, `kim` | `mộc`, `phù`, `tinh`, `trận` | `sinh`, `mộng`, `tâm`, `huyết` |
| `ta_am` | `âm`, `hồn`, `tử`, `tâm`, `vô` | `mộng`, `ảo`, `nguyệt`, `tinh` | `lôi`, `quang`, `sinh`, `thiên` |
| `mong_canh` | `mộng`, `tâm`, `ảo`, `vô`, `âm` | `hồn`, `tinh`, `thủy`, `nguyệt` | `kiếm`, `sát`, `kim`, `chiến` |
| `dao_the` | `thể`, `huyết`, `cốt`, `kim`, `hỏa`, `lôi` | `sơn`, `sinh`, `chiến`, `tử` | `hồn`, `mộng`, `ảo`, `vô` |
| `thien_co` | `tinh`, `thiên`, `mệnh`, `cơ`, `địa` | `nhật`, `nguyệt`, `trận`, `long`, `vực` | `vô danh`, `đoạn mệnh`, `huyết`, `diệt` |

#### 10.4.1. Resolver Mệnh dẫn

```text
leadCandidates(pathId) = tất cả Fate có ít nhất 1 tag trong leadTagPool(pathId)
supportCandidates(pathId) = tất cả Fate có tag trong supportTagPool(pathId)
forbiddenCandidates(pathId) = tất cả Fate có tag trong forbiddenTagPool(pathId)
```

- Mệnh có nhiều tag được tính theo từng tag như công thức cũ; không nhân đôi vì cùng một family.
- Một nhân vật chỉ cần ít nhất một Mệnh dẫn hợp lệ, nhưng các mốc cao có thể yêu cầu hai Mệnh dẫn khác family.
- Khi có Mệnh vừa thuộc lead vừa forbidden, `forbidden` thắng và Mệnh đó không được dùng làm Mệnh dẫn.
- Nếu một tag chưa có trong `FATE_DATA`, tag đó chỉ là reserved tag, không sinh ứng viên giả.
- Các family đang có trong catalog phải được resolve theo prefix/family, không chọn thủ công một vài Fate cấp cao.

#### 10.4.2. Khoảng thiếu giữa tài liệu và catalog Fate hiện tại

Các tag sau đang xuất hiện trong tài liệu nền nhưng chưa thấy trong `FATE_DATA`: `dược`, `lô`,
`mộng`, `nô`, `văn`, `câm`, `vô danh`, `huyệt`, `hư vô`, `độc`, `nhạc`, `nguyệt`, `quang`,
`thú`, `khôi`, `đoạn mệnh`. Đây là **khoảng dữ liệu cần bổ sung**, không được tự động coi là
đã tồn tại trong runtime. Trong lúc chưa bổ sung, resolver chỉ dùng tag thực sự có trong catalog;
logic cũ về điểm dẫn/trợ/cấm vẫn giữ nguyên.

## 11. Catalog nghi thức từng Con Đường `[CHUẨN HÓA THEO PATH ID MỚI]`

Bảng dưới đây giữ nguyên fantasy và mục tiêu của nghi thức cũ. Cách thực thi mới được đặt
ở mục 3.1 và chỉ được xem là áp dụng sau khi hoàn tất review.

| Path ID | Display name | Khai Lộ | Chưởng Quyền | Thành Thần |
|---|---|---|---|---|
| `kiem_dao` | Kiếm Đạo | Chém vật dẫn bằng kiếm chưa dính máu | Chém đứt một Mệnh Khế | Chém được “tên” của dị tượng |
| `di_hoa` | Dị Hỏa | Luyện đan bằng linh hỏa tự thân | Luyện đan chứa ký ức người chết | Tạo Sinh Đan không cần nguyên liệu |
| `linh_van` | Linh Văn | Viết phù bằng máu hoặc linh sa | Viết phù lên không gian | Ban Phù Luật buộc thế giới tuân theo |
| `thien_menh` | Thiên Mệnh | Nhận biết linh mạch trong một giờ | Đổi hướng một long mạch | Dựng Tiểu Thiên Địa ổn định |
| `ngu_thu` | Ngự Thú | Kết khế ước không cưỡng ép | Đồng hóa cảm giác với linh thú | Thành tổ huyết của một loài |
| `khoi_loi` | Khôi Lỗi | Tạo khôi lỗi có tên | Cho khôi lỗi tự chọn mệnh lệnh | Tạo thân thứ hai tự chủ |
| `ta_am` | Tà Âm | Gọi đúng một linh hồn | Chỉ huy nghi lễ bảy hồi | Gọi linh hồn chưa từng tồn tại |
| `mong_canh` | Mộng Cảnh | Ngủ qua dị mộng có chủ | Thắng bản ngã trong mộng | Viết lại giấc mơ của toàn vùng |
| `dao_the` | Đạo Thể | Chịu lôi kích không hộ pháp | Phá thân rồi tái tạo | Sống khi Chân Danh bị xóa |
| `thien_co` | Thiên Cơ | Đọc đúng một thiên tượng | Đổi một xác suất nhỏ của tương lai | Tạo chòm sao mang tên mình |

Mọi nghi thức trong bảng đều dùng đúng `pathId` mới và cùng pipeline:

```text
Gọi Mệnh → Dựng Neo → Đối Chiếu Con Đường → [Vượt Dị Tượng]
→ [Trả Giá] → Commit nghi thức
```

Tên nghi thức/fantasy được giữ nguyên ý nghĩa; chỉ thay tên path hiển thị và key tham chiếu.
Không dùng tên cũ như “Đan Đạo”, “Tinh Tượng Đạo” hoặc “Âm Luật Đạo” trong runtime UI/log mới.

### 11.1. Chuyển, song tu và dung hợp `[GIỮ NGUYÊN]`

- Trước cấp 4, chuyển đường mất EXP path hiện tại và phải thỏa điều kiện đường mới.
- Từ cấp 4, chuyển đường phải phá một Mệnh Khế, tăng `fateDebt` và tác động Neo.
- Song tu mở từ cấp 6; cả hai đường cần `match_score >= 5`, nghi thức liên quan tăng 10% SAN cost.
- Dung hợp mở từ cấp 10 khi hai đường có ít nhất một Mệnh trợ chung.
- Dung hợp tạo `hybridPath`, giữ lịch sử hai đường gốc và không tạo Con Đường Ẩn mới.
- Từ hai Mệnh cấm chưa hóa giải trở lên thì đánh dấu Dị Hệ và tăng Corruption ở nghi thức sau.

## 12. Nghịch Hành Đạo đầy đủ `[GIỮ NGUYÊN]`

Nghịch Hành là path variant, không phải nghề nghiệp và không phải Con Đường thứ mười một.

```text
negative_path_gate = Total_Fate >= normal_gate + 25
  AND matched_lead_fates >= 2
  AND matched_contrary_fates >= 1

negative_cost = base_cost × (1 + fate_debt × 0.10)
```

| Variant | Mệnh dẫn | Mệnh nghịch | Chi phí chính | Rủi ro |
|---|---|---|---|---|
| Sát Thần | `sát`, `chiến`, `huyết` | `nghiệp`, `hung`, `diệt` | Stamina tối đa -8%/nghi thức; SAN -3/boss | Hóa quái |
| Huyết Đan | `đan`, `huyết`, `hỏa` | `độc`, `tử`, `hao mệnh` | Khí Huyết -12%; Thọ Nguyên -2–8 năm | Chết hoặc mất phần lớn EXP |
| Thi Giải | `thi`, `hồn`, `âm` | `tử`, `oán`, `vô danh` | SAN tối đa -5; Khí Huyết -5% | Bị chiếm xác tạm thời |
| Phệ Mệnh | `mệnh`, `đoạt`, `tham` | `phản`, `hung`, `vực` | Corruption +8; tổn hại Mệnh mục tiêu | `FATE_BACKFIRE` |
| Tà Tụng | `tà`, `tụng`, `ngoại` | `điên`, `mộng`, `vô danh` | SAN -10; Corruption +12 | Bị Tà Thần đánh dấu |
| Khổ Hành | `khổ`, `thể`, `cốt` | `đoạn`, `huyết`, `đau` | HP hiện tại -15%; Stamina tối đa -5% | Thương tật vĩnh viễn |
| Vong Niệm | `quên`, `vô`, `đoạn mệnh` | `tâm`, `hồn`, `gia` | Mất ký ức và quan hệ NPC | Neo vỡ |

Mọi giảm chỉ số vĩnh viễn lưu trong `pathDebt`/`path_debt`, không reset khi đổi đường.
Danh xưng mặc định dùng mẫu `[tên Nghịch Hành] · [mẫu cảnh giới chung]` nếu chưa có đủ
14 danh xưng riêng.

## 13. Con Đường Ẩn và Dị Thể `[GIỮ NGUYÊN TỪ DI_CHI]`

### 13.1. Con Đường Ẩn

Con Đường Ẩn là nhánh hoặc biến thể mở qua gameplay, không phải Con Đường độc lập mặc định.
Nó giữ tags/match nền của đường gốc và thêm điều kiện/cái giá riêng.

| Con Đường Ẩn | Nguồn | Điều kiện | Đánh đổi/khác biệt |
|---|---|---|---|
| Ma Kiếm Đạo | Kiếm Đạo | Corruption >= 70 liên tục 30 ngày game | Sát thương cao hơn; Trả Giá trừ cả Khí Huyết và Thanh Tỉnh |
| Vô Danh Đạo | Ngoại lệ độc lập | `origin.background == vo_danh`, chưa gia nhập Faction tới cấp 8 | `match_score` luôn 0; Cấm Kỵ Tri Thức đến sớm hơn 50% |
| Tà Thần Khế Đạo | Bất kỳ | “Lắng Nghe” cùng một Tà Thần đủ 5 lần | Có Cấm Thuật độc quyền; `daoTam` tối đa 50 |

Mỗi nhánh mới phải khai báo đường gốc, tái sử dụng field/cơ chế đã có và có đánh đổi cụ thể.

`Vô Danh Đạo` là tên của một Con Đường Ẩn. Tên lộ trình độc lập trước đây được ghi là
“Kẻ Vô Lộ - Ngoại Đạo Giả” phải rút gọn thành `Ngoại Đạo Giả`; đây là lộ trình/role riêng,
không phải alias của `Vô Danh Đạo` và không được dùng chung `pathId`.

### 13.2. Dị Thể

Dị Thể khác Linh Căn: Linh Căn là kênh Ngũ Hành, Dị Thể là bản chất cơ thể. Dị Thể không
roll lúc tạo nhân vật và chỉ mở bằng trigger gameplay.

| Dị Thể | Lợi ích | Cái giá/trigger chính |
|---|---|---|
| Thánh Thể | Kháng 30% tốc độ Corruption | Tà Thần chú ý gấp đôi; 10 quest thiện liên tiếp |
| Hỗn Độn Thể | Dùng mọi hệ Ngũ Hành không phạt nội bộ | DaoTam tích lũy chậm 50%; đủ 5 Công Pháp khác hệ mastery Tiểu Thành |
| Vạn Độc Thể | Miễn poison/debuff độc; +20% sát thương Quái Dị Biến | SAN hồi khi nghỉ giảm 30%; sống sót 5 trận Quái Dị Biến |
| Cửu U Thể | Thấy Ambient Dread cao không mất SAN | -20% hiệu quả Hỏa/Quang; Cộng Minh với Mệnh `vo_he`/`di_he` |
| Bất Tử Thể | Mỗi cấp sống sót một đòn chí mạng một lần | Mỗi lần dùng +1 Biến Dị Thân Thể vĩnh viễn; Luân Hồi Thất Bại đúng 1 lần |
| Thiên Sinh Đạo Thể | +15% match_score trần với mọi đường | Độc bản server-wide; mở qua Hidden Lore Quest dài nhất |

## 14. Nghề Nghiệp và Con Đường Ẩn: vùng giao nhau `[ĐÃ PHÂN TÁCH]`

Nghề nghiệp thường là chuyên môn hành động, học qua thầy/quest và có mastery riêng. Con Đường
là trục tu luyện. Có thể cùng tồn tại, nhưng không cộng effect chỉ vì cùng tag.

| Vùng dễ trùng | Giữ nguyên nghề nghiệp | Con Đường giữ nguyên | Hướng xử lý đề xuất |
|---|---|---|---|
| Đan | Luyện Đan Sư | `di_hoa` | Tách namespace và tên path khỏi nghề; giữ Fate/effect nền |
| Tinh tượng | Tinh Tượng Sư | `thien_co` | Tách namespace và tên path khỏi nghề; giữ toàn bộ logic nền |
| Phù/trận | Nghề chế tác tương ứng | `linh_van`/`thien_menh` | Tách mô tả hành động khỏi triết lý tu luyện |
| Thể thuật | Nghề rèn thân nếu có | `dao_the` | Không dùng tên nghề làm path ID hoặc ngược lại |

### 14.1. Phân loại trạng thái thay đổi

- `[GIỮ NGUYÊN]`: logic đã có trong tài liệu nền, không tự ý đổi khi coding.
- `[LOGIC MỚI]`: đề xuất hợp nhất hoặc chuẩn hóa, cần review trước khi apply.
- `[CẦN REVIEW]`: điểm còn nhiều phương án, chưa được coi là quyết định gameplay.

Các logic mới được đề xuất trong bản canonical này:

1. Pipeline nghi thức bắt buộc `Gọi Mệnh → Dựng Neo` trước mọi bước kiểm tra/roll/commit.
2. Dùng `ritual state` với `anchorId`, `anchorType`, `stability`, `lastRenewedTurn` để nối nghi thức với Neo.
3. Tách tuyệt đối namespace `pathId/pathVariant` khỏi `hiddenPathId` và `professionId`.
4. Đổi trực tiếp `pathId` và tên hiển thị Con Đường để xử lý trùng với Luyện Đan Sư/Tinh Tượng Sư;
   giữ nguyên Fate, Công Pháp, tags, effects và quest.
5. Chuẩn hóa trạng thái nghề chưa chọn thành `dormant`, nghề đang dùng thành `active`.
6. Dị Chí chỉ lưu clue/discovery, không trực tiếp thực thi unlock hoặc effect.

Các mục trên là quyết định tài liệu đã chốt. Khi coding, phải thay toàn bộ reference path cũ sang
ID mới; không triển khai adapter cho save cũ.

## 15. Thứ tự ưu tiên khi tài liệu mâu thuẫn `[CANONICAL ORDER]`

1. Stable ID và schema save hiện hành.
2. Logic nền trong `HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`.
3. Các điều kiện/cái giá cụ thể trong `DI_CHI_CON_DUONG_AN_NGHE_AN.md`.
4. Chuẩn hóa pipeline và namespace trong tài liệu này `[LOGIC MỚI]`.
5. Tên UI, mô tả và alias chỉ là lớp hiển thị, không có quyền thay đổi gameplay state.

Trước khi coding phải đánh dấu từng thay đổi là `approved`, `deferred` hoặc `rejected`; không tự
đưa phần `[LOGIC MỚI]` vào runtime chỉ vì nó đã xuất hiện trong tài liệu.
## 16. Quyết định canonical đã chốt và áp dụng runtime

Phần này có quyền ưu tiên khi các mục cũ còn dùng thuật ngữ hoặc pipeline khác.

### 16.1. Namespace và registry

- Dùng một registry chung `hiddenPath.catalog`; mỗi entry bắt buộc có `sourceType`.
- `co_than_tan_hon` chỉ dành cho encounter Cổ Thần Tàn Hồn; `gameplay_trigger` dành cho hidden path mở bằng trigger gameplay riêng.
- `ngoai_dao_gia` có `namespace: unbound`, là trạng thái/ngoại lệ tại Khai Lộ, không thuộc mười Con Đường chính.
- `vo_danh_dao` là hidden path riêng, không phải alias của `ngoai_dao_gia`.

### 16.2. Hidden path lifecycle

Có thể biết nhiều hidden path ở trạng thái `dormant`, nhưng chỉ một `hiddenPathId` được `active`. Không đổi tùy ý; muốn đổi phải dùng nghi thức tháo Neo, trả 8 SAN và nhận 5 Corruption cùng risk record. Chọn `seal` kết thúc encounter vĩnh viễn.

### 16.3. Debt, corruption và Hybrid

- `fateDebt` là tổng nợ Mệnh; `pathDebt` là ledger nợ riêng của Nghịch Hành/chuyển đường.
- Mỗi entry phải có `source`, `createdDay`, `permanent`; một penalty chỉ được ghi vào một ledger.
- `player.corruption` là state canonical; `corruptionRating` chỉ là mirror UI.
- `hybridPath` giữ effect nền; `pathVariant` giữ cost/phản phệ. Không tạo slot path thứ ba. Cost Nghịch Hành tăng 25% khi đang Hybrid.

### 16.4. Các cấp độ

`realmLevel` là cảnh giới; `pathLevel` là cấp Con Đường; `ritualMilestone` là mốc nghi thức; `professionMasteryStage` là mastery nghề sinh hoạt. Không được dùng field nghề để kiểm tra điều kiện path.

### 16.5. Trigger Cổ Thần và ritual failure

Encounter Cổ Thần được xét khi vào node hoặc khi thời tiết chuyển sang `am_vu`, nhưng chỉ tạo encounter sau action chủ động `Lắng Nghe`; Search thường không mở encounter.

Mỗi milestone có schema lỗi:

```json
{
  "failureLog": [{
    "step": "call_fate|anchor|compare|omen|cost|commit",
    "reason": "stable_reason_code",
    "message": "narrative message",
    "failedDay": 1,
    "impact": { "san": 0, "corruption": 0, "fateDebt": 0, "anchor": null },
    "permanent": false
  }],
  "lastFailure": null
}
```

`Gọi Mệnh → Dựng Neo` là pipeline setup bắt buộc. Mục 3 định nghĩa contract/state machine; mục 11 chỉ là catalog fantasy/effect từng path, không định nghĩa lại commit, cost hoặc thứ tự step.
---

## AMENDMENT 2026-09-16 — NAMESPACE VÀ SLOT NGHỀ

`pathState` và `professionState` là hai namespace độc lập. `pathState.hiddenPathId`/các path record biểu diễn **Con Đường Ẩn**, còn `professionState.primaryId` và `professionState.secondaryId` biểu diễn nghề. `secondaryId` chỉ nhận id thuộc `hiddenProfessions` sau khi Cổ Tịch Tà Thần đã thỏa điều kiện mở.

Luật khóa: chọn nghề chính sẽ khóa mọi nghề thường còn lại; không có lựa chọn nghề thường thứ hai. Mỗi nhân vật chỉ có tối đa một nghề phụ ẩn. Việc mở khóa không tự động trang bị nghề; người chơi phải chọn Nghề Ẩn đã mở để lấp slot phụ. UI và log phải gọi đúng “Con Đường Ẩn”, “Nghề Ẩn”, “Nghề chính”, “Nghề phụ”.


### Source: `archive-requirements\logic-history\01-core\PROFESSION_CANONICAL_READ_BOUNDARY_2026-09-17.md`

# Profession Canonical Read Boundary — 2026-09-17

`canonicalHiddenProfessionId(state)` là read boundary duy nhất cho logic runtime
cần biết Nghề Ẩn. Resolver ưu tiên `professionState.secondaryId`, sau đó mới
dùng `player.hiddenProfession` như compatibility mirror của save cũ.

Các điều kiện Con Đường, Ngoại Đạo Giả, trial và final victory không còn đọc
trực tiếp field legacy. Migration vẫn mirror `player.hiddenProfession` để UI và
save cũ không mất dữ liệu, nhưng write canonical phải đi qua
`professionState.secondaryId`.

Regression kiểm tra cả canonical secondary và legacy fallback.


### Source: `archive-requirements\logic-history\01-core\PROFESSION_NAMESPACE_AND_SAVE_NORMALIZATION_2026-09-16.md`

# PROFESSION NAMESPACE + SAVE NORMALIZATION 2026-09-16

## Canonical fields

- Nghề chính: `state.professionState.primaryId`.
- Nghề Ẩn/nghề phụ: `state.professionState.secondaryId`.
- Danh sách unlock history: `state.professionState.hiddenIds`.
- Candidate cũ chỉ là compatibility metadata, không phải nghề đang hoạt động.
- `state.player.hiddenProfession` chỉ là projection tương thích; runtime đọc slot canonical.

## Lock rule

Chọn Nghề chính thành công đặt `selectionLocked = true` ngay trong cùng transaction. Sau đó mọi profession thường bị từ chối; chỉ definition nằm trong hidden profession registry và đã unlock bằng Cổ Tịch mới được chọn vào `secondaryId`.

## Normalization

1. Nếu `secondaryId` thiếu nhưng `player.hiddenProfession` hợp lệ và đã unlock, copy vào secondary.
2. Nếu `player.hiddenProfession` trùng nghề chính nhưng không có hidden unlock, xóa projection sai và giữ primary.
3. Nếu có nhiều hidden IDs active, giữ `secondaryId`, chuyển phần còn lại thành history.
4. Không migrate path ID sang profession ID.
5. Không cần bảo toàn rule cũ cho phép đổi nghề thường; rule canonical mới thắng.


### Source: `archive-requirements\logic-history\02-progression\PROFESSION_NAMESPACE_MIGRATION_CANONICAL_2026-09-16.md`

# Canonical profession namespace migration — 2026-09-16

## Purpose

The runtime has one authoritative profession namespace:

- `professionState.primaryId`: the single primary profession.
- `professionState.secondaryId`: the single hidden profession slot.
- `professionState.hiddenId`: compatibility mirror of `secondaryId`.
- `professionState.hiddenIds`: deduplicated historical/owned hidden-profession IDs.
- `player.hiddenProfession`: compatibility mirror of the active hidden profession.

Normal professions must never be copied into `secondaryId`, `hiddenId`, or `hiddenIds`.
Selecting a primary profession immediately locks all other normal professions. A hidden
profession can only occupy the secondary slot after its Codex clue graph is unlocked.

## Load/migration rules

1. If an old save placed a valid hidden profession in `primaryId` and has no secondary
   profession, move it to `secondaryId` and clear `primaryId`.
2. Prefer a valid hidden `secondaryId`; otherwise recover a valid hidden `hiddenId` or
   `player.hiddenProfession` alias.
3. Discard invalid/normal aliases from the hidden namespace without deleting the primary
   profession record or mastery data.
4. Mirror `hiddenId` and `player.hiddenProfession` from the canonical secondary slot.
5. Deduplicate and filter `hiddenIds` against the hidden-profession catalog.
6. The migration is additive and deterministic; it runs during `ensureExpansionState`
   and is safe to run repeatedly.

## Acceptance and note

The migration must preserve hidden mastery/clue data, prevent a second normal profession,
and survive serialize/deserialize. Regression `testProfessionLegacyNamespaceMigration`
verifies a legacy hidden-primary save and an invalid normal secondary alias.

**Note chưa hoàn thiện:** browser visual QA for every legacy save shape remains a separate
gate; the runtime namespace/migration contract and automated regression are complete.


### Source: `archive-requirements\logic-history\02-progression\PROFESSION_NAMESPACE_RUNTIME_INVARIANTS_2026-09-17.md`

# Namespace Nghề chính / Nghề Ẩn — Runtime Invariants

## Canonical state

- `professionState.primaryId`: đúng một Nghề chính thường hoặc null.
- `professionState.secondaryId`: Nghề Ẩn duy nhất hoặc null; không được chứa nghề thường.
- `professionState.hiddenIds`: danh sách các Nghề Ẩn đã mở/đã biết, chỉ chứa ID có trong catalog Nghề Ẩn.
- `player.hiddenProfession`: alias tương thích đọc/hiển thị, luôn phải bằng `secondaryId` sau `ensureExpansionState`.
- `selectionLocked`: bằng `Boolean(primaryId)`. Sau khi commit Nghề chính, mọi nghề thường khác đều bị chặn vĩnh viễn trong flow hiện tại.

## Migration boundary

Save cũ có thể ghi hidden profession ở `player.hiddenProfession`, `hiddenId` hoặc nhầm vào `primaryId`. Normalizer chuyển ID Nghề Ẩn về `secondaryId`, dọn primary nếu đó là ID ẩn, rồi đồng bộ alias. Không khôi phục lựa chọn nghề thường cũ sau khi luật canonical đã khóa.

## Runtime acceptance

- Chọn Nghề chính lần đầu tạo record và khóa slot nghề thường ngay.
- Chỉ Nghề Ẩn đã có Cổ Tịch/manh mối và hoàn tất unlock graph mới được ghi `secondaryId`.
- Không có hai slot trùng ID, không có secondary là nghề thường, không có alias drift.
- `validateProfessionNamespace()` và `validateExpansionState()` phải báo lỗi khi save vi phạm các invariant.

## Chưa hoàn thiện

Visual QA của màn hình nghề trên browser thật vẫn cần xác nhận; runtime state, migration và action boundary đã có regression.


### Source: `archive-requirements\logic-history\02-progression\PROGRESSION_NAMESPACE_PATH_PROFESSION_DITHE_2026-09-16.md`

# Namespace Con Đường — Nghề — Dị Thể — 2026-09-16

Ba hệ thống là ba namespace độc lập:

| Namespace | State canonical | Ý nghĩa |
|---|---|---|
| Con Đường | `pathState.primaryPathId`, `secondaryPathId`, `hiddenPathId` | hướng tu luyện, nghi thức đột phá và tương hợp Mệnh |
| Nghề | `professionState.primaryId`, `secondaryId`, `hiddenIds` | nghề chính và nghề phụ; chọn nghề chính khóa nghề thường ngay |
| Dị Thể | `specialPhysiqueState.activeId`, `candidates`, `progress` | biến đổi thân thể/modifier, không tự khóa path hoặc profession |

Không dùng `pathId` để lookup nghề, không dùng `hiddenProfession` để kết luận Con Đường, và không dùng `specialPhysique` để tự ghi đè hai hệ thống kia. Song tu/dung hợp Con Đường chỉ được phép qua transition resolver explicit; hiện runtime chỉ lưu namespace dự phòng, không tự bật secondary path.

`GameExpansion.progressionNamespaceSnapshot(state)` là DTO review/UI canonical. Policy baseline:

- Chọn Nghề chính xong khóa nghề thường.
- Cổ Tịch Tà Thần chỉ mở Nghề Ẩn ở slot phụ; nếu chưa có Nghề chính thì Nghề Ẩn
  không được chọn trước. Ngay khi Nghề chính được commit, toàn bộ nghề thường
  khác bị khóa vĩnh viễn; chỉ một Nghề Ẩn hợp lệ từ Cổ Tịch mới có thể điền slot
  phụ. Không có đường tắt qua alias `hiddenProfession` hoặc save cũ.
- Dị Thể chỉ cung cấp modifier/branch và không khóa path/profession mặc định.

Trạng thái: **ĐÃ CODE baseline**, còn thiếu nội dung/điều kiện sản phẩm cho song tu thực sự và các ending Dị Thể nâng cao.


### Source: `archive-requirements\logic-history\DI_CHI_CON_DUONG_AN_NGHE_AN.md`

# Dị Thể · CON ĐƯỜNG ẨN · NGHỀ ẨN TÀ TỊCH — THIẾT KẾ + KHUNG TRIỂN KHAI HỢP LÝ
> Giải quyết đúng vấn đề: đây là những mô-típ tiên hiệp RẤT mạnh (dễ phá cân bằng nếu làm ẩu) nên
> cần 1 KHUNG GATING rõ ràng trước khi viết nội dung cụ thể — không phải thiếu ý tưởng mà thiếu
> NGUYÊN TẮC để ý tưởng không tràn lan/phá vỡ hệ thống đã có.

---

## 0. NGUYÊN TẮC GATING CHUNG (áp dụng cho cả 3 hệ dưới đây)

```
1. KHÔNG BAO GIỜ roll ngẫu nhiên lúc tạo nhân vật — cả 3 hệ đều chỉ MỞ KHÓA qua hành động/sự kiện
   cụ thể trong lúc chơi, không phải "may mắn từ đầu". Đây là điểm khác biệt CỐT LÕI so với Mệnh Số/
   Linh Căn (vốn roll random lúc tạo nhân vật) — Dị Thể/Con Đường Ẩn/Nghề Ẩn phải được "CHỨNG MINH
   XỨNG ĐÁNG" qua gameplay, không phải nhận không.
2. MỌI sức mạnh đều đi kèm cái giá RÕ RÀNG NGANG BẰNG (đúng triết lý xuyên suốt dự án) — không có
   ngoại lệ "OP miễn phí" nào trong 3 hệ này.
3. Tái sử dụng field/cơ chế ĐÃ CÓ làm điều kiện mở khóa (Corruption_Rating, daoTam, factionReputation,
   Luân Hồi Thất Bại, Tà Thần "Lắng Nghe"...) — KHÔNG tạo hệ điều kiện hoàn toàn mới cho riêng 3 hệ
   này, tránh phình to độ phức tạp.
4. Độ hiếm giảm dần nghiêm ngặt: Con Đường Ẩn (hiếm) > Nghề Ẩn Tà Tịch (hiếm hơn) > Dị Thể (hiếm nhất
   trong 3, ngang hoặc hơn Mệnh Số Tiên Phẩm).
```

---

## 1. Dị Thể (SPECIAL PHYSIQUE) — KHÁC LINH CĂN, LÀ BẢN CHẤT CƠ THỂ

Linh Căn = channel được hệ nguyên tố nào. Dị Thể = **bản thân cơ thể** đặc biệt ra sao — 2 trục hoàn
toàn khác nhau, 1 nhân vật có Linh Căn phổ thông vẫn có thể sở hữu Dị Thể hiếm.

### 1.1. Bảng Dị Thể đề xuất (mỗi cái đều 2 lưỡi, không có cái nào miễn phí)
| Dị Thể | Lợi ích | Cái giá |
|---|---|---|
| **Thánh Thể** | Kháng 30% tốc độ nhiễm Corruption | Tà Thần "dòm ngó" (mục 16 Worldview) tăng gấp đôi tần suất — ánh sáng quá chói thu hút bóng tối |
| **Hỗn Độn Thể** | Dùng MỌI hệ Ngũ Hành không bị phạt Tương Khắc nội bộ (mục 3B Công Pháp) | `daoTam` tích lũy chậm hơn 50% (hỗn mang khó kiên định 1 hướng) |
| **Vạn Độc Thể** | Miễn nhiễm poison/debuff độc, +20% sát thương lên Quái Dị Biến | SAN hồi phục khi Nghỉ Ngơi giảm 30% (cơ thể chai lì cũng làm tâm trí chai lì) |
| **Cửu U Thể** | Tự động thấy Ambient Dread mức Cao mà KHÔNG mất SAN (đã quen bóng tối) | -20% hiệu quả Công Pháp hệ Hỏa/Quang lên chính mình |
| **Bất Tử Thể** | 1 lần/Cấp: sống sót đòn chí mạng lẽ ra gây tử vong | Mỗi lần dùng, +1 Biến Dị Thân Thể VĨNH VIỄN (bất tử trả giá bằng nhân tính) |
| **Thiên Sinh Đạo Thể** | +15% match_score TRẦN với MỌI Con Đường | Cực hiếm (xem 1.2) + Tà Thần chú ý từ Cấp 1 (không chờ tới Cấp 5 như thường) |

### 1.2. Điều kiện mở khóa (KHÔNG random, theo mục 0.1)
```
Mỗi Dị Thể gắn với ĐÚNG 1 trigger cụ thể, không dùng chung công thức:
  Thánh Thể         -> hoàn thành 10 quest moral_choice theo hướng THIỆN liên tiếp không đứt quãng
  Hỗn Độn Thể        -> sở hữu đủ 5 Công Pháp khác hệ Ngũ Hành CÙNG LÚC ở mastery >= Tiểu Thành
  Vạn Độc Thể        -> sống sót qua 5 lần combat với Quái Dị Biến (NPC_MONSTER_SYSTEM.md mục 4.3)
                        mà KHÔNG dùng Diên Thọ Đan/hồi phục ngoài
  Cửu U Thể          -> đạt bậc Cộng Minh (FATE_RELATIONSHIP_COMPLETE.md) với 1 Mệnh hệ "vo_he"/"di_he"
  Bất Tử Thể         -> trải qua Luân Hồi Thất Bại (WORLDVIEW_ATMOSPHERE.md mục 14) ĐÚNG 1 lần — đây
                        là phần thưởng an ủi cho rủi ro nặng nhất của cơ chế đó
  Thiên Sinh Đạo Thể -> KHÓA ĐỘC BẢN SERVER-WIDE (tái dùng cơ chế mục 4 FATE_NEW_LOGIC_ADDENDUM.md),
                        chỉ 1 người toàn server, mở qua Hidden Lore Quest chuỗi dài nhất game
```

---

## 2. CON ĐƯỜNG ẨN (HIDDEN PATH) — TIẾN HÓA/RẼ NHÁNH TỪ 10 CON ĐƯỜNG GỐC

KHÔNG phải Con Đường thứ 11 độc lập — mỗi Con Đường Ẩn là **rẽ nhánh** của 1 trong 10 Con Đường gốc,
giữ nguyên `tags`/`match_score` nền nhưng có thêm lớp riêng.

### 2.1. Ví dụ cụ thể (mẫu để mở rộng thêm sau)
| Con Đường Ẩn | Rẽ nhánh từ | Điều kiện mở khóa | Khác biệt so với gốc |
|---|---|---|---|
| **Ma Kiếm Đạo** | Kiếm Đạo | Corruption_Rating >= 70 duy trì liên tục >= 30 ngày game TRONG KHI đang đi Kiếm Đạo | Vượt Dị Tượng đổi từ "Kiếm Ảnh" thành đối đầu chính cái bóng tà niệm của mình — qua được thì Kiếm Đạo "tà hóa" vĩnh viễn, sát thương cao hơn gốc nhưng Trả Giá giờ trừ CẢ Khí Huyết lẫn Thanh Tỉnh |
| **Vô Danh Đạo** | Bất kỳ (không rẽ nhánh, ĐỘC LẬP) | CHỈ mở nếu `origin.background == "vo_danh"` (mục 3.4.4 HE_THONG_HOP_NHAT) VÀ chưa từng gia nhập Faction nào tới Cấp 8 | Không có `tags` cố định — match_score LUÔN bằng đúng 0 (không sinh không khắc với path nào), NHƯNG mọi hiệu ứng Cấm Kỵ Tri Thức đến sớm hơn 50% (kẻ vô danh dễ chạm chân lý hơn) |
| **Tà Thần Khế Đạo** | Bất kỳ | Chọn "Lắng Nghe" (mục 16 Worldview) đủ 5 lần với CÙNG 1 Tà Thần | Con Đường gốc vẫn giữ, nhưng giờ có thêm 1 lớp "Khế Ước" — nhận trực tiếp 1 Cấm Thuật độc quyền của vị Tà Thần đó, đổi lại `daoTam` không thể vượt quá 50 (đã "bán" một phần ý chí) |

### 2.2. Nguyên tắc mở rộng thêm Con Đường Ẩn sau này
```
Mỗi Con Đường Ẩn PHẢI trả lời được 3 câu hỏi trước khi thêm vào bảng:
  1. Rẽ nhánh từ Con Đường gốc nào (hoặc xác nhận rõ là ngoại lệ độc lập như Vô Danh Đạo)?
  2. Điều kiện mở khóa dùng field/cơ chế ĐÃ CÓ nào (không tạo field mới)?
  3. Đánh đổi cụ thể là gì — không có Con Đường Ẩn nào được phép THUẦN LỢI so với gốc?
```

---

## 3. NGHỀ ẨN TỪ CỔ THẦN TÀ TỊCH (nối trực tiếp Nghề Ẩn + Tà Thần đã có)

Khác Nghề Nghiệp thường (Luyện Đan Sư/Luyện Khí Sư/Trận Pháp Sư ở `PHAC_THAO_TU_VI_CON_DUONG_V3.md`
mục H — những nghề đó học được qua thầy dạy bình thường) — Nghề Ẩn Tà Tịch CHỈ đến từ 1 nguồn duy
nhất: **Tà Tịch** (Cổ Thư Tà Thần) — vật phẩm cực hiếm, đọc là có giá ngay (không đọc thử vô hại).

### 3.1. Vật phẩm "Tà Tịch" — nguồn gốc và cái giá khi ĐỌC (chưa cần học nghề đã có giá)
```
Tà Tịch {
  linkedTaThanId: 1 trong 4 vị đã có (NPC_MONSTER_SYSTEM.md mục 1B.2)
  onRead: {
    corruptionGain: 15-25 (tùy vị Tà Thần),
    sanLoss: 10-20,
    unlockNgheAnId: string  // chỉ mở khóa NGHỀ, chưa tự động thành thạo — vẫn cần luyện tập như
                             // nghề thường sau khi đã "biết tới" nó
  }
}
```
Nguồn nhận Tà Tịch: RẤT hạn chế — chỉ rơi ra từ Bí Cảnh liên quan Tà Thần (mục 6
`WORLD_INTERCONNECTION_SYSTEM.md`), hoặc phần thưởng chuỗi quest "Tổ Chức Ngầm Thờ Tà Thần" (đã
phác thảo trước, hướng "Thâm Nhập Thật Sự").

### 3.2. Bảng Nghề Ẩn theo từng Tà Thần (mỗi vị 1 nghề, tránh dàn trải quá nhiều)
| Tà Thần | Nghề Ẩn | Khả năng đặc trưng | Giới hạn/cái giá vận hành |
|---|---|---|---|
| Vô Diện Cuồng Vương (Điên Loạn) | **Cuồng Ngôn Giả** | Có thể gây SAN Drain trực tiếp lên NPC/địch qua HỘI THOẠI (không cần combat) | Mỗi lần dùng, bản thân cũng chịu SAN Drain nhẹ (nói lời điên loạn cũng tự làm tâm trí mình lung lay) |
| Thực Cảnh Đại Đế (Hủy Diệt) | **Thực Cảnh Sư** | Có thể "ăn" 1 phần Corruption của node Dị Biến để tạm thời hạ cấp độ ô nhiễm (MAP_SYSTEM.md 6.6) | Corruption đã "ăn" CHUYỂN THẲNG vào Corruption_Rating bản thân — dọn dẹp thế giới bằng cách tự nhiễm độc |
| Huyễn Sắc Cổ Thần (Dục Vọng) | **Huyễn Ảnh Sư** | Tạo phân thân ảo đánh lừa địch/NPC (combat utility mạnh) | NPC Chính Đạo có % nhận ra "sự giả dối" trong người dùng nghề này, factionReputation khó tăng hơn vĩnh viễn |
| Vong Danh Chi Chủ (Lãng Quên) | **Vong Ngữ Sư** | Giao tiếp được với NPC/vật đã "chết"/Mộ Phần Tiền Kiếp (K.1 đã phác thảo) — mở lore ẩn không ai khác tiếp cận được | Mỗi lần dùng có % nhỏ QUÊN 1 thông tin/quan hệ NPC ngẫu nhiên của chính mình (đúng bản chất Lãng Quên) |

### 3.3. Vì sao GIỚI HẠN đúng 4 nghề (1 nghề/Tà Thần), không nhiều hơn
```
Tránh dàn trải nội dung mỏng — 4 nghề CHẤT LƯỢNG CAO, mỗi nghề gắn chặt bản sắc 1 vị Tà Thần, dễ
nhớ/dễ tạo lore xoay quanh, hơn là 10-15 nghề na ná nhau khó phân biệt. Nếu sau này cần mở rộng,
ưu tiên làm SÂU thêm (nhánh trong 4 nghề này) trước khi thêm nghề thứ 5.
```

---

## 4. GỢI Ý KHÁC ĐỂ TĂNG TRẢI NGHIỆM (ngắn gọn, ngoài 3 hệ chính đã yêu cầu)

| Gợi ý | Lý do |
|---|---|
| UI cảnh báo TRƯỚC khi hành động sẽ kích hoạt điều kiện mở khóa Dị Thể/Con Đường Ẩn/Nghề Ẩn (không phải spoil trước, chỉ gợi ý mơ hồ kiểu "ngươi cảm thấy có gì đó đang thay đổi trong mình") | Tránh người chơi vô tình unlock rồi ngỡ ngàng không hiểu vì sao — vẫn giữ bí ẩn nhưng không đột ngột phi lý |
| Bách Khoa Chí Dị (đã có ở nhóm D) nên có mục riêng "Truyền Thuyết" liệt kê Dị Thể/Nghề Ẩn đã xác nhận tồn tại trong lore dù CHƯA ai đạt được — tạo mục tiêu dài hạn rõ ràng cho người chơi | Biến 3 hệ này thành động lực chơi tiếp, không chỉ bí mật ngẫu nhiên gặp được |
| Giới hạn: 1 nhân vật KHÔNG thể sở hữu quá 1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn Tà Tịch CÙNG LÚC (dù đủ điều kiện mở nhiều hơn) — buộc chọn lựa, tránh 1 nhân vật cộng dồn quá nhiều hệ hiếm gây phá vỡ cân bằng | Đúng tinh thần "đánh đổi", không phải "sưu tập hết mọi thứ hiếm" |

---

## 5. VIỆC CẦN LÀM TIẾP
1. Xác nhận giới hạn "1 Dị Thể + 1 Con Đường Ẩn + 1 Nghề Ẩn/nhân vật" ở mục 4 có áp dụng hay để tự
   do — đây là quyết định cân bằng quan trọng cần chốt trước khi code.
2. Viết thêm 2-4 Dị Thể nữa nếu 6 cái ở mục 1.1 chưa đủ đa dạng cho lâu dài (nhưng KHÔNG vội — giữ
   độ hiếm/chất lượng trước số lượng, đúng nguyên tắc mục 3.3 áp dụng chung).
3. Cân bằng số liệu cụ thể (% Corruption gain khi đọc Tà Tịch, ngưỡng ngày cho Ma Kiếm Đạo...) qua
   playtest thật, các số hiện tại là đề xuất định hướng.
---

## PHỤ LỤC CANONICAL 2026-09-16 — ĐỔI TÊN DỊ THỂ VÀ TÁCH HAI KHÁI NIỆM

Đây là bản hiệu chỉnh thuật ngữ áp dụng cho code mới và UI mới; các đoạn lịch sử giữ nguyên để truy vết.

1. **Dị Thể** là tên canonical thay cho cụm cũ “Dị Chí” khi nói về nhánh thức tỉnh/thể chất đặc biệt. Không dùng “Dị Chí” cho `specialPhysique`, trạng thái thức tỉnh hoặc tab tương ứng.
2. **Con Đường Ẩn** là một tuyến/định hướng vận mệnh độc lập (`pathId`/path state). Nó không chiếm slot nghề, không phải nghề, và không được đưa vào `professionState`.
3. **Nghề Ẩn** là một nghề phụ (`secondaryId`) mở bằng Cổ Tịch Tà Thần và chiếm đúng một slot nghề phụ. Nghề chính được chọn trước; sau lựa chọn đó, mọi nghề thường khác bị khóa vĩnh viễn. Chỉ Nghề Ẩn đã mở mới có thể lấp slot phụ.
4. Thanh trạng thái chỉ hiển thị Nghề chính trước khi Nghề Ẩn được mở; sau khi mở và cố định nghề phụ thì hiển thị thêm Nghề Ẩn. Không hiển thị Con Đường Ẩn trong danh sách nghề.
5. Các field legacy vẫn được migrate đọc được, nhưng resolver canonical phải ưu tiên `pathState` cho Con Đường Ẩn, `specialPhysiqueState` cho Dị Thể và `professionState.secondaryId` cho Nghề Ẩn.


