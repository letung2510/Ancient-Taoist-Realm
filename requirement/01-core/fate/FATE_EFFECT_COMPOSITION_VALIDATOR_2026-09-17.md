# Fate effect composition validator

Fate effects có bốn lớp độc lập: base definition, enhancement, relationship và evolution;
advanced actions dùng namespace riêng `fateAdvancedActions`. `validateFateEffectComposition`
kiểm tra active Fate hợp lệ, relationship stage 0..4, effect numeric hữu hạn, enhanced
resolver thuần/deterministic, evolution record không thiếu branch và stat composition ổn
định qua hai lần tính.

`validateExpansionState` gọi validator này; preview/commit và save-load regression so sánh
`computeStats(...).eff` để bắt cộng kép hoặc state drift. Advanced action vẫn được kiểm tra
bằng validator namespace riêng, không trộn vào enhancement/evolution.

Giới hạn: validator chứng minh tính ổn định/schema và không cộng kép trong runtime hiện tại;
cân bằng gameplay của từng Fate vẫn là playtest/content review.
