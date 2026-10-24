# A1 coverage plan (Goethe-Zertifikat A1: Start Deutsch 1)

Status: content.js has lesson 1 only (14 words). `COURSE` lists 24 stations, but several of them (opinions, "because, that, if", travel stories) are A2 material. This plan re-sequences the course so that **A1 ends at lesson 30** and A2 starts at 31.

## What Start Deutsch 1 asks for

| Part | Task | What the learner needs |
|---|---|---|
| Hören | 3 parts: short announcements, phone messages, short dialogues | numbers, times, prices, days, names, places; slow, clear speech |
| Lesen | 3 parts: notes and emails, signs and notices, short ads | very short texts about everyday things; signs like *Eingang*, *Ausgang*, *geöffnet* |
| Schreiben | fill in a form; write a short message (about 30 words) | name, address, birthday, nationality; invitation, thanks, apology, a request |
| Sprechen | introduce yourself; ask and answer questions from word cards; make a request or reply to one | self-introduction (name, age, country, city, languages, job, hobby), W-questions, *Können Sie …?*, *Ich möchte …* |

Vocabulary: about 650 words in the Goethe A1 list. Grammar: present tense of regular and common irregular verbs (*sein, haben, fahren, essen, sprechen, nehmen, sehen*), separable verbs, modals (*können, müssen, wollen, möchten*), word order in statements and questions, *nicht* and *kein*, nominative and accusative, definite, indefinite and possessive articles, plural, *es gibt*, prepositions of place and time in fixed phrases, imperative (*Sie*, a little *du*), *Wollen wir …?*. Not in A1: Perfekt (only *war/hatte* as phrases), Dativ as a system, subordinate clauses.

## Where A1 ends

A1 = lessons **1–30**, ten review stops (after every 3rd lesson), five chapters of six. Then the A1 exam. A2 begins at lesson 31 (Perfekt, Dativ, *weil/dass*, comparatives).

## Word budget and the A1 gate

