# FlyByVisa

**A calm, accessible planner for travelers applying for a U.S. visitor (B-2) visa.**
Pick where you are flying from, answer a few questions, and get a dated,
step-by-step roadmap, plain-language answers from official sources, and a
scam checker for the messages that fly around while people apply.

Live: **https://www.flybyvisa.casa** · Built for **SwampHacks XII** (Oct 16–18, 2026)

Who it is for: a grandparent in India (or the UK or Mexico) visiting family in
the U.S. for the first time, and the son or daughter helping them from far away.
Visa websites are long, dense and written for experts. Scammers fill the gap:
fake agents, "fast-track" payments, and WhatsApp messages posing as the embassy.
FlyByVisa is built so a first-time, non-technical, older applicant can follow it
without help, and without being cheated.

Not legal advice. Every step links to the official U.S. government source.

---

## What it does

| Feature | What you get |
|---|---|
| **Globe intake** (`/`, `/start`) | Choose where you are flying from and to on a 3D globe, then answer three questions. |
| **Dated roadmap** (`/journey`) | A step-by-step plan worked back from your arrival date: when to start, which office, and whether your timeline is *on track*, *tight* or *at risk*. A "How did we work this out?" panel shows the arithmetic in plain words. |
| **Information Lookup** (`/information-lookup`) | Ask a visa question in your own words and get a short answer in simple language, with links to the official page it came from. |
| **Scam Check** (`/scam-check`) | Paste a suspicious message. You get one of three answers: *can't tell*, *warning signs* or *likely scam*, with the reasons in plain words. It never says "safe". |
| **Documents** (`/documents`) | What to bring and where to get it, plus **My files**: a private place to keep your own scans (PDF, images). |
| **Helper link** | A signed-in traveler can share a revocable link so a family member can follow their progress. |
| **Flights, office map, glossary, templates** | Flight options between your home airport and a U.S. airport, a map of U.S. visa offices, tappable word meanings, and downloadable Word templates for invitation letters and similar papers. |
| **Languages** | English, Hindi and Spanish, switchable on every page. (Hindi and Spanish are drafts that a native reader should review.) |

Home countries today: India, the United Kingdom and Mexico. Scope today:
B-2 visitor visa, first-time applicant, with starter steps for student and
work visas.

---

## How it fits the prize tracks

### Best Use of AI/ML

The AI does the language work. Facts stay in code, data and official pages.

- **Retrieval, not guessing.** Information Lookup embeds the question, finds the
  closest passages in a corpus of 15 official U.S. government pages, and tells
  the model to answer **only** from those excerpts and to cite only URLs it was
  given. If the excerpts do not answer the question, it says so and points to the
  official page.
- **Rules first, model second.** Scam Check runs a fixed rule engine (12 signals
  such as pay-to-speed-up, asks-for-OTP, non-.gov links, threats) that sets a
  *floor* the model cannot lower. Gemini then reviews the redacted text and can
  only raise concern or add reasons. If the AI is down, the user still gets the
  rules-only answer.
- **Guardrails on purpose.** No "safe" verdict, no approval predictions, no
  payment instructions. The user's text is treated as data, not instructions.
- **Measured, not vibes.** `npm run eval` runs a question set against the search
  and records whether the right official source came back, whether only `.gov`
  pages were cited, whether the answer mentioned the key fact (for example
  "$185"), and whether off-topic questions correctly return nothing. The latest
  run is in [`scripts/eval/results.md`](scripts/eval/results.md).
- **Plain language by design.** Answers are written for a 12-year-old reader,
  at most five sentences, and in the user's chosen language.

### Best Use of Gemini API

Gemini is used three ways, each with its own quota and key so one cannot starve
another:

| Use | Model | Where |
|---|---|---|
| **Embeddings** for semantic search (768 dimensions) | `gemini-embedding-001` | `scripts/index-corpus.ts` (index), `lib/corpusSearch.ts` (query) |
| **Grounded answers** in simple language | Gemini Flash, with structured JSON output (`answer` plus `sourceUrls`) | `lib/ask.ts` |
| **Scam review** that adds reasons on top of the rule floor | Gemini Flash, structured JSON output | `lib/scam/service.ts` |

Details worth knowing: a separate key for indexing, for scam checks and for site
search, with automatic fallback and a cooldown when one hits its quota; a
query-expansion step for very short searches such as "passport"; and a keyword
search fallback if no key is available. The generation model can be changed with
`SCAM_GEN_MODEL`.

### Best Use of Tiger Data

Tiger Data (managed Postgres) is the one database behind the whole app.

