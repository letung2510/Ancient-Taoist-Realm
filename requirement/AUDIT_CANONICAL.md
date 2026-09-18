# AUDIT CANONICAL - Requirement Repository

> This is the only audit file. Future audit/review/status/QA updates must be appended here.

- Consolidated: 2026-09-18 15:06:42
- Canonical logic: `SYSTEM_LOGIC_CATALOG/01..08`.
- Historical source files are preserved under `archive-requirements/audit-history/`.

## Mandatory audit rule

1. Audit records findings, evidence, status, and decisions only.
2. New or changed logic must be written to the canonical feature file at the same time.
3. Do not create a new audit, review, status, patch, or validator document for a follow-up update.

## Consolidated audit history


---

## Source: `01-core\CHARACTER_RUNTIME_STATUS_VALIDATOR_PATCH_2026-09-18.md`

# Bản vá Runtime Trạng thái Nhân vật — 2026-09-18

`validateCharacterRuntimeState` kiểm tra HP, Linh Khí, Thanh Tỉnh, Thể lực, Thọ nguyên không âm và không vượt max; Tà Nhiễm nằm trong 0–100, max Thanh Tỉnh tối thiểu 70 và max Thể lực hợp lệ.

Validator được gọi trong `validateExpansionState`, còn `updateDerived` là điểm chuẩn hóa sau action/save. Regression kiểm tra trạng thái Thanh Tỉnh âm bị bắt và được khôi phục sau recompute.


---

## Source: `01-core\CON_DUONG_NGHE_AN_NAME_COLLISION_REVIEW_2026-09-16.md`

# Review tên Con Đường và Nghề Ẩn  2026-09-16

## Phạm vi

Review trước khi code theo yêu cầu Task 8: kiểm tra nguy cơ lẫn tên giữa path và profession.

## Kết quả rà soát

- Nghề chính dùng các id như `luyen_dan`, `luyen_khi`, `tran_phap`, `tuong_su`; dữ liệu nghề nằm trong `professionDefinitions`.
- Nghề Ẩn nằm trong `hiddenProfessions`, được mở theo các mảnh Cổ Tịch Tà Thần và đi vào slot phụ.
- Con Đường dùng namespace path, ví dụ `dan_dao`, `kiem_dao`, `phong_thuy_dao`, `tinh_tuong_dao`; path có level/compatibility/tiến triển riêng.
- Có rủi ro UX vì mô tả cũ gọi nghề ẩn là con đường nghề ẩn, và một số path có hậu tố `*_dao`. Đây là rủi ro nhãn, không phải collision id trực tiếp.

## Quyết định trước khi code

1. Không đổi id save hiện có và không đổi tên path hàng loạt; đổi tên sẽ phá relation, save và dữ liệu legacy.
2. Giữ hai namespace/API: resolver cho Con Đường Ẩn và `professionAvailability()/chooseProfessionLocked()` cho Nghề Ẩn.
3. UI luôn thêm tiền tố rõ ràng: `Con Đường: ...`, `Nghề chính: ...`, `Nghề ẩn: ...`. Không dùng nhãn Con đường nghề ẩn.
4. Nếu sau này xuất hiện cùng display name, bắt buộc hiển thị loại đối tượng và id ổn định trong tooltip/debug; không đổi tên tùy tiện.

## Kết luận

Chưa cần đổi tên Con Đường hiện hữu. Cần sửa terminology, namespace resolver, slot rule và UI label; đây là phương án tương thích save và giảm rủi ro logic.


---

## Source: `01-core\fate\FATE_FEATURE_AUDIT_2026-09-09.md`

# FATE Feature Audit  2026-09-09

## Đã apply runtime

- Catalog 10.000, grade/sign maps, element/path affinity và split effects.
- Weighted resolver theo cấp, fallback grade, duplicate essence, pending reward và khóa Tiên trong single-save.
- Active/Vault invariant, equip/unequip/swap, sacrifice, fusion, upgrade.
- Pairwise relationship, combo, relationship stage 04.
- Dưỡng Mệnh có cooldown ngày, điểm quan hệ và hành vi thật.
- Cộng Minh, Giác Ngộ, Buông Mệnh Nguội, Nghịch Mệnh, Trấn Mệnh, Thiên Cơ.
- Fate Evolution đã là hệ thống nhánh biến thể; `transformFate` cung cấp contract và công thức chi phí, ủy quyền commit cho expansion transaction.

## UI/action wiring

Các card Mệnh active được decorate động với nút `Giác Ngộ`, `Buông Mệnh`, `Nghịch Mệnh`, `Trấn Mệnh` và `Mệnh Đổi` khi đủ điều kiện. `Thiên Cơ` được expose qua expansion command `fate_omen`; luồng nghi thức có thể gọi command này mà không bypass engine.

## Giới hạn còn lại

1. `FATE_TRANSFORM` chưa có biến thể riêng cho từng ID trong catalog; hệ thống dùng branch definitions của `GameExpansion` làm nguồn canonical.
2. Khóa Mệnh Tiên là per-save (`state.meta.uniqueFateOwnership`), chưa phải server multiplayer thật.
3. Relationship stage 3→4 vẫn gắn với nghi thức đột phá; không tự động tăng chỉ bằng Dưỡng Mệnh.

## Kiểm chứng

`node --check js/engine.js`, `node --check js/ui.js`, `node tools/verify_game.js` phải pass trước mỗi release.


---

## Source: `01-core\fate\FATE_GRADE_DISTRIBUTION_REVIEW.md`

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

Một Mệnh Phàm vẫn có thể còn giá trị ở cấp cao nếu tương hợp Con Đường, có hiệu ứng điều kiện hoặc dùng làm nguyên liệu dung hợp. Tuy nhiên, nếu phần thưởng mới liên tục rơi Phàm thì trải nghiệm bị cảm giác đang tiến cấp nhưng loot không tiến cấp.

## 3. Đánh giá hai phương án đang được cân nhắc

### Phương án A  đổi Phàm trong catalog từ 80% xuống 15%

Ưu điểm:

- giảm mạnh hiện tượng chọn đều nhưng toàn ra Phàm;
- các phẩm LinhĐịa xuất hiện thường xuyên hơn nếu mọi nguồn vẫn chọn đều.

Nhược điểm:

- thay đổi ý nghĩa của toàn bộ catalog 10.000 entry;
- các hệ thống cũ đang lọc theo số lượng entry sẽ bị thay đổi ngầm, khó cân bằng riêng từng nguồn;
- Phàm mất vai trò nguyên liệu phổ thông cho hiến tế, Hư Thiên Đỉnh, nhiệm vụ và giai đoạn đầu;
- vẫn không giải quyết đúng bài toán nếu một nguồn không được lọc theo cảnh giới: chỉ chuyển từ quá nhiều Phàm sang pool không có chủ đích.

Kết luận: **không nên dùng đây làm bản sửa đầu tiên**.

### Phương án B  giữ catalog, nhưng từ cấp 3 giảm Phàm còn khoảng 15% trong phần thưởng

Ưu điểm:

- đúng với nhu cầu tiến trình của người chơi;
- không phá rarity/lore của catalog;
- có thể điều chỉnh theo từng nguồn và từng cấp;
- giữ được Phàm cho nhiệm vụ, mua bán, dung luyện và hoạt động cấp thấp.

Nhược điểm:

- cần đưa logic trọng số vào một nơi dùng chung, tránh mỗi action tự đặt tỷ lệ;
- cần quy định rõ cấp 3 là cấp nhân vật hay phẩm cấp mục tiêu của phần thưởng.

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
| 12 | 65% | 30% | 5% | 0% | 0% | 0% | 0% | 0% |
| 34 | 15% | 45% | 25% | 10% | 5% | 0% | 0% | 0% |
| 56 | 5% | 20% | 35% | 25% | 10% | 5% | 0% | 0% |
| 78 | 2% | 10% | 25% | 30% | 20% | 10% | 3% | 0% |
| 9+ | 1% | 5% | 15% | 25% | 25% | 18% | 11% | 0% |

Đây là phân bố khởi điểm để test, không phải giá trị bất biến. Có thể thêm `sourceModifier`:

- chiến đấu thường: lệch xuống một bậc;
- tinh anh/boss: lệch lên một bậc hoặc tăng cơ hội phẩm cao;
- nhiệm vụ/cơ duyên cốt truyện: dùng bảng riêng, có thể bảo đảm phẩm tối thiểu;
- online/AFK: ưu tiên PhàmHoàng, không nên trao Huyền+ quá dễ;
- Khâm Thiên Giám: giữ cơ chế neo theo phẩm đang kích hoạt và pity riêng; Tiên phẩm chỉ mở qua nguồn đặc biệt;
- Hư Thiên Đỉnh: phẩm đầu vào quyết định cap, không roll từ toàn bộ catalog.

### 4.3. Bảo toàn ý nghĩa của Phàm phẩm

Không nên coi Phàm là vật bỏ đi từ cấp 3. Phàm vẫn nên có ít nhất một trong các vai trò:

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

- Ý kiến từ cấp 3 người chơi không còn cần nhiều Phàm là **đúng ở tầng phần thưởng**, nhưng không nên sửa bằng cách cắt catalog 80% xuống 15%.
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
>    - cấp 12: Phàm 65%, Linh 30%, Hoàng 5%;
>    - cấp 34: Phàm 15%, Linh 45%, Hoàng 25%, Huyền 10%, Địa 5%;
>    - cấp 56: Phàm 5%, Linh 20%, Hoàng 35%, Huyền 25%, Địa 10%, Thiên 5%;
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
> - Monte Carlo có seed cho từng cấp 12, 34, 56, 7+ và từng nguồn reward; sai số mục tiêu không quá ±1 điểm phần trăm sau tối thiểu 100.000 lượt.
> - Test không thể nhận Tiên từ reward thông thường.
> - Test Mệnh tương hợp thấp nhưng grade cao không tự động vượt Mệnh tương hợp cao grade thấp trong các gate đã quy định.
> - Chạy `node --check`, `node tools/verify_game.js`, kiểm tra diff và kiểm tra giao diện Mệnh Kho/nhận thưởng.
>
> ### Điều kiện rollback
>
> Rollback nếu có ID mất khỏi catalog, save cũ không migrate được, tỷ lệ cấp 3+ vẫn lệch quá 5 điểm phần trăm so với bảng, hoặc Hư Thiên Đỉnh/Khâm Thiên Giám bị thay đổi ngoài phạm vi. Rollback phải khôi phục cả data catalog và resolver reward, không chỉ khôi phục UI.

**Trạng thái:** Chờ người dùng approve prompt và bảng phân bố trên trước khi bắt đầu sửa code/data.

---

## Source: `03-world\MAP_BATCH_01_OXY_TOPOLOGY_AUDIT_2026-09-18.md`

# Batch 01 — Oxy topology và di chuyển bản đồ

## Phạm vi

Batch này chuẩn hóa lớp bản đồ trước khi rà soát tổ chức, chiến sự và sự kiện.
Nguồn tọa độ gameplay hiện tại là lưới số nguyên `0..100` cho cả `x` và `y`.

## Contract bắt buộc

- `x` tăng về Đông, `y` tăng về Nam.
- Bắc là `(x, y - 1)`, Nam là `(x, y + 1)`, Đông là `(x + 1, y)`, Tây là `(x - 1, y)`.
- Mỗi action di chuyển chỉ đi đúng một ô Manhattan; không được nhảy trực tiếp giữa hai node cách xa nhau.
- Node có tọa độ hợp lệ luôn expose đủ bốn hướng trong action context. Ô chưa từng khám phá được tạo lazy.
- `coordinateIndex` là registry duy nhất để tìm node tại một tọa độ; không tạo node trùng tọa độ.
- `exits` chỉ là cache runtime. Exit legacy hoặc save cũ không cùng tọa độ lân cận sẽ bị loại khi migrate.
- Liên kết runtime phải giữ nghịch đảo: Đông của A là Tây của B và ngược lại.
- Node procedural lấy `regionId` theo vùng gần nhất trên bản đồ, không chọn vùng ngẫu nhiên theo hash.
- Địa chỉ phường thị, điểm đản sinh, faction và tổ chức dùng cùng hệ Oxy; UI không tự dựng tọa độ từ label.

## Đã triển khai

- Thêm các primitive `coordinateKey`, `neighborCoordinate`, `nodeCoordinates`, `getNodeAtCoordinate`.
- `locationExits` sinh topology từ tọa độ, không dùng các exit authored cách xa làm đường tắt.
- `openWorldTarget` chỉ nhận target đúng ô kế cận; nếu chưa có thì tạo node lazy.
- Migration loại bỏ runtime edge cũ không hợp lệ.
- `validateOpenWorldGrid` kiểm tra bounds, duplicate, index mismatch và non-adjacent edge.
- UI action giữ các action nền tảng (Quan Sát, Hành Trang/Trạng Thái) khi bản đồ expose đủ bốn hướng.

## Regression gate Batch 01

```text
node --check js/engine.js
node tools/verify_game.js
node tools/verify_log_narrative.js
```

Batch chỉ chuyển sang phần Tổ chức khi toàn bộ gate trên đạt.


---

## Source: `03-world\MAP_SYSTEM_V2_APPLICABILITY_REVIEW.md`

# Map System V2  Applicability Review & Implementation Contract

## 1. Kï¿½t luï¿½n

Logic trong `MAP_SYSTEM_V2_COMPLETE.md` ï¿½p dï¿½ng ï¿½ï¿½c vï¿½o game hiï¿½n tï¿½i, nhï¿½ng khï¿½ng nï¿½n thay toï¿½n bï¿½ hï¿½ thï¿½ng map trong mï¿½t lï¿½n. Cï¿½ch an toï¿½n lï¿½ giï¿½ `locationId` vï¿½ graph `openWorld` lï¿½m lï¿½p tï¿½ï¿½ng thï¿½ch, sau ï¿½ bï¿½ sung `mapState`, `subLocationId` vï¿½ `travelTask`.

Khï¿½ng cï¿½n viï¿½t lï¿½i combat, quest, Hidden Realm hay NPC scheduler. Phï¿½n cï¿½ rï¿½i ro cao nhï¿½t lï¿½ travel vï¿½ `move()` hiï¿½n ï¿½i vï¿½ trï¿½ ï¿½ng bï¿½; nï¿½n bï¿½c bï¿½ng travel resolver thay vï¿½ ï¿½i semantics ngay lï¿½p tï¿½c.

## 2. ï¿½i chiï¿½u hiï¿½n trï¿½ng

| Thï¿½nh phï¿½n V2 | Hiï¿½n trï¿½ng | Khï¿½ nng ï¿½p dï¿½ng |
|---|---|---|
| L1 World Map | ï¿½ cï¿½ region, route, faction pin | Cao; bï¿½ sung influence heatmap |
| L2 Regional Map | ï¿½ cï¿½ node graph, exits, tï¿½a ï¿½ | Cao; thï¿½m fog/owner getter |
| L3 Node Detail | Chï¿½a cï¿½ sub-location | Cao; dï¿½ng mï¿½c ï¿½nh `main` ï¿½ tï¿½ï¿½ng thï¿½ch |
| L4 Instance | Hidden Realm runtime node ï¿½ cï¿½ | Cao; giï¿½ runtime namespace riï¿½ng |
| Influence gradient | ang thiï¿½n vï¿½ owner/faction t)nh | Cao; tï¿½nh derived tï¿½ graph vï¿½ power |
| Fog 03 | Chï¿½a cï¿½ ï¿½y ï¿½ | Cao; migrate tï¿½ `visitedLocations` |
| Claim/outpost/structure | Chï¿½a cï¿½ | Trung bï¿½nhcao; cï¿½n economy/task contract |
| Weighted travel | `move()` gï¿½n nhï¿½ tï¿½c thï¿½i | Trung bï¿½nh; cï¿½n adapter/task resolver |
| Fast travel | Chï¿½a cï¿½ unlock contract | Cao sau khi cï¿½ waystation/visited state |
| Patrol/bulletin | Chï¿½a cï¿½ UI contract ï¿½y ï¿½ | Cao; dï¿½ liï¿½u lï¿½y tï¿½ event/scheduler hiï¿½n cï¿½ |

## 3. State schema ï¿½ xuï¿½t

```js
state.mapState = {
  version: 2,
  fog: { [nodeId]: 0 },
  nodeVisits: { [nodeId]: 0 },
  subLocationId: { [nodeId]: "main" },
  subLocationVisits: {},
  influence: { [nodeId]: { [factionId]: 0 } },
  structures: { [nodeId]: [] },
  outposts: {},
  fastTravel: {},
  travelTask: null,
  bulletinSeen: {}
};
```

Compatibility rules:

1. `locationId` vï¿½n lï¿½ node ID; khï¿½ng ghï¿½p sub-location vï¿½o ID.
2. `subLocationId` chï¿½ lï¿½ context UI/action, mï¿½c ï¿½nh `main`.
3. Save ci ï¿½ï¿½c migrate: current location cï¿½ fog 2, location ï¿½ visit cï¿½ fog tï¿½i thiï¿½u 2, cï¿½n lï¿½i fog 0.
4. `openWorld` vï¿½n lï¿½ graph; map V2 chï¿½ thï¿½m derived/runtime state.
5. Dynamic nodes phï¿½i nï¿½m trong `worldSimulation.runtimeLocations`, khï¿½ng ghi ngï¿½ï¿½c vï¿½o static catalog nhï¿½ nguï¿½n dï¿½ liï¿½u chï¿½nh.

## 4. Node Detail (L3)

Mï¿½i node cï¿½ thï¿½ khai bï¿½o:

```js
subLocations: [
  { id: "main", type: "street", actions: ["travel", "observe"] },
  { id: "market", type: "market", actions: ["trade", "guild"] },
  { id: "hall", type: "hall", actions: ["talk", "petition"] }
]
```

Node nhï¿½ nï¿½n cï¿½ 12 sub-location; node lï¿½n 58. NPC cï¿½ `currentSubLocationId`, vï¿½ action resolver lï¿½c theo sub-location. Di chuyï¿½n trong cï¿½ng node chï¿½ tï¿½n action/time ngï¿½n, khï¿½ng tï¿½n mï¿½t ngï¿½y travel. Vertical slice nï¿½n lï¿½m trï¿½ï¿½c cho `son_mon`, `cho_linh` vï¿½ `hac_lam`.

## 5. Influence gradient

Expose cï¿½c API thuï¿½n dï¿½ liï¿½u:

```js
computeMapInfluence(state, nodeId)
mapInfluenceSnapshot(state, nodeId)
mapOwner(state, nodeId)
mapZoneStatus(state, nodeId) // stable | contested | frontier
```

Gï¿½i ï¿½ cï¿½ng thï¿½c:

```text
score(faction,node) = factionPower ï¿½ 0.70^graphDistance
                      ï¿½ (1 + structureBonus + eventBonus + outpostBonus)
```

Owner chï¿½ ï¿½ï¿½c hiï¿½n thï¿½ khi score cao nhï¿½t ï¿½t ngï¿½ï¿½ng vï¿½ hï¿½n faction thï¿½ hai ï¿½t nhï¿½t 15%; nï¿½u khï¿½ng lï¿½ `contested`. War ownership vï¿½ map influence lï¿½ hai lï¿½p riï¿½ng. Quest/event chï¿½ ï¿½ï¿½c delta cï¿½ cap theo ngï¿½y ï¿½ trï¿½nh mï¿½t nhiï¿½m vï¿½ ï¿½i chï¿½ toï¿½n vï¿½ng.

## 6. Fog of war

| Level | ï¿½ ngh)a | UI ï¿½ï¿½c phï¿½p hiï¿½n thï¿½ |
|---|---|---|
| 0 | Chï¿½a biï¿½t | Khï¿½ng spoil tï¿½n/NPC/route chi tiï¿½t |
| 1 | Cï¿½ tin ï¿½n | Tï¿½n vï¿½ng mï¿½ hï¿½, danger hint |
| 2 | ï¿½ thm | Node, route ï¿½ thï¿½y, owner hiï¿½n tï¿½i |
| 3 | Khï¿½o sï¿½t sï¿½u | Sub-location, patrol, bulletin, fast travel |

Fog 3 ï¿½t qua ï¿½t nhï¿½t 5 visits, outpost hoï¿½c waystation. Khï¿½ng dï¿½ng fog ï¿½ ï¿½n dï¿½ liï¿½u cï¿½n cho save/load hoï¿½c combat resolver.

## 7. Player agency

API nï¿½n cï¿½ transaction result thï¿½ng nhï¿½t:

```js
claimOutpost(state, nodeId)
buildMapStructure(state, nodeId, structureType)
petitionFactionTerritory(state, nodeId, factionId)
mapStructurePreview(state, nodeId, structureType)
```

Structure templates:

- `watchtower`: tng fog/influence vï¿½ giï¿½m patrol surprise.
- `waystation`: mï¿½ fast travel, giï¿½m travel risk.
- `trading_post`: tng trade yield, cï¿½n node cï¿½ market.
- `ward_formation`: giï¿½m encounter/curse risk, cï¿½n MAG/formation item.

Claim cï¿½n node frontier, khï¿½ng cï¿½ outpost ï¿½i ï¿½ch vï¿½ ï¿½ task/cost; mï¿½i node tï¿½i a 3 structures. Nï¿½u chï¿½a cï¿½ multiplayer, `ownerId` phï¿½i lï¿½ character/faction local, khï¿½ng giï¿½ ï¿½nh server authority.

## 8. Weighted travel

Tï¿½ch preview vï¿½ commit:

```js
travelPreview(state, fromId, toId, mode)
startTravel(state, fromId, toId, mode, options)
resolveTravelTask(state, taskId, result)
fastTravel(state, fromId, toId)
```

Mode mï¿½c ï¿½nh:

- `walk`: full graph distance, daily event rolls.
- `ngu_khi`: khoï¿½ng 1/3 thï¿½i gian, tiï¿½u hao resource, vï¿½n cï¿½ risk.
- `truyen_tong_tran`: gï¿½n nhï¿½ 0 ngï¿½y, chï¿½ khi hai ï¿½u ï¿½ unlock.

`move()` ci nï¿½n gï¿½i `startTravel(..., "walk")` ï¿½ compatibility mode. Escort giï¿½m risk; mï¿½i ngï¿½y travel roll patrol/weather/encounter. Chï¿½ commit location sau khi task hoï¿½n tï¿½t ï¿½ khï¿½ng phï¿½ cï¿½c action ang giï¿½ ï¿½nh vï¿½ trï¿½ ï¿½ng bï¿½.

## 9. Patrol, owner tag vï¿½ bulletin

Patrol khï¿½ng nï¿½n lï¿½ node ï¿½c lï¿½p trï¿½n graph. Render nï¿½ trï¿½n edge bï¿½ng schedule hiï¿½n cï¿½, vï¿½i icon danger/owner. Owner tag lï¿½y tï¿½ `mapOwner()` vï¿½ mï¿½u trï¿½ng thï¿½i (`stable`, `contested`, `frontier`). Bulletin board tï¿½i a 3 tin phï¿½ hï¿½p fog, lï¿½y tï¿½ faction/event state; khï¿½ng ï¿½a thï¿½ng tin cï¿½a node fog 0.

## 10. Rollout ï¿½ nghï¿½

1. **Phase A:** `mapState`, migration, fog 03, influence resolver.
2. **Phase B:** L3 cho ba node mï¿½u, NPC sub-location vï¿½ action filtering.
3. **Phase C:** outpost/structures, fast travel, bulletin/patrol UI.
4. **Phase D:** weighted travel task, escort, daily rolls; bï¿½t mï¿½c ï¿½nh sau khi regression pass.

Acceptance contract:

- Save ci load ï¿½ï¿½c vï¿½ khï¿½ng mï¿½t `locationId`/quest/combat state.
- Mï¿½i map action trï¿½ `{ success, reason, data }`, rollback khi thiï¿½u cost.
- Derived influence/fog cï¿½ thï¿½ rebuild deterministic tï¿½ state.
- Runtime Hidden Realm khï¿½ng lï¿½m bï¿½n static catalog.
- `verify_game.js` vï¿½ stress simulation vï¿½n pass; travel task khï¿½ng tï¿½o duplicate event/reward.

## 11. ï¿½nh giï¿½ cuï¿½i

Map V2 phï¿½ hï¿½p vï¿½i kiï¿½n trï¿½c hiï¿½n tï¿½i nï¿½u triï¿½n khai dï¿½ng additive adapter. Khï¿½ng nï¿½n thay `D.LOCATIONS`, khï¿½ng nï¿½n tï¿½o composite ID kiï¿½u `node/subLocation`, vï¿½ khï¿½ng nï¿½n biï¿½n `move()` thï¿½nh async ngay trong phase ï¿½u. Ba iï¿½m cï¿½n thiï¿½t kï¿½ kï¿½ nhï¿½t lï¿½ travel task, giï¿½i hï¿½n influence delta vï¿½ quyï¿½n sï¿½ hï¿½u outpost trong save ï¿½n ngï¿½ï¿½i chï¿½i.
## 12. Chi tiï¿½t triï¿½n khai theo module

### 12.1. `mapState` vï¿½ migration

Khï¿½i tï¿½o `mapState` ï¿½ mï¿½t factory duy nhï¿½t. Migration chï¿½y trï¿½ï¿½c mï¿½i resolver, bï¿½ sung default cho save ci vï¿½ giï¿½ nguyï¿½n quest/combat state. Heatmap, patrol projection vï¿½ bulletin chï¿½ lï¿½ dï¿½ liï¿½u rebuildable; khï¿½ng cï¿½n serialize toï¿½n bï¿½.

### 12.2. L3 adapter

Thï¿½m `getNodeDetail(state,nodeId)`, `enterSubLocation(state,nodeId,subLocationId)` vï¿½ `availableNodeActions(state,nodeId,subLocationId)`. Node chï¿½a khai bï¿½o detail nhï¿½n layout mï¿½c ï¿½nh `main`. UI khï¿½ng gï¿½i catalog trï¿½c tiï¿½p ï¿½ quyï¿½t ï¿½nh action; adapter phï¿½i kiï¿½m tra fog vï¿½ NPC occupancy.

### 12.3. Influence cache

Cache key gï¿½m `worldTick + factionVersion + structureVersion + eventVersion`. Quest thay ï¿½i influence chï¿½ invalidate node vï¿½ vï¿½ng kï¿½; cuï¿½i world tick full rebuild ï¿½ sï¿½a drift. Snapshot trï¿½ thï¿½m `confidence` vï¿½ `expiresAtTick` ï¿½ UI phï¿½n biï¿½t sï¿½ liï¿½u hiï¿½n tï¿½i/ï¿½ï¿½c tï¿½nh.

### 12.4. Fog/event pipeline

Mï¿½i nguï¿½n khï¿½m phï¿½ phï¿½t event `{ nodeId, level, source, actorId, tick }`. Reducer ï¿½p dï¿½ng max level, ghi journal mï¿½t lï¿½n vï¿½ invalidate L1/L2/L3. Rumor tï¿½ bulletin chï¿½ nï¿½ng fog khi player ï¿½c tin.

### 12.5. Outpost/structure service

Tï¿½ch ba lï¿½p `preview`, `commit`, `tickMaintenance`; preview khï¿½ng mutate, commit dï¿½ng transaction resolver, maintenance chï¿½y sau world tick. Integrity dï¿½ï¿½i 30% phï¿½t warning; tick ï¿½u thiï¿½u upkeep chï¿½ cï¿½nh bï¿½o, khï¿½ng xï¿½a outpost ngay.

### 12.6. Travel service

Giï¿½ `move()` lï¿½m compatibility wrapper. UI mï¿½i dï¿½ng `travelPreview` rï¿½i `startTravel`; engine tick gï¿½i `resolveTravelDay`. Combat/instance interrupt bï¿½ng `interruptTravel`, khï¿½ng tï¿½ sï¿½a `locationId`; chï¿½ task completed mï¿½i cï¿½p nhï¿½t location, visits, fog vï¿½ fast-travel unlock.

### 12.7. Projection/UI

World map nhï¿½n `heatmapProjection`; regional map nhï¿½n `nodeProjection + patrolEdges`; node detail nhï¿½n `detailProjection`; bulletin nhï¿½n `bulletinProjection`. Projection luï¿½n ï¿½p fog trï¿½ï¿½c khi trï¿½ UI ï¿½ khï¿½ng cï¿½ ï¿½ï¿½ng vï¿½ng lï¿½m lï¿½ static catalog.

## 13. Rï¿½i ro vï¿½ kiï¿½m soï¿½t

| Rï¿½i ro | Kiï¿½m soï¿½t |
|---|---|
| Travel async phï¿½ action ï¿½ng bï¿½ | Compatibility wrapper, commit khi completed |
| Heatmap lï¿½ch sau nhiï¿½u tick | Versioned cache + full rebuild ï¿½nh kï¿½ |
| Player chiï¿½m node quï¿½ dï¿½ | Frontier/threshold/cost/upkeep/contest decay |
| Fog lï¿½m hï¿½ng quest | Quest dï¿½ng canonical state, UI chï¿½ lï¿½c projection |
| Retry nhï¿½n ï¿½i reward | Idempotency key + transaction journal |
| Runtime node lï¿½m bï¿½n catalog | `runtimeLocations` lï¿½ source riï¿½ng |

## 14. Tiï¿½u chï¿½ hoï¿½n thï¿½nh

Map V2 chï¿½ ï¿½ï¿½c ï¿½nh dï¿½u hoï¿½n thï¿½nh khi bï¿½n phase pass regression, save migration vï¿½ stress simulation; tï¿½i thiï¿½u cï¿½ test cho tï¿½ng API mutation, interrupted travel, contested ownership, fog privacy vï¿½ transaction rollback.


---

## Source: `03-world\ORGANIZATION_BATCH_02_RUNTIME_AND_MAP_ADDRESS_2026-09-18.md`

# Batch 02 — Tổ chức: địa chỉ bản đồ và interaction runtime

## Phạm vi

Batch này nối catalog `GUILDS`/`WORLD_MAP.factions` vào node Oxy thật và bổ sung sổ quan hệ tổ chức độc lập với membership.

## Contract

