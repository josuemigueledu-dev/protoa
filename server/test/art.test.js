import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkArt, readManifest, renderBundle, root, BUNDLE_FILES } from '../../scripts/art.mjs';

const manifest = readManifest();
const { errors, ART } = checkArt(manifest);
const only = re => errors.filter(e => re.test(e));

test('art: no hex colours in any SVG', () => assert.deepEqual(only(/hex colour/), []));
test('art: every viewBox matches its family size', () => assert.deepEqual(only(/viewBox|unknown kind/), []));
test('art: manifest and files agree both ways', () => assert.deepEqual(only(/missing file|no manifest entry|duplicate id/), []));
test('art: every cast file has all five moods', () => assert.deepEqual(only(/face$/), []));
test('art: every object has an --il-hi highlight', () => assert.deepEqual(only(/highlight/), []));
test('art: nothing else is reported', () => assert.deepEqual(errors, []));

test('art: manifest ids are namespaced by kind', () => {
  for (const a of manifest) assert.ok(a.id.startsWith(a.kind + '.'), `${a.id} should start with ${a.kind}.`);
});

test('art: generated bundles are up to date (run npm run art)', () => {
  const out = renderBundle(manifest, ART);
  for (const f of BUNDLE_FILES) assert.equal(fs.readFileSync(path.join(root, f), 'utf8'), out, `${f} is stale`);
});