- **Vector search with `pgvector`.** The `chunks` table holds the official
  pages split into section-aware pieces, each with its embedding. Search is one
  SQL query: cosine distance (`<=>`), a similarity cutoff, and at most two hits
  per page so a single long page cannot crowd out the rest.
- **Hybrid search in the same query.** Postgres full-text search
  (`to_tsvector` / `tsquery`) checks that a short query's words really appear in
  the corpus before it is expanded, and powers the keyword fallback.
- **Traveler data.** `journeys` stores each person's trip, progress and travel
  profile. A person can start before signing in; when they sign in, their
  anonymous progress is claimed to their account. `journey_helpers` stores the
  revocable family helper links.
- **Re-indexing is cheap.** Each page has a content hash, so only changed pages
  are re-embedded.

### Easy On the Eyes (Best UI/UX Design)

The users are older, often new to the web, and sometimes reading in a second
language. The design rule: **calm, large, one thing at a time, and the user is
always in control.**

- **Accessibility panel on every page**, saved in the browser: six text sizes,
  high contrast, black-and-white mode, a dyslexia-friendly font (OpenDyslexic),
  wider letter and line spacing, bold text, underlined and highlighted links,
  paused motion, and optional word definitions.
- **Read aloud** on content, using the browser's built-in speech in the chosen
  language.
- **Three languages** with the full interface and content translated, not just
  the buttons.
- **Plain words everywhere.** Hard visa words become tappable chips that explain
  them in one sentence. Every step has a "say it simply" version.
- **Built for touch and keyboards.** Large tap targets (the file panel is tested
  at 44 px minimum with no sideways scrolling at the largest text size), a skip
  link, and a logical focus order.
- **No dark patterns.** Delete-confirm dialogs default to "No, keep it" and close
  with Escape; the privacy wording says plainly what is and is not stored.
- **Honest uncertainty.** The app says "we can't tell" instead of guessing, and
  flags every estimated time as an estimate.

### MLH: Best Use of Auth0

Auth0 (`@auth0/nextjs-auth0` v4) protects the personal parts of the app and
nothing else. Visa information and Scam Check work without an account.

- **Login and signup** through Auth0, wired in `proxy.ts` and `app/auth/`.
- **Start anonymous, claim on login.** Progress made before sign-in is attached
  to the account afterwards, so nobody loses work by logging in late.
- **Private files per user.** "My files" uploads go to a private Vercel Blob
  store, in a folder tied to the Auth0 user id. Files are never public URLs; they
  are streamed through our own authenticated route.
- **Caregiver access without sharing a password.** A signed-in traveler can
  create a revocable helper link. The server resolves it to the owner and treats
  a revoked or unknown link the same way ("not found") so links cannot be probed.
- **Sensitive actions stay server-side.** Looking up who owns a helper link lives
  in a server-only module, not in a server-action file the browser could call.

### MLH: Best Domain Name from GoDaddy Registry

