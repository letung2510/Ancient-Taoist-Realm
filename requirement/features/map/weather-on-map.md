# Bản đồ — Thời tiết trên bản đồ

## Mục đích

Cách bản đồ tiêu thụ thời tiết: sinh theo vùng và lan như mặt trận, tác động di chuyển/chiến đấu/linh khí, hiển thị trên các lớp bản đồ, hệ quả liên hệ thống (đình chiến, trú ẩn, thiên tai). Danh mục trạng thái, alias, hysteresis và lịch sử thời tiết thuộc [../weather/README.md](../weather/README.md); chi phí di chuyển theo đoạn: [movement-and-cost.md](movement-and-cost.md).

## Dữ liệu & trạng thái

- Danh mục runtime (`WEATHER_CATALOG`, severity 0–5): `quang` Quang Đãng 0, `mua` Mưa 1, `suong` Sương 1, `tuyet` Tuyết 2, `linh_phong` Linh Phong 2, `loi_vu` Lôi Vũ 3, `am_vu` Âm Vũ 4, `bao_linh_khi` Bão Linh Khí 5.
- `state.worldSimulation.regionState[regionId].weather`, `weatherUntilDay`; API `setWeather`, `updateWeather`, `weatherSnapshot`, `worldModifierPreview`, `getWorldModifiers`, `resolveNpcWeatherReaction`.

## Rules

### Sinh và lan truyền

| ID | Rule |
|---|---|
| MAP-WTH-001 | Thời tiết xác định theo `regionId` của node; node ở ranh giới dùng climate zone của node và gradient lân cận. Thời tiết là trạng thái chung theo vùng trong một save (mọi hệ thống trong vùng thấy cùng thời tiết). |
| MAP-WTH-002 | Mỗi world tick (1 ngày game), mỗi vùng roll theo `seasonalWeightTable[mùa][vùng]` cộng bias láng giềng: vùng kề (trên Thiên Đồ) đang Bão Linh Khí hoặc Âm Vũ → +20% cơ hội vùng này chuyển sang loại đó trong 1–3 ngày tới. Cùng seed, ngày và topology → cùng thời tiết. |
| MAP-WTH-003 | Thời tiết giữ ổn định tới `weatherUntilDay`, không reroll mỗi frame. |
| MAP-WTH-004 | Thời tiết vùng hiện tại đổi → ghi log có cấu trúc (trạng thái trước/sau, node, vùng, NPC, fog) và một dòng tường thuật ("Trời bắt đầu đổ mưa."); không ghi lặp trong cùng tick. |
| MAP-WTH-005 | Thời tiết không bao giờ xóa node hay liên kết; chỉ áp modifier và incident. Không biến vật cản cứng thành qua được (MAP-LC-014). |

### Tác động

| ID | Thời tiết | Tác động |
|---|---|---|
| MAP-WTH-010 | Quang Đãng | Mốc chuẩn, không modifier |
| MAP-WTH-011 | Mưa | Tốc độ ×0,8; chiến đấu +10% công pháp Thủy, −10% Hỏa; `linhKhiDensity` +10%; đường đất tăng nguy cơ |
| MAP-WTH-012 | Sương | +15% cơ hội phục kích khi di chuyển; −30% cơ hội lan tin "Nghe đồn"; Corruption lan +10% |
| MAP-WTH-013 | Bão Linh Khí | Ngự khí bị vô hiệu; mỗi ngày random một hệ +20% và một hệ −20%; `linhKhiDensity` +30%; rủi ro Tẩu Hỏa Nhập Ma +10% |
| MAP-WTH-014 | Tuyết | Tốc độ ×0,6; +10% Thổ/Kim, −10% Mộc; tuần tra tạm dừng; `dangerLevel` hiệu lực −1 |
| MAP-WTH-015 | Âm Vũ (hiếm; ban đêm hoặc vùng Corruption cao) | WrongnessLevel +2 bậc; Corruption lan ×2; tăng % Tà Thần dòm ngó; tăng hao tổn và nguy cơ; Con Đường Âm Luật Đạo +15% hiệu quả tu luyện |
| MAP-WTH-016 | Lôi Vũ, Linh Phong | Modifier theo danh mục thời tiết ([../weather/README.md](../weather/README.md)) |