- Mỗi guild/faction có một `nodeId` ổn định và `oxyNode` nguyên trong miền `0..100`.
- Organization node được đăng ký vào `GameData.LOCATIONS`, `WORLD_MAP.locations` và `state.openWorld` khi runtime khởi tạo; không nhân bản catalog tổ chức vào save.
- `organizationId` là ID canonical duy nhất; `guildMembership` chỉ biểu thị tư cách thành viên, không thay thế quan hệ xã hội.
- `organizationState.relations[id]` lưu reputation, favor, trust, heat, status, dịch vụ đã mở và ngày tương tác cuối.
- Interaction hợp lệ: `status`, `donate`, `request_aid`, `commission`, `share_intel`, `mediate`.
- `donate`, `commission`, `share_intel`, `mediate` giới hạn một lần mỗi ngày cho mỗi tổ chức; `request_aid` dùng Favor và là ngoại lệ.
- Interaction mutate yêu cầu người chơi đang đứng tại organization node; status chỉ đọc có thể gọi ở mọi nơi.
- Tọa độ tổ chức được lượng tử hóa về ô nguyên và chống trùng với node authored hiện hữu.

## Đã triển khai

- Bổ sung `nodeId` cho toàn bộ faction/guild address và đưa các address vào `byNodeId`.
- Runtime tự dựng authored organization node có `organizationId`, `mapNodeType`, region và tọa độ Oxy.
- Thêm `organizationSnapshot`, `organizationInteract`, `ensureOrganizationState`.
- Thêm action tại organization node cho xem quan hệ, quyên trợ và ủy thác.
- UI danh sách tổ chức hiển thị địa chỉ Oxy.

## Regression gate Batch 02

```text
node --check data/data.js
node --check js/engine.js
node --check js/expansion.js
node --check js/ui.js
node tools/verify_game.js
```

Không chuyển sang batch chiến sự/sự kiện tổ chức nếu địa chỉ node hoặc interaction contract chưa đạt gate.


---

## Source: `06-expansion\REWARD_PRODUCER_CANONICAL_AUDIT_2026-09-17.md`

# REWARD PRODUCER CANONICAL AUDIT  2026-09-17

## Contract

- One-time rewards from quest, contract, opportunity, hidden realm, collection, world event, tournament, war, prisoner, auction, companion, tomb and legacy use `grantCanonicalReward()` with a stable source/unique key.
- Replaying the producer must return a duplicate receipt and must not add EXP, merit, currency, item, Fate, technique or contribution again.
- Repeatable gameplay drops such as combat loot, search findings, crafting output and formation gathering are activity outputs, not one-time reward receipts; they remain deterministic through the replay RNG/action key contract.
- Reward summaries are presentation only and cannot mutate player resources.
- Quest contribution is included in the canonical receipt exactly once; the legacy fallback owns it only when the expansion reward service is unavailable.

## Regression evidence

`testQuestRewardCanonicalIdempotency()` now includes contribution and verifies two objective checks grant it once. Existing reward-ledger tests cover quest, prisoner, tainted reward, world event, auction, opportunity, hidden realm, companion, tomb and legacy paths.

## Remaining gate

Catalog balance/pity policy and producer-specific browser presentation remain content/UX review gates; they do not bypass the canonical ledger invariant.


---

## Source: `07-ui\BROWSER_QA_STATUS_2026-09-17.md`

# Browser QA Status  2026-09-17

## Evidence

- Local static HTTP server trả `index.html: 200`.
- Asset `assets/ui/map-illustration.webp` trả `200` và có payload 167192 bytes.
- Chrome automation mở `http://127.0.0.1:4173/index.html` bị môi trường chặn với `net::ERR_BLOCKED_BY_CLIENT` trước khi page được load.
- Thử lại qua `http://localhost:4173` và địa chỉ LAN `http://10.102.128.22:4174` cũng nhận cùng lỗi `net::ERR_BLOCKED_BY_CLIENT`.

## Kết luận

Asset/path integrity và headless render đã pass; pixel/responsive/browser interaction local chưa được tuyên bố pass vì Chrome bị chặn ở network boundary. Đây là giới hạn môi trường QA, không phải bằng chứng page runtime lỗi.


---

## Source: `07-ui\LOG_PRODUCER_AUDIT_CANONICAL_2026-09-17.md`

# Player log producer audit  2026-09-17

All JavaScript files under `js/` are now included in the static literal producer audit;
the audit no longer assumes only `engine.js` and `expansion.js` can emit history. It
checks `pushHistory`, `history`, and `emitGameEvent` literal candidates through the real
`formatPlayerLogText` boundary and rejects technical vocabulary or malformed narrative.

Dynamic/concatenated producers remain covered by `verify_expansion_log_matrix.js` and
`verify_log_narrative.js`, including mapped and unmapped internal error codes. Current
result: `66/66` literal producers pass and expansion matrix `43/43` passes.

**Note chưa hoàn thiện:** browser visual grouping QA remains environment-dependent; the
runtime formatter and static/dynamic producer checks are implemented.


---

## Source: `07-ui\UI_ACTION_BINDING_STATIC_AUDIT_2026-09-17.md`

# UI Action Binding Static Audit  2026-09-17

## Mục tiêu

Ngăn regression kiểu nút được render nhưng click không thực thi logic. Mọi nút mở rộng phải phát ra một command nằm trong command table của `runExpansionCommand`.

## Hợp đồng canonical

1. `js/ui.js` dùng `expansionButton("command", ...)` để phát command.
2. `js/main.js` chỉ bind một delegated click listener trên `#tab-content`, đọc `data-expansion-command`, rồi đưa thao tác qua `enqueueAction`.
3. `js/expansion.js` phải có handler cùng tên trong `runExpansionCommand`.
4. Command UI không được trùng trong các declaration tĩnh; command không tồn tại trong runtime bị xem là lỗi build/regression.
5. Command table có thể có handler chưa được UI gọi trực tiếp (phục vụ save cũ, automation hoặc content tương lai), nhưng chiều UI → runtime bắt buộc toàn vẹn.

## Kiểm tra tự động

`tools/verify_ui_surface_contract.js` trích toàn bộ `expansionButton("...")`, kiểm tra uniqueness, đọc command table runtime và fail nếu có command thiếu handler. Test này chạy cùng regression review batches.

## Trạng thái

- Đã hoàn thiện: delegated event binding, action queue và static UI→runtime command coverage.
- Chưa hoàn thiện: browser E2E trên local worktree phụ thuộc môi trường Chrome; static contract không thay thế kiểm thử click thật.


---

## Source: `AUDIT_DI_CHI_LOGIC_GAPS_UTF8_FIXED.md`

# AUDIT Dữ CHệ  LOGIC GAPS & IMPLEMENTATION NOTES

> Mục đượch: ghi nhận các logic còn thiếu, chưa nối hoặc chưa khợp giữa tại liệu và runtime.
> File này dẢnh cho review và bổ sung note trước khi triển khai code.
>
> Ngày audit: 2026-09-14  
> Phạm vi: Dị Thể, Dị Thể, NPC, Cổ Tích/Từ Tích, Con Đường Ẩn, weather, save và test.

## 1. Quy c trạng thái

| Trạng thái |  nghĩa |
|---|---|
| `MISSING` | Chưa có trong runtime |
| `PARTIAL` | Cổ một phần nhưng chưa đã flow/effect |
| `MISMATCH` | Runtime và tại liệu dùng logic/schema khệc nhau |
| `RISK` | Cổ nguy có lài logic hoặc state không nhất quán |
| `READY` | Đã có và còn test xác nhận |
| `ACCEPTED` | Đã được chỉt hệẨng xử là |

## 2. Dị Thể  Specũal Physique

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| PHY-001 | Catalog Dị Thể | Chưa có catalog runtime cho 6 Dị Thể | `MISSING` | P0 | |
| PHY-002 | State nhận vật | Chưa có `specũalPhysique`/`physiqueState` canonical | `MISSING` | P0 | |
| PHY-003 | Giới hạn số hƯu | Chưa enforce tại đa 1 Dị Thể/nhận vật | `MISSING` | P0 | |
| PHY-004 | Thánh Thể | Chưa có trigger 10 quest thiện liẨn tiếp | `MISSING` | P0 | |
| PHY-005 | Hỗn Độn Thể | Chưa kiểm tra 5 cùng phợp khệc Ngi Hình cùng đất TiƯu Thành | `MISSING` | P0 | |
| PHY-006 | Vạn Độc Thể | Chưa có counter 5 trên Quái Dị Biến và điều kiện không dùng hồi phục ngoi | `MISSING` | P0 | |
| PHY-007 | Cửu U Thể | Chưa nối trigger cùng minh `vo_he`/`di_he` | `MISSING` | P0 | |
| PHY-008 | Bất Tử Thể | Chưa nối động 1 lớn Luôn Hồi Thật Bổi | `MISSING` | P0 | |
| PHY-009 | Thiên Sinh Đạo Thể | Chưa có hidden lore quest server-wide và unique claim | `MISSING` | P0 | |
| PHY-010 | Effect runtime | Chưa áp dùng resistance, SAN, corruption, match score, cấu mởng | `MISSING` | P0 | |
| PHY-011 | Cost/phần phụ | Chưa lưu source, createdDay, permanent và số lớn đã dùng | `MISSING` | P1 | |
| PHY-012 | UI preview | Chưa có cảnh bảo/preview trước khi Dị Thể được kích hoạt | `MISSING` | P2 | |
| PHY-013 | Save/migration | Chưa có migration/state validation cho Dị Thể | `MISSING` | P1 | |

>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 3. Cổ Tích, Từ Tích và Nghề Ẩn

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| PROF-001 | 7 nghề Cổ Tích | Runtime có 7 nghề cũ theo số làẨng Cổ Tích | `PARTIAL` | P1 | |
| PROF-002 | 4 nghề Từ Tích | Tại liệu có Cuồng Ngôn Giả, Thực Cảnh Sư, Huyễn Ảnh Sư, Vong Ngã Sư nhưng runtime chưa có catalog | `MISMATCH` | P0 | Chỉt giữ 7 nghề, 4 nghề, hay hợp nhất catalog? |
| PROF-003 | `linkedTaThanId` | 7 nghề Cổ Tích chưa gần r vài Từ Thần | `MISSING` | P0 | |
| PROF-004 | Đãc Từ Tích | Chưa có item được Từ Tích/Cổ Thần tàn hồn vài cost SAN/corruption | `MISSING` | P0 | |
| PROF-005 | Từ Tích thật bổi | Chưa có trạng thái thật bổi, khóa vĩnh viẨn hoặc false clue | `MISSING` | P1 | |
| PROF-006 | Effect Cuồng Ngôn Giả | Chưa tác động SAN NPC/đượch qua hồi thoi | `MISSING` | P0 | |
| PROF-007 | Effect Thực Cảnh Sư | Chưa hệt corruption của node và chuyển vào player | `MISSING` | P0 | |
| PROF-008 | Effect Huyễn Ảnh Sư | Chưa tạo illusion clone trong combat/NPC | `MISSING` | P0 | |
| PROF-009 | Effect Vong Ngã Sư | Chưa giao tiếp vài người chỉt/vật quá khệ và risk quán memory | `MISSING` | P0 | |
| PROF-010 | Slot nghề | Cổ `primaryId`, `secondaryId`, `hiddenIds` động thái; còn xác nhận source of truth | `RISK` | P1 | |
| PROF-011 | Dormant profession | Còn bảo đảm nghề dormant không nhận passive/action/mastery | `READY` | P1 | Test thêm |
| PROF-012 | Giới hạn nghề | Chưa có validation r tại đa 1 nghề chính + 1 nghề Ẩn active | `PARTIAL` | P0 | |
| PROF-013 | Bách Khoa Chí Dị | Chưa có registry lore cho nghề đã biết/chưa unlock/bổ phong Ẩn | `MISSING` | P2 | |

>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 4. Con Đường Ẩn và Cổ Thần tàn hồn

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| PATH-001 | Catalog chung | Đã có `hiddenPath.catalog` | `READY` | P1 | Test toàn bổ consumer |
| PATH-002 | Trigger Ma Kiếm Đạo | Chưa enforce Corruption >= 70 liẨn tác 30 ngy khi đang Kiếm Đạo | `MISMATCH` | P1 | |
| PATH-003 | Trigger Vô Danh Đạo | Chưa enforce background `vo_danh` và giải hạn faction cấp 8 | `MISMATCH` | P1 | |
| PATH-004 | Trigger Tà Thần Khí Đạo | Chưa enforce cùng một Từ Thần được Lớng Nghe đã 5 lớn | `MISMATCH` | P1 | |
| PATH-005 | Encounter Cổ Thần | Đã có location/world/behavior gate chung | `PARTIAL` | P1 | Bổ sung trigger riêng tồng path |
| PATH-006 | Active/dormant | Đã giải hạn một hidden path active | `READY` | P1 | Test chuyển path |
| PATH-007 | Tháo Neo | Cổ cost SAN/corruption nhưng chưa có đẩy đã risk/lifecycle | `PARTIAL` | P1 | |
| PATH-008 | Schema canonical | Tại liệu dùng `pathState.*`, runtime dùng nhiều `player.*` | `MISMATCH` | P0 | Chọn một source of truth |
| PATH-009 | State validation | Chưa validate đẩy đã hidden path + Dị Thể + nghề Ẩn | `PARTIAL` | P0 | |
| PATH-010 | Phong Ấn encounter | Đã có seal, còn test không trigger lài vĩnh viẨn | `READY` | P1 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 5. Dị Thú và Companion

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| BEAST-001 | Spawn ecology | Chưa có hệ sinh thái spawn Dị Thể theo node/region/weather | `MISSING` | P1 | |
| BEAST-002 | Capture gating | Cổ capture từ entity/prisoner nhưng chưa đã rarity, danger, combat condition | `PARTIAL` | P1 | |
| BEAST-003 | Tame lifecycle | Cổ bổt  từ binh  thuẨn hòa | `READY` | P1 | Test edge cases |
| BEAST-004 | Combat integration | Companion chưa tham gia combat thật | `MISSING` | P0 | |
| BEAST-005 | Skill/passive | Effect hiện chỉ yêu scout/reveal/risk | `PARTIAL` | P1 | |
| BEAST-006 | Loyalty | Cổ loyalty nhưng chưa Ảnh hệẨng đẩy đã hành vi/combat/flee | `PARTIAL` | P1 | |
| BEAST-007 | Injury/death | Chưa có bổ thương, chỉt, một, hồi phục theo thái gian | `MISSING` | P1 | |
| BEAST-008 | Mutation | Cổ cure/accept/release mutation | `READY` | P1 | Kiếm tra combat effect |
| BEAST-009 | Vạn Độc Thể link | Chưa ghi nhận động combat Quái Dị Biến và hồi phục bổn ngoi | `MISSING` | P0 | |
| BEAST-010 | Collection | Cổ collection beasts nhưng chưa phần biết Dị Thể thương/hiám/có thển | `PARTIAL` | P2 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 6. NPC, Quest và Dialogue

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| NPC-001 | NPC schema | Cổ entity có bổn, nhưng nhiều NPC có `dialogue_id: null`, `quest_ids: []` | `PARTIAL` | P0 | |
| NPC-002 | Dialogue state machine | Chưa nối đẩy đã IDLE  CHECK  OFFER  PROGRESS  TURN_IN | `MISSING` | P0 | |
| NPC-003 | Quest giver | Chưa có `giver_npc_id` runtime | `MISSING` | P0 | |
| NPC-004 | Quest objective | Faction daily chỉ yêu dùng `faction_action` | `PARTIAL` | P1 | |
| NPC-005 | Quest prerequisite | Chưa xử là đẩy đã level/faction/prerequisite quest | `MISSING` | P1 | |
| NPC-006 | Quest icon | Chưa có `!`/`?` theo trạng thái quest trên NPC | `MISSING` | P1 | |
| NPC-007 | NPC encounter | Cổ encounter NPC-NPC và relationship delta | `PARTIAL` | P1 | Nối thêm quest/lore/faction |
| NPC-008 | NPC identity | Cổ persistent NPC có bổn nhưng chưa materialize deterministic theo population slot | `PARTIAL` | P1 | |
| NPC-009 | NPC state machine | Chưa có transition validator, reason/source/decũsionSeed | `MISSING` | P1 | |
| NPC-010 | NPC injury/missing | Chưa có injured/recovering/missing/found/retired lifecycle | `MISSING` | P1 | |
| NPC-011 | NPC trade | Merchant visit đã có fallback NPC, chưa có transaction/stock/schedule đẩy đã | `PARTIAL` | P1 | |
| NPC-012 | NPC faction order | Chưa có faction order thểc từ cho patrol, escort, war, bulletin | `PARTIAL` | P1 | |
| NPC-013 | NPC weather shelter | Cổ shelter nhưng schedule và reaction có thể ghi đã `subLocationId` | `RISK` | P1 | |
| NPC-014 | NPC scale | Chưa chọng minh được 1.000 NPC không scan O(N) mỗi frame | `MISSING` | P2 | Performance test |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 7. Weather, War và World Event

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| WORLD-001 | Weather canonical fields | Cổ weather/intensity/until/source/history | `READY` | P1 | |
| WORLD-002 | Weather hysteresis | Chưa có ngẨng vào/ra shelter r rẨng | `MISSING` | P1 | |
| WORLD-003 | War weather pause | Chưa xác nhận bảo/tuyt nẨng định chiện động được từ | `PARTIAL` | P1 | |
| WORLD-004 | Natural disaster | Cổ trigger Bảo Linh Khệ cường đã 5 ko dữi | `READY` | P1 | Test duration/reset |
| WORLD-005 | Disaster consequences | Incũdent có tạo nhưng chưa nối đẩy đã NPC/faction/map consequence | `PARTIAL` | P1 | |
| WORLD-006 | NPC weather behavior | Cổ mood/reaction/shelter nhưng chưa đã route/need integration | `PARTIAL` | P1 | |
| WORLD-007 | Itinerant merchant | Cổ cadence 3 ngy và fallback merchant | `PARTIAL` | P1 | Nối giao dữch thật |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 8. Save, canonical state và validation

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| SAVE-001 | Canonical version | Runtime serialize canonical v13 | `READY` | P1 | |
| SAVE-002 | Unknown content | Cổ lưu unknown world event/item/branch dormant/sealed | `READY` | P1 | |
| SAVE-003 | Dị Thể migration | Chưa có | `MISSING` | P0 | |
| SAVE-004 | Path state migration | `player.*` và `pathState.*` chưa động nhất | `MISMATCH` | P0 | |
| SAVE-005 | NPC runtime migration | Chưa validate đẩy đã node/subLocation/schedule state | `PARTIAL` | P1 | |
| SAVE-006 | Companion migration | Cổ companion default nhưng chưa version hòa riêng | `PARTIAL` | P1 | |
| SAVE-007 | Duplicate reward safety | Còn test quest/NPC/merchant retry không nhận thương hai lớn | `PARTIAL` | P1 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 9. UI và action wiring

| ID | Hạng mục | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| UI-001 | Dị Thể panel | Chưa có view/state hiện thể Dị Thể | `MISSING` | P1 | |
| UI-002 | Hidden profession panel | Cổ thể hiện thể 7 nghề, chưa phần Ảnh 4 Từ Tích | `MISMATCH` | P0 | |
| UI-003 | NPC quest icon | Chưa có | `MISSING` | P1 | |
| UI-004 | NPC dialogue action | Chưa có action đẩy đã | `MISSING` | P0 | |
| UI-005 | Warning/confirm | Chưa có preview cost/risk trước unlock | `MISSING` | P1 | |
| UI-006 | Narrative errors | Đã có wrapper nhưng còn kiểm tra reason code mỗi của NPC/Dị Chí | `PARTIAL` | P2 | |
>> Codex từ design catalog runtime, logic, API, tại liệu liẨn quan phần này. Sau đã triển khai code
## 10. Test coverage còn thiếu

| ID | Test | Hiện trạng | Trạng thái | Ưu tiên | Note bổ sung |
|---|---|---|---|---|---|
| TEST-001 | Dị Thể unlock/effect | Chưa có | `MISSING` | P0 | |
| TEST-002 | Từ Tích read/fail/lock | Chưa có | `MISSING` | P0 | |
| TEST-003 | Hidden path exact triggers | Chưa có đã | `PARTIAL` | P1 | |
| TEST-004 | Dị Thể combat/loyalty/death | Chưa có | `MISSING` | P0 | |
| TEST-005 | NPC dialogue/quest lifecycle | Chưa có | `MISSING` | P0 | |
| TEST-006 | Weather shelter hysteresis | Chưa có | `MISSING` | P1 | |
| TEST-007 | Merchant cadence/trade | Chưa có | `MISSING` | P1 | |
| TEST-008 | Save round-trip Dị Chí | Chưa có | `MISSING` | P0 | |
| TEST-009 | Duplicate reward/retry | Chưa có đẩy đã | `PARTIAL` | P1 | |
| TEST-010 | 1.000 NPC performance | Chưa có | `MISSING` | P2 | |

## 11. Cổc quyết định còn chỉt trước khi coding

1. Giữ song song 7 nghề Cổ Tích và 4 nghề Từ Tích, hay xem 4 nghề Từ Tích là catalog mỗi thay thể?
>> 7 nghề có tách là nghề phụ, 4 nghề Từ thển tồn hạn là con đãẨng phụ.
Nếu đã desgin 4 nghề con đãẨng phụ done rủi, xửy ra trạng làp vài 4 nghề từ tách thể bổ 4 nghề từ tách đi.

2. Dị Thể lưu  `state.player.specũalPhysique` hay `state.physiqueState`? >>  `state.player.specũalPhysique`
3. `state.player.*` hay `state.pathState.*` là source of truth cho path? >> Giới thểch cho tại 2 hám này trước
4. Dị Thể có được tham gia combat trúc tiếp hay chỉ là companion utility? >> Tham gia combat trúc tiếp.
5. NPC quest dùng chung `contractBoard` hay tạo `questState` riêng? >> Quest state riêng
6. Khi NPC không đã shelter, NPC số reroute, xửp hạng hay chuyển trạng thái `missing`? >> Codex từ chọn logic hợp là nhất
7. Cổc effect Dị Thể/Từ Tích có permanent hay có thể tháo/giải trừ? >> Cổ thể giải trừ, codex từ tạo logic

## 12. Kết quá kiểm tra hiện tại

- Syntax JavaScript: đất  các file runtime đã kiểm tra.
- Regression có bổn: đất.
- Semantic coverage Dị Thể: chưa đất.
- Semantic coverage Từ Tích: chưa đất.
- Semantic coverage NPC Quest/Dialogue: chưa đất.
- Semantic coverage Dị Thể combat lifecycle: chưa đất.
- Stress offline world event/war/NPC: chưa dùng làm blocker theo phụm vi đã thểng nhất.

## 13. Ghi chỉ người review

<!-- Bổ sung note, quyết định hoặc yêu cấu thay đối tại đẩy. -->

### Note 1

- Người ghi:
- Ngày:
- Nối dung:

### Note 2

- Người ghi:
- Ngày:
- Nối dung:

## 14. Quyết định đã approve  canonical implementation contract

Phần này là nguồn chỉ dẫn trúc tiếp cho Codex khi triển khai. Không được quay lài mở hành cũ nếu trủi vài các quyết định dữi đẩy.

### 14.1. Phần loại namespace

```text
7 Cổ Tích
   Nghề Nghiáp phụ
   dùng secondaryId
   PROF-003 đến PROF-005

4 Cổ Thần tàn hồn
   Con Đường Ẩn
   dùng hiddenPathId
   PROF-006 đến PROF-009 là effect của hidden path
```

Không tạo 4 Nghề Từ Tích riêng nếu effect tương Ẩng đã thuc 4 hidden path. Không dùng chung một ID cho `professionId`, `pathId`, `hiddenPathId` hoặc `pathVariant`.

### 14.2. Slot nghề canonical

```js
state.professionState = {
  primaryId: "luyen_dan",
  secondaryId: "doc_gia_co_tich",
  primaryLocked: true,
  secondaryLocked: true,
  discoveredHiddenIds: []
};
```

- `primaryId`: nghề sinh hoạt chính duy nhất.
- `secondaryId`: một trong bảy nghề Cổ Tích đang active.
- `discoveredHiddenIds`: danh sốch nghề Cổ Tích đã biết nhưng chưa chọn.
- Không dùng `hiddenIds` đã cấp passive/action/mastery nếu nghề chưa nám trong `secondaryId`.
- Nếu thật bổi chui Cổ Tích, `secondaryId` giữ `null`; nhận vật vẫn dùng nghề chính bình thương.
- Nghề phụ đã lock không được đối trúc tiếp; nếu còn đối phải qua nghi thểc phụ tách/giải khóa riêng.

### 14.3. Source of truth của Con Đường

```js
state.pathState = {
  primaryPathId: "di_hoa",
  secondaryPathId: null,
  hiddenPathId: null,
  pathVariant: "normal",
  hybridPath: null,
  pathLevel: 0,
  ritualMilestone: null,
  ritualByPath: {},
  transitionHistory: [],
  detachHistory: []
};
```

- `state.pathState` là canonical source cho mỗi logic Con Đường.
- `state.player.pathId`, `state.player.secondaryPathId`, `state.player.hiddenPathId` và `state.player.pathVariant` chỉ là runtime projection đã giữ tương thểch vài engine hiện tại.
- Mỗi thay đối path phải đi qua một API trung từm, cấp nhất `pathState` trước rủi mỗi động bổ sang `player`.
- `ensure()` phải khồi phục `pathState` từ canonical save; không từ suy diẨn hai state khệc nhau.
- `pathState.primaryPathId` phải phần Ảnh động path chính; không được đã null khi `player.pathId` đang active.

### 14.4. Ngoại Đạo Giả

Ngoại Đạo Giả là namespace `unbound`, không phải path chính và không ghi vào `pathId`.

Flow chọn Ngoại Đạo Giả phải được xử là trước mỗi kiểm tra `pathRelation()` hoặc kiểm tra path chính:

```text
Khai Là  chọn Ngoại Đạo Giả
         player.pathId = null
         player.unboundStatus.active = true
         pathState.primaryPathId = null
         không nhận path effect chính
```

Không đã `isUnboundPlayer()` chọn chính action dùng đã chọn Ngoại Đạo Giả. Sau khi đã unbound, không được chọn path chính nếu chưa có flow tháo trạng thái unbound hợp là.

### 14.5. Ritual Gọi Mệnh  Dựng Neo

Pipeline canonical:

```text
Gọi Mệnh
 Dựng Neo
 Đãi ChiƯu Con Đường
 Vt Dữ Tương
 Trừ Giữ
 Commit
```

Chuẩn field milestone:

```js
{
  id: "khai_lo",
  realmLevel: 2,
  pathLevel: 1
}
```

Không được dùng lài `milestone.level`. Mỗi điều kiện cảnh giải phải được `realmLevel`; mỗi tiên triển Con Đường phải được `pathLevel`.

Neo phải lưu đẩy đã:

```js
{
  anchorId,
  anchorType,
  stability,
  lastRenewedTurn,
  maintenance,
  broken
}
```

Quy tác:

- Gọi Mệnh và Dựng Neo chỉ là setup, không trừ cost commit.
- Neo phải tồn tại, có stability dữẨng và được reserve cho ritual đang chỉy.
- Không được dùng một Neo cho nhiều ritual active.
- Failure phải ghi `failureLog`, step, reason, impact và có thể tác động SAN/Corruption/Mệnh Nợ/Neo.
- Chỉ bổc Commit mỗi cấp nhất milestone và effect.
- Mỗi path phải có ritual state riêng trong `pathState.ritualByPath`.

### 14.6. Chuyển đãẨng

- Trước cảnh giải 4: một EXP của path hiện tại theo field path progression thểc từ.
- Từ cảnh giải 4: phụ một Mệnh Khí, tăng `fateDebt`, giảm stability Neo và ghi `transitionHistory`.
- Không reset `pathDebt` khi đối path.
- `pathVariant` thuc path cũ không được từ động mang sang path mỗi.
- Nếu đang có ritual active, không cho chuyển đãẨng.
- Nếu đang hybrid, phải yêu cấu xử là hybrid trước hoặc chuyển trạng thái r rẨng; không đã hybrid cũ ám thêm áp lớn path mỗi.

### 14.7. Song tu

- Mở từ cảnh giải 6.
- Hai path phải có `match_score >= 5`.
- Lưu hai path trong `pathState.primaryPathId` và `pathState.secondaryPathId`.
- Không tạo slot nghề hoặc path thể ba.
- Ritual liẨn quan tại song tu tăng 10% SAN cost.
- Không cho song tu nếu đã có secondary path khệc hoặc hybrid chưa được xử là.

### 14.8. Dung hợp

- Mở từ cảnh giải 10.
- Hai path phải có t nhất một Mệnh trụ chung.
- Dung hợp phải qua commit/cost/risk riêng, không chỉ gần object `hybridPath`.
- Kết quá lưu tại `pathState.hybridPath`, giữ làch số hai path gc.
- Không tạo slot path mỗi và không xửa hidden path.
- Nếu có từ hai Mệnh cấm chưa hòa giải, ghi trạng thái `Dữ Hệ` và tăng Corruption cho các ritual sau.
- Không cho dung hợp lớn hai nếu chưa có flow tại cấu trúc r rẨng.

### 14.9. Nghịch Hành

Nghịch Hành là `pathVariant`, không phải hidden path.

- Không ghi vào `hiddenPathId`.
- Không dùng `linkedTaThanId`.
- Cost Nghịch Hành ghi vào `pathDebt`, không cùng trạng cùng một penalty vào `fateDebt`.
- Khi Hybrid, cost Nghịch Hành tăng 25%.
- Corruption và path debt phải có ledger:

```js
{
  amount,
  source,
  createdDay,
  permanent,
  pathVariant,
  hybrid
}
```

- Không gi legacy activation rủi rollback state nếu có thể tách flow canonical trúc tiếp.
- `pathDebt` không reset khi chuyển path.

### 14.10. Hidden path từ Cổ Thần tàn hồn

- 4 nhậnh Cổ Thần tàn hồn là hidden path, không phải nghề.
- Cổ thể discovered/unlocked nhiều hidden path  dormant.
- Chỉ một hidden path active.
- Hidden path dormant không nhận effect, ritual hoặc title active.
- `seal` là kết thểc encounter vĩnh viẨn.
- `detach` còn Neo, cost, corruption và risk.
- Trigger tồng hidden path phải được kiểm tra riêng; không dùng duy nhất gate location/world/behavior chung.

### 14.11. Dị Thể

Dị Thể lưu tại:

```js
state.player.specũalPhysique = {
  id,
  status: "active",
  unlockedDay,
  source,
  createdDay,
  permanent: false,
  uses: 0,
  scars: [],
  removalState: null
};
```

- Chỉ được số hƯu tại đa một Dị Thể.
- Unlock bằng gameplay trigger, không roll làc tạo nhận vật.
- Effect phải được được từ catalog runtime, không hard-code rủi rc trong combat.
- Cổ thể giải trừ bằng nghi thểc Từy Thể; phải có cost, risk và scar/penalty.
- Mỗi unlock/removal/effect phải ghi source, day và history.