**[flybyvisa.casa](https://www.flybyvisa.casa)**: *casa* is "home" in Spanish and
Portuguese, which is exactly what the traveler is trying to get back to after the
visit, and where their family is waiting. It also reads as a name you can say out
loud on the phone to a relative: "fly by visa dot casa". Registered through
GoDaddy Registry and deployed on Vercel.

### MLH: DEV Writing Challenge

Our write-up is on DEV: https://devpost.com/software/flybyvisa

---

## Safety and privacy

- **Redaction before AI.** Messages and questions pass through a redactor that
  replaces emails, phone numbers, ID numbers, names and payment IDs with tokens
  such as `[phone]` before anything is sent to Gemini.
- **Not stored, not logged.** Scam Check messages and Information Lookup
  questions are held in memory only. Errors are logged by name, never with the
  request, because some error messages echo it.
- **Signed-out use stays in the browser.** Settings and trip answers are stored
  in `localStorage`. Only signed-in travelers have progress saved to the database.
- **Official sources only.** Answers cite `.gov` pages. The app never gives
  payment instructions and never predicts an approval.
- **Rate limits** on the AI endpoints.

---

## Architecture

```
Browser (Next.js 16 App Router, React 19, Tailwind v4)
  ├─ Globe intake  → trip answers (localStorage, or journeys table when signed in)
  ├─ Journey engine (lib/journey.ts): pure functions, dated plan and fit check
  ├─ Information Lookup → /api/ask
  │     redact → embed (Gemini) → pgvector search (Tiger Data) → grounded answer (Gemini)
  ├─ Scam Check → /api/scam-check
  │     rules (floor) → redact → official-page search → Gemini review → verdict
  ├─ My files → /api/uploads (Auth0 session) → private Vercel Blob
  └─ Auth0 login → proxy.ts → journeys, journey_helpers (Tiger Data)
```

| Path | What it is |
|---|---|
| `app/` | Routes, plus `api/` handlers (`ask`, `scam-check`, `search`, `flights`, `uploads`, `templates`, `helper`). |
| `components/` | Screens and shared UI (accessibility bar, globe, glossary, roadmap path, My files panel). |
| `lib/journey.ts` | The journey engine: wait-time data and planning assumptions, with dates and sources. |
| `lib/corpusSearch.ts`, `lib/ask.ts` | Retrieval and grounded answers. |
| `lib/scam/` | Scam Check: signals, rules engine, redactor, Gemini review. |
| `lib/db.ts`, `app/actions/` | Tiger Data connection and server actions for journeys and helper links. |
| `content/` | Steps, documents, glossary, templates and FAQs, with every string in each language. |
| `lib/i18n.ts`, `lib/i18n.es.ts`, `lib/locale.ts` | Interface strings and per-language settings. |
| `corpus/` | The official pages used for search, saved as Markdown with their source URL and date. |
| `scripts/` | Corpus fetch and index, evals, and tests. |

---

## Run it

```bash
npm install
# create .env.local and fill in the values below
npm run dev                  # http://localhost:3000
npm run build                # production build (what Vercel runs)
```

Everything optional degrades gracefully: with no Gemini key the app falls back
to local answers and rules-only scam checks; with no database, search falls back
to the built-in answers; with no Auth0 setup the user is treated as signed out.

### Environment variables

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Tiger Data Postgres connection string. |
| `GEMINI_API_KEY` | Site search and Information Lookup. |
| `GEMINI_INDEX_API_KEY` | Indexing the corpus (separate quota), and a fallback key. |
| `GEMINI_SCAM_API_KEY` | Scam Check (separate quota). |
| `SCAM_GEN_MODEL` | Optional: override the Gemini model name. |
| `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET` | Auth0 login. |
| `APP_BASE_URL` | Must match the site's address, or the login callback fails (see below). |
| `BLOB_STORE_ID` | Private file storage (set automatically when a Vercel Blob store is connected). |
| `SERPAPI_KEY` | Live flight search. Without it the app uses `data/flights-demo.json`. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | The office map. |

### Index the official pages

```bash
npx tsx scripts/fetch-corpus.ts    # save official pages into corpus/
npx tsx scripts/index-corpus.ts    # chunk, embed with Gemini, store in Tiger Data
```

### Tests and evals

```bash
npm run eval             # search quality: right source, .gov only, key fact, off-topic
npm run test:scam        # scam rules, redaction and AI behavior
npm run test:templates   # Word template generation
npm run lint
```

### Deploy

Push to GitHub and import the repo in Vercel. Every branch gets a preview
URL; `main` deploys to production. Environment variables are scoped to Preview
and Production separately and only reach **new** deployments, so redeploy after
changing one. For Auth0, `APP_BASE_URL` and the allowed callback and logout URLs
must match the domain you are testing on; on a preview URL the login can fail
with "state parameter is invalid" until they do.

---

## Known limits and honest notes

- **Wait times are a snapshot.** `WAIT_TIMES` in `lib/journey.ts` is checked
  against the official State Department table as of the date stored next to it
  (`WAIT_TIMES_AS_OF`). Auto-sync is future work.
- **Hindi and Spanish are first drafts** and need review by native readers.
- **Some booking steps are marked `VERIFY`** (for example, the India VAC plus
  interview flow) until they are confirmed on the embassy page.
- **Scam detection is rule-based plus AI**, tuned mainly for English and Hindi
  messages. Spanish scam phrases are not covered yet.
- **Transit and travel-advisory data** in `lib/flightData.ts` is seeded and
  marked `needsCheck`.
- Scope is B-2 first-time applicants. Other visa types are early.

## Developer notes

- This Next.js version (16) has Cache Components on. Avoid `new Date()` or reading
  browser storage during render; use `useToday()` and the stores in `lib/`.
- Fonts are installed from npm (Noto Sans, Noto Sans Devanagari, OpenDyslexic).
- Add a language by extending `Lang` in `lib/settings.ts`; TypeScript will flag
  every content object that still needs the new language.
- The globe texture is NASA Blue Marble from the `three-globe` package.

## Team

Built at SwampHacks XII, University of Florida. Built by: Ruby McCandless, Amrita Ketireddy, Holly Overholser, and Emlynn Rossiya.