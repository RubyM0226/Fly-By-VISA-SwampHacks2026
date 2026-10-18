"use server";

import { auth0 } from "@/lib/auth0";
import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cleanProfile, type JourneyProfile } from "@/lib/tripProfile";

export type { JourneyProfile };

export async function getUserJourney() {
  const session = await auth0.getSession();
  if (!session?.user) return null;

  try {
    const result = await sql`
      SELECT id, current_stop, stop_status, profile 
      FROM journeys 
      WHERE user_id = ${session.user.sub}
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Database read error:", error);
    return null;
  }
}

export async function updateJourneyProgress(newStop: number, stopId: string, status: string) {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const existing = await sql`SELECT id FROM journeys WHERE user_id = ${session.user.sub}`;
    
    if (existing.length === 0) {
      // Create their journey if they don't have one
      await sql`
        INSERT INTO journeys (user_id, current_stop, stop_status)
        VALUES (${session.user.sub}, ${newStop}, ${sql.json({ [stopId]: status })})
      `;
    } else {
      // Update their existing journey (the || operator merges the new JSON status safely)
      await sql`
        UPDATE journeys 
        SET current_stop = ${newStop},
            stop_status = stop_status || ${sql.json({ [stopId]: status })},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${session.user.sub}
      `;
    }
    
    revalidatePath("/location-map");
    return { success: true };
  } catch (error) {
    console.error("Database write error:", error);
    throw new Error("Failed to save progress");
  }
}

export async function createIntakeJourney(profileData: JourneyProfile) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub || null;

  try {
    if (userId) {
      const existing = await sql`SELECT id FROM journeys WHERE user_id = ${userId}`;
      if (existing.length > 0) {
        await sql`
          UPDATE journeys 
          SET current_stop = 1, 
              stop_status = '{}'::jsonb, 
              profile = ${sql.json(profileData)}, 
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `;
        return { success: true, id: existing[0].id };
      }
    }

    const result = await sql`
      INSERT INTO journeys (user_id, current_stop, stop_status, profile)
      VALUES (${userId}, 1, '{}'::jsonb, ${sql.json(profileData)})
      RETURNING id
    `;
    
    return { success: true, id: result[0].id };
  } catch (error) {
    console.error("Failed to create intake journey:", error);
    return { success: false, id: null };
  }
}

export async function claimAnonymousJourney(journeyId: string) {
  const session = await auth0.getSession();
  if (!session?.user) return { success: false };

  try {
    // Attach the pre-login anonymous journey to the newly logged-in Auth0 user ID
    await sql`
      UPDATE journeys 
      SET user_id = ${session.user.sub} 
      WHERE id = ${journeyId} AND user_id IS NULL
    `;
    return { success: true };
  } catch (error) {
    console.error("Failed to claim journey:", error);
    return { success: false };
  }
}
/**
 * Saves edited trip answers for a signed-in user. Changes only the profile:
 * current_stop and stop_status (their checked-off steps) are kept.
 */
export async function updateJourneyProfile(input: JourneyProfile) {
  const session = await auth0.getSession();
  if (!session?.user) return { ok: false as const, error: "signedOut" as const };

  // UTC date: the browser's "tomorrow" (its earliest choice) is never before it, in any time zone.
  const checked = cleanProfile(input, new Date().toISOString().slice(0, 10));
  if (!checked.ok) return checked;

  try {
    const updated = await sql`
      UPDATE journeys
      SET profile = ${sql.json(checked.profile)},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.user.sub}
      RETURNING id
    `;
    if (updated.length === 0) {
      // Signed in before finishing the intake: start their journey now.
      await sql`
        INSERT INTO journeys (user_id, current_stop, stop_status, profile)
        VALUES (${session.user.sub}, 1, '{}'::jsonb, ${sql.json(checked.profile)})
      `;
    }
    return { ok: true as const, profile: checked.profile };
  } catch (error) {
    console.error("Failed to update journey profile:", error);
    return { ok: false as const, error: "save" as const };
  }
}
