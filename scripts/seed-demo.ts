// Seeds the "Sharda Rao" demo profile for one Auth0 user, for the live demo.
// Run: npm run seed:demo   (reads DATABASE_URL and DEMO_USER_SUB from .env.local)
//
// SAFE ON THE SHARED TEAM DATABASE: every query is limited to the single
// user id in DEMO_USER_SUB (and that user's journey). It never deletes rows
// and never reads or changes any other user's journey or helper links. It
// does not call Auth0: create the demo user in the Auth0 dashboard, sign in
// once, and copy its user id ("auth0|…") into DEMO_USER_SUB.
//
// Running it again is safe: it refreshes the demo trip (arrival date, steps)
// on the same row and reuses the active helper link.
import crypto from "node:crypto";
import path from "node:path";
import dotenv from "dotenv";
import { addDays, ASSUMPTIONS, buildJourney, formatDate, STEPS_BY_PURPOSE, WAIT_TIMES_BY_COUNTRY } from "../lib/journey";
import { cleanProfile } from "../lib/tripProfile";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const DEMO_USER_SUB = process.env.DEMO_USER_SUB?.trim() ?? "";
if (!process.env.DATABASE_URL || !DEMO_USER_SUB) {
  console.error(
    "seed:demo needs DATABASE_URL and DEMO_USER_SUB in .env.local.\n" +
      "DEMO_USER_SUB is the demo user's Auth0 id (for example auth0|abc123): create the user in the\n" +
      "Auth0 dashboard, sign in once, then copy the id from Auth0 > User Management > Users.",
  );
  process.exit(1);
}

/** Extra days to spare on top of the On track line, so the demo stays On track for weeks. */
const EXTRA_SPARE_DAYS = 60;
const HELPER_LABEL = "Family Helper";

/** The demo trip, in exactly the shape the app saves (cleanProfile, as the server actions use). */
function demoProfile(today: string) {
  const waits = WAIT_TIMES_BY_COUNTRY.IN;
  // The earliest interview does not depend on the arrival date, so find it first...
  const probe = buildJourney({ today, arrival: addDays(today, 365), stayMonths: 3, waits });
  // ...then arrive late enough after it to be On track with room to spare.
  const afterInterview = ASSUMPTIONS.daysAfterInterviewForVisa + ASSUMPTIONS.daysBeforeArrivalBuffer;
  const arrival = addDays(probe.best.interviewDate, afterInterview + ASSUMPTIONS.tightSlackDays + EXTRA_SPARE_DAYS);

  const checked = cleanProfile(
    {
      from: "IN",
      fromCity: "New Delhi",
      homeAirport: "",
      to: "US",
      toCity: "New York",
      destAirport: "",
      arrival,
      stayMonths: 3,
      purpose: "family",
      firstName: "Sharda",
      lastName: "Rao",
    },
    today,
  );
  if (!checked.ok) throw new Error(`demo profile rejected: ${checked.error}`);

  const journey = buildJourney({ today, arrival, stayMonths: 3, visaType: "family", waits });
  if (journey.best.fit !== "onTrack") throw new Error(`demo plan is ${journey.best.fit}, expected onTrack`);
  return { profile: checked.profile, journey };
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const { profile, journey } = demoProfile(today);

  // Steps 1 and 2 done, step 3 current. Same values the Dashboard saves ("completed").
  const steps = STEPS_BY_PURPOSE.family;
  const stopStatus = { [steps[0]]: "completed", [steps[1]]: "completed" };
  const currentStop = 3;

  // lib/db.ts reads DATABASE_URL when it loads, so import it after the check above.
  const { default: sql } = await import("../lib/db");
  try {
    const { journeyId, token, createdLink } = await sql.begin(async (tx) => {
      // The app reads a user's most recent journey, so refresh that one (or start one).
      const existing = await tx`
        SELECT id FROM journeys WHERE user_id = ${DEMO_USER_SUB} ORDER BY updated_at DESC LIMIT 1
      `;
      let journeyId: string;
      if (existing.length > 0) {
        journeyId = existing[0].id;
        await tx`
          UPDATE journeys
          SET profile = ${tx.json(profile as never)},
              stop_status = ${tx.json(stopStatus)},
              current_stop = ${currentStop},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${journeyId} AND user_id = ${DEMO_USER_SUB}
        `;
      } else {
        const inserted = await tx`
          INSERT INTO journeys (user_id, current_stop, stop_status, profile)
          VALUES (${DEMO_USER_SUB}, ${currentStop}, ${tx.json(stopStatus)}, ${tx.json(profile as never)})
          RETURNING id
        `;
        journeyId = inserted[0].id;
      }

      // One active Family Helper link: reuse it, or make one like createHelperLink does.
      const active = await tx`
        SELECT token FROM journey_helpers
        WHERE journey_id = ${journeyId} AND revoked_at IS NULL
        ORDER BY token LIMIT 1
      `;
      if (active.length > 0) return { journeyId, token: active[0].token as string, createdLink: false };
      const token = crypto.randomUUID();
      await tx`INSERT INTO journey_helpers (journey_id, token, label) VALUES (${journeyId}, ${token}, ${HELPER_LABEL})`;
      return { journeyId, token, createdLink: true };
    });

    const best = journey.best;
    const site = (process.env.APP_BASE_URL ?? "").replace(/\/+$/, "");
    console.log("\nDemo profile seeded");
    console.log(`  User:          ${DEMO_USER_SUB}  (journey ${journeyId})`);
    console.log(`  Traveler:      ${profile.firstName} ${profile.lastName}, ${profile.fromCity} (${profile.homeAirport}) -> ${profile.toCity} (${profile.destAirport})`);
    console.log(`  Purpose/stay:  visit family, ${profile.stayMonths} months`);
    console.log(`  Arrival:       ${formatDate(profile.arrival, "en")} (${profile.arrival})`);
    console.log(`  Plan status:   ${best.fit}, ${best.slackDays} days to spare; earliest interview ${formatDate(best.interviewDate, "en")} at ${best.id}`);
    console.log(`  Steps:         ${steps[0]} and ${steps[1]} done, ${steps[2]} current (current_stop ${currentStop})`);
    console.log(`  Helper link:   ${createdLink ? "created" : "reused the active one"}`);
    console.log(`    http://localhost:3000/help/${token}`);
    if (site && !site.startsWith("http://localhost")) console.log(`    ${site}/help/${token}`);
    else console.log("    (APP_BASE_URL is not a deployed address; use your deployed site + /help/" + token + ")");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("seed:demo failed:", err);
  process.exit(1);
});
