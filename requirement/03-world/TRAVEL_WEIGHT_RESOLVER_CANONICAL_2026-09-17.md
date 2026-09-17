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
