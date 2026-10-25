# Night Glass: the app's new look (owner's pick, Oct 25, 2026)

The owner picked this direction after a day of mock-up rounds with the headmaster, and asked for it to be built into the app "effective immediately", with **smoothness and seamless integration above everything: it has to feel polished.** This file is the spec. Where it disagrees with `docs/specs/visual-spec.md` or `docs/specs/visual-direction.md` on the **look** (colour, type, material, the orb's rendering, the cast's style), this file wins. The lesson structure in those specs stays.

## Files

- `prototype/index.html`: a working prototype (Today, one check step, the Done screen) with the motion, glass and orb exactly as approved. Open it in a browser at phone width. **It is the reference for material, motion and the orb.**
- `screens/`: static mock-ups of 8 screens (Today, course map, a check step, speaking, grammar, profile, review, Done) and a close-up of the stop line. **They are the reference for layout and content per screen.** They show solid panels; build them with the prototype's glass.
- `cast/`: the cast in the approved style (Herr Weber, Ana, Lena, Murat) and a lineup. `prototype/ava-*.jpg` are face crops for avatars.
- `prototype/orb.png`: the orb (see below).

## What the owner said (keep these in mind on every screen)

- The **navy top half** of the mock-ups is "the right part of the design, in any picture": the identity. The rest of the screen must carry it, never fade into a bland grey or white app. "Too much white" was the main complaint about earlier rounds.
- Palette: "blueish, greyish, white-greyish cream, with specks of random colour like magenta for contrast". Colour theory inspired by Bungie's Marathon (2026): hard graphic contrast, restrained palette, purposeful accents.
- Glass is back: "slightly transparent looks where the slabs have life". Panels are frosted glass over a living background, not flat cards.
- The orb must "seamlessly pair with the surroundings": no outline, no dark disc, no visible edge of an image. It is clear glass.
- Character art: the approved style is **full-figure, flat, simplified faces, navy and azure with warm window light, risograph grain**, the same world as the lesson scene pictures. Earlier portrait styles were rejected.
- The stop line on Today ("the stops") is a signature element: make it big and rich.
- Avoid anything that looks AI-made: no generic fonts (Inter, Space Grotesk), no purple gradients, no emoji, no sparkle icons.

## Tokens

```
--night:#121a27   --night2:#1f2939   (stage, dark slabs)        --nink:#eef1f4  --ngrey:#a3adbb (text on dark)
--ground:#8e9bab  (blue-grey ground behind the glass)
--glass:rgba(236,233,225,.62)  (grey-cream frosted slab, blur 18px, saturate 1.3, inset 1px white highlight)
--glass-dark:rgba(18,26,39,.72) (dark frosted slab)
--ink:#11151b  --grey:#47505d  (text on cream glass)
--steel:#2c4a74   main action (buttons), text #eef1f4
--magenta:#ff2e88 the speck of colour: streak, current stop, test stop, lesson tag, hazard stripe, Protoa proud
--cyan:#8fd3ff    Protoa talking, names in Protoa's lines, the spark on the line
--pale:#8fb4dc    progress and done stops
--der:#2c5aa8  --die:#d81e6c  --das:#23804f   article colours, everywhere a noun appears
--green:#23804f   correct answer
```

**Light and dark (owner, Oct 25: "make sure to implement a light and dark feature").** Night Glass above is the dark theme. **Day Glass** is the light theme: the same world in daylight, built from the same token names so every component works in both. It follows the phone's setting until the learner picks one (the app's existing `data-theme` override and its Settings toggle). The prototype has both and a toggle (moon button, top right). Day Glass values:

```
--night:#dfe6ee  --night2:#cdd6e1  --nink:#11151b  --ngrey:#4d5867   (the stage becomes pale steel; text dark)
--ground:#c4cdd8
--glass:rgba(252,251,248,.66)  --glass-dark:rgba(240,244,248,.74)
--cyan:#1f86c9  --pale:#5f86b8   (darker so they read on light)
steel, magenta, green and the article colours stay the same
the orb gets a soft shadow under it in light (rgba(44,74,116,.28)); its glass image works on both
```

Never hard-code a colour in a component; take every colour from these tokens, so both themes stay correct. Check every screen in both themes in each PR.

Type: **Krona One** (display: greetings, titles, big numbers; letter-spacing -0.04em) and **Atkinson Hyperlegible** (everything else). Both from Google Fonts; self-host them for offline.

