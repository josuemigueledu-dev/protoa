// AI tasks for the German course. The browser names a task and sends the values
// it fills in; the prompt text lives here, so the endpoint is not a general-purpose
// proxy to Claude. Each task: input (Zod, with size caps), tier, prompt(vars),
// and either output (Zod schema, structured outputs) or long: true (free-form JSON).
import { z } from 'zod';

const str = (max) => z.string().max(max);
const words = (maxItems) => z.array(str(80)).max(maxItems);

export const tasks = {
  // Free answer in the lesson conversation (§8.3).
  checkFree: {
    tier: 'quick',
    input: z.object({ question: str(500), answer: str(500), words: words(5000) }),
    output: z.object({ ok: z.boolean(), understandable: z.boolean(), issue: z.string(), hint: z.string() }),
    prompt: ({ question, answer, words }) => `You are checking a beginner German learner's reply in a conversation.\nQuestion asked (German): ${question}\nLearner's reply: ${answer}\nWords the learner has studied: ${words.join(', ')}\nJudge whether the reply is an understandable, grammatically acceptable German answer to the question (small errors are fine at A1). Reply with only JSON: {"ok": boolean, "understandable": boolean, "issue": "one short sentence naming the main problem, or empty", "hint": "one targeted hint in English that names the problem without giving the full corrected sentence"}`,
  },

  // "Write your own": one sentence back corrected.
  correctSentence: {
    tier: 'quick',
    input: z.object({ sentence: str(500) }),
    output: z.object({ corrected: z.string(), error: z.string(), extend: z.string() }),
    prompt: ({ sentence }) => `A beginner learner of German wrote this sentence: "${sentence}"\nReply with only JSON: {"corrected": "the sentence corrected (unchanged if already correct)", "error": "the main error named in one plain English sentence, or 'No errors.'", "extend": "one short way to extend the sentence, in German with simple A1 words, with an English gloss in parentheses"}`,
  },

  // "Why? Explain it" after a wrong translation.
  explainMistake: {
    tier: 'quick',
    input: z.object({ en: str(500), target: str(500), answer: str(500) }),
    output: z.object({ explanation: z.string() }),
    prompt: ({ en, target, answer }) => `A beginner learner of German (English speaker, fluent in Spanish) was asked to say: "${en}". The model answer is: "${target}". The learner wrote: "${answer}". Explain in at most two short plain-English sentences what the learner's version gets wrong and why German works that way. Mention a Spanish parallel only if it truly helps. Reply with only JSON: {"explanation": "..."}`,
  },

  // Sprechen: one turn of free conversation.
  talkTurn: {
    tier: 'default',
    input: z.object({
      profile: z.object({ name: str(100), city: str(100), field: str(100), interests: str(300) }).partial(),
      brief: str(600),
      known: str(8000),
      history: z.array(z.object({ who: z.enum(['w', 'l']), de: str(600) })).min(1).max(40),
    }),
    output: z.object({
      de: z.string(), en: z.string(), gloss: z.string(),
      correction: z.object({ ok: z.boolean(), corrected: z.string(), note: z.string() }),
      done: z.boolean(),
    }),
    prompt: ({ profile: p, brief, known, history }) => {
      const hist = history.map(m => (m.who === 'w' ? 'Protoa: ' : 'Student: ') + m.de).join('\n');
      return `You are Protoa, a warm, precise German conversation partner in Berlin with a dry sense of humour (you are a voice without a body; if asked your name, you are Protoa), in a spoken conversation with your student ${p.name || ''} (lives in ${p.city || 'the US'}, studies/works in ${p.field || 'unknown'}, interests: ${p.interests || 'unknown'}).
Scenario: ${brief}
The student is a beginner (A1, aiming for spoken B1). Words the student knows: ${known}.
Rules for your line ("de"): German only, use Sie, 1–2 short sentences (each at most 12 words), mostly the student's known words, react to what the student said, and end with one simple question that keeps the scenario going. No emoji, no exclamation marks for effect. Keep to everyday life in Berlin (cafés, work, family, sport, transport, food, weather): never bring up religion or politics, and if the student does, steer back to the scenario in one friendly sentence.
Judge the student's LAST message: "ok": true if it is understandable and acceptable for A1 (tiny slips are fine); otherwise "corrected" = the natural corrected German version of what they meant and "note" = one plain-English sentence naming the main error (mention a Spanish parallel only if it truly helps). If ok, "note" is empty, or one plain-English sentence with something specific worth knowing (a more natural way to say it, or a word they could add); never generic praise.
"gloss": every German token of "de" with its meaning in context, format "word=meaning | word=meaning", fixed phrases as one span, punctuation attached to the German word.
Set "done": true once the scenario has naturally concluded or after about 10 student lines; then "de" is a friendly goodbye.
Reply with only JSON: {"de": "...", "en": "...", "gloss": "...", "correction": {"ok": true, "corrected": "", "note": ""}, "done": false}
Conversation so far:
${hist}`;
    },
  },

  // Sprechen: "How do I say…?"
  talkHelp: {
    tier: 'quick',
    input: z.object({ brief: str(600), question: str(300) }),
    output: z.object({ de: z.string(), tip: z.string() }),
    prompt: ({ brief, question }) => `A beginner learner of German (A1) wants to say this to their teacher (formal Sie), in this situation: ${brief}\nWhat they want to say: "${question}"\nGive the simplest natural German sentence for it. Reply with only JSON: {"de": "...", "tip": "one short English tip about a word or structure in it"}`,
  },

  // Level exams: mark the items the app cannot mark itself.
  gradeExam: {
    tier: 'default',
    input: z.object({
      code: z.enum(['A1', 'A2', 'B1', 'B2']),
      items: z.array(z.object({
        i: z.number().int().min(0), kind: z.enum(['trans', 'order', 'speak', 'write']),
        task: str(1000), model: str(1000), answer: str(2000), max: z.number().int().min(0).max(20),
      })).min(1).max(60),
    }),
    output: z.object({ marks: z.array(z.object({ i: z.number().int(), points: z.number(), note: z.string() })) }),
    prompt: ({ code, items }) => `You are a strict, fair examiner for the Goethe-Zertifikat ${code}. Mark each answer. Kinds:\n- "trans": English → German translation; correct (1) only if it is grammatical German with the same meaning as the English (the model is one valid answer; other correct wordings count; spelling must be right except ae/oe/ue/ss for umlauts; wrong article, ending or word order = 0).\n- "order": the learner reordered given words; correct (1) only if the order is grammatical German with the meaning of the English.\n- "speak": an answer to the question at level ${code}; 1 point only if it answers the question in a complete, understandable, mostly correct German sentence; else 0.\n- "write": a short text for the task; give 0..max points: content points addressed (up to 3 for A1/A2), grammar and vocabulary appropriate to ${code}; be strict, typical learner text with several errors scores about half.\nItems: ${JSON.stringify(items)}\nReply with only JSON: {"marks": [{"i": 0, "points": 0, "note": "one short English sentence on the main problem or what was good"}]}`,
  },

  // "Write it with Claude": a whole new lesson (§12). The app validates the shape.
  generateLesson: {
    tier: 'default',
    long: true,
    input: z.object({
      n: z.number().int().min(1).max(500),
      topic: str(200), station: str(100),
      profile: z.object({ name: str(100), city: str(100), field: str(100), interests: str(300), why: str(500) }).partial(),
      known: words(5000),
      art: z.array(z.object({ id: str(60), kind: str(20), tags: z.array(str(30)).max(12) })).max(400).default([]),
      example: z.record(z.string(), z.unknown()).refine(v => JSON.stringify(v).length <= 60000, 'example lesson too large'),
    }),
    prompt: ({ n, topic, station, profile, known, art, example }) => {
      // the difficulty ladder in docs/specs/lesson-experience.md §3
      const ladder = n <= 3
        ? 'No typing at all: every build item is "tiles", every learner turn is "tiles", no "gap", "translate" or "free" turns.'
        : n <= 10
          ? 'Tiles are the default. A "gap" item or turn may ask for one typed word that the learner has already used earlier in this lesson. No "translate" or "free" turns.'
          : 'Tiles are the default; "gap" and "translate" turns may ask the learner to type a short sentence, and the conversation has exactly ONE "free" turn near the end.';
      return `Write lesson ${n} of a German course for an English speaker (fluent in Spanish) aiming for spoken B1. Theme: ${topic}. The lesson is set at or near the Berlin U-Bahn station ${station}.
Learner profile: ${JSON.stringify(profile)}. Already-known words (do not teach again, may reuse): ${known.join(', ')}.
People: the course's recurring cast in an everyday Berlin. Herr Weber (teacher at the Volkshochschule am Hermannplatz, room 2.04, from Berlin, mid-50s, short precise sentences, dry humour, says "So." before he changes topic, uses Sie); Ana (from Mexico City, lives in Neukölln, fast, corrects herself: "Nein, warte"); Lena (from Rome, guitarist, drinks three coffees a day, says "Ach so" and "Na gut"); Murat (barista at the café next to the school, calm and formal). Students use du with each other and Sie with Herr Weber and Murat. Every partner turn has who: one of the scene.cast ids (default cast.weber). Nothing religious or political anywhere: keep to cafés, work, family, sport, transport, food and weather.
Teaching rules:
- 10–14 new items. An item is a word (one word) or a phrase (a fixed combination such as "Guten Tag"); a phrase has type "phrase" and "parts": "guten (good) + Tag (day)".
- Never test what wasn't taught: every German word the learner must choose or produce (build items and their extra tiles, the learner's own conversation lines and their extra tiles) is one of this lesson's new items or a known word. Extra tiles (distractors, at most two per item) are known words of the same kind.
- Partner lines may contain at most two words that are neither new nor known, always glossed, and the learner never has to use them.
- ${ladder}
- The build step uses one or two exercise types in a set order; the conversation is the finale and has a reason to care (a small twist).
- notice: one short grammar rule in plain English; add a Spanish contrast only where it truly helps (e.g. "like usted").
- warmup: 3–5 known headwords to review at the start.
- Feedback and reactions ("react") are specific: they confirm the exact form or say what it means. No hollow praise, no emoji, no exclamation marks for effect. German that Germans really say.
Reply with ONLY a JSON object with exactly the shape and conventions of this example lesson (same keys, plus warmup; gloss format "de=en | de=en" where glosses are meaning in context, fixed phrases get one span, and every German token is glossed; conversation of 8–12 turns alternating partner turns {who,w,g,mood} and learner turns {l:true,de,en,g,type,gaps,extra,alts,react}; lexicon with every verb's forms and every noun's gender; every new item with ipa, resp (stressed syllable CAPS), syl with ·, example with the item in [brackets], exEn, exG). Art: choose scene.plate, every scene.cast id, twist.event and every words[].pic ONLY from this list of {id, kind, tags} (plate.* for plates, cast.* for cast, event.* for events, word.* for pictures; omit pic when no picture fits): ${JSON.stringify(art)}. Example:
${JSON.stringify(example)}`;
    },
  },
};
