# Art needs (content requests, ux draws)

Content lists the plates, cast and stickers its lessons need. ux draws them; until a file is in
`apps/deutsch/art/manifest.json`, the id renders empty and the lesson still works.

## Cast

| id | who | first used | notes |
|---|---|---|---|
| `cast.ana` | Ana, student from Mexico City, new in the class | lessons 3–4 | same drawing rules as `cast.weber`: moods neutral, pleased, thinking, amused, surprised; skin identical in light and dark |
| `cast.lena` | Lena, student from Rome | lessons 3–4 | same as above; she sits in the front row in later lessons |

Both are recurring classmates (lessons 2 onward). They speak in the conversation step: partner turns
carry `who: 'cast.ana'` / `'cast.lena'`, and a learner turn's reaction carries `rwho`.

## Stickers

| id | what | first used | notes |
|---|---|---|---|
| `event.order` | a tray with two teas and one coffee, set down before anyone ordered | lesson 11 | the twist of lesson 11 (the barista already knows the order); until it is drawn the lesson uses `event.delay`. Later callbacks: lesson 13 (he knows the learner's order) |
