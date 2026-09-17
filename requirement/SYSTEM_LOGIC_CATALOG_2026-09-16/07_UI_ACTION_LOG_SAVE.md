# UI-LOG — ACTION, TAB, NOVEL LOG, SAVE VÀ ARCHIVE

## 1. Action pipeline

`contextState` tạo DTO context; action providers tạo danh sách action; `resolveActionPriority` loại action không hợp lệ, gán tier/urgency/blocking/scope; `submitActionId`/`submitTurn` commit một action duy nhất. Pending combat/search/ritual/opportunity có priority cao hơn utility.

UI không gọi trực tiếp mutation tùy tiện. Action phải có id canonical, label, description, disabled reason, category và handler. Guard duplicate execution bằng turn/action key.

## 2. Tab và feature placement

- Hành Trang: inventory/equipment/item use.
- Mệnh: active/vault/relationship/nurture/evolution.
- Công Pháp: technique preview/mastery/evolution.
- Thế Giới: map, faction, weather, NPC context, `Công Trình`.
- Dị Chí/Khám Phá: codex, clues, divination, survival marks.
- Nhiệm Vụ/Tổ Chức: quest, guild, tournament, contracts.

`Công Trình` không nằm trong Nghề; Truyền Tống Trận và Hộ Giới Đại Trận hiển thị trong Thế Giới và dùng structure DTO.

## 3. Novel log contract

Mọi player-visible event đi qua `createGameEvent` → `renderGameEvent` → `narrativeSafe`. `COMMAND_ECHO`, debugOnly, field name, internal code và technical words không render. `ERROR_NARRATIVE_MAP` dịch mã lỗi đã biết; unknown code fallback neutral.

Narrative không chứa `:`/`：`, không dùng announcement structure, có bối cảnh/hành động. `changes` chuyển thành `statDisplay`, không chen vào câu văn.

## 4. Scene batching

`renderScene` và `renderStoryWindow` dùng cùng key: Năm/Tháng/Ngày + node + sub-location. Entry liên tiếp cùng key nối thành một đoạn; timestamp xuất một lần; stat summary unique ở cuối. Khác ngày hoặc khác scene tách đoạn. Command echo bị loại trước grouping.

## 5. Save và deserialize

Serialize phải giữ state root, history/logState, map, world simulation, fate instances, profession/path ritual, NPC/companion, quest/mail và archive metadata. Deserialize chạy migration/version, tạo default idempotent, normalize aliases và prune invalid references.

Không serialize DOM, function, catalog mutable hoặc cache không cần thiết. Unknown field được giữ hoặc bỏ theo compatibility policy, không làm hỏng load.

## 6. IndexedDB/archive

Archive có queue/retry/failure injection, save ID/version/checksum/createdAt, idempotent put và recovery sau reload. Local save và archive phải cùng canonical serialized payload; archive fail không được mất local save.

## Note chưa hoàn thiện

- **MỘT PHẦN**: UI còn cần kiểm tra từng feature rằng view model không đọc raw state ngoài resolver.
- **MỘT PHẦN**: history cũ tạo trước schema `statDisplay` cần migration/hiển thị stat fallback đầy đủ.
- **MỘT PHẦN**: action priority cần ma trận regression cho mọi trạng thái pending mới.
- **THIẾT KẾ**: cần chốt policy giữ history dài hạn giữa local save và archive.
