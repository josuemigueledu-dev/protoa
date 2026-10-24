# A1 coverage plan (Goethe-Zertifikat A1: Start Deutsch 1)

Status: content.js has lessons 1–9. The first plan had 30 lessons of about 20 words; the owner capped a lesson at 14 words, so every topic is now two lessons and **A1 ends at lesson 60**. A2 starts at 61.

## What Start Deutsch 1 asks for

| Part | Task | What the learner needs |
|---|---|---|
| Hören | 3 parts: short announcements, phone messages, short dialogues | numbers, times, prices, days, names, places; slow, clear speech |
| Lesen | 3 parts: notes and emails, signs and notices, short ads | very short texts about everyday things; signs like *Eingang*, *Ausgang*, *geöffnet* |
| Schreiben | fill in a form; write a short message (about 30 words) | name, address, birthday, nationality; invitation, thanks, apology, a request |
| Sprechen | introduce yourself; ask and answer questions from word cards; make a request or reply to one | self-introduction (name, age, country, city, languages, job, hobby), W-questions, *Können Sie …?*, *Ich möchte …* |

Vocabulary: about 650 words in the Goethe A1 list. Grammar: present tense of regular and common irregular verbs (*sein, haben, fahren, essen, sprechen, nehmen, sehen*), separable verbs, modals (*können, müssen, wollen, möchten*), word order in statements and questions, *nicht* and *kein*, nominative and accusative, definite, indefinite and possessive articles, plural, *es gibt*, prepositions of place and time in fixed phrases, imperative (*Sie*, a little *du*), *Wollen wir …?*. Not in A1: Perfekt (only *war/hatte* as phrases), Dativ as a system, subordinate clauses.

## Where A1 ends

Owner rule: **a lesson has 10–14 new words, never more.** Each of the 30 topics below (about 20–24 words) is therefore **two lessons** of 10–14 words, part 1 and part 2. A1 = lessons **1–60**, five chapters of twelve lessons (six stations). Then the A1 exam. A2 begins at lesson 61 (Perfekt, Dativ, *weil/dass*, comparatives).

On the course map each station holds two lessons (`COURSE` in content.js has 60 entries; the two lessons of a topic share the station name and carry `part: 1|2`). Review stops fall after every 4th lesson (two topics, `REVIEW_EVERY = 4`), 15 in A1. The second lesson of a topic opens with a warm-up that reviews the first.

## Word budget and the A1 gate

`LANG_LEVELS` in levels.js opens the A1 exam at **600 learned words**. 60 lessons × 10–14 words is 600–840, so the gate stays at 600 as long as the average stays at 10 or more. Rule for the gate: **when the last A1 lesson is written, set the A1 gate to the real number of A1 words, minus about 5 %**, so the exam opens when the lessons are done and not before. Whoever finishes lesson 60 makes that change in the same PR and tells quality. Current count: lessons 1–8 = 97 words.

## Topics, in build order

Each topic is taught in two lessons (n = 2k-1 and 2k) of 10–14 words, in the new format, with the recurring cast: Herr Weber (teacher), Ana and Lena (classmates), the barista at the café. Spanish contrasts are marked ES. Stations: lesson 8 uses Karl-Marx-Straße (a real U7 stop near the café scene); topic 23 uses Anton-Wilhelm-Amo-Straße (formerly Mohrenstraße, renamed August 2025).