### 14.12. Dị Thể

- Companion tham gia combat trúc tiếp, không chỉ scout utility.
- Mỗi companion có combat profile, skill/passive, loyalty, health, corruption, injury và lifecycle.
- Loyalty Ảnh hệẨng khệ năng hệ trừ, bổ chỉy và mutation.
- Capture phải kiểm tra rarity, danger, trạng thái combat và điều kiện node.
- Vạn Độc Thể phải nhận progress từ combat Quái Dị Biến thật; dùng hồi phục ngoi phải reset hoặc loại progress theo được từ.

### 14.13. NPC Quest

NPC quest dùng `questState` riêng, không dùng `contractBoard` làm source of truth.

```js
state.questState = {
  available: {},
  active: {},
  completed: {},
  failed: {},
  npcIndex: {}
};
```

`contractBoard` chỉ dẢnh cho contract/faction bulletin projection.

Quest NPC phải hệ trừ:

- `giverNpcId`;
- dialogue state machine;
- prerequisite;
- objective progress;
- reward/penalty;
- quest icon;
- turn-in và duplicate reward protection.

### 14.14. Weather shelter

Khi shelter đẩy, NPC xử là theo thể từ:

1. Từm shelter hợp là gần nhất trong node.
2. Nếu không còn chỉ, xửp hạng vài `queuePosition`.
3. Nếu quá thái gian chỉ, reroute sang node an toàn gần nhất.
4. Chỉ chuyển `missing` sau khi reroute thật bổi theo số lớn giải hạn.

Không đã `updateNpcSchedules()` ghi đã shelter do `resolveNpcWeatherReaction()` vàa chọn. Mỗi thay đối phải đi qua transition API có `reason`, `source`, `day` và `decũsionSeed`.

## 15. Ưu tiên triển khai sau khi approve

1. P0: Dị Thể catalog/state/trigger/effect/save/validation.
2. P0: Chuẩn hòa `pathState` và sửa Ngoại Đạo Giả unreachable.
3. P0: Sửa `milestone.level` thành `realmLevel`, hoàn chính ritual failure/Neo.
4. P0: Tích 7 Cổ Tích thành nghề phụ và 4 Cổ Thần tàn hồn thành hidden path.
5. P1: Hoàn thiện chuyển đãẨng/song tu/dung hợp/Nghịch Hành.
6. P0: Companion combat lifecycle và Vạn Độc Thể integration.
7. P0: `questState` riêng cho NPC dialogue/quest.
8. P1: Weather shelter transition/reroute/hysteresis.
9. P1: Save round-trip và regression cho toàn bổ path/Dị Chí.

## 16. Điều Codex không được làm

- Không tạo thêm 4 nghề Từ Tích nếu chọng trạng effect vài 4 hidden path.
- Không dùng `professionId` đã đối diẨn cho hidden path.
- Không ghi Ngoại Đạo Giả vào `pathId`.
- Không cùng cùng một penalty vào có `fateDebt` và `pathDebt`.
- Không reset `pathDebt` khi đối path.
- Không cấp effect cho dormant hidden path/profession.
- Không commit ritual trước khi Gọi Mệnh, Dựng Neo và các gate trước đã hoàn từt.
- Không đã `player.*` và `pathState.*` từ thay đối được làp.
- Không dùng contract board làm quest state cho NPC.
- Không dùng regression syntax/pass có bổn làm bằng chọng rẨng logic Dị Chí đã hoàn chính.

## 17. Changelog triển khai Codex  2026-09-14

### Đã triển khai

- Catalog `specũalPhysiques` gám 6 Dị Thể và state `player.specũalPhysique`.
- API unlock/status/remove/progress cho Dị Thể.
- Save round-trip cho Dị Thể.
- `pathState.canonicalSource` làm có xác định state canonical; runtime projection được động bổ và `player.*`.
- Ngoại Đạo Giả được xử là trước `pathRelation()` và không ghi vào `pathId`.
- Ritual milestone dùng `realmLevel` và `pathLevel`; loại bổ phụ thuc logic vào field `level` cũ.
- Ritual failure ghi SAN/Corruption/Neo impact và failure log.
- Song tu tăng thêm 10% SAN cost  bổc cost ritual.
- Không cho chuyển path khi Hybrid Path còn active.
- Dung hợp ghi forbidden fate, trạng thái `diHe` và corruption khi có từ hai Mệnh cấm chưa hòa giải.
- Hidden path trigger riêng cho Ma Kiếm Đạo, Vô Danh Đạo và Tà Thần Khí Đạo.
- Companion có đến hệ trừ combat trúc tiếp.
- CuẨng Ngần hidden path gy SAN drain khi can thiáp vào NPC encounter.
- HuyẨn Ảnh hidden path có có hồi tạo đến illusion trong combat.
- NPC có `questState` riêng vài available/active/completed/failed, prerequisite, objective progress và reward protection.

### Còn tiếp tác test/chính

- Trigger Dị Thể vẫn còn hook vào toàn bổ event gameplay thật thay và chỉ API progress.
- Companion còn bổ sung injury/death/flee/skill catalog và deterministic combat roll.
- UI NPC dialogue, quest icon và UI preview cost/risk chưa hoàn thiện.
- Thểc Cảnh và Vong Ng đã có effect nẨn nhưng còn test integration vài node corruption và memory loss.
- Weather shelter queue/reroute/hysteresis chưa hoàn từt.
- Còn regression chuyển biết cho pathState canonical, ritual failure, Hybrid và hidden path exact trigger.
## 18. Hoàn thiện sốu đã apply

### UI quest/dialogue/icon NPC

- NPC hiện có `dialogueState` theo các trạng thái `IDLE_GREET`, `QUEST_OFFER`, `QUEST_PROGRESS_HINT`, `QUEST_TURN_IN`, `GENERIC_CHAT`.
- NPC hiện diẨn tại node tạo action `Nối chuyển`, action nhận/trừ quest và icon `!/?` từ trạng thái quest.
- Quest động cho NPC thương nhận và NPC tiên tiƯu được đăng k theo ngy, có expiry và reward.
- Mỗi quest đi qua `questState` chung, không tạo state UI riêng.

### Companion

- Catalog skill dùng `EXPANSION_DATA.companionSkills`, gám damage, cooldown, loyalty cost và effect.
- Companion có `health`, `maxHealth`, `injury`, `skillCooldowns`, `fleeCount`.
- Combat victory có xác sut thương tách deterministic; loyalty và 0 chuyển companion sang `fled`.
- Skill được gi bằng action UI hoặc `runExpansionCommand("companion_skill")`.

### Từ động trigger Dị Thể

- Combat hệ Dị Thể từ ghi progress `eldritch_beast_survival`.
- Progress đã điều kiện không từ chiám slot ngay mở tạo `pendingUnlocks`; người chỉi phải xác nhận action thểc tính.
- Cổ chỉ pending áp dùng chung cho moral streak, fate resonance, multi-element, reincarnation failure và hidden lore.

### Weather shelter

- Severity `>=3` vào shelter; severity `<=1` mỗi rủi shelter, có hysteresis tại thiếu một ngy.
- Shelter đẩy chuyển NPC sang `shelter_queue`, lưu `queuePosition`; làch di chuyển không được ghi đã trạng thái trừ Ẩn.
- Mỗi NPC lưu `weatherState` gám severity, mode, lastTransitionDay và rerouteCount.

### Regression

- Thêm `tools/verify_dichi_deep.js`.
- Kiếm tra riêng path canonical/ritual, NPC dialogue/quest/icon, companion skill, Dị Thể progress và weather shelter hysteresis.
- Lớnh kiểm tra: `node tools/verify_dichi_deep.js` và `node tools/verify_game.js`.

### Ghi chỉ thit k

- Icon hiện dùng text token `!/?` đã tương thểch renderer hiện tại; UI có thể thay bằng sprite mở không đối contract action.
- Companion injury hiện là state gameplay tại thiếu; hồi phục theo `recoveryDay`, chưa có item chưa thương riêng.
- Dị Thể dùng có chỉ pending đã tránh từ động thay đối build người chỉi trong làc đang render hoặc đang combat.
## 19. Bổ sung vẫng hoàn thiện tiếp theo

- Companion có trạng thái `dead`, `fled`, `injury`, action hồi sinh tồn 12 Linh Thạch và hồi phục vài `soul_scar`.
- Thật bổi Luôn Hồi/Chuyển Sinh được ghi vào `reincarnationLegacy.failureCount`, động bổ sang `flags` và kiểm tra Dị Thể.
- Quan hệ NPC đất ngẨng trust/respect số kích hoạt kiểm tra resonance Dị Thể.
- Weather queue được promote mỗi world tick; queue quá 3 nhợp số reroute và `homeNodeId`.
- Quest panel hiện thể quest NPC, objective progress, icon và dialogue state; action runtime vẫn là nguồn số thật.
- `shadow_scout` reveal node exit thật qua discovery registry.
- NPC base catalog có dialogue states và icon mục định; NPC runtime có thể override bằng `displayName`/`icon`.
- Regression deep mở rẨng thêm scheduled task và war summary hook.

Trạng thái kiểm chọng: `node tools/verify_dichi_deep.js` và `node tools/verify_game.js` đầu pass.
## 20. Hoàn thiện 3 nhám logic còn thiếu

### Companion

- Enemy có thể chuyển mục tiƯu sang companion vài xác sut bảo và chỉ; damage được trừ trúc tiếp vào `companion.health`.
- Companion chuyển `injury` hoặc `dead` theo ngẨng health; trạng thái chỉt hiện thể action hồi sinh.
- Hồi sinh tồn 12 Linh Thạch, hồi 35% health và tạo `soul_scar` trong 5 ngy.

### Quest và Dị Thể

- Quest NPC hệt hạn trong world tick được chuyển từ `available/active` sang `failed`.
- `reincarnation_failure` dùng `progress >= required`, không một eligibility khi vàt mục.
- Scheduled task hệ trừ `quest_expire`, `npc_encounter`, `faction_influence`.

### Weather

- Shelter queue có `queuePriority` theo faction/role và `queuedDay`.
- Khi chỉ quá 3 nhợp, NPC từm node lớn còn có danger thểp, không có chiện số; nếu không có thể và node nhệ.

### Dialogue/NPC catalog

- Cổ catalog dialogue theo generic/merchant/guard, portrait, node làa chọn và skill riêng.
- NPC có action dialogue branch và NPC skill cooldown.
- NPC skill hiện gám quan sốt rumor, market insight và frontier scan.

Kiếm chọng sau thay đối:

- `node tools/verify_dichi_deep.js`  pass.
- `node tools/verify_game.js`  pass.


---

## Source: `AUDIT_FULL_SYSTEM_FEATURES_DEEP_2026-09-14_UTF8_FIXED.md`

# Deep Audit Toàn Hệ Thống Theo Từng Feature

Ngày audit: 2026-09-14  
Phạm vi: `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`, toàn bổ `data/`, requirement và regression hiện có.

## Từm từt

Core runtime đã có đãẨng nối tương đối đẩy đã và hai bổ regression hiện tại pass. Tuy nhiện hệ thểng vẫn còn một số khoảng trạng logic có thể tạo hành vi sai khi chỉi dữi ngy. Cổc điám quan trạng nhất là:

1. Companion đã có damage/death/revive nhưng chưa có damage ledger và chiện thut bảo và Ẩn định.
2. Thương nhận của Trạm giao thương chưa được tạo/làp làch từ động đẩy đã; hiện chỉ yêu dữa trên NPC hiện hƯu và quest động.
3. Travel route đang có fallback `mapDistance = 1` cho mỗi node đã biết, làm giảm  nghĩa khoảng cóch bổn đã.
4. Faction bulletin hiện chỉy qua làp wrapper; hành vi động  export cui nhưng còn hợp nhất source đã tránh regression khi sửa tiếp.
5. Quest NPC, faction daily và contract chưa dùng hoàn toàn một lifecycle/expiry engine thểng nhất.
6. Offline simulation vẫn aggregate nhiều hệ thểng, chưa mở phầng đẩy đã encounter, dialogue và companion combat.
7. Một số lookup Mệnh Số/Fate vẫn tuyẨn tính trong runtime/UI.

## Ma trên feature

| Feature | Trạng thái | Mục rủi ro | Kết luôn |
|---|---|---:|---|
| Character creation | Đã nối | Thểp | Còn thêm test dữ liệu thiếu/unknown branch |
| Core state/migration | Hoạt động | Cao | Còn test migration v12/v13/v14 và unknown field |
| Mệnh Số/Fate | Đã nối phần lớn | Cao | Còn lookup tuyẨn tính và một số event trigger chưa phụ hệt |
| Cùng phợp/tu luyẨn | Đã nối | Trung bình | Còn test cost rollback và evolution branch lài |
| Con Đường | Đã nối | Cao | Còn test canonical path state sau deserialize/transition |
| Ritual Gọi Mệnh  Dựng Neo | Đã nối | Cao | Còn test tồng milestone, failure, retry và hybrid cost |
| Nghề chính/phụ | Đã nối | Trung bình | Còn test lock, đối nghề lài, có tách 7 nghề |
| Hidden path | Đã nối | Cao | Còn test dormant/active/Tháo Neo/Phong Ấn vĩnh viẨn |
| Dị Thể | Đã nối progress | Cao | Chưa phụ toàn bổ trigger moral/fate/lore bằng gameplay event thật |
| Dị Thú/companion | Đã nối nẨng cao | Cao | Cổ damage/death/revive nhưng thiếu damage ledger và lifecycle đẩy đã |
| NPC schedule | Hoạt động | Cao | Weather queue có state nhưng offline encounter còn hạn chỉ |
| NPC dialogue | MVP | Trung bình | Cổ tree generic/merchant/guard, thiếu catalog per-NPC |
| NPC quest | MVP | Cao | Cổ expiry, nhưng còn kiểm tra reward rollback và prerequisite chain |
| Faction daily/contract | Hoạt động | Cao | Hai lifecycle còn tách rủi |
| Weather | Hoạt động | Cao | Cổ severity/hysteresis/queue/reroute, còn test multi-region dữi ngy |
| War | Hoạt động | Cao | Cổ pause và weather; chưa đã integration vài NPC encounter và outpost |
| World event | Hoạt động | Cao | Còn test event chain, offline aggregate và event conflict |
| Map topology/travel | Hoạt động | Cao | Fallback distance 1 là rủi ro logic lớn |
| Cùng tránh | MVP+ | Cao | Điều kiẨn có; effect trading post/merchant lifecycle còn thiếu |
| Influence | Cổ pure/persist | Cao | Source legacy vẫn còn mutation, export wrapper còn hợp nhất |
| Faction bulletin | Cổ quest daily | Trung bình | Hoạt động qua wrapper, còn bổ layering thểa |
| Save/serialize | Hoạt động | Cao | Canonical v13 nhưng còn test unknown dormant/ready |
| Log/narrative | Hoạt động | Trung bình | Còn quát technical leakage toàn bổ reason code |
| IndexedDB archive | Cổ | Trung bình | Còn test quota failure/retry/duplicate archive |
| UI/action routing | Hoạt động | Cao | Action id có nhiều delimiter, còn parser thểng nhất |

## 1. Character creation và core state

Đã có `createCharacter`, `createState`, `ensure` và canonical serialization. Còn thiếu:

- Test tạo nhận vật vài archetype/path/profession không tồn tại.
- Test state thiếu tồng nhậnh lớn: `pathState`, `questState`, `specũalPhysiqueState`, `worldSimulation`, `companion`. >> Bổ sung cho từt có nhậnh đã
- Test deserialize state cũ thiếu `gameClock`, `mapState`, `npcState` và array bổ hạng. >> check xem và sao bổ thiếu, bổ sung vào
- Chưa có invariant checker đã sốu cho `player.pathId`/`pathState.primaryPathId`, slot nghề và hidden path. >> Còn invariant no thể bổ sung

## 2. Mệnh Số, quan hệ Mệnh và tu luyẨn

Đã có catalog, compute Fate, Fate Vault, nurture/evolution và relationship. Còn thiếu:

- Nhiều lookup vẫn dùng `.find()`/`.filter()` trúc tiếp thay và registry/index. >> Đãi thành regis/index
- Còn index theo `fateId`, `grade`, `element`, `pathId` và cache invalidation khi evolve/transform. >> thểc thi đi
- Một số event làa chọn đão được chưa thểng nhất schema `alignment`, nẨn `moralGoodStreak` có thể không tăng nếu action cũ không gi field chuẩn. >> Đãi theo logic mỗi được apply
- Fate resonance hiện kiểm tra eligibility theo snapshot quan hệ, chưa lưu resonance source/count riêng. >> thểc hiện tạo resonance source/ count riêng 
- Còn test Fate pending khi kho đẩy, đối slot, deserialize và nhận trạng. >> thểc hiện đi

## 3. Con Đường, ritual, song tu, hybrid và Nghịch Hành

Đã có path canonical, ritual wrapper, dual cultivation, fuse, hybrid và path debt. Còn thiếu:

- Còn test từt có milestone riêng của tồng path, không chỉ kiểm tra object tồn tại. >> chỉp nhận
- Failure ritual còn test rollback cost, SAN, anchor stability, corruption và retry cùng ngy. >> triẨn khai đi
- Còn bảo đảm `pathState` luôn là source sau deserialize; hiện một số state mỗi chỉ được sync khi gi transition. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Hybrid cost/effect còn test khi đối hidden path, tháo neo và fuse thật bổi.
- `pathDebt` còn test không bổ reset  reincarnation/chuyển sinh ngoi chỉ .
- `ngoai_dao_gia` còn test không bao giữ ghi vào `pathId` qua mỗi entry point.
>> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
## 4. Nghề nghiáp và Cổ Tích

Đã có khóa nghề chính/phụ và 7 nghề Cổ Tích. Còn thiếu:

- Test 7 nghề không chiám quá hai slot nghề. >> >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Test Cổ Tích IVII mở động nghề tương Ẩng, không từ động mở qua search thương. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Test nghề chính đã lock không bổ ghi đã khi load/deserialize. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Test profession item không mở nhám hidden path. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code
- Cooldown nghề, cost và reward chưa có một transaction rollback contract thểng nhất. >> chỉp nhận phương Ẩn, yêu cấu triẨn khai code

## 5. Dị Thể

Đã có catalog, pending unlock, effect và một số hook combat/relationship/reincarnation. Còn thiếu:

- Moral action chưa được từ động chuẩn hòa từ toàn bổ action choice. >> tạo logic từ động chuẩn hòa từ toàn bổ action choice
- Hidden lore claim/server unique mỗi dữa vào flag, chưa có source quest lifecycle đẩy đã. >> Tạo source quest lifecycle, rủi link vào hidden lore claim
- Multi-element mastery tính từ technique catalog nhưng còn index/cache. >> Tạo index.cache rủi triẨn khai code
- Còn phần biết r `eligible`, `pending`, `active`, `removed`, `blocked` trong UI và save migration. >> TriẨn khai đi, nhệ phụi làm theo chuẩn ngần ng đang có
- Còn test trigger trạng trong cùng tick không tạo duplicate history/pending. >> chỉp nhận

## 6. Dị Thể và companion

Đã có support attack, skill, enemy hit, injury, death, flee, revive. Còn thiếu:

- Chưa có `damageLedger`/`lastDamageSource`, nẨn khệ truy nguyẨn nguyẨn nhận chỉt. >> Chỉ còn ghi chỉt là được, trạng thương, chỉt giữ hay g đã.
- Enemy target companion đang dùng xác sut chung, chưa phụ thuc role/skill/loyalty/guard stance. >> Từ tạo logic và triẨn khai. logic cùng đến giữn cùng từt, luôn tồn cùng kám vài nhận vật đã đã bổ vướng code
- Injury làm companion từm thái không bổ định nhưng chưa có trạng thái `recovering` hiện thể r. >> tạo logic đi
- Revive chưa kiểm tra node an toàn, faction facũlity hoặc giải hạn số lớn hồi sinh. >> từ tạo logic cho tại
- Companion skill chưa có skill progression/mastery. >> tạo logic nhệ
- Chưa có test combat nhiều enemy, companion chỉt giữa làt và revive ngay sau combat. >> tạo logic, cùng đến giữn cùng từt

## 7. NPC, dialogue và quest

Đã có presence, schedule, dialogue state, dialogue tree có bổn, portrait fallback, skill và quest. Còn thiếu:

- NPC có thể chưa có catalog dialogue/portrait/skill riêng; hiện merchant/guard/generic phần loại theo role. >> tạo catolog giữp tại, cùng chi tit và phong phụ cùng từt, nhệ phần chia NPC theo vẫng, từ chỉc,.. trên map
- Dialogue choice chưa có điều kiẨn realm, faction reputation, weather, war hoặc relationship. >> Tạo dialogue chi tit.
- Quest accept/turn-in chưa chỉy qua transaction chung vài dialogue choice. >> phụi chỉy quan transaction chung
- Quest expiry đã có nhưng prerequisite chain và reward failure chưa được cascade đẩy đã. >> làm đẩy đã cascade
- `npcIndex` có thể chưa id trạng nếu dữ liệu cũ/register nhiều lớn. >> tạo riêng index
- NPC skill hint chưa gần chỉt vào faction bulletin hoặc local market state. >> tạo logic đi

## 8. Weather và NPC shelter

Đã có intensity, severity, hysteresis, shelter queue, priority và nearest safe node. Còn thiếu:

- Chưa có capacũty reservation atomic; hai NPC cùng tick có thể cùng thểy một slot trạng trong cóc branch được biết. >> tạo logic riêng
- Reroute chỉ xửt node lớn còn một bổc, chưa có BFS nhiều bổc. >> tạo logic giữp tại
- Chưa loại trừ đẩy đã node có thiện tai active, ward broken hoặc faction blockade. >> tạo logic giữp tại
- Shelter queue chưa phát thểng bảo khi NPC được promote/reroute. >> tạo logic đi
- Còn test bảo liẨn vẫng, đối weather nhanh và NPC đang travel. >> tạo logic đi

## 9. World event, war và faction

Đã có event phase, weather pause war, front, particũpation và influence. Còn thiếu:

- Huyết nguyệt còn test chính xác phase `active` vài ward formation, không chỉ template tồn tại.
- War capture node còn động bổ ngay `mapState.influence`, owner và outpost.
- NPC encounter trong war front chưa chuyển thành encounter combat/evacuation thật.
- Faction action chưa phụ toàn bổ interaction type; còn registry action  influence amount.
- Faction daily, contract và bulletin đang dùng cóc state/lifecycle khệc nhau.

>> Codex từ tạo logic 
## 10. Map, travel và cùng tránh

Đã có topology repair, fog, watchtower reveal, trading post condition, ward condition, waystation limit và teleport free. Còn thiếu/rủi ro:

- `mapDistance` fallback mỗi node đã biết thành distance 1 có thể làm sai travel day, risk và nearest-safe-node.
- `truyen_tong_tran` kiểm tra unlock hai đầu nhưng chưa kiểm tra cùng region/động node tồng mởn theo catalog canonical  mỗi save cũ.
- Watchtower reveal chưa có chi phụ upkeep/integrity degradation theo thái gian.
- Trading post chưa từ tạo merchant itinerary khi node đã điều kiẨn.
- Outpost/waystation/ward/trading post chưa có một lifecycle damage/repair/abandon thểng nhất.
- Exit repair còn regression toàn bổ `WORLD_MAP` sau mỗi data update.

>> Codex từ tạo logic 

## 11. Influence và faction bulletin

Đã có pure snapshot và persist wrapper. Còn thiếu/rủi ro:

- Legacy `mapInfluenceSnapshot` vẫn tồn tại và có mutation; export hiện dùng pure wrapper nhưng source dữ gy rủi ro bảo trừ.
- Legacy `factionBulletin` được bổc bổi `factionBulletinWithDailyQuests`; hành vi cui động nhưng nẨn hợp nhất thành một implementation.
- Influence map chưa có heatmap theo region được materialize/cache.
- `ownerFactionId`  một số flow vẫn có thể suy ra từ cấu trúc cũ thay và `influenceMap` canonical.

>> Từ tạo logic mỗi bổ vào
## 12. Save, scheduled task và offline simulation

Đã có canonical v13, scheduled task, IndexedDB archive và offline aggregate. Còn thiếu:

- Scheduled task unknown type hiện còn policy r: `ready`, `dormant`, `failed` hay retry.
- Task handler chưa có retry count/backoff/dead-letter state.
- Offline aggregate chưa mở phầng đẩy đã NPC encounter, dialogue, companion combat và war intervention.
- Migration còn test unknown event/item/evolution branch bảo toàn dormant state.
- IndexedDB còn test quota exceeded, transaction abort, retry queue và duplicate key.

>> Tạo thêm phần này
## 13. UI, log và performance

Đã có action description, quest panel, dialogue panel state và requestIdleCallback archive. Còn thiếu:

- UI chưa có renderer riêng cho tồng NPC portrait/skill/dialogue tree; còn dùng fallback.
- Action parser có nhiều dùng delimiter (`_`, `::`, `:`), còn một encoder/decoder canonical.
- Log narrative còn quát toàn bổ reason code; không chỉ reason code đã nám trong map.
- Một số UI Fate/market/combat vẫn có lookup tuyẨn tính.
- Còn đo render cost của `contextState` và expansionActions tạo nhiều action và gi presence/quest status làp lài.
>> tạo thêm cho phần này
## 14. Regression còn thiếu

Bổ test hiện tại pass nhưng chưa đã coverage cho:

- 7 profession Cổ Tích và slot lock.
- Ritual tồng path, hybrid cost, hidden path switch/detach.
- Companion multi-enemy damage/death/revive.
- Quest expiry/prerequisite/reward failure.
- Weather queue nhiều NPC, multi-region, BFS reroute.
- War + weather + NPC encounter.
- Map topology invalid exits và distance thểc.
- Save migration unknown branches và IndexedDB failure.
- UI action parser cho NPC id/quest id có nhiều dƯu phần cóch.

## Ưu tiẨn đã xut

### P0  còn sửa trước khi mở rẨng thêm feature

1. Bổ fallback `mapDistance = 1` hoặc giải hạn r phụm vi fallback.
2. Hợp nhất influence pure/persist và faction bulletin thành một implementation.
3. Chuẩn hòa action ID encoder/decoder.
4. Bổ sung migration unknown branch và scheduled task retry/dead-letter.

### P1  hoàn thiện gameplay logic

1. Merchant itinerary thật cho trading post.
2. Faction daily/contract/quest lifecycle chung.
3. NPC dialogue conditions và catalog tồng NPC.
4. Companion damage ledger, stance và revive constraints.
5. Weather BFS reroute và shelter reservation.

### P2  tại Ưu và phụ test

1. Fate index/cache.
2. Region heatmap cache.
3. UI memoization cho context actions.
4. Offline simulation coverage.
5. IndexedDB failure-injection test.

## Kết luôn

`map distance  travel risk`, `war  influence/owner`, `NPC quest  dialogue/expiry`, `weather  shelter/travel`, `save migration  unknown state`, `action id  UI handler`.


## 15. Implementation update  2026-09-14

Đã triẨn khai từ cóc note được approve:

- Core invariant bổ sung cho canonical path, hidden path, profession lock, companion health và duplicate NPC quest index.
- `mapDistance` bổ fallback distance `1`; route không nối thật trừ `Infinity`.
- Scheduled task có `retryCount`, `maxRetries`, retry backoff đến giữn và `dead_letter` cho unknown type.
- Runtime Fate index lưu trong `state.runtimeIndexes.fate` theo `byId`, `byGrade`, `byElement`, `byPath`.
- Moral action được chuẩn hòa từ động từ action id; Fate resonance lưu `fateResonanceCount` và `fateResonanceSources`.
- `reincarnation_failure` giữ điều kiẨn `>= required`.
- Companion có `damageLedger`, stance `protect`, skill mastery, revive count/limit và điều kiẨn node an toàn.
- Weather reroute dùng BFS tại đa 4 bổc, loại node chiện số/thiện tai/ward hạng; shelter có reservation theo tick.
- Trạm giao thương tạo/làp làch merchant itinerary thật khi cấu trúc còn hoạt động.
- Dialogue catalog bổ sung profile theo role + region, portrait và skill riêng cho merchant/guard.
- Quest expiry và unknown scheduled task đã có regression.

Regression sau implementation:

```text
OK: deep Dị Chí/path/companion/quest/weather regression
OK: characters, procedural items, map, data integrity, save migration, UI and DOM
```

Cổc phần còn còn đất riêng: hợp nhất source legacy influence/bulletin, transaction chung cho toàn bổ quest/contract, offline simulation đẩy đã encounter/war/companion, failure-injection IndexedDB và bổ test ritual/profession/save migration chuyển biết.

## 16. Implementation update  batch transaction/offline/archive/regression

- Quest NPC, contract và faction daily dùng chung `questTransaction`; command path cũng đã chuyển sang wrapper transactional.
- Quest lifecycle có expiry động nhất cho NPC quest, contract accepted và faction daily.
- Offline simulation resolve NPC encounter thành kết quá có memory/outcome; war intervention tăng score theo faction tham gia; companion có combat damage ledger và trạng thái injured/dead.
- `factionBulletin` đã gáp daily quest vào implementation chính; không còn legacy wrapper `baseFactionBulletin`.
- Influence giữ pure snapshot và persist function tách biết; persist ghi có `influenceMap` và snapshot tương thểch.
- IndexedDB archive reset DB promise khi open lài, bổt transaction error/abort đã retry, có idle scheduling và failure-injection regression.
- Regression chuyển biết đã bổ sung cho ritual failure schema, profession lock, unknown world-event migration và offline hooks.

Kiếm tra đã pass trong batch này:

```text
OK: IndexedDB archive failure injection and retry queue
OK: deep Dị Chí/path/companion/quest/weather regression
```

## 17. Boundary hardening  2026-09-14

- Map topology không còn dùng complete-graph fallback: khoảng cóch chỉ đi qua exit thật hoặc cảnh reverse hợp là.
- Exit hạng được ghi vào `state.mapState.invalidExits`; topology runtime từ loại target không tồn tại.
- Scheduled `npc_encounter` tạo record encounter thật; `quest_expire` dùng chung lifecycle; bounty offline vẫn được resolve deterministic thay và treo pending và hạn.
- `contextState()` có memoization theo turn, location, world tick, map version, profession/path và quest counts đã giảm render cost.
- Faction action hoàn thành faction daily qua transaction contract chung.
- Trạm giao thương giữ phát sinh yield thểc từ mỗi merchant visit và đẩy influence faction; effect risk của Tháp canh/Trạm dịch chuyển/Trận pháp được địa vào travel preview.

