/* Lesson 1 */
LESSONS.push({
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
});

GRAMMAR.push({ id: 'greet', title: 'Greetings: formal and informal', lesson: 1,
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
      { q: '___, Herr Weber. (you bump into him)', a: ['entschuldigung'], en: 'Excuse me, Mr Weber.' } ] });