| Topic | Lessons | Station | Part 1 | Part 2 | Grammar | ES contrast |
|---|---|---|---|---|---|---|
| 1 | 1–2 | Hermannplatz | Greetings | Your name | formal vs informal greetings; *sein* (ich, Sie) | *Sie* = *usted* |
| 2 | 3–4 | Görlitzer Bahnhof | Who is who | Countries and languages | *sein* all persons, *kommen aus*, no article before countries | pronoun never dropped; *de México* vs *aus Mexiko* |
| 3 | 5–6 | Mehringdamm | Verbs for living (*wohnen, arbeiten, lernen*) | Verbs for doing (*machen, spielen, trinken*) | regular present, verb in position 2 | subject pronoun is never dropped |
| 4 | 7–8 | Südstern | Question words | Yes, no and answers | W-questions, yes/no questions | no inverted *¿?*; verb first for yes/no |
| 5 | 9–10 | Boddinstraße | Numbers 0–10 | Numbers 11–20, phone numbers, age | *Jahre alt* | *einundzwanzig* = "one-and-twenty" |
| 6 | 11–12 | Schönleinstraße | Joining words (*und, aber, oder, auch*) | *nicht, sehr, gern* | position of *nicht* | *gern* has no Spanish equivalent |
| 7 | 13–14 | Kottbusser Tor | Drinks | Food | gender, *ein/eine*, plural, accusative intro | der/die/das vs *el/la* |
| 8 | 15–16 | Karl-Marx-Straße | Ordering (*möchten, ich hätte gern*) | Paying, numbers 20–100, prices | *möchten* | *quisiera* ≈ *möchte* |
| 9 | 17–18 | Schönhauser Allee | Rooms | Furniture, *es gibt* | *es gibt* + accusative, *haben* | *hay* = *es gibt* |
| 10 | 19–20 | Alexanderplatz | The clock | Times of day | *um*, *von … bis* | *y cuarto* vs *Viertel nach*; *halb drei* = 2:30 |
| 11 | 21–22 | Rosenthaler Platz | The week | The months | *am / im* | days masculine; months capitalised |
| 12 | 23–24 | Senefelderplatz | Close family | My family | *mein/dein/ihr*, *kein* | *mi/tu* vs *mein/dein* + ending |
| 13 | 25–26 | Eberswalder Straße | Jobs | Study and office | professions, no article | no article after *ich bin* + job (like ES) |
| 14 | 27–28 | Zoologischer Garten | Vehicles (*fahren, nehmen*) | Tickets and stops | *mit dem* as a phrase | stem change a→ä |
| 15 | 29–30 | Wittenbergplatz | Asking the way | Places on the way | *Wo ist …?* | *a la izquierda* = *links* |
| 16 | 31–32 | Kurfürstendamm | Clothes | Prices and sizes | accusative, *kosten* | prices read "ein Euro fünfzig" |
| 17 | 33–34 | Uhlandstraße | Quantities | The shopping list | *Kilo, Packung, Flasche* | *un poco de* = *ein bisschen* |
| 18 | 35–36 | Nollendorfplatz | The body | At the doctor | *tut weh* | *me duele* = *… tut weh* |
| 19 | 37–38 | Bülowstraße | Morning | Evening | separable verbs | reflexives come later |
| 20 | 39–40 | Gleisdreieck | Hobbies | Sport and music | *gern / lieber* | *me gusta* ≠ *gern + verb* |
| 21 | 41–42 | Tempelhof | Weather | Seasons | *es regnet* | *hace frío* = *es ist kalt* |
| 22 | 43–44 | Potsdamer Platz | Can | Must and want | *können, müssen, wollen* | *poder/deber/querer* |
| 23 | 45–46 | Anton-Wilhelm-Amo-Straße | Inviting | Accepting and declining | *Wollen wir …?*, imperative | *vamos a* ≈ *wollen wir* |
| 24 | 47–48 | Hauptbahnhof | By train | At the airport | *von … nach* | |
| 25 | 49–50 | Zoologischer Garten | Booking a room | At the hotel | polite requests | |
| 26 | 51–52 | Friedrichstraße | Forms | Messages | *Sie schreiben*, e-mail | |
| 27 | 53–54 | Spittelmarkt | Dates | Birthdays | ordinal numbers, *am …ten* | |
| 28 | 55–56 | Warschauer Straße | Colours | Big, small, old, new | predicate adjectives | not inflected after *sein* |
| 29 | 57–58 | Moritzplatz | Public places | Shops and services | prepositions of place in fixed phrases | |
| 30 | 59–60 | Schlesisches Tor | Please repeat | Spelling and understanding | repair phrases (*Wie bitte? Langsamer, bitte.*) | |

Station names for 24 onwards are provisional; ux owns the final map icons. Lessons 25–60 use icons that already exist; ux may draw better ones.

## Changes to the existing `COURSE`

- Done in the split PR: `COURSE` has 60 entries (two per station), `CHAPTERS` are five of twelve (1, 13, 25, 37, 49), `REVIEW_EVERY` is 4. Lesson 1 (21 words) and lesson 2 (23 words) were each split in two, so the old lesson 3 (everyday verbs) is now lessons 5–6, and so on.
- "Opinions" and "Because, that, if" are A2 and not in this list.
- Saved progress keyed to the old lesson numbers is not migrated (nothing is deployed yet).

## Build order and tracking

Tick when the lesson is merged. One complete lesson per run.

- [x] 1 Greetings
- [x] 2 Your name
- [x] 3 Who is who
- [x] 4 Countries and languages
- [x] 5 Verbs for living
- [x] 6 Verbs for doing
- [x] 7 Question words
- [x] 8 Yes, no and answers
- [x] 9 Numbers 0–10
- [ ] 10 Numbers 11–20
- [ ] 11 Joining words
- [ ] 12 Not and very
- [ ] 13 Drinks
- [ ] 14 Food
- [ ] 15 Ordering
- [ ] 16 Paying
- [ ] 17 Rooms
- [ ] 18 Furniture and es gibt
- [ ] 19 The clock
- [ ] 20 Times of day
- [ ] 21 The week
- [ ] 22 The months
- [ ] 23 Close family
- [ ] 24 My family
- [ ] 25 Jobs
- [ ] 26 Study and office
- [ ] 27 Vehicles
- [ ] 28 Tickets and stops
- [ ] 29 Asking the way
- [ ] 30 Places on the way
- [ ] 31 Clothes
- [ ] 32 Prices and sizes
- [ ] 33 Quantities
- [ ] 34 The shopping list
- [ ] 35 The body
- [ ] 36 At the doctor
- [ ] 37 Morning
- [ ] 38 Evening
- [ ] 39 Hobbies
- [ ] 40 Sport and music
- [ ] 41 Weather
- [ ] 42 Seasons
- [ ] 43 Can
- [ ] 44 Must and want
- [ ] 45 Inviting
- [ ] 46 Accepting and declining
- [ ] 47 By train
- [ ] 48 At the airport
- [ ] 49 Booking a room
- [ ] 50 At the hotel
- [ ] 51 Forms
- [ ] 52 Messages
- [ ] 53 Dates
- [ ] 54 Birthdays
- [ ] 55 Colours
- [ ] 56 Big, small, old, new
- [ ] 57 Public places
- [ ] 58 Shops and services
- [ ] 59 Please repeat
- [ ] 60 Spelling and understanding
- [ ] 15 review stops (after lessons 4, 8, … 60), 5 chapter banners
- [ ] A1 exam: `EXAM_TEXTS.A1` and `EXAM_PLAN.A1`, at least 3 sets
- [ ] A1 gate set to the real word count
