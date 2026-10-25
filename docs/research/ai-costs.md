# AI cost per learner and per-user quotas

Written 2026-10-25 by the platform agent. Prices are Anthropic's first-party API list prices as cached in the Claude API reference on that date; **re-check [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) before setting a price.** Token counts per task are **my estimates from reading the prompts in `server/src/apps/deutsch/tasks.js`, not measurements** (no API key in this environment). Section 6 says how to replace them with real numbers.

## 1. Prices used (USD per million tokens)

| Model | Input | Output | Cache read |
|---|---|---|---|
| `claude-opus-5-5` (today's default for every task) | 4.00 | 20.00 | 0.20 |
| `claude-sonnet-5-5` | 2.00 | 10.00 | 0.20 |
| `claude-haiku-5-5` (prompts up to 100K tokens) | 0.10 | 0.50 | not listed |

Thinking tokens are billed as output. Tasks run at `low` effort (tier `quick`) or `medium` (`default`), so each reply carries some thinking on top of the JSON; the output figures below include it. Cache writes cost about 1.25x input *(background)*.

## 2. What one call costs

Seven tasks are in use. Estimated tokens (in / out including thinking) and cost per call:

| Task | Tier | In / out | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|---|---|
| `checkFree` (judge a free reply; sends the known-word list) | quick | 1,500 / 400 | $0.0140 | $0.0070 | $0.0003 |
| `correctSentence` | quick | 200 / 350 | $0.0078 | $0.0039 | $0.0002 |
| `explainMistake` | quick | 250 / 400 | $0.0090 | $0.0045 | $0.0002 |
| `talkHelp` | quick | 250 / 300 | $0.0070 | $0.0035 | $0.0002 |
| `talkTurn` (one conversation turn; known words plus history up to 40 lines) | default | 2,800 / 900 | $0.0292 | $0.0146 | $0.0007 |
| `gradeExam` (up to 60 items) | default | 5,000 / 1,500 | $0.050 | $0.025 | $0.0013 |
| `generateLesson` (example lesson + art list in, a whole lesson out) | default | 20,000 / 15,000 | $0.38 | $0.19 | $0.0095 |

A conversation of 8 student turns is **$0.23 on Opus 5.5, $0.12 on Sonnet 5.5**. Conversation turns are 70% of an active learner's bill.

## 3. One active learner per month

Profile (invented, to be replaced by real telemetry): studies 20 days a month; 120 free-reply checks, 20 mistake explanations, 10 sentence corrections, 20 "how do I say" helps, 10 conversations of 8 turns (80 turns), one exam. Plus learners add one generated lesson.

| Setup | Cost per month |
|---|---|
| Everything on Opus 5.5 (today) | about $4.50 ($4.85 with a generated lesson) |
| Everything on Sonnet 5.5 | about $2.25 |
| Quick tasks on Haiku 5.5, conversation and exams on Sonnet 5.5 | **about $1.25** |
| Everything on Haiku 5.5 | about $0.10 |

Against revenue: $59.99/year is $5.00/month; after a 15 to 30% store fee that is $3.50 to $4.25, and about $4.80 through web checkout (card fees about 3%, *background*). On Opus for everything, a typical Plus learner would eat the whole margin. **Moving off all-Opus is a requirement for the free-with-limits model, not an optimisation.**

## 4. Levers, in order of value

1. **Right model per task** (needs no code: `PROTOA_MODEL_QUICK` already exists in `server/src/claude.js`). Quick tasks are short judgements on a few words; Haiku 5.5 is 40x cheaper than Opus there. Keep conversation turns and exam marking on a stronger model, because bad German corrections are the product failing. **Before switching, run an eval** on 50 to 100 real learner replies per task and compare verdicts with Opus (the `build-eval` flow in the claude-api skill). Two risks to check first: `params()` sends `fallbacks: "default"` on every call, and the API reference says Haiku 5.5 has no server-side refusal fallback, so the call may be rejected; and `PROTOA_MODEL` only switches the default tier, so a separate setting is needed to put `talkTurn` on Sonnet while `gradeExam` stays elsewhere if wanted.
2. **Effort**: `talkTurn` at `medium` carries most of its cost in output (thinking). Try `low` on the eval. Cheaper than any model change.
3. **Prompt caching**: Opus and Sonnet 5.5 cache reads cost $0.20 per million, 5% and 10% of input. Our prompts are under about 3,000 tokens, and the minimum cacheable prefix is model-dependent (512 to 4,096 tokens per the API reference), so little would cache today and the history changes every turn. Worth doing only for `generateLesson` (the example lesson and art list repeat, about 20K tokens) if lesson generation becomes popular.
4. **Cap what goes in**: `checkFree` sends the whole known-word list (up to 5,000 words). Send only words from the current lesson and the last few; saves about 1,000 tokens a call.
5. **Batch** is 50% off but asynchronous; only fits pre-generating content, not live tutoring.

## 5. Quotas

The owner picked "free with limits, a little more generous than Duolingo" (`market.md` records Duolingo's practice limits; I did not research Duolingo's AI limits here). Course practice with no AI is free and unlimited in cost to us. AI is the only variable cost, so quotas are on AI calls. **Proposed numbers, on the hybrid setup (quick on Haiku, rest on Sonnet 5.5):**

| Allowance | Free | Plus |
|---|---|---|
| Quick checks, corrections, explanations (combined) | 40 a day | 200 a day |
| Conversation turns | 25 a week (about 3 conversations) | 240 a month (about 30 conversations) |
| Exam marking | 3 exams a day | 3 exams a day |
| Generated lessons | 0 | 4 a month |
| Worst-case cost per user per month | about $1.60 | about $3.90 (typical use $1.25 to $1.50) |

Why: a free learner who maxes every quota every month costs under $2, which a modest conversion rate pays for. A Plus learner's worst case stays under the $4 net revenue on the cheaper plans, and typical use is a third of it. Mistakes must not cost the learner anything in AI terms: a call that fails for server reasons does not count against the quota. Exams and the course itself are never locked.

Add a global daily spend ceiling (circuit breaker) so a bug or abuse cannot run up a bill: when the day's estimated spend passes a set dollar amount, AI answers "unavailable" and the app degrades as it does today with no key.

## 6. Replace the estimates with measurements

`askJSON` and `askLongJSON` do not log `usage`. Add one line per call (task, model, input, output, cache read tokens, no user text) in the quota work (backlog item "per-user AI quota checks"), then re-run these tables from a week of real use.

## Recommendation

1. Plan on **hybrid models**: quick tasks on Haiku 5.5, conversation and exams on Sonnet 5.5, after an eval on real replies. All-Opus costs about 3.5x more.
2. Ship the quotas in section 5 behind the entitlements config (`MONETIZATION=off` by default) and show them to the owner on the sign-off board before anything goes live.
3. Log token usage per call from day one, and add the daily spend ceiling.
