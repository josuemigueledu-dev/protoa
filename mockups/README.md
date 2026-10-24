# Visual spec mockups

Static mockups for the Protoa Visual Design Spec ("Frosted line"). Nothing in `apps/` or `server/` is changed except new art files under `apps/deutsch/art/`.

Open `mockups/index.html` in a browser: every mockup at 390×844, light beside dark. A single page takes `?theme=light|dark` and, where it has two frames, `&frame=1|2`.

| File | What it is |
| --- | --- |
| `index.html` | Gallery |
| `style.html` | Art style sheet: palette, word pictures at 168/56/44 px, plates, Herr Weber's moods, icons, stickers, stamp, mouth sketches |
| `scene.html`, `words.html`, `notice.html`, `sound.html`, `conv.html`, `done.html` | Lesson steps |
| `today.html`, `practice.html` | Today; Practice with a locked tile, an empty state and a crop of the line |
| `rules.css` | The spec's UI rules (radius, weights, orb slot, locked/empty states) and new components, over `base` → `glass` → `depth` |
| `art.js` | Prototype of the planned `js/art.js`: `illusEl`, `sceneArt`, `bustEl`, `wordArt`, `stampSvg` |
| `build-art.js` | Prototype of `npm run art`: checks the manifest and writes `art-bundle.js` |
| `orb.js` | Static SVG stand-in for the WebGL orb, so it can sit in its slot |
| `shoot.js` | Screenshots every frame to `shots/` |

Art lives where the spec's file layout puts it: `shared/art/` (tokens, cast, events, empty states, stamp) and `apps/deutsch/art/` (plates, words, icons, mouth sketches, `manifest.json`). Every fill and stroke is `var(--il-...)`.

```
node mockups/build-art.js   # after changing any SVG or the manifest; fails on hex colours, wrong viewBox, missing moods or unlisted files
node mockups/shoot.js       # screenshots to mockups/shots/, reports sideways scrolling and script errors
```
