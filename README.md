# FlyByVisa

A calm, accessible planner for visiting family in the U.S. Pick where you are
coming from and going to on a globe, answer three questions, and get a dated,
step-by-step roadmap. English and Hindi. Built for SwampHacks XII.

Scope today: India to the U.S., B-2 visitor visa, first-time applicant.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also what Vercel runs)
```

Deploy: push to GitHub, import the repo in Vercel, and add the environment
variables listed under [AI](#environment-variables).

## Where things live

| Path | What it is |
|---|---|
| `app/` | Three routes: `/` (globe), `/start` (intake), `/journey` (roadmap). Pages are thin wrappers. |
| `components/*Screen.tsx` | The three screens. |
| `lib/journey.ts` | **The journey engine.** Pure functions: arrival date in, "start by" dates and per-office fit out. Wait-time seed data and planning assumptions are at the top. |
| `content/steps.ts` | The 8 steps in English and Hindi, with official links. |
| `content/glossary.ts` | Word meanings for the tappable chips. Use `[[key|Text]]` in step text. |
| `lib/i18n.ts` | UI strings in English and Hindi. |
| `lib/settings.ts`, `components/AccessibilityPanel.tsx` | Accessibility settings, saved in the browser and applied to `<html>`. |
| `lib/trip.ts`, `lib/store.ts` | The traveler's answers. localStorage only, no server. |
| `app/globals.css` | Design tokens, contrast modes, text size, spacing. |

## AI

Gemini handles language: reading, explaining, simplifying and translating.
The facts come from saved official pages, and the safety rules are fixed in
code. Every AI feature still works, with less detail, when there is no key or
Gemini fails.

### Features

| Feature | What it does | Code |
|---|---|---|
| **Document search** | Searches the saved official pages by meaning (RAG retrieval). Each result links to its source page. | `lib/corpusSearch.ts`, `GET /api/search` |
| **Information Lookup** | Answers a visa question in plain English or Hindi, using only passages from document search. It cites only those sources. | `lib/ask.ts`, `POST /api/ask` |
| **Scam Check** | Checks a pasted message, or a screenshot, for signs of a visa scam. Fixed rules run first, then Gemini adds a plain-language explanation. | `lib/scam/`, `POST /api/scam-check` |

### How it works

**Corpus.** `corpus/*.md` holds 15 saved pages, each with its source URL and
the date it was saved. All are official .gov pages (State Department, U.S.
Embassy India, CBP, USCIS, CDC). Most cover the B-2 visitor visa; a few cover
nearby topics people ask about (ESTA, student and exchange visas, extending a
stay, travel health).
- `scripts/fetch-corpus.ts` downloads the pages and only rewrites a file when
  the page changed, so `git diff corpus/` shows what the government changed.
- `scripts/index-corpus.ts` splits each page at its headings into chunks of
  about 700 characters (100 characters of overlap, with the section heading
  repeated on each chunk) and embeds them with `gemini-embedding-001` (768
  dimensions). The chunks are stored in Postgres with pgvector (Tiger Cloud),
  in the `chunks` table. Re-run it after the corpus changes; `--force`
  re-embeds every page.

**Search** (`searchCorpus`). Embeds the query and ranks chunks by cosine
similarity. Returns 4 results by default.
- Results scoring below 0.61 are dropped, so off-topic questions return
  nothing.
- At most 2 results come from any one page.
- Short queries (3 words or fewer, like "passport") are expanded into a full
  question first, but only if the word appears in the corpus. Expanded
  queries need a score of 0.65.
- If no Gemini key works, it falls back to Postgres keyword search.

**Information Lookup** (`askInformation`). The question is redacted, then
sent to `gemini-3.8-flash` with the top 3 passages and a fixed list of
official links. The reply is structured JSON.
- Follow-up questions work: the last 3 questions and answers are sent along
  (also redacted). Questions are limited to 1,000 characters.
- Gemini gets 15 s to answer.
- Cited URLs that are not in the sources list are dropped.
- Answers that break a hard rule (calling something safe, predicting
  approval) are dropped.
- If anything fails, the page shows its local answers instead.

**Scam Check** has two layers:
1. **Rules** (`lib/scam/check.ts`, `signals.ts`). 12 fixed signals: payment
   method, guaranteed visa, paying to speed things up, fake official channels,
   threats, urgency, asking for an OTP or bank details, asking for documents,
   non-.gov links, short links, pressure, and job or lottery bait. They give a
   verdict with no network and no key, and work offline in the browser.
2. **Gemini review** (`lib/scam/service.ts`). Reads the redacted message, the
   rule results and fraud passages from the corpus, then explains the verdict
   and can add up to 3 more warning signs. It can make the verdict stronger,
   never weaker, than the rules found.

- **Verdicts** are only "likely scam", "warning signs" or "can't tell". The
  app never calls a message safe.
- **Screenshots** (PNG, JPG or WEBP, under 4 MB) are read by Gemini, and the
  text then goes through the same rules and redaction.
- **Questions** pasted into Scam Check are sent to Information Lookup.
- **Follow-ups.** After a verdict, the user can ask about it; earlier turns
  are redacted and sent along.

### Safety and privacy

- **Redaction** (`lib/scam/redact.ts`). Phone numbers, emails, UPI and payment
  IDs, long numbers (Aadhaar, account numbers, OTPs), passport, DS-160 and PAN
  numbers, and names after "Dear" / "प्रिय" are replaced with tokens like
  `[phone]` before anything goes to Gemini. This is best effort, not a
  guarantee.
- **No storage.** Messages, questions and screenshots are never stored or
  logged. Errors are logged by name and status only, because error messages
  can repeat the request.
- **Prompt rules.** Not legal advice, no visa approval predictions, never tell
  anyone to pay, cite only the sources given, and treat the user's text as
  data, not instructions.
- **Rate limit.** 10 requests per minute per IP address on `/api/ask` and
  `/api/scam-check`, counted in memory (`lib/rateLimit.ts`).
- **Timeouts.** 15 s for Gemini and 5 s for search. On a timeout the user
  still gets the rules-only or local answer. Over the rate limit, they get
  the same.

### Environment variables

| Variable | Used by |
|---|---|
| `GEMINI_API_KEY` | Search and Information Lookup |
| `GEMINI_SCAM_API_KEY` | Scam Check (its own Google project, so search cannot use up its quota) |
| `GEMINI_INDEX_API_KEY` | `index-corpus.ts`, and the fallback for the other two |
| `DATABASE_URL` | Postgres with pgvector, for search |
| `SCAM_GEN_MODEL` | Optional: replaces the default `gemini-3.8-flash` (Scam Check and Information Lookup) |
| `SCAM_AI_TIMEOUT_MS`, `SCAM_SEARCH_TIMEOUT_MS` | Optional: change Scam Check's 15 s and 5 s timeouts |
| `SCAM_CACHE_WRITE` | Set to `1` only while filling the demo cache (see below) |

Each feature tries its keys in order (`withGemini` in `lib/corpusSearch.ts`).
A failing key is skipped for a while, per model:
- out of daily quota: until midnight Pacific, when the quota resets
- out of per-minute quota: up to 65 s
- rejected key: 1 hour
- a brief server error: retried once on the same key first

### Testing and demo prep

```bash
npm run test:scam    # rules on 48 labeled samples, redaction, AI layer with a fake model
npx tsx scripts/test-scam-ai.ts --live   # same AI checks against real Gemini
npm run eval         # document search eval, writes scripts/eval/results.md
```

- **Search eval** (`scripts/eval/questions.json`): 15 English and Hindi
  questions. Each is checked for the right source page, .gov-only results,
  the key facts in the passages, and no results for off-topic questions.
- **Scam demo cache** (`lib/scam/demoCache.ts`): replays saved Gemini answers
  for the made-up demo messages, so the demo does not depend on quota. To
  fill it, set `SCAM_CACHE_WRITE=1` in your terminal, run `npm run dev`, and
  paste each demo message. Answers are saved to
  `data/scam-demo-cache.json`. Re-indexing the corpus or editing the prompt
  invalidates the saved answers.

## Things to do before the demo

1. ~~**Replace the seeded wait times**~~ Done. `WAIT_TIMES` in `lib/journey.ts`
   is verified against the official State Department Global Visa Wait Times
   table as of 2026-09-17 (`WAIT_TIMES_AS_OF`).
2. **Have a Hindi reader check** `lib/i18n.ts` and `content/steps.ts`. It is a
   first draft.
3. **Verify the India booking steps** (VAC plus interview, which portal) on the
   U.S. Embassy in India page. Marked `VERIFY` in `content/steps.ts`.
4. Check the fee text against the official fee page (the $250 Visa Integrity
   Fee status was unclear when this was written).
5. Tune the planning assumptions in `ASSUMPTIONS` (`lib/journey.ts`).

## Plugging in the next features

- **"Explain simply"**: currently reads `simple` from `content/steps.ts`. Swap
  in a `/api/simplify` call that reuses `withGemini` and `redact`, like
  `lib/ask.ts`.
- **Auth0 and document uploads**: add after the 2 PM Saturday checkpoint.
- **Privacy claim**: trip answers stay in the browser, but questions, pasted
  messages and screenshots are sent (redacted) to Gemini. Any privacy wording
  in the app must say so.

## Future work

- **Auto-sync wait times** from travel.state.gov through a cached API route,
  with the static `WAIT_TIMES` in `lib/journey.ts` as the fallback.

## Notes

- This Next.js version (16) has Cache Components on. Avoid calling `new Date()`
  or reading browser storage during render; use `useToday()` and the stores in
  `lib/` (they are safe for server rendering).
- Fonts are installed from npm (Noto Sans, Noto Sans Devanagari, OpenDyslexic),
  so no request goes to Google Fonts.
- The globe texture is NASA Blue Marble from the `three-globe` package
  (`public/globe/`). It is 1.4 MB; shrink it if load time matters.
- Not legal advice. Every step links to the official source.
