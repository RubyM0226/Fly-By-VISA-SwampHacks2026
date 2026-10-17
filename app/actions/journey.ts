"use server";

import { auth0 } from "@/lib/auth0";
import sql from "@/lib/db";
import { revalidatePath } from "next/cache";

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

export async function createIntakeJourney(profileData: Parameters<typeof sql.json>[0]) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub || null;

  try {
    if (userId) {
      // If they are already signed in, check if they have a journey we can overwrite
      const existing = await sql`SELECT id FROM journeys WHERE user_id = ${userId}`;
      if (existing.length > 0) {
        // Reset their progress and store the new profile
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

    // Insert a brand new journey (anonymous or new user) with profile data
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