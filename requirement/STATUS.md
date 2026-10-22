# Trạng thái hiện hành

Cập nhật: 2026-10-22. Đây là trang trạng thái **duy nhất**. Chi tiết rule nằm ở file chức năng (cột Runtime mapping); lịch sử ở `audit/`.

## 1. Gate

| Gate | Lệnh | Kết quả 2026-10-22 |
|---|---|---|
| Full regression (51 check) | `node tools/run_regression_suite.js` | PASS 51/51 (~60s; `--jobs=2` ~27s) |
| Bất biến refactor | `node tools/verify_refactor_invariants.js` | PASS (5 check) |
| Offline bundle | `--with-offline-bundle` | Bỏ qua — `index.offline.html` chỉ rebuild khi người dùng yêu cầu; hiện **cũ hơn** source |

## 2. Đã làm 2026-10-22

**Tài liệu:** tái tổ hợp theo feature → chức năng (`features/<feature>/README.md` + file chức năng), mẫu theo `liyw0205/nonebot_plugin_xiuxian_3/docs`. 10 câu hỏi mở Công Pháp/Lân Cận đã chốt (bảng "Quyết định đã chốt" trong README feature). Audit/prompt chuyển vào `audit/`, `prompts/`.

**Code (giữ hành vi, trừ các bug ghi rõ):**

| Mảng | Thay đổi | File:symbol |
|---|---|---|
| Set trang bị | Bug: set bonus mất khi engine tự gọi `updateDerived` → hook trong engine | `engine.js:registerDerivedStatHook`, `expansion.js:applyEquipmentSetBonus` |
| Công Pháp | Một nguồn tính cost/cooldown cho eligibility/preview/commit; bỏ check trùng; blocker tiếng Việt | `engine.js:resolveTechniqueExecutionInputs`, `techniqueCooldownTurns`; `expansion.js:techniqueEligibility` |
| Tông Môn | Bug: cờ `guildTeaching` rò sang lần học sau; trận pháp truyền thụ không nhận bonus | `act_exp_org_study`, `learnTechnique`, `useTechnique` |
| Quan hệ | Mọi thay đổi qua `recordRelationshipEvent`; bug: thư thường tăng trust/loyalty không giới hạn | `relationScore`, `npcTalk`, `talk`, `sendMail`, `giftableItem` |
| View chỉ đọc | Mở Lân Cận/preview/validate không còn ghi save | `localBfsConstellation` (`viewExits`), `movementCandidatePreview`, `validateOpenWorldGrid`, `mapNode`/`normalizeMapNode`, `mapInfluenceSnapshot`, `validateExpansionState` |
| Cấm Thuật | Bug: luôn gửi `confirmed:true` → danger sheet inline | `main.js:commitTechniqueAction`, `ui.js:renderTechniqueDangerSheet` |
| UI | Gộp 2 click delegate thành `handleSharedClick`; mọi hành động đổi state qua `enqueueAction`; Việt hóa nhãn; bỏ nút trùng; sửa nút chọn thế và nút Mệnh nâng cao không hoạt động | `main.js`, `ui.js` |
| Dead code | Xóa hàm không còn tham chiếu (engine 3, expansion 4, ui 6, main 4) | — |
| Test | Loader dùng chung theo thứ tự `index.html`; 33 tool chuyển sang; thêm 6 tool vào suite | `tools/lib/load_runtime.js`, `tools/run_regression_suite.js` |
| Save | Bug: save chứa nguyên chỉ mục 10.000 Mệnh Số (~3,3MB/save, sát giới hạn localStorage) → chỉ mục dùng chung, không serialize; save ~98KB | `expansion.js:attachRuntimeIndexes` |
| Hiệu năng | `ensure()` chạy một lần mỗi tick/hành động/validate thay vì trong mọi hàm đọc: mô phỏng 365 ngày 4,5s → 0,9s; mỗi hành động ~80ms → ~20ms; lưu game 49ms → 16ms | `expansion.js:ENSURE_SCOPE`, `withEnsureScope`, `tick`, `postAction`, `validateExpansionState` |
| Tool | Runner in thời gian; `--changed` (cache theo hash đầu vào), `--quick`, `--jobs=N`; full suite 185s → ~60s (`--jobs=2`: ~27s) | `tools/run_regression_suite.js` |
| Data | `data/manifest.json` + `tools/build_data.js` (`--check`); nguồn JSON theo feature ở `data/src/`; bundle Mệnh Số nén dạng cột + hydrate giống hệt (kiểm bằng `verify_data_bundle_equivalence`): dữ liệu tải vào trình duyệt 7,1MB → 3,5MB; xóa `fate_system_update/` (5,3MB) và 2 generator chết | `data/`, `tools/build_data.js` |
| Requirement | Mệnh Đổi thiết kế lại (đổi nhánh Tiến Hóa, gỡ vòng phụ thuộc bậc 4); 14 gap ưu tiên cao viết lại đủ để code; khôi phục MAP V2 2.2 (`audit/MAP_V2_CURRENT_REGION_2.2_restored.md`) và gộp rule còn thiếu vào `features/map` | xem mục 7 |

