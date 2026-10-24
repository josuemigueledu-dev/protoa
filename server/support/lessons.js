import { readdirSync } from 'node:fs';

// The lesson files the page loads after content.js (js/lessons/NN.js), in order,
// as relative paths for the vm loaders in the tests.
export const lessonFiles = () =>
  readdirSync(new URL('../../apps/deutsch/js/lessons/', import.meta.url))
    .filter(f => /^\d+\.js$/.test(f)).sort().map(f => `lessons/${f}`);
