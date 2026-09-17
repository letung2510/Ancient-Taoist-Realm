# Hidden Realm Offline Cycle Regression — 2026-09-17

## Canonical rule

Hidden Realm cycle expiry is processed by the same world tick used for offline catch-up. Once `closesDay` has passed, the runtime cannot remain open and the core reward cannot be claimed.

## Regression

`tools/verify_review_batches.js` creates an open cycle, enters it, advances three days offline past the close window, asserts the cycle is closed and verifies reward claim rejection plus final runtime validator success.

## Chưa hoàn thiện

Reward/content balance giữa các Hidden Realm khác nhau vẫn là tuning sản phẩm; lifecycle expiry and claim guard are canonical.
