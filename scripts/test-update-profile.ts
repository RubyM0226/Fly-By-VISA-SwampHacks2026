// Checks that saving Trip details (updateJourneyProfile) writes the profile,
// names included, and never touches current_stop or stop_status.
// Fakes the database and the Auth0 session. Run: npx tsx scripts/test-update-profile.ts
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://check:check@127.0.0.1:1/none";

// lib/db.ts reuses globalThis.sql when set, so this fake stands in for postgres.
const queries: { text: string; values: unknown[] }[] = [];
let updateRows: unknown[] = [{ id: 1 }];
const fakeSql = Object.assign(
  async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join("?");
    queries.push({ text, values });
    return /^\s*UPDATE/.test(text) ? updateRows : [];
  },
  { json: (v: unknown) => v },
);
(globalThis as unknown as { sql: unknown }).sql = fakeSql;

async function main() {
  const { auth0 } = await import("../lib/auth0");
  (auth0 as unknown as { getSession: () => Promise<unknown> }).getSession = async () => ({ user: { sub: "auth0|me" } });
  const { updateJourneyProfile } = await import("../app/actions/journey");

  const input = {
    from: "IN",
    fromCity: "Mumbai",
    homeAirport: "",
    to: "US",
    toCity: "Orlando",
    destAirport: "",
    arrival: "2099-01-15",
    stayMonths: 2,
    purpose: "family" as const,
    firstName: "  Asha ",
    lastName: "Rao",
  };

  // Existing journey: one UPDATE that sets only profile and updated_at.
  const res = await updateJourneyProfile(input);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.profile.firstName, "Asha");
    assert.equal(res.profile.lastName, "Rao");
    assert.equal(res.profile.destAirport, "MCO");
  }
  assert.equal(queries.length, 1);
  const [update] = queries;
  assert.match(update.text, /^\s*UPDATE journeys\s+SET profile = \?,\s+updated_at = CURRENT_TIMESTAMP\s+WHERE user_id = \?/);
  assert.doesNotMatch(update.text, /current_stop|stop_status/);
  assert.deepEqual(update.values[1], "auth0|me");
  assert.equal((update.values[0] as { firstName: string }).firstName, "Asha");

  // Names are capped at 80 characters.
  queries.length = 0;
  const long = await updateJourneyProfile({ ...input, firstName: "x".repeat(500) });
  assert.equal(long.ok && long.profile.firstName?.length, 80);

  // No journey yet: the INSERT starts a fresh one (nothing to keep).
  queries.length = 0;
  updateRows = [];
  assert.equal((await updateJourneyProfile(input)).ok, true);
  assert.equal(queries.length, 2);
  assert.match(queries[1].text, /INSERT INTO journeys/);

  // Bad input never reaches the database.
  queries.length = 0;
  assert.deepEqual(await updateJourneyProfile({ ...input, toCity: "Paris" }), { ok: false, error: "invalid" });
  assert.equal(queries.length, 0);

  console.log("updateJourneyProfile: profile saved, current_stop and stop_status untouched");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
