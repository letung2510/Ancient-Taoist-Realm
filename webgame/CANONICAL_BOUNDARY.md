# Webgame canonical boundary

`webgame/` is a deliberately isolated visual micro-runtime. It is not a second
save format or a producer for the main game. Its only supported contract is:

- deterministic `webRandom(seed, turn)` for preview/demo actions;
- local-only storage under `co-di-dien-visual-v1`;
- no calls to `Math.random`, no writes to the main engine state, and no rewards
  or progression that can be imported into the canonical runtime;
- all travel, cultivation and rest mutations remain inside the local demo
  state and are reset by the demo reset control.

The boundary is enforced by `tools/verify_webgame_boundary.js`. Any future
feature that needs canonical save/progression must be implemented in
`js/engine.js`/`js/expansion.js` and exposed through the main app, not copied
into this micro-runtime.
