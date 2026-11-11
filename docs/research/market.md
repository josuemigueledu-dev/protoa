# Market research: language-learning apps and where Protoa fits

Written 2026-10-24 by the platform agent. Prices come from third-party aggregators and review sites found by web search on that date; they vary by country, plan length, device and the A/B test the store is running. **Treat every number as indicative and re-check the official store listing before any pricing decision.** Claims marked *(background)* are general industry knowledge, not looked up in this run.

## 1. What the competitors charge

| App | Free tier | Paid tier (indicative, USD) | Model |
|---|---|---|---|
| Duolingo | Full course with ads; a limiter on practice (hearts, being replaced by "energy" that drains on every exercise; refill by waiting, ads or gems) | Super about $10–13/month or $80–120/year (six different US App Store prices seen); Max (AI roleplay, video call) roughly double | Freemium, consumer subscription, huge top of funnel |
| Babbel | Almost none: first lesson, then paywall | About $18/month, or $9–15/month on longer plans; $90–108/year; lifetime deals around $159 appear | Paid-first, structured curriculum |
| Busuu | Limited lessons | Premium about $7–23/month, $70–139/year | Freemium, community corrections |
| Speak | Short trial | From about $84/year | Paid-first, AI speaking tutor |
| Memrise | Free tier | $25/month, $62/year, $330 lifetime (one US snapshot); another source says about $9/month, $60/year | Freemium, spaced repetition |
| Lingoda | 7-day trial | Live classes: group about $6–8 per class in packs ($40 for 5 classes per 4 weeks up to $243 for 40); private from about $43 per class (Aug 2026 snapshot; other sources disagree widely) | Live teachers, pay per class pack |

