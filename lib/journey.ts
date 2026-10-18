// The journey engine: pure functions, no React, no imports.
// Facts live in code and data (here and in content/steps.ts). AI should only
// ever explain these results, never invent them.

export type PostId = "delhi" | "mumbai" | "chennai" | "hyderabad" | "kolkata";
export type Fit = "onTrack" | "tight" | "atRisk";
export type VisaCategory = "family" | "study" | "work";

export type StepId =
  | "ready"
  | "ds160"
  | "book"
  | "documents"
  | "practice"
  | "travel"
  | "arrive"
  | "return";

export const STEP_ORDER: StepId[] = [
  "ready",
  "ds160",
  "book",
  "documents",
  "practice",
  "travel",
  "arrive",
  "return",
];

// ---------------------------------------------------------------------------
// SEED DATA: interview wait times by visa category, in months.
// ---------------------------------------------------------------------------
export const WAIT_TIMES_AS_OF = "2026-09-17";

export interface PostSeed {
  id: PostId;
  waitMonths: Record<VisaCategory, number>;
  needsCheck: boolean;
}

export const WAIT_TIMES: PostSeed[] = [
  { id: "delhi", waitMonths: { family: 10, study: 2, work: 3 }, needsCheck: false },
  { id: "mumbai", waitMonths: { family: 11.5, study: 2.5, work: 3.5 }, needsCheck: false },
  { id: "hyderabad", waitMonths: { family: 12, study: 2, work: 3 }, needsCheck: false },
  { id: "chennai", waitMonths: { family: 7.5, study: 1.5, work: 2 }, needsCheck: false },
  { id: "kolkata", waitMonths: { family: 6.5, study: 1.5, work: 2 }, needsCheck: false },
];

// ---------------------------------------------------------------------------
// PLANNING ASSUMPTIONS. These are our own rules of thumb, not official times.
// ---------------------------------------------------------------------------
export const ASSUMPTIONS = {
  daysUntilBooking: 10,
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

export function formatDate(iso: string, lang: "en" | "hi"): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
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

  const steps: StepPlan[] = [
    { id: "ready", start: today, end: addDays(today, 4), showsInterview: false },
    { id: "ds160", start: addDays(today, 4), end: addDays(today, 9), showsInterview: false },
    { id: "book", start: addDays(today, 9), end: bookDate, showsInterview: true },
    { id: "documents", start: docsStart, end: docsEnd, showsInterview: false },
    { id: "practice", start: practiceStart, end: practiceEnd, showsInterview: true },
    { id: "travel", start: travelStart, end: travelEnd, showsInterview: false },
    { id: "arrive", start: arrival, end: arrival, showsInterview: false },
    { id: "return", start: returnBy, end: returnBy, showsInterview: false },
  ];

  return { today, arrival, bookDate, visaType, posts, best, steps, returnBy };
}