# PLATFORM — DATA, RUNTIME, MIGRATION, DETERMINISM VÀ PERFORMANCE

## 1. Loading order

HTML nạp data catalog trước engine/expansion, sau đó UI/main. Catalog phải tồn tại trước resolver. Offline bundle phải chứa cùng data/script, không phụ thuộc đường dẫn tuyệt đối. Cache-busting version đổi khi JS/data thay đổi.

## 2. Normalization

Mỗi subsystem có `ensure*State` idempotent. Normalize:

1. tạo object/array mặc định;
2. canonicalize ID/name alias;
3. clamp số và loại NaN;
4. lọc reference không tồn tại;
5. migrate schema cũ;
6. giữ dữ liệu người chơi không phá hủy được;
7. đánh dấu `schemaVersion`.

## 3. Deterministic RNG

Action quan trọng cần seed/day/turn/action key để replay được khi có thể. Random không được gọi thêm chỉ vì UI preview. Preview phải dùng snapshot hoặc deterministic roll riêng, không tiêu hao RNG của commit.

## 4. Transaction/idempotency

Mọi action mutate theo prepare → validate → calculate → commit → event. Failure trả reason, không để state nửa chừng. Key idempotency gồm action/player/day/target khi tick có thể chạy lại.

## 5. Performance budget

Không quét toàn bộ catalog lớn mỗi render. Cache resolver theo state revision; invalidate khi state thay đổi. Map influence dùng spatial index/region cache; NPC scheduler chỉ cập nhật actor cần tick; history prune theo giới hạn. UI render batch, tránh layout thrash và event listener duplicate.

## 6. Test gates

- syntax check tất cả JS;
- data integrity/catalog/reference;
- Fate/path/profession/Dị Thể;
- map/fog/influence/travel/structure;
- NPC/weather/companion/quest;
- log novel/scene batching/stat separation;
- save migration/archive failure injection;
- stress offline days và memory/history bound;
- DOM/UI action priority.

## Note chưa hoàn thiện

- **MỘT PHẦN**: deterministic seed chưa bao phủ mọi random trong expansion.
- **MỘT PHẦN**: cache invalidation map influence và NPC view model cần đo bằng profiling thực tế.
- **MỘT PHẦN**: offline stress test chưa bao phủ đầy đủ chiến tranh + NPC + structure đồng thời.
- **THIẾT KẾ**: cần chốt ngân sách render/history cho thiết bị yếu.
## Random boundary audit

Batch 29 closes the character-generator boundary: `character_generator.js`
accepts an injected RNG for every gameplay-random branch. The static audit now
includes engine, procedural item generation, and character generation; the
dedicated replay regression is `tools/verify_character_generator_replay.js`.

Replay-capable gameplay uses `replayRandom` or an injected RNG. Standalone
character/item generation may use only the explicit `entropyRandom` or
`defaultRandom` boundary. `tools/verify_random_boundaries.js` fails if a new
direct `Math.random` producer appears in the engine or item generator.
