/* Arthur's copy runs inside claude.ai, where there is no Protoa server. This answers the app's AI tasks
   with Claude directly (the page's `sample` capability, on Arthur's own account). The prompts are copies
   of server/src/apps/deutsch/tasks.js; keep them in step when that file changes. */
window.PROTOA_BRIDGE_SETUP = async () => {
  let sample = null;
  try { sample = await window.claude?.use?.('sample'); } catch (e) { sample = null; }
  if (!sample) return false;
  const P = {
    checkFree: ['quick', ({ question, answer, words }) => `You are checking a beginner German learner's reply in a conversation.\nQuestion asked (German): ${question}\nLearner's reply: ${answer}\nWords the learner has studied: ${(words || []).join(', ')}\nJudge whether the reply is an understandable, grammatically acceptable German answer to the question (small errors are fine at A1). Reply with only JSON: {"ok": boolean, "understandable": boolean, "issue": "one short sentence naming the main problem, or empty", "hint": "one targeted hint in English that names the problem without giving the full corrected sentence"}`],
    correctSentence: ['quick', ({ sentence }) => `A beginner learner of German wrote this sentence: "${sentence}"\nReply with only JSON: {"corrected": "the sentence corrected (unchanged if already correct)", "error": "the main error named in one plain English sentence, or 'No errors.'", "extend": "one short way to extend the sentence, in German with simple A1 words, with an English gloss in parentheses"}`],
    explainMistake: ['quick', ({ en, target, answer }) => `A beginner learner of German (English speaker, fluent in Spanish) was asked to say: "${en}". The model answer is: "${target}". The learner wrote: "${answer}". Explain in at most two short plain-English sentences what the learner's version gets wrong and why German works that way. Mention a Spanish parallel only if it truly helps. Reply with only JSON: {"explanation": "..."}`],
    talkTurn: ['quick', ({ profile: p = {}, brief, known, history }) => {
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
    }],
    talkHelp: ['quick', ({ brief, question }) => `A beginner learner of German (A1) wants to say this to their teacher (formal Sie), in this situation: ${brief}\nWhat they want to say: "${question}"\nGive the simplest natural German sentence for it. Reply with only JSON: {"de": "...", "tip": "one short English tip about a word or structure in it"}`],
    gradeExam: ['default', ({ code, items }) => `You are a strict, fair examiner for the Goethe-Zertifikat ${code}. Mark each answer. Kinds:\n- "trans": English → German translation; correct (1) only if it is grammatical German with the same meaning as the English (the model is one valid answer; other correct wordings count; spelling must be right except ae/oe/ue/ss for umlauts; wrong article, ending or word order = 0).\n- "order": the learner reordered given words; correct (1) only if the order is grammatical German with the meaning of the English.\n- "speak": an answer to the question at level ${code}; 1 point only if it answers the question in a complete, understandable, mostly correct German sentence; else 0.\n- "write": a short text for the task; give 0..max points: content points addressed (up to 3 for A1/A2), grammar and vocabulary appropriate to ${code}; be strict, typical learner text with several errors scores about half.\nItems: ${JSON.stringify(items)}\nReply with only JSON: {"marks": [{"i": 0, "points": 0, "note": "one short English sentence on the main problem or what was good"}]}`],
  };
  const codeOf = c => c === 'rate_limited' ? 'rate_limited' : c === 'not_granted' ? 'unavailable' : c === 'refused' ? 'refused' : 'upstream';
  window.PROTOA_AI_BRIDGE = async (task, vars) => {
    const t = P[task];
    if (!t) throw Object.assign(new Error('Not available in this copy.'), { code: 'unavailable' });
    try { return await sample.json(t[1](vars || {}), { modelTier: t[0], cache: task !== 'talkTurn' }); }
    catch (e) { throw Object.assign(new Error((e && e.message) || 'Claude could not answer.'), { code: codeOf(e && e.code) }); }
  };
  return true;
};