## 3. Runtime gap đang mở

Ưu tiên: **C** = cao (sai logic/khóa tiến trình), **T** = trung bình, **B** = bổ sung tính năng.

| Feature | Ưu tiên | Rule → vấn đề |
|---|---|---|
| map | C | MAP-LC-003/010 trục y ngược (`movementCandidates`, `ui.js:renderLocalMap`); MAP-LC-020/UI-LM-010/063 preview lộ ứng viên đã chọn; MAP-LC-040 tên node chỉ 5 biến thể; MAP-WS-017/018 thiếu `namespace`/`runtime:`/`parentNodeId`; MAP-WS-034 `locationExits` nối Sơn Môn tới mọi node kề tọa độ; MAP-WS-050 validator thiếu cạnh hai chiều/namespace/số con/catalog; MAP-LV-042 nét đứt không theo danger/phong tỏa; MAP-NODE-001 thành trấn không ép 3–5 |
| map | T | MAP-LC-002 jitter; MAP-LC-011 không kiểm đoạn đường; MAP-LC-034 thời tiết theo vùng xuất phát; MAP-TRV-031/040; MAP-INF-023; MAP-NPC-010..014/030..032/040..041; MAP-MV-010..011 `MapEdgeMeta`; MAP-WS-024..025 vòng đời node `archived`; MAP-LV-046..048 ảnh nền 2x, icon 24/32/48, giảm mật độ icon |
| path | C | PATH-SEL-003 `pathMatchSummary` cap 10 nên cấp 11–14 không đạt được; PATH-SEL-002 alias `thien_co` sai nhãn |
| realm-progression | C | PRG-BT-006 / CHR-ANC-007 Dựng Neo kiểm `source === "npc"` nhưng anchor ghi `npc_relationship` |
| character | C | CHR-ANC-003 `maxStability` = giá trị khởi đầu nên không nuôi được Neo; CHR-ANC-005 nhãn `strained`; CHR-CRE-003/006 generator không có fallback |
| fate | C | FATE-SLOT-006 kho đầy thay Mệnh âm thầm; FATE-REL-005 không ai gọi `recordFateBehavior("choice")`; FATE-ADV-009 Mệnh Đổi không thể commit |
| technique | T | TEC-002, 013, 023, 030, 052, 057/063, 082 (`resonancePolicy` cũ), 107/CH-001 (channel theo lượt), 111, 118, 125, 127 (receipt), 010, 161 (channel theo lượt) |
| technique | B | TEC-041/173, 050, 067 (4 Công Pháp Tự Lập), 074/08A, 08B, 093, 115/119/11A |
| relationship/npc | T | REL-EVT-006 gift `sent_gift` vẫn cộng mặc định trust/loyalty; WSIM-RUM-005; NPC-ORG-020 ngưỡng 5 năm thay vì 30 ngày; NPC-ORG-050 ngưỡng 50 thay vì 70 |
| ui-action-log | T | UI-LM-001/011/012/021/030/032/042; UI-ACT-004/011; UI-LOG-010/014 |
| data-runtime | T | DATA-CLK-002 adapter đồng hồ hardcode 6876/2475360 |
| cross-system | T | CSX-TG-02/04..07; CSX-ORG-030/031/033; CSX-RE-010..025; CSX-NPC-020; CSX-STR-004; CSX-FAC-005; CSX-LGC-005 |
| reward/discovery | T | RWD-OPP-002 hạn +12 ngày; RWD-PRS-001; RWD-TNT-001; RWD-LED-001; DSC-QST-001..003 |
| profession/di-the | T | PROF-NS-003; PROF-HID-009/010 Luân Hồi chạy cho mọi người; DT-CLM-001 dùng chung cờ `uniquePowerCreated`; DT-LIM-001 |
| path (B) | B | PATH-SEL-011..013, PRG-BT-008/013/014, PRG-CUL-003..014, PRG-SEC-003/004, PATH-UNB-005/008, PATH-TG-003/005/008, PATH-VAR-001..004, PATH-HID-002..006, PATH-RIT-002/004/005 |
| world-simulation/npc (B) | B | NPC-INT-004, NPC-ENT-033/041, CMP-DAT-001, CMP-UI-001, WSIM-ATM-* |

