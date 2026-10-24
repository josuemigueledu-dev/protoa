# Visual direction: fixes to the Frosted line mockups

Oct 24, 2026 · owner + headmaster

This adds to `docs/specs/visual-spec.md`. Where the two disagree, this file wins. The owner reviewed the mockups on branch `visual-spec-mockups` and kept the idea (frosted glass, the orb, the Frosted line art). What's wrong is the finish: the app should feel as polished as Brilliant or Duolingo, on a phone and on desktop.

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
| 7 | The ticket icon has no highlight; plates have one highlight in total. | Every object, every icon, one highlight. The art checker (`build-art.js`, later `npm run art`) should flag a file with no `--il-hi`. |

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
