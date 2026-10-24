#!/usr/bin/env node
// Pre-renders every spoken German line of the course with the cast's voices (docs/research/voices.md).
//   node scripts/voices.mjs list            what would be rendered, per speaker
//   node scripts/voices.mjs models          download the Piper models used (about 190 MB, once)
//   node scripts/voices.mjs render [--limit N]
// Needs piper-tts (pip install piper-tts) and ffmpeg. Output goes to apps/deutsch/audio/ (not committed):
// one small Opus file per line plus manifest.json {text: file}, which the page loads to fill VOX_URL.
// Unchanged lines are skipped, so a re-run after a lesson edit renders only what changed.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SPEAKERS, MODELS } from './voices/cast.mjs';
import { loadLessons, collectLines, textHash } from './voices/lines.mjs';
import { piperProvider } from './voices/providers/piper.mjs';

const root = new URL('..', import.meta.url).pathname;
const outDir = process.env.VOICES_OUT || join(root, 'apps/deutsch/audio');
const provider = piperProvider({ modelsDir: process.env.PIPER_MODELS || join(root, '.cache/voices/models') });

function plan(lines) {
  return lines.map(l => {
    const voice = SPEAKERS[l.speaker];
    return { ...l, voice, file: `${textHash(provider.voiceKey(voice), l.text)}.opus` };
  });
}

const [cmd = 'list', ...rest] = process.argv.slice(2);
const limit = rest.includes('--limit') ? +rest[rest.indexOf('--limit') + 1] : Infinity;
const { lines, skipped } = collectLines(loadLessons());
const jobs = plan(lines);

if (cmd === 'list') {
  const by = {};
  for (const j of jobs) { by[j.speaker] ??= { lines: 0, chars: 0 }; by[j.speaker].lines++; by[j.speaker].chars += j.text.length; }
  console.log(`${jobs.length} lines, ${jobs.reduce((n, j) => n + j.text.length, 0)} characters; ${skipped.length} skipped (profile placeholders)`);
  for (const [s, v] of Object.entries(by)) console.log(`  ${s.padEnd(8)} ${String(v.lines).padStart(5)} lines ${String(v.chars).padStart(7)} chars`);
} else if (cmd === 'models') {
  const names = Object.keys(MODELS);
  await provider.download(names);
  console.log('models in', provider.modelPath('').replace(/\.onnx$/, ''));
} else if (cmd === 'render') {
  const missing = provider.missingModels([...new Set(jobs.map(j => j.voice.model))]);
  if (missing.length) { console.error(`Missing models: ${missing.join(', ')}. Run: node scripts/voices.mjs models`); process.exit(1); }
  mkdirSync(outDir, { recursive: true });
  const todo = jobs.filter(j => !existsSync(join(outDir, j.file))).slice(0, limit);
  console.log(`${jobs.length - todo.length} cached or over --limit, ${todo.length} to render`);
  const tmp = mkdtempSync(join(tmpdir(), 'voices-'));
  const groups = new Map();
  for (const j of todo) { const k = JSON.stringify(j.voice); (groups.get(k) ?? groups.set(k, []).get(k)).push(j); }
  for (const batch of groups.values()) {
    const items = batch.map((j, i) => ({ text: j.text, out: join(tmp, `${j.file}.${i}.wav`), job: j }));
    await provider.renderBatch({ voice: batch[0].voice, items: items.map(({ text, out }) => ({ text, out })) });
    for (const it of items) {
      const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', it.out, '-c:a', 'libopus', '-b:a', '24k', '-ac', '1', join(outDir, it.job.file)]);
      if (r.status !== 0) throw new Error(`ffmpeg failed for "${it.text}": ${r.stderr}`);
    }
  }
  rmSync(tmp, { recursive: true, force: true });
  const manifest = {};
  for (const j of jobs) if (existsSync(join(outDir, j.file))) manifest[j.text] = j.file;
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest));
  const bytes = readdirSync(outDir).filter(f => f.endsWith('.opus')).reduce((n, f) => n + statSync(join(outDir, f)).size, 0);
  console.log(`manifest: ${Object.keys(manifest).length} lines, ${(bytes / 1e6).toFixed(1)} MB of audio`);
} else {
  console.error('usage: node scripts/voices.mjs list | models | render [--limit N]');
  process.exit(2);
}
