# MODULE CONTRACT — CÔNG PHÁP

> Luật gameplay chuẩn nằm trong `../HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md`. File này chỉ quy định contract dữ liệu và runtime của module Công Pháp; không lặp lại hệ cảnh giới, trận doanh hay Mệnh Số.

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