## 18. Final completion batches  ward, unknown migration, offline world

- `ward_formation` có protection runtime: giảm encounter chance, giảm corruption gain, phát hành `curseRiskDelta`/`corruptionGainMult`, và giảm corruption vẫng sau event bổ bổ qua.
- Migration v13 bảo toàn unknown inventory item trong `unknownContent.items` vài payload/quantity/status `dormant`; unknown fate evolution branch được giữ nguyẨn payload và chuyển trạng thái `ready` đã không một tiẨn tránh.
- Offline tick không còn bổ qua local incũdent, world event generation hoặc hidden realm progression; event vẫn advance/resolve deterministic, incũdent vẫn sinh theo seed, hidden realm competitor progress vẫn được cấp nhất.
- Regression bổ sung cho ward protection, unknown item/evolution migration và offline world event lifecycle.

## 19. Implementation update  12 logic notes

- Curse/corruption đi qua ward-aware pipeline; ledger giữ `rawAmount`, `wardReduction` và `wardNodeId`.
- Offline NPC encounter xử là encounter một phòa; local incũdent trong offline tick được resolve deterministic.
- Travel preview tính cấu trúc trên toàn bổ route; trading post phát merchant visit, yield và faction influence.
- Unknown content có `rehydrateUnknownContent()` đã khồi phục payload khi catalog được bổ sung.
- Context cache key bao phụ weather, corruption, war, pending encounter, travel, companion, inventory và quest.
- Cổ `repairInvalidMapExits()` đã sửa exit hạng trong catalog và rebuild topology index.
- IndexedDB archive có API được và cleanup, bổn cảnh retry và idle scheduling.
- NPC được tạo dialogue tree, portrait token và skill catalog riêng theo `npcId`.
- UI hiện thể effect cùng tránh và số làẨng unknown content đang chỉ động bổ.

Regression sau batch 12 note:

```text
OK: deep Dị Chí/path/companion/quest/weather regression
OK: characters, procedural items, map, data integrity, save migration, UI and DOM
OK: IndexedDB archive failure injection and retry queue
```


---

## Source: `SYSTEM_LOGIC_CATALOG\BATCH_5_RUNTIME_CANONICAL_STATUS_2026-09-16.md`

# Batch 5  Runtime Canonical Closure Status  2026-09-16

## Completed in this batch

1. Canonical OXY coordinates are now used when initializing static locations and when resolving movement targets. Generated coordinates no longer overwrite authored map coordinates. Engine movement stores the exact `travelPlan` used for the commit, and the preview/commit distance/risk regression passes.
2. Player-owned structures with influence effects now participate in the same influence DTO as faction-owned structures. Event influence, cache revision, serialize/deserialize and offline catch-up are covered by regression.
3. NPC rumor state now stores confidence, priority, source, received day and expiry in both the bounded narrative list and the ledger. Propagation is one valid edge per tick, cleans expired entries, and has a source → relay → witness regression.
4. NPC scheduler now has deterministic node capacity and queue metadata (`queued`, `queueNodeId`, `queueRank`). Movement still requires a valid edge. Congestion regression and save round-trip are covered.
5. Fate evolution preview simulates relationship stage 4 and the selected branch exactly once, matching committed derived effects. Insufficient-resource rollback leaves the ready state and resources unchanged.
6. Quest rewards now use the canonical reward ledger for EXP, merit, Linh Thạch, items, Fate, Công Pháp and contribution. Quest reward duplicate execution is covered.
7. Secondary Path is an explicit, confirmed, one-time transition with a canonical cost and save schema. It cannot be inferred from profession, Fate or Dị Thể.
8. Dị Thể claim now evaluates catalog path/profession exclusions without automatically locking either namespace.

## Evidence

- `node tools/verify_review_batches.js`  pass.
- `node tools/verify_dichi_deep.js`  pass.
- `node tools/verify_expansion_stress.js`  pass.
- `node tools/verify_companion_runtime.js`  pass.
- `node tools/verify_indexeddb_archive.js`  pass.
- `node tools/verify_log_narrative.js`  pass.
- `node tools/profile_runtime_budget.js`  pass; current Node profile: 65 influence calls, 0.169 ms average, 3.7 MB serialized sample.
- `node tools/verify_game.js`  pass after the batch.

## Still intentionally open

- Browser visual QA for map, structure, Fate, NPC queue and log cards.
- Full authored content/balance catalog for Dị Thể endings and Path fusion affinity caps.
- Device-level FPS benchmark and large browser archive/quota benchmark.
- Faction bulletin UI and dedicated rumor/queue panels.
- Remaining producer audit outside the canonical quest/expansion reward boundary.


---

## Source: `SYSTEM_LOGIC_CATALOG\BATCH_6_RUNTIME_UI_STATUS_2026-09-16.md`

# Batch 6  Runtime/UI/Log status  2026-09-16

## Đã hoàn thiện trong đợt này

- Bổ sung bảng tín hiệu NPC tại tab Quan hệ: NPC đang ở node, trạng thái di chuyển/trú ẩn/chiến đấu, thứ tự hàng đợi và rumor gần nhất.
- Bổ sung Dấu vết gần đây tại node trong tab Thế giới, đọc từ `node.history`, gồm thiên tượng, điểm nhỏ, công trình, chuyển chủ, thế lực, nhân vật và khám phá.
- Chốt guard Nghề Ẩn: không thể chọn Nghề Ẩn trước Nghề chính; sau khi Nghề chính commit, nghề thường khác bị khóa, Nghề Ẩn chỉ được điền slot phụ khi Cổ Tịch và đồ thị manh mối hợp lệ.
- Bổ sung regression cho mã lỗi kỹ thuật không được lọt vào player-visible log và cho việc gộp các event cùng ngày thành một đoạn novel.
- Ổn định fixture breakthrough trong `verify_game.js`: tách kiểm thử cổng đột phá khỏi cơ chế Tẩu Hỏa Nhập Ma có thể làm giảm Tu vi sau một lần gain lớn.

## Regression đã chạy

- `node --check js/expansion.js`
- `node --check js/ui.js`
- `node --check tools/verify_game.js`
- `node tools/verify_game.js`
- `node tools/verify_review_batches.js`
- `node tools/verify_log_narrative.js`
- `node tools/verify_expansion_log_matrix.js`  43/43

## Còn mở

- Browser/device visual QA chưa thể coi là hoàn tất chỉ bằng Node harness.
- Các mục về benchmark thiết bị yếu, cân bằng nội dung Dị Thể/Path Fusion và large-save browser quota vẫn cần đợt riêng.


---

## Source: `SYSTEM_LOGIC_CATALOG\BATCH_7_OFFLINE_LOG_DITHE_STATUS_2026-09-16.md`

# Batch 7  Offline, replay, log và Dị Thể  2026-09-16

## Đã triển khai

- Offline world simulation có `offlinePolicy`: aggregate phần cũ, actor-level
  window 30 ngày cuối, `lastOfflineAudit` và mode `idempotent` khi gọi lặp cùng
  target. Có regression 30/60 ngày, seed determinism và inventory idempotency.
- Combat replay có regression transcript player-visible giống nhau giữa hai save
  deserialize từ cùng snapshot ở `type`, `text`, `clock`, `statDisplay`.
- `novelLogParagraphs()` trở thành API grouping canonical; `renderScene()` và UI
  story window gộp toàn bộ event cùng ngày, không tách theo node/sub-location.
- Weather summary đưa `weatherUntilDay`, `weatherSeverity`, `weatherHistory` vào
  view model và tab Thế giới.
- Dị Thể có `stageEffects`, `endingTags`, `factionAffinity`; modifier resolver
  đọc stage hiện tại, áp dụng SAN recovery stage-aware và cộng resonance vào
  node resonance. Save round-trip và stage regression đã chạy.
- Công trình disabled được repair/tái kích hoạt kể cả khi integrity còn 100;
  influence active/disabled/repair có regression.
- Contested opportunity offline expiry và Fate relationship không decay qua 120
  ngày có regression.

## Regression

- `verify_game.js`
- `verify_review_batches.js`
- `verify_dichi_deep.js`
- `verify_expansion_stress.js --runs=2 --days=60`
- `verify_log_narrative.js`
- `verify_expansion_log_matrix.js`  43/43

## Còn mở

- Browser/device QA, large-save quota, FPS thiết bị yếu và cân bằng sản phẩm
  ending/faction cho Dị Thể/Path Fusion.
- Audit source-level mọi producer raw bằng `tools/verify_log_producers.js`: 66/66
  literal producer trong `engine.js` và `expansion.js` đi qua narrative boundary;
  producer động vẫn được kiểm qua log matrix.
- Character creation boundary nhận RNG injection cho root/race/fate/attribute/origin/
  trait/background/goal và factory ID; `verify_review_batches.js` kiểm tra replay
  deep-equal cùng seed.


---

## Source: `SYSTEM_LOGIC_CATALOG\BATCH_EXECUTION_STATUS.md`

# Batch Execution Status  Review 33 mục

Ngày bắt đầu: 2026-09-16  
Phạm vi: `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`  
Nguyên tắc: một mục chỉ hoàn tất khi có requirement, state/schema, runtime resolver/action, UI (nếu có), normalization và regression gate.

Ma trận audit từng mục: `33_ITEM_COMPLETION_MATRIX_2026-09-16.md`.

## Batch 1  P0: Canonical map, construction, Fate boundary

### Đã triển khai

1. `mapInfluenceSnapshot` là resolver canonical duy nhất cho gradient influence.
   - Node đã khám phá: tính theo faction power, khoảng cách Manhattan, chiến sự, event signal và structure influence.
   - Node chưa khám phá: không lộ gradient/faction ownership; chỉ có `eventInfluence` do world event ghi.
   - Có cache theo `influenceRevision`, invalidation khi structure/ownership/event thay đổi.
2. Map structure đã có owner, level, status, effects và transfer history.
   - Truyền Tống Trận dùng eligibility resolver: spawn, faction/guild tham gia, phường thị/thành/cảng hoặc outpost.
   - Hộ Giới Đại Trận đưa reduction vào SAN drain, encounter risk, curse risk và world modifiers.
3. Spawn node lấy từ `character.startLocationId`/input hợp lệ; coordinate khởi tạo dùng tọa độ 100×100 của `WORLD_MAP`, không dùng `[0,0]` giả.
4. Weather có catalog canonical, alias, severity, intensity và modifier cho quang/mưa/sương/tuyết/lôi vũ/linh phong/âm vũ/bão linh khí.
5. Nghề chính/phụ dùng `primaryId`, `secondaryId`, `hiddenId`; đã có normalization và namespace requirement riêng.
6. Fate advanced actions dùng namespace riêng; `fateEffectBreakdown` tách base/enhancement/relationship/evolution/suppression/advanced.
7. Fate relationship đã ghi `nurtureHistory`, `resonanceHistory`, `decayPolicy: "none"`; UI hiển thị điểm, số lần Dưỡng/Cộng Minh và policy.

### Regression đã chạy

- `node --check js/engine.js`
- `node --check js/expansion.js`
- `node --check js/ui.js`
- `node tools/verify_expansion_log_matrix.js`  43/43
- `node tools/verify_dichi_deep.js`  pass
- `node tools/verify_game.js`  pass; một lần chạy ngắn gặp gate đột phá không ổn định, chạy lại với timeout đầy đủ đã pass.

### Còn lại trong Batch 1

- Kiểm tra trực quan browser cho tab Thế giới và panel Mệnh Số.
- Bổ sung test deterministic riêng cho event influence node chưa khám phá, transfer ownership và weather severity.
- Audit toàn bộ command/UI handler để bảo đảm mọi action mới đều đi qua resolver canonical.

## Batch 2 progress  P1 world/content/replay

### Đã triển khai thêm

- NPC scheduler có `aiState`, `needs`, edge validation; không còn dùng route list như teleport.
- Witness/rumor có confidence, expiry, priority, source và ledger chống lặp; propagation chỉ qua cùng node/node kề.
- War end có `outcome` và `cascadeApplied`; cascade cập nhật faction/map/history đúng một lần.
- Offline NPC encounter dedupe theo encounter key, retention tối đa 100 record; war cascade và offline replay cùng target day đã có regression deterministic.
- Discovery/Dị Chí có state machine `discovered → verified → collected → rewarded`, API transition đơn điệu.
- Legacy history deserialize dùng ID deterministic và derive `statDisplay` từ changes.
- Relationship NPC đã tách `trust`, `loyalty`, `respect`, `fear`, `suspicion`, `score`; companion giữ state/ledger độc lập.
- Công Pháp và recipe đã có DTO/resolver canonical; các recipe Luyện Đan, Luyện Khí và Trận Pháp dùng transaction kiểm tra trước rồi commit chi phí một lần.
- Map encounter, search/discovery và các nhánh reward loot đã dùng replay-aware RNG; preview không tự commit reward.

Requirement bổ sung: `05-operations/WORLD_TICK_NPC_OFFLINE_CANONICAL_2026-09-16.md`, `06-expansion/DISCOVERY_STATE_AND_REWARD_CANONICAL_2026-09-16.md`, `07-ui/ACTION_PRIORITY_REPLAY_CANONICAL_2026-09-16.md`.

P2 baseline đã được ghi thành requirement: `02-progression/DI_THE_CATALOG_AND_EXCLUSION_CANONICAL_2026-09-16.md` và `07-ui/ARCHIVE_PERFORMANCE_BUDGET_CANONICAL_2026-09-16.md`.

### Regression mới nhất

- `verify_dichi_deep.js`  pass.
- `verify_expansion_log_matrix.js`  43/43.
- `verify_log_narrative.js`  pass.
- `verify_companion_runtime.js`  pass.
- `verify_indexeddb_archive.js`  pass.
- `profile_runtime_budget.js`  pass; resolver trung bình dưới budget Node, save mẫu khoảng 3.7MB.
- `verify_game.js`  pass 3 lần liên tiếp sau khi thêm diagnostic message cho gate đột phá; không còn assertion nền thất bại trong lần kiểm tra này.
- `verify_review_batches.js`  pass sau khi thêm gate relationship, recipe/reward và contested/hidden realm.

### Còn thiếu Batch 2

- Hoàn thiện reward catalog/duplicate policy cho producer còn lại; prisoner resolution đã chuyển sang `grantCanonicalReward` và có regression duplicate.
- Audit producer `Math.random()` còn lại ở UI preview và ItemGenerator; các nhánh loot/cultivation/combat có state RNG scope, còn ID item vẫn cần policy snapshot nếu replay phải tái tạo byte-identical.
- Regression trực tiếp cho action priority, war cascade/offline determinism và discovery round-trip đã có; NPC rumor replay nhiều node và UI browser vẫn còn thiếu.

Reward canonical đã được triển khai bằng `state.rewardLedger` và `grantCanonicalReward`; requirement: `06-expansion/REWARD_CATALOG_IDEMPOTENCY_CANONICAL_2026-09-16.md`. Các nguồn contract, hidden realm, contested opportunity, collection hiếm, world event, tournament, war, prisoner, tomb, legacy và companion release đã dùng receipt chống phát thưởng lặp; discovery/search replay và loot RNG đã có regression deterministic.

## Batch 2  P1: World tick, NPC, content/discovery, action/log/save

Trạng thái: chưa hoàn tất. Sẽ triển khai theo thứ tự world simulation → NPC offline → discovery/reward → action priority → log group/day → save schema.

## Batch 3  P2: UI/performance/archive/reward

Trạng thái: chưa hoàn tất. Sẽ chốt budget, retention, render throttling, archive snapshot và reward catalog sau khi Batch 2 ổn định.

## Batch 4  Product decisions 2933

Baseline đã được phép tự chốt nhưng chưa đánh dấu hoàn tất:

- Quan hệ Mệnh: không decay.
- Song tu/dung hợp Con Đường: sẽ tách khỏi Nghề Ẩn và chỉ cho phép qua explicit transition resolver.
- Dị Thể: modifier/branch riêng; không tự động khóa nghề/path nếu chưa có rule cụ thể.
- Structure: player/faction/guild ownership có ownerType/ownerId và transfer history.
- NPC offline: aggregate simulation trước, actor-level chỉ khi có encounter/quest/relationship relevance.

## Điều kiện báo hoàn tất

Không báo đã hoàn thiện toàn bộ nếu còn mục nào chỉ có mô tả mà chưa có code hoặc regression. Mỗi batch phải cập nhật file này và file requirement tương ứng trước khi chuyển batch.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_76_ACTION_PRIORITY.md`

# Review Batch 76  Action Priority / Deterministic Replay

Phạm vi: Mục 19 và Mục 21 của `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`.

## Đã triển khai

- `GameEngine.validateActionPriorityMatrix(state, actions)` kiểm tra action id duy nhất, alias không mơ hồ, priority nguyên trong `0..100`, và schema aliases.
- Resolver được chạy hai lần trên cùng input để kiểm tra projection deterministic gồm `id`, `tier`, `urgency`, `blocking`, `sourceOrder`.
- `resolveActionSurfaces()` được audit để ngăn action xuất hiện đồng thời ở nhiều priority surface chính.
- `validateExpansionState()` gọi audit này, nên state có action matrix hỏng bị phát hiện trong validation save/runtime.
- Regression bao phủ combat context, pending opportunity context và fixture duplicate-id/ambiguous-alias/invalid-priority.

## Requirement canonical

Xem `07-ui/ACTION_PRIORITY_MATRIX_VALIDATOR_2026-09-17.md` để biết contract, blocking winner, context exclusivity và giới hạn surface.

## Trạng thái

**ĐANG TRIỂN KHAI:** runtime contract và Node regression đã pass. Browser E2E click-through cho toàn bộ action surface và registry compile-time cho action động vẫn là phần còn lại.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_77_WEATHER.md`

# Review Batch 77  Weather runtime contract

Phạm vi: Mục 11.

Đã bổ sung `validateWeatherRuntimeState()` để kiểm tra weather ID sau alias normalization, severity khớp catalog, thời hạn, history retention và transition hợp lệ của world tick. Validator được nối vào `validateExpansionState()` và có regression cho alias, catalog drift và offline tick.

Trạng thái: **ĐANG TRIỂN KHAI**  runtime/save/offline đã được kiểm tra; browser E2E cho animation/fog và từng transition vẫn còn thiếu.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_78_STRUCTURE_RUNTIME.md`

# Review Batch 78  Structure runtime state

Phạm vi: Mục 2, 24, 25 và 32.

Đã bổ sung `validateStructureRuntimeState()` cho schema Công Trình, ownership, durability, level/charge, transfer history, duplicate active type và inventory invariant. Validator được tích hợp vào `validateExpansionState()`; regression kiểm tra công trình hợp lệ và durability sai.

Trạng thái: **ĐANG TRIỂN KHAI**  runtime/save validation đã pass; browser E2E permission matrix vẫn còn thiếu.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_79_RELATIONSHIP_LEDGER.md`

# Review Batch 79  Relationship ledger invariants

Phạm vi: Mục 15 và hỗ trợ Mục 6/8.

Đã bổ sung validator ledger quan hệ, unique event key, event metadata và orphan memory; nối vào `validateExpansionState()`. Regression kiểm tra idempotent relationship event, projection dimensions và drift bị từ chối.

Trạng thái: **ĐANG TRIỂN KHAI**  runtime/save đã pass; dialog UI E2E và các nhánh relationship dài hạn vẫn cần coverage trực tiếp.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_80_HIDDEN_REALM.md`

# Review Batch 80  Hidden Realm lifecycle

Phạm vi: Mục 18 và 26.

Đã bổ sung validator Bí Cảnh cho cycle/window/status, reward claim keys, competitor progress và active realm node reference; nối vào `validateExpansionState()`. Regression kiểm tra enter/exit, reward idempotency, contested expiry và duplicate reward key.

Trạng thái: **ĐANG TRIỂN KHAI**  runtime/save/offline đã pass; browser E2E overlay/map gate còn thiếu.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_81_DITHE.md`

# Review Batch 81  Dị Thể catalog/state

Phạm vi: Mục 23, hỗ trợ Mục 2933.

Đã nối catalog validator vào `validateExpansionState()` và bổ sung `validateSpecialPhysiqueState()` cho active/candidate/progress/history/rejected IDs, player mirror và namespace riêng của Dị Thể. Regression kiểm tra unknown active Dị Thể.

Trạng thái: **ĐANG TRIỂN KHAI**  runtime/save đã pass; browser E2E claim/exclusion dialog còn thiếu.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_82_CACHE_INVALIDATION.md`

# Review Batch 82  Cache invalidation / performance runtime

Phạm vi: Mục 1, 9, 22 và 28.

Đã bổ sung revision metadata (`invalidationCount`, `lastInvalidation`) cho map influence, canonical invalidation trong mutation và `validateCacheInvalidationState()` kiểm tra stale cache/metrics. Regression kiểm tra event influence và structure mutation làm revision tăng, cache cũ bị loại bỏ.

Trạng thái: **ĐANG TRIỂN KHAI**  runtime/cache gate đã pass; profiling browser trên thiết bị thật còn thiếu.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_83_REPLAY_ENVELOPE.md`

# Review Batch 83  Deterministic replay envelope

Phạm vi: Mục 21, hỗ trợ Mục 20/22.

Đã bổ sung `validateReplayEnvelope()` cho seed/save identity, turn/sequence counters và unique IDs của world events/tasks/encounters; nối vào `validateExpansionState()`. Regression kiểm tra seed drift và combat transcript sau save/load.

Trạng thái: **ĐANG TRIỂN KHAI**  deterministic runtime chính đã pass; cross-browser replay corpus dài ngày còn thiếu.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_84_UI_ACTION_BINDING.md`

# Review Batch 84  UI Action Binding

## Phạm vi

Hoàn thiện phần review liên quan đến nút UI có command mở rộng và đường đi command → runtime.

## Đã chốt và code

- UI command được trích từ các lời gọi `expansionButton`.
- Runtime command được trích từ table của `runExpansionCommand`.
- Regression fail nếu UI phát command không có handler, declaration bị trùng, delegated click bị bind nhiều lần hoặc action không qua queue.

## Bằng chứng

- `requirement/07-ui/UI_ACTION_BINDING_STATIC_AUDIT_2026-09-17.md`
- `tools/verify_ui_surface_contract.js`

## Phần còn mở

Browser E2E local cần môi trường cho phép truy cập HTTP localhost; hiện static contract và runtime regression đã bao phủ đường đi dữ liệu, nhưng chưa thể coi là bằng chứng pixel/UI tương tác thật.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_85_SAVE_MIGRATION.md`

# Review Batch 85  Save Migration Fixtures

## Mục review

Mục 3 và 20: canonical namespace Nghề chính/Nghề Ẩn, legacy aliases, history và statDisplay.

## Đã triển khai

- Thêm fixture deserialize v1 thiếu các state mở rộng.
- Thêm fixture deserialize v7 dùng `professionState.hiddenId`.
- Kiểm tra deterministic legacy history ID.
- Kiểm tra `validateExpansionState` sau migration và sau canonical save-load.
- Batch audit phát hiện và đã sửa việc node Bí Cảnh runtime động thiếu tọa độ sau khi catalog runtime được rebuild; tọa độ hiện được cấp deterministic trong `openWorld.coordinates`.

## Evidence

- `requirement/01-core/SAVE_MIGRATION_MULTI_VERSION_FIXTURES_2026-09-17.md`
- `tools/verify_review_batches.js`


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_86_HIDDEN_REALM_COORDINATES.md`

# Review Batch 86  Runtime Hidden-Realm Coordinates

## Mục review

Mục 1 và 18: Map V2 coordinate contract phải bao phủ cả node runtime sinh ra trong vòng đời Hidden Realm.

## Đã triển khai

- `ensureRuntimeLocationCoordinates(state)` cấp tọa độ deterministic cho entry/path/core runtime node.
- Tọa độ nằm trong `[0,100]`, tránh collision với coordinate index hiện hữu và được lưu trong state.
- `validateExpansionState` tiếp tục fail nếu coordinate thiếu; không chuyển sang fail-open.
- Save migration fixture v1 được chạy sau các test Hidden Realm để bắt global-catalog contamination.

## Regression

`tools/verify_review_batches.js` chạy full sequence, trong đó fixture migration sau Hidden Realm phải pass `validateExpansionState` và map coordinate audit.

## Chưa hoàn thiện

Pixel placement/zoom của node runtime vẫn cần browser visual QA; invariant tọa độ và save-load đã được kiểm tra bằng Node regression.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_88_HEADLESS_UI_RENDER.md`

# Review Batch 88  Headless UI Render Coverage

## Mục review

Các mục UI liên quan map/world, Dị Thể, progression, Fate, novel log và action surface.

## Đã triển khai

- Render smoke toàn bộ 13 tab canonical bằng state runtime thật.
- Bắt exception và placeholder runtime trong HTML.
- Giữ static delegated-command contract và DOM reference regression hiện có.

## Evidence

- `requirement/07-ui/HEADLESS_TAB_RENDER_CONTRACT_2026-09-17.md`
- `tools/verify_game.js`


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_89_CATALOG_BALANCE.md`

# Review Batch 89  Catalog Balance Boundaries

## Mục review

Mục 11, 16, 2326, 3031: weather/recipe/Dị Thể/structure/reward/path catalog balance.

## Đã triển khai

- Thêm `validateBalanceCatalog()` và nối vào expansion state validation.
- Bao phủ chi phí, duration, risk, refund, reward policy và fusion cap.
- Thêm regression catalog balance độc lập.

## Evidence

- `requirement/03-world/CATALOG_BALANCE_BOUNDARY_VALIDATOR_2026-09-17.md`
- `js/expansion.js`
- `tools/verify_dichi_deep.js`


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_90_ASSET_REFERENCE.md`

# Review Batch 90  Asset Reference Integrity

## Mục review

UI surface của mục 1, 5, 8, 10, 17, 19 và các asset illustration liên quan.

## Đã triển khai

- Thêm static asset reference gate cho HTML/JS/CSS.
- Gate fail nếu reference `assets/...` không tồn tại.
- Xác nhận file illustration UI hiện hành và asset character tồn tại.

## Evidence

- `requirement/07-ui/ASSET_REFERENCE_INTEGRITY_GATE_2026-09-17.md`
- `tools/verify_asset_references.js`


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_91_HIDDEN_REALM_OFFLINE.md`

# Review Batch 91  Hidden Realm Offline Cycle

## Mục review

Mục 18: contested opportunity/Hidden Realm offline expiry và reward idempotency.

## Đã triển khai

- Thêm fixture offline cycle riêng sau khi enter realm.
- Xác nhận world tick đóng cycle hết hạn.
- Xác nhận core reward bị từ chối sau expiry và state validator vẫn pass.

## Evidence

- `requirement/06-expansion/HIDDEN_REALM_OFFLINE_CYCLE_REGRESSION_2026-09-17.md`
- `tools/verify_review_batches.js`


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_92_HIDDEN_REALM_CLAIM_GUARD.md`

# Review Batch 92  Hidden Realm Claim Guard

## Mục review

Mục 18: chống claim reward của cycle cũ sau offline catch-up.

## Đã triển khai

- `claimHiddenRealmCore` bắt buộc active cycle, runtime cycle, status và close window khớp nhau.
- `updateHiddenRealms` tự hủy `activeHiddenRealm` và trả nhân vật về parent node khi cycle đóng/chuyển trong lúc offline.
- Không còn state active stale khiến validator fail hoặc reward cũ được claim.

## Regression

`tools/verify_review_batches.js` chạy online claim idempotency và offline cycle expiry/eject/claim rejection.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_93_MAP_STRUCTURE_TRAVEL_CLOSURE.md`

# Review Batch 93  Map Structure/Travel Closure

## Phạm vi

Đóng ba nhánh còn thiếu trong canonical map runtime:

1. Công trình có trạng thái `dismantled` không được góp influence.
2. Hộ Giới Đại Trận có trạng thái `dismantled` không được góp ward protection, encounter-risk reduction hoặc san-drain reduction.
3. Travel weighting phải đọc weather của region thuộc node đích, không dùng nhầm weather của region hiện tại/người xuất phát.

## Runtime contract

- `mapInfluenceSnapshot` chỉ cộng effect của structure không thuộc `disabled` hoặc `dismantled` và còn integrity.
- `wardProtectionAtNode` chỉ lấy ward đang hoạt động, không bị disable/dismantle và còn integrity.
- `travelWeightSnapshot` resolve `node.regionId` trước khi đọc `worldSimulation.regionState`.

## Regression

`tools/verify_review_batches.js` kiểm tra sau dismantle: influence player giảm và ward protection tắt. Syntax, review batches, game/headless UI, deep Dị Thể và performance profile đều pass sau thay đổi.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_BATCH_94_CATALOG_BALANCE_BASELINE.md`

# Review Batch 94  Canonical Catalog Balance Baseline

## Mục tiêu

Chuyển balance catalog từ kiểm tra kiểu dữ liệu/range đơn thuần thành baseline có thể tái lập: mỗi weather, recipe, Công Trình, Dị Thể, path fusion và reward policy đều có dải giá trị được chốt để regression.

## Baseline đã chốt

- Weather: severity `0..5`, duration `1..7` ngày, travel risk `0..0.25`; weather severity cao phải có travel risk đáng kể.
- Recipe: material `1..8`, resource cost `0..10`, success base `0.4..0.8` nếu có.
- Công Trình: build cost `10..25`, tối đa 3 cấp, upgrade base không quá 2 lần build cost, refund `0.25..0.5`.
- Dị Thể: đúng số stage theo catalog, progress threshold `1..10`, stage effect numeric `0..1`.
- Path fusion: toàn bộ cặp path hợp lệ và không vượt cap `0.75`.
- Reward: duplicate reject, pending reward replay idempotent, không dùng pity ngầm.

## Regression

`tools/verify_catalog_balance.js` chạy trên catalog runtime thật, cùng với `validateBalanceCatalog()`; không chỉ kiểm tra file/schema tĩnh.