| ID | Rule |
|---|---|
| MAP-WTH-017 | Thời tiết đi vào travel preview, world modifier (chiến đấu/di chuyển/tìm kiếm), phản ứng NPC và log có cấu trúc qua cùng resolver; UI không tự tính. |

### Hệ quả liên hệ thống

| ID | Rule |
|---|---|
| MAP-WTH-030 | Đình Chiến Tạm Thời: Tuyết hoặc Bão Linh Khí severity ≥ 4 ở vùng đang chiến tranh → không giải quyết trận nào ở vùng đó tới khi dịu; power thế lực ×0,5 trong thời gian này (MAP-INF-007). |
| MAP-WTH-031 | Trú ẩn: thời tiết xấu severity ≥ 3 → NPC `scheduleType: itinerant` dừng di chuyển tự do và về node thế lực gần nhất để trú ([npc-on-map.md](npc-on-map.md)). |
| MAP-WTH-032 | Thiên Tai Thường: Bão Linh Khí duy trì liên tục ≥ 3 ngày ở một vùng → kích hoạt một Thiên Tai Thường tại một node ngẫu nhiên (seeded) trong vùng ([../world-simulation/README.md](../world-simulation/README.md)). |
| MAP-WTH-033 | Dự báo: NPC Toán Mệnh Sư dự báo 1–3 ngày tới, độ chính xác = f(căn cốt NPC), có thể sai. |

### Hiển thị

| ID | Rule |
|---|---|
| MAP-WTH-040 | Thiên Đồ: overlay nhẹ theo vùng (mưa/tuyết/sương), thấy được mặt trận đang lan qua vùng kề. Lân Cận: icon nhỏ ở node theo thời tiết vùng. Chi tiết node: câu mô tả ngoài trời theo thời tiết (MAP-NODE-013). |
| MAP-WTH-041 | Vùng Linh Phong, Âm Vũ, cấm địa, di tích có biến thể tinh vân/đóm sáng riêng; hiệu ứng nhẹ, không giảm độ đọc. |
| MAP-WTH-042 | UI không hiện `undefined` khi vùng thiếu `description`; dùng `desc` hoặc tên vùng. Thời tiết vùng chưa khám phá không lộ ra UI. |

## Acceptance

1. Cùng seed, ngày, topology → cùng thời tiết.
2. Vùng kề Bão Linh Khí/Âm Vũ có xác suất cao hơn nhận thời tiết đó.
3. Ngự khí bị từ chối khi Bão Linh Khí.
4. Tuyết và Mưa làm đổi số ngày/rủi ro hành trình.
5. Chuyển thời tiết tại node người chơi tạo log có cấu trúc, không lặp trong tick.
6. Gate: `node tools/verify_local_movement_weather.js`, `node tools/verify_world_producer_matrix.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| MAP-WTH-001..005 | js/expansion.js:`updateWeather`, `setWeather`, `weatherSnapshot` | Khớp |
| MAP-WTH-011, 013, 014 (tốc độ) | js/expansion.js:`travelPlan` | Khớp |
| MAP-WTH-011..016 (chiến đấu/linh khí) | js/expansion.js:`getWorldModifiers`, `worldModifierPreview` | Khớp |
| MAP-WTH-017 | js/expansion.js:`getCurrentRegionViewModel`, `worldModifierPreview` | Khớp |
| MAP-WTH-030 | — | Thiếu |
| MAP-WTH-031 | js/expansion.js:`resolveNpcWeatherReaction` | Khớp |
| MAP-WTH-032..033 | — | Thiếu |
| MAP-WTH-040..042 | js/ui.js:`renderWorldMap`, `renderLocalMap` | Khớp |
