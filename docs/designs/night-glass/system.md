# Night Glass: the system

The rules that keep every screen the same app. `README.md` in this folder is the look (tokens, material, the orb, motion); this file is how the pieces are sized and spaced, measured from the app as it is, with what still differs. The design agent keeps it current: each `[design]` PR brings one family of components into line and updates its section here.

Measured at 390×844 and 1280×800, light and dark, on main of Oct 26, 2026.

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

**Slab padding:** 24 px inside a content slab (`.card`), 20 px inside a small slab (`.widget`, `.kpi`, `.mode`, `.scen`). *Still differs:* `.widget` uses 22, `.kpi`, `.mode`, `.scen` and Grammar's dark slab (`.gfeat`) use 18, and the Today and Profile cards mix 20/24 (top/side).

**Between slabs:** 24 px everywhere. *Still differs:* the course map and the Grammar list leave 30 px.

## Type

Two families: **Krona One** for display (titles, big numbers), letter-spacing −0.04em; **Atkinson Hyperlegible** for everything else.

| role | size | font | token |
|---|---|---|---|
| page title | 26 | Krona One | `--t-title` |
| slab title | 22 | Krona One | (h2) |
| small slab title (rail widgets, list headers) | 17 | Krona One | |
| body | 17 | Atkinson 400 | `--t-body` |
| intro line under a page title | 15, `--ngrey` | Atkinson 400 | `--t-sub` |
| caption, eyebrow, meta | 13 | Atkinson (700 for eyebrows) | `--t-cap` |
| German in running text | 20 | Atkinson | `--t-de` |

*Still differs:* slab titles come in five sizes (17, 20, 22, 27, 35 px): the map's chapter header (24 and 35), the Today lesson card (27) and the map's current-lesson card (20) each have their own. Today's greeting is 20 px in a dark slab, where the mock-up (`screens/1-today.jpg`) sets it on the stage at display size.

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

- **Main action:** steel fill, 12 px chamfer, arrow chip on the right (`.btn.go`). *Still differs:* three heights, 64 (Today's Start lesson), 56 (map Start), 52 (Practice's Review now, Settings). Rule to adopt: 56 px for a screen's one main action, 52 for any other filled button.
- **Secondary:** `.btn.ghost`, same heights as filled.
- **Small:** `.btn.ghost.sm`, 44 px tall (the smallest tap target), 13 px text. Back chips and in-slab links use it.
- **Danger:** `.btn.danger` (not in the CSS yet): `--red` fill, `--on-status` text. Settings' reset button uses `var(--bad)`, which no stylesheet defines, so its text is unreadable (raised on #188).

### Settings rows

A label is one short line; anything that explains it goes under the control as a `.faint` line (as the microphone note does). Labels with a bracketed explanation wrap to two lines and make the rows uneven.

## Motion

One spring, `cubic-bezier(.2,.8,.2,1)`; screens 450–700 ms, presses 150 ms. Only `transform`, `translate` and `opacity` animate. Every `[design]` PR that touches something that moves reports frame times: rAF intervals at 390 px with a 4× CPU throttle in Chromium.

## Next families to bring into line

In this order, one per `[design]` PR:

1. Slab padding (24 content, 20 small) and the 24 px rhythm on the map and the Grammar list.
2. Main button heights (56 / 52).
3. Slab title sizes (22 / 17), with Today's lesson card and the map's cards.
4. Today's greeting on the stage (needs the owner's eye: it is the first screen).
