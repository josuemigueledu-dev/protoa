// Protoa server: serves every Protoa app's static files and the API they share.
// Apps live in /apps/<name>/ and are served at /<name>/; shared code (the orb) at /shared/.
import './env.js'; // first, so the modules below see the .env values
import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 8787;
serve({ fetch: createApp().fetch, port }, info => {
  console.log(`Protoa running at http://localhost:${info.port}/deutsch/`);
});
