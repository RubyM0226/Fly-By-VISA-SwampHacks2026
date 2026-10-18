// Runs the journey engine for a few arrival dates and prints each plan's fit
// and the reason the badge shows. Checks the 30-day booking buffer.
// Run: npx tsx scripts/check-fit.ts
import assert from "node:assert/strict";
import { fitReason } from "../lib/fitReason";
import { DICTIONARY, format, type UiKey, type Vars } from "../lib/i18n";
import { addDays, ASSUMPTIONS, buildJourney, diffDays, WAIT_TIMES_BY_COUNTRY } from "../lib/journey";

const t = (key: UiKey, vars?: Vars) => format(DICTIONARY.en[key], vars);
const today = "2026-10-18";

assert.equal(ASSUMPTIONS.daysUntilBooking, 30);

for (const arrival of ["2027-01-20", "2027-06-01", "2027-07-01", "2027-08-15", "2028-01-12"]) {
  const j = buildJourney({ today, arrival, stayMonths: 1, waits: WAIT_TIMES_BY_COUNTRY.IN });
  const b = j.best;
  // Booking happens 30 days from today, and the wait counts from there.
  assert.equal(j.bookDate, addDays(today, 30));
  assert.equal(diffDays(j.bookDate, b.interviewDate), Math.round(b.waitMonths * ASSUMPTIONS.daysPerMonth));
  assert.equal(b.fit, b.slackDays < 0 ? "atRisk" : b.slackDays < ASSUMPTIONS.tightSlackDays ? "tight" : "onTrack");
  const reason = fitReason(t, "en", b);
  assert.ok(!/\{\w+\}/.test(reason), `unfilled placeholder: ${reason}`);
  console.log(`arrive ${arrival}: ${b.id} interview ${b.interviewDate}, slack ${b.slackDays} -> ${b.fit}\n  ${reason}`);
}

// The exact-day edge and the one-day wording.
const base = buildJourney({ today, arrival: "2027-06-01", stayMonths: 1, waits: WAIT_TIMES_BY_COUNTRY.IN }).best;
assert.match(fitReason(t, "en", { ...base, slackDays: 0, fit: "tight" }), /on the latest safe date/);
assert.match(fitReason(t, "en", { ...base, slackDays: -1, fit: "atRisk" }), /about 1 day after/);
console.log("fit checks passed");
