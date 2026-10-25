# Art needs (content requests, ux draws)

Content lists the plates, cast and stickers its lessons need. ux draws them; until a file is in
`apps/deutsch/art/manifest.json`, the id renders empty and the lesson still works.

## Word pictures

Concrete nouns in lessons 1–11 that have no picture yet (the word card shows a text tile until one exists).
Abstract words (*Sprache, Frage, Idee, Zahl* …) stay without one. Night Glass style; natural low-chroma colour for food and drink.

| id | word | lesson | notes |
|---|---|---|---|
| `word.gitarre` | die Gitarre | 6 | Lena's guitar (lesson 10: fifteen years old, so a little worn) |
| `word.fussball` | der Fußball | 6 | a plain black-and-white ball |
| `word.cafe` | das Café | 5 | the café next to the school, front with a cup sign (no name on the sign, story.md names it later) |
| `word.handy` | das Handy | 10 | a phone, screen lit |
| `word.tee` | der Tee | 11 | a glass of tea with the bag's tag over the rim |
| `word.kuchen` | der Kuchen | 11 | one slice of a plain cake (Rührkuchen or Apfelkuchen) |
| `word.test` | der Test | 12 | one A4 sheet with ten numbered lines and a pen; no grade on it |
| `word.milch` | die Milch | 13 | a small café milk jug, white milk, plain steel or white china |
| `word.zucker` | der Zucker | 13 | a few white sugar cubes, or a café sugar shaker |
| `word.saft` | der Saft | 13 | a glass of orange juice, natural muted orange, no logo |
| `word.cola` | die Cola | 13 | a glass bottle of dark cola with a plain red label, no brand or lettering |
| `word.bier` | das Bier | 13 | a glass of pale beer with a thin head (Berlin bar glass, no brand) |
| `word.glas` | das Glas | 13 | an empty plain water glass, so it reads as "glass" and not as water (`das Wasser` already has a picture) |
| `word.tomate` | die Tomate | 14 | two or three small round market tomatoes, natural muted red, green stalks |
| `word.zwiebel` | die Zwiebel | 14 | one brown onion with its papery skin, a dry tip at the top |
| `word.bohne` | die Bohne | 14 | a small heap of dried dark beans (frijoles), not green beans |
| `word.reis` | der Reis | 14 | a small paper bag of white rice, a few grains in front; no lettering |
| `word.kaese` | der Käse | 14 | a wedge of pale yellow cheese with a few small holes |
| `word.ei` | das Ei | 14 | one plain brown egg, lying on its side |
| `word.gemuese` | das Gemüse | 14 | a market crate with mixed vegetables (onion, tomatoes, a leek), muted natural colours |

## Cast

| id | who | first used | notes |
|---|---|---|---|
| `cast.ana` | Ana, student from Mexico City, new in the class | lessons 3–4 | same drawing rules as `cast.weber`: moods neutral, pleased, thinking, amused, surprised; skin identical in light and dark |
| `cast.lena` | Lena, student from Rome | lessons 3–4 | same as above; she sits in the front row in later lessons |
| `cast.stall` | the stall holder at the Maybachufer market, 50s, apron, fast talker; uses *Sie* | lesson 14 | not a recurring character yet; until drawn the conversation shows the line without a face |

Both are recurring classmates (lessons 2 onward). They speak in the conversation step: partner turns
carry `who: 'cast.ana'` / `'cast.lena'`, and a learner turn's reaction carries `rwho`.

## Stickers

| id | what | first used | notes |
|---|---|---|---|
| `event.order` | a tray with two teas and one coffee, set down before anyone ordered | lesson 11 | the twist of lesson 11 (the barista already knows the order); until it is drawn the lesson uses `event.delay`. Lesson 13 uses it too (a cup set down for the learner, *Kaffee mit Milch, ohne Zucker*): until it is drawn lesson 13 has no `twist`; add `twist: { at: 13, event: 'event.order', mood: 'surprised' }` when the file lands |
| `event.test` | Herr Weber's hand putting a test sheet face down on a desk | lesson 12 | the twist of lesson 12 (*Das war nicht schlecht*, conv line 14). Until it is drawn lesson 12 has no `twist`; add `twist: { at: 14, event: 'event.test', mood: 'surprised' }` when the file lands |
| `event.invite` | a hand-written note on a market paper bag: *Samstag, bei mir* | lesson 14 | the twist of lesson 14 (Ana's invitation, conv line 14). Until it is drawn lesson 14 has no `twist`; add `twist: { at: 14, event: 'event.invite', mood: 'surprised' }` when the file lands |
