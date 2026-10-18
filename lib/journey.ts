import { INTL_LOCALE } from "./locale";
import type { Lang } from "./settings";
// The journey engine: pure functions, no React, no imports.
// Facts live in code and data (here and in content/steps.ts). AI should only
// ever explain these results, never invent them.

export type PostId =
  | "delhi" | "mumbai" | "chennai" | "hyderabad" | "kolkata"
  | "london"
  | "mexico-city" | "guadalajara" | "monterrey" | "tijuana" | "ciudad-juarez"
  | "hermosillo" | "merida" | "nogales" | "nuevo-laredo" | "matamoros";
export type Fit = "onTrack" | "tight" | "atRisk";
export type VisaCategory = "family" | "study" | "work";

export type StepId =
  | "ready"
  | "i20"
  | "sevis"
  | "petition"
  | "ds160"
  | "book"
  | "documents"
  | "practice"
  | "travel"
  | "arrive"
  | "return";

export const STEPS_BY_PURPOSE: Record<VisaCategory, StepId[]> = {
  family: ["ready", "ds160", "book", "documents", "practice", "travel", "arrive", "return"],
  study: ["ready", "i20", "sevis", "ds160", "book", "documents", "practice", "travel", "arrive", "return"],
  work: ["ready", "petition", "ds160", "book", "documents", "practice", "travel", "arrive", "return"],
};

// ---------------------------------------------------------------------------
// SEED DATA: interview wait times by visa category, in months.
// India's family (B1/B2) values are the "Next Available Appointment" figures
// from the State Department's Global Visa Wait Times table:
// https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/global-visa-wait-times.html
// The State Department updates it roughly monthly. To refresh, update the
// numbers below and WAIT_TIMES_AS_OF from that page.
// needsCheck = this number came from a different or unconfirmed source.
// ---------------------------------------------------------------------------
export const WAIT_TIMES_AS_OF = "2026-09-17";

export interface PostSeed {
  id: PostId;
  waitMonths: Record<VisaCategory, number>;
  needsCheck: boolean;
}

/** Posts for each home country. A traveler only ever sees their own country's posts. */
export const WAIT_TIMES_BY_COUNTRY: Record<"IN" | "GB" | "MX", PostSeed[]> = {
  IN: [
    { id: "delhi", waitMonths: { family: 10, study: 2, work: 3 }, needsCheck: false },
    { id: "mumbai", waitMonths: { family: 11.5, study: 2.5, work: 3.5 }, needsCheck: false },
    { id: "hyderabad", waitMonths: { family: 12, study: 2, work: 3 }, needsCheck: false },
    { id: "chennai", waitMonths: { family: 7.5, study: 1.5, work: 2 }, needsCheck: false },
    { id: "kolkata", waitMonths: { family: 6.5, study: 1.5, work: 2 }, needsCheck: false },
  ],
  // VERIFY: PLACEHOLDER numbers, not real waits, the same for every category.
  // Replace each with the figure from the State Department's visa appointment
  // wait-time page:
  // https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/global-visa-wait-times.html
  GB: [{ id: "london", waitMonths: { family: 2, study: 2, work: 2 }, needsCheck: true }],
  MX: [
    { id: "mexico-city", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "guadalajara", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "monterrey", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "tijuana", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "ciudad-juarez", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "hermosillo", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "merida", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "nogales", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "nuevo-laredo", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
    { id: "matamoros", waitMonths: { family: 6, study: 6, work: 6 }, needsCheck: true },
  ],
};

/** India's posts; the default when no country is given. */
export const WAIT_TIMES: PostSeed[] = WAIT_TIMES_BY_COUNTRY.IN;

// ---------------------------------------------------------------------------
// PLANNING ASSUMPTIONS. These are our own rules of thumb, not official times.
// ---------------------------------------------------------------------------
export const ASSUMPTIONS = {
  // A month to fill in the form, pay the fee and book, with room for difficulties.
  daysUntilBooking: 30,
  daysAfterInterviewForVisa: 14,
  daysBeforeArrivalBuffer: 7,
  tightSlackDays: 30,
  daysPerMonth: 30.44,
} as const;

// ---------------------------------------------------------------------------
// Date helpers. All dates are yyyy-mm-dd strings handled in UTC.
// ---------------------------------------------------------------------------
const DAY_MS = 86_400_000;

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  return toISO(new Date(parse(iso).getTime() + n * DAY_MS));
}

