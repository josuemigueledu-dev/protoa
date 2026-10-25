# Launch plan: hosting, accounts, sync, quotas, stores, payments, privacy

Written 2026-10-25 by the platform agent. Nothing here is built or deployed. Store and legal facts come from web searches on that date, mostly secondary sources; **confirm each against the official page before relying on it.** Each section gives options, a recommendation, and what the owner must decide (collected at the end).

Owner decisions already made: pricing model **A, free with limits** (whole course free, daily practice allowance, Plus removes limits and adds AI conversation, a little more generous than Duolingo; no lesson locked behind payment); Piper voices; `MONETIZATION=off` by default. Note this overrides the option C recommended in `market.md`; the quotas in `ai-costs.md` section 5 still apply to AI calls.

## 1. Hosting

The server is one Hono app (`server/src/app.js`): static files plus `/api`. The only state today is the in-memory rate limiter.

| Option | For | Against |
|---|---|---|
| **A. One small Node host** (Fly.io, Railway, Render) with a managed Postgres | Runs today's code unchanged; simple; cheap (about $5 to $25 a month at first) | One region; scale means more instances, so shared state is needed first (section 5) |
| B. Cloudflare Workers + D1/KV, static files on Pages | Global, almost free at low volume; Hono is built for it | `@hono/node-server` bits (`serveStatic`, `getConnInfo`) and `node:fs` need swapping; D1 is SQLite, so sync queries are limited |
| C. Big cloud (AWS/GCP) | Everything exists | Most setup and ops for a one-person project |

**Recommend A**, with the static app also served from a CDN in front. Keep storage behind small interfaces (section 5) so a move to B stays possible. The owner picks the provider and creates the account; I add `Dockerfile`, health check (`/api/health` exists) and env docs later (backlog "deploy setup").

## 2. Accounts and sign-in

Principle: **the course works with no account** (progress in `localStorage`, as today); an account adds sync, Plus and a backup. This keeps the free funnel friction-free and a shared link can open lesson 1 directly.

| Option | Notes |
|---|---|
| **A. Hosted auth provider** (Clerk, Supabase Auth, Firebase Auth, Auth0) | Email link/code, Google and Apple sign-in out of the box; free tiers cover early users; vendor lock-in and a data processor to list in the privacy policy |
| B. Self-built (email magic link + Sign in with Apple/Google via OIDC libraries) | No vendor; more security work (sessions, token rotation, abuse) that we would own |

**Recommend A, Supabase Auth** because it pairs with the Postgres in section 3 and is open source (can be self-hosted later). Methods: email magic link, Sign in with Apple, Google. No passwords.

**Sign in with Apple:** Apple's guideline 4.8 says an app that uses a third-party or social login for its primary account must also offer an equivalent login that limits data to name and email, allows a hidden email, and does not track for ads; Sign in with Apple meets it. Apps with only their own account system are exempt ([Apple developer forum](https://developer.apple.com/forums/thread/762647), [forum thread](https://developer.apple.com/forums/thread/765145); secondary sources, check the live guideline). Since we plan Google sign-in, **offer Sign in with Apple on iOS** (needs the owner's Apple Developer account). Apple also requires in-app account deletion for apps that create accounts (guideline 5.1.1(v), *background; verify*).

## 3. Database and progress sync

Data model (Postgres): `users` (id, created_at), `progress` (user_id, app, shard, json, updated_at), `entitlements` (user_id, tier, source, expires_at), `usage` (user_id, day, task_class, count). One row per shard keeps writes small and matches `mergeShard`.

Sync protocol: the client keeps working offline from `localStorage`. On sign-in and after each lesson (debounced), `PUT /api/:app/sync` sends changed shards with their `updated_at`; the server merges with the same `mergeProgress`/`mergeShard` rules the client uses (pure functions in `core.js`; copy them into a shared module the server tests import), then returns the merged state. **Merge, never overwrite**, so two devices cannot lose progress. Payload cap and per-user rate limit apply. Conflict policy is already defined by the merge functions (SRS state: latest review wins per word; counters: max). Export/import JSON stays as the manual backup.

**Recommend:** Supabase Postgres for A, behind a `SyncStore` interface with an in-memory adapter for tests. Build order in section 8.

## 4. AI quotas and abuse limits

- Identity: signed-in user id when present; otherwise the client key (IP) with a stricter anonymous allowance. Anonymous AI use is capped lower so a bot cannot farm free calls by skipping sign-in.
- Counters: `UsageStore.take(userId, class, cost)` returns `{ok, remaining, resetAt}`; classes follow `ai-costs.md` (quick, conversation, exam, generate). A call that fails server-side is refunded.
- Limits come from the entitlements config (one file), which shows free versus Plus numbers; the owner sees them on the sign-off board before anything goes live.
- Global spend ceiling: estimated cost per call is summed per day; past the ceiling, AI answers 503 `unavailable` and the app degrades as it does without a key.
- Log `usage` tokens per call (no user text) to replace the estimates in `ai-costs.md`.
- Shared store: in-memory for one instance now; Redis (Upstash) or Postgres when there are several. Same interface, so no route changes.

## 5. Interfaces to build first (groundwork, behind flags)

`RateStore` / `UsageStore` (memory adapter, key = user or IP), `Entitlements` (config + `tierFor(user)`), `SyncStore`, `PaymentsProvider`. Each with a fake adapter and node:test coverage; `MONETIZATION=off` and `ACCOUNTS=off` are the defaults, so behaviour does not change until the owner flips them.

## 6. Packaging and stores

