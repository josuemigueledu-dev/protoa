# Visual direction: fixes to the Frosted line mockups

Oct 24, 2026 · owner + headmaster

This adds to `docs/specs/visual-spec.md`. Where the two disagree, this file wins. **Round 2** (at the end: characters, type, and not looking AI-made) came after round 1 and wins over it where they differ. The owner reviewed the mockups on branch `visual-spec-mockups` and kept the idea (frosted glass, the orb, the Frosted line art). What's wrong is the finish: the app should feel as polished as Brilliant or Duolingo, on a phone and on desktop.

## The idea, in one line

Protoa is a sentient, floating entity: the orb. It is the learner's guide through a real, warm, lived-in Berlin. The UI is futuristic glass. The art is human and friendly. The two meet in the orb.

## What was wrong with the mockups, and the fix

| # | Problem in the mockups | Fix |
|---|---|---|
| 1 | Dark mode inverts the art: `--il-ink` turns near-white, so pictures become light line drawings on black, Herr Weber turns grey and ghostly, and plates look muddy (`shots/scene-dark.png`, `conv-2-dark.png`). | Art never inverts. `--il-ink` stays dark navy in both themes, and fills keep their light-mode values, only a little dimmer (`--il-mist` and `--il-paper` one step deeper). In dark mode a plate reads like a lit window in a dark room. Event stickers and empty-state spots get a solid `--il-paper` backing disc so they never sit as bare outlines on dark glass. |
| 2 | People don't read as people. Pale blue skin and goggle-like round glasses make Herr Weber look like a robot. | Decided (open question "Faces"): characters get real skin tones from 4 new low-chroma tokens, `--il-skin-1` to `--il-skin-4`, spread across the cast. Heads are bigger (about a quarter of the body height) so expressions read at bust size. Eyes are dots with a small white catchlight. Glasses only where they belong to the character, thin-framed and smaller than the eye area. |
| 3 | Plates are thin: one small teacher at the far right, a board, a window and a door cut off at the edge. Nothing says Berlin. | Every plate has three depth layers (back wall, middle, foreground) and 2 or 3 Berlin details (U-Bahn sign, Altbau windows, Späti awning, the Fernsehturm through a window, a U-Bahn train drawn in blue because yellow is reserved). Background extras appear as simple silhouettes in `--il-mist`/`--il-ice`, so the place feels inhabited. The main character stands at least 55 % of the plate height. Nothing is cut by the frame edge unless it's deliberate. Rule 3 applies to every object in a plate, not one highlight per plate. |
| 4 | In the conversation, the frosted card covers the bottom half of the plate and cuts Herr Weber off at the waist. | The plate becomes a band at the top of the conversation, about 200 px tall at 390 px wide, cropped so the partner is fully visible from the knees up. The chat scrolls under it, and the band shrinks to 120 px once the learner scrolls. The twist sticker pops onto the band. No card ever cuts a character. |
| 5 | Everything is blue: a blue apple, blue cups. Food reads wrong. | Decided: art may use natural colour for food, drink and plants, at low chroma, through 4 new tokens: `--il-leaf` (muted sage), `--il-fruit` (muted brick), `--il-wood` (coffee brown), `--il-butter` (pale butter). They stay clearly softer than the UI's die/das/correct/near-miss colours, and never appear on a choice button or a gender plate. Everything else stays in the blue strata. |
| 6 | The Done screen shows 10 of 14 words as letter boxes ("H", "GT", "s") that look like broken placeholders. | No initials anywhere. A word without a picture is a word tile: the full word set in Sora 600 on glass, with a small type glyph (a speech bubble for phrases, an arrow for verbs). On the Done screen the learned words are a wrap of chips, with a 28 px picture when there is one. |
| 7 | The ticket icon has no highlight; plates have one highlight in total. | Every object, every icon, one highlight. The art checker (`npm run art`) should flag a file with no `--il-hi`. |

## Polish bar (Brilliant / Duolingo)

