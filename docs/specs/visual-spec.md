# Protoa Visual Design Spec

Oct 24, 2026 · Team

The app's glass UI is strong, but its artwork comes in four different styles that ignore dark mode, and lessons have almost no pictures after the first screen. This spec sets one illustration system, tightens the UI rules, and lists the mockups for Claude Code to build. Based on josuemigueledu-dev/protoa at commit a08a574, reviewed in light mode at phone (390 px) and desktop (1440 px) widths.

## What's inconsistent today

| Issue | Evidence in the repo | Fix (section) |
| --- | --- | --- |
| Four art styles side by side | Line icons for navigation (`ICONS`), chunky shaded station icons (`ICON`, with drop shadow and white highlight), flat two-tone blue word pictures (`PICS`), and scene banners with serif chalk text (`SCENES`) | One style, "Frosted line" (Illustration style) |
| Art doesn't follow the theme | Every `PICS`, `SCENES` and `ICON` fill is a hard-coded hex value; the CSS has 132 more raw hex values outside the tokens | Art colours become CSS tokens with light and dark values (Illustration style) |
| The documented art style doesn't exist | The header of `content.js` describes cream, U-Bahn yellow, Berlin red and chalk green with Fraunces type; the art is all blue, and Fraunces isn't loaded, so it falls back to Georgia | Replace the header with this spec |
| Lessons are image-poor | Only the Scene step has a picture. 3 of lesson 1's 14 words have one. Notice, Check, Build and Conversation are text on glass; the conversation backdrop sits at 16 % opacity and reads as noise | Images in a lesson |
| Generated lessons can't get new art | There are 5 scene banners for 24 stations and 25 word pictures; any unknown scene id falls back to classroom | Code and data changes |
| Too many dark "hero" panes | Black glass is used for the Today greeting, the Sprechen header, the Kapitel banner, the Practice review icon and the profile avatar, so no screen has one clear focus | UI system rules |
| Corner radius drift | 19 different border-radius values (2 to 40 px) despite the tokens `--r` 24 and `--r-sm` 14 | UI system rules |
| Orb collides with content | The floating orb overlaps card edges and text, for example it cuts off "(to b..." on the Notice step and sits on Practice tiles | UI system rules |
| Mixed UI language | "Weiter" next to "Back"; "Deine Linie" and "Diese Woche" next to "Practice" and "Reviews" | UI system rules |
| Locked states read as broken | Locked Practice tiles are grey text on grey with no reason given | UI system rules |

## UI system rules

Keep the frosted glass, azure accent, Sora and Manrope; these rules remove the drift around them.

**Surfaces: three levels, one hero per screen.**

| Level | Token | Use |
| --- | --- | --- |
| Ground | `--bg` | Page background with the aurora and orbit lines |
| Glass card | `--card`, radius `--r` | Every content block |
| Ink pane (black glass) | `--pane-1` / `--pane-2` | At most one per screen: the Today greeting, the Sprechen header, the Lesson done screen. The Kapitel banner, the Practice review icon and the profile avatar move to glass with an azure-soft chip |

**Corner radius: five values only.**

| Token | Value | Use | Replaces today's |
| --- | --- | --- | --- |
| `--r-xs` (new) | 8 px | Chips and keys inside cards | 2, 4, 8, 9, 10, 12 px |
| `--r-sm` | 14 px | Buttons, tiles, inputs, choice rows | 14, 16, 18, 20 px |
| `--r` | 24 px | Cards, scene frames | 24, 28, 40 px |
| pill | 999 px | Tabs, tags, caption chips | 999 px |
| circle | 50 % | Orb slot, rings, avatars | 50 % |

**Type weights.** Body text drops from 600 to 500, so weight carries hierarchy: 500 body, 600 labels and buttons, 800 Sora headings. Sizes keep the existing `--t-*` tokens; the six hard-coded sizes (11 px, 12 px, .75rem, .71875rem, 2.5rem) become tokens.

