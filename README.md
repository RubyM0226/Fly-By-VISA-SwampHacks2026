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

Deploy: push to GitHub, import the repo in Vercel. No environment variables yet.

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

- **AI guide**: add `app/api/ask/route.ts`. Keep facts in code and data; use
  Gemini for language (explain, simplify, translate) and for RAG over saved
  official pages with source links.
- **"Explain simply"**: currently reads `simple` from `content/steps.ts`. Swap
  in a `/api/simplify` call.
- **Auth0 and document uploads**: add after the 2 PM Saturday checkpoint.
- **Privacy claim**: the app currently sends nothing anywhere, so "your answers
  stay in this browser" is true. Re-word it as soon as any answer is sent to an
  API, and redact personal details before they reach Gemini.

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