Đây là balance baseline kỹ thuật có thể kiểm chứng. Playtest cảm nhận vẫn là bước tuning sản phẩm riêng, không được dùng để thay thế invariant runtime.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_FINAL_STATUS_2026-09-17.md`

# REVIEW FINAL STATUS  33 MỤC

Tài liệu này là trạng thái chuẩn hóa sau Batch 92. Nó bổ sung và làm rõ các dòng lịch sử trong `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`; không thay thế requirement chi tiết của từng feature.

## Kết luận theo nhóm

| Nhóm | Trạng thái | Bằng chứng |
|---|---|---|
| 14 | Có baseline runtime canonical cho map, influence, structure và log | Batch 71, 73, 78, 82; `verify_review_batches.js` |
| 58 | Có Fate namespace/effect/instance UI và policy decay `none` | Batch 55, 56, 68, 72; `verify_dichi_deep.js` |
| 916 | Có completion, travel, weather, war, NPC, rumor, relationship và catalog contract | Batch 5965, 77, 89 |
| 1722 | Có discovery, contested/Hidden Realm, action priority, migration, replay và cache contract | Batch 7586, 9192 |
| 2328 | Có catalog validator, structure lifecycle/influence, reward ledger, archive và performance gate | Batch 67, 6970, 78, 89 |
| 2933 | Đã chốt policy canonical và có validator/runtime cho decay, path fusion, Dị Thể exclusion, ownership và NPC offline | Batch 68, 79, 81, 89 |

## Batch 92

- `claimHiddenRealmCore` chỉ claim khi active cycle, runtime cycle, status và close window khớp nhau.
- Offline tick khi cycle đóng hoặc chuyển cycle sẽ hủy active realm stale và đưa nhân vật về parent node.
- Regression đã kiểm tra online idempotency, offline expiry, eject và từ chối claim reward cycle cũ.

## Gate chưa thể tuyên bố hoàn tất

1. Browser E2E trực tiếp chưa chạy được trong môi trường hiện tại vì Chrome chặn localhost/LAN với `ERR_BLOCKED_BY_CLIENT`. HTTP server, asset check, headless render 13 tab và UI contract đã pass.
2. Content balance mới được kiểm tra bằng invariant/boundary; giá, cost, rarity, duration và reward weight vẫn cần tuning/playtest sản phẩm.

Hai gate này không phải lỗ hổng state/schema/runtime đã biết; chúng là giới hạn xác minh và tinh chỉnh nội dung.

## Regression cuối đợt

Đã pass: syntax engine/expansion, review batches, deep Dị Thể, game/headless UI, UI surface contract, coverage 33/33, asset references, expansion stress, runtime profile, novel narrative lint, producer audit, expansion log matrix, random boundaries, character replay, companion runtime và IndexedDB archive retry.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`

# REVIEW REGISTER  MỘT PHẦN / THIẾT KẾ / CHƯA CHỐT

Ngày tổng hợp: 2026-09-16  
Nguồn: toàn bộ hồ sơ trong `SYSTEM_LOGIC_CATALOG`.

File này chỉ chứa các logic chưa đạt trạng thái hoàn thiện để review và quyết định. Các mục đã ghi **ĐÃ CODE** không lặp lại ở đây.

## Cách review

- **P0**: ảnh hưởng trực tiếp đến tính đúng của state/runtime hoặc có nguy cơ mất dữ liệu.
- **P1**: ảnh hưởng lớn đến trải nghiệm/cross-feature nhưng có thể triển khai sau khi core ổn định.
- **P2**: hoàn thiện nội dung, tối ưu hoặc mở rộng.
- **MỘT PHẦN**: đã có một phần runtime/contract nhưng còn thiếu nhánh, UI, migration hoặc test.
- **THIẾT KẾ**: đã có yêu cầu/ý tưởng nhưng runtime chưa đủ để coi là hoàn thành.
- **CHƯA CHỐT**: cần quyết định sản phẩm trước khi code tiếp.

---

## P0  Cần quyết định/triển khai trước

### 1. API influence gradient canonical

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`, `09_IMPLEMENTATION_GAPS_AND_DECISIONS.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - Chưa bảo đảm toàn bộ heatmap, fog, completion, travel weighting và structure eligibility dùng cùng một resolver.
  - Vẫn có nguy cơ đọc faction presence/owner rời rạc thay vì `resolveMapInfluence(state, nodeId)`.
- Cần chốt:
  - Công thức score theo khoảng cách, anchor, terrain, chiến tranh, reputation và structure. >> theo node mà nhân vật khám phá, còn lại thì theo cơ chế của event ngẫu nhiên trên bản đồ
  - Ngưỡng `owner`, `contested`, `pressure`, `confidence`.
  - Cache/invalidation khi faction, war hoặc structure thay đổi.
- Acceptance:
  - Một DTO influence duy nhất được dùng cho map UI, travel, fog và construction.
  - Có test node trung tâm, node tranh chấp, node ngoài influence và offline catch-up.

### 2. Công Trình  Truyền Tống Trận và Hộ Giới Đại Trận

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`, UI requirements
- Trạng thái: **THIẾT KẾ**
- Nội dung còn thiếu:
  - Registry/runtime đầy đủ chưa được chốt.
  - Chưa chốt cost, charge, durability, repair, upgrade, ownership và điều kiện faction.
  - Chưa hoàn thiện UI tab Thế giới và DTO structure thống nhất.
- Cần chốt:
  - Truyền Tống Trận nối anchor nào, có cần cùng faction/claim không. >> Là node mà nhân vật sinh ra và các node tông môn mà nhân vật tham gia, phường thị cũng được gán node nếu xây dựng Truyền tống trận (Công Trình). Rà soát logic sinh ra của nhân vật để phù hợp với map Oxy 100x100 bây giờ.
  - Hộ Giới Đại Trận giảm danger/influence pressure/weather risk theo công thức nào. >> Giảm SAN bị ảnh hưởng
  - Có được dismantle/chuyển chủ hay không. >> Chuyển chủ cho NPC được.
- Acceptance:
  - Build, active, damaged, repair, upgrade, disable đều idempotent.
  - Structure được lưu, hiển thị trên map và ảnh hưởng resolver thật.

### 3. Namespace Nghề chính, Nghề Ẩn và save legacy

- Nguồn: `02_PROGRESS_PATH_PROFESSION.md`, `11_CANONICAL_STATE_SCHEMA.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - Cần chuẩn hóa `player.hiddenProfession`, `professionState.hiddenId` và alias save cũ. >> Không cần quan tâm save cũ- rule coding. Tiếp tục chuẩn hóa
  - Cần audit mọi UI/action đang đọc trực tiếp field cũ.
- Quyết định đã có:
  - Chọn Nghề chính xong khóa nghề thường ngay lập tức.
  - Nghề Ẩn là nghề phụ, mở qua Cổ Tịch và không thay Nghề chính.
- Acceptance:
  - Load save cũ không mất nghề.
  - Chọn lại Nghề chính luôn bị chặn sau commit đầu tiên.
  - Nghề Ẩn chỉ mở/chọn khi có source Cổ Tịch hợp lệ.

### 4. Error map và producer log cũ

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`, `09_IMPLEMENTATION_GAPS_AND_DECISIONS.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - `ERROR_NARRATIVE_MAP` chưa chắc đã bao phủ mọi mã lỗi phát sinh trong engine/expansion.
  - Một số producer cũ vẫn tạo raw system message rồi mới được boundary làm sạch.
- Cần làm:
  - Quét toàn bộ `reason`, `pushHistory`, `history`, `emitGameEvent`.
  - Tạo mapping hoặc fallback trung tính cho mọi internal code. 
  - Không để fallback làm câu văn bị cụt hoặc mất ngữ nghĩa.
- Acceptance:
  - Không có `SCREAMING_SNAKE_CASE`, field name, `Depth`, `session`, `counter` trong player-visible log.
>> Tiếp tục làm và tự cải thiện logic
---

## P1  Cần hoàn thiện sau khi core P0 ổn định

### 5. Fate Phase 3

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN**
- Phạm vi chưa hoàn thiện:
  - Nghịch Mệnh.
  - Trấn Mệnh.
  - Thiên Cơ.
  - Mệnh Đổi.
- Cần chốt:
  - Mỗi action dùng instance nào, cost nào, failure penalty nào.
  - Có yêu cầu Con Đường/realm/relationship không.
  - Có tạo debt/corruption hoặc thay đổi active slot không.
- Rủi ro:
  - Dễ cộng effect hai lần với enhancement/evolution/relationship.
>> Tạo logic riêng cho từng phần để không bị effect hai lần với enhancement/evolution/relationship.
>> cho phép Codex tạo requiment, database dựa trên logic và data đang có
### 6. Policy suy giảm quan hệ Mệnh

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN / CHƯA CHỐT**
- Nội dung:
  - Chưa quyết định Mệnh nằm lâu trong Mệnh Kho có giảm relationship hay không.
  - Chưa có công thức decay, grace period, giới hạn sàn và log thông báo.
- Cần chốt một trong ba policy:
  1. Không decay, quan hệ vĩnh viễn. >> Chọn 1
  2. Decay chậm theo absolute day sau grace period.
  3. Chỉ decay khi Mệnh bị bỏ quên hoặc có event đặc biệt.

### 7. Audit effect tiến hóa Mệnh

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa audit hết effect base, enhancement, relationship, combo và evolution branch.
  - Chưa có invariant tự động chứng minh không cộng kép.
- Acceptance:
  - Preview và commit cho cùng kết quả.
  - Deserialize không nhân đôi effect.
  - Branch chỉ áp dụng một lần.
>> Audit hết đi
### 8. UI Mệnh theo instance

- Nguồn: `01_FATE_AND_MENH_SO.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung còn thiếu:
  - UI chưa thể hiện đầy đủ relationship level/XP, nurture history, resonance history và evolution branch theo instance.
  - Cần tách rõ definition card với owned instance card.

>> Thực hiện hoàn thiện đi
### 9. Completion và node history

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa bảo đảm mọi action ghi sub-location, structure, actor seen, weather và faction change.
  - Completion hiện có nguy cơ chỉ là boolean thay vì các lớp progress.
- Acceptance:
  - Reload/save vẫn giữ completion chi tiết.
  - Node detail giải thích được vì sao node đã hoàn thành bao nhiêu phần.

>> Thực hiện đi
### 10. Travel weighting đầy đủ

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Cần test đồng thời terrain, danger, weather, war, contested, party và structure.
  - Fast travel phải phụ thuộc anchor/waypoint đã khám phá.
- Rủi ro:
  - Route preview và travel commit có thể tính khác nhau nếu dùng hai code path.
>> Thực hiện đi
### 11. Weather catalog và severity

- Nguồn: `04_WORLD_SIM_FACTION_WEATHER.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Data hiện chưa bao phủ đồng nhất mọi weather được mô tả trong requirement.
  - Cần chuẩn hóa tên `suong`, `suong_mu`, `tuyet`, `am_vu` và alias.
  - Severity/hysteresis chưa hoàn toàn data-driven.
- Acceptance:
  - Catalog có weather ID, label, severity, duration, transition và effect.
  - NPC, travel, fog, faction và log dùng cùng weather resolver.
>> Thực hiện đi
### 12. War front và incident cascade

- Nguồn: `04_WORLD_SIM_FACTION_WEATHER.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa có deterministic replay đầy đủ.
  - Cần kiểm tra idempotency khi offline catch-up chạy lại cùng ngày.
  - Cần chuẩn hóa outcome → faction/map/NPC/quest cascade.
>> Thực hiện đi
### 13. NPC scheduler nâng cao

- Nguồn: `05_NPC_RELATIONSHIP_COMPANION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Nhu cầu, congestion, queue và topology movement chưa đầy đủ.
  - State machine cần guard rõ cho idle/travel/present/interact/shelter/combat.
  - Cần tránh NPC teleport qua edge không hợp lệ.
>> Thực hiện đi
### 14. Witness, rumor và memory propagation

- Nguồn: `05_NPC_RELATIONSHIP_COMPANION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Chưa test lan truyền rumor qua nhiều node, faction và offline tick.
  - Chưa chốt confidence, expiry và source priority.
>> Thực hiện đi
### 15. Player relationship và companion

- Nguồn: `05_NPC_RELATIONSHIP_COMPANION.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Bảng relationship level/decay chưa thống nhất hoàn toàn giữa NPC.
  - Companion mutation/equipment cần audit save round-trip.
  - Cần chốt distinction giữa loyalty, trust và relationship score.

### 16. Catalog Công Pháp và recipe

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Effect field của Công Pháp/recipe cần đưa về schema chung.
  - Cần kiểm tra category, family, cost, corruption, cooldown và mastery không bị trùng nghĩa.

### 17. Dị Chí UI và discovery states

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - UI phải tách `discovered`, `verified`, `collected`, `rewarded`.
  - Dị Chí chỉ là lớp tri thức/phát hiện, không được tự biến thành Con Đường/Nghề/Dị Thể.

### 18. Contested opportunity và Hidden Realm

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Cần deterministic test cho expiry, claim, contest, reward và offline.
  - Enter/exit fail phải rollback location/reward/anchor.

### 19. UI view model và action priority

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Audit từng feature để UI không đọc raw state.
  - Bổ sung ma trận action priority cho combat, search, ritual, opportunity, travel và structure cùng lúc.
  - Kiểm tra duplicate listener/duplicate execution sau reload.

### 20. Legacy history và statDisplay migration

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`, `11_CANONICAL_STATE_SCHEMA.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Event cũ chưa có `statDisplay` cần derive/migrate không làm mất narrative.
  - History cũ chứa raw system text cần render lại an toàn.
  - Cần test load save qua nhiều schema version.

### 21. Deterministic replay

- Nguồn: `08_DATA_RUNTIME_PERFORMANCE.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Random của expansion, war, auction, encounter và discovery chưa chắc đều seed theo action key.
  - Preview không được tiêu hao RNG của commit.

### 22. Cache invalidation và performance profiling

- Nguồn: `08_DATA_RUNTIME_PERFORMANCE.md`
- Trạng thái: **MỘT PHẦN**
- Nội dung:
  - Cần đo map influence, NPC view model, render log và offline catch-up.
  - Cần xác định revision/invalidation key thay vì cache theo thời gian không kiểm soát.

---

## P2  Thiết kế mở rộng/chưa chốt sản phẩm

### 23. Dị Thể catalog đầy đủ

- Nguồn: `02_PROGRESS_PATH_PROFESSION.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Danh sách Dị Thể, trigger, stage, progress, effect và exclusion.
  - Dị Thể tác động đến corruption, faction, combat, resistance và Con Đường ở mức nào.

### 24. Structure cost/durability/upgrade

- Nguồn: `03_MAP_WORLD_CONSTRUCTION.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Tài nguyên build/repair/upgrade.
  - Durability/charge và tốc độ suy giảm.
  - Ownership, dismantle, chuyển chủ và faction petition.

### 25. Influence contribution của structure

- Nguồn: `04_WORLD_SIM_FACTION_WEATHER.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Structure cộng trực tiếp score hay tạo anchor mới.
  - Hộ Giới Đại Trận tác động influence hay chỉ tác động danger.
  - Khi damaged/disabled thì score giảm bao nhiêu.

### 26. Reward source canonical

- Nguồn: `06_CONTENT_ITEMS_TECHNIQUES_DISCOVERY.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Discovery/quest/opportunity reward lấy từ catalog nào.
  - Reward có thể duplicate không, có pity/guaranteed result không.

### 27. Archive/history retention

- Nguồn: `07_UI_ACTION_LOG_SAVE.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - Giới hạn history local/archive.
  - Event nào giữ vĩnh viễn, event nào prune.
  - Archive có lưu raw event hay chỉ canonical snapshot.

### 28. Performance budget thiết bị yếu

- Nguồn: `08_DATA_RUNTIME_PERFORMANCE.md`
- Trạng thái: **THIẾT KẾ**
- Cần chốt:
  - FPS/render budget cho map cosmic.
  - Kích thước story history tối đa.
  - Số NPC/tick và số ngày offline catch-up tối đa.

---

## Chưa chốt ở cấp sản phẩm

### 29. Decay quan hệ Mệnh

Đã nêu ở mục 6. Cần người duyệt chọn policy trước khi code vì quyết định này ảnh hưởng progression dài hạn và save balance.

### 30. Mức độ song tu/dung hợp Con Đường

Chưa chốt player có thể giữ bao nhiêu path, điều kiện chuyển, cách cộng affinity và cách xử lý xung đột effect.

### 31. Dị Thể có được loại trừ nghề/path hay không

Chưa chốt Dị Thể chỉ là modifier hay có quyền khóa nghề, khóa Con Đường, đổi faction và tạo ending riêng.

### 32. Policy structure ownership

Chưa chốt structure thuộc player, faction, guild hay node; ai được repair/upgrade; khi faction đổi chủ thì structure xử lý thế nào.

### 33. Độ chi tiết NPC offline

Chưa chốt offline simulation có mô phỏng actor-level đầy đủ hay chỉ mô phỏng aggregate population/event.

---

## Thứ tự đề xuất sau khi review

1. Chốt mục 14 và 2932.
2. Chuẩn hóa state/migration cho nghề, influence, structure và legacy history.
3. Hoàn thiện P1 theo thứ tự map → world tick → NPC → content → UI.
4. Chạy deterministic/offline/performance gate.
5. Chỉ sau đó mở rộng các thiết kế P2.

## Ô quyết định của người review

| ID | Quyết định | Ghi chú |
|---|---|---|
| 1 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 2 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 3 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 4 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 522 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 2328 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |
| 2933 | ☐ Chấp nhận ☐ Sửa ☐ Tạm hoãn | |

---

## Cập nhật triển khai theo đợt  2026-09-16

Quyền quyết định: Codex được phép tự tạo logic còn thiếu và cập nhật requirement/schema hiện hành cho toàn bộ 33 mục. Các quyết định dưới đây là baseline coding, không phải để lại ở trạng thái thiết kế:

| Đợt | Phạm vi | Trạng thái | Bằng chứng/runtime |
|---|---|---|---|
| Batch 54 / P1 | Muc 16/18: Cong Phap, Cong Thuc, Bi Canh/Co Mo | Da bo sung schema + runtime validator + regression claim idempotency | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `TECHNIQUE_RECIPE_HIDDEN_REALM_SCHEMA_2026-09-17.md` |
| Batch 55 / P1 | Muc 5: Fate Phase 3 advanced actions | Da chot catalog scope/cost/effectSource, validator namespace va regression | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `FATE_PHASE3_ADVANCED_ACTION_CANONICAL_2026-09-17.md` |
| Batch 57 / P0 | Muc 3: profession namespace primary/hidden va save alias | Da bo sung validator primary/secondary/alias, migration invariant va regression | `js/expansion.js`, `tools/verify_review_batches.js`, `PROFESSION_NAMESPACE_RUNTIME_INVARIANTS_2026-09-17.md` |
| Batch 58 / P0 | Muc 4: player-facing error va producer log boundary | Da them reason mapper dung chung cho alert/log, audit regression internal code va technical token | `js/engine.js`, `js/main.js`, `tools/verify_log_narrative.js`, `PLAYER_FACING_ERROR_BOUNDARY_2026-09-17.md` |
| Batch 59 / P1 | Muc 9: completion va node history theo lop | Da them DTO mapCompletionDetailed voi visited/sub-location/structure/weather/actor/faction va history coverage | `js/expansion.js`, `tools/verify_review_batches.js`, `MAP_COMPLETION_LAYERED_NODE_HISTORY_CONTRACT_2026-09-17.md` |
| Batch 60 / P1 | Muc 10: travel weighting day du | Da them terrain/weather/influence/structure/party weights vao canonical travel DTO va regression preview-commit | `js/expansion.js`, `tools/verify_review_batches.js`, `TRAVEL_WEIGHT_RESOLVER_CANONICAL_2026-09-17.md` |
| Batch 61 / P0 | Muc 24: structure cost/durability/upgrade | Da loai bo hardcode cost/repair/upgrade/refund, moi action doc STRUCTURE_CATALOG duy nhat | `js/expansion.js`, `STRUCTURE_RUNTIME_CATALOG_SINGLE_SOURCE_2026-09-17.md` |
| Batch 62 / P1 | Muc 11: weather alias/severity/effect resolver | Da them weatherSnapshot, alias suong_mu, effect catalog, catalog validation va regression | `js/expansion.js`, `tools/verify_review_batches.js`, `WEATHER_RESOLVER_ALIAS_EFFECT_CANONICAL_2026-09-17.md` |
| Batch 63 / P1 | Muc 13: NPC scheduler state machine/topology | Da them validator state/edge/queue/sub-location/needs va regression invalid topology | `js/expansion.js`, `tools/verify_review_batches.js`, `NPC_SCHEDULER_STATE_MACHINE_VALIDATOR_2026-09-17.md` |
| Batch 64 / P1 | Muc 14: witness/rumor/memory propagation | Da chot confidence/TTL/source priority, sua comparator va them validator multi-node/offline | `js/expansion.js`, `tools/verify_review_batches.js`, `RUMOR_WITNESS_PROPAGATION_POLICY_2026-09-17.md` |
| Batch 65 / P1 | Muc 15: companion mutation/recovery/save invariant | Da them validator state/loyalty/corruption/mastery/damage ledger/recovery, noi vao expansion validation va regression mutation round-trip | `js/expansion.js`, `tools/verify_review_batches.js`, `COMPANION_MUTATION_SAVE_INVARIANTS_2026-09-17.md` |
| Batch 66 / P1 | Muc 19/26: contested opportunity rollback va reward idempotency | Da them opportunity history retention, expiry online/offline, validator pending/history va regression khong lap reward/history | `js/expansion.js`, `tools/verify_review_batches.js`, `CONTESTED_OPPORTUNITY_ROLLBACK_REWARD_LEDGER_2026-09-17.md` |
| Batch 67 / P2 | Muc 22/28: performance profile va runtime budget | Da them validator profile/FPS/render/history/NPC/offline window va metrics gate, regression weak profile | `js/expansion.js`, `tools/verify_review_batches.js`, `08_DATA_RUNTIME_PERFORMANCE_BUDGET_VALIDATOR_2026-09-17.md` |
| Batch 69 / P2 | Muc 19-28: UI surface, novel log, archive retention va performance gate | Da chay UI/log/archive/profile gate, xac nhan history 300, IndexedDB retry, novel grouping va baseline save; sua validation performance theo baseline device-independent | `js/ui.js`, `js/expansion.js`, `tools/verify_ui_surface_contract.js`, `tools/verify_indexeddb_archive.js`, `tools/profile_runtime_budget.js`, `UI_ARCHIVE_PERFORMANCE_GATE_2026-09-17.md` |
| Batch 70 / P1 | Muc 24/32: World UI ownership policy | Da them renderer ownership/quyen sua-nang cap-thao do, dung chung structureManagerDecision va regression UI contract | `js/ui.js`, `tools/verify_ui_surface_contract.js`, `WORLD_STRUCTURE_OWNERSHIP_UI_2026-09-17.md` |
| Batch 71 / P0 | Muc 1/2/9/10: map coordinate/influence canonical validation gate | Da noi validator coordinates/influence/cache revision vao validateExpansionState va regression node thieu toa do | `js/expansion.js`, `tools/verify_review_batches.js`, `MAP_CANONICAL_VALIDATION_GATE_2026-09-17.md` |
| Batch 72 / P1 | Muc 5/7: Fate effect composition va no-duplicate audit | Da them validator base/enhancement/relationship/evolution/advanced namespace, deterministic stat check va save-load regression | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `FATE_EFFECT_COMPOSITION_VALIDATOR_2026-09-17.md` |
| Batch 73 / P0 | Muc 4/20: runtime log surface validator | Da them validator history sau action/save-load, technical token sanitization, empty narrative va grouping novel theo ngay; noi vao validateExpansionState | `js/engine.js`, `js/expansion.js`, `tools/verify_review_batches.js`, `LOG_SURFACE_RUNTIME_VALIDATOR_2026-09-17.md` |
| Batch 74 / P1 | Muc 12: war front/cascade state validator | Da them validator faction topology/score/status/outcome/intervention, noi vao expansion validation va regression offline clone deterministic + invalid topology | `js/expansion.js`, `tools/verify_review_batches.js`, `WAR_CASCADE_STATE_VALIDATOR_2026-09-17.md` |
| Batch 75 / P1 | Muc 3/6/17: profession namespace va discovery lifecycle | Da them validator discovery status/transition day, giu codexClues tach metadata, noi vao expansion validation va regression status sai | `js/expansion.js`, `tools/verify_review_batches.js`, `DISCOVERY_LIFECYCLE_NAMESPACE_VALIDATOR_2026-09-17.md` |
| Batch 68 / product | Muc 29-33: product policy decay/path/Dị Thể/ownership/offline | Da chot policy canonical, API snapshot/validator, structure permission resolver va regression faction repair/upgrade | `js/expansion.js`, `tools/verify_review_batches.js`, `PRODUCT_POLICIES_29_33_CANONICAL_2026-09-17.md` |
| Batch 56 / P1 | Muc 8: UI Mệnh theo instance | Da bo sung instance metadata, relationship history, evolution va advanced usage vao Fate card; requirement UI contract | `js/ui.js`, `FATE_INSTANCE_CARD_UI_CONTRACT_2026-09-17.md` |
| Batch 1 / P0 | Mục 14: influence canonical, map structure, spawn node, weather/log regression | Đang triển khai | `js/expansion.js`, `js/engine.js`, `MAP_INFLUENCE_STRUCTURE_CANONICAL_2026-09-16.md` |
| Batch 1 / P0 | Mục 68: nghề chính/phụ, canonical namespace, Fate advanced actions | Đã có nền runtime; tiếp tục audit UI | `PROFESSION_NAMESPACE_AND_SAVE_NORMALIZATION_2026-09-16.md`, `FATE_ADVANCED_ACTIONS_CANONICAL_2026-09-16.md` |
| Batch 2 / P1 | Mục 922: world tick, NPC, content/discovery, action/log/save | Đang triển khai | World/NPC/discovery/action/log đã có runtime; còn audit catalog, companion, contested rollback và archive gate |
| Batch 3 / P2 | Mục 2328: UI/performance/archive/reward canonical | Đang triển khai | Reward ledger, structure lifecycle và performance baseline đã có; còn hoàn thiện catalog/retention/device budget |
| Batch 4 / product | Mục 2933: decay, song tu, Dị Thể, ownership, offline NPC | Đã cho phép Codex tự chốt baseline; chưa hoàn tất | Sẽ bổ sung quyết định canonical vào các requirement tương ứng |

### Baseline đã chốt để code

- Mục 1: influence của node đã khám phá dùng canonical gradient; node chưa khám phá chỉ nhận event influence và không lộ faction gradient.
- Mục 2: node spawn lấy từ `character.startLocationId` và tọa độ bản đồ 100×100; không mặc định tọa độ `[0,0]` khi có node hợp lệ.
- Mục 3: Truyền Tống Trận chỉ hợp lệ ở node spawn, node tông môn/faction đang tham gia, phường thị/thành/cảng hoặc outpost đã lập; công trình có owner và lịch sử chuyển giao.
- Mục 4: Hộ Giới Đại Trận giảm hao Thanh Tỉnh, nguy cơ chạm trán và nguy cơ nguyền; hiệu lực đi qua resolver runtime.
- Mục 6: save cũ không cần tương thích ngược; save mới và save được load qua canonical normalization.
- Mục 7: Nghịch Mệnh, Trấn Mệnh, Thiên Cơ và Mệnh Đổi dùng namespace `fateAdvancedActions`, tách khỏi enhancement/evolution/relationship.
- Mục 8: quan hệ Mệnh dùng `decayPolicy: "none"`; không tự tụt stage/XP theo thời gian.
- Mục 9: node history/completion đã có sub-location, structure và faction change; đang bổ sung actor/weather/replay coverage.
- Mục 11: weather catalog canonical đã có severity/alias/history; còn thiếu data-driven duration/transition UI toàn bộ.
- Mục 1214: world tick, war cascade, NPC edge scheduler và rumor propagation đã có nền runtime idempotent; cần test trực tiếp và hoàn thiện offline aggregate.
- Mục 17: discovery/Dị Chí đã tách state `discovered/verified/collected/rewarded`; không được suy diễn thành Con Đường/Nghề/Dị Thể.
- Mục 20: legacy history đã derive `statDisplay` và dùng ID deterministic khi deserialize.
- Mục 21: replay-aware RNG đã phủ map encounter, search/discovery, loot, cultivation, combat bonus, breakthrough, market và SAN branch; random khởi tạo nhân vật vẫn là random tạo mới, không phải replay commit.
- Mục 24: structure đã có repair/upgrade/disable runtime và UI tab Thế giới; cần bổ sung resource balance/performance gate.

### Quy tắc hoàn tất một mục

Một mục chỉ được chuyển sang **ĐÃ HOÀN TẤT** khi có đủ: requirement canonical, state/schema rõ ràng, runtime resolver/action, UI nếu có bề mặt người chơi, migration/normalization, và ít nhất một regression check deterministic. Các mục còn thiếu một thành phần vẫn phải ghi rõ **ĐANG TRIỂN KHAI**, không được đánh dấu hoàn tất giả.


---

## Source: `SYSTEM_LOGIC_CATALOG\REVIEW_STATUS_SUPPLEMENT_2026-09-17.md`

# REVIEW STATUS SUPPLEMENT  2026-09-17

Tài liệu này là phụ lục trạng thái của `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`. Các batch trong phụ lục là bằng chứng triển khai sau phần bảng lịch sử cũ của register; không dùng nhãn cũ một phần/chưa chốt nếu batch tương ứng đã có requirement, runtime và regression.

## Các đợt đã hoàn thiện trong vòng hiện tại