Sources:
- Duolingo: [Duolingo cost review](https://www.mindomax.com/duolingo-cost), [Duolingo pricing](https://toolradar.com/tools/duolingo/pricing), [UK price review](https://freedomisntfree.co.uk/articles/is-super-duolingo-worth-it-uk), [Duolingo Max review](https://storylearning.com/duolingo-max-review) (all fetched 2026-10-24).
- Babbel, Busuu, Speak, Memrise: [Babbel cost](https://testprepinsight.com/resources/how-much-does-babbel-cost/), [Memrise pricing](https://toolradar.com/tools/memrise/pricing), [Memrise on G2](https://www.g2.com/products/memrise/pricing), [Duolingo alternatives](https://www.mindomax.com/duolingo-alternatives), [best AI language tools](https://dupple.com/learn/best-ai-language-learning-tools).
- Lingoda: [Lingoda cost](https://onlinecourseing.com/lingoda-cost/), [Lingoda site](https://www.lingoda.com) (no prices listed).

Pattern: the category settled on about **$60–120 a year** for self-study apps, **$40–240 a month** only when a human teacher is involved. Monthly prices are a decoy; annual plans carry the business *(background)*.

## 2. What reviewers praise and complain about

Evidence here is thin and mostly aggregator summaries ([review roundup](https://unstar.app/blog/language-learning-app-reviews-duolingo-babbel-rosetta-stone-2026), [Babbel listing analysis](https://marlvel.ai/apps/com-babbel-babbelmulti/vs)). Directional only.

Praised:
- Babbel: a clear, structured path for beginners.
- Duolingo: habit and streak mechanics keep people coming back *(background)*.
- AI tutors (Speak, Duolingo Max): real speaking practice at any hour *(background)*.

Complained about:
- **Paywalls in the middle of a lesson** and right after the first lesson: "some of the angriest reviews in the category".
- **Price creep** (one source: Duolingo Super $6.99 to $13.99 in 18 months).
- **Trials that ask for a card and then bill annually**, and refund refusals after 14 days.
- **Limits on free practice** (hearts and energy) that punish mistakes, which is the opposite of how learning works.
- Weak speech recognition and robotic AI voices.
- Lessons that teach isolated sentences nobody says; thin story *(background, and the owner's own critique in `visual-direction.md`)*.

## 3. Where Protoa can win

1. **A real place and a real cast.** One story in Berlin across 60 lessons. Competitors teach disconnected sentences; Protoa gives a reason to open the next lesson.
2. **A Spanish speaker learning German.** Contrast notes (ser/estar vs sein, gender, word order) are rare. Narrow focus, but exactly the people searching "learn German from Spanish/English".
3. **AI conversation that is part of the course**, not a bolt-on tier: the learner practises with the people they met in the lesson.
4. **Honest monetization.** Competitor complaints are mostly about dark patterns. A free course that is complete up to A1, with no mid-lesson paywall and no hearts, is itself a differentiator.
5. **The orb.** A distinct, memorable companion instead of a mascot.

Weak spots to be honest about: no brand, no content beyond A1 yet, one language pair, no accounts or sync (see `CLAUDE.md`), no offline mode, and AI cost per learner (see the coming `ai-costs.md`).

## 4. Pricing options

**A. Free with limits, Duolingo style.** Large funnel, but needs ads or an energy limiter. Clashes with the "never dark patterns" rule. Not recommended.

**B. Paid-first, Babbel style.** Simple, but a new unknown app behind a paywall gets no installs. Not recommended.

**C. Free course, paid "more practice" (recommended).** Free forever: all lessons, grammar reference, the first levels of spaced review, a small monthly AI allowance (a handful of conversations). Protoa Plus unlocks what costs us money or adds convenience: a much larger AI conversation allowance, AI-generated custom lessons, unlimited review history and sync across devices, offline packs. Never pay-to-progress: no lesson is ever locked for payment, no timers, no mid-lesson prompts; the upgrade screen is reachable from settings and appears only after a finished lesson, once.

Indicative price: **$7.99/month or $59.99/year** (margin depends on the AI quotas, to be set in the coming `ai-costs.md`), with a 7-day trial that needs no card on web. This sits at the low end of the market (Duolingo Super, Busuu, Memrise annual) while a stronger AI allowance justifies it against Babbel and Speak. A **lifetime** option can come later for the Memrise crowd. Regional prices (cheaper in Latin America, which fits the Spanish-speaking audience) are set per store.

Store fees reduce this: Apple and Google take 15–30% depending on program and region, and Apple's EU terms changed again on 2026-10-01 (reported 26% standard, 15% for Small Business Program or for link-out to a web checkout; [Engadget](https://engadget.com/2239483/apple-has-new-in-app-transaction-commission-rates-for-eu-devs/), [Mobile World Live](https://www.mobileworldlive.com/apple/apple-revamps-eu-app-store-model/); figures conflict across outlets, confirm in Apple's terms). Both stores offer a reduced rate for small developers *(background; verify)*. A web checkout avoids the fee where the store rules allow linking to it, so the launch plan should make the web the first paid surface.

## 5. Three ways to grow

1. **Spanish-speaking learners first.** Spanish-language landing page and App Store listing ("Aprende alemán desde el español"), a niche with real demand and little competition for the contrast angle. Content marketing: short posts on false friends and ser/estar-style contrasts.
2. **Story as the hook.** Share the cast: short shareable moments (the twist sticker at the end of a lesson, a "Berlin postcard" image, a weekly cliffhanger). Free first chapter works without an account so a link can open straight into lesson 1.
3. **The web is the funnel, apps are the home.** Installable PWA (no store review, no fee) with sign-in to sync; store apps follow once retention is proven. Add a referral that gives both people a free month of AI conversation, never locked content.

## 6. Recommendation

*(Superseded: the owner picked model A on 2026-10-24; see section 7.)* Choose **option C**: a complete free course plus a paid tier that sells AI practice and convenience, **$7.99/month or $59.99/year**, web checkout first, store billing when the native apps ship. Launch to Spanish speakers first.

Decision the owner needs to make is listed in the run's log: confirm option C and the price band, so monetization groundwork (entitlements config, quotas, paywall hook) can follow it.

## 7. Owner's pick: model A, free with limits, and a Plus worth paying for

Added 2026-10-25. The owner picked **model A** on 2026-10-24 (issue #1): the whole course is free, practice has a daily allowance that refills, Plus removes the limits and adds more AI conversation, every limit on the core course is a little more generous than Duolingo's, mistakes cost less, and no lesson is ever locked behind payment. On 2026-10-25 the owner sent back the first numbers (open PRs #59 and #63) as "too lenient, there has to be an incentive to go premium, if free is just premium lite then it doesn't work." This section is the redo: the free AI allowances are much tighter, the core course stays a little more generous than Duolingo, and Plus has clear extras. Models stay hybrid (quick tasks on Haiku 5.5, conversation, exams and generated lessons on Sonnet 5.5; `ai-costs.md`).

### Duolingo's limits (as of October 2026)

Duolingo publishes almost no numbers itself, so most of these come from fan wikis, press and user reports, and A/B groups differ. **Re-check in the app before launch.**

- **Energy** replaced hearts, tested from 2025-07-03 ([Duolingo blog](https://blog.duolingo.com/duolingo-energy/); [CNET via AOL](https://www.aol.com/news/duolingo-bringing-energy-language-learning-120004759.html); [Android Authority](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/); [Duolingo Wiki, Energy](https://duolingo.fandom.com/wiki/Energy); [Duoplanet](https://duoplanet.com/duolingo-energy-system/); all found 2026-10-25). **25 energy** when full. **Every exercise costs 1**, right or wrong, and reports say a wrong answer can cost 1 more. **Everything draws on it, lessons included**, so a free learner gets roughly 2–3 lessons before the wall ([2026 review](https://www.myengineeringbuddy.com/blog/duolingo-reviews-pricing-alternatives-2026/)). It refills **about +1 an hour**, full in about a day. Five right in a row gives back a **random 1–5**; ads, gems, chests and friend bonuses give more. Reviewing your mistakes at the end of a lesson is free.
- **Explain My Answer** (why an answer was wrong) has been **free for everyone since 2026-01-01** in most German, Spanish, French, Italian, Portuguese, Japanese and Korean courses; before that it was Max only. No published cap; in practice it is bounded by energy, so a free learner can only make the mistakes that 25 exercises allow ([StoryLearning, checked 2026-09-19](https://storylearning.com/duolingo-max-review); [Nibble, updated 2026-08-26](https://nibble-app.com/blog/is-duolingo-max-worth-it); both read 2026-10-25).
- **AI conversation**: none on free or Super. **Max** adds Roleplay and Video Call with Lily (calls of about 1–3 minutes, as often as you like), in the iOS and Android apps only (same sources).
- **Prices**: Super about $12.99/month or $84/year (US App Store shows six unlabelled Super prices, $9.99 to $119.99, on 2026-09-19); Max about $29.99/month or $168/year (Nibble; Max prices appear only inside the app).

For a second reference point on AI allowances: Speak Premium is $17.99/month or $83.99/year and caps custom "Made for You" lessons at 3 a day; Premium Plus ($39.99/month) lifts it ([LanguaTalk](https://languatalk.com/blog/speak-app-review/), [SpeakShark](https://speakshark.com/blog/speak-app-review-2026), read 2026-10-25; prices from the US App Store in July 2026).

### Side by side (proposal, for the owner's sign-off)

Core course, no AI (costs us nothing per learner):

| Limit | Duolingo free | Protoa free | Protoa Plus |
|---|---|---|---|
| Lessons | Draw energy: 2–3 a day before the wall | **Never limited**, never cost energy | Never limited |
| Daily review of due words | Draws energy | **Never limited** | Never limited |
| Extra drills (Practice hub) | Draw energy | Draw energy | **Unlimited** |
| Full bar | 25 | 25 | no bar |
| Cost per exercise | 1 | 1 | 0 |
| Extra cost of a mistake | 0 to 1 | **0** | 0 |
| Refill | about +1 an hour, full in about a day | **+1 every 50 minutes**, full in under 21 hours | n/a |
| Five right in a row | random 1–5 back | **3 back, every time** (Duolingo's average, without the lottery) | n/a |
| Running out mid-session | Blocks the next exercise | **The drill you started always finishes** | n/a |
| Ways to refill early | Ads, gems | None (no ads, no gems) | n/a |
| Exams | In the course | **2 marked a day**, never locked | 2 marked a day |

AI (each call costs us money):

| Allowance | Duolingo free | Protoa free | Protoa Plus |
|---|---|---|---|
| "Why? Explain it" after a mistake, and checks of your own free replies | Explain My Answer, bounded by energy | **15 a day** | 100 a day (fair use) |
| "Correct my sentence" and "How do I say…?" in Sprechen | none | **5 a day** | 50 a day (fair use) |
| Sprechen conversation with the cast | none (Max, about $30/month) | **10 turns a week**: one short conversation, to try it | **240 turns a month**: a full conversation every day |
| Write your own lesson (AI-generated) | none | none | **4 a month** |
| Price | $0 (Super about $13, Max about $30) | $0 | **$7.99/month or $59.99/year** |

What changed from the first proposal: free conversation turns 25 a week → 10 a week; free quick checks 40 a day in one pool → 15 explanations plus 5 tools a day; free exams 3 → 2 a day; drill energy 30 with +1 every 40 minutes and 1 back per combo → 25 with +1 every 50 minutes and 3 back per combo. Plus is unchanged on conversation (240 turns) and generated lessons (4), and gets unlimited drills.

**Why Plus is now worth paying for.** A free learner can finish the whole course and keep every word, so free is never a trial. But the parts that feel like a tutor are a taste on free and a daily habit on Plus: more than 5x the conversation (about 43 turns a month against 240), 7–10x the explanations and tools, unlimited drills, and lessons written for you. Duolingo sells unlimited energy at about $13 and AI conversation only at about $30; Protoa Plus sells both for $7.99.

**What it costs us** (hybrid models, prices in `ai-costs.md`): a free learner who uses every allowance every day costs about $2.30 a month ($0.80 without exams; a typical free learner about $0.50). A Plus learner who maxes everything costs about $7.00 a month, more than the annual plan's $3.50–4.80 net, so the fair-use caps, the logged usage and the global daily spend ceiling in `ai-costs.md` stay necessary; a typical Plus learner (15 conversations, a few explanations a day, two generated lessons) is about $2.20.

### Recommendation

Approve both tables. The core course stays more generous than Duolingo on every row (lessons and due reviews never limited, mistakes cost nothing), while the AI tutor is what Plus sells. No ads and no gems at launch; a referral month of Plus (section 5) is the only other way to get more. The numbers live in two config objects, `PLANS` in `server/src/entitlements.js` (PR #59) and `ENERGY` in `server/src/energy.js` (PR #63), both updated to these values, so any number changes in one line. Nothing changes for learners while `MONETIZATION` is off.