## Material and shapes

- Ground: `--ground` with the lesson's scene picture blurred (14px, 55% opacity) drifting slowly behind, a soft cyan glow under the orb that breathes (7 s), a faint magenta glow lower left, and a faint U-Bahn line drawing near the bottom. The top of the screen fades to `--night` so the stage and the ground are one surface.
- Slabs: frosted glass with **one chamfered corner pair** (top-right and bottom-left, 18px cut), radius 3px elsewhere. A slow light sheen crosses each slab every 9 s.
- Buttons: same chamfer at 12px, steel fill, a square arrow chip on the right.
- Lesson pictures end in a 6px magenta and ink hazard stripe.
- Tab bar: frosted cream glass with a 2px magenta top line; active icon magenta.

## The orb

- Render it from `prototype/orb.png`: a photographed clear glass sphere **with real transparency** (alpha channel). Never use `mix-blend-mode` for it (blending breaks inside transformed views and gave the dark-disc outline the owner disliked).
- The core is a small, tight dot (6% of the sphere) drawn on top in CSS; its hue is the mood: calm `#5d8dff`, talking `--cyan`, proud `--magenta`. Idle: it breathes. Talking: it pulses with a speech-like rhythm while German audio plays. It never becomes a big glow.
- The small white sphere orbits on a tilted ellipse (about 7 s a turn), smaller and dimmer when it passes behind.
- Sizes used: 112 (Today), 58 (riding the stop line), 56 (feedback sheet), 170 (Done).
- Keep `shared/brand/README.md`'s object (glass shell, core whose hue is the mood, orbiter). This is its approved rendering in the app. Ask the headmaster before changing `shared/orb/` or `shared/brand/`.

## Motion (the owner's top priority: smooth and seamless)

- One spring curve for everything: `cubic-bezier(.2,.8,.2,1)`, 450 to 700 ms for screens, 150 ms for presses.
- Screens slide (forward from the right, back to the left) and the tab bar slides away inside a lesson.
- Slabs rise 22px into place on load, staggered by about 100 ms.
- The current stop pings; a light spark runs along the track from your stop to the next one.
- After a lesson, back on Today, **Protoa rides the line to the next stop** (1.4 s), the done stop fills, the counter and streak tick up and the lesson card changes.
- Correct: the button turns green, the word drops into the blank with a small pop, the feedback sheet slides up, the core turns magenta. Wrong: a short shake in magenta, no penalty screen.
- Done: numbers count up, the week fills, a burst of magenta, cyan and white dots leaves the orb.
- Everything respects `prefers-reduced-motion` (no travel, content stays). 60 fps on a mid-range phone: animate only transform and opacity, no layout animation, and keep backdrop blur to the slabs that need it.

## Screens

Follow `screens/` for layout and content; the numbers are only for reference:

1. Today: stage (greeting, sound button, Protoa's line), lesson card (scene picture, character avatar, title, start), the stop line (chapter, x/12, stops with cast faces, review stop, magenta test stop, Protoa riding), words due with der/die/das chips, a story teaser tile.
2. Course map: chapter header with level bar (A1.1 to B1), vertical line of lessons, current lesson as a card with its scene, cast faces per lesson, chapter test.
3. Lesson check step: character figure and speech bubble with sound, the sentence with the blank, a tip from the teacher, four answer tiles, feedback sheet.
4. Speaking: scene picture header, chat with the character, tap-to-translate words, pronunciation and grammar scores, scene goals, mic button with Protoa listening.
5. Grammar: search, today's rule as a dark slab with the conjugation table, topics with progress.
6. Profile: Protoa, name, goal (B1 by date), streak calendar, stats, class (cast faces), settings.
7. Review: flashcards with picture, article colour, sound, example sentence, Leitner boxes.
8. Done: Protoa proud, stats, week, next stop.

Keep the lesson's step structure (scene, notice, words, check, build, conversation, done, plus warm-up, pronunciation and twist). Restyle the steps; don't replace them.

## Art

The scene picture and the cast were made by the headmaster with SDXL on the owner's PC (cloud agents can't run it). Ask in your Team log post or in `docs/curriculum/art-needs.md` for more (each scene, each character pose, word pictures in the same style) and the headmaster will generate and commit them. Until then, reuse what is here.