export function addMonths(iso: string, n: number): string {
  const d = parse(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toISO(d);
}

export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((parse(toIso).getTime() - parse(fromIso).getTime()) / DAY_MS);
}

const maxIso = (a: string, b: string) => (a >= b ? a : b);

export function formatDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parse(iso));
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------
export interface PostResult {
  id: PostId;
  waitMonths: number;
  needsCheck: boolean;
  interviewDate: string;
  latestInterviewDate: string;
  slackDays: number;
  fit: Fit;
}

export interface StepPlan {
  id: StepId;
  start: string;
  end: string;
  showsInterview: boolean;
}

export interface Journey {
  today: string;
  arrival: string;
  bookDate: string;
  visaType: VisaCategory;
  posts: PostResult[];
  best: PostResult;
  steps: StepPlan[];
  returnBy: string;
}

export interface JourneyInput {
  today: string;
  arrival: string;
  stayMonths: number;
  visaType?: VisaCategory;
  waits?: PostSeed[];
}

function fitFor(slack: number): Fit {
  if (slack < 0) return "atRisk";
  if (slack < ASSUMPTIONS.tightSlackDays) return "tight";
  return "onTrack";
}

export function buildJourney({
  today,
  arrival,
  stayMonths,
  visaType = "family",
  waits = WAIT_TIMES,
}: JourneyInput): Journey {
  const A = ASSUMPTIONS;
  const bookDate = addDays(today, A.daysUntilBooking);
  const afterInterview = A.daysAfterInterviewForVisa + A.daysBeforeArrivalBuffer;
  const latestInterviewDate = addDays(arrival, -afterInterview);

  const posts: PostResult[] = waits
    .map((w) => {
      const waitMonths = w.waitMonths[visaType] ?? w.waitMonths.family;
      const interviewDate = addDays(bookDate, Math.round(waitMonths * A.daysPerMonth));
      const slackDays = diffDays(interviewDate, latestInterviewDate);
      return {
        id: w.id,
        waitMonths,
        needsCheck: w.needsCheck,
        interviewDate,
        latestInterviewDate,
        slackDays,
        fit: fitFor(slackDays),
      };
    })
    .sort((a, b) => (a.interviewDate < b.interviewDate ? -1 : a.interviewDate > b.interviewDate ? 1 : 0));

  const best = posts[0];
  const interview = best.interviewDate;

  const docsStart = maxIso(bookDate, addDays(interview, -28));
  const docsEnd = maxIso(docsStart, addDays(interview, -7));
  const practiceStart = maxIso(bookDate, addDays(interview, -14));
  const practiceEnd = maxIso(practiceStart, addDays(interview, -1));
  const travelStart = addDays(interview, A.daysAfterInterviewForVisa);
  const travelEnd = maxIso(travelStart, addDays(arrival, -A.daysBeforeArrivalBuffer));
  const returnBy = addMonths(arrival, Math.max(1, Math.round(stayMonths)));

  const allPossibleSteps: Record<StepId, StepPlan> = {
    ready: { id: "ready", start: today, end: addDays(today, 4), showsInterview: false },
    i20: { id: "i20", start: today, end: addDays(today, 4), showsInterview: false },
    sevis: { id: "sevis", start: addDays(today, 4), end: addDays(today, 9), showsInterview: false },
    petition: { id: "petition", start: today, end: addDays(today, 9), showsInterview: false },
    ds160: { id: "ds160", start: addDays(today, 4), end: addDays(today, 9), showsInterview: false },
    book: { id: "book", start: addDays(today, 9), end: bookDate, showsInterview: true },
    documents: { id: "documents", start: docsStart, end: docsEnd, showsInterview: false },
    practice: { id: "practice", start: practiceStart, end: practiceEnd, showsInterview: true },
    travel: { id: "travel", start: travelStart, end: travelEnd, showsInterview: false },
    arrive: { id: "arrive", start: arrival, end: arrival, showsInterview: false },
    return: { id: "return", start: returnBy, end: returnBy, showsInterview: false },
  };

  const steps: StepPlan[] = STEPS_BY_PURPOSE[visaType].map((id) => allPossibleSteps[id]);

  return { today, arrival, bookDate, visaType, posts, best, steps, returnBy };
}