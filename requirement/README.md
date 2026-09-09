# Requirement chức năng — Cổ Dị Diện

Thư mục này chỉ chứa đặc tả chức năng dùng để triển khai và kiểm thử game.
Tài liệu lịch sử, audit, master cũ và bản sao được chuyển sang
`docs/archive-requirements/`.

## 01 · Core

- `01-core/HE_THONG_NEN_TANG_NHAN_VAT_TU_VI_CONG_PHAP.md` — luật nền nhân vật,
  Tu Vi, Mệnh Số, Con Đường, Công Pháp, SAN và nghề ẩn.
- `01-core/character_creation_system.md` — contract khởi tạo nhân vật.
- `01-core/FATE_SYSTEM_SPEC.md` — schema và runtime Mệnh Số.
- `01-core/CONG_PHAP_SYSTEM.md` — học, mastery và tiến hóa Công Pháp.
- `01-core/NEO_NHAN_TINH_DESIGN.md` — Neo Nhân Tính và quan hệ với đột phá.

## 02 · Progression

- `02-progression/PHAC_THAO_TU_VI_CON_DUONG_V3.md` — mở rộng nguồn Tu Vi và
  Con Đường.
- `02-progression/BREAKTHROUGH_RITUAL_DETAIL.md` — flow nghi thức đột phá.
- `02-progression/TU_VI_CON_DUONG_BREAKTHROUGH_GAP_SPEC.md` — phần gap đã đối
  chiếu code, dùng làm backlog/implementation trace.

## 03 · World

- `03-world/MAP_SYSTEM.md` — node graph, di chuyển và action tại bản đồ.
- `03-world/Xianxin_map.md` — vùng, thế lực và dữ liệu thế giới.
- `03-world/WORLDVIEW_ATMOSPHERE.md` — lớp không khí/lore có tác động gameplay.

## 04 · Interaction

- `04-interaction/NPC_MONSTER_SYSTEM.md` — NPC, quái, encounter và tương tác.
- `04-interaction/RANDOM_EVENT_SYSTEM.md` — sự kiện ngẫu nhiên.
- `04-interaction/RELATIONSHIP_SYSTEM.md` — quan hệ Mệnh Số/NPC.

## 05 · UI & presentation

- `05-ui/ACTION_HYBRID_SYSTEM.md` — Action Bar và free-text.
- `05-ui/UI_LAYOUT_AND_ACTION_TABLE_REQUIREMENTS.md` — layout/action table.
- `05-ui/UI_LAYOUT_REQUIREMENT_KEEP_STRUCTURE_ADJUST_WIDTH.md` — quy tắc bố
  cục responsive.
- `05-ui/SPEC_FIX_HE_THONG_NGON_NGU_VA_BO_TRI_FEATURE.md` — ngôn ngữ và entry
  point UI.
- `05-ui/ANCIENT_TAOIST_REALM_GAME_LOG_SYSTEM.md` — game log/story log.

## 06 · Expansion

- `06-expansion/SPEC_HE_THONG_TINH_NANG_MOI_TOAN_BO.md` — contract các hệ mở
  rộng: world simulation, profession, contract, companion, legacy và evolution.

## Quy tắc tài liệu

1. Một luật runtime chỉ có một nguồn canonical.
2. Không thêm luật mới vào tài liệu archive.
3. Mọi API mới phải ghi rõ module, state schema, transaction và acceptance test.
4. Nội dung đã triển khai phải ghi trace file/hàm trong tài liệu gap tương ứng.
