// Checks the caregiver data path: a valid token shares the journey, a revoked
// or unknown one shares nothing, and a journey with no name still builds a
// trip. Fakes the database. Run: npx tsx scripts/test-helper-view.ts
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://check:check@127.0.0.1:1/none";

// lib/db.ts reuses globalThis.sql when set, so this fake stands in for postgres.
let rows: unknown[] = [];
const fakeSql = Object.assign(async () => rows, { json: (v: unknown) => v });
(globalThis as unknown as { sql: unknown }).sql = fakeSql;

async function main() {
  const { getJourneyByHelperToken } = await import("../app/actions/helper");
  const { sharedTrip, travelerName } = await import("../lib/helperView");
  const { DICTIONARY, format } = await import("../lib/i18n");

  const token = "d5442294-1acf-43bd-a1ac-db4a0f4f647c";
  const profile = {
    from: "IN",
    fromCity: "Mumbai",
    homeAirport: "BOM",
    to: "US",
    toCity: "Chicago",
    destAirport: "ORD",
    arrival: "2027-06-01",
    stayMonths: 2,
    purpose: "family" as const,
    firstName: "Asha",
    lastName: "Rao",
  };

  // Valid link: the profile and checked-off steps come back.
  rows = [{ stop_status: { ready: "completed", ds160: "pending", book: true }, profile, revoked_at: null, label: "Family Helper" }];
  const ok = await getJourneyByHelperToken(token);
  assert.equal(ok.valid, true);
  assert.ok(ok.journey);
  const trip = sharedTrip({ profile: ok.journey.profile, stop_status: ok.journey.stop_status });
  assert.equal(trip.homeCity, "Mumbai");
  assert.equal(trip.destAirport, "ORD");
  // "pending" must not count as done (the old value was a truthy string).
  assert.deepEqual(trip.done, { ready: true, ds160: false, book: true });
  assert.equal(travelerName(ok.journey.profile), "Asha Rao");
  assert.equal(trip.selectedFlight, null, "never this browser's own flight");

  // Revoked link: nothing shared, same as a missing one.
  rows = [{ stop_status: {}, profile, revoked_at: new Date(), label: "Family Helper" }];
  assert.deepEqual(await getJourneyByHelperToken(token), { valid: false, journey: null, label: null });
  rows = [];
  assert.deepEqual(await getJourneyByHelperToken(token), { valid: false, journey: null, label: null });
  assert.deepEqual(await getJourneyByHelperToken(""), { valid: false, journey: null, label: null });

  // No name: the title falls back to "Travel profile".
  const noName = { ...profile, firstName: "", lastName: undefined };
  assert.equal(travelerName(noName), "");
  assert.equal(travelerName(null), "");
  assert.equal(sharedTrip({ profile: noName, stop_status: null }).firstName, "");
  assert.equal(format(DICTIONARY.en["helper.title"], { name: "Asha Rao" }), "Asha Rao's travel profile");
  assert.equal(DICTIONARY.en["helper.titlePlain"], "Travel profile");

  console.log("helper view checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
