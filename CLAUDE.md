# Protoa

A German course for an English speaker (fluent in Spanish) aiming for spoken B1. Lessons on a course map, spaced-repetition word review, grammar reference, a "Sprechen" conversation mode, profile/stats, levels and exams.

## Current shape

- Everything is in one file, `index.html` (~4,000 lines: CSS, data, and app script together). No build step; open it in a browser.
- It was built as a claude.ai artifact. Fonts load from Google Fonts; no other external dependencies.
- Splitting it into separate CSS / JS / data files is a reasonable first refactor.

## Things that only worked inside the claude.ai artifact

The app checks for `window.claude` (see `loadRemote()`, near the "Storage" section). Outside claude.ai that object doesn't exist, so these fall back or turn off:

- **Sync / storage**: `claude.use('db')` and `claude.use('user')` stored settings, profile, progress and card shards per user. Without them the app runs on `localStorage` only (one browser, no sync).
- **AI features** via `claude.use('sample')` → `S.sample.json(...)`:
  - answer checking in the lesson conversation
  - sentence correction
  - "Generate a lesson with Claude" (new lessons, stored in `S.lessonsGen`)
  - "Explain my mistake"
  - Sprechen free conversation

To bring these back outside claude.ai they need a replacement: e.g. a small backend that calls the Claude API (keep the API key server-side, never in the page) and a real database/auth for sync.

## Data

- Built-in lessons are in `LESSONS`; generated ones in `S.lessonsGen`.
- SRS is SM-2 style with a 45-day cap.
- There is JSON import/export (`exportJSON()`, "Import / export" section) for moving progress between copies.

## Design notes

Frosted-glass look, one azure accent, light and dark themes via CSS variables on `:root` (`data-theme` override). Three layouts set on `<body>`: `lay-mobile`, `lay-tablet`, `lay-desktop`.
