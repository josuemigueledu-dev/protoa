/* ============================================================
   WEG — CONTENT & CONVENTIONS (read before adding a lesson)
   ------------------------------------------------------------
   Lesson data shape (every later lesson copies Lesson 1 exactly):
   {
     n, title (English), theme (German), scene:{id, place, time, cap, intro:[...]},
     notice:{de, g, q, note, grammar},  can:"...",
     words:[{de, en:[...], type:'n'|'v'|'adj'|'adv'|'prep'|'phrase'|'interj'|'conj'|'pron',
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

/* ---------- Lesson 1: Greetings ---------- */
const LESSONS = [
{
  n: 1, title: 'Greetings', theme: 'Begrüßung',
  scene: { id: 'classroom', plate: 'plate.classroom', cast: [{ id: 'cast.weber', x: 1200 }], place: 'Volkshochschule am Hermannplatz', time: 'Tuesday, 9:00', cap: 'Hermannplatz · Dienstag, 9:00',
    intro: [
      'Tuesday, 9:00. Room 2.04 at the Volkshochschule, and the first German course of your life. Herr Weber is writing the date on the board.',
      'Today is only greetings: hello, goodbye, how are you, thank you. Then his phone rings.' ] },
  notice: { de: 'Guten Tag, Frau Klein. Hallo, Tom!', g: 'Guten Tag,=hello (formal) | Frau=Mrs | Klein.=Klein | Hallo,=hi | Tom!=Tom',
    q: 'Frau Klein gets "Guten Tag" and Tom gets "Hallo". What do you think decides which one to use?',
    note: 'German greetings sort people into two groups. A teacher, a shop assistant or someone you meet for the first time gets <em>Guten Morgen</em> (until about 10 or 11), <em>Guten Tag</em> and <em>Auf Wiedersehen</em>. Friends and classmates get <em>Hallo</em> and <em>Tschüss</em>. Spanish does the same with <em>buenos días</em> and <em>hola</em>.', grammar: 'greet' },
  can: 'greet and say goodbye, ask "How are you?" and answer it, thank someone, and excuse yourself politely.',
  sound: { focus: 'ü', mouth: 'mouth.round-ue', say: 'Say "ee", then round your lips without moving your tongue.', words: [['Tschüss', 'bye'], ['für', 'for'], ['Tür', 'door']] },
  words: [
    { de: 'Hallo', en: ['hello', 'hi'], type: 'interj', ipa: 'haˈloː', resp: 'ha·LO', syl: 'Hal·lo', ex: '[Hallo], ich bin Tom.', exEn: 'Hi, I am Tom.', exG: 'Hallo,=hi | ich=I | bin=am | Tom.=Tom' },
    { de: 'Guten Morgen', en: ['good morning'], type: 'phrase', ipa: 'ˌɡuːtn̩ ˈmɔʁɡn̩', resp: 'GOO·ten MOR·gen', syl: 'Gu·ten Mor·gen', ex: '[Guten Morgen], Herr Weber!', exEn: 'Good morning, Mr Weber!', exG: 'Guten Morgen,=good morning | Herr=Mr | Weber!=Weber' },
    { de: 'Guten Tag', en: ['hello', 'good day', 'good afternoon'], type: 'phrase', ipa: 'ˌɡuːtn̩ ˈtaːk', resp: 'GOO·ten TAHK', syl: 'Gu·ten Tag', ex: '[Guten Tag], Frau Klein.', exEn: 'Hello, Mrs Klein.', exG: 'Guten Tag,=hello (formal) | Frau=Mrs | Klein.=Klein' },
    { de: 'Wie geht\'s?', en: ['how are you (informal)', 'how are you'], type: 'phrase', ipa: 'viː ˈɡeːts', resp: 'vee GAYTS', syl: 'Wie geht\'s', ex: 'Hallo, Tom! [Wie geht\'s]?', exEn: 'Hi, Tom! How are you?', exG: 'Hallo,=hi | Tom!=Tom | Wie geht\'s?=how are you (informal)' },
    { de: 'Tschüss', en: ['bye'], type: 'phrase', ipa: 'tʃʏs', resp: 'CHÜSS', syl: 'Tschüss', ex: '[Tschüss], bis bald!', exEn: 'Bye, see you soon!', exG: 'Tschüss,=bye | bis bald!=see you soon' },
    { de: 'Auf Wiedersehen', en: ['goodbye'], type: 'phrase', ipa: 'aʊ̯f ˈviːdɐˌzeːən', resp: 'owf VEE·der·zay·en', syl: 'Auf Wie·der·se·hen', ex: '[Auf Wiedersehen], Herr Weber.', exEn: 'Goodbye, Mr Weber.', exG: 'Auf Wiedersehen,=goodbye | Herr=Mr | Weber.=Weber' },
    { de: 'danke', en: ['thank you', 'thanks'], type: 'interj', ipa: 'ˈdaŋkə', resp: 'DAHNG·kuh', syl: 'dan·ke', ex: 'Gut, [danke].', exEn: 'Fine, thank you.', exG: 'Gut,=fine | danke.=thank you' },
    { de: 'bitte', en: ['please', "you're welcome"], type: 'interj', ipa: 'ˈbɪtə', resp: 'BIT·tuh', syl: 'bit·te', ex: 'Einen Moment, [bitte].', exEn: 'One moment, please.', exG: 'Einen Moment,=one moment | bitte.=please' },
    { de: 'Entschuldigung', en: ['excuse me', 'sorry'], type: 'interj', ipa: 'ɛntˈʃʊldɪɡʊŋ', resp: 'ent·SHUL·di·gung', syl: 'Ent·schul·di·gung', ex: '[Entschuldigung], Herr Weber!', exEn: 'Excuse me, Mr Weber!', exG: 'Entschuldigung,=excuse me | Herr=Mr | Weber!=Weber' },
    { de: 'Kein Problem', en: ['no problem', "that's fine"], type: 'phrase', ipa: 'kaɪ̯n pʁoˈbleːm', resp: 'kine pro·BLAYM', syl: 'Kein Pro·blem', ex: 'Danke! [Kein Problem].', exEn: 'Thanks! No problem.', exG: 'Danke!=thanks | Kein Problem.=no problem' },
    { de: 'gut', en: ['good', 'well', 'fine'], type: 'adj', ipa: 'ɡuːt', resp: 'GOOT', syl: 'gut', ex: 'Mir geht es [gut], danke.', exEn: 'I am fine, thank you.', exG: 'Mir geht es=I am | gut,=fine | danke.=thank you' },
    { de: 'und', en: ['and'], type: 'conj', ipa: 'ʊnt', resp: 'OONT', syl: 'und', ex: 'Gut, danke. [Und] Sie?', exEn: 'Fine, thanks. And you?', exG: 'Gut,=fine | danke.=thank you | Und=and | Sie?=you (formal)' },
  ],
  build: [
    { type: 'tiles', de: 'Guten Morgen, Herr Weber.', en: 'Good morning, Mr Weber.', g: 'Guten Morgen,=good morning | Herr=Mr | Weber.=Weber', extra: ['Tschüss'] },
    { type: 'gap', de: 'Hallo, wie geht\'s?', en: 'Hi, how are you?', g: 'Hallo,=hi | wie geht\'s?=how are you (informal)', gaps: [1] },
    { type: 'tiles', de: 'Einen Moment, bitte.', en: 'One moment, please.', g: 'Einen Moment,=one moment | bitte.=please', extra: ['danke'] },
    { type: 'tiles', de: 'Auf Wiedersehen, Frau Klein.', en: 'Goodbye, Mrs Klein.', g: 'Auf Wiedersehen,=goodbye | Frau=Mrs | Klein.=Klein', extra: ['Hallo'] },
  ],
  twist: { at: 4, event: 'event.phone', mood: 'surprised' },
  conv: [
    { w: 'Guten Morgen!', g: 'Guten Morgen!=good morning', mood: 'pleased' },
    { l: true, de: 'Guten Morgen, Herr Weber!', en: 'Good morning, Mr Weber!', g: 'Guten Morgen,=good morning | Herr=Mr | Weber!=Weber', type: 'tiles', gaps: [2,3], extra: ['Tschüss'], alts: ['Guten Morgen, Herr Weber.', 'Guten Morgen!', 'Guten Tag, Herr Weber!'], react: 'Bitte, setzen Sie sich.=please, take a seat' },
    { w: 'Wie geht es Ihnen heute?', g: 'Wie geht es Ihnen=how are you (formal) | heute?=today', mood: 'neutral' },
    { l: true, de: 'Gut, danke.', en: 'Fine, thank you.', g: 'Gut,=fine | danke.=thank you', type: 'translate', gaps: [0], extra: ['Hallo'], alts: ['Danke, gut.', 'Mir geht es gut, danke.', 'Es geht mir gut, danke.', 'Gut, danke!'], react: 'Das freut mich.=I am glad' },
    { w: 'Oh, Entschuldigung! Mein Handy. Einen Moment, bitte.', g: 'Oh,=oh | Entschuldigung!=excuse me | Mein=my | Handy.=phone | Einen Moment,=one moment | bitte.=please', mood: 'surprised' },
    { l: true, de: 'Kein Problem, Herr Weber.', en: 'No problem, Mr Weber.', g: 'Kein Problem,=no problem | Herr=Mr | Weber.=Weber', type: 'tiles', gaps: [0,1], extra: ['Danke'], alts: ['Kein Problem.', 'Kein Problem, Herr Weber!', 'Bitte, Herr Weber.'], react: 'Danke.=thanks' },
    { w: 'So. Das war\'s für heute. Auf Wiedersehen! Bis Donnerstag!', g: 'So.=right | Das war\'s=that was it | für=for | heute.=today | Auf Wiedersehen!=goodbye | Bis Donnerstag!=see you Thursday', mood: 'pleased' },
    { l: true, de: 'Auf Wiedersehen, Herr Weber!', en: 'Goodbye, Mr Weber!', g: 'Auf Wiedersehen,=goodbye | Herr=Mr | Weber!=Weber', type: 'tiles', gaps: [0,1], extra: ['Hallo'], alts: ['Auf Wiedersehen, Herr Weber.', 'Auf Wiedersehen!', 'Tschüss, Herr Weber!', 'Tschüss!'], react: 'Bis Donnerstag!=see you Thursday' },
  ],
  lex: {
    verbs: {},
    nouns: { 'Herr': 'm', 'Frau': 'f', 'Moment': 'm', 'Handy': 'n', 'Problem': 'n' },
    related: { 'Hallo': 'Guten Tag', 'Morgen': 'Tag', 'danke': 'bitte' },
    sep: {},
  },
},
{
  n: 2, title: 'Your name', theme: 'Name und Herkunft',
  scene: { id: 'classroom', plate: 'plate.classroom', cast: [{ id: 'cast.weber', x: 1200 }], place: 'Volkshochschule am Hermannplatz', time: 'Thursday, 9:00', cap: 'Raum 2.04 · Donnerstag, 9:00',
    intro: [
      'Thursday, 9:00, the same room. Herr Weber has a class list in his hand and is going through the names.',
      'Today you say who you are and where you come from. He is your teacher, so he gets Sie.' ] },
  notice: { de: 'Ich bin Herr Weber. Sie sind Student.', g: 'Ich=I | bin=am | Herr=Mr | Weber.=Weber | Sie=you (formal) | sind=are | Student.=(a) student',
    sketch: { type: 'swap', from: ['ich', 'bin'], to: ['Sie', 'sind'] },
    q: 'Both halves use the same verb, "to be". What happens to it when ich becomes Sie?',
    note: 'The verb changes with the person: <em>ich bin</em>, <em>Sie sind</em>. Capital-S <em>Sie</em> is the polite "you" for teachers, shop staff and anyone you do not know yet. It works like Spanish <em>usted</em>, but takes the plural verb: <em>Sie sind</em>.', grammar: 'sein' },
  can: 'give your name and where you are from, say what you are, and answer yes or no.',
  sound: { focus: 'ch after i / e', mouth: 'mouth.ich', say: 'A soft hiss, like the h in English "huge". It is not the Spanish j, and not a k.', words: [['ich', 'I'], ['mich', 'me'], ['nicht', 'not'], ['sprechen', 'to speak']] },
  warmup: ['Guten Morgen', 'danke', 'Tschüss', 'Entschuldigung'],
  words: [
    { de: 'Freut mich', en: ['nice to meet you', 'pleased to meet you'], type: 'phrase', ipa: 'fʁɔʏ̯t mɪç', resp: 'FROYT mikh', syl: 'Freut mich', ex: '[Freut mich], Frau Klein.', exEn: 'Nice to meet you, Mrs Klein.', exG: 'Freut mich,=nice to meet you | Frau=Mrs | Klein.=Klein' },
    { de: 'heißen', en: ['to be called', 'to be named'], type: 'v', ipa: 'ˈhaɪ̯sn̩', resp: 'HY·sen', syl: 'hei·ßen', ex: 'Ich [heiße] Anna.', exEn: 'My name is Anna.', exG: 'Ich heiße=my name is | Anna.=Anna', forms: { ich: 'heiße', du: 'heißt', er: 'heißt', wir: 'heißen', ihr: 'heißt', Sie: 'heißen' } },
    { de: 'sein', en: ['to be'], type: 'v', ipa: 'zaɪ̯n', resp: 'ZINE', syl: 'sein', ex: 'Ich [bin] Student.', exEn: 'I am a student.', exG: 'Ich=I | bin=am | Student.=(a) student', forms: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', Sie: 'sind' } },
    { de: 'kommen', en: ['to come'], type: 'v', ipa: 'ˈkɔmən', resp: 'KOM·en', syl: 'kom·men', ex: 'Maria [kommt] aus Madrid.', exEn: 'Maria comes from Madrid.', exG: 'Maria=Maria | kommt=comes | aus=from | Madrid.=Madrid', forms: { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', Sie: 'kommen' } },
    { de: 'aus', en: ['from', 'out of'], type: 'prep', ipa: 'aʊ̯s', resp: 'OWSS', syl: 'aus', ex: 'Ich komme [aus] Berlin.', exEn: 'I come from Berlin.', exG: 'Ich=I | komme=come | aus=from | Berlin.=Berlin' },
    { de: 'wie', en: ['how'], type: 'adv', ipa: 'viː', resp: 'VEE', syl: 'wie', ex: '[Wie] heißen Sie?', exEn: 'What is your name?', exG: 'Wie=how | heißen=are called | Sie?=you (formal)' },
    { de: 'woher', en: ['where from'], type: 'adv', ipa: 'voˈheːɐ̯', resp: 'vo·HAIR', syl: 'wo·her', ex: '[Woher] kommen Sie?', exEn: 'Where are you from?', exG: 'Woher=where from | kommen=come | Sie?=you (formal)' },
    { de: 'ja', en: ['yes'], type: 'interj', ipa: 'jaː', resp: 'YAH', syl: 'ja', ex: '[Ja], ich bin Student.', exEn: 'Yes, I am a student.', exG: 'Ja,=yes | ich=I | bin=am | Student.=(a) student' },
    { de: 'nein', en: ['no'], type: 'interj', ipa: 'naɪ̯n', resp: 'NINE', syl: 'nein', ex: '[Nein], ich komme aus Berlin.', exEn: 'No, I come from Berlin.', exG: 'Nein,=no | ich=I | komme=come | aus=from | Berlin.=Berlin' },
    { de: 'der Lehrer', en: ['teacher'], type: 'n', g: 'm', pl: 'die Lehrer', ipa: 'ˈleːʁɐ', resp: 'LAY·ruh', syl: 'Leh·rer', ex: 'Herr Weber ist [der Lehrer].', exEn: 'Mr Weber is the teacher.', exG: 'Herr=Mr | Weber=Weber | ist=is | der=the | Lehrer.=teacher', pic: 'lehrer' },
    { de: 'der Student', en: ['student', 'university student'], type: 'n', g: 'm', pl: 'die Studenten', ipa: 'ʃtuˈdɛnt', resp: 'shtoo·DENT', syl: 'Stu·dent', ex: 'Paul ist [Student] in Berlin.', exEn: 'Paul is a student in Berlin.', exG: 'Paul=Paul | ist=is | Student=(a) student | in=in | Berlin.=Berlin', pic: 'student' },
    { de: 'die Stadt', en: ['city', 'town'], type: 'n', g: 'f', pl: 'die Städte', ipa: 'ʃtat', resp: 'SHTAT', syl: 'Stadt', ex: 'Berlin ist eine große [Stadt].', exEn: 'Berlin is a big city.', exG: 'Berlin=Berlin | ist=is | eine=a | große=big | Stadt.=city', pic: 'stadt' },
  ],
  build: [
    { type: 'tiles', de: 'Ich komme aus Berlin.', en: 'I come from Berlin.', g: 'Ich=I | komme=come | aus=from | Berlin.=Berlin', extra: ['kommen'] },
    { type: 'gap', de: 'Wie heißen Sie?', en: 'What is your name?', g: 'Wie=how | heißen=are called | Sie?=you (formal)', gaps: [1] },
    { type: 'tiles', de: 'Sie sind Student.', en: 'You are a student.', g: 'Sie=you (formal) | sind=are | Student.=(a) student', extra: ['bin'] },
    { type: 'gap', de: 'Woher kommen Sie?', en: 'Where are you from?', g: 'Woher=where from | kommen=come | Sie?=you (formal)', gaps: [0] },
    { type: 'tiles', de: 'Nein, ich bin Lehrer.', en: 'No, I am a teacher.', g: 'Nein,=no | ich=I | bin=am | Lehrer.=teacher', extra: ['sind'] },
  ],
  conv: [
    { w: 'Guten Morgen! Ich bin Herr Weber. Wie heißen Sie?', g: 'Guten Morgen!=good morning | Ich=I | bin=am | Herr=Mr | Weber.=Weber | Wie=how | heißen=are called | Sie?=you (formal)', mood: 'pleased' },
    { l: true, de: 'Guten Morgen! Ich heiße {name}.', en: 'Good morning! My name is {name}.', g: 'Guten Morgen!=good morning | Ich heiße=my name is | {name}.={name}', type: 'tiles', gaps: [2], extra: ['bin'], alts: ['Guten Morgen! Ich bin {name}.', 'Guten Tag! Ich heiße {name}.', 'Hallo! Ich heiße {name}.', 'Guten Morgen, ich heiße {name}.'], react: 'Freut mich.=nice to meet you' },
    { w: 'Freut mich, {name}. Woher kommen Sie?', g: 'Freut mich,=nice to meet you | {name}.={name} | Woher=where from | kommen=come | Sie?=you (formal)', mood: 'neutral' },
    { l: true, de: 'Ich komme aus {city}.', en: 'I come from {city}.', g: 'Ich=I | komme=come | aus=from | {city}.={city}', type: 'gap', gaps: [1], extra: ['kommen'], alts: ['Aus {city}.', 'Ich bin aus {city}.'], react: 'Aha, aus {city}.=ah, from {city}' },
    { w: 'Aus {city}, schön! Ich komme aus Berlin. Sind Sie Student?', g: 'Aus=from | {city},={city} | schön!=nice | Ich=I | komme=come | aus=from | Berlin.=Berlin | Sind=are | Sie=you (formal) | Student?=(a) student', mood: 'amused' },
    { l: true, de: 'Ja, ich bin Student.', en: 'Yes, I am a student.', g: 'Ja,=yes | ich=I | bin=am | Student.=(a) student', type: 'translate', gaps: [2], extra: ['sind'], alts: ['Ja, ich bin ein Student.', 'Ja. Ich bin Student.'], react: 'Gut zu wissen.=good to know' },
    { w: 'Und ich? Bin ich auch Student?', g: 'Und=and | ich?=I | Bin=am | ich=I | auch=too | Student?=(a) student', mood: 'amused' },
    { l: true, de: 'Nein, Sie sind Lehrer.', en: 'No, you are a teacher.', g: 'Nein,=no | Sie=you (formal) | sind=are | Lehrer.=teacher', type: 'tiles', gaps: [0,2], extra: ['bin', 'Student'], alts: ['Nein. Sie sind Lehrer.', 'Nein, Sie sind der Lehrer.', 'Nein, Sie sind Lehrer, Herr Weber.'], react: 'Stimmt.=that is right' },
    { w: 'Gut, dann bis Dienstag, {name}!', g: 'Gut,=good | dann=then | bis Dienstag,=until Tuesday | {name}!={name}', mood: 'pleased' },
    { l: true, de: 'Auf Wiedersehen, Herr Weber!', en: 'Goodbye, Mr Weber!', g: 'Auf Wiedersehen,=goodbye | Herr=Mr | Weber!=Weber', type: 'tiles', gaps: [0,1], extra: ['Hallo'], alts: ['Auf Wiedersehen, Herr Weber.', 'Auf Wiedersehen!', 'Tschüss, Herr Weber!', 'Bis Dienstag, Herr Weber!'], optional: true, react: 'Bis Dienstag!=see you Tuesday' },
  ],
  lex: {
    verbs: {
      'heißen': { ich: 'heiße', du: 'heißt', er: 'heißt', wir: 'heißen', ihr: 'heißt', Sie: 'heißen' },
      'sein': { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', Sie: 'sind' },
      'kommen': { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', Sie: 'kommen' },
    },
    nouns: { 'Lehrer': 'm', 'Student': 'm', 'Stadt': 'f', 'Herr': 'm' },
    related: { 'gehen': 'kommen', 'von': 'aus', 'bin': 'heiße', 'nicht': 'nein' },
    sep: {},
  },
},
{
  n: 3, title: 'Who is who', theme: 'Wer ist das?',
  scene: { id: 'classroom', plate: 'plate.classroom', cast: [{ id: 'cast.weber', x: 1200 }, { id: 'cast.ana', x: 900 }, { id: 'cast.lena', x: 640 }], place: 'Volkshochschule am Hermannplatz', time: 'Tuesday, 9:00', cap: 'Raum 2.04 · Dienstag, 9:00',
    intro: [
      'Tuesday again, 9:00, room 2.04. Herr Weber knows your name now. Next to you sits someone new: Ana, from Mexico City, who joined the course this morning.',
      'You are on first-name terms with the other students, so the word for "you" is du. Herr Weber still gets Sie.' ] },
  notice: { de: 'Das ist Ana. Sie kommt aus Mexiko-Stadt. Und du? Woher kommst du?', g: 'Das ist=this is | Ana.=Ana | Sie=she | kommt=comes | aus=from | Mexiko-Stadt.=Mexico City | Und=and | du?=you (informal) | Woher=where from | kommst=come | du?=you (informal)',
    sketch: { type: 'swap', from: ['sie', 'kommt'], to: ['du', 'kommst'] },
    q: 'Compare "Sie kommt" and "du kommst". Which part of the verb changed, and which part stayed the same?',
    note: 'The stem <em>komm-</em> stays; only the ending follows the person: <em>ich komme, du kommst, er/sie kommt, wir kommen, ihr kommt, sie/Sie kommen</em>. Unlike Spanish <em>vienes</em> or <em>viene</em>, the pronoun is never dropped. <em>sein</em> has its own forms: <em>bin, bist, ist, sind, seid, sind</em>. Capital <em>Sie</em> is "you" (formal) and lowercase <em>sie</em> is "she" or "they"; at the start of a sentence only the verb tells you which.', grammar: 'sein' },
  can: 'say who is who, use ich, du, er, sie, wir and ihr with sein and kommen, and introduce a person.',
  sound: { focus: 'ei / ie', say: 'Spanish readers swap them. <em>ei</em> sounds like English "eye" (mein, nein); <em>ie</em> is a long "ee" (wie, Sie). The second letter gives the sound.', words: [['mein', 'my'], ['nein', 'no'], ['wie', 'how'], ['Sie', 'you (formal)']] },
  warmup: ['heißen', 'kommen', 'woher', 'Freut mich'],
  words: [
    { de: 'du', en: ['you (informal)'], type: 'pron', ipa: 'duː', resp: 'DOO', syl: 'du', ex: 'Woher kommst [du], Ana?', exEn: 'Where are you from, Ana?', exG: 'Woher=where from | kommst=come | du,=you (informal) | Ana?=Ana' },
    { de: 'er', en: ['he'], type: 'pron', ipa: 'eːɐ̯', resp: 'AIR', syl: 'er', ex: '[Er] kommt aus Frankreich.', exEn: 'He comes from France.', exG: 'Er=he | kommt=comes | aus=from | Frankreich.=France' },
    { de: 'sie', en: ['she', 'they'], type: 'pron', ipa: 'ziː', resp: 'ZEE', syl: 'sie', ex: '[Sie] kommt aus Italien.', exEn: 'She comes from Italy.', exG: 'Sie=she | kommt=comes | aus=from | Italien.=Italy' },
    { de: 'wir', en: ['we'], type: 'pron', ipa: 'viːɐ̯', resp: 'VEER', syl: 'wir', ex: '[Wir] sind Studenten.', exEn: 'We are students.', exG: 'Wir=we | sind=are | Studenten.=students' },
    { de: 'ihr', en: ['you (plural, informal)', 'you all'], type: 'pron', ipa: 'iːɐ̯', resp: 'EER', syl: 'ihr', ex: 'Woher kommt [ihr]?', exEn: 'Where are you (all) from?', exG: 'Woher=where from | kommt=come | ihr?=you (plural, informal)' },
    { de: 'Das ist', en: ['this is', 'that is'], type: 'phrase', ipa: 'das ɪst', resp: 'dass IST', syl: 'Das ist', ex: '[Das ist] Ana.', exEn: 'This is Ana.', exG: 'Das ist=this is | Ana.=Ana' },
    { de: 'die Frau', en: ['woman', 'Mrs'], type: 'n', g: 'f', pl: 'die Frauen', ipa: 'fʁaʊ̯', resp: 'FROW', syl: 'Frau', ex: 'Das ist eine [Frau] aus Mexiko.', exEn: 'This is a woman from Mexico.', exG: 'Das ist=this is | eine=a | Frau=woman | aus=from | Mexiko.=Mexico', pic: 'frau' },
    { de: 'der Mann', en: ['man'], type: 'n', g: 'm', pl: 'die Männer', ipa: 'man', resp: 'MAN', syl: 'Mann', ex: 'Das ist ein [Mann] aus Italien.', exEn: 'This is a man from Italy.', exG: 'Das ist=this is | ein=a | Mann=man | aus=from | Italien.=Italy', pic: 'mann' },
    { de: 'der Freund', en: ['friend (male)', 'boyfriend'], type: 'n', g: 'm', pl: 'die Freunde', ipa: 'fʁɔʏ̯nt', resp: 'FROYNT', syl: 'Freund', ex: 'Das ist Tom, ein [Freund].', exEn: 'This is Tom, a friend.', exG: 'Das ist=this is | Tom,=Tom | ein=a | Freund.=friend', pic: 'freund' },
    { de: 'die Freundin', en: ['friend (female)', 'girlfriend'], type: 'n', g: 'f', pl: 'die Freundinnen', ipa: 'ˈfʁɔʏ̯ndɪn', resp: 'FROYN·din', syl: 'Freun·din', ex: 'Das ist Lena, eine [Freundin].', exEn: 'This is Lena, a friend.', exG: 'Das ist=this is | Lena,=Lena | eine=a | Freundin.=friend', pic: 'freundin' },
    { de: 'die Studentin', en: ['student (female)'], type: 'n', g: 'f', pl: 'die Studentinnen', ipa: 'ʃtuˈdɛntɪn', resp: 'shtoo·DEN·tin', syl: 'Stu·den·tin', ex: 'Ana ist [Studentin].', exEn: 'Ana is a student.', exG: 'Ana=Ana | ist=is | Studentin.=(a) student' },
    { de: 'nett', en: ['nice', 'kind'], type: 'adj', ipa: 'nɛt', resp: 'NET', syl: 'nett', ex: 'Herr Weber ist [nett].', exEn: 'Mr Weber is nice.', exG: 'Herr=Mr | Weber=Weber | ist=is | nett.=nice' },
  ],
  build: [
    { type: 'tiles', de: 'Er kommt aus Madrid.', en: 'He comes from Madrid.', g: 'Er=he | kommt=comes | aus=from | Madrid.=Madrid', extra: ['komme'] },
    { type: 'gap', de: 'Woher kommt ihr?', en: 'Where are you (all) from?', g: 'Woher=where from | kommt=come | ihr?=you (plural, informal)', gaps: [1] },
    { type: 'tiles', de: 'Wir sind Studenten.', en: 'We are students.', g: 'Wir=we | sind=are | Studenten.=students', extra: ['seid'] },
    { type: 'gap', de: 'Du bist nett.', en: 'You are nice.', g: 'Du=you (informal) | bist=are | nett.=nice', gaps: [1] },
    { type: 'tiles', de: 'Das ist Lena, eine Freundin.', en: 'This is Lena, a friend.', g: 'Das ist=this is | Lena,=Lena | eine=a | Freundin.=friend', extra: ['ein'] },
  ],
  conv: [
    { w: 'Guten Morgen, {name}. Wir haben heute eine neue Studentin. Das ist Ana.', g: 'Guten Morgen,=good morning | {name}.={name} | Wir=we | haben=have | heute=today | eine=a | neue=new | Studentin.=(female) student | Das ist=this is | Ana.=Ana', mood: 'pleased' },
    { l: true, de: 'Hallo, Ana! Woher kommst du?', en: 'Hi, Ana! Where are you from?', g: 'Hallo,=hi | Ana!=Ana | Woher=where from | kommst=come | du?=you (informal)', type: 'tiles', gaps: [3], extra: ['kommen', 'Sie'], alts: ['Hallo Ana, woher kommst du?', 'Hallo, Ana. Woher kommst du?'], rwho: 'cast.ana', react: 'Hallo, {name}!=hi, {name}' },
    { who: 'cast.ana', w: 'Ich komme aus Mexiko-Stadt. Und du?', g: 'Ich=I | komme=come | aus=from | Mexiko-Stadt.=Mexico City | Und=and | du?=you (informal)', mood: 'neutral' },
    { l: true, de: 'Ich komme aus {city}.', en: 'I come from {city}.', g: 'Ich=I | komme=come | aus=from | {city}.={city}', type: 'gap', gaps: [1], extra: ['kommst'], alts: ['Aus {city}.', 'Ich bin aus {city}.'], rwho: 'cast.ana', react: 'Ah, aus {city}.=ah, from {city}' },
    { w: 'Schön. Und das ist Lena.', g: 'Schön.=nice | Und=and | das ist=this is | Lena.=Lena', mood: 'pleased' },
    { who: 'cast.lena', w: 'Hallo, {name}! Ich komme aus Rom. Kommst du aus Berlin?', g: 'Hallo,=hi | {name}!={name} | Ich=I | komme=come | aus=from | Rom.=Rome | Kommst=come | du=you (informal) | aus=from | Berlin?=Berlin', mood: 'neutral' },
    { l: true, de: 'Nein, ich komme aus {city}.', en: 'No, I come from {city}.', g: 'Nein,=no | ich=I | komme=come | aus=from | {city}.={city}', type: 'gap', gaps: [2], extra: ['kommst'], alts: ['Nein, ich bin aus {city}.', 'Nein. Ich komme aus {city}.'], rwho: 'cast.lena', react: 'Aha, schön.=I see, nice' },
    { w: 'Jetzt eine Frage: Wer kommt aus Mexiko-Stadt?', g: 'Jetzt=now | eine=a | Frage:=question | Wer=who | kommt=comes | aus=from | Mexiko-Stadt?=Mexico City', mood: 'amused' },
    { l: true, de: 'Ana kommt aus Mexiko-Stadt.', en: 'Ana comes from Mexico City.', g: 'Ana=Ana | kommt=comes | aus=from | Mexiko-Stadt.=Mexico City', type: 'tiles', gaps: [1], extra: ['komme'], alts: ['Ana ist aus Mexiko-Stadt.', 'Sie kommt aus Mexiko-Stadt.', 'Ana kommt aus Mexiko-Stadt, Herr Weber.'], react: 'Richtig.=correct' },
    { w: 'Und wer kommt aus Rom?', g: 'Und=and | wer=who | kommt=comes | aus=from | Rom?=Rome', mood: 'neutral' },
    { l: true, de: 'Lena kommt aus Rom.', en: 'Lena comes from Rome.', g: 'Lena=Lena | kommt=comes | aus=from | Rom.=Rome', type: 'translate', gaps: [1], extra: ['kommst'], alts: ['Lena ist aus Rom.', 'Sie kommt aus Rom.', 'Lena kommt aus Rom, Herr Weber.'], react: 'Genau.=exactly' },
    { w: 'So, wir sind jetzt ein Kurs. Bis Donnerstag, Ana, Lena und {name}!', g: 'So,=right | wir=we | sind=are | jetzt=now | ein=a | Kurs.=course | Bis Donnerstag,=see you Thursday | Ana,=Ana | Lena=Lena | und=and | {name}!={name}', mood: 'pleased' },
    { l: true, de: 'Tschüss, Ana! Bis Donnerstag!', en: 'Bye, Ana! See you Thursday!', g: 'Tschüss,=bye | Ana!=Ana | Bis Donnerstag!=see you Thursday', type: 'tiles', gaps: [0], extra: ['Hallo'], alts: ['Tschüss, Ana.', 'Tschüss!', 'Tschüss, Ana! Bis Donnerstag.'], optional: true, rwho: 'cast.ana', react: 'Tschüss, {name}!=bye, {name}' },
  ],
  lex: {
    verbs: {
      'heißen': { ich: 'heiße', du: 'heißt', er: 'heißt', wir: 'heißen', ihr: 'heißt', Sie: 'heißen' },
      'sein': { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', Sie: 'sind' },
      'kommen': { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', Sie: 'kommen' },
    },
    nouns: { 'Frau': 'f', 'Mann': 'm', 'Freund': 'm', 'Freundin': 'f', 'Studentin': 'f', 'Student': 'm', 'Lehrer': 'm', 'Frage': 'f', 'Kurs': 'm' },
    related: { 'wo': 'woher', 'Freund': 'Freundin', 'er': 'sie' },
    sep: {},
  },
},
{
  n: 4, title: 'Countries and languages', theme: 'Länder und Sprachen',
  scene: { id: 'classroom', plate: 'plate.classroom', cast: [{ id: 'cast.weber', x: 1200 }, { id: 'cast.ana', x: 900 }, { id: 'cast.lena', x: 640 }], place: 'Volkshochschule am Hermannplatz', time: 'Thursday, 9:00', cap: 'Raum 2.04 · Donnerstag, 9:00',
    intro: [
      'Thursday, 9:00. Ana and Lena have taken the seats next to yours. Herr Weber has hung a map of Europe beside the board.',
      'Today he plays a guessing game with languages, then asks where everyone comes from.' ] },
  notice: { de: 'Lena kommt aus Italien. Ana kommt aus Mexiko.', g: 'Lena=Lena | kommt=comes | aus=from | Italien.=Italy | Ana=Ana | kommt=comes | aus=from | Mexiko.=Mexico',
    sketch: { type: 'swap', from: ['aus', 'Italien'], to: ['aus', 'Mexiko'] },
    q: 'Spanish says "de Italia" and "de México". Is there anything between aus and the country in German?',
    note: 'No article: <em>aus Italien</em>, <em>aus Mexiko</em>, <em>in Spanien</em>. Most countries need none. The few that do, like <em>die Schweiz</em>, come later. Many names are close to Spanish with a changed spelling: <em>Spanien</em> (España), <em>Mexiko</em> with k, <em>Frankreich</em> (Francia, literally "Frankish realm"). Languages are capitalised and end in <em>-isch</em>, except <em>Deutsch</em>.', grammar: 'sein' },
  can: 'name some countries and languages, say where people come from, and ask "this or that?" with oder.',
  sound: { focus: 'sp- at the start', say: 'At the start of a word, <em>sp-</em> sounds like "shp": <em>Spanien</em>, <em>Sprache</em>, <em>Spanisch</em>. Spanish has no "sh" here, so you will read it as "sp" at first.', words: [['Spanien', 'Spain'], ['Sprache', 'language'], ['Spanisch', 'Spanish'], ['Stadt', 'city']] },
  warmup: ['du', 'der Freund', 'die Frau', 'nett'],
  words: [
    { de: 'Deutschland', en: ['Germany'], type: 'phrase', ipa: 'ˈdɔʏ̯tʃlant', resp: 'DOYTCH·lant', syl: 'Deutsch·land', ex: 'Berlin ist in [Deutschland].', exEn: 'Berlin is in Germany.', exG: 'Berlin=Berlin | ist=is | in=in | Deutschland.=Germany' },
    { de: 'Spanien', en: ['Spain'], type: 'phrase', ipa: 'ˈʃpaːni̯ən', resp: 'SHPAH·ni·en', syl: 'Spa·ni·en', ex: 'Madrid ist in [Spanien].', exEn: 'Madrid is in Spain.', exG: 'Madrid=Madrid | ist=is | in=in | Spanien.=Spain' },
    { de: 'Mexiko', en: ['Mexico'], type: 'phrase', ipa: 'ˈmɛksiko', resp: 'MEK·si·ko', syl: 'Me·xi·ko', ex: 'Ana kommt aus [Mexiko].', exEn: 'Ana comes from Mexico.', exG: 'Ana=Ana | kommt=comes | aus=from | Mexiko.=Mexico' },
    { de: 'Frankreich', en: ['France'], type: 'phrase', ipa: 'ˈfʁaŋkʁaɪ̯ç', resp: 'FRANK·rikh', syl: 'Frank·reich', ex: 'Paris ist in [Frankreich].', exEn: 'Paris is in France.', exG: 'Paris=Paris | ist=is | in=in | Frankreich.=France' },
    { de: 'Italien', en: ['Italy'], type: 'phrase', ipa: 'iˈtaːli̯ən', resp: 'i·TAH·li·en', syl: 'I·ta·li·en', ex: 'Lena kommt aus [Italien].', exEn: 'Lena comes from Italy.', exG: 'Lena=Lena | kommt=comes | aus=from | Italien.=Italy' },
    { de: 'Deutsch', en: ['German'], type: 'phrase', ipa: 'dɔʏ̯tʃ', resp: 'DOYTCH', syl: 'Deutsch', ex: 'Das ist [Deutsch].', exEn: 'That is German.', exG: 'Das ist=that is | Deutsch.=German' },
    { de: 'Englisch', en: ['English'], type: 'phrase', ipa: 'ˈɛŋlɪʃ', resp: 'ENG·lish', syl: 'Eng·lisch', ex: 'Das ist [Englisch].', exEn: 'That is English.', exG: 'Das ist=that is | Englisch.=English' },
    { de: 'Spanisch', en: ['Spanish'], type: 'phrase', ipa: 'ˈʃpaːnɪʃ', resp: 'SHPAH·nish', syl: 'Spa·nisch', ex: 'Das ist [Spanisch].', exEn: 'That is Spanish.', exG: 'Das ist=that is | Spanisch.=Spanish' },
    { de: 'die Sprache', en: ['language'], type: 'n', g: 'f', pl: 'die Sprachen', ipa: 'ˈʃpʁaːxə', resp: 'SHPRAH·khuh', syl: 'Spra·che', ex: 'Spanisch ist eine schöne [Sprache].', exEn: 'Spanish is a beautiful language.', exG: 'Spanisch=Spanish | ist=is | eine=a | schöne=beautiful | Sprache.=language' },
    { de: 'der Kurs', en: ['course', 'class'], type: 'n', g: 'm', pl: 'die Kurse', ipa: 'kʊʁs', resp: 'KOORSS', syl: 'Kurs', ex: 'Wir sind im [Kurs].', exEn: 'We are in the course.', exG: 'Wir=we | sind=are | im=in the | Kurs.=course' },
    { de: 'neu', en: ['new'], type: 'adj', ipa: 'nɔʏ̯', resp: 'NOY', syl: 'neu', ex: 'Ana ist [neu] im Kurs.', exEn: 'Ana is new in the course.', exG: 'Ana=Ana | ist=is | neu=new | im=in the | Kurs.=course' },
    { de: 'auch', en: ['also', 'too'], type: 'adv', ipa: 'aʊ̯x', resp: 'OWKH', syl: 'auch', ex: 'Ich bin [auch] neu.', exEn: 'I am new too.', exG: 'Ich=I | bin=am | auch=too | neu.=new' },
    { de: 'oder', en: ['or'], type: 'conj', ipa: 'ˈoːdɐ', resp: 'OH·duh', syl: 'o·der', ex: 'Sind Sie Student [oder] Studentin?', exEn: 'Are you a (male) student or a (female) student?', exG: 'Sind=are | Sie=you (formal) | Student=student | oder=or | Studentin?=(female) student' },
  ],
  build: [
    { type: 'tiles', de: 'Ana kommt aus Mexiko.', en: 'Ana comes from Mexico.', g: 'Ana=Ana | kommt=comes | aus=from | Mexiko.=Mexico', extra: ['komme'] },
    { type: 'gap', de: 'Paris ist in Frankreich.', en: 'Paris is in France.', g: 'Paris=Paris | ist=is | in=in | Frankreich.=France', gaps: [1] },
    { type: 'tiles', de: 'Berlin ist in Deutschland.', en: 'Berlin is in Germany.', g: 'Berlin=Berlin | ist=is | in=in | Deutschland.=Germany', extra: ['Spanien'] },
    { type: 'gap', de: 'Ana ist auch neu.', en: 'Ana is new too.', g: 'Ana=Ana | ist=is | auch=too | neu.=new', gaps: [2] },
    { type: 'tiles', de: 'Ist das Spanisch oder Englisch?', en: 'Is that Spanish or English?', g: 'Ist=is | das=that | Spanisch=Spanish | oder=or | Englisch?=English', extra: ['Deutsch'] },
  ],
  conv: [
    { w: 'Guten Morgen! Hola. Ist das Englisch oder Spanisch?', g: 'Guten Morgen!=good morning | Hola.=hello (Spanish) | Ist=is | das=that | Englisch=English | oder=or | Spanisch?=Spanish', mood: 'pleased' },
    { l: true, de: 'Das ist Spanisch.', en: 'That is Spanish.', g: 'Das ist=that is | Spanisch.=Spanish', type: 'tiles', gaps: [2], extra: ['Englisch'], alts: ['Spanisch.', 'Das ist Spanisch, Herr Weber.'], react: 'Richtig.=correct' },
    { w: 'Und Hello?', g: 'Und=and | Hello?=hello (English)', mood: 'amused' },
    { l: true, de: 'Das ist Englisch.', en: 'That is English.', g: 'Das ist=that is | Englisch.=English', type: 'tiles', gaps: [2], extra: ['Deutsch'], alts: ['Englisch.', 'Das ist Englisch, Herr Weber.'], react: 'Stimmt.=that is right' },
    { w: 'Und Guten Tag?', g: 'Und=and | Guten Tag?=hello', mood: 'amused' },
    { l: true, de: 'Das ist Deutsch.', en: 'That is German.', g: 'Das ist=that is | Deutsch.=German', type: 'translate', gaps: [2], extra: ['Spanisch'], alts: ['Deutsch.', 'Das ist Deutsch, Herr Weber.'], react: 'Ja, Deutsch. Das lernen wir hier.=yes, German. That is what we learn here' },
    { who: 'cast.lena', w: 'Hallo, {name}! Ich komme aus Italien. Und du? Kommst du aus Deutschland?', g: 'Hallo,=hi | {name}!={name} | Ich=I | komme=come | aus=from | Italien.=Italy | Und=and | du?=you (informal) | Kommst=come | du=you (informal) | aus=from | Deutschland?=Germany', mood: 'neutral' },
    { l: true, de: 'Nein, ich komme aus {city}. Ich bin auch neu.', en: 'No, I come from {city}. I am new too.', g: 'Nein,=no | ich=I | komme=come | aus=from | {city}.={city} | Ich=I | bin=am | auch=too | neu.=new', type: 'gap', gaps: [3,7], extra: ['kommst', 'nett'], alts: ['Nein, ich bin aus {city}. Ich bin auch neu.', 'Nein, ich komme aus {city}.'], rwho: 'cast.lena', react: 'Ah, {city}!=ah, {city}' },
    { w: 'Gut. Ana aus Mexiko, Lena aus Italien, {name} aus {city}: Das ist ein internationaler Kurs.', g: 'Gut.=good | Ana=Ana | aus=from | Mexiko,=Mexico | Lena=Lena | aus=from | Italien,=Italy | {name}={name} | aus=from | {city}:={city} | Das ist=this is | ein=a | internationaler=international | Kurs.=course', mood: 'pleased' },
    { l: true, de: 'Tschüss, Herr Weber! Bis Dienstag!', en: 'Bye, Mr Weber! See you Tuesday!', g: 'Tschüss,=bye | Herr=Mr | Weber!=Weber | Bis Dienstag!=see you Tuesday', type: 'tiles', gaps: [0], extra: ['Hallo'], alts: ['Auf Wiedersehen, Herr Weber!', 'Tschüss, Herr Weber.', 'Tschüss!'], optional: true, react: 'Bis Dienstag!=see you Tuesday' },
  ],
  lex: {
    verbs: {
      'sein': { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', Sie: 'sind' },
      'kommen': { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', Sie: 'kommen' },
    },
    nouns: { 'Sprache': 'f', 'Kurs': 'm' },
    related: { 'wo': 'woher', 'Spanisch': 'Spanien', 'und': 'oder', 'Englisch': 'Deutsch' },
    sep: {},
  },
},
{
  n: 5, title: 'Verbs for living', theme: 'Wohnen und arbeiten',
  scene: { id: 'cafe', plate: 'plate.cafe', cast: [{ id: 'cast.barista', x: 1220 }, { id: 'cast.ana', x: 760 }], place: 'Café neben der Volkshochschule', time: 'Tuesday, 10:30', cap: 'Pause · Dienstag, 10:30',
    intro: [
      'Tuesday, 10:30. Herr Weber has called a break, and Ana wants coffee. The café on the corner is full of people from the course.',
      'Ana is a classmate, so you say du to her. The man behind the counter is a stranger, so he gets Sie.' ] },
  notice: { de: 'Ich wohne in Berlin. Du wohnst hier.', g: 'Ich=I | wohne=live | in=in | Berlin.=Berlin | Du=you (informal) | wohnst=live | hier.=here',
    sketch: { type: 'swap', from: ['ich', 'wohne'], to: ['du', 'wohnst'] },
    q: 'Compare "Ich wohne" and "Du wohnst". What stays the same in the verb, and what changes?',
    note: 'The stem <em>wohn-</em> stays and the ending follows the person: <em>ich -e</em>, <em>du -st</em>, <em>Sie -en</em>. Spanish does the same (<em>vivo, vives</em>), but German always says the pronoun. A stem ending in <em>-t</em> adds an <em>e</em> so you can hear the ending: <em>du arbeitest</em>. There is no separate "am living" form: <em>Ich wohne</em> means both "I live" and "I am living".', grammar: 'verbs' },
  can: 'say where you live, work and study, with ich, du and Sie.',
  sound: { focus: 'w', say: 'German <em>w</em> is English "v": <em>wo</em> sounds like "voh". It is not the Spanish <em>b</em>: let your upper teeth touch your lower lip.', words: [['wo', 'where'], ['wohnen', 'to live'], ['wann', 'when'], ['wir', 'we']] },
  warmup: ['Spanien', 'der Kurs', 'neu', 'oder'],
  words: [
    { de: 'wohnen', en: ['to live (somewhere)'], type: 'v', ipa: 'ˈvoːnən', resp: 'VOH·nen', syl: 'woh·nen', ex: 'Ich [wohne] in Berlin.', exEn: 'I live in Berlin.', exG: 'Ich=I | wohne=live | in=in | Berlin.=Berlin', forms: { ich: 'wohne', du: 'wohnst', er: 'wohnt', wir: 'wohnen', ihr: 'wohnt', Sie: 'wohnen' } },
    { de: 'arbeiten', en: ['to work'], type: 'v', ipa: 'ˈaʁbaɪ̯tn̩', resp: 'AR·by·ten', syl: 'ar·bei·ten', ex: 'Du [arbeitest] hier, oder?', exEn: 'You work here, right?', exG: 'Du=you (informal) | arbeitest=work | hier,=here | oder?=right', forms: { ich: 'arbeite', du: 'arbeitest', er: 'arbeitet', wir: 'arbeiten', ihr: 'arbeitet', Sie: 'arbeiten' } },
    { de: 'lernen', en: ['to learn', 'to study'], type: 'v', ipa: 'ˈlɛʁnən', resp: 'LER·nen', syl: 'ler·nen', ex: 'Wir [lernen] Deutsch.', exEn: 'We are learning German.', exG: 'Wir=we | lernen=are learning | Deutsch.=German', forms: { ich: 'lerne', du: 'lernst', er: 'lernt', wir: 'lernen', ihr: 'lernt', Sie: 'lernen' } },
    { de: 'wo', en: ['where'], type: 'adv', ipa: 'voː', resp: 'VOH', syl: 'wo', ex: '[Wo] wohnst du, Ana?', exEn: 'Where do you live, Ana?', exG: 'Wo=where | wohnst=live | du,=you (informal) | Ana?=Ana' },
    { de: 'in', en: ['in'], type: 'prep', ipa: 'ɪn', resp: 'IN', syl: 'in', ex: 'Ana wohnt [in] Neukölln.', exEn: 'Ana lives in Neukölln.', exG: 'Ana=Ana | wohnt=lives | in=in | Neukölln.=Neukölln' },
    { de: 'hier', en: ['here'], type: 'adv', ipa: 'hiːɐ̯', resp: 'HEER', syl: 'hier', ex: 'Ich wohne [hier].', exEn: 'I live here.', exG: 'Ich=I | wohne=live | hier.=here' },
    { de: 'dort', en: ['there'], type: 'adv', ipa: 'dɔʁt', resp: 'DORT', syl: 'dort', ex: 'Das Café ist [dort].', exEn: 'The café is over there.', exG: 'Das=the | Café=café | ist=is | dort.=over there' },
    { de: 'mit', en: ['with'], type: 'prep', ipa: 'mɪt', resp: 'MIT', syl: 'mit', ex: 'Ich lerne [mit] Ana.', exEn: 'I study with Ana.', exG: 'Ich=I | lerne=study | mit=with | Ana.=Ana' },
    { de: 'heute', en: ['today'], type: 'adv', ipa: 'ˈhɔʏ̯tə', resp: 'HOY·tuh', syl: 'heu·te', ex: '[Heute] lerne ich Deutsch.', exEn: 'Today I am learning German.', exG: 'Heute=today | lerne=am learning | ich=I | Deutsch.=German' },
    { de: 'jetzt', en: ['now'], type: 'adv', ipa: 'jɛtst', resp: 'YETST', syl: 'jetzt', ex: 'Wir lernen [jetzt].', exEn: 'We are studying now.', exG: 'Wir=we | lernen=are studying | jetzt.=now' },
    { de: 'die Pause', en: ['break', 'pause'], type: 'n', g: 'f', pl: 'die Pausen', ipa: 'ˈpaʊ̯zə', resp: 'POW·zuh', syl: 'Pau·se', ex: 'Jetzt ist [Pause].', exEn: 'It is break time now.', exG: 'Jetzt=now | ist=is | Pause.=break' },
    { de: 'das Café', en: ['café'], type: 'n', g: 'n', pl: 'die Cafés', ipa: 'kaˈfeː', resp: 'ka·FAY', syl: 'Ca·fé', ex: 'Das [Café] ist hier.', exEn: 'The café is here.', exG: 'Das=the | Café=café | ist=is | hier.=here' },
  ],
  build: [
    { type: 'tiles', de: 'Ich wohne in Berlin.', en: 'I live in Berlin.', g: 'Ich=I | wohne=live | in=in | Berlin.=Berlin', extra: ['wohnst'] },
    { type: 'gap', de: 'Du wohnst hier.', en: 'You live here.', g: 'Du=you (informal) | wohnst=live | hier.=here', gaps: [1] },
    { type: 'tiles', de: 'Heute lerne ich Deutsch.', en: 'Today I am learning German.', g: 'Heute=today | lerne=am learning | ich=I | Deutsch.=German', extra: ['lernst'] },
    { type: 'gap', de: 'Sie arbeiten in Berlin.', en: 'You work in Berlin.', g: 'Sie=you (formal) | arbeiten=work | in=in | Berlin.=Berlin', gaps: [1] },
    { type: 'tiles', de: 'Wo wohnst du jetzt?', en: 'Where do you live now?', g: 'Wo=where | wohnst=live | du=you (informal) | jetzt?=now', extra: ['wohne'] },
    { type: 'gap', de: 'Ich lerne mit Ana.', en: 'I study with Ana.', g: 'Ich=I | lerne=study | mit=with | Ana.=Ana', gaps: [2] },
  ],
  conv: [
    { who: 'cast.ana', w: 'Pause, {name}! Wir sind jetzt im Café.', g: 'Pause,=break | {name}!={name} | Wir=we | sind=are | jetzt=now | im=in the | Café.=café', mood: 'pleased' },
    { l: true, de: 'Ja, gut. Wo wohnst du, Ana?', en: 'Yes, good. Where do you live, Ana?', g: 'Ja,=yes | gut.=good | Wo=where | wohnst=live | du,=you (informal) | Ana?=Ana', type: 'tiles', gaps: [3], extra: ['wohne', 'wohnt'], alts: ['Ja, gut. Wo wohnst du?', 'Gut. Wo wohnst du, Ana?'], rwho: 'cast.ana', react: 'Ich wohne in Neukölln.=I live in Neukölln' },
    { who: 'cast.ana', w: 'Und du? Wohnst du auch in Neukölln?', g: 'Und=and | du?=you (informal) | Wohnst=live | du=you (informal) | auch=also | in=in | Neukölln?=Neukölln', mood: 'neutral' },
    { l: true, de: 'Ja, ich wohne auch in Neukölln.', en: 'Yes, I live in Neukölln too.', g: 'Ja,=yes | ich=I | wohne=live | auch=too | in=in | Neukölln.=Neukölln', type: 'gap', gaps: [2, 4], extra: ['wohnst', 'aus'], alts: ['Ja, ich wohne in Neukölln.', 'Ja, ich wohne hier in Neukölln.'], rwho: 'cast.ana', react: 'Ach, schön.=oh, nice' },
    { who: 'cast.barista', w: 'Guten Morgen. Sie lernen Deutsch, oder?', g: 'Guten Morgen.=good morning | Sie=you (formal) | lernen=are learning | Deutsch,=German | oder?=right', mood: 'amused' },
    { l: true, de: 'Ja, ich lerne Deutsch.', en: 'Yes, I am learning German.', g: 'Ja,=yes | ich=I | lerne=am learning | Deutsch.=German', type: 'translate', gaps: [2], extra: ['lernst'], alts: ['Ja, wir lernen Deutsch.', 'Ja, ich lerne Deutsch hier.'], rwho: 'cast.barista', react: 'Hier lernen viele Deutsch.=many people learn German here' },
    { who: 'cast.barista', w: 'Und wo arbeiten Sie?', g: 'Und=and | wo=where | arbeiten=work | Sie?=you (formal)', mood: 'neutral' },
    { l: true, de: 'Ich arbeite in Berlin.', en: 'I work in Berlin.', g: 'Ich=I | arbeite=work | in=in | Berlin.=Berlin', type: 'tiles', gaps: [1], extra: ['arbeitest', 'arbeiten'], alts: ['Ich arbeite hier in Berlin.', 'Ich arbeite hier.'], rwho: 'cast.barista', react: 'Ach so.=I see' },
    { who: 'cast.ana', w: 'Ich lerne jetzt mit Lena. Bis gleich!', g: 'Ich=I | lerne=study | jetzt=now | mit=with | Lena.=Lena | Bis gleich!=see you in a moment', mood: 'pleased' },
    { l: true, de: 'Bis gleich, Ana!', en: 'See you in a moment, Ana!', g: 'Bis gleich,=see you in a moment | Ana!=Ana', type: 'tiles', gaps: [0], extra: ['Tschüss'], alts: ['Bis gleich!', 'Bis gleich, Ana.'], optional: true, rwho: 'cast.ana', react: 'Bis gleich!=see you in a moment' },
  ],
  lex: {
    verbs: {
      'wohnen': { ich: 'wohne', du: 'wohnst', er: 'wohnt', wir: 'wohnen', ihr: 'wohnt', Sie: 'wohnen' },
      'arbeiten': { ich: 'arbeite', du: 'arbeitest', er: 'arbeitet', wir: 'arbeiten', ihr: 'arbeitet', Sie: 'arbeiten' },
      'lernen': { ich: 'lerne', du: 'lernst', er: 'lernt', wir: 'lernen', ihr: 'lernt', Sie: 'lernen' },
    },
    nouns: { 'Pause': 'f', 'Café': 'n' },
    related: { 'wo': 'woher', 'wohne': 'komme', 'hier': 'dort' },
    sep: {},
  },
},
{
  n: 6, title: 'Verbs for doing', theme: 'Tun und spielen',
  scene: { id: 'cafe', plate: 'plate.cafe', cast: [{ id: 'cast.barista', x: 1220 }, { id: 'cast.lena', x: 760 }], place: 'Café neben der Volkshochschule', time: 'Thursday, 10:30', cap: 'Pause · Donnerstag, 10:30',
    intro: [
      'Thursday, 10:30. Another break, and again the café. Lena sits by the window with a guitar case next to her chair.',
      'She plays in a band on Friday evenings. The barista already knows your order.' ] },
  notice: { de: 'Lena spielt Gitarre. Wir spielen Fußball.', g: 'Lena=Lena | spielt=plays | Gitarre.=guitar | Wir=we | spielen=play | Fußball.=soccer',
    sketch: { type: 'swap', from: ['lena', 'spielt'], to: ['wir', 'spielen'] },
    q: 'Compare the verb after "Lena" and after "wir". Which ending belongs to which?',
    note: '<em>er, sie, es</em> and <em>ihr</em> take <em>-t</em>: <em>sie spielt, ihr spielt</em>. <em>wir</em> and <em>Sie</em> take <em>-en</em>, the same as the infinitive: <em>wir spielen</em>. Together with lesson 5 you now have all six endings: <em>-e, -st, -t, -en, -t, -en</em>. If something other than the subject starts the sentence, the verb stays second: <em>Dann lerne ich Deutsch</em>, not "Dann ich lerne".', grammar: 'verbs' },
  can: 'say what people do, play and listen to, and keep the verb in second place after heute or dann.',
  sound: { focus: 'ch after a, o', say: 'After <em>a</em>, <em>o</em> and <em>u</em>, <em>ch</em> is a rough sound from the back of the throat, close to Spanish <em>j</em> in <em>jamón</em>: <em>machen</em>, <em>kochen</em>, <em>auch</em>. Spanish speakers have this sound already.', words: [['machen', 'to do'], ['kochen', 'to cook'], ['auch', 'also'], ['Buch', 'book']] },
  warmup: ['wohnen', 'arbeiten', 'dort', 'die Pause'],
  words: [
    { de: 'machen', en: ['to do', 'to make'], type: 'v', ipa: 'ˈmaxn̩', resp: 'MAKH·en', syl: 'ma·chen', ex: 'Was [machst] du jetzt?', exEn: 'What are you doing now?', exG: 'Was=what | machst=are doing | du=you (informal) | jetzt?=now', forms: { ich: 'mache', du: 'machst', er: 'macht', wir: 'machen', ihr: 'macht', Sie: 'machen' } },
    { de: 'spielen', en: ['to play'], type: 'v', ipa: 'ˈʃpiːlən', resp: 'SHPEE·len', syl: 'spie·len', ex: 'Lena [spielt] Gitarre.', exEn: 'Lena plays the guitar.', exG: 'Lena=Lena | spielt=plays | Gitarre.=guitar', forms: { ich: 'spiele', du: 'spielst', er: 'spielt', wir: 'spielen', ihr: 'spielt', Sie: 'spielen' } },
    { de: 'trinken', en: ['to drink'], type: 'v', ipa: 'ˈtʁɪŋkn̩', resp: 'TRING·ken', syl: 'trin·ken', ex: 'Ich [trinke] Kaffee.', exEn: 'I drink coffee.', exG: 'Ich=I | trinke=drink | Kaffee.=coffee', forms: { ich: 'trinke', du: 'trinkst', er: 'trinkt', wir: 'trinken', ihr: 'trinkt', Sie: 'trinken' } },
    { de: 'kochen', en: ['to cook'], type: 'v', ipa: 'ˈkɔxn̩', resp: 'KOKH·en', syl: 'ko·chen', ex: 'Wir [kochen] heute.', exEn: 'We are cooking today.', exG: 'Wir=we | kochen=are cooking | heute.=today', forms: { ich: 'koche', du: 'kochst', er: 'kocht', wir: 'kochen', ihr: 'kocht', Sie: 'kochen' } },
    { de: 'hören', en: ['to hear', 'to listen to'], type: 'v', ipa: 'ˈhøːʁən', resp: 'HÖH·ren', syl: 'hö·ren', ex: 'Ana [hört] Musik.', exEn: 'Ana is listening to music.', exG: 'Ana=Ana | hört=is listening to | Musik.=music', forms: { ich: 'höre', du: 'hörst', er: 'hört', wir: 'hören', ihr: 'hört', Sie: 'hören' } },
    { de: 'was', en: ['what'], type: 'adv', ipa: 'vas', resp: 'VAHSS', syl: 'was', ex: '[Was] trinkst du?', exEn: 'What are you drinking?', exG: 'Was=what | trinkst=are drinking | du?=you (informal)' },
    { de: 'wieder', en: ['again'], type: 'adv', ipa: 'ˈviːdɐ', resp: 'VEE·duh', syl: 'wie·der', ex: 'Jetzt arbeiten wir [wieder].', exEn: 'Now we are working again.', exG: 'Jetzt=now | arbeiten=work | wir=we | wieder.=again' },
    { de: 'dann', en: ['then'], type: 'adv', ipa: 'dan', resp: 'DAN', syl: 'dann', ex: 'Ich trinke Kaffee, [dann] lerne ich.', exEn: 'I drink coffee, then I study.', exG: 'Ich=I | trinke=drink | Kaffee,=coffee | dann=then | lerne=study | ich.=I' },
    { de: 'der Kaffee', en: ['coffee'], type: 'n', g: 'm', pl: 'die Kaffees', pic: 'word.kaffee', ipa: 'ˈkafe', resp: 'KAF·ay', syl: 'Kaf·fee', ex: 'Hier ist der [Kaffee].', exEn: 'Here is the coffee.', exG: 'Hier=here | ist=is | der=the | Kaffee.=coffee' },
    { de: 'die Gitarre', en: ['guitar'], type: 'n', g: 'f', pl: 'die Gitarren', ipa: 'ɡiˈtaʁə', resp: 'gi·TAR·uh', syl: 'Gi·tar·re', ex: 'Das ist eine [Gitarre].', exEn: 'That is a guitar.', exG: 'Das ist=that is | eine=a | Gitarre.=guitar' },
    { de: 'die Musik', en: ['music'], type: 'n', g: 'f', pl: 'no plural', ipa: 'muˈziːk', resp: 'mu·ZEEK', syl: 'Mu·sik', ex: 'Lena hört [Musik].', exEn: 'Lena is listening to music.', exG: 'Lena=Lena | hört=is listening to | Musik.=music' },
    { de: 'der Fußball', en: ['soccer', 'football'], type: 'n', g: 'm', pl: 'die Fußbälle', ipa: 'ˈfuːsbal', resp: 'FOOSS·bal', syl: 'Fuß·ball', ex: 'Wir spielen [Fußball].', exEn: 'We play soccer.', exG: 'Wir=we | spielen=play | Fußball.=soccer' },
  ],
  build: [
    { type: 'tiles', de: 'Lena spielt Gitarre.', en: 'Lena plays the guitar.', g: 'Lena=Lena | spielt=plays | Gitarre.=guitar', extra: ['spielst'] },
    { type: 'gap', de: 'Wir spielen Fußball.', en: 'We play soccer.', g: 'Wir=we | spielen=play | Fußball.=soccer', gaps: [1] },
    { type: 'tiles', de: 'Was machst du jetzt?', en: 'What are you doing now?', g: 'Was=what | machst=are doing | du=you (informal) | jetzt?=now', extra: ['macht'] },
    { type: 'gap', de: 'Ich trinke Kaffee.', en: 'I drink coffee.', g: 'Ich=I | trinke=drink | Kaffee.=coffee', gaps: [1] },
    { type: 'tiles', de: 'Dann lerne ich Deutsch.', en: 'Then I study German.', g: 'Dann=then | lerne=study | ich=I | Deutsch.=German', extra: ['lernen'] },
    { type: 'gap', de: 'Ana hört Musik.', en: 'Ana is listening to music.', g: 'Ana=Ana | hört=is listening to | Musik.=music', gaps: [1] },
  ],
  conv: [
    { who: 'cast.lena', w: 'Hallo, {name}! Ich spiele heute Gitarre. Und du?', g: 'Hallo,=hi | {name}!={name} | Ich=I | spiele=play | heute=today | Gitarre.=guitar | Und=and | du?=you (informal)', mood: 'pleased' },
    { l: true, de: 'Ich höre Musik.', en: 'I listen to music.', g: 'Ich=I | höre=listen to | Musik.=music', type: 'tiles', gaps: [1], extra: ['hörst', 'hören'], alts: ['Ich höre heute Musik.', 'Ich höre jetzt Musik.'], rwho: 'cast.lena', react: 'Ah, Musik.=ah, music' },
    { who: 'cast.lena', w: 'Was trinkst du? Ich trinke Kaffee.', g: 'Was=what | trinkst=are drinking | du?=you (informal) | Ich=I | trinke=drink | Kaffee.=coffee', mood: 'neutral' },
    { l: true, de: 'Ich trinke auch Kaffee.', en: 'I drink coffee too.', g: 'Ich=I | trinke=drink | auch=too | Kaffee.=coffee', type: 'gap', gaps: [1, 3], extra: ['trinkst', 'trinken'], alts: ['Ich trinke Kaffee.', 'Ich trinke auch Kaffee, Lena.'], rwho: 'cast.lena', react: 'Gut.=good' },
    { who: 'cast.barista', w: 'Bitte schön, der Kaffee.', g: 'Bitte schön,=here you go | der=the | Kaffee.=coffee', mood: 'pleased' },
    { l: true, de: 'Danke!', en: 'Thank you!', g: 'Danke!=thank you', type: 'translate', gaps: [0], extra: ['Bitte'], alts: ['Danke.', 'Danke schön!'], rwho: 'cast.barista', react: 'Bitte.=you are welcome' },
    { who: 'cast.lena', w: 'Und was machst du dann? Ich spiele Fußball mit Ana.', g: 'Und=and | was=what | machst=do | du=you (informal) | dann?=then | Ich=I | spiele=play | Fußball=soccer | mit=with | Ana.=Ana', mood: 'thinking' },
    { l: true, de: 'Dann lerne ich Deutsch.', en: 'Then I study German.', g: 'Dann=then | lerne=study | ich=I | Deutsch.=German', type: 'gap', gaps: [1], extra: ['lernst', 'lernen'], alts: ['Dann lerne ich.', 'Ich lerne dann Deutsch.'], rwho: 'cast.lena', react: 'Ach so.=I see' },
    { who: 'cast.lena', w: 'Jetzt arbeiten wir wieder. Bis gleich!', g: 'Jetzt=now | arbeiten=work | wir=we | wieder.=again | Bis gleich!=see you in a moment', mood: 'amused' },
    { l: true, de: 'Bis gleich, Lena!', en: 'See you in a moment, Lena!', g: 'Bis gleich,=see you in a moment | Lena!=Lena', type: 'tiles', gaps: [0], extra: ['Tschüss'], alts: ['Bis gleich!', 'Bis gleich, Lena.'], optional: true, rwho: 'cast.lena', react: 'Bis gleich!=see you in a moment' },
  ],
  lex: {
    verbs: {
      'machen': { ich: 'mache', du: 'machst', er: 'macht', wir: 'machen', ihr: 'macht', Sie: 'machen' },
      'spielen': { ich: 'spiele', du: 'spielst', er: 'spielt', wir: 'spielen', ihr: 'spielt', Sie: 'spielen' },
      'trinken': { ich: 'trinke', du: 'trinkst', er: 'trinkt', wir: 'trinken', ihr: 'trinkt', Sie: 'trinken' },
      'kochen': { ich: 'koche', du: 'kochst', er: 'kocht', wir: 'kochen', ihr: 'kocht', Sie: 'kochen' },
      'hören': { ich: 'höre', du: 'hörst', er: 'hört', wir: 'hören', ihr: 'hört', Sie: 'hören' },
    },
    nouns: { 'Kaffee': 'm', 'Gitarre': 'f', 'Musik': 'f', 'Fußball': 'm' },
    related: { 'machen': 'kochen', 'spielen': 'hören', 'dann': 'wieder' },
    sep: {},
  },
},
{
  n: 7, title: 'Question words', theme: 'Wer, wann, warum?',
  scene: { id: 'classroom', plate: 'plate.classroom', cast: [{ id: 'cast.weber', x: 1200 }, { id: 'cast.ana', x: 900 }, { id: 'cast.lena', x: 640 }], place: 'Volkshochschule am Hermannplatz', time: 'Tuesday, 9:00', cap: 'Raum 2.04 · Dienstag, 9:00',
    intro: [
      'Tuesday, 9:00. Herr Weber has written four words on the board: Wer? Wann? Warum? Wohin?',
      'Today the class does the asking. Ana has her question ready, and Lena is already looking at the clock.' ] },
  notice: { de: 'Wer ist das? Wann gehen wir?', g: 'Wer=who | ist=is | das?=that | Wann=when | gehen=go | wir?=we',
    sketch: { type: 'swap', from: ['wer', 'ist'], to: ['wann', 'gehen'] },
    q: 'Both questions start with a question word. Which word comes right after it?',
    note: 'The verb. A question with a question word has the verb in second place, like a statement: <em>Wer ist das?</em>, <em>Wann gehen wir?</em>. There is no <em>¿</em> at the start. Most of these words start with <em>w</em> (<em>wer, was, wo, woher, wohin, wann, warum, wie</em>), so Germans call them W-Fragen. Spanish <em>dónde</em> is three words in German: <em>wo</em> (where, no movement), <em>woher</em> (from where) and <em>wohin</em> (to where). <em>Warum</em> is <em>por qué</em> in one word.', grammar: 'wq' },
  can: 'ask who, when, why and where to, and answer with a short sentence.',
  sound: { focus: 'w', say: 'German <em>w</em> is the English "v", with the top teeth on the lower lip: <em>wer</em> sounds like "vehr". It is not the English "w", and not the Spanish <em>b</em> in <em>vaca</em>.', words: [['wer', 'who'], ['wann', 'when'], ['warum', 'why'], ['wohin', 'where to']] },
  warmup: ['woher', 'wo', 'was', 'wie'],
  words: [
    { de: 'wer', en: ['who'], type: 'pron', ipa: 'veːɐ̯', resp: 'VEHR', syl: 'wer', ex: '[Wer] ist das?', exEn: 'Who is that?', exG: 'Wer=who | ist=is | das?=that' },
    { de: 'wann', en: ['when'], type: 'adv', ipa: 'van', resp: 'VAHN', syl: 'wann', ex: '[Wann] kommst du?', exEn: 'When are you coming?', exG: 'Wann=when | kommst=are coming | du?=you (informal)' },
    { de: 'warum', en: ['why'], type: 'adv', ipa: 'vaˈʁʊm', resp: 'va·ROOM', syl: 'wa·rum', ex: '[Warum] lernst du Deutsch?', exEn: 'Why are you learning German?', exG: 'Warum=why | lernst=are learning | du=you (informal) | Deutsch?=German' },
    { de: 'wohin', en: ['where to'], type: 'adv', ipa: 'voˈhɪn', resp: 'vo·HIN', syl: 'wo·hin', ex: '[Wohin] gehst du?', exEn: 'Where are you going?', exG: 'Wohin=where to | gehst=go | du?=you (informal)' },
    { de: 'gehen', en: ['to go', 'to walk'], type: 'v', ipa: 'ˈɡeːən', resp: 'GAY·en', syl: 'ge·hen', ex: 'Wir [gehen] ins Café.', exEn: 'We are going to the café.', exG: 'Wir=we | gehen=go | ins=to the | Café.=café', forms: { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', Sie: 'gehen' } },
    { de: 'fragen', en: ['to ask'], type: 'v', ipa: 'ˈfʁaːɡn̩', resp: 'FRAH·gen', syl: 'fra·gen', ex: 'Ich [frage] Lena.', exEn: 'I ask Lena.', exG: 'Ich=I | frage=ask | Lena.=Lena', forms: { ich: 'frage', du: 'fragst', er: 'fragt', wir: 'fragen', ihr: 'fragt', Sie: 'fragen' } },
    { de: 'antworten', en: ['to answer'], type: 'v', ipa: 'ˈantvɔʁtn̩', resp: 'ANT·vor·ten', syl: 'ant·wor·ten', ex: 'Wer [antwortet]?', exEn: 'Who answers?', exG: 'Wer=who | antwortet?=answers', forms: { ich: 'antworte', du: 'antwortest', er: 'antwortet', wir: 'antworten', ihr: 'antwortet', Sie: 'antworten' } },
    { de: 'die Frage', en: ['question'], type: 'n', g: 'f', pl: 'die Fragen', ipa: 'ˈfʁaːɡə', resp: 'FRAH·guh', syl: 'Fra·ge', ex: 'Das ist eine gute [Frage].', exEn: 'That is a good question.', exG: 'Das ist=that is | eine=a | gute=good | Frage.=question' },
    { de: 'die Antwort', en: ['answer'], type: 'n', g: 'f', pl: 'die Antworten', ipa: 'ˈantvɔʁt', resp: 'ANT·vort', syl: 'Ant·wort', ex: 'Die [Antwort] ist Berlin.', exEn: 'The answer is Berlin.', exG: 'Die=the | Antwort=answer | ist=is | Berlin.=Berlin' },
    { de: 'das Wort', en: ['word'], type: 'n', g: 'n', pl: 'die Wörter', ipa: 'vɔʁt', resp: 'VORT', syl: 'Wort', ex: 'Das [Wort] ist neu.', exEn: 'The word is new.', exG: 'Das=the | Wort=word | ist=is | neu.=new' },
    { de: 'der Name', en: ['name'], type: 'n', g: 'm', pl: 'die Namen', ipa: 'ˈnaːmə', resp: 'NAH·muh', syl: 'Na·me', ex: 'Mein [Name] ist Ana.', exEn: 'My name is Ana.', exG: 'Mein=my | Name=name | ist=is | Ana.=Ana' },
    { de: 'morgen', en: ['tomorrow'], type: 'adv', ipa: 'ˈmɔʁɡn̩', resp: 'MOR·gen', syl: 'mor·gen', ex: 'Wann kommt Lena? [Morgen].', exEn: 'When is Lena coming? Tomorrow.', exG: 'Wann=when | kommt=is coming | Lena?=Lena | Morgen.=tomorrow' },
  ],
  build: [
    { type: 'tiles', de: 'Wer ist das?', en: 'Who is that?', g: 'Wer=who | ist=is | das?=that', extra: ['Was'] },
    { type: 'gap', de: 'Wann gehen wir?', en: 'When are we going?', g: 'Wann=when | gehen=go | wir?=we', gaps: [0] },
    { type: 'tiles', de: 'Warum lernst du Deutsch?', en: 'Why are you learning German?', g: 'Warum=why | lernst=are learning | du=you (informal) | Deutsch?=German', extra: ['lerne'] },
    { type: 'gap', de: 'Wohin gehst du?', en: 'Where are you going?', g: 'Wohin=where to | gehst=go | du?=you (informal)', gaps: [1] },
    { type: 'tiles', de: 'Wer antwortet?', en: 'Who answers?', g: 'Wer=who | antwortet?=answers', extra: ['antworte'] },
    { type: 'gap', de: 'Die Antwort ist Berlin.', en: 'The answer is Berlin.', g: 'Die=the | Antwort=answer | ist=is | Berlin.=Berlin', gaps: [1] },
  ],
  conv: [
    { who: 'cast.weber', w: 'Guten Morgen! Heute fragen wir. Wer fragt?', g: 'Guten Morgen!=good morning | Heute=today | fragen=ask | wir.=we | Wer=who | fragt?=asks', mood: 'pleased' },
    { l: true, de: 'Ich frage Ana.', en: 'I ask Ana.', g: 'Ich=I | frage=ask | Ana.=Ana', type: 'tiles', gaps: [1], extra: ['fragst', 'fragen'], alts: ['Ich frage Ana, Herr Weber.', 'Ich frage Lena.'], rwho: 'cast.weber', react: 'Dann antwortet Ana.=then Ana answers' },
    { who: 'cast.ana', w: 'Bitte, {name}. Ich antworte.', g: 'Bitte,=go ahead | {name}.={name} | Ich=I | antworte.=answer', mood: 'neutral' },
    { l: true, de: 'Warum lernst du Deutsch?', en: 'Why are you learning German?', g: 'Warum=why | lernst=are learning | du=you (informal) | Deutsch?=German', type: 'tiles', gaps: [0], extra: ['Wann', 'Wer'], alts: ['Warum lernst du Deutsch, Ana?'], rwho: 'cast.ana', react: 'Ich wohne jetzt in Berlin.=I live in Berlin now' },
    { who: 'cast.lena', w: 'Und wohin gehst du heute, {name}?', g: 'Und=and | wohin=where to | gehst=go | du=you (informal) | heute,=today | {name}?={name}', mood: 'thinking' },
    { l: true, de: 'Ich gehe ins Café.', en: 'I am going to the café.', g: 'Ich=I | gehe=go | ins=to the | Café.=café', type: 'gap', gaps: [1], extra: ['gehst', 'gehen'], alts: ['Ich gehe heute ins Café.', 'Ich gehe jetzt ins Café.', 'Wir gehen ins Café.'], rwho: 'cast.lena', react: 'Dann komme ich auch.=then I will come too' },
    { who: 'cast.lena', w: 'Wann gehen wir? Heute oder morgen?', g: 'Wann=when | gehen=go | wir?=we | Heute=today | oder=or | morgen?=tomorrow', mood: 'amused' },
    { l: true, de: 'Heute, bitte.', en: 'Today, please.', g: 'Heute,=today | bitte.=please', type: 'translate', gaps: [0], extra: ['Morgen'], alts: ['Heute.', 'Wir gehen heute.', 'Heute, Lena.'], rwho: 'cast.lena', react: 'Dann gehen wir heute.=then we go today' },
    { who: 'cast.weber', w: 'Danke! Bis Donnerstag.', g: 'Danke!=thanks | Bis Donnerstag.=see you Thursday', mood: 'pleased' },
    { l: true, de: 'Bis Donnerstag, Herr Weber!', en: 'See you Thursday, Mr Weber!', g: 'Bis Donnerstag,=see you Thursday | Herr=Mr | Weber!=Weber', type: 'tiles', gaps: [0], extra: ['Tschüss'], alts: ['Bis Donnerstag!', 'Bis Donnerstag, Herr Weber.', 'Auf Wiedersehen, Herr Weber!'], optional: true, rwho: 'cast.weber', react: 'Auf Wiedersehen.=goodbye' },
  ],
  lex: {
    verbs: {
      'gehen': { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', Sie: 'gehen' },
      'fragen': { ich: 'frage', du: 'fragst', er: 'fragt', wir: 'fragen', ihr: 'fragt', Sie: 'fragen' },
      'antworten': { ich: 'antworte', du: 'antwortest', er: 'antwortet', wir: 'antworten', ihr: 'antwortet', Sie: 'antworten' },
    },
    nouns: { 'Frage': 'f', 'Antwort': 'f', 'Wort': 'n', 'Name': 'm' },
    related: { 'fragen': 'antworten', 'wer': 'wann', 'wohin': 'wann' },
    sep: {},
  },
},
{
  n: 8, title: 'Yes, no and answers', theme: 'Ja, nein, vielleicht',
  scene: { id: 'cafe', plate: 'plate.cafe', cast: [{ id: 'cast.barista', x: 1220 }, { id: 'cast.lena', x: 760 }, { id: 'cast.ana', x: 1000 }], place: 'Café neben der Volkshochschule', time: 'Thursday, 10:30', cap: 'Pause · Donnerstag, 10:30',
    intro: [
      'Thursday, 10:30. Break time. Lena waits outside the café and keeps looking at her phone: Ana is late.',
      'Lena has questions, and this time a plain ja or nein is not enough.' ] },
  notice: { de: 'Lena kommt heute. Kommt Lena heute?', g: 'Lena=Lena | kommt=is coming | heute.=today | Kommt=is coming | Lena=Lena | heute?=today',
    sketch: { type: 'swap', from: ['lena', 'kommt'], to: ['kommt', 'lena'] },
    q: 'Both sentences use the same words. What changes when it becomes a question?',
    note: 'A question without a question word starts with the verb: <em>Lena kommt heute</em> becomes <em>Kommt Lena heute?</em>. There is no <em>¿</em>; the verb in first place and a rising voice at the end do the job. Answer with <em>ja</em> or <em>nein</em>, or with a short word: <em>klar, natürlich, vielleicht, leider nein</em>. One verb to learn as a block: <em>wissen</em> is irregular in the singular, <em>ich weiß, du weißt, er weiß</em>.', grammar: 'yn' },
  can: 'ask a question with the verb first and answer it with more than ja and nein: of course, maybe, unfortunately not.',
  sound: { focus: '-ig, -lich', mouth: 'mouth.ich', say: 'At the end of a word, <em>-ig</em> and <em>-lich</em> end in the soft hiss of <em>ich</em>, not in a hard <em>g</em>: <em>richtig</em> is "RIKH-tikh", <em>natürlich</em> "na-TÜR-likh".', words: [['richtig', 'right'], ['wirklich', 'really'], ['natürlich', 'of course'], ['vielleicht', 'maybe']] },
  warmup: ['wer', 'wann', 'warum', 'die Frage'],
  words: [
    { de: 'Das stimmt', en: ['that is right', 'that is correct'], type: 'phrase', ipa: 'das ʃtɪmt', resp: 'dahss SHTIMT', syl: 'Das stimmt', ex: 'Ana kommt aus Mexiko. [Das stimmt].', exEn: 'Ana comes from Mexico. That is right.', exG: 'Ana=Ana | kommt=comes | aus=from | Mexiko.=Mexico | Das stimmt.=that is right' },
    { de: 'richtig', en: ['right', 'correct'], type: 'adj', ipa: 'ˈʁɪçtɪç', resp: 'RIKH·tikh', syl: 'rich·tig', ex: 'Die Antwort ist [richtig].', exEn: 'The answer is right.', exG: 'Die=the | Antwort=answer | ist=is | richtig.=right' },
    { de: 'falsch', en: ['wrong'], type: 'adj', ipa: 'falʃ', resp: 'FALSH', syl: 'falsch', ex: 'Das Wort ist [falsch].', exEn: 'The word is wrong.', exG: 'Das=the | Wort=word | ist=is | falsch.=wrong' },
    { de: 'genau', en: ['exactly'], type: 'adv', ipa: 'ɡəˈnaʊ̯', resp: 'guh·NOW', syl: 'ge·nau', ex: 'Du gehst ins Café? [Genau].', exEn: 'You are going to the café? Exactly.', exG: 'Du=you (informal) | gehst=go | ins=to the | Café?=café | Genau.=exactly' },
    { de: 'natürlich', en: ['of course'], type: 'adv', ipa: 'naˈtyːɐ̯lɪç', resp: 'na·TÜR·likh', syl: 'na·tür·lich', ex: 'Kommst du heute? [Natürlich]!', exEn: 'Are you coming today? Of course!', exG: 'Kommst=are coming | du=you (informal) | heute?=today | Natürlich!=of course' },
    { de: 'klar', en: ['sure'], type: 'adv', ipa: 'klaːɐ̯', resp: 'KLAHR', syl: 'klar', ex: 'Gehen wir ins Café? [Klar]!', exEn: 'Shall we go to the café? Sure!', exG: 'Gehen=go | wir=we | ins=to the | Café?=café | Klar!=sure' },
    { de: 'vielleicht', en: ['maybe', 'perhaps'], type: 'adv', ipa: 'fiˈlaɪ̯çt', resp: 'fee·LYKHT', syl: 'viel·leicht', ex: 'Kommt Lena? [Vielleicht].', exEn: 'Is Lena coming? Maybe.', exG: 'Kommt=is coming | Lena?=Lena | Vielleicht.=maybe' },
    { de: 'leider', en: ['unfortunately'], type: 'adv', ipa: 'ˈlaɪ̯dɐ', resp: 'LY·duh', syl: 'lei·der', ex: 'Kommt Ana? [Leider] nein.', exEn: 'Is Ana coming? Unfortunately not.', exG: 'Kommt=is coming | Ana?=Ana | Leider=unfortunately | nein.=no' },
    { de: 'wirklich', en: ['really'], type: 'adv', ipa: 'ˈvɪʁklɪç', resp: 'VIRK·likh', syl: 'wirk·lich', ex: 'Ich koche heute. [Wirklich]?', exEn: 'I am cooking today. Really?', exG: 'Ich=I | koche=cook | heute.=today | Wirklich?=really' },
    { de: 'wissen', en: ['to know'], type: 'v', ipa: 'ˈvɪsn̩', resp: 'VISS·en', syl: 'wis·sen', ex: 'Ich [weiß] die Antwort.', exEn: 'I know the answer.', exG: 'Ich=I | weiß=know | die=the | Antwort.=answer', forms: { ich: 'weiß', du: 'weißt', er: 'weiß', wir: 'wissen', ihr: 'wisst', Sie: 'wissen' } },
    { de: 'der Moment', en: ['moment'], type: 'n', g: 'm', pl: 'die Momente', ipa: 'moˈmɛnt', resp: 'mo·MENT', syl: 'Mo·ment', ex: 'Einen [Moment], bitte.', exEn: 'One moment, please.', exG: 'Einen Moment,=one moment | bitte.=please' },
    { de: 'die Idee', en: ['idea'], type: 'n', g: 'f', pl: 'die Ideen', ipa: 'iˈdeː', resp: 'ee·DAY', syl: 'I·dee', ex: 'Das ist eine gute [Idee].', exEn: 'That is a good idea.', exG: 'Das ist=that is | eine=a | gute=good | Idee.=idea' },
  ],
  build: [
    { type: 'tiles', de: 'Kommt Lena heute?', en: 'Is Lena coming today?', g: 'Kommt=is coming | Lena=Lena | heute?=today', extra: ['Wann'] },
    { type: 'gap', de: 'Gehen wir ins Café?', en: 'Shall we go to the café?', g: 'Gehen=go | wir=we | ins=to the | Café?=café', gaps: [0] },
    { type: 'tiles', de: 'Ich weiß die Antwort.', en: 'I know the answer.', g: 'Ich=I | weiß=know | die=the | Antwort.=answer', extra: ['weißt'] },
    { type: 'gap', de: 'Natürlich komme ich heute.', en: 'Of course I am coming today.', g: 'Natürlich=of course | komme=come | ich=I | heute.=today', gaps: [0], extra: ['Leider', 'Klar'] },
    { type: 'tiles', de: 'Einen Moment, bitte.', en: 'One moment, please.', g: 'Einen Moment,=one moment | bitte.=please', extra: ['Idee'] },
    { type: 'gap', de: 'Die Antwort ist richtig.', en: 'The answer is right.', g: 'Die=the | Antwort=answer | ist=is | richtig.=right', gaps: [3], extra: ['falsch'] },
  ],
  conv: [
    { who: 'cast.lena', w: 'Hallo, {name}! Kommt Ana heute auch ins Café?', g: 'Hallo,=hi | {name}!={name} | Kommt=is coming | Ana=Ana | heute=today | auch=too | ins=to the | Café?=café', mood: 'thinking' },
    { l: true, de: 'Vielleicht.', en: 'Maybe.', g: 'Vielleicht.=maybe', type: 'translate', gaps: [0], extra: ['Leider'], alts: ['Vielleicht!', 'Ja, vielleicht.'], rwho: 'cast.lena', react: 'Dann fragen wir Ana.=then we ask Ana' },
    { who: 'cast.ana', w: 'Hallo! Ja, ich komme. Gehen wir ins Café?', g: 'Hallo!=hi | Ja,=yes | ich=I | komme=come | Gehen=go | wir=we | ins=to the | Café?=café', mood: 'pleased' },
    { l: true, de: 'Klar!', en: 'Sure!', g: 'Klar!=sure', type: 'translate', gaps: [0], extra: ['Leider'], alts: ['Klar.', 'Natürlich!', 'Ja, klar!', 'Ja, natürlich!'], rwho: 'cast.ana', react: 'Gut.=good' },
    { who: 'cast.barista', w: 'Guten Morgen! Einen Moment, bitte.', g: 'Guten Morgen!=good morning | Einen Moment,=one moment | bitte.=please', mood: 'neutral' },
    { l: true, de: 'Kein Problem, danke.', en: 'No problem, thanks.', g: 'Kein Problem,=no problem | danke.=thanks', type: 'tiles', gaps: [0, 1], extra: ['Bitte'], alts: ['Kein Problem.', 'Danke.', 'Kein Problem, danke!'], optional: true, rwho: 'cast.barista', react: 'Bitte.=you are welcome' },
    { who: 'cast.lena', w: 'Du kommst aus {city}, richtig?', g: 'Du=you (informal) | kommst=come | aus=from | {city},={city} | richtig?=right', mood: 'neutral' },
    { l: true, de: 'Ja, das stimmt.', en: 'Yes, that is right.', g: 'Ja,=yes | das stimmt.=that is right', type: 'tiles', gaps: [0, 1], extra: ['falsch', 'Nein,'], alts: ['Ja, genau.', 'Ja.', 'Genau.', 'Das stimmt.'], rwho: 'cast.lena', react: 'Wirklich?=really' },
    { who: 'cast.ana', w: 'Eine Frage: Kommt Lena aus Spanien? Ich weiß die Antwort.', g: 'Eine=a | Frage:=question | Kommt=comes | Lena=Lena | aus=from | Spanien?=Spain | Ich=I | weiß=know | die=the | Antwort.=answer', mood: 'amused' },
    { l: true, de: 'Nein, das ist falsch.', en: 'No, that is wrong.', g: 'Nein,=no | das ist=that is | falsch.=wrong', type: 'gap', gaps: [3], extra: ['richtig', 'Ja,'], alts: ['Nein.', 'Das ist falsch.', 'Nein, Lena kommt aus Italien.'], rwho: 'cast.lena', react: 'Genau, ich komme aus Italien.=exactly, I come from Italy' },
    { who: 'cast.lena', w: 'Morgen spielen wir Fußball. Kommst du auch?', g: 'Morgen=tomorrow | spielen=play | wir=we | Fußball.=soccer | Kommst=are coming | du=you (informal) | auch?=too', mood: 'pleased' },
    { l: true, de: 'Ja, gute Idee!', en: 'Yes, good idea!', g: 'Ja,=yes | gute=good | Idee!=idea', type: 'translate', gaps: [1], extra: ['Frage'], alts: ['Ja, klar!', 'Klar!', 'Natürlich!', 'Ja, natürlich!', 'Gute Idee!'], optional: true, rwho: 'cast.lena', react: 'Bis morgen!=see you tomorrow' },
  ],
  lex: {
    verbs: {
      'wissen': { ich: 'weiß', du: 'weißt', er: 'weiß', wir: 'wissen', ihr: 'wisst', Sie: 'wissen' },
    },
    nouns: { 'Moment': 'm', 'Idee': 'f' },
    related: { 'richtig': 'falsch', 'klar': 'natürlich', 'vielleicht': 'leider' },
    sep: {},
  },
},
];

/* ---------- Grammar reference (shell: units grow with the lessons) ---------- */
const GRAMMAR = [
  { id: 'greet', title: 'Greetings: formal and informal', lesson: 1,
    body: '<p>German has two registers. With a teacher, a shop assistant or a stranger use <em>Guten Morgen / Guten Tag / Auf Wiedersehen</em>. With friends and classmates use <em>Hallo / Tschüss</em>. <em>Guten Morgen</em> is for the morning (until about 10 or 11), <em>Guten Tag</em> for the rest of the day, <em>Guten Abend</em> in the evening.</p><p>Spanish does the same with <em>buenos días</em> and <em>hola</em>; the difference is that German <em>Hallo</em> is also fine in most shops.</p>',
    table: [['formal', 'Guten Morgen, Guten Tag, Auf Wiedersehen'], ['informal', 'Hallo, Tschüss, Wie geht\'s?']],
    examples: [
      { de: 'Guten Morgen, Herr Weber.', g: 'Guten Morgen,=good morning | Herr=Mr | Weber.=Weber', en: 'Good morning, Mr Weber.' },
      { de: 'Hallo, wie geht\'s?', g: 'Hallo,=hi | wie geht\'s?=how are you (informal)', en: 'Hi, how are you?' },
      { de: 'Auf Wiedersehen, Frau Klein.', g: 'Auf Wiedersehen,=goodbye | Frau=Mrs | Klein.=Klein', en: 'Goodbye, Mrs Klein.' } ],
    drills: [
      { q: 'Guten ___, Herr Weber. (it is 9 a.m.)', a: ['morgen'], en: 'Good morning, Mr Weber.' },
      { q: 'Wie geht\'s? Gut, ___.', a: ['danke'], en: 'Fine, thank you.' },
      { q: 'Auf ___, Frau Klein. (formal goodbye)', a: ['wiedersehen'], en: 'Goodbye, Mrs Klein.' },
      { q: '___! (bye, between friends)', a: ['tschüss'], en: 'Bye!' },
      { q: '___, Herr Weber. (you bump into him)', a: ['entschuldigung'], en: 'Excuse me, Mr Weber.' } ] },
  { id: 'sein', title: 'sein — to be', lesson: 2,
    body: '<p>The most irregular verb and the most used. Its forms do not look like the dictionary word <em>sein</em> at all, so learn them as a set.</p>',
    table: [['ich', 'bin'], ['du', 'bist'], ['er / sie / es', 'ist'], ['wir', 'sind'], ['ihr', 'seid'], ['sie / Sie', 'sind']],
    examples: [
      { de: 'Ich bin Student.', g: 'Ich=I | bin=am | Student.=(a) student', en: 'I am a student.' },
      { de: 'Sie sind der Lehrer.', g: 'Sie=you (formal) | sind=are | der=the | Lehrer.=teacher', en: 'You are the teacher.' },
      { de: 'Berlin ist eine Stadt.', g: 'Berlin=Berlin | ist=is | eine=a | Stadt.=city', en: 'Berlin is a city.' } ],
    drills: [
      { q: 'Ich ___ aus Berlin.', a: ['bin'], en: 'I am from Berlin.' },
      { q: 'Sie ___ der Lehrer.', a: ['sind'], en: 'You (formal) are the teacher.' },
      { q: 'Herr Weber ___ Lehrer.', a: ['ist'], en: 'Mr Weber is a teacher.' },
      { q: 'Wir ___ Studenten.', a: ['sind'], en: 'We are students.' },
      { q: 'Du ___ gut.', a: ['bist'], en: 'You (informal) are good.' } ] },
  { id: 'v2', title: 'The verb comes second', lesson: 2,
    body: '<p>In a German statement the conjugated verb is the second element. Not the second word: the second block of meaning. Whatever comes first (the subject, a time, a place), the verb follows it.</p><p>Yes/no questions put the verb first. W-questions (wie, wo, woher…) put the question word first and the verb second.</p>',
    examples: [
      { de: 'Ich komme aus Berlin.', g: 'Ich=I | komme=come | aus=from | Berlin.=Berlin', en: 'I come from Berlin.' },
      { de: 'Heute bin ich in Berlin.', g: 'Heute=today | bin=am | ich=I | in=in | Berlin.=Berlin', en: 'Today I am in Berlin.' },
      { de: 'Sind Sie Student?', g: 'Sind=are | Sie=you (formal) | Student?=(a) student', en: 'Are you a student?' },
      { de: 'Woher kommen Sie?', g: 'Woher=where from | kommen=come | Sie?=you (formal)', en: 'Where do you come from?' } ],
    drills: [
      { q: 'Put in order: aus / ich / Berlin / komme', a: ['ich komme aus berlin'], en: 'I come from Berlin.' },
      { q: 'Put in order: Sie / Student / sind / ?', a: ['sind sie student'], en: 'Are you a student?' },
      { q: 'Put in order: heute / ich / bin / gut', a: ['heute bin ich gut', 'ich bin heute gut'], en: 'Today I am well.' },
      { q: 'Put in order: heißen / wie / Sie / ?', a: ['wie heißen sie'], en: 'What is your name?' },
      { q: 'Put in order: der / ist / Lehrer / Herr Weber', a: ['herr weber ist der lehrer'], en: 'Mr Weber is the teacher.' } ] },
  { id: 'verbs', title: 'Regular verb endings', lesson: 5,
    body: '<p>Most verbs follow one pattern: take the dictionary form, drop <em>-en</em>, add the ending for the person. <em>Sie</em> (polite you) and <em>sie</em> (they) take the same form as the dictionary word.</p><p>A few common verbs change their vowel with <em>du</em> and <em>er</em>: <em>sprechen → du sprichst, er spricht</em>; <em>essen → du isst, er isst</em>.</p>',
    table: [['ich', 'komm-e'], ['du', 'komm-st'], ['er / sie / es', 'komm-t'], ['wir', 'komm-en'], ['ihr', 'komm-t'], ['sie / Sie', 'komm-en']],
    examples: [
      { de: 'Ich wohne in Berlin.', g: 'Ich=I | wohne=live | in=in | Berlin.=Berlin', en: 'I live in Berlin.' },
      { de: 'Woher kommst du?', g: 'Woher=where from | kommst=come | du?=you (informal)', en: 'Where do you come from?' },
      { de: 'Er spricht Spanisch.', g: 'Er=he | spricht=speaks | Spanisch.=Spanish', en: 'He speaks Spanish.' },
      { de: 'Sie lernen Deutsch.', g: 'Sie=you (formal) | lernen=are learning | Deutsch.=German', en: 'You are learning German.' } ],
    drills: [
      { q: 'Ich ___ Deutsch. (lernen)', a: ['lerne'], en: 'I am learning German.' },
      { q: 'Du ___ aus Berlin. (kommen)', a: ['kommst'], en: 'You come from Berlin.' },
      { q: 'Er ___ in Berlin. (wohnen)', a: ['wohnt'], en: 'He lives in Berlin.' },
      { q: 'Wir ___ Kaffee. (trinken)', a: ['trinken'], en: 'We drink coffee.' },
      { q: 'Sie ___ gut Englisch. (sprechen, formal you)', a: ['sprechen'], en: 'You speak English well.' } ] },
  { id: 'wq', title: 'Question words (W-Fragen)', lesson: 7,
    body: '<p>A question with a question word starts with that word, and the verb comes second, exactly as in a statement: <em>Wann gehen wir?</em> There is no <em>¿</em>, and the subject pronoun stays.</p><p>Three words do the work of Spanish <em>dónde</em>: <em>wo</em> asks for a place, <em>woher</em> for the origin, <em>wohin</em> for the destination.</p>',
    table: [['wer', 'who: Wer ist das?'], ['was', 'what: Was machst du?'], ['wo', 'where: Wo wohnst du?'], ['woher', 'where from: Woher kommst du?'], ['wohin', 'where to: Wohin gehst du?'], ['wann', 'when: Wann gehen wir?'], ['warum', 'why: Warum lernst du Deutsch?'], ['wie', 'how: Wie heißen Sie?']],
    examples: [
      { de: 'Wer ist das?', g: 'Wer=who | ist=is | das?=that', en: 'Who is that?' },
      { de: 'Wohin gehst du?', g: 'Wohin=where to | gehst=go | du?=you (informal)', en: 'Where are you going?' },
      { de: 'Wann kommt Lena?', g: 'Wann=when | kommt=is coming | Lena?=Lena', en: 'When is Lena coming?' },
      { de: 'Warum lernst du Deutsch?', g: 'Warum=why | lernst=are learning | du=you (informal) | Deutsch?=German', en: 'Why are you learning German?' } ],
    drills: [
      { q: '___ wohnst du? (where)', a: ['wo'], en: 'Where do you live?' },
      { q: '___ kommst du? (where from)', a: ['woher'], en: 'Where do you come from?' },
      { q: '___ gehst du? (where to)', a: ['wohin'], en: 'Where are you going?' },
      { q: '___ ist das? (who)', a: ['wer'], en: 'Who is that?' },
      { q: 'Put in order: gehen / wann / wir / ?', a: ['wann gehen wir'], en: 'When are we going?' } ] },
  { id: 'yn', title: 'Yes/no questions and short answers', lesson: 8,
    body: '<p>Without a question word, a question starts with the verb: <em>Du kommst heute</em> becomes <em>Kommst du heute?</em>. The words stay the same and the voice rises at the end. There is no <em>¿</em> in German.</p><p>Short answers sound more natural than a bare <em>ja</em> or <em>nein</em>. <em>Klar</em> and <em>natürlich</em> both mean yes, <em>vielleicht</em> means maybe, <em>leider nein</em> softens a no.</p>',
    table: [['ja / nein', 'yes / no'], ['klar, natürlich', 'sure, of course'], ['vielleicht', 'maybe'], ['leider nein', 'unfortunately not'], ['Das stimmt. / Genau.', 'That is right. / Exactly.']],
    examples: [
      { de: 'Kommst du heute?', g: 'Kommst=are coming | du=you (informal) | heute?=today', en: 'Are you coming today?' },
      { de: 'Gehen wir ins Café? Klar!', g: 'Gehen=go | wir=we | ins=to the | Café?=café | Klar!=sure', en: 'Shall we go to the café? Sure!' },
      { de: 'Kommt Ana? Vielleicht.', g: 'Kommt=is coming | Ana?=Ana | Vielleicht.=maybe', en: 'Is Ana coming? Maybe.' } ],
    drills: [
      { q: 'Put in order: Lena / kommt / heute (make it a question)', a: ['kommt lena heute'], en: 'Is Lena coming today?' },
      { q: '___ wir ins Café? (go)', a: ['gehen'], en: 'Shall we go to the café?' },
      { q: 'Kommst du? ___! (of course)', a: ['natürlich'], en: 'Are you coming? Of course!' },
      { q: 'Die Antwort ist nicht richtig, sie ist ___.', a: ['falsch'], en: 'The answer is not right, it is wrong.' },
      { q: 'Ich ___ die Antwort. (know)', a: ['weiß'], en: 'I know the answer.' } ] },
  { id: 'gender', title: 'der, die, das — gender', lesson: 3,
    body: '<p>Every noun has a gender, and the article carries it: <span class="g-m">der</span> (masculine), <span class="g-f">die</span> (feminine), <span class="g-n">das</span> (neuter). The app colours them everywhere. The gender is part of the word, so learn <em>die Stadt</em>, never just <em>Stadt</em>.</p><p>In the plural every noun takes <em>die</em>. A few endings predict gender: <em>-ung, -heit, -keit, -in</em> → die; <em>-chen, -lein</em> → das; <em>-er</em> for people → der.</p>',
    table: [['masculine', 'der Mann, der Tisch'], ['feminine', 'die Frau, die Wohnung'], ['neuter', 'das Kind, das Haus'], ['plural', 'die Kinder, die Häuser']],
    examples: [
      { de: 'Der Tisch ist neu.', g: 'Der=the | Tisch=table | ist=is | neu.=new', en: 'The table is new.' },
      { de: 'Die Küche ist klein.', g: 'Die=the | Küche=kitchen | ist=is | klein.=small', en: 'The kitchen is small.' },
      { de: 'Das Kind hat ein Zimmer.', g: 'Das=the | Kind=child | hat=has | ein=a | Zimmer.=room', en: 'The child has a room.' } ],
    drills: [
      { q: '___ Wohnung (flat)', a: ['die'], en: 'the flat' },
      { q: '___ Haus (house)', a: ['das'], en: 'the house' },
      { q: '___ Stuhl (chair)', a: ['der'], en: 'the chair' },
      { q: '___ Freundin (friend, female)', a: ['die'], en: 'the (female) friend' },
      { q: '___ Fenster (window)', a: ['das'], en: 'the window' } ] },
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
