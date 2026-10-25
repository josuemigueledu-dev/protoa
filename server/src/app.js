import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { serveStatic } from '@hono/node-server/serve-static';
import { getConnInfo } from '@hono/node-server/conninfo';
import { aiAvailable, askJSON, askLongJSON, AIError } from './claude.js';
import { rateLimiter } from './ratelimit.js';
import { staticFiles } from './static.js';
import { tasks as deutsch } from './apps/deutsch/tasks.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// serveStatic takes a root relative to the working directory; '' would not mean "here"
const rel = p => path.relative(process.cwd(), path.join(ROOT, p)) || '.';

// Each Protoa app registers its AI tasks under its own name.
const APPS = { deutsch };

// Own properties only: names like "constructor" or "toString" must not resolve to inherited functions.
const own = (obj, key) => (obj && Object.hasOwn(obj, key) ? obj[key] : undefined);

function clientKey(c) {
  if (process.env.TRUST_PROXY) {
    const fwd = c.req.header('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
  }
  try { return getConnInfo(c).remote.address || 'unknown'; } catch { return 'unknown'; }
}

// runJSON / runLong / aiOn are swapped for stubs in tests and for the practice AI (fake-ai.js).
export function createApp({ runJSON = askJSON, runLong = askLongJSON, aiOn = aiAvailable } = {}) {
  const app = new Hono();

  app.get('/api/health', c => c.json({ ok: true, ai: aiOn() }));

  app.post('/api/:app/ai/:task',
    bodyLimit({ maxSize: 256 * 1024, onError: c => c.json({ error: { code: 'too_large', message: 'Request too large.' } }, 413) }),
    rateLimiter({ limit: Number(process.env.AI_RATE_LIMIT) || 60, windowMs: 10 * 60 * 1000, key: clientKey }),
    async c => {
      const name = c.req.param('task'), task = own(own(APPS, c.req.param('app')), name);
      if (!task) return c.json({ error: { code: 'not_found', message: 'Unknown task.' } }, 404);
      let body;
      try { body = await c.req.json(); } catch { return c.json({ error: { code: 'bad_request', message: 'Body must be JSON.' } }, 400); }
      const vars = task.input.safeParse(body);
      if (!vars.success) return c.json({ error: { code: 'bad_request', message: vars.error.issues[0]?.message || 'Invalid input.' } }, 400);
      if (!aiOn()) return c.json({ error: { code: 'unavailable', message: 'AI is not configured on this server.' } }, 503);
      try {
        const prompt = task.prompt(vars.data);
        // The signal aborts when the learner disconnects, so an abandoned call stops instead of running (and costing) to the end.
        const job = { task: name, vars: vars.data, tier: task.tier, prompt, signal: c.req.raw.signal };
        const result = task.long ? await runLong(job) : await runJSON({ ...job, schema: task.output });
        return c.json({ result });
      } catch (e) {
        const err = e instanceof AIError ? e : new AIError('upstream', 'Something went wrong.');
        if (!(e instanceof AIError)) console.error(e);
        return c.json({ error: { code: err.code, message: err.message } }, err.status);
      }
    });

  app.use('/shared/*', ...staticFiles(), serveStatic({ root: rel('.') }));
  for (const name of Object.keys(APPS)) {
    app.get(`/${name}`, c => c.redirect(`/${name}/`));
    // Pre-rendered voices (scripts/voices.mjs) are optional: without them the manifest is empty, not a 404.
    app.get(`/${name}/audio/manifest.json`, (c, next) => existsSync(path.join(ROOT, 'apps', name, 'audio/manifest.json')) ? next() : c.json({}));
    app.use(`/${name}/*`, ...staticFiles(), serveStatic({ root: rel('apps') }));
  }
  // Until there is a Protoa home page, the German course is the front door.
  app.get('/', c => c.redirect('/deutsch/'));
  return app;
}
