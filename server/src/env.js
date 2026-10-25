// Loads the repo's .env, if there is one, before anything reads process.env.
// Variables already set in the environment win. Without a .env the server runs with AI off.
try { process.loadEnvFile(new URL('../../.env', import.meta.url)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