- **One thing to do per screen.** One primary button, at the bottom, in thumb reach. Everything else is secondary.
- **Feedback you can feel.** Buttons press down 2 px and spring back. A correct answer gets a short burst and a sound (sound off by default, one toggle). A wrong answer shakes once and shows the fix, never a scolding.
- **The orb is alive.** It bobs slowly in its slot, glances toward whatever the learner should look at, pulses while Protoa speaks, brightens on a correct answer, dims and leans in on a wrong one, and celebrates at the end of a lesson (mood colours as in `shared/brand/README.md`). It's the one futuristic, magical thing on screen; the cast and places stay human.
- **Progress always visible.** Lesson progress bar, words gained, streak, and the next station on the line, each with a small satisfying animation when it moves.
- **Motion.** Springy, short (150–300 ms), purposeful. Everything respects `prefers-reduced-motion`.
- **Desktop is designed, not stretched.** From 1024 px wide, a lesson is two columns: the scene and its art on the left, the interaction on the right, max content width about 1200 px. Today and Practice use a grid, not a long phone column.
- **No dead ends.** Every empty, locked, offline or error state has a spot illustration, one line saying why, and one action.

## Other open questions, decided

- **UI chrome language:** English, as the spec proposes. A German-chrome immersion setting can come later.
- **Who draws the art:** the agents, in SVG, following the drawing rules. The content agent draws the word pictures its lessons need; the ux agent draws plates, cast, icons, stickers and system art.

## Done when

- [ ] Light and dark screenshots of every mockup page look like the same art in a different light, not two different styles.
- [ ] Herr Weber and the barista read as friendly people at 40 px bust size.
- [ ] Each plate shows a recognisable Berlin place with depth and no accidental cut-offs.
- [ ] No letter-box placeholders anywhere.
- [ ] A first-time user on a phone can finish lesson 1 without being unsure what to tap next.

---

# Round 2 (owner review of PR #4, Oct 24, 2026)

The owner's verdict on the merged art: the characters are ugly and bland and need an entire redesign; skin getting darker in dark mode is a bad idea; the type doesn't carry the neo-futuristic look of Protoa and reads as "AI-ish". The whole app must avoid the tells that make a product look AI-generated, in design and in teaching.

## Characters: start over

Herr Weber and the barista from PR #4 are placeholders. Redraw the cast from scratch.

**Process (ux, before drawing the rest):**
1. Make `mockups/cast.html`: Herr Weber and the barista each drawn in **three clearly different style directions** on one sheet (full body, bust at 40 px, and the five moods), light and dark side by side. Post the screenshot in the Team log and ask the owner to pick one by letter.
2. After the pick, redraw both in the chosen style and write the style down in a `## Cast style` section here, so every later character matches.
3. Until the owner picks, keep going with other backlog items; don't block on it.

**What every direction must have:**
- **A silhouette you'd recognise in black.** Each character has a distinct outline: hair shape, height, build, posture, one role prop. No two characters share a body template with a swapped hair colour.
- **Built from simple rounded shapes**, as few as possible, with no pointy or ragged edges. Eyes are geometric (dots or rounded shapes, not realistic ovals). Big, readable expressions from eyebrows and mouth, so a 40 px bust still shows the mood.
- **Personality in the pose.** A weight shift, a hand gesture, a head tilt. Nobody stands straight and symmetrical facing the camera like a mannequin; that's the "bland" the owner means.
- **Clothes carry the colour.** Within the Frosted line palette, vary clothing so a scene has colour and contrast; one accent per character.
- **Skin never changes with the theme.** Character art is identical in light and dark mode: `--il-skin-*` and every fill used on people have **no dark-mode value**. Only plate backgrounds (walls, sky, floor) may dim. This replaces round 1's "fills a little dimmer" for anything on a person.
- Skin tones spread across the cast, with real variety, never one default.

## Typography: one futuristic, consistent type system

Today the app uses Sora for headings, Manrope for text and JetBrains Mono for labels. Manrope is one of the fonts the research names as a default of AI-generated interfaces, and three faces with no clear rule read as unplanned.

- **Sora stays** for the wordmark (it's in the brand files, `shared/brand/`, don't touch) and is the anchor: the type system must feel like it belongs to the "protoa" wordmark.
- **ux builds `mockups/type.html`**: the same three screens (Today, a lesson Words card, the conversation) set in three candidate systems, light and dark, and posts the screenshot for the owner to pick:
  - **A.** Sora for display, Geologica for text.
  - **B.** Funnel Display for display, Funnel Sans for text.
  - **C.** Unbounded for display (big moments only: station names, the Done screen), Sora for headings, Onest for text.
  All are free (SIL OFL) on Google Fonts. Check each has ä ö ü ß, tabular figures, and reads well at 14 px on a phone before putting it on the sheet; swap a candidate out if it fails and say why.
