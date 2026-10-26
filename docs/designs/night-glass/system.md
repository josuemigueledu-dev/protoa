# Night Glass: the system

The rules that keep every screen the same app. `README.md` in this folder is the look (tokens, material, the orb, motion); this file is how the pieces are sized and spaced, measured from the app as it is, with what still differs. The design agent keeps it current: each `[design]` PR brings one family of components into line and updates its section here.

Measured at 390×844 and 1280×800, light and dark, on main of Oct 26, 2026 (slab padding re-measured at 06:00 UTC).

![Every main screen at 390 px, dark: Today, Lessons, Practice, Sprechen, Profile, Grammar, Settings](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-system-sheet-1.png)
![The same in Day Glass](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-system-sheet-2.png)

## Tokens

Colours, fonts, the chamfer and the spring are in `README.md` ("Tokens", "Material and shapes", "Motion") and in the `:root:root:root` block at the top of `css/night-glass.css`; Day Glass overrides them in `css/night-glass-lesson.css`. Never write a colour in a component: take a token, so both themes stay right.

## Spacing

A 4 px grid. The steps in use:

| step | where |
|---|---|
| 4 | icon to its label, chip padding |
| 8 | a page title to its intro line; a label to its control |
| 12 | items inside a row (gap) |
| 16 | the side gutter on a phone; inside a small slab's rows |
| 20 | between slabs inside a lesson (`body.in-lesson .view.stack`) |
| 24 | between slabs on every other screen (`.view.stack`); inside a slab |

**Slab padding (done: `[design]` slab padding).** Two values, set in the "breathing room" block of `css/night-glass.css`:

