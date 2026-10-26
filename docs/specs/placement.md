# Placement test: "Not a beginner?"

Owner, Oct 26 04:59 UTC: a placement test offered on the first run, up to 3 minutes. It samples words and patterns from lessons 1–14, then unlocks up to the first lesson the learner missed. It reuses the exam's item types.

This spec says what the test asks, when it stops, what it changes, and how it is tested. The engine (`startPlacement`, `answerPlacement`, `applyPlacement` in `js/levels.js`) is tested in `server/test/placement.test.js`; the screens (`openPlacementIntro`, `renderPlacement`, route `place`) in `npm run smoke`.

## Who sees it, and where

- **First run.** The "About you" sheet (`onboarding()`, ui.js) gets a second way out under "Save and start": a ghost button **"Not a beginner? Find your lesson · 3 min"**. It saves the profile like "Save and start", then opens the intro sheet below.
- **Until lesson 1 is done.** Lesson 1's preview sheet on the map shows one quiet line under Start: "Know some German already? Find your lesson (3 min)". It goes once the learner finishes any lesson, or after one placement.
- **Not in a lesson, and not offered again** after a placement. A learner who places low can still go ahead with "Start anyway" on any lesson, as today.
- **Works without the AI.** Every item is marked in the page. No Claude call, no network.

## How it runs

The test walks the built-in lessons (`LESSONS`, 1–14 today; new built-in lessons join on their own) in order:

1. Each lesson gets **one gap item**: a sentence from one of its words' examples with the word missing (exam type `gap`, "Lückentext"), with the English line under it.
2. **Right:** on to the next lesson.
3. **Wrong:** one more item from the same lesson, a different word, English → German (exam type `out`, nouns with their article). Right: the lesson is passed, on to the next. Wrong again: the test ends here.
4. **"I don't know"** (a button beside Check) ends the test at that lesson straight away. Guessing is never needed.
5. **3 minutes:** the answer in progress is still marked; then the test ends at the lesson it is on. A thin progress line shows the time left. There is no countdown number.

**The place** is the first lesson not passed. Every lesson before it is unlocked. If every built-in lesson passes, the learner is placed past the last one (the map's "Lesson 15 · soon" stop).

Length: one item per lesson a learner knows, plus two at the end. A complete beginner answers 1 or 2 items. A learner who knows all 14 lessons answers 14 items, in about 2 minutes at 8 seconds an item. 3 minutes is the cap, not the plan.

Why this shape:
- It is a staircase, so nobody sees items far above their level, and nobody sits through items far below it.
- A gap sentence tests a lesson's word and its pattern together (*Du [arbeitest] hier* is lesson 5's verb ending, *Ich brauche eine [Zwiebel]* is lesson 14's noun with its article), so one item per lesson is enough to pass it.
- One miss is not enough to stop. A typo or a slip gets a second chance on another word; two misses in a row mean the lesson is new to them.

## Marking

Exactly like the exam (`markTyped`, now shared by `gradeExam` and the placement test):
- `gap`: the missing word, case and punctuation ignored, umlaut shortcuts (`a:` → ä) applied.
- `out`: the German word or phrase, token by token, with its article for nouns.

No partial credit, no AI. Placing someone too low costs them a few easy lessons. Placing them too high leaves them lost, so it stays strict.

## What placement changes

`applyPlacement(place)`, once, when the learner taps "Start at Lesson N":
- Every built-in lesson before `place` is added to `S.progress.lessonsDone`. The map, Today's line and Grammar's featured unit all follow from that (`currentLessonN`).
- Every word of those lessons becomes the learner's (`learned: true`, `placed: true`). These are words they already knew, so:
  - Their first reviews spread over the next **14 days** (due 1–14 days from today, an interval to match, reps 1). With 14 lessons placed that is about 13 reviews a day for two weeks, not 178 on the first day.
  - Their English → German cards follow the same spread two weeks later (days 15–28). Left empty, `dueCards()` would create them due today for every word with an interval of 4 days or more: placing at Lesson 6 made 49 reviews due on day one.
  - None of them counts as "new today" (`S.progress.days` is not touched), so pace, streaks and the daily goal are not inflated.
  - A word already the learner's (an import, a lesson started) keeps its history.
- `S.progress.placement = { date, place, lessons }` records it, so the offer is not shown again and Profile can say "Placed at Lesson N on <date>".

What it does not do:
- No conversation-line cards. Those come from playing a lesson's conversation, and the learner can "Review again" any lesson.
- No stamps beyond those the lessons-done count earns. `checkStamps()` runs as after any lesson, and its toast reads "N new stamps in your Stempelheft".
- Never passes an exam or skips an exam gate. Placing out of all 14 lessons gives 178 words, far below the A1 gate (600). A test checks this stays true.
- Lesson 0 · Sounds is left as it is (optional either way).

## Screens

Night Glass, built from the exam's parts, so it costs little new CSS:
- **Intro sheet:** "Let's find your lesson." / "About 3 minutes. Answer what you know; tap *I don't know* when you don't. Nothing here is graded." Start · Not now.
- **Item screen:** the exam's item card (`.examword`, `deInput`, umlaut row), with the lesson's station as the eyebrow ("Lesson 5 · " and its station), Check and *I don't know*. A wrong answer shows the right one for 1.2 s, with no shake and no red screen, then the next item.
- **Result screen** (a screen, like the exam's result, so the missed items have room): "Start at Lesson N · <station>", one line on what that means ("Lessons 1–N−1 are marked done. Their <count> words join your reviews over the next two weeks."), and the items missed with their answers. Buttons: **Start at Lesson N** (applies the placement and opens the map on that stop) and **Start from Lesson 1** (applies nothing).
- Leaving mid-test (✕ or the tab bar) drops it, with nothing applied. It is 3 minutes, so it is not saved.

## Tests

In `server/test/placement.test.js`, Claude-free and DOM-free:
- For every lesson k: a learner who knows the lessons before k is placed at k, after exactly one item per lesson passed and two misses.
- Knowing everything places past the last lesson, in one item per lesson.
- "I don't know" ends at that lesson with no second item, and keeps the right answer for the result sheet.
- A miss followed by a right second item passes the lesson.
- The 3-minute cap ends the test at the lesson it is on, and the answer given at the cap counts.
- No word is asked twice in one test, and every item comes from the lesson it tests.
- `applyPlacement`: lessons before the place are done; their words are yours, due in 1–14 days, spread evenly; a word already yours keeps its history; nothing is counted as new today; placing at lesson 1 changes nothing; placing past the end stays below the A1 gate.
- `markTyped` marks like the exam (articles, umlaut shortcuts, case and punctuation).

The screens PR adds a smoke check: first run → "Not a beginner?" → answer lessons 1–5 right and miss lesson 6 twice → the map opens on Lesson 6, with no console errors, at 390 px and 1280 px.

## Open questions for the owner

1. Should the test also be offered later, in Settings ("Find your lesson again"), for someone who skipped it on the first run? The proposal is no: "Start anyway" already lets anyone skip ahead.
