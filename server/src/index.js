// Protoa server: serves every Protoa app's static files and the API they share.
// Apps live in /apps/<name>/ and are served at /<name>/; shared code (the orb) at /shared/.
import './env.js'; // first, so the modules below see the .env values
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { fakeAI } from './fake-ai.js';

const port = Number(process.env.PORT) || 8787;
// `npm run dev:fake-ai`: canned AI replies for trying the AI screens without a key (fake-ai.js)
const fake = process.argv.includes('--fake-ai') || process.env.PROTOA_FAKE_AI === '1';
if (fake && process.env.NODE_ENV === 'production') throw new Error('The practice AI (--fake-ai) is for development only.');
const app = createApp(fake ? fakeAI({ delayMs: Number(process.env.PROTOA_FAKE_AI_DELAY ?? 700), fail: process.env.PROTOA_FAKE_AI_FAIL || '' }) : {});
serve({ fetch: app.fetch, port }, info => {
  console.log(`Protoa running at http://localhost:${info.port}/deutsch/`);
  if (fake) console.log('Practice AI is on: AI features answer with canned replies, Claude is not called.');
  if (fake && process.env.PROTOA_FAKE_AI_FAIL) console.log(`Every AI call fails with "${process.env.PROTOA_FAKE_AI_FAIL}" (PROTOA_FAKE_AI_FAIL).`);
});