- **24 px inside a content slab:** a full-width `.card`, Today's stop line (`.card.stopline`) and Grammar's rule of the day (`.gfeat`).
- **20 px inside a small slab:** `.widget` (phone and desktop rail alike), `.kpi`, `.mode`, `.scen`, Today's pair of tiles (`.tduo>.card`) and the map's lesson card (`.kcard`).
- **List rows** (`.listrow`, the rows in Profile, Grammar and Settings) are 20 px top and bottom, 24 px at the sides, and sit **16 px apart** in a list.
- A slab whose picture runs to its edge (Today's lesson card, `.tlesson`) has no padding; its text block inside takes 24.
- *Still differs:* Today's greeting (`.today-hero`, 22/20) waits for its own PR (see Type).

![Slab padding before / after, 390 px dark: stop line, Today's tiles, Grammar's rule, Practice modes](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-slab-padding-1.png)
![The same in Day Glass](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-slab-padding-2.png)

**Between slabs:** 24 px everywhere (20 inside a lesson), the course map included: its line starts 24 px under the chapter header.

## Type

Two families: **Krona One** for display (titles, big numbers), letter-spacing −0.04em; **Atkinson Hyperlegible** for everything else.

| role | size | font | token |
|---|---|---|---|
| hero title (one per screen at most) | 32 at 390 px, 40 from 490 px | Krona One | `--t-hero` |
| in-slab hero (Today's lesson card) | 27 at 390 px, 30 at desktop | Krona One | |
| page title | 26 | Krona One | `--t-title` |
| number in a result row (three across) | 24 | Krona One | (`.kpis.result .num`) |
| slab title | 22 | Krona One | (h2) |
| small slab title | 17 | Krona One | (`.widget h2`) |
| body | 17 | Atkinson 400 | `--t-body` |
| intro line under a page title | 15, `--ngrey` | Atkinson 400 | `--t-sub` |
| caption, eyebrow, meta | 13 | Atkinson (700 for eyebrows) | `--t-cap` |
| German in running text | 20 | Atkinson | `--t-de` |

**Titles (done: `[design]` slab titles).** A title takes its size from what holds it, never from the screen it is on:

- **Page title, 26:** the head of every screen that is not a lesson, the course map's *Lessons* included (it was 24).
- **Slab title, 22:** the title of a content slab (24 px padding): Practice's sets, Profile's slabs, Grammar's rule of the day (`.gfeat .t`, was 24), the exam card at the A1 gate (`.nextcard h2`, was 20).
- **Small slab title, 17:** the title of a small slab (20 px padding) and of a row on the course map: the rail widgets, the map's current-lesson card (`.kcard h2`, was 20; at 22 five lesson names ran to three lines in its 150 px column at 390 px, at 17 every name fits in two) and the chapter rows on the map line (`.kst.kchap .ktx b`, was 18).
- **Hero title (done: `[design]` hero titles), `--t-hero` = `clamp(1.75rem, 8.2vw, 2.5rem)`:** the one big display line a screen may have: the map's chapter header (`.khead h2`, was 35 at 390 px), the Done ticket's station (`.ticket h1`, was a fixed 32, so 32 on a desktop too) and the review card's word (`.rv-de`, was 32.8). All three are now 32 at 390 px and 40 on a desktop. At 390 every station name breaks the same as before (only *Görlitzer Bahnhof* and *Schönleinstraße* take two lines); at 360, *Hermannplatz*, *Mehringdamm* and *Kottbusser Tor* now fit on one line.
- **In-slab hero:** Today's lesson card (`.tlesson h2`, 27 at 390 px, 30 at desktop) stays one step smaller: it sits inside a content slab under a picture, as in `screens/1-today.jpg`.

![Hero titles before / after, 390 px Night Glass: the map head, a review word, the Done ticket](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-hero-titles-1.png)
![The Done ticket at 1280, before / after](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-hero-titles-3.png)
- Big numbers (`.kpi .n`, `.lv b`, `.big`) are 26 like a page title; Today's due count is 32.

![Slab titles before / after, 390 px Night Glass: the map card, Grammar's rule of the day, the map head](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-slab-titles-1.png)
![The same in Day Glass](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-slab-titles-2.png)

*Still differs:* Today's greeting is 20 px in a dark slab (26 at desktop), where the mock-up (`screens/1-today.jpg`) sets it on the stage at display size.

## Components

### Page head (done: `[design]` page heads)

Every screen that is not a lesson opens with the same head on the navy stage:

- optional back chip (`.btn.ghost.sm`, "‹ Profile"), then 24 px;
- optional eyebrow (13 px, 700) right above the title;
- the title, 26 px Krona One, `--nink` (dark text in Day Glass);
- optional intro line 8 px under it: 15 px Atkinson, `--ngrey`, at most 46 characters wide;
- then 24 px to the first slab.

No slab behind the head: the title sits on the stage, as in `screens/5-grammar.jpg` and `6-profile.jpg`. Used by Practice, Sprechen, Profile, Grammar, Method and Lesson 0 · Sounds. *Not yet:* Today (greeting in a dark slab, see Type) and the course map (title inside the chapter header slab).

![Page heads before / after, 390 px dark](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-page-heads-1.png)

### Buttons

- **Arrow button (done: `[design]` arrow buttons):** a screen's one forward action that starts something (Today's Start lesson, the map card's Start). Steel fill, 12 px chamfer, `.btn.go`: **56 px tall**, the square **40 px arrow chip** inset **8 px** from the top, bottom and right, the label **24 px** in. The same size on every screen and in every slab, as in the prototype (54 there, 56 on our 4 px grid).
- **Filled button:** `.btn`, steel fill, **52 px** tall, 24 px at the sides: the lesson's Check / Continue bar, Practice's Review now, Check with Protoa. *Still differs:* the prototype puts the arrow chip on the lesson's last step and the Done screen ("Lektion abschließen →", "Weiter zur nächsten Station →"); ours are plain 52 px buttons in the action bar.
- **Secondary:** `.btn.ghost`, same heights as filled.
- **Small:** `.btn.ghost.sm`, 44 px tall (the smallest tap target), 13 px text. Back chips and in-slab links use it.
- **Danger:** `.btn.bad`: `--red` fill, full width, inside Settings' Danger zone slab (fixed in #188). *Still differs:* `night-glass.css` gives it `color:#fff`, a raw hex; it should be `var(--on-status)` like `base.css`.

![Arrow buttons before / after, 390 px dark: Today's lesson card and the map card](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-arrow-buttons-1.png)

### Result row (done: `[design]` result row)

How a finished lesson or review shows its numbers: `resultRow()` in `map.js`, styled by `.kpis.result` in `night-glass-lesson.css`. The lesson's Done screen and the review summary both use it (before, the review put three bare numbers inside its ticket, centred, the first in magenta, while Done had three slabs under the ticket).

- **Where:** right under the ticket, 20 px below it (the lesson rhythm), before any word slab. The ticket holds the headline, never the numbers.
- **Three even small slabs** in one row at every width (`minmax(0,1fr)`, 12 px apart), each a `.kpi`: 20 px padding, 8 px from number to label. Below 380 px the row tightens to 16 px padding and 8 px gaps, so the widest number still fits at 360.
- **Order:** minutes first, the rate in the middle, the count that grew last: Done is *minutes · first try · new words*, the review *minutes · recalled · cards*.
- **The number:** Krona One **24 px** (one step under the 26 of a two-up `.kpi`: at 26, "100%" is wider than a third of a 390 px phone), `--ink`, tabular. Only `%` (14 px, 2 px in) or a leading `+` sits with it; minutes go in the label ("11 · minutes"), not as "11min".
- **The label:** one line, 13 px Atkinson 800, `--muted` (`.kpi .l`, as on Profile). Keep labels to two short words; "right first time" and "in the lesson" wrapped to two lines and made the slabs uneven.
- **One accent:** the last slab (`.hot`) takes `--red`, the magenta that reads on cream glass. Nothing else in the row is coloured.
- **Motion:** the numbers count up (700 ms, ease-out) once the row is 60 % in view; the Perfekt stamp presses in after. Reduced motion shows the final numbers.

![Result row before / after, 390 px: Done and the review summary](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-result-row-1.png)

### Word slab (done: `[design]` word slab)

The words under a result row: `wordSlab(title, words)` in `map.js`, styled by `.wordslab` in `night-glass-lesson.css`. Done's "Your new words" and the review's "Coming back soon" both use it (before, Done had a 13 px eyebrow over grey word chips and the review a 22 px slab title over small magenta chips with white 11 px text, the "yours" chip, below AA).

- **The slab:** a small slab, 20 px padding, 20 px under the result row (the lesson rhythm).
- **The title:** a small slab title, Krona One 17 px (`.widget h2`, `.kcard h2`), then 12 px to the chips. Short, sentence case, no count.
- **The chips:** word chips (`wordChip()`, `.wchip`), 8 px apart: the word in Krona One 600 at body size, with its 28 px picture or type glyph when it has one, 36 px tall. One chip for every list of words a learner owns; the magenta "yours" chip stays for marking words inside a lesson step, not for a list.
- **Tap:** a chip whose word has a card is a button and opens the word sheet, with the 150 ms press (`scale(.96)`). A missed sentence has no card, so it is a plain chip (on main it opened a "No card yet" toast).

![Word slab before / after, 390 px dark: Done and the review summary](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-word-slab-1.png)
![The same in light](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-word-slab-2.png)
![At 1280](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-word-slab-3.png)

### Sheet head (done: `[design]` sheet heads)

Every sheet (`openSheet()` in `map.js`, plus the word sheet and About you) opens the same way at its top edge:

- **The grab:** 44×5, 12 px under the top edge, centred, on every sheet that can be pulled down (`openSheet`). The word sheet has none (it can't be dragged) and About you has none (it closes with its buttons).
- **The close button:** 40×40 (`.icon-btn.sm.close`), 16 px from the top and the right. Its centre line, 36 px down, is the head's line.
- **A titled sheet** (Search words, Keyboard shortcuts, About you): the title is a slab title, Krona One 22, left, **24 px under the top edge**, so it sits on the close button's line, and it stops **40 px** short of the right padding so a long title never runs under the button. An intro line under it is a page head's intro: 15 px, 8 px under the title, at most 46 characters (About you's was 13 px, right under). Then the sheet's 16 px gap to the first control. (Search and Shortcuts had the title 41 px down, 17 px under the close button's line.)
- **A preview sheet** (a lesson, a review stop, the exam, Laute, "Not a beginner?"): centred, the 120 px picture, then the eyebrow (13 px, 700) **4 px** over the title (26 px, Krona One), the line under the title **8 px** below it, then 16 px to the rest. The eyebrow, title and line read as one block, as on a page head (16 and 16 before).

![Titled sheets before / after, 390 px dark: Search, Keyboard shortcuts, About you](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-sheet-heads-1.png)
![Preview sheets before / after, 390 px dark: a lesson, Not a beginner?, the A1 exam](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-26/design-sheet-heads-2.png)

### Settings rows

A label is one short line; anything that explains it goes under the control as a `.faint` line (as the microphone note does). Labels with a bracketed explanation wrap to two lines and make the rows uneven.

## Motion

One spring, `cubic-bezier(.2,.8,.2,1)`; screens 450–700 ms, presses 150 ms. Only `transform`, `translate` and `opacity` animate. Every `[design]` PR that touches something that moves reports frame times: rAF intervals at 390 px with a 4× CPU throttle in Chromium.

## Next families to bring into line

In this order, one per `[design]` PR:

1. ~~Slab padding (24 content, 20 small) and the 24 px rhythm on the map.~~ Done.
2. ~~Arrow button size (56, 40 px chip).~~ Done.
3. ~~Slab title sizes (22 / 17), with the map's cards.~~ Done.
4. Today's greeting on the stage (needs the owner's eye: it is the first screen).
5. ~~One clamp for the hero titles (`--t-hero`).~~ Done.
6. ~~One result row: the Done screen's cards and the review summary.~~ Done.
7. ~~The word slab under a result: one heading and one chip for Done's "Your new words" and the review's "Coming back soon".~~ Done.
8. ~~The intro line under a page title.~~ Already in line: re-measured at 12:20 UTC Oct 26, every page head (Practice, Sprechen, Profile, Grammar, Method, Laute) has its intro 8 px under the title, 15 px, at 390 and 1280.
9. ~~The cast reaction slip (#213) onto the bubble's padding and tokens.~~ Done by ux in #218.
10. ~~Sheet heads.~~ Done.
11. Grammar tables (`.conj`): the label and the German on one baseline (`align-items:baseline`), a wrapped German line at `line-height:1.35`, rows 8 px apart (review on #222).
12. Chips: the lesson preview's "already yours: 12" is white text on magenta (the old "yours" chip, below AA) and its "done" chip drops to a line of its own; the facts under a preview sheet, a review stop and the exam should be one chip style.

Seen while measuring, for ux: on Today's stop line at 390 px, a long current-stop label ("Numbers 0–10", bold) runs into the next stop's label ("Numbers 11–20"); it does on main too.
