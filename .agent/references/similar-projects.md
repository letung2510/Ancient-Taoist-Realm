# Dự án tham khảo (tra cứu 2026-10-22)

Chỉ dùng để tham khảo ý tưởng thiết kế/kiến trúc. Không copy code hay nội dung; kiểm tra license trước khi tham khảo sâu.

## Tu tiên / văn tự RPG trên web

| Dự án | Stack | Điểm đáng học cho Cổ Dị Điển |
|---|---|---|
| [setube/vue-xiuxiangame](https://github.com/setube/vue-xiuxiangame) — 我的文字修仙全靠刷 (~1.8k★) | Vue, JavaScript | Text tu tiên phổ biến nhất trên GitHub: vòng lặp tu luyện/đột phá, trang bị, log dạng văn bản |
| [setube/vue-idle-xiuxian](https://github.com/setube/vue-idle-xiuxian) — 我的放置仙途 (~300★) | Vue | Idle + offline progression; so sánh với `applyOfflineProgress`/`simulateWorldUntil` |
| [setube/yunyin-xiuxian](https://github.com/setube/yunyin-xiuxian) — 云隐修仙录 | Vue 3, TypeScript | Text cultivation idle mới, cấu trúc TS hiện đại |
| [pplmx/xian](https://github.com/pplmx/xian) — 玄枢录 | Vue 3, TS, PWA | 21 cảnh giới, phái đi lịch luyện, combat theo lượt tính trước ở background, chơi offline (PWA) |
| [moyan-ya/xianxia-idle-game](https://github.com/moyan-ya/xianxia-idle-game) | Vue 2 + Node/Express | Combat seed tái lập được, lazy offline settlement, khắc chế ngũ hành theo linh căn |
| [QingMuCat/nonebot_plugin_xiuxian_2](https://github.com/QingMuCat/nonebot_plugin_xiuxian_2) (~100★) | Python (bot chat) | Bộ luật tu tiên văn tự đầy đủ (tông môn, công pháp, bí cảnh) — tham khảo data design |
| [liyw0205/nonebot_plugin_xiuxian_3](https://github.com/liyw0205/nonebot_plugin_xiuxian_3) | Python | Có tài liệu spec/kiến trúc/roadmap viết lại từ đầu — tham khảo cách tổ chức requirement |
| [collrest-a11y/idle-cultivation-game](https://github.com/collrest-a11y/idle-cultivation-game) | JavaScript | Con đường tu luyện, tông môn hợp tác, offline progression |
| [haofordev/tienmagioi](https://github.com/haofordev/tienmagioi) | TypeScript | Web game tu tiên tiếng Việt (cơ bản) |

## Text RPG/incremental JS thuần (kiến trúc)

| Dự án | Điểm đáng học |
|---|---|
| [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) (~8.3k★) | Vanilla JS, không build, chia module theo scene, i18n nhiều ngôn ngữ, narrative log tối giản |

## Gợi ý áp dụng

- Combat/offline **seed tái lập được** (xian, xianxia-idle-game) khớp với `verify_random_boundaries.js` và `verify_character_generator_replay.js` hiện có.
- PWA/offline (xian) có thể thay thế dần nhu cầu `index.offline.html` nếu người dùng muốn.
- Cách tổ chức spec/roadmap của `nonebot_plugin_xiuxian_3` là mẫu tham khảo để giảm số file canonical trùng lặp.