- **Rules, whichever wins:** at most two families, with numbers in tabular figures. Display face for headings, German words and numbers; text face for everything else. Weight and size carry hierarchy. No monospace for decoration: mono only for IPA, if at all. No italic headlines, no gradient text.
- Then apply it across the app as tokens (`--display`, `--text`) and remove the unused faces from the Google Fonts link.

## Don't look AI-made

Research (sources below) lists the patterns that make a product look AI-generated. Seen together, they make it look unplanned.

**The aesthetic and the philosophy stay.** Frosted glass, the orb, the atmospheric ground, one azure accent, light and dark: that's Protoa, and the owner wants it kept. The fixes below are about *finish*, not a new look. Every tell is fixed by doing the existing idea with more care and intent, the way Apple's software does, never by stripping it out. If a fix would make the app look plainer or less premium, it's the wrong fix.

**Visual tells we have today, and the fix:**

| Tell | Where we have it | Fix |
|---|---|---|
| Random colour blobs behind content | The aurora on the ground | Keep the atmospheric ground, but make it deliberate: one light source in the brand's azure (no purple or pink drift), softer and slower, subtle grain against banding, and calmer on screens with dense content. It should read as the light around the orb, not a stock gradient. |
| Generic gradient buttons | The blue "Check" button | Keep the depth and glow, lose the stock look: a near-solid azure with a fine top highlight and a crisp bottom edge, like a lit glass key; a real pressed state (moves down, edge shortens). |
| Glass as decoration | Every block is the same frosted card | Keep glass everywhere it is now, but give it a material hierarchy like Apple's: two or three glass thicknesses (thin for chips and controls, regular for cards, thick for sheets and the action bar), each with a consistent blur, tint, edge highlight and shadow, so depth always means something. |
| Small spaced-out labels above every section | "The conversation · Volkshochschule", "Words you learned", "Station reached" | Drop most of them. A label only where it tells the learner something they need; sentence case, normal tracking. |
| Floating decorative orbs | (not yet) | Our orb is the product's character, never decoration. It sits in its slot and reacts to the learner; nothing else on screen is a floating sphere or blob. |
| Everything centred | Done screen, word cards | Left-align text blocks; centre only single big moments (the word on a card, the stamp). |
| Pure black or white | Black "Continue" button, white surfaces | Keep the ink pane and the light surfaces, tinted toward the anchor ink (`#0b1220`) and the azure, so nothing is flat #000 or #fff. |
| Mixed icon styles, emoji as icons | (watch for it) | One icon set, drawn in the house style; no emoji in the UI. |
| Over-bouncy motion, everything animates | (watch for it) | Short, purposeful motion with ease-out rather than elastic bounce, except the orb's own reactions and the stamp. |
| Generic AI-illustration look | The PR #4 cast | The character redesign above: hand-built shapes, a real point of view. |

**Apple-level detail (the bar for every PR):**
- **One spacing system.** Every gap and padding on a 4 px grid, from a short token scale; nothing eyeballed. Same component, same spacing, on every screen.
- **Continuous corners.** The five radius values only, drawn as smooth (squircle-like) corners where the platform allows, and inner radius = outer radius minus padding when shapes nest.
- **A real type scale.** Each size has its own tracking and line height (tighter for large display, looser for small text), and hierarchy holds on every screen.
- **Optical alignment.** Icons, the orb and text are centred by eye, not by box; glyphs line up with text baselines.
- **Every state designed.** Default, hover, pressed, focused, disabled, loading, empty, error and offline, for every control and screen. Nothing appears without a transition; nothing jumps.
- **Motion with physics.** One spring family for the whole app, interruptible, never linear; transitions show where things came from and went.
- **Light and dark tuned separately.** Dark mode gets its own values for every surface, shadow and highlight, checked by eye, never just inverted.
- **Pixel-precise at 1×, 2× and 3×.** Hairlines are real hairlines, no blurry half-pixel edges, icons drawn to their grid.
- **Accessibility as craft.** Text scales with the system setting without breaking layouts; contrast passes; VoiceOver labels read naturally.

