# NPC — Lớp thực thể, schema nền, hành vi quái

## Mục đích

Phân loại mọi thực thể (NPC lẫn quái) trên một schema nền chung, quy định khả năng tương tác theo lớp, hành vi chiến đấu theo %HP và bảng rớt đồ.

## Dữ liệu & trạng thái

```js
Entity {
  id, entity_type: "npc" | "monster" | "boss", name, race,
  faction,               // null nếu vô chủ
  realm,                 // thang cảnh giới hiện hành
  level_tier,            // độ mạnh
  stats: { PHY, MAG, HP, SAN_influence }, // SAN_influence: SAN mất khi giao chiến/tiếp xúc (0 với NPC thường)
  dialogue_id, quest_ids: [], loot_table_id, location_tags: [],
  is_hostile_by_default, respawnDays // null = unique
}
```

Lớp mở rộng thêm field riêng nhưng vẫn kế thừa `Entity`.

## Rules

### Lớp thực thể

| ID | Lớp | Chiến đấu | Quest | Giao dịch | Đặc trưng bắt buộc |
|---|---|---|---|---|---|
| NPC-ENT-001 | Thường Dân | Không | Hiếm (việc vặt) | Bán vặt | Tấn công = mất danh vọng/bị lính bắt |
| NPC-ENT-002 | Tông Môn | Thử luyện | Chuỗi môn phái | Đổi công đức | Quest chuỗi có `requirements.faction_reputation` |
| NPC-ENT-003 | Thương Nhân | Bỏ chạy, gọi bảo vệ | Hiếm | Chính | — |
| NPC-ENT-004 | Người giao nhiệm vụ | Tùy | Chính | Không | — |
| NPC-ENT-005 | Quái thường / Tinh Anh | Có | Tinh Anh: kill quest | Không (chỉ rớt đồ) | Hostile mặc định |
| NPC-ENT-006 | Boss / Dị Quỷ | Có, cơ chế phase | Chuỗi dẫn tới | Không | `respawnDays=null` với boss cốt truyện |
| NPC-ENT-007 | NPC Ẩn / Sự Kiện | Tùy | Hidden Lore | Tùy | Xuất hiện theo sự kiện |
| NPC-ENT-008 | Dị Sĩ | Né combat | Thí Luyện thay quest | Không | `interaction_type` ∈ riddle, gift_offering, friendly_duel, drink_challenge, pure_random; `boon_roll {good, bad, neutral}` (ví dụ 65/25/10); `appearance_weight` rất thấp; biến mất sau một lần tương tác với người chơi đó. Outcome tốt/xấu roll từ pool Mệnh Số hiện hành (Cát/Hung), trung tính chỉ là lore. |
| NPC-ENT-009 | Tà Thần | World boss nhiều phase | Chuỗi Hidden Lore | Không | `min_realm = hoa_than` khóa cứng; `god_domain` ∈ Điên Loạn, Hủy Diệt, Dục Vọng, Lãng Quên; phase ngưỡng 100/60/25% HP, phase cuối SAN check liên tục; `world_event_on_awaken/defeat/fail`. Thua chỉ đẩy lùi, Tà Thần ngủ lại chờ chu kỳ sau. |
| NPC-ENT-010 | Ma Đầu / Nghịch Đồ | Có, scale theo người chơi | Chuỗi ân oán | Không | `nemesis_trigger_condition`; realm luôn nhỉnh hơn người chơi; `encounter_count`: lần 1 khiêu khích, lần 2 giao chiến nhỏ có bỏ chạy, lần ≥3 toàn lực; thoại mới mỗi lần; `final_showdown_quest_id` theo mốc cảnh giới. |
| NPC-ENT-011 | Hộ Pháp Thú | Có, có đường vòng | Không | Không | Canh cổng Bí Cảnh/Cấm Địa; `passage_conditions` ∈ combat_defeat, fate_toll (nộp Mệnh Cát ≥ ngưỡng), riddle, faction_token; chỉ tấn công khi xâm nhập không qua điều kiện hợp lệ. |
| NPC-ENT-012 | Nghịch Thương Nhân | Không | Không | Chính | Bán hàng cấp cao, trả bằng Thọ Nguyên/SAN/hiến Mệnh Số; xuất hiện hiếm (`appearance_weight`); UI phải cảnh báo rõ và xác nhận trước giao dịch. |
| NPC-ENT-013 | Luân Hồi Sứ Giả | Không | Quest một lần | Không | Chỉ xuất hiện khi Thọ Nguyên = 0; lựa chọn đầu thai giữ Mệnh mạnh nhất hoặc giữ ký ức (+Ngộ Tính kiếp sau). |

### Tương tác theo lớp

