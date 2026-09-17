# Character Generator — Deterministic RNG Boundary — 2026-09-17

## Mục tiêu

Trình tạo nhân vật phải dùng một RNG được truyền vào khi cần replay. Khi không truyền RNG, hệ thống chỉ được dùng một boundary entropy duy nhất để tạo nhân vật mới.

## Contract

- `generateCharacter({ rng })` nhận hàm `rng()` trả về số trong khoảng `[0, 1)`.
- Tất cả nhánh random của character generator phải đi qua RNG này: Mệnh số, Mệnh số ẩn, thuộc tính, căn cơ, chủng tộc, bối cảnh, tính cách, mục tiêu, tuổi thọ và suffix ID.
- `rng` không được gọi trong preview/UI nếu action chưa commit.
- Nếu không truyền `rng`, `defaultRandom` là boundary entropy duy nhất; không thêm `Math.random()` rời rạc.
- Với cùng input cố định và cùng chuỗi RNG, output gameplay phải deep-equal; `createdAt` là metadata thời điểm tạo, không phải dữ liệu replay.

## Regression

`tools/verify_character_generator_replay.js` tạo hai nhân vật bằng cùng input và hai RNG độc lập nhưng cùng chuỗi, sau đó kiểm tra deep-equal sau khi loại metadata `createdAt`. `tools/verify_random_boundaries.js` audit trực tiếp cả `character_generator.js`.

## Trạng thái

ĐÃ CODE. Còn cần browser QA nếu character creation được nối vào UI runtime production và cần fixture replay từ save thật.