| Batch | Mục review | Kết quả |
|---|---|---|
| 76 | 19  action priority / resolver | Validator kiểm tra ID, priority, alias, projection deterministic và overlap; nối vào expansion validation. |
| 77 | 11  weather catalog/severity | Validator runtime kiểm tra catalog, severity, duration, history và transition hợp lệ. |
| 78 | 2, 24, 25, 32  Công Trình/structure | Validator state kiểm tra owner, status, integrity, level, inventory, waystation charges và duplicate active type. |
| 79 | 6, 15  relationship ledger | Validator kiểm tra event identity, day/delta và không cho memory chứa orphan relationship key. |
| 80 | 18  Hidden Realm | Validator kiểm tra cycle, window, status, reward idempotency, competitor progress và active reference. |
| 81 | 23, 31  Dị Thể | Validator state kiểm tra active catalog ID, player mirror, candidate threshold, history/rejected uniqueness. |
| 82 | 1, 9, 22  map cache/invalidation | Runtime có revision, invalidation count, last invalidation, cache revision và metrics contract. |
| 83 | 21  deterministic replay | Replay envelope kiểm tra seed/save/turn, sequence counters, world queue và unique event/task/encounter IDs. |
| 84 | 19  UI command binding | Static audit chứng minh mọi `expansionButton` command có handler runtime; delegated binding và action queue vẫn là single path. |
| 85 | 3, 20  save migration | Deserialize fixture v1/v7, legacy hidden-profession alias, legacy history ID và deterministic `saveId`; canonical round-trip vẫn pass. |
| 86 | 1, 18  runtime Hidden Realm coordinates | Node entry/path/core động được cấp tọa độ deterministic, map validator không còn fail sau catalog runtime rebuild. |
| 88 | UI map/world/progression/log surfaces | Headless render toàn bộ 13 tab; phát hiện và sửa fallback region description bị leak `undefined`. |
| 89 | 11, 16, 2326, 3031  catalog balance | Thêm boundary validator cho weather, recipe, Dị Thể, Công Trình, reward và Path fusion; nối vào expansion validation. |
| 90 | UI asset integrity | Kiểm tra `assets/...` reference trong HTML/JS/CSS và data portrait catalog đều trỏ tới file tồn tại; 16 unique asset files hiện pass. |
| 91 | Browser QA evidence | HTTP local index/asset trả 200; Chrome local bị `ERR_BLOCKED_BY_CLIENT` trước khi load, nên pixel/responsive QA vẫn mở và được ghi rõ, không đánh dấu pass giả. |
| 92 | 18  Hidden Realm offline lifecycle | Sửa claim guard cycle/window và tự eject active realm khi offline tick đóng cycle hoặc chuyển cycle; regression offline expiry pass. |
| 93 | 1, 9, 10, 2425  Map structure/travel closure | Structure dismantled bị loại khỏi influence/ward protection; travel weight đọc weather của node đích; regression map lifecycle pass. |
| 94 | 11, 16, 2326, 3031  Catalog balance baseline | Thêm regression runtime trên catalog thật: 8 weather, 6 recipes, 4 Công Trình, 6 Dị Thể, path fusion và reward policy đều pass baseline định lượng. |

## Requirement và code tương ứng

- Batches 7684 có requirement riêng trong thư mục này.
- Batch 8586 và gate coverage 33 mục được ghi trong các requirement bổ sung; chạy `node tools/verify_33_item_coverage.js` để kiểm tra đủ mapping requirement → runtime/schema → regression.
- Runtime chính: `js/engine.js`, `js/expansion.js`, `js/ui.js`, `js/main.js`.
- Regression chính: `tools/verify_review_batches.js`, `tools/verify_ui_surface_contract.js`, `tools/verify_expansion_stress.js`, `tools/profile_runtime_budget.js`.

## Trạng thái 33 mục

- Mục 14: đã có canonical influence/structure/map/log runtime; còn browser E2E local và một số balance dữ liệu cần kiểm định nội dung.
- Mục 58: Fate namespace/effect/evolution/instance UI đã có validator và regression; policy decay được chốt là `none`.
- Mục 916: completion, travel, weather, war, NPC, rumor, relationship, Công Pháp/recipe đã có resolver hoặc validator tương ứng; phần còn mở chủ yếu là mở rộng content catalog.
- Mục 1722: Dị Thể/discovery lifecycle, contested/hidden realm, action priority, legacy history, replay và cache đã có contract runtime/test.
- Mục 2328: Dị Thể catalog, structure lifecycle/influence, reward source, archive retention và performance budget đã có requirement/code/test theo các batch trước và 7783.
- Mục 2933: product policy đã được chốt canonical cho decay, song tu/path, Dị Thể exclusion, structure ownership và NPC offline; các giới hạn content/balance vẫn được ghi là phần cần tinh chỉnh, không giả định đã cân bằng hoàn toàn.

## Phần chưa thể tuyên bố hoàn tất

1. Browser E2E trực tiếp trên local worktree: môi trường Chrome hiện chặn `localhost` với `ERR_BLOCKED_BY_CLIENT`; static UI contract và Node regression đã chạy, nhưng không thay thế được click test trên browser local.
2. Cân bằng số liệu content (giá, cost, rarity, duration) vẫn là tuning sản phẩm; validator chỉ bảo đảm invariant và không tự chứng minh balance đúng.


---

## Source: `01-core\UNRESOLVED_PRODUCT_POLICIES_DECIDED_2026-09-17.md`

# UNRESOLVED PRODUCT POLICIES  ĐÃ CHỐT VÀ CODE 2026-09-17

Tài liệu này chốt các mục 2933 của `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`. Các policy là canonical cho runtime, save migration và UI view model.

## 29  Quan hệ Mệnh

- Quan hệ Mệnh không bị decay thụ động theo thời gian, offline hay world tick.
- `stagnantDays` chỉ là bộ đếm không tương tác; nó không trừ `points`, `stage`, `xp` hay effect.
- `decayPolicy` canonical là `none`; policy khác là state lỗi cần phát hiện, không tự âm thầm áp dụng.
- Khi đủ 60 ngày nguội, người chơi có thể dùng luồng giải phóng Mệnh đã có; đây là hành động chủ động, không phải decay tự động.

## 30  Song tu/Dung Hợp Con Đường

- Player có tối đa hai slot: một Con Đường chính và một Con Đường phụ.
- Con Đường phụ chỉ mở qua explicit transition đã xác nhận, tiêu hao tài nguyên và không cho ghi đè bằng action thường.
- Không cho chọn trùng primary/secondary; affinity dung hợp bị giới hạn `0.75`.
- `pathState` là nguồn canonical; mirror trên `player` chỉ phục vụ tương thích save cũ.

## 31  Dị Thể và loại trừ

- Dị Thể là modifier/progression branch độc lập; mặc định không khóa Nghề, Con Đường, faction hoặc ending.
- Chỉ các mảng `exclusions.paths` và `exclusions.professions` trong catalog mới tạo blocker khi claim.
- Không được suy diễn exclusion từ tên Dị Thể, branch hoặc ending tag.

## 32  Ownership Công Trình

- Mọi công trình active phải có `ownerType` thuộc `player`, `npc` hoặc `faction` và có `ownerId`.
- Công trình mới do player tạo thuộc player; chuyển chủ là action explicit, phải ghi `transferHistory` và node history.
- Công trình faction sau petition thuộc faction; công trình NPC sau transfer thuộc NPC.
- Quyền repair/upgrade/dismantle kiểm tra owner hiện tại; không dùng quyền của chủ cũ sau transfer.

## 33  NPC offline

- Offline dùng hai lớp: aggregate simulation cho phần thời gian xa và actor-level deterministic projection cho cửa sổ gần.
- Cửa sổ actor mặc định và retention là 30 ngày; batch aggregate mặc định 3 ngày.
- Actor projection giữ final state, incident, actor history, memory/rumor giới hạn; không giả lập từng frame hoặc từng UI action.
- `lastProcessedDay` là idempotency key; gọi lại cùng target không được nhân đôi event/reward.

## Runtime contract và phần chưa hoàn thiện

`GameExpansion.designPolicySnapshot()` công bố policy; `validateDesignPolicies()` kiểm tra save/runtime. Regression nằm trong `verify_review_batches.js`.

Các giá trị balance chi tiết, tần suất NPC cụ thể và FPS thiết bị yếu vẫn là tuning gate riêng; không được coi là thay đổi policy ở tài liệu này.


---

## Source: `SYSTEM_LOGIC_CATALOG\33_ITEM_COMPLETION_MATRIX_2026-09-16.md`

# Ma trận bằng chứng 33 mục  2026-09-16

Đây là audit hiện trạng sau các đợt coding. `ĐÃ CODE` chỉ có nghĩa runtime chính đã có; mục chỉ được nâng thành `ĐÃ HOÀN TẤT` khi đủ UI, migration và regression đúng phạm vi.

| # | Trạng thái hiện tại | Bằng chứng chính | Phần còn thiếu / gate |
|---:|---|---|---|
| 1 | ĐÃ CODE | `mapInfluenceSnapshot`, fog/completion/travel/construction dùng resolver; player/faction structure, event influence, cache invalidation và offline round-trip có test | Browser visual QA |
| 2 | ĐÃ CODE | build/repair/upgrade/disable/transfer, UI Thế giới, structure history | Benchmark UI và cân bằng resource |
| 3 | ĐÃ CODE | `chooseProfessionLocked`, namespace primary/secondary/hidden, save normalization | Audit mọi producer alias còn lại |
| 4 | ĐÃ CODE MỘT PHẦN | canonical log renderer, error narrative map, narrative lint; static audit `tools/verify_log_producers.js` đạt 66/66 producer literal | Browser visual QA và audit các producer động/ngoài `engine.js` + `expansion.js` |
| 5 | ĐÃ CODE | namespace Fate phase 3, advanced action records và effect-layer contract | Browser card/rollback failure UI QA |
| 6 | ĐÃ CODE | `decayPolicy: none`, không tick decay; regression 120 ngày giữ nguyên stage/XP/points | Browser hiển thị lịch sử dài ngày |
| 7 | ĐÃ CODE | base/enhancement/relationship/evolution/suppression/advanced breakdown; preview/commit evolution deep-equal regression | Audit browser hiển thị từng layer |
| 8 | ĐÃ CODE | UI definition/instance, history relationship/resonance | Visual QA browser |
| 9 | ĐÃ CODE MỘT PHẦN | node history/completion có sub-location/structure/faction/actor/weather, retention 50 và UI Dấu vết gần đây tại node | Coverage từng producer/action và browser visual QA |
| 10 | ĐÃ CODE | travelPlan dùng distance/weather/danger/war/contested/ward/anchor; engine movement dùng cùng resolver và OXY canonical | Fast travel/route UI browser QA |
| 11 | ĐÃ CODE MỘT PHẦN | weather catalog/alias/severity/history/default duration/transition pool/resolver; World UI hiển thị severity, ngày hết hạn và 5 chuyển đổi gần nhất | Browser kiểm tra đầy đủ transition/fog/NPC surface |
| 12 | ĐÃ CODE | war outcome/cascadeApplied, faction/map cascade và seeded world tick | UI chiến tuyến/chi tiết mặt trận còn cần browser QA |
| 13 | ĐÃ CODE | NPC edge scheduler, needs, shelter/travel states, deterministic node capacity queue | Dedicated queue/interact UI và actor benchmark |
| 14 | ĐÃ CODE MỘT PHẦN | rumor confidence/expiry/priority/source ledger, một hop mỗi tick, relay multi-node; canonical `factionBulletin` projection và UI panel đã nối | Browser/content QA và faction-specific balance |
| 15 | ĐÃ CODE | relationship dimensions + companion contract/ledger/recovery | Actor simulation benchmark |
| 16 | ĐÃ CODE | technique DTO và recipe transaction canonical | Snapshot catalog tĩnh mở rộng |
| 17 | ĐÃ CODE | Dị Chí state machine/UI statuses, tách khỏi path/profession/Di Thể | Visual QA từng trạng thái |
| 18 | ĐÃ CODE | contested expiry trước reward, hidden realm enter/exit/reward receipt; offline expiry regression | Offline cycle đầy đủ cho mọi reward branch |
| 19 | ĐÃ CODE | action priority resolver, pending/combat gates, regression | Duplicate listener browser QA |
| 20 | ĐÃ CODE | legacy deterministic ID/statDisplay/schema normalization | Multi-version fixture rộng hơn |
| 21 | ĐÃ CODE MỘT PHẦN | replay RNG cho map/search/loot/cultivation/combat/breakthrough/market; procedural item ID dùng seed + state sequence; character creation/factory nhận injected RNG; đã có deep-equal discovery, combat transcript và character-creation replay | Random producer độc lập ngoài state còn lại và audit toàn bộ producer `Math.random()` |
| 22 | ĐÃ CODE MỘT PHẦN | influence cache revision + runtime metrics/profile gate | Browser/device profiling |
| 23 | ĐÃ CODE MỘT PHẦN | Dị Thể catalog có trigger/threshold/stage/branch/benefit/stageEffects/endingTags/factionAffinity/cost/exclusions; modifier stage-aware, `specialPhysiqueOutcome` resolver và save regression | Catalog mở rộng và balance |
| 24 | ĐÃ CODE | structure cost/durability/repair/upgrade/transfer/dismantle, 40% level-scaled refund, history retention | Balance audit và browser confirmation |
| 25 | ĐÃ CODE | ward influence/danger/SAN effects, player/faction ownership, invalidation; regression active > disabled và repair tái kích hoạt | Browser/UI score matrix |
| 26 | ĐÃ CODE | reward ledger/source receipts cho quest (EXP/Công Đức/Linh Thạch/Fate/Công Pháp), contract/realm/opportunity/collection, world event, tournament, war, prisoner, auction, companion scout, tomb, legacy và companion release | Catalog balance/pity policy và audit reward producer ngoài canonical expansion |
| 27 | ĐÃ CODE MỘT PHẦN | history 300/100 retention, IndexedDB retry queue; large-save profile đạt 3,750,755 bytes dưới baseline localStorage 5MB | Browser quota thực tế và archive benchmark IndexedDB lớn |
| 28 | ĐÃ CODE MỘT PHẦN | runtime budget snapshot + Node profile; influence average 0.138ms, cache metrics và save-size profile | FPS thiết bị yếu |
| 29 | ĐÃ CODE | Fate relationship không decay | Long-day regression |
| 30 | ĐÃ CODE MỘT PHẦN | Path/Profession/Di Thể namespace tách riêng; explicit secondary path transition/cost/save regression | Fusion-specific affinity cap, content và ending balance |
| 31 | ĐÃ CODE MỘT PHẦN | Dị Thể là modifier/branch riêng, stage-aware, có endingTags/factionAffinity metadata, outcome projection và claim guard đọc exclusions theo path/profession | Exclusion content và balance |
| 32 | ĐÃ CODE MỘT PHẦN | ownerType/ownerId/transferHistory + NPC transfer; world UI có tháo dỡ structure, lập trạm và petition faction | Browser UI QA, faction petition content/balance |
| 33 | ĐÃ CODE MỘT PHẦN | `offlinePolicy` canonical: aggregate phần cũ, actor-level 30 ngày cuối với `actorHistorySnapshot`, `lastOfflineAudit`, mode/idempotency và stress 30/60 ngày | Browser save/load lớn, thiết bị yếu và nội dung lịch sử actor ngoài projection |

## Batch 17 evidence

- Discovery lifecycle now has the canonical `discoveryStatusSummary(state)` read model
  with global/category counters, invalid-status normalization and monotonic transition
  semantics. The Dị Thể UI shows the four lifecycle totals; regression checks summary,
  category projection and rollback rejection.
- Remaining gates for item 17 are limited to browser visual QA and content/balance review.

## Batch 18 evidence

- Node-history regression now covers sub-location, structure, faction, actor, weather
  and completion event types, duplicate-key idempotency, required day/region metadata
  and the 50-entry retention boundary.

## Batch 19 evidence

- Profession namespace migration now normalizes legacy hidden-primary/hiddenId/player
  aliases into the canonical hidden secondary slot, filters normal-profession aliases,
  mirrors compatibility fields and preserves hidden IDs deterministically. Regression
  covers repeated normalization and invalid legacy secondary data.

## Batch 20 evidence

- Dị Thể now has `validateSpecialPhysiqueCatalog()` enforcing required identity,
  progression, stage-effect, ending, affinity, cost and exclusion fields. Deep
  regression verifies every catalog entry before stage/outcome tests.

## Batch 21 evidence

- Hộ Giới Đại Trận now applies its canonical `sanDrainReduction` through the world
  modifier resolver; disabling a structure writes node history and invalidates influence.
  Deep regression verifies active ward SAN protection alongside corruption/encounter effects.

## Batch 22 evidence

- Log producer audit now scans every `js/*.js` source for literal history/event producers,
  while runtime expansion matrix covers concatenated messages. Results remain 66/66 and
  43/43 with mapped/unmapped internal-code fallback checks green.

## Batch 23 evidence

- Runtime profile now measures grouped novel-log rendering after a 360-event retention
  stress. It verifies non-empty same-day paragraphs and a 100ms render budget in addition
  to map/NPC/offline/save budgets.

## Batch 24 evidence

- Map V2 now exposes `validateMapCoordinates(state)` for missing/out-of-bounds/duplicate
  coordinates and influence fails closed instead of treating invalid nodes as `[0,0]`.
  Regression validates the complete current node pool and the canonical influence DTO.

## Batch 25 evidence

- Travel preview/commit now share the exported canonical resolver with weather/ward/world
  modifiers, deterministic party size/weight, effective speed, risk and game-day output.
  Regression checks solo, companion party and committed-plan parity.

## Batch 26 evidence

- Periodic online Fate rewards now use canonical reward receipts keyed by absolute day,
  including pending-vault handling and replay idempotency. Regression verifies duplicate
  day processing does not add another Fate.

## Batch 27 evidence

- Offline actor projection regression now advances 35 days, verifies the 30-day bounded
  history and `lastOfflineAudit.targetDay`, then checks exact save round-trip preservation.

## Batch 28 evidence

- Tainted faction reward payloads now use the canonical reward ledger with an explicit
  `taintedRewards` namespace. Regression verifies receipt creation, flag/currency update
  and replay idempotency without double-incrementing Heaven Merit.

## Batch 16 evidence

## Batch 29 evidence

- Character creation now routes every random branch through an injected RNG;
  the only direct entropy call is the explicit `defaultRandom` boundary.
  Static audit covers all three known runtime producers and a dedicated
  deep-equal character replay regression passes.

## Batch 30 evidence

- Random boundary audit now discovers every `js/*.js` source dynamically in
  addition to the root runtime generators, so a newly added direct
  `Math.random()` producer cannot be silently omitted from the gate.

## Batch 31 evidence

- Added `verify_ui_surface_contract.js` and its canonical requirement. The gate
  verifies tab/script ordering, World/Dị Thể surfaces, map influence/fog/
  completion/route climate signals, structure/node-history rendering,
  progression namespace labels, delegated actions, save/render hooks and grouped
  novel-log consumption. The remaining browser gate is explicitly retained.

## Batch 32 evidence

- Added catalog/balance validators for Path fusion and Dị Thể. The regression
  now enumerates all path pairs against the affinity cap `0.75`, validates path
  terms/titles, checks Dị Thể threshold/effect/affinity ranges, and preserves
  claim/stage/outcome/save coverage.

## Batch 33 evidence

- Added `validateWorldCatalogs()` for weather transitions/severity/duration,
  profession recipes and the four canonical map-structure costs/effects. Deep
  regression now runs this validator alongside structure lifecycle, weather,
  Path fusion and Dị Thể tests.

- Randomness is centralized into explicit entropy boundaries; static audit
  `verify_random_boundaries.js` covers engine and procedural item generator,
  while replay/character tests cover injected deterministic RNG.

## Batch 15 evidence

- Runtime budget now measures map influence, NPC view and offline catch-up;
  profile exercises all paths and large-save retention in one gate.

## Batch 14 evidence

- Unknown internal log codes now receive a meaningful neutral narrative
  fallback; mapped codes still use `ERROR_NARRATIVE_MAP`. Narrative regression
  covers both paths.

## Batch 13 evidence

- Player-facing tab and error fallback now use Dị Thể; UI regression strips HTML
  comments and asserts the legacy Dị Chí label is absent from visible output.

## Batch 12 evidence

- Path fusion now persists a lead/support affinity profile with effective cap
  `0.75`; `verify_review_batches.js` checks commit and save round-trip.

## Regression hiện đã có

- `verify_review_batches.js`
- `verify_companion_runtime.js`
- `verify_indexeddb_archive.js`
- `verify_dichi_deep.js`
- `verify_expansion_log_matrix.js`  43/43
- `verify_log_narrative.js`
- `verify_expansion_stress.js`
- `profile_runtime_budget.js`
- Batch 5 additions in `BATCH_5_RUNTIME_CANONICAL_STATUS_2026-09-16.md`: travel preview/commit, rumor relay/expiry, NPC queue, Fate evolution invariant, quest reward ledger and secondary Path transition.
- Batch 6 additions in `BATCH_6_RUNTIME_UI_STATUS_2026-09-16.md`: NPC queue/rumor UI, node-history UI, Nghề Ẩn slot guard and player-log grouping/error regression.
- Offline simulation contract in `04-interaction/OFFLINE_WORLD_SIMULATION_CANONICAL_2026-09-16.md`: aggregate/actor-window policy, audit receipt and repeated-target idempotency.
- Batch 7 additions in `BATCH_7_OFFLINE_LOG_DITHE_STATUS_2026-09-16.md`: offline 30/60-day gate, combat transcript replay, canonical novel grouping, weather view model, Dị Thể stage effects and disabled-structure reactivation.

## Quy tắc chuyển trạng thái

## Batch 34 evidence

- `ensureExpansionState()` normalizes legacy reward receipts and
  `validateExpansionState()` enforces reward, weather, NPC retention and actor
  history invariants. Game, review-batch, expansion-stress and IndexedDB archive
  regression remain green.

## Batch 35 evidence

- Corrupt/legacy reward receipts are now quarantined with their original
  payload preserved instead of being deleted. Regression covers deserialize,
  preservation and post-migration state validation.

## Batch 36 evidence

- Fate advanced actions now share one canonical namespace and effect resolver.
  Nghịch Mệnh, Trấn Mệnh, Thiên Cơ and Mệnh Đổi are separated from
  enhancement/relationship/evolution effects; canonical serialize/deserialize
  preserves the action ledger and regression verifies suppression and replay.

## Batch 37 evidence

## Batch 38 evidence

## Batch 39 evidence

- Performance budget now distinguishes the measured Node/runtime baseline
  (`offlineAverageMs < 500` for a 30-day actor window) from the still-pending
  weak-device browser FPS gate. The profile passes with map cache, save-size,
  history-retention and novel-log measurements.

- Added `canonicalHiddenProfessionId()` as the runtime read boundary. Legacy
  `player.hiddenProfession` remains a compatibility mirror only; path/trial/
  victory guards now resolve canonical secondary profession first. Regression
  covers canonical and legacy fallback states.

- Runtime performance profiling now separates VM warm-up from steady-state
  offline catch-up. Three consecutive profile runs passed with offline average
  below 250ms, map influence cache metrics, save-size and novel-log budgets.

Không chuyển mục sang `ĐÃ HOÀN TẤT` chỉ vì resolver tồn tại. Cần bổ sung test đúng nhánh, kiểm tra save round-trip, UI nếu có bề mặt người chơi và kiểm tra không phát sinh log kỹ thuật. Ma trận này phải được cập nhật sau mỗi batch.
# Batch 40  Technical token sanitization (2026-09-17)

- Mục liên quan: #4  novel-style log.
- Đã bổ sung boundary sanitization cho `internal`, `debug`, `raw`, `payload`, `field_name`, `undefined`, `null` và regression producer trực tiếp.
- Requirement/schema bổ sung: `requirement/07-ui/LOG_TECHNICAL_TOKEN_SANITIZATION_2026-09-17.md`.
- Verification: `node tools/verify_log_narrative.js`, `node tools/verify_log_producers.js`, `node tools/verify_expansion_log_matrix.js` đều PASS.
- Còn mở: browser visual QA/pixel-level log panel; các mục content/UX khác vẫn giữ trạng thái partial theo gate hiện hành.
# Batch 53  Relationship dimensions policy (2026-09-17)

- Added canonical relationship policy/validator for trust, fear, respect, suspicion, loyalty and derived score.
- Explicitly separates NPC `event_only` policy from Fate `none` decay policy.
- Requirement bổ sung: `requirement/05-operations/RELATIONSHIP_DIMENSIONS_POLICY_2026-09-17.md`.
- Regression verifies event idempotency, policy, score and save round-trip.

# Batch 52  War front and rumor bulletin view-model (2026-09-17)

- Added `warFrontSnapshot()` and `rumorBulletinSnapshot()` canonical read models.
- Expansion summary now exposes `warFronts` and `rumorBulletin`; UI/runtime can consume status, score, cascade, source and expiry without raw-state inference.
- Requirement bổ sung: `requirement/04-interaction/WAR_FRONT_RUMOR_BULLETIN_VIEWMODEL_2026-09-17.md`.
- Regression adds war-front cascade/outcome DTO checks and retains offline/rumor determinism coverage.

# Batch 51  Structure influence effect schema (2026-09-17)

- Structure catalog now owns type effects; build merges canonical effects into runtime records.
- Added validation for effect object/max level/refund range; influence resolver remains active-only and revision-invalidated.
- Requirement bổ sung: `requirement/03-world/STRUCTURE_INFLUENCE_EFFECT_SCHEMA_2026-09-17.md`.
- Regression retains active/disabled/repair influence and save/offline lifecycle coverage.

# Batch 50  Canonical reward policy / pending Fate vault (2026-09-17)

- Chốt duplicate=`reject`, pity=`none`, Fate vault full=`pending_vault`, replay=`idempotent`.
- Added `rewardPolicySnapshot()`/`validateRewardPolicy()` and receipt audit fields `policy`/`pendingFateCount`.
- Requirement bổ sung: `requirement/06-expansion/REWARD_POLICY_PITY_AND_PENDING_VAULT_2026-09-17.md`.
- Regression reward ledger/quest/online Fate/tainted reward tiếp tục pass.

# Batch 49  UI view-model and action delegation regression (2026-09-17)

- UI contract now checks all four Dị Thể/discovery lifecycle states, exactly one delegated tab-content click listener, serialized action queue and engine priority guard.
- Requirement bổ sung: `requirement/07-ui/UI_VIEWMODEL_ACTION_DELEGATION_REGRESSION_2026-09-17.md`.
- `verify_ui_surface_contract.js` PASS; review/game regressions continue to pass legacy log/action priority coverage.
- Pixel-level browser QA remains explicitly separate.

# Batch 48  Dị Thể effect/exclusion schema (2026-09-17)

- Validator now rejects unknown Dị Thể effect/benefit keys and malformed exclusion entries.
- Claim resolver checks primary/secondary Con Đường and all canonical Nghề slots against explicit catalog exclusions.
- Requirement bổ sung: `requirement/02-progression/DITHE_CATALOG_EFFECT_EXCLUSION_SCHEMA_2026-09-17.md`.
- Deep regression continues to validate catalog, stage effects, modifiers, outcome and save round-trip.

# Batch 47  Canonical structure catalog (2026-09-17)

- Added `STRUCTURE_CATALOG` and `structureCatalog()` for build/repair/upgrade/refund parameters.
- Structure creation now rejects types missing from the canonical catalog; world catalog validation derives costs from it.
- Requirement bổ sung: `requirement/03-world/STRUCTURE_CATALOG_BALANCE_SCHEMA_2026-09-17.md`.
- Regression adds catalog assertions and retains full structure lifecycle/influence tests.

# Batch 46  Replay and cache invariants (2026-09-17)

- Mở rộng `validateExpansionState()` để kiểm tra map influence revision/cache và metric counters.
- Requirement bổ sung: `requirement/08_DATA_REPLAY_CACHE_INVARIANTS_2026-09-17.md`.
- Regression map invalidation + serialize/offline round-trip và dynamic random-boundary audit tiếp tục pass.
- Các producer random hiện đã qua centralized allowance; gate còn lại là browser/device profiling thực tế.

# Batch 45  Weak-device performance profiles (2026-09-17)

- Added pure `resolvePerformanceProfile()` and runtime `performanceProfile()` with standard/weak/reduced budgets.
- Main render applies the profile to story-window sizing and root diagnostic attribute; gameplay/save logic is unaffected.
- Requirement bổ sung: `requirement/08_DATA_RUNTIME_PERFORMANCE_PROFILE_2026-09-17.md`.
- Regression verifies capability selection, budget ordering and runtime state application.
- Remaining gate: real browser/device FPS benchmark.

# Batch 44  Archive retention and durable IndexedDB retry (2026-09-17)

- Archive log đã chuyển từ queue-clear giả lập sang IndexedDB object store `events` thật, có transaction put, `archivedAt`, retry khi open/transaction lỗi và API đọc gần nhất.
- Requirement bổ sung: `requirement/07-ui/ARCHIVE_RETENTION_AND_QUOTA_CONTRACT_2026-09-17.md`.
- Regression archive đã xác nhận failure injection → retry → event persistence; profile vẫn kiểm tra 300 history và save payload dưới 5 MB.
- Gate còn mở chỉ là quota/FPS/visual QA trên browser/device thật.

# Batch 43  Reward producer canonical audit (2026-09-17)

- Quest reward contribution double-application was fixed at the engine/expansion boundary.
- Requirement bổ sung: `requirement/06-expansion/REWARD_PRODUCER_CANONICAL_AUDIT_2026-09-17.md`.
- Regression now checks quest EXP/merit/currency/item/contribution idempotency across repeated objective evaluation.
- Repeatable combat/search/craft outputs are explicitly separated from one-time canonical receipts.

# Batch 42  Node/weather/rumor history invariant (2026-09-17)

- Bổ sung `validateNodeHistory()` kiểm tra metadata bắt buộc, duplicate key và retention 50 record.
- Requirement bổ sung: `requirement/03-world/NODE_WEATHER_RUMOR_HISTORY_COVERAGE_2026-09-17.md`.
- Regression `testNodeHistoryProjection()` đã kiểm tra đủ producer-type đại diện, idempotency, retention và metadata.
- Mục 9/11/14 được củng cố ở data invariant; browser visual/content balance vẫn là gate riêng.

# Batch 41  Chốt policy các mục 2933 (2026-09-17)

- Đã chốt và code policy quan hệ Mệnh không decay, tối đa 2 Con Đường, Dị Thể chỉ loại trừ theo catalog, ownership Công Trình explicit và offline NPC aggregate + actor window.
- Runtime mới: `designPolicySnapshot()` và `validateDesignPolicies()`; migration bổ sung mode/resolution/retention cho `offlinePolicy`.
- Requirement bổ sung: `requirement/01-core/UNRESOLVED_PRODUCT_POLICIES_DECIDED_2026-09-17.md`.
- Verification: regression `testUnresolvedDesignPoliciesAreCanonical()` trong `verify_review_batches.js`.
- Còn mở: tuning balance, browser visual QA và các gate nội dung/UX; policy không còn ở trạng thái CHƯA CHỐT.


---

## Source: `SYSTEM_LOGIC_CATALOG\33_ITEM_EVIDENCE_COVERAGE_GATE_2026-09-17.md`

# 33-Item Evidence Coverage Gate  2026-09-17

## Mục đích

Đây là completion audit cho `REVIEW_INCOMPLETE_DESIGN_UNRESOLVED.md`. Gate không tự biến một mục thành hoàn tất; nó chỉ fail khi một mục không có đủ ba liên kết tối thiểu:

1. requirement/schema canonical;
2. runtime hoặc UI source symbol;
3. regression executable.

## Cách chạy

```text
node tools/verify_33_item_coverage.js
```

Gate yêu cầu đúng 33 entry, kiểm tra file tồn tại và kiểm tra symbol runtime thật sự xuất hiện trong source. Các gate browser visual, quota thiết bị thật và product balance được ghi riêng, không được che bằng coverage manifest.

