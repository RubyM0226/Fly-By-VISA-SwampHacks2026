// Runs the journey engine for each home country and prints the best office and
// fit, then checks the home-country content. Run: npx tsx scripts/check-countries.ts
import assert from "node:assert/strict";
import { DOC_FAQ } from "../content/documentsFaq";
import { DOCUMENTS } from "../content/documents";
import { STEPS } from "../content/steps";
import { HOME, localize } from "../lib/homeCountry";
import { buildJourney, STEPS_BY_PURPOSE, WAIT_TIMES_BY_COUNTRY, type VisaCategory } from "../lib/journey";
import { OFFICE_MAPS } from "../lib/offices";

const input = { today: "2026-10-18", arrival: "2027-09-01", stayMonths: 2 };
for (const from of ["IN", "GB", "MX"] as const) {
  const seeds = WAIT_TIMES_BY_COUNTRY[from];
  // Every post with a wait time has a map pin, and the other way round.
  assert.deepEqual(seeds.map((w) => w.id).sort(), OFFICE_MAPS[from].offices.map((o) => o.id).sort());
  for (const visaType of ["family", "study", "work"] as VisaCategory[]) {
    const j = buildJourney({ ...input, visaType, waits: seeds });
    console.log(
      `${from} ${visaType}: best=${j.best.id} wait=${j.best.waitMonths} fit=${j.best.fit} interview=${j.best.interviewDate} slack=${j.best.slackDays}`,
    );
    // Only this country's posts, each with this purpose's wait; only this purpose's steps, in order.
    assert.deepEqual(j.posts.map((p) => p.id).sort(), seeds.map((w) => w.id).sort());
    for (const p of j.posts) assert.equal(p.waitMonths, seeds.find((w) => w.id === p.id)!.waitMonths[visaType]);
    assert.deepEqual(j.steps.map((st) => st.id), STEPS_BY_PURPOSE[visaType]);
    assert.equal(j.visaType, visaType);
  }
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
// Official place names stay in English inside Hindi sentences.
assert.ok(india.includes("India में आपके जीवन का प्रमाण"));
assert.ok(india.includes("You may also need to visit a [[vac|VAC]] first, for fingerprints."));
const mx = JSON.stringify(localize(content, "MX"));
assert.ok(mx.includes("[[vac|CAS]]") && mx.includes("https://mx.usembassy.gov/visas/") && !mx.includes("in.usembassy.gov"));
const gb = JSON.stringify(localize(content, "GB"));
assert.ok(gb.includes("Proof of your life in the United Kingdom") && !gb.includes("passportindia") && !gb.includes("[[vac|"));
console.log("home-country content checks passed");