**UI language.** App chrome is in English (the learner's language): buttons, tab names, section titles. German is used for lesson content, station and place names, and the product name Sprechen. So "Weiter" becomes "Continue", "Deine Linie" becomes "Your line", "Diese Woche" becomes "This week". A later setting can switch chrome to German for immersion.

**Orb slot.** The orb never floats over content. It sits in a reserved circle: 40 px at the right of the lesson header (beside the progress bar), 64 px in the Today greeting, and 56 px beside Protoa's lines in the conversation. Its mood colours stay as specified in `shared/brand/README.md`.

**Locked and empty states.** A locked tile keeps full colour at 60 % opacity with a lock glyph and one line saying why ("Opens after lesson 3"). An empty chart shows a small spot illustration and one line, not a flat zero axis.

**Raw colours.** Every hex value in the CSS moves into a token on `:root` with a dark value, so `grep '#[0-9a-f]'` finds tokens only.

## Illustration style: "Frosted line"

All art is drawn in one style: navy ink outlines over flat fills taken from the orb's own strata colours, with one glass highlight per object, so pictures look like they belong next to the orb and the glass cards. It has two registers.

- **Illustration (filled):** word pictures, scene plates, characters, station icons, event stickers.
- **Sketch (line only):** grammar and pronunciation diagrams. Ink line plus at most one azure highlight, drawn on glass with no background fill, so explanations look like quick notes rather than pictures.

### Drawing rules

1. Outline: `--il-ink`, stroke width 3 on a 120-unit box (2.5 % of the box at any size), round caps and joins. Objects and people are outlined; background shapes are not.
2. Fills: flat only. A word picture uses at most 4 fill tokens plus ink; a scene plate may use all of them.
3. Light: comes from the top left. Each object gets one highlight in `--il-hi` (a crescent or stripe at its top-left edge), echoing the orb's pin highlight.
4. Grounding: one ellipse in `--il-shadow` under standing objects. No blur filters, drop shadows, gradients or textures.
5. Reserved hues: no red, green, yellow or amber anywhere in art. Those colours mean die, das, correct, near miss and incorrect in this app.
6. People: simple geometry. Head is a circle, eyes two dots, mouth one stroke, body a rounded trapezoid. Faces use `--il-ice`, the same as today's art, so no single skin tone is implied; people differ by hair shape, glasses, height and one role prop (apron, stethoscope, lanyard, headset).
7. Text in art: only German signage that belongs to the lesson (Geschlossen, Apotheke), at most 2 words, Sora 600 in `--il-ink`.
8. Colour in code: every fill and stroke is `var(--il-...)`. A hex value inside an SVG fails review.
9. Size test: every word picture must still read at 44 px, the size of the Practice word-bank tile.

### Palette tokens

Light values are the brand strata from `shared/brand/README.md`.

| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `--il-ink` | Outlines, signage text | `#0b1220` | `#dbe6f5` |
| `--il-deep` | Darkest fill: hair, shoes, shadows of objects | `#132a57` | `#1a3466` |
| `--il-mid` | Main object fill | `#1a48a6` | `#2559c4` |
| `--il-bright` | Secondary fill, accents | `#3a86f0` | `#5fa9ff` |
| `--il-ice` | Faces, glass, light objects | `#7cc6ff` | `#9ad6ff` |
| `--il-mist` | Walls, sky, plate backgrounds | `#dbeaff` | `#1b2a44` |
| `--il-paper` | Paper, cups, white goods | `#f7f9fc` | `#24324c` |
| `--il-sand` | Wood, bread, floors (the only warm tone, kept low in chroma) | `#ece3d6` | `#3d3a36` |
| `--il-shadow` | Ground shadow | `rgba(11,18,32,.12)` | `rgba(0,0,0,.35)` |
| `--il-hi` | Glass highlight | `rgba(255,255,255,.55)` | `rgba(255,255,255,.18)` |

Word pictures sit on a tinted plate whose colour comes from the noun's article, as `.wcard .illus.m/.f/.n` already does: blue for der, red for die, green for das. Gender colour lives in the plate, never in the drawing.

### Asset families

The art is a kit of reusable parts, not one picture per lesson: a scene is a place plate plus characters plus an optional event, so a few dozen files cover many scenarios and every track. Counts below are estimates for the first 24 stations.

| Family | Format | Where it appears | Needed | Example ids |
| --- | --- | --- | --- | --- |
| Scene plates | 1600×900 (16:9, matching `.scene`), places only, no people | Scene step, conversation backdrop, twist, Build step header | about 16 (the 5 existing ones redrawn, plus 11 new) | `plate.classroom`, `plate.cafe`, `plate.ubahn`, `plate.spaeti`, `plate.pharmacy`, `plate.office` |
| Characters | 240×360 full body, standing; bust crop at 120×120 from the same file | Standing in the plate; as avatars beside conversation lines | about 10 role archetypes, each with 4 faces | `cast.weber`, `cast.barista`, `cast.neighbour`, `cast.pharmacist` |
| Character moods | One face group per mood, swapped in the same file | Follows the `mood` field already on each conversation line | 4: neutral, pleased, thinking, amused, plus surprised for twists | `cast.weber#pleased` |
| Word pictures | 120×120 | Words step, Check step, word sheet, Practice cards, word bank | About 200: concrete nouns, visible actions (essen, laufen) and paired adjectives (groß / klein); about 65 % of words | `word.kaffee`, `word.fahrkarte`, `word.essen` |
| Word tiles (no art) | CSS component | Any word without a picture: ich, und, nicht | 0 files | n/a |
| Station icons | 64×64, at most 3 fills plus ink | Course map, Today "Next station", lesson header | 27 (24 stations, review, exam, sounds), replacing `ICON` | `icon.hand`, `icon.coffee`, `icon.ticket` |
| Event stickers | 160×160 | The twist, placed over the plate's top-right corner | about 12 | `event.closed`, `event.soldout`, `event.delay`, `event.broken`, `event.empty`, `event.phone`, `event.rain` |
| Station stamps | 160×160 round rubber stamp, one template filled with the station name and icon | Lesson done screen, profile collection | 1 template | `stamp.template` |
| Grammar sketches | HTML and CSS components using small sketch parts (arrows, brackets) | Notice step, grammar reference | 6 components | `pattern-strip`, `swap`, `gender-tray`, `verb-fan`, `word-order`, `contrast` |
| Mouth sketches | 120×120, sketch register | Pronunciation spotlight, Lesson 0: Sounds | about 10: lip shapes for spread, rounded and open vowels; tongue side views for ich, ach, r and sch | `mouth.round-ue`, `mouth.ich` |
| Empty states | 120×120 | No reviews due, nothing to practise, AI offline, no stats yet | about 6 | `empty.reviews`, `empty.offline` |

**Plate layout.** Every plate keeps the same zones, so characters and stickers drop in without per-scene tuning:

- Floor line at y = 700.
- Cast zone from x = 1000 to 1500, characters standing on the floor line.
- Caption chip zone, kept clear, from x = 0 to 520 and y = 760 to 900.
- Event sticker zone in the top right: x = 1320 to 1560, y = 60 to 300.

## Images in a lesson, step by step

Every step of a lesson shows at least one image. The scene's place and people stay visible throughout, so the lesson feels like one immersive situation rather than a stack of quizzes. Steps follow the app's current flow, with the warm-up, pronunciation and twist steps from the Protoa Lesson Structure added.

| Step (app id) | What changes visually | Images |
| --- | --- | --- |
| Scene (`scene`) | Full-width plate with the cast standing in it; caption chip; the can-do goal as a line under the frame ("By the end, you can...") | Plate, cast (neutral) |
| Warm-up (new, `warmup`) | 3 to 5 review words as small cards in a row | Word pictures at 56 px, or word tiles |
| Notice (`notice`) | The scene line on a glass card, then a grammar sketch below it that pulls out the pattern | Bust of the speaker beside the line; one grammar sketch |
| Words (`words`) | Large word card | Word picture at 168 px on its article plate, or a word tile; the example sentence gets the bust of whoever says it in the scene |
| Pronunciation (new, `sound`) | The sound in large type, stress dots under the word (● for the stressed syllable, · for the others), play and slow buttons | One mouth sketch |
| Check (`check`) | Same as today, plus a reverse item: picture shown, choose the German word | Word picture |
| Build (`build`) | A 16:9 thumbnail of the plate (96 px tall) above the tiles, so the learner knows where the sentence is said | Plate thumbnail |
| Conversation (`conv`) | Plate as a full-strength backdrop under a frosted overlay (`--card` plus blur), replacing today's 16 % opacity; each partner line has that character's 40 px bust in the current mood; Protoa's coaching lines have the orb | Plate, busts, orb |
| Twist (inside `conv`) | The event sticker pops onto the plate's top-right corner (scale 0.6 to 1, 300 ms, `--spring`), and the partner's face switches to surprised | Event sticker, cast mood |
| Done (`done`) | Station stamp lands on the card (rotate -8°, scale 1.4 to 1, 240 ms); the words learned are shown as small pictures | Stamp, word pictures at 44 px |

In Practice, cards reuse the same word pictures and plate thumbnails, so a reviewed word comes back with the image it was learned with. The Healthcare learner reviews Rezept over the pharmacy plate, as the Practice section of the Lesson Structure asks.

## Code and data changes

Art moves out of `content.js` into SVG files with a manifest, gets bundled into one script so the app still runs with no build step and from a file, and lessons reference art by id.

### Files

```
shared/art/tokens.css          --il-* tokens, light + dark (loaded before base.css)
shared/art/cast/*.svg          characters, one file each, a <g data-mood="..."> per face
shared/art/events/*.svg        event stickers
shared/art/empty/*.svg         empty-state spots
shared/art/stamp.svg           station stamp template ({station}, {icon} slots)
apps/deutsch/art/plates/*.svg  Berlin scene plates
apps/deutsch/art/words/*.svg   word pictures
apps/deutsch/art/icons/*.svg   station icons
apps/deutsch/art/mouth/*.svg   mouth sketches
apps/deutsch/art/manifest.json [{ id, file, kind, tags, words?, moods? }]
apps/deutsch/js/art-bundle.js  generated: const ART = { id: '<svg ...>' }
```

**Bundling.** A new `npm run art` script reads the manifest, checks each file and writes `art-bundle.js`. That file loads after `content.js` and before `core.js` in `index.html`. SVGs are inserted inline, not as `<img>`, so `var(--il-...)` follows the theme.

**Renderer.** A new `js/art.js` (loaded after `ui.js`) exposes:

- `illusEl(id, size)`: one asset, inline.
- `sceneArt({ plate, cast: [{ id, mood, x }], event })`: composes one 1600×900 SVG. The plate goes first, then each character as a nested `<svg>` placed in the cast zone (keeping only the requested mood group), then the event sticker in its zone.
- `bustEl(id, mood, size)`: the 120×120 bust crop.
- `wordArt(word)`: the word picture on its article plate, or the word tile when there is no picture.

The existing `artEl` in `ui.js` (article spans) keeps its name, which is why the new single-asset function is `illusEl`.

### Lesson fields

Update the header of `content.js` to match.

| Field | Change |
| --- | --- |
| `scene.id` | Becomes `scene.plate` (a `plate.*` id) |
| `scene.cast` | New: `[{ id: 'cast.weber', x: 1200 }]` |
| `words[].pic` | A `word.*` id; required for concrete nouns, optional otherwise |
| `notice.sketch` | New: `{ type: 'swap', from: ['ich', 'bin'], to: ['Sie', 'sind'] }`, or another grammar-sketch type |
| `sound` | New: `{ focus: 'ü', mouth: 'mouth.round-ue', words: [...] }` |
| `twist` | New: `{ at: <conversation index>, event: 'event.closed', mood: 'surprised' }` |

**Validator (`validateLesson`).** Unknown art ids no longer fall back to the classroom. An unknown plate is swapped for the manifest plate with the most matching tags; an unknown word picture is dropped, and the word shows as a tile. Each swap is logged.

**Lesson generator (`server/src/apps/deutsch/tasks.js`).** The lesson task receives the manifest's ids and tags as a new capped input. The prompt tells it to choose `scene.plate`, `scene.cast`, `twist.event` and `words[].pic` only from that list. Add a sample to `SAMPLE` in `server/test/app.test.js`.

### Tests (new, in `server/test/`)

- No hex colour inside any SVG file.
- Each file's viewBox matches its family's size.
- Every manifest entry has a file, and every file has a manifest entry.
- Every cast file has all 5 mood groups.
- Every concrete noun in `LESSONS` has a picture.

## Mockups for Claude Code to build

Ten static mockup pages in a new `mockups/` folder, built with the app's real CSS and class names, each shown at 390×844 in light and dark side by side. No app code changes yet: the mockups are for deciding on the look first.

1. **Gallery** (`mockups/index.html`). Every mockup below, each shown twice as an iframe (`?theme=light` and `?theme=dark`; the page sets `data-theme` on `<html>`).
2. **Art style sheet.** The palette swatches in both themes. Eight word pictures (Kaffee, Brot, Fahrkarte, Schlüssel, Tasse, Apfel, Stuhl, Rezept), each at 168, 56 and 44 px. Two plates (`plate.classroom` with Herr Weber, `plate.cafe` with the barista). Herr Weber in all 5 moods. Four station icons, three event stickers, the station stamp and two mouth sketches.
3. **Lesson · Scene.** Lesson 1 on `plate.classroom` with Herr Weber standing in the cast zone, the caption chip, the can-do line under the frame, and the orb in its header slot.
4. **Lesson · Words.** Two frames: der Lehrer with its picture on the blue der plate, and Hallo as a word tile with no picture.
5. **Lesson · Notice.** Herr Weber's line with his bust, then the swap sketch showing ich bin turning into Sie sind.
6. **Lesson · Pronunciation.** Tschüss in large type with stress dots, play and slow buttons, and `mouth.round-ue`.
7. **Lesson · Conversation and twist.** Two frames. First, the classroom plate as a full-strength backdrop under frosted glass, Herr Weber's lines with his 40 px bust and Protoa's coaching line with the orb. Second, the same moment after the twist: `event.phone` popped onto the plate and Herr Weber's face set to surprised.
8. **Lesson · Done.** The Hermannplatz stamp on the card and the 14 learned words as 44 px pictures or tiles.
9. **Today.** The current Today screen with the UI system rules applied: one ink hero, the five radius values, English chrome, the orb in its slot, and no orb over cards.
10. **Practice and map.** Practice with a locked tile ("Opens after lesson 3") and an empty state using `empty.reviews`, plus a crop of the course map with the new station icons.

### Done when

- [ ] Every page renders in both themes with no hard-coded colours in any SVG
- [ ] All art follows the drawing rules (outline width, fill count, one highlight, reserved hues)
- [ ] Word pictures still read at 44 px
- [ ] Nothing overlaps the orb slot, and nothing scrolls sideways at 390 px
- [ ] PNG screenshots of every frame are saved to `mockups/shots/` with Playwright

## Open questions

- [x] Which course comes first? Decided: German for English speakers. The Weeks 1–3 lessons in the Protoa Lesson Structure now follow this course, and the art list above is sized for it.
- [ ] Faces: keep every face in `--il-ice` (on brand, no single skin tone implied) or draw a set of skin tones? A set of skin tones adds a token group and breaks the strict blue palette.
- [ ] UI chrome language: English chrome as proposed, or German chrome from a set level as an immersion feature?
- [ ] Who draws the art at scale? Claude can write the SVGs in this style, which is the fastest path for about 200 word pictures. Characters and plates carry the look most, and an illustrator could draw those 26 files once.
