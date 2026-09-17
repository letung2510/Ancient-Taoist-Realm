# World tab — structure ownership UI

World tab phải hiển thị owner (`player`, `faction`, `npc`) và quyền hiện tại đối với
từng công trình. UI gọi `GameExpansion.structureManagerDecision`, không tự sao chép
permission rules. Người chơi phải thấy rõ sửa chữa/nâng cấp/tháo dỡ được phép hay không;
action runtime vẫn là authority cuối cùng.

`renderStructureOwnershipPolicy` là lớp hiển thị canonical policy cạnh danh sách Công
Trình Bản Đồ. Regression UI kiểm tra renderer và resolver token tồn tại cùng nhau.