## 4. Nợ kỹ thuật (chưa sửa, có chủ đích)

| Mục | Vị trí | Hướng xử lý |
|---|---|---|
| Render tạo hàng chợ | `ui.js:renderMarket` → `refreshMarket`, `meritFateOffers`, `refreshBlackMarket` | Sinh hàng ở tick ngày/hành động; render chỉ đọc |
| Hai nguồn sự thật trong save | `player.fates`/`fateInstances`/`fateInventory`; `pendingSearch`/`pendingExploration`; `player.pathId`/`pathState.primaryPathId`; `node.playerStructures`/`mapState.structures`; `node.fastTravelUnlocked`/`mapState.fastTravel`; cooldown số/đối tượng | Chọn một nguồn + migration save (cần bump schema) |
| `ensure()` vẫn được gọi trong ~60 hàm đọc | `expansion.js` | Đã giới hạn bằng `ENSURE_SCOPE` ở tick/hành động/validate; bước sau: bỏ hẳn khỏi hàm đọc |
| `index.offline.html` | repo | 2026-10-22: đã bỏ khỏi git (`.gitignore`), chỉ build cục bộ khi cần; test bỏ qua kiểm tra bundle khi chưa build. Lịch sử `main` còn bản 59,7MB (dưới giới hạn 100MB) |
| Wrapper ghi đè engine | `expansion.js` thay `contextState`, `advanceGameTime`, `submitTurn`… nhưng engine gọi bản nội bộ | Đăng ký hook như `registerDerivedStatHook` |
| File runtime lớn | `engine.js` 540KB, `expansion.js` 530KB | Đã có loader chung; bước sau: tách theo feature dùng namespace nội bộ, cập nhật `index.html` + `build_offline_bundle.ps1` cùng lượt |

## 5. Evidence còn thiếu

- Browser E2E/responsive và native file chooser (OPEN-01..03 cũ) — chưa có bằng chứng tự động.
- Cân bằng catalog, chi phí công trình, tuning thời tiết — cần playtest.

## 6. Việc tiếp theo đề xuất

1. Sửa nhóm **C** ở mục 3 (khóa tiến trình: PATH-SEL-003, PRG-BT-006, CHR-ANC-003, FATE-ADV-009, FATE-SLOT-006) — đã đủ spec, xem mục 7.
2. Triển khai quyết định đã chốt: trục y (MAP-LC-003), preview ẩn đích (UI-LM-063), channel theo lượt (TEC-CH-001), xóa `resonancePolicy` (TEC-082), `appliesTo` cho `guild_inner_training` (TEC-125) — đã đủ spec, xem mục 7.
3. Rebuild `index.offline.html` khi người dùng yêu cầu.

## 7. Requirement đã bổ sung 2026-10-22

Mỗi dòng: rule đã viết lại để code không cần hỏi thêm (công thức, ngưỡng, edge case, migration, acceptance). Cột **Sẵn sàng code** = `Có` khi mọi quyết định sản phẩm đã chốt; không còn câu hỏi mở.