1. **Installable PWA first** (web manifest, icons from `shared/brand/`, service worker for offline lessons). No review, no fee, ships with the web launch. iOS Safari installs from the share sheet; push and background limits are weaker than native.
2. **Native wrapper second: Capacitor** (same code, a WebView shell, plugins for Sign in with Apple, StoreKit/Play Billing through RevenueCat, notifications). Alternative: a TWA for Google Play only, which is a thin wrapper with no store billing plugins. **Recommend Capacitor** once PWA retention is proven.
3. Apple review risk: a pure web wrapper can be rejected as "minimum functionality" (guideline 4.2, *background; verify*). Mitigate with native sign-in, offline audio, haptics and notifications.

Accounts needed (owner only): Apple Developer Program ($99/year), Google Play Console ($25 once), a domain. I create none of them.

## 7. Payments

Facts as of the searches on 2026-10-25 (verify before deciding):
- **Apple, US:** after the Epic contempt ruling, apps may link out to a web checkout and Apple has charged **no commission** on those purchases so far. The Ninth Circuit let Apple seek a cost-based rate, Apple proposed 5 to 15%, and the Supreme Court agreed on 2026-07-02 to hear the appeal, so the rate is unsettled ([Mac Daily News](https://macdailynews.com/2026/08/14/u-s-supreme-court-clears-path-for-app-store-commission-showdown-as-apple-must-defend-its-rates-in-lower-court/), [TNW](https://thenextweb.com/news/supreme-court-apple-epic-contempt-stay-denial)). Outside the US, in-app purchase is the default on iOS. EU terms changed 2026-10-01 (see `market.md`).
- **Google Play:** since 2026-06-30 in the US, UK and EEA the service fee starts at 10% on the first $1M a year, with a separate 5% only if Play Billing is used; alternative billing and external web links are allowed ([Android Developers Blog](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html), [Adapty](https://adapty.io/blog/google-play-billing-changes-subscriptions-fees)). Sources disagree about other regions' timing.

| Option | For | Against |
|---|---|---|
| **A. RevenueCat on top of StoreKit and Play Billing, plus Stripe on web** | One entitlement per user across web, iOS, Android; handles receipts, renewals, refunds, trials; free until about $2.5k monthly tracked revenue *(verify)* | A vendor and a cut beyond that |
| B. Stripe only, web checkout, no in-app purchase | Lowest fees; simple | iOS outside the US cannot link out freely, so iPhone users outside the US could not subscribe; Google users mostly fine |
| C. Store billing only | What each store expects | 15 to 30% fees; two systems to reconcile |

**Recommend A, in two steps:** web first with Stripe (Stripe Checkout and customer portal, no card on a 7-day trial where allowed), feeding the same `entitlements` table; add RevenueCat when the native apps ship, so Apple and Google purchases write to the same table. The `PaymentsProvider` interface has `startCheckout`, `restore`, `currentEntitlement`, `onWebhook`, with a fake provider for tests and stubs for Stripe, App Store and Play. Nothing charges while `MONETIZATION=off`.

## 8. Privacy and compliance

- **GDPR (we serve EU users):** lawful basis for data processed (contract for the account, consent for analytics/marketing); data minimisation (learning progress, email, no learner text kept from AI calls unless the learner saves it); a privacy policy listing processors (host, auth, database, Anthropic, Stripe, RevenueCat); **export** (JSON export exists, add a server `GET /api/me/export`), **deletion** (`DELETE /api/me` removes user, progress, usage, entitlements; also the in-app deletion Apple requires); data processing agreements with each processor; EU hosting region for the database.
- **AI calls:** learner text goes to Anthropic; say so in the policy and the consent line before the first conversation. Do not send the user's email or name in prompts.
- **Children:** target adults and teens 16+; the store questionnaires and the policy say so. Do not collect data from under-13s (COPPA) or under-16s without consent (GDPR default).
- **Store privacy labels** (Apple "nutrition label", Play Data safety) must match what the code does; the owner fills them from a data list I will write with the launch.
- **Legal pages and entity:** terms, privacy, imprint (Germany needs an Impressum if the owner is based there). Needs the owner's legal details and ideally a lawyer's review; I only draft.

## 9. Build order

1. `RateStore`/`UsageStore` + entitlements config + quota checks on AI tasks (tests, flags off). Token usage logging.
2. Installable PWA (manifest, icons, service worker).
3. Accounts + sync API behind `ACCOUNTS=off` with the in-memory adapter; sync client hook (tell ux for the sign-in button).
4. Payments adapter + fake provider; paywall hook (ux styles it).
5. Deploy config (Dockerfile, env docs, health check). **Owner turns it on.**
6. Capacitor shell, RevenueCat, store listings.

## Questions for the owner

1. **Hosting:** one Node host with managed Postgres (recommended), Cloudflare, or big cloud?
2. **Auth:** Supabase Auth with email link, Apple and Google (recommended), or self-built?
3. **Payments:** Stripe on web first, RevenueCat when the apps ship (recommended), or another route?
4. **Packaging:** PWA first, Capacitor later (recommended), or go straight to the stores?
5. **Legal:** who is the publisher (person or company) and where, for the imprint and store accounts?
6. **Region:** Spanish-speaking launch first, as `market.md` suggests?

## Recommendation

Launch on the web as an installable PWA with optional accounts (Supabase), Postgres sync using the existing merge rules, per-user AI quotas from the entitlements file with a daily spend ceiling, Stripe for the first payments, then Capacitor with RevenueCat for the stores. Build the interfaces and fakes now behind flags, deploy and charge only when the owner says.