**Copy tells:** no "Let's dive in", "Great job!", "Awesome!", "Unlock", "journey", "seamless", exclamation marks everywhere, or emoji. Praise is specific ("Right: *Sie sind*, formal") or absent. Buttons say exactly what happens ("Check", "Next word"). No invented numbers.

**Teaching tells** (for content, and for prompts in `server/src/apps/deutsch/tasks.js`):
- **Generic situations.** Every lesson happens to *these* people in *this* Berlin, with continuity: Herr Weber remembers your name, the barista knows your order a few lessons later, the course runs on Tuesday mornings. No "a man goes to a shop".
- **Textbook German.** Use what people actually say at A1 level: *Wie geht's?*, *Ich hätte gern …*, *Na?*, *Tschüss*, particles like *mal* and *doch* where natural. Every sentence must be something a Berliner would say.
- **Uneven glosses and translations.** Same word, same gloss, every time; check against earlier lessons.
- **The same exercise template every time.** Vary the step mix within the lesson structure, mix production and recognition, use the twist.
- **Walls of explanation.** Grammar is one short rule, one example from the scene, and the sketch. No bullet-point lectures.
- **Hollow encouragement.** Feedback names the exact form that was right or wrong.

**Sources:** [Hallmark anti-pattern catalogue](https://instagit.com/Nutlope/hallmark/hallmark-anti-patterns-detected.md) · [925 Studios: AI slop design tells](https://www.925studios.co/blog/ai-slop-design-tells) · [925 Studios: spotting generic websites](https://www.925studios.co/blog/ai-slop-web-design-guide) · [Duolingo: shape language](https://blog.duolingo.com/shape-language-duolingos-art-style/) · [Typography defaults in AI design](https://claudeskills.info/zh/skills/curiositech/some_claude_skills/typography-expert/) · [AI-generated exercises can read as generic (Univ. of Turku)](https://www.utupub.fi/items/bcf51d55-ecfd-4aaf-956c-f96d2e553b84/full)

## Round 2 done when

- [ ] The owner has picked a cast style and a type system from the two sheets.
- [ ] Characters look identical in light and dark mode.
- [ ] None of the visual tells in the table above remain on any screen.
- [ ] A lesson's text passes a read-aloud test: nothing a Berliner wouldn't say, no hollow praise.

# Round 3: colour palette (owner pick, Oct 24, 2026)

The owner picked **C · Blaue Stunde** (Berlin at blue hour, the orb's own world) over the old palette and directions A and B. See it with `mockups/palettes.html?p=c` (compare `?p=now`); every mockup page takes `&palette=c`. The values are in `mockups/palettes.css`, under `:root[data-palette="c"]` plus the shared rules at the top.

What changes, and what stays:
- **Stays:** the glass, the orb, azure as the one action colour, the radius and type rules.
- **Ground:** cool blue-white `#e8edfa` in light, deep night blue `#060a24` in dark. No grey.
- **Hero panes** (Today hero, Sprechen hero, chapter banners, "Weiter", tickets, scene captions): ultramarine `#0d1660` to `#2443d6`, with a warm street-lamp glow (`--pane-glow`) in the top corner.
- **Wins and progress:** amber `#ffb85c` (`--ring`) for the goal ring, progress bars and celebration moments. Azure stays for buttons and links; amber never becomes a button colour.
- **Fields behind content:** soft blue (`--field-1`, `--field-2`) behind the primary card and word pictures, with amber and ice-cyan fields (`--field-3`, `--field-4`) to tell neighbouring cards apart. They are tints over glass, never solid blocks.
- **Dark mode never dims the art** (`filter: none` on scene and conversation art).

**Pictures (owner's note):** the art does *not* take the UI palette. Plates, cast and word pictures use colours that suit their subject (a real café's wood and cream, green plants, a yellow U-Bahn, natural food colours, real skin tones), chosen so they stand out against the blue-hour UI without clashing: keep them slightly muted and warm, so they read as lit by the same evening light, never neon and never tinted blue. Skin and clothes are identical in light and dark.

Done when: the app's tokens (`shared/art/tokens.css`, `apps/deutsch/css/*.css`) carry palette C in both themes; Today, a lesson scene, a word card, the conversation and Done match `mockups/palettes.html?p=c` side by side; contrast passes WCAG AA in both themes; no screen still shows the old grey ground.
