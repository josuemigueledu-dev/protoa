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

Choose **option C**: a complete free course plus a paid tier that sells AI practice and convenience, **$7.99/month or $59.99/year**, web checkout first, store billing when the native apps ship. Launch to Spanish speakers first.

Decision the owner needs to make is listed in the run's log: confirm option C and the price band, so monetization groundwork (entitlements config, quotas, paywall hook) can follow it.