## Trạng thái hiện tại

- 33/33 mục đã có evidence mapping requirement → runtime/schema → regression.
- Runtime regression hiện tại đã pass theo các tool chuyên biệt.
- Browser visual QA và tuning balance vẫn là gate mở; chúng không được tuyên bố hoàn tất chỉ từ static coverage.


---

## Validator / patch / schema source: `archive-requirements\logic-history\01-core\fate\FATE_EFFECT_COMPOSITION_VALIDATOR_2026-09-17.md`

# Fate effect composition validator

Fate effects có bốn lớp độc lập: base definition, enhancement, relationship và evolution;
advanced actions dùng namespace riêng `fateAdvancedActions`. `validateFateEffectComposition`
kiểm tra active Fate hợp lệ, relationship stage 0..4, effect numeric hữu hạn, enhanced
resolver thuần/deterministic, evolution record không thiếu branch và stat composition ổn
định qua hai lần tính.

`validateExpansionState` gọi validator này; preview/commit và save-load regression so sánh
`computeStats(...).eff` để bắt cộng kép hoặc state drift. Advanced action vẫn được kiểm tra
bằng validator namespace riêng, không trộn vào enhancement/evolution.

Giới hạn: validator chứng minh tính ổn định/schema và không cộng kép trong runtime hiện tại;
cân bằng gameplay của từng Fate vẫn là playtest/content review.


---

## Validator / patch / schema source: `archive-requirements\logic-history\02-progression\DI_THE_CATALOG_SCHEMA_VALIDATION_2026-09-17.md`

# Dị Thể catalog schema validation  2026-09-17

The Dị Thể catalog is runtime content, but every entry must satisfy a common contract
before it can affect progression:

- identity: `id`, `name`, `trigger`, `progressThreshold`, `maxStage`, `branch`;
- progression: exactly one `stageEffects` entry per stage;
- outcome: non-empty `endingTags` and finite `factionAffinity` values;
- cost/exclusion: `cost`, `exclusions.paths`, and `exclusions.professions`;
- runtime: stage-aware modifiers and outcome projection must read the same entry.

`GameExpansion.validateSpecialPhysiqueCatalog()` is the canonical validator. It returns
`{ ok, count, errors }` and is used by the deep Dị Thể regression. A malformed entry is
not considered complete merely because the UI can render it.

**Note chưa hoàn thiện:** numerical balance and final content approval remain product
gates; schema completeness and runtime validation are implemented.


---

## Validator / patch / schema source: `archive-requirements\logic-history\02-progression\DITHE_CATALOG_EFFECT_EXCLUSION_SCHEMA_2026-09-17.md`

# DỊ THỂ CATALOG EFFECT / EXCLUSION SCHEMA  2026-09-17

## Canonical fields

Every Dị Thể entry has identity, trigger, threshold, max stage, branch, ending tags, faction affinity, cost, stage effects and explicit `exclusions.paths` / `exclusions.professions` arrays.

## Effect schema

Allowed stage/benefit keys are `corruptionResist`, `poisonResist`, `fateResonance`, `stealth`, `elementPenalty`, `sanRecoveryFlat` and `reviveOnce`. Unknown keys are rejected by catalog validation. Percentage effects stay in `[0,1]`; faction affinity stays in `[-10,10]`; stage effect count must equal max stage.

## Exclusion semantics

Dị Thể does not infer locks from its name, branch or ending. Only explicit catalog arrays can block claim. The claim resolver checks both primary/secondary Con Đường and primary/secondary/hidden Nghề slots. Empty arrays mean no exclusion.

## Runtime evidence

`specialPhysiqueModifiers`, `specialPhysiqueOutcome`, `getWorldModifiers` and `claimSpecialPhysique` are the canonical runtime path. Deep regression validates catalog shape, progression, stage effects, outcome projection and save round-trip.


---

## Validator / patch / schema source: `archive-requirements\logic-history\02-progression\DITHE_RUNTIME_STATE_VALIDATOR_2026-09-17.md`

# Dị Thể Runtime State Validator  2026-09-17

## Contract

Dị Thể là namespace riêng với catalog definition, trigger/progress, candidate, active instance, stage history và exclusions. `activeId` phải tồn tại trong catalog và đồng nhất với `player.specialPhysique`; progress không âm; candidate phải đạt threshold; history phải có stage hợp lệ và không trùng instance; rejected IDs phải unique.

## Runtime

`validateSpecialPhysiqueCatalog()` kiểm tra schema/effect/exclusion catalog. `validateSpecialPhysiqueState(state)` kiểm tra save runtime. Cả hai được gọi trong `validateExpansionState()`, còn `specialPhysiqueModifiers/outcome` là resolver duy nhất cho effect.

## Regression

`verify_review_batches.js` kiểm tra catalog/state hợp lệ và unknown Dị Thể state bị từ chối.

## Chưa hoàn thiện

Chưa có browser E2E đầy đủ cho candidate claim và exclusion dialog; namespace/runtime/save invariant đã có.


---

## Validator / patch / schema source: `archive-requirements\logic-history\02-progression\PROFESSION_RUNTIME_COST_GUARD_PATCH_2026-09-18.md`

# Bản vá Runtime Nghề nghiệp — 2026-09-18

- `practiceProfession` không cho caller bên ngoài dùng `skipCost` để bỏ qua Thể Lực.
- Bypass chỉ được phép với cờ nội bộ khi công thức đã thanh toán chi phí riêng.
- Validator nghề kiểm tra record mastery, recipes, specializations và charges/uses của vật phẩm nghề.
- Regression kiểm tra trực tiếp trường hợp cố bypass stamina.


---

## Validator / patch / schema source: `archive-requirements\logic-history\02-progression\TECHNIQUE_RUNTIME_STATE_PATCH_2026-09-18.md`

# Bản vá Runtime Công pháp — 2026-09-18

- Công pháp phải tồn tại trong catalog, masteryExp/usageCount không âm và masteryStage nằm trong 0–4.
- Tiến hóa chỉ dùng các trạng thái `locked`, `trial`, `ready`, `chosen`.
- Nhánh đã chọn phải thuộc đúng catalog tiến hóa của công pháp.
- `validateTechniqueRuntimeState` được gọi trong validator tổng hợp.


---

## Validator / patch / schema source: `archive-requirements\logic-history\02-progression\TRIBULATION_REINCARNATION_RUNTIME_PATCH_2026-09-18.md`

# Bản vá Độ kiếp / Luân hồi / Di sản — 2026-09-18

## Luật một lần

- Một pending tribulation chỉ nhận một lựa chọn; trạng thái `resolved` không thể chọn lại.
- Snapshot tiền kiếp được khóa bằng `lastSnapshotKey`, không nhân đôi khi cùng lượt gọi lại.
- Di sản và mộ phần giữ identity riêng; reward bái tế đi qua reward ledger.

## Kiểm định

`validateReincarnationRuntimeState` kiểm tra generation, previous lives, tombs, pending choices và pending tribulation. Test bao phủ chọn độ kiếp một lần, snapshot luân hồi idempotent và serialize runtime.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\AUCTION_PATCH_2026-09-18.md`

# Bản vá Đấu giá — 2026-09-18

## Phạm vi

- Mỗi lô có lịch mở/đóng, vật phẩm, giá sàn, giá hiện tại và người đang giữ giá.
- Khi người chơi bị NPC vượt giá, khoản đặt trước hiện tại được hoàn lại đúng một lần.
- Khi lô đóng, phần thưởng chỉ phát một lần qua reward ledger.
- Lô mới trong cùng một phiên không lặp vật phẩm nếu kho dữ liệu có đủ lựa chọn.

## UX và nhật ký

Các thao tác đặt giá, bị vượt giá và thắng đấu giá dùng log `narr` theo văn phong novel, tách thành từng sự kiện; không để lộ tên hàm runtime trong giao diện.

## Kiểm định

`validateAuctionState` kiểm tra identity, trạng thái, vật phẩm, lịch, giá và người giữ giá. `validateExpansionState` gọi validator này để phát hiện save hỏng ngay trong vòng kiểm tra tổng hợp.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\AUCTION_REFRESH_SETTLEMENT_PATCH_2026-09-18.md`

# Auction Refresh Settlement Patch — 2026-09-18

## Lỗi đã sửa

World tick làm mới phiên đấu giá trước khi chốt các lô cũ. Lô người chơi đang thắng có thể bị xóa khỏi `state.auction.lots` mà chưa phát thưởng.

## Quy tắc mới

`refreshAuction(state, day)` phải gọi settlement cho các lô hết hạn trước khi thay thế catalog lô mới. Reward ledger vẫn giữ idempotency nên gọi lại không phát thưởng lần hai.

## Hồi quy

Test tạo lô, đặt giá thắng, làm mới phiên sau hạn lô và xác nhận vật phẩm được nhận trước khi lô cũ bị thay thế.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\CATALOG_BALANCE_BOUNDARY_VALIDATOR_2026-09-17.md`

# Catalog Balance Boundary Validator  2026-09-17

## Canonical boundaries

- Weather travel risk: `0..0.25`; default duration không quá 7 ngày.
- Recipe materials/costs: số hữu hạn, không âm, không vượt 99 cho một transaction.
- Dị Thể cost số: `0..100`; cost boolean được phép cho điều kiện đặc biệt.
- Công Trình: build cost `1..100`, upgrade base không vượt hai lần build cost, refund rate `0..0.5`.
- Reward policy và Path fusion policy phải pass cùng balance gate.

## Runtime

`validateBalanceCatalog()` được gọi trong `validateExpansionState()` và export qua `GameExpansion.validateBalanceCatalog()`.

## Regression

`tools/verify_dichi_deep.js` kiểm tra toàn bộ catalog hiện hành và yêu cầu balance audit pass.

## Chưa hoàn thiện

Các ngưỡng trên là invariant chống giá trị lỗi và runaway economy; tuning cảm nhận người chơi theo từng difficulty vẫn là quyết định content riêng.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\CONTRACT_BOARD_PATCH_2026-09-18.md`

# Bản vá Khế ước / Phường thị — 2026-09-18

## Quy tắc trạng thái

- Lời mời chỉ nằm trong `offers` với trạng thái `offered`.
- Khi nhận, lời mời được chuyển nguyên vẹn sang `accepted`, không tồn tại đồng thời ở hai bucket.
- Hợp đồng chỉ kết thúc một lần ở `completed` hoặc `expired`; phần thưởng đi qua reward ledger.
- Hết hạn được xử lý trong tick thế giới và ghi thành một đoạn novel riêng.

## Kiểm định

`validateContractBoardState` kiểm tra identity, bucket, trạng thái, lịch hiệu lực và danh sách outcome. `validateExpansionState` gọi validator này cùng các validator thế giới khác.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\MAP_EXIT_REPAIR_PATCH_2026-09-18.md`

# Map Exit Repair Patch — 2026-09-18

## Mục tiêu

Đảm bảo các lối đi tham chiếu tới node không tồn tại không tiếp tục xuất hiện trong runtime map.

## Quy tắc runtime

- `repairInvalidMapExits(state)` ghi nhận exit lỗi vào `mapState.invalidExits` để audit.
- Static catalog `GameData.LOCATIONS[nodeId].exits` không bị mutate trong runtime repair.
- Nếu có bản sao runtime trong `state.openWorld.exits`, bản sao trỏ tới cùng target lỗi bị xóa.
- Nhật ký audit được giới hạn 200 bản ghi gần nhất.
- Không tự tạo node thay thế và không tự nối sang khu vực khác; việc sửa topology phải đi qua catalog map canonical.

## Hồi quy

`tools/verify_game.js` chèn tạm một target không tồn tại, chạy repair, xác nhận static catalog giữ nguyên, runtime exit bị loại và audit vẫn lưu lại bằng chứng.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\MAP_HIDDEN_EVENT_PATCH_2026-09-18.md`

# Patch — Phát hiện ẩn trên bản đồ

## Contract

- Một node chỉ có tối đa một `pendingMapEvent` tại một thời điểm.
- Event pending gắn chặt với `nodeId`; không được xử lý từ node khác.
- Event đã phát hiện ghi vào `mapEvents.nodes[nodeId]`, có cooldown và `resolvedIds` chống lặp.
- Rời node khi event còn pending chuyển event sang `abandoned`, ghi history và cooldown; không trao thưởng.
- Chọn event hợp lệ chuyển sang `resolved`, ghi choice/history và xóa pending.
- Trigger first-discovery/explore/moving dùng replay random; không tạo event ngoài catalog.
- Log player-facing dùng novel style, có địa điểm và diễn biến, không lộ tên hàm hoặc action ID.

## Đã triển khai

- Chặn resolve khi người chơi không còn đứng tại node phát hiện.
- Bổ sung `validateMapEventState` và đưa validator vào `validateExpansionState`.
- Chuẩn hóa log phát hiện, giải quyết và bỏ lại phát hiện thành các đoạn văn novel-style.
- Regression kiểm tra pending state, wrong-node guard, resolve, validator và log output.

## Gate

```text
node --check js/engine.js
node --check js/expansion.js
node tools/verify_game.js
node tools/verify_log_narrative.js
```


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\ORGANIZATION_ADDRESS_MUTATION_GUARD_PATCH_2026-09-18.md`

# Organization Address Mutation Guard — 2026-09-18

## Quy tắc

- `status` của tổ chức vẫn có thể đọc khi không ở node tổ chức.
- Mọi mutation quan hệ/tổ chức phải có address với `nodeId` hợp lệ và nhân vật phải đứng tại node đó.
- Thiếu address là lỗi catalog, được `validateOrganizationState` báo bằng `missing-address`.
- Mutation bị từ chối trước khi trừ vật phẩm hoặc thay đổi quan hệ.

## Hồi quy

`tools/verify_game.js` tạm bỏ address của một tổ chức, thử donate và xác nhận mutation thất bại, inventory không đổi, sau đó khôi phục catalog.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\ORGANIZATION_INTERACTION_LOG_PATCH_2026-09-18.md`

# Patch — Tương tác tổ chức và novel-style log

## Contract

- Tương tác organization phải đi qua `organizationInteract`, không mutate relation trực tiếp từ UI.
- `status` là read-only; các action còn lại trả kết quả `{ success, reason, data }`.
- Log player-facing không được lộ tên hàm, action ID, key runtime hoặc câu thông báo HUD.
- Log thành công phải ghi theo văn phong liên tục: địa điểm, hành động của nhân vật, tổ chức và trạng thái quan hệ sau cùng.
- Log dùng `narr` để đi qua pipeline `narrativeSafe`/`novelLogParagraphs`, vì vậy hiển thị cùng kiểu đoạn văn với các cảnh truyện.

## Đã chuẩn hóa

`organizationInteract` hiện ghi dạng:

> Tại [địa điểm] tại tọa độ [x, y], ngươi [hành động] cho [tổ chức]. Mối quan hệ hiện ở trạng thái [trạng thái].

Regression kiểm tra log có địa điểm/trạng thái và không chứa token kỹ thuật như `organizationInteract`.

## Gate

```text
node --check js/expansion.js
node --check tools/verify_game.js
node tools/verify_game.js
node tools/verify_log_narrative.js
```


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\OUTPOST_CURRENT_NODE_MUTATION_PATCH_2026-09-18.md`

# Outpost Current-Node Mutation Patch — 2026-09-18

## Quy tắc

- Lập trạm tiền tiêu chỉ được mutate node mà nhân vật đang đứng.
- Node phải tồn tại và đã được khám phá.
- Yêu cầu lập trạm từ xa bị từ chối trước khi kiểm tra/trừ chi phí.

## Hồi quy

`tools/verify_review_batches.js` di chuyển bản sao state sang node khác rồi yêu cầu lập trạm tại node cũ; test xác nhận mutation thất bại và Linh Thạch không đổi.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\OXY_OPEN_WORLD_RECIPROCAL_MOVEMENT_PATCH_2026-09-18.md`

# Bản vá Oxy Open World / Di chuyển bốn hướng — 2026-09-18

- `validateOpenWorldGrid` được gọi trong validator thế giới tổng hợp.
- Regression tạo probe độc lập và kiểm tra đủ Bắc/Nam/Đông/Tây đều sinh/đi tới node Oxy kế cận.
- Sau mỗi lần đi, topology vẫn phải hợp lệ và không tạo tọa độ trùng.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\STRUCTURE_CATALOG_BALANCE_SCHEMA_2026-09-17.md`

# STRUCTURE CATALOG BALANCE SCHEMA  2026-09-17

## Canonical fields

Each structure type is represented in `STRUCTURE_CATALOG` with `buildCost`, `repairDivisor`, `upgradeBase`, `maxLevel` and `refundRate`; type-specific upgrade contributions are explicit. The four canonical types are `waystation`, `ward_formation`, `watchtower` and `trading_post`.

## Runtime contract

Structure creation rejects types absent from the catalog. `structureCatalog()` exposes a read-only copy for UI/diagnostics and `validateWorldCatalogs()` derives its structure-cost validation from the catalog rather than an unrelated literal table. Existing lifecycle rules remain: active/disabled/dismantled state, owner checks, refund, node history and influence invalidation.

## Regression

Review-batch catalog regression checks canonical structure entries; lifecycle regression continues to verify build, disable, repair, upgrade, transfer, dismantle and influence changes.

Balance tuning values remain explicit and reviewable in this file/code boundary; browser confirmation UI is a separate gate.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\STRUCTURE_CURRENT_NODE_MUTATION_PATCH_2026-09-18.md`

# Structure Current-Node Mutation Patch — 2026-09-18

## Quy tắc

- Action xây công trình chỉ được mutate node mà nhân vật đang đứng.
- Node phải tồn tại và đã được khám phá.
- Truyền `nodeId` của một node khác không được phép xây từ xa và không được trừ Linh Thạch.
- Các API đọc/preview vẫn có thể nhận `nodeId` để UI dựng trạng thái disabled và lý do.

## Hồi quy

`tools/verify_game.js` di chuyển một bản sao state sang node khác rồi cố xây tại node cũ; test xác nhận mutation bị từ chối và inventory không đổi.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\STRUCTURE_GUILD_PROJECT_PATCH_2026-09-18.md`

# Bản vá Công trình / Công trình Tông môn — 2026-09-18

## Công trình bản đồ

- Chỉ chủ công trình hoặc thành viên thế lực sở hữu được sửa chữa/tạm dừng.
- Vòng đời hợp lệ: `active` → `disabled`/`damaged` → `active`, hoặc `dismantled`.
- Nâng cấp và tháo dỡ vẫn tuân thủ quyền sở hữu, đồng thời vô hiệu hóa cache ảnh hưởng node.

## Công trình tông môn

- Mã bản thiết kế không hợp lệ bị từ chối, không tự rơi về bản thiết kế đầu tiên.
- Đóng góp được chuẩn hóa thành số nguyên 1–10 Linh Thạch.
- Hoàn thành ghi `completedDay`, giữ thời hạn phần thưởng và log novel.

## Kiểm định

`validateGuildProjectState` kiểm tra template, identity, trạng thái, lịch, tiến độ và contributions; test bao phủ toàn bộ vòng đời công trình cùng chu kỳ dự án tông môn.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\STRUCTURE_INFLUENCE_EFFECT_SCHEMA_2026-09-17.md`

# STRUCTURE INFLUENCE EFFECT SCHEMA  2026-09-17

## Decision

- A structure contributes direct influence only through its canonical catalog effect `effects.influence` and only while active with integrity above zero.
- Hộ Giới Đại Trận contributes influence and danger/SAN protection; it does not create a second hidden anchor or duplicate faction score.
- Disabled/dismantled structures contribute zero influence and their cache revision is invalidated.
- Repair restores the existing catalog effect; upgrade changes only explicit effect deltas (ward influence/SAN and waystation charges).

## Runtime

`STRUCTURE_CATALOG` now contains type effects and newly built structures merge those effects into their runtime record. `mapInfluenceSnapshot()` remains the canonical resolver and structure lifecycle invalidates its revision.

## Regression

Structure catalog validation checks effect schema; lifecycle/influence regression verifies active ward > disabled ward and repair restoration, plus save/offline round-trip.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\STRUCTURE_LIFECYCLE_CURRENT_NODE_PATCH_2026-09-18.md`

# Structure Lifecycle Current-Node Patch — 2026-09-18

## Quy tắc

Các mutation vòng đời công trình đều yêu cầu nhân vật đang đứng tại node của công trình:

- sửa chữa;
- nâng cấp;
- tạm dừng;
- tháo dỡ;
- chuyển chủ cho NPC.

Guard dùng chung cũng yêu cầu node tồn tại và đã được khám phá. API đọc trạng thái không bị giới hạn bởi guard này.

## Hồi quy

`tools/verify_review_batches.js` tạo công trình, di chuyển bản sao state sang node khác rồi thử sửa chữa; mutation bị từ chối và inventory không đổi.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\STRUCTURE_RUNTIME_STATE_VALIDATOR_2026-09-17.md`

# Structure Runtime State Validator  2026-09-17

## Contract

Mỗi công trình phải có catalog type, id duy nhất trong node, owner hợp lệ (`player`, `npc`, `faction`), status hợp lệ, durability `0..100`, level trong max level, charge hợp lệ với Truyền Tống Trận và transfer history dạng mảng. Một node không có hai công trình active cùng type. Inventory không được âm hoặc chứa giá trị không hữu hạn.

## Runtime

`GameExpansion.validateStructureRuntimeState(state)` audit `mapState.structures` và inventory. `validateExpansionState()` gọi audit sau catalog/weather validation, bao phủ save/load và offline state. Build/repair/upgrade/disable/dismantle/transfer tiếp tục dùng `STRUCTURE_CATALOG` và `structureManagerDecision` làm source of truth.

## Regression

`verify_review_batches.js` kiểm tra structure owner, build lifecycle và fixture durability sai bị từ chối.

## Chưa hoàn thiện

Chưa có browser click-through cho mọi nhánh permission của NPC/faction ownership; runtime resolver và UI policy contract đã có.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\TOURNAMENT_REOPEN_PATCH_2026-09-18.md`

# Bản vá Đại Hội Tông Môn — 2026-09-18

Đại Hội mở theo chu kỳ 120 ngày. Khi kỳ trước đã đóng, tick tại mốc chu kỳ kế tiếp tạo phiên mới với mã, thời hạn, số vòng thắng và trạng thái tham dự được reset; không giữ phiên đóng khiến Đại Hội biến mất vĩnh viễn.

Thao tác tham dự và khai mạc dùng log novel riêng, phần thưởng vẫn đi qua reward ledger theo mã phiên.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\TRADE_ROUTE_MARKET_PATCH_2026-09-18.md`

# Bản vá Tuyến thương mại / Phường thị — 2026-09-18

## Luật tuyến

- Hai đầu tuyến phải là node tồn tại và không được trùng nhau.
- Không tạo hai tuyến active cùng chiều giữa cùng một cặp node.
- Caravan chỉ chạy khi route active; nếu mất tọa độ đầu/cuối, route chuyển `closed` thay vì sinh vị trí giả.
- `progress` luôn nằm trong khoảng hợp lệ của `distance`.

## Kiểm định

`validateTradeRouteState` kiểm tra identity, node, trạng thái, khoảng tiến độ, ngày tạo và duplicate route. Test bao phủ tạo tuyến, chặn duplicate, cập nhật caravan và validate sau tick.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\WAR_PARTICIPATION_PATCH_2026-09-18.md`

# Bản vá chiến trận / tổ chức — 2026-09-18

## Luật tham gia

- Người chơi phải thuộc một trong hai phe của chiến tranh.
- Nếu chiến tranh có `frontNodeIds`, người chơi phải đứng tại chiến tuyến.
- Mỗi người chỉ can thiệp một lần trong một ngày cho mỗi chiến tranh.
- Phần thưởng can thiệp dùng reward ledger với khóa theo chiến tranh/ngày/phe.

## Kết thúc chiến tranh

Kết cục chỉ cascade một lần, cập nhật ổn định/tài nguyên/ảnh hưởng node và ghi log novel khi phe của người chơi liên quan.

## Kiểm định

`validateWarState` tiếp tục kiểm tra phe, điểm, trạng thái và intervention ledger; regression test kiểm tra người ngoài phe, can thiệp hợp lệ và duplicate cùng ngày.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\WEATHER_RUNTIME_STATE_VALIDATOR_2026-09-17.md`

# Weather Runtime State Validator  2026-09-17

## Contract

Mỗi region dùng weather ID sau normalize alias; ID phải có trong catalog, `weatherSeverity` phải khớp catalog, `weatherUntilDay` phải là ngày hợp lệ và `weatherHistory` tối đa 30 bản ghi. Transition do world tick chỉ được đi theo danh sách transition của weather nguồn. Override có chủ đích vẫn được ghi source riêng.

## Runtime

`GameExpansion.validateWeatherRuntimeState(state)` audit toàn bộ `worldSimulation.regionState`. `validateExpansionState()` gọi audit này cùng catalog validator. `weatherSnapshot()` và UI World dùng cùng catalog/alias/effects DTO.

## Regression

`verify_review_batches.js` kiểm tra alias `snow -> tuyet`, snapshot/effect, thời hạn và drift severity bị từ chối; offline tick vẫn chạy qua world modifier preview.

## Chưa hoàn thiện

Chưa có browser E2E cho từng weather transition và animation/fog rendering; runtime, save và offline state đã có contract kiểm tra.


---

## Validator / patch / schema source: `archive-requirements\logic-history\03-world\WORLD_EVENT_NPC_HIDDEN_PATCH_2026-09-18.md`

# Bản vá Sự kiện thế giới / NPC ẩn — 2026-09-18

## Kiểm tra logic

- Một vùng chỉ có một biến cố đang hoạt động.
- Mỗi mẫu biến cố tuân thủ `cooldownDays`, kể cả sau khi biến cố cũ đã kết thúc.
- Người chơi chỉ được chọn ứng biến khi đang ở đúng vùng xảy ra biến cố.
- Kết thúc biến cố ghi `resolvedDay`, giải phóng `activeEventId` và cố định kết cục.

## Runtime state

`validateWorldEventState` kiểm tra identity, mẫu dữ liệu, vùng, trạng thái, timeline, phase, lịch sử lựa chọn và liên kết ngược giữa vùng với biến cố đang hoạt động.

## Nhật ký

Điềm báo, lựa chọn ứng biến và kết cục dùng log `narr`/`warn` theo từng đoạn novel; không đưa tên hàm xử lý ra giao diện.


---

## Validator / patch / schema source: `archive-requirements\logic-history\04-interaction\NPC_INTERACTION_QUEST_PATCH_2026-09-18.md`

# Bản vá tương tác NPC / nhiệm vụ NPC — 2026-09-18

## Luật tương tác

- Chỉ NPC còn sống, đúng node và đúng phân khu mới có thể nói chuyện hoặc giao nhiệm vụ.
- Nhiệm vụ NPC hết hạn sẽ chuyển sang `failed`, không tiếp tục xuất hiện.
- Nhiệm vụ đang `active`, `completed` hoặc `failed` không được phát lại cùng một mã.
- Nhận nhiệm vụ phải ghi `acceptedDay` và log novel riêng.

## Kiểm định

`validateNpcQuestState` kiểm tra identity, bucket, trạng thái, NPC giao nhiệm vụ, hạn và duplicate key. Bộ test kiểm tra nói chuyện, nhận nhiệm vụ một lần, không phát lại khi đang active và chặn NPC đã chết.


---

## Validator / patch / schema source: `archive-requirements\logic-history\04-interaction\ORGANIZATION_MAIL_RELATION_PATCH_2026-09-18.md`

# Bản vá Tổ chức / Quan hệ / Truyền thư — 2026-09-18

## Luật tương tác

- Mỗi tổ chức chỉ nhận một tương tác mỗi ngày, bao gồm cả cầu viện trợ.
- Ủy thác phải có identity, trạng thái và hạn hợp lệ.
- Truyền thư chỉ gửi cho NPC còn sống, trừ phí theo khoảng cách vùng và tạo scheduled task hợp lệ.
- Quan hệ NPC tiếp tục chống duplicate bằng `uniqueKey` và giữ score theo công thức canonical.

## Kiểm định

Validator tổ chức kiểm tra active request; regression hiện có kiểm tra node, quyền tương tác, daily limit và novel log.


---

## Validator / patch / schema source: `archive-requirements\logic-history\04-interaction\PRISONER_COMPANION_OUTCOME_PATCH_2026-09-18.md`

# Bản vá Tù binh / Dị thú — 2026-09-18

## Luật trạng thái

- Thẩm vấn chỉ nhận `persuade`, `threaten` hoặc `dark`.
- Tù binh chỉ được xử lý một lần bằng `released`, `turned_in`, `executed` hoặc `tamed`.
- Reward xử lý tù binh tiếp tục đi qua reward ledger.
- Thuần hóa ghi `tamedDay`; companion không tạo lại nếu tù binh đã rời trạng thái `held`.

## Kiểm định

`validatePrisonerState` kiểm tra identity, status, nguồn bắt, hạn xử lý và resistance. Regression test kiểm tra method/outcome sai, xử lý hợp lệ và chống xử lý lần hai.


---

## Validator / patch / schema source: `archive-requirements\logic-history\04-interaction\RELATIONSHIP_RUNTIME_LEDGER_VALIDATOR_2026-09-17.md`

# Relationship Runtime Ledger Validator  2026-09-17

## Contract

Relationship dimensions của NPC gồm `trust`, `fear`, `respect`, `suspicion`, `loyalty`; `score` chỉ là projection theo policy. `relationshipEvents[npcId]` là ledger event có `id`, `uniqueKey`, `day`, `deltas`, tối đa 20 bản ghi và unique key không lặp. `npcState[npcId].memoryWithPlayer` không được chứa event không tồn tại trong ledger.

## Runtime

`validateRelationshipRuntimeState()` kiểm tra ledger, duplicate key, event metadata và orphan memory; `validateExpansionState()` gọi audit này. `validateRelationshipPolicy()` tiếp tục kiểm tra dimension range, score formula và policy decay, giữ tách biệt relationship với loyalty của companion.

## Regression

`verify_review_batches.js` kiểm tra event idempotency, breakdown dimensions, save round-trip và orphan event drift.

## Chưa hoàn thiện

Chưa có browser E2E cho toàn bộ dialog/relationship UI; runtime/save invariant đã có.


---

## Validator / patch / schema source: `archive-requirements\logic-history\04-interaction\WEATHER_RUMOR_OFFLINE_HISTORY_PATCH_2026-09-18.md`

# Bản vá Weather / Rumor / Offline — 2026-09-18