| ID | Rule |
|---|---|
| NPC-ENT-020 | Tiếp cận entity: `npc` không hostile → luồng hội thoại ([dialogue-and-quests.md](dialogue-and-quests.md)); `npc` hostile → combat; `monster/boss` hostile → combat khi vào aggro; không hostile (thú hoang) → Thuần Hóa / Bỏ qua / Tấn công chủ động. |
| NPC-ENT-021 | Chỉ quái có `capturable:true` hoặc `beast:true` (lớp Yêu Thú Dị Biến) mới bắt sống được; guardian, Tà Thần, entity `server_wide` hoặc `questCritical` không bao giờ bắt được. |
| NPC-ENT-022 | Quest Eldritch/Cursed không theo luồng tự nguyện: khi Fate Ratio trả `ELDRITCH_INTERVENTION` hoặc `FATE_BACKFIRE`, sự kiện priority 0 ngắt hoạt động đang chạy, giao quest cưỡng chế; người chơi phải hoàn thành, Hiến Tế Thọ Nguyên hoặc chịu phạt; trả quyền khi tỉ số về dải an toàn 0.2–5.0. |

### Hành vi chiến đấu của quái

| ID | Rule |
|---|---|
| NPC-ENT-030 | Mỗi lượt quái chọn hành động theo %HP: >60% `basic`; ≤60% `special` (sát thương ×1.4); ≤25% `desperation`. Intent được telegraph vào `combatIntents` trước khi gây sát thương. |
| NPC-ENT-031 | Quái có `sanHit` trừ SAN mỗi đòn; quái Dị Biến có SAN check khi trúng đòn, thất bại gán debuff "Ảo Giác". |
| NPC-ENT-032 | Trạng thái của quái chỉ áp khi hành động không phải `basic` (trừ độc luôn áp). Bị khống chế → bỏ lượt (boss miễn khống chế bỏ qua). |
| NPC-ENT-033 | Dị Quỷ cấp cao ở phase cuối chỉ nhận sát thương thật khi người chơi đạt ngưỡng tổng Mệnh Cát (Trấn Áp bằng Mệnh Số). |

### Rớt đồ

| ID | Rule |
|---|---|
| NPC-ENT-040 | `LootTable.entries` gồm `linh_thach` (khoảng), `item`, `fate` (khoảng phẩm cấp) có trọng số. Mệnh Số rớt dùng thang phẩm cấp và luồng nhận Mệnh hiện hành của [fate](../fate/README.md)/[reward](../reward/README.md); quái thường phẩm thấp, Tinh Anh trung, Boss/Dị Quỷ cao nhất. |
| NPC-ENT-041 | Rớt Mệnh trùng gốc sao Tương Khắc với Mệnh đang có phải cảnh báo người chơi trước khi nhận. |

## Acceptance

- Mọi entity validate được với schema nền; lớp mở rộng không thiếu field bắt buộc của lớp.
- Dị Sĩ biến mất sau một lần; Tà Thần không trigger dưới Hóa Thần; Luân Hồi Sứ Giả từ chối khi Thọ Nguyên > 0.
- Gate: `node tools/verify_game.js`, `node tools/verify_n90_n114_behavior.js`.

## Runtime mapping

| Rule | file:symbol | Trạng thái |
|---|---|---|
| NPC-ENT-001..007 | `data/*` (NPC/monster catalog), `js/engine.js:combatEntity` | Khớp |
| NPC-ENT-008 | `js/engine.js` (Dị Sĩ `appearance_weight`, `boon_roll`) | Khớp |
| NPC-ENT-009 | `js/engine.js` (`god_domain`, `server_wide` guard) | Khớp |
| NPC-ENT-010..011 | `js/engine.js` (`guardian`/`nemesis` → `resolveFactionHunt`) | Khớp |
| NPC-ENT-012 | `js/engine.js` (black market, cảnh báo xác nhận) | Khớp |
| NPC-ENT-013 | `js/engine.js` (Luân Hồi Sứ Giả chặn khi `lifespan > 0`) | Khớp |
| NPC-ENT-020 | `js/engine.js:presentEntities`, dialogue/combat dispatch | Khớp |
| NPC-ENT-021 | `js/expansion.js` (capturable check) | Khớp |
| NPC-ENT-022 | `js/engine.js` (`STATE_ELDRITCH_INTERVENTION` alias) | Khớp |
| NPC-ENT-030, 032 | `js/engine.js:monsterAction` | Khớp |
| NPC-ENT-031 | `js/engine.js:monsterAction` (`drainSan`) | Khớp |
| NPC-ENT-033 | — | Thiếu |
| NPC-ENT-040 | `js/engine.js` loot/reward | Khớp |
| NPC-ENT-041 | — | Thiếu |
