# UI copy: which language where

One rule for every screen, from `visual-spec.md` ("UI language") and the owner's fix in `visual-direction.md` ("UI chrome language: English"). Use it for every new label, button, toast and empty state.

## English: everything that tells the learner what to do or what something is

Tab names, screen and section titles, buttons, labels on the stop line, stats, dates, toasts, empty states, errors, settings, aria labels.

- Lessons are "Lesson 4", chapters "Chapter 1", the exam "A1 exam", the review boxes "Box 3".
- Buttons say what happens: "Start lesson", "Check", "Next", "Continue", "Submit". Not "Weiter".
- Dates read "22 Feb 2027" (and "8 Dec" in the current year), from `fmtDate()` in levels.js. Never a raw `2026-10-25`.
- Numbers: "1,200 words", "90%" (no space before %), "+13 days".
- No hollow praise, no exclamation marks, no emoji (`visual-direction.md`, "Copy tells").

## German: the world and the language being learned

Always with the English beside it, under it, or one tap away.

1. **What people say.** Protoa's lines and the cast's lines (Today's greeting, the prompt above a review card, a lesson's conversation), each with its English line.
2. **Names in the world.** Station and place names, lesson titles (*Begrüßung*), chapter names (*Ankommen*), review stop titles (*Wiederholung*, *Kapiteltest*), a scene's caption (*Raum 2.04 · Dienstag, 9:00*), the stamps' own text. Each title has an English subtitle.
3. **Two product names:** *Sprechen* (the conversation mode) and *Stempelheft* (the stamp book). Used as names inside English sentences: "3 new stamps in your Stempelheft".
4. **The exam's rubric.** Inside a running exam the section names follow Start Deutsch 1: *Prüfung, Hören, Lesen, Schreiben, Sprechen, Teil, Aufgabe*. The instructions under them are English, and so are the exam's buttons and the screens before and after it.
5. **The words being learned**, everywhere they appear.

Anything German gets `lang="de"` (for the voice and screen readers); English chrome around it does not.

A German-chrome setting for immersion can come later (`visual-direction.md`); until then, this is the rule.
