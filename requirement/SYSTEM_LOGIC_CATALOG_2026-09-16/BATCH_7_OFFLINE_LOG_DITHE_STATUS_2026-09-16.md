# Batch 7 — Offline, replay, log và Dị Thể — 2026-09-16

## Đã triển khai

- Offline world simulation có `offlinePolicy`: aggregate phần cũ, actor-level
  window 30 ngày cuối, `lastOfflineAudit` và mode `idempotent` khi gọi lặp cùng
  target. Có regression 30/60 ngày, seed determinism và inventory idempotency.
- Combat replay có regression transcript player-visible giống nhau giữa hai save
  deserialize từ cùng snapshot ở `type`, `text`, `clock`, `statDisplay`.
- `novelLogParagraphs()` trở thành API grouping canonical; `renderScene()` và UI
  story window gộp toàn bộ event cùng ngày, không tách theo node/sub-location.
- Weather summary đưa `weatherUntilDay`, `weatherSeverity`, `weatherHistory` vào
  view model và tab Thế giới.
- Dị Thể có `stageEffects`, `endingTags`, `factionAffinity`; modifier resolver
  đọc stage hiện tại, áp dụng SAN recovery stage-aware và cộng resonance vào
  node resonance. Save round-trip và stage regression đã chạy.
- Công trình disabled được repair/tái kích hoạt kể cả khi integrity còn 100;
  influence active/disabled/repair có regression.
- Contested opportunity offline expiry và Fate relationship không decay qua 120
  ngày có regression.

## Regression

- `verify_game.js`
- `verify_review_batches.js`
- `verify_dichi_deep.js`
- `verify_expansion_stress.js --runs=2 --days=60`
- `verify_log_narrative.js`
- `verify_expansion_log_matrix.js` — 43/43

## Còn mở

- Browser/device QA, large-save quota, FPS thiết bị yếu và cân bằng sản phẩm
  ending/faction cho Dị Thể/Path Fusion.
- Audit source-level mọi producer raw bằng `tools/verify_log_producers.js`: 66/66
  literal producer trong `engine.js` và `expansion.js` đi qua narrative boundary;
  producer động vẫn được kiểm qua log matrix.
- Character creation boundary nhận RNG injection cho root/race/fate/attribute/origin/
  trait/background/goal và factory ID; `verify_review_batches.js` kiểm tra replay
  deep-equal cùng seed.