| Gap (mục 3/6) | Rule (file) | Nội dung đã chốt | Sẵn sàng code |
|---|---|---|---|
| FATE-ADV-009 Mệnh Đổi không commit được | FATE-ADV-001/007/009/010/011…015 ([advanced-actions.md](features/fate/advanced-actions.md)); FATE-UPG-007/009 ([upgrade-replace-ritual.md](features/fate/upgrade-replace-ritual.md)); FATE-UI-003 | **Thay quyết định "Mệnh Đổi là wrapper Tiến Hóa"**: Mệnh Đổi = đổi nhánh Tiến Hóa của Mệnh `evolved` (bậc 4), không gọi `evolveFate`; cost `(5+2t)×(1+uses)` Tinh Hoa / `(10+5t)×(1+uses)` Công Đức / 10 SAN; tối đa 3 lần, hồi 30 ngày; `actionId` + receipt; commit nguyên tử; UI overlay; 11 test MD-01…11 | Có |
| FATE-REL-005 bậc 1→2 không đạt được | FATE-REL-004/005/006/008 ([relationships.md](features/fate/relationships.md)) | `recordFateChoice` từ 3 nguồn (sự kiện quan hệ, cơ duyên tranh đoạt, sự kiện bản đồ); bảng `moral`/`aligned` theo sign; `uniqueKey`; đường bù `points ≥ 25`; bộ đếm chỉ tăng ở bậc 0/1 (hết đếm kép với Mệnh Kiếp) | Có |
| FATE-SLOT-006 kho đầy thay Mệnh | FATE-SLOT-006 ([slots-and-equip.md](features/fate/slots-and-equip.md)) | Phân loại 3 nhóm nguồn, kiểm kho trước khi trừ chi phí, `vaultFull`, xóa nhánh tự thay; liệt kê 5 call site cần sửa | Có |
| PATH-SEL-003 cap 10 | PATH-SEL-003 ([path-selection.md](features/path/path-selection.md)); FATE-RES-002, PRG-CUL-006 | Thuật toán 6 bước, không trần, `rawScore`/`daoBonus`/`score`, forbidden thắng lead, ví dụ 13 | Có |
| PATH-SEL-002 alias `thien_co` | PATH-SEL-002 (cùng file) | Alias chỉ theo ID, nhãn theo `PATH_LABELS[canonical]`; không đổi code, thêm test nhãn | Có |
| PRG-BT-006 / CHR-ANC-007 nguồn Neo | PRG-BT-006 ([breakthrough.md](features/realm-progression/breakthrough.md)); CHR-ANC-007/009 ([human-anchor.md](features/character/human-anchor.md)) | Predicate duy nhất `isValidHumanAnchor` cho bước, mọi cổng và giới hạn 3 Neo; `legacy_anchor` không đếm; migration `source: "npc"` | Có |
| CHR-ANC-003/005/006 | CHR-ANC-003/005/006/009 (cùng file) | `maxStability = 100`; hàm `anchorStatus` (broken / `<50` strained / `50–74` active / `≥75` stable) dùng chung; migration nâng `maxStability`; test số | Có |
| CHR-CRE-003 / 006 | CHR-CRE-003/006 ([creation.md](features/character/creation.md)) | Thuật toán 4 bước + fallback tất định (`score` giảm, `id` tăng), bảng override Linh Căn, validate nhánh, test fixture | Có |
| MAP-LC-003 trục y | MAP-LC-003 ([local-view.md](features/map/local-view.md)); MAP-LC-010 ([movement-and-cost.md](features/map/movement-and-cost.md)) | Công thức `screenX/Y = 50 + d×scale/5`; công thức ứng viên 4 hướng kèm ví dụ `(50,50)`; migration commitment; chỉ rõ cả bốn hướng sai dấu y | Có |
| UI-LM-063 / MAP-LC-020 / UI-LM-010 | UI-LM-063 ([local-map-ui.md](features/ui-action-log/local-map-ui.md)); MAP-LC-020 | API `movementDirectionPublicPreview` (`targets[]`, `range`), danh sách thuộc tính DOM bị cấm, test HTML giống hệt khi đổi ứng viên chốt | Có |
| MAP-LC-040 tên node | MAP-LC-040 ([world-structure.md](features/map/world-structure.md)) | `generateNodeName`: seed, 3 bảng từ vựng, khử trùng 3 bước, migration | Có |
| TEC-CH-001 channel theo lượt | TEC-CH-001, RG-12a…d ([execution.md](features/technique/execution.md)); TEC-161 ([ui.md](features/technique/ui.md)) | `channelTurns`, `elapsed`, `ready`, Vận công = chờ 1 lượt, gián đoạn, migration `preparedTurn`, nhãn UI | Có |
| TEC-082 xóa `resonancePolicy` | TEC-082, RG-04a/b ([fate-resonance.md](features/technique/fate-resonance.md)) | Công thức `rankScore`/`bonusRaw`/clamp, validator từng field, resolver trung tính khi policy hỏng, test 19 → 18 | Có |
| TEC-125 `appliesTo` | TEC-125, RG-09a ([guild-and-tu-lap.md](features/technique/guild-and-tu-lap.md)) | `appliesTo` bắt buộc + enum, định nghĩa `taughtGuildId`, bảng cộng dồn 5/10, `revision 2` | Có |

**Quyết định mới ghi vào README feature (2026-10-22):** Mệnh Đổi (fate), bậc 1→2 và đếm bộ đếm (fate), phân loại nguồn kho đầy (fate), `daoBonus` (path), `isValidHumanAnchor` (character), override Linh Căn và fallback tie-break (character), preview công khai + tên node + migration trục y (map), channel/interrupt, validator resonance, `appliesTo` (technique).

**Việc code còn lại khi triển khai (không cần hỏi thêm):** sửa `data/cong_phap.js` (xóa `resonancePolicy`), `data/expansion_data.js` (`guild_inner_training.appliesTo`, `revision 2`); mọi thay đổi `js/` theo cột Runtime mapping của từng rule; sau đó cập nhật cột trạng thái và xóa dòng tương ứng ở mục 3.

