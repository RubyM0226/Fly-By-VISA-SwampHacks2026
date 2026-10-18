// Runs the journey engine for each home country and prints the best office and
// fit, then checks the home-country content. Run: npx tsx scripts/check-countries.ts
import assert from "node:assert/strict";
import { DOC_FAQ } from "../content/documentsFaq";
import { DOCUMENTS } from "../content/documents";
import { STEPS } from "../content/steps";
import { HOME, localize } from "../lib/homeCountry";
import { buildJourney, WAIT_TIMES_BY_COUNTRY } from "../lib/journey";
import { OFFICE_MAPS } from "../lib/offices";

const input = { today: "2026-10-18", arrival: "2027-09-01", stayMonths: 2 };
for (const from of ["IN", "GB", "MX"] as const) {
  const j = buildJourney({ ...input, waits: WAIT_TIMES_BY_COUNTRY[from] });
  console.log(`${from}: best=${j.best.id} fit=${j.best.fit} interview=${j.best.interviewDate} slack=${j.best.slackDays}`);
  if (from === "IN") console.log(JSON.stringify(j));
  // Every post with a wait time has a map pin, and the other way round.
  assert.deepEqual(
    WAIT_TIMES_BY_COUNTRY[from].map((w) => w.id).sort(),
    OFFICE_MAPS[from].offices.map((o) => o.id).sort(),
  );
}

const content = { STEPS, DOCUMENTS, DOC_FAQ };
const strings = JSON.stringify(content);
// UK replacements must match a content string exactly, or they silently stop working.
for (const key of Object.keys(HOME.GB.replace)) assert.ok(strings.includes(JSON.stringify(key)), `unused replace: ${key}`);
// No token is left over in any country.
for (const from of ["IN", "GB", "MX"]) assert.ok(!/\{(home|vac)\}/.test(JSON.stringify(localize(content, from))), from);
// India reads exactly as before the tokens.
const india = JSON.stringify(localize(content, "IN"));
assert.ok(india.includes("Then book your interview at a U.S. office in India."));
assert.ok(india.includes("भारत में आपके जीवन का प्रमाण"));
assert.ok(india.includes("You may also need to visit a [[vac|VAC]] first, for fingerprints."));
const mx = JSON.stringify(localize(content, "MX"));
assert.ok(mx.includes("[[vac|CAS]]") && mx.includes("https://mx.usembassy.gov/visas/") && !mx.includes("in.usembassy.gov"));
const gb = JSON.stringify(localize(content, "GB"));
assert.ok(gb.includes("Proof of your life in the United Kingdom") && !gb.includes("passportindia") && !gb.includes("[[vac|"));
console.log("home-country content checks passed");
