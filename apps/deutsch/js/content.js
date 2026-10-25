/* ============================================================
   WEG — CONTENT & CONVENTIONS (read before adding a lesson)
   ------------------------------------------------------------
   Each lesson is its own file, js/lessons/NN.js: LESSONS.push({...}) plus, if it teaches a rule,
   GRAMMAR.push({...}). Add the <script> tag in index.html (a test fails if you forget).
   Lesson data shape (every later lesson copies Lesson 1 exactly):
   {
     n, title (English), theme (German), scene:{id, place, time, cap, intro:[...]},
     notice:{de, g, q, note, grammar},  can:"...",
     words:[{de, en:[...], type:'n'|'v'|'adj'|'adv'|'prep'|'phrase'|'interj'|'conj'|'pron' (numbers use 'adj'),
             g:'m'|'f'|'n' (nouns), pl, ipa, resp (stressed syllable in CAPS), syl (split with ·),
             ex (word in [brackets]), exEn, exG, pic (illustration id, optional),
             forms:{ich,du,er,wir,ihr,Sie} (verbs, optional)}],
     build:[{type:'tiles'|'gap', de, en, g, gaps:[tokenIndex...], extra:[distractor tiles]}],
     conv:[ {w:"German line", g:"gloss", mood:'neutral'|'pleased'|'thinking'|'amused', react?}
          | {l:true, de, en, g, type:'tiles'|'gap'|'translate'|'free', gaps:[...], extra:[...],
             alts:[...accepted alternatives], optional:true (dropped in short mode), react:"one-line German reaction=gloss"} ],
     lex:{verbs:{lemma:{ich,du,er,wir,ihr,Sie}}, nouns:{Noun:'m'|'f'|'n'}, related:{wrong:'right'}, sep:{aufstehen:['stehe','auf']}}
   }
   GLOSS FORMAT: "Guten Tag=hello | Herr=Mr | Weber=Weber". Spans may cover several words
   (fixed phrases). Punctuation stays attached to the German span. Particles in parentheses.
   Meaning in context, never dictionary sense. Coverage check (checkGlosses) runs at load.
   PLACEHOLDERS: {name} {city} {field} filled from the profile (defaults below).
   ART (Frosted line, see docs/specs/visual-spec.md and visual-direction.md): pictures are SVG
   files named in apps/deutsch/art/manifest.json, never inline. Ids: plate.*, cast.*, word.*,
   event.*, mouth.*. Fills are --il-* tokens (no hex), one --il-hi highlight per object, art
   never inverts in dark mode. Content picks ids, ux draws plates/cast (docs/curriculum/art-needs.md).
   NEW FIELDS (lesson 1 is the model): scene.plate + scene.cast:[{id,x}] (x on the 1600-wide plate);
   words[].pic (concrete nouns; short key of PICS now, 'word.*' id once art.js is in the app);
   notice.sketch:{type:'swap'|..., from, to}; sound:{focus, mouth, say, words:[[de,en]...]};
   SPEAKERS: a partner turn has who:'cast.*' (default 'cast.weber'); a learner turn's react is spoken
   by rwho:'cast.*' (default the previous partner turn's speaker). Every id in who/rwho is in scene.cast.
   twist:{at (index in conv of the partner line that triggers it), event:'event.*', mood:'surprised'};
   warmup:[3-5 earlier word headwords] (absent in lesson 1, nothing to review yet; lesson 2 reviews lesson 1, and so on).
   scene.id stays until the app reads scene.plate. 10–14 new words per lesson, never more; a topic of ~24 words is two lessons (coverage.md).
   TEACHING RULES (visual-direction.md, "Don't look AI-made"): the same people in the same Berlin,
   with continuity between lessons (Herr Weber, Tuesday 9:00, room 2.04); what Germans really say
   (Wie geht's?, Kein Problem, Bis Dienstag); one gloss per word, reused; one short grammar rule;
   mix production and recognition; no hollow praise, no emoji, no exclamation marks for effect.
   HINT WORDING: one sentence, names the exact form, German in <em>, Spanish parallel only
   as an extra ("like usted").  AUDIO: VOX index is empty until rendered (see §11); fallback
   speechSynthesis de-DE at rate 0.9.
   ============================================================ */

const DEFAULTS = { name: 'Alex', city: 'Orlando', field: 'Informatik' };


/* ---------- Illustrations (original, one flat style) ---------- */
const PICS = {
  lehrer: `<svg viewBox="0 0 100 100"><rect x="8" y="16" width="84" height="56" rx="4" fill="#2c76b2"/><rect x="13" y="21" width="74" height="46" rx="2" fill="#41868d"/><text x="50" y="42" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-size="13" fill="#f3f8ff" font-style="italic">Guten Tag!</text><path d="M24 52h30" stroke="#f3f8ff" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M24 58h18" stroke="#f3f8ff" stroke-width="2" stroke-linecap="round" opacity=".5"/><rect x="8" y="72" width="84" height="6" rx="2" fill="#235f90"/><rect x="58" y="73" width="14" height="4" rx="2" fill="#f3f8ff"/><rect x="40" y="80" width="20" height="6" rx="2" fill="#2373b5"/></svg>`,
  student: `<svg viewBox="0 0 100 100"><rect x="18" y="14" width="56" height="70" rx="5" fill="#2f5aa9"/><rect x="24" y="14" width="4" height="70" fill="#244584"/><rect x="36" y="26" width="28" height="4" rx="2" fill="#f3f8ff"/><rect x="36" y="36" width="20" height="4" rx="2" fill="#f3f8ff" opacity=".8"/><path d="M70 40l14-14 6 6-14 14z" fill="#88c1f0"/><path d="M70 40l-2 8 8-2z" fill="#84bce9"/><path d="M84 26l6 6 2-2-6-6z" fill="#2373b5"/><rect x="40" y="62" width="30" height="18" rx="3" fill="#f3f8ff"/><rect x="43" y="66" width="8" height="8" rx="4" fill="#88c1f0"/><rect x="54" y="67" width="13" height="2" fill="#2f5aa9"/><rect x="54" y="72" width="9" height="2" fill="#2f5aa9"/></svg>`,
  stadt: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#b9cbec"/><rect x="0" y="70" width="100" height="30" fill="#b2d3ed"/><rect x="6" y="46" width="22" height="26" fill="#f3f8ff" stroke="#2c76b2" stroke-width="1.5"/><path d="M6 46l11-8 11 8z" fill="#2373b5"/><rect x="10" y="52" width="5" height="7" fill="#2f5aa9"/><rect x="19" y="52" width="5" height="7" fill="#2f5aa9"/><rect x="60" y="48" width="30" height="24" fill="#f3f8ff" stroke="#2c76b2" stroke-width="1.5"/><rect x="64" y="54" width="4" height="18" fill="#2c76b2"/><rect x="73" y="54" width="4" height="18" fill="#2c76b2"/><rect x="82" y="54" width="4" height="18" fill="#2c76b2"/><path d="M58 48h34l-4-6H62z" fill="#2c76b2"/><rect x="42" y="30" width="5" height="42" fill="#8796a8"/><circle cx="44.5" cy="28" r="9" fill="#c4d1ea" stroke="#8796a8" stroke-width="1.5"/><rect x="43" y="8" width="3" height="12" fill="#8796a8"/><path d="M38 72h13l-2-6h-9z" fill="#8796a8"/><rect x="0" y="80" width="100" height="6" fill="#2f5aa9" opacity=".6"/></svg>`,
  kaffee: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="80" rx="30" ry="6" fill="#b2d3ed"/><path d="M26 36h44v26a14 14 0 0 1-14 14H40a14 14 0 0 1-14-14z" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><path d="M70 42h8a8 8 0 0 1 0 16h-8" fill="none" stroke="#2c76b2" stroke-width="2.5"/><ellipse cx="48" cy="40" rx="18" ry="4" fill="#235f90"/><path d="M40 20q4 6 0 12M50 18q4 6 0 12" stroke="#8796a8" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
};

/* ---------- Scenes (original flat SVG banners) ---------- */
const SCENES = {
  classroom: `<svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="800" height="350" fill="#b2d3ed"/>
    <rect x="0" y="270" width="800" height="80" fill="#4892ce"/>
    <rect x="0" y="266" width="800" height="8" fill="#2c76b2"/>
    <rect x="520" y="40" width="180" height="150" rx="6" fill="#b9cbec" stroke="#f3f8ff" stroke-width="10"/>
    <rect x="606" y="40" width="8" height="150" fill="#f3f8ff"/><rect x="520" y="112" width="180" height="8" fill="#f3f8ff"/>
    <circle cx="560" cy="80" r="16" fill="#88c1f0"/>
    <rect x="648" y="96" width="6" height="90" fill="#8796a8"/><circle cx="651" cy="92" r="10" fill="#c4d1ea" stroke="#8796a8" stroke-width="2"/><rect x="649" y="70" width="4" height="14" fill="#8796a8"/>
    <path d="M520 170q40-20 90-6 30-10 90 10v20h-180z" fill="#b2d6da"/>
    <rect x="60" y="50" width="380" height="180" rx="6" fill="#2c76b2"/>
    <rect x="72" y="62" width="356" height="156" fill="#41868d"/>
    <text x="100" y="118" font-family="Fraunces,Georgia,serif" font-size="40" font-style="italic" fill="#f3f8ff">Guten Tag!</text>
    <text x="100" y="166" font-family="Fraunces,Georgia,serif" font-size="22" fill="#f3f8ff" opacity=".85">Ich bin … / Sie sind …</text>
    <rect x="60" y="230" width="380" height="10" rx="3" fill="#235f90"/><rect x="300" y="231" width="36" height="8" rx="3" fill="#f3f8ff"/>
    <path d="M740 200v70M730 200h20" stroke="#225884" stroke-width="6" stroke-linecap="round"/>
    <circle cx="745" cy="150" r="30" fill="#f3f8ff" stroke="#07101f" stroke-width="4"/><path d="M745 150v-18M745 150h12" stroke="#07101f" stroke-width="3" stroke-linecap="round"/>
    <rect x="220" y="250" width="280" height="14" rx="4" fill="#62a4da"/><rect x="236" y="264" width="12" height="40" fill="#2c76b2"/><rect x="472" y="264" width="12" height="40" fill="#2c76b2"/>
    <rect x="300" y="236" width="60" height="14" rx="2" fill="#2f5aa9"/><rect x="310" y="232" width="40" height="5" rx="2" fill="#f3f8ff"/>
    <rect x="30" y="200" width="30" height="70" rx="4" fill="#2373b5"/><ellipse cx="45" cy="196" rx="26" ry="18" fill="#49a0a9"/><ellipse cx="34" cy="186" rx="12" ry="14" fill="#5eafb8"/>
  </svg>`,
};

/* ---------- Lesson 0: Sounds ---------- */
const SOUNDS = [
  { k: 'ei', say: 'like English "eye"', ex: [['nein','no'],['mein','my'],['heißen','to be called']] },
  { k: 'ie', say: 'a long "ee"', ex: [['wie','how'],['Sie','you (formal)'],['Wiedersehen','seeing again']] },
  { k: 'eu / äu', say: 'like "oy" in "boy"', ex: [['Freut mich','nice to meet you'],['neun','nine'],['Häuser','houses']] },
  { k: 'au', say: 'like "ow" in "cow"', ex: [['aus','from'],['Haus','house'],['auch','also']] },
  { k: 'w', say: 'an English "v"', ex: [['wie','how'],['Weber','Weber'],['Wasser','water']] },
  { k: 'v', say: 'usually an English "f"', ex: [['vier','four'],['Vater','father'],['viel','much']] },
  { k: 'z', say: '"ts", as in "cats"', ex: [['zehn','ten'],['Zeit','time'],['zu','to']] },
  { k: 'j', say: 'an English "y"', ex: [['ja','yes'],['Jahr','year'],['jetzt','now']] },
  { k: 'sch', say: 'English "sh"', ex: [['schön','beautiful'],['Schule','school'],['Tschüss','bye']] },
  { k: 'st- / sp-', say: '"sht" and "shp" at the start of a word', ex: [['Student','student'],['Stadt','city'],['Sport','sport']] },
  { k: 'ch', say: 'after i/e: a soft hiss ("ich"); after a/o/u: a throaty "kh" ("Buch")', ex: [['ich','I'],['nicht','not'],['Buch','book']] },
  { k: 'ß', say: 'a sharp "ss"; the vowel before it is long', ex: [['heißen','to be called'],['Straße','street'],['groß','big']] },
  { k: 'ä', say: 'like "e" in "bed" (short) or "ai" in "fair" (long)', ex: [['Städte','cities'],['spät','late'],['Käse','cheese']] },
  { k: 'ö', say: 'say "ay" with rounded lips', ex: [['schön','beautiful'],['möchte','would like'],['Köln','Cologne']] },
  { k: 'ü', say: 'say "ee" with rounded lips', ex: [['Tschüss','bye'],['fünf','five'],['über','over']] },
  { k: '-er', say: 'at the end of a word: a relaxed "uh"', ex: [['Lehrer','teacher'],['Weber','Weber'],['aber','but']] },
  { k: 'h', say: 'silent after a vowel; it makes the vowel long', ex: [['Lehrer','teacher'],['sehen','to see'],['Uhr','clock']] },
  { k: 'b / d / g', say: 'at the end of a word they soften to "p / t / k"', ex: [['Tag','day'],['und','and'],['halb','half']] },
];

/* ---------- Lessons and grammar ----------
   Lessons live in lessons/NN.js (one per lesson, loaded right after this file by index.html).
   Each file does LESSONS.push({...}) and, if the lesson teaches a rule, GRAMMAR.push({...}).
   The entries below are stubs for units not written yet; a real entry with the same id replaces its stub
   and core.js sorts everything once at load, so load order never matters. */
const LESSONS = [];

