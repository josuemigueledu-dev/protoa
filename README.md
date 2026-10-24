# Protoa

A family of learning apps under one orb. The first is a German course for English speakers aiming for spoken B1.

## Run it

Requires Node 22.9 or newer.

```sh
npm run setup          # install server dependencies
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npm run dev            # http://localhost:8787/deutsch/
```

Without an API key the app still runs; the AI features (answer checking, corrections, Sprechen, lesson writing, exam marking) are turned off.

`npm test` runs the server tests. See `CLAUDE.md` for how the code is organised.
