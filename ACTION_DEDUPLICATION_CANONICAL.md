# ACTION DEDUPLICATION CANONICAL

## NPC gần người chơi

Một NPC có thể xuất hiện ở hai nguồn: `location.npcs` (catalog tĩnh) và `worldSimulation.npcState` (scheduler). Hai nguồn này là hai bản ghi của cùng một người, không phải hai NPC.

`talkActions` dùng bản ghi scheduler khi NPC còn sống và đang ở đúng `locationId`/tiểu cảnh. Bản ghi tĩnh chỉ được dùng khi không có bản ghi scheduler. Action được tạo qua stable id `act_talk_<npcId>` và không được lặp.

Các action pending discovery cũng phải đi qua một lần `resolveActions`, nơi dedupe theo id trước khi UI chia quick/overflow. Không append lại `act_search_collect`, `act_search_investigate`, `act_explore_npc_assist`, `act_exp_map_event` hoặc `act_search_leave` ở lớp presentation.

Regression: `tools/verify_local_movement_weather.js` tạo đồng thời bản ghi tĩnh và scheduler cho `hai_su_tu`, kết quả phải có đúng một `act_talk_hai_su_tu`.
