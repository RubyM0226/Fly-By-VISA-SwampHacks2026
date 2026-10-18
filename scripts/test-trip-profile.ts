// Checks the trip-answer validation and the saved-profile mapping. No database needed.
// Run: npx tsx scripts/test-trip-profile.ts
import assert from "node:assert/strict";
import { cleanProfile, tripFromProfile } from "../lib/tripProfile";

const today = "2026-10-18";
import type { VisaPurpose } from "../lib/tripProfile";

const good = {
  from: "IN",
  fromCity: "Mumbai",
  homeAirport: "XXX",
  to: "US",
  toCity: "Seattle",
  destAirport: "",
  arrival: "2026-10-28",
  stayMonths: 3,
  purpose: "family" as VisaPurpose,
};

// Valid: airports come from the city list, not the browser.
const ok = cleanProfile(good, today);
assert.deepEqual(ok, { ok: true, profile: { ...good, homeAirport: "BOM", destAirport: "SEA", purpose: "family" } });

// Valid purpose variations (family, study, work)
for (const p of ["family", "study", "work"] as const) {
  const result = cleanProfile({ ...good, purpose: p }, today);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.profile.purpose, p);
  }
}

// Coming-soon countries, unknown cities, a city from the other country: rejected.
for (const bad of [
  { from: "GB" },
  { to: "CA" },
  { from: "US", to: "IN" },
  { fromCity: "Paris" },
  { toCity: "Mumbai" },
  { stayMonths: 0 },
  { stayMonths: 7 },
  { stayMonths: "3" },
  { purpose: "tourism" }, // Invalid purpose category
  { arrival: "" },
  { arrival: "2026-02-30" },
  { arrival: "2026-13-01" },
  { arrival: "28/10/2026" },
]) {
  assert.deepEqual(cleanProfile({ ...good, ...bad }, today), { ok: false, error: "invalid" }, JSON.stringify(bad));
}
assert.deepEqual(cleanProfile(null, today), { ok: false, error: "invalid" });
assert.deepEqual(cleanProfile({ ...good, arrival: "2026-10-16" }, today), { ok: false, error: "pastDate" });
assert.equal(cleanProfile({ ...good, arrival: today }, today).ok, true);

// Saved rows: new keys (fromCity/toCity) and old keys (homeCity/destCity) both restore.
assert.equal(tripFromProfile(good).homeCity, "Mumbai");
assert.equal(tripFromProfile(good).destCity, "Seattle");
assert.equal(tripFromProfile({ homeCity: "Chennai", destCity: "Chicago" }).homeCity, "Chennai");
assert.equal(tripFromProfile({ homeCity: "Chennai", destCity: "Chicago" }).destCity, "Chicago");
assert.deepEqual(tripFromProfile(null), {
  from: "IN",
  homeCity: "New Delhi",
  homeAirport: "DEL",
  to: "US",
  destCity: "New York",
  destAirport: "JFK",
  arrival: "",
  stayMonths: 1,
  purpose: "family",
  firstName: "",
  lastName: "",
});

console.log("trip profile checks passed");