/* ---------- Grammar reference (units grow with the lessons) ---------- */
const GRAMMAR = [
  { id: 'cases', title: 'Cases: nominative and accusative', lesson: 13, stub: 'der becomes den when the noun is the object. Written with the lesson that needs it.' },
  { id: 'sep', title: 'Separable verbs', lesson: 37, stub: 'aufstehen: ich stehe … auf. Written with the lesson that needs it.' },
  { id: 'modal', title: 'Modal verbs', lesson: 43, stub: 'können, müssen, wollen, möchten + verb at the end. Written with the lesson that needs it.' },
  { id: 'perfekt', title: 'Perfect tense', lesson: 61, stub: 'haben/sein + participle at the end. Written with the lesson that needs it.' },
  { id: 'sub', title: 'Subordinate clauses (weil, dass, wenn)', lesson: 70, stub: 'The verb moves to the end. Written with the lesson that needs it.' },
  { id: 'adj', title: 'Adjective endings', lesson: 65, stub: 'ein großer Mann, eine große Stadt. Written with the lesson that needs it.' },
  { id: 'prep', title: 'Prepositions', lesson: 27, stub: 'mit, nach, zu, in, an, auf… Written with the lesson that needs it.' },
];

/* ---------- Method notes ---------- */
const METHOD = [
  { f: 'Spaced repetition (Practice tab)', why: 'You see a word again just before you would forget it. Each correct recall pushes the next review further out; a miss brings it back soon.', src: 'Spacing effect: Ebbinghaus (1885); Cepeda et al. (2006) meta-analysis. The scheduler is SM-2 (Wozniak, 1990), capped at 45 days.', lab: 'est' },
  { f: 'Retrieval practice, not re-reading', why: 'Every review makes you produce the answer before you see it. Recalling strengthens memory far more than looking at the word again.', src: 'Roediger & Karpicke (2006); Karpicke & Blunt (2011).', lab: 'est' },
  { f: 'Building the conversation yourself', why: 'Writing your own lines forces you to notice the gap between what you want to say and what you can say. That gap is where learning happens.', src: 'Output hypothesis: Swain (1985, 1995).', lab: 'est' },
  { f: 'Help only after a mistake; the hint names the problem', why: 'The ladder (meaning → targeted hint → answer) is a prompt, not a correction. Prompts that push you to self-repair lead to more uptake than being handed the right form.', src: 'Lyster & Ranta (1997); Lyster & Saito (2010) meta-analysis.', lab: 'est' },
  { f: 'Illustrations on concrete nouns', why: 'A picture plus a word gives two routes to the memory instead of one.', src: 'Dual coding: Paivio (1971, 1986).', lab: 'est' },
  { f: 'One partner, one city, a story', why: 'Words met inside a scene with a person and a place come back more easily than words met in a list. The scene gives each lesson a hook.', src: 'Narrative and memory: Mar, Li, Nguyen & Ta (2021) meta-analysis; context effects in vocabulary learning (inferred for this specific design).', lab: 'inf' },
  { f: 'Word-by-word glosses under German', why: 'Seeing the meaning of each word in context lets you read real sentences from day one and pick up small words incidentally.', src: 'Hulstijn, Hollander & Greidanus (1996): marginal glosses improve incidental vocabulary learning.', lab: 'est' },
  { f: 'Sentence cards from your own mistakes', why: 'A line you missed in conversation comes back as a review card. The review is personal: it targets what you, specifically, got wrong.', src: 'Error-driven learning; our transfer from conversation to card is our own design choice.', lab: 'spec' },
  { f: 'Difficulty that follows your accuracy', why: 'Conversations lengthen and turns get harder when you are right most of the time, and ease off when you are struggling. The aim is to keep you in the band where effort pays.', src: 'Desirable difficulties: Bjork (1994); adaptive thresholds (85% / 65%) are our own choice.', lab: 'inf' },
  { f: 'Goal set by you, no streak-shaming', why: 'Pressure from an app is a poor substitute for your own reasons. The header shows a number, never a judgement.', src: 'Self-determination theory: Deci & Ryan (2000). Applying it this way is our inference.', lab: 'inf' },
];
/* ---------- Dictionary of the learner's Weg v1 words (lessons 1–8) ----------
   Imported cards reference these by headword, so every imported word gets a full card:
   glossed example, verb forms, gender, and a picture where the word is concrete.
   Same shape as lesson words, plus v1 (the v1 lesson it came from). */
const V1_WORDS = [
  // v1 lesson 1 — greetings
  { de: 'Guten Morgen', en: ['good morning'], type: 'phrase', ipa: 'ˌɡuːtn̩ ˈmɔʁɡn̩', resp: 'GOO·ten MOR·gen', syl: 'Gu·ten Mor·gen', ex: '[Guten Morgen], Herr Weber!', exEn: 'Good morning, Mr Weber!', exG: 'Guten Morgen,=good morning | Herr=Mr | Weber!=Weber', v1: 1 },
  { de: 'Entschuldigung', en: ['excuse me', 'sorry'], type: 'phrase', ipa: 'ɛntˈʃʊldɪɡʊŋ', resp: 'ent·SHUL·di·gung', syl: 'Ent·schul·di·gung', ex: '[Entschuldigung], wo ist der Bahnhof?', exEn: 'Excuse me, where is the station?', exG: 'Entschuldigung,=excuse me | wo=where | ist=is | der=the | Bahnhof?=station', v1: 1 },
  { de: "Wie geht's?", en: ['how are you (informal)', 'how are you'], type: 'phrase', ipa: 'viː ˈɡeːts', resp: 'vee GAYTS', syl: "Wie geht's", ex: "Hallo, Tom! [Wie geht's]?", exEn: 'Hi, Tom! How are you?', exG: "Hallo,=hi | Tom!=Tom | Wie geht's?=how are you", v1: 1 },
  { de: 'Guten Abend', en: ['good evening'], type: 'phrase', ipa: 'ˌɡuːtn̩ ˈaːbn̩t', resp: 'GOO·ten AH·bent', syl: 'Gu·ten A·bend', ex: '[Guten Abend]! Wie geht es Ihnen?', exEn: 'Good evening! How are you?', exG: 'Guten Abend!=good evening | Wie geht es Ihnen?=how are you (formal)', v1: 1 },
  { de: 'Gute Nacht', en: ['good night'], type: 'phrase', ipa: 'ˌɡuːtə ˈnaxt', resp: 'GOO·tuh NAHKHT', syl: 'Gu·te Nacht', ex: '[Gute Nacht], bis morgen!', exEn: 'Good night, see you tomorrow!', exG: 'Gute Nacht,=good night | bis morgen!=see you tomorrow', v1: 1 },
  { de: 'Tschüss', en: ['bye'], type: 'phrase', ipa: 'tʃʏs', resp: 'CHÜSS', syl: 'Tschüss', ex: '[Tschüss], bis bald!', exEn: 'Bye, see you soon!', exG: 'Tschüss,=bye | bis bald!=see you soon', v1: 1 },
  { de: 'ja', en: ['yes'], type: 'part', ipa: 'jaː', resp: 'YAH', syl: 'ja', ex: '[Ja], gern!', exEn: 'Yes, gladly!', exG: 'Ja,=yes | gern!=gladly', v1: 1 },
  { de: 'nein', en: ['no'], type: 'part', ipa: 'naɪ̯n', resp: 'NINE', syl: 'nein', ex: '[Nein], danke.', exEn: 'No, thank you.', exG: 'Nein,=no | danke.=thank you', v1: 1 },
  { de: 'bitte', en: ['please', "you're welcome"], type: 'part', ipa: 'ˈbɪtə', resp: 'BIT·tuh', syl: 'bit·te', ex: 'Ein Wasser, [bitte].', exEn: 'A water, please.', exG: 'Ein=a | Wasser,=water | bitte.=please', v1: 1 },
  // v1 lesson 2 — people
  { de: 'ich', en: ['I'], type: 'pron', ipa: 'ɪç', resp: 'IKH', syl: 'ich', ex: '[Ich] bin Tom.', exEn: 'I am Tom.', exG: 'Ich=I | bin=am | Tom.=Tom', v1: 2 },
  { de: 'du', en: ['you (informal)', 'you'], type: 'pron', ipa: 'duː', resp: 'DOO', syl: 'du', ex: 'Bist [du] Anna?', exEn: 'Are you Anna?', exG: 'Bist=are | du=you (informal) | Anna?=Anna', v1: 2 },
  { de: 'das Kind', en: ['child'], type: 'n', g: 'n', pl: 'die Kinder', ipa: 'kɪnt', resp: 'KINT', syl: 'Kind', ex: 'Das [Kind] ist klein.', exEn: 'The child is small.', exG: 'Das=the | Kind=child | ist=is | klein.=small', pic: 'kind', v1: 2 },
  { de: 'der Freund', en: ['friend (male)', 'boyfriend', 'friend'], type: 'n', g: 'm', pl: 'die Freunde', ipa: 'fʁɔʏ̯nt', resp: 'FROYNT', syl: 'Freund', ex: 'Das ist mein [Freund] Tom.', exEn: 'This is my friend Tom.', exG: 'Das=this | ist=is | mein=my | Freund=friend | Tom.=Tom', pic: 'freund', v1: 2 },
  { de: 'die Freundin', en: ['friend (female)', 'girlfriend', 'friend'], type: 'n', g: 'f', pl: 'die Freundinnen', ipa: 'ˈfʁɔʏ̯ndɪn', resp: 'FROYN·din', syl: 'Freun·din', ex: 'Das ist meine [Freundin] Anna.', exEn: 'This is my friend Anna.', exG: 'Das=this | ist=is | meine=my | Freundin=friend | Anna.=Anna', pic: 'freundin', v1: 2 },
  { de: 'er', en: ['he'], type: 'pron', ipa: 'eːɐ̯', resp: 'AIR', syl: 'er', ex: '[Er] heißt Paul.', exEn: 'He is called Paul.', exG: 'Er=he | heißt=is called | Paul.=Paul', v1: 2 },
  { de: 'sie', en: ['she', 'they'], type: 'pron', ipa: 'ziː', resp: 'ZEE', syl: 'sie', ex: '[Sie] heißt Maria.', exEn: 'She is called Maria.', exG: 'Sie=she | heißt=is called | Maria.=Maria', v1: 2 },
  { de: 'es', en: ['it'], type: 'pron', ipa: 'ɛs', resp: 'ES', syl: 'es', ex: '[Es] ist gut.', exEn: 'It is good.', exG: 'Es=it | ist=is | gut.=good', v1: 2 },
  { de: 'wir', en: ['we'], type: 'pron', ipa: 'viːɐ̯', resp: 'VEER', syl: 'wir', ex: '[Wir] sind Freunde.', exEn: 'We are friends.', exG: 'Wir=we | sind=are | Freunde.=friends', v1: 2 },
  { de: 'ihr', en: ['you all', 'you (plural, informal)'], type: 'pron', ipa: 'iːɐ̯', resp: 'EER', syl: 'ihr', ex: 'Seid [ihr] aus Berlin?', exEn: 'Are you (all) from Berlin?', exG: 'Seid=are | ihr=you (all) | aus=from | Berlin?=Berlin', v1: 2 },
  { de: 'Sie', en: ['you (formal)'], type: 'pron', ipa: 'ziː', resp: 'ZEE', syl: 'Sie', ex: 'Wie heißen [Sie]?', exEn: 'What is your name? (formal)', exG: 'Wie=how | heißen=are called | Sie?=you (formal)', v1: 2 },
  { de: 'der Mann', en: ['man', 'husband'], type: 'n', g: 'm', pl: 'die Männer', ipa: 'man', resp: 'MAHN', syl: 'Mann', ex: 'Der [Mann] heißt Peter.', exEn: 'The man is called Peter.', exG: 'Der=the | Mann=man | heißt=is called | Peter.=Peter', pic: 'mann', v1: 2 },
  { de: 'die Frau', en: ['woman', 'Mrs', 'wife'], type: 'n', g: 'f', pl: 'die Frauen', ipa: 'fʁaʊ̯', resp: 'FROW', syl: 'Frau', ex: 'Das ist [Frau] Klein.', exEn: 'That is Mrs Klein.', exG: 'Das=that | ist=is | Frau=Mrs | Klein.=Klein', pic: 'frau', v1: 2 },
  // v1 lesson 3 — verbs
  { de: 'haben', en: ['to have'], type: 'v', ipa: 'ˈhaːbn̩', resp: 'HAH·ben', syl: 'ha·ben', ex: 'Ich [habe] Zeit.', exEn: 'I have time.', exG: 'Ich=I | habe=have | Zeit.=time', forms: { ich: 'habe', du: 'hast', er: 'hat', wir: 'haben', ihr: 'habt', Sie: 'haben' }, v1: 3 },
  { de: 'verstehen', en: ['to understand'], type: 'v', ipa: 'fɛɐ̯ˈʃteːən', resp: 'fair·SHTAY·en', syl: 'ver·ste·hen', ex: 'Ich [verstehe] das nicht.', exEn: "I don't understand that.", exG: 'Ich=I | verstehe=understand | das=that | nicht.=not', forms: { ich: 'verstehe', du: 'verstehst', er: 'versteht', wir: 'verstehen', ihr: 'versteht', Sie: 'verstehen' }, v1: 3 },
  { de: 'brauchen', en: ['to need'], type: 'v', ipa: 'ˈbʁaʊ̯xn̩', resp: 'BROW·khen', syl: 'brau·chen', ex: 'Ich [brauche] Hilfe.', exEn: 'I need help.', exG: 'Ich=I | brauche=need | Hilfe.=help', forms: { ich: 'brauche', du: 'brauchst', er: 'braucht', wir: 'brauchen', ihr: 'braucht', Sie: 'brauchen' }, v1: 3 },
  { de: 'wohnen', en: ['to live (reside)', 'to live'], type: 'v', ipa: 'ˈvoːnən', resp: 'VOH·nen', syl: 'woh·nen', ex: 'Wir [wohnen] in Berlin.', exEn: 'We live in Berlin.', exG: 'Wir=we | wohnen=live | in=in | Berlin.=Berlin', forms: { ich: 'wohne', du: 'wohnst', er: 'wohnt', wir: 'wohnen', ihr: 'wohnt', Sie: 'wohnen' }, v1: 3 },
  { de: 'sprechen', en: ['to speak'], type: 'v', ipa: 'ˈʃpʁɛçn̩', resp: 'SHPREH·khen', syl: 'spre·chen', ex: 'Ich [spreche] Spanisch und Englisch.', exEn: 'I speak Spanish and English.', exG: 'Ich=I | spreche=speak | Spanisch=Spanish | und=and | Englisch.=English', forms: { ich: 'spreche', du: 'sprichst', er: 'spricht', wir: 'sprechen', ihr: 'sprecht', Sie: 'sprechen' }, v1: 3 },
  { de: 'lernen', en: ['to learn'], type: 'v', ipa: 'ˈlɛʁnən', resp: 'LEHR·nen', syl: 'ler·nen', ex: 'Ich [lerne] Deutsch.', exEn: 'I am learning German.', exG: 'Ich=I | lerne=am learning | Deutsch.=German', forms: { ich: 'lerne', du: 'lernst', er: 'lernt', wir: 'lernen', ihr: 'lernt', Sie: 'lernen' }, v1: 3 },
  { de: 'machen', en: ['to do', 'to make'], type: 'v', ipa: 'ˈmaxn̩', resp: 'MAH·khen', syl: 'ma·chen', ex: 'Was [machst] du?', exEn: 'What are you doing?', exG: 'Was=what | machst=are doing | du?=you (informal)', forms: { ich: 'mache', du: 'machst', er: 'macht', wir: 'machen', ihr: 'macht', Sie: 'machen' }, v1: 3 },
  { de: 'gehen', en: ['to go (on foot)', 'to go', 'to walk'], type: 'v', ipa: 'ˈɡeːən', resp: 'GAY·en', syl: 'ge·hen', ex: 'Wir [gehen] nach Hause.', exEn: 'We are going home.', exG: 'Wir=we | gehen=are going | nach Hause.=home', forms: { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', Sie: 'gehen' }, v1: 3 },
  { de: 'sagen', en: ['to say'], type: 'v', ipa: 'ˈzaːɡn̩', resp: 'ZAH·gen', syl: 'sa·gen', ex: 'Was [sagst] du?', exEn: 'What are you saying?', exG: 'Was=what | sagst=are saying | du?=you (informal)', forms: { ich: 'sage', du: 'sagst', er: 'sagt', wir: 'sagen', ihr: 'sagt', Sie: 'sagen' }, v1: 3 },
  // v1 lesson 4 — questions
  { de: 'wer', en: ['who'], type: 'q', ipa: 'veːɐ̯', resp: 'VAIR', syl: 'wer', ex: '[Wer] ist das?', exEn: 'Who is that?', exG: 'Wer=who | ist=is | das?=that', v1: 4 },
  { de: 'was', en: ['what'], type: 'q', ipa: 'vas', resp: 'VAHS', syl: 'was', ex: '[Was] ist das?', exEn: 'What is that?', exG: 'Was=what | ist=is | das?=that', v1: 4 },
  { de: 'wie alt', en: ['how old'], type: 'q', ipa: 'viː ˈalt', resp: 'vee AHLT', syl: 'wie alt', ex: '[Wie alt] bist du?', exEn: 'How old are you?', exG: 'Wie alt=how old | bist=are | du?=you (informal)', v1: 4 },
  { de: 'wo', en: ['where'], type: 'q', ipa: 'voː', resp: 'VOH', syl: 'wo', ex: '[Wo] wohnst du?', exEn: 'Where do you live?', exG: 'Wo=where | wohnst=live | du?=you (informal)', v1: 4 },
  { de: 'woher', en: ['where from', 'from where'], type: 'q', ipa: 'voˈheːɐ̯', resp: 'voh·HAIR', syl: 'wo·her', ex: '[Woher] kommst du?', exEn: 'Where are you from?', exG: 'Woher=where from | kommst=come | du?=you (informal)', v1: 4 },
  { de: 'wohin', en: ['where to', 'where (to)'], type: 'q', ipa: 'voˈhɪn', resp: 'voh·HIN', syl: 'wo·hin', ex: '[Wohin] gehst du?', exEn: 'Where are you going?', exG: 'Wohin=where to | gehst=are going | du?=you (informal)', v1: 4 },
  { de: 'wann', en: ['when'], type: 'q', ipa: 'van', resp: 'VAHN', syl: 'wann', ex: '[Wann] kommst du?', exEn: 'When are you coming?', exG: 'Wann=when | kommst=are coming | du?=you (informal)', v1: 4 },
  { de: 'warum', en: ['why'], type: 'q', ipa: 'vaˈʁʊm', resp: 'vah·RUM', syl: 'wa·rum', ex: '[Warum] lernst du Deutsch?', exEn: 'Why are you learning German?', exG: 'Warum=why | lernst=are learning | du=you (informal) | Deutsch?=German', v1: 4 },
  { de: 'wie viel', en: ['how much', 'how many'], type: 'q', ipa: 'viː ˈfiːl', resp: 'vee FEEL', syl: 'wie viel', ex: '[Wie viel] kostet das?', exEn: 'How much does that cost?', exG: 'Wie viel=how much | kostet=costs | das?=that', v1: 4 },
  { de: 'welcher', en: ['which'], type: 'q', ipa: 'ˈvɛlçɐ', resp: 'VEL·khuh', syl: 'wel·cher', ex: '[Welcher] Tag ist heute?', exEn: 'Which day is it today?', exG: 'Welcher=which | Tag=day | ist=is | heute?=today', v1: 4 },
  // v1 lesson 5 — numbers
  { de: 'null', en: ['zero', 'nil'], type: 'num', ipa: 'nʊl', resp: 'NUL', syl: 'null', ex: 'Es steht eins zu [null].', exEn: 'The score is one–nil.', exG: 'Es steht=the score is | eins=one | zu=to | null.=nil', v1: 5 },
  { de: 'eins', en: ['one'], type: 'num', ipa: 'aɪ̯ns', resp: 'EYNS', syl: 'eins', ex: 'Ich habe nur [eins].', exEn: 'I only have one.', exG: 'Ich=I | habe=have | nur=only | eins.=one', v1: 5 },
  { de: 'zwei', en: ['two'], type: 'num', ipa: 'tsvaɪ̯', resp: 'TSVYE', syl: 'zwei', ex: 'Ich habe [zwei] Kinder.', exEn: 'I have two children.', exG: 'Ich=I | habe=have | zwei=two | Kinder.=children', v1: 5 },
  { de: 'drei', en: ['three'], type: 'num', ipa: 'dʁaɪ̯', resp: 'DRYE', syl: 'drei', ex: 'Wir sind [drei] Freunde.', exEn: 'We are three friends.', exG: 'Wir=we | sind=are | drei=three | Freunde.=friends', v1: 5 },
  { de: 'vier', en: ['four'], type: 'num', ipa: 'fiːɐ̯', resp: 'FEER', syl: 'vier', ex: 'Es ist [vier] Uhr.', exEn: "It is four o'clock.", exG: 'Es=it | ist=is | vier=four | Uhr.=o\'clock', v1: 5 },
  { de: 'fünf', en: ['five'], type: 'num', ipa: 'fʏnf', resp: 'FÜNF', syl: 'fünf', ex: '[Fünf] Euro, bitte.', exEn: 'Five euros, please.', exG: 'Fünf=five | Euro,=euros | bitte.=please', v1: 5 },
  { de: 'sechs', en: ['six'], type: 'num', ipa: 'zɛks', resp: 'ZEKS', syl: 'sechs', ex: 'Es ist [sechs] Uhr.', exEn: "It is six o'clock.", exG: 'Es=it | ist=is | sechs=six | Uhr.=o\'clock', v1: 5 },
  { de: 'sieben', en: ['seven'], type: 'num', ipa: 'ˈziːbn̩', resp: 'ZEE·ben', syl: 'sie·ben', ex: 'Die Woche hat [sieben] Tage.', exEn: 'The week has seven days.', exG: 'Die=the | Woche=week | hat=has | sieben=seven | Tage.=days', v1: 5 },
  { de: 'acht', en: ['eight'], type: 'num', ipa: 'axt', resp: 'AHKHT', syl: 'acht', ex: 'Ich arbeite [acht] Stunden.', exEn: 'I work eight hours.', exG: 'Ich=I | arbeite=work | acht=eight | Stunden.=hours', v1: 5 },
  { de: 'neun', en: ['nine'], type: 'num', ipa: 'nɔʏ̯n', resp: 'NOYN', syl: 'neun', ex: 'Der Kurs beginnt um [neun].', exEn: 'The course starts at nine.', exG: 'Der=the | Kurs=course | beginnt=starts | um=at | neun.=nine', v1: 5 },
  { de: 'zehn', en: ['ten'], type: 'num', ipa: 'tseːn', resp: 'TSAYN', syl: 'zehn', ex: 'Das kostet [zehn] Euro.', exEn: 'That costs ten euros.', exG: 'Das=that | kostet=costs | zehn=ten | Euro.=euros', v1: 5 },
  { de: 'zwanzig', en: ['twenty'], type: 'num', ipa: 'ˈtsvantsɪç', resp: 'TSVAHN·tsikh', syl: 'zwan·zig', ex: 'Ich bin [zwanzig] Jahre alt.', exEn: 'I am twenty years old.', exG: 'Ich=I | bin=am | zwanzig=twenty | Jahre=years | alt.=old', v1: 5 },
  { de: 'hundert', en: ['hundred', 'a hundred'], type: 'num', ipa: 'ˈhʊndɐt', resp: 'HUN·duht', syl: 'hun·dert', ex: 'Das kostet [hundert] Euro.', exEn: 'That costs a hundred euros.', exG: 'Das=that | kostet=costs | hundert=a hundred | Euro.=euros', v1: 5 },
  // v1 lesson 6 — small words
  { de: 'und', en: ['and'], type: 'conj', ipa: 'ʊnt', resp: 'UNT', syl: 'und', ex: 'Anna [und] Tom sind Freunde.', exEn: 'Anna and Tom are friends.', exG: 'Anna=Anna | und=and | Tom=Tom | sind=are | Freunde.=friends', v1: 6 },
  { de: 'aber', en: ['but'], type: 'conj', ipa: 'ˈaːbɐ', resp: 'AH·buh', syl: 'a·ber', ex: 'Ich verstehe, [aber] ich spreche nicht gut.', exEn: "I understand, but I don't speak well.", exG: 'Ich=I | verstehe,=understand | aber=but | ich=I | spreche=speak | nicht=not | gut.=well', v1: 6 },
  { de: 'oder', en: ['or'], type: 'conj', ipa: 'ˈoːdɐ', resp: 'OH·duh', syl: 'o·der', ex: 'Kaffee [oder] Tee?', exEn: 'Coffee or tea?', exG: 'Kaffee=coffee | oder=or | Tee?=tea', v1: 6 },
  { de: 'jetzt', en: ['now'], type: 'adv', ipa: 'jɛtst', resp: 'YETST', syl: 'jetzt', ex: 'Ich gehe [jetzt].', exEn: "I'm going now.", exG: 'Ich=I | gehe=am going | jetzt.=now', v1: 6 },
  { de: 'heute', en: ['today'], type: 'adv', ipa: 'ˈhɔʏ̯tə', resp: 'HOY·tuh', syl: 'heu·te', ex: '[Heute] lerne ich Deutsch.', exEn: "Today I'm learning German.", exG: 'Heute=today | lerne=am learning | ich=I | Deutsch.=German', v1: 6 },
  { de: 'nicht', en: ['not'], type: 'part', ipa: 'nɪçt', resp: 'NIKHT', syl: 'nicht', ex: 'Ich verstehe das [nicht].', exEn: "I don't understand that.", exG: 'Ich=I | verstehe=understand | das=that | nicht.=not', v1: 6 },
  { de: 'kein', en: ['no', 'not a', 'not any'], type: 'part', ipa: 'kaɪ̯n', resp: 'KINE', syl: 'kein', ex: 'Ich habe [kein] Auto.', exEn: "I don't have a car.", exG: 'Ich=I | habe=have | kein=no | Auto.=car', v1: 6 },
  { de: 'auch', en: ['also', 'too'], type: 'adv', ipa: 'aʊ̯x', resp: 'OWKH', syl: 'auch', ex: 'Ich lerne [auch] Deutsch.', exEn: "I'm learning German too.", exG: 'Ich=I | lerne=am learning | auch=also | Deutsch.=German', v1: 6 },
  { de: 'sehr', en: ['very'], type: 'adv', ipa: 'zeːɐ̯', resp: 'ZAIR', syl: 'sehr', ex: 'Das ist [sehr] gut.', exEn: 'That is very good.', exG: 'Das=that | ist=is | sehr=very | gut.=good', v1: 6 },
  { de: 'gern', en: ['gladly', 'like to'], type: 'adv', ipa: 'ɡɛʁn', resp: 'GEHRN', syl: 'gern', ex: 'Ich trinke [gern] Kaffee.', exEn: 'I like drinking coffee.', exG: 'Ich=I | trinke=drink | gern=(like to) | Kaffee.=coffee', v1: 6 },
  { de: 'hier', en: ['here'], type: 'adv', ipa: 'hiːɐ̯', resp: 'HEER', syl: 'hier', ex: 'Ich wohne [hier].', exEn: 'I live here.', exG: 'Ich=I | wohne=live | hier.=here', v1: 6 },
  { de: 'da', en: ['there'], type: 'adv', ipa: 'daː', resp: 'DAH', syl: 'da', ex: 'Ist Anna [da]?', exEn: 'Is Anna there?', exG: 'Ist=is | Anna=Anna | da?=there', v1: 6 },
  // v1 lesson 7 — food
  { de: 'das Wasser', en: ['water'], type: 'n', g: 'n', ipa: 'ˈvasɐ', resp: 'VAH·suh', syl: 'Was·ser', ex: 'Ein [Wasser], bitte.', exEn: 'A water, please.', exG: 'Ein=a | Wasser,=water | bitte.=please', pic: 'wasser', v1: 7 },
  { de: 'der Kaffee', en: ['coffee'], type: 'n', g: 'm', ipa: 'ˈkafe', resp: 'KAH·fay', syl: 'Kaf·fee', ex: 'Ich trinke gern [Kaffee].', exEn: 'I like drinking coffee.', exG: 'Ich=I | trinke=drink | gern=(like to) | Kaffee.=coffee', pic: 'kaffee', v1: 7 },
  { de: 'möchten', en: ['would like'], type: 'v', ipa: 'ˈmœçtn̩', resp: 'MÖKH·ten', syl: 'möch·ten', ex: 'Ich [möchte] einen Kaffee.', exEn: 'I would like a coffee.', exG: 'Ich=I | möchte=would like | einen=a | Kaffee.=coffee', forms: { ich: 'möchte', du: 'möchtest', er: 'möchte', wir: 'möchten', ihr: 'möchtet', Sie: 'möchten' }, v1: 7 },
  { de: 'lecker', en: ['tasty', 'delicious'], type: 'adj', ipa: 'ˈlɛkɐ', resp: 'LEK·kuh', syl: 'le·cker', ex: 'Das Essen ist sehr [lecker].', exEn: 'The food is very tasty.', exG: 'Das=the | Essen=food | ist=is | sehr=very | lecker.=tasty', v1: 7 },
  { de: 'der Tee', en: ['tea'], type: 'n', g: 'm', ipa: 'teː', resp: 'TAY', syl: 'Tee', ex: 'Möchtest du [Tee]?', exEn: 'Would you like tea?', exG: 'Möchtest=would like | du=you (informal) | Tee?=tea', pic: 'tee', v1: 7 },
  { de: 'das Brot', en: ['bread'], type: 'n', g: 'n', pl: 'die Brote', ipa: 'bʁoːt', resp: 'BROHT', syl: 'Brot', ex: 'Das [Brot] ist frisch.', exEn: 'The bread is fresh.', exG: 'Das=the | Brot=bread | ist=is | frisch.=fresh', pic: 'brot', v1: 7 },
  { de: 'die Milch', en: ['milk'], type: 'n', g: 'f', ipa: 'mɪlç', resp: 'MILKH', syl: 'Milch', ex: 'Ich trinke Kaffee mit [Milch].', exEn: 'I drink coffee with milk.', exG: 'Ich=I | trinke=drink | Kaffee=coffee | mit=with | Milch.=milk', pic: 'milch', v1: 7 },
  { de: 'der Apfel', en: ['apple'], type: 'n', g: 'm', pl: 'die Äpfel', ipa: 'ˈapfl̩', resp: 'AHP·fel', syl: 'Ap·fel', ex: 'Der [Apfel] ist rot.', exEn: 'The apple is red.', exG: 'Der=the | Apfel=apple | ist=is | rot.=red', pic: 'apfel', v1: 7 },
  { de: 'das Fleisch', en: ['meat'], type: 'n', g: 'n', ipa: 'flaɪ̯ʃ', resp: 'FLYSH', syl: 'Fleisch', ex: 'Ich esse kein [Fleisch].', exEn: "I don't eat meat.", exG: 'Ich=I | esse=eat | kein=no | Fleisch.=meat', pic: 'fleisch', v1: 7 },
  { de: 'der Käse', en: ['cheese'], type: 'n', g: 'm', ipa: 'ˈkɛːzə', resp: 'KEH·zuh', syl: 'Kä·se', ex: 'Ich möchte ein Brot mit [Käse].', exEn: "I'd like bread with cheese.", exG: 'Ich=I | möchte=would like | ein=a | Brot=bread | mit=with | Käse.=cheese', pic: 'kaese', v1: 7 },
  { de: 'essen', en: ['to eat'], type: 'v', ipa: 'ˈɛsn̩', resp: 'ES·sen', syl: 'es·sen', ex: 'Wir [essen] um sieben.', exEn: 'We eat at seven.', exG: 'Wir=we | essen=eat | um=at | sieben.=seven', forms: { ich: 'esse', du: 'isst', er: 'isst', wir: 'essen', ihr: 'esst', Sie: 'essen' }, v1: 7 },
  { de: 'trinken', en: ['to drink'], type: 'v', ipa: 'ˈtʁɪŋkn̩', resp: 'TRING·ken', syl: 'trin·ken', ex: 'Was [trinkst] du?', exEn: 'What are you drinking?', exG: 'Was=what | trinkst=are drinking | du?=you (informal)', forms: { ich: 'trinke', du: 'trinkst', er: 'trinkt', wir: 'trinken', ihr: 'trinkt', Sie: 'trinken' }, v1: 7 },
  // v1 lesson 8 — home
  { de: 'das Haus', en: ['house'], type: 'n', g: 'n', pl: 'die Häuser', ipa: 'haʊ̯s', resp: 'HOWS', syl: 'Haus', ex: 'Das [Haus] ist groß.', exEn: 'The house is big.', exG: 'Das=the | Haus=house | ist=is | groß.=big', pic: 'haus', v1: 8 },
  { de: 'die Wohnung', en: ['flat', 'apartment'], type: 'n', g: 'f', pl: 'die Wohnungen', ipa: 'ˈvoːnʊŋ', resp: 'VOH·nung', syl: 'Woh·nung', ex: 'Meine [Wohnung] ist klein.', exEn: 'My flat is small.', exG: 'Meine=my | Wohnung=flat | ist=is | klein.=small', pic: 'wohnung', v1: 8 },
  { de: 'klein', en: ['small', 'little'], type: 'adj', ipa: 'klaɪ̯n', resp: 'KLINE', syl: 'klein', ex: 'Das Zimmer ist [klein].', exEn: 'The room is small.', exG: 'Das=the | Zimmer=room | ist=is | klein.=small', v1: 8 },
  { de: 'schön', en: ['beautiful', 'nice'], type: 'adj', ipa: 'ʃøːn', resp: 'SHÖN', syl: 'schön', ex: 'Die Wohnung ist [schön].', exEn: 'The flat is nice.', exG: 'Die=the | Wohnung=flat | ist=is | schön.=nice', v1: 8 },
  { de: 'neu', en: ['new'], type: 'adj', ipa: 'nɔʏ̯', resp: 'NOY', syl: 'neu', ex: 'Das Auto ist [neu].', exEn: 'The car is new.', exG: 'Das=the | Auto=car | ist=is | neu.=new', v1: 8 },
  { de: 'das Zimmer', en: ['room'], type: 'n', g: 'n', pl: 'die Zimmer', ipa: 'ˈtsɪmɐ', resp: 'TSIM·muh', syl: 'Zim·mer', ex: 'Die Wohnung hat drei [Zimmer].', exEn: 'The flat has three rooms.', exG: 'Die=the | Wohnung=flat | hat=has | drei=three | Zimmer.=rooms', pic: 'zimmer', v1: 8 },
  { de: 'die Küche', en: ['kitchen'], type: 'n', g: 'f', pl: 'die Küchen', ipa: 'ˈkʏçə', resp: 'KÜ·khuh', syl: 'Kü·che', ex: 'Wir essen in der [Küche].', exEn: 'We eat in the kitchen.', exG: 'Wir=we | essen=eat | in der=in the | Küche.=kitchen', pic: 'kueche', v1: 8 },
  { de: 'der Tisch', en: ['table'], type: 'n', g: 'm', pl: 'die Tische', ipa: 'tɪʃ', resp: 'TISH', syl: 'Tisch', ex: 'Das Brot ist auf dem [Tisch].', exEn: 'The bread is on the table.', exG: 'Das=the | Brot=bread | ist=is | auf dem=on the | Tisch.=table', pic: 'tisch', v1: 8 },
  { de: 'der Stuhl', en: ['chair'], type: 'n', g: 'm', pl: 'die Stühle', ipa: 'ʃtuːl', resp: 'SHTOOL', syl: 'Stuhl', ex: 'Der [Stuhl] ist neu.', exEn: 'The chair is new.', exG: 'Der=the | Stuhl=chair | ist=is | neu.=new', pic: 'stuhl', v1: 8 },
  { de: 'das Bett', en: ['bed'], type: 'n', g: 'n', pl: 'die Betten', ipa: 'bɛt', resp: 'BET', syl: 'Bett', ex: 'Das [Bett] ist sehr groß.', exEn: 'The bed is very big.', exG: 'Das=the | Bett=bed | ist=is | sehr=very | groß.=big', pic: 'bett', v1: 8 },
  { de: 'die Tür', en: ['door'], type: 'n', g: 'f', pl: 'die Türen', ipa: 'tyːɐ̯', resp: 'TÜR', syl: 'Tür', ex: 'Mach bitte die [Tür] zu.', exEn: 'Please close the door.', exG: 'Mach=close | bitte=please | die=the | Tür=door | zu.=(shut)', pic: 'tuer', v1: 8 },
  { de: 'das Fenster', en: ['window'], type: 'n', g: 'n', pl: 'die Fenster', ipa: 'ˈfɛnstɐ', resp: 'FEN·stuh', syl: 'Fens·ter', ex: 'Das [Fenster] ist offen.', exEn: 'The window is open.', exG: 'Das=the | Fenster=window | ist=is | offen.=open', pic: 'fenster', v1: 8 },
  { de: 'groß', en: ['big', 'tall', 'large'], type: 'adj', ipa: 'ɡʁoːs', resp: 'GROHS', syl: 'groß', ex: 'Berlin ist [groß].', exEn: 'Berlin is big.', exG: 'Berlin=Berlin | ist=is | groß.=big', v1: 8 },
];
// Global lexicon for error diagnosis: every verb's forms and every noun's gender from all dictionaries.
function globalLex() {
  const verbs = {}, nouns = {};
  for (const w of [...V1_WORDS, ...allLessons().flatMap(l => l.words)]) { if (w.forms) verbs[w.de] = w.forms; if (w.type === 'n' && w.g) nouns[w.de.replace(/^(der|die|das) /, '')] = w.g; }
  return { verbs, nouns };
}
function mergedLex(lex) { const g = globalLex(); return { verbs: Object.assign({}, g.verbs, lex.verbs || {}), nouns: Object.assign({}, g.nouns, lex.nouns || {}), related: lex.related || {}, sep: lex.sep || {} }; }
/* ---------- More illustrations (same flat style, viewBox 0 0 100 100) ---------- */
Object.assign(PICS, {
  kind: `<svg viewBox="0 0 100 100"><circle cx="50" cy="34" r="16" fill="#98c7ee"/><path d="M34 30c2-12 10-18 16-18s14 6 16 18c-6-4-10-6-16-6s-10 2-16 6z" fill="#235f90"/><circle cx="44" cy="35" r="2" fill="#07101f"/><circle cx="56" cy="35" r="2" fill="#07101f"/><path d="M45 42q5 4 10 0" stroke="#266aa2" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30 84c0-18 9-30 20-30s20 12 20 30z" fill="#88c1f0"/><path d="M42 56l8 10 8-10" fill="#2373b5"/><rect x="40" y="84" width="8" height="10" rx="3" fill="#2f5aa9"/><rect x="52" y="84" width="8" height="10" rx="3" fill="#2f5aa9"/><circle cx="76" cy="28" r="9" fill="#2373b5"/><path d="M76 37v22" stroke="#8796a8" stroke-width="1.5"/></svg>`,
  freund: `<svg viewBox="0 0 100 100"><circle cx="50" cy="32" r="15" fill="#98c7ee"/><path d="M35 28c1-10 8-15 15-15s14 5 15 15c-5-3-9-4-15-4s-10 1-15 4z" fill="#1d4260"/><circle cx="44" cy="33" r="2" fill="#07101f"/><circle cx="56" cy="33" r="2" fill="#07101f"/><path d="M45 40q5 4 10 0" stroke="#266aa2" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M26 90c0-22 10-36 24-36s24 14 24 36z" fill="#2f5aa9"/><path d="M42 54h16v10H42z" fill="#f3f8ff"/><rect x="60" y="62" width="22" height="14" rx="3" fill="#88c1f0"/><path d="M60 68h22" stroke="#2c76b2" stroke-width="2"/></svg>`,
  freundin: `<svg viewBox="0 0 100 100"><path d="M30 60c0-30 8-44 20-44s20 14 20 44z" fill="#1f5e92"/><circle cx="50" cy="32" r="15" fill="#98c7ee"/><path d="M36 26c2-8 8-12 14-12s12 4 14 12c-4-2-9-3-14-3s-10 1-14 3z" fill="#1f5e92"/><circle cx="44" cy="33" r="2" fill="#07101f"/><circle cx="56" cy="33" r="2" fill="#07101f"/><path d="M45 40q5 4 10 0" stroke="#266aa2" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M26 90c0-22 10-36 24-36s24 14 24 36z" fill="#2373b5"/><circle cx="50" cy="66" r="4" fill="#88c1f0"/><circle cx="50" cy="78" r="4" fill="#88c1f0"/></svg>`,
  mann: `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="14" fill="#98c7ee"/><path d="M36 26c2-8 7-12 14-12s12 4 14 12c-4-3-9-4-14-4s-10 1-14 4z" fill="#505d6e"/><path d="M40 38q10 8 20 0v4q-10 6-20 0z" fill="#505d6e"/><circle cx="44" cy="31" r="2" fill="#07101f"/><circle cx="56" cy="31" r="2" fill="#07101f"/><path d="M24 92c0-24 11-40 26-40s26 16 26 40z" fill="#2b4678"/><path d="M44 52l6 8 6-8v-2H44z" fill="#f3f8ff"/><path d="M48 60h4l-2 20z" fill="#2373b5"/><rect x="70" y="48" width="8" height="40" rx="3" fill="#2c76b2"/><circle cx="74" cy="46" r="5" fill="#88c1f0"/></svg>`,
  frau: `<svg viewBox="0 0 100 100"><path d="M34 48c-2-22 6-34 16-34s18 12 16 34c-6-6-10-8-16-8s-10 2-16 8z" fill="#07101f"/><circle cx="50" cy="32" r="14" fill="#98c7ee"/><path d="M36 26c3-8 8-11 14-11s11 3 14 11c-4-3-9-4-14-4s-10 1-14 4z" fill="#07101f"/><circle cx="44" cy="33" r="2" fill="#07101f"/><circle cx="56" cy="33" r="2" fill="#07101f"/><path d="M45 40q5 4 10 0" stroke="#266aa2" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 92c0-24 11-40 26-40s26 16 26 40z" fill="#49a0a9"/><circle cx="50" cy="56" r="3" fill="#88c1f0"/><rect x="66" y="60" width="18" height="22" rx="4" fill="#2373b5"/><path d="M70 60v-4a5 5 0 0 1 10 0v4" stroke="#195687" stroke-width="2.5" fill="none"/></svg>`,
  wasser: `<svg viewBox="0 0 100 100"><path d="M34 20h32l-4 64H38z" fill="#c4d1ea" stroke="#8796a8" stroke-width="2"/><path d="M38 40h24l-3 42H41z" fill="#2f5aa9" opacity=".7"/><ellipse cx="50" cy="20" rx="16" ry="3" fill="#f3f8ff" stroke="#8796a8" stroke-width="2"/><path d="M44 48q4-6 8 0" stroke="#f3f8ff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="54" cy="64" r="2" fill="#f3f8ff" opacity=".7"/><circle cx="47" cy="72" r="1.5" fill="#f3f8ff" opacity=".7"/></svg>`,
  tee: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="80" rx="30" ry="6" fill="#b2d3ed"/><path d="M24 40h48v22a12 12 0 0 1-12 12H36a12 12 0 0 1-12-12z" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><path d="M72 46h6a7 7 0 0 1 0 14h-6" fill="none" stroke="#2c76b2" stroke-width="2.5"/><ellipse cx="48" cy="44" rx="20" ry="4" fill="#2b88d5"/><path d="M58 42l10-18" stroke="#2c76b2" stroke-width="1.5"/><rect x="64" y="18" width="12" height="9" rx="2" fill="#2373b5"/><path d="M40 22q3 5 0 10M48 20q3 5 0 10" stroke="#8796a8" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  brot: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="78" rx="34" ry="6" fill="#b2d3ed"/><path d="M16 60c0-16 15-26 34-26s34 10 34 26c0 8-8 14-34 14S16 68 16 60z" fill="#4f9cdb"/><path d="M22 52c6-10 16-14 28-14s22 4 28 14c-8-4-16-6-28-6s-20 2-28 6z" fill="#77b5e8"/><path d="M34 46l8 12M46 42l8 12M58 42l8 12" stroke="#1e6dae" stroke-width="2.5" stroke-linecap="round"/><circle cx="30" cy="66" r="2" fill="#f3f8ff"/><circle cx="66" cy="64" r="2" fill="#f3f8ff"/></svg>`,
  milch: `<svg viewBox="0 0 100 100"><path d="M34 34l8-14h16l8 14v48a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4z" fill="#f3f8ff" stroke="#8796a8" stroke-width="2"/><path d="M34 34h32" stroke="#8796a8" stroke-width="2"/><rect x="38" y="46" width="24" height="22" rx="2" fill="#2f5aa9"/><text x="50" y="61" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="9" font-weight="700" fill="#f3f8ff">MILCH</text><path d="M44 20v-4h12v4" stroke="#8796a8" stroke-width="2" fill="none"/></svg>`,
  apfel: `<svg viewBox="0 0 100 100"><path d="M50 36c-6-8-18-8-26 0s-10 26-2 38 18 16 28 10c10 6 20 2 28-10s6-30-2-38-20-8-26 0z" fill="#2373b5"/><path d="M50 36v-14" stroke="#235f90" stroke-width="3" stroke-linecap="round"/><path d="M52 28c6-10 16-10 20-6-4 6-12 10-20 6z" fill="#49a0a9"/><path d="M34 46q-6 8-4 20" stroke="#f3f8ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></svg>`,
  fleisch: `<svg viewBox="0 0 100 100"><path d="M22 50c-2-16 12-28 30-28s30 10 30 24c0 12-8 20-10 28s-6 12-16 10-20-10-24-18-8-6-10-16z" fill="#2c81c7"/><path d="M34 44c2-10 10-16 20-16" stroke="#f3f8ff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/><path d="M62 70c4-6 6-14 4-22" stroke="#f3f8ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><circle cx="70" cy="40" r="7" fill="#f3f8ff"/><circle cx="70" cy="40" r="3" fill="#b2d3ed"/></svg>`,
  kaese: `<svg viewBox="0 0 100 100"><path d="M14 66L50 24l36 42z" fill="#88c1f0"/><path d="M14 66h72v10H14z" fill="#5ea9e7"/><circle cx="44" cy="54" r="5" fill="#5ea9e7"/><circle cx="60" cy="60" r="3.5" fill="#5ea9e7"/><circle cx="52" cy="42" r="3" fill="#5ea9e7"/><path d="M50 24l36 42" stroke="#f3f8ff" stroke-width="2" opacity=".5"/></svg>`,
  haus: `<svg viewBox="0 0 100 100"><rect x="0" y="80" width="100" height="20" fill="#b2d3ed"/><rect x="20" y="44" width="60" height="36" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><path d="M14 46L50 18l36 28z" fill="#2373b5"/><rect x="44" y="60" width="12" height="20" fill="#2c76b2"/><rect x="26" y="50" width="10" height="10" fill="#2f5aa9"/><rect x="64" y="50" width="10" height="10" fill="#2f5aa9"/><rect x="62" y="22" width="8" height="14" fill="#2c76b2"/><path d="M24 50h14M24 55h14M62 50h14M62 55h14" stroke="#f3f8ff" stroke-width="1.5"/></svg>`,
  wohnung: `<svg viewBox="0 0 100 100"><rect x="14" y="14" width="72" height="74" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><path d="M14 24h72" stroke="#2c76b2" stroke-width="2"/><g fill="#2f5aa9"><rect x="22" y="30" width="12" height="14"/><rect x="44" y="30" width="12" height="14"/><rect x="66" y="30" width="12" height="14"/><rect x="22" y="52" width="12" height="14"/><rect x="66" y="52" width="12" height="14"/></g><rect x="44" y="52" width="12" height="14" fill="#88c1f0"/><rect x="42" y="72" width="16" height="16" fill="#2c76b2"/><path d="M40 50h20" stroke="#2c76b2" stroke-width="3"/><path d="M26 46h6M26 68h6" stroke="#2373b5" stroke-width="3" stroke-linecap="round"/></svg>`,
  zimmer: `<svg viewBox="0 0 100 100"><path d="M10 20h80v50H10z" fill="#b2d3ed"/><path d="M10 70h80l-10 16H20z" fill="#4892ce"/><rect x="36" y="28" width="28" height="22" fill="#b9cbec" stroke="#f3f8ff" stroke-width="4"/><path d="M50 28v22M36 39h28" stroke="#f3f8ff" stroke-width="3"/><rect x="14" y="52" width="24" height="16" rx="2" fill="#2f5aa9"/><rect x="68" y="50" width="16" height="20" fill="#2c76b2"/><rect x="70" y="54" width="12" height="3" fill="#f3f8ff"/><rect x="70" y="60" width="12" height="3" fill="#f3f8ff"/><circle cx="78" cy="30" r="6" fill="#88c1f0"/><path d="M78 20v4" stroke="#225884" stroke-width="2"/></svg>`,
  kueche: `<svg viewBox="0 0 100 100"><rect x="10" y="46" width="80" height="36" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><rect x="10" y="42" width="80" height="6" fill="#2c76b2"/><rect x="18" y="54" width="22" height="22" fill="#2f5aa9"/><circle cx="29" cy="65" r="6" fill="#c4d1ea"/><rect x="56" y="54" width="26" height="22" fill="#8796a8"/><rect x="60" y="58" width="18" height="10" fill="#07101f"/><circle cx="62" cy="48" r="3" fill="#07101f"/><circle cx="76" cy="48" r="3" fill="#07101f"/><path d="M40 30c0 8 8 12 10 12s10-4 10-12z" fill="#2373b5"/><rect x="38" y="28" width="24" height="4" rx="2" fill="#2c76b2"/><path d="M50 18v10" stroke="#2c76b2" stroke-width="3"/></svg>`,
  tisch: `<svg viewBox="0 0 100 100"><rect x="12" y="40" width="76" height="10" rx="3" fill="#4892ce"/><rect x="18" y="50" width="8" height="34" fill="#2c76b2"/><rect x="74" y="50" width="8" height="34" fill="#2c76b2"/><path d="M26 56h48v4H26z" fill="#2c76b2"/><ellipse cx="50" cy="38" rx="12" ry="4" fill="#f3f8ff"/><rect x="44" y="26" width="12" height="12" rx="2" fill="#88c1f0"/><circle cx="36" cy="37" r="4" fill="#2373b5"/><circle cx="64" cy="37" r="4" fill="#2373b5"/></svg>`,
  stuhl: `<svg viewBox="0 0 100 100"><rect x="30" y="14" width="40" height="40" rx="6" fill="#2f5aa9"/><rect x="36" y="20" width="28" height="26" rx="3" fill="#3867be"/><rect x="26" y="54" width="48" height="10" rx="3" fill="#4892ce"/><rect x="30" y="64" width="6" height="26" fill="#2c76b2"/><rect x="64" y="64" width="6" height="26" fill="#2c76b2"/><rect x="33" y="76" width="34" height="3" fill="#2c76b2"/></svg>`,
  bett: `<svg viewBox="0 0 100 100"><rect x="8" y="30" width="12" height="52" rx="3" fill="#2c76b2"/><rect x="80" y="44" width="12" height="38" rx="3" fill="#2c76b2"/><rect x="18" y="50" width="64" height="22" rx="4" fill="#2373b5"/><rect x="18" y="56" width="64" height="4" fill="#f3f8ff"/><rect x="22" y="40" width="22" height="12" rx="4" fill="#f3f8ff"/><path d="M18 72h64v8H18z" fill="#2c76b2"/><path d="M48 50q10-8 34 0" fill="#88c1f0"/><circle cx="76" cy="22" r="6" fill="#88c1f0"/><path d="M76 10v6" stroke="#225884" stroke-width="2"/></svg>`,
  tuer: `<svg viewBox="0 0 100 100"><rect x="24" y="10" width="52" height="82" rx="4" fill="#2c76b2"/><rect x="30" y="16" width="40" height="70" rx="2" fill="#4892ce"/><rect x="34" y="22" width="32" height="24" rx="2" fill="#2c76b2"/><rect x="34" y="52" width="32" height="28" rx="2" fill="#2c76b2"/><circle cx="62" cy="50" r="3.5" fill="#88c1f0"/><rect x="20" y="92" width="60" height="4" fill="#b2d3ed"/><rect x="40" y="30" width="20" height="8" rx="1" fill="#f3f8ff"/><text x="50" y="36.5" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="5" font-weight="700" fill="#07101f">WEBER</text></svg>`,
  fenster: `<svg viewBox="0 0 100 100"><rect x="18" y="14" width="64" height="72" rx="3" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><rect x="24" y="20" width="52" height="60" fill="#b9cbec"/><path d="M50 20v60M24 50h52" stroke="#f3f8ff" stroke-width="4"/><circle cx="36" cy="34" r="6" fill="#88c1f0"/><path d="M24 80q14-14 26-8t26 8z" fill="#b2d6da"/><rect x="60" y="56" width="3" height="16" fill="#8796a8"/><circle cx="61.5" cy="54" r="4" fill="#c4d1ea" stroke="#8796a8" stroke-width="1"/><rect x="14" y="86" width="72" height="4" fill="#2c76b2"/><rect x="26" y="66" width="12" height="10" fill="#2373b5"/><ellipse cx="32" cy="64" rx="10" ry="6" fill="#49a0a9"/></svg>`,
});

/* ---------- More scenes (800×350) ---------- */
Object.assign(SCENES, {
  cafe: `<svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="800" height="350" fill="#f3f8ff"/>
    <rect x="0" y="0" width="800" height="110" fill="#b2d3ed"/>
    <rect x="0" y="260" width="800" height="90" fill="#2c76b2"/><rect x="0" y="256" width="800" height="6" fill="#235f90"/>
    <rect x="60" y="20" width="300" height="200" rx="4" fill="#b9cbec" stroke="#07101f" stroke-width="10"/>
    <rect x="205" y="20" width="10" height="200" fill="#07101f"/>
    <path d="M60 170q60-40 120-10t120-10v60H60z" fill="#b2d3ed"/>
    <rect x="80" y="60" width="60" height="110" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><rect x="90" y="70" width="14" height="20" fill="#2f5aa9"/><rect x="112" y="70" width="14" height="20" fill="#2f5aa9"/><rect x="90" y="100" width="14" height="20" fill="#2f5aa9"/><rect x="112" y="100" width="14" height="20" fill="#88c1f0"/>
    <rect x="230" y="80" width="40" height="90" fill="#f3f8ff" stroke="#2c76b2" stroke-width="2"/><rect x="240" y="90" width="20" height="26" fill="#2f5aa9"/>
    <text x="150" y="48" font-family="Bricolage Grotesque,Inter,sans-serif" font-size="22" font-weight="700" fill="#07101f" opacity=".6" transform="scale(-1,1) translate(-300,0)">CAFÉ</text>
    <rect x="440" y="40" width="300" height="120" rx="6" fill="#07101f"/>
    <text x="470" y="90" font-family="Bricolage Grotesque,Inter,sans-serif" font-size="30" font-weight="700" fill="#f3f8ff">Kaffee  3,20</text>
    <text x="470" y="130" font-family="Bricolage Grotesque,Inter,sans-serif" font-size="26" fill="#88c1f0">Brötchen  1,80</text>
    <rect x="420" y="170" width="340" height="14" rx="4" fill="#4892ce"/><rect x="430" y="184" width="320" height="60" fill="#2c76b2"/>
    <rect x="470" y="140" width="40" height="30" rx="4" fill="#8796a8"/><rect x="520" y="120" width="60" height="50" rx="6" fill="#2373b5"/><rect x="530" y="128" width="40" height="16" rx="3" fill="#f3f8ff"/>
    <ellipse cx="640" cy="166" rx="18" ry="5" fill="#f3f8ff"/><path d="M628 150h24v12a12 12 0 0 1-24 0z" fill="#f3f8ff"/><path d="M652 154h4a5 5 0 0 1 0 10h-4" fill="none" stroke="#f3f8ff" stroke-width="2"/>
    <rect x="140" y="226" width="200" height="12" rx="4" fill="#4892ce"/><rect x="150" y="238" width="10" height="40" fill="#2c76b2"/><rect x="320" y="238" width="10" height="40" fill="#2c76b2"/>
    <ellipse cx="240" cy="222" rx="14" ry="4" fill="#f3f8ff"/><path d="M230 208h20v10a10 10 0 0 1-20 0z" fill="#f3f8ff"/>
    <rect x="40" y="206" width="60" height="18" rx="6" fill="#2f5aa9"/><rect x="46" y="224" width="8" height="40" fill="#07101f"/><rect x="86" y="224" width="8" height="40" fill="#07101f"/><rect x="40" y="170" width="10" height="40" rx="3" fill="#07101f"/>
    <rect x="720" y="190" width="28" height="70" rx="4" fill="#2373b5"/><ellipse cx="734" cy="186" rx="26" ry="20" fill="#49a0a9"/>
  </svg>`,
  ubahn: `<svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="800" height="350" fill="#bed8ed"/>
    <rect x="0" y="0" width="800" height="150" fill="#98c2e4"/>
    <g fill="#80b3dd"><rect x="0" y="0" width="800" height="6"/><rect x="0" y="36" width="800" height="6"/><rect x="0" y="72" width="800" height="6"/><rect x="0" y="108" width="800" height="6"/></g>
    <rect x="0" y="150" width="800" height="12" fill="#07101f"/>
    <rect x="0" y="162" width="800" height="90" fill="#8796a8"/>
    <rect x="0" y="252" width="800" height="98" fill="#475362"/><rect x="0" y="248" width="800" height="8" fill="#88c1f0"/>
    <rect x="40" y="170" width="560" height="78" rx="14" fill="#88c1f0"/><rect x="40" y="190" width="560" height="30" fill="#07101f"/>
    <g fill="#b9cbec"><rect x="60" y="194" width="70" height="24" rx="3"/><rect x="150" y="194" width="70" height="24" rx="3"/><rect x="260" y="194" width="70" height="24" rx="3"/><rect x="350" y="194" width="70" height="24" rx="3"/><rect x="460" y="194" width="70" height="24" rx="3"/></g>
    <rect x="230" y="188" width="20" height="60" fill="#07101f"/><rect x="430" y="188" width="20" height="60" fill="#07101f"/>
    <rect x="40" y="226" width="560" height="6" fill="#2373b5"/>
    <circle cx="90" cy="248" r="10" fill="#07101f"/><circle cx="200" cy="248" r="10" fill="#07101f"/><circle cx="440" cy="248" r="10" fill="#07101f"/><circle cx="550" cy="248" r="10" fill="#07101f"/>
    <rect x="640" y="60" width="130" height="50" rx="4" fill="#f3f8ff" stroke="#07101f" stroke-width="4"/>
    <text x="705" y="94" text-anchor="middle" font-family="Bricolage Grotesque,Inter,sans-serif" font-size="26" font-weight="800" fill="#07101f">U</text>
    <rect x="640" y="120" width="130" height="22" rx="3" fill="#2f5aa9"/><text x="705" y="136" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="#f3f8ff">Kottbusser Tor</text>
    <rect x="690" y="150" width="8" height="100" fill="#07101f"/>
    <circle cx="730" cy="190" r="22" fill="#f3f8ff" stroke="#07101f" stroke-width="4"/><path d="M730 190v-13M730 190h9" stroke="#07101f" stroke-width="3" stroke-linecap="round"/><rect x="727" y="212" width="6" height="40" fill="#07101f"/>
  </svg>`,
  spaeti: `<svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="800" height="350" fill="#07101f"/>
    <circle cx="700" cy="50" r="18" fill="#f3f8ff"/><circle cx="120" cy="60" r="2" fill="#f3f8ff"/><circle cx="300" cy="30" r="2" fill="#f3f8ff"/><circle cx="520" cy="70" r="2" fill="#f3f8ff"/>
    <rect x="0" y="280" width="800" height="70" fill="#223861"/>
    <rect x="140" y="80" width="520" height="200" fill="#223c6b"/>
    <rect x="140" y="80" width="520" height="40" fill="#2373b5"/>
    <text x="400" y="110" text-anchor="middle" font-family="Bricolage Grotesque,Inter,sans-serif" font-size="30" font-weight="800" fill="#f3f8ff" letter-spacing="6">SPÄTI</text>
    <rect x="160" y="130" width="300" height="150" fill="#88c1f0" opacity=".9"/>
    <g fill="#2373b5"><rect x="176" y="146" width="18" height="34" rx="3"/><rect x="200" y="146" width="18" height="34" rx="3"/><rect x="224" y="146" width="18" height="34" rx="3"/></g>
    <g fill="#2f5aa9"><rect x="260" y="146" width="18" height="34" rx="3"/><rect x="284" y="146" width="18" height="34" rx="3"/></g>
    <g fill="#49a0a9"><rect x="320" y="146" width="18" height="34" rx="3"/><rect x="344" y="146" width="18" height="34" rx="3"/><rect x="368" y="146" width="18" height="34" rx="3"/></g>
    <rect x="170" y="184" width="280" height="4" fill="#2c76b2"/>
    <g fill="#f3f8ff"><rect x="176" y="196" width="40" height="26" rx="3"/><rect x="226" y="196" width="40" height="26" rx="3"/><rect x="276" y="196" width="40" height="26" rx="3"/></g><rect x="330" y="196" width="60" height="26" rx="3" fill="#2373b5"/>
    <rect x="170" y="226" width="280" height="4" fill="#2c76b2"/>
    <rect x="490" y="130" width="150" height="150" fill="#07101f"/><rect x="500" y="140" width="130" height="130" fill="#223c6b" stroke="#88c1f0" stroke-width="2"/><rect x="560" y="200" width="10" height="20" rx="3" fill="#88c1f0"/>
    <rect x="80" y="200" width="20" height="80" rx="2" fill="#475362"/><circle cx="90" cy="190" r="14" fill="#88c1f0"/>
    <path d="M60 280h60" stroke="#88c1f0" stroke-width="4" opacity=".4"/>
    <rect x="200" y="252" width="30" height="28" fill="#2f5aa9"/><rect x="236" y="252" width="30" height="28" fill="#2f5aa9"/>
  </svg>`,
  stairwell: `<svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="800" height="350" fill="#bedaf0"/>
    <rect x="0" y="0" width="800" height="200" fill="#b2d3ed"/>
    <g fill="#95c1e5"><rect x="40" y="20" width="60" height="70"/><rect x="120" y="20" width="60" height="70"/><rect x="200" y="20" width="60" height="70"/></g>
    <rect x="0" y="200" width="800" height="150" fill="#4892ce"/>
    <g fill="#62a4da"><rect x="300" y="300" width="500" height="50"/><rect x="340" y="260" width="460" height="40"/><rect x="380" y="220" width="420" height="40"/><rect x="420" y="180" width="380" height="40"/><rect x="460" y="140" width="340" height="40"/></g>
    <g fill="#2c76b2"><rect x="300" y="296" width="500" height="6"/><rect x="340" y="256" width="460" height="6"/><rect x="380" y="216" width="420" height="6"/><rect x="420" y="176" width="380" height="6"/><rect x="460" y="136" width="340" height="6"/></g>
    <path d="M300 290L460 130" stroke="#07101f" stroke-width="8" stroke-linecap="round"/>
    <g stroke="#07101f" stroke-width="4"><path d="M320 290v-20M360 250v-20M400 210v-20M440 170v-20"/></g>
    <rect x="60" y="120" width="120" height="180" fill="#2c76b2"/><rect x="70" y="130" width="100" height="160" fill="#4892ce"/><rect x="80" y="140" width="80" height="60" fill="#2c76b2"/><rect x="80" y="210" width="80" height="70" fill="#2c76b2"/><circle cx="150" cy="212" r="5" fill="#88c1f0"/>
    <rect x="96" y="150" width="48" height="18" rx="2" fill="#f3f8ff"/><text x="120" y="163" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#07101f">WEBER</text>
    <rect x="200" y="140" width="60" height="14" rx="3" fill="#2373b5"/><rect x="220" y="154" width="20" height="60" fill="#8796a8"/>
    <circle cx="640" cy="60" r="22" fill="#88c1f0"/><rect x="636" y="20" width="8" height="20" fill="#07101f"/>
  </svg>`,
});
/* ---------- The course map (§18) ----------
   Two lessons per station (part 1 and 2 of one topic, 10–14 new words each); stations are real Berlin stops.
   Review stops follow every 4th lesson (two topics). Chapters every 12 lessons (six stations), each with a landmark silhouette. Icons: one style, viewBox 0 0 64 64,
   light from top-left (white highlight at .45), one soft shadow ellipse, max 4 colours. */
const COURSE = [
  { n: 1, station: 'Hermannplatz', topic: 'Greetings', icon: 'hand', part: 1 },
  { n: 2, station: 'Hermannplatz', topic: 'Your name', icon: 'hand', part: 2 },
  { n: 3, station: 'Görlitzer Bahnhof', topic: 'Who is who', icon: 'people', part: 1 },
  { n: 4, station: 'Görlitzer Bahnhof', topic: 'Countries and languages', icon: 'people', part: 2 },
  { n: 5, station: 'Mehringdamm', topic: 'Verbs for living', icon: 'pencil', part: 1 },
  { n: 6, station: 'Mehringdamm', topic: 'Verbs for doing', icon: 'pencil', part: 2 },
  { n: 7, station: 'Südstern', topic: 'Question words', icon: 'question', part: 1 },
  { n: 8, station: 'Südstern', topic: 'Yes, no and answers', icon: 'question', part: 2 },
  { n: 9, station: 'Boddinstraße', topic: 'Numbers 0–10', icon: 'brezel', part: 1 },
  { n: 10, station: 'Boddinstraße', topic: 'Numbers 11–20', icon: 'brezel', part: 2 },
  { n: 11, station: 'Schönleinstraße', topic: 'Joining words', icon: 'puzzle', part: 1 },
  { n: 12, station: 'Schönleinstraße', topic: 'Not and very', icon: 'puzzle', part: 2 },
  { n: 13, station: 'Kottbusser Tor', topic: 'Drinks', icon: 'coffee', part: 1 },
  { n: 14, station: 'Kottbusser Tor', topic: 'Food', icon: 'coffee', part: 2 },
  { n: 15, station: 'Karl-Marx-Straße', topic: 'Ordering', icon: 'coffee', part: 1 },
  { n: 16, station: 'Karl-Marx-Straße', topic: 'Paying', icon: 'coffee', part: 2 },
  { n: 17, station: 'Schönhauser Allee', topic: 'Rooms', icon: 'key', part: 1 },
  { n: 18, station: 'Schönhauser Allee', topic: 'Furniture and es gibt', icon: 'key', part: 2 },
  { n: 19, station: 'Alexanderplatz', topic: 'The clock', icon: 'clock', part: 1 },
  { n: 20, station: 'Alexanderplatz', topic: 'Times of day', icon: 'clock', part: 2 },
  { n: 21, station: 'Rosenthaler Platz', topic: 'The week', icon: 'calendar', part: 1 },
  { n: 22, station: 'Rosenthaler Platz', topic: 'The months', icon: 'calendar', part: 2 },
  { n: 23, station: 'Senefelderplatz', topic: 'Close family', icon: 'frame', part: 1 },
  { n: 24, station: 'Senefelderplatz', topic: 'My family', icon: 'frame', part: 2 },
  { n: 25, station: 'Eberswalder Straße', topic: 'Jobs', icon: 'laptop', part: 1 },
  { n: 26, station: 'Eberswalder Straße', topic: 'Study and office', icon: 'laptop', part: 2 },
  { n: 27, station: 'Zoologischer Garten', topic: 'Vehicles', icon: 'ticket', part: 1 },
  { n: 28, station: 'Zoologischer Garten', topic: 'Tickets and stops', icon: 'ticket', part: 2 },
  { n: 29, station: 'Wittenbergplatz', topic: 'Asking the way', icon: 'signpost', part: 1 },
  { n: 30, station: 'Wittenbergplatz', topic: 'Places on the way', icon: 'signpost', part: 2 },
  { n: 31, station: 'Kurfürstendamm', topic: 'Clothes', icon: 'bag', part: 1 },
  { n: 32, station: 'Kurfürstendamm', topic: 'Prices and sizes', icon: 'bag', part: 2 },
  { n: 33, station: 'Uhlandstraße', topic: 'Quantities', icon: 'bag', part: 1 },
  { n: 34, station: 'Uhlandstraße', topic: 'The shopping list', icon: 'bag', part: 2 },
  { n: 35, station: 'Nollendorfplatz', topic: 'The body', icon: 'plaster', part: 1 },
  { n: 36, station: 'Nollendorfplatz', topic: 'At the doctor', icon: 'plaster', part: 2 },
  { n: 37, station: 'Bülowstraße', topic: 'Morning', icon: 'alarm', part: 1 },
  { n: 38, station: 'Bülowstraße', topic: 'Evening', icon: 'alarm', part: 2 },
  { n: 39, station: 'Gleisdreieck', topic: 'Hobbies', icon: 'bike', part: 1 },
  { n: 40, station: 'Gleisdreieck', topic: 'Sport and music', icon: 'bike', part: 2 },
  { n: 41, station: 'Tempelhof', topic: 'Weather', icon: 'umbrella', part: 1 },
  { n: 42, station: 'Tempelhof', topic: 'Seasons', icon: 'umbrella', part: 2 },
  { n: 43, station: 'Potsdamer Platz', topic: 'Can', icon: 'stairs', part: 1 },
  { n: 44, station: 'Potsdamer Platz', topic: 'Must and want', icon: 'stairs', part: 2 },
  { n: 45, station: 'Anton-Wilhelm-Amo-Straße', topic: 'Inviting', icon: 'bulb', part: 1 },
  { n: 46, station: 'Anton-Wilhelm-Amo-Straße', topic: 'Accepting and declining', icon: 'bulb', part: 2 },
  { n: 47, station: 'Hauptbahnhof', topic: 'By train', icon: 'suitcase', part: 1 },
  { n: 48, station: 'Hauptbahnhof', topic: 'At the airport', icon: 'suitcase', part: 2 },
  { n: 49, station: 'Zoologischer Garten', topic: 'Booking a room', icon: 'key', part: 1 },
  { n: 50, station: 'Zoologischer Garten', topic: 'At the hotel', icon: 'key', part: 2 },
  { n: 51, station: 'Friedrichstraße', topic: 'Forms', icon: 'frame', part: 1 },
  { n: 52, station: 'Friedrichstraße', topic: 'Messages', icon: 'frame', part: 2 },
  { n: 53, station: 'Spittelmarkt', topic: 'Dates', icon: 'calendar', part: 1 },
  { n: 54, station: 'Spittelmarkt', topic: 'Birthdays', icon: 'calendar', part: 2 },
  { n: 55, station: 'Warschauer Straße', topic: 'Colours', icon: 'puzzle', part: 1 },
  { n: 56, station: 'Warschauer Straße', topic: 'Big, small, old, new', icon: 'puzzle', part: 2 },
  { n: 57, station: 'Moritzplatz', topic: 'Public places', icon: 'signpost', part: 1 },
  { n: 58, station: 'Moritzplatz', topic: 'Shops and services', icon: 'signpost', part: 2 },
  { n: 59, station: 'Schlesisches Tor', topic: 'Please repeat', icon: 'lifebuoy', part: 1 },
  { n: 60, station: 'Schlesisches Tor', topic: 'Spelling and understanding', icon: 'lifebuoy', part: 2 },
];
const CHAPTERS = [
  { from: 1, de: 'Kapitel 1 · Ankommen', en: 'Arriving', mark: 'oberbaum' },
  { from: 13, de: 'Kapitel 2 · Alltag', en: 'Everyday life', mark: 'fernsehturm' },
  { from: 25, de: 'Kapitel 3 · Unterwegs', en: 'Out and about', mark: 'tor' },
  { from: 37, de: 'Kapitel 4 · Freizeit', en: 'Free time', mark: 'reichstag' },
  { from: 49, de: 'Kapitel 5 · Selbstständig', en: 'On your own', mark: 'oberbaum' },
];
const REVIEW_EVERY = 4;
/* ---------- Protoa's line on Today, one per built-in lesson ----------
   What Protoa has noticed about the next scene, before you start it: a detail from the intro that makes
   you want to go in, never the twist. Simple German, the English under it. Story keeps these
   (docs/curriculum/story.md, "Protoa's voice"); a lesson without a line falls back to who or where. */
const PROTOA_TODAY = {
  1: ['Dein erster Tag im Kurs. Sag einfach: Guten Tag.', 'Your first day in class. Just say: Guten Tag.'],
  2: ['Herr Weber hat eine Liste. Dein Name steht auch drauf.', 'Herr Weber has a list. Your name is on it too.'],
  3: ['Neun Uhr sieben. Jemand kommt zu spät, mit Mehl am Ärmel.', 'Seven past nine. Someone is late, with flour on her sleeve.'],
  4: ['Neben der Tafel hängt etwas Neues.', 'Something new is hanging beside the board.'],
  5: ['Pause. Ana will Kaffee, aber die Schlange ist lang.', 'Break. Ana wants coffee, but the queue is long.'],
  6: ['Am Dienstag gab es keinen Kaffee. Heute vielleicht.', 'On Tuesday there was no coffee. Today, maybe.'],
  7: ['Heute fragst du. Und Herr Webers Telefon liegt neben der Kreide.', 'Today you ask the questions. And Herr Weber’s phone is lying next to the chalk.'],
  8: ['Anas Stuhl ist leer. Lena will wissen, warum.', 'Ana’s chair is empty. Lena wants to know why.'],
  9: ['Sieben Stühle. Einer ist leer.', 'Seven chairs. One is empty.'],
  10: ['Alle schreiben ihre Nummer auf. Fast alle.', 'Everyone writes down their number. Almost everyone.'],
  11: ['Lena will Kaffee Nummer drei. Ana hat eine andere Idee.', 'Lena wants coffee number three. Ana has another idea.'],
  12: ['Herr Weber hat ein Blatt Papier. Und kein Lächeln.', 'Herr Weber has a sheet of paper. And no smile.'],
  13: ['Lena hat zehn Minuten. Sie bestellt für alle.', 'Lena has ten minutes. She orders for everyone.'],
  14: ['Markt am Maybachufer. Anas Liste ist auf Spanisch.', 'The market at Maybachufer. Ana’s list is in Spanish.']
};
const courseOf = n => COURSE.find(c => c.n === n) || { n, station: 'Station ' + n, topic: 'Lesson ' + n, icon: 'question' };

const SH = '<ellipse cx="32" cy="57" rx="17" ry="3.2" fill="#07101f" opacity=".13"/>';
const HI = o => `<g fill="#ffffff" opacity=".45">${o}</g>`;
const ICON = {
  hand: `<svg viewBox="0 0 64 64">${SH}<g transform="rotate(-12 32 34)" fill="#90c4ee"><rect x="19" y="30" width="26" height="22" rx="10"/><rect x="19" y="13" width="6.5" height="24" rx="3.25"/><rect x="26.5" y="9" width="6.5" height="27" rx="3.25"/><rect x="34" y="10" width="6.5" height="26" rx="3.25"/><rect x="41.5" y="15" width="6" height="21" rx="3"/><rect x="9" y="31" width="16" height="7.5" rx="3.75" transform="rotate(-38 17 35)"/></g><path d="M23 49c4 3 12 3 18 0" stroke="#65aae1" stroke-width="3" fill="none" stroke-linecap="round" transform="rotate(-12 32 34)"/>${HI('<rect x="21" y="16" width="2.4" height="10" rx="1.2" transform="rotate(-12 32 34)"/>')}<path d="M49 9q7 6 5 15M54 5q9 9 6 20" stroke="#88c3f3" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  people: `<svg viewBox="0 0 64 64">${SH}<g fill="#2b549f"><circle cx="41" cy="21" r="8"/><path d="M27 51c0-10 6-16 14-16s14 6 14 16z"/></g><g fill="#88c3f3"><circle cx="25" cy="25" r="9"/><path d="M9 55c0-11 7-18 16-18s16 7 16 18z"/></g>${HI('<circle cx="22" cy="22" r="3"/><circle cx="38.5" cy="18.5" r="2.4"/>')}</svg>`,
  pencil: `<svg viewBox="0 0 64 64">${SH}<g transform="rotate(-40 32 32)"><rect x="12" y="25" width="34" height="13" rx="2" fill="#88c3f3"/><rect x="12" y="34" width="34" height="4" fill="#59abef"/><path d="M46 25l12 6.5L46 38z" fill="#90c4ee"/><path d="M54.5 29.6L58 31.5l-3.5 1.9z" fill="#07101f"/><rect x="5" y="25" width="8" height="13" rx="3" fill="#4197de"/><rect x="11" y="25" width="3" height="13" fill="#07101f"/>${HI('<rect x="15" y="27" width="28" height="2.6" rx="1.3"/>')}</g></svg>`,
  question: `<svg viewBox="0 0 64 64">${SH}<path d="M14 10h36a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H30l-11 9v-9h-5a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z" fill="#2b549f"/><path d="M25 22.5a7 7 0 1 1 10.5 6c-2.5 1.5-3.5 2.6-3.5 5" stroke="#ffffff" stroke-width="4.4" fill="none" stroke-linecap="round"/><circle cx="32" cy="40" r="2.6" fill="#ffffff"/>${HI('<rect x="11" y="15" width="10" height="3" rx="1.5"/>')}</svg>`,
  brezel: `<svg viewBox="0 0 64 64">${SH}<g fill="none" stroke="#348fd9" stroke-width="7.5" stroke-linecap="round"><path d="M32 51C15 51 8 39 11 28 14 17 27 14 32 25 37 14 50 17 53 28 56 39 49 51 32 51"/><path d="M32 25C30 36 25 42 20 47M32 25C34 36 39 42 44 47"/></g><path d="M14 30c1-7 6-11 12-10" stroke="#ffffff" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/><g fill="#ffffff"><rect x="20" y="22" width="2.5" height="2" rx=".8"/><rect x="42" y="23" width="2.5" height="2" rx=".8"/><rect x="47" y="35" width="2.5" height="2" rx=".8"/><rect x="15" y="38" width="2.5" height="2" rx=".8"/><rect x="31" y="47" width="2.5" height="2" rx=".8"/></g></svg>`,
  puzzle: `<svg viewBox="0 0 64 64">${SH}<path d="M12 22h11a7 7 0 1 1 14 0h11v11a7 7 0 1 1 0 14v8H12z" fill="#3f9aa4"/><path d="M12 47h36v8H12z" fill="#35838c"/>${HI('<rect x="15" y="25" width="12" height="3" rx="1.5"/>')}</svg>`,
  coffee: `<svg viewBox="0 0 64 64">${SH}<ellipse cx="32" cy="52" rx="22" ry="5" fill="#b4d2eb"/><path d="M14 28h34v12a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z" fill="#2373b5"/><path d="M48 32h3a6 6 0 0 1 0 12h-4" stroke="#2373b5" stroke-width="4" fill="none"/><ellipse cx="31" cy="28" rx="17" ry="4" fill="#1f5887"/><path d="M25 8q4 5 0 10M33 6q4 5 0 10" stroke="#b4d2eb" stroke-width="3" fill="none" stroke-linecap="round"/>${HI('<rect x="18" y="33" width="3" height="12" rx="1.5"/>')}</svg>`,
  key: `<svg viewBox="0 0 64 64">${SH}<g transform="rotate(-35 32 32)"><path fill-rule="evenodd" d="M8 32a11 11 0 1 1 22 0 11 11 0 0 1-22 0zm6 0a5 5 0 1 0 10 0 5 5 0 0 0-10 0z" fill="#88c3f3"/><rect x="28" y="28.5" width="28" height="7" rx="3" fill="#88c3f3"/><rect x="44" y="35" width="5" height="8" rx="1.5" fill="#59abef"/><rect x="51" y="35" width="5" height="6" rx="1.5" fill="#59abef"/>${HI('<path d="M11 28a8 8 0 0 1 7-6" stroke="#ffffff" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="31" y="30" width="16" height="2" rx="1"/>')}</g></svg>`,
  clock: `<svg viewBox="0 0 64 64">${SH}<circle cx="32" cy="31" r="22" fill="#07101f"/><circle cx="32" cy="31" r="17" fill="#ffffff"/><g fill="#07101f"><rect x="31" y="16" width="2" height="4" rx="1"/><rect x="31" y="42" width="2" height="4" rx="1"/><rect x="17" y="30" width="4" height="2" rx="1"/><rect x="43" y="30" width="4" height="2" rx="1"/></g><path d="M32 31V21M32 31l8 5" stroke="#2373b5" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="31" r="2.6" fill="#2373b5"/>${HI('<path d="M15 24a19 19 0 0 1 10-11" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linecap="round"/>')}</svg>`,
  calendar: `<svg viewBox="0 0 64 64">${SH}<rect x="10" y="12" width="44" height="42" rx="8" fill="#ffffff"/><path d="M10 20a8 8 0 0 1 8-8h28a8 8 0 0 1 8 8v4H10z" fill="#2373b5"/><rect x="19" y="7" width="4" height="10" rx="2" fill="#07101f"/><rect x="41" y="7" width="4" height="10" rx="2" fill="#07101f"/><g fill="#b4d2eb"><rect x="16" y="30" width="7" height="6" rx="2"/><rect x="28" y="30" width="7" height="6" rx="2"/><rect x="16" y="41" width="7" height="6" rx="2"/><rect x="28" y="41" width="7" height="6" rx="2"/><rect x="40" y="41" width="7" height="6" rx="2"/></g><rect x="40" y="30" width="7" height="6" rx="2" fill="#88c3f3"/>${HI('<rect x="14" y="15" width="10" height="2.4" rx="1.2"/>')}</svg>`,
  frame: `<svg viewBox="0 0 64 64">${SH}<rect x="9" y="10" width="46" height="44" rx="6" fill="#3289d1"/><rect x="15" y="16" width="34" height="32" rx="3" fill="#b7c9ec"/><circle cx="26" cy="30" r="5" fill="#88c3f3"/><path d="M17 48c0-7 4-11 9-11s9 4 9 11z" fill="#88c3f3"/><circle cx="39" cy="28" r="5" fill="#2b549f"/><path d="M30 48c0-8 4-12 9-12s9 4 9 12z" fill="#2b549f"/>${HI('<rect x="12" y="13" width="14" height="2.4" rx="1.2"/>')}</svg>`,
  laptop: `<svg viewBox="0 0 64 64">${SH}<rect x="13" y="13" width="38" height="27" rx="4" fill="#07101f"/><rect x="17" y="17" width="30" height="19" rx="2" fill="#b7c9ec"/><path d="M6 44h52l-3 7a3 3 0 0 1-3 2H12a3 3 0 0 1-3-2z" fill="#a7bade"/><rect x="27" y="44" width="10" height="2" rx="1" fill="#07101f" opacity=".35"/><rect x="21" y="22" width="14" height="3" rx="1.5" fill="#2b549f"/><rect x="21" y="28" width="9" height="3" rx="1.5" fill="#2b549f" opacity=".6"/><circle cx="42" cy="30" r="3" fill="#88c3f3"/>${HI('<rect x="19" y="19" width="8" height="1.8" rx=".9"/>')}</svg>`,
  ticket: `<svg viewBox="0 0 64 64">${SH}<g transform="rotate(-10 32 32)"><path d="M8 18h48v9a5 5 0 0 0 0 10v9H8v-9a5 5 0 0 0 0-10z" fill="#ffffff"/><path d="M8 18h48v8H8z" fill="#88c3f3"/><rect x="14" y="31" width="10" height="10" rx="2.5" fill="#2b549f"/><text x="19" y="39.5" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="9" fill="#ffffff">U</text><text x="27" y="39.5" font-family="Arial,sans-serif" font-weight="800" font-size="8.5" fill="#07101f">AB</text><path d="M44 30v12" stroke="#07101f" stroke-width="1.6" stroke-dasharray="2 2"/>${HI('<rect x="12" y="20" width="16" height="2" rx="1"/>')}</g></svg>`,
  signpost: `<svg viewBox="0 0 64 64">${SH}<rect x="29" y="12" width="6" height="44" rx="3" fill="#246da8"/><path d="M14 16h28l7 6-7 6H14a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z" fill="#88c3f3"/><path d="M50 32H22l-7 6 7 6h28a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3z" fill="#2b549f"/>${HI('<rect x="15" y="18.5" width="16" height="2.2" rx="1.1"/><rect x="25" y="34.5" width="14" height="2.2" rx="1.1"/>')}</svg>`,
  bag: `<svg viewBox="0 0 64 64">${SH}<path d="M22 22v-4a10 10 0 0 1 20 0v4" stroke="#07101f" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M12 22h40l-3 30a4 4 0 0 1-4 3.6H19a4 4 0 0 1-4-3.6z" fill="#2373b5"/><path d="M12 22h40l-.6 6H12.6z" fill="#1d6097"/><circle cx="22" cy="28" r="2.2" fill="#07101f"/><circle cx="42" cy="28" r="2.2" fill="#07101f"/>${HI('<rect x="17" y="33" width="3" height="14" rx="1.5"/>')}</svg>`,
  plaster: `<svg viewBox="0 0 64 64">${SH}<g transform="rotate(-35 32 32)"><rect x="5" y="23" width="54" height="18" rx="9" fill="#90c4ee"/><rect x="23" y="23" width="18" height="18" fill="#6fb0e5"/><g fill="#4c98d7"><circle cx="28" cy="28" r="1.3"/><circle cx="36" cy="28" r="1.3"/><circle cx="28" cy="36" r="1.3"/><circle cx="36" cy="36" r="1.3"/><circle cx="32" cy="32" r="1.3"/></g>${HI('<rect x="10" y="26" width="10" height="2.4" rx="1.2"/>')}</g><path d="M50 12c2-3 7-2 7 2 0 4-7 7-7 7s-7-3-7-7c0-4 5-5 7-2z" fill="#2373b5"/></svg>`,
  alarm: `<svg viewBox="0 0 64 64">${SH}<path d="M9 18a9 9 0 0 1 14-7zM55 18a9 9 0 0 0-14-7z" fill="#07101f"/><circle cx="32" cy="34" r="20" fill="#2373b5"/><circle cx="32" cy="34" r="15" fill="#ffffff"/><path d="M32 34V24M32 34l6 4" stroke="#07101f" stroke-width="3" stroke-linecap="round"/><path d="M18 52l-4 4M46 52l4 4" stroke="#07101f" stroke-width="4" stroke-linecap="round"/>${HI('<path d="M16 28a17 17 0 0 1 8-10" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linecap="round"/>')}</svg>`,
  bike: `<svg viewBox="0 0 64 64">${SH}<g fill="none" stroke="#07101f" stroke-width="3.6"><circle cx="16" cy="40" r="11"/><circle cx="48" cy="40" r="11"/></g><path d="M16 40l10-16h16l6 16M26 24l8 16h-18M34 40l8-16" stroke="#88c3f3" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 20h8M40 18l4 0 2 4" stroke="#07101f" stroke-width="3.6" fill="none" stroke-linecap="round"/><circle cx="34" cy="40" r="2.5" fill="#07101f"/></svg>`,
  umbrella: `<svg viewBox="0 0 64 64">${SH}<path d="M6 32a26 22 0 0 1 52 0c-3-3-7-3-9 0-3-3-7-3-9 0-3-3-7-3-8 0-1-3-5-3-8 0-2-3-6-3-9 0-2-3-6-3-9 0z" fill="#2b549f"/><path d="M32 10v40a5 5 0 0 1-10 0" stroke="#07101f" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M32 10c-8 6-10 14-10 22M32 10c8 6 10 14 10 22" stroke="#234686" stroke-width="2" fill="none"/>${HI('<path d="M12 26a22 18 0 0 1 12-12" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linecap="round"/>')}<g fill="#7ca0e2"><path d="M12 44q2 4 0 6q-2-2 0-6z"/><path d="M50 42q2 4 0 6q-2-2 0-6z"/></g></svg>`,
  stairs: `<svg viewBox="0 0 64 64">${SH}<path d="M8 54V44h12V34h12V24h12V14h12v40z" fill="#3f9aa4"/><path d="M8 44h12M20 34h12M32 24h12M44 14h12" stroke="#35838c" stroke-width="3"/><path d="M50 14V4l9 3.5-9 3.5" fill="#88c3f3"/><path d="M50 14V4" stroke="#07101f" stroke-width="2"/>${HI('<rect x="10" y="46" width="8" height="2" rx="1"/><rect x="22" y="36" width="8" height="2" rx="1"/>')}</svg>`,
  bulb: `<svg viewBox="0 0 64 64">${SH}<path d="M32 8a17 17 0 0 1 10 31v6H22v-6A17 17 0 0 1 32 8z" fill="#88c3f3"/><rect x="22" y="45" width="20" height="5" rx="2" fill="#07101f"/><rect x="25" y="50" width="14" height="5" rx="2.5" fill="#07101f" opacity=".75"/><path d="M28 38v-8l4 3 4-3v8" stroke="#59abef" stroke-width="2.4" fill="none" stroke-linejoin="round"/><path d="M8 24h-4M60 24h-4M14 8l-3-3M50 8l3-3" stroke="#59abef" stroke-width="3" stroke-linecap="round"/>${HI('<path d="M22 22a11 11 0 0 1 6-9" stroke="#ffffff" stroke-width="2.8" fill="none" stroke-linecap="round"/>')}</svg>`,
  suitcase: `<svg viewBox="0 0 64 64">${SH}<path d="M24 18v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" stroke="#07101f" stroke-width="3.6" fill="none"/><rect x="8" y="18" width="48" height="36" rx="7" fill="#3289d1"/><rect x="19" y="18" width="5" height="36" fill="#246da8"/><rect x="40" y="18" width="5" height="36" fill="#246da8"/><rect x="27" y="30" width="10" height="7" rx="2" fill="#88c3f3"/>${HI('<rect x="11" y="22" width="5" height="2.4" rx="1.2"/>')}</svg>`,
  lifebuoy: `<svg viewBox="0 0 64 64">${SH}<circle cx="32" cy="31" r="18" fill="none" stroke="#ffffff" stroke-width="11"/><circle cx="32" cy="31" r="18" fill="none" stroke="#2373b5" stroke-width="11" stroke-dasharray="14.14 14.14" transform="rotate(-22 32 31)"/><circle cx="32" cy="31" r="23.5" fill="none" stroke="#07101f" stroke-width="1.6" stroke-dasharray="5 4"/><path d="M18 18a19 19 0 0 1 8-5" stroke="#ffffff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/></svg>`,
  chain: `<svg viewBox="0 0 64 64">${SH}<rect x="6" y="22" width="30" height="18" rx="9" fill="none" stroke="#2b549f" stroke-width="6" transform="rotate(-25 21 31)"/><rect x="28" y="22" width="30" height="18" rx="9" fill="none" stroke="#88c3f3" stroke-width="6" transform="rotate(-25 43 31)"/><path d="M30 24l4 9" stroke="#2b549f" stroke-width="6" stroke-linecap="round"/></svg>`,
  sound: `<svg viewBox="0 0 64 64">${SH}<path d="M10 25h9l13-11v36L19 39h-9a3 3 0 0 1-3-3V28a3 3 0 0 1 3-3z" fill="#07101f"/><path d="M40 24a10 10 0 0 1 0 16M46 18a18 18 0 0 1 0 28" stroke="#88c3f3" stroke-width="4.4" fill="none" stroke-linecap="round"/>${HI('<rect x="10" y="28" width="2.4" height="8" rx="1.2"/>')}</svg>`,
  review: `<svg viewBox="0 0 64 64"><path d="M47 25A16 16 0 0 0 18 22" stroke="currentColor" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M17 39a16 16 0 0 0 29 3" stroke="currentColor" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M12 14l6 10 9-6zM52 50l-6-10-9 6z" fill="currentColor"/></svg>`,
  terminus: `<svg viewBox="0 0 64 64">${SH}<path d="M18 54V10" stroke="#07101f" stroke-width="4" stroke-linecap="round"/><path d="M20 10h30l-6 9 6 9H20z" fill="#88c3f3"/><text x="33" y="23.5" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="10" fill="#07101f">B1</text>${HI('<rect x="22" y="12" width="12" height="2" rx="1"/>')}</svg>`,
};
const LOCK_SVG = '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="3" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#07101f" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// top-down U-Bahn car, pointing along +x; rotated to the line's tangent on the map
const TRAIN_SVG = '<g class="train-car"><ellipse cx="0" cy="3" rx="31" ry="13" fill="#07101f" opacity=".18"/><rect x="-29" y="-11" width="58" height="22" rx="10" fill="#88c3f3"/><rect x="-29" y="-11" width="58" height="22" rx="10" fill="none" stroke="#59abef" stroke-width="2"/><rect x="-22" y="-5.5" width="40" height="11" rx="4" fill="#59abef" opacity=".55"/><rect x="20" y="-8" width="6" height="16" rx="3" fill="#07101f"/><rect x="-26" y="-8" width="4" height="16" rx="2" fill="#07101f" opacity=".7"/><g fill="#07101f"><rect x="-18" y="-11" width="7" height="2.4" rx="1"/><rect x="-6" y="-11" width="7" height="2.4" rx="1"/><rect x="6" y="-11" width="7" height="2.4" rx="1"/><rect x="-18" y="8.6" width="7" height="2.4" rx="1"/><rect x="-6" y="8.6" width="7" height="2.4" rx="1"/><rect x="6" y="8.6" width="7" height="2.4" rx="1"/></g><circle cx="27" cy="-6.5" r="1.6" fill="#ffffff"/><circle cx="27" cy="6.5" r="1.6" fill="#ffffff"/></g>';
// landmark silhouettes (single colour, drawn faint behind the map), 120 units tall
const LANDMARK = {
  fernsehturm: '<rect x="56" y="4" width="2" height="22"/><rect x="54" y="22" width="6" height="16" rx="2"/><circle cx="57" cy="46" r="12"/><rect x="55" y="40" width="4" height="10"/><path d="M52 56h10l3 64H49z"/><path d="M36 120l14-22h14l14 22z"/>',
  tor: '<rect x="8" y="44" width="104" height="10"/><rect x="14" y="36" width="92" height="9"/><path d="M48 36l12-14 12 14z"/><rect x="56" y="16" width="8" height="8" rx="2"/><g><rect x="14" y="54" width="7" height="66"/><rect x="29" y="54" width="7" height="66"/><rect x="44" y="54" width="7" height="66"/><rect x="69" y="54" width="7" height="66"/><rect x="84" y="54" width="7" height="66"/><rect x="99" y="54" width="7" height="66"/></g><rect x="8" y="116" width="104" height="4"/>',
  oberbaum: '<path d="M0 80h120v12H0z"/><path d="M6 92a10 10 0 0 1 20 0zM30 92a10 10 0 0 1 20 0zM70 92a10 10 0 0 1 20 0zM94 92a10 10 0 0 1 20 0z" transform="translate(0 0)"/><rect x="0" y="92" width="6" height="28"/><rect x="26" y="92" width="4" height="28"/><rect x="50" y="92" width="20" height="28"/><rect x="90" y="92" width="4" height="28"/><rect x="114" y="92" width="6" height="28"/><rect x="40" y="38" width="12" height="42"/><rect x="68" y="38" width="12" height="42"/><path d="M38 38l8-20 8 20zM66 38l8-20 8 20z"/><rect x="42" y="50" width="8" height="2"/><rect x="70" y="50" width="8" height="2"/>',
  reichstag: '<path d="M30 48a30 26 0 0 1 60 0z"/><rect x="8" y="52" width="104" height="68"/><rect x="2" y="46" width="22" height="74"/><rect x="96" y="46" width="22" height="74"/><rect x="36" y="56" width="48" height="6"/><g fill-opacity="0"><rect x="40" y="66" width="6" height="40"/></g>',
};
