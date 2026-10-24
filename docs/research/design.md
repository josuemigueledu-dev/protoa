# Design research: how apps get an identity you recognise in one screenshot

Oct 24, 2026 · platform · for the owner's sign-off board and for ux

The owner's note: "the overall design is a bit lacking, I need the app to distinguish itself." This document looks at what makes other apps recognisable, takes an honest look at Protoa's screens today, and proposes five signature ideas only Protoa can own.

**How reliable this is.** Sources were found through web search on Oct 24, 2026. Where a source was thin, the text says so. I could not retrieve screenshots of other products' apps in this environment, so each reference links to the page it came from rather than embedding an image. Anything marked *(secondary)* comes from a blog or summary and should be checked before it is quoted outside the team.

---

## 1. What the distinctive apps do

The pattern across all of them: **recognisability comes from one or two strong, repeated choices, not from polish.** Polish is the entry fee; a signature is what remains when you remove the logo.

### Duolingo: a character who has rules
- Duo was redrawn in 2019 by Johnson Banks so he could show more emotion, with a custom typeface (Feather Bold) whose rounded forms echo the owl, and a palette anchored on "Feather Green" (#58CC02) taken from the mascot. ([Kimp history of the brand](https://www.kimp.io/duolingo-logo/), [Monotype](https://monotype.com/ja/node/3261); secondary)
- Duolingo's own design guide gives Duo behaviour rules: he mostly stands still, opens up and flaps slightly to get attention, and does not talk or make sounds. ([design.duolingo.com/writing/duo](https://design.duolingo.com/writing/duo))
- Signature = **a character with a rulebook**, one saturated colour, a rounded type voice. Tone is playful to unhinged on social channels; the app itself stays calm.
- Lesson for Protoa: the character has to *behave* the same way everywhere. Protoa already has an orb with moods; it needs the same discipline about what it does and never does.

### Brilliant: the interaction is the identity
- Brilliant's own listing stresses visual, interactive lessons with real-time feedback; reviewers credit interactives, sound and haptics. ([App Store listing](https://apps.apple.com/app/brilliant-learn-by-doing/id913335252), [screensdesign showcase](https://screensdesign.com/showcase/brilliant-learn-by-doing))
- Its lessons let you try before you are told the rule. I found no brand case study; the look is a dark, calm ground with one clear diagram per screen (from the showcase screenshots; not a primary source).
- Lesson for Protoa: the signature can be a *kind of exercise* (a manipulable thing on screen), not only a mascot.

### Headspace: one material, one motion
- Third-party breakdowns describe a cream ground, yellow and orange, a soft blob mascot, simple rounded characters with closed eyes, and slow breathing-style motion synced to audio. ([Kombai summary](https://kombai.com/examples/design-systems/headspace-kombai), [Blake Crosley guide](https://blakecrosley.com/de/guides/design/headspace), [motion portfolio](https://mariellesearlywork.format.com/work-headspace); all secondary, and they disagree on whether the blobs are 3D or hand drawn.)
- Lesson: **motion tempo can be the brand.** Slow and eased reads as calm; Protoa's pace should be chosen on purpose, not by default.

### Babbel and Speak: the competitors' current look
- Babbel rebranded in 2023–24 with Koto, keeping its orange, and added a sonic identity ("The Perfect Fifth") with an "Accent Yourself" campaign. ([Babbel press release](https://babbel.com/press/en-us/releases/babbel-unveils-a-bold-new-chapter-a-transformational-rebranding), [Ads of the World](https://adsoftheworld.com/campaigns/accent-yourself))
- Sound is a branding lever in this category and nobody owns a *spoken* identity yet. Protoa is about to get proper voices (see the voices item), so this is open ground.
- I found nothing usable on Speak's visual design this run (the searches returned no relevant page). Its screens are worth a manual look before the sign-off board.

### Apple: material as the signature
- iOS 26's "Liquid Glass" is a translucent material that appears to refract light and responds to movement; Apple says it drew on the rounded, transparent elements of visionOS. ([TechCrunch, Jun 2025](https://techcrunch.com/2025/06/09/apple-redesigns-its-operating-systems-with-liquid-glass/), [Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass), [WWDC25 session 219](https://developer.apple.com/videos/play/wwdc2025/219)). Wikipedia also reports that WWDC 2026 revised it, with less default transparency and a user slider from clear to frosted; I could not confirm that against Apple's own page.
- **Consequence for Protoa:** frosted glass is no longer a differentiator on an iPhone. Every iOS 26 user sees it in system chrome. Protoa's glass will look like "a system app" unless the glass is *about something*: lit from inside by the orb, tinted by the mood, carrying the Berlin night. Glass alone is now table stakes.

### Linear: restraint and a colour system
- Linear moved its theme generator to LCH so equal lightness looks equal across hues, and cut 98 variables per theme to three (base, accent, contrast). Later refreshes dimmed the sidebar, softened borders and reduced icons. ([How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui), [Behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh))
- Lesson: **fewer lines, fewer boxes, a generated colour system.** Protoa's screens today are card-in-card-in-card; Linear's lesson is to let hierarchy come from brightness, not borders.

### Arc and Things: fingerprints and delight
- Arc: a gently lit frame around the window (inspired by theatre scrims), a black-hole opening animation with sound, onboarding that borrows from game-design skill pacing and ends in a personalised card. A founding designer is paraphrased as preferring "fingerprints over consistency" *(secondary newsletter)*. ([Inverse interview](https://www.inverse.com/input/design/the-browser-company-arc-design-interview), [Dive Club summary](https://dive-club.beehiiv.com/p/fingerprints))
- Things 3: the draggable "Magic Plus" button is the one gesture people remember. ([MacStories review](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/)) I found nothing detailed on its animation philosophy.
- Lesson: **one memorable first minute and one signature gesture.** Both are cheap and neither needs more art.

### Monument Valley and Alto's: a world with light
- Alto's Odyssey layers its world with a muted, desaturated background that moves at a different speed from the foreground, takes care over light sources, and reduces everything to its clearest form ("signal over noise"). ([Dice](https://insights.dice.com/2018/02/23/altos-odyssey-winning-mobile-game), [Design Milk](https://design-milk.com/altos-adventure-keeps-simple/))
- Monument Valley's team printed every screen and pinned them on a wall to judge the palette as a whole. ([Creative Bloq](https://www.creativebloq.com/computer-arts/making-monument-valley-71412213))
- Lesson: **depth comes from three things: layered parallax, atmospheric desaturation with distance, and one honest light source.** This is exactly the owner's "depth" brief, and it is mostly maths and palette, not drawing skill.

### Neo-futurist interfaces: what the phrase means in shipped products
- Game HUDs are the best reference. Returnal's UI director describes "gameplay first": remove every distraction, no title screen, critical info always visible. ([PlayStation Blog](https://blog.playstation.com/?p=348960)) Metroid Prime's HUD warps the whole screen to look like it wraps a helmet visor. The Division projects its map as a hologram in the world. ([same PlayStation Blog piece and trend roundup](https://trends.daisyui.com/futuristic-speculative-ui/))
- What these share, and what "neo-futurist" can mean for a learning app: **UI that lives in the scene (diegetic), thin light lines and telemetry-style readouts, depth with parallax, and motion that feels engineered (precise, fast-in, soft-out) rather than bouncy.**
- I found nothing on Destiny or Halo Infinite this run.

---

## 2. Where Protoa looks like everyone else today

Screenshots taken Oct 24 at 390 × 844, main branch.

![Today](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-24/platform-design-current-today.png)
![Course map](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-24/platform-design-current-map.png)
![Practice](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-24/platform-design-current-practice.png)
![Lesson sheet](https://raw.githubusercontent.com/josuemigueledu-dev/protoa/team-media/2026-10-24/platform-design-current-station.png)

(A lesson step and the conversation are not shown here: ux is re-shooting them in the iPhone fixes PR.)

An honest read:

1. **Today is a dashboard of white cards.** A blue banner, a progress card, a "next station" card, a "reviews" card, in a vertical stack. Swap the logo and it could be any habit tracker. Nothing on it is Berlin, and nothing is the orb.
2. **The orb is a small glass bubble parked at the edge, overlapping content** (visible on Today beside the progress bar, on Practice over "Fill the gaps", and on the sheet). The most distinctive thing the product has is shown at 60 px, in the corner, and gets in the way.
3. **The map has the right idea (a U-Bahn line) and under-delivers on it.** Stations are white circles with a pale hand icon; there is no sense of a city, of night, of depth, or of travel. The first four stops repeat two station names ("Hermannplatz", "Görlitzer Bahnhof") with a different lesson each, so the line reads as repetitive.
4. **Practice is a grid of identical frosted tiles** with small blue icons. Faded, low-contrast text, no focal point. It is the most generic screen.
5. **The lesson sheet is a stock bottom sheet** with a sound icon in a white square. Nothing says "Laute" or Berlin.
6. **Every surface is the same material at the same depth**, so nothing is in front of anything. That is why it reads flat despite the glass.
7. **Colour carries no story.** One blue for everything, light and cool. The palette C "Blaue Stunde" (amber warmth against blue) is only a hint at the top of Today.
8. **The type is a clean sans** in different weights. The type system is picked (Unbounded, Sora, Onest) but the screens show it only in places.

In short: *the pieces of the identity exist (orb, glass, blue hour, U-Bahn, cast), but they are used as decoration, not as the structure of the screens.*

---

## 3. Protoa's identity: five signature ideas

Each uses something Protoa already owns. Difficulty is for ux: **S** under a day, **M** a few runs, **L** a larger piece of work.

### A. The orb is the light source ("everything is lit by Protoa")  ·  difficulty M
**Idea.** Treat the orb as the *only* light in the scene. Cards, buttons and words pick up a soft glow and a highlight edge on the side facing the orb; the glow colour is its mood (calm azure, amber on a win, dimmer when you slip). When the orb moves to a new slot, the light on the glass moves with it.
**Changes.** Today, lesson steps, Practice tiles, all glass. It is a CSS-variable job: the orb's position and colour written to `--orb-x`, `--orb-y`, `--orb-hue`; surfaces use them in a gradient highlight and rim.
**Why only Protoa.** It gives the glass a *reason*, which solves the "iOS 26 glass looks the same everywhere" problem from section 1. A screenshot is recognisable by the lighting alone. Cost to watch: paint cost on a throttled phone (the owner already finds the app choppy); use transform and opacity, a few layers, no backdrop blur on every card.

### B. The U-Bahn is the whole course map  ·  difficulty M to L
**Idea.** The course map becomes a *night ride* on a diagram line, seen in parallax: signage-style stations with the real station names, the line glowing, the lit window of a train carrying the orb, Berlin silhouettes at three depths (TV tower, Altbau rooftops, rail viaduct) moving at different speeds as you scroll. Lessons at one station sit as platform "tracks". Finishing a station is arriving: a brief doors-opening transition.
**Changes.** Lessons map (the biggest change), the lesson sheet (a ticket / platform sign instead of a white sheet), and the transition into a lesson. Today's "next station" card becomes a view out of the window.
**Why only Protoa.** Duolingo's path is dots on a road; Babbel's is a list. A U-Bahn line with BVG-style signage is Berlin, a learning metaphor (stops, progress, "next stop") and it fits the existing course structure. Pair it with Alto's three-layer parallax and atmospheric desaturation ([Dice](https://insights.dice.com/2018/02/23/altos-odyssey-winning-mobile-game)). Needs care: BVG's real signage and logo are trademarks, so use the *idea* (yellow-on-dark line badges, station names in a similar clean layout), not a copy of the corporate design. This is a legal question worth a short check before launch.

### C. Blue hour as a living ground  ·  difficulty S to M
**Idea.** The background is Berlin's *blue hour*, and it changes with the learner's local time and progress: dusk-amber at the horizon in the evening, deep blue at night, pale at morning. A few lit windows in far rooftops light up as words are learned (one per ten words). The learner's streak or progress becomes *how many windows are lit* in the skyline.
**Changes.** The app background everywhere, the progress display (instead of a bar), the Done screen. No extra characters, only sky gradients and a skyline silhouette in the existing palette tokens.
**Why only Protoa.** "A city that lights up as you learn" is a progress metaphor nobody else can use. It maps to the palette already chosen (palette C). It also gives each time of day its own screenshot, so reviewers' screenshots look different from one another while still recognisable.

### D. Spoken identity: the voice and the orb's sound  ·  difficulty M
**Idea.** Give the orb a *sound*: a short set of tones (a soft chime on correct, a low hum when it "listens", a rising phrase at the end of a lesson) and make each character's voice distinct (the voices pipeline already planned). Sound off by default, one toggle, as visual-direction asks.
**Changes.** Mostly code and audio, little visual. A small waveform that ripples out of the orb when anyone speaks is the visible part.
**Why only Protoa.** Babbel has a sonic logo ([press release](https://babbel.com/press/en-us/releases/babbel-unveils-a-bold-new-chapter-a-transformational-rebranding)); nobody gives their *characters* distinct voices and a sound for their guide. A spoken-German course is the one place where audio identity is part of the product, not a decoration.

### E. A signature gesture and a signature first minute  ·  difficulty S
**Idea.** One gesture people remember (Things' Magic Plus, Arc's black hole). For Protoa: **hold the orb to listen and speak**: press and hold the orb, it expands and brightens while you speak, and it answers with a ripple that turns green or amber on how close you were. The first minute: the orb wakes from darkness, notices you, and greets you in German with the first word ("Hallo") before any sign-up form.
**Changes.** Onboarding (replaces the "About you" sheet as the first thing), the Sprechen screen, speaking exercises.
**Why only Protoa.** The orb *is* the microphone button. Speaking is what the course is for, and a learner can tell what to do on any screen: talk to the light.

### What I would not do
- A mascot cast in a cartoon style (the owner has rejected this three times).
- Neon gradients and heavy glow as decoration. Neo-futurist, per the references above, is *precision* (thin lines, telemetry readouts, engineered motion), not brightness.
- More cards. Linear's lesson is the opposite: remove borders and let brightness do the hierarchy.

---

## 4. A short note on motion and smoothness

The owner called the app choppy. Two facts from the references matter for the signature ideas above: Returnal's team treats UI as something that must never get in the way of play ([PlayStation Blog](https://blog.playstation.com/?p=348960)), and the Alto-style parallax works because it is cheap (a few layers moving by transform). Ideas A and B should be built so they cost *less* paint than today, not more: fewer blurred layers, one light source drawn once, parallax on transforms only. ux's profiling task decides what is possible.

---

## 5. Recommendation

Do these in this order, with the owner picking from the sign-off board:

1. **A (the orb as light source)** and **C (blue hour ground)** first. They are cheap to try, change every screen at once, and give the glass a reason to exist. Together they make one screenshot recognisable.
2. **B (the U-Bahn night ride)** next, as the course map redesign. It is the biggest visual win and the most Berlin, but also the largest piece of work, so it should come after the lighting system exists.
3. **E (hold the orb to speak, and the orb-wakes-up first minute)** alongside the speaking work.
4. **D (sound identity)** once the voices pipeline lands.

The thread through all five: **Protoa is a light in a Berlin night.** The orb is the light, the U-Bahn is the way through, the blue hour is the place, the voices are the people. If a new screen does not show at least one of those four, it is probably generic.

### Open questions for the owner
- Which two ideas to start with? (Recommended: A and C.)
- OK to use *the idea* of BVG-style signage on the map, with a short trademark check before launch?
- Should sound be on by default for the orb's tones, or off with a toggle (current direction)?
