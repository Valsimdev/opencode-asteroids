# AGENTS.md

Compact guidance for OpenCode sessions working in this repo.

## Stack & toolchain

- **No toolchain.** No `package.json`, no npm scripts, no bundler, no transpiler, no linter, no typecheck, no test framework. Do not run `npm test` / `npm run lint` / etc. — they don't exist.
- Vanilla JS (ES6+) + HTML5 Canvas. Zero dependencies.
- Verification is **manual**: open `index.html` directly in a browser, or run `npx serve .` and visit http://localhost:3000. There is no automated check.

## Architecture

- The entire game lives in **`game.js`** (~420 lines, single file). Classes: `Ship`, `Asteroid`, `Bullet`, `Particle`. Global mutable state: `ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`.
- `game.js` is loaded via a plain `<script src="game.js">` in `index.html` — **not** an ES module. Do not add `import`/`export` without also switching the tag to `type="module"`.
- Canvas size is hardcoded in **two places that must stay in sync**: the `W`/`H` constants at the top of `game.js` (800×600) and the `<canvas width="800" height="600">` in `index.html`. Changing one without the other breaks toroidal (wrap-around) space.
- Game state machine: global `state` is one of `'playing'` | `'dead'` | `'gameover'` (see `update()`).

## Conventions & gotchas

- **Input model:** `keys[code]` tracks held state; `pressed(code)` reads and *clears* the edge flag for the current frame — calling it twice in one frame returns `false` the second time. Wire new "just pressed" handlers accordingly.
- The main loop is dt-based and **clamps `dt` to 0.05s max** (`loop()`). Physics depend on `dt`, not frame count.
- **Language:** README, code comments, and in-game HUD strings are in **Spanish**. Preserve this when editing user-facing text or comments.
- The README's description mentions power-ups and an "estrella fugaz" asteroid type; these are **not implemented** in the current code. Don't waste time searching for them.
