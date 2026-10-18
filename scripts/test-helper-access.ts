// Checks the caregiver token -> traveler folder logic. No database needed.
// Run: npx tsx scripts/test-helper-access.ts
import assert from "node:assert/strict";

// lib/db.ts throws without this; postgres() does not connect until a query runs.
process.env.DATABASE_URL ??= "postgres://check:check@127.0.0.1:1/none";

async function main() {
  const { getHelperJourneyOwner, isHelperToken, ownerFromRows } = await import("../lib/helperAccess");
  const { buildPathname, isOwnPathname, userPrefix } = await import("../lib/uploadsServer");

  const sub = "auth0|traveler";
  const other = "auth0|someone-else";

  // Valid, unrevoked link -> the traveler's own folder.
  const ok = ownerFromRows([{ user_id: sub, revoked_at: null }]);
  assert.deepEqual(ok, { ok: true, sub });
  if (ok.ok) assert.equal(userPrefix(ok.sub), userPrefix(sub));

  // Revoked or unknown token -> not found, same as a missing link.
  assert.deepEqual(ownerFromRows([{ user_id: sub, revoked_at: new Date() }]), { ok: false, error: "not_found" });
  assert.deepEqual(ownerFromRows([]), { ok: false, error: "not_found" });

  // Unclaimed anonymous journey -> clearly unavailable, no folder.
  assert.deepEqual(ownerFromRows([{ user_id: null, revoked_at: null }]), { ok: false, error: "unavailable" });
  assert.deepEqual(ownerFromRows([{ user_id: "", revoked_at: null }]), { ok: false, error: "unavailable" });

  // Malformed tokens never reach the database.
  assert.equal(isHelperToken("d5442294-1acf-43bd-a1ac-db4a0f4f647c"), true);
  for (const bad of ["", "abc", "../x", "d5442294-1acf-43bd-a1ac-db4a0f4f647c/..", "D5442294-1ACF-43BD-A1AC-DB4A0F4F647C'--", null, 42]) {
    assert.equal(isHelperToken(bad), false, String(bad));
    assert.deepEqual(await getHelperJourneyOwner(bad), { ok: false, error: "not_found" });
  }

  // Paths: only well-formed paths inside the traveler's folder pass.
  const mine = buildPathname(sub, "immigration", "passport.pdf", "passport");
  assert.equal(isOwnPathname(mine, sub), true);
  assert.equal(isOwnPathname(mine, other), false);
  const theirs = buildPathname(other, "immigration", "passport.pdf");
  assert.equal(isOwnPathname(theirs, sub), false);
  const prefix = userPrefix(sub);
  for (const escape of [
    `${prefix}immigration/../../${userPrefix(other).slice(2)}x`,
    `${prefix}../${userPrefix(other)}immigration/00000000-0000-0000-0000-000000000000/a.pdf`,
    `${prefix}immigration/00000000-0000-0000-0000-000000000000/../a.pdf`,
    `${prefix}secret/00000000-0000-0000-0000-000000000000/a.pdf`,
    `/${mine}`,
    prefix,
    null,
  ]) {
    assert.equal(isOwnPathname(escape, sub), false, String(escape));
  }

  console.log("helper access: all checks passed");
  process.exit(0);
}

void main();
