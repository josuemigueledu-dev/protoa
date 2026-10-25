# Protoa

Protoa is an umbrella for a family of learning apps, represented by the orb: a polished, clear glass sphere around a dense core of light whose hue shows its mood, orbited by a solid sphere with a moon of its own. The logo (`shared/brand`) is the same object drawn flat; read `shared/brand/README.md` before changing either. The German course is the first app; more will follow and share the orb, the visual language and the server. Build with a large user base in mind.

## The first app: German (`apps/deutsch`)

A course for an English speaker (fluent in Spanish) aiming for spoken B1. Lessons on a course map, spaced-repetition word review, grammar reference, a "Sprechen" conversation mode, profile/stats, levels and exams. It started as a claude.ai artifact and was split into files without changing behaviour.

## Layout

```
apps/deutsch/        German course (static: index.html, css/, js/)
shared/orb/          the Protoa orb (WebGL), for other apps; the German course draws its Night Glass orb in CSS (art/night/orb.png)
shared/brand/        logo files (mark, lockups, favicon, app icons) and the brand/character spec
server/              one Node server for all apps: static files + /api
  src/app.js           routes; apps register their AI tasks in APPS
  src/claude.js        the only place that calls the Claude API
  src/static.js        static files: no-cache + ETag/304 for code (updates show on the next load), gzip for text
  src/apps/deutsch/    the German course's AI tasks (prompts + schemas)
  test/                node:test; Claude is stubbed, tests are free and offline
```

## Running

- `npm run setup` once, then `npm run dev` → http://localhost:8787/deutsch/
- `npm test` runs the server tests.
- AI features need `ANTHROPIC_API_KEY` in `.env` (copy `.env.example`). Without it, or when `index.html` is opened directly as a file, the app runs with the AI features turned off.
- `npm run dev:fake-ai` runs the server with the practice AI (`server/src/fake-ai.js`): canned replies for every AI task, no key and no cost, so Sprechen, "Why? Explain it" and exam marking can be played and screenshotted. Development only.

## Front end (`apps/deutsch`)

- Plain JS, no build step. Classic `<script>` files share one global scope and **load in order** (see the end of `index.html`): `content` → `lessons/01.js …` → `art-bundle` → `core` → `ai` → `ui` → `companion` → `map` → `screens` → `levels` → `tilt` → `boot` → `pwa`. Top-level code may only use things defined in earlier files; functions are called later, from `boot.js`.
- `content.js` holds the conventions and shared tables (read its header before adding a lesson). Each built-in lesson is its own file `js/lessons/NN.js` that pushes onto `LESSONS` (and `GRAMMAR`); add its `<script>` tag in `index.html` after the previous lesson (a test checks). Generated lessons are in `S.lessonsGen`; generated ones in `S.lessonsGen`.
- Installable app: `manifest.webmanifest`, `icons/` (rendered from `shared/brand/app-icon-ink.svg` by `npm run icons`) and the service worker `sw.js`, registered by `js/pwa.js`. It caches everything `index.html` loads plus the painted art in its `WARM` list; code is network first, so an update shows on the next load. Add new art the scripts load by name to `WARM` (a test checks every entry exists).
- State is in `S` (core.js). SRS is SM-2 style with a 45-day cap. JSON import/export (`exportJSON()`) moves progress between copies.
- Design: frosted glass, one azure accent, light and dark themes via CSS variables on `:root` (`data-theme` override). Three layouts set on `<body>`: `lay-mobile`, `lay-tablet`, `lay-desktop`. CSS files load in order: `base` → `glass` → `depth`; later files override earlier ones on purpose.

## AI

- The browser calls `AI.run(task, vars)` (`js/ai.js`) → `POST /api/<app>/ai/<task>`. `S.ai` is set when the server reports AI is available; features check it and degrade when it is null.
- The prompt text lives on the server, never in the page, so the endpoint is not a general Claude proxy and the key never reaches the browser. Each task in `server/src/apps/<app>/tasks.js` has a Zod `input` (with size caps), a `tier`, a `prompt(vars)` and either an `output` Zod schema (structured outputs) or `long: true` (free-form JSON, streamed; the app validates it, e.g. `validateLesson`).
- Tiers: `quick` runs at low effort, `default` at medium, both on `claude-opus-5-5` unless `PROTOA_MODEL` / `PROTOA_MODEL_QUICK` say otherwise. Refusals fall back server-side (`fallbacks: "default"`). Each call has a deadline by tier (`DEADLINE_MS` in claude.js; the app gets a `timeout` error) and is cancelled when the learner disconnects.
- Adding a task: add it to `tasks.js`, add a sample input to `SAMPLE` in `server/test/app.test.js` (the test checks every task has one), call it with `AI.run`.

## Adding another Protoa app

Put it in `apps/<name>/`, load the orb from `../../shared/orb/glorb.js`, register its tasks in `APPS` in `server/src/app.js`. It is served at `/<name>/`.

## Not done yet (needed before a public launch)

- **Accounts and sync.** Progress lives in `localStorage` only (one browser). The claude.ai version synced through `window.claude`; that code is gone. `mergeProgress` / `mergeShard` in core.js are kept for server sync. Needs auth plus a database, and per-user AI quotas.
- **Abuse and cost limits.** AI calls are rate limited per IP in memory (`AI_RATE_LIMIT`, default 60 per 10 min). With several server instances or real users this needs a shared store keyed on the user.
- **Hosting.** Nothing is deployed. The server is Hono, so it can run on Node hosts or be moved to edge runtimes (e.g. Cloudflare Workers).
- Content still ships in `content.js`; with many apps and languages it should move server-side.