Thiên tượng thay đổi bằng resolver thủ công hoặc world tick đều ghi cùng schema `weatherHistory`, giới hạn 30 bản ghi và giữ `source`, `from`, `to`, `day`. Duration được chuẩn hóa thành số ngày nguyên tối thiểu một ngày; log vùng hiện tại dùng novel-style.

Regression kiểm tra chuyển thời tiết thủ công, lịch sử nguồn QA và toàn bộ offline/world gates.


---

## Validator / patch / schema source: `archive-requirements\logic-history\05-operations\NPC_SCHEDULER_STATE_MACHINE_VALIDATOR_2026-09-17.md`

# NPC scheduler state-machine contract

NPC runtime states are restricted to `idle`, `travel`, `present`, `interact`, `shelter`, `combat`, and `queued`.

## Invariants

- `currentNodeId` must exist in map catalog;
- `travelFrom → travelTo` must be an actual map edge;
- `currentSubLocationId` must belong to the current node or be `main`;
- queued NPC must point to its current node and have positive integer `queueRank`;
- needs `shelter/social/duty` stay in 0..100;
- `nextMoveDay` is finite and movement selection is deterministic from seed/action key.

Congestion is resolved after movement using deterministic NPC ID ordering and node capacity. Invalid topology never becomes a teleport; the scheduler enters shelter/queue instead.

## Regression

Offline tick, save/load and repeated same-day simulation must preserve NPC state. `validateNpcScheduler()` is invoked by `validateExpansionState` and rejects invalid edge, queue, sub-location or state records.

## Chưa hoàn thiện

Detailed behavior tuning for individual NPC personalities and route priorities still needs content playtest.


---

## Validator / patch / schema source: `archive-requirements\logic-history\05-operations\WAR_CASCADE_STATE_VALIDATOR_2026-09-17.md`

# War front và incident cascade validator

War canonical state gồm hai faction hợp lệ, score không âm, `active|ended` status,
intervention list và cascade outcome. Khi war kết thúc, `cascadeApplied=true`, winner /
loser / resolved day phải tồn tại; cascade giảm stability loser, tăng stability/resources
winner, ghi influence event và node history có key idempotent.

`validateWarState` được gọi bởi `validateExpansionState`. `updateWars` dùng seeded key theo
war/day; `cascadeApplied` ngăn apply outcome lần hai. Regression chạy hai save clone cùng
seed qua offline catch-up, so sánh toàn bộ war/faction state và thử topology faction sai.


---

## Validator / patch / schema source: `archive-requirements\logic-history\06-expansion\CODEX_DISCOVERY_PATCH_2026-09-18.md`

# Bản vá Cổ Tịch / Discovery — 2026-09-18

## Luật tiến trình

- Codex đi theo thứ tự `investigate` → `read` → `decrypt` → `collect`.
- Không thu thập lại Codex đã thu thập.
- Node manh mối nghề ẩn phải tồn tại trong graph đúng nghề; mã node lạ bị từ chối.
- Discovery lifecycle không được lùi trạng thái và reward không lặp.

## Kiểm định

Regression test bao phủ chuỗi Codex đầy đủ, thao tác collect lần hai và `validateDiscoveryLifecycle`.


---

## Validator / patch / schema source: `archive-requirements\logic-history\06-expansion\DISCOVERY_LIFECYCLE_NAMESPACE_VALIDATOR_2026-09-17.md`

# Discovery/Dị Chí lifecycle namespace validator

Discovery chỉ dùng các trạng thái tăng dần `discovered → verified → collected → rewarded`.
Mỗi record phải có first-seen day và các transition day tương ứng; không được lùi trạng
thái hoặc suy diễn discovery thành Con Đường, Nghề Ẩn hay Dị Thể. `codexClues` là metadata
manh mối riêng, không bị ép vào lifecycle record.

`validateDiscoveryLifecycle` được gọi trong `validateExpansionState`, UI đọc
`discoveryStatusSummary` và hiển thị đủ bốn trạng thái. Regression đưa status namespace
sai vào record và buộc validator từ chối.


---

## Validator / patch / schema source: `archive-requirements\logic-history\06-expansion\HIDDEN_REALM_INTERACTION_PATCH_2026-09-18.md`

# Bản vá tương tác Bí Cảnh — 2026-09-18

## Luật vào/ra

- Không thể mở Bí Cảnh mới khi nhân vật đang ở trong một Bí Cảnh khác.
- Node runtime phải thuộc đúng `realmId` và `cycleIndex` hiện tại.
- Claim lõi chỉ hợp lệ tại core node, trong cửa sổ mở và qua reward ledger theo cycle.
- Thoát Bí Cảnh trả nhân vật về parent node; log dùng văn phong novel.

## Kiểm định

Validator kiểm tra liên kết active realm, cycle, node runtime và vị trí hiện tại; regression test bao phủ enter, serialize/deserialize node runtime và exit.


---

## Validator / patch / schema source: `archive-requirements\logic-history\06-expansion\HIDDEN_REALM_RUNTIME_VALIDATOR_2026-09-17.md`

# Hidden Realm Runtime Validator  2026-09-17

## Contract

Mỗi Bí Cảnh có definition tương ứng, `cycleIndex` không âm, cửa sổ `opensDay <= closesDay`, status thuộc `sealed/omen/open`, reward keys unique, competitor progress không âm. `activeHiddenRealm` phải trỏ tới runtime đang mở, đúng cycle, có entry/core node tồn tại và vị trí hiện tại nằm trong realm.

## Runtime

`validateHiddenRealmRuntimeState(state)` kiểm tra toàn bộ realm definition/runtime và active realm reference. Validator được gọi trong `validateExpansionState()` để bảo vệ save/load, offline cycle update và claim reward.

## Regression

`verify_review_batches.js` kiểm tra contested expiry, hidden realm enter/exit, claim reward idempotency và duplicate reward key rejection.

## Chưa hoàn thiện

Chưa có browser E2E animation/map overlay cho cổng Bí Cảnh; logic state, reward ledger và rollback đã có contract.


---

## Validator / patch / schema source: `archive-requirements\logic-history\06-expansion\TECHNIQUE_RECIPE_HIDDEN_REALM_SCHEMA_2026-09-17.md`

# Công Pháp, Công Thức và Cổ Mộ/Bí Cảnh  Canonical Schema

## Mục tiêu

Catalog nội dung phải là nguồn sự thật duy nhất cho runtime, UI, save/load và reward. Mọi bản ghi được tạo động (ví dụ bí pháp truyền thừa theo tông môn) phải được chuẩn hóa về cùng DTO với dữ liệu tĩnh.

## DTO Công Pháp

Mỗi công pháp có `id`, `name`, `category`, `family`, `minRealmLevel`, `cost`, `effect`, `risk`, `mastery` và `evolutionPaths`.

- `cost`: `mana`, `stamina`, `san`, `corruption`, `lifespan`, `cooldownTurns`, `castTimeSeconds`; tất cả là số không âm.
- `effect`: `powerCoefficient` không âm, `baseEffect` là chuỗi, `allStatMultiplier` nếu có phải là số hữu hạn.
- `risk`: `hiddenAttributes` là mảng; `corruptionProfile.baseCorruptionGainPerUse` nếu có là số không âm.
- `mastery`: `stage` nguyên trong 0..4, `exp` và `usageCount` không âm. Tiến độ runtime thuộc save của nhân vật, không sửa catalog.
- `evolutionPaths` luôn là mảng; `minRealmLevel` tối thiểu là 1.

`GameEngine.validateTechniqueCatalog()` là cổng kiểm tra bắt buộc trước khi coi catalog hợp lệ. Công pháp động của guild phải đi qua cùng validator, không được tạo DTO riêng.

## DTO Công Thức

Recipe có `id`, `professionId`, `materials`, `costs`, `output`. `materials` phải có số lượng dương; `costs` phải không âm. `output` phải có ít nhất `itemId` hoặc `kind`. `successBase` nếu có nằm trong 0..1; `perfectMultiplier` nếu có không âm. Công thức không tự cấp reward ngoài output đã commit.

## Bí cảnh/Cổ Mộ

- Enter chỉ thành công khi realm đang `open` và nhân vật đứng đúng `parentNodeId`.
- `cycleIndex` tạo namespace node và reward key ổn định: `<cycleIndex>:main`.
- Enter tạo hoặc tái sử dụng ba node runtime (`entry`, `path`, `core`) và ghi `activeHiddenRealm` để rollback đúng parent.
- Claim core chỉ khi đang ở `core`, realm còn mở và reward key chưa tồn tại.
- Reward đi qua `grantCanonicalReward`; sau khi thành công key được ghi vào `claimedRewardKeys`. Claim lặp lại phải bị từ chối, kể cả sau save/load.
- Exit xóa `activeHiddenRealm` và trả về `parentNodeId` hợp lệ (fallback home chỉ khi parent không còn trong catalog).
- Offline progression chỉ cập nhật cycle/open/close; không tự nhân đôi reward đã claim.

## Regression bắt buộc

1. Validator công pháp trả `ok=true` và tất cả bản ghi có DTO canonical.
2. Mỗi recipe hợp lệ về materials/costs/output và xác suất.
3. Enter → core → claim tăng EXP đúng một lần.
4. Claim lần hai bị từ chối; exit trả về đúng parent.
5. Save/load và offline update giữ nguyên `cycleIndex`, `claimedRewardKeys` và không cấp lại reward.

## Phần còn chưa hoàn thiện

- Cân bằng số liệu từng công pháp, từng recipe và reward bí cảnh vẫn là dữ liệu thiết kế cần playtest; validator hiện kiểm tra schema và miền giá trị, không chứng minh balance.
- Visual QA trên trình duyệt local còn phụ thuộc môi trường browser; regression hiện tại là runtime/test harness.


---

## Validator / patch / schema source: `archive-requirements\logic-history\07-ui\ACTION_PRIORITY_MATRIX_VALIDATOR_2026-09-17.md`

# Action Priority Matrix Validator  2026-09-17

## Mục tiêu

Chuẩn hóa thứ tự ưu tiên action giữa engine, combat, pending opportunity, exploration, action mở rộng và các surface UI. Một action không được đồng thời xuất hiện ở nhiều priority surface; cùng một input state phải cho cùng một danh sách action, cùng thứ tự và cùng metadata.

## Canonical contract

- Mỗi action có `id` duy nhất, `priority` là số nguyên trong khoảng `0..100`, ít nhất một alias và alias không được mơ hồ giữa hai action.
- `resolveActions()` khử trùng lặp theo `id`, áp dụng blocking winner theo `tier -> urgency -> sourceOrder`, sau đó sắp xếp ổn định.
- Forced action, combat action, pending opportunity và exploration action là các nhóm độc quyền theo context; action an toàn (`Trạng Thái`, `Quan Sát`, `Hành Trang`) chỉ được phép tồn tại như utility ngoại lệ.
- `resolveActionSurfaces()` phân tách `context`, `primary`, `secondary`, `overflow`, `modal`; một action không được cùng lúc thuộc hai nhóm priority chính.
- Replay phải deterministic: cùng state và cùng raw action list phải trả về cùng projection `id/tier/urgency/blocking/sourceOrder`.

## Runtime implementation

`GameEngine.validateActionPriorityMatrix(state, actions)` kiểm tra schema, alias collision, duplicate id, priority range, deterministic replay projection và overlap giữa các surface. `validateExpansionState()` gọi validator này để save/load và world simulation không thể âm thầm lưu action matrix hỏng.

## Regression

`tools/verify_review_batches.js` kiểm tra combat/pending filtering, matrix hợp lệ và fixture duplicate-id/ambiguous-alias/invalid-priority bị từ chối.

## Chưa hoàn thiện

- Chưa có browser E2E click-through cho mọi action surface; hiện mới có runtime contract và Node regression.
- Action động từ plugin/expansion được kiểm tra khi đưa vào resolver nhưng chưa có registry compile-time riêng.


---

## Validator / patch / schema source: `archive-requirements\logic-history\07-ui\LOG_SURFACE_RUNTIME_VALIDATOR_2026-09-17.md`

# Runtime log surface validator

`validateLogSurfaceState(state)` audits the actual history after action and save-load,
not only source literals. It formats every non-debug event through the player-facing
boundary, rejects empty narrative without stat display, lints technical tokens and
ensures the grouped novel paragraphs have one group per day key.

Legacy events are normalized during deserialize; raw producer codes are allowed in the
internal event only when `formatPlayerLogText` removes/maps them before UI rendering.
`validateExpansionState` invokes the validator and regression covers legacy round-trip
plus an internal warning code.


---

## Validator / patch / schema source: `archive-requirements\logic-history\08_DATA_REPLAY_ENVELOPE_VALIDATOR_2026-09-17.md`

# Replay Envelope Validator  2026-09-17

## Contract

Replay state phải có `worldSimulation.seed`, `meta.saveId`, integer non-negative `meta.turn/generatedItemSequence`, integer `lastProcessedDay/nextEventSeq`, và ID duy nhất cho events, scheduled tasks, NPC encounters. Deserialize không được làm mất các identity này.

## Runtime

`validateReplayEnvelope(state)` kiểm tra deterministic envelope; `validateExpansionState()` gọi audit cùng action priority matrix và reward/history validators. Gameplay RNG tiếp tục dùng replay-aware scope/day/index; character creation chỉ dùng injected RNG hoặc entropy boundary được cho phép.

## Regression

`verify_review_batches.js` kiểm tra envelope hợp lệ, seed bị thiếu bị từ chối và combat transcript replay sau serialize/deserialize.

## Chưa hoàn thiện

Chưa có cross-browser replay corpus dài ngày; các path combat/search/discovery/world offline chính đã có deterministic regression.


---

## Validator / patch / schema source: `archive-requirements\logic-history\08_DATA_RUNTIME_PERFORMANCE_BUDGET_VALIDATOR_2026-09-17.md`

# Runtime performance profile và budget validator

## Profile canonical

`resolvePerformanceProfile` chọn `weak`, `reduced` hoặc `standard` từ cores,
device memory và reduced-motion. Mỗi profile quy định target FPS, map render budget,
history window, NPC records/tick và số ngày offline mô phỏng chi tiết.

## Budget invariant

- target FPS nằm trong 30..60.
- map render budget tối thiểu 12 node/khung logic.
- history window tối thiểu 8.
- NPC records/tick tối thiểu 25.
- offline detailed window tối thiểu 7 và không vượt profile đang chọn.
- runtime metrics map influence được so với budget; vượt quá ngưỡng 4x bị báo lỗi để
  regression/performance gate xử lý, không âm thầm coi là đạt.

## Runtime

`validatePerformanceBudget(state, capabilities)` đọc cùng profile resolver với UI/runtime,
đồng thời đọc `runtimeBudgetSnapshot`; không dùng một bộ ngưỡng riêng cho từng caller.
`validateExpansionState` gọi validator để save/test boundary phát hiện cấu hình offline
quá nặng.

## Chưa hoàn thiện

- Chưa có benchmark tự động trên từng thiết bị thật; metrics hiện là runtime instrumentation.
- Map renderer vẫn cần gate FPS thực tế ở browser khi local asset loading được khắc phục.


---

## Validator / patch / schema source: `archive-requirements\logic-history\08_DATA_SYSTEM_WIDE_VALIDATOR_WIRING_PATCH_2026-09-18.md`

# System-wide Validator Wiring Patch — 2026-09-18

## Phát hiện

`validateOrganizationState` đã có implementation nhưng chưa được gọi bởi `validateExpansionState`. Save có relation tổ chức không hợp lệ vì vậy vẫn có thể vượt qua full runtime audit.

## Thay đổi

- `validateExpansionState` gọi `validateOrganizationState` cùng nhóm map, trade route, auction và contract.
- Lỗi được namespace thành `organizations:*` để UI/log diagnostic phân biệt được nguồn.
- Không thay đổi gameplay path; chỉ bổ sung cổng phát hiện dữ liệu hỏng.

## Hồi quy

`tools/verify_game.js` chèn relation tổ chức giả, xác nhận full audit thất bại, xóa relation và xác nhận state hợp lệ trở lại.


---

## Schema source: `SYSTEM_LOGIC_CATALOG\11_CANONICAL_STATE_SCHEMA.md`

# CANONICAL STATE SCHEMA Â— HỢP ĐỒNG DỮ LIỆU LIÊN FEATURE

Tài liệu này là schema định hướng cho save/state. Catalog definitions nằm ở `data/*`; object dưới đây là state mutable. Field mới phải có migration và không được đổi nghĩa field cũ âm thầm.

## Root

```js
GameState = {
  schemaVersion: 13,
  meta: { turn, createdAt, updatedAt },
  gameClock: { year, month, day, absoluteDay, season, timeOfDay },
  player: PlayerState,
  locationId, currentSubLocationId,
  history: GameEvent[], logState: LogState,
  mapState: MapState, worldSimulation: WorldSimulation,
  professionState: ProfessionState,
  pathRitualState: PathRitualState,
  questState: QuestState,
  flags: Flags,
  inventory: {}, equipment: {},
  searchSites: {}, pendingSearch: null,
  market: MarketState, archive: ArchiveMeta
}
```

## PlayerState

```js
PlayerState = {
  id, name, realmId, exp, lifespan, currentAge,
  basePhy, baseMag, aptitude, comprehension, hp, maxHp,
  qi, maxQi, stamina, maxStamina, san, maxSan,
  pathId, secondaryPathId, professionId,
  techniques: { [techniqueId]: TechniqueProgress },
  techniqueCooldowns: {},
  fates: [], fateInventory: [], fateInstances: { [instanceId]: FateInstance },
  fateEnhancements: {}, fateEvolutions: {},
  hiddenProfession: null, hiddenProfessionCandidate: null,
  tainted: TaintedState, physique: PhysiqueState,
  anchors: [], relationships: {}, companion: null
}
```

## World/map

```js
MapState = {
  discoveredNodes: {}, fog: {}, completion: {}, nodeHistory: {},
  claims: {}, structures: {}, influenceCache: {}, routeCache: {},
  invalidExits: []
}
WorldSimulation = {
  lastProcessedDay, regionState: {}, factionState: {},
  wars: {}, incidents: {}, tournament: {},
  npcState: {}, npcEncounters: {}, rumors: [], worldEvents: {}
}
```

## Profession/path

```js
ProfessionState = {
  primaryId: null, hiddenId: null,
  selectionLocked: false, hiddenUnlocked: false,
  mastery: {}, history: [], unlockSources: []
}
PathRitualState = {
  paths: { [pathId]: { milestones: {}, failureLog: [], status, expectedStep } }
}
```

## Event

```js
GameEvent = {
  id, type, uiType, subtype, timestamp, clock, turn,
  action, context, result, changes, statDisplay,
  event_flags, importance, severity, narrative, text,
  debugOnly: false
}
```

`text` là output render/cache; state nghiệp vụ không được parse ngược từ text. `statDisplay` là mảng hiển thị cuối scene; narrative không chứa stat syntax.

## Migration rules

1. Missing object/array tạo default.
2. `player.fates` ID cũ tạo `fateInstances` ổn định.
3. `hiddenProfession` cũ map về `professionState.hiddenId` nếu hợp lệ.
4. `pathId` không được map sang profession ID.
5. Dị Thể/tainted field cũ giữ riêng, không map sang path.
6. History legacy được bọc thành `GameEvent` với `event_flags.legacy = true` và render lại.
7. Invalid catalog reference không xóa âm thầm; ghi migration warning và bỏ khỏi active calculation.

## Invariants

- active fate không trùng instance và không vượt slot.
- primary profession tối đa một; sau khi set không được chọn primary khác.
- hidden profession chỉ tồn tại khi `hiddenUnlocked` và có source Cổ Tịch hợp lệ.
- location/sub-location phải thuộc cùng node.
- structure phải thuộc node tồn tại.
- NPC current node hợp lệ, status terminal không tiếp tục scheduler.
- archive payload serialize/deserialize round-trip không đổi giá trị canonical.



---

## TRACE RECOVERY AUDIT - MAP / WORLD SIMULATION / UI ACTION LOG

Date: 2026-09-18

The historical source prose for three canonical files contains replacement characters and cannot be restored byte-for-byte. Runtime trace recovery was performed from js/engine.js, js/expansion.js, js/ui.js, js/main.js, world data, and surviving validator contracts.

- MAP: locationExits, generateOpenWorldNode, openWorldTarget, validateOpenWorldGrid, move, mapInfluenceSnapshot, mapFogState, travelPlan, and moveWithinNode.
- WORLD SIMULATION: weatherSnapshot, travelPlan, structure lifecycle, map influence invalidation, worldSimulationSummary, and offline tick integration.
- UI ACTION LOG: delegated action dispatch, pushHistory, createGameEvent, novelLogParagraphs, renderScene, archive/replay boundaries, and player-facing log validation.

The recovered runtime-derived contracts are written into the respective feature canonical files. They are authoritative for behavior that can be proven from runtime; damaged historical prose is not treated as evidence where bytes were lost.

## Sequential review of new Markdown inputs — 2026-09-18

1. `FATE_NEW_LOGIC_ADDENDUM.md` — skipped. Duplicate conversion, insight reveal, stagnant-fate release, and local unique-Tiên ownership already existed in `js/engine.js`. Server-wide ownership remains a product/backend decision and is not falsely treated as implemented by the local save.
2. `MAP_SYSTEM.md` — skipped for existing node graph, fog, procedural coordinates, directional movement, search, collect, investigate, and map events. No duplicate implementation was created.
3. `WORLD_INTERCONNECTION_SYSTEM.md` — skipped for world tick, diplomacy, wars, NPC schedules/memory, cascading events, and hidden realms; these already existed in `js/expansion.js`.
4. `MAP_COMPLETE_ARMY_ATMOSPHERE.md` — implemented missing runtime foundations: persistent `worldSimulation.armies`, deterministic daily morale/corruption update, scout/sabotage/command interactions, and `engine.subLocationWrongness`.
5. `NOVEL_STYLE_LOG_FULL_DEFINITION (1).md` — skipped. Existing `novelLogParagraphs`, narrative lint, render/archive boundaries, and action-log canonical pipeline already cover the requested behavior.
6. `prompt_opening_scene_map_quest_system.md` — skipped for existing origin choice, staged breakthrough ritual, quest state, action priority, and flee-in-place behavior. No new quest branch was invented from unresolved design notes.
7. `prompt_ui_pinned_character_panel.md` — implemented the missing always-present `renderPinnedCharacterSummary` wrapper in `js/ui.js`; tab content remains independent and action-bar overflow remains governed by the existing presentation logic.

Runtime checks: `node --check js/engine.js`, `js/expansion.js`, and `js/ui.js` passed. Requirement validator at the time of this review: 0 broken links and 0 odd code fences; encoding cleanup was completed before source deletion.

## Consolidation completion — 2026-09-18

- Updated the mandatory workflow in `README.md` so new Markdown is merged into feature canonical files before implementation and source deletion.
- Merged the new Fate, Map, World Simulation, UI/log, progression, discovery, and NPC requirements into their canonical feature files.
- Implemented the missing runtime foundations in `js/expansion.js`, `js/engine.js`, and `js/ui.js`.
- Removed the nine processed root-level source Markdown files after merge.
- Final requirement validation: 23 active Markdown files, 0 broken links, 0 odd code fences, 0 old-name/replacement-character markers.
- Runtime syntax validation: `js/engine.js`, `js/expansion.js`, and `js/ui.js` passed.

## Runtime tech-debt review — 2026-09-18

Verification baseline: `verify_game.js`, `verify_expansion_stress.js`, `verify_ui_surface_contract.js`, `verify_log_narrative.js`, `verify_random_boundaries.js`, and `verify_character_generator_replay.js` pass after the opening-intent handler scope fix.

Open findings:

- **High — opening-intent coverage:** no dedicated automated test currently asserts all backgrounds, all four intent outcomes, five independent scenes, regional target validity, save/load persistence, and stage-2 target enforcement.
- **Medium — action API asymmetry:** `contextState()` exposes `act_journey_*`, but generic `resolveAction()` does not resolve those IDs. The modal works through a direct DOM handler, so text/action-bar replay can diverge.
- **Medium — pinned panel semantics:** `PinnedCharacterSummary` is prepended inside `#tab-content`; there is no dedicated fixed-sidebar mount or CSS contract yet. It is persistent across rerenders, but not fully pinned as a layout surface.
- **Medium — legacy origin namespace:** `originChoicePending`, `chooseOrigin()`, and migration branches remain for compatibility. Their relationship to the new random Background plus selectable journey intent must be documented and eventually retired or isolated.
- **Low — target naming/fallback:** `openingPlan.targetFactionId` stores IDs from the `GUILDS` catalog, and the Tầm Sư/Quy Tông roll falls back to any regional guild if a type-filtered pool is empty. Rename to a neutral target ID or add a catalog type validator before expanding content.
- **Low — runtime text encoding debt:** existing JavaScript strings still contain historical mojibake even though the requirement Markdown gate is clean. This does not change mechanics but degrades player-facing narrative and error messages.

## Tech-debt implementation result — 2026-09-18

- Closed opening-intent test coverage with `tools/verify_opening_intent.js`: intent options, target kind, persistence, legacy isolation, and resolver behavior are covered.
- Closed action API asymmetry: `act_journey_*` now resolves through `resolveAction()`.
- Closed pinned-surface layout debt: `index.html` now owns a dedicated `#pinned-character-summary` mount, `ui.js` renders into it independently, and `styles.css` defines responsive layout.
- Closed target namespace debt: opening plans expose `targetOrganizationId` and `targetOrganizationKind`; legacy `targetFactionId` is migrated.
- Closed silent fallback risk: invalid/missing regional organization kinds now return an explicit failure instead of silently accepting an unrelated target.
- Remaining: legacy Origin APIs remain for old-save compatibility; runtime JavaScript mojibake remains a separate content/encoding cleanup batch.

## Opening journey intent implementation — 2026-09-18

- Added the pre-game `JOURNEY_INTENT_CHOICE` gate after Race/Spiritual Roots/Personality generation.
- Added regional deterministic rolls for a concrete sect (`tam_su`), five independent Tán Tu opening scenes (`tu_lap`), and a concrete family/faction estate (`quy_tong`). Hac Dao/Vo Danh backgrounds receive the compatible `an_the` option.
- Race, Spiritual Roots, Personality, and Background remain random rolls; only the journey intent is selectable. The legacy Background/Origin modal is no longer part of the new-character flow.
- Added locked UI modal and event handler; existing saves with an unresolved origin are migrated into the new gate.
## Tech-debt design decisions — 2026-09-18

- Opening targets are standardized as `targetOrganizationId` plus `targetOrganizationKind`; legacy `targetFactionId` is migrated on load.
- Journey intent actions use the engine resolver, making UI click, text command, and replay share one mutation path.
- The pinned character summary gets a dedicated DOM mount and responsive CSS contract.
- New characters bypass legacy Background/Origin choice. Legacy saves are normalized once and then use the journey-intent flow.
- Regional target pools fail explicitly when no matching organization exists; unrelated fallback selection is removed.

## White-box remediation result — 2026-09-18

- Resolved opening-context split: legacy `originSituation` no longer hides quests or writes opening history; the selected `openingPlan` owns that context.
- Added a separate Tự Lập resolver with five independent Tán Tu scenes and no organization target.
- Tầm Sư and Quy Tông now use merged regional catalogs with strict `sect`/`family` classification and no unrelated fallback.
- Tông Môn exposes only Tầm Sư/Tự Lập; Hắc Đạo/Vô Danh receive Ẩn Thế; matching is accent-normalized and encoding-independent.
- Fixed the pinned Linh Khí meter to use `qi/maxQi`.
- Invalid journey actions return before turn/history mutation.
- Expanded `tools/verify_opening_intent.js` across six regions, all intents, five scenes, target contracts, state isolation, history/quest consistency, failed-action clock safety, and persistence.
- UTF-8 repair scan reports zero detected mojibake runs; modified JavaScript and Markdown pass syntax/requirement validation.

## White-box logic review — 2026-09-18

The runtime and validator smoke tests pass, but white-box inspection found the following residual risks. These are recorded here as audit findings; no new audit file is created.

- **High — opening context is split across two independent rolls.** `createCharacter()` still rolls and stores `originSituation`, while `chooseJourneyIntent()` later creates `openingPlan`. `createState()` hides `originSituation.questSeed` and writes its narrative before the journey intent is chosen. A character can therefore select `Tự Lập`/`Tầm Sư`/`Quy Tông` but receive a legacy quest seed and history text from an unrelated opening context. This is a state-consistency risk, not caught by the current opening-intent test.
- **High — pinned Linh Khí meter reads the wrong fields.** `renderPinnedCharacterSummary()` reads `p.mana` and `p.maxMana`, but the engine state and canonical save use `p.qi` and a derived Qi maximum. The pinned Linh Khí display can consequently show `0/0` while gameplay has real Qi.
- **Medium — background gate depends on mojibake byte sequences.** `journeyIntentOptions()` compares exact corrupted strings for `Hắc Đạo` and `Vô Danh`. If runtime data is repaired to valid UTF-8 before this function is updated, those backgrounds will incorrectly receive `Quy Tông` instead of `Ẩn Thế`. The comparison must be normalized and encoding-independent.
- **Medium — organization classification is duplicated and encoding-sensitive.** `rollJourneyOpening()` filters faction type/name with regex literals containing corrupted text and keeps the legacy `targetFactionId` intermediate. Later validation reduces the chance of silently accepting an unrelated target, but the roll itself can miss valid organizations after data encoding cleanup or catalog type changes.
- **Medium — opening-intent test coverage is narrower than its audit claim.** `verify_opening_intent.js` exercises one region, `Quy Tông`, and one hidden-background branch. It does not assert `Tầm Sư`, `Tự Lập`, `Ẩn Thế`, all eligible regions, all five independent scenes, or the quest/history consistency described above.
- **Low — failed pre-game actions can consume a turn.** `submitActionId()` advances turn/history before resolving an action. If an opening-intent action fails validation, the failed choice may still affect command echo, turn counters, or time-based systems.
- **Low — legacy origin compatibility remains behaviorally active.** `chooseOrigin()`, `originChoicePending`, and migration branches still coexist with the new journey-intent gate. This is currently compatibility code, but future changes can accidentally re-open the old selectable-origin path unless the two state machines are explicitly isolated.

White-box verification performed: `node tools\\verify_game.js`, `node tools\\verify_opening_intent.js`, `node tools\\verify_expansion_stress.js`, `node tools\\verify_ui_surface_contract.js`, `node tools\\verify_log_narrative.js`, syntax checks for `engine.js`, `main.js`, `ui.js`, and requirement validation. All executed checks passed; the findings above are residual design/coverage risks that the current smoke tests do not prove away.
