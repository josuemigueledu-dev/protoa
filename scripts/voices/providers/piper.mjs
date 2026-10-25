import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODELS } from '../cast.mjs';

const HF = 'https://huggingface.co/rhasspy/piper-voices/resolve/main';
const WORKER = fileURLToPath(new URL('../piper_worker.py', import.meta.url));

// A provider renders text to WAV files. To swap in a paid voice later, export the same three members:
//   id           short name, part of every cache key
//   voiceKey(v)  string that changes whenever the voice would sound different
//   renderBatch({ voice, items: [{ text, out }] }) -> Promise<void>   writes each item's `out` as WAV
export function piperProvider({ modelsDir, python = process.env.PIPER_PYTHON || 'python3' }) {
  const modelPath = name => join(modelsDir, `${name}.onnx`);
  return {
    id: 'piper',
    voiceKey: v => `piper:${v.model}:${v.speaker ?? ''}:${v.lengthScale ?? 1}:${v.pitch ?? 1}:${v.noiseScale ?? ''}:${v.noiseW ?? ''}`,
    modelPath,
    missingModels: names => names.filter(n => !existsSync(modelPath(n))),
    async download(names) {
      mkdirSync(modelsDir, { recursive: true });
      for (const n of names) {
        for (const ext of ['onnx', 'onnx.json']) {
          const res = await fetch(`${HF}/${MODELS[n].path}/${n}.${ext}`);
          if (!res.ok) throw new Error(`download ${n}.${ext}: HTTP ${res.status}`);
          writeFileSync(join(modelsDir, `${n}.${ext}`), Buffer.from(await res.arrayBuffer()));
        }
      }
    },
    renderBatch({ voice, items }) {
      return new Promise((resolve, reject) => {
        const p = spawn(python, [WORKER], { stdio: ['pipe', 'inherit', 'inherit'] });
        p.on('error', reject);
        p.on('close', code => (code === 0 ? resolve() : reject(new Error(`piper worker exited ${code}`))));
        p.stdin.end(JSON.stringify({ model: modelPath(voice.model), speaker: voice.speaker ?? null, length_scale: voice.lengthScale ?? 1, noise_scale: voice.noiseScale ?? null, noise_w: voice.noiseW ?? null, items }));
      });
    },
  };
}
