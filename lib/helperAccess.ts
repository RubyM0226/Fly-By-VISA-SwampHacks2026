import sql from "./db";

// Who owns the journey behind a caregiver's helper link. Server-only, and
// deliberately NOT in app/actions/helper.ts: every export of a "use server"
// file is callable from the browser, and this returns the traveler's Auth0 id.

export type HelperOwner = { ok: true; sub: string } | { ok: false; error: "not_found" | "unavailable" };

// Helper tokens are crypto.randomUUID(); anything else is not worth a query.
const TOKEN_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isHelperToken(token: unknown): token is string {
  return typeof token === "string" && TOKEN_SHAPE.test(token);
}

/** The decision, from the lookup rows. Revoked or missing look the same. */
export function ownerFromRows(rows: { user_id: string | null; revoked_at: unknown }[]): HelperOwner {
  const row = rows[0];
  if (!row || row.revoked_at) return { ok: false, error: "not_found" };
  // An anonymous journey nobody has claimed yet has no files folder.
  if (typeof row.user_id !== "string" || row.user_id.length === 0) return { ok: false, error: "unavailable" };
  return { ok: true, sub: row.user_id };
}

export async function getHelperJourneyOwner(token: unknown): Promise<HelperOwner> {
  if (!isHelperToken(token)) return { ok: false, error: "not_found" };
  const rows = await sql`
    SELECT j.user_id, h.revoked_at
    FROM journey_helpers h
    JOIN journeys j ON h.journey_id = j.id
    WHERE h.token = ${token}
    LIMIT 1
  `;
  return ownerFromRows(rows as unknown as { user_id: string | null; revoked_at: unknown }[]);
}