`LANG_LEVELS` in levels.js opens the A1 exam at **600 learned words**. Target: **20 words per lesson × 30 = 600**, plus the extra words in the review stops. Lesson 1 has 14, so its correction pass adds 6 (*Entschuldigung, bitte, danke, Wie geht's?, gut, und*). Rule for the gate: **when the last A1 lesson is written, set the A1 gate to the real number of A1 words, minus about 5 %**, so the exam opens when the lessons are done and not before. Whoever finishes lesson 30 makes that change in the same PR and tells quality (the A1 exam test depends on it). No code change is needed now.

## Lessons, in build order

Each lesson ~20 words, in the new format (see the spec), with a recurring cast: Herr Weber (teacher), the barista at the café near the VHS, and a neighbour. Spanish contrasts are marked ES.

| # | Station | Topic | Grammar | Goethe topics / words | ES contrast |
|---|---|---|---|---|---|
| 1 | Hermannplatz | Greetings | *sein* (ich, Sie), Sie vs du | *Hallo, Guten Tag, Tschüss, Wie geht's?, bitte, danke, Entschuldigung* | *Sie* = *usted* |
| 2 | Görlitzer Bahnhof | People | *sein* all persons, *kommen aus* | countries, languages, nationalities, *Ich heiße* | *soy/eres* vs *bin/bist*; no "de" before country |
| 3 | Mehringdamm | Everyday verbs | regular present, verb in position 2 | *wohnen, arbeiten, lernen, machen, spielen* | subject pronoun is never dropped |
| 4 | Südstern | Questions | W-questions, yes/no questions | *wer, was, wo, woher, wie, wann* | no inverted *¿?* marks; verb first for yes/no |
| 5 | Boddinstraße | Numbers 0–20 | numbers, *Telefonnummer*, age | *eins … zwanzig, Jahre alt* | *einundzwanzig* is "one-and-twenty" |
| 6 | Schönleinstraße | Small words | *nicht, auch, und, aber, oder, sehr, gern* | position of *nicht* | *gern* has no Spanish equivalent |
| 7 | Kottbusser Tor | Food & drink | gender, *ein/eine*, plural | *Brot, Käse, Wasser, Kaffee, Apfel* | der/die/das; *el/la* only partly match |
| 8 | Hermannplatz Café | Ordering | *möchten*, *Ich hätte gern*, accusative | *bestellen, bezahlen, Rechnung, Euro*, numbers 20–100 | *quisiera* ≈ *möchte* |
| 9 | Schönhauser Allee | Home | *es gibt*, *haben*, rooms | *Zimmer, Küche, Miete, Wohnung, Stock* | *hay* = *es gibt* (+ accusative) |
| 10 | Alexanderplatz | Time | clock times, *um*, *von … bis* | *Uhr, halb, Viertel, früh, spät* | *y cuarto* vs *Viertel nach*; *halb drei* = 2:30 |
| 11 | Rosenthaler Platz | Days & weeks | days, months, *am / im* | *Montag … Sonntag, Woche, heute, morgen* | days are masculine; months capitalised |
| 12 | Senefelderplatz | Family | *mein/dein/ihr*, *kein* | *Mutter, Bruder, Kind, verheiratet* | *mi/tu* vs *mein/dein* + ending |
| 13 | Eberswalder Straße | Work & study | professions, *als*, no article | *Beruf, Student, Arzt, Firma, Büro* | no article after *ich bin* + job (like ES) |
| 14 | Zoologischer Garten | Getting around | *fahren, nehmen*, *mit dem* | *Bus, U-Bahn, Fahrkarte, Gleis, Haltestelle* | stem change a→ä |
| 15 | Wittenbergplatz | Directions | *Wo ist …?*, places | *links, rechts, geradeaus, hier, dort* | *a la izquierda* = *links* |
| 16 | Kurfürstendamm | Shopping | accusative, *kosten*, *wie viel* | *Preis, Tasche, Hose, Größe, teuer* | prices read "ein Euro fünfzig" |
| 17 | Kurfürstendamm | Supermarket | quantities | *Kilo, Packung, Flasche, ein bisschen* | *un poco de* = *ein bisschen* |
| 18 | Nollendorfplatz | Body & health | *tut weh*, *haben* | *Kopf, Hand, Arzt, krank, Termin* | *me duele* = *… tut weh* |
| 19 | Bülowstraße | Daily routine | separable verbs | *aufstehen, anrufen, einkaufen, frühstücken* | reflexive verbs come later |
| 20 | Gleisdreieck | Free time | *gern / lieber*, hobbies | *Musik, Sport, Fußball, kochen, Film* | *me gusta* ≠ *gern + verb* |
| 21 | Tempelhof | Weather & seasons | *es regnet*, seasons | *Wetter, Sonne, Regen, kalt, warm, Winter* | *hace frío* = *es ist kalt* |
| 22 | Potsdamer Platz | Can, must, want | *können, müssen, wollen* | modal + infinitive at the end | *poder/deber/querer* |
| 23 | Mohrenstraße* | Invitations | *Wollen wir …?*, imperative | *Party, Einladung, kommen Sie, Treffen* | *vamos a* ≈ *wollen wir* |
| 24 | Hauptbahnhof | Travel | tickets, *von … nach* | *Zug, Reise, Flughafen, Koffer, Verspätung* | |
| 25 | Hauptbahnhof | Hotel | *Zimmer, Nacht*, requests | *Einzelzimmer, Frühstück, Schlüssel* | |
| 26 | Friedrichstraße | Forms & messages | forms, e-mail, *Sie schreiben* | *Adresse, Postleitzahl, Unterschrift, E-Mail* | |
| 27 | Friedrichstraße | Dates & birthdays | ordinal numbers, *am …ten* | *Geburtstag, Datum, Jahr, gratulieren* | |
| 28 | Warschauer Straße | Describing things | predicate adjectives | colours, *groß, klein, neu, alt* | adjectives are not inflected after *sein* |
| 29 | Warschauer Straße | City places | prepositions of place in fixed phrases | *Bank, Post, Apotheke, Supermarkt, Park* | |
| 30 | Oberbaumbrücke | When you get stuck | polite repair phrases | *Wie bitte? Langsamer, bitte. Wie schreibt man das?* | |

\* Mohrenstraße (U2) was renamed Glinkastraße in 2025; use *Glinkastraße* when lesson 23 is built. Station names for 24–30 are provisional; ux owns the final map icons.

Review stops follow lessons 3, 6, … 30. The A1 exam follows the last review.

## Changes to the existing `COURSE`

- Stations 13–24 move down or are re-themed to the table above (lessons 14–30). "Opinions" (old 21) and "Because, that, if" (old 24) move to A2.
- `CHAPTERS` become five chapters of six: 1–6 Ankommen, 7–12 Alltag, 13–18 Unterwegs, 19–24 Freizeit, 25–30 Selbstständig. The edit is made in the first lesson PR that touches lesson 7 or later, with ux told so the map icons follow.

## Build order and tracking

Tick when the lesson is merged. One complete lesson per run.

- [ ] 1 Greetings (correction pass + new format)
- [ ] 2 People
- [ ] 3 Everyday verbs
- [ ] 4 Questions
- [ ] 5 Numbers
- [ ] 6 Small words
- [ ] 7 Food & drink
- [ ] 8 Ordering
- [ ] 9 Home
- [ ] 10 Time
- [ ] 11 Days & weeks
- [ ] 12 Family
- [ ] 13 Work & study
- [ ] 14 Getting around
- [ ] 15 Directions
- [ ] 16 Shopping
- [ ] 17 Supermarket
- [ ] 18 Body & health
- [ ] 19 Daily routine
- [ ] 20 Free time
- [ ] 21 Weather & seasons
- [ ] 22 Can, must, want
- [ ] 23 Invitations
- [ ] 24 Travel
- [ ] 25 Hotel
- [ ] 26 Forms & messages
- [ ] 27 Dates & birthdays
- [ ] 28 Describing things
- [ ] 29 City places
- [ ] 30 When you get stuck
- [ ] 10 review stops, 5 chapter banners
- [ ] A1 exam: `EXAM_TEXTS.A1` and `EXAM_PLAN.A1`, at least 3 sets
- [ ] A1 gate set to the real word count
