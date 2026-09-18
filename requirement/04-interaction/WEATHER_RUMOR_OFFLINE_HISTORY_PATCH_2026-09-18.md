# Bản vá Weather / Rumor / Offline — 2026-09-18

Thiên tượng thay đổi bằng resolver thủ công hoặc world tick đều ghi cùng schema `weatherHistory`, giới hạn 30 bản ghi và giữ `source`, `from`, `to`, `day`. Duration được chuẩn hóa thành số ngày nguyên tối thiểu một ngày; log vùng hiện tại dùng novel-style.

Regression kiểm tra chuyển thời tiết thủ công, lịch sử nguồn QA và toàn bộ offline/world gates.